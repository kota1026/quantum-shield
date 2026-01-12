# Current Task Status

> **Updated**: 2026-01-12
> **Status**: Active

---

## 現在のタスク

| 項目 | 値 |
|------|-----|
| タスクID | TASK-P5-016 |
| タイトル | Enterprise Admin API (19 EP) |
| Phase | 5.3 |
| 優先度 | P0 |
| 工数見積 | 7日 |
| 依存 | TASK-P5-012 (SIWE→JWT認証) ✅ |

### 計画参照

- 26_phase5_planner.md §7 TASK-P5-031
- TASK_P5_FULL_LIST.md §Phase 5.3
- UIモック: system_07_enterprise/wip/mocks/ (25画面)

### 完了条件

| # | 条件 | 状態 |
|---|------|:----:|
| 1 | 19エンドポイント全て実装 | ⏳ |
| 2 | cargo build成功 | ⏳ |
| 3 | cargo test成功 | ⏳ |
| 4 | UIモックとの整合性確認 | ⏳ |

---

## エンドポイント詳細 (19 EP)

### Dashboard (3 EP)

| EP | Method | Path | UIモック |
|----|--------|------|---------|
| 1 | GET | /v1/enterprise/dashboard/overview | 01_overview_dashboard.html |
| 2 | GET | /v1/enterprise/dashboard/tvl | 02_tvl_dashboard.html |
| 3 | GET | /v1/enterprise/dashboard/volume | 03_volume_dashboard.html |

### Transactions (3 EP)

| EP | Method | Path | UIモック |
|----|--------|------|---------|
| 4 | GET | /v1/enterprise/transactions | 05_transaction_list.html |
| 5 | GET | /v1/enterprise/transactions/:id | 06_transaction_detail.html |
| 6 | POST | /v1/enterprise/transactions/export | 07_transaction_export.html |

### Users (5 EP)

| EP | Method | Path | UIモック |
|----|--------|------|---------|
| 7 | GET | /v1/enterprise/users | 09_user_list.html |
| 8 | GET | /v1/enterprise/users/:id | 10_user_detail.html |
| 9 | POST | /v1/enterprise/users | 11_user_create.html |
| 10 | POST | /v1/enterprise/users/invite | 13_invite_user.html |
| 11 | POST | /v1/enterprise/users/:id/role | 12_role_management.html |

### API Keys (3 EP)

| EP | Method | Path | UIモック |
|----|--------|------|---------|
| 12 | GET | /v1/enterprise/api-keys | 14_api_keys.html |
| 13 | POST | /v1/enterprise/api-keys | 15_create_api_key.html |
| 14 | GET | /v1/enterprise/api-keys/:id/usage | 16_api_usage.html |

### Settings (3 EP)

| EP | Method | Path | UIモック |
|----|--------|------|---------|
| 15 | GET | /v1/enterprise/settings | 18_org_settings.html |
| 16 | POST | /v1/enterprise/settings | 18_org_settings.html |
| 17 | GET | /v1/enterprise/security-settings | 19_security_settings.html |

### Reports & Audit (2 EP)

| EP | Method | Path | UIモック |
|----|--------|------|---------|
| 18 | GET | /v1/enterprise/reports | 22_monthly_report.html |
| 19 | GET | /v1/enterprise/audit-log | 24_audit_log.html |

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
| TASK-P5-015 | QS Admin API (11 EP) | ⏳ | - |
| **TASK-P5-016** | **Enterprise Admin API (19 EP)** | **🔄 Active** | - |
| TASK-P5-017 | Enterprise申込フロー | ⏳ | - |
| TASK-P5-018 | 4BFT契約者管理 | ⏳ | - |

### Phase 5.4 補完機能（部分完了）

| Task ID | 内容 | 状態 | 完了日 |
|---------|------|:----:|-------|
| TASK-P5-025 | Prover Portal DESIGN_BRIEF | ✅ | 2026-01-12 |

---

**END OF STATUS**
