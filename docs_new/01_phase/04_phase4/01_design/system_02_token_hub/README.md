# 📁 System 02: Token Hub - Design Folder

> **Status**: 🟡 Brief Ready  
> **Priority**: P0  
> **Screens**: 18  
> **Target Users**: Token Holder (鈴木さん), Delegate (渡辺さん)

---

## Overview

Token HubはQS/veQSトークンの管理とステーキング、委任機能を提供します。
Decentralized Edition専用のシステムです。

### Current Progress

| Item | Status | Notes |
|------|:------:|-------|
| DESIGN_BRIEF | ✅ | DESIGN_BRIEF_token_hub.md (2026-01-08) |
| DESIGN_MANIFEST | ⬜ | 09_design_create.md で作成予定 |
| Mocks | ⬜ | 0/18 画面 |
| PIR | ⬜ | - |

### 画面構成

| Category | Screens | Count |
|----------|---------|:-----:|
| Dashboard | Balance, Power, Rewards | 1 |
| veQS Lock | Form, Preview, Confirm, Success | 4 |
| veQS Manage | Extend, Early, Normal, Success | 4 |
| Delegation | List, Detail, Form, My, Undelegate | 5 |
| Rewards | Dashboard, Claim, History, Become Delegate | 4 |
| **Total** | | **18** |

---

## Files in This Directory

```
system_02_token_hub/
├── README.md                        ← このファイル
├── DESIGN_BRIEF_token_hub.md        ✅ 作成済み
├── DESIGN_MANIFEST.md               ⬜ 未作成
├── PIR_TOKEN_HUB.md                 ⬜ 未作成
└── wip/
    └── mocks/                       ⬜ 未作成
        ├── 01_dashboard.html
        ├── 02_lock.html
        ├── ...
```

---

## Next Steps

1. **09_design_create.md** を実行してモック作成
2. veQS投票力計算のチャートコンポーネント設計
3. Delegateカードコンポーネント設計

---

## Review Agents

| Agent | Focus |
|-------|-------|
| CDO（佐々木さん） | ブランド一貫性 |
| Marketing（田村さん） | Token経済の理解促進 |
| 鈴木さん | DeFi視点、veTokenの使いやすさ |
| 渡辺さん | Delegate視点、委任フロー |

---

**Last Updated**: 2026-01-09
