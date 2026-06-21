# System 03: Governance - Design Folder

> **Status**: ✅ Design PIR PASS
> **Priority**: P1
> **Screens**: 16
> **Target Users**: Token Holder (鈴木さん), Delegate (渡辺さん), Proposer (高橋さん)

---

## Overview

Governanceは提案・投票・Council管理を提供します。
Decentralized Edition向け（Enterpriseはオプション）。

### Progress

| Milestone | Status |
|-----------|:------:|
| DESIGN_BRIEF | ✅ Created |
| DESIGN_MANIFEST | ✅ Updated (v1.1) |
| Mocks | ✅ 6/6 files (16 screens) - 修正済 |
| PIR | ✅ PASS (v2.0) |

---

## Directory Structure

```
system_03_governance/
├── README.md                    # このファイル
├── DESIGN_BRIEF_governance.md   # ✅ デザインブリーフ
├── DESIGN_MANIFEST.md           # ✅ マニフェスト
└── wip/
    ├── wireframes/              # ワイヤーフレーム用
    └── mocks/                   # ✅ 6 HTMLモックファイル
        ├── 01_dashboard.html
        ├── 02_proposals_list.html
        ├── 02_proposal_detail.html
        ├── 03_create_proposal.html
        ├── 04_my_activity.html
        └── 05_council.html
```

---

## Screen Overview (16 screens)

| Category | Screens | Count |
|----------|---------|:-----:|
| Overview | Dashboard, My Power | 2 |
| Proposals | List, Detail, Vote, Success | 4 |
| Create Proposal | Step 1-3, Submit | 4 |
| My Activity | Votes, Proposals, Received | 3 |
| Council | Dashboard, Emergency, Veto | 3 |

---

## Key Features

- **投票インターフェース**: For/Against/Abstainの3択投票
- **提案作成フロー**: 3ステップのガイド付き提案作成
- **Delegate管理**: 委任受領状況の可視化
- **Council Veto**: Security/Purpose Councilの監視機能

---

## Review Agents

| Agent | Focus |
|-------|-------|
| CDO（佐々木さん） | 透明性・信頼感の表現 |
| Legal（西村さん） | 投票プロセスの合法性 |
| 鈴木さん | 投票のわかりやすさ |
| 渡辺さん | 提案作成フロー |

---

## Related Documents

- [DESIGN_BRIEF_governance.md](./DESIGN_BRIEF_governance.md) - デザインブリーフ
- [UI_DESIGN_GUIDELINES.md](../UI_DESIGN_GUIDELINES.md) - デザインシステム
- [UI_PROGRESS_TRACKER.md](../UI_PROGRESS_TRACKER.md) - 進捗管理

---

**Last Updated**: 2026-01-10
