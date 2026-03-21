# Yearn V3 Tokenized Strategies

Yearn V3 フレームワークを活用した DeFi 利回り戦略コントラクト。

## Strategies

| # | Strategy | Protocol | Asset | 想定APY | Risk |
|---|----------|----------|-------|---------|------|
| 1 | `AaveLenderStrategy` | Aave V3 | USDC/WETH | 3-8% | Low |
| 2 | `CompoundV3LenderStrategy` | Compound V3 | USDC | 3-9% | Low |
| 3 | `CurveLPStrategy` | Curve 3pool + Gauge | USDC | 5-15% | Low-Med |
| 4 | `RealYieldAggregator` | Aave + sDAI + sFRAX + sUSDe | USDC | 5-10% | Low |
| **5** | **`RealYieldAggregatorV3`** | **Aave + sDAI + sFRAX + sUSDe + SwapRouter** | **USDC** | **5-10%** | **Low** |

## RealYieldAggregator - Yearn V3 Strategy Proposal

### Why This Strategy Gets Selected

```
問題: 既存の単体 Strategy は 1プロトコルに依存
     → プロトコル障害時に全損リスク
     → 利回り低下時に手動切替が必要
     → Vault Manager の運用負荷が高い

解決: RealYieldAggregator = 複数リアルイールドの自動最適配分
     → 4プロトコル分散で単一障害点なし
     → 利回り変動に応じて自動リバランス
     → Vault Manager は配分比率を設定するだけ
```

### Architecture

```
User deposits USDC
 │
 └─→ RealYieldAggregator (This Strategy)
       │
       ├── 30% → Aave V3 (aUSDC)
       │         利回り源: 借り手の金利 (3-5%)
       │
       ├── 30% → MakerDAO sDAI
       │         USDC → Curve → DAI → sDAI
       │         利回り源: DSR / Stability Fee (5-8%)
       │
       ├── 20% → Frax sFRAX
       │         USDC → Curve → FRAX → sFRAX
       │         利回り源: AMO運用収益 (4-6%)
       │
       └── 20% → Ethena sUSDe
                 USDC → Curve → USDe → sUSDe
                 利回り源: Perp Funding Rate (8-15%)
                 ※ max 25% cap (7日 cooldown リスク)

  harvest() 時:
    1. 各プロトコルの残高を集計
    2. 目標配分との乖離をチェック
    3. 閾値(3%)を超えたら自動リバランス
    4. オンチェーン APY を計算・記録
```

### Differentiation (差別化ポイント)

| Feature | Single Strategy | RealYieldAggregator |
|---------|:--------------:|:-------------------:|
| プロトコル分散 | 1つ | 4つ |
| 自動リバランス | なし | あり (閾値ベース) |
| リアルイールドのみ | - | ポンジ排除 |
| リスクキャップ | なし | max 40% / protocol |
| sUSDe cooldown考慮 | - | max 25% 制限 |
| オンチェーンAPY | なし | harvest毎に計算・記録 |
| 緊急停止 | 単体 | 全プロトコル一括引出し |
| 透明性 | 残高のみ | 配分比率・APY 全てオンチェーン |

### Risk Management

```
1. 配分キャップ:
   - 各プロトコル最大 40% (maxAllocationBps)
   - sUSDe 最大 25% (cooldown リスクを考慮)
   - 各プロトコル最低 5% (常に分散)

2. リバランス制御:
   - 閾値: 3%以上の乖離で発動
   - ガス効率: 不要なリバランスを回避
   - Over-allocated → Under-allocated の順序で実行

3. 緊急対応:
   - emergencyWithdraw(): 全プロトコルから一括回収
   - Aave優先引出し（最も流動性が高い）

4. スリッページ保護:
   - Curve swap: 0.3% max slippage
   - 全スワップに get_dy ベースの最低出力保証
```

### For Vault Managers

```solidity
// 1. Deploy
RealYieldAggregator strategy = new RealYieldAggregator(params);

// 2. Configure target allocation (30/30/20/20)
strategy.setTargetAllocations([3000, 3000, 2000, 2000]);

// 3. Set keeper for automated harvests
strategy.setKeeper(keeperAddress);

// 4. That's it. Strategy handles rebalancing automatically.
```

### Test Results

```bash
# Unit tests (no fork needed)
forge test --match-contract RealYieldAggregatorTest -vvv

# Fork tests (requires ETH_RPC_URL)
forge test --match-contract RealYieldAggregatorForkTest \
  --fork-url $ETH_RPC_URL -vvv

# Gas report
forge test --match-contract RealYieldAggregatorTest --gas-report
```

## Architecture (All Strategies)

```
User
 │
 ├─→ AaveLenderStrategy
 │     └─→ Aave V3 Pool (supply/withdraw)
 │         └─→ aToken 残高が自動増加（利息）
 │
 ├─→ CompoundV3LenderStrategy
 │     ├─→ Compound V3 Comet (supply/withdraw)
 │     └─→ CometRewards (claim COMP) → Uniswap V3 → USDC → 再投資
 │
 ├─→ CurveLPStrategy
 │     ├─→ Curve 3pool (add_liquidity/remove_liquidity)
 │     ├─→ Curve Gauge (stake LP → earn CRV)
 │     └─→ CRV → Uniswap V3 → USDC → 再投資
 │
 └─→ RealYieldAggregator ★NEW
       ├─→ Aave V3 (aUSDC) ─── 貸出利息
       ├─→ sDAI (Curve swap) ── DSR
       ├─→ sFRAX (Curve swap) ─ AMO収益
       └─→ sUSDe (Curve swap) ─ Funding Rate
           自動リバランス + リスクキャップ
```

## Deployment (Ethereum Mainnet)

### Required Addresses

```solidity
// Aave V3
AAVE_POOL    = 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2
aUSDC        = 0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c

// Compound V3
COMET_USDC   = 0xc3d688B66703497DAA19211EEdff47f25384cdc3
COMET_REWARDS = 0x1B0e765F6224C21223AeA2af16c1C46E38885a40
COMP         = 0xc00e94Cb662C3520282E6f5717214004A7f26888

// Curve
CURVE_3POOL  = 0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7
3CRV         = 0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490
GAUGE_3POOL  = 0xbFcF63294aD7105dEa65aA58F8AE5BE2D9d0952A
CRV          = 0xD533a949740bb3306d119CC777fa900bA034cd52

// Common
USDC         = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
UNISWAP_V3   = 0xE592427A0AEce92De3Edee1F18E0157C05861564
```

## Production Deployment Notes

These contracts are standalone implementations for educational purposes.
For production deployment on Yearn V3:

1. `forge install yearn/tokenized-strategy`
2. Inherit from `BaseStrategy` instead of standalone
3. Add oracle-based slippage protection for swaps
4. Add proper access control via TokenizedStrategy
5. Comprehensive testing with mainnet fork
