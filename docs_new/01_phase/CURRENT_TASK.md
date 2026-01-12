# Task Definition

> **Generated**: 2026-01-12 (SEP v3)
> **Status**: Active

---

## 基本情報

| 項目 | 値 |
|------|-----|
| タスクID | TASK-P5-023 |
| タイトル | Governance API (8 EP) |
| 対象Sequence | §7 Governance Proposal |
| 優先度 | P1 |
| 見積り工数 | 4日 |

---

## 背景

### 現状分析

| コンポーネント | ファイル | 状態 | 備考 |
|--------------|---------|:----:|------|
| UI Mocks | system_03_governance/ | ✅ PIR PASS | 6ファイル/16画面完了 |
| DESIGN_MANIFEST | DESIGN_MANIFEST.md | ✅ 完成 | v1.1 |
| API Routes | services/api/src/routes/ | ⚠️ 未実装 | governance.rs未作成 |

### ギャップ分析

```
現在: UI モック完成（PIR PASS）
不足: バックエンドAPI未実装
必要: 8エンドポイントの実装
```

---

## 仕様参照

- SEQUENCES §7 Governance Proposal
- UNIFIED_SPEC §Governance, §veQS Voting
- DESIGN_MANIFEST: system_03_governance/DESIGN_MANIFEST.md

---

## 実装項目

### 1. governance.rs作成

```rust
// 8 Endpoints:
// GET  /v1/governance/dashboard     - Dashboard overview
// GET  /v1/governance/proposals     - List proposals
// GET  /v1/governance/proposals/:id - Proposal detail
// POST /v1/governance/proposals     - Create proposal
// POST /v1/governance/vote          - Submit vote
// GET  /v1/governance/votes/:id     - Vote details
// GET  /v1/governance/activity      - User activity
// GET  /v1/governance/council       - Council info
```

### 2. types.rs更新

- GovernanceTypes追加
- ProposalStatus, VoteType enumsを追加

### 3. routes/mod.rs更新

- governance moduleの追加
- api_routes()にgovernanceルートを追加

---

## 完了条件

| # | 条件 |
|---|------|
| 1 | 8エンドポイント全て実装 |
| 2 | cargo build成功 |
| 3 | cargo test成功 |
| 4 | UIモックとの整合性確認 |

---

## トレーサビリティマトリクス

| Screen (UI Mock) | API Endpoint | Status |
|------------------|--------------|:------:|
| 01_dashboard.html | GET /v1/governance/dashboard | ⏳ |
| 02_proposals_list.html | GET /v1/governance/proposals | ⏳ |
| 02_proposal_detail.html | GET /v1/governance/proposals/:id | ⏳ |
| 02_proposal_detail.html | POST /v1/governance/vote | ⏳ |
| 03_create_proposal.html | POST /v1/governance/proposals | ⏳ |
| 04_my_activity.html | GET /v1/governance/activity | ⏳ |
| 05_council.html | GET /v1/governance/council | ⏳ |
| Vote History | GET /v1/governance/votes/:id | ⏳ |

---

**END OF TASK DEFINITION**
