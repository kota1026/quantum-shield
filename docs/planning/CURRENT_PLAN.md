# Current Plan

> **Generated**: 2025-12-24 15:00 JST
> **Phase**: 1 - Foundation Bootstrap
> **Day**: 8 (14日間修正計画)

## 対象チェックリスト

`docs/planning/checklists/phase1_day8-10_vrf.md`

---

## 前回レビュー課題（PIR-005より）

> CURRENT_STATE.mdより自動取得

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| 1 | 🔴 Critical | L1Vault SMT検証で`keccak256`使用（CP-1違反リスク） | `_verifySMTProof()`をSHA3_256.hash()に変更 |
| 2 | 🔴 High | Dilithium Lean4形式検証なし | Month 2-3で対応予定 |
| 3 | 🔴 High | SPHINCS+形式検証なし | Phase 2で対応予定 |
| 4 | 🟡 Medium | SHA3-256 Gas最適化（~1.3M） | Day 11で対応予定 |

---

## 今回のスコープ

### 修正項目（レビュー課題より）⚡ 最優先

- [ ] [FIX-001] `_verifySMTProof()`内のkeccak256をSHA3_256.hash()に変更
- [ ] [FIX-002] 既存SMTテストがSHA3-256で合格することを確認
- [ ] [FIX-003] L1VaultIntegrationTestの再実行・確認

### 実装項目

- [ ] [IMPL-001] VRFConsumer.sol作成（Day 8-9チェックリスト）
- [ ] [IMPL-002] VRFConsumerBase継承
- [ ] [IMPL-003] requestRandomWords関数実装
- [ ] [IMPL-004] fulfillRandomWords関数実装
- [ ] [IMPL-005] Prover選出ロジック（2/5閾値）
- [ ] [IMPL-006] 5分タイムアウト実装
- [ ] [IMPL-007] Fallbackメカニズム

### 統合項目

- [ ] [INTEG-001] L1VaultとVRFConsumerの接続
- [ ] [INTEG-002] Unlock時のVRF呼び出し
- [ ] [INTEG-003] Prover署名要求への連携
- [ ] [INTEG-004] Emergency Path切り替え（72h）

### テスト項目

- [ ] [TEST-001] VRF正常系テスト
- [ ] [TEST-002] VRFタイムアウトテスト
- [ ] [TEST-003] Prover選出確率テスト
- [ ] [TEST-004] Fallbackテスト
- [ ] [TEST-005] 境界値テスト（5分±1s）

---

## 参照ドキュメント

| 種類 | パス |
|------|------|
| 憲法 | `docs/constitution/CORE_PRINCIPLES.md` |
| Sequence参照 | `docs/constitution/QUANTUM_SHIELD_SEQUENCES_v2.0_REF.md` (Sequence#2) |
| 詳細仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` |
| SHA3実装 | `contracts/src/libraries/SHA3_256.sol` |
| SMT実装 | `contracts/src/libraries/SparseMerkleTree.sol` |

---

## 成果物

| ファイル | 説明 |
|---------|------|
| `contracts/src/L1Vault.sol` | SMT検証SHA3-256修正版 |
| `contracts/src/VRFConsumer.sol` | VRF統合コントラクト（新規） |
| `contracts/test/VRFConsumer.t.sol` | VRFテスト（新規） |

---

## 実行順序

### Phase A: SMT SHA3-256修正（最優先）

1. `SHA3_256.sol`のimport確認
2. `L1Vault.sol`の`_verifySMTProof()`関数を修正
   ```solidity
   // Before: keccak256(abi.encodePacked(...))
   // After:  SHA3_256.hash(abi.encodePacked(...))
   ```
3. コンパイル確認（`forge build`）
4. 既存テスト実行（`forge test --match-contract L1Vault`）
5. 全テスト合格確認

### Phase B: VRF統合（SMT修正完了後）

6. VRFConsumer.sol作成
7. L1Vault統合
8. VRFテスト作成・実行
9. PIR-005再レビュー

---

## Core Principles確認

- [ ] CP-1: 完全量子耐性 - ⚠️ **keccak256→SHA3-256修正必須**
- [ ] CP-2: Self-Custody - 違反なし
- [ ] CP-3: Time Lock存在 - 違反なし（24h/7日維持）
- [ ] CP-4: Slashing存在 - 違反なし（60/20/20維持）
- [ ] CP-5: 透明性 - 違反なし

---

## リスク・懸念事項

| リスク | 重要度 | 緩和策 |
|--------|--------|--------|
| SHA3-256によるGas増加 | 🟡 Medium | Day 11の最適化フェーズで対応 |
| SMT Proof検証ロジック変更による既存テスト失敗 | 🟠 High | 段階的修正、テスト駆動開発 |
| VRF統合の複雑さ | 🟡 Medium | Chainlink公式ドキュメント参照 |

---

## 特記事項

### PIR-005 CONDITIONAL理由

PIR-005はCONDITIONAL PASSとなっています。主な理由：

1. **L1Vault._verifySMTProof()でkeccak256使用**
   - 場所: L794-804付近
   - 現状: `keccak256(abi.encodePacked(...))`
   - 対策: `SHA3_256.hash(abi.encodePacked(...))`に変更

この修正が完了するまでVRF統合は一時保留し、CP-1準拠を優先します。

---

**END OF CURRENT PLAN**
