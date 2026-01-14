# Quantum Shield - Session Quick Start

## Trigger Commands

以下のコマンドで即座に作業開始できます：

| コマンド | 動作 |
|---------|------|
| `Phase 6 Week 2 開始` | 全システム順次開発 |
| `Phase 6 Consumer App 開始` | Consumer App (19画面) 開発 |
| `Phase 6 Token Hub 開始` | Token Hub (10画面) 開発 |
| `Phase 6 Prover Portal 開始` | Prover Portal (11画面) 開発 |

---

## Command Execution

上記コマンドを受けたら、以下を実行：

### 1. プロンプト読み込み
```
docs_new/02_agents_prompt/02_prompts/38_orchestrator.md
```

### 2. システム別モックパス
| System | Path |
|--------|------|
| Consumer App | `docs_new/01_phase/04_phase4/01_design/system_01_consumer/wip/mocks/` |
| Token Hub | `docs_new/01_phase/04_phase4/01_design/system_02_token_hub/wip/mocks/` |
| Prover Portal | `docs_new/01_phase/04_phase4/01_design/system_04_prover_portal/wip/mocks/` |

### 3. 画面ごとの処理パイプライン
```
HTML Mock → React Component → i18n → A11y → E2E Test → PIR
```

---

## Critical Rules

1. **APIモックデータ返却禁止** - 実DBがない場合は報告
2. **i18n必須** - 全テキストは `t('key')` 経由
3. **WCAG 2.1 AA** - アクセシビリティ準拠

---

## Reference Files

| 用途 | パス |
|------|------|
| Orchestrator | `docs_new/02_agents_prompt/02_prompts/38_orchestrator.md` |
| UI実装 | `docs_new/02_agents_prompt/02_prompts/30_ui_impl.md` |
| API実装 | `docs_new/02_agents_prompt/02_prompts/34_api_impl.md` |
| E2Eテスト | `docs_new/02_agents_prompt/02_prompts/37_e2e_test.md` |
| 計画書 | `docs_new/01_phase/06_phase6/PHASE6_PLANNING_PROPOSAL.md` |
| MCP設定 | `apps/web/mcp-config.json` |
