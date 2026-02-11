# Design Brief: Observer/Challenger

## Overview

| 項目 | 値 |
|------|-----|
| System | Observer/Challenger |
| System ID | 05 |
| Directory | system_05_observer |
| Priority | P2 |
| Total Screens | 10 |
| Target Personas | 中村さん (Observer/Challenger) |
| Created | 2026-01-10 |

---

## Screen List

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 1 | Monitor Overview | Monitor | 中村さん | ダッシュボード、全体監視状況 |
| 2 | Pending Unlocks | Monitor | 中村さん | 待機中のUnlock一覧、フィルタリング |
| 3 | Suspicious Transactions | Monitor | 中村さん | 疑わしい取引一覧、アラート表示 |
| 4 | Monitor History | Monitor | 中村さん | 過去の監視履歴 |
| 5 | Challenge Form | Challenge | 中村さん | Challenge提起フォーム、証拠入力 |
| 6 | Challenge Confirm | Challenge | 中村さん | Challenge確認、Bond支払い |
| 7 | Challenge Submitted | Challenge | 中村さん | 提出完了、Defense待機開始 |
| 8 | Challenge Progress | Challenge | 中村さん | 進捗トラッキング、72時間カウントダウン |
| 9 | Challenge Result | Challenge | 中村さん | 結果表示、成功/失敗 |
| 10 | Earnings & Claim | Earnings | 中村さん | 報酬ダッシュボード、Claim機能 |

---

## Design Requirements

### Color Usage

| 用途 | 色 | Hex |
|------|-----|-----|
| Primary Actions (Challenge提起) | Hinomaru Red | #BC002D |
| Secondary (詳細表示等) | Gold | #C9A962 |
| Background | Dark | #0A0A0C |
| 監視アクティブ | Success Green | #00C896 |
| 異常検知アラート | Warning Orange | #F0A030 |
| Challenge失敗 | Error Orange-Red | #E07040 |
| 待機中/Pending | Pending Gray | #8080A0 |

### Key Visual Elements

1. **リアルタイム監視ダッシュボード**
   - Unlock要求のライブフィード
   - フィルタリング機能（金額、時間、ステータス）
   - 異常検知ハイライト

2. **Challenge進捗タイムライン**
   - 72時間Defense期間のカウントダウン
   - ステータスインジケーター
   - 証拠表示エリア

3. **報酬トラッカー**
   - 獲得報酬サマリー
   - Challenge成功率統計
   - Claim可能額表示

4. **データテーブル**
   - ソート・フィルター機能
   - ページネーション
   - 詳細展開（アコーディオン）

### Special Considerations

1. **高技術レベルユーザー向け**
   - 中村さん（★★★★★）向け、詳細データ表示重視
   - API連携情報、技術的詳細も表示可能に
   - キーボードショートカット対応検討

2. **PC 99%利用**
   - デスクトップ最適化優先
   - 大画面での情報密度を高く
   - モバイルはアラート確認のみで可

3. **リアルタイム更新**
   - WebSocket対応想定
   - 新規Unlock要求の即時表示
   - プッシュ通知連携

4. **セキュリティ重視UI**
   - 証拠データの完全性表示
   - トランザクションハッシュ検証リンク
   - Explorer連携

5. **Core Principles 準拠**
   - CP-5 透明性: オンチェーンデータへのリンク必須
   - Challenge Bond計算の透明な表示

---

## Persona Details

### 中村さん（Observer/Challenger）

```
┌─────────────────────────────────────────────────────────────┐
│                        中村さん                              │
│                 セキュリティリサーチャー                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  【基本情報】                                                │
│  • 年齢: 40歳                                               │
│  • 職業: 独立セキュリティリサーチャー                       │
│  • 居住地: アメリカ（リモート）                             │
│  • 技術レベル: ★★★★★（エキスパート）                      │
│                                                             │
│  【背景】                                                    │
│  • ブロックチェーンセキュリティの専門家                     │
│  • バグバウンティ経験あり（$100K+獲得）                     │
│  • 複数のプロトコルでObserver活動中                         │
│  • 「セキュリティは報酬で維持される」という考え             │
│                                                             │
│  【関心】                                                    │
│  • 異常なUnlockを検知してChallenge                         │
│  • Challenge成功時の報酬（Prover Stakeの一部）              │
│  • 必要Stake額と報酬の見合い                                │
│  • 自動検知ツールの効率化                                   │
│                                                             │
│  【スタイル】                                                │
│  • 複数のモニタリングツールを同時運用                       │
│  • 自動検知スクリプトを作成                                 │
│  • 疑わしい取引を見つけたら即座にChallenge                  │
│  • 証拠をしっかり準備してから行動                           │
│                                                             │
│  【利用デバイス】                                            │
│  • PC 99%（監視、分析、Challenge）                          │
│  • サーバー（自動監視用）                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### UI配慮ポイント

| 観点 | 対応 |
|------|------|
| 技術レベル | 詳細データ表示、API情報、ログ出力 |
| 効率重視 | キーボードナビゲーション、クイックアクション |
| 長時間監視 | ダークモード、目に優しい配色 |
| データ密度 | 情報密度高め、展開/折りたたみ対応 |
| 証拠準備 | コピー機能、エクスポート機能 |

---

## User Journey: Observer/Challenger

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      Observer / Challenger ジャーニー                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  認知      理解      Stake     監視      Challenge    報酬      退出           │
│   │         │         │         │           │          │         │             │
│   ▼         ▼         ▼         ▼           ▼          ▼         ▼             │
│ ┌───┐   ┌───┐    ┌───┐    ┌───┐      ┌───┐     ┌───┐    ┌───┐               │
│ │LP │──►│How│───►│Deposit│─►│Monitor│─►│Challenge│►│Claim│──►│Exit│            │
│ └───┘   └───┘    └───┘    └───┘      └───┘     └───┘    └───┘               │
│                                                                                 │
│  Challengeフロー:                                                               │
│  1. 異常検知 → 2. 証拠収集 → 3. Bond入金 → 4. Challenge                        │
│  → 5. Prover Defense (72h) → 6. 判定                                           │
│                                                                                 │
│  Challenge成功: Prover Stakeの一部 + Bond返還                                  │
│  Challenge失敗: Bond没収                                                        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Challenge Flow Details

### Challenge Bond計算

```
Challenge Bond = MAX(0.1 ETH, Unlock金額 × 1%)

例:
• 5 ETH Unlock   → Bond = MAX(0.1, 0.05)  = 0.1 ETH
• 20 ETH Unlock  → Bond = MAX(0.1, 0.2)   = 0.2 ETH
• 100 ETH Unlock → Bond = MAX(0.1, 1.0)   = 1.0 ETH
```

### タイムライン

| フェーズ | 期間 | アクション |
|----------|------|-----------|
| Challenge提起 | 即時 | Bond入金、証拠提出 |
| Prover Defense | 72時間 | Proverが弁明可能 |
| 判定 | Defense期間後 | 自動判定または仲裁 |
| 報酬分配 | 判定後即時 | 成功時: 報酬+Bond返還 |

---

## Screen Details

### 1. Monitor Overview

**目的**: 全体の監視状況を把握

**コンテンツ**:
- 監視中のUnlock要求数
- アクティブChallenge数
- 累計報酬額
- リアルタイムフィード

**コンポーネント**:
- サマリーカード (4列)
- ライブフィードテーブル
- フィルターバー

---

### 2. Pending Unlocks

**目的**: 待機中のUnlock要求を監視

**コンテンツ**:
- 全Pending Unlock一覧
- 金額、開始時刻、残り時間
- ユーザーアドレス

**コンポーネント**:
- データテーブル（ソート可）
- ステータスバッジ
- 詳細展開パネル

---

### 3. Suspicious Transactions

**目的**: 異常検知されたトランザクション

**コンテンツ**:
- 異常スコア表示
- 検知理由
- Challenge推奨度

**コンポーネント**:
- アラートカード
- 詳細分析パネル
- Quick Challenge ボタン

---

### 4. Monitor History

**目的**: 過去の監視・Challenge履歴

**コンテンツ**:
- 過去のChallenge一覧
- 結果（成功/失敗）
- 獲得報酬履歴

**コンポーネント**:
- 履歴テーブル
- 日付フィルター
- エクスポート機能

---

### 5. Challenge Form

**目的**: Challenge提起の入力フォーム

**コンテンツ**:
- 対象トランザクション選択
- 証拠入力（テキスト/リンク）
- Bond計算表示

**コンポーネント**:
- フォームフィールド
- 証拠アップロード
- Bond見積もり表示

---

### 6. Challenge Confirm

**目的**: Challenge内容の最終確認

**コンテンツ**:
- 対象詳細
- 証拠サマリー
- Bond支払い確認

**コンポーネント**:
- 確認カード
- 同意チェックボックス
- Submit ボタン

---

### 7. Challenge Submitted

**目的**: Challenge提出完了確認

**コンテンツ**:
- Challenge ID
- TX ハッシュ
- Defense期間開始通知

**コンポーネント**:
- 成功メッセージ
- TXリンク
- 進捗ページへのリンク

---

### 8. Challenge Progress

**目的**: Challenge進捗のトラッキング

**コンテンツ**:
- 72時間カウントダウン
- Prover応答状況
- ステータスタイムライン

**コンポーネント**:
- カウントダウンタイマー
- ステータスタイムライン
- 通知設定

---

### 9. Challenge Result

**目的**: Challenge結果表示

**コンテンツ**:
- 判定結果（成功/失敗）
- 報酬額（成功時）
- Bond状態（返還/没収）

**コンポーネント**:
- 結果カード
- 報酬詳細
- Claim ボタン（成功時）

---

### 10. Earnings & Claim

**目的**: 報酬管理とClaim

**コンテンツ**:
- 総獲得報酬
- Claim可能額
- Challenge統計

**コンポーネント**:
- 報酬サマリーカード
- Claim フォーム
- 履歴テーブル

---

## Component Library Reference

| Component | Usage |
|-----------|-------|
| DataTable | Pending, Suspicious, History |
| Card | Summary stats, Results |
| Timeline | Challenge Progress |
| CountdownTimer | Defense period |
| Badge | Status indicators |
| AlertCard | Suspicious transactions |
| Form | Challenge input |
| Modal | Confirmations |

---

## Next Steps

1. → `09_design_create.md` でワイヤーフレーム・モック作成
2. DESIGN_MANIFEST.md 作成
3. wip/mocks/*.html 作成

---

## Review Agents

| Agent | Focus |
|-------|-------|
| CDO（佐々木さん） | セキュリティ感の表現 |
| 鈴木さん | Challenge参加の動機付け |

---

**Created**: 2026-01-10
**Status**: Ready for 09_design_create
