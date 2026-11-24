# Resources report
Tue Nov 24 20:26:27 UTC 2026

## SOTW-Historical-Commentaries/historical-commentary-resources
```
6155 .github/workflows/reader-discovery-browser-smoke.yml
8667 .github/workflows/reader-discovery-smoke.yml
48409 1CH_V3_UPLOAD_MANIFEST.json
41386 1CO_V3_UPLOAD_MANIFEST.json
32371 1KI_V3_UPLOAD_MANIFEST.json
60137 2CH_V3_UPLOAD_MANIFEST.json
36903 2KI_V3_UPLOAD_MANIFEST.json
4184 2PE_1JN_2JN_V3_INSTALL_NOTES.md
4434 2PE_1JN_2JN_V3_SOURCE_AUDIT.json
26198 2PE_1JN_2JN_V3_UPLOAD_MANIFEST.json
1611 2TH_1TI_V3_INSTALL_NOTES.md
29632 2TH_1TI_V3_UPLOAD_MANIFEST.json
2380 2TI_TIT_V3_INSTALL_NOTES.md
21831 2TI_TIT_V3_UPLOAD_MANIFEST.json
5400 3JN_JUD_REV_V3_INSTALL_NOTES.md
5680 3JN_JUD_REV_V3_SOURCE_AUDIT.json
60431 3JN_JUD_REV_V3_UPLOAD_MANIFEST.json
67410 ACT_V3_UPLOAD_MANIFEST.json
996 ADAPTER_UPLOAD_MANIFEST.json
18866 AMO_V3_UPLOAD_MANIFEST.json
1609 COL_1TH_V3_INSTALL_NOTES.md
28002 COL_1TH_V3_UPLOAD_MANIFEST.json
22710 DAN_V3_UPLOAD_MANIFEST.json
973 DEMO_SITE_INSTALL_MANIFEST.json
102111 DEU_JOS_V3_UPLOAD_MANIFEST.json
22690 ECC_V3_UPLOAD_MANIFEST.json
3414 EPH_PHP_V3_INSTALL_NOTES.md
28122 EPH_PHP_V3_UPLOAD_MANIFEST.json
19618 EST_V3_UPLOAD_MANIFEST.json
60818 EXODUS_UPLOAD_MANIFEST.json
76853 EZK_V3_UPLOAD_MANIFEST.json
10439 HAB_V3_UPLOAD_MANIFEST.json
8665 HAG_V3_UPLOAD_MANIFEST.json
25953 HOS_V3_UPLOAD_MANIFEST.json
66613 HTTP_PILOT_INSTALL_MANIFEST.json
1586 INSTALL_MANIFEST.json
102973 ISA_V3_UPLOAD_MANIFEST.json
2175 JAS_1PE_V3_INSTALL_NOTES.md
2095 JAS_1PE_V3_RELEASE_AUDIT_2026-11-15.md
27414 JAS_1PE_V3_UPLOAD_MANIFEST.json
40947 JDG_RUT_V3_UPLOAD_MANIFEST.json
83081 JER_V3_UPLOAD_MANIFEST.json
51651 JHN_V3_UPLOAD_MANIFEST.json
66613 JOB_V3_UPLOAD_MANIFEST.json
9527 JOL_V3_UPLOAD_MANIFEST.json
13903 JON_V3_UPLOAD_MANIFEST.json
12875 LAM_V3_UPLOAD_MANIFEST.json
40162 LEVITICUS_V3_UPLOAD_MANIFEST.json
58364 LUK_V3_UPLOAD_MANIFEST.json
13372 MAL_V3_UPLOAD_MANIFEST.json
68178 MAT_V3_UPLOAD_MANIFEST.json
19987 MIC_V3_UPLOAD_MANIFEST.json
40349 MRK_V3_UPLOAD_MANIFEST.json
10306 NAM_V3_UPLOAD_MANIFEST.json
5146 NAVIGATION_SCOPE_PATCH_MANIFEST.json
23857 NEH_V3_UPLOAD_MANIFEST.json
52616 NUMBERS_V3_UPLOAD_MANIFEST.json
6750 OBA_V3_UPLOAD_MANIFEST.json
2864 PHM_HEB_V3_INSTALL_NOTES.md
37737 PHM_HEB_V3_UPLOAD_MANIFEST.json
51287 PRO_V3_UPLOAD_MANIFEST.json
227764 PSA_V3_UPLOAD_MANIFEST.json
3537 README.md
3087 README_HTTP_PILOT.md
40600 ROM_V3_UPLOAD_MANIFEST.json
87962 SA1_SA2_V3_UPLOAD_MANIFEST.json
16778 SNG_V3_UPLOAD_MANIFEST.json
76654 STAGING_V3_UPLOAD_MANIFEST.json
35171 ZEC_V3_UPLOAD_MANIFEST.json
10597 ZEP_V3_UPLOAD_MANIFEST.json
2331 api/jacob-lannom/v1/concepts/v2/README.md
2166 api/jacob-lannom/v1/concepts/v2/manifest.json
19445 api/jacob-lannom/v1/concepts/v2/registry.json
7382 api/jacob-lannom/v1/concepts/v2/schema.json
98026 api/jacob-lannom/v1/coverage.json
56969 api/jacob-lannom/v1/current-commentary.json
12582 api/jacob-lannom/v1/source-records/media-4vosdo.json
18836 api/jacob-lannom/v1/source-records/media-daqi89.json
12868 api/jacob-lannom/v1/source-records/media-fie2dj.json
19636 api/jacob-lannom/v1/source-records/media-wqvm4d.json
... 9470 files
```
### README.md
# Servants of the Way | Historical Commentary Resources

This repository-root package provides a **versioned retrieval manifest, passage index, and working local lookup tool** for six original HelloAO commentary JSON collections. It is designed for a separate `SOTW-Historical-Commentaries/historical-commentary-resources` repository, but **does not contain the 94 MB source archive**. No remote deployment, live web API, or GitHub Release has been performed.

## Installation (manual)

Merge `config/`, `data/`, `scripts/`, `audit/`, and `docs/` into the repository root. The provided `README.md` may replace the initial placeholder README **only if you choose**. Keep the existing repository history. Do not upload the raw source ZIP into ordinary Git history. Retain it in your private source archive; publishing an immutable GitHub Release asset is a future option subject to owner authorization, data rights review and SHA verification.

## Local passage retrieval

Put original `helloao-historical-commentaries.zip` in the parent folder of this checkout, or supply `--archive /path/to/helloao-historical-commentaries.zip`.

```bash
python3 scripts/get_passage.py GEN.1.1 --authors john-gill matthew-henry --display-edition KJV1769 --out sample.json
python3 scripts/get_passage.py ROM.8 --authors john-calvin --include-chapter-context --out sample-romans.json
```

`--display-edition` changes viewing context only. It does not fabricate an alignment between an author's original commentary and a
### README_HTTP_PILOT.md
# SOTW Historical Commentaries | Static HTTP Genesis pilot v1

This is an **additive manual-upload package**, built from the immutable HelloAO snapshot `helloao-2026-11-01`. It leaves all existing `config/`, `audit/`, `data/`, `docs/`, `scripts/get_passage.py`, and original GitHub Release untouched. Do not upload the full source ZIP into git history.

## Contents
- `api/v1/manifest.json`: source version, authors, templates, corpus summary.
- `api/v1/snapshots/helloao-2026-11-01/index/GEN/{chapter}.json`: author availability and exact resource paths for all Genesis chapters.
- `api/v1/snapshots/helloao-2026-11-01/authors/{author}/GEN/{chapter}.json`: historical commentary source JSON, wrapped with provenance and source SHA-256. All six authors, 50 chapters each.
- `scripts/build_static_resources.py`: deterministic Python standard-library generator for further books. Run it against the **original ZIP** with `--books EXO LEV`, etc. Generated resources are immutable snapshots.
- `HTTP_PILOT_INSTALL_MANIFEST.json`: file-level bytes and SHA-256 for this package.

## Manual upload
Upload the package **contents** at repository root, preserving folder paths. Do **not** replace entire existing `scripts/` or repository files. This package adds only new `api/`, one new script and a new README/manifest. It does not activate hosting.

## HTTP access (not live until hosting is enabled)
On GitHub Pages for the `historical-commentary-resources` project repository, the public URL prefix would 
grep: write error: Broken pipe
grep: write error: Broken pipe
grep: write error: Broken pipe
### sample 1CH_V3_UPLOAD_MANIFEST.json
```
{
  "kind": "SOTW_one_book_verified_repo_root_release_manifest",
  "version": "1CH-v3-2026-11-06",
  "book": "1CH",
  "book_name": "1 Chronicles",
  "repository": "SOTW-Historical-Commentaries/historical-commentary-resources",
  "baseline_head_commit": "d6faad2e533c18901c4ba5e30074df91d2c725d6",
  "snapshot": "structured-first-chronicles-2026-11-06",
  "source_archives_verified": {
    "MHC.zip": "6bcb936873ca144e317805e5c1677940fd86e2403f7c14517752e44f25c8882b",
    "CalvinCommentaries.zip": "df66fc8c03537499ad006d069481d2c95b600887cdbd6ce75ec5d264b573192a",
    "Clarke.zip": "56bb33d3bf0f50c1609f4dd10ac81e7450bb0e8aae93bf340074ccb5e207a44f",
    "JFB.zip": "78eae01d4e4cea96aec496b4d4f149b5
```
### sample 1CO_V3_UPLOAD_MANIFEST.json
```
{
  "kind": "sotw_v3_owner_manual_upload_release_manifest",
  "version": "v3-1-corinthians-2026-11-12",
  "book": "1CO",
  "book_name": "1 Corinthians",
  "repository": "SOTW-Historical-Commentaries/historical-commentary-resources",
  "canonical_position": 46,
  "testament": "NT",
  "snapshot": "structured-1-corinthians-2026-11-12",
  "baseline_main_commit": null,
  "baseline_navigation_manifest_git_blob": "751c4728b91cd5b89f907f41b6b61d5d178afdb8",
  "baseline_navigation_sha256": "2d2b52a99693aa99528a8373d213327195e4b08f6ed1444a921f437fa45fe670",
  "baseline_kind": "projected-after-ROM",
  "prerequisites": [
    "Confirm previous navigation Git blob 751c4728b91cd5b89f907f41b6b61d5d178afdb8 
```
### sample 1KI_V3_UPLOAD_MANIFEST.json
```
{"kind":"SOTW_one_book_verified_GitHub_release_manifest","version":"1KI-v3-2026-11-06","book":"1KI","book_name":"1 Kings","repository":"SOTW-Historical-Commentaries/historical-commentary-resources","baseline_head_commit":"b7a34f4ef821e2d6df2bd1ad6d67ecc0afae96ce","snapshot":"structured-first-kings-2026-11-06","source_archives_verified":{"MHC":"6bcb936873ca144e317805e5c1677940fd86e2403f7c14517752e44f25c8882b","CalvinCommentaries":"df66fc8c03537499ad006d069481d2c95b600887cdbd6ce75ec5d264b573192a","Clarke":"56bb33d3bf0f50c1609f4dd10ac81e7450bb0e8aae93bf340074ccb5e207a44f","JFB":"78eae01d4e4cea96aec496b4d4f149b582d6d7316c56c0b1f9ef07f8f784b2a6","KD":"ca3bdb6a04c0b717ee2faed71b432d58195db96f217f4
```
### sample 2CH_V3_UPLOAD_MANIFEST.json
```
{
  "kind": "SOTW_one_book_verified_repo_root_release_manifest",
  "version": "2CH-v3-2026-11-06",
  "book": "2CH",
  "book_name": "2 Chronicles",
  "repository": "SOTW-Historical-Commentaries/historical-commentary-resources",
  "baseline_head_commit": "c88bca5014a34e73c8c89e628ddf555497af10f9",
  "baseline_tree_sha": "af434ee821e937b6aa40f72336588cdcbcac6ab5",
  "baseline_navigation_manifest_git_blob_sha": "43954b96e5691a370dcf03f9f1cc52dc3a9e951f",
  "snapshot": "structured-second-chronicles-2026-11-06",
  "source_archives_verified": {
    "MHC.zip": "6bcb936873ca144e317805e5c1677940fd86e2403f7c14517752e44f25c8882b",
    "CalvinCommentaries.zip": "df66fc8c03537499ad006d069481d2c95b600887cd
```
### sample 2KI_V3_UPLOAD_MANIFEST.json
```
{"kind":"SOTW_one_book_verified_GitHub_release_manifest","version":"2KI-v3-2026-11-06","book":"2KI","book_name":"2 Kings","repository":"SOTW-Historical-Commentaries/historical-commentary-resources","snapshot":"structured-second-kings-2026-11-06","source_archives_verified":{"MHC.zip":"6bcb936873ca144e317805e5c1677940fd86e2403f7c14517752e44f25c8882b","CalvinCommentaries.zip":"df66fc8c03537499ad006d069481d2c95b600887cdbd6ce75ec5d264b573192a","Clarke.zip":"56bb33d3bf0f50c1609f4dd10ac81e7450bb0e8aae93bf340074ccb5e207a44f","JFB.zip":"78eae01d4e4cea96aec496b4d4f149b582d6d7316c56c0b1f9ef07f8f784b2a6","KD.zip":"ca3bdb6a04c0b717ee2faed71b432d58195db96f217f490ce6f7d9c36a2876f7","helloao-historical-comm
```

## Jackboby/MHCC-JSON
warning: You appear to have cloned an empty repository.
```
fatal: Not a valid object name HEAD
fatal: Not a valid object name HEAD
... 0 files
```
fatal: Not a valid object name HEAD
fatal: Not a valid object name HEAD

## thefrenchpressed/pillar-commentary-data
```
1096 LICENSE
7230 README.md
687 available_commentaries.json
100168 c/calvin/1CO/1.json
77976 c/calvin/1CO/10.json
89712 c/calvin/1CO/11.json
45343 c/calvin/1CO/12.json
30888 c/calvin/1CO/13.json
76075 c/calvin/1CO/14.json
110782 c/calvin/1CO/15.json
27516 c/calvin/1CO/16.json
50635 c/calvin/1CO/2.json
57780 c/calvin/1CO/3.json
59610 c/calvin/1CO/4.json
37033 c/calvin/1CO/5.json
48165 c/calvin/1CO/6.json
105507 c/calvin/1CO/7.json
34554 c/calvin/1CO/8.json
52366 c/calvin/1CO/9.json
27987 c/calvin/1JN/1.json
71800 c/calvin/1JN/2.json
56076 c/calvin/1JN/3.json
47328 c/calvin/1JN/4.json
58534 c/calvin/1JN/5.json
80450 c/calvin/1PE/1.json
72708 c/calvin/1PE/2.json
54933 c/calvin/1PE/3.json
46783 c/calvin/1PE/4.json
30562 c/calvin/1PE/5.json
24245 c/calvin/1TH/1.json
35752 c/calvin/1TH/2.json
17613 c/calvin/1TH/3.json
27648 c/calvin/1TH/4.json
51084 c/calvin/1TH/5.json
2902 c/calvin/1TI/1.json
4305 c/calvin/1TI/2.json
7499 c/calvin/1TI/3.json
9292 c/calvin/1TI/4.json
2439 c/calvin/1TI/5.json
3754 c/calvin/1TI/6.json
64224 c/calvin/2CO/1.json
41339 c/calvin/2CO/10.json
50741 c/calvin/2CO/11.json
44539 c/calvin/2CO/12.json
36609 c/calvin/2CO/13.json
37176 c/calvin/2CO/2.json
44522 c/calvin/2CO/3.json
46820 c/calvin/2CO/4.json
54842 c/calvin/2CO/5.json
31175 c/calvin/2CO/6.json
42889 c/calvin/2CO/7.json
41664 c/calvin/2CO/8.json
23676 c/calvin/2CO/9.json
51614 c/calvin/2PE/1.json
44888 c/calvin/2PE/2.json
29257 c/calvin/2PE/3.json
24781 c/calvin/2TH/1.json
52343 c/calvin/2TH/2.json
32926 c/calvin/2TH/3.json
2743 c/calvin/2TI/1.json
2852 c/calvin/2TI/2.json
2855 c/calvin/2TI/3.json
3626 c/calvin/2TI/4.json
52333 c/calvin/AMO/1.json
61683 c/calvin/AMO/2.json
54439 c/calvin/AMO/3.json
54566 c/calvin/AMO/4.json
112457 c/calvin/AMO/5.json
56998 c/calvin/AMO/6.json
75435 c/calvin/AMO/7.json
51027 c/calvin/AMO/8.json
68535 c/calvin/AMO/9.json
75629 c/calvin/COL/1.json
66838 c/calvin/COL/2.json
36880 c/calvin/COL/3.json
24929 c/calvin/COL/4.json
71123 c/calvin/DAN/1.json
78917 c/calvin/DAN/10.json
228241 c/calvin/DAN/11.json
97564 c/calvin/DAN/12.json
... 3929 files
```
### LICENSE
MIT License

Copyright (c) 2026 The Pillar Commentary Data contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

### README.md
# Pillar Commentary Data

Public-domain Bible commentary text, converted into the same JSON schema used by
[HelloAO's Free Use Bible API](https://bible.helloao.org/docs), for use in
[The Pillar](https://github.com/thefrenchpressed) Bible reading app (and anyone
else who wants it — that's the point of public domain).

## Layout

```
c/{commentary-id}/manifest.json      -- id, name, language, list of covered USFM book codes
c/{commentary-id}/{USFM}/{chapter}.json
```

Each chapter file:

```json
{ "chapter": { "content": [
    { "type": "verse", "number": 16, "content": [ { "text": "For God so loved the world..." } ] },
    ...
] } }
```

Fetch directly via jsDelivr, e.g.:
`https://cdn.jsdelivr.net/gh/thefrenchpressed/pillar-commentary-data@main/c/calvin/JHN/3.json`

## Commentaries

### calvin — John Calvin's Commentaries

Source: [CrossWire SWORD project's `CalvinCommentaries` module](https://www.crosswire.org/sword/modules/ModInfo.jsp?modName=CalvinCommentaries)
(public domain, sourced from [CCEL](https://www.ccel.org/)). Covers 47 books —
see `c/calvin/manifest.json` for the exact list; Calvin didn't write on every
book of the Bible (e.g. no Samuel/Kings/Chronicles, Job, Proverbs, Acts, Revelation).

A handful of verses (Genesis 1:1, Psalm 1:1, 1 Timothy 1:1, 2 Timothy 1:1) are
intentionally omitted: the source module attaches book/chapter front matter
(title pages, translator's prefaces) to those verse slots instead of a
per-verse comment, and it isn't reliably separ
grep: write error: Broken pipe
grep: write error: Broken pipe
grep: write error: Broken pipe
### sample available_commentaries.json
```
{
  "commentaries": [
    {
      "id": "calvin",
      "name": "John Calvin Commentaries",
      "englishName": "John Calvin Commentaries",
      "language": "eng"
    },
    {
      "id": "fbmeyer",
      "name": "F. B. Meyer's Through the Bible Day by Day",
      "englishName": "F. B. Meyer's Through the Bible Day by Day",
      "language": "eng"
    },
    {
      "id": "gaebelein",
      "name": "Gaebelein Bible Commentary",
      "englishName": "Gaebelein Bible Commentary",
      "language": "eng"
    },
    {
      "id": "scofield",
      "name": "C. I. Scofield Bible Commentary",
      "englishName": "C. I. Scofield Bible Commentary",
      "language": "eng"
    }
  ]
}

```
### sample c/calvin/1CO/1.json
```
{"chapter": {"content": [{"type": "verse", "number": 1, "content": [{"text": "1. Paul, called to be an Apostle In this manner does Paul proceed, in almost all the introductions to his Epistles, with the view of procuring for his doctrine authority and favor. The former he secures to himself from the station that had been assigned to him by God, as being an Apostle of Christ sent by God; the latter by testifying his affection towards those to whom he writes. We believe much more readily the man whom we look upon as regarding us with affection, and as faithfully endeavoring to promote our welfare. In this salutation, therefore, he claims for himself authority, when he speaks of himself as an A
```
### sample c/calvin/1CO/10.json
```
{"chapter": {"content": [{"type": "verse", "number": 1, "content": [{"text": "What he had previously taught by two similitudes, he now confirms by examples. The Corinthians grew wanton, and gloried, as if they had served out their time, or at least had finished their course, when they had scarcely left the starting-point. This vain exultation and confidence he represses in this manner — “As I see that you are quietly taking your ease at the very outset of your course, I would not have you ignorant of what befell the people of Israel in consequence of this, that their example may arouse you.” As, however, on examples being adduced, any point of difference destroys the force of the compa
```
### sample c/calvin/1CO/11.json
```
{"chapter": {"content": [{"type": "verse", "number": 1, "content": [{"text": "1. Imitators of me. From this it appears, how absurdly chapters are divided, inasmuch as this sentence is disjoined from what goes before, with which it ought to have been connected, and is joined to what follows, with which it has no connection. Let us view this, then, as the close of the preceding chapter. Paul had there brought forward his own example in confirmation of his doctrine. Now, in order that the Corinthians may understand that this would be becoming in them, he exhorts them to imitate what he had done, even as he had imitated Christ Here there are two things to be observed — first, that he prescribe
```
### sample c/calvin/1CO/12.json
```
{"chapter": {"content": [{"type": "verse", "number": 1, "content": [{"text": "1. Now concerning spiritual things. He goes on to correct another fault. As the Corinthians abused the gifts of God for ostentation and show, and love was little, if at all, regarded, he shows them for what purpose believers are adorned by God with spiritual gifts — for the edification of their brethren. This proposition, however, he divides into two parts; for, in the first place, he teaches, that God is the author of those gifts, and, secondly, having established this, he reasons as to their design. He proves from their own experience, that those things in which they gloried, are bestowed upon men through the e
```

## garydavenport73/eastons-bible-dictionary-json
```
1072 LICENSE
3477 README.md
2122660 eastons.json
2690740 eastons.jsonl
11019764 history.tar.gz
... 5 files
```
### LICENSE
MIT License

Copyright (c) 2026 garydavenport73

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

### README.md
# Easton's Bible Dictionary (JSON Format)

This project provides **Easton's Bible Dictionary** converted into a standard JSON format that supports multiple senses or definitions per headword.

## Purpose

The primary objective of this project is to improve upon existing line-delimited datasets by structuring the dictionary into a unified JSON file. Unlike standard flat formats, this dataset groups multiple distinct definitions, contexts, and senses under a single, consolidated headword entry, making it much more practical for web development, search indexing, and application lookup. It is intended that each distinct definition can in the future have additional properties added such as type (person, place, thing), with further nesting of data such as (siblings, latitude/longitude) etc. nested under the definition.

## How it works

The unified dictionary was generated using the following process:

1. **Source extraction**: The raw records were processed from the original `Easton's Bible Dictionary.jsonl` file.
2. **Headword consolidation**: A compilation script grouped entries sharing identical headwords.
3. **Array nesting**: Instead of duplicating headwords across separate records, multiple senses and distinct definitions were mapped into an array of objects nested directly within that headword's master record.
4. **JSON compilation**: The final structured map was validated and exported as a single, standard JSON file.

## Technical environment and compilation

This entire d
### sample eastons.json
```
{
  "A": [
    {
      "definition": "Alpha, the first letter of the Greek alphabet, as Omega is the last. These letters occur in the text of Rev. 1:8, 11; 21:6; 22:13, and are represented by \"Alpha\" and \"Omega\" respectively (omitted in R.V., 1:11). They mean \"the first and last.\" (Comp. Heb. 12:2; Isa. 41:4; 44:6; Rev. 1:11, 17; 2:8.) In the symbols of the early Christian Church these two letters are frequently combined with the cross or with Christ's monogram to denote his divinity."
    }
  ],
  "Aaron": [
    {
      "definition": "The eldest son of Amram and Jochebed, a daughter of Levi (Ex. 6:20). Some explain the name as meaning mountaineer, others mountain of strength, illumina
```
### sample eastons.jsonl
```
{"term": "A", "definitions": ["Alpha, the first letter of the Greek alphabet, as Omega is the last. These letters occur in the text of Rev. 1:8, 11; 21:6; 22:13, and are represented by \"Alpha\" and \"Omega\" respectively (omitted in R.V., 1:11). They mean \"the first and last.\" (Comp. Heb. 12:2; Isa. 41:4; 44:6; Rev. 1:11, 17; 2:8.) In the symbols of the early Christian Church these two letters are frequently combined with the cross or with Christ's monogram to denote his divinity."]}
{"term": "Aaron", "definitions": ["The eldest son of Amram and Jochebed, a daughter of Levi (Ex. 6:20). Some explain the name as meaning mountaineer, others mountain of strength, illuminator. He was born in E
```

## neuu-org/bible-dictionary-dataset
```
72 .gitignore
343 CHANGELOG.md
300 LICENSE
5905 README.md
7483368 data/00_raw/ccel/xml/easton_ebd2.xml
9742215 data/00_raw/ccel/xml/hastings_dict_bible.xml
224688 data/00_raw/ccel/xml/hitchcock_bible_names.xml
6779564 data/00_raw/ccel/xml/smith_bibledict.xml
561 data/01_parsed/_index.json
864213 data/01_parsed/a.json
557057 data/01_parsed/b.json
630326 data/01_parsed/c.json
313082 data/01_parsed/d.json
463691 data/01_parsed/e.json
234646 data/01_parsed/f.json
364408 data/01_parsed/g.json
543957 data/01_parsed/h.json
163669 data/01_parsed/i.json
549744 data/01_parsed/j.json
141080 data/01_parsed/k.json
285388 data/01_parsed/l.json
641972 data/01_parsed/m.json
262923 data/01_parsed/n.json
120661 data/01_parsed/o.json
604725 data/01_parsed/p.json
17269 data/01_parsed/q.json
247010 data/01_parsed/r.json
833037 data/01_parsed/s.json
439915 data/01_parsed/t.json
57579 data/01_parsed/u.json
48891 data/01_parsed/v.json
177157 data/01_parsed/w.json
7870 data/01_parsed/y.json
181268 data/01_parsed/z.json
138 data/02_sources/easton/_index.json
557441 data/02_sources/easton/a.json
383873 data/02_sources/easton/b.json
472972 data/02_sources/easton/c.json
247882 data/02_sources/easton/d.json
306221 data/02_sources/easton/e.json
187605 data/02_sources/easton/f.json
256563 data/02_sources/easton/g.json
362311 data/02_sources/easton/h.json
99787 data/02_sources/easton/i.json
368376 data/02_sources/easton/j.json
93540 data/02_sources/easton/k.json
183583 data/02_sources/easton/l.json
404158 data/02_sources/easton/m.json
156798 data/02_sources/easton/n.json
81285 data/02_sources/easton/o.json
373052 data/02_sources/easton/p.json
12720 data/02_sources/easton/q.json
174702 data/02_sources/easton/r.json
500436 data/02_sources/easton/s.json
253173 data/02_sources/easton/t.json
27829 data/02_sources/easton/u.json
30675 data/02_sources/easton/v.json
113376 data/02_sources/easton/w.json
6581 data/02_sources/easton/y.json
113890 data/02_sources/easton/z.json
175 data/02_sources/hastings/_index.json
542731 data/02_sources/hastings/a.json
397152 data/02_sources/hastings/b.json
407176 data/02_sources/hastings/c.json
197839 data/02_sources/hastings/d.json
322400 data/02_sources/hastings/e.json
131163 data/02_sources/hastings/f.json
219230 data/02_sources/hastings/g.json
457427 data/02_sources/hastings/h.json
131277 data/02_sources/hastings/i.json
421254 data/02_sources/hastings/j.json
111829 data/02_sources/hastings/k.json
178293 data/02_sources/hastings/l.json
481474 data/02_sources/hastings/m.json
162782 data/02_sources/hastings/n.json
112354 data/02_sources/hastings/o.json
480522 data/02_sources/hastings/p.json
14722 data/02_sources/hastings/q.json
195650 data/02_sources/hastings/r.json
614803 data/02_sources/hastings/s.json
... 167 files
```
### LICENSE
Creative Commons Attribution 4.0 International (CC BY 4.0)

Copyright (c) 2026 NEUU

Source dictionaries are public domain:
- Easton's Bible Dictionary (Matthew George Easton, 1897)
- Smith's Bible Dictionary (William Smith, 1863)

Full license: https://creativecommons.org/licenses/by/4.0/legalcode

### README.md
# Bible Dictionary Dataset

Biblical dictionary entries parsed from 4 CCEL ThML XML sources into 5 structured dictionary datasets.

Part of the [NEUU](https://github.com/neuu-org) biblical scholarship ecosystem.

## Overview

| Metric | Value |
|--------|-------|
| Raw XML sources | 4 (Easton, Smith, Hastings, Hitchcock) |
| Parsed dictionaries | 5 (Easton, Smith, Hastings, Hitchcock, Schaff) |
| Easton entries | 3,962 |
| Smith entries | 4,561 |
| Hastings entries | 5,033 |
| Hitchcock entries | 2,619 |
| Schaff entries | 4,725 |
| **Total entries** | **20,900** |

## Pipeline

```
00_raw/ccel/xml/                          <- Original ThML XML from CCEL
  ├── easton_ebd2.xml
  ├── smith_bibledict.xml
  ├── hastings_dict_bible.xml
  └── hitchcock_bible_names.xml
              |
              | parse_easton_smith.py
              v
01_parsed/   (Easton + Smith merged by term, a-z + _index.json)
              |
              | split_sources.py
              v
02_sources/  (each dictionary standalone)
  ├── easton/    (3,962 entries)
  ├── smith/     (4,561 entries)
  ├── hastings/  (5,033 entries)  <- parse_hastings.py
  ├── hitchcock/ (2,619 entries)  <- parse_hitchcock.py
  └── schaff/    (4,725 entries)  <- parse_schaff.py
```

## Structure

```
bible-dictionary-dataset/
├── data/
│   ├── 00_raw/
│   │   └── ccel/xml/                    # Original ThML XML sources
│   │       ├── easton_e
### sample data/01_parsed/_index.json
```
{
  "total_entries": 5998,
  "total_refs": 35089,
  "sources": [
    "EAS",
    "SMI"
  ],
  "source_names": {
    "EAS": "Easton's Bible Dictionary",
    "SMI": "Smith's Bible Dictionary"
  },
  "files": [
    "a.json",
    "b.json",
    "c.json",
    "d.json",
    "e.json",
    "f.json",
    "g.json",
    "h.json",
    "i.json",
    "j.json",
    "k.json",
    "l.json",
    "m.json",
    "n.json",
    "o.json",
    "p.json",
    "q.json",
    "r.json",
    "s.json",
    "t.json",
    "u.json",
    "v.json",
    "w.json",
    "y.json",
    "z.json"
  ]
}
```
### sample data/01_parsed/a.json
```
{
  "A": {
    "name": "A",
    "slug": "a",
    "definitions": [
      {
        "source": "EAS",
        "text": "Alpha, the first letter of the Greek alphabet, as Omega is the last. These letters occur in the text of Rev. 1:8, 11; 21:6; 22:13, and are represented by “Alpha” and “Omega” respectively (omitted in R.V., 1:11). They mean “the first and last.” (Comp. Heb. 12:2; Isa. 41:4; 44:6; Rev. 1:11, 17; 2:8.) In the symbols of the early Christian Church these two letters are frequently combined with the cross or with Christ’s monogram to denote his divinity."
      },
      {
        "source": "SMI",
        "text": "See Alpha"
      }
    ],
    "scripture_refs": [
      {

```
### sample data/01_parsed/b.json
```
{
  "BAAL": {
    "name": "Baal",
    "slug": "baal",
    "definitions": [
      {
        "source": "EAS",
        "text": "Lord. (1.) The name appropriated to the principal male god of the Phoenicians. It is found in several places in the plural BAALIM (Judg. 2:11; 10:10; 1 Kings 18:18; Jer. 2:23; Hos. 2:17). Baal is identified with Molech (Jer. 19:5). It was known to the Israelites as Baal-peor (Num. 25:3; Deut. 4:3), was worshipped till the time of Samuel (1 Sam 7:4), and was afterwards the religion of the ten tribes in the time of Ahab (1 Kings 16:31-33; 18:19, 22). It prevailed also for a time in the kingdom of Judah (2 Kings 8:27; comp. 11:18; 16:3; 2 Chr. 28:2), till finally put an e
```
### sample data/01_parsed/c.json
```
{
  "CAB": {
    "name": "Cab",
    "slug": "cab",
    "definitions": [
      {
        "source": "EAS",
        "text": "Hollow (R.V., “kab”), occurs only in 2 Kings 6:25; a dry measure, the sixth part of a seah, and the eighteenth part of an ephah, equal to about two English quarts."
      },
      {
        "source": "SMI",
        "text": "[Measures]"
      }
    ],
    "scripture_refs": [
      {
        "reference": "2 Kings 6:25",
        "original": "2 Kings 6:25"
      }
    ],
    "sources": [
      "EAS",
      "SMI"
    ]
  },
  "CABBON": {
    "name": "Cabbon",
    "slug": "cabbon",
    "definitions": [
      {
        "source": "SMI",
        "text": "a town in the low coun
```
### sample data/01_parsed/d.json
```
{
  "DABAREH": {
    "name": "Dabareh",
    "slug": "dabareh",
    "definitions": [
      {
        "source": "SMI",
        "text": "(pasture), (Joshua 21:28) or Daberath, a town on the boundary of Zebulun. (Joshua 19:12) Under the name of Debarieh it still lies at the western foot of Tabor."
      }
    ],
    "scripture_refs": [
      {
        "reference": "Joshua 21:28",
        "original": "Joshua 21:28"
      },
      {
        "reference": "Joshua 19:12",
        "original": "Joshua 19:12"
      }
    ],
    "sources": [
      "SMI"
    ]
  },
  "DABBASHETH": {
    "name": "Dabbasheth",
    "slug": "dabbasheth",
    "definitions": [
      {
        "source": "SMI",
        "text": "(
```

## j86schroeder/topical-bible-search
```
207 .gitattributes
820 .gitignore
1071 LICENSE
11449 README.md
2382 data/errata/topical-reference-errata.v1.json
0 data/sources/topical/.gitkeep
5544 dist/nave/anomalies.jsonl
65950683 dist/nave/assertions.jsonl
8818868 dist/nave/entries.jsonl
1219321 dist/nave/topics.jsonl
1039 dist/topical-build-summary.json
2266 dist/torrey/anomalies.jsonl
21066282 dist/torrey/assertions.jsonl
7397467 dist/torrey/entries.jsonl
148324 dist/torrey/topics.jsonl
19822 index.html
20860 scripts/analyze/analyze-topical-pdf-layout.mjs
7375 scripts/analyze/analyze-topical-pdf.mjs
30931 scripts/build/build-topical-dist.mjs
3360 scripts/inspect/inspect-topical-topic.mjs
4912 scripts/lib/topical-pdf-utils.mjs
9858 scripts/smoke/smoke-topical-esv-search.mjs
47809 scripts/verify/verify-topical-clean-data.mjs
13909 scripts/verify/verify-topical-extraction-strict.mjs
13499 scripts/verify/verify-topical-extraction.mjs
... 25 files
```
### LICENSE
MIT License

Copyright (c) 2026 John Schroeder

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

### README.md
# Topical Bible Search

A browser-based topical Bible search application backed by an audited data pipeline.

The project transforms **Nave's Topical Bible** and **Torrey's New Topical Textbook** into structured JSONL data, validates and normalizes Scripture references, records known source anomalies, and makes the resulting data searchable through a lightweight static web interface.

## Project Highlights

- Searches topical entries from both Nave and Torrey
- Displays source context and normalized Scripture references
- Fetches KJV passage text without requiring an API key
- Supports an optional ESV API key through the app settings
- Runs as a static site with no application server or database
- Includes reproducible PDF extraction, verification, normalization, and build scripts
- Preserves corrections in a versioned errata file instead of silently changing source data

## Current Data Build

The committed distribution build currently passes all configured validation checks.

| Metric | Nave | Torrey | Total |
| --- | ---: | ---: | ---: |
| Topics | 5,321 | 620 | **5,941** |
| Entries | 28,994 | 23,552 | **52,546** |
| Normalized reference assertions | 77,970 | 38,583 | **116,553** |
| Recorded anomalies | 5 | 4 | **9** |
| References corrected through errata | 16 | 4 | **20** |
| Unresolved invalid references | 0 | 0 | **0** |

The authoritative build summary is stored in [`dist/topical-build-summary.json`](dist/topical-build-summary.json).

## Quick Start

### Requirement
### sample data/errata/topical-reference-errata.v1.json
```
{
  "version": 1,
  "description": "High-confidence reference errata for Nave/Torrey topical source extraction. These do not change the raw extracted entries; they only correct normalized assertion output.",
  "corrections": [
    {
      "id": "nave-miracles-ex-3-19-29",
      "source": "nave",
      "sourceTopicSlug": "miracles",
      "rawSegment": "Ex 3:19,29",
      "replaceWith": ["Ex 3:19,20"],
      "reason": "Exodus 3 has no verse 29; the surrounding miracle context points to Exodus 3:19-20."
    },
    {
      "id": "nave-miracles-mr-18-42-43",
      "source": "nave",
      "sourceTopicSlug": "miracles",
      "rawSegment": "18:42,43",
      "rawGroupContains": "Mr 2:9-12; 18:42,43
```
### sample dist/nave/anomalies.jsonl
```
{"id":"nave:anomaly:7edaab6c3d1c","source":"nave","kind":"corrected_by_errata","errataId":"nave-miracles-ex-3-19-29","reason":"verse-out-of-range","errataReason":"Exodus 3 has no verse 29; the surrounding miracle context points to Exodus 3:19-20.","topicId":"nave:miracles","sourceTopic":"MIRACLES","sourceTopicSlug":"miracles","entryId":"nave:miracles:entry:00152:ef6755aa","entryIndex":152,"firstPdfPage":650,"rawText":"DESIGN OF Ex 3:19,29; 4:2-9; 7:5,17; 8:8-10,22; 9:14-16,29; 10:1,2,16,17; 11:1,7-9; 12:29-33; 14:4,18,24,25,31; 16:4-6; 19:4,5,9; Nu 14:11; 16:28-35; 17:1-13; De 4:33-35; 11:1-8; 29:5,6; Jos 2:9-11; 3:10,11; 4:23,24; 5:1; Jud 2:7; 1Sa 6:6-18; 12:17,18; 1Ki 18:24,37-39; 2Ki 5:14
```
### sample dist/nave/assertions.jsonl
```
{"id":"nave:assertion:0000001:480f7084","source":"nave","sourceStatus":"source_valid","topicId":"nave:aaron","sourceTopic":"AARON","sourceTopicSlug":"aaron","entryId":"nave:aaron:entry:00001:26888ff6","entryIndex":1,"firstPdfPage":7,"rawText":"Lineage of Ex 6:16-20; Jos 21:4,10; 1Ch 6:2,3; 23:13","rawRefGroup":"Ex 6:16-20","rawSegment":"Ex 6:16-20","groupIndex":0,"segmentIndex":0,"book":"Exodus","chapterStart":6,"verseStart":16,"chapterEnd":6,"verseEnd":20,"scope":"verse","normalizedRef":"Exodus 6:16-20"}
{"id":"nave:assertion:0000002:f94d8fbe","source":"nave","sourceStatus":"source_valid","topicId":"nave:aaron","sourceTopic":"AARON","sourceTopicSlug":"aaron","entryId":"nave:aaron:entry:0000
```
### sample dist/nave/entries.jsonl
```
{"id":"nave:aaron:entry:00001:26888ff6","source":"nave","topicId":"nave:aaron","sourceTopic":"AARON","sourceTopicSlug":"aaron","entryIndex":1,"firstPdfPage":7,"rawText":"Lineage of Ex 6:16-20; Jos 21:4,10; 1Ch 6:2,3; 23:13","refGroups":["Ex 6:16-20","Jos 21:4,10","1Ch 6:2,3; 23:13"],"seeAlso":[],"extractionFlags":[]}
{"id":"nave:aaron:entry:00002:ea072495","source":"nave","topicId":"nave:aaron","sourceTopic":"AARON","sourceTopicSlug":"aaron","entryIndex":2,"firstPdfPage":7,"rawText":"Marriage of Ex 6:23","refGroups":["Ex 6:23"],"seeAlso":[],"extractionFlags":[]}
{"id":"nave:aaron:entry:00003:8cb4addd","source":"nave","topicId":"nave:aaron","sourceTopic":"AARON","sourceTopicSlug":"aaron","ent
```
### sample dist/nave/topics.jsonl
```
{"id":"nave:aaron","source":"nave","sourceTopic":"AARON","sourceTopicSlug":"aaron","duplicateIndex":1,"firstPdfPage":7,"lastPdfPage":null,"entryCount":30,"refGroupCount":51,"seeAlso":["PRIEST, HIGH"],"extractionFlags":[]}
{"id":"nave:abaddon","source":"nave","sourceTopic":"ABADDON","sourceTopicSlug":"abaddon","duplicateIndex":1,"firstPdfPage":8,"lastPdfPage":null,"entryCount":1,"refGroupCount":1,"seeAlso":[],"extractionFlags":[]}
{"id":"nave:abagtha","source":"nave","sourceTopic":"ABAGTHA","sourceTopicSlug":"abagtha","duplicateIndex":1,"firstPdfPage":8,"lastPdfPage":null,"entryCount":1,"refGroupCount":1,"seeAlso":[],"extractionFlags":[]}
{"id":"nave:abana","source":"nave","sourceTopic":"ABAN
```

## openbibleinfo/Bible-Geocoding-Data
```
4248731 all.kml
11550193 data/ancient.jsonl
155985 data/geometry.jsonl
1469114 data/image.jsonl
3224520 data/modern.jsonl
225544 data/source.jsonl
708 geometry/a0009b3.geojson
3651 geometry/a0009b3.kml
472 geometry/a009e7d.geojson
2534 geometry/a009e7d.kml
592 geometry/a00de1e.geojson
2871 geometry/a00de1e.kml
8488 geometry/a010244.geojson
2416 geometry/a010244.kml
1437 geometry/a012133.geojson
3256 geometry/a012133.kml
6949 geometry/a012194.geojson
2351 geometry/a012194.kml
156030 geometry/a012705.geojson
8095 geometry/a012705.kml
37885 geometry/a01769f.geojson
12200 geometry/a01769f.kml
6480 geometry/a028191.geojson
8883 geometry/a028191.kml
6942 geometry/a0293ff.geojson
2606 geometry/a0293ff.kml
469 geometry/a031bda.geojson
2776 geometry/a031bda.kml
835 geometry/a033373.geojson
3649 geometry/a033373.kml
187 geometry/a033b84.geojson
3906 geometry/a033b84.kml
593 geometry/a03a5d0.geojson
2989 geometry/a03a5d0.kml
2960 geometry/a03afe1.geojson
3805 geometry/a03afe1.kml
890 geometry/a03be2e.geojson
2430 geometry/a03be2e.kml
1551 geometry/a03cb21.geojson
5390 geometry/a03cb21.kml
19103 geometry/a03cc2d.geojson
11698 geometry/a03cc2d.kml
475 geometry/a03f6cf.geojson
2524 geometry/a03f6cf.kml
191 geometry/a040ba5.geojson
2307 geometry/a040ba5.kml
6437 geometry/a0415e8.geojson
7181 geometry/a0415e8.kml
801 geometry/a041bb3.geojson
12511 geometry/a041bb3.kml
188 geometry/a044272.geojson
2373 geometry/a044272.kml
1068 geometry/a046454.geojson
4110 geometry/a046454.kml
1132 geometry/a046c70.geojson
2795 geometry/a046c70.kml
191 geometry/a053f15.geojson
3415 geometry/a053f15.kml
2067 geometry/a0574da.geojson
4282 geometry/a0574da.kml
597 geometry/a057d59.geojson
2686 geometry/a057d59.kml
39824 geometry/a05ebb7.geojson
11967 geometry/a05ebb7.kml
3260 geometry/a05ee76.geojson
4108 geometry/a05ee76.kml
2452 geometry/a061538.geojson
4170 geometry/a061538.kml
347 geometry/a062b95.geojson
2538 geometry/a062b95.kml
868 geometry/a070c7b.geojson
2335 geometry/a070c7b.kml
1504 geometry/a071cb2.geojson
3595 geometry/a071cb2.kml
358 geometry/a072bae.geojson
2460 geometry/a072bae.kml
1538 geometry/a075d61.geojson
3555 geometry/a075d61.kml
1706 geometry/a077262.geojson
3690 geometry/a077262.kml
... 6634 files
```
### license.txt
Attribution 4.0 International

=======================================================================

Creative Commons Corporation ("Creative Commons") is not a law firm and
does not provide legal services or legal advice. Distribution of
Creative Commons public licenses does not create a lawyer-client or
other relationship. Creative Commons makes its licenses and related
information available on an "as-is" basis. Creative Commons gives no
warranties regarding its licenses, any material licensed under their
terms and conditions, or any related information. Creative Commons
disclaims all liability for damages resulting from their use to the
fullest extent possible.

Using Creative Commons Public Licenses

Creative Commons public licenses provide a standard set of terms and
conditions that creators and other rights holders may use to share
original works of authorship and other material subject to copyright
and certain other rights specified in the public license below. The
following considerations are for informational purposes only, are not
exhaustive, and do not form part of our licenses.

     Considerations for licensors: Our public licenses are
     intended for use by those authorized to give the public
     permission to use material in ways otherwise restricted by
     copyright and certain other rights. Our licenses are
     irrevocable. Licensors should read and understand the terms
     and conditions of the license they choose before applying it.
     Licensors s
### readme.md
# Introduction

This project attempts to catalog the location of every identifiable place mentioned in the Protestant Bible. It draws from over seventy modern sources (mostly Bible commentaries, dictionaries, encyclopedias, and atlases), with over 400 unique sources cited, and catalogs the possible locations of each place mentioned as well as the confidence in the identification of that place. It also catalogs the expression of these places in ten English translations of the Bible, links the data to semantic databases like Wikidata where possible, and provides a thumbnail image for every location.

It is a substantial update to my previous attempt to catalog this data in 2007.

Browse an [interface to this data](https://www.openbible.info/geo/) or read a blog post for a [higher-level overview of this project](https://www.openbible.info/blog/2021/11/rethinking-the-bible-atlas/).

## Definitions

In this documentation, a "place" refers to an ancient place mentioned in the Bible, such as Jerusalem, and a "location" refers to a modern location, such as Jerusalem (ancient places and modern locations can have the same name but don't necessarily refer to exactly the same location).

## License

This data is licensed under a [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/) license.

OpenStreetMap data is licensed under [ODbL 1.0](https://opendatacommons.org/licenses/odbl/), which is similar to CC-BY-SA.

The licenses for images vary depending on the im
### sample data/ancient.jsonl
```
{"extra":"{\"associations\":[{\"url_slug\":\"barada-river\",\"thumbnail\":{\"credit_url\":\"https://commons.wikimedia.org/wiki/File:Barada_river.Damascus.jpg\",\"file\":\"m39ac0b.ia3a355.jpg\",\"image_id\":\"ia3a355\",\"description\":\"closeup of the <modern id=\\\"m39ac0b\\\">Barada River</modern>\",\"credit\":\"Arch rim\",\"placeholder\":\"#a5a692,#6c6d5a,#6b8192\"},\"identification_ids\":[[0,0]],\"score\":1000,\"modern_id\":\"m39ac0b\",\"name\":\"Barada River\"}],\"osises\":[\"2Kgs.5.12\"],\"identifications\":[\"Barada River\"]}","friendly_id":"Abana","geojson_file":"aea17b7.geojson","geometry_credit":"osm","id":"aea17b7","identifications":[{"class":"natural","description":"<modern id=\"m
```
### sample data/geometry.jsonl
```
{"format":"kml","geometry":"isobands","id":"g3d49f6","isobands_geojson_file":"g3d49f6.isobands.geojson","land_or_water":"land","name":"Abarim","source":"ancient","suggested":{"label_line":["35.658656,31.477198","35.764706,31.772037"],"label_line_horizontal":["35.602118,31.684477","35.767663,31.684477"],"rough_boundary":["35.579793,31.474164","35.689111,31.417789","35.813848,31.676068","35.772630,31.738142","35.863903,31.722994","35.879128,31.810441","35.822930,31.832300","35.671799,31.825109","35.588888,31.753210","35.555414,31.580313","35.557852,31.517560","35.579793,31.474164"]}}
{"format":"kml","geometry":"isobands","id":"ge72c1b","isobands_geojson_file":"ge72c1b.isobands.geojson","land_o
```
### sample data/image.jsonl
```
{"author":"Waseem Al Sakhleh","color":"color","credit":"Waseem Al Sakhleh","credit_url":"https://commons.wikimedia.org/wiki/File:%D9%82%D8%B0%D8%A7%D8%A6%D9%81_%D8%AA%D9%85_%D8%AA%D8%AD%D9%88%D9%8A%D9%84%D9%87%D8%A7_%D9%84%D8%A3%D8%B5%D9%8A%D8%B5_%D9%86%D8%A8%D8%A7%D8%AA%D8%A7%D8%AA_%D9%81%D9%8A_%D8%B9%D8%B1%D8%A8%D9%8A%D9%86_%D8%A8%D8%B1%D9%8A%D9%81_%D8%AF%D9%85%D8%B4%D9%82.jpg","descriptions":{"mcaea80":"streetscape at <modern id=\"mcaea80\">Arbin</modern>"},"file_url":"https://upload.wikimedia.org/wikipedia/commons/9/95/%D9%82%D8%B0%D8%A7%D8%A6%D9%81_%D8%AA%D9%85_%D8%AA%D8%AD%D9%88%D9%8A%D9%84%D9%87%D8%A7_%D9%84%D8%A3%D8%B5%D9%8A%D8%B5_%D9%86%D8%A8%D8%A7%D8%AA%D8%A7%D8%AA_%D9%81%D9%8A_%D8
```
### sample data/modern.jsonl
```
{"ancient_associations":{"a0574da":{"name":"Iye-abarim","score":27,"url_slug":"iye-abarim"},"a154d7b":{"name":"Hamonah","score":229,"url_slug":"hamonah"},"a2109c3":{"name":"Valley of Hamon-gog","score":229,"url_slug":"valley-of-hamon-gog"},"aa8275b":{"name":"Abarim","score":1000,"url_slug":"abarim"},"ae7f7b5":{"name":"Zophim","score":21,"url_slug":"zophim"},"afd9259":{"name":"Pisgah","score":47,"url_slug":"pisgah"}},"class":"natural","coordinates_source":{"id":"Q337141","source_id":"s7cc8b2","type":"wikidata"},"epsg_28191":"217842/129136","friendly_id":"Abarim","geojson_file":"m207993.geojson","geojson_roles":{"isobands":{"id":"g3d49f6.isobands"},"representative_point":{"id":"m207993.represe
```
### sample data/source.jsonl
```
{"amazon_id":"B00RH9BHO0","amazon_url":"https://www.amazon.com/G%C3%A9ographie-Palestine-vols-F-M-Abel/dp/B00RH9BHO0","contributors":["Félix-Marie Abel"],"display_name":"Abel, Géographie de la Palestine (1967)","friendly_id":"abel_geography_palestine","google_books_id":"iPTtAAAAMAAJ","google_books_url":"https://www.google.com/books/edition/G%C3%A9ographie_de_la_Palestine/iPTtAAAAMAAJ","id":"sdf971d","type":"book","worldcat_id":"1071394600","worldcat_url":"https://www.worldcat.org/title/gographie-de-la-palestine-1-gographie-physique-et-historique/oclc/1071394600","year":1967}
{"contributors":["Mahmoud Abualhaija"],"display_name":"Abualhaija, Assessing Water Quality of Kufranja Dam (2021)","
```

## scrollmapper/bible_databases
```
101 .gitattributes
805 .github/workflows/plain-text-integrity.yml
116 .gitignore
1069 LICENSE
15326 README.md
1443 docs/0_introduction.md
1614 docs/1_project_layout.md
5598 docs/2_scripting.md
8996 docs/3_sql.md
3737 docs/4_adding_texts.md
442 docs/README.md
0 docs/main_readme/book_list.md
950 docs/main_readme/introduction.md
1038 docs/main_readme/license.md
3912 docs/main_readme/schema.md
9328 docs/main_readme/translation_list.md
615564 docs/scrollmapper.png
4606466 formats/csv/ACV.csv
4622090 formats/csv/AKJV.csv
4661937 formats/csv/ASV.csv
4862596 formats/csv/Alb.csv
1442885 formats/csv/Anderson.csv
1778975 formats/csv/ArmEastern.csv
4678765 formats/csv/BBE.csv
4389968 formats/csv/BSB.csv
570337 formats/csv/BeaMRK.csv
12286038 formats/csv/BurJudson.csv
2015311 formats/csv/Byz.csv
5558637 formats/csv/CPDV.csv
7207224 formats/csv/CSlElizabeth.csv
5575220 formats/csv/CebPinadayag.csv
2125080 formats/csv/Che1860.csv
4397193 formats/csv/ChiSB.csv
3953177 formats/csv/ChiUn.csv
2852478 formats/csv/ChiUnL.csv
6849979 formats/csv/CopSahBible2.csv
4446328 formats/csv/CroSaric.csv
4392642 formats/csv/CzeBKR.csv
4264470 formats/csv/CzeCSP.csv
5257601 formats/csv/DRC.csv
4403550 formats/csv/DaOT1871NT1907.csv
4615619 formats/csv/Darby.csv
4958560 formats/csv/DutSVV.csv
5818003 formats/csv/DutSVVA.csv
4364728 formats/csv/Esperanto.csv
1587975 formats/csv/Est.csv
5492363 formats/csv/FinBiblia.csv
5487086 formats/csv/FinPR.csv
4613468 formats/csv/FinSTLK2017.csv
4757373 formats/csv/FreBBB.csv
5109443 formats/csv/FreBDM1744.csv
5460721 formats/csv/FreCrampon.csv
1510523 formats/csv/FreGeneve1669.csv
4936699 formats/csv/FreJND.csv
4747150 formats/csv/FreLXX.csv
4954274 formats/csv/FreLXXGiguet.csv
1536851 formats/csv/FreOltramare1874.csv
4814892 formats/csv/FrePGR.csv
1528637 formats/csv/FreStapfer1889.csv
1785363 formats/csv/FreSynodale1921.csv
4699013 formats/csv/Geneva1599.csv
1808314 formats/csv/GerAlbrecht.csv
4564551 formats/csv/GerBoLut.csv
4810646 formats/csv/GerElb1871.csv
4843471 formats/csv/GerElb1905.csv
4560713 formats/csv/GerGruenewald.csv
1554854 formats/csv/GerLeoNA28.csv
5991969 formats/csv/GerMenge.csv
1753583 formats/csv/GerOffBiSt.csv
4742927 formats/csv/GerSch.csv
4118906 formats/csv/GerTafel.csv
4833097 formats/csv/GerTextbibel.csv
4998323 formats/csv/GerZurcher.csv
8084267 formats/csv/GreVamvas.csv
4847603 formats/csv/Haitian.csv
1467691 formats/csv/Haweis.csv
4186737 formats/csv/HebModern.csv
4696750 formats/csv/HunKar.csv
3582802 formats/csv/JPS.csv
4733598 formats/csv/JapBungo.csv
... 1888 files
```
### LICENSE
MIT License

Copyright (c) 2024 Scrollmapper

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

### README.md
# Bible Versions and Cross-Reference Databases: MySQL, SQLite, CSV, JSON, YAML, TXT, MD, PARQUET.

This is a collection of bible versions in different formats. Here are some quick introductions:

- Find the bible versions you are looking for in the [Formats Folder](./formats).
- Find the source texts/resources in the [Sources Folder](./sources).
- Utilize the production / conversion scripts for this project in the [Scripts Folder](./scripts).
- A large and accurate cross-reference resource is included from https://www.openbible.info/labs/cross-references/ 

See the simple [DOCUMENTATION](https://github.com/scrollmapper/bible_databases/blob/2025/docs/README.md).

> **⚠️ Important: The legacy version of this project is available on the [2024](https://github.com/scrollmapper/bible_databases/tree/2024) branch. Please note that significant changes to the database schema have been implemented in the 2025 branch and subsequent versions.**


<p align="center">
  <img src="docs/scrollmapper.png" alt="Scrollmapper" width="900">
</p>

## Available Translations (140)

- **ACV (en)**: ACV: A Conservative Version
- **AKJV (en)**: AKJV: American King James Version
- **ASV (en)**: ASV: American Standard Version (1901)
- **Alb (sq)**: Alb: Albanian Bible
- **Anderson (en)**: Anderson: Henry Tompkins Anderson’s 1864 New Testament
- **ArmEastern (hy)**: ArmEastern: Eastern Armenian Bible
- **BBE (en)**: BBE: 1949/1964 Bible in Basic English
- **BSB (en)**: BSB: Berean Standard Bible
- **B
grep: write error: Broken pipe
grep: write error: Broken pipe
### sample formats/csv/ACV.csv
```
Book,Chapter,Verse,Text
Genesis,1,1,In the beginning God created the heavens and the earth.
Genesis,1,2,"And the earth was without form and void, and darkness was upon the face of the deep, and the Spirit of God moved upon the face of the waters."
Genesis,1,3,"And God said, Let there be light, and there was light."
Genesis,1,4,"And God saw the light, that it was good. And God divided the light from the darkness."
Genesis,1,5,"And God called the light Day, and the darkness he called Night. And there was evening and there was morning, one day."
Genesis,1,6,"And God said, Let there be a firmament in the midst of the waters, and let it divide the waters from the waters."
Genesis,1,7,"And 
```
### sample formats/csv/AKJV.csv
```
Book,Chapter,Verse,Text
Genesis,1,1,In the beginning God created the heaven and the earth.
Genesis,1,2,"And the earth was without form, and void; and darkness was on the face of the deep. And the Spirit of God moved on the face of the waters."
Genesis,1,3,"And God said, Let there be light: and there was light."
Genesis,1,4,"And God saw the light, that it was good: and God divided the light from the darkness."
Genesis,1,5,"And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day. ¶"
Genesis,1,6,"And God said, Let there be a firmament in the middle of the waters, and let it divide the waters from the waters."
Genesis,1,7,"And Go
```
### sample formats/csv/ASV.csv
```
Book,Chapter,Verse,Text
Genesis,1,1,In the beginning God created the heavens and the earth.
Genesis,1,2,And the earth was waste and void; and darkness was upon the face of the deep: and the Spirit of God moved upon the face of the waters.
Genesis,1,3,"And God said, Let there be light: and there was light."
Genesis,1,4,"And God saw the light, that it was good: and God divided the light from the darkness."
Genesis,1,5,"And God called the light Day, and the darkness he called Night. And there was evening and there was morning, one day."
Genesis,1,6,"And God said, Let there be a firmament in the midst of the waters, and let it divide the waters from the waters."
Genesis,1,7,"And God made 
```
### sample formats/csv/Alb.csv
```
Book,Chapter,Verse,Text
Genesis,1,1,Në fillim Perëndia krijoi qiejt dhe tokën.
Genesis,1,2,"Toka ishte pa trajtë, e zbrazët dhe errësira mbulonte sipërfaqen e humnerës; dhe Fryma e Perëndisë fluturonte mbi sipërfaqen e ujërave."
Genesis,1,3,"Pastaj Perëndia tha: ""U bëftë drita!"". Dhe drita u bë."
Genesis,1,4,Dhe Perëndia pa që drita ishte e mirë; dhe Perëndia e ndau dritën nga errësira.
Genesis,1,5,"Dhe Perëndia e quajti dritën ""ditë"" dhe errësirën ""natë"". Kështu erdhi mbrëmja e pastaj erdhi mëngjesi: dita e parë."
Genesis,1,6,"Pastaj Perëndia tha: ""Le të jetë një kupë qiellore mes ujërave, që t'i ndajë ujërat nga ujërat""."
Genesis,1,7
```
### sample formats/csv/Anderson.csv
```
Book,Chapter,Verse,Text
Genesis,1,1,
Genesis,1,2,
Genesis,1,3,
Genesis,1,4,
Genesis,1,5,
Genesis,1,6,
Genesis,1,7,
Genesis,1,8,
Genesis,1,9,
Genesis,1,10,
Genesis,1,11,
Genesis,1,12,
Genesis,1,13,
Genesis,1,14,
Genesis,1,15,
Genesis,1,16,
Genesis,1,17,
Genesis,1,18,
Genesis,1,19,
Genesis,1,20,
Genesis,1,21,
Genesis,1,22,
Genesis,1,23,
Genesis,1,24,
Genesis,1,25,
Genesis,1,26,
Genesis,1,27,
Genesis,1,28,
Genesis,1,29,
Genesis,1,30,
Genesis,1,31,
Genesis,2,1,
Genesis,2,2,
Genesis,2,3,
Genesis,2,4,
Genesis,2,5,
Genesis,2,6,
Genesis,2,7,
Genesis,2,8,
Genesis,2,9,
Genesis,2,10,
Genesis,2,11,
Genesis,2,12,
Genesis,2,13,
Genesis,2,14,
Genesis,2,15,
Gen
```
