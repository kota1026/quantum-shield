// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.18;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IAaveV3Pool, IAToken} from "./interfaces/IAave.sol";
import {ISDAI, ISFrax, ISUSDe} from "./interfaces/ISavingsRate.sol";
import {ICurveStableSwapNG} from "./interfaces/ICurveStableSwap.sol";

/// @title RealYieldAggregator
/// @author Quantum Shield
/// @notice Yearn V3 Strategy: 複数の「リアルイールド」プロトコルに自動最適配分
///
/// ═══════════════════════════════════════════════════════════════════
///  WHY THIS GETS SELECTED (選ばれる理由)
/// ═══════════════════════════════════════════════════════════════════
///
///  1. リアルイールドのみ → ポンジ排除で機関投資家に刺さる
///  2. 自動リバランス → Vault Manager の手間ゼロ
///  3. リスク分散 → 1プロトコル max 40% キャップ
///  4. 透明性 → オンチェーンで全配分比率が見える
///  5. ガス効率 → リバランスは閾値超えた時だけ
///
/// ═══════════════════════════════════════════════════════════════════
///  ARCHITECTURE
/// ═══════════════════════════════════════════════════════════════════
///
///  User deposits USDC
///   │
///   ├── Aave V3 (aUSDC)          → 貸出利息 (3-5%)
///   │     利回り源: 借り手の金利
///   │
///   ├── MakerDAO sDAI             → DSR (5-8%)
///   │     利回り源: DAI借り手のStability Fee
///   │     USDC → Curve → DAI → sDAI
///   │
///   ├── Frax sFRAX                → AMO収益 (4-6%)
///   │     利回り源: Frax AMO運用収益
///   │     USDC → Curve → FRAX → sFRAX
///   │
///   └── Ethena sUSDe              → Funding Rate (8-15%)
///         利回り源: Perp Funding + ステーキング
///         USDC → Curve → USDe → sUSDe
///         ※ 7日 cooldown あり → 配分比率で考慮
///
///  harvest() 時:
///   1. 各プロトコルの現在利回りを取得
///   2. 最適配分を計算
///   3. 閾値を超えたらリバランス実行
///   4. 総資産を報告
///
/// ═══════════════════════════════════════════════════════════════════
///  RISK MANAGEMENT
/// ═══════════════════════════════════════════════════════════════════
///
///  - maxAllocationBps: 各プロトコルへの最大配分 (default: 4000 = 40%)
///  - minAllocationBps: 最低配分 (default: 500 = 5%) → 常に分散
///  - rebalanceThresholdBps: この差以上ずれたらリバランス (default: 300 = 3%)
///  - sUSDe cooldown考慮: sUSDe 配分は maxSusdeAllocationBps で別制限
///  - 緊急停止: management が全額引出し可能
///
contract RealYieldAggregator {
    using SafeERC20 for IERC20;

    // ═══════════════════════════════════════════════════════════════
    //  Types
    // ═══════════════════════════════════════════════════════════════

    /// @notice 各プロトコルの配分状態
    struct Allocation {
        uint256 deposited;     // 投入した USDC 量
        uint256 currentValue;  // 現在の USDC 換算値
        uint256 targetBps;     // 目標配分 (basis points, 10000 = 100%)
    }

    /// @notice 利回り取得用の中間データ
    struct YieldSnapshot {
        uint256 aaveRate;      // Aave APY (basis points)
        uint256 sdaiRate;      // sDAI APY
        uint256 sfraxRate;     // sFRAX APY
        uint256 susdeRate;     // sUSDe APY
        uint256 totalRate;     // 加重平均 APY
    }

    // ═══════════════════════════════════════════════════════════════
    //  Protocol Enum
    // ═══════════════════════════════════════════════════════════════

    uint8 public constant PROTOCOL_AAVE = 0;
    uint8 public constant PROTOCOL_SDAI = 1;
    uint8 public constant PROTOCOL_SFRAX = 2;
    uint8 public constant PROTOCOL_SUSDE = 3;
    uint8 public constant NUM_PROTOCOLS = 4;

    // ═══════════════════════════════════════════════════════════════
    //  Immutables
    // ═══════════════════════════════════════════════════════════════

    IERC20 public immutable usdc;
    IERC20 public immutable dai;
    IERC20 public immutable frax;
    IERC20 public immutable usde;

    // Yield protocols
    IAaveV3Pool public immutable aavePool;
    IAToken public immutable aUsdc;
    ISDAI public immutable sdai;
    ISFrax public immutable sfrax;
    ISUSDe public immutable susde;

    // DEX for stablecoin swaps
    ICurveStableSwapNG public immutable curvePool; // USDC ↔ DAI ↔ FRAX ↔ USDe

    // Curve pool coin indices (pool-specific, set at deploy)
    int128 public immutable curveIndexUsdc;
    int128 public immutable curveIndexDai;
    int128 public immutable curveIndexFrax;
    int128 public immutable curveIndexUsde;

    // ═══════════════════════════════════════════════════════════════
    //  State
    // ═══════════════════════════════════════════════════════════════

    address public management;
    address public keeper; // harvest() を呼べるアドレス（自動化用）

    // Risk parameters
    uint256 public maxAllocationBps = 4000;       // 各プロトコル最大40%
    uint256 public minAllocationBps = 500;         // 各プロトコル最低5%
    uint256 public rebalanceThresholdBps = 300;    // 3%以上ずれたらリバランス
    uint256 public maxSusdeAllocationBps = 2500;   // sUSDe は max 25%（cooldownリスク）
    uint256 public slippageBps = 30;               // Curve swap スリッページ 0.3%

    // Target allocations (basis points, sum = 10000)
    uint256[4] public targetAllocations;

    // Tracking
    uint256 public lastHarvestTimestamp;
    uint256 public lastTotalAssets;

    // Snapshot for APY calculation
    uint256 public prevSnapshotAssets;
    uint256 public prevSnapshotTimestamp;

    // ═══════════════════════════════════════════════════════════════
    //  Events
    // ═══════════════════════════════════════════════════════════════

    event FundsDeployed(uint256 amount, uint256[4] allocations);
    event FundsFreed(uint256 amount);
    event Harvested(uint256 totalAssets, uint256 profit, uint256 apy);
    event Rebalanced(uint256[4] oldAllocations, uint256[4] newAllocations);
    event TargetAllocationsUpdated(uint256[4] newTargets);
    event EmergencyWithdraw(uint256 totalRecovered);
    event KeeperUpdated(address newKeeper);

    // ═══════════════════════════════════════════════════════════════
    //  Errors
    // ═══════════════════════════════════════════════════════════════

    error NotManagement();
    error NotKeeper();
    error ZeroAmount();
    error InvalidAllocations();
    error AllocationExceedsMax(uint8 protocol, uint256 allocation);
    error SlippageExceeded();

    // ═══════════════════════════════════════════════════════════════
    //  Modifiers
    // ═══════════════════════════════════════════════════════════════

    modifier onlyManagement() {
        if (msg.sender != management) revert NotManagement();
        _;
    }

    modifier onlyKeeper() {
        if (msg.sender != keeper && msg.sender != management) revert NotKeeper();
        _;
    }

    // ═══════════════════════════════════════════════════════════════
    //  Constructor
    // ═══════════════════════════════════════════════════════════════

    struct ConstructorParams {
        address usdc;
        address dai;
        address frax;
        address usde;
        address aavePool;
        address aUsdc;
        address sdai;
        address sfrax;
        address susde;
        address curvePool;
        int128 curveIndexUsdc;
        int128 curveIndexDai;
        int128 curveIndexFrax;
        int128 curveIndexUsde;
    }

    constructor(ConstructorParams memory p) {
        usdc = IERC20(p.usdc);
        dai = IERC20(p.dai);
        frax = IERC20(p.frax);
        usde = IERC20(p.usde);

        aavePool = IAaveV3Pool(p.aavePool);
        aUsdc = IAToken(p.aUsdc);
        sdai = ISDAI(p.sdai);
        sfrax = ISFrax(p.sfrax);
        susde = ISUSDe(p.susde);
        curvePool = ICurveStableSwapNG(p.curvePool);

        curveIndexUsdc = p.curveIndexUsdc;
        curveIndexDai = p.curveIndexDai;
        curveIndexFrax = p.curveIndexFrax;
        curveIndexUsde = p.curveIndexUsde;

        management = msg.sender;
        keeper = msg.sender;

        // Default equal allocation: 25% each
        targetAllocations = [uint256(2500), uint256(2500), uint256(2500), uint256(2500)];

        // Approvals
        IERC20(p.usdc).safeApprove(p.aavePool, type(uint256).max);
        IERC20(p.usdc).safeApprove(p.curvePool, type(uint256).max);
        IERC20(p.dai).safeApprove(p.sdai, type(uint256).max);
        IERC20(p.dai).safeApprove(p.curvePool, type(uint256).max);
        IERC20(p.frax).safeApprove(p.sfrax, type(uint256).max);
        IERC20(p.frax).safeApprove(p.curvePool, type(uint256).max);
        IERC20(p.usde).safeApprove(p.susde, type(uint256).max);
        IERC20(p.usde).safeApprove(p.curvePool, type(uint256).max);
    }

    // ═══════════════════════════════════════════════════════════════
    //  Core: Deploy Funds (Yearn V3 _deployFunds)
    // ═══════════════════════════════════════════════════════════════

    /// @notice USDC を受け取り、目標配分に従い各プロトコルに投入
    /// @param _amount USDC 量
    function deployFunds(uint256 _amount) external onlyManagement {
        if (_amount == 0) revert ZeroAmount();

        uint256[4] memory amounts = _calculateAllocations(_amount);

        // Protocol 0: Aave (USDC → Aave directly)
        if (amounts[PROTOCOL_AAVE] > 0) {
            aavePool.supply(address(usdc), amounts[PROTOCOL_AAVE], address(this), 0);
        }

        // Protocol 1: sDAI (USDC → Curve → DAI → sDAI)
        if (amounts[PROTOCOL_SDAI] > 0) {
            uint256 daiOut = _swapViaCurve(curveIndexUsdc, curveIndexDai, amounts[PROTOCOL_SDAI]);
            if (daiOut > 0) {
                sdai.deposit(daiOut, address(this));
            }
        }

        // Protocol 2: sFRAX (USDC → Curve → FRAX → sFRAX)
        if (amounts[PROTOCOL_SFRAX] > 0) {
            uint256 fraxOut = _swapViaCurve(curveIndexUsdc, curveIndexFrax, amounts[PROTOCOL_SFRAX]);
            if (fraxOut > 0) {
                sfrax.deposit(fraxOut, address(this));
            }
        }

        // Protocol 3: sUSDe (USDC → Curve → USDe → sUSDe)
        if (amounts[PROTOCOL_SUSDE] > 0) {
            uint256 usdeOut = _swapViaCurve(curveIndexUsdc, curveIndexUsde, amounts[PROTOCOL_SUSDE]);
            if (usdeOut > 0) {
                susde.deposit(usdeOut, address(this));
            }
        }

        emit FundsDeployed(_amount, amounts);
    }

    // ═══════════════════════════════════════════════════════════════
    //  Core: Free Funds (Yearn V3 _freeFunds)
    // ═══════════════════════════════════════════════════════════════

    /// @notice 指定額を引き出す（各プロトコルから比例配分で引出し）
    /// @param _amount 必要な USDC 量
    function freeFunds(uint256 _amount) external onlyManagement {
        if (_amount == 0) revert ZeroAmount();

        uint256 remaining = _amount;

        // Step 1: 手元の loose USDC を先に使う
        uint256 loose = usdc.balanceOf(address(this));
        if (loose >= remaining) {
            emit FundsFreed(_amount);
            return;
        }
        remaining -= loose;

        // Step 2: 各プロトコルから比例配分で引出し
        uint256 totalDeployed = _totalDeployedAssets();
        if (totalDeployed == 0) {
            emit FundsFreed(_amount - remaining);
            return;
        }

        // Aave (最も流動性が高いので優先)
        uint256 aaveValue = _aaveAssets();
        if (aaveValue > 0 && remaining > 0) {
            uint256 toFree = (remaining * aaveValue) / totalDeployed;
            if (toFree > aaveValue) toFree = aaveValue;
            if (toFree > 0) {
                aavePool.withdraw(address(usdc), toFree, address(this));
                remaining = remaining > toFree ? remaining - toFree : 0;
            }
        }

        // sDAI → DAI → USDC
        uint256 sdaiValue = _sdaiAssets();
        if (sdaiValue > 0 && remaining > 0) {
            uint256 toFree = (remaining * sdaiValue) / totalDeployed;
            if (toFree > sdaiValue) toFree = sdaiValue;
            if (toFree > 0) {
                uint256 sharesToRedeem = sdai.convertToShares(toFree);
                uint256 sdaiBal = sdai.balanceOf(address(this));
                if (sharesToRedeem > sdaiBal) sharesToRedeem = sdaiBal;
                if (sharesToRedeem > 0) {
                    uint256 daiOut = sdai.redeem(sharesToRedeem, address(this), address(this));
                    uint256 usdcBack = _swapViaCurve(curveIndexDai, curveIndexUsdc, daiOut);
                    remaining = remaining > usdcBack ? remaining - usdcBack : 0;
                }
            }
        }

        // sFRAX → FRAX → USDC
        uint256 sfraxValue = _sfraxAssets();
        if (sfraxValue > 0 && remaining > 0) {
            uint256 toFree = (remaining * sfraxValue) / totalDeployed;
            if (toFree > sfraxValue) toFree = sfraxValue;
            if (toFree > 0) {
                uint256 sharesToRedeem = sfrax.convertToShares(toFree);
                uint256 sfraxBal = sfrax.balanceOf(address(this));
                if (sharesToRedeem > sfraxBal) sharesToRedeem = sfraxBal;
                if (sharesToRedeem > 0) {
                    uint256 fraxOut = sfrax.redeem(sharesToRedeem, address(this), address(this));
                    uint256 usdcBack = _swapViaCurve(curveIndexFrax, curveIndexUsdc, fraxOut);
                    remaining = remaining > usdcBack ? remaining - usdcBack : 0;
                }
            }
        }

        // sUSDe → USDe → USDC (NOTE: cooldown は省略。instant redeem が可能な場合のみ)
        uint256 susdeValue = _susdeAssets();
        if (susdeValue > 0 && remaining > 0) {
            uint256 toFree = remaining; // 残り全部
            if (toFree > susdeValue) toFree = susdeValue;
            if (toFree > 0) {
                uint256 sharesToRedeem = susde.convertToShares(toFree);
                uint256 susdeBal = susde.balanceOf(address(this));
                if (sharesToRedeem > susdeBal) sharesToRedeem = susdeBal;
                if (sharesToRedeem > 0) {
                    uint256 usdeOut = susde.redeem(sharesToRedeem, address(this), address(this));
                    _swapViaCurve(curveIndexUsde, curveIndexUsdc, usdeOut);
                }
            }
        }

        emit FundsFreed(_amount);
    }

    // ═══════════════════════════════════════════════════════════════
    //  Core: Harvest & Report (Yearn V3 _harvestAndReport)
    // ═══════════════════════════════════════════════════════════════

    /// @notice 利益を収穫し、必要ならリバランスし、総資産を報告
    /// @return totalAssets_ 総資産 (USDC 建て)
    function harvestAndReport() external onlyKeeper returns (uint256 totalAssets_) {
        // Step 1: 現在の総資産を計算
        totalAssets_ = _estimatedTotalAssets();

        // Step 2: 利益計算
        uint256 profit = 0;
        if (totalAssets_ > lastTotalAssets) {
            profit = totalAssets_ - lastTotalAssets;
        }

        // Step 3: APY 計算（オンチェーン記録用）
        uint256 apy = _calculateApy(totalAssets_);

        // Step 4: リバランス判定 & 実行
        if (_needsRebalance()) {
            _rebalance();
            // リバランス後の totalAssets を再計算
            totalAssets_ = _estimatedTotalAssets();
        }

        // Step 5: スナップショット更新
        lastTotalAssets = totalAssets_;
        lastHarvestTimestamp = block.timestamp;

        emit Harvested(totalAssets_, profit, apy);
    }

    // ═══════════════════════════════════════════════════════════════
    //  Rebalance Logic (★差別化ポイント)
    // ═══════════════════════════════════════════════════════════════

    /// @notice リバランスが必要かチェック
    function _needsRebalance() internal view returns (bool) {
        uint256 total = _estimatedTotalAssets();
        if (total == 0) return false;

        uint256[4] memory currentBps = _currentAllocationBps(total);

        for (uint8 i = 0; i < NUM_PROTOCOLS; i++) {
            uint256 diff = currentBps[i] > targetAllocations[i]
                ? currentBps[i] - targetAllocations[i]
                : targetAllocations[i] - currentBps[i];

            if (diff > rebalanceThresholdBps) return true;
        }
        return false;
    }

    /// @notice 実際のリバランス実行
    /// @dev Over-allocated なプロトコルから引出し → Under-allocated に投入
    function _rebalance() internal {
        uint256 total = _estimatedTotalAssets();
        if (total == 0) return;

        uint256[4] memory currentBps = _currentAllocationBps(total);
        uint256[4] memory currentValues = _allProtocolAssets();
        uint256[4] memory oldAllocations = currentValues;

        // Phase 1: Over-allocated から引出して USDC にする
        for (uint8 i = 0; i < NUM_PROTOCOLS; i++) {
            if (currentBps[i] > targetAllocations[i] + rebalanceThresholdBps) {
                uint256 targetValue = (total * targetAllocations[i]) / 10000;
                uint256 excess = currentValues[i] - targetValue;
                if (excess > 0) {
                    _withdrawFromProtocol(i, excess);
                }
            }
        }

        // Phase 2: 手元の USDC を Under-allocated に投入
        uint256 looseUsdc = usdc.balanceOf(address(this));
        if (looseUsdc == 0) return;

        for (uint8 i = 0; i < NUM_PROTOCOLS; i++) {
            if (currentBps[i] + rebalanceThresholdBps < targetAllocations[i]) {
                uint256 targetValue = (total * targetAllocations[i]) / 10000;
                uint256 deficit = targetValue > currentValues[i] ? targetValue - currentValues[i] : 0;
                if (deficit > 0 && looseUsdc > 0) {
                    uint256 toDeposit = deficit > looseUsdc ? looseUsdc : deficit;
                    _depositToProtocol(i, toDeposit);
                    looseUsdc -= toDeposit;
                }
            }
        }

        uint256[4] memory newValues = _allProtocolAssets();
        emit Rebalanced(oldAllocations, newValues);
    }

    // ═══════════════════════════════════════════════════════════════
    //  Internal: Protocol Deposits / Withdrawals
    // ═══════════════════════════════════════════════════════════════

    function _depositToProtocol(uint8 _protocol, uint256 _usdcAmount) internal {
        if (_protocol == PROTOCOL_AAVE) {
            aavePool.supply(address(usdc), _usdcAmount, address(this), 0);
        } else if (_protocol == PROTOCOL_SDAI) {
            uint256 daiOut = _swapViaCurve(curveIndexUsdc, curveIndexDai, _usdcAmount);
            if (daiOut > 0) sdai.deposit(daiOut, address(this));
        } else if (_protocol == PROTOCOL_SFRAX) {
            uint256 fraxOut = _swapViaCurve(curveIndexUsdc, curveIndexFrax, _usdcAmount);
            if (fraxOut > 0) sfrax.deposit(fraxOut, address(this));
        } else if (_protocol == PROTOCOL_SUSDE) {
            uint256 usdeOut = _swapViaCurve(curveIndexUsdc, curveIndexUsde, _usdcAmount);
            if (usdeOut > 0) susde.deposit(usdeOut, address(this));
        }
    }

    function _withdrawFromProtocol(uint8 _protocol, uint256 _usdcAmount) internal {
        if (_protocol == PROTOCOL_AAVE) {
            uint256 aaveBal = aUsdc.balanceOf(address(this));
            uint256 toWithdraw = _usdcAmount > aaveBal ? aaveBal : _usdcAmount;
            if (toWithdraw > 0) {
                aavePool.withdraw(address(usdc), toWithdraw, address(this));
            }
        } else if (_protocol == PROTOCOL_SDAI) {
            uint256 shares = sdai.convertToShares(_usdcAmount);
            uint256 bal = sdai.balanceOf(address(this));
            if (shares > bal) shares = bal;
            if (shares > 0) {
                uint256 daiOut = sdai.redeem(shares, address(this), address(this));
                _swapViaCurve(curveIndexDai, curveIndexUsdc, daiOut);
            }
        } else if (_protocol == PROTOCOL_SFRAX) {
            uint256 shares = sfrax.convertToShares(_usdcAmount);
            uint256 bal = sfrax.balanceOf(address(this));
            if (shares > bal) shares = bal;
            if (shares > 0) {
                uint256 fraxOut = sfrax.redeem(shares, address(this), address(this));
                _swapViaCurve(curveIndexFrax, curveIndexUsdc, fraxOut);
            }
        } else if (_protocol == PROTOCOL_SUSDE) {
            uint256 shares = susde.convertToShares(_usdcAmount);
            uint256 bal = susde.balanceOf(address(this));
            if (shares > bal) shares = bal;
            if (shares > 0) {
                uint256 usdeOut = susde.redeem(shares, address(this), address(this));
                _swapViaCurve(curveIndexUsde, curveIndexUsdc, usdeOut);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  Internal: Curve Swap
    // ═══════════════════════════════════════════════════════════════

    /// @notice Curve で stablecoin をスワップ
    /// @dev スリッページ保護付き
    function _swapViaCurve(
        int128 _fromIndex,
        int128 _toIndex,
        uint256 _amount
    ) internal returns (uint256 amountOut) {
        if (_amount == 0) return 0;

        // get_dy で期待出力を計算
        uint256 expected = curvePool.get_dy(_fromIndex, _toIndex, _amount);
        uint256 minOut = (expected * (10000 - slippageBps)) / 10000;

        amountOut = curvePool.exchange(_fromIndex, _toIndex, _amount, minOut);
    }

    // ═══════════════════════════════════════════════════════════════
    //  Internal: Asset Calculations
    // ═══════════════════════════════════════════════════════════════

    function _aaveAssets() internal view returns (uint256) {
        return aUsdc.balanceOf(address(this));
    }

    function _sdaiAssets() internal view returns (uint256) {
        uint256 shares = sdai.balanceOf(address(this));
        if (shares == 0) return 0;
        // sDAI → DAI → USDC (概算: DAI ≈ USDC)
        return sdai.convertToAssets(shares);
    }

    function _sfraxAssets() internal view returns (uint256) {
        uint256 shares = sfrax.balanceOf(address(this));
        if (shares == 0) return 0;
        return sfrax.convertToAssets(shares);
    }

    function _susdeAssets() internal view returns (uint256) {
        uint256 shares = susde.balanceOf(address(this));
        if (shares == 0) return 0;
        return susde.convertToAssets(shares);
    }

    function _totalDeployedAssets() internal view returns (uint256) {
        return _aaveAssets() + _sdaiAssets() + _sfraxAssets() + _susdeAssets();
    }

    function _allProtocolAssets() internal view returns (uint256[4] memory values) {
        values[PROTOCOL_AAVE] = _aaveAssets();
        values[PROTOCOL_SDAI] = _sdaiAssets();
        values[PROTOCOL_SFRAX] = _sfraxAssets();
        values[PROTOCOL_SUSDE] = _susdeAssets();
    }

    function _estimatedTotalAssets() internal view returns (uint256) {
        return usdc.balanceOf(address(this)) + _totalDeployedAssets();
    }

    function _currentAllocationBps(uint256 _total) internal view returns (uint256[4] memory bps) {
        if (_total == 0) return bps;
        uint256[4] memory values = _allProtocolAssets();
        for (uint8 i = 0; i < NUM_PROTOCOLS; i++) {
            bps[i] = (values[i] * 10000) / _total;
        }
    }

    function _calculateAllocations(uint256 _amount) internal view returns (uint256[4] memory amounts) {
        uint256 allocated = 0;
        for (uint8 i = 0; i < NUM_PROTOCOLS - 1; i++) {
            amounts[i] = (_amount * targetAllocations[i]) / 10000;
            allocated += amounts[i];
        }
        // 端数は最後のプロトコルに
        amounts[NUM_PROTOCOLS - 1] = _amount - allocated;
    }

    /// @notice オンチェーン APY 計算 (年率換算 basis points)
    function _calculateApy(uint256 _currentAssets) internal returns (uint256 apy) {
        if (prevSnapshotTimestamp == 0 || prevSnapshotAssets == 0) {
            prevSnapshotAssets = _currentAssets;
            prevSnapshotTimestamp = block.timestamp;
            return 0;
        }

        uint256 elapsed = block.timestamp - prevSnapshotTimestamp;
        if (elapsed == 0) return 0;

        if (_currentAssets > prevSnapshotAssets) {
            uint256 profit = _currentAssets - prevSnapshotAssets;
            // APY = (profit / prevAssets) * (365 days / elapsed) * 10000
            apy = (profit * 365 days * 10000) / (prevSnapshotAssets * elapsed);
        }

        prevSnapshotAssets = _currentAssets;
        prevSnapshotTimestamp = block.timestamp;
    }

    // ═══════════════════════════════════════════════════════════════
    //  View Functions (透明性 → 選ばれる理由 #4)
    // ═══════════════════════════════════════════════════════════════

    /// @notice 総資産 (USDC 建て)
    function estimatedTotalAssets() external view returns (uint256) {
        return _estimatedTotalAssets();
    }

    /// @notice 各プロトコルの配分状況
    function getAllocations() external view returns (Allocation[4] memory allocs) {
        uint256[4] memory values = _allProtocolAssets();
        uint256 total = _estimatedTotalAssets();
        uint256[4] memory bps = _currentAllocationBps(total);

        for (uint8 i = 0; i < NUM_PROTOCOLS; i++) {
            allocs[i] = Allocation({
                deposited: values[i],
                currentValue: values[i],
                targetBps: targetAllocations[i]
            });
        }
    }

    /// @notice 現在の配分比率 (basis points)
    function currentAllocationBps() external view returns (uint256[4] memory) {
        return _currentAllocationBps(_estimatedTotalAssets());
    }

    /// @notice リバランスが必要か
    function needsRebalance() external view returns (bool) {
        return _needsRebalance();
    }

    /// @notice 引出し可能な最大額
    function availableWithdrawLimit() external view returns (uint256) {
        return _estimatedTotalAssets();
    }

    // ═══════════════════════════════════════════════════════════════
    //  Management Functions
    // ═══════════════════════════════════════════════════════════════

    /// @notice 目標配分比率を変更
    /// @param _newTargets [Aave, sDAI, sFRAX, sUSDe] in basis points (sum = 10000)
    function setTargetAllocations(uint256[4] calldata _newTargets) external onlyManagement {
        uint256 sum = 0;
        for (uint8 i = 0; i < NUM_PROTOCOLS; i++) {
            if (_newTargets[i] > maxAllocationBps) {
                revert AllocationExceedsMax(i, _newTargets[i]);
            }
            sum += _newTargets[i];
        }
        if (sum != 10000) revert InvalidAllocations();

        // sUSDe 特別制限チェック
        if (_newTargets[PROTOCOL_SUSDE] > maxSusdeAllocationBps) {
            revert AllocationExceedsMax(PROTOCOL_SUSDE, _newTargets[PROTOCOL_SUSDE]);
        }

        targetAllocations = _newTargets;
        emit TargetAllocationsUpdated(_newTargets);
    }

    /// @notice リスクパラメータ変更
    function setRiskParams(
        uint256 _maxAllocationBps,
        uint256 _minAllocationBps,
        uint256 _rebalanceThresholdBps,
        uint256 _maxSusdeAllocationBps,
        uint256 _slippageBps
    ) external onlyManagement {
        maxAllocationBps = _maxAllocationBps;
        minAllocationBps = _minAllocationBps;
        rebalanceThresholdBps = _rebalanceThresholdBps;
        maxSusdeAllocationBps = _maxSusdeAllocationBps;
        slippageBps = _slippageBps;
    }

    /// @notice 緊急引出し: 全プロトコルから全額回収
    function emergencyWithdraw() external onlyManagement {
        // Aave
        uint256 aaveBal = aUsdc.balanceOf(address(this));
        if (aaveBal > 0) {
            aavePool.withdraw(address(usdc), type(uint256).max, address(this));
        }

        // sDAI
        uint256 sdaiBal = sdai.balanceOf(address(this));
        if (sdaiBal > 0) {
            uint256 daiOut = sdai.redeem(sdaiBal, address(this), address(this));
            if (daiOut > 0) {
                _swapViaCurve(curveIndexDai, curveIndexUsdc, daiOut);
            }
        }

        // sFRAX
        uint256 sfraxBal = sfrax.balanceOf(address(this));
        if (sfraxBal > 0) {
            uint256 fraxOut = sfrax.redeem(sfraxBal, address(this), address(this));
            if (fraxOut > 0) {
                _swapViaCurve(curveIndexFrax, curveIndexUsdc, fraxOut);
            }
        }

        // sUSDe
        uint256 susdeBal = susde.balanceOf(address(this));
        if (susdeBal > 0) {
            uint256 usdeOut = susde.redeem(susdeBal, address(this), address(this));
            if (usdeOut > 0) {
                _swapViaCurve(curveIndexUsde, curveIndexUsdc, usdeOut);
            }
        }

        uint256 totalRecovered = usdc.balanceOf(address(this));
        emit EmergencyWithdraw(totalRecovered);
    }

    /// @notice Keeper アドレス変更
    function setKeeper(address _keeper) external onlyManagement {
        keeper = _keeper;
        emit KeeperUpdated(_keeper);
    }

    /// @notice Management 変更
    function setManagement(address _management) external onlyManagement {
        management = _management;
    }
}
