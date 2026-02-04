# Implementation Report Template

> このテンプレートは画面/機能実装完了時に使用します。

---

## {Screen/Feature Name} Implementation Report

### 基本情報

| 項目 | 値 |
|------|-----|
| 実装日時 | {YYYY-MM-DD HH:mm} |
| Phase | 8-{X} |
| カテゴリ | {category} |
| URL | /qs-admin/{path} |

---

### 成果物

#### ファイル一覧

| Type | Path | Status |
|------|------|:------:|
| Page | `apps/web/src/app/[locale]/qs-admin/{path}/page.tsx` | ✅ |
| Component | `apps/web/src/components/qs-admin/{Component}/index.tsx` | ✅ |
| i18n (ja) | `apps/web/locales/ja/qs-admin.json` | ✅ |
| i18n (en) | `apps/web/locales/en/qs-admin.json` | ✅ |
| Story | `apps/web/src/components/qs-admin/{Component}.stories.tsx` | ✅ |
| Test | `apps/web/e2e/qs-admin/{path}.spec.ts` | ✅ |

#### i18n キー数

| Locale | Keys Added |
|--------|:----------:|
| Japanese (ja) | {n} |
| English (en) | {n} |

---

### 検証結果

#### Build Checks

| Check | Command | Result |
|-------|---------|:------:|
| TypeScript | `pnpm tsc --noEmit` | ✅/❌ |
| ESLint | `pnpm lint` | ✅/❌ |
| Storybook | `pnpm storybook build` | ✅/❌ |

#### Visual Checks

| Check | Result | Note |
|-------|:------:|------|
| Desktop (1920px) | ✅/❌ | {note} |
| Tablet (768px) | ✅/❌ | {note} |
| Mobile (375px) | ✅/❌ | {note} |

---

### 実装詳細

#### コンポーネント構成

```
{Component}/
├── index.tsx        # メインコンポーネント
├── {SubComponent}.tsx
├── hooks/
│   └── use{Hook}.ts
└── types.ts
```

#### 主要な状態管理

| State | Type | 用途 |
|-------|------|------|
| {stateName} | {type} | {description} |

#### API連携

| Endpoint | Method | 用途 |
|----------|--------|------|
| /admin/{path} | GET | {description} |
| /admin/{path} | POST | {description} |

---

### スクリーンショット

```
[Desktop View]
{screenshot_path or "Playwright MCPで取得"}

[Mobile View]
{screenshot_path or "Playwright MCPで取得"}
```

---

### 既知の問題/TODO

| # | 内容 | 優先度 | 対応予定 |
|---|------|:------:|---------|
| 1 | {issue} | High/Med/Low | {when} |

---

### 次のタスク

→ {next_screen_or_task}

---

**Report End**
