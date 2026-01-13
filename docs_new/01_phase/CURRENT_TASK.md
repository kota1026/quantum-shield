# Current Task Status

> **Updated**: 2026-01-13
> **Status**: Completed

---

## 完了タスク

| 項目 | 値 |
|------|-----|
| タスクID | TASK-P5-031 |
| タイトル | Prover Exit実装 |
| Phase | 5.4 補完機能 |
| 優先度 | P1 |
| 見積工数 | 2日 |
| 計画参照 | §2.6.1, SEQUENCES §6 |
| **Status** | **COMPLETE** |

### トレーサビリティ

| 仕様項目 | 仕様書参照 | 実装先 |
|----------|----------|--------|
| Prover Exit | SEQUENCES §6 | `services/api/src/routes/prover.rs` |
| Exit Status | SEQUENCES §6 | `services/api/src/routes/prover.rs` |
| Stake Withdraw | SEQUENCES §6 | `services/api/src/routes/prover.rs` |

### 成果物

| # | 成果物 | 説明 |
|---|--------|------|
| 1 | services/api/src/routes/prover.rs | Prover Exit API (3 EP追加) |
| 2 | services/api/src/routes/mod.rs | Routes registration |
| 3 | services/api/src/services/mod.rs | Exit status/withdraw methods |
| 4 | services/api/src/types.rs | Exit types定義 |
| 5 | services/api/src/services/redis_client.rs | del() method追加 |

### 完了条件

| # | 条件 | 状態 |
|---|------|:----:|
| 1 | POST /v1/prover/:id/exit API | (existing) |
| 2 | GET /v1/prover/:id/exit-status API | NEW |
| 3 | POST /v1/prover/:id/withdraw API | NEW |
| 4 | cargo build 成功 | PASS |
| 5 | cargo test 成功 | PASS |

### 実装詳細

#### Prover Exit API エンドポイント (SEQUENCES §6)

```
POST /v1/prover/:id/exit          - 退出申請 (7日間unbonding)
GET  /v1/prover/:id/exit-status   - 退出状態確認 (unbonding残時間等)
POST /v1/prover/:id/withdraw      - Stake引出 (unbonding完了後)
```

#### Sequence #6 Prover Exit 仕様

**目的**: Proverがシステムから安全に退出するための機能

**7日間Unbonding期間**:
- 退出申請後、7日間のunbonding期間が必要
- unbonding中もSlash対象
- VRF選出対象外となる

**退出フロー**:
1. Prover → L1 Staking: 退出申請 (prover_id)
2. L1 Staking → L3 Aegis: 退出通知 (prover_id, exit_time)
3. L3 Aegis: Prover Pool除外、VRF選出対象外
4. L1 Staking → Prover: 退出受理 (unbonding_end)
5. 7日間Unbonding期間
6. Prover → L1 Staking: Stake引出 (prover_id)
7. L1 Staking → Prover: ETH/QS返還 (stake_amount)

**制約**:
- 未解決Challengeがある場合は退出不可
- unbonding完了前はwithdraw不可
- unbonding中に新規Challengeがあった場合はwithdraw保留

---

## 次のタスク候補

- **TASK-P5-032**: Emergency Pause実装 (2日)
- TASK-P5-033: UI ↔ API統合
- TASK-P5-034: E2Eテスト（実STARK証明）

---

**END OF STATUS**
