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

const data = {};
for (const f of await jsonFiles('data')) data[f] = JSON.parse(await read(f));
const [css, books, app] = await Promise.all([read('styles.css'), read('books.js'), read('app.js')]);
const inline = s => s.replace(/<\/script/gi, '<\\/script'); // keep inlined code from closing its tag

let html = await read('index.html');
const swap = (from, to) => { if (!html.includes(from)) throw new Error('index.html changed: ' + from); html = html.replace(from, () => to); };
swap('<link rel="stylesheet" href="styles.css">', `<style>\n${css}\n</style>`);
swap('<script src="books.js"></script>', `<script>\n${inline(books)}\n</script>\n<script>window.__DATA = ${inline(JSON.stringify(data))};</script>`);
swap('<script src="app.js"></script>', `<script>\n${inline(app)}\n</script>`);

await mkdir(path.join(ROOT, 'dist'), { recursive: true });
await writeFile(path.join(ROOT, 'dist/notation-bible.html'), html);
console.log(`dist/notation-bible.html  ${(html.length / 1024).toFixed(0)} KB, ${Object.keys(data).length} data files inlined`);
