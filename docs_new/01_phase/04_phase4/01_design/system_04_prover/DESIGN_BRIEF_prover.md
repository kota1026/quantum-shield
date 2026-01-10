# Design Brief: Prover Portal

## Overview

| 項目 | 値 |
|------|-----|
| System | Prover Portal |
| System ID | 04 |
| Directory | system_04_prover |
| Priority | P0 |
| Total Screens | 28 |
| Target Personas | 山田さん（Prover） |
| Created | 2026-01-10 |

---

## Screen List

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

---

## Design Requirements

### Color Usage

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
│  • 居住地: 東京                                             │
│  • 技術レベル: ★★★★★（エキスパート）                      │
│                                                             │
│  【背景】                                                    │
│  • バリデーター事業を5年運営（PoS系複数チェーン）           │
│  • HSMの運用経験あり                                        │
│  • 技術チーム10名                                           │
│  • 新しい収益源を探している                                 │
│  • セキュリティへの高い意識                                 │
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
```

---

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

---

## Next Steps

1. → `09_design_create.md` でワイヤーフレーム・モック作成
2. Operations Dashboard から着手（コア機能）
3. 申請フロー（Registration）を順次作成
4. Challenge/Exit フローを補完

---

**Created**: 2026-01-10
**Author**: Design Agent
**Next Phase**: 09_design_create.md
