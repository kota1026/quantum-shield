# Quantum Shield Design System v1.0

> **目的**: 全アプリで一貫したUI/UXを実現するための標準ルール
> **参照**: PayPayミニアプリ標準を参考に、Quantum Shield専用に最適化
> **更新日**: 2026-01-21

---

## 目次

1. [基本原則](#1-基本原則)
2. [カラーシステム](#2-カラーシステム)
3. [タイポグラフィ](#3-タイポグラフィ)
4. [スペーシング](#4-スペーシング)
5. [ボタン](#5-ボタン)
6. [フォーム](#6-フォーム)
7. [カード](#7-カード)
8. [テキスト切れ対策](#8-テキスト切れ対策)
9. [レスポンシブ](#9-レスポンシブ)
10. [アクセシビリティ](#10-アクセシビリティ)
11. [ロゴ・ブランド](#11-ロゴブランド)
12. [アニメーション](#12-アニメーション)
13. [禁止パターン](#13-禁止パターン)
14. [ナビゲーション・画面遷移](#14-ナビゲーション画面遷移)

---

## 1. 基本原則

### 1.1 デザイン哲学

| 原則 | 説明 | 例 |
|------|------|---|
| **Premium Japan** | 日本の美意識（余白、静謐さ）とプレミアム感の融合 | 日の丸レッド + ゴールドアクセント |
| **Trust First** | 資産を扱うため、信頼感・安心感を最優先 | 明確なフィードバック、確認画面 |
| **Clarity** | 専門用語を避け、誰でも理解できる表現 | ツールチップ、図解 |
| **Consistency** | 同じ操作は同じ見た目・動作 | ボタン色の統一、遷移パターン |

### 1.2 最小要件

| 項目 | 値 | 理由 |
|------|-----|------|
| 最小タップエリア | 44px × 44px | iOS HIG準拠 |
| 最小フォントサイズ | 12px (0.75rem) | 可読性確保 |
| 最小コントラスト比 | 4.5:1 | WCAG AA準拠 |
| 最大行長 | 80文字 | 可読性確保 |

---

## 2. カラーシステム

### 2.1 プライマリカラー

| 名前 | Hex | 用途 |
|------|-----|------|
| **Hinomaru Red** | `#BC002D` | メインCTA、重要なアクション |
| **Premium Gold** | `#C9A962` | セカンダリアクション、ステータス（ロック中） |

### 2.2 背景色

| 名前 | Hex | 用途 |
|------|-----|------|
| background-primary | `#0A0A0C` | メイン背景 |
| background-secondary | `#111114` | セクション区切り |
| background-elevated | `#18181C` | モーダル、ドロップダウン |
| background-card | `#0E0E11` | カード背景 |

### 2.3 テキスト色

| 名前 | Hex | 用途 |
|------|-----|------|
| text-primary | `#F8F8FA` | 見出し、重要テキスト |
| text-secondary | `#9898A0` | 本文、説明文 |
| text-tertiary | `#606068` | プレースホルダー、補足 |
| text-muted | `#404048` | 無効状態 |

### 2.4 ステータス色

| 名前 | Hex | 用途 |
|------|-----|------|
| success | `#00C896` | 成功、完了、アンロック済み |
| warning | `#F0A030` | 警告、処理中、アンロック中 |
| danger | `#E84057` | エラー、チャレンジ中 |
| info | `#3B82F6` | 情報、ヒント |

### 2.5 カラー使用ルール

```
✅ DO
- Hinomaru Red: メインCTA（1画面に1つ）
- Gold: セカンダリCTA、ステータスバッジ
- Success: 完了状態、成功メッセージ
- Warning: 確認が必要、処理中
- Danger: 削除、緊急、エラー

❌ DON'T
- 1画面に複数のHinomaru Redボタン
- Success色で「削除」ボタン
- 背景色とテキスト色のコントラスト不足
```

---

## 3. タイポグラフィ

### 3.1 フォントファミリー

| 種類 | フォント | 用途 |
|------|----------|------|
| Display/Body | Plus Jakarta Sans, Noto Sans JP | 見出し、本文 |
| Mono | DM Mono | 数値、アドレス、コード |

### 3.2 フォントサイズ

| 名前 | サイズ | 行高 | 用途 |
|------|--------|------|------|
| xs | 12px (0.75rem) | 1.5 | キャプション、注釈 |
| sm | 14px (0.875rem) | 1.5 | ボタン、ラベル |
| base | 16px (1rem) | 1.75 | 本文 |
| lg | 18px (1.125rem) | 1.75 | 小見出し |
| xl | 20px (1.25rem) | 1.75 | セクション見出し |
| 2xl | 24px (1.5rem) | 1.5 | ページ見出し |
| 3xl | 30px (1.875rem) | 1.4 | ヒーロー見出し |
| 4xl | 36px (2.25rem) | 1.3 | ランディング見出し |

### 3.3 フォント使用ルール

```
✅ DO
- 数値（残高、金額）: DM Mono
- ウォレットアドレス: DM Mono + truncate
- 見出し: font-semibold (600)
- 本文: font-normal (400)

❌ DON'T
- 12px未満のフォントサイズ
- 本文にfont-bold (700)
- 日本語テキストに過度なletter-spacing
```

---

## 4. スペーシング

### 4.1 スペーシングスケール（4px基準）

| 名前 | 値 | 用途 |
|------|-----|------|
| xs | 4px | アイコンとテキストの間 |
| sm | 8px | 密接な要素間 |
| md | 16px | カード内padding、要素間 |
| lg | 24px | セクション間 |
| xl | 32px | ページpadding |
| 2xl | 48px | 大セクション間 |
| 3xl | 64px | ページ最上部・最下部 |

### 4.2 コンテナ

| 要素 | padding | max-width |
|------|---------|-----------|
| ページ | 32px (xl) | 1360px |
| カード | 16px (md) / 24px (lg) | - |
| モーダル | 24px (lg) | 480px |
| ボタン内 | 12px〜32px (size依存) | - |

### 4.3 スペーシング使用ルール

```
✅ DO
- 関連する要素: 8px (sm)
- 独立した要素: 16px (md)
- セクション区切り: 24px (lg) 以上
- 4の倍数を使用

❌ DON'T
- 10px, 15px, 22px などの非グリッド値
- 要素間のスペーシングが不揃い
```

---

## 5. ボタン

### 5.1 ボタンバリエーション

| Variant | 見た目 | 用途 | 1画面の上限 |
|---------|--------|------|:-----------:|
| **primary** | Hinomaru Red グラデーション | メインCTA | 1 |
| **secondary** | Gold 枠線 | セカンダリCTA | 2 |
| **outline** | グレー枠線 | サポートアクション | 無制限 |
| **ghost** | 背景なし | ナビゲーション、キャンセル | 無制限 |
| **danger** | 赤背景 | 削除、緊急解除 | 1 |
| **warning** | オレンジ背景 | 確認必要なアクション | 1 |
| **success** | 緑背景 | 承認、完了 | 1 |
| **link** | 下線テキスト | インラインリンク | 無制限 |
| **gold** | Gold背景 | プレミアムアクション | 1 |

### 5.2 ボタンサイズ

| Size | 高さ | padding | 用途 |
|------|------|---------|------|
| sm | 36px (h-9) | 12px | 補助ボタン、フィルター |
| md | 44px (h-11) | 24px | 標準CTA |
| lg | 52px (h-13) | 32px | ヒーローCTA、モーダル主ボタン |
| icon | 40px × 40px | - | アイコンのみ |

### 5.3 ボタン使用ルール

```
✅ DO
- メインCTA: primary (lg) - 1画面に1つ
- キャンセル: ghost または outline
- 削除: danger（確認モーダル後）
- ローディング中: isLoading + disabled
- アイコン付き: leftIcon / rightIcon prop

❌ DON'T
- 1画面に複数のprimaryボタン
- ボタンテキストが長すぎる（15文字以上）
- 近接する同色ボタン（区別できない）
- disabled状態の説明なし
```

### 5.4 ボタン配置

```
モーダル/フォーム:
┌─────────────────────────────┐
│                             │
│  [キャンセル]  [実行する]   │  ← 右揃え、主ボタンが右
│                             │
└─────────────────────────────┘

カード内:
┌─────────────────────────────┐
│                             │
│  [詳細を見る]               │  ← フル幅
│                             │
└─────────────────────────────┘

ページ下部:
┌─────────────────────────────┐
│                             │
│       [次へ進む]            │  ← 中央揃え
│                             │
└─────────────────────────────┘
```

---

## 6. フォーム

### 6.1 入力フィールド

| 状態 | 枠線色 | 背景色 |
|------|--------|--------|
| Default | border-default | background-card |
| Focus | Hinomaru Red | background-card |
| Error | danger | background-card |
| Disabled | border-subtle | background-secondary |

### 6.2 ラベルとエラー

```
┌─────────────────────────────────┐
│ ラベル *                        │  ← text-sm, text-primary
│ ┌─────────────────────────────┐ │
│ │ プレースホルダー            │ │  ← text-tertiary
│ └─────────────────────────────┘ │
│ ヘルプテキスト                  │  ← text-xs, text-secondary
│ エラーメッセージ                │  ← text-xs, danger
└─────────────────────────────────┘
```

### 6.3 フォーム使用ルール

```
✅ DO
- 必須項目にアスタリスク (*)
- リアルタイムバリデーション
- 明確なエラーメッセージ（何が間違いで、どうすればいいか）
- 金額入力: DM Mono + 右揃え

❌ DON'T
- 「入力エラー」のような曖昧なメッセージ
- フォーカス時に枠線が見えない
- ラベルなしの入力フィールド
```

---

## 7. カード

### 7.1 カードスタイル

| 種類 | 背景 | 枠線 | 用途 |
|------|------|------|------|
| Default | background-card | border-default | 一般的なコンテンツ |
| Elevated | background-elevated | なし | ホバー、選択状態 |
| Highlighted | background-card | Gold | 重要な情報、ステータス |
| Danger | background-card | danger | 警告、エラー |

### 7.2 カード構造

```
┌───────────────────────────────────┐
│  [アイコン] タイトル    [バッジ]  │  ← ヘッダー: padding-md
├───────────────────────────────────┤
│                                   │
│  メインコンテンツ                 │  ← ボディ: padding-md
│                                   │
├───────────────────────────────────┤
│  [アクション]                     │  ← フッター: padding-md
└───────────────────────────────────┘
```

---

## 8. テキスト切れ対策

### 8.1 切れ対策ルール

| 要素 | 対策 | Tailwind Class |
|------|------|----------------|
| ウォレットアドレス | 中間省略 | カスタム（0x1234...5678） |
| 長いタイトル | 1行 + 省略 | `truncate` |
| 説明文 | 2-3行 + 省略 | `line-clamp-2`, `line-clamp-3` |
| ボタンテキスト | 最大15文字、超過禁止 | - |
| テーブルセル | 固定幅 + 省略 | `truncate` + `max-w-[200px]` |

### 8.2 実装例

```tsx
// ウォレットアドレス（中間省略）
const formatAddress = (addr: string) =>
  `${addr.slice(0, 6)}...${addr.slice(-4)}`;

// タイトル（1行省略）
<h3 className="truncate max-w-[200px]">{title}</h3>

// 説明文（2行省略）
<p className="line-clamp-2">{description}</p>

// テーブルセル
<td className="truncate max-w-[150px]" title={fullText}>
  {fullText}
</td>
```

### 8.3 切れ対策必須箇所

| 画面 | 要素 | 対策 |
|------|------|------|
| Dashboard | 資産名 | truncate (max 20文字) |
| History | txハッシュ | 中間省略 |
| History | 説明 | line-clamp-2 |
| Settings | アドレス | 中間省略 |
| 全画面 | ボタン | 15文字以内厳守 |

---

## 9. レスポンシブ

### 9.1 ブレークポイント

| 名前 | 幅 | 対象デバイス |
|------|-----|-------------|
| sm | 640px | 大型スマホ（横） |
| md | 768px | タブレット |
| lg | 1024px | 小型ラップトップ |
| xl | 1280px | デスクトップ |
| 2xl | 1536px | 大型モニター |

### 9.2 レスポンシブパターン

```
モバイル（< 768px）:
- ナビゲーション: ボトムタブ
- カード: 1列
- ボタン: フル幅
- フォント: 1サイズダウン

タブレット（768px〜1024px）:
- ナビゲーション: サイドバー（折りたたみ可）
- カード: 2列
- ボタン: 固定幅

デスクトップ（≥ 1024px）:
- ナビゲーション: サイドバー（展開）
- カード: 3-4列
- ボタン: 固定幅
```

---

## 10. アクセシビリティ

### 10.1 必須要件

| 要件 | 実装方法 |
|------|----------|
| キーボード操作 | tabIndex, focus states |
| スクリーンリーダー | aria-label, aria-describedby |
| コントラスト | 4.5:1以上 |
| モーション低減 | prefers-reduced-motion対応 |
| タップターゲット | 44px × 44px以上 |

### 10.2 チェックリスト

```
□ すべてのインタラクティブ要素にフォーカス状態がある
□ 画像にalt属性がある
□ フォームにラベルが関連付けられている
□ 色だけで情報を伝えていない（アイコン併用）
□ モーダルにフォーカストラップがある
□ エラーメッセージがaria-liveで通知される
```

---

## 11. ロゴ・ブランド

### 11.1 日の丸ロゴ（Hinomaru Logo）

Quantum Shieldのシンボル。日本の国旗をモチーフに、量子耐性を表現。

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              ┌─────────────────┐                    │
│              │    Gold Ring    │  ← 回転する金の輪 │
│              │  ┌───────────┐  │                    │
│              │  │           │  │                    │
│              │  │  Hinomaru │  │  ← 脈動する赤い円 │
│              │  │    Red    │  │                    │
│              │  │           │  │                    │
│              │  └───────────┘  │                    │
│              └─────────────────┘                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### ロゴ構成要素

| 要素 | サイズ | カラー | アニメーション |
|------|--------|--------|---------------|
| 外側リング | 48px | Gold (#C9A962) | 25秒で1回転 |
| 内側円 | 24px | Hinomaru Red (#BC002D) | 4秒で脈動 |
| ドット（リング上） | 6px | Gold | リングと連動 |

#### 使用ルール

```
✅ DO
- ヘッダー左上に配置
- 背景はダーク系（#0A0A0C〜#18181C）
- 十分な余白（最小16px）

❌ DON'T
- 明るい背景に配置
- ロゴの色を変更
- アスペクト比を変更
- 48px未満に縮小
```

### 11.2 テキストロゴ

| 要素 | フォント | サイズ | カラー |
|------|----------|--------|--------|
| メインテキスト | Plus Jakarta Sans 600 | 20px | text-primary (#F8F8FA) |
| サブテキスト | Plus Jakarta Sans 500 | 10px | Gold (#C9A962) |

```
Quantum Shield
量子時代の資産保護
```

### 11.3 ブランドカラーの使用

| 場面 | 使用カラー |
|------|-----------|
| メインCTA | Hinomaru Red グラデーション |
| セカンダリCTA | Gold 枠線 |
| ステータス（ロック中） | Gold |
| ステータス（成功） | Success Green |
| ステータス（警告） | Warning Orange |
| ステータス（緊急） | Hinomaru Red |

---

## 12. アニメーション

### 12.1 アニメーション原則

| 原則 | 説明 |
|------|------|
| **Purposeful** | 意味のあるアニメーションのみ使用 |
| **Subtle** | 控えめで邪魔にならない |
| **Consistent** | 同じ操作には同じアニメーション |
| **Accessible** | `prefers-reduced-motion` 対応必須 |

### 12.2 定義済みアニメーション

#### ロゴアニメーション

| 名前 | 説明 | duration | timing |
|------|------|----------|--------|
| `logo-rotate` | 外側リングの回転 | 25s | linear infinite |
| `hinomaru-pulse` | 中心円の脈動 | 4s | ease-in-out infinite |
| `orbit-spin` | 軌道リングの回転 | 12s/20s/30s | linear infinite |
| `dot-orbit` | 軌道上ドットの回転 | 12s/18s/24s | linear infinite |

#### UIアニメーション

| 名前 | 説明 | duration | timing |
|------|------|----------|--------|
| `glow` | ボタンの光彩効果 | 2s | ease-in-out alternate |
| `shimmer` | ローディングシマー | 2s | linear infinite |
| `pulse-slow` | ゆっくりした脈動 | 3s | cubic-bezier infinite |

### 12.3 CSS実装

```css
/* ロゴ回転 */
@keyframes logo-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 日の丸脈動 */
@keyframes hinomaru-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 60px rgba(188, 0, 45, 0.4),
                0 0 100px rgba(188, 0, 45, 0.2);
  }
  50% {
    transform: scale(1.03);
    box-shadow: 0 0 80px rgba(188, 0, 45, 0.4),
                0 0 120px rgba(188, 0, 45, 0.3);
  }
}

/* 軌道回転 */
@keyframes orbit-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ボタン光彩 */
@keyframes glow {
  0% { box-shadow: 0 0 5px rgba(188, 0, 45, 0.2); }
  100% { box-shadow: 0 0 20px rgba(188, 0, 45, 0.4); }
}

/* シマー効果 */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### 12.4 Tailwind Config 定義

```typescript
// tailwind.config.ts
animation: {
  'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  'glow': 'glow 2s ease-in-out infinite alternate',
  'shimmer': 'shimmer 2s linear infinite',
  'hinomaru-pulse': 'hinomaru-pulse 4s ease-in-out infinite',
  'logo-rotate': 'logo-rotate 25s linear infinite',
}
```

### 12.5 使用ルール

```
✅ DO
- ローディング状態にshimmer
- CTAボタンホバーにglow
- ロゴにlogo-rotate + hinomaru-pulse
- トランジションに duration-250 (250ms)

❌ DON'T
- 1画面に3つ以上のアニメーション
- 高速すぎるアニメーション（200ms未満）
- 常時動き続けるUI要素（ロゴ除く）
- prefers-reduced-motion 無視
```

### 12.6 Reduced Motion 対応

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 13. 禁止パターン

### 13.1 絶対禁止

| パターン | 理由 | 代替案 |
|----------|------|--------|
| 12px未満のフォント | 可読性 | 12px以上 |
| 44px未満のタップエリア | 操作性 | 44px以上 |
| 色のみでエラー表示 | アクセシビリティ | アイコン + テキスト |
| 確認なしの削除 | 誤操作防止 | 確認モーダル |
| 無限スクロール（取引履歴） | 特定取引検索困難 | ページネーション |

### 11.2 非推奨

| パターン | 理由 | 代替案 |
|----------|------|--------|
| 長いボタンテキスト | 視認性 | 15文字以内 |
| 複数のprimaryボタン | 混乱 | 1画面1つ |
| アニメーション過多 | 注意散漫 | 必要最小限 |
| 専門用語のみ | 理解困難 | ツールチップ追加 |

---

## 14. ナビゲーション・画面遷移

### 14.1 画面間データ受け渡し

#### URLSearchParams（推奨）

画面間で少量のデータを渡す場合は `URLSearchParams` を使用。

```typescript
// 送信側（Lock画面 → Processing画面）
const handleConfirmLock = useCallback(() => {
  const params = new URLSearchParams({
    amount: parseFloat(amount).toFixed(2),
    period: period.toString(),
  });
  router.push(`/consumer/lock/processing?${params.toString()}`);
}, [router, amount, period]);

// 受信側（Processing画面）
'use client';
import { useSearchParams } from 'next/navigation';

export function LockProcessing() {
  const searchParams = useSearchParams();
  const amount = searchParams.get('amount') || '5.00';
  const period = searchParams.get('period') || '2';
  // ...
}
```

#### 使い分けガイド

| パターン | ユースケース | 例 |
|----------|--------------|---|
| **URLSearchParams** | 少量データ（1-5項目）、ブックマーク可能にしたい | 金額、期間、ID |
| **Zustand Store** | 複数画面で共有、永続化が必要 | ユーザー設定、ウォレット状態 |
| **API経由** | サーバー上のデータ | 取引履歴、残高 |

#### 注意事項

```
✅ DO
- シンプルなデータ（文字列、数値）を渡す
- デフォルト値を必ず設定
- 金額は小数点2桁に正規化

❌ DON'T
- 機密データ（秘密鍵等）をURLに含める
- 大量データ（配列、オブジェクト）を渡す
- URLパラメータなしでページが動作しない設計
```

### 14.2 画面フローパターン

#### 標準フロー（操作 → 処理 → 完了）

```
┌──────────────┐    ┌───────────────┐    ┌──────────────┐
│   入力画面   │ → │  Processing   │ → │   Success    │
│  (Lock etc)  │    │  (ローディング) │    │  (完了報告)  │
└──────────────┘    └───────────────┘    └──────────────┘
      ↓                    ↓                   ↓
  URLSearchParams     URLSearchParams      戻る/ホームへ
  で次画面へ          で次画面へ           ボタン表示
```

#### 実装例（Lock → Processing → Success）

```typescript
// Lock画面: 確認後にProcessingへ遷移
const params = new URLSearchParams({ amount, period });
router.push(`/consumer/lock/processing?${params}`);

// Processing画面: 完了後にSuccessへ遷移
const successParams = new URLSearchParams({
  amount,
  period,
  txHash: response.tx_hash,
});
router.push(`/consumer/lock/success?${successParams}`);

// Success画面: ホームへ戻るボタン
<Button onClick={() => router.push('/consumer/dashboard')}>
  {t('lock.success.backToHome')}
</Button>
```

### 14.3 コピー機能パターン

#### クリップボードコピー（txHash、アドレス）

```typescript
'use client';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleCopy}>
      {copied ? (
        <Check className="h-4 w-4 text-success" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}
```

#### 使用ルール

```
✅ DO
- コピー成功時にアイコンを✓に変更
- 2秒後に元のアイコンに戻す
- txHash、ウォレットアドレスなど長い文字列に適用

❌ DON'T
- コピー成功のトースト通知（アイコン変更で十分）
- コピー失敗時に何も表示しない
```

### 14.4 ステータス表示パターン

#### Badgeによるステータス表示

```typescript
import { Badge } from '@/components/ui/badge';

// ロック状態
<Badge variant="gold">Locked</Badge>

// 処理中
<Badge variant="warning">Processing</Badge>

// 完了
<Badge variant="success">Completed</Badge>

// エラー
<Badge variant="danger">Failed</Badge>
```

#### ステータスカラー対応

| ステータス | Badge variant | 用途 |
|------------|---------------|------|
| Locked | `gold` | ロック中の資産 |
| Unlocking | `warning` | アンロック処理中（24h待機） |
| Unlocked | `success` | アンロック完了 |
| Failed | `danger` | 処理失敗 |
| Pending | `default` | 保留中 |

### 14.5 派生値の計算（useMemo）

#### 日付計算パターン

```typescript
import { useMemo } from 'react';

const unlockDate = useMemo(() => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + period);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}, [period]);
```

#### 使い分け

| パターン | 用途 |
|----------|------|
| `useMemo` | 計算コストが高い、依存値が変わるまでキャッシュ |
| 直接計算 | 単純な計算、レンダリング毎に実行しても問題ない |
| `useCallback` | 関数をメモ化、子コンポーネントに渡す場合 |

---

## 付録

### A. Tailwind Config 対応表

| Design System | Tailwind Class |
|---------------|----------------|
| hinomaru | `bg-hinomaru`, `text-hinomaru` |
| gold | `bg-gold`, `text-gold` |
| background-primary | `bg-background` |
| background-card | `bg-card` |
| text-primary | `text-foreground` |
| text-secondary | `text-foreground-secondary` |
| border-default | `border-border` |
| spacing-md | `p-4`, `m-4` |
| radius-md | `rounded-qs` |

### B. コンポーネント対応表

| Design System要素 | 実装コンポーネント | パス |
|-------------------|-------------------|------|
| Button | `<Button>` | `components/ui/button.tsx` |
| Card | `<Card>` | `components/ui/card.tsx` |
| Input | `<Input>` | `components/ui/input.tsx` |
| Badge | `<Badge>` | `components/ui/badge.tsx` |
| Tooltip | `<Tooltip>` | `components/ui/tooltip.tsx` |

---

## 更新履歴

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-21 | Claude | 初版作成 |
| 1.1 | 2026-01-22 | Claude | ナビゲーション・画面遷移パターン追加 |
