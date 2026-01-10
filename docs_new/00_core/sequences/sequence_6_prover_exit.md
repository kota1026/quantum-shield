# Sequence #6: Prover Exit チェックリスト

> **Status**: ⬜ NOT STARTED  
> **担当**: Engineer, CSO  
> **PIR**: PIR-009  
> **依存**: Sequence #5

---

## 📋 Sequence概要

| 項目 | 値 |
|------|-----|
| Sequence# | 6 |
| Name | Prover Exit |
| Category | Prover Management |
| Gas (est.) | ~100K |
| Exit Period | 7日 |

---

## 📌 フロー概要

```
Exit申請 → 7日待機期間 → 未処理確認 → Stake返還
```

---

## ✅ 実装チェックリスト

### 6.1 Exit申請

**ファイル**: `src/ProverRegistry.sol`

```
□ [EXIT-001] initiateExit関数実装
□ [EXIT-002] 状態→Exiting変更
□ [EXIT-003] Exit開始時刻記録
□ [EXIT-004] Active Proverリストから除外
```

### 6.2 待機期間

```
□ [WAIT-001] 7日待機期間管理
□ [WAIT-002] 待機中のUnlock参加禁止
□ [WAIT-003] 待機中のChallenge対応義務
```

### 6.3 Stake返還

```
□ [RET-001] completeExit関数実装
□ [RET-002] 7日経過確認
□ [RET-003] 未処理Unlock確認
□ [RET-004] Pending Challenge確認
□ [RET-005] Stake送金
□ [RET-006] Prover状態クリア
```

### 6.4 強制Exit

```
□ [FORCE-001] Slash後の強制Exitロジック
□ [FORCE-002] 最低Stake未満時の強制Exit
```

### 6.5 Events

```
□ [EVT-001] ExitInitiated event
□ [EVT-002] ExitCompleted event
□ [EVT-003] ForcedExit event
```

---

## ✅ テストチェックリスト

```
□ [T-EXIT-001] 正常Exitテスト
□ [T-EXIT-002] 7日待機確認テスト
□ [T-EXIT-003] 未処理Unlock時の拒否テスト
□ [T-EXIT-004] Pending Challenge時の拒否テスト
□ [T-EXIT-005] 強制Exitテスト
□ [T-EXIT-006] Stake返還確認テスト
```

---

## 📁 成果物

| ファイル | 説明 | Status |
|---------|------|--------|
| `src/ProverRegistry.sol` | Exit機能追加 | □ |
| `test/ProverExit.t.sol` | テスト | □ |

---

## 🔗 参照

- 前のチェックリスト: `sequence_5_prover_registration.md`
- 次のステップ: Phase 2 (Governance, Emergency Pause)

---

**END OF CHECKLIST**
