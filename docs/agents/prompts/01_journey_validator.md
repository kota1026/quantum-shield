# Journey Validator Agent

> **目的**: 画面実装時にユーザージャーニーの完全性を検証
> **更新日**: 2026-01-24
> **関連**: [00_master_checklist.md](./00_master_checklist.md)

---

## Agent概要

このAgentは、画面設計・実装時に以下を自動検証します：

1. 全ての画面に「入り口」と「出口」が定義されているか
2. 「戻る」ボタンの遷移先が明確か
3. アクション完了後の遷移が定義されているか
4. デッドエンド（行き止まり画面）がないか

---

## 検証ルール

### Rule 1: 入り口の存在

```
全ての画面は、少なくとも1つの入り口を持つこと。

チェック項目:
□ どの画面からこの画面に来れるか定義されているか
□ その遷移のトリガー（ボタン、リンク、リダイレクト）が明確か
□ URL直接アクセス時の挙動が定義されているか

例外:
- Landing ページ（URL直接アクセスのみ）
- 404ページ
```

### Rule 2: 出口の存在

```
全ての画面は、少なくとも1つの出口を持つこと。

チェック項目:
□ この画面からどこに遷移できるか定義されているか
□ 各出口のトリガーが明確か
□ 「戻る」ボタンが存在するか（または不要な理由があるか）

例外:
- 成功完了ページ（ダッシュボードへのリンクのみでOK）
```

### Rule 3: 戻るボタンの一貫性

```
「戻る」ボタンの遷移先ルール:

1. フォームステップ画面 → 前のステップ
2. 詳細画面 → 一覧画面
3. 確認画面 → 入力画面
4. 完了画面 → ダッシュボード（または一覧）

禁止:
- 「戻る」でブラウザ履歴を使用（router.back()は状況による）
- 遷移先が状況によって変わる「戻る」ボタン（明示的に説明があれば可）
```

### Rule 4: アクション完了後の遷移

```
全てのアクションボタンに以下を定義すること:

成功時:
□ 遷移先
□ フィードバック（トースト、モーダル）
□ 遷移タイミング（即時、確認後）

失敗時:
□ エラー表示
□ 復帰方法
□ 同じ画面に留まるか、別画面に遷移するか

キャンセル時:
□ 確認の有無
□ データ保持の有無
□ 遷移先
```

### Rule 5: デッドエンド検出

```
以下の状況はデッドエンドとみなす:

1. ユーザーが次に何をすればいいか分からない画面
2. 「戻る」も「進む」もない画面
3. エラー後に復帰手段がない画面
4. ローディングが終わらない画面

対策:
- 必ずCTAボタンまたはナビゲーションリンクを配置
- エラー画面にはリトライと戻るを配置
- タイムアウト時のフォールバック画面を用意
```

---

## 検証手順

### Step 1: 画面マップの作成

```
1. 対象アプリの全画面をリストアップ
2. 各画面間の遷移を矢印で図示
3. 遷移のトリガーをラベル付け
```

### Step 2: 入り口チェック

```
各画面について:
- [ ] 入り口が1つ以上存在
- [ ] 全入り口のトリガーが明確
- [ ] URL直接アクセス時の挙動が定義済み
```

### Step 3: 出口チェック

```
各画面について:
- [ ] 出口が1つ以上存在
- [ ] 全出口のトリガーが明確
- [ ] 「戻る」の遷移先が明確
```

### Step 4: アクションチェック

```
各ボタン/リンクについて:
- [ ] 成功時の遷移が定義済み
- [ ] 失敗時の挙動が定義済み
- [ ] ローディング状態が定義済み
```

### Step 5: デッドエンド検出

```
以下を確認:
- [ ] 完了画面からダッシュボードに戻れる
- [ ] エラー画面からリトライまたは戻れる
- [ ] 全画面に最低1つのナビゲーション手段がある
```

---

## 検証レポートテンプレート

```markdown
# Journey Validation Report

## 基本情報
- 対象アプリ: _______________
- 検証日: _______________
- 検証者: _______________

## サマリー

| 項目 | OK | NG | 要確認 |
|------|:--:|:--:|:------:|
| 入り口 | | | |
| 出口 | | | |
| 戻るボタン | | | |
| アクション完了 | | | |
| デッドエンド | | | |

## 詳細

### 問題点

| # | 画面 | 問題 | 重要度 | 修正案 |
|---|------|------|:------:|--------|
| 1 | | | | |

### 推奨事項

| # | 画面 | 推奨事項 | 優先度 |
|---|------|---------|:------:|
| 1 | | | |

## 結論

- [ ] PASS: 全てのルールを満たしている
- [ ] CONDITIONAL: 軽微な問題があるが許容範囲
- [ ] FAIL: 重大な問題があり、修正が必要
```

---

## 自動検証スクリプト

```typescript
// scripts/validate-journey.ts

import { readFileSync } from 'fs';
import { parse } from 'yaml';

interface Screen {
  name: string;
  path: string;
  entries: Entry[];
  exits: Exit[];
  backButton?: string;
}

interface Entry {
  from: string;
  trigger: string;
}

interface Exit {
  to: string;
  trigger: string;
}

interface ValidationResult {
  screen: string;
  errors: string[];
  warnings: string[];
}

function validateJourney(screens: Screen[]): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const screen of screens) {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Rule 1: 入り口の存在
    if (screen.entries.length === 0 && screen.name !== 'Landing') {
      errors.push('No entry points defined');
    }

    // Rule 2: 出口の存在
    if (screen.exits.length === 0) {
      errors.push('No exit points defined');
    }

    // Rule 3: 戻るボタン
    if (!screen.backButton && !['Landing', 'Dashboard', 'Complete'].includes(screen.name)) {
      warnings.push('Back button destination not defined');
    }

    // Rule 4: アクション完了
    for (const exit of screen.exits) {
      if (!exit.trigger) {
        errors.push(`Exit to ${exit.to} has no trigger defined`);
      }
    }

    if (errors.length > 0 || warnings.length > 0) {
      results.push({ screen: screen.name, errors, warnings });
    }
  }

  return results;
}

// 実行
const config = parse(readFileSync('journey-config.yaml', 'utf8'));
const results = validateJourney(config.screens);

if (results.some(r => r.errors.length > 0)) {
  console.error('Journey validation failed');
  process.exit(1);
}
```

---

## 更新履歴

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-24 | 初版作成 |
