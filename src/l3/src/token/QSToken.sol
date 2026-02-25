// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title QSToken
/// @notice Quantum Shield native token ($QS)
/// @dev ERC-20 compliant token with minting controls, cap, and pause functionality
/// @custom:security-contact security@quantumshield.io
/// @custom:ref UNIFIED_SPEC_v2.0.md §Token Design
contract QSToken {
    // ============ Constants ============
    
    /// @notice Total supply cap: 1 billion tokens
    /// @dev Per UNIFIED_SPEC_v2.0.md §Token仕様
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 1e18;
    
    /// @notice Token name
    string public constant name = "Quantum Shield";
    
    /// @notice Token symbol
    string public constant symbol = "QS";
    
    /// @notice Token decimals
    uint8 public constant decimals = 18;
    
    // ============ Storage ============
    
    /// @notice Total supply of tokens
    uint256 private _totalSupply;
    
    /// @notice Token balances
    mapping(address => uint256) private _balances;
    
    /// @notice Token allowances
    mapping(address => mapping(address => uint256)) private _allowances;
    
    /// @notice Minter role
    address private _minter;
    
    /// @notice Admin role (for minter management)
    address private _admin;
    
    /// @notice Pause state
    /// @dev TOKEN-007: Emergency pause functionality
    bool private _paused;
    
    // ============ Events ============
    
    /// @notice Emitted on token transfer
    event Transfer(address indexed from, address indexed to, uint256 value);
    
    /// @notice Emitted on approval change
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    /// @notice Emitted when minter is changed
    event MinterChanged(address indexed oldMinter, address indexed newMinter);
    
    /// @notice Emitted when admin is changed
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);
    
    /// @notice Emitted when contract is paused
    /// @dev TOKEN-007: Pause event
    event Paused(address indexed account);
    
    /// @notice Emitted when contract is unpaused
    /// @dev TOKEN-007: Unpause event
    event Unpaused(address indexed account);
    
    // ============ Errors ============
    
    /// @notice Zero address not allowed
    error ZeroAddress();
    
    /// @notice Insufficient balance
    error InsufficientBalance();
    
    /// @notice Insufficient allowance
    error InsufficientAllowance();
    
    /// @notice Exceeds max supply
    error ExceedsMaxSupply();
    
    /// @notice Caller not minter
    error NotMinter();
    
    /// @notice Caller not admin
    error NotAdmin();
    
    /// @notice Contract is paused
    /// @dev TOKEN-007: Pause error
    error EnforcedPause();
    
    /// @notice Contract is not paused
    /// @dev TOKEN-007: Expected pause error
    error ExpectedPause();
    
    // ============ Modifiers ============
    
    modifier onlyMinter() {
        if (msg.sender != _minter) revert NotMinter();
        _;
    }
    
    modifier onlyAdmin() {
        if (msg.sender != _admin) revert NotAdmin();
        _;
    }
    
    /// @notice Modifier to make a function callable only when not paused
    /// @dev TOKEN-007: whenNotPaused modifier
    modifier whenNotPaused() {
        if (_paused) revert EnforcedPause();
        _;
    }
    
    /// @notice Modifier to make a function callable only when paused
    /// @dev TOKEN-007: whenPaused modifier
    modifier whenPaused() {
        if (!_paused) revert ExpectedPause();
        _;
    }
    
    // ============ Constructor ============
    
    /// @notice Initialize QSToken
    /// @param admin_ Initial admin address
    /// @param minter_ Initial minter address
    constructor(address admin_, address minter_) {
        if (admin_ == address(0)) revert ZeroAddress();
        if (minter_ == address(0)) revert ZeroAddress();
        
        _admin = admin_;
        _minter = minter_;
        _paused = false;
    }
    
    // ============ ERC-20 Standard ============
    
    /// @notice Get total supply
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }
    
    /// @notice Get balance of account
    /// @param account Account address
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }
    
    /// @notice Get allowance
    /// @param owner Token owner
    /// @param spender Spender address
    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }
    
    /// @notice Transfer tokens
    /// @param to Recipient address
    /// @param amount Amount to transfer
    /// @return success True if successful
    function transfer(address to, uint256 amount) external whenNotPaused returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }
    
    /// @notice Approve spender
    /// @param spender Spender address
    /// @param amount Amount to approve
    /// @return success True if successful
    function approve(address spender, uint256 amount) external returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }
    
    /// @notice Transfer from another account
    /// @param from Source address
    /// @param to Destination address
    /// @param amount Amount to transfer
    /// @return success True if successful
    function transferFrom(address from, address to, uint256 amount) external whenNotPaused returns (bool) {
        uint256 currentAllowance = _allowances[from][msg.sender];
        if (currentAllowance != type(uint256).max) {
            if (currentAllowance < amount) revert InsufficientAllowance();
            unchecked {
                _allowances[from][msg.sender] = currentAllowance - amount;
            }
        }
        _transfer(from, to, amount);
        return true;
    }
    
    // ============ Minting ============
    
    /// @notice Mint new tokens
    /// @param to Recipient address
    /// @param amount Amount to mint
    function mint(address to, uint256 amount) external onlyMinter whenNotPaused {
        if (to == address(0)) revert ZeroAddress();
        if (_totalSupply + amount > MAX_SUPPLY) revert ExceedsMaxSupply();
        
        _totalSupply += amount;
        _balances[to] += amount;
        
        emit Transfer(address(0), to, amount);
    }
    
    /// @notice Burn tokens from caller
    /// @param amount Amount to burn
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
    
    /// @notice Burn tokens from account (requires allowance)
    /// @param from Account to burn from
    /// @param amount Amount to burn
    function burnFrom(address from, uint256 amount) external {
        uint256 currentAllowance = _allowances[from][msg.sender];
        if (currentAllowance != type(uint256).max) {
            if (currentAllowance < amount) revert InsufficientAllowance();
            unchecked {
                _allowances[from][msg.sender] = currentAllowance - amount;
            }
        }
        _burn(from, amount);
    }
    
    // ============ Admin Functions ============
    
    /// @notice Set new minter
    /// @param newMinter New minter address
    function setMinter(address newMinter) external onlyAdmin {
        if (newMinter == address(0)) revert ZeroAddress();
        
        address oldMinter = _minter;
        _minter = newMinter;
        
        emit MinterChanged(oldMinter, newMinter);
    }
    
    /// @notice Set new admin
    /// @param newAdmin New admin address
    function setAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert ZeroAddress();
        
        address oldAdmin = _admin;
        _admin = newAdmin;
        
        emit AdminChanged(oldAdmin, newAdmin);
    }
    
    /// @notice Get minter address
    function minter() external view returns (address) {
        return _minter;
    }
    
    /// @notice Get admin address
    function admin() external view returns (address) {
        return _admin;
    }
    
    // ============ Pause Functions ============
    
    /// @notice Pause the contract
    /// @dev TOKEN-007: Only admin can pause
    function pause() external onlyAdmin whenNotPaused {
        _paused = true;
        emit Paused(msg.sender);
    }
    
    /// @notice Unpause the contract
    /// @dev TOKEN-007: Only admin can unpause
    function unpause() external onlyAdmin whenPaused {
        _paused = false;
        emit Unpaused(msg.sender);
    }
    
    /// @notice Check if contract is paused
    /// @return True if paused
    function paused() external view returns (bool) {
        return _paused;
    }
    
    // ============ Internal Functions ============
    
    function _transfer(address from, address to, uint256 amount) internal {
        if (from == address(0)) revert ZeroAddress();
        if (to == address(0)) revert ZeroAddress();
        
        uint256 fromBalance = _balances[from];
        if (fromBalance < amount) revert InsufficientBalance();
        
        unchecked {
            _balances[from] = fromBalance - amount;
            _balances[to] += amount;
        }
        
        emit Transfer(from, to, amount);
    }
    
    function _approve(address owner, address spender, uint256 amount) internal {
        if (owner == address(0)) revert ZeroAddress();
        if (spender == address(0)) revert ZeroAddress();
        
        _allowances[owner][spender] = amount;
        
        emit Approval(owner, spender, amount);
    }
    
    function _burn(address from, uint256 amount) internal {
        if (from == address(0)) revert ZeroAddress();
        
        uint256 fromBalance = _balances[from];
        if (fromBalance < amount) revert InsufficientBalance();
        
        unchecked {
            _balances[from] = fromBalance - amount;
            _totalSupply -= amount;
        }
        
        emit Transfer(from, address(0), amount);
    }
}
