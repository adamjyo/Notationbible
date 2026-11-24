#!/usr/bin/env bash
# Builds the installable WordPress plugin: build/notation-bible.zip
#   notation-bible/notation-bible.php, includes/, readme.txt, uninstall.php
#   notation-bible/app/  index.html, app.js, books.js, styles.css, data/ (the whole Bible)
set -euo pipefail
cd "$(dirname "$0")/.."

ver=$(sed -n 's/^ \* Version: *//p' wordpress/notation-bible.php | tr -d '[:space:]')
const=$(sed -n "s/^define( 'NB_VERSION', '\(.*\)' );/\1/p" wordpress/notation-bible.php)
stable=$(sed -n 's/^Stable tag: *//p' wordpress/readme.txt | tr -d '[:space:]')
if [[ -z "$ver" || "$ver" != "$const" || "$ver" != "$stable" ]]; then
  echo "Version mismatch: header '$ver', NB_VERSION '$const', readme Stable tag '$stable'" >&2
  exit 1
fi

out=build/notation-bible
rm -rf build && mkdir -p "$out/app"
cp -r wordpress/notation-bible.php wordpress/includes wordpress/readme.txt wordpress/uninstall.php "$out/"
cp index.html app.js books.js styles.css "$out/app/"
cp -r data "$out/app/data"
find "$out/app/data" -type f ! -name '*.json' -delete
cp LICENSE "$out/" 2>/dev/null || true

(cd build && zip -qr -9 notation-bible.zip notation-bible)
echo "$ver" > build/VERSION
echo "Built build/notation-bible.zip (version $ver, $(du -h build/notation-bible.zip | cut -f1), $(find "$out" -type f | wc -l) files)"
