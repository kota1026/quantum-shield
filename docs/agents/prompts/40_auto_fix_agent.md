# Implementation Orchestrator Prompt

> **目的**: CHANGE_PLAN.md と APP_DESIGN_SPECS.md に基づき、実装を自動実行するオーケストレーター
> **更新日**: 2026-01-24
> **バージョン**: v2.0（v1.0 QAチェッカーから全面改訂）

---

## 概要

このオーケストレーターは、設計ドキュメントを読み取り、実装タスクを自動実行します。
実装完了後、品質チェックエージェントを2-3回実行し、問題を修正してから完了とします。

---

## トリガーコマンド

```
/execute-plan                    ← CHANGE_PLAN.md の全タスクを実行
/execute-plan --app consumer     ← 特定アプリのみ
/execute-plan --task 1.3.5       ← 特定タスクのみ
/execute-plan --dry-run          ← プレビュー（実行しない）
```

---

## 実行フロー

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Implementation Orchestrator                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ PHASE 0: 初期化                                                │ │
│  │                                                               │ │
│  │ 1. CHANGE_PLAN.md 読み込み                                    │ │
│  │ 2. APP_DESIGN_SPECS.md 読み込み                               │ │
│  │ 3. PHASE6_PROGRESS.md 読み込み（進捗確認）                    │ │
│  │ 4. 未完了タスクの特定                                         │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              ↓                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ PHASE 1: タスク分類                                            │ │
│  │                                                               │ │
│  │ タスクタイプを判定:                                           │ │
│  │ ├── Type A: 新規画面作成                                      │ │
│  │ ├── Type B: 既存画面修正                                      │ │
│  │ ├── Type C: 画面統合・削除                                    │ │
│  │ ├── Type D: URL/ルーティング変更                              │ │
│  │ └── Type E: ドキュメント更新                                  │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              ↓                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ PHASE 2: 実装実行                                              │ │
│  │                                                               │ │
│  │ 各タスクに対して:                                             │ │
│  │ 1. APP_DESIGN_SPECS.md から該当セクションを取得               │ │
│  │ 2. HTMLモック（存在すれば）を読み込み                         │ │
│  │ 3. タスクタイプに応じた実装を実行                             │ │
│  │ 4. i18n キー追加（ja/en）                                     │ │
│  │ 5. 進捗を PHASE6_PROGRESS.md に記録                           │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              ↓                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ PHASE 3: 品質チェックループ（2-3回）                          │ │
│  │                                                               │ │
│  │ Round 1:                                                      │ │
│  │   → 00_master_checklist.md で全項目チェック                   │ │
│  │   → 01_journey_validator.md でジャーニー検証                  │ │
│  │   → 02_transition_checker.md で遷移完全性検証                 │ │
│  │   → 問題があれば修正                                          │ │
│  │                                                               │ │
│  │ Round 2:                                                      │ │
│  │   → 同じチェックを再実行                                      │ │
│  │   → 問題があれば修正                                          │ │
│  │                                                               │ │
│  │ Round 3 (必要な場合):                                         │ │
│  │   → 最終確認                                                  │ │
│  │   → 問題ゼロで完了                                            │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              ↓                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ PHASE 4: 完了報告                                              │ │
│  │                                                               │ │
│  │ 1. 実装サマリー出力                                           │ │
│  │ 2. PHASE6_PROGRESS.md 更新                                    │ │
│  │ 3. 次のタスクを提案                                           │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## PHASE 0: 初期化

### 読み込むドキュメント

```yaml
必須（優先度順）:
  # デザイン（優先度高い順に参照）
  - docs/design/assets/design-concept-5-japan-premium.html  # ⚠️ 最優先：デザイントークン定義
  - docs/design/DESIGN_SYSTEM.md                            # デザインパターン・ルール
  - docs/design/DESIGN_REVIEW_AGENTS.md                     # 11体レビューエージェント定義

  # 仕様
  - docs/specs/CHANGE_PLAN.md          # 変更計画
  - docs/specs/APP_DESIGN_SPECS.md     # 画面仕様
  - docs/phase6/PHASE6_PROGRESS.md     # 進捗管理

参照:
  - docs/specs/DATA_MODEL.md           # エンティティ定義
  - docs/specs/SEQUENCES.md            # フロー定義
  - docs/specs/URL_REFERENCE.md        # URL一覧

⚠️ 注意: HTMLモックは旧デザインの可能性あり（参考程度）:
  - docs/design/mocks/{app}/*.html     # 最低優先度、design-concept-5と矛盾する場合は無視
```

### デザイン参照の優先度ルール

```
⚠️ 重要：デザインの矛盾が発生した場合の優先順位

1. design-concept-5-japan-premium.html（カラー、トークン）
2. DESIGN_SYSTEM.md（パターン、ルール）
3. APP_DESIGN_SPECS.md（画面構成、項目）
4. HTMLモック（レイアウト参考のみ）

HTMLモックが上位と矛盾する場合 → HTMLモックを無視
```

### 修正対象アプリ

```yaml
修正対象:
  - qs-hub      # Token Hub + Governance 統合
  - prover      # 名称変更・5ステップ化
  - observer    # 機能追加
  - enterprise  # 自社版QS Admin化
  - admin       # ライセンサー業務追加
  - explorer    # 画面統合

部分修正対象:
  - consumer    # ⚠️ 以下の画面のみ修正対象
      - Dashboard ヘッダー（他アプリとの統一）
      - Settings 画面（他アプリとの統一）
```

### 未完了タスク特定ロジック

```typescript
// CHANGE_PLAN.md のタスクテーブルを解析
interface Task {
  id: string;           // "1.3.5" など
  app: string;          // "qs-hub", "enterprise" など
  title: string;        // タスク名
  detail: string;       // 詳細
  estimate: number;     // 工数(h)
  status: 'pending' | 'in_progress' | 'done';
}

// PHASE6_PROGRESS.md と照合して status を判定
function getTaskStatus(taskId: string): TaskStatus {
  const progress = readPhase6Progress();
  // 該当画面のステータスから判定
}
```

---

## PHASE 1: タスク分類

### タスクタイプ定義

| Type | 判定条件 | 実行アクション |
|:----:|----------|---------------|
| **A** | 「追加」「新規」キーワード | 新規ファイル作成 |
| **B** | 「修正」「拡張」「名称変更」 | 既存ファイル編集 |
| **C** | 「統合」「削除」 | ファイル統合/削除 + リダイレクト |
| **D** | 「移行」「URL」 | ルーティング変更 |
| **E** | 「翻訳」「ドキュメント」 | ドキュメント更新 |

### タスク判定例

```
タスク: "Dashboard統合 - veQS残高 + 提案数 + 報酬を1画面に"
  └─ キーワード「統合」 → Type C

タスク: "Exit画面追加"
  └─ キーワード「追加」 → Type A

タスク: "Signatures → Queue名称変更"
  └─ キーワード「名称変更」 → Type B
```

---

## PHASE 2: 実装実行

### Type A: 新規画面作成

```markdown
## 実行手順

1. APP_DESIGN_SPECS.md から画面仕様を取得
   - 画面目的
   - 表示項目
   - ユーザーアクション
   - 遷移先

2. HTMLモック確認
   - `docs/design/mocks/{app}/{screen}.html` が存在するか
   - 存在すれば参照、なければ仕様から生成

3. ファイル作成
   - `apps/web/src/app/[locale]/{app}/{screen}/page.tsx`
   - コンポーネント分割が必要な場合は components/ にも

4. i18n追加
   - `apps/web/locales/ja/{app}.json`
   - `apps/web/locales/en/{app}.json`

5. Storybook（時間があれば）
   - `apps/web/src/components/{app}/{Screen}.stories.tsx`
```

### Type B: 既存画面修正

```markdown
## 実行手順

1. 現在のコードを読み込み
   - 既存の実装を理解

2. APP_DESIGN_SPECS.md から変更点を特定
   - 追加すべき要素
   - 削除すべき要素
   - 変更すべき要素

3. 最小限の変更で修正
   - 既存コードを尊重
   - 破壊的変更を避ける

4. i18n更新（必要な場合）
```

### Type C: 画面統合・削除

```markdown
## 実行手順

1. 統合先画面の設計を確認

2. 統合元から必要な機能を抽出
   - コンポーネント
   - ロジック
   - i18nキー

3. 統合先に機能を追加

4. リダイレクト設定
   - 旧URL → 新URL へのリダイレクト
   - middleware.ts または next.config.js

5. 統合元を削除（または非推奨マーク）
```

### Type D: URL/ルーティング変更

```markdown
## 実行手順

1. 新しいディレクトリ構造を作成
   - `apps/web/src/app/[locale]/{new-path}/`

2. 既存ファイルを移動

3. インポートパスを更新

4. リダイレクト設定

5. URL_REFERENCE.md を更新
```

### Type E: ドキュメント更新

```markdown
## 実行手順

1. 対象ドキュメントを特定

2. 変更内容を反映
   - 翻訳キー更新
   - 仕様書更新
   - README更新

3. 更新履歴を追記
```

---

## PHASE 3: 品質チェックループ

### Round 1: 基本チェック + CDOデザインレビュー

```markdown
## 00_master_checklist.md に基づくチェック

### Phase 1: 実装前確認 → 実装後再確認
- [ ] ジャーニー確認: 前画面・次画面・戻る先が明確
- [ ] データ確認: APIエンドポイント、エンティティ定義
- [ ] デザイン確認: DESIGN_SYSTEM準拠

### Phase 2: ボタン/アクション定義
- [ ] 全ボタンにローディング状態
- [ ] 全ボタンに成功/失敗時の遷移・フィードバック

### Phase 4: デザインチェック
- [ ] primaryボタン1つ
- [ ] 情報階層明確
- [ ] タップエリア44px以上

### Phase 5: i18n
- [ ] ハードコード文字列なし
- [ ] ja/enキー追加済み

## ⚠️ CDOレビュー（DESIGN_REVIEW_AGENTS.md 参照）

### ブランド一貫性
- [ ] Premium Japan コンセプト準拠
- [ ] 日の丸モチーフの適切な使用（控えめに、でも印象的に）
- [ ] カラーパレット準拠（design-concept-5-japan-premium.html）
- [ ] 他アプリと統一感があるか

### デザインシステム準拠
- [ ] DESIGN_SYSTEM.md のコンポーネントのみ使用
- [ ] 未定義パターンを使用していない
- [ ] タイポグラフィ・スペーシングが統一

### ビジュアル品質
- [ ] レイアウトバランスが取れている
- [ ] 余白が適切（「呼吸させる」）
- [ ] 情報が詰め込みすぎでない
```

### Round 2: ジャーニー検証 + ペルソナレビュー

```markdown
## 01_journey_validator.md に基づくチェック

- [ ] この画面への全入口が定義されている
- [ ] この画面からの全出口が定義されている
- [ ] ユーザーが迷わないナビゲーション
- [ ] ペルソナ視点で自然なフロー

## ⚠️ ペルソナレビュー（DESIGN_REVIEW_AGENTS.md 参照）

対象アプリに応じて適切なペルソナでレビュー:

| アプリ | 主要ペルソナ |
|--------|-------------|
| Consumer | 田中さん（End User）、鈴木さん（Token Holder） |
| QS Hub | 鈴木さん（Token Holder）、渡辺さん（Delegate） |
| Prover | 山田さん（Prover） |
| Observer | 小林さん（Observer） |
| Enterprise | 佐藤さん（Enterprise Admin） |
| QS Admin | 高橋さん（QS Admin） |

### ペルソナチェック項目
- [ ] このペルソナが目的を達成できるか
- [ ] 専門用語で混乱しないか（ツールチップ等）
- [ ] 操作に迷わないか
- [ ] 安心感があるか
```

### Round 3: 遷移完全性検証 + 最終統一チェック

```markdown
## 02_transition_checker.md に基づくチェック

- [ ] router.push の遷移先が全て存在
- [ ] Link href の遷移先が全て存在
- [ ] 戻るボタンの遷移先が適切
- [ ] 完了後の遷移が定義されている

## ⚠️ 最終デザイン統一チェック

### クロスアプリ一貫性
- [ ] ヘッダー構成が他アプリと統一
- [ ] フッター構成が他アプリと統一
- [ ] ボタンスタイルが統一
- [ ] カラー使用が統一
- [ ] エラー/成功表示が統一
- [ ] ローディング表示が統一

### 禁止パターンチェック（DESIGN_SYSTEM.md Section 13）
- [ ] 12px未満のフォントなし
- [ ] 44px未満のタップエリアなし
- [ ] 色のみでのエラー表示なし
- [ ] 確認なしの削除操作なし
```

### 修正ループ

```
┌─────────────────────────────────────────────────────────────────────┐
│ Round 1 → 問題あり → 修正                                           │
│    ↓                                                                │
│ Round 2 → 問題あり → 修正                                           │
│    ↓                                                                │
│ Round 3 → 問題あり → 修正 → Round 1に戻る                           │
│    ↓                                                                │
│ 全Round問題ゼロ → 完了 ✅                                           │
└─────────────────────────────────────────────────────────────────────┘

最大3サイクルまで。3サイクル後も問題残存 → 手動対応フラグ
```

---

## PHASE 4: 完了報告

### 報告テンプレート

```markdown
## 実装完了レポート

### 実行サマリー

| 項目 | 値 |
|------|-----|
| 実行日時 | {datetime} |
| 対象アプリ | {app} |
| 実行タスク数 | {count} |
| 品質チェック回数 | {rounds} |

### 完了タスク

| # | タスク | タイプ | 成果物 |
|---|--------|:------:|--------|
| 1 | {task1} | A | `{file1}` |
| 2 | {task2} | B | `{file2}` |

### 品質チェック結果

| Round | 検出問題 | 修正済み | 残問題 |
|:-----:|:--------:|:--------:|:------:|
| 1 | 5 | 5 | 0 |
| 2 | 2 | 2 | 0 |
| 3 | 0 | - | 0 |

### 更新ファイル一覧

```
apps/web/src/app/[locale]/{app}/
├── {screen1}/page.tsx  (新規)
├── {screen2}/page.tsx  (修正)
└── ...

apps/web/locales/
├── ja/{app}.json  (+{n}キー)
└── en/{app}.json  (+{n}キー)
```

### 次のタスク

{CHANGE_PLAN.md の次の未完了タスク}
```

---

## 使用例

### 例1: 全タスク実行

```
User: /execute-plan

Orchestrator:
  PHASE 0: 初期化完了
    - CHANGE_PLAN.md: 6セクション、計42タスク
    - 未完了タスク: 38件
    - 本日の推奨: QS Hub統合（14タスク）

  実行しますか？ [Y/n]

User: Y

Orchestrator:
  PHASE 1: タスク分類完了
    - Type A (新規): 4件
    - Type B (修正): 6件
    - Type C (統合): 3件
    - Type D (URL): 1件

  PHASE 2: 実装開始
    [1/14] Landing統合...
    ...
```

### 例2: 特定アプリのみ

```
User: /execute-plan --app enterprise

Orchestrator:
  対象: Enterprise Admin
  未完了タスク: 8件

  実行タスク:
  1. Dashboard再設計
  2. Prover Calendar追加
  3. Support画面追加
  4. 環境セレクター実装
  ...
```

### 例3: 特定タスクのみ

```
User: /execute-plan --task 2.2.3

Orchestrator:
  タスク: "Application 5ステップ化"
  アプリ: Prover Portal
  タイプ: B (既存画面修正)

  実行を開始します...
```

---

## 設定

### orchestrator.config.json

```json
{
  "qualityCheckRounds": 3,
  "maxRoundsWithIssues": 3,
  "autoFixEnabled": true,
  "dryRunDefault": false,
  "progressFile": "docs/phase6/PHASE6_PROGRESS.md",
  "apps": {
    "consumer": { "priority": "low", "target": "partial", "screens": ["dashboard-header", "settings"], "note": "部分修正：ヘッダー・設定画面のみ" },
    "qs-hub": { "priority": "high", "target": true },
    "prover": { "priority": "high", "target": true },
    "observer": { "priority": "high", "target": true },
    "explorer": { "priority": "low", "target": true },
    "enterprise": { "priority": "medium", "target": true },
    "admin": { "priority": "medium", "target": true }
  },
  "design": {
    "primaryReference": "docs/design/assets/design-concept-5-japan-premium.html",
    "systemReference": "docs/design/DESIGN_SYSTEM.md",
    "reviewAgents": "docs/design/DESIGN_REVIEW_AGENTS.md",
    "mockPriority": "lowest"
  }
}
```

---

## 関連プロンプト・ドキュメント

### 実装フェーズ（PHASE 2）

| ドキュメント | 役割 |
|-------------|------|
| `design-concept-5-japan-premium.html` | ⚠️ **最優先**：デザイントークン定義 |
| `DESIGN_SYSTEM.md` | デザインパターン・ルール |
| `APP_DESIGN_SPECS.md` | 画面仕様 |
| `30_ui_impl.md` | UI実装詳細プロンプト |
| `HTMLモック` | 参考程度（矛盾時は無視） |

### 品質チェックフェーズ（PHASE 3）

| プロンプト | 役割 | 実行タイミング |
|-----------|------|---------------|
| `00_master_checklist.md` | 実装チェックリスト | Round 1 |
| `DESIGN_REVIEW_AGENTS.md` | CDO + 11体ペルソナレビュー | Round 1, 2 |
| `01_journey_validator.md` | ジャーニー検証 | Round 2 |
| `02_transition_checker.md` | 遷移完全性検証 | Round 3 |

---

## 更新履歴

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-24 | 初版（QAチェッカーとして） |
| 2.0 | 2026-01-24 | 全面改訂：実装オーケストレーターに変更 |
| 2.1 | 2026-01-24 | デザイン参照優先度追加、DESIGN_REVIEW_AGENTS統合、Consumer除外明記、CDO+ペルソナレビュー追加 |
