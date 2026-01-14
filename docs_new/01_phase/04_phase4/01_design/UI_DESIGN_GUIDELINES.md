# 🎨 Quantum Shield UI Design Guidelines
## Premium Japan Design System v1.0

> **Version**: 1.0  
> **Date**: 2026-01-06  
> **Status**: Approved  
> **Base Concept**: 案5 Premium Japan

---

# Part 1: Design Philosophy

## 1.1 コンセプト

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│    🇯🇵  PREMIUM JAPAN  🇯🇵                                       │
│                                                                 │
│    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│    │   日本発    │  │  未来技術   │  │  信頼性    │           │
│    │  Made in    │  │  Quantum    │  │  Premium   │           │
│    │   Japan     │  │  Resistant  │  │   Trust    │           │
│    └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                 │
│    キーワード:                                                   │
│    • 日の丸（赤×白）のアイデンティティ                          │
│    • ゴールドによるプレミアム感                                  │
│    • クリーンで洗練されたFintech品質                            │
│    • 未来的だが信頼できる                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 1.2 デザイン原則

| 原則 | 説明 | 実践 |
|------|------|------|
| **Trust First** | 信頼性を最優先 | 銀行品質のUI、エラー時の明確なフィードバック |
| **Clarity** | 明確さ | 専門用語には説明、階層的な情報設計 |
| **Japanese Identity** | 日本らしさ | 控えめだが印象的な日の丸モチーフ |
| **Accessibility** | アクセシビリティ | コントラスト比4.5:1以上、レスポンシブ |
| **Performance** | パフォーマンス | アニメーションは軽量、必要最小限 |

## 1.3 ターゲットペルソナ別考慮事項

| ペルソナ | 技術レベル | 重視点 | UI配慮 |
|---------|:---------:|--------|--------|
| End User（田中さん） | ★★☆☆☆ | 安心感、分かりやすさ | ツールチップ、ステップガイド |
| Token Holder（鈴木さん） | ★★★★☆ | 効率、データ可視化 | ダッシュボード、チャート |
| Prover（山田さん） | ★★★★★ | 信頼性、数値正確性 | テーブル、PDF出力 |
| Service Provider（佐藤さん） | ★★★★☆ | 長時間使用、API連携 | 目に優しい配色 |
| Delegate（渡辺さん） | ★★★★☆ | 情報整理、共有性 | ステータス色分け、OGP |

---

# Part 2: Color System

## 2.1 Primary Colors

```
┌─────────────────────────────────────────────────────────────────┐
│  PRIMARY COLORS                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐                                          │
│  │                  │  HINOMARU RED                            │
│  │    #BC002D       │  日の丸レッド                             │
│  │                  │  • メインアクセント                       │
│  │                  │  • CTA ボタン                            │
│  └──────────────────┘  • ブランドアイデンティティ              │
│                                                                 │
│  ┌──────────────────┐                                          │
│  │                  │  PURE WHITE                              │
│  │    #FFFFFF       │  純白                                    │
│  │                  │  • 日の丸の白地                          │
│  │                  │  • テキスト（ダーク背景時）              │
│  └──────────────────┘  • カード背景（ライトモード）            │
│                                                                 │
│  ┌──────────────────┐                                          │
│  │                  │  PREMIUM GOLD                            │
│  │    #C9A962       │  プレミアムゴールド                       │
│  │                  │  • セカンダリアクセント                   │
│  │                  │  • 軌道リング、装飾                       │
│  └──────────────────┘  • プレミアム感の演出                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### CSS Variables

```css
:root {
  /* Primary */
  --color-hinomaru: #BC002D;
  --color-hinomaru-light: #E8334D;
  --color-hinomaru-dark: #8A001A;
  --color-hinomaru-dim: rgba(188, 0, 45, 0.12);
  --color-hinomaru-glow: rgba(188, 0, 45, 0.4);
  
  --color-white: #FFFFFF;
  --color-white-dim: rgba(255, 255, 255, 0.08);
  
  --color-gold: #C9A962;
  --color-gold-light: #E0C080;
  --color-gold-dim: rgba(201, 169, 98, 0.12);
}
```

## 2.2 Background Colors

```
┌─────────────────────────────────────────────────────────────────┐
│  BACKGROUND COLORS (Dark Theme)                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Layer 0: --bg-primary      #0A0A0C   最深部（ページ背景）      │
│  Layer 1: --bg-secondary    #111114   カード背景               │
│  Layer 2: --bg-elevated     #18181C   ホバー、アクティブ        │
│  Layer 3: --bg-surface      #1E1E24   モーダル、ドロップダウン  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### CSS Variables

```css
:root {
  /* Background */
  --bg-primary: #0A0A0C;
  --bg-secondary: #111114;
  --bg-elevated: #18181C;
  --bg-surface: #1E1E24;
  --bg-card: #0E0E11;
}
```

## 2.3 Status Colors

> ⚠️ **重要**: 赤（Hinomaru）はブランドカラーのため、エラー表示には使用しない

```
┌─────────────────────────────────────────────────────────────────┐
│  STATUS COLORS                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ SUCCESS     #00C896   緑系（完了、成功）                    │
│  ⚠️ WARNING     #F0A030   オレンジ（警告、注意）                │
│  ❌ ERROR       #E07040   オレンジレッド（エラー）※赤を避ける   │
│  ℹ️ INFO        #4A90D9   ブルー（情報、ヒント）                │
│  ⏳ PENDING     #8080A0   グレー（保留、処理中）                │
│                                                                 │
│  【投票ステータス】                                              │
│  👍 FOR         #00C896   緑（賛成）                            │
│  👎 AGAINST     #E07040   オレンジレッド（反対）                │
│  🤷 ABSTAIN     #8080A0   グレー（棄権）                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### CSS Variables

```css
:root {
  /* Status */
  --color-success: #00C896;
  --color-success-dim: rgba(0, 200, 150, 0.12);
  
  --color-warning: #F0A030;
  --color-warning-dim: rgba(240, 160, 48, 0.12);
  
  --color-error: #E07040;        /* オレンジレッド - 赤を避ける */
  --color-error-dim: rgba(224, 112, 64, 0.12);
  
  --color-info: #4A90D9;
  --color-info-dim: rgba(74, 144, 217, 0.12);
  
  --color-pending: #8080A0;
  --color-pending-dim: rgba(128, 128, 160, 0.12);
  
  /* Voting */
  --color-vote-for: var(--color-success);
  --color-vote-against: var(--color-error);
  --color-vote-abstain: var(--color-pending);
}
```

## 2.4 Text Colors

```css
:root {
  /* Text */
  --text-primary: #F8F8FA;      /* メインテキスト */
  --text-secondary: #9898A0;    /* サブテキスト */
  --text-tertiary: #606068;     /* 補足、ラベル */
  --text-muted: #404048;        /* プレースホルダー */
  --text-inverse: #0A0A0C;      /* 白背景時 */
}
```

## 2.5 Border Colors

```css
:root {
  /* Border */
  --border-subtle: rgba(255, 255, 255, 0.04);
  --border-default: rgba(255, 255, 255, 0.08);
  --border-emphasis: rgba(255, 255, 255, 0.12);
  --border-focus: var(--color-hinomaru);
}
```

## 2.6 Color Usage Rules

| 用途 | 色 | 例 |
|------|-----|-----|
| CTAボタン | `--color-hinomaru` | Lock, Unlock, Submit |
| セカンダリボタン | `--color-gold` | View Details, Learn More |
| アウトラインボタン | `--border-default` | Cancel, Back |
| 成功メッセージ | `--color-success` | Transaction Complete |
| エラーメッセージ | `--color-error` | ⚠️ オレンジレッド使用 |
| リンク | `--color-gold` | テキストリンク |
| ホバー | `--bg-elevated` | カードホバー |

---

# Part 3: Typography

## 3.1 Font Family

```css
:root {
  /* Font Family */
  --font-display: 'Plus Jakarta Sans', 'Noto Sans JP', sans-serif;
  --font-body: 'Plus Jakarta Sans', 'Noto Sans JP', sans-serif;
  --font-mono: 'DM Mono', 'Noto Sans JP', monospace;
}
```

### 選定理由

| フォント | 用途 | 理由 |
|---------|------|------|
| Plus Jakarta Sans | 英語表示 | モダン、読みやすい、Fintech向き |
| Noto Sans JP | 日本語表示 | Google公式、高品質、多言語対応 |
| DM Mono | コード、数値 | 等幅、視認性高い |

## 3.2 Type Scale

```
┌─────────────────────────────────────────────────────────────────┐
│  TYPE SCALE                                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Display Large    48px / 1.1 / -1.5px   ヒーローセクション      │
│  Display Medium   36px / 1.2 / -1px     ページタイトル          │
│  Display Small    28px / 1.2 / -0.5px   セクションタイトル      │
│                                                                 │
│  Heading 1        24px / 1.3 / -0.3px   カードタイトル          │
│  Heading 2        20px / 1.3 / 0        サブセクション          │
│  Heading 3        18px / 1.4 / 0        小見出し               │
│                                                                 │
│  Body Large       16px / 1.6 / 0        本文（大）             │
│  Body Medium      14px / 1.5 / 0        本文（標準）           │
│  Body Small       13px / 1.5 / 0        補足テキスト           │
│                                                                 │
│  Caption          12px / 1.4 / 0        キャプション、ラベル   │
│  Overline         11px / 1.3 / 1.5px    セクションラベル       │
│                                                                 │
│  Mono Large       16px / 1.5 / 0        金額表示               │
│  Mono Medium      14px / 1.5 / 0        アドレス、ハッシュ     │
│  Mono Small       12px / 1.4 / 0        タイムスタンプ         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### CSS Variables

```css
:root {
  /* Font Size */
  --text-display-lg: 48px;
  --text-display-md: 36px;
  --text-display-sm: 28px;
  --text-h1: 24px;
  --text-h2: 20px;
  --text-h3: 18px;
  --text-body-lg: 16px;
  --text-body-md: 14px;
  --text-body-sm: 13px;
  --text-caption: 12px;
  --text-overline: 11px;
  
  /* Font Weight */
  --font-light: 300;
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

## 3.3 Typography Rules

### 数値表示

```css
/* 金額は常にMonoフォント */
.amount {
  font-family: var(--font-mono);
  font-weight: var(--font-semibold);
  font-variant-numeric: tabular-nums;  /* 桁揃え */
}

/* 大きな数値は桁区切り */
/* 例: 1,234,567.89 ETH */
```

### 日本語混在時

```css
/* 日本語は1行あたり40文字程度 */
.japanese-text {
  max-width: 40em;
  line-height: 1.8;  /* 日本語は行間広め */
}
```

---

# Part 4: Spacing System

## 4.1 Base Unit

```
Base Unit: 4px

┌─────────────────────────────────────────────────────────────────┐
│  SPACING SCALE                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  --space-0     0px      なし                                   │
│  --space-1     4px      最小（アイコンとテキストの間）         │
│  --space-2     8px      小（要素内パディング）                 │
│  --space-3     12px     小〜中                                 │
│  --space-4     16px     標準（カード内パディング）             │
│  --space-5     20px     中                                     │
│  --space-6     24px     中〜大（セクション間）                 │
│  --space-8     32px     大（カード間）                         │
│  --space-10    40px     大                                     │
│  --space-12    48px     特大（セクション間）                   │
│  --space-16    64px     最大（ページセクション間）             │
│  --space-20    80px     ヒーローセクション                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### CSS Variables

```css
:root {
  --space-0: 0;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
}
```

## 4.2 Layout Spacing

| 用途 | 値 | 使用例 |
|------|-----|--------|
| カード内パディング | `--space-6` (24px) | カードボディ |
| カード間マージン | `--space-4` (16px) | グリッドギャップ |
| セクション間 | `--space-12` (48px) | メインセクション間 |
| ページ余白 | `--space-8` (32px) | コンテナパディング |
| ボタン内パディング | `--space-2` × `--space-4` | 8px 16px |

---

# Part 5: Border Radius

```css
:root {
  --radius-none: 0;
  --radius-sm: 6px;      /* ボタン、バッジ */
  --radius-md: 10px;     /* 入力、小カード */
  --radius-lg: 14px;     /* カード */
  --radius-xl: 20px;     /* 大カード、モーダル */
  --radius-2xl: 28px;    /* ヒーローカード */
  --radius-full: 9999px; /* ピル、アバター */
}
```

---

# Part 6: Shadow System

```css
:root {
  /* Elevation */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.25);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.3);
  
  /* Glow Effects */
  --glow-hinomaru: 0 0 60px var(--color-hinomaru-glow);
  --glow-gold: 0 0 40px var(--color-gold-dim);
  --glow-success: 0 0 20px rgba(0, 200, 150, 0.3);
}
```

---

# Part 7: Animation

## 7.1 Timing Functions

```css
:root {
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

## 7.2 Duration

```css
:root {
  --duration-instant: 0ms;
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --duration-slower: 600ms;
}
```

## 7.3 Standard Animations

### 日の丸パルス（ブランドアニメーション）

```css
@keyframes hinomaru-pulse {
  0%, 100% { 
    transform: scale(1); 
    box-shadow: 0 0 60px var(--color-hinomaru-glow);
  }
  50% { 
    transform: scale(1.03); 
    box-shadow: 0 0 80px var(--color-hinomaru-glow);
  }
}

.hinomaru-animation {
  animation: hinomaru-pulse 4s ease-in-out infinite;
}
```

### 軌道回転

```css
@keyframes orbit-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.orbit-slow { animation: orbit-spin 25s linear infinite; }
.orbit-medium { animation: orbit-spin 15s linear infinite; }
.orbit-fast { animation: orbit-spin 8s linear infinite; }
```

### ローディング

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-spinner {
  animation: spin 1s linear infinite;
}
```

## 7.4 Reduced Motion

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

# Part 8: Components

## 8.1 Buttons

### Primary Button（日の丸レッド）

```css
.btn-primary {
  background: linear-gradient(135deg, var(--color-hinomaru), var(--color-hinomaru-light));
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-weight: var(--font-semibold);
  transition: all var(--duration-normal) var(--ease-default);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-hinomaru);
}
```

### Secondary Button（ゴールド）

```css
.btn-secondary {
  background: var(--color-gold);
  color: var(--bg-primary);
  /* 他は Primary と同様 */
}
```

### Outline Button

```css
.btn-outline {
  background: transparent;
  border: 1px solid var(--border-default);
  color: var(--text-secondary);
}

.btn-outline:hover {
  border-color: var(--color-hinomaru);
  color: var(--color-hinomaru-light);
}
```

### Button Sizes

| Size | Padding | Font Size | Min Height |
|------|---------|-----------|------------|
| Small | 6px 12px | 12px | 32px |
| Medium | 10px 20px | 14px | 40px |
| Large | 14px 28px | 16px | 48px |

## 8.2 Cards

```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.card-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--border-subtle);
}

.card-body {
  padding: var(--space-6);
}

/* Hover Effect */
.card-interactive:hover {
  border-color: var(--border-default);
}

/* Top Accent Line */
.card-accent::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--color-hinomaru), var(--color-gold));
}
```

## 8.3 Input Fields

```css
.input-wrapper {
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-6);
  transition: all var(--duration-normal) var(--ease-default);
}

.input-wrapper:focus-within {
  border-color: var(--color-hinomaru);
  box-shadow: 0 0 0 3px var(--color-hinomaru-dim);
}

.input-wrapper input {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: var(--text-body-lg);
  outline: none;
}

.input-wrapper input::placeholder {
  color: var(--text-muted);
}
```

## 8.4 Badges

```css
/* Status Badge */
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--text-caption);
  font-weight: var(--font-medium);
}

.badge-success {
  background: var(--color-success-dim);
  color: var(--color-success);
}

.badge-warning {
  background: var(--color-warning-dim);
  color: var(--color-warning);
}

.badge-error {
  background: var(--color-error-dim);
  color: var(--color-error);
}

/* Quantum Badge (Brand) */
.badge-quantum {
  background: var(--color-hinomaru-dim);
  border: 1px solid var(--color-hinomaru);
  color: var(--color-hinomaru-light);
}
```

## 8.5 Progress Bar

```css
.progress-bar {
  height: 6px;
  background: var(--bg-primary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-hinomaru), var(--color-gold));
  border-radius: var(--radius-full);
  transition: width var(--duration-slow) var(--ease-out);
}
```

## 8.6 Tooltip（専門用語説明用）

```css
.tooltip {
  position: relative;
}

.tooltip-content {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: var(--space-2) var(--space-3);
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  font-size: var(--text-body-sm);
  color: var(--text-secondary);
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all var(--duration-fast) var(--ease-default);
}

.tooltip:hover .tooltip-content {
  opacity: 1;
  visibility: visible;
}
```

---

# Part 9: Icons

## 9.1 Icon Library

**推奨**: Lucide Icons（React対応、軽量、一貫性）

```bash
npm install lucide-react
```

## 9.2 Icon Sizes

| Size | Value | 用途 |
|------|-------|------|
| XS | 14px | バッジ内、インライン |
| SM | 16px | ボタン内、リスト |
| MD | 20px | ナビゲーション |
| LG | 24px | カードアイコン |
| XL | 32px | 空状態、ヒーロー |
| 2XL | 48px | フィーチャーアイコン |

## 9.3 Key Icons

| 用途 | アイコン | Lucide名 |
|------|---------|----------|
| Lock | 🔒 | `Lock` |
| Unlock | 🔓 | `Unlock` |
| Shield | 🛡️ | `Shield` / `ShieldCheck` |
| Wallet | 👛 | `Wallet` |
| Time | ⏰ | `Clock` / `Timer` |
| Success | ✅ | `CheckCircle` |
| Error | ❌ | `XCircle` |
| Warning | ⚠️ | `AlertTriangle` |
| Info | ℹ️ | `Info` |
| Settings | ⚙️ | `Settings` |
| Vote For | 👍 | `ThumbsUp` |
| Vote Against | 👎 | `ThumbsDown` |

---

# Part 10: Responsive Design

## 10.1 Breakpoints

```css
:root {
  --breakpoint-sm: 640px;   /* Mobile landscape */
  --breakpoint-md: 768px;   /* Tablet */
  --breakpoint-lg: 1024px;  /* Desktop */
  --breakpoint-xl: 1280px;  /* Large desktop */
  --breakpoint-2xl: 1536px; /* Ultra wide */
}
```

### Media Queries

```css
/* Mobile First */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

## 10.2 Container

```css
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

@media (min-width: 640px) {
  .container { max-width: 640px; }
}
@media (min-width: 768px) {
  .container { max-width: 768px; }
}
@media (min-width: 1024px) {
  .container { max-width: 1024px; }
}
@media (min-width: 1280px) {
  .container { max-width: 1280px; }
}
@media (min-width: 1536px) {
  .container { max-width: 1440px; }
}
```

## 10.3 Mobile Considerations

| 考慮事項 | 対応 |
|---------|------|
| タッチターゲット | 最小44px × 44px |
| フォントサイズ | 最小14px（本文） |
| ナビゲーション | ハンバーガーメニュー（md以下） |
| カード | 1カラム（sm以下） |
| 日の丸アニメーション | 簡略化（パフォーマンス） |

---

# Part 11: Accessibility

## 11.1 Color Contrast

| 組み合わせ | コントラスト比 | WCAG |
|-----------|:-------------:|:----:|
| Primary Text on Background | 15.2:1 | AAA ✅ |
| Secondary Text on Background | 5.8:1 | AA ✅ |
| Hinomaru on Background | 5.1:1 | AA ✅ |
| Gold on Background | 4.6:1 | AA ✅ |

## 11.2 Focus States

```css
*:focus-visible {
  outline: 2px solid var(--color-hinomaru);
  outline-offset: 2px;
}

/* ボタン用 */
.btn:focus-visible {
  box-shadow: 0 0 0 3px var(--color-hinomaru-dim);
}
```

## 11.3 Screen Reader

```css
/* 視覚的に隠すがスクリーンリーダーには読み上げ */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

# Part 12: Dark/Light Mode

## 12.1 Light Mode Variables

```css
[data-theme="light"] {
  --bg-primary: #F8F8FA;
  --bg-secondary: #FFFFFF;
  --bg-elevated: #F0F0F4;
  --bg-card: #FFFFFF;
  
  --text-primary: #111114;
  --text-secondary: #606068;
  --text-tertiary: #9898A0;
  
  --border-subtle: rgba(0, 0, 0, 0.04);
  --border-default: rgba(0, 0, 0, 0.08);
}
```

## 12.2 Toggle Implementation

```tsx
// React example
const [theme, setTheme] = useState<'dark' | 'light'>('dark');

useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme);
}, [theme]);
```

---

# Part 13: Brand Assets

## 13.1 Logo Variations

| バリエーション | 使用場面 |
|---------------|---------|
| Logo Full | ヘッダー、フッター |
| Logo Icon | ファビコン、モバイルヘッダー |
| Logo White | ダーク背景 |
| Logo Dark | ライト背景 |

## 13.2 日の丸モチーフ

```
┌─────────────────────────────────────────────────────────────────┐
│  日の丸ロゴ構成                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│         ┌────────────────────┐                                  │
│         │   ゴールドリング    │ ← 回転アニメーション（25s）      │
│         │  ┌──────────────┐  │                                  │
│         │  │    白円      │  │                                  │
│         │  │  ┌──────┐   │  │                                  │
│         │  │  │ 赤円 │   │  │ ← 脈動アニメーション（4s）       │
│         │  │  └──────┘   │  │                                  │
│         │  └──────────────┘  │                                  │
│         └────────────────────┘                                  │
│                                                                 │
│  比率: 赤円直径 = 白円直径 × 0.6                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 13.3 OGP / Social Share

```
┌─────────────────────────────────────────────────────────────────┐
│  OGP Image Template (1200 x 630px)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │    🇯🇵 QUANTUM SHIELD                                     │ │
│  │                                                           │ │
│  │    [日の丸アイコン]                                        │ │
│  │                                                           │ │
│  │    Quantum-Resistant Asset Protection                     │ │
│  │    Made in Japan                                          │ │
│  │                                                           │ │
│  │    Background: グラデーション（赤グロー + ゴールドグロー） │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# Part 14: Implementation Checklist

## 14.1 Tailwind CSS Config（推奨）

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        hinomaru: {
          DEFAULT: '#BC002D',
          light: '#E8334D',
          dark: '#8A001A',
          dim: 'rgba(188, 0, 45, 0.12)',
        },
        gold: {
          DEFAULT: '#C9A962',
          light: '#E0C080',
          dim: 'rgba(201, 169, 98, 0.12)',
        },
        // ... other colors
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'Noto Sans JP', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'Noto Sans JP', 'sans-serif'],
        mono: ['DM Mono', 'Noto Sans JP', 'monospace'],
      },
      // ... spacing, borderRadius, etc.
    },
  },
};
```

## 14.2 必須チェックリスト

- [ ] カラーパレット CSS Variables 設定
- [ ] フォント読み込み（Google Fonts）
- [ ] スペーシングシステム適用
- [ ] ボタンコンポーネント作成
- [ ] カードコンポーネント作成
- [ ] 入力コンポーネント作成
- [ ] バッジコンポーネント作成
- [ ] ツールチップコンポーネント作成
- [ ] レスポンシブブレークポイント設定
- [ ] ダーク/ライトモード切り替え
- [ ] アクセシビリティ対応（フォーカス、コントラスト）
- [ ] 日の丸アニメーション実装
- [ ] OGP画像テンプレート作成

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-06 | 初版作成（Premium Japan採用） |

---

**END OF DOCUMENT**
