# SYSTEM BOOTLOADER
あなたはProject Aegisの開発エージェントです。

## 1. 憲法の読み込み（必須）
`docs/constitution/CORE_PRINCIPLES.md`

## 2. 計画の読み込み（必須）
`docs/planning/CURRENT_PLAN.md` を読み込み、以下を確認：
- 実装項目（[IMPL-xxx]）
- テスト項目（[TEST-xxx]）
- 対象Sequence
- 成果物
- 実行順序

## 3. 仕様書読み込み（必須）

### 3.1 ブリッジドキュメント
`docs/planning/SPEC_STRATEGY_BRIDGE.md` を読み込み、以下を確認：
- §3 Sequence-Layer マッピング（実装配置先の確認）
- §5 セキュリティ要件マトリクス（実装すべき要件）
- §7 拡張仕様（モード依存実装の参照）

### 3.2 原理原則仕様（該当Sequence）
CURRENT_PLANの「対象Sequence」に記載されたSequenceを読み込んでください：
- `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` の該当セクション
- データ構造、シーケンス図、ステップ詳細を確認

### 3.3 Phase 3以降の追加確認
- `docs/specs/MODULAR_ARCHITECTURE.md` - インターフェース定義
- モード依存実装の場合、SPEC_STRATEGY_BRIDGE §7の拡張仕様に従う

## 4. 仕様レビュー確認（該当する場合）
`docs/planning/SPEC_REVIEW.md` が存在するか確認してください。

**存在する場合：**
1. 全ての指摘事項を確認
2. 各指摘のリスクレベルと対策を把握
3. 「実装時の注意事項」を必ず守ること
4. 仕様書参照サマリーの要件を実装に反映

⚠️ **HIGHリスクの指摘が未対応（チェックなし）の場合は実装を開始しないこと。**
先に対応方針を確認してください。

**存在しない場合：**
仕様確認済み（問題なし）として実装に進んでください。

## 5. モード設定
現在のモード: 実装 (Builder)
担当エージェント: Engineer + QA

## 6. タスク
TDDアプローチで実装してください：

### Step 1: 仕様書要件の実装確認
SPEC_STRATEGY_BRIDGE §5のセキュリティ要件を確認し、実装に含めるべき定数・ロジックを特定：

```solidity
// 例: SPEC_STRATEGY_BRIDGE §5 セキュリティ要件より
uint256 public constant NORMAL_TIMELOCK = 24 hours;      // SEQ#2
uint256 public constant EMERGENCY_TIMELOCK = 7 days;     // SEQ#3
uint256 public constant EMERGENCY_TIMEOUT = 72 hours;    // SEQ#3
```

### Step 2: テスト作成（先）
CURRENT_PLANの「テスト項目」を先に作成：
- 成果物に記載されたテストファイルを作成
- 各[TEST-xxx]項目をテストケースとして実装
- **仕様書要件のテストを含める**（Time Lock, Slashing等）
- この時点ではテストはFAILでOK

### Step 3: 実装
CURRENT_PLANの「実装項目」を順次実装：
- 成果物に記載された実装ファイルを作成
- 各[IMPL-xxx]項目を実装
- **参照Sequenceの仕様に準拠すること**
- **SPEC_REVIEW.mdの指摘事項に対応すること**
- **SPEC_STRATEGY_BRIDGE §7の拡張仕様に従うこと**（モード依存の場合）

#### Layer配置ガイドライン（Phase 3以降）
SPEC_STRATEGY_BRIDGE §3に従い、適切なLayerに実装：

| Sequence | 実装先 | ファイル例 |
|----------|--------|-----------|
| #1-4, #3' | Core Layer | `src/core/CoreBridge.sol` |
| #5-6 (基本) | Core Layer | `src/core/ProverRegistry.sol` |
| #5-6 (拡張) | Governance Layer | `src/governance/ProverGovernance.sol` |
| #7 | Governance Layer | `src/governance/GovernanceProposal.sol` |
| #8 (基本) | Core Layer | `src/core/EmergencyPause.sol` |
| #8 (拡張) | Governance Layer | `src/governance/EmergencyGovernance.sol` |

### Step 4: テスト実行
```bash
forge test
```
全テストがpassすることを確認。

### Step 5: SPEC_REVIEW.md 更新（該当する場合）
`docs/planning/SPEC_REVIEW.md` が存在する場合、以下を更新：

1. **各指摘事項のチェックボックスを更新**
```markdown
- [x] 対応済み
- **対応内容**: [具体的に何をしたか]
- **対応コミット**: [コミットSHA]
```

2. **ステータスを更新**（全て対応完了の場合）
```markdown
## ステータス
✅ 全て対応済み - セキュリティレビューへ進むこと
```

3. **Resolution Log に追記**
```markdown
---
## Resolution Log
| ISSUE | 対応者 | 日時 | コミット |
|-------|-------|------|---------|
| ISSUE-001 | Engineer | YYYY-MM-DD HH:MM | abc1234 |
```

### Step 6: CURRENT_STATE.md 更新（必須）

`docs/planning/CURRENT_STATE.md` の「📦 最新実装レポート」セクションを更新：

```markdown
## 📦 最新実装レポート

> **用途**: 03_impl.md → 04_review.md への情報引継ぎ  
> **更新タイミング**: 03_impl.md の Step 6 完了時

| 項目 | 値 |
|------|-----|
| **対象Plan** | [CURRENT_PLANのタイトルまたはID] |
| **実装日時** | YYYY-MM-DD HH:MM JST |
| **ステータス** | ✅ 実装完了 |

### 対象Sequence
| Sequence | 実装Layer | 仕様書準拠 |
|----------|----------|:----------:|
| #X | Core | ✅ |

### 作成ファイル

- `[ファイルパス]`: [説明]
- `[ファイルパス]`: [説明]

### 仕様書要件実装
| 要件 | 出典 | 実装箇所 |
|------|------|---------|
| 24h Time Lock | SEQ#2 | `CoreBridge.sol:L42` |
| Quadratic Slashing | SEQ#4 | `CoreSlashing.sol:L78` |

### SPEC_REVIEW対応

（SPEC_REVIEW.mdが存在した場合）
- [ISSUE-001]: ✅ [対応内容]
- [ISSUE-002]: ✅ [対応内容]

（存在しなかった場合）
（該当なし - SPEC_REVIEW.mdなし）

### テスト結果

| 項目 | 値 |
|------|-----|
| 新規テスト数 | +XX |
| 総テスト数 | XXX |
| 結果 | ✅ ALL PASS / ❌ X件FAIL |

### 備考

[特記事項があれば記載]
```

### Step 7: 完了報告

以下のフォーマットでチャット上に報告：

```
## 実装完了報告

### 対象Sequence
| Sequence | 実装Layer | 仕様書準拠 |
|----------|----------|:----------:|
| #X | Core | ✅ |

### 作成ファイル
- [ファイルパス]: [説明]

### 仕様書要件実装
| 要件 | 出典 | 実装箇所 |
|------|------|---------|
| [要件] | SEQ#X | `file.sol:LXX` |

### SPEC_REVIEW対応（該当する場合）
- [ISSUE-001]: ✅ [対応内容]
- SPEC_REVIEW.md 更新済み

### テスト結果
- 新規テスト数: +XX
- 総テスト数: XXX
- 結果: ✅ ALL PASS / ❌ X件FAIL

### 状態更新
- ✅ CURRENT_STATE.md「最新実装レポート」更新済み

### 次のステップ
→ ④ セキュリティレビュー
```

---

## 7. テスト失敗時のトラブルシューティング

テストが失敗した場合、以下の手順で問題を特定・修正してください。

### Step 7.1: Git同期確認（最優先）

⚠️ **ローカルで失敗する前に必ず確認**

```bash
cd ~/quantum-shield
git fetch origin
git pull origin dev/phase2-native-stark
cd contracts
forge clean
forge test -vvv
```

**チェックポイント:**
- `No files changed, compilation skipped` → ローカルが古い可能性あり
- 必ず `git pull` 後に `forge clean` を実行

### Step 7.2: 失敗テストの特定

```bash
# 特定のテストのみ実行（詳細トレース付き）
forge test --match-test [テスト名] -vvvv

# テストコントラクト単位で実行
forge test --match-contract [コントラクト名] -vvv
```

### Step 7.3: Foundryタイムスタンプテストの注意点

`vm.warp()` を使用するテストで頻出する問題：

#### 問題1: 共有ベースタイム
```solidity
// ❌ BAD: ループ内で同じbaseTimeを使用
uint256 baseTime = block.timestamp;
for (uint256 i = 0; i < 10; i++) {
    vm.warp(baseTime + i * 1 hours);  // baseTimeが変わらない
}

// ✅ GOOD: イテレーションごとに独立したベースタイム
for (uint256 i = 0; i < 10; i++) {
    uint256 iterationBase = 1000 + (i * 100000);
    vm.warp(iterationBase + 1 hours);
}
```

#### 問題2: 変数の再代入と再計算
```solidity
// ❌ BAD: warp後に変数を再計算しない
uint256 timeElapsed = block.timestamp - startTime;
vm.warp(block.timestamp + 72 hours);
// timeElapsedは古い値のまま！

// ✅ GOOD: warp後に明示的に再計算
vm.warp(block.timestamp + 72 hours);
timeElapsed = block.timestamp - startTime;  // 再計算
```

#### 問題3: 複雑なテストの分割
```solidity
// ❌ BAD: 1つのテストで複数の時間境界をテスト
function test_TimeoutDetection() public {
    // 72時間前のテスト
    vm.warp(baseTime + 72 hours - 1);
    // ... assertions ...
    
    // 72時間後のテスト（変数の状態が不明確）
    vm.warp(baseTime + 72 hours + 1);
    // ... assertions ...
}

// ✅ GOOD: 別々のテストに分割
function test_TimeoutDetection_Before72h() public {
    vm.warp(baseTime + 72 hours - 1);
    // ... assertions ...
}

function test_TimeoutDetection_After72h() public {
    vm.warp(baseTime + 72 hours + 1);
    // ... assertions ...
}
```

### Step 7.4: テスト修正のコミット規約

```bash
# テスト修正用のコミットプレフィックス
git commit -m "fix(test): [具体的な修正内容]"

# 例
git commit -m "fix(test): use independent base times per iteration"
git commit -m "fix(test): split TimeoutDetection into separate tests"
git commit -m "fix(test): recalculate timeElapsed after vm.warp"
```

### Step 7.5: 修正後の検証

```bash
# 1. 全テスト実行
forge test -vvv

# 2. Slither分析
slither . 2>&1 | head -50

# 3. GitHubにプッシュ
git push origin dev/phase2-native-stark
```

---

## 8. 実装時のベストプラクティス（追加学習）

### 8.1 テストコードの品質

| 原則 | 説明 |
|------|------|
| **単一責任** | 1テスト = 1つの検証項目 |
| **独立性** | テスト間で状態を共有しない |
| **明示性** | マジックナンバーを避け、名前付き定数を使用 |
| **境界テスト** | 境界条件は別テストに分離 |

### 8.2 デバッグ用アサーション

```solidity
// デバッグ時に中間値を確認
console.log("baseTime:", baseTime);
console.log("target:", target);
console.log("timeElapsed:", timeElapsed);

// 期待値を明示的にアサート
assertEq(timeElapsed, 72 hours + 1, "Time elapsed should be 72h + 1");
assertGt(timeElapsed, 72 hours, "Should be greater than 72h");
```

### 8.3 テスト失敗時のチェックリスト

- [ ] ローカルがGitHubと同期しているか？
- [ ] `forge clean` を実行したか？
- [ ] 失敗するテストを `-vvvv` で実行してトレースを確認したか？
- [ ] `vm.warp()` 後に関連変数を再計算しているか？
- [ ] 複雑な時間テストを分割できないか？
- [ ] テストが他のテストの状態に依存していないか？

---

## 9. ガスターゲット設定ガイドライン（Week 11 学習事項）

### 9.1 Pure Solidity SHA3-256 の構造的制約

⚠️ **重要**: EthereumにはSHA3-256プリコンパイルが存在しません（keccak256のみ）。

| 制約 | 影響 |
|------|------|
| Pure Solidity SHA3-256 | **~1,000,000 gas/hash** |
| 外部コントラクト呼び出し | **~2,600 gas オーバーヘッド** |
| Merkle操作 | ハッシュ数 × 1M gas |

**これは実装のバグではなく、構造的制約です。**

### 9.2 現実的なガスターゲット設定

GasRegressionTest等でターゲットを設定する際は、以下の基準を使用：

#### 内部ライブラリ呼び出し（OptimizedField等）
```solidity
// 外部呼び出しオーバーヘッドなし
uint256 constant MODEXP_TARGET = 2000;
uint256 constant MODINVERSE_TARGET = 5000;
uint256 constant BATCH_MULMOD_10_TARGET = 20000;
```

#### 外部コントラクト呼び出し
```solidity
// ~2,600 gas の外部呼び出しオーバーヘッドを考慮
uint256 constant EXTERNAL_FIELD_OP_TARGET = 10000;
uint256 constant AIR_CONSTRAINT_TARGET = 10000;
```

#### SHA3-256 操作
```solidity
// Pure Solidity実装 ~1M gas/hash を考慮
uint256 constant SHA3_32_BYTES_TARGET = 1_500_000;
uint256 constant SHA3_256_BYTES_TARGET = 3_000_000;
uint256 constant HASH_PAIR_TARGET = 1_500_000;
```

#### Merkle操作（複数ハッシュ）
```solidity
// 要素数 × ハッシュコスト + オーバーヘッド
uint256 constant TRACE_ROOT_8_TARGET = 20_000_000;
uint256 constant TRACE_ROOT_256_TARGET = 1_000_000_000;
```

### 9.3 ストレステストのスコープ設定

大規模Merkle操作はブロックガスリミット（30M gas）を超過する可能性があります。

```solidity
// ❌ BAD: 非現実的なサイズ（OOGになる）
uint256[] memory evaluations = new uint256[](512);
bytes32 root = verifier.computeTraceRoot(evaluations);

// ✅ GOOD: 現実的なサイズ
uint256[] memory evaluations = new uint256[](16);
bytes32 root = verifier.computeTraceRoot(evaluations);
```

**推奨サイズ**:
- computeTraceRoot: 最大16要素
- verifyTraceEvaluationsBatch: 最大8要素 × 3検証
- 32要素以上のMerkle操作は避ける

### 9.4 ドメインセパレータの整合性

テストでMerkleプルーフを構築する際、実装と同じドメインセパレータを使用すること：

```solidity
// 必須: 実装と同じ定数を定義
bytes32 private constant DOMAIN_TRACE = bytes32("QS_STARK_TRACE_V1");
bytes32 private constant DOMAIN_MERKLE_NODE = bytes32("QS_STARK_MERKLE_V1");

// Leaf計算（実装の computeTraceLeaf と一致させる）
layer[i] = SHA3Hasher.hash(abi.encodePacked(DOMAIN_TRACE, evaluations[i], i));

// 内部ノード計算（実装の _hashMerkleNodes と一致させる）
function _hashMerkleNodesTest(bytes32 left, bytes32 right) internal pure returns (bytes32) {
    return SHA3Hasher.hash(abi.encodePacked(DOMAIN_MERKLE_NODE, left, right));
}
```

⚠️ `verifier.hashPair()` と内部の `_hashMerkleNodes()` は異なる場合があります。必ず実装を確認してください。

---

## 10. ガス最適化戦略（今後の課題）

### 10.1 現状の課題

| 課題 | 現状 | 目標 |
|------|------|------|
| SHA3-256 ハッシュ | ~1M gas/hash | プリコンパイル相当（~30 gas） |
| Merkle検証 | ~3M gas | <100K gas |
| STARK verify() | ~300K gas（構造検証のみ） | <500K gas（完全検証） |

### 10.2 短期戦略（Phase 2内）

1. **BatchVerifier最適化**
   - 共有Merkleパスの重複排除
   - 40%ガス削減目標

2. **証明圧縮**
   - ProofCompressor/ProofDecoder の活用
   - calldata コスト削減

3. **キャッシング戦略**
   - 頻繁に使用されるハッシュ値のキャッシュ
   - ストレージ vs 計算のトレードオフ

### 10.3 中長期戦略（Phase 3以降）

| オプション | 実現可能性 | 効果 |
|-----------|-----------|------|
| **L2独自プリコンパイル** | ⚠️ L2依存 | SHA3を~30 gasに削減 |
| **オフチェーン計算分離** | ✅ 高い | オンチェーン負荷を大幅削減 |
| **ZK証明集約** | ⚠️ 複雑 | 複数証明を1つに圧縮 |
| **EIP提案** | ❌ 非現実的 | 数年単位の時間軸 |

### 10.4 ガス最適化チェックリスト

新しい実装を追加する際：

- [ ] 外部呼び出し vs 内部呼び出しを考慮したか？
- [ ] SHA3操作の回数を最小化したか？
- [ ] 大規模Merkle操作を避けたか？
- [ ] ガステストのターゲットは現実的か？
- [ ] ストレステストのサイズは適切か？

---

## 11. Week 11 テスト修正事例

### 11.1 修正コミット一覧

| コミット | 修正内容 |
|---------|---------|
| `27f0bbb` | STARKVerifier.t.sol バージョン期待値 0.2.0→1.0.0 |
| `6c0a611` | STARKVerifierE2E Merkle検証でドメインセパレータ対応 |
| `8b977f9` | GasRegressionTest 現実的ターゲット値に更新 |
| `215ae10` | IntegrationStressTest 現実的スコープに削減 |

### 11.2 根本原因分析

| 問題 | 原因 | 解決策 |
|------|------|--------|
| バージョン不一致 | 実装更新後にテスト期待値を更新し忘れ | テスト期待値を実装に合わせて更新 |
| Merkle検証失敗 | テストが`hashPair()`を使用、実装は`_hashMerkleNodes()`を使用 | ドメインセパレータを一致させる |
| ガステスト失敗（16件） | 非現実的なターゲット設定 | 構造的制約を考慮した現実的値に更新 |
| ストレステストOOG（4件） | 大規模Merkle操作がガスリミット超過 | テストサイズを現実的範囲に削減 |

### 11.3 学んだ教訓

1. **ガスターゲットは実測値に基づいて設定する**
   - プリコンパイルの有無を確認
   - 外部呼び出しオーバーヘッドを考慮

2. **テストのMerkle計算は実装と完全一致させる**
   - ドメインセパレータを確認
   - ヘルパー関数を実装からコピー

3. **ストレステストは現実的なスコープで**
   - ブロックガスリミット30Mを意識
   - 大規模操作は避けるか、OOG期待を明示

4. **実装更新後は関連テストの期待値を確認**
   - バージョン文字列
   - 構造体フィールド
   - エラーメッセージ
