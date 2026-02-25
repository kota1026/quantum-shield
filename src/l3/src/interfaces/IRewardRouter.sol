// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IRewardRouter - Inflation Distribution Router Interface
/// @notice Routes QS inflation rewards to multiple distribution pools
/// @dev Receives minted QS from QSInflation and distributes to 4 pools:
///   50% VeQSRewardDistributor (veQS holders)
///   30% ProverRewardPool (Prover signing rewards)
///   10% ObserverRewardPool (Observer challenge rewards)
///   10% Treasury (Foundation operations)
/// @custom:ref SEQUENCES.md §9.4 報酬アーキテクチャ
/// @custom:security-contact security@quantumshield.io
interface IRewardRouter {
    // ============ Structs ============

    /// @notice Distribution allocation in basis points (total must = 10000)
    struct Allocation {
        uint256 veQSShare;      // Basis points for veQS holders (default 5000 = 50%)
        uint256 proverShare;    // Basis points for Prover pool (default 3000 = 30%)
        uint256 observerShare;  // Basis points for Observer pool (default 1000 = 10%)
        uint256 treasuryShare;  // Basis points for Treasury (default 1000 = 10%)
    }

    // ============ Events ============

    event Distributed(
        uint256 totalAmount,
        uint256 veQSAmount,
        uint256 proverAmount,
        uint256 observerAmount,
        uint256 treasuryAmount,
        uint256 timestamp
    );

    event AllocationUpdated(
        uint256 veQSShare,
        uint256 proverShare,
        uint256 observerShare,
        uint256 treasuryShare
    );

    event PoolAddressUpdated(
        string poolName,
        address indexed oldAddress,
        address indexed newAddress
    );

    // ============ Errors ============

    error InvalidAllocation();       // shares don't sum to 10000
    error ZeroAmount();
    error ZeroBalance();
    error NotAuthorized();
    error InvalidAddress();

    // ============ View Functions ============

    /// @notice QS Token address
    function qsToken() external view returns (address);

    /// @notice VeQSRewardDistributor address
    function veQSDistributor() external view returns (address);

    /// @notice ProverRewardPool address
    function proverPool() external view returns (address);

    /// @notice ObserverRewardPool address
    function observerPool() external view returns (address);

    /// @notice Treasury address
    function treasury() external view returns (address);

    /// @notice Current allocation
    function getAllocation() external view returns (Allocation memory);

    /// @notice Total amount distributed through this router
    function totalDistributed() external view returns (uint256);

    /// @notice Undistributed QS balance held by this contract
    function pendingBalance() external view returns (uint256);

    // ============ Distribution Functions ============

    /// @notice Distribute all QS tokens held by this contract to pools
    /// @dev Permissionless - anyone can call this
    /// @return totalAmount Total amount distributed
    function distribute() external returns (uint256 totalAmount);

    // ============ Admin Functions ============

    /// @notice Update distribution allocation (governance only)
    function setAllocation(
        uint256 veQSShare,
        uint256 proverShare,
        uint256 observerShare,
        uint256 treasuryShare
    ) external;

    /// @notice Update pool addresses (governance only)
    function setVeQSDistributor(address newDistributor) external;
    function setProverPool(address newPool) external;
    function setObserverPool(address newPool) external;
    function setTreasury(address newTreasury) external;
}
