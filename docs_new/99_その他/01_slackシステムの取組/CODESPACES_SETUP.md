# GitHub Codespaces セットアップガイド

## 概要

ローカルMacBook Air (8GB RAM) でのビルドが困難なため、GitHub Codespaces (4-core, 16GB RAM) への開発環境移行を行います。

## 前提条件

- GitHubアカウント
- リポジトリへのPush権限

## Step 1: リモートリポジトリの作成とPush

### 1.1 GitHubでリポジトリを作成

1. https://github.com/new にアクセス
2. Repository name: `pqc-stark` (または任意の名前)
3. Private または Public を選択
4. "Create repository" をクリック

### 1.2 ローカルリポジトリをPush

```bash
cd /Users/kotakato/pqc_zk/zk-dilithium-ntt

# リモートを追加
git remote add origin https://github.com/<your-username>/pqc-stark.git

# 全ブランチをPush
git push -u origin master
git push origin phase2-extensions
git push origin phase4a-kyber-kem
git push origin phase4c-sphincs-analysis

# タグをPush
git push origin --tags
```

## Step 2: Codespacesの起動

### 2.1 Codespacesを作成

1. GitHubリポジトリページにアクセス
2. "Code" ボタン → "Codespaces" タブ
3. "Create codespace on phase4c-sphincs-analysis" をクリック
4. Machine type: **4-core, 16GB RAM** を選択

### 2.2 環境設定の自動実行

`.devcontainer/devcontainer.json` により、以下が自動的にセットアップされます：

- Rust 最新版
- rust-analyzer 拡張機能
- SP1 zkVM ツールチェーン

初回起動時に `.devcontainer/setup.sh` が実行され、ビルドとテストが自動で行われます。

## Step 3: SP1ベンチマークの実行

```bash
# プロジェクトルートに移動
cd /workspaces/pqc-stark

# SP1ベンチマークプロジェクトをビルド
cd sp1-bench/script
cargo run --release
```

## トラブルシューティング

### SP1がインストールされない場合

```bash
curl -L https://sp1up.succinct.xyz | bash
source ~/.bashrc
sp1up
```

### メモリ不足エラー

Codespacesのマシンタイプを8-core, 32GB RAMにアップグレードしてください。

### ビルドエラー

```bash
# キャッシュをクリア
cargo clean

# 再ビルド
cargo build --release
```

## リソース使用量の目安

| 操作 | 所要時間 | メモリ使用量 |
|------|----------|--------------|
| cargo build --release | ~2分 | ~4GB |
| cargo test | ~30秒 | ~2GB |
| SP1 証明生成 | ~30秒 | ~8GB |

## コスト

GitHub Codespacesは月間60時間まで無料（個人アカウント）。
4-core マシンの場合、約15時間の利用が無料枠内。
