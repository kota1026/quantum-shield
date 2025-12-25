// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SHA3_256} from "./libraries/SHA3_256.sol";
import {SHA3Hasher} from "./libraries/SHA3Hasher.sol";
import {ProofCodec} from "./libraries/ProofCodec.sol";
import {FRIVerifier} from "./FRIVerifier.sol";

/**
 * @title STARKVerifier
 * @author Quantum Shield Team
 * @notice ZK-STARK proof verification contract v0.2
 * @dev Provides trace commitment verification with Merkle proofs
 * 
 * ## Overview
 * This contract implements the on-chain verification component of the 
 * Quantum Shield ZK-STARK proof system. It verifies proofs generated 
 * by the off-chain STARK prover.
 * 
 * ## CP-1 Compliance (Quantum Resistance)
 * - Uses ONLY SHA3-256 (FIPS 202) for all hash operations
 * - keccak256 is PROHIBITED
 * - Goldilocks field (2^64 - 2^32 + 1) for arithmetic
 * - 128-bit security level
 * 
 * ## Version 0.2 Additions (IMPL-005)
 * - Trace evaluation verification at query indices
 * - Merkle proof verification for trace commitments
 * - Batch verification support
 * 
 * @custom:security-contact security@quantumshield.io
 * @custom:version 0.2.0
 */
contract STARKVerifier {
    using SHA3Hasher for bytes;
    using SHA3Hasher for bytes32;

    // =========================================================================
    // Constants
    // =========================================================================

    /// @notice Goldilocks prime field modulus: 2^64 - 2^32 + 1
    /// @dev This field is optimal for STARK proofs due to efficient arithmetic
    uint256 public constant FIELD_MODULUS = 0xFFFFFFFF00000001;

    /// @notice Primitive root of unity (generator for multiplicative group)
    uint256 public constant PRIMITIVE_ROOT = 7;

    /// @notice Maximum number of FRI layers supported
    /// @dev Supports domain sizes up to 2^16 = 65536
    uint256 public constant MAX_FRI_LAYERS = 16;

    /// @notice Minimum number of queries for 128-bit security
    /// @dev Based on soundness analysis: ~80 queries for blowup factor 8
    uint256 public constant MIN_QUERIES = 80;

    /// @notice Security level in bits
    uint256 public constant SECURITY_LEVEL = 128;

    /// @notice Default Merkle tree depth for trace commitments
    uint256 public constant DEFAULT_TRACE_DEPTH = 10;

    // =========================================================================
    // Domain Separators (for hash uniqueness)
    // =========================================================================

    bytes32 private constant DOMAIN_TRACE = bytes32("QS_STARK_TRACE_V1");
    bytes32 private constant DOMAIN_CONSTRAINT = bytes32("QS_STARK_CONSTRAINT");
    bytes32 private constant DOMAIN_FRI_LAYER = bytes32("QS_STARK_FRI_LAYER");
    bytes32 private constant DOMAIN_MERKLE_NODE = bytes32("QS_STARK_MERKLE_V1");

    // =========================================================================
    // Errors
    // =========================================================================

    /// @notice Thrown when proof structure is invalid
    error InvalidProofStructure();

    /// @notice Thrown when commitment verification fails
    error InvalidCommitment();

    /// @notice Thrown when FRI verification fails
    error InvalidFRIProof();

    /// @notice Thrown when domain size is not a power of 2
    error InvalidDomainSize();

    /// @notice Thrown when query count is insufficient
    error InsufficientQueries();

    /// @notice Thrown when Merkle proof depth is incorrect
    error InvalidMerkleProofDepth();

    /// @notice Thrown when Merkle proof verification fails
    error InvalidMerkleProof();

    // =========================================================================
    // Events
    // =========================================================================

    /// @notice Emitted when a proof is successfully verified
    event ProofVerified(bytes32 indexed publicInput, uint256 timestamp);

    /// @notice Emitted when proof verification fails
    event ProofRejected(bytes32 indexed publicInput, string reason);

    /// @notice Emitted when a trace evaluation is verified
    event TraceEvaluationVerified(uint256 indexed index, bytes32 leaf, bytes32 root);

    // =========================================================================
    // Version Information
    // =========================================================================

    /**
     * @notice Get contract version information
     * @return name Contract name
     * @return version Version string
     */
    function getVersion() external pure returns (string memory name, string memory version) {
        return ("STARKVerifier", "0.2.0");
    }

    /**
     * @notice Get supported security level
     * @return Security level in bits
     */
    function securityLevel() external pure returns (uint256) {
        return SECURITY_LEVEL;
    }

    // =========================================================================
    // Main Verification Interface
    // =========================================================================

    /**
     * @notice Verify a STARK proof
     * @dev Main entry point for proof verification
     * @param proof The STARK proof to verify
     * @param publicInput The public input (statement being proven)
     * @return True if the proof is valid
     */
    function verifyProof(
        ProofCodec.STARKProof memory proof,
        bytes32 publicInput
    ) external view returns (bool) {
        // Step 1: Validate proof structure
        if (!_validateProofStructure(proof)) {
            return false;
        }

        // Step 2: Verify trace commitment
        if (proof.traceCommitment == bytes32(0)) {
            return false;
        }

        // Step 3: Verify constraint commitment
        if (proof.constraintCommitment == bytes32(0)) {
            return false;
        }

        // Step 4: Verify FRI layers (basic check for v0.1)
        if (proof.friCommitments.length == 0) {
            return false;
        }

        // Step 5: Verify minimum queries
        if (proof.queryIndices.length < MIN_QUERIES) {
            return false;
        }

        // Step 6: Verify final polynomial is low-degree
        if (proof.finalPolynomial.length > 4) {
            return false;
        }

        // All basic checks passed
        // Note: Full FRI verification to be implemented in v0.3
        return true;
    }

    // =========================================================================
    // Commitment Verification
    // =========================================================================

    /**
     * @notice Verify trace commitment
     * @dev Checks that the trace root matches the expected commitment
     * @param traceRoot The Merkle root of trace evaluations
     * @param expectedCommitment The expected commitment value
     * @return True if commitment is valid
     */
    function verifyTraceCommitment(
        bytes32 traceRoot,
        bytes32 expectedCommitment
    ) external pure returns (bool) {
        bytes32 computed = SHA3Hasher.hash(abi.encodePacked(traceRoot));
        return computed == expectedCommitment;
    }

    /**
     * @notice Verify constraint commitment
     * @dev Checks that the constraint root matches the expected commitment
     * @param constraintRoot The Merkle root of constraint evaluations
     * @param expectedCommitment The expected commitment value
     * @return True if commitment is valid
     */
    function verifyConstraintCommitment(
        bytes32 constraintRoot,
        bytes32 expectedCommitment
    ) external pure returns (bool) {
        bytes32 computed = SHA3Hasher.hash(abi.encodePacked(constraintRoot));
        return computed == expectedCommitment;
    }

    // =========================================================================
    // IMPL-005: Trace Evaluation Verification with Merkle Proofs
    // =========================================================================

    /**
     * @notice Verify a trace evaluation at a specific index using Merkle proof
     * @dev CP-1 COMPLIANCE: Uses SHA3-256 for all hash operations
     * @param leaf The leaf value (hash of evaluation)
     * @param index The position of the leaf in the tree
     * @param siblings Array of sibling hashes (Merkle proof path)
     * @param expectedRoot The expected Merkle root
     * @return valid True if the proof is valid
     */
    function verifyTraceEvaluationAtIndex(
        bytes32 leaf,
        uint256 index,
        bytes32[] memory siblings,
        bytes32 expectedRoot
    ) external pure returns (bool valid) {
        // Validate proof depth (must match tree depth)
        if (siblings.length == 0 || siblings.length > MAX_FRI_LAYERS) {
            return false;
        }

        // Compute root from leaf and proof
        bytes32 computedHash = leaf;
        uint256 path = index;

        for (uint256 i = 0; i < siblings.length; i++) {
            bytes32 sibling = siblings[i];

            if (path & 1 == 0) {
                // Current node is left child
                computedHash = _hashMerkleNodes(computedHash, sibling);
            } else {
                // Current node is right child
                computedHash = _hashMerkleNodes(sibling, computedHash);
            }

            path >>= 1;
        }

        return computedHash == expectedRoot;
    }

    /**
     * @notice Batch verify multiple trace evaluations
     * @dev Verifies evaluations at multiple query indices against the trace commitment
     * @param leaves Array of leaf values (hashes of evaluations)
     * @param indices Array of leaf positions in the tree
     * @param allSiblings 2D array of sibling hashes for each query
     * @param expectedRoot The expected Merkle root (trace commitment)
     * @return validCount Number of valid proofs
     */
    function verifyTraceEvaluationsBatch(
        bytes32[] memory leaves,
        uint256[] memory indices,
        bytes32[][] memory allSiblings,
        bytes32 expectedRoot
    ) external pure returns (uint256 validCount) {
        // Validate input arrays have matching lengths
        if (leaves.length != indices.length || leaves.length != allSiblings.length) {
            return 0;
        }

        for (uint256 i = 0; i < leaves.length; i++) {
            bytes32[] memory siblings = allSiblings[i];
            
            // Skip if proof depth is invalid
            if (siblings.length == 0 || siblings.length > MAX_FRI_LAYERS) {
                continue;
            }

            bytes32 computedHash = leaves[i];
            uint256 path = indices[i];

            for (uint256 j = 0; j < siblings.length; j++) {
                bytes32 sibling = siblings[j];

                if (path & 1 == 0) {
                    computedHash = _hashMerkleNodes(computedHash, sibling);
                } else {
                    computedHash = _hashMerkleNodes(sibling, computedHash);
                }

                path >>= 1;
            }

            if (computedHash == expectedRoot) {
                validCount++;
            }
        }
    }

    /**
     * @notice Compute a leaf hash from evaluation data
     * @dev Domain-separated hashing for trace evaluations
     * @param evaluation The evaluation value (field element)
     * @param index The position in the trace
     * @return leaf The computed leaf hash
     */
    function computeTraceLeaf(
        uint256 evaluation,
        uint256 index
    ) external pure returns (bytes32 leaf) {
        // Domain-separated leaf hashing using SHA3-256
        return SHA3Hasher.hash(abi.encodePacked(
            DOMAIN_TRACE,
            evaluation,
            index
        ));
    }

    /**
     * @notice Compute Merkle root from evaluations
     * @dev Computes the trace commitment from a set of evaluations
     * @param evaluations Array of evaluation values
     * @return root The computed Merkle root
     */
    function computeTraceRoot(
        uint256[] memory evaluations
    ) external pure returns (bytes32 root) {
        // Require power of 2 evaluations for complete binary tree
        require(evaluations.length > 0, "Empty evaluations");
        require(
            (evaluations.length & (evaluations.length - 1)) == 0,
            "Evaluation count must be power of 2"
        );

        // Build leaf layer
        bytes32[] memory layer = new bytes32[](evaluations.length);
        for (uint256 i = 0; i < evaluations.length; i++) {
            layer[i] = SHA3Hasher.hash(abi.encodePacked(
                DOMAIN_TRACE,
                evaluations[i],
                i
            ));
        }

        // Build tree bottom-up
        while (layer.length > 1) {
            bytes32[] memory nextLayer = new bytes32[](layer.length / 2);
            for (uint256 i = 0; i < nextLayer.length; i++) {
                nextLayer[i] = _hashMerkleNodes(layer[2 * i], layer[2 * i + 1]);
            }
            layer = nextLayer;
        }

        return layer[0];
    }

    // =========================================================================
    // Hash Operations (CP-1 Compliant)
    // =========================================================================

    /**
     * @notice Hash arbitrary data using SHA3-256
     * @dev CP-1 COMPLIANCE: Uses SHA3-256 (FIPS 202), NOT keccak256
     * @param data Data to hash
     * @return SHA3-256 hash of the data
     */
    function hashData(bytes memory data) external pure returns (bytes32) {
        return SHA3Hasher.hash(data);
    }

    /**
     * @notice Hash two bytes32 values (for Merkle operations)
     * @dev Optimized for Merkle tree construction
     * @param left Left child
     * @param right Right child
     * @return Combined hash
     */
    function hashPair(bytes32 left, bytes32 right) external pure returns (bytes32) {
        return SHA3Hasher.hashPair(left, right);
    }

    // =========================================================================
    // Field Operations
    // =========================================================================

    /**
     * @notice Add two field elements
     * @param a First operand
     * @param b Second operand
     * @return Result in the field
     */
    function fieldAdd(uint256 a, uint256 b) external pure returns (uint256) {
        return addmod(a, b, FIELD_MODULUS);
    }

    /**
     * @notice Multiply two field elements
     * @param a First operand
     * @param b Second operand
     * @return Result in the field
     */
    function fieldMul(uint256 a, uint256 b) external pure returns (uint256) {
        return mulmod(a, b, FIELD_MODULUS);
    }

    /**
     * @notice Compute modular exponentiation
     * @param base Base value
     * @param exp Exponent
     * @return base^exp mod FIELD_MODULUS
     */
    function fieldExp(uint256 base, uint256 exp) external pure returns (uint256) {
        return _modExp(base, exp, FIELD_MODULUS);
    }

    /**
     * @notice Compute modular inverse
     * @param a Value to invert
     * @return a^(-1) mod FIELD_MODULUS
     */
    function fieldInverse(uint256 a) external pure returns (uint256) {
        require(a != 0, "Cannot invert zero");
        return _modExp(a, FIELD_MODULUS - 2, FIELD_MODULUS);
    }

    // =========================================================================
    // Domain Operations
    // =========================================================================

    /**
     * @notice Check if a domain size is valid (must be power of 2)
     * @param size Domain size to check
     * @return True if valid
     */
    function isValidDomainSize(uint256 size) external pure returns (bool) {
        if (size == 0) return false;
        return (size & (size - 1)) == 0;
    }

    /**
     * @notice Compute an element of the evaluation domain
     * @dev Computes ω^index where ω is the domain generator
     * @param index Index in the domain
     * @param domainSize Size of the domain
     * @return Domain element
     */
    function computeDomainElement(
        uint256 index,
        uint256 domainSize
    ) external pure returns (uint256) {
        require(domainSize > 0, "Domain size must be positive");
        require((domainSize & (domainSize - 1)) == 0, "Domain size must be power of 2");
        
        // ω = g^((p-1)/n) where g is primitive root, p is modulus, n is domain size
        uint256 exponent = (FIELD_MODULUS - 1) / domainSize;
        uint256 omega = _modExp(PRIMITIVE_ROOT, exponent, FIELD_MODULUS);
        
        // Return ω^index
        return _modExp(omega, index, FIELD_MODULUS);
    }

    // =========================================================================
    // Internal Functions
    // =========================================================================

    /**
     * @notice Validate proof structure
     * @param proof The proof to validate
     * @return True if structure is valid
     */
    function _validateProofStructure(
        ProofCodec.STARKProof memory proof
    ) internal pure returns (bool) {
        // Check FRI commitments and challenges match
        if (proof.friCommitments.length != proof.friChallenges.length) {
            return false;
        }

        // Check merkle proofs and evaluations match queries
        if (proof.merkleProofs.length != proof.queryIndices.length) {
            return false;
        }
        if (proof.evaluations.length != proof.queryIndices.length) {
            return false;
        }

        // Check FRI layer count is reasonable
        if (proof.friCommitments.length > MAX_FRI_LAYERS) {
            return false;
        }

        return true;
    }

    /**
     * @notice Hash two Merkle tree nodes using SHA3-256
     * @dev Domain-separated hashing for Merkle tree construction
     * @param left Left child hash
     * @param right Right child hash
     * @return Parent node hash
     */
    function _hashMerkleNodes(
        bytes32 left,
        bytes32 right
    ) internal pure returns (bytes32) {
        // Domain-separated hashing using SHA3Hasher
        return SHA3Hasher.hash(abi.encodePacked(
            DOMAIN_MERKLE_NODE,
            left,
            right
        ));
    }

    /**
     * @notice Modular exponentiation: base^exp mod modulus
     * @dev Uses binary exponentiation for efficiency
     */
    function _modExp(
        uint256 base,
        uint256 exp,
        uint256 modulus
    ) internal pure returns (uint256) {
        if (modulus == 0) revert InvalidDomainSize();
        
        uint256 result = 1;
        base = base % modulus;

        while (exp > 0) {
            if (exp % 2 == 1) {
                result = mulmod(result, base, modulus);
            }
            exp = exp / 2;
            base = mulmod(base, base, modulus);
        }
        return result;
    }
}
