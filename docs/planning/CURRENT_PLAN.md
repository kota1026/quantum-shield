# Current Plan

> **Generated**: 2026-01-01 21:00 JST
> **Phase**: 3.2 Implementation
> **Sub-Phase**: Week 5-6 Sequencer実装

## 対象チェックリスト
`docs/checklists/phase3.2.md`

---

## 仕様書参照（必須）

> 参照: `docs/planning/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence
| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| #1 Lock | Core | SEQUENCES §1 (Sequencerがトランザクション記録) |
| #2 Unlock (Normal) | Core | SEQUENCES §2 (BatchBuilder, L1 Submit) |
| #5 Prover Registration | Core + Token | SEQUENCES §5 (Sequencer Staking統合) |

### セキュリティ要件
| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| トランザクション順序保証 | L3_CHAIN_SPEC §2 | BatchBuilder FIFO + タイムスタンプ |
| L1提出の透明性 | CP-5 | L1SubmitTx としてL3ブロックに記録 |
| Sequencer Rotation | L3_CHAIN_SPEC §3 | Round-robin + View Change |
| Stake要件 | UNIFIED_SPEC §Phase 2 | Sequencer Staking統合 (IC-3) |

---

## 戦略準拠確認（Phase 3以降）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提 ✅
- [x] アーキテクチャ: Modular (Core/Governance/Token Layer) ✅
- [x] リスク緩和: Sequencer中央集権リスク → Multi-Sequencer対応 (SEQ-007)
- [x] モード制約: MULTISIG + BASIC/FULL 許可

---

## L3基盤確認（Phase 3のL3関連タスク）

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

- [x] 独自4ノードBFTチェーン前提か ✅
- [x] l3-aegis (Rust) の範囲内か ✅
- [x] SEQUENCES v2.0に準拠しているか ✅
- [x] CP-1/CP-5を満たしているか ✅

---

## IC完全性チェック（Phase 3必須）

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 今回スコープのIC
| IC-ID | Component | タスク | Status |
|-------|-----------|--------|--------|
| IC-3 | Sequencer | SEQ-003〜008 | 🟡 In Progress (2/8完了) |

### マスタ照合
- [x] 全IC-ID（IC-1〜IC-5, IC-7）がPHASE3_PLANに対応セクションを持つ ✅
- [x] 欠落ICなし（IC-6は不要: CEO指示 2025-01-01） ✅

### タスク紐付け
- [x] 今回スコープの全タスクにIC-IDを付与した ✅
- [x] IC-ID不要タスクは理由を明記した ✅ (該当なし)

---

## 前回レビュー課題（該当時のみ）

> CURRENT_STATE.mdより: 🚧 ブロッカー / 懸念事項

| # | 重要度 | 課題 | 対策 | 今回対応 |
|---|--------|------|------|:--------:|
| 1 | 🔴 HIGH | 独自L3技術リスク | 緩和策実施（監査、TVL制限） | ⚪ 監査準備Week 9-10 |
| 2 | 🟠 MEDIUM | Sequencer中央集権リスク | Multi-Sequencer設計組込 | ✅ **SEQ-007で対応** |
| 3 | 🟠 MEDIUM | 監査日程調整 | 早期RFP発行 | ⚪ Week 9-10 |
| 4 | 🟠 MEDIUM | エコシステム構築 | CBO計画策定 | ⚪ Phase 3.3 |

**今回修正必須項目**: なし（前回PIR-P3.2-002でバグ修正・CP-1修正完了）

---

## 今回のスコープ

### 実装項目
| # | タスク | IC | 優先度 | 説明 |
|---|--------|-----|--------|------|
| SEQ-003 | BatchBuilder実装 | IC-3 | 🔴 P0 | トランザクションバッチ構築 |
| SEQ-004 | L1 Submitter実装 | IC-3 | 🔴 P0 | L1へのState Root提出 |
| SEQ-005 | Sequencer Rotation機構 | IC-3 | 🟠 P1 | ラウンドロビン + View Change対応 |
| SEQ-006 | Sequencer Staking統合 | IC-3 | 🟠 P1 | veQS/Stake統合 |
| SEQ-007 | Multi-Sequencer対応準備 | IC-3 | 🟠 P1 | 複数Sequencer競合設計 |
| SEQ-008 | Sequencer統合テスト | IC-3 | 🟠 P1 | E2Eテスト |

### テスト項目
| # | タスク | 対象 |
|---|--------|------|
| TEST-SEQ-001 | BatchBuilder単体テスト | SEQ-003 |
| TEST-SEQ-002 | L1Submitter単体テスト | SEQ-004 |
| TEST-SEQ-003 | Rotation機構テスト | SEQ-005 |
| TEST-SEQ-004 | Staking統合テスト | SEQ-006 |
| TEST-SEQ-005 | Multi-Sequencer競合テスト | SEQ-007 |
| TEST-SEQ-006 | Sequencer E2Eテスト | SEQ-008 |

### 参照ドキュメント
| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §3, §5, §10 |
| Sequence仕様 | `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | #1, #2, #5 |
| 全体仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | §IC, §Phase 2 |
| L3基盤決議 | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` | 全体 |
| L3詳細仕様 | `docs/aegis/L3_CHAIN_SPECIFICATION.md` | §2, §3, §9 |
| Phase 3計画 | `docs/planning/PHASE3_PLAN.md` | §2 Sequencer |
| 既存SEQ実装 | `l3-aegis/src/sequencer/` | SEQ-001, SEQ-002 |

---

## 成果物
| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `l3-aegis/src/sequencer/batch_builder.rs` | BatchBuilder実装 | IC-3 |
| `l3-aegis/src/sequencer/l1_submitter.rs` | L1 Submitter実装 | IC-3 |
| `l3-aegis/src/sequencer/rotation.rs` | Rotation機構 | IC-3 |
| `l3-aegis/src/sequencer/staking.rs` | Staking統合 | IC-3 |
| `l3-aegis/src/sequencer/multi_sequencer.rs` | Multi-Sequencer対応 | IC-3 |
| `l3-aegis/tests/sequencer/` | Sequencerテスト群 | - |
| `l3-aegis/src/core/mod.rs` | Core統合更新 | IC-3 |

---

## 実行順序

### Day 1-2: BatchBuilder (SEQ-003)
1. `batch_builder.rs` 基本構造作成
2. FIFO キューイング実装
3. バッチサイズ・タイムアウト設定
4. トランザクション検証統合
5. 単体テスト作成・実行

### Day 3-4: L1 Submitter (SEQ-004)
1. `l1_submitter.rs` 基本構造作成
2. State Root計算統合（SMT）
3. L1コントラクト呼び出しモック
4. L1SubmitTx L3ブロック記録
5. 単体テスト作成・実行

### Day 5-6: Rotation機構 (SEQ-005)
1. `rotation.rs` ラウンドロビン実装
2. View Change連携
3. Leader選出ロジック
4. 単体テスト作成・実行

### Day 7-8: Staking統合 (SEQ-006)
1. `staking.rs` インターフェース定義
2. veQS コントラクト参照
3. Stake検証ロジック
4. 単体テスト作成・実行

### Day 9-10: Multi-Sequencer + 統合テスト (SEQ-007, SEQ-008)
1. `multi_sequencer.rs` 競合設計
2. 複数Sequencer同時稼働準備
3. Sequencer統合テスト実装
4. E2Eテスト実行
5. **PIR-P3.2-003準備**

---

## Core Principles確認
- [x] CP-1: 完全量子耐性 - SHA3-256ハッシュのみ使用、Dilithium署名 ✅
- [x] CP-2: Self-Custody - Sequencerはユーザー秘密鍵を保持しない ✅
- [x] CP-3: Time Lock存在 - L1で24h/7日Time Lock維持 ✅
- [x] CP-4: Slashing存在 - L1でSlashing実行維持 ✅
- [x] CP-5: 透明性 - 全操作がL3ブロックに記録 ✅

---

## Modular Architecture確認（Phase 3以降）
- [x] Core Layer: Sequencerは Core Layer の一部として動作 ✅
- [x] Governance Layer: Sequencer Rotation は Governance モードで条件分岐可能 ✅
- [x] Token Layer: Sequencer Staking は Token Layer (veQS) と統合 ✅
- [x] Layer間依存: 下位→上位依存なし（Core → Token 参照のみ） ✅

---

## 禁止アルゴリズムチェック

実装前に以下が使用されていないことを確認：

- [ ] keccak256 → SHA3-256を使用
- [ ] SHA-256 / SHA-2 → SHA3-256を使用
- [ ] ECDSA → Dilithium-IIIを使用
- [ ] RSA → SPHINCS+を使用
- [ ] secp256k1 → 使用禁止

---

## リスク・懸念事項

| # | リスク | 重要度 | 対策 |
|---|--------|--------|------|
| 1 | BatchBuilderのスループット | 🟠 | バッチサイズ・タイムアウトのチューニング |
| 2 | L1 Gas高騰時の提出遅延 | 🟠 | Gas価格監視 + 閾値設定 |
| 3 | Multi-Sequencer競合 | 🟠 | Leader選出明確化、同期プロトコル |
| 4 | Staking統合の複雑さ | 🟡 | veQSとの最小限インターフェース |

---

## 成功基準

| 基準 | 条件 |
|------|------|
| タスク完了 | SEQ-003〜008 全完了 |
| テスト | 全テストPASS |
| CP準拠 | CP-1〜5 全て準拠 |
| PIR | PIR-P3.2-003 PASS |

---

## 次のアクション

1. ✅ CURRENT_PLAN.md 作成完了
2. ⬜ **02_spec.md 実行** → 仕様レビュー
3. ⬜ **03_impl.md 実行** → 実装開始
4. ⬜ **04_review.md 実行** → セキュリティレビュー
5. ⬜ **05_pir.md 実行** → PIR-P3.2-003

---

**END OF CURRENT PLAN**
