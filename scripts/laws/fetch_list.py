"""Fetch the law catalog from flk.npc.gov.cn search API.

Scope: constitution (100) + core laws subtree (102/110..170) + legal
interpretations (180); every validity status (1..4).
"""

import json
import sys
import time
import urllib.request
from pathlib import Path

BASE = "https://flk.npc.gov.cn"
CATEGORIES = [100, 102, 110, 120, 130, 140, 150, 155, 160, 170, 180]
STATUSES = [1, 2, 3, 4]
PAGE_SIZE = 50

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    "Referer": "https://flk.npc.gov.cn/index",
    "Content-Type": "application/json",
    "Accept": "application/json",
}


def post_list(page):
    payload = {
        "pageNum": page,
        "pageSize": PAGE_SIZE,
        "searchRange": 1,
        "searchType": 2,
        "searchContent": "",
        "sxx": STATUSES,
        "flfgCodeId": CATEGORIES,
        "gbrq": [],
        "sxrq": [],
        "gbrqYear": [],
        "zdjgCodeId": [],
    }
    req = urllib.request.Request(
        f"{BASE}/law-search/search/list",
        data=json.dumps(payload).encode("utf-8"),
        headers=HEADERS,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    if body.get("code") != 200:
        raise RuntimeError(f"list api code={body.get('code')} msg={body.get('msg')}")
    return body


def main():
    work = Path(__file__).resolve().parent.parent.parent / ".laws-work"
    work.mkdir(exist_ok=True)
    rows = []
    page = 1
    total = None
    while True:
        body = post_list(page)
        total = body.get("total", total)
        chunk = body.get("rows") or []
        rows.extend(chunk)
        print(f"page {page}: +{len(chunk)} (cum {len(rows)}/{total})", flush=True)
        if not chunk or len(rows) >= total:
            break
        page += 1
        time.sleep(1.0)

    # de-dupe by bbbs (list API should not dupe, but be safe)
    seen = {}
    for r in rows:
        seen[r["bbbs"]] = r
    rows = list(seen.values())

    out = {
        "fetched_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total": total,
        "rows": rows,
    }
    (work / "list.json").write_text(
        json.dumps(out, ensure_ascii=False), encoding="utf-8"
    )

    stats = {}
    for r in rows:
        key = (r.get("flxz"), r.get("sxx"))
        stats[key] = stats.get(key, 0) + 1
    print(f"saved {len(rows)} rows (api total={total})")
    for (flxz, sxx), n in sorted(stats.items()):
        print(f"  {flxz} sxx={sxx}: {n}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
