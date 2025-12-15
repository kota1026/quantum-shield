# Dilithium STARK 監査パッケージ

## Security Audit Package for Dilithium Signature Verification ZK-STARK

**プロジェクト**: `zk-dilithium-ntt`
**バージョン**: 0.1.0
**監査準備日**: 2025年12月14日
**対象プラットフォーム**: macOS (Apple Silicon M3)

---

## I. パッケージ概要

本パッケージは、Dilithium 署名検証 ZK-STARK 回路のセキュリティ監査に必要な全成果物を含みます。

### 監査スコープ

| カテゴリ | 対象 | 優先度 |
|----------|------|--------|
| 形式検証 | C1 FMA / C2 PRC 健全性証明 | 検証済み |
| 実装コード | Rust ソースコード (3,304行) | **監査対象** |
| 暗号プリミティブ | Montgomery FMA, NTT, Keccak χ | **重点監査** |
| 範囲検証 | PRC (Permutation Range Check) | **重点監査** |

---

## II. ファイル構成

### A. 形式検証成果物 (検証済み)

```
formal_proofs/
├── coq/
│   ├── Montgomery_FMA.v      (412行) - C1 FMA健全性証明
│   └── PRC_Soundness.v       (347行) - C2 PRC健全性証明
└── isabelle/
    ├── Montgomery_FMA.thy    (329行) - C1 FMA健全性証明
    └── PRC_Soundness.thy     (339行) - C2 PRC健全性証明

合計: 1,427行の形式証明コード
```

**主要定理**:
- `k_equals_zero`: フィールド等式 ⟹ 整数等式
- `FMA_Soundness`: Montgomery FMA の正当性
- `Z_constant`: Z アキュムレータの不変性
- `PRC_Soundness`: 範囲検証の健全性

### B. 実装コード (監査対象)

```
src/
├── air.rs                    (531行) - AIR 制約定義
├── constants.rs              (111行) - Dilithium 定数
├── formal_verification.rs   (1,295行) - 形式検証の計算的対応
├── lib.rs                     (41行) - ライブラリエントリ
├── main.rs                   (117行) - ベンチマークランナー
├── prover.rs                 (242行) - STARK Prover
└── trace.rs                  (967行) - トレース生成

合計: 3,304行の Rust コード
```

### C. ドキュメント

| ファイル | 内容 |
|----------|------|
| `FORMAL_VERIFICATION_REPORT.md` | 形式検証最終報告書 |
| `FORMAL_VERIFICATION_SPEC.md` | 形式検証仕様書 |
| `TECHNICAL_DOCUMENTATION.md` | 技術ドキュメント |
| `AUDIT_PACKAGE.md` | 本ファイル |
| `VULNERABILITY_ANALYSIS.md` | 脆弱性分析サマリー |

---

## III. 性能データ

### ベンチマーク結果 (M3 Mac, Release Build)

| トレースサイズ | 証明時間 | 証明サイズ | 検証時間 |
|---------------|----------|------------|----------|
| 2^8 (256行) | 9.1ms | 19.32 KB | 0.46ms |
| 2^10 (1024行) | 27.1ms | 24.47 KB | 0.61ms |
| 2^12 (4096行) | 68.0ms | 30.81 KB | 0.99ms |
| 2^14 (16384行) | 313.2ms | 36.75 KB | 3.63ms |
| 2^16 (65536行) | **1.32s** | **43.46 KB** | 15.3ms |

### システム構成

- **回路幅**: 37 カラム
- **遷移制約**: 25 個
- **境界制約**: 8 個
- **セキュリティビット**: 128

---

## IV. 暗号パラメータ

### Dilithium Level 3 パラメータ

| パラメータ | 値 | 説明 |
|------------|-----|------|
| Q | 8,380,417 | Dilithium 剰余 (2^23 - 2^13 + 1) |
| R | 2^32 | Montgomery 因子 |
| R_sqrt | 2^16 | 分解基数 |
| β (NORM_BOUND) | 60,000 | ノルム境界 |
| neg_Q_inv_mod_R | 4,236,238,847 | -Q^(-1) mod R |

### Winterfell フィールド

| パラメータ | 値 |
|------------|-----|
| P | 2^128 - 45·2^40 + 1 |
| 値 | 340,282,366,920,938,463,463,374,607,393,113,505,793 |

---

## V. 監査フォーカスエリア

### 重点監査対象ファイル

1. **`src/trace.rs`** (967行)
   - `montgomery_fma()`: Montgomery 積和演算
   - `montgomery_butterfly()`: NTT バタフライ
   - `keccak_chi_step()`: Keccak χ ステップ
   - `norm_decompose()`: ノルム分解

2. **`src/air.rs`** (531行)
   - `evaluate_transition()`: 遷移制約評価
   - `get_assertions()`: 境界制約

3. **`src/prover.rs`** (242行)
   - `prove()`: 証明生成
   - `verify()`: 証明検証

### 監査チェックリスト

- [ ] V1: サイドチャネル耐性 (定数時間実行)
- [ ] V2: Keccak 仕様適合性
- [ ] V3: PRC 網羅性
- [ ] V4: 整数オーバーフロー安全性
- [ ] V5: メモリ安全性 (Rust unsafe 使用)
- [ ] V6: 乱数生成の安全性

---

## VI. ビルドと実行

### 環境要件

```toml
[dependencies]
winterfell = "0.11"
rand = "0.8"
```

### ビルドコマンド

```bash
# テスト実行
cargo test

# リリースビルド
cargo build --release

# ベンチマーク実行
cargo run --release
```

### 期待される出力

```
===========================================
  Dilithium Signature Verification STARK
  (Post-Quantum Zero-Knowledge Proof)
===========================================
...
test result: ok. 46 passed; 0 failed
```

---

## VII. 連絡先

監査に関する質問は、プロジェクト管理者にお問い合わせください。

---

**パッケージ作成日**: 2025年12月14日
**形式検証ステータス**: 完了 (C1 FMA + C2 PRC)
**実装監査ステータス**: 準備完了
