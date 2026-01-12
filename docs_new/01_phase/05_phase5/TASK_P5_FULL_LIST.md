# TASK-P5 完全タスクリスト

> **Version**: 2.0
> **Date**: 2026-01-12
> **Status**: 計画整合性チェック後更新
> **Based on**: PHASE5_INTEGRATION_PLAN.md v2.2

---

## 概要

PHASE5_INTEGRATION_PLAN.md から抽出した**全タスク**を定義。
旧TASK_P5_SUMMARY.md（12タスク/34%）から**100%カバー**に拡充。

### カバー率比較

| 指標 | 旧（SUMMARY） | 新（FULL_LIST） |
|------|:------------:|:---------------:|
| タスク数 | 12 | 36 |
| 工数カバー | 34% (40日) | 100% (115日) |
| API EP | 32 EP | 85 EP |
| Phase 5.0 | 0/5 | 5/5 |

---

## Phase 5.0: ブロッカー解消 (31日) - **最優先**

> **重要**: Phase 5.1以降は、Phase 5.0完了後に開始すること

| Task ID | 内容 | 工数 | 依存 | 計画参照 | 状態 |
|---------|------|:----:|------|---------|:----:|
| **TASK-P5-001** | STARK Prover Archive移行 | 3日 | - | §2.5.1, §8.0 #1 | [ ] |
| **TASK-P5-002** | stark-prover HTTPサービス化 | 2日 | P5-001 | §8.0 #2 | [ ] |
| **TASK-P5-003** | React WASM初期化実装 | 2日 | - | §2.5.3, §8.0 #3 | [ ] |
| **TASK-P5-004** | React Hooks実Crypto実装 | 3日 | P5-003 | §8.0 #4 | [ ] |
| **TASK-P5-008** | L3 fips204クレート移行 | 3日 | - | §2.5.2, §8.0 #5 | [ ] |
| **TASK-P5-009** | L3 Production Mode完成 | 10日 | P5-008 | §2.5.4, §8.0 #6-8 | [ ] |
| **TASK-P5-014** | Challenge + Slashing実装 | 5日 | - | §2.6.1 | [ ] |

### Phase 5.0 完了条件 (Appendix D.1)

```
[ ] STARK Prover: 実証明生成テスト通過
[ ] STARK Prover: L1 STARKVerifier.solで検証成功
[ ] React SDK: WASM初期化完了
[ ] React SDK: useDilithium() 実署名生成確認
[ ] React SDK: API呼び出しで署名検証成功
[ ] L3 Aegis: fips204ライブラリ移行完了
[ ] L3 Aegis: 4ノードネットワーク起動成功
[ ] L3 Aegis: TLS 1.3 mTLS接続確認
[ ] L3 Aegis: L1 State Root提出成功
```

---

## Phase 5.1: 基盤整備 (10日) - **完了**

| Task ID | 内容 | 工数 | 依存 | 計画参照 | 状態 |
|---------|------|:----:|------|---------|:----:|
| TASK-P5-005 | Chainlink VRF Integration | 3日 | - | §2.6.2 | [x] |
| TASK-P5-006 | Event Bridge (WebSocket/RabbitMQ) | 3日 | - | §2.5.5 | [x] |
| TASK-P5-007 | SPHINCS+ Verification | 2日 | - | §2.5.6 | [x] |
| TASK-P5-010 | EditionConfig.sol | 3日 | - | §3.2.1 | [x] |
| TASK-P5-011 | ProverRegistry.sol | 4日 | P5-010 | §3.2.2 | [x] |
| TASK-P5-012 | SIWE→JWT認証 (API) | 2日 | - | §3.2.3 | [x] |
| TASK-P5-013 | SDK API client認証 | 3日 | P5-012 | §3.2.3 | [x] |

---

## Phase 5.2: コアAPI実装 (12日) - **完了**

| Task ID | 内容 | EP数 | 依存 | 計画参照 | 状態 |
|---------|------|:----:|------|---------|:----:|
| TASK-P5-020 | Consumer App API | 6 EP | P5-012 | §3.3 | [x] |
| TASK-P5-021 | Token Hub API | 9 EP | P5-012 | §3.3 | [x] |
| TASK-P5-022 | Prover Portal API | 9 EP | P5-011 | §3.3 | [x] |
| TASK-P5-023 | Governance API | 8 EP | P5-012 | §3.5 | [x] |

---

## Phase 5.3: 管理系API実装 (15日) - **未着手**

| Task ID | 内容 | EP数 | 依存 | 計画参照 | 状態 |
|---------|------|:----:|------|---------|:----:|
| **TASK-P5-015** | QS Admin API | 11 EP | P5-012 | §3.4, B.2 | [ ] |
| **TASK-P5-016** | Enterprise Admin API | 19 EP | P5-012 | §3.4, B.2 | [ ] |
| **TASK-P5-017** | Enterprise申込フロー | - | P5-016 | §3.4 | [ ] |
| **TASK-P5-018** | 4BFT契約者管理 | - | P5-016 | §3.4 | [ ] |

### QS Admin API エンドポイント (TASK-P5-015)

```
GET  /v1/admin/dashboard
GET  /v1/admin/transactions
GET  /v1/admin/nodes
GET  /v1/admin/staff
POST /v1/admin/staff
GET  /v1/admin/reports
GET  /v1/admin/audit-log
GET  /v1/admin/parameters
POST /v1/admin/parameters/change-request
GET  /v1/admin/enterprise/accounts
POST /v1/admin/enterprise/accounts
```

### Enterprise Admin API エンドポイント (TASK-P5-016)

```
GET  /v1/enterprise/dashboard/overview
GET  /v1/enterprise/dashboard/tvl
GET  /v1/enterprise/dashboard/volume
GET  /v1/enterprise/transactions
GET  /v1/enterprise/transactions/:id
POST /v1/enterprise/transactions/export
GET  /v1/enterprise/users
GET  /v1/enterprise/users/:id
POST /v1/enterprise/users
POST /v1/enterprise/users/invite
POST /v1/enterprise/users/:id/role
GET  /v1/enterprise/api-keys
POST /v1/enterprise/api-keys
GET  /v1/enterprise/api-keys/:id/usage
GET  /v1/enterprise/settings
POST /v1/enterprise/settings
GET  /v1/enterprise/security-settings
GET  /v1/enterprise/reports
GET  /v1/enterprise/audit-log
```

---

## Phase 5.4: 補完機能実装 (32日) - **部分完了**

| Task ID | 内容 | EP数/工数 | 依存 | 計画参照 | 状態 |
|---------|------|:--------:|------|---------|:----:|
| TASK-P5-025 | Prover Portal DESIGN_BRIEF | - | - | - | [x] |
| **TASK-P5-019** | Observer API | 8 EP | P5-012 | B.2 | [ ] |
| **TASK-P5-024** | Explorer API | 12 EP | - | B.2 | [ ] |
| **TASK-P5-026** | i18n対応 | 5日 | - | §3.5 | [ ] |
| **TASK-P5-027** | 監視ボット実装 | 3日 | P5-014 | §2.6.2 | [ ] |
| **TASK-P5-028** | Security Council統合 | 3日 | P5-023 | §2.6.3 | [ ] |
| **TASK-P5-029** | Insurance/Treasury | 3日 | - | §2.6.2 | [ ] |
| **TASK-P5-030** | Resync実装 | 2日 | - | §2.6.1 | [ ] |
| **TASK-P5-031** | Prover Exit実装 | 2日 | P5-011 | §2.6.1 | [ ] |
| **TASK-P5-032** | Emergency Pause実装 | 2日 | P5-028 | §2.6.1 | [ ] |

### Observer API エンドポイント (TASK-P5-019)

```
GET  /v1/observer/dashboard
GET  /v1/observer/pending-unlocks
GET  /v1/observer/suspicious-txs
GET  /v1/observer/history
POST /v1/observer/challenge
GET  /v1/observer/challenge/:id
GET  /v1/observer/earnings
POST /v1/observer/claim-earnings
```

### Explorer API エンドポイント (TASK-P5-024)

```
GET  /v1/explorer/overview
GET  /v1/explorer/search
GET  /v1/explorer/locks
GET  /v1/explorer/locks/:id
GET  /v1/explorer/unlocks
GET  /v1/explorer/unlocks/:id
GET  /v1/explorer/challenges
GET  /v1/explorer/challenges/:id
GET  /v1/explorer/address/:addr
GET  /v1/explorer/provers
GET  /v1/explorer/provers/:id
GET  /v1/explorer/analytics
```

---

## Phase 5.5: 統合・テスト (15日) - **未着手**

| Task ID | 内容 | 工数 | 依存 | 計画参照 | 状態 |
|---------|------|:----:|------|---------|:----:|
| **TASK-P5-033** | UI ↔ API統合 | 5日 | P5-020〜024 | §3.1 | [ ] |
| **TASK-P5-034** | E2Eテスト（実STARK証明） | 5日 | P5-001,002 | D.2 | [ ] |
| **TASK-P5-035** | Edition切替テスト | 3日 | P5-010 | D.2 | [ ] |
| **TASK-P5-036** | 本番デプロイ準備 | 2日 | ALL | §3.1 | [ ] |

---

## 進捗サマリ

### タスク状態

| 状態 | 件数 | Task IDs |
|------|:----:|----------|
| 完了 | 12 | P5-005〜007, 010〜013, 020〜023, 025 |
| 未着手 | 24 | P5-001〜004, 008〜009, 014〜019, 024, 026〜036 |
| **合計** | **36** | |

### Phase別進捗

| Phase | 完了 | 残 | 進捗率 |
|-------|:----:|:--:|:------:|
| 5.0 ブロッカー | 0 | 7 | 0% |
| 5.1 基盤整備 | 7 | 0 | 100% |
| 5.2 コアAPI | 4 | 0 | 100% |
| 5.3 管理系API | 0 | 4 | 0% |
| 5.4 補完機能 | 1 | 9 | 10% |
| 5.5 統合・テスト | 0 | 4 | 0% |

### 工数進捗

```
完了: ~40日 / 115日 (35%)
残り: ~75日 (65%)

優先度別残り:
- P0 (ブロッカー): 31日
- P1 (API/機能): 29日
- P2 (統合/テスト): 15日
```

---

## 依存関係図

```
Phase 5.0 (ブロッカー) ────────────────────────────────────────┐
│                                                              │
├── P5-001 ─→ P5-002 ─→ P5-034 (E2Eテスト)                    │
│                                                              │
├── P5-003 ─→ P5-004 ─→ P5-033 (UI統合)                       │
│                                                              │
├── P5-008 ─→ P5-009 ─→ P5-035 (Edition切替)                  │
│                                                              │
└── P5-014 ─→ P5-027 (監視ボット)                             │
                                                               │
Phase 5.1-5.4 (並列可能) ─────────────────────────────────────┤
│                                                              │
├── P5-011 ─→ P5-022, P5-031                                   │
├── P5-012 ─→ P5-013 ─→ P5-020〜024                            │
├── P5-023 ─→ P5-028 ─→ P5-032                                 │
│                                                              │
Phase 5.5 (最終) ─────────────────────────────────────────────┘
│
└── P5-033〜036: 全Phase完了後
```

---

## チェックリスト（計画整合性）

### 計画書 Appendix B との整合

| 計画書のAPI | EP数 | タスク | 状態 |
|------------|:----:|--------|:----:|
| Auth | 3 | P5-012 | [x] |
| User/Consumer | 6 | P5-020 | [x] |
| Token Hub | 9 | P5-021 | [x] |
| Governance | 8 | P5-023 | [x] |
| Prover Extended | 9 | P5-022 | [x] |
| Observer | 8 | P5-019 | [ ] |
| Explorer | 12 | P5-024 | [ ] |
| Enterprise Admin | 19 | P5-016 | [ ] |
| QS Admin Extended | 11 | P5-015 | [ ] |
| **合計** | **85** | | |

### Core Principles (CP) 対応

| CP | 原則 | タスク | 状態 |
|----|------|--------|:----:|
| CP-1 | 完全量子耐性 | P5-008 (FIPS移行) | [ ] |
| CP-4 | Slashing存在 | P5-014 (Challenge+Slashing) | [ ] |

---

## 次のアクション

### 優先順位

1. **Phase 5.0完了** - 他の全てに先行
   - P5-001〜004: STARK + React WASM
   - P5-008〜009: L3 Production
   - P5-014: Challenge + Slashing

2. **Phase 5.3着手** - 管理系API
   - P5-015: QS Admin API
   - P5-016: Enterprise Admin API

3. **Phase 5.4残り** - 補完機能
   - P5-019: Observer API
   - P5-024: Explorer API

4. **Phase 5.5** - 統合テスト

---

**END OF FULL TASK LIST**
