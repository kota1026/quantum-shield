# Task Definition

> **Generated**: 2026-01-12 (SEP v3)
> **Status**: Active

---

## 基本情報

| 項目 | 値 |
|------|-----|
| タスクID | TASK-P5-007 |
| タイトル | SPHINCS+公開鍵検証実装 |
| 対象Sequence | #5 Prover Registration |
| 優先度 | P1 |
| 見積り工数 | 2日 |

---

## 背景

### 現状分析

| コンポーネント | ファイル | 状態 | 備考 |
|--------------|---------|:----:|------|
| L1 SPHINCSVerifier | `contracts/src/SPHINCSVerifier.sol` | ✅ 完成 | オンチェーン検証 |
| API prover.rs | `routes/prover.rs:88-91` | ⚠️ 弱い | prefix checkのみ |
| HSM attestation | `routes/prover.rs:76-79` | ⚠️ TODO | empty check only |

### ギャップ分析

```rust
// 現在のvalidate_sphincs_pubkey (prover.rs:88-91)
fn validate_sphincs_pubkey(pubkey: &str) -> bool {
    pubkey.starts_with("0x") && pubkey.len() > 2
}

// 必要な検証:
// 1. SPHINCS+-128s公開鍵サイズ: 32 bytes = 64 hex chars
// 2. 有効なhex encoding
// 3. (optional) 実際の公開鍵フォーマット検証
```

---

## 実装項目

### 1. sphincs_service.rs作成

```rust
pub struct SphincsService {
    // SPHINCS+-128s parameters
}

impl SphincsService {
    pub fn validate_public_key(pubkey: &str) -> Result<bool, SphincsError>;
    pub fn validate_signature(message: &[u8], sig: &[u8], pubkey: &[u8]) -> Result<bool, SphincsError>;
}
```

### 2. prover.rs更新

- sphincs_service使用
- 詳細なエラーメッセージ
- 公開鍵サイズ検証

---

## 完了条件

| # | 条件 |
|---|------|
| 1 | SPHINCS+-128s公開鍵サイズ検証 (32 bytes) |
| 2 | 不正な公開鍵での登録拒否 |
| 3 | テスト成功 |

---

**END OF TASK DEFINITION**
