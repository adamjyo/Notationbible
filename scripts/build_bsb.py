#!/usr/bin/env python3
"""Build the full-Bible data set in data/ from the Berean sources (stdlib only).

    python3 scripts/build_bsb.py --text bsb.txt --tables bsb_tables.tsv \
        --tbesg "TBESG ... .txt" --tbesh "TBESH ... .txt" [--report data/IMPORT_REPORT.md]

Sources (all downloaded by .github/workflows/import-bible.yml):
  bsb.txt, bsb_tables.tsv  BereanBible.com, Berean Standard Bible, public domain
  TBESG / TBESH            STEPBible.org, Tyndale House Cambridge, CC BY 4.0

Output
  data/bsb/<book>.json   {"fmt":2,"t":"H"|"G","chapters":{"1":[verse,...]},"h":{"c:v":[heading,parallels]},"p":{"c":[para-start verses]}}
                         A verse is the exact BSB text with tagged phrases written ⟨english¦num+num⟩.
  data/il/<book>.json    {"chapters":{"1":["orig¦translit¦parsing~...", ...]}}, one entry per tagged phrase, in order.
  data/footnotes/<book>.json  {"c:v":[[offset after the word, note, word]]}
  data/lexicon/greek.json, hebrew.json  {"G3056":[lemma, translit, gloss, definition]}
"""
import argparse, collections, csv, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data')
csv.field_size_limit(10**8)

BOOKS = [(i, n, int(c)) for i, n, c in re.findall(r"\['([\w-]+)','([^']+)',(\d+)\]", open(os.path.join(ROOT, 'books.js'), encoding='utf-8').read())]
assert len(BOOKS) == 66, len(BOOKS)
norm = lambda s: re.sub(r'[^a-z0-9]', '', s.lower())
NAME = {norm(n): i for i, n, _ in BOOKS}
NAME.update({'psalm': 'psalms', 'songofsongs': 'song-of-solomon', 'canticles': 'song-of-solomon'})
TESTAMENT = {b[0]: ('H' if k < 39 else 'G') for k, b in enumerate(BOOKS)}
REF = re.compile(r'^\s*(.+?)\s+(\d+):(\d+)\s*$')
TAG = re.compile(r'<[^>]+>')
HEB_MARKS = re.compile('[֑-ֽ֯]')  # cantillation and meteg; vowels are kept
PUNCT_AFTER = set('.,;:!?’”)\'"—–]')

def clean(s):
    s = (s or '').replace('|', '"')
    s = re.sub(r'<br\s*/?>', '\n', s, flags=re.I)
    return re.sub(r'[ \t]+', ' ', TAG.sub('', s)).strip()

def write(path, obj):
    p = os.path.join(DATA, path); os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f: json.dump(obj, f, ensure_ascii=False, separators=(',', ':'))

def book_of(name, unknown):
    b = NAME.get(norm(name))
    if not b: unknown[name] += 1
    return b

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--text', required=True); ap.add_argument('--tables', required=True)
    ap.add_argument('--tbesg'); ap.add_argument('--tbesh'); ap.add_argument('--report', default=os.path.join(DATA, 'IMPORT_REPORT.md'))
    a = ap.parse_args()
    rep, unknown = [], collections.Counter()

    # 1. exact verse text
    text = {}
    with open(a.text, encoding='utf-8-sig') as f:
        for line in f:
            parts = line.rstrip('\r\n').split('\t')
            if len(parts) < 2: continue
            m = REF.match(parts[0])
            if not m: continue
            b = book_of(m.group(1), unknown)
            if b: text[(b, int(m.group(2)), int(m.group(3)))] = parts[1].strip()
    rep.append(f'verses in bsb.txt: {len(text)}')

    # 2. word tables, in English order
    with open(a.tables, encoding='utf-8-sig', newline='') as f:
        rows = list(csv.reader(f, delimiter='\t', quoting=csv.QUOTE_NONE))
    hi = next(i for i, r in enumerate(rows) if any(c.strip() == 'BSB Sort' for c in r))
    H = [c.strip() for c in rows[hi]]
    col = lambda name, start=0: next(i for i, h in enumerate(H) if i >= start and h == name)
    C = {k: col(n) for k, n in [('sort', 'BSB Sort'), ('lang', 'Language'), ('translit', 'Translit'), ('parse', 'Parsing'), ('sh', 'Str Heb'), ('sg', 'Str Grk'),
                                 ('vid', 'VerseId'), ('hdg', 'Hdg'), ('xref', 'Crossref'), ('par', 'Par'), ('en', 'BSB version'), ('fn', 'footnotes')]}
    C['orig'] = next(i for i, h in enumerate(H) if h.startswith('WLC / Nestle Base'))
    rep.append('table columns: ' + ', '.join(f'{k}={H[v]!r}' for k, v in C.items()))
    data = []
    for r in rows[hi + 1:]:
        if len(r) <= C['en']: continue
        try: s = int(r[C['sort']])
        except ValueError: continue
        data.append((s, r))
    data.sort(key=lambda x: x[0])
    rep.append(f'table rows: {len(data)}')

    byverse, heads, paras, key = collections.defaultdict(list), {}, collections.defaultdict(list), None
    for _, r in data:
        vid = r[C['vid']].strip()
        if vid:
            m = REF.match(vid); b = m and book_of(m.group(1), unknown)
            key = (b, int(m.group(2)), int(m.group(3))) if b else None
            if key:
                h = clean(r[C['hdg']]); x = clean(r[C['xref']])
                if h: heads[key] = [h] + ([x] if x else [])
                if r[C['par']].strip(): paras[(key[0], key[1])].append(key[2])
        if key: byverse[key].append(r)

    # 3. align table phrases to the exact text
    books = collections.defaultdict(lambda: collections.defaultdict(dict))
    ils = collections.defaultdict(lambda: collections.defaultdict(dict))
    notes = collections.defaultdict(dict)
    stats = collections.Counter(); misses = []; debug = []
    for (b, c, v), vtext in text.items():
        pre, segs, il, fns, cur = TESTAMENT[b], [], [], [], 0
        for r in byverse.get((b, c, v), []):
            en = r[C['en']].strip()
            heb = 'heb' in r[C['lang']].lower() or 'aram' in r[C['lang']].lower()
            num = re.sub(r'\D', '', r[C['sh'] if heb else C['sg']])
            num = str(int(num)) if num else ''
            orig = r[C['orig']].strip(); orig = HEB_MARKS.sub('', orig) if heb else orig
            fn = clean(r[C['fn']])
            info = '¦'.join(x.replace('¦', '/').replace('~', '-') for x in (orig, r[C['translit']].strip(), r[C['parse']].strip().replace(' | ', '/').replace('|', '/')))
            if b == 'john' and c == 1 and v <= 2: debug.append(f"john 1:{v} sort={r[C['sort']]} en={en!r} num={num!r} orig={orig!r}")
            if en in ('', '-', 'vvv'):
                stats['untranslated'] += 1; continue
            if en in ('. . .', '...', '…'):  # continues the previous phrase
                last = next((k for k in range(len(segs) - 1, -1, -1) if isinstance(segs[k], list)), None)
                if last is not None and num: segs[last][1] += '+' + num; il[-1] += ' ' + info.split('¦')[0]
                continue
            # the tables bracket words the translators supplied ("[was] good", "{as well}"); the printed text doesn't
            idx = -1
            for cand in dict.fromkeys([en, re.sub(r'[\[\]{}]', '', en).strip(), re.sub(r'\[[^\]]*\]|\{[^}]*\}', '', en).strip()]):
                if not cand: continue
                idx = vtext.find(cand, cur)
                if idx < 0:
                    j = vtext.lower().find(cand.lower(), cur)
                    idx = j if 0 <= j and j - cur < 80 else -1
                if 0 <= idx and idx - cur <= 300: en = cand; break
                idx = -1
            if idx < 0:
                stats['missed'] += 1
                if len(misses) < 40: misses.append(f'{b} {c}:{v} {en!r}')
                continue
            if idx > cur: segs.append(vtext[cur:idx])
            piece = vtext[idx:idx + len(en)]
            if num: segs.append([piece, num]); il.append(info); stats['tagged'] += 1
            else: segs.append(piece); stats['untagged'] += 1
            cur = idx + len(en)
            if fn:
                end = cur
                while end < len(vtext) and vtext[end] in PUNCT_AFTER: end += 1
                fns.append([end, fn, piece])
        if cur < len(vtext): segs.append(vtext[cur:])
        out = ''.join(s.replace('⟨', '(').replace('⟩', ')') if isinstance(s, str) else f'⟨{s[0]}¦{s[1]}⟩' for s in segs)
        books[b][str(c)][v] = out; ils[b][str(c)][v] = '~'.join(il)
        if fns: notes[b][f'{c}:{v}'] = fns
        stats['verses'] += 1; stats['verses_tagged'] += bool(il)

    manifest_books = {}
    for b, _, _ in BOOKS:
        chs = books.get(b, {})
        if not chs: rep.append(f'MISSING BOOK {b}'); continue
        ordered = {c: [chs[c].get(v, '') for v in range(1, max(chs[c]) + 1)] for c in sorted(chs, key=int)}
        write(f'bsb/{b}.json', {'fmt': 2, 't': TESTAMENT[b], 'chapters': ordered,
                                'h': {f'{c}:{v}': h for (bb, c, v), h in heads.items() if bb == b},
                                'p': {str(c): sorted(set(vs)) for (bb, c), vs in paras.items() if bb == b}})
        write(f'il/{b}.json', {'chapters': {c: [ils[b][c].get(v, '') for v in range(1, max(ils[b][c]) + 1)] for c in sorted(ils[b], key=int)}})
        if notes.get(b): write(f'footnotes/{b}.json', notes[b])
        manifest_books[b] = {c: len(vs) for c, vs in ordered.items()}

    # 4. lexicons
    for path, name in ((a.tbesg, 'greek'), (a.tbesh, 'hebrew')):
        if not path: continue
        lex = {}
        with open(path, encoding='utf-8-sig') as f:
            for line in f:
                c = line.rstrip('\r\n').split('\t')
                m = re.match(r'^([GH])(\d{4})$', c[0].strip()) if c else None
                if not m or len(c) < 8: continue
                k = m.group(1) + str(int(m.group(2)))
                if k in lex: continue
                d = clean(c[7].replace('<BR />', '\n').replace('<br>', '\n'))
                d = re.sub(r'\n{3,}', '\n\n', d)
                lex[k] = [c[3].strip(), c[4].strip(), clean(c[6]), d[:1200] + ('…' if len(d) > 1200 else '')]
        write(f'lexicon/{name}.json', lex); rep.append(f'lexicon {name}: {len(lex)} entries')

    mf = os.path.join(DATA, 'manifest.json')
    m = json.load(open(mf, encoding='utf-8')) if os.path.exists(mf) else {}
    m.update({'sample': False, 'books': manifest_books,
              'translation': {'id': 'bsb', 'abbr': 'BSB', 'name': 'Berean Standard Bible', 'license': 'Public domain (dedicated April 30, 2023)'}})
    L = m.setdefault('layers', {})
    L['footnotes'] = {'books': sorted(notes), 'source': 'Berean Standard Bible footnotes'}
    L['lexicon'] = {'source': 'STEPBible.org brief lexicons (TBESG, TBESH), Tyndale House Cambridge, CC BY 4.0'}
    L['interlinear'] = {'source': 'Berean Bible translation tables (public domain)'}
    with open(mf, 'w', encoding='utf-8') as f: json.dump(m, f, ensure_ascii=False, indent=1)

    size = lambda d: sum(os.path.getsize(os.path.join(dp, x)) for dp, _, fs in os.walk(os.path.join(DATA, d)) for x in fs) / 1e6
    rep += [f'{k}: {v}' for k, v in stats.most_common()]
    rep.append(f"tag coverage: {stats['tagged'] / max(1, stats['tagged'] + stats['missed']):.4f}")
    rep.append(f'unknown book names: {dict(unknown)}')
    rep.append('sizes (MB): ' + ', '.join(f'{d}={size(d):.1f}' for d in ('bsb', 'il', 'footnotes', 'lexicon', 'xrefs')))
    rep.append('first misses:\n  ' + '\n  '.join(misses))
    rep.append('sample John 1:1: ' + books.get('john', {}).get('1', {}).get(1, '?'))
    rep.append('sample IL John 1:1: ' + ils.get('john', {}).get('1', {}).get(1, '?')[:300])
    rep.append('sample Gen 1:1 heading: ' + str(heads.get(('genesis', 1, 1))))
    rep.append('John 1:1-2 rows in English order:\n  ' + '\n  '.join(debug))
    with open(a.report, 'w', encoding='utf-8') as f: f.write('# Import report\n\n' + '\n'.join(rep) + '\n')
    print('\n'.join(rep))
    if stats['verses'] < 31000: sys.exit('too few verses')

if __name__ == '__main__':
    main()
