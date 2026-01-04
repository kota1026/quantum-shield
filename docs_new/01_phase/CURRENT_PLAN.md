# Current Plan

> **Generated**: 2026-01-04 19:30 JST
> **Phase**: Phase 4 - UI/UX, Audit & Launch
> **Week**: W1 / 8 (Infrastructure - Event Bridge)
> **Created By**: PM Agent

---

## 対象チェックリスト

`docs_new/01_phase/04_phase4/phase4.md`

---

## 仕様書参照

### 対象Sequence

| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| #1 Lock | Core (Event Bridge) | SEQUENCES.md §1 - L1→L3同期 |
| #2 Unlock (Normal) | Core (Event Bridge) | SEQUENCES.md §2 - 24h Time Lock |
| #3 Unlock (Emergency) | Core (Event Bridge) | SEQUENCES.md §3 - 7d Time Lock |
| #3' Resync | Core (Event Bridge) | SEQUENCES.md §3' - 同期失敗復旧 |

### セキュリティ要件

| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| 12ブロック確認（reorg対策） | AGENT_MEETING §3.3 CSO | Indexerで12 confirmation待機 |
| Event偽造対策 | AGENT_MEETING §3.8 Red Team | L1イベント署名検証 |
| DoS対策 | AGENT_MEETING §3.8 Red Team | レート制限実装 |
| 冪等性保証 | AGENT_MEETING §3.3 CSO | Event ID重複チェック |
| mTLS通信 | AGENT_MEETING §3.3 CSO | HSM↔Relayer間暗号化 |

---

## Phase 4準拠確認

> 参照: `docs_new/01_phase/04_phase4/PHASE4_PLAN.md`

- [x] 週次スケジュール: Week 1 対象タスク
- [x] タスクID: INFRA-001, INFRA-002, INFRA-003, INFRA-004, INFRA-005, PROMPT-001
- [x] 優先度: P0 (Critical Path)
- [x] 依存関係: Phase 3完了 ✅
- [x] ネットワーク前提: L1 Sepolia (11 contracts) ↔ L3 Aegis (11 crates)

---

## 前回レビュー課題

> CURRENT_STATE.md「🚧 ブロッカー / 懸念事項」確認

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| - | - | なし（Phase 4開始時点） | - |

---

## 今回のスコープ

### Week 1 実装項目

| タスクID | 内容 | 優先度 | 成果物 |
|---------|------|:------:|--------|
| INFRA-001 | Event Bridge設計 | P0 | `docs_new/01_phase/04_phase4/EVENT_BRIDGE_SPEC.md` |
| INFRA-002 | L1→L3 Event Indexer | P0 | `services/event-bridge/indexer/` |
| INFRA-003 | L3→L1 Relayer (2台構成) | P0 | `services/event-bridge/relayer/` |
| INFRA-004 | Multi-Relayer統合テスト | P1 | `services/event-bridge/tests/` |
| INFRA-005 | HSM連携仕様書 | P1 | `docs_new/01_phase/04_phase4/HSM_INTEGRATION_SPEC.md` |
| PROMPT-001 | プロンプトパス修正 | P0 | `docs_new/02_agents_prompt/02_prompts/*.md` |

### 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| Phase 4計画 | `PHASE4_PLAN.md` | Week 1, §4.1 Event Bridge |
| 会議決定事項 | `AGENT_MEETING_MINUTES_20260104.md` | §5.2 条件付き承認事項 |
| Sequence仕様 | `SEQUENCES.md` | §1-§3' (Lock/Unlock/Resync) |
| アーキテクチャ | `MODULAR_ARCHITECTURE.md` | Core Layer構成 |
| 憲法 | `CORE_PRINCIPLES.md` | CP-1〜CP-5 |

---

## 成果物

| ファイル | 説明 | タスクID |
|---------|------|---------|
| `services/event-bridge/indexer/` | L1→L3 Event Indexer | INFRA-002 |
| `services/event-bridge/relayer/` | L3→L1 Multi-Relayer | INFRA-003 |
| `services/event-bridge/tests/` | 統合テストスイート | INFRA-004 |
| `docs_new/01_phase/04_phase4/HSM_INTEGRATION_SPEC.md` | HSM連携仕様 | INFRA-005 |

---

## アーキテクチャ概要

### Event Bridge構成

```
┌─────────────────────────────────────────────────────────────┐
│                    Event Bridge Architecture                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  L1 (Sepolia)          Event Bridge          L3 (Aegis)     │
│  ┌──────────┐          ┌──────────┐          ┌──────────┐   │
│  │ L1Vault  │────────►│ Indexer  │◄────────│ BFT Node │   │
│  │ Events   │          │          │          │ Events   │   │
│  └──────────┘          └────┬─────┘          └──────────┘   │
│                              │                              │
│                    ┌────────┴────────┐                      │
│                    │   PostgreSQL    │                      │
│                    │   Event Store   │                      │
│                    └────────┬────────┘                      │
│                              │                              │
│  ┌──────────┐          ┌────┴─────┐          ┌──────────┐   │
│  │ L1Vault  │◄────────│ Relayer  │────────►│ L3 Node  │   │
│  │          │          │ (2台)    │          │          │   │
│  └──────────┘          └──────────┘          └──────────┘   │
│                                                              │
│  Multi-Relayer構成:                                         │
│  - Primary: メイン処理                                       │
│  - Secondary: フェイルオーバー                                │
│  - 自動切替: Primary障害時に自動フェイルオーバー              │
└─────────────────────────────────────────────────────────────┘
```

### イベントフロー

```
Lock (L1→L3):
  User ─► L1Vault ─► Locked Event ─► Indexer ─► L3 State Update

Unlock (L3→L1):
  User ─► L3 BFT ─► UnlockReady Event ─► Relayer ─► L1Vault

Resync (障害復旧):
  Indexer ─► Poll L1 Events ─► 未同期Lock検出 ─► L3 State復旧
```

---

## 実行順序

### Day 1-2: 設計・仕様確定

1. EVENT_BRIDGE_SPEC.md 既存レビュー
2. HSM_INTEGRATION_SPEC.md 新規作成
3. 技術仕様の最終確認

### Day 3-5: Indexer実装

4. L1 Event Listener実装（ethers.js/viem）
5. PostgreSQL Event Store設定
6. 12ブロック確認ロジック実装
7. 冪等性チェック実装

### Day 6-8: Relayer実装

8. Primary Relayer実装
9. Secondary Relayer実装
10. フェイルオーバーロジック実装
11. Redis Streams統合

### Day 9-10: 統合テスト

12. Lock→L3同期テスト
13. Unlock→L1テスト
14. Resync復旧テスト
15. Multi-Relayerフェイルオーバーテスト

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - Event BridgeはSHA3-256使用、Dilithium/SPHINCS+署名検証
- [x] CP-2: Self-Custody - ユーザー秘密鍵をサーバー保存しない
- [x] CP-3: Time Lock存在 - 24h (Normal) / 7d (Emergency) Time Lock維持
- [x] CP-4: Slashing存在 - Prover不正時のSlashingメカニズム維持
- [x] CP-5: 透明性 - 全イベントオンチェーン検証可能

---

## セキュリティ考慮事項（AGENT_MEETING 決議より）

### Red Team指摘対応

| # | 攻撃 | リスク | 対策 | 状態 |
|---|------|:------:|------|:----:|
| 1 | イベント偽造 | 高 | L1イベント署名検証 | ⬜ 実装予定 |
| 2 | イベント再生攻撃 | 中 | 冪等性保証（Event ID重複チェック） | ⬜ 実装予定 |
| 3 | DoS（大量イベント） | 中 | レート制限 | ⬜ 実装予定 |
| 4 | L1 reorg攻撃 | 中 | 12ブロック確認 | ⬜ 実装予定 |
| 5 | Redis侵害 | 高 | 認証・暗号化 | ⬜ 実装予定 |
| 6 | Man-in-the-Middle | 高 | mTLS必須 | ⬜ 実装予定 |

### CSO承認条件

- [ ] 12ブロック確認（reorg対策）実装
- [ ] 冪等性保証の設計
- [ ] リトライポリシーの明確化
- [ ] HSMセキュリティ（mTLS必須化）

---

## リスク・懸念事項

| # | リスク | 重要度 | 緩和策 |
|---|--------|:------:|--------|
| R1 | Event Bridge SPoF | 🔴 HIGH | Multi-Relayer構成（2台） |
| R2 | HSM Integration仕様未確定 | 🔴 CRITICAL | Week 1でSPEC作成（INFRA-005） |
| R3 | Sepolia RPC安定性 | 🟡 MEDIUM | 複数RPC Provider対応 |
| R4 | PostgreSQL障害 | 🟡 MEDIUM | レプリケーション設計 |

---

## 完了基準

| 基準 | 条件 | 目標 |
|------|------|:----:|
| Indexer動作 | L1 Lock Event → L3 State更新 | ✅ |
| Relayer動作 | L3 Unlock → L1 TX送信 | ✅ |
| Multi-Relayer | フェイルオーバー動作確認 | ✅ |
| 12ブロック確認 | reorg対策実装 | ✅ |
| 統合テスト | 基本シナリオPASS | ✅ |
| HSM仕様 | SPEC文書完成 | ✅ |

---

## 次のステップ

Week 1完了後:
- [ ] 02_spec.md → SPEC_REVIEW.md 作成
- [ ] 03_impl.md → 実装実行
- [ ] 04_review.md → セキュリティレビュー
- [ ] 05_pir.md → PIR-P4-001 実施

Week 2予定:
- API-001~006: Lock/Unlock API実装
- INFRA-006: INCIDENT_RESPONSE_PLAN.md作成

---

**END OF CURRENT PLAN**
