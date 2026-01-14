# Quantum Shield - HSM Integration Specification v1.0

> **作成日**: 2026-01-04
> **タスクID**: INFRA-005
> **目的**: Prover署名のためのHSM (Hardware Security Module) 連携仕様
> **優先度**: P1
> **レビュー**: CSO必須

---

## 目次

1. [概要](#1-概要)
2. [セキュリティ要件](#2-セキュリティ要件)
3. [アーキテクチャ](#3-アーキテクチャ)
4. [通信プロトコル](#4-通信プロトコル)
5. [鍵管理](#5-鍵管理)
6. [署名フロー](#6-署名フロー)
7. [監視とアラート](#7-監視とアラート)
8. [障害対応](#8-障害対応)

---

## 1. 概要

### 1.1 目的

ProverがUnlock承認に必要なSPHINCS+-128s署名を生成する際、
秘密鍵をHSM内で安全に管理し、署名生成を行う。

### 1.2 対象Prover

| Phase | Prover数 | HSM要件 |
|-------|---------|--------|
| Phase 1 | 5社（招待制） | 必須 |
| Phase 2 | 5~10社 | 必須 |
| Phase 3+ | 無制限 | 必須 |

### 1.3 影響範囲

| シーケンス | HSM関与 |
|-----------|--------|
| #2 Unlock (Normal) | SPHINCS+署名生成 |
| #3 Unlock (Emergency) | N/A（Prover不要） |
| #5 Prover Registration | HSM公開鍵登録 |
| #6 Prover Exit | HSM鍵削除 |

---

## 2. セキュリティ要件

### 2.1 AGENT_MEETING決議事項

| 要件 | 内容 | 実装 |
|------|------|------|
| mTLS必須化 | Event Bridge↔HSM間の通信 | TLS 1.3 + クライアント証明書 |
| 2-of-3承認 | HSM内での署名承認 | HSM内部ロジック |
| 鍵エスクロー禁止 | 秘密鍵はHSM外に出ない | CP-2準拠 |
| 監査ログ | 全署名操作をログ | 改ざん防止ストレージ |

### 2.2 暗号要件（CP-1準拠）

| 用途 | アルゴリズム | パラメータ |
|------|------------|------------|
| Prover署名 | SPHINCS+-128s | FIPS 205, ~8KB/署名 |
| 通信暗号化 | TLS 1.3 | ChaCha20-Poly1305 or AES-256-GCM |
| 証明書署名 | Ed25519 or Dilithium | 量子耐性優先 |

### 2.3 禁止事項

❌ 以下は絶対禁止：

- ECDSA/RSA署名（量子脆弱）
- 秘密鍵のエクスポート
- プレーンテキスト通信
- 単一承認者による署名

---

## 3. アーキテクチャ

### 3.1 全体構成

```
┌─────────────────────────────────────────────────────────────────────┐
│                       HSM Integration Architecture                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐  │
│  │   L3 Node   │          │ HSM Gateway │          │    HSM      │  │
│  │             │◄────────►│   (mTLS)    │◄────────►│  (FIPS     │  │
│  │ UnlockReady │          │             │          │   140-2)   │  │
│  │ Event       │          │ Rate Limit  │          │             │  │
│  └─────────────┘          │ Auth Check  │          │ SPHINCS+   │  │
│        │                  │ Audit Log   │          │ Signing    │  │
│        │                  └─────────────┘          └─────────────┘  │
│        │                                                             │
│        │                  ┌─────────────┐                           │
│        └─────────────────►│ Event Bridge│                           │
│                           │             │                           │
│                           │ Collect 2/5 │                           │
│                           │ Signatures  │                           │
│                           └─────────────┘                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 コンポーネント

| コンポーネント | 役割 | 実装 |
|---------------|------|------|
| **HSM Gateway** | mTLS終端、認証、レート制限 | Rust/Go |
| **HSM Driver** | HSM固有プロトコル対応 | PKCS#11 |
| **Audit Logger** | 署名操作ログ記録 | Append-only DB |
| **Key Manager** | 鍵ライフサイクル管理 | HSM内部 |

### 3.3 対応HSMベンダー

| ベンダー | モデル | FIPS認証 | 備考 |
|---------|-------|:--------:|------|
| Thales | Luna Network HSM 7 | FIPS 140-2 L3 | 推奨 |
| AWS | CloudHSM | FIPS 140-2 L3 | クラウド対応 |
| Azure | Dedicated HSM | FIPS 140-2 L3 | クラウド対応 |
| Yubico | YubiHSM 2 | FIPS 140-2 L3 | 小規模向け |

---

## 4. 通信プロトコル

### 4.1 mTLS設定

```yaml
# HSM Gateway TLS Configuration
tls:
  version: "1.3"
  cipher_suites:
    - TLS_CHACHA20_POLY1305_SHA256
    - TLS_AES_256_GCM_SHA384
  client_auth: required
  client_ca: "/etc/hsm/ca.crt"
  server_cert: "/etc/hsm/server.crt"
  server_key: "/etc/hsm/server.key"
```

### 4.2 API定義

#### 署名リクエスト

```protobuf
// hsm_service.proto
service HsmService {
  // Request SPHINCS+ signature
  rpc SignUnlock(SignRequest) returns (SignResponse);
  
  // Get public key
  rpc GetPublicKey(GetPublicKeyRequest) returns (GetPublicKeyResponse);
  
  // Health check
  rpc HealthCheck(Empty) returns (HealthResponse);
}

message SignRequest {
  bytes prover_id = 1;          // 32 bytes
  bytes lock_id = 2;            // 32 bytes
  bytes sr0 = 3;                // State Root 0
  bytes sr1 = 4;                // State Root 1
  bytes unlock_data_hash = 5;   // SHA3-256 of unlock data
  uint64 timestamp = 6;
  bytes request_signature = 7;  // Dilithium signature of request
}

message SignResponse {
  bytes signature = 1;          // SPHINCS+ signature (~8KB)
  bytes public_key = 2;         // Public key used
  uint64 signed_at = 3;
  string audit_id = 4;          // Audit trail ID
}
```

### 4.3 認証フロー

```
L3 Node                HSM Gateway              HSM
   │                       │                     │
   │──(1) mTLS Handshake──►│                     │
   │   [Client Cert]       │                     │
   │                       │                     │
   │◄──(2) TLS Established─│                     │
   │                       │                     │
   │──(3) SignRequest─────►│                     │
   │   [Dilithium Sig]     │                     │
   │                       │                     │
   │                 ┌─────┴─────┐               │
   │                 │ Verify:   │               │
   │                 │ - mTLS OK │               │
   │                 │ - Rate OK │               │
   │                 │ - Sig OK  │               │
   │                 └─────┬─────┘               │
   │                       │                     │
   │                       │──(4) PKCS#11 Sign──►│
   │                       │                     │
   │                       │              ┌──────┴──────┐
   │                       │              │ 2-of-3     │
   │                       │              │ Internal   │
   │                       │              │ Approval   │
   │                       │              │            │
   │                       │              │ SPHINCS+   │
   │                       │              │ Sign       │
   │                       │              └──────┬──────┘
   │                       │                     │
   │                       │◄──(5) Signature─────│
   │                       │                     │
   │◄──(6) SignResponse────│                     │
   │   [SPHINCS+ Sig]      │                     │
```

---

## 5. 鍵管理

### 5.1 鍵ライフサイクル

```
┌─────────┐     ┌──────────┐     ┌────────┐     ┌─────────┐
│ Generate│────►│ Register │────►│ Active │────►│ Retired │
│ (HSM内) │     │ (L1登録) │     │ (使用中)│     │ (退出後)│
└─────────┘     └──────────┘     └────────┘     └─────────┘
                                      │
                                      │ (Slashing)
                                      ▼
                                ┌─────────┐
                                │ Revoked │
                                └─────────┘
```

### 5.2 鍵生成

```rust
// HSM内での鍵生成 (SPHINCS+-128s)
pub struct KeyGenParams {
    /// SPHINCS+ parameter set
    pub param_set: SphincsParamSet::Shake128s,
    /// Key ID (derived from prover_id)
    pub key_id: [u8; 32],
    /// Backup allowed (must be false)
    pub extractable: false,
}
```

### 5.3 鍵バックアップ（禁止）

⚠️ **CP-2 (Self-Custody) 準拠のため、鍵のエクスポート/バックアップは禁止**

- HSM障害時は新規鍵を生成し、L1に再登録
- 旧鍵は7日間のUnbonding後に無効化

---

## 6. 署名フロー

### 6.1 Unlock署名 (Sequence #2)

```
L3 Node (Unlock Request)
       │
       ▼
┌──────────────┐
│ VRF Prover   │  ← Chainlink VRFで2/5選出
│ Selection    │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│ Prover A     │     │ Prover B     │
│ HSM Request  │     │ HSM Request  │
└──────┬───────┘     └──────┬───────┘
       │                     │
       ▼                     ▼
┌──────────────┐     ┌──────────────┐
│ HSM A        │     │ HSM B        │
│ 2-of-3 Sign  │     │ 2-of-3 Sign  │
└──────┬───────┘     └──────┬───────┘
       │                     │
       └──────────┬──────────┘
                  │
                  ▼
         ┌──────────────┐
         │ Event Bridge │
         │ Collect 2/5  │
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │ L1 Submit    │
         │ Unlock       │
         └──────────────┘
```

### 6.2 署名検証（L1側）

```solidity
// L1 SPHINCS+ Verification
function verifyUnlock(
    bytes32 lockId,
    bytes32 sr0,
    bytes32 sr1,
    bytes calldata smtProof,
    bytes calldata unlockData,
    SphincsSignature[] calldata signatures
) external {
    // Require 2/5 signatures
    require(signatures.length >= 2, "Insufficient signatures");
    
    // Verify each signature
    bytes32 messageHash = sha3_256(
        abi.encodePacked(
            "QS_UNLOCK_V1",
            lockId,
            sr0,
            sr1
        )
    );
    
    uint256 validCount = 0;
    for (uint i = 0; i < signatures.length; i++) {
        if (sphincsVerifier.verify(
            messageHash,
            signatures[i].signature,
            signatures[i].publicKey
        )) {
            // Check prover is registered and not slashed
            require(
                proverRegistry.isActiveProver(signatures[i].proverId),
                "Invalid prover"
            );
            validCount++;
        }
    }
    
    require(validCount >= 2, "Not enough valid signatures");
}
```

---

## 7. 監視とアラート

### 7.1 メトリクス

| メトリクス | 説明 | 閾値 |
|-----------|------|------|
| `hsm_sign_latency_ms` | 署名レイテンシ | < 5000ms |
| `hsm_sign_success_rate` | 署名成功率 | > 99.9% |
| `hsm_connection_errors` | 接続エラー | < 1/分 |
| `hsm_rate_limit_hits` | レート制限ヒット | < 10/分 |
| `hsm_2of3_failures` | 2-of-3承認失敗 | 0 |

### 7.2 アラート設定

```yaml
# alerts.yaml
groups:
  - name: hsm_alerts
    rules:
      - alert: HsmHighLatency
        expr: hsm_sign_latency_ms > 5000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "HSM signing latency is high"
          
      - alert: HsmSigningFailure
        expr: hsm_sign_success_rate < 0.99
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "HSM signing success rate dropped"
          
      - alert: HsmConnectionError
        expr: hsm_connection_errors > 5
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "HSM connection errors detected"
```

---

## 8. 障害対応

### 8.1 障害シナリオ

| シナリオ | 影響 | 対応 |
|---------|------|------|
| HSM単体障害 | 1社の署名不可 | 他4社で継続（2/5閾値） |
| HSM Gateway障害 | 全署名不可 | 冗長Gateway切替 |
| mTLS証明書期限切れ | 認証失敗 | 自動更新（cert-manager） |
| HSM鍵損失 | Prover無効化 | 新規登録 + 7日Unbonding |

### 8.2 復旧手順

#### HSM接続障害

```bash
# 1. 接続確認
curl -k https://hsm-gateway.internal:8443/health

# 2. HSMステータス確認
hsm-admin status --slot 0

# 3. Gateway再起動
kubectl rollout restart deployment/hsm-gateway

# 4. 接続再確認
curl -k https://hsm-gateway.internal:8443/health
```

#### 鍵損失時

```bash
# 1. 新規鍵生成（HSM内）
hsm-keygen --algorithm SPHINCS_128S --key-id <prover_id>

# 2. 公開鍵取得
hsm-export-pubkey --key-id <prover_id> > pubkey.bin

# 3. L1に再登録
cast send $PROVER_REGISTRY "updatePublicKey(bytes32,bytes)" \
  <prover_id> $(cat pubkey.bin | xxd -p)

# 4. 7日間のUnbonding待機（旧鍵で署名した分のSlash対象期間）
```

---

## 9. 工数見積もり

| コンポーネント | 工数 | 担当 |
|---------------|:----:|------|
| HSM Gateway実装 | 5日 | Backend |
| PKCS#11ドライバー | 3日 | Infra |
| mTLS設定 | 2日 | DevOps |
| 監視・アラート | 2日 | DevOps |
| 結合テスト | 3日 | QA |
| ドキュメント | 1日 | All |
| **合計** | **16日** | - |

---

## 10. 参照ドキュメント

| ドキュメント | 参照箇所 |
|------------|----------|
| CORE_PRINCIPLES.md | CP-1, CP-2 |
| SEQUENCES.md | #2, #5, #6 |
| AGENT_MEETING_MINUTES_20260104.md | §3.3 CSO, §3.8 Red Team |
| EVENT_BRIDGE_SPEC.md | §6 mTLS要件 |

---

**END OF DOCUMENT**
