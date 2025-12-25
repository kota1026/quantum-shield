# Current Plan

> **Generated**: 2025-12-26 00:45 JST  
> **Phase**: 2 - Security Council + Token  
> **Week**: 6  
> **Engineer Agent**: Active

---

## 対象チェックリスト

`docs/planning/PHASE2_CHECKLIST.md`

---

## 前回レビュー課題

> CURRENT_STATE.md より自動取得

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| 1 | 🟠 High | QuantumShield.sol keccak256使用 (ISSUE-001) | SEC-003で移行 |

---

## 今回のスコープ

### SEC-003: QuantumShield.sol keccak256 → SHA3_256 移行

**背景**: CP-1（完全量子耐性）において、keccak256は禁止アルゴリズムとして明記されている。QuantumShield.solには3箇所のkeccak256使用が残存しており、これを全てSHA3_256.hash()に移行する必要がある。

**影響範囲**: QuantumShield.sol 3関数

| 関数 | 行番号 | 現状 | 移行先 |
|------|--------|------|--------|
| `lock()` | ~193 | `keccak256(abi.encodePacked(...))` | `SHA3_256.hash(abi.encodePacked(...))` |
| `_verifyStarkProofInternal()` | ~358, ~368 | `keccak256(abi.encodePacked(...))` ×2 | `SHA3_256.hash(abi.encodePacked(...))` |
| `_hashPublicInputs()` | ~560 | `keccak256(abi.encodePacked(...))` | `SHA3_256.hash(abi.encodePacked(...))` |

---

### 修正項目（レビュー課題より）

- [ ] [FIX-015] `lock()` 関数の keccak256 → SHA3_256.hash() 移行
- [ ] [FIX-016] `_verifyStarkProofInternal()` 関数の keccak256 → SHA3_256.hash() 移行（2箇所）
- [ ] [FIX-017] `_hashPublicInputs()` 関数の keccak256 → SHA3_256.hash() 移行
- [ ] [FIX-018] SHA3_256ライブラリのインポート追加

### 実装項目

- [ ] [IMPL-SEC003-01] QuantumShield.sol への SHA3_256 インポート追加
- [ ] [IMPL-SEC003-02] lock() 関数の修正
- [ ] [IMPL-SEC003-03] _verifyStarkProofInternal() 関数の修正
- [ ] [IMPL-SEC003-04] _hashPublicInputs() 関数の修正
- [ ] [IMPL-SEC003-05] NatSpec コメント更新

### テスト項目

- [ ] [TEST-SEC003-01] 既存テストの実行・回帰確認
- [ ] [TEST-SEC003-02] lock() 関数のハッシュ整合性テスト
- [ ] [TEST-SEC003-03] releaseWithProof() 統合テスト
- [ ] [TEST-SEC003-04] _hashPublicInputs() 単体テスト
- [ ] [TEST-SEC003-05] Gas消費量ベンチマーク

---

### 参照ドキュメント

| 種別 | パス |
|------|------|
| 憲法 | `docs/constitution/CORE_PRINCIPLES.md` |
| SHA3_256実装 | `contracts/src/libraries/SHA3_256.sol` |
| 既存テスト | `contracts/test/QuantumShieldTest.t.sol` |
| Slitherレポート | `docs/aegis/security/SLITHER_REPORT_2025-12-25.md` |

---

## 成果物

| ファイル | 説明 |
|---------|------|
| `contracts/src/QuantumShield.sol` | keccak256 → SHA3_256 移行 |
| `contracts/test/security/SEC003Test.t.sol` | SEC-003専用テストスイート |
| `docs/planning/CURRENT_STATE.md` | 状態更新（SEC-003完了） |

---

## 実行順序

### Step 1: 事前確認
1. SHA3_256ライブラリの存在確認 (`contracts/src/libraries/SHA3_256.sol`)
2. 現行テストの全PASS確認 (`forge test`)
3. 現行Gasベースラインの記録

### Step 2: 実装
1. QuantumShield.sol に `import {SHA3_256} from "./libraries/SHA3_256.sol";` 追加
2. `lock()` 関数の修正
   - `keccak256(abi.encodePacked(...))` → `SHA3_256.hash(abi.encodePacked(...))`
3. `_verifyStarkProofInternal()` 関数の修正（2箇所）
   - proofBinding 計算
   - expectedBinding 計算
4. `_hashPublicInputs()` 関数の修正
5. NatSpecコメント更新（SEC-003対応記載）

### Step 3: テスト
1. 既存テストの回帰テスト実行
2. SEC-003専用テストケース作成
3. 全テストPASS確認
4. Gasベンチマーク比較

### Step 4: 静的解析
1. Slither実行
2. HIGH/MEDIUM 0件確認

### Step 5: 完了処理
1. CURRENT_STATE.md 更新
2. Git commit & push

---

## Core Principles確認

- [ ] CP-1: 完全量子耐性 - **対応中**（keccak256 → SHA3_256移行で解消）
- [ ] CP-2: Self-Custody - 違反なし
- [ ] CP-3: Time Lock存在 - 違反なし
- [ ] CP-4: Slashing存在 - 違反なし
- [ ] CP-5: 透明性 - 違反なし

---

## リスク・懸念事項

| # | リスク | 重要度 | 対策 |
|---|--------|--------|------|
| 1 | Gas消費増加 | MEDIUM | SHA3_256はkeccak256より高コスト。ベンチマーク実施で影響確認 |
| 2 | 既存ロックの互換性 | HIGH | lockId計算方法が変わるため、移行前のロックは解除不可になる可能性 |
| 3 | 証明システムとの整合性 | HIGH | 外部Proverが生成する証明も対応が必要 |

### 互換性に関する注意

**重要**: `lock()` 関数のハッシュアルゴリズム変更により、lockIdの計算方法が変わります。

- 既存ロック（移行前）: keccak256で計算されたlockId
- 新規ロック（移行後）: SHA3_256で計算されたlockId

**対策オプション**:
1. **Option A**: 既存ロックは全て解除済みであることを確認後に移行
2. **Option B**: 既存ロックの解除用にkeccak256ベースの関数を残す（非推奨：CP-1違反）
3. **Option C**: テストネット環境のため既存ロックは考慮不要

→ **推奨**: Option C（現在はテストネット/開発環境のため、互換性は考慮不要）

---

## 次のステップ

1. `02_spec.md` で仕様レビュー実施
2. `03_impl.md` で実装
3. `04_review.md` でセキュリティレビュー
4. `05_pir.md` で PIR-SEC-003 会議

---

**END OF CURRENT PLAN**
