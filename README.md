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
| Search | Words (all must match), `"exact phrase"`, references (`jn 1:14`, `ps 23`) and Strong's numbers. |

Highlights, notes and settings are stored in the browser (`localStorage`). See *Roadmap* for sync.

### Browser support for voice

- **Read aloud** uses the Web Speech synthesis API, which works in all current browsers. Voices come from the operating system.
- **Dictation** uses the Web Speech recognition API: Chrome, Edge and Safari support it, Firefox doesn't. It needs microphone permission and a secure origin (https or localhost). It won't work inside the claude.ai preview frame, which blocks the microphone.

## Data

The repo ships **sample data only**: John 1:1–18, Genesis 1:1–5 and Psalm 23, with hand-entered Strong's tags. The footnotes, commentary and the study in the sample were written for this preview. Replace them with real sources using the importer:

| Layer | Source | Licence | Command |
|---|---|---|---|
| Text + Strong's + original words + footnotes | Berean translation tables (`bsb_tables`, from berean.bible / biblehub.com/downloads) | Public domain | `node scripts/import.mjs bsb bsb_tables.tsv` |
| Lexicon | STEPBible-Data TBESG (Greek) and TBESH (Hebrew), github.com/STEPBible/STEPBible-Data | CC BY 4.0, attribution required | `node scripts/import.mjs lexicon TBESG.txt TBESH.txt` |
| Cross-references | openbible.info/labs/cross-references | CC BY | `node scripts/import.mjs xrefs cross_references.txt` |
| Commentary | Any public-domain commentary (e.g. Matthew Henry Concise) converted to `ref,text` CSV | Public domain | `node scripts/import.mjs commentary mhc "Matthew Henry (Concise)" mhc.csv` |

The cross-reference and commentary importers are tested. The **BSB and lexicon importers** find columns by header name, so run `node scripts/import.mjs bsb --inspect <file>` first and check the column names in `scripts/import.mjs` against your download. Then spot-check a few chapters against bereanbible.com.

Studies are hand-authored JSON in `data/studies/`.

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
