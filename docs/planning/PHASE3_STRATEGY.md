# Phase 3 Strategy Summary

> **承認日**: 2025-12-28
> **決議バージョン**: v3.0 (Final)
> **状態**: ✅ 発効済み

---

## 📋 決議サマリー

### 1. L3スタック選定

| 項目 | 決定 |
|------|------|
| **選択** | 独自L3 (l3-aegis) |
| **理由** | CP-1確実性、5年TCO優位、外部依存なし |
| **リスク** | 高（技術・セキュリティ・市場）→ 緩和策必須 |

### 2. アーキテクチャ

| 項目 | 決定 |
|------|------|
| **選択** | Full Modular / Pluggable Architecture |
| **構成** | Core Layer + Pluggable Governance + Pluggable Token |
| **理由** | 第三者譲渡対応、柔軟性確保 |

```
┌─────────────────────────────────────────┐
│ Pluggable Governance Layer [ON/OFF]     │
│ ├── OFF: Centralized / Multisig         │
│ └── ON:  Security Council + DAO         │
├─────────────────────────────────────────┤
│ Pluggable Token Layer [ON/OFF]          │
│ ├── OFF: No Token (ETH/USDC fees)       │
│ ├── ON (Basic): QS Token                │
│ └── ON (Full): veQS + Staking + Rewards │
├─────────────────────────────────────────┤
│ Core Layer [ALWAYS ON]                  │
│ ├── L3 Bridge (Quantum-Resistant)       │
│ ├── Sequencer                           │
│ ├── State Manager + STARK Verifier      │
│ └── CP-1〜CP-5 Protection (Immutable)   │
└─────────────────────────────────────────┘
```

---

## 🔗 L3基盤決定

> **決定日**: 2025-12-28  
> **決議記録**: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

### 技術選定結果

| 項目 | 決定 |
|------|------|
| L3構成 | 独自4ノードBFTチェーン |
| 実装 | l3-aegis (Rust) |
| 合意方式 | PBFT variant (f=1) |
| ZK-STARK | 使用しない（将来検討） |
| L1検証 | SPHINCS+直接検証 (~$25) |

### 決定の理由

1. **透明性(CP-5)**: 全操作がL3ブロックに記録される
2. **署名否認防止**: Prover署名がL3トランザクションとして記録
3. **量子耐性(CP-1)**: 独自構築で完全制御
4. **既存設計との整合**: SEQUENCES v2.0と完全一致

### 除外した選択肢とその理由

| 選択肢 | 除外理由 |
|--------|---------|
| Rollup + ZK-STARK | 透明性欠如、SPHINCS+ AIR化で証明時間数分 |
| Cosmos SDK | Go言語がl3-aegis(Rust)と不整合 |
| Substrate | CP-1改造が複雑 |
| SP1/Risc Zero | Sequencer構成で透明性欠如 |

### 6観点評価サマリー

| 観点 | 評価 |
|------|------|
| ①ZK必要か | 今は不要（将来検討） |
| ②独自基盤必要か | ✅ 必要（透明性確保） |
| ③証明時間 | ✅ 0秒（ZKなし） |
| ④ガス代 | ~$25（SPHINCS+直接検証） |
| ⑤開発コスト | ✅ 最小（既存設計流用） |
| ⑥量子耐性 | ✅ 完全（二重保護） |

### 次のアクション

1. L3詳細仕様の策定（`docs/aegis/L3_CHAIN_SPECIFICATION.md`）
2. l3-aegis実装の継続
3. Phase 4でZK-STARK再検討

---

## 🎯 Core Layer設計

| コンポーネント | 仕様 |
|--------------|------|
| **Bridge** | Challenge 7日、緊急停止、TVL上限$10M初期 |
| **Sequencer** | 3台冗長、強制包含24h、SLA 99.9% |
| **State** | SHA3-256、ZK-STARK、1000tx/batch、<10秒 |
| **DA** | Hybrid（Critical→L1、Bulk→Alt-DA option） |

---

## 💰 Token設計（Token Layer ON時）

| 項目 | 仕様 |
|------|------|
| **モデル** | veQS（1-4年ロック、最大4x倍率） |
| **供給** | 1B + インフレ（5%→1%） |
| **配分** | Community 40%, Treasury 25%, Team 18%, Investor 12%, Liquidity 5% |
| **投票権上限** | 5%/アドレス |

---

## 🏛️ Governance設計（Governance Layer ON時）

| 項目 | 仕様 |
|------|------|
| **Security Council** | 7名（3 Internal + 2 Expert + 2 Community） |
| **SC閾値** | 4/7（通常）、5/7（緊急）、6/7（重要） |
| **DAO提案** | 0.5% veQS閾値、4%定足数 |

---

## 🛡️ CP保護

| CP | 保護レベル | 説明 |
|----|-----------|------|
| CP-1 | ❌ Immutable | 量子耐性暗号（変更不可） |
| CP-2 | ❌ Immutable | Self-Custody（変更不可） |
| CP-3 | ⚠️ Supermajority | Time Lock（75% + 6/7 SC + 30日） |
| CP-4 | ⚠️ Supermajority | Slashing（75% + 6/7 SC + 30日） |
| CP-5 | ⚠️ Supermajority | 透明性（75% + 6/7 SC + 30日） |

---

## ⚠️ 必須リスク緩和策

| # | 緩和策 | 担当 |
|---|-------|------|
| 1 | 複数回セキュリティ監査（最低2回） | CSO |
| 2 | 段階的TVL上限（$10M→$50M→$100M→解除） | CTO |
| 3 | Bug Bounty Program | CSO |
| 4 | 形式検証（Core Layer、切替ロジック） | Crypto Auditor |
| 5 | 網羅的テスト（全モード組み合わせ） | QA |
| 6 | エコシステム構築計画 | CBO |

---

## 📅 Phase 3 スケジュール

| Phase | 期間 | 内容 |
|-------|------|------|
| **3.1** | Month 10-12 | Foundation（Core開発、Modular基盤） |
| **3.2** | Month 13-15 | Implementation（Bridge、Sequencer、Pluggable Layer） |
| **3.3** | Month 16-18 | Testing &amp; Launch（監査、Testnet） |

---

## 📁 関連ドキュメント

| ドキュメント | パス |
|------------|------|
| 最終決議書 | `agents/meetings/phase3_strategy/round8_final/FINAL_RESOLUTION_v3.md` |
| L3基盤決議 | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` |
| L3詳細仕様 | `docs/aegis/L3_CHAIN_SPECIFICATION.md` |
| Round 7分析 | `agents/meetings/phase3_strategy/round7_devils_advocate/analysis.md` |
| Round 6再審議 | `agents/meetings/phase3_strategy/round6_redeliberation/` |
| Round 1-5 | `agents/meetings/phase3_strategy/round1_reports/` ~ `round5_resolution/` |

---

## 🔗 プロンプト連携

このドキュメントは以下のプロンプトから参照されます：

| プロンプト | 参照目的 |
|-----------|---------|
| `01_plan.md` | Phase 3スコープ確認、CP準拠確認、L3基盤確認 |
| `02_spec.md` | アーキテクチャ仕様参照 |
| `03_impl.md` | Modular設計準拠確認 |
| `04_review.md` | CP保護レベル確認 |
| `07_gonogo.md` | リスク緩和策実施確認 |
