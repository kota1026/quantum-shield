# Phase 6 Planning Proposal
## サービスリリース準備フェーズ

> **Version**: 3.0
> **Date**: 2026-01-14
> **Status**: Planning Proposal (AI Agentic Enhanced)
> **Author**: AI Planning Agent

---

## 🚀 AI Agentic開発手法の適用

Phase 6では**世界最高峰のAI Agentic手法**を適用し、開発・テストを効率化します。

### 適用技術

| 領域 | 適用手法 | 効果 |
|------|---------|------|
| Design→Code | Figma MCP + HTML Mock → React自動変換 | 実装時間40-60%削減 |
| 開発体制 | Multi-Agent Team (UI/API/Test/i18n/A11y) | 並列開発実現 |
| テスト | Playwright Healer Agent (自己修復) | 保守コスト70%削減 |
| Visual QA | Chromatic + Applitools AI | 100%自動検出 |
| 探索テスト | Claude Computer Use | 自然言語テスト |

### 関連ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [AI_AGENTIC_UIUX_RESEARCH.md](./AI_AGENTIC_UIUX_RESEARCH.md) | 世界最高峰手法リサーチ結果 |
| [AI_AGENTIC_IMPLEMENTATION_PLAN.md](./AI_AGENTIC_IMPLEMENTATION_PLAN.md) | 具体的な適用計画 |

---

## 1. Executive Summary

### 1.1 Phase 6の目標

Phase 6は**サービスリリース直前の最終準備フェーズ**として、以下を達成する：

```
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 6: SERVICE RELEASE PREPARATION                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  【コア目標】                                                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 1. UI/UX Excellence     - ユーザーファーストの体験提供         │  │
│  │ 2. Full Integration     - UI↔API↔Backend↔DB↔Sepolia連携     │  │
│  │ 3. Documentation Ready  - 全ドキュメント整備完了              │  │
│  │ 4. Production Quality   - リリース可能な品質保証              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  【成果物】                                                          │
│  • Sepolia Testnet上で完全動作するDApp（8システム / 98画面）        │
│  • 日英対応の完全なUI                                               │
│  • 法務ドキュメント一式（利用規約、SLA、契約書）                     │
│  • ホワイトペーパー・技術文書                                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Phase 4モック資産（ベースライン）

Phase 4で作成された**98画面のモック**をベースに開発を進める：

```
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 4 MOCK ASSETS - 8 SYSTEMS / 98 SCREENS                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  System 01: Consumer App        19画面  ████████████████████        │
│  System 02: Token Hub           10画面  ██████████                  │
│  System 03: Governance           6画面  ██████                      │
│  System 04: Prover Portal       11画面  ███████████                 │
│  System 05: Observer             7画面  ███████                     │
│  System 06: Explorer             8画面  ████████                    │
│  System 07: Enterprise Admin    25画面  █████████████████████████   │
│  System 08: QS Admin            12画面  ████████████                │
│  ────────────────────────────────────────────────────────────────   │
│  TOTAL                          98画面                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 参照仕様書（厳守事項）

| ドキュメント | パス | 用途 |
|-------------|------|------|
| **Core Principles** | `docs_new/00_core/CORE_PRINCIPLES.md` | 不変原則（憲法） |
| **Unified Spec** | `docs_new/00_core/specs/UNIFIED_SPEC.md` | 統合仕様 |
| **Sequences** | `docs_new/00_core/specs/SEQUENCES.md` | フロー定義 |
| **Design Guidelines** | `docs_new/01_phase/04_phase4/01_design/UI_DESIGN_GUIDELINES.md` | デザインシステム |
| **Design Review Agents** | `docs_new/01_phase/04_phase4/01_design/DESIGN_REVIEW_AGENTS.md` | ペルソナ定義 |

---

## 2. 8システム詳細

### 2.1 System 01: Consumer App（19画面）

**対象ユーザー**: End User（田中さん）
**パス**: `docs_new/01_phase/04_phase4/01_design/system_01_consumer/wip/mocks/`

| # | 画面 | ファイル | 機能 |
|---|------|----------|------|
| 1 | Landing | 01_landing.html | サービス紹介、CTA |
| 2 | Onboarding | 02_onboarding.html | 初期設定フロー |
| 3 | Dashboard | 03_dashboard.html | 資産概要、アクション |
| 4 | Unlock | 04_unlock.html | アンロック申請 |
| 5 | History | 05_history.html | トランザクション履歴 |
| 6 | Settings | 06_settings.html | 設定画面 |
| 7 | Key Management | 07_key_management.html | Dilithium鍵管理 |
| 8 | FAQ | 08_faq.html | よくある質問 |
| 9 | Security | 09_security.html | セキュリティ設定 |
| 10 | Lock Processing | 10_lock_processing.html | ロック処理中 |
| 11 | Lock Success | 10_lock_success.html | ロック完了 |
| 12 | Unlock Sign | 11_unlock_sign.html | アンロック署名 |
| 13 | Unlock Processing | 12_unlock_processing.html | アンロック処理中 |
| 14 | Unlock Success | 13_unlock_success.html | アンロック完了 |
| 15 | Emergency Bond | 14_emergency_bond.html | 緊急ボンド支払い |
| 16 | Emergency Processing | 15_emergency_processing.html | 緊急処理中 |
| 17 | Emergency Success | 16_emergency_success.html | 緊急完了 |
| 18 | Terms | 17_terms.html | 利用規約 |
| 19 | Privacy | 18_privacy.html | プライバシーポリシー |

### 2.2 System 02: Token Hub（10画面）

**対象ユーザー**: Token Holder（鈴木さん）
**パス**: `docs_new/01_phase/04_phase4/01_design/system_02_token_hub/wip/mocks/`

| # | 画面 | ファイル | 機能 |
|---|------|----------|------|
| 1 | Dashboard | 01_dashboard.html | QSトークン概要、veQS残高 |
| 2 | Lock Form | 02_lock_form.html | QS→veQSロック入力 |
| 3 | Lock Preview | 02_lock_preview.html | ロック内容確認 |
| 4 | Lock Confirm | 02_lock_confirm.html | ロック確認 |
| 5 | Lock Success | 02_lock_success.html | ロック完了 |
| 6 | Delegate List | 03_delegate_list.html | 委任先一覧 |
| 7 | Delegate Detail | 03_delegate_detail.html | 委任先詳細 |
| 8 | Delegate Form | 03_delegate_form.html | 委任設定 |
| 9 | Rewards Dashboard | 04_rewards_dashboard.html | 報酬概要 |
| 10 | Claim Rewards | 04_claim_rewards.html | 報酬請求 |

### 2.3 System 03: Governance（6画面）

**対象ユーザー**: Delegate（渡辺さん）、Token Holder（鈴木さん）
**パス**: `docs_new/01_phase/04_phase4/01_design/system_03_governance/wip/mocks/`

| # | 画面 | ファイル | 機能 |
|---|------|----------|------|
| 1 | Dashboard | 01_dashboard.html | ガバナンス概要 |
| 2 | Proposals List | 02_proposals_list.html | 提案一覧 |
| 3 | Proposal Detail | 02_proposal_detail.html | 提案詳細・投票 |
| 4 | Create Proposal | 03_create_proposal.html | 提案作成 |
| 5 | My Activity | 04_my_activity.html | 自分の投票履歴 |
| 6 | Council | 05_council.html | 評議会情報 |

### 2.4 System 04: Prover Portal（11画面）

**対象ユーザー**: Prover（山田さん）
**パス**: `docs_new/01_phase/04_phase4/01_design/system_04_prover/wip/mocks/`

| # | 画面 | ファイル | 機能 |
|---|------|----------|------|
| 1 | Landing | 01_landing.html | Prover紹介・CTA |
| 2 | Requirements | 02_requirements.html | 参加要件 |
| 3 | Application | 03_application.html | 申請フォーム |
| 4 | Status | 04_status.html | 申請状況 |
| 5 | Activation | 05_activation.html | アクティベーション |
| 6 | Dashboard | 06_dashboard.html | Proverダッシュボード |
| 7 | Queue | 07_queue.html | 処理キュー |
| 8 | Metrics | 08_metrics.html | パフォーマンス指標 |
| 9 | Alerts | 09_alerts.html | アラート管理 |
| 10 | Challenge | 10_challenge.html | チャレンジ対応 |
| 11 | Exit | 11_exit.html | 退出手続き |

### 2.5 System 05: Observer（7画面）

**対象ユーザー**: Observer（監視者）
**パス**: `docs_new/01_phase/04_phase4/01_design/system_05_observer/wip/mocks/`

| # | 画面 | ファイル | 機能 |
|---|------|----------|------|
| 1 | Dashboard | 01_dashboard.html | 監視概要 |
| 2 | Pending | 01_pending.html | 保留中TX |
| 3 | Suspicious | 01_suspicious.html | 疑わしいTX |
| 4 | History | 01_history.html | 監視履歴 |
| 5 | Challenge Form | 02_challenge_form.html | チャレンジ作成 |
| 6 | Challenge Progress | 02_challenge_progress.html | チャレンジ進捗 |
| 7 | Earnings | 03_earnings.html | 報酬管理 |

### 2.6 System 06: Explorer（8画面）

**対象ユーザー**: 一般ユーザー、Delegate（渡辺さん）
**パス**: `docs_new/01_phase/04_phase4/01_design/system_06_explorer/wip/mocks/`

| # | 画面 | ファイル | 機能 |
|---|------|----------|------|
| 1 | Overview | 01_overview.html | プロトコル概要 |
| 2 | Search | 02_search.html | 検索機能 |
| 3 | Locks | 03_locks.html | ロック一覧 |
| 4 | Unlocks | 04_unlocks.html | アンロック一覧 |
| 5 | Challenges | 05_challenges.html | チャレンジ一覧 |
| 6 | Address | 06_address.html | アドレス詳細 |
| 7 | Provers | 07_provers.html | Prover一覧 |
| 8 | Analytics | 08_analytics.html | 分析ダッシュボード |

### 2.7 System 07: Enterprise Admin（25画面）

**対象ユーザー**: Service Provider（佐藤さん）
**パス**: `docs_new/01_phase/04_phase4/01_design/system_07_enterprise/wip/mocks/`

| # | 画面 | ファイル | 機能 |
|---|------|----------|------|
| 1 | Overview Dashboard | 01_overview_dashboard.html | 全体概要 |
| 2 | TVL Dashboard | 02_tvl_dashboard.html | TVL分析 |
| 3 | Volume Dashboard | 03_volume_dashboard.html | ボリューム分析 |
| 4 | Status Dashboard | 04_status_dashboard.html | ステータス監視 |
| 5 | Transaction List | 05_transaction_list.html | TX一覧 |
| 6 | Transaction Detail | 06_transaction_detail.html | TX詳細 |
| 7 | Transaction Export | 07_transaction_export.html | TXエクスポート |
| 8 | Transaction Analytics | 08_transaction_analytics.html | TX分析 |
| 9 | User List | 09_user_list.html | ユーザー一覧 |
| 10 | User Detail | 10_user_detail.html | ユーザー詳細 |
| 11 | User Create | 11_user_create.html | ユーザー作成 |
| 12 | Role Management | 12_role_management.html | ロール管理 |
| 13 | Invite User | 13_invite_user.html | ユーザー招待 |
| 14 | API Keys | 14_api_keys.html | APIキー一覧 |
| 15 | Create API Key | 15_create_api_key.html | APIキー作成 |
| 16 | API Usage | 16_api_usage.html | API使用状況 |
| 17 | Webhooks | 17_webhooks.html | Webhook設定 |
| 18 | Org Settings | 18_org_settings.html | 組織設定 |
| 19 | Security Settings | 19_security_settings.html | セキュリティ設定 |
| 20 | Notification Settings | 20_notification_settings.html | 通知設定 |
| 21 | Limit Settings | 21_limit_settings.html | 制限設定 |
| 22 | Monthly Report | 22_monthly_report.html | 月次レポート |
| 23 | Compliance Report | 23_compliance_report.html | コンプライアンスレポート |
| 24 | Audit Log | 24_audit_log.html | 監査ログ |
| 25 | Support Portal | 25_support_portal.html | サポートポータル |

### 2.8 System 08: QS Admin（12画面）

**対象ユーザー**: QS運営チーム
**パス**: `docs_new/01_phase/04_phase4/01_design/system_08_qs_admin/wip/mocks/`

| # | 画面 | ファイル | 機能 |
|---|------|----------|------|
| 1 | Dashboard | 01_dashboard.html | 運営ダッシュボード |
| 2 | Emergency | 02_emergency.html | 緊急対応 |
| 3 | Onboarding | 03_onboarding.html | オンボーディング管理 |
| 4 | Prover | 04_prover.html | Prover管理 |
| 5 | TX Monitor | 05_tx_monitor.html | TX監視 |
| 6 | Nodes | 06_nodes.html | ノード管理 |
| 7 | Staff | 07_staff.html | スタッフ管理 |
| 8 | Reports | 08_reports.html | レポート |
| 9 | Audit | 09_audit.html | 監査 |
| 10 | Parameters | 10_parameters.html | パラメータ設定 |
| 11 | Enterprise | 11_enterprise.html | Enterprise管理 |
| 12 | Community | 12_community.html | コミュニティ管理 |

---

## 3. 開発アプローチ

### 3.1 最新AI/UXベストプラクティスの統合

Phase 6では、世界最高峰のAI/UX開発手法を統合する：

#### Anthropic Agent Skills (参考)
- **Progressive Disclosure**: 必要な情報を段階的に提供
- **Skill-based Architecture**: 機能をモジュラーなスキルとして設計
- **MCP (Model Context Protocol)**: 標準化されたコンテキスト管理

> Source: [Anthropic Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)

#### OpenAI AgentKit / Agents SDK (参考)
- **Single Agent First**: まずシンプルに、複雑化は必要になってから
- **Measure → Improve → Ship**: 計測→改善→出荷のループ
- **Iterative Deployment**: 小さく始めて段階的に拡張

> Source: [OpenAI Agent Platform](https://openai.com/agent-platform/), [Practical Guide to Building Agents](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf)

### 3.2 SEP v3フレームワークの活用

既存のSEP v3プロセスを継続：

```
27_task_extraction → 20_task_define → 21_impl_verify_loop →
22_three_agent → 24_sandbox_execute → 25_event_log → 05_pir
```

### 3.3 Phase 6特有のプロセス

```
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 6 SPECIFIC PROCESSES                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  【UI/UX強化プロセス】                                               │
│  1. Design PIR: ペルソナレビュー（CDO、Marketing、Legal、ユーザー）  │
│  2. A11y Check: アクセシビリティ検証                                │
│  3. i18n Audit: 日英切替完全性監査                                  │
│                                                                     │
│  【統合テストプロセス】                                              │
│  1. E2E Integration: Sepolia Testnet上での統合テスト                │
│  2. Real Data Flow: 実際のデータフローの検証                        │
│  3. Error Scenario: エラーシナリオのテスト                          │
│                                                                     │
│  【ドキュメントプロセス】                                            │
│  1. Legal Review: 法務チームによるレビュー                          │
│  2. Technical Accuracy: 技術的正確性の検証                          │
│  3. User Testing: ユーザーによる可読性テスト                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. タスク構造

### 4.1 ワークストリーム概要

```
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 6 WORKSTREAMS                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  WS-1: UI/UX Excellence（8システム / 98画面）                       │
│  ├── 1.1 デザインシステム実装                                        │
│  ├── 1.2 System 01: Consumer App（19画面）                          │
│  ├── 1.3 System 02: Token Hub（10画面）                             │
│  ├── 1.4 System 03: Governance（6画面）                             │
│  ├── 1.5 System 04: Prover Portal（11画面）                         │
│  ├── 1.6 System 05: Observer（7画面）                               │
│  ├── 1.7 System 06: Explorer（8画面）                               │
│  ├── 1.8 System 07: Enterprise Admin（25画面）                      │
│  ├── 1.9 System 08: QS Admin（12画面）                              │
│  ├── 1.10 日英国際化完全対応                                         │
│  ├── 1.11 アクセシビリティ対応                                       │
│  └── 1.12 ペルソナベースUXテスト                                     │
│                                                                     │
│  WS-2: Backend Integration                                          │
│  ├── 2.1 API実装（モック禁止、実DB接続）                             │
│  ├── 2.2 データベース設計・実装                                      │
│  ├── 2.3 Sepolia Testnet接続                                        │
│  ├── 2.4 L3 Aegis統合                                               │
│  └── 2.5 Chainlink VRF統合                                          │
│                                                                     │
│  WS-3: Documentation                                                │
│  ├── 3.1 ホワイトペーパー                                            │
│  ├── 3.2 技術仕様書                                                  │
│  ├── 3.3 利用規約・プライバシーポリシー                              │
│  ├── 3.4 データ規約・SLA                                             │
│  └── 3.5 契約書テンプレート                                          │
│                                                                     │
│  WS-4: Quality Assurance                                            │
│  ├── 4.1 E2E統合テスト（8システム）                                  │
│  ├── 4.2 セキュリティ監査                                            │
│  ├── 4.3 パフォーマンステスト                                        │
│  └── 4.4 UAT（ユーザー受け入れテスト）                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 システム優先度とペルソナマッピング

| 優先度 | システム | 画面数 | 主要ペルソナ | 理由 |
|:------:|----------|:------:|-------------|------|
| **P1** | Consumer App | 19 | 田中さん（End User） | コアユースケース |
| **P1** | Prover Portal | 11 | 山田さん（Prover） | プロトコル中核 |
| **P1** | Enterprise Admin | 25 | 佐藤さん（Service Provider） | B2B収益 |
| **P2** | Token Hub | 10 | 鈴木さん（Token Holder） | トークンエコノミー |
| **P2** | Governance | 6 | 渡辺さん（Delegate） | DAO運営 |
| **P2** | QS Admin | 12 | QS運営 | 運営必須 |
| **P3** | Observer | 7 | Observer | セキュリティ補助 |
| **P3** | Explorer | 8 | 一般ユーザー | 透明性確保 |

---

## 5. WS-1: UI/UX Excellence（詳細タスク）

### 5.1 デザインシステム実装

```markdown
## WS-1.1: デザインシステム実装（共通基盤）
- [ ] TASK-P6-001: CSS Variables設定（Premium Japan）
- [ ] TASK-P6-002: Tailwind Config設定
- [ ] TASK-P6-003: 共通コンポーネントライブラリ構築
  - [ ] Button (Primary/Secondary/Outline/Ghost)
  - [ ] Card (Standard/Interactive/Accent/Stats)
  - [ ] Input (Text/Amount/Select/Search/Date)
  - [ ] Badge (Status/Quantum/Role)
  - [ ] Progress Bar (Timelock/Loading)
  - [ ] Tooltip (専門用語説明用)
  - [ ] Modal (Confirm/Form/Info)
  - [ ] Toast (Success/Error/Warning/Info)
  - [ ] Table (Sortable/Paginated/Exportable)
  - [ ] Chart (Line/Bar/Pie/Area)
  - [ ] Navigation (Header/Sidebar/Breadcrumb)
  - [ ] Wallet Connect Button
- [ ] TASK-P6-004: 日の丸アニメーション実装
- [ ] TASK-P6-005: レスポンシブレイアウト基盤
- [ ] TASK-P6-006: ダーク/ライトモード切替
```

### 5.2 System 01: Consumer App（19画面）

```markdown
## WS-1.2: Consumer App UI実装
- [ ] TASK-P6-010: 01_landing.html → React実装
- [ ] TASK-P6-011: 02_onboarding.html → React実装
- [ ] TASK-P6-012: 03_dashboard.html → React実装
- [ ] TASK-P6-013: 04_unlock.html → React実装
- [ ] TASK-P6-014: 05_history.html → React実装
- [ ] TASK-P6-015: 06_settings.html → React実装
- [ ] TASK-P6-016: 07_key_management.html → React実装
- [ ] TASK-P6-017: 08_faq.html → React実装
- [ ] TASK-P6-018: 09_security.html → React実装
- [ ] TASK-P6-019: 10_lock_processing/success.html → React実装
- [ ] TASK-P6-020: 11_unlock_sign.html → React実装
- [ ] TASK-P6-021: 12_unlock_processing.html → React実装
- [ ] TASK-P6-022: 13_unlock_success.html → React実装
- [ ] TASK-P6-023: 14_emergency_bond.html → React実装
- [ ] TASK-P6-024: 15_emergency_processing.html → React実装
- [ ] TASK-P6-025: 16_emergency_success.html → React実装
- [ ] TASK-P6-026: 17_terms.html → React実装
- [ ] TASK-P6-027: 18_privacy.html → React実装
- [ ] TASK-P6-028: Consumer App API統合
- [ ] TASK-P6-029: Consumer App Design PIR
```

### 5.3 System 02: Token Hub（10画面）

```markdown
## WS-1.3: Token Hub UI実装
- [ ] TASK-P6-030: 01_dashboard.html → React実装
- [ ] TASK-P6-031: 02_lock_form.html → React実装
- [ ] TASK-P6-032: 02_lock_preview.html → React実装
- [ ] TASK-P6-033: 02_lock_confirm.html → React実装
- [ ] TASK-P6-034: 02_lock_success.html → React実装
- [ ] TASK-P6-035: 03_delegate_list.html → React実装
- [ ] TASK-P6-036: 03_delegate_detail.html → React実装
- [ ] TASK-P6-037: 03_delegate_form.html → React実装
- [ ] TASK-P6-038: 04_rewards_dashboard.html → React実装
- [ ] TASK-P6-039: 04_claim_rewards.html → React実装
- [ ] TASK-P6-040: Token Hub API統合
- [ ] TASK-P6-041: Token Hub Design PIR
```

### 5.4 System 03: Governance（6画面）

```markdown
## WS-1.4: Governance UI実装
- [ ] TASK-P6-050: 01_dashboard.html → React実装
- [ ] TASK-P6-051: 02_proposals_list.html → React実装
- [ ] TASK-P6-052: 02_proposal_detail.html → React実装
- [ ] TASK-P6-053: 03_create_proposal.html → React実装
- [ ] TASK-P6-054: 04_my_activity.html → React実装
- [ ] TASK-P6-055: 05_council.html → React実装
- [ ] TASK-P6-056: Governance API統合
- [ ] TASK-P6-057: Governance Design PIR
```

### 5.5 System 04: Prover Portal（11画面）

```markdown
## WS-1.5: Prover Portal UI実装
- [ ] TASK-P6-060: 01_landing.html → React実装
- [ ] TASK-P6-061: 02_requirements.html → React実装
- [ ] TASK-P6-062: 03_application.html → React実装
- [ ] TASK-P6-063: 04_status.html → React実装
- [ ] TASK-P6-064: 05_activation.html → React実装
- [ ] TASK-P6-065: 06_dashboard.html → React実装
- [ ] TASK-P6-066: 07_queue.html → React実装
- [ ] TASK-P6-067: 08_metrics.html → React実装
- [ ] TASK-P6-068: 09_alerts.html → React実装
- [ ] TASK-P6-069: 10_challenge.html → React実装
- [ ] TASK-P6-070: 11_exit.html → React実装
- [ ] TASK-P6-071: Prover Portal API統合
- [ ] TASK-P6-072: Prover Portal Design PIR
```

### 5.6 System 05: Observer（7画面）

```markdown
## WS-1.6: Observer UI実装
- [ ] TASK-P6-080: 01_dashboard.html → React実装
- [ ] TASK-P6-081: 01_pending.html → React実装
- [ ] TASK-P6-082: 01_suspicious.html → React実装
- [ ] TASK-P6-083: 01_history.html → React実装
- [ ] TASK-P6-084: 02_challenge_form.html → React実装
- [ ] TASK-P6-085: 02_challenge_progress.html → React実装
- [ ] TASK-P6-086: 03_earnings.html → React実装
- [ ] TASK-P6-087: Observer API統合
- [ ] TASK-P6-088: Observer Design PIR
```

### 5.7 System 06: Explorer（8画面）

```markdown
## WS-1.7: Explorer UI実装
- [ ] TASK-P6-090: 01_overview.html → React実装
- [ ] TASK-P6-091: 02_search.html → React実装
- [ ] TASK-P6-092: 03_locks.html → React実装
- [ ] TASK-P6-093: 04_unlocks.html → React実装
- [ ] TASK-P6-094: 05_challenges.html → React実装
- [ ] TASK-P6-095: 06_address.html → React実装
- [ ] TASK-P6-096: 07_provers.html → React実装
- [ ] TASK-P6-097: 08_analytics.html → React実装
- [ ] TASK-P6-098: Explorer API統合
- [ ] TASK-P6-099: Explorer Design PIR
```

### 5.8 System 07: Enterprise Admin（25画面）

```markdown
## WS-1.8: Enterprise Admin UI実装
- [ ] TASK-P6-100: 01_overview_dashboard.html → React実装
- [ ] TASK-P6-101: 02_tvl_dashboard.html → React実装
- [ ] TASK-P6-102: 03_volume_dashboard.html → React実装
- [ ] TASK-P6-103: 04_status_dashboard.html → React実装
- [ ] TASK-P6-104: 05_transaction_list.html → React実装
- [ ] TASK-P6-105: 06_transaction_detail.html → React実装
- [ ] TASK-P6-106: 07_transaction_export.html → React実装
- [ ] TASK-P6-107: 08_transaction_analytics.html → React実装
- [ ] TASK-P6-108: 09_user_list.html → React実装
- [ ] TASK-P6-109: 10_user_detail.html → React実装
- [ ] TASK-P6-110: 11_user_create.html → React実装
- [ ] TASK-P6-111: 12_role_management.html → React実装
- [ ] TASK-P6-112: 13_invite_user.html → React実装
- [ ] TASK-P6-113: 14_api_keys.html → React実装
- [ ] TASK-P6-114: 15_create_api_key.html → React実装
- [ ] TASK-P6-115: 16_api_usage.html → React実装
- [ ] TASK-P6-116: 17_webhooks.html → React実装
- [ ] TASK-P6-117: 18_org_settings.html → React実装
- [ ] TASK-P6-118: 19_security_settings.html → React実装
- [ ] TASK-P6-119: 20_notification_settings.html → React実装
- [ ] TASK-P6-120: 21_limit_settings.html → React実装
- [ ] TASK-P6-121: 22_monthly_report.html → React実装
- [ ] TASK-P6-122: 23_compliance_report.html → React実装
- [ ] TASK-P6-123: 24_audit_log.html → React実装
- [ ] TASK-P6-124: 25_support_portal.html → React実装
- [ ] TASK-P6-125: Enterprise Admin API統合
- [ ] TASK-P6-126: Enterprise Admin Design PIR
```

### 5.9 System 08: QS Admin（12画面）

```markdown
## WS-1.9: QS Admin UI実装
- [ ] TASK-P6-130: 01_dashboard.html → React実装
- [ ] TASK-P6-131: 02_emergency.html → React実装
- [ ] TASK-P6-132: 03_onboarding.html → React実装
- [ ] TASK-P6-133: 04_prover.html → React実装
- [ ] TASK-P6-134: 05_tx_monitor.html → React実装
- [ ] TASK-P6-135: 06_nodes.html → React実装
- [ ] TASK-P6-136: 07_staff.html → React実装
- [ ] TASK-P6-137: 08_reports.html → React実装
- [ ] TASK-P6-138: 09_audit.html → React実装
- [ ] TASK-P6-139: 10_parameters.html → React実装
- [ ] TASK-P6-140: 11_enterprise.html → React実装
- [ ] TASK-P6-141: 12_community.html → React実装
- [ ] TASK-P6-142: QS Admin API統合
- [ ] TASK-P6-143: QS Admin Design PIR
```

### 5.10 国際化（i18n）完全対応

```markdown
## WS-1.10: 国際化対応
- [ ] TASK-P6-150: i18n基盤設定（next-intl）
- [ ] TASK-P6-151: System 01 翻訳ファイル（日英）
- [ ] TASK-P6-152: System 02 翻訳ファイル（日英）
- [ ] TASK-P6-153: System 03 翻訳ファイル（日英）
- [ ] TASK-P6-154: System 04 翻訳ファイル（日英）
- [ ] TASK-P6-155: System 05 翻訳ファイル（日英）
- [ ] TASK-P6-156: System 06 翻訳ファイル（日英）
- [ ] TASK-P6-157: System 07 翻訳ファイル（日英）
- [ ] TASK-P6-158: System 08 翻訳ファイル（日英）
- [ ] TASK-P6-159: 共通コンポーネント翻訳ファイル（日英）
- [ ] TASK-P6-160: 言語切替コンポーネント
- [ ] TASK-P6-161: 数値・日付フォーマット国際化
- [ ] TASK-P6-162: i18n完全性監査（全98画面）
```

### 5.11 アクセシビリティ対応

```markdown
## WS-1.11: アクセシビリティ対応
- [ ] TASK-P6-170: WCAG 2.1 AA準拠チェック（全システム）
- [ ] TASK-P6-171: キーボードナビゲーション実装
- [ ] TASK-P6-172: スクリーンリーダー対応（aria-*属性）
- [ ] TASK-P6-173: コントラスト比検証（4.5:1以上）
- [ ] TASK-P6-174: Reduced Motion対応
- [ ] TASK-P6-175: Focus Visible実装
```

### 5.12 ペルソナベースUXテスト

```markdown
## WS-1.12: UXテスト
- [ ] TASK-P6-180: 田中さんジャーニーテスト（Consumer App）
- [ ] TASK-P6-181: 山田さんジャーニーテスト（Prover Portal）
- [ ] TASK-P6-182: 佐藤さんジャーニーテスト（Enterprise Admin）
- [ ] TASK-P6-183: 鈴木さんジャーニーテスト（Token Hub）
- [ ] TASK-P6-184: 渡辺さんジャーニーテスト（Governance）
- [ ] TASK-P6-185: 統合ジャーニーテスト（クロスシステム）
```

---

## 6. WS-2: Backend Integration（詳細タスク）

### 6.1 API設計原則

> ⚠️ **重要**: APIのモックデータ返却は禁止。必ず実DBに接続すること。
> データベースがない場合は、まず報告してから対応方法を検討する。

### 6.2 API実装

```markdown
## WS-2.1: API実装
- [ ] TASK-P6-200: API設計書作成（OpenAPI 3.0）
- [ ] TASK-P6-201: 認証・認可基盤（JWT + Wallet Signature）
- [ ] TASK-P6-202: Consumer App API（Lock/Unlock/History/Emergency）
- [ ] TASK-P6-203: Token Hub API（QS Lock/veQS/Delegate/Rewards）
- [ ] TASK-P6-204: Governance API（Proposals/Voting/Council）
- [ ] TASK-P6-205: Prover Portal API（Application/Status/Queue/Metrics）
- [ ] TASK-P6-206: Observer API（Monitor/Challenge/Earnings）
- [ ] TASK-P6-207: Explorer API（Search/Locks/Unlocks/Analytics）
- [ ] TASK-P6-208: Enterprise Admin API（全エンドポイント）
- [ ] TASK-P6-209: QS Admin API（全エンドポイント）
- [ ] TASK-P6-210: WebSocket実装（リアルタイム更新）
```

### 6.3 Database設計・実装

```markdown
## WS-2.2: Database設計・実装
- [ ] TASK-P6-220: ERD設計（全8システム対応）
- [ ] TASK-P6-221: PostgreSQL スキーマ定義
- [ ] TASK-P6-222: Prisma ORM設定
- [ ] TASK-P6-223: マイグレーション設定
- [ ] TASK-P6-224: インデックス最適化
- [ ] TASK-P6-225: シードデータ作成
- [ ] TASK-P6-226: バックアップ戦略
```

### 6.4 Blockchain Integration

```markdown
## WS-2.3: Sepolia Testnet接続
- [ ] TASK-P6-230: L1 Vault コントラクトデプロイ
- [ ] TASK-P6-231: ethers.js/viem統合
- [ ] TASK-P6-232: Transaction監視
- [ ] TASK-P6-233: Event Listener実装
- [ ] TASK-P6-234: Gas推定・表示

## WS-2.4: L3 Aegis統合
- [ ] TASK-P6-240: L3 RPC接続
- [ ] TASK-P6-241: BFT合意状態取得
- [ ] TASK-P6-242: SMT Proof検証
- [ ] TASK-P6-243: Lock/Unlock状態同期

## WS-2.5: Chainlink VRF統合
- [ ] TASK-P6-250: VRF Coordinator接続
- [ ] TASK-P6-251: Prover選出ロジック
- [ ] TASK-P6-252: VRF結果検証
```

---

## 7. WS-3: Documentation（詳細タスク）

```markdown
## WS-3.1: ホワイトペーパー
- [ ] TASK-P6-300: 構成策定・アウトライン
- [ ] TASK-P6-301: 技術概要セクション
- [ ] TASK-P6-302: 経済モデルセクション
- [ ] TASK-P6-303: ガバナンスセクション
- [ ] TASK-P6-304: ロードマップセクション
- [ ] TASK-P6-305: 日英両版作成
- [ ] TASK-P6-306: PDF/Web版作成

## WS-3.2: 技術仕様書
- [ ] TASK-P6-310: API仕様書（OpenAPI）
- [ ] TASK-P6-311: コントラクト仕様書
- [ ] TASK-P6-312: データベース仕様書
- [ ] TASK-P6-313: セキュリティ仕様書

## WS-3.3: 利用規約・プライバシーポリシー
- [ ] TASK-P6-320: 利用規約ドラフト作成
- [ ] TASK-P6-321: プライバシーポリシードラフト
- [ ] TASK-P6-322: Cookie Policy
- [ ] TASK-P6-323: 法務レビュー依頼
- [ ] TASK-P6-324: 日英両版最終化

## WS-3.4: SLA・データ規約
- [ ] TASK-P6-330: SLA定義（可用性99.5%等）
- [ ] TASK-P6-331: データ保持ポリシー
- [ ] TASK-P6-332: インシデント対応手順
- [ ] TASK-P6-333: サポートレベル定義

## WS-3.5: 契約書テンプレート
- [ ] TASK-P6-340: Prover契約書テンプレート
- [ ] TASK-P6-341: Enterprise契約書テンプレート
- [ ] TASK-P6-342: パートナー契約書テンプレート
- [ ] TASK-P6-343: NDA テンプレート
```

---

## 8. WS-4: Quality Assurance（詳細タスク）

```markdown
## WS-4.1: E2E統合テスト（全8システム）
- [ ] TASK-P6-400: E2Eテスト基盤構築（Playwright）
- [ ] TASK-P6-401: Consumer App E2E（19シナリオ）
- [ ] TASK-P6-402: Token Hub E2E（10シナリオ）
- [ ] TASK-P6-403: Governance E2E（6シナリオ）
- [ ] TASK-P6-404: Prover Portal E2E（11シナリオ）
- [ ] TASK-P6-405: Observer E2E（7シナリオ）
- [ ] TASK-P6-406: Explorer E2E（8シナリオ）
- [ ] TASK-P6-407: Enterprise Admin E2E（25シナリオ）
- [ ] TASK-P6-408: QS Admin E2E（12シナリオ）
- [ ] TASK-P6-409: クロスシステムE2E（Lock→Unlock→Emergency）

## WS-4.2: セキュリティ監査
- [ ] TASK-P6-410: スマートコントラクト監査準備
- [ ] TASK-P6-411: フロントエンドセキュリティ監査
- [ ] TASK-P6-412: API セキュリティテスト
- [ ] TASK-P6-413: ペネトレーションテスト

## WS-4.3: パフォーマンステスト
- [ ] TASK-P6-420: 負荷テスト（k6）
- [ ] TASK-P6-421: Lighthouse監査（全8システム）
- [ ] TASK-P6-422: Core Web Vitals最適化

## WS-4.4: UAT
- [ ] TASK-P6-430: UATシナリオ作成（ペルソナ別）
- [ ] TASK-P6-431: 内部UATセッション
- [ ] TASK-P6-432: フィードバック収集・反映
```

---

## 9. タスクサマリー

### 9.1 タスク数集計

| ワークストリーム | サブカテゴリ | タスク数 |
|-----------------|-------------|:--------:|
| **WS-1** | デザインシステム | 6 |
| | System 01: Consumer App | 20 |
| | System 02: Token Hub | 12 |
| | System 03: Governance | 8 |
| | System 04: Prover Portal | 13 |
| | System 05: Observer | 9 |
| | System 06: Explorer | 10 |
| | System 07: Enterprise Admin | 27 |
| | System 08: QS Admin | 14 |
| | 国際化（i18n） | 13 |
| | アクセシビリティ | 6 |
| | UXテスト | 6 |
| **WS-1 小計** | | **144** |
| **WS-2** | API実装 | 11 |
| | Database | 7 |
| | Sepolia | 5 |
| | L3 Aegis | 4 |
| | Chainlink VRF | 3 |
| **WS-2 小計** | | **30** |
| **WS-3** | ホワイトペーパー | 7 |
| | 技術仕様書 | 4 |
| | 利用規約等 | 5 |
| | SLA等 | 4 |
| | 契約書 | 4 |
| **WS-3 小計** | | **24** |
| **WS-4** | E2E | 10 |
| | セキュリティ | 4 |
| | パフォーマンス | 3 |
| | UAT | 3 |
| **WS-4 小計** | | **20** |
| **総計** | | **218** |

---

## 10. 依存関係と実行順序

### 10.1 依存関係グラフ

```
┌─────────────────────────────────────────────────────────────────────┐
│  DEPENDENCY GRAPH (8 SYSTEMS)                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  LAYER 1: Foundation                                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │ WS-1.1      │    │ WS-2.2      │    │ WS-2.3      │             │
│  │ Design      │    │ Database    │    │ Sepolia     │             │
│  │ System      │    │ Design      │    │ Connection  │             │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘             │
│         │                  │                  │                    │
│         ▼                  ▼                  ▼                    │
│  LAYER 2: P1 Systems + API                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │ System 01   │    │ System 04   │    │ System 07   │             │
│  │ Consumer    │    │ Prover      │    │ Enterprise  │             │
│  │ (19画面)    │    │ (11画面)    │    │ (25画面)    │             │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘             │
│         │                  │                  │                    │
│         └──────────────────┼──────────────────┘                    │
│                            ▼                                        │
│  LAYER 3: P2 Systems                                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │ System 02   │    │ System 03   │    │ System 08   │             │
│  │ Token Hub   │    │ Governance  │    │ QS Admin    │             │
│  │ (10画面)    │    │ (6画面)     │    │ (12画面)    │             │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘             │
│         │                  │                  │                    │
│         └──────────────────┼──────────────────┘                    │
│                            ▼                                        │
│  LAYER 4: P3 Systems                                                │
│  ┌─────────────┐    ┌─────────────┐                                │
│  │ System 05   │    │ System 06   │                                │
│  │ Observer    │    │ Explorer    │                                │
│  │ (7画面)     │    │ (8画面)     │                                │
│  └──────┬──────┘    └──────┬──────┘                                │
│         │                  │                                       │
│         └────────┬─────────┘                                       │
│                  ▼                                                 │
│  LAYER 5: Cross-cutting                                            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │ WS-1.10     │    │ WS-1.11     │    │ WS-3.x      │             │
│  │ i18n        │    │ A11y        │    │ Docs        │             │
│  └──────┬──────┘    └──────┬──────┘    └─────────────┘             │
│         │                  │                                       │
│         └────────┬─────────┘                                       │
│                  ▼                                                 │
│  LAYER 6: QA & Release                                             │
│  ┌─────────────┐    ┌─────────────┐                                │
│  │ WS-4.x      │    │ WS-1.12     │                                │
│  │ Testing     │    │ UX Test     │                                │
│  └─────────────┘    └─────────────┘                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 11. 品質ゲート

### 11.1 システム別完了条件

| システム | 完了条件 |
|---------|---------|
| Consumer App | 19画面実装、API統合、i18n完了、Design PIR Pass |
| Token Hub | 10画面実装、API統合、i18n完了、Design PIR Pass |
| Governance | 6画面実装、API統合、i18n完了、Design PIR Pass |
| Prover Portal | 11画面実装、API統合、i18n完了、Design PIR Pass |
| Observer | 7画面実装、API統合、i18n完了、Design PIR Pass |
| Explorer | 8画面実装、API統合、i18n完了、Design PIR Pass |
| Enterprise Admin | 25画面実装、API統合、i18n完了、Design PIR Pass |
| QS Admin | 12画面実装、API統合、i18n完了、Design PIR Pass |

### 11.2 品質基準

| カテゴリ | 基準 |
|---------|------|
| **テストカバレッジ** | ≥ 80% |
| **E2E Pass率** | 100% |
| **Lighthouse Score** | ≥ 90 (Performance, Accessibility) |
| **WCAG準拠** | AA Level |
| **i18n カバレッジ** | 100%（98画面漏れゼロ） |
| **セキュリティ監査** | High/Critical 0件 |

---

## 12. Phase 6専用プロンプト

### 12.1 作成済みプロンプト

| # | ファイル | 目的 | ステータス |
|---|----------|------|:----------:|
| 31 | `31_design_pir.md` | デザインPIR（ペルソナレビュー） | ✅ 作成済 |
| 32 | `32_i18n_audit.md` | 国際化完全性監査 | ✅ 作成済 |

### 12.2 追加作成予定

| # | ファイル | 目的 |
|---|----------|------|
| 30 | `30_ui_impl.md` | UIコンポーネント実装 |
| 33 | `33_a11y_check.md` | アクセシビリティ検証 |
| 34 | `34_api_impl.md` | API実装（モック禁止） |
| 35 | `35_db_design.md` | データベース設計 |
| 36 | `36_doc_write.md` | ドキュメント作成 |
| 37 | `37_e2e_test.md` | E2E統合テスト |

---

## 13. 次のアクション

### 13.1 承認後の即時アクション

1. **WS-1.1: デザインシステム実装**（TASK-P6-001〜006）
2. **WS-2.2: Database設計**（TASK-P6-220〜226）
3. **WS-2.3: Sepolia接続**（TASK-P6-230〜234）
4. **追加プロンプト作成**（30, 33-37）

### 13.2 P1システム並行開発

デザインシステム完成後、以下を並行開発：

- System 01: Consumer App（19画面）
- System 04: Prover Portal（11画面）
- System 07: Enterprise Admin（25画面）

---

## 14. 参考リソース

### 14.1 外部リソース

- [Anthropic Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- [Anthropic Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [OpenAI Agent Platform](https://openai.com/agent-platform/)
- [OpenAI Practical Guide to Building Agents](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf)

### 14.2 内部リソース

- `docs_new/00_core/CORE_PRINCIPLES.md`
- `docs_new/00_core/specs/UNIFIED_SPEC.md`
- `docs_new/00_core/specs/SEQUENCES.md`
- `docs_new/01_phase/04_phase4/01_design/UI_DESIGN_GUIDELINES.md`
- `docs_new/01_phase/04_phase4/01_design/DESIGN_REVIEW_AGENTS.md`
- `docs_new/01_phase/04_phase4/01_design/system_01_consumer/` ～ `system_08_qs_admin/`

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-13 | 初版作成 |
| 2.0 | 2026-01-13 | 8システム98画面の詳細追加、218タスクに拡張 |
| 3.0 | 2026-01-14 | AI Agentic開発手法の適用（Multi-Agent, Playwright Healer, Visual AI） |

---

**END OF DOCUMENT**
