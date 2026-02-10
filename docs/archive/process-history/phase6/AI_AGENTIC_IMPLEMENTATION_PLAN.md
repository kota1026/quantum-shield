# Phase 6: AI Agentic UI/UX 開発・テスト実装計画

> **Version**: 1.0
> **Date**: 2026-01-14
> **Status**: Implementation Plan
> **Base**: AI_AGENTIC_UIUX_RESEARCH.md

---

## 1. Executive Summary

Phase 6にAI Agentic手法を適用し、98画面のUI/UX開発・テストを効率化する。

### 1.1 導入するAI Agentic手法

```
┌─────────────────────────────────────────────────────────────────────┐
│  AI AGENTIC APPROACH FOR PHASE 6                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  【Design → Code】                                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Figma MCP Server → Design Token自動抽出                       │  │
│  │ Phase 4 HTML Mock → AI Agent → React Component               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  【Multi-Agent Team】                                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Team Lead Agent                                               │  │
│  │   ├── UI Agent (React実装)                                    │  │
│  │   ├── API Agent (Backend実装)                                 │  │
│  │   ├── i18n Agent (国際化)                                     │  │
│  │   ├── A11y Agent (アクセシビリティ)                           │  │
│  │   └── Test Agent (E2E/Visual)                                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  【AI-Powered Testing】                                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Storybook + Chromatic (Visual Regression)                     │  │
│  │ Playwright Healer Agent (自己修復E2E)                         │  │
│  │ Claude Computer Use (探索的テスト)                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 期待効果

| 指標 | 従来手法 | AI Agentic適用後 | 削減率 |
|------|:--------:|:----------------:|:------:|
| UI実装時間 | 100% | 40-60% | **40-60%** |
| テスト作成時間 | 100% | 30% | **70%** |
| テスト保守コスト | 100% | 30% | **70%** |
| Visual Bug検出 | 手動 | 自動100% | **∞** |
| i18n漏れ | 発見遅延 | 即時検出 | **100%** |

---

## 2. Multi-Agent Team Architecture

### 2.1 Agent構成

```
┌─────────────────────────────────────────────────────────────────────┐
│                      TEAM LEAD AGENT                                │
│  Role: タスク分配、進捗管理、品質ゲート判定                          │
│  Model: Claude Opus 4.5                                             │
│  Context: Phase 6計画、仕様書、デザインシステム                       │
└─────────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│   UI AGENT    │       │  API AGENT    │       │  TEST AGENT   │
├───────────────┤       ├───────────────┤       ├───────────────┤
│ 担当:         │       │ 担当:         │       │ 担当:         │
│ • HTML→React  │       │ • API実装     │       │ • E2E作成     │
│ • Storybook   │       │ • DB連携      │       │ • Visual Test │
│ • Tailwind    │       │ • L1/L3統合   │       │ • 自己修復    │
├───────────────┤       ├───────────────┤       ├───────────────┤
│ Prompt:       │       │ Prompt:       │       │ Prompt:       │
│ 30_ui_impl.md │       │ 34_api_impl.md│       │ 37_e2e_test.md│
├───────────────┤       ├───────────────┤       ├───────────────┤
│ Model:        │       │ Model:        │       │ Model:        │
│ Claude Sonnet │       │ Claude Sonnet │       │ Claude Sonnet │
└───────────────┘       └───────────────┘       └───────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│  i18n AGENT   │       │  A11y AGENT   │       │ REVIEW AGENT  │
├───────────────┤       ├───────────────┤       ├───────────────┤
│ 担当:         │       │ 担当:         │       │ 担当:         │
│ • 翻訳キー    │       │ • WCAG検証    │       │ • Design PIR  │
│ • 日英同期    │       │ • aria-*      │       │ • ペルソナ    │
│ • フォーマット│       │ • キーボード  │       │ • 品質判定    │
├───────────────┤       ├───────────────┤       ├───────────────┤
│ Prompt:       │       │ Prompt:       │       │ Prompt:       │
│ 32_i18n_audit │       │ 33_a11y_check │       │ 31_design_pir │
└───────────────┘       └───────────────┘       └───────────────┘
```

### 2.2 Agent間連携プロトコル

```yaml
# Agent Communication Protocol
protocol:
  name: "Phase6-Agent-Protocol"
  version: "1.0"

  message_types:
    - TASK_ASSIGN     # Team Lead → Sub Agent
    - TASK_COMPLETE   # Sub Agent → Team Lead
    - TASK_BLOCKED    # Sub Agent → Team Lead
    - REVIEW_REQUEST  # Sub Agent → Review Agent
    - REVIEW_RESULT   # Review Agent → Sub Agent
    - QUALITY_GATE    # Review Agent → Team Lead

  handoff_rules:
    ui_to_test:
      trigger: "UI Component Complete"
      data: ["component_path", "storybook_url"]

    api_to_test:
      trigger: "API Endpoint Complete"
      data: ["endpoint_spec", "db_schema"]

    test_to_review:
      trigger: "All Tests Pass"
      data: ["coverage_report", "visual_snapshots"]
```

### 2.3 MCP Server構成

```typescript
// mcp-config.ts - Phase 6 MCP Server Configuration

export const mcpServers = {
  // Design参照用
  figma: {
    name: 'figma-mcp',
    command: 'npx',
    args: ['@anthropic/mcp-server-figma'],
    env: {
      FIGMA_ACCESS_TOKEN: process.env.FIGMA_ACCESS_TOKEN,
    },
    capabilities: ['get_file', 'get_styles', 'get_components'],
  },

  // ファイル操作用
  filesystem: {
    name: 'filesystem-mcp',
    command: 'npx',
    args: ['@anthropic/mcp-server-filesystem'],
    env: {
      ALLOWED_PATHS: '/home/user/quantum-shield',
    },
    capabilities: ['read', 'write', 'list'],
  },

  // ブラウザテスト用
  playwright: {
    name: 'playwright-mcp',
    command: 'npx',
    args: ['@anthropic/mcp-server-playwright'],
    capabilities: ['navigate', 'screenshot', 'click', 'type'],
  },

  // データベース用
  postgres: {
    name: 'postgres-mcp',
    command: 'npx',
    args: ['@anthropic/mcp-server-postgres'],
    env: {
      DATABASE_URL: process.env.DATABASE_URL,
    },
    capabilities: ['query', 'schema'],
  },

  // Git操作用
  git: {
    name: 'git-mcp',
    command: 'npx',
    args: ['@anthropic/mcp-server-git'],
    capabilities: ['status', 'commit', 'push', 'branch'],
  },
};
```

---

## 3. Design → Code Automation

### 3.1 Phase 4 Mock → React変換フロー

```
┌─────────────────────────────────────────────────────────────────────┐
│  MOCK TO REACT CONVERSION FLOW                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  STEP 1: HTML Mock読み込み                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Input: system_01_consumer/wip/mocks/03_dashboard.html        │  │
│  │ Parse: HTML構造 + CSS Variables + レイアウト                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                          │                                         │
│                          ▼                                         │
│  STEP 2: デザイントークン参照                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Reference: UI_DESIGN_GUIDELINES.md                            │  │
│  │ Extract: --qs-primary, --qs-gold, --qs-font-jp               │  │
│  │ Map: Tailwind config / shadcn themes                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                          │                                         │
│                          ▼                                         │
│  STEP 3: コンポーネント分解                                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ AI Agent分析:                                                 │  │
│  │ • Header → <DashboardHeader />                               │  │
│  │ • Stats Cards → <StatsCard /> x 4                            │  │
│  │ • Lock Table → <LockTable />                                 │  │
│  │ • Charts → <TVLChart />, <ActivityChart />                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                          │                                         │
│                          ▼                                         │
│  STEP 4: React/Next.js生成                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Output:                                                       │  │
│  │ • apps/web/src/app/[locale]/consumer/dashboard/page.tsx      │  │
│  │ • apps/web/src/components/consumer/DashboardHeader.tsx       │  │
│  │ • apps/web/src/components/consumer/StatsCard.tsx             │  │
│  │ • apps/web/locales/ja/consumer.json (翻訳キー)               │  │
│  │ • apps/web/locales/en/consumer.json (翻訳キー)               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                          │                                         │
│                          ▼                                         │
│  STEP 5: Storybook Story生成                                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ • DashboardHeader.stories.tsx                                 │  │
│  │ • StatsCard.stories.tsx                                       │  │
│  │ • LockTable.stories.tsx                                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 UI Agent実行サイクル

```typescript
// ui-agent-cycle.ts

interface UIAgentCycle {
  // Phase 1: 分析
  analyze: {
    input: 'HTML Mock file path';
    actions: [
      'Parse HTML structure',
      'Extract CSS variables',
      'Identify components',
      'Read design guidelines',
    ];
    output: 'Component decomposition plan';
  };

  // Phase 2: 生成
  generate: {
    input: 'Component plan';
    actions: [
      'Generate React components',
      'Apply Tailwind classes',
      'Add i18n keys (t() calls)',
      'Include aria-* attributes',
    ];
    output: 'React component files';
  };

  // Phase 3: Story作成
  storybook: {
    input: 'React components';
    actions: [
      'Generate Storybook stories',
      'Define variants (default, hover, disabled)',
      'Add viewport tests (mobile, desktop)',
      'Include dark/light mode',
    ];
    output: 'Storybook story files';
  };

  // Phase 4: 検証
  verify: {
    input: 'Generated files';
    actions: [
      'TypeScript compilation check',
      'ESLint validation',
      'Storybook build test',
      'i18n key completeness',
    ];
    output: 'Verification report';
  };
}
```

---

## 4. AI-Powered Testing Strategy

### 4.1 Testing Pyramid（AI強化版）

```
                    ┌───────────┐
                    │ Exploratory│  ← Claude Computer Use
                    │  Testing   │     自然言語テストケース
                    └─────┬─────┘
                          │
                   ┌──────┴──────┐
                   │   Visual    │  ← Chromatic / Applitools
                   │  Regression │     AI差分検出
                   └──────┬──────┘
                          │
              ┌───────────┴───────────┐
              │     E2E Tests         │  ← Playwright + Healer Agent
              │  (Self-Healing)       │     自己修復テスト
              └───────────┬───────────┘
                          │
         ┌────────────────┴────────────────┐
         │      Integration Tests          │  ← API + DB統合テスト
         │                                 │
         └────────────────┬────────────────┘
                          │
    ┌─────────────────────┴─────────────────────┐
    │            Component Tests                 │  ← Storybook + Testing Library
    │    (Storybook + Visual Snapshots)         │
    └───────────────────────────────────────────┘
```

### 4.2 Playwright Test Agents設定

```typescript
// playwright.config.ts with AI Agents

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,

  // AI Agent設定
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Playwright AI Agents
    aiAgents: {
      // Generator Agent: テスト自動生成
      generator: {
        enabled: true,
        model: 'claude-sonnet-4-20250514',
        promptTemplate: './prompts/test-generator.md',
      },

      // Healer Agent: 自己修復
      healer: {
        enabled: true,
        model: 'claude-sonnet-4-20250514',
        maxRetries: 3,
        strategies: [
          'update-locator',      // ロケーター更新
          'adjust-wait',         // 待機時間調整
          'alternative-path',    // 代替パス探索
        ],
      },

      // Planner Agent: テスト戦略
      planner: {
        enabled: true,
        model: 'claude-sonnet-4-20250514',
        coverageTarget: 0.9,
      },
    },
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 13'] } },
  ],
});
```

### 4.3 Visual Regression設定

```typescript
// chromatic.config.ts

export default {
  projectToken: process.env.CHROMATIC_PROJECT_TOKEN,

  // ビルド設定
  buildScriptName: 'build-storybook',

  // スナップショット設定
  viewportCount: 3,  // Mobile, Tablet, Desktop

  // AI差分検出
  diffThreshold: 0.1,  // 0.1%以上の差分を検出

  // 自動承認
  autoAcceptChanges: 'main',  // mainブランチは自動承認

  // UIテストモード
  modes: {
    light: { theme: 'light' },
    dark: { theme: 'dark' },
    japanese: { locale: 'ja' },
    english: { locale: 'en' },
  },

  // アクセシビリティテスト
  a11y: {
    enabled: true,
    rules: ['wcag2aa'],
  },
};
```

### 4.4 Claude Computer Use統合

```typescript
// exploratory-test.ts

import Anthropic from '@anthropic-ai/sdk';

interface ExploratoryTestConfig {
  baseUrl: string;
  scenarios: ExploratoryScenario[];
}

interface ExploratoryScenario {
  name: string;
  persona: string;  // 田中, 山田, 佐藤, etc.
  goal: string;
  system: string;   // consumer, prover, enterprise, etc.
}

const scenarios: ExploratoryScenario[] = [
  {
    name: '初回ユーザーのロック体験',
    persona: '田中さん（End User）',
    goal: '初めてQuantum Shieldを使用し、1 ETHをロックする',
    system: 'consumer',
  },
  {
    name: 'Prover申請フロー',
    persona: '山田さん（Prover）',
    goal: 'Proverとして申請し、承認を待つ',
    system: 'prover',
  },
  {
    name: 'Enterprise設定変更',
    persona: '佐藤さん（Service Provider）',
    goal: '組織のセキュリティ設定を更新する',
    system: 'enterprise',
  },
];

async function runExploratoryTest(scenario: ExploratoryScenario) {
  const client = new Anthropic();

  const systemPrompt = `
あなたは${scenario.persona}として、Quantum Shieldの${scenario.system}システムを探索的にテストします。

目標: ${scenario.goal}

テスト観点:
1. ユーザビリティ: 操作は直感的か？
2. エラーハンドリング: 不正入力時の挙動は？
3. 多言語: 日英切替は正しく動作するか？
4. アクセシビリティ: キーボード操作は可能か？

発見した問題は詳細に報告してください。
`;

  const response = await client.beta.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    betas: ['computer-use-2025-01-24'],
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: `${scenario.system}システムで「${scenario.goal}」を達成してください。`,
    }],
    tools: [
      {
        type: 'computer_20250124',
        name: 'computer',
        display_width_px: 1920,
        display_height_px: 1080,
      },
    ],
  });

  return response;
}
```

---

## 5. System別実装計画

### 5.1 実装順序（AI Agentic最適化）

```
┌─────────────────────────────────────────────────────────────────────┐
│  IMPLEMENTATION ORDER (AI OPTIMIZED)                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PHASE A: Foundation (Week 1)                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ • MCP Server設定 (Figma, Playwright, Postgres, Git)          │  │
│  │ • Storybook + Chromatic設定                                   │  │
│  │ • Multi-Agent基盤構築                                         │  │
│  │ • Design System共通コンポーネント                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                          │                                         │
│                          ▼                                         │
│  PHASE B: P1 Systems Parallel (Week 2-3)                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 3つのAgentチームが並列実行:                                   │  │
│  │                                                               │  │
│  │ Team A: Consumer App (19画面)                                 │  │
│  │   UI Agent → API Agent → Test Agent → Review                 │  │
│  │                                                               │  │
│  │ Team B: Prover Portal (11画面)                                │  │
│  │   UI Agent → API Agent → Test Agent → Review                 │  │
│  │                                                               │  │
│  │ Team C: Enterprise Admin (25画面)                             │  │
│  │   UI Agent → API Agent → Test Agent → Review                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                          │                                         │
│                          ▼                                         │
│  PHASE C: P2 Systems Parallel (Week 4-5)                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Team D: Token Hub (10画面)                                    │  │
│  │ Team E: Governance (6画面)                                    │  │
│  │ Team F: QS Admin (12画面)                                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                          │                                         │
│                          ▼                                         │
│  PHASE D: P3 Systems + Cross-cutting (Week 6)                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Team G: Observer (7画面) + Explorer (8画面)                   │  │
│  │ + 全システムi18n監査                                          │  │
│  │ + 全システムa11y監査                                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                          │                                         │
│                          ▼                                         │
│  PHASE E: QA & Release (Week 7-8)                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ • Visual Regression全システム                                  │  │
│  │ • Claude Computer Use探索テスト                               │  │
│  │ • Cross-system E2Eテスト                                      │  │
│  │ • Design PIRペルソナレビュー                                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 システム別Agent割り当て

| Phase | System | 画面数 | UI Agent | API Agent | Test Agent | 並列度 |
|:-----:|--------|:------:|:--------:|:---------:|:----------:|:------:|
| B | Consumer | 19 | ●●● | ●● | ●● | Team A |
| B | Prover | 11 | ●● | ●● | ●● | Team B |
| B | Enterprise | 25 | ●●●● | ●●● | ●●● | Team C |
| C | Token Hub | 10 | ●● | ●● | ●● | Team D |
| C | Governance | 6 | ● | ● | ● | Team E |
| C | QS Admin | 12 | ●● | ●● | ●● | Team F |
| D | Observer | 7 | ● | ● | ● | Team G |
| D | Explorer | 8 | ●● | ● | ● | Team G |

---

## 6. 品質ゲートとヒューマンレビュー

### 6.1 Progressive Autonomy適用

```
┌─────────────────────────────────────────────────────────────────────┐
│  PROGRESSIVE AUTONOMY LEVELS                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Level 1: 完全監視 (Week 1-2)                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ • 全コンポーネント生成後に人間レビュー                        │  │
│  │ • テスト結果を人間が確認                                      │  │
│  │ • マージ前に承認必須                                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                          │                                         │
│                          ▼                                         │
│  Level 2: 部分自律 (Week 3-4)                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ • パターン化された変換は自動マージ                            │  │
│  │ • 新規パターンのみ人間レビュー                                │  │
│  │ • テスト失敗時のみ介入                                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                          │                                         │
│                          ▼                                         │
│  Level 3: 高度自律 (Week 5-8)                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ • 品質ゲート通過で自動マージ                                  │  │
│  │ • 人間はDesign PIRと最終確認のみ                              │  │
│  │ • 例外・エラー時のみエスカレーション                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 品質ゲート定義

```yaml
# quality-gates.yaml

gates:
  component_complete:
    name: "Component Completion Gate"
    checks:
      - type: "typescript"
        rule: "no_errors"
      - type: "eslint"
        rule: "no_errors"
      - type: "i18n"
        rule: "all_keys_present"
        languages: ["ja", "en"]
      - type: "a11y"
        rule: "wcag_aa_compliant"
      - type: "storybook"
        rule: "all_stories_render"

  visual_regression:
    name: "Visual Regression Gate"
    checks:
      - type: "chromatic"
        rule: "no_unreviewed_changes"
      - type: "viewport"
        rule: "all_viewports_pass"
        viewports: ["mobile", "tablet", "desktop"]
      - type: "theme"
        rule: "both_themes_pass"
        themes: ["light", "dark"]

  e2e_complete:
    name: "E2E Completion Gate"
    checks:
      - type: "playwright"
        rule: "all_tests_pass"
      - type: "coverage"
        rule: "minimum_80_percent"
      - type: "healer"
        rule: "no_unresolved_failures"

  release_ready:
    name: "Release Ready Gate"
    checks:
      - type: "all_systems"
        rule: "all_gates_pass"
      - type: "design_pir"
        rule: "all_personas_approved"
      - type: "security"
        rule: "no_high_critical"
      - type: "performance"
        rule: "lighthouse_90_plus"
```

### 6.3 Human-in-the-Loop ポイント

| ステージ | 自動処理 | 人間レビュー必須 |
|---------|---------|----------------|
| Design Token抽出 | ✅ | |
| HTML→React変換 | ✅ | 新規パターン時 |
| Storybook Story生成 | ✅ | |
| i18n翻訳キー配置 | ✅ | |
| 翻訳テキスト作成 | | ✅ |
| API実装 | ✅ | セキュリティ関連 |
| E2Eテスト生成 | ✅ | |
| Visual Regression | ✅ | 意図的変更確認 |
| Design PIR | | ✅ |
| 最終リリース判定 | | ✅ |

---

## 7. ツールスタック詳細

### 7.1 開発環境

```json
{
  "development": {
    "framework": "Next.js 15",
    "language": "TypeScript 5.x",
    "styling": "Tailwind CSS 4.x",
    "components": "shadcn/ui",
    "icons": "Lucide Icons",
    "i18n": "next-intl",
    "state": "Zustand / TanStack Query",
    "forms": "React Hook Form + Zod"
  },
  "testing": {
    "unit": "Vitest + Testing Library",
    "e2e": "Playwright + AI Agents",
    "visual": "Chromatic",
    "a11y": "axe-core + Lighthouse",
    "exploratory": "Claude Computer Use"
  },
  "ai_agents": {
    "model": "Claude Opus 4.5 / Sonnet",
    "mcp_servers": [
      "figma-mcp",
      "playwright-mcp",
      "postgres-mcp",
      "filesystem-mcp",
      "git-mcp"
    ],
    "frameworks": [
      "Claude Agent SDK",
      "LangGraph (optional)"
    ]
  },
  "ci_cd": {
    "platform": "GitHub Actions",
    "visual_ci": "Chromatic",
    "deployment": "Vercel"
  }
}
```

### 7.2 セットアップ手順

```bash
# 1. MCP Server設定
npm install -g @anthropic/mcp-server-figma
npm install -g @anthropic/mcp-server-playwright
npm install -g @anthropic/mcp-server-postgres
npm install -g @anthropic/mcp-server-filesystem

# 2. Playwright AI Agents
npm install @playwright/test@latest
npx playwright install --with-deps

# 3. Chromatic
npm install --save-dev chromatic
npx chromatic --project-token=<TOKEN>

# 4. Storybook
npx storybook@latest init
npm install @storybook/addon-a11y

# 5. Claude Agent SDK
npm install @anthropic-ai/sdk
```

---

## 8. 既存プロンプトとの統合

### 8.1 プロンプトマッピング

| Agent | Primary Prompt | Support Prompts |
|-------|---------------|-----------------|
| **UI Agent** | 30_ui_impl.md | UI_DESIGN_GUIDELINES.md |
| **API Agent** | 34_api_impl.md | 35_db_design.md |
| **Test Agent** | 37_e2e_test.md | - |
| **i18n Agent** | 32_i18n_audit.md | - |
| **A11y Agent** | 33_a11y_check.md | - |
| **Review Agent** | 31_design_pir.md | DESIGN_REVIEW_AGENTS.md |
| **Doc Agent** | 36_doc_write.md | - |

### 8.2 Agent呼び出し例

```typescript
// agent-orchestrator.ts

import { ClaudeAgentSDK } from '@anthropic-ai/sdk';

class Phase6Orchestrator {
  private agents: Map<string, Agent>;

  constructor() {
    this.agents = new Map([
      ['ui', this.createAgent('30_ui_impl.md')],
      ['api', this.createAgent('34_api_impl.md')],
      ['test', this.createAgent('37_e2e_test.md')],
      ['i18n', this.createAgent('32_i18n_audit.md')],
      ['a11y', this.createAgent('33_a11y_check.md')],
      ['review', this.createAgent('31_design_pir.md')],
    ]);
  }

  async implementScreen(screen: ScreenSpec) {
    // 1. UI Agent: HTML → React
    const uiResult = await this.agents.get('ui')!.run({
      task: 'convert_html_to_react',
      input: screen.mockPath,
    });

    // 2. API Agent: エンドポイント実装
    const apiResult = await this.agents.get('api')!.run({
      task: 'implement_api',
      input: screen.apiSpec,
    });

    // 3. Test Agent: E2E生成
    const testResult = await this.agents.get('test')!.run({
      task: 'generate_e2e',
      input: {
        component: uiResult.componentPath,
        api: apiResult.endpointPath,
      },
    });

    // 4. i18n Agent: 監査
    const i18nResult = await this.agents.get('i18n')!.run({
      task: 'audit_i18n',
      input: uiResult.componentPath,
    });

    // 5. A11y Agent: 検証
    const a11yResult = await this.agents.get('a11y')!.run({
      task: 'check_accessibility',
      input: uiResult.componentPath,
    });

    // 6. Review Agent: Design PIR
    if (this.shouldReview(screen)) {
      await this.agents.get('review')!.run({
        task: 'design_pir',
        input: {
          component: uiResult.componentPath,
          screenshots: testResult.screenshots,
        },
      });
    }

    return { ui: uiResult, api: apiResult, test: testResult };
  }
}
```

---

## 9. 成功指標

### 9.1 定量指標

| 指標 | 目標値 | 測定方法 |
|------|:------:|---------|
| UI実装速度 | ≤60% of baseline | 画面あたり実装時間 |
| テストカバレッジ | ≥80% | Playwright coverage |
| Visual Regression Pass率 | 100% | Chromatic |
| i18n完全性 | 100% | 32_i18n_audit結果 |
| A11y準拠 | WCAG AA 100% | axe-core |
| E2E Pass率 | 100% | Playwright |
| Lighthouse Score | ≥90 | 全カテゴリ |

### 9.2 定性指標

| 指標 | 目標 | 評価方法 |
|------|------|---------|
| ペルソナ満足度 | 全ペルソナApprove | Design PIR結果 |
| コード品質 | 一貫したパターン | コードレビュー |
| Agent信頼性 | 介入率≤20% | 人間介入ログ |

---

## 10. 次のアクション

### 10.1 即時実行（Week 1）

1. [ ] MCP Server環境構築
2. [ ] Storybook + Chromatic設定
3. [ ] Playwright AI Agents有効化
4. [ ] Multi-Agent Orchestrator実装
5. [ ] Design System共通コンポーネント（shadcn/ui）

### 10.2 P1システム開始（Week 2）

1. [ ] Consumer App Agent Team起動
2. [ ] Prover Portal Agent Team起動
3. [ ] Enterprise Admin Agent Team起動

### 10.3 品質モニタリング

1. [ ] Chromatic Visual Regression CI設定
2. [ ] Progressive Autonomy Level 1適用
3. [ ] 人間レビューフローの確立

---

**END OF DOCUMENT**
