#!/bin/bash
# =============================================================================
# Phase 6 Parallel Development - tmux Session Manager
# 6つのシステムを並列で開発するための tmux セッション
# =============================================================================

set -e

SESSION_NAME="phase6-parallel"
BASE_DIR="/home/user"

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
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 既存セッションをチェック
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo -e "${YELLOW}Session '$SESSION_NAME' already exists.${NC}"
    echo ""
    echo "Options:"
    echo "  1. Attach to existing session: tmux attach -t $SESSION_NAME"
    echo "  2. Kill and recreate: tmux kill-session -t $SESSION_NAME"
    echo ""
    read -p "Attach to existing? (Y/n): " choice
    if [[ "$choice" != "n" ]]; then
        tmux attach -t "$SESSION_NAME"
        exit 0
    else
        tmux kill-session -t "$SESSION_NAME"
    fi
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Starting Phase 6 tmux Session${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 新しいセッションを作成（最初のウィンドウは manager）
tmux new-session -d -s "$SESSION_NAME" -n "manager" -c "$BASE_DIR/quantum-shield"

# manager ウィンドウに情報表示
tmux send-keys -t "$SESSION_NAME:manager" "clear && echo '=== Phase 6 Parallel Development Manager ===' && echo '' && git worktree list && echo '' && echo 'Ctrl+b, 1-6: Switch to system windows' && echo 'Ctrl+b, w: Window list' && echo 'Ctrl+b, d: Detach'" Enter

# 各システム用のウィンドウを作成
for ID in "${!SYSTEMS[@]}"; do
    NAME="${SYSTEMS[$ID]}"
    WORKTREE_DIR="$BASE_DIR/qs-sys${ID}"
    WINDOW_NAME="sys${ID}-${NAME}"

    if [[ -d "$WORKTREE_DIR" ]]; then
        tmux new-window -t "$SESSION_NAME" -n "$WINDOW_NAME" -c "$WORKTREE_DIR"
        # 起動メッセージを表示
        tmux send-keys -t "$SESSION_NAME:$WINDOW_NAME" "clear && echo '=== System ${ID}: ${NAME} ===' && echo '' && echo 'Worktree: $WORKTREE_DIR' && echo 'Branch: $(cd $WORKTREE_DIR && git branch --show-current)' && echo '' && echo 'To start Claude Code:' && echo '  claude' && echo '' && echo 'Then run:' && echo '  /phase6-start ${NAME}'" Enter
        echo -e "  ${GREEN}✓ Window created: $WINDOW_NAME${NC}"
    else
        echo -e "  ${YELLOW}⚠ Skipped (worktree not found): $WORKTREE_DIR${NC}"
    fi
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  tmux Session Ready!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Session: $SESSION_NAME"
echo ""
echo "Commands:"
echo "  Attach:    tmux attach -t $SESSION_NAME"
echo "  Detach:    Ctrl+b, d"
echo "  Windows:   Ctrl+b, w (list) or Ctrl+b, 0-6 (direct)"
echo "  Kill:      tmux kill-session -t $SESSION_NAME"
echo ""

# 自動でアタッチ
read -p "Attach now? (Y/n): " attach
if [[ "$attach" != "n" ]]; then
    tmux attach -t "$SESSION_NAME"
fi
