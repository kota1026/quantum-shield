// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.18;

import {Test, console2} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SwapRouter} from "../SwapRouter.sol";

/// @title SwapRouter Unit Tests (Mock)
/// @notice Mock 環境でのルーティングロジック検証
contract SwapRouterUnitTest is Test {
    SwapRouter public router;
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address constant FRAX = 0x853d955aCEf822Db058eb8505911ED77F175b99e;
    address constant USDE = 0x4c9EDD5852cd905f086C759E8383e09bff1E68B3;

    function setUp() public {
        // Mock token approvals (safeApprove calls in constructor)
        vm.mockCall(USDC, abi.encodeWithSignature("approve(address,uint256)"), abi.encode(true));
        vm.mockCall(DAI, abi.encodeWithSignature("approve(address,uint256)"), abi.encode(true));
        vm.mockCall(FRAX, abi.encodeWithSignature("approve(address,uint256)"), abi.encode(true));
        vm.mockCall(USDE, abi.encodeWithSignature("approve(address,uint256)"), abi.encode(true));

        router = new SwapRouter();
    }

    // ─── Route Resolution ─────────────────────────────────

    function test_owner() public view {
        assertEq(router.owner(), address(this));
    }

    function test_constants() public view {
        assertEq(router.USDC(), USDC);
        assertEq(router.DAI(), DAI);
        assertEq(router.FRAX(), FRAX);
        assertEq(router.USDE(), USDE);
        assertEq(router.THREE_POOL(), 0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7);
        assertEq(router.FRAX_META(), 0x3175Df0976dFA876431C2E9eE6bC45b65d3473CC);
    }

    function test_usdeNotEnabledByDefault() public view {
        assertFalse(router.usdeEnabled());
        assertEq(router.usdePool(), address(0));
    }

    function test_setUsdePool() public {
        address mockPool = makeAddr("usdePool");

        // Mock get_dy for verification
        vm.mockCall(
            mockPool,
            abi.encodeWithSignature("get_dy(int128,int128,uint256)", int128(1), int128(0), uint256(1e6)),
            abi.encode(uint256(999000))
        );
        // Mock token approvals
        vm.mockCall(USDC, abi.encodeWithSignature("approve(address,uint256)"), abi.encode(true));
        vm.mockCall(USDE, abi.encodeWithSignature("approve(address,uint256)"), abi.encode(true));

        router.setUsdePool(mockPool, 0, 1);

        assertTrue(router.usdeEnabled());
        assertEq(router.usdePool(), mockPool);
    }

    function test_setUsdePool_onlyOwner() public {
        address attacker = makeAddr("attacker");
        address mockPool = makeAddr("usdePool");

        vm.prank(attacker);
        vm.expectRevert("!owner");
        router.setUsdePool(mockPool, 0, 1);
    }

    function test_setUsdePool_zeroAddress() public {
        vm.expectRevert("zero address");
        router.setUsdePool(address(0), 0, 1);
    }

    function test_setDefaultSlippage() public {
        router.setDefaultSlippage(50); // 0.5%
        assertEq(router.defaultSlippageBps(), 50);
    }

    function test_setDefaultSlippage_max() public {
        vm.expectRevert("slippage too high");
        router.setDefaultSlippage(501);
    }

    function test_setDefaultSlippage_onlyOwner() public {
        vm.prank(makeAddr("attacker"));
        vm.expectRevert("!owner");
        router.setDefaultSlippage(50);
    }

    // ─── Swap with Mocks ──────────────────────────────────

    function test_swap_usdcToDai() public {
        uint256 amount = 100_000e6; // 100k USDC

        // Mock transferFrom, get_dy, exchange, transfer
        vm.mockCall(USDC, abi.encodeWithSignature("transferFrom(address,address,uint256)"), abi.encode(true));
        vm.mockCall(
            router.THREE_POOL(),
            abi.encodeWithSignature("get_dy(int128,int128,uint256)", int128(1), int128(0), amount),
            abi.encode(uint256(99_950e18))
        );
        vm.mockCall(
            router.THREE_POOL(),
            abi.encodeWithSignature("exchange(int128,int128,uint256,uint256)"),
            abi.encode(uint256(99_940e18))
        );
        vm.mockCall(DAI, abi.encodeWithSignature("transfer(address,uint256)"), abi.encode(true));

        uint256 out = router.swap(USDC, DAI, amount, 0);
        assertGt(out, 0);
    }

    function test_swap_usdcToFrax_usesUnderlying() public {
        uint256 amount = 50_000e6;

        vm.mockCall(USDC, abi.encodeWithSignature("transferFrom(address,address,uint256)"), abi.encode(true));
        // Should call get_dy_underlying for metapool
        vm.mockCall(
            router.FRAX_META(),
            abi.encodeWithSignature("get_dy_underlying(int128,int128,uint256)", int128(2), int128(0), amount),
            abi.encode(uint256(49_980e18))
        );
        vm.mockCall(
            router.FRAX_META(),
            abi.encodeWithSignature("exchange_underlying(int128,int128,uint256,uint256)"),
            abi.encode(uint256(49_970e18))
        );
        vm.mockCall(FRAX, abi.encodeWithSignature("transfer(address,uint256)"), abi.encode(true));

        uint256 out = router.swap(USDC, FRAX, amount, 0);
        assertGt(out, 0);
    }

    function test_swap_zeroAmount() public view {
        uint256 out = router.swap(USDC, DAI, 0, 0);
        assertEq(out, 0);
    }

    function test_swap_usdeRevert_whenNotEnabled() public {
        vm.mockCall(USDC, abi.encodeWithSignature("transferFrom(address,address,uint256)"), abi.encode(true));

        vm.expectRevert(SwapRouter.UsdeNotEnabled.selector);
        router.swap(USDC, USDE, 1000e6, 0);
    }

    function test_getExpectedOutput_usdcToDai() public {
        uint256 amount = 10_000e6;

        vm.mockCall(
            router.THREE_POOL(),
            abi.encodeWithSignature("get_dy(int128,int128,uint256)", int128(1), int128(0), amount),
            abi.encode(uint256(9_998e18))
        );

        uint256 expected = router.getExpectedOutput(USDC, DAI, amount);
        assertEq(expected, 9_998e18);
    }

    // ─── Unsupported Pair ──────────────────────────────────

    function test_unsupportedPair() public {
        address WETH = makeAddr("WETH");
        vm.expectRevert(abi.encodeWithError(SwapRouter.UnsupportedPair.selector, (USDC, WETH)));
        router.getExpectedOutput(USDC, WETH, 1000);
    }
}

/// @title SwapRouter Mainnet Fork Tests
/// @notice ETH_RPC_URL 設定時に Mainnet fork で実行
/// @dev Run: forge test --match-contract SwapRouterForkTest --fork-url $ETH_RPC_URL -vvv
contract SwapRouterForkTest is Test {
    SwapRouter public router;

    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address constant FRAX = 0x853d955aCEf822Db058eb8505911ED77F175b99e;
    address constant USDE = 0x4c9EDD5852cd905f086C759E8383e09bff1E68B3;

    // Known USDC whale (Circle/Coinbase)
    address constant USDC_WHALE = 0x55FE002aefF02F77364de339a1292923A15844B8;
    // Known DAI whale
    address constant DAI_WHALE = 0x60FaAe176336dAb62e284Fe19B885B095d29fB7F;

    modifier onlyFork() {
        try vm.rpcUrl("mainnet") returns (string memory) {
            _;
        } catch {
            vm.skip(true);
        }
    }

    function setUp() public onlyFork {
        router = new SwapRouter();
    }

    /// @notice 3pool USDC→DAI $100K スワップ
    function test_fork_usdcToDai_100k() public onlyFork {
        uint256 amount = 100_000e6; // 100k USDC

        // Get USDC from whale
        vm.startPrank(USDC_WHALE);
        IERC20(USDC).approve(address(router), amount);

        // Check expected output first
        uint256 expected = router.getExpectedOutput(USDC, DAI, amount);
        console2.log("Expected DAI output for 100k USDC:", expected / 1e18);

        // Slippage should be < 0.1% for stables
        assertGt(expected, 99_900e18, "Slippage > 0.1% for 100k USDC->DAI");

        // Execute swap
        uint256 balBefore = IERC20(DAI).balanceOf(USDC_WHALE);
        uint256 out = router.swap(USDC, DAI, amount, 0);
        uint256 balAfter = IERC20(DAI).balanceOf(USDC_WHALE);

        vm.stopPrank();

        assertEq(balAfter - balBefore, out, "Balance mismatch");
        assertGt(out, 99_900e18, "Output too low");
        console2.log("Actual DAI received:", out / 1e18);
        console2.log("Slippage bps:", (amount * 1e12 - out) * 10000 / (amount * 1e12));
    }

    /// @notice 3pool DAI→USDC $100K スワップ
    function test_fork_daiToUsdc_100k() public onlyFork {
        uint256 amount = 100_000e18; // 100k DAI

        vm.startPrank(DAI_WHALE);
        IERC20(DAI).approve(address(router), amount);

        uint256 expected = router.getExpectedOutput(DAI, USDC, amount);
        console2.log("Expected USDC output for 100k DAI:", expected / 1e6);

        assertGt(expected, 99_900e6, "Slippage > 0.1%");

        uint256 out = router.swap(DAI, USDC, amount, 0);
        vm.stopPrank();

        assertGt(out, 99_900e6);
        console2.log("Actual USDC received:", out / 1e6);
    }

    /// @notice FRAX metapool USDC→FRAX (exchange_underlying)
    function test_fork_usdcToFrax() public onlyFork {
        uint256 amount = 50_000e6; // 50k USDC

        vm.startPrank(USDC_WHALE);
        IERC20(USDC).approve(address(router), amount);

        uint256 expected = router.getExpectedOutput(USDC, FRAX, amount);
        console2.log("Expected FRAX for 50k USDC:", expected / 1e18);

        uint256 out = router.swap(USDC, FRAX, amount, 0);
        vm.stopPrank();

        assertGt(out, 49_800e18, "FRAX slippage > 0.4%");
        console2.log("Actual FRAX received:", out / 1e18);
    }

    /// @notice FRAX→USDC reverse
    function test_fork_fraxToUsdc() public onlyFork {
        // First get FRAX by swapping USDC
        uint256 usdcAmount = 10_000e6;
        vm.startPrank(USDC_WHALE);
        IERC20(USDC).approve(address(router), usdcAmount);
        uint256 fraxAmount = router.swap(USDC, FRAX, usdcAmount, 0);

        // Now swap FRAX back
        IERC20(FRAX).approve(address(router), fraxAmount);
        uint256 usdcBack = router.swap(FRAX, USDC, fraxAmount, 0);
        vm.stopPrank();

        // Round-trip loss should be < 0.5%
        assertGt(usdcBack, 9_950e6, "Round-trip loss > 0.5%");
        console2.log("USDC in:", usdcAmount / 1e6);
        console2.log("USDC back:", usdcBack / 1e6);
        console2.log("Round-trip loss bps:", (usdcAmount - usdcBack) * 10000 / usdcAmount);
    }

    /// @notice USDe swap reverts when not enabled
    function test_fork_usde_revert_notEnabled() public onlyFork {
        uint256 amount = 1000e6;
        vm.startPrank(USDC_WHALE);
        IERC20(USDC).approve(address(router), amount);

        vm.expectRevert(SwapRouter.UsdeNotEnabled.selector);
        router.swap(USDC, USDE, amount, 0);
        vm.stopPrank();
    }

    /// @notice USDe pool 検出テスト
    /// @dev USDe/USDC pool (0x02950460...) の存在を検証
    function test_fork_verifyUsdePool() public onlyFork {
        address candidate = 0x02950460E2b9529D0E00284A5fA2d7bDF3fA4d72;

        // Try calling get_dy on the candidate pool
        (bool ok, bytes memory data) = candidate.staticcall(
            abi.encodeWithSignature("get_dy(int128,int128,uint256)", int128(1), int128(0), uint256(1e6))
        );

        if (ok && data.length >= 32) {
            uint256 dy = abi.decode(data, (uint256));
            console2.log("USDe pool EXISTS! get_dy(1M USDC -> USDe):", dy);
            console2.log("Pool address:", candidate);

            // Try to set it
            router.setUsdePool(candidate, 0, 1);
            assertTrue(router.usdeEnabled());
        } else {
            console2.log("USDe pool at 0x02950460... does NOT respond to get_dy");
            console2.log("USDe swaps will need alternative routing (Uniswap V3, aggregator)");
            assertFalse(router.usdeEnabled());
        }
    }

    /// @notice Gas benchmark for different swap routes
    function test_fork_gasBenchmark() public onlyFork {
        uint256 amount = 10_000e6;

        vm.startPrank(USDC_WHALE);
        IERC20(USDC).approve(address(router), type(uint256).max);

        // USDC→DAI gas
        uint256 gasBefore = gasleft();
        router.swap(USDC, DAI, amount, 0);
        uint256 gasUsed3pool = gasBefore - gasleft();

        // USDC→FRAX gas
        gasBefore = gasleft();
        router.swap(USDC, FRAX, amount, 0);
        uint256 gasUsedMeta = gasBefore - gasleft();

        vm.stopPrank();

        console2.log("Gas: USDC->DAI (3pool):", gasUsed3pool);
        console2.log("Gas: USDC->FRAX (metapool):", gasUsedMeta);
    }
}
