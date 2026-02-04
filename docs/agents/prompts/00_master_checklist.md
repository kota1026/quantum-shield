# Master Implementation Checklist

> **目的**: 全画面実装時に漏れを防ぐための統一チェックリスト
> **更新日**: 2026-01-24
> **関連**: [QUALITY_ASSURANCE_REVIEW.md](../../specs/QUALITY_ASSURANCE_REVIEW.md)

---

## 使用方法

画面実装を開始する前に、このチェックリストを確認してください。
全ての項目が「完了」になるまで、画面は未完成とみなします。

---

## Phase 1: 実装前確認

### 1.1 ジャーニー確認

```
□ この画面はどのユーザージャーニーに属するか明確か？
  └─ 対象ペルソナ: _______________
  └─ ジャーニーステップ: _______________

□ 前画面からの遷移パターンを確認したか？
  └─ 前画面1: _______________ → トリガー: _______________
  └─ 前画面2: _______________ → トリガー: _______________

□ 次画面への遷移パターンを確認したか？
  └─ 次画面1: _______________ ← トリガー: _______________
  └─ 次画面2: _______________ ← トリガー: _______________

□ 「戻る」ボタンの遷移先は明確か？
  └─ 戻る先: _______________
```

### 1.2 データ確認

```
□ 必要なAPIエンドポイントを確認したか？
  └─ GET: _______________
  └─ POST: _______________
  └─ PUT: _______________
  └─ DELETE: _______________

□ 使用するエンティティをDATA_MODEL.mdで確認したか？
  └─ エンティティ1: _______________
  └─ エンティティ2: _______________

□ オンチェーン/オフチェーンの処理境界を確認したか？
  └─ オンチェーン処理: _______________
  └─ オフチェーン処理: _______________
```

### 1.3 デザイン確認

```
□ DESIGN_SYSTEM.mdで使用コンポーネントを確認したか？
  └─ コンポーネント一覧: _______________

□ 定義されていないパターンを使用する場合、DESIGN_SYSTEM.mdに追加したか？
  └─ 追加パターン: _______________

□ カラー、スペーシングはDesign Tokenのみ使用か？
  └─ 確認: □ はい / □ 要修正
```

---

## Phase 2: ボタン/アクション定義

**重要**: 画面上の全てのボタン/リンク/クリック可能要素について、以下を定義すること。

### アクション定義テンプレート

```
【ボタン/アクション名】: _______________

1. クリック時:
   □ ローディング状態を表示する
   □ ボタンをdisabledにする
   □ ローディングインジケーター: [Spinner / プログレスバー / スケルトン]

2. 成功時:
   □ 遷移先: _______________
   □ 遷移方法: [router.push / router.replace / モーダルclose]
   □ UI更新: _______________
   □ フィードバック: [トースト / モーダル / インライン]
   □ メッセージ: _______________

3. 失敗時:
   □ エラー表示位置: [トースト / モーダル / インライン]
   □ エラーメッセージ: _______________
   □ 復帰方法: [リトライボタン / 戻るボタン / 自動リトライ]
   □ ログ送信: [する / しない]

4. キャンセル時（該当する場合）:
   □ 確認ダイアログ表示: [する / しない]
   □ データ保持: [する / しない]
   □ 遷移先: _______________
```

### よくあるアクションパターン

#### パターンA: フォーム送信

```typescript
// 標準実装
const handleSubmit = async () => {
  setIsLoading(true);
  try {
    const result = await api.submit(formData);
    toast.success(t('success.message'));
    router.push('/next-page');
  } catch (error) {
    toast.error(error.message);
  } finally {
    setIsLoading(false);
  }
};
```

#### パターンB: 削除確認

```typescript
// 2段階確認
const handleDelete = () => {
  setShowConfirmModal(true);
};

const confirmDelete = async () => {
  setIsDeleting(true);
  try {
    await api.delete(itemId);
    toast.success(t('delete.success'));
    setShowConfirmModal(false);
    refreshList();
  } catch (error) {
    toast.error(error.message);
  } finally {
    setIsDeleting(false);
  }
};
```

#### パターンC: 危険操作（3段階確認）

```typescript
// Emergency Pause, License Suspension等
const handleDangerousAction = () => {
  setStep(1); // 理由入力
};

const confirmReason = () => {
  setStep(2); // 影響範囲表示
};

const confirmImpact = () => {
  setStep(3); // 最終確認（タイプ入力）
};

const executeAction = async () => {
  if (typeConfirmation !== expectedText) return;

  setIsExecuting(true);
  try {
    await api.execute(reason);
    toast.success(t('executed'));
    router.push('/result');
  } catch (error) {
    toast.error(error.message);
  } finally {
    setIsExecuting(false);
  }
};
```

---

## Phase 3: 状態定義

### 3.1 画面状態

```
□ ローディング状態（初期読み込み）
  └─ 表示: [フルスクリーンSpinner / スケルトン / プログレスバー]

□ 空状態（データなし）
  └─ 表示: [イラスト + メッセージ + CTAボタン]
  └─ メッセージ: _______________
  └─ CTAボタン: _______________

□ エラー状態（API失敗）
  └─ 表示: [エラーメッセージ + リトライボタン]
  └─ メッセージ: _______________

□ 成功状態（データあり）
  └─ 表示: 通常コンテンツ
```

### 3.2 フォーム状態

```
□ 入力中
  └─ リアルタイムバリデーション: [する / しない]
  └─ 文字数カウンター: [表示する / しない]

□ バリデーションエラー
  └─ エラー表示位置: [フィールド下 / サマリー]
  └─ エラーメッセージ: 具体的な修正方法を含む

□ 送信中
  └─ フォーム全体disabled
  └─ 送信ボタンにSpinner

□ 送信成功
  └─ 成功メッセージ + 遷移
```

---

## Phase 4: デザインチェック

```
□ primaryボタンは1画面に1つのみか？
  └─ 確認: □ はい / □ 要修正

□ 情報階層が明確か？
  └─ 見出し: text-2xl (24px)
  └─ サブ見出し: text-lg (18px)
  └─ 本文: text-base (16px)

□ タップエリアは44px × 44px以上か？
  └─ 確認: □ 全てOK / □ 要修正箇所: _______________

□ コントラスト比4.5:1以上か？
  └─ 確認: □ 全てOK / □ 要修正箇所: _______________

□ ローディング状態のUIが定義されているか？
  └─ 確認: □ 定義済み / □ 要追加

□ エラー状態のUIが定義されているか？
  └─ 確認: □ 定義済み / □ 要追加

□ 空状態のUIが定義されているか？
  └─ 確認: □ 定義済み / □ 要追加
```

---

## Phase 5: i18n・アクセシビリティ

### 5.1 i18n

```
□ 全テキストがt()関数経由か？
  └─ ハードコード文字列: □ なし / □ あり（要修正）

□ ja/{app}.json にキーを追加したか？
  └─ キー数: _______________

□ en/{app}.json にキーを追加したか？
  └─ キー数: _______________

□ 動的値はprops経由か？
  └─ 例: t('message', { count: 5 })
```

### 5.2 アクセシビリティ

```
□ 全インタラクティブ要素にキーボードアクセス可能か？
  └─ tabIndexが適切に設定されているか

□ 画像にalt属性があるか？
  └─ 確認: □ 全てあり / □ 要追加

□ フォーカス状態が視覚的に明確か？
  └─ 確認: □ 全てOK / □ 要修正

□ スクリーンリーダー対応か？
  └─ aria-label: 必要箇所に設定
  └─ role: 必要箇所に設定

□ 色だけで情報を伝えていないか？
  └─ 確認: □ アイコン併用 / □ 要修正
```

---

## Phase 6: 完了確認

```
□ React Component 作成完了
  └─ パス: apps/web/src/app/[locale]/{app}/{screen}/page.tsx

□ Storybook Story 作成完了
  └─ パス: apps/web/src/components/{app}/{Screen}.stories.tsx

□ i18n ja 追加完了
  └─ パス: apps/web/locales/ja/{app}.json

□ i18n en 追加完了
  └─ パス: apps/web/locales/en/{app}.json

□ E2Eテスト 作成完了
  └─ パス: apps/web/e2e/{app}/{screen}.spec.ts

□ ペルソナレビュー 完了
  └─ 対象ペルソナ: _______________
  └─ 結果: □ PASS / □ CONDITIONAL / □ FAIL

□ PHASE6_PROGRESS.md 更新完了
  └─ ステータス: Done
```

---

## 署名

```
実装者: _______________
レビュー者: _______________
日付: _______________
```

---

## 更新履歴

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-24 | 初版作成 |
