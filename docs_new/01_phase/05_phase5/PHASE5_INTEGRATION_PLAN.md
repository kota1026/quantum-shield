# Phase 5: バックエンド統合計画書

> **Version**: 2.0
> **Date**: 2026-01-11
> **Status**: Draft (Updated with Backend Deep Analysis)
> **Author**: Claude (Integration Analysis)

---

## 1. Executive Summary

### 1.1 現状（詳細分析後 - 修正版）

| カテゴリ | 完了 | 未完了 | 完了率 | 備考 |
|---------|:----:|:-----:|:------:|------|
| **UIモック** | 107画面 | 0 | 100% | ✅ |
| **API実装** | 10 EP | 82 EP | 11% | |
| **L1コントラクト** | 6 | 2 | 75% | |
| **L3 Aegis** | コア | 本番モード | **70%** | ⚠️ 下方修正 |
| **Event Bridge** | Polling | WebSocket/MQ | **30%** | 🔴 下方修正 |
| **STARK Prover** | Contract | 証明生成 | **20%** | 🔴 新規発見 |
| **React SDK** | Types | 実装 | **5%** | 🔴 新規発見 |

### 1.2 Phase 5 目標

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Phase 5: モック → 実動アプリケーション                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   [UIモック 107画面]  ──統合──>  [実動アプリ]                            │
│          │                           │                                  │
│          ▼                           ▼                                  │
│   [API 10 EP]        ──拡張──>  [API 92 EP]                             │
│          │                           │                                  │
│          ▼                           ▼                                  │
│   [L1/L3 基盤]       ──追加──>  [Edition/Prover完全対応]                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 発見されたギャップ一覧

### 2.1 API ギャップ（89%未実装）

| システム | 必要API | 実装済 | 未実装 | 優先度 |
|---------|:------:|:-----:|:-----:|:------:|
| Consumer App | 7 | 1 | 6 | P0 |
| Token Hub | 9 | 0 | 9 | P0 |
| Governance | 8 | 0 | 8 | P0 |
| Prover Portal | 11 | 2 | 9 | P0 |
| Observer | 8 | 0 | 8 | P1 |
| Explorer | 12 | 0 | 12 | P1 |
| Enterprise Admin | 19 | 0 | 19 | P0 |
| QS Admin | 14 | 3 | 11 | P0 |
| **合計** | **88** | **6** | **82** | |

### 2.2 コントラクト ギャップ

| コントラクト | 状態 | 影響 | 優先度 |
|------------|:----:|------|:------:|
| **EditionConfig.sol** | ❌ 未実装 | Enterprise/Decentralized切替不可 | 🔴 P0 |
| **ProverRegistry.sol** | ❌ 未実装 | Prover登録フロー全滅 | 🔴 P0 |
| GovernanceSwitch.sol | ✅ 実装済 | - | - |
| SecurityCouncil.sol | ✅ 実装済 | - | - |
| Governor.sol | ✅ 実装済 | - | - |
| L1Vault.sol | ✅ 実装済 | - | - |

### 2.3 L3 Aegis ギャップ

| コンポーネント | 状態 | 影響 | 優先度 |
|--------------|:----:|------|:------:|
| **NodeManager** | ❌ 未実装 | Phase 4 動的ノード追加不可 | 🔴 P0 |
| **Edition判定ロジック** | ⚠️ 部分 | Enterprise/Decen分岐なし | 🟠 P1 |
| Consensus (4BFT) | ✅ 実装済 | 4ノード固定 | - |
| Sequencer | ✅ 実装済 | - | - |

### 2.4 機能 ギャップ

| 機能 | モック | API | Backend | 優先度 |
|------|:-----:|:---:|:-------:|:------:|
| **Enterprise申込ページ** | ❌ なし | ❌ なし | ❌ なし | 🔴 P0 |
| **4BFT契約者管理** | ✅ あり | ❌ なし | ❌ なし | 🔴 P0 |
| **多言語対応 (i18n)** | ⚠️ UI設計のみ | ❌ なし | - | 🟠 P1 |
| **リアルタイム通知** | ⚠️ 想定のみ | ❌ なし | ⚠️ 部分 | 🟠 P1 |

---

## 2.5 🔴 新規発見: バックエンド実装の重大ギャップ

### 2.5.1 STARK Prover（証明生成エンジン）- 🔴 CRITICAL

**発見**: STARK証明生成が**プレースホルダー実装**のまま

| コンポーネント | ファイル | 状態 | 問題 |
|--------------|----------|:----:|------|
| **Trace Matrix生成** | `circuits/dilithium-stark/src/witness.rs:55-87` | ❌ STUB | `build_trace_matrix()` returns `Vec::new()` |
| **FRI Proof生成** | `stark-prover/src/main.rs:481-491` | ❌ STUB | ダミーデータを返す |
| **Query Response** | `stark-prover/src/main.rs:493-499` | ❌ STUB | 空のベクターを返す |
| **Matrix A展開** | `verification.rs:210-218` | ❌ STUB | ゼロを返す（ρシードからの展開なし） |
| **NTT Trace** | `witness.rs:52` | ❌ STUB | `ntt_traces: Vec::new()` |

**影響**:
- L1コントラクト（STARKVerifier.sol, FRIVerifier.sol）は**完成済み**
- しかし**実際のSTARK証明は生成できない**
- 現在はダミー証明でテストしている状態

**工数追加**: **+15日**（Plonky3ベースの実装）

---

### 2.5.2 Dilithium FIPS 204 不整合 - 🔴 HIGH

**発見**: API層とL3層で異なるDilithiumライブラリを使用

| コンポーネント | ライブラリ | 標準 | 状態 |
|--------------|-----------|------|:----:|
| **API (services/api)** | `fips204` v0.4 | FIPS 204 ML-DSA-65 | ✅ 正しい |
| **WASM SDK** | `fips204` v0.4 | FIPS 204 ML-DSA-65 | ✅ 正しい |
| **L3-Aegis Consensus** | `pqcrypto-dilithium` v0.5 | Pre-FIPS Dilithium | ⚠️ 非準拠 |
| **L3-Aegis Crypto** | `pqcrypto-dilithium` v0.5 | Pre-FIPS Dilithium | ⚠️ 非準拠 |

**リスク**:
- 署名サイズは同一（1952B pk, 3309B sig）だが内部アルゴリズムに差異あり
- CP-1（Complete Quantum Resistance）準拠の観点で問題
- 将来的な相互運用性リスク

**工数追加**: **+3日**（L3-Aegisのfips204移行）

---

### 2.5.3 React SDK - 🔴 CRITICAL（全てモック）

**発見**: React Hooksが**全てプレースホルダー**で、実際のWASMモジュールを呼び出していない

| Hook | ファイル | 問題 |
|------|----------|------|
| `useDilithium()` | `packages/sdk/react/src/useDilithium.ts` | `sign()` returns `sig_${message.slice(0,8)}_${Date.now()}` |
| `useDilithium()` | 同上 | `verify()` always returns `{ valid: true }` |
| `useWallet()` | `packages/sdk/react/src/useWallet.ts` | `signMessage()` returns random hex |
| `useLock()` | `packages/sdk/react/src/useLock.ts` | Returns mock response with random txHash |
| `useUnlock()` | `packages/sdk/react/src/useUnlock.ts` | `createSignedUnlock()` returns mock sig |

**根本原因**:
```typescript
// QuantumShieldProvider.tsx, line 115-117
setClient({ config });
setCrypto({});  // ← 空オブジェクト！WASMモジュール未初期化
setWallet({});
```

**影響**:
- UIモックは動作するが**実際の暗号処理は行われない**
- API呼び出しはモック署名を送信 → **サーバー側で検証失敗**

**工数追加**: **+5日**（WASM統合 + Hook実装）

---

### 2.5.4 L3 Aegis Production Mode - 🔴 HIGH

**発見**: 本番モードが**STUB状態**

| コンポーネント | ファイル | 状態 | TODOの内容 |
|--------------|----------|:----:|-----------|
| **Node Wiring** | `aegis-node/src/node.rs:51` | ❌ TODO | "Add actual components" |
| **Component Init** | `aegis-node/src/node.rs:71` | ❌ TODO | "Initialize components" |
| **Production Logic** | `aegis-node/src/node.rs:140` | ❌ TODO | "Implement actual production logic" |
| **Graceful Shutdown** | `aegis-node/src/node.rs:162` | ❌ TODO | "Graceful shutdown" |
| **Network TLS** | `aegis-network/src/transport.rs:37` | ❌ TODO | "Implement TLS 1.3 with mTLS" |
| **L1 State Root** | `aegis-sequencer/src/sequencer.rs:255` | ❌ TODO | "Calculate state_root from state" |
| **Batch Signatures** | `aegis-sequencer/src/sequencer.rs:258` | ❌ TODO | "Sign with Dilithium" |
| **L1 Submission** | `aegis-sequencer/src/sequencer.rs:281` | ❌ TODO | "Submit to L1" |

**現状動作するもの**:
- ✅ Single-node dev mode (`--dev --single`)
- ✅ Consensus engine (4BFT PBFT)
- ✅ Mempool, BatchBuilder

**動作しないもの**:
- ❌ 4ノードネットワーク（TLS未実装）
- ❌ 実L1へのState Root提出
- ❌ RPC endpoints（スケルトンのみ）

**工数追加**: **+10日**

---

### 2.5.5 Event Bridge - 🔴 HIGH

**発見**: メッセージングインフラが**大部分STUB**

| コンポーネント | ファイル | 状態 | 問題 |
|--------------|----------|:----:|------|
| **WebSocket** | `event-bridge/src/indexer/listener.rs` | ❌ 未実装 | "WebSocket can be added later"コメントのみ |
| **RabbitMQ publish** | `event-bridge/src/rabbitmq_client.rs:21-24` | ❌ STUB | 何もせず即return |
| **Redis EXISTS** | `event-bridge/src/redis_client.rs` | ❌ TODO | "Implement EXISTS" |
| **Redis GET** | 同上 | ❌ TODO | "Implement GET" |
| **Redis SET** | 同上 | ❌ TODO | "Implement SET" |
| **Event Dequeue** | `event-bridge/src/queue.rs:93` | ❌ STUB | Returns empty vec |
| **L3 Event Listener** | - | ❌ 未実装 | L3からのイベント取得なし |

**影響**:
- L1→L3 Polling（5秒間隔）のみ動作
- リアルタイム通知なし
- L3→L1 Relayerはイベントを受け取れない

**工数追加**: **+8日**

---

### 2.5.6 SPHINCS+検証 - 🟠 MEDIUM

**発見**: Prover登録時のSPHINCS+検証が**スタブ**

```rust
// services/api/src/routes/prover.rs:88-91
fn validate_sphincs_pubkey(pubkey: &str) -> bool {
    pubkey.starts_with("0x") && pubkey.len() > 2  // ← これだけ！
}
```

**影響**:
- Prover登録は受け付けるが**公開鍵の検証をしていない**
- HSM attestation検証も未実装

**工数追加**: **+2日**

---

### 2.5.7 工数修正サマリ

| ギャップ | 追加工数 | 優先度 |
|---------|:-------:|:------:|
| STARK Prover実装 | +15日 | 🔴 P0 |
| L3 Dilithium FIPS 204移行 | +3日 | 🔴 P0 |
| React SDK WASM統合 | +5日 | 🔴 P0 |
| L3 Production Mode | +10日 | 🔴 P0 |
| Event Bridge完成 | +8日 | 🟠 P1 |
| SPHINCS+検証 | +2日 | 🟠 P1 |
| **合計追加** | **+43日** | |

**修正後総工数**: 59日 → **102日**

---

## 3. Phase 5 実装計画

### 3.1 全体スケジュール（修正版 - 102日）

```
Phase 5.0: 🔴 ブロッカー解消 (Week 1-4) ★新規追加★
├── STARK Prover実証明生成実装 (15日)
│   ├── Trace Matrix生成
│   ├── FRI Proof生成
│   └── Query Response実装
├── React SDK WASM統合 (5日)
│   ├── WASMモジュール初期化
│   └── 全Hook実装
├── L3 Dilithium FIPS 204移行 (3日)
│   ├── aegis-crypto移行
│   └── aegis-consensus移行
└── L3 Production Mode完成 (10日)
    ├── Node wiring
    ├── TLS 1.3 mTLS
    └── L1 State Root提出

Phase 5.1: 基盤整備 (Week 5-6)
├── EditionConfig.sol 実装
├── ProverRegistry.sol 実装
├── 認証基盤 (SIWE→JWT)
└── API Client 認証統合

Phase 5.2: コアAPI実装 (Week 7-8)
├── Consumer App API (6 EP)
├── Token Hub API (9 EP)
├── Prover Portal API (9 EP)
└── WebSocket/SSE基盤

Phase 5.3: 管理系API実装 (Week 9-10)
├── QS Admin API (11 EP)
├── Enterprise Admin API (19 EP)
├── Enterprise申込フロー
└── 4BFT契約者管理

Phase 5.4: 補完機能実装 (Week 11-12)
├── Governance API (8 EP)
├── Observer API (8 EP)
├── Explorer API (12 EP)
├── Event Bridge完成 (8日)
│   ├── WebSocket実装
│   ├── RabbitMQ統合
│   └── Redis実装
├── SPHINCS+検証実装 (2日)
└── i18n対応

Phase 5.5: 統合・テスト (Week 13-14)
├── UI ↔ API 統合
├── E2Eテスト（実STARK証明）
├── Edition切替テスト
└── 本番デプロイ準備
```

### 3.2 Phase 5.1 詳細: 基盤整備

#### 3.2.1 EditionConfig.sol 実装

**ファイル**: `contracts/src/core/EditionConfig.sol`

```solidity
// 必要な実装
contract EditionConfig {
    enum Edition { ENTERPRISE, DECENTRALIZED }
    enum ConsensusType { FIXED_4BFT, DYNAMIC_PBFT }
    enum ProverApprovalMode {
        CONTRACT_BASED,      // Enterprise
        FOUNDATION_INVITE,   // Phase 1-2
        COUNCIL_VOTE,        // Phase 3
        STAKE_AUTO           // Phase 4+
    }

    struct Settings {
        Edition edition;
        ConsensusType consensus;
        ProverApprovalMode approvalMode;
        uint256 minNodes;
        uint256 maxNodes;
    }

    function switchEdition(Edition target) external;
    function getSettings() external view returns (Settings memory);
}
```

**工数**: 2-3日

#### 3.2.2 ProverRegistry.sol 実装

**ファイル**: `contracts/src/prover/ProverRegistry.sol`

```solidity
// 必要な実装
contract ProverRegistry {
    struct Prover {
        address operator;
        bytes32 sphincsPublicKey;
        uint256 stake;
        ProverStatus status;
        uint256 totalSignatures;
        uint256 slashCount;
    }

    function register(bytes32 sphincsKey, bytes calldata hsmAttestation) external payable;
    function approve(address prover) external; // Council/Foundation
    function autoApprove(address prover) external; // Stake条件達成時
    function slash(address prover, uint256 amount, string calldata reason) external;
}
```

**工数**: 3-4日

#### 3.2.3 認証基盤

**現状**: SIWE基盤あり、JWT未統合

**必要な実装**:
```typescript
// services/api/src/routes/auth.rs
POST /v1/auth/siwe      // SIWE署名検証 → JWT発行
POST /v1/auth/refresh   // JWTリフレッシュ
GET  /v1/auth/me        // 現在のユーザー情報
```

**工数**: 2日

### 3.3 Phase 5.2 詳細: コアAPI実装

#### Consumer App API (6 EP)

| エンドポイント | 機能 | 工数 |
|--------------|------|:----:|
| GET /v1/user/dashboard | 統計情報 | 0.5日 |
| GET /v1/user/transactions | 取引履歴 | 0.5日 |
| GET /v1/user/transactions/:id | 取引詳細 | 0.5日 |
| GET /v1/user/settings | 設定取得 | 0.5日 |
| POST /v1/user/settings | 設定更新 | 0.5日 |
| GET /v1/user/keys | 鍵情報 | 0.5日 |

#### Token Hub API (9 EP)

| エンドポイント | 機能 | 工数 |
|--------------|------|:----:|
| GET /v1/token-hub/dashboard | veQS残高・投票力 | 0.5日 |
| POST /v1/token-hub/lock | veQS Lock | 1日 |
| GET /v1/token-hub/locks | Lock一覧 | 0.5日 |
| POST /v1/token-hub/extend | 期間延長 | 0.5日 |
| GET /v1/token-hub/delegates | Delegate一覧 | 0.5日 |
| POST /v1/token-hub/delegate | 委任実行 | 1日 |
| GET /v1/token-hub/rewards | 報酬情報 | 0.5日 |
| POST /v1/token-hub/claim | 報酬請求 | 1日 |
| GET /v1/token-hub/delegations/my | 自分の委任 | 0.5日 |

#### Prover Portal API (9 EP)

| エンドポイント | 機能 | 工数 |
|--------------|------|:----:|
| GET /v1/prover/dashboard | 統計 | 0.5日 |
| GET /v1/prover/queue | 署名キュー | 1日 |
| GET /v1/prover/queue/:id | キュー詳細 | 0.5日 |
| POST /v1/prover/sign | 署名実行 | 1日 |
| GET /v1/prover/metrics | 実績 | 0.5日 |
| GET /v1/prover/alerts | アラート | 0.5日 |
| GET /v1/prover/challenges | チャレンジ | 0.5日 |
| POST /v1/prover/challenge-response | 回答提出 | 1日 |
| POST /v1/prover/exit | 終了申請 | 0.5日 |

### 3.4 Phase 5.3 詳細: 管理系API

#### Enterprise申込フロー（新規実装）

**モック追加が必要**:
- `system_07_enterprise/wip/mocks/00_application.html` - 申込フォーム
- `system_07_enterprise/wip/mocks/00_onboarding.html` - オンボーディング

**API追加**:
| エンドポイント | 機能 | 工数 |
|--------------|------|:----:|
| POST /v1/enterprise/apply | 申込受付 | 1日 |
| GET /v1/enterprise/application/:id | 申込状況 | 0.5日 |
| POST /v1/enterprise/contract/sign | 契約署名 | 1日 |
| GET /v1/enterprise/onboarding | オンボーディング状態 | 0.5日 |

#### 4BFT契約者管理（QS Admin側）

**API追加**:
| エンドポイント | 機能 | 工数 |
|--------------|------|:----:|
| GET /v1/admin/enterprise/accounts | 企業一覧 | 0.5日 |
| GET /v1/admin/enterprise/accounts/:id | 企業詳細 | 0.5日 |
| POST /v1/admin/enterprise/accounts | 企業登録 | 1日 |
| PUT /v1/admin/enterprise/accounts/:id | 企業更新 | 0.5日 |
| GET /v1/admin/enterprise/contracts | 契約一覧 | 0.5日 |
| POST /v1/admin/enterprise/contracts | 契約作成 | 1日 |

### 3.5 Phase 5.4 詳細: 補完機能

#### i18n対応

**導入ライブラリ**: `next-intl`

**必要な対応**:
1. ライブラリ導入・設定
2. 翻訳ファイル作成 (ja/en)
3. 全コンポーネントの言語値外部化
4. 言語切替UI実装

**工数**: 5日（全システム共通）

#### Governance API (8 EP)

| エンドポイント | 機能 | 工数 |
|--------------|------|:----:|
| GET /v1/governance/dashboard | 概要 | 0.5日 |
| GET /v1/governance/proposals | 提案一覧 | 0.5日 |
| GET /v1/governance/proposals/:id | 提案詳細 | 0.5日 |
| POST /v1/governance/proposals | 提案作成 | 1日 |
| POST /v1/governance/vote | 投票 | 1日 |
| GET /v1/governance/votes/:id | 投票結果 | 0.5日 |
| GET /v1/governance/activity | 活動履歴 | 0.5日 |
| GET /v1/governance/council | Council情報 | 0.5日 |

---

## 4. 詳細ギャップ分析

### 4.1 Enterprise Edition (4BFT) 専用機能

| 機能 | モック | API | Contract | 状態 |
|------|:-----:|:---:|:--------:|:----:|
| 企業申込ページ | ❌ | ❌ | - | **要追加** |
| 契約管理 | ❌ | ❌ | ❌ | **要追加** |
| SLA設定 | ❌ | ❌ | - | **要追加** |
| 課金管理 | ❌ | ❌ | - | **要追加** |
| 4BFTノード監視 | ✅ | ❌ | - | **API必要** |
| 企業ユーザー管理 | ✅ | ❌ | - | **API必要** |

### 4.2 Decentralized Edition 専用機能

| 機能 | モック | API | Contract | 状態 |
|------|:-----:|:---:|:--------:|:----:|
| Token Hub (veQS) | ✅ | ❌ | ✅ | **API必要** |
| Governance投票 | ✅ | ❌ | ✅ | **API必要** |
| Delegation | ✅ | ❌ | ✅ | **API必要** |
| Observer/Challenger | ✅ | ❌ | - | **API必要** |
| 動的ノード管理 | - | ❌ | ❌ | **Phase 4** |

### 4.3 共通機能

| 機能 | モック | API | Contract | 状態 |
|------|:-----:|:---:|:--------:|:----:|
| Lock/Unlock | ✅ | ✅ | ✅ | ✅ 完了 |
| Edition切替 | - | ✅ | ❌ | **Contract必要** |
| Prover登録 | ✅ | ⚠️ | ❌ | **Contract必要** |
| Explorer | ✅ | ❌ | - | **API必要** |
| 多言語 (i18n) | ⚠️ | - | - | **実装必要** |

---

## 5. 工数見積もり（修正版）

### 5.1 総工数

| フェーズ | 内容 | 工数 | 備考 |
|---------|------|:----:|------|
| **Phase 5.0** | 🔴 ブロッカー解消 | **33日** | ★新規追加★ |
| Phase 5.1 | 基盤整備 | **10日** | |
| Phase 5.2 | コアAPI | **12日** | |
| Phase 5.3 | 管理系API | **15日** | |
| Phase 5.4 | 補完機能 | **22日** | +10日（Event Bridge, SPHINCS+） |
| Phase 5.5 | 統合・テスト | **10日** | |
| **合計** | | **102日** | 旧:59日 → 新:102日 (+73%) |

### 5.2 Phase 5.0 詳細工数

| タスク | 工数 | 優先度 | 理由 |
|--------|:----:|:------:|------|
| STARK Prover実装 | 15日 | 🔴 P0 | 証明生成なしでは本番稼働不可 |
| L3 Production Mode | 10日 | 🔴 P0 | 4ノードネットワーク必須 |
| React SDK WASM統合 | 5日 | 🔴 P0 | UIが実際の暗号処理を呼べない |
| L3 Dilithium FIPS移行 | 3日 | 🔴 P0 | CP-1準拠必須 |

### 5.3 カテゴリ別工数（修正版）

| カテゴリ | 旧工数 | 新工数 | 差分 |
|---------|:-----:|:-----:|:----:|
| Contract実装 | 7日 | 7日 | - |
| API実装 (82 EP) | 35日 | 35日 | - |
| L3 Aegis拡張 | 5日 | **18日** | +13日 |
| STARK Prover | 0日 | **15日** | +15日 |
| Event Bridge | 0日 | **8日** | +8日 |
| React SDK | 0日 | **5日** | +5日 |
| UI統合 | 7日 | 7日 | - |
| i18n対応 | 5日 | 5日 | - |
| SPHINCS+検証 | 0日 | **2日** | +2日 |
| **合計** | **59日** | **102日** | **+43日** |

---

## 6. リスクと対策

### 6.1 技術リスク

| リスク | 影響度 | 対策 |
|--------|:-----:|------|
| EditionConfig設計変更 | 高 | 仕様書レビュー優先 |
| L3 Aegis統合複雑性 | 中 | 段階的統合、テスト強化 |
| WebSocket負荷 | 中 | スケーラビリティ検証 |

### 6.2 スケジュールリスク

| リスク | 影響度 | 対策 |
|--------|:-----:|------|
| API実装遅延 | 高 | 優先度順に実装 |
| テスト不足 | 高 | TDD採用 |
| 仕様変更 | 中 | 変更管理プロセス |

---

## 7. 成功基準

### 7.1 Phase 5 完了基準

- [ ] 全8システム107画面が実APIと接続
- [ ] 92 APIエンドポイント実装完了
- [ ] EditionConfig.sol, ProverRegistry.sol デプロイ
- [ ] E2Eテスト全PASS
- [ ] i18n (日本語/英語) 対応完了
- [ ] Enterprise申込フロー実装

### 7.2 品質基準

- API応答時間: 95%ile < 500ms
- テストカバレッジ: > 80%
- セキュリティ監査: Critical/High 0件

---

## 8. 次のアクション（修正版 - ブロッカー優先）

### 8.0 🔴 最優先: Phase 5.0 ブロッカー解消（Week 1-4）

| # | タスク | 担当 | 工数 | 依存 |
|---|--------|------|:----:|------|
| **1** | **STARK Trace Matrix実装** | Backend | 5日 | なし |
| **2** | **STARK FRI Proof実装** | Backend | 5日 | #1 |
| **3** | **STARK Query Response実装** | Backend | 5日 | #2 |
| **4** | **React WASM初期化** | Frontend | 2日 | なし |
| **5** | **React Hooks実装** | Frontend | 3日 | #4 |
| **6** | **L3 fips204移行** | Backend | 3日 | なし |
| **7** | **L3 Node Wiring** | Backend | 4日 | #6 |
| **8** | **L3 TLS 1.3 mTLS** | Backend | 3日 | #7 |
| **9** | **L3 L1 State Root提出** | Backend | 3日 | #8 |

**並列実行可能**:
- #1-3 (STARK) と #4-5 (React) と #6-9 (L3) は並列可能
- 3チーム並列で約2週間に短縮可能

### 8.1 Phase 5.1 準備（Week 5-6）

10. **EditionConfig.sol 設計レビュー** - EDITION_SWITCH_SPEC.md との最終確認
11. **ProverRegistry.sol 設計レビュー** - 承認フロー詳細化
12. **認証基盤実装** - SIWE → JWT

### 8.2 短期（Week 7-8）

13. **Contract実装開始** - EditionConfig.sol
14. **Consumer App API実装** - Dashboard, History
15. **Token Hub API実装** - Lock, Delegate

### 8.3 中期（Week 9-12）

16. **Enterprise申込フロー** - モック + API + 統合
17. **Governance API実装**
18. **Event Bridge完成** - WebSocket, RabbitMQ, Redis
19. **SPHINCS+検証実装**
20. **i18n基盤導入**

---

## Appendix A: ファイルパス一覧

### A.1 モック

```
docs_new/01_phase/04_phase4/01_design/
├── system_01_consumer/wip/mocks/     (19 HTML)
├── system_02_token_hub/mocks/        (19 HTML)
├── system_03_governance/wip/mocks/   (6 HTML)
├── system_04_prover/wip/mocks/       (11 HTML)
├── system_05_observer/wip/mocks/     (7 HTML)
├── system_06_explorer/wip/mocks/     (8 HTML)
├── system_07_enterprise/wip/mocks/   (25 HTML)
└── system_08_qs_admin/wip/mocks/     (12 HTML)
```

### A.2 API実装

```
services/api/src/routes/
├── mod.rs
├── lock.rs        (✅ 実装済)
├── unlock.rs      (✅ 実装済)
├── status.rs      (✅ 実装済)
├── prover.rs      (✅ 部分実装)
├── edition.rs     (✅ 実装済)
├── admin.rs       (✅ 部分実装)
├── health.rs      (✅ 実装済)
├── auth.rs        (❌ 未実装)
├── user.rs        (❌ 未実装)
├── token_hub.rs   (❌ 未実装)
├── governance.rs  (❌ 未実装)
├── observer.rs    (❌ 未実装)
├── explorer.rs    (❌ 未実装)
└── enterprise.rs  (❌ 未実装)
```

### A.3 コントラクト

```
contracts/src/
├── L1Vault.sol           (✅ 実装済)
├── QuantumShield.sol     (✅ 実装済)
├── SPHINCSVerifier.sol   (✅ 実装済)
├── VRFConsumer.sol       (✅ 実装済)
├── core/
│   └── EditionConfig.sol (❌ 未実装)
└── prover/
    └── ProverRegistry.sol (❌ 未実装)

l3-aegis/src/governance/
├── GovernanceSwitch.sol  (✅ 実装済)
├── SecurityCouncil.sol   (✅ 実装済)
├── Governor.sol          (✅ 実装済)
└── Timelock.sol          (✅ 実装済)
```

---

## Appendix B: API エンドポイント全リスト

### B.1 実装済み (10 EP)

```
# Core
POST /v1/lock
POST /v1/unlock
POST /v1/unlock/emergency
GET  /v1/status/:lock_id
GET  /v1/status/pending

# Prover
POST /v1/prover/register
GET  /v1/prover/:prover_id

# Edition
GET  /v1/edition
POST /v1/edition/switch

# Health
GET  /v1/health
```

### B.2 未実装 (82 EP)

```
# Auth (3)
POST /v1/auth/siwe
POST /v1/auth/refresh
GET  /v1/auth/me

# User/Consumer (6)
GET  /v1/user/dashboard
GET  /v1/user/transactions
GET  /v1/user/transactions/:id
GET  /v1/user/settings
POST /v1/user/settings
GET  /v1/user/keys

# Token Hub (9)
GET  /v1/token-hub/dashboard
POST /v1/token-hub/lock
GET  /v1/token-hub/locks
POST /v1/token-hub/extend
GET  /v1/token-hub/delegates
POST /v1/token-hub/delegate
GET  /v1/token-hub/rewards
POST /v1/token-hub/claim
GET  /v1/token-hub/delegations/my

# Governance (8)
GET  /v1/governance/dashboard
GET  /v1/governance/proposals
GET  /v1/governance/proposals/:id
POST /v1/governance/proposals
POST /v1/governance/vote
GET  /v1/governance/votes/:id
GET  /v1/governance/activity
GET  /v1/governance/council

# Prover Extended (9)
GET  /v1/prover/dashboard
GET  /v1/prover/queue
GET  /v1/prover/queue/:id
POST /v1/prover/sign
GET  /v1/prover/metrics
GET  /v1/prover/alerts
GET  /v1/prover/challenges
POST /v1/prover/challenge-response
POST /v1/prover/exit

# Observer (8)
GET  /v1/observer/dashboard
GET  /v1/observer/pending-unlocks
GET  /v1/observer/suspicious-txs
GET  /v1/observer/history
POST /v1/observer/challenge
GET  /v1/observer/challenge/:id
GET  /v1/observer/earnings
POST /v1/observer/claim-earnings

# Explorer (12)
GET  /v1/explorer/overview
GET  /v1/explorer/search
GET  /v1/explorer/locks
GET  /v1/explorer/locks/:id
GET  /v1/explorer/unlocks
GET  /v1/explorer/unlocks/:id
GET  /v1/explorer/challenges
GET  /v1/explorer/challenges/:id
GET  /v1/explorer/address/:addr
GET  /v1/explorer/provers
GET  /v1/explorer/provers/:id
GET  /v1/explorer/analytics

# Enterprise Admin (19)
GET  /v1/enterprise/dashboard/overview
GET  /v1/enterprise/dashboard/tvl
GET  /v1/enterprise/dashboard/volume
GET  /v1/enterprise/transactions
GET  /v1/enterprise/transactions/:id
POST /v1/enterprise/transactions/export
GET  /v1/enterprise/users
GET  /v1/enterprise/users/:id
POST /v1/enterprise/users
POST /v1/enterprise/users/invite
POST /v1/enterprise/users/:id/role
GET  /v1/enterprise/api-keys
POST /v1/enterprise/api-keys
GET  /v1/enterprise/api-keys/:id/usage
GET  /v1/enterprise/settings
POST /v1/enterprise/settings
GET  /v1/enterprise/security-settings
GET  /v1/enterprise/reports
GET  /v1/enterprise/audit-log

# QS Admin Extended (11)
GET  /v1/admin/dashboard
GET  /v1/admin/transactions
GET  /v1/admin/nodes
GET  /v1/admin/staff
POST /v1/admin/staff
GET  /v1/admin/reports
GET  /v1/admin/audit-log
GET  /v1/admin/parameters
POST /v1/admin/parameters/change-request
GET  /v1/admin/enterprise/accounts
POST /v1/admin/enterprise/accounts
```

---

## Appendix C: バックエンドギャップ詳細ファイルリスト

### C.1 STARK Prover（要実装）

```
circuits/dilithium-stark/src/
├── witness.rs:55-87        # build_trace_matrix() → Vec::new() ❌
├── witness.rs:52           # ntt_traces: Vec::new() ❌
├── verification.rs:210-218 # expand_matrix_a_placeholder() → zeros ❌
└── constraints.rs:75-100+  # Constraint definitions incomplete ❌

stark-prover/src/
├── main.rs:481-491         # FRI proof generation → dummy ❌
└── main.rs:493-499         # Query responses → empty vec ❌

contracts/src/              # ✅ 検証側は完成
├── STARKVerifier.sol       # ✅ 660 lines, complete
└── FRIVerifier.sol         # ✅ 150+ lines, complete
```

### C.2 L3 Aegis（要完成）

```
l3-aegis/crates/aegis-node/src/
├── node.rs:51              # TODO: Add actual components ❌
├── node.rs:71              # TODO: Initialize components ❌
├── node.rs:140             # TODO: Implement production logic ❌
└── node.rs:162             # TODO: Graceful shutdown ❌

l3-aegis/crates/aegis-network/src/
└── transport.rs:37         # TODO: TLS 1.3 mTLS ❌

l3-aegis/crates/aegis-sequencer/src/
├── sequencer.rs:255        # TODO: Calculate state_root ❌
├── sequencer.rs:258        # TODO: Sign with Dilithium ❌
└── sequencer.rs:281        # TODO: Submit to L1 ❌

l3-aegis/crates/aegis-crypto/
└── Cargo.toml              # pqcrypto-dilithium → fips204 移行必要 ⚠️

l3-aegis/crates/aegis-consensus/
└── Cargo.toml              # pqcrypto-dilithium → fips204 移行必要 ⚠️
```

### C.3 React SDK（要実装）

```
packages/sdk/react/src/
├── useDilithium.ts:56      # sign() returns mock ❌
├── useDilithium.ts:64      # verify() always true ❌
├── useWallet.ts:62-65      # signMessage() returns random ❌
├── useLock.ts:58           # lock() returns mock response ❌
├── useUnlock.ts:71         # createSignedUnlock() returns mock ❌
└── QuantumShieldProvider.tsx:115-117  # WASM未初期化 ❌

packages/sdk/wasm/src/
└── lib.rs                  # ✅ WASM module is complete (fips204)

packages/sdk/typescript/src/
├── crypto.ts               # ✅ DilithiumCrypto class complete
└── client.ts               # ✅ QuantumShieldClient complete
```

### C.4 Event Bridge（要実装）

```
services/event-bridge/src/
├── indexer/listener.rs     # WebSocket未実装（polling only） ❌
├── rabbitmq_client.rs:21-24 # publish() is stub ❌
├── redis_client.rs         # EXISTS, GET, SET all TODOs ❌
├── queue.rs:93             # dequeue_l1_relay() → empty vec ❌
└── [L3 listener]           # 完全に未実装 ❌
```

### C.5 API SPHINCS+検証（要実装）

```
services/api/src/routes/
└── prover.rs:88-91         # validate_sphincs_pubkey() → prefix check only ❌
```

---

## Appendix D: 完了基準チェックリスト（修正版）

### D.1 Phase 5.0 完了基準

- [ ] STARK Prover: 実証明生成テスト通過
- [ ] STARK Prover: L1 STARKVerifier.solで検証成功
- [ ] React SDK: WASM初期化完了
- [ ] React SDK: useDilithium() 実署名生成確認
- [ ] React SDK: API呼び出しで署名検証成功
- [ ] L3 Aegis: fips204ライブラリ移行完了
- [ ] L3 Aegis: 4ノードネットワーク起動成功
- [ ] L3 Aegis: TLS 1.3 mTLS接続確認
- [ ] L3 Aegis: L1 State Root提出成功

### D.2 Phase 5 全体完了基準

- [ ] 全8システム107画面が実APIと接続
- [ ] 92 APIエンドポイント実装完了
- [ ] EditionConfig.sol, ProverRegistry.sol デプロイ
- [ ] Event Bridge: WebSocket通知動作
- [ ] Event Bridge: RabbitMQ/Redis統合完了
- [ ] SPHINCS+: 実検証ロジック実装
- [ ] E2Eテスト全PASS（実STARK証明使用）
- [ ] i18n (日本語/英語) 対応完了
- [ ] Enterprise申込フロー実装

---

**Document End** (Version 2.0)
