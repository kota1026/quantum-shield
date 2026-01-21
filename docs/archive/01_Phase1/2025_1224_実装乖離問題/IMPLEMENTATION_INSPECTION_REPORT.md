# Phase 0.5 / Phase 1 実装再点検レポート

> **Document Version**: 1.0  
> **Date**: 2025-12-22  
> **Inspector**: Claude (AI Assistant)  
> **Authority**: QUANTUM_SHIELD_UNIFIED_SPEC_v2.0, QUANTUM_SHIELD_SEQUENCES_v2.0

---

## 概要

本レポートは、承認された正規ドキュメントに基づき、既存実装の整合性を検証した結果である。

**重要な発見**: 旧ドキュメント（UNIFIED_SPEC_v2.0.md, SEQUENCES_v2.0.md）は正規ドキュメントから大幅に内容が削減されていた。

| ドキュメント | 正規版サイズ | 旧版サイズ | 削減率 |
|------------|------------|----------|-------|
| UNIFIED_SPEC | 15,286 bytes | 5,451 bytes | **64%削減** |
| SEQUENCES | 74,749 bytes | 7,517 bytes | **90%削減** |

---

## Phase 0.5: STARK PoC 検証結果

### ステータス: ✅ 正規仕様準拠

| 項目 | 正規仕様 | 実装 | 状態 |
|------|---------|------|------|
| 期間 | Week 1-2 | 完了 | ✅ |
| 目的 | Dilithium検証のSTARK化可能性検証 | SP1で実装 | ✅ |
| ツール | SP1 / Risc0 | SP1使用 | ✅ |
| 成功条件 | Dilithium署名検証がSTARK証明で動作 | 動作確認済み | ✅ |
| 判定 | GO/No-Go | GO決定 | ✅ |

---

## Phase 1: Foundation Bootstrap 検証結果

### 1. L1 Vault Contract (contracts/src/L1Vault.sol)

#### 1.1 定数・パラメータ

| 項目 | 正規仕様 | 実装値 | 状態 | 対応 |
|------|---------|-------|------|------|
| Normal Time Lock | 24時間 | 24 hours | ✅ | - |
| Emergency Time Lock | 7日 | 7 days | ✅ | - |
| Emergency Bond | MAX(0.5 ETH, amount × 5%) | 実装済み | ✅ | - |
| Required Signatures | 2/5 | 2/5 | ✅ | - |
| Total Provers | 5 | 5 | ✅ | - |
| TVL Cap | $1M (~400 ETH) | 400 ether | ✅ | - |

#### 1.2 重大な不整合

| # | 項目 | 正規仕様 | 実装 | 深刻度 | 対応必要 |
|---|------|---------|------|--------|---------|
| 1 | **State Hash** | SHA3-256 (FIPS 202) | keccak256 | 🔴致命的 | 要修正 |
| 2 | **SR_0計算式** | `SHA3-256("QS_LOCK_V1" \|\| ...)` | 独自形式 | 🔴致命的 | 要修正 |
| 3 | **SR_1計算式** | `SHA3-256("QS_UNLOCK_V1" \|\| ...)` | 未実装 | 🔴致命的 | 要実装 |
| 4 | **Challenge Bond** | MAX(0.1 ETH, amount × 1%) | MIN_EMERGENCY_BOND固定 | 🟠重大 | 要修正 |
| 5 | **Slashing配分** | 60/20/20 (Challenger/Insurance/Burn) | 30/50/20 | 🟠重大 | 要修正 |
| 6 | **Defense期限** | 48時間 | 未実装 | 🟠重大 | 要実装 |
| 7 | **SPHINCS+公開鍵** | SPHINCS+-128s (32 bytes) | 32 bytes | ✅ | - |
| 8 | **署名サイズ** | 8KB/署名 | 検証のみ | ⚠️確認 | 要確認 |

#### 1.3 Sequence対応状況

| Sequence | 正規仕様 | 実装状態 | 不足項目 |
|----------|---------|---------|---------|
| #1: Lock | 完全定義 | 部分実装 | SR_0計算式、domain separator |
| #2: Unlock (Normal) | 完全定義 | 部分実装 | SR_1計算式、VRF連携 |
| #3: Unlock (Emergency) | 完全定義 | 部分実装 | 72時間タイムアウト条件 |
| #3': Resync | 完全定義 | 未実装 | 全体 |
| #4: Challenge + Slashing | 完全定義 | 部分実装 | 48時間Defense、配分比率 |
| #5: Prover Registration | 完全定義 | 部分実装 | HSM検証、SLA同意 |
| #6: Prover Exit | 完全定義 | 未実装 | 全体 |

### 2. SparseMerkleTree Library

| 項目 | 正規仕様 | 実装 | 状態 |
|------|---------|------|------|
| Hash関数 | SHA3-256 (FIPS 202) | keccak256使用 | 🔴要修正 |
| Tree Depth | 指定なし | 20 | ⚠️確認必要 |
| Domain Separator | 要確認 | AEGIS_SMT_LEAF/NODE | ⚠️確認必要 |

### 3. L3 Aegis (aegis-consensus)

| 項目 | 正規仕様 | 実装 | 状態 |
|------|---------|------|------|
| ノード数 | 4ノード分散（US/EU/Asia/予備） | 4ノード | ✅ |
| コンセンサス | BFT（1障害耐性） | PBFT実装 | ✅ |
| VRF統合 | Chainlink | 未実装 | 🔴要実装 |
| 署名期限 | VRF後5分以内 | 未実装 | 🟠要実装 |

### 4. Prover System

| 項目 | 正規仕様 | 実装 | 状態 |
|------|---------|------|------|
| 構成 | QS 3社 + パートナー 2社 | 構造のみ | ⚠️運用準備 |
| Stake額 | $400K × 5社 | パラメータ化 | ⚠️確認必要 |
| 選出方式 | VRF: P(i) = Stake_i / Σ Stake | 未実装 | 🔴要実装 |
| HSM + 2-of-3マルチシグ | 必須 | 検証ロジックなし | 🟠要実装 |

---

## 不整合の根本原因分析

### 特定された問題

1. **ドキュメント改竄**: 正規仕様から約65-90%の内容が削除された旧ドキュメントに基づいて実装が進められていた

2. **仕様解釈の逸脱**: 明確に定義されたSR_0/SR_1計算式が無視され、独自形式で実装

3. **ハッシュ関数の誤り**: FIPS 202準拠のSHA3-256ではなくkeccak256を使用（類似だが異なる）

4. **報酬配分の改変**: 正規仕様の60/20/20が30/50/20に変更

---

## 修正必要項目一覧

### 🔴 致命的（即時対応必要）

| # | ファイル | 項目 | 対応内容 |
|---|---------|------|---------|
| 1 | L1Vault.sol | State Hash | keccak256 → SHA3-256 |
| 2 | L1Vault.sol | SR_0計算 | 正規仕様の計算式に変更 |
| 3 | L1Vault.sol | SR_1計算 | 正規仕様の計算式を実装 |
| 4 | SparseMerkleTree.sol | Hash関数 | keccak256 → SHA3-256 |
| 5 | aegis-consensus | VRF統合 | Chainlink VRF実装 |

### 🟠 重大（優先対応必要）

| # | ファイル | 項目 | 対応内容 |
|---|---------|------|---------|
| 6 | L1Vault.sol | Challenge Bond | MAX(0.1 ETH, amount × 1%) |
| 7 | L1Vault.sol | Slashing配分 | 60/20/20に修正 |
| 8 | L1Vault.sol | Defense期限 | 48時間実装 |
| 9 | L3 Aegis | Prover Exit | Sequence #6実装 |
| 10 | L3 Aegis | Resync | Sequence #3'実装 |

### 🟡 中程度（計画的対応）

| # | 項目 | 対応内容 |
|---|------|---------|
| 11 | HSM検証 | Prover登録時のHSM使用証明 |
| 12 | 署名期限 | VRF後5分タイムアウト |
| 13 | 72時間Emergency | Prover応答なし検知 |

---

## 推奨対応計画

### Phase 1: 緊急修正（1週間）

1. SHA3-256への移行
2. SR_0/SR_1計算式の実装
3. Slashing配分の修正

### Phase 2: 重要機能追加（2週間）

1. VRF統合（Chainlink）
2. Prover Exit実装
3. Resync実装

### Phase 3: 品質保証（1週間）

1. 正規仕様との完全照合テスト
2. Sequence #1-#6の統合テスト
3. 監査準備

---

## 結論

既存実装は正規仕様から**重大な逸脱**が複数存在する。これは旧ドキュメントの内容削減に起因すると推定される。

**即時対応が必要な項目**: 5件（致命的）
**優先対応が必要な項目**: 5件（重大）
**計画的対応項目**: 3件（中程度）

本レポートに基づき、修正計画を策定し実行することを強く推奨する。

---

**END OF DOCUMENT**
