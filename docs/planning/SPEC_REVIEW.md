# 仕様レビュー結果

> **用途**: 02_spec.md → 03_impl.md への情報引継ぎ
> **更新タイミング**: 02_spec.md 完了時

---

## 日時

2025-01-01 01:30 JST

## 対象

CORE-002: SPHINCS+ Verifier統合（L3決議準拠に修正）

## 対象Sequence

| Sequence | 実装Layer | 仕様書準拠 | 確認内容 |
|----------|----------|:----------:|----------|
| #1 Lock | Core | ✅ | Dilithium署名検証 |
| #2 Unlock (Normal) | Core | ✅ | SPHINCS+ 2/5署名検証 |
| #4 Challenge + Slashing | Core | ✅ | Quadratic Slashing計算 |

## ステータス

✅ **仕様確認完了 - 実装に進んでください**

---

## 仕様書横断確認結果

### 確認したドキュメント

| ドキュメント | 確認結果 |
|-------------|---------|
| CORE_PRINCIPLES.md (v1.1) | ✅ 更新済み |
| SEQUENCES v2.0 | ✅ SPHINCS+ベース確認 |
| UNIFIED_SPEC v2.0 | ✅ Phase 1暗号要件確認 |
| L3_INFRASTRUCTURE_FINAL_DECISION | ✅ ZK-STARK不使用確認 |

### ZK-STARKの位置づけ（全ドキュメント整合）

| 観点 | 評価 | 結論 |
|------|------|------|
| **量子耐性（CP-1）** | ✅ 準拠 | ハッシュベース、楕円曲線不使用 |
| **経済条件** | ❌ 課題あり | SPHINCS+ AIR化に数分 |
| **UX** | ❌ 課題あり | 証明生成待ち時間 |
| **透明性（CP-5）** | ⚠️ トレードオフ | Rollup構成が必要 |

**結論**: ZK-STARKは「許可アルゴリズム」として段階導入。Phase 1-2では使用しない。

---

## 発見・修正された問題

### [ISSUE-001] L3決議とCURRENT_PLANの矛盾（解決済み）

- **リスクレベル**: 🔴 Critical
- **問題**: CURRENT_PLANがZK-STARK統合を予定
- **対策**: CURRENT_PLANを全面修正
- [x] 対応済み（2025-01-01 CEO承認）

### [ISSUE-002] ディレクトリ構造の不整合（解決済み）

- **リスクレベル**: 🟠 Medium
- **問題**: Solidityファイルがl3-aegis/配下に配置予定
- **対策**: 成果物パスをcontracts/に修正
- [x] 対応済み

### [ISSUE-003] CORE_PRINCIPLESとL3決議の矛盾（解決済み）

- **リスクレベル**: 🔴 Critical
- **問題**: CORE_PRINCIPLESでZK-STARKが「必須」、L3決議で「不使用」
- **対策**: CORE_PRINCIPLES v1.1で再分類
  - 必須 → 許可アルゴリズム（量子耐性は満たすが経済条件・UXで段階導入）
- [x] 対応済み（2025-01-01 CEO承認）

---

## CEO確認結果（2025-01-01）

| 質問 | 回答 |
|------|------|
| L3決議有効性 | **有効**（ZK-STARK不使用、SPHINCS+直接検証） |
| CORE-002 | **タスク内容の修正が必要** |
| Phase 2 STARKVerifier | **破棄** |
| ZK-STARK分類 | **許可アルゴリズム**（量子耐性OK、経済条件・UXで段階導入） |

---

## SEQUENCES v2.0 確認結果

| Sequence | 使用アルゴリズム | ZK-STARK | 確認 |
|----------|----------------|:--------:|:----:|
| #1 Lock | Dilithium署名検証 | ❌ | ✅ |
| #2 Unlock | SPHINCS+ 2/5署名検証 | ❌ | ✅ |
| #3 Emergency | 署名なし（Bond） | ❌ | ✅ |
| #4 Challenge | Quadratic Slashing | ❌ | ✅ |

**→ SEQUENCESは完全にSPHINCS+ベースで設計されており、Phase 1-2でZK-STARKは不要**

---

## 仕様書参照サマリー

| 要件 | 出典 | 確認結果 |
|------|------|:--------:|
| 24h Time Lock | SEQ#2 Step8 | ✅ |
| Quadratic Slashing N²×10% | SEQ#4 | ✅ |
| SPHINCS+ 2/5検証 | SEQ#2 Step5 | ✅ |
| Dilithium署名検証 | SEQ#1, #2 | ✅ |
| SHA3-256ハッシュ | CP-1, FIPS 202 | ✅ |
| ZK-STARK不使用（Phase 1-2） | L3決議, UNIFIED_SPEC | ✅ |

## L3基盤確認

| 確認項目 | 結果 |
|----------|:----:|
| 独自4ノードBFT | ✅ |
| l3-aegis範囲内 | ✅ |
| ZK-STARK不使用 | ✅ |
| SEQUENCES準拠 | ✅ |

---

## 実装時の注意事項

### 必須

1. **Phase 2 STARKVerifier関連コードは完全に削除すること**
   - STARKVerifier.sol
   - FRIVerifier.sol
   - BatchVerifier.sol（STARK用）
   - 関連テストファイル

2. **CP-1準拠確認**
   - keccak256使用禁止
   - SHA-256使用禁止
   - ECDSA使用禁止

3. **ディレクトリ構造**
   - Solidityコントラクト → `contracts/`
   - Rust L3実装 → `l3-aegis/`

### ガスターゲット

| 操作 | ターゲット |
|------|-----------|
| SPHINCS+検証×1 | ~200K gas |
| SPHINCS+検証×2 (2/5) | ~400K gas |
| 総Unlockコスト | ~$25 |

---

## 更新されたファイル

| ファイル | Commit | 内容 |
|---------|--------|------|
| `docs/planning/CURRENT_PLAN.md` | dac884b | STARK→SPHINCS+に変更 |
| `docs/planning/SPEC_REVIEW.md` | f41abfd → 本更新 | 仕様確認結果 |
| `docs/constitution/CORE_PRINCIPLES.md` | 4f503ba | ZK-STARK再分類 |

---

## 次のアクション

1. `03_impl.md` で実装開始
2. Phase 2 STARKVerifier関連コードの削除から着手
3. ICoreVerifierインターフェース定義
4. CoreVerifier.sol（SPHINCS+検証）実装

---

**END OF SPEC REVIEW**
