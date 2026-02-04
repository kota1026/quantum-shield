# 70_layer_integration.md - Full Stack Layer Integration Framework

> **Version**: 1.0
> **Created**: 2026-02-02
> **Purpose**: UI → Hooks → Backend → DB → Blockchain の完全統合

---

## Overview

このフレームワークは、Every.toのベストプラクティスとSEP v3を統合した
「確実に動作する」レイヤー統合手法です。

### Core Principles

1. **Planning First**: 計画と完了条件を先に定義
2. **TDD**: テスト（検証スクリプト）を先に書く
3. **Executor/Evaluator Loop**: 実装→検証→修正→再検証
4. **PR Checkpoint**: 1アプリ完了 = 1PR = 自動検証PASS
5. **Directory CLAUDE.md**: コンテキストの分離

---

## Trigger Commands

```
# メインコマンド
レイヤー統合 開始                    ← 計画から自動実行（★推奨）
レイヤー統合 {app}                   ← 特定アプリの統合
レイヤー統合 検証 {app}              ← 検証のみ実行

# 個別ステップ
レイヤー統合 計画                    ← Step 1: 計画作成
レイヤー統合 テスト作成 {app}        ← Step 2: テスト先行作成
レイヤー統合 実装 {app}              ← Step 3: 実装+検証ループ
レイヤー統合 レビュー {app}          ← Step 4: 3-Agent レビュー
レイヤー統合 PR {app}                ← Step 5: PR作成

# 進捗確認
レイヤー統合 進捗確認                ← 全体進捗
レイヤー統合 ログ検証 {app}          ← E2E + ログ検証
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LAYER INTEGRATION FRAMEWORK                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ STEP 1: Planning (計画)                                              │   │
│  │ ─────────────────────────────────────────────────────────────────── │   │
│  │ Input:  「{app} を統合して」                                         │   │
│  │ Action: 完了条件を定義、CLAUDE.md作成                               │   │
│  │ Output: apps/web/src/components/{app}/CLAUDE.md                     │   │
│  │ Gate:   計画ファイル存在                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ STEP 2: Test First (テスト先行)                                      │   │
│  │ ─────────────────────────────────────────────────────────────────── │   │
│  │ Action: 検証スクリプト + E2Eテスト作成                              │   │
│  │ Output:                                                              │   │
│  │   - scripts/verify-{app}.sh                                         │   │
│  │   - e2e/{app}/integration.spec.ts                                   │   │
│  │ Gate:   テストファイル存在（実行はまだしない）                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ STEP 3: Implementation + Verification Loop (実装+検証)               │   │
│  │ ─────────────────────────────────────────────────────────────────── │   │
│  │                                                                      │   │
│  │   ┌────────┐   ┌──────────┐   ┌──────────┐   ┌────────┐            │   │
│  │   │ 実装   │──>│ 検証実行 │──>│ エラー   │──>│ 修正   │─┐          │   │
│  │   │        │   │          │   │ 解析     │   │        │ │          │   │
│  │   └────────┘   └──────────┘   └──────────┘   └────────┘ │          │   │
│  │        ↑                                                 │          │   │
│  │        └─────────────< max 5 loops >─────────────────────┘          │   │
│  │                                                                      │   │
│  │ Gate:   検証スクリプト PASS                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ STEP 4: 3-Agent Review (レビュー)                                    │   │
│  │ ─────────────────────────────────────────────────────────────────── │   │
│  │ Agents:                                                              │   │
│  │   - Impl Agent: 実装完了確認                                        │   │
│  │   - Review Agent: コード品質・パターン確認                          │   │
│  │   - Test Agent: テスト全PASS確認                                    │   │
│  │ Gate:   3エージェント全員APPROVE                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ STEP 5: PR Checkpoint                                                │   │
│  │ ─────────────────────────────────────────────────────────────────── │   │
│  │ Action:                                                              │   │
│  │   1. 検証結果をPR本文に記載                                         │   │
│  │   2. 進捗トラッカー更新                                             │   │
│  │   3. PR作成                                                          │   │
│  │ Gate:   PR作成完了                                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## STEP 1: Planning (計画)

### 1.1 ディレクトリ別CLAUDE.md テンプレート

各アプリの `components/{app}/` に配置：

```markdown
# {App Name} Integration Rules

## 完了条件
このアプリの統合は、以下がすべて満たされた時に完了：

1. [ ] DEMO_ パターン使用数 = 0
2. [ ] 全コンポーネントで useQuery/useMutation 使用
3. [ ] Loading/Error/Empty の3状態実装
4. [ ] E2Eテスト全PASS
5. [ ] ログ検証PASS（バックエンドが実際にDB/Blockchainと通信）

## 検証コマンド
```bash
./scripts/verify-{app}.sh
```

## 依存関係
- 前提: {依存するアプリ/機能}
- 提供: {このアプリが提供する機能}

## 禁止事項
- DEMO_ プレフィックスのモックデータ使用
- ハードコード日本語（t() 経由必須）
- console.log（logger 使用必須）
```

### 1.2 計画作成手順

1. アプリの現状分析（DEMO_数、Hooks数）
2. 依存関係の特定
3. 完了条件の定義
4. CLAUDE.md作成

---

## STEP 2: Test First (テスト先行)

### 2.1 検証スクリプト テンプレート

```bash
#!/bin/bash
# scripts/verify-{app}.sh
# Layer Integration Verification for {App}

set -e
APP="{app}"
PASS=true

echo "=========================================="
echo "Layer Integration Verification: $APP"
echo "=========================================="

# ===== Layer 2-3: Hooks Connection =====
echo ""
echo "🔍 Layer 2-3: Hooks Connection"

# Check 1: DEMO_ patterns
DEMO_COUNT=$(grep -r "DEMO_" apps/web/src/components/$APP --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
if [ "$DEMO_COUNT" -eq 0 ]; then
  echo "  ✅ DEMO_ patterns: 0"
else
  echo "  ❌ DEMO_ patterns: $DEMO_COUNT (must be 0)"
  PASS=false
fi

# Check 2: useQuery usage
USEQUERY=$(grep -r "useQuery\|useMutation" apps/web/src/components/$APP --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
if [ "$USEQUERY" -gt 0 ]; then
  echo "  ✅ useQuery/useMutation: $USEQUERY usages"
else
  echo "  ❌ useQuery/useMutation: 0 (must be > 0)"
  PASS=false
fi

# Check 3: Hooks files exist
HOOKS=$(ls apps/web/src/hooks/$APP/*.ts 2>/dev/null | wc -l | tr -d ' ')
if [ "$HOOKS" -gt 0 ]; then
  echo "  ✅ Hooks files: $HOOKS"
else
  echo "  ❌ Hooks files: 0 (must be > 0)"
  PASS=false
fi

# Check 4: Loading/Error states
LOADING=$(grep -r "isLoading\|Skeleton\|Loading" apps/web/src/components/$APP --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
ERROR=$(grep -r "isError\|error\|ErrorState" apps/web/src/components/$APP --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
if [ "$LOADING" -gt 0 ] && [ "$ERROR" -gt 0 ]; then
  echo "  ✅ Loading state: $LOADING, Error state: $ERROR"
else
  echo "  ⚠️ Loading: $LOADING, Error: $ERROR (both should be > 0)"
fi

# ===== Layer 4: Backend Integration =====
echo ""
echo "🔍 Layer 4: Backend API"

# Check if API client exists
if [ -f "apps/web/src/lib/api/$APP/client.ts" ]; then
  echo "  ✅ API Client exists"
else
  echo "  ❌ API Client missing: lib/api/$APP/client.ts"
  PASS=false
fi

# ===== Summary =====
echo ""
echo "=========================================="
if [ "$PASS" = true ]; then
  echo "✅ VERIFICATION PASSED"
  exit 0
else
  echo "❌ VERIFICATION FAILED"
  exit 1
fi
```

### 2.2 E2Eテスト テンプレート

```typescript
// e2e/{app}/integration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('{App} Layer Integration', () => {

  // ===== Layer 2-3: UI + Hooks =====
  test('loads data from API (not mock)', async ({ page }) => {
    // Intercept API call to verify it happens
    let apiCalled = false;
    await page.route('**/api/{app}/**', async (route) => {
      apiCalled = true;
      await route.continue();
    });

    await page.goto('/ja/{app}/dashboard');
    await page.waitForLoadState('networkidle');

    expect(apiCalled).toBe(true);
  });

  test('shows loading state', async ({ page }) => {
    await page.route('**/api/{app}/**', async (route) => {
      await new Promise(r => setTimeout(r, 1000));
      await route.continue();
    });

    await page.goto('/ja/{app}/dashboard');

    // Check for loading indicator
    await expect(page.locator('[class*="animate-pulse"], [class*="skeleton"]').first()).toBeVisible();
  });

  test('shows error state on API failure', async ({ page }) => {
    await page.route('**/api/{app}/**', async (route) => {
      await route.fulfill({ status: 500, body: '{"error": "Server error"}' });
    });

    await page.goto('/ja/{app}/dashboard');

    await expect(page.getByText(/error|エラー/i)).toBeVisible();
  });

  // ===== Layer 4-5: Backend + DB =====
  test('backend logs show DB operations', async ({ page, request }) => {
    // This test requires backend to be running with logging enabled
    // Check logs after page interaction

    await page.goto('/ja/{app}/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify via health endpoint or log file
    const health = await request.get('http://localhost:8080/health');
    expect(health.ok()).toBe(true);
  });
});
```

---

## STEP 3: Implementation + Verification Loop

### 3.1 ループ実行手順

```markdown
## Loop N 実行

### 1. 実装
- DEMO_ を useQuery に置き換え
- Loading/Error/Empty 状態を追加

### 2. 検証実行
```bash
./scripts/verify-{app}.sh
```

### 3. 結果分析
| Check | Result | Action |
|-------|:------:|--------|
| DEMO_ count | ✅/❌ | {残り箇所を修正} |
| useQuery usage | ✅/❌ | {フック追加} |
| Hooks files | ✅/❌ | {ファイル作成} |
| Loading state | ✅/❌ | {Skeleton追加} |

### 4. 修正 → 次ループへ
```

### 3.2 ループ終了条件

- **成功**: `verify-{app}.sh` が exit 0
- **失敗**: 5ループ到達 → 人間介入要求

---

## STEP 4: 3-Agent Review

### 4.1 Impl Agent チェック

```markdown
## Impl Agent Review

### 実装完了確認
- [ ] 全DEMO_パターン削除済み
- [ ] 全コンポーネントでuseQuery使用
- [ ] API Client実装済み
- [ ] Types定義済み

### コード品質
- [ ] TypeScript型エラーなし
- [ ] ESLintエラーなし
- [ ] console.log 残存なし
```

### 4.2 Review Agent チェック

```markdown
## Review Agent Review

### パターン準拠
- [ ] React Queryベストプラクティス準拠
- [ ] エラーハンドリング適切
- [ ] 再取得ロジック適切

### セキュリティ
- [ ] 認証トークン適切に処理
- [ ] XSS対策（dangerouslySetInnerHTML不使用）
```

### 4.3 Test Agent チェック

```markdown
## Test Agent Review

### テスト実行結果
```bash
npx playwright test e2e/{app}/integration.spec.ts
```

### 結果
| Test | Result |
|------|:------:|
| loads data from API | ✅/❌ |
| shows loading state | ✅/❌ |
| shows error state | ✅/❌ |
| backend logs show DB ops | ✅/❌ |
```

---

## STEP 5: PR Checkpoint

### 5.1 PR テンプレート

```markdown
## {App} Layer Integration Complete

### Summary
{App} の全レイヤー統合を完了しました。

### Verification Results
```
./scripts/verify-{app}.sh
✅ DEMO_ patterns: 0
✅ useQuery usage: {N}
✅ Hooks files: {N}
✅ Loading/Error states: implemented
```

### E2E Test Results
```
npx playwright test e2e/{app}/integration.spec.ts
4 passed (3.2s)
```

### Changes
- Removed {N} DEMO_ patterns
- Added {N} useQuery hooks
- Implemented Loading/Error/Empty states
- Created API client and types

### Checklist
- [x] Verification script PASS
- [x] E2E tests PASS
- [x] 3-Agent review APPROVE
- [x] Progress tracker updated
```

---

## Critical Rules

```xml
<rule id="LI-001" level="ABSOLUTE">
  検証スクリプトがPASSしない限り、完了とは認めない。
  手動確認や目視チェックは不可。
</rule>

<rule id="LI-002" level="ABSOLUTE">
  1アプリ = 1セッション = 1PR。
  複数アプリを同時に処理しない。
</rule>

<rule id="LI-003" level="ABSOLUTE">
  DEMO_ が1つでも残っていたら未完了。
  例外なし。
</rule>

<rule id="LI-004" level="ABSOLUTE">
  E2Eテストでバックエンドログを検証する。
  「UIが動く」だけでは不十分。
</rule>

<rule id="LI-005" level="MUST">
  5ループで解決しない場合は人間介入を要求。
  無限ループ禁止。
</rule>
```

---

## Related Documents

- [Frontend-Backend Integration](../integration/FRONTEND_BACKEND_INTEGRATION.md)
- [Full Stack Progress](../integration/FULLSTACK_PROGRESS.md)
- [21_impl_verify_loop.md](./21_impl_verify_loop.md) - Original verification loop
- [22_three_agent.md](./22_three_agent.md) - 3-Agent collaboration

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-02 | 1.0 | Initial version - Every.to + SEP v3 integration |
