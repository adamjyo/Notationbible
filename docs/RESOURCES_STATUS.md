# Study resources: import status (paused 2026-11-24)

Resource importing is **paused**. The importer (`scripts/build_resources.py`) and its workflow
(`.github/workflows/import-resources.yml`, now manual-only) are kept as they are.

## Imported and live in the app
| Resource | Source | License | Result |
|---|---|---|---|
| KJV, ASV, YLT (Compare layer, verse panel) | scrollmapper/bible_databases `formats/csv` | MIT repo; texts public domain | 66 books each, ~31,100 verses |
| Jamieson-Fausset-Brown commentary | HelloAO Free Use Bible API (`/api/c/jamieson-fausset-brown/...`) | Public domain | 17,055 verse comments; 2 chapters unavailable |
| Scofield Reference Notes | thefrenchpressed/pillar-commentary-data `c/scofield` | MIT; text public domain | 3,205 notes in 66 books |
| Easton's Bible Dictionary | garydavenport73/eastons-bible-dictionary-json | MIT; text public domain | 3,961 terms |
| Nave's + Torrey's topical Bibles | j86schroeder/topical-bible-search `dist/` | MIT; texts public domain | 5,941 topics, 181,879 verse links |
| Bible places | openbibleinfo/Bible-Geocoding-Data `data/` | CC BY 4.0 (attribution shown in the app) | 1,342 places, 1,335 with coordinates |

## Where it stopped / next steps

Note: after any import, `scripts/pack_data.py` merges small per-book folders into single files (the workflows run it). Artifacts hold at most 512 files; the app is ~313.
1. **WEB translation missing**: `formats/csv/WEB.csv` doesn't exist in scrollmapper. Check the real file name in their translation list (data/RESOURCES_REPORT.md was cut off before "W"), add it to `translations()` and rerun.
2. **More commentaries not yet imported**: Matthew Henry (complete), Adam Clarke, John Gill and Keil-Delitzsch are available from HelloAO (`helloao_commentary('<id>')`). Calvin, Gaebelein and F. B. Meyer are available in pillar-commentary-data. Watch the size: JFB alone is ~5 MB.
3. **Considered, not imported**: theographic-bible-metadata (people, places and events; CC BY-SA, share-alike), MACULA Greek/Hebrew syntax (CC BY 4.0), public-domain BSB audio (Barry Hays narration), chronological reading-plan data.
4. **Reports**: `data/RESOURCES_REPORT.md` (what each candidate repo contains) and `data/RESOURCES_IMPORT.md` (counts from the last import).

## Also pending (not a resource import)
- WordPress plugin: **done** (`wordpress/`, updates itself from GitHub releases; see README → WordPress plugin).
