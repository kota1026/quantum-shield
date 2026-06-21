# 06 データ設計

> **対応Agent**: 02_spec.md, 03_impl.md

---

# Part 1: データ保存先マッピング

## 1.1 保存先別データ分類

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          データ保存先マッピング                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │                            L1 (Ethereum)                                │    │
│  │                                                                         │    │
│  │  • 公開鍵（Dilithium, SPHINCS+）                                       │    │
│  │  • Stake状態                                                           │    │
│  │  • Lock/Unlock最終状態                                                 │    │
│  │  • veQSロック情報                                                      │    │
│  │  • Delegation関係                                                      │    │
│  │  • 投票記録                                                            │    │
│  │  • Challenge結果                                                       │    │
│  │  • Slashing記録                                                        │    │
│  │                                                                         │    │
│  │  特徴: 不変、透明、検証可能（CP-5準拠）                                │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │                            L3 (Aegis)                                   │    │
│  │                                                                         │    │
│  │  • State Root（全Lock状態のSMT Root）                                  │    │
│  │  • 署名キュー                                                          │    │
│  │  • 署名履歴                                                            │    │
│  │  • Unlock進捗                                                          │    │
│  │  • STARK証明                                                           │    │
│  │                                                                         │    │
│  │  特徴: 高速処理、量子耐性署名                                          │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │                            DB (PostgreSQL)                              │    │
│  │                                                                         │    │
│  │  • ユーザー設定（通知等）                                              │    │
│  │  • Prover企業情報（暗号化）                                            │    │
│  │  • 審査ワークフロー                                                    │    │
│  │  • Enterprise契約情報（暗号化）                                        │    │
│  │  • Enterprise APIキー（ハッシュ化）                                    │    │
│  │  • Enterprise請求情報                                                  │    │
│  │  • QSスタッフ情報                                                      │    │
│  │  • 操作ログ                                                            │    │
│  │  • サポートチケット                                                    │    │
│  │  • セッション情報                                                      │    │
│  │  • 通知                                                                │    │
│  │                                                                         │    │
│  │  特徴: プライバシー保護、柔軟なクエリ                                  │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │                         IPFS / Arweave                                  │    │
│  │                                                                         │    │
│  │  • Delegate プロフィール                                               │    │
│  │  • Proposal本文                                                        │    │
│  │  • Challenge証拠（ログ等）                                             │    │
│  │  • Defense証拠                                                         │    │
│  │                                                                         │    │
│  │  特徴: 分散保存、永続性                                                │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │                      Client Side (ブラウザ)                             │    │
│  │                                                                         │    │
│  │  • Dilithium秘密鍵（IndexedDB暗号化 or WebAuthn）                      │    │
│  │  • セッション情報                                                      │    │
│  │  • キャッシュ                                                          │    │
│  │                                                                         │    │
│  │  特徴: Self-Custody（CP-2準拠）、サーバー送信禁止                      │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# Part 2: ジャーニー別必要データ

## 2.1 End User

| ジャーニーフェーズ | 必要データ | 保存先 | 理由 |
|------------------|-----------|--------|------|
| 登録 | Dilithium公開鍵 | L1 + L3 | 署名検証に必須 |
| 登録 | Dilithium秘密鍵 | ブラウザ内のみ | セキュリティ（CP-2） |
| 登録 | ユーザーID（アドレス） | L1 | オンチェーン識別 |
| Lock | Lock情報（金額、日時） | L1 + L3 | 状態管理 |
| Unlock | Unlock進捗 | L3 → L1 | 状態追跡 |
| 継続利用 | 通知設定 | DB | ユーザー設定 |
| 退会 | 退会フラグ | DB | 状態管理（鍵はL1に残る） |

## 2.2 Prover

| ジャーニーフェーズ | 必要データ | 保存先 | 理由 |
|------------------|-----------|--------|------|
| 申請 | 企業情報（名称、住所等） | DB（暗号化） | プライバシー保護 |
| 申請 | 技術証明（HSM証明書） | DB（暗号化） | 審査用 |
| 審査 | 審査ステータス | DB | ワークフロー管理 |
| 参加 | SPHINCS+公開鍵 | L1 + L3 | 署名検証に必須 |
| 参加 | Stake金額・状態 | L1 | 経済的インセンティブ |
| 運用 | 署名履歴 | L3 | パフォーマンス追跡 |
| 運用 | 報酬残高 | L1 | 経済的インセンティブ |
| Challenge | Defense証拠 | L1 + IPFS | 検証可能性（CP-5） |
| 退出 | Unbonding状態 | L1 | 状態管理 |

## 2.3 Observer/Challenger

| ジャーニーフェーズ | 必要データ | 保存先 | 理由 |
|------------------|-----------|--------|------|
| 登録 | Stake金額 | L1 | Permissionless参加 |
| 監視 | 監視対象設定 | DB | ユーザー設定 |
| Challenge | Challenge証拠 | L1 + IPFS | 検証可能性（CP-5） |
| Challenge | Challenge結果 | L1 | 透明性（CP-5） |
| 報酬 | 報酬残高 | L1 | 経済的インセンティブ |

## 2.4 Token Holder / Delegate

| ジャーニーフェーズ | 必要データ | 保存先 | 理由 |
|------------------|-----------|--------|------|
| veQS Lock | ロック情報（金額、期間） | L1 | 投票力計算 |
| Delegation | 委任関係 | L1 | 投票力移譲 |
| Delegate登録 | プロフィール | IPFS + DB | メタデータ |
| 投票 | 投票記録 | L1 | 透明性（CP-5） |

## 2.5 Service Provider（Enterprise）

| ジャーニーフェーズ | 必要データ | 保存先 | 理由 |
|------------------|-----------|--------|------|
| 問い合わせ | 問い合わせ内容 | DB | CRM |
| 契約 | 契約情報 | DB（暗号化） | ビジネス |
| オンボーディング | ユーザー一覧 | DB | アクセス管理 |
| 運用 | TX履歴（自社分） | L1 + DB | 監査証跡 |
| 運用 | API使用量 | DB | 課金 |
| 請求 | 請求履歴 | DB | ビジネス |

## 2.6 QS Staff

| ジャーニーフェーズ | 必要データ | 保存先 | 理由 |
|------------------|-----------|--------|------|
| 入社 | スタッフ情報 | DB | アクセス管理 |
| 権限取得 | 権限情報 | DB | アクセス制御 |
| 運用 | 操作ログ | DB + SIEM | 監査 |
| 退社 | 退社フラグ | DB | アクセス無効化 |

---

# Part 3: DBスキーマ

## 3.1 ユーザー管理

```sql
-- End User（主にL1/L3でオンチェーン管理、DBは補助）
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address VARCHAR(42) NOT NULL UNIQUE,
    dilithium_public_key TEXT,
    notification_email VARCHAR(255),
    notification_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- セッション管理
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    token_hash VARCHAR(64) NOT NULL,
    device_info JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

## 3.2 veQS・委任

```sql
-- veQSロック（L1とのキャッシュ/ミラー）
CREATE TABLE veqs_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address VARCHAR(42) NOT NULL,
    amount NUMERIC(78, 0) NOT NULL,
    lock_end TIMESTAMP WITH TIME ZONE NOT NULL,
    voting_power NUMERIC(78, 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unlocked_at TIMESTAMP WITH TIME ZONE
);

-- 委任関係（L1とのキャッシュ/ミラー）
CREATE TABLE delegations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delegator_address VARCHAR(42) NOT NULL,
    delegate_address VARCHAR(42) NOT NULL,
    amount NUMERIC(78, 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- Delegate情報
CREATE TABLE delegates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address VARCHAR(42) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    avatar_url VARCHAR(500),
    ipfs_hash VARCHAR(66),
    twitter_handle VARCHAR(50),
    website_url VARCHAR(500),
    total_delegated NUMERIC(78, 0) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_delegates_total ON delegates(total_delegated DESC);
```

## 3.3 Prover・Observer

```sql
-- Prover申請
CREATE TABLE prover_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_address VARCHAR(42) NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    company_info_encrypted BYTEA,
    hsm_attestation TEXT,
    infrastructure_info JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_prover_apps_status ON prover_applications(status);

-- Observer
CREATE TABLE observers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address VARCHAR(42) NOT NULL UNIQUE,
    stake_amount NUMERIC(78, 0) NOT NULL,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exited_at TIMESTAMP WITH TIME ZONE
);

-- Challenge
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenger_address VARCHAR(42) NOT NULL,
    unlock_id VARCHAR(66) NOT NULL,
    evidence_ipfs_hash VARCHAR(66),
    bond_amount NUMERIC(78, 0) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    result TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_challenges_status ON challenges(status);
```

## 3.4 Enterprise

```sql
-- Enterprise顧客
CREATE TABLE enterprise_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(200) NOT NULL,
    contract_info_encrypted BYTEA,
    api_quota INTEGER DEFAULT 10000,
    api_used INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enterpriseユーザー
CREATE TABLE enterprise_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES enterprise_customers(id),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'viewer',
    two_factor_secret_encrypted BYTEA,
    webauthn_credentials JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_enterprise_users_customer ON enterprise_users(customer_id);
CREATE INDEX idx_enterprise_users_email ON enterprise_users(email);

-- Enterprise APIキー
CREATE TABLE enterprise_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES enterprise_customers(id),
    key_hash VARCHAR(64) NOT NULL,
    name VARCHAR(100),
    permissions JSONB DEFAULT '[]',
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_api_keys_hash ON enterprise_api_keys(key_hash);
```

## 3.5 QS Admin

```sql
-- QSスタッフ
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'viewer',
    two_factor_secret_encrypted BYTEA,
    webauthn_credentials JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 操作ログ（監査用）
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_type VARCHAR(20) NOT NULL,
    actor_id UUID,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_type, actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- 通知
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_type VARCHAR(20) NOT NULL,
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    data JSONB,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_type, user_id, read_at);
```

---

# Part 4: セキュリティ考慮

## 4.1 暗号化

| データ種別 | 暗号化方式 | 鍵管理 |
|-----------|----------|--------|
| Prover企業情報 | AES-256-GCM | AWS KMS / Vault |
| Enterprise契約情報 | AES-256-GCM | AWS KMS / Vault |
| TOTPシークレット | AES-256-GCM | AWS KMS / Vault |
| パスワード | Argon2id | - |
| APIキー | SHA-256ハッシュ | - |

## 4.2 アクセス制御

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          アクセス制御マトリックス                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  テーブル              │ End User │ Prover │ Enterprise │ QS Admin │           │
│  ──────────────────────┼──────────┼────────┼────────────┼──────────┤           │
│  users                 │ Own only │ -      │ -          │ Read     │           │
│  sessions              │ Own only │ Own    │ Own        │ Read     │           │
│  veqs_locks            │ Own only │ -      │ -          │ Read     │           │
│  delegations           │ Own only │ -      │ -          │ Read     │           │
│  delegates             │ Read     │ Read   │ -          │ CRUD     │           │
│  prover_applications   │ -        │ Own    │ -          │ CRUD     │           │
│  observers             │ -        │ -      │ -          │ Read     │           │
│  challenges            │ Read     │ Own    │ -          │ CRUD     │           │
│  enterprise_customers  │ -        │ -      │ Own        │ CRUD     │           │
│  enterprise_users      │ -        │ -      │ Own Org    │ CRUD     │           │
│  enterprise_api_keys   │ -        │ -      │ Own Org    │ Read     │           │
│  staff                 │ -        │ -      │ -          │ CRUD*    │           │
│  audit_logs            │ -        │ -      │ Own Org    │ Read     │           │
│  notifications         │ Own only │ Own    │ Own        │ Read     │           │
│                                                                                 │
│  * Super Admin のみ                                                             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 4.3 データ保持期間

| データ種別 | 保持期間 | 根拠 |
|-----------|---------|------|
| 操作ログ | 7年 | 監査要件 |
| セッション | 30日 | セキュリティ |
| 通知 | 1年 | ユーザビリティ |
| Challenge証拠 | 永久（IPFS） | 検証可能性（CP-5） |
| 契約情報 | 契約終了後5年 | 法的要件 |

---

# Part 5: L1/L3データ構造

## 5.1 L1 State（概要）

```solidity
// QSVault.sol
mapping(address => bytes) public dilithiumKeys;
mapping(bytes32 => Lock) public locks;
mapping(bytes32 => Unlock) public unlocks;

// QSStaking.sol
mapping(address => uint256) public proverStakes;
mapping(address => uint256) public observerStakes;

// QSGovernance.sol
mapping(address => VeQSLock) public veqsLocks;
mapping(address => address) public delegations;
mapping(uint256 => Proposal) public proposals;
mapping(uint256 => mapping(address => Vote)) public votes;
```

## 5.2 L3 State（概要）

```
L3 Aegis State
├── State Root (SMT Root)
│   └── All Lock states compressed
├── Signature Queue
│   └── Pending signature requests
├── Signature History
│   └── Completed signatures
└── STARK Proofs
    └── Verification proofs
```

---

**END OF DATA DESIGN**
