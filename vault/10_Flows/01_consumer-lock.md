# Seq #1 — Consumer Lock

- **レイヤー**: FE → BE → DB → L1
- **状態**: ✅ フル統合済み（L1 実トランザクション検証済み）

## 主要ファイル
- BE: `src/api/api/src/routes/lock.rs`（`POST /v1/locks`）
- FE: `src/frontend/web/src/app/[locale]/consumer/`
- テスト: `lock.integration.spec.ts`（7 テスト）

## 記録
- 2026-03-02: Sepolia `lockWithSR0` 0.01 ETH 成功。tx `0xd295f0f7...542297`（block 10367571, gasUsed 253087）。totalLocked 0.17→0.18 ETH を確認
- Phase 1 で型統一・skip_sig 追加・client 修正済み

## オープンな論点
- （なし。気付いたらここに追記）
