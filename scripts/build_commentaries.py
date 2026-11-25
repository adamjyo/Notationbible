"""Builds the commentary packs and the Morning and Evening devotional.

    python3 scripts/build_commentaries.py --raw raw --out packs [--only id,id] [--report path]

Each pack is written as <out>/<id>/<book>.json ({"c:v" or "c:v-w": text}) plus
<out>/<id>/meta.json, and <out>/<id>.zip holding the same files. The text uses the app's
light markup: paragraphs separated by blank lines, **bold**, *italic*, and Bible references
written out in full ("Isaiah 40:12-14") so the reader links them.

Sources (all public domain except Tyndale, CC BY-SA 4.0):
  HelloAO Free Use Bible API     matthew-henry, tyndale, john-calvin, barnes, geneva
  pillar-commentary-data (MIT)   fbmeyer
  CrossWire SWORD modules        TDavid (Treasury of David), SME (Morning and Evening)
  SermonIndex SWORD modules      sipoole, sipulpit, siellicott, simaclaren
"""
import argparse, collections, concurrent.futures, html, json, os, re, sys, urllib.request, zipfile
sys.path.insert(0, os.path.dirname(__file__))
from sword import IDS, Module, kjv_v11n

USFM = ('GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK '
        'DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH '
        '2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV').split()
NAMES = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
         '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
         'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel',
         'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
         'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
         'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon',
         'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation']
OSIS = ('Gen Exod Lev Num Deut Josh Judg Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer '
        'Lam Ezek Dan Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal Matt Mark Luke John Acts Rom 1Cor 2Cor Gal '
        'Eph Phil Col 1Thess 2Thess 1Tim 2Tim Titus Phlm Heb Jas 1Pet 2Pet 1John 2John 3John Jude Rev').split()
OSIS_NAME = dict(zip(OSIS, NAMES))
PD = 'Public domain'

SOURCES = [
    dict(id='matthew-henry', name='Matthew Henry', short='Henry', kind='helloao', src='matthew-henry',
         about='Commentary on the Whole Bible (1706–21). Warm, devotional and practical.', license=PD),
    dict(id='tyndale', name='Tyndale Open Study Notes', short='Tyndale', kind='helloao', src='tyndale',
         about='Modern study-Bible notes.', license='CC BY-SA 4.0',
         credit='Tyndale Open Study Notes © 2022 Tyndale House Publishers, licensed CC BY-SA 4.0 '
                '(creativecommons.org/licenses/by-sa/4.0). Free at tyndaleopenresources.com.'),
    dict(id='calvin', name='John Calvin', short='Calvin', kind='helloao', src='john-calvin',
         about="Calvin's Commentaries (1540s–1560s), on the books he wrote about.", license=PD),
    dict(id='barnes', name="Barnes' Notes", short='Barnes', kind='helloao', src='barnes',
         about="Albert Barnes, Notes on the New Testament (1832–51). Plain and clear.", license=PD),
    dict(id='geneva', name='Geneva Bible Notes (1599)', short='Geneva', kind='helloao', src='geneva',
         about='The marginal notes of the 1599 Geneva Bible.', license=PD),
    dict(id='meyer', name='F. B. Meyer', short='Meyer', kind='pillar', src='fbmeyer',
         about='Through the Bible Day by Day (1914–18). Short devotional readings.', license=PD),
    dict(id='treasury-of-david', name="Spurgeon's Treasury of David", short='Spurgeon', kind='tdavid', src='TDavid.zip',
         about="C. H. Spurgeon's exposition of the Psalms (1869–85).", license=PD),
    dict(id='poole', name='Matthew Poole', short='Poole', kind='sword', src='sipoole.zip',
         about="Annotations upon the Holy Bible (1683–85).", license=PD),
    dict(id='pulpit', name='Pulpit Commentary', short='Pulpit', kind='sword', src='sipulpit.zip',
         about='The Pulpit Commentary (1880–1919), exposition.', license=PD),
    dict(id='ellicott', name="Ellicott's Commentary", short='Ellicott', kind='sword', src='siellicott.zip',
         about='Commentary for English Readers (1878–84).', license=PD),
    dict(id='maclaren', name="MacLaren's Expositions", short='MacLaren', kind='sword', src='simaclaren.zip',
         about='Alexander MacLaren, Expositions of Holy Scripture (1904–10): sermons on passages.', license=PD),
]
REPORT = []


# ---------------------------------------------------------------- text
def ref_label(osis_ref):
    """'Bible:Isa.40.12-Isa.40.14' -> 'Isaiah 40:12-14' (None if not a Bible reference)."""
    r = osis_ref.split(':', 1)[-1] if osis_ref.startswith('Bible') else osis_ref
    m = re.match(r'^([1-3]?[A-Za-z]+)\.(\d+)(?:\.(\d+))?(?:-([1-3]?[A-Za-z]+)\.(\d+)(?:\.(\d+))?)?$', r.strip())
    if not m or m.group(1) not in OSIS_NAME: return None
    b, c, v, b2, c2, v2 = m.groups()
    s = f'{OSIS_NAME[b]} {c}' + (f':{v}' if v else '')
    if b2 == b and v and v2:
        s += f'-{v2}' if c2 == c else f'-{c2}:{v2}'
    return s


def osis_to_text(s):
    s = re.sub(r'<title[^>]*>(.*?)</title>', lambda m: f'\n\n**{strip_tags(m.group(1)).strip()}**\n\n' if strip_tags(m.group(1)).strip() else '\n\n', s, flags=re.S)
    def ref(m):
        lab = ref_label(m.group(1)); inner = strip_tags(m.group(2)).strip()
        return lab if lab and (not inner or re.match(r'^[1-3]?\s?[A-Za-z]+\.?\s*\d', inner)) else inner
    s = re.sub(r'<reference[^>]*osisRef="([^"]+)"[^>]*>(.*?)</reference>', ref, s, flags=re.S)
    s = re.sub(r'<scripRef[^>]*passage="([^"]+)"[^>]*>(.*?)</scripRef>', lambda m: strip_tags(m.group(2)), s, flags=re.S)
    def emph(mark):
        return lambda m: '\n'.join(f'{mark}{x.strip()}{mark}' if x.strip() else '' for x in strip_tags(m.group(2)).split('\n'))
    s = re.sub(r'<hi type="(italic|emphasis)">(.*?)</hi>', emph('*'), s, flags=re.S)
    s = re.sub(r'<(i|em)>(.*?)</\1>', emph('*'), s, flags=re.S)
    s = re.sub(r'<hi type="(bold)">(.*?)</hi>', emph('**'), s, flags=re.S)
    s = re.sub(r'<(b|strong)>(.*?)</\1>', emph('**'), s, flags=re.S)
    s = re.sub(r'<div[^>]*type="x-p"[^>]*/>|</?p\b[^>]*>|<div[^>]*type="(paragraph|section|entry)"[^>]*>|</div>', '\n\n', s)
    s = re.sub(r'<lb[^>]*/>|<br\s*/?>', '\n', s)
    s = strip_tags(s)
    return tidy(s)


SMALL = {'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into', 'nor', 'of', 'on', 'or', 'the', 'to', 'with'}
def titlecase(t):
    if not t.isupper(): return t
    w = t.lower().split(' ')
    return ' '.join(x if i and x in SMALL else x[:1].upper() + x[1:] for i, x in enumerate(w))


def strip_tags(s):
    return re.sub(r'<[^>]+>', '', s)


def tidy(s):
    s = html.unescape(s).replace('\r', '').replace(' ', ' ')
    s = re.sub(r'(\w)’ (s|t|ll|re|ve|d)\b', r'\1’\2', s)          # SermonIndex: "God’ s" -> "God’s"
    s = re.sub(r'‘ (?=\w)', '‘', s)
    s = re.sub(r'[ \t]+', ' ', s)
    s = re.sub(r' *\n *', '\n', s)
    s = re.sub(r'\*\*\s*\*\*|(?<!\*)\*[ \t]+\*(?!\*)', '', s)   # empty bold / italic
    s = re.sub(r'\n{3,}', '\n\n', s)
    return s.strip()


def flatten_helloao(items):
    out = []
    for x in items or []:
        if isinstance(x, str): out.append(x)
        elif isinstance(x, dict):
            if x.get('lineBreak'): out.append('\n')
            elif 'text' in x: out.append(x['text'])
            elif 'heading' in x: out.append(f"\n\n**{x['heading']}**\n\n")
            elif 'content' in x: out.append(flatten_helloao(x['content']))
    t = ' '.join(out)
    t = re.sub(r'\n(?!\n)', '\n\n', t) if '\n\n' not in t else t
    return tidy(strip_tags(t))


# ---------------------------------------------------------------- loaders
def add(per, b, c, v, w, text):
    """Store a comment; identical text on the next verse of the same chapter extends the range."""
    if not text: return
    d = per[b]
    last = d.get('_last')
    if last and last[0] == c and last[2] + 1 == v and last[3] == text:
        old = f'{c}:{last[1]}' + (f'-{last[2]}' if last[2] > last[1] else '')
        d.pop(old, None); last[2] = w
        d[f'{c}:{last[1]}-{w}'] = text
        return
    key = f'{c}:{v}' + (f'-{w}' if w > v else '')
    if key in d: d[key] += '\n\n' + text
    else: d[key] = text
    d['_last'] = [c, v, w, text]


def finish(per):
    for d in per.values(): d.pop('_last', None)
    return {b: d for b, d in per.items() if d}


def helloao(src, workers=12):
    def get(job):
        b, code, c = job
        url = f'https://bible.helloao.org/api/c/{src}/{code}/{c}.json'
        for _ in range(3):
            try:
                with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'NotationBibleImporter/1.0'}), timeout=60) as r:
                    return b, c, json.load(r)
            except urllib.error.HTTPError as e:
                if e.code == 404: return b, c, None
            except Exception:
                pass
        return b, c, None
    books = json.load(urllib.request.urlopen(urllib.request.Request(f'https://bible.helloao.org/api/c/{src}/books.json', headers={'User-Agent': 'NotationBibleImporter/1.0'}), timeout=60))
    have = {x['id']: x.get('numberOfChapters') for x in books.get('books', [])}
    jobs = [(IDS[i], code, c) for i, code in enumerate(USFM) if code in have for c in range(1, (have[code] or 0) + 1)]
    per = collections.defaultdict(dict); miss = 0
    with concurrent.futures.ThreadPoolExecutor(workers) as ex:
        results = sorted(ex.map(get, jobs), key=lambda r: (IDS.index(r[0]), r[1]))
    for b, c, d in results:
        if not d: miss += 1; continue
        ch = d.get('chapter') or {}
        intro = flatten_helloao([ch.get('introduction')] if isinstance(ch.get('introduction'), str) else ch.get('introduction'))
        first = True
        for item in ch.get('content', []):
            if item.get('type') != 'verse': continue
            t = flatten_helloao(item.get('content'))
            n = int(item.get('number'))
            if first and intro: t = intro + '\n\n' + t; first = False
            first = False
            add(per, b, c, n, n, t)
    REPORT.append(f'- {src}: {len(jobs)} chapters requested, {miss} unavailable')
    return finish(per)


def pillar(raw, src):
    base = os.path.join(raw, 'pillar', 'c', src); per = collections.defaultdict(dict)
    for i, code in enumerate(USFM):
        d = os.path.join(base, code)
        if not os.path.isdir(d): continue
        for fn in sorted(os.listdir(d), key=lambda f: int(f[:-5]) if f[:-5].isdigit() else 0):
            if not (fn.endswith('.json') and fn[:-5].isdigit()): continue
            ch = json.load(open(os.path.join(d, fn), encoding='utf-8')).get('chapter') or {}
            for item in ch.get('content', []):
                if item.get('type') == 'verse':
                    t = flatten_helloao(item.get('content'))
                    t = re.sub(r'^(.+?) -- (.+?)(\n|$)', r'**\1** · \2\3', t)  # Meyer: "Title -- reading"
                    add(per, IDS[i], int(fn[:-5]), int(item['number']), int(item['number']), t)
    return finish(per)


def sword(raw, src, v11n):
    m = Module(os.path.join(raw, src)); per = collections.defaultdict(dict); pending = {}
    for b, c, v, w, t in m.entries(v11n, intros=True):
        text = osis_to_text(t)
        if c == 0: continue                         # book introductions: not shown yet
        if v == 0:                                  # chapter introduction: put it before the first comment
            if text and not re.fullmatch(r'\W*', text): pending[(b, c)] = text
            continue
        if (b, c) in pending: text = pending.pop((b, c)) + '\n\n' + text
        if src == 'simaclaren':   # each sermon opens "Book\nTITLE\nPassage."
            text = re.sub(r'^[1-3]?\s?[A-Z][a-z]+(?: of [A-Z][a-z]+)?\n([^\n]{3,120})\n([^\n]{3,80}?)\.?\n', lambda m: f'**{titlecase(m.group(1).strip())}** · {m.group(2).strip()}\n\n', text)
        add(per, b, c, v, w, text)
    return finish(per)


def tdavid(raw, src, v11n):
    """Treasury of David: keep Spurgeon's overview and exposition (not the collected quotations
    and sermon hints) and split the exposition at his 'Verse 1.' markers."""
    m = Module(os.path.join(raw, src)); psalm = collections.defaultdict(list)
    for b, c, v, w, t in m.entries(v11n, intros=True):
        if c: psalm[c].append(osis_to_text(t))
    per = collections.defaultdict(dict)
    for c in sorted(psalm):
        text = '\n\n'.join(x for x in psalm[c] if x)
        # drop the sections after the exposition
        cut = re.search(r'\n\*\*\s*(EXPLANATORY NOTES|HINTS TO|QUAINT)', text, re.I)
        body = text[:cut.start()] if cut else text
        body = re.sub(r'^\*\*Psalm \d+ OVERVIEW\*\*\s*', '', body.strip(), flags=re.I)
        body = re.sub(r'\*\*EXPOSITION\s*(?=Verses? \d)', '**', body)          # "**EXPOSITIONVerse 1.**"
        body = re.sub(r'\*\*EXPOSITION\*\*\s*', '', body)
        mark = re.compile(r'\*\*Verses? (\d+)(?:\s*(?:,|-|–|to)\s*(\d+))?\.?\*\*')
        ms = list(mark.finditer(body))
        parts = [body[:ms[0].start()] if ms else body]
        for i, m in enumerate(ms):
            parts += [m.group(1), m.group(2), body[m.start():ms[i + 1].start() if i + 1 < len(ms) else len(body)]]
        pre = parts[0].strip()
        chunks = [(int(parts[i]), int(parts[i + 1] or parts[i]), parts[i + 2].strip()) for i in range(1, len(parts) - 2, 3)]
        if not chunks:
            add(per, 'psalms', c, 1, v11n['psalms'][c - 1], pre); continue
        first = True
        for v, w, chunk in chunks:
            if first and pre: chunk = pre + '\n\n' + chunk
            first = False
            add(per, 'psalms', c, v, min(w, v11n['psalms'][c - 1]), chunk)
    return finish(per)


def devotional(raw):
    m = Module(os.path.join(raw, 'SME.zip')); out = {}
    for key, t in m.lexicon():
        day = {}
        for part, slot in (('am', 'm'), ('pm', 'e')):
            sec = re.search(rf'<div type="section" osisID="{re.escape(key)}\.{part}">(.*?)(?=<div type="section"|$)', t, re.S)
            if not sec: continue
            raw_s = sec.group(1)
            title = strip_tags((re.search(r'<title>(.*?)</title>', raw_s) or [None, ''])[1]).strip()
            refm = re.search(r'<reference osisRef="([^"]+)"', raw_s)
            body = osis_to_text(re.sub(r'<title>.*?</title>', '', raw_s, count=1))
            day[slot] = {'title': title, 'ref': ref_label(refm.group(1)) if refm else '', 'text': body}
        out[key.replace('.', '-')] = day
    REPORT.append(f'- Morning and Evening: {len(out)} days, {sum(len(d) for d in out.values())} readings')
    return out


# ---------------------------------------------------------------- output
def write_pack(out, s, per):
    d = os.path.join(out, s['id']); os.makedirs(d, exist_ok=True)
    size = 0
    for b, data in per.items():
        p = os.path.join(d, f'{b}.json')
        json.dump(data, open(p, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        size += os.path.getsize(p)
    meta = {k: s[k] for k in ('id', 'name', 'short', 'about', 'license') if k in s}
    if s.get('credit'): meta['credit'] = s['credit']
    import datetime
    meta.update(books=[b for b in IDS if b in per], bytes=size, entries=sum(len(v) for v in per.values()),
                built=datetime.date.today().isoformat())
    json.dump(meta, open(os.path.join(d, 'meta.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    with zipfile.ZipFile(os.path.join(out, f"{s['id']}.zip"), 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for fn in sorted(os.listdir(d)): z.write(os.path.join(d, fn), f"{s['id']}/{fn}")
    meta['zip_bytes'] = os.path.getsize(os.path.join(out, f"{s['id']}.zip"))
    REPORT.append(f"- **{s['id']}**: {meta['entries']:,} comments in {len(meta['books'])} books, "
                  f"{size / 1e6:.1f} MB JSON, {meta['zip_bytes'] / 1e6:.1f} MB zipped")
    return meta, per


def sample(per, b, c, v):
    d = per.get(b) or {}
    for k, t in d.items():
        kc, kv = k.split(':'); a, _, z = kv.partition('-')
        if int(kc) == c and int(a) <= v <= int(z or a): return k, t
    return None, None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--raw', default='raw'); ap.add_argument('--out', default='packs')
    ap.add_argument('--only', default=''); ap.add_argument('--report', default='')
    ap.add_argument('--kjv', default=os.path.join(os.path.dirname(__file__), '..', 'data', 'tr', 'kjv.json'))
    ap.add_argument('--devotional', default=os.path.join(os.path.dirname(__file__), '..', 'data', 'devotional', 'spurgeon-morning-evening.json'))
    a = ap.parse_args()
    v11n = kjv_v11n(a.kjv); only = set(filter(None, a.only.split(',')))
    os.makedirs(a.out, exist_ok=True)
    metas, samples = [], []
    for s in SOURCES:
        if only and s['id'] not in only: continue
        try:
            per = {'helloao': lambda: helloao(s['src']), 'pillar': lambda: pillar(a.raw, s['src']),
                   'sword': lambda: sword(a.raw, s['src'], v11n), 'tdavid': lambda: tdavid(a.raw, s['src'], v11n)}[s['kind']]()
        except Exception as e:
            import traceback; REPORT.append(f"- **{s['id']}** FAILED: {e!r}\n```\n{traceback.format_exc()[-1500:]}\n```"); continue
        if not per: REPORT.append(f"- **{s['id']}**: nothing imported"); continue
        meta, per = write_pack(a.out, s, per); metas.append(meta)
        for b, c, v in (('john', 3, 16), ('psalms', 23, 1), ('genesis', 1, 1), ('romans', 8, 28)):
            k, t = sample(per, b, c, v)
            if t: samples.append(f"### {s['id']} · {b} {k}\n```\n{t[:900]}\n```"); break
    json.dump(metas, open(os.path.join(a.out, 'packs.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    if not only or 'devotional' in only:
        try:
            dv = devotional(a.raw)
            os.makedirs(os.path.dirname(a.devotional), exist_ok=True)
            json.dump(dv, open(a.devotional, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
            samples.append('### Morning and Evening · 01-01\n```\n' + json.dumps(dv.get('01-01'), ensure_ascii=False)[:1200] + '\n```')
        except Exception as e:
            REPORT.append(f'- devotional FAILED: {e!r}')
    rep = '# Commentary build report\n\n' + '\n'.join(REPORT) + '\n\n## Samples\n\n' + '\n\n'.join(samples) + '\n'
    print(rep)
    if a.report: open(a.report, 'w', encoding='utf-8').write(rep)


if __name__ == '__main__':
    main()
