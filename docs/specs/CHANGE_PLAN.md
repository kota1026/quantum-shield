# アプリ変更計画 v3.1

> **作成日**: 2026-01-24
> **更新日**: 2026-01-24
> **目的**: 設計書（APP_DESIGN_SPECS.md v3.1）と現状URL（URL_REFERENCE.md）を比較し、変更計画を策定
> **参照**: [APP_DESIGN_SPECS.md](./APP_DESIGN_SPECS.md), [URL_REFERENCE.md](./URL_REFERENCE.md)
> **変更履歴**:
> - v2.0: Token Hub + Governance → QS Hub 統合
> - v3.0: Enterprise = 技術譲渡先企業モデル、QS Admin = ライセンサー業務追加
> - **v3.1**: ペルソナフィードバック反映、11体エージェント会議決定事項反映

---

## エグゼクティブサマリー

| アプリ | 現状画面数 | 設計画面数 | 変更方針 | 優先度 |
|--------|:----------:|:----------:|----------|:------:|
| **QS Hub** | 22 (Token Hub 16 + Governance 6) | **12** | **統合・簡素化** | 中 |
| Prover Portal | 9 | 9 | 名称変更・機能追加 | 高 |
| Observer | 7 | 9 | 機能追加 | 高 |
| **Enterprise** | 33 | **14** | **自社版QS Admin化 + ペルソナFB** | 中 |
| **QS Admin** | 61 | **17** | ライセンサー業務 + License Suspension | 中 |
| Explorer | 9 | 6 | 画面統合 | 低 |

**v3.1 重要な変更:**
- Token Hub + Governance → **QS Hub** に統合（戦略会議 8-0-3 可決）
- **Enterprise = 技術譲渡先企業**（自社でQS実装を運営）
- **Enterprise Admin v3.1**: ペルソナフィードバック反映（+2画面: Prover Calendar, Support）
- **QS Admin v3.1**: Licensee Support + License Suspension 追加（+1画面）
- **ライセンス条件追加**: Explorer公開義務、監査レポート提出義務、デザインシステム準拠義務

---

## 1. QS Hub 変更計画（Token Hub + Governance 統合）

> **戦略会議決定**: 2026-01-24 賛成8 / 中立3 / 反対0 で可決
> **根拠**: DeFi業界標準（Frax Finance, Curve Finance）、veQSの一元管理

### 1.1 統合概要

```
【統合前】
Token Hub (16画面) + Governance (6画面) = 22画面

【統合後】
QS Hub (12画面)
├── Landing
├── Login
├── Dashboard（統合ダッシュボード）
├── Stake セクション
│   ├── Lock
│   ├── Extend
│   └── Unlock
├── Vote セクション
│   ├── Proposals
│   ├── Proposal Detail
│   ├── Create Proposal
│   ├── Delegates
│   └── My Votes
├── Council
├── Rewards
└── Settings

削減: 22 → 12 画面（-10画面）
```

### 1.2 現状 → 設計 比較

| 現状URL | 新URL | アクション |
|---------|-------|-----------|
| `/token-hub/landing` | `/qs-hub/landing` | **移行** |
| `/token-hub/dashboard` | `/qs-hub/dashboard` | **統合** |
| `/token-hub/stake` | `/qs-hub/stake/lock` | **移行・名称変更** |
| `/token-hub/stake/confirm` | - | **統合** |
| `/token-hub/unstake` | `/qs-hub/stake/unlock` | **移行・名称変更** |
| `/token-hub/rewards` | `/qs-hub/rewards` | **移行** |
| `/token-hub/delegate` | `/qs-hub/vote/delegates` | **移行** |
| `/token-hub/governance-power` | `/qs-hub/dashboard` | **統合** |
| `/token-hub/history` | `/qs-hub/dashboard` | **統合** |
| `/token-hub/analytics` | - | **削除**（Explorer参照） |
| `/token-hub/settings` | `/qs-hub/settings` | **移行** |
| `/governance/landing` | `/qs-hub/landing` | **統合** |
| `/governance/proposals` | `/qs-hub/vote/proposals` | **移行** |
| `/governance/proposals/[id]` | `/qs-hub/vote/proposals/[id]` | **移行** |
| `/governance/proposals/create` | `/qs-hub/vote/proposals/create` | **移行** |
| `/governance/delegates` | `/qs-hub/vote/delegates` | **移行** |
| `/governance/my-votes` | `/qs-hub/vote/history` | **移行** |
| - | `/qs-hub/stake/extend` | **新規追加** |
| - | `/qs-hub/council` | **新規追加** |

### 1.3 変更タスク

| # | タスク | 詳細 | 工数(h) |
|---|--------|------|:-------:|
| 1 | ディレクトリ構造変更 | `/token-hub/` + `/governance/` → `/qs-hub/` | 4 |
| 2 | Landing統合 | 2つのLandingを1つに | 4 |
| 3 | Login統合 | RainbowKit接続画面 | 2 |
| 4 | Dashboard統合 | veQS残高 + 提案数 + 報酬を1画面に | 8 |
| 5 | Stake → Lock/Extend/Unlock | URLとコンポーネント | 6 |
| 6 | Extend画面追加 | 期間延長機能 | 6 |
| 7 | Vote セクション整理 | Proposals/Detail/Create/Delegates/History | 4 |
| 8 | Council画面追加 | Security Council/Purpose Committee | 6 |
| 9 | Rewards画面移行 | 報酬管理 | 2 |
| 10 | Settings統合 | 通知 + 委任設定 | 3 |
| 11 | リダイレクト設定 | 旧URL → 新URL | 2 |
| 12 | 翻訳キー更新 | tokenHub + governance → qsHub | 4 |
| 13 | フィッシング対策UI | 公式URL明示（会議条件） | 2 |
| 14 | サブナビゲーション設計 | Stake/Vote/Council/Rewards（会議条件） | 3 |
| **合計** | | | **56h** |

### 1.4 削減効果

```
工数比較:
- v1.0計画: Token Hub 27h + Governance 19h = 46h
- v2.0計画: QS Hub 56h（+10h）

ただし:
- 画面数削減: 22 → 12（-10画面）
- 長期保守コスト削減（重複排除）
- ユーザー体験向上
```

---

## 2. Prover Portal 変更計画

### 2.1 現状 → 設計 比較

| 現状URL | 設計画面 | アクション |
|---------|----------|-----------|
| `/prover/landing` | Landing | 維持 |
| - | Login | **追加** |
| `/prover/register` | Application | **拡張**（5ステップ化） |
| `/prover/dashboard` | Dashboard | 維持 |
| `/prover/node-setup` | - | Application Step 2統合 |
| `/prover/signatures` | Queue | **名称変更** |
| `/prover/earnings` | Rewards | **名称変更** |
| `/prover/stake` | - | Application Step 4統合 |
| `/prover/settings` | Settings | 維持 |
| `/prover/alerts` | - | Settings統合 |
| - | Exit | **追加** |

### 2.2 変更タスク

| # | タスク | 詳細 | 工数(h) |
|---|--------|------|:-------:|
| 1 | Login画面追加 | RainbowKit + 登録確認 | 4 |
| 2 | Application 5ステップ化 | 既存Register拡張 | 12 |
| 3 | Signatures → Queue名称変更 | URL・コンポーネント | 2 |
| 4 | Earnings → Rewards名称変更 | URL・コンポーネント | 2 |
| 5 | Node Setup/StakeをApplication統合 | コンポーネント移動 | 4 |
| 6 | AlertsをSettings統合 | コンポーネント移動 | 2 |
| 7 | Exit画面追加 | 退出申請機能 | 6 |
| 8 | SLA表示追加 | Dashboard/Queue | 4 |
| 9 | Slashing条件表示追加 | Settings/Exit | 2 |
| **合計** | | | **38h** |

---

## 3. Observer 変更計画

### 3.1 現状 → 設計 比較

| 現状URL | 設計画面 | アクション |
|---------|----------|-----------|
| `/observer/landing` | Landing | 維持 |
| - | Login | **追加** |
| - | Registration | **追加** |
| `/observer/dashboard` | Dashboard | 維持 |
| `/observer/pending` | - | Unlocks統合 |
| `/observer/suspicious` | Unlocks | **名称変更・拡張** |
| - | Challenge | **追加** |
| - | Challenges | **追加** |
| `/observer/history` | - | Challenges統合 |
| `/observer/earnings` | Rewards | **名称変更** |
| `/observer/settings` | Settings | 維持 |

### 3.2 変更タスク

| # | タスク | 詳細 | 工数(h) |
|---|--------|------|:-------:|
| 1 | Login画面追加 | RainbowKit + 登録確認 | 4 |
| 2 | Registration画面追加 | Stake登録 | 4 |
| 3 | Suspicious → Unlocks拡張 | フィルター追加 | 4 |
| 4 | Pending/HistoryをUnlocks/Challenges統合 | コンポーネント移動 | 4 |
| 5 | Challenge画面追加 | Challenge提出フォーム | 8 |
| 6 | Challenges画面追加 | Challenge履歴一覧 | 6 |
| 7 | Earnings → Rewards名称変更 | URL・コンポーネント | 2 |
| 8 | 判定基準表示追加 | Unlocks画面 | 4 |
| 9 | 誤検知説明追加 | Challenge画面 | 2 |
| 10 | 練習モード追加 | 会議決定事項 | 8 |
| **合計** | | | **46h** |

---

## 4. Enterprise 変更計画 ⚠️ v3.1 大幅変更

> **v3.0 重要変更**: Enterprise = 技術譲渡先企業、Enterprise Admin = 自社版 QS Admin
> 技術譲渡先が自社でQuantum Shield実装を運営し、QS財団は保守料を受け取る
> **v3.1 追加変更**: ペルソナフィードバック反映、11体エージェント会議決定事項反映

### 4.1 ビジネスモデル変更

```
【変更前 v1.0】ホワイトリスト管理型
- Enterprise顧客がホワイトリストを「管理」するイメージ
- 混乱を招く表現

【変更 v2.0】承認済パートナー向け監視サービス
- Enterprise顧客はQSに「承認された」パートナー
- 「Whitelist」→「Watchlist」に名称変更

【変更後 v3.0】技術譲渡先向け自社版QS Admin  ← 最新
- Enterprise = QS財団から技術ライセンスを受けた企業
- 技術譲渡先が自社でQuantum Shield実装を運営
- QS財団は保守料を受け取る立場
- Enterprise Admin = QS Adminの機能を自社スコープで提供
- 自社Prover、自社Observer、自社Consumer Appを管理
```

### 4.2 v3.0 コンセプト図

```
┌─────────────────────────────────────────────────────────────────┐
│  【v3.0 技術譲渡モデル】                                         │
│                                                                 │
│  [QS財団]                                                        │
│       │                                                         │
│       │ 技術ライセンス提供                                       │
│       │ 保守サポート提供                                         │
│       │                                                         │
│       ▼                                                         │
│  [技術譲渡先企業]  例: 大手取引所、金融機関                      │
│       │                                                         │
│       │ 自社で運営:                                              │
│       │ - 自社Proverノード                                       │
│       │ - 自社Observerノード                                     │
│       │ - 自社Consumer App                                       │
│       │                                                         │
│       ▼                                                         │
│  [Enterprise Admin]  = 自社版 QS Admin（自社スコープ限定）       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 現状 → 設計 比較（v3.0）

| 現状URL | 新URL | アクション |
|---------|-------|-----------|
| `/enterprise/landing` | - | **削除**（技術譲渡先は内部認証） |
| - | `/enterprise/login` | **追加**（内部認証） |
| `/enterprise/dashboard` | `/enterprise/dashboard` | **再設計** |
| `/enterprise/users/*` | `/enterprise/users` | **統計画面に変更** |
| `/enterprise/transactions/*` | - | **削除**（Monitoring統合） |
| `/enterprise/team/*` | `/enterprise/team` | 維持 |
| `/enterprise/api-keys/*` | - | **削除** |
| `/enterprise/webhooks/*` | `/enterprise/settings` | Settings統合 |
| `/enterprise/billing/*` | - | **削除**（QS Adminで管理） |
| `/enterprise/invoices/*` | - | **削除**（QS Adminで管理） |
| `/enterprise/reports/*` | - | **削除**（Monitoring統合） |
| `/enterprise/audit-log` | `/enterprise/audit-log` | 維持 |
| `/enterprise/settings` | `/enterprise/settings` | **拡張** |
| `/enterprise/provers` | `/enterprise/provers` | **復活・拡張**（自社Prover管理） |
| - | `/enterprise/provers/[id]` | **新規追加** |
| - | `/enterprise/observers` | **新規追加**（自社Observer管理） |
| - | `/enterprise/monitoring` | **新規追加**（自社環境監視） |
| - | `/enterprise/parameters` | **新規追加**（自社パラメータ管理） |
| - | `/enterprise/emergency` | **新規追加**（自社緊急停止） |

### 4.4 変更タスク（v3.1）

| # | タスク | 詳細 | 工数(h) |
|---|--------|------|:-------:|
| 1 | Login画面追加 | 内部認証 | 4 |
| 2 | Dashboard再設計（v3.1拡張） | 6KPI + 環境セレクター + キーボードショートカット | 12 |
| 3 | **Provers画面追加** | 自社Prover登録・監視・メンテナンス | 12 |
| 4 | **Prover Detail追加** | 自社Prover詳細・メトリクス | 6 |
| 5 | **Prover Calendar追加** ← v3.1 | メンテナンススケジュール管理 | 8 |
| 6 | **Observers画面追加** | 自社Observer一覧・アラート | 8 |
| 7 | **Monitoring画面追加** | 自社環境リアルタイム監視 | 10 |
| 8 | **Users統計画面追加** | 自社ユーザー利用状況レポート | 6 |
| 9 | **Parameters画面追加** | 自社パラメータ一覧・変更 | 4 |
| 10 | **Emergency画面追加** | 自社環境緊急停止 | 6 |
| 11 | Team画面維持 | 自社管理者権限管理 | 2 |
| 12 | Audit Log拡張（v3.1） | 高度な検索 + 検索条件保存機能 | 6 |
| 13 | **Support画面追加** ← v3.1 | QS財団への保守チケット管理 | 6 |
| 14 | Settings拡張（v3.1） | 6タブ（+環境管理、+開発者、+監査レポート） | 8 |
| 15 | キーボードショートカット実装 ← v3.1 | グローバルショートカット（g/p/o/m/s等） | 4 |
| 16 | 環境切り替え機能 ← v3.1 | 本番/ステージング/テスト環境対応 | 6 |
| 17 | PDF/CSVエクスポート機能 ← v3.1 | 全画面対応 | 4 |
| 18 | Landing/報告関連削除 | 不要画面削除 | 2 |
| 19 | 翻訳キー整理 | 自社版QS Admin用語 | 4 |
| **合計** | | | **118h** |

### 4.5 v3.1 ペルソナフィードバック反映内容

| # | 佐藤さん（技術譲渡先CTO）のフィードバック | 対応 |
|---|------------------------------------------|------|
| 1 | Dashboard情報密度が低い | 6KPI + ミニグラフ + 前日比/前週比 |
| 2 | PDF/CSVエクスポートが不十分 | 全画面でエクスポート対応 |
| 3 | アラート優先度が不明確 | 優先度バッジ強化 + モバイルプッシュ |
| 4 | Proverメンテナンスカレンダーがない | Prover Calendar画面追加 |
| 5 | 監査ログ検索が弱い | 高度な検索 + 保存機能 |
| 6 | QS財団サポート導線が弱い | Support画面追加 |
| 7 | マルチ環境対応がない | 環境セレクター + カラーバー |
| 8 | キーボードショートカットがない | グローバルショートカット実装 |
| 9 | 比較機能がない | Phase 2へ延期 |
| 10 | APIドキュメントリンクがない | Settingsに開発者タブ追加 |

### 4.6 削除対象URL一覧（v3.0）

```
/enterprise/landing           ← 内部認証のため不要
/enterprise/transactions/*    ← Monitoring統合
/enterprise/api-keys/*        ← 不要
/enterprise/billing/*         ← QS Adminで管理
/enterprise/invoices/*        ← QS Adminで管理
/enterprise/reports/*         ← Monitoring統合
/enterprise/apply/*           ← 技術ライセンス契約で不要
/enterprise/contract          ← QS Adminで管理
/enterprise/onboarding        ← 技術ライセンス契約で不要
/enterprise/approvals         ← 自社内で完結
/enterprise/status            ← Dashboard統合
/enterprise/sla               ← Settings統合
/enterprise/support           ← 保守連絡先に変更
/enterprise/tvl               ← Monitoring統合
/enterprise/watchlist         ← v2.0で追加したが、v3.0で不要
```

### 4.7 v3.1 重要ポイント

**v3.0 ポイント（継続）:**
1. **Enterprise Admin = 自社版 QS Admin**: 基本的にQS Adminと同等機能（自社スコープ限定）
2. **自社インフラ**: データはQS財団ではなく技術譲渡先のインフラに保存
3. **ブランディング**: 自社ブランドでサービス提供可能（"Powered by Quantum Shield"表記必須）
4. **保守連携**: QS財団への保守問い合わせ機能を統合

**v3.1 追加ポイント（11体エージェント会議決定）:**
5. **ライセンス条件（11体エージェント会議決定）**:
   - Explorer公開義務（中村さん提案）
   - 監査レポート提出義務（Legal/Complianceエージェント提案）
   - Premium Japanデザインシステム準拠義務（CDOエージェント条件）
6. **キーボードショートカット**: パワーユーザー向けVim風ナビゲーション
7. **マルチ環境対応**: 本番/ステージング/テスト環境の切り替えと視覚的区別

---

## 5. QS Admin 変更計画 ⚠️ v3.1 大幅変更

> **v3.0 重要変更**: QS Admin = パブリック版運営 + **ライセンサー業務**
> 技術譲渡先企業（Licensee）の管理、保守サポート、収益管理を追加
> **v3.1 追加変更**: Licensee Support + License Suspension 機能（11体エージェント会議決定）

### 5.1 v3.0 デュアルロール

```
【QS Admin v3.0 役割】
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [パブリック版QS運営]（従来機能）                                │
│  ├── Prover承認・管理                                           │
│  ├── プロトコル監視（TVL、TX）                                  │
│  ├── Challenge対応                                              │
│  ├── Emergency Pause                                            │
│  └── パラメータ管理                                             │
│                                                                 │
│  [ライセンサー業務]（v3.0 追加）                                 │
│  ├── Licensee管理（技術譲渡先企業）                             │
│  ├── ライセンス管理（契約、更新、終了）                         │
│  ├── 保守チケット対応                                           │
│  ├── アップデート配信                                           │
│  └── 保守料収益管理                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 現状 → 設計 比較（v3.1）

現状61画面 → 設計**17画面**（従来11画面 + ライセンサー6画面）

**維持する機能カテゴリ（パブリック版運営）**:
- Dashboard（1画面）- KPI統合（パブリック + ライセンス）
- Prover管理（2画面: 一覧、詳細）
- Monitoring（1画面）
- Challenges（1画面）
- Parameters（1画面）
- Emergency（1画面）
- Audit Log（1画面）
- Team（1画面）
- Login（1画面）

**新規追加（ライセンサー業務）**:
- **Licensees**（1画面）- 技術譲渡先企業一覧 + **License Suspension機能** ← v3.1
- **Licensee Detail**（1画面）- 契約情報、技術譲渡状況
- **Licensee Support**（1画面）← **v3.1追加** - 各Licenseeへの専用サポートビュー
- **Support Tickets**（1画面）- 保守チケット管理
- **Updates**（1画面）- アップデート配信管理
- **Billing**（1画面）- 保守料収益管理

**削除する機能カテゴリ**:
- 詳細なユーザー管理（→ 各アプリで管理）
- トークン保有者/デリゲート詳細（→ Explorer参照）
- トレジャリー詳細管理（→ 別システム）
- SaaS管理全般（→ v2.0 Watchlistモデルで追加したが、v3.0で不要）
- 詳細な設定画面（→ 必要なもののみ維持）

### 5.3 変更タスク（v3.1）

| # | タスク | 詳細 | 工数(h) |
|---|--------|------|:-------:|
| **パブリック版運営** |
| 1 | 画面削除（45画面） | URLルート削除 | 6 |
| 2 | Dashboard再設計 | 統合KPI（パブリック + ライセンス） | 10 |
| 3 | Prover管理簡素化 | 承認ワークフロー | 8 |
| 4 | Monitoring簡素化 | アラート優先度 | 6 |
| 5 | 多重署名機能追加 | Security Council承認 | 12 |
| **ライセンサー業務** |
| 6 | **Licensees画面追加** | 技術譲渡先一覧、契約状態 | 10 |
| 7 | **License Suspension機能** ← v3.1 | 緊急時ライセンス停止（Security Council承認） | 8 |
| 8 | **Licensee Detail追加** | 契約詳細、技術譲渡状況 | 8 |
| 9 | **Licensee Support追加** ← v3.1 | Licensee専用サポートビュー（高橋さん提案） | 6 |
| 10 | **Support Tickets追加** | チケット管理、担当アサイン | 10 |
| 11 | **Updates画面追加** | アップデート配信、適用状況 | 8 |
| 12 | **Billing画面追加** | 保守料収益、請求管理 | 8 |
| **共通** |
| 13 | Team画面追加 | 管理者ロール（Support追加） | 4 |
| 14 | 翻訳キー整理 | 削除 + ライセンサー用語追加 | 6 |
| **合計** | | | **110h** |

### 5.4 v3.1 11体エージェント会議決定事項

| # | 会議決定事項 | 提案者 | 対応 |
|---|-------------|--------|------|
| 1 | Licensee Support ビュー追加 | 高橋さん（QS Admin担当） | Licensee Support画面追加 |
| 2 | License Suspension 機能追加 | 伊藤さん（Security Council） | Licensees画面に停止機能追加 |
| 3 | Explorer公開義務のライセンス条件化 | 中村さん（Purpose Committee） | ライセンス条件に追加 |
| 4 | 監査レポート提出機能 | Legal/Complianceエージェント | Enterprise Settings に追加 |
| 5 | デザインシステム準拠義務 | CDOエージェント | ライセンス条件に追加 |

### 5.5 削除対象URL一覧（抜粋）

```
/admin/public/users/stats
/admin/public/holders
/admin/public/delegates
/admin/public/voting-power
/admin/public/governance/*
/admin/public/treasury/*
/admin/saas/* (全て) ← v2.0 Watchlistモデルで追加したが、v3.0で削除
/admin/license/* (全て) ← v3.0で Licensees に置換
/admin/settings/members ← Team に移動
/admin/settings/roles ← Team に移動
/admin/settings/security
/admin/settings/system

# v2.0で追加したEnterprise管理（v3.0で Licensees に置換）
/admin/enterprises/* → /admin/licensees/*
```

### 5.6 新規URL一覧（v3.1）

```
/admin/licensees                  ← 技術譲渡先企業一覧 + License Suspension機能
/admin/licensees/[id]             ← 技術譲渡先詳細
/admin/licensees/[id]/support     ← Licensee専用サポートビュー（v3.1追加）
/admin/support                    ← 保守チケット一覧
/admin/support/[id]               ← チケット詳細
/admin/updates                    ← アップデート配信管理
/admin/billing                    ← 保守料収益管理
/admin/team                       ← チーム管理（新規独立）
```

### 5.7 ライセンスタイプ（v3.0）

```
[Standard License]
- Consumer App + Prover (3ノード) + Observer (1ノード)
- 標準保守（営業時間内）

[Enterprise License]
- Consumer App + Prover (無制限) + Observer (無制限)
- 24/7保守、カスタマイズサポート

[Premium License]
- Enterprise全機能 + 専任担当者 + オンサイトサポート
```

### 5.8 保守SLA

```
[Critical] 初回1h / 解決4h
[High] 初回4h / 解決24h
[Normal] 初回1営業日 / 解決5営業日
```

---

## 6. Explorer 変更計画

### 6.1 現状 → 設計 比較

| 現状URL | 設計画面 | アクション |
|---------|----------|-----------|
| `/explorer/landing` | - | **Dashboard統合** |
| `/explorer/overview` | Dashboard | **名称変更** |
| `/explorer/locks` | Transactions | **統合** |
| `/explorer/locks/[id]` | Transaction Detail | **統合** |
| `/explorer/unlocks` | Transactions | **統合** |
| `/explorer/unlocks/[id]` | Transaction Detail | **統合** |
| `/explorer/challenges` | - | **維持**（設計に追加推奨） |
| `/explorer/provers` | Provers | 維持 |
| `/explorer/analytics` | - | Dashboard統合 |
| - | Prover Detail | **追加** |
| - | Glossary | **追加** |

### 6.2 変更タスク

| # | タスク | 詳細 | 工数(h) |
|---|--------|------|:-------:|
| 1 | Landing → Dashboard統合 | リダイレクト | 1 |
| 2 | Overview → Dashboard名称変更 | URL変更 | 2 |
| 3 | Locks/UnlocksをTransactions統合 | フィルター追加 | 6 |
| 4 | Prover Detail追加 | 詳細画面 | 4 |
| 5 | Glossary追加 | 用語集ページ | 6 |
| 6 | 期間選択追加 | チャートフィルター | 3 |
| 7 | Analytics → Dashboard統合 | コンポーネント移動 | 2 |
| **合計** | | | **24h** |

### 6.3 設計書更新

設計書にChallenges画面を追加（既存画面として維持）

---

## 全体工数サマリー（v3.1）

| アプリ | 工数(h) | 優先度 | フェーズ | 備考 |
|--------|:-------:|:------:|:--------:|------|
| Prover Portal | 38 | 高 | Phase 6.1 | |
| Observer | 46 | 高 | Phase 6.1 | |
| **Enterprise** | **118** | 中 | Phase 6.2 | **v3.1**: ペルソナFB + 会議決定事項 |
| **QS Hub** | **56** | 中 | Phase 6.2 | Token Hub + Governance 統合 |
| **QS Admin** | **110** | 中 | Phase 6.2 | **v3.1**: Licensee Support + Suspension |
| Explorer | 24 | 低 | Phase 6.3 | |
| **合計** | **392h** | | | **v3.1 合計** |

### 工数変更の内訳

```
v1.0 → v2.0 → v3.0 → v3.1 変更:

QS Hub:
- v1.0: Token Hub 27h + Governance 19h = 46h
- v2.0: QS Hub 56h
- v3.0/v3.1: 変更なし 56h
- 差分: +10h（統合作業、サブナビ設計、フィッシング対策）

Enterprise:
- v1.0: 50h
- v2.0: 66h（Watchlistモデル）
- v3.0: 78h（自社版QS Adminモデル）
- v3.1: 118h（ペルソナフィードバック + 11体会議決定）
- v3.0→v3.1差分: +40h（Prover Calendar、Support、キーボードショートカット、
                     マルチ環境対応、高度な検索、PDF/CSVエクスポート）

QS Admin:
- v1.0: 58h
- v2.0: 58h
- v3.0: 96h（ライセンサー業務追加）
- v3.1: 110h（Licensee Support + License Suspension）
- v3.0→v3.1差分: +14h（Licensee Support画面、License Suspension機能）

v3.0 → v3.1 合計増加: +54h
v1.0 → v3.1 総増加: +104h

v3.1 のメリット:
- ビジネスモデルの明確化（技術譲渡 + 保守料収益）
- Enterprise顧客の自律運用が可能
- QS財団の収益源多様化
- 明確な責任分界点
- ペルソナ（佐藤さん）の実務ニーズを反映した機能
- 11体エージェント会議による品質保証・ガバナンス強化
```

---

## 実装順序（v3.1）

### Phase 6.1 (優先: 高)
1. **Prover Portal** - 登録フロー・SLA表示が最重要
2. **Observer** - Challenge機能・練習モードが最重要

### Phase 6.2 (優先: 中)
3. **QS Hub** - Token Hub + Governance 統合（戦略会議可決済み）
4. **QS Admin** - ライセンサー業務追加（技術譲渡先管理の基盤）
5. **Enterprise** - 自社版QS Admin化（QS Admin完成後に着手）

### Phase 6.3 (優先: 低)
6. **Explorer** - 画面統合、用語集追加

> **依存関係**: Enterprise Admin は QS Admin の機能サブセットのため、
> QS Admin 完成後に Enterprise を実装することで効率化

---

## リスクと対策（v3.1）

| リスク | 影響度 | 対策 |
|--------|:------:|------|
| **技術譲渡先への移行サポート** | 高 | 詳細なドキュメント、専任サポート担当 |
| **ライセンサー業務の立ち上げ** | 高 | 段階的リリース、サポートSLA策定 |
| Enterprise自社運用の技術難度 | 中 | トレーニングプログラム、24/7サポート（Premium） |
| QS Hub統合によるユーザー混乱 | 中 | 旧URL→新URLリダイレクト、告知期間設定 |
| 保守チケット対応リソース不足 | 中 | サポートチーム増強、自動化ツール導入 |
| URL変更によるブックマーク無効化 | 低 | リダイレクト設定 |
| 翻訳キー削除漏れ | 低 | 自動検出スクリプト作成 |

---

## 戦略会議決定事項

| 議題 | 結果 | 条件 |
|------|:----:|------|
| Token Hub + Governance → QS Hub 統合 | ✅ 可決 (8-0-3) | サブナビ設計精緻化、フィッシング対策強化 |
| Enterprise ビジネスモデル修正 v2.0 | ✅ 可決 (9-0-2) | GDPRポリシー明記、API Key保護機能 |
| **Enterprise 技術譲渡モデル v3.0** | ✅ 採用 | 自社版QS Admin化、ライセンサー業務追加 |
| **Enterprise v3.1 ペルソナFB + 11体会議** | ✅ 可決 (11-0-0) | Explorer公開義務、監査レポート提出、デザインシステム準拠、License Suspension |

---

## 更新履歴

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-24 | CTOエージェント | 初版作成 |
| 2026-01-24 | CTOエージェント | **v2.0**: Token Hub + Governance → QS Hub 統合、Enterprise Watchlistモデル変更、工数再計算 |
| 2026-01-24 | CTOエージェント | **v3.0**: Enterprise = 技術譲渡先企業（自社版QS Admin）、QS Admin = ライセンサー業務追加、工数再計算 |
| 2026-01-24 | CTOエージェント | **v3.1**: ペルソナフィードバック反映（Enterprise +40h）、11体エージェント会議決定事項反映（License Suspension、Licensee Support等）、工数再計算（合計392h） |
