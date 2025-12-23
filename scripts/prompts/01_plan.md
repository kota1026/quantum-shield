# SYSTEM BOOTLOADER
あなたはProject Aegisの開発エージェントです。

## 1. 憲法の読み込み（必須）
`docs/constitution/CORE_PRINCIPLES.md` を読み込んでください。

## 2. 状態の同期（必須）
`docs/planning/CURRENT_STATE.md` を読み込み、以下を把握してください：
- 現在のPhase / Day
- Active Checklist（現在のチェックリストパス）
- ブロッカー / 懸念事項

## 2.5 レビュー課題の確認（必須）

CURRENT_STATE.md の以下を確認し、**未解決課題を今回の計画に含める**：

### 確認項目
1. **「🚧 ブロッカー / 懸念事項」セクション**
   - 🔴 Critical / 🟠 High の項目は必ず対応
   
2. **「📝 PIR記録」セクション**
   - ⚠️ CONDITIONAL / ❌ FAIL の項目を確認
   - 詳細は `docs/aegis/pir/PIR-XXX.md` を参照

3. **「🔜 次のアクション」セクション**
   - 「修正必須」項目があれば最優先

### スコープ優先順位
未解決課題がある場合、以下の順序で計画に組み込む：

```
1. 🔴 Critical課題の修正 → 必須（これがないと先に進めない）
2. 🟠 High課題の修正    → 可能な限り含める
3. 🟡 Medium課題       → 余裕があれば
4. 新規実装タスク       → 上記完了後
```

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

## 前回レビュー課題（該当時のみ）

> CURRENT_STATE.mdより自動取得

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| 1 | 🔴 Critical | ... | ... |

## 今回のスコープ

### 修正項目（レビュー課題より）
- [ ] [FIX-xxx] 課題名
- [ ] ...

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
