# Current Plan

> **Generated**: 2025-12-25 23:55 JST  
> **Phase**: 2 - Security Council + Token  
> **Day**: 1 (Phase 2 開始)  
> **Week**: 1

---

## 対象チェックリスト

⚠️ **Phase 2 Active Checklist未作成**

Week 1タスク #1でActive Checklist作成予定。現在は以下を参照：
- `docs/planning/ZK_STARK_IMPLEMENTATION_PLAN.md` (Phase 2.1 Foundation)
- `docs/planning/COMPILER_WARNINGS_LOG.md`

---

## 前回レビュー課題（Phase 1→Phase 2移行）

> CURRENT_STATE.mdより取得

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| 1 | 🔴 HIGH | FRIVerifier.sol L191 `keccak256`使用（CP-1違反リスク） | SHA3-256への移行 |
| 2 | 🟡 MEDIUM | 外部監査スケジュール未確定 | RFP準備開始 |
| 3 | 🟢 LOW | Compiler Warnings未解決 | 棚卸し・対応計画策定 |

---

## 今回のスコープ

### 修正項目（レビュー課題より）

- [ ] [FIX-001] **FRIVerifier.sol keccak256→SHA3-256移行** 🔴 HIGH
  - Line 191付近: `keccak256` → `SHA3_256.hash`
  - SHA3_256.solライブラリimport追加
  - 関連テスト更新

### 実装項目

- [ ] [IMPL-001] Phase 2 Active Checklist作成（CTO担当、期限: 2025-12-27）
- [ ] [IMPL-002] forge build警告ログ取得・記録
- [ ] [IMPL-003] FRIVerifier.sol SHA3-256対応コード実装

### テスト項目

- [ ] [TEST-001] FRIVerifier SHA3-256移行後のテスト
  - 既存FRIテストがPASSすることを確認
  - Gas consumption測定

### 参照ドキュメント

- Sequence: `docs/constitution/QUANTUM_SHIELD_SEQUENCES_v2.0_REF.md`
- ZK-STARK計画: `docs/planning/ZK_STARK_IMPLEMENTATION_PLAN.md`
- 警告ログ: `docs/planning/COMPILER_WARNINGS_LOG.md`
- 憲法: `docs/constitution/CORE_PRINCIPLES.md`

---

## 成果物

| ファイル | 説明 |
|---------|------|
| `contracts/src/FRIVerifier.sol` | SHA3-256対応版 |
| `test/FRIVerifierSHA3Test.t.sol` | SHA3移行検証テスト（必要に応じて） |
| `docs/planning/COMPILER_WARNINGS_LOG.md` | 更新（forge buildログ追記） |
| `docs/planning/PHASE2_ACTIVE_CHECKLIST.md` | 新規作成（CTO） |

---

## 実行順序

### Step 1: 準備（本ステップ）
1. ✅ CORE_PRINCIPLES.md 読み込み
2. ✅ CURRENT_STATE.md 読み込み
3. ✅ ZK_STARK_IMPLEMENTATION_PLAN.md 読み込み
4. ✅ COMPILER_WARNINGS_LOG.md 読み込み
5. ✅ CURRENT_PLAN.md 作成（このドキュメント）

### Step 2: 仕様作成（02_spec.md）
1. FRIVerifier SHA3-256移行の技術仕様書作成
2. 変更箇所の特定
3. テスト計画策定

### Step 3: 実装（03_impl.md）
1. FRIVerifier.sol修正
   - `import {SHA3_256} from "./libraries/SHA3_256.sol";` 追加
   - L191: `keccak256` → `SHA3_256.hash` 置換
2. forge build実行・警告ログ取得
3. テスト実行（423テスト ALL PASS確認）

### Step 4: レビュー（04_review.md）
1. PIRコードレビュー実施
2. CP-1準拠確認
3. CURRENT_STATE.md更新

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - **FIX-001で対応必須**（keccak256→SHA3-256）
- [x] CP-2: Self-Custody - 違反なし
- [x] CP-3: Time Lock存在 - 違反なし
- [x] CP-4: Slashing存在 - 違反なし
- [x] CP-5: 透明性 - 違反なし

---

## リスク・懸念事項

| # | リスク | 影響 | 対策 |
|---|--------|------|------|
| 1 | SHA3-256移行によるGas増加 | MEDIUM | ベースライン比較で許容範囲か確認 |
| 2 | FRI検証ロジックへの影響 | LOW | 既存テストで検証 |
| 3 | Active Checklist未作成 | MEDIUM | 本プラン完了後にCTOがタスク#1実施 |

---

## 承認状況

| 承認者 | 項目 | 状態 |
|--------|------|------|
| CTO | ZK-STARK実装計画 | ⬜ Pending |
| Cryptographer | 暗号学的正確性 | ⬜ Pending |
| CSO | セキュリティ方針 | ⬜ Pending |

---

## 次のアクション

**Immediate (この計画完了後)**:
1. → `02_spec.md` 実行でFRIVerifier修正仕様書作成
2. → FRIVerifier.sol keccak256箇所の特定・修正計画

**Week 1 Goals**:
- [ ] FRIVerifier SHA3-256移行完了
- [ ] Compiler Warnings全件ログ取得
- [ ] Phase 2 Active Checklist作成（CTO）
- [ ] 外部監査RFP準備開始（CSO）

---

**END OF CURRENT PLAN**
