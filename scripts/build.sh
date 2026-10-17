#!/usr/bin/env bash
# Package the extension into dist/bettertiktok-vX.Y.Z.zip from the current HEAD.
set -euo pipefail

cd "$(dirname "$0")/.."

VERSION="$(jq -r .version manifest.json)"
OUT="dist/bettertiktok-v${VERSION}.zip"

mkdir -p dist
rm -f "$OUT"

git archive --format=zip --prefix="bettertiktok-v${VERSION}/" -o "$OUT" HEAD

echo "Built $OUT"
python3 -m zipfile -l "$OUT" | tail -n 3
