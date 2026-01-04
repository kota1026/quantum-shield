# Sequence #5: Prover Registration チェックリスト

> **Status**: ⬜ NOT STARTED  
> **担当**: Engineer, CSO  
> **PIR**: PIR-008  
> **依存**: Sequence #1-4

---

## 📋 Sequence概要

| 項目 | 値 |
|------|-----|
| Sequence# | 5 |
| Name | Prover Registration |
| Category | Prover Management |
| Gas (est.) | ~200K |
| 最低Stake | 32 ETH (Phase 1) |

---

## 📌 フロー概要

```
Stake送金 → SPHINCS+公開鍵登録 → KYC確認(Phase 1) → Active化
```

---

## ✅ 実装チェックリスト

### 5.1 Registration

**ファイル**: `src/ProverRegistry.sol`

```
□ [REG-001] register関数実装
□ [REG-002] 最低Stake確認（32 ETH）
□ [REG-003] SPHINCS+公開鍵受付
□ [REG-004] 公開鍵形式検証
□ [REG-005] Prover ID発行
```

### 5.2 Stake管理

```
□ [STAKE-001] Stake受領ロジック
□ [STAKE-002] Stake履歴記録
□ [STAKE-003] 追加Stakeロジック
□ [STAKE-004] Stake残高照会
```

### 5.3 状態管理

```
□ [STATE-001] Prover状態（Pending/Active/Exiting/Slashed）
□ [STATE-002] Active Proverリスト管理
□ [STATE-003] 状態遷移ロジック
```

### 5.4 Events

```
□ [EVT-001] ProverRegistered event
□ [EVT-002] ProverActivated event
□ [EVT-003] StakeAdded event
```

---

## ✅ テストチェックリスト

```
□ [T-REG-001] 正常登録テスト
□ [T-REG-002] Stake不足拒否テスト
□ [T-REG-003] 公開鍵重複拒否テスト
□ [T-REG-004] 追加Stakeテスト
□ [T-REG-005] 状態遷移テスト
```

---

## 📁 成果物

| ファイル | 説明 | Status |
|---------|------|--------|
| `src/ProverRegistry.sol` | Registry | □ |
| `test/ProverRegistry.t.sol` | テスト | □ |

---

## 🔗 参照

- 前のチェックリスト: `sequence_4_challenge.md`
- 次のチェックリスト: `sequence_6_prover_exit.md`

---

**END OF CHECKLIST**
