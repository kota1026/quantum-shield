#!/bin/bash
# AI Prover Agent 起動スクリプト

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   AI Prover Agent - Quantum Shield${NC}"
echo -e "${GREEN}============================================${NC}"

# .envファイルチェック
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: .env file not found${NC}"
    echo -e "${YELLOW}Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}Please edit .env and set your ANTHROPIC_API_KEY${NC}"
    exit 1
fi

# ANTHROPIC_API_KEY チェック
set -a && source .env && set +a
if [ -z "$ANTHROPIC_API_KEY" ] || [ "$ANTHROPIC_API_KEY" = "your-api-key-here" ]; then
    echo -e "${RED}Error: ANTHROPIC_API_KEY is not set in .env${NC}"
    exit 1
fi

# 依存関係インストール
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    pnpm install
fi

# ログディレクトリ作成
mkdir -p logs

# 起動
echo -e "${GREEN}Starting AI Prover Agent...${NC}"
echo -e "Prover ID: ${PROVER_ID}"
echo -e "API URL: ${API_URL}"
echo ""

exec pnpm start
