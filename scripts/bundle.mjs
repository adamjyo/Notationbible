#!/usr/bin/env node
// Build one self-contained HTML file (styles, scripts and data inlined) for quick previews:
//   node scripts/bundle.mjs            -> dist/notation-bible.html
// The real app (index.html + data/) is unchanged; this file is only a portable demo.
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFile(path.join(ROOT, f), 'utf8');
async function jsonFiles(dir) {
  const out = [];
  for (const e of await readdir(path.join(ROOT, dir), { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) out.push(...await jsonFiles(p));
    else if (p.endsWith('.json')) out.push(p);
  }
  return out;
}

// The one-file demo carries the complete Bible text (all 66 books, with footnotes, cross references,
// lexicon and places). The heaviest extras (interlinear, JFB, other translations,
// topics) are limited to a few books to keep the file small; override with BUNDLE_BOOKS=a,b,c.
const KEEP = new Set((process.env.BUNDLE_BOOKS || 'genesis,psalms,john,romans').split(','));
const LIMITED = /^data\/(il|commentary\/jfb)\/([\w-]+)\.json$/;          // per-book folders to trim
const LIMITED_PACKED = ['data/tr/kjv.json', 'data/tr/asv.json', 'data/tr/ylt.json', 'data/tr/web.json', 'data/topics/v.json'];
const data = {};
for (const f of await jsonFiles('data')) {
  const m = f.match(LIMITED);
  if (m && !KEEP.has(m[2])) continue;
  if (/REPORT|IMPORT/.test(f)) continue;
  data[f] = JSON.parse(await read(f));
  if (LIMITED_PACKED.includes(f)) for (const b of Object.keys(data[f])) if (!KEEP.has(b)) delete data[f][b];
}
const mf = data['data/manifest.json'];
if (mf && !mf.sample) {
  for (const t of mf.layers.translations || []) t.books = t.books.filter(b => KEEP.has(b));
  for (const c of mf.layers.commentary || []) if (c.id === 'jfb') c.books = c.books.filter(b => KEEP.has(b));
  const names = [...KEEP].map(b => b[0].toUpperCase() + b.slice(1)).join(', ');
}
// keep only the topics that the demo's verse links use
const usedTopics = new Set();
for (const ids of Object.values(data['data/topics/v.json'] || {}).flatMap(o => Object.values(o))) ids.forEach(id => usedTopics.add(id));
for (const f of Object.keys(data)) if (f.startsWith('data/topics/t/')) for (const k in data[f]) if (!usedTopics.has(k)) delete data[f][k];
if (data['data/topics/index.json']) data['data/topics/index.json'] = data['data/topics/index.json'].filter(t => usedTopics.has(t[0]));
for (const f of ['data/lexicon/greek.json', 'data/lexicon/hebrew.json']) // shorter definitions keep the demo light
  if (data[f]) for (const k in data[f]) { const d = data[f][k][3] || ''; if (d.length > 400) data[f][k][3] = d.slice(0, 400) + '…'; }
const [css, books, app] = await Promise.all([read('styles.css'), read('books.js'), read('app.js')]);
const inline = s => s.replace(/<\/script/gi, '<\\/script'); // keep inlined code from closing its tag

let html = await read('index.html');
const swap = (from, to) => { if (!html.includes(from)) throw new Error('index.html changed: ' + from); html = html.replace(from, () => to); };
swap('<link rel="icon" href="icon.svg" type="image/svg+xml">', `<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(await read('icon.svg'))}" type="image/svg+xml">`);
swap('<link rel="stylesheet" href="styles.css">', `<style>\n${css}\n</style>`);
swap('<script src="books.js"></script>', `<script>\n${inline(books)}\n</script>\n<script>window.__DATA = ${inline(JSON.stringify(data))};</script>`);
swap('<script src="app.js"></script>', `<script>\n${inline(app)}\n</script>`);

await mkdir(path.join(ROOT, 'dist'), { recursive: true });
await writeFile(path.join(ROOT, 'dist/notation-bible.html'), html);
console.log(`dist/notation-bible.html  ${(html.length / 1024).toFixed(0)} KB, ${Object.keys(data).length} data files inlined`);
