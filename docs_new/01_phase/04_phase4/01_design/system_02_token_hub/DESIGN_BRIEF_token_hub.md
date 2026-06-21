# Design Brief: Token Hub

> **Version**: 1.0  
> **Date**: 2026-01-08  
> **Author**: Design Agent  
> **Status**: Ready for Design

---

## Overview

| 項目 | 値 |
|------|-----|
| **System** | Token Hub |
| **System ID** | 02 |
| **Priority** | P0（Critical Path - Decentralized Edition 必須） |
| **Total Screens** | 18 |
| **Target Personas** | 鈴木さん（28歳・DeFiユーザー）、渡辺さん（42歳・Delegate） |
| **Primary Device** | PC 50% / スマホ 50% |
| **Edition** | Decentralized ✅ / Enterprise ❌ |

---

## Target Personas

### Primary: 鈴木さん（Token Holder）

```
┌─────────────────────────────────────────────────────────────┐
│                        鈴木さん                              │
│                      DeFiユーザー                            │
├─────────────────────────────────────────────────────────────┤
│  【基本情報】                                                │
│  • 年齢: 28歳                                               │
│  • 職業: スタートアップのPM                                 │
│  • 技術レベル: ★★★★☆（高め）                              │
│  • デバイス: PC 50% / スマホ 50%                            │
│                                                             │
│  【背景・経験】                                              │
│  • QSを利用中のEnd User                                     │
│  • 他のDAOにも参加経験あり（Curve, Lido, Aave）             │
│  • veTokenエコノミクスに詳しい                              │
│  • DeFi Degenではないが、積極的に参加                       │
│                                                             │
│  【関心事】                                                  │
│  • 投票に参加して報酬を得たい                               │
│  • 信頼できるDelegateに委任したい                           │
│  • 早期参加者としてのメリットを享受したい                   │
│  • プロトコルの方向性に影響を与えたい                       │
│                                                             │
│  【懸念】                                                    │
│  • ロック期間中に価格が下がったら？                         │
│  • 早期解除のペナルティはどのくらい？                       │
│  • 投票を忘れたら報酬もらえない？                           │
│  • 委任先が信頼できるか分からない                           │
│                                                             │
│  【求めているUI】                                            │
│  • 投票力の減衰を視覚的に分かりやすく                       │
│  • シミュレーターで事前計算できる                           │
│  • 委任先の実績を比較できる                                 │
│  • スマホでも投票通知を確認できる                           │
└─────────────────────────────────────────────────────────────┘
```

### Secondary: 渡辺さん（Delegate）

```
┌─────────────────────────────────────────────────────────────┐
│                        渡辺さん                              │
│                   DAOコミュニティリーダー                    │
├─────────────────────────────────────────────────────────────┤
│  【基本情報】                                                │
│  • 年齢: 42歳                                               │
│  • 職業: 独立コンサルタント                                 │
│  • 技術レベル: ★★★★☆（高め）                              │
│  • デバイス: PC 80% / スマホ 20%                            │
│                                                             │
│  【背景】                                                    │
│  • 複数のDAOでDelegateとして活動                            │
│  • Twitter/Xでフォロワー5万人                               │
│  • ガバナンス分析のニュースレター発行                       │
│                                                             │
│  【関心事】                                                  │
│  • QSガバナンスへの影響力                                   │
│  • Delegate報酬                                             │
│  • コミュニティからの信頼構築                               │
│                                                             │
│  【責任感】                                                  │
│  • 委任されたveQSを正しく使う責任                           │
│  • 重要な投票を見逃さない                                   │
│  • 投票理由を透明に公開する                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## User Journey

### Token Holder Journey
```
認知        理解      veQS Lock    投票/委任      報酬       veQS Unlock
 │           │           │           │           │           │
 ▼           ▼           ▼           ▼           ▼           ▼
┌───┐     ┌───┐      ┌───┐      ┌───┐      ┌───┐      ┌───┐
│LP │────►│Exp│─────►│Lock│────►│Vote│────►│Claim│───►│Unlock│
│   │     │lain│     │Form│     │/Del│     │     │    │      │
└───┘     └───┘      └───┘      └───┘      └───┘      └───┘
```

### 投票力計算
```
veQS = QS × (ロック残存期間 / 最大ロック期間)

例: 1000 QS × 2年ロック
初期: 1000 × (2/4) = 500 veQS
1年後: 1000 × (1/4) = 250 veQS
4年ロック時: 1000 × (4/4) = 1000 veQS
```

---

## Screen List

### 1. Dashboard - 1画面

| # | Screen | Category | Priority | Persona | Notes |
|:-:|--------|----------|:--------:|---------|-------|
| 2-1 | Token Dashboard | Dashboard | P0 | 鈴木・渡辺 | QS/veQS残高、投票力、報酬サマリー |

### 2. veQS Lock - 4画面

| # | Screen | Category | Priority | Persona | Notes |
|:-:|--------|----------|:--------:|---------|-------|
| 2-2 | Lock Form | veQS Lock | P0 | 鈴木 | ロック金額・期間入力 |
| 2-3 | Lock Preview | veQS Lock | P0 | 鈴木 | 投票力計算プレビュー、減衰曲線表示 |
| 2-4 | Lock Confirm | veQS Lock | P0 | 鈴木 | 確認・署名 |
| 2-5 | Lock Success | veQS Lock | P0 | 鈴木 | 完了画面 |

### 3. veQS Manage - 4画面

| # | Screen | Category | Priority | Persona | Notes |
|:-:|--------|----------|:--------:|---------|-------|
| 2-6 | Extend Lock | veQS Manage | P0 | 鈴木 | ロック期間延長 |
| 2-7 | Early Unlock | veQS Manage | P0 | 鈴木 | 早期解除（ペナルティ計算表示） |
| 2-8 | Normal Unlock | veQS Manage | P0 | 鈴木 | 満了時解除 |
| 2-9 | Unlock Success | veQS Manage | P0 | 鈴木 | 完了画面 |

### 4. Delegation - 5画面

| # | Screen | Category | Priority | Persona | Notes |
|:-:|--------|----------|:--------:|---------|-------|
| 2-10 | Delegate List | Delegation | P0 | 鈴木 | Delegate一覧（ランキング形式） |
| 2-11 | Delegate Detail | Delegation | P0 | 鈴木 | Delegate詳細（実績、投票履歴） |
| 2-12 | Delegate Form | Delegation | P0 | 鈴木 | 委任実行 |
| 2-13 | My Delegations | Delegation | P0 | 鈴木 | 委任中一覧 |
| 2-14 | Undelegate | Delegation | P1 | 鈴木 | 委任解除 |

### 5. Rewards - 4画面

| # | Screen | Category | Priority | Persona | Notes |
|:-:|--------|----------|:--------:|---------|-------|
| 2-15 | Rewards Dashboard | Rewards | P0 | 鈴木・渡辺 | 報酬ダッシュボード |
| 2-16 | Claim Rewards | Rewards | P0 | 鈴木・渡辺 | 報酬請求 |
| 2-17 | Rewards History | Rewards | P1 | 鈴木・渡辺 | 報酬履歴 |
| 2-18 | Become Delegate | Rewards | P1 | 渡辺 | Delegate登録（任意） |

---

## Design Requirements

### Color Usage

| 用途 | 色 | 使用場面 |
|------|-----|---------|
| Primary Actions | `--color-hinomaru` (#BC002D) | Lock, Claim, Delegate |
| Secondary | `--color-gold` (#C9A962) | veQS表示、投票力ハイライト |
| Background | `--bg-primary` (#0A0A0C) | ページ背景 |
| Success | `--color-success` (#00C896) | Lock成功、報酬獲得 |
| Warning | `--color-warning` (#F0A030) | 早期解除ペナルティ |
| Info | `--color-info` (#4A90D9) | 投票力減衰説明 |

### Key Visual Elements

1. **投票力減衰曲線**
   - veQS残高の時間経過による減衰を視覚化
   - インタラクティブなチャート（ホバーで詳細表示）

2. **ロック期間スライダー**
   - 1週間〜4年のスライダー
   - リアルタイムで投票力計算結果を表示

3. **Delegateカード**
   - アバター、名前、投票力、実績スコア
   - 投票参加率のバッジ

4. **報酬プログレス**
   - 次回報酬までのプログレスバー
   - 報酬額のリアルタイム表示

5. **ゴールドアクセント**
   - veQSに関連する要素はゴールドで統一
   - QSトークンは白/グレー系

### Typography

| 用途 | フォント | サイズ |
|------|---------|-------|
| veQS残高 | `--font-mono` | 32px / Bold |
| 投票力 | `--font-mono` | 24px / Semibold |
| Delegate名 | `--font-display` | 18px / Semibold |
| 本文 | `--font-body` | 14px / Regular |

### Special Considerations

1. **veTokenエコノミクスの説明**
   - 初心者向けツールチップ
   - 「?」アイコンで詳細説明
   - 減衰曲線のアニメーション

2. **早期解除ペナルティ**
   - 明確な警告表示（オレンジ色）
   - 実際に失う金額を明示
   - 確認ダイアログ必須

3. **Delegate選択支援**
   - 投票参加率
   - 過去の投票履歴
   - コミュニティ評価スコア

4. **モバイル対応**
   - 投票通知のプッシュ通知
   - 簡易ダッシュボード
   - スワイプでDelegate切り替え

5. **QS ↔ veQS の区別**
   - QS: 白/グレー系カラー
   - veQS: ゴールド系カラー
   - 視覚的に明確に区別

---

## Screen Priority for Design

### Phase 1: 必須MVP（10画面）

| Priority | Screens |
|:--------:|---------|
| P0-1 | Token Dashboard (2-1) |
| P0-2 | Lock Form (2-2) |
| P0-3 | Lock Preview (2-3) |
| P0-4 | Lock Confirm (2-4) |
| P0-5 | Lock Success (2-5) |
| P0-6 | Delegate List (2-10) |
| P0-7 | Delegate Detail (2-11) |
| P0-8 | Delegate Form (2-12) |
| P0-9 | Rewards Dashboard (2-15) |
| P0-10 | Claim Rewards (2-16) |

### Phase 2: 重要機能（5画面）

| Priority | Screens |
|:--------:|---------|
| P1-1 | Extend Lock (2-6) |
| P1-2 | Early Unlock (2-7) |
| P1-3 | Normal Unlock (2-8) |
| P1-4 | Unlock Success (2-9) |
| P1-5 | My Delegations (2-13) |

### Phase 3: 追加機能（3画面）

| Priority | Screens |
|:--------:|---------|
| P2-1 | Undelegate (2-14) |
| P2-2 | Rewards History (2-17) |
| P2-3 | Become Delegate (2-18) |

---

## Key Components

### 1. veQS Lock Calculator

```
┌─────────────────────────────────────────────────────────────┐
│  veQS Lock Calculator                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Amount to Lock                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1,000                                      QS ▼    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Lock Period                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1w   3m   6m   1y   2y   3y   4y                    │   │
│  │              ●━━━━━━━━━━━━━━━━━━●                   │   │
│  └─────────────────────────────────────────────────────┘   │
│  Selected: 2 years                                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  You will receive                                    │   │
│  │  ┌───────────────────┐                              │   │
│  │  │  500 veQS         │  ← ゴールド強調              │   │
│  │  └───────────────────┘                              │   │
│  │  Voting Power: 0.5x                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [        Lock QS for veQS        ] ← Hinomaru Red         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Voting Power Decay Chart

```
┌─────────────────────────────────────────────────────────────┐
│  Voting Power Over Time                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  veQS                                                       │
│  1000 ┤                                                     │
│       │●━━━━━━━━━━━━━━━━                                   │
│   750 ┤                 ╲                                   │
│       │                   ╲                                 │
│   500 ┤                     ╲━━━━━━━━━━━━━━━━━━             │
│       │                                       ╲             │
│   250 ┤                                         ╲           │
│       │                                           ╲━━━━━━━  │
│     0 ┼────────────────────────────────────────────────────│
│       0      1yr      2yr      3yr      4yr     Time       │
│                                                             │
│  ● Current: 500 veQS (2 years remaining)                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. Delegate Card

```
┌─────────────────────────────────────────────────────────────┐
│  ┌────┐                                                     │
│  │ 👤 │  渡辺 Delegate                    🥇 Rank #3       │
│  └────┘  @watanabe_dao                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Voting Power         Vote Participation     Delegators    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ 125,000 veQS │    │     98%      │    │     142      │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                             │
│  Recent Votes                                               │
│  • QIP-12: Fee Adjustment ────────────── ✅ For            │
│  • QIP-11: New Prover Requirements ──── ✅ For            │
│  • QIP-10: Time Lock Extension ───────── ❌ Against        │
│                                                             │
│  [    View Profile    ]  [    Delegate    ]                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Accessibility Notes

- 投票力減衰チャート: 色だけでなくパターンも使用
- Delegate選択: キーボードナビゲーション対応
- 金額入力: 音声読み上げ対応
- ペナルティ警告: アイコン + テキスト + 色の組み合わせ

---

## Next Steps

1. → `09_design_create.md` でワイヤーフレーム作成
2. Phase 1 (P0) の10画面を優先的に作成
3. 投票力減衰チャートのインタラクション定義
4. Delegateカードコンポーネントの詳細設計

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-08 | 初版作成 |

---

**END OF DESIGN BRIEF**
