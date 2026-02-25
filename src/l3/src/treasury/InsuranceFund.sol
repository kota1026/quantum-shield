// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title InsuranceFund
 * @notice Insurance fund for slashing proceeds
 * @dev Receives 20% of slashed amounts for user protection
 */
contract InsuranceFund {
    address public admin;
    
    event FundsReceived(address indexed from, uint256 amount);
    event FundsWithdrawn(address indexed to, uint256 amount);
    
    constructor(address _admin) {
        admin = _admin;
    }
    
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }
    
    function withdraw(address to, uint256 amount) external {
        require(msg.sender == admin, "Only admin");
        require(address(this).balance >= amount, "Insufficient balance");
        
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FundsWithdrawn(to, amount);
    }
    
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
