# -*- coding: utf-8 -*-
"""
ساخت PDF فارسی راست‌به‌چپ بانک سوالات پیش‌بینی آزمون دکتری ژنتیک پزشکی
Pipeline: content JSONs -> RTL HTML (Vazirmatn) -> PDF via headless Edge/Chrome
"""
import json, os, glob, html, subprocess, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(BASE, "content")
OUT_HTML = os.path.join(BASE, "Genetics-PhD-Exam-Bank.html")
OUT_PDF = os.path.join(BASE, "Genetics-PhD-Exam-Bank.pdf")

STARS = {1: "★", 2: "★★", 3: "★★★", 4: "★★★★", 5: "★★★★★"}
BOOK_ORDER = ["emery", "hmg5", "strachan_ggm", "brown", "harper"]
BOOK_FA = {
    "emery": "ژنتیک پزشکی امری — ویرایش ۱۶",
    "hmg5": "ژنتیک مولکولی انسان استراچن (HMG) — ویرایش ۵",
    "strachan_ggm": "ژنتیک و ژنومیکس در پزشکی استراچن — ویرایش ۲",
    "brown": "کلونینگ ژن و آنالیز DNA براون",
    "harper": "بیوشیمی هارپر — فصل‌های پرتکرار آزمون",
}

def esc(t):
    return html.escape(str(t), quote=False)

def load(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)

def star(w):
    return '<span class="stars">%s</span>' % (STARS.get(int(w), ""))

# ---------- syllabus ----------
def syllabus_html():
    out = ['<section class="part" id="syllabus"><h1 class="part-title">بخش اول: سیلابس جامع آزمون — ۲۰ موضوع کلیدی هر فصل</h1>']
    out.append('<p class="intro">این سیلابس، اسکلت پوشش آزمون است: برای هر فصل از منابع اصلی (به‌جز فصول مقدماتی/فهرست)، ۲۰ موضوع پرتکرار به همراه «وزن احتمال طرح سوال» (★ کم تا ★★★★★ بسیار پرتکرار) بر اساس تحلیل سبک سوالات آزمون‌های سال‌های قبل دکتری تخصصی ژنتیک پزشکی تعیین شده است. فصل‌هایی که بانک سوالات کامل آن‌ها در همین فایل آمده با علامت ✔ مشخص شده‌اند.</p>')
    for bid in BOOK_ORDER:
        path = os.path.join(CONTENT, "syllabus", f"syllabus_{bid}.json")
        if not os.path.exists(path):
            continue
        d = load(path)
        out.append(f'<h2 class="book-title">{esc(d["book_title_fa"])}</h2>')
        out.append(f'<p class="book-sub">{esc(d["book_title"])}</p>')
        for ch in d["chapters"]:
            has_bank = (bid == "emery" and os.path.exists(os.path.join(CONTENT, "emery", f"ch{ch['no']:02d}.json")))
            tick = ' <span class="tick">✔ بانک سوالات کامل در بخش دوم</span>' if has_bank else ""
            out.append(f'<div class="chapter-card"><h3 class="ch-title">فصل {ch["no"]}: {esc(ch["fa"])} <span class="en-small">{esc(ch["en"])}</span>{tick}</h3>')
            out.append('<table class="topics"><tr><th class="w30">موضوع</th><th class="w70">عنوان موضوع (اصطلاح کلیدی انگلیسی)</th><th>وزن آزمونی</th></tr>')
            for i, t in enumerate(ch["topics"], 1):
                tw = int(t[1])
                color = "w5" if tw >= 5 else ("w4" if tw == 4 else ("w3" if tw == 3 else "w2"))
                out.append(f'<tr><td class="idx">{i}</td><td>{esc(t[0])}</td><td class="{color}">{star(tw)}</td></tr>')
            out.append("</table></div>")
    out.append("</section>")
    return "\n".join(out)

# ---------- emery bank ----------
def emery_html():
    out = ['<section class="part" id="emery"><h1 class="part-title">بخش دوم: بانک سوالات پیش‌بینی‌شده — کتاب امری (۲۱ فصل، ۲۱۰ سوال با پاسخنامه دو سطحی)</h1>']
    out.append('<p class="intro">هر سوال در سبک آزمون‌های سال‌های قبل طراحی شده است. پاسخنامه دو سطحی دارد: <b>سطح ۱</b> = پاسخ سریع به همراه دلیل رد سایر گزینه‌ها؛ <b>سطح ۲ = درسنامه</b> = مطالب کلیدی فصل به‌گونه‌ای که هر سوال مشابه‌ای که در آزمون مطرح شود قابل پاسخ‌گویی باشد.</p>')
    files = sorted(glob.glob(os.path.join(CONTENT, "emery", "ch*.json")))
    for fp in files:
        d = load(fp)
        out.append(f'<div class="q-chapter" id="em{d["chapter_no"]:02d}">')
        out.append(f'<h2 class="book-title">فصل {d["chapter_no"]}: {esc(d["chapter_title_fa"].split(":",1)[-1].strip())}</h2>')
        out.append(f'<p class="book-sub">{esc(d["chapter_title_en"])} — وزن آزمونی فصل: {star(d["exam_weight"])}</p>')
        for q in d["questions"]:
            out.append('<div class="question">')
            out.append(f'<div class="q-head"><span class="q-id">{esc(q["id"])}</span> <span class="q-topic">{esc(q["topic"])}</span> <span class="q-diff">{esc(q["difficulty"])}</span></div>')
            out.append(f'<p class="stem">{esc(q["stem"])}</p>')
            out.append('<ul class="opts">')
            for i, o in enumerate(q["options"]):
                mark = "opt-correct" if i == q["answer_idx"] else ""
                letter = "ABCD"[i]
                out.append(f'<li class="{mark}"><span class="ol">{letter})</span> {esc(o)}</li>')
            out.append("</ul>")
            ans_letter = "ABCD"[q["answer_idx"]]
            out.append(f'<div class="answer"><div class="a-tag">پاسخ صحیح: گزینه {ans_letter}</div>')
            out.append(f'<div class="lvl1"><span class="lvl-tag">سطح ۱ — پاسخ سریع:</span> {esc(q["level1"])}</div>')
            out.append(f'<div class="lvl2"><span class="lvl-tag">سطح ۲ — درسنامه کامل:</span> {esc(q["level2"])}</div>')
            out.append("</div></div>")
        out.append("</div>")
    out.append("</section>")
    return "\n".join(out)

# ---------- english ----------
def english_html():
    out = ['<section class="part ltr-wrap" id="english"><h1 class="part-title">بخش سوم: زبان تخصصی — ۱۲ ریدینگ استاندارد آزمون با پاسخ تشریحی و استراتژی</h1>']
    out.append('<p class="intro">پاساژها بر اساس مقالات موجود در پوشه Breast cancer سیستم شما و جدیدترین پیشرفت‌های ژنتیک/آنکولوژی (۲۰۲۴–۲۰۲۶) به سبک ریدینگ‌های آزمون دکتری تخصصی بازنویسی شده‌اند. پاساژ انگلیسی چپ‌به‌راست و توضیحات فارسی راست‌به‌چپ است.</p>')
    for part in sorted(glob.glob(os.path.join(CONTENT, "english", "readings_part*.json"))):
        d = load(part)
        if "strategy_note" in d:
            out.append(f'<div class="strategy"><b>راهنمای استراتژی پاسخ‌دهی:</b> {esc(d["strategy_note"])}</div>')
        out.append(f'<h2 class="book-title">{esc(d["section_title_fa"])}</h2>')
        for r in d["readings"]:
            out.append('<div class="reading">')
            out.append(f'<h3 class="r-title">{esc(r["title"])}</h3>')
            out.append(f'<p class="r-src">{esc(r["source"])}</p>')
            out.append(f'<div class="passage ltr">{esc(r["passage"])}</div>')
            if r.get("vocab"):
                out.append('<div class="vocab"><b>واژگان کلیدی:</b><table class="vtable">')
                for v in r["vocab"]:
                    out.append(f'<tr><td class="ven ltr">{esc(v[0])}</td><td>{esc(v[1])}</td></tr>')
                out.append("</table></div>")
            out.append('<div class="rqs">')
            for q in r["questions"]:
                out.append('<div class="rq">')
                out.append(f'<p class="stem ltr">{esc(q["q"])}</p><ul class="opts ltr">')
                for i, o in enumerate(q["options"]):
                    mark = "opt-correct" if i == q["answer_idx"] else ""
                    out.append(f'<li class="{mark}"><span class="ol">{"ABCD"[i]})</span> {esc(o)}</li>')
                out.append("</ul>")
                out.append(f'<div class="answer"><div class="a-tag">پاسخ: گزینه {"ABCD"[q["answer_idx"]]}</div>')
                out.append(f'<div class="lvl1"><span class="lvl-tag">توضیح:</span> {esc(q["explanation"])}</div>')
                if q.get("tip"):
                    out.append(f'<div class="lvl2"><span class="lvl-tag">استراتژی:</span> {esc(q["tip"])}</div>')
                out.append("</div></div>")
            out.append("</div></div>")
        # final vocab table (only in last part)
        if "final_vocabulary_table" in d:
            vt = d["final_vocabulary_table"]
            out.append(f'<h2 class="book-title">{esc(vt["title_fa"])}</h2><p class="intro">{esc(vt["note"])}</p>')
            for g in vt["groups"]:
                out.append(f'<h3 class="ch-title">{esc(g["group"])}</h3><table class="vtable">')
                for it in g["items"]:
                    out.append(f'<tr><td class="ven ltr">{esc(it[0])}</td><td>{esc(it[1])}</td></tr>')
                out.append("</table>")
    out.append("</section>")
    return "\n".join(out)

CSS = """
@font-face { font-family:'Vazirmatn'; src:url('app/fonts/vazirmatn-400.woff2') format('woff2'); font-weight:400; }
@font-face { font-family:'Vazirmatn'; src:url('app/fonts/vazirmatn-500.woff2') format('woff2'); font-weight:500; }
@font-face { font-family:'Vazirmatn'; src:url('app/fonts/vazirmatn-700.woff2') format('woff2'); font-weight:700; }
* { box-sizing:border-box; }
body { font-family:'Vazirmatn', 'Segoe UI', Tahoma; direction:rtl; text-align:right; color:#1a2233; margin:0; font-size:10.5pt; line-height:1.9; }
.cover { text-align:center; padding:150px 40px 60px; page-break-after:always; }
.cover h1 { font-size:26pt; color:#123c6b; margin-bottom:10px; }
.cover h2 { font-size:15pt; color:#8a6d1a; font-weight:500; margin-top:0; }
.cover .meta { margin-top:40px; font-size:11pt; color:#444; }
.cover .box { border:2px solid #c9a227; border-radius:12px; padding:18px 26px; display:inline-block; margin-top:30px; background:#fbf7ea; }
.part { page-break-before:always; }
.part-title { font-size:17pt; color:#123c6b; border-bottom:3px solid #c9a227; padding-bottom:8px; margin:24px 4px 14px; }
.book-title { font-size:14pt; color:#7a1f1f; margin:26px 4px 4px; background:#f7f0f0; padding:8px 12px; border-right:5px solid #7a1f1f; border-radius:4px; }
.book-sub { font-size:9pt; color:#666; margin:2px 12px 14px; font-style:italic; }
.intro { background:#eef4fb; border-radius:8px; padding:10px 14px; margin:8px 4px 18px; font-size:10pt; }
.chapter-card { margin:12px 2px 22px; }
.ch-title { font-size:11.5pt; color:#123c6b; margin:0 0 6px; }
.tick { color:#1f7a2d; font-size:9pt; font-weight:400; }
.en-small { color:#777; font-size:8.5pt; font-weight:400; }
table.topics, table.vtable { width:100%; border-collapse:collapse; margin:6px 0 10px; font-size:9.3pt; }
table.topics th, table.topics td, table.vtable td { border:1px solid #d5dbe5; padding:3px 8px; vertical-align:top; }
table.topics th { background:#123c6b; color:#fff; font-weight:500; }
.idx { width:26px; text-align:center; color:#555; }
.w30 { width:26px; }
.stars { color:#c9a227; letter-spacing:1px; font-size:8.5pt; }
.w5 { background:#fdeeee; } .w4 { background:#fdf6e3; } .w3 { background:#f2f7f2; }
.question { border:1px solid #dfe5ef; border-radius:10px; padding:10px 14px; margin:10px 2px 16px; page-break-inside:avoid; background:#fdfdfe; }
.q-head { font-size:8.5pt; color:#666; margin-bottom:4px; }
.q-id { background:#123c6b; color:#fff; border-radius:4px; padding:1px 7px; font-size:8pt; }
.q-topic { color:#7a1f1f; margin-right:8px; font-weight:700; }
.q-diff { color:#888; float:left; font-style:italic; }
.stem { font-weight:700; margin:4px 0 8px; }
ul.opts { list-style:none; padding:0; margin:4px 0; }
ul.opts li { padding:2px 10px 2px 6px; margin:2px 0; border-radius:5px; }
li.opt-correct { background:#e9f7ec; outline:1.5px solid #2f9e44; font-weight:700; }
.ol { color:#123c6b; font-weight:700; margin-left:4px; }
.answer { margin-top:8px; border-top:1px dashed #b9c3d6; padding-top:6px; }
.a-tag { display:inline-block; background:#2f9e44; color:#fff; border-radius:5px; padding:1px 10px; font-size:9pt; margin-bottom:6px; }
.lvl1, .lvl2 { font-size:9.6pt; margin:4px 0; padding:6px 10px; border-radius:7px; }
.lvl1 { background:#f4f8fd; border-right:3px solid #4a7ab5; }
.lvl2 { background:#fbf7ea; border-right:3px solid #c9a227; }
.lvl-tag { font-weight:700; color:#7a1f1f; }
.reading { border:1px solid #dfe5ef; border-radius:10px; padding:10px 14px; margin:10px 2px 20px; }
.r-title { color:#123c6b; font-size:12pt; margin:2px 0; }
.r-src { font-size:8.5pt; color:#777; font-style:italic; }
.ltr { direction:ltr; text-align:left; font-family:Georgia,'Times New Roman',serif; }
.passage { background:#f6f8fb; border-radius:8px; padding:8px 12px; font-size:9.6pt; line-height:1.75; margin:6px 0; }
.vocab { margin:8px 0; }
.vtable .ven { font-family:Georgia,serif; font-weight:700; width:34%; direction:ltr; text-align:left; }
.strategy { background:#fff4f4; border:1px solid #d9a0a0; border-radius:8px; padding:8px 14px; margin:10px 2px; font-size:9.6pt; }
h1,h2,h3 { page-break-after:avoid; }
@media print { .part { page-break-before:always; } }
"""

def main():
    toc = """
<div class="cover">
  <h1>بانک سوالات پیش‌بینی آزمون دکتری تخصصی ژنتیک پزشکی</h1>
  <h2>سیلابس جامع + سوالات پیش‌بینی‌شده با پاسخنامه دو سطحی (درسنامه)</h2>
  <div class="box">
    <div>بخش اول: سیلابس ۲۰ موضوعی × ۹۴ فصل از ۵ منبع اصلی (۱٬۸۸۰ موضوع)</div>
    <div>بخش دوم: کتاب امری — ۲۱ فصل، ۲۱۰ سوال چهارگزینه‌ای + پاسخنامه دو سطحی</div>
    <div>بخش سوم: زبان تخصصی — ۱۲ ریدینگ + ۶۰ سوال + استراتژی پاسخ‌دهی + واژگان</div>
  </div>
  <div class="meta">
    منابع: امری ۱۶ | استراچن HMG ۵ | استراچن GGM ۲ | براون | هارپر ۲۰۲۲<br>
    مقالات ریدینگ: پوشه Breast cancer + پیشرفت‌های ۲۰۲۴–۲۰۲۶<br>
    تهیه‌شده بر اساس تحلیل سبک و محتوای آزمون‌های سال‌های قبل دکتری تخصصی ژنتیک پزشکی
  </div>
</div>
"""
    doc = ["<!DOCTYPE html><html lang='fa' dir='rtl'><head><meta charset='utf-8'>",
           "<title>بانک سوالات پیش‌بینی آزمون دکتری ژنتیک پزشکی</title>",
           f"<style>{CSS}</style></head><body>", toc,
           syllabus_html(), emery_html(), english_html(), "</body></html>"]
    with open(OUT_HTML, "w", encoding="utf-8") as f:
        f.write("\n".join(doc))
    print("HTML written:", OUT_HTML, os.path.getsize(OUT_HTML)//1024, "KB")

    browsers = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    ]
    browser = next((b for b in browsers if os.path.exists(b)), None)
    if not browser:
        print("No headless browser found"); sys.exit(1)
    url = "file:///" + OUT_HTML.replace("\\", "/")
    cmd = [browser, "--headless", "--disable-gpu", "--no-sandbox",
           "--run-all-compositor-stages-before-draw", "--virtual-time-budget=20000",
           "--no-pdf-header-footer", f"--print-to-pdf={OUT_PDF}", url]
    print("Printing PDF with:", browser)
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if os.path.exists(OUT_PDF):
        print("PDF written:", OUT_PDF, os.path.getsize(OUT_PDF)//1024, "KB")
    else:
        print("PDF FAILED", r.stdout[-500:], r.stderr[-500:]); sys.exit(1)

if __name__ == "__main__":
    main()
