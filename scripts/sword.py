"""Minimal reader for CrossWire SWORD modules: commentaries (zCom, zCom4, RawCom, RawCom4)
and dictionaries / daily devotionals (zLD, RawLD, RawLD4). Standard library only.

Commentary index layout per testament file (ot.* / nt.*), KJV versification:
    slot 0 module header, slot 1 testament heading,
    per book: 1 slot (book introduction), then per chapter: 1 slot (chapter introduction)
    followed by one slot per verse.
    RawCom  <t>.vss = (u32 offset, u16 size)     RawCom4 <t>.vss = (u32 offset, u32 size)
    zCom    <t>.czv = (u32 block, u32 offset, u16 size), <t>.czs = (u32 off, u32 csize, u32 usize)
    zCom4   <t>.czv = (u32 block, u32 offset, u32 size); blocks zlib-compressed in <t>.czz
Several verse slots pointing at the same stored text are one comment on a verse range.

Lexicon/devotional layout:
    RawLD  name.idx = (u32 offset, u16 size) into name.dat, entry = key "\\n" text
    RawLD4 name.idx = (u32 offset, u32 size)
    zLD    name.idx = (u32 offset, u32 size) into name.dat, entry = key "\\n" (u32 block, u32 index)
           name.zdx = (u32 offset, u32 size) per block into name.zdt (zlib);
           a block = u32 count, count x (u32 offset, u32 size), then the entries' bytes.
Format notes cross-checked against nicdavidson/bible-mvp scripts/sword_reader.py (MIT).
"""
import configparser, struct, zipfile, zlib

# book ids as used by the app, in KJV order (OT 39, NT 27)
IDS = ['genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy', 'joshua', 'judges', 'ruth', '1-samuel', '2-samuel',
       '1-kings', '2-kings', '1-chronicles', '2-chronicles', 'ezra', 'nehemiah', 'esther', 'job', 'psalms', 'proverbs',
       'ecclesiastes', 'song-of-solomon', 'isaiah', 'jeremiah', 'lamentations', 'ezekiel', 'daniel', 'hosea', 'joel',
       'amos', 'obadiah', 'jonah', 'micah', 'nahum', 'habakkuk', 'zephaniah', 'haggai', 'zechariah', 'malachi',
       'matthew', 'mark', 'luke', 'john', 'acts', 'romans', '1-corinthians', '2-corinthians', 'galatians', 'ephesians',
       'philippians', 'colossians', '1-thessalonians', '2-thessalonians', '1-timothy', '2-timothy', 'titus', 'philemon',
       'hebrews', 'james', '1-peter', '2-peter', '1-john', '2-john', '3-john', 'jude', 'revelation']


def kjv_v11n(kjv_json):
    """{book: [verses in chapter 1, ...]} from the app's data/tr/kjv.json (31,102 verses)."""
    import json
    d = json.load(open(kjv_json, encoding='utf-8'))
    v = {b: [len(d[b]['chapters'][str(c)]) for c in range(1, len(d[b]['chapters']) + 1)] for b in IDS}
    assert sum(map(sum, v.values())) == 31102, 'KJV versification incomplete'
    return v


class Module:
    def __init__(self, zip_path):
        self.zf = zipfile.ZipFile(zip_path)
        conf = next(n for n in self.zf.namelist() if n.startswith('mods.d/') and n.endswith('.conf'))
        raw = self.zf.read(conf).decode('utf-8', 'replace').replace('\\\n', ' ')
        cp = configparser.ConfigParser(strict=False, interpolation=None, comment_prefixes=('#',))
        cp.optionxform = str
        cp.read_string(raw)
        self.name = cp.sections()[0]
        self.conf = dict(cp[self.name])
        self.driver = self.conf['ModDrv']
        self.encoding = 'utf-8' if self.conf.get('Encoding', '').upper() == 'UTF-8' else 'latin-1'
        self.path = self.conf['DataPath'].lstrip('./')
        if self.driver in ('zLD', 'RawLD', 'RawLD4'):
            self.base = self.path  # DataPath ends with the file stem
        else:
            self.base = self.path.rstrip('/') + '/'

    def _read(self, name):
        try:
            return self.zf.read(self.base + name)
        except KeyError:
            return None

    def _dec(self, b):
        return b.decode(self.encoding, 'replace')

    # ---------- commentaries ----------
    def _slots(self, t):
        d = self.driver
        if d in ('RawCom', 'RawCom4'):
            idx, data = self._read(f'{t}.vss'), self._read(t)
            if idx is None or data is None: return []
            fmt, sz = ('<IH', 6) if d == 'RawCom' else ('<II', 8)
            out = []
            for i in range(len(idx) // sz):
                off, ln = struct.unpack_from(fmt, idx, i * sz)
                out.append(((off, ln), data[off:off + ln]))
            return out
        if d in ('zCom', 'zCom4'):
            v = self._read(f'{t}.czv') or self._read(f'{t}.bzv')
            s = self._read(f'{t}.czs') or self._read(f'{t}.bzs')
            z = self._read(f'{t}.czz') or self._read(f'{t}.bzz')
            if v is None or s is None or z is None: return []
            fmt, sz = ('<IIH', 10) if d == 'zCom' else ('<III', 12)
            cache = {}
            def block(n):
                if n not in cache:
                    off, cs, _ = struct.unpack_from('<III', s, n * 12)
                    cache[n] = zlib.decompress(z[off:off + cs])
                return cache[n]
            out = []
            for i in range(len(v) // sz):
                bn, off, ln = struct.unpack_from(fmt, v, i * sz)
                out.append(((bn, off, ln), block(bn)[off:off + ln] if ln else b''))
            return out
        raise NotImplementedError(f'{self.name}: {d}')

    def entries(self, v11n, intros=False):
        """Yield (book, chapter, verse_start, verse_end, text). chapter 0 / verse 0 = introductions."""
        for t, books in (('ot', IDS[:39]), ('nt', IDS[39:])):
            slots = self._slots(t)
            if not slots: continue
            i = 2
            for b in books:
                if i >= len(slots): break
                _, text = slots[i]; i += 1
                if intros and text.strip(): yield b, 0, 0, 0, self._dec(text)
                for c, n in enumerate(v11n[b], 1):
                    _, text = slots[i]; i += 1
                    if intros and text.strip(): yield b, c, 0, 0, self._dec(text)
                    cur, prev = None, None
                    for vv in range(1, n + 1):
                        key, text = slots[i]; i += 1
                        if not key[-1] or not text.strip():
                            if cur: yield cur
                            cur, prev = None, None; continue
                        if key == prev and cur:
                            cur = (*cur[:3], vv, cur[4]); continue
                        if cur: yield cur
                        cur, prev = (b, c, vv, vv, self._dec(text)), key
                    if cur: yield cur

    # ---------- dictionaries / devotionals ----------
    def lexicon(self):
        """Yield (key, text) for every entry of a zLD / RawLD module."""
        idx, dat = self._read('.idx'), self._read('.dat')
        if idx is None or dat is None: return
        if self.driver == 'zLD':
            zdx, zdt = self._read('.zdx'), self._read('.zdt')
            cache = {}
            def block(n):
                if n not in cache:
                    off, size = struct.unpack_from('<II', zdx, n * 8)
                    cache[n] = zlib.decompress(zdt[off:off + size])
                return cache[n]
            for i in range(len(idx) // 8):
                off, size = struct.unpack_from('<II', idx, i * 8)
                rec = dat[off:off + size]
                nl = rec.find(b'\n')
                key = self._dec(rec[:nl]).strip()
                bn, en = struct.unpack_from('<II', rec, nl + 1)
                blk = block(bn)
                eoff, esize = struct.unpack_from('<II', blk, 4 + en * 8)
                yield key, self._dec(blk[eoff:eoff + esize].rstrip(b'\x00'))
        else:
            fmt, sz = ('<IH', 6) if self.driver == 'RawLD' else ('<II', 8)
            for i in range(len(idx) // sz):
                off, size = struct.unpack_from(fmt, idx, i * sz)
                rec = dat[off:off + size]
                nl = rec.find(b'\n')
                yield self._dec(rec[:nl]).strip(), self._dec(rec[nl + 1:])
