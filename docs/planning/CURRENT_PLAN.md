# Current Plan

> **Generated**: 2025-12-25 11:35 JST
> **Phase**: 1 - Foundation Bootstrap
> **Day**: 13 (14日間修正計画)
> **Updated**: CEO判断によりSPHINCS+-SHAKE-128s移行を追加

## 対象チェックリスト
`docs/planning/checklists/phase1_day11-14_qa.md`

## 前回レビュー課題（該当時のみ）

> CURRENT_STATE.mdより自動取得

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| 1 | 🔴 High | SPHINCS+形式検証なし | **Day 13で対応（今回スコープ）** |
| 2 | 🔴 High | SPHINCS+-SHA2→SHAKE移行 | **CEO判断により追加（今回スコープ）** |
| 3 | 🟠 Medium | keccak256使用箇所残存 | **Day 13で対応（今回スコープ）** |
| 4 | 🟢 Low | Compiler Warnings (未使用変数) | Phase 2で対応（今回スコープ外） |

> **Note**: Day 12までの他課題は解決済み（PIR-009 PASS）
> **CEO判断 (2025-12-25)**: 
> - SPHINCS+-SHA2-128s → SPHINCS+-SHAKE-128s移行
> - keccak256 → SHA3-256変更

## 今回のスコープ

### 🔴 最優先: SPHINCS+-SHAKE-128s移行 (CEO決定)

#### Step 0: SHA3/SHAKE256ライブラリ準備
- [ ] [SHAKE-001] Solidity用SHA3-256/SHAKE256ライブラリ調査
- [ ] [SHAKE-002] ライブラリ実装または既存ライブラリ導入
- [ ] [SHAKE-003] 単体テスト作成・PASS確認

#### Step 1: SPHINCSVerifier.sol改修
- [ ] [SHAKE-004] `_computeDigest()` sha256→SHAKE256
- [ ] [SHAKE-005] `_computeFORSTreeRoot()` sha256→SHAKE256
- [ ] [SHAKE-006] `_hashFORSRoots()` sha256→SHAKE256
- [ ] [SHAKE-007] `_computeWOTSChain()` sha256→SHAKE256
- [ ] [SHAKE-008] `_compressWOTSPublicKey()` sha256→SHAKE256
- [ ] [SHAKE-009] `_climbMerkleTree()` sha256→SHAKE256
- [ ] [SHAKE-010] `computePublicKeyHash()` keccak256→SHA3-256
- [ ] [SHAKE-011] コメント・ドキュメント更新（SHA2→SHAKE）

#### Step 2: テスト更新
- [ ] [SHAKE-012] 既存SPHINCSテストのハッシュ期待値更新
- [ ] [SHAKE-013] SPHINCS+-SHAKE-128s用KATベクター取得
- [ ] [SHAKE-014] 全テスト実行・PASS確認

### 🟠 高優先: SPHINCS+ Lean4形式検証 (FV-SPHINCS)

#### Lean4証明作成（SHAKE版）
- [ ] [FV-001] Lean4 SPHINCSプロジェクト構造作成（`proofs/lean4/SPHINCS_SHAKE.lean`）
- [ ] [FV-002] WOTS+チェーン計算の正当性証明（SHAKE256ベース）
- [ ] [FV-003] FORSツリールート計算の正当性証明
- [ ] [FV-004] Merkleツリー認証パス検証の正当性証明
- [ ] [FV-005] 全証明からsorry排除（0件確認）

#### Solidity-Lean4整合性検証
- [ ] [FV-006] SPHINCS+-SHAKE定数のSolidity実装確認
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

#### NIST KAT対応（SHAKE版）
- [ ] [FV-009] SPHINCS+-SHAKE KATテストベクター取得（NIST公式）
- [ ] [FV-010] KATテスト実装（10+ベクター）
- [ ] [FV-011] 全ベクターPASS確認

### 🟡 標準優先: 外部レビュー準備

#### Red Teamレビュー項目
- [ ] [RED-001] 攻撃ベクトル分析
- [ ] [RED-002] DoSシナリオテスト
- [ ] [RED-003] リエントランシー確認（Slither結果の再確認）
- [ ] [RED-004] フロントランニング分析
- [ ] [RED-005] オラクル操作リスク（Chainlink VRF）

#### 暗号数学レビュー項目
- [ ] [CRYPTO-001] Dilithium実装確認（Lean4形式検証済み ✅）
- [ ] [CRYPTO-002] **SPHINCS+-SHAKE実装確認（今回新規）**
- [ ] [CRYPTO-003] SHA3-256/SHAKE256 NIST準拠確認
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
- FIPS 205: SPHINCS+ NIST標準（SHAKE版）
- SPHINCSVerifier: `contracts/src/SPHINCSVerifier.sol`
- **SPEC_REVIEW**: `docs/planning/SPEC_REVIEW.md`（CEO判断詳細）

## 成果物

| ファイル | 説明 |
|---------|------|
| `contracts/src/libraries/SHA3.sol` | **SHA3-256/SHAKE256ライブラリ（新規）** |
| `contracts/src/SPHINCSVerifier.sol` | **SHAKE-128s版に改修** |
| `proofs/lean4/SPHINCS_SHAKE.lean` | **SPHINCS+-SHAKE Lean4形式証明** |
| `proofs/lean4/SPHINCSConstants.lean` | **SPHINCS+定数定義** |
| `scripts/verify_sphincs_constants.sh` | **SPHINCS+整合性検証スクリプト** |
| `test-vectors/PQCsignKAT_SPHINCS_SHAKE.rsp` | **SHAKE版NIST KATベクター** |
| `docs/aegis/pir/PIR-010_SPHINCS_FV.md` | **SPHINCS+形式検証レポート** |
| `docs/aegis/security/ATTACK_VECTORS.md` | 攻撃ベクター分析 |
| `docs/aegis/security/CODE_QUALITY_REPORT.md` | コード品質レポート |

## 実行順序

### Step 1: SHA3/SHAKE256ライブラリ準備 (最優先)

1. **ライブラリ調査**
   - OpenZeppelin SHA3対応確認
   - 既存Solidityライブラリ調査
   - Yul/アセンブリ実装検討

2. **ライブラリ実装**
   ```
   contracts/src/libraries/
   └── SHA3.sol (新規)
       ├── sha3_256(bytes) → bytes32
       └── shake256(bytes, outputLen) → bytes
   ```

3. **単体テスト**
   - NIST公式テストベクター使用
   - Gas cost測定

### Step 2: SPHINCSVerifier.sol改修

1. **ハッシュ関数置換**
   - 全sha256()呼び出しをSHAKE256に置換
   - computePublicKeyHash()をSHA3-256に変更

2. **ドキュメント更新**
   - コントラクトコメント更新
   - NatSpec更新

### Step 3: テスト更新・実行

1. 既存テストのハッシュ期待値更新
2. SHAKE版KATベクター追加
3. 全テストPASS確認

### Step 4: SPHINCS+ Lean4形式検証

1. **Lean4プロジェクト構造拡張**
   ```
   proofs/lean4/
   ├── lakefile.lean (更新)
   ├── NTT.lean (既存 - Dilithium)
   ├── SPHINCS_SHAKE.lean (新規)
   └── SPHINCSConstants.lean (新規)
   ```

2. **WOTS+証明作成**（SHAKE256ベース）
3. **FORS証明作成**
4. **Merkleツリー証明**

### Step 5: 外部レビュー準備

1. 既存セキュリティ成果物の確認
2. 攻撃ベクター分析
3. コード品質レビュー

### Step 6: PIRレビュー

1. PIR-010の実施（SPHINCS+-SHAKE形式検証）
2. CURRENT_STATE.md更新

## Core Principles確認

- [x] CP-1: 完全量子耐性 - **SHAKE256採用でSHA-256禁止を完全遵守**
- [x] CP-2: Self-Custody - 違反なし
- [x] CP-3: Time Lock存在 - 違反なし
- [x] CP-4: Slashing存在 - 違反なし
- [x] CP-5: 透明性 - 違反なし

## リスク・懸念事項

| リスク | 重要度 | 対策 |
|--------|--------|------|
| **SHAKE256 Solidity実装の複雑性** | 🔴 High | 既存ライブラリ調査、必要に応じYul実装 |
| **Gas cost増加の可能性** | 🟠 High | ベンチマーク実施、最適化 |
| SPHINCS+形式検証の複雑性 | 🟡 Medium | Dilithiumのパターンを流用 |
| Lean4 SPHINCS+数学ライブラリ不足 | 🟡 Medium | 必要最小限の補題を自作 |
| NIST KATベクター入手 | 🟢 Low | NIST公式サイトから取得可能 |

## 前提条件

- Day 12完了済み（✅ PIR-009 PASS）
- 全371テストPASS
- Dilithium Lean4形式検証完了（NTT.lean）
- NIST KAT 100ベクターPASS（Dilithium）
- **CEO判断**: SPHINCS+-SHAKE-128s移行承認済み

## Phase 1終了条件（更新）

| 条件 | 基準 | Day 12結果 | Day 13目標 |
|------|------|-----------|-----------|
| Dilithium Lean4形式検証 | sorry 0件 | ✅ | ✅ |
| **SPHINCS+-SHAKE移行** | **実装完了** | ⬜ | **✅ 新規** |
| **SHA3/keccak256排除** | **0件** | ⬜ | **✅ 新規** |
| **SPHINCS+ Lean4形式検証** | **sorry 0件** | ⬜ | **✅ 新規** |
| Dilithium NIST KAT | 10+ベクターPASS | ✅ 100 | ✅ |
| **SPHINCS+-SHAKE NIST KAT** | **10+ベクターPASS** | ⬜ | **✅ 新規** |
| 全テスト | 100% PASS | ✅ 371/371 | ✅ |
| Slither静的解析 | PASS | ✅ | ✅ |

---

**このプランに基づき、03_impl.md → 04_review.md を順次実行してください。**

**SPHINCS+-SHAKE-128s移行により、CP-1（完全量子耐性）がCore Principlesに完全準拠します。**

**END OF CURRENT PLAN**
