# Current Plan

> **Generated**: 2025-12-30 15:30 JST
> **Phase**: 3 - L3 + Token + 完全分散化
> **Sub-Phase**: 3.1 Foundation
> **Month**: 10 / 24

---

## 対象チェックリスト

`docs/checklists/phase3.1.md`

---

## 仕様書参照（必須）

> 参照: `docs/planning/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence

| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| #1 Lock | Core | SEQUENCES §1 |
| #2 Unlock | Core | SEQUENCES §2 |

※ L3チェーン基盤（IC-1）はSequence #1-4の基盤となるインフラ

### セキュリティ要件

| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| SHA3-256 ハッシュ | CORE_PRINCIPLES / L3_CHAIN_SPECIFICATION §2, §5 | sha3クレート、全ブロック・トランザクションハッシュ |
| Dilithium-III 署名 | CORE_PRINCIPLES / L3_CHAIN_SPECIFICATION §3, §6 | pqcrypto-dilithiumクレート |
| 禁止アルゴリズム不使用 | CORE_PRINCIPLES | keccak256, SHA-256, ECDSA, RSA, secp256k1 排除 |

---

## 戦略準拠確認（Phase 3）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提
- [x] アーキテクチャ: Modular (Core/Governance/Token Layer)
- [x] リスク緩和: 網羅的テスト実施
- [x] モード制約: Phase 3.1はCore Layer（IC-1）優先

---

## L3基盤確認（Phase 3のL3関連タスク）

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

- [x] 独自4ノードBFTチェーン前提か: ✅
- [x] l3-aegis (Rust) の範囲内か: ✅
- [x] SEQUENCES v2.0に準拠しているか: ✅
- [x] CP-1/CP-5を満たしているか: ✅

---

## IC完全性チェック（Phase 3必須）

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 今回スコープのIC

| IC-ID | Component | タスク | Status |
|-------|-----------|--------|--------|
| IC-1 | L3 Chain Infrastructure (4-node BFT) | L3-004, L3-005, L3-006 | 🟡 In Progress |

### マスタ照合

- [x] 全IC-ID（IC-1〜IC-6）がPHASE3_PLANに対応セクションを持つ
- [x] 欠落ICなし

### タスク紐付け

- [x] 今回スコープの全タスクにIC-IDを付与した
- [x] IC-ID不要タスクは理由を明記した

---

## 前回レビュー課題

> CURRENT_STATE.mdより

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| 1 | ✅ 解決済み | L3-003 PIR未完了 | PIR-P3.1-005 PASS |
| 2 | 🟠 MEDIUM | Modular設計複雑性 | 網羅的テスト |
| 3 | 🟢 LOW | via_ir問題 | L3移行後不要の可能性 |

**Critical/High課題**: なし ✅

---

## 今回のスコープ

### 確認項目（L3-004完了確認）

- [ ] [VERIFY-001] L3-004 Dilithium-III署名統合の完了確認 (IC-1)
  - signature.rs実装済み確認
  - TEST-005, TEST-006 PASS確認
  - 全テスト132/132 PASS確認
  - CURRENT_STATE.md更新（🔄→✅）

### 実装項目

- [ ] [IMPL-001] L3-005 SHA3-256 block hashing実装 (IC-1)
  - SHA3-256ライブラリ統合確認（sha3クレート）
  - ブロックハッシュ計算実装
  - トランザクションハッシュ計算実装
  - Merkleルート計算実装
  - CP-1準拠確認

### テスト項目

- [ ] [TEST-001] SHA3-256ブロックハッシュ単体テスト
- [ ] [TEST-002] SHA3-256トランザクションハッシュ単体テスト
- [ ] [TEST-003] Merkleルート計算テスト
- [ ] [TEST-004] CP-1準拠確認テスト（禁止アルゴリズム不使用）
- [ ] [TEST-005] 全テストスイート実行（`cargo test --all`）

### 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §1.5, §3, §4 |
| L3詳細仕様 | `docs/aegis/L3_CHAIN_SPECIFICATION.md` | §2, §5 |
| L3基盤決議 | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` | 全体 |
| Phase 3.1チェックリスト | `docs/checklists/phase3.1.md` | Track A L3-005 |
| 憲法 | `docs/constitution/CORE_PRINCIPLES.md` | 暗号学的要件 |

---

## 成果物

| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `l3-aegis/crates/aegis-crypto/src/hash.rs` | SHA3-256ハッシュモジュール（既存拡張） | IC-1 |
| `l3-aegis/crates/aegis-types/src/block.rs` | ブロックハッシュ計算実装 | IC-1 |
| `l3-aegis/crates/aegis-types/src/transaction.rs` | トランザクションハッシュ計算実装 | IC-1 |
| `l3-aegis/crates/aegis-core/src/merkle.rs` | Merkleルート計算（新規または既存拡張） | IC-1 |
| `l3-aegis/crates/*/tests/*.rs` | 各種テストファイル | - |

---

## 実行順序

### Phase A: L3-004完了確認 (VERIFY-001)

1. `l3-aegis/crates/aegis-consensus/src/signature.rs` の実装確認
2. TEST-005, TEST-006の結果確認
3. `cargo test --all` で132テスト全PASSを確認
4. L3-004を✅完了にステータス更新

### Phase B: L3-005実装 (IMPL-001)

1. **既存SHA3-256実装の確認**
   - `aegis-crypto/src/` のSHA3-256実装状況確認
   - sha3クレート依存関係確認

2. **ブロックハッシュ計算実装**
   - L3_CHAIN_SPECIFICATION §2.4準拠
   - `block_hash = SHA3-256(version || height || timestamp || parent_hash || state_root || tx_root || proposer)`

3. **トランザクションハッシュ計算実装**
   - 各トランザクション種別のハッシュ計算

4. **Merkleルート計算実装**
   - トランザクションリストからtx_root計算
   - SMTとの整合性確認

5. **テスト作成・実行**
   - TEST-001〜TEST-005の作成・実行
   - `cargo test --all` で全テストPASS確認

### Phase C: PIR準備

1. 実装コード最終確認
2. テスト結果記録
3. PIR-P3.1-006用ドキュメント準備

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - SHA3-256使用、禁止アルゴリズム不使用
- [x] CP-2: Self-Custody - 違反なし（L3はユーザー秘密鍵を保持しない）
- [x] CP-3: Time Lock存在 - 違反なし（L1で実装）
- [x] CP-4: Slashing存在 - 違反なし（L1で実装）
- [x] CP-5: 透明性 - 全操作がL3ブロックに記録

---

## L3_CHAIN_SPECIFICATION準拠確認

### §2 ブロック構造

| 項目 | 仕様 | 実装予定 |
|------|------|---------|
| block_hash計算 | SHA3-256 | ✅ L3-005で実装 |
| parent_hash | [u8; 32] SHA3-256 | ✅ |
| state_root | [u8; 32] SHA3-256 | ✅ L3-002で実装済み |
| tx_root | [u8; 32] SHA3-256 | ✅ L3-005で実装 |

### §5 状態管理

| 項目 | 仕様 | 実装予定 |
|------|------|---------|
| SMTハッシュ | SHA3-256 | ✅ L3-001で実装済み |
| Merkle Proof | SHA3-256 | ✅ L3-005で確認 |

### §8 量子耐性確認

| 用途 | アルゴリズム | 標準 | 実装 |
|------|-------------|------|------|
| ブロックハッシュ | SHA3-256 | FIPS 202 | L3-005 |
| SMT | SHA3-256 | FIPS 202 | ✅ 実装済み |
| 合意署名 | Dilithium-III | FIPS 204 | ✅ L3-003/L3-004 |

---

## リスク・懸念事項

| # | リスク | 影響度 | 対策 |
|---|--------|--------|------|
| 1 | SHA3-256実装の重複 | 🟢 LOW | 既存aegis-cryptoモジュールを活用 |
| 2 | Merkle計算のパフォーマンス | 🟡 MEDIUM | ベンチマークテスト追加 |
| 3 | トランザクション種別ごとのハッシュ形式 | 🟢 LOW | L3_CHAIN_SPECIFICATION準拠 |

---

## 完了基準

| # | 基準 | 検証方法 |
|---|------|---------| 
| 1 | L3-004完了確認 | CURRENT_STATE.md更新 |
| 2 | SHA3-256ブロックハッシュ動作 | TEST-001 PASS |
| 3 | SHA3-256トランザクションハッシュ動作 | TEST-002 PASS |
| 4 | Merkleルート計算動作 | TEST-003 PASS |
| 5 | CP-1準拠確認 | TEST-004 PASS |
| 6 | 全テスト100% PASS | `cargo test --all` |

---

## 次のアクション予告

L3-005完了後：
- **L3-006**: 4-node local testnet構築
  - Docker Compose設定
  - 4ノード構成
  - P2Pネットワーク接続
  - コンセンサス動作確認

---

**END OF CURRENT PLAN**
