#!/bin/bash
# =============================================================================
# Phase 6 Parallel Development - Cleanup Script
# Worktree の削除とクリーンアップ
# =============================================================================

set -e

BASE_DIR="/home/user"
MAIN_REPO="$BASE_DIR/quantum-shield"

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Phase 6 Worktree Cleanup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

cd "$MAIN_REPO"

# 現在の worktree 一覧
echo -e "${YELLOW}Current worktrees:${NC}"
git worktree list
echo ""

# 未コミットの変更をチェック
echo -e "${YELLOW}Checking for uncommitted changes...${NC}"
HAS_CHANGES=false

for WORKTREE in $(git worktree list --porcelain | grep "^worktree" | cut -d' ' -f2); do
    if [[ "$WORKTREE" != "$MAIN_REPO" ]]; then
        CHANGES=$(cd "$WORKTREE" && git status --porcelain 2>/dev/null || echo "")
        if [[ -n "$CHANGES" ]]; then
            echo -e "${RED}⚠ Uncommitted changes in: $WORKTREE${NC}"
            echo "$CHANGES" | head -5
            HAS_CHANGES=true
        fi
    fi
done

if [[ "$HAS_CHANGES" == "true" ]]; then
    echo ""
    echo -e "${RED}Warning: Some worktrees have uncommitted changes!${NC}"
    read -p "Continue with cleanup? (y/N): " confirm
    [[ "$confirm" != "y" ]] && exit 1
fi

echo ""

# 削除確認
echo -e "${YELLOW}This will remove the following worktrees:${NC}"
for ID in 03 04 05 06 07 08; do
    WORKTREE_DIR="$BASE_DIR/qs-sys${ID}"
    if [[ -d "$WORKTREE_DIR" ]]; then
        echo "  - $WORKTREE_DIR"
    fi
done
echo ""

read -p "Proceed with deletion? (y/N): " confirm
[[ "$confirm" != "y" ]] && { echo "Aborted."; exit 0; }

echo ""

# 削除実行
for ID in 03 04 05 06 07 08; do
    WORKTREE_DIR="$BASE_DIR/qs-sys${ID}"
    if [[ -d "$WORKTREE_DIR" ]]; then
        echo -n "Removing $WORKTREE_DIR... "
        git worktree remove "$WORKTREE_DIR" --force 2>/dev/null || true
        echo -e "${GREEN}done${NC}"
    fi
done

# Prune stale entries
echo ""
echo "Pruning stale worktree entries..."
git worktree prune

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Cleanup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Remaining worktrees:"
git worktree list
