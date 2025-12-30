# Current Plan

> **Generated**: 2025-01-01 01:00 JST
> **Phase**: 3 - L3 + Token + 完全分散化
> **Sub-Phase**: 3.1 Foundation
> **担当エージェント**: PM (計画) → Engineer (実装)
> **モード**: 計画 (Planner)
> **修正**: 2025-01-01 02_spec.md仕様レビューによりL3決議準拠に修正

---

## ⚠️ 重要な修正（2025-01-01）

**02_spec.md仕様レビューにより以下の重大な矛盾を発見・修正**:

| 項目 | 修正前（誤り） | 修正後（L3決議準拠） |
|------|--------------|-------------------|
| 検証方式 | ZK-STARK証明検証 | **SPHINCS+直接検証** |
| Phase 2資産 | STARKVerifier統合 | **STARKVerifier破棄** |
| ガスコスト | ~300K gas | **~400K gas（SPHINCS+×2）** |

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`
> CEO承認: 2025-01-01

---

## 対象チェックリスト

`docs/checklists/phase3.1.md`

---

## 仕様書参照（必須）

> 参照: `docs/planning/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence

| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| #1 Lock | Core | SEQUENCES §1 - Dilithium署名検証 |
| #2 Unlock (Normal) | Core | SEQUENCES §2 - SPHINCS+ 2/5署名検証 |
| #4 Challenge + Slashing | Core | SEQUENCES §4 - 署名検証・Slash計算 |

### セキュリティ要件

| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| SPHINCS+署名検証 (128-bit) | CP-1, FIPS 205 | ICoreVerifier.verifySPHINCS() |
| SHA3-256ベースのハッシュ | CP-1, FIPS 202 | SHA3Hasher統合 |
| Dilithium署名検証 | CP-1, FIPS 204 | IDilithiumVerifier（将来） |

### L3決議準拠確認（2025-12-28）

| 決議項目 | 内容 | 本タスクでの対応 |
|---------|------|-----------------|
| ZK-STARK | **使用しない** | ✅ STARKVerifier破棄 |
| L1検証 | SPHINCS+直接検証 | ✅ ~400K gas |
| L3構成 | 独自4ノードBFT | ✅ l3-aegis(Rust)は別管理 |

---

## 戦略準拠確認（Phase 3）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提
- [x] アーキテクチャ: Modular (Core/Governance/Token Layer)
- [x] リスク緩和: 段階的統合
- [x] モード制約: Core Layer (常時ON) - Sequence #1-4固定
- [x] **ZK-STARK不使用（L3決議準拠）**

---

## L3基盤確認（Phase 3のL3関連タスク）

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

- [x] 独自4ノードBFTチェーン前提か - ✅ L3で重い暗号計算、L1で軽量検証
- [x] l3-aegis (Rust) の範囲内か - ✅ **Solidityコントラクトはcontracts/に配置**
- [x] **ZK-STARKは使用していないか** - ✅ **使用しない（破棄）**
- [x] SEQUENCES v2.0に準拠しているか - ✅ SEQ#1,2,4で使用
- [x] CP-1/CP-5を満たしているか - ✅ SHA3-256, SPHINCS+, keccak256不使用

---

## IC完全性チェック（Phase 3必須）

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 今回スコープのIC

| IC-ID | Component | タスク | Status |
|-------|-----------|--------|--------|
| IC-2 | L1 Core Verifier | CORE-002 **SPHINCS+ Verifier統合** | 🟡 In Progress |

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

**CORE-002: SPHINCS+ Verifier統合** (IC-2)

L3決議（2025-12-28）に基づき、L1でSPHINCS+署名を直接検証する
ICoreVerifierインターフェースを実装する。

**⚠️ Phase 2のSTARKVerifierは破棄する。**

### 実装項目

- [ ] [IMPL-001] ICoreVerifier インターフェース定義 (IC-2)
- [ ] [IMPL-002] CoreVerifier.sol 作成（SPHINCS+検証ラッパー）(IC-2)
- [ ] [IMPL-003] SPHINCSVerifier.sol 統合（既存crypto/から）(IC-2)
- [ ] [IMPL-004] ICoreBatch インターフェース定義 (IC-2)
- [ ] [IMPL-005] CoreBatch.sol 作成（バッチSPHINCS+検証）(IC-2)
- [ ] [CLEANUP-001] Phase 2 STARKVerifier関連コード削除

### テスト項目

- [ ] [TEST-001] ICoreVerifier インターフェーステスト
- [ ] [TEST-002] CoreVerifier 単体テスト（SPHINCS+検証）
- [ ] [TEST-003] CoreBatch 単体テスト（バッチ検証）
- [ ] [TEST-004] ガスベンチマークテスト（~400K gas/署名確認）
- [ ] [TEST-005] 統合テスト（CoreState + CoreVerifier連携）

### CP-1準拠確認項目

- [ ] [CP1-001] CoreVerifier内にkeccak256使用がないことを確認
- [ ] [CP1-002] SPHINCSVerifier内にkeccak256使用がないことを確認
- [ ] [CP1-003] SHA3Hasher使用を確認
- [ ] [CP1-004] 全Domain SeparatorがSHA3-256事前計算値であることを確認
- [ ] [CP1-005] **STARKVerifier関連コードが完全に削除されていることを確認**

### 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §1.5, §3, §5 |
| Sequence仕様 | `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | #1, #2, #4 |
| 全体仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | §IC |
| **L3基盤決議** | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` | **全体（必読）** |
| Phase 3.1チェックリスト | `docs/checklists/phase3.1.md` | CORE-002 |

---

## 成果物

| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `contracts/src/interfaces/ICoreVerifier.sol` | SPHINCS+検証インターフェース | IC-2 |
| `contracts/src/interfaces/ICoreBatch.sol` | バッチ検証インターフェース | IC-2 |
| `contracts/src/core/CoreVerifier.sol` | SPHINCS+検証実装 | IC-2 |
| `contracts/src/core/CoreBatch.sol` | バッチ検証実装 | IC-2 |
| `contracts/test/CoreVerifier.t.sol` | CoreVerifierテスト | - |
| `contracts/test/CoreBatch.t.sol` | CoreBatchテスト | - |
| `contracts/test/CoreVerifierIntegration.t.sol` | 統合テスト | - |

**注**: SolidityコントラクトはL1用のため `contracts/` に配置。
`l3-aegis/` はRustベースのL3チェーン実装専用。

---

## 実行順序

### Phase 1: STARKVerifier破棄・整理（〜2h）

1. Phase 2 STARKVerifier関連ファイルの特定
   - `contracts/src/stark/` 配下
   - `contracts/test/` 配下のSTARK関連テスト
   
2. 関連コードの削除（または `deprecated/` への移動）
   - STARKVerifier.sol
   - FRIVerifier.sol
   - BatchVerifier.sol（STARK用）
   - 関連テストファイル

### Phase 2: インターフェース定義（〜2h）

3. `ICoreVerifier.sol` インターフェース作成
   - `verifySPHINCS(bytes sig, bytes32 msgHash, bytes pubkey)` 
   - `verifyMultiSPHINCS(...)` (2/5検証用)
   - `securityLevel() returns (uint256)` → 128

4. `ICoreBatch.sol` インターフェース作成
   - `verifyBatch(SignatureData[] sigs)`
   - `MAX_BATCH_SIZE() returns (uint256)` → 10

### Phase 3: SPHINCS+検証実装（〜4h）

5. `CoreVerifier.sol` 作成
   - 既存SPHINCSVerifier.solをinternalでインポート
   - ICoreVerifierインターフェース実装
   - CP-1準拠確認（keccak256不使用）

6. `CoreBatch.sol` 作成
   - CoreVerifierを使用したバッチ検証
   - ICoreBatchインターフェース実装
   - ガス最適化

### Phase 4: テスト（〜6h）

7. CoreVerifier単体テスト
   - SPHINCS+署名検証の正常系・異常系
   - ガス計測（~200K gas/署名を想定）

8. CoreBatch単体テスト
   - バッチ検証の正常系・異常系
   - ガス計測（バッチ効率確認）

9. 統合テスト
   - CoreState + CoreVerifier連携
   - Unlock Sequenceシミュレーション

### Phase 5: 検証・PIR準備（〜2h）

10. 全テスト実行・PASS確認
11. Slither静的解析
12. PIR準備（コード・テスト結果まとめ）

---

## Core Principles確認

- [ ] CP-1: 完全量子耐性 - ✅ SHA3-256, SPHINCS+のみ使用、**keccak256/STARK不使用**
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

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

| 操作 | L3決議ターゲット | 備考 |
|------|-----------------|------|
| `verifySPHINCS()` | ~200K gas | 1署名あたり |
| `verifyMultiSPHINCS(2)` | ~400K gas | 2/5検証（SEQ#2） |
| `SHA3Hasher.hash()` | ~1M gas | L3実行前提 |

**総コスト目安**: ~$25/Unlock（L3決議通り）

---

## リスク・懸念事項

| # | リスク | 重要度 | 対策 |
|---|--------|:------:|------|
| 1 | STARKVerifier削除による依存関係破損 | 🔴 High | grep検索で依存箇所特定、段階的削除 |
| 2 | keccak256の残存（CP-1違反） | 🔴 Critical | grep検索、静的解析で確認 |
| 3 | SPHINCS+検証ガスが想定超過 | 🟠 Medium | 早期ベンチマーク、L3オフロード検討 |
| 4 | 既存テスト破損 | 🟡 Low | CI検証で検出 |

---

## 見積もり工数

| フェーズ | 工数 |
|---------|------|
| STARKVerifier破棄・整理 | 2h |
| インターフェース定義 | 2h |
| SPHINCS+検証実装 | 4h |
| テスト | 6h |
| 検証・PIR準備 | 2h |
| **合計** | **16h** |

---

## 次のステップ

1. ~~本計画に従い`02_spec.md`で仕様確認~~ ✅ 完了（本修正）
2. `03_impl.md`で実装実行
3. `04_review.md`でセキュリティレビュー
4. `05_pir.md`でPIR-P3.1-009実施
5. CORE-002完了後、CORE-003 CP保護機構実装へ

---

**END OF CURRENT PLAN**
