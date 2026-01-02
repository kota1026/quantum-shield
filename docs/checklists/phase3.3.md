# Phase 3.3 Checklist: Decentralize + E2E Testing

> **Version**: 1.0  
> **Created**: 2026-01-02  
> **Status**: ⬜ NOT STARTED  
> **Duration**: Week 9-12 (4 weeks)

---

## Overview

Phase 3.3はPhase 3.2で実装したSequencer/veQS Token/Governanceを基盤として、**分散化機能の完成**と**包括的なE2Eテスト**を実施するフェーズです。

### 依存関係

```
Phase 3.2 Implementation (Week 1-8) ✅ COMPLETE
├── IC-3: Sequencer ✅
├── IC-5: veQS Token ✅
└── Governance Layer ✅
      ↓
Phase 3.3 Decentralize + Testing (Week 9-12) ← 現在
├── [A] Decentralize Development (Week 9-10)
│   └── 分散化機能を完成させる
└── [B] E2E Testing (Week 11-12)
    └── 完成したシステムをテスト
      ↓
Phase 4 UI/UX + Audit + Launch (Week 13-16)
```

**重要**: [B] E2E Testingは[A] Decentralize完了後に実施。不完全なシステムのテストは意味がない。

---

## [A] Decentralize Development (Week 9-10)

### DECEN-001: 4BFT Consensus完成

| 項目 | 詳細 |
|------|------|
| **優先度** | 🔴 P0 |
| **依存** | IC-1 L3 Chain (Phase 3.1 ✅) |
| **成果物** | 4-node BFT consensus fully operational |

**タスク**:
- [ ] 4ノードBFT consensus統合テスト
- [ ] Dilithium-III署名統合確認
- [ ] ノード間通信の安定性確認
- [ ] フォールト耐性テスト (f=1)

**完了条件**:
- [ ] 4ノードで安定したコンセンサス達成
- [ ] 1ノード障害時の継続動作確認
- [ ] 全テストPASS

---

### DECEN-002: Security Council (veQS選出)

| 項目 | 詳細 |
|------|------|
| **優先度** | 🔴 P0 |
| **依存** | IC-5 veQS Token (Phase 3.2 ✅), GOV-004 SecurityCouncil (Phase 3.2 ✅) |
| **成果物** | veQS投票によるSecurity Council選出機構 |

**タスク**:
- [ ] SecurityCouncil選出機構実装
- [ ] veQS投票による9メンバー選出
- [ ] 任期・再選ルール実装
- [ ] 5/9, 6/9, 7/9 閾値確認テスト

**完了条件**:
- [ ] veQS保有者による投票でSC選出可能
- [ ] 閾値による権限分離が機能
- [ ] 全テストPASS

---

### DECEN-003: Governance Layer ON/OFF

| 項目 | 詳細 |
|------|------|
| **優先度** | 🟠 High |
| **依存** | PLUG-001 GovernanceSwitch (Phase 3.1 ✅) |
| **成果物** | Governance Layer完全切替機能 |

**タスク**:
- [ ] GovernanceSwitch E2E統合
- [ ] OFF→ON移行シナリオテスト
- [ ] ON→OFF緊急停止シナリオテスト
- [ ] Core Layer独立動作確認

**完了条件**:
- [ ] Governance ON/OFF切替が正常動作
- [ ] OFF時もCore Layer (CP-1~5) が維持
- [ ] 全テストPASS

---

### DECEN-004: Multi-Sequencer対応

| 項目 | 詳細 |
|------|------|
| **優先度** | 🟠 High |
| **依存** | IC-3 Sequencer (Phase 3.2 ✅), SEQ-005 Rotation (Phase 3.2 ✅) |
| **成果物** | 複数Sequencer運用対応 |

**タスク**:
- [ ] Multi-Sequencer rotation統合テスト
- [ ] Sequencer障害時のフェイルオーバー
- [ ] Staking/Slashing統合確認
- [ ] 報酬配分の正確性検証

**完了条件**:
- [ ] 3+ Sequencerでのrotation動作
- [ ] 障害時の自動切替確認
- [ ] 報酬配分が仕様通り
- [ ] 全テストPASS

---

### DECEN-005: Inflation機構実装

| 項目 | 詳細 |
|------|------|
| **優先度** | 🟠 High |
| **依存** | IC-5 veQS Token (Phase 3.2 ✅) |
| **成果物** | 5%→1%漸減インフレーション機構 |

**タスク**:
- [ ] 年間インフレーション計算ロジック実装
- [ ] 5%→1% 4年漸減スケジュール
- [ ] ミント先: Staker報酬 + Treasury
- [ ] インフレーション率クエリ機能

**完了条件**:
- [ ] インフレーション計算が仕様通り
- [ ] 年次ミントが正常動作
- [ ] 全テストPASS

---

### DECEN-006: 5%投票キャップ実装

| 項目 | 詳細 |
|------|------|
| **優先度** | 🟡 Medium |
| **依存** | IC-5 veQS Token (Phase 3.2 ✅), Governor (Phase 3.2 ✅) |
| **成果物** | 単一アドレス投票力上限 |

**タスク**:
- [ ] 5%投票キャップロジック実装
- [ ] Governor統合
- [ ] キャップ超過時の挙動テスト

**完了条件**:
- [ ] 5%以上の投票力が制限される
- [ ] 全テストPASS

---

## [B] E2E Testing & Validation (Week 11-12)

> **前提**: [A] Decentralize Development完了後に実施

### TEST-001: E2E統合テスト

| 項目 | 詳細 |
|------|------|
| **優先度** | 🔴 P0 |
| **依存** | [A] Decentralize全タスク完了 |
| **成果物** | 全Sequence E2Eシナリオ検証 |

**テスト対象Sequence**:

| Sequence | 検証内容 | Priority |
|----------|----------|----------|
| #1 Lock | CoreBridge.lock() E2E | P0 |
| #2 Unlock (Normal) | CoreBridge.unlock() E2E | P0 |
| #3 Emergency Unlock | CoreBridge.emergencyUnlock() E2E | P0 |
| #3' Resync | CoreBridge.resync() E2E | P1 |
| #4 Challenge + Slashing | CoreSlashing.challenge() E2E | P0 |
| #5 Prover Registration | Registration flow E2E | P1 |
| #6 Prover Exit | Exit flow E2E | P1 |
| #7 Governance Proposal | Governor.propose/castVote E2E | P0 |
| #8 Emergency Pause | EmergencyController.pause() E2E | P0 |

**完了条件**:
- [ ] 全Sequence E2E PASS
- [ ] L1↔L3統合動作確認
- [ ] 全レイヤー (Core/Governance/Token) 連携確認

---

### TEST-002: Fuzzテスト拡充

| 項目 | 詳細 |
|------|------|
| **優先度** | 🟠 High |
| **依存** | TEST-001完了 |
| **成果物** | 境界値・異常系テスト |

**テスト対象**:
- [ ] veQS Token: lock/unlock/delegate境界値
- [ ] Governance: propose/vote/execute境界値
- [ ] Sequencer: batch/rotation境界値
- [ ] Slashing: N²×10%計算オーバーフロー検証

**完了条件**:
- [ ] 全Fuzzテスト PASS
- [ ] オーバーフロー/アンダーフロー検出なし

---

### TEST-003: Gas最適化検証

| 項目 | 詳細 |
|------|------|
| **優先度** | 🟠 High |
| **依存** | TEST-001完了 |
| **成果物** | Gas消費量レポート |

**検証項目**:
- [ ] Phase 2比較 (71%削減維持)
- [ ] L3 Bridge操作のGas消費
- [ ] veQS操作のGas消費
- [ ] Governance操作のGas消費

**完了条件**:
- [ ] Phase 2水準維持
- [ ] 閾値超過項目の特定と対策

---

### TEST-004: Slither静的解析

| 項目 | 詳細 |
|------|------|
| **優先度** | 🔴 P0 |
| **依存** | [A] Decentralize全タスク完了 |
| **成果物** | Slither解析レポート |

**コマンド**:
```bash
cd l3-aegis
slither src/ --solc-remaps @openzeppelin=lib/openzeppelin-contracts
```

**完了条件**:
- [ ] High Issue = 0
- [ ] Medium Issue = 0
- [ ] Low/Informational確認済み

---

### TEST-005: セキュリティテスト

| 項目 | 詳細 |
|------|------|
| **優先度** | 🔴 P0 |
| **依存** | TEST-001, TEST-004完了 |
| **成果物** | Red Team検証レポート |

**攻撃ベクトル検証**:
- [ ] Reentrancy攻撃
- [ ] Flash loan攻撃
- [ ] Governance manipulation
- [ ] Time lock bypass試行
- [ ] Emergency bond計算悪用

**完了条件**:
- [ ] 全攻撃ベクトル対策確認
- [ ] Red Team PASS

---

## Go/No-Go判定

### GONOGO-001: PIR-P3.3実施

| 項目 | 詳細 |
|------|------|
| **優先度** | 🔴 P0 |
| **依存** | [A], [B]全タスク完了 |

**レビュー対象**:
- DECEN-001~006
- TEST-001~005

---

### GONOGO-002: Go/No-Go判定会議

| 項目 | 詳細 |
|------|------|
| **優先度** | 🔴 P0 |
| **依存** | GONOGO-001完了 |

**判定基準**:
- 11エージェント投票
- 80点以上でGO
- CP-1~5全準拠

---

### GONOGO-003: 判定書作成

| 項目 | 詳細 |
|------|------|
| **優先度** | 🟠 High |
| **依存** | GONOGO-002完了 |
| **成果物** | `docs/decisions/GONOGO_PHASE3.3_DECENTRALIZE_2026-01-XX.md` |

---

## Progress Summary

| カテゴリ | 完了 | 合計 | 進捗率 |
|---------|:----:|:----:|:------:|
| DECEN | 0 | 6 | 0% |
| TEST | 0 | 5 | 0% |
| GONOGO | 0 | 3 | 0% |
| **合計** | **0** | **14** | **0%** |

---

## CP準拠確認

- [ ] CP-1: 完全量子耐性 - keccak256使用禁止維持
- [ ] CP-2: Self-Custody - ユーザー署名検証維持
- [ ] CP-3: Time Lock - 7日MIN_DELAY (Governance), 24h/7d (Bridge)
- [ ] CP-4: Slashing - Quadratic N²×10%
- [ ] CP-5: 透明性 - 全操作Event発行、L3記録

---

## 次のPhase

Phase 3.3 Go/No-Go判定後、Phase 4 (UI/UX + Audit + Launch)へ移行。

---

**END OF PHASE 3.3 CHECKLIST**
