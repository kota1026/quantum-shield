# Current Task Status

> **Updated**: 2026-01-13
> **Status**: Completed

---

## 完了したタスク

| 項目 | 値 |
|------|-----|
| タスクID | TASK-P5-017 |
| タイトル | Enterprise申込フロー |
| Phase | 5.3 管理系API |
| 優先度 | P1 |
| 実績工数 | 0.5日 |
| 計画参照 | 26_phase5_planner.md §7 TASK-P5-032 |

### トレーサビリティ

| 仕様項目 | 仕様書参照 | 実装先 |
|----------|----------|--------|
| Enterprise申込API | UNIFIED_SPEC §Enterprise Onboarding | `services/api/src/routes/enterprise.rs` |
| 申込状況確認API | UNIFIED_SPEC §Enterprise Onboarding | `services/api/src/routes/enterprise.rs` |
| 契約署名API | UNIFIED_SPEC §Enterprise Onboarding | `services/api/src/routes/enterprise.rs` |
| オンボーディングAPI | UNIFIED_SPEC §Enterprise Onboarding | `services/api/src/routes/enterprise.rs` |

### 成果物

| # | 成果物 | 説明 |
|---|--------|------|
| 1 | POST /v1/enterprise/apply | Enterprise申込API |
| 2 | GET /v1/enterprise/application/:id | 申込状況取得API |
| 3 | POST /v1/enterprise/contract/sign | 契約署名API |
| 4 | GET /v1/enterprise/onboarding | オンボーディングステータスAPI |

### 完了条件

| # | 条件 | 状態 |
|---|------|:----:|
| 1 | POST /v1/enterprise/apply 実装 | ✅ |
| 2 | GET /v1/enterprise/application/:id 実装 | ✅ |
| 3 | POST /v1/enterprise/contract/sign 実装 | ✅ |
| 4 | GET /v1/enterprise/onboarding 実装 | ✅ |
| 5 | cargo build 成功 | ✅ |
| 6 | cargo test 成功 (114 passed) | ✅ |

### 実装詳細

#### 追加した型

- `ApplicationStatus` - 申込ステータス (Pending, UnderReview, InfoRequested, Approved, ContractSigned, Active, Rejected, Cancelled)
- `OnboardingStepStatus` - オンボーディングステップステータス (Pending, InProgress, Completed, Skipped)
- `EnterpriseApplicationRequest/Response` - 申込リクエスト/レスポンス
- `ApplicationDetailResponse` - 申込詳細レスポンス
- `ContractSignRequest/Response` - 契約署名リクエスト/レスポンス
- `OnboardingStatusResponse` - オンボーディングステータスレスポンス
- その他サポート型 (CompanyInfo, ContactInfo, ApplicationDetails, OnboardingStep, etc.)

#### 追加したエンドポイント (4 EP)

1. **POST /v1/enterprise/apply** - Enterprise申込を送信
   - バリデーション: Terms of Service と Privacy Policy への同意必須
   - レスポンス: applicationId, status, 推定レビュー日数

2. **GET /v1/enterprise/application/:id** - 申込詳細を取得
   - 会社情報、連絡先情報、申込詳細
   - タイムライン、ドキュメント、レビューノート

3. **POST /v1/enterprise/contract/sign** - 契約に署名
   - バリデーション: 契約同意必須、ウォレットアドレス形式
   - レスポンス: contractId, organizationId, 次のステップ

4. **GET /v1/enterprise/onboarding** - オンボーディング状況を取得
   - 進捗率、現在のステップ
   - 各ステップの詳細 (サブタスク含む)
   - サポート連絡先、クイックアクション

#### テスト追加 (8 tests)

- `test_application_status_serialization`
- `test_onboarding_step_status_serialization`
- `test_application_request_deserialization`
- `test_contract_sign_request_deserialization`
- `test_application_response_serialization`
- `test_onboarding_step_structure`
- `test_company_info_serialization`

---

## 次のタスク候補

- TASK-P5-015: QS Admin API (11 EP) ✅ DONE
- TASK-P5-016: Enterprise Admin API (19 EP) ✅ DONE
- TASK-P5-018: 4BFT契約者管理
- TASK-P5-027: 監視ボット実装

---

**END OF STATUS**
