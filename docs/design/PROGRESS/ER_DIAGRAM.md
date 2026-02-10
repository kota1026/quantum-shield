# Quantum Shield - ER Diagram v2.0

> **Document Version**: 2.0
> **Last Updated**: 2026-01-26
> **Aligned With**: SEQUENCES.md v2.0

---

## Overview

このドキュメントは **SEQUENCES.md** のトランザクションフローと **UI コンポーネント**から抽出したデータモデルを統合した ER 図です。

### 対象システム
- Consumer App (19画面)
- QS Hub / Token Hub (10画面)
- Governance (6画面)
- Prover Portal (11画面)
- Observer (7画面)
- Explorer (8画面)

### エンティティ数: 47

---

## v1.0 → v2.0 主要変更点

| 変更 | 内容 |
|------|------|
| **追加: UnlockProverSignature** | Unlock時の2-of-5 SPHINCS+署名を記録 |
| **追加: VRFRequest** | Chainlink VRFによるProver選出を記録 |
| **追加: StateRoot** | SR_0, SR_1 の計算・追跡 |
| **追加: SMTProof** | Sparse Merkle Tree証明 |
| **追加: EmergencyPause** | Sequence#8 緊急停止対応 |
| **追加: InsuranceFund** | スラッシング20%の受け皿 |
| **追加: MonitoringBot/Alert** | 24h監視システム |
| **追加: UserSettings** | 設定画面のデータ永続化 |
| **追加: SystemSettings** | Admin設定画面対応 |
| **修正: Challenge/Slashing** | SEQUENCES.md準拠の詳細化 |

---

## Entity Categories

| Category | Entities | Count |
|----------|----------|:-----:|
| Core User | User, UserSettings, UserDilithiumKey | 3 |
| Lock/Unlock | Lock, UnlockRequest, StateRoot, SMTProof | 4 |
| Prover Signing | Prover, UnlockProverSignature, VRFRequest, ProverApplication | 4 |
| Challenge/Slashing | Challenge, Slashing, SlashingProver, SlashingDistribution, Alert | 5 |
| Token/veQS | VeQSLock, QSToken, Delegation, Reward, Epoch, RewardBreakdown | 6 |
| Governance | Proposal, Vote, CouncilMember, ProposalAction | 4 |
| Emergency | EmergencyPause, EmergencyVote, InsuranceFund, InsuranceFundTx | 4 |
| Monitoring | MonitoringBot, MonitoringLog | 2 |
| System | SystemSettings, AuditLog, Transaction | 3 |
| L3/External | L3AegisNode, ChainlinkVRF, L1Vault | 3 |
| History (View) | LockHistory, UnlockHistory, RewardHistory, VoteHistory | 4 |
| Prover Ops | ProverStake, ProverMetrics, ProverExit, SigningQueue | 4 |
| Enterprise | EnterpriseContract, EnterpriseInvitation | 2 |
| **Total** | | **47** |

---

## ER Diagram (Mermaid)

```mermaid
erDiagram
    %% ========================================
    %% Core User Domain
    %% ========================================

    User {
        string wallet_address PK
        bytes pk_dilithium "Dilithium public key"
        timestamp created_at
        timestamp last_active
    }

    UserSettings {
        string wallet_address PK_FK
        string email
        string language "ja or en"
        boolean notification_email
        boolean notification_browser
        boolean notification_proposal_updates
        boolean notification_reward_alerts
        boolean notification_delegation_changes
        boolean two_factor_enabled
        timestamp updated_at
    }

    UserDilithiumKey {
        string key_id PK
        string wallet_address FK
        bytes pk_dilithium
        boolean is_active
        timestamp registered_at
        timestamp revoked_at
    }

    User ||--|| UserSettings : "has"
    User ||--|{ UserDilithiumKey : "owns"

    %% ========================================
    %% Lock Domain (Sequence #1)
    %% ========================================

    Lock {
        bytes32 lock_id PK
        string wallet_address FK
        uint256 chain_id "destination chain"
        address asset "ERC20 contract"
        uint256 amount
        bytes dest_addr
        uint256 expiry
        uint256 nonce
        bytes pk_dilithium
        bytes sig_dilithium
        bytes32 sr_0 FK "State Root at lock"
        bytes smt_proof
        string status "pending confirmed synced"
        bytes32 l1_tx_hash
        timestamp created_at
        timestamp confirmed_at
    }

    StateRoot {
        bytes32 sr_id PK
        string type "QS_LOCK_V1 or QS_UNLOCK_V1"
        bytes32 previous_sr "SR_0 for SR_1"
        bytes32 lock_id FK
        bytes input_data "SHA3-256 input"
        timestamp computed_at
    }

    SMTProof {
        string proof_id PK
        bytes32 lock_id FK
        bytes proof_data
        bytes32 root
        boolean verified
        timestamp created_at
    }

    User ||--|{ Lock : "creates"
    Lock ||--|| StateRoot : "has SR_0"
    Lock ||--o| SMTProof : "has"

    %% ========================================
    %% Unlock Domain (Sequence #2, #3)
    %% ========================================

    UnlockRequest {
        string unlock_id PK
        bytes32 lock_id FK
        string wallet_address FK
        uint256 chain_id
        bytes dest_addr
        uint256 amount
        uint256 expiry
        uint256 nonce
        bytes sig_dilithium
        bytes32 sr_0 FK "from Lock"
        bytes32 sr_1 FK "computed"
        bytes smt_proof
        string status "pending vrf_pending prover_signing submitted time_lock claimable released cancelled"
        boolean is_emergency "false=24h true=7d"
        uint256 bond_amount "Emergency only"
        timestamp release_time
        timestamp created_at
        timestamp submitted_at
        timestamp released_at
    }

    VRFRequest {
        string vrf_id PK
        string unlock_id FK
        bytes32 vrf_seed
        string selected_prover_ids "2 of 5 JSON array"
        string prover_weights "stake-based JSON"
        timestamp requested_at
        timestamp completed_at
    }

    UnlockProverSignature {
        string signature_id PK
        string unlock_id FK
        string prover_id FK
        bytes sig_sphincs "8KB SPHINCS+ signature"
        bytes32 sr_0
        bytes32 sr_1
        boolean is_valid
        timestamp signed_at
    }

    Lock ||--o{ UnlockRequest : "unlocked_by"
    UnlockRequest ||--|| StateRoot : "has SR_1"
    UnlockRequest ||--|| VRFRequest : "has"
    UnlockRequest ||--|{ UnlockProverSignature : "requires 2-of-5"
    User ||--|{ UnlockRequest : "creates"

    %% ========================================
    %% Prover Domain (Sequence #5, #6)
    %% ========================================

    Prover {
        string prover_id PK
        address operator_addr
        bytes sphincs_pubkey "SPHINCS+ public key"
        uint256 stake_amount "400K+ ETH or QS"
        bytes hsm_attestation
        bytes multisig_proof "2-of-3 required"
        bytes legal_signature
        string status "pending active unbonding exited slashed"
        string prover_type "public or enterprise"
        timestamp registration_date
        timestamp approval_date
        timestamp exit_request_date
        timestamp unbonding_end_date "7 days after exit"
        uint256 total_signatures
        uint256 successful_signatures
        decimal uptime_percentage
    }

    ProverApplication {
        string application_id PK
        address operator_addr
        bytes sphincs_pubkey
        uint256 proposed_stake
        bytes hsm_attestation
        bytes multisig_proof
        bytes legal_signature
        string status "submitted review approved rejected"
        string rejection_reason
        timestamp submitted_at
        timestamp reviewed_at
    }

    ProverStake {
        string stake_id PK
        string prover_id FK
        uint256 amount
        uint256 usd_value
        string status "safe at_risk slashed"
        int active_challenges
        timestamp last_updated
    }

    ProverMetrics {
        string prover_id PK_FK
        decimal uptime "percent"
        int total_signatures
        decimal avg_latency_ms
        int violations
        decimal sla_compliance
        timestamp last_updated
    }

    Prover ||--|{ UnlockProverSignature : "provides"
    ProverApplication ||--o| Prover : "becomes"
    Prover ||--|| ProverStake : "has"
    Prover ||--|| ProverMetrics : "has"

    %% ========================================
    %% Challenge Domain (Sequence #4)
    %% ========================================

    Challenge {
        string challenge_id PK
        string unlock_id FK
        address challenger_address
        bytes evidence
        uint256 bond_amount "MAX 0.1ETH or amount*1%"
        string status "open defense_pending challenger_won challenger_lost"
        timestamp defense_deadline "48h from creation"
        timestamp created_at
        timestamp resolved_at
    }

    Slashing {
        string slashing_id PK
        string challenge_id FK
        uint256 simultaneous_count "N in N^2 * 10%"
        decimal slash_rate "N^2 * 10% max 100%"
        uint256 total_slash_amount
        timestamp executed_at
    }

    SlashingProver {
        string id PK
        string slashing_id FK
        string prover_id FK
        uint256 slash_amount
    }

    SlashingDistribution {
        string distribution_id PK
        string slashing_id FK
        uint256 challenger_amount "60%"
        uint256 insurance_amount "20%"
        uint256 burn_amount "20%"
        address challenger_address
        boolean challenger_claimed
        timestamp distributed_at
    }

    Alert {
        string alert_id PK
        string unlock_id FK
        string bot_id FK
        string severity "low medium high critical"
        string alert_type "dilithium_mismatch state_invalid timeout"
        bytes evidence
        timestamp sent_at
        timestamp acknowledged_at
    }

    UnlockRequest ||--o{ Challenge : "challenged_by"
    Challenge ||--o| Slashing : "results_in"
    Slashing ||--|{ SlashingProver : "affects"
    Slashing ||--|| SlashingDistribution : "has"
    Prover ||--o{ SlashingProver : "slashed_in"
    Alert ||--o| Challenge : "triggers"

    %% ========================================
    %% Token Domain (Token Hub / QS Hub)
    %% ========================================

    VeQSLock {
        string lock_id PK
        string wallet_address FK
        uint256 qs_amount
        string lock_duration "1W 1M 3M 6M 1Y 2Y 4Y"
        decimal multiplier "0.005x to 1.0x"
        uint256 veqs_amount "qs_amount * multiplier"
        timestamp lock_date
        timestamp unlock_date
        string status "active expired withdrawn"
    }

    Delegation {
        string delegation_id PK
        string from_address FK
        string to_address FK
        uint256 veqs_amount
        string status "active revoked"
        timestamp delegated_at
        timestamp revoked_at
    }

    Epoch {
        uint256 epoch_number PK
        timestamp start_time
        timestamp end_time
        uint256 total_rewards_distributed
        uint256 total_veqs_participating
    }

    Reward {
        string reward_id PK
        string wallet_address FK
        uint256 epoch FK
        string reward_type "holding voting delegation challenger"
        uint256 amount
        string source "protocol_fees slashing staking"
        boolean claimed
        timestamp claimable_at
        timestamp claimed_at
    }

    RewardBreakdown {
        string id PK
        string reward_id FK
        string category "holding voting delegation"
        uint256 amount
    }

    User ||--|{ VeQSLock : "creates"
    User ||--|{ Delegation : "delegates"
    User ||--|{ Reward : "earns"
    VeQSLock ||--o{ Delegation : "delegated_from"
    Epoch ||--|{ Reward : "distributes"
    Reward ||--|{ RewardBreakdown : "breaks_into"

    %% ========================================
    %% Governance Domain (Sequence #7)
    %% ========================================

    Proposal {
        string proposal_id PK
        address proposer_address FK
        string title
        text description
        string proposal_type "parameter_change upgrade council_change immutable_change"
        decimal quorum_required "4 8 15 30 percent"
        uint256 bond_amount "1 ETH"
        string status "draft discussion voting time_lock executed rejected vetoed"
        uint256 snapshot_block
        uint256 for_votes
        uint256 against_votes
        boolean quorum_met
        timestamp discussion_start
        timestamp discussion_end "7 days"
        timestamp voting_start
        timestamp voting_end "7 days"
        timestamp time_lock_end "7 days"
        timestamp executed_at
    }

    ProposalAction {
        string action_id PK
        string proposal_id FK
        uint256 sequence
        address target_contract
        bytes calldata_bytes
        string description
    }

    Vote {
        string vote_id PK
        string proposal_id FK
        string wallet_address FK
        uint256 veqs_weight
        string vote "for against"
        timestamp voted_at
    }

    CouncilMember {
        string member_id PK
        address wallet_address
        string council_type "purpose security"
        string status "active removed"
        timestamp added_at
        timestamp removed_at
    }

    User ||--|{ Proposal : "creates"
    User ||--|{ Vote : "casts"
    Proposal ||--|{ ProposalAction : "contains"
    Proposal ||--|{ Vote : "receives"
    CouncilMember ||--o{ Proposal : "reviews"

    %% ========================================
    %% Emergency Domain (Sequence #8)
    %% ========================================

    EmergencyPause {
        string pause_id PK
        string reason
        string scope "all lock unlock"
        string council_signatures "5/9 Security Council JSON"
        string status "active extended resolved"
        timestamp started_at
        timestamp expires_at "72h max"
        string resolution_type "fix extension unpause"
        timestamp resolved_at
    }

    EmergencyVote {
        string vote_id PK
        string pause_id FK
        string vote_type "fix extend unpause"
        uint256 for_votes
        uint256 against_votes
        timestamp voting_end "48h"
        boolean passed
    }

    InsuranceFund {
        string fund_id PK "singleton"
        uint256 balance
        timestamp last_updated
    }

    InsuranceFundTransaction {
        string tx_id PK
        string fund_id FK
        string tx_type "deposit withdrawal slashing_receipt"
        uint256 amount
        string source_id "slashing_id or other"
        timestamp created_at
    }

    EmergencyPause ||--|{ EmergencyVote : "triggers"
    InsuranceFund ||--|{ InsuranceFundTransaction : "has"
    SlashingDistribution ||--o| InsuranceFundTransaction : "creates"

    %% ========================================
    %% Monitoring Domain
    %% ========================================

    MonitoringBot {
        string bot_id PK
        string name
        string status "active paused offline"
        timestamp last_heartbeat
        uint256 alerts_sent_total
    }

    MonitoringLog {
        string log_id PK
        string bot_id FK
        string unlock_id FK
        string action "dilithium_verify state_check timeout_check"
        boolean result
        text details
        timestamp created_at
    }

    MonitoringBot ||--|{ Alert : "sends"
    MonitoringBot ||--|{ MonitoringLog : "logs"
    UnlockRequest ||--|{ MonitoringLog : "monitored_by"

    %% ========================================
    %% System Domain
    %% ========================================

    SystemSettings {
        string setting_id PK
        string category "general notifications security maintenance"
        string key
        string value
        timestamp updated_at
        string updated_by
    }

    AuditLog {
        string log_id PK
        string actor_address
        string action
        string target_type
        string target_id
        json old_value
        json new_value
        timestamp created_at
    }

    Transaction {
        bytes32 tx_hash PK
        string chain "L1 L3"
        address from_address
        address to_address
        string tx_type "lock unlock claim stake vote challenge"
        string status "pending confirmed failed"
        uint256 gas_used
        uint256 gas_price
        uint256 block_number
        timestamp created_at
        timestamp confirmed_at
    }

    %% ========================================
    %% L3/External Domain
    %% ========================================

    L3AegisNode {
        string node_id PK
        string status "active syncing offline"
        uint256 last_block
        string bft_role "leader validator"
        timestamp last_heartbeat
    }

    ChainlinkVRF {
        string request_id PK
        bytes32 vrf_seed
        uint256 block_number
        timestamp fulfilled_at
    }

    L1Vault {
        string vault_id PK "singleton"
        uint256 total_locked
        uint256 total_unlocked
        timestamp last_updated
    }

    VRFRequest ||--|| ChainlinkVRF : "uses"
    Lock ||--o| L1Vault : "deposited_in"

    %% ========================================
    %% Enterprise Prover Domain
    %% ========================================

    EnterpriseContract {
        string contract_id PK
        string prover_id FK
        string operator_name
        string plan
        timestamp start_date
        timestamp end_date
        decimal sla_percent
        decimal guaranteed_revenue_eth
        string support_level
        boolean infrastructure_managed
    }

    EnterpriseInvitation {
        string invitation_code PK
        string operator_name
        string plan
        timestamp expires_at
        string contact_email
        boolean used
    }

    Prover ||--o| EnterpriseContract : "may_have"
    EnterpriseInvitation ||--o| ProverApplication : "used_by"
```

---

## Data Flow Alignment with SEQUENCES.md

### Sequence #1: Lock

```
User → Lock Request → L3 Aegis → SR_0 計算 → SMT 追加 → lock_id 発行
                                          ↓
                                  L1 Vault Deposit → Lock 確定
```

**Entities Involved:**
- `User`, `Lock`, `StateRoot(SR_0)`, `SMTProof`, `L1Vault`, `Transaction`

**Key Data:**
```
Lock Request: {chain_id, asset, amount, dest_addr, expiry, nonce, pk_dilithium, sig_dilithium}
SR_0 = SHA3-256("QS_LOCK_V1" || chain_id || asset || amount || dest_addr || expiry || nonce || pk_dilithium)
```

---

### Sequence #2: Unlock (Normal Path) ⚠️ 重要

```
User → Unlock Request → L3 → VRF Request → Chainlink VRF
                              ↓
                        VRF Seed → Prover 選出 (2/5) based on stake weight
                              ↓
                        Prover×2 → SPHINCS+ 署名×2 (UnlockProverSignature)
                              ↓
                        L1 Submit → 24h Time Lock → Claim → Release
                              ↓
                    [監視] MonitoringBot → MonitoringLog → Alert (if anomaly)
```

**Entities Involved:**
- `User`, `UnlockRequest`, `VRFRequest`, `ChainlinkVRF`
- `Prover`, `UnlockProverSignature` (⚠️ **v1.0で欠落していた重要エンティティ**)
- `StateRoot(SR_1)`, `SMTProof`, `MonitoringBot`, `MonitoringLog`, `Alert`

**Key Data:**
```
Unlock Request: {chain_id, lock_id, dest_addr, amount, expiry, nonce, sig_dilithium}
SR_1 = SHA3-256("QS_UNLOCK_V1" || SR_0 || lock_id || dest_addr || amount || nonce)
```

**Prover Selection (VRF):**
- P(i) = Stake_i / Σ Stake (stake-weighted probability)
- 2-of-5 required for valid unlock

---

### Sequence #3: Unlock (Emergency Path)

```
User → Unlock Request → L3 → [72h timeout] → Emergency Mode
                              ↓
                        Emergency Submit + Bond → 7d Time Lock → Claim
```

**Entities Involved:**
- `UnlockRequest(is_emergency=true)`, `bond_amount = MAX(0.5 ETH, amount × 5%)`

---

### Sequence #4: Challenge + Slashing

```
MonitoringBot → Alert → Challenger → Challenge (+ Bond)
                              ↓
                        Defense Period (48h) → 判定
                              ↓
                        Slashing (N² × 10%) → SlashingDistribution
                              ↓
                        60% Challenger, 20% InsuranceFund, 20% Burn
```

**Entities Involved:**
- `MonitoringBot`, `Alert`, `Challenge`, `Slashing`, `SlashingProver`, `SlashingDistribution`, `InsuranceFund`

**Quadratic Slashing:**
| N (同時不正数) | Slash率 | 例: $400K Stake |
|---------------|---------|-----------------|
| 1社 | 10% | $40K |
| 2社 | 40% | $160K/社 |
| 3社 | 90% | $360K/社 |
| 4社+ | 100% | 全額 |

---

### Sequence #5: Prover Registration

```
ProverApplication → 条件検証 → Governance 承認 → Prover 登録
                              ↓
                        VRF Pool 追加 → Active
```

**Required Data:**
| Field | Description |
|-------|-------------|
| sphincs_pubkey | SPHINCS+ 公開鍵 |
| hsm_attestation | HSM 証明書 |
| multisig_proof | 2-of-3 マルチシグ証明 |
| legal_signature | 法的契約署名 |
| stake_amount | $400K+ ETH/QS |

---

### Sequence #7: Governance Proposal

```
User → Proposal (+ 1 ETH Bond) → Purpose Committee 審査
                              ↓
                        Discussion (7d) → Voting (7d) → Time Lock (7d)
                              ↓
                        Security Council Veto 検討 → Execute
```

**Quorum Requirements:**
| Type | Quorum |
|------|--------|
| parameter_change | 4% |
| upgrade | 8% |
| council_change | 15% |
| immutable_change | 30% |

---

### Sequence #8: Emergency Pause

```
Security Council (5/9) → EmergencyPause → 72h Max
                              ↓
                        Token Vote (48h) → Fix/Extend/Unpause
```

**Pause Effects:**
| Function | Status |
|----------|--------|
| 新規Lock | ❌ 停止 |
| 新規Unlock | ❌ 停止 |
| 進行中Unlock | ✅ 継続 |
| Claim | ✅ 継続 |
| Challenge | ✅ 継続 |

---

## Settings Data Model

### UserSettings (Consumer/QS Hub)

| Field | Type | Source UI |
|-------|------|-----------|
| email | string | QSHubSettings.tsx |
| language | enum(ja,en) | QSHubSettings.tsx |
| notification_email | boolean | QSHubSettings.tsx |
| notification_browser | boolean | QSHubSettings.tsx |
| notification_proposal_updates | boolean | QSHubSettings.tsx |
| notification_reward_alerts | boolean | QSHubSettings.tsx |
| notification_delegation_changes | boolean | QSHubSettings.tsx |
| two_factor_enabled | boolean | QSHubSettings.tsx |

### SystemSettings (Admin)

| Category | Keys | Source UI |
|----------|------|-----------|
| general | siteName, siteUrl, supportEmail, timezone | SettingsSystem.tsx |
| notifications | emailNotifications, slackIntegration, webhookAlerts, dailyDigest | SettingsSystem.tsx |
| security | sessionTimeout, maxLoginAttempts, passwordExpiry, requireMfa, ipWhitelist | SettingsSystem.tsx |
| maintenance | maintenanceMode, scheduledMaintenance, lastBackup, backupFrequency | SettingsSystem.tsx |

---

## Key Relationships Summary

| Parent | Relationship | Child | Cardinality | Notes |
|--------|--------------|-------|-------------|-------|
| User | creates | Lock | 1:N | |
| Lock | unlocked_by | UnlockRequest | 1:N | |
| **UnlockRequest** | **requires** | **UnlockProverSignature** | **1:2** | ⚠️ **2-of-5 SPHINCS+ 必須 (v1.0欠落)** |
| UnlockRequest | has | VRFRequest | 1:1 | |
| VRFRequest | uses | ChainlinkVRF | 1:1 | |
| Prover | provides | UnlockProverSignature | 1:N | |
| Challenge | results_in | Slashing | 1:0..1 | |
| Slashing | affects | SlashingProver | 1:N | 複数Prover同時可 |
| Slashing | has | SlashingDistribution | 1:1 | 60/20/20 |
| User | has | UserSettings | 1:1 | |

---

## Status Transitions

### Lock Status
```
[created] → [pending] → [confirmed] → [synced]
```

### Unlock Request Status
```
[pending] → [vrf_pending] → [prover_signing] → [submitted] → [time_lock] → [claimable] → [released]
                                                                    ↓
                                                              [cancelled] (if challenged)
```

### Prover Status
```
[pending] → [active] → [unbonding] → [exited]
                  ↓
             [slashed]
```

### Challenge Status
```
[open] → [defense_pending] → [challenger_won] → (Slashing triggered)
                          → [challenger_lost] → (Bond forfeit)
```

### Proposal Status
```
[draft] → [discussion] → [voting] → [time_lock] → [executed]
                              ↓            ↓
                         [rejected]   [vetoed]
```

---

## Business Rules

### Consumer App
| Rule | Value |
|------|-------|
| Normal Unlock Wait | 24h |
| Emergency Unlock Wait | 7d |
| Emergency Bond | MAX(0.5 ETH, amount × 5%) |
| Lock Duration Options | 1, 2, 3, 5 years |
| User Signature | Dilithium |
| Prover Signature | SPHINCS+ (2-of-5) |

### Prover
| Rule | Value |
|------|-------|
| Min Stake (Phase 1) | $400K ETH |
| Min Stake (Phase 2+) | $500K QS |
| VRF Selection | 2-of-5 based on stake weight |
| Signature Size | 8KB per SPHINCS+ |
| Unbonding Period | 7 days |
| SLA Uptime | ≥99.9% |
| SLA Response | ≤30s |

### Challenge/Slashing
| Rule | Value |
|------|-------|
| Challenge Bond | MAX(0.1 ETH, amount × 1%) |
| Defense Period | 48h |
| Slash Formula | N² × 10% |
| Challenger Reward | 60% |
| Insurance Fund | 20% |
| Burn | 20% |

### Governance
| Type | Quorum | Time Lock |
|------|--------|-----------|
| parameter_change | 4% | 7d |
| upgrade | 8% | 7d |
| council_change | 15% | 7d |
| immutable_change | 30% | 2y |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-26 | 初版作成 - UIコンポーネントベース |
| **2.0** | **2026-01-26** | **SEQUENCES.md完全対応、UnlockProverSignature/VRFRequest追加、Settings対応** |

---

**END OF DOCUMENT**
