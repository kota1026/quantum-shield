// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IQuantumVerifier.sol";

/// @notice SP1 Verifier interface
interface ISP1Verifier {
    function verifyProof(
        bytes32 programVKey,
        bytes calldata publicValues,
        bytes calldata proofBytes
    ) external view;
}

/// @title SP1 Verifier Adapter for Quantum Shield Bridge
/// @notice Adapts SP1's official verifier gateway to IQuantumVerifier interface
/// @dev Uses SP1 Verifier Gateway which routes to correct verifier based on proof version
///
/// SP1 Verifier Gateway (all chains):
///   - Gateway: 0x3B6041173B80E77f038f3F2C0f9744f04837185e
///   - Routes Groth16/PLONK proofs to appropriate verifier
contract SP1VerifierAdapter is IQuantumVerifier {

    // =========================================================================
    // Constants
    // =========================================================================

    /// @notice SP1 Verifier Gateway (routes to correct verifier)
    address public constant SP1_VERIFIER = 0x3B6041173B80E77f038f3F2C0f9744f04837185e;

    // =========================================================================
    // State
    // =========================================================================

    /// @notice Program verification key (set at deployment)
    bytes32 public immutable programVKey;

    /// @notice Owner for emergency functions
    address public owner;

    // =========================================================================
    // Events
    // =========================================================================

    event ProofVerified(bytes32 indexed vkey, bool valid);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // =========================================================================
    // Errors
    // =========================================================================

    error InvalidProofFormat();
    error VerificationFailed();
    error OnlyOwner();

    // =========================================================================
    // Constructor
    // =========================================================================

    /// @param _programVKey The SP1 program verification key
    constructor(bytes32 _programVKey) {
        programVKey = _programVKey;
        owner = msg.sender;
    }

    // =========================================================================
    // IQuantumVerifier Implementation
    // =========================================================================

    /// @inheritdoc IQuantumVerifier
    /// @dev Proof format: [publicValues (variable), proofBytes (variable)]
    ///      The proof array encodes: [publicValuesLength, publicValues..., proofBytes...]
    function verifyProof(
        bytes calldata proof,
        uint256[] calldata publicInputs
    ) external view override returns (bool valid) {
        if (proof.length < 4) revert InvalidProofFormat();

        // Decode proof structure
        // First 4 bytes: public values length
        uint32 publicValuesLen = uint32(bytes4(proof[0:4]));

        if (proof.length < 4 + publicValuesLen) revert InvalidProofFormat();

        bytes calldata publicValues = proof[4:4 + publicValuesLen];
        bytes calldata proofBytes = proof[4 + publicValuesLen:];

        // Call SP1 verifier (reverts on invalid proof)
        try ISP1Verifier(SP1_VERIFIER).verifyProof(
            programVKey,
            publicValues,
            proofBytes
        ) {
            return true;
        } catch {
            return false;
        }
    }

    /// @inheritdoc IQuantumVerifier
    function getVerificationKeyHash() external view override returns (bytes32) {
        return programVKey;
    }

    /// @inheritdoc IQuantumVerifier
    function getVerifierType() external pure override returns (string memory) {
        return "sp1-groth16-v5";
    }

    /// @inheritdoc IQuantumVerifier
    function isQuantumResistant() external pure override returns (bool) {
        // SP1's Groth16 backend is NOT quantum resistant
        // The Dilithium verification inside SP1 IS quantum resistant
        // Overall security: as strong as the weakest link (Groth16)
        return false;
    }

    // =========================================================================
    // View Functions
    // =========================================================================

    /// @notice Get the SP1 verifier address being used
    function getSP1Verifier() external pure returns (address) {
        return SP1_VERIFIER;
    }

    // =========================================================================
    // Owner Functions
    // =========================================================================

    /// @notice Transfer ownership
    function transferOwnership(address newOwner) external {
        if (msg.sender != owner) revert OnlyOwner();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
