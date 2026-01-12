# 📁 System 04: Prover Portal - Design Folder

> **Status**: 🟡 In Progress (Brief Ready)
> **Priority**: P0
> **Screens**: 28
> **Target Users**: Prover (山田さん)

---

## Overview

Prover PortalはProver事業者向けの登録・運用・報酬管理システムです。
B2B向けの専門的なUIが求められます。

### 画面構成

| Category | Screens | Count |
|----------|---------|:-----:|
| Public | LP, Requirements, Economics, Calculator, Simulator | 5 |
| Registration | Application 4steps, Submitted, Status, Questions | 7 |
| Activation | Approval, Stake, Key Setup, Complete | 4 |
| Operations | Dashboard, Queue, Detail, Metrics, Rewards, Stake, Alerts | 7 |
| Challenge | Notification, Defense, Result | 3 |
| Exit | Request, Complete | 2 |
| **Total** | | **28** |

---

## Design Documents

| Document | Status | Updated |
|----------|:------:|---------|
| DESIGN_BRIEF_prover.md | ✅ Created | 2026-01-10 |
| DESIGN_MANIFEST.md | ⬜ Not Yet | - |
| PIR_prover.md | ⬜ Not Yet | - |

---

## Key Requirements

- **データ密度**: 山田さんは数値・統計重視
- **効率性**: 大量の署名リクエスト処理
- **リアルタイム**: パフォーマンスメトリクス
- **アラート**: 即時通知システム
- **PC最適化**: 95%がPC利用

---

## Directory Structure

```
system_04_prover/
├── README.md                   # 本ファイル
├── DESIGN_BRIEF_prover.md      # ✅ デザインブリーフ
├── DESIGN_MANIFEST.md          # ⬜ 作成予定
└── wip/
    ├── wireframes/             # ワイヤーフレーム用
    └── mocks/                  # HTMLモック用
```

---

## Review Agents

| Agent | Focus |
|-------|-------|
| CDO（佐々木さん） | プロフェッショナル感 |
| 山田さん | B2B運用効率、データ可視化 |

---

## Next Steps

1. → `09_design_create.md` でモック作成
2. Operations Dashboard から着手

---

**Last Updated**: 2026-01-10