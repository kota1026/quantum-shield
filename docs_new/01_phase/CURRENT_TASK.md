# Task Definition

> **Generated**: 2026-01-12 (SEP v3)
> **Status**: Active

---

## 基本情報

| 項目 | 値 |
|------|-----|
| タスクID | TASK-P5-011 |
| タイトル | ProverRegistry.sol 実装 |
| 対象Sequence | #5 Prover Registration, #6 Prover Exit |
| 優先度 | P0 |
| 見積り工数 | 4日 |

---

## 背景

### 現状分析

| コンポーネント | ファイル | 状態 | 備考 |
|--------------|---------|:----:|------|
| L1Vault Prover管理 | `contracts/src/L1Vault.sol` | ⚠️ 基本のみ | 埋め込み型、機能不足 |
| API prover.rs | `services/api/src/routes/prover.rs` | ⚠️ 基本実装 | 登録エンドポイントのみ |
| ProverRegistry | `contracts/src/prover/` | ❌ 未実装 | 今回実装対象 |

### ギャップ分析

L1Vaultの現行Prover構造:
```solidity
struct Prover {
    address proverAddress;
    bytes32 sphincsPubKeyHash;
    bytes sphincsPublicKey;
    uint256 stakedAmount;
    uint256 registeredAt;
    bool isActive;
    uint256 successfulSigns;
    uint256 slashedCount;
}
```

必要な追加機能:
1. Phase別承認モード（招待制/Council/自動）
2. Unbonding期間 (7日)
3. 詳細なSlashing機能
4. Exit/Withdrawフロー

---

## 実装項目

### 1. ProverRegistry.sol

```solidity
// Prover構造体
struct Prover {
    address operator;           // オペレーターアドレス
    bytes sphincsPublicKey;     // SPHINCS+公開鍵 (32 bytes)
    bytes32 sphincsPubKeyHash;  // 公開鍵ハッシュ
    uint256 stake;              // ステーク量
    ProverStatus status;        // 状態
    uint256 registeredAt;       // 登録時刻
    uint256 totalSignatures;    // 累計署名数
    uint256 slashCount;         // Slash回数
    uint256 exitRequestedAt;    // 退出申請時刻
}

// 関数
- register(sphincsPublicKey, hsmAttestation, multisigProof) → proverId
- approve(proverId) // Council/Foundation専用
- autoApprove(proverId) // Phase 3+用
- slash(proverId, amount, reason)
- requestExit(proverId)
- executeExit(proverId)
- withdrawStake(proverId)
```

### 2. ProverRegistry.t.sol

- 登録テスト
- 承認フローテスト
- Slashingテスト
- 退出・Unbondingテスト

---

## 仕様参照

| 仕様 | セクション |
|------|----------|
| SEQUENCES | §5 Prover Registration |
| SEQUENCES | §6 Prover Exit |
| UNIFIED_SPEC | §Prover Management |

---

## 完了条件

| # | 条件 | 検証方法 |
|---|------|---------|
| 1 | Prover登録・承認フロー動作 | forge test |
| 2 | Slashing機能動作 | forge test |
| 3 | 7日Unbonding期間実装 | forge test |
| 4 | slither警告なし (High/Critical) | slither |

---

## 検証コマンド

```bash
forge build
forge test --match-contract ProverRegistryTest -vvv
slither contracts/src/prover/ProverRegistry.sol
```

---

**END OF TASK DEFINITION**
