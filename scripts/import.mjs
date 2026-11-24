#!/usr/bin/env node
// Import full data sets into data/. Node 18+, no dependencies.
//
//   node scripts/import.mjs xrefs      <cross_references.txt>     OpenBible.info (CC BY)            — tested format
//   node scripts/import.mjs bsb        <bsb_tables.tsv>           Berean translation tables (PD)    — run --inspect first
//   node scripts/import.mjs lexicon    <TBESG.txt> <TBESH.txt>    STEPBible lexicons (CC BY 4.0)     — run --inspect first
//   node scripts/import.mjs commentary <id> "<Name>" <file.csv>   any commentary as ref,text CSV
//   node scripts/import.mjs <source> --inspect <file>             print the header and first rows
//
// Each run rewrites the files for that layer and updates data/manifest.json.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
await import(path.join(ROOT, 'books.js'));
const BOOKS = globalThis.BOOKS;
const DATA = path.join(ROOT, 'data');

// OSIS / common abbreviations → book ids
const OSIS = 'Gen Exod Lev Num Deut Josh Judg Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer Lam Ezek Dan Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal Matt Mark Luke John Acts Rom 1Cor 2Cor Gal Eph Phil Col 1Thess 2Thess 1Tim 2Tim Titus Phlm Heb Jas 1Pet 2Pet 1John 2John 3John Jude Rev'.split(' ');
const fromOsis = Object.fromEntries(OSIS.map((o, i) => [o, BOOKS[i].id]));
const byName = Object.fromEntries(BOOKS.map(b => [b.name.toLowerCase(), b.id]));
byName.psalm = 'psalms';

const json = async (p, o) => { const f = path.join(DATA, p); await mkdir(path.dirname(f), { recursive: true }); await writeFile(f, JSON.stringify(o)); };
async function manifest(fn) {
  const f = path.join(DATA, 'manifest.json');
  let m = {}; try { m = JSON.parse(await readFile(f, 'utf8')); } catch {}
  m.layers ||= {}; fn(m); await writeFile(f, JSON.stringify(m, null, 1));
}
async function* lines(file) { const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity }); for await (const l of rl) yield l.replace(/^﻿/, ''); }
async function inspect(file) { let i = 0; for await (const l of lines(file)) { console.log(i, JSON.stringify(l.split('\t'))); if (++i > 8) break; } }

const [, , source, ...args] = process.argv;
if (args[0] === '--inspect') { await inspect(args[1]); process.exit(0); }

/* ---------- OpenBible cross references: "From Verse<TAB>To Verse<TAB>Votes", e.g. Gen.1.1  John.1.1-John.1.3  120 ---------- */
if (source === 'xrefs') {
  const per = {}; // book -> "c:v" -> [[ref, votes]]
  for await (const l of lines(args[0])) {
    const [from, to, votes] = l.split('\t');
    if (!from || from.startsWith('From')) continue;
    const [fb, fc, fv] = from.split('.'), [tb, tc, tv] = to.split('-')[0].split('.');
    const b = fromOsis[fb], t = fromOsis[tb]; if (!b || !t) continue;
    ((per[b] ||= {})[`${fc}:${fv}`] ||= []).push([`${t}.${tc}.${tv}`, +votes || 0]);
  }
  const MAX = 12; // keep the strongest links per verse
  for (const [b, vs] of Object.entries(per)) {
    const out = {}; for (const [k, list] of Object.entries(vs)) out[k] = list.sort((a, b) => b[1] - a[1]).slice(0, MAX).map(x => x[0]);
    await json(`xrefs/${b}.json`, out);
  }
  await manifest(m => { m.layers.xrefs = { books: Object.keys(per), source: 'OpenBible.info cross references (CC BY)' }; });
  console.log('cross references written for', Object.keys(per).length, 'books');
}

/* ---------- Berean translation tables → data/bsb/<book>.json tokens with Strong's ----------
   Columns are found by header name, so check them with --inspect first. Expected (Bible Hub "bsb_tables"):
   'BSB Sort' (English order), 'Verse' (e.g. "Genesis 1:1", only on a verse's first row), 'Language',
   original word column (header starting "WLC" or containing "Nestle"), 'Str Heb', 'Str Grk',
   'BSB version' (English rendering), 'pnc' (punctuation after), 'begQ'/'endQ' (quote marks), 'footnotes'. */
if (source === 'bsb') {
  const all = []; for await (const l of lines(args[0])) all.push(l);
  const hi = all.findIndex(l => /BSB Sort/i.test(l)); const header = hi < 0 ? null : all[hi].split('\t');
  if (!header) throw new Error('No header row with "BSB Sort" found. Run with --inspect and adjust the column names here.');
  const col = re => header.findIndex(h => re.test(h.trim()));
  const C = { sort: col(/^BSB Sort$/i), verse: col(/^Verse$/i), lang: col(/^Language$/i), orig: col(/^(WLC|.*Nestle)/i), sh: col(/^Str Heb$/i), sg: col(/^Str Grk$/i), en: col(/^BSB version$/i), pnc: col(/^pnc$/i), bq: col(/^begQ$/i), eq: col(/^endQ$/i), fn: col(/^footnotes$/i) };
  const missing = Object.entries(C).filter(([k, v]) => v < 0 && ['sort', 'verse', 'en'].includes(k));
  if (missing.length) throw new Error('Missing columns: ' + missing.map(m => m[0]).join(', ') + '. Header was: ' + header.join(' | '));
  const rows = [];
  for (const l of all.slice(hi + 1)) { const c = l.split('\t'); if (c.length > 3) rows.push(c); }
  rows.sort((a, b) => +a[C.sort] - +b[C.sort]);
  const books = {}, notes = {}; let ref = null;
  for (const r of rows) {
    if (r[C.verse]?.trim()) {
      const m = r[C.verse].trim().match(/^(.+?)\s+(\d+):(\d+)$/); if (!m) continue;
      ref = { b: byName[m[1].toLowerCase()], c: m[2], v: +m[3] }; if (!ref.b) { ref = null; continue; }
      const ch = ((books[ref.b] ||= {})[ref.c] ||= []); ch[ref.v - 1] = [];
    }
    if (!ref) continue;
    const toks = books[ref.b][ref.c][ref.v - 1];
    let en = (r[C.en] || '').trim(); if (!en || en === '-' || en === '. . .') continue;
    en = en.replace(/^vvv$/, '');
    const isH = /heb|aram/i.test(r[C.lang] || '');
    const num = (isH ? r[C.sh] : r[C.sg])?.trim();
    const pre = (toks.length ? ' ' : '') + (C.bq >= 0 ? (r[C.bq] || '').trim() : '');
    const post = (C.pnc >= 0 ? (r[C.pnc] || '').trim() : '') + (C.eq >= 0 ? (r[C.eq] || '').trim() : '');
    if (pre) toks.push(pre);
    toks.push(num ? [en, (isH ? 'H' : 'G') + num.replace(/\D/g, ''), (r[C.orig] || '').trim()] : en);
    if (post) toks.push(post);
    if (C.fn >= 0 && r[C.fn]?.trim()) (((notes[ref.b] ||= {})[`${ref.c}:${ref.v}`]) ||= []).push([en, r[C.fn].trim()]);
  }
  const counts = {};
  for (const [b, chs] of Object.entries(books)) {
    await json(`bsb/${b}.json`, { chapters: chs });
    counts[b] = Object.fromEntries(Object.entries(chs).map(([c, vs]) => [c, vs.length]));
  }
  for (const [b, d] of Object.entries(notes)) await json(`footnotes/${b}.json`, d);
  await manifest(m => { m.sample = false; m.books = counts; m.layers.footnotes = { books: Object.keys(notes), source: 'Berean Standard Bible footnotes' }; });
  console.log('BSB written for', Object.keys(books).length, 'books. Open a few chapters and compare against bereanbible.com before relying on it.');
}

/* ---------- STEPBible brief lexicons (TBESG Greek, TBESH Hebrew) ----------
   Data rows are tab-separated and start with an extended Strong's number such as "G0026" or "H0001".
   Expected columns: eStrong, dStrong, uStrong, lemma, transliteration, morph, gloss, definition. Check with --inspect. */
if (source === 'lexicon') {
  for (const [file, file2] of [[args[0], 'greek'], [args[1], 'hebrew']]) {
    if (!file) continue;
    const out = {};
    for await (const l of lines(file)) {
      const c = l.split('\t'); const m = c[0]?.match(/^([GH])(\d{4})([A-Z]?)\b/); if (!m || m[3]) continue; // base numbers only
      const key = m[1] + (+m[2]);
      if (out[key]) continue;
      out[key] = [c[3] || '', c[4] || '', c[6] || '', (c[7] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()];
    }
    await json(`lexicon/${file2}.json`, out);
    console.log(file2, Object.keys(out).length, 'entries');
  }
  await manifest(m => { m.layers.lexicon = { source: 'STEPBible TBESG/TBESH, Tyndale House Cambridge (CC BY 4.0)' }; });
}

/* ---------- commentary from a CSV: ref,text  (ref like "John 1:1-5" or "John 1:14") ---------- */
if (source === 'commentary') {
  const [id, name, file] = args; const per = {};
  const csv = await readFile(file, 'utf8');
  const re = /(?:^|\n)("(?:[^"]|"")*"|[^,\n]*),("(?:[^"]|"")*"|[^\n]*)/g; let m;
  const unq = s => s.startsWith('"') ? s.slice(1, -1).replace(/""/g, '"') : s;
  while ((m = re.exec(csv))) {
    const ref = unq(m[1]).trim(), text = unq(m[2]).trim();
    const r = ref.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/); if (!r) continue;
    const b = byName[r[1].toLowerCase()]; if (!b) continue;
    (per[b] ||= {})[`${r[2]}:${r[3]}${r[4] ? '-' + r[4] : ''}`] = text;
  }
  for (const [b, d] of Object.entries(per)) await json(`commentary/${id}/${b}.json`, d);
  await manifest(m => { m.layers.commentary = (m.layers.commentary || []).filter(c => c.id !== id).concat({ id, name, books: Object.keys(per) }); });
  console.log(name, 'written for', Object.keys(per).length, 'books');
}

if (!['xrefs', 'bsb', 'lexicon', 'commentary'].includes(source)) console.log('Usage: see the comment at the top of scripts/import.mjs');
