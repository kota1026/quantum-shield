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
///    ⚠️ 直接の Curve pool が存在しない可能性あり
///    Option A: USDe/USDC pool (0x02950460...) が存在する場合はそれを使用
///    Option B: USDe を Uniswap V3 等の外部 DEX 経由でスワップ
///    Option C: 1inch/Paraswap 等の aggregator 経由
///    → デプロイ前にオンチェーンで pool の存在確認が必須
///
///  FRAX ↔ USDC:
///    ⚠️ FRAXBP (0xDcEF968d...) は Metapool (FRAX/3CRV)
///    直接 FRAX↔USDC のスワップは exchange_underlying() で可能
///    または FRAX metapool (0x3175df09...) を使用
///
///  Strategy: 直接プールがある場合はそれを使い、
///            ない場合は fallback DEX を経由する。
///            デプロイ時に setPool() で正しいアドレスを設定。
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

    // Curve Pools (confirmed on-chain)
    address public constant THREE_POOL = 0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7;  // DAI/USDC/USDT ($165M+ TVL)
    address public constant FRAX_META = 0x3175Df0976dFA876431C2E9eE6bC45b65d3473CC;   // FRAX/3CRV Metapool

    // USDe pool - configurable (may not exist on Curve, needs on-chain verification)
    address public usdePool;

    // 3pool indices (verified)
    int128 public constant THREE_POOL_DAI = 0;
    int128 public constant THREE_POOL_USDC = 1;

    // FRAX Metapool indices
    // exchange_underlying: FRAX=0, DAI=1, USDC=2, USDT=3
    int128 public constant FRAX_META_FRAX = 0;
    int128 public constant FRAX_META_USDC = 2;  // underlying index for USDC

    // USDe pool indices (configurable)
    int128 public usdeIndexUsde = 0;
    int128 public usdeIndexUsdc = 1;

    // ═══════════════════════════════════════════════════════════════
    //  Types
    // ═══════════════════════════════════════════════════════════════

    struct Route {
        address pool;
        int128 fromIndex;
        int128 toIndex;
        bool useUnderlying; // true = exchange_underlying (for metapools)
    }

    // ═══════════════════════════════════════════════════════════════
    //  State
    // ═══════════════════════════════════════════════════════════════

    address public owner;
    uint256 public defaultSlippageBps = 30; // 0.3%
    bool public usdeEnabled;                // USDe pool が確認できたら true

    // ═══════════════════════════════════════════════════════════════
    //  Events / Errors
    // ═══════════════════════════════════════════════════════════════

    event Swapped(address indexed from, address indexed to, uint256 amountIn, uint256 amountOut);
    event UsdePoolUpdated(address pool, int128 idxUsde, int128 idxUsdc);
    error UnsupportedPair(address from, address to);
    error UsdeNotEnabled();
    error SlippageExceeded(uint256 expected, uint256 actual);

    constructor() {
        owner = msg.sender;

        // Approve confirmed pools
        IERC20(USDC).safeApprove(THREE_POOL, type(uint256).max);
        IERC20(USDC).safeApprove(FRAX_META, type(uint256).max);
        IERC20(DAI).safeApprove(THREE_POOL, type(uint256).max);
        IERC20(FRAX).safeApprove(FRAX_META, type(uint256).max);
        // USDe pool approval deferred until setUsdePool() is called
    }

    /// @notice USDe pool を設定（デプロイ後にオンチェーン確認してから）
    /// @dev Curve に USDe/USDC pool が確認できたら呼ぶ。
    ///      なければ sUSDe への配分を 0% にして運用する。
    function setUsdePool(address _pool, int128 _idxUsde, int128 _idxUsdc) external {
        require(msg.sender == owner, "!owner");
        require(_pool != address(0), "zero address");

        // Verify pool actually works by calling get_dy
        (bool ok,) = _pool.staticcall(
            abi.encodeWithSignature("get_dy(int128,int128,uint256)", _idxUsdc, _idxUsde, uint256(1e6))
        );
        require(ok, "pool verification failed");

        usdePool = _pool;
        usdeIndexUsde = _idxUsde;
        usdeIndexUsdc = _idxUsdc;
        usdeEnabled = true;

        IERC20(USDC).safeApprove(_pool, type(uint256).max);
        IERC20(USDE).safeApprove(_pool, type(uint256).max);

        emit UsdePoolUpdated(_pool, _idxUsde, _idxUsdc);
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
    function _getRoute(address _from, address _to) internal view returns (Route memory) {
        // USDC ↔ DAI: 3pool (direct, highest liquidity)
        if (_from == USDC && _to == DAI) {
            return Route(THREE_POOL, THREE_POOL_USDC, THREE_POOL_DAI, false);
        }
        if (_from == DAI && _to == USDC) {
            return Route(THREE_POOL, THREE_POOL_DAI, THREE_POOL_USDC, false);
        }

        // USDC ↔ FRAX: Metapool (exchange_underlying)
        if (_from == USDC && _to == FRAX) {
            return Route(FRAX_META, FRAX_META_USDC, FRAX_META_FRAX, true);
        }
        if (_from == FRAX && _to == USDC) {
            return Route(FRAX_META, FRAX_META_FRAX, FRAX_META_USDC, true);
        }

        // USDC ↔ USDe: Configurable pool (must be set via setUsdePool)
        if ((_from == USDC && _to == USDE) || (_from == USDE && _to == USDC)) {
            if (!usdeEnabled) revert UsdeNotEnabled();
            if (_from == USDC) {
                return Route(usdePool, usdeIndexUsdc, usdeIndexUsde, false);
            } else {
                return Route(usdePool, usdeIndexUsde, usdeIndexUsdc, false);
            }
        }

        revert UnsupportedPair(_from, _to);
    }

    /// @notice Curve pool の get_dy (or get_dy_underlying for metapools)
    function _getExpectedOutput(Route memory _route, uint256 _amount) internal view returns (uint256) {
        string memory fn = _route.useUnderlying
            ? "get_dy_underlying(int128,int128,uint256)"
            : "get_dy(int128,int128,uint256)";

        (bool success, bytes memory data) = _route.pool.staticcall(
            abi.encodeWithSignature(fn, _route.fromIndex, _route.toIndex, _amount)
        );
        require(success, "get_dy failed");
        return abi.decode(data, (uint256));
    }

    /// @notice Curve pool の exchange (or exchange_underlying for metapools)
    function _executeSwap(Route memory _route, uint256 _amount, uint256 _minOut) internal returns (uint256) {
        string memory fn = _route.useUnderlying
            ? "exchange_underlying(int128,int128,uint256,uint256)"
            : "exchange(int128,int128,uint256,uint256)";

        (bool success, bytes memory data) = _route.pool.call(
            abi.encodeWithSignature(fn, _route.fromIndex, _route.toIndex, _amount, _minOut)
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
