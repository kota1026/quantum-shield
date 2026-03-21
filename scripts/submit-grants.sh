#!/bin/bash
# =============================================================================
# Quantum Shield — Grant Submission Helper
# =============================================================================
# This script opens all grant application URLs and prepares submission data.
# Run: chmod +x scripts/submit-grants.sh && ./scripts/submit-grants.sh
# =============================================================================

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          Quantum Shield — Grant Submission Helper           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# --------------------------------------------------------------------------
# Step 1: EF Grant
# --------------------------------------------------------------------------
echo -e "${GREEN}[1/4] Ethereum Foundation Grant${NC}"
echo "  URL:    https://esp.ethereum.foundation/applicants"
echo "  Amount: \$200,000 - \$300,000"
echo "  Doc:    docs/pitch/ef-grant-application-v2.md"
echo ""
echo "  Required fields:"
echo "    - Category: Post-Quantum Cryptography / Security Infrastructure"
echo "    - Project Name: Quantum Shield"
echo "    - Abstract: (copy from Section 1 of ef-grant-application-v2.md)"
echo "    - Deliverables: Security audit, mainnet deployment, open-source tooling"
echo "    - Budget: \$250K (min \$200K)"
echo "    - Timeline: 6 months"
echo "    - Team: Solo founder + planned hires"
echo "    - Links: GitHub repo (after public), Sepolia contracts"
echo ""

# --------------------------------------------------------------------------
# Step 2: Arbitrum Foundation Grant
# --------------------------------------------------------------------------
echo -e "${GREEN}[2/4] Arbitrum Foundation Grant${NC}"
echo "  URL:    https://arbitrum.foundation/grants"
echo "  Alt:    https://arbitrum.questbook.app/"
echo "  Amount: \$75,000 - \$150,000"
echo "  Doc:    docs/pitch/arbitrum-grant-application.md"
echo ""
echo "  Key selling point: 12 contracts ALREADY deployed on Arbitrum Sepolia"
echo "  Track: Infrastructure & Tools (or Orbit)"
echo ""

# --------------------------------------------------------------------------
# Step 3: Arbitrum Audit Subsidy
# --------------------------------------------------------------------------
echo -e "${GREEN}[3/4] Arbitrum Audit Subsidy Program${NC}"
echo "  URL:    https://arbitrum.foundation/audit-program"
echo "  Amount: Up to \$100K in audit subsidies"
echo "  Doc:    (use arbitrum-grant-application.md as base)"
echo ""
echo "  This covers smart contract audit costs from pre-approved firms:"
echo "    Trail of Bits, OpenZeppelin, Sigma Prime, etc."
echo ""

# --------------------------------------------------------------------------
# Step 4: Chainlink Grant
# --------------------------------------------------------------------------
echo -e "${GREEN}[4/4] Chainlink Community Grant${NC}"
echo "  URL:    https://chain.link/community/grants"
echo "  Amount: \$50,000 - \$100,000"
echo "  Doc:    (adapt ef-grant-application-v2.md, emphasize VRF v2.5 usage)"
echo ""
echo "  Key selling point: Already integrated Chainlink VRF v2.5 for Prover selection"
echo ""

# --------------------------------------------------------------------------
# Summary
# --------------------------------------------------------------------------
echo "═══════════════════════════════════════════════════════════════"
echo -e "${CYAN}Total potential funding: \$425K - \$750K${NC}"
echo ""
echo "Submission docs location: docs/pitch/"
echo ""
echo "Files to copy-paste from:"
echo "  1. docs/pitch/ef-grant-application-v2.md"
echo "  2. docs/pitch/arbitrum-grant-application.md"
echo "  3. docs/pitch/ethresearch-quadratic-slashing.md"
echo ""
echo -e "${YELLOW}IMPORTANT: Replace all [Your Name], [your-email] placeholders${NC}"
echo -e "${YELLOW}before submitting!${NC}"
echo ""

# Try to open URLs (works on macOS and Linux with xdg-open)
if command -v xdg-open &> /dev/null; then
    read -p "Open all URLs in browser? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open "https://esp.ethereum.foundation/applicants" 2>/dev/null &
        xdg-open "https://arbitrum.foundation/grants" 2>/dev/null &
        xdg-open "https://chain.link/community/grants" 2>/dev/null &
        echo "Opened 3 URLs in browser."
    fi
elif command -v open &> /dev/null; then
    read -p "Open all URLs in browser? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "https://esp.ethereum.foundation/applicants"
        open "https://arbitrum.foundation/grants"
        open "https://chain.link/community/grants"
        echo "Opened 3 URLs in browser."
    fi
fi
