# Transition & Action Checker Agent

> **目的**: 全てのボタン/アクションの完了後フローを検証
> **更新日**: 2026-01-24
> **関連**: [01_journey_validator.md](./01_journey_validator.md)

---

## Agent概要

このAgentは、画面上の全てのインタラクティブ要素について以下を検証します：

1. クリック後のローディング状態が定義されているか
2. 成功時の遷移/UI更新が定義されているか
3. 失敗時の復帰手段が定義されているか
4. 確認が必要な操作に確認フローがあるか

---

## 検証対象

### インタラクティブ要素の種類

| 種類 | 例 | 必須チェック |
|------|---|-------------|
| **送信ボタン** | 「保存」「送信」「作成」 | ローディング、成功、失敗 |
| **確認ボタン** | 「承認」「却下」「削除」 | 確認モーダル、ローディング、成功、失敗 |
| **危険ボタン** | 「緊急停止」「ライセンス停止」 | 3段階確認、ローディング、成功、失敗 |
| **ナビゲーション** | リンク、タブ、メニュー | 遷移先 |
| **フィルター/検索** | 検索ボタン、フィルター適用 | ローディング、結果表示、空結果 |
| **エクスポート** | PDF/CSV出力 | 形式選択、生成中、ダウンロード |
| **トグル/スイッチ** | 設定のON/OFF | 即時反映、確認、失敗時ロールバック |

---

## 検証ルール

### Rule 1: ローディング状態

```
全てのAPI呼び出しを伴うボタンにローディング状態を定義すること。

必須項目:
□ ボタンの見た目変更（Spinner追加 or テキスト変更）
□ ボタンのdisabled化
□ 連打防止

推奨:
□ 処理に3秒以上かかる場合はプログレス表示
□ キャンセル可能な場合はキャンセルボタン表示
```

### Rule 2: 成功時フロー

```
API成功時の挙動を明確に定義すること。

必須項目:
□ 遷移先 OR UI更新内容
□ フィードバック（トースト、モーダル、インライン）
□ フィードバックのメッセージ内容

パターン別:

【フォーム送信成功】
→ トースト表示 + 次画面へ遷移

【設定保存成功】
→ トースト表示 + 同画面に留まる + UI更新

【削除成功】
→ トースト表示 + 一覧を更新（削除した項目を除外）

【作成成功】
→ 成功モーダル表示 + 詳細画面へ遷移
```

### Rule 3: 失敗時フロー

```
API失敗時の挙動を明確に定義すること。

必須項目:
□ エラー表示位置（トースト、モーダル、インライン）
□ エラーメッセージ（ユーザーが理解できる内容）
□ 復帰方法（リトライ、戻る、フォーム修正）

エラー種別:
- バリデーションエラー → インライン表示 + 該当フィールドハイライト
- ネットワークエラー → トースト + リトライボタン
- 認証エラー → ログイン画面へリダイレクト
- サーバーエラー → エラーページ表示 + サポート連絡先
```

### Rule 4: 確認フロー

```
確認が必要な操作を分類し、適切な確認フローを定義すること。

【通常確認（1段階）】
対象: 削除、承認、却下
フロー: ボタン → 確認モーダル → 実行

【重要確認（2段階）】
対象: Slash、退出、大量操作
フロー: ボタン → 影響説明 → 確認モーダル → 実行

【危険確認（3段階）】
対象: Emergency Pause、License Suspension、Contract終了
フロー: ボタン → 理由入力 → 影響範囲表示 → タイプ確認 → 実行
```

---

## アクションパターン定義

### Pattern A: 標準フォーム送信

```typescript
interface StandardFormAction {
  trigger: 'submit button click';

  loading: {
    button: 'Spinner + disabled',
    form: 'all fields disabled',
  };

  success: {
    feedback: 'toast',
    message: 't("form.success")',
    navigation: 'router.push("/next-page")',
  };

  failure: {
    validation: {
      display: 'inline',
      highlight: 'error fields',
    },
    server: {
      display: 'toast',
      action: 'none (stay on page)',
    },
  };
}
```

### Pattern B: 確認付き削除

```typescript
interface DeleteAction {
  trigger: 'delete button click';

  confirmation: {
    type: 'modal',
    title: 't("delete.confirm.title")',
    message: 't("delete.confirm.message", { name })',
    confirmButton: 'danger variant',
    cancelButton: 'ghost variant',
  };

  loading: {
    modal: 'confirm button shows Spinner',
    list: 'item shows deleting state',
  };

  success: {
    feedback: 'toast',
    message: 't("delete.success")',
    action: 'close modal + remove item from list',
  };

  failure: {
    display: 'toast in modal',
    action: 'modal stays open + retry option',
  };
}
```

### Pattern C: 危険操作（3段階確認）

```typescript
interface DangerousAction {
  trigger: 'dangerous button click';

  step1_reason: {
    type: 'modal',
    title: 't("action.reason.title")',
    input: 'textarea for reason',
    validation: 'min 10 characters',
    nextButton: 't("next")',
  };

  step2_impact: {
    type: 'modal page 2',
    title: 't("action.impact.title")',
    content: 'list of affected items/users',
    warning: 'danger callout with consequences',
    nextButton: 't("understand")',
  };

  step3_confirm: {
    type: 'modal page 3',
    title: 't("action.confirm.title")',
    instruction: 't("type.to.confirm", { text: "SUSPEND" })',
    input: 'text field',
    validation: 'exact match required',
    confirmButton: 'danger variant, enabled only when match',
  };

  loading: {
    modal: 'full modal loading overlay',
  };

  success: {
    feedback: 'success modal',
    message: 't("action.success")',
    action: 'close modal + redirect to result page',
  };

  failure: {
    display: 'error in modal',
    action: 'stay on step 3 + retry option',
  };
}
```

### Pattern D: エクスポート

```typescript
interface ExportAction {
  trigger: 'export button click';

  format_selection: {
    type: 'dropdown or modal',
    options: ['PDF', 'CSV', 'Excel'],
  };

  loading: {
    type: 'progress indicator',
    message: 't("export.generating")',
    cancelable: true,
  };

  success: {
    action: 'trigger download',
    feedback: 'toast',
    message: 't("export.success")',
  };

  failure: {
    display: 'toast',
    action: 'retry option',
  };
}
```

---

## 検証チェックリスト

### 画面ごとのチェック

```
画面名: _______________

【送信ボタン】
□ ボタン名: _______________
  □ ローディング状態定義済み
  □ 成功時遷移/更新定義済み
  □ 成功フィードバック定義済み
  □ 失敗時表示定義済み
  □ 失敗復帰方法定義済み

【確認ボタン】
□ ボタン名: _______________
  □ 確認モーダル定義済み
  □ 確認メッセージ定義済み
  □ ローディング状態定義済み
  □ 成功時遷移/更新定義済み
  □ 失敗時表示定義済み

【ナビゲーション】
□ リンク/ボタン名: _______________
  □ 遷移先定義済み
  □ ローディング状態定義済み（必要な場合）

【その他】
□ 要素名: _______________
  □ 動作定義済み
```

---

## 検証レポートテンプレート

```markdown
# Transition & Action Validation Report

## 基本情報
- 対象アプリ: _______________
- 画面名: _______________
- 検証日: _______________

## アクション一覧

| # | 要素 | 種類 | ローディング | 成功 | 失敗 | 確認 |
|---|------|------|:------------:|:----:|:----:|:----:|
| 1 | | | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌/N/A |

## 問題点

| # | 要素 | 問題 | 重要度 | 修正案 |
|---|------|------|:------:|--------|
| 1 | | | | |

## 結論

- [ ] PASS
- [ ] CONDITIONAL
- [ ] FAIL
```

---

## 更新履歴

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-24 | 初版作成 |
