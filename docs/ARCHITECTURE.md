# Architecture

## Principle: one text, many layers

The Bible text is stored once, as tokens. Every study aid is a separate **layer** file, keyed by verse, that the reader can show three ways:

- **Off**: not rendered.
- **Markers**: a small mark in the text. Tapping it opens the verse panel.
- **Inline**: expanded under the verse. In paragraph layout the text keeps flowing and breaks only where an inline block sits.

Strong's has its own modes: *Tap words* (dotted words open the lexicon) and *Numbers* (superscript numbers). The interlinear is on or off. Presets just set all modes at once.

Adding a layer means a data folder, a manifest entry and a branch in `render()` / `versePanel()` in `app.js`.

## Token format

```json
["In ", ["the beginning", "G746", "ἀρχῇ"], " ..."]
```

A string is untagged text. An array is `[english, strongs, original?]`. `strongs` may hold several numbers separated by spaces (`"G3761 G1520"`) when one English phrase renders several source words. Plain verse text is just the tokens joined.

## Anchors

Anything that can be marked up carries a `data-anchor` id:

| Anchor | Text |
|---|---|
| `john.1.14` | a verse |
| `fn:john.1.5:0` | a footnote |
| `cm:<source>:<book>:<c>:<v-range>` | a commentary section |
| `st:<study>:<section>` | a study section |
| `lx:G3056` | a lexicon definition |
| `nt:<group>` | the body of one of your notes |

## Markup engine

An annotation is `{ id, g, a, s, e, k, n?, q, t }`:

- `a`: anchor; `s`/`e`: start and end character offsets in the anchor's plain text
- `k`: `gold | sage | sky | rose | u | b | note`
- `g`: group id; one selection across several anchors makes one group (one note, one entry in the saved list)
- `n`: note text (Markdown-lite); `q`: the quoted selection; `t`: timestamp

Offsets count only the reading text. Verse numbers, Strong's superscripts, interlinear rows and footnote letters carry `data-skip` and are excluded, so marks survive every layer and layout change. After each render, `applyMarks()` unwraps old `<mark data-aid>` elements and wraps the stored ranges again. The same code runs for verses and for note, commentary, study and lexicon text.

Because offsets refer to the plain text, a future change to a verse's wording (a new BSB revision) would shift them. Before a text update, store a hash of each verse's text with the annotation and re-anchor by searching for `q`.

## Voice

- Read aloud: `speechSynthesis`, one utterance per verse. A token guards against stale `onend` events when skipping. It continues into the next chapter if that chapter exists in the data.
- Dictation: `SpeechRecognition` (webkit-prefixed in Chrome and Safari), continuous with interim results, appended to the note or search field.

## Storage

`localStorage["notationbible:v1"]` holds `{ set: settings, ann: annotations, last: hash }`. For sync, the same JSON can be sent to a server keyed by user. Annotations are append-only with ids, so merging is straightforward.
