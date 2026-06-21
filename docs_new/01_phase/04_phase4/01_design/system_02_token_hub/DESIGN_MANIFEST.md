# Token Hub Design Manifest
## Phase 4 UI Integration - Design Assets

> **Version**: 1.2  
> **Date**: 2026-01-10  
> **Status**: 🟡 PIR Fix In Progress

---

## Overview

- **System**: Token Hub
- **System ID**: 02
- **Directory**: system_02_token_hub
- **Created**: 2026-01-08
- **Last Updated**: 2026-01-10
- **Design System**: Premium Japan v1.0 (UI_DESIGN_GUIDELINES.md)

---

## 📁 File Structure

```
docs_new/01_phase/04_phase4/01_design/system_02_token_hub/
├── README.md
├── DESIGN_BRIEF_token_hub.md
├── DESIGN_MANIFEST.md              ← This file
├── PIR_TOKEN_HUB.md                ← PIR Report (v1.0 FAIL)
└── wip/
    └── mocks/
        ├── 01_dashboard.html       ← PIR Fix #2,#4,#5 完了
        ├── 02_lock_form.html       ← 新規追加（PIR Critical #1 対応）
        ├── 02_lock_preview.html
        ├── 02_lock_confirm.html    ← PIR Fix #3 完了
        ├── 02_lock_success.html
        ├── 03_delegate_list.html
        ├── 03_delegate_detail.html
        ├── 03_delegate_form.html
        ├── 04_rewards_dashboard.html
        └── 04_claim_rewards.html
```

---

## 📊 Screen Coverage Matrix

| # | Screen | File | Status | Notes |
|---|--------|------|:------:|-------|
| **Dashboard** |||||
| 2-1 | Token Hub Dashboard | 01_dashboard.html | ✅ | QS/veQS残高、投票力、veQS計算式ツールチップ追加 |
| **veQS Lock** |||||
| 2-2 | Lock Form | 02_lock_form.html | ✅ | **NEW** Lock入力画面（金額・期間選択） |
| 2-3 | Lock Preview | 02_lock_preview.html | ✅ | 投票力計算プレビュー |
| 2-4 | Lock Confirm | 02_lock_confirm.html | ✅ | 最終確認、早期解除ペナルティ説明追加 |
| 2-5 | Lock Success | 02_lock_success.html | ✅ | 完了画面 |
| **Delegation** |||||
| 2-6 | Delegate List | 03_delegate_list.html | ✅ | Delegate一覧 |
| 2-7 | Delegate Detail | 03_delegate_detail.html | ✅ | Delegate詳細 |
| 2-8 | Delegate Form | 03_delegate_form.html | ✅ | 委任実行 |
| **Rewards** |||||
| 2-9 | Rewards Dashboard | 04_rewards_dashboard.html | ✅ | 報酬サマリー |
| 2-10 | Claim Rewards | 04_claim_rewards.html | ✅ | 報酬請求 |

**Coverage: 10 screens / 18 total (P0 MVP: 56%)**

---

## 🔀 Screen Flow (画面遷移図)

> 10_design_pir.md の QA Auditor が導通確認に使用。全てのリンクがこの図と一致すること。

```mermaid
flowchart LR
    subgraph Dashboard
        01[01_dashboard.html]
    end
    
    subgraph LockFlow["veQS Lock Flow"]
        02a[02_lock_form.html]
        02b[02_lock_preview.html]
        02c[02_lock_confirm.html]
        02d[02_lock_success.html]
    end
    
    subgraph DelegateFlow["Delegation Flow"]
        03a[03_delegate_list.html]
        03b[03_delegate_detail.html]
        03c[03_delegate_form.html]
    end
    
    subgraph RewardsFlow["Rewards Flow"]
        04a[04_rewards_dashboard.html]
        04b[04_claim_rewards.html]
    end
    
    %% Dashboard → Flows
    01 -->|"Lock More QS"| 02a
    01 -->|"Delegate Power"| 03a
    01 -->|"Claim Rewards"| 04a
    01 -->|"Delegate cards"| 03b
    
    %% Lock Flow
    02a -->|"Preview Lock"| 02b
    02b -->|"Continue"| 02c
    02b -->|"Back to Edit"| 02a
    02c -->|"Lock QS"| 02d
    02c -->|"Cancel"| 02b
    02d -->|"Back to Dashboard"| 01
    02d -->|"Delegate My veQS"| 03a
    
    %% Delegation Flow
    03a -->|"Delegate card"| 03b
    03b -->|"Delegate"| 03c
    03c -->|"Back to Dashboard"| 01
    
    %% Rewards Flow
    04a -->|"Claim Rewards"| 04b
    04b -->|"Back to Dashboard"| 01
    
    %% Cancel/Back paths
    02a -->|"Cancel"| 01
    03b -->|"Back"| 03a
    03c -->|"Cancel"| 03b
    04b -->|"Cancel"| 04a
```

---

## 🔗 Link Validation Table

> 全ての `<a>` と主要 `<button>` の遷移先を記録

### Global Navigation (All Pages)

| From | Element | To | Status |
|------|---------|-----|:------:|
| All pages | Logo | 01_dashboard.html | ✅ |
| All pages | Nav - Dashboard | 01_dashboard.html | ✅ |
| All pages | Nav - Lock | 02_lock_form.html | ✅ |
| All pages | Nav - Delegate | 03_delegate_list.html | ✅ |
| All pages | Nav - Rewards | 04_rewards_dashboard.html | ✅ |

### Footer Links (All Pages)

| From | Element | To | Status |
|------|---------|-----|:------:|
| All pages | Terms of Service | ../../../system_01_consumer/wip/mocks/17_terms.html | ✅ |
| All pages | Privacy Policy | ../../../system_01_consumer/wip/mocks/18_privacy.html | ✅ |

### 01_dashboard.html

| From | Element | To | Status |
|------|---------|-----|:------:|
| 01_dashboard.html | "Lock More QS" button | 02_lock_form.html | ✅ |
| 01_dashboard.html | "Extend Lock" button | 02_lock_form.html | ✅ |
| 01_dashboard.html | "Delegate Power" button | 03_delegate_list.html | ✅ |
| 01_dashboard.html | "Claim Rewards" button | 04_rewards_dashboard.html | ✅ |
| 01_dashboard.html | Delegate cards | 03_delegate_detail.html | ✅ |
| 01_dashboard.html | veQS help icon | Tooltip (JS) | ✅ |

### 02_lock_form.html (NEW)

| From | Element | To | Status |
|------|---------|-----|:------:|
| 02_lock_form.html | "Preview Lock" | 02_lock_preview.html | ✅ |
| 02_lock_form.html | Quick amount buttons | JavaScript updateAmount() | ✅ |
| 02_lock_form.html | Duration options | JavaScript updateDuration() | ✅ |

### 02_lock_preview.html

| From | Element | To | Status |
|------|---------|-----|:------:|
| 02_lock_preview.html | "Continue" | 02_lock_confirm.html | ✅ |
| 02_lock_preview.html | "Back to Edit" | 02_lock_form.html | ✅ |
| 02_lock_preview.html | "Cancel" | 01_dashboard.html | ✅ |

### 02_lock_confirm.html

| From | Element | To | Status |
|------|---------|-----|:------:|
| 02_lock_confirm.html | "Cancel" | 02_lock_preview.html | ✅ |
| 02_lock_confirm.html | "Lock QS" | 02_lock_success.html | ✅ |
| 02_lock_confirm.html | Checkbox items | JavaScript checkAll() | ✅ |

### 02_lock_success.html

| From | Element | To | Status |
|------|---------|-----|:------:|
| 02_lock_success.html | "Back to Dashboard" | 01_dashboard.html | ✅ |
| 02_lock_success.html | "Delegate My veQS" | 03_delegate_list.html | ✅ |
| 02_lock_success.html | Transaction link | External (Etherscan) | ✅ |
| 02_lock_success.html | Share buttons | External (Twitter, etc.) | ✅ |

### 03_delegate_list.html

| From | Element | To | Status |
|------|---------|-----|:------:|
| 03_delegate_list.html | Delegate cards | 03_delegate_detail.html | ✅ |
| 03_delegate_list.html | Filter buttons | JavaScript (filter) | ✅ |
| 03_delegate_list.html | Search | JavaScript (search) | ✅ |

### 03_delegate_detail.html

| From | Element | To | Status |
|------|---------|-----|:------:|
| 03_delegate_detail.html | "Back to Delegates" | 03_delegate_list.html | ✅ |
| 03_delegate_detail.html | "Delegate" button | 03_delegate_form.html | ✅ |
| 03_delegate_detail.html | Quick amount buttons | JavaScript setAmount() | ✅ |
| 03_delegate_detail.html | Link badges | External links | ✅ |

### 03_delegate_form.html

| From | Element | To | Status |
|------|---------|-----|:------:|
| 03_delegate_form.html | "Cancel" | 03_delegate_detail.html | ✅ |
| 03_delegate_form.html | "Confirm Delegation" | JavaScript confirmDelegate() → Success | ✅ |
| 03_delegate_form.html | "Back to Dashboard" | 01_dashboard.html | ✅ |

### 04_rewards_dashboard.html

| From | Element | To | Status |
|------|---------|-----|:------:|
| 04_rewards_dashboard.html | "Claim Rewards" | 04_claim_rewards.html | ✅ |
| 04_rewards_dashboard.html | History items | JavaScript (expandable) | ✅ |

### 04_claim_rewards.html

| From | Element | To | Status |
|------|---------|-----|:------:|
| 04_claim_rewards.html | "Cancel" | 04_rewards_dashboard.html | ✅ |
| 04_claim_rewards.html | "Claim" button | JavaScript claimRewards() → Success | ✅ |
| 04_claim_rewards.html | "Back to Dashboard" | 01_dashboard.html | ✅ |
| 04_claim_rewards.html | Transaction link | External (Etherscan) | ✅ |

---

## ✅ Link Validation Summary

| Status | Count | Description |
|:------:|:-----:|-------------|
| ✅ | 48 | Valid internal links |
| ✅ | 6 | Valid external links (Etherscan, Twitter) |
| ✅ | 17 | JavaScript interactions |
| ❌ | 0 | Placeholder links (`href="#"`) |

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
|------|-----:|----------|
| 01_dashboard.html | ~29KB | `wip/mocks/01_dashboard.html` |
| 02_lock_form.html | ~18KB | `wip/mocks/02_lock_form.html` |
| 02_lock_preview.html | 17KB | `wip/mocks/02_lock_preview.html` |
| 02_lock_confirm.html | ~17KB | `wip/mocks/02_lock_confirm.html` |
| 02_lock_success.html | 12KB | `wip/mocks/02_lock_success.html` |
| 03_delegate_list.html | 24KB | `wip/mocks/03_delegate_list.html` |
| 03_delegate_detail.html | 18KB | `wip/mocks/03_delegate_detail.html` |
| 03_delegate_form.html | 12KB | `wip/mocks/03_delegate_form.html` |
| 04_rewards_dashboard.html | 19KB | `wip/mocks/04_rewards_dashboard.html` |
| 04_claim_rewards.html | 13KB | `wip/mocks/04_claim_rewards.html` |
| **Total** | **~179KB** | **10 files** |

---

## 🔒 veToken Economics Reference

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

## ⚠️ Early Unlock Penalty

Formula: `penalty = locked_amount × (remaining_days / original_lock_days) × 50%`

| Remaining Period | Penalty Rate | Example (5,000 QS locked for 2Y) |
|-----------------|--------------|----------------------------------|
| 2 years (100%) | 50% | 2,500 QS |
| 1 year (50%) | 25% | 1,250 QS |
| 6 months (25%) | 12.5% | 625 QS |
| 1 month (~4%) | ~2% | ~100 QS |

---

## PIR Fix Status

| # | 重要度 | 問題 | ファイル | 状態 |
|---|:------:|------|----------|:----:|
| 1 | Critical | 02_lock_form.html存在しない | 02_lock_form.html | ✅ 解決済（すでに存在） |
| 2 | High | 利用規約リンクなし | 01_dashboard.html | ✅ 修正済 |
| 3 | High | 早期解除ペナルティ説明不足 | 02_lock_confirm.html | ✅ 修正済 |
| 4 | Medium | 免責表示なし | 01_dashboard.html | ✅ 修正済 |
| 5 | Medium | veQS計算式説明なし | 01_dashboard.html | ✅ 修正済 |
| 6 | Medium | Screen Flow図更新 | DESIGN_MANIFEST.md | ✅ 修正済 |

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-08 | 1.0 | Initial manifest with 9 P0 screens |
| 2026-01-10 | 1.1 | Structure normalization: moved to root, added mermaid Screen Flow, standardized Link Validation Table |
| 2026-01-10 | 1.2 | PIR Fix: 02_lock_form追加、フッター追加、ペナルティ説明追加、veQS計算式ツールチップ追加 |

---

**END OF MANIFEST**
