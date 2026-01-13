# Current Task Status

> **Updated**: 2026-01-13
> **Status**: ✅ Completed

---

## 現在のタスク

| 項目 | 値 |
|------|-----|
| タスクID | TASK-P5-017 |
| タイトル | Enterprise申込フロー実装 |
| Phase | 5.3 管理系API |
| 優先度 | P1 |
| 見積り工数 | 3日 |
| 計画参照 | §3.4 |
| 依存 | P5-016 (Enterprise Admin API) ✅ 完了 |

### トレーサビリティ

| 仕様項目 | 仕様書参照 | 実装先 |
|----------|----------|--------|
| Enterprise申込 | UNIFIED_SPEC §Enterprise Edition | `services/api/src/routes/enterprise.rs` |
| 契約管理 | UNIFIED_SPEC §Business Strategy | `services/api/src/routes/enterprise.rs` |
| オンボーディング | PHASE5_INTEGRATION_PLAN §3.4 | `services/api/src/routes/enterprise.rs` |

### 既存実装（TASK-P5-016）

| コンポーネント | エンドポイント数 | 状態 |
|------------|:--------------:|:----:|
| Dashboard API | 3 EP | ✅ 完成 |
| Transaction API | 3 EP | ✅ 完成 |
| User API | 5 EP | ✅ 完成 |
| API Key API | 3 EP | ✅ 完成 |
| Settings API | 3 EP | ✅ 完成 |
| Reports & Audit | 2 EP | ✅ 完成 |
| **合計** | **19 EP** | ✅ |

### 実装するAPI (4 EP)

#### Enterprise Application API (4 EP)
```
POST /v1/enterprise/apply            - 申込受付
GET  /v1/enterprise/application/:id  - 申込状況確認
POST /v1/enterprise/contract/sign    - 契約署名
GET  /v1/enterprise/onboarding       - オンボーディング状態
```

### 完了条件

| # | 条件 | 状態 |
|---|------|:----:|
| 1 | POST /v1/enterprise/apply 実装 | ✅ |
| 2 | GET /v1/enterprise/application/:id 実装 | ✅ |
| 3 | POST /v1/enterprise/contract/sign 実装 | ✅ |
| 4 | GET /v1/enterprise/onboarding 実装 | ✅ |
| 5 | cargo build成功 | ✅ |
| 6 | cargo test成功 (109 tests) | ✅ |
| 7 | routes/mod.rsへのルート登録 | ✅ |

### WHY

#### 問題
- Enterprise Editionの新規契約フローが未実装
- 企業顧客の申込→契約→オンボーディングの自動化ができない
- 4BFT (Enterprise) と Decentralized の2本立て設計において、Enterprise側の入口が存在しない

#### 決定根拠
- UNIFIED_SPEC §Enterprise Edition: 金融系システム会社向け
- UNIFIED_SPEC §Business Strategy: 2本立て設計（Enterprise / Decentralized）
- PHASE5_INTEGRATION_PLAN §3.4: Enterprise申込フロー必須

### API仕様詳細

#### POST /v1/enterprise/apply
- 企業の基本情報（会社名、業種、連絡先）
- 申込プラン（Enterprise / Premium）
- 予想TVL/取引量
- 技術要件（4BFTノード構成、SLA要件）

#### GET /v1/enterprise/application/:id
- 申込状態（pending → reviewing → approved/rejected）
- レビューコメント
- 次のステップ

#### POST /v1/enterprise/contract/sign
- 電子契約署名
- SLA合意
- 初期設定パラメータ

#### GET /v1/enterprise/onboarding
- オンボーディング進捗
- 完了したステップ / 残りのステップ
- 次のアクション

---

## 実装済みタスク一覧（Phase 5）

### Phase 5.0 ブロッカー解消（100%完了）

| Task ID | 内容 | 状態 | 完了日 |
|---------|------|:----:|-------|
| TASK-P5-001 | Challenge API + SDK | ✅ | 2026-01-11 |
| TASK-P5-002 | STARK Prover移行 | ✅ | 2026-01-11 |
| TASK-P5-003 | React SDK WASM | ✅ | 2026-01-11 |
| TASK-P5-004 | L3 Production Mode | ✅ | 2026-01-12 |
| TASK-P5-005 | Chainlink VRF v2.5 | ✅ | 2026-01-12 |
| TASK-P5-006 | Event Bridge | ✅ | 2026-01-12 |
| TASK-P5-007 | SPHINCS+署名検証 | ✅ | 2026-01-12 |

### Phase 5.1 基盤整備（100%完了）

| Task ID | 内容 | 状態 | 完了日 |
|---------|------|:----:|-------|
| TASK-P5-010 | EditionConfig.sol | ✅ | 2026-01-12 |
| TASK-P5-011 | ProverRegistry.sol | ✅ | 2026-01-12 |
| TASK-P5-012 | SIWE→JWT認証 | ✅ | 2026-01-12 |
| TASK-P5-013 | SDK API client認証 | ✅ | 2026-01-12 |

### Phase 5.2 コアAPI（100%完了）

| Task ID | 内容 | 状態 | 完了日 |
|---------|------|:----:|-------|
| TASK-P5-020 | Consumer App API (6 EP) | ✅ | 2026-01-12 |
| TASK-P5-021 | Token Hub API (9 EP) | ✅ | 2026-01-12 |
| TASK-P5-022 | Prover Portal API (9 EP) | ✅ | 2026-01-12 |
| TASK-P5-023 | Governance API (8 EP) | ✅ | 2026-01-12 |

### Phase 5.3 管理系API（進行中）

| Task ID | 内容 | 状態 | 完了日 |
|---------|------|:----:|-------|
| TASK-P5-015 | QS Admin API (11 EP) | ✅ | 2026-01-12 |
| TASK-P5-016 | Enterprise Admin API (19 EP) | ✅ | 2026-01-12 |
| **TASK-P5-017** | **Enterprise申込フロー (4 EP)** | **✅** | 2026-01-13 |
| TASK-P5-018 | 4BFT契約者管理 | ⏳ | - |

### Phase 5.4 補完機能（部分完了）

| Task ID | 内容 | 状態 | 完了日 |
|---------|------|:----:|-------|
| TASK-P5-025 | Prover Portal DESIGN_BRIEF | ✅ | 2026-01-12 |
| TASK-P5-029 | Insurance/Treasury API (12 EP) | ✅ | 2026-01-12 |
| TASK-P5-019 | Observer API (8 EP) | ✅ | 2026-01-12 |

---

## 次のステップ

→ TASK-P5-017 Enterprise申込フローを実装
→ 完了後: TASK-P5-018 (4BFT契約者管理) または Phase 5.4 残りの補完機能

---

**END OF STATUS**
