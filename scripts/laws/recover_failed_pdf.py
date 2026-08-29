"""Recover failed DOCX records by using the official PDF rendering."""

import json
import sys
import urllib.request
from pathlib import Path

import pdfplumber

BASE = "https://flk.npc.gov.cn"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    "Referer": "https://flk.npc.gov.cn/index",
    "Accept": "application/json",
}


def get_pdf_url(bbbs):
    req = urllib.request.Request(
        f"{BASE}/law-search/download/pc?format=pdf&bbbs={bbbs}&fileId=",
        headers=HEADERS,
    )
    with urllib.request.urlopen(req, timeout=40) as resp:
        info = json.loads(resp.read().decode("utf-8"))
    if info.get("code") != 200 or not info.get("data", {}).get("url"):
        raise RuntimeError(f"PDF download metadata failed: {info.get('msg')}")
    return info["data"]["url"]


def download_pdf(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": HEADERS["User-Agent"]})
    with urllib.request.urlopen(req, timeout=90) as resp, open(dest, "wb") as f:
        f.write(resp.read())


def parse_pdf(path):
    blocks = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            for line in text.splitlines():
                line = line.strip()
                if line:
                    blocks.append({"t": "p", "x": line})
    return blocks


def main():
    root = Path(__file__).resolve().parent.parent.parent
    work = root / ".laws-work"
    rows = json.loads((work / "list.json").read_text(encoding="utf-8"))["rows"]
    failures = json.loads((work / "failures.json").read_text(encoding="utf-8"))
    row_by_id = {r["bbbs"]: r for r in rows}
    data_dir = root / "static" / "laws" / "data"
    pdf_dir = work / "pdf"
    pdf_dir.mkdir(parents=True, exist_ok=True)

    remaining = []
    recovered = []
    for failure in failures:
        row = row_by_id[failure["bbbs"]]
        try:
            pdf_path = pdf_dir / f"{row['bbbs']}.pdf"
            download_pdf(get_pdf_url(row["bbbs"]), pdf_path)
            blocks = parse_pdf(pdf_path)
            if not blocks:
                raise RuntimeError("PDF contains no text")
            payload = {
                "b": row["bbbs"],
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
            out = data_dir / f"{row['bbbs']}.json"
            out.write_text(
                json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
                encoding="utf-8",
            )
            recovered.append(row["bbbs"])
            print(f"RECOVERED {row['title']}: {len(blocks)} blocks")
        except Exception as exc:  # noqa: BLE001
            remaining.append({**failure, "err": str(exc)[:200]})
            print(f"STILL FAILED {row['title']}: {exc}")

    (work / "failures.json").write_text(
        json.dumps(remaining, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    (work / "recoveries.json").write_text(
        json.dumps(recovered, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
