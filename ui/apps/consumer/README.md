# ⚠️ DEPRECATED - Consumer App (Legacy)

> **このアプリは非推奨です。新しい実装は `apps/web` を使用してください。**

## 問題点

このアプリには以下の問題があり、本番環境では使用しないでください：

1. **日本語ハードコード** - i18n未対応（CR-2違反）
2. **独自CSS** - shadcn/ui未使用
3. **next-intl未対応** - 多言語対応なし

## 正しい実装

```
apps/web/src/app/[locale]/consumer/
```

上記のパスに、以下の機能を備えた正しい実装があります：

- ✅ `next-intl` による多言語対応
- ✅ `shadcn/ui` コンポーネント
- ✅ `t('key')` による翻訳
- ✅ WCAG 2.1 AA準拠

## 起動方法（正しい方）

```bash
cd apps/web
pnpm install
pnpm dev
```

アクセス: http://localhost:3000/ja/consumer/dashboard

---

**注意**: このディレクトリは将来のバージョンで削除される予定です。
