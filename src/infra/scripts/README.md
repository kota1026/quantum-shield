# Aegis Workflow Scripts

> Project Aegisの開発ワークフロー自動化スクリプト

---

## 🚀 クイックスタート

```bash
# リポジトリルートで実行
chmod +x scripts/aegis.sh
./scripts/aegis.sh help
```

---

## 📋 コマンド一覧

| コマンド | 説明 | フェーズ |
|---------|------|---------|
| `./aegis.sh plan` | ① 状態確認・計画立案 | 開始時 |
| `./aegis.sh spec` | ② 仕様確認（実装前） | 実装前 |
| `./aegis.sh impl` | ③ 実装 + テスト（TDD） | 実装中 |
| `./aegis.sh review` | ④ セキュリティレビュー | 実装後 |
| `./aegis.sh pir` | ⑤ PIR会議 | レビュー後 |
| `./aegis.sh update` | ⑥ 状態更新 | PIR後 |
| `./aegis.sh gonogo` | ⑦ Go/No-Go会議 | Phase完了時 |
| `./aegis.sh all` | ①〜④を順番に実行 | - |

---

## 🔄 ワークフロー

```
① plan    CURRENT_PLAN.md を生成
    │
    ▼
② spec    仕様確認・Core Principles違反チェック
    │
    ▼
③ impl    TDDで実装（テスト先、実装後）
    │
    ▼
④ review  Red Teamセキュリティレビュー
    │
    ▼
⑤ pir     11エージェントPIR会議（PASS/FAIL判定）
    │
    ▼
⑥ update  CURRENT_STATE.md 更新
    │
    ▼
（Phase完了時のみ）
⑦ gonogo  Go/No-Go判定会議
```

---

## 📁 ファイル構造

```
scripts/
├── aegis.sh              # メインスクリプト
├── README.md             # このファイル
└── prompts/
    ├── 01_plan.md        # ① 計画立案プロンプト
    ├── 02_spec.md        # ② 仕様確認プロンプト
    ├── 03_impl.md        # ③ 実装プロンプト
    ├── 04_review.md      # ④ レビュープロンプト
    ├── 05_pir.md         # ⑤ PIR会議プロンプト
    ├── 06_update.md      # ⑥ 状態更新プロンプト
    └── 07_gonogo.md      # ⑦ Go/No-Go会議プロンプト
```

---

## 💡 使い方

### 1. スクリプト実行

```bash
./scripts/aegis.sh plan
```

### 2. 表示されたプロンプトをコピー

スクリプトがプロンプトを表示し、自動でクリップボードにコピーします。

### 3. Claude Codeに貼り付け

コピーしたプロンプトをClaude Codeに貼り付けて実行。

### 4. 結果を確認して次へ

問題なければ次のコマンドへ進む。

---

## 🔗 関連ドキュメント

| ドキュメント | パス | 用途 |
|-------------|------|------|
| 憲法 | `docs/constitution/CORE_PRINCIPLES.md` | 不変原則 |
| 現在の状態 | `docs/planning/CURRENT_STATE.md` | 進捗管理 |
| 現在の計画 | `docs/planning/CURRENT_PLAN.md` | セッション計画 |
| チェックリスト | `docs/planning/checklists/` | タスク管理 |

---

## ⚠️ 注意事項

- `plan` を実行すると `CURRENT_PLAN.md` が生成されます
- `②〜④` は `CURRENT_PLAN.md` を参照します
- PIR後は `update` で状態を更新してください
- Phase完了時のみ `gonogo` を実行してください

---

**END OF README**
