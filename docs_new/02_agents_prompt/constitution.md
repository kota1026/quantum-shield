# Quantum Shield Constitution Summary

> このファイルは全エージェントが参照する憲法サマリーです。
> 詳細: `docs/constitution/CORE_PRINCIPLES.md`

---

## Core Principles（不変原則）

| # | 原則 | 説明 | 違反例 |
|---|------|------|--------|
| **CP-1** | **完全量子耐性** | NIST準拠の量子耐性アルゴリズムのみ使用 | ECDSA使用、SHA-256使用、keccak256使用 |
| **CP-2** | **Self-Custody** | ユーザーが自身の秘密鍵を管理 | 秘密鍵のサーバー保管 |
| **CP-3** | **Time Lock存在** | Time Lockを0にすることは不可 | Time Lock無効化 |
| **CP-4** | **Slashing存在** | Slashingメカニズムの削除は不可 | Slashing機能削除 |
| **CP-5** | **透明性** | 全てオンチェーンで検証可能 | オフチェーン秘密計算 |

---

## 暗号学的要件

### 必須アルゴリズム

| 用途 | アルゴリズム | 標準 |
|------|------------|------|
| User署名 | **Dilithium-III** | FIPS 204 |
| Prover署名 | **SPHINCS+-128s** | FIPS 205 |
| State Hash | **SHA3-256** | FIPS 202 |
| ZK証明 | **ZK-STARK** | 128-bit security |

### 禁止アルゴリズム

❌ ECDSA, RSA, SHA-256, keccak256, secp256k1

---

## セキュリティパラメータ

| パラメータ | 値 | 変更可否 |
|-----------|-----|----------|
| Normal Time Lock | 24時間 | 短縮不可 |
| Emergency Time Lock | 7日 | 短縮不可 |
| Slashing Rate | N² × 10% | 削除不可 |

---

## エージェント遵守事項

**全ての提案・実装はCP-1〜CP-5に準拠していなければならない。**

1つでも違反がある場合、Purpose Guardianは拒否権を行使する。
