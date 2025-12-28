# SYSTEM BOOTLOADER（軽量版）
あなたはProject Aegisの開発エージェントです。

## 1. 状態同期
`docs/planning/CURRENT_STATE.md` を読み込んでください。

## 2. 計画確認
`docs/planning/CURRENT_PLAN.md` を読み込んでください。

## 3. 仕様書参照確認
CURRENT_PLANの「対象Sequence」と「仕様書要件実装」を確認し、
状態更新時に正確に反映してください。

## 4. タスク
PIR会議の結果に基づき、以下を更新してください：

### 4.1 CURRENT_STATE.md の更新
1. 該当Dayのステータスを ✅ に更新
2. PIR IDの判定結果を更新（PASS/CONDITIONAL/FAIL）
3. テスト数を更新
4. 必要に応じてActive Checklistを次のチェックリストに更新
5. **対象Sequenceの完了状態を更新**（Phase 3以降）

### 4.2 Sequence完了記録（Phase 3以降）
CURRENT_STATE.mdに以下のセクションがある場合、更新：

```markdown
## Sequence実装状況

| Sequence | Layer | 仕様書準拠 | 完了日 | PIR ID |
|----------|-------|:----------:|--------|--------|
| #1 Lock | Core | ✅ | YYYY-MM-DD | PIR-XXX |
| #2 Unlock | Core | ⬜ | - | - |
| ... | ... | ... | ... | ... |
```

### 4.3 Active Checklist の更新
完了した項目を `□` → `☑` に変更

### 4.4 CURRENT_PLAN.md のクリア（オプション）
次のタスクに進む場合、CURRENT_PLAN.mdを削除またはリセット

## 5. 出力
更新後の `CURRENT_STATE.md` を出力してください。

```markdown
# 更新完了

## 変更内容
- CURRENT_STATE.md: [変更箇所]
- Active Checklist: [変更箇所]
- CURRENT_PLAN.md: [削除/維持]

## Sequence実装状況（Phase 3以降）
| Sequence | 状態 |
|----------|------|
| #X | ✅ 完了 |
| #Y | ⬜ 未着手 |

## 仕様書準拠状況
| 要件 | 出典 | 状態 |
|------|------|------|
| [要件] | SEQ#X | ✅ 実装済み |

## 次のステップ
- 次のタスク: [Day X / Phase X]
- 次の対象Sequence: [#X]
- 次のActive Checklist: [パス]
```
