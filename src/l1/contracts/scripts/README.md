# Quantum Shield - セキュリティ分析ツール

## 概要

このディレクトリには、Quantum Shield プロジェクトのセキュリティ分析に使用するスクリプトが含まれています。

## ファイル一覧

```
scripts/
├── run_slither.sh         # Slither静的解析スクリプト
├── check_cp1_compliance.sh # CP-1準拠チェック（keccak256検出）
└── slither.config.json    # Slither設定ファイル
```

## セットアップ

### 前提条件

1. **Python 3.8+**
   ```bash
   python3 --version
   ```

2. **Foundry**
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

3. **Slither & solc-select**
   ```bash
   pip3 install slither-analyzer solc-select
   ```

4. **Solidity 0.8.20**
   ```bash
   solc-select install 0.8.20
   solc-select use 0.8.20
   ```

## 使用方法

### 1. Slither 静的解析

```bash
cd quantum-shield/contracts
chmod +x scripts/run_slither.sh
./scripts/run_slither.sh
```

**出力:**
- `slither-reports/slither_report_YYYYMMDD_HHMMSS.md` - Markdownレポート
- `slither-reports/slither_report_YYYYMMDD_HHMMSS.json` - JSONレポート

### 2. CP-1 準拠チェック

```bash
cd quantum-shield/contracts
chmod +x scripts/check_cp1_compliance.sh
./scripts/check_cp1_compliance.sh
```

**検出対象:**
- ❌ `keccak256` - Grover's algorithm に脆弱
- ❌ `sha256` - FIPS 202 非準拠
- ❌ `ecrecover` / `ECDSA` - Shor's algorithm に脆弱
- ❌ `RSA` - Shor's algorithm に脆弱

**出力:**
- `compliance-reports/cp1_compliance_YYYYMMDD_HHMMSS.md`

## Slither 手動実行

設定ファイルを使用する場合:

```bash
cd quantum-shield/contracts

# 基本実行
slither . --config-file scripts/slither.config.json

# 特定のコントラクトのみ
slither src/L1Vault.sol --config-file scripts/slither.config.json

# 特定の脆弱性のみチェック
slither . --detect reentrancy-eth,arbitrary-send-eth

# JSON出力
slither . --json slither_output.json

# 依存関係を除外
slither . --exclude-dependencies

# High/Mediumのみ
slither . --exclude-low --exclude-informational
```

## 重要な検出器

### 必須チェック（High/Medium影響）

| 検出器 | 説明 |
|--------|------|
| `reentrancy-eth` | ETH送金を伴う再入攻撃 |
| `reentrancy-no-eth` | 状態変更の再入攻撃 |
| `arbitrary-send-eth` | 任意アドレスへのETH送金 |
| `suicidal` | 自己破壊可能なコントラクト |
| `uninitialized-state` | 初期化されていない状態変数 |
| `unchecked-lowlevel` | 未チェックの低レベル呼び出し |
| `tx-origin` | tx.origin認証の使用 |

### Quantum Shield 固有チェック

| チェック | 目的 |
|----------|------|
| CP-1 準拠 | keccak256 → SHA3-256 移行確認 |
| CEI パターン | Check-Effects-Interactions 順序 |
| イベント発行 | 状態変更時のイベント確認 |

## PIR への統合

PIR（Post-Implementation Review）では以下を実施:

1. **Slither 実行**
   ```bash
   ./scripts/run_slither.sh
   ```

2. **CP-1 チェック**
   ```bash
   ./scripts/check_cp1_compliance.sh
   ```

3. **結果コミット**
   ```bash
   git add slither-reports/ compliance-reports/
   git commit -m "docs(security): PIR-P2-XXX Slither analysis"
   ```

## トラブルシューティング

### solc が見つからない

```bash
solc-select install 0.8.20
solc-select use 0.8.20
export PATH="$HOME/.solc-select/artifacts:$PATH"
```

### Foundry ビルドエラー

```bash
forge clean
forge build --force
```

### 依存関係エラー

```bash
forge install
```

## 参考リンク

- [Slither GitHub](https://github.com/crytic/slither)
- [Slither Detectors](https://github.com/crytic/slither/wiki/Detector-Documentation)
- [Quantum Shield CORE_PRINCIPLES.md](../docs/constitution/CORE_PRINCIPLES.md)
