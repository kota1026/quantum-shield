# Current Plan

> **Generated**: 2025-12-30 10:00 JST
> **Phase**: 3 - L3 + Token + 完全分散化
> **Sub-Phase**: 3.1 Foundation

## 対象チェックリスト

`docs/checklists/phase3.1.md`

---

## 仕様書参照（必須）

> 参照: `docs/planning/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence

| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| L3 Chain Infrastructure | l3-aegis (Rust) | L3_CHAIN_SPECIFICATION §2-6 |

### セキュリティ要件

| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| SHA3-256 ハッシュ | CP-1 / L3_CHAIN_SPEC §4.2 | `aegis-crypto/src/lib.rs` |
| Dilithium-III 署名 | CP-1 / L3_CHAIN_SPEC §4.1 | `aegis-crypto/src/dilithium.rs` |
| PBFT 合意 (f=1) | L3_CHAIN_SPEC §3 | `aegis-consensus/src/engine.rs` |
| 4ノードBFT構成 | L3_CHAIN_SPEC §2.1 | `docker/docker-compose.yml` |
| Sparse Merkle Tree | L3_CHAIN_SPEC §5.2 | `aegis-smt/src/tree.rs` |

---

## 戦略準拠確認（Phase 3）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提
- [x] アーキテクチャ: Modular (Core/Governance/Token Layer)
- [x] リスク緩和: 複数回監査、段階的TVL、網羅的テスト
- [x] モード制約: Core Layer常時ON

---

## L3基盤確認（Phase 3のL3関連タスク）

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

- [x] 独自4ノードBFTチェーン前提か
- [x] l3-aegis (Rust) の範囲内か
- [x] ZK-STARK不使用（将来検討）
- [x] SEQUENCES v2.0に準拠しているか
- [x] CP-1/CP-5を満たしているか

---

## IC完全性チェック（Phase 3必須）

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 今回スコープのIC

| IC-ID | Component | タスク | Status |
|-------|-----------|--------|--------|
| IC-1 | L3 Chain Infrastructure (4-node BFT) | L3-001 | 🟡 PIR待ち |

### マスタ照合

- [x] IC-1がPHASE3_PLANに対応セクションを持つ
- [x] 欠落ICなし

### タスク紐付け

- [x] 今回スコープの全タスクにIC-IDを付与した
- [x] IC-ID不要タスクは理由を明記した（該当なし）

---

## 前回レビュー課題（該当時のみ）

> CURRENT_STATE.mdより

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| - | - | なし（前回PIR-P3.1-001はPASS済み） | - |

---

## 今回のスコープ

### 📋 PIRレビュー項目 (PIR-P3.1-002)

> **対象**: L3-001 l3-aegis プロジェクト構造設計 (IC-1)
> **PIR Code Review Routine**: `docs/aegis/PIR_CODE_REVIEW_ROUTINE.md` 準拠

- [ ] [PIR-001] 実装コードレビュー（仕様書準拠確認）
- [ ] [PIR-002] テストコードレビュー（69/69 PASS確認）
- [ ] [PIR-003] 11エージェントレビュー投票
- [ ] [PIR-004] セキュリティ確認（CP-1準拠）
- [ ] [PIR-005] PIR判定（PASS/CONDITIONAL/FAIL）

### 確認対象ファイル

| クレート | 主要ファイル | テスト数 |
|---------|------------|:--------:|
| aegis-types | `lib.rs`, `error.rs`, `hash.rs`, `block.rs`, `tx.rs` | 13 |
| aegis-crypto | `lib.rs`, `dilithium.rs` | 8 |
| aegis-smt | `tree.rs`, `proof.rs`, `hash.rs` | 6 |
| aegis-core | `state.rs`, `builder.rs` | 5 |
| aegis-consensus | `engine.rs`, `message.rs`, `state.rs` | 9 |
| aegis-network | `peer.rs`, `transport.rs`, `discovery.rs` | 8 |
| aegis-storage | `store.rs`, `rocks.rs` | 12 |
| aegis-node | `node.rs`, `config.rs` | 4 |
| aegis-cli | `main.rs`, `commands.rs` | 4 |

### 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §1.5, §3, §4 |
| L3チェーン仕様 | `docs/aegis/L3_CHAIN_SPECIFICATION.md` | §2-6 |
| L3基盤決議 | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` | 全体 |
| PIRルーチン | `docs/aegis/PIR_CODE_REVIEW_ROUTINE.md` | 全体 |
| Phase 3.1チェックリスト | `docs/checklists/phase3.1.md` | Track A |
| 実装レポート | `docs/planning/CURRENT_STATE.md` | §最新実装レポート |

---

## 成果物

| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `docs/aegis/pir/PIR-P3.1-002.md` | PIRレビュー結果 | IC-1 |

---

## 実行順序

### PIRレビュー手順（04_review.md → 05_pir.md）

1. **実装コードレビュー**
   - L3_CHAIN_SPECIFICATION.md との整合性確認
   - 仕様書要件の実装箇所マッピング確認
   
2. **テストコードレビュー**
   - 69テストの妥当性確認
   - カバレッジ確認

3. **CP-1準拠確認**
   - SHA3-256使用（keccak256禁止）
   - Dilithium-III署名（ECDSA禁止）
   - SPHINCS+対応準備

4. **11エージェントレビュー**
   - 各エージェントの観点からレビュー
   - 投票集計

5. **PIR判定**
   - PASS: 全基準クリア → L3-002へ移行
   - CONDITIONAL: 軽微な修正後再レビュー
   - FAIL: 重大な問題 → 再実装

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - SHA3-256, Dilithium-III使用確認
- [x] CP-2: Self-Custody - ユーザー鍵管理（L3レベルでは直接関与なし）
- [x] CP-3: Time Lock存在 - Core Layer実装予定（L3-001スコープ外）
- [x] CP-4: Slashing存在 - Core Layer実装予定（L3-001スコープ外）
- [x] CP-5: 透明性 - 全操作がL3ブロックに記録

---

## L3-001 PIRレビュー観点

### 仕様書準拠チェック

| 要件 | L3_CHAIN_SPEC | 実装 | 状態 |
|------|--------------|------|:----:|
| 4ノードBFT | §2.1 | docker-compose.yml | ✅ |
| PBFT (f=1) | §3.1 | aegis-consensus | ✅ |
| Dilithium-III | §4.1 | aegis-crypto | ✅ |
| SHA3-256 | §4.2 | aegis-crypto | ✅ |
| RocksDB | §5.1 | aegis-storage | ✅ |
| SMT (256-depth) | §5.2 | aegis-smt | ✅ |
| TLS 1.3 | §6.1 | aegis-network | ✅ |
| libp2p | §6.2 | aegis-network | ✅ |

### CP-1準拠チェック

| 項目 | 要件 | 実装 | 確認 |
|------|------|------|:----:|
| ハッシュ | SHA3-256 (FIPS 202) | ✅ sha3クレート使用 | ⬜ |
| 署名 | Dilithium-III (FIPS 204) | ✅ pqcrypto-dilithium使用 | ⬜ |
| 禁止: keccak256 | 不使用 | ⬜ 要確認 | ⬜ |
| 禁止: ECDSA | 不使用 | ⬜ 要確認 | ⬜ |
| 禁止: RSA | 不使用 | ⬜ 要確認 | ⬜ |
| 禁止: secp256k1 | 不使用 | ⬜ 要確認 | ⬜ |

---

## リスク・懸念事項

| # | リスク | 重要度 | 対策 |
|---|-------|--------|------|
| 1 | SMT proof verificationのbit position計算 | 🟢 LOW | 既に修正済み（コミット531697f） |
| 2 | Dilithium署名サイズ(3309 bytes)の互換性 | 🟢 LOW | pqcrypto v0.5準拠確認済み |
| 3 | Warning（unused imports等） | 🟢 LOW | 非ブロッキング、後続タスクで対応可 |

---

## 次ステップ（PIR後）

PIR-P3.1-002がPASSの場合：

| # | タスク | 優先度 | IC-ID |
|---|--------|--------|-------|
| 1 | L3-002 Single-node dev mode実装 | 🔴 P0 | IC-1 |
| 2 | L3-003 Basic PBFT consensus実装 | 🔴 P0 | IC-1 |
| 3 | l3-aegis専用CI/CDワークフロー作成 | 🟠 High | - |

---

**END OF CURRENT PLAN**
