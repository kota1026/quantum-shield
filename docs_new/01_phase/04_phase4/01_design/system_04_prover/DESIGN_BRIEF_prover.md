# Design Brief: Prover Portal

> **Version**: 1.0
> **Created**: 2026-01-12
> **Phase**: 08_design_prep
> **Next**: 09_design_create.md

---

## Overview

| Item | Value |
|------|-------|
| System | Prover Portal |
| System ID | 04 |
| Directory | system_04_prover |
| Priority | P0 |
| Total Screens | 28 |
| Target Persona | 山田さん（Prover） |

---

## Screen List

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

---

## Design Requirements

### Color Usage

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
│  • 技術レベル: ★★★★★（エキスパート）                      │
│                                                             │
│  【背景】                                                    │
│  • バリデーター事業5年運営（PoS系複数チェーン）             │
│  • HSMの運用経験あり                                        │
│  • 技術チーム10名                                           │
│  • 新しい収益源を探している                                 │
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
```

---

## Spec References

| Document | Section | Topic |
|----------|---------|-------|
| SEQUENCES.md | §5 | Prover Registration |
| SEQUENCES.md | §6 | Prover Exit |
| UNIFIED_SPEC.md | §Prover Portal | API仕様 |
| CORE_PRINCIPLES.md | CP-1 | SPHINCS+-128s必須 |
| CORE_PRINCIPLES.md | CP-4 | Slashing存在必須 |

---

## Next Steps

1. → `09_design_create.md` でワイヤーフレーム・モック作成
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
