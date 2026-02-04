# 📁 System 01: Consumer App - Design Folder

> **Status**: 🔴 Not Started  
> **Priority**: P0  
> **Screens**: 25  
> **Target Users**: End User (田中さん), Token Holder (鈴木さん)

---

## Overview

Consumer Appは一般ユーザー向けのメインアプリケーションです。
Lock/Unlockの基本フローとDilithium鍵の生成・管理を担当します。

### 画面構成

| Category | Screens | Count |
|----------|---------|:-----:|
| Public Pages | Landing, How It Works, Security, FAQ | 4 |
| Onboarding | Connect, Key Gen, Backup, Ready | 4 |
| Main App | Dashboard, Lock Flow (4), Unlock Normal (6), Unlock Emergency (3) | 14 |
| Settings | History, Settings, Key Management | 3 |

---

## Files

```
system_01_consumer/
├── README.md                    # This file
├── DESIGN_BRIEF_CONSUMER.md     # Design brief (08_design_prep output)
├── wireframes/                  # Wireframe files
│   └── .gitkeep
├── figma/                       # Figma export files
│   └── .gitkeep
├── mocks/                       # HTML/React mocks
│   └── .gitkeep
└── PIR_CONSUMER.md             # PIR report (10_design_pir output)
```

---

## Design Requirements

### Key Visual Elements

- **日の丸アニメーション**: Lock状態を視覚化
- **Dilithium署名UI**: 量子耐性を感じさせるデザイン
- **Time Lock カウントダウン**: 24h/7dの明確な表示
- **Emergency Bond 計算**: MAX(0.5ETH, amount×5%)の可視化

### Mobile First

- モバイル最適化必須（田中さんがスマホメイン）
- タッチターゲット: 最低44px
- レスポンシブブレークポイント: 640/768/1024/1280px

### Accessibility

- WCAG 2.1 AA準拠
- コントラスト比: 最低4.5:1
- フォーカス状態の明確化

---

## Review Agents

このシステムは以下のAgentがレビューします:

| Agent | Focus |
|-------|-------|
| CDO（佐々木さん） | ブランド一貫性、Premium Japan感 |
| Marketing（田村さん） | オンボーディング変換率、リテンション |
| Legal（西村さん） | 免責表示、規制対応 |
| 田中さん | 初心者視点、モバイルUX |
| 鈴木さん | DeFi慣れユーザー視点 |

---

## Status Tracking

| Phase | Status | Date |
|-------|--------|------|
| Design Brief | ⬜ Not Started | - |
| Wireframes | ⬜ Not Started | - |
| High-Fidelity | ⬜ Not Started | - |
| Mocks | ⬜ Not Started | - |
| PIR | ⬜ Not Started | - |
| Approved | ⬜ Not Started | - |

---

**Last Updated**: 2026-01-06
