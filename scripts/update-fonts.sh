#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FONT_DIR="${ROOT_DIR}/src/app/fonts"
DO_BUILD=true

if [[ "${1:-}" == "--skip-build" ]]; then
  DO_BUILD=false
fi

mkdir -p "${FONT_DIR}"

download_font() {
  local url="$1"
  local destination="$2"
  curl -fL "${url}" -o "${destination}"
}

download_font \
  "https://fonts.gstatic.com/s/archivo/v25/k3kPo8UDI-1M0wlSV9XAw6lQkqWY8Q82sLydOxKsv4Rn.woff2" \
  "${FONT_DIR}/archivo-latin.woff2"

download_font \
  "https://fonts.gstatic.com/s/archivoblack/v23/HTxqL289NzCGg4MzN6KJ7eW6CYyF_jzx13E.woff2" \
  "${FONT_DIR}/archivo-black-latin.woff2"

download_font \
  "https://fonts.gstatic.com/s/firacode/v27/uU9NCBsR6Z2vfE9aq3bh3dSDqFGedA.woff2" \
  "${FONT_DIR}/fira-code-latin.woff2"

shasum -a 256 "${FONT_DIR}"/*.woff2

if [[ "${DO_BUILD}" == "true" ]]; then
  cd "${ROOT_DIR}"
  bun run build
fi
