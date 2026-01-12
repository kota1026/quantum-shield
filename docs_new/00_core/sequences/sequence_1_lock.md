# Sequence #1: Lock チェックリスト

> **Status**: ✅ COMPLETE  
> **担当**: Engineer, Cryptographer  
> **PIR**: PIR-003, PIR-004  
> **完了日**: 2025-12-22

---

## 📋 Sequence概要

| 項目 | 値 |
|------|-----|
| Sequence# | 1 |
| Name | Lock |
| Category | User Flow |
| Gas (est.) | ~135K (~$7) |
| 依存 | なし |

---

## ✅ 実装チェックリスト

### 1.1 Core Implementation

```
☑ [LOCK-001] L1Vault.lock() 基本実装
☑ [LOCK-002] Dilithium署名検証呼び出し
☑ [LOCK-003] nonce重複チェック (mapping)
☑ [LOCK-004] expiry期限チェック
☑ [LOCK-005] ETH/ERC20受領ロジック
```

### 1.2 State Root (SR_0)

```
☑ [SR0-001] SR_0計算式実装
☑ [SR0-002] SHA3-256使用 (FIPS 202準拠)
☑ [SR0-003] prefix "QS_LOCK_V1" 使用
☑ [SR0-004] chain_id含める
☑ [SR0-005] pk_dilithium含める
```

### 1.3 SMT (Sparse Merkle Tree)

```
☑ [SMT-001] SMT.insert() 呼び出し
☑ [SMT-002] lock_id → SR_0 マッピング
☑ [SMT-003] Merkle proof生成確認
```

### 1.4 Events

```
☑ [EVT-001] Locked event定義
☑ [EVT-002] lock_id, amount, dest_addr emit
☑ [EVT-003] SR_0 emit
```

---

## ✅ テストチェックリスト

### Unit Tests

```
☑ [T-001] lock正常系テスト
☑ [T-002] 署名検証失敗テスト
☑ [T-003] nonce重複テスト
☑ [T-004] expiry期限切れテスト
☑ [T-005] 金額0テスト
☑ [T-006] SR_0計算テスト
☑ [T-007] SMT挿入確認テスト
```

### Integration Tests

```
☑ [IT-001] Lock → SMT更新確認
☑ [IT-002] Lock → Event確認
☑ [IT-003] 複数Lock連続テスト
```

---

## ✅ Core Principles準拠確認

```
☑ [CP-1] 完全量子耐性: Dilithium署名のみ使用
☑ [CP-2] Self-Custody: ユーザー鍵は保存しない
☑ [CP-3] Time Lock存在: (Unlock時に適用)
☑ [CP-4] Slashing存在: (Challenge時に適用)
☑ [CP-5] 透明性: 全操作がオンチェーン
```

---

## 📁 成果物

| ファイル | 説明 | Status |
|---------|------|--------|
| `src/L1Vault.sol` | Lock機能 | ✅ |
| `src/StateRootCalculator.sol` | SR_0計算 | ✅ |
| `src/SparseMerkleTree.sol` | SMT | ✅ |
| `test/L1Vault.t.sol` | Unit Tests | ✅ |
| `test/StateRootCalculator.t.sol` | SR Tests | ✅ |

---

## 📝 PIR記録

| PIR ID | 日付 | 判定 | メモ |
|--------|------|------|------|
| PIR-003 | 2025-12-22 | ⚠️ CONDITIONAL | SHA3-256 Gas最適化要 |
| PIR-004 | 2025-12-22 | ✅ PASS | SR計算完了 |

---

## 🔗 参照

- 憲法: `docs/constitution/CORE_PRINCIPLES.md`
- シーケンス詳細: `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` (Sequence #1)
- 次のチェックリスト: `sequence_2_unlock_normal.md`

---

**END OF CHECKLIST**
