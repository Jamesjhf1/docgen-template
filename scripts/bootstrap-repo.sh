#!/bin/bash
# Kaycha DocGen — Bootstrap Script (Local Ollama)
# Usage: ./bootstrap-repo.sh <path-to-repo>
# Example: ./bootstrap-repo.sh /e/Projects/kaycha-crm
#
# Installs a git pre-push hook that runs DocGen locally via Ollama
# before every push.

set -euo pipefail

REPO_PATH="${1:?Usage: ./bootstrap-repo.sh <path-to-repo>}"
DOCGEN_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ ! -d "$REPO_PATH/.git" ]; then
  echo "Error: $REPO_PATH is not a git repository"
  exit 1
fi

echo "═══ Kaycha DocGen Bootstrap ═══"
echo "Repo: $REPO_PATH"
echo "Engine: $DOCGEN_DIR"
echo ""

# Create hooks directory
mkdir -p "$REPO_PATH/.git/hooks"

# Write the pre-push hook
cat > "$REPO_PATH/.git/hooks/pre-push" << HOOK
#!/bin/bash
# Kaycha DocGen — pre-push hook
# Auto-generates canonical docs via local Ollama before every push.

# Skip if this push is from docgen itself
LAST_MSG=\$(git log -1 --format=%s 2>/dev/null || echo "")
if echo "\$LAST_MSG" | grep -q '\[docgen\]'; then
  exit 0
fi

echo ""
echo "═══ Kaycha DocGen — generating docs... ═══"
npx tsx "$DOCGEN_DIR/docgen/index.ts" "\$(git rev-parse --show-toplevel)" 2>&1
echo "═══ DocGen complete ═══"
echo ""
HOOK

chmod +x "$REPO_PATH/.git/hooks/pre-push"

echo "✓ Pre-push hook installed at $REPO_PATH/.git/hooks/pre-push"
echo "  Every push will auto-generate docs via Ollama (localhost:11434)."
echo ""
echo "To override Ollama URL:"
echo "  export OLLAMA_URL=http://host:11434"
