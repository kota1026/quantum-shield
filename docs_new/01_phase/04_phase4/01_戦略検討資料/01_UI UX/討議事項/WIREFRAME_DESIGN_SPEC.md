# 🎨 Phase 4 ワイヤーフレーム設計仕様書

> **Version**: 2.0  
> **Date**: 2026年1月5日  
> **Purpose**: Figmaワイヤーフレーム作成のための詳細設計仕様

---

## 1. Figmaプロジェクト構成

### 1.1 ファイル構成

```
Quantum Shield UI/
├── 📁 00. Design System
│   ├── Colors
│   ├── Typography
│   ├── Spacing & Grid
│   ├── Icons
│   └── Components
│
├── 📁 01. Consumer App
│   ├── 1.1 Dashboard
│   ├── 1.2 Lock Flow
│   ├── 1.3 Unlock Flow (Normal)
│   ├── 1.4 Unlock Flow (Emergency)
│   ├── 1.5 History
│   ├── 1.6 Key Management
│   └── 1.7 Settings
│
├── 📁 02. Token Hub
│   ├── 2.1 Dashboard
│   ├── 2.2 veQS Lock/Unlock
│   ├── 2.3 Delegation
│   └── 2.4 Rewards
│
├── 📁 03. Governance
│   ├── 3.1 Proposal List
│   ├── 3.2 Proposal Detail
│   ├── 3.3 Create Proposal
│   ├── 3.4 Voting
│   └── 3.5 My Votes
│
├── 📁 04. Prover Portal
│   ├── 4.1 Registration
│   ├── 4.2 Dashboard
│   ├── 4.3 Signing Queue
│   ├── 4.4 Delegation
│   ├── 4.5 Earnings
│   └── 4.6 Exit Flow
│
├── 📁 05. Explorer
│   ├── 5.1 Home
│   ├── 5.2 Lock Detail
│   ├── 5.3 Unlock Detail
│   ├── 5.4 Prover List
│   └── 5.5 Governance Stats
│
├── 📁 06. Observer/Challenger
│   ├── 6.1 Monitor Dashboard
│   ├── 6.2 Challenge Flow
│   └── 6.3 Results
│
├── 📁 07. Enterprise Admin
│   ├── 7.1 Service Provider Portal
│   │   ├── Dashboard
│   │   ├── Customer Management
│   │   ├── Contract Management
│   │   ├── Billing
│   │   ├── SLA Monitor
│   │   └── Service Control
│   └── 7.2 Customer Portal
│       ├── Dashboard
│       ├── Organization
│       ├── Transactions
│       ├── Settings
│       └── Reports
│
└── 📁 08. Prototypes
    ├── Lock E2E Flow
    ├── Unlock E2E Flow
    ├── Governance Flow
    └── Enterprise Onboarding
```

---

## 2. デザインシステム詳細

### 2.1 カラーパレット

#### Primary Colors (Quantum Blue)

| Name | Hex | Usage |
|------|-----|-------|
| Primary-50 | #E6F4FF | Hover backgrounds |
| Primary-100 | #B3DFFF | Light accents |
| Primary-200 | #80C9FF | Secondary elements |
| Primary-300 | #4DB3FF | Active states |
| Primary-400 | #1A9DFF | Links |
| **Primary-500** | **#0080E6** | **Main brand color** |
| Primary-600 | #0066B3 | Pressed states |
| Primary-700 | #004D80 | Dark accents |
| Primary-800 | #00334D | Text on light |
| Primary-900 | #001A26 | Darkest |

#### Secondary Colors (Shield Purple)

| Name | Hex | Usage |
|------|-----|-------|
| Secondary-50 | #F3E8FF | Hover backgrounds |
| **Secondary-500** | **#7A00E6** | **Accent elements** |
| Secondary-700 | #490080 | Dark accents |

#### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| Success | #22C55E | Positive actions, confirmations |
| Warning | #F59E0B | Cautions, pending states |
| Error | #EF4444 | Errors, destructive actions |
| Info | #3B82F6 | Information, tips |

#### Background Colors (Dark Theme)

| Name | Hex | Usage |
|------|-----|-------|
| BG-Primary | #0A0A0F | Main background |
| BG-Secondary | #12121A | Card backgrounds |
| BG-Tertiary | #1A1A24 | Elevated surfaces |
| BG-Card | #1F1F2E | Interactive cards |

#### Text Colors

| Name | Hex | Usage |
|------|-----|-------|
| Text-Primary | #FFFFFF | Main text |
| Text-Secondary | #A0AEC0 | Supporting text |
| Text-Muted | #6B7280 | Disabled, hints |
| Text-Inverse | #111827 | Text on light backgrounds |

### 2.2 タイポグラフィ

#### Font Families

```
Primary: Inter
Monospace: JetBrains Mono (addresses, hashes, code)
```

#### Type Scale

| Name | Size | Line Height | Weight | Usage |
|------|------|-------------|--------|-------|
| Display | 48px | 1.1 | Bold | Hero sections |
| H1 | 36px | 1.2 | Bold | Page titles |
| H2 | 30px | 1.25 | Semibold | Section titles |
| H3 | 24px | 1.3 | Semibold | Card titles |
| H4 | 20px | 1.4 | Medium | Subsections |
| Body-L | 18px | 1.5 | Regular | Large body |
| Body | 16px | 1.5 | Regular | Default body |
| Body-S | 14px | 1.5 | Regular | Secondary text |
| Caption | 12px | 1.4 | Regular | Labels, hints |
| Overline | 12px | 1.4 | Semibold | Category labels |

### 2.3 スペーシング

```
4px  (space-1)  - Tight spacing
8px  (space-2)  - Default gap
12px (space-3)  - Small padding
16px (space-4)  - Default padding
20px (space-5)  - Medium padding
24px (space-6)  - Section gap
32px (space-8)  - Large gap
40px (space-10) - Section padding
48px (space-12) - Page padding
64px (space-16) - Major sections
```

### 2.4 Grid System

#### Desktop (1440px)

```
Columns: 12
Gutter: 24px
Margin: 80px (each side)
Content Width: 1280px
```

#### Tablet (768px)

```
Columns: 8
Gutter: 16px
Margin: 24px
```

#### Mobile (375px)

```
Columns: 4
Gutter: 16px
Margin: 16px
```

### 2.5 Border Radius

```
None: 0px
SM: 4px    - Buttons, inputs
MD: 8px    - Cards
LG: 12px   - Modals
XL: 16px   - Large cards
Full: 9999px - Pills, avatars
```

### 2.6 Shadows

```
Shadow-SM: 0 1px 2px rgba(0,0,0,0.3)
Shadow-MD: 0 4px 6px rgba(0,0,0,0.3)
Shadow-LG: 0 10px 15px rgba(0,0,0,0.3)
Shadow-XL: 0 20px 25px rgba(0,0,0,0.3)
```

---

## 3. コンポーネントライブラリ

### 3.1 Buttons

#### Primary Button

```
┌────────────────────────┐
│      Connect Wallet    │
└────────────────────────┘

States:
- Default: bg-primary-500, text-white
- Hover: bg-primary-400
- Active: bg-primary-600
- Disabled: bg-gray-600, opacity-50
- Loading: spinner + text

Sizes:
- SM: h-32px, px-12px, text-14px
- MD: h-40px, px-16px, text-16px
- LG: h-48px, px-24px, text-18px
```

#### Secondary Button

```
┌────────────────────────┐
│      View Details      │
└────────────────────────┘

Default: border-primary-500, text-primary-500, bg-transparent
Hover: bg-primary-500/10
```

#### Ghost Button

```
Default: text-primary-500, bg-transparent
Hover: bg-gray-800
```

#### Danger Button

```
Default: bg-error, text-white
Hover: bg-red-600
```

### 3.2 Inputs

#### Text Input

```
┌─────────────────────────────────────┐
│ Label                               │
├─────────────────────────────────────┤
│ Placeholder text                    │
├─────────────────────────────────────┤
│ Helper text or error message        │
└─────────────────────────────────────┘

States:
- Default: border-gray-600
- Focus: border-primary-500, ring-primary-500/20
- Error: border-error, text-error
- Disabled: bg-gray-800, opacity-50
```

#### Amount Input

```
┌─────────────────────────────────────┐
│ Amount                              │
├─────────────────────────────────────┤
│ 0.00              [MAX] [ETH ▼]     │
├─────────────────────────────────────┤
│ ≈ $0.00 USD           Balance: 1.5 │
└─────────────────────────────────────┘
```

#### Address Input

```
┌─────────────────────────────────────┐
│ Destination Address                 │
├─────────────────────────────────────┤
│ 0x... or ENS name          [📋] [📷]│
├─────────────────────────────────────┤
│ ✓ Valid address                     │
└─────────────────────────────────────┘
```

### 3.3 Cards

#### Basic Card

```
┌─────────────────────────────────────┐
│                                     │
│  Card Title                         │
│  ─────────────────────────          │
│                                     │
│  Card content goes here. This can   │
│  include text, images, and other    │
│  components.                        │
│                                     │
│              [Action Button]        │
│                                     │
└─────────────────────────────────────┘

bg-card, border-gray-700, rounded-lg, p-24
```

#### Stats Card

```
┌─────────────────────────────────────┐
│  📊                                 │
│  Total Value Locked                 │
│                                     │
│  $2,450,000                         │
│  ↑ 12.5% from last month            │
└─────────────────────────────────────┘
```

#### Lock Card

```
┌─────────────────────────────────────┐
│  🔒 Lock #12345                     │
│  ─────────────────────────          │
│                                     │
│  Amount:     1.5 ETH                │
│  Status:     🟢 Active              │
│  Locked:     Jan 1, 2026            │
│                                     │
│  [View Details]  [Request Unlock]   │
└─────────────────────────────────────┘
```

### 3.4 Navigation

#### Header

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Logo]    Dashboard  Lock  Unlock  Token  Governance      [🔔] [0x...▼]   │
└─────────────────────────────────────────────────────────────────────────────┘

Height: 64px
bg-bg-secondary
border-bottom: 1px solid gray-700
```

#### Sidebar (Prover/Admin)

```
┌──────────────────┐
│  [Logo]          │
├──────────────────┤
│  📊 Dashboard    │
│  ✍️ Signing      │
│  👥 Delegation   │
│  💰 Earnings     │
│  ⚙️ Settings     │
│                  │
│                  │
├──────────────────┤
│  [Exit Prover]   │
└──────────────────┘

Width: 240px
bg-bg-secondary
```

### 3.5 Status Indicators

#### Status Badge

```
🟢 Active      - bg-success/20, text-success
🟡 Pending     - bg-warning/20, text-warning
🔴 Failed      - bg-error/20, text-error
⚪ Inactive    - bg-gray-600/20, text-gray-400
🔵 Processing  - bg-info/20, text-info
```

#### Progress Bar

```
┌─────────────────────────────────────┐
│ ████████████░░░░░░░░░░░░░░  45%    │
└─────────────────────────────────────┘

Track: bg-gray-700
Fill: bg-primary-500
Height: 8px
Rounded: full
```

#### Countdown Timer

```
┌─────────────────────────────────────┐
│        23:45:30                     │
│     Hours Minutes Seconds           │
│                                     │
│     Release: Jan 2, 2026 15:30     │
└─────────────────────────────────────┘

Large numbers: text-4xl, font-mono
Labels: text-sm, text-muted
```

### 3.6 Modals

#### Basic Modal

```
┌─────────────────────────────────────────────────────────────┐
│  Confirm Transaction                                    [X] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  You are about to lock 1.5 ETH.                            │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Amount:        1.5 ETH                                │ │
│  │ Destination:   0x1234...5678                          │ │
│  │ Fee:           0.00075 ETH (0.05%)                    │ │
│  │ Gas:           ~0.002 ETH                             │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│                    [Cancel]  [Confirm]                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Width: 480px (MD) / 640px (LG)
bg-bg-tertiary
Overlay: bg-black/60
```

### 3.7 Tables

#### Data Table

```
┌────────────────────────────────────────────────────────────────────────────┐
│  [Search...]                            [Filter ▼]  [Sort ▼]  [Export]    │
├────────────────────────────────────────────────────────────────────────────┤
│  ID        │ Amount    │ Status     │ Date        │ Actions              │
├────────────────────────────────────────────────────────────────────────────┤
│  #12345    │ 1.5 ETH   │ 🟢 Active  │ Jan 1, 2026 │ [View] [Unlock]      │
│  #12344    │ 0.8 ETH   │ 🟡 Pending │ Dec 31      │ [View]               │
│  #12343    │ 2.0 ETH   │ ⚪ Unlocked│ Dec 30      │ [View]               │
├────────────────────────────────────────────────────────────────────────────┤
│  Showing 1-10 of 156                            [◀] 1 2 3 ... 16 [▶]     │
└────────────────────────────────────────────────────────────────────────────┘
```

### 3.8 Forms

#### Step Indicator

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ●───────●───────○───────○                                                 │
│  1.Input   2.Preview  3.Sign    4.Complete                                 │
└─────────────────────────────────────────────────────────────────────────────┘

Active: bg-primary-500
Completed: bg-success
Inactive: bg-gray-600
```

---

## 4. 画面設計詳細 - Consumer App

### 4.1 Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Header]                                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Welcome back, 0x1234...5678                                               │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ Total Locked    │  │ Pending Unlocks │  │ Available       │             │
│  │ 5.5 ETH         │  │ 2               │  │ 1.2 ETH         │             │
│  │ ≈ $12,500       │  │                 │  │                 │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ Quick Actions                                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                   │ │
│  │  │  🔒 Lock    │  │  🔓 Unlock  │  │  📜 History │                   │ │
│  │  │  New Lock   │  │  Request    │  │  View All   │                   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  Recent Activity                                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ 🔒 Locked 1.0 ETH                              Jan 5, 2026 10:30 AM  │ │
│  │ 🔓 Unlocked 0.5 ETH                            Jan 4, 2026 3:45 PM   │ │
│  │ ⏱️ Claim Available                              Jan 3, 2026 2:00 PM   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  Active Locks (3)                                         [View All →]      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ Lock #12345     │  │ Lock #12344     │  │ Lock #12343     │             │
│  │ 1.5 ETH         │  │ 2.0 ETH         │  │ 2.0 ETH         │             │
│  │ 🟢 Active       │  │ 🟢 Active       │  │ 🟡 Unlocking    │             │
│  │ [Details]       │  │ [Details]       │  │ [Details]       │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Lock Form

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Header]                                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ← Back to Dashboard                                                        │
│                                                                             │
│  Lock Assets                                                                │
│  Securely lock your assets with quantum-resistant protection               │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Step 1 of 4: Enter Details                                           │ │
│  │  ●───────○───────○───────○                                            │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Asset                                                                │ │
│  │  ┌───────────────────────────────────────────────────────────────┐   │ │
│  │  │  [ETH Logo] Ethereum (ETH)                              [▼]   │   │ │
│  │  └───────────────────────────────────────────────────────────────┘   │ │
│  │                                                                       │ │
│  │  Amount                                                               │ │
│  │  ┌───────────────────────────────────────────────────────────────┐   │ │
│  │  │  1.5                                          [MAX] [ETH]     │   │ │
│  │  └───────────────────────────────────────────────────────────────┘   │ │
│  │  ≈ $3,450.00 USD                              Balance: 5.5 ETH       │ │
│  │                                                                       │ │
│  │  Destination Address                                                  │ │
│  │  ┌───────────────────────────────────────────────────────────────┐   │ │
│  │  │  0x742d35Cc6634C0532925a3b844Bc9e7595f...            [📋][📷] │   │ │
│  │  └───────────────────────────────────────────────────────────────┘   │ │
│  │  ✓ Valid address                                                     │ │
│  │                                                                       │ │
│  │  ┌───────────────────────────────────────────────────────────────┐   │ │
│  │  │  ⚠️ Dilithium Key Required                                     │   │ │
│  │  │  You need a Dilithium key to unlock your assets later.        │   │ │
│  │  │                        [Generate Key] [Import Key]             │   │ │
│  │  └───────────────────────────────────────────────────────────────┘   │ │
│  │                                                                       │ │
│  │                                           [Continue →]               │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Unlock Time Lock

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Header]                                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Unlock #12345                                                              │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Status: 🟡 Time Lock Active                                          │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                     ⏱️ Time Remaining                                 │ │
│  │                                                                       │ │
│  │                      23:45:30                                         │ │
│  │                   Hours  Min   Sec                                    │ │
│  │                                                                       │ │
│  │  ────────────────────────████████████░░░░░░░░░░──────────────────    │ │
│  │                                                                       │ │
│  │           Started                            Release                  │ │
│  │       Jan 4, 15:30                       Jan 5, 15:30                │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Transaction Details                                                  │ │
│  │  Amount           1.5 ETH                                            │ │
│  │  Destination      0x742d35Cc6634C0532925a3b844Bc9e...                │ │
│  │  Lock ID          #12345                                              │ │
│  │  Request TX       0xabc...def [↗]                                    │ │
│  │                                                                       │ │
│  │  Prover Signatures: ✓ Prover A    ✓ Prover B                         │ │
│  │  Challenge Status:  ✓ No challenges                                  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│                           [Claim] (disabled until time lock ends)           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. 画面設計詳細 - Governance

### 5.1 Proposal List

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Header]                                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Governance                                                                 │
│  [Proposals] [Delegates] [My Votes]                      [Create Proposal] │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ Active Proposals│  │ Total Votes     │  │ Your Voting     │             │
│  │ 5               │  │ 8.5M veQS       │  │ Power: 1,250    │             │
│  │                 │  │                 │  │ 0.015% of total │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
│  [All] [Active] [Passed] [Failed] [Search...]       [Filter ▼] [Sort ▼]    │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  QIP-42: Increase Prover Bond to 50 ETH                   🟢 Active   │ │
│  │  ─────────────────────────────────────────────────────────           │ │
│  │  Proposed by: 0x1234...5678    │  Ends in: 2d 14h                    │ │
│  │                                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │  For: 65%  ██████████████████████████░░░░░░░░░░░  Against: 35%  │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  Quorum: 78% of 10M required   │   [View Details] [Vote]             │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  QIP-41: Add USDC Support                                 ✅ Passed   │ │
│  │  Proposed by: 0xabcd...ef12    │  Ended: Jan 3, 2026                 │ │
│  │                                                                       │ │
│  │  Final Result: 82% For / 18% Against                                 │ │
│  │                                               [View Details]          │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Proposal Detail

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Header]                                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ← Back to Proposals                                                        │
│                                                                             │
│  QIP-42: Increase Prover Bond to 50 ETH                                    │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │  🟢 Active    Ends in: 2d 14h 32m                          │           │
│  └─────────────────────────────────────────────────────────────┘           │
│                                                                             │
│  ┌────────────────────────────────┐  ┌────────────────────────────────┐   │
│  │  Voting Progress               │  │  Cast Your Vote                │   │
│  │                                │  │                                │   │
│  │  For: 5.2M veQS (65%)         │  │  Your Power: 1,250 veQS        │   │
│  │  ████████████████░░░░░░░░░░   │  │                                │   │
│  │  Against: 2.8M veQS (35%)     │  │  ┌──────────────────────────┐  │   │
│  │                                │  │  │ ○ For                    │  │   │
│  │  Quorum: 7.8M / 10M (78%)     │  │  │ ○ Against                │  │   │
│  │  ████████████████████░░░░░░   │  │  │ ○ Abstain                │  │   │
│  │                                │  │  └──────────────────────────┘  │   │
│  │  Threshold: 66% required       │  │                                │   │
│  │                                │  │         [Submit Vote]          │   │
│  └────────────────────────────────┘  └────────────────────────────────┘   │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Description                                                          │ │
│  │  ────────────────────────────────────────────────────────────────────│ │
│  │                                                                       │ │
│  │  ## Summary                                                           │ │
│  │  This proposal increases the minimum Prover bond from 32 ETH to      │ │
│  │  50 ETH to improve security and skin-in-the-game.                    │ │
│  │                                                                       │ │
│  │  ## Motivation                                                        │ │
│  │  With increasing TVL, higher bond ensures stronger economic...       │ │
│  │                                                                       │ │
│  │  ## Implementation                                                    │ │
│  │  - Update ProverRegistry.MIN_BOND = 50 ether                         │ │
│  │  - Grace period: 30 days for existing provers                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  Votes Cast (156)                                          [View All →]     │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  0x1234...5678  │  For     │  50,000 veQS  │  Jan 4, 2026            │ │
│  │  0xabcd...ef12  │  Against │  25,000 veQS  │  Jan 4, 2026            │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Create Proposal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Header]                                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Create Proposal                                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  ●───────○───────○───────○                                            │ │
│  │  1.Draft   2.Preview  3.Submit  4.Complete                            │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ⚠️ Requirements                                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  ✓ Minimum 10,000 veQS to create proposal                            │ │
│  │  ✓ Your balance: 15,000 veQS                                         │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Proposal Type                                                        │ │
│  │  ┌───────────────────────────────────────────────────────────────┐   │ │
│  │  │  ○ Parameter Change                                           │   │ │
│  │  │  ○ Token Distribution                                         │   │ │
│  │  │  ○ Protocol Upgrade                                           │   │ │
│  │  │  ○ Emergency Action                                           │   │ │
│  │  │  ○ Other                                                      │   │ │
│  │  └───────────────────────────────────────────────────────────────┘   │ │
│  │                                                                       │ │
│  │  Title                                                                │ │
│  │  ┌───────────────────────────────────────────────────────────────┐   │ │
│  │  │  QIP-XX: [Your proposal title]                                │   │ │
│  │  └───────────────────────────────────────────────────────────────┘   │ │
│  │                                                                       │ │
│  │  Description (Markdown supported)                                     │ │
│  │  ┌───────────────────────────────────────────────────────────────┐   │ │
│  │  │  ## Summary                                                   │   │ │
│  │  │  ...                                                          │   │ │
│  │  │                                                               │   │ │
│  │  │  ## Motivation                                                │   │ │
│  │  │  ...                                                          │   │ │
│  │  └───────────────────────────────────────────────────────────────┘   │ │
│  │                                                                       │ │
│  │  Voting Period                                                        │ │
│  │  ┌───────────────────────────────────────────────────────────────┐   │ │
│  │  │  [3 days] [5 days] [●7 days] [14 days]                       │   │ │
│  │  └───────────────────────────────────────────────────────────────┘   │ │
│  │                                                                       │ │
│  │                          [Cancel]  [Preview →]                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. 画面設計詳細 - Explorer

### 6.1 Explorer Home

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Header - Public]                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Quantum Shield Explorer                                                    │
│  Real-time insights into the quantum-resistant bridge                      │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  [Search Lock ID, TX Hash, Address...]                        [🔍]   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ Total TVL       │  │ Total Locks     │  │ Active Provers  │             │
│  │ $2.4B           │  │ 45,678          │  │ 127             │             │
│  │ ↑ 5.2% (7d)     │  │ ↑ 234 (24h)     │  │                 │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ Pending Unlocks │  │ 24h Volume      │  │ Avg Time Lock   │             │
│  │ 89              │  │ $45.2M          │  │ 23.5 hours      │             │
│  │                 │  │                 │  │                 │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
│  [Locks] [Unlocks] [Provers] [Governance]                                  │
│                                                                             │
│  Recent Transactions                                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Type  │ ID/Hash        │ Amount   │ Status      │ Time              │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │  🔒    │ #45678         │ 15.0 ETH │ 🟢 Active   │ 2 min ago         │ │
│  │  🔓    │ #45677         │ 3.2 ETH  │ 🟡 Time Lock│ 5 min ago         │ │
│  │  🔒    │ #45676         │ 0.5 ETH  │ 🟢 Active   │ 12 min ago        │ │
│  │  🔓    │ #45675         │ 8.0 ETH  │ ✅ Completed│ 15 min ago        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  TVL Over Time                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  $2.5B ┤                                     ╭────────────────        │ │
│  │        │                          ╭─────────╯                         │ │
│  │  $2.0B ┤          ╭───────────────╯                                   │ │
│  │        │    ╭─────╯                                                   │ │
│  │  $1.5B ┤────╯                                                         │ │
│  │        ┼─────────────────────────────────────────────────────────     │ │
│  │         Nov       Dec       Jan                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Lock/Unlock Detail (Public)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Header - Public]                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ← Back to Explorer                                                         │
│                                                                             │
│  Lock #45678                                                    🟢 Active   │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Overview                                                             │ │
│  │                                                                       │ │
│  │  Amount              15.0 ETH                                        │ │
│  │  USD Value           ~$34,500                                        │ │
│  │  Asset               Ethereum (ETH)                                  │ │
│  │  Status              🟢 Locked (Active)                              │ │
│  │                                                                       │ │
│  │  Source Chain        Ethereum Mainnet                                │ │
│  │  Destination Chain   Aegis L3                                        │ │
│  │                                                                       │ │
│  │  Created             Jan 5, 2026 10:30:45 UTC                        │ │
│  │  Created Block       19,234,567                                      │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Addresses                                                            │ │
│  │                                                                       │ │
│  │  From                0x742d35Cc6634C0532925a3b844Bc9e7595f08a5d      │ │
│  │                                                            [📋] [↗]  │ │
│  │                                                                       │ │
│  │  To (L3)             0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063      │ │
│  │                                                            [📋] [↗]  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Cryptographic Proofs                                                 │ │
│  │                                                                       │ │
│  │  Dilithium Public Key                                                │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │ 0x7f8a...b3c4d5e6f7...                                   [📋] │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  State Root (SR_0)                                                   │ │
│  │  0xabc123...def456                                            [📋]  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Transaction History                                                  │ │
│  │                                                                       │ │
│  │  🔒 Lock Created         0x1a2b...3c4d    Jan 5, 10:30:45    [↗]    │ │
│  │  ✅ Confirmed (12 blocks) Block #19234567                            │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. 画面設計詳細 - Observer/Challenger

### 7.1 Monitor Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Sidebar]  │  Observer Dashboard                                           │
│             │  ─────────────────────────────────────────────────────────    │
│  Dashboard  │                                                               │
│  ●Monitor   │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  Challenge  │  │ Pending Unlocks │  │ Suspicious      │  │ Your Challenges ││
│  History    │  │ 89              │  │ 2 ⚠️            │  │ 0               ││
│  Settings   │  │ Being monitored │  │ Need review     │  │ Active          ││
│             │  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│             │                                                               │
│             │  ┌───────────────────────────────────────────────────────────┐│
│             │  │  ⚠️ SUSPICIOUS ACTIVITY DETECTED                          ││
│             │  │  ──────────────────────────────────────────────────────  ││
│             │  │  Unlock #45677: Anomalous signature timing detected      ││
│             │  │  Amount: 3.2 ETH    Risk Score: 72/100                   ││
│             │  │                                                           ││
│             │  │  Anomaly Details:                                         ││
│             │  │  - Prover signed 2 seconds after request                 ││
│             │  │  - Previous avg: 45 seconds                              ││
│             │  │  - Deviation: 95th percentile                            ││
│             │  │                                                           ││
│             │  │  Time to Challenge: 23:45:12                             ││
│             │  │                                                           ││
│             │  │  [Investigate]  [Challenge]  [Dismiss]                   ││
│             │  └───────────────────────────────────────────────────────────┘│
│             │                                                               │
│             │  Active Unlocks Monitoring                                    │
│             │  ┌───────────────────────────────────────────────────────────┐│
│             │  │  ID       │ Amount  │ Time Left │ Risk │ Status          ││
│             │  ├───────────────────────────────────────────────────────────┤│
│             │  │  #45679   │ 1.5 ETH │ 23:45:12  │ Low  │ 🟢 Normal       ││
│             │  │  #45678   │ 8.0 ETH │ 22:10:45  │ Low  │ 🟢 Normal       ││
│             │  │  #45677   │ 3.2 ETH │ 21:30:00  │ High │ ⚠️ Suspicious   ││
│             │  │  #45676   │ 0.5 ETH │ 20:15:30  │ Low  │ 🟢 Normal       ││
│             │  └───────────────────────────────────────────────────────────┘│
│             │                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Challenge Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Sidebar]  │  Submit Challenge                                             │
│             │  ─────────────────────────────────────────────────────────    │
│  Dashboard  │                                                               │
│  Monitor    │  Challenging Unlock #45677                                    │
│  ●Challenge │                                                               │
│  History    │  ┌───────────────────────────────────────────────────────────┐│
│             │  │  Step 1 of 3: Review Unlock Details                       ││
│             │  │  ●───────○───────○                                        ││
│             │  └───────────────────────────────────────────────────────────┘│
│             │                                                               │
│             │  ┌───────────────────────────────────────────────────────────┐│
│             │  │  Unlock Details                                           ││
│             │  │  ────────────────────────────────────────────────────────││
│             │  │  Lock ID:       #45677                                    ││
│             │  │  Amount:        3.2 ETH                                   ││
│             │  │  Requested:     Jan 5, 2026 09:15:00                      ││
│             │  │  Time Lock:     24 hours                                  ││
│             │  │  Expires:       Jan 6, 2026 09:15:00                      ││
│             │  │                                                           ││
│             │  │  Prover Signatures:                                       ││
│             │  │  ✓ Prover A: 0x123...    Signed: 09:15:02 (2s)           ││
│             │  │  ✓ Prover B: 0x456...    Signed: 09:15:45 (45s)          ││
│             │  │                                                           ││
│             │  │  Anomaly: Prover A signed unusually fast                 ││
│             │  └───────────────────────────────────────────────────────────┘│
│             │                                                               │
│             │  ┌───────────────────────────────────────────────────────────┐│
│             │  │  ⚠️ Challenge Requirements                                 ││
│             │  │                                                           ││
│             │  │  Bond Required: 0.5 ETH (MAX(0.5, 3.2 × 5%) = 0.5)       ││
│             │  │  Your Balance:  2.5 ETH                                   ││
│             │  │                                                           ││
│             │  │  If successful: Bond returned + 10% of unlock amount     ││
│             │  │  If failed:     Bond slashed                              ││
│             │  └───────────────────────────────────────────────────────────┘│
│             │                                                               │
│             │  Challenge Reason                                             │
│             │  ┌───────────────────────────────────────────────────────────┐│
│             │  │  ○ Invalid Signature                                      ││
│             │  │  ○ Fraudulent State Transition                            ││
│             │  │  ● Anomalous Prover Behavior                              ││
│             │  │  ○ Other (specify)                                        ││
│             │  └───────────────────────────────────────────────────────────┘│
│             │                                                               │
│             │                    [Cancel]  [Continue →]                     │
│             │                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. 画面設計詳細 - Enterprise Admin

### 8.1 Service Provider Portal - Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Sidebar]          │  Service Provider Dashboard                           │
│                     │  ─────────────────────────────────────────────────    │
│  🏠 Dashboard       │                                                       │
│  👥 Customers       │  ┌─────────────────┐  ┌─────────────────┐             │
│  📋 Contracts       │  │ Total Customers │  │ Total TVL       │             │
│  💳 Billing         │  │ 42              │  │ $2.4B           │             │
│  📊 SLA Monitor     │  │ ↑ 3 (30d)       │  │ ↑ 12.5% (30d)   │             │
│  ⚙️ Service Control │  └─────────────────┘  └─────────────────┘             │
│  🎫 Support         │                                                       │
│  ⚙️ Settings        │  ┌─────────────────┐  ┌─────────────────┐             │
│                     │  │ MRR             │  │ Active Alerts   │             │
│                     │  │ $850K           │  │ 3 ⚠️            │             │
│                     │  │ ↑ 8.2% (MoM)    │  │                 │             │
│                     │  └─────────────────┘  └─────────────────┘             │
│                     │                                                       │
│                     │  SLA Status                                           │
│                     │  ┌───────────────────────────────────────────────────┐│
│                     │  │  Metric          │ Target │ Current │ Status     ││
│                     │  ├───────────────────────────────────────────────────┤│
│                     │  │  Uptime          │ 99.9%  │ 99.95%  │ ✅          ││
│                     │  │  API Response    │ <200ms │ 145ms   │ ✅          ││
│                     │  │  Prover Response │ <5min  │ 2.3min  │ ✅          ││
│                     │  │  Error Rate      │ <0.1%  │ 0.02%   │ ✅          ││
│                     │  └───────────────────────────────────────────────────┘│
│                     │                                                       │
│                     │  Pending Actions                                      │
│                     │  ┌───────────────────────────────────────────────────┐│
│                     │  │  ⚠️ 2 contracts expiring in 30 days              ││
│                     │  │  ⚠️ 1 customer payment overdue                    ││
│                     │  │  ⚠️ 3 support tickets (P2) open                   ││
│                     │  └───────────────────────────────────────────────────┘│
│                     │                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Service Provider Portal - Customer Management

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Sidebar]          │  Customer Management                                  │
│                     │  ─────────────────────────────────────────────────    │
│  🏠 Dashboard       │                                                       │
│  ●👥 Customers      │  [Search...]         [Filter ▼] [Sort ▼] [+ New]     │
│    ├ List          │                                                       │
│    └ Create        │  ┌───────────────────────────────────────────────────┐│
│  📋 Contracts       │  │  Company        │ Status │ Plan       │ TVL      ││
│  ...               │  ├───────────────────────────────────────────────────┤│
│                     │  │  Acme Corp      │ 🟢 Active │ Enterprise │ $120M  ││
│                     │  │  TechStart Inc  │ 🟢 Active │ Growth     │ $45M   ││
│                     │  │  BigBank Ltd    │ 🟡 Suspend│ Enterprise │ $280M  ││
│                     │  │  CryptoEx       │ 🟢 Active │ Starter    │ $8M    ││
│                     │  └───────────────────────────────────────────────────┘│
│                     │                                                       │
│                     │  Customer Detail: Acme Corp                           │
│                     │  ┌───────────────────────────────────────────────────┐│
│                     │  │  [Overview] [Contacts] [Contract] [Usage] [Logs] ││
│                     │  │                                                   ││
│                     │  │  Company Information                              ││
│                     │  │  ────────────────────────────────────────────────││
│                     │  │  Name:      Acme Corporation                      ││
│                     │  │  Industry:  Financial Services                    ││
│                     │  │  Region:    North America                         ││
│                     │  │  Status:    🟢 Active                             ││
│                     │  │                                                   ││
│                     │  │  Contract Summary                                 ││
│                     │  │  ────────────────────────────────────────────────││
│                     │  │  Plan:       Enterprise                           ││
│                     │  │  MRR:        $45,000                              ││
│                     │  │  Start:      Jan 1, 2025                          ││
│                     │  │  End:        Dec 31, 2026                         ││
│                     │  │  Renewal:    Auto                                 ││
│                     │  │                                                   ││
│                     │  │  [Edit] [Suspend] [Contact]                       ││
│                     │  └───────────────────────────────────────────────────┘│
│                     │                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Service Provider Portal - Service Control

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Sidebar]          │  Service Control                                      │
│                     │  ─────────────────────────────────────────────────    │
│  🏠 Dashboard       │                                                       │
│  👥 Customers       │  ┌─────────────────┐  ┌─────────────────┐             │
│  📋 Contracts       │  │ Active Services │  │ Suspended       │             │
│  💳 Billing         │  │ 40              │  │ 2               │             │
│  📊 SLA Monitor     │  └─────────────────┘  └─────────────────┘             │
│  ●⚙️ Service Control│                                                       │
│  🎫 Support         │  Suspended Services                                   │
│                     │  ┌───────────────────────────────────────────────────┐│
│                     │  │  Customer     │ Reason        │ Since   │ Action ││
│                     │  ├───────────────────────────────────────────────────┤│
│                     │  │  BigBank Ltd  │ Payment (60d) │ Dec 5   │ [Restore]│
│                     │  │  SmallCo      │ Policy Viol.  │ Dec 20  │ [Restore]│
│                     │  └───────────────────────────────────────────────────┘│
│                     │                                                       │
│                     │  Suspend Service                                      │
│                     │  ┌───────────────────────────────────────────────────┐│
│                     │  │  Customer                                         ││
│                     │  │  ┌─────────────────────────────────────────────┐  ││
│                     │  │  │  Select customer...                     [▼] │  ││
│                     │  │  └─────────────────────────────────────────────┘  ││
│                     │  │                                                   ││
│                     │  │  Reason                                           ││
│                     │  │  ┌─────────────────────────────────────────────┐  ││
│                     │  │  │  ○ Payment Overdue                          │  ││
│                     │  │  │  ○ Policy Violation                         │  ││
│                     │  │  │  ○ Customer Request                         │  ││
│                     │  │  │  ○ Other                                    │  ││
│                     │  │  └─────────────────────────────────────────────┘  ││
│                     │  │                                                   ││
│                     │  │  Suspension Type                                  ││
│                     │  │  ┌─────────────────────────────────────────────┐  ││
│                     │  │  │  ○ Soft (New locks blocked, unlocks OK)    │  ││
│                     │  │  │  ○ Hard (All operations blocked)           │  ││
│                     │  │  └─────────────────────────────────────────────┘  ││
│                     │  │                                                   ││
│                     │  │  Grace Period: [14] days                          ││
│                     │  │                                                   ││
│                     │  │  ⚠️ Customer will be notified immediately         ││
│                     │  │                                                   ││
│                     │  │                     [Cancel]  [Suspend Service]   ││
│                     │  └───────────────────────────────────────────────────┘│
│                     │                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.4 Customer Portal - Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Sidebar]          │  Dashboard                                            │
│                     │  ─────────────────────────────────────────────────    │
│  🏠 Dashboard       │                                                       │
│  👥 Organization    │  Welcome, Acme Corp                                   │
│  📊 Transactions    │                                                       │
│  ⚙️ Settings        │  ┌─────────────────┐  ┌─────────────────┐             │
│  📈 Reports         │  │ TVL             │  │ Active Locks    │             │
│  📋 Contract        │  │ $120M           │  │ 5,234           │             │
│  🎫 Support         │  │ ↑ 8.5% (7d)     │  │                 │             │
│                     │  └─────────────────┘  └─────────────────┘             │
│                     │                                                       │
│                     │  ┌─────────────────┐  ┌─────────────────┐             │
│                     │  │ Pending Unlocks │  │ 24h Volume      │             │
│                     │  │ 45              │  │ $8.2M           │             │
│                     │  │                 │  │                 │             │
│                     │  └─────────────────┘  └─────────────────┘             │
│                     │                                                       │
│                     │  Service Status: ✅ All Systems Operational           │
│                     │                                                       │
│                     │  Recent Transactions                                  │
│                     │  ┌───────────────────────────────────────────────────┐│
│                     │  │  Type │ ID      │ Amount  │ Status    │ Time     ││
│                     │  ├───────────────────────────────────────────────────┤│
│                     │  │  🔒   │ #78901  │ 50 ETH  │ 🟢 Active │ 10min    ││
│                     │  │  🔓   │ #78900  │ 25 ETH  │ 🟡 Pending│ 1hr      ││
│                     │  │  🔓   │ #78899  │ 100 ETH │ ✅ Done   │ 3hr      ││
│                     │  └───────────────────────────────────────────────────┘│
│                     │                                                       │
│                     │  Quick Links                                          │
│                     │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│                     │  │ 📄 API Docs │  │ 📊 Reports  │  │ 🎫 Support  │   │
│                     │  └─────────────┘  └─────────────┘  └─────────────┘   │
│                     │                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.5 Customer Portal - Organization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Sidebar]          │  Organization                                         │
│                     │  ─────────────────────────────────────────────────    │
│  🏠 Dashboard       │                                                       │
│  ●👥 Organization   │  [Users] [Roles] [API Keys] [SSO]                     │
│    ├ Users         │                                                       │
│    ├ Roles         │  Team Members (12)                     [+ Invite User]│
│    ├ API Keys      │                                                       │
│    └ SSO           │  ┌───────────────────────────────────────────────────┐│
│  📊 Transactions    │  │  Name          │ Email             │ Role │Status││
│  ...               │  ├───────────────────────────────────────────────────┤│
│                     │  │  John Smith    │ john@acme.com     │ Admin│ 🟢   ││
│                     │  │  Jane Doe      │ jane@acme.com     │ Oper │ 🟢   ││
│                     │  │  Bob Wilson    │ bob@acme.com      │ View │ 🟡   ││
│                     │  └───────────────────────────────────────────────────┘│
│                     │                                                       │
│                     │  API Keys (3)                           [+ Create Key]│
│                     │  ┌───────────────────────────────────────────────────┐│
│                     │  │  Name        │ Created   │ Last Used │ Actions   ││
│                     │  ├───────────────────────────────────────────────────┤│
│                     │  │  Production  │ Jan 1     │ 2min ago  │ [Rotate]  ││
│                     │  │  Staging     │ Dec 15    │ 1hr ago   │ [Rotate]  ││
│                     │  │  Dev-Test    │ Dec 1     │ Never     │ [Revoke]  ││
│                     │  └───────────────────────────────────────────────────┘│
│                     │                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. レスポンシブ対応

### 9.1 ブレークポイント別レイアウト

#### Desktop (1440px+)
- 12カラムグリッド
- サイドバー + メインコンテンツ
- 複数カードの横並び

#### Tablet (768px - 1439px)
- 8カラムグリッド
- ハンバーガーメニュー（サイドバー非表示）
- カード2列表示

#### Mobile (< 768px)
- 4カラムグリッド
- ボトムナビゲーション
- カード1列表示
- モーダルはフルスクリーン

### 9.2 モバイル固有の調整

```
┌─────────────────────┐
│  [≡]  Logo  [🔔][👤]│  ← ヘッダー簡略化
├─────────────────────┤
│                     │
│  Dashboard          │
│                     │
│  ┌─────────────────┐│
│  │ Total Locked    ││
│  │ 5.5 ETH         ││
│  └─────────────────┘│
│                     │
│  ┌─────────────────┐│
│  │ Quick Actions   ││
│  │ [Lock] [Unlock] ││
│  └─────────────────┘│
│                     │
│  Active Locks       │
│  ┌─────────────────┐│
│  │ Lock #12345     ││
│  │ 1.5 ETH 🟢      ││
│  └─────────────────┘│
│                     │
├─────────────────────┤
│ [🏠][🔒][🔓][📜][⚙️]│  ← ボトムナビ
└─────────────────────┘
```

---

## 10. インタラクション仕様

### 10.1 アニメーション

| 要素 | トリガー | アニメーション | Duration |
|------|---------|---------------|----------|
| Button | Hover | Scale 1.02 | 150ms |
| Card | Hover | Shadow増加, Y -2px | 200ms |
| Modal | Open | Fade in + Scale 0.95→1 | 200ms |
| Toast | Appear | Slide from right | 300ms |
| Page | Transition | Fade | 200ms |
| Countdown | Tick | Number flip | 100ms |

### 10.2 ローディング状態

```
Button Loading:
┌────────────────────────┐
│   [Spinner] Processing │
└────────────────────────┘

Page Loading:
┌─────────────────────────────────────┐
│                                     │
│         [Large Spinner]             │
│         Loading...                  │
│                                     │
└─────────────────────────────────────┘

Skeleton Loading:
┌─────────────────────────────────────┐
│  ████████████████░░░░░░░░░░         │  ← shimmer effect
│  ████████░░░░░░░░░░░░░░░░░          │
│  ████████████████████░░░░░          │
└─────────────────────────────────────┘
```

### 10.3 エラー状態

```
Inline Error:
┌─────────────────────────────────────┐
│ Amount                              │
├─────────────────────────────────────┤
│ 100 ETH                     [ETH]   │  ← border-error
├─────────────────────────────────────┤
│ ❌ Insufficient balance              │  ← text-error
└─────────────────────────────────────┘

Toast Error:
┌─────────────────────────────────────┐
│ ❌ Transaction Failed                │
│    Gas estimation failed. Try again │
│                            [Dismiss]│
└─────────────────────────────────────┘
```

---

## 11. アクセシビリティ

### 11.1 要件

| 要件 | 対応 |
|------|------|
| WCAG 2.1 AA | 準拠 |
| Keyboard Navigation | 全機能対応 |
| Screen Reader | ARIA labels |
| Color Contrast | 4.5:1 以上 |
| Focus Indicator | Visible ring |
| Motion | Reduced motion対応 |

### 11.2 ARIA Labels

```html
<!-- ボタン -->
<button aria-label="Lock 1.5 ETH to Aegis L3">
  Lock Assets
</button>

<!-- ステータス -->
<span role="status" aria-live="polite">
  Time remaining: 23 hours 45 minutes
</span>

<!-- モーダル -->
<div role="dialog" aria-labelledby="modal-title" aria-modal="true">
  <h2 id="modal-title">Confirm Transaction</h2>
</div>
```

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-05 | 初版作成 |
| 2.0 | 2026-01-05 | Governance, Explorer, Observer/Challenger, Enterprise Admin追加 |

---

**END OF DOCUMENT**
