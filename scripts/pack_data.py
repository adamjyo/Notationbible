#!/usr/bin/env python3
"""Merge small per-book data folders into one file each, to keep the file count low
(claude.ai artifacts hold at most 512 files; fewer files also install faster in WordPress).

    python3 scripts/pack_data.py

data/<dir>/<book>.json  ->  data/<dir>.json  as {"<book>": {...}}, and the folder is removed.
The app reads the list of packed folders from manifest.packed. Big per-book layers
(bsb, il, xrefs, commentary/jfb) stay one file per book so a chapter loads only its own book.
"""
import json, os, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data')
PACK = ['footnotes', 'tr/kjv', 'tr/asv', 'tr/ylt', 'tr/web', 'places/v', 'topics/v']
mf = os.path.join(DATA, 'manifest.json'); m = json.load(open(mf, encoding='utf-8'))
packed = set(m.get('packed', []))
for d in PACK:
    src = os.path.join(DATA, d)
    if not os.path.isdir(src): continue
    out = {f[:-5]: json.load(open(os.path.join(src, f), encoding='utf-8')) for f in sorted(os.listdir(src)) if f.endswith('.json')}
    with open(src + '.json', 'w', encoding='utf-8') as f: json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
    shutil.rmtree(src); packed.add(d)
    print(f'packed {d}: {len(out)} books, {os.path.getsize(src + ".json") / 1e6:.1f} MB')
m['packed'] = sorted(packed)
with open(mf, 'w', encoding='utf-8') as f: json.dump(m, f, ensure_ascii=False, indent=1)
print('data files:', sum(len(fs) for _, _, fs in os.walk(DATA)))
