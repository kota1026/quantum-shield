// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "src/token/QSToken.sol";

/// @title QSTokenTest
/// @notice Unit tests for QSToken (TOKEN-001)
contract QSTokenTest is Test {
    QSToken public token;
    
    address public admin = address(0x1);
    address public minter = address(0x2);
    address public user1 = address(0x3);
    address public user2 = address(0x4);
    
    function setUp() public {
        token = new QSToken(admin, minter);
    }
    
    // ============ Constructor Tests ============
    
    function test_constructor() public {
        assertEq(token.name(), "Quantum Shield");
        assertEq(token.symbol(), "QS");
        assertEq(token.decimals(), 18);
        assertEq(token.admin(), admin);
        assertEq(token.minter(), minter);
        assertEq(token.totalSupply(), 0);
    }
    
    function test_constructor_zeroAdmin_reverts() public {
        vm.expectRevert(QSToken.ZeroAddress.selector);
        new QSToken(address(0), minter);
    }
    
    function test_constructor_zeroMinter_reverts() public {
        vm.expectRevert(QSToken.ZeroAddress.selector);
        new QSToken(admin, address(0));
    }
    
    // ============ Mint Tests ============
    
    function test_mint() public {
        vm.prank(minter);
        token.mint(user1, 1000 * 1e18);
        
        assertEq(token.balanceOf(user1), 1000 * 1e18);
        assertEq(token.totalSupply(), 1000 * 1e18);
    }
    
    function test_mint_notMinter_reverts() public {
        vm.prank(user1);
        vm.expectRevert(QSToken.NotMinter.selector);
        token.mint(user1, 1000 * 1e18);
    }
    
    function test_mint_exceedsMaxSupply_reverts() public {
        uint256 amount = token.MAX_SUPPLY() + 1;
        vm.prank(minter);
        vm.expectRevert(QSToken.ExceedsMaxSupply.selector);
        token.mint(user1, amount);
    }
    
    function test_mint_toZeroAddress_reverts() public {
        vm.prank(minter);
        vm.expectRevert(QSToken.ZeroAddress.selector);
        token.mint(address(0), 1000 * 1e18);
    }
    
    // ============ Transfer Tests ============
    
    function test_transfer() public {
        vm.prank(minter);
        token.mint(user1, 1000 * 1e18);
        
        vm.prank(user1);
        bool success = token.transfer(user2, 400 * 1e18);
        
        assertTrue(success);
        assertEq(token.balanceOf(user1), 600 * 1e18);
        assertEq(token.balanceOf(user2), 400 * 1e18);
    }
    
    function test_transfer_insufficientBalance_reverts() public {
        vm.prank(minter);
        token.mint(user1, 100 * 1e18);
        
        vm.prank(user1);
        vm.expectRevert(QSToken.InsufficientBalance.selector);
        token.transfer(user2, 200 * 1e18);
    }
    
    // ============ Approve & TransferFrom Tests ============
    
    function test_approve() public {
        vm.prank(user1);
        bool success = token.approve(user2, 500 * 1e18);
        
        assertTrue(success);
        assertEq(token.allowance(user1, user2), 500 * 1e18);
    }
    
    function test_transferFrom() public {
        vm.prank(minter);
        token.mint(user1, 1000 * 1e18);
        
        vm.prank(user1);
        token.approve(user2, 500 * 1e18);
        
        vm.prank(user2);
        bool success = token.transferFrom(user1, user2, 300 * 1e18);
        
        assertTrue(success);
        assertEq(token.balanceOf(user1), 700 * 1e18);
        assertEq(token.balanceOf(user2), 300 * 1e18);
        assertEq(token.allowance(user1, user2), 200 * 1e18);
    }
    
    function test_transferFrom_insufficientAllowance_reverts() public {
        vm.prank(minter);
        token.mint(user1, 1000 * 1e18);
        
        vm.prank(user1);
        token.approve(user2, 100 * 1e18);
        
        vm.prank(user2);
        vm.expectRevert(QSToken.InsufficientAllowance.selector);
        token.transferFrom(user1, user2, 200 * 1e18);
    }
    
    // ============ Burn Tests ============
    
    function test_burn() public {
        vm.prank(minter);
        token.mint(user1, 1000 * 1e18);
        
        vm.prank(user1);
        token.burn(400 * 1e18);
        
        assertEq(token.balanceOf(user1), 600 * 1e18);
        assertEq(token.totalSupply(), 600 * 1e18);
    }
    
    function test_burnFrom() public {
        vm.prank(minter);
        token.mint(user1, 1000 * 1e18);
        
        vm.prank(user1);
        token.approve(user2, 500 * 1e18);
        
        vm.prank(user2);
        token.burnFrom(user1, 300 * 1e18);
        
        assertEq(token.balanceOf(user1), 700 * 1e18);
        assertEq(token.totalSupply(), 700 * 1e18);
        assertEq(token.allowance(user1, user2), 200 * 1e18);
    }
    
    // ============ Admin Tests ============
    
    function test_setMinter() public {
        address newMinter = address(0x5);
        
        vm.prank(admin);
        token.setMinter(newMinter);
        
        assertEq(token.minter(), newMinter);
    }
    
    function test_setMinter_notAdmin_reverts() public {
        vm.prank(user1);
        vm.expectRevert(QSToken.NotAdmin.selector);
        token.setMinter(address(0x5));
    }
    
    function test_setAdmin() public {
        address newAdmin = address(0x5);
        
        vm.prank(admin);
        token.setAdmin(newAdmin);
        
        assertEq(token.admin(), newAdmin);
    }
    
    // ============ Max Supply Tests ============
    
    function test_maxSupply() public {
        assertEq(token.MAX_SUPPLY(), 1_000_000_000 * 1e18);
    }
}
