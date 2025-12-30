# Current Plan

> **Generated**: 2025-12-31 22:15 JST
> **Phase**: 3 - L3 + Token + 完全分散化
> **Sub-Phase**: 3.1 Foundation

---

## 対象チェックリスト

`docs/checklists/phase3.1.md`

---

## 仕様書参照（必須）

> 参照: `docs/planning/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence

| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| #1 Lock | Core | SEQUENCES §1 |
| #2 Unlock (Normal) | Core | SEQUENCES §2 |
| #5 Prover Registration | Core + Governance | SEQUENCES §5 |

### セキュリティ要件

| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| SHA3-256ハッシュ | CP-1 / UNIFIED §暗号 | Phase 2 SHA3Hasher統合 |
| ZK-STARK検証 | UNIFIED §State | Phase 2 STARKVerifier統合 |
| Batch処理 | UNIFIED §1000tx/batch | Phase 2 BatchVerifier統合 |

---

## 戦略準拠確認（Phase 3）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提
- [x] アーキテクチャ: Modular (Core/Governance/Token Layer)
- [x] リスク緩和: 段階的TVL上限、監査計画
- [x] モード制約: Core Only → +Governance(CENTRALIZED) 許可

---

## L3基盤確認（Phase 3のL3関連タスク）

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

- [x] 独自4ノードBFTチェーン前提か → ✅ Track A完了
- [x] l3-aegis (Rust) の範囲内か → ✅ 180/180テストPASS
- [x] SEQUENCES v2.0に準拠しているか → ✅
- [x] CP-1/CP-5を満たしているか → ✅ Dilithium-III, SHA3-256, 禁止アルゴリズム不使用

---

## IC完全性チェック（Phase 3必須）

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 今回スコープのIC

| IC-ID | Component | タスク | Status |
|-------|-----------|--------|--------|
| IC-1 | L3 Chain Infrastructure (4-node BFT) | L3-001〜L3-006 | ✅ COMPLETE |
| IC-2 | L3 Bridge Contract | SETUP-003, CORE-001〜003 | 🟡 In Progress |
| IC-4 | State Management (SMT) | CORE-001 | ✅ COMPLETE |

### マスタ照合

- [x] 全IC-ID（IC-1〜IC-6）がPHASE3_PLANに対応セクションを持つ
- [x] 欠落ICなし（IC-1完了済み）

### タスク紐付け

- [x] 今回スコープの全タスクにIC-IDを付与した
- [x] IC-ID不要タスクは理由を明記した

---

## 前回タスク結果

> CORE-001 State Manager基盤 完了 ✅

| 成果物 | 説明 | Status |
|--------|------|:------:|
| `l3-aegis/src/interfaces/ICoreState.sol` | State管理インターフェース | ✅ |
| `l3-aegis/src/core/CoreState.sol` | CoreState実装 | ✅ |
| `l3-aegis/test/CoreState.t.sol` | 包括的テストスイート | ✅ |
| [IMPL-001] ICoreState インターフェース定義 | StateEntry struct, calculateStateRoot(), verifyInclusion() | ✅ |
| [IMPL-002] CoreState.sol 実装 | SHA3-256統合, SMT統合, Domain Separation | ✅ |
| [TEST-001] インターフェーステスト | Constants, Hash functions, State root | ✅ |
| [TEST-002] 統合テスト | Merkle proof, Lock inclusion | ✅ |
| [TEST-003] ガスベンチマーク | Gas計測テスト追加 | ✅ |

### CORE-001 Commits

- `14883a2` feat(CORE-001): Add ICoreState interface
- `6107200` feat(CORE-001): Implement CoreState contract
- `0a067a4` test(CORE-001): Add CoreState comprehensive tests
- `4914b19` fix(CORE-001): Update CoreState import path

---

## 今回のスコープ

### 🎯 対象タスク: CORE-002 STARK Verifier統合

> **担当**: Engineer
> **IC-ID**: IC-2 (L3 Bridge Contract)
> **目的**: Phase 2 STARKVerifierをCore Layerに統合し、ZK証明検証基盤を構築

### 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 統合計画 | `docs/planning/PHASE2_INTEGRATION_PLAN.md` | §2.1, §3 |
| Modular仕様 | `docs/specs/MODULAR_ARCHITECTURE.md` | Core Layer |
| Phase 2 STARK | `contracts/src/STARKVerifier.sol` | 統合対象 |
| Phase 2 FRI | `contracts/src/FRIVerifier.sol` | 統合対象 |

### 実装項目（予定）

- [ ] [IMPL-001] ISTARKVerifier インターフェース定義 (IC-2)
- [ ] [IMPL-002] CoreVerifier.sol 実装 (IC-2)
- [ ] [IMPL-003] Phase 2 STARKVerifier統合 (IC-2)
- [ ] [IMPL-004] 証明検証フロー実装 (IC-2)

### テスト項目（予定）

- [ ] [TEST-001] ISTARKVerifierインターフェーステスト
- [ ] [TEST-002] CoreVerifier統合テスト
- [ ] [TEST-003] ガスベンチマーク

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - SHA3-256使用、禁止アルゴリズム不使用
- [x] CP-2: Self-Custody - 影響なし
- [x] CP-3: Time Lock存在 - Core Layer実装で保証
- [x] CP-4: Slashing存在 - Core Layer実装で保証
- [x] CP-5: 透明性 - State管理オンチェーン検証可能

---

## 成果物（CORE-001完了分）

| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `l3-aegis/src/interfaces/ICoreState.sol` | State管理インターフェース | IC-4 |
| `l3-aegis/src/core/CoreState.sol` | State Manager実装 | IC-4 |
| `l3-aegis/test/CoreState.t.sol` | 包括的テストスイート | IC-4 |

---

## リスク・懸念事項

| # | 懸念 | 重要度 | 対策 |
|---|------|--------|------|
| 1 | ~~SHA3移行によるimport破損~~ | ~~🟠 MEDIUM~~ | ✅ @phase2/ remapping使用 |
| 2 | l3-aegis整合性不一致 | 🟠 MEDIUM | ドメインセパレータ仕様統一（検証済み） |
| 3 | ガス回帰 | 🟡 LOW | GasSnapshot比較（テスト追加済み） |

---

## 次のタスク（CORE-001完了後）

| 優先度 | タスク | IC-ID | 状態 |
|--------|--------|-------|------|
| 🔴 P0 | CORE-002 STARK Verifier統合 | IC-2 | ⏳ Next |
| 🟠 High | CORE-003 CP保護機構実装 | IC-2 | Pending |
| 🟠 High | PLUG-001 Governance Switch実装 | IC-2 | Pending |

---

**END OF CURRENT PLAN**
