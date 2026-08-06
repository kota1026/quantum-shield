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

    /// @notice Maximum active provers (bounds the per-change commitment
    ///         recomputation gas — FR-THRESH-5)
    uint256 public constant MAX_ACTIVE_PROVERS = 64;

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

    // ------------------------------------------------------------------
    // Active set commitment (FR-THRESH-5)
    //
    // The active prover set is committed to as a dense merkle tree whose
    // leaves bind (proverAddress, sphincsPubKeyHash). STARK proofs for
    // threshold verification (FR-THRESH-1) take the commitment as a public
    // input and prove in-circuit that every signer's public key belongs to
    // the committed set. Checkpoints keep every historical commitment so a
    // proof can reference the set "as of" the epoch current when signatures
    // were collected.
    //
    // Hashing: the tree structure uses EVM-native keccak256 (documented
    // L1-contract exception to CP-1 — a pure-Solidity SHA3-256 costs ~1M gas
    // per hash, making an O(n) recompute per membership change infeasible).
    // The circuit side proves the same Keccak-f[1600] permutation via
    // keccak-air, so circuit cost is identical to SHA3-256. The leaf payload
    // sphincsPubKeyHash itself remains SHA3-256 (CP-1) as before.
    // ------------------------------------------------------------------

    /// @notice Current active set epoch (increments on every set change)
    uint64 public activeSetEpoch;

    /// @notice Checkpoint per epoch
    mapping(uint64 => SetCheckpoint) internal setCheckpoints;

    /// @notice Every commitment that was current at some epoch
    mapping(bytes32 => bool) internal knownCommitments;

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
    error ActiveProverSetFull();

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

        // Epoch 0 = empty set, so isKnownActiveSetCommitment is total over
        // every epoch that ever existed
        _writeActiveSetCheckpoint();
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
        if (activeProverList.length >= MAX_ACTIVE_PROVERS) revert ActiveProverSetFull();

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
        _bumpActiveSet();

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
        if (activeProverList.length >= MAX_ACTIVE_PROVERS) revert ActiveProverSetFull();

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
        _bumpActiveSet();

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
        _bumpActiveSet();

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
        if (data.stakedAmount < MIN_STAKE_MAINNET && !testnetMode && data.isActive) {
            data.isActive = false;
            data.status = ProverStatus.SLASHED;
            _removeFromActiveList(proverAddress);
            _bumpActiveSet();
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
    // Active Set Commitment (FR-THRESH-5)
    // =========================================================================

    /// @notice Domain separator for leaf hashing
    function LEAF_DOMAIN() public pure returns (bytes32) {
        return keccak256("QS_PROVER_SET_LEAF_V1");
    }

    /// @notice Domain separator for internal node hashing
    function NODE_DOMAIN() public pure returns (bytes32) {
        return keccak256("QS_PROVER_SET_NODE_V1");
    }

    /// @notice Domain separator for the final commitment
    function SET_DOMAIN() public pure returns (bytes32) {
        return keccak256("QS_PROVER_SET_V1");
    }

    /// @inheritdoc IProverRegistry
    function getActiveSetCommitment()
        external
        view
        returns (bytes32 commitment, uint64 epoch)
    {
        epoch = activeSetEpoch;
        commitment = setCheckpoints[epoch].commitment;
    }

    /// @inheritdoc IProverRegistry
    function getActiveSetCheckpoint(uint64 epoch)
        external
        view
        returns (SetCheckpoint memory checkpoint)
    {
        return setCheckpoints[epoch];
    }

    /// @inheritdoc IProverRegistry
    function isKnownActiveSetCommitment(bytes32 commitment)
        external
        view
        returns (bool known)
    {
        return knownCommitments[commitment];
    }

    /// @notice Compute the leaf for one active prover
    /// @dev leaf = keccak256(LEAF_DOMAIN ‖ proverAddress ‖ sphincsPubKeyHash).
    ///      Never bytes32(0), so padding leaves cannot collide with real ones
    function computeSetLeaf(address proverAddress, bytes32 sphincsPubKeyHash)
        public
        pure
        returns (bytes32 leaf)
    {
        return keccak256(abi.encodePacked(LEAF_DOMAIN(), proverAddress, sphincsPubKeyHash));
    }

    /// @notice Recompute root + commitment over the current active list
    /// @dev Dense merkle tree in activeProverList order, zero-padded to the
    ///      next power of two. commitment additionally binds the prover count
    ///      so a padded and an unpadded set can never share a commitment.
    ///      Empty set: root = bytes32(0)
    function computeActiveSetCommitment()
        public
        view
        returns (bytes32 root, bytes32 commitment)
    {
        uint256 count = activeProverList.length;

        uint256 width = 1;
        while (width < count) {
            width <<= 1;
        }

        bytes32[] memory nodes = new bytes32[](width);
        for (uint256 i = 0; i < count; i++) {
            address prover = activeProverList[i];
            nodes[i] = computeSetLeaf(prover, proverData[prover].sphincsPubKeyHash);
        }
        // nodes[count..width) stay bytes32(0) (padding)

        bytes32 nodeDomain = NODE_DOMAIN();
        while (width > 1) {
            width >>= 1;
            for (uint256 i = 0; i < width; i++) {
                nodes[i] = keccak256(
                    abi.encodePacked(nodeDomain, nodes[2 * i], nodes[2 * i + 1])
                );
            }
        }

        root = count == 0 ? bytes32(0) : nodes[0];
        commitment = keccak256(abi.encodePacked(SET_DOMAIN(), root, count));
    }

    /// @notice Advance the epoch and checkpoint the new active set
    function _bumpActiveSet() internal {
        activeSetEpoch += 1;
        _writeActiveSetCheckpoint();
    }

    /// @notice Checkpoint the current active set at the current epoch
    function _writeActiveSetCheckpoint() internal {
        (bytes32 root, bytes32 commitment) = computeActiveSetCommitment();
        setCheckpoints[activeSetEpoch] = SetCheckpoint({
            commitment: commitment,
            root: root,
            blockNumber: uint64(block.number),
            proverCount: uint32(activeProverList.length)
        });
        knownCommitments[commitment] = true;

        emit ActiveSetCommitmentUpdated(
            activeSetEpoch,
            commitment,
            root,
            activeProverList.length,
            block.number
        );
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
