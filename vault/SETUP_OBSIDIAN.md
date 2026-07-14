# Obsidian セットアップ手順（実際に動かすまで）

> 所要時間の目安: 15〜20 分。ゴールは「Claude Desktop (Cowork) が Obsidian 経由でこの `vault/` を読み書きし、毎回 `00_Memory.md` を踏まえて回答する」状態。

## 前提

- この `vault/` は git 管理された Markdown フォルダ。Obsidian からは「フォルダを Vault として開く」だけで使える
- 同期は **git のみ**。iCloud / Google Drive / Obsidian Sync をこのフォルダに重ねない（競合でコピーファイルが量産される事故を防ぐ）
- `.obsidian/`（Obsidian の個人設定）は `.gitignore` 済み。各自のローカルにだけ作られる

## Step 1: Obsidian でこの Vault を開く（5 分）

1. https://obsidian.md からインストール（Mac / Windows / Linux）
2. 手元にリポジトリを clone していなければ: `git clone git@github.com:kota1026/quantum-shield.git`
3. Obsidian 起動 → **「保管庫としてフォルダを開く」(Open folder as vault)** → `quantum-shield/vault` を選択
4. サイドバーに `00_Memory` 〜 `50_Sessions` が番号順に並べば OK

## Step 2: Local REST API プラグインを入れる（3 分）

Claude が Vault を読み書きするための入口。

1. Obsidian の 設定 → **コミュニティプラグイン** → 制限モードをオフ
2. 「閲覧」から **Local REST API**（Adam Coddington 作）を検索 → インストール → 有効化
3. プラグイン設定画面に表示される **API Key をコピー**（Step 3 で使う）
4. ポートはデフォルトのまま: HTTPS `27124` / HTTP `27123`

## Step 3: Claude Desktop に mcp-obsidian を登録する（5 分）

橋渡し役の MCP サーバー。実績のある [MarkusPfundstein/mcp-obsidian](https://github.com/MarkusPfundstein/mcp-obsidian) を使う。

1. `uv` が未インストールなら: `curl -LsSf https://astral.sh/uv/install.sh | sh`（Windows は `winget install astral-sh.uv`）
2. Claude Desktop → 設定 → 開発者 → **「構成を編集」** で `claude_desktop_config.json` を開き、以下を追加:

```json
{
  "mcpServers": {
    "mcp-obsidian": {
      "command": "uvx",
      "args": ["mcp-obsidian"],
      "env": {
        "OBSIDIAN_API_KEY": "Step 2 でコピーしたキー",
        "OBSIDIAN_HOST": "127.0.0.1",
        "OBSIDIAN_PORT": "27124"
      }
    }
  }
}
```

3. Claude Desktop を再起動 → 接続アイコンに mcp-obsidian が表示されれば成功

## Step 4: Custom Instructions に 1 行入れる（1 分）

Claude Desktop → 設定 → プロフィール（Personalization）の指示欄に:

> 回答の前に、Obsidian vault の関連ノートを必ず検索してください。まず 00_Memory.md を読み、検索結果を踏まえて回答してください。新しい決定事項やタスクは 20_Actions.md と該当する 10_Flows/ のファイルに追記してください。

## Step 5: 動作確認（3 分）

Obsidian を起動したまま（Local REST API はアプリ起動中のみ動く）、Claude Desktop で以下を順に聞く:

1. 「私の Vault の 00_Memory.md を読んで、このプロジェクトの現状を 3 行で要約して」
   → Beta 公開準備フェーズ・Readiness 100% 等が返れば読み取り OK
2. 「Seq #1 Consumer Lock の L1 トランザクションハッシュは？」
   → `0xd295f0f7...542297` が返ればリンク辿りも OK
3. 「20_Actions.md に『動作確認完了』というタスクを完了済みで追記して」
   → ファイルに追記されれば書き込み OK（確認後、この行は消してよい）

## 日々の運用

- **朝**: Cowork で「今日やるべきことを 20_Actions.md から出して」
- **作業後**: 「今日の決定事項を該当フローに書き戻して、50_Sessions/ にログを残して」
- **同期**: Vault を編集したら `git pull` → 作業 → `git commit && git push`。Claude Code 側のセッションは CLAUDE.md 経由で同じ Vault を読むので、両者の記憶が git で揃う

## 議事録の流し込み（必要になったら）

1. 議事録ツール（Notta / tl;dv / Google Meet 文字起こし）でテキスト化
2. `50_Sessions/` に `YYYY-MM-DD_打ち合わせ名.md` で保存（最初は手動ドロップで十分）
3. Cowork に「今週の新着議事録を読んで、決定事項と宿題を 20_Actions.md と該当フローに追記して」と頼む

## トラブルシューティング

| 症状 | 対処 |
|------|------|
| Claude が Vault を見つけられない | Obsidian が起動しているか / Local REST API が有効か / API Key の貼り間違い |
| 証明書エラーが出る | `OBSIDIAN_PORT` を `27123`（HTTP）に変えて再起動 |
| `uvx` が見つからない | ターミナル再起動 or `command` を uv の絶対パスに（Mac: `~/.local/bin/uvx`） |
| コピーファイルが増殖 | クラウド同期が二重になっていないか確認。この Vault は git のみで同期する |
