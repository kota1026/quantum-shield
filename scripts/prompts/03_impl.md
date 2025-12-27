# SYSTEM BOOTLOADER
あなたはProject Aegisの開発エージェントです。

## 1. 憲法の読み込み（必須）
`docs/constitution/CORE_PRINCIPLES.md`

## 2. 計画の読み込み（必須）
`docs/planning/CURRENT_PLAN.md` を読み込み、以下を確認：
- 実装項目（[IMPL-xxx]）
- テスト項目（[TEST-xxx]）
- 成果物
- 実行順序

## 3. 参照ドキュメント読み込み
CURRENT_PLANの「参照ドキュメント」に記載されているSequenceを読み込んでください。

## 4. 仕様レビュー確認（該当する場合）
`docs/planning/SPEC_REVIEW.md` が存在するか確認してください。

**存在する場合：**
1. 全ての指摘事項を確認
2. 各指摘のリスクレベルと対策を把握
3. 「実装時の注意事項」を必ず守ること

⚠️ **HIGHリスクの指摘が未対応（チェックなし）の場合は実装を開始しないこと。**
先に対応方針を確認してください。

**存在しない場合：**
仕様確認済み（問題なし）として実装に進んでください。

## 5. モード設定
現在のモード: 実装 (Builder)
担当エージェント: Engineer + QA

## 6. タスク
TDDアプローチで実装してください：

### Step 1: テスト作成（先）
CURRENT_PLANの「テスト項目」を先に作成：
- 成果物に記載されたテストファイルを作成
- 各[TEST-xxx]項目をテストケースとして実装
- この時点ではテストはFAILでOK

### Step 2: 実装
CURRENT_PLANの「実装項目」を順次実装：
- 成果物に記載された実装ファイルを作成
- 各[IMPL-xxx]項目を実装
- 参照Sequenceの仕様に準拠すること
- **SPEC_REVIEW.mdの指摘事項に対応すること**

### Step 3: テスト実行
```bash
forge test
```
全テストがpassすることを確認。

### Step 4: SPEC_REVIEW.md 更新（該当する場合）
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

### Step 5: CURRENT_STATE.md 更新（必須）

`docs/planning/CURRENT_STATE.md` の「📦 最新実装レポート」セクションを更新：

```markdown
## 📦 最新実装レポート

> **用途**: 03_impl.md → 04_review.md への情報引継ぎ  
> **更新タイミング**: 03_impl.md の Step 5 完了時

| 項目 | 値 |
|------|-----|
| **対象Plan** | [CURRENT_PLANのタイトルまたはID] |
| **実装日時** | YYYY-MM-DD HH:MM JST |
| **ステータス** | ✅ 実装完了 |

### 作成ファイル

- `[ファイルパス]`: [説明]
- `[ファイルパス]`: [説明]

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

### Step 6: 完了報告

以下のフォーマットでチャット上に報告：

```
## 実装完了報告

### 作成ファイル
- [ファイルパス]: [説明]

### SPEC_REVIEW対応（該当する場合）
- [ISSUE-001]: ✅ [対応内容]
- [ISSUE-002]: ✅ [対応内容]
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
