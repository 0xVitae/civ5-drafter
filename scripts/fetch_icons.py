#!/usr/bin/env python3
"""Fetch Civ 5 civilization icons from civilization.fandom.com.

For each civ, tries a list of candidate filenames (demonyms vary by civ),
resolves via the MediaWiki API, and downloads to icons/<slug>.png.
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Civ5Drafter/0.1"
API = "https://civilization.fandom.com/api.php"

# slug -> candidate filename stems (without "_(Civ5).png")
CIVS = {
    "america":     ["American"],
    "arabia":      ["Arabian"],
    "assyria":     ["Assyrian"],
    "austria":     ["Austrian"],
    "aztec":       ["Aztec"],
    "babylon":     ["Babylonian"],
    "brazil":      ["Brazilian"],
    "byzantium":   ["Byzantine"],
    "carthage":    ["Carthaginian"],
    "celts":       ["Celtic", "Celts"],
    "china":       ["Chinese"],
    "denmark":     ["Danish"],
    "egypt":       ["Egyptian"],
    "england":     ["English"],
    "ethiopia":    ["Ethiopian"],
    "france":      ["French"],
    "germany":     ["German"],
    "greece":      ["Greek"],
    "huns":        ["Hunnic", "Hun", "Huns"],
    "inca":        ["Incan", "Inca"],
    "india":       ["Indian"],
    "indonesia":   ["Indonesian"],
    "iroquois":    ["Iroquois"],
    "japan":       ["Japanese"],
    "korea":       ["Korean"],
    "maya":        ["Mayan", "Maya"],
    "mongolia":    ["Mongolian", "Mongol"],
    "morocco":     ["Moroccan"],
    "netherlands": ["Dutch"],
    "ottomans":    ["Ottoman"],
    "persia":      ["Persian"],
    "poland":      ["Polish"],
    "polynesia":   ["Polynesian"],
    "portugal":    ["Portuguese"],
    "rome":        ["Roman"],
    "russia":      ["Russian"],
    "shoshone":    ["Shoshone"],
    "siam":        ["Siamese"],
    "songhai":     ["Songhai"],
    "spain":       ["Spanish"],
    "sweden":      ["Swedish"],
    "venice":      ["Venetian"],
    "zulu":        ["Zulu"],
}


def http_get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read()


def get_image_url(filename):
    """Returns the direct image URL for a wiki File:<filename>, or None if missing."""
    params = urllib.parse.urlencode({
        "action": "query",
        "prop": "imageinfo",
        "iiprop": "url",
        "format": "json",
        "titles": f"File:{filename}",
    })
    data = json.loads(http_get(f"{API}?{params}").decode("utf-8"))
    pages = data.get("query", {}).get("pages", {})
    for _, page in pages.items():
        if "missing" in page:
            return None
        info = page.get("imageinfo") or []
        if info:
            return info[0]["url"]
    return None


def fetch_civ(slug, stems):
    out_path = os.path.join("icons", f"{slug}.png")
    if os.path.exists(out_path) and os.path.getsize(out_path) > 0:
        return ("skip", slug, out_path)
    for stem in stems:
        filename = f"{stem}_(Civ5).png"
        try:
            url = get_image_url(filename)
        except Exception as e:
            return ("error", slug, str(e))
        if url:
            try:
                content = http_get(url)
            except Exception as e:
                return ("error", slug, str(e))
            with open(out_path, "wb") as f:
                f.write(content)
            return ("ok", slug, filename)
    return ("missing", slug, ", ".join(stems))


def main():
    os.makedirs("icons", exist_ok=True)
    failures = []
    for slug, stems in CIVS.items():
        status, _, detail = fetch_civ(slug, stems)
        print(f"  [{status:7}] {slug:13} {detail}")
        if status in ("error", "missing"):
            failures.append((slug, detail))
        time.sleep(0.1)
    print()
    if failures:
        print(f"FAILED: {len(failures)}/{len(CIVS)}")
        for slug, detail in failures:
            print(f"  - {slug}: {detail}")
        sys.exit(1)
    print(f"All {len(CIVS)} icons downloaded.")


if __name__ == "__main__":
    main()
