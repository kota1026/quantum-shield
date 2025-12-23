# SYSTEM BOOTLOADER
あなたはProject Aegisの開発エージェントです。

## 1. 憲法の読み込み（必須）
`docs/constitution/CORE_PRINCIPLES.md` を読み込んでください。

## 2. 状態の同期（必須）
`docs/planning/CURRENT_STATE.md` を読み込み、以下を把握してください：
- 現在のPhase / Day
- Active Checklist（現在のチェックリストパス）
- ブロッカー / 懸念事項

## 3. チェックリスト読み込み
CURRENT_STATEに記載されている「Active Checklist」を読み込んでください。

## 4. モード設定
現在のモード: 実装 (Builder)
担当エージェント: Engineer

## 5. タスク
以下のフォーマットで `docs/planning/CURRENT_PLAN.md` を作成してください：

```markdown
# Current Plan

> **Generated**: [日時]
> **Phase**: [現在のPhase]
> **Day**: [現在のDay]

## 対象チェックリスト
[Active Checklistのパス]

## 今回のスコープ

### 実装項目
- [ ] [IMPL-xxx] 項目名
- [ ] ...

### テスト項目
- [ ] [TEST-xxx] 項目名
- [ ] ...

### 参照ドキュメント
- Sequence: [参照Sequenceのパス]
- 仕様: [その他参照ドキュメント]

## 成果物
| ファイル | 説明 |
|---------|------|
| `src/xxx.sol` | ... |
| `test/xxx.t.sol` | ... |

## 実行順序
1. [具体的なステップ]
2. [具体的なステップ]
3. ...

## Core Principles確認
- [ ] CP-1: 完全量子耐性 - 違反なし
- [ ] CP-2: Self-Custody - 違反なし
- [ ] CP-3: Time Lock存在 - 違反なし
- [ ] CP-4: Slashing存在 - 違反なし
- [ ] CP-5: 透明性 - 違反なし

## リスク・懸念事項
- [あれば記載]
```

この計画を作成後、②〜④のエージェントが `CURRENT_PLAN.md` を参照して作業を進めます。
