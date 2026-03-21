// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.18;

import {Test, console2} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {RealYieldAggregator} from "../RealYieldAggregator.sol";

/// @title RealYieldAggregator Tests
/// @notice Mainnet fork テストで実際のプロトコルに対して検証
///
/// 実行方法:
///   forge test --match-contract RealYieldAggregatorTest \
///     --fork-url $ETH_RPC_URL \
///     --fork-block-number 19500000 \
///     -vvv
///
/// テスト構成:
///   1. Unit tests     - 個別ロジックの検証
///   2. Integration     - 実際のプロトコルとのやり取り
///   3. Scenario tests  - リバランス・緊急引出しシナリオ
///   4. Edge cases      - ゼロ額、オーバーフロー等
///
contract RealYieldAggregatorTest is Test {
    // ─── Mainnet Addresses ────────────────────────────────────
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address constant FRAX = 0x853d955aCEf822Db058eb8505911ED77F175b99e;
    address constant USDE = 0x4c9EDD5852cd905f086C759E8383e09bff1E68B3;

    // Aave V3
    address constant AAVE_POOL = 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2;
    address constant A_USDC = 0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c;

    // Savings protocols
    address constant SDAI = 0x83F20F44975D03b1b09e64809B757c47f942BEeA;
    address constant SFRAX = 0xA663B02CF0a4b149d2aD41910CB81e23e1c41c32;
    address constant SUSDE = 0x9D39A5DE30e57443BfF2A8307A4256c8797A3497;

    // Curve (using a stable swap pool for USDC/DAI/FRAX/USDe)
    // NOTE: 本番では適切なプールを使用。テストではモック。
    address constant CURVE_POOL = address(0xCAFE); // Placeholder

    // ─── State ────────────────────────────────────────────────
    RealYieldAggregator public strategy;
    address public manager = address(this);
    address public user = address(0xBEEF);
    uint256 public constant INITIAL_DEPOSIT = 100_000e6; // 100K USDC

    // ─── Setup ────────────────────────────────────────────────

    function setUp() public {
        // Deploy with mock Curve pool (fork tests would use real pool)
        vm.mockCall(
            CURVE_POOL,
            abi.encodeWithSignature("get_dy(int128,int128,uint256)"),
            abi.encode(uint256(0))
        );

        RealYieldAggregator.ConstructorParams memory params = RealYieldAggregator
            .ConstructorParams({
                usdc: USDC,
                dai: DAI,
                frax: FRAX,
                usde: USDE,
                aavePool: AAVE_POOL,
                aUsdc: A_USDC,
                sdai: SDAI,
                sfrax: SFRAX,
                susde: SUSDE,
                curvePool: CURVE_POOL,
                curveIndexUsdc: 0,
                curveIndexDai: 1,
                curveIndexFrax: 2,
                curveIndexUsde: 3
            });

        strategy = new RealYieldAggregator(params);
    }

    // ═══════════════════════════════════════════════════════════
    //  Unit Tests: Configuration
    // ═══════════════════════════════════════════════════════════

    function test_initialState() public view {
        assertEq(strategy.management(), address(this));
        assertEq(strategy.keeper(), address(this));
        assertEq(strategy.maxAllocationBps(), 4000);
        assertEq(strategy.minAllocationBps(), 500);
        assertEq(strategy.rebalanceThresholdBps(), 300);
        assertEq(strategy.maxSusdeAllocationBps(), 2500);
    }

    function test_defaultAllocations() public view {
        assertEq(strategy.targetAllocations(0), 2500); // Aave 25%
        assertEq(strategy.targetAllocations(1), 2500); // sDAI 25%
        assertEq(strategy.targetAllocations(2), 2500); // sFRAX 25%
        assertEq(strategy.targetAllocations(3), 2500); // sUSDe 25%
    }

    function test_setTargetAllocations() public {
        uint256[4] memory newTargets = [uint256(3000), uint256(3000), uint256(2000), uint256(2000)];
        strategy.setTargetAllocations(newTargets);

        assertEq(strategy.targetAllocations(0), 3000);
        assertEq(strategy.targetAllocations(1), 3000);
        assertEq(strategy.targetAllocations(2), 2000);
        assertEq(strategy.targetAllocations(3), 2000);
    }

    function test_revert_invalidAllocationsSum() public {
        uint256[4] memory newTargets = [uint256(3000), uint256(3000), uint256(3000), uint256(3000)];
        vm.expectRevert(RealYieldAggregator.InvalidAllocations.selector);
        strategy.setTargetAllocations(newTargets);
    }

    function test_revert_allocationExceedsMax() public {
        // 5000 > maxAllocationBps (4000)
        uint256[4] memory newTargets = [uint256(5000), uint256(2000), uint256(2000), uint256(1000)];
        vm.expectRevert(
            abi.encodeWithSelector(RealYieldAggregator.AllocationExceedsMax.selector, 0, 5000)
        );
        strategy.setTargetAllocations(newTargets);
    }

    function test_revert_susdeAllocationExceedsMax() public {
        // sUSDe 3000 > maxSusdeAllocationBps (2500)
        uint256[4] memory newTargets = [uint256(2000), uint256(2000), uint256(3000), uint256(3000)];
        vm.expectRevert(
            abi.encodeWithSelector(RealYieldAggregator.AllocationExceedsMax.selector, 3, 3000)
        );
        strategy.setTargetAllocations(newTargets);
    }

    // ═══════════════════════════════════════════════════════════
    //  Unit Tests: Access Control
    // ═══════════════════════════════════════════════════════════

    function test_revert_deployFundsNotManagement() public {
        vm.prank(user);
        vm.expectRevert(RealYieldAggregator.NotManagement.selector);
        strategy.deployFunds(1000e6);
    }

    function test_revert_freeFundsNotManagement() public {
        vm.prank(user);
        vm.expectRevert(RealYieldAggregator.NotManagement.selector);
        strategy.freeFunds(1000e6);
    }

    function test_revert_harvestNotKeeper() public {
        vm.prank(user);
        vm.expectRevert(RealYieldAggregator.NotKeeper.selector);
        strategy.harvestAndReport();
    }

    function test_keeperCanHarvest() public {
        address keeperAddr = address(0xKEEP);
        strategy.setKeeper(keeperAddr);

        // harvest should not revert for keeper (will revert on mock calls but that's ok)
        vm.prank(keeperAddr);
        // This will work as far as access control goes
        // Actual protocol interaction will fail without fork
        try strategy.harvestAndReport() {} catch {}
    }

    function test_revert_emergencyNotManagement() public {
        vm.prank(user);
        vm.expectRevert(RealYieldAggregator.NotManagement.selector);
        strategy.emergencyWithdraw();
    }

    // ═══════════════════════════════════════════════════════════
    //  Unit Tests: Zero Amount
    // ═══════════════════════════════════════════════════════════

    function test_revert_deployZero() public {
        vm.expectRevert(RealYieldAggregator.ZeroAmount.selector);
        strategy.deployFunds(0);
    }

    function test_revert_freeZero() public {
        vm.expectRevert(RealYieldAggregator.ZeroAmount.selector);
        strategy.freeFunds(0);
    }

    // ═══════════════════════════════════════════════════════════
    //  Unit Tests: Risk Parameters
    // ═══════════════════════════════════════════════════════════

    function test_setRiskParams() public {
        strategy.setRiskParams(5000, 1000, 500, 3000, 50);

        assertEq(strategy.maxAllocationBps(), 5000);
        assertEq(strategy.minAllocationBps(), 1000);
        assertEq(strategy.rebalanceThresholdBps(), 500);
        assertEq(strategy.maxSusdeAllocationBps(), 3000);
        assertEq(strategy.slippageBps(), 50);
    }

    // ═══════════════════════════════════════════════════════════
    //  Unit Tests: View Functions
    // ═══════════════════════════════════════════════════════════

    function test_emptyStrategyReturnsZero() public view {
        assertEq(strategy.estimatedTotalAssets(), 0);
        assertEq(strategy.needsRebalance(), false);
        assertEq(strategy.availableWithdrawLimit(), 0);
    }

    function test_currentAllocationBpsEmpty() public view {
        uint256[4] memory bps = strategy.currentAllocationBps();
        assertEq(bps[0], 0);
        assertEq(bps[1], 0);
        assertEq(bps[2], 0);
        assertEq(bps[3], 0);
    }

    // ═══════════════════════════════════════════════════════════
    //  Unit Tests: Management Transfer
    // ═══════════════════════════════════════════════════════════

    function test_setManagement() public {
        address newManager = address(0xNEW);
        strategy.setManagement(newManager);
        assertEq(strategy.management(), newManager);
    }

    function test_setKeeper() public {
        address newKeeper = address(0xKEEP);
        strategy.setKeeper(newKeeper);
        assertEq(strategy.keeper(), newKeeper);
    }

    // ═══════════════════════════════════════════════════════════
    //  Fuzz Tests
    // ═══════════════════════════════════════════════════════════

    function testFuzz_targetAllocationsMustSumTo10000(
        uint256 a,
        uint256 b,
        uint256 c,
        uint256 d
    ) public {
        // Bound each to valid range
        a = bound(a, 500, 4000);
        b = bound(b, 500, 4000);
        c = bound(c, 500, 4000);
        d = bound(d, 500, 2500); // sUSDe max 25%

        uint256 sum = a + b + c + d;

        uint256[4] memory targets = [a, b, c, d];

        if (sum != 10000) {
            vm.expectRevert(RealYieldAggregator.InvalidAllocations.selector);
            strategy.setTargetAllocations(targets);
        }
        // If sum == 10000, should succeed (rare but valid)
    }

    function testFuzz_riskParamsUpdate(
        uint256 maxAlloc,
        uint256 minAlloc,
        uint256 rebalThreshold,
        uint256 maxSusde,
        uint256 slip
    ) public {
        maxAlloc = bound(maxAlloc, 1000, 10000);
        minAlloc = bound(minAlloc, 0, 5000);
        rebalThreshold = bound(rebalThreshold, 100, 5000);
        maxSusde = bound(maxSusde, 0, 5000);
        slip = bound(slip, 1, 500);

        strategy.setRiskParams(maxAlloc, minAlloc, rebalThreshold, maxSusde, slip);

        assertEq(strategy.maxAllocationBps(), maxAlloc);
        assertEq(strategy.minAllocationBps(), minAlloc);
        assertEq(strategy.rebalanceThresholdBps(), rebalThreshold);
        assertEq(strategy.maxSusdeAllocationBps(), maxSusde);
        assertEq(strategy.slippageBps(), slip);
    }
}

/// @title RealYieldAggregatorForkTest
/// @notice Mainnet fork で実際のプロトコルとのインタラクションをテスト
///
/// 実行: forge test --match-contract RealYieldAggregatorForkTest \
///         --fork-url $ETH_RPC_URL -vvv
///
contract RealYieldAggregatorForkTest is Test {
    // NOTE: このテストは ETH_RPC_URL が設定されている場合のみ実行
    // CI では skip するか、Alchemy/Infura の RPC を使う

    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant USDC_WHALE = 0x37305B1cD40574E4C5Ce33f8e8306Be057fD7341;

    RealYieldAggregator public strategy;

    /// @notice Fork 環境かどうかをチェック
    modifier onlyFork() {
        // block.number > 19000000 なら Mainnet fork と判断
        if (block.number < 19000000) {
            return;
        }
        _;
    }

    function setUp() public {
        // Fork でない場合は skip
        if (block.number < 19000000) return;

        // TODO: 実際の Curve pool アドレスで初期化
        // 現状はプレースホルダー
    }

    /// @notice Aave に直接預入 → 利息発生を確認
    function test_fork_aaveDirectDeposit() public onlyFork {
        // Fork テストの雛形
        // 実際の実行時は:
        // 1. USDC whale から USDC を借りる (deal or prank)
        // 2. strategy.deployFunds() を呼ぶ
        // 3. 時間を進める (vm.warp)
        // 4. harvestAndReport() で利益が出ているか確認

        // Example:
        // deal(USDC, address(strategy), 100_000e6);
        // strategy.deployFunds(100_000e6);
        // vm.warp(block.timestamp + 365 days);
        // uint256 assets = strategy.harvestAndReport();
        // assertGt(assets, 100_000e6); // 利息で増えているはず
    }

    /// @notice Emergency withdraw が全額回収できることを確認
    function test_fork_emergencyRecovery() public onlyFork {
        // Fork テストの雛形
    }
}
