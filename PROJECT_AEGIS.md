# Project Aegis: L3 Quantum-Resistant Proof Layer

## プロジェクト概要

**Project Aegis**（イージス）は、Quantum Shield の L3 Proof Layer 実装プロジェクトである。
ギリシャ神話における「神の盾」の名を冠し、量子コンピュータ時代においても資産を守り抜く防御層を構築する。

| 項目 | 内容 |
|------|------|
| **プロジェクト名** | Project Aegis |
| **コードネーム** | QS-L3 |
| **開始日** | 2024年12月21日 |
| **目標完了日** | 2025年2月28日（Phase 1） |
| **承認者** | CEO (Kota) |
| **リード** | 11 Agent Team |

---

## 1. ミッションステートメント

> **「量子コンピュータ時代においても、ユーザーの資産を自己管理で安全に保護する、世界初の実用的な量子耐性クロスチェーンブリッジを構築する」**

### 理念（Purpose Guardian承認済み）

1. **完全量子耐性**: NIST Level 2（128bit量子セキュリティ）以上
2. **Self-Custody**: ユーザーがDilithium秘密鍵を完全に管理
3. **Trustless（可能な限り）**: 最終的にはFraud Proofで検証可能
4. **実用性**: Gas費用 < $5/Unlock、処理時間 < 1時間（Normal Path）

---

## 2. 背景と課題

### 2.1 量子脅威

| 現行技術 | 量子攻撃 | 影響 |
|---------|---------|------|
| ECDSA署名 | Shor's Algorithm | 数時間で秘密鍵復元 |
| RSA暗号 | Shor's Algorithm | 完全に破られる |
| bn254 pairing | Shor's Algorithm | zkSNARK無効化 |

### 2.2 既存ブリッジの問題

| ブリッジ | 量子耐性 | 課題 |
|---------|---------|------|
| Wormhole | ❌ | ECDSA依存 |
| LayerZero | ❌ | ECDSA依存 |
| Axelar | ❌ | ECDSA依存 |

### 2.3 L1直接検証の限界

| 検証方式 | Gas Cost | 実用性 |
|---------|----------|--------|
| Dilithium on EVM | ~20,000,000 gas | ❌ 非現実的 |
| SHA3-256 on EVM | ~60 gas | ✅ 実用的 |

**結論**: L3でDilithium検証、L1ではハッシュ検証のみ

---

## 3. アーキテクチャ

### 3.1 全体構成

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PROJECT AEGIS ARCHITECTURE                                                  │
│                                                                              │
│  ┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐            │
│  │   User      │     │   L3 Aegis      │     │   L1 Vault      │            │
│  │   Device    │     │   Layer         │     │   Contract      │            │
│  │             │     │                 │     │                 │            │
│  │ Dilithium   │────►│ Dilithium検証   │────►│ SHA3-256検証    │            │
│  │ SK/PK       │     │ State管理       │     │ SMT検証         │            │
│  │             │     │ SMT構築         │     │ Watchtower検証  │            │
│  └─────────────┘     └────────┬────────┘     └────────┬────────┘            │
│                               │                       │                      │
│                               │     ┌─────────────────┤                      │
│                               │     │                 │                      │
│                        ┌──────┴─────┴──────┐          │                      │
│                        │   Watchtowers     │          │                      │
│                        │   (5社)           │──────────┘                      │
│                        │   ECDSA署名       │                                 │
│                        └───────────────────┘                                 │
│                                                                              │
│  暗号技術:                                                                   │
│  ├── 署名: Dilithium-III (FIPS 204) - NIST Level 2                         │
│  ├── ハッシュ: SHA3-256 (FIPS 202) - 128bit量子耐性                        │
│  ├── 状態管理: Sparse Merkle Tree (深度20)                                 │
│  └── Watchtower: ECDSA (短期ローテーション)                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 レイヤー別責務

| レイヤー | 責務 | 技術 |
|---------|------|------|
| User Device | Dilithium鍵管理、署名生成 | pq-crystals/dilithium |
| L3 Aegis | Dilithium検証、State管理、SMT構築 | Cosmos SDK + Custom Module |
| Watchtower | L3検証確認、ECDSA署名発行 | Go/Rust Service |
| L1 Vault | SHA3-256検証、資産管理、Release | Solidity Contract |

---

## 4. 詳細シーケンス

### 4.1 Lock Sequence（資産ロック）

```
User                    L3 Aegis                Watchtowers          L1 Vault
  │                         │                        │                   │
  │──(1) Lock Request──────►│                        │                   │
  │  {                      │                        │                   │
  │    asset: 100 ETH,      │                        │                   │
  │    pk_dilithium,        │                        │                   │
  │    sig_dilithium        │                        │                   │
  │  }                      │                        │                   │
  │                         │                        │                   │
  │                   ┌─────┴─────┐                  │                   │
  │                   │ Dilithium │                  │                   │
  │                   │ 検証      │                  │                   │
  │                   │ (FIPS204) │                  │                   │
  │                   └─────┬─────┘                  │                   │
  │                         │                        │                   │
  │                   ┌─────┴─────┐                  │                   │
  │                   │ State更新 │                  │                   │
  │                   │ SR_0 =    │                  │                   │
  │                   │ SHA3-256( │                  │                   │
  │                   │ "QS_LOCK  │                  │                   │
  │                   │  _V1" ||  │                  │                   │
  │                   │  data)    │                  │                   │
  │                   └─────┬─────┘                  │                   │
  │                         │                        │                   │
  │                         │──(2) Notify───────────►│                   │
  │                         │                        │                   │
  │                         │                  ┌─────┴─────┐             │
  │                         │                  │ 検証OK    │             │
  │                         │                  │ ECDSA署名 │             │
  │                         │                  └─────┬─────┘             │
  │                         │                        │                   │
  │                         │◄──(3) 3/5 Signatures───│                   │
  │                         │                        │                   │
  │                         │──(4) Submit SR_0 + Sigs────────────────────►│
  │                         │                        │                   │
  │                         │                        │             ┌─────┴─────┐
  │                         │                        │             │ ECDSA検証 │
  │                         │                        │             │ SR_0保存  │
  │                         │                        │             └─────┬─────┘
  │                         │                        │                   │
  │──(5) Transfer 100 ETH───────────────────────────────────────────────►│
  │                         │                        │                   │
  │◄──(6) Lock Confirmed────────────────────────────────────────────────│
  │  {lock_id, SR_0}        │                        │                   │
```

### 4.2 Unlock Sequence（Normal Path）

```
User                    L3 Aegis                Watchtowers          L1 Vault
  │                         │                        │                   │
  │──(1) Unlock Request────►│                        │                   │
  │  {                      │                        │                   │
  │    chain_id: 1,         │                        │                   │
  │    vault_address,       │                        │                   │
  │    nonce: 42,           │                        │                   │
  │    lock_id,             │                        │                   │
  │    dest_addr,           │                        │                   │
  │    amount: 100 ETH,     │                        │                   │
  │    expiry,              │                        │                   │
  │    sig_dilithium        │                        │                   │
  │  }                      │                        │                   │
  │                         │                        │                   │
  │                   ┌─────┴─────┐                  │                   │
  │                   │ Dilithium │                  │                   │
  │                   │ 検証 ✅    │                  │                   │
  │                   │           │                  │                   │
  │                   │ nonce検証 │                  │                   │
  │                   │ expiry検証│                  │                   │
  │                   └─────┬─────┘                  │                   │
  │                         │                        │                   │
  │                   ┌─────┴─────┐                  │                   │
  │                   │ SR_1 =    │                  │                   │
  │                   │ SHA3-256( │                  │                   │
  │                   │ "QS_UNLK  │                  │                   │
  │                   │  _V1" ||  │                  │                   │
  │                   │ SR_0 ||   │                  │                   │
  │                   │ unlock)   │                  │                   │
  │                   │           │                  │                   │
  │                   │ SMT更新   │                  │                   │
  │                   └─────┬─────┘                  │                   │
  │                         │                        │                   │
  │                         │──(2) Unlock approved───►│                  │
  │                         │                        │                   │
  │                         │                  ┌─────┴─────┐             │
  │                         │                  │ L3検証確認│             │
  │                         │                  │ ECDSA署名 │             │
  │                         │                  └─────┬─────┘             │
  │                         │                        │                   │
  │                         │◄──(3) 3/5 Signatures───│                   │
  │                         │                        │                   │
  │                         │──(4) Submit────────────────────────────────►│
  │                         │  {SR_1, SMT_proof,     │                   │
  │                         │   unlock_data,         │                   │
  │                         │   3/5 ECDSA sigs}      │                   │
  │                         │                        │                   │
  │                         │                        │             ┌─────┴─────┐
  │                         │                        │             │ ecrecover │
  │                         │                        │             │ 3/5検証   │
  │                         │                        │             │ SMT検証   │
  │                         │                        │             │ SHA3検証  │
  │                         │                        │             └─────┬─────┘
  │                         │                        │                   │
  │◄──(5) Release 100 ETH───────────────────────────────────────────────│
  │                         │                        │                   │
```

### 4.3 Emergency Path（Watchtower障害時）

```
条件: 72時間以内にWatchtower 3/5の署名が集まらない

User                    L3 Aegis                              L1 Vault
  │                         │                                      │
  │──(1) Unlock Request────►│                                      │
  │                         │                                      │
  │                   [Dilithium検証OK]                            │
  │                   [Watchtower署名タイムアウト]                 │
  │                         │                                      │
  │                         │──(2) Submit (Emergency)──────────────►│
  │                         │  {SR_1, SMT_proof, unlock_data}      │
  │                         │  ※署名なし                           │
  │                         │                                      │
  │                         │                                ┌─────┴─────┐
  │                         │                                │ Emergency │
  │                         │                                │ Mode開始  │
  │                         │                                │ 7日待機   │
  │                         │                                └─────┬─────┘
  │                         │                                      │
  │                         │         [7日間のChallenge期間]       │
  │                         │         ├── Layer 1 (0-24h): 自動検証
  │                         │         ├── Layer 2 (24-72h): Watchtower
  │                         │         └── Layer 3 (72h-7d): 公開Challenge
  │                         │                                      │
  │                         │                                [Challenge無し]
  │                         │                                      │
  │◄──(3) Release 100 ETH─────────────────────────────────────────│
```

### 4.4 Dispute Path（不正検知時）

```
Challenger                  L1 Vault                        Defender
     │                          │                               │
     │──(1) Challenge───────────►│                              │
     │  {                        │                              │
     │    unlock_id,             │                              │
     │    fraud_proof,           │                              │
     │    bond: 0.1 ETH          │                              │
     │  }                        │                              │
     │                           │                              │
     │                     ┌─────┴─────┐                        │
     │                     │ Challenge │                        │
     │                     │ 登録      │                        │
     │                     └─────┬─────┘                        │
     │                           │                              │
     │                           │──(2) Defend Request─────────►│
     │                           │                              │
     │                           │                        ┌─────┴─────┐
     │                           │                        │ Defense   │
     │                           │                        │ 提出      │
     │                           │                        │ bond:1ETH │
     │                           │                        └─────┬─────┘
     │                           │                              │
     │                           │◄──(3) Defense Proof──────────│
     │                           │  {Dilithium検証ログ,        │
     │                           │   SMT_proof}                 │
     │                           │                              │
     │                     ┌─────┴─────┐                        │
     │                     │ SHA3-256  │                        │
     │                     │ 検証      │                        │
     │                     │           │                        │
     │                     │ 勝者判定  │                        │
     │                     └─────┬─────┘                        │
     │                           │                              │
     │  [Defender勝利の場合]     │                              │
     │◄──(4a) Bond没収──────────│                              │
     │                           │──(4a) Release──────────────►User
     │                           │                              │
     │  [Challenger勝利の場合]   │                              │
     │◄──(4b) 報酬(1%)+Bond─────│                              │
     │                           │  [Unlock取消]                │
```

---

## 5. データ構造

### 5.1 Lock Data

```json
{
  "lock_id": "bytes32",
  "chain_id": "uint256",
  "vault_address": "address",
  "pk_dilithium": "bytes[1952]",
  "asset_address": "address",
  "amount": "uint256",
  "lock_timestamp": "uint256",
  "state_root": "bytes32"
}
```

### 5.2 Unlock Data

```json
{
  "chain_id": "uint256",
  "vault_address": "address",
  "nonce": "uint256",
  "lock_id": "bytes32",
  "dest_addr": "address",
  "amount": "uint256",
  "expiry": "uint256",
  "doc_hash": "bytes32"
}
```

### 5.3 State Root計算

```
// Lock
SR_lock = SHA3-256(
  "QS_LOCK_V1" ||
  abi.encode(lock_data)
)

// Unlock
SR_unlock = SHA3-256(
  "QS_UNLOCK_V1" ||
  abi.encode(SR_prev, unlock_data)
)

// Challenge
SR_challenge = SHA3-256(
  "QS_CHAL_V1" ||
  abi.encode(SR_prev, challenge_data)
)
```

### 5.4 Sparse Merkle Tree

```
構造:
├── 深度: 20（可変、V2で拡張可能）
├── 最大エントリ: 2^20 = 1,048,576
├── キー: SHA3-256(lock_id) の先頭20bit
├── 値: lock/unlock status
└── 空ノード: SHA3-256("EMPTY")

証明サイズ: 20 × 32 bytes = 640 bytes
```

---

## 6. 性能要件

### 6.1 機能要件

| ID | 要件 | 優先度 |
|----|------|--------|
| FR-001 | Dilithium-III署名の検証 | 必須 |
| FR-002 | SHA3-256によるState Root計算 | 必須 |
| FR-003 | Sparse Merkle Treeによる状態管理 | 必須 |
| FR-004 | Watchtower 3/5署名検証（L1） | 必須 |
| FR-005 | 7日間Challenge期間（Emergency Path） | 必須 |
| FR-006 | Fraud Proof検証 | 必須 |
| FR-007 | 部分Unlock（amount指定） | 推奨 |
| FR-008 | 複数資産対応（ERC20/ERC721） | 推奨 |

### 6.2 性能要件

| ID | 要件 | 目標値 | 許容値 |
|----|------|--------|--------|
| PR-001 | L3 Dilithium検証時間 | < 100ms | < 500ms |
| PR-002 | L3 State Root計算時間 | < 50ms | < 200ms |
| PR-003 | L3 SMT更新時間 | < 100ms | < 500ms |
| PR-004 | L1 Normal Path Gas | < 50,000 | < 100,000 |
| PR-005 | L1 Emergency Path Gas | < 10,000 | < 50,000 |
| PR-006 | Normal Path所要時間 | < 10分 | < 1時間 |
| PR-007 | Emergency Path所要時間 | 7日 | 7日（固定） |
| PR-008 | L3 TPS | > 100 | > 50 |

### 6.3 セキュリティ要件

| ID | 要件 | 基準 |
|----|------|------|
| SR-001 | 量子セキュリティレベル | NIST Level 2 (128bit) |
| SR-002 | Dilithium準拠 | FIPS 204 |
| SR-003 | SHA3準拠 | FIPS 202 |
| SR-004 | Watchtower分散性 | 5社以上、3法域以上 |
| SR-005 | Challenge Bond | Challenger: 0.1 ETH, Defender: 1 ETH |
| SR-006 | Watchtower鍵ローテーション | 週次 |

### 6.4 可用性要件

| ID | 要件 | 目標値 |
|----|------|--------|
| AR-001 | L3 Uptime | 99.9% |
| AR-002 | Watchtower Uptime（各社） | 99% |
| AR-003 | L1 Contract Uptime | 100%（Ethereumに依存） |
| AR-004 | Emergency Path発動条件 | Watchtower 3/5 72時間タイムアウト |

---

## 7. WBS（Work Breakdown Structure）

```
Project Aegis
├── Phase 1: PoC (2-3週間)
│   ├── 1.1 L3基盤構築
│   │   ├── 1.1.1 Cosmos SDK セットアップ
│   │   ├── 1.1.2 Dilithiumモジュール統合
│   │   └── 1.1.3 State管理モジュール
│   ├── 1.2 暗号実装
│   │   ├── 1.2.1 SHA3-256 State Root計算
│   │   ├── 1.2.2 ドメインセパレーション実装
│   │   └── 1.2.3 Sparse Merkle Tree実装
│   ├── 1.3 L1 Contract
│   │   ├── 1.3.1 Vault Contract骨格
│   │   ├── 1.3.2 SHA3-256検証
│   │   ├── 1.3.3 SMT検証
│   │   └── 1.3.4 Watchtower署名検証
│   └── 1.4 E2Eテスト
│       ├── 1.4.1 Lock/Unlockフロー
│       └── 1.4.2 単体テスト
│
├── Phase 2: Testnet (1-2ヶ月)
│   ├── 2.1 Validator構築
│   │   ├── 2.1.1 5 Validator構成
│   │   └── 2.1.2 BFTコンセンサス設定
│   ├── 2.2 Watchtower
│   │   ├── 2.2.1 Watchtower選定（5社）
│   │   ├── 2.2.2 ECDSA署名サービス
│   │   └── 2.2.3 監視ダッシュボード
│   ├── 2.3 Challenge System
│   │   ├── 2.3.1 Fraud Proof実装
│   │   ├── 2.3.2 Bond管理
│   │   └── 2.3.3 3層チャレンジ
│   ├── 2.4 Public Testnet
│   │   ├── 2.4.1 Testnet公開
│   │   └── 2.4.2 バグバウンティ開始
│   └── 2.5 セキュリティ監査
│       └── 2.5.1 外部監査（Trail of Bits等）
│
└── Phase 3: Mainnet (1ヶ月)
    ├── 3.1 Mainnet準備
    │   ├── 3.1.1 Contract Deploy
    │   └── 3.1.2 TVL制限設定（$10M）
    ├── 3.2 運用開始
    │   ├── 3.2.1 段階的TVL緩和
    │   └── 3.2.2 24/7監視
    └── 3.3 ドキュメント
        ├── 3.3.1 技術ドキュメント
        └── 3.3.2 ユーザーガイド
```

---

## 8. タスク表

### Phase 1: PoC (2024/12/21 - 2025/01/10)

| ID | タスク | 担当Agent | 開始 | 終了 | 状態 | 依存 |
|----|--------|-----------|------|------|------|------|
| 1.1.1 | Cosmos SDK セットアップ | Engineer | 12/21 | 12/23 | 🟡 進行中 | - |
| 1.1.2 | Dilithiumモジュール統合 | Cryptographer | 12/23 | 12/26 | ⬜ 未着手 | 1.1.1 |
| 1.1.3 | State管理モジュール | Engineer | 12/26 | 12/28 | ⬜ 未着手 | 1.1.1 |
| 1.2.1 | SHA3-256 State Root計算 | Cryptographer | 12/23 | 12/25 | ⬜ 未着手 | - |
| 1.2.2 | ドメインセパレーション実装 | Cryptographer | 12/25 | 12/26 | ⬜ 未着手 | 1.2.1 |
| 1.2.3 | Sparse Merkle Tree実装 | Engineer | 12/26 | 12/30 | ⬜ 未着手 | 1.2.1 |
| 1.3.1 | Vault Contract骨格 | Engineer | 12/28 | 12/30 | ⬜ 未着手 | - |
| 1.3.2 | SHA3-256検証 | Engineer | 12/30 | 12/31 | ⬜ 未着手 | 1.3.1 |
| 1.3.3 | SMT検証 | Engineer | 12/31 | 01/03 | ⬜ 未着手 | 1.2.3, 1.3.1 |
| 1.3.4 | Watchtower署名検証 | Engineer | 01/03 | 01/05 | ⬜ 未着手 | 1.3.1 |
| 1.4.1 | Lock/Unlockフローテスト | QA | 01/05 | 01/08 | ⬜ 未着手 | 1.3.4 |
| 1.4.2 | 単体テスト | QA | 01/08 | 01/10 | ⬜ 未着手 | 1.4.1 |

### Phase 2: Testnet (2025/01/10 - 2025/02/10)

| ID | タスク | 担当Agent | 開始 | 終了 | 状態 | 依存 |
|----|--------|-----------|------|------|------|------|
| 2.1.1 | 5 Validator構成 | DevOps | 01/10 | 01/15 | ⬜ 未着手 | Phase 1 |
| 2.1.2 | BFTコンセンサス設定 | DevOps | 01/15 | 01/17 | ⬜ 未着手 | 2.1.1 |
| 2.2.1 | Watchtower選定 | CBO | 01/10 | 01/20 | ⬜ 未着手 | - |
| 2.2.2 | ECDSA署名サービス | Engineer | 01/17 | 01/24 | ⬜ 未着手 | 2.1.2 |
| 2.2.3 | 監視ダッシュボード | Engineer | 01/24 | 01/28 | ⬜ 未着手 | 2.2.2 |
| 2.3.1 | Fraud Proof実装 | Cryptographer | 01/20 | 01/27 | ⬜ 未着手 | Phase 1 |
| 2.3.2 | Bond管理 | Engineer | 01/27 | 01/30 | ⬜ 未着手 | 2.3.1 |
| 2.3.3 | 3層チャレンジ | CSO | 01/30 | 02/03 | ⬜ 未着手 | 2.3.2 |
| 2.4.1 | Testnet公開 | DevOps | 02/03 | 02/05 | ⬜ 未着手 | 2.3.3 |
| 2.4.2 | バグバウンティ開始 | CSO | 02/05 | 02/10 | ⬜ 未着手 | 2.4.1 |
| 2.5.1 | 外部監査 | CSO | 02/01 | 02/10 | ⬜ 未着手 | 2.3.3 |

### Phase 3: Mainnet (2025/02/10 - 2025/02/28)

| ID | タスク | 担当Agent | 開始 | 終了 | 状態 | 依存 |
|----|--------|-----------|------|------|------|------|
| 3.1.1 | Contract Deploy | DevOps | 02/10 | 02/12 | ⬜ 未着手 | Phase 2 |
| 3.1.2 | TVL制限設定 | CFO | 02/12 | 02/13 | ⬜ 未着手 | 3.1.1 |
| 3.2.1 | 段階的TVL緩和 | CFO | 02/13 | 02/28 | ⬜ 未着手 | 3.1.2 |
| 3.2.2 | 24/7監視 | DevOps | 02/13 | 02/28 | ⬜ 未着手 | 3.1.2 |
| 3.3.1 | 技術ドキュメント | Researcher | 02/15 | 02/25 | ⬜ 未着手 | 3.1.1 |
| 3.3.2 | ユーザーガイド | CBO | 02/20 | 02/28 | ⬜ 未着手 | 3.3.1 |

---

## 9. リスク管理

| リスク | 影響度 | 発生確率 | 対策 | オーナー |
|--------|--------|----------|------|----------|
| Watchtower結託 | 高 | 低 | 3法域分散、スラッシング | CSO |
| ECDSA量子攻撃 | 高 | 低（10年以内） | 週次ローテーション、移行計画 | Cryptographer |
| L3ダウンタイム | 中 | 中 | 冗長化、Emergency Path | DevOps |
| Gas価格高騰 | 中 | 中 | バッチ処理オプション | CFO |
| 監査指摘 | 中 | 高 | 早期監査、修正バッファ | CSO |
| 開発遅延 | 中 | 中 | 週次レビュー、スコープ調整 | CTO |

---

## 10. コスト見積もり

### 開発コスト

| 項目 | 見積もり |
|------|---------|
| Phase 1 PoC | $30,000 |
| Phase 2 Testnet | $100,000 |
| Phase 3 Mainnet | $50,000 |
| セキュリティ監査 | $100,000 |
| バグバウンティ | $500,000 |
| **合計** | **$780,000** |

### 運用コスト（月額）

| 項目 | 見積もり |
|------|---------|
| L3 Validator (5台) | $2,500 |
| Watchtower (5社) | $2,500 |
| 監視・運用 | $1,000 |
| **合計** | **$6,000/月** |

### 収益予測（TVL $100M時）

| 項目 | 見積もり |
|------|---------|
| Unlock手数料 (0.05%) | $50,000/年 |
| 緊急Unlock手数料 (0.5%) | $50,000/年 |
| **合計** | **$100,000/年** |

---

## 11. 承認履歴

| 日付 | 承認者 | 内容 |
|------|--------|------|
| 2024/12/21 | CEO (Kota) | SHA3-256採用 |
| 2024/12/21 | CEO (Kota) | ハイブリッドRelease方式 |
| 2024/12/21 | CEO (Kota) | ドメインセパレーション |
| 2024/12/21 | CEO (Kota) | 3層チャレンジ |
| 2024/12/21 | CEO (Kota) | SMT採用 |
| 2024/12/21 | CEO (Kota) | Project Aegis開始 |

---

## 12. 参照ドキュメント

| ドキュメント | 場所 |
|-------------|------|
| NIST FIPS 204 (Dilithium) | https://csrc.nist.gov/pubs/fips/204/final |
| NIST FIPS 202 (SHA-3) | https://csrc.nist.gov/pubs/fips/202/final |
| Sparse Merkle Tree | https://eprint.iacr.org/2016/683 |
| 会議議事録 | meetings/2024-12-21-L3-*.md |
| インセンティブシステム | agents/INCENTIVE_SYSTEM.md |

---

**Project Aegis - 量子時代の盾となる**

---

*Document Version: 1.0*
*Last Updated: 2024-12-21*
*Author: 11 Agent Team*
*Approved by: CEO (Kota)*
