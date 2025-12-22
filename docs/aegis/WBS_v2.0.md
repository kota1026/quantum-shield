# Project Aegis - Work Breakdown Structure (WBS) v2.0

> **Version**: 2.0 (CORRECTED)  
> **Last Updated**: 2025-12-22  
> **Project Duration**: 24 months  
> **NOTICE**: 本WBSは正規ドキュメント（QUANTUM_SHIELD_*）に基づき再作成
> **正規ドキュメント**:  
> - QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md  
> - QUANTUM_SHIELD_SEQUENCES_v2.0.md  
> - AGENT_MEETING_PROTOCOL_v3.2.md

---

## 重要な変更履歴

| Date | 変更内容 |
|------|---------|
| 2025-12-22 | 旧WBSが承認されていないドキュメントに基づいていたため全面改訂 |
| 2025-12-22 | 正規ドキュメント（QUANTUM_SHIELD_*）に基づき再作成 |

---

## Overview

```
Project Aegis
├── 0. Phase 0.5: STARK PoC (Week 1-2) ✅ COMPLETE
├── 1. Phase 1: Foundation Bootstrap (Month 1-6) 🔄 REQUIRES REVIEW
│   ├── 1.1 Smart Contract Development
│   ├── 1.2 L3 Aegis Development
│   ├── 1.3 Prover System
│   ├── 1.4 Security Infrastructure
│   └── 1.5 Monitoring & Operations
├── 2. Phase 2: Security Council + Token (Month 7-12)
├── 3. Phase 3: Token Governance (Month 13-18)
├── 4. Phase 4: Full Decentralization (Month 19-24)
└── 5. Cross-Phase Activities (Continuous)
```

---

## Phase 0.5: STARK PoC ✅ COMPLETE

**Duration**: Week 1-2  
**Status**: ✅ COMPLETE  
**Decision**: GO - Proceed to Phase 1

| ID | Task | Status |
|----|------|--------|
| 0.5.1 | SP1環境構築 | ✅ Complete |
| 0.5.2 | Dilithium署名検証ロジック実装 | ✅ Complete |
| 0.5.3 | STARK証明生成テスト | ✅ Complete |
| 0.5.4 | ベンチマーク測定 | ✅ Complete |
| 0.5.5 | 結果分析・レポート作成 | ✅ Complete |
| 0.5.6 | Go/No-Go判定 | ✅ GO決定 |

---

## Phase 1: Foundation Bootstrap 🔄 REQUIRES REVIEW

**Duration**: Month 1-6  
**TVL Cap**: $1M  
**Status**: 実施内容の正規仕様との整合性確認が必要

### 1.1 Smart Contract Development

**正規仕様要件（QUANTUM_SHIELD_UNIFIED_SPEC_v2.0）**:

| 項目 | 仕様 |
|------|------|
| User署名 | Dilithium-III (FIPS 204) |
| Prover署名 | SPHINCS+-128s (FIPS 205, 8KB/署名) |
| State Hash | SHA3-256 (FIPS 202) |
| Normal Time Lock | 24時間 |
| Emergency Time Lock | 7日 |
| Emergency Bond | MAX(0.5 ETH, amount × 5%) |
| Slashing | Quadratic: N² × 10% |

| ID | Task | 仕様準拠 | Status | Notes |
|----|------|---------|--------|-------|
| 1.1.1 | L1 Vault Contract設計 | ⚠️要確認 | 完了 | 正規仕様との整合性確認必要 |
| 1.1.2 | L1 Vault Contract実装 | ⚠️要確認 | 完了 | 正規仕様との整合性確認必要 |
| 1.1.3 | SPHINCS+検証コントラクト | ⚠️要確認 | 完了 | 8KB署名対応確認 |
| 1.1.4 | SMT検証ロジック | ⚠️要確認 | 完了 | SHA3-256使用確認 |
| 1.1.5 | Time Lock機構 | ⚠️要確認 | 完了 | 24h/7d対応確認 |
| 1.1.6 | Emergency Path実装 | ⚠️要確認 | 完了 | Bond計算確認 |
| 1.1.7 | Challenge/Slashing実装 | ⚠️要確認 | 完了 | Quadratic Slashing確認 |
| 1.1.8 | 単体テスト | ⚠️要確認 | 完了 | 仕様カバレッジ確認 |
| 1.1.9 | 統合テスト | ⚠️要確認 | 完了 | E2Eシナリオ確認 |

### 1.2 L3 Aegis Development

**正規仕様要件（QUANTUM_SHIELD_UNIFIED_SPEC_v2.0）**:

| 項目 | 仕様 |
|------|------|
| ノード数 | 4ノード分散（US/EU/Asia/予備） |
| コンセンサス | BFT（1障害耐性） |
| Prover Pool | 5社（QS 3社 + パートナー 2社） |
| Prover選出 | VRF（Chainlink） |
| 署名数 | 2/5 |
| 署名期限 | VRF後5分以内 |

| ID | Task | 仕様準拠 | Status | Notes |
|----|------|---------|--------|-------|
| 1.2.1 | L3ノードアーキテクチャ設計 | ⚠️要確認 | 完了 | 4ノード構成確認 |
| 1.2.2 | BFTコンセンサス実装 | ⚠️要確認 | 完了 | 1障害耐性確認 |
| 1.2.3 | Dilithium検証モジュール | ⚠️要確認 | 完了 | FIPS 204準拠確認 |
| 1.2.4 | SMT管理モジュール | ⚠️要確認 | 完了 | SHA3-256確認 |
| 1.2.5 | VRF統合（Chainlink） | - | 未着手 | |
| 1.2.6 | Prover通信プロトコル | - | 未着手 | 5分タイムアウト |
| 1.2.7 | L1同期モジュール | - | 未着手 | Event監視 |
| 1.2.8 | 4ノード分散設定 | - | 未着手 | 地理分散 |

### 1.3 Prover System

**正規仕様要件（QUANTUM_SHIELD_UNIFIED_SPEC_v2.0）**:

| 項目 | 仕様 |
|------|------|
| 構成 | QS財団 3社 + 戦略パートナー 2社 |
| Stake通貨 | ETH |
| Stake額 | $400K × 5社 = $2M |
| 選出方式 | VRF: P(i) = Stake_i / Σ Stake |
| 署名期限 | VRF後5分以内 |
| 鍵管理 | HSM + 内部2-of-3マルチシグ |

| ID | Task | Status | Notes |
|----|------|--------|-------|
| 1.3.1 | Prover要件定義 | ⬜ | 正規仕様に準拠 |
| 1.3.2 | HSM統合仕様 | ⬜ | 2-of-3必須 |
| 1.3.3 | SPHINCS+署名モジュール | ⬜ | 8KB署名 |
| 1.3.4 | VRF選出ロジック | ⬜ | Stake比例 |
| 1.3.5 | Prover登録/退出フロー | ⬜ | Sequence #5, #6 |
| 1.3.6 | 内部Prover 3社セットアップ | ⬜ | |
| 1.3.7 | パートナー2社交渉 | ⬜ | |
| 1.3.8 | 5分タイムアウト実装 | ⬜ | |

### 1.4 Security Infrastructure

**正規仕様要件（QUANTUM_SHIELD_SEQUENCES_v2.0）**:

| 項目 | 仕様 |
|------|------|
| Challenge Bond | MAX(0.1 ETH, amount × 1%) |
| Defense期限 | 48時間 |
| Slashing配分 | Challenger 60%, Insurance 20%, Burn 20% |
| Emergency Path発動 | 72時間Prover応答なし |

| ID | Task | Status | Notes |
|----|------|--------|-------|
| 1.4.1 | 監視ボット実装 | ⬜ | Sequence #4参照 |
| 1.4.2 | Challenge検証ロジック | ⬜ | 48h Defense |
| 1.4.3 | Quadratic Slashing実装 | ⬜ | N² × 10% |
| 1.4.4 | 報酬配分ロジック | ⬜ | 60/20/20 |
| 1.4.5 | 72時間Emergency Path | ⬜ | Sequence #3 |
| 1.4.6 | Whistleblower報奨金 | ⬜ | $100K |

### 1.5 Monitoring & Operations

**正規仕様要件（QUANTUM_SHIELD_UNIFIED_SPEC_v2.0）**:

| 項目 | 仕様 |
|------|------|
| 公式監視ボット | QS運営 |
| 外部監視者 | グラント支援 |
| Whistleblower | 報奨金$100K |
| 月次監査 | 第三者監査会社 |
| 透明性 | 週次レポート公開 |

| ID | Task | Status | Notes |
|----|------|--------|-------|
| 1.5.1 | 監視ダッシュボード | ⬜ | |
| 1.5.2 | アラートシステム | ⬜ | |
| 1.5.3 | 週次レポート自動化 | ⬜ | |
| 1.5.4 | 監査準備 | ⬜ | |

---

## Phase 1 シーケンス対応表

**正規シーケンス（QUANTUM_SHIELD_SEQUENCES_v2.0）との対応**:

| Sequence | 対応タスク | 実装状態 |
|----------|-----------|---------|
| #1: Lock | 1.1.2, 1.2.1 | ⚠️要確認 |
| #2: Unlock (Normal) | 1.1.2, 1.2.x, 1.3.x | ⚠️要確認 |
| #3: Unlock (Emergency) | 1.1.6, 1.4.5 | ⚠️要確認 |
| #3': Resync | 1.2.7 | 未着手 |
| #4: Challenge + Slashing | 1.1.7, 1.4.x | ⚠️要確認 |
| #5: Prover Registration | 1.3.5 | 未着手 |
| #6: Prover Exit | 1.3.5 | 未着手 |

---

## 経済モデル（Phase 1）

**正規仕様（QUANTUM_SHIELD_UNIFIED_SPEC_v2.0）**:

| 項目 | 設定 |
|------|------|
| 手数料率 | 0.05%（最低$10） |
| Lock Gas | ~135K gas (~$7) |
| Unlock Gas | ~490K gas (~$27) |
| 往復コスト | ~$34 + 手数料 |

**手数料配分**:

| 配分先 | 割合 |
|--------|------|
| Prover報酬 | 50% |
| Treasury | 40% |
| Insurance | 10% |

---

## Milestone Summary

| Milestone | Target | 正規仕様対応 | Status |
|-----------|--------|------------|--------|
| M0.5 | Week 2 | - | ✅ Complete |
| M1.1 | Month 2 | Phase 1技術仕様 | ⚠️要確認 |
| M1.2 | Month 4 | 8 Sequences対応 | 未確認 |
| M1.3 | Month 5 | Prover稼働 | 未着手 |
| M1.4 | Month 6 | Limited Beta | 未着手 |

---

## 次のアクション

1. **即時**: 既存実装と正規仕様の整合性確認（②で実施）
2. **即時**: 不整合の特定と修正計画
3. **優先**: Sequence #1-#6の完全実装
4. **優先**: Prover System構築

---

**END OF DOCUMENT**
