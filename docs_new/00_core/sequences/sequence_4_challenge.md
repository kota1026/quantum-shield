# Sequence #4: Challenge + Slashing チェックリスト

> **Status**: ⏳ PENDING (部分完了)  
> **担当**: Engineer, CSO, Red Team  
> **PIR**: PIR-007  
> **依存**: Sequence #2, #3

---

## 📋 Sequence概要

| 項目 | 値 |
|------|-----|
| Sequence# | 4 |
| Name | Challenge + Slashing |
| Category | Security |
| Challenge Bond | MAX(0.1 ETH, amount × 1%) |
| Defense Period | 48時間 |
| Slashing Rate | N² × 10% (Quadratic) |

---

## 📌 フロー概要

```
Challenge発動 → Bond支払い → Defense期間(48h) → 
  → Defense成功: Challenger Bond没収
  → Defense失敗: Quadratic Slashing → 配分(60/20/20)
```

---

## ✅ 実装チェックリスト

### 4.1 Challenge発動

**ファイル**: `src/ChallengeManager.sol`

```
☑ [CHL-001] initiateChallenge関数 (既存)
☑ [CHL-002] Challenge Bond計算 (既存)
☑ [CHL-003] Challenge Bond受領 (既存)
□ [CHL-004] 証拠(evidence)受付ロジック
□ [CHL-005] Challenge状態管理
```

### 4.2 Defense期間

```
☑ [DEF-001] 48h Defense期間設定 (既存)
☑ [DEF-002] Defense期限管理 (既存)
□ [DEF-003] Prover Defense提出ロジック
□ [DEF-004] Defense検証ロジック
□ [DEF-005] Defense成功時のChallenger Bond没収
```

### 4.3 Quadratic Slashing

```
☑ [SLASH-001] Quadratic計算: N² × 10% (既存)
☑ [SLASH-002] 最大100%キャップ (既存)
□ [SLASH-003] 同時不正Prover数カウント
□ [SLASH-004] Slash額計算確認
```

### 4.4 Slash配分

```
☑ [DIST-001] 配分: 60/20/20 (既存)
☑ [DIST-002] Challenger報酬送金 (既存)
☑ [DIST-003] Insurance Pool送金 (既存)
☑ [DIST-004] Burn処理 (既存)
□ [DIST-005] 配分完了イベント
```

### 4.5 Prover Stake更新

```
□ [STAKE-001] Slash後のStake減算
□ [STAKE-002] 最低Stake未満時の強制退出
□ [STAKE-003] Prover状態更新
```

---

## ✅ テストチェックリスト

### Challenge Tests

```
☑ [T-CHL-001] Challenge正常発動テスト (既存)
☑ [T-CHL-002] Bond計算テスト (既存)
□ [T-CHL-003] 証拠検証テスト
□ [T-CHL-004] 無効Challenge拒否テスト
```

### Defense Tests

```
☑ [T-DEF-001] 48h期限テスト (既存)
□ [T-DEF-002] Defense成功テスト
□ [T-DEF-003] Defense失敗テスト
□ [T-DEF-004] 期限切れテスト
```

### Slashing Tests

```
☑ [T-SLASH-001] Quadratic計算テスト (既存)
☑ [T-SLASH-002] 配分テスト (既存)
□ [T-SLASH-003] 同時不正N=1,2,3,4テスト
□ [T-SLASH-004] 100%キャップテスト
```

---

## ✅ 仕様準拠確認

```
☑ [SPEC-001] Challenge Bond: MAX(0.1 ETH, amount × 1%) 
☑ [SPEC-002] Defense Period: 48時間
☑ [SPEC-003] Slashing: N² × 10%
☑ [SPEC-004] 配分: Challenger 60%, Insurance 20%, Burn 20%
□ [SPEC-005] QUANTUM_SHIELD_SEQUENCES_v2.0 Sequence#4完全準拠
```

---

## ✅ Core Principles準拠確認

```
□ [CP-1] 完全量子耐性: (継承)
□ [CP-2] Self-Custody: (継承)
□ [CP-3] Time Lock存在: (継承)
☑ [CP-4] Slashing存在: Quadratic Slashing実装
□ [CP-5] 透明性: 全Slash処理がオンチェーン
```

---

## 📁 成果物

| ファイル | 説明 | Status |
|---------|------|--------|
| `src/ChallengeManager.sol` | Challenge/Slash | ⏳ 60% |
| `test/ChallengeManager.t.sol` | テスト | ⏳ 50% |

---

## 🔗 参照

- 前のチェックリスト: `sequence_3_unlock_emergency.md`
- 次のチェックリスト: `sequence_5_prover_registration.md`

---

**END OF CHECKLIST**
