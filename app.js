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
S.set = Object.assign({ theme: 'dark', size: 19, font: 'serif', layout: 'para', nums: true, markup: true, rate: 1, voice: '', cont: true }, S.set || {});
// appearance: dark by default; 'system' follows the device (and the claude.ai viewer's theme when previewed there)
const applyTheme = () => { document.documentElement.dataset.mode = ['dark', 'light', 'system'].includes(S.set.theme) ? S.set.theme : 'dark'; };
const isDark = () => S.set.theme === 'dark' || (S.set.theme === 'system' && (document.documentElement.dataset.theme === 'dark' || (document.documentElement.dataset.theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches)));
applyTheme();
S.set.layers = Object.assign({}, PRESETS.study, S.set.layers || {});
S.lastOn = S.lastOn || {};
S.ann = S.ann || [];
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };

/* ---------- data ---------- */
const cache = {};
// window.__DATA is filled only in the single-file preview build (scripts/bundle.mjs)
const getJSON = p => cache[p] ??= (window.__DATA && p in window.__DATA ? Promise.resolve(window.__DATA[p]) : fetch(p).then(r => r.ok ? r.json() : null).catch(() => null));
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
    .replace(/==(.+?)==/g, '<mark class="hl c-yellow hs he">$1</mark>')
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
  let pos = 0; const made = [];
  for (const n of textNodes(el)) {
    const L = n.length, a = Math.max(s, pos), z = Math.min(e, pos + L);
    if (a < z) {
      let t = n;
      if (z < pos + L) t.splitText(z - pos);
      if (a > pos) t = t.splitText(a - pos);
      const m = document.createElement('mark'); m.className = cls; m.dataset.aid = aid;
      t.parentNode.insertBefore(m, t); m.appendChild(t); made.push(m);
    }
    pos += L;
  }
  return made;
}
function insertAt(el, off, node) {
  let pos = 0;
  for (const n of textNodes(el)) {
    if (off <= pos + n.length) { const rest = n.splitText(off - pos); rest.parentNode.insertBefore(node, rest); return; }
    pos += n.length;
  }
  el.appendChild(node);
}
/* ---------- ink: six hand-drawn highlighter and pen colours ---------- */
const INKS = ['black', 'red', 'inkblue'], HILITES = ['yellow', 'green', 'blue', 'pink', 'orange', 'purple'];
const COLORS = [...INKS, ...HILITES];
const CNAME = { black: 'Black', red: 'Red', inkblue: 'Blue ink', yellow: 'Yellow', green: 'Green', blue: 'Blue', pink: 'Pink', orange: 'Orange', purple: 'Purple' };
const LEGACY = { gold: 'yellow', sage: 'green', sky: 'blue', rose: 'pink' }; // colours saved by earlier versions
const kindOf = a => LEGACY[a.k] ? 'hl' : a.k;
const colorOf = a => a.c || LEGACY[a.k] || 'yellow';
const isInk = a => ['hl', 'pen', 'u', 'b'].includes(kindOf(a));
function annCls(a) {
  const k = kindOf(a), c = colorOf(a);
  return k === 'hl' ? `hl c-${c}` : k === 'pen' ? `pen p-${c}` : k === 'u' ? 'mk-u' : k === 'b' ? 'mk-b' : 'mk-note';
}
(function inkCSS() {
  // translucent fills: overlapping colours blend like real highlighter ink
  const HL = { black: ['20,20,20', .16, .0], red: ['230,30,45', .26, .34], inkblue: ['35,70,210', .22, .38], yellow: ['255,214,0', .45, .30], green: ['64,200,90', .34, .28], blue: ['60,150,245', .30, .32], pink: ['245,90,150', .30, .32], orange: ['255,150,40', .40, .32], purple: ['150,110,250', .30, .34] };
  const PEN = { black: ['#1a1a1a', '#f1efea'], red: ['#d6202f', '#ff6b6b'], inkblue: ['#1f3fbf', '#91a7ff'], yellow: ['#b08800', '#ffd43b'], green: ['#2b8a3e', '#69db7c'], blue: ['#1971c2', '#74c0fc'], pink: ['#d6336c', '#f783ac'], orange: ['#e8590c', '#ffa94d'], purple: ['#6741d9', '#b197fc'] };
  // a marker stroke: wobbly top and bottom edges, rough start (hs) and end (he) caps
  const SHAPE = {
    '': 'M0 2.4C14 1.2 30 3.4 47 2.2S82 1.2 100 2.6L100 17.8C84 18.9 66 16.9 50 18S16 18.6 0 17.4Z',
    '.hs': 'M3.2 3.1C14 1.2 30 3.4 47 2.2S82 1.2 100 2.6L100 17.8C84 18.9 66 16.9 50 18S16 18.6 1.6 17.6C.4 13.5 1.8 7.5 3.2 3.1Z',
    '.he': 'M0 2.4C14 1.2 30 3.4 47 2.2S82 1.2 97.4 3.2C99.6 7.4 98.6 12.8 99.4 17.6C84 18.9 66 16.9 50 18S16 18.6 0 17.4Z',
    '.hs.he': 'M3.2 3.1C14 1.2 30 3.4 47 2.2S82 1.2 97.4 3.2C99.6 7.4 98.6 12.8 99.4 17.6C84 18.9 66 16.9 50 18S16 18.6 1.6 17.6C.4 13.5 1.8 7.5 3.2 3.1Z',
  };
  const svg = x => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 20' preserveAspectRatio='none'>${x}</svg>`)}")`;
  const pen = col => svg(`<path d='M0 15.3C22 14.7 38 15.9 56 15.1S86 14.9 100 15.5' fill='none' stroke='${col}' stroke-width='2.2' stroke-linecap='round' vector-effect='non-scaling-stroke'/>`);
  let light = '', dark = '';
  for (const c of COLORS) {
    const [rgb, lo, dk] = HL[c];
    for (const [sel, d] of Object.entries(SHAPE)) {
      light += `.hl.c-${c}${sel}{background-image:${svg(`<path d='${d}' fill='rgb(${rgb})' fill-opacity='${lo}'/>`)}}`;
      const night = c === 'black' ? ['255,255,255', .18] : [rgb, dk]; // black highlighter reads as a grey wash at night
      dark += `.hl.c-${c}${sel}{background-image:${svg(`<path d='${d}' fill='rgb(${night[0]})' fill-opacity='${night[1]}'/>`)}}`;
    }
    light += `.pen.p-${c}{background-image:${pen(PEN[c][0])}}.tc-${c}{color:${PEN[c][0]}}`; dark += `.pen.p-${c}{background-image:${pen(PEN[c][1])}}.tc-${c}{color:${PEN[c][1]}}`;
  }
  const scope = (css, pre) => css.replace(/(^|})\./g, `$1${pre} .`);
  const st = document.createElement('style');
  st.textContent = light + scope(dark, ':root[data-mode=dark]') + scope(dark, ':root[data-mode=system][data-theme=dark]') + `@media (prefers-color-scheme:dark){${scope(dark, ':root[data-mode=system]:not([data-theme=light])')}}`;
  document.head.appendChild(st);
})();
function anchorText(el) { return textNodes(el).map(n => n.data).join(''); }
function applyMarks() {
  $$('.sticky, .nbr').forEach(x => { const p = x.parentNode; x.remove(); p?.normalize(); });
  $$('mark[data-aid]').forEach(m => { const p = m.parentNode; m.replaceWith(...m.childNodes); p.normalize(); });
  const byA = {}, lastOfGroup = {}, firstOfGroup = {}, span = {};
  for (const a of S.ann) {
    (byA[a.a] ||= []).push(a); lastOfGroup[a.g] = a.id; firstOfGroup[a.g] ??= a.id;
    const sp = span[a.g] ||= { len: 0, n: 0 }; sp.len += Math.max(0, a.e - a.s); sp.n++;
  }
  // a note on a long passage (several verses, or more than a few words) gets big gold [ ] around it
  const isLong = a => kindOf(a) === 'note' && (span[a.g].n > 1 || span[a.g].len >= 30);
  const bracket = (ch, a) => { const x = document.createElement('span'); x.className = 'nbr'; x.textContent = ch; x.dataset.skip = ''; x.dataset.note = a.g; x.setAttribute('aria-hidden', 'true'); return x; };
  const order = a => kindOf(a) === 'hl' ? 0 : kindOf(a) === 'note' ? 2 : 1; // highlighter under pen under notes
  const showNotes = S.set.layers.notes !== 'off';
  for (const el of $$('[data-anchor]')) {
    const list = (byA[el.dataset.anchor] || []).slice().sort((x, y) => order(x) - order(y));
    for (const a of list) {
      if (a.e > a.s && !(isLong(a) && showNotes)) {
        const ms = wrap(el, a.s, a.e, annCls(a), a.id);
        if (ms.length && kindOf(a) === 'hl') { ms[0].classList.add('hs'); ms[ms.length - 1].classList.add('he'); }
      }
      if (kindOf(a) === 'note' && showNotes && lastOfGroup[a.g] === a.id) {
        const st = document.createElement('span');
        st.className = 'sticky'; st.dataset.skip = ''; st.dataset.note = a.g; st.setAttribute('role', 'button'); st.tabIndex = 0;
        st.title = 'Note: ' + (a.n || '').slice(0, 80); st.setAttribute('aria-label', st.title);
        insertAt(el, a.e, st);
      }
      // inserted after the sticky so ] lands before it
      if (isLong(a) && showNotes) {
        if (lastOfGroup[a.g] === a.id) insertAt(el, a.e, bracket(']', a));
        if (firstOfGroup[a.g] === a.id) insertAt(el, a.s, bracket('[', a));
      }
    }
  }
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
  for (const a of S.ann) { if (!m.has(a.g)) m.set(a.g, { g: a.g, k: a.k, n: a.n, c: a.c, t: a.t, q: a.q, items: [] }); const g = m.get(a.g); g.items.push(a); if (a.n) g.n = a.n; }
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
  $('#reflabel').textContent = label(b, c);
  document.title = `${label(b, c)} · Notation Bible`;
  chap = await loadChapter(b, c);
  const L = S.set.layers;
  const pr = prevOf(b, c), nx = nextOf(b, c);
  $('#pprev').textContent = pr ? '← ' + label(pr.b, pr.c) : ''; $('#pprev').href = pr ? hashOf(pr.b, pr.c) : '#';
  $('#pnext').textContent = nx ? label(nx.b, nx.c) + ' →' : ''; $('#pnext').href = nx ? hashOf(nx.b, nx.c) : '#';
  const head = `<header class="chead"><h1 class="cbook">${esc(book.name)}</h1><p class="csub"><span class="cnum">${b === 'psalms' ? 'Psalm' : 'Chapter'} ${c}</span><span>Berean Standard Bible</span></p></header>` +
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
    const sts = chap.st.filter(x => x.v === n), nts = notesFor(id).filter(g => g.items[g.items.length - 1].a === id); // a note shows once, after the last verse it covers
    let mk = Object.entries(S.trees || {}).filter(([k, x]) => k.startsWith(`${b}.${c}.`) && x.from === n).map(([k]) => `<span class="mk" role="button" tabindex="0" data-skip data-tree="${esc(k)}" title="NoteTree ${esc(treeLabel(k))}">NT</span>`).join('');
    if (L.xrefs === 'markers' && xrs.length) mk += `<span class="mk" role="button" tabindex="0" data-skip data-panel="${n}" title="Cross references">↗</span>`;
    if (L.commentary === 'markers' && cmStart.length) mk += `<span class="mk" role="button" tabindex="0" data-skip data-panel="${n}" title="Commentary">C</span>`;
    if (L.studies === 'markers' && sts.length) mk += `<span class="mk" role="button" tabindex="0" data-skip data-panel="${n}" title="Study">S</span>`;
    let ib = '';
    if (L.footnotes === 'inline' && fns.length) ib += fns.map((f, j) => `<div class="ib fn"><h4>Footnote ${String.fromCharCode(97 + fnLetter + j)} · ${esc(label(b, c, n))}</h4><span data-anchor="fn:${id}:${j}">${rich(f[1])}</span></div>`).join('');
    if (L.footnotes !== 'off') fnLetter += fns.length;
    if (L.xrefs === 'inline' && xrs.length) ib += `<div class="ib xr"><h4>Cross references · ${esc(label(b, c, n))}</h4>${xrs.map(r => `<a href="${hashOf(...r.split('.'))}">${esc(anchorLabel(r))}</a>`).join('')}</div>`;
    if (L.commentary === 'inline') ib += cmEnd.map(x => `<section class="ib cm"><h4>Commentary · ${esc(label(b, x.r.replace('-', '–')))} · ${esc(x.src.name)}</h4><div data-anchor="${x.anchor}">${rich(x.txt)}</div></section>`).join('');
    if (L.studies === 'inline') ib += sts.map(x => `<section class="ib st"><h4>Study · ${esc(x.d.title)} · ${esc(x.sec.heading)}</h4><div data-anchor="${x.anchor}">${rich(x.sec.body)}</div><button class="lnk" data-study="${x.s.id}">Open the full study</button></section>`).join('');
    if (L.notes === 'inline') ib += nts.map(g => `<div class="ib nt"><h4>My note · ${esc(label(b, c, n))}</h4><div class="tc-${esc(g.c || 'black')}" data-anchor="nt:${g.g}">${rich(g.n || '')}</div><button class="lnk" data-note="${g.g}">Edit note</button></div>`).join('');
    return `<div class="vb" id="v${n}" data-v="${n}"><span class="v" data-anchor="${id}" data-v="${n}"><a class="vn" data-skip href="${hashOf(b, c, n)}" data-panel="${n}">${n}</a>${words}</span>${mk ? '&#8288;' + mk : ''}${verseMode ? '' : ' '}</div>${ib}`;
  }).join('');
  reader.innerHTML = head + `<div class="text">${html}</div>`;
  // footnote letters sit right after the phrase they annotate
  if (L.footnotes !== 'off') {
    let k = 0;
    chap.verses.forEach((toks, i) => {
      const n = i + 1, fns = chap.fn[`${c}:${n}`] || []; const el = reader.querySelector(`#v${n} .v`);
      fns.forEach(f => {
        const at = plain(toks).indexOf(f[0]);
        const btn = document.createElement('span'); btn.className = 'fm'; btn.setAttribute('role', 'button'); btn.tabIndex = 0; btn.dataset.skip = ''; btn.dataset.panel = n; btn.title = f[1];
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
  tree: '<svg viewBox="0 0 24 24"><rect x="7.5" y="4" width="9" height="12" rx="1"/><path d="M3 8c2 0 3 1 4.5 2M21 8c-2 0-3 1-4.5 2M3 15c1.5 0 3-.5 4.5-1.5M21 15c-1.5 0-3-.5-4.5-1.5"/></svg>',
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
    ${sw('darkmode', isDark(), 'Dark mode', S.set.theme === 'system' ? 'System' : '')}
    <button class="mi" role="menuitem" id="treesbtn">${MI.tree}<span class="lab">NoteTrees</span>${Object.keys(S.trees || {}).length ? `<span class="sub">${Object.keys(S.trees).length}</span>` : ''}</button>
    <hr><button class="mi" role="menuitem" id="setbtn">${MI.set}<span class="lab">Layer modes &amp; reading settings</span></button>`;
}
function openMenu() { renderMenu(); menu.hidden = false; menuBtn.setAttribute('aria-expanded', 'true'); menu.querySelector('.mi').focus(); }
function closeMenu(focus) { if (menu.hidden) return; menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); if (focus) menuBtn.focus(); }
function toggleLayer(k) {
  const L = S.set.layers;
  if (k === 'markup') S.set.markup = !S.set.markup;
  else if (k === 'darkmode') { S.set.theme = isDark() ? 'light' : 'dark'; applyTheme(); }
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
  let h = `<div class="row"><button class="btn" data-read="${n}">${ICON.play}Read from here</button><button class="btn" data-copy="${n}">Copy</button><button class="btn" data-newnote="${n}">${ICON.note}Note</button><button class="btn rec" data-voicenote="${n}">${ICON.mic}Dictate note</button>${canEditTrees() ? `<button class="btn" data-ntopen="${n}">${MI.tree}NoteTree</button>` : ''}${treeHas(b, c, n).map(([k]) => `<button class="btn" data-tree="${esc(k)}">${MI.tree}${canEditTrees() ? 'Open' : 'View'} NoteTree ${esc(treeLabel(k).split(' ').pop())}</button>`).join('')}</div>
  <p class="quote" style="margin-top:16px">${lord(plain(toks))}</p>`;
  if (tagged.length) h += `<h3>Words · Strong's concordance</h3><div class="words">${tagged.map(t => { const x = LEX[nums(t)[0]] || []; return `<button data-s="${esc(t[1])}"><span class="en">${lord(t[0])}</span><span class="og ${t[1][0] === 'H' ? 'he' : 'gr'}">${esc(t[2] || x[0] || '')}</span><span class="gl">${esc(t[1])} · ${esc(x[1] || '')} · ${esc(x[2] || '')}</span></button>`; }).join('')}</div>`;
  if (fns.length) h += `<h3>Footnotes</h3>${fns.map((f, j) => `<div class="prose"><b>${esc(f[0])}:</b> <span data-anchor="fn:${id}:${j}">${rich(f[1])}</span></div>`).join('')}`;
  if (xrs.length) h += `<h3>Cross references</h3><ul class="list">${xrs.map(r => `<li><a href="${hashOf(...r.split('.'))}"><b>${esc(anchorLabel(r))}</b><span class="xprev" data-ref="${r}"></span></a></li>`).join('')}</ul>`;
  if (cms.length) h += cms.map(x => `<h3>Commentary · ${esc(label(b, x.r.replace('-', '–')))} · ${esc(x.src.name)}</h3><div class="prose" data-anchor="${x.anchor}">${rich(x.txt)}</div>`).join('');
  if (sts.length) h += sts.map(x => `<h3>Study · ${esc(x.d.title)}</h3><div class="prose"><b>${esc(x.sec.heading)}</b><div data-anchor="${x.anchor}">${rich(x.sec.body)}</div></div><button class="btn" data-study="${x.s.id}">Open the full study</button>`).join('');
  if (nts.length) h += `<h3>My notes</h3>${nts.map(g => `<div class="ib nt" style="margin-left:0"><div class="tc-${esc(g.c || 'black')}" data-anchor="nt:${g.g}">${rich(g.n || '')}</div><button class="lnk" data-note="${g.g}">Edit note</button></div>`).join('')}`;
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
  const sw = g => { const k = kindOf(g.items[0]); return k === 'note' ? 'Note' : k === 'pen' ? 'Pen' : k === 'u' ? 'Underline' : k === 'b' ? 'Bold' : 'Highlight'; };
  openSheet('Highlights & notes', `<div class="seg" role="group">${['all', 'highlights', 'notes'].map(f => `<button data-saved="${f}" aria-pressed="${f === filter}">${f[0].toUpperCase() + f.slice(1)}</button>`).join('')}</div>
  ${gs.length ? `<ul class="list" style="margin-top:12px">${gs.map(g => { const a = g.items[0].a; return `<li><button data-open="${esc(a)}" data-g="${g.g}"><b>${esc(where(a))} · ${sw(g)}</b><span><mark class="${annCls(g.items[0])} hs he">${esc(g.q || '')}</mark></span>${g.n ? `<span class="meta">${esc(g.n)}</span>` : ''}</button></li>`; }).join('')}</ul>` : '<p class="empty"><b>Nothing saved yet</b>Select words in a verse, note, commentary or study to mark them up.</p>'}`);
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

/* ---------- marking up: shared by the selection bar and the bottom toolbar ---------- */
let targets = [], selT, toolT, tool = null, ptrDown = false;
S.set.color = COLORS.includes(S.set.color) ? S.set.color : 'yellow';
const markbar = $('#markbar'), toolbar = $('#toolbar'), palette = $('#palette');
const INK = ['hl', 'pen', 'eraser'];
function selTargets() {
  const sel = getSelection(), out = [];
  if (!sel.rangeCount || sel.isCollapsed) return out;
  const r = sel.getRangeAt(0);
  for (const el of $$('[data-anchor]')) {
    if (!r.intersectsNode(el)) continue;
    const s = el.contains(r.startContainer) ? offsetIn(el, r.startContainer, r.startOffset) : 0;
    const e = el.contains(r.endContainer) ? offsetIn(el, r.endContainer, r.endOffset) : plainLen(el);
    if (e > s) out.push({ a: el.dataset.anchor, s, e });
  }
  out.q = sel.toString().replace(/\s+/g, ' ').trim().slice(0, 280);
  return out;
}
function addInk(kind, tg, color) { const g = uid(); for (const t of tg) S.ann.push({ id: uid(), g, a: t.a, s: t.s, e: t.e, k: kind, c: color, q: tg.q, t: Date.now() }); }
function eraseRange(tg) { // erases only the rubbed-over part; notes are left alone
  const out = [];
  for (const a of S.ann) {
    const t = isInk(a) && tg.find(t => t.a === a.a && a.s < t.e && a.e > t.s);
    if (!t) { out.push(a); continue; }
    if (a.s < t.s) out.push({ ...a, id: uid(), e: t.s });
    if (a.e > t.e) out.push({ ...a, id: uid(), s: t.e });
  }
  S.ann = out;
}
const commit = () => { save(); getSelection().removeAllRanges(); markbar.hidden = true; targets = []; applyMarks(); bumpIdle(); };
document.addEventListener('selectionchange', () => { clearTimeout(selT); selT = setTimeout(readSelection, 140); });
function readSelection() {
  targets = selTargets();
  if (!targets.length) { if (!markbar.contains(document.activeElement)) markbar.hidden = true; return; }
  if (INK.includes(tool)) { markbar.hidden = true; if (!ptrDown) { clearTimeout(toolT); toolT = setTimeout(toolOnSelection, 700); } return; } // touch handles: apply once they settle
  $('#marklabel').textContent = targets.length > 1 ? `${where(targets[0].a)} +${targets.length - 1}` : where(targets[0].a);
  markbar.hidden = false; $('#audiobar').hidden = true;
}
function toolOnSelection() {
  clearTimeout(toolT);
  if (!INK.includes(tool)) return;
  const tg = selTargets(); if (!tg.length) return;
  if (tool === 'eraser') eraseRange(tg); else addInk(tool, tg, S.set.color);
  commit();
}
document.addEventListener('pointerdown', e => { if (e.target.closest('[data-anchor]')) ptrDown = true; });
document.addEventListener('pointerup', () => { if (ptrDown) { ptrDown = false; setTimeout(toolOnSelection, 0); } });
markbar.addEventListener('pointerdown', e => e.preventDefault()); // keep the text selection alive
markbar.addEventListener('click', e => {
  const b = e.target.closest('[data-k]'); if (!b || !targets.length) return;
  const k = b.dataset.k;
  if (k === 'note') { const t = targets; getSelection().removeAllRanges(); markbar.hidden = true; return noteEditor({ targets: t }); }
  if (k === 'tree') { // the verses touched by the selection
    const vs = targets.map(t => t.a.split('.')).filter(p => p.length === 3 && p[0] === chap?.b && +p[1] === chap?.c).map(p => +p[2]);
    getSelection().removeAllRanges(); markbar.hidden = true;
    return vs.length ? openNoteTree(Math.min(...vs), Math.max(...vs)) : toast('Select verses to put them in a NoteTree');
  }
  if (k === 'erase') eraseRange(targets);
  else { if (b.dataset.c) { S.set.color = b.dataset.c; renderToolbar(); } addInk(k, targets, S.set.color); }
  commit();
});

/* bottom toolbar: highlighter, pen, eraser, colour, sticky note */
const HINTS = { hl: 'Select words, or tap a word, to highlight', pen: 'Select words, or tap a word, to underline', eraser: 'Rub over marks, or tap a word, to erase', sticky: 'Tap the spot where the note goes' };
function renderToolbar() {
  $$('[data-tool]', toolbar).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tool === tool)));
  document.documentElement.style.setProperty('--tc', `var(--sw-${S.set.color})`);
  $$('[data-c]', palette).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.c === S.set.color)));
  $('#toolhint').textContent = HINTS[tool] || ''; $('#toolhint').hidden = !tool || !palette.hidden || toolbar.classList.contains('collapsed');
  document.body.dataset.activeTool = tool || '';
}
function setTool(t) { tool = tool === t ? null : t; palette.hidden = true; $('#colorbtn').setAttribute('aria-expanded', 'false'); renderToolbar(); }
/* the toolbar tucks itself into a round notes button after a few unused seconds */
const IDLE_MS = 4000, TOOLNAME = { hl: 'Highlighter', pen: 'Pen', eraser: 'Eraser', sticky: 'Sticky note' };
let idleT;
function bumpIdle() { clearTimeout(idleT); idleT = setTimeout(collapseToolbar, IDLE_MS); }
function collapseToolbar() {
  if (!palette.hidden || toolbar.querySelector(':focus-visible:not(.tbfab)')) return bumpIdle(); // not while choosing a colour or tabbing through it
  toolbar.classList.add('collapsed'); toolbar.classList.toggle('holding', !!tool);
  $('#tbfab').setAttribute('aria-label', tool ? `Show markup tools (${TOOLNAME[tool]} in hand)` : 'Show markup tools');
  renderToolbar();
}
function expandToolbar(focus) {
  toolbar.classList.remove('collapsed', 'holding'); renderToolbar(); bumpIdle();
  if (focus) (toolbar.querySelector('[aria-pressed=true]') || toolbar.querySelector('[data-tool]')).focus({ preventScroll: true });
}
toolbar.addEventListener('pointerdown', bumpIdle);
toolbar.addEventListener('focusin', () => { if (!toolbar.classList.contains('collapsed')) bumpIdle(); });
toolbar.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.id === 'tbfab') return expandToolbar(e.detail === 0); // keyboard activation moves focus into the toolbar
  bumpIdle();
  if (b.id === 'colorbtn') { palette.hidden = !palette.hidden; b.setAttribute('aria-expanded', String(!palette.hidden)); renderToolbar(); if (!palette.hidden) palette.querySelector('[aria-pressed=true]')?.focus(); return; }
  setTool(b.dataset.tool);
});
palette.addEventListener('click', e => {
  const b = e.target.closest('[data-c]'); if (!b) return;
  bumpIdle();
  S.set.color = b.dataset.c; save();
  if (tool !== 'pen') tool = 'hl'; // picking a colour picks up the highlighter unless the pen is in hand
  palette.hidden = true; $('#colorbtn').setAttribute('aria-expanded', 'false'); renderToolbar();
});
function caretAt(x, y) {
  if (document.caretPositionFromPoint) { const p = document.caretPositionFromPoint(x, y); return p && { node: p.offsetNode, off: p.offset }; }
  const r = document.caretRangeFromPoint?.(x, y); return r && { node: r.startContainer, off: r.startOffset };
}
function wordAt(e, t) { // the word (or tagged phrase) under a tap, as an anchor range
  const anchor = t.closest('[data-anchor]'); if (!anchor) return null;
  const w = t.closest('.il')?.querySelector('.w') || t.closest('.w');
  if (w && anchor.contains(w)) { const s = offsetIn(anchor, w, 0); return { a: anchor.dataset.anchor, s, e: s + plainLen(w), el: anchor }; }
  const c = caretAt(e.clientX, e.clientY);
  if (!c || c.node.nodeType !== 3 || !anchor.contains(c.node) || c.node.parentElement.closest('[data-skip]')) return null;
  const tx = c.node.data, W = /[\p{L}\p{N}’'-]/u; let i = c.off, j = c.off;
  while (i > 0 && W.test(tx[i - 1])) i--;
  while (j < tx.length && W.test(tx[j])) j++;
  if (i === j && tool !== 'sticky') return null;
  return { a: anchor.dataset.anchor, s: offsetIn(anchor, c.node, i), e: offsetIn(anchor, c.node, j), el: anchor };
}
function toolTap(e, t) {
  const w = wordAt(e, t); if (!w) return;
  const text = anchorText(w.el);
  if (tool === 'sticky') {
    const q = (w.e > 60 ? '…' : '') + text.slice(Math.max(0, w.e - 60), w.e).trim() + ' ✎';
    const tg = Object.assign([{ a: w.a, s: w.e, e: w.e }], { q });
    setTool(null); return noteEditor({ targets: tg });
  }
  const tg = Object.assign([{ a: w.a, s: w.s, e: w.e }], { q: text.slice(w.s, w.e) });
  if (tool === 'eraser') eraseRange(tg); else addInk(tool, tg, S.set.color);
  commit();
}

/* ---------- notes (with dictation) ---------- */
function noteEditor({ targets: t, g, verse, listen }) {
  const existing = g ? groups().find(x => x.g === g) : null;
  if (verse && chap?.verses) { const id = `${chap.b}.${chap.c}.${verse}`; t = [{ a: id, s: 0, e: plain(chap.verses[verse - 1]).length }]; t.q = plain(chap.verses[verse - 1]); }
  const quote = existing ? existing.q : t?.q;
  openSheet(existing ? 'Edit note' : 'New note', `<p class="quote">${esc(quote || '')}</p>
    <textarea id="ntext" autofocus placeholder="Write a note. **bold**, *italic*, ==highlight==, and references like John 3:16 or G3056 become links.">${esc(existing?.n || '')}</textarea>
    <div class="ncolors" role="group" aria-label="Note text colour">${COLORS.map(c => `<button data-nc="${c}" style="--s:var(--sw-${c})" aria-label="${CNAME[c]} text" title="${CNAME[c]}"></button>`).join('')}</div>
    <div class="row" style="margin-top:10px"><button class="btn rec" id="nmic">${ICON.mic}<span>Dictate</span></button><span class="hint" id="nmicstate" style="margin:0"></span></div>
    <div class="preview prose" id="nprev"></div>
    <div class="row end">${existing ? '<button class="btn" id="ndel">Delete</button>' : ''}<button class="btn primary" id="nsave">Save note</button></div>`);
  const ta = $('#ntext'), pv = $('#nprev');
  let nc = existing?.c || S.set.noteColor || 'black';
  const upd = () => {
    pv.className = 'preview prose tc-' + nc; ta.className = 'tc-' + nc;
    pv.innerHTML = ta.value.trim() ? rich(ta.value) : '<span class="hint">Preview</span>';
    $$('[data-nc]', sheet).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.nc === nc)));
  };
  $$('[data-nc]', sheet).forEach(b => b.onclick = () => { nc = b.dataset.nc; S.set.noteColor = nc; save(); upd(); });
  ta.addEventListener('input', upd); upd();
  $('#nmic').onclick = () => dictate(txt => { ta.value = (ta.value ? ta.value.replace(/\s*$/, ' ') : '') + txt; upd(); }, $('#nmic'), $('#nmicstate'));
  $('#nsave').onclick = () => {
    const n = ta.value.trim(); if (!n) return toast('Write something first');
    if (existing) S.ann.forEach(a => { if (a.g === g) { a.n = n; a.c = nc; } });
    else { const gg = uid(); for (const x of t) S.ann.push({ id: uid(), g: gg, a: x.a, s: x.s, e: x.e, k: 'note', n, c: nc, q: t.q, t: Date.now() }); }
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
    <div><label>Appearance</label>${seg('theme', S.set.theme, [['dark', 'Dark'], ['light', 'Light'], ['system', 'Match system']])}</div>
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
  if (name === 'theme') applyTheme();
  save(); render(); openSettings();
});

/* ---------- NoteTree: a passage centred on a letter page with free canvas around it ---------- */
// Canvas units are CSS px at 96/in: 3 in margin + 8.5 x 11 in page + 3 in margin.
const NTW = 3 * 96 * 2 + 816, NTH = 1056, PAGE_X = 288, PAGE_W = 816;
const ntEl = $('#nt'), ntCanvas = $('#ntcanvas'), ntInk = $('#ntink'), ntBoxes = $('#ntboxes');
const canEditTrees = () => matchMedia('(min-width: 700px)').matches; // desktops and tablets; phones view only
let nt = null, ntTool = 'pen', ntScale = 1, ntHist = [], ntFut = [], ntSaveT;
S.trees = S.trees || {};
const treeKey = (b, c, f, t) => `${b}.${c}.${f}-${t}`;
const treeLabel = k => { const [b, c, r] = k.split('.'); const [f, t] = r.split('-'); return `${label(b, c)}:${f}${t !== f ? '–' + t : ''}`; };
const treeHas = (b, c, v) => Object.entries(S.trees).filter(([k, x]) => k.startsWith(`${b}.${c}.`) && v >= x.from && v <= x.to && (x.strokes.length || x.boxes.length));
function openNoteTree(from, to) {
  if (!chap?.verses) return toast('Open a chapter with text first');
  const n = chap.verses.length; from = Math.max(1, Math.min(from, n)); to = Math.max(from, Math.min(to, n));
  const key = treeKey(chap.b, chap.c, from, to);
  nt = S.trees[key] ? JSON.parse(JSON.stringify(S.trees[key])) : { b: chap.b, c: chap.c, from, to, strokes: [], boxes: [] };
  nt.key = key; ntHist = []; ntFut = [];
  closeSheet(); closeMenu(); markbar.hidden = true; if (tool) setTool(tool);
  const edit = canEditTrees();
  ntEl.classList.toggle('readonly', !edit); ntEl.hidden = false; document.body.classList.add('nt-open');
  $('#ntref').textContent = treeLabel(key) + (edit ? '' : ' · view only on phones');
  const opts = Array.from({ length: n }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('');
  $('#ntfrom').innerHTML = opts; $('#ntto').innerHTML = opts; $('#ntfrom').value = from; $('#ntto').value = to;
  $('#ntfrom').disabled = $('#ntto').disabled = !edit;
  $$('[data-ntc]', ntEl).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ntc === S.set.color)));
  $('#ntpencil').hidden = !(navigator.maxTouchPoints > 0 || ntPencil); setPencilOnly(ntPencil, true);
  ntSetTool(edit ? ntTool : 'view'); ntRenderText(); ntRender(); ntFit();
}
function closeNoteTree() { ntFlush(); ntEl.hidden = true; document.body.classList.remove('nt-open'); nt = null; render(); }
function ntRenderText() {
  const vs = chap.verses.slice(nt.from - 1, nt.to);
  $('#nttext').innerHTML = `<p class="ntcap">${esc(treeLabel(nt.key))} · Berean Standard Bible</p>` + vs.map((toks, i) => {
    const n = nt.from + i, id = `${chap.b}.${chap.c}.${n}`;
    return `<span class="v" data-anchor="${id}"><sup class="vn" data-skip>${n}</sup>${toks.map(t => typeof t === 'string' ? esc(t) : lord(t[0])).join('')}</span> `;
  }).join('');
  applyMarks();
  // shrink the type until the passage fits inside the page's 1-inch margins
  const box = $('#nttext'); let size = 24; box.style.fontSize = size + 'px';
  while (box.scrollHeight > NTH - 192 && size > 11) box.style.fontSize = --size + 'px';
}
const ntPath = p => { // smooth a point list into a quadratic curve
  if (p.length < 3) return `M${p[0][0]} ${p[0][1]}L${(p[1] || p[0])[0] + .1} ${(p[1] || p[0])[1]}`;
  let d = `M${p[0][0]} ${p[0][1]}`;
  for (let i = 1; i < p.length - 1; i++) d += `Q${p[i][0]} ${p[i][1]} ${(p[i][0] + p[i + 1][0]) / 2} ${(p[i][1] + p[i + 1][1]) / 2}`;
  return d + `L${p[p.length - 1][0]} ${p[p.length - 1][1]}`;
};
// Pen strokes are drawn as filled outlines so their width follows Apple Pencil pressure
// (points are [x, y, pressure]; mouse and finger strokes have no pressure and draw at an even width).
const PEN_W = 3.2;
function inkOutline(pts) {
  const n = pts.length, pr = i => { // pressure, smoothed over neighbours so the edge doesn't wobble
    let t = 0, c = 0; for (let k = Math.max(0, i - 2); k <= Math.min(n - 1, i + 2); k++) { t += pts[k][2] ?? .5; c++; } return t / c;
  };
  const half = i => PEN_W * (.3 + 1.4 * pr(i)) / 2;
  if (n < 2) { const [x, y] = pts[0], r = half(0); return `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`; }
  const L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
    const w = half(i); L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  const f = v => Math.round(v * 10) / 10, side = q => q.slice(1, -1).map((p, i) => `Q${f(p[0])} ${f(p[1])} ${f((p[0] + q[i + 2][0]) / 2)} ${f((p[1] + q[i + 2][1]) / 2)}`).join('') + `L${f(q[q.length - 1][0])} ${f(q[q.length - 1][1])}`;
  const Rr = R.slice().reverse(), re = half(n - 1), rs = half(0);
  return `M${f(L[0][0])} ${f(L[0][1])}${side(L)}A${f(re)} ${f(re)} 0 0 1 ${f(Rr[0][0])} ${f(Rr[0][1])}${side(Rr)}A${f(rs)} ${f(rs)} 0 0 1 ${f(L[0][0])} ${f(L[0][1])}Z`;
}
const strokeSVG = s => s.tool === 'hl'
  ? `<path data-id="${s.id}" class="nths ${s.c === 'black' ? 'tc-black' : ''}" d="${ntPath(s.p)}" style="stroke:${s.c === 'black' ? 'currentColor' : `var(--sw-${s.c})`}"/>`
  : `<path data-id="${s.id}" class="ntpf tc-${s.c}" d="${inkOutline(s.p)}"/>`;
function ntRender() {
  ntInk.innerHTML = nt.strokes.map(strokeSVG).join('');
  ntBoxes.innerHTML = nt.boxes.map(x => `<div class="ntbox" data-id="${x.id}" style="left:${x.x}px;top:${x.y}px;width:${x.w}px">
    <div class="ntgrip" title="Drag to move" aria-hidden="true"></div><button class="ntdel" data-boxdel="${x.id}" aria-label="Delete text box">×</button>
    <div class="ntbody tc-${x.c}" ${ntEl.classList.contains('readonly') ? '' : 'contenteditable="true"'} spellcheck="true" aria-label="Text box">${esc(x.text).replace(/\n/g, '<br>')}</div></div>`).join('');
}
function ntSave() { if (!nt) return; const { key, ...rest } = nt; if (rest.strokes.length || rest.boxes.length) S.trees[key] = rest; else delete S.trees[key]; save(); }
function ntFlush() { clearTimeout(ntSaveT); if (nt) ntSave(); }
const ntSnap = () => JSON.stringify({ strokes: nt.strokes, boxes: nt.boxes });
function ntPush() { ntHist.push(ntSnap()); if (ntHist.length > 60) ntHist.shift(); ntFut = []; }
function ntRestore(s) { const o = JSON.parse(s); nt.strokes = o.strokes; nt.boxes = o.boxes; ntRender(); ntSave(); }
function ntSetTool(t) {
  ntTool = t; ntEl.dataset.tool = t;
  $$('[data-nt]', ntEl).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.nt === t)));
}
function ntSetScale(s) {
  ntScale = Math.max(.25, Math.min(3, s));
  ntCanvas.style.transform = `scale(${ntScale})`;
  $('#ntsize').style.width = NTW * ntScale + 'px'; $('#ntsize').style.height = NTH * ntScale + 'px';
  $('#ntzoom').textContent = Math.round(ntScale * 100) + '%';
}
function ntFit() { const r = $('#ntscroll').getBoundingClientRect(); ntSetScale(Math.min((r.width - 32) / NTW, (r.height - 32) / NTH)); }
const ntPoint = e => { const r = ntCanvas.getBoundingClientRect(); return [Math.round((e.clientX - r.left) / ntScale * 10) / 10, Math.round((e.clientY - r.top) / ntScale * 10) / 10]; };
// eraser: removes any stroke that comes within a few points of the path the eraser travels
function segDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
  const t = L ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L)) : 0;
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
function ntEraseAt(e) {
  const p = ntPoint(e), prev = ntDraw?.last || p; if (ntDraw) ntDraw.last = p;
  const n = Math.max(1, Math.ceil(Math.hypot(p[0] - prev[0], p[1] - prev[1]) / 4));
  const samples = Array.from({ length: n + 1 }, (_, i) => [prev[0] + (p[0] - prev[0]) * i / n, prev[1] + (p[1] - prev[1]) * i / n]);
  const hits = nt.strokes.filter(s => {
    const r = s.tool === 'hl' ? 14 : 8;
    return samples.some(q => s.p.length === 1 ? Math.hypot(q[0] - s.p[0][0], q[1] - s.p[0][1]) < r : s.p.some((a, i) => i && segDist(q, s.p[i - 1], a) < r));
  });
  if (!hits.length) return;
  if (!ntDraw?.pushed) { ntPush(); if (ntDraw) ntDraw.pushed = true; }
  nt.strokes = nt.strokes.filter(s => !hits.includes(s)); ntRender(); ntSave();
}
let ntDraw = null;
// Apple Pencil: once a pen is seen, only the pen draws. Fingers scroll (one) and pinch-zoom (two), and a
// resting palm is ignored while the pen is down.
let ntPencil = !!S.set.pencilOnly, penDown = false;
const fingers = new Map();
const capture = e => { try { ntInk.setPointerCapture(e.pointerId); } catch {} };
function setPencilOnly(on, quiet) {
  ntPencil = on; S.set.pencilOnly = on; save();
  $('#ntpencil').setAttribute('aria-pressed', String(on));
  if (!quiet) toast(on ? 'Pencil only: Apple Pencil draws, fingers scroll and zoom' : 'Fingers draw too');
}
const pressureOf = e => e.pointerType === 'pen' && e.pressure > 0 ? Math.round(e.pressure * 100) / 100 : undefined;
const ntPointP = e => { const p = ntPoint(e), pr = pressureOf(e); if (pr !== undefined) p.push(pr); return p; };
function fingerGesture(e, phase) {
  if (phase === 'down') { fingers.set(e.pointerId, [e.clientX, e.clientY]); capture(e); return; }
  if (phase === 'up') { fingers.delete(e.pointerId); return; }
  const prev = fingers.get(e.pointerId); if (!prev) return;
  const sc = $('#ntscroll');
  if (fingers.size === 1) { sc.scrollLeft -= e.clientX - prev[0]; sc.scrollTop -= e.clientY - prev[1]; }
  else if (fingers.size === 2) { // pinch: zoom by the change in distance between the two fingers
    const [o] = [...fingers].filter(([id]) => id !== e.pointerId).map(([, v]) => v);
    const d0 = Math.hypot(prev[0] - o[0], prev[1] - o[1]), d1 = Math.hypot(e.clientX - o[0], e.clientY - o[1]);
    if (d0 > 10) ntSetScale(ntScale * d1 / d0);
  }
  fingers.set(e.pointerId, [e.clientX, e.clientY]);
}
ntInk.addEventListener('pointerdown', e => {
  if (!nt || ntEl.classList.contains('readonly')) return;
  if (e.pointerType === 'pen' && !ntPencil) setPencilOnly(true);
  if (e.pointerType === 'touch' && ntPencil) { e.preventDefault(); if (!penDown) fingerGesture(e, 'down'); return; } // palm or finger
  $('#nthover').hidden = true;
  const tool = e.buttons & 32 ? 'eraser' : ntTool; // a stylus's eraser end erases
  if (tool === 'text') {
    e.preventDefault();
    if (document.activeElement?.matches('.ntbody')) { document.activeElement.blur(); return; } // first tap just finishes the box being typed in
    ntPush();
    const [x, y] = ntPoint(e), id = uid();
    nt.boxes.push({ id, x: Math.min(x, NTW - 240), y: Math.min(y - 14, NTH - 60), w: 240, text: '', c: S.set.color });
    ntRender(); ntBoxes.querySelector(`[data-id="${id}"] .ntbody`).focus(); return; // iPadOS Scribble can handwrite straight into it
  }
  if (tool === 'eraser') { e.preventDefault(); capture(e); ntDraw = { erase: true, id: e.pointerId }; penDown = e.pointerType === 'pen'; ntEraseAt(e); return; }
  if (tool !== 'pen' && tool !== 'hl') return;
  e.preventDefault(); capture(e); ntPush(); penDown = e.pointerType === 'pen';
  const s = { id: uid(), tool, c: S.set.color, p: [ntPointP(e)] };
  nt.strokes.push(s); ntInk.insertAdjacentHTML('beforeend', strokeSVG(s));
  ntDraw = { s, el: ntInk.lastElementChild, id: e.pointerId };
});
ntInk.addEventListener('pointermove', e => {
  if (e.pointerType === 'touch' && ntPencil) { if (!penDown) fingerGesture(e, 'move'); return; }
  if (e.pointerType === 'pen' && !e.buttons && !ntDraw) return ntHover(e); // Pencil hovering above the screen
  if (!ntDraw || e.pointerId !== ntDraw.id) return;
  if (ntDraw.erase) return ntEraseAt(e);
  const co = e.getCoalescedEvents?.();
  for (const ev of co && co.length ? co : [e]) { // the Pencil reports up to 240 points a second
    const p = ntPointP(ev), last = ntDraw.s.p[ntDraw.s.p.length - 1];
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) >= 1.2) ntDraw.s.p.push(p);
  }
  ntDraw.el.setAttribute('d', ntDraw.s.tool === 'hl' ? ntPath(ntDraw.s.p) : inkOutline(ntDraw.s.p));
});
const ntEnd = e => {
  if (e.pointerType === 'touch' && ntPencil) { fingerGesture(e, 'up'); return; }
  if (ntDraw && e.pointerId === ntDraw.id) { ntDraw = null; penDown = false; ntSave(); }
};
ntInk.addEventListener('pointerup', ntEnd); ntInk.addEventListener('pointercancel', ntEnd);
ntInk.addEventListener('pointerleave', () => { $('#nthover').hidden = true; });
function ntHover(e) { // a ring the size and colour of the nib, under a hovering Pencil
  const h = $('#nthover'), [x, y] = ntPoint(e), d = ntTool === 'hl' ? 22 : ntTool === 'eraser' ? 16 : PEN_W * 2.2;
  if (!['pen', 'hl', 'eraser'].includes(ntTool)) { h.hidden = true; return; }
  h.hidden = false; h.style.cssText = `left:${x - d / 2}px;top:${y - d / 2}px;width:${d}px;height:${d}px;--hc:${ntTool === 'eraser' ? 'var(--soft)' : `var(--sw-${S.set.color})`}`;
}
// text boxes: type, drag by the grip, resize from the corner, delete
ntBoxes.addEventListener('focusin', e => { if (e.target.matches('.ntbody')) { ntPush(); e.target.closest('.ntbox').classList.add('editing'); } });
ntBoxes.addEventListener('focusout', e => {
  if (!e.target.matches('.ntbody')) return;
  const box = e.target.closest('.ntbox'), x = nt?.boxes.find(b => b.id === box.dataset.id); box.classList.remove('editing');
  if (box.contains(getSelection().anchorNode)) getSelection().removeAllRanges(); // don't leave the typed text selected
  if (x) { x.text = e.target.innerText.replace(/\n$/, ''); x.w = Math.round(box.offsetWidth); if (!x.text.trim()) { nt.boxes = nt.boxes.filter(b => b !== x); ntRender(); } ntSave(); }
});
ntBoxes.addEventListener('input', e => { const box = e.target.closest('.ntbox'), x = nt?.boxes.find(b => b.id === box.dataset.id); if (x) { x.text = e.target.innerText; clearTimeout(ntSaveT); ntSaveT = setTimeout(ntSave, 400); } });
ntBoxes.addEventListener('pointerdown', e => {
  if (!nt || ntEl.classList.contains('readonly')) return;
  const box = e.target.closest('.ntbox'); if (!box) return;
  const x = nt.boxes.find(b => b.id === box.dataset.id);
  if (ntTool === 'eraser') { e.preventDefault(); ntPush(); nt.boxes = nt.boxes.filter(b => b !== x); ntRender(); ntSave(); return; }
  if (!e.target.matches('.ntgrip')) return;
  e.preventDefault(); ntPush(); e.target.setPointerCapture(e.pointerId);
  const start = ntPoint(e), ox = x.x, oy = x.y;
  const mv = ev => { const p = ntPoint(ev); x.x = Math.max(0, Math.min(NTW - 60, ox + p[0] - start[0])); x.y = Math.max(0, Math.min(NTH - 30, oy + p[1] - start[1])); box.style.left = x.x + 'px'; box.style.top = x.y + 'px'; };
  const up = () => { e.target.removeEventListener('pointermove', mv); e.target.removeEventListener('pointerup', up); ntSave(); };
  e.target.addEventListener('pointermove', mv); e.target.addEventListener('pointerup', up);
});
const boxRO = new ResizeObserver(es => { for (const en of es) { const x = nt?.boxes.find(b => b.id === en.target.dataset.id); const w = en.target.offsetWidth; if (x && w && Math.abs(x.w - w) > 2) { x.w = Math.round(w); clearTimeout(ntSaveT); ntSaveT = setTimeout(ntSave, 400); } } });
new MutationObserver(() => ntBoxes.querySelectorAll('.ntbox').forEach(b => boxRO.observe(b))).observe(ntBoxes, { childList: true });
ntEl.addEventListener('click', e => {
  const t = e.target, q = s => t.closest(s);
  if (q('#ntclose')) return closeNoteTree();
  if (q('#ntpencil')) return setPencilOnly(!ntPencil);
  if (q('[data-nt]')) return ntSetTool(q('[data-nt]').dataset.nt);
  if (q('[data-ntc]')) { S.set.color = q('[data-ntc]').dataset.ntc; save(); renderToolbar(); $$('[data-ntc]', ntEl).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ntc === S.set.color))); if (ntTool === 'select' || ntTool === 'eraser') ntSetTool('pen'); return; }
  if (q('#ntundo')) { if (ntHist.length) { ntFut.push(ntSnap()); ntRestore(ntHist.pop()); } return; }
  if (q('#ntredo')) { if (ntFut.length) { ntHist.push(ntSnap()); ntRestore(ntFut.pop()); } return; }
  if (q('#ntzoomin')) return ntSetScale(ntScale * 1.2);
  if (q('#ntzoomout')) return ntSetScale(ntScale / 1.2);
  if (q('#ntfit')) return ntFit();
  if (q('#ntclear')) { if (!nt.strokes.length && !nt.boxes.length) return; ntPush(); nt.strokes = []; nt.boxes = []; ntRender(); ntSave(); toast('Cleared. Undo brings it back.'); return; }
  if (q('[data-boxdel]')) { ntPush(); nt.boxes = nt.boxes.filter(b => b.id !== q('[data-boxdel]').dataset.boxdel); ntRender(); ntSave(); return; }
  if (q('[data-note]')) return noteEditor({ g: q('[data-note]').dataset.note });
});
$('#ntfrom').onchange = $('#ntto').onchange = () => { ntFlush(); const f = +$('#ntfrom').value, t = +$('#ntto').value; openNoteTree(Math.min(f, t), Math.max(f, t)); };
$('#ntscroll').addEventListener('wheel', e => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); ntSetScale(ntScale * (e.deltaY < 0 ? 1.1 : 1 / 1.1)); }, { passive: false });
addEventListener('resize', () => { if (nt) ntFit(); });
document.addEventListener('keydown', e => {
  if (!nt || e.target.closest('input, textarea, select, [contenteditable]') || !sheet.hidden) return;
  if (e.key === 'Escape') { e.stopImmediatePropagation(); return closeNoteTree(); }
  if (ntEl.classList.contains('readonly')) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.stopImmediatePropagation(); return $(e.shiftKey ? '#ntredo' : '#ntundo').click(); }
  const k = { v: 'select', p: 'pen', h: 'hl', t: 'text', e: 'eraser' }[e.key.toLowerCase()];
  if (k && !e.ctrlKey && !e.metaKey) { e.stopImmediatePropagation(); ntSetTool(k); }
}, true);
function openTreesList() {
  const list = Object.entries(S.trees);
  openSheet('NoteTrees', (canEditTrees() ? '' : '<p class="hint" style="margin-top:0">On a phone NoteTrees open to view. Edit them on a tablet or computer.</p>') +
    (list.length ? `<ul class="list">${list.map(([k, x]) => `<li><button data-tree="${esc(k)}"><b>${esc(treeLabel(k))}</b><span class="meta">${x.strokes.length} stroke${x.strokes.length === 1 ? '' : 's'} · ${x.boxes.length} text box${x.boxes.length === 1 ? '' : 'es'}</span></button></li>`).join('')}</ul>`
      : `<p class="empty"><b>No NoteTrees yet</b>${canEditTrees() ? 'Tap a verse and choose NoteTree, or select verses and press NoteTree.' : 'Make one on a tablet or computer.'}</p>`));
}
async function openTree(k) {
  const [b, c, r] = k.split('.'), [f, t] = r.split('-').map(Number);
  if (chap?.b !== b || chap?.c !== +c) { go(b, c); await new Promise(res => { const w = () => chap?.b === b && chap?.c === +c ? res() : setTimeout(w, 50); w(); }); }
  openNoteTree(f, t);
}

/* ---------- global clicks ---------- */
document.addEventListener('click', async e => {
  const t = e.target;
  const q = s => t.closest(s);
  if (q('#nt')) return; // NoteTree handles its own clicks
  if (q('#menubtn')) return menu.hidden ? openMenu() : closeMenu(true);
  if (menu.contains(t)) {
    if (q('[data-layer]')) return toggleLayer(q('[data-layer]').dataset.layer);
    if (q('[data-preset]')) { Object.assign(S.set.layers, PRESETS[q('[data-preset]').dataset.preset]); save(); render(); renderMenu(); return; }
    closeMenu();
    if (q('#playbtn')) return speech.on ? stopReading() : startReading(cur.v || 1);
    if (q('#gotobtn')) return openPicker();
    if (q('#treesbtn')) return openTreesList();
  } else closeMenu();
  if (q('#refbtn')) return openPicker();
  if (q('[data-test]')) return openPicker(q('[data-test]').dataset.test);
  if (q('[data-book]')) return openChapters(q('[data-book]').dataset.book);
  if (q('[data-ch]')) { const x = q('[data-ch]'); closeSheet(); return go(x.dataset.b, x.dataset.ch); }
  if (q('#prev')) { const p = prevOf(cur.b, cur.c); return p && go(p.b, p.c); }
  if (q('#next')) { const p = nextOf(cur.b, cur.c); return p && go(p.b, p.c); }
  if (q('#searchbtn, #hsearch')) return openSearch();
  if (q('#studybtn')) return openStudies();
  if (q('#savedbtn')) return openSaved();
  if (q('#setbtn')) return openSettings();
  if (q('#home')) { e.preventDefault(); return go(cur.b, cur.c); }
  if (q('[data-saved]')) return openSaved(q('[data-saved]').dataset.saved);
  if (q('[data-tree]')) { e.preventDefault(); return openTree(q('[data-tree]').dataset.tree); }
  if (q('[data-ntopen]')) { const v = +q('[data-ntopen]').dataset.ntopen; return openNoteTree(v, v); }
  if (q('[data-open]')) return openAnchor(q('[data-open]').dataset.open);
  if (q('[data-study]')) return openStudy(q('[data-study]').dataset.study);
  if (q('[data-note]')) { e.preventDefault(); return noteEditor({ g: q('[data-note]').dataset.note }); }
  if (tool && q('[data-anchor]') && getSelection().isCollapsed && !q('a, button, [role=button], .vn')) return toolTap(e, t);
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
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('span[role=button]')) { e.preventDefault(); e.target.click(); return; }
  if (e.target.matches('input, textarea, select')) { if (e.key === 'Escape') closeSheet(); return; }
  if (e.key === 'Escape') { if (!menu.hidden) closeMenu(true); else if (!sheet.hidden) closeSheet(); else if (!palette.hidden) { palette.hidden = true; renderToolbar(); } else if (tool) setTool(tool); else { markbar.hidden = true; getSelection().removeAllRanges(); } }
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
  renderToolbar(); bumpIdle(); await render();
})();
}
