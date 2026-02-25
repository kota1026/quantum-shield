#!/bin/bash
# =============================================================================
# Quantum Shield - Week 8 Test Suite Runner
# =============================================================================
# Runs all Week 8 tests: TEST-021, TEST-022, INFRA-002 validation
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Results tracking
declare -A TEST_RESULTS

# =============================================================================
# Run Individual Test Suite
# =============================================================================
run_test_suite() {
    local name=$1
    local script=$2
    
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  Running: $name${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if [ -f "$script" ]; then
        chmod +x "$script"
        if bash "$script"; then
            TEST_RESULTS[$name]="PASS"
            echo -e "${GREEN}✅ $name: PASSED${NC}"
        else
            TEST_RESULTS[$name]="FAIL"
            echo -e "${RED}❌ $name: FAILED${NC}"
        fi
    else
        TEST_RESULTS[$name]="SKIP"
        echo -e "${YELLOW}⚠️ $name: SKIPPED (script not found)${NC}"
    fi
}

# =============================================================================
# Run Solidity Tests
# =============================================================================
run_solidity_tests() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  Running: Solidity Deployment Tests${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    cd contracts
    
    # Run specific test file
    if forge test --match-path "test/DeploymentVerificationTest.t.sol" -vv 2>&1 | tee /tmp/sol_test.log; then
        TEST_RESULTS["Solidity-Deployment"]="PASS"
        echo -e "${GREEN}✅ Solidity Deployment Tests: PASSED${NC}"
    else
        TEST_RESULTS["Solidity-Deployment"]="FAIL"
        echo -e "${RED}❌ Solidity Deployment Tests: FAILED${NC}"
    fi
    
    cd ..
}

# =============================================================================
# Run Full Test Suite
# =============================================================================
run_full_test_suite() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  Running: Full Solidity Test Suite${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    cd contracts
    
    if forge test -vv 2>&1 | tee /tmp/full_test.log; then
        # Extract test counts
        PASS_COUNT=$(grep -oP '\d+(?= passed)' /tmp/full_test.log | tail -1 || echo "0")
        FAIL_COUNT=$(grep -oP '\d+(?= failed)' /tmp/full_test.log | tail -1 || echo "0")
        
        echo ""
        echo "Test Results: $PASS_COUNT passed, $FAIL_COUNT failed"
        
        if [ "$FAIL_COUNT" -eq 0 ]; then
            TEST_RESULTS["Full-Suite"]="PASS ($PASS_COUNT tests)"
            echo -e "${GREEN}✅ Full Test Suite: PASSED${NC}"
        else
            TEST_RESULTS["Full-Suite"]="FAIL ($FAIL_COUNT failures)"
            echo -e "${RED}❌ Full Test Suite: FAILED${NC}"
        fi
    else
        TEST_RESULTS["Full-Suite"]="FAIL"
        echo -e "${RED}❌ Full Test Suite: FAILED${NC}"
    fi
    
    cd ..
}

# =============================================================================
# Generate Report
# =============================================================================
generate_report() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  Week 8 Test Summary Report${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    local pass_count=0
    local fail_count=0
    local skip_count=0
    
    printf "%-30s %s\n" "Test Suite" "Result"
    printf "%-30s %s\n" "────────────────────────────" "──────────"
    
    for test in "${!TEST_RESULTS[@]}"; do
        result="${TEST_RESULTS[$test]}"
        if [[ "$result" == PASS* ]]; then
            printf "%-30s ${GREEN}%s${NC}\n" "$test" "$result"
            ((pass_count++))
        elif [[ "$result" == FAIL* ]]; then
            printf "%-30s ${RED}%s${NC}\n" "$test" "$result"
            ((fail_count++))
        else
            printf "%-30s ${YELLOW}%s${NC}\n" "$test" "$result"
            ((skip_count++))
        fi
    done
    
    echo ""
    printf "%-30s %s\n" "────────────────────────────" "──────────"
    echo -e "Passed:  ${GREEN}$pass_count${NC}"
    echo -e "Failed:  ${RED}$fail_count${NC}"
    echo -e "Skipped: ${YELLOW}$skip_count${NC}"
    echo ""
    
    # Generate JSON report
    cat > /tmp/week8_test_report.json << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "week": 8,
  "phase": "2.2",
  "summary": {
    "passed": $pass_count,
    "failed": $fail_count,
    "skipped": $skip_count
  },
  "results": {
EOF
    
    local first=true
    for test in "${!TEST_RESULTS[@]}"; do
        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> /tmp/week8_test_report.json
        fi
        echo -n "    \"$test\": \"${TEST_RESULTS[$test]}\"" >> /tmp/week8_test_report.json
    done
    
    cat >> /tmp/week8_test_report.json << EOF

  }
}
EOF
    
    echo "Report saved to: /tmp/week8_test_report.json"
    
    # Final verdict
    echo ""
    if [ "$fail_count" -eq 0 ]; then
        echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
        echo -e "${GREEN}  ✅ WEEK 8 TESTS: ALL PASSED${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
        return 0
    else
        echo -e "${RED}═══════════════════════════════════════════════${NC}"
        echo -e "${RED}  ❌ WEEK 8 TESTS: $fail_count FAILED${NC}"
        echo -e "${RED}═══════════════════════════════════════════════${NC}"
        return 1
    fi
}

# =============================================================================
# Main
# =============================================================================
main() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     Quantum Shield - Week 8 Test Runner       ║${NC}"
    echo -e "${BLUE}║     Phase 2.2 Infrastructure Tests            ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════╝${NC}"
    
    # Navigate to project root
    SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
    cd "$SCRIPT_DIR"
    
    # Find project root
    while [ ! -f "contracts/foundry.toml" ] && [ "$(pwd)" != "/" ]; do
        cd ..
    done
    
    if [ ! -f "contracts/foundry.toml" ]; then
        echo "Error: Could not find project root"
        exit 1
    fi
    
    PROJECT_ROOT="$(pwd)"
    echo ""
    echo "Project root: $PROJECT_ROOT"
    echo "Test scripts: $SCRIPT_DIR"
    
    # Run test suites
    run_test_suite "TEST-021 Deployment" "$SCRIPT_DIR/test_deploy.sh"
    run_test_suite "TEST-022 Multi-Network" "$SCRIPT_DIR/test_multinetwork.sh"
    run_test_suite "INFRA-002 CI/CD" "$SCRIPT_DIR/test_cicd.sh"
    
    # Run Solidity tests if test file exists
    if [ -f "contracts/test/DeploymentVerificationTest.t.sol" ]; then
        run_solidity_tests
    fi
    
    # Run full test suite
    run_full_test_suite
    
    # Generate and display report
    generate_report
}

main "$@"
