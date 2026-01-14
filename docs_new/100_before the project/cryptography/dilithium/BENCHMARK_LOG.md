# ベンチマークログ

## Benchmark Results for Dilithium STARK

**実行日時**: 2025年12月14日
**プラットフォーム**: macOS (Apple Silicon M3)
**Rust バージョン**: stable
**ビルドモード**: Release (optimized)

---

## システム構成

| パラメータ | 値 |
|------------|-----|
| トレース幅 | 37 カラム |
| 遷移制約数 | 25 |
| 境界制約数 | 8 |
| セキュリティビット | 128 |

---

## ベンチマーク結果

### 詳細ログ

```
===========================================
  Dilithium Signature Verification STARK
  (Post-Quantum Zero-Knowledge Proof)
===========================================

Components: NTT + FMA + Truncation + Keccak + Norm Check
Trace Width: 37 columns
Constraints: 25 transition + 8 boundary

Target proof time: 10.0 seconds
Running on M3 Mac with optimized settings...

-------------------------------------------
Testing: 2^8 (256 rows) - Quick test
-------------------------------------------
  Trace generation time: 79.417µs
  Trace dimensions: 256 rows x 37 columns
  Proof generation time: 9.111917ms
  Proof size: 19787 bytes (19.32 KB)
  ✅ Target achieved: 0.01s <= 10.0s
  ✅ Verification passed in 456.584µs

-------------------------------------------
Testing: 2^10 (1024 rows) - Small
-------------------------------------------
  Trace generation time: 284.292µs
  Trace dimensions: 1024 rows x 37 columns
  Proof generation time: 27.129708ms
  Proof size: 25059 bytes (24.47 KB)
  ✅ Target achieved: 0.03s <= 10.0s
  ✅ Verification passed in 612.875µs

-------------------------------------------
Testing: 2^12 (4096 rows) - Medium
-------------------------------------------
  Trace generation time: 1.17175ms
  Trace dimensions: 4096 rows x 37 columns
  Proof generation time: 68.002333ms
  Proof size: 31547 bytes (30.81 KB)
  ✅ Target achieved: 0.07s <= 10.0s
  ✅ Verification passed in 992.667µs

-------------------------------------------
Testing: 2^14 (16384 rows) - Large
-------------------------------------------
  Trace generation time: 3.399291ms
  Trace dimensions: 16384 rows x 37 columns
  Proof generation time: 313.219375ms
  Proof size: 37631 bytes (36.75 KB)
  ✅ Target achieved: 0.31s <= 10.0s
  ✅ Verification passed in 3.62675ms

-------------------------------------------
Testing: 2^16 (65536 rows) - Full NTT target
-------------------------------------------
  Trace generation time: 13.832ms
  Trace dimensions: 65536 rows x 37 columns
  Proof generation time: 1.321999166s
  Proof size: 44504 bytes (43.46 KB)
  ✅ Target achieved: 1.32s <= 10.0s
  ✅ Verification passed in 15.300292ms

===========================================
  Benchmark Complete
===========================================
```

---

## サマリーテーブル

| トレースサイズ | 行数 | トレース生成 | 証明生成 | 証明サイズ | 検証時間 |
|---------------|------|-------------|----------|------------|----------|
| 2^8 | 256 | 79.4µs | 9.1ms | 19.32 KB | 0.46ms |
| 2^10 | 1,024 | 284.3µs | 27.1ms | 24.47 KB | 0.61ms |
| 2^12 | 4,096 | 1.17ms | 68.0ms | 30.81 KB | 0.99ms |
| 2^14 | 16,384 | 3.40ms | 313.2ms | 36.75 KB | 3.63ms |
| 2^16 | 65,536 | 13.8ms | **1.32s** | **43.46 KB** | 15.3ms |

---

## 性能分析

### スケーリング特性

| メトリクス | 倍率 (2^8 → 2^16) | 理論計算量 |
|------------|------------------|------------|
| トレース生成 | 174x | O(n) |
| 証明生成 | 145x | O(n log n) |
| 証明サイズ | 2.25x | O(log n) |
| 検証時間 | 33x | O(log n) |

### ターゲット達成状況

| メトリクス | ターゲット | 実測値 | ステータス |
|------------|-----------|--------|------------|
| 証明時間 (65536行) | < 10秒 | 1.32秒 | ✅ 達成 |
| 証明サイズ | 対数的 | 43.46 KB | ✅ 達成 |
| 検証時間 | < 100ms | 15.3ms | ✅ 達成 |

---

## テスト実行ログ

```
running 46 tests
test formal_verification::tests::test_boundary_constraints_spec ... ok
test formal_verification::tests::test_chunk_membership ... ok
test formal_verification::tests::test_decomposition_implies_t16 ... ok
test formal_verification::tests::test_fma_integer_relation ... ok
test formal_verification::tests::test_fma_soundness_proof ... ok
test formal_verification::tests::test_fma_soundness_proof_edge_cases ... ok
test formal_verification::tests::test_fma_soundness_proof_report ... ok
test formal_verification::tests::test_fma_spec_verification ... ok
test formal_verification::tests::test_k_equals_zero_theorem ... ok
test formal_verification::tests::test_montgomery_congruence ... ok
test formal_verification::tests::test_norm_bound_spec ... ok
test formal_verification::tests::test_prc_invalid_init ... ok
test formal_verification::tests::test_prc_soundness_proof ... ok
test formal_verification::tests::test_prc_soundness_proof_invalid_boundary ... ok
test formal_verification::tests::test_prc_soundness_proof_invalid_chunk ... ok
test formal_verification::tests::test_prc_soundness_report ... ok
test formal_verification::tests::test_prc_spec_verification ... ok
test formal_verification::tests::test_proof_bounds_verification ... ok
test formal_verification::tests::test_row_chunks_all_in_t16 ... ok
test formal_verification::tests::test_row_chunks_decomposition ... ok
test formal_verification::tests::test_verification_report ... ok
test formal_verification::tests::test_z_invariance_theorem ... ok
test formal_verification::tests::test_z_transition_valid ... ok
test air::tests::test_air_creation ... ok
test air::tests::test_boundary_assertion_count ... ok
test air::tests::test_constraint_count ... ok
test air::tests::test_public_inputs_to_elements ... ok
test prover::tests::test_boundary_constraints_match ... ok
test prover::tests::test_prove_and_verify ... ok
test prover::tests::test_public_inputs_extraction ... ok
test trace::tests::test_all_constraints_large_trace ... ok
test trace::tests::test_all_constraints_with_norm_check ... ok
test trace::tests::test_build_trace ... ok
test trace::tests::test_dilithium_full_verification_trace ... ok
test trace::tests::test_fma_constraint_in_field ... ok
test trace::tests::test_keccak_chi_step ... ok
test trace::tests::test_keccak_chi_step_field ... ok
test trace::tests::test_keccak_constraints_in_trace ... ok
test trace::tests::test_montgomery_butterfly ... ok
test trace::tests::test_montgomery_fma ... ok
test trace::tests::test_norm_check_constraints_in_trace ... ok
test trace::tests::test_norm_decompose ... ok
test trace::tests::test_selector_constraints ... ok
test trace::tests::test_trace_fma_columns ... ok
test trace::tests::test_truncation ... ok
test trace::tests::test_truncation_constraint_in_field ... ok

test result: ok. 46 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

---

## 実行環境

- **OS**: macOS (Darwin 24.6.0)
- **CPU**: Apple Silicon M3
- **メモリ**: 十分な RAM (詳細は要確認)
- **Rust**: stable チャネル
- **最適化**: Release ビルド (-O3)

---

**ログ作成日**: 2025年12月14日
