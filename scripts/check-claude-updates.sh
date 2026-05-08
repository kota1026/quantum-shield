#!/usr/bin/env bash
# SessionStart hook: detect Claude Code version changes and append a digest
# to docs/intelligence/CLAUDE_UPDATES.md so the in-session model can react.
#
# Exit codes: always 0 (we never want to block startup).

set -uo pipefail

PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
LOG_DIR="$PROJECT_ROOT/docs/intelligence"
LOG_FILE="$LOG_DIR/CLAUDE_UPDATES.md"
STATE_DIR="$PROJECT_ROOT/.claude"
LAST_VERSION_FILE="$STATE_DIR/.last-seen-claude-version"

mkdir -p "$LOG_DIR"

CURRENT_VERSION=""
if command -v claude >/dev/null 2>&1; then
    # `claude --version` -> "2.1.133 (Claude Code)"; take the first whitespace-separated field.
    CURRENT_VERSION="$(claude --version 2>/dev/null | head -n1 | awk '{print $1}')"
fi

if [ -z "$CURRENT_VERSION" ]; then
    exit 0
fi

LAST_VERSION="none"
if [ -f "$LAST_VERSION_FILE" ]; then
    LAST_VERSION="$(cat "$LAST_VERSION_FILE" 2>/dev/null || echo none)"
fi

if [ "$CURRENT_VERSION" = "$LAST_VERSION" ]; then
    exit 0
fi

if [ ! -f "$LOG_FILE" ]; then
    cat > "$LOG_FILE" <<'EOF'
# Claude Code Updates Digest

This file is appended to automatically by `scripts/check-claude-updates.sh`
on every session start. The `claude-updates-curator` agent reads it and
proposes integrations into Quantum Shield (settings.json, agents, skills,
hooks).

Workflow:
1. SessionStart hook detects a version change.
2. New entry appended below.
3. Run `/claude-updates` to fetch release notes and propose changes.
4. Curator agent opens a draft PR labelled `claude-updates`.

EOF
fi

DATE_UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
{
    echo ""
    echo "## $DATE_UTC — version change detected"
    echo ""
    echo "- Previous: \`$LAST_VERSION\`"
    echo "- Current:  \`$CURRENT_VERSION\`"
    echo "- Action:   run \`/claude-updates\` to fetch release notes and propose integrations."
    echo "- Branch:   $(git -C "$PROJECT_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
} >> "$LOG_FILE"

mkdir -p "$STATE_DIR"
printf '%s\n' "$CURRENT_VERSION" > "$LAST_VERSION_FILE"

# Stderr message is visible to the model via the hook output.
>&2 echo "[claude-updates] version $LAST_VERSION -> $CURRENT_VERSION; appended to docs/intelligence/CLAUDE_UPDATES.md. Run /claude-updates to evaluate."

exit 0
