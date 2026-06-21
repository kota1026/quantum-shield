# Quantum Shield - シーケンス実装マッピング仕様書 v1.0

> **作成日**: 2026-01-04
> **目的**: 各シーケンスに対して「既存コード」「新規必要コード」「UI/UX」を完全マッピング
> **レビュー**: CDO + Chief Integration Architect 確認必須

---

## 目次

1. [概要](#1-概要)
2. [Sequence #1: Lock](#2-sequence-1-lock)
3. [Sequence #2: Unlock (Normal)](#3-sequence-2-unlock-normal)
4. [Sequence #3: Unlock (Emergency)](#4-sequence-3-unlock-emergency)
5. [Sequence #3': Resync](#5-sequence-3-resync)
6. [Sequence #4: Challenge + Slashing](#6-sequence-4-challenge--slashing)
7. [Sequence #5: Prover Registration](#7-sequence-5-prover-registration)
8. [Sequence #6: Prover Exit](#8-sequence-6-prover-exit)
9. [Sequence #7: Governance Proposal](#9-sequence-7-governance-proposal)
10. [Sequence #8: Emergency Pause](#10-sequence-8-emergency-pause)
11. [統合ギャップ分析](#11-統合ギャップ分析)

---

## 1. 概要

### 1.1 シーケンス一覧と実装状況

| # | シーケンス | L1実装 | L3実装 | API実装 | UI/UX実装 | 統合状態 |
|---|-----------|:------:|:------:|:-------:|:---------:|:--------:|
| 1 | Lock | ✅ | ✅ | ❌ | ❌ | 🔴 未接続 |
| 2 | Unlock (Normal) | ✅ | ⚠️ 部分 | ❌ | ❌ | 🔴 未接続 |
| 3 | Unlock (Emergency) | ✅ | ⚠️ 部分 | ❌ | ❌ | 🔴 未接続 |
| 3' | Resync | ⚠️ 部分 | ❌ | ❌ | ❌ | 🔴 未接続 |
| 4 | Challenge + Slashing | ✅ | ❌ | ❌ | ❌ | 🔴 未接続 |
| 5 | Prover Registration | ⚠️ 部分 | ✅ | ❌ | ❌ | 🔴 未接続 |
| 6 | Prover Exit | ⚠️ 部分 | ⚠️ 部分 | ❌ | ❌ | 🔴 未接続 |
| 7 | Governance Proposal | ❌ | ✅ | ❌ | ❌ | 🔴 未接続 |
| 8 | Emergency Pause | ✅ | ✅ | ❌ | ❌ | 🟡 接続可能 |

### 1.2 凡例

| 記号 | 意味 |
|------|------|
| ✅ | 完全実装済み |
| ⚠️ | 部分実装（追加作業必要） |
| ❌ | 未実装 |
| 🔴 | 未接続（統合作業必要） |
| 🟡 | 接続可能（軽微な作業で統合可能） |
| 🟢 | 完全統合済み |

---

## 2. Sequence #1: Lock

### 2.1 既存コード

#### L1 (Solidity)

| ファイル | 機能 | 状態 | 備考 |
|---------|------|:----:|------|
| `contracts/src/L1Vault.sol` | lock(), deposit(), SR_0計算 | ✅ | 48KB, PIR検証済み |
| `contracts/src/libraries/SHA3_256.sol` | FIPS 202 ハッシュ | ✅ | CP-1準拠 |
| `contracts/src/libraries/SparseMerkleTree.sol` | SMT操作 | ✅ | |
| `contracts/src/core/ConstitutionLock.sol` | Lock制約 | ✅ | 14KB |

```solidity
// L1Vault.sol 既存インターフェース
function lock(
    uint256 chainId,
    address asset,
    uint256 amount,
    bytes calldata destAddr,
    uint256 expiry,
    uint256 nonce,
    bytes calldata pkDilithium,
    bytes calldata sigDilithium
) external returns (bytes32 lockId, bytes32 sr0);
```

#### L3 (Rust)

| クレート | 機能 | 状態 | 備考 |
|---------|------|:----:|------|
| `l3-aegis/crates/aegis-consensus` | BFT 4ノード合意 | ✅ | |
| `l3-aegis/crates/aegis-crypto` | Dilithium検証 | ✅ | NIST KAT準拠 |
| `l3-aegis/crates/aegis-smt` | SR_0計算、SMT | ✅ | |
| `l3-aegis/crates/aegis-types` | Lock構造体 | ✅ | |

### 2.2 新規必要コード

#### API Layer (P0: 必須)

| コンポーネント | 説明 | 優先度 | 工数 |
|---------------|------|:------:|:----:|
| **Lock API Gateway** | REST/gRPC エンドポイント | P0 | 3日 |
| **L3 Lock Handler** | L3でのLockリクエスト処理 | P0 | 2日 |
| **Event Bridge (L1→L3)** | L1 Locked イベントのL3同期 | P0 | 5日 |

```rust
// 新規: Lock API (Rust/Axum)
#[derive(Deserialize)]
pub struct LockRequest {
    chain_id: u64,
    asset: Address,
    amount: U256,
    dest_addr: Vec<u8>,
    expiry: u64,
    nonce: u64,
    pk_dilithium: Vec<u8>,
    sig_dilithium: Vec<u8>,
}

#[post("/api/v1/lock")]
async fn create_lock(req: LockRequest) -> Result<LockResponse, ApiError>;
```

#### Client SDK (P0: 必須)

| コンポーネント | 説明 | 優先度 | 工数 |
|---------------|------|:------:|:----:|
| **Dilithium WASM** | ブラウザ内署名生成 | P0 | 5日 |
| **Lock SDK (TypeScript)** | ユーザー向けSDK | P0 | 3日 |

```typescript
// 新規: Client SDK
interface QuantumShieldSDK {
  // Dilithium鍵管理
  generateDilithiumKeyPair(): Promise<DilithiumKeyPair>;
  signWithDilithium(message: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array>;
  
  // Lock操作
  createLock(params: LockParams): Promise<LockResult>;
  getLockStatus(lockId: string): Promise<LockStatus>;
}
```

### 2.3 UI/UX 要件

#### End User 画面

| 画面 | 機能 | 状態 | 備考 |
|------|------|:----:|------|
| Lock作成画面 | 資産選択、金額入力 | ❌ | |
| 手数料確認画面 | Gas見積もり表示 | ❌ | |
| ウォレット接続 | MetaMask統合 | ❌ | wagmi使用 |
| TX署名画面 | Dilithium + ETH署名 | ❌ | |
| Lock確認待ち | 進捗表示 | ❌ | |
| Lock完了 | lock_id、SR_0表示 | ❌ | |

```
┌─────────────────────────────────────────────────────────┐
│                   Lock 作成画面                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  資産選択: [ETH ▼]                                      │
│                                                         │
│  金額: [________] ETH                                   │
│                                                         │
│  送金先チェーン: [Ethereum Mainnet ▼]                   │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  手数料見積もり:                                         │
│  ├── Gas: ~135,000 (~$7)                               │
│  └── プロトコル手数料: 0.1%                              │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  [ウォレット接続] [Dilithium鍵を生成] [Lock実行]         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Admin 画面

| 画面 | 機能 | 状態 |
|------|------|:----:|
| Lock一覧 | 全Lockのリスト表示 | ❌ |
| Lock詳細 | lock_id, SR_0, 金額等 | ❌ |
| Lock監視 | リアルタイム更新 | ❌ |

### 2.4 統合チェックリスト

```
□ L1 L1Vault.lock() → L3 Event Bridge 接続
□ L3 BFT合意 → L1 deposit() 同期
□ API Gateway → L3 Handler 接続
□ Client SDK → API Gateway 接続
□ UI → Client SDK 接続
□ E2E テスト: Lock作成 → 確認
```

---

## 3. Sequence #2: Unlock (Normal)

### 3.1 既存コード

#### L1 (Solidity)

| ファイル | 機能 | 状態 | 備考 |
|---------|------|:----:|------|
| `contracts/src/L1Vault.sol` | submitUnlock(), claim() | ✅ | |
| `contracts/src/VRFConsumer.sol` | Prover VRF選出 | ✅ | 18KB |
| `contracts/src/SPHINCSVerifier.sol` | 2/5署名検証 | ✅ | 21KB |

```solidity
// L1Vault.sol 既存インターフェース
function submitUnlock(
    bytes32 lockId,
    bytes32 sr0,
    bytes32 sr1,
    bytes calldata smtProof,
    bytes calldata unlockData,
    bytes[] calldata sphincsSigs  // 2/5 SPHINCS+署名
) external returns (bytes32 unlockId);

function claim(bytes32 unlockId) external;
```

#### L3 (Rust)

| クレート | 機能 | 状態 | 備考 |
|---------|------|:----:|------|
| `aegis-consensus` | BFT合意 | ✅ | |
| `aegis-crypto` | Dilithium検証 | ✅ | |
| `aegis-smt` | SR_1計算 | ✅ | |

### 3.2 新規必要コード

#### API Layer (P0: 必須)

| コンポーネント | 説明 | 優先度 | 工数 |
|---------------|------|:------:|:----:|
| **Unlock API Gateway** | REST/gRPC エンドポイント | P0 | 3日 |
| **VRF Integration** | L3→Chainlink VRF接続 | P0 | 5日 |
| **Signature Queue Service** | Prover署名リクエストキュー | P0 | 5日 |
| **Prover HSM Adapter** | HSM署名連携 | P0 | 7日 |
| **Status Tracker API** | Unlock進捗追跡 | P0 | 2日 |

```rust
// 新規: Signature Queue Service
pub struct SignatureRequest {
    unlock_id: [u8; 32],
    sr0: [u8; 32],
    sr1: [u8; 32],
    selected_provers: Vec<ProverId>,  // VRFで選出された2社
    expiry: u64,
}

pub trait SignatureQueueService {
    async fn enqueue(&self, req: SignatureRequest) -> Result<RequestId>;
    async fn poll_signatures(&self, req_id: RequestId) -> Result<Vec<SphincsSignature>>;
}
```

#### 監視ボット (P1: 必須)

| コンポーネント | 説明 | 優先度 | 工数 |
|---------------|------|:------:|:----:|
| **24h Monitoring Bot** | 24h監視、異常検知 | P1 | 5日 |
| **Alert Service** | 異常時通知 | P1 | 2日 |

### 3.3 UI/UX 要件

#### End User 画面

| 画面 | 機能 | 状態 |
|------|------|:----:|
| Unlock対象選択 | Lock一覧から選択 | ❌ |
| Unlock方法選択 | 通常(24h) / 緊急(7日) | ❌ |
| Dilithium署名 | クライアント側署名 | ❌ |
| Prover署名待ち | 進捗表示 (0/2 → 2/2) | ❌ |
| Time Lock待機 | 24hカウントダウン | ❌ |
| Claim実行 | 資産引出し | ❌ |

```
┌─────────────────────────────────────────────────────────┐
│                 Unlock 進捗画面                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Lock ID: 0x1234...abcd                                 │
│  金額: 10.0 ETH                                         │
│                                                         │
│  ═══════════════════════════════════════════════════    │
│                                                         │
│  ステップ 1: Dilithium署名 ✅ 完了                       │
│                                                         │
│  ステップ 2: VRF Prover選出 ✅ 完了                      │
│    選出: Prover A, Prover B                             │
│                                                         │
│  ステップ 3: Prover署名収集 ⏳ 進行中                    │
│    [████████░░░░░░░░] 1/2 署名                          │
│                                                         │
│  ステップ 4: 24h Time Lock ⏸ 待機中                      │
│                                                         │
│  ステップ 5: Claim ⏸ 待機中                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Prover 画面

| 画面 | 機能 | 状態 |
|------|------|:----:|
| 署名要求キュー | 署名待ちリクエスト一覧 | ❌ |
| 署名要求詳細 | unlock_data確認 | ❌ |
| HSM署名実行 | SPHINCS+署名生成 | ❌ |
| 署名履歴 | 過去の署名一覧 | ❌ |

### 3.4 統合チェックリスト

```
□ L3 Unlock Handler → VRF Consumer 接続
□ VRF Consumer → Prover選出ロジック 接続
□ Signature Queue → Prover HSM Adapter 接続
□ Prover署名 → L1 submitUnlock() 接続
□ 24h Timer → Claim可能通知
□ E2E テスト: Unlock申請 → Claim
```

---

## 4. Sequence #3: Unlock (Emergency)

### 4.1 既存コード

#### L1 (Solidity)

| ファイル | 機能 | 状態 | 備考 |
|---------|------|:----:|------|
| `contracts/src/L1Vault.sol` | emergencyUnlock() | ✅ | Bond必須 |

### 4.2 新規必要コード

| コンポーネント | 説明 | 優先度 | 工数 |
|---------------|------|:------:|:----:|
| **Emergency Unlock API** | 緊急Unlockエンドポイント | P1 | 2日 |
| **72h Timeout Detection** | Prover応答監視 | P1 | 3日 |
| **Bond Calculator** | Bond金額計算 | P1 | 1日 |

### 4.3 UI/UX 要件

| 画面 | 機能 | 状態 |
|------|------|:----:|
| Emergency Unlock選択 | 緊急モード説明 | ❌ |
| Bond確認 | MAX(0.5 ETH, amount×5%) | ❌ |
| 7日待機画面 | カウントダウン | ❌ |

### 4.4 🔴 CDO/CIA指摘事項

> **CDO指摘**: Emergency Unlockのユーザー体験が不明確
> - 通常Unlockからの自動切替フローがない
> - 72h経過後の通知がない
> - Bond返還の可視性がない

> **CIA指摘**: Emergency Path発動条件の検知が未実装
> - Prover障害検知ロジックがない
> - VRF障害検知ロジックがない

---

## 5. Sequence #3': Resync

### 5.1 既存コード

**ほぼ未実装**

### 5.2 新規必要コード

| コンポーネント | 説明 | 優先度 | 工数 |
|---------------|------|:------:|:----:|
| **Event Poller** | L1イベント定期ポーリング | P0 | 3日 |
| **Resync Handler** | 手動Resync処理 | P1 | 2日 |
| **L1 Event Indexer** | L1イベントインデックス | P0 | 5日 |

### 5.3 UI/UX 要件

| 画面 | 機能 | 状態 |
|------|------|:----:|
| 同期状態表示 | L1/L3同期ステータス | ❌ |
| 手動Resyncボタン | ユーザー起動Resync | ❌ |

---

## 6. Sequence #4: Challenge + Slashing

### 6.1 既存コード

#### L1 (Solidity)

| ファイル | 機能 | 状態 | 備考 |
|---------|------|:----:|------|
| `contracts/src/L1Vault.sol` | challenge(), slash() | ✅ | Quadratic Slashing |
| `l3-aegis/src/sequencer/SequencerSlashing.sol` | Slashingロジック | ✅ | 12KB |

### 6.2 新規必要コード

| コンポーネント | 説明 | 優先度 | 工数 |
|---------------|------|:------:|:----:|
| **Monitoring Bot** | 異常検知、Challenge発動 | P1 | 7日 |
| **Challenge API** | Challenge提出エンドポイント | P1 | 2日 |
| **Defense API** | Prover Defense提出 | P1 | 2日 |
| **Slashing Calculator** | Quadratic計算 | P1 | 1日 |

### 6.3 UI/UX 要件

#### Admin 画面

| 画面 | 機能 | 状態 |
|------|------|:----:|
| Challenge一覧 | 進行中Challenge | ❌ |
| Slashingイベント | 過去のSlashing履歴 | ❌ |
| アラート設定 | 異常検知閾値 | ❌ |

#### Prover 画面

| 画面 | 機能 | 状態 |
|------|------|:----:|
| Challenge通知 | 自分への Challenge | ❌ |
| Defense提出 | 48h以内にDefense | ❌ |
| Slashing履歴 | 過去のSlashing | ❌ |

---

## 7. Sequence #5: Prover Registration

### 7.1 既存コード

#### L3 (Solidity)

| ファイル | 機能 | 状態 | 備考 |
|---------|------|:----:|------|
| `l3-aegis/src/sequencer/SequencerRegistry.sol` | Sequencer登録 | ✅ | 9KB |
| `l3-aegis/src/sequencer/SequencerStaking.sol` | Stake管理 | ✅ | 11KB |
| `l3-aegis/src/governance/GovernanceSwitch.sol` | モード別承認 | ✅ | 32KB |

### 7.2 新規必要コード

| コンポーネント | 説明 | 優先度 | 工数 |
|---------------|------|:------:|:----:|
| **Prover Registration API** | 登録申請エンドポイント | P0 | 3日 |
| **HSM Attestation Verifier** | HSM証明検証 | P0 | 5日 |
| **Multisig Proof Verifier** | 2-of-3証明検証 | P0 | 3日 |
| **Approval Workflow** | モード別承認フロー | P0 | 5日 |

### 7.3 UI/UX 要件

#### Prover 画面

| 画面 | 機能 | 状態 | 🔴 CDO/CIA指摘 |
|------|------|:----:|---------------|
| 新規登録申請 | 基本情報入力 | ❌ | **完全欠如** |
| HSM証明アップロード | HSM証明書提出 | ❌ | **完全欠如** |
| マルチシグ設定 | 2-of-3設定 | ❌ | **完全欠如** |
| Stake送金 | $400K+ ETH/QS | ❌ | **完全欠如** |
| 承認待ち状態 | Pending表示 | ❌ | |
| 登録完了 | Active表示 | ❌ | |

```
┌─────────────────────────────────────────────────────────┐
│              Prover 新規登録申請画面                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ステップ 1: 基本情報                                    │
│  ├── 組織名: [____________]                             │
│  ├── オペレーターアドレス: [0x...]                       │
│  └── 連絡先: [____________]                             │
│                                                         │
│  ステップ 2: SPHINCS+公開鍵                              │
│  └── 公開鍵: [ファイル選択] または [貼り付け]             │
│                                                         │
│  ステップ 3: HSM証明書                                   │
│  ├── HSMベンダー: [Thales ▼]                            │
│  └── Attestation証明書: [ファイルアップロード]           │
│                                                         │
│  ステップ 4: マルチシグ設定                              │
│  ├── 署名者1: [0x...] ✅                                 │
│  ├── 署名者2: [0x...] ✅                                 │
│  └── 署名者3: [0x...] ✅                                 │
│                                                         │
│  ステップ 5: Stake送金                                   │
│  ├── 最低Stake: $400,000 (ETH/QS)                       │
│  ├── 送金額: [________] ETH                             │
│  └── [ウォレット接続] [Stake送金]                        │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  [キャンセル]                        [登録申請を提出]     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 7.4 🔴 CDO/CIA指摘事項

> **CDO指摘**: Prover登録のUI/UXが**完全欠如**
> - 現在のUI/UX要件書にProver登録画面フローがない
> - HSM証明のアップロードUIがない
> - 承認プロセスの可視性がない

> **CIA指摘**: モード別承認フローの実装が不完全
> - Enterprise: 契約ベース承認 → 手動承認UIが必要
> - Decentralized Phase 1-2: 財団招待 → 招待機能が必要
> - Decentralized Phase 3: Council 3/9 + 自動条件 → Council UI必要
> - Decentralized Phase 4+: 自動承認 → 自動化ロジック必要

---

## 8. Sequence #6: Prover Exit

### 8.1 既存コード

| ファイル | 機能 | 状態 |
|---------|------|:----:|
| `l3-aegis/src/sequencer/SequencerStaking.sol` | Unbonding | ✅ |

### 8.2 新規必要コード

| コンポーネント | 説明 | 優先度 | 工数 |
|---------------|------|:------:|:----:|
| **Exit API** | 退出申請エンドポイント | P1 | 2日 |
| **Unbonding Tracker** | 7日Unbonding追跡 | P1 | 2日 |

### 8.3 UI/UX 要件

| 画面 | 機能 | 状態 |
|------|------|:----:|
| 退出申請 | 退出ボタン | ❌ |
| Unbonding状態 | 7日カウントダウン | ❌ |
| Stake引出し | Unbonding完了後 | ❌ |

---

## 9. Sequence #7: Governance Proposal

### 9.1 既存コード

#### L3 (Solidity)

| ファイル | 機能 | 状態 | 備考 |
|---------|------|:----:|------|
| `l3-aegis/src/governance/Governor.sol` | 提案管理 | ✅ | 13KB |
| `l3-aegis/src/governance/GovernanceSwitch.sol` | モード切替 | ✅ | 32KB |
| `l3-aegis/src/governance/SecurityCouncil.sol` | SC投票 | ✅ | 12KB |
| `l3-aegis/src/governance/Timelock.sol` | 7日TimeLock | ✅ | 11KB |

### 9.2 新規必要コード

| コンポーネント | 説明 | 優先度 | 工数 |
|---------------|------|:------:|:----:|
| **Purpose Committee Contract** | 理念チェック | P1 | 5日 |
| **veQS Voting Contract** | 加重投票 | P1 | 7日 |
| **Governance API** | 提案/投票エンドポイント | P1 | 3日 |

### 9.3 UI/UX 要件

| 画面 | 機能 | 状態 |
|------|------|:----:|
| 提案一覧 | Active/Passed/Rejected | ❌ |
| 提案作成 | 1 ETH Bond | ❌ |
| 投票画面 | veQS加重表示 | ❌ |
| Veto状態 | SC Veto状況 | ❌ |

---

## 10. Sequence #8: Emergency Pause

### 10.1 既存コード

| ファイル | 機能 | 状態 |
|---------|------|:----:|
| `l3-aegis/src/governance/GovernanceSwitch.sol` | emergencyPause() | ✅ |
| `l3-aegis/src/governance/EmergencyController.sol` | 緊急制御 | ✅ |
| `l3-aegis/src/governance/SecurityCouncil.sol` | 5/9投票 | ✅ |

### 10.2 新規必要コード

| コンポーネント | 説明 | 優先度 | 工数 |
|---------------|------|:------:|:----:|
| **Emergency Pause API** | Pause/Unpauseエンドポイント | P0 | 2日 |
| **SC Voting UI Integration** | SC投票UI | P1 | 3日 |

### 10.3 UI/UX 要件

#### Admin 画面

| 画面 | 機能 | 状態 |
|------|------|:----:|
| Emergency Pauseボタン | 緊急停止 | ❌ |
| Pause状態表示 | 72hタイマー | ❌ |
| Unpauseボタン | 復旧 | ❌ |

---

## 11. 統合ギャップ分析

### 11.1 クリティカルギャップ (P0)

| # | ギャップ | 影響範囲 | 工数 |
|---|---------|---------|:----:|
| 1 | **Event Bridge (L1↔L3)** | Seq #1, #2, #3, #3' | 10日 |
| 2 | **Signature Queue Service** | Seq #2 | 5日 |
| 3 | **Dilithium WASM** | Seq #1, #2 | 5日 |
| 4 | **Lock/Unlock API Gateway** | Seq #1, #2, #3 | 6日 |
| 5 | **Status Tracker API** | Seq #1, #2, #3 | 3日 |

### 11.2 重要ギャップ (P1)

| # | ギャップ | 影響範囲 | 工数 |
|---|---------|---------|:----:|
| 6 | **Monitoring Bot** | Seq #4 | 7日 |
| 7 | **Prover Registration API** | Seq #5 | 5日 |
| 8 | **HSM Integration** | Seq #2, #5 | 7日 |
| 9 | **Governance API** | Seq #7 | 3日 |
| 10 | **Purpose Committee** | Seq #7 | 5日 |

### 11.3 UI/UX ギャップ (P0-P1)

| # | ギャップ | ペルソナ | 優先度 |
|---|---------|---------|:------:|
| 1 | **End User Lock/Unlock画面** | End User | P0 |
| 2 | **Prover Registration画面** | Prover | P0 |
| 3 | **Admin Dashboard** | Admin | P1 |
| 4 | **Prover Dashboard** | Prover | P1 |

### 11.4 🔴 CDO/CIA 総合指摘

#### CDO (Chief Design Officer) 指摘

1. **Prover登録フローの完全欠如**: UI/UX要件書にProver登録画面がない
2. **Emergency Unlockの体験設計不足**: 72h経過後の自動切替がUX上不明
3. **進捗可視性の不足**: 各シーケンスの進捗がユーザーに見えない
4. **エラー状態のUI**: エラー時のリカバリフローがない

#### CIA (Chief Integration Architect) 指摘

1. **L1↔L3 Event Bridge未実装**: 全シーケンスの根幹が未接続
2. **モード切替の詳細設計不足**: Enterprise/Decentralized切替時の動作が不明確
3. **4BFT→N-BFT切替**: Phase 4+での動的ノード追加の設計がない
4. **HSM統合の設計不足**: Prover HSMとの通信プロトコルが未定義

---

**END OF DOCUMENT**

---

## 変更履歴

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-04 | 初版作成、CDO/CIA指摘追加 |
