# Phase 6 Prompt System Analysis & Improvement Proposal

> **Version**: 1.0
> **Date**: 2026-01-13
> **Purpose**: プロンプトシステムの分析と世界最高峰手法に基づく改善提案

---

## 1. 現在のプロンプトシステム構造

### 1.1 SEP v3 アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────────┐
│  SEP v3 (Spec-Execution-Proof) PROMPT SYSTEM                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  【基盤プロンプト】(01-07)                                           │
│  01_plan → 02_spec → 03_impl → 04_review → 05_pir → 06_update → 07_gonogo │
│                                                                     │
│  【デザインワークフロー】(08-11)                                      │
│  08_design_prep → 09_design_create → 10_design_pir → 11_design_fix  │
│                                                                     │
│  【SEP v3 強化プロンプト】(20-27)                                    │
│  27_task_extraction → 20_task_define → 21_impl_verify_loop →        │
│  22_three_agent → 23_multi_candidate → 24_sandbox_execute →         │
│  25_event_log → 05_pir                                              │
│                                                                     │
│  【Phase 6 新規】(31-32)                                             │
│  31_design_pir（ペルソナレビュー強化）                               │
│  32_i18n_audit（国際化監査）                                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 リサーチ統合状況

| リサーチ | ソース | 効果 | 統合先 |
|---------|--------|------|--------|
| Verifier-in-the-Loop | DafnyPro, PREFACE | +21% 検証成功率 | `21_impl_verify_loop.md` |
| 3-Agent Collaboration | AutoSafeCoder | -13% 脆弱性 | `22_three_agent.md` |
| Multi-Candidate | AlphaCode 2 | 上位15%品質 | `23_multi_candidate.md` |
| CodeAct Execution | OpenHands | 72% SWE-bench | `24_sandbox_execute.md` |
| Event-sourced | OpenHands SDK | 完全再現性 | `25_event_log.md` |

### 1.3 モック-デザインシート-ペルソナ連携状況

#### ✅ 現在確認できている連携

| 項目 | 参照先 | 実装状況 |
|------|--------|:--------:|
| デザインシート参照 | UI_DESIGN_GUIDELINES.md | ✅ 09_design_create.md で明示 |
| ペルソナレビュー | DESIGN_REVIEW_AGENTS.md | ✅ 10_design_pir.md で使用 |
| Premium Japan準拠 | design-concept-5-japan-premium.html | ✅ 09_design_create.md で参照 |
| PIR修正フロー | 11_design_fix.md | ✅ PIR指摘→修正→再PIR |

#### モック内のデザインシステム反映（確認済み）

```html
<!-- 03_dashboard.html より抜粋 -->
:root {
    --accent-hinomaru: #bc002d;      /* ← UI_DESIGN_GUIDELINES準拠 */
    --accent-gold: #c9a962;          /* ← Premium Gold */
    --font-body: 'Plus Jakarta Sans', 'Noto Sans JP', sans-serif;
}
```

---

## 2. 世界最高峰の手法リサーチ結果

### 2.1 Anthropic Claude 4.x プロンプトベストプラクティス

> Source: [Claude Prompting Best Practices](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices)

| 原則 | 説明 | 現在の対応 | 改善提案 |
|------|------|:----------:|---------|
| **Be Explicit** | 明示的な指示 | ⚠️ 部分的 | XML構造化を強化 |
| **XML-Style Tags** | 構造化タグ使用 | ⚠️ 部分的 | `<thinking>`, `<output>` 追加 |
| **Chain of Thought** | 思考プロセス | ⚠️ 一部のみ | Extended Thinking活用 |
| **Examples** | Few-shot例示 | ⚠️ 不足 | 各プロンプトに例追加 |
| **State Tracking** | 状態追跡 | ✅ JSON使用 | 維持 |

### 2.2 Google DeepMind Multi-Agent Patterns

> Source: [Multi-Agent Patterns in ADK](https://developers.googleblog.com/developers-guide-to-multi-agent-patterns-in-adk/)

| パターン | 説明 | 現在の対応 | 改善提案 |
|---------|------|:----------:|---------|
| **Sequential** | 直列処理 | ✅ 既存フロー | 維持 |
| **Parallel** | 並列処理 | ❌ なし | P1システム並行開発 |
| **Hierarchical** | 階層制御 | ⚠️ 部分的 | Orchestrator追加 |
| **Prompt Chaining** | プロンプト連鎖 | ✅ 既存 | ステート引継ぎ強化 |

### 2.3 MIT Media Lab - AI-Assisted Design

> Source: [Generative AI for Design Workshop 2025](https://www.media.mit.edu/events/generative-ai-for-design-workshop-2025-desai25/)

| 概念 | 説明 | 現在の対応 | 改善提案 |
|------|------|:----------:|---------|
| **Performance-Based Design** | 成果指標重視 | ⚠️ 部分的 | Lighthouse統合 |
| **Human-AI Collaboration** | 協調設計 | ✅ ペルソナPIR | 強化済み |
| **Iterative Refinement** | 反復改良 | ✅ PIR→Fix | 維持 |

### 2.4 OpenAI AgentKit - Agent Development

> Source: [OpenAI Agent Platform](https://openai.com/agent-platform/)

| 概念 | 説明 | 現在の対応 | 改善提案 |
|------|------|:----------:|---------|
| **Single Agent First** | まずシンプルに | ❌ 複雑 | 簡易フロー活用促進 |
| **Measure→Improve→Ship** | 計測ループ | ⚠️ 部分的 | メトリクス追加 |
| **Guardrails** | ガードレール | ✅ AGENTS.md | 維持 |

---

## 3. 識別された改善点

### 3.1 プロンプト構造の改善

#### 問題1: XML構造化の不統一

**現状**:
```markdown
## 1. 憲法の読み込み
`docs_new/00_core/CORE_PRINCIPLES.md`
```

**改善案（Anthropic推奨形式）**:
```xml
<required_context>
  <constitution>
    <path>docs_new/00_core/CORE_PRINCIPLES.md</path>
    <purpose>不変原則の遵守</purpose>
    <priority>MUST_READ</priority>
  </constitution>
</required_context>
```

#### 問題2: Extended Thinking未活用

**改善案**:
```xml
<thinking_guidance>
  <before_action>
    1. 仕様書との整合性を確認
    2. ペルソナ視点での問題を洗い出し
    3. 技術的制約を評価
  </before_action>
  <output_format>
    <thinking>分析結果</thinking>
    <action>実行内容</action>
  </output_format>
</thinking_guidance>
```

### 3.2 Phase 6特有の不足

#### 問題3: UI実装プロンプトの欠如

現在の08-11はモック作成（HTML）用で、Phase 6の「React実装」には不適切。

**必要な新規プロンプト**:
```
30_ui_impl.md
├── 入力: Phase 4モックHTML
├── 参照: UI_DESIGN_GUIDELINES.md, デザインシート
├── 出力: Reactコンポーネント + Storybook + Test
├── 検証: Design PIR (31_design_pir.md)
└── i18n: 32_i18n_audit.md で検証
```

#### 問題4: i18n早期統合の欠如

モック作成時点では日本語ハードコード。Phase 6では最初からi18nキーを使用すべき。

**改善案**:
```jsx
// 現状（モック）
<button>ロックする</button>

// 改善後（React実装）
<button>{t('consumer.dashboard.lockButton')}</button>
```

#### 問題5: API連携プロンプトの欠如

**必要な新規プロンプト**:
```
34_api_impl.md
├── 入力: API設計書（OpenAPI）
├── 制約: モックデータ禁止（必ず実DB接続）
├── 出力: API Routes + Service Layer
├── 検証: E2Eテスト
└── 報告: DBがない場合は先に報告
```

### 3.3 ペルソナ活用の強化

#### 問題6: ペルソナフィードバックのトレーサビリティ不足

**現状**: PIRレポートに指摘は記録されるが、実装への反映追跡が弱い

**改善案**:
```markdown
## Persona Feedback Tracking

| ID | ペルソナ | 指摘 | 対応タスク | 実装状況 | 検証方法 |
|----|---------|------|-----------|:--------:|---------|
| PF-001 | 田中さん | 「専門用語わからない」 | TASK-P6-XXX | 🟡 進行中 | ツールチップ追加確認 |
```

---

## 4. 改善提案サマリー

### 4.1 プロンプト構造改善

| # | 改善項目 | 現状 | 改善後 | 優先度 |
|---|---------|------|--------|:------:|
| 1 | XML構造化 | Markdown混在 | Anthropic推奨XML | P1 |
| 2 | Extended Thinking | 未使用 | `<thinking>`タグ活用 | P2 |
| 3 | Few-shot Examples | 不足 | 各プロンプトに例追加 | P2 |
| 4 | State Tracking | JSON | 維持+強化 | P3 |

### 4.2 新規プロンプト提案

| # | ファイル | 目的 | 優先度 |
|---|----------|------|:------:|
| 30 | `30_ui_impl.md` | React実装（モック→コンポーネント） | P1 |
| 33 | `33_a11y_check.md` | アクセシビリティ検証 | P2 |
| 34 | `34_api_impl.md` | API実装（モック禁止） | P1 |
| 35 | `35_db_design.md` | データベース設計 | P1 |
| 36 | `36_doc_write.md` | ドキュメント作成 | P2 |
| 37 | `37_e2e_test.md` | E2E統合テスト | P2 |

### 4.3 既存プロンプト改善

| # | ファイル | 改善内容 | 優先度 |
|---|----------|---------|:------:|
| 09 | `09_design_create.md` | i18nキー早期導入ガイド追加 | P2 |
| 10 | `10_design_pir.md` | フィードバックトラッキング強化 | P2 |
| 31 | `31_design_pir.md` | XML構造化、Extended Thinking | P1 |
| 32 | `32_i18n_audit.md` | CI/CD統合強化 | P2 |

---

## 5. 推奨アーキテクチャ

### 5.1 Phase 6 プロンプトフロー（提案）

```
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 6 PROMPT FLOW                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  LAYER 0: Planning                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 27_task_extraction → PHASE6_PLANNING_PROPOSAL.md            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  LAYER 1: Foundation (並行実行可能)                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │ 35_db       │  │ 34_api      │  │ 30_ui_impl  │                │
│  │ _design.md  │  │ _impl.md    │  │ (共通)      │                │
│  │ (DB設計)    │  │ (API設計)   │  │ (Design Sys)│                │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                │
│         │                │                │                        │
│  LAYER 2: Implementation (システム別)                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 30_ui_impl.md (System 01) → 31_design_pir.md → 11_fix       │   │
│  │ 30_ui_impl.md (System 04) → 31_design_pir.md → 11_fix       │   │
│  │ 30_ui_impl.md (System 07) → 31_design_pir.md → 11_fix       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  LAYER 3: Cross-cutting                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │ 32_i18n     │  │ 33_a11y     │  │ 36_doc      │                │
│  │ _audit.md   │  │ _check.md   │  │ _write.md   │                │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘                │
│         │                │                                         │
│  LAYER 4: QA                                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 37_e2e_test.md → 24_sandbox_execute.md → 05_pir.md          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 プロンプト間ステート引継ぎ（提案）

```yaml
# session_state.yaml
session:
  id: "P6-S001-CONSUMER"
  system: "01_consumer"
  current_prompt: "30_ui_impl"
  completed_prompts:
    - "27_task_extraction"
    - "35_db_design"

artifacts:
  db_schema: "prisma/schema.prisma"
  api_spec: "openapi/consumer.yaml"
  design_manifest: "system_01_consumer/DESIGN_MANIFEST.md"

persona_feedback:
  - id: "PF-001"
    persona: "田中さん"
    issue: "専門用語わからない"
    status: "in_progress"
    task: "TASK-P6-016"

i18n_status:
  coverage: 85%
  missing_keys: ["consumer.emergency.bondExplanation"]
```

---

## 6. 実装ロードマップ

### Phase 6-A: 基盤整備

1. **30_ui_impl.md 作成** - UI実装の標準化
2. **34_api_impl.md 作成** - API実装（モック禁止）
3. **35_db_design.md 作成** - DB設計標準化
4. **既存プロンプトのXML構造化**

### Phase 6-B: 強化

1. **33_a11y_check.md 作成** - アクセシビリティ
2. **36_doc_write.md 作成** - ドキュメント
3. **37_e2e_test.md 作成** - E2Eテスト
4. **ペルソナフィードバックトラッキング実装**

### Phase 6-C: 最適化

1. **CI/CD統合** - i18n監査、a11y監査の自動化
2. **メトリクス収集** - プロンプト効果測定
3. **Extended Thinking活用** - 複雑タスクへの適用

---

## 7. 結論

### 7.1 現状評価

| カテゴリ | 評価 | コメント |
|---------|:----:|---------|
| 基盤プロンプト | ✅ 良好 | SEP v3は世界水準 |
| デザインワークフロー | ✅ 良好 | ペルソナ連携あり |
| Phase 6対応 | ⚠️ 不足 | 新規プロンプト必要 |
| 最新手法統合 | ⚠️ 部分的 | XML構造化、Extended Thinking未活用 |

### 7.2 推奨アクション

1. **即時**: 30_ui_impl.md, 34_api_impl.md, 35_db_design.md 作成
2. **短期**: 既存プロンプトのXML構造化
3. **中期**: Extended Thinking活用、メトリクス収集

---

## 8. 参考リソース

- [Claude Prompting Best Practices](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices)
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Google Multi-Agent Patterns in ADK](https://developers.googleblog.com/developers-guide-to-multi-agent-patterns-in-adk/)
- [MIT Generative AI for Design 2025](https://www.media.mit.edu/events/generative-ai-for-design-workshop-2025-desai25/)
- [OpenAI Agent Platform](https://openai.com/agent-platform/)

---

**END OF DOCUMENT**
