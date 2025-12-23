# Sequence #3: Unlock (Emergency) チェックリスト

> **Status**: ⏳ PENDING  
> **担当**: Engineer, CSO  
> **PIR**: PIR-006  
> **依存**: Sequence #2 (Unlock Normal) 完了必須

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

**ファイル**: `src/L1Vault.sol`

```
□ [TRIG-001] 72hタイムアウト検知
□ [TRIG-002] Prover応答状態追跡
□ [TRIG-003] Emergency Path自動切り替え
□ [TRIG-004] User手動Emergency発動オプション
```

### 3.2 Emergency Bond

**ファイル**: `src/L1Vault.sol`

```
□ [BOND-001] Bond計算: MAX(0.5 ETH, amount × 5%)
□ [BOND-002] Bond受領ロジック
□ [BOND-003] Bond返還ロジック（正常完了時）
□ [BOND-004] Bond没収ロジック（不正検出時）
```

### 3.3 7日 Time Lock

```
□ [TL7-001] 7日Time Lock開始ロジック
□ [TL7-002] Challenge期間との連携
□ [TL7-003] Time Lock延長（Challenge時）
□ [TL7-004] emergencyUnlockReadyAt記録
```

### 3.4 監視強化モード

```
□ [MON-001] 監視強化フラグ設定
□ [MON-002] Challenge受付開始
□ [MON-003] イベント通知強化
```

### 3.5 Events

```
□ [EVT-001] EmergencyUnlockInitiated event
□ [EVT-002] EmergencyBondReceived event
□ [EVT-003] EmergencyUnlockFinalized event
```

---

## ✅ テストチェックリスト

### Emergency Flow Tests

```
□ [T-EM-001] 72hタイムアウト後のEmergency開始テスト
□ [T-EM-002] Bond計算テスト（MIN/MAX境界）
□ [T-EM-003] Bond受領確認テスト
□ [T-EM-004] 7日Time Lock確認テスト
□ [T-EM-005] Challenge連携テスト
□ [T-EM-006] 正常完了時Bond返還テスト
```

### Edge Cases

```
□ [T-EDGE-001] 72h直前のProver応答テスト
□ [T-EDGE-002] Bond不足時の拒否テスト
□ [T-EDGE-003] 複数Emergency並行テスト
```

---

## ✅ 仕様準拠確認

```
□ [SPEC-001] QUANTUM_SHIELD_SEQUENCES_v2.0 Sequence#3準拠
□ [SPEC-002] Emergency Bond計算式準拠
□ [SPEC-003] 7日Time Lock準拠
□ [SPEC-004] Sequence #4 (Challenge) 連携準拠
```

---

## ✅ Core Principles準拠確認

```
□ [CP-1] 完全量子耐性: (継承)
□ [CP-2] Self-Custody: Bond以外は保持しない
□ [CP-3] Time Lock存在: 7日Time Lock実装
□ [CP-4] Slashing存在: Challenge経由で適用
□ [CP-5] 透明性: 全操作がオンチェーン
```

---

## 📁 成果物

| ファイル | 説明 | Status |
|---------|------|--------|
| `src/L1Vault.sol` | Emergency機能追加 | □ |
| `test/L1VaultEmergency.t.sol` | Emergencyテスト | □ |

---

## 🔗 参照

- 前のチェックリスト: `sequence_2_unlock_normal.md`
- 次のチェックリスト: `sequence_4_challenge.md`
- Challenge連携: `sequence_4_challenge.md`

---

**END OF CHECKLIST**
