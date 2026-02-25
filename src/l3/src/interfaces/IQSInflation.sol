// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IQSInflation - Inflation Mechanism Interface
/// @notice Manages QS token inflation schedule per UNIFIED_SPEC v2.0
/// @dev Inflation schedule: 5% Year1 → 3.75% Year2 → 2.5% Year3 → 1% Year4+
/// @custom:ref UNIFIED_SPEC_v2.0.md §Token配分
/// @custom:security CP-1 compliant (SHA3-256 for any hashing)
interface IQSInflation {
    // ============ Structs ============

    /// @notice Inflation epoch data
    struct InflationEpoch {
        uint256 epochId;
        uint256 startTime;
        uint256 endTime;
        uint256 inflationRate;    // In basis points (500 = 5%)
        uint256 mintedAmount;
        bool isMinted;
    }

    // ============ Events ============

    /// @notice Emitted when inflation tokens are minted
    event InflationMinted(
        uint256 indexed epochId,
        uint256 amount,
        uint256 totalSupply,
        uint256 timestamp
    );

    /// @notice Emitted when inflation rate transitions
    event InflationRateTransitioned(
        uint256 oldRate,
        uint256 newRate,
        uint256 timestamp
    );

    /// @notice Emitted when reward distributor is updated
    event RewardDistributorUpdated(
        address indexed oldDistributor,
        address indexed newDistributor
    );

    // ============ Errors ============

    error MintingNotAvailable();
    error NotAuthorized();
    error InvalidDistributor();
    error InvalidToken();
    error TokenNotSet();

    // ============ View Functions ============

    function INITIAL_INFLATION_RATE() external view returns (uint256);
    function FINAL_INFLATION_RATE() external view returns (uint256);
    function REDUCTION_PERIOD() external view returns (uint256);
    function getCurrentInflationRate() external view returns (uint256);
    function getInflationRateForYear(uint256 year) external view returns (uint256);
    function calculateYearlyMint(uint256 totalSupply) external view returns (uint256);
    function getCurrentEpoch() external view returns (InflationEpoch memory epoch);
    function timeUntilNextMint() external view returns (uint256);
    function canMint() external view returns (bool available);
    function deploymentTimestamp() external view returns (uint256 timestamp);
    function getTotalInflationMinted() external view returns (uint256);

    // ============ State-Changing Functions ============

    function mintInflation() external returns (uint256 amount);
    function setRewardDistributor(address distributor) external;
}
