// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/sequencer/SequencerSlashing.sol";
import "../../src/sequencer/SequencerStaking.sol";
import "../../src/interfaces/ISequencerSlashing.sol";

/**
 * @title MockReceiver
 * @notice A simple contract that can receive ETH
 */
contract MockReceiver {
    receive() external payable {}
    fallback() external payable {}
}

/**
 * @title SequencerSlashing Test
 * @notice TEST-SEQ-003: Sequencer slashing integration tests
 * @dev Covers DECEN-014 requirements:
 *      - Double-signing detection and slash
 *      - Downtime (SLA violation) detection and slash
 *      - Quadratic slashing: N^2 * 10%
 *      - Slash distribution: Challenger 60%, Insurance 20%, Burn 20%
 *      - Integration with CoreSlashing
 */
contract SequencerSlashingTest is Test {
    SequencerSlashing public slashing;
    SequencerStaking public staking;
    MockReceiver public challengerReceiver;
    MockReceiver public insuranceReceiver;

    address public admin = address(0xAD1);
    address public sequencer1 = address(0x111);
    address public sequencer2 = address(0x222);
    address public challenger;
    address public insuranceFund;
    
    /// @notice Dead address for burning ETH (must match contract)
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    uint256 public constant MINIMUM_STAKE = 500_000 ether;
    uint256 public constant CHALLENGE_BOND = 0.1 ether;

    // Slashing rates (N^2 * 10%)
    // N=1: 10%, N=2: 40%, N=3: 90%, N=4: 160% (capped at 100%)

    function setUp() public {
        // Deploy mock receivers for challenger and insurance fund
        challengerReceiver = new MockReceiver();
        insuranceReceiver = new MockReceiver();
        challenger = address(challengerReceiver);
        insuranceFund = address(insuranceReceiver);
        
        vm.startPrank(admin);
        staking = new SequencerStaking(admin);
        slashing = new SequencerSlashing(address(staking), insuranceFund, admin);
        staking.setSlashingContract(address(slashing));
        
        // Grant HEALTH_MONITOR_ROLE to admin for downtime reporting
        bytes32 HEALTH_MONITOR_ROLE = keccak256("HEALTH_MONITOR_ROLE");
        slashing.grantRole(HEALTH_MONITOR_ROLE, admin);
        vm.stopPrank();

        // Setup sequencers with stake using stakeFor
        _setupStake(sequencer1, MINIMUM_STAKE);
        _setupStake(sequencer2, MINIMUM_STAKE);
        
        // Fund slashing contract with ETH for challenger rewards
        vm.deal(address(slashing), 1_000_000 ether);
    }

    // ============================================
    // TEST-SEQ-003.1: Double-Signing Slash Tests
    // ============================================

    function test_ReportDoubleSigning() public {
        bytes memory proof = _createDoubleSignProof(sequencer1);

        vm.deal(challenger, CHALLENGE_BOND + 1 ether);
        vm.prank(challenger);
        slashing.reportDoubleSign{value: CHALLENGE_BOND}(sequencer1, proof);

        // First violation: 10% slash
        uint256 expectedSlash = MINIMUM_STAKE * 10 / 100;
        assertEq(staking.getStake(sequencer1), MINIMUM_STAKE - expectedSlash);
    }

    function test_ReportDoubleSigning_QuadraticSlash() public {
        // First violation: N=1, 10%
        _reportAndVerifySlash(sequencer1, 1, 10);

        // Second violation: N=2, 40%
        _reportAndVerifySlash(sequencer1, 2, 40);

        // Third violation: N=3, 90%
        _reportAndVerifySlash(sequencer1, 3, 90);
    }

    function test_ReportDoubleSigning_InvalidProof() public {
        bytes memory invalidProof = hex"00";

        vm.deal(challenger, CHALLENGE_BOND + 1 ether);
        vm.prank(challenger);
        vm.expectRevert("Invalid proof");
        slashing.reportDoubleSign{value: CHALLENGE_BOND}(sequencer1, invalidProof);
    }
    
    function test_ReportDoubleSigning_WrongSequencer() public {
        // Create proof for sequencer2 but try to slash sequencer1
        bytes memory proof = _createDoubleSignProof(sequencer2);

        vm.deal(challenger, CHALLENGE_BOND + 1 ether);
        vm.prank(challenger);
        vm.expectRevert("Invalid proof");
        slashing.reportDoubleSign{value: CHALLENGE_BOND}(sequencer1, proof);
    }
    
    function test_ReportDoubleSigning_SameCommitments() public {
        // Create proof with same commitments (not a valid double-sign)
        bytes32 commitment = keccak256("same_commitment");
        bytes memory invalidProof = abi.encode(sequencer1, block.number, commitment, commitment);

        vm.deal(challenger, CHALLENGE_BOND + 1 ether);
        vm.prank(challenger);
        vm.expectRevert("Invalid proof");
        slashing.reportDoubleSign{value: CHALLENGE_BOND}(sequencer1, invalidProof);
    }

    // ============================================
    // TEST-SEQ-003.2: Downtime Slash Tests
    // ============================================

    function test_ReportDowntime() public {
        // Simulate missed blocks
        vm.prank(admin);
        slashing.reportDowntime(sequencer1);

        // First violation: 10% slash
        uint256 expectedSlash = MINIMUM_STAKE * 10 / 100;
        assertEq(staking.getStake(sequencer1), MINIMUM_STAKE - expectedSlash);
    }

    function test_ReportDowntime_OnlyAuthorized() public {
        vm.prank(challenger);
        vm.expectRevert();
        slashing.reportDowntime(sequencer1);
    }

    // ============================================
    // TEST-SEQ-003.3: Slash Distribution Tests
    // ============================================

    function test_SlashDistribution() public {
        bytes memory proof = _createDoubleSignProof(sequencer1);
        
        uint256 slashAmount = MINIMUM_STAKE * 10 / 100; // N=1: 50,000 ETH
        uint256 expectedChallengerReward = slashAmount * 60 / 100; // 30,000 ETH
        uint256 expectedInsuranceAmount = slashAmount * 20 / 100; // 10,000 ETH
        uint256 expectedBurnAmount = slashAmount * 20 / 100; // 10,000 ETH

        // Fund challenger with bond
        vm.deal(challenger, CHALLENGE_BOND + 1 ether);
        
        // Record balances AFTER funding
        uint256 challengerBalanceBefore = challenger.balance;
        uint256 insuranceBalanceBefore = insuranceFund.balance;
        uint256 burnAddressBalanceBefore = BURN_ADDRESS.balance;

        vm.prank(challenger);
        slashing.reportDoubleSign{value: CHALLENGE_BOND}(sequencer1, proof);

        uint256 challengerBalanceAfter = challenger.balance;
        uint256 insuranceBalanceAfter = insuranceFund.balance;
        uint256 burnAddressBalanceAfter = BURN_ADDRESS.balance;

        // Challenger receives: reward + bond back - bond sent
        // Net gain = challengerBalanceAfter - challengerBalanceBefore + CHALLENGE_BOND (sent)
        // = reward + bond (received back)
        uint256 challengerNetGain = challengerBalanceAfter - (challengerBalanceBefore - CHALLENGE_BOND);
        
        assertEq(challengerNetGain, expectedChallengerReward + CHALLENGE_BOND, "Challenger reward incorrect");
        assertEq(insuranceBalanceAfter - insuranceBalanceBefore, expectedInsuranceAmount, "Insurance amount incorrect");
        assertEq(burnAddressBalanceAfter - burnAddressBalanceBefore, expectedBurnAmount, "Burn amount incorrect");
    }
    
    function test_BurnAddressReceivesETH() public {
        bytes memory proof = _createDoubleSignProof(sequencer1);
        
        uint256 slashAmount = MINIMUM_STAKE * 10 / 100;
        uint256 expectedBurnAmount = slashAmount * 20 / 100;
        
        uint256 burnBalanceBefore = BURN_ADDRESS.balance;
        uint256 totalBurnedBefore = slashing.totalBurned();

        vm.deal(challenger, CHALLENGE_BOND + 1 ether);
        vm.prank(challenger);
        slashing.reportDoubleSign{value: CHALLENGE_BOND}(sequencer1, proof);

        assertEq(BURN_ADDRESS.balance - burnBalanceBefore, expectedBurnAmount, "ETH not sent to burn address");
        assertEq(slashing.totalBurned() - totalBurnedBefore, expectedBurnAmount, "totalBurned not updated");
    }

    // ============================================
    // TEST-SEQ-003.4: Slash Calculation Tests
    // ============================================

    function test_CalculateSlash_FirstViolation() public view {
        // N=1: 1^2 * 10% = 10%
        uint256 slash = slashing.calculateSlash(MINIMUM_STAKE, 1);
        assertEq(slash, MINIMUM_STAKE * 10 / 100);
    }

    function test_CalculateSlash_SecondViolation() public view {
        // N=2: 2^2 * 10% = 40%
        uint256 slash = slashing.calculateSlash(MINIMUM_STAKE, 2);
        assertEq(slash, MINIMUM_STAKE * 40 / 100);
    }

    function test_CalculateSlash_Capped() public view {
        // N=4+: Should cap at 100%
        uint256 slash = slashing.calculateSlash(MINIMUM_STAKE, 4);
        assertEq(slash, MINIMUM_STAKE); // 100%
    }

    function testFuzz_CalculateSlash(uint256 stake, uint256 violations) public view {
        stake = bound(stake, 1 ether, 10_000_000 ether);
        violations = bound(violations, 1, 10);

        uint256 slash = slashing.calculateSlash(stake, violations);
        assertTrue(slash <= stake, "Slash exceeds stake");
        assertTrue(slash > 0, "Slash is zero");
    }

    // ============================================
    // TEST-SEQ-003.5: Unbonding Period Slash Tests
    // ============================================

    function test_SlashDuringUnbonding() public {
        // Start unbonding
        vm.prank(sequencer1);
        staking.unstake(100_000 ether);

        // Should still be slashable during unbonding
        bytes memory proof = _createDoubleSignProof(sequencer1);
        vm.deal(challenger, CHALLENGE_BOND + 1 ether);
        vm.prank(challenger);
        slashing.reportDoubleSign{value: CHALLENGE_BOND}(sequencer1, proof);

        // Stake should be reduced
        assertTrue(staking.getStake(sequencer1) < MINIMUM_STAKE - 100_000 ether);
    }

    // ============================================
    // Helper Functions
    // ============================================

    function _setupStake(address seq, uint256 amount) internal {
        vm.deal(seq, amount + 1 ether);
        vm.prank(seq);
        staking.stakeFor{value: amount}(seq);
    }

    /**
     * @notice Creates a valid double-sign proof for testing
     * @dev New format: (sequencer, blockNumber, commitment1, commitment2)
     *      commitment1 != commitment2 proves double-signing
     */
    function _createDoubleSignProof(address seq) internal view returns (bytes memory) {
        // Create two different commitments for the same block (evidence of double-signing)
        bytes32 commitment1 = keccak256(abi.encodePacked(seq, block.number, "commitment_A"));
        bytes32 commitment2 = keccak256(abi.encodePacked(seq, block.number, "commitment_B"));
        
        return abi.encode(seq, block.number, commitment1, commitment2);
    }

    function _reportAndVerifySlash(address seq, uint256 violationNum, uint256 expectedPercentage) internal {
        uint256 stakeBefore = staking.getStake(seq);
        bytes memory proof = _createDoubleSignProof(seq);

        vm.deal(challenger, CHALLENGE_BOND + 1 ether);
        vm.prank(challenger);
        slashing.reportDoubleSign{value: CHALLENGE_BOND}(seq, proof);

        uint256 stakeAfter = staking.getStake(seq);
        uint256 actualSlash = stakeBefore - stakeAfter;
        uint256 expectedSlash = stakeBefore * expectedPercentage / 100;

        assertApproxEqRel(actualSlash, expectedSlash, 1e16); // 1% tolerance
    }
}
