# Seq #9 — Token Hub (veQS)

- **レイヤー**: FE → BE → DB → L3
- **状態**: ✅ 統合済み（18 hooks 接続）

## 主要ファイル
- L3: veQS（Anvil: `0xe7f172...0512` / Arb Sepolia: `0xE72dFa...fCAE`）、QSToken、VeQSRewardDistributor、RewardRouter
- テスト: `token-hub/integration.spec.ts`（19 テスト: Dashboard→Lock→Delegate→Rewards）

## 記録
- Phase 5 で 18 hooks 接続 + Loading/Error/Empty 状態追加

## オープンな論点
- （なし）
