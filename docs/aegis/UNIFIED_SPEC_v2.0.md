# Quantum Shield L3 - Unified Specification v2.0

> **Document Version**: 2.0  
> **Last Updated**: 2025-12-21  
> **Status**: CEO承認待ち  
> **Rounds Completed**: 8 (42 votes)

---

## Executive Summary

Quantum Shield L3は、量子コンピュータ時代に備えた世界初のNIST準拠量子耐性クロスチェーンブリッジである。本仕様書は、8ラウンドの設計会議と42項目の投票を経て策定された統合仕様を定義する。

### Core Principles (Immutable)

以下の原則は、ガバナンス投票によっても変更不可能な「憲法」として定義される：

| # | 原則 | 説明 |
|---|------|------|
| 1 | **完全量子耐性** | NIST準拠の量子耐性アルゴリズムのみ使用 |
| 2 | **Self-Custody** | ユーザーが自身の秘密鍵を管理 |
| 3 | **Time Lock存在** | Time Lockを0にすることは不可 |
| 4 | **Slashing存在** | Slashingメカニズムの削除は不可 |
| 5 | **透明性** | 全てオンチェーンで検証可能 |

---

## PROJECT AEGIS v1.0からの改善

v1.0で指摘された致命的問題とv2.0での対応：

| v1.0問題 | 説明 | v2.0対応 | 状態 |
|---------|------|---------|------|
| **Watchtower ECDSA矛盾** | 量子耐性を謳うのにECDSA使用 | SPHINCS+ 2/5署名（完全量子耐性） | ✅ 解決 |
| **L3正当性の未証明** | L1がL3の計算正確性を検証不可 | ZK Validity Proof（Phase 2導入） | ✅ 解決 |
| **経済設計の破綻** | Bond 0.1ETH vs TVL $100M | Stake $400K×5 = $2M + Quadratic Slashing | ✅ 解決 |

### Phase 1（Limited Beta）での制約

| 制約 | 理由 |
|------|------|
| TVL Cap $1M | L3正当性の未完全証明 |
| 24h Time Lock | 監視・Challenge時間の確保 |
| 5社Prover（内部3 + パートナー2） | 信頼できる主体のみ |
| US除外 | 法的リスク軽減 |
| 最低Unlock $10K | 小額攻撃の抑止 |

---

## Phase Overview

| Phase | 期間 | TVL Cap | 主要マイルストーン |
|-------|------|---------|------------------|
| 0.5 | Week 1-2 | - | STARK PoC完了 |
| 1 | Month 1-6 | $1M | Limited Beta開始 |
| 2 | Month 7-12 | $10M | Security Council + Token発行 |
| 3 | Month 13-18 | $50M | veQS投票開始 |
| 4 | Month 19-24 | 無制限 | 完全分散化 |

---

## Formal Verification (形式検証)

### LEAN4 形式検証

| 項目 | 状態 | 内容 |
|------|------|------|
| ファイル | `proofs/lean4/NTT.lean` | 8,469行 |
| 状態 | ✅ **完了** | no incomplete proofs |

**証明済み定理:**
- `Q_prime` - Q = 8380417 は素数
- `R_inv_exists` - R (2^32) は Q で可逆
- `montgomery_preserve_mod` - Montgomery変換は値を保存
- `montgomery_mul_comm/assoc` - Montgomery乗算の可換性・結合性
- `zeta_pow_512` - ζ^512 = 1（原始512乗根）
- `butterfly_sum/diff` - NTTバタフライ演算の特性

### Kani/Miri 静的検証

| ツール | 目的 | 状態 |
|--------|------|------|
| Kani Model Checker | バウンドモデル検査 | ✅ 全ハーネスPASS |
| Miri | 未定義動作の動的検出 | ✅ 全5テストPASS |

### Soundness Review Status

| 優先度 | 問題 | 状態 | 対応 |
|--------|------|------|------|
| 🔴 P0 | Norm bound masking | ✅ 修正済み | アーカイブ済みコード |
| 🔴 P0 | Empty public inputs | ✅ 修正済み | アーカイブ済みコード |
| 🟠 P1 | pubkey→sender binding | 🔄 Phase 1 | WBS 1.7.1 |
| 🟠 P1 | msg_hash verification | 🔄 Phase 1 | WBS 1.7.2 |

---

## Technical Specifications

### 暗号アルゴリズム

| 要素 | アルゴリズム | 標準 | 用途 |
|------|------------|------|------|
| User署名 | Dilithium-III | FIPS 204 | Unlock要求の認証 |
| Prover署名 | SPHINCS+-128s | FIPS 205 | Unlock承認（8KB/署名） |
| State Hash | SHA3-256 | FIPS 202 | 状態遷移の検証 |

### インフラストラクチャ

| コンポーネント | 仕様 |
|---------------|------|
| L3 Aegis | 4ノード分散（US/EU/Asia/予備） |
| コンセンサス | BFT（1障害耐性） |
| Prover Pool | 5社（QS 3社 + パートナー 2社） |
| Prover選出 | VRF（Chainlink） |
| 署名数 | 2/5 |

### セキュリティ

| 項目 | 設定 |
|------|------|
| Normal Time Lock | 24時間 |
| Emergency Time Lock | 7日 |
| Emergency Bond | MAX(0.5 ETH, amount × 5%) |
| Slashing | Quadratic: N² × 10% |
| 鍵管理 | HSM + 内部2-of-3マルチシグ |

---

## Token仕様 ($QS)

| 項目 | 内容 |
|------|------|
| 名称 | $QS (Quantum Shield) |
| 総供給量 | 1,000,000,000 |
| 用途 | Staking、手数料支払い、Delegation |
| 投票権 | Phase 3からveQS投票開始 |

### Token配分

| カテゴリ | 割合 |
|---------|------|
| Community | 40% |
| Team | 20% |
| Investors | 15% |
| Ecosystem | 15% |
| Treasury | 10% |

---

## Governance

### Security Council

| Phase | 構成 | 人数 |
|-------|------|------|
| Phase 2 | 財団3 + 外部3 | 6名 |
| Phase 3-4 | 財団3 + 外部3 + コミュニティ3 | 9名 |

### Purpose Committee

| 項目 | 内容 |
|------|------|
| 目的 | 不変原則（Core Principles）の保護 |
| 人数 | 3名 |
| 権限 | 理念違反の提案を却下 |

---

## Document References

- SEQUENCES_v2.0.md - シーケンス図詳細
- AGENT_MEETING_PROTOCOL_v3.2.md - エージェント会議プロトコル
- WBS.md - 作業分解構造
- TASK_MANAGEMENT.md - タスク管理

---

**END OF DOCUMENT**
