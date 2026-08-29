"""Cross-check catalog, extracted files and produce a report."""

import json
import sys
from pathlib import Path


def main():
    root = Path(__file__).resolve().parent.parent.parent
    work = root / ".laws-work"
    static = root / "static" / "laws"
    data_dir = static / "data"

    cat = json.loads((work / "list.json").read_text(encoding="utf-8"))
    rows = cat["rows"]
    failures = json.loads((work / "failures.json").read_text(encoding="utf-8")) \
        if (work / "failures.json").exists() else []
    fail_ids = {
        f["bbbs"] for f in failures
        if not (data_dir / f"{f['bbbs']}.json").exists()
    }

    files = sorted(data_dir.glob("*.json"))
    file_ids = {p.stem for p in files}
    expected = {r["bbbs"] for r in rows}

    empty = []
    no_dates = []
    for p in files:
        law = json.loads(p.read_text(encoding="utf-8"))
        if not law.get("blocks"):
            empty.append(p.stem)
        if not law.get("m", {}).get("g") or not law.get("m", {}).get("x"):
            no_dates.append(p.stem)

    lines = []
    lines.append(f"catalog api total: {cat.get('total')}, rows fetched: {len(rows)}")
    lines.append(f"data files: {len(files)}")
    lines.append(f"unresolved failures: {len(fail_ids)}")
    lines.append(f"empty-text files: {len(empty)}")
    lines.append(f"files missing dates: {len(no_dates)}")
    missing = expected - file_ids - fail_ids
    extra = file_ids - expected
    lines.append(f"missing (not failed, not extracted): {len(missing)}")
    lines.append(f"extra files: {len(extra)}")
    ok = len(missing) == 0 and len(extra) == 0 and not empty
    lines.append(f"RESULT: {'PASS' if ok else 'CHECK NEEDED'}")
    for f in failures[:30]:
        if f["bbbs"] in fail_ids:
            lines.append(f"  failure: {f['title']} — {f['err']}")
    report = "\n".join(lines)
    print(report)
    (work / "report.txt").write_text(report + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
