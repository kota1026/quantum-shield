# Seq #2 — Normal Unlock

- **レイヤー**: FE → BE → DB → L1（24h timelock）
- **状態**: ✅ 統合済み + Auto-Claim 検証済み

## 主要ファイル
- BE: `src/api/api/src/routes/` unlock 系（`POST /v1/locks/:id/unlock`）
- Auto-Claim: `src/api/api/src/services/`（24h 後に自動 Claim、ユーザー操作不要）
- テスト: `unlock.integration.spec.ts`（15 テスト）、Auto-Claim 統合テスト 7 本全パス

## 記録
- Phase 2 で Normal Unlock 統合。unlock.rs に skip_sig 追加
- 2026-03-03: Auto-Claim 7 テスト全パス（normal/batch/negative/DB 検証）

## オープンな論点
- （なし）
