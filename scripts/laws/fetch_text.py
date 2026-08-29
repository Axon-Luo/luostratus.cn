"""Download docx for every catalogued law and convert to per-law JSON."""

import json
import re
import sys
import time
import urllib.request
from pathlib import Path

from docx import Document

BASE = "https://flk.npc.gov.cn"
DELAY = 0.6
ATTEMPTS = 3

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    "Referer": "https://flk.npc.gov.cn/index",
    "Accept": "application/json",
}

ART_RE = re.compile(r"^第[一二三四五六七八九十百千零〇0-9]+条")
H_RE = re.compile(r"^(第[一二三四五六七八九十百千零〇0-9]+(编|章|节))(?!条)\s*(.*)")


def http_json(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=40) as resp:
        return json.loads(resp.read().decode("utf-8"))


def http_download(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": HEADERS["User-Agent"]})
    with urllib.request.urlopen(req, timeout=90) as resp, open(dest, "wb") as f:
        f.write(resp.read())


def get_docx(row, docx_dir):
    bbbs = row["bbbs"]
    dest = docx_dir / f"{bbbs}.docx"
    if dest.exists() and dest.stat().st_size > 1000:
        return dest
    info = http_json(
        f"{BASE}/law-search/download/pc?format=docx&bbbs={bbbs}&fileId="
    )
    if info.get("code") != 200 or not info.get("data", {}).get("url"):
        raise RuntimeError(f"download/pc failed: {info.get('msg')}")
    http_download(info["data"]["url"], dest)
    return dest


def parse_docx(path):
    doc = Document(str(path))
    blocks = []
    art_no = 0
    for p in doc.paragraphs:
        text = p.text.strip()
        if not text:
            continue
        m = H_RE.match(text)
        if m and len(text) < 40:
            unit = m.group(2)
            level = {"编": "h1", "章": "h2", "节": "h3"}[unit]
            blocks.append({"t": level, "x": text})
            continue
        if ART_RE.match(text):
            art_no += 1
            label = text.split("　")[0].split(" ")[0]
            if len(label) > 8:
                label = ART_RE.match(text).group(0)
            blocks.append({"t": "art", "n": art_no, "l": label, "x": text})
            continue
        blocks.append({"t": "p", "x": text})
    return blocks


def main():
    root = Path(__file__).resolve().parent.parent.parent
    work = root / ".laws-work"
    docx_dir = work / "docx"
    docx_dir.mkdir(parents=True, exist_ok=True)
    data_dir = root / "static" / "laws" / "data"
    data_dir.mkdir(parents=True, exist_ok=True)

    rows = json.loads((work / "list.json").read_text(encoding="utf-8"))["rows"]
    print(f"catalog: {len(rows)} laws", flush=True)

    failures = []
    done = 0
    for i, row in enumerate(rows, 1):
        bbbs = row["bbbs"]
        out = data_dir / f"{bbbs}.json"
        if out.exists() and out.stat().st_size > 200:
            done += 1
            continue
        ok = False
        last_err = None
        for attempt in range(1, ATTEMPTS + 1):
            try:
                docx_path = get_docx(row, docx_dir)
                blocks = parse_docx(docx_path)
                if not blocks:
                    raise RuntimeError("empty blocks")
                payload = {
                    "b": bbbs,
                    "t": row["title"],
                    "m": {
                        "g": row.get("gbrq"),
                        "x": row.get("sxrq"),
                        "s": row.get("sxx"),
                        "o": row.get("zdjgName"),
                        "c": row.get("flfgCodeId"),
                        "z": row.get("zdjgCodeId"),
                        "f": row.get("flxz"),
                    },
                    "blocks": blocks,
                }
                out.write_text(
                    json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
                    encoding="utf-8",
                )
                ok = True
                break
            except Exception as exc:  # noqa: BLE001
                last_err = str(exc)[:200]
                time.sleep(2.0 * attempt)
        if ok:
            done += 1
        else:
            failures.append({"bbbs": bbbs, "title": row["title"], "err": last_err})
        if i % 25 == 0:
            print(f"[{i}/{len(rows)}] done={done} fail={len(failures)}", flush=True)
        time.sleep(DELAY)

    (work / "failures.json").write_text(
        json.dumps(failures, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    print(f"FINISHED done={done}/{len(rows)} failures={len(failures)}", flush=True)
    for f in failures[:20]:
        print(f"  FAIL {f['title']}: {f['err']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
