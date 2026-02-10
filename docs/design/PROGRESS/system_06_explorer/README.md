# 📁 System 06: Explorer - Design Folder

> **Status**: 🟡 In Progress (Brief Ready)
> **Priority**: P1
> **Screens**: 14
> **Target Users**: All (Public)

---

## Overview

Explorerは公開閲覧用のブロックエクスプローラーです。
透明性（CP-5）を示す重要なシステム。

### 画面構成

| Category | Screens | Count |
|----------|---------|:-----:|
| Home | Overview, Recent Locks, Recent Unlocks | 3 |
| Search & List | Search, Lock List, Unlock List, Challenge List | 4 |
| Detail | Lock, Unlock, Challenge, Address | 4 |
| Prover Stats | List, Detail | 2 |
| Analytics | Dashboard (TVL, Volume, Performance) | 1 |
| **Total** | | **14** |

---

## Design Artifacts

| Artifact | Status | File |
|----------|:------:|------|
| DESIGN_BRIEF | ✅ | `DESIGN_BRIEF_explorer.md` |
| DESIGN_MANIFEST | ⬜ | - |
| Mocks | ⬜ 0/14 | `wip/mocks/` |
| PIR Report | ⬜ | - |

---

## Directory Structure

```
system_06_explorer/
├── README.md                    # このファイル
├── DESIGN_BRIEF_explorer.md     # ✅ Created
├── DESIGN_MANIFEST.md           # ⬜ Next step
└── wip/
    ├── wireframes/              # ワイヤーフレーム
    └── mocks/                   # HTMLモック
```

---

## Key Requirements

- **検索性**: 高速検索（Address/TX Hash/Lock ID）
- **データ可視化**: チャート・グラフ（TVL推移、取引量）
- **透明性**: 全データ公開、オンチェーン検証可能
- **パフォーマンス**: 大量データのページネーション

---

## Target Personas

| Persona | Usage |
|---------|-------|
| 田中さん (End User) | 自分のLock/Unlock状況確認 |
| 鈴木さん (Token Holder) | TVL推移、プロトコル健全性確認 |
| 渡辺さん (Delegate) | Governance関連トランザクション調査 |
| 山田さん (Prover) | 自社の署名履歴・報酬確認 |
| 中村さん (Observer) | 不審なトランザクション調査 |
| 佐藤さん (Enterprise) | 顧客サポート用の履歴確認 |

---

## Review Agents

| Agent | Focus |
|-------|-------|
| CDO（佐々木さん） | 情報設計、データ可視化 |
| Marketing（田村さん） | TVL等のマーケティング活用 |
| Security（中村さん） | 情報開示の適切性 |

---

## Next Steps

1. → `09_design_create.md` でモック作成
2. DESIGN_MANIFEST.md 作成
3. PIR レビュー

---

**Last Updated**: 2026-01-10
