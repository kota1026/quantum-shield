# Phase 4 統合マスタープラン

> **Version**: 1.0  
> **Date**: 2026-01-04  
> **Status**: 📋 DRAFT - Kota承認待ち  
> **Purpose**: 全Phase 4ドキュメントの統合 + エージェントプロンプト連携 + 実装計画

---

## 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [Phase 4ドキュメント体系](#2-phase-4ドキュメント体系)
3. [11エージェント会議決定事項](#3-11エージェント会議決定事項)
4. [統合実装計画](#4-統合実装計画)
5. [エージェントプロンプト連携](#5-エージェントプロンプト連携)
6. [CDO/CIAレビュー対応状況](#6-cdociaレビュー対応状況)
7. [Phase移行チェックリスト](#7-phase移行チェックリスト)
8. [次のステップ](#8-次のステップ)

---

## 1. エグゼクティブサマリー

### 1.1 Phase 4の目的

Phase 1-3で実装済みのコンポーネントを**統合**し、E2Eテストを完了させ、4ペルソナ向け管理画面を実装してローンチ準備を完了する。

### 1.2 根本課題（発見事項）

> **これは実装問題ではなく統合問題である**

| カテゴリ | 数量 | 状態 |
|---------|------|------|
| L1 Solidity コントラクト | 82+ ファイル | ✅ 実装済み（孤立） |
| L3 Rust クレート | 11 クレート | ✅ 実装済み（孤立） |
| シーケンス定義 | 8 + 1 補助 | ✅ 定義済み |
| PIR レビュー | 40+ 件 | ✅ 完了 |
| テスト | 1,424+ | ✅ Pass |

### 1.3 Phase 4成果物一覧

| # | 成果物 | 優先度 | 週 |
|---|--------|:------:|:--:|
| 1 | Event Bridge Service (Multi-Relayer) | P0 | W1 |
| 2 | Lock/Unlock API | P0 | W2 |
| 3 | Signature Queue Service | P0 | W2 |
| 4 | Edition Manager統合 | P0 | W2 |
| 5 | Dilithium WASM Module (<500ms) | P0 | W3 |
| 6 | Admin Dashboard MVP | P1 | W4-5 |
| 7 | End User App MVP | P1 | W5-6 |
| 8 | E2E Tests Complete | P1 | W6-7 |
| 9 | Prover Dashboard MVP | P2 | W7-8 |

### 1.4 ネットワーク接続前提

```
┌─────────────────────────────────────────────────────────────────┐
│                    Phase 4 ネットワーク構成                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   L1: Ethereum Sepolia Testnet                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  • Phase 3.3で11コントラクトデプロイ済み                 │   │
│   │  • L1Vault, VRFConsumer, SPHINCSVerifier等              │   │
│   │  • Mainnet移行: Phase 5以降                             │   │
│   └─────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                    Event Bridge                                  │
│                    (Phase 4で実装)                               │
│                           │                                      │
│   L3: Aegis Chain (自社開発)                                    │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  • Phase 3で開発完了（l3-aegis/ 11クレート）            │   │
│   │  • BFT 4ノードコンセンサス                              │   │
│   │  • Dilithium-III量子耐性署名                            │   │
│   │  • SHA3-256 SMT（SR_0/SR_1）                           │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### L1: Ethereum Sepolia（デプロイ済み）

| コントラクト | 状態 | 用途 |
|-------------|:----:|------|
| L1Vault.sol | ✅ デプロイ済 | Lock/Unlock管理 |
| VRFConsumer.sol | ✅ デプロイ済 | Prover選出（Chainlink VRF） |
| SPHINCSVerifier.sol | ✅ デプロイ済 | 量子耐性署名検証 |
| STARKVerifier.sol | ✅ デプロイ済 | ZK-STARK検証 |
| GovernanceSwitch.sol | ✅ デプロイ済 | Enterprise/Decentralized切替 |
| SecurityCouncil.sol | ✅ デプロイ済 | 5/9緊急停止 |
| ProverRegistry.sol | ✅ デプロイ済 | Prover登録管理 |
| Treasury.sol | ✅ デプロイ済 | 7日TimeLock |
| QSInflation.sol | ✅ デプロイ済 | 5%→1% 4年逓減 |
| RewardDistributor.sol | ✅ デプロイ済 | 報酬配分 |
| EconomicParameters.sol | ✅ デプロイ済 | CP-3/CP-4保護 |

#### L3: Aegis Chain（開発済み）

| クレート | 状態 | 用途 |
|---------|:----:|------|
| aegis-consensus | ✅ 開発済 | BFT 4ノードコンセンサス |
| aegis-crypto | ✅ 開発済 | Dilithium-III署名 |
| aegis-smt | ✅ 開発済 | SHA3-256 Sparse Merkle Tree |
| aegis-sequencer | ✅ 開発済 | TX順序付け |
| aegis-core | ✅ 開発済 | コアロジック |
| aegis-types | ✅ 開発済 | 共通型定義 |
| aegis-network | ✅ 開発済 | P2P通信 |
| aegis-storage | ✅ 開発済 | RocksDB永続化 |
| aegis-node | ✅ 開発済 | ノード実行 |
| aegis-cli | ✅ 開発済 | CLI操作 |
| aegis-keygen | ✅ 開発済 | Dilithium鍵生成 |

### 1.5 会議決定事項サマリー（2026-01-04）

| 決定 | 内容 |
|------|------|
| Relayer構成 | Multi-Relayer (2台初期) |
| Dilithium WASM性能目標 | <500ms |
| SP Portal | Phase 4.5に延期 |
| プロンプト構造 | ベース+モジュール方式 |
| 投票結果 | 13/13 Go（全員承認） |

---

## 2. Phase 4ドキュメント体系

### 2.1 既存ドキュメント一覧

```
docs_new/01_phase/04_phase4/
├── PHASE4_PLAN.md (24KB)                    # 8週間実装計画
├── SEQUENCE_IMPLEMENTATION_MAP.md (24KB)    # シーケンス別実装マッピング
├── INTEGRATED_SYSTEM_BLUEPRINT_JP.md (28KB) # 統合ブループリント
├── UI_UX_FUNCTIONAL_REQUIREMENTS_JP.md (23KB) # UI/UX機能要件
├── EVENT_BRIDGE_SPEC.md (22KB)              # Event Bridge仕様
├── EDITION_SWITCH_SPEC.md (31KB)            # Edition切替仕様
├── PROVER_REGISTRATION_FLOW.md (41KB)       # Prover登録フロー
├── TEST_STRATEGY.md (32KB)                  # E2Eテスト戦略
├── CDO_CIA_REVIEW_REPORT.md (8KB)           # CDO/CIAレビュー結果
├── AGENT_MEETING_MINUTES_20260104.md (8KB)  # 会議議事録
└── phase4.md (7KB)                          # Phase 4チェックリスト
```

**合計**: 11ファイル、約250KB

### 2.2 ドキュメント参照マップ

```
┌─────────────────────────────────────────────────────────────────┐
│                    Phase 4 ドキュメント参照マップ                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PHASE4_PLAN.md ←─────────────────────────────────────────────┐ │
│       │                                                       │ │
│       ├──► SEQUENCE_IMPLEMENTATION_MAP.md                     │ │
│       │         │                                             │ │
│       │         ├──► EVENT_BRIDGE_SPEC.md                     │ │
│       │         ├──► EDITION_SWITCH_SPEC.md                   │ │
│       │         └──► PROVER_REGISTRATION_FLOW.md              │ │
│       │                                                       │ │
│       ├──► INTEGRATED_SYSTEM_BLUEPRINT_JP.md                  │ │
│       │         │                                             │ │
│       │         └──► UI_UX_FUNCTIONAL_REQUIREMENTS_JP.md      │ │
│       │                                                       │ │
│       ├──► TEST_STRATEGY.md                                   │ │
│       │                                                       │ │
│       └──► phase4.md (チェックリスト)                         │ │
│                                                               │ │
│  CDO_CIA_REVIEW_REPORT.md ──► 各仕様書の改善点               │ │
│  AGENT_MEETING_MINUTES_20260104.md ──► 決定事項 ─────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 各ドキュメントの役割

| ドキュメント | 役割 | 主な参照者 |
|-------------|------|-----------|
| PHASE4_PLAN.md | 週次スケジュール、タスクID | 01_plan.md, 07_gonogo.md |
| SEQUENCE_IMPLEMENTATION_MAP.md | 実装対象シーケンス | 02_spec.md, 03_impl.md |
| INTEGRATED_SYSTEM_BLUEPRINT_JP.md | コンポーネント統合 | 全エージェント |
| UI_UX_FUNCTIONAL_REQUIREMENTS_JP.md | UI実装要件 | 03_impl.md |
| EVENT_BRIDGE_SPEC.md | Event Bridge詳細 | 03_impl.md |
| EDITION_SWITCH_SPEC.md | Edition切替 | 03_impl.md |
| PROVER_REGISTRATION_FLOW.md | Prover登録 | 03_impl.md |
| TEST_STRATEGY.md | テスト基準 | 04_review.md |
| CDO_CIA_REVIEW_REPORT.md | 改善指摘 | 04_review.md |
| AGENT_MEETING_MINUTES_20260104.md | 決定事項 | 全エージェント |
| phase4.md | 進捗チェック | 05_pir.md, 07_gonogo.md |

---

## 3. 11エージェント会議決定事項

### 3.1 投票結果

| エージェント | 投票 | 条件 |
|-------------|:----:|------|
| Purpose Guardian | ✅ Go | - |
| CTO | ✅ Go | VRF/HSM/API認証の詳細設計をPhase 4初期に完了 |
| CSO | ✅ Go | Red Teamレビュー実施、HSM mTLS必須化 |
| CFO | ✅ Go | - |
| CBO | ✅ Go | Proverドキュメント整備 |
| Engineer | ✅ Go | テスト込み25日で見積もり |
| Crypto Auditor | ✅ Go | - |
| Red Team | ✅ Go | 実装前セキュリティレビュー |
| Researcher | ✅ Go | - |
| DevOps | ✅ Go | SREレビュー実施 |
| Legal | ✅ Go | - |
| CDO | ✅ Go | UI/UXは実装フェーズで完成 |
| CIA | ✅ Go | - |

**結果**: 13/13 Go（全員承認）

### 3.2 条件付き承認事項

| # | 項目 | 担当 | 期限 |
|---|------|------|------|
| 1 | VRF Integration詳細設計 | CTO/Engineer | Phase 4 Week 1 |
| 2 | API認証設計 | CIA/Engineer | Phase 4 Week 1 |
| 3 | HSM mTLS設計 | CSO/DevOps | Phase 4 Week 1 |
| 4 | Red Teamセキュリティレビュー | Red Team | Phase 4 Week 2 |
| 5 | End User UI詳細設計 | CDO | Phase 4 Week 2-3 |

### 3.3 予算承認（CFO）

| 項目 | 工数 | コスト概算 |
|------|:----:|-----------|
| Event Bridge | 20日 | $40K |
| API認証設計 | 5日 | $10K |
| UI/UX実装 | 15日 | $30K |
| テスト | 10日 | $20K |
| **合計** | **50日** | **$100K** |

---

## 4. 統合実装計画

### 4.1 8週間スケジュール

```
Week 15 (W1): Infrastructure - Event Bridge
├── INFRA-001: Event Bridge設計確定
├── INFRA-002: L1→L3 Event Indexer
├── INFRA-003: L3→L1 Relayer (2台構成)
├── INFRA-004: Event Bridge統合テスト
├── INFRA-005: HSM_INTEGRATION_SPEC.md
└── PROMPT-001: プロンプトパス修正

Week 16 (W2): Infrastructure - API Layer
├── API-001: OpenAPI 3.0スキーマ定義
├── API-002: Lock API実装
├── API-003: Unlock API実装
├── API-004: Status Tracker API
├── API-005: Signature Queue Service
├── API-006: Edition Manager統合
└── INFRA-006: INCIDENT_RESPONSE_PLAN.md

Week 17 (W3): Client SDK
├── SDK-001: Dilithium WASM Module (<500ms)
├── SDK-002: NIST KAT検証
├── SDK-003: TypeScript SDK
├── SDK-004: React Hooks
├── SDK-005: SDK Documentation
└── AUDIT-001: AUDIT_SCOPE.md作成

Week 18-19 (W4-5): Admin Dashboard MVP
├── UI-001: システム概要ダッシュボード
├── UI-002: L3ノード状態監視
├── UI-003: Emergency Pause機能
├── UI-004: 監査ログ表示
├── UI-005: Edition切替UI
└── UI-006: Prover管理基本画面

Week 19-20 (W5-6): End User App MVP
├── UI-007: ウォレット接続
├── UI-008: Dilithium鍵生成UI
├── UI-009: Lock画面
├── UI-010: Unlock画面（通常/緊急）
├── UI-011: Time Lock表示
└── UI-012: 資産残高・履歴

Week 20-21 (W6-7): E2E Testing
├── TEST-004: Slither Full Scan
├── TEST-005: Red Team Simulation
├── TEST-006: Full System E2E
├── TEST-007: Lock→Unlock フローテスト
├── TEST-008: Edition切替テスト
└── TEST-009: 負荷テスト

Week 21-22 (W7-8): Prover Dashboard & Polish
├── UI-013: Prover登録フロー
├── UI-014: Stake管理
├── UI-015: 署名キュー表示
├── UI-016: 報酬確認・引出
├── DOC-001: 運用ドキュメント整備
├── DOC-002: API Documentation
└── GONOGO-001: Go/No-Go準備
```

### 4.2 依存関係図

```
Week 1: Event Bridge
    │
    ▼
Week 2: API Layer (depends on Event Bridge)
    │
    ▼
Week 3: Client SDK (depends on API)
    │
    ▼
Week 4-5: Admin Dashboard (depends on API)
    │
    ▼
Week 5-6: End User App (depends on SDK)
    │
    ▼
Week 6-7: E2E Testing (depends on UI)
    │
    ▼
Week 7-8: Prover Dashboard + Polish
```

### 4.3 コンポーネント統合アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│                      統合システムアーキテクチャ                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌───────────────────────────────────────────────────────┐    │
│    │                  UI Layer (React)                      │    │
│    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │    │
│    │  │  Admin   │ │   User   │ │  Prover  │ │    SP    │ │    │
│    │  │Dashboard │ │   App    │ │Dashboard │ │  Portal  │ │    │
│    │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────────┘ │    │
│    └───────┼────────────┼────────────┼───────────────────────┘    │
│            │            │            │                            │
│    ┌───────┼────────────┼────────────┼───────────────────────┐    │
│    │       │  Client SDK (TypeScript + WASM)                 │    │
│    │       │  ┌─────────────────┐ ┌─────────────────────┐    │    │
│    │       └──│   React Hooks   │ │  Dilithium WASM     │    │    │
│    │          └────────┬────────┘ └─────────────────────┘    │    │
│    └───────────────────┼─────────────────────────────────────┘    │
│                        │                                          │
│    ┌───────────────────┼─────────────────────────────────────┐    │
│    │                   │       API Gateway                    │    │
│    │  ┌────────────────▼────────────────────────────────┐    │    │
│    │  │            REST/gRPC API Layer                   │    │    │
│    │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────────┐   │    │    │
│    │  │  │Lock │ │Unlock│ │Status│ │Admin│ │Sig Queue│   │    │    │
│    │  │  │ API │ │ API  │ │ API │ │ API │ │ Service │   │    │    │
│    │  │  └──┬──┘ └──┬───┘ └──┬──┘ └──┬──┘ └────┬────┘   │    │    │
│    │  └─────┼───────┼────────┼───────┼─────────┼────────┘    │    │
│    └────────┼───────┼────────┼───────┼─────────┼─────────────┘    │
│             │       │        │       │         │                  │
│    ┌────────┼───────┼────────┼───────┼─────────┼─────────────┐    │
│    │        │  Event Bridge Service (Multi-Relayer 2台)      │    │
│    │        │  ┌──────────────────────────────────────┐      │    │
│    │        └──│  Sepolia↔Aegis Event Indexer+Relayer │      │    │
│    │           └──────────────────┬───────────────────┘      │    │
│    └──────────────────────────────┼──────────────────────────┘    │
│                                   │                               │
│  ┌────────────────────────────────┼────────────────────────────┐  │
│  │                                │                            │  │
│  │  L1: Ethereum Sepolia          │       L3: Aegis Chain      │  │
│  │  (11コントラクトデプロイ済)     │       (自社開発L3)          │  │
│  │  ┌──────────────────┐          │    ┌──────────────────┐   │  │
│  │  │  L1Vault         │◄─────────┼────│  BFT 4-Node      │   │  │
│  │  │  VRFConsumer     │          │    │  Consensus       │   │  │
│  │  │  SPHINCSVerifier │          │    │  aegis-crypto    │   │  │
│  │  │  STARKVerifier   │          │    │  (Dilithium-III) │   │  │
│  │  │  GovernanceSwitch│          │    │  aegis-smt       │   │  │
│  │  │  SecurityCouncil │          │    │  (SHA3-256 SMT)  │   │  │
│  │  │  ProverRegistry  │          │    │  aegis-sequencer │   │  │
│  │  │  Treasury        │          │    │  aegis-node      │   │  │
│  │  └──────────────────┘          │    └──────────────────┘   │  │
│  │                                │                            │  │
│  └────────────────────────────────┴────────────────────────────┘  │
│                                                                   │
│  ※ Mainnet移行: Phase 5以降                                      │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### 4.4 シーケンス実装状況

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

---

## 5. エージェントプロンプト連携

### 5.1 プロンプト修正状況

| プロンプト | 現状態 | 修正内容 |
|-----------|:------:|----------|
| 01_plan.md | ✅ Phase 4対応済み | - |
| 02_spec.md | ⚠️ 古いパス | `docs/` → `docs_new/` 移行 |
| 03_impl.md | ⚠️ 古いパス | パス修正 + Phase 4セクション追加 |
| 04_review.md | ⚠️ 古いパス | `docs/` → `docs_new/` 移行 |
| 05_pir.md | ⚠️ 古いパス | `docs/` → `docs_new/` 移行 |
| 06_update.md | ⚠️ 古いパス | `docs/` → `docs_new/` 移行 |
| 07_gonogo.md | ⚠️ 古いパス | パス修正 + Phase 4基準追加 |

### 5.2 プロンプト→ドキュメント参照マップ

```
┌─────────────────────────────────────────────────────────────────┐
│           エージェントプロンプト → Phase 4ドキュメント           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  01_plan.md (計画)                                              │
│  └──► PHASE4_PLAN.md (週次スケジュール、タスクID)               │
│  └──► SEQUENCE_IMPLEMENTATION_MAP.md (実装対象シーケンス)       │
│                                                                  │
│  02_spec.md (仕様)                                              │
│  └──► EVENT_BRIDGE_SPEC.md (Event Bridge詳細)                   │
│  └──► EDITION_SWITCH_SPEC.md (Edition切替詳細)                  │
│  └──► PROVER_REGISTRATION_FLOW.md (Prover登録詳細)              │
│                                                                  │
│  03_impl.md (実装)                                              │
│  └──► UI_UX_FUNCTIONAL_REQUIREMENTS_JP.md (UI実装要件)          │
│  └──► SEQUENCE_IMPLEMENTATION_MAP.md (既存/新規コード)          │
│  └──► INTEGRATED_SYSTEM_BLUEPRINT_JP.md (コンポーネント配置)    │
│                                                                  │
│  04_review.md (レビュー)                                        │
│  └──► TEST_STRATEGY.md (テスト基準)                             │
│  └──► CDO_CIA_REVIEW_REPORT.md (改善指摘)                       │
│                                                                  │
│  05_pir.md (PIR)                                                │
│  └──► phase4.md (進捗チェック)                                  │
│  └──► PHASE4_PLAN.md (成功基準)                                 │
│                                                                  │
│  07_gonogo.md (Go/No-Go)                                        │
│  └──► PHASE4_PLAN.md §9 (Go/No-Go判定基準)                      │
│  └──► AGENT_MEETING_MINUTES_20260104.md (会議決定事項)          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 パス変換マッピング（共通）

| 旧パス | 新パス |
|--------|--------|
| `docs/constitution/CORE_PRINCIPLES.md` | `docs_new/00_core/CORE_PRINCIPLES.md` |
| `docs/planning/CURRENT_STATE.md` | `docs_new/01_phase/CURRENT_STATE.md` |
| `docs/planning/CURRENT_PLAN.md` | `docs_new/01_phase/CURRENT_PLAN.md` |
| `docs/planning/SPEC_STRATEGY_BRIDGE.md` | `docs_new/00_core/specs/SPEC_STRATEGY_BRIDGE.md` |
| `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | `docs_new/00_core/sequences/SEQUENCES_v2.0.md` |
| `docs/aegis/L3_CHAIN_SPECIFICATION.md` | `docs_new/00_core/specs/L3_CHAIN_SPECIFICATION.md` |
| `docs/aegis/meetings/` | `docs_new/01_phase/[phase]/meetings/` |
| `docs/aegis/pir/` | `docs_new/01_phase/[phase]/pir/` |
| `docs/specs/MODULAR_ARCHITECTURE.md` | `docs_new/00_core/specs/MODULAR_ARCHITECTURE.md` |
| `docs/checklists/` | `docs_new/01_phase/[phase]/checklists/` |

### 5.4 03_impl.md Phase 4追加セクション（案）

```markdown
### Phase 4関連タスクの場合（追加確認）

以下のドキュメントを確認すること：

1. **Phase 4計画書**
   - `docs_new/01_phase/04_phase4/PHASE4_PLAN.md`
   - 週次スケジュール、タスクID、依存関係

2. **UI/UX機能要件**
   - `docs_new/01_phase/04_phase4/UI_UX_FUNCTIONAL_REQUIREMENTS_JP.md`
   - ペルソナ別画面フロー、必要API一覧

3. **シーケンス実装マップ**
   - `docs_new/01_phase/04_phase4/SEQUENCE_IMPLEMENTATION_MAP.md`
   - 既存コード、新規必要コード、統合チェックリスト

4. **技術仕様書**（該当タスクに応じて）
   - `docs_new/01_phase/04_phase4/EVENT_BRIDGE_SPEC.md` (INFRA-001~004)
   - `docs_new/01_phase/04_phase4/EDITION_SWITCH_SPEC.md` (API-006)
   - `docs_new/01_phase/04_phase4/PROVER_REGISTRATION_FLOW.md` (UI-013~016)

#### Phase 4実装ガイドライン

| Week | Track | 主要成果物 |
|:----:|-------|-----------|
| W1 | Infrastructure | Event Bridge Service |
| W2 | Infrastructure | Lock/Unlock API, Signature Queue |
| W3 | Client SDK | Dilithium WASM, TypeScript SDK |
| W4-5 | UI/UX | Admin Dashboard MVP |
| W5-6 | UI/UX | End User App MVP |
| W6-7 | Testing | E2E Tests Complete |
| W7-8 | Polish | Prover Dashboard, Documentation |

#### Phase 4制約事項

⚠️ **優先度遵守**: P0タスクは前週完了が必須
⚠️ **依存関係**: Event Bridge → API → SDK → UI の順序厳守
⚠️ **スコープ制限**: SP Portalは Phase 4.5に延期済み
```

---

## 6. CDO/CIAレビュー対応状況

### 6.1 CDO指摘と対応状況

| # | 指摘 | 深刻度 | 対応状況 | 対応時期 |
|---|------|:------:|:--------:|----------|
| CDO-1 | End User Lock/Unlock画面のワイヤーフレームなし | 高 | ⏳ 予定 | Phase 4 W5-6 |
| CDO-2 | エラーリカバリUI未定義 | 中 | ⏳ 予定 | Phase 4 W5-6 |
| CDO-3 | Mobile対応の考慮なし | 中 | ⏳ 延期 | Phase 4.5 |
| CDO-4 | アクセシビリティ要件なし | 低 | ⏳ 延期 | Phase 5 |
| CDO-5 | Prover Dashboard画面詳細なし | 高 | ⏳ 予定 | Phase 4 W7-8 |
| CDO-6 | Admin Dashboard画面詳細なし | 高 | ⏳ 予定 | Phase 4 W4-5 |
| CDO-7 | Emergency Unlock UX設計不足 | 高 | ⏳ 予定 | Phase 4 W5-6 |
| CDO-8 | 多言語対応の考慮なし | 低 | ⏳ 延期 | Phase 5 |

### 6.2 CIA指摘と対応状況

| # | 指摘 | 深刻度 | 対応状況 | 対応時期 |
|---|------|:------:|:--------:|----------|
| CIA-1 | L1↔L3 Event Bridge未設計 | 致命的 | ✅ 解決済 | EVENT_BRIDGE_SPEC.md作成 |
| CIA-2 | VRF Integration詳細なし | 高 | ⏳ 予定 | Phase 4 W1 |
| CIA-3 | Signature Queue Serviceアーキテクチャ未定義 | 高 | ⏳ 予定 | Phase 4 W2 |
| CIA-4 | HSM通信プロトコル未定義 | 高 | ⏳ 予定 | Phase 4 W1 |
| CIA-5 | API認証・認可設計なし | 高 | ⏳ 予定 | Phase 4 W1 |
| CIA-6 | レート制限設計なし | 中 | ⏳ 予定 | Phase 4 W2 |
| CIA-7 | 監視・アラート設計なし | 中 | ⏳ 予定 | Phase 4 W2 |
| CIA-8 | データベーススキーマ未定義 | 中 | ⏳ 予定 | Phase 4 W2 |
| CIA-9 | 障害復旧設計なし | 高 | ⏳ 予定 | Phase 4 W2 |
| CIA-10 | テスト戦略未定義 | 中 | ✅ 解決済 | TEST_STRATEGY.md作成 |

### 6.3 クロスレビュー（CDO × CIA）

| # | 項目 | CDO視点 | CIA視点 | 対応状況 |
|---|------|---------|---------|:--------:|
| X-1 | 進捗表示 | リアルタイム更新必要 | WebSocket/SSE設計なし | ⏳ W4-5 |
| X-2 | Prover選出表示 | VRF結果表示必要 | VRF結果取得API未定義 | ⏳ W2 |
| X-3 | Gas見積もり | UI表示必要 | Gas見積もりAPI未定義 | ⏳ W2 |
| X-4 | 24h TimeLock | カウントダウン表示必要 | TimeLock状態取得API未定義 | ⏳ W2 |

---

## 7. Phase移行チェックリスト

### 7.1 Phase 3.3完了条件

| 条件 | 現状 | 必要アクション |
|------|:----:|----------------|
| Track A Decentralize | ✅ 100% | - |
| IC-2 CoreLayer | ⚠️ CONDITIONAL | STARK Verifier統合（Phase 4内で対応可） |
| TEST-004 Slither | ⬜ 未実施 | 実行必須 |
| TEST-005 Red Team | ⬜ 未実施 | 実行必須 |
| TEST-006~010 | ⬜ 未実施 | Phase 4並行可 |

### 7.2 Phase 4開始Go/No-Go判定基準

```markdown
Phase 4開始 Go/No-Go チェックリスト:

必須条件（ALL PASS）:
- [ ] Track A Decentralize 100%完了
- [ ] TEST-004 Slither Critical/High = 0
- [ ] TEST-005 Red Team 重大脆弱性 = 0
- [ ] IC-2 CONDITIONAL条件の対応計画確定
- [ ] Phase 4ドキュメント承認済み

推奨条件:
- [ ] TEST-006~010の50%以上完了
- [ ] エージェントプロンプト修正完了
```

### 7.3 Phase 4完了Go/No-Go判定基準

| 基準 | 条件 | Weight |
|------|------|:------:|
| E2E統合 | Event Bridge + API + SDK動作 | 30% |
| Admin Dashboard | MVP機能完了 | 15% |
| End User App | MVP機能完了 | 15% |
| E2Eテスト | 全シナリオPASS | 25% |
| セキュリティ | Slither Critical/High = 0 | 10% |
| 性能 | Dilithium WASM <500ms | 5% |

**GO判定**: 総合スコア 85点以上

---

## 8. 次のステップ

### 8.1 即時アクション（今回セッション）

| # | アクション | 担当 | 状態 |
|---|-----------|------|:----:|
| 1 | Phase 4ドキュメント体系確認 | Claude | ✅ 完了 |
| 2 | 統合マスタープラン作成（本ドキュメント） | Claude | ✅ 完了 |
| 3 | Kota承認 | Kota | ⬜ 待ち |
| 4 | GitHubへ格納 | Kota/Claude | ⬜ 待ち |

### 8.2 次回セッション（プロンプト修正）

| # | アクション | 工数 |
|---|-----------|:----:|
| 1 | 02_spec.md パス修正 | 30分 |
| 2 | 03_impl.md パス修正 + Phase 4セクション追加 | 45分 |
| 3 | 04_review.md パス修正 | 30分 |
| 4 | 05_pir.md パス修正 | 20分 |
| 5 | 06_update.md パス修正 | 15分 |
| 6 | 07_gonogo.md パス修正 + Phase 4基準追加 | 40分 |
| **合計** | | **約3時間** |

### 8.3 Phase 4実装開始（プロンプト修正後）

| Week | 主要タスク |
|:----:|-----------|
| W1 | Event Bridge実装 + VRF/HSM/API認証設計 |
| W2 | API Layer実装 + Signature Queue |
| W3 | Client SDK + Dilithium WASM |
| W4-5 | Admin Dashboard MVP |
| W5-6 | End User App MVP |
| W6-7 | E2E Testing |
| W7-8 | Prover Dashboard + Launch Prep |

---

## 付録A: ディレクトリ構造（最終形）

```
docs_new/
├── 00_core/                              # 憲法・仕様書
│   ├── CORE_PRINCIPLES.md
│   ├── specs/
│   │   ├── SPEC_STRATEGY_BRIDGE.md
│   │   ├── L3_CHAIN_SPECIFICATION.md
│   │   ├── MODULAR_ARCHITECTURE.md
│   │   ├── HSM_INTEGRATION_SPEC.md      ← Phase 4 W1
│   │   └── API_SPECIFICATION.md         ← Phase 4 W2
│   └── sequences/
│       └── SEQUENCES_v2.0.md
│
├── 01_phase/
│   ├── CURRENT_STATE.md
│   ├── CURRENT_PLAN.md
│   ├── 03_Phase3/
│   │   ├── PHASE3_STRATEGY.md
│   │   ├── meetings/
│   │   ├── pir/
│   │   └── checklists/
│   └── 04_phase4/                        ← 今回統合
│       ├── PHASE4_PLAN.md               ✅
│       ├── PHASE4_MASTER_INTEGRATION_PLAN.md ← 本ドキュメント
│       ├── SEQUENCE_IMPLEMENTATION_MAP.md ✅
│       ├── INTEGRATED_SYSTEM_BLUEPRINT_JP.md ✅
│       ├── UI_UX_FUNCTIONAL_REQUIREMENTS_JP.md ✅
│       ├── EVENT_BRIDGE_SPEC.md         ✅
│       ├── EDITION_SWITCH_SPEC.md       ✅
│       ├── PROVER_REGISTRATION_FLOW.md  ✅
│       ├── TEST_STRATEGY.md             ✅
│       ├── CDO_CIA_REVIEW_REPORT.md     ✅
│       ├── AGENT_MEETING_MINUTES_20260104.md ✅
│       ├── phase4.md                    ✅
│       ├── meetings/                    ← Phase 4会議議事録
│       ├── pir/                         ← Phase 4 PIRレポート
│       └── checklists/                  ← Phase 4チェックリスト
│
└── 02_agents_prompt/
    ├── 01_Agent strategic meeting format/
    └── 02_prompts/
        ├── 01_plan.md                   ✅ Phase 4対応済み
        ├── 02_spec.md                   ⚠️ 次回修正
        ├── 03_impl.md                   ⚠️ 次回修正
        ├── 04_review.md                 ⚠️ 次回修正
        ├── 05_pir.md                    ⚠️ 次回修正
        ├── 06_update.md                 ⚠️ 次回修正
        └── 07_gonogo.md                 ⚠️ 次回修正
```

---

## 付録B: 関連ドキュメントリンク

### Phase 4ドキュメント

| ドキュメント | GitHub URL |
|-------------|------------|
| PHASE4_PLAN.md | [Link](https://github.com/kota1026/quantum-shield/blob/dev/phase2-native-stark/docs_new/01_phase/04_phase4/PHASE4_PLAN.md) |
| SEQUENCE_IMPLEMENTATION_MAP.md | [Link](https://github.com/kota1026/quantum-shield/blob/dev/phase2-native-stark/docs_new/01_phase/04_phase4/SEQUENCE_IMPLEMENTATION_MAP.md) |
| INTEGRATED_SYSTEM_BLUEPRINT_JP.md | [Link](https://github.com/kota1026/quantum-shield/blob/dev/phase2-native-stark/docs_new/01_phase/04_phase4/INTEGRATED_SYSTEM_BLUEPRINT_JP.md) |
| EVENT_BRIDGE_SPEC.md | [Link](https://github.com/kota1026/quantum-shield/blob/dev/phase2-native-stark/docs_new/01_phase/04_phase4/EVENT_BRIDGE_SPEC.md) |

### エージェントプロンプト

| プロンプト | GitHub URL |
|-----------|------------|
| 01_plan.md | [Link](https://github.com/kota1026/quantum-shield/blob/dev/phase2-native-stark/docs_new/02_agents_prompt/02_prompts/01_plan.md) |
| 03_impl.md | [Link](https://github.com/kota1026/quantum-shield/blob/dev/phase2-native-stark/docs_new/02_agents_prompt/02_prompts/03_impl.md) |

---

## 変更履歴

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-04 | 初版作成 - 全Phase 4ドキュメント統合 |

---

**END OF PHASE 4 MASTER INTEGRATION PLAN**
