// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "lib/openzeppelin-contracts/contracts/utils/Pausable.sol";
import {IProverRegistry} from "./interfaces/IProverRegistry.sol";
import {SHA3_256} from "./libraries/SHA3_256.sol";

/// @title ProverRegistry - Quantum Shield Prover Management Contract
/// @notice Manages Prover registration, staking, and slashing separately from L1 Vault
/// @dev SEQUENCES.md v3.0: Separated from L1 Vault for architectural flexibility
///
/// Key Design Principles:
/// - Prover management is independent of asset custody (L1 Vault)
/// - Dynamic prover participation (N provers can join/exit)
/// - Unbonding period prevents instant exit after malicious behavior
/// - Slashing is delegated to authorized contracts (L1 Vault, Security Council)
contract ProverRegistry is IProverRegistry, ReentrancyGuard, Pausable {
    // =========================================================================
    // Constants
    // =========================================================================

    /// @notice Minimum stake required for mainnet (1 ETH for testing, $400K USD for production)
    uint256 public constant MIN_STAKE_MAINNET = 1 ether;

    /// @notice Unbonding period before stake can be withdrawn
    uint256 public constant UNBONDING_PERIOD = 7 days;

    /// @notice Required SPHINCS+ public key length
    uint256 public constant SPHINCS_PUBKEY_LENGTH = 32;

    // =========================================================================
    // State Variables
    // =========================================================================

    /// @notice Contract owner
    address public owner;

    /// @notice Security council for emergency actions
    address public securityCouncil;

    /// @notice Authorized slashers (L1 Vault, etc.)
    mapping(address => bool) public authorizedSlashers;

    /// @notice Prover data by address
    mapping(address => ProverData) internal proverData;

    /// @notice Active prover addresses
    address[] public activeProverList;

    /// @notice Mapping from address to index in activeProverList (for O(1) removal)
    mapping(address => uint256) internal proverIndex;

    /// @notice Total staked amount
    uint256 public totalStaked;

    /// @notice Insurance fund from slashing
    uint256 public insuranceFund;

    /// @notice Testnet mode flag (allows registration without stake)
    bool public testnetMode;

    // =========================================================================
    // Structs
    // =========================================================================

    /// @notice Extended prover data for internal tracking
    struct ProverData {
        address proverAddress;
        bytes32 sphincsPubKeyHash;
        bytes sphincsPublicKey;
        uint256 stakedAmount;
        uint256 registeredAt;
        bool isActive;
        uint256 successfulSigns;
        uint256 slashedCount;
        uint256 unbondingStartedAt;
        ProverStatus status;
    }

    // =========================================================================
    // Errors
    // =========================================================================

    error NotOwner();
    error NotSecurityCouncil();
    error NotAuthorizedSlasher();
    error ZeroAddress();
    error InsufficientStake();
    error InvalidPublicKeyLength();
    error ProverAlreadyRegistered();
    error ProverNotFound();
    error ProverNotActive();
    error ProverNotUnbonding();
    error UnbondingNotComplete();
    error TransferFailed();
    error AlreadyUnbonding();

    // =========================================================================
    // Modifiers
    // =========================================================================

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlySecurityCouncil() {
        if (msg.sender != securityCouncil) revert NotSecurityCouncil();
        _;
    }

    modifier onlyAuthorizedSlasher() {
        if (!authorizedSlashers[msg.sender] && msg.sender != securityCouncil) {
            revert NotAuthorizedSlasher();
        }
        _;
    }

    // =========================================================================
    // Constructor
    // =========================================================================

    /// @notice Initialize the Prover Registry
    /// @param _securityCouncil Security council address
    /// @param _testnetMode Enable testnet mode (no stake required)
    constructor(address _securityCouncil, bool _testnetMode) {
        if (_securityCouncil == address(0)) revert ZeroAddress();
        owner = msg.sender;
        securityCouncil = _securityCouncil;
        testnetMode = _testnetMode;
    }

    // =========================================================================
    // Registration Functions
    // =========================================================================

    /// @inheritdoc IProverRegistry
    function registerProver(bytes calldata sphincsPublicKey)
        external
        payable
        whenNotPaused
        nonReentrant
        returns (bool success)
    {
        if (proverData[msg.sender].status != ProverStatus.NONE) revert ProverAlreadyRegistered();
        if (sphincsPublicKey.length != SPHINCS_PUBKEY_LENGTH) revert InvalidPublicKeyLength();

        uint256 requiredStake = testnetMode ? 0 : MIN_STAKE_MAINNET;
        if (msg.value < requiredStake) revert InsufficientStake();

        bytes32 pubKeyHash = SHA3_256.hash(sphincsPublicKey);

        proverData[msg.sender] = ProverData({
            proverAddress: msg.sender,
            sphincsPubKeyHash: pubKeyHash,
            sphincsPublicKey: sphincsPublicKey,
            stakedAmount: msg.value,
            registeredAt: block.timestamp,
            isActive: true,
            successfulSigns: 0,
            slashedCount: 0,
            unbondingStartedAt: 0,
            status: ProverStatus.ACTIVE
        });

        proverIndex[msg.sender] = activeProverList.length;
        activeProverList.push(msg.sender);
        totalStaked += msg.value;

        emit ProverRegistered(msg.sender, pubKeyHash, msg.value);
        return true;
    }

    /// @inheritdoc IProverRegistry
    function registerProverTestnet(address proverAddress, bytes calldata sphincsPublicKey)
        external
        onlyOwner
    {
        if (proverAddress == address(0)) revert ZeroAddress();
        if (proverData[proverAddress].status != ProverStatus.NONE) revert ProverAlreadyRegistered();
        if (sphincsPublicKey.length != SPHINCS_PUBKEY_LENGTH) revert InvalidPublicKeyLength();

        bytes32 pubKeyHash = SHA3_256.hash(sphincsPublicKey);

        proverData[proverAddress] = ProverData({
            proverAddress: proverAddress,
            sphincsPubKeyHash: pubKeyHash,
            sphincsPublicKey: sphincsPublicKey,
            stakedAmount: 0,
            registeredAt: block.timestamp,
            isActive: true,
            successfulSigns: 0,
            slashedCount: 0,
            unbondingStartedAt: 0,
            status: ProverStatus.ACTIVE
        });

        proverIndex[proverAddress] = activeProverList.length;
        activeProverList.push(proverAddress);

        emit ProverRegistered(proverAddress, pubKeyHash, 0);
    }

    /// @inheritdoc IProverRegistry
    function requestExit() external whenNotPaused nonReentrant {
        ProverData storage data = proverData[msg.sender];
        if (data.status != ProverStatus.ACTIVE) revert ProverNotActive();

        data.isActive = false;
        data.status = ProverStatus.UNBONDING;
        data.unbondingStartedAt = block.timestamp;

        _removeFromActiveList(msg.sender);

        emit ProverExitRequested(msg.sender, block.timestamp + UNBONDING_PERIOD);
    }

    /// @inheritdoc IProverRegistry
    function completeExit() external nonReentrant {
        ProverData storage data = proverData[msg.sender];
        if (data.status != ProverStatus.UNBONDING) revert ProverNotUnbonding();
        if (block.timestamp < data.unbondingStartedAt + UNBONDING_PERIOD) {
            revert UnbondingNotComplete();
        }

        uint256 stakeToReturn = data.stakedAmount;
        data.stakedAmount = 0;
        data.status = ProverStatus.NONE;
        totalStaked -= stakeToReturn;

        if (stakeToReturn > 0) {
            (bool success, ) = msg.sender.call{value: stakeToReturn}("");
            if (!success) revert TransferFailed();
        }

        emit ProverExited(msg.sender, stakeToReturn);
    }

    // =========================================================================
    // View Functions
    // =========================================================================

    /// @inheritdoc IProverRegistry
    function getProver(address proverAddress)
        external
        view
        returns (Prover memory prover)
    {
        ProverData storage data = proverData[proverAddress];
        return Prover({
            proverAddress: data.proverAddress,
            sphincsPubKeyHash: data.sphincsPubKeyHash,
            sphincsPublicKey: data.sphincsPublicKey,
            stakedAmount: data.stakedAmount,
            registeredAt: data.registeredAt,
            isActive: data.isActive,
            successfulSigns: data.successfulSigns,
            slashedCount: data.slashedCount
        });
    }

    /// @inheritdoc IProverRegistry
    function getPublicKey(address proverAddress)
        external
        view
        returns (bytes memory publicKey)
    {
        return proverData[proverAddress].sphincsPublicKey;
    }

    /// @inheritdoc IProverRegistry
    function getPublicKeyHash(address proverAddress)
        external
        view
        returns (bytes32 pubKeyHash)
    {
        return proverData[proverAddress].sphincsPubKeyHash;
    }

    /// @inheritdoc IProverRegistry
    function isActiveProver(address proverAddress)
        external
        view
        returns (bool)
    {
        return proverData[proverAddress].isActive;
    }

    /// @inheritdoc IProverRegistry
    function getActiveProvers()
        external
        view
        returns (address[] memory provers)
    {
        return activeProverList;
    }

    /// @inheritdoc IProverRegistry
    function getActiveProverCount()
        external
        view
        returns (uint256 count)
    {
        return activeProverList.length;
    }

    /// @inheritdoc IProverRegistry
    function getMinStake()
        external
        view
        returns (uint256 minStake)
    {
        return testnetMode ? 0 : MIN_STAKE_MAINNET;
    }

    /// @inheritdoc IProverRegistry
    function getUnbondingPeriod()
        external
        pure
        returns (uint256 period)
    {
        return UNBONDING_PERIOD;
    }

    // =========================================================================
    // Slashing Functions
    // =========================================================================

    /// @inheritdoc IProverRegistry
    function slash(address proverAddress, uint256 amount, bytes32 reason)
        external
        onlyAuthorizedSlasher
        nonReentrant
    {
        ProverData storage data = proverData[proverAddress];
        if (data.proverAddress == address(0)) revert ProverNotFound();

        uint256 actualSlash = amount > data.stakedAmount ? data.stakedAmount : amount;
        data.stakedAmount -= actualSlash;
        data.slashedCount++;
        totalStaked -= actualSlash;
        insuranceFund += actualSlash;

        // If stake falls below minimum, deactivate prover
        if (data.stakedAmount < MIN_STAKE_MAINNET && !testnetMode) {
            data.isActive = false;
            data.status = ProverStatus.SLASHED;
            _removeFromActiveList(proverAddress);
        }

        emit ProverSlashed(proverAddress, actualSlash, reason);
    }

    // =========================================================================
    // Admin Functions
    // =========================================================================

    /// @notice Add an authorized slasher
    function addAuthorizedSlasher(address slasher) external onlyOwner {
        if (slasher == address(0)) revert ZeroAddress();
        authorizedSlashers[slasher] = true;
    }

    /// @notice Remove an authorized slasher
    function removeAuthorizedSlasher(address slasher) external onlyOwner {
        authorizedSlashers[slasher] = false;
    }

    /// @notice Pause the registry
    function pause() external onlySecurityCouncil {
        _pause();
    }

    /// @notice Unpause the registry
    function unpause() external onlySecurityCouncil {
        _unpause();
    }

    /// @notice Transfer ownership
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        owner = newOwner;
    }

    /// @notice Update security council
    function updateSecurityCouncil(address newCouncil) external onlySecurityCouncil {
        if (newCouncil == address(0)) revert ZeroAddress();
        securityCouncil = newCouncil;
    }

    /// @notice Withdraw insurance fund to treasury
    function withdrawInsuranceFund(address treasury, uint256 amount)
        external
        onlySecurityCouncil
        nonReentrant
    {
        if (treasury == address(0)) revert ZeroAddress();
        if (amount > insuranceFund) amount = insuranceFund;
        insuranceFund -= amount;
        (bool success, ) = treasury.call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    // =========================================================================
    // Internal Functions
    // =========================================================================

    /// @notice Remove a prover from the active list
    function _removeFromActiveList(address proverAddress) internal {
        uint256 index = proverIndex[proverAddress];
        uint256 lastIndex = activeProverList.length - 1;

        if (index != lastIndex) {
            address lastProver = activeProverList[lastIndex];
            activeProverList[index] = lastProver;
            proverIndex[lastProver] = index;
        }

        activeProverList.pop();
        delete proverIndex[proverAddress];
    }

    /// @notice Receive ETH
    receive() external payable {}
}
