# Phase 2 Active Checklist

> **Version**: 1.0  
> **Created**: 2025-12-26 JST  
> **Phase**: 2 - Security Council + Token  
> **Period**: Month 7-12 (6 months)  
> **Status**: 🔄 IN PROGRESS

---

## 📋 チェックリスト概要

| Phase | 期間 | 進捗 | Status |
|-------|------|------|--------|
| Phase 2.1 | Week 1-4 (Month 7) | 30% | 🔄 IN PROGRESS |
| Phase 2.2 | Week 5-8 (Month 8) | 0% | ⬜ NOT STARTED |
| Phase 2.3 | Week 9-12 (Month 9) | 0% | ⬜ NOT STARTED |
| Phase 2.4 | Week 13-16 (Month 10) | 0% | ⬜ NOT STARTED |
| Phase 2.5 | Week 17-20 (Month 11) | 0% | ⬜ NOT STARTED |
| Phase 2.6 | Week 21-24 (Month 12) | 0% | ⬜ NOT STARTED |

---

## Phase 2.1: Foundation (Week 1-4 / Month 7)

### Week 1: 環境整備 & 計画策定

| # | タスク | 担当 | Status | 備考 |
|---|--------|------|--------|------|
| 2.1.1 | Phase 2 Active Checklist作成 | CTO | ✅ | 本ドキュメント |
| 2.1.2 | ZK-STARK実装計画策定 | Engineer + Cryptographer | ✅ | ZK_STARK_IMPLEMENTATION_PLAN.md |
| 2.1.3 | Gasベースライン取得 | Engineer | ✅ | GAS_BASELINE_P2.md |
| 2.1.4 | FRIVerifier SHA3-256移行 | Engineer | ✅ | PIR-P2-001 PASS |
| 2.1.5 | Compiler Warnings棚卸し | Engineer | ✅ | COMPILER_WARNINGS_LOG.md |
| 2.1.6 | 外部監査RFP草案 | CSO | ✅ | AUDIT_RFP_DRAFT.md |

### Week 2: 基盤コンポーネント開発

| # | タスク | 担当 | Status | 備考 |
|---|--------|------|--------|------|
| 2.1.7 | SHA3Hasher.sol作成 | Engineer | ⬜ | ラッパーコントラクト |
| 2.1.8 | SHA3Hasher単体テスト | QA | ⬜ | 100% coverage |
| 2.1.9 | ProofCodec.sol基本構造 | Engineer | ⬜ | エンコード/デコード |
| 2.1.10 | ドキュメント整備 | Engineer | ⬜ | NatSpec追加 |

### Week 3-4: 統合準備

| # | タスク | 担当 | Status | 備考 |
|---|--------|------|--------|------|
| 2.1.11 | ProofCodec.sol完成 | Engineer | ⬜ | - |
| 2.1.12 | ProofCodec単体テスト | QA | ⬜ | 100% coverage |
| 2.1.13 | FRIVerifier統合テスト | QA | ⬜ | SHA3使用確認 |
| 2.1.14 | Phase 2.1 PIR | CSO | ⬜ | セキュリティレビュー |

---

## Phase 2.2: Core Implementation (Week 5-8 / Month 8)

### Week 5-6: STARKVerifier基本構造

| # | タスク | 担当 | Status | 備考 |
|---|--------|------|--------|------|
| 2.2.1 | STARKVerifier.sol v0.1 | Engineer | ⬜ | 基本構造 |
| 2.2.2 | トレース検証実装 | Engineer | ⬜ | Trace verification |
| 2.2.3 | 単体テスト作成 | QA | ⬜ | - |
| 2.2.4 | テストネット環境構築 | DevOps | ⬜ | Sepolia |

### Week 7-8: 制約システム実装

| # | タスク | 担当 | Status | 備考 |
|---|--------|------|--------|------|
| 2.2.5 | 制約システム設計 | Cryptographer | ⬜ | AIR設計 |
| 2.2.6 | 制約システム実装 | Engineer | ⬜ | - |
| 2.2.7 | 統合テスト | QA | ⬜ | - |
| 2.2.8 | Phase 2.2 PIR | CSO | ⬜ | - |

---

## Phase 2.3: Optimization (Week 9-12 / Month 9)

### Week 9-10: Gas最適化

| # | タスク | 担当 | Status | 備考 |
|---|--------|------|--------|------|
| 2.3.1 | Batch verification実装 | Engineer | ⬜ | 40-60%削減目標 |
| 2.3.2 | Proof compression | Engineer | ⬜ | 20-30%削減目標 |
| 2.3.3 | Assembly最適化 | Engineer | ⬜ | 10-20%削減目標 |
| 2.3.4 | Gasベンチマーク実施 | QA | ⬜ | 87.5%削減確認 |

### Week 11-12: 形式検証

| # | タスク | 担当 | Status | 備考 |
|---|--------|------|--------|------|
| 2.3.5 | フィールド演算 Lean4証明 | Cryptographer | ⬜ | - |
| 2.3.6 | FRI soundness証明 | Cryptographer | ⬜ | - |
| 2.3.7 | Phase 2.3 PIR | CSO | ⬜ | - |
| 2.3.8 | MS-1 Gate Review | CTO | ⬜ | ZK-STARK実装完了判定 |

---

## Phase 2.4: External Audit (Week 13-16 / Month 10)

| # | タスク | 担当 | Status | 備考 |
|---|--------|------|--------|------|
| 2.4.1 | 監査RFP最終化 | CSO | ⬜ | - |
| 2.4.2 | 監査業者選定 | CTO + CSO | ⬜ | - |
| 2.4.3 | 監査キックオフ | Team | ⬜ | - |
| 2.4.4 | 監査対応 | Engineer | ⬜ | - |
| 2.4.5 | 監査報告書レビュー | CSO | ⬜ | Critical/High 0件確認 |
| 2.4.6 | 監査指摘修正 | Engineer | ⬜ | - |

---

## Phase 2.5: Security Council (Week 17-20 / Month 11)

| # | タスク | 担当 | Status | 備考 |
|---|--------|------|--------|------|
| 2.5.1 | Multisig設計 | CSO | ⬜ | 5/9構成 |
| 2.5.2 | Council候補選定 | CEO + CTO | ⬜ | - |
| 2.5.3 | Multisigデプロイ | DevOps | ⬜ | - |
| 2.5.4 | 運用ドキュメント作成 | CSO | ⬜ | - |
| 2.5.5 | Council導入訓練 | Team | ⬜ | - |

---

## Phase 2.6: Token Design (Week 21-24 / Month 12)

| # | タスク | 担当 | Status | 備考 |
|---|--------|------|--------|------|
| 2.6.1 | veQS設計 | Cryptographer + CFO | ⬜ | トークン経済設計 |
| 2.6.2 | Token Contract実装 | Engineer | ⬜ | - |
| 2.6.3 | Tokenテスト | QA | ⬜ | - |
| 2.6.4 | Phase 2 Final PIR | CSO | ⬜ | - |
| 2.6.5 | MS-2 Phase Gate | CTO | ⬜ | Phase 2完了判定 |

---

## 📊 Key Performance Indicators

| KPI | 目標 | 現状 | Status |
|-----|------|------|--------|
| Gas削減率 | ≥87.5% | 計画中 | ⬜ |
| 証明生成時間 | <10秒 | - | ⬜ |
| 検証Gas | <500,000 | - | ⬜ |
| 外部監査 | Critical/High 0件 | - | ⬜ |
| テストカバレッジ | ≥95% | ~100% | ✅ |

---

## 🚧 Dependencies & Blockers

| # | 依存/ブロッカー | 影響 | 対策 | Status |
|---|----------------|------|------|--------|
| 1 | 外部監査業者選定 | Month 10開始 | 早期RFP発行 | 🔄 |
| 2 | Sepolia RPC | テストネットデプロイ | 複数プロバイダ確保 | ⬜ |
| 3 | Council候補確保 | Month 11開始 | 事前コンタクト | ⬜ |

---

## 📚 関連ドキュメント

| ドキュメント | パス |
|-------------|------|
| 憲法 | `docs/constitution/CORE_PRINCIPLES.md` |
| ZK-STARK計画 | `docs/planning/ZK_STARK_IMPLEMENTATION_PLAN.md` |
| Gasベースライン | `docs/planning/GAS_BASELINE_P2.md` |
| 監査RFP草案 | `docs/planning/AUDIT_RFP_DRAFT.md` |
| Warnings Log | `docs/planning/COMPILER_WARNINGS_LOG.md` |

---

**END OF PHASE 2 ACTIVE CHECKLIST**
