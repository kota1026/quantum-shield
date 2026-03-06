# Yearn V3 Tokenized Strategies

Yearn V3 フレームワークを活用した DeFi 利回り戦略コントラクト。

## Strategies

| # | Strategy | Protocol | Asset | 想定APY | Risk |
|---|----------|----------|-------|---------|------|
| 1 | `AaveLenderStrategy` | Aave V3 | USDC/WETH | 3-8% | Low |
| 2 | `CompoundV3LenderStrategy` | Compound V3 | USDC | 3-9% | Low |
| 3 | `CurveLPStrategy` | Curve 3pool + Gauge | USDC | 5-15% | Low-Med |

## Architecture

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
 └─→ CurveLPStrategy
       ├─→ Curve 3pool (add_liquidity/remove_liquidity)
       ├─→ Curve Gauge (stake LP → earn CRV)
       └─→ CRV → Uniswap V3 → USDC → 再投資
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
