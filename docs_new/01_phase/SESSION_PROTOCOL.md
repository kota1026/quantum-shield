# Session Protocol - 開発セッション開始プロトコル

> **Version**: 2.0
> **Date**: 2026-01-12
> **Purpose**: 各開発セッションで一貫したPromptシステム使用を保証する
> **Update**: タスク管理フロー改善（計画66%漏れ問題対策）

---

## 0. 計画→タスク変換（新規計画時のみ）

> **重要**: 新しいPhaseや計画書が作成された場合、必ずこのセクションを実行

### Step 0.1: タスク抽出

```
□ 27_task_extraction.md を読む
□ 計画書の全セクションを走査
□ Phase X.0（ブロッカー）を最優先で抽出
□ Appendix の全リストを確認
```

### Step 0.2: 整合性検証

```
□ 計画工数 ≈ タスク工数（±10%）確認
□ 計画API EP = タスクAPI EP 確認
□ ブロッカー100%カバー確認
□ タスク番号に欠番がないか確認
```

### Step 0.3: タスクリスト確定

```
□ TASK_P{N}_FULL_LIST.md を作成
□ 全タスクに計画参照(§番号)を付与
□ 依存関係を定義
□ 完了条件を追加
```

### ⚠️ 検証失敗時

```
整合性チェックがFAILの場合:
1. 抽出漏れを特定
2. 計画書を再読
3. 漏れタスクを追加
4. 再検証
→ PASSするまで繰り返す
```

---

## 1. セッション開始チェックリスト

セッション開始時に以下を順番に実行してください：

### Step 1: 状態確認
```
□ EVENT_LOG.md を読む → 前回セッションの作業内容確認
□ CURRENT_TASK.md を読む → 現在のタスク状態確認
□ 26_phase5_planner.md §10 を読む → 進捗トラッキング確認
```

### Step 2: タスク決定
```
□ CURRENT_TASK.md のステータスが「Active」か確認
  - Active → Step 3へ
  - 完了済み → 26_phase5_planner.md から次タスクを選択

□ 新タスクの場合: CURRENT_TASK.md を更新
  - 20_task_define.md のテンプレートに従う
```

### Step 3: Prompt読み込み
```
□ 実装開始前に 21_impl_verify_loop.md を読む
□ 検証ループの上限回数を確認（通常: 5回）
□ 完了条件を CURRENT_TASK.md で再確認
```

---

## 2. タスク種類別Promptフロー

### 2.1 標準タスク（API実装、機能追加等）

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 20_task_define.md → CURRENT_TASK.md 作成                │
│ 2. 21_impl_verify_loop.md → 実装＋検証（max 5 loop）       │
│ 3. 25_event_log.md → EVENT_LOG.md 更新                     │
│ 4. コミット＆プッシュ                                       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 重要機能（Contract、セキュリティ関連）

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 20_task_define.md → CURRENT_TASK.md 作成                │
│ 2. 21_impl_verify_loop.md → 実装＋検証（max 5 loop）       │
│ 3. 22_three_agent.md → 3エージェント協調                   │
│ 4. 23_multi_candidate.md → 複数候補生成（optional）        │
│ 5. 24_sandbox_execute.md → サンドボックス実行              │
│ 6. 25_event_log.md → EVENT_LOG.md 更新                     │
│ 7. 05_pir.md → PIRレビュー                                 │
│ 8. コミット＆プッシュ                                       │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 簡易タスク（ドキュメント更新、設定変更等）

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 作業実施                                                 │
│ 2. 25_event_log.md → EVENT_LOG.md 更新                     │
│ 3. コミット＆プッシュ                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Prompt一覧（クイックリファレンス）

| # | Prompt | 目的 | 使用タイミング |
|---|--------|------|---------------|
| 20 | `20_task_define.md` | タスク形式化 | タスク開始時 |
| 21 | `21_impl_verify_loop.md` | 検証ループ付き実装 | 実装時（必須） |
| 22 | `22_three_agent.md` | 3エージェント協調 | セキュリティ重要時 |
| 23 | `23_multi_candidate.md` | 複数候補生成 | 最適解選択時 |
| 24 | `24_sandbox_execute.md` | サンドボックス実行 | Contract時 |
| 25 | `25_event_log.md` | イベントログ | タスク完了時 |
| 26 | `26_phase5_planner.md` | Phase 5計画 | タスク選択時 |
| **27** | `27_task_extraction.md` | **計画→タスク抽出** | **新Phase開始時（必須）** |

---

## 4. 検証ループ（21_impl_verify_loop.md）の実行

### 4.1 ループ構造

```
Loop N (max 5):
├── 1. 実装/修正
├── 2. ビルド検証
│   └── cargo build / npm run build
├── 3. テスト実行
│   └── cargo test / npm test
├── 4. 静的解析（Contract時）
│   └── slither / mythril
├── 5. 結果判定
│   ├── ALL PASS → ループ終了
│   └── FAIL → エラー解析 → 次ループ
└── 6. エラー解析
    └── エラー原因特定 → 修正方針決定
```

### 4.2 ループ失敗時

```
Loop 1-3: 自動修正試行
Loop 4:   設計見直し検討
Loop 5:   部分実装で先行、残りを別タスク化
Loop 5超: ユーザーに相談
```

---

## 5. EVENT_LOG.md 更新ルール

### 5.1 記録すべきイベント

| イベント | 記録タイミング |
|---------|---------------|
| `TASK_START` | タスク開始時 |
| `IMPLEMENTATION` | ファイル作成/修正時 |
| `VERIFICATION_LOOP` | 検証ループ完了時 |
| `COMMIT` | コミット時 |
| `TASK_COMPLETE` | タスク完了時 |

### 5.2 記録フォーマット

```markdown
### Event: {EVENT_TYPE}
- **Time**: YYYY-MM-DD
- **Task**: TASK-P5-XXX
- **Details**:
  - ファイル: `path/to/file`
  - 結果: PASS/FAIL
  - テスト: N passed
```

---

## 6. セッション終了チェックリスト

```
□ EVENT_LOG.md が最新状態か確認
□ CURRENT_TASK.md のステータスを更新
  - 完了 → status: DONE, completion date追加
  - 継続 → 次回の開始ポイントを記載
□ 変更をコミット＆プッシュ
□ 26_phase5_planner.md の進捗を更新（タスク完了時）
```

---

## 7. ユーザーへの指示例

セッション開始時にユーザーが指示する際の例：

### 例1: 新タスク開始
```
TASK-P5-005を開始してください。
SESSION_PROTOCOL.mdに従って、Promptを使用して進めてください。
```

### 例2: 継続作業
```
前回のセッションから作業を再開してください。
SESSION_PROTOCOL.mdのStep 1から確認してください。
```

### 例3: 特定Promptの使用指定
```
TASK-P5-005を21_impl_verify_loop.mdに従って実装してください。
```

---

## 8. Prompt読み込みコマンド

各Promptを読むためのファイルパス：

```
docs_new/02_agents_prompt/02_prompts/20_task_define.md
docs_new/02_agents_prompt/02_prompts/21_impl_verify_loop.md
docs_new/02_agents_prompt/02_prompts/22_three_agent.md
docs_new/02_agents_prompt/02_prompts/23_multi_candidate.md
docs_new/02_agents_prompt/02_prompts/24_sandbox_execute.md
docs_new/02_agents_prompt/02_prompts/25_event_log.md
docs_new/02_agents_prompt/02_prompts/26_phase5_planner.md
docs_new/02_agents_prompt/02_prompts/27_task_extraction.md  # 計画→タスク抽出
```

---

**END OF SESSION PROTOCOL**
