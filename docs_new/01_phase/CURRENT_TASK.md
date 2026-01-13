# Current Task Status

> **Updated**: 2026-01-12
> **Status**: ✅ Complete

---

## 現在のタスク

| 項目 | 値 |
|------|-----|
| タスクID | TASK-P5-029 |
| タイトル | Insurance/Treasury API実装 |
| Phase | 5.4 補完機能 |
| 優先度 | P1 |
| 見積り工数 | 3日 |
| 計画参照 | §2.6.2 |

### トレーサビリティ

| 仕様項目 | 仕様書参照 | 実装先 |
|----------|----------|--------|
| Treasury管理 | UNIFIED_SPEC §Treasury | `services/api/src/routes/treasury.rs` |
| Insurance Fund | UNIFIED_SPEC §Phase 1-4 手数料配分 | `services/api/src/routes/insurance.rs` |
| 手数料配分 | UNIFIED_SPEC §手数料配分 | `services/api/src/routes/fees.rs` |

### 既存実装（L3コントラクト）

| コントラクト | ファイル | 状態 |
|------------|----------|:----:|
| Treasury.sol | `l3-aegis/src/treasury/Treasury.sol` | ✅ 完成 |
| InsuranceFund.sol | `l3-aegis/src/treasury/InsuranceFund.sol` | ✅ 完成 |
| ITreasury.sol | `l3-aegis/src/interfaces/ITreasury.sol` | ✅ 完成 |

### 実装するAPI (12 EP)

#### Treasury API (6 EP)
```
GET  /v1/treasury/dashboard           - 概要・残高・統計
GET  /v1/treasury/proposals           - 提案一覧
GET  /v1/treasury/proposals/:id       - 提案詳細
POST /v1/treasury/proposals           - 新規提案
POST /v1/treasury/proposals/:id/approve - 提案承認
POST /v1/treasury/proposals/:id/execute - 提案実行
```

#### Insurance Fund API (4 EP)
```
GET  /v1/insurance/dashboard          - 概要・残高・統計
GET  /v1/insurance/claims             - クレーム履歴
POST /v1/insurance/claims             - クレーム申請
GET  /v1/insurance/transactions       - 取引履歴
```

#### Fee Distribution API (2 EP)
```
GET  /v1/fees/distribution            - 現在の配分設定
GET  /v1/fees/stats                   - 手数料統計
```

### 完了条件

| # | 条件 | 状態 |
|---|------|:----:|
| 1 | Treasury API 6 EP実装 | ✅ |
| 2 | Insurance Fund API 4 EP実装 | ✅ |
| 3 | Fee Distribution API 2 EP実装 | ✅ |
| 4 | cargo build成功 | ✅ |
| 5 | cargo test成功 | ✅ |
| 6 | L3コントラクトとの整合性確認 | ✅ |

### WHY

#### 問題
- L3にTreasury/InsuranceFundコントラクトは完成しているが、API層が未実装
- フロントエンドからTreasury管理・手数料配分機能にアクセス不可

#### 決定根拠
- UNIFIED_SPEC §Treasury: マルチシグ管理、提案/承認フロー
- UNIFIED_SPEC §手数料配分:
  - Phase 1: Prover 50%, Treasury 40%, Insurance 10%
  - Phase 2+: Prover 40%, Treasury 30%, Burn 20%, Insurance 10%

---

## 実装済みタスク一覧（Phase 5）

### Phase 5.0 ブロッカー解消（100%完了）

| Task ID | 内容 | 状態 | 完了日 |
|---------|------|:----:|-------|
| TASK-P5-001 | Challenge API + SDK | ✅ | 2026-01-11 |
| TASK-P5-002 | STARK Prover移行 | ✅ | 2026-01-11 |
| TASK-P5-003 | React SDK WASM | ✅ | 2026-01-11 |
| TASK-P5-004 | L3 Production Mode | ✅ | 2026-01-12 |
| TASK-P5-005 | Chainlink VRF v2.5 | ✅ | 2026-01-12 |
| TASK-P5-006 | Event Bridge | ✅ | 2026-01-12 |
| TASK-P5-007 | SPHINCS+署名検証 | ✅ | 2026-01-12 |

### Phase 5.1 基盤整備（100%完了）

| Task ID | 内容 | 状態 | 完了日 |
|---------|------|:----:|-------|
| TASK-P5-010 | EditionConfig.sol | ✅ | 2026-01-12 |
| TASK-P5-011 | ProverRegistry.sol | ✅ | 2026-01-12 |
| TASK-P5-012 | SIWE→JWT認証 | ✅ | 2026-01-12 |
| TASK-P5-013 | SDK API client認証 | ✅ | 2026-01-12 |

### Phase 5.2 コアAPI（100%完了）

| Task ID | 内容 | 状態 | 完了日 |
|---------|------|:----:|-------|
| TASK-P5-020 | Consumer App API (6 EP) | ✅ | 2026-01-12 |
| TASK-P5-021 | Token Hub API (9 EP) | ✅ | 2026-01-12 |
| TASK-P5-022 | Prover Portal API (9 EP) | ✅ | 2026-01-12 |
| TASK-P5-023 | Governance API (8 EP) | ✅ | 2026-01-12 |

### Phase 5.4 補完機能（部分完了）

| Task ID | 内容 | 状態 | 完了日 |
|---------|------|:----:|-------|
| TASK-P5-025 | Prover Portal DESIGN_BRIEF | ✅ | 2026-01-12 |
| **TASK-P5-029** | **Insurance/Treasury API (12 EP)** | **✅ Complete** | 2026-01-12 |

---

## 次のステップ

→ Phase 5.3 管理系API または Phase 5.4 残りの補完機能を実装

---

**END OF STATUS**
