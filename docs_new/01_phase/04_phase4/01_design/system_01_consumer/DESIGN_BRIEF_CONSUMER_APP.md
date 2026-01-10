# Design Brief: Consumer App

> **Version**: 1.0  
> **Date**: 2026-01-06  
> **Status**: Ready for Design  
> **Priority**: P0 (Critical Path)

---

## Overview

| Item | Value |
|------|-------|
| **System** | Consumer App |
| **Priority** | P0 (最優先) |
| **Total Screens** | 25 |
| **Target Persona** | 田中さん（End User、32歳、暗号資産投資家） |
| **Design System** | Premium Japan v1.0 |
| **Device Priority** | スマホ 60% / PC 40% |

---

## Target Persona Summary

### 田中さん（32歳）

```
┌─────────────────────────────────────────────────────────────────┐
│  技術レベル: ★★☆☆☆（中程度）                                   │
│  利用デバイス: スマホ60% / PC40%                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  【求めていること】                                              │
│  ✅ 長期的に安全な資産保管                                       │
│  ✅ わかりやすい操作（技術に詳しくない）                         │
│  ✅ いざという時に自分で資産を動かせる安心感                     │
│  ✅ 専門用語が少ない説明                                        │
│                                                                 │
│  【不安・課題】                                                  │
│  ❓「今使ってるウォレット、本当に安全なの？」                    │
│  ❓「ブリッジを使うのが怖い」                                    │
│  ❓「10年後、今の暗号が破られたらどうしよう」                    │
│  ❓「技術的な仕組みはよく分からないけど安全がいい」              │
│                                                                 │
│  【UI考慮事項】                                                  │
│  → ツールチップで専門用語を説明                                  │
│  → ステップガイドで操作を誘導                                    │
│  → 成功/失敗を明確にフィードバック                               │
│  → 「量子耐性」を分かりやすく視覚化                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Journey

```
認知 → 理解 → 登録 → Lock → Unlock → 継続 → 退会

感情曲線:
認知: 不安「量子って怖い...」
理解: 安心「自分で守れるのか」
登録: 緊張「秘密鍵、大丈夫かな」
Lock: 期待「これで安心」
Unlock: 安心「ちゃんと戻ってきた」
継続: 信頼「続けて使おう」
```

---

## Screen List (25 Screens)

### Category 1: Public Pages (4)

| # | Screen ID | Screen Name | Description | Key Elements | Priority |
|:-:|-----------|-------------|-------------|--------------|:--------:|
| 1 | 1-1 | Landing Page | 認知フェーズ。QSの価値提案 | ヒーロー、日の丸アニメーション、CTA | 🔴 |
| 2 | 1-2 | How It Works | 仕組み説明 | ステップ図解、アニメーション | 🔴 |
| 3 | 1-3 | Security Explainer | 量子耐性の説明 | 図解、ツールチップ | 🟡 |
| 4 | 1-4 | FAQ | よくある質問 | アコーディオン | 🟡 |

### Category 2: Onboarding (4)

| # | Screen ID | Screen Name | Description | Key Elements | Priority |
|:-:|-----------|-------------|-------------|--------------|:--------:|
| 5 | 1-5 | Wallet Connect | ウォレット接続 | SIWE署名、ウォレット選択 | 🔴 |
| 6 | 1-6 | Key Generation | Dilithium鍵生成 | プログレス、説明 | 🔴 |
| 7 | 1-7 | Backup Instructions | 鍵バックアップ指示 | チェックリスト | 🔴 |
| 8 | 1-8 | Ready | 登録完了 | 成功アニメーション | 🟡 |

### Category 3: Main App - Dashboard (1)

| # | Screen ID | Screen Name | Description | Key Elements | Priority |
|:-:|-----------|-------------|-------------|--------------|:--------:|
| 9 | 1-9 | Dashboard | メイン画面 | 資産サマリー、Lock中、Unlock進行中 | 🔴 |

### Category 4: Lock Flow (4)

| # | Screen ID | Screen Name | Description | Key Elements | Priority |
|:-:|-----------|-------------|-------------|--------------|:--------:|
| 10 | 1-10 | Lock Input | 金額入力 | 金額入力、トークン選択、Quick Amounts | 🔴 |
| 11 | 1-11 | Lock Confirmation | 確認画面 | サマリー、手数料表示 | 🔴 |
| 12 | 1-12 | Lock Processing | 署名・送信中 | ローディング、進捗 | 🟡 |
| 13 | 1-13 | Lock Success | 完了 | 成功アニメーション、次のステップ | 🟡 |

### Category 5: Unlock Flow - Normal (6)

| # | Screen ID | Screen Name | Description | Key Elements | Priority |
|:-:|-----------|-------------|-------------|--------------|:--------:|
| 14 | 1-14 | Unlock Select | 対象Lock選択 | Lockリスト、選択UI | 🔴 |
| 15 | 1-15 | Unlock Method | 通常/緊急選択 | 比較表、メリット/デメリット | 🔴 |
| 16 | 1-16 | Dilithium Sign | Dilithium署名 | 署名要求、説明 | 🔴 |
| 17 | 1-17 | Prover Waiting | Prover署名待ち | ステータス、プログレス | 🟡 |
| 18 | 1-18 | Time Lock Countdown | 24h待機 | カウントダウン、プログレスバー | 🔴 |
| 19 | 1-19 | Unlock Ready | 実行可能 | CTA「Claim」 | 🔴 |
| 20 | 1-20 | Unlock Complete | 完了 | 成功アニメーション | 🟡 |

### Category 6: Emergency Flow (2)

| # | Screen ID | Screen Name | Description | Key Elements | Priority |
|:-:|-----------|-------------|-------------|--------------|:--------:|
| 21 | 1-22 | Emergency Bond | Bond計算・支払い | Bond計算式、警告 | 🔴 |
| 22 | 1-23 | Emergency Complete | 完了 | Bond返還確認 | 🟡 |

### Category 7: Other (3)

| # | Screen ID | Screen Name | Description | Key Elements | Priority |
|:-:|-----------|-------------|-------------|--------------|:--------:|
| 23 | 1-21 | History | 履歴一覧 | フィルタ、リスト | 🟡 |
| 24 | 1-24 | Settings | 設定 | 設定項目 | 🟢 |
| 25 | 1-25 | Key Management | 鍵管理 | バックアップ、エクスポート | 🟡 |

### Priority Legend

| Priority | Count | Description |
|:--------:|:-----:|-------------|
| 🔴 | 14 | MVP必須 |
| 🟡 | 10 | 重要 |
| 🟢 | 1 | Nice to Have |

---

## Design Requirements

### Color Usage

| Element | Color | Variable |
|---------|-------|----------|
| Primary CTA (Lock, Unlock) | Hinomaru Red | `--color-hinomaru` (#BC002D) |
| Secondary Actions | Gold | `--color-gold` (#C9A962) |
| Background | Dark | `--bg-primary` (#0A0A0C) |
| Card Background | Card | `--bg-card` (#0E0E11) |
| Success State | Green | `--color-success` (#00C896) |
| Error State | Orange-Red | `--color-error` (#E07040) ※赤を避ける |
| Time Lock Progress | Gradient | Hinomaru → Gold |

### Key Visual Elements

1. **日の丸アニメーション**
   - Landing Page、Dashboard、Lock Successで使用
   - 白円背景 + 赤円中心 + ゴールド軌道リング
   - 脈動アニメーション（4秒サイクル）
   - 軌道回転アニメーション（25秒サイクル）

2. **Time Lock カウントダウン**
   - プログレスバー（Hinomaru → Gold グラデーション）
   - 残り時間表示（モノスペースフォント）
   - 24時間 / 7日の視覚的区別

3. **Quantum Protected バッジ**
   - 重要な操作画面に表示
   - `--color-hinomaru-dim` 背景 + `--color-hinomaru` ボーダー

4. **ステップインジケーター**
   - Onboarding、Lock/Unlock フローで使用
   - 現在ステップをHinomaru Redでハイライト

### Typography Considerations

| Element | Font | Size | Weight |
|---------|------|------|--------|
| 金額表示 | DM Mono | 32px | 600 |
| カウントダウン | DM Mono | 24px | 500 |
| アドレス | DM Mono | 12px | 400 |
| 見出し | Plus Jakarta Sans | 24px | 600 |
| 本文 | Plus Jakarta Sans | 14px | 400 |
| ラベル | Plus Jakarta Sans | 12px | 500 |

### Mobile Considerations

田中さんはスマホ60%利用のため：

- **ボタン**: 最小タッチターゲット 44px × 44px
- **フォント**: 最小14px（本文）
- **ナビゲーション**: ボトムナビゲーション推奨
- **日の丸アニメーション**: スマホでは簡略化（軌道リング1本のみ）
- **カード**: 1カラムレイアウト

---

## Special Considerations

### 1. 専門用語の説明（田中さん対策）

以下の用語には必ずツールチップまたはインライン説明を付ける：

| 用語 | 説明 |
|------|------|
| Dilithium署名 | 量子コンピュータでも破れない最新の署名技術 |
| Time Lock | 資産を引き出すまでの待機期間。セキュリティのため |
| Emergency Bond | 緊急引き出し時の保証金。7日後に返還 |
| Prover | あなたの引き出しを承認する検証者 |
| 量子耐性 | 将来の量子コンピュータからも守れる |

### 2. エラー状態のデザイン

**重要**: Hinomaru Redはブランドカラーのため、エラーには使用しない

- エラーメッセージ: `--color-error` (#E07040) オレンジレッド
- エラーアイコン: AlertTriangle
- エラー背景: `--color-error-dim`

### 3. ローディング状態

- Prover Waiting時は最大30秒の待機
- 「Proverが署名中...」の説明テキスト
- キャンセル不可を明示

### 4. 緊急Unlock警告

Emergency Bond画面では：
- Bond計算式を明確に表示: `MAX(0.5 ETH, 金額 × 5%)`
- 7日間の待機を強調
- 「本当に緊急ですか？」の確認ダイアログ

---

## Reference Materials

### 既存HTMLモック

`design-concept-5-japan-premium.html` を参照

含まれている要素：
- ヘッダー（ロゴ、ナビ、ウォレット接続）
- 統計カード（TVL、資産、Prover数）
- Lock入力フォーム
- 日の丸アニメーション
- 最近のアクティビティリスト
- Time Lockプログレスバー

### Design System

`docs_new/01_phase/04_phase4/01_design/UI_DESIGN_GUIDELINES.md`

---

## Implementation Order

### Phase 1: Core MVP（14画面）

1. Dashboard (1-9)
2. Lock Input (1-10)
3. Lock Confirmation (1-11)
4. Unlock Select (1-14)
5. Unlock Method (1-15)
6. Dilithium Sign (1-16)
7. Time Lock Countdown (1-18)
8. Unlock Ready (1-19)
9. Emergency Bond (1-22)
10. Landing Page (1-1)
11. How It Works (1-2)
12. Wallet Connect (1-5)
13. Key Generation (1-6)
14. Backup Instructions (1-7)

### Phase 2: Important（10画面）

15. Lock Processing (1-12)
16. Lock Success (1-13)
17. Prover Waiting (1-17)
18. Unlock Complete (1-20)
19. Emergency Complete (1-23)
20. History (1-21)
21. Key Management (1-25)
22. Security Explainer (1-3)
23. FAQ (1-4)
24. Ready (1-8)

### Phase 3: Polish（1画面）

25. Settings (1-24)

---

## Next Steps

1. → `09_design_create.md` でワイヤーフレーム作成
2. → Figmaでハイフィデリティモック作成
3. → UI_PROGRESS_TRACKER.md 更新

---

## Approval

| Role | Name | Date | Status |
|------|------|------|:------:|
| Design Lead | - | - | ⬜ |
| Product Owner | - | - | ⬜ |

---

**END OF DOCUMENT**
