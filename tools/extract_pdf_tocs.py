# -*- coding: utf-8 -*-
"""Extract bookmark TOCs directly from the textbook PDFs."""
import fitz  # PyMuPDF
import json, os

BASE = r"D:\ASCP\GENETICS PHD"
PDFS = {
    "emery": "Emery_s-Elements-of-Medical-Genetics.pdf",
    "hmg5": "Human-Molecular-Genetics-5th-Edition-Strachan.pdf",
    "strachan_ggm": "Genetics-and-Genomics-in-Medicine-Second-Edition-strachan.pdf",
    "brown": "Gene-Cloning-and-DNA-Analysis-BROWN.pdf",
    "harper": "Biochemistry2022-HARPER.pdf",
}
OUT = os.path.join(BASE, "exam-bank", "content", "syllabus")
os.makedirs(OUT, exist_ok=True)

for key, fname in PDFS.items():
    path = os.path.join(BASE, fname)
    if not os.path.exists(path):
        print(f"[MISSING] {fname}")
        continue
    try:
        doc = fitz.open(path)
        toc = doc.get_toc(simple=True)  # [[level, title, page], ...]
        doc.close()
        with open(os.path.join(OUT, f"pdf_toc_{key}.json"), "w", encoding="utf-8") as f:
            json.dump(toc, f, ensure_ascii=False, indent=1)
        print(f"=== {key}: {len(toc)} bookmarks")
        for lvl, title, page in toc:
            if lvl <= 1:
                print("   ", "  " * (lvl - 1) + title[:100])
    except Exception as e:
        print(f"[ERROR] {key}: {e}")
