# Current Plan

> **Generated**: 2025-12-31 23:45 JST
> **Phase**: 3 - L3 + Token + 完全分散化
> **Sub-Phase**: 3.1 Foundation
> **担当エージェント**: PM (計画) → Engineer (実装)
> **モード**: 計画 (Planner)

---

## 対象チェックリスト

`docs/checklists/phase3.1.md`

---

## 仕様書参照（必須）

> 参照: `docs/planning/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence

| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| #1 Lock | Core | SEQUENCES §1 - Lock操作のSTARK検証 |
| #2 Unlock (Normal) | Core | SEQUENCES §2 - Unlock時のSTARK証明検証 |
| #4 Challenge + Slashing | Core | SEQUENCES §4 - Challenge時のSTARK証明 |

### セキュリティ要件

| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| STARK証明検証 (128-bit security) | CP-1, UNIFIED §暗号 | ICoreVerifier.verifyProof() |
| SHA3-256ベースのハッシュ | CP-1, FIPS 202 | SHA3Hasher統合 |
| バッチ検証最適化 | SEQ#2 | ICoreBatch.verifyBatch() |
| FRI検証 (Low-degree testing) | STARK仕様 | FRIVerifier統合 |

---

## 戦略準拠確認（Phase 3）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提
- [x] アーキテクチャ: Modular (Core/Governance/Token Layer)
- [x] リスク緩和: 段階的統合、既存テスト再利用
- [x] モード制約: Core Layer (常時ON) - Sequence #1-4固定

---

## L3基盤確認（Phase 3のL3関連タスク）

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

- [x] 独自4ノードBFTチェーン前提か - ✅ L3で重い暗号計算、L1で軽量検証
- [x] l3-aegis (Rust) の範囲内か - ✅ SolidityコントラクトはL1/L3ブリッジ
- [x] SEQUENCES v2.0に準拠しているか - ✅ SEQ#1,2,4で使用
- [x] CP-1/CP-5を満たしているか - ✅ SHA3-256, keccak256不使用

---

## IC完全性チェック（Phase 3必須）

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 今回スコープのIC

| IC-ID | Component | タスク | Status |
|-------|-----------|--------|--------|
| IC-2 | L3 Bridge Contract | CORE-002 STARK Verifier統合 | 🟡 In Progress |

### マスタ照合

- [x] 全IC-ID（IC-1〜IC-6）がPHASE3_PLANに対応セクションを持つ
- [x] 欠落ICなし（IC-1完了、IC-4 CORE-001完了）

### タスク紐付け

- [x] 今回スコープの全タスクにIC-IDを付与した (IC-2)
- [x] IC-ID不要タスクは理由を明記した (N/A)

---

## 前回タスク完了記録

> CURRENT_STATE.mdより

| # | タスク | IC | 完了日 | PIR |
|---|--------|-----|--------|-----|
| 1 | CORE-001 State Manager基盤 | IC-4 | 2025-12-31 | ✅ PIR-P3.1-008 PASS |
| 2 | L3-006 4-node local testnet | IC-1 | 2025-12-31 | ✅ PIR-P3.1-007 PASS |

**前回の修正完了事項（CORE-001）**:
- ✅ CP-1修正完了（keccak256 Domain Separator → SHA3-256事前計算値）
- ✅ 32/32テストPASS
- ✅ 11/11エージェントGO（全会一致）

---

## 今回のスコープ

### タスクサマリー

**CORE-002: STARK Verifier統合** (IC-2)

Phase 2で実装されたSTARKVerifierをl3-aegis Core Layerに統合し、
ICoreVerifierインターフェースを通じてアクセス可能にする。

### 実装項目

- [ ] [IMPL-001] ICoreVerifier インターフェース定義 (IC-2)
- [ ] [IMPL-002] CoreVerifier.sol 作成（STARKVerifierラッパー）(IC-2)
- [ ] [IMPL-003] Phase 2 STARKVerifier importパス更新 (IC-2)
- [ ] [IMPL-004] ICoreBatch インターフェース定義 (IC-2)
- [ ] [IMPL-005] CoreBatch.sol 作成（BatchVerifierラッパー）(IC-2)
- [ ] [IMPL-006] Phase 2 BatchVerifier importパス更新 (IC-2)

### テスト項目

- [ ] [TEST-001] ICoreVerifier インターフェーステスト
- [ ] [TEST-002] CoreVerifier 単体テスト（既存テスト移行）
- [ ] [TEST-003] CoreBatch 単体テスト（既存テスト移行）
- [ ] [TEST-004] ガスベンチマークテスト（回帰防止）
- [ ] [TEST-005] 統合テスト（CoreState + CoreVerifier連携）

### CP-1準拠確認項目

- [ ] [CP1-001] STARKVerifier内にkeccak256使用がないことを確認
- [ ] [CP1-002] BatchVerifier内にkeccak256使用がないことを確認
- [ ] [CP1-003] FRIVerifier内にkeccak256使用がないことを確認
- [ ] [CP1-004] 全Domain SeparatorがSHA3-256事前計算値であることを確認

### 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §3, §5, §10 |
| Sequence仕様 | `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | #1, #2, #4 |
| 全体仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | §IC |
| Phase 2統合計画 | `docs/planning/PHASE2_INTEGRATION_PLAN.md` | §3, §4, §7 |
| L3基盤決議 | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` | 全体 |
| Phase 3.1チェックリスト | `docs/checklists/phase3.1.md` | CORE-002 |

---

## 成果物

| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `l3-aegis/src/interfaces/ICoreVerifier.sol` | STARK検証インターフェース | IC-2 |
| `l3-aegis/src/interfaces/ICoreBatch.sol` | バッチ検証インターフェース | IC-2 |
| `l3-aegis/src/core/CoreVerifier.sol` | STARK検証実装 | IC-2 |
| `l3-aegis/src/core/CoreBatch.sol` | バッチ検証実装 | IC-2 |
| `l3-aegis/test/CoreVerifier.t.sol` | CoreVerifierテスト | - |
| `l3-aegis/test/CoreBatch.t.sol` | CoreBatchテスト | - |
| `l3-aegis/test/CoreVerifierIntegration.t.sol` | 統合テスト | - |

---

## 実行順序

### Phase 1: インターフェース定義（〜2h）

1. `ICoreVerifier.sol` インターフェース作成
   - `verifyProof(STARKProof, bytes32 publicInput)` 
   - `verifyTraceEvaluationsBatch(...)`
   - `securityLevel()` 

2. `ICoreBatch.sol` インターフェース作成
   - `verifyBatch(...)`
   - `verifySTARKBatch(...)`
   - `MAX_BATCH_SIZE()`

### Phase 2: ラッパー実装（〜4h）

3. `CoreVerifier.sol` 作成
   - STARKVerifierをinternalでインポート
   - ICoreVerifierインターフェース実装
   - CP-1準拠確認（keccak256不使用）

4. `CoreBatch.sol` 作成
   - BatchVerifierをinternalでインポート
   - ICoreBatchインターフェース実装
   - CP-1準拠確認

### Phase 3: importパス更新（〜2h）

5. Phase 2 STARKVerifier関連ファイルのimportパス更新
   - `crypto/` への統一
   - 依存関係整理

6. Phase 2 BatchVerifier関連ファイルのimportパス更新

### Phase 4: テスト（〜8h）

7. 既存テストの移行・修正
   - `STARKVerifier.t.sol` → `CoreVerifier.t.sol`
   - `BatchVerifier.t.sol` → `CoreBatch.t.sol`

8. 新規統合テスト作成
   - `CoreVerifierIntegration.t.sol`
   - CoreState + CoreVerifier連携テスト

9. ガスベンチマークテスト
   - Phase 2ベースラインとの比較
   - 回帰チェック

### Phase 5: 検証・PIR準備（〜2h）

10. 全テスト実行・PASS確認
11. Slither静的解析
12. PIR準備（コード・テスト結果まとめ）

---

## Core Principles確認

- [ ] CP-1: 完全量子耐性 - ✅ SHA3-256, SPHINCS+のみ使用、keccak256/SHA-256/ECDSA不使用
- [ ] CP-2: Self-Custody - N/A（本タスクに影響なし）
- [ ] CP-3: Time Lock存在 - N/A（本タスクに影響なし）
- [ ] CP-4: Slashing存在 - N/A（本タスクに影響なし）
- [ ] CP-5: 透明性 - ✅ 全検証操作がオンチェーンで検証可能

---

## Modular Architecture確認（Phase 3）

- [x] Core Layer: CP保護機構含む（CORE-003で実装予定）
- [x] Governance Layer: ON/OFF切替可能（PLUG-001で実装予定）
- [x] Token Layer: ON/OFF切替可能（PLUG-002で実装予定）
- [x] Layer間依存: 下位→上位依存なし（Core Layerは独立）

---

## ガスターゲット

> 参照: `docs/planning/PHASE2_INTEGRATION_PLAN.md` §6

| 操作 | Phase 2ベースライン | ターゲット | 備考 |
|------|-------------------|-----------|------|
| `verifyProof()` | ~300K gas | <400K gas | ラッパーオーバーヘッド許容 |
| `verifyBatch(10)` | TBD | <40%削減 | バッチ効率維持 |
| `SHA3Hasher.hash()` | ~1M gas | 維持 | L3実行前提 |

---

## リスク・懸念事項

| # | リスク | 重要度 | 対策 |
|---|--------|:------:|------|
| 1 | importパス変更による既存テスト破損 | 🔴 High | 段階的移行、CI検証 |
| 2 | keccak256の残存（CP-1違反） | 🔴 Critical | grep検索、静的解析で確認 |
| 3 | インターフェース互換性問題 | 🟠 Medium | 既存シグネチャ維持 |
| 4 | ガス回帰 | 🟡 Low | GasRegressionTestで検出 |

---

## 見積もり工数

| フェーズ | 工数 |
|---------|------|
| インターフェース定義 | 2h |
| ラッパー実装 | 4h |
| importパス更新 | 2h |
| テスト | 8h |
| 検証・PIR準備 | 2h |
| **合計** | **18h** |

---

## 次のステップ

1. 本計画に従い`02_spec.md`で仕様確認
2. `03_impl.md`で実装実行
3. `04_review.md`でセキュリティレビュー
4. `05_pir.md`でPIR-P3.1-009実施
5. CORE-002完了後、CORE-003 CP保護機構実装へ

---

**END OF CURRENT PLAN**
