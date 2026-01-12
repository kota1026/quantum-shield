# Task Definition

> **Generated**: 2026-01-12 (SEP v3)
> **Status**: ✅ COMPLETED

---

## 基本情報

| 項目 | 値 |
|------|-----|
| タスクID | TASK-P5-007 |
| タイトル | SPHINCS+ Verification |
| 対象Sequence | §5 Prover Registration |
| 優先度 | P1 |
| 見積り工数 | 2日 |

---

## 背景

### 現状分析

| コンポーネント | ファイル | 状態 | 備考 |
|--------------|---------|:----:|------|
| SPHINCS+ Service | sphincs_service.rs | ✅ 完成 | FIPS 205対応 |
| Prover Routes | prover.rs | ✅ 完成 | マージコンフリクト解決済 |
| Cargo.toml | services/api/Cargo.toml | ✅ 完成 | fips205 0.4追加 |

### 実装サマリー

```
実装内容:
- NIST FIPS 205 (SLH-DSA-SHAKE-128s) 署名検証
- 公開鍵フォーマット検証（32バイト）
- 署名フォーマット検証（7856バイト）
- 実際の暗号署名検証（verify関数）
- 不正な公開鍵でのProver登録拒否
- ユニットテスト（全て成功）
```

---

## 仕様参照

- SEQUENCES §5 Prover Registration
- CORE_PRINCIPLES CP-1: 完全量子耐性
- NIST FIPS 205: Stateless Hash-Based Digital Signature Standard

---

## 実装完了項目

### 1. fips205クレート追加 ✅

```toml
# services/api/Cargo.toml
fips205 = { version = "0.4", features = ["slh_dsa_shake_128s", "default-rng"] }
```

### 2. verify_signature関数実装 ✅

```rust
// services/api/src/services/sphincs_service.rs
pub fn verify_signature(
    message: &[u8],
    signature: &str,
    pubkey: &str,
) -> Result<bool, SphincsError>
```

- FIPS 205 SLH-DSA-SHAKE-128s準拠
- 128ビットセキュリティレベル
- 空のコンテキストで検証

### 3. テスト追加 ✅

- test_verify_signature_real_keypair: 実際の鍵ペアで検証
- test_verify_signature_wrong_message: 不正メッセージで失敗確認
- test_verify_signature_invalid_pubkey_rejects: 不正公開鍵で拒否確認

---

## 完了条件

| # | 条件 | 状態 |
|---|------|:----:|
| 1 | SPHINCS+公開鍵フォーマット検証 | ✅ |
| 2 | SPHINCS+署名検証実装 | ✅ |
| 3 | 不正公開鍵でのProver登録拒否 | ✅ |
| 4 | cargo build成功 | ✅ |
| 5 | cargo test成功 (58 passed) | ✅ |

---

## 技術詳細

### SPHINCS+-128s パラメータ (NIST Level 1)

| パラメータ | 値 |
|-----------|-----|
| 公開鍵サイズ | 32 bytes |
| 署名サイズ | 7,856 bytes |
| セキュリティ | 128-bit post-quantum |

### CP-1 準拠

- ✅ NIST FIPS 205準拠
- ✅ ポスト量子安全（128ビット）
- ✅ SHA3-256ハッシュ使用

---

**END OF TASK DEFINITION**
