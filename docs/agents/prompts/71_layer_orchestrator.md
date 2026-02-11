# 71_layer_orchestrator.md - Layer Integration Auto-Executor

> **Version**: 1.0
> **Created**: 2026-02-02
> **Purpose**: Step 1-5 を自動実行するオーケストレーター

---

## Overview

このプロンプトは `70_layer_integration.md` のStep 1-5を自動実行します。
1セッションで1アプリを完全に統合し、PRを作成するまでを自動化します。

---

## Trigger Commands

```
# 自動実行（推奨）
レイヤー統合 {app}              ← Step 1-5 を自動実行

# Phase別実行
レイヤー統合 Phase 0            ← Infrastructure setup
レイヤー統合 Phase 1            ← Prover/Observer
レイヤー統合 Phase 2            ← Lock/Unlock (Consumer)
レイヤー統合 Phase 3            ← Governance
レイヤー統合 Phase 4            ← Explorer/Token Hub/QS Hub
レイヤー統合 Phase 5            ← QS Admin
レイヤー統合 Phase 6            ← E2E Verification
```

---

## Phase 0: Initialization (Every Session)

**トリガー検出時に必ず実行**

### 0.1 必須ファイル読み込み

```
READ PARALLEL:
├── docs/agents/prompts/70_layer_integration.md   ← Framework
├── docs/integration/LAYER_INTEGRATION_PLAN.md    ← Master plan
├── docs/integration/FULLSTACK_PROGRESS.md        ← Current status
└── docs/specs/DATA_MODEL.md                      ← API types
```

### 0.2 現状確認

```bash
# 各アプリの統合状況を確認
for app in consumer prover observer explorer governance token-hub qs-hub qs-admin; do
  DEMO=$(grep -r "DEMO_" apps/web/src/components/$app --include="*.tsx" 2>/dev/null | wc -l)
  HOOKS=$(ls apps/web/src/hooks/$app/*.ts 2>/dev/null | wc -l)
  echo "$app: DEMO=$DEMO, Hooks=$HOOKS"
done
```

### 0.3 初期化完了報告

```markdown
## Layer Integration 初期化完了

### 読み込んだファイル
- [x] 70_layer_integration.md
- [x] LAYER_INTEGRATION_PLAN.md
- [x] FULLSTACK_PROGRESS.md
- [x] DATA_MODEL.md

### 現在のステータス
| App | DEMO_ | Hooks | Status |
|-----|:-----:|:-----:|:------:|
| consumer | {n} | {n} | ⬜/✅ |
| prover | {n} | {n} | ⬜/✅ |
| ...

### 次のアクション
→ {次に実行するPhase/App}
```

---

## Auto-Execution Flow

### 「レイヤー統合 {app}」を受けた場合

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AUTO-EXECUTION PIPELINE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 1: Planning ──────────────────────────────────────────────────────   │
│  │                                                                          │
│  │  1.1 現状分析                                                           │
│  │      grep -r "DEMO_" apps/web/src/components/{app}                      │
│  │      → 残っているDEMO_パターンをリストアップ                           │
│  │                                                                          │
│  │  1.2 CLAUDE.md 作成（存在しない場合）                                   │
│  │      apps/web/src/components/{app}/CLAUDE.md                            │
│  │                                                                          │
│  │  1.3 完了条件を明示                                                     │
│  │      - DEMO_ = 0                                                        │
│  │      - useQuery使用                                                     │
│  │      - Loading/Error/Empty実装                                          │
│  │                                                                          │
│  └───────────────────────────────────────────────────────────────────────   │
│                              ↓                                              │
│  STEP 2: Test First ────────────────────────────────────────────────────   │
│  │                                                                          │
│  │  2.1 検証スクリプト作成                                                 │
│  │      scripts/verify-{app}.sh                                            │
│  │                                                                          │
│  │  2.2 E2Eテスト作成                                                      │
│  │      e2e/{app}/integration.spec.ts                                      │
│  │                                                                          │
│  │  2.3 テストをまず実行（FAILを確認）                                    │
│  │      ./scripts/verify-{app}.sh → 期待通りFAIL                          │
│  │                                                                          │
│  └───────────────────────────────────────────────────────────────────────   │
│                              ↓                                              │
│  STEP 3: Implementation Loop ───────────────────────────────────────────   │
│  │                                                                          │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  │ LOOP 1-5                                                         │   │
│  │  │                                                                  │   │
│  │  │  3.1 DEMO_パターンを1つずつ置き換え                             │   │
│  │  │      - DEMO_XXX → useXXX() フック呼び出し                       │   │
│  │  │      - Loading/Error/Empty 状態追加                             │   │
│  │  │                                                                  │   │
│  │  │  3.2 検証実行                                                   │   │
│  │  │      ./scripts/verify-{app}.sh                                  │   │
│  │  │                                                                  │   │
│  │  │  3.3 結果分析                                                   │   │
│  │  │      PASS → STEP 4へ                                            │   │
│  │  │      FAIL → エラー修正 → 次ループ                               │   │
│  │  │                                                                  │   │
│  │  │  3.4 5ループでFAIL → 人間介入要求                               │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │
│  │                                                                          │
│  └───────────────────────────────────────────────────────────────────────   │
│                              ↓                                              │
│  STEP 4: 3-Agent Review ────────────────────────────────────────────────   │
│  │                                                                          │
│  │  4.1 Impl Agent Review                                                  │
│  │      - 全DEMO_削除確認                                                  │
│  │      - TypeScriptエラーなし確認                                        │
│  │                                                                          │
│  │  4.2 Review Agent Review                                                │
│  │      - React Queryパターン準拠                                          │
│  │      - エラーハンドリング適切                                           │
│  │                                                                          │
│  │  4.3 Test Agent Review                                                  │
│  │      - verify-{app}.sh PASS                                             │
│  │      - E2Eテスト PASS                                                   │
│  │                                                                          │
│  │  4.4 全員APPROVE → STEP 5へ                                            │
│  │      1人でもREJECT → STEP 3へ戻る                                      │
│  │                                                                          │
│  └───────────────────────────────────────────────────────────────────────   │
│                              ↓                                              │
│  STEP 5: PR Checkpoint ─────────────────────────────────────────────────   │
│  │                                                                          │
│  │  5.1 進捗トラッカー更新                                                 │
│  │      docs/integration/FULLSTACK_PROGRESS.md                             │
│  │                                                                          │
│  │  5.2 コミット                                                           │
│  │      git add -A && git commit                                           │
│  │                                                                          │
│  │  5.3 PR作成                                                             │
│  │      gh pr create                                                       │
│  │                                                                          │
│  │  5.4 完了報告                                                           │
│  │                                                                          │
│  └───────────────────────────────────────────────────────────────────────   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Implementation

### STEP 1: Planning

```markdown
## STEP 1: {App} Planning

### 1.1 現状分析

**DEMO_パターン検出:**
```bash
grep -rn "DEMO_" apps/web/src/components/{app} --include="*.tsx"
```

結果:
| File | Line | Pattern |
|------|:----:|---------|
| {file1} | {line} | DEMO_XXX |
| ... | ... | ... |

**Hooks状況:**
```bash
ls apps/web/src/hooks/{app}/
```

結果: {hooks_count} ファイル

### 1.2 完了条件

このセッションの完了条件:
1. [ ] DEMO_ パターン = 0
2. [ ] useQuery/useMutation 使用
3. [ ] Loading/Error/Empty 実装
4. [ ] verify-{app}.sh PASS
5. [ ] E2E テスト PASS

### 1.3 CLAUDE.md 作成

→ apps/web/src/components/{app}/CLAUDE.md を作成
```

### STEP 2: Test First

```markdown
## STEP 2: {App} Test First

### 2.1 検証スクリプト作成

→ scripts/verify-{app}.sh を作成

### 2.2 E2Eテスト作成

→ e2e/{app}/integration.spec.ts を作成

### 2.3 初回実行（FAILを確認）

```bash
./scripts/verify-{app}.sh
```

結果:
```
❌ DEMO_ patterns: {n} (must be 0)
❌ useQuery usage: 0 (must be > 0)
```

→ 期待通りFAIL。STEP 3へ進む。
```

### STEP 3: Implementation Loop

```markdown
## STEP 3: {App} Implementation Loop

### Loop 1

**3.1 実装**

置き換え対象: {file}:{line} の DEMO_XXX

Before:
```typescript
const DEMO_DATA = [...];
return <List data={DEMO_DATA} />;
```

After:
```typescript
const { data, isLoading, error } = useXXX();
if (isLoading) return <Skeleton />;
if (error) return <ErrorState message={error.message} />;
return <List data={data} />;
```

**3.2 検証実行**

```bash
./scripts/verify-{app}.sh
```

結果:
```
✅ DEMO_ patterns: {n-1}
⚠️ まだ残り{n-1}箇所
```

→ Loop 2 へ

### Loop 2
...

### Loop N (Final)

```bash
./scripts/verify-{app}.sh
```

結果:
```
✅ DEMO_ patterns: 0
✅ useQuery usage: {n}
✅ Hooks files: {n}
✅ VERIFICATION PASSED
```

→ STEP 4 へ
```

### STEP 4: 3-Agent Review

```markdown
## STEP 4: {App} 3-Agent Review

### 4.1 Impl Agent

| Check | Result |
|-------|:------:|
| DEMO_ = 0 | ✅ |
| TypeScript errors | ✅ None |
| ESLint errors | ✅ None |
| console.log残存 | ✅ None |

**Verdict: APPROVE**

### 4.2 Review Agent

| Check | Result |
|-------|:------:|
| React Query pattern | ✅ |
| Error handling | ✅ |
| Loading states | ✅ |

**Verdict: APPROVE**

### 4.3 Test Agent

```bash
./scripts/verify-{app}.sh
# ✅ PASSED

npx playwright test e2e/{app}/integration.spec.ts
# 4 passed (3.2s)
```

**Verdict: APPROVE**

### 4.4 Final Decision

| Agent | Verdict |
|-------|:-------:|
| Impl | ✅ APPROVE |
| Review | ✅ APPROVE |
| Test | ✅ APPROVE |

**→ ALL APPROVED. STEP 5 へ**
```

### STEP 5: PR Checkpoint

```markdown
## STEP 5: {App} PR Checkpoint

### 5.1 進捗更新

FULLSTACK_PROGRESS.md を更新:
- {app}: ⬜ → ✅

### 5.2 コミット

```bash
git add -A
git commit -m "feat({app}): complete layer integration

- Remove all DEMO_ patterns
- Implement useQuery hooks
- Add Loading/Error/Empty states
- Add integration tests

Verification:
- scripts/verify-{app}.sh: PASS
- e2e/{app}/integration.spec.ts: 4 passed

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 5.3 PR作成

```bash
gh pr create --title "feat({app}): Layer Integration Complete" --body "..."
```

### 5.4 完了報告

## {App} Layer Integration Complete ✅

### Summary
- DEMO_ removed: {n} patterns
- Hooks created: {n} files
- Tests: 4 passed

### Verification
```
./scripts/verify-{app}.sh
✅ VERIFICATION PASSED
```

### PR
→ {PR URL}

### Next
→ {次のアプリ}
```

---

## Phase-Based Execution

### 「レイヤー統合 Phase 1」を受けた場合

Phase 1 は Prover と Observer の登録・承認フロー。
以下の順序で実行：

1. **prover アプリ** (apply, dashboard)
2. **observer アプリ** (register, dashboard)
3. **qs-admin アプリ** (provers, observers 画面のみ)

```markdown
## Phase 1: Prover/Observer 統合

### 実行順序
1. prover: 申請フロー
2. observer: 登録フロー
3. qs-admin: 承認画面

### 依存チェック
- [ ] Docker 起動済み
- [ ] Backend 起動済み
- [ ] Frontend 起動済み

→ prover から開始
```

---

## Error Handling

### 5ループでFAILの場合

```markdown
## 人間介入要求

### 状況
- 5ループ実行完了
- 検証: FAIL

### 残存エラー
| Check | Status | 詳細 |
|-------|:------:|------|
| DEMO_ | ❌ | 2箇所残存 |
| useQuery | ✅ | OK |

### 試行した修正
1. Loop 1: {修正内容}
2. Loop 2: {修正内容}
...

### 残存箇所
- apps/web/src/components/{app}/{file}:{line}
- ...

### 推奨アクション
- [ ] 手動でコード確認
- [ ] 依存関係の問題確認
- [ ] Hooks実装が必要

→ 修正後に「レイヤー統合 {app} 続行」で再開
```

---

## Critical Rules

```xml
<rule id="LO-001" level="ABSOLUTE">
  1アプリ = 1セッション。
  複数アプリを同時処理しない。
</rule>

<rule id="LO-002" level="ABSOLUTE">
  Step 1-5 は順序通り実行。
  スキップ禁止。
</rule>

<rule id="LO-003" level="ABSOLUTE">
  検証スクリプトがPASSするまでSTEP 4に進まない。
</rule>

<rule id="LO-004" level="ABSOLUTE">
  3-Agent全員APPROVEするまでSTEP 5に進まない。
</rule>

<rule id="LO-005" level="MUST">
  各ステップの完了を明示的に報告してから次へ。
</rule>
```

---

## Related Documents

- [70_layer_integration.md](./70_layer_integration.md) - Framework
- [LAYER_INTEGRATION_PLAN.md](../integration/LAYER_INTEGRATION_PLAN.md) - Master plan
- [21_impl_verify_loop.md](./21_impl_verify_loop.md) - Original verify loop
- [22_three_agent.md](./22_three_agent.md) - 3-Agent collaboration

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-02 | 1.0 | Initial version |
