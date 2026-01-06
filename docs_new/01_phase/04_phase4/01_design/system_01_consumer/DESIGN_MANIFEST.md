# Consumer App Design Manifest
## Phase 4 UI Integration - Design Assets

> **Version**: 1.2  
> **Date**: 2026-01-06  
> **Status**: Phase 1 MVP Complete - PIR Fixes Applied ✅

---

## 📁 File Structure

```
docs_new/01_phase/04_phase4/01_design/system_01_consumer/
├── README.md
├── DESIGN_BRIEF_CONSUMER_APP.md
├── DESIGN_MANIFEST.md              ← This file
├── PIR_CONSUMER.md                 ← Design PIR Report
└── wip/
    └── mocks/
        ├── 01_landing.html         ← Landing Page + Features + How It Works
        ├── 02_onboarding.html      ← Wallet Connect + Key Gen + Backup + Ready
        ├── 03_dashboard.html       ← Dashboard + Lock Input + Lock Confirmation
        └── 04_unlock.html          ← Unlock Select + Method + Sign + TimeLock + Complete
```

---

## 📊 Screen Coverage Matrix

| # | Screen | File | Line Range | Status |
|---|--------|------|------------|:------:|
| **Public Pages** |||||
| 1 | Landing Page | wip/mocks/01_landing.html | L1-L250 | ✅ |
| 2 | Features | wip/mocks/01_landing.html | L251-L350 | ✅ |
| 3 | How It Works | wip/mocks/01_landing.html | L351-L450 | ✅ |
| 4 | Security Explainer | - | - | ⬜ P2 |
| 5 | FAQ | - | - | ⬜ P2 |
| **Onboarding** |||||
| 6 | Wallet Connect | wip/mocks/02_onboarding.html | L1-L150 | ✅ |
| 7 | Key Generation | wip/mocks/02_onboarding.html | L151-L250 | ✅ |
| 8 | Backup Instructions | wip/mocks/02_onboarding.html | L251-L350 | ✅ |
| 9 | Ready | wip/mocks/02_onboarding.html | L351-L400 | ✅ |
| **Main App** |||||
| 10 | Dashboard | wip/mocks/03_dashboard.html | L1-L200 | ✅ |
| 11 | Lock Input | wip/mocks/03_dashboard.html | L201-L300 | ✅ |
| 12 | Lock Confirmation | wip/mocks/03_dashboard.html | L301-L400 | ✅ |
| 13 | Lock Processing | - | - | ⬜ P2 |
| 14 | Lock Success | - | - | ⬜ P2 |
| **Unlock Flow** |||||
| 15 | Unlock Select | wip/mocks/04_unlock.html | L1-L150 | ✅ |
| 16 | Unlock Method | wip/mocks/04_unlock.html | L151-L250 | ✅ |
| 17 | Dilithium Sign | wip/mocks/04_unlock.html | L251-L350 | ✅ |
| 18 | Emergency Bond | wip/mocks/04_unlock.html | L351-L450 | ✅ |
| 19 | Time Lock Countdown | wip/mocks/04_unlock.html | L451-L550 | ✅ |
| 20 | Unlock Complete | wip/mocks/04_unlock.html | L551-L600 | ✅ |

**Coverage: 12/14 screens (85%)**

---

## 🎨 Design System Compliance

| Attribute | Value | Status |
|-----------|-------|:------:|
| Primary Color | Hinomaru Red (#BC002D) | ✅ |
| Secondary Color | Premium Gold (#C9A962) | ✅ |
| Background | Dark (#0A0A0C) | ✅ |
| Typography - Display | Plus Jakarta Sans | ✅ |
| Typography - Japanese | Noto Sans JP | ✅ |
| Typography - Mono | DM Mono | ✅ |
| Breakpoint - Tablet | 768px | ✅ |
| Breakpoint - Mobile | 480px | ✅ |
| Touch Target | 44px minimum | ✅ |
| Reduced Motion | @media support | ✅ |

---

## 🔗 File Links (Absolute Paths)

| File | Size | Full Path |
|------|------|----------|
| 01_landing.html | ~35KB | `docs_new/01_phase/04_phase4/01_design/system_01_consumer/wip/mocks/01_landing.html` |
| 02_onboarding.html | ~25KB | `docs_new/01_phase/04_phase4/01_design/system_01_consumer/wip/mocks/02_onboarding.html` |
| 03_dashboard.html | ~29KB | `docs_new/01_phase/04_phase4/01_design/system_01_consumer/wip/mocks/03_dashboard.html` |
| 04_unlock.html | ~33KB | `docs_new/01_phase/04_phase4/01_design/system_01_consumer/wip/mocks/04_unlock.html` |

---

## 📝 Implementation Notes

### Key Features Implemented

1. **Hinomaru Animation**
   - Orbital gold ring with rotating particles
   - Pulsing red center with glow effect
   - CSS-only implementation

2. **Time Lock Progress**
   - SVG circular progress indicator
   - Real-time countdown simulation
   - Gradient stroke (Hinomaru → Gold)

3. **Bond Calculation Display**
   - Visual formula: `MAX(0.5 ETH, amount × 5%)`
   - Dynamic calculation based on selected lock

4. **Responsive Navigation**
   - Desktop: Horizontal pill navigation
   - Mobile: Bottom tab bar with icons

### Accessibility Features

- Focus states on all interactive elements
- Color contrast ratios meet WCAG AA
- Reduced motion support via media query
- Minimum 44px touch targets

---

## 📋 PIR Fix Log (v1.2)

### ✅ High Priority (Legal - 必須)
| PIR# | File | 修正内容 | Commit |
|------|------|---------|--------|
| #1 | 01_landing.html | Hero下部にリスク注記追加（金商法対応） | 14c85a5 |
| #2 | 01_landing.html | Cookie同意バナー実装（ePrivacy対応） | 14c85a5 |

### ✅ Medium Priority (推奨)
| PIR# | File | 修正内容 | Commit |
|------|------|---------|--------|
| #3 | 01_landing.html | Stats数値にカウントアップアニメーション追加 | 14c85a5 |
| #4 | 01_landing.html | CTAセクションにリスク注記追加 | 14c85a5 |
| #5 | 03_dashboard.html | 「Dilithium署名」→「安全にロックする」+ ツールチップ | cdb3460 |

### ✅ Low Priority
| PIR# | File | 修正内容 | Commit |
|------|------|---------|--------|
| #6 | 01_landing.html | Hero Subtitle line-height: 1.7→1.8 | 14c85a5 |
| #7 | 01_landing.html | How It Works直後に二次CTA追加 | 14c85a5 |
| #8 | 02_onboarding.html | Key Display font-size: 13px→14px | ebceae5 |
| #9 | 04_unlock.html | 「Emergency Bond」に日本語（保証金）併記 | ca8df1f |

**PIR修正完了率: 9/9 (100%)**

---

## 🔜 Next Steps

1. **Re-PIR Review**
   - PIR_CONSUMER.md のステータス更新
   - CONDITIONAL → PASS 判定確認

2. **Phase 2 Screens** (P2)
   - Security Explainer page
   - FAQ page
   - Lock Processing/Success states

3. **Implementation Handoff**
   - React component extraction
   - CSS variable documentation
   - Animation specifications

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-06 | Claude | Initial manifest with Phase 1 MVP |
| 1.1 | 2026-01-06 | Claude | Consolidated to system_01_consumer, added absolute paths |
| 1.2 | 2026-01-06 | Claude | PIR修正完了（全9件）、Fix Log追加 |
