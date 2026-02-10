# クロスアプリ共通パターン

> **目的**: 全8アプリで共通するパターンを一元管理し、一貫性を担保する
> **作成日**: 2026-01-24
> **参照**: [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)

---

## 目次

1. [認証フロー](#1-認証フロー)
2. [Landing → Dashboard 遷移](#2-landing--dashboard-遷移)
3. [共有コンポーネント](#3-共有コンポーネント)
4. [ナビゲーションパターン](#4-ナビゲーションパターン)
5. [翻訳キー構造](#5-翻訳キー構造)
6. [チェックリスト](#6-チェックリスト)

---

## 1. 認証フロー

### 1.1 各アプリの認証要件

| アプリ | 認証種別 | 登録確認 | 遷移先 |
|--------|----------|:--------:|--------|
| Consumer | RainbowKit | 不要 | Dashboard |
| Token Hub | RainbowKit | 不要 | Dashboard |
| Governance | RainbowKit | 不要 | Proposals |
| Prover | RainbowKit | **必要** | Dashboard（登録済のみ） |
| Observer | RainbowKit | **必要** | Dashboard（登録済のみ） |
| Explorer | 不要 | - | Dashboard（認証なし） |
| Enterprise | RainbowKit + KYB | 別途 | Dashboard |
| QS Admin | 内部認証 | 別途 | Dashboard |

### 1.2 標準認証フロー

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Landing    │ →  │    Login     │ →  │  Dashboard   │
│              │    │ (RainbowKit) │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
      │                    │                    │
      │ CTA               │ 接続成功            │
      └────────────────────┴────────────────────┘
```

### 1.3 登録確認フロー（Prover/Observer）

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    Login     │ →  │   Checking   │ →  │  Dashboard   │
│ (RainbowKit) │    │ (登録確認)    │    │ (登録済のみ) │
└──────────────┘    └──────────────┘    └──────────────┘
                           │
                           │ 未登録
                           ▼
                    ┌──────────────┐
                    │ Application  │
                    │ (登録申請)    │
                    └──────────────┘
```

### 1.4 必須インポート

```typescript
// 全Loginコンポーネントで必須
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
```

---

## 2. Landing → Dashboard 遷移

### 2.1 各アプリの遷移パス

| アプリ | Landing | Login | Dashboard |
|--------|---------|-------|-----------|
| Consumer | `/consumer/landing` | `/consumer/onboarding` | `/consumer/dashboard` |
| Token Hub | `/token-hub/landing` | `/token-hub/login` | `/token-hub/dashboard` |
| Governance | `/governance/landing` | `/governance/login` | `/governance/proposals` |
| Prover | `/prover/landing` | `/prover/login` | `/prover/dashboard` |
| Observer | `/observer/landing` | `/observer/login` | `/observer/dashboard` |
| Explorer | `/explorer/landing` | - | `/explorer/dashboard` |
| Enterprise | `/enterprise/landing` | `/enterprise/login` | `/enterprise/dashboard` |
| QS Admin | - | `/admin/login` | `/admin/dashboard` |

### 2.2 CTA配置ルール

**Landing ヘッダー**
- 右端に「始める」「ログイン」等のCTA
- → Login/Onboarding画面へ遷移

**Landing ヒーロー**
- 中央に大きなCTA
- → 同上

**フッター**
- 他アプリへのリンク
- 法的ページへのリンク

---

## 3. 共有コンポーネント

### 3.1 作成済み

| コンポーネント | パス | 用途 |
|---------------|------|------|
| LandingHeader | `components/shared/LandingHeader.tsx` | LP共通ヘッダー |
| LandingFooter | `components/shared/LandingFooter.tsx` | LP共通フッター |
| EcosystemLink | `components/shared/EcosystemLink.tsx` | Ecosystemへの戻り導線 |

### 3.2 作成推奨

| コンポーネント | 用途 | 優先度 |
|---------------|------|:------:|
| LoginTemplate | 共通ログイン画面テンプレート | 中 |
| WalletConnectButton | RainbowKit接続ボタン | 低 |

### 3.3 共通UIコンポーネント

```
components/ui/
├── button.tsx      # 9バリエーション
├── card.tsx        # カード
├── input.tsx       # 入力フィールド
├── badge.tsx       # ステータスバッジ
├── tooltip.tsx     # ツールチップ
└── progress.tsx    # プログレスバー
```

---

## 4. ナビゲーションパターン

### 4.1 ヘッダー構成

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] [NavLinks...] [EcosystemLink] [LangToggle] [CTA]     │
└─────────────────────────────────────────────────────────────┘

各要素:
- Logo: 自アプリのLandingへ
- NavLinks: ページ内アンカー or サブページ
- EcosystemLink: /ecosystem へ
- LangToggle: ja ↔ en 切替
- CTA: Login/Onboarding へ
```

### 4.2 フッター構成

```
┌─────────────────────────────────────────────────────────────┐
│ [Apps]           [Resources]      [Legal]                    │
│ ・Consumer       ・Documentation  ・Terms                    │
│ ・Token Hub      ・FAQ            ・Privacy                  │
│ ・Governance     ・Support        ・Cookie                   │
│ ...                                                          │
├─────────────────────────────────────────────────────────────┤
│ © 2026 Quantum Shield                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. 翻訳キー構造

### 5.1 標準構造

```json
{
  "{app}": {
    "landing": { ... },
    "login": {
      "title": "",
      "description": "",
      "backToLanding": "",
      "selectWallet": "",
      "wallets": { "metamask": "", "walletConnect": "", "coinbase": "" },
      "connecting": { "title": "", "walletPrompt": "" },
      "checking": { "title": "", "description": "" },
      "success": { "title": "", "description": "" },
      "notRegistered": { ... },
      "footer": ""
    },
    "dashboard": { ... }
  }
}
```

### 5.2 共通キー

```json
{
  "common": {
    "nav": {
      "ecosystem": "Ecosystem",
      "backToLanding": "戻る"
    },
    "wallet": {
      "connect": "ウォレット接続",
      "disconnect": "切断"
    }
  }
}
```

---

## 6. チェックリスト

### 6.1 新規アプリ追加時

```
□ Landing ページ作成
  □ LandingHeader 使用
  □ LandingFooter 使用
  □ EcosystemLink 配置
  □ CTA → Login への遷移

□ Login ページ作成
  □ useConnectModal + useAccount 使用
  □ isConnecting 状態でローディング表示
  □ isConnected 後に Dashboard へ遷移
  □ 戻るボタン → Landing へ
  □ 言語切替ボタン配置

□ 翻訳
  □ ja/{app}.json に login セクション追加
  □ en/{app}.json に login セクション追加

□ 登録確認（Prover/Observer系）
  □ 登録確認API呼び出し
  □ 未登録時の申請導線
```

### 6.2 既存アプリ監査時

```
□ 認証フロー
  □ RainbowKit 使用確認
  □ Mock接続の置換確認
  □ 遷移先の正確性

□ ナビゲーション
  □ ヘッダー要素の統一
  □ EcosystemLink の存在
  □ フッター構成の統一

□ 翻訳
  □ ハードコード文字列なし
  □ ja/en 両方のキー存在
```

---

## 更新履歴

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-24 | Claude | 初版作成（認証フロー統一作業の成果を反映）|
