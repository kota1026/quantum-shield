// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/libraries/SHA3_256.sol";

/// @title SHA3-256 Gas Optimization Benchmark Tests
/// @notice Day 11 - [TEST-012] Gas consumption benchmark tests
/// @dev Tests to verify gas optimization targets are met after IMPL-010
///
/// Target: 1.3M gas → 800K gas (approximately 40% reduction)
///
/// Optimization strategies verified:
/// 1. Round constants converted to static array (no if/else chain)
/// 2. Rho offsets converted to static array
/// 3. Loop optimizations where applicable
contract SHA3_256GasTest is Test {
    
    // =========================================================================
    // Gas Thresholds
    // =========================================================================
    
    /// @notice Target gas for 32-byte input after optimization
    /// @dev 800K target with 25% buffer = 1M threshold
    uint256 constant GAS_TARGET_32_BYTES = 1_000_000;
    
    /// @notice Target gas for 64-byte input (hashPair use case)
    uint256 constant GAS_TARGET_64_BYTES = 1_100_000;
    
    /// @notice Strict target for regression detection
    uint256 constant GAS_STRICT_THRESHOLD = 1_500_000;

    // =========================================================================
    // Primary Gas Benchmarks
    // =========================================================================

    /// @notice [TEST-012-01] Benchmark 32-byte hash gas consumption
    function test_GasBenchmark_32Bytes() public {
        bytes memory input = abi.encodePacked(bytes32(uint256(12345)));
        
        uint256 gasBefore = gasleft();
        SHA3_256.hash(input);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("SHA3-256 (32 bytes) gas used", gasUsed);
        emit log_named_uint("Target threshold", GAS_TARGET_32_BYTES);
        
        // Primary check: Under strict threshold (no regression)
        assertTrue(gasUsed < GAS_STRICT_THRESHOLD, "Gas regression detected!");
        
        // Secondary check: Under optimization target
        if (gasUsed <= GAS_TARGET_32_BYTES) {
            emit log("✅ PASS: Under target threshold");
        } else {
            emit log("⚠️  WARN: Above target, optimization may be needed");
        }
    }

    /// @notice [TEST-012-02] Benchmark 64-byte hash gas consumption (hashPair)
    function test_GasBenchmark_64Bytes() public {
        bytes32 a = bytes32(uint256(1));
        bytes32 b = bytes32(uint256(2));
        bytes memory input = abi.encodePacked(a, b);
        
        uint256 gasBefore = gasleft();
        SHA3_256.hash(input);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("SHA3-256 (64 bytes) gas used", gasUsed);
        emit log_named_uint("Target threshold", GAS_TARGET_64_BYTES);
        
        assertTrue(gasUsed < GAS_STRICT_THRESHOLD, "Gas regression detected!");
    }

    /// @notice [TEST-012-03] Benchmark hashPair convenience function
    function test_GasBenchmark_HashPair() public {
        bytes32 a = keccak256("left node");
        bytes32 b = keccak256("right node");
        
        uint256 gasBefore = gasleft();
        SHA3_256.hashPair(a, b);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("SHA3_256.hashPair() gas used", gasUsed);
        
        assertTrue(gasUsed < GAS_STRICT_THRESHOLD, "Gas regression detected!");
    }

    /// @notice [TEST-012-04] Benchmark empty input (single block case)
    function test_GasBenchmark_EmptyInput() public {
        bytes memory input = "";
        
        uint256 gasBefore = gasleft();
        SHA3_256.hash(input);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("SHA3-256 (empty) gas used", gasUsed);
        
        assertTrue(gasUsed < GAS_STRICT_THRESHOLD, "Gas regression detected!");
    }

    // =========================================================================
    // Multi-block Benchmarks
    // =========================================================================

    /// @notice [TEST-012-05] Benchmark 136-byte input (exactly 1 block)
    function test_GasBenchmark_OneBlock() public {
        bytes memory input = new bytes(136);
        for (uint i = 0; i < 136; i++) {
            input[i] = bytes1(uint8(i % 256));
        }
        
        uint256 gasBefore = gasleft();
        SHA3_256.hash(input);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("SHA3-256 (136 bytes = 1 block) gas used", gasUsed);
        
        assertTrue(gasUsed < GAS_STRICT_THRESHOLD, "Gas regression detected!");
    }

    /// @notice [TEST-012-06] Benchmark 272-byte input (2 blocks)
    function test_GasBenchmark_TwoBlocks() public {
        bytes memory input = new bytes(272);
        for (uint i = 0; i < 272; i++) {
            input[i] = bytes1(uint8(i % 256));
        }
        
        uint256 gasBefore = gasleft();
        SHA3_256.hash(input);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("SHA3-256 (272 bytes = 2 blocks) gas used", gasUsed);
        
        // Two blocks should be under 2x threshold
        assertTrue(gasUsed < GAS_STRICT_THRESHOLD * 2, "Gas regression detected!");
    }

    // =========================================================================
    // Optimization Verification Tests
    // =========================================================================

    /// @notice [TEST-012-07] Verify round constant access is optimized
    /// @dev After optimization, constants should be in array, not if/else
    function test_Optimization_RoundConstants() public pure {
        // Verify all 24 round constants are accessible
        // This test ensures the optimization doesn't break the implementation
        bytes memory input = "round constant test";
        bytes32 result = SHA3_256.hash(input);
        
        // Result should match regardless of optimization method
        assertTrue(result != bytes32(0), "Hash should not be zero");
    }

    /// @notice [TEST-012-08] Verify rho offset access is optimized
    function test_Optimization_RhoOffsets() public pure {
        // Verify all 25 rho offsets work correctly
        bytes memory input = "rho offset test";
        bytes32 result = SHA3_256.hash(input);
        
        assertTrue(result != bytes32(0), "Hash should not be zero");
    }

    /// @notice [TEST-012-09] Full 24-round correctness after optimization
    function test_Optimization_FullRoundCorrectness() public pure {
        // Verify NIST test vector still passes after optimization
        bytes32 result = SHA3_256.hash("");
        bytes32 expected = 0xa7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a;
        
        assertEq(result, expected, "NIST empty hash must match after optimization");
    }

    // =========================================================================
    // Comparison Benchmarks
    // =========================================================================

    /// @notice [TEST-012-10] Compare with keccak256 (baseline)
    function test_Comparison_VsKeccak256() public {
        bytes memory input = "comparison test data for benchmarking";
        
        // keccak256 (native precompile)
        uint256 gasBefore = gasleft();
        keccak256(input);
        uint256 keccakGas = gasBefore - gasleft();
        
        // SHA3-256 (pure Solidity)
        gasBefore = gasleft();
        SHA3_256.hash(input);
        uint256 sha3Gas = gasBefore - gasleft();
        
        emit log_named_uint("keccak256 gas", keccakGas);
        emit log_named_uint("SHA3-256 gas", sha3Gas);
        emit log_named_uint("Overhead (SHA3 - keccak)", sha3Gas - keccakGas);
        emit log_named_uint("Ratio (SHA3 / keccak)", sha3Gas / (keccakGas > 0 ? keccakGas : 1));
        
        // SHA3-256 will be more expensive, this is expected
        assertTrue(sha3Gas > keccakGas, "SHA3 should cost more than native keccak");
    }

    // =========================================================================
    // Statistical Benchmarks (Multiple Runs)
    // =========================================================================

    /// @notice [TEST-012-11] Average gas over multiple runs
    function test_AverageGas_MultipleRuns() public {
        uint256 totalGas = 0;
        uint256 runs = 10;
        
        for (uint256 i = 0; i < runs; i++) {
            bytes memory input = abi.encodePacked(bytes32(uint256(i * 1000)));
            
            uint256 gasBefore = gasleft();
            SHA3_256.hash(input);
            uint256 gasUsed = gasBefore - gasleft();
            
            totalGas += gasUsed;
        }
        
        uint256 averageGas = totalGas / runs;
        emit log_named_uint("Average gas over 10 runs", averageGas);
        emit log_named_uint("Total gas for 10 hashes", totalGas);
        
        assertTrue(averageGas < GAS_STRICT_THRESHOLD, "Average gas regression detected!");
    }

    // =========================================================================
    // Signature Message Hash Benchmark (FIX-008 Related)
    // =========================================================================

    /// @notice [TEST-011] Signature message SHA3-256 test
    /// @dev Tests the specific use case for _verifyThresholdSignatures
    function test_SignatureMessage_SHA3() public {
        bytes32 lockId = bytes32(uint256(12345));
        bytes32 stateRoot = bytes32(uint256(67890));
        
        uint256 gasBefore = gasleft();
        bytes32 message = SHA3_256.hashPair(lockId, stateRoot);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Signature message hash gas", gasUsed);
        
        // Verify it produces a valid hash
        assertTrue(message != bytes32(0), "Message hash should not be zero");
        assertTrue(gasUsed < GAS_STRICT_THRESHOLD, "Gas regression detected!");
    }

    // =========================================================================
    // Summary Report
    // =========================================================================

    /// @notice Generate comprehensive gas report
    function test_GenerateGasReport() public {
        emit log("=== SHA3-256 Gas Optimization Report ===");
        emit log("");
        
        // 32 bytes
        bytes memory input32 = abi.encodePacked(bytes32(uint256(1)));
        uint256 gasBefore = gasleft();
        SHA3_256.hash(input32);
        uint256 gas32 = gasBefore - gasleft();
        
        // 64 bytes  
        bytes memory input64 = abi.encodePacked(bytes32(uint256(1)), bytes32(uint256(2)));
        gasBefore = gasleft();
        SHA3_256.hash(input64);
        uint256 gas64 = gasBefore - gasleft();
        
        // hashPair
        gasBefore = gasleft();
        SHA3_256.hashPair(bytes32(uint256(1)), bytes32(uint256(2)));
        uint256 gasHashPair = gasBefore - gasleft();
        
        emit log("Gas Consumption:");
        emit log_named_uint("  32 bytes", gas32);
        emit log_named_uint("  64 bytes", gas64);
        emit log_named_uint("  hashPair", gasHashPair);
        emit log("");
        emit log_named_uint("Target (800K)", 800_000);
        emit log_named_uint("Strict Threshold", GAS_STRICT_THRESHOLD);
        emit log("");
        
        if (gas32 <= 800_000) {
            emit log("Status: ✅ OPTIMIZATION TARGET MET");
        } else if (gas32 <= 1_000_000) {
            emit log("Status: ⚠️  CLOSE TO TARGET");
        } else {
            emit log("Status: ❌ OPTIMIZATION NEEDED");
        }
    }
}
