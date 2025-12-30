# Phase 3.2 Checklist: Token + Implementation

> **期間**: Month 13-15
> **目標**: veQS Token設計・実装 + Governance Layer完全実装 + Multi-Sequencer対応
> **前提**: Phase 3.1 Go/No-Go判定 PASS

---

## 📋 前提条件チェック

- [ ] Phase 3.1 Go/No-Go判定 PASS確認
- [ ] L3 Chain Infrastructure (IC-1) 動作確認
- [ ] Core Layer基盤 (CORE-001〜003) 完了確認
- [ ] Pluggable Layer基盤 (PLUG-001〜003) 完了確認
- [ ] 開発ブランチ更新

---

## 🏗️ Phase 3.2 構造

```
Phase 3.2 Implementation (Month 13-15)
├── Track A: veQS Token (IC-5)
│   └── トークン設計・実装・テスト
│
├── Track B: Governance Layer完全実装
│   └── Security Council、Token Vote、Parameter変更
│
├── Track C: Sequencer拡張 (IC-3)
│   └── Multi-Sequencer対応
│
└── Track D: 統合テスト
    └── Sepolia L3 E2Eテスト
```

---

## 🪙 Track A: veQS Token (IC-5)

> **Reference**: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Token Design
> **IC-ID**: IC-5

### Week 1-2: Token設計

| # | タスク | 担当 | 状態 | PIR |
|---|--------|------|:----:|-----|
| TOKEN-001 | veQS トークン経済設計書作成 | CFO + CBO | ⬜ | - |
| TOKEN-002 | ロック期間・投票力計算式設計 | Engineer | ⬜ | - |
| TOKEN-003 | トークン配分計画確定 | CFO | ⬜ | - |
| TOKEN-004 | Vesting Schedule設計 | Engineer | ⬜ | - |

### Week 3-4: Token実装

| # | タスク | IC | 担当 | 状態 | PIR |
|---|--------|-----|------|:----:|-----|
| TOKEN-005 | IVeQS.sol インターフェース定義 | IC-5 | Engineer | ⬜ | - |
| TOKEN-006 | VeQS.sol 基本実装 | IC-5 | Engineer | ⬜ | - |
| TOKEN-007 | ロック機構実装 (1週間〜4年) | IC-5 | Engineer | ⬜ | - |
| TOKEN-008 | 投票力計算実装 (残期間比例) | IC-5 | Engineer | ⬜ | - |
| TOKEN-009 | Vesting Contract実装 | IC-5 | Engineer | ⬜ | - |

### Week 5-6: Token統合

| # | タスク | IC | 担当 | 状態 | PIR |
|---|--------|-----|------|:----:|-----|
| TOKEN-010 | TokenSwitch.BASIC モード実装 | IC-5 | Engineer | ⬜ | - |
| TOKEN-011 | TokenSwitch.FULL モード実装 | IC-5 | Engineer | ⬜ | - |
| TOKEN-012 | Staking機構実装 | IC-5 | Engineer | ⬜ | - |
| TOKEN-013 | Fee Distribution実装 | IC-5 | Engineer | ⬜ | - |
| TOKEN-014 | Token包括テスト | IC-5 | QA | ⬜ | - |

**Token仕様 (UNIFIED_SPEC §Token Design)**:

| パラメータ | 値 |
|-----------|-----|
| 名称 | $QS (Quantum Shield) |
| 総供給量 | 1,000,000,000 |
| ロック期間 | 1週間〜4年 |
| 最大ブースト | 4倍（4年ロック時） |
| 投票力計算 | QS量 × (残りロック期間 / 最大ロック期間) |

---

## 🏛️ Track B: Governance Layer完全実装

> **Reference**: `docs/planning/SPEC_STRATEGY_BRIDGE.md` §7
> **Reference**: `docs/specs/MODULAR_ARCHITECTURE.md`

### Week 1-2: Security Council実装

| # | タスク | 担当 | 状態 | PIR |
|---|--------|------|:----:|-----|
| GOV-001 | ISecurityCouncil.sol インターフェース | Engineer | ⬜ | - |
| GOV-002 | SecurityCouncil.sol 実装 (9名構成) | Engineer | ⬜ | - |
| GOV-003 | Emergency Pause実装 (5/9承認) | Engineer | ⬜ | - |
| GOV-004 | 緊急アップグレード実装 (7/9承認) | Engineer | ⬜ | - |
| GOV-005 | Council任期管理実装 | Engineer | ⬜ | - |

### Week 3-4: Token Vote実装

| # | タスク | 担当 | 状態 | PIR |
|---|--------|------|:----:|-----|
| GOV-006 | IGovernance.sol インターフェース | Engineer | ⬜ | - |
| GOV-007 | Proposal作成機構実装 | Engineer | ⬜ | - |
| GOV-008 | 投票機構実装 (veQS weighted) | Engineer | ⬜ | - |
| GOV-009 | Quorum検証実装 (4%/8%/15%) | Engineer | ⬜ | - |
| GOV-010 | Time Lock実装 (7日) | Engineer | ⬜ | - |

### Week 5-6: Parameter変更機構

| # | タスク | 担当 | 状態 | PIR |
|---|--------|------|:----:|-----|
| GOV-011 | GovernanceSwitch.DECENTRALIZED 完全実装 | Engineer | ⬜ | - |
| GOV-012 | パラメータ変更 (Token Vote) | Engineer | ⬜ | - |
| GOV-013 | コントラクトアップグレード機構 | Engineer | ⬜ | - |
| GOV-014 | Veto機構実装 (理念違反6/9) | Engineer | ⬜ | - |
| GOV-015 | Governance包括テスト | QA | ⬜ | - |

**Governance仕様 (UNIFIED_SPEC §Governance)**:

| アクション | 必要承認 | Quorum | Time Lock |
|-----------|---------|--------|-----------|
| Emergency Pause | SC 5/9 | - | なし |
| 緊急アップグレード | SC 7/9 | - | 48時間 |
| パラメータ変更 | Token Vote | 4% | 7日 |
| コントラクトアップグレード | Token Vote | 8% | 7日 |
| Council変更 | Token Vote | 15% | 7日 |
| Veto (理念違反) | SC 6/9 | - | - |

---

## ⚙️ Track C: Sequencer拡張 (IC-3)

> **Reference**: `docs/planning/PHASE3_PLAN.md` §2 Sequencer
> **IC-ID**: IC-3

### Week 3-4: Multi-Sequencer対応

| # | タスク | IC | 担当 | 状態 | PIR |
|---|--------|-----|------|:----:|-----|
| SEQ-001 | Sequencer Rotation設計 | IC-3 | Engineer | ⬜ | - |
| SEQ-002 | Multi-Sequencer Registration | IC-3 | Engineer | ⬜ | - |
| SEQ-003 | Sequencer Staking (veQS) | IC-3 | Engineer | ⬜ | - |
| SEQ-004 | Sequencer Selection (VRF) | IC-3 | Engineer | ⬜ | - |
| SEQ-005 | Sequencer Slashing | IC-3 | Engineer | ⬜ | - |

### Week 5-6: Sequencer統合

| # | タスク | IC | 担当 | 状態 | PIR |
|---|--------|-----|------|:----:|-----|
| SEQ-006 | L3→L1 Batch Submission | IC-3 | Engineer | ⬜ | - |
| SEQ-007 | Fee Collection (Sequencer) | IC-3 | Engineer | ⬜ | - |
| SEQ-008 | Sequencer包括テスト | IC-3 | QA | ⬜ | - |

---

## 🧪 Track D: 統合テスト

### Week 7-8: Sepolia L3 E2Eテスト

| # | タスク | 担当 | 状態 | PIR |
|---|--------|------|:----:|-----|
| E2E-001 | Sepolia L3 デプロイ | DevOps | ⬜ | - |
| E2E-002 | veQS Token デプロイ・検証 | Engineer | ⬜ | - |
| E2E-003 | Governance フロー E2E | QA | ⬜ | - |
| E2E-004 | Multi-Sequencer E2E | QA | ⬜ | - |
| E2E-005 | Token Vote E2E | QA | ⬜ | - |
| E2E-006 | Emergency Pause E2E | QA | ⬜ | - |

---

## 📊 Track E: 監査準備

### Week 7-8: 第1回監査準備

| # | タスク | 担当 | 状態 | PIR |
|---|--------|------|:----:|-----|
| AUDIT-001 | 監査会社選定・契約 | Legal + CSO | ⬜ | - |
| AUDIT-002 | 監査スコープ定義 | CSO | ⬜ | - |
| AUDIT-003 | ドキュメント整備 | Engineer | ⬜ | - |
| AUDIT-004 | 内部セキュリティレビュー完了 | Red Team | ⬜ | - |

---

## ✅ Phase 3.2 完了基準

### 必須条件

| # | 基準 | 検証方法 | 状態 |
|---|------|---------|:----:|
| 1 | veQS Token デプロイ・動作 | Sepolia テスト | ⬜ |
| 2 | ロック・投票力計算正常 | 単体テスト | ⬜ |
| 3 | Security Council 9名稼働 | 機能テスト | ⬜ |
| 4 | Token Vote 動作 | E2Eテスト | ⬜ |
| 5 | Multi-Sequencer 3-5稼働 | 統合テスト | ⬜ |
| 6 | 全テスト PASS | `forge test` | ⬜ |
| 7 | 第1回監査開始 | 契約・キックオフ | ⬜ |
| 8 | Slither Critical/High なし | `slither .` | ⬜ |

### 成果物

| # | 成果物 | パス | 状態 |
|---|-------|------|:----:|
| 1 | veQS Token Contract | `l3-aegis/src/token/VeQS.sol` | ⬜ |
| 2 | Vesting Contract | `l3-aegis/src/token/Vesting.sol` | ⬜ |
| 3 | Security Council Contract | `l3-aegis/src/governance/SecurityCouncil.sol` | ⬜ |
| 4 | Governance Contract | `l3-aegis/src/governance/Governance.sol` | ⬜ |
| 5 | TokenSwitch完全実装 | `l3-aegis/src/pluggable/TokenSwitch.sol` | ⬜ |
| 6 | GovernanceSwitch完全実装 | `l3-aegis/src/pluggable/GovernanceSwitch.sol` | ⬜ |
| 7 | 監査レポート (第1回) | `docs/audits/` | ⬜ |
| 8 | Phase 3.3チェックリスト | `docs/checklists/phase3.3.md` | ⬜ |

---

## 🔗 参照ドキュメント

| ドキュメント | パス |
|------------|------|
| Phase 3戦略 | `docs/planning/PHASE3_STRATEGY.md` |
| Phase 3計画 | `docs/planning/PHASE3_PLAN.md` |
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` |
| Modular Architecture | `docs/specs/MODULAR_ARCHITECTURE.md` |
| UNIFIED_SPEC (Token) | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Token |
| UNIFIED_SPEC (Governance) | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Governance |
| Core Principles | `docs/constitution/CORE_PRINCIPLES.md` |

---

## ⚠️ リスク緩和策の進捗 (Phase 3.2)

| # | 緩和策 | Phase 3.2アクション | 状態 |
|---|-------|-------------------|:----:|
| 1 | 複数回監査 | **第1回監査開始** | ⬜ |
| 2 | 段階的TVL | 実装完了 | ⬜ |
| 3 | Bug Bounty | プログラム準備 | ⬜ |
| 4 | 形式検証 | Core Layer検証 | ⬜ |
| 5 | 網羅的テスト | 実装・全PASS | ⬜ |
| 6 | エコシステム | パートナー獲得 | ⬜ |

---

## 📊 IC完全性チェック (Phase 3.2)

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

| IC-ID | Component | Phase 3.2 タスク | Status |
|-------|-----------|------------------|--------|
| IC-3 | Sequencer | SEQ-001〜008 | ⬜ Planning |
| IC-5 | veQS Token | TOKEN-001〜014 | ⬜ Planning |

---

## 📊 進捗サマリー

| Track | 完了/総数 | 状態 |
|-------|:--------:|:----:|
| Track A: veQS Token (IC-5) | 0/14 | ⬜ |
| Track B: Governance Layer | 0/15 | ⬜ |
| Track C: Sequencer (IC-3) | 0/8 | ⬜ |
| Track D: 統合テスト | 0/6 | ⬜ |
| Track E: 監査準備 | 0/4 | ⬜ |
| **総合** | **0/47** | ⬜ |

---

**END OF PHASE 3.2 CHECKLIST**
