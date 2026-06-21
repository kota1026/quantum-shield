# 📐 Phase 4 UI/UX 統合仕様書 - 最終版
## Agent Prompt 01〜07 の指針として

> **Version**: Final  
> **Date**: 2026-01-05  
> **目的**: Phase 4 UI/UX実装の完全な指針ドキュメント

---

# ドキュメント構成

本仕様書は以下の7つのドキュメントで構成されています。

| # | ファイル名 | 内容 | Agent対応 |
|---|-----------|------|----------|
| 00 | **00_INDEX.md** | 本ファイル（目次・概要） | 全Agent |
| 01 | **01_ARCHITECTURE.md** | システムアーキテクチャ、プレイヤー×システムマトリックス | 01_plan, 02_spec |
| 02 | **02_PERSONAS.md** | 全12プレイヤーの詳細ペルソナ定義 | 01_plan, 02_spec |
| 03 | **03_USER_JOURNEYS.md** | 全プレイヤーの詳細ジャーニーマップ | 02_spec, 03_impl |
| 04 | **04_SCREENS.md** | 8システム全画面定義（253画面） | 03_impl, 04_review |
| 05 | **05_AUTH_SECURITY.md** | 認証・ログイン・権限設計 | 02_spec, 03_impl, 04_review |
| 06 | **06_DATA_DESIGN.md** | データ設計（保存先、スキーマ） | 02_spec, 03_impl |
| 07 | **07_INTEGRATION.md** | バックエンド統合、不足API、開発計画 | 03_impl, 05_pir |

---

# クイックサマリー

## 1. 9システム構成

```
┌─────────────────────────────────────────────────────────────────┐
│                      Quantum Shield Platform                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  0. サービス全体サイト (quantum-shield.io)                      │
│     ├── メインLP / 技術解説 / ホワイトペーパー                  │
│     └── 15画面                                                  │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    8 Application Systems                │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  1. Consumer App     │  2. Token Hub    │  3. Governance│    │
│  │     (25画面)         │     (22画面)     │     (20画面)  │    │
│  │                                                         │    │
│  │  4. Prover Portal    │  5. Observer     │  6. Explorer  │    │
│  │     (32画面)         │     (16画面)     │     (14画面)  │    │
│  │                                                         │    │
│  │  7. Enterprise Admin │  8. QS Admin                     │    │
│  │     (47画面)         │     (62画面)                     │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  合計: 253画面                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 2. 全12プレイヤー

| # | プレイヤー | ペルソナ名 | 登録 | 認証方式 |
|---|-----------|----------|:----:|----------|
| 1 | End User | 田中さん(32) | ✅ | Wallet (SIWE) |
| 2 | Token Holder | 鈴木さん(28) | 自動 | Wallet |
| 3 | Delegate | 渡辺さん(42) | ✅ | Wallet |
| 4 | Proposer | 高橋さん(35) | 自動 | Wallet + veQS閾値 |
| 5 | Prover | 山田さん(45) | ✅ | Wallet + HSM |
| 6 | Observer | 中村さん(40) | ✅ | Wallet + Stake |
| 7 | Challenger | 中村さん(40) | 自動 | Wallet |
| 8 | Security Council | 伊藤さん(50) | ✅ | Wallet + 2FA |
| 9 | Purpose Committee | 木村さん(55) | ✅ | Wallet + 2FA |
| 10 | Service Provider | 佐藤さん(38) | ✅ | Email + 2FA |
| 11 | QS Staff (新人) | 加藤さん(26) | ✅ | Email + 2FA |
| 12 | QS Staff (上級) | 松本さん(35) | ✅ | Email + 2FA |

## 3. 画面数サマリー

| システム | 画面数 | 📱対応 | 優先度 |
|---------|:------:|:------:|:------:|
| サービス全体サイト | 15 | ✅ | P1 |
| Consumer App | 25 | ✅ | P0 |
| Token Hub | 22 | ✅ | P0 |
| Governance | 20 | △ | P1 |
| Prover Portal | 32 | △ | P0 |
| Observer/Challenger | 16 | ✅ | P1 |
| Explorer | 14 | ✅ | P1 |
| Enterprise Admin | 47 | △ | P1 |
| QS Admin | 62 | ❌ | P0 |
| **合計** | **253** | | |

## 4. 認証設計サマリー

| 認証方式 | 対象 | 2FA | セッション |
|---------|------|:---:|-----------|
| Wallet (SIWE) | End User, Token Holder, Observer等 | - | 永続 |
| Wallet + HSM | Prover | ✅必須 | 24h |
| Wallet + 2FA | Security Council, Purpose Committee | ✅必須 | 1h |
| Email + Password + 2FA | Enterprise, QS Staff | ✅必須 | 4-8h |

## 5. データ設計サマリー

| 保存先 | データ種類 | 特徴 |
|--------|-----------|------|
| L1 (Ethereum) | 公開鍵、Stake、投票記録、Challenge結果 | 不変、透明 |
| L3 (Aegis) | State Root、署名キュー、STARK証明 | 高速処理 |
| DB (PostgreSQL) | ユーザー設定、企業情報、操作ログ | プライバシー保護 |
| IPFS/Arweave | プロフィール、Proposal本文、証拠 | 分散永続 |
| ブラウザ | Dilithium秘密鍵、セッション | Self-Custody |

---

# Agent別参照ガイド

## 01_plan.md
- 📖 **00_INDEX.md** - 全体概要
- 📖 **01_ARCHITECTURE.md** - システム構成
- 📖 **02_PERSONAS.md** - ペルソナ理解

## 02_spec.md
- 📖 **01_ARCHITECTURE.md** - システム構成
- 📖 **03_USER_JOURNEYS.md** - ジャーニー詳細
- 📖 **05_AUTH_SECURITY.md** - 認証設計
- 📖 **06_DATA_DESIGN.md** - データ設計

## 03_impl.md
- 📖 **04_SCREENS.md** - 画面定義
- 📖 **05_AUTH_SECURITY.md** - 認証実装
- 📖 **06_DATA_DESIGN.md** - DB設計
- 📖 **07_INTEGRATION.md** - API実装

## 04_review.md
- 📖 **04_SCREENS.md** - 画面仕様確認
- 📖 **05_AUTH_SECURITY.md** - セキュリティ確認

## 05_pir.md
- 📖 **07_INTEGRATION.md** - 進捗確認

## 06_update.md
- 📖 **00_INDEX.md** - 状態更新

## 07_gonogo.md
- 📖 全ドキュメント - 最終確認

---

# 関連ドキュメント参照

本仕様書は以下の既存ドキュメントと整合します：

| ドキュメント | パス | 関連 |
|------------|------|------|
| Core Principles | `docs_new/00_core/CORE_PRINCIPLES.md` | CP-1〜5 |
| Bridge仕様 | `docs_new/00_core/specs/SPEC_STRATEGY_BRIDGE.md` | §5セキュリティ要件 |
| Sequence定義 | `docs_new/00_core/sequences/SEQUENCES_v2.0.md` | SEQ#1〜14 |
| Phase 4計画 | `docs_new/01_phase/04_phase4/PHASE4_PLAN.md` | タスクID |
| 既存UI/UX資料 | `docs_new/01_phase/04_phase4/01_戦略検討資料/01_UI UX/` | 参照 |

---

**END OF INDEX**
