// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.18;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title SwapRouter
/// @notice RealYieldAggregator 用のスワップルーター
///         各ステーブルコイン間のスワップを最適なプール経由で実行
///
/// ═══════════════════════════════════════════════════════════════
///  Mainnet Pool Addresses & Routes
/// ═══════════════════════════════════════════════════════════════
///
///  USDC ↔ DAI:
///    Pool: 3pool (0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7)
///    Indices: DAI=0, USDC=1, USDT=2
///    TVL: ~$200M+ | Volume: High
///
///  USDC ↔ FRAX:
///    Pool: crvUSD/FRAX/USDC (Curve StableSwap NG)
///    Or: FRAXBP (0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2)
///         FRAX=0, USDC=1
///    TVL: ~$50M+ | Direct pair available
///
///  USDC ↔ USDe:
///    Pool: USDe/USDC (0x02950460E2b9529D0E00284A5fA2d7bDF3fA4d72)
///    Or via: USDe/DAI → DAI/USDC
///    TVL: Growing | Ethena expanding liquidity
///
///  Strategy: 直接プールがある場合はそれを使い、
///            ない場合は最も流動性の高いルートを経由する。
///
contract SwapRouter {
    using SafeERC20 for IERC20;

    // ═══════════════════════════════════════════════════════════════
    //  Mainnet Addresses
    // ═══════════════════════════════════════════════════════════════

    // Tokens
    address public constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address public constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address public constant FRAX = 0x853d955aCEf822Db058eb8505911ED77F175b99e;
    address public constant USDE = 0x4c9EDD5852cd905f086C759E8383e09bff1E68B3;

    // Curve Pools
    address public constant THREE_POOL = 0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7;  // DAI/USDC/USDT
    address public constant FRAXBP = 0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2;       // FRAX/USDC
    address public constant USDE_USDC = 0x02950460E2b9529D0E00284A5fA2d7bDF3fA4d72;    // USDe/USDC

    // 3pool indices
    int128 public constant THREE_POOL_DAI = 0;
    int128 public constant THREE_POOL_USDC = 1;

    // FRAXBP indices
    int128 public constant FRAXBP_FRAX = 0;
    int128 public constant FRAXBP_USDC = 1;

    // USDe/USDC indices
    int128 public constant USDE_POOL_USDE = 0;
    int128 public constant USDE_POOL_USDC = 1;

    // ═══════════════════════════════════════════════════════════════
    //  Types
    // ═══════════════════════════════════════════════════════════════

    struct Route {
        address pool;
        int128 fromIndex;
        int128 toIndex;
    }

    // ═══════════════════════════════════════════════════════════════
    //  State
    // ═══════════════════════════════════════════════════════════════

    address public owner;
    uint256 public defaultSlippageBps = 30; // 0.3%

    // ═══════════════════════════════════════════════════════════════
    //  Events / Errors
    // ═══════════════════════════════════════════════════════════════

    event Swapped(address indexed from, address indexed to, uint256 amountIn, uint256 amountOut);
    error UnsupportedPair(address from, address to);
    error SlippageExceeded(uint256 expected, uint256 actual);

    constructor() {
        owner = msg.sender;

        // Approve pools
        IERC20(USDC).safeApprove(THREE_POOL, type(uint256).max);
        IERC20(USDC).safeApprove(FRAXBP, type(uint256).max);
        IERC20(USDC).safeApprove(USDE_USDC, type(uint256).max);
        IERC20(DAI).safeApprove(THREE_POOL, type(uint256).max);
        IERC20(FRAX).safeApprove(FRAXBP, type(uint256).max);
        IERC20(USDE).safeApprove(USDE_USDC, type(uint256).max);
    }

    // ═══════════════════════════════════════════════════════════════
    //  Core: Swap
    // ═══════════════════════════════════════════════════════════════

    /// @notice ステーブルコイン間のスワップを実行
    /// @param _from 入力トークン
    /// @param _to 出力トークン
    /// @param _amount 入力量
    /// @param _minOut 最小出力量 (0 = auto-calculate with default slippage)
    /// @return amountOut 実際の出力量
    function swap(
        address _from,
        address _to,
        uint256 _amount,
        uint256 _minOut
    ) external returns (uint256 amountOut) {
        if (_amount == 0) return 0;

        // Transfer input tokens from caller
        IERC20(_from).safeTransferFrom(msg.sender, address(this), _amount);

        // Determine route and execute
        Route memory route = _getRoute(_from, _to);

        // Auto-calculate minOut if not specified
        if (_minOut == 0) {
            uint256 expected = _getExpectedOutput(route, _amount);
            _minOut = (expected * (10000 - defaultSlippageBps)) / 10000;
        }

        amountOut = _executeSwap(route, _amount, _minOut);

        // Transfer output to caller
        IERC20(_to).safeTransfer(msg.sender, amountOut);

        emit Swapped(_from, _to, _amount, amountOut);
    }

    /// @notice 期待出力量を取得（view）
    function getExpectedOutput(
        address _from,
        address _to,
        uint256 _amount
    ) external view returns (uint256) {
        Route memory route = _getRoute(_from, _to);
        return _getExpectedOutput(route, _amount);
    }

    // ═══════════════════════════════════════════════════════════════
    //  Internal: Route Resolution
    // ═══════════════════════════════════════════════════════════════

    /// @notice トークンペアに最適なルートを返す
    function _getRoute(address _from, address _to) internal pure returns (Route memory) {
        // USDC → DAI (3pool)
        if (_from == USDC && _to == DAI) {
            return Route(THREE_POOL, THREE_POOL_USDC, THREE_POOL_DAI);
        }
        // DAI → USDC (3pool)
        if (_from == DAI && _to == USDC) {
            return Route(THREE_POOL, THREE_POOL_DAI, THREE_POOL_USDC);
        }
        // USDC → FRAX (FRAXBP)
        if (_from == USDC && _to == FRAX) {
            return Route(FRAXBP, FRAXBP_USDC, FRAXBP_FRAX);
        }
        // FRAX → USDC (FRAXBP)
        if (_from == FRAX && _to == USDC) {
            return Route(FRAXBP, FRAXBP_FRAX, FRAXBP_USDC);
        }
        // USDC → USDe
        if (_from == USDC && _to == USDE) {
            return Route(USDE_USDC, USDE_POOL_USDC, USDE_POOL_USDE);
        }
        // USDe → USDC
        if (_from == USDE && _to == USDC) {
            return Route(USDE_USDC, USDE_POOL_USDE, USDE_POOL_USDC);
        }

        revert UnsupportedPair(_from, _to);
    }

    /// @notice Curve pool の get_dy を呼ぶ
    function _getExpectedOutput(Route memory _route, uint256 _amount) internal view returns (uint256) {
        // Curve pool の get_dy(i, j, dx)
        (bool success, bytes memory data) = _route.pool.staticcall(
            abi.encodeWithSignature(
                "get_dy(int128,int128,uint256)",
                _route.fromIndex,
                _route.toIndex,
                _amount
            )
        );
        require(success, "get_dy failed");
        return abi.decode(data, (uint256));
    }

    /// @notice Curve pool の exchange を実行
    function _executeSwap(Route memory _route, uint256 _amount, uint256 _minOut) internal returns (uint256) {
        (bool success, bytes memory data) = _route.pool.call(
            abi.encodeWithSignature(
                "exchange(int128,int128,uint256,uint256)",
                _route.fromIndex,
                _route.toIndex,
                _amount,
                _minOut
            )
        );
        require(success, "exchange failed");

        // Some Curve pools return the output amount, others don't
        if (data.length >= 32) {
            return abi.decode(data, (uint256));
        }
        return _amount; // Fallback estimate
    }

    // ═══════════════════════════════════════════════════════════════
    //  Admin
    // ═══════════════════════════════════════════════════════════════

    function setDefaultSlippage(uint256 _bps) external {
        require(msg.sender == owner, "!owner");
        require(_bps <= 500, "slippage too high"); // max 5%
        defaultSlippageBps = _bps;
    }
}
