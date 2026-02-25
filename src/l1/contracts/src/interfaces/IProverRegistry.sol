// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IProverRegistry - Interface for Prover Registration
/// @notice Standardized interface for Prover management (separate from L1 Vault)
/// @dev SEQUENCES.md v3.0: Prover management is separated from Vault for architectural flexibility
interface IProverRegistry {
    /// @notice Prover information structure
    struct Prover {
        address proverAddress;
        bytes32 sphincsPubKeyHash;
        bytes sphincsPublicKey;
        uint256 stakedAmount;
        uint256 registeredAt;
        bool isActive;
        uint256 successfulSigns;
        uint256 slashedCount;
    }

    /// @notice Prover status enum
    enum ProverStatus { NONE, PENDING, ACTIVE, UNBONDING, SLASHED }

    // =========================================================================
    // Events
    // =========================================================================

    /// @notice Emitted when a new prover is registered
    event ProverRegistered(
        address indexed prover,
        bytes32 indexed sphincsPubKeyHash,
        uint256 stakedAmount
    );

    /// @notice Emitted when a prover requests exit
    event ProverExitRequested(
        address indexed prover,
        uint256 unbondingCompleteAt
    );

    /// @notice Emitted when a prover completes exit
    event ProverExited(
        address indexed prover,
        uint256 stakeReturned
    );

    /// @notice Emitted when a prover is slashed
    event ProverSlashed(
        address indexed prover,
        uint256 slashAmount,
        bytes32 reason
    );

    // =========================================================================
    // Registration Functions
    // =========================================================================

    /// @notice Register a new prover with stake
    /// @param sphincsPublicKey The SPHINCS+ public key (32 bytes)
    /// @return success True if registration successful
    function registerProver(bytes calldata sphincsPublicKey)
        external
        payable
        returns (bool success);

    /// @notice Register a prover without stake (testnet only)
    /// @param proverAddress The address of the prover
    /// @param sphincsPublicKey The SPHINCS+ public key (32 bytes)
    function registerProverTestnet(address proverAddress, bytes calldata sphincsPublicKey)
        external;

    /// @notice Request to exit as a prover (starts unbonding period)
    function requestExit() external;

    /// @notice Complete exit after unbonding period
    function completeExit() external;

    // =========================================================================
    // View Functions
    // =========================================================================

    /// @notice Get prover information
    /// @param proverAddress The address of the prover
    /// @return prover The prover struct
    function getProver(address proverAddress)
        external
        view
        returns (Prover memory prover);

    /// @notice Get SPHINCS+ public key for a prover
    /// @param proverAddress The address of the prover
    /// @return publicKey The SPHINCS+ public key
    function getPublicKey(address proverAddress)
        external
        view
        returns (bytes memory publicKey);

    /// @notice Get SPHINCS+ public key hash for a prover
    /// @param proverAddress The address of the prover
    /// @return pubKeyHash The SHA3-256 hash of the public key
    function getPublicKeyHash(address proverAddress)
        external
        view
        returns (bytes32 pubKeyHash);

    /// @notice Check if an address is an active prover
    /// @param proverAddress The address to check
    /// @return isActive True if the address is an active prover
    function isActiveProver(address proverAddress)
        external
        view
        returns (bool isActive);

    /// @notice Get all active prover addresses
    /// @return provers Array of active prover addresses
    function getActiveProvers()
        external
        view
        returns (address[] memory provers);

    /// @notice Get count of active provers
    /// @return count Number of active provers
    function getActiveProverCount()
        external
        view
        returns (uint256 count);

    /// @notice Get minimum stake required
    /// @return minStake Minimum stake in wei
    function getMinStake()
        external
        view
        returns (uint256 minStake);

    /// @notice Get unbonding period
    /// @return period Unbonding period in seconds
    function getUnbondingPeriod()
        external
        view
        returns (uint256 period);

    // =========================================================================
    // Slashing Functions (called by authorized contracts)
    // =========================================================================

    /// @notice Slash a prover's stake
    /// @param proverAddress The address of the prover to slash
    /// @param amount The amount to slash
    /// @param reason The reason hash for slashing
    function slash(address proverAddress, uint256 amount, bytes32 reason)
        external;
}
