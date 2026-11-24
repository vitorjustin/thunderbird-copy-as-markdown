#!/usr/bin/env bash
# Package the add-on into dist/copy-email-as-markdown-<version>.xpi
set -euo pipefail
cd "$(dirname "$0")"

version=$(node -p 'require("./manifest.json").version')
out="dist/copy-email-as-markdown-${version}.xpi"

mkdir -p dist
rm -f "$out"
zip -q -X "$out" manifest.json background.js mdconvert.js icon.svg LICENSE
echo "$out"
