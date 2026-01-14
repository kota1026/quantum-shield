# Phase 6 Planning Proposal
## サービスリリース準備フェーズ（AI Agentic Enhanced）

> **Version**: 4.0
> **Date**: 2026-01-14
> **Status**: Implementation Ready
> **Author**: AI Planning Agent
> **Approach**: AI Agentic Multi-Agent Development

---

## 🚀 AI Agentic開発手法（Primary Approach）

Phase 6では**世界最高峰のAI Agentic手法**を全面適用し、8システム98画面の開発・テストを実行する。

### 適用技術サマリー

| 領域 | 適用手法 | 効果 |
|------|---------|------|
| Design→Code | HTML Mock → React自動変換 | 実装時間40-60%削減 |
| 開発体制 | Multi-Agent Team | 並列開発実現 |
| テスト | Playwright Healer Agent | 保守コスト70%削減 |
| Visual QA | Chromatic AI | 100%自動検出 |
| 探索テスト | Claude Computer Use | 自然言語テスト |

### 関連ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [AI_AGENTIC_UIUX_RESEARCH.md](./AI_AGENTIC_UIUX_RESEARCH.md) | 世界最高峰手法リサーチ |
| [AI_AGENTIC_IMPLEMENTATION_PLAN.md](./AI_AGENTIC_IMPLEMENTATION_PLAN.md) | 詳細実装計画 |

---

## 1. Executive Summary

### 1.1 Phase 6の目標

```
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 6: SERVICE RELEASE PREPARATION (AI AGENTIC)                  │
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
│  【AI Agentic開発手法】                                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ • Multi-Agent Team: UI/API/Test/i18n/A11y/Review             │  │
│  │ • MCP Server連携: Figma, Playwright, Postgres, Git           │  │
│  │ • Self-Healing Tests: Playwright Healer Agent                │  │
│  │ • Visual Regression: Chromatic + AI差分検出                  │  │
│  │ • Progressive Autonomy: 段階的自律性                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  【成果物】                                                          │
│  • Sepolia Testnet上で完全動作するDApp（8システム / 98画面）        │
│  • 日英対応の完全なUI                                               │
│  • 法務ドキュメント一式                                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Phase 4モック資産（ベースライン）

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

---

## 2. Multi-Agent Team Architecture

### 2.1 Agent構成

```
┌─────────────────────────────────────────────────────────────────────┐
│                      TEAM LEAD AGENT                                │
│  Model: Claude Opus 4.5                                             │
│  Role: タスク分配、進捗管理、品質ゲート判定                          │
└─────────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│   UI AGENT    │       │  API AGENT    │       │  TEST AGENT   │
│ 30_ui_impl.md │       │ 34_api_impl.md│       │ 37_e2e_test.md│
├───────────────┤       ├───────────────┤       ├───────────────┤
│ HTML→React    │       │ API実装       │       │ E2E生成       │
│ Storybook     │       │ DB連携        │       │ Visual Test   │
│ Tailwind      │       │ L1/L3統合     │       │ 自己修復      │
└───────────────┘       └───────────────┘       └───────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│  i18n AGENT   │       │  A11y AGENT   │       │ REVIEW AGENT  │
│ 32_i18n_audit │       │ 33_a11y_check │       │ 31_design_pir │
├───────────────┤       ├───────────────┤       ├───────────────┤
│ 翻訳キー      │       │ WCAG検証      │       │ Design PIR    │
│ 日英同期      │       │ aria-*        │       │ ペルソナ      │
│ フォーマット  │       │ キーボード    │       │ 品質判定      │
└───────────────┘       └───────────────┘       └───────────────┘
```

### 2.2 MCP Server構成

```json
{
  "servers": {
    "figma": "デザイントークン取得",
    "playwright": "ブラウザテスト操作",
    "postgres": "DB操作（モック禁止）",
    "filesystem": "ファイル読み書き",
    "git": "バージョン管理"
  }
}
```

**設定ファイル**: `apps/web/mcp-config.json`

---

## 3. 実装フェーズ

### 3.1 Week 1: Foundation（基盤構築）✅ 完了

| タスク | ステータス | 成果物 |
|--------|:----------:|--------|
| MCP Server環境構築 | ✅ | `apps/web/mcp-config.json` |
| Storybook + Chromatic設定 | ✅ | `.storybook/`, `chromatic.config.json` |
| Playwright AI Agents有効化 | ✅ | `playwright.config.ts` |
| Design System共通コンポーネント | ✅ | `src/components/ui/` |
| Tailwind Premium Japan設定 | ✅ | `tailwind.config.ts`, `globals.css` |

### 3.2 Week 2-3: P1 Systems（並列開発）

3つのAgent Teamが並列実行：

```
┌─────────────────────────────────────────────────────────────────────┐
│  PARALLEL EXECUTION - P1 SYSTEMS                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TEAM A: Consumer App (19画面)                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ UI Agent → API Agent → Test Agent → i18n → A11y → Review     │  │
│  │ 対象: Landing, Dashboard, Lock, Unlock, History, Settings等  │  │
│  │ ペルソナ: 田中さん（End User）                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  TEAM B: Prover Portal (11画面)                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ UI Agent → API Agent → Test Agent → i18n → A11y → Review     │  │
│  │ 対象: Landing, Application, Dashboard, Queue, Metrics等      │  │
│  │ ペルソナ: 山田さん（Prover）                                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  TEAM C: Enterprise Admin (25画面)                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ UI Agent → API Agent → Test Agent → i18n → A11y → Review     │  │
│  │ 対象: Dashboard, Transactions, Users, API Keys, Reports等    │  │
│  │ ペルソナ: 佐藤さん（Service Provider）                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Week 4-5: P2 Systems

| Team | System | 画面数 | 主要ペルソナ |
|:----:|--------|:------:|-------------|
| D | Token Hub | 10 | 鈴木さん（Token Holder） |
| E | Governance | 6 | 渡辺さん（Delegate） |
| F | QS Admin | 12 | QS運営チーム |

### 3.4 Week 6: P3 Systems + Cross-cutting

| Team | System | 画面数 | 追加タスク |
|:----:|--------|:------:|-----------|
| G | Observer + Explorer | 15 | 全システムi18n監査、A11y監査 |

### 3.5 Week 7-8: QA & Release

- Visual Regression全システム実行
- Claude Computer Use探索テスト
- Cross-system E2Eテスト
- Design PIRペルソナレビュー
- ドキュメント最終確認

---

## 4. システム詳細

### 4.1 System 01: Consumer App（19画面）

**対象ユーザー**: End User（田中さん）
**パス**: `docs_new/01_phase/04_phase4/01_design/system_01_consumer/wip/mocks/`

| # | 画面 | Agent処理 |
|---|------|----------|
| 1 | Landing | UI → API → Test → i18n → A11y |
| 2 | Onboarding | UI → API → Test → i18n → A11y |
| 3 | Dashboard | UI → API → Test → i18n → A11y |
| 4 | Unlock | UI → API → Test → i18n → A11y |
| 5 | History | UI → API → Test → i18n → A11y |
| ... | ... | ... |
| 19 | Privacy | UI → Test → i18n → A11y |

### 4.2 System 02-08（詳細は別紙参照）

各システムの詳細画面一覧は`AI_AGENTIC_IMPLEMENTATION_PLAN.md`を参照。

---

## 5. プロンプトシステム

### 5.1 Phase 6専用プロンプト

| # | ファイル | Agent | 用途 |
|---|----------|-------|------|
| 30 | `30_ui_impl.md` | UI Agent | HTML Mock → React変換 |
| 31 | `31_design_pir.md` | Review Agent | ペルソナレビュー |
| 32 | `32_i18n_audit.md` | i18n Agent | 国際化監査 |
| 33 | `33_a11y_check.md` | A11y Agent | アクセシビリティ検証 |
| 34 | `34_api_impl.md` | API Agent | API実装（モック禁止） |
| 35 | `35_db_design.md` | API Agent | DB設計 |
| 36 | `36_doc_write.md` | Doc Agent | ドキュメント作成 |
| 37 | `37_e2e_test.md` | Test Agent | E2Eテスト |

### 5.2 Critical Rules

```xml
<rule id="CR-1" level="ABSOLUTE">
  APIモックデータの返却は禁止。
  データベースがない場合は、まず報告してから対応方法を検討する。
</rule>

<rule id="CR-2" level="ABSOLUTE">
  日英切替漏れは禁止。
  全テキストは t('key') 経由でアクセスすること。
</rule>

<rule id="CR-3" level="MUST">
  WCAG 2.1 AA準拠。
  全インタラクティブ要素にキーボードアクセシビリティを確保。
</rule>
```

---

## 6. テスト戦略（AI-Powered）

### 6.1 Testing Pyramid

```
                    ┌───────────┐
                    │ Exploratory│  ← Claude Computer Use
                    └─────┬─────┘
                   ┌──────┴──────┐
                   │   Visual    │  ← Chromatic AI
                   └──────┬──────┘
              ┌───────────┴───────────┐
              │     E2E Tests         │  ← Playwright Healer
              └───────────┬───────────┘
         ┌────────────────┴────────────────┐
         │      Integration Tests          │
         └────────────────┬────────────────┘
    ┌─────────────────────┴─────────────────────┐
    │            Component Tests                 │  ← Storybook
    └───────────────────────────────────────────┘
```

### 6.2 Playwright Healer Agent

テスト失敗時の自己修復フロー：

1. 失敗検出
2. Healer Agentが現在UIを検査
3. 同等要素を特定
4. ロケーター更新パッチを提案
5. テスト再実行

**設定**: `apps/web/playwright.config.ts`

### 6.3 Visual Regression

- **ツール**: Chromatic
- **対象**: 全98画面
- **モード**: Dark/Light、日本語/英語、Mobile/Desktop
- **設定**: `apps/web/chromatic.config.json`

---

## 7. Progressive Autonomy

### 7.1 自律性レベル

| Level | 期間 | 内容 |
|:-----:|------|------|
| 1 | Week 1-2 | 完全監視（全生成物を人間レビュー） |
| 2 | Week 3-4 | 部分自律（パターン化は自動、新規のみレビュー） |
| 3 | Week 5-8 | 高度自律（品質ゲート通過で自動マージ） |

### 7.2 Human-in-the-Loop ポイント

| ステージ | 自動処理 | 人間レビュー必須 |
|---------|:--------:|:----------------:|
| Design Token抽出 | ✅ | |
| HTML→React変換 | ✅ | 新規パターン時 |
| i18n配置 | ✅ | |
| 翻訳テキスト作成 | | ✅ |
| API実装 | ✅ | セキュリティ関連 |
| E2Eテスト生成 | ✅ | |
| Visual Regression | ✅ | 意図的変更確認 |
| Design PIR | | ✅ |
| 最終リリース判定 | | ✅ |

---

## 8. 品質ゲート

### 8.1 システム別完了条件

| システム | 完了条件 |
|---------|---------|
| 全システム共通 | UI実装 + API統合 + i18n完了 + A11y Pass + Design PIR Pass + E2E Pass |

### 8.2 品質基準

| カテゴリ | 基準 |
|---------|------|
| テストカバレッジ | ≥ 80% |
| E2E Pass率 | 100% |
| Lighthouse Score | ≥ 90 |
| WCAG準拠 | AA Level |
| i18n カバレッジ | 100% |
| Visual Regression | All Approved |

---

## 9. 成果物一覧

### 9.1 Week 1完了分

```
apps/web/
├── package.json                 # 依存関係定義
├── next.config.ts               # Next.js設定
├── tsconfig.json                # TypeScript設定
├── tailwind.config.ts           # Premium Japan Design System
├── playwright.config.ts         # AI Agent付きPlaywright
├── mcp-config.json              # MCP Server設定
├── chromatic.config.json        # Visual Regression設定
├── .storybook/
│   ├── main.ts                  # Storybook設定
│   └── preview.ts               # テーマ・Viewport設定
└── src/
    ├── styles/
    │   └── globals.css          # グローバルCSS
    ├── lib/
    │   └── utils.ts             # ユーティリティ関数
    └── components/ui/
        ├── index.ts             # エクスポート
        ├── button.tsx           # Buttonコンポーネント
        ├── button.stories.tsx   # Storybook Story
        ├── card.tsx             # Cardコンポーネント
        ├── input.tsx            # Inputコンポーネント
        └── badge.tsx            # Badgeコンポーネント
```

### 9.2 Week 2以降予定

- 8システム98画面のReactコンポーネント
- API実装（Prisma + PostgreSQL）
- E2Eテストスイート
- 翻訳ファイル（日英）
- ドキュメント一式

---

## 10. 参照仕様書（厳守）

| ドキュメント | パス | 用途 |
|-------------|------|------|
| Core Principles | `docs_new/00_core/CORE_PRINCIPLES.md` | 不変原則 |
| Unified Spec | `docs_new/00_core/specs/UNIFIED_SPEC.md` | 統合仕様 |
| Sequences | `docs_new/00_core/specs/SEQUENCES.md` | フロー定義 |
| Design Guidelines | `docs_new/01_phase/04_phase4/01_design/UI_DESIGN_GUIDELINES.md` | デザインシステム |
| Design Review Agents | `docs_new/01_phase/04_phase4/01_design/DESIGN_REVIEW_AGENTS.md` | ペルソナ定義 |

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-13 | 初版作成 |
| 2.0 | 2026-01-13 | 8システム98画面の詳細追加 |
| 3.0 | 2026-01-14 | AI Agentic開発手法の適用計画追加 |
| 4.0 | 2026-01-14 | AI Agentic手法を正とし構造を統一、Week 1実装完了 |

---

**END OF DOCUMENT**
