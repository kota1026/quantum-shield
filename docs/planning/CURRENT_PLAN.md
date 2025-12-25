# Current Plan

> **Generated**: 2025-12-25 13:30 JST
> **Phase**: 1 - Foundation Bootstrap
> **Day**: 13 (14日間修正計画)

## 対象チェックリスト
`docs/planning/checklists/phase1_day11-14_qa.md`

## 前回レビュー課題（該当時のみ）

> CURRENT_STATE.mdより自動取得

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| 1 | 🔴 High | SPHINCS+形式検証なし | **Day 13で対応（今回スコープ）** |
| 2 | 🟢 Low | Compiler Warnings (未使用変数) | Phase 2で対応（今回スコープ外） |

> **Note**: Day 12までの他課題は解決済み（PIR-009 PASS）
> **CEO判断**: SPHINCS+形式検証をPhase 1に前倒し

## 今回のスコープ

### 🔴 最優先: SPHINCS+形式検証 (FV-SPHINCS)

#### Lean4証明作成
- [ ] [FV-001] Lean4 SPHINCSプロジェクト構造作成（`proofs/lean4/SPHINCS.lean`）
- [ ] [FV-002] WOTS+チェーン計算の正当性証明
- [ ] [FV-003] FORSツリールート計算の正当性証明
- [ ] [FV-004] Merkleツリー認証パス検証の正当性証明
- [ ] [FV-005] 全証明からsorry排除（0件確認）

#### Rust-Lean4整合性検証
- [ ] [FV-006] SPHINCS+定数のRust実装確認
- [ ] [FV-007] Solidity-Lean4定数整合性スクリプト作成
- [ ] [FV-008] 整合性100%確認

| 定数 | Solidity | FIPS 205 | Lean4検証 |
|------|----------|----------|-----------|
| N (security) | 16 | 16 | □ |
| W (Winternitz) | 16 | 16 | □ |
| WOTS_LEN | 35 | 35 | □ |
| FORS_TREES | 14 | 14 | □ |
| FORS_HEIGHT | 12 | 12 | □ |
| SUBTREE_HEIGHT | 9 | 9 | □ |
| D (layers) | 7 | 7 | □ |
| SIGNATURE_SIZE | 7856 | 7856 | □ |

#### NIST KAT対応
- [ ] [FV-009] SPHINCS+ KATテストベクター取得（NIST公式）
- [ ] [FV-010] KATテスト実装（10+ベクター）
- [ ] [FV-011] 全ベクターPASS確認

### Day 13: 外部レビュー準備

#### Red Teamレビュー項目
- [ ] [RED-001] 攻撃ベクトル分析
- [ ] [RED-002] DoSシナリオテスト
- [ ] [RED-003] リエントランシー確認（Slither結果の再確認）
- [ ] [RED-004] フロントランニング分析
- [ ] [RED-005] オラクル操作リスク（Chainlink VRF）

#### 暗号数学レビュー項目
- [ ] [CRYPTO-001] Dilithium実装確認（Lean4形式検証済み ✅）
- [ ] [CRYPTO-002] **SPHINCS+実装確認（今回新規）**
- [ ] [CRYPTO-003] SHA3-256 NIST準拠確認
- [ ] [CRYPTO-004] SR計算正当性
- [ ] [CRYPTO-005] VRF品質確認

#### 成果物作成
- [ ] [DOC-001] セキュリティレビュー資料作成
- [ ] [DOC-002] 攻撃ベクター分析レポート
- [ ] [DOC-003] コード品質レポート

### 参照ドキュメント
- Constitution: `docs/constitution/CORE_PRINCIPLES.md`
- Sequences: `docs/constitution/QUANTUM_SHIELD_SEQUENCES_v2.0_REF.md`
- PIR Routine: `docs/aegis/PIR_CODE_REVIEW_ROUTINE.md`
- PIR-009 (Dilithium FV): `docs/aegis/pir/PIR-009_FORMAL_VERIFICATION.md`
- FIPS 205: SPHINCS+ NIST標準
- SPHINCSVerifier: `contracts/src/SPHINCSVerifier.sol`

## 成果物

| ファイル | 説明 |
|---------|------|
| `proofs/lean4/SPHINCS.lean` | **SPHINCS+ Lean4形式証明** |
| `proofs/lean4/SPHINCSConstants.lean` | **SPHINCS+定数定義** |
| `scripts/verify_sphincs_constants.sh` | **SPHINCS+整合性検証スクリプト** |
| `test-vectors/PQCsignKAT_SPHINCS.rsp` | **NIST KATベクター** |
| `docs/aegis/pir/PIR-010_SPHINCS_FV.md` | **SPHINCS+形式検証レポート** |
| `docs/aegis/security/ATTACK_VECTORS.md` | 攻撃ベクター分析 |
| `docs/aegis/security/CODE_QUALITY_REPORT.md` | コード品質レポート |

## 実行順序

### Step 1: SPHINCS+ Lean4形式検証 (最優先)

1. **Lean4プロジェクト構造拡張**
   ```
   proofs/lean4/
   ├── lakefile.lean (更新)
   ├── NTT.lean (既存 - Dilithium)
   ├── SPHINCS.lean (新規)
   └── SPHINCSConstants.lean (新規)
   ```

2. **WOTS+証明作成**
   - チェーン計算の決定論性
   - チェックサム計算の正当性
   - 公開鍵圧縮の正当性

3. **FORS証明作成**
   - ツリールート計算の正当性
   - 認証パス検証の正当性
   - インデックス抽出の正当性

4. **Merkleツリー証明**
   - 認証パス検証の正当性
   - ルート計算の決定論性

### Step 2: SPHINCS+定数整合性検証

1. 整合性検証スクリプト作成
2. Solidity ↔ Lean4 定数比較
3. FIPS 205準拠確認

### Step 3: NIST KATテスト

1. 公式KATベクター取得
2. テスト実装
3. 全ベクターPASS確認

### Step 4: 外部レビュー準備

1. 既存セキュリティ成果物の確認（Slither、371テスト）
2. 攻撃ベクター分析
3. コード品質レビュー

### Step 5: PIRレビュー

1. PIR-010の実施（SPHINCS+形式検証）
2. CURRENT_STATE.md更新

## Core Principles確認

- [ ] CP-1: 完全量子耐性 - 違反なし（**SPHINCS+形式検証でさらに強化**）
- [ ] CP-2: Self-Custody - 違反なし
- [ ] CP-3: Time Lock存在 - 違反なし
- [ ] CP-4: Slashing存在 - 違反なし
- [ ] CP-5: 透明性 - 違反なし（**Lean4証明を公開リポジトリに格納**）

## リスク・懸念事項

| リスク | 重要度 | 対策 |
|--------|--------|------|
| SPHINCS+形式検証の複雑性 | 🟠 High | Dilithiumのパターンを流用、段階的に実装 |
| Lean4 SPHINCS+数学ライブラリ不足 | 🟡 Medium | 必要最小限の補題を自作 |
| NIST KATベクター入手 | 🟢 Low | NIST公式サイトから取得可能 |

## 前提条件

- Day 12完了済み（✅ PIR-009 PASS）
- 全371テストPASS
- Dilithium Lean4形式検証完了（NTT.lean）
- NIST KAT 100ベクターPASS（Dilithium）

## Phase 1終了条件（更新）

| 条件 | 基準 | Day 12結果 | Day 13目標 |
|------|------|-----------|-----------|
| Dilithium Lean4形式検証 | sorry 0件 | ✅ | ✅ |
| **SPHINCS+ Lean4形式検証** | **sorry 0件** | ⬜ | **✅ 新規** |
| Dilithium NIST KAT | 10+ベクターPASS | ✅ 100 | ✅ |
| **SPHINCS+ NIST KAT** | **10+ベクターPASS** | ⬜ | **✅ 新規** |
| 全テスト | 100% PASS | ✅ 371/371 | ✅ |
| Slither静的解析 | PASS | ✅ | ✅ |

---

**このプランに基づき、02_spec.md → 03_impl.md → 04_review.md を順次実行してください。**

**SPHINCS+形式検証完了により、CP-1（完全量子耐性）の証明がDilithiumとSPHINCS+両方で数学的に保証されます。**

**END OF CURRENT PLAN**
