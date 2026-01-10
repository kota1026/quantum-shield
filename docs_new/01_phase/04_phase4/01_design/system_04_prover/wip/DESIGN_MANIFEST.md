# DESIGN_MANIFEST - Prover Portal

## Session Variables
- **SYSTEM_ID**: 04
- **SYSTEM_NAME**: prover
- **SYSTEM_FULL_NAME**: Prover Portal
- **DESIGN_STYLE**: Premium Japan (Hinomaru Red #BC002D, Gold #C9A962)
- **PRIMARY_PERSONA**: 山田さん (45歳, インフラ企業CEO, ★★★★★)

---

## Screen Inventory

### Public Pages (5 screens)
| File | Screen Name | States | Status |
|------|-------------|--------|--------|
| 01_landing.html | Prover LP | Default | ✅ Complete |
| 02_requirements.html | Requirements | 要件一覧, 収益シミュレータ, ROI計算, リスクシミュレータ | ✅ Complete |

### Registration (7 screens)
| File | Screen Name | States | Status |
|------|-------------|--------|--------|
| 03_application.html | Application | Step1 基本情報, Step2 技術情報, Step3 財務情報, Step4 確認, Submitted | ✅ Complete |
| 04_status.html | Status Check | 検索, 審査中, 質問対応 | ✅ Complete |

### Activation (4 screens)
| File | Screen Name | States | Status |
|------|-------------|--------|--------|
| 05_activation.html | Activation | 承認通知, ステーク預入, 鍵セットアップ, 完了 | ✅ Complete |

### Operations (7 screens)
| File | Screen Name | States | Status |
|------|-------------|--------|--------|
| 06_dashboard.html | Dashboard | Default | ✅ Complete |
| 07_queue.html | Signature Queue | 一覧, リクエスト詳細, 署名確認 | ✅ Complete |
| 08_metrics.html | Metrics | パフォーマンス, 報酬 | ✅ Complete |
| 09_alerts.html | Alerts | アラート一覧, ステーク管理 | ✅ Complete |

### Challenge (3 screens)
| File | Screen Name | States | Status |
|------|-------------|--------|--------|
| 10_challenge.html | Challenge | 通知, 弁明提出, 結果 | ✅ Complete |

### Exit (2 screens)
| File | Screen Name | States | Status |
|------|-------------|--------|--------|
| 11_exit.html | Exit | 申請, 完了 | ✅ Complete |

---

## Screen Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PROVER PORTAL FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────┐
                              │  01_landing.html │
                              │   (Prover LP)    │
                              └────────┬─────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              ▼                        ▼                        ▼
    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
    │ 02_requirements  │    │ 03_application   │    │   04_status      │
    │ (要件・条件)     │    │ (申請フォーム)   │    │ (状況確認)       │
    └────────┬─────────┘    └────────┬─────────┘    └──────────────────┘
             │                       │
             │                       ▼
             │              ┌──────────────────┐
             │              │ 05_activation    │
             │              │ (アクティベーション) │
             └──────────────┴────────┬─────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATED AREA                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    ┌──────────────────┐                                                     │
│    │ 06_dashboard     │◄──────────────────────────────────────────┐        │
│    │ (ダッシュボード) │                                           │        │
│    └────────┬─────────┘                                           │        │
│             │                                                      │        │
│    ┌────────┴────────┬────────────────┬────────────────┐          │        │
│    ▼                 ▼                ▼                ▼          │        │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │        │
│ │ 07_queue    │ │ 08_metrics  │ │ 09_alerts   │ │ 10_challenge│  │        │
│ │ (署名キュー)│ │ (メトリクス)│ │ (アラート) │ │ (チャレンジ)│  │        │
│ └─────────────┘ └─────────────┘ └──────┬──────┘ └─────────────┘  │        │
│                                        │                          │        │
│                                        ▼                          │        │
│                               ┌──────────────────┐                │        │
│                               │   11_exit        │────────────────┘        │
│                               │ (Exit申請)       │                         │
│                               └──────────────────┘                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

LEGEND:
──────
→ : Primary navigation flow
◄─ : Return navigation
│  : Vertical flow
```

---

## Link Validation Table

| From File | Link Target | Navigation Element | Status |
|-----------|-------------|-------------------|--------|
| 01_landing.html | 02_requirements.html | Nav: 要件・条件 | ✅ |
| 01_landing.html | 03_application.html | CTA: 申請を開始, Nav: 申請 | ✅ |
| 01_landing.html | 04_status.html | Nav: 状況確認 | ✅ |
| 02_requirements.html | 01_landing.html | Logo, Nav: ホーム | ✅ |
| 02_requirements.html | 03_application.html | CTA: 申請を開始 | ✅ |
| 03_application.html | 01_landing.html | Logo | ✅ |
| 03_application.html | 02_requirements.html | Nav: 要件・条件 | ✅ |
| 03_application.html | 04_status.html | Nav: 状況確認 | ✅ |
| 04_status.html | 01_landing.html | Logo, Nav: ホーム | ✅ |
| 04_status.html | 02_requirements.html | Nav: 要件・条件 | ✅ |
| 04_status.html | 03_application.html | Nav: 申請 | ✅ |
| 05_activation.html | 01_landing.html | Logo | ✅ |
| 05_activation.html | 06_dashboard.html | CTA: ダッシュボードへ進む | ✅ |
| 06_dashboard.html | 01_landing.html | Logo, ログアウト | ✅ |
| 06_dashboard.html | 07_queue.html | Sidebar: 署名キュー | ✅ |
| 06_dashboard.html | 08_metrics.html | Sidebar: メトリクス | ✅ |
| 06_dashboard.html | 09_alerts.html | Sidebar: アラート | ✅ |
| 06_dashboard.html | 10_challenge.html | Sidebar: チャレンジ | ✅ |
| 06_dashboard.html | 11_exit.html | Sidebar: Exit申請 | ✅ |
| 07_queue.html | 01_landing.html | Logo, ログアウト | ✅ |
| 07_queue.html | 06_dashboard.html | Sidebar: ダッシュボード | ✅ |
| 07_queue.html | 08_metrics.html | Sidebar: メトリクス | ✅ |
| 07_queue.html | 09_alerts.html | Sidebar: アラート | ✅ |
| 07_queue.html | 10_challenge.html | Sidebar: チャレンジ | ✅ |
| 07_queue.html | 11_exit.html | Sidebar: Exit申請 | ✅ |
| 08_metrics.html | 01_landing.html | Logo, ログアウト | ✅ |
| 08_metrics.html | 06_dashboard.html | Sidebar: ダッシュボード | ✅ |
| 08_metrics.html | 07_queue.html | Sidebar: 署名キュー | ✅ |
| 08_metrics.html | 09_alerts.html | Sidebar: アラート | ✅ |
| 08_metrics.html | 10_challenge.html | Sidebar: チャレンジ | ✅ |
| 08_metrics.html | 11_exit.html | Sidebar: Exit申請 | ✅ |
| 09_alerts.html | 01_landing.html | Logo, ログアウト | ✅ |
| 09_alerts.html | 06_dashboard.html | Sidebar: ダッシュボード | ✅ |
| 09_alerts.html | 07_queue.html | Sidebar: 署名キュー | ✅ |
| 09_alerts.html | 08_metrics.html | Sidebar: メトリクス | ✅ |
| 09_alerts.html | 10_challenge.html | Sidebar: チャレンジ | ✅ |
| 09_alerts.html | 11_exit.html | Sidebar/CTA: Exit申請へ | ✅ |
| 10_challenge.html | 01_landing.html | Logo, ログアウト | ✅ |
| 10_challenge.html | 06_dashboard.html | Sidebar: ダッシュボード, CTA: 戻る | ✅ |
| 10_challenge.html | 07_queue.html | Sidebar: 署名キュー | ✅ |
| 10_challenge.html | 08_metrics.html | Sidebar: メトリクス | ✅ |
| 10_challenge.html | 09_alerts.html | Sidebar: アラート | ✅ |
| 10_challenge.html | 11_exit.html | Sidebar: Exit申請 | ✅ |
| 11_exit.html | 01_landing.html | Logo, ログアウト, CTA: ホームに戻る | ✅ |
| 11_exit.html | 06_dashboard.html | Sidebar: ダッシュボード | ✅ |
| 11_exit.html | 07_queue.html | Sidebar: 署名キュー | ✅ |
| 11_exit.html | 08_metrics.html | Sidebar: メトリクス | ✅ |
| 11_exit.html | 09_alerts.html | Sidebar: アラート | ✅ |
| 11_exit.html | 10_challenge.html | Sidebar: チャレンジ | ✅ |

---

## Design Implementation Notes

### Color Palette Applied
- **Primary (Hinomaru Red)**: #BC002D - CTAs, active states, branding
- **Secondary (Gold)**: #C9A962 - Highlights, values, premium elements
- **Background (Dark)**: #0A0A0C - Main background
- **Surface (Dark)**: #12121A - Cards, sidebars
- **Border**: #2A2A3C - Dividers, borders
- **Success**: #00C853 - Positive states
- **Warning**: #FFB300 - Caution states
- **Danger**: #FF5252 - Error states, slashing

### Key Features Implemented
1. **Quadratic Slashing Visualization**: Risk meter and penalty tables in 09_alerts.html
2. **SPHINCS+ Key Setup**: Step-by-step CLI guide in 05_activation.html
3. **Real-time Countdown**: Challenge deadline timer in 10_challenge.html
4. **Interactive Calculators**: ROI and Risk simulators in 02_requirements.html
5. **Multi-state Screens**: Tab navigation for different states within single HTML files

### Responsive Considerations
- Sidebar navigation for authenticated pages
- Grid layouts adapt to screen sizes
- Fixed sidebar with scrollable main content

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-03-20 | Initial creation - All 11 HTML mocks complete |

---

**Created by**: 09_design_create.md workflow
**Based on**: DESIGN_BRIEF_prover.md
**Reference Design**: design-concept-5-japan-premium.html
