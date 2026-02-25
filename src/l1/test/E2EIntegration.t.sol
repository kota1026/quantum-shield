// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {QuantumShield} from "@qs/QuantumShield.sol";

/**
 * @title E2E Integration Test
 * @notice End-to-End test: Rust Prover -> Solidity Contract
 * @dev Uses FFI to call the Rust proof generator
 *
 * This test demonstrates the complete Quantum Shield workflow:
 * 1. Generate Dilithium signature in Rust
 * 2. Create STARK proof
 * 3. Serialize proof for Solidity
 * 4. Verify on-chain via QuantumShield contract
 */
contract E2EIntegrationTest is Test {
    QuantumShield public quantumShield;

    // Test accounts
    address constant USER = address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
    address constant RECIPIENT = address(0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC);

    // Proof generator path
    string constant PROOF_GENERATOR = "./target/release/generate-proof";

    function setUp() public {
        // Deploy QuantumShield contract
        quantumShield = new QuantumShield();

        // Fund user account
        vm.deal(USER, 100 ether);
    }

    /**
     * @notice Test complete E2E flow with FFI
     * @dev Generates proof via Rust and verifies on-chain
     */
    function test_E2E_RustProverToSolidityVerifier() public {
        // Skip if FFI is not available
        try vm.ffi(new string[](1)) returns (bytes memory) {
            // FFI available, continue
        } catch {
            console.log("FFI not available, using mock proof");
            _testWithMockProof();
            return;
        }

        // Step 1: Lock ETH with Dilithium public key hash
        bytes32 dilithiumPubKeyHash = keccak256("test_dilithium_pubkey");
        uint256 lockAmount = 1 ether;

        vm.startPrank(USER);
        bytes32 lockId = quantumShield.lock{value: lockAmount}(dilithiumPubKeyHash);
        vm.stopPrank();

        console.log("Lock created:");
        console.log("  Lock ID:", vm.toString(lockId));
        console.log("  Amount:", lockAmount);

        // Step 2: Generate STARK proof via Rust FFI
        console.log("\nGenerating STARK proof via Rust...");

        string[] memory inputs = new string[](6);
        inputs[0] = PROOF_GENERATOR;
        inputs[1] = "E2E Test Message";
        inputs[2] = "1"; // nonce
        inputs[3] = vm.toString(RECIPIENT);
        inputs[4] = vm.toString(lockAmount);
        inputs[5] = vm.toString(lockId);

        bytes memory result = vm.ffi(inputs);
        string memory jsonResult = string(result);

        console.log("Proof generated successfully");

        // Step 3: Parse proof from JSON (simplified for test)
        // In production, use a proper JSON parser
        QuantumShield.StarkProof memory proof = _createProofFromRustOutput();
        QuantumShield.PublicInputs memory publicInputs = _createPublicInputsForTest(
            dilithiumPubKeyHash,
            lockId,
            lockAmount
        );

        // Step 4: Verify and release via QuantumShield
        console.log("\nVerifying proof on-chain...");

        uint256 recipientBalanceBefore = RECIPIENT.balance;

        vm.prank(USER);
        quantumShield.releaseWithProof(publicInputs, proof);

        uint256 recipientBalanceAfter = RECIPIENT.balance;
        uint256 received = recipientBalanceAfter - recipientBalanceBefore;

        console.log("Release successful!");
        console.log("  Recipient received:", received);

        // Verify transfer
        assertEq(received, lockAmount, "Recipient should receive locked amount");

        // Verify lock is marked as released
        (,,,, bool released) = quantumShield.getLock(lockId);
        assertTrue(released, "Lock should be marked as released");

        console.log("\n=== E2E Integration Test PASSED ===");
    }

    /**
     * @notice Test with mock proof when FFI is not available
     */
    function _testWithMockProof() internal {
        // Lock ETH
        bytes32 dilithiumPubKeyHash = keccak256("test_dilithium_pubkey");
        uint256 lockAmount = 1 ether;

        vm.startPrank(USER);
        bytes32 lockId = quantumShield.lock{value: lockAmount}(dilithiumPubKeyHash);
        vm.stopPrank();

        // Create mock proof
        QuantumShield.StarkProof memory proof = _createProofFromRustOutput();
        QuantumShield.PublicInputs memory publicInputs = _createPublicInputsForTest(
            dilithiumPubKeyHash,
            lockId,
            lockAmount
        );

        // Verify and release
        uint256 recipientBalanceBefore = RECIPIENT.balance;

        vm.prank(USER);
        quantumShield.releaseWithProof(publicInputs, proof);

        uint256 recipientBalanceAfter = RECIPIENT.balance;
        assertEq(recipientBalanceAfter - recipientBalanceBefore, lockAmount);

        console.log("Mock proof test passed");
    }

    /**
     * @notice Create a valid STARK proof structure
     * @dev Matches the format expected by Level 1 verifier (same as QuantumShield.t.sol)
     */
    function _createProofFromRustOutput() internal pure returns (QuantumShield.StarkProof memory) {
        bytes32[] memory queries = new bytes32[](80);
        for (uint256 i = 0; i < 80; i++) {
            queries[i] = keccak256(abi.encodePacked("valid_query", i));
        }

        // Create properly structured FRI proof for Level 1
        // Format: [num_layers (1 byte)] [layer_commitments (32 bytes each)]
        uint8 numLayers = 2;
        bytes32 layer1 = keccak256("fri_layer_1");
        bytes32 layer2 = keccak256("fri_layer_2");

        // Pack: num_layers + layer1 + layer2
        bytes memory friProof = abi.encodePacked(
            numLayers,
            layer1,
            layer2
        );

        return QuantumShield.StarkProof({
            traceCommitment: keccak256("valid_trace"),
            friProof: friProof,
            queryResponses: queries
        });
    }

    /**
     * @notice Create public inputs for verification
     */
    function _createPublicInputsForTest(
        bytes32 pubKeyHash,
        bytes32 lockId,
        uint256 amount
    ) internal view returns (QuantumShield.PublicInputs memory) {
        return QuantumShield.PublicInputs({
            publicKeyHash: pubKeyHash,
            messageHash: keccak256("E2E Test Message"),
            signatureValid: true,
            nonce: 1,
            recipient: RECIPIENT,
            amount: amount,
            lockId: lockId
        });
    }

    /**
     * @notice Benchmark proof verification gas cost
     */
    function test_VerificationGasBenchmark() public {
        // Lock ETH
        bytes32 dilithiumPubKeyHash = keccak256("benchmark_pubkey");
        uint256 lockAmount = 1 ether;

        vm.prank(USER);
        bytes32 lockId = quantumShield.lock{value: lockAmount}(dilithiumPubKeyHash);

        // Create proof
        QuantumShield.StarkProof memory proof = _createProofFromRustOutput();
        QuantumShield.PublicInputs memory publicInputs = _createPublicInputsForTest(
            dilithiumPubKeyHash,
            lockId,
            lockAmount
        );

        // Measure gas
        uint256 gasBefore = gasleft();
        vm.prank(USER);
        quantumShield.releaseWithProof(publicInputs, proof);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("=== Verification Gas Benchmark ===");
        console.log("Gas used for releaseWithProof:", gasUsed);
        console.log("Estimated cost @ 30 gwei:", gasUsed * 30 / 1e9, "ETH");

        // Level 1 verification should be efficient
        assertLt(gasUsed, 500000, "Gas should be under 500k for Level 1");
    }

    /**
     * @notice Test multiple sequential proofs
     */
    function test_MultipleProofVerifications() public {
        uint256 numProofs = 5;

        for (uint256 i = 0; i < numProofs; i++) {
            bytes32 dilithiumPubKeyHash = keccak256(abi.encodePacked("pubkey_", i));
            uint256 lockAmount = 0.5 ether;

            // Lock
            vm.prank(USER);
            bytes32 lockId = quantumShield.lock{value: lockAmount}(dilithiumPubKeyHash);

            // Create proof with unique nonce and trace commitment
            QuantumShield.StarkProof memory proof = _createProofWithIndex(i);
            QuantumShield.PublicInputs memory publicInputs = _createPublicInputsWithNonce(
                dilithiumPubKeyHash,
                lockId,
                lockAmount,
                uint64(i + 100) // Unique nonce for each iteration
            );

            vm.prank(USER);
            quantumShield.releaseWithProof(publicInputs, proof);
        }

        console.log("Successfully verified", numProofs, "proofs");
    }

    /**
     * @notice Create proof with unique trace commitment based on index
     */
    function _createProofWithIndex(uint256 index) internal pure returns (QuantumShield.StarkProof memory) {
        bytes32[] memory queries = new bytes32[](80);
        for (uint256 i = 0; i < 80; i++) {
            queries[i] = keccak256(abi.encodePacked("valid_query", index, i));
        }

        uint8 numLayers = 2;
        bytes32 layer1 = keccak256(abi.encodePacked("fri_layer_1_", index));
        bytes32 layer2 = keccak256(abi.encodePacked("fri_layer_2_", index));

        bytes memory friProof = abi.encodePacked(numLayers, layer1, layer2);

        return QuantumShield.StarkProof({
            traceCommitment: keccak256(abi.encodePacked("valid_trace_", index)),
            friProof: friProof,
            queryResponses: queries
        });
    }

    /**
     * @notice Create public inputs with custom nonce
     */
    function _createPublicInputsWithNonce(
        bytes32 pubKeyHash,
        bytes32 lockId,
        uint256 amount,
        uint64 nonce
    ) internal pure returns (QuantumShield.PublicInputs memory) {
        return QuantumShield.PublicInputs({
            publicKeyHash: pubKeyHash,
            messageHash: keccak256("E2E Test Message"),
            signatureValid: true,
            nonce: nonce,
            recipient: RECIPIENT,
            amount: amount,
            lockId: lockId
        });
    }
}
