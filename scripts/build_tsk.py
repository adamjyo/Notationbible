"""Treasury of Scripture Knowledge, anchored to phrases in the BSB, from
CrossReferences-org/bible-cross-references (CC BY 4.0; TSK itself is public domain).
Writes data/tsk/<book>.json: {"c:v": [[phrase, [ref, ...]], ...]} where a ref is
"book.c.v", "book.c.v-w" (same chapter), "book.c.v-c2.w" (across chapters) or several of
those joined with "+" when one TSK reference names separate verses.
python3 scripts/build_tsk.py /path/to/bible-cross-references/json"""
import json, os, sys, collections
sys.path.insert(0, os.path.dirname(__file__))
from sword import IDS
src = sys.argv[1]
out = os.path.join(os.path.dirname(__file__), '..', 'data', 'tsk')
books = json.load(open(os.path.join(src, 'bible_books.json')))
assert [b['id'] for b in books] == list(range(1, 67))
verses = json.load(open(os.path.join(src, 'bible_verses.json')))
pos = {}
for v in verses:
    if v.get('bsb_ch') and v.get('bsb_vs'): pos[v['id']] = (IDS[v['book_id'] - 1], v['bsb_ch'], v['bsb_vs'])
xr = json.load(open(os.path.join(src, 'cross_references.json')))

def group(ids):
    vs = []
    for i in ids:
        p = pos.get(i)
        if p and p not in vs: vs.append(p)
    runs = []
    for p in vs:
        if runs and runs[-1][1][0] == p[0] and (p[1:] == (runs[-1][1][1], runs[-1][1][2] + 1) or (p[1] == runs[-1][1][1] + 1 and p[2] == 1)):
            runs[-1][1] = p
        else: runs.append([p, p])
    def fmt(a, z):
        if a == z: return f'{a[0]}.{a[1]}.{a[2]}'
        if a[1] == z[1]: return f'{a[0]}.{a[1]}.{a[2]}-{z[2]}'
        return f'{a[0]}.{a[1]}.{a[2]}-{z[1]}.{z[2]}'
    return '+'.join(fmt(a, z) for a, z in runs)

per = collections.defaultdict(lambda: collections.defaultdict(list))
n = nref = 0
for row in sorted(xr, key=lambda r: (r['verse_id'], r['sort'])):
    p = pos.get(row['verse_id'])
    if not p: continue
    refs = [g for g in (group(ids) for ids in row['refs']) if g]
    if not refs: continue
    per[p[0]][f'{p[1]}:{p[2]}'].append([(row.get('bsb') or '').strip(), refs])
    n += 1; nref += len(refs)
os.makedirs(out, exist_ok=True)
for b, d in per.items():
    json.dump(d, open(os.path.join(out, f'{b}.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(f'TSK: {n} anchors, {nref} references, {len(per)} books')
