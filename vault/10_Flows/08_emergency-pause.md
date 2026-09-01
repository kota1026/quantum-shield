# Seq #8 — Emergency Pause

- **レイヤー**: Admin → BE → L1
- **状態**: ✅ FE→API 統合済み

## パラメータ
- 最大 Pause 期間: 72h

## 主要ファイル
- FE hooks: `useEmergencyPause`（AdminEmergency 接続）
- テスト: `emergency-pause.integration.spec.ts`（15 テスト: Pause→Status→Unpause→Extension）

## 記録
- Phase 5 で useEmergencyPause hooks 作成、AdminEmergency 接続完了

## オープンな論点
- （なし）
