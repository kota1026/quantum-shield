# Current Plan

> **Generated**: 2025-12-24 20:00 JST
> **Phase**: 1 - Foundation Bootstrap
> **Day**: 11 (14日間修正計画)
> **Updated**: 2025-12-24 23:15 JST - Option A選択によるスコープ拡大

## 対象チェックリスト

`docs/planning/checklists/phase1_day11_gas.md` (本プランで作成予定)

## 前回レビュー課題（PIR-006より自動取得）

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| 1 | 🟡 Medium | `_verifyThresholdSignatures()`内の`keccak256(abi.encodePacked(lockId, stateRoot))`はGrover攻撃リスク | SHA3-256への移行 ✅ 実装済み |
| 2 | 🟡 Medium | SHA3-256 Gas消費量が高い（~1.3M目標~800K） | ループ最適化・定数テーブル化 |
| 3 | 🟡 Medium | Slither静的解析未実施 | Day 11で実施 |

## 仕様レビュー追加課題（02_spec.md より）

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| 4 | 🟡 Medium | L256: `keccak256(dilithiumPubKey)` | SHA3_256.hash()に置換 |
| 5 | 🟡 Medium | L641: `keccak256(sphincsPublicKey)` | SHA3_256.hash()に置換 |
| 6 | 🟢 Low | L465, L527, L541: FraudProof/DefenseProof keccak256 | SHA3_256.hash()に置換（一貫性） |

## 今回のスコープ

### 修正項目（レビュー課題より）

- [x] [FIX-008] `_verifyThresholdSignatures()` 内の署名メッセージ作成をSHA3-256に変更 ✅ 実装済み
- [x] [FIX-009] `_verifySimplified()` 内のkeccak256をSHA3-256に変更 ✅ 実装済み

### 追加修正項目（Option A: スコープ拡大）

- [ ] [FIX-010] L256: `dilithiumPubKeyHash` をSHA3-256に変更
- [ ] [FIX-011] L641: `sphincsPubKeyHash` をSHA3-256に変更
- [ ] [FIX-012] L465, L527: `fraudProofHash` をSHA3-256に変更
- [ ] [FIX-013] L541: `defenseProofHash` をSHA3-256に変更

### 実装項目

- [ ] [IMPL-010] SHA3_256.sol Gas最適化
  - Round定数を配列に変換（if/else連鎖削除）
  - Rhoオフセットを配列に変換
  - ループ展開の検討
  - アセンブリ最適化（必要に応じて）
- [ ] [IMPL-011] 署名メッセージ用SHA3-256ヘルパー関数追加

### テスト項目

- [ ] [TEST-010] SHA3_256 Gas最適化後の正確性テスト（既存テスト24件パス確認）
- [ ] [TEST-011] 署名メッセージSHA3-256化の単体テスト
- [ ] [TEST-012] Gas消費量ベンチマークテスト
- [ ] [TEST-013] 統合テスト再実行（233件全パス確認）
- [ ] [TEST-014] 公開鍵ハッシュ変更に伴うテストデータ更新

### 静的解析

- [ ] [QA-001] Slither静的解析実行
- [ ] [QA-002] 検出項目の分類とトリアージ
- [ ] [QA-003] Critical/High項目の修正

### 参照ドキュメント

- Sequence: `docs/constitution/QUANTUM_SHIELD_SEQUENCES_v2.0_REF.md`
- 仕様: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md`
- PIR-006: `docs/aegis/pir/PIR-006.md`
- 憲法: `docs/constitution/CORE_PRINCIPLES.md`
- 仕様レビュー: `docs/planning/SPEC_REVIEW.md`

## 成果物

| ファイル | 説明 |
|---------|------|
| `contracts/src/libraries/SHA3_256.sol` | Gas最適化版（目標: ~800K） |
| `contracts/src/L1Vault.sol` | 全keccak256をSHA3-256に移行 |
| `contracts/test/SHA3_256Gas.t.sol` | Gasベンチマークテスト |
| `docs/planning/checklists/phase1_day11_gas.md` | Day 11チェックリスト |
| `docs/aegis/pir/PIR-008.md` | Day 11 PIRレポート |

## 実行順序

### Phase A: SHA3-256 Gas最適化（3-4時間）

1. SHA3_256.sol の分析
   - 現在のGas消費量測定
   - ボトルネック特定
   
2. 最適化実装
   - Round定数を `uint64[24]` 配列に変換
   - Rhoオフセットを `uint256[25]` 配列に変換
   - 内部ループの最適化
   
3. テスト実行
   - 既存24件のテストパス確認
   - Gas消費量比較

### Phase B: keccak256完全排除（2-3時間）★拡大

4. L1Vault.sol 修正
   - FIX-010: dilithiumPubKeyHash
   - FIX-011: sphincsPubKeyHash
   - FIX-012: fraudProofHash
   - FIX-013: defenseProofHash
   
5. 関連テスト更新
   - テストデータのハッシュ値更新
   - 統合テスト再実行

### Phase C: 静的解析（1-2時間）

6. Slither実行
   - ローカル環境でSlither実行
   - 結果の分類・トリアージ
   
7. 修正実施（Critical/Highのみ）
   - 検出項目の修正
   - 再スキャン

### Phase D: 統合検証（1時間）

8. 全テスト実行
   - `forge test --gas-report`
   - 233件全パス確認
   
9. PIR-008作成
   - 結果ドキュメント化
   - CURRENT_STATE.md更新

## 技術詳細

### FIX-010: dilithiumPubKeyHash SHA3-256化

**現在の実装** (L1Vault.sol L256):
```solidity
bytes32 dilithiumPubKeyHash = keccak256(dilithiumPubKey);
```

**修正後**:
```solidity
bytes32 dilithiumPubKeyHash = SHA3_256.hash(dilithiumPubKey);
```

### FIX-011: sphincsPubKeyHash SHA3-256化

**現在の実装** (L1Vault.sol L641):
```solidity
bytes32 sphincsPubKeyHash = keccak256(sphincsPublicKey);
```

**修正後**:
```solidity
bytes32 sphincsPubKeyHash = SHA3_256.hash(sphincsPublicKey);
```

### FIX-012/013: Challenge関連 SHA3-256化

**現在の実装**:
```solidity
// L465, L527
fraudProofHash: keccak256(fraudProof)
// L541
bytes32 defenseProofHash = keccak256(defenseProof);
```

**修正後**:
```solidity
fraudProofHash: SHA3_256.hash(fraudProof)
bytes32 defenseProofHash = SHA3_256.hash(defenseProof);
```

### IMPL-010: SHA3-256 Gas最適化

**最適化戦略**:

1. **定数テーブル化**
   - `_getRoundConstant()` → 静的配列
   - `_getRhoOffset()` → 静的配列
   - 期待効果: 条件分岐削除で~30%削減

2. **ループ展開**
   - 24ラウンドの一部を展開
   - 期待効果: ジャンプ削減で~10%削減

3. **メモリ最適化**
   - 中間配列の削減
   - 期待効果: メモリ操作削減で~10%削減

**目標**: 1.3M gas → 800K gas（約40%削減）

## Core Principles確認

- [x] CP-1: 完全量子耐性 - 全keccak256をSHA3-256に置換で違反解消
- [x] CP-2: Self-Custody - 変更なし、違反なし
- [x] CP-3: Time Lock存在 - 変更なし、違反なし
- [x] CP-4: Slashing存在 - 変更なし、違反なし
- [x] CP-5: 透明性 - 変更なし、違反なし

## リスク・懸念事項

| リスク | 影響度 | 緩和策 |
|--------|--------|--------|
| SHA3-256最適化によるバグ導入 | High | 既存24件テストで検証 |
| Gas最適化目標未達成 | Medium | 段階的最適化、許容範囲設定 |
| Slitherで重大な脆弱性検出 | High | 即座に修正、Phase中断も検討 |
| 公開鍵ハッシュ変更によるテスト失敗 | Medium | テストデータの網羅的更新 |

## 完了条件

1. SHA3-256 Gas消費量 ≤ 1M gas（理想800K）
2. **L1Vault.sol内のkeccak256使用ゼロ** ★追加
3. テスト233件全パス
4. Slither Critical/High項目ゼロ
5. PIR-008で✅ PASS判定

---

**このプランは01_plan.md により自動生成されました。**
**02_spec.md レビューによりOption Aが選択され、スコープが拡大されました。**

**END OF CURRENT PLAN**
