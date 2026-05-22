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

# Find the current version (assuming it's v=1, v=2, etc.)
CURRENT_VERSION=$(grep -o 'script src="js/[^"]*?v=[0-9]*' *.html | head -1 | grep -o 'v=[0-9]*' | cut -d= -f2)

if [ -z "$CURRENT_VERSION" ]; then
  echo "Could not find current version. Make sure script tags have ?v=X format."
  exit 1
fi

echo "Bumping cache version from $CURRENT_VERSION to $NEW_VERSION..."

# Update all HTML files
sed -i '' "s/?v=$CURRENT_VERSION/?v=$NEW_VERSION/g" *.html

echo "Done! Version bumped to ?v=$NEW_VERSION"
echo "Don't forget to redeploy with: firebase deploy"
