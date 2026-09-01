# Seq #7 — Governance

- **レイヤー**: FE → BE → DB → L3
- **状態**: ✅ 統合済み

## 主要ファイル
- L3: Governor（Anvil: `0x5FC8d3...5707` / Arb Sepolia: `0xe93b81...D65B`）、GovernanceSwitch、SecurityCouncil
- テスト: `governance/integration.spec.ts`（12 テスト: Dashboard→Proposals→Council→Vote）

## 記録
- Phase 5 で hooks 接続 + Loading/Error/Empty 状態追加
- 2026-03-03: L3 12 コントラクトを Arbitrum Sepolia にデプロイ、Sourcify exact_match 検証済み

## オープンな論点
- （なし）
