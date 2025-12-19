# QuantumShieldBridge セキュリティドキュメント

## 目次
1. [脅威モデル](#脅威モデル)
2. [攻撃ベクトル分析](#攻撃ベクトル分析)
3. [セキュリティ保証](#セキュリティ保証)
4. [監査スコープ](#監査スコープ)
5. [テストカバレッジ](#テストカバレッジ)

---

## 脅威モデル

### 1. 資産 (Assets)

| 資産 | 説明 | 重要度 |
|------|------|--------|
| ロックされたETH | ユーザーがブリッジにロックした資金 | **最高** |
| ZK証明検証 | STARK証明の完全性 | **最高** |
| Dilithium署名 | 量子耐性署名の有効性 | **最高** |
| 管理者権限 | pause/updateVerifier権限 | 高 |
| ノンス状態 | リプレイ攻撃防止状態 | 高 |

### 2. 脅威アクター (Threat Actors)

| アクター | 能力 | 動機 |
|----------|------|------|
| 外部攻撃者 | 任意のトランザクション送信 | 資金窃取 |
| 悪意のあるマイナー/バリデータ | トランザクション順序操作、タイムスタンプ操作 | MEV抽出 |
| 量子コンピュータ保有者 | ECDSA署名偽造（将来） | 署名偽造 |
| 内部攻撃者（管理者） | 管理者鍵アクセス | 資金窃取/DoS |
| スマートコントラクト（悪意） | 再入攻撃、ガスグリーフィング | 状態操作 |

### 3. 脅威シナリオ

```
┌─────────────────────────────────────────────────────────────┐
│                    脅威マトリックス                           │
├──────────────────────┬──────────┬──────────┬───────────────┤
│ 脅威                  │ 可能性   │ 影響度   │ リスクレベル  │
├──────────────────────┼──────────┼──────────┼───────────────┤
│ リプレイ攻撃          │ 高       │ 最高     │ 🔴 Critical   │
│ → 5層防御で軽減       │          │          │ → 軽減済み    │
├──────────────────────┼──────────┼──────────┼───────────────┤
│ 証明偽造              │ 中       │ 最高     │ 🔴 Critical   │
│ → ZK-STARK + Groth16  │          │          │ → 軽減済み    │
├──────────────────────┼──────────┼──────────┼───────────────┤
│ 再入攻撃              │ 中       │ 高       │ 🟠 High       │
│ → CEIパターン         │          │          │ → 軽減済み    │
├──────────────────────┼──────────┼──────────┼───────────────┤
│ 管理者鍵漏洩          │ 低       │ 最高     │ 🟠 High       │
│ → マルチシグ推奨      │          │          │ → 運用で軽減  │
├──────────────────────┼──────────┼──────────┼───────────────┤
│ 量子攻撃（将来）      │ 低       │ 最高     │ 🟡 Medium     │
│ → Dilithium実装済み   │          │          │ → 軽減済み    │
├──────────────────────┼──────────┼──────────┼───────────────┤
│ Force-Feed ETH        │ 高       │ 低       │ 🟢 Low        │
│ → totalLocked分離     │          │          │ → 軽減済み    │
└──────────────────────┴──────────┴──────────┴───────────────┘
```

---

## 攻撃ベクトル分析

### 1. リプレイ攻撃 (🔴 Critical → ✅ 軽減済み)

**攻撃シナリオ:**
```
攻撃者がAチェーンで使用された証明をBチェーンで再利用
```

**防御層:**
```solidity
// 5層リプレイ攻撃防止
1. circuitVersion検証    → 回路互換性
2. coefficientBound検証  → 係数境界
3. proofCommitment一意性 → 証明ハッシュ
4. globalNonce一意性     → グローバルノンス
5. senderNoncePair一意性 → 送信者-ノンス束縛
```

**テストカバレッジ:**
- `test_Release_SameProofCommitmentDifferentLock_Reverts`
- `test_Release_CrossSenderNonceAttack_Success`
- `test_Release_SameSenderSameNonce_Reverts`

### 2. 証明偽造 (🔴 Critical → ✅ 軽減済み)

**攻撃シナリオ:**
```
攻撃者がDilithium署名なしで有効な証明を生成
```

**防御:**
```
ZK-STARK (Plonky2) + Groth16ラッピング
- STARK: 128ビットセキュリティ
- Groth16: オンチェーン検証効率化
- Dilithium: FIPS 204準拠、量子耐性
```

### 3. 再入攻撃 (🟠 High → ✅ 軽減済み)

**攻撃シナリオ:**
```
receive()コールバックから再入してreleaseを再実行
```

**防御 (CEIパターン):**
```solidity
// 1. Checks (検証)
if (lockData.released) revert LockAlreadyReleased();
if (usedNonces[nonce]) revert NonceAlreadyUsed();

// 2. Effects (状態更新) ← 外部呼び出しの前に実行
lockData.released = true;
usedNonces[nonce] = true;
usedProofCommitments[proofCommitmentHash] = true;

// 3. Interactions (外部呼び出し)
(bool success, ) = recipient.call{value: lockData.amount}("");
```

**テストカバレッジ:**
- `test_Release_ReentrancyAttack_Blocked`
- `test_CrossFunctionReentrancy_StateConsistency`
- `test_CrossFunctionReentrancy_AccountingCorrect`

### 4. 管理者権限悪用 (🟠 High → 🟡 運用で軽減)

**攻撃シナリオ:**
```
管理者鍵漏洩 → 悪意のあるVerifier設定 → 資金窃取
```

**推奨対策:**
```
1. Gnosis Safe マルチシグ (3/5)
2. タイムロック (48時間)
3. Verifier更新イベント監視
4. 緊急時の即座pause
```

### 5. Force-Feed ETH (🟢 Low → ✅ 軽減済み)

**攻撃シナリオ:**
```
selfdestruct経由でETHを強制送金 → 会計不整合
```

**防御:**
```solidity
// totalLockedとbalanceは分離管理
// totalLocked: ロックされた資金のみ追跡
// balance: 実際のコントラクト残高（force-feed含む）

// 不変条件: totalLocked <= balance (常に成立)
```

---

## セキュリティ保証

### 数学的保証

```
∀ tx ∈ ValidTransactions:
  1. tx.circuitVersion = 1                      [バージョン互換性]
  2. tx.maxCoefficientBound ≤ 65536             [係数境界]
  3. tx.proofCommitment ∉ usedProofCommitments  [証明一意性]
  4. tx.nonce ∉ usedNonces                      [グローバルノンス]
  5. (tx.sender, tx.nonce) ∉ senderNoncePairs   [送信者-ノンス束縛]
  6. verify(tx.proof, tx.publicInputs) = true   [ZK証明有効性]
```

### 不変条件 (Invariants)

```solidity
// INV-1: 資金保全
assert(totalLocked == sum(unreleased_locks))

// INV-2: 会計整合性
assert(totalLocked <= address(this).balance)

// INV-3: 二重支出防止
assert(released[lockId] => funds_transferred[lockId])

// INV-4: ノンス単調増加
assert(∀t1 < t2: usedNonces(t1) ⊆ usedNonces(t2))

// INV-5: 証明一意性
assert(∀proof: used_count(proof) ≤ 1)
```

---

## 監査スコープ

### In Scope

| ファイル | LOC | 説明 |
|----------|-----|------|
| `contracts/QuantumShieldBridge.sol` | ~400 | メインブリッジコントラクト |
| `contracts/verifiers/SP1Groth16Verifier.sol` | ~200 | Groth16検証器 |
| `sp1-bench/program/src/main.rs` | ~1000 | ZKゲストプログラム |

### Out of Scope

- OpenZeppelin依存関係
- Foundry/Forge テストフレームワーク
- 外部ライブラリ (sp1-zkvm, plonky2)

### 重点監査項目

1. **資金フロー**
   - lock() → release() の完全性
   - totalLocked会計の正確性

2. **証明検証**
   - publicInputsの検証
   - verifier呼び出しの安全性

3. **アクセス制御**
   - Owner権限の範囲
   - pause/unpauseの影響

4. **状態管理**
   - マッピングの整合性
   - ノンス管理

---

## テストカバレッジ

### 現在のカバレッジ (Phase 1-3完了後)

```
┌────────────────────────────────────────────────────────────┐
│ テストカバレッジサマリー                                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ 単体テスト              84/84  ████████████████████  100%  │
│ Invariantテスト          8/8   ████████████████████  100%  │
│ Fuzzテスト              768+ runs                          │
│ Symbolic Execution       16 properties                     │
│                                                            │
│ 行カバレッジ                   ████████████████████   95%+ │
│ 分岐カバレッジ                 ████████████████████   90%+ │
│ 関数カバレッジ                 ████████████████████   98%  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### テストカテゴリ別

| カテゴリ | テスト数 | 状態 |
|----------|----------|------|
| 基本機能 (QuantumShieldBridgeTest) | 46 | ✅ |
| リエントランシー | 1 | ✅ |
| クロスファンクションリエントランシー | 2 | ✅ |
| Force-Feed ETH | 3 | ✅ |
| タイムスタンプ操作 | 5 | ✅ |
| 整数境界 | 5 | ✅ |
| ストレージスロット | 3 | ✅ |
| 緊急リカバリー | 6 | ✅ |
| ガスグリーフィング | 2 | ✅ |
| Fuzz | 3 | ✅ |
| Invariant (基本) | 4 | ✅ |
| Invariant (拡張) | 4 | ✅ |

---

## 推奨事項

### 即座に実施すべき (P0)

1. ✅ 全テストPASS確認 (84/84)
2. ✅ Slither静的解析クリーン
3. ⬜ 外部監査依頼

### 短期 (P1)

1. ⬜ Gnosis Safeマルチシグ設定
2. ⬜ タイムロック導入
3. ⬜ Tenderly監視設定

### 中期 (P2)

1. ⬜ Bug Bountyプログラム (Immunefi)
2. ⬜ 段階的デプロイ (Testnet → 限定 → 全体)
3. ⬜ インシデント対応プラン策定

---

## 署名欄

| 役割 | 名前 | 日付 | 署名 |
|------|------|------|------|
| 開発者 | | | |
| セキュリティレビュアー | | | |
| 監査人 | | | |
