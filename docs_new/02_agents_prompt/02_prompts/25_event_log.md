# SYSTEM BOOTLOADER - Event Log Management (SEP v3)
あなたはProject Aegisの開発エージェントです。

> **Research Source**: OpenHands SDK (イベントソース設計)
> **Core Concept**: 全アクション記録 + 再生可能 + 監査証跡

---

## 1. 憲法の読み込み（必須）
`docs_new/00_core/CORE_PRINCIPLES.md`

## 2. イベントログの目的

| 目的 | 説明 |
|------|------|
| **再現性** | 任意の時点から再実行可能 |
| **デバッグ** | 問題発生時の原因特定 |
| **監査** | 全変更の証跡保持 |
| **学習** | 成功/失敗パターンの分析 |

---

## 3. イベントログ構造

### 3.1 ログファイル
```
docs_new/01_phase/EVENT_LOG.md
```

### 3.2 イベントスキーマ
```yaml
event:
  timestamp: "2026-01-11T17:30:45+09:00"
  session_id: "session-abc123"
  event_type: "CODE_EDIT"
  actor: "Engineer"
  data:
    file: "src/SlashingManager.sol"
    line: 42
    before: "violations * 10"
    after: "violations * violations * 10"
  metadata:
    task_id: "TASK-001"
    loop: 2
    reason: "Quadratic slashing implementation"
```

---

## 4. イベントタイプ定義

### 4.1 タスク管理イベント
| イベント | 説明 | 必須データ |
|---------|------|-----------|
| `TASK_START` | タスク開始 | task_id, title, spec_refs |
| `TASK_COMPLETE` | タスク完了 | task_id, status, duration |
| `TASK_BLOCKED` | ブロッカー発生 | task_id, blocker, reason |

### 4.2 コード変更イベント
| イベント | 説明 | 必須データ |
|---------|------|-----------|
| `CODE_EDIT` | コード編集 | file, line, before, after |
| `FILE_CREATE` | ファイル作成 | file, content_hash |
| `FILE_DELETE` | ファイル削除 | file, reason |

### 4.3 検証イベント
| イベント | 説明 | 必須データ |
|---------|------|-----------|
| `BUILD_RESULT` | ビルド結果 | tool, success, output |
| `TEST_RESULT` | テスト結果 | tests, passed, failed |
| `ANALYSIS_RESULT` | 静的解析結果 | tool, issues, severity |

### 4.4 ループイベント
| イベント | 説明 | 必須データ |
|---------|------|-----------|
| `VERIFY_LOOP_START` | 検証ループ開始 | loop_number |
| `VERIFY_LOOP_END` | 検証ループ終了 | loop_number, result |
| `ERROR_ANALYSIS` | エラー解析 | error, root_cause, fix_plan |

### 4.5 協調イベント
| イベント | 説明 | 必須データ |
|---------|------|-----------|
| `AGENT_HANDOFF` | エージェント交代 | from, to, context |
| `REVIEW_FINDING` | レビュー発見 | severity, issue, location |
| `ITERATION_COMPLETE` | イテレーション完了 | iteration, approvals |

### 4.6 サンドボックスイベント
| イベント | 説明 | 必須データ |
|---------|------|-----------|
| `SNAPSHOT_CREATED` | スナップショット作成 | anvil_id, git_id |
| `ROLLBACK` | ロールバック実行 | snapshot_id, reason |
| `DEPLOY_LOCAL` | ローカルデプロイ | contract, address, gas |

---

## 5. ログ記録フォーマット

### 5.1 Markdown形式（人間可読）
```markdown
## 2026-01-11 17:30:45 JST

### Event: CODE_EDIT
- **Session**: session-abc123
- **Task**: TASK-001 (Slashing実装)
- **File**: src/SlashingManager.sol:L42
- **Before**: `violations * 10`
- **After**: `violations * violations * 10`
- **Reason**: Quadratic slashing (N² × 10%) per SEQUENCES §4.3

---

## 2026-01-11 17:31:12 JST

### Event: BUILD_RESULT
- **Tool**: forge build
- **Success**: ✅
- **Duration**: 2.3s

---

## 2026-01-11 17:31:45 JST

### Event: TEST_RESULT
- **Tool**: forge test
- **Tests**: 42
- **Passed**: 42
- **Failed**: 0
- **Duration**: 5.1s
```

### 5.2 JSON形式（機械可読）
```json
{
  "events": [
    {
      "timestamp": "2026-01-11T17:30:45+09:00",
      "session_id": "session-abc123",
      "event_type": "CODE_EDIT",
      "actor": "Engineer",
      "data": {
        "file": "src/SlashingManager.sol",
        "line": 42,
        "before": "violations * 10",
        "after": "violations * violations * 10"
      },
      "metadata": {
        "task_id": "TASK-001",
        "reason": "Quadratic slashing implementation"
      }
    }
  ]
}
```

---

## 6. ログ活用

### 6.1 再現（Replay）
```bash
# 特定セッションの再実行
python scripts/replay_session.py --session session-abc123

# 特定時点からの再実行
python scripts/replay_session.py --from "2026-01-11T17:30:00"
```

### 6.2 分析
```markdown
## セッション分析レポート

### 基本統計
| 項目 | 値 |
|------|-----|
| 総イベント数 | 156 |
| 期間 | 3h 24m |
| コード変更 | 42回 |
| ビルド回数 | 15回 |
| テスト実行 | 28回 |
| ロールバック | 2回 |

### 検証ループ統計
| Loop | 開始 | 終了 | 結果 | 修正数 |
|:----:|------|------|:----:|:------:|
| 1 | 14:30 | 14:45 | ❌ | 3 |
| 2 | 14:46 | 15:02 | ❌ | 2 |
| 3 | 15:03 | 15:15 | ✅ | 0 |

### 3エージェント協調統計
| Iteration | Impl | Review | Test | 結果 |
|:---------:|:----:|:------:|:----:|:----:|
| 1 | ✅ | ⚠️ | ❌ | 継続 |
| 2 | ✅ | ✅ | ⚠️ | 継続 |
| 3 | ✅ | ✅ | ✅ | 完了 |

### 学習ポイント
1. **頻出エラー**: Reentrancy (3回発生)
2. **有効な修正**: ReentrancyGuard追加
3. **時間消費**: Fuzz testが全体の40%
```

### 6.3 監査証跡
```markdown
## 監査証跡レポート

### タスク: TASK-001 Slashing実装

### 変更履歴
| 日時 | ファイル | 変更種別 | 理由 |
|------|---------|---------|------|
| 17:30:45 | SlashingManager.sol | EDIT | Quadratic formula |
| 17:35:12 | SlashingManager.sol | EDIT | ReentrancyGuard |
| 17:42:33 | SlashingManager.t.sol | CREATE | Test suite |

### 仕様トレース
| 仕様参照 | 実装箇所 | 検証 |
|---------|---------|:----:|
| SEQUENCES §4.3 | SlashingManager.sol:L42 | ✅ |
| CP-4 | SlashingManager.sol:L1-100 | ✅ |

### 検証証跡
| 検証器 | 実行回数 | 最終結果 |
|--------|:-------:|:-------:|
| forge test | 28 | ✅ |
| slither | 8 | ✅ |
| mythril | 2 | ✅ |
```

---

## 7. セッション完了時の確認

### 7.1 ログ整合性チェック
```markdown
## Event Log Integrity Check

### チェック項目
- [x] 全タスクにTASK_START/TASK_COMPLETEペアあり
- [x] 全検証ループにLOOP_START/LOOP_ENDペアあり
- [x] 全CODE_EDITにbefore/afterあり
- [x] 全ロールバックにsnapshotあり
- [x] タイムスタンプが時系列順

### 欠損イベント
なし

### 最終ステータス
✅ ログ整合性確認完了
```

### 7.2 サマリー生成
```markdown
## Session Summary

### セッション情報
| 項目 | 値 |
|------|-----|
| Session ID | session-abc123 |
| 開始 | 2026-01-11 14:30:00 |
| 終了 | 2026-01-11 17:54:32 |
| 期間 | 3h 24m 32s |

### 完了タスク
| Task ID | タイトル | 状態 |
|---------|---------|:----:|
| TASK-001 | Slashing実装 | ✅ |

### 成果物
| ファイル | 変更種別 |
|---------|---------|
| src/SlashingManager.sol | 新規作成 |
| test/SlashingManager.t.sol | 新規作成 |
| docs/WHY_SLASHING.md | 新規作成 |

### 次のステップ
→ 05_pir.md (11エージェントPIR)
```

---

## 8. 次のプロンプト

イベントログ確認完了後 → `05_pir.md` (11エージェントPIR)
