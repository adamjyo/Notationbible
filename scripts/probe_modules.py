"""Print what a set of SWORD module zips hold: entries, text size, raw samples.
python3 scripts/probe_modules.py data/tr/kjv.json a.zip b.zip ..."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from sword import Module, kjv_v11n

v11n = kjv_v11n(sys.argv[1])
for z in sys.argv[2:]:
    print(f'\n### {os.path.basename(z)} ({os.path.getsize(z):,} bytes)')
    try:
        m = Module(z)
    except Exception as e:
        print('cannot open:', e); continue
    print('```')
    print({k: m.conf.get(k) for k in ('ModDrv', 'SourceType', 'Encoding', 'Versification', 'Description', 'DistributionLicense', 'Category')})
    try:
        if m.driver in ('zLD', 'RawLD', 'RawLD4'):
            items = list(m.lexicon())
            print('entries:', len(items), 'text bytes:', sum(len(t) for _, t in items))
            print('keys:', [k for k, _ in items[:8]], '...', [k for k, _ in items[-3:]])
            for k, t in items[:2]: print(repr(k), repr(t[:1500]))
        else:
            es = list(m.entries(v11n, intros=True))
            books = sorted({e[0] for e in es})
            print('entries:', len(es), 'books:', len(books), 'text bytes:', sum(len(e[4]) for e in es))
            ranges = sum(1 for e in es if e[3] > e[2]); intro = sum(1 for e in es if e[2] == 0)
            print('range entries:', ranges, 'intro entries:', intro)
            by = {}
            for e in es: by[e[0]] = by.get(e[0], 0) + len(e[4])
            print('largest books:', sorted(by.items(), key=lambda x: -x[1])[:5])
            show = [e for e in es if e[2] > 0][:2] + [e for e in es if e[0] == 'john' and e[1] == 3 and e[2] <= 16 <= e[3]][:1] \
                + [e for e in es if e[0] == 'psalms' and e[1] == 23][:2] + [e for e in es if e[2] == 0][:1]
            for e in show: print(e[:4], repr(e[4][:1200]))
    except Exception as e:
        import traceback; traceback.print_exc(file=sys.stdout)
    print('```')
