#!/bin/bash
# =============================================================================
# Project Aegis - Workflow Automation Script
# =============================================================================
# 
# Usage:
#   ./aegis.sh [command]
#
# Commands:
#   plan    - ① 状態確認・計画立案
#   spec    - ② 仕様確認（実装前）
#   impl    - ③ 実装 + テスト（TDD）
#   review  - ④ セキュリティレビュー
#   pir     - ⑤ PIR会議
#   update  - ⑥ 状態更新
#   gonogo  - ⑦ Go/No-Go会議
#   all     - ①〜④を順番に表示
#   help    - ヘルプ表示
#
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROMPTS_DIR="$SCRIPT_DIR/prompts"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# =============================================================================
# Functions
# =============================================================================

print_header() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${GREEN}Project Aegis - SYSTEM BOOTLOADER${NC}                           ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${YELLOW}$1${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_prompt() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}以下のプロンプトをClaude Codeに貼り付けてください：${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    cat "$1"
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

copy_to_clipboard() {
    if command -v pbcopy &> /dev/null; then
        cat "$1" | pbcopy
        echo -e "${GREEN}✓ クリップボードにコピーしました（macOS）${NC}"
    elif command -v xclip &> /dev/null; then
        cat "$1" | xclip -selection clipboard
        echo -e "${GREEN}✓ クリップボードにコピーしました（Linux）${NC}"
    else
        echo -e "${YELLOW}⚠ クリップボードへのコピーは手動で行ってください${NC}"
    fi
}

show_help() {
    echo "Usage: ./aegis.sh [command]"
    echo ""
    echo "Commands:"
    echo "  plan    - ① 状態確認・計画立案"
    echo "  spec    - ② 仕様確認（実装前）"
    echo "  impl    - ③ 実装 + テスト（TDD）"
    echo "  review  - ④ セキュリティレビュー"
    echo "  pir     - ⑤ PIR会議"
    echo "  update  - ⑥ 状態更新"
    echo "  gonogo  - ⑦ Go/No-Go会議"
    echo "  all     - ①〜④を順番に表示"
    echo "  help    - このヘルプを表示"
    echo ""
    echo "Example:"
    echo "  ./aegis.sh plan   # 計画立案プロンプトを表示"
}

# =============================================================================
# Main
# =============================================================================

case "${1:-help}" in
    plan)
        print_header "① 状態確認・計画立案"
        print_prompt "$PROMPTS_DIR/01_plan.md"
        copy_to_clipboard "$PROMPTS_DIR/01_plan.md"
        ;;
    spec)
        print_header "② 仕様確認（実装前）"
        print_prompt "$PROMPTS_DIR/02_spec.md"
        copy_to_clipboard "$PROMPTS_DIR/02_spec.md"
        ;;
    impl)
        print_header "③ 実装 + テスト（TDD）"
        print_prompt "$PROMPTS_DIR/03_impl.md"
        copy_to_clipboard "$PROMPTS_DIR/03_impl.md"
        ;;
    review)
        print_header "④ セキュリティレビュー"
        print_prompt "$PROMPTS_DIR/04_review.md"
        copy_to_clipboard "$PROMPTS_DIR/04_review.md"
        ;;
    pir)
        print_header "⑤ PIR会議"
        print_prompt "$PROMPTS_DIR/05_pir.md"
        copy_to_clipboard "$PROMPTS_DIR/05_pir.md"
        ;;
    update)
        print_header "⑥ 状態更新"
        print_prompt "$PROMPTS_DIR/06_update.md"
        copy_to_clipboard "$PROMPTS_DIR/06_update.md"
        ;;
    gonogo)
        print_header "⑦ Go/No-Go会議"
        print_prompt "$PROMPTS_DIR/07_gonogo.md"
        copy_to_clipboard "$PROMPTS_DIR/07_gonogo.md"
        ;;
    all)
        echo -e "${YELLOW}①〜④を順番に実行します。各ステップでEnterを押してください。${NC}"
        echo ""
        
        print_header "① 状態確認・計画立案"
        print_prompt "$PROMPTS_DIR/01_plan.md"
        copy_to_clipboard "$PROMPTS_DIR/01_plan.md"
        read -p "Enterで次へ..."
        
        print_header "② 仕様確認（実装前）"
        print_prompt "$PROMPTS_DIR/02_spec.md"
        copy_to_clipboard "$PROMPTS_DIR/02_spec.md"
        read -p "Enterで次へ..."
        
        print_header "③ 実装 + テスト（TDD）"
        print_prompt "$PROMPTS_DIR/03_impl.md"
        copy_to_clipboard "$PROMPTS_DIR/03_impl.md"
        read -p "Enterで次へ..."
        
        print_header "④ セキュリティレビュー"
        print_prompt "$PROMPTS_DIR/04_review.md"
        copy_to_clipboard "$PROMPTS_DIR/04_review.md"
        
        echo ""
        echo -e "${GREEN}✓ 全ステップ完了${NC}"
        ;;
    help|*)
        show_help
        ;;
esac
