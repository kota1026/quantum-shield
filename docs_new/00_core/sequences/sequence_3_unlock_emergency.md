# Sequence #3: Unlock (Emergency) チェックリスト

> **Status**: ✅ COMPLETED  
> **担当**: Engineer, CSO  
> **PIR**: PIR-006  
> **依存**: Sequence #2 (Unlock Normal) 完了必須  
> **完了日**: 2025-12-24

---

## 📋 Sequence概要

| 項目 | 値 |
|------|-----|
| Sequence# | 3 |
| Name | Unlock (Emergency) |
| Category | User Flow |
| Time Lock | 7日 |
| Bond | MAX(0.5 ETH, amount × 5%) |
| トリガー | 72時間Prover応答なし |

---

## 📌 フロー概要

```
72h Prover応答なし → Emergency Bond支払い → 7日 Time Lock開始
→ Challenge期間 → 執行/Slash
```

---

## ✅ 実装チェックリスト

### 3.1 トリガー条件

**ファイル**: `contracts/src/L1Vault.sol`

```
☑ [TRIG-001] 72hタイムアウト検知
    → checkProverTimeout() 実装
    → PROVER_TIMEOUT = 72 hours 定数追加
☑ [TRIG-002] Prover応答状態追跡
    → UnlockRequest.proverRequestedAt フィールド追加
    → recordProverRequest() 関数実装
☑ [TRIG-003] Emergency Path自動切り替え
    → initiateEmergencyFromTimeout() 関数実装
☑ [TRIG-004] User手動Emergency発動オプション
    → requestEmergencyUnlock() 拡張
```

### 3.2 Emergency Bond

**ファイル**: `contracts/src/L1Vault.sol`

```
☑ [BOND-001] Bond計算: MAX(0.5 ETH, amount × 5%)
    → _calculateEmergencyBond() 実装
    → calculateEmergencyBond() public view 関数追加
☑ [BOND-002] Bond受領ロジック
    → requestEmergencyUnlock() に実装
    → EmergencyBondReceived イベント発行
☑ [BOND-003] Bond返還ロジック（正常完了時）
    → executeUnlock() で実装
    → EmergencyUnlockFinalized イベントで返還額を通知
☑ [BOND-004] Bond没収ロジック（不正検出時）
    → resolveChallenge() に実装
    → Challenge有効時にinsuranceFundに追加
```

### 3.3 7日 Time Lock

```
☑ [TL7-001] 7日Time Lock開始ロジック
    → EMERGENCY_TIME_LOCK = 7 days
    → unlockableAt計算実装
☑ [TL7-002] Challenge期間との連携
    → challenge() でEMERGENCY_PENDING ステータス対応
☑ [TL7-003] Time Lock延長（Challenge時）
    → challenge() で +7日延長実装
☑ [TL7-004] emergencyUnlockReadyAt記録
    → UnlockRequest.emergencyReadyAt フィールド追加
    → EmergencyUnlock.emergencyReadyAt 追跡
```

### 3.4 監視強化モード

```
☑ [MON-001] 監視強化フラグ設定
    → enhancedMonitoring mapping追加
    → isEnhancedMonitoring() view関数
☑ [MON-002] Challenge受付開始
    → EMERGENCY_PENDING ステータスでのchallenge対応
☑ [MON-003] イベント通知強化
    → EnhancedMonitoringActivated イベント発行
```

### 3.5 Events

```
☑ [EVT-001] EmergencyUnlockInitiated event
    → (lockId, initiator, fromTimeout, timestamp)
☑ [EVT-002] EmergencyBondReceived event
    → (lockId, payer, bondAmount, requiredBond)
☑ [EVT-003] EmergencyUnlockFinalized event
    → (lockId, recipient, amount, bondReturned, wasSlashed)
```

---

## ✅ テストチェックリスト

### Emergency Flow Tests

**ファイル**: `contracts/test/L1VaultEmergency.t.sol`

```
☑ [T-EM-001] 72hタイムアウト後のEmergency開始テスト
    → test_CheckProverTimeout_Reached()
☑ [T-EM-002] Bond計算テスト（MIN/MAX境界）
    → test_EmergencyBondCalculation_Min()
    → test_EmergencyBondCalculation_Percent()
    → test_EmergencyBondCalculation_Boundary()
    → test_Spec_BondFormula()
☑ [T-EM-003] Bond受領確認テスト
    → test_RequestEmergencyUnlock_Success()
☑ [T-EM-004] 7日Time Lock確認テスト
    → test_EmergencyTimeLock_SetCorrectly()
    → test_EmergencyUnlock_BeforeTimeLock()
    → test_EmergencyUnlock_AfterTimeLock()
☑ [T-EM-005] Challenge連携テスト
    → test_EmergencyTimeLock_ExtendedOnChallenge()
    → test_EnhancedMonitoring_ChallengeAccepted()
☑ [T-EM-006] 正常完了時Bond返還テスト
    → test_EmergencyBond_ReturnedOnSuccess()
```

### Edge Cases

```
☑ [T-EDGE-001] 72h直前のProver応答テスト
    → test_EdgeCase_72hBoundary()
☑ [T-EDGE-002] Bond不足時の拒否テスト
    → test_RequestEmergencyUnlock_InsufficientBond()
☑ [T-EDGE-003] 複数Emergency並行テスト
    → test_EdgeCase_MultipleEmergencyParallel()
```

---

## ✅ 仕様準拠確認

```
☑ [SPEC-001] QUANTUM_SHIELD_SEQUENCES_v2.0 Sequence#3準拠
    → test_Spec_FullEmergencyFlow()
☑ [SPEC-002] Emergency Bond計算式準拠
    → MAX(0.5 ETH, amount × 5%)
☑ [SPEC-003] 7日Time Lock準拠
    → EMERGENCY_TIME_LOCK = 7 days
☑ [SPEC-004] Sequence #4 (Challenge) 連携準拠
    → Challenge対応実装済み
```

---

## ✅ Core Principles準拠確認

```
☑ [CP-1] 完全量子耐性: (継承)
☑ [CP-2] Self-Custody: Bond以外は保持しない
    → test_CorePrinciple_SelfCustody()
☑ [CP-3] Time Lock存在: 7日Time Lock実装
    → test_CorePrinciple_TimeLockExists()
☑ [CP-4] Slashing存在: Challenge経由で適用
    → test_EmergencyBond_ForfeitedOnValidChallenge()
☑ [CP-5] 透明性: 全操作がオンチェーン
    → test_CorePrinciple_Transparency()
```

---

## 📁 成果物

| ファイル | 説明 | Status |
|---------|------|--------|
| `contracts/src/L1Vault.sol` | Emergency機能追加 | ☑ 完了 |
| `contracts/test/L1VaultEmergency.t.sol` | Emergencyテスト | ☑ 完了 |

---

## 📝 完了報告

```markdown
## Sequence #3 完了報告

**日時**: 2025-12-24 00:30 JST
**担当**: Claude (Engineer Agent)

### 完了項目
- [x] TRIG-001〜004: トリガー条件実装
- [x] BOND-001〜004: Bond処理実装
- [x] TL7-001〜004: 7日Time Lock実装
- [x] MON-001〜003: 監視強化モード実装
- [x] EVT-001〜003: イベント実装

### テスト結果
- L1VaultEmergencyTest: 20テスト作成
  - Bond計算テスト: 4件
  - Emergency Request テスト: 4件
  - 72h Timeout テスト: 2件
  - 7-day Time Lock テスト: 3件
  - Challenge 連携テスト: 2件
  - Enhanced Monitoring テスト: 2件
  - Edge Case テスト: 2件
  - Spec/Core Principle テスト: 5件

### 主な実装内容
1. `PROVER_TIMEOUT` 定数 (72 hours)
2. `EmergencyStatus` enum追加
3. `EmergencyUnlock` struct追加
4. `checkProverTimeout()` - 72hタイムアウト検知
5. `initiateEmergencyFromTimeout()` - 自動Emergency切り替え
6. `calculateEmergencyBond()` - Bond計算
7. 3つの新規イベント追加
8. `enhancedMonitoring` mapping追加

### コミット
- c7acb827a68ac9d109278f7dcab32c59a645b924 (L1Vault.sol更新)
- b68e5221e6f700de9c0f57baae05d9f9bce40d72 (テスト追加)

### PIR判定
- [x] PIR-006 PASS

### 次のアクション
→ sequence_4_challenge.md に移行
```

---

## 🔗 参照

- 前のチェックリスト: `sequence_2_unlock_normal.md`
- 次のチェックリスト: `sequence_4_challenge.md`
- Challenge連携: `sequence_4_challenge.md`

---

**END OF CHECKLIST**
