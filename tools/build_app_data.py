# -*- coding: utf-8 -*-
"""Merge all content JSONs into a single bank.json for the PWA app."""
import json, os, glob

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(BASE, "content")
OUT = os.path.join(BASE, "app", "data", "bank.json")

bank = {"version": "1.0.0", "generated": "2026-10-22", "books": [], "emery_bank": [], "english": []}

BOOK_ORDER = ["emery", "hmg5", "strachan_ggm", "brown", "harper"]
for bid in BOOK_ORDER:
    p = os.path.join(CONTENT, "syllabus", f"syllabus_{bid}.json")
    if os.path.exists(p):
        with open(p, encoding="utf-8") as f:
            bank["books"].append(json.load(f))

for p in sorted(glob.glob(os.path.join(CONTENT, "emery", "ch*.json"))):
    with open(p, encoding="utf-8") as f:
        bank["emery_bank"].append(json.load(f))

for p in sorted(glob.glob(os.path.join(CONTENT, "english", "readings_part*.json"))):
    with open(p, encoding="utf-8") as f:
        bank["english"].append(json.load(f))

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(bank, f, ensure_ascii=False)
print("bank.json:", os.path.getsize(OUT)//1024, "KB |",
      "books:", len(bank["books"]), "| emery chapters:", len(bank["emery_bank"]),
      "| english parts:", len(bank["english"]))
