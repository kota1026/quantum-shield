# Current Plan

> **Generated**: 2025-12-30 02:28 JST
> **Phase**: 3 - L3 + Token + 完全分散化
> **Sub-Phase**: 3.1 Foundation

## 対象チェックリスト

`docs/checklists/phase3.1.md`

---

## 🎯 現在のタスク

### L3-002: Single-node dev mode実装

| 項目 | 値 |
|------|-----|
| **タスクID** | L3-002 |
| **タイトル** | Single-node dev mode実装 |
| **IC-ID** | IC-1 (L3 Chain Infrastructure) |
| **優先度** | 🔴 P0 |
| **担当** | Rust Engineer |
| **前提** | ✅ L3-001 COMPLETE, PIR-P3.1-002 PASS |

---

## 仕様書参照（必須）

> 参照: `docs/planning/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence

| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| L3 Chain Infrastructure | l3-aegis (Rust) | L3_CHAIN_SPECIFICATION §7.1 |

### L3-002 仕様要件

> 参照: `docs/aegis/L3_CHAIN_SPECIFICATION.md` §7.1

| 要件 | 内容 | 実装箇所 |
|------|------|---------|
| 単一ノード起動 | フラグ `--dev` で開発モード起動 | `aegis-cli/src/commands.rs` |
| ブロック生成 | 自動ブロック生成（タイマー/Tx駆動） | `aegis-node/src/node.rs` |
| Tx処理 | CLI経由でトランザクション投入 | `aegis-cli/src/main.rs` |
| 状態更新 | SMTへの状態書き込み | `aegis-smt/src/tree.rs` |
| ログ出力 | 構造化ログ（tracing） | 全クレート |

### セキュリティ要件（継承）

| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------| 
| SHA3-256 ハッシュ | CP-1 / L3_CHAIN_SPEC §4.2 | `aegis-crypto/src/lib.rs` |
| Dilithium-III 署名 | CP-1 / L3_CHAIN_SPEC §4.1 | `aegis-crypto/src/dilithium.rs` |

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

- [x] 独自4ノードBFTチェーン前提か（devモードは単一ノード）
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
| IC-1 | L3 Chain Infrastructure (4-node BFT) | L3-002 | 🔄 ACTIVE |

### マスタ照合

- [x] IC-1がPHASE3_PLANに対応セクションを持つ
- [x] 欠落ICなし

### タスク紐付け

- [x] 今回スコープの全タスクにIC-IDを付与した
- [x] IC-ID不要タスクは理由を明記した（該当なし）

---

## 前回レビュー結果

> PIR-P3.1-002 より

| PIR ID | 対象 | 結果 | 日付 |
|--------|------|------|------|
| PIR-P3.1-002 | L3-001 l3-aegis構造設計 | ✅ PASS | 2025-12-30 |

### 引継ぎ事項

| # | 内容 | 対応 |
|---|------|------|
| 1 | Warning（unused imports） | L3-002で整理 |
| 2 | ViewChange未実装 | L3-003で対応 |

---

## 今回のスコープ

### L3-002 実装項目

| # | 項目 | 説明 | 状態 |
|---|------|------|:----:|
| 1 | Dev mode フラグ | `--dev` フラグでシングルノード起動 | ⬜ |
| 2 | Genesis block生成 | ハードコードされた初期状態から生成 | ⬜ |
| 3 | Block生成ループ | タイマー駆動の自動ブロック生成 | ⬜ |
| 4 | Tx受付 | CLI経由でのトランザクション投入 | ⬜ |
| 5 | 状態更新 | SMTへの状態書き込み・読み出し | ⬜ |
| 6 | ログ出力 | tracing による構造化ログ | ⬜ |
| 7 | E2Eテスト | ノード起動→Tx投入→ブロック確認 | ⬜ |

### 修正対象ファイル

| クレート | ファイル | 変更内容 |
|---------|---------|---------|
| aegis-cli | `src/commands.rs` | `--dev` フラグ追加 |
| aegis-cli | `src/main.rs` | dev mode起動ロジック |
| aegis-node | `src/node.rs` | シングルノード動作モード |
| aegis-node | `src/config.rs` | dev mode設定 |
| aegis-core | `src/builder.rs` | genesis block生成 |
| aegis-core | `src/state.rs` | 初期状態管理 |

### 新規作成ファイル

| ファイル | 説明 |
|---------|------|
| `aegis-node/src/dev.rs` | Dev mode専用ロジック |
| `aegis-core/src/genesis.rs` | Genesis block定義 |
| `l3-aegis/tests/e2e_dev_mode.rs` | E2Eテスト |

### 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| L3チェーン仕様 | `docs/aegis/L3_CHAIN_SPECIFICATION.md` | §7.1 Dev Mode |
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §1.5, §3, §4 |
| Phase 3.1チェックリスト | `docs/checklists/phase3.1.md` | Track A L3-002 |
| 前回PIR | `docs/aegis/pir/PIR-P3.1-002.md` | 全体 |

---

## 成果物

| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `aegis-node/src/dev.rs` | Dev mode実装 | IC-1 |
| `aegis-core/src/genesis.rs` | Genesis block | IC-1 |
| `l3-aegis/tests/e2e_dev_mode.rs` | E2Eテスト | IC-1 |
| `docs/aegis/pir/PIR-P3.1-003.md` | PIRレビュー結果 | IC-1 |

---

## 実行順序

### 実装手順

1. **設計確認**
   - L3_CHAIN_SPECIFICATION.md §7.1 再確認
   - 既存コードとの整合性確認

2. **Genesis block実装**
   - `aegis-core/src/genesis.rs` 作成
   - ハードコード初期状態定義

3. **Dev modeフラグ追加**
   - `aegis-cli/src/commands.rs` 修正
   - `--dev` オプション追加

4. **シングルノード動作実装**
   - `aegis-node/src/dev.rs` 作成
   - consensus不要の直接ブロック生成

5. **ブロック生成ループ**
   - タイマー駆動（例: 3秒間隔）
   - 空ブロック許可

6. **Tx処理実装**
   - CLI → ノードへのTx送信
   - mempool → block inclusion

7. **E2Eテスト作成**
   - ノード起動テスト
   - Tx処理テスト
   - 状態更新テスト

8. **PIRレビュー準備**
   - CURRENT_STATE.md 更新
   - PIR-P3.1-003 準備

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - SHA3-256, Dilithium-III使用継続
- [x] CP-2: Self-Custody - ユーザー鍵管理（L3レベルでは直接関与なし）
- [x] CP-3: Time Lock存在 - Core Layer実装予定（L3-002スコープ外）
- [x] CP-4: Slashing存在 - Core Layer実装予定（L3-002スコープ外）
- [x] CP-5: 透明性 - 全操作がL3ブロックに記録

---

## テスト計画

### 新規テスト

| テスト | 説明 | 優先度 |
|-------|------|--------|
| `test_dev_mode_startup` | dev modeでの起動確認 | 🔴 P0 |
| `test_genesis_block_creation` | genesis block生成確認 | 🔴 P0 |
| `test_block_production_loop` | ブロック生成ループ確認 | 🔴 P0 |
| `test_tx_submission` | Tx投入確認 | 🔴 P0 |
| `test_state_update` | SMT状態更新確認 | 🔴 P0 |
| `test_e2e_dev_mode` | E2E統合テスト | 🔴 P0 |

### テスト目標

| 項目 | 目標 |
|------|------|
| 新規テスト数 | +10〜15 |
| 総テスト数（l3-aegis） | 80+ |
| Pass率 | 100% |

---

## リスク・懸念事項

| # | リスク | 重要度 | 対策 |
|---|-------|--------|------|
| 1 | ブロック生成タイミング設計 | 🟠 MEDIUM | 設定可能なインターバル |
| 2 | genesis state設計 | 🟢 LOW | 最小限のハードコード |
| 3 | consensus省略の影響 | 🟢 LOW | dev mode専用ロジック分離 |

---

## 完了基準

### L3-002 完了条件

- [ ] `--dev` フラグでシングルノード起動可能
- [ ] Genesis blockが正常に生成される
- [ ] ブロック生成ループが動作する
- [ ] CLI経由でTx投入可能
- [ ] SMT状態が正しく更新される
- [ ] 新規テスト全てPASS
- [ ] PIR-P3.1-003 PASS

### L3-002 → L3-003 移行基準

- [ ] L3-002 実装完了
- [ ] 新規テスト全てPASS
- [ ] PIR-P3.1-003 レビュー完了
- [ ] dev mode動作検証完了

---

## 次ステップ（L3-002完了後）

| # | タスク | 優先度 | IC-ID |
|---|--------|--------|-------|
| 1 | L3-003 Basic PBFT consensus実装 | 🔴 P0 | IC-1 |
| 2 | L3-004 Dilithium-III consensus署名統合 | 🔴 P0 | IC-1 |
| 3 | l3-aegis専用CI/CDワークフロー作成 | 🟠 High | - |

---

**END OF CURRENT PLAN**
