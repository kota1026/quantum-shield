# 仕様レビュー結果

> **用途**: 02_spec.md → 03_impl.md への情報引継ぎ
> **更新タイミング**: 02_spec.md 完了時

---

## 日時

2025-01-01 01:00 JST

## 対象

CORE-002: SPHINCS+ Verifier統合（L3決議準拠に修正）

## 対象Sequence

| Sequence | 実装Layer | 仕様書準拠 |
|----------|----------|:----------:|
| #1 Lock | Core | ✅ |
| #2 Unlock (Normal) | Core | ✅ |
| #4 Challenge + Slashing | Core | ✅ |

## ステータス

✅ 仕様確認完了 - 実装に進んでください

---

## 発見・修正された重大な問題

### [ISSUE-001] L3決議とCURRENT_PLANの矛盾（解決済み）

- **リスクレベル**: 🔴 Critical
- **該当原則**: L3基盤決議（2025-12-28）
- **問題**: CURRENT_PLANがZK-STARK統合を予定していたが、L3決議ではZK-STARK不使用を決定済み
- **対策**: CURRENT_PLANを全面修正
- [x] 対応済み（2025-01-01 CEO承認）

### [ISSUE-002] ディレクトリ構造の不整合（解決済み）

- **リスクレベル**: 🟠 Medium
- **問題**: Solidityファイルがl3-aegis/配下に配置予定だったが、l3-aegisはRust専用
- **対策**: 成果物パスをcontracts/に修正
- [x] 対応済み

---

## CEO確認結果（2025-01-01）

| 質問 | 回答 |
|------|------|
| L3決議有効性 | **有効**（ZK-STARK不使用、SPHINCS+直接検証） |
| CORE-002 | **タスク内容の修正が必要** |
| Phase 2 STARKVerifier | **破棄** |

---

## 仕様書参照サマリー

| 要件 | 出典 | 確認結果 |
|------|------|:--------:|
| 24h Time Lock | SEQ#2 | ✅ |
| Quadratic Slashing | SEQ#4 | ✅ |
| SPHINCS+ 2/5検証 | SEQ#2 Step5 | ✅ |
| Dilithium署名検証 | SEQ#1, #2 | ✅ |
| SHA3-256ハッシュ | CP-1, FIPS 202 | ✅ |
| ZK-STARK不使用 | L3決議§1.1 | ✅ |

## L3基盤確認

| 確認項目 | 結果 |
|----------|:----:|
| 独自4ノードBFT | ✅ |
| l3-aegis範囲内 | ✅ |
| **ZK-STARK不使用** | ✅ |
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

## 次のアクション

1. `03_impl.md` で実装開始
2. Phase 2 STARKVerifier関連コードの削除から着手
3. ICoreVerifierインターフェース定義
4. CoreVerifier.sol（SPHINCS+検証）実装

---

**END OF SPEC REVIEW**
