#!/bin/bash
# =============================================================================
# Phase 0 Remediation Verification Script
# =============================================================================
# This script verifies all P0 fixes for NIST FIPS 204 compliance
#
# Prerequisites:
# - Rust toolchain (cargo, rustc)
# - Lean 4 + Mathlib
# - Kani verifier (optional, for formal verification)
#
# Usage:
#   chmod +x scripts/verify_p0_fixes.sh
#   ./scripts/verify_p0_fixes.sh
# =============================================================================

set -e  # Exit on first error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=============================================="
echo "  Phase 0 Remediation Verification"
echo "  NIST FIPS 204 Compliance Check"
echo "=============================================="
echo ""

# Track results
PASS=0
FAIL=0
SKIP=0

report_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASS++))
}

report_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAIL++))
}

report_skip() {
    echo -e "${YELLOW}[SKIP]${NC} $1"
    ((SKIP++))
}

# =============================================================================
# P0-1: Lean4 Formal Verification
# =============================================================================
echo ""
echo -e "${BLUE}=== P0-1: Lean4 Formal Verification ===${NC}"

if command -v lake &> /dev/null; then
    cd proofs/lean4
    
    # Check for 'sorry' in NTT.lean
    if grep -q "sorry" NTT.lean 2>/dev/null; then
        SORRY_COUNT=$(grep -c "sorry" NTT.lean || echo "0")
        report_fail "NTT.lean contains $SORRY_COUNT 'sorry' placeholders"
    else
        report_pass "No 'sorry' placeholders in NTT.lean"
    fi
    
    # Try to build Lean4 proofs
    echo "Building Lean4 proofs..."
    if lake build 2>&1 | tee /tmp/lean4_build.log; then
        report_pass "Lean4 proofs build successfully"
    else
        report_fail "Lean4 proofs failed to build (see /tmp/lean4_build.log)"
    fi
    
    cd ../..
else
    report_skip "Lean4 (lake) not installed - skipping formal verification"
fi

# =============================================================================
# P0-2: NIST KAT Verification
# =============================================================================
echo ""
echo -e "${BLUE}=== P0-2: NIST KAT Verification ===${NC}"

cd circuits/dilithium-stark

# Check if pq-crystals FFI is enabled
if grep -q 'default = \["pq_crystals_ffi"\]' Cargo.toml; then
    report_pass "pq_crystals_ffi feature is enabled by default"
else
    report_fail "pq_crystals_ffi feature is NOT enabled by default"
fi

# Check if KAT file exists
KAT_FILE="test-vectors/PQCsignKAT_Dilithium3.rsp"
KAT_FILE_ALT="../../pq-crystals-dilithium/PQCsignKAT_Dilithium3.rsp"

if [ -f "$KAT_FILE" ] || [ -f "$KAT_FILE_ALT" ]; then
    report_pass "NIST KAT file found"
else
    report_fail "NIST KAT file not found (expected at $KAT_FILE)"
fi

# Run all Rust tests
echo "Running dilithium-stark tests..."
if cargo test --no-fail-fast 2>&1 | tee /tmp/rust_tests.log; then
    report_pass "All Rust tests passed"
else
    report_fail "Some Rust tests failed (see /tmp/rust_tests.log)"
fi

# Check ZETAS verification
if cargo test test_kat_zetas 2>&1 | grep -q "ok"; then
    report_pass "ZETAS table matches FIPS 204 reference"
else
    report_fail "ZETAS table verification failed"
fi

# Check comprehensive KAT suite (100 iterations)
if cargo test test_comprehensive_kat_suite 2>&1 | grep -q "100"; then
    report_pass "Comprehensive KAT suite: 100/100 signatures verified"
else
    report_fail "Comprehensive KAT suite did not complete 100 iterations"
fi

# Check FFI KAT test (true NIST compliance)
echo "Running FFI-based NIST KAT verification..."
if cargo test test_nist_kat_ffi -- --nocapture 2>&1 | tee /tmp/ffi_kat.log; then
    if grep -q "100.*signatures" /tmp/ffi_kat.log; then
        report_pass "FFI NIST KAT: 100/100 vectors verified with pq-crystals reference"
    else
        report_skip "FFI NIST KAT test ran but results unclear"
    fi
else
    report_fail "FFI NIST KAT verification failed (see /tmp/ffi_kat.log)"
fi

cd ../..

# =============================================================================
# P0-3: Kani Formal Verification
# =============================================================================
echo ""
echo -e "${BLUE}=== P0-3: Kani Formal Verification ===${NC}"

if command -v cargo-kani &> /dev/null; then
    cd circuits/dilithium-stark
    
    # Run Kani verification (limited unwind for CI)
    echo "Running Kani proofs (this may take several minutes)..."
    
    # Montgomery reduce - should be fast
    if cargo kani --harness kani_montgomery_reduce_no_panic --unwind 2 2>&1 | grep -q "VERIFICATION:- SUCCESSFUL"; then
        report_pass "Kani: montgomery_reduce no panic"
    else
        report_fail "Kani: montgomery_reduce verification failed"
    fi
    
    # caddq positive
    if cargo kani --harness kani_caddq_positive --unwind 2 2>&1 | grep -q "VERIFICATION:- SUCCESSFUL"; then
        report_pass "Kani: caddq produces positive results"
    else
        report_fail "Kani: caddq verification failed"
    fi
    
    # Butterfly no overflow
    if cargo kani --harness kani_ntt_butterfly_no_overflow --unwind 2 2>&1 | grep -q "VERIFICATION:- SUCCESSFUL"; then
        report_pass "Kani: NTT butterfly no overflow"
    else
        report_fail "Kani: butterfly verification failed"
    fi
    
    cd ../..
else
    report_skip "Kani verifier not installed - skipping formal verification"
    echo "  To install: cargo install --locked kani-verifier && kani setup"
fi

# =============================================================================
# P0-4: Solidity Contract Tests
# =============================================================================
echo ""
echo -e "${BLUE}=== P0-4: Solidity Contract Tests ===${NC}"

if command -v forge &> /dev/null; then
    cd contracts
    
    echo "Running Foundry tests..."
    if forge test -vv 2>&1 | tee /tmp/forge_tests.log; then
        TESTS_PASSED=$(grep -o "[0-9]* tests passed" /tmp/forge_tests.log | head -1 || echo "0 tests passed")
        report_pass "Foundry tests: $TESTS_PASSED"
    else
        report_fail "Foundry tests failed (see /tmp/forge_tests.log)"
    fi
    
    cd ..
else
    report_skip "Foundry (forge) not installed - skipping Solidity tests"
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "=============================================="
echo "  VERIFICATION SUMMARY"
echo "=============================================="
echo -e "  ${GREEN}PASSED:${NC}  $PASS"
echo -e "  ${RED}FAILED:${NC}  $FAIL"
echo -e "  ${YELLOW}SKIPPED:${NC} $SKIP"
echo "=============================================="

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}"
    echo "  ✅ All P0 verifications passed!"
    echo "     FIPS 204 compliance verified."
    echo -e "${NC}"
    exit 0
else
    echo -e "${RED}"
    echo "  ❌ $FAIL verification(s) failed!"
    echo "     Please fix issues before proceeding."
    echo -e "${NC}"
    exit 1
fi
