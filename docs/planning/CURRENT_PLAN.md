# Current Plan

> **Generated**: 2025-12-27 22:30 JST
> **Phase**: 2 - Security Council + Token
> **Week**: 10 (Phase 2.3b)

---

## 📋 対象チェックリスト

- `docs/planning/PHASE2_CHECKLIST.md` → Phase 2.3 (Week 9-12)
- `docs/planning/PHASE2_3_PLAN.md` → Week 10 Proof Compression

---

## 🎉 前回成果 (Week 9)

Week 9は**大成功**で終了：

| 項目 | 目標 | 達成 |
|------|------|------|
| Gas削減率 | ≥40% | ✅ **71%達成** |
| Sepoliaデプロイ | 完了 | ✅ **7コントラクト** |
| PIR-P2-008 | PASS | ✅ |
| PIR-P2-009 | PASS | ✅ |
| テスト | 全PASS | ✅ **649/649** |

---

## 🚧 ブロッカー / 懸念事項

> CURRENT_STATE.mdより取得

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| 1 | 🟡 MEDIUM | ZK-STARK実装の複雑性 | 段階的実装継続 |
| 2 | 🟡 MEDIUM | 外部監査のスケジュール | RFP草案作成完了済み |
| 3 | 🟢 LOW | Etherscan検証未実施 | Week 10で対応 |

**Critical/High課題: なし** ✅

---

## 今回のスコープ

### Week 10 目標

PHASE2_3_PLAN.mdに基づき、**Proof Compression** フェーズを実行。

### 優先度マトリクス

```
🔴 HIGH (必須):
├── MS-1 ZK-STARK継続
└── 外部監査準備

🟡 MEDIUM (推奨):
├── Etherscan検証
└── ProofCompressor設計

🟢 LOW (Optional):
└── Phase 2.3b 追加最適化
```

---

### 実装項目

| # | ID | 項目 | 担当 | 優先度 |
|---|-----|------|------|--------|
| 1 | [IMPL-012] | ProofCompressor.sol設計 | Cryptographer + Engineer | 🟠 HIGH |
| 2 | [IMPL-013] | ProofCompressor.sol実装 | Engineer | 🟠 HIGH |
| 3 | [IMPL-014] | ProofDecoder.sol実装 | Engineer | 🟠 HIGH |
| 4 | [IMPL-015] | SharedMerkle拡張（圧縮対応） | Engineer | 🟡 MEDIUM |

### テスト項目

| # | ID | 項目 | 担当 | 目標 |
|---|-----|------|------|------|
| 1 | [TEST-025] | ProofCompressor単体テスト | QA | 15+ tests |
| 2 | [TEST-026] | 圧縮/解凍往復テスト | QA | 10+ tests |
| 3 | [TEST-027] | Gas圧縮効果ベンチマーク | QA | 50%圧縮確認 |
| 4 | [TEST-028] | 統合テスト（BatchVerifier連携） | QA | 10+ tests |

### インフラ項目

| # | ID | 項目 | 担当 | 優先度 |
|---|-----|------|------|--------|
| 1 | [INFRA-004] | Etherscan検証実行 | DevOps | 🟡 MEDIUM |
| 2 | [INFRA-005] | 監査パッケージ準備開始 | CSO | 🟠 HIGH |

### ドキュメント項目

| # | ID | 項目 | 担当 | 優先度 |
|---|-----|------|------|--------|
| 1 | [DOC-002] | PROOF_COMPRESSION_SPEC.md | Cryptographer | 🟠 HIGH |
| 2 | [DOC-003] | Week 10 Gas Benchmark Report | Engineer | 🟡 MEDIUM |

---

## 📁 参照ドキュメント

| ドキュメント | パス |
|-------------|------|
| 憲法 | `docs/constitution/CORE_PRINCIPLES.md` |
| Phase 2.3計画 | `docs/planning/PHASE2_3_PLAN.md` |
| BatchVerifier仕様 | `docs/planning/BATCH_VERIFICATION_SPEC.md` |
| Gas Baseline (Sepolia) | `docs/deployments/GAS_BASELINE_SEPOLIA.md` |
| PIRコードレビュールーティン | `docs/aegis/PIR_CODE_REVIEW_ROUTINE.md` |

---

## 📦 成果物

| ファイル | 説明 |
|---------|------|
| `src/ProofCompressor.sol` | 証明圧縮コントラクト |
| `src/ProofDecoder.sol` | 証明解凍コントラクト |
| `test/ProofCompressorTest.t.sol` | 圧縮テスト |
| `test/CompressionBenchmarkTest.t.sol` | ベンチマークテスト |
| `docs/planning/PROOF_COMPRESSION_SPEC.md` | 圧縮仕様書 |

---

## 🔄 実行順序

### Day 1-2: 設計フェーズ

1. **[DOC-002]** PROOF_COMPRESSION_SPEC.md作成
   - Merkle Path共有アルゴリズム
   - Evaluation圧縮仕様
   - Challenge再計算戦略
   
2. **[INFRA-004]** Etherscan検証
   - 7コントラクトの検証実行
   - 検証URL記録

### Day 3-4: 実装フェーズ

3. **[IMPL-012]** ProofCompressor.sol設計レビュー
4. **[IMPL-013]** ProofCompressor.sol実装
5. **[IMPL-014]** ProofDecoder.sol実装

### Day 5-6: テストフェーズ

6. **[TEST-025]** ProofCompressor単体テスト
7. **[TEST-026]** 圧縮/解凍往復テスト
8. **[TEST-027]** Gas圧縮効果ベンチマーク

### Day 7: 統合・レビュー

9. **[TEST-028]** 統合テスト実行
10. **[REVIEW]** 内部コードレビュー
11. **フルテストスイート実行** (目標: 700+ tests)
12. **Slither静的解析** (目標: HIGH 0, MEDIUM 0)

---

## ✅ Core Principles確認

| CP | 原則 | 違反リスク | チェック |
|----|------|-----------|----------|
| CP-1 | 完全量子耐性 | ⚠️ 圧縮で暗号学的強度低下リスク | [ ] 暗号学的レビュー必須 |
| CP-2 | Self-Custody | ✅ 影響なし | [x] |
| CP-3 | Time Lock存在 | ✅ 影響なし | [x] |
| CP-4 | Slashing存在 | ✅ 影響なし | [x] |
| CP-5 | 透明性 | ✅ オンチェーン検証維持 | [x] |

### CP-1準拠確認事項

- [ ] ProofCompressor内でkeccak256/SHA-256使用禁止
- [ ] SHA3-256のみ使用
- [ ] 圧縮が暗号学的安全性を損なわないことを検証

---

## 🎯 Week 10 成功基準

| 基準 | 目標 | 判定条件 |
|------|------|----------|
| 証明圧縮率 | ≥50% | ProofCompressorで達成 |
| 解凍Gas | <100,000 gas | ベンチマークで確認 |
| テスト数 | +45 (694→739) | 全PASS |
| Slither | HIGH 0, MEDIUM 0 | 静的解析クリア |
| Etherscan | 7コントラクト検証 | 全検証完了 |

---

## ⚠️ リスク・懸念事項

| # | リスク | 確率 | 影響 | 対策 |
|---|--------|------|------|------|
| 1 | 圧縮率50%未達成 | MEDIUM | MEDIUM | 複数圧縮技法の組み合わせ |
| 2 | 圧縮によるセキュリティ低下 | LOW | HIGH | Cryptographerによる暗号学的レビュー |
| 3 | 解凍GasがTarget超過 | MEDIUM | MEDIUM | インラインアセンブリ最適化 |

---

## 📅 Week 10 完了条件

- [ ] ProofCompressor.sol実装完了
- [ ] ProofDecoder.sol実装完了
- [ ] テスト45件以上追加
- [ ] 証明圧縮率50%以上達成
- [ ] Etherscan検証完了
- [ ] 全テストPASS
- [ ] Slither HIGH 0 / MEDIUM 0
- [ ] PIR-P2-010準備完了

---

**Next Step**: 02_spec.md を実行し、SPEC_REVIEW.mdを作成

---

**END OF CURRENT PLAN**
