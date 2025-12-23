# 仕様レビュー結果

## 日時
2025-12-24 15:30 JST

## 対象
CURRENT_PLAN Day 8 スコープ:
- [FIX-001] `_verifySMTProof()` keccak256→SHA3-256移行
- [IMPL-001〜007] VRF統合

## ステータス
✅ ISSUE-001対応済み - VRF統合の実装へ進むこと

---

## 指摘事項

### [ISSUE-001] SMT検証でのkeccak256使用（CP-1違反）

- **リスクレベル**: 🔴 **HIGH**
- **該当原則**: CP-1（完全量子耐性）
- **問題**: 
  - `contracts/src/L1Vault.sol` の `_verifySMTProof()` 関数でkeccak256を使用
  - keccak256は量子コンピュータによるGrover攻撃のリスクあり
  - CORE_PRINCIPLES.md で明示的に禁止されている
- **対策**: SHA3-256（FIPS 202準拠）に置換

#### 現在のコード（問題箇所）

```solidity
function _verifySMTProof(bytes32 leaf, bytes32[] calldata proof, bytes32 root) internal pure returns (bool) {
    bytes32 computedRoot = leaf;
    for (uint256 i = 0; i < proof.length; i++) {
        if (computedRoot < proof[i]) {
            computedRoot = keccak256(abi.encodePacked(computedRoot, proof[i]));  // ❌ CP-1違反
        } else {
            computedRoot = keccak256(abi.encodePacked(proof[i], computedRoot));  // ❌ CP-1違反
        }
    }
    return computedRoot == root;
}
```

#### 修正方針

**Option A: SHA3_256ライブラリ直接使用（推奨）**

```solidity
import {SHA3_256} from "./libraries/SHA3_256.sol";

function _verifySMTProof(bytes32 leaf, bytes32[] calldata proof, bytes32 root) internal pure returns (bool) {
    bytes32 computedRoot = leaf;
    for (uint256 i = 0; i < proof.length; i++) {
        if (computedRoot < proof[i]) {
            computedRoot = SHA3_256.hashPair(computedRoot, proof[i]);
        } else {
            computedRoot = SHA3_256.hashPair(proof[i], computedRoot);
        }
    }
    return computedRoot == root;
}
```

**Option B: SparseMerkleTreeライブラリの関数使用**

既存の`SparseMerkleTree.hashNodes()`を使用する方法もあるが、ドメイン分離が追加されるため、Proof生成側との整合性確認が必要。

- [x] 対応済み
- **対応内容**: Option Aを採用。SHA3_256ライブラリをimportし、`_verifySMTProof()`内のkeccak256をSHA3_256.hashPair()に置換
- **対応コミット**: 8ec31f15f70508e30e7fe60decaa7fdbf2a469fe

---

## VRF統合（IMPL-001〜007）確認結果

### ✅ CP-1〜CP-5違反リスクなし

| 原則 | 計画内容 | 判定 |
|------|----------|------|
| CP-1: 量子耐性 | VRFはDilithium署名と併用 | ✅ 準拠予定 |
| CP-2: Self-Custody | ユーザー鍵保存なし | ✅ 準拠 |
| CP-3: Time Lock | 24h/7日維持 | ✅ 準拠 |
| CP-4: Slashing | 機能削除なし | ✅ 準拠 |
| CP-5: 透明性 | 全操作オンチェーン | ✅ 準拠 |

**結論**: SMT修正完了後に実装を進めてください。

---

## 実装時の注意事項

1. **FIX-001を最優先で実行** ✅ 完了
   - SHA3_256のimportを追加
   - `_verifySMTProof()`内のkeccak256をSHA3_256.hashPair()に置換

2. **テスト実行で整合性確認**
   - 既存L1VaultIntegrationTestの再実行
   - SMT Proofの生成側も確認（テストで生成されるProofがSHA3-256ベースか確認）

3. **VRF統合はSMT修正完了後**
   - HIGHリスク課題が解決したためVRF実装に進行可能

4. **Gas増加の許容**
   - SHA3-256はkeccak256より高コスト
   - Day 11の最適化フェーズで対応予定

---

## Resolution Log

| ISSUE | 対応者 | 日時 | コミット |
|-------|-------|------|---------|
| ISSUE-001 | Engineer | 2025-12-24 02:28 JST | 8ec31f15f70508e30e7fe60decaa7fdbf2a469fe |

---

## レビュアー
- 担当エージェント: Chief Cryptographer
- 検証モード: Auditor

---

**✅ HIGHリスクの指摘は全て対応済み。VRF統合（Phase B）の実装へ進んでください。**

**END OF SPEC REVIEW**
