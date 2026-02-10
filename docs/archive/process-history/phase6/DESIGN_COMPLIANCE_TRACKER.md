# Design System Compliance Tracker

> **目的**: DESIGN_SYSTEM.md準拠検証の進捗を追跡
> **最終更新**: 2026-01-25
> **検証プロンプト**: `docs/agents/prompts/41_design_system_check.md`

---

## Overview Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│  DESIGN COMPLIANCE OVERVIEW                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Consumer App:    [████████████████████]  3/19 (16%) 検証中        │
│  Token Hub:       [░░░░░░░░░░░░░░░░░░░░]  0/13 (0%)                │
│  Governance:      [░░░░░░░░░░░░░░░░░░░░]  0/9  (0%)                │
│  Prover Portal:   [░░░░░░░░░░░░░░░░░░░░]  0/13 (0%)                │
│  Observer:        [░░░░░░░░░░░░░░░░░░░░]  0/11 (0%)                │
│  Explorer:        [░░░░░░░░░░░░░░░░░░░░]  0/12 (0%)                │
│  Enterprise:      [░░░░░░░░░░░░░░░░░░░░]  0/33 (0%)                │
│  QS Admin:        [░░░░░░░░░░░░░░░░░░░░]  0/65 (0%)                │
│  ────────────────────────────────────────────────────────────────   │
│  TOTAL:           [░░░░░░░░░░░░░░░░░░░░]  3/175 (2%)               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 検証カテゴリ凡例

| ID | カテゴリ | 説明 |
|----|---------|------|
| D9 | タップターゲット | ≥44px |
| C | カラー | DESIGN_SYSTEM.md準拠 |
| T | タイポグラフィ | フォント・サイズ |
| B | ボタン | Primary 1個/画面 |
| TT | ツールチップ | 見切れなし |
| R | 角丸 | qs/qs-lg/qs-xl |

---

## Consumer App (19 screens)

| # | Screen | D9 | C | T | B | TT | R | Status | Notes |
|---|--------|:--:|:-:|:-:|:-:|:--:|:-:|:------:|-------|
| 01 | dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Done | 2026-01-25 検証完了 |
| 02 | unlock | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Done | 2026-01-25 検証完了 |
| 03 | history | ✅ | ✅ | ✅ | ✅ | - | ✅ | Done | ツールチップなし |
| 04 | landing | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Pending | |
| 05 | onboarding | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Pending | |
| 06 | lock | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Pending | |
| 07 | history_detail | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Pending | |
| 08 | emergency | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Pending | |
| 09 | emergency_detail | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Pending | |
| 10 | unlock_complete | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Pending | |
| 11 | settings | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Pending | |
| 12 | notifications | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Pending | |
| 13 | help | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Pending | |
| 14 | faq | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Pending | |
| 15 | contact | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Pending | |
| 16 | terms | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Pending | |
| 17 | privacy | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Pending | |
| 18 | cookie | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Pending | |
| 19 | wallet_connect | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Pending | |

**Progress**: 3/19 (16%)

---

## 既知の不整合（修正済み）

### ✅ globals.css カラー値の不整合 → 修正完了 (2026-01-25)

`globals.css`のカラー値を`DESIGN_SYSTEM.md`および`tailwind.config.ts`と統一しました。

| カラー | 仕様値 | globals.css (修正後) | Status |
|--------|--------|---------------------|:------:|
| text-primary | `#F8F8FA` | `#F8F8FA` | ✅ |
| text-secondary | `#9898A0` | `#9898A0` | ✅ |
| text-tertiary | `#606068` | `#606068` | ✅ |
| text-muted | `#404048` | `#404048` | ✅ |
| success | `#00C896` | `#00C896` | ✅ |
| warning | `#F0A030` | `#F0A030` | ✅ |
| danger | `#E84057` | `#E84057` | ✅ |

**修正ファイル**: `apps/web/src/styles/globals.css`

---

## 修正履歴

| 日付 | 画面/ファイル | 修正内容 |
|------|--------------|----------|
| 2026-01-25 | Consumer/Dashboard | AppHeader.tsx タップエリア修正（py-3 min-h-[44px]） |
| 2026-01-25 | Consumer/Dashboard | LockAssetCard.tsx クイック金額ボタン修正 |
| 2026-01-25 | Consumer/Dashboard | Tooltip.tsx アイコンボタン44px確保 |
| 2026-01-25 | Consumer/Unlock | MethodCard.tsx ヘルプリンク44px確保 |
| 2026-01-25 | Consumer/History | index.tsx CSVエクスポートボタン44px確保 |

---

## 検証手順

### 1. 画面を開く
```bash
cd apps/web && pnpm dev
# ブラウザで http://localhost:3001/{app}/{screen} を開く
```

### 2. Playwright MCPで検証
```
browser_navigate → 対象URL
browser_evaluate → 検証コード実行
browser_hover → ツールチップ確認
browser_take_screenshot → 証拠保存
```

### 3. 結果を記録
このファイルの該当行を更新:
- ⬜ → ✅ (合格)
- ⬜ → ❌ (不合格・要修正)

---

## 関連ドキュメント

| ドキュメント | パス |
|-------------|------|
| デザインシステム仕様 | `docs/design/DESIGN_SYSTEM.md` |
| 検証プロンプト | `docs/agents/prompts/41_design_system_check.md` |
| 画面監査ガイド | `docs/design/SCREEN_AUDIT_GUIDE.md` |
| Phase 6 進捗 | `docs/phase6/PHASE6_PROGRESS.md` |

---

## ステータス凡例

| Icon | 意味 |
|:----:|------|
| ⬜ | 未検証 |
| ✅ | 合格 |
| ❌ | 不合格・要修正 |
| - | 該当なし |

---

## 更新履歴

| 日付 | 更新内容 |
|------|----------|
| 2026-01-25 | 初版作成。Consumer App Dashboard/Unlock/History検証完了 |
