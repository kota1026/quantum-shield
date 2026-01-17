#!/bin/bash
# =============================================================================
# Phase 6 Parallel Development Setup
# System 03-08 を並列で開発するための Git Worktree セットアップ
# =============================================================================

set -e

# 設定
BASE_DIR="/home/user"
MAIN_REPO="$BASE_DIR/quantum-shield"
BRANCH_PREFIX="claude/phase6"

# システム定義
declare -A SYSTEMS=(
    ["03"]="governance"
    ["04"]="prover"
    ["05"]="observer"
    ["06"]="explorer"
    ["07"]="enterprise"
    ["08"]="admin"
)

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Phase 6 Parallel Worktree Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# PHASE 0: 前提条件チェック
echo -e "${YELLOW}[PHASE 0] Checking prerequisites...${NC}"

cd "$MAIN_REPO" || { echo -e "${RED}Error: Main repo not found${NC}"; exit 1; }

# Git の状態確認
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${RED}Warning: Uncommitted changes in main repo${NC}"
    git status --short
    echo ""
    read -p "Continue anyway? (y/N): " confirm
    [[ "$confirm" != "y" ]] && exit 1
fi

# 最新を取得
echo "Fetching latest from origin..."
git fetch origin

echo -e "${GREEN}✓ Prerequisites OK${NC}"
echo ""

# PHASE 1: Worktree 作成
echo -e "${YELLOW}[PHASE 1] Creating worktrees...${NC}"

for ID in "${!SYSTEMS[@]}"; do
    NAME="${SYSTEMS[$ID]}"
    BRANCH="${BRANCH_PREFIX}-system${ID}-${NAME}"
    WORKTREE_DIR="$BASE_DIR/qs-sys${ID}"

    if [[ -d "$WORKTREE_DIR" ]]; then
        echo -e "  ${YELLOW}⚠ Already exists: $WORKTREE_DIR${NC}"
    else
        # ブランチが既に存在するか確認
        if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
            git worktree add "$WORKTREE_DIR" "$BRANCH"
        elif git show-ref --verify --quiet "refs/remotes/origin/$BRANCH"; then
            git worktree add "$WORKTREE_DIR" "origin/$BRANCH"
        else
            git worktree add "$WORKTREE_DIR" -b "$BRANCH" origin/main
        fi
        echo -e "  ${GREEN}✓ Created: $WORKTREE_DIR ($NAME)${NC}"
    fi
done

echo ""

# PHASE 2: 確認
echo -e "${YELLOW}[PHASE 2] Worktree Summary${NC}"
git worktree list

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo "  1. Start tmux session:"
echo "     bash scripts/start-tmux-session.sh"
echo ""
echo "  2. Or manually start Claude Code in each worktree:"
for ID in "${!SYSTEMS[@]}"; do
    NAME="${SYSTEMS[$ID]}"
    echo "     cd $BASE_DIR/qs-sys${ID} && claude  # ${NAME}"
done
echo ""
echo "  3. In each session, run:"
echo "     /phase6-start <system-name>"
echo ""
