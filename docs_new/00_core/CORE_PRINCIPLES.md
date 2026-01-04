# Quantum Shield - Core Principles（憲法）

> **Version**: 1.1  
> **Status**: IMMUTABLE（ガバナンス投票によっても変更不可）  
> **Last Updated**: 2025-01-01
> **Change Log**: v1.1 - ZK-STARKを「許可アルゴリズム」に再分類（量子耐性は満たすが経済条件・UXで段階導入）

---

## 🛡️ このドキュメントについて

このドキュメントはQuantum Shield L3の**不変の原則（憲法）**を定義します。  
これらの原則は、いかなるガバナンス投票によっても変更することはできません。

**全エージェントは、タスク実行前にこのドキュメントを読み込み、  
すべての実装・判断がこれらの原則に準拠していることを確認する義務があります。**

---

## 📜 Core Principles（不変原則）

| # | 原則 | 説明 | 違反例 |
|---|------|------|--------|
| **CP-1** | **完全量子耐性** | NIST準拠の量子耐性アルゴリズムのみ使用 | ECDSA使用、SHA-256使用 |
| **CP-2** | **Self-Custody** | ユーザーが自身の秘密鍵を管理 | 秘密鍵のサーバー保管 |
| **CP-3** | **Time Lock存在** | Time Lockを0にすることは不可 | Time Lock無効化 |
| **CP-4** | **Slashing存在** | Slashingメカニズムの削除は不可 | Slashing機能削除 |
| **CP-5** | **透明性** | 全てオンチェーンで検証可能 | オフチェーン秘密計算 |

---

## 🔐 暗号学的要件（Cryptographic Requirements）

### 必須アルゴリズム（常時使用）

| 用途 | アルゴリズム | 標準 | パラメータ |
|------|------------|------|------------|
| User署名 | **Dilithium-III** | FIPS 204 | Level 3 |
| Prover署名 | **SPHINCS+-128s** | FIPS 205 | 8KB/署名 |
| State Hash | **SHA3-256** | FIPS 202 | 256-bit |

### 許可アルゴリズム（量子耐性、段階導入）

以下のアルゴリズムはCP-1（量子耐性）を満たすが、経済条件・UXの観点から段階的に導入する。

| 用途 | アルゴリズム | 量子耐性 | 導入条件 |
|------|------------|:-------:|----------|
| ZK証明 | **ZK-STARK** | ✅ | 証明生成時間・ガスコスト・透明性が改善した場合 |

> **Note**: ZK-STARKはハッシュベースであり楕円曲線に依存しないため、量子耐性を持つ。
> 現時点では SPHINCS+ AIR化に数分かかる問題があり、Phase 1-2では使用しない。
> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

### 禁止アルゴリズム（量子脆弱）

❌ 以下のアルゴリズムは**絶対に使用禁止**：

| アルゴリズム | 禁止理由 |
|-------------|---------|
| ECDSA | 量子脆弱（Shor攻撃） |
| RSA | 量子脆弱（Shor攻撃） |
| secp256k1 | 量子脆弱（楕円曲線） |
| SHA-256 / SHA-2ファミリー | Grover攻撃リスク |
| keccak256 | SHA3-256を使用すること |

---

## ⏰ セキュリティパラメータ（固定値）

| パラメータ | 値 | 変更可否 |
|-----------|-----|----------|
| Normal Time Lock | 24時間 | ⚠️ 短縮は不可、延長のみ可 |
| Emergency Time Lock | 7日 | ⚠️ 短縮は不可 |
| Emergency Bond | MAX(0.5 ETH, amount × 5%) | ✅ 調整可 |
| Challenge Bond | MAX(0.1 ETH, amount × 1%) | ✅ 調整可 |
| Defense Period | 48時間 | ⚠️ 短縮は不可 |
| Slashing Rate | N² × 10% (Quadratic) | ❌ 削除不可 |

---

## 🗳️ ガバナンス制約

### 変更不可能な項目

以下の項目は、いかなる投票でも変更できません：

1. Core Principles (CP-1 〜 CP-5)
2. 量子耐性アルゴリズムの必須使用
3. Time Lock / Slashingの存在（削除不可）
4. Self-Custodyの原則

### 変更可能な項目（Token Vote必須）

| 項目 | 必要Quorum | Time Lock |
|------|-----------|----------|
| パラメータ調整（Bond額等） | 4% | 7日 |
| コントラクトアップグレード | 8% | 7日 |
| Council メンバー変更 | 15% | 7日 |

---

## ✅ エージェント確認チェックリスト

タスク実行前に以下を確認してください：

```
□ 実装がCP-1〜CP-5に準拠しているか？
□ 使用するアルゴリズムが「必須」または「許可」リストに含まれるか？
□ 禁止アルゴリズムを使用していないか？
□ Time Lock / Slashingを無効化していないか？
□ ユーザーの秘密鍵をサーバーに保存していないか？
```

**1つでも「いいえ」がある場合、実装を中止し、PIR会議で審議してください。**

---

## 📚 参照ドキュメント

| ドキュメント | パス | 用途 |
|-------------|------|------|
| シーケンスカタログ | `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | フロー参照 |
| 統合仕様書 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | 詳細仕様 |
| L3基盤決議 | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` | ZK-STARK不使用の根拠 |
| 開発計画書 | `docs/planning/DEVELOPMENT_PLAN_v1.0.md` | スケジュール |

---

**END OF CONSTITUTION**
