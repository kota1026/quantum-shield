# Quantum Shield — Project Memory Vault

このディレクトリは、Claude (Code / Desktop Cowork) が毎セッション読み込む「プロジェクトの引き継ぎ書」です。
Obsidian で Vault としてそのまま開けます（プレーンな Markdown のみ、プラグイン不要）。

## 構成

| パス | 役割 |
|------|------|
| `00_Memory.md` | 引き継ぎ書の中心。Claude が最初に読むファイル |
| `10_Flows/` | 9 コアシーケンス（≒顧客ファイル相当）。1 フロー 1 ファイルで状態・合意・論点をストック |
| `20_Actions.md` | オープンなタスク台帳（担当・期日・関連フロー） |
| `30_Library/` | 判断基準・用語集など「考え方の本棚」 |
| `40_Templates/` | セッションログ・意思決定ログの雛形 |
| `50_Sessions/` | 作業セッションの記録。`YYYY-MM-DD_トピック.md` で命名 |

## 運用ルール

1. **セッション開始時**: Claude は `00_Memory.md` を読み、作業対象のフローがあれば `10_Flows/` の該当ファイルも読む。
2. **セッション終了時**: 決定事項・完了タスクを `20_Actions.md` と該当フローに書き戻し、`50_Sessions/` にログを 1 枚残す（雛形は `40_Templates/session-log.md`）。
3. **完璧を目指さない**: Memory は育てるもの。「これは共有しておくべきだった」と気付いた時点で追記する。
4. **同期の注意**: この Vault は git で同期される。別のクラウド同期（iCloud / Google Drive）を同じフォルダに重ねないこと。

## Claude Desktop (Cowork) から使う場合

Obsidian MCP（例: mcp-obsidian + Local REST API プラグイン）でこのフォルダを Vault として登録し、
Custom Instructions に以下を 1 行入れる:

> 回答の前に、Obsidian vault の関連ノートを必ず検索してください。検索結果を踏まえて回答し、新しい決定事項やタスクは該当ファイルに追記してください。

Claude Code では `CLAUDE.md` の「Project Memory (Vault)」セクションが同じ役割を果たします。
