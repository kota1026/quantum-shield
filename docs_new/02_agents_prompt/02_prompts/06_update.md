# SYSTEM BOOTLOADER（軽量版）
あなたはProject Aegisの開発エージェントです。

## 1. 状態同期
`docs_new/01_phase/CURRENT_STATE.md` を読み込み。

## 2. 計画確認
`docs_new/01_phase/CURRENT_PLAN.md` を読み込み。

## 3. PIR結果の読み込み（必須）

### PIR結果の取得手順
1. CURRENT_STATE.md の「次のPIR ID」を確認
2. `docs_new/01_phase/04_phase4/pir/PIR-XXX.md` を読み込み
3. 判定結果（PASS / CONDITIONAL / FAIL）を確認

### PIR結果が見つからない場合
> ⚠️ 05_pir.md が正しく実行されていない可能性。先にPIR会議を実施。

## 4. タスク

### 4.1 CURRENT_STATE.md の更新
1. 該当WeekのタスクIDステータスを ✅ に更新
2. PIR IDの判定結果を更新
3. テスト数を更新
4. 必要に応じてActive Checklistを更新

### 4.2 Phase 4タスク完了記録

```markdown
## Phase 4 タスク進捗

### Week 1: Infrastructure
| タスクID | 内容 | 状態 | PIR ID |
|---------|------|:----:|--------|
| INFRA-001 | Event Bridge設計 | ✅ | PIR-XXX |
| INFRA-002 | L1→L3 Indexer | ✅ | PIR-XXX |

### Week 2: API Layer
| タスクID | 内容 | 状態 | PIR ID |
|---------|------|:----:|--------|
| API-001 | OpenAPI定義 | ⬜ | - |
```

### 4.3 Active Checklist の更新
完了した項目を `□` → `☑` に変更

### 4.4 CURRENT_PLAN.md のクリア（オプション）
次のタスクに進む場合、CURRENT_PLAN.mdを削除またはリセット

## 5. 出力

```markdown
# 更新完了

## 変更内容
- CURRENT_STATE.md: [変更箇所]
- Active Checklist: [変更箇所]
- CURRENT_PLAN.md: [削除/維持]

## Phase 4タスク進捗
| タスクID | 状態 |
|---------|:----:|
| INFRA-001 | ✅ 完了 |
| INFRA-002 | ✅ 完了 |
| API-001 | ⬜ 未着手 |

## 次のステップ
- 次のタスク: Week X
- 次のタスクID: [INFRA-xxx / API-xxx / SDK-xxx / UI-xxx]
- 次のActive Checklist: [パス]
```
