# Navigation Flow Specification

> **Version**: 1.0
> **Date**: 2026-01-25
> **Purpose**: 各画面のボタン/リンクの遷移先を仕様として定義し、E2Eテストで検証する

---

## 概要

このドキュメントは、各画面の**全てのインタラクティブ要素**と**その遷移先/動作**を定義します。

### なぜ必要か

AI駆動型UI開発において、以下の問題が頻発していた:
- ボタンを置いただけで遷移先が未実装
- 遷移先が仕様と異なる
- モーダル/ドロワーが開くべき箇所でページ遷移してしまう

**この仕様書により**:
1. 実装前に遷移先を明確化
2. E2Eテストで自動検証
3. レビュー時のチェックリストとして機能

---

## 凡例

| 記号 | 意味 |
|:----:|------|
| `→ /path` | ページ遷移 |
| `→ modal:name` | モーダルを開く |
| `→ drawer:name` | ドロワーを開く |
| `→ scroll:#id` | ページ内スクロール |
| `→ external:url` | 外部リンク |
| `→ action:name` | その場で処理（API呼び出し等） |
| `→ copy:value` | クリップボードにコピー |

---

## 1. Consumer App (19画面)

### 1.1 Landing (`/consumer/landing`)

| # | 要素 | セレクター | 遷移/動作 |
|---|------|-----------|----------|
| 1 | ロゴ | `a[aria-label*="Quantum Shield"]` | → `/consumer/landing` |
| 2 | 今すぐ始める (Hero) | `button:has-text("今すぐ無料で始める")` | → `/consumer/onboarding` |
| 3 | 詳しく見る | `a:has-text("詳しく見る")` | → scroll:#how-it-works |
| 4 | ナビ: Features | `nav >> a:has-text("Features")` | → scroll:#features |
| 5 | ナビ: How It Works | `nav >> a:has-text("How It Works")` | → scroll:#how-it-works |
| 6 | ウォレット接続 | `button:has-text("ウォレット接続")` | → modal:wallet-connect |
| 7 | 利用規約 | `footer >> a:has-text("利用規約")` | → `/consumer/terms` |
| 8 | プライバシー | `footer >> a:has-text("プライバシー")` | → `/consumer/privacy` |
| 9 | Cookie設定 | `footer >> a:has-text("Cookie")` | → modal:cookie-settings |

### 1.2 Dashboard (`/consumer/dashboard`)

| # | 要素 | セレクター | 遷移/動作 |
|---|------|-----------|----------|
| 1 | ナビ: Dashboard | `nav >> a:has-text("Dashboard")` | → `/consumer/dashboard` |
| 2 | ナビ: Lock | `nav >> a:has-text("Lock")` | → `/consumer/lock` |
| 3 | ナビ: Unlock | `nav >> a:has-text("Unlock")` | → `/consumer/unlock` |
| 4 | ナビ: History | `nav >> a:has-text("History")` | → `/consumer/history` |
| 5 | ウォレットボタン | `button[aria-label*="Wallet"]` | → modal:wallet |
| 6 | StatCard: ロック中 | `button:has-text("ロック中")` | → `/consumer/history` |
| 7 | StatCard: 利用可能 | `button:has-text("利用可能")` | → `/consumer/unlock` |
| 8 | StatCard: アンロック待ち | `button:has-text("アンロック待ち")` | → `/consumer/unlock` |
| 9 | StatCard: 取引数 | `button:has-text("取引数")` | → `/consumer/history` |
| 10 | ロックボタン | `button:has-text("Dilithium署名で資産をロック")` | → modal:lock-confirm |
| 11 | LockModal: 確認 | `dialog >> button:has-text("確認")` | → `/consumer/lock/processing` |
| 12 | LockModal: キャンセル | `dialog >> button:has-text("キャンセル")` | → action:close-modal |
| 13 | 最近のアクティビティ行 | `.recent-activity >> a` | → `/consumer/history` |
| 14 | すべての履歴を見る | `a:has-text("すべての履歴を見る")` | → `/consumer/history` |
| 15 | WalletModal: コピー | `dialog >> button:has-text("コピー")` | → copy:wallet-address |
| 16 | WalletModal: 切断 | `dialog >> button:has-text("切断")` | → `/consumer/landing` |
| 17 | モバイルナビ: ダッシュボード | `nav[aria-label*="Mobile"] >> a[href*="dashboard"]` | → `/consumer/dashboard` |
| 18 | モバイルナビ: ロック | `nav[aria-label*="Mobile"] >> a[href*="lock"]` | → `/consumer/lock` |
| 19 | モバイルナビ: アンロック | `nav[aria-label*="Mobile"] >> a[href*="unlock"]` | → `/consumer/unlock` |
| 20 | モバイルナビ: 履歴 | `nav[aria-label*="Mobile"] >> a[href*="history"]` | → `/consumer/history` |
| 21 | モバイルナビ: 設定 | `nav[aria-label*="Mobile"] >> a[href*="settings"]` | → `/consumer/settings` |

### 1.3 Lock (`/consumer/lock`)

| # | 要素 | セレクター | 遷移/動作 |
|---|------|-----------|----------|
| 1 | 戻る | `a[aria-label*="戻る"], button[aria-label*="戻る"]` | → `/consumer/dashboard` |
| 2 | 確認して進む | `button:has-text("確認して進む")` | → `/consumer/lock/confirm` |
| 3 | ?アイコン (専門用語) | `button[aria-label*="ヘルプ"], .tooltip-trigger` | → modal:help-tooltip |
| 4 | 詳細を見る | `a:has-text("詳細を見る")` | → `/consumer/help` |

### 1.4 Lock Confirm (`/consumer/lock/confirm`)

| # | 要素 | セレクター | 遷移/動作 |
|---|------|-----------|----------|
| 1 | 戻る | `a[aria-label*="戻る"], button[aria-label*="戻る"]` | → `/consumer/lock` |
| 2 | ロックを実行 | `button:has-text("ロックを実行")` | → `/consumer/lock/processing` |
| 3 | キャンセル | `button:has-text("キャンセル")` | → `/consumer/dashboard` |

### 1.5 Lock Processing (`/consumer/lock/processing`)

| # | 要素 | セレクター | 遷移/動作 |
|---|------|-----------|----------|
| 1 | (自動遷移) | - | → `/consumer/lock/complete` (成功時) |
| 2 | キャンセル | `button:has-text("キャンセル")` | → modal:cancel-confirm |
| 3 | CancelModal: はい | `dialog >> button:has-text("はい")` | → `/consumer/dashboard` |

### 1.6 Lock Complete (`/consumer/lock/complete`)

| # | 要素 | セレクター | 遷移/動作 |
|---|------|-----------|----------|
| 1 | ダッシュボードに戻る | `button:has-text("ダッシュボードに戻る")` | → `/consumer/dashboard` |
| 2 | 取引詳細を見る | `a:has-text("取引詳細を見る")` | → `/consumer/history/[txId]` |
| 3 | 続けてロックする | `button:has-text("続けてロック")` | → `/consumer/lock` |

### 1.7 Unlock (`/consumer/unlock`)

| # | 要素 | セレクター | 遷移/動作 |
|---|------|-----------|----------|
| 1 | 戻る | `a[aria-label*="戻る"], button[aria-label*="戻る"]` | → `/consumer/dashboard` |
| 2 | アンロック申請 | `button:has-text("アンロック申請")` | → `/consumer/unlock/confirm` |
| 3 | 緊急アンロック | `a:has-text("緊急アンロック")` | → `/consumer/emergency-unlock` |

### 1.8 Unlock Confirm (`/consumer/unlock/confirm`)

| # | 要素 | セレクター | 遷移/動作 |
|---|------|-----------|----------|
| 1 | 戻る | `a[aria-label*="戻る"], button[aria-label*="戻る"]` | → `/consumer/unlock` |
| 2 | アンロックを実行 | `button:has-text("アンロックを実行")` | → `/consumer/unlock/processing` |
| 3 | キャンセル | `button:has-text("キャンセル")` | → `/consumer/dashboard` |

### 1.9 Unlock Processing (`/consumer/unlock/processing`)

| # | 要素 | セレクター | 遷移/動作 |
|---|------|-----------|----------|
| 1 | (自動遷移) | - | → `/consumer/unlock/complete` (24h待機後) |
| 2 | ステータス確認 | `a:has-text("ステータス確認")` | → `/consumer/history` |

### 1.10 Unlock Complete (`/consumer/unlock/complete`)

| # | 要素 | セレクター | 遷移/動作 |
|---|------|-----------|----------|
| 1 | ダッシュボードに戻る | `button:has-text("ダッシュボードに戻る")` | → `/consumer/dashboard` |
| 2 | 取引詳細を見る | `a:has-text("取引詳細を見る")` | → `/consumer/history/[txId]` |

### 1.11 Emergency Unlock (`/consumer/emergency-unlock`)

| # | 要素 | セレクター | 遷移/動作 |
|---|------|-----------|----------|
| 1 | 戻る | `a[aria-label*="戻る"], button[aria-label*="戻る"]` | → `/consumer/unlock` |
| 2 | 緊急アンロック実行 | `button:has-text("緊急アンロック実行")` | → modal:emergency-confirm |
| 3 | EmergencyModal: 理解して進む | `dialog >> button:has-text("理解して進む")` | → `/consumer/emergency-bond` |

### 1.12 History (`/consumer/history`)

| # | 要素 | セレクター | 遷移/動作 |
|---|------|-----------|----------|
| 1 | 戻る | `a[aria-label*="戻る"], button[aria-label*="戻る"]` | → `/consumer/dashboard` |
| 2 | 取引行クリック | `tr[data-tx-id], .transaction-row` | → `/consumer/history/[id]` |
| 3 | フィルター | `button:has-text("フィルター")` | → drawer:filter |
| 4 | エクスポート | `button:has-text("エクスポート")` | → modal:export |

### 1.13 History Detail (`/consumer/history/[id]`)

| # | 要素 | セレクター | 遷移/動作 |
|---|------|-----------|----------|
| 1 | 戻る | `a[aria-label*="戻る"], button[aria-label*="戻る"]` | → `/consumer/history` |
| 2 | Explorerで見る | `a:has-text("Explorerで見る")` | → external:explorer/tx/[hash] |
| 3 | サポートに連絡 | `a:has-text("サポートに連絡")` | → `/consumer/contact` |

### 1.14 Notifications (`/consumer/notifications`)

| # | 要素 | セレクター | 遷移/動作 |
|---|------|-----------|----------|
| 1 | 戻る | `a[aria-label*="戻る"], button[aria-label*="戻る"]` | → `/consumer/dashboard` |
| 2 | 通知行クリック | `.notification-item` | → (通知タイプに応じた遷移先) |
| 3 | すべて既読にする | `button:has-text("すべて既読")` | → action:mark-all-read |
| 4 | 設定 | `a:has-text("通知設定")` | → `/consumer/settings` |

### 1.15 Settings (`/consumer/settings`)

| # | 要素 | セレクター | 遷移/動作 |
|---|------|-----------|----------|
| 1 | 戻る | `a[aria-label*="戻る"], button[aria-label*="戻る"]` | → `/consumer/dashboard` |
| 2 | セキュリティ設定 | `a:has-text("セキュリティ")` | → `/consumer/settings/security` |
| 3 | 鍵管理 | `a:has-text("鍵管理")` | → `/consumer/settings/keys` |
| 4 | 通知設定 | `a:has-text("通知設定")` | → `/consumer/settings/notifications` |
| 5 | 言語切替 | `button:has-text("日本語"), button:has-text("English")` | → action:change-locale |

### 1.16 Settings Security (`/consumer/settings/security`)

| # | 要素 | セレクター | 遷移/動作 |
|---|------|-----------|----------|
| 1 | 戻る | `a[aria-label*="戻る"], button[aria-label*="戻る"]` | → `/consumer/settings` |
| 2 | 2FA設定 | `button:has-text("2FA設定")` | → modal:2fa-setup |
| 3 | セッション管理 | `a:has-text("セッション管理")` | → modal:sessions |

### 1.17 Settings Keys (`/consumer/settings/keys`)

| # | 要素 | セレクター | 遷移/動作 |
|---|------|-----------|----------|
| 1 | 戻る | `a[aria-label*="戻る"], button[aria-label*="戻る"]` | → `/consumer/settings` |
| 2 | 新しい鍵を生成 | `button:has-text("新しい鍵を生成")` | → modal:key-generate |
| 3 | 鍵をエクスポート | `button:has-text("エクスポート")` | → modal:key-export |
| 4 | 鍵を削除 | `button:has-text("削除")` | → modal:key-delete-confirm |

### 1.18 Help (`/consumer/help`)

| # | 要素 | セレクター | 遷移/動作 |
|---|------|-----------|----------|
| 1 | 戻る | `a[aria-label*="戻る"], button[aria-label*="戻る"]` | → `/consumer/dashboard` |
| 2 | FAQ項目 | `.faq-item` | → expand:accordion |
| 3 | お問い合わせ | `a:has-text("お問い合わせ")` | → `/consumer/contact` |
| 4 | ドキュメント | `a:has-text("ドキュメント")` | → external:docs.quantum-shield.io |

### 1.19 Onboarding (`/consumer/onboarding`)

| # | 要素 | セレクター | 遷移/動作 |
|---|------|-----------|----------|
| 1 | 戻る | `a[aria-label*="戻る"], button[aria-label*="戻る"]` | → `/consumer/landing` |
| 2 | 次へ | `button:has-text("次へ")` | → action:next-step |
| 3 | スキップ | `button:has-text("スキップ")` | → `/consumer/wallet-connect` |
| 4 | 完了 (最終ステップ) | `button:has-text("始める")` | → `/consumer/wallet-connect` |

---

## 2. 実装チェックリスト

各画面の実装時に以下を確認:

```markdown
## 遷移チェックリスト: {screen_name}

### 必須確認項目
- [ ] 全ボタン/リンクがこの仕様書に定義されている
- [ ] 各要素のセレクターが実装と一致
- [ ] 遷移先ページが存在する
- [ ] モーダル/ドロワーが正しく開閉する
- [ ] 戻るボタンが正しい画面に戻る
- [ ] エラー時の遷移が定義されている

### E2Eテスト
- [ ] 全遷移のテストが存在する
- [ ] テストがパスしている
```

---

## 3. E2Eテスト自動生成

この仕様書から以下のE2Eテストを自動生成:

```typescript
// e2e/navigation/consumer-dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Consumer Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/dashboard');
  });

  test('StatCard ロック中 → /consumer/history', async ({ page }) => {
    await page.click('button:has-text("ロック中")');
    await expect(page).toHaveURL(/\/consumer\/history/);
  });

  test('StatCard 利用可能 → /consumer/unlock', async ({ page }) => {
    await page.click('button:has-text("利用可能")');
    await expect(page).toHaveURL(/\/consumer\/unlock/);
  });

  // ... 全ての遷移テスト
});
```

---

## 4. 更新履歴

| バージョン | 日付 | 変更内容 |
|------------|------|----------|
| 1.0 | 2026-01-25 | Consumer App 19画面の初版作成 |

---

## 次のステップ

1. **Token Hub** (10画面) の Navigation Flow 追加
2. **Enterprise Admin** (18画面) の Navigation Flow 追加
3. **QS Admin** (70画面) の Navigation Flow 追加
4. E2Eテストジェネレーター実装
5. CI/CDへの統合
