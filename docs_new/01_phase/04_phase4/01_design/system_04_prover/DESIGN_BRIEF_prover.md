# Design Brief: Prover Portal

<<<<<<< HEAD
## Overview

| 項目 | 値 |
|------|-----|
=======
> **Version**: 1.0
> **Created**: 2026-01-12
> **Phase**: 08_design_prep
> **Next**: 09_design_create.md

---

## Overview

| Item | Value |
|------|-------|
>>>>>>> origin/claude/implement-task-p5-025-vAWqS
| System | Prover Portal |
| System ID | 04 |
| Directory | system_04_prover |
| Priority | P0 |
| Total Screens | 28 |
<<<<<<< HEAD
| Target Personas | 山田さん（Prover） |
| Created | 2026-01-10 |
=======
| Target Persona | 山田さん（Prover） |
>>>>>>> origin/claude/implement-task-p5-025-vAWqS

---

## Screen List

<<<<<<< HEAD
### 4.1 Public Pages (5)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 4-1 | Prover LP | Public | 山田さん | 収益機会・要件概要・信頼性訴求 |
| 4-2 | Requirements | Public | 山田さん | 技術要件（HSM, SLA, Stake）詳細 |
| 4-3 | Economics | Public | 山田さん | 報酬モデル・Slashing説明 |
| 4-4 | ROI Calculator | Public | 山田さん | 収益シミュレーター |
| 4-5 | Risk Simulator | Public | 山田さん | Quadratic Slashingリスク計算 |

### 4.2 Registration (7)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 4-6 | Application Step 1 | Registration | 山田さん | 基本情報入力 |
| 4-7 | Application Step 2 | Registration | 山田さん | 技術要件確認 |
| 4-8 | Application Step 3 | Registration | 山田さん | 法的同意・KYB |
| 4-9 | Application Step 4 | Registration | 山田さん | 最終確認・提出 |
| 4-10 | Submitted | Registration | 山田さん | 申請完了確認 |
| 4-11 | Status Check | Registration | 山田さん | 審査状況確認 |
| 4-12 | Questions | Registration | 山田さん | 追加質問対応 |

### 4.3 Activation (4)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 4-13 | Approval Notice | Activation | 山田さん | 承認通知 |
| 4-14 | Stake Deposit | Activation | 山田さん | $400K Stake入金 |
| 4-15 | SPHINCS+ Key Setup | Activation | 山田さん | 署名鍵登録・HSM設定 |
| 4-16 | Activation Complete | Activation | 山田さん | 稼働開始確認 |

### 4.4 Operations (7)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 4-17 | Operations Dashboard | Operations | 山田さん | メイン運用画面 |
| 4-18 | Signature Queue | Operations | 山田さん | 署名リクエストキュー |
| 4-19 | Request Detail | Operations | 山田さん | 個別リクエスト詳細 |
| 4-20 | Performance Metrics | Operations | 山田さん | 応答時間・稼働率 |
| 4-21 | Rewards Dashboard | Operations | 山田さん | 報酬一覧・請求 |
| 4-22 | Stake Management | Operations | 山田さん | Stake追加・状態 |
| 4-23 | Alerts | Operations | 山田さん | アラート一覧・設定 |

### 4.5 Challenge Response (3)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 4-24 | Challenge Notification | Challenge | 山田さん | Challenge受信通知 |
| 4-25 | Defense Submission | Challenge | 山田さん | 防御証拠提出 (48h) |
| 4-26 | Challenge Result | Challenge | 山田さん | 判定結果確認 |

### 4.6 Exit Flow (2)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 4-27 | Exit Request | Exit | 山田さん | 退出申請 |
| 4-28 | Exit Complete | Exit | 山田さん | Stake返還完了 |
=======
### 4.1 Public Pages (4 screens)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 4-1 | Prover Program Landing | Public | 山田さん | プログラム概要、メリット、CTA |
| 4-2 | Requirements & Qualifications | Public | 山田さん | 参加要件、HSM仕様、SLA |
| 4-3 | ROI Simulator | Public | 山田さん | 収益シミュレーター、パラメータ調整 |
| 4-4 | Prover FAQ | Public | 山田さん | よくある質問、技術詳細 |

### 4.2 Application Flow (5 screens)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 4-5 | Application Form | Application | 山田さん | 企業情報、技術仕様、マルチシグ設定 |
| 4-6 | HSM Setup Guide | Application | 山田さん | FIPS 140-2 Level 3設定ガイド |
| 4-7 | Document Upload | Application | 山田さん | 監査レポート、証明書アップロード |
| 4-8 | Application Status | Application | 山田さん | 審査進捗トラッキング |
| 4-9 | Application Result | Application | 山田さん | 承認/却下結果、次ステップ |

### 4.3 Onboarding (4 screens)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 4-10 | Stake Deposit | Onboarding | 山田さん | $400K Stake入金手順 |
| 4-11 | SPHINCS+ Key Setup | Onboarding | 山田さん | 鍵生成・登録 |
| 4-12 | Configuration & Test | Onboarding | 山田さん | システム設定、疎通テスト |
| 4-13 | Activation Complete | Onboarding | 山田さん | アクティベーション完了 |

### 4.4 Dashboard (3 screens)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 4-14 | Main Dashboard | Dashboard | 山田さん | 概要、KPI、アラート |
| 4-15 | Performance Metrics | Dashboard | 山田さん | 稼働率、応答時間、成功率 |
| 4-16 | Earnings Overview | Dashboard | 山田さん | 収益サマリー、支払い履歴 |

### 4.5 Operations (5 screens)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 4-17 | Signing Queue | Operations | 山田さん | 待機中の署名リクエスト一覧 |
| 4-18 | Request Detail | Operations | 山田さん | リクエスト詳細、検証情報 |
| 4-19 | Sign Confirmation | Operations | 山田さん | 署名実行確認 |
| 4-20 | Signature History | Operations | 山田さん | 過去の署名履歴 |
| 4-21 | Batch Operations | Operations | 山田さん | バッチ処理設定 |

### 4.6 Monitoring & Alerts (3 screens)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 4-22 | System Health | Monitoring | 山田さん | ノード状態、接続状況 |
| 4-23 | Alerts List | Monitoring | 山田さん | アラート一覧、優先度 |
| 4-24 | Alert Detail | Monitoring | 山田さん | アラート詳細、対応手順 |

### 4.7 Challenge Response (2 screens)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 4-25 | Active Challenges | Challenge | 山田さん | 受けているChallenge一覧 |
| 4-26 | Defense Submission | Challenge | 山田さん | 弁護提出、証拠アップロード |

### 4.8 Exit Flow (2 screens)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 4-27 | Exit Request | Exit | 山田さん | 退出申請、7日Unbonding説明 |
| 4-28 | Exit Complete | Exit | 山田さん | Stake返却完了 |
>>>>>>> origin/claude/implement-task-p5-025-vAWqS

---

## Design Requirements

### Color Usage

<<<<<<< HEAD
| 用途 | 色 | 理由 |
|------|-----|------|
| Primary Actions | Hinomaru Red (#BC002D) | CTA・重要アクション |
| Secondary | Gold (#C9A962) | セカンダリ・プレミアム感 |
| Background | Dark (#0A0A0C) | プロフェッショナル感 |
| Success | Green (#00C896) | 正常稼働・成功 |
| Warning | Orange (#F0A030) | SLA警告・注意 |
| Error | Orange-Red (#E07040) | 障害・Slashing |

### Key Visual Elements

| 要素 | 用途 |
|------|------|
| データテーブル | 署名キュー、履歴、メトリクス |
| リアルタイムチャート | パフォーマンス、応答時間 |
| ステータスバッジ | Active/Inactive/Slashed |
| カウントダウンタイマー | Challenge Defense期限 |
| アラートバナー | 緊急通知、SLA警告 |
| プログレスバー | 申請フロー、キャパシティ |

### Data Display Priorities

1. **リアルタイムメトリクス**: 応答時間、署名成功率、稼働率
2. **署名キュー**: 待機数、処理中、完了
3. **報酬**: 累計・未請求・次回支払い
4. **Stake状態**: 現在額、ロック状況、Slashingリスク

### Special Considerations

| 項目 | 対応 |
|------|------|
| PC最適化 | 95%がPC利用、ワイドスクリーン対応 |
| データ密度 | 数値・統計重視、ダッシュボード中心 |
| リアルタイム | WebSocket/自動更新、メトリクス表示 |
| アラート | 即時通知、視覚的強調 |
| 24/7運用 | 目に優しいダークテーマ |
| PDF出力 | 報酬レポート、監査用 |
=======
| Element | Color | Usage |
|---------|-------|-------|
| Primary Actions | Hinomaru Red (#BC002D) | Sign, Submit, Deposit |
| Secondary | Gold (#C9A962) | View Details, Simulate |
| Background | Dark (#0A0A0C) | 標準背景 |
| Success | Green (#00C896) | 成功メッセージ |
| Warning | Orange (#F0A030) | 警告、SLA注意 |
| Error | Orange-Red (#E07040) | エラー、Challenge |

### Key Visual Elements

| Element | Description |
|---------|-------------|
| Data Tables | 大量データ表示、ソート・フィルタ必須 |
| Charts | パフォーマンスメトリクス、収益チャート |
| Real-time Indicators | 署名キュー、システム状態 |
| Alert Badges | 重要度別バッジ（Critical/High/Medium/Low） |
| Progress Bars | アプリケーション進捗、Unbonding期間 |

### Special Considerations

| Consideration | Details |
|---------------|---------|
| B2B Focus | エンタープライズ品質、PDF出力対応 |
| Data Density | 情報密度高め、山田さんは数値重視 |
| Real-time Updates | WebSocketでリアルタイム更新 |
| Multi-sig Display | 2-of-3署名状態表示 |
| SLA Monitoring | 99.9%稼働率監視 |
| Quadratic Slashing | N²×10%スラッシングリスク表示 |
>>>>>>> origin/claude/implement-task-p5-025-vAWqS

---

## Persona Details

### 山田さん（45歳）- Prover

```
┌─────────────────────────────────────────────────────────────┐
│                        山田さん                              │
│                    インフラ企業CEO                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  【基本情報】                                                │
│  • 年齢: 45歳                                               │
│  • 職業: バリデーター企業CEO                                │
<<<<<<< HEAD
│  • 居住地: 東京                                             │
│  • 技術レベル: ★★★★★（エキスパート）                      │
│                                                             │
│  【背景】                                                    │
│  • バリデーター事業を5年運営（PoS系複数チェーン）           │
│  • HSMの運用経験あり                                        │
│  • 技術チーム10名                                           │
│  • 新しい収益源を探している                                 │
│  • セキュリティへの高い意識                                 │
=======
│  • 技術レベル: ★★★★★（エキスパート）                      │
│                                                             │
│  【背景】                                                    │
│  • バリデーター事業5年運営（PoS系複数チェーン）             │
│  • HSMの運用経験あり                                        │
│  • 技術チーム10名                                           │
│  • 新しい収益源を探している                                 │
>>>>>>> origin/claude/implement-task-p5-025-vAWqS
│                                                             │
│  【関心】                                                    │
│  • 「量子耐性ブリッジの検証者、収益性はどうか」             │
│  • 「技術要件は満たせるか」                                 │
│  • 「リスク（Slashing）はどの程度か」                       │
│  • 「運用負荷はどのくらいか」                               │
│                                                             │
│  【懸念】                                                    │
│  • 「$400K のStakeは大きい」                                │
│  • 「Quadratic Slashing、共謀リスクは？」                   │
│  • 「運用体制24/7、維持できるか」                           │
│  • 「SLAペナルティは厳しいか」                              │
│                                                             │
│  【利用デバイス】                                            │
│  • PC 95%（運用管理、設定）                                 │
│  • スマホ 5%（アラート確認のみ）                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

<<<<<<< HEAD
### Design Implications

| ペルソナ特性 | UI対応 |
|-------------|--------|
| 技術エキスパート | 専門用語OK、詳細データ表示 |
| 数値重視 | テーブル・チャート多用 |
| 効率重視 | ショートカット、バッチ操作 |
| 24/7運用 | ダークテーマ、低眼精疲労 |
| リスク意識 | Slashing説明、リスク可視化 |

---

## Prover Journey Mapping

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Prover ジャーニー                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  認知      理解      申請      審査      Stake     稼働      運用      退出    │
│   │         │         │         │         │         │         │         │      │
│   ▼         ▼         ▼         ▼         ▼         ▼         ▼         ▼      │
│ ┌───┐   ┌───┐    ┌───┐    ┌───┐    ┌───┐    ┌───┐    ┌───┐    ┌───┐         │
│ │LP │──►│Req│───►│Apply│──►│Review│─►│Deposit│►│Setup│─►│Ops│───►│Exit│        │
│ └───┘   └───┘    └───┘    └───┘    └───┘    └───┘    └───┘    └───┘         │
│                                                                                 │
│  画面:                                                                          │
│  • 認知: LP (4-1)                                                              │
│  • 理解: Requirements (4-2), Economics (4-3), Calculator (4-4, 4-5)            │
│  • 申請: Application Steps (4-6〜4-12)                                         │
│  • 審査: Status Check (4-11), Questions (4-12)                                 │
│  • Stake: Approval (4-13), Deposit (4-14)                                      │
│  • 稼働: Key Setup (4-15), Complete (4-16)                                     │
│  • 運用: Operations (4-17〜4-23), Challenge (4-24〜4-26)                        │
│  • 退出: Exit (4-27〜4-28)                                                      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Technical Requirements Display

> 申請画面・LPで明示すべき要件

| 要件 | 値 | 表示方法 |
|------|-----|---------|
| Stake | $400,000相当 | 大きく表示、為替レート併記 |
| HSM | FIPS 140-2 Level 3以上 | チェックリスト |
| 可用性 | 99.9% SLA | 稼働率メーター |
| 応答時間 | 30秒以内 | パフォーマンス指標 |
| マルチシグ | 2-of-3以上 | 設定ガイド |
| 監査 | 年次セキュリティ監査 | ドキュメント要件 |

---

## Quadratic Slashing Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│  Quadratic Slashing Calculator                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  N人のProverが同一不正 → 各Prover N² × 10% Slash                │
│                                                                  │
│  ┌────────────────────────────────────────────────────┐         │
│  │  違反Prover数   │  Slashing率   │  $400K時の損失  │         │
│  ├────────────────────────────────────────────────────┤         │
│  │       1         │     10%       │    $40,000      │         │
│  │       2         │     40%       │   $160,000      │         │
│  │       3         │     90%       │   $360,000      │         │
│  │      3+         │    100%       │   $400,000      │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                  │
│  ⚠️ 共謀リスク: 複数Proverが同時に不正を行うと損失が急増        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
=======
### 山田さんへのUI配慮

| Aspect | Consideration |
|--------|---------------|
| データ表示 | テーブル形式、ソート・フィルタ可能 |
| 数値精度 | 小数点以下も正確に表示 |
| PDF出力 | レポート機能、監査対応 |
| アラート | 即時通知、重要度別 |
| 長時間使用 | ダークモード、目に優しい配色 |

---

## Prover Journey Reference

```
認知 → 理解 → 申請 → 審査 → Stake → 稼働 → 運用 → 退出

申請要件:
┌─────────────────────────────────────────────────────────────────┐
│ 要件              │ 詳細                                        │
├─────────────────────────────────────────────────────────────────┤
│ Stake             │ $400,000 相当                               │
│ HSM               │ FIPS 140-2 Level 3 以上                     │
│ 可用性            │ 99.9% SLA                                   │
│ 応答時間          │ 30秒以内の署名                              │
│ マルチシグ        │ 2-of-3 以上                                 │
│ 監査              │ 年次セキュリティ監査                        │
└─────────────────────────────────────────────────────────────────┘

Quadratic Slashing:
• N人のProverが同一不正 → 各Prover N² × 10% Slash
• 1人なら10%、2人なら40%、3人なら90%
• 共謀を強く抑止
>>>>>>> origin/claude/implement-task-p5-025-vAWqS
```

---

<<<<<<< HEAD
## Review Agents

| Agent | Focus |
|-------|-------|
| CDO（佐々木さん） | プロフェッショナル感、B2B品質 |
| 山田さん | B2B運用効率、データ可視化、リアルタイム性 |

---

## Core Principles Alignment

| 原則 | 対応 |
|------|------|
| CP-1 完全量子耐性 | SPHINCS+署名表示、量子耐性バッジ |
| CP-2 Self-Custody | HSMでのProver鍵管理 |
| CP-3 Time Lock存在 | Challenge Defense 48h表示 |
| CP-4 Slashing存在 | Quadratic Slashing説明・可視化 |
| CP-5 透明性 | オンチェーン履歴、監査ログ |

---

## File Structure

```
system_04_prover/
├── README.md                        # システム概要
├── DESIGN_BRIEF_prover.md           # ★ 本ドキュメント
└── wip/
    ├── wireframes/                  # ワイヤーフレーム用
    └── mocks/                       # HTMLモック用
```
=======
## Spec References

| Document | Section | Topic |
|----------|---------|-------|
| SEQUENCES.md | §5 | Prover Registration |
| SEQUENCES.md | §6 | Prover Exit |
| UNIFIED_SPEC.md | §Prover Portal | API仕様 |
| CORE_PRINCIPLES.md | CP-1 | SPHINCS+-128s必須 |
| CORE_PRINCIPLES.md | CP-4 | Slashing存在必須 |
>>>>>>> origin/claude/implement-task-p5-025-vAWqS

---

## Next Steps

1. → `09_design_create.md` でワイヤーフレーム・モック作成
<<<<<<< HEAD
2. Operations Dashboard から着手（コア機能）
3. 申請フロー（Registration）を順次作成
4. Challenge/Exit フローを補完

---

**Created**: 2026-01-10
**Author**: Design Agent
**Next Phase**: 09_design_create.md
=======
2. DESIGN_MANIFEST.md を出力
3. wip/mocks/ にHTMLモック配置

---

## Checklist

- [x] UI_PROGRESS_TRACKER から対象システム特定
- [x] CORE_PRINCIPLES.md 読み込み
- [x] 02_PERSONAS.md 読み込み
- [x] 03_USER_JOURNEYS.md 読み込み
- [x] UI_DESIGN_GUIDELINES.md 読み込み
- [x] Screen List 作成 (28 screens)
- [x] Persona Mapping 完了
- [x] Design Requirements 整理
- [ ] Git Push (次ステップ)

---

**END OF DESIGN BRIEF**
>>>>>>> origin/claude/implement-task-p5-025-vAWqS
