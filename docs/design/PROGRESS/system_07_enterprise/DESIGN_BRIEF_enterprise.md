# Design Brief: Enterprise Admin

## Overview

| Item | Value |
|------|-------|
| System | Enterprise Admin |
| System ID | 07 |
| Directory | system_07_enterprise |
| Priority | P1 |
| Total Screens | 25 |
| Target Personas | Service Provider (佐藤さん) |
| Created | 2026-01-10 |

---

## Screen List

### 1. Dashboard (4 screens)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 7-1 | Overview Dashboard | Dashboard | 佐藤さん | 全体概要、KPI表示 |
| 7-2 | TVL Dashboard | Dashboard | 佐藤さん | TVL推移、内訳 |
| 7-3 | Volume Dashboard | Dashboard | 佐藤さん | 取引量推移、分析 |
| 7-4 | Status Dashboard | Dashboard | 佐藤さん | システム稼働状況 |

### 2. Transactions (4 screens)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 7-5 | Transaction List | Transactions | 佐藤さん | フィルター、検索、ページネーション |
| 7-6 | Transaction Detail | Transactions | 佐藤さん | TX詳細、ステータス、証跡 |
| 7-7 | Transaction Export | Transactions | 佐藤さん | CSV/PDF出力、期間指定 |
| 7-8 | Transaction Analytics | Transactions | 佐藤さん | 傾向分析、チャート |

### 3. User Management (5 screens)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 7-9 | User List | User Management | 佐藤さん | チームメンバー一覧 |
| 7-10 | User Detail | User Management | 佐藤さん | 個別ユーザー詳細 |
| 7-11 | User Create | User Management | 佐藤さん | 新規ユーザー追加 |
| 7-12 | Role Management | User Management | 佐藤さん | 権限設定、ロール定義 |
| 7-13 | Invite User | User Management | 佐藤さん | 招待メール送信 |

### 4. API Management (4 screens)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 7-14 | API Keys | API Management | 佐藤さん | 発行済みキー一覧 |
| 7-15 | Create API Key | API Management | 佐藤さん | 新規キー発行 |
| 7-16 | API Usage | API Management | 佐藤さん | 使用量、レート制限 |
| 7-17 | Webhooks | API Management | 佐藤さん | Webhook設定、履歴 |

### 5. Settings (4 screens)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 7-18 | Organization Settings | Settings | 佐藤さん | 組織情報、ロゴ |
| 7-19 | Security Settings | Settings | 佐藤さん | 2FA、IP制限、監査ログ |
| 7-20 | Notification Settings | Settings | 佐藤さん | アラート設定 |
| 7-21 | Limit Settings | Settings | 佐藤さん | 取引上限、制限 |

### 6. Reports (3 screens)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 7-22 | Monthly Report | Reports | 佐藤さん | 月次レポート生成 |
| 7-23 | Compliance Report | Reports | 佐藤さん | 規制対応レポート |
| 7-24 | Audit Log | Reports | 佐藤さん | 監査証跡、全操作ログ |

### 7. Contract & Billing (3 screens - External)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| - | Contract Detail | Contract | 佐藤さん | 契約詳細（外部システム連携） |
| - | Billing History | Contract | 佐藤さん | 請求履歴（外部システム連携） |
| - | Payment Method | Contract | 佐藤さん | 支払い方法（外部システム連携） |

### 8. Support (1 screen)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 7-25 | Support Portal | Support | 佐藤さん | ドキュメント、チケット起票リンク |

> **Note**: Contract & Billing は外部システム（Stripe等）へのリンクとして実装。Support ticketsも外部システム（Zendesk等）連携。画面数としてはカウント外。

---

## Design Requirements

### Color Usage

| 用途 | 色 | 補足 |
|------|-----|------|
| Primary Actions | Hinomaru Red (#BC002D) | Submit, Save, Confirm |
| Secondary | Gold (#C9A962) | View, Details, Links |
| Background | Dark (#0A0A0C) | エンタープライズらしい重厚感 |
| Success | #00C896 | 成功、アクティブ状態 |
| Warning | #F0A030 | 注意、制限に近い状態 |
| Error | #E07040 | エラー（※赤は避ける） |

### Key Visual Elements

1. **エンタープライズ品質のUI**
   - 堅牢・信頼感のあるデザイン
   - データテーブルの視認性を重視
   - 長時間使用に適した目に優しい配色

2. **データ可視化**
   - KPIカード（TVL, Volume, TX Count）
   - チャート（折れ線、棒、円）
   - テーブル（ソート、フィルター、ページネーション）

3. **監査対応**
   - 全操作の監査ログ
   - PDF出力機能
   - タイムスタンプの明確な表示

4. **マルチユーザー対応**
   - 権限ベースのUI表示制御
   - ロール別アクセス制限
   - 招待フロー

### Component Candidates

| コンポーネント | 用途 |
|--------------|------|
| DataTable | Transaction List, User List, Audit Log |
| StatCard | KPI表示（TVL, Volume, Count） |
| LineChart | TVL推移、取引量推移 |
| PieChart | トランザクション内訳 |
| Modal | 確認ダイアログ、フォーム |
| Form | 設定変更、ユーザー作成 |
| Badge | ステータス表示、ロール表示 |
| Toast | 成功/エラー通知 |

### Special Considerations

1. **セキュリティUI**
   - API Keyの部分マスキング表示
   - 危険操作時の確認ダイアログ
   - 2FA設定の明確なガイド

2. **規制対応**
   - コンプライアンスレポート生成機能
   - 監査証跡の完全性
   - データエクスポートのフォーマット対応（CSV, PDF）

3. **パフォーマンス**
   - 大量データのページネーション
   - 仮想スクロール検討（大量ログ表示時）
   - チャートの遅延読み込み

4. **アクセシビリティ**
   - キーボードナビゲーション対応
   - テーブルのスクリーンリーダー対応
   - 十分なコントラスト比（AA以上）

---

## Persona Details

### Service Provider: 佐藤さん（38歳）

```
┌─────────────────────────────────────────────────────────────┐
│                        佐藤さん                              │
│                      取引所CTO                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  【基本情報】                                                │
│  • 年齢: 38歳                                               │
│  • 職業: 中規模暗号資産取引所のCTO                          │
│  • 居住地: 東京                                             │
│  • 技術レベル: ★★★★☆（高め）                              │
│                                                             │
│  【背景】                                                    │
│  • 複数チェーン対応を検討中                                 │
│  • 過去にブリッジ関連のセキュリティインシデント経験         │
│  • 規制当局から「将来のセキュリティ対策」への問い合わせ     │
│                                                             │
│  【ニーズ】                                                  │
│  • 安全なクロスチェーンブリッジ                             │
│  • 規制対応の証跡                                           │
│  • SLAと専用サポート                                        │
│  • 自社ブランドでの提供（ホワイトラベル）                   │
│  • API統合のしやすさ                                        │
│                                                             │
│  【懸念】                                                    │
│  • 「コストはどのくらい？」                                 │
│  • 「導入にどのくらいかかる？」                             │
│  • 「問題発生時のサポート体制は？」                         │
│  • 「規制当局への説明に使える資料はある？」                 │
│                                                             │
│  【利用デバイス】                                            │
│  • PC 80%（管理、分析）                                     │
│  • スマホ 20%（ダッシュボード確認）                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key UX Considerations for 佐藤さん

| 考慮点 | 対応 |
|--------|------|
| 技術レベル高め | 詳細なデータ表示OK、簡略化不要 |
| 規制対応重視 | レポート・エクスポート機能を目立たせる |
| 長時間使用 | 目に優しい配色、情報整理されたレイアウト |
| チーム管理 | 権限管理UIを直感的に |
| API統合 | 開発者フレンドリーなドキュメントリンク |

---

## User Journey Reference

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       Service Provider ジャーニー                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  認知 → 問い合わせ → 契約 → オンボーディング → 運用 → 解約                     │
│                                                                                 │
│  オンボーディング:                                                              │
│  • 管理者アカウント作成                                                        │
│  • 2FA設定                                                                     │
│  • API統合ガイド確認                                                           │
│  • テスト環境での検証                                                          │
│  • 本番環境切替                                                                │
│                                                                                 │
│  運用:                                                                          │
│  • ダッシュボードでTX監視                                                      │
│  • レポート生成                                                                │
│  • チーム管理（権限設定）                                                      │
│  • サポートチケット                                                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Principles Alignment

| 原則 | 関連要件 |
|------|---------|
| CP-1 (量子耐性) | 量子耐性ステータス表示、セキュリティダッシュボード |
| CP-2 (Self-Custody) | ユーザー資産はユーザー管理（Enterprise経由でも） |
| CP-3 (Time Lock) | Time Lock状況の可視化 |
| CP-4 (Slashing) | Prover状況の表示（参照のみ） |
| CP-5 (透明性) | 監査ログ、全TX可視化 |

---

## Review Agents

| Agent | Focus |
|-------|-------|
| CDO（佐々木さん） | エンタープライズ品質、デザインの一貫性 |
| Legal（西村さん） | コンプライアンス対応、必要な免責事項 |
| 佐藤さん | CTO視点、運用効率、実用性 |

---

## Screen Priority for Mocks

### Phase 1 (Core)
1. Overview Dashboard (7-1)
2. Transaction List (7-5)
3. User List (7-9)
4. API Keys (7-14)

### Phase 2 (Detail)
5. Transaction Detail (7-6)
6. User Detail (7-10)
7. Security Settings (7-19)
8. Audit Log (7-24)

### Phase 3 (Remaining)
9-25. その他全画面

---

## Next Steps

1. **Next Phase**: `09_design_create.md` でワイヤーフレーム・HTMLモック作成
2. **Output Expected**:
   - `DESIGN_MANIFEST.md`
   - `wip/mocks/*.html`
3. **Review**: PIR（Pre-Implementation Review）後に実装フェーズへ

---

**END OF DESIGN BRIEF**
