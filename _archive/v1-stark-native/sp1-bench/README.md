# SP1 Dilithium STARK Benchmark

課題 36 / Week 1: SP1 (Succinct zkVM) ベンチマーク

## 概要

このベンチマークは、既存の Dilithium STARK 検証ロジックを SP1 zkVM 上で実行し、
再帰的証明の実装基盤としての適性を評価します。

## 目的

1. **互換性検証**: Rust で書かれた STARK 検証コードが SP1 (RISC-V) 上で動作するか
2. **サイクル計測**: 検証に要する RISC-V サイクル数（証明生成コストの指標）
3. **開発効率**: 既存コードの再利用可能性

## ディレクトリ構成

```
sp1-bench/
├── program/           # SP1 Guest (zkVM内で実行されるコード)
│   ├── Cargo.toml
│   └── src/main.rs
├── script/            # Host (証明生成・計測を行うコード)
│   ├── Cargo.toml
│   ├── build.rs
│   └── src/main.rs
└── README.md
```

## 前提条件

### SP1 ツールチェーンのインストール

```bash
# SP1 インストーラーを実行
curl -L https://sp1up.succinct.xyz | bash

# パスを通す
source ~/.bashrc  # または ~/.zshrc

# SP1 をインストール
sp1up
```

### 環境変数

```bash
# CPU のみで実行（GPUがない場合）
export SP1_PROVER=local

# または Succinct Network を利用（要 API キー）
# export SP1_PROVER=network
# export SP1_PRIVATE_KEY=your_private_key
```

## 実行方法

### 1. ゲストプログラムのビルド

```bash
cd sp1-bench/program
cargo prove build
```

### 2. ベンチマークの実行

```bash
cd sp1-bench/script
cargo run --release
```

## 期待される出力

```
╔══════════════════════════════════════════════════════════════╗
║     SP1 Dilithium STARK Verification Benchmark               ║
║     Phase 1: Recursive Proof Technology Evaluation           ║
╚══════════════════════════════════════════════════════════════╝

[1/4] Initializing SP1 Prover Client...
[2/4] Loading compiled guest program (ELF)...
[3/4] Running benchmarks...

┌────────────┬────────────────┬────────────────┬──────────────┐
│ Trace Size │ Total Cycles   │ Exec Time (ms) │ Status       │
├────────────┼────────────────┼────────────────┼──────────────┤
│        256 │        1.23M   │            150 │ ✓ Success    │
│        512 │        2.45M   │            280 │ ✓ Success    │
│       1024 │        4.91M   │            520 │ ✓ Success    │
│       2048 │        9.82M   │           1050 │ ✓ Success    │
│       4096 │       19.65M   │           2100 │ ✓ Success    │
└────────────┴────────────────┴────────────────┴──────────────┘

[4/4] Analysis
═══════════════════════════════════════════════════════════════
Scaling Analysis:
  Trace size increase: 16.0x (256 → 4096)
  Cycle count increase: 16.0x
  Scaling factor: O(n^1.00)

Cost Estimation (Succinct Network):
  N=4096 verification: ~19.65M cycles
  Estimated proof cost: $0.0197

Recommendations:
═══════════════════════════════════════════════════════════════
✓ SP1 is RECOMMENDED for this workload
  - Cycle efficiency is acceptable
  - Direct Rust code reuse achieved
  - Succinct Network integration available
```

## ベンチマーク指標

| 指標 | 説明 | 目標値 |
|------|------|--------|
| Total Cycles | RISC-V 命令数 | < 50M (N=4096) |
| Scaling | トレースサイズに対するスケーリング | O(n) ～ O(n log n) |
| Proof Time | SP1 証明生成時間 | < 60秒 (GPU) |

## 次のステップ

### SP1 が適切と判断された場合

1. 実際の Winterfell 検証ロジックを統合
2. Succinct Network でのリモート証明生成をテスト
3. バッチ処理による効率化を検討

### 比較検討が必要な場合

1. Plonky2 ベースの実装を検討
2. カスタム STARK 再帰回路の設計
3. コスト対効果の詳細分析

## 参考資料

- [SP1 Documentation](https://docs.succinct.xyz/)
- [Succinct Network](https://network.succinct.xyz/)
- [SP1 Precompiles](https://docs.succinct.xyz/verification/off-chain/precompiles)
