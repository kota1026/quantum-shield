# Current Plan

> **Generated**: 2025-12-24 (JST)
> **Phase**: 1 - Foundation Bootstrap
> **Day**: 8 (14日間修正計画)

## 対象チェックリスト

`docs/planning/checklists/phase1_day8-10_vrf.md`

## 今回のスコープ

### 実装項目 (Day 8-9: VRF統合)

#### 8-9.1 VRFConsumer実装 (`contracts/src/VRFConsumerMock.sol`)
- [x] [IMPL-001] VRFConsumerBase継承 → Mock版として IVRFConsumer実装済み
- [x] [IMPL-002] requestRandomWords関数実装 → requestProverSelection実装済み
- [x] [IMPL-003] fulfillRandomWords関数実装 → mockFulfillRandomWords実装済み
- [x] [IMPL-004] Prover選出ロジック（2/5）→ ProverSelector library使用
- [x] [IMPL-005] 5分タイムアウト実装 → VRF_TIMEOUT = 5 minutes
- [x] [IMPL-006] Fallbackメカニズム → triggerFallback実装済み

#### 8-9.2 L1Vault統合 (`contracts/src/L1Vault.sol`)
- [ ] [INTEG-001] VRFConsumerとの接続
- [ ] [INTEG-002] Unlock時のVRF呼び出し
- [ ] [INTEG-003] Prover署名要求への連携
- [ ] [INTEG-004] Emergency Path切り替え（72h）

### テスト項目 (`contracts/test/VRFConsumerMockTest.t.sol`)
- [x] [TEST-001] VRF正常系テスト
- [x] [TEST-002] VRFタイムアウトテスト
- [x] [TEST-003] Prover選出確率テスト
- [x] [TEST-004] Fallbackテスト
- [ ] [TEST-005] 境界値テスト（5分±1s）

### 仕様準拠確認
- [ ] [SPEC-001] QUANTUM_SHIELD_SEQUENCES_v2.0 Sequence#2準拠
- [ ] [SPEC-002] VRF選出式: P(i) = Stake_i / Σ Stake
- [ ] [SPEC-003] 署名期限: VRF後5分以内
- [ ] [SPEC-004] 72hタイムアウト→Emergency Path

### 参照ドキュメント
- Sequence: `docs/constitution/QUANTUM_SHIELD_SEQUENCES_v2.0_REF.md` (Sequence#2: Unlock Normal)
- 仕様: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md`
- 憲法: `docs/constitution/CORE_PRINCIPLES.md`
- PIRルーチン: `docs/aegis/PIR_CODE_REVIEW_ROUTINE.md`

## 成果物

| ファイル | 説明 | Status |
|---------|------|--------|
| `contracts/src/VRFConsumerMock.sol` | Mock VRFコントラクト | ✅ 実装済み |
| `contracts/src/interfaces/IVRFConsumer.sol` | VRF Interface | ✅ 実装済み |
| `contracts/src/libraries/ProverSelector.sol` | Prover選出ロジック | ✅ 実装済み |
| `contracts/test/VRFConsumerMockTest.t.sol` | VRFテスト | ✅ 存在 |
| `contracts/src/L1Vault.sol` | VRF統合更新 | 🔄 要確認 |
| `docs/aegis/PIR-005_VRF_REVIEW.md` | PIRレポート | ⬜ 未作成 |

## 実行順序

### 本日のタスク

1. **L1Vault.sol のVRF統合状態確認**
   - VRFConsumerとの接続状況を確認
   - Unlock処理フローの確認

2. **INTEG-001〜004 の実装/修正**
   - L1VaultへのVRF呼び出し統合
   - Emergency Path (72h) の確認

3. **TEST-005 境界値テスト追加**
   - 5分タイムアウトの境界値テスト

4. **SPEC-001〜004 仕様準拠確認**
   - Sequence#2との整合性確認
   - VRF選出式の検証

5. **PIR-005レポート作成準備**
   - 全テスト実行・合格確認
   - Slither セキュリティチェック

## Core Principles確認

- [x] CP-1: 完全量子耐性 - VRFはDilithium署名と併用のみ（違反なし）
- [x] CP-2: Self-Custody - ユーザー鍵は保存しない（違反なし）
- [x] CP-3: Time Lock存在 - 24h（Normal）/ 7日（Emergency）維持（違反なし）
- [x] CP-4: Slashing存在 - 機能削除していない（違反なし）
- [x] CP-5: 透明性 - 全操作がオンチェーン（違反なし）

## リスク・懸念事項

| # | 懸念 | 重要度 | 対応 |
|---|------|--------|------|
| 1 | L1Vault統合の既存実装確認が必要 | 🟡 Medium | 本日確認 |
| 2 | 72h Emergency Path遷移ロジック | 🟡 Medium | 仕様確認 |
| 3 | VRF正式版(Chainlink)への移行計画 | 🟢 Low | Phase2以降 |

## 次のアクション

1. `contracts/src/L1Vault.sol` の VRF統合状態を確認
2. 未完了のINTEG項目を特定・実装
3. 全テスト実行 (`forge test`)
4. PIR-005準備

---

**END OF CURRENT PLAN**
