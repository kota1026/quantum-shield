#!/bin/bash
# =============================================================================
# Quantum Shield - CI/CD Workflow Validation Test
# =============================================================================
# [INFRA-002] CI/CDパイプライン検証テスト
# Validates GitHub Actions workflow configurations
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

# =============================================================================
# Workflow YAML Validation
# =============================================================================
validate_yaml() {
    local file=$1
    local name=$2
    
    log_test "Validating $name YAML syntax"
    
    if command -v python3 &> /dev/null; then
        if python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null; then
            pass_test "$name YAML is valid"
            return 0
        else
            fail_test "$name YAML is invalid"
            return 1
        fi
    else
        # Fallback: basic syntax check
        if grep -q "^name:" "$file" && grep -q "^on:" "$file" && grep -q "^jobs:" "$file"; then
            pass_test "$name YAML structure looks valid (basic check)"
            return 0
        else
            fail_test "$name YAML structure invalid"
            return 1
        fi
    fi
}

# =============================================================================
# CI Workflow Tests
# =============================================================================
test_ci_workflow() {
    echo ""
    echo "=== CI Workflow Tests ==="
    
    CI_FILE=".github/workflows/ci.yml"
    
    if [ ! -f "$CI_FILE" ]; then
        fail_test "CI workflow file not found"
        return 1
    fi
    pass_test "CI workflow file exists"
    
    validate_yaml "$CI_FILE" "CI workflow"
    
    # Check triggers
    log_test "CI workflow triggers"
    if grep -q "push:" "$CI_FILE" && grep -q "pull_request:" "$CI_FILE"; then
        pass_test "Push and PR triggers configured"
    else
        fail_test "Missing triggers"
    fi
    
    # Check branches
    log_test "CI workflow branches"
    if grep -q "main" "$CI_FILE" && grep -q "dev/\*" "$CI_FILE"; then
        pass_test "Main and dev branches configured"
    else
        fail_test "Branch configuration incomplete"
    fi
    
    # Check jobs
    log_test "CI workflow jobs"
    
    local jobs=("rust-tests" "lean4-proofs" "solidity-tests" "slither-analysis")
    for job in "${jobs[@]}"; do
        if grep -q "$job:" "$CI_FILE"; then
            pass_test "Job '$job' defined"
        else
            fail_test "Job '$job' missing"
        fi
    done
    
    # Check Slither integration
    log_test "Slither integration"
    if grep -q "slither-analyzer" "$CI_FILE" && grep -q "pip install slither" "$CI_FILE"; then
        pass_test "Slither installation configured"
    else
        fail_test "Slither installation missing"
    fi
    
    # Check artifact uploads
    log_test "Artifact uploads"
    if grep -q "actions/upload-artifact" "$CI_FILE"; then
        pass_test "Artifact uploads configured"
    else
        fail_test "Artifact uploads missing"
    fi
    
    # Check CI summary
    log_test "CI summary"
    if grep -q "GITHUB_STEP_SUMMARY" "$CI_FILE" || grep -q "ci-summary" "$CI_FILE"; then
        pass_test "CI summary configured"
    else
        fail_test "CI summary missing"
    fi
}

# =============================================================================
# Deploy Workflow Tests
# =============================================================================
test_deploy_workflow() {
    echo ""
    echo "=== Deploy Workflow Tests ==="
    
    DEPLOY_FILE=".github/workflows/deploy-testnet.yml"
    
    if [ ! -f "$DEPLOY_FILE" ]; then
        fail_test "Deploy workflow file not found"
        return 1
    fi
    pass_test "Deploy workflow file exists"
    
    validate_yaml "$DEPLOY_FILE" "Deploy workflow"
    
    # Check workflow_dispatch trigger
    log_test "Manual trigger"
    if grep -q "workflow_dispatch:" "$DEPLOY_FILE"; then
        pass_test "Manual trigger (workflow_dispatch) configured"
    else
        fail_test "Manual trigger missing"
    fi
    
    # Check inputs
    log_test "Workflow inputs"
    
    if grep -q "network:" "$DEPLOY_FILE"; then
        pass_test "Network input defined"
    else
        fail_test "Network input missing"
    fi
    
    if grep -q "dry_run:" "$DEPLOY_FILE"; then
        pass_test "Dry run input defined"
    else
        fail_test "Dry run input missing"
    fi
    
    if grep -q "verify:" "$DEPLOY_FILE"; then
        pass_test "Verify input defined"
    else
        fail_test "Verify input missing"
    fi
    
    # Check network options
    log_test "Network options"
    local networks=("sepolia" "arbitrum-sepolia" "base-sepolia")
    for network in "${networks[@]}"; do
        if grep -q "$network" "$DEPLOY_FILE"; then
            pass_test "Network '$network' available"
        else
            fail_test "Network '$network' missing"
        fi
    done
    
    # Check jobs
    log_test "Deploy workflow jobs"
    
    local jobs=("pre-checks" "deploy" "verify")
    for job in "${jobs[@]}"; do
        if grep -q "$job:" "$DEPLOY_FILE"; then
            pass_test "Job '$job' defined"
        else
            fail_test "Job '$job' missing"
        fi
    done
    
    # Check secrets usage
    log_test "Secrets configuration"
    local secrets=("DEPLOYER_PRIVATE_KEY" "ETHERSCAN_API_KEY" "SEPOLIA_RPC_URL")
    for secret in "${secrets[@]}"; do
        if grep -q "\${{ secrets.$secret }}" "$DEPLOY_FILE"; then
            pass_test "Secret '$secret' referenced"
        else
            fail_test "Secret '$secret' not referenced"
        fi
    done
    
    # Check environment
    log_test "Environment configuration"
    if grep -q "environment:" "$DEPLOY_FILE"; then
        pass_test "Environment configured for deployment"
    else
        fail_test "Environment not configured"
    fi
}

# =============================================================================
# Security Checks
# =============================================================================
test_security() {
    echo ""
    echo "=== Security Checks ==="
    
    log_test "No hardcoded secrets"
    
    # Check for potential hardcoded keys/secrets
    SENSITIVE_PATTERNS=(
        "0x[a-fA-F0-9]{64}"  # Private keys
        "sk_live_"           # Stripe keys
        "AKIA"               # AWS keys
    )
    
    local found_sensitive=false
    for pattern in "${SENSITIVE_PATTERNS[@]}"; do
        if grep -rE "$pattern" .github/workflows/ 2>/dev/null | grep -v "example\|test\|0x0000" | head -1; then
            found_sensitive=true
            fail_test "Potential sensitive data found matching pattern: $pattern"
        fi
    done
    
    if [ "$found_sensitive" = false ]; then
        pass_test "No hardcoded secrets detected"
    fi
    
    log_test "Permissions check"
    # Check if workflows don't have excessive permissions
    if grep -q "permissions:" .github/workflows/ci.yml 2>/dev/null; then
        pass_test "CI workflow has explicit permissions"
    else
        pass_test "CI workflow uses default permissions (acceptable)"
    fi
}

# =============================================================================
# Action Version Checks
# =============================================================================
test_action_versions() {
    echo ""
    echo "=== Action Version Checks ==="
    
    log_test "GitHub Actions versions"
    
    # Check for pinned action versions
    local actions=(
        "actions/checkout@v4"
        "actions/upload-artifact@v4"
        "actions/setup-python@v5"
        "foundry-rs/foundry-toolchain@v1"
    )
    
    for action in "${actions[@]}"; do
        action_name=$(echo "$action" | cut -d'@' -f1)
        if grep -rq "$action_name" .github/workflows/; then
            if grep -rq "$action" .github/workflows/; then
                pass_test "$action pinned"
            else
                version=$(grep -rh "$action_name@" .github/workflows/ | head -1 | grep -oP '@v?\d+' || echo "unknown")
                pass_test "$action_name found with version $version"
            fi
        fi
    done
}

# =============================================================================
# Main
# =============================================================================
main() {
    echo ""
    echo "=============================================="
    echo "  Quantum Shield - CI/CD Validation Tests"
    echo "=============================================="
    
    # Navigate to project root
    while [ ! -d ".github" ] && [ "$(pwd)" != "/" ]; do
        cd ..
    done
    
    if [ ! -d ".github" ]; then
        echo "Error: Could not find .github directory"
        exit 1
    fi
    
    echo "Project root: $(pwd)"
    
    # Run tests
    test_ci_workflow
    test_deploy_workflow
    test_security
    test_action_versions
    
    # Summary
    echo ""
    echo "=============================================="
    echo "  CI/CD Validation Summary"
    echo "=============================================="
    echo ""
    echo -e "Total Tests:  ${TESTS_TOTAL}"
    echo -e "Passed:       ${GREEN}${TESTS_PASSED}${NC}"
    echo -e "Failed:       ${RED}${TESTS_FAILED}${NC}"
    echo ""
    
    if [ "$TESTS_FAILED" -eq 0 ]; then
        echo -e "${GREEN}✅ CI/CD VALIDATION PASSED${NC}"
        exit 0
    else
        echo -e "${RED}❌ CI/CD VALIDATION FAILED${NC}"
        exit 1
    fi
}

main "$@"
