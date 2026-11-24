// Notation Bible — layered BSB reader. No build step; plain browser JS.
{
const $ = s => document.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const BOOKS = window.BOOKS, ALIASES = window.ALIASES;
const BY = Object.fromEntries(BOOKS.map(b => [b.id, b]));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);

/* ---------- layers & settings ---------- */
const LAYERS = [
  { k: 'strongs', name: "Strong's", modes: ['off', 'tap', 'inline'], labels: { off: 'Off', tap: 'Tap words', inline: 'Numbers' }, help: 'Concordance numbers for every tagged word.' },
  { k: 'interlinear', name: 'Interlinear', modes: ['off', 'inline'], labels: { off: 'Off', inline: 'On' }, help: 'Greek or Hebrew, transliteration and number under each English word.' },
  { k: 'footnotes', name: 'Footnotes', modes: ['off', 'markers', 'inline'], labels: { off: 'Off', markers: 'Markers', inline: 'Inline' }, help: 'Translator notes and manuscript readings.' },
  { k: 'xrefs', name: 'Cross refs', modes: ['off', 'markers', 'inline'], labels: { off: 'Off', markers: 'Markers', inline: 'Inline' }, help: 'Related passages.' },
  { k: 'commentary', name: 'Commentary', modes: ['off', 'markers', 'inline'], labels: { off: 'Off', markers: 'Markers', inline: 'Inline' }, help: 'Notes on each section of the chapter.' },
  { k: 'studies', name: 'Studies', modes: ['off', 'markers', 'inline'], labels: { off: 'Off', markers: 'Markers', inline: 'Inline' }, help: 'Bible-study sections anchored to verses.' },
  { k: 'notes', name: 'My notes', modes: ['off', 'markers', 'inline'], labels: { off: 'Off', markers: 'Markers', inline: 'Inline' }, help: 'Your own notes, shown where you wrote them.' },
];
const PRESETS = {
  reading: { strongs: 'off', interlinear: 'off', footnotes: 'off', xrefs: 'off', commentary: 'off', studies: 'off', notes: 'markers' },
  study: { strongs: 'tap', interlinear: 'off', footnotes: 'markers', xrefs: 'markers', commentary: 'inline', studies: 'inline', notes: 'inline' },
  original: { strongs: 'inline', interlinear: 'inline', footnotes: 'markers', xrefs: 'off', commentary: 'off', studies: 'off', notes: 'markers' },
};
const KEY = 'notationbible:v1';
let S = {};
try { S = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { S = {}; }
S.set = Object.assign({ size: 19, font: 'serif', layout: 'para', nums: true, markup: true, rate: 1, voice: '', cont: true }, S.set || {});
S.set.layers = Object.assign({}, PRESETS.study, S.set.layers || {});
S.lastOn = S.lastOn || {};
S.ann = S.ann || [];
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };

/* ---------- data ---------- */
const cache = {};
const getJSON = p => cache[p] ??= fetch(p).then(r => r.ok ? r.json() : null).catch(() => null);
let M = { books: {}, layers: { footnotes: { books: [] }, xrefs: { books: [] }, commentary: [] } };
const lay = (name, b) => (M.layers[name]?.books || []).includes(b) ? getJSON(`data/${name}/${b}.json`) : null;
const lexFile = n => getJSON(n[0] === 'H' ? 'data/lexicon/hebrew.json' : 'data/lexicon/greek.json');
let LEX = {};
async function loadLex() { const [g, h] = await Promise.all([lexFile('G'), lexFile('H')]); LEX = { ...(g || {}), ...(h || {}) }; }
const plain = toks => toks.map(t => typeof t === 'string' ? t : t[0]).join('');
const nums = t => t[1].split(' ');

/* ---------- references ---------- */
const label = (b, c, v) => `${b === 'psalms' ? 'Psalm' : BY[b]?.name || b} ${c}${v ? ':' + v : ''}`;
const anchorLabel = a => { const p = a.split('.'); return p.length === 3 && BY[p[0]] ? label(p[0], p[1], p[2]) : a; };
const norm = s => s.toLowerCase().replace(/[\s.]/g, '');
const bookByName = n => { const k = norm(n); return BOOKS.find(b => norm(b.name) === k) || (k === 'psalm' ? BY.psalms : null); };
const REF_RE = new RegExp(`\\b(${[...BOOKS.map(b => b.name), 'Psalm'].sort((a, b) => b.length - a.length).map(n => n.replace(/ /g, '\\s+')).join('|')})\\s+(\\d+):(\\d+)(?:[–-](\\d+))?`, 'g');
function parseRef(q) {
  const m = q.trim().toLowerCase().match(/^((?:[1-3]\s*)?[a-z][a-z .]*?)\s*(\d+)?(?:\s*[:.]\s*(\d+))?$/);
  if (!m) return null;
  const key = m[1].replace(/[\s.]/g, '');
  if (key.length < 2) return null;
  const b = BY[ALIASES[key]] || BOOKS.find(x => x.id.replace(/-/g, '') === key) || BOOKS.find(x => x.id.replace(/-/g, '').startsWith(key));
  if (!b) return null;
  return { b: b.id, c: Math.min(+(m[2] || 1), b.ch), v: m[3] ? +m[3] : null };
}
const hashOf = (b, c, v) => `#${b}-${c}${v ? '-' + v : ''}`;
function parseHash(h) {
  h = h.replace(/^#/, '');
  let m = h.match(/^(.+)-(\d+)-(\d+)$/);
  if (m && BY[m[1]]) return { b: m[1], c: +m[2], v: +m[3] };
  m = h.match(/^(.+)-(\d+)$/);
  if (m && BY[m[1]]) return { b: m[1], c: +m[2], v: null };
  return null;
}
// Light markup for notes, commentary and studies: **bold**, *italic*, ==highlight==, refs and Strong's numbers become links.
function rich(t) {
  return esc(t).split(/\n{2,}/).map(p => '<p>' + p
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/==(.+?)==/g, '<mark class="hl-gold">$1</mark>')
    .replace(REF_RE, (m, bk, c, v) => { const b = bookByName(bk); return b ? `<a class="ref" href="${hashOf(b.id, c, v)}">${m}</a>` : m; })
    .replace(/\b([GH]\d{1,4})\b/g, '<button class="sref" data-s="$1">$1</button>')
    .replace(/\n/g, '<br>') + '</p>').join('');
}
const lord = s => esc(s).replace(/\bLORD\b/g, '<span class="sc">Lord</span>');

/* ---------- state ---------- */
let cur = parseHash(location.hash) || parseHash(S.last || '') || { b: 'john', c: 1, v: null };
let chap = null; // data for the rendered chapter
let studyIdx = [];
const reader = $('#reader');

/* ---------- text-offset engine (shared by verses and every note-like text) ---------- */
function textNodes(el) {
  const out = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: n => { const s = n.parentElement.closest('[data-skip]'); return s && el.contains(s) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
  });
  let n; while ((n = w.nextNode())) out.push(n);
  return out;
}
const plainLen = el => textNodes(el).reduce((a, n) => a + n.length, 0);
function offsetIn(el, node, off) {
  const r = document.createRange(); r.setStart(el, 0);
  try { r.setEnd(node, off); } catch { return 0; }
  const f = r.cloneContents(); f.querySelectorAll('[data-skip]').forEach(x => x.remove());
  return f.textContent.length;
}
function wrap(el, s, e, cls, aid) {
  let pos = 0;
  for (const n of textNodes(el)) {
    const L = n.length, a = Math.max(s, pos), z = Math.min(e, pos + L);
    if (a < z) {
      let t = n;
      if (z < pos + L) t.splitText(z - pos);
      if (a > pos) t = t.splitText(a - pos);
      const m = document.createElement('mark'); m.className = cls; m.dataset.aid = aid;
      t.parentNode.insertBefore(m, t); m.appendChild(t);
    }
    pos += L;
  }
}
function insertAt(el, off, node) {
  let pos = 0;
  for (const n of textNodes(el)) {
    if (off <= pos + n.length) { const rest = n.splitText(off - pos); rest.parentNode.insertBefore(node, rest); return; }
    pos += n.length;
  }
  el.appendChild(node);
}
const KCLS = { gold: 'hl-gold', sage: 'hl-sage', sky: 'hl-sky', rose: 'hl-rose', u: 'mk-u', b: 'mk-b', note: 'mk-note' };
function applyMarks() {
  $$('mark[data-aid]').forEach(m => { const p = m.parentNode; m.replaceWith(...m.childNodes); p.normalize(); });
  const byA = {};
  for (const a of S.ann) (byA[a.a] ||= []).push(a);
  for (const el of $$('[data-anchor]')) for (const a of byA[el.dataset.anchor] || []) wrap(el, a.s, a.e, KCLS[a.k], a.id);
  document.body.classList.toggle('nomarkup', !S.set.markup);
}

/* ---------- render chapter ---------- */
async function loadChapter(b, c) {
  const [t, fn, xr, cms] = await Promise.all([
    getJSON(`data/bsb/${b}.json`), lay('footnotes', b), lay('xrefs', b),
    Promise.all((M.layers.commentary || []).map(s => s.books.includes(b) ? getJSON(`data/commentary/${s.id}/${b}.json`).then(d => ({ s, d })) : null)),
  ]);
  const cm = [];
  for (const x of cms) if (x?.d) for (const [r, txt] of Object.entries(x.d)) {
    const m = r.match(/^(\d+):(\d+)(?:-(\d+))?$/); if (!m || +m[1] !== c) continue;
    cm.push({ src: x.s, r, s: +m[2], e: +(m[3] || m[2]), txt, anchor: `cm:${x.s.id}:${b}:${r}` });
  }
  const st = [];
  for (const s of studyIdx) if (s.refs.some(r => r.startsWith(`${b}.${c}.`))) {
    const d = await getJSON(`data/studies/${s.id}.json`);
    d?.sections.forEach((sec, i) => { const p = sec.ref.split('.'); if (p[0] === b && +p[1] === c) st.push({ s, d, sec, i, v: +p[2], anchor: `st:${s.id}:${i}` }); });
  }
  return { b, c, verses: t?.chapters?.[c] || null, fn: fn || {}, xr: xr || {}, cm, st };
}
const notesFor = id => groups().filter(g => g.k === 'note' && g.items.some(a => a.a === id));
function groups() {
  const m = new Map();
  for (const a of S.ann) { if (!m.has(a.g)) m.set(a.g, { g: a.g, k: a.k, n: a.n, t: a.t, q: a.q, items: [] }); const g = m.get(a.g); g.items.push(a); if (a.n) g.n = a.n; }
  return [...m.values()];
}
const ICON = {
  note: '<svg viewBox="0 0 24 24"><path d="M5 19l1-4L16 5l3 3L9 18z"/></svg>',
  mic: '<svg viewBox="0 0 24 24"><rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v3"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>',
};

async function render() {
  const { b, c } = cur, book = BY[b];
  $('#reflabel').textContent = `${book.name} ${c}`;
  document.title = `${book.name} ${c} · Notation Bible`;
  chap = await loadChapter(b, c);
  const L = S.set.layers;
  const pr = prevOf(b, c), nx = nextOf(b, c);
  $('#pprev').textContent = pr ? '← ' + label(pr.b, pr.c) : ''; $('#pprev').href = pr ? hashOf(pr.b, pr.c) : '#';
  $('#pnext').textContent = nx ? label(nx.b, nx.c) + ' →' : ''; $('#pnext').href = nx ? hashOf(nx.b, nx.c) : '#';
  const head = `<header class="chead"><span class="cnum">${c}</span><span class="cbook"><b>${esc(book.name)}</b>Berean Standard Bible</span></header>` +
    (M.sample ? `<p class="sample">Preview data: a few sample chapters with hand-entered Strong's tags. Footnotes, commentary and the study here are samples; the import scripts bring in the full BSB and real sources.</p>` : '');
  if (!chap.verses) {
    const have = Object.entries(M.books).flatMap(([bk, chs]) => Object.keys(chs).map(ch => `<a href="${hashOf(bk, ch)}">${label(bk, ch)}</a>`));
    reader.className = 'reader';
    reader.innerHTML = head + `<div class="missing"><h3>${esc(label(b, c))} isn't in this data set yet</h3><p>Run the import in <code>scripts/</code> to add the full Berean Standard Bible. Chapters available now: ${have.join(' · ')}</p></div>`;
    return;
  }
  // Paragraph layout keeps flowing; an inline note or other layer block breaks the text only where it sits.
  const verseMode = S.set.layout === 'verse';
  reader.className = 'reader' + (verseMode ? ' verse' : '') + (S.set.nums ? '' : ' nonum') + (L.interlinear === 'inline' ? ' interlinear' : '');
  reader.style.setProperty('--size', S.set.size + 'px');
  reader.style.setProperty('--text', S.set.font === 'sans' ? 'var(--sans)' : 'var(--serif)');
  let fnLetter = 0;
  const html = chap.verses.map((toks, i) => {
    const n = i + 1, id = `${b}.${c}.${n}`, key = `${c}:${n}`;
    const words = toks.map(t => {
      if (typeof t === 'string') return esc(t);
      const [en, s, orig] = t;
      if (L.interlinear === 'inline') {
        const lx = LEX[nums(t)[0]] || [];
        const lang = s[0] === 'H' ? 'he' : 'gr';
        return `<span class="il" data-s="${esc(s)}"><span class="w">${lord(en)}</span><span class="og ${lang}${orig ? '' : ' lemma'}" data-skip title="${orig ? 'Original word' : 'Lexical form'}">${esc(orig || lx[0] || '')}</span><span class="tl" data-skip>${esc(lx[1] || '')}</span><span class="snl" data-skip>${esc(s)}</span></span>`;
      }
      const sup = L.strongs === 'inline' ? `<sup class="sn" data-skip data-s="${esc(s)}">${esc(s.replace(/[GH]/g, ''))}</sup>` : '';
      return `<span class="w${L.strongs !== 'off' ? ' tag' : ''}" data-s="${esc(s)}">${lord(en)}</span>${sup}`;
    }).join('');
    const fns = chap.fn[key] || [], xrs = chap.xr[key] || [];
    const cmStart = chap.cm.filter(x => x.s === n), cmEnd = chap.cm.filter(x => x.e === n);
    const sts = chap.st.filter(x => x.v === n), nts = notesFor(id);
    let mk = '';
    if (L.xrefs === 'markers' && xrs.length) mk += `<button class="mk" data-skip data-panel="${n}" title="Cross references"><svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg></button>`;
    if (L.commentary === 'markers' && cmStart.length) mk += `<button class="mk" data-skip data-panel="${n}" title="Commentary">C</button>`;
    if (L.studies === 'markers' && sts.length) mk += `<button class="mk" data-skip data-panel="${n}" title="Study">S</button>`;
    if (L.notes === 'markers' && nts.length) mk += `<button class="mk" data-skip data-note="${nts[0].g}" title="My note">${ICON.note}</button>`;
    let ib = '';
    if (L.footnotes === 'inline' && fns.length) ib += fns.map((f, j) => `<div class="ib fn"><h4>Footnote ${String.fromCharCode(97 + fnLetter + j)} · ${esc(label(b, c, n))}</h4><span data-anchor="fn:${id}:${j}">${rich(f[1])}</span></div>`).join('');
    if (L.footnotes !== 'off') fnLetter += fns.length;
    if (L.xrefs === 'inline' && xrs.length) ib += `<div class="ib xr"><h4>Cross references · ${esc(label(b, c, n))}</h4>${xrs.map(r => `<a href="${hashOf(...r.split('.'))}">${esc(anchorLabel(r))}</a>`).join('')}</div>`;
    if (L.commentary === 'inline') ib += cmEnd.map(x => `<section class="ib cm"><h4>Commentary · ${esc(BY[b].name)} ${esc(x.r.replace('-', '–'))} · ${esc(x.src.name)}</h4><div data-anchor="${x.anchor}">${rich(x.txt)}</div></section>`).join('');
    if (L.studies === 'inline') ib += sts.map(x => `<section class="ib st"><h4>Study · ${esc(x.d.title)} · ${esc(x.sec.heading)}</h4><div data-anchor="${x.anchor}">${rich(x.sec.body)}</div><button class="lnk" data-study="${x.s.id}">Open the full study</button></section>`).join('');
    if (L.notes === 'inline') ib += nts.map(g => `<div class="ib nt"><h4>My note · ${esc(label(b, c, n))}</h4><div data-anchor="nt:${g.g}">${rich(g.n || '')}</div><button class="lnk" data-note="${g.g}">Edit note</button></div>`).join('');
    return `<div class="vb" id="v${n}" data-v="${n}"><span class="v" data-anchor="${id}" data-v="${n}"><a class="vn" data-skip href="${hashOf(b, c, n)}" data-panel="${n}">${n}</a>${words}</span>${mk}${verseMode ? '' : ' '}</div>${ib}`;
  }).join('');
  reader.innerHTML = head + `<div class="text">${html}</div>`;
  // footnote letters sit right after the phrase they annotate
  if (L.footnotes !== 'off') {
    let k = 0;
    chap.verses.forEach((toks, i) => {
      const n = i + 1, fns = chap.fn[`${c}:${n}`] || []; const el = reader.querySelector(`#v${n} .v`);
      fns.forEach(f => {
        const at = plain(toks).indexOf(f[0]);
        const btn = document.createElement('button'); btn.className = 'fm'; btn.dataset.skip = ''; btn.dataset.panel = n; btn.title = f[1];
        btn.textContent = String.fromCharCode(97 + k++);
        insertAt(el, at < 0 ? plainLen(el) : at + f[0].length, btn);
      });
    });
  }
  applyMarks();
  if (cur.v) { const el = $('#v' + cur.v); if (el) { el.scrollIntoView({ block: 'center' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1900); } }
  else window.scrollTo(0, 0);
  if (speech.on) highlightSpeaking();
}
const prevOf = (b, c) => c > 1 ? { b, c: c - 1 } : BY[b].i > 0 ? { b: BOOKS[BY[b].i - 1].id, c: BOOKS[BY[b].i - 1].ch } : null;
const nextOf = (b, c) => c < BY[b].ch ? { b, c: c + 1 } : BY[b].i < 65 ? { b: BOOKS[BY[b].i + 1].id, c: 1 } : null;
const go = (b, c, v) => { const h = hashOf(b, c, v); if (location.hash === h) { cur = { b, c: +c, v: v ? +v : null }; render(); } else location.hash = h; };

/* ---------- feature menu ---------- */
const menu = $('#menu'), menuBtn = $('#menubtn');
const MI = {
  read: '<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
  goto: '<svg viewBox="0 0 24 24"><path d="M5 4.5h9.5a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z"/></svg>',
  study: '<svg viewBox="0 0 24 24"><path d="M3.5 5.5c3-1 6-1 8.5 1v13c-2.5-2-5.5-2-8.5-1zM20.5 5.5c-3-1-6-1-8.5 1v13c2.5-2 5.5-2 8.5-1z"/></svg>',
  saved: '<svg viewBox="0 0 24 24"><path d="M7 3.5h10v17l-5-3.6-5 3.6z"/></svg>',
  set: '<svg viewBox="0 0 24 24"><path d="M12 3.5l8.5 4.5-8.5 4.5L3.5 8z"/><path d="M3.5 12l8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5"/></svg>',
};
function renderMenu() {
  const L = S.set.layers, n = groups().length;
  const preset = Object.entries(PRESETS).find(([, p]) => LAYERS.every(l => p[l.k] === L[l.k]))?.[0] || '';
  const sw = (k, on, name, sub) => `<button class="mi" role="menuitemcheckbox" aria-checked="${on}" data-layer="${k}"><span class="lab">${name}</span>${sub ? `<span class="sub">${sub}</span>` : ''}<span class="sw" aria-hidden="true"></span></button>`;
  menu.innerHTML = `<h4>Tools</h4>
    <button class="mi${speech.on ? ' live' : ''}" role="menuitem" id="playbtn">${MI.read}<span class="lab">${speech.on ? 'Stop reading aloud' : 'Read aloud'}</span></button>
    <button class="mi" role="menuitem" id="searchbtn">${MI.search}<span class="lab">Search</span><kbd>/</kbd></button>
    <button class="mi" role="menuitem" id="gotobtn">${MI.goto}<span class="lab">Go to book and chapter</span></button>
    <button class="mi" role="menuitem" id="studybtn">${MI.study}<span class="lab">Bible studies</span></button>
    <button class="mi" role="menuitem" id="savedbtn">${MI.saved}<span class="lab">Highlights &amp; notes</span>${n ? `<span class="sub">${n}</span>` : ''}</button>
    <hr><h4>Show</h4>
    <div class="seg" role="group" aria-label="Presets">${[['reading', 'Reading'], ['study', 'Study'], ['original', 'Original']].map(([k, t]) => `<button data-preset="${k}" aria-pressed="${preset === k}">${t}</button>`).join('')}</div>
    ${LAYERS.map(l => sw(l.k, L[l.k] !== 'off', l.name, L[l.k] !== 'off' && l.modes.length > 2 ? l.labels[L[l.k]] : '')).join('')}
    ${sw('markup', S.set.markup, 'Highlights &amp; markup', '')}
    <hr><button class="mi" role="menuitem" id="setbtn">${MI.set}<span class="lab">Layer modes &amp; reading settings</span></button>`;
}
function openMenu() { renderMenu(); menu.hidden = false; menuBtn.setAttribute('aria-expanded', 'true'); menu.querySelector('.mi').focus(); }
function closeMenu(focus) { if (menu.hidden) return; menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); if (focus) menuBtn.focus(); }
function toggleLayer(k) {
  const L = S.set.layers;
  if (k === 'markup') S.set.markup = !S.set.markup;
  else { const l = LAYERS.find(x => x.k === k); if (L[k] === 'off') L[k] = S.lastOn[k] || l.modes[1]; else { S.lastOn[k] = L[k]; L[k] = 'off'; } }
  save(); render(); renderMenu();
  const el = menu.querySelector(`[data-layer="${k}"]`); el && el.focus();
}
menu.addEventListener('keydown', e => {
  const items = $$('.mi, .seg button', menu), i = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  else if (e.key === 'Escape') { e.stopPropagation(); closeMenu(true); }
});

/* ---------- sheet ---------- */
const sheet = $('#sheet'), scrim = $('#scrim'); let backFn = null;
function openSheet(title, html, back) {
  $('#sheettitle').textContent = title; $('#sheetbody').innerHTML = html; $('#sheetbody').scrollTop = 0;
  backFn = back || null; $('#sheetback').hidden = !back;
  sheet.hidden = scrim.hidden = false; applyMarks();
  setTimeout(() => (sheet.querySelector('[autofocus]') || $('#sheetclose')).focus(), 30);
}
function closeSheet() { sheet.hidden = scrim.hidden = true; stopDictation(); }
$('#sheetclose').onclick = closeSheet; scrim.onclick = closeSheet; $('#sheetback').onclick = () => backFn && backFn();
let toastT; function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600); }

/* ---------- picker ---------- */
function openPicker(test) {
  test ||= BY[cur.b].t;
  const html = `<div class="seg" role="group"><button data-test="ot" aria-pressed="${test === 'ot'}">Old Testament</button><button data-test="nt" aria-pressed="${test === 'nt'}">New Testament</button></div>
  <div class="books">${BOOKS.filter(b => b.t === test).map(b => `<button data-book="${b.id}" class="${b.id === cur.b ? 'cur' : ''}">${esc(b.name)}${M.books[b.id] ? '<span class="dot" title="Has text in this data set"></span>' : ''}</button>`).join('')}</div>`;
  openSheet('Choose a book', html);
}
function openChapters(b) {
  const have = M.books[b] || {};
  openSheet(BY[b].name, `<p class="big3">${esc(BY[b].name)}</p><div class="chs">${Array.from({ length: BY[b].ch }, (_, i) => i + 1).map(c => `<button data-ch="${c}" data-b="${b}" class="${have[c] ? 'has' : ''} ${b === cur.b && c === cur.c ? 'cur' : ''}">${c}</button>`).join('')}</div>${Object.keys(have).length < BY[b].ch ? '<p class="hint">Bold chapters have text in this data set.</p>' : ''}`, () => openPicker(BY[b].t));
}

/* ---------- verse panel: every layer for one verse ---------- */
function versePanel(n) {
  if (!chap?.verses) return;
  const { b, c } = chap, id = `${b}.${c}.${n}`, key = `${c}:${n}`, toks = chap.verses[n - 1];
  const tagged = toks.filter(t => typeof t !== 'string');
  const fns = chap.fn[key] || [], xrs = chap.xr[key] || [];
  const cms = chap.cm.filter(x => x.s <= n && x.e >= n), sts = chap.st.filter(x => x.v === n), nts = notesFor(id);
  let h = `<div class="row"><button class="btn" data-read="${n}">${ICON.play}Read from here</button><button class="btn" data-copy="${n}">Copy</button><button class="btn" data-newnote="${n}">${ICON.note}Note</button><button class="btn rec" data-voicenote="${n}">${ICON.mic}Dictate note</button></div>
  <p class="quote" style="margin-top:16px">${lord(plain(toks))}</p>`;
  if (tagged.length) h += `<h3>Words · Strong's concordance</h3><div class="words">${tagged.map(t => { const x = LEX[nums(t)[0]] || []; return `<button data-s="${esc(t[1])}"><span class="en">${lord(t[0])}</span><span class="og ${t[1][0] === 'H' ? 'he' : 'gr'}">${esc(t[2] || x[0] || '')}</span><span class="gl">${esc(t[1])} · ${esc(x[1] || '')} · ${esc(x[2] || '')}</span></button>`; }).join('')}</div>`;
  if (fns.length) h += `<h3>Footnotes</h3>${fns.map((f, j) => `<div class="prose"><b>${esc(f[0])}:</b> <span data-anchor="fn:${id}:${j}">${rich(f[1])}</span></div>`).join('')}`;
  if (xrs.length) h += `<h3>Cross references</h3><ul class="list">${xrs.map(r => `<li><a href="${hashOf(...r.split('.'))}"><b>${esc(anchorLabel(r))}</b><span class="xprev" data-ref="${r}"></span></a></li>`).join('')}</ul>`;
  if (cms.length) h += cms.map(x => `<h3>Commentary · ${esc(BY[b].name)} ${esc(x.r.replace('-', '–'))} · ${esc(x.src.name)}</h3><div class="prose" data-anchor="${x.anchor}">${rich(x.txt)}</div>`).join('');
  if (sts.length) h += sts.map(x => `<h3>Study · ${esc(x.d.title)}</h3><div class="prose"><b>${esc(x.sec.heading)}</b><div data-anchor="${x.anchor}">${rich(x.sec.body)}</div></div><button class="btn" data-study="${x.s.id}">Open the full study</button>`).join('');
  if (nts.length) h += `<h3>My notes</h3>${nts.map(g => `<div class="ib nt" style="margin-left:0"><div data-anchor="nt:${g.g}">${rich(g.n || '')}</div><button class="lnk" data-note="${g.g}">Edit note</button></div>`).join('')}`;
  openSheet(label(b, c, n), h);
  // fill cross-reference previews when that text is available
  $$('.xprev').forEach(async el => { const [rb, rc, rv] = el.dataset.ref.split('.'); const d = await getJSON(`data/bsb/${rb}.json`); const v = d?.chapters?.[rc]?.[rv - 1]; el.textContent = v ? plain(v) : 'Not in this data set yet'; });
}

/* ---------- lexicon + concordance ---------- */
async function lexPanel(s, back) {
  const list = s.split(' ');
  if (list.length > 1) { openSheet('Strong\'s numbers', `<div class="words">${list.map(n => { const x = LEX[n] || []; return `<button data-s="${n}"><span class="en">${esc(x[2] || n)}</span><span class="og ${n[0] === 'H' ? 'he' : 'gr'}">${esc(x[0] || '')}</span><span class="gl">${n} · ${esc(x[1] || '')}</span></button>`; }).join('')}</div>`, back); return; }
  const n = list[0], x = LEX[n];
  const occ = [], tally = {};
  for (const bk of Object.keys(M.books)) {
    const d = await getJSON(`data/bsb/${bk}.json`); if (!d) continue;
    for (const [c, vs] of Object.entries(d.chapters)) vs.forEach((toks, i) => {
      if (!toks.some(t => typeof t !== 'string' && nums(t).includes(n))) return;
      toks.forEach(t => { if (typeof t !== 'string' && nums(t).includes(n)) { const w = t[0].toLowerCase(); tally[w] = (tally[w] || 0) + 1; } });
      occ.push({ b: bk, c, v: i + 1, html: toks.map(t => typeof t === 'string' ? esc(t) : nums(t).includes(n) ? `<mark>${lord(t[0])}</mark>` : lord(t[0])).join('') });
    });
  }
  const lang = n[0] === 'H' ? 'he' : 'gr';
  const h = x ? `<div class="lexhead"><span class="og ${lang}">${esc(x[0])}</span><span class="tl">${esc(x[1])}</span><span class="snl">${n}</span></div>
    <p class="gloss">${esc(x[2])}</p><div class="prose" data-anchor="lx:${n}">${rich(x[3])}</div><p class="hint">${esc(M.layers.lexicon?.source || '')}</p>` : `<p class="empty">No lexicon entry for ${esc(n)} in this data set.</p>`;
  openSheet(n, h + `<h3>Translated in the BSB as</h3><div class="tally">${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([w, k]) => `<span>${esc(w)}<b>${k}</b></span>`).join('')}</div>
    <h3>Concordance · ${occ.length} verse${occ.length === 1 ? '' : 's'}${M.sample ? ' in the preview chapters' : ''}</h3>
    <ul class="list">${occ.map(o => `<li><a href="${hashOf(o.b, o.c, o.v)}"><b>${esc(label(o.b, o.c, o.v))}</b><span>${o.html}</span></a></li>`).join('')}</ul>`, back);
}

/* ---------- search ---------- */
function openSearch(q = '') {
  openSheet('Search', `<div class="field"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg><input id="q" type="search" autofocus placeholder="Words, a reference, or a Strong's number" value="${esc(q)}" autocomplete="off"><button class="ico" id="qmic" aria-label="Search by voice">${ICON.mic}</button></div><div id="qres"><p class="hint">Try <b>light</b>, <b>"grace and truth"</b>, <b>jn 1:14</b> or <b>G3056</b>.</p></div>`);
  const inp = $('#q'); let t;
  inp.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => runSearch(inp.value), 180); });
  $('#qmic').onclick = () => dictate(txt => { inp.value = txt; runSearch(txt); }, $('#qmic'));
  if (q) runSearch(q);
}
async function runSearch(q) {
  const out = $('#qres'); if (!out) return; q = q.trim();
  if (!q) { out.innerHTML = ''; return; }
  if (/^[GH]\d{1,4}$/i.test(q)) { lexPanel(q.toUpperCase(), () => openSearch(q)); return; }
  const ref = parseRef(q);
  let h = ref ? `<a class="goto" href="${hashOf(ref.b, ref.c, ref.v)}">Go to ${esc(label(ref.b, ref.c, ref.v))}<span>→</span></a>` : '';
  const phrase = q.match(/^"(.+)"$/)?.[1]?.toLowerCase();
  const words = phrase ? [phrase] : q.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  const hits = [];
  for (const bk of Object.keys(M.books)) {
    const d = await getJSON(`data/bsb/${bk}.json`); if (!d) continue;
    for (const [c, vs] of Object.entries(d.chapters)) vs.forEach((toks, i) => { const p = plain(toks), l = p.toLowerCase(); if (words.length && words.every(w => l.includes(w))) hits.push({ b: bk, c, v: i + 1, p }); });
  }
  const re = words.length ? new RegExp('(' + words.map(w => esc(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi') : null;
  h += `<p class="hint">${hits.length} verse${hits.length === 1 ? '' : 's'}${M.sample ? ' in the preview chapters' : ''}</p><ul class="list">${hits.slice(0, 300).map(x => `<li><a href="${hashOf(x.b, x.c, x.v)}"><b>${esc(label(x.b, x.c, x.v))}</b><span>${re ? esc(x.p).replace(re, '<mark>$1</mark>') : esc(x.p)}</span></a></li>`).join('')}</ul>`;
  if (!hits.length && !ref) h += `<p class="empty"><b>No matches</b>Check spelling, or search fewer words.</p>`;
  out.innerHTML = h;
}

/* ---------- studies ---------- */
function openStudies() {
  openSheet('Bible studies', studyIdx.length ? `<ul class="list">${studyIdx.map(s => `<li><button data-study="${s.id}"><b>${esc(s.title)}</b><span>${esc(s.summary)}</span><span class="meta">${s.refs.map(anchorLabel).join(' · ')}</span></button></li>`).join('')}</ul>` : '<p class="empty">No studies in this data set.</p>');
}
async function openStudy(id) {
  const d = await getJSON(`data/studies/${id}.json`); if (!d) return toast('Study not found');
  openSheet(d.title, `<p class="hint" style="margin-top:0">${esc(d.author)} · select any words to highlight or annotate them</p>${d.sections.map((s, i) => `<h3>${esc(s.heading)} · <a class="ref" href="${hashOf(...s.ref.split('.'))}">${esc(anchorLabel(s.ref))}</a></h3><div class="prose" data-anchor="st:${id}:${i}">${rich(s.body)}</div>`).join('')}`, openStudies);
}

/* ---------- saved ---------- */
function openSaved(filter = 'all') {
  const gs = groups().filter(g => filter === 'all' || (filter === 'notes' ? g.k === 'note' : g.k !== 'note')).sort((a, b) => b.t - a.t);
  const sw = k => k === 'note' ? 'Note' : k === 'u' ? 'Underline' : k === 'b' ? 'Bold' : 'Highlight';
  openSheet('Highlights & notes', `<div class="seg" role="group">${['all', 'highlights', 'notes'].map(f => `<button data-saved="${f}" aria-pressed="${f === filter}">${f[0].toUpperCase() + f.slice(1)}</button>`).join('')}</div>
  ${gs.length ? `<ul class="list" style="margin-top:12px">${gs.map(g => { const a = g.items[0].a; return `<li><button data-open="${esc(a)}" data-g="${g.g}"><b>${esc(where(a))} · ${sw(g.k)}</b><span><mark class="${KCLS[g.k]}">${esc(g.q || '')}</mark></span>${g.n ? `<span class="meta">${esc(g.n)}</span>` : ''}</button></li>`; }).join('')}</ul>` : '<p class="empty"><b>Nothing saved yet</b>Select words in a verse, note, commentary or study to mark them up.</p>'}`);
}
function where(a) {
  if (/^[\w-]+\.\d+\.\d+$/.test(a)) return anchorLabel(a);
  const p = a.split(':');
  if (p[0] === 'cm') return `Commentary, ${BY[p[2]]?.name} ${p[3]}:${p[4]}`;
  if (p[0] === 'st') return `Study: ${studyIdx.find(s => s.id === p[1])?.title || p[1]}`;
  if (p[0] === 'fn') return `Footnote, ${anchorLabel(p[1])}`;
  if (p[0] === 'nt') return 'In a note';
  if (p[0] === 'lx') return `Lexicon ${p[1]}`;
  return a;
}
function openAnchor(a) {
  if (/^[\w-]+\.\d+\.\d+$/.test(a)) { closeSheet(); go(...a.split('.')); return; }
  const p = a.split(':');
  if (p[0] === 'st') return openStudy(p[1]);
  if (p[0] === 'cm') { closeSheet(); return go(p[2], p[3], p[4].split('-')[0]); }
  if (p[0] === 'fn') { closeSheet(); return go(...p[1].split('.')); }
  if (p[0] === 'lx') return lexPanel(p[1]);
  if (p[0] === 'nt') return noteEditor({ g: p[1] });
}

/* ---------- markup bar ---------- */
let targets = [], selT;
const markbar = $('#markbar');
document.addEventListener('selectionchange', () => { clearTimeout(selT); selT = setTimeout(readSelection, 140); });
function readSelection() {
  const sel = getSelection();
  if (!sel.rangeCount || sel.isCollapsed) { if (!markbar.contains(document.activeElement)) markbar.hidden = true; return; }
  const r = sel.getRangeAt(0); targets = [];
  for (const el of $$('[data-anchor]')) {
    if (!r.intersectsNode(el)) continue;
    const s = el.contains(r.startContainer) ? offsetIn(el, r.startContainer, r.startOffset) : 0;
    const e = el.contains(r.endContainer) ? offsetIn(el, r.endContainer, r.endOffset) : plainLen(el);
    if (e > s) targets.push({ a: el.dataset.anchor, s, e });
  }
  if (!targets.length) { markbar.hidden = true; return; }
  targets.q = sel.toString().replace(/\s+/g, ' ').trim().slice(0, 280);
  $('#marklabel').textContent = targets.length > 1 ? `${where(targets[0].a)} +${targets.length - 1}` : where(targets[0].a);
  markbar.hidden = false; $('#audiobar').hidden = true;
}
markbar.addEventListener('pointerdown', e => e.preventDefault()); // keep the text selection alive
markbar.addEventListener('click', e => {
  const k = e.target.closest('[data-k]')?.dataset.k; if (!k || !targets.length) return;
  if (k === 'clear') S.ann = S.ann.filter(a => !targets.some(t => t.a === a.a && a.s < t.e && a.e > t.s));
  else if (k === 'note') { const t = targets; getSelection().removeAllRanges(); markbar.hidden = true; return noteEditor({ targets: t }); }
  else { const g = uid(); for (const t of targets) S.ann.push({ id: uid(), g, a: t.a, s: t.s, e: t.e, k, q: targets.q, t: Date.now() }); }
  save(); getSelection().removeAllRanges(); markbar.hidden = true; targets = []; applyMarks(); if (k === 'clear') render();
});

/* ---------- notes (with dictation) ---------- */
function noteEditor({ targets: t, g, verse, listen }) {
  const existing = g ? groups().find(x => x.g === g) : null;
  if (verse && chap?.verses) { const id = `${chap.b}.${chap.c}.${verse}`; t = [{ a: id, s: 0, e: plain(chap.verses[verse - 1]).length }]; t.q = plain(chap.verses[verse - 1]); }
  const quote = existing ? existing.q : t?.q;
  openSheet(existing ? 'Edit note' : 'New note', `<p class="quote">${esc(quote || '')}</p>
    <textarea id="ntext" autofocus placeholder="Write a note. **bold**, *italic*, ==highlight==, and references like John 3:16 or G3056 become links.">${esc(existing?.n || '')}</textarea>
    <div class="row" style="margin-top:10px"><button class="btn rec" id="nmic">${ICON.mic}<span>Dictate</span></button><span class="hint" id="nmicstate" style="margin:0"></span></div>
    <div class="preview prose" id="nprev"></div>
    <div class="row end">${existing ? '<button class="btn" id="ndel">Delete</button>' : ''}<button class="btn primary" id="nsave">Save note</button></div>`);
  const ta = $('#ntext'), pv = $('#nprev');
  const upd = () => { pv.innerHTML = ta.value.trim() ? rich(ta.value) : '<span class="hint">Preview</span>'; };
  ta.addEventListener('input', upd); upd();
  $('#nmic').onclick = () => dictate(txt => { ta.value = (ta.value ? ta.value.replace(/\s*$/, ' ') : '') + txt; upd(); }, $('#nmic'), $('#nmicstate'));
  $('#nsave').onclick = () => {
    const n = ta.value.trim(); if (!n) return toast('Write something first');
    if (existing) S.ann.forEach(a => { if (a.g === g) a.n = n; });
    else { const gg = uid(); for (const x of t) S.ann.push({ id: uid(), g: gg, a: x.a, s: x.s, e: x.e, k: 'note', n, q: t.q, t: Date.now() }); }
    save(); closeSheet(); render(); toast('Note saved');
  };
  if (existing) $('#ndel').onclick = () => { S.ann = S.ann.filter(a => a.g !== g); save(); closeSheet(); render(); toast('Note deleted'); };
  if (listen) $('#nmic').click();
}

/* ---------- speech to text ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null;
function stopDictation() { if (rec) { try { rec.stop(); } catch {} rec = null; } $$('.btn.rec.live, .ico.on').forEach(b => b.classList.remove('live', 'on')); }
function dictate(onText, btn, state) {
  if (rec) { stopDictation(); return; }
  if (!SR) { toast('Voice typing needs a browser with speech recognition, such as Chrome, Edge or Safari.'); return; }
  try { rec = new SR(); } catch { toast('Voice typing is not available here.'); return; }
  rec.lang = 'en-US'; rec.interimResults = true; rec.continuous = true;
  let finalText = '';
  rec.onresult = e => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) { finalText = r[0].transcript.trim(); onText(finalText); } else interim += r[0].transcript; }
    if (state) state.textContent = interim ? '… ' + interim : 'Listening';
  };
  rec.onerror = e => { toast(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'Microphone access is blocked. Allow it in your browser, or open the hosted app.' : 'Voice typing stopped: ' + e.error); stopDictation(); if (state) state.textContent = ''; };
  rec.onend = () => { if (state) state.textContent = ''; stopDictation(); };
  try { rec.start(); btn?.classList.add(btn.classList.contains('ico') ? 'on' : 'live'); if (state) state.textContent = 'Listening'; } catch { toast('Could not start the microphone.'); rec = null; }
}

/* ---------- read aloud (text to speech) ---------- */
const speech = { on: false, paused: false, v: 1, tok: 0 };
const synth = window.speechSynthesis;
function voices() { return synth ? synth.getVoices().filter(v => /^en/i.test(v.lang)) : []; }
function highlightSpeaking() { $$('.vb.speaking').forEach(e => e.classList.remove('speaking')); const el = $('#v' + speech.v); if (el) { el.classList.add('speaking'); el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); } $('#aulabel').textContent = label(cur.b, cur.c, speech.v); }
function speakVerse() {
  if (!speech.on || !chap?.verses) return;
  if (speech.v > chap.verses.length) {
    const nx = nextOf(cur.b, cur.c);
    if (S.set.cont && nx && M.books[nx.b]?.[nx.c]) { speech.v = 1; speech.wait = true; go(nx.b, nx.c); return; }
    return stopReading();
  }
  highlightSpeaking();
  const u = new SpeechSynthesisUtterance(plain(chap.verses[speech.v - 1]).replace(/\bLORD\b/g, 'Lord'));
  u.rate = +S.set.rate || 1; const vv = voices().find(v => v.voiceURI === S.set.voice); if (vv) u.voice = vv;
  const tok = ++speech.tok;
  u.onend = () => { if (speech.on && tok === speech.tok && !speech.paused) { speech.v++; speakVerse(); } };
  u.onerror = e => { if (e.error !== 'interrupted' && e.error !== 'canceled') { toast('Read aloud stopped: ' + e.error); stopReading(); } };
  synth.speak(u);
}
function startReading(v) {
  if (!synth) return toast('Read aloud needs a browser with speech synthesis.');
  if (!chap?.verses) return toast('Nothing to read in this chapter yet.');
  synth.cancel(); Object.assign(speech, { on: true, paused: false, v: v || 1 });
  $('#audiobar').hidden = false; markbar.hidden = true; setPauseIcon(); $('#arate').value = String(S.set.rate);
  speakVerse();
}
function stopReading() { speech.on = false; speech.tok++; synth?.cancel(); $('#audiobar').hidden = true; $$('.vb.speaking').forEach(e => e.classList.remove('speaking')); }
const setPauseIcon = () => { $('#apause').innerHTML = speech.paused ? ICON.play : ICON.pause; $('#apause').setAttribute('aria-label', speech.paused ? 'Resume' : 'Pause'); };
function jump(d) { if (!speech.on) return; speech.tok++; synth.cancel(); speech.paused = false; setPauseIcon(); speech.v = Math.max(1, speech.v + d); speakVerse(); }
$('#apause').onclick = () => { if (speech.paused) { synth.resume(); speech.paused = false; } else { synth.pause(); speech.paused = true; } setPauseIcon(); };
$('#astop').onclick = stopReading;
$('#aprev').onclick = () => jump(-1); $('#anext').onclick = () => jump(1);
$('#arate').onchange = e => { S.set.rate = +e.target.value; save(); if (speech.on) jump(0); };

/* ---------- settings ---------- */
function openSettings() {
  const L = S.set.layers;
  const preset = Object.entries(PRESETS).find(([, p]) => LAYERS.every(l => p[l.k] === L[l.k]))?.[0];
  const seg = (name, val, opts) => `<div class="seg" role="group">${opts.map(([v, t]) => `<button data-set="${name}" data-val="${v}" aria-pressed="${String(val) === String(v)}">${t}</button>`).join('')}</div>`;
  const vs = voices();
  openSheet('Layers & settings', `<div class="set">
    <div><label>Preset</label>${seg('preset', preset || '', [['reading', 'Reading'], ['study', 'Study'], ['original', 'Original language']])}${preset ? '' : '<p class="hint">Custom mix</p>'}</div>
    ${LAYERS.map(l => `<div class="lrow"><span>${l.name}</span><small>${l.help}</small>${seg('layer:' + l.k, L[l.k], l.modes.map(m => [m, l.labels[m]]))}</div>`).join('')}
    <div><label>Highlights and markup</label>${seg('markup', S.set.markup, [[true, 'Show'], [false, 'Hide']])}</div>
    <div><label for="sz">Text size</label><div class="range"><input id="sz" type="range" min="15" max="26" step="1" value="${S.set.size}"><output id="szo">${S.set.size}px</output></div></div>
    <div><label>Typeface</label>${seg('font', S.set.font, [['serif', 'Serif'], ['sans', 'Sans']])}</div>
    <div><label>Layout</label>${seg('layout', S.set.layout, [['para', 'Paragraph'], ['verse', 'Verse by verse']])}<p class="hint">In paragraph layout, inline notes and layers break the text only where they appear.</p></div>
    <div><label>Verse numbers</label>${seg('nums', S.set.nums, [[true, 'Show'], [false, 'Hide']])}</div>
    <div><label for="voice">Read-aloud voice</label><select id="voice"><option value="">System default</option>${vs.map(v => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === S.set.voice ? 'selected' : ''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('')}</select></div>
    <div><label>When a chapter ends</label>${seg('cont', S.set.cont, [[true, 'Keep reading'], [false, 'Stop']])}</div>
    <p class="hint">${esc(M.translation?.name || '')}: ${esc(M.translation?.license || '')}. Cross references from OpenBible.info (CC BY). Lexicon from STEPBible (CC BY 4.0) once imported.</p>
  </div>`);
  $('#sz').oninput = e => { S.set.size = +e.target.value; $('#szo').textContent = S.set.size + 'px'; reader.style.setProperty('--size', S.set.size + 'px'); save(); };
  $('#voice').onchange = e => { S.set.voice = e.target.value; save(); };
}
sheet.addEventListener('click', e => {
  const b = e.target.closest('[data-set]'); if (!b) return;
  const name = b.dataset.set, raw = b.dataset.val, val = raw === 'true' ? true : raw === 'false' ? false : raw;
  if (name === 'preset') Object.assign(S.set.layers, PRESETS[val]);
  else if (name.startsWith('layer:')) S.set.layers[name.slice(6)] = val;
  else S.set[name] = val;
  save(); render(); openSettings();
});

/* ---------- global clicks ---------- */
document.addEventListener('click', async e => {
  const t = e.target;
  const q = s => t.closest(s);
  if (q('#menubtn')) return menu.hidden ? openMenu() : closeMenu(true);
  if (menu.contains(t)) {
    if (q('[data-layer]')) return toggleLayer(q('[data-layer]').dataset.layer);
    if (q('[data-preset]')) { Object.assign(S.set.layers, PRESETS[q('[data-preset]').dataset.preset]); save(); render(); renderMenu(); return; }
    closeMenu();
    if (q('#playbtn')) return speech.on ? stopReading() : startReading(cur.v || 1);
    if (q('#gotobtn')) return openPicker();
  } else closeMenu();
  if (q('#refbtn')) return openPicker();
  if (q('[data-test]')) return openPicker(q('[data-test]').dataset.test);
  if (q('[data-book]')) return openChapters(q('[data-book]').dataset.book);
  if (q('[data-ch]')) { const x = q('[data-ch]'); closeSheet(); return go(x.dataset.b, x.dataset.ch); }
  if (q('#prev')) { const p = prevOf(cur.b, cur.c); return p && go(p.b, p.c); }
  if (q('#next')) { const p = nextOf(cur.b, cur.c); return p && go(p.b, p.c); }
  if (q('#searchbtn')) return openSearch();
  if (q('#studybtn')) return openStudies();
  if (q('#savedbtn')) return openSaved();
  if (q('#setbtn')) return openSettings();
  if (q('#home')) { e.preventDefault(); return go(cur.b, cur.c); }
  if (q('[data-saved]')) return openSaved(q('[data-saved]').dataset.saved);
  if (q('[data-open]')) return openAnchor(q('[data-open]').dataset.open);
  if (q('[data-study]')) return openStudy(q('[data-study]').dataset.study);
  if (q('[data-note]')) { e.preventDefault(); return noteEditor({ g: q('[data-note]').dataset.note }); }
  if (q('mark.mk-note')) { const a = S.ann.find(x => x.id === q('mark.mk-note').dataset.aid); if (a && getSelection().isCollapsed) return noteEditor({ g: a.g }); }
  if (q('[data-read]')) { const v = +q('[data-read]').dataset.read; closeSheet(); return startReading(v); }
  if (q('[data-newnote]')) return noteEditor({ verse: +q('[data-newnote]').dataset.newnote });
  if (q('[data-voicenote]')) return noteEditor({ verse: +q('[data-voicenote]').dataset.voicenote, listen: true });
  if (q('[data-copy]')) { const n = +q('[data-copy]').dataset.copy; const txt = `${label(chap.b, chap.c, n)} (BSB)\n${plain(chap.verses[n - 1])}`; try { await navigator.clipboard.writeText(txt); toast('Copied'); } catch { toast('Copying is blocked here. Select the text and copy it instead.'); } return; }
  if (q('a.ref') && sheet.contains(t)) return closeSheet();
  if (q('.list a') && sheet.contains(t)) return closeSheet();
  if (q('.sref, .words [data-s]')) { const s = q('[data-s]').dataset.s; const panelV = sheet.hidden ? null : $('#sheettitle').textContent; return lexPanel(s, panelV && /:\d+$/.test(panelV) ? () => versePanel(+panelV.split(':').pop()) : null); }
  if (!reader.contains(t)) return;
  if (!getSelection().isCollapsed) return;
  if (q('[data-panel]')) { e.preventDefault(); return versePanel(+q('[data-panel]').dataset.panel); }
  const L = S.set.layers;
  if ((L.strongs !== 'off' || L.interlinear !== 'off') && q('.tag, .sn, .il')) return lexPanel(q('[data-s]').dataset.s);
  if (q('.v')) return versePanel(+q('.v').dataset.v);
});
document.addEventListener('keydown', e => {
  if (e.target.matches('input, textarea, select')) { if (e.key === 'Escape') closeSheet(); return; }
  if (e.key === 'Escape') { if (!menu.hidden) closeMenu(true); else if (!sheet.hidden) closeSheet(); else { markbar.hidden = true; getSelection().removeAllRanges(); } }
  else if (!sheet.hidden) return;
  else if (e.key === 'ArrowLeft') $('#prev').click();
  else if (e.key === 'ArrowRight') $('#next').click();
  else if (e.key === '/') { e.preventDefault(); openSearch(); }
});
window.addEventListener('hashchange', () => {
  const h = parseHash(location.hash); if (!h) return;
  const changed = h.b !== cur.b || h.c !== cur.c;
  cur = h; S.last = location.hash; save();
  if (speech.on && changed && !speech.wait) stopReading();
  render().then(() => { if (speech.wait) { speech.wait = false; speakVerse(); } });
});

/* ---------- start ---------- */
(async () => {
  M = (await getJSON('data/manifest.json')) || M;
  studyIdx = (await getJSON('data/studies/index.json')) || [];
  await loadLex();
  if (synth) synth.onvoiceschanged = () => {};
  await render();
})();
}
