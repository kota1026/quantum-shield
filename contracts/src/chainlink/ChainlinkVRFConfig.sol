// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ChainlinkVRFConfig - Network-specific VRF Configuration
/// @notice Contains Chainlink VRF v2.5 coordinator addresses and key hashes
/// @dev TASK-P5-005-PROD: Chainlink VRF Production Integration
///
/// Configuration Reference:
/// https://docs.chain.link/vrf/v2-5/supported-networks
library ChainlinkVRFConfig {
    // =========================================================================
    // Ethereum Mainnet (Chain ID: 1)
    // =========================================================================

    /// @notice Ethereum Mainnet VRF Coordinator v2.5
    address internal constant ETH_MAINNET_COORDINATOR =
        0x271682DEB8C4E0901D1a1550aD2e64D568E69909;

    /// @notice Ethereum Mainnet Key Hash - 200 gwei gas lane
    bytes32 internal constant ETH_MAINNET_KEY_HASH_200_GWEI =
        0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef;

    /// @notice Ethereum Mainnet Key Hash - 500 gwei gas lane
    bytes32 internal constant ETH_MAINNET_KEY_HASH_500_GWEI =
        0xff8dedfbfa60af186cf3c830acbc32c05aae823045ae5ea7da1e45fbfaba4f92;

    /// @notice Ethereum Mainnet Key Hash - 1000 gwei gas lane (Premium)
    bytes32 internal constant ETH_MAINNET_KEY_HASH_1000_GWEI =
        0x9fe0eebf5e446e3c998ec9bb19951541aee00bb90ea201ae456421a2ded86805;

    // =========================================================================
    // Ethereum Sepolia Testnet (Chain ID: 11155111)
    // =========================================================================

    /// @notice Ethereum Sepolia VRF Coordinator v2.5
    address internal constant ETH_SEPOLIA_COORDINATOR =
        0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625;

    /// @notice Ethereum Sepolia Key Hash - 150 gwei gas lane
    bytes32 internal constant ETH_SEPOLIA_KEY_HASH =
        0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c;

    // =========================================================================
    // Arbitrum Mainnet (Chain ID: 42161)
    // =========================================================================

    /// @notice Arbitrum Mainnet VRF Coordinator v2.5
    address internal constant ARB_MAINNET_COORDINATOR =
        0x41034678D6C633D8a95c75e1138A360a28bA15d1;

    /// @notice Arbitrum Mainnet Key Hash - 50 gwei gas lane
    bytes32 internal constant ARB_MAINNET_KEY_HASH =
        0x72d2b016bb5b62912afea355ebf33b91319f828738b111b723b78696b9847b63;

    // =========================================================================
    // Arbitrum Sepolia Testnet (Chain ID: 421614)
    // =========================================================================

    /// @notice Arbitrum Sepolia VRF Coordinator v2.5
    address internal constant ARB_SEPOLIA_COORDINATOR =
        0x50d47e4142598E3411aA864e08a44284e471AC6f;

    /// @notice Arbitrum Sepolia Key Hash
    bytes32 internal constant ARB_SEPOLIA_KEY_HASH =
        0x027f94ff1465b3525f9fc03e9ff7d6d2c0953482246dd6ae07570c45d6631414;

    // =========================================================================
    // Base Mainnet (Chain ID: 8453)
    // =========================================================================

    /// @notice Base Mainnet VRF Coordinator v2.5
    address internal constant BASE_MAINNET_COORDINATOR =
        0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634;

    /// @notice Base Mainnet Key Hash - 50 gwei gas lane
    bytes32 internal constant BASE_MAINNET_KEY_HASH =
        0x00b81b5a9c259ff46cc033b8ad93e912cd32f07f90eacc8b819de8e60a7b3f9c;

    // =========================================================================
    // Base Sepolia Testnet (Chain ID: 84532)
    // =========================================================================

    /// @notice Base Sepolia VRF Coordinator v2.5
    address internal constant BASE_SEPOLIA_COORDINATOR =
        0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE;

    /// @notice Base Sepolia Key Hash
    bytes32 internal constant BASE_SEPOLIA_KEY_HASH =
        0x9e9e46732b32662b9adc6f3abdf6c5e926a666d174a4d6b8e39c4cca76a38897;

    // =========================================================================
    // Helper Functions
    // =========================================================================

    /// @notice Get configuration for Ethereum Mainnet
    function getEthereumMainnetConfig() internal pure returns (
        address coordinator,
        bytes32 keyHash
    ) {
        return (ETH_MAINNET_COORDINATOR, ETH_MAINNET_KEY_HASH_200_GWEI);
    }

    /// @notice Get configuration for Ethereum Sepolia
    function getEthereumSepoliaConfig() internal pure returns (
        address coordinator,
        bytes32 keyHash
    ) {
        return (ETH_SEPOLIA_COORDINATOR, ETH_SEPOLIA_KEY_HASH);
    }

    /// @notice Get configuration for Arbitrum Mainnet
    function getArbitrumMainnetConfig() internal pure returns (
        address coordinator,
        bytes32 keyHash
    ) {
        return (ARB_MAINNET_COORDINATOR, ARB_MAINNET_KEY_HASH);
    }

    /// @notice Get configuration for Arbitrum Sepolia
    function getArbitrumSepoliaConfig() internal pure returns (
        address coordinator,
        bytes32 keyHash
    ) {
        return (ARB_SEPOLIA_COORDINATOR, ARB_SEPOLIA_KEY_HASH);
    }

    /// @notice Get configuration for Base Mainnet
    function getBaseMainnetConfig() internal pure returns (
        address coordinator,
        bytes32 keyHash
    ) {
        return (BASE_MAINNET_COORDINATOR, BASE_MAINNET_KEY_HASH);
    }

    /// @notice Get configuration for Base Sepolia
    function getBaseSepoliaConfig() internal pure returns (
        address coordinator,
        bytes32 keyHash
    ) {
        return (BASE_SEPOLIA_COORDINATOR, BASE_SEPOLIA_KEY_HASH);
    }

    /// @notice Get configuration by chain ID
    /// @param chainId The chain ID
    /// @return coordinator The VRF Coordinator address
    /// @return keyHash The default key hash for the network
    function getConfigByChainId(uint256 chainId) internal pure returns (
        address coordinator,
        bytes32 keyHash
    ) {
        if (chainId == 1) {
            return getEthereumMainnetConfig();
        } else if (chainId == 11155111) {
            return getEthereumSepoliaConfig();
        } else if (chainId == 42161) {
            return getArbitrumMainnetConfig();
        } else if (chainId == 421614) {
            return getArbitrumSepoliaConfig();
        } else if (chainId == 8453) {
            return getBaseMainnetConfig();
        } else if (chainId == 84532) {
            return getBaseSepoliaConfig();
        } else {
            revert("ChainlinkVRFConfig: Unsupported chain ID");
        }
    }

    /// @notice Check if chain is supported
    /// @param chainId The chain ID
    /// @return supported True if chain is supported
    function isChainSupported(uint256 chainId) internal pure returns (bool supported) {
        return chainId == 1 ||          // Ethereum Mainnet
               chainId == 11155111 ||   // Ethereum Sepolia
               chainId == 42161 ||      // Arbitrum Mainnet
               chainId == 421614 ||     // Arbitrum Sepolia
               chainId == 8453 ||       // Base Mainnet
               chainId == 84532;        // Base Sepolia
    }
}
