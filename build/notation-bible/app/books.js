// Canonical 66-book list: [id, display name, chapter count]. Shared by the app and scripts/build-data.mjs.
(typeof window !== 'undefined' ? window : globalThis).BOOKS = [
  ['genesis','Genesis',50],['exodus','Exodus',40],['leviticus','Leviticus',27],['numbers','Numbers',36],
  ['deuteronomy','Deuteronomy',34],['joshua','Joshua',24],['judges','Judges',21],['ruth','Ruth',4],
  ['1-samuel','1 Samuel',31],['2-samuel','2 Samuel',24],['1-kings','1 Kings',22],['2-kings','2 Kings',25],
  ['1-chronicles','1 Chronicles',29],['2-chronicles','2 Chronicles',36],['ezra','Ezra',10],['nehemiah','Nehemiah',13],
  ['esther','Esther',10],['job','Job',42],['psalms','Psalms',150],['proverbs','Proverbs',31],
  ['ecclesiastes','Ecclesiastes',12],['song-of-solomon','Song of Solomon',8],['isaiah','Isaiah',66],['jeremiah','Jeremiah',52],
  ['lamentations','Lamentations',5],['ezekiel','Ezekiel',48],['daniel','Daniel',12],['hosea','Hosea',14],
  ['joel','Joel',3],['amos','Amos',9],['obadiah','Obadiah',1],['jonah','Jonah',4],['micah','Micah',7],
  ['nahum','Nahum',3],['habakkuk','Habakkuk',3],['zephaniah','Zephaniah',3],['haggai','Haggai',2],
  ['zechariah','Zechariah',14],['malachi','Malachi',4],
  ['matthew','Matthew',28],['mark','Mark',16],['luke','Luke',24],['john','John',21],['acts','Acts',28],
  ['romans','Romans',16],['1-corinthians','1 Corinthians',16],['2-corinthians','2 Corinthians',13],['galatians','Galatians',6],
  ['ephesians','Ephesians',6],['philippians','Philippians',4],['colossians','Colossians',4],['1-thessalonians','1 Thessalonians',5],
  ['2-thessalonians','2 Thessalonians',3],['1-timothy','1 Timothy',6],['2-timothy','2 Timothy',4],['titus','Titus',3],
  ['philemon','Philemon',1],['hebrews','Hebrews',13],['james','James',5],['1-peter','1 Peter',5],['2-peter','2 Peter',3],
  ['1-john','1 John',5],['2-john','2 John',1],['3-john','3 John',1],['jude','Jude',1],['revelation','Revelation',22]
].map(([id, name, ch], i) => ({ id, name, ch, i, t: i < 39 ? 'ot' : 'nt' }));

// Short forms people type ("jn 3:16", "ps 23"). Anything else is matched by name prefix.
(typeof window !== 'undefined' ? window : globalThis).ALIASES = {
  gn:'genesis', ex:'exodus', lv:'leviticus', nm:'numbers', dt:'deuteronomy', jdg:'judges', jg:'judges',
  ps:'psalms', psa:'psalms', psalm:'psalms', pr:'proverbs', prov:'proverbs', ec:'ecclesiastes', qoh:'ecclesiastes',
  song:'song-of-solomon', sos:'song-of-solomon', ss:'song-of-solomon', canticles:'song-of-solomon',
  is:'isaiah', jr:'jeremiah', ez:'ezekiel', ezk:'ezekiel', dn:'daniel', jl:'joel', ob:'obadiah', jon:'jonah',
  mi:'micah', na:'nahum', hb:'habakkuk', zp:'zephaniah', hg:'haggai', zc:'zechariah', ml:'malachi',
  mt:'matthew', mk:'mark', mr:'mark', lk:'luke', jn:'john', jhn:'john', ac:'acts', rm:'romans', ro:'romans',
  php:'philippians', phil:'philippians', phm:'philemon', phlm:'philemon', jas:'james', jm:'james',
  jud:'jude', jude:'jude', rv:'revelation', rev:'revelation', revelations:'revelation'
};
