# Phase 8-D: L3 Integration Prompt

> QS Admin管理画面のL3（量子耐性レイヤー）統合

---

## 概要

Phase 8-DのL3統合では、QS Admin管理画面からL3ノードへの接続と、Dilithium署名の生成・検証を実装します。

### 対象タスク

| # | Task | 優先度 | 依存関係 |
|---|------|:------:|----------|
| 01 | L3 Node Connection | P0 | - |
| 02 | Dilithium Signature Generation | P0 | Task 01 |
| 03 | Dilithium Signature Verification | P0 | Task 01 |
| 04 | Treasury Operations L3 | P1 | Task 02, 03 |
| 05 | Prover Approval L3 | P1 | Task 02, 03 |

---

## Task 01: L3 Node Connection

### 目的
QS AdminバックエンドからL3ノード（Aegis）への接続を確立する。

### 実装要件

```rust
// services/api/src/services/l3_client.rs

use reqwest::Client;
use serde::{Deserialize, Serialize};

pub struct L3Client {
    endpoint: String,
    client: Client,
}

impl L3Client {
    pub fn new(endpoint: &str) -> Self {
        Self {
            endpoint: endpoint.to_string(),
            client: Client::new(),
        }
    }

    /// L3ノードのヘルスチェック
    pub async fn health_check(&self) -> Result<L3HealthStatus, L3Error> {
        // GET /health
    }

    /// L3ノードの現在ブロック高取得
    pub async fn get_block_height(&self) -> Result<u64, L3Error> {
        // GET /block/latest
    }

    /// L3トランザクション送信
    pub async fn submit_transaction(&self, tx: L3Transaction) -> Result<L3TxReceipt, L3Error> {
        // POST /tx/submit
    }
}
```

### 環境変数

```env
L3_NODE_ENDPOINT=http://localhost:8545
L3_CHAIN_ID=31337
L3_TIMEOUT_MS=30000
```

### テスト要件

- [ ] L3ノード接続成功テスト
- [ ] L3ノード接続失敗時のリトライテスト
- [ ] タイムアウトハンドリングテスト

---

## Task 02: Dilithium Signature Generation

### 目的
Admin操作（Treasury送金、Prover承認等）に対するDilithium署名を生成する。

### 既存コードの活用

`services/api/src/crypto.rs` に既存のML-DSA-65実装があります：

```rust
// 既存の検証関数
pub fn verify_ml_dsa_65_signature(
    message: &[u8],
    signature_hex: &str,
    public_key_hex: &str,
) -> Result<bool, ApiError>
```

### 追加実装

```rust
// services/api/src/crypto.rs に追加

use fips204::ml_dsa_65;
use fips204::traits::{SerDes, Signer};

/// Admin用のDilithium署名生成
///
/// # Security Note
/// 秘密鍵はHSM/KMSから取得すること。
/// 環境変数やコードへの直接埋め込みは禁止。
pub fn sign_ml_dsa_65(
    message: &[u8],
    private_key: &ml_dsa_65::PrivateKey,
) -> Result<Vec<u8>, ApiError> {
    let signature = private_key
        .try_sign(message, &[])
        .map_err(|_| ApiError::Internal("Dilithium signing failed".into()))?;
    Ok(signature.to_vec())
}

/// Admin署名用のメッセージフォーマット
///
/// Format: QS_ADMIN_V1|action_type|resource_id|timestamp|nonce
pub fn build_admin_signing_message(
    action_type: &str,
    resource_id: &str,
    timestamp: u64,
    nonce: &str,
) -> Vec<u8> {
    format!(
        "QS_ADMIN_V1|{}|{}|{}|{}",
        action_type, resource_id, timestamp, nonce
    ).into_bytes()
}
```

### 秘密鍵管理

```rust
// services/api/src/services/key_service.rs

pub struct KeyService {
    // HSM/KMS接続
}

impl KeyService {
    /// HSMから署名用秘密鍵を取得
    ///
    /// 本番環境: AWS KMS / Azure Key Vault / HashiCorp Vault
    /// 開発環境: ローカルファイル（テスト用）
    pub async fn get_signing_key(&self, key_id: &str) -> Result<ml_dsa_65::PrivateKey, KeyError> {
        // Implementation
    }
}
```

---

## Task 03: Dilithium Signature Verification

### 目的
L3から受信したトランザクション結果のDilithium署名を検証する。

### 実装要件

既存の `verify_ml_dsa_65_signature` を使用。

---

## Task 04: Treasury Operations L3

### 目的
Treasury送金操作をL3で実行し、署名を記録する。

### フロー

```
1. Admin: 送金リクエスト作成
2. Backend: 送金メッセージ生成
3. Backend: Dilithium署名生成
4. Backend: L3に送金TX送信
5. L3: TX実行 + Prover署名
6. Backend: 署名検証 + DB記録
7. Admin: 結果表示
```

---

## Task 05: Prover Approval L3

### 目的
Prover承認操作をL3で実行し、署名を記録する。

---

## BE Rules 準拠

| ルール | 要件 |
|--------|------|
| BE-001 | L3トランザクションは実際にL3ノードに送信する（モック禁止） |
| BE-002 | テスト用にL3接続をスキップするフラグ禁止 |
| BE-003 | 全L3操作にログ出力必須（TX送信、署名生成、検証結果） |

---

## 環境設定

### 開発環境

```env
L3_NODE_ENDPOINT=http://localhost:8545
L3_CHAIN_ID=31337
ADMIN_SIGNING_KEY_PATH=/path/to/dev-key.pem
```

### 本番環境

```env
L3_NODE_ENDPOINT=https://l3.quantum-shield.io
L3_CHAIN_ID=31338
ADMIN_SIGNING_KEY_ID=aws-kms-key-id
```

---

## 次のステップ

L3統合完了後、Phase 8-D L1統合（05_l1_integration.md）に進む。
