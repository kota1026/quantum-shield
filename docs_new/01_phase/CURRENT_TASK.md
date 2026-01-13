# Current Task Status

> **Updated**: 2026-01-13
> **Status**: Completed

---

## 完了タスク

| 項目 | 値 |
|------|-----|
| タスクID | TASK-P5-030 |
| タイトル | Resync実装 |
| Phase | 5.4 補完機能 |
| 優先度 | P1 |
| 見積工数 | 2日 |
| 計画参照 | §2.6.1, SEQUENCES §3' |
| **Status** | **✅ COMPLETE** |

### トレーサビリティ

| 仕様項目 | 仕様書参照 | 実装先 |
|----------|----------|--------|
| L1-L3 Resync (自動) | SEQUENCES §3' | `services/api/src/routes/resync.rs` |
| L1-L3 Resync (手動) | SEQUENCES §3' | `services/api/src/routes/resync.rs` |

### 成果物

| # | 成果物 | 説明 |
|---|--------|------|
| 1 | services/api/src/routes/resync.rs | Resync API (3 EP) |
| 2 | services/api/src/routes/mod.rs | Routes registration |

### 完了条件

| # | 条件 | 状態 |
|---|------|:----:|
| 1 | POST /v1/resync API | ✅ |
| 2 | GET /v1/resync/:lock_id API | ✅ |
| 3 | GET /v1/resync/pending API | ✅ |
| 4 | cargo build 成功 | ✅ |
| 5 | cargo test 成功 | ✅ (131 tests) |

### 実装詳細

#### Resync API エンドポイント (3 EP)

```
POST /v1/resync              - 手動Resync Request (lock_id, l1_tx_hash)
GET  /v1/resync/:lock_id     - Resync状態確認
GET  /v1/resync/pending      - 未同期Lock一覧
```

#### Sequence #3' Resync 仕様

**目的**: L3-L1間の同期失敗時の復旧

**トリガー**: Lock後のL1→L3通知失敗

**方式**:
1. 自動復旧 (A): L3が定期的にL1 Event Pollを実行 (1分ごと)
2. 手動復旧 (M): ユーザーがResync Requestを送信

**手動復旧フロー**:
1. M1: User → L3: Resync Request {lock_id, l1_tx_hash}
2. M2: L3 → L1: Tx検証
3. M3: L1 → L3: Lock Data {confirmed, SR_0, ...}
4. M4: L3 → User: Resync完了 {lock_id, status=synced}

---

## 次のタスク候補

- **TASK-P5-031**: Prover Exit実装 (2日)
- **TASK-P5-032**: Emergency Pause実装 (2日)
- TASK-P5-033: UI ↔ API統合

---

**END OF STATUS**
