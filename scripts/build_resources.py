#!/usr/bin/env python3
"""Build the extra study resources in data/ (stdlib only). Run by .github/workflows/import-resources.yml.

    python3 scripts/build_resources.py --raw raw/

Expects in raw/ (the workflow downloads them):
  scrollmapper/formats/csv/{KJV,ASV,WEB,YLT}.csv   scrollmapper/bible_databases (MIT); the texts are public domain
  eastons.json                                     garydavenport73/eastons-bible-dictionary-json (MIT); Easton 1897, public domain
  topical/dist/{nave,torrey}/{topics,entries,assertions}.jsonl   j86schroeder/topical-bible-search (MIT)
  geo/data/{ancient,modern}.jsonl                  openbibleinfo/Bible-Geocoding-Data (CC BY 4.0)
and fetches Jamieson-Fausset-Brown from HelloAO's Free Use Bible API (public domain).

Output (all keyed by the app's book ids):
  data/tr/<ID>/<book>.json            {"chapters":{"1":[text,...]}}
  data/commentary/<id>/<book>.json    {"c:v":"text"}
  data/dictionary/easton.json         {"Term":["definition", ...]}
  data/topics/index.json              [[id, name, source, entries]]
  data/topics/t/<shard>.json          {id:[name, source, [[text, [refs]], ...], seeAlso]}
  data/topics/v/<book>.json           {"c:v":[topic ids]}
  data/places/index.json              {id:[name, slug, "lon,lat" or ""]}
  data/places/v/<book>.json           {"c:v":[place ids]}
"""
import argparse, collections, concurrent.futures, csv, json, os, re, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data')
csv.field_size_limit(10**8)
BOOKS = [(i, n, int(c)) for i, n, c in re.findall(r"\['([\w-]+)','([^']+)',(\d+)\]", open(os.path.join(ROOT, 'books.js'), encoding='utf-8').read())]
IDS = [b[0] for b in BOOKS]
USFM = 'GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV'.split()
OSIS = 'Gen Exod Lev Num Deut Josh Judg Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer Lam Ezek Dan Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal Matt Mark Luke John Acts Rom 1Cor 2Cor Gal Eph Phil Col 1Thess 2Thess 1Tim 2Tim Titus Phlm Heb Jas 1Pet 2Pet 1John 2John 3John Jude Rev'.split()
FROM_OSIS = dict(zip(OSIS, IDS))
CHAPTERS = {b: c for b, _, c in BOOKS}

def norm(s):
    s = s.lower().strip()
    s = re.sub(r'^(iii|ii|i)\s+', lambda m: {'i': '1', 'ii': '2', 'iii': '3'}[m.group(1)], s)
    return re.sub(r'[^a-z0-9]', '', s)
NAME = {norm(n): i for i, n, _ in BOOKS}
NAME.update({'psalm': 'psalms', 'songofsongs': 'song-of-solomon', 'canticles': 'song-of-solomon', 'revelationofjohn': 'revelation',
             'revelations': 'revelation', 'acts of the apostles': 'acts', 'actsoftheapostles': 'acts', 'ecclesiastesorthepreacher': 'ecclesiastes'})
unknown = collections.Counter()
def book(name):
    b = NAME.get(norm(name))
    if not b: unknown[name] += 1
    return b

def write(path, obj):
    p = os.path.join(DATA, path); os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f: json.dump(obj, f, ensure_ascii=False, separators=(',', ':'))
def jsonl(path):
    with open(path, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line: yield json.loads(line)
TAG = re.compile(r'<[^>]+>')
clean = lambda s: re.sub(r'\s+', ' ', TAG.sub(' ', s or '')).strip()
rep = []

def translations(raw):
    out = {}
    for tid in ('KJV', 'ASV', 'WEB', 'YLT'):
        p = os.path.join(raw, 'scrollmapper', 'formats', 'csv', f'{tid}.csv')
        if not os.path.exists(p): rep.append(f'translation {tid}: missing'); continue
        chs = collections.defaultdict(lambda: collections.defaultdict(dict))
        with open(p, encoding='utf-8-sig', newline='') as f:
            for r in csv.DictReader(f):
                b = book(r['Book'])
                if b and r['Text'].strip(): chs[b][int(r['Chapter'])][int(r['Verse'])] = r['Text'].replace('¶', '').strip()
        n = 0
        for b, cs in chs.items():
            write(f'tr/{tid.lower()}/{b}.json', {'chapters': {str(c): [vs.get(v, '') for v in range(1, max(vs) + 1)] for c, vs in sorted(cs.items())}})
            n += sum(len(vs) for vs in cs.values())
        out[tid.lower()] = sorted(chs)
        rep.append(f'translation {tid}: {len(chs)} books, {n} verses')
    return out

def helloao_commentary(cid, workers=8):
    def get(args):
        b, code, c = args
        url = f'https://bible.helloao.org/api/c/{cid}/{code}/{c}.json'
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'NotationBibleImporter/1.0'}), timeout=60) as r:
                return b, c, json.load(r)
        except Exception as e:
            return b, c, None
    jobs = [(b, USFM[i], c) for i, b in enumerate(IDS) for c in range(1, CHAPTERS[b] + 1)]
    per = collections.defaultdict(dict); miss = 0
    with concurrent.futures.ThreadPoolExecutor(workers) as ex:
        for b, c, d in ex.map(get, jobs):
            if not d: miss += 1; continue
            add_chapter(per[b], c, d)
    rep.append(f'commentary {cid}: {sum(len(v) for v in per.values())} entries, {miss} chapters unavailable')
    return per

def add_chapter(target, c, d):
    for item in (d.get('chapter') or {}).get('content', []):
        if item.get('type') != 'verse': continue
        parts = [x if isinstance(x, str) else x.get('text', '') for x in item.get('content', [])]
        t = clean(' '.join(p for p in parts if p))
        if t: target[f"{c}:{item.get('number')}"] = t

def pillar_commentary(raw, cid):
    base = os.path.join(raw, 'pillar', 'c', cid); per = collections.defaultdict(dict)
    if not os.path.isdir(base): rep.append(f'commentary {cid}: missing'); return per
    for i, b in enumerate(IDS):
        d = os.path.join(base, USFM[i])
        if not os.path.isdir(d): continue
        for fn in os.listdir(d):
            if fn.endswith('.json') and fn[:-5].isdigit():
                add_chapter(per[b], int(fn[:-5]), json.load(open(os.path.join(d, fn), encoding='utf-8')))
    rep.append(f'commentary {cid}: {sum(len(v) for v in per.values())} entries in {len(per)} books')
    return per

def dictionary(raw):
    p = os.path.join(raw, 'eastons.json')
    if not os.path.exists(p): rep.append('easton: missing'); return 0
    src = json.load(open(p, encoding='utf-8')); out = {}
    for term, senses in src.items():
        defs = [clean(s.get('definition', '') if isinstance(s, dict) else str(s)) for s in (senses if isinstance(senses, list) else [senses])]
        defs = [d for d in defs if d]
        if defs: out[term.strip()] = defs
    write('dictionary/easton.json', out); rep.append(f'easton: {len(out)} terms')
    return len(out)

def topics(raw):
    index, shards, byverse = [], collections.defaultdict(dict), collections.defaultdict(lambda: collections.defaultdict(set))
    for src in ('nave', 'torrey'):
        d = os.path.join(raw, 'topical', 'dist', src)
        if not os.path.isdir(d): rep.append(f'{src}: missing'); continue
        refs = collections.defaultdict(list)
        for a in jsonl(os.path.join(d, 'assertions.jsonl')):
            refs[a['entryId']].append(a)
        entries = collections.defaultdict(list)
        for e in jsonl(os.path.join(d, 'entries.jsonl')):
            entries[e['topicId']].append(e)
        n = 0
        for t in jsonl(os.path.join(d, 'topics.jsonl')):
            tid = t['id'].replace(':', '-')
            name = t['sourceTopic'].title()
            rows = []
            for e in sorted(entries.get(t['id'], []), key=lambda e: e.get('entryIndex', 0)):
                rs = []
                for a in refs.get(e['id'], []):
                    b = book(a.get('book', ''))
                    if not b: continue
                    rs.append(a.get('normalizedRef') or '')
                    cs, vs, ce, ve = a.get('chapterStart'), a.get('verseStart'), a.get('chapterEnd') or a.get('chapterStart'), a.get('verseEnd') or a.get('verseStart')
                    if a.get('scope') == 'verse' and cs and vs and ce == cs and ve and ve - vs < 40:
                        for v in range(vs, ve + 1): byverse[b][f'{cs}:{v}'].add(tid)
                text = re.sub(r'\s+', ' ', e.get('rawText', '')).strip()
                rows.append([text, [r for r in rs if r]])
            shard = (re.sub(r'[^a-z]', '', t['sourceTopicSlug'])[:1] or 'x')
            shards[shard][tid] = [name, src, rows, t.get('seeAlso', [])]
            index.append([tid, name, src, len(rows)]); n += 1
        rep.append(f'{src}: {n} topics')
    write('topics/index.json', index)
    for s, d in shards.items(): write(f'topics/t/{s}.json', d)
    for b, vs in byverse.items(): write(f'topics/v/{b}.json', {k: sorted(v) for k, v in vs.items()})
    rep.append(f'topic verse links: {sum(len(v) for vs in byverse.values() for v in vs.values())}')

def first_lonlat(o):
    """First 'lon,lat' string found under a key named lonlat (the geocoding files nest it in several places)."""
    if isinstance(o, dict):
        for k, v in o.items():
            if k == 'lonlat' and isinstance(v, str) and re.match(r'^-?[\d.]+,-?[\d.]+$', v): return v
            r = first_lonlat(v)
            if r: return r
    elif isinstance(o, list):
        for v in o:
            r = first_lonlat(v)
            if r: return r
    return ''

def places(raw):
    d = os.path.join(raw, 'geo', 'data')
    if not os.path.isdir(d): rep.append('places: missing'); return
    modern = {m.get('id'): first_lonlat(m) for m in jsonl(os.path.join(d, 'modern.jsonl'))}
    index, byverse, keys_seen = {}, collections.defaultdict(lambda: collections.defaultdict(set)), None
    for a in jsonl(os.path.join(d, 'ancient.jsonl')):
        if keys_seen is None: keys_seen = sorted(a.keys())
        ex = a.get('extra'); ex = json.loads(ex) if isinstance(ex, str) else (ex or {})
        ll = first_lonlat({k: v for k, v in a.items() if k != 'extra'})
        if not ll:  # fall back to the best-scoring modern location
            for asc in sorted(ex.get('associations', []), key=lambda x: -x.get('score', 0)):
                if modern.get(asc.get('modern_id')): ll = modern[asc['modern_id']]; break
        pid = a.get('id')
        index[pid] = [a.get('friendly_id') or a.get('name') or '', a.get('url_slug', ''), ll]
        for o in (a.get('verses') or ex.get('osises') or []):
            o = o.get('osis') if isinstance(o, dict) else o
            m = re.match(r'^(\w+)\.(\d+)\.(\d+)', o or '')
            if m and FROM_OSIS.get(m.group(1)): byverse[FROM_OSIS[m.group(1)]][f'{m.group(2)}:{m.group(3)}'].add(pid)
    write('places/index.json', index)
    for b, vs in byverse.items(): write(f'places/v/{b}.json', {k: sorted(v) for k, v in vs.items()})
    rep.append(f'places: {len(index)} places, {sum(1 for x in index.values() if x[2])} with coordinates, '
               f'{sum(len(v) for vs in byverse.values() for v in vs.values())} verse links; ancient keys: {keys_seen}')

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--raw', default='raw'); ap.add_argument('--skip-web', action='store_true')
    a = ap.parse_args()
    trs = translations(a.raw)
    coms = []
    if not a.skip_web:
        jfb = helloao_commentary('jamieson-fausset-brown')
        if jfb:
            for b, d in jfb.items(): write(f'commentary/jfb/{b}.json', d)
            coms.append({'id': 'jfb', 'name': 'Jamieson-Fausset-Brown', 'books': sorted(jfb), 'note': 'Jamieson, Fausset & Brown, Commentary Critical and Explanatory on the Whole Bible (1871). Public domain, via HelloAO Free Use Bible API.'})
    # Scofield Reference Notes were removed from the app at the owner's request; not rebuilt.
    dictionary(a.raw); topics(a.raw); places(a.raw)
    mf = os.path.join(DATA, 'manifest.json'); m = json.load(open(mf, encoding='utf-8'))
    L = m.setdefault('layers', {})
    L['commentary'] = coms
    L['translations'] = [{'id': t, 'abbr': t.upper(), 'name': {'kjv': 'King James Version', 'asv': 'American Standard Version (1901)', 'web': 'World English Bible', 'ylt': "Young's Literal Translation"}[t], 'books': bs} for t, bs in trs.items()]
    L['dictionary'] = {'source': "Easton's Bible Dictionary (1897), public domain"}
    L['topics'] = {'source': "Nave's Topical Bible and Torrey's New Topical Textbook, public domain; data from topical-bible-search (MIT)"}
    L['places'] = {'source': 'OpenBible.info Bible Geocoding Data, CC BY 4.0'}
    with open(mf, 'w', encoding='utf-8') as f: json.dump(m, f, ensure_ascii=False, indent=1)
    size = lambda d: sum(os.path.getsize(os.path.join(dp, x)) for dp, _, fs in os.walk(os.path.join(DATA, d)) for x in fs) / 1e6 if os.path.isdir(os.path.join(DATA, d)) else 0
    rep.append('sizes (MB): ' + ', '.join(f'{d}={size(d):.1f}' for d in ('tr', 'commentary', 'dictionary', 'topics', 'places')))
    rep.append(f'unknown book names: {dict(unknown.most_common(20))}')
    with open(os.path.join(DATA, 'RESOURCES_IMPORT.md'), 'w', encoding='utf-8') as f: f.write('# Resources import\n\n' + '\n'.join(rep) + '\n')
    print('\n'.join(rep))

if __name__ == '__main__':
    main()
