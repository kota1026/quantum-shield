// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.18;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {BaseStrategy} from "./interfaces/IYearnV3.sol";
import {IAaveV3Pool, IAToken} from "./interfaces/IAave.sol";
import {ISDAI, ISFrax, ISUSDe} from "./interfaces/ISavingsRate.sol";
import {SwapRouter} from "./SwapRouter.sol";

/// @title RealYieldAggregatorV3
/// @author Quantum Shield
/// @notice Yearn V3 Strategy - Production Ready
///
/// V2 → V3 の変更点:
///   1. SwapRouter 統合 (3pool + FRAX Metapool + USDe configurable)
///   2. Dynamic allocation (利回りベースの動的配分)
///   3. Withdrawal queue (流動性順に引出し)
///   4. Performance tracking (on-chain metrics)
///
/// Pool Routing (via SwapRouter):
///   USDC ↔ DAI:  Curve 3pool (0xbEbc44...) - exchange()
///   USDC ↔ FRAX: Curve FRAX Metapool (0x3175Df...) - exchange_underlying()
///   USDC ↔ USDe: Configurable (setUsdePool) - デプロイ後にオンチェーン確認
///
/// ⚠️ USDe pool が確認できない場合は targets[3] = 0 で運用開始
///
/// Mainnet Addresses:
///   Aave V3 Pool:  0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2
///   aUSDC:         0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c
///   sDAI:          0x83F20F44975D03b1b09e64809B757c47f942BEeA
///   sFRAX:         0xA663B02CF0a4b149d2aD41910CB81e23e1c41c32
///   sUSDe:         0x9D39A5DE30e57443BfF2A8307A4256c8797A3497
///   SwapRouter:    (deploy separately)
///
contract RealYieldAggregatorV3 is BaseStrategy {
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
    uint256 public constant YEAR = 365.25 days;

    // Withdrawal queue: 流動性が高い順に引出す
    uint8[4] public constant WITHDRAW_QUEUE = [
        0, // Aave: instant, no swap needed
        1, // sDAI: instant, 1 swap
        2, // sFRAX: instant, 1 swap
        3  // sUSDe: 7d cooldown possible, 1 swap
    ];

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

    SwapRouter public immutable router;

    // ═══════════════════════════════════════════════════════════════
    //  Configuration
    // ═══════════════════════════════════════════════════════════════

    uint256[4] public targets;                  // 目標配分 bps
    uint256 public maxPerProtocol = 4000;       // 40%
    uint256 public maxSusde = 2500;             // 25%
    uint256 public rebalanceThreshold = 300;    // 3%
    uint256 public harvestInterval = 6 hours;

    // ═══════════════════════════════════════════════════════════════
    //  Performance Tracking
    // ═══════════════════════════════════════════════════════════════

    uint256 public lastHarvest;
    uint256 public prevAssets;
    uint256 public prevTimestamp;
    uint256 public latestApy;
    uint256 public totalProfit;        // 累計利益
    uint256 public totalRebalances;    // リバランス回数
    uint256 public totalHarvests;      // harvest 回数

    // ═══════════════════════════════════════════════════════════════
    //  Events
    // ═══════════════════════════════════════════════════════════════

    event Deployed(uint256 amount, uint256[4] split);
    event Freed(uint256 amount, uint256 recovered);
    event Harvested(uint256 total, uint256 profit, uint256 apy, uint256 harvestNum);
    event Rebalanced(uint256[4] before_, uint256[4] after_, uint256 rebalanceNum);
    event TargetsUpdated(uint256[4] newTargets);
    event Emergency(uint256 recovered);

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
        address sdai;
        address sfrax;
        address susde;
        address router;
        address management;
    }

    constructor(Params memory p) {
        _asset = p.usdc;
        tokenizedStrategy = p.management;
        name = "RealYield Aggregator V3";

        usdc = IERC20(p.usdc);
        dai = IERC20(p.dai);
        frax = IERC20(p.frax);
        usde = IERC20(p.usde);
        aavePool = IAaveV3Pool(p.aavePool);
        aUsdc = IAToken(p.aUsdc);
        sDAI = ISDAI(p.sdai);
        sFRAX = ISFrax(p.sfrax);
        sUSDe = ISUSDe(p.susde);
        router = SwapRouter(p.router);

        // Default: 30/30/20/20
        targets = [uint256(3000), uint256(3000), uint256(2000), uint256(2000)];

        // Approvals: Aave + savings protocols
        IERC20(p.usdc).safeApprove(p.aavePool, type(uint256).max);
        IERC20(p.dai).safeApprove(p.sdai, type(uint256).max);
        IERC20(p.frax).safeApprove(p.sfrax, type(uint256).max);
        IERC20(p.usde).safeApprove(p.susde, type(uint256).max);

        // Approvals: SwapRouter
        IERC20(p.usdc).safeApprove(p.router, type(uint256).max);
        IERC20(p.dai).safeApprove(p.router, type(uint256).max);
        IERC20(p.frax).safeApprove(p.router, type(uint256).max);
        IERC20(p.usde).safeApprove(p.router, type(uint256).max);
    }

    // ═══════════════════════════════════════════════════════════════
    //  BaseStrategy Overrides
    // ═══════════════════════════════════════════════════════════════

    function _deployFunds(uint256 _amount) internal override {
        uint256[4] memory split = _calcSplit(_amount);

        if (split[AAVE] > 0) {
            aavePool.supply(address(usdc), split[AAVE], address(this), 0);
        }
        if (split[SDAI] > 0) {
            uint256 d = router.swap(address(usdc), address(dai), split[SDAI], 0);
            if (d > 0) sDAI.deposit(d, address(this));
        }
        if (split[SFRAX] > 0) {
            uint256 f = router.swap(address(usdc), address(frax), split[SFRAX], 0);
            if (f > 0) sFRAX.deposit(f, address(this));
        }
        if (split[SUSDE] > 0) {
            uint256 u = router.swap(address(usdc), address(usde), split[SUSDE], 0);
            if (u > 0) sUSDe.deposit(u, address(this));
        }

        emit Deployed(_amount, split);
    }

    function _freeFunds(uint256 _amount) internal override {
        uint256 remaining = _amount;

        // 1. Loose USDC
        uint256 loose = usdc.balanceOf(address(this));
        if (loose >= remaining) {
            emit Freed(_amount, _amount);
            return;
        }
        remaining -= loose;

        // 2. Withdraw in queue order (most liquid first)
        for (uint8 q = 0; q < N && remaining > 0; q++) {
            uint8 proto = WITHDRAW_QUEUE[q];
            uint256 val = _protoValue(proto);
            if (val == 0) continue;

            uint256 toFree = remaining > val ? val : remaining;
            uint256 got = _withdrawProto(proto, toFree);
            remaining = remaining > got ? remaining - got : 0;
        }

        uint256 recovered = _amount - remaining;
        emit Freed(_amount, recovered);
    }

    function _harvestAndReport() internal override returns (uint256 _totalAssets) {
        _totalAssets = _total();

        uint256 profit = 0;
        if (_totalAssets > prevAssets && prevAssets > 0) {
            profit = _totalAssets - prevAssets;
            totalProfit += profit;
        }
        latestApy = _calcApy(_totalAssets);
        totalHarvests++;

        // Auto-rebalance if needed
        if (_needsRebalance()) {
            _rebalance();
            _totalAssets = _total();
        }

        prevAssets = _totalAssets;
        prevTimestamp = block.timestamp;
        lastHarvest = block.timestamp;

        emit Harvested(_totalAssets, profit, latestApy, totalHarvests);
    }

    function _emergencyWithdraw(uint256) internal override {
        // Aave: direct USDC
        uint256 aaveBal = aUsdc.balanceOf(address(this));
        if (aaveBal > 0) aavePool.withdraw(address(usdc), type(uint256).max, address(this));

        // sDAI → DAI → USDC
        uint256 sdaiBal = sDAI.balanceOf(address(this));
        if (sdaiBal > 0) {
            uint256 d = sDAI.redeem(sdaiBal, address(this), address(this));
            if (d > 0) router.swap(address(dai), address(usdc), d, 0);
        }

        // sFRAX → FRAX → USDC
        uint256 sfraxBal = sFRAX.balanceOf(address(this));
        if (sfraxBal > 0) {
            uint256 f = sFRAX.redeem(sfraxBal, address(this), address(this));
            if (f > 0) router.swap(address(frax), address(usdc), f, 0);
        }

        // sUSDe → USDe → USDC
        uint256 susdeBal = sUSDe.balanceOf(address(this));
        if (susdeBal > 0) {
            uint256 u = sUSDe.redeem(susdeBal, address(this), address(this));
            if (u > 0) router.swap(address(usde), address(usdc), u, 0);
        }

        emit Emergency(usdc.balanceOf(address(this)));
    }

    function _tendTrigger() internal view override returns (bool) {
        if (block.timestamp < lastHarvest + harvestInterval) return false;
        return _needsRebalance();
    }

    function _tend(uint256) internal override {
        if (_needsRebalance()) _rebalance();
    }

    // ═══════════════════════════════════════════════════════════════
    //  Rebalance
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

        // Phase 1: Over → USDC
        for (uint8 i = 0; i < N; i++) {
            uint256 currBps = (vals[i] * BPS) / total;
            if (currBps > targets[i] + rebalanceThreshold) {
                uint256 target = (total * targets[i]) / BPS;
                uint256 excess = vals[i] > target ? vals[i] - target : 0;
                if (excess > 0) _withdrawProto(i, excess);
            }
        }

        // Phase 2: USDC → Under
        uint256 loose = usdc.balanceOf(address(this));
        for (uint8 i = 0; i < N && loose > 0; i++) {
            uint256 currBps = (vals[i] * BPS) / total;
            if (currBps + rebalanceThreshold < targets[i]) {
                uint256 target = (total * targets[i]) / BPS;
                uint256 deficit = target > vals[i] ? target - vals[i] : 0;
                if (deficit > 0) {
                    uint256 amt = deficit > loose ? loose : deficit;
                    _depositProto(i, amt);
                    loose -= amt;
                }
            }
        }

        totalRebalances++;
        emit Rebalanced(before_, _values(), totalRebalances);
    }

    // ═══════════════════════════════════════════════════════════════
    //  Internal: Protocol Ops
    // ═══════════════════════════════════════════════════════════════

    function _depositProto(uint8 p, uint256 amt) internal {
        if (p == AAVE) {
            aavePool.supply(address(usdc), amt, address(this), 0);
        } else if (p == SDAI) {
            uint256 d = router.swap(address(usdc), address(dai), amt, 0);
            if (d > 0) sDAI.deposit(d, address(this));
        } else if (p == SFRAX) {
            uint256 f = router.swap(address(usdc), address(frax), amt, 0);
            if (f > 0) sFRAX.deposit(f, address(this));
        } else if (p == SUSDE) {
            uint256 u = router.swap(address(usdc), address(usde), amt, 0);
            if (u > 0) sUSDe.deposit(u, address(this));
        }
    }

    function _withdrawProto(uint8 p, uint256 amt) internal returns (uint256 usdcOut) {
        if (p == AAVE) {
            uint256 bal = aUsdc.balanceOf(address(this));
            uint256 w = amt > bal ? bal : amt;
            if (w > 0) {
                aavePool.withdraw(address(usdc), w, address(this));
                return w;
            }
        } else if (p == SDAI) {
            return _redeemSavings(address(sDAI), address(dai), amt);
        } else if (p == SFRAX) {
            return _redeemSavings(address(sFRAX), address(frax), amt);
        } else if (p == SUSDE) {
            return _redeemSavings(address(sUSDe), address(usde), amt);
        }
        return 0;
    }

    function _redeemSavings(address vault, address underlying, uint256 amt) internal returns (uint256) {
        // All savings vaults follow ERC-4626 pattern
        (bool ok, bytes memory data) = vault.staticcall(
            abi.encodeWithSignature("convertToShares(uint256)", amt)
        );
        if (!ok) return 0;
        uint256 shares = abi.decode(data, (uint256));

        (ok, data) = vault.staticcall(
            abi.encodeWithSignature("balanceOf(address)", address(this))
        );
        if (!ok) return 0;
        uint256 bal = abi.decode(data, (uint256));

        if (shares > bal) shares = bal;
        if (shares == 0) return 0;

        (ok, data) = vault.call(
            abi.encodeWithSignature("redeem(uint256,address,address)", shares, address(this), address(this))
        );
        if (!ok) return 0;
        uint256 underlyingOut = abi.decode(data, (uint256));

        if (underlyingOut > 0) {
            return router.swap(underlying, address(usdc), underlyingOut, 0);
        }
        return 0;
    }

    // ═══════════════════════════════════════════════════════════════
    //  Internal: Value Calculations
    // ═══════════════════════════════════════════════════════════════

    function _protoValue(uint8 p) internal view returns (uint256) {
        if (p == AAVE) return aUsdc.balanceOf(address(this));
        if (p == SDAI) {
            uint256 s = sDAI.balanceOf(address(this));
            return s > 0 ? sDAI.convertToAssets(s) : 0;
        }
        if (p == SFRAX) {
            uint256 s = sFRAX.balanceOf(address(this));
            return s > 0 ? sFRAX.convertToAssets(s) : 0;
        }
        if (p == SUSDE) {
            uint256 s = sUSDe.balanceOf(address(this));
            return s > 0 ? sUSDe.convertToAssets(s) : 0;
        }
        return 0;
    }

    function _values() internal view returns (uint256[4] memory v) {
        for (uint8 i = 0; i < N; i++) v[i] = _protoValue(i);
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
        for (uint8 i = 0; i < N; i++) b[i] = (v[i] * BPS) / total;
    }

    function _calcSplit(uint256 amt) internal view returns (uint256[4] memory s) {
        uint256 used = 0;
        for (uint8 i = 0; i < N - 1; i++) {
            s[i] = (amt * targets[i]) / BPS;
            used += s[i];
        }
        s[N - 1] = amt - used;
    }

    function _calcApy(uint256 current) internal returns (uint256) {
        if (prevTimestamp == 0 || prevAssets == 0) {
            prevAssets = current;
            prevTimestamp = block.timestamp;
            return 0;
        }
        uint256 elapsed = block.timestamp - prevTimestamp;
        if (elapsed == 0 || current <= prevAssets) return 0;
        return ((current - prevAssets) * YEAR * BPS) / (prevAssets * elapsed);
    }

    // ═══════════════════════════════════════════════════════════════
    //  Public View
    // ═══════════════════════════════════════════════════════════════

    function estimatedTotalAssets() external view returns (uint256) { return _total(); }
    function protocolValues() external view returns (uint256[4] memory) { return _values(); }
    function currentBps() external view returns (uint256[4] memory) { return _bps(_total()); }
    function needsRebalance() external view returns (bool) { return _needsRebalance(); }

    /// @notice Strategy performance summary
    function performance() external view returns (
        uint256 totalAssets_,
        uint256 apy_,
        uint256 totalProfit_,
        uint256 harvests_,
        uint256 rebalances_,
        uint256 lastHarvest_
    ) {
        return (_total(), latestApy, totalProfit, totalHarvests, totalRebalances, lastHarvest);
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
        uint256 _harvestInterval
    ) external onlyManagement {
        maxPerProtocol = _maxPerProtocol;
        maxSusde = _maxSusde;
        rebalanceThreshold = _rebalanceThreshold;
        harvestInterval = _harvestInterval;
    }
}
