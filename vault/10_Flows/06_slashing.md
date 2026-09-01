# Seq #6 — Slashing

- **レイヤー**: BE → DB → L1（quadratic slashing）
- **状態**: ✅ FE→API 統合済み

## 主要ファイル
- FE hooks: `useSlashings`（PublicProverSlashing 接続）
- テスト: `challenge-slashing.integration.spec.ts`（13 テスト: Challenge→Defense→Slashing パイプライン）

## 記録
- Phase 5 で useSlashings hooks 作成、FE 接続完了

## オープンな論点
- （なし）
