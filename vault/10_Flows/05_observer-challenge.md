# Seq #5 — Observer Challenge

- **レイヤー**: FE → BE → DB → L1 → VRF
- **状態**: ✅ API 統合済み

## パラメータ
- VRF timeout: 300 秒 / ポーリング間隔: 5 秒（SEQUENCES 2.3）

## 主要ファイル
- BE: `src/api/api/src/routes/observer.rs`（1,472 行）
- テスト: `observer-api.integration.spec.ts`（12 テスト: Challenge/Rewards）

## 記録
- Phase 3 で ProverChallenge を API hook 化

## オープンな論点
- （なし）
