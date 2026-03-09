#!/bin/bash
# Kaycha DocGen - Bootstrap ALL repos in an org
# Usage: ./bootstrap-all.sh <org-name>
# Example: ./bootstrap-all.sh Kaycha-Labs
#
# Requires: gh CLI authenticated with appropriate permissions

set -euo pipefail

ORG="${1:?Usage: ./bootstrap-all.sh <org-name>}"

echo "=== Kaycha DocGen - Bootstrap All Repos ==="
echo "Organization: $ORG"
echo ""

# List all repos in the org
REPOS=$(gh repo list "$ORG" --limit 100 --json name --jq '.[].name')

TOTAL=$(echo "$REPOS" | wc -l)
COUNT=0
SKIPPED=0
ADDED=0

for REPO_NAME in $REPOS; do
  COUNT=$((COUNT + 1))
  echo "[$COUNT/$TOTAL] $ORG/$REPO_NAME"

  # Check if workflow already exists
  EXISTS=$(gh api "repos/$ORG/$REPO_NAME/contents/.github/workflows/docgen.yml" 2>/dev/null && echo "yes" || echo "no")

  if [ "$EXISTS" = "yes" ]; then
    echo "  Already has docgen.yml - skipping"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  # Add workflow via GitHub API (no need to clone)
  CONTENT=$(echo -n 'name: DocGen
on:
  push:
    branches: ["**"]
jobs:
  docgen:
    uses: Jamesjhf1/docgen-template/.github/workflows/docgen.yml@main
    secrets: inherit' | base64 -w 0)

  gh api --method PUT "repos/$ORG/$REPO_NAME/contents/.github/workflows/docgen.yml" \
    -f message="chore: add Kaycha DocGen workflow" \
    -f content="$CONTENT" \
    --silent 2>/dev/null || {
      echo "  Failed - check permissions"
      continue
    }

  echo "  Added docgen.yml"
  ADDED=$((ADDED + 1))
done

echo ""
echo "=== Summary ==="
echo "Total repos: $TOTAL"
echo "Added:       $ADDED"
echo "Skipped:     $SKIPPED"
