# Notation Bible

A distraction-free Bible reader with study layers you can switch on and off: Strong's numbers, a Greek/Hebrew interlinear, footnotes, cross-references, commentary, Bible studies and your own notes. Highlighting and markup work the same way in Scripture and in every note, commentary and study text. It also reads aloud, and you can dictate notes and searches by voice.

The text is the **Berean Standard Bible (BSB)**. It has been in the public domain since April 30, 2023, and Berean places it between the ESV and the CSB, so it's the closest free match to the ESV. Its translation tables link every English word to its Hebrew or Greek source and Strong's number.

## Run it

No build step. Serve the folder with any static server:

```
python3 -m http.server 8000      # then open http://localhost:8000
# or: npx serve .
```

Opening `index.html` directly from disk won't work, because browsers block `fetch()` for `file://`.

For a one-file demo you can open anywhere (even from disk), run `node scripts/bundle.mjs`. It writes `dist/notation-bible.html` with the styles, scripts and data inlined.

The app opens in **dark mode** by default. Switch with **Dark mode** in the menu, or pick Dark, Light or Match system under **Layer modes & reading settings → Appearance**.

## What's in the box

| Feature | How it works |
|---|---|
| Menu | One **Menu** button in the header holds every feature: read aloud, search, go to, studies, highlights & notes, a switch per layer, presets (*Reading*, *Study*, *Original*), and settings. |
| Layers | Each layer's switch turns it on or off. **Layer modes & reading settings** picks a mode per layer (Off / Markers / Inline). |
| Strong's | *Tap words* opens the lexicon and concordance for any word; *Numbers* prints the number after each word. |
| Interlinear | English order (reverse interlinear) with the Greek or Hebrew word, transliteration and Strong's number under each English word. |
| Verse panel | Tap a verse for all its layers at once: word list, footnotes, cross-references with previews, commentary, studies, notes. |
| Concordance | Every verse using a Strong's number, plus how the BSB translates it. Search `G3056` or `H430` to jump there. |
| Toolbar | Along the bottom: **Highlighter** (hand-drawn marker strokes), **Pen** (hand-drawn underline), **Eraser** (removes only what you rub over), **Color** (nine colours for any tool: black, red and blue ink, plus yellow, green, blue, pink, orange and purple highlighter) and **Sticky note** (tap anywhere in the text to pin a note there). With a tool picked up, drag across words or tap a single word; tap the tool again or press Escape to put it down. After 4 seconds unused the toolbar tucks into a round notes button in the corner (ringed in the ink colour if a tool is still in hand); tap it to bring the toolbar back. |
| Markup | With no tool picked up, selecting text shows a bar with the six colours, Pen, Note and Erase. Works in verses, footnotes, commentary, studies, lexicon entries and notes, and across several verses. Overlapping colours blend like real highlighter ink. |
| Notes | Pick a text colour from the same nine colours. A note on a long passage (more than a few words, or several verses) is marked with large gold [ ] around the passage. Light formatting: `**bold**`, `*italic*`, `==highlight==`. References like `John 3:16` and numbers like `G3056` become links. |
| Read aloud | **Read aloud** in the menu reads from the current or tapped verse, highlights each verse, follows along and continues into the next chapter. Speed and voice are in settings. |
| Voice to text | **Dictate** in the note editor, **Dictate note** in the verse panel, and the mic in search. |
| NoteTree | On a computer or tablet: select verses (or tap a verse) and choose **NoteTree**. The passage is centred on an 8½ × 11 in page with 3 in of free canvas on each side. Draw anywhere with a pen or highlighter, drop text boxes and drag them by their top grip, erase, undo/redo (Ctrl+Z / Ctrl+Shift+Z), zoom and fit. Shortcuts: V select, P pen, H highlighter, T text, E eraser. Each passage keeps its own NoteTree; an **NT** mark appears on its first verse. Phones open NoteTrees to view only. **Apple Pencil:** pen lines follow pressure; the first Pencil stroke turns on **Pencil only**, so the Pencil draws while one finger scrolls, two fingers pinch to zoom, and a resting palm is ignored (toggle it in the NoteTree toolbar). Pencil hover (on iPads that support it) previews the nib, and iPadOS Scribble handwriting works in text boxes. |
| Compare | A layer that shows the KJV, ASV or YLT under each BSB verse (choose in settings). The verse panel always shows every translation. |
| Commentaries | Jamieson-Fausset-Brown (verse by verse, whole Bible) and Scofield Reference Notes. Pick which ones under settings → Commentaries. |
| Topics, places, dictionary | The verse panel lists Nave's and Torrey's topics for the verse, Bible places with coordinates and map links, and Easton's Bible Dictionary entries for names and key words. Search also finds topics and dictionary entries. |
| Reading plans | Menu → Reading plans: whole Bible in a year, OT and NT together, New Testament in 90 days, Gospels in 30 days, Psalms and Proverbs in a month. Days are balanced by verse count, with today's reading, catch-up and progress. |
| Search | Words (all must match), `"exact phrase"`, references (`jn 1:14`, `ps 23`) and Strong's numbers. |

Highlights, notes and settings are stored in the browser (`localStorage`). See *Roadmap* for sync.

### Browser support for voice

- **Read aloud** uses the Web Speech synthesis API, which works in all current browsers. Voices come from the operating system.
- **Dictation** uses the Web Speech recognition API: Chrome, Edge and Safari support it, Firefox doesn't. It needs microphone permission and a secure origin (https or localhost). It won't work inside the claude.ai preview frame, which blocks the microphone.

## Data

The repo ships the **complete Berean Standard Bible**: all 66 books and 31,102 verses. It includes:

- **Strong's numbers:** 381,884 tagged words, 99.98% of the translation tables' phrases aligned.
- **Interlinear:** the Hebrew or Greek word, transliteration and parsing for every tagged word.
- **BSB extras:** section headings with parallel passages, paragraph breaks, and footnotes.
- **Lexicons:** 9,362 Greek and 8,181 Hebrew entries.
- **Cross-references:** up to 12 per verse, the most-voted ones.

| Layer | Source | Licence |
|---|---|---|
| Text, Strong's, interlinear, headings, paragraphs, footnotes | BereanBible.com: `bsb.txt` and `bsb_tables.tsv` | Public domain |
| Greek and Hebrew lexicons | STEPBible.org TBESG and TBESH (Tyndale House, Cambridge) | CC BY 4.0, attribution required |
| Cross-references | OpenBible.info | CC BY |

**Rebuilding:** the data is built on GitHub's servers by `.github/workflows/import-bible.yml`, which downloads the sources, runs `scripts/build_bsb.py` and `scripts/import.mjs xrefs`, and commits `data/`. It runs whenever the converter changes, or by hand from **Actions → Import full Bible → Run workflow**. `data/IMPORT_REPORT.md` records the counts and any phrases that couldn't be aligned.

**Study resources:** see `docs/RESOURCES_STATUS.md` for what is imported (KJV, ASV, YLT, JFB, Scofield, Easton's, Nave's, Torrey's, places), the sources and licences, and what's next. Resource importing is paused. **Preview commentary:** the original short sample on Genesis 1, Psalm 23 and John 1. Add a public-domain commentary as a `ref,text` CSV with `node scripts/import.mjs commentary <id> "<Name>" file.csv`.

**Studies:** hand-authored JSON in `data/studies/`.

Each verse in `data/bsb/<book>.json` is stored as its exact text with tagged phrases written `⟨english¦7225+430⟩`, prefixed H for the Old Testament and G for the New. The app turns these into tokens when a book loads. Interlinear details sit in `data/il/<book>.json` and load only when needed.

## Files

```
index.html  styles.css  app.js  books.js      the app (plain JS, no framework)
data/manifest.json                             which books and layers exist
data/bsb/<book>.json                           text as tokens: "plain" or [english, "G3056", original]
data/lexicon/{greek,hebrew}.json               "G3056": [lemma, translit, gloss, definition]
data/footnotes/<book>.json                     "1:5": [[phrase, note]]
data/xrefs/<book>.json                         "1:1": ["genesis.1.1", ...]
data/commentary/<id>/<book>.json               "1:1-5": "text"
data/studies/index.json, <id>.json             studies with sections anchored to verses
scripts/import.mjs                             importers
docs/ARCHITECTURE.md                           data model, layers and the markup engine
```

## Roadmap

- Run the full imports and ship the complete BSB
- Accounts and sync for highlights and notes (the annotation format is already portable JSON)
- Writing and sharing your own studies
- Parallel translations (KJV, WEB, ASV are public domain)
- Morphology (parsing) in the interlinear, from the BSB tables or STEPBible TAGNT/TAHOT
- Offline support (service worker) and an installable PWA, then native apps

## Attribution

The Holy Bible, Berean Standard Bible, BSB, is produced in cooperation with Bible Hub, Discovery Bible, OpenBible.com, and the Berean Bible Translation Committee. It has been dedicated to the public domain.
Lexicon data, once imported: STEPBible.org, based on work at Tyndale House Cambridge, CC BY 4.0.
Cross-references, once imported: OpenBible.info, CC BY.

## WordPress plugin

`wordpress/` is the plugin source. `scripts/build_wp.sh` packs it with the app and the whole Bible into `build/notation-bible.zip` (about 18 MB). Download the latest zip from [Releases](https://github.com/adamjyo/Notationbible/releases/latest) and install it with Plugins → Add New → Upload.

- **Home page:** with Notation Bible → Settings → Home page on, the Bible is the site's home page and `/bible/` links forward there. It switches on by itself on sites whose home page is still WordPress's empty default.
- The reader is at `/bible/` (changeable in Notation Bible → Settings); `[notation_bible ref="John 3:16" height="80vh"]` embeds it in a page.
- **Reader accounts:** readers sign in from the Bible's menu with a username and password to a Notation Bible account, which is separate from WordPress users. No email is used. Their highlights, notes, NoteTrees, reading plan and settings sync across devices; edits made on two devices are merged. In Notation Bible → Readers you add readers and make password links (to set up an account or reset a password) that you copy and send yourself; you can also disable, delete or sign out a reader everywhere. Switch accounts and open sign-ups on or off in Notation Bible → Settings. Without an account, notes stay in the reader's browser, as in the stand-alone web app.
- **Updates:** the plugin updates itself from this repository's GitHub releases. WordPress shows new versions like any other plugin update, and automatic updates are switched on at first activation.

### Shipping an update

1. Raise the version in `wordpress/notation-bible.php` (the `Version:` header and `NB_VERSION`) and `Stable tag:` in `wordpress/readme.txt`, and add a changelog entry there.
2. Push. The **Release WordPress plugin** workflow builds the zip and publishes release `v<version>` with it; its notes come from the changelog entry.
3. Sites pick it up within about 12 hours (WordPress checks twice a day), or straight away with **Check for updates now** in Notation Bible → Settings.

Changes to the app or Bible data reach WordPress sites only when the plugin version is raised.
