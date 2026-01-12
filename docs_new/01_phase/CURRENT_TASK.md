# Task Definition - TASK-P5-007

## 基本情報
| 項目 | 値 |
|------|-----|
| タスクID | TASK-P5-007-PROD |
| 対象Sequence | #5 Prover Registration |
| 優先度 | P1 |
| ステータス | DONE |
| 開始日 | 2026-01-12 |
| 完了日 | 2026-01-12 |

## トレーサビリティ

| Sequence Step | 仕様書 | 実装先 |
|--------------|--------|-------|
| #5.1 Registration | SEQUENCES §5 | `services/api/src/routes/prover.rs` |
| #5.1 公開鍵検証 | UNIFIED_SPEC §SPHINCS+ | `services/api/src/services/sphincs_service.rs` |

## 既存実装調査

### 実装済み
- `contracts/src/SPHINCSVerifier.sol` - L1署名検証器 ✅
- `services/api/src/routes/prover.rs:88-91` - prefix checkのみ

### 未実装
- 実際のSPHINCS+公開鍵フォーマット検証
- HSM attestation検証（optional）

## ギャップ分析
| 項目 | 状態 |
|-----|------|
| L1検証器 | ✅ 完成 |
| API側公開鍵検証 | ❌ prefix checkのみ |
| 検証サービス | ❌ 未実装 |

## 完了条件

### 形式的条件
- `∀ pubkey: len(pubkey) == 32 bytes (64 hex chars + 0x)`
- `∀ pubkey: seed(16 bytes) + root(16 bytes) structure`
- `∀ invalid_pubkey: registration REJECTED`

### 実行条件
- `cargo build -p quantum-shield-api` PASS
- `cargo test -p quantum-shield-api -- sphincs` PASS

### 成果物
| ファイル | 説明 |
|---------|------|
| `services/api/src/services/sphincs_service.rs` | 検証サービス |
| `services/api/src/routes/prover.rs` | 検証強化 |

## WHY: SPHINCS+ 公開鍵検証

### 問題
- 現状はprefix checkのみで不正な公開鍵でもProver登録可能
- L1側は検証できるがAPI層でのフィルタリングが不十分

### 解決策
- SPHINCS+-SHAKE-128s仕様に基づく完全な検証を実装
- 32バイト公開鍵フォーマット（seed 16バイト + root 16バイト）
- 不正な公開鍵は登録時点で拒否

### Core Principles準拠
- CP-1: 完全な量子耐性（SPHINCS+ NIST FIPS 205）

---

**END OF TASK DEFINITION**
