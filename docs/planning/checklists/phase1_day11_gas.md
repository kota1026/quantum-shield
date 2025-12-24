# Phase 1 - Day 11: Gas最適化 + 署名メッセージSHA3化

> **Created**: 2025-12-24
> **Target**: SHA3-256 Gas最適化、署名メッセージSHA3-256化、Slither静的解析
> **Reference Plan**: `docs/planning/CURRENT_PLAN.md`

---

## 📋 チェックリスト

### Phase A: SHA3-256 Gas最適化

#### 分析
- [ ] A-1: 現在のSHA3-256 Gas消費量を測定
- [ ] A-2: ボトルネック箇所を特定（_getRoundConstant, _getRhoOffset, keccakF）
- [ ] A-3: 最適化戦略を決定

#### 実装
- [ ] A-4: Round定数を`uint64[24]`静的配列に変換
- [ ] A-5: Rhoオフセットを`uint256[25]`静的配列に変換
- [ ] A-6: 内部ループ最適化（必要に応じて）
- [ ] A-7: ドキュメントコメント更新

#### 検証
- [ ] A-8: SHA3_256Test 24件パス確認
- [ ] A-9: Gas消費量測定（目標: ≤1M gas）
- [ ] A-10: NIST test vectorとの一致確認

### Phase B: 署名メッセージSHA3-256化

#### 実装
- [ ] B-1: `_verifyThresholdSignatures()` 内のkeccak256をSHA3-256に変更
- [ ] B-2: `_verifySimplified()` のkeccak256使用を確認・対処
- [ ] B-3: 必要に応じてヘルパー関数追加

#### 検証
- [ ] B-4: QuantumShieldTest 35件パス確認
- [ ] B-5: L1VaultIntegrationTest 51件パス確認
- [ ] B-6: 署名検証フローの手動確認

### Phase C: 静的解析

#### Slither実行
- [ ] C-1: Slitherインストール確認
- [ ] C-2: `slither contracts/src/L1Vault.sol` 実行
- [ ] C-3: `slither contracts/src/libraries/SHA3_256.sol` 実行

#### 結果分析
- [ ] C-4: 検出項目の分類（Critical/High/Medium/Low/Info）
- [ ] C-5: False Positiveの除外
- [ ] C-6: Critical/High項目の修正

#### 修正後
- [ ] C-7: 再スキャン実行
- [ ] C-8: Critical/Highゼロ確認

### Phase D: 統合検証

#### テスト
- [ ] D-1: `forge test --gas-report` 実行
- [ ] D-2: 全233件テストパス確認
- [ ] D-3: Gas消費量レポート確認

#### ドキュメント
- [ ] D-4: PIR-008.md 作成
- [ ] D-5: CURRENT_STATE.md 更新
- [ ] D-6: 最新実装レポート更新

---

## ✅ 完了条件

| 条件 | 基準 | チェック |
|------|------|----------|
| SHA3-256 Gas | ≤ 1M gas (理想800K) | [ ] |
| 署名メッセージSHA3化 | keccak256完全排除 | [ ] |
| テスト | 233件全パス | [ ] |
| Slither | Critical/Highゼロ | [ ] |
| PIR-008 | ✅ PASS判定 | [ ] |

---

## 📚 参照ドキュメント

- 憲法: `docs/constitution/CORE_PRINCIPLES.md`
- PIR-006: `docs/aegis/pir/PIR-006.md`
- シーケンス: `docs/constitution/QUANTUM_SHIELD_SEQUENCES_v2.0_REF.md`
- 統合仕様: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md`

---

**END OF CHECKLIST**
