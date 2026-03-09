#!/bin/bash
# Kaycha DocGen — Bootstrap ALL repos in a directory
# Usage: ./bootstrap-all.sh <parent-directory>
# Example: ./bootstrap-all.sh /e/Projects
#
# Installs the pre-push hook in every git repo found under the parent directory.

set -euo pipefail

PARENT="${1:?Usage: ./bootstrap-all.sh <parent-directory>}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "═══ Kaycha DocGen — Bootstrap All Repos ═══"
echo "Scanning: $PARENT"
echo ""

COUNT=0
ADDED=0
SKIPPED=0

for DIR in "$PARENT"/*/; do
  [ -d "$DIR/.git" ] || continue
  COUNT=$((COUNT + 1))
  REPO_NAME=$(basename "$DIR")

  # Check if hook already exists
  if [ -f "$DIR/.git/hooks/pre-push" ] && grep -q 'docgen' "$DIR/.git/hooks/pre-push" 2>/dev/null; then
    echo "  ⏭  $REPO_NAME — already has docgen hook"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  "$SCRIPT_DIR/bootstrap-repo.sh" "$DIR" > /dev/null 2>&1 && {
    echo "  ✓  $REPO_NAME — hook installed"
    ADDED=$((ADDED + 1))
  } || {
    echo "  ✗  $REPO_NAME — failed"
  }
done

echo ""
echo "═══ Summary ═══"
echo "Total repos: $COUNT"
echo "Added:       $ADDED"
echo "Skipped:     $SKIPPED"
