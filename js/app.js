/* ژنتیک‌یار — بانک سوالات دکتری ژنتیک پزشکی (PWA) */
"use strict";
const STARS = n => "★".repeat(n);
const $ = s => document.querySelector(s);
const view = $("#view");
let BANK = null;
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem("gy_" + k)) ?? d } catch { return d } },
  set: (k, v) => { try { localStorage.setItem("gy_" + k, JSON.stringify(v)) } catch {} }
};

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.remove("hidden");
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.add("hidden"), 2200);
}
function setTitle(t) { $("#topTitle").textContent = t; }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

/* ---------------- HOME ---------------- */
function vHome() {
  setTitle("ژنتیک‌یار | بانک سوالات دکتری تخصصی ژنتیک پزشکی");
  const nTopics = BANK.books.reduce((a, b) => a + b.chapters.reduce((x, c) => x + c.topics.length, 0), 0);
  const nQ = (BANK.emery_bank||[]).reduce((a, c) => a + c.questions.length, 0)
           + (BANK.harper_bank||[]).reduce((a, c) => a + c.questions.length, 0);
  const nH = (BANK.harper_bank||[]).reduce((a, c) => a + c.questions.length, 0);
  const nR = BANK.english.reduce((a, p) => a + p.readings.length, 0);
  const read = store.get("read_q", []);
  view.innerHTML = `
  <div class="hero">
    <h1>🧬 بانک سوالات پیش‌بینی آزمون دکتری تخصصی ژنتیک پزشکی</h1>
    <p>سیلابس جامع ۲۰ موضوعی + سوالات پیش‌بینی‌شده با پاسخنامه دو سطحی + زبان تخصصی — بر اساس تحلیل آزمون‌های سال‌های قبل</p>
    <div class="stats">
      <div class="stat"><b>${nTopics.toLocaleString("fa-ir")}</b><span>موضوع آزمونی</span></div>
      <div class="stat"><b>${nQ.toLocaleString("fa-ir")}</b><span>سوال دو سطحی</span></div>
      <div class="stat"><b>${nR.toLocaleString("fa-ir")}</b><span>ریدینگ زبان</span></div>
      <div class="stat"><b>${read.length.toLocaleString("fa-ir")}</b><span>مطالعه‌شده</span></div>
    </div>
  </div>
  <h2 class="sec">بخش‌های بانک</h2>
  <div class="grid2">
    <div class="tile" onclick="nav('syllabus')"><div class="ic">📚</div><b>سیلابس جامع</b><span>۵ منبع × ۹۴ فصل × ۲۰ موضوع با وزن آزمونی</span></div>
    <div class="tile" onclick="nav('emery')"><div class="ic">❓</div><b>سوالات امری</b><span>۲۱ فصل × ۱۰ سوال با پاسخ دو سطحی</span></div>
    <div class="tile" onclick="nav('harper')"><div class="ic">🧪</div><b>بیوشیمی هارپر</b><span>۲۴ فصل پرتکرار × ${nH} سوال</span></div>
    <div class="tile" onclick="nav('english')"><div class="ic">🇬🇧</div><b>زبان تخصصی</b><span>۱۲ ریدینگ + واژگان + استراتژی</span></div>
    <div class="tile" onclick="startQuiz(10,'emery')"><div class="ic">🎯</div><b>آزمون امری</b><span>۱۰ سوال تصادفی با نمره</span></div>
    <div class="tile" onclick="startQuiz(10,'harper')"><div class="ic">⚗️</div><b>آزمون بیوشیمی</b><span>۱۰ سوال تصادفی با نمره</span></div>
    <div class="tile" onclick="window.open('Genetics-PhD-Exam-Bank.pdf','_blank')"><div class="ic">📄</div><b>فایل PDF کامل</b><span>نسخه ۵۲۵ صفحه‌ای — باز/دانلود</span></div>
  </div>
  <h2 class="sec">درباره این بانک</h2>
  <div class="card" style="font-size:13px">
    این بانک بر اساس منابع رسمی آزمون (امری ۱۶، استراچن HMG۵ و GGM۲، براون، هارپر ۲۰۲۲) و مقالات پوشه Breast cancer + پیشرفت‌های ۲۰۲۴–۲۰۲۶ طراحی شده است.
    <b>پاسخنامه دو سطحی:</b> سطح ۱ پاسخ سریع و رد گزینه‌ها؛ سطح ۲ درسنامه کامل برای پاسخ به سوالات مشابه.
    <div style="margin-top:8px;color:#6b7688">فازهای بعدی: بانک کامل استراچن‌ها و براون به همین ساختار اضافه می‌شود.</div>
  </div>`;
}

/* ---------------- SYLLABUS ---------------- */
function vSyllabus(bookIdx) {
  setTitle("سیلابس جامع — ۲۰ موضوع کلیدی هر فصل");
  if (bookIdx === undefined) {
    view.innerHTML = `<div class="card" style="font-size:13px">هر موضوع با «وزن احتمال طرح سوال» (★ تا ★★★★★) بر اساس تحلیل آزمون‌های سال‌های قبل مشخص شده است.</div>` +
      BANK.books.map((b, i) => `
      <div class="book" data-book="${i}">
        <div class="book-head" onclick="this.parentElement.classList.toggle('open')">
          <div><div class="book-title">${esc(b.book_title_fa)}</div><div class="book-sub">${esc(b.book_title)}</div></div>
          <div class="chev">◀</div>
        </div>
        <div>${b.chapters.map(c => `
          <div class="ch-item" onclick="nav('syllabus',${i},${c.no})">
            <span class="ch-no">${c.no}</span>
            <span class="ch-name">${esc(c.fa)}</span>
            <span class="weight">${STARS(c.weight)}</span>
          </div>`).join("")}
        </div>
      </div>`).join("");
    return;
  }
  const b = BANK.books[bookIdx], ch = b.chapters.find(c => c.no === bookIdx || c.no === Number(bookIdx));
  const nextCh = b.chapters[b.chapters.indexOf(ch) + 1], prevCh = b.chapters[b.chapters.indexOf(ch) - 1];
  view.innerHTML = `
  <button class="back-btn" onclick="nav('syllabus')">→ همه کتاب‌ها</button>
  <div class="card"><b>${esc(b.book_title_fa)}</b><div class="book-sub">${esc(ch.en)}</div></div>
  <div class="q-card"><div class="q-head"><span class="q-id">فصل ${ch.no}</span> وزن آزمونی فصل: <span class="weight">${STARS(ch.weight)}</span></div>
  <div class="stem">${esc(ch.fa)}</div>
  <div style="font-size:12px;color:#6b7688;margin-bottom:6px">۲۰ موضوع اصلی با وزن احتمال طرح سوال:</div>
  ${ch.topics.map((t, i) => `
    <div class="topic-row"><span class="tno">${i + 1}.</span><span class="tname">${esc(t[0])}</span>
    <span class="badge b${t[1]}">${STARS(t[1])}</span></div>`).join("")}
  </div>
  <div style="display:flex;justify-content:space-between;gap:8px">
    ${prevCh ? `<button class="btn ghost" onclick="nav('syllabus',${bookIdx},${prevCh.no})">فصل ${prevCh.no} ←</button>` : ""}
    ${nextCh ? `<button class="btn ghost" onclick="nav('syllabus',${bookIdx},${nextCh.no})">→ فصل ${nextCh.no}</button>` : ""}
  </div>`;
}

/* ---------------- EMERY QUESTIONS ---------------- */
function questionCard(q, opts) {
  opts = opts || {};
  const read = store.get("read_q", []);
  return `
  <div class="q-card" id="q_${q.id}">
    <div class="q-head"><span class="q-id">${esc(q.id)}</span><span class="q-topic">${esc(q.topic)}</span>
    ${read.includes(q.id) ? '<span class="done-tick">✔ مطالعه شد</span>' : ""}</div>
    <div class="stem">${esc(q.stem)}</div>
    <ul class="opts" data-qid="${q.id}">
      ${q.options.map((o, i) => `<li data-i="${i}" onclick="pickOption(this,'${q.id}',${i},${q.answer_idx})"><span class="ol">${"ABCD"[i]})</span> ${esc(o)}</li>`).join("")}
    </ul>
    <div class="answer hidden" id="ans_${q.id}">
      <span class="a-tag">پاسخ صحیح: ${"ABCD"[q.answer_idx]}</span>
      <div class="lvl lvl1"><span class="lt">سطح ۱ — پاسخ سریع:</span><br>${esc(q.level1)}</div>
      <div class="lvl lvl2"><span class="lt">سطح ۲ — درسنامه کامل:</span><br>${esc(q.level2)}</div>
    </div>
    ${opts.noReveal ? "" : `<button class="btn gold" onclick="revealAnswer('${q.id}')">نمایش پاسخ</button>`}
  </div>`;
}
function pickOption(el, qid, i, correct) {
  if (el.classList.contains("correct")) return;
  const ul = el.parentElement, was = !$("#ans_" + qid).classList.contains("hidden");
  if (!was) { ul.querySelectorAll("li").forEach(li => li.classList.remove("sel", "correct", "wrong"));
    el.classList.add("sel"); return; }
  ul.querySelectorAll("li").forEach(li => li.classList.remove("sel", "correct", "wrong"));
  ul.children[i].classList.add(i === correct ? "correct" : "wrong");
  ul.children[correct].classList.add("correct");
}
function revealAnswer(qid) {
  const a = $("#ans_" + qid); a.classList.remove("hidden");
  const read = store.get("read_q", []); if (!read.includes(qid)) { read.push(qid); store.set("read_q", read); }
  const ul = $('.opts[data-qid="' + qid + '"]');
  const sel = ul.querySelector("li.sel");
  ul.querySelectorAll("li").forEach(li => li.classList.remove("sel"));
  const qidn = ul.dataset.qid;
  const q = findQ(qidn); if (!q) return;
  ul.children[q.answer_idx].classList.add("correct");
  if (sel && +sel.dataset.i !== q.answer_idx) sel.classList.add("wrong");
}
function findQ(id) {
  for (const c of (BANK.emery_bank||[]).concat(BANK.harper_bank||[])) {
    const q = c.questions.find(x => x.id === id); if (q) return q;
  }
  return null;
}
function vEmery(chNo) {
  setTitle("سوالات کتاب امری — با پاسخنامه دو سطحی");
  if (chNo === undefined) {
    view.innerHTML = `<div class="card" style="font-size:13px">۲۱ فصل کتاب <b>Emery's Elements of Medical Genetics</b> — هر فصل ۱۰ سوال پیش‌بینی‌شده. گزینه را انتخاب کنید و سپس «نمایش پاسخ» را بزنید.</div>` +
      BANK.emery_bank.map(c => `
      <div class="ch-item card" style="display:flex" onclick="nav('emery',${c.chapter_no})">
        <span class="ch-no">${c.chapter_no}</span>
        <span class="ch-name">${esc(c.chapter_title_fa.split(":").pop().trim())}</span>
        <span class="weight">${STARS(c.exam_weight)}</span>
      </div>`).join("");
    return;
  }
  const c = BANK.emery_bank.find(x => x.chapter_no === chNo);
  const idx = BANK.emery_bank.indexOf(c), next = BANK.emery_bank[idx + 1], prev = BANK.emery_bank[idx - 1];
  view.innerHTML = `
  <button class="back-btn" onclick="nav('emery')">→ همه فصل‌ها</button>
  <div class="card"><b>${esc(c.chapter_title_fa)}</b><div class="book-sub">${esc(c.chapter_title_en)}</div>
  <span class="weight">${STARS(c.exam_weight)}</span></div>
  ${c.questions.map(q => questionCard(q)).join("")}
  <div style="display:flex;justify-content:space-between;gap:8px">
    ${prev ? `<button class="btn ghost" onclick="nav('emery',${prev.chapter_no})">فصل ${prev.chapter_no} ←</button>` : ""}
    ${next ? `<button class="btn ghost" onclick="nav('emery',${next.chapter_no})">→ فصل ${next.chapter_no}</button>` : ""}
  </div>`;
}

/* ---------------- HARPER (Biochemistry) ---------------- */
function vHarper(chNo) {
  setTitle("بیوشیمی هارپر — ۲۴ فصل پرتکرار با پاسخنامه دو سطحی");
  const BK = BANK.harper_bank || [];
  if (chNo === undefined) {
    view.innerHTML = `<div class="card" style="font-size:13px">۲۴ فصل پرتکرار کتاب <b>Harper's Illustrated Biochemistry</b> — هر فصل ۱۰ سوال پیش‌بینی‌شده با پاسخ دو سطحی. برای شروع، فصل را انتخاب کنید.</div>` +
      `<div class="grid2">` +
      `<div class="tile" onclick="startQuiz(10,'harper')"><div class="ic">🎯</div><b>آزمون تصادفی بیوشیمی</b><span>۱۰ سوال از ۲۴۰ سوال هارپر</span></div>` +
      `<div class="tile" onclick="startQuiz(20,'harper')"><div class="ic">🏆</div><b>آزمون بزرگ</b><span>۲۰ سوال تصادفی</span></div></div>` +
      BK.map(c => `
      <div class="ch-item card" style="display:flex" onclick="nav('harper',${c.chapter_no})">
        <span class="ch-no">${c.chapter_no}</span>
        <span class="ch-name">${esc(c.chapter_title_fa.split(":").pop().trim())}</span>
        <span class="weight">${STARS(c.exam_weight)}</span>
      </div>`).join("");
    return;
  }
  const c = BK.find(x => x.chapter_no === chNo);
  if (!c) { nav("harper"); return; }
  const idx = BK.indexOf(c), next = BK[idx + 1], prev = BK[idx - 1];
  view.innerHTML = `
  <button class="back-btn" onclick="nav('harper')">→ همه فصل‌ها</button>
  <div class="card"><b>${esc(c.chapter_title_fa)}</b><div class="book-sub">${esc(c.chapter_title_en)}</div>
  <span class="weight">${STARS(c.exam_weight)}</span></div>
  ${c.questions.map(q => questionCard(q)).join("")}
  <div style="display:flex;justify-content:space-between;gap:8px">
    ${prev ? `<button class="btn ghost" onclick="nav('harper',${prev.chapter_no})">فصل ${prev.chapter_no} ←</button>` : ""}
    ${next ? `<button class="btn ghost" onclick="nav('harper',${next.chapter_no})">→ فصل ${next.chapter_no}</button>` : ""}
  </div>`;
}

/* ---------------- ENGLISH ---------------- */
function vEnglish(rid) {
  setTitle("زبان تخصصی — ریدینگ + استراتژی");
  const parts = BANK.english;
  if (rid === undefined) {
    view.innerHTML = `<div class="card" style="font-size:13px">۱۲ ریدینگ بر اساس مقالات پوشه <b>Breast cancer</b> و مقالات ۲۰۲۴–۲۰۲۶؛ شامل واژگان کلیدی، سوالات سبک آزمون، پاسخ تشریحی و استراتژی.</div>` +
      parts.map(p => `<h2 class="sec">${esc(p.section_title_fa)}</h2>` +
        p.readings.map(r => `<div class="ch-item card" style="display:flex" onclick="nav('english','${r.id}')">
          <span class="ch-name ltr" style="text-align:right;direction:rtl">${esc(r.title)}</span></div>`).join("")).join("");
    return;
  }
  let R = null, P = null;
  for (const p of parts) { const r = p.readings.find(x => x.id === rid); if (r) { R = r; P = p; break; } }
  if (!R) { nav("english"); return; }
  view.innerHTML = `
  <button class="back-btn" onclick="nav('english')">→ همه ریدینگ‌ها</button>
  ${P.strategy_note ? `<div class="strategy"><b>راهنمای استراتژی:</b> ${esc(P.strategy_note)}</div>` : ""}
  <div class="q-card">
    <div class="q-topic">${esc(R.title)}</div><div class="book-sub">${esc(R.source)}</div>
    <div class="passage ltr">${esc(R.passage)}</div>
    <div class="vocab"><b>واژگان کلیدی:</b><table class="vtable">
      ${R.vocab.map(v => `<tr><td class="ven">${esc(v[0])}</td><td>${esc(v[1])}</td></tr>`).join("")}
    </table></div>
  </div>
  ${R.questions.map((q, qi) => `
  <div class="q-card">
    <div class="stem ltr">${esc(q.q)}</div>
    <ul class="opts ltr" data-rid="${R.id}" data-qi="${qi}">
      ${q.options.map((o, i) => `<li data-i="${i}" onclick="pickEng(this,${qi},${i},${q.answer_idx},'${R.id}')"><span class="ol">${"ABCD"[i]})</span> ${esc(o)}</li>`).join("")}
    </ul>
    <div class="answer hidden" id="eans_${qi}_${R.id}">
      <span class="a-tag">پاسخ: ${"ABCD"[q.answer_idx]}</span>
      <div class="lvl lvl1"><span class="lt">توضیح:</span><br>${esc(q.explanation)}</div>
      ${q.tip ? `<div class="lvl lvl2"><span class="lt">استراتژی:</span><br>${esc(q.tip)}</div>` : ""}
    </div>
    <button class="btn gold" onclick="document.getElementById('eans_${qi}_${R.id}').classList.remove('hidden')">نمایش پاسخ</button>
  </div>`).join("")}
  ${finalVocabTable()}`;
}
function pickEng(el, qi, i, correct, rid) {
  const box = document.getElementById(`eans_${qi}_${rid}`); if (!box) return;
  if (box.classList.contains("hidden")) { el.parentElement.querySelectorAll("li").forEach(l => l.classList.remove("sel")); el.classList.add("sel"); return; }
  el.parentElement.querySelectorAll("li").forEach(l => l.classList.remove("sel", "correct", "wrong"));
  el.classList.add(i === correct ? "correct" : "wrong");
  el.parentElement.children[correct].classList.add("correct");
}
function finalVocabTable() {
  const p3 = BANK.english.find(p => p.final_vocabulary_table); if (!p3) return "";
  const vt = p3.final_vocabulary_table;
  return `<h2 class="sec">${esc(vt.title_fa)}</h2>
  ${vt.groups.map(g => `<div class="card"><b>${esc(g.group)}</b><table class="vtable">
    ${g.items.map(it => `<tr><td class="ven">${esc(it[0])}</td><td>${esc(it[1])}</td></tr>`).join("")}
  </table></div>`).join("")}`;
}

/* ---------------- QUIZ ---------------- */
let quiz = null;
function vQuiz() {
  setTitle("حالت آزمون تصادفی");
  if (!quiz) {
    view.innerHTML = `<div class="card quizbox" style="text-align:center">
      <div style="font-size:34px">🎯</div>
      <div class="stem">آزمون تصادفی از بانک سوالات</div>
      <p style="font-size:13px;color:#6b7688">۱۰ یا ۲۰ سوال تصادفی؛ بعد از پاسخ، پاسخ صحیح و توضیح سطح ۱ نمایش داده می‌شود.</p>
      <button class="btn" onclick="startQuiz(10,'emery')">امری (۱۰ سوال)</button>
      <button class="btn gold" onclick="startQuiz(10,'harper')">بیوشیمی هارپر (۱۰ سوال)</button>
      <button class="btn ghost" onclick="startQuiz(20,'harper')">هارپر بزرگ (۲۰)</button>
    </div>`;
    return;
  }
  if (quiz.done) {
    const pct = Math.round(100 * quiz.score / quiz.qs.length);
    view.innerHTML = `<div class="card result-hero quizbox">
      <div class="big">${pct >= 80 ? "🏆" : pct >= 50 ? "👏" : "📚"}</div>
      <div class="stem">نتیجه: ${quiz.score} از ${quiz.qs.length} (${pct}٪)</div>
      <button class="btn" onclick="startQuiz(${quiz.qs.length},'${quiz.src}')">آزمون مجدد</button>
      <button class="btn ghost" onclick="quiz=null;nav('quiz')">بازگشت</button>
    </div>`;
    return;
  }
  const q = quiz.qs[quiz.i];
  view.innerHTML = `<div class="quizbox">
    <div class="score-bar"><span>سوال ${quiz.i + 1} از ${quiz.qs.length}</span><span>امتیاز: ${quiz.score}</span></div>
    <div class="progress"><i style="width:${100 * quiz.i / quiz.qs.length}%"></i></div>
    <div class="q-card">
      <div class="q-head"><span class="q-id">${esc(q.id)}</span><span class="q-topic">${esc(q.topic)}</span></div>
      <div class="stem">${esc(q.stem)}</div>
      <ul class="opts">
        ${q.options.map((o, i) => `<li onclick="quizPick(${i})"><span class="ol">${"ABCD"[i]})</span> ${esc(o)}</li>`).join("")}
      </ul>
      <div class="answer hidden" id="qz_ans">
        <span class="a-tag">پاسخ صحیح: ${"ABCD"[q.answer_idx]}</span>
        <div class="lvl lvl1"><span class="lt">توضیح:</span><br>${esc(q.level1)}</div>
      </div>
      <button class="btn gold hidden" id="qz_next" onclick="quizNext()">${quiz.i + 1 === quiz.qs.length ? "دیدن نتیجه" : "سوال بعدی"}</button>
    </div></div>`;
}
function startQuiz(n, src) {
  const all = (src === "harper" ? (BANK.harper_bank || []) : BANK.emery_bank).flatMap(c => c.questions);
  for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
  quiz = { qs: all.slice(0, n), i: 0, score: 0, done: false, src: src || "emery" };
  nav("quiz");
}
function quizPick(i) {
  if (quiz.locked) return; quiz.locked = true;
  const q = quiz.qs[quiz.i], ul = view.querySelector(".opts");
  ul.children[i].classList.add(i === q.answer_idx ? "correct" : "wrong");
  ul.children[q.answer_idx].classList.add("correct");
  if (i === q.answer_idx) quiz.score++;
  $("#qz_ans").classList.remove("hidden"); $("#qz_next").classList.remove("hidden");
}
function quizNext() { quiz.locked = false; quiz.i++; if (quiz.i >= quiz.qs.length) quiz.done = true; vQuiz(); }

/* ---------------- SEARCH ---------------- */
function doSearch(term) {
  const t = term.trim(); if (t.length < 2) { $("#searchResults").innerHTML = ""; return; }
  const out = [];
  for (const b of BANK.books) for (const ch of b.chapters) for (let i = 0; i < ch.topics.length; i++) {
    const s = ch.topics[i][0];
    if (s.includes(t)) out.push({ txt: `<b>[سیلابس ${b.book_id} — فصل ${ch.no}]</b> ${esc(s)}`, act: `nav('syllabus',${BANK.books.indexOf(b)},${ch.no})` });
    if (out.length > 60) break;
  }
  for (const [key, label] of [["emery_bank","emery"],["harper_bank","harper"]]) {
    for (const c of (BANK[key]||[])) for (const q of c.questions) {
      if ((q.stem + q.topic + q.level1 + q.level2).includes(t))
        out.push({ txt: `<b>[${q.id} — ${esc(q.topic)}]</b> ${esc(q.stem.slice(0, 90))}…`, act: `nav('${label}',${c.chapter_no});setTimeout(()=>document.getElementById('q_${q.id}')?.scrollIntoView({behavior:'smooth'}),300)` });
    }
  }
  $("#searchResults").innerHTML = out.slice(0, 40).map(o => `<div class="sr-item" onclick="closeSearch();${o.act}">${o.txt}</div>`).join("") || '<div class="sr-item">نتیجه‌ای یافت نشد</div>';
}
function closeSearch() { $("#searchModal").classList.add("hidden"); }

/* ---------------- ROUTER ---------------- */
function nav(page, a, b) {
  document.querySelectorAll(".tabbar button").forEach(x => x.classList.toggle("active", x.dataset.nav === page));
  window.scrollTo(0, 0);
  if (page === "home") vHome();
  else if (page === "syllabus") vSyllabus(a !== undefined ? Number(a) : undefined, b);
  else if (page === "emery") vEmery(a !== undefined ? Number(a) : undefined);
  else if (page === "harper") vHarper(a !== undefined ? Number(a) : undefined);
  else if (page === "english") vEnglish(a);
  else if (page === "quiz") vQuiz();
}
document.querySelectorAll(".tabbar button").forEach(x => x.onclick = () => nav(x.dataset.nav));
$("#btnHome").onclick = () => nav("home");
$("#btnSearch").onclick = () => { $("#searchModal").classList.remove("hidden"); $("#searchInput").focus(); };
$("#searchInput").oninput = e => doSearch(e.target.value);

fetch("data/bank.json").then(r => r.json()).then(d => {
  BANK = d; vHome();
  // پشتیبانی لینک مستقیم: #harper / #emery / #syllabus / #english / #quiz
  const h = (location.hash || "").replace("#", "").split("/")[0];
  if (["harper", "emery", "syllabus", "english", "quiz"].includes(h)) nav(h);
}).catch(e => {
  view.innerHTML = '<div class="card">خطا در بارگذاری داده‌ها. اگر از file:// باز کرده‌اید، اپ را با یک سرور محلی (مثلاً <code>python -m http.server</code>) اجرا کنید یا نسخه آنلاین گیت‌هاب پیجز را باز کنید.</div>';
});
if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
