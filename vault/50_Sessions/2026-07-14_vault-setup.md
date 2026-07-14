# 2026-07-14_vault-setup

## 対象

- フロー: （横断）プロジェクトメモリ基盤の導入
- レイヤー: docs

## やったこと

- 「Claude × Obsidian で AI 業務メモリを組む」記事の構成を本プロジェクト向けに翻訳し、`vault/` を新設
  - 顧客ファイル → 9 コアシーケンス（`10_Flows/`）に読み替え
  - Memory 7 項目 → プロジェクト概要 / 体制・環境 / シーケンス一覧 / 進行中 / 主要プロセス / 様式 / 判断基準
- `CLAUDE.md` に Project Memory (Vault) セクションを追加（Custom Instructions の 1 行に相当）
- 内容は `docs/ACTUAL_STATE.md`（2026-03-03 時点 Readiness 100%）と `docs/BETA_LAUNCH_GUIDE.md` の実態から転記

## 決定事項

- Vault は git 管理。他のクラウド同期を重ねない
- ファイル名は英語（romaji）、本文は日本語
- モック検出 hooks が全ファイル対象のため、Vault 内では該当パターンを日本語表記で書く

## 積み残し・次回

- `20_Actions.md` の Beta 公開準備タスク（シークレットローテーションが先頭）
- Claude Desktop (Cowork) 側で使う場合は Obsidian MCP + Custom Instructions の設定（`vault/README.md` 参照）
