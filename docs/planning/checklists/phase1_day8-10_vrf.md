# Phase 1 - Day 8-10: VRF統合チェックリスト

> **Status**: 🔄 ACTIVE  
> **期間**: Day 8-10  
> **担当**: Engineer, Cryptographer, QA  
> **PIR**: PIR-005, PIR-006

---

## 📋 タスク概要

| Day | タスク | 担当 | 完了条件 |
|-----|--------|------|----------|
| 8-9 | VRF統合 (Chainlink) | Engineer | VRFConsumer.sol作成・テスト合格 |
| 10 | 統合テスト | QA | E2Eシナリオ全合格 |

---

## ✅ Day 8-9: VRF統合

### 8-9.1 VRFConsumer実装

**ファイル**: `src/VRFConsumer.sol`

```
□ [IMPL-001] VRFConsumerBase継承
□ [IMPL-002] requestRandomWords関数実装
□ [IMPL-003] fulfillRandomWords関数実装
□ [IMPL-004] Prover選出ロジック（2/5）
□ [IMPL-005] 5分タイムアウト実装
□ [IMPL-006] Fallbackメカニズム
```

### 8-9.2 L1Vault統合

**ファイル**: `src/L1Vault.sol`

```
□ [INTEG-001] VRFConsumerとの接続
□ [INTEG-002] Unlock時のVRF呼び出し
□ [INTEG-003] Prover署名要求への連携
□ [INTEG-004] Emergency Path切り替え（72h）
```

### 8-9.3 テスト追加

**ファイル**: `test/VRFConsumer.t.sol`

```
□ [TEST-001] VRF正常系テスト
□ [TEST-002] VRFタイムアウトテスト
□ [TEST-003] Prover選出確率テスト
□ [TEST-004] Fallbackテスト
□ [TEST-005] 境界値テスト（5分±1s）
```

### 8-9.4 仕様準拠確認

```
□ [SPEC-001] QUANTUM_SHIELD_SEQUENCES_v2.0 Sequence#2準拠
□ [SPEC-002] VRF選出式: P(i) = Stake_i / Σ Stake
□ [SPEC-003] 署名期限: VRF後5分以内
□ [SPEC-004] 72hタイムアウト→Emergency Path
```

---

## ✅ Day 10: 統合テスト

### 10.1 E2Eシナリオ

```
□ [E2E-001] Lock → Unlock (Normal) 完全フロー
□ [E2E-002] Lock → Unlock (Emergency) 完全フロー
□ [E2E-003] Challenge → Slashing フロー
□ [E2E-004] VRF障害時のEmergency切り替え
```

### 10.2 統合テスト合格基準

```
□ [PASS-001] 全E2Eテスト合格
□ [PASS-002] ガス使用量確認（Unlock < 500K）
□ [PASS-003] イベント発行確認
□ [PASS-004] State Root遷移確認
```

---

## 🔐 Core Principles準拠確認

```
□ [CP-1] 量子耐性: VRFはDilithium署名と併用のみ
□ [CP-2] Self-Custody: ユーザー鍵は保存しない
□ [CP-3] Time Lock: 24h（Normal）/ 7日（Emergency）維持
□ [CP-4] Slashing: 機能削除していない
□ [CP-5] 透明性: 全操作がオンチェーン
```

---

## 🧪 PIR要件

### PIR-005 (Day 8-9)

| 項目 | 要件 |
|------|------|
| テスト存在 | VRFConsumer.t.sol存在 |
| テスト合格 | 全テスト合格 |
| ビルド合格 | forge build成功 |
| 仕様準拠 | Sequence#2完全準拠 |
| セキュリティ | Slither警告なし |

### PIR-006 (Day 10)

| 項目 | 要件 |
|------|------|
| E2Eテスト | 全シナリオ合格 |
| Gas確認 | Unlock < 500K gas |
| 統合確認 | 全コンポーネント連携確認 |

---

## 📁 成果物

| ファイル | 説明 | 作成者 |
|---------|------|--------|
| `src/VRFConsumer.sol` | VRF統合コントラクト | Engineer |
| `test/VRFConsumer.t.sol` | VRFテスト | QA |
| `test/E2EIntegration.t.sol` | E2Eテスト | QA |
| `docs/aegis/PIR-005_VRF_REVIEW.md` | PIRレポート | All |

---

## 🚨 FAIL条件

以下のいずれかに該当する場合、**PIR FAIL**：

1. ❌ テストが存在しない
2. ❌ テストが失敗している
3. ❌ ビルドが失敗している
4. ❌ Core Principles違反
5. ❌ 仕様書との重大な乖離
6. ❌ セキュリティ上の脆弱性

---

## 📝 完了報告テンプレート

```markdown
## Day 8-9 完了報告

**日時**: YYYY-MM-DD HH:MM JST
**担当**: [Engineer名]

### 完了項目
- [x] IMPL-001〜006
- [x] INTEG-001〜004
- [x] TEST-001〜005
- [x] SPEC-001〜004

### テスト結果
- VRFConsumerTest: XX/XX ✅
- 新規テスト数: +XX
- 総テスト数: XXX

### PIR判定
- [ ] PIR-005 PASS
- [ ] PIR-005 CONDITIONAL PASS
- [ ] PIR-005 FAIL

### 次のアクション
- Day 10: 統合テスト
```

---

## 🔗 参照

- 憲法: `docs/constitution/CORE_PRINCIPLES.md`
- シーケンス: `docs/constitution/QUANTUM_SHIELD_SEQUENCES_v2.0_REF.md`（Sequence#2）
- 詳細仕様: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md`
- PIRルーチン: `docs/aegis/PIR_CODE_REVIEW_ROUTINE.md`

---

**END OF CHECKLIST**
