# Design Brief: Explorer

## Overview

| Item | Value |
|------|-------|
| System | Explorer |
| System ID | 06 |
| Directory | system_06_explorer |
| Priority | P1 |
| Total Screens | 14 |
| Target Personas | All (Public) - 全ユーザー |
| Created | 2026-01-10 |

---

## Screen List

### 6.1 Home Pages (3)

| # | Screen | Category | Persona | Notes |
|:-:|--------|----------|---------|-------|
| 6-1 | Overview | Home | All | メイン統計ダッシュボード、TVL、トランザクション数 |
| 6-2 | Recent Locks | Home | All | 最近のLock一覧 |
| 6-3 | Recent Unlocks | Home | All | 最近のUnlock一覧 |

### 6.2 Search & List Pages (4)

| # | Screen | Category | Persona | Notes |
|:-:|--------|----------|---------|-------|
| 6-4 | Search | Search | All | アドレス/TX Hash/Lock ID検索 |
| 6-5 | Lock List | List | All | 全Lock一覧（フィルタ・ページネーション） |
| 6-6 | Unlock List | List | All | 全Unlock一覧（フィルタ・ページネーション） |
| 6-7 | Challenge List | List | All | 全Challenge一覧 |

### 6.3 Detail Pages (4)

| # | Screen | Category | Persona | Notes |
|:-:|--------|----------|---------|-------|
| 6-8 | Lock Detail | Detail | All | Lock詳細（ステータス、署名者、Time Lock情報） |
| 6-9 | Unlock Detail | Detail | All | Unlock詳細（Time Lock進捗、Prover署名） |
| 6-10 | Challenge Detail | Detail | All | Challenge詳細（証拠、判定結果） |
| 6-11 | Address Detail | Detail | All | アドレス別の履歴・残高 |

### 6.4 Prover Stats Pages (2)

| # | Screen | Category | Persona | Notes |
|:-:|--------|----------|---------|-------|
| 6-12 | Prover List | Prover | All | アクティブProver一覧、稼働率ランキング |
| 6-13 | Prover Detail | Prover | All | Prover詳細（署名数、報酬、Stake情報） |

### 6.5 Analytics Page (1)

| # | Screen | Category | Persona | Notes |
|:-:|--------|----------|---------|-------|
| 6-14 | Analytics Dashboard | Analytics | All | TVL推移、取引量、パフォーマンス指標 |

---

## Design Requirements

### Color Usage

```
┌─────────────────────────────────────────────────────────────────┐
│  EXPLORER COLOR SCHEME                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Primary Actions:   Hinomaru Red (#BC002D)                      │
│  Secondary:         Gold (#C9A962)                              │
│  Background:        Dark (#0A0A0C)                              │
│  Cards:             #111114                                     │
│                                                                 │
│  Status Colors:                                                 │
│  • Lock Active:     Gold (#C9A962)                              │
│  • Unlock Pending:  Pending (#8080A0)                           │
│  • Unlock Complete: Success (#00C896)                           │
│  • Challenge Open:  Warning (#F0A030)                           │
│  • Challenge Win:   Success (#00C896)                           │
│  • Challenge Fail:  Error (#E07040)                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Visual Elements

1. **リアルタイムフィード**
   - 最新トランザクションのライブ更新
   - スムーズなアニメーション遷移

2. **検索バー**
   - 画面上部に常時表示
   - Address / TX Hash / Lock ID 対応
   - オートコンプリート機能

3. **データテーブル**
   - ソート可能なカラム
   - ページネーション
   - フィルター機能

4. **チャート・グラフ**
   - TVL推移（エリアチャート）
   - 取引量（バーチャート）
   - Prover分布（パイチャート）

5. **ステータスバッジ**
   - 明確な色分け
   - アイコン併用
   - ツールチップで詳細説明

### Special Considerations

1. **CP-5 透明性準拠**
   - 全てオンチェーンで検証可能な情報のみ表示
   - トランザクションハッシュリンクでL1/L2検証可能
   - 隠蔽データなし

2. **パフォーマンス**
   - 大量データのページネーション必須
   - 無限スクロールは採用しない（明示的なページ遷移）
   - 画像・アイコンの最適化

3. **アクセシビリティ**
   - テーブルはスクリーンリーダー対応
   - 色だけに依存しないステータス表示（アイコン併用）
   - キーボードナビゲーション対応

4. **レスポンシブ対応**
   - モバイルではテーブルをカード形式に変換
   - 検索機能は全デバイスで使いやすく
   - チャートは画面サイズに応じて縮小

---

## Persona Details

### 全ペルソナ共通（Public Access）

Explorerは認証不要の公開システムのため、全てのペルソナが利用可能。

| ペルソナ | 主な利用目的 |
|----------|--------------|
| 田中さん (End User) | 自分のLock/Unlock状況確認 |
| 鈴木さん (Token Holder) | TVL推移、プロトコル健全性確認 |
| 渡辺さん (Delegate) | Governance関連トランザクション調査 |
| 山田さん (Prover) | 自社の署名履歴・報酬確認 |
| 中村さん (Observer) | 不審なトランザクション調査 |
| 佐藤さん (Enterprise) | 顧客サポート用の履歴確認 |

### UX要件（ペルソナ技術レベル考慮）

| 要件 | 対象 | 実装 |
|------|------|------|
| 専門用語ツールチップ | 田中さん（★★☆☆☆） | 「Dilithium署名」「Time Lock」等にヘルプアイコン |
| 高速検索 | 中村さん（★★★★★） | 部分一致、正規表現対応（Advanced Search） |
| データエクスポート | 佐藤さん（★★★★☆） | CSV/JSON ダウンロード機能 |
| リアルタイム更新 | 山田さん（★★★★★） | WebSocket による自動更新オプション |

---

## Information Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  EXPLORER SITEMAP                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  /explorer/                                                     │
│  ├── (Home) Overview                                           │
│  │   ├── Recent Locks                                          │
│  │   └── Recent Unlocks                                        │
│  │                                                             │
│  ├── /locks/                                                   │
│  │   ├── (List)                                                │
│  │   └── /[lock_id] (Detail)                                   │
│  │                                                             │
│  ├── /unlocks/                                                 │
│  │   ├── (List)                                                │
│  │   └── /[unlock_id] (Detail)                                 │
│  │                                                             │
│  ├── /challenges/                                              │
│  │   ├── (List)                                                │
│  │   └── /[challenge_id] (Detail)                              │
│  │                                                             │
│  ├── /address/                                                 │
│  │   └── /[address] (Detail)                                   │
│  │                                                             │
│  ├── /provers/                                                 │
│  │   ├── (List)                                                │
│  │   └── /[prover_id] (Detail)                                 │
│  │                                                             │
│  ├── /analytics/                                               │
│  │   └── (Dashboard: TVL, Volume, Performance)                 │
│  │                                                             │
│  └── /search?q=...                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Display Requirements

### Lock Detail 表示項目

| 項目 | 説明 | 必須 |
|------|------|:----:|
| Lock ID | 一意識別子 | ✅ |
| Owner Address | Dilithium公開鍵のハッシュ | ✅ |
| Amount | ロック金額（ETH） | ✅ |
| Lock Timestamp | ロック日時 | ✅ |
| L2 TX Hash | L2トランザクションハッシュ | ✅ |
| Status | Active / Unlocking / Unlocked | ✅ |
| Time Lock Remaining | 残り時間（Unlocking時） | ⬜ |

### Unlock Detail 表示項目

| 項目 | 説明 | 必須 |
|------|------|:----:|
| Unlock ID | 一意識別子 | ✅ |
| Lock ID | 関連するLock ID | ✅ |
| Request Type | Normal / Emergency | ✅ |
| Dilithium Signature | 署名ハッシュ（省略表示） | ✅ |
| Prover Signatures | 署名したProver一覧 | ✅ |
| Time Lock Start | Time Lock開始日時 | ✅ |
| Time Lock End | Time Lock終了日時 | ✅ |
| Status | Pending / Complete / Challenged | ✅ |
| L1 TX Hash | L1実行トランザクション | ⬜ |

### Challenge Detail 表示項目

| 項目 | 説明 | 必須 |
|------|------|:----:|
| Challenge ID | 一意識別子 | ✅ |
| Target Unlock ID | Challenge対象のUnlock | ✅ |
| Challenger Address | Challenger | ✅ |
| Bond Amount | 供託金額 | ✅ |
| Evidence Hash | 証拠データハッシュ | ✅ |
| Defense Deadline | Prover防御期限 | ✅ |
| Status | Open / Resolved (Win/Lose) | ✅ |
| Resolution TX | 解決トランザクション | ⬜ |

---

## Review Agents

| Agent | Role | Focus Area |
|-------|------|------------|
| CDO（佐々木さん） | Chief Design Officer | 情報設計、データ可視化の最適化 |
| Marketing（田村さん） | Marketing Lead | TVL等のマーケティング活用、ソーシャル共有機能 |
| Security（中村さん） | Security Researcher | 情報開示の適切性、攻撃ベクトルの排除 |

---

## Next Steps

1. → **09_design_create.md** でワイヤーフレーム・モック作成
2. 14画面のHTMLモック作成
3. DESIGN_MANIFEST.md 作成
4. PIRレビュー実施

---

**END OF DESIGN BRIEF**
