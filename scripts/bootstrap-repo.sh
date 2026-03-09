#!/bin/bash
# Kaycha DocGen — Bootstrap Script
# Usage: ./bootstrap-repo.sh <org/repo>
# Example: ./bootstrap-repo.sh Kaycha-Labs/kaycha-crm
#
# This adds the docgen.yml workflow to a repo so it auto-generates
# canonical docs on every push.

set -euo pipefail

REPO="${1:?Usage: ./bootstrap-repo.sh <org/repo>}"
ORG=$(echo "$REPO" | cut -d'/' -f1)
REPO_NAME=$(echo "$REPO" | cut -d'/' -f2)

echo "═══ Kaycha DocGen Bootstrap ═══"
echo "Repo: $REPO"
echo ""

# Clone the target repo
TMPDIR=$(mktemp -d)
echo "Cloning $REPO..."
git clone "https://github.com/$REPO.git" "$TMPDIR/$REPO_NAME"
cd "$TMPDIR/$REPO_NAME"

# Create workflow directory
mkdir -p .github/workflows

# Write the caller workflow
cat > .github/workflows/docgen.yml << 'EOF'
# Kaycha DocGen — Auto-generates canonical project docs on every push.
# Engine: https://github.com/Jamesjhf1/docgen-template
name: DocGen
on:
  push:
    branches: ['**']
jobs:
  docgen:
    uses: Jamesjhf1/docgen-template/.github/workflows/docgen.yml@main
    secrets: inherit
EOF

# Commit and push
git add .github/workflows/docgen.yml
git commit -m "chore: add Kaycha DocGen workflow"
git push

echo ""
echo "✓ DocGen workflow added to $REPO"
echo "  Next push will trigger doc generation."
echo ""
echo "Required secrets (set at org level or per-repo):"
echo "  ANTHROPIC_API_KEY      — Claude API key"
echo "  DOCGEN_GITHUB_TOKEN    — GitHub PAT with repo + contents:write"

# Cleanup
cd /
rm -rf "$TMPDIR"
