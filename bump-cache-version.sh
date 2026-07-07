#!/bin/bash
# Cache-busting version bump script
# Usage: ./bump-cache-version.sh [new-version]
# Example: ./bump-cache-version.sh 2

if [ -z "$1" ]; then
  echo "Usage: ./bump-cache-version.sh [new-version]"
  echo "Example: ./bump-cache-version.sh 2"
  exit 1
fi

NEW_VERSION=$1

echo "Bumping all ?v=N cache-busting params to ?v=$NEW_VERSION..."

# Replace ANY ?v=<number> with ?v=$NEW_VERSION, regardless of what number it
# currently has. This avoids drift where some links (e.g. css/style.css)
# fall out of sync with others because they didn't match one specific
# "current version" number.
sed -i '' -E "s/\?v=[0-9]+/?v=$NEW_VERSION/g" *.html theses/*.html js/components.js

echo "Done! Version bumped to ?v=$NEW_VERSION"
echo "Don't forget to commit, push, and redeploy."
