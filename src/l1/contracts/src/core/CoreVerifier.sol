// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ICoreVerifier} from "../interfaces/ICoreVerifier.sol";
import {SPHINCSVerifier} from "../SPHINCSVerifier.sol";
import {SHA3_256} from "../libraries/SHA3_256.sol";

/// @title CoreVerifier - Core Layer SPHINCS+ Verification Implementation
/// @notice L3 Decision (2025-12-28) Compliant - No ZK-STARK
/// @dev Wraps SPHINCSVerifier for use in the Modular Architecture Core Layer
///
/// CP-1 Compliance:
/// - Uses SPHINCS+-SHAKE-128s (FIPS 205) for signature verification
/// - Uses SHA3-256 (FIPS 202) for public key hashing
/// - NO keccak256, SHA-256, ECDSA, or RSA
///
/// Security Level: 128-bit post-quantum (NIST Level 1)
contract CoreVerifier is ICoreVerifier {
    // =========================================================================
    // Constants
    // =========================================================================

    /// @notice Security level in bits
    uint256 public constant SECURITY_LEVEL = 128;

    /// @notice Expected SPHINCS+ signature size
    uint256 public constant SIGNATURE_SIZE = 7856;

    /// @notice Expected SPHINCS+ public key size
    uint256 public constant PUBLIC_KEY_SIZE = 32;

    /// @notice Default threshold for 2/5 verification
    uint256 public constant DEFAULT_THRESHOLD = 2;

    // =========================================================================
    // State
    // =========================================================================

    /// @notice The underlying SPHINCSVerifier contract
    SPHINCSVerifier public immutable sphincsVerifier;

    // =========================================================================
    // Constructor
    // =========================================================================

    /// @notice Initialize CoreVerifier with SPHINCSVerifier address
    /// @param _sphincsVerifier Address of deployed SPHINCSVerifier
    constructor(address _sphincsVerifier) {
        require(_sphincsVerifier != address(0), "Zero address");
        sphincsVerifier = SPHINCSVerifier(_sphincsVerifier);
    }

    // =========================================================================
    // Single Signature Verification
    // =========================================================================

    /// @inheritdoc ICoreVerifier
    function verifySPHINCS(
        bytes32 message,
        bytes calldata signature,
        bytes calldata publicKey
    ) external view returns (bool valid) {
        _validateInputs(signature.length, publicKey.length);
        
        try sphincsVerifier.verify(message, signature, publicKey) returns (bool result) {
            return result;
        } catch {
            return false;
        }
    }

    /// @inheritdoc ICoreVerifier
    function verifySPHINCSWithDetails(
        bytes32 message,
        bytes calldata signature,
        bytes calldata publicKey
    ) external view returns (VerificationResult memory result) {
        uint256 startGas = gasleft();

        // Check signature length
        if (signature.length != SIGNATURE_SIZE) {
            result.valid = false;
            result.errorReason = "Invalid signature length";
            result.gasUsed = startGas - gasleft();
            return result;
        }

        // Check public key length
        if (publicKey.length != PUBLIC_KEY_SIZE) {
            result.valid = false;
            result.errorReason = "Invalid public key length";
            result.gasUsed = startGas - gasleft();
            return result;
        }

        // Compute public key hash
        result.pubKeyHash = SHA3_256.hash(publicKey);

        // Verify signature
        try sphincsVerifier.verify(message, signature, publicKey) returns (bool isValid) {
            result.valid = isValid;
            if (!isValid) {
                result.errorReason = "Signature verification failed";
            }
        } catch Error(string memory reason) {
            result.valid = false;
            result.errorReason = reason;
        } catch {
            result.valid = false;
            result.errorReason = "Unknown verification error";
        }

        result.gasUsed = startGas - gasleft();
    }

    // =========================================================================
    // Multi-Signature Verification
    // =========================================================================

    /// @inheritdoc ICoreVerifier
    function verifyMultiSPHINCS(
        bytes32 message,
        bytes[] calldata signatures,
        bytes[] calldata publicKeys,
        uint256 threshold
    ) external view returns (bool valid, uint256 validCount) {
        if (signatures.length != publicKeys.length) {
            revert ArrayLengthMismatch();
        }

        uint256 count = signatures.length;
        validCount = 0;

        for (uint256 i = 0; i < count; i++) {
            // Skip invalid length inputs
            if (signatures[i].length != SIGNATURE_SIZE || 
                publicKeys[i].length != PUBLIC_KEY_SIZE) {
                continue;
            }

            try sphincsVerifier.verify(message, signatures[i], publicKeys[i]) returns (bool result) {
                if (result) {
                    validCount++;
                    // Early exit if threshold met
                    if (validCount >= threshold) {
                        return (true, validCount);
                    }
                }
            } catch {
                // Continue to next signature
            }
        }

        valid = validCount >= threshold;
    }

    /// @inheritdoc ICoreVerifier
    function verifyTwoOfFive(
        bytes32 message,
        bytes[] calldata signatures,
        bytes[] calldata publicKeys
    ) external view returns (bool valid) {
        if (signatures.length != publicKeys.length) {
            revert ArrayLengthMismatch();
        }

        uint256 validCount = 0;
        uint256 count = signatures.length;

        for (uint256 i = 0; i < count && validCount < DEFAULT_THRESHOLD; i++) {
            if (signatures[i].length != SIGNATURE_SIZE || 
                publicKeys[i].length != PUBLIC_KEY_SIZE) {
                continue;
            }

            try sphincsVerifier.verify(message, signatures[i], publicKeys[i]) returns (bool result) {
                if (result) {
                    validCount++;
                }
            } catch {
                // Continue to next signature
            }
        }

        valid = validCount >= DEFAULT_THRESHOLD;
    }

    // =========================================================================
    // Utility Functions
    // =========================================================================

    /// @inheritdoc ICoreVerifier
    function securityLevel() external pure returns (uint256) {
        return SECURITY_LEVEL;
    }

    /// @inheritdoc ICoreVerifier
    function getSignatureSize() external pure returns (uint256) {
        return SIGNATURE_SIZE;
    }

    /// @inheritdoc ICoreVerifier
    function getPublicKeySize() external pure returns (uint256) {
        return PUBLIC_KEY_SIZE;
    }

    /// @inheritdoc ICoreVerifier
    function computePublicKeyHash(bytes calldata publicKey) 
        external 
        pure 
        returns (bytes32) 
    {
        require(publicKey.length == PUBLIC_KEY_SIZE, "Invalid public key length");
        // CP-1 compliant: uses SHA3-256, NOT keccak256
        return SHA3_256.hash(publicKey);
    }

    /// @inheritdoc ICoreVerifier
    function isValidPublicKeyFormat(bytes calldata publicKey) 
        external 
        pure 
        returns (bool) 
    {
        return publicKey.length == PUBLIC_KEY_SIZE;
    }

    /// @inheritdoc ICoreVerifier
    function getSPHINCSVerifier() external view returns (address) {
        return address(sphincsVerifier);
    }

    // =========================================================================
    // Internal Functions
    // =========================================================================

    /// @notice Validate input lengths
    function _validateInputs(uint256 sigLength, uint256 pkLength) internal pure {
        if (sigLength != SIGNATURE_SIZE) {
            revert InvalidSignatureLength(sigLength, SIGNATURE_SIZE);
        }
        if (pkLength != PUBLIC_KEY_SIZE) {
            revert InvalidPublicKeyLength(pkLength, PUBLIC_KEY_SIZE);
        }
    }
}
