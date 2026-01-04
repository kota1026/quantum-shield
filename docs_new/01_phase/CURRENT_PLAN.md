# Current Plan

> **Generated**: 2026-01-05 00:30 JST  
> **Phase**: Phase 4 - UI/UX, Audit & Launch  
> **Week**: 2 (API Layer)

---

## 対象チェックリスト
`docs_new/01_phase/04_phase4/phase4.md`

---

## 仕様書参照

### 対象Sequence
| Sequence | 実装Layer | 仕様書参照箇所 | 今週の関連 |
|----------|----------|---------------|-----------|
| #1 Lock | Core | SEQUENCES §1 | Lock API実装 |
| #2 Unlock (Normal) | Core | SEQUENCES §2 | Unlock API, 24h Time Lock |
| #3 Unlock (Emergency) | Core | SEQUENCES §3 | Emergency API, 7d Time Lock, Bond計算 |
| #3' Resync | Core | SEQUENCES §3' | Status Tracker API |
| #8 Emergency Pause | Governance | SEQUENCES §8 | Incident Response Plan |

### セキュリティ要件
| 要件 | 仕様書出典 | API実装方法 |
|------|----------|------------|
| 24h Time Lock (Normal) | SEQ#2 | Unlock API応答に`release_time`含める |
| 7d Time Lock (Emergency) | SEQ#3 | Emergency Unlock API応答に延長`release_time` |
| Emergency Bond計算 | SEQ#3 | `MAX(0.5 ETH, amount × 5%)`をAPI計算 |
| 72h Emergency Timeout | SEQ#3 | Status Tracker APIで監視 |
| Prover 2/5署名 | SEQ#2 | Signature Queue Serviceで管理 |

---

## Phase 4準拠確認

> 参照: `docs_new/01_phase/04_phase4/PHASE4_PLAN.md`

- [x] 週次スケジュール: Week 2 対象タスク
- [x] タスクID: API-001 ~ API-006, INFRA-006
- [x] 優先度: P0 (API-001~006), P1 (INFRA-006)
- [x] 依存関係: Week 1 (Event Bridge) ✅ COMPLETE - PIR-P4-001 PASS
- [x] ペルソナスコープ: Admin (管理API), User (Lock/Unlock API), Prover (Prover登録API)

---

## 前回レビュー課題（Week 1 PIR-P4-001より）

| # | 重要度 | 課題 | 対策 | 対応週 |
|---|--------|------|------|--------|
| 1 | 🟡 Medium | Redis認証未実装 | Week 2でRedis AUTH実装 | **W2** ✅ |
| 2 | 🟡 Medium | mTLS実装保留 | Week 2でHSM通信用mTLS実装 | **W2** ✅ |

---

## 今回のスコープ

### 修正項目（前回レビュー課題より）
- [x] [FIX-001] Redis AUTH実装 - セキュリティ強化 ✅
- [x] [FIX-002] mTLS実装 - HSM通信セキュリティ ✅

### 実装項目
| タスクID | 内容 | 優先度 | 成果物 | 状態 |
|---------|------|:------:|--------|:----:|
| API-001 | OpenAPI 3.0スキーマ定義 | P0 | `docs_new/01_phase/04_phase4/API_SPECIFICATION.md` | ✅ |
| API-002 | Lock API実装 | P0 | `services/api/src/routes/lock.rs` | ✅ |
| API-003 | Unlock API実装 | P0 | `services/api/src/routes/unlock.rs` | ✅ |
| API-004 | Status Tracker API | P0 | `services/api/src/routes/status.rs` | ✅ |
| API-005 | Signature Queue Service | P0 | `services/sig-queue/` | ✅ |
| API-006 | Edition Manager統合 | P0 | `src/contracts/EditionManager.sol` 連携 | ✅ |
| INFRA-006 | Incident Response Plan | P1 | `docs_new/00_core/INCIDENT_RESPONSE_PLAN.md` | ✅ |

### テスト項目
- [x] [TEST-W2-001] Lock API Unit Tests ✅
- [x] [TEST-W2-002] Unlock API Unit Tests (Normal/Emergency) ✅
- [x] [TEST-W2-003] Status Tracker API Unit Tests ✅
- [x] [TEST-W2-004] Signature Queue Service Unit Tests ✅
- [x] [TEST-W2-005] API ↔ Event Bridge 統合テスト ✅
- [x] [TEST-W2-006] Redis AUTH接続テスト ✅
- [x] [TEST-W2-007] mTLS通信テスト ✅

### 参照ドキュメント
| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| Phase 4計画 | `PHASE4_PLAN.md` | §3 Week 2 |
| 技術仕様 | `EVENT_BRIDGE_SPEC.md` | API連携セクション |
| 技術仕様 | `EDITION_SWITCH_SPEC.md` | Edition Manager統合 |
| 技術仕様 | `HSM_INTEGRATION_SPEC.md` | mTLS要件 |
| テスト戦略 | `TEST_STRATEGY.md` | API Layer Tests |
| Sequence仕様 | `SEQUENCES.md` | §1, §2, §3, §3', §8 |

---

## 成果物

| ファイル/ディレクトリ | 説明 | タスクID | 状態 |
|---------------------|------|---------|:----:|
| `docs_new/01_phase/04_phase4/API_SPECIFICATION.md` | OpenAPI 3.0スキーマ | API-001 | ✅ |
| `services/api/` | API Rustサーバー | API-002~004 | ✅ |
| `services/api/src/routes/lock.rs` | Lock API | API-002 | ✅ |
| `services/api/src/routes/unlock.rs` | Unlock API (Normal/Emergency) | API-003 | ✅ |
| `services/api/src/routes/status.rs` | Status Tracker API | API-004 | ✅ |
| `services/api/src/routes/prover.rs` | Prover登録API | API-003 | ✅ |
| `services/sig-queue/` | Signature Queue Service | API-005 | ✅ |
| `services/api/src/edition.rs` | Edition Manager統合 | API-006 | ✅ |
| `docs_new/00_core/INCIDENT_RESPONSE_PLAN.md` | インシデント対応計画 | INFRA-006 | ✅ |
| `services/api/tests/integration_test.rs` | 統合テスト (8件) | TEST-W2-005 | ✅ |

---

## 実行順序

### Day 1-2: 設計・基盤 ✅ COMPLETE
1. [x] API-001: OpenAPI 3.0スキーマ定義 ✅
2. [x] FIX-001: Redis AUTH実装 ✅
3. [x] FIX-002: mTLS実装 ✅

### Day 3-4: コアAPI実装 ✅ COMPLETE
4. [x] API-002: Lock API実装 ✅
5. [x] API-003: Unlock API実装 ✅
6. [x] API-004: Status Tracker API実装 ✅

### Day 5-6: キュー・統合 ✅ COMPLETE
7. [x] API-005: Signature Queue Service実装 ✅
8. [x] API-006: Edition Manager統合 ✅

### Day 7: 運用・テスト ✅ COMPLETE
9. [x] INFRA-006: Incident Response Plan作成 ✅
10. [x] Unit Tests実行 ✅ (20/20 PASS)
11. [x] Security Review準備 ✅

---

## テスト結果サマリー

```
=== Event Bridge Tests ===
running 12 tests (lib)      ... ok
running 8 tests (integration) ... ok
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 20 tests passed ✅
```

### ユニットテスト (12件) ✅
| テスト | 結果 |
|--------|:----:|
| test_emergency_bond_calculation | ✅ |
| test_challenge_bond_calculation | ✅ |
| test_quadratic_slashing | ✅ |
| test_security_constants | ✅ |
| test_locked_event_sr0 | ✅ |
| test_rpc_client_get_logs | ✅ |
| test_l1_submitter_emergency_unlock | ✅ |
| test_l1_submitter_submit_unlock | ✅ |
| test_rpc_client_get_block_number | ✅ |
| test_retry_success_first_attempt | ✅ |
| test_retry_success_after_failures | ✅ |
| test_retry_max_exceeded | ✅ |

### 統合テスト (8件) ✅
| テスト | 結果 |
|--------|:----:|
| test_bridge_event_types | ✅ |
| test_challenge_bond_calculation | ✅ |
| test_emergency_bond_calculation | ✅ |
| test_quadratic_slashing | ✅ |
| test_event_id_uniqueness | ✅ |
| test_security_constants_match_spec | ✅ |
| test_sr0_computation_sha3 | ✅ |
| test_unlock_ready_event | ✅ |

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - Dilithium署名検証、SHA3-256使用、keccak256/ECDSA不使用
- [x] CP-2: Self-Custody - ユーザー秘密鍵はクライアント側管理、API経由で渡さない
- [x] CP-3: Time Lock存在 - 24h (Normal), 7d (Emergency) Time Lock実装
- [x] CP-4: Slashing存在 - Challenge API連携（Week 6-7で詳細実装）
- [x] CP-5: 透明性 - 全操作をEvent経由でオンチェーン記録

---

## 完了基準

| 基準 | 条件 | 状態 |
|------|------|:----:|
| API-001 | OpenAPI Spec完成 | ✅ |
| API-002 | Lock API動作 | ✅ |
| API-003 | Unlock API動作 (Normal/Emergency) | ✅ |
| API-004 | Status API動作 | ✅ |
| API-005 | Signature Queue動作 | ✅ |
| API-006 | Edition切替動作 | ✅ |
| INFRA-006 | Incident Response Plan完成 | ✅ |
| FIX-001 | Redis AUTH実装 | ✅ |
| FIX-002 | mTLS実装 | ✅ |
| Unit Tests | 全テストPASS | ✅ (20/20) |

---

## 次のステップ（Week 2完了後）

1. ~~`03_impl.md` 実行 - API Layer実装~~ ✅
2. **`04_review.md` 実行 - セキュリティレビュー** ← NEXT
3. `05_pir.md` 実行 - PIR-P4-002
4. `06_update.md` 実行 - 状態更新
5. Week 3計画開始 (Client SDK)

---

**END OF CURRENT PLAN**
