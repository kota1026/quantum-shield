# Quantum Shield - Claude Code Instructions

## Phase 6 AI Agentic Development

このプロジェクトはPhase 6（サービスリリース準備フェーズ）において、AI Agentic開発手法を採用しています。

---

## 自動トリガー

以下のコマンドを検出した場合、自動的に対応するプロンプトを読み込んで実行してください：

### Phase 6 開始コマンド

| トリガー | アクション |
|---------|-----------|
| `Phase 6 Week {N} 開始` | `38_orchestrator.md` を読み込み、指定Weekのタスクを実行 |
| `Phase 6 {System名} 開始` | `38_orchestrator.md` を読み込み、指定システムを開発 |
| `UI Agent: {target}` | `30_ui_impl.md` を読み込み、HTML→React変換 |
| `API Agent: {target}` | `34_api_impl.md` を読み込み、API実装 |
| `Test Agent: {target}` | `37_e2e_test.md` を読み込み、E2Eテスト生成 |

---

## 必須ルール

```xml
<rule id="CLAUDE-1" level="ABSOLUTE">
  APIのモックデータ返却は禁止。
  データベースがない場合は、まず報告してから対応方法を検討する。
</rule>

<rule id="CLAUDE-2" level="ABSOLUTE">
  日英切替漏れは禁止。
  全テキストは t('key') 経由でアクセスすること。
</rule>

<rule id="CLAUDE-3" level="MUST">
  WCAG 2.1 AA準拠。
  全インタラクティブ要素にキーボードアクセシビリティを確保。
</rule>
```

---

## プロンプトパス

```
docs_new/02_agents_prompt/02_prompts/
├── 30_ui_impl.md      # UI Agent
├── 31_design_pir.md   # Review Agent
├── 32_i18n_audit.md   # i18n Agent
├── 33_a11y_check.md   # A11y Agent
├── 34_api_impl.md     # API Agent
├── 35_db_design.md    # DB Design
├── 36_doc_write.md    # Doc Agent
├── 37_e2e_test.md     # Test Agent
└── 38_orchestrator.md # Team Lead Agent (Orchestrator)
```

---

## システム一覧

| ID | System | 画面数 | Mocks Path |
|:--:|--------|:------:|------------|
| 01 | Consumer App | 19 | `system_01_consumer/wip/mocks/` |
| 02 | Token Hub | 10 | `system_02_token_hub/wip/mocks/` |
| 03 | Governance | 6 | `system_03_governance/wip/mocks/` |
| 04 | Prover Portal | 11 | `system_04_prover_portal/wip/mocks/` |
| 05 | Observer | 7 | `system_05_observer/wip/mocks/` |
| 06 | Explorer | 8 | `system_06_explorer/wip/mocks/` |
| 07 | Enterprise Admin | 25 | `system_07_enterprise/wip/mocks/` |
| 08 | QS Admin | 12 | `system_08_qs_admin/wip/mocks/` |

**Base Path**: `docs_new/01_phase/04_phase4/01_design/`

---

## MCP設定

Agent定義: `apps/web/mcp-config.json`

---

## 実行例

```
User: Phase 6 Week 2 開始。Consumer App から。

Claude: [38_orchestrator.md を自動読み込み]
        [Consumer App の19画面を検出]
        [UI Agent → API Agent → Test Agent パイプラインを起動]
```

---

## 参照ドキュメント

- [PHASE6_PLANNING_PROPOSAL.md](docs_new/01_phase/06_phase6/PHASE6_PLANNING_PROPOSAL.md)
- [AI_AGENTIC_IMPLEMENTATION_PLAN.md](docs_new/01_phase/06_phase6/AI_AGENTIC_IMPLEMENTATION_PLAN.md)
- [mcp-config.json](apps/web/mcp-config.json)
