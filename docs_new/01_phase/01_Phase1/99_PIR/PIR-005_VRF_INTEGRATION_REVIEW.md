# PIR-005: Day 8-9 VRF Integration Security Review

> **PIR ID**: PIR-005  
> **対象**: Day 8-9 VRF統合成果物  
> **レビュー日時**: 2025-12-24 10:00 JST  
> **レビュアー**: Red Team Agent  
> **判定**: ⚠️ CONDITIONAL PASS

---

## 📋 レビュー対象

| ファイル | 説明 |
|---------|------|
| `contracts/src/VRFConsumerMock.sol` | Mock VRFコントラクト |
| `contracts/src/interfaces/IVRFConsumer.sol` | VRF Interface |
| `contracts/src/libraries/ProverSelector.sol` | Prover選出ロジック |
| `contracts/src/L1Vault.sol` | VRF統合更新（72h Emergency） |
| `contracts/src/libraries/StateRootCalculator.sol` | SR_0/SR_1計算 |

---

## 🔍 発見事項

| # | 重要度 | 項目 | 説明 | 対策 |
|---|--------|------|------|------|
| 1 | 🟡 Medium | keccak256使用 (VRFConsumerMock.sol) | `triggerFallback()`と`mockAutoFulfill()`でkeccak256使用 | Mock版のため許容。本番Chainlink実装では注意 |
| 2 | 🟡 Medium | keccak256使用 (ProverSelector.sol) | bias mitigationでkeccak256使用 (L86) | VRF乱数処理でありState Hash計算ではないため許容 |
| 3 | 🔴 **High** | **SMT検証にkeccak256 (L1Vault.sol)** | `_verifySMTProof()`がkeccak256使用 (L794-802) | **SHA3-256への移行必須** - CP-1違反リスク |
| 4 | 🟡 Medium | Domain Separator (StateRootCalculator.sol) | `DOMAIN_LOCK`, `DOMAIN_UNLOCK`がkeccak256で計算 | コンパイル時定数のため許容。SHA3-256が望ましい |
| 5 | 🟢 Low | Public Key Hash (L1Vault.sol) | `keccak256(dilithiumPubKey)`で公開鍵ハッシュ | State Root外の用途のため許容 |
| 6 | 🟢 Low | プローバー応答追跡 | `proverRequestedAt`がunlock request作成時に自動設定 | VRF呼び出し時刻ではない点に注意 |

---

## ✅ CP-1〜CP-5 準拠確認

| 原則 | 状態 | 詳細 |
|------|------|------|
| CP-1 完全量子耐性 | ⚠️ 条件付き | SMT検証にkeccak256使用（要修正）|
| CP-2 Self-Custody | ✅ PASS | ユーザー鍵の保存なし |
| CP-3 Time Lock存在 | ✅ PASS | NORMAL_TIME_LOCK=24h, EMERGENCY_TIME_LOCK=7days維持 |
| CP-4 Slashing存在 | ✅ PASS | Slashing機能削除なし (60/20/20分配) |
| CP-5 透明性 | ✅ PASS | 全操作がオンチェーン |

---

## 🔐 暗号実装確認

| 項目 | 状態 | 詳細 |
|------|------|------|
| State Root (SR_0, SR_1) | ✅ PASS | SHA3-256使用 (`SHA3_256.hashWithDomain()`) |
| Lock ID生成 | ✅ PASS | SHA3-256使用 |
| SMT証明検証 | ❌ **FAIL** | keccak256使用 - **修正必須** |
| VRF乱数処理 | ✅ PASS | Chainlink VRF (外部提供) |
| Dilithium署名 | ✅ PASS | FIPS 204準拠 |
| SPHINCS+署名 | ✅ PASS | FIPS 205準拠 |

---

## 🛡️ 攻撃ベクトル分析

| 攻撃 | リスク | 分析結果 |
|------|--------|---------|
| リエントランシー | 🟢 Low | ReentrancyGuard使用、CEIパターン遵守 |
| フロントランニング | 🟢 Low | VRFによる乱数生成で対策済み |
| オラクル操作 | 🟡 Medium | Mock版はblock.prevrandao使用。本番はChainlink VRF |
| DoS攻撃 | 🟢 Low | Bond要件とRate Limitで緩和 |
| 整数オーバーフロー | 🟢 Low | Solidity 0.8.20の自動チェック |
| 72hタイムアウト悪用 | 🟢 Low | Bond要件と7日Time Lockで保護 |

---

## 📊 VRF仕様準拠確認

| 仕様 | 状態 | 詳細 |
|------|------|------|
| SPEC-001 Sequence#2準拠 | ✅ PASS | VRF→Prover選出→署名フロー実装 |
| SPEC-002 選出式 P(i)=Stake_i/ΣStake | ✅ PASS | ProverSelector.selectProver()実装 |
| SPEC-003 署名期限5分 | ✅ PASS | VRF_TIMEOUT = 5 minutes |
| SPEC-004 72h→Emergency | ✅ PASS | PROVER_TIMEOUT = 72 hours |

---

## 🧪 静的解析結果

- **Slither**: ⚠️ 実行不可（ネットワーク制限）
- **手動レビュー**: 完了
- **推奨**: ローカル環境でSlither実行必須

---

## 📝 判定

- [ ] ✅ PASS - PIRに進んでください
- [x] ⚠️ **CONDITIONAL PASS** - 修正後に再レビュー
- [ ] ❌ FAIL - 実装に差し戻し

---

## 🔧 必須修正事項

### 1. SMT証明検証のSHA3-256移行 (High Priority)

**ファイル**: `contracts/src/L1Vault.sol`  
**場所**: `_verifySMTProof()` 関数 (L794-802)

**現在の実装（keccak256使用）:**
```solidity
function _verifySMTProof(bytes32 leaf, bytes32[] calldata proof, bytes32 root) internal pure returns (bool) {
    bytes32 computedRoot = leaf;
    for (uint256 i = 0; i < proof.length; i++) {
        if (computedRoot < proof[i]) {
            computedRoot = keccak256(abi.encodePacked(computedRoot, proof[i])); // ❌
        } else {
            computedRoot = keccak256(abi.encodePacked(proof[i], computedRoot)); // ❌
        }
    }
    return computedRoot == root;
}
```

**修正後（SHA3-256使用）:**
```solidity
import {SHA3_256} from "./libraries/SHA3_256.sol";

function _verifySMTProof(bytes32 leaf, bytes32[] calldata proof, bytes32 root) internal pure returns (bool) {
    bytes32 computedRoot = leaf;
    for (uint256 i = 0; i < proof.length; i++) {
        if (computedRoot < proof[i]) {
            computedRoot = SHA3_256.hash(abi.encodePacked(computedRoot, proof[i])); // ✅
        } else {
            computedRoot = SHA3_256.hash(abi.encodePacked(proof[i], computedRoot)); // ✅
        }
    }
    return computedRoot == root;
}
```

---

## 📋 推奨事項（Low Priority）

1. **Domain Separator統一**: StateRootCalculatorのDOMAIN定数をSHA3-256で生成
2. **Public Key Hash統一**: Dilithium/SPHINCS+公開鍵ハッシュをSHA3-256で統一
3. **ローカルSlither実行**: セキュリティスキャン必須

---

## 🔜 次のステップ

1. SMT検証のSHA3-256移行を実装 (担当: Engineer)
2. 修正後、再度セキュリティレビュー実施 (担当: Red Team)
3. Slitherをローカルで実行 (担当: QA)
4. PIR-005正式承認へ進む

---

**Red Team判定サマリー**: 

SMT検証でのkeccak256使用はCP-1「完全量子耐性」に対する潜在的リスクです。Grover攻撃に対する耐性を確保するため、SHA3-256への移行を強く推奨します。

VRF統合自体の実装品質は高く、仕様準拠も確認されています。SMT検証の修正完了後、PIR-005の正式承認に進めます。

---

**END OF PIR-005 REPORT**
