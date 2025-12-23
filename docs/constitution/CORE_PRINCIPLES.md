# Quantum Shield - Core Principles（憲法）

> **Version**: 1.0  
> **Status**: IMMUTABLE（ガバナンス投票によっても変更不可）  
> **Last Updated**: 2025-12-23

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

### 必須アルゴリズム

| 用途 | アルゴリズム | 標準 | パラメータ |
|------|------------|------|------------|
| User署名 | **Dilithium-III** | FIPS 204 | Level 3 |
| Prover署名 | **SPHINCS+-128s** | FIPS 205 | 8KB/署名 |
| State Hash | **SHA3-256** | FIPS 202 | 256-bit |
| ZK証明 | **ZK-STARK** | - | 128-bit security |

### 禁止事項

❌ 以下のアルゴリズムは**絶対に使用禁止**：
- ECDSA（量子脆弱）
- RSA（量子脆弱）
- SHA-256 / SHA-2ファミリー（Grover攻撃リスク）
- keccak256（SHA3-256を使用すること）
- secp256k1（量子脆弱）

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
□ 使用するアルゴリズムがNIST準拠か？
□ 禁止アルゴリズムを使用していないか？
□ Time Lock / Slashingを無効化していないか？
□ ユーザーの秘密鍵をサーバーに保存していないか？
```

**1つでも「いいえ」がある場合、実装を中止し、PIR会議で審議してください。**

---

## 📚 参照ドキュメント

| ドキュメント | パス | 用途 |
|-------------|------|------|
| シーケンスカタログ | `docs/constitution/QUANTUM_SHIELD_SEQUENCES_v2.0_REF.md` | フロー参照 |
| 統合仕様書 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | 詳細仕様 |
| 開発計画書 | `docs/planning/DEVELOPMENT_PLAN_v1.0.md` | スケジュール |

---

**END OF CONSTITUTION**
