#!/bin/bash
# PreToolUse hook: Block MOCK_/FALLBACK_/DEMO_ patterns in non-test files
# Exit 0 = allow, Exit 2 = block with message

# Read tool input from stdin
INPUT=$(cat)

# Extract file path from the tool input JSON
FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    tool_input = data.get('tool_input', {})
    print(tool_input.get('file_path', tool_input.get('file', '')))
except:
    print('')
" 2>/dev/null)

# If no file path, allow (not a file operation)
if [ -z "$FILE_PATH" ]; then
    exit 0
fi

# Allow test/mock/story files
case "$FILE_PATH" in
    *mock.ts|*mock.tsx|*.test.*|*.spec.*|*.stories.*|*__test__*|*__mock__*)
        exit 0
        ;;
esac

# Extract content being written
CONTENT=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    tool_input = data.get('tool_input', {})
    content = tool_input.get('content', tool_input.get('new_string', ''))
    print(content)
except:
    print('')
" 2>/dev/null)

# If no content, allow
if [ -z "$CONTENT" ]; then
    exit 0
fi

# Check for forbidden patterns
FOUND_PATTERNS=""

if echo "$CONTENT" | grep -qE "MOCK_[A-Z]"; then
    FOUND_PATTERNS="${FOUND_PATTERNS}MOCK_ "
fi

if echo "$CONTENT" | grep -qE "FALLBACK_[A-Z]"; then
    FOUND_PATTERNS="${FOUND_PATTERNS}FALLBACK_ "
fi

if echo "$CONTENT" | grep -qE "DEMO_[A-Z]"; then
    FOUND_PATTERNS="${FOUND_PATTERNS}DEMO_ "
fi

if [ -n "$FOUND_PATTERNS" ]; then
    echo "BLOCKED: Found forbidden patterns (${FOUND_PATTERNS}) in ${FILE_PATH}"
    echo "Rule: No MOCK_/FALLBACK_/DEMO_ data in non-test files."
    echo "Use Loading/Error/Empty states instead. See .claude/rules/integration.md"
    exit 2
fi

# All clear
exit 0
