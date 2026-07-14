# Seq #3 — Emergency Unlock

- **レイヤー**: FE → BE → DB → L1（7 日 timelock + bond）
- **状態**: ✅ 統合済み

## パラメータ（`.claude/rules/blockchain.md` が正）
- Emergency time lock: 7 日 / timeout: 72h
- Bond 最低額: 0.5 ETH / Bond 比率: 5% (500 bps)

## 主要ファイル
- BE: `src/api/api/src/routes/emergency.rs`（963 行、`POST /v1/locks/:id/emergency-unlock`）
- テスト: `unlock.integration.spec.ts` に Emergency 系を含む

## 記録
- Phase 2 で EmergencyUnlock 統合完了

## オープンな論点
- （なし）
