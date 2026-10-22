# -*- coding: utf-8 -*-
"""Extract unique chapter + section lists from existing chunk JSON files."""
import json, os, re, collections

BASE = r"D:\ASCP\GENETICS PHD"
FILES = {
    "emery": "genetics_chunks.json",
    "brown": "brown_chunks.json",
    "strachan_ggm": "strachan_chunks.json",
    "hmg5": "hmg5_chunks.json",
}

def norm(ch):
    ch = re.sub(r"\s+", " ", str(ch)).strip()
    return ch

for key, fname in FILES.items():
    path = os.path.join(BASE, fname)
    if not os.path.exists(path):
        print(f"[MISSING] {path}")
        continue
    with open(path, encoding="utf-8") as f:
        chunks = json.load(f)
    # chapters in order of appearance
    chapters = []
    sections_by_ch = collections.OrderedDict()
    for c in chunks:
        ch = norm(c.get("chapter"))
        if not ch:
            continue
        if ch not in sections_by_ch:
            sections_by_ch[ch] = []
            chapters.append(ch)
        sec = norm(c.get("section_title"))
        if sec and sec not in sections_by_ch[ch]:
            sections_by_ch[ch].append(sec)
    out = os.path.join(BASE, "exam-bank", "content", "syllabus", f"toc_{key}.json")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump({ch: sections_by_ch[ch] for ch in chapters}, f, ensure_ascii=False, indent=1)
    print(f"=== {key}: {len(chapters)} chapters -> {out}")
    for ch in chapters:
        print("  *", ch[:110])
