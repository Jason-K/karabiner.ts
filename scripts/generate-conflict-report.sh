#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

UPSTREAM_DIR="../karabiner.ts-upstream"
LOCAL_DIR="karabiner.ts"
OUT="docs/INTEGRATION_CONFLICTS.md"

if [ ! -d "$UPSTREAM_DIR" ]; then
  echo "Upstream dir not found: $UPSTREAM_DIR" >&2
  exit 1
fi

now=$(date)
{
  echo "# Integration Conflict Report (upstream vs local)"
  echo
  echo "Date: $now"
  echo
  echo "## Summary"
  echo
  echo "Upstream: karabiner.ts-upstream; Local: karabiner.ts"
  echo
  echo "### package.json"
  echo
  echo '```diff'
  diff -u "$UPSTREAM_DIR/package.json" package.json || true
  echo '```'
  echo
  echo "### tsconfig.json"
  echo
  echo '```diff'
  diff -u "$UPSTREAM_DIR/tsconfig.json" tsconfig.json || true
  echo '```'
  echo
  echo "### README.md"
  echo
  echo '```diff'
  diff -u "$UPSTREAM_DIR/README.md" README.md || true
  echo '```'
  echo
  echo "### src/index.ts"
  echo
  echo '```diff'
  diff -u "$UPSTREAM_DIR/src/index.ts" src/index.ts || true
  echo '```'
  echo
  echo "### Overlapping src filenames (basename)"
  echo
  echo '```text'
  comm -12 <(find "$UPSTREAM_DIR/src" -type f -name "*.ts" -print0 | xargs -0 -n1 basename | sort -u) \
           <(find src -type f -name "*.ts" -print0 | xargs -0 -n1 basename | sort -u)
  echo '```'
  echo
  echo "### GitHub Workflows present upstream"
  echo
  find "$UPSTREAM_DIR/.github/workflows" -type f -maxdepth 1 -print 2>/dev/null || true
  echo
  echo "### Linting/Format configs upstream"
  echo
  ls -1 "$UPSTREAM_DIR/.prettierignore" "$UPSTREAM_DIR/prettier.config.cjs" 2>/dev/null || true
  echo
  echo "### Note"
  echo
  echo "Our local extensions take precedence. Upstream files are stored under karabiner.ts-upstream for reference."
} > "$OUT"

echo "✓ Wrote $OUT"
