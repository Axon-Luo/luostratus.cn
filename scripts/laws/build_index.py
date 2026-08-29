"""Build family-grouped index and sharded full-text search index."""

import json
import re
import sys
import time
from pathlib import Path

STATUS_NAMES = {1: "已废止", 2: "已修改", 3: "有效", 4: "尚未生效"}
CAT_NAMES = {
    100: "宪法", 102: "法律", 110: "宪法相关法", 120: "民法商法",
    130: "行政法", 140: "经济法", 150: "社会法", 155: "生态环境法",
    160: "刑法", 170: "诉讼与非诉讼程序法", 180: "法律解释",
}


def normalize_title(t):
    return re.sub(r"\s+", "", t or "")


def cjk_tokens(text, maxlen=24):
    out = set()
    buf = []
    for ch in text:
        if "\u4e00" <= ch <= "\u9fff":
            buf.append(ch)
        else:
            if buf:
                s = "".join(buf)
                for i in range(len(s) - 1):
                    out.add(s[i : i + 2])
                if len(s) == 1:
                    out.add(s)
                buf = []
            if ch.isascii() and (ch.isalnum()):
                buf.append(ch.lower())
            elif buf and buf[-1].isascii():
                w = "".join(buf)
                out.add(w[:maxlen])
                buf = []
    if buf:
        s = "".join(buf)
        if s[0].isascii():
            out.add(s[:maxlen])
        else:
            for i in range(len(s) - 1):
                out.add(s[i : i + 2])
            if len(s) == 1:
                out.add(s)
    return out


def main():
    root = Path(__file__).resolve().parent.parent.parent
    work = root / ".laws-work"
    static = root / "static" / "laws"
    data_dir = static / "data"
    search_dir = static / "search"
    search_dir.mkdir(parents=True, exist_ok=True)

    rows = json.loads((work / "list.json").read_text(encoding="utf-8"))["rows"]
    rows.sort(key=lambda r: (r.get("gbrq") or "", r.get("sxrq") or ""))

    families = {}
    for r in rows:
        fam = normalize_title(r["title"])
        families.setdefault(fam, []).append(r)

    fam_list = []
    fam_id_of = {}
    for idx, (fam, versions) in enumerate(sorted(families.items())):
        fid = f"f{idx:04d}"
        fam_id_of[fam] = fid
        versions.sort(key=lambda r: (r.get("gbrq") or "", r.get("sxx") or 0))
        vs = []
        for r in versions:
            vs.append({
                "b": r["bbbs"], "s": r.get("sxx"), "g": r.get("gbrq"),
                "x": r.get("sxrq"), "o": r.get("zdjgName"),
            })
        # category = most recent version's code (usually stable across versions)
        cat = versions[-1].get("flfgCodeId")
        latest = vs[-1]
        fam_list.append({
            "id": fid, "t": versions[0]["title"], "c": cat, "v": vs,
            "lb": latest["b"], "ls": latest["s"], "lg": latest["g"], "lx": latest["x"],
        })

    index = {
        "generated": time.strftime("%Y-%m-%d"),
        "cats": CAT_NAMES,
        "status": STATUS_NAMES,
        "families": fam_list,
    }
    (static / "index.json").write_text(
        json.dumps(index, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"families: {len(fam_list)} (laws: {len(rows)})")

    # search shards
    shards = {}
    missing = []
    for r in rows:
        path = data_dir / f"{r['bbbs']}.json"
        if not path.exists():
            missing.append(r["bbbs"])
            continue
        law = json.loads(path.read_text(encoding="utf-8"))
        fam = normalize_title(r["title"])
        fid = fam_id_of[fam]
        vidx = next(
            (i for i, v in enumerate(
                next(f for f in fam_list if f["id"] == fid)["v"]) if v["b"] == r["bbbs"]),
            0,
        )
        cat = r.get("flfgCodeId") or 0
        shard = shards.setdefault(cat, [])
        for blk in law.get("blocks", []):
            if blk["t"] not in ("art", "p"):
                continue
            text = blk.get("x", "")
            if len(text) < 6:
                continue
            label = blk.get("l") or ""
            doc = {
                "b": r["bbbs"], "f": fid, "v": vidx,
                "a": label, "s": text[:80],
            }
            shard.append((doc, cjk_tokens(label + " " + text)))

    total_docs = 0
    for cat, docs in sorted(shards.items()):
        inv = {}
        for di, (_, toks) in enumerate(docs):
            for tok in toks:
                inv.setdefault(tok, []).append(di)
        payload = {
            "c": cat,
            "d": [d for d, _ in docs],
            "i": inv,
        }
        out = search_dir / f"cat-{cat}.json"
        out.write_text(
            json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        total_docs += len(docs)
        print(f"shard cat-{cat}: {len(docs)} docs, {out.stat().st_size/1024:.0f} KB")

    print(f"total searchable docs: {total_docs}; missing law files: {len(missing)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
