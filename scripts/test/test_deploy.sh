#!/bin/bash
# =============================================================================
# Quantum Shield - Testnet Deployment Test Script
# =============================================================================
# [TEST-021] テストネットデプロイテスト
# Tests deployment to Sepolia and verifies contract functionality
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# =============================================================================
# Test Utilities
# =============================================================================
log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
    ((TESTS_TOTAL++))
}

pass_test() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

fail_test() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

skip_test() {
    echo -e "${YELLOW}[SKIP]${NC} $1"
}

# =============================================================================
# TEST-021-01: Environment Configuration Test
# =============================================================================
test_environment_config() {
    log_test "TEST-021-01: Environment Configuration"
    
    # Check if foundry.toml exists
    if [ -f "contracts/foundry.toml" ]; then
        pass_test "foundry.toml exists"
    else
        fail_test "foundry.toml not found"
        return 1
    fi
    
    # Check RPC endpoints configuration
    if grep -q "sepolia" contracts/foundry.toml; then
        pass_test "Sepolia RPC configured in foundry.toml"
    else
        fail_test "Sepolia RPC not configured"
    fi
    
    if grep -q "arbitrum_sepolia" contracts/foundry.toml; then
        pass_test "Arbitrum Sepolia RPC configured"
    else
        fail_test "Arbitrum Sepolia RPC not configured"
    fi
    
    if grep -q "base_sepolia" contracts/foundry.toml; then
        pass_test "Base Sepolia RPC configured"
    else
        fail_test "Base Sepolia RPC not configured"
    fi
    
    # Check Etherscan configuration
    if grep -q "\[etherscan\]" contracts/foundry.toml; then
        pass_test "Etherscan verification configured"
    else
        fail_test "Etherscan verification not configured"
    fi
}

# =============================================================================
# TEST-021-02: Deploy Script Validation
# =============================================================================
test_deploy_script() {
    log_test "TEST-021-02: Deploy Script Validation"
    
    DEPLOY_SCRIPT="scripts/deploy/sepolia/deploy.sh"
    
    # Check script exists
    if [ -f "$DEPLOY_SCRIPT" ]; then
        pass_test "Deploy script exists"
    else
        fail_test "Deploy script not found at $DEPLOY_SCRIPT"
        return 1
    fi
    
    # Check script is executable
    if [ -x "$DEPLOY_SCRIPT" ]; then
        pass_test "Deploy script is executable"
    else
        fail_test "Deploy script is not executable"
    fi
    
    # Check for required functions/sections
    if grep -q "configure_network" "$DEPLOY_SCRIPT"; then
        pass_test "Network configuration function present"
    else
        fail_test "Network configuration function missing"
    fi
    
    if grep -q "validate_environment" "$DEPLOY_SCRIPT"; then
        pass_test "Environment validation function present"
    else
        fail_test "Environment validation function missing"
    fi
    
    if grep -q "DRY_RUN" "$DEPLOY_SCRIPT"; then
        pass_test "Dry run mode supported"
    else
        fail_test "Dry run mode not supported"
    fi
    
    # Check for multi-network support
    if grep -q "arbitrum-sepolia\|arbitrum_sepolia" "$DEPLOY_SCRIPT"; then
        pass_test "Arbitrum Sepolia support"
    else
        fail_test "Arbitrum Sepolia not supported"
    fi
    
    if grep -q "base-sepolia\|base_sepolia" "$DEPLOY_SCRIPT"; then
        pass_test "Base Sepolia support"
    else
        fail_test "Base Sepolia not supported"
    fi
}

# =============================================================================
# TEST-021-03: .env.example Validation
# =============================================================================
test_env_example() {
    log_test "TEST-021-03: .env.example Validation"
    
    ENV_FILE="scripts/deploy/sepolia/.env.example"
    
    if [ -f "$ENV_FILE" ]; then
        pass_test ".env.example exists"
    else
        fail_test ".env.example not found"
        return 1
    fi
    
    # Check required variables
    REQUIRED_VARS=(
        "SEPOLIA_RPC_URL"
        "DEPLOYER_PRIVATE_KEY"
        "ETHERSCAN_API_KEY"
        "ARBISCAN_API_KEY"
        "BASESCAN_API_KEY"
        "VRF_COORDINATOR"
        "VRF_KEY_HASH"
    )
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "$var" "$ENV_FILE"; then
            pass_test "$var documented"
        else
            fail_test "$var not documented in .env.example"
        fi
    done
}

# =============================================================================
# TEST-021-04: Contract Compilation Test
# =============================================================================
test_contract_compilation() {
    log_test "TEST-021-04: Contract Compilation"
    
    cd contracts
    
    # Clean build
    echo "  Building contracts..."
    if forge build --force 2>&1 | tee /tmp/forge_build.log; then
        pass_test "Contracts compile successfully"
    else
        fail_test "Contract compilation failed"
        cat /tmp/forge_build.log
        cd ..
        return 1
    fi
    
    # Check specific contracts exist
    REQUIRED_CONTRACTS=(
        "out/AIRConstraints.sol/AIRConstraints.json"
        "out/ConstraintEvaluator.sol/ConstraintEvaluator.json"
        "out/L1Vault.sol/L1Vault.json"
    )
    
    for contract in "${REQUIRED_CONTRACTS[@]}"; do
        if [ -f "$contract" ]; then
            pass_test "$(basename $contract .json) compiled"
        else
            fail_test "$(basename $contract .json) not found"
        fi
    done
    
    cd ..
}

# =============================================================================
# TEST-021-05: Dry Run Deployment Test
# =============================================================================
test_dry_run_deployment() {
    log_test "TEST-021-05: Dry Run Deployment"
    
    # Set minimal environment for dry run
    export SEPOLIA_RPC_URL="https://rpc.sepolia.org"
    export DEPLOYER_PRIVATE_KEY="0x0000000000000000000000000000000000000000000000000000000000000001"
    
    cd scripts/deploy/sepolia
    
    # Run dry run
    echo "  Running dry run deployment..."
    if bash deploy.sh sepolia true 2>&1 | tee /tmp/dry_run.log; then
        if grep -q "Dry run complete" /tmp/dry_run.log || grep -q "DRY RUN" /tmp/dry_run.log; then
            pass_test "Dry run completed successfully"
        else
            fail_test "Dry run did not complete properly"
        fi
    else
        fail_test "Dry run script failed"
    fi
    
    cd ../../..
}

# =============================================================================
# TEST-021-06: GitHub Actions Workflow Validation
# =============================================================================
test_github_workflows() {
    log_test "TEST-021-06: GitHub Actions Workflows"
    
    # Check CI workflow
    CI_WORKFLOW=".github/workflows/ci.yml"
    if [ -f "$CI_WORKFLOW" ]; then
        pass_test "CI workflow exists"
        
        if grep -q "slither" "$CI_WORKFLOW"; then
            pass_test "Slither integration in CI"
        else
            fail_test "Slither not integrated in CI"
        fi
        
        if grep -q "forge test" "$CI_WORKFLOW"; then
            pass_test "Forge tests in CI"
        else
            fail_test "Forge tests not in CI"
        fi
    else
        fail_test "CI workflow not found"
    fi
    
    # Check deploy workflow
    DEPLOY_WORKFLOW=".github/workflows/deploy-testnet.yml"
    if [ -f "$DEPLOY_WORKFLOW" ]; then
        pass_test "Deploy workflow exists"
        
        if grep -q "workflow_dispatch" "$DEPLOY_WORKFLOW"; then
            pass_test "Manual trigger supported"
        else
            fail_test "Manual trigger not configured"
        fi
        
        if grep -q "dry_run" "$DEPLOY_WORKFLOW"; then
            pass_test "Dry run option available"
        else
            fail_test "Dry run option not available"
        fi
        
        if grep -q "sepolia" "$DEPLOY_WORKFLOW" && \
           grep -q "arbitrum-sepolia" "$DEPLOY_WORKFLOW" && \
           grep -q "base-sepolia" "$DEPLOY_WORKFLOW"; then
            pass_test "All networks configured in workflow"
        else
            fail_test "Not all networks configured"
        fi
    else
        fail_test "Deploy workflow not found"
    fi
}

# =============================================================================
# TEST-021-07: Existing Test Suite Regression
# =============================================================================
test_regression() {
    log_test "TEST-021-07: Test Suite Regression"
    
    cd contracts
    
    echo "  Running test suite..."
    if forge test -vv 2>&1 | tee /tmp/forge_test.log; then
        # Extract test count
        PASS_COUNT=$(grep -oP '\d+(?= passed)' /tmp/forge_test.log | tail -1 || echo "0")
        FAIL_COUNT=$(grep -oP '\d+(?= failed)' /tmp/forge_test.log | tail -1 || echo "0")
        
        echo "  Tests passed: $PASS_COUNT"
        echo "  Tests failed: $FAIL_COUNT"
        
        if [ "$FAIL_COUNT" -eq 0 ]; then
            pass_test "All $PASS_COUNT tests passed"
        else
            fail_test "$FAIL_COUNT tests failed"
        fi
        
        # Verify minimum test count (656 expected)
        if [ "$PASS_COUNT" -ge 650 ]; then
            pass_test "Test count meets minimum (>= 650)"
        else
            fail_test "Test count below minimum: $PASS_COUNT < 650"
        fi
    else
        fail_test "Test suite execution failed"
    fi
    
    cd ..
}

# =============================================================================
# Main Test Execution
# =============================================================================
main() {
    echo ""
    echo "=============================================="
    echo "  Quantum Shield - TEST-021 Deployment Tests"
    echo "=============================================="
    echo ""
    
    # Navigate to project root
    cd "$(dirname "$0")/../../.."
    
    # Run all tests
    test_environment_config
    echo ""
    test_deploy_script
    echo ""
    test_env_example
    echo ""
    test_contract_compilation
    echo ""
    test_dry_run_deployment
    echo ""
    test_github_workflows
    echo ""
    test_regression
    
    # Summary
    echo ""
    echo "=============================================="
    echo "  TEST-021 Summary"
    echo "=============================================="
    echo ""
    echo -e "Total Tests:  ${TESTS_TOTAL}"
    echo -e "Passed:       ${GREEN}${TESTS_PASSED}${NC}"
    echo -e "Failed:       ${RED}${TESTS_FAILED}${NC}"
    echo ""
    
    if [ "$TESTS_FAILED" -eq 0 ]; then
        echo -e "${GREEN}✅ TEST-021 PASSED${NC}"
        exit 0
    else
        echo -e "${RED}❌ TEST-021 FAILED${NC}"
        exit 1
    fi
}

main "$@"
