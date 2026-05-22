#!/usr/bin/env bash
# Trim logo PNGs in-place (backups created)
# Usage: ./scripts/trim-logos.sh

set -euo pipefail

IMAGES_DIR="$(dirname "$0")/../images"
BACKUP_DIR="$IMAGES_DIR/backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Files to trim (adjust names if your project uses different filenames)
FILES=(
  "fclogo.png"
  "fc-footlogo-new.png"
)

# Prefer ImageMagick v7 (magick). Fallback to convert.
if command -v magick >/dev/null 2>&1; then
  CMD="magick"
elif command -v convert >/dev/null 2>&1; then
  CMD="convert"
else
  echo "ImageMagick not found. Install it with: brew install imagemagick"
  exit 2
fi

for f in "${FILES[@]}"; do
  src="$IMAGES_DIR/$f"
  if [ ! -f "$src" ]; then
    echo "Warning: $src not found, skipping"
    continue
  fi
  echo "Backing up $f -> $BACKUP_DIR/"
  cp "$src" "$BACKUP_DIR/"
  echo "Trimming $f"
  if [ "$CMD" = "magick" ]; then
    magick "$src" -trim +repage "$src"
  else
    convert "$src" -trim +repage "$src"
  fi
done

echo "Done. Trimmed files (originals saved) in: $BACKUP_DIR"
