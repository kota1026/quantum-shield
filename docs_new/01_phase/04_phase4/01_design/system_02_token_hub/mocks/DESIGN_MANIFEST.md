# Token Hub (System 02) Design Manifest
## Phase 1 MVP - 10 P0 Screens Complete

**Created**: 2026-01-08
**Version**: 1.0
**Design System**: Premium Japan Design (UI_DESIGN_GUIDELINES.md v1.0)

---

## 📋 Screen Inventory

| # | File | Screen Name | Category | Status |
|---|------|-------------|----------|:------:|
| 1 | 01_dashboard.html | Token Hub Dashboard | Dashboard | ✅ |
| 2 | 02_lock_form.html | Lock Form | veQS Lock | ✅ |
| 3 | 02_lock_preview.html | Lock Preview | veQS Lock | ✅ |
| 4 | 02_lock_confirm.html | Lock Confirm | veQS Lock | ✅ |
| 5 | 02_lock_success.html | Lock Success | veQS Lock | ✅ |
| 6 | 03_delegate_list.html | Delegate List | Delegation | ✅ |
| 7 | 03_delegate_detail.html | Delegate Detail | Delegation | ✅ |
| 8 | 03_delegate_form.html | Delegate Form | Delegation | ✅ |
| 9 | 04_rewards_dashboard.html | Rewards Dashboard | Rewards | ✅ |
| 10 | 04_claim_rewards.html | Claim Rewards | Rewards | ✅ |

**Total**: 10 screens (100% of P0 requirement)

---

## 🔗 Navigation Map

```
Token Hub Navigation Structure
==============================

[Dashboard] ─────────────────────────────────────────────────────┐
     │                                                            │
     ├──► [Lock Form] ──► [Lock Preview] ──► [Lock Confirm] ──► [Lock Success]
     │                                                            │
     ├──► [Delegate List] ──► [Delegate Detail] ──► [Delegate Form]
     │                                                            │
     └──► [Rewards Dashboard] ──► [Claim Rewards]                 │
                                                                  │
                                              All success pages ──┘
```

---

## 🖱️ Interaction Matrix

### Global Navigation (All Pages)
| Element | Action | Target |
|---------|--------|--------|
| Logo | click | 01_dashboard.html |
| Nav - Dashboard | click | 01_dashboard.html |
| Nav - Lock | click | 02_lock_form.html |
| Nav - Delegate | click | 03_delegate_list.html |
| Nav - Rewards | click | 04_rewards_dashboard.html |

### 01_dashboard.html
| Element | Action | Target |
|---------|--------|--------|
| Lock More QS | click | 02_lock_form.html |
| Extend Lock | click | 02_lock_form.html |
| Delegate Power | click | 03_delegate_list.html |
| Claim Rewards | click | 04_rewards_dashboard.html |
| Delegate cards | click | 03_delegate_detail.html |

### 02_lock_form.html
| Element | Action | Target |
|---------|--------|--------|
| Quick amount buttons | click | JavaScript setAmount() |
| Period buttons | click | JavaScript setPeriod() |
| Period slider | input | JavaScript updatePeriod() |
| Continue to Preview | click | 02_lock_preview.html |
| Cancel | click | 01_dashboard.html |

### 02_lock_preview.html
| Element | Action | Target |
|---------|--------|--------|
| Back to Edit | click | 02_lock_form.html |
| Edit Amount | click | 02_lock_form.html |
| Confirm Lock | click | 02_lock_confirm.html |

### 02_lock_confirm.html
| Element | Action | Target |
|---------|--------|--------|
| Back | click | 02_lock_preview.html |
| Checkbox items | click | JavaScript toggleCheck() |
| Cancel | click | 02_lock_preview.html |
| Lock QS | click | 02_lock_success.html (when enabled) |

### 02_lock_success.html
| Element | Action | Target |
|---------|--------|--------|
| Transaction link | click | External (Etherscan) |
| Delegate My veQS | click | 03_delegate_list.html |
| Back to Dashboard | click | 01_dashboard.html |
| Share buttons | click | External (Twitter, etc.) |

### 03_delegate_list.html
| Element | Action | Target |
|---------|--------|--------|
| Delegate cards | click | 03_delegate_detail.html |
| Filter buttons | click | JavaScript (filter) |
| Search | input | JavaScript (search) |

### 03_delegate_detail.html
| Element | Action | Target |
|---------|--------|--------|
| Back to Delegates | click | 03_delegate_list.html |
| Quick buttons | click | JavaScript setAmount() |
| Delegate button | click | 03_delegate_form.html |
| Link badges | click | External links |

### 03_delegate_form.html
| Element | Action | Target |
|---------|--------|--------|
| Cancel | click | 03_delegate_detail.html |
| Confirm Delegation | click | JavaScript confirmDelegate() → Success state |
| Back to Dashboard | click | 01_dashboard.html |

### 04_rewards_dashboard.html
| Element | Action | Target |
|---------|--------|--------|
| Claim Rewards | click | 04_claim_rewards.html |
| History items | click | (expandable) |

### 04_claim_rewards.html
| Element | Action | Target |
|---------|--------|--------|
| Option items | click | JavaScript selectOption() |
| Cancel | click | 04_rewards_dashboard.html |
| Claim button | click | JavaScript claimRewards() → Success state |
| Transaction link | click | External (Etherscan) |
| Back to Dashboard | click | 01_dashboard.html |

---

## ✅ Link Validation

All links validated - **NO `href="#"` placeholders**

| Status | Count | Description |
|:------:|:-----:|-------------|
| ✅ | 42 | Valid internal links |
| ✅ | 6 | Valid external links (Etherscan, Twitter) |
| ✅ | 15 | JavaScript interactions |
| ❌ | 0 | Placeholder links |

---

## 🎨 Design System Compliance

### Colors Used
| Token | Value | Usage |
|-------|-------|-------|
| --accent-hinomaru | #BC002D | Primary CTA, brand accent |
| --accent-gold | #C9A962 | veQS highlight, secondary CTA |
| --success | #00C896 | Success states, positive indicators |
| --warning | #F0A030 | Warnings (NOT orange-red) |
| --bg-primary | #0A0A0C | Page background |
| --bg-card | #0E0E11 | Card backgrounds |

### Typography
- Display/Headings: Plus Jakarta Sans
- Body: Plus Jakarta Sans + Noto Sans JP
- Mono (numbers): DM Mono

### Components
- ✅ Logo with rotating gold ring (25s animation)
- ✅ Hinomaru pulse effect on hero elements
- ✅ Pill navigation with active states
- ✅ Card hover effects with gold accent
- ✅ SVG charts with gold gradients
- ✅ Progress bars with gradient fills
- ✅ Form inputs with gold focus states

---

## 📱 Responsive Breakpoints

| Breakpoint | Layout Changes |
|------------|----------------|
| > 900px | Full 2-column layout |
| 768-900px | Single column, adjusted grids |
| < 768px | Mobile stack, full-width components |

---

## 🔒 veToken Economics (Reference)

Formula: `veQS = QS × (lock_period / 4_years)`

| Lock Period | Multiplier | Example (5,000 QS) |
|-------------|------------|-------------------|
| 1 week | 0.48% | 24 veQS |
| 3 months | 6.25% | 312 veQS |
| 6 months | 12.5% | 625 veQS |
| 1 year | 25% | 1,250 veQS |
| 2 years | 50% | 2,500 veQS |
| 4 years | 100% | 5,000 veQS |

---

## 📂 File Size Summary

| File | Size |
|------|-----:|
| 01_dashboard.html | 37 KB |
| 02_lock_form.html | 31 KB |
| 02_lock_preview.html | 20 KB |
| 02_lock_confirm.html | 18 KB |
| 02_lock_success.html | 12 KB |
| 03_delegate_list.html | 24 KB |
| 03_delegate_detail.html | 18 KB |
| 03_delegate_form.html | 13 KB |
| 04_rewards_dashboard.html | 20 KB |
| 04_claim_rewards.html | 14 KB |
| **Total** | **207 KB** |

---

## ✅ Checklist

- [x] 10 P0 screens complete
- [x] CORE_PRINCIPLES.md compliance
- [x] UI_DESIGN_GUIDELINES.md compliance
- [x] All navigation links validated
- [x] No href="#" placeholders
- [x] Responsive design implemented
- [x] Japanese labels included
- [x] veToken economics implemented correctly
- [x] Success/error states included
- [x] Gas estimation displayed
- [x] Interaction documentation complete

---

**END OF MANIFEST**
