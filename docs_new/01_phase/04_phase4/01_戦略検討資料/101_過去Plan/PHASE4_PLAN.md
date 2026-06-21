# Phase 4 実装計画書 (PHASE4_PLAN.md)

> **Version**: 2.0  
> **Date**: 2026-01-04  
> **Status**: 🔄 ACTIVE  
> **Duration**: Weeks 15-22 (8 weeks)  
> **Prerequisites**: Phase 3.3 Track B E2E Testing Complete  
> **Decision Source**: 11-Agent Strategic Meeting (2026-01-04)

---

## 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [Phase 4 概要](#2-phase-4-概要)
3. [週次実装スケジュール](#3-週次実装スケジュール)
4. [コンポーネント詳細](#4-コンポーネント詳細)
5. [ペルソナ別UI/UX実装](#5-ペルソナ別uiux実装)
6. [E2Eテスト計画](#6-e2eテスト計画)
7. [プロンプト修正計画](#7-プロンプト修正計画)
8. [リスク管理](#8-リスク管理)
9. [成功基準・Go/No-Go](#9-成功基準gonogo)
10. [参照ドキュメント](#10-参照ドキュメント)

---

## 1. エグゼクティブサマリー

### 目的
Phase 1-3で実装済みのコンポーネントを統合し、E2Eテストを完了させ、4ペルソナ向け管理画面を実装してローンチ準備を完了する。

### 主要成果物

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

### 会議決定事項（2026-01-04）

| 決定 | 内容 |
|------|------|
| Relayer構成 | Multi-Relayer (2台初期) |
| Dilithium WASM性能目標 | <500ms |
| SP Portal | Phase 4.5に延期 |
| プロンプト構造 | ベース+モジュール方式 |

---

## 2. Phase 4 概要

### 2.1 フェーズ構成

```
Phase 4: Integration & Launch (8 Weeks)
├── Track A: Infrastructure (Week 1-3)
│   ├── Event Bridge Service
│   ├── API Layer
│   └── Client SDK
├── Track B: UI/UX (Week 4-6)
│   ├── Admin Dashboard MVP
│   └── End User App MVP
├── Track C: Testing & Polish (Week 6-8)
│   ├── E2E Testing
│   ├── Security Review
│   └── Prover Dashboard MVP
└── Track D: Launch Prep (Week 8)
    ├── Documentation
    └── Go/No-Go Decision
```

### 2.2 依存関係

```
Week 1: Event Bridge
    ↓
Week 2: API Layer (depends on Event Bridge)
    ↓
Week 3: Client SDK (depends on API)
    ↓
Week 4-5: Admin Dashboard (depends on API)
    ↓
Week 5-6: End User App (depends on SDK)
    ↓
Week 6-7: E2E Testing (depends on UI)
    ↓
Week 7-8: Prover Dashboard + Polish
```

---

## 3. 週次実装スケジュール

### Week 1: Infrastructure - Event Bridge

| Task ID | タスク | 優先度 | 成果物 | 担当 |
|---------|--------|:------:|--------|------|
| INFRA-001 | Event Bridge設計 | P0 | EVENT_BRIDGE_SPEC.md | CTO |
| INFRA-002 | L1→L3 Event Indexer | P0 | event-indexer/ | Engineer |
| INFRA-003 | L3→L1 Relayer (2台構成) | P0 | relayer/ | Engineer |
| INFRA-004 | Event Bridge統合テスト | P0 | tests/ | QA |
| INFRA-005 | HSM_INTEGRATION_SPEC.md | P0 | 仕様書 | CSO+Crypto |
| PROMPT-001 | プロンプトパス修正 | P0 | 02_prompts/*.md | Engineer |

**成果物**:
- `services/event-bridge/`
- `docs_new/00_core/specs/EVENT_BRIDGE_SPEC.md`
- `docs_new/00_core/specs/HSM_INTEGRATION_SPEC.md`

### Week 2: Infrastructure - API Layer

| Task ID | タスク | 優先度 | 成果物 | 担当 |
|---------|--------|:------:|--------|------|
| API-001 | OpenAPI 3.0スキーマ定義 | P0 | API_SPECIFICATION.md | Engineer |
| API-002 | Lock API実装 | P0 | api/lock/ | Engineer |
| API-003 | Unlock API実装 | P0 | api/unlock/ | Engineer |
| API-004 | Status Tracker API | P0 | api/status/ | Engineer |
| API-005 | Signature Queue Service | P0 | services/sig-queue/ | Engineer |
| API-006 | Edition Manager統合 | P0 | contracts/EditionManager.sol | CTO |
| INFRA-006 | INCIDENT_RESPONSE_PLAN.md | P0 | 運用ドキュメント | CSO |

**成果物**:
- `services/api/`
- `services/sig-queue/`
- `docs_new/00_core/specs/API_SPECIFICATION.md`
- `docs_new/00_core/INCIDENT_RESPONSE_PLAN.md`

### Week 3: Client SDK

| Task ID | タスク | 優先度 | 成果物 | 担当 |
|---------|--------|:------:|--------|------|
| SDK-001 | Dilithium WASM Module | P0 | sdk/wasm/ | Crypto |
| SDK-002 | NIST KAT検証 | P0 | テスト結果 | Crypto |
| SDK-003 | TypeScript SDK | P0 | sdk/typescript/ | Engineer |
| SDK-004 | React Hooks | P0 | sdk/react/ | Engineer |
| SDK-005 | SDK Documentation | P1 | SDK_GUIDE.md | Engineer |
| AUDIT-001 | AUDIT_SCOPE.md作成 | P0 | 監査準備 | Legal+CSO |

**成果物**:
- `sdk/`
- `docs_new/00_core/AUDIT_SCOPE.md`

**性能目標**:
- Dilithium鍵生成: <500ms (ブラウザ)
- 署名: <100ms
- 検証: <50ms

### Week 4-5: Admin Dashboard MVP

| Task ID | タスク | 優先度 | 成果物 | 担当 |
|---------|--------|:------:|--------|------|
| UI-001 | システム概要ダッシュボード | P0 | admin/dashboard/ | Engineer |
| UI-002 | L3ノード状態監視 | P0 | admin/nodes/ | Engineer |
| UI-003 | Emergency Pause機能 | P0 | admin/emergency/ | Engineer |
| UI-004 | 監査ログ表示 | P1 | admin/logs/ | Engineer |
| UI-005 | Edition切替UI | P1 | admin/edition/ | Engineer |
| UI-006 | Prover管理基本画面 | P1 | admin/provers/ | Engineer |

**成果物**:
- `apps/admin-dashboard/`

**機能スコープ**:
```
Admin Dashboard MVP
├── ダッシュボード（TVL, ノード状態, アラート）
├── L3ノード監視（4ノード状態）
├── Emergency Pause（緊急停止・復旧）
├── 監査ログ（操作履歴）
└── Edition切替（Enterprise/Decentralized）
```

### Week 5-6: End User App MVP

| Task ID | タスク | 優先度 | 成果物 | 担当 |
|---------|--------|:------:|--------|------|
| UI-007 | ウォレット接続 | P0 | user/wallet/ | Engineer |
| UI-008 | Dilithium鍵生成UI | P0 | user/keygen/ | Engineer |
| UI-009 | Lock画面 | P0 | user/lock/ | Engineer |
| UI-010 | Unlock画面（通常/緊急） | P0 | user/unlock/ | Engineer |
| UI-011 | Time Lock表示 | P0 | user/timelock/ | Engineer |
| UI-012 | 資産残高・履歴 | P1 | user/assets/ | Engineer |

**成果物**:
- `apps/user-app/`

**機能スコープ**:
```
End User App MVP
├── ウォレット接続（MetaMask）
├── Dilithium鍵管理
│   ├── 鍵ペア生成（WASM）
│   ├── 公開鍵登録
│   └── 鍵バックアップ
├── Lock
│   ├── 資産選択
│   ├── 金額入力
│   └── TX署名
├── Unlock
│   ├── 通常Unlock（24h）
│   ├── 緊急Unlock（7d + Bond）
│   └── Time Lock表示
└── 資産管理
    ├── 残高表示
    └── 履歴
```

### Week 6-7: E2E Testing

| Task ID | タスク | 優先度 | 成果物 | 担当 |
|---------|--------|:------:|--------|------|
| TEST-004 | Slither Full Scan | P0 | セキュリティレポート | CSO |
| TEST-005 | Red Team Simulation | P0 | 攻撃シナリオ結果 | Red Team |
| TEST-006 | Full System E2E | P0 | E2Eテスト結果 | QA |
| TEST-007 | Lock→Unlock フローテスト | P0 | テストレポート | QA |
| TEST-008 | Edition切替テスト | P0 | テストレポート | QA |
| TEST-009 | 負荷テスト | P1 | 性能レポート | Engineer |

**成果物**:
- `tests/e2e/`
- E2Eテストレポート

### Week 7-8: Prover Dashboard & Polish

| Task ID | タスク | 優先度 | 成果物 | 担当 |
|---------|--------|:------:|--------|------|
| UI-013 | Prover登録フロー | P2 | prover/register/ | Engineer |
| UI-014 | Stake管理 | P2 | prover/stake/ | Engineer |
| UI-015 | 署名キュー表示 | P2 | prover/queue/ | Engineer |
| UI-016 | 報酬確認・引出 | P2 | prover/rewards/ | Engineer |
| DOC-001 | 運用ドキュメント整備 | P1 | docs/ | Engineer |
| DOC-002 | API Documentation | P1 | docs/api/ | Engineer |
| GONOGO-001 | Go/No-Go準備 | P0 | 判定資料 | CTO |

**成果物**:
- `apps/prover-dashboard/`
- 運用ドキュメント一式

---

## 4. コンポーネント詳細

### 4.1 Event Bridge Service

```
┌─────────────────────────────────────────────────────────────┐
│                    Event Bridge Architecture                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  L1 (Ethereum)          Event Bridge          L3 (Aegis)    │
│  ┌──────────┐          ┌──────────┐          ┌──────────┐  │
│  │ L1Vault  │────────►│ Indexer  │◄────────│ BFT Node │  │
│  │ Events   │          │          │          │ Events   │  │
│  └──────────┘          └────┬─────┘          └──────────┘  │
│                              │                              │
│                    ┌────────┴────────┐                      │
│                    │   PostgreSQL    │                      │
│                    │   Event Store   │                      │
│                    └────────┬────────┘                      │
│                              │                              │
│  ┌──────────┐          ┌────┴─────┐          ┌──────────┐  │
│  │ L1Vault  │◄────────│ Relayer  │────────►│ L3 Node  │  │
│  │          │          │ (2台)    │          │          │  │
│  └──────────┘          └──────────┘          └──────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Multi-Relayer構成:
- Primary Relayer: メイン処理
- Secondary Relayer: フェイルオーバー用
- 自動切替: Primary障害時に自動フェイルオーバー
```

### 4.2 API Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      API Architecture                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                     API Gateway                          ││
│  │  (Kong / AWS API Gateway)                               ││
│  │  - JWT Authentication                                    ││
│  │  - Rate Limiting                                         ││
│  │  - API Key Management                                    ││
│  └────────────────────────┬────────────────────────────────┘│
│                           │                                  │
│  ┌────────────────────────┼────────────────────────────────┐│
│  │                        │                                 ││
│  │  ┌─────────┐  ┌───────┴───────┐  ┌─────────┐           ││
│  │  │Lock API │  │ Status API    │  │Unlock API│           ││
│  │  └────┬────┘  └───────┬───────┘  └────┬────┘           ││
│  │       │               │               │                  ││
│  │  ┌────┴───────────────┴───────────────┴────┐            ││
│  │  │            Rust (Axum) Server           │            ││
│  │  └────────────────────┬────────────────────┘            ││
│  │                       │                                  ││
│  └───────────────────────┼──────────────────────────────────┘│
│                          │                                   │
│  ┌───────────────────────┼───────────────────────────────┐  │
│  │  ┌────────────┐  ┌────┴────┐  ┌───────────────────┐   │  │
│  │  │ PostgreSQL │  │  Redis  │  │ RabbitMQ          │   │  │
│  │  │ (History)  │  │ (Cache) │  │ (Signature Queue) │   │  │
│  │  └────────────┘  └─────────┘  └───────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Client SDK構成

```
sdk/
├── wasm/                    # Dilithium WASM Module
│   ├── Cargo.toml
│   ├── src/
│   │   ├── lib.rs          # WASM exports
│   │   ├── dilithium.rs    # Dilithium-III wrapper
│   │   └── utils.rs
│   └── pkg/                 # wasm-pack output
├── typescript/              # TypeScript SDK
│   ├── package.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── client.ts       # API Client
│   │   ├── crypto.ts       # WASM wrapper
│   │   └── types.ts
│   └── dist/
└── react/                   # React Hooks
    ├── package.json
    └── src/
        ├── index.ts
        ├── useQuantumShield.ts
        ├── useLock.ts
        ├── useUnlock.ts
        └── useDilithium.ts
```

---

## 5. ペルソナ別UI/UX実装

### 5.1 Admin Dashboard

**対象**: Kota / QS運営チーム

```
Phase 4 スコープ:
├── システム概要（TVL, ノード状態, アラート）        ✅ MVP
├── L3ノード管理（4ノード状態監視）                 ✅ MVP
├── Emergency Pause（緊急停止・復旧）              ✅ MVP
├── 監査ログ（操作履歴）                          ✅ MVP
├── Edition切替                                   ✅ MVP
├── Prover管理（基本）                            ✅ MVP
├── トランザクション監視                          ⬜ Phase 4.5
├── 設定管理                                      ⬜ Phase 4.5
└── レポート生成                                  ⬜ Phase 4.5
```

### 5.2 End User App

**対象**: 一般ユーザー

```
Phase 4 スコープ:
├── ダッシュボード（残高, Lock中資産）             ✅ MVP
├── Lock（資産ロック）                            ✅ MVP
├── Unlock（通常/緊急）                           ✅ MVP
├── 鍵管理（生成, バックアップ）                   ✅ MVP
├── Time Lock表示                                 ✅ MVP
├── トランザクション履歴                          ✅ MVP
└── 設定・ヘルプ                                  ⬜ Phase 4.5
```

### 5.3 Prover Dashboard

**対象**: Prover事業者

```
Phase 4 スコープ:
├── ステータス概要                                ✅ MVP
├── 登録管理                                      ✅ MVP
├── Stake管理                                     ✅ MVP
├── 署名キュー                                    ✅ MVP
├── 報酬確認・引出                                ✅ MVP
├── HSM連携状態                                   ⬜ Phase 4.5
└── 詳細分析                                      ⬜ Phase 4.5
```

### 5.4 Service Provider Portal (Phase 4.5延期)

**理由**: Enterprise需要確認後に実装。Decentralized市場で実績を先に作る。

---

## 6. E2Eテスト計画

### 6.1 テストシナリオ

| # | シナリオ | 優先度 | 状態 |
|---|---------|:------:|:----:|
| E2E-001 | Lock: User → L3 → L1 完全フロー | P0 | ⬜ |
| E2E-002 | Unlock (Normal): 24h Time Lock | P0 | ⬜ |
| E2E-003 | Unlock (Emergency): 7d + Bond | P0 | ⬜ |
| E2E-004 | VRF Prover選出 → SPHINCS+署名 | P0 | ⬜ |
| E2E-005 | Challenge → Slashing | P0 | ⬜ |
| E2E-006 | Edition切替 (Enterprise → Decentralized) | P0 | ⬜ |
| E2E-007 | Emergency Pause → Recovery | P0 | ⬜ |
| E2E-008 | Multi-Relayer Failover | P1 | ⬜ |
| E2E-009 | 負荷テスト (100 concurrent users) | P1 | ⬜ |
| E2E-010 | UI Full User Journey | P1 | ⬜ |

### 6.2 セキュリティテスト

| # | テスト | ツール | 状態 |
|---|--------|--------|:----:|
| SEC-001 | Slither Full Scan | Slither | ⬜ |
| SEC-002 | Reentrancy Check | Slither | ⬜ |
| SEC-003 | Access Control Audit | Manual | ⬜ |
| SEC-004 | Cryptographic Review | Manual | ⬜ |
| SEC-005 | API Security Test | OWASP ZAP | ⬜ |
| SEC-006 | WASM Security Review | Manual | ⬜ |

### 6.3 テスト自動化

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on:
  push:
    branches: [dev/phase4-integration]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup
        run: |
          curl -L https://foundry.paradigm.xyz | bash
          foundryup
      - name: Run E2E Tests
        run: |
          cd tests/e2e
          forge test -vvv
```

---

## 7. プロンプト修正計画

### 7.1 修正対象

| ファイル | 主な修正内容 |
|---------|-------------|
| 01_plan.md | パス参照統一, Phase 4対応追加 |
| 02_spec.md | パス参照統一 |
| 03_impl.md | パス参照統一, UI実装ガイドライン追加 |
| 04_review.md | パス参照統一 |
| 05_pir.md | パス参照統一 |
| 06_update.md | パス参照統一 |
| 07_gonogo.md | パス参照統一, Phase 4基準追加 |

### 7.2 パス変換マッピング

| 旧パス | 新パス |
|--------|--------|
| `docs/constitution/CORE_PRINCIPLES.md` | `docs_new/00_core/CORE_PRINCIPLES.md` |
| `docs/planning/CURRENT_STATE.md` | `docs_new/01_phase/CURRENT_STATE.md` |
| `docs/planning/CURRENT_PLAN.md` | `docs_new/01_phase/CURRENT_PLAN.md` |
| `docs/planning/SPEC_STRATEGY_BRIDGE.md` | `docs_new/00_core/specs/SPEC_STRATEGY_BRIDGE.md` |
| `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | `docs_new/00_core/sequences/SEQUENCES_v2.0.md` |
| `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | `docs_new/00_core/specs/UNIFIED_SPEC_v2.0.md` |
| `docs/aegis/L3_CHAIN_SPECIFICATION.md` | `docs_new/00_core/specs/L3_CHAIN_SPECIFICATION.md` |
| `docs/aegis/meetings/` | `docs_new/01_phase/[phase]/meetings/` |
| `docs/aegis/pir/` | `docs_new/01_phase/[phase]/pir/` |
| `docs/specs/MODULAR_ARCHITECTURE.md` | `docs_new/00_core/specs/MODULAR_ARCHITECTURE.md` |
| `docs/planning/PHASE3_STRATEGY.md` | `docs_new/01_phase/03_Phase3/PHASE3_STRATEGY.md` |
| `docs/checklists/` | `docs_new/01_phase/[phase]/checklists/` |

### 7.3 Phase 4対応追加内容

各プロンプトに以下を追加:

```markdown
### Phase 4の場合（追加）

以下のドキュメントを追加確認：

1. **Phase 4計画書**
   - `docs_new/01_phase/04_phase4/PHASE4_PLAN.md`
   - 週次スケジュール、コンポーネント詳細

2. **UI/UX要件**
   - `docs_new/01_phase/04_phase4/UI_UX_FUNCTIONAL_REQUIREMENTS_JP.md`
   - ペルソナ別画面フロー、必要API

3. **統合ブループリント**
   - `docs_new/01_phase/04_phase4/INTEGRATED_SYSTEM_BLUEPRINT_JP.md`
   - コンポーネント統合、ギャップ分析
```

---

## 8. リスク管理

### 8.1 識別されたリスク

| # | リスク | 重要度 | 緩和策 | 担当 |
|---|--------|:------:|--------|------|
| R1 | Event Bridge SPoF | 🔴 HIGH | Multi-Relayer構成 | CTO |
| R2 | HSM Integration仕様未確定 | 🔴 CRITICAL | Week 1でSPEC作成 | CSO |
| R3 | Emergency復旧手順未定義 | 🔴 CRITICAL | Week 2でPLAN作成 | CSO |
| R4 | 監査スコープ未作成 | 🟠 HIGH | Week 3でSCOPE作成 | Legal |
| R5 | リソース競合（並行開発） | 🟠 HIGH | タスク再配分 | CTO |
| R6 | Dilithium WASM性能未達 | 🟡 MEDIUM | 早期ベンチマーク | Crypto |
| R7 | Edition切替時のCP保証 | 🟡 MEDIUM | 設計レビュー | Purpose Guardian |

### 8.2 緩和策スケジュール

| Week | 緩和策 | 成果物 |
|:----:|--------|--------|
| W1 | HSM_INTEGRATION_SPEC.md作成 | 仕様書 |
| W2 | INCIDENT_RESPONSE_PLAN.md作成 | 運用ドキュメント |
| W3 | AUDIT_SCOPE.md作成 | 監査準備 |
| W1 | Multi-Relayer設計 | アーキテクチャ |
| W3 | Dilithium WASMベンチマーク | 性能レポート |

---

## 9. 成功基準・Go/No-Go

### 9.1 Phase 4 完了基準

| 基準 | 条件 | 目標 |
|------|------|:----:|
| E2E統合 | Event Bridge + API + SDK動作 | ✅ |
| Admin Dashboard | MVP機能完了 | ✅ |
| End User App | MVP機能完了 | ✅ |
| Prover Dashboard | MVP機能完了 | ✅ |
| E2Eテスト | 全シナリオPASS | ✅ |
| セキュリティ | Slither Critical/High = 0 | ✅ |
| 性能 | Dilithium WASM <500ms | ✅ |
| ドキュメント | 運用ドキュメント完備 | ✅ |

### 9.2 Go/No-Go判定基準

| 項目 | Weight | 閾値 |
|------|:------:|:----:|
| 機能完了 | 30% | 100% |
| テスト合格 | 25% | 100% |
| セキュリティ | 25% | Critical/High = 0 |
| 性能目標 | 10% | 全達成 |
| ドキュメント | 10% | 必須項目完了 |

**GO判定**: 総合スコア 85点以上

---

## 10. 参照ドキュメント

### Core Documents

| ドキュメント | パス |
|-------------|------|
| 憲法 | `docs_new/00_core/CORE_PRINCIPLES.md` |
| 現在の状態 | `docs_new/01_phase/CURRENT_STATE.md` |
| 計画 | `docs_new/01_phase/CURRENT_PLAN.md` |

### Phase 4 Documents

| ドキュメント | パス |
|-------------|------|
| UI/UX要件 | `docs_new/01_phase/04_phase4/UI_UX_FUNCTIONAL_REQUIREMENTS_JP.md` |
| 統合ブループリント | `docs_new/01_phase/04_phase4/INTEGRATED_SYSTEM_BLUEPRINT_JP.md` |
| Phase 4チェックリスト | `docs_new/01_phase/04_phase4/phase4.md` |

### Specifications

| ドキュメント | パス |
|-------------|------|
| Sequence仕様 | `docs_new/00_core/sequences/` |
| 全体仕様 | `docs_new/00_core/specs/` |

### Agent Prompts

| ドキュメント | パス |
|-------------|------|
| エージェントプロンプト | `docs_new/02_agents_prompt/02_prompts/` |
| 会議プロトコル | `docs_new/02_agents_prompt/01_Agent strategic meeting format/` |

---

## 変更履歴

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-02 | 初版作成 |
| 2.0 | 2026-01-04 | 11エージェント会議結論反映、詳細化 |

---

**END OF PHASE 4 PLAN**
