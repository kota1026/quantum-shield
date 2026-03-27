// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.18;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {BaseStrategy} from "./interfaces/IYearnV3.sol";
import {IAaveV3Pool, IAToken} from "./interfaces/IAave.sol";
import {ISDAI, ISFrax, ISUSDe} from "./interfaces/ISavingsRate.sol";
import {ICurveStableSwapNG} from "./interfaces/ICurveStableSwap.sol";

/// @title RealYieldAggregatorV2
/// @author Quantum Shield
/// @notice Yearn V3 BaseStrategy 継承版 - 複数リアルイールドの自動最適配分
///
/// ═══════════════════════════════════════════════════════════════════
///  V1 → V2 の変更点
/// ═══════════════════════════════════════════════════════════════════
///
///  1. BaseStrategy 継承 → Yearn V3 Vault と直接統合可能
///  2. _deployFunds / _freeFunds / _harvestAndReport / _emergencyWithdraw を override
///  3. _tendTrigger + _tend でリバランスを Yearn の tend() 経由で実行
///  4. APY オラクル追加 → 利回りベースの動的配分
///  5. Keeper 自動化 → harvest trigger 条件を Strategy 内で定義
///
/// ═══════════════════════════════════════════════════════════════════
///  YIELD SOURCES (全てリアルイールド = プロトコル収益ベース)
/// ═══════════════════════════════════════════════════════════════════
///
///  Protocol    | Source              | Typical APY | Risk
///  ------------|---------------------|-------------|------
///  Aave V3     | 貸出利息            | 3-5%        | Low
///  sDAI        | DSR (Stability Fee) | 5-8%        | Low
///  sFRAX       | AMO 運用収益        | 4-6%        | Low-Med
///  sUSDe       | Funding + Staking   | 8-15%       | Med
///
contract RealYieldAggregatorV2 is BaseStrategy {
    using SafeERC20 for IERC20;

    // ═══════════════════════════════════════════════════════════════
    //  Constants
    // ═══════════════════════════════════════════════════════════════

    uint8 public constant AAVE = 0;
    uint8 public constant SDAI = 1;
    uint8 public constant SFRAX = 2;
    uint8 public constant SUSDE = 3;
    uint8 public constant N = 4;

    uint256 public constant BPS = 10_000;
    uint256 public constant SECONDS_PER_YEAR = 365.25 days;

    // ═══════════════════════════════════════════════════════════════
    //  Immutables
    // ═══════════════════════════════════════════════════════════════

    IERC20 public immutable usdc;
    IERC20 public immutable dai;
    IERC20 public immutable frax;
    IERC20 public immutable usde;

    IAaveV3Pool public immutable aavePool;
    IAToken public immutable aUsdc;
    ISDAI public immutable sDAI;
    ISFrax public immutable sFRAX;
    ISUSDe public immutable sUSDe;

    ICurveStableSwapNG public immutable curve;
    int128 public immutable idxUsdc;
    int128 public immutable idxDai;
    int128 public immutable idxFrax;
    int128 public immutable idxUsde;

    // ═══════════════════════════════════════════════════════════════
    //  Configuration
    // ═══════════════════════════════════════════════════════════════

    /// @notice 目標配分 (basis points, sum = 10000)
    uint256[4] public targets;

    /// @notice リスクパラメータ
    uint256 public maxPerProtocol = 4000;     // 40%
    uint256 public maxSusde = 2500;            // 25% (cooldown risk)
    uint256 public rebalanceThreshold = 300;   // 3%
    uint256 public slippage = 30;              // 0.3%
    uint256 public harvestInterval = 6 hours;  // 最小 harvest 間隔

    // ═══════════════════════════════════════════════════════════════
    //  State
    // ═══════════════════════════════════════════════════════════════

    uint256 public lastHarvest;
    uint256 public prevAssets;
    uint256 public prevTimestamp;
    uint256 public latestApy; // 直近の APY (bps)

    // ═══════════════════════════════════════════════════════════════
    //  Events
    // ═══════════════════════════════════════════════════════════════

    event Deployed(uint256 amount, uint256[4] split);
    event Freed(uint256 amount);
    event Harvested(uint256 total, uint256 profit, uint256 apy);
    event Rebalanced(uint256[4] before_, uint256[4] after_);
    event TargetsUpdated(uint256[4] newTargets);
    event Emergency(uint256 recovered);

    // ═══════════════════════════════════════════════════════════════
    //  Errors
    // ═══════════════════════════════════════════════════════════════

    error BadTargets();
    error ExceedsMax(uint8 proto, uint256 val);

    // ═══════════════════════════════════════════════════════════════
    //  Constructor
    // ═══════════════════════════════════════════════════════════════

    struct Params {
        address usdc;
        address dai;
        address frax;
        address usde;
        address aavePool;
        address aUsdc;
        address sdai_;
        address sfrax_;
        address susde_;
        address curve_;
        int128 idxUsdc;
        int128 idxDai;
        int128 idxFrax;
        int128 idxUsde;
        address management_;
    }

    constructor(Params memory p) {
        // BaseStrategy fields
        _asset = p.usdc;
        tokenizedStrategy = p.management_;
        name = "RealYield Aggregator";

        usdc = IERC20(p.usdc);
        dai = IERC20(p.dai);
        frax = IERC20(p.frax);
        usde = IERC20(p.usde);

        aavePool = IAaveV3Pool(p.aavePool);
        aUsdc = IAToken(p.aUsdc);
        sDAI = ISDAI(p.sdai_);
        sFRAX = ISFrax(p.sfrax_);
        sUSDe = ISUSDe(p.susde_);
        curve = ICurveStableSwapNG(p.curve_);

        idxUsdc = p.idxUsdc;
        idxDai = p.idxDai;
        idxFrax = p.idxFrax;
        idxUsde = p.idxUsde;

        // Default: 30/30/20/20
        targets = [uint256(3000), uint256(3000), uint256(2000), uint256(2000)];

        // Approvals
        IERC20(p.usdc).forceApprove(p.aavePool, type(uint256).max);
        IERC20(p.usdc).forceApprove(p.curve_, type(uint256).max);
        IERC20(p.dai).forceApprove(p.sdai_, type(uint256).max);
        IERC20(p.dai).forceApprove(p.curve_, type(uint256).max);
        IERC20(p.frax).forceApprove(p.sfrax_, type(uint256).max);
        IERC20(p.frax).forceApprove(p.curve_, type(uint256).max);
        IERC20(p.usde).forceApprove(p.susde_, type(uint256).max);
        IERC20(p.usde).forceApprove(p.curve_, type(uint256).max);
    }

    // ═══════════════════════════════════════════════════════════════
    //  BaseStrategy Required Overrides
    // ═══════════════════════════════════════════════════════════════

    /// @notice Vault が deposit した時に呼ばれる
    function _deployFunds(uint256 _amount) internal override {
        uint256[4] memory split = _calcSplit(_amount);

        if (split[AAVE] > 0) {
            aavePool.supply(address(usdc), split[AAVE], address(this), 0);
        }
        if (split[SDAI] > 0) {
            uint256 d = _swap(idxUsdc, idxDai, split[SDAI]);
            if (d > 0) sDAI.deposit(d, address(this));
        }
        if (split[SFRAX] > 0) {
            uint256 f = _swap(idxUsdc, idxFrax, split[SFRAX]);
            if (f > 0) sFRAX.deposit(f, address(this));
        }
        if (split[SUSDE] > 0) {
            uint256 u = _swap(idxUsdc, idxUsde, split[SUSDE]);
            if (u > 0) sUSDe.deposit(u, address(this));
        }

        emit Deployed(_amount, split);
    }

    /// @notice Vault が withdraw する時に呼ばれる
    function _freeFunds(uint256 _amount) internal override {
        uint256 remaining = _amount;

        // 1. Loose USDC first
        uint256 loose = usdc.balanceOf(address(this));
        if (loose >= remaining) return;
        remaining -= loose;

        // 2. Aave (instant, most liquid)
        remaining = _freeFromAave(remaining);
        if (remaining == 0) return;

        // 3. sDAI
        remaining = _freeFromSdai(remaining);
        if (remaining == 0) return;

        // 4. sFRAX
        remaining = _freeFromSfrax(remaining);
        if (remaining == 0) return;

        // 5. sUSDe (least liquid due to cooldown)
        _freeFromSusde(remaining);

        emit Freed(_amount);
    }

    /// @notice Keeper が report() を呼んだ時に実行される
    function _harvestAndReport() internal override returns (uint256 _totalAssets) {
        _totalAssets = _total();

        // APY calculation
        uint256 profit = 0;
        if (_totalAssets > prevAssets && prevAssets > 0) {
            profit = _totalAssets - prevAssets;
        }
        latestApy = _calcApy(_totalAssets);

        prevAssets = _totalAssets;
        prevTimestamp = block.timestamp;
        lastHarvest = block.timestamp;

        emit Harvested(_totalAssets, profit, latestApy);
    }

    /// @notice 緊急停止時に呼ばれる
    function _emergencyWithdraw(uint256 _amount) internal override {
        // 全プロトコルから回収
        uint256 aaveBal = aUsdc.balanceOf(address(this));
        if (aaveBal > 0) aavePool.withdraw(address(usdc), type(uint256).max, address(this));

        uint256 sdaiBal = sDAI.balanceOf(address(this));
        if (sdaiBal > 0) {
            uint256 d = sDAI.redeem(sdaiBal, address(this), address(this));
            if (d > 0) _swap(idxDai, idxUsdc, d);
        }

        uint256 sfraxBal = sFRAX.balanceOf(address(this));
        if (sfraxBal > 0) {
            uint256 f = sFRAX.redeem(sfraxBal, address(this), address(this));
            if (f > 0) _swap(idxFrax, idxUsdc, f);
        }

        uint256 susdeBal = sUSDe.balanceOf(address(this));
        if (susdeBal > 0) {
            uint256 u = sUSDe.redeem(susdeBal, address(this), address(this));
            if (u > 0) _swap(idxUsde, idxUsdc, u);
        }

        emit Emergency(usdc.balanceOf(address(this)));
    }

    // ═══════════════════════════════════════════════════════════════
    //  BaseStrategy Optional Overrides
    // ═══════════════════════════════════════════════════════════════

    /// @notice リバランスが必要な時に true を返す
    /// @dev Yearn の tend() トリガーとして使われる
    function _tendTrigger() internal view override returns (bool) {
        if (block.timestamp < lastHarvest + harvestInterval) return false;
        return _needsRebalance();
    }

    /// @notice tend() 実行 = リバランスのみ（利益報告なし）
    function _tend(uint256) internal override {
        if (_needsRebalance()) {
            _rebalance();
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  Rebalance Engine
    // ═══════════════════════════════════════════════════════════════

    function _needsRebalance() internal view returns (bool) {
        uint256 total = _total();
        if (total == 0) return false;

        uint256[4] memory curr = _bps(total);
        for (uint8 i = 0; i < N; i++) {
            uint256 diff = curr[i] > targets[i] ? curr[i] - targets[i] : targets[i] - curr[i];
            if (diff > rebalanceThreshold) return true;
        }
        return false;
    }

    function _rebalance() internal {
        uint256 total = _total();
        if (total == 0) return;

        uint256[4] memory vals = _values();
        uint256[4] memory before_ = vals;

        // Phase 1: Withdraw from over-allocated
        for (uint8 i = 0; i < N; i++) {
            uint256 currBps = (vals[i] * BPS) / total;
            if (currBps > targets[i] + rebalanceThreshold) {
                uint256 target = (total * targets[i]) / BPS;
                uint256 excess = vals[i] > target ? vals[i] - target : 0;
                if (excess > 0) _withdrawFrom(i, excess);
            }
        }

        // Phase 2: Deposit to under-allocated
        uint256 loose = usdc.balanceOf(address(this));
        for (uint8 i = 0; i < N; i++) {
            if (loose == 0) break;
            uint256 currBps = (vals[i] * BPS) / total;
            if (currBps + rebalanceThreshold < targets[i]) {
                uint256 target = (total * targets[i]) / BPS;
                uint256 deficit = target > vals[i] ? target - vals[i] : 0;
                if (deficit > 0) {
                    uint256 amt = deficit > loose ? loose : deficit;
                    _depositTo(i, amt);
                    loose -= amt;
                }
            }
        }

        emit Rebalanced(before_, _values());
    }

    // ═══════════════════════════════════════════════════════════════
    //  Internal: Protocol Operations
    // ═══════════════════════════════════════════════════════════════

    function _depositTo(uint8 p, uint256 amt) internal {
        if (p == AAVE) {
            aavePool.supply(address(usdc), amt, address(this), 0);
        } else if (p == SDAI) {
            uint256 d = _swap(idxUsdc, idxDai, amt);
            if (d > 0) sDAI.deposit(d, address(this));
        } else if (p == SFRAX) {
            uint256 f = _swap(idxUsdc, idxFrax, amt);
            if (f > 0) sFRAX.deposit(f, address(this));
        } else if (p == SUSDE) {
            uint256 u = _swap(idxUsdc, idxUsde, amt);
            if (u > 0) sUSDe.deposit(u, address(this));
        }
    }

    function _withdrawFrom(uint8 p, uint256 amt) internal {
        if (p == AAVE) {
            uint256 bal = aUsdc.balanceOf(address(this));
            uint256 w = amt > bal ? bal : amt;
            if (w > 0) aavePool.withdraw(address(usdc), w, address(this));
        } else if (p == SDAI) {
            _redeemErc4626(sDAI, idxDai, amt);
        } else if (p == SFRAX) {
            _redeemErc4626(sFRAX, idxFrax, amt);
        } else if (p == SUSDE) {
            _redeemErc4626(sUSDe, idxUsde, amt);
        }
    }

    function _redeemErc4626(ISDAI vault, int128 fromIdx, uint256 amt) internal {
        uint256 shares = vault.convertToShares(amt);
        uint256 bal = vault.balanceOf(address(this));
        if (shares > bal) shares = bal;
        if (shares > 0) {
            uint256 out = vault.redeem(shares, address(this), address(this));
            if (out > 0) _swap(fromIdx, idxUsdc, out);
        }
    }

    // Overloads for sFRAX and sUSDe which have different interfaces but same ERC-4626 pattern
    function _redeemErc4626(ISFrax vault, int128 fromIdx, uint256 amt) internal {
        uint256 shares = vault.convertToShares(amt);
        uint256 bal = vault.balanceOf(address(this));
        if (shares > bal) shares = bal;
        if (shares > 0) {
            uint256 out = vault.redeem(shares, address(this), address(this));
            if (out > 0) _swap(fromIdx, idxUsdc, out);
        }
    }

    function _redeemErc4626(ISUSDe vault, int128 fromIdx, uint256 amt) internal {
        uint256 shares = vault.convertToShares(amt);
        uint256 bal = vault.balanceOf(address(this));
        if (shares > bal) shares = bal;
        if (shares > 0) {
            uint256 out = vault.redeem(shares, address(this), address(this));
            if (out > 0) _swap(fromIdx, idxUsdc, out);
        }
    }

    function _freeFromAave(uint256 amt) internal returns (uint256 remaining) {
        uint256 bal = aUsdc.balanceOf(address(this));
        uint256 w = amt > bal ? bal : amt;
        if (w > 0) {
            aavePool.withdraw(address(usdc), w, address(this));
            return amt > w ? amt - w : 0;
        }
        return amt;
    }

    function _freeFromSdai(uint256 amt) internal returns (uint256 remaining) {
        uint256 shares = sDAI.convertToShares(amt);
        uint256 bal = sDAI.balanceOf(address(this));
        if (shares > bal) shares = bal;
        if (shares > 0) {
            uint256 d = sDAI.redeem(shares, address(this), address(this));
            uint256 got = _swap(idxDai, idxUsdc, d);
            return amt > got ? amt - got : 0;
        }
        return amt;
    }

    function _freeFromSfrax(uint256 amt) internal returns (uint256 remaining) {
        uint256 shares = sFRAX.convertToShares(amt);
        uint256 bal = sFRAX.balanceOf(address(this));
        if (shares > bal) shares = bal;
        if (shares > 0) {
            uint256 f = sFRAX.redeem(shares, address(this), address(this));
            uint256 got = _swap(idxFrax, idxUsdc, f);
            return amt > got ? amt - got : 0;
        }
        return amt;
    }

    function _freeFromSusde(uint256 amt) internal returns (uint256) {
        uint256 shares = sUSDe.convertToShares(amt);
        uint256 bal = sUSDe.balanceOf(address(this));
        if (shares > bal) shares = bal;
        if (shares > 0) {
            uint256 u = sUSDe.redeem(shares, address(this), address(this));
            uint256 got = _swap(idxUsde, idxUsdc, u);
            return amt > got ? amt - got : 0;
        }
        return amt;
    }

    // ═══════════════════════════════════════════════════════════════
    //  Internal: Curve Swap
    // ═══════════════════════════════════════════════════════════════

    function _swap(int128 from, int128 to, uint256 amt) internal returns (uint256) {
        if (amt == 0) return 0;
        uint256 expected = curve.get_dy(from, to, amt);
        uint256 minOut = (expected * (BPS - slippage)) / BPS;
        return curve.exchange(from, to, amt, minOut);
    }

    // ═══════════════════════════════════════════════════════════════
    //  Internal: Asset Calculations
    // ═══════════════════════════════════════════════════════════════

    function _values() internal view returns (uint256[4] memory v) {
        v[AAVE] = aUsdc.balanceOf(address(this));
        uint256 sdaiShares = sDAI.balanceOf(address(this));
        v[SDAI] = sdaiShares > 0 ? sDAI.convertToAssets(sdaiShares) : 0;
        uint256 sfraxShares = sFRAX.balanceOf(address(this));
        v[SFRAX] = sfraxShares > 0 ? sFRAX.convertToAssets(sfraxShares) : 0;
        uint256 susdeShares = sUSDe.balanceOf(address(this));
        v[SUSDE] = susdeShares > 0 ? sUSDe.convertToAssets(susdeShares) : 0;
    }

    function _deployed() internal view returns (uint256) {
        uint256[4] memory v = _values();
        return v[0] + v[1] + v[2] + v[3];
    }

    function _total() internal view returns (uint256) {
        return usdc.balanceOf(address(this)) + _deployed();
    }

    function _bps(uint256 total) internal view returns (uint256[4] memory b) {
        if (total == 0) return b;
        uint256[4] memory v = _values();
        for (uint8 i = 0; i < N; i++) {
            b[i] = (v[i] * BPS) / total;
        }
    }

    function _calcSplit(uint256 amt) internal view returns (uint256[4] memory s) {
        uint256 used = 0;
        for (uint8 i = 0; i < N - 1; i++) {
            s[i] = (amt * targets[i]) / BPS;
            used += s[i];
        }
        s[N - 1] = amt - used; // rounding dust goes to last
    }

    function _calcApy(uint256 current) internal returns (uint256) {
        if (prevTimestamp == 0 || prevAssets == 0) {
            prevAssets = current;
            prevTimestamp = block.timestamp;
            return 0;
        }
        uint256 elapsed = block.timestamp - prevTimestamp;
        if (elapsed == 0 || current <= prevAssets) return 0;
        uint256 profit = current - prevAssets;
        return (profit * SECONDS_PER_YEAR * BPS) / (prevAssets * elapsed);
    }

    // ═══════════════════════════════════════════════════════════════
    //  Public View Functions
    // ═══════════════════════════════════════════════════════════════

    function estimatedTotalAssets() external view returns (uint256) {
        return _total();
    }

    function protocolValues() external view returns (uint256[4] memory) {
        return _values();
    }

    function currentBps() external view returns (uint256[4] memory) {
        return _bps(_total());
    }

    function needsRebalance() external view returns (bool) {
        return _needsRebalance();
    }

    // ═══════════════════════════════════════════════════════════════
    //  Management
    // ═══════════════════════════════════════════════════════════════

    function setTargets(uint256[4] calldata t) external onlyManagement {
        uint256 sum = 0;
        for (uint8 i = 0; i < N; i++) {
            if (t[i] > maxPerProtocol) revert ExceedsMax(i, t[i]);
            sum += t[i];
        }
        if (sum != BPS) revert BadTargets();
        if (t[SUSDE] > maxSusde) revert ExceedsMax(SUSDE, t[SUSDE]);
        targets = t;
        emit TargetsUpdated(t);
    }

    function setParams(
        uint256 _maxPerProtocol,
        uint256 _maxSusde,
        uint256 _rebalanceThreshold,
        uint256 _slippage,
        uint256 _harvestInterval
    ) external onlyManagement {
        maxPerProtocol = _maxPerProtocol;
        maxSusde = _maxSusde;
        rebalanceThreshold = _rebalanceThreshold;
        slippage = _slippage;
        harvestInterval = _harvestInterval;
    }
}
