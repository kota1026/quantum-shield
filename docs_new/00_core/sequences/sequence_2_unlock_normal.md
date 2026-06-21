# Sequence #2: Unlock (Normal) チェックリスト

> **Status**: 🔄 ACTIVE  
> **担当**: Engineer, Cryptographer, QA  
> **PIR**: PIR-005  
> **依存**: Sequence #1 (Lock) ✅

---

## 📋 Sequence概要

| 項目 | 値 |
|------|-----|
| Sequence# | 2 |
| Name | Unlock (Normal) |
| Category | User Flow |
| Gas (est.) | ~490K (~$27) |
| Time Lock | 24時間 |
| 依存 | Sequence #1 完了必須 |

---

## 📌 フロー概要

```
User Request → Dilithium検証 → VRF取得 → Prover選出(2/5) 
→ SPHINCS+署名×2 → SR_1計算 → 24h Time Lock開始 → 執行
```

---

## ✅ 実装チェックリスト

### 2.1 VRF統合 (Chainlink)

**ファイル**: `src/VRFConsumer.sol`

```
□ [VRF-001] VRFConsumerBase継承
□ [VRF-002] requestRandomWords関数実装
□ [VRF-003] fulfillRandomWords関数実装
□ [VRF-004] 5分タイムアウト実装
□ [VRF-005] Fallbackメカニズム（タイムアウト時）
□ [VRF-006] VRF subscription設定
```

### 2.2 Prover選出

**ファイル**: `src/ProverSelection.sol`

```
□ [SEL-001] Prover選出ロジック（2/5）
□ [SEL-002] 選出式: P(i) = Stake_i / Σ Stake
□ [SEL-003] VRF seed → Prover mapping
□ [SEL-004] 重複排除（同じProverを2回選ばない）
□ [SEL-005] Active Proverフィルタリング
```

### 2.3 SPHINCS+署名検証

**ファイル**: `src/SPHINCSVerifier.sol` (既存)

```
☑ [SPH-001] verifySignature関数 (既存)
□ [SPH-002] 2署名並列検証ロジック
□ [SPH-003] 署名期限チェック（VRF後5分以内）
□ [SPH-004] 不正署名時のエラーハンドリング
```

### 2.4 State Root (SR_1)

**ファイル**: `src/StateRootCalculator.sol`

```
☑ [SR1-001] SR_1計算式実装 (既存)
□ [SR1-002] SR_0参照確認
□ [SR1-003] VRF seed含める
□ [SR1-004] Prover pubkeys含める
```

### 2.5 Time Lock

**ファイル**: `src/L1Vault.sol`

```
□ [TL-001] 24h Time Lock開始ロジック
□ [TL-002] Time Lock期間中のcancel禁止
□ [TL-003] Time Lock終了後のexecute許可
□ [TL-004] unlockReadyAt timestamp記録
```

### 2.6 L1Vault統合

**ファイル**: `src/L1Vault.sol`

```
□ [INTEG-001] VRFConsumerとの接続
□ [INTEG-002] ProverSelectionとの接続
□ [INTEG-003] initiateUnlock関数実装
□ [INTEG-004] finalizeUnlock関数実装
□ [INTEG-005] 72hタイムアウト→Emergency Path切り替え
```

### 2.7 Events

```
□ [EVT-001] UnlockInitiated event
□ [EVT-002] ProversSelected event
□ [EVT-003] UnlockFinalized event
□ [EVT-004] 全イベントにlock_id含める
```

---

## ✅ テストチェックリスト

### VRF Tests

**ファイル**: `test/VRFConsumer.t.sol`

```
□ [T-VRF-001] VRF正常系テスト
□ [T-VRF-002] VRFタイムアウトテスト
□ [T-VRF-003] Fallbackテスト
□ [T-VRF-004] 境界値テスト（5分±1s）
```

### Prover Selection Tests

**ファイル**: `test/ProverSelection.t.sol`

```
□ [T-SEL-001] 2/5選出テスト
□ [T-SEL-002] 確率分布テスト（Stake比例）
□ [T-SEL-003] 重複排除テスト
□ [T-SEL-004] Active Prover = 0時テスト
□ [T-SEL-005] Active Prover < 5時テスト
```

### Unlock Flow Tests

**ファイル**: `test/L1VaultUnlock.t.sol`

```
□ [T-UL-001] 正常Unlockフローテスト
□ [T-UL-002] 24h Time Lock確認テスト
□ [T-UL-003] Time Lock前のexecute拒否テスト
□ [T-UL-004] 署名1つ不足時テスト
□ [T-UL-005] 署名期限切れテスト
```

### Integration Tests

**ファイル**: `test/E2EUnlock.t.sol`

```
□ [T-E2E-001] Lock → Unlock (Normal) 完全フロー
□ [T-E2E-002] 複数Unlock並行テスト
□ [T-E2E-003] Gas使用量確認（< 500K）
```

---

## ✅ 仕様準拠確認

```
□ [SPEC-001] QUANTUM_SHIELD_SEQUENCES_v2.0 Sequence#2準拠
□ [SPEC-002] VRF選出式: P(i) = Stake_i / Σ Stake
□ [SPEC-003] 署名期限: VRF後5分以内
□ [SPEC-004] Time Lock: 24時間
□ [SPEC-005] 72hタイムアウト→Emergency Path
```

---

## ✅ Core Principles準拠確認

```
□ [CP-1] 完全量子耐性: Dilithium + SPHINCS+のみ使用
□ [CP-2] Self-Custody: ユーザー鍵は保存しない
□ [CP-3] Time Lock存在: 24h Time Lock実装
□ [CP-4] Slashing存在: (Sequence #4で適用)
□ [CP-5] 透明性: 全操作がオンチェーン
```

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

## 📁 成果物

| ファイル | 説明 | Status |
|---------|------|--------|
| `src/VRFConsumer.sol` | VRF統合 | □ |
| `src/ProverSelection.sol` | Prover選出 | □ |
| `src/L1Vault.sol` | Unlock機能追加 | □ |
| `test/VRFConsumer.t.sol` | VRFテスト | □ |
| `test/ProverSelection.t.sol` | 選出テスト | □ |
| `test/L1VaultUnlock.t.sol` | Unlockテスト | □ |
| `test/E2EUnlock.t.sol` | E2Eテスト | □ |

---

## 📝 完了報告テンプレート

```markdown
## Sequence #2 完了報告

**日時**: YYYY-MM-DD HH:MM JST
**担当**: [Engineer名]

### 完了項目
- [x] VRF-001〜006
- [x] SEL-001〜005
- [x] TL-001〜004
- [x] INTEG-001〜005

### テスト結果
- VRFConsumerTest: XX/XX ✅
- ProverSelectionTest: XX/XX ✅
- L1VaultUnlockTest: XX/XX ✅
- E2EUnlockTest: XX/XX ✅
- 新規テスト数: +XX
- 総テスト数: XXX

### PIR判定
- [ ] PIR-005 PASS
- [ ] PIR-005 CONDITIONAL PASS
- [ ] PIR-005 FAIL

### 次のアクション
→ sequence_3_unlock_emergency.md に移行
```

---

## 🔗 参照

- 憲法: `docs/constitution/CORE_PRINCIPLES.md`
- シーケンス参照: `docs/constitution/QUANTUM_SHIELD_SEQUENCES_v2.0_REF.md` (Sequence#2)
- 詳細シーケンス: `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md`
- PIRルーチン: `docs/aegis/PIR_CODE_REVIEW_ROUTINE.md`
- 前のチェックリスト: `sequence_1_lock.md` ✅
- 次のチェックリスト: `sequence_3_unlock_emergency.md`

---

**END OF CHECKLIST**
