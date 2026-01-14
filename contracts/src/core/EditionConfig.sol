// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title EditionConfig
/// @notice Edition configuration management for Quantum Shield (Enterprise/Decentralized)
/// @dev Implements EDITION_SWITCH_SPEC.md §3, §8
/// @dev Separates edition concept from GovernanceSwitch governance modes
/// @custom:security-contact security@quantumshield.io
/// @custom:ref EDITION_SWITCH_SPEC.md, 26_phase5_planner.md TASK-P5-010
contract EditionConfig {
    // ============ Enums ============

    /// @notice Product edition type
    /// @dev ENTERPRISE: For financial institutions, banks (fixed 4BFT, contract-based)
    /// @dev DECENTRALIZED: For DeFi, bridges (progressive decentralization)
    enum Edition {
        ENTERPRISE,
        DECENTRALIZED
    }

    /// @notice Consensus type for L3 nodes
    /// @dev FIXED_4BFT: Fixed 4-node BFT (Phase 1-3)
    /// @dev DYNAMIC_PBFT: Dynamic PBFT with variable nodes (Phase 4+)
    enum ConsensusType {
        FIXED_4BFT,
        DYNAMIC_PBFT
    }

    /// @notice Prover approval mode
    /// @dev CONTRACT_BASED: Legal contract + manual approval (Enterprise)
    /// @dev FOUNDATION_INVITE: Foundation invitation (Decen Phase 1-2)
    /// @dev COUNCIL_VOTE: Council 3/9 voting (Decen Phase 3)
    /// @dev STAKE_AUTO: Stake-based auto approval (Decen Phase 4+)
    enum ProverApprovalMode {
        CONTRACT_BASED,
        FOUNDATION_INVITE,
        COUNCIL_VOTE,
        STAKE_AUTO
    }

    // ============ Structs ============

    /// @notice Node configuration settings
    struct NodeConfig {
        uint8 minNodes;           // Minimum node count
        uint8 maxNodes;           // Maximum node count
        bool dynamicMembership;   // Whether dynamic node addition is allowed
        ConsensusType consensus;  // BFT consensus type
    }

    /// @notice Complete edition settings
    struct Settings {
        Edition edition;
        NodeConfig nodeConfig;
        ProverApprovalMode proverApprovalMode;
        bool governanceEnabled;
    }

    // ============ Constants ============

    /// @notice Minimum nodes for any configuration
    uint8 public constant MIN_NODES = 4;

    /// @notice Maximum nodes for DYNAMIC_PBFT
    uint8 public constant MAX_DYNAMIC_NODES = 21;

    /// @notice Fixed nodes for Enterprise/FIXED_4BFT
    uint8 public constant FIXED_NODE_COUNT = 4;

    // ============ Errors ============

    /// @notice Thrown when caller is not authorized
    error Unauthorized();

    /// @notice Thrown when edition transition is invalid
    error InvalidEditionTransition(Edition from, Edition to);

    /// @notice Thrown when attempting same edition
    error SameEdition();

    /// @notice Thrown when Enterprise constraints are violated
    error EnterpriseConstraintViolation(string reason);

    /// @notice Thrown when node configuration is invalid
    error InvalidNodeConfig(string reason);

    /// @notice Thrown when prover approval mode is invalid for edition
    error InvalidProverApprovalMode(Edition edition, ProverApprovalMode mode);

    /// @notice Thrown when zero address is provided
    error ZeroAddress();

    // ============ Events ============

    /// @notice Emitted when edition is changed
    event EditionChanged(Edition indexed oldEdition, Edition indexed newEdition, address indexed changedBy);

    /// @notice Emitted when node configuration is changed
    event NodeConfigChanged(
        uint8 oldMinNodes,
        uint8 oldMaxNodes,
        bool oldDynamicMembership,
        ConsensusType oldConsensus,
        uint8 newMinNodes,
        uint8 newMaxNodes,
        bool newDynamicMembership,
        ConsensusType newConsensus
    );

    /// @notice Emitted when prover approval mode is changed
    event ProverApprovalModeChanged(
        ProverApprovalMode indexed oldMode,
        ProverApprovalMode indexed newMode,
        address indexed changedBy
    );

    /// @notice Emitted when governance is enabled/disabled
    event GovernanceEnabledChanged(bool oldValue, bool newValue);

    /// @notice Emitted when owner is changed
    event OwnerChanged(address indexed oldOwner, address indexed newOwner);

    // ============ State Variables ============

    /// @notice Current edition settings
    Settings private _settings;

    /// @notice Contract owner (for initial setup, later delegated to governance)
    address private _owner;

    /// @notice Pending owner for two-step transfer
    address private _pendingOwner;

    // ============ Constructor ============

    /// @notice Initialize EditionConfig with initial edition
    /// @param initialOwner_ Initial owner address
    /// @param initialEdition_ Initial edition (ENTERPRISE or DECENTRALIZED)
    constructor(address initialOwner_, Edition initialEdition_) {
        if (initialOwner_ == address(0)) revert ZeroAddress();

        _owner = initialOwner_;

        if (initialEdition_ == Edition.ENTERPRISE) {
            _settings = Settings({
                edition: Edition.ENTERPRISE,
                nodeConfig: NodeConfig({
                    minNodes: FIXED_NODE_COUNT,
                    maxNodes: FIXED_NODE_COUNT,
                    dynamicMembership: false,
                    consensus: ConsensusType.FIXED_4BFT
                }),
                proverApprovalMode: ProverApprovalMode.CONTRACT_BASED,
                governanceEnabled: false
            });
        } else {
            // DECENTRALIZED starts with Phase 1-2 settings
            _settings = Settings({
                edition: Edition.DECENTRALIZED,
                nodeConfig: NodeConfig({
                    minNodes: FIXED_NODE_COUNT,
                    maxNodes: FIXED_NODE_COUNT,
                    dynamicMembership: false,
                    consensus: ConsensusType.FIXED_4BFT
                }),
                proverApprovalMode: ProverApprovalMode.FOUNDATION_INVITE,
                governanceEnabled: true
            });
        }
    }

    // ============ Modifiers ============

    /// @notice Restrict to owner only
    modifier onlyOwner() {
        if (msg.sender != _owner) revert Unauthorized();
        _;
    }

    // ============ Owner Management ============

    /// @notice Get current owner
    function owner() external view returns (address) {
        return _owner;
    }

    /// @notice Get pending owner
    function pendingOwner() external view returns (address) {
        return _pendingOwner;
    }

    /// @notice Initiate ownership transfer (two-step)
    /// @param newOwner New owner address
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        _pendingOwner = newOwner;
    }

    /// @notice Accept ownership transfer
    function acceptOwnership() external {
        if (msg.sender != _pendingOwner) revert Unauthorized();

        address oldOwner = _owner;
        _owner = _pendingOwner;
        _pendingOwner = address(0);

        emit OwnerChanged(oldOwner, _owner);
    }

    // ============ Edition Management ============

    /// @notice Switch between editions
    /// @param newEdition Target edition
    /// @dev Enterprise -> Decentralized allowed, reverse requires careful consideration
    function switchEdition(Edition newEdition) external onlyOwner {
        if (_settings.edition == newEdition) revert SameEdition();

        Edition oldEdition = _settings.edition;
        _settings.edition = newEdition;

        // Decentralized transition enables governance
        if (newEdition == Edition.DECENTRALIZED) {
            bool oldGov = _settings.governanceEnabled;
            _settings.governanceEnabled = true;

            // Reset to Phase 1-2 settings for Decentralized
            _settings.proverApprovalMode = ProverApprovalMode.FOUNDATION_INVITE;

            emit GovernanceEnabledChanged(oldGov, true);
        }

        // Enterprise transition enforces constraints
        if (newEdition == Edition.ENTERPRISE) {
            // Reset to Enterprise defaults
            _settings.nodeConfig = NodeConfig({
                minNodes: FIXED_NODE_COUNT,
                maxNodes: FIXED_NODE_COUNT,
                dynamicMembership: false,
                consensus: ConsensusType.FIXED_4BFT
            });
            _settings.proverApprovalMode = ProverApprovalMode.CONTRACT_BASED;

            // Enterprise can optionally disable governance
            // (not forced here, but typically would be MULTISIG max)
        }

        emit EditionChanged(oldEdition, newEdition, msg.sender);
    }

    // ============ Node Configuration ============

    /// @notice Update node configuration (Phase 4 transition)
    /// @param newConfig New node configuration
    /// @dev Enterprise: dynamic membership not allowed, max nodes must be 4
    function updateNodeConfig(NodeConfig calldata newConfig) external onlyOwner {
        // Validate minimum nodes
        if (newConfig.minNodes < MIN_NODES) {
            revert InvalidNodeConfig("minNodes must be >= 4");
        }

        // Validate max >= min
        if (newConfig.maxNodes < newConfig.minNodes) {
            revert InvalidNodeConfig("maxNodes must be >= minNodes");
        }

        // Validate max nodes for dynamic PBFT
        if (newConfig.dynamicMembership && newConfig.maxNodes > MAX_DYNAMIC_NODES) {
            revert InvalidNodeConfig("maxNodes exceeds maximum for dynamic PBFT");
        }

        // Enterprise constraints
        if (_settings.edition == Edition.ENTERPRISE) {
            if (newConfig.dynamicMembership) {
                revert EnterpriseConstraintViolation("dynamic membership not allowed");
            }
            if (newConfig.maxNodes != FIXED_NODE_COUNT) {
                revert EnterpriseConstraintViolation("max nodes must be 4");
            }
            if (newConfig.consensus != ConsensusType.FIXED_4BFT) {
                revert EnterpriseConstraintViolation("only FIXED_4BFT allowed");
            }
        }

        // Validate consensus type with dynamic membership
        if (newConfig.dynamicMembership && newConfig.consensus != ConsensusType.DYNAMIC_PBFT) {
            revert InvalidNodeConfig("dynamic membership requires DYNAMIC_PBFT");
        }

        NodeConfig memory oldConfig = _settings.nodeConfig;

        emit NodeConfigChanged(
            oldConfig.minNodes,
            oldConfig.maxNodes,
            oldConfig.dynamicMembership,
            oldConfig.consensus,
            newConfig.minNodes,
            newConfig.maxNodes,
            newConfig.dynamicMembership,
            newConfig.consensus
        );

        _settings.nodeConfig = newConfig;
    }

    // ============ Prover Approval Mode ============

    /// @notice Update prover approval mode
    /// @param newMode New prover approval mode
    /// @dev Enterprise: CONTRACT_BASED only
    /// @dev Decentralized: FOUNDATION_INVITE -> COUNCIL_VOTE -> STAKE_AUTO
    function updateProverApprovalMode(ProverApprovalMode newMode) external onlyOwner {
        // Enterprise constraint
        if (_settings.edition == Edition.ENTERPRISE) {
            if (newMode != ProverApprovalMode.CONTRACT_BASED) {
                revert InvalidProverApprovalMode(Edition.ENTERPRISE, newMode);
            }
        }

        ProverApprovalMode oldMode = _settings.proverApprovalMode;
        _settings.proverApprovalMode = newMode;

        emit ProverApprovalModeChanged(oldMode, newMode, msg.sender);
    }

    /// @notice Enable or disable governance
    /// @param enabled Whether governance should be enabled
    /// @dev Enterprise may disable governance, Decentralized typically keeps it enabled
    function setGovernanceEnabled(bool enabled) external onlyOwner {
        bool oldValue = _settings.governanceEnabled;
        _settings.governanceEnabled = enabled;

        emit GovernanceEnabledChanged(oldValue, enabled);
    }

    // ============ View Functions ============

    /// @notice Get complete current settings
    function getSettings() external view returns (Settings memory) {
        return _settings;
    }

    /// @notice Get current edition
    function getEdition() external view returns (Edition) {
        return _settings.edition;
    }

    /// @notice Get current node configuration
    function getNodeConfig() external view returns (NodeConfig memory) {
        return _settings.nodeConfig;
    }

    /// @notice Get current prover approval mode
    function getProverApprovalMode() external view returns (ProverApprovalMode) {
        return _settings.proverApprovalMode;
    }

    /// @notice Check if this is Enterprise edition
    function isEnterprise() external view returns (bool) {
        return _settings.edition == Edition.ENTERPRISE;
    }

    /// @notice Check if this is Decentralized edition
    function isDecentralized() external view returns (bool) {
        return _settings.edition == Edition.DECENTRALIZED;
    }

    /// @notice Check if dynamic membership is enabled
    function isDynamicMembershipEnabled() external view returns (bool) {
        return _settings.nodeConfig.dynamicMembership;
    }

    /// @notice Check if governance is enabled
    function isGovernanceEnabled() external view returns (bool) {
        return _settings.governanceEnabled;
    }

    /// @notice Get consensus type
    function getConsensusType() external view returns (ConsensusType) {
        return _settings.nodeConfig.consensus;
    }

    /// @notice Calculate BFT threshold based on current node config
    /// @return threshold Required honest nodes (2n/3 + 1)
    function calculateBftThreshold() external view returns (uint8) {
        uint8 n = _settings.nodeConfig.maxNodes;
        // BFT: f < n/3, so honest nodes needed = 2f + 1 = (2n + 2) / 3
        return uint8((2 * uint16(n) + 2) / 3);
    }

    /// @notice Check if current configuration allows a specific prover approval mode
    /// @param mode Prover approval mode to check
    function isProverApprovalModeAllowed(ProverApprovalMode mode) external view returns (bool) {
        if (_settings.edition == Edition.ENTERPRISE) {
            return mode == ProverApprovalMode.CONTRACT_BASED;
        }
        // Decentralized allows all modes
        return true;
    }

    /// @notice Check if node config change is valid
    /// @param newConfig Proposed node configuration
    function isNodeConfigChangeValid(NodeConfig calldata newConfig) external view returns (bool, string memory) {
        if (newConfig.minNodes < MIN_NODES) {
            return (false, "minNodes must be >= 4");
        }
        if (newConfig.maxNodes < newConfig.minNodes) {
            return (false, "maxNodes must be >= minNodes");
        }
        if (newConfig.dynamicMembership && newConfig.maxNodes > MAX_DYNAMIC_NODES) {
            return (false, "maxNodes exceeds maximum for dynamic PBFT");
        }
        if (_settings.edition == Edition.ENTERPRISE) {
            if (newConfig.dynamicMembership) {
                return (false, "Enterprise: dynamic membership not allowed");
            }
            if (newConfig.maxNodes != FIXED_NODE_COUNT) {
                return (false, "Enterprise: max nodes must be 4");
            }
            if (newConfig.consensus != ConsensusType.FIXED_4BFT) {
                return (false, "Enterprise: only FIXED_4BFT allowed");
            }
        }
        if (newConfig.dynamicMembership && newConfig.consensus != ConsensusType.DYNAMIC_PBFT) {
            return (false, "dynamic membership requires DYNAMIC_PBFT");
        }
        return (true, "");
    }
}
