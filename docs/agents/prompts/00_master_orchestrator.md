# 00_master_orchestrator.md - Quantum Shield Master Orchestrator

> **Version**: 1.0
> **Updated**: 2026-01-31
> **Purpose**: プロジェクト全体の進行を統括するマスタープロンプト

---

## Overview

Quantum Shieldプロジェクトの全体進捗を管理し、次のアクションを自動で特定・実行する。

---

## Trigger Commands

```bash
# ===== 進捗確認系 =====
ローンチ進捗確認              # 全体の進捗サマリーを表示
実装確認                      # 実際のコード状況を確認
ドキュメント整合性確認        # ドキュメント間の整合性チェック

# ===== 作業実行系 =====
次のタスク                    # 優先度順で次のタスクを自動選択・実行
統合開始                      # フロントエンド統合を開始
統合開始 {app}               # 特定アプリの統合を開始

# ===== テスト系 =====
統合テスト {app}             # 特定アプリの統合テスト
統合テスト 全アプリ          # 全アプリの統合テスト

# ===== 更新系 =====
進捗更新                      # 進捗ドキュメントを実際の状態に更新
```

---

## Phase 0: 初期化（全コマンド共通）

### 0.1 必須ファイル読み込み

```
READ PARALLEL:
├── docs/LAUNCH_READINESS.md             ← 全体進捗
├── docs/integration/INTEGRATION_PROGRESS.md  ← 統合進捗
├── docs/specs/DATA_MODEL.md              ← データモデル
└── docs/specs/REQUIREMENTS.md            ← 要件定義
```

### 0.2 実装状況スキャン

```bash
# Hooks状況
ls apps/web/src/hooks/

# DEMO_* 使用状況
grep -r "DEMO_\|MOCK_" apps/web/src/components/ | wc -l

# useQuery 使用状況
grep -r "useQuery\|useMutation" apps/web/src/components/ | wc -l
```

### 0.3 初期化完了報告

```markdown
## 初期化完了

### 現在の状況
- 全体進捗: {X}%
- 最も遅れているレイヤー: Layer {N} ({description})
- 次に実行すべきタスク: {task}

### 優先度マトリクス
| App | Priority | Hooks | Connection | Blocking |
|-----|:--------:|:-----:|:----------:|:--------:|
| consumer | P0 | ✅ | ❌ | Yes |
| prover | P0 | ✅ | ❌ | Yes |
| observer | P0 | ✅ | ❌ | Yes |
| ... | ... | ... | ... | ... |
```

---

## Phase 1: 「ローンチ進捗確認」実行フロー

### 1.1 全レイヤースキャン

```bash
# Layer 1: Components
find apps/web/src/components -name "*.tsx" | wc -l

# Layer 2: Hooks
ls apps/web/src/hooks/

# Layer 3: Connection (useQuery in components)
grep -r "useQuery" apps/web/src/components/ | wc -l

# Layer 4: Backend
ls services/api/src/routes/

# Layer 5: DB
ls services/api/src/db/
```

### 1.2 進捗計算

```
Layer 1 Score = (component files exist) ? 100 : 0
Layer 2 Score = (apps with hooks / total apps) * 100
Layer 3 Score = (components using hooks / total components) * 100
Layer 4 Score = (implemented routes / spec routes) * 100
Layer 5 Score = (tables with data / total tables) * 100

Overall Score = weighted average
  - Layer 3 weight: 40% (critical blocker)
  - Layer 2 weight: 20%
  - Layer 4 weight: 20%
  - Layer 1 weight: 10%
  - Layer 5 weight: 10%
```

### 1.3 出力フォーマット

```markdown
## Quantum Shield Launch Readiness

### Overall Score: {X}%

┌─────────────────────────────────────────────────────────────────┐
│  UI Components      [████████████████████] 100%                │
│  React Hooks        [██████░░░░░░░░░░░░░░]  30%                │
│  Hook Connection    [░░░░░░░░░░░░░░░░░░░░]   0%  ← BLOCKER    │
│  Backend API        [████████████████░░░░]  80%                │
│  Database           [████████░░░░░░░░░░░░]  40%                │
└─────────────────────────────────────────────────────────────────┘

### Critical Blockers
1. {blocker_1}
2. {blocker_2}

### Next Actions
1. {action_1} (Priority: {priority})
2. {action_2} (Priority: {priority})
```

---

## Phase 2: 「次のタスク」実行フロー

### 2.1 タスク優先度決定ロジック

```
Priority 1: P0アプリのLayer 3 (Connection)
  - consumer, prover, observer が useQuery を使っていない
  → 「統合開始 consumer」を実行

Priority 2: P0アプリのLayer 2 (Hooks)
  - P0アプリでhooksがない
  → 「Hooks作成 {app}」を実行

Priority 3: P1アプリのLayer 3
Priority 4: P1アプリのLayer 2
Priority 5: 統合テスト
Priority 6: E2Eテスト
```

### 2.2 自動実行

優先度1のタスクを特定したら、該当するプロンプトを読み込んで実行：

- Layer 2 (Hooks作成) → `50_integration_check.md` Phase 2
- Layer 3 (Connection) → `50_integration_check.md` Phase 3
- 統合テスト → `50_integration_check.md` Phase 4

---

## Phase 3: 「統合開始 {app}」実行フロー

### 3.1 アプリ別実行計画

```yaml
consumer:
  hooks_file: hooks/consumer/useConsumer.ts
  components:
    - Dashboard/index.tsx
    - Lock/index.tsx
    - Unlock/index.tsx
    - History/index.tsx
    - ...
  api_endpoints:
    - /api/lock
    - /api/unlock
    - /api/user/locks

prover:
  hooks_file: hooks/prover/useProver.ts
  components:
    - ProverDashboard.tsx
    - ProverMetrics.tsx
    - ProverAlerts.tsx
    - ...
  api_endpoints:
    - /api/prover/me
    - /api/prover/requests
    - /api/prover/metrics
```

### 3.2 統合パイプライン

```
STEP 1: Hooks確認/作成
├── hooks/{app}/*.ts が存在するか確認
├── なければ作成 (50_integration_check.md Phase 2)
└── Gate: TypeScript compile OK

STEP 2: コンポーネント更新
├── 各コンポーネントでDEMO_*をuseXXX()に置換
├── Loading/Error state追加
└── Gate: DEMO_* count = 0

STEP 3: テスト作成
├── e2e/{app}/integration.spec.ts 作成
├── 4テスト最低（成功/ローディング/エラー/空）
└── Gate: テストファイル存在

STEP 4: テスト実行
├── npx playwright test e2e/{app}/
└── Gate: 全テストPASS

STEP 5: 進捗更新
├── INTEGRATION_PROGRESS.md 更新
├── LAUNCH_READINESS.md 更新
└── Gate: ファイル更新完了
```

---

## Phase 4: 進捗更新フロー

### 4.1 自動検出

```bash
# 実際の状態を検出
for app in consumer prover observer explorer governance token-hub qs-hub qs-admin enterprise; do
  hooks_count=$(ls apps/web/src/hooks/$app/*.ts 2>/dev/null | wc -l)
  demo_count=$(grep -r "DEMO_\|MOCK_" apps/web/src/components/$app/ 2>/dev/null | wc -l)
  usequery_count=$(grep -r "useQuery" apps/web/src/components/$app/ 2>/dev/null | wc -l)
  echo "$app: hooks=$hooks_count, demo=$demo_count, useQuery=$usequery_count"
done
```

### 4.2 ドキュメント更新

検出結果に基づいて以下を更新：

1. `docs/integration/INTEGRATION_PROGRESS.md`
2. `docs/LAUNCH_READINESS.md`

---

## Critical Rules

```xml
<rule id="MO-001" level="ABSOLUTE">
  作業開始前に必ず Phase 0 初期化を実行。
  現状把握なしに作業開始禁止。
</rule>

<rule id="MO-002" level="ABSOLUTE">
  P0アプリ (consumer, prover, observer) を最優先。
  P1アプリはP0完了後に着手。
</rule>

<rule id="MO-003" level="ABSOLUTE">
  Layer 3 (Connection) が最重要ボトルネック。
  Hooks作成より Connection 修正を優先。
</rule>

<rule id="MO-004" level="ABSOLUTE">
  作業完了後は必ず進捗ドキュメントを更新。
  更新なしで次のタスクに移行禁止。
</rule>

<rule id="MO-005" level="MUST">
  1セッションで1アプリの統合を完了させる。
  中途半端な状態で終了しない。
</rule>
```

---

## App Priority Matrix

| Priority | App | Reason | Status |
|:--------:|-----|--------|:------:|
| P0 | consumer | Core user flow | ❌ Layer 3 |
| P0 | prover | Required for signing | ❌ Layer 3 |
| P0 | observer | Required for challenges | ❌ Layer 3 |
| P1 | explorer | Public visibility | ❌ Layer 3 |
| P1 | governance | Token utility | ❌ Layer 2 |
| P1 | token-hub | veQS functionality | ❌ Layer 2 |
| P1 | qs-hub | veQS management | ❌ Layer 2 |
| P1 | qs-admin | Operations | ❌ Layer 3 |
| P2 | enterprise | B2B feature | ❌ Layer 2 |

---

## Related Documents

- [Launch Readiness](../LAUNCH_READINESS.md) - 全体進捗
- [Integration Progress](../integration/INTEGRATION_PROGRESS.md) - 統合進捗
- [Integration Check Prompt](./50_integration_check.md) - 統合実行プロンプト
- [Requirements](../specs/REQUIREMENTS.md) - 要件定義
- [Data Model](../specs/DATA_MODEL.md) - データモデル

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-31 | 1.0 | Initial creation based on implementation audit |
