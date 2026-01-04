# Quantum Shield Documentation

> **Last Updated**: 2026-01-04  
> **Status**: Phase 3.3 進行中

## 📁 ディレクトリ構造

```
docs/
├── README.md                 # このファイル
├── constitution/             # 🔒 不変原則（Constitutional Documents）
├── specs/                    # 📋 仕様書
├── design/                   # 🏗️ アーキテクチャ設計
├── phases/                   # 📅 フェーズ別ドキュメント
│   ├── phase1/              # Phase 1: Foundation Bootstrap
│   ├── phase2/              # Phase 2: ZK-STARK Integration
│   ├── phase3/              # Phase 3: L3 Integration
│   │   ├── phase3.1/        #   - Foundation
│   │   ├── phase3.2/        #   - Implementation
│   │   └── phase3.3/        #   - Integration
│   └── phase4/              # Phase 4: Full Decentralization
├── security/                 # 🔐 セキュリティドキュメント
├── cryptography/             # 🔑 暗号技術ドキュメント
│   ├── dilithium/           # Dilithium-III (FIPS 204)
│   ├── kyber/               # Kyber (FIPS 203)
│   └── sphincs/             # SPHINCS+-128s (FIPS 205)
├── verification/             # ✅ 形式検証
├── deployments/              # 🚀 デプロイメント記録
├── meetings/                 # 📝 会議記録
├── reports/                  # 📊 レポート
│   └── benchmarks/          # パフォーマンスベンチマーク
├── guides/                   # 📖 ガイド・手順書
├── planning/                 # 📋 計画ドキュメント
│   └── archive/             # 過去の計画
├── agents/                   # 🤖 AIエージェント関連
│   └── archive/             # 過去のバージョン
└── archive/                  # 📦 アーカイブ
    └── wbs/                 # WBS過去バージョン
```

## 🎯 クイックアクセス

### Core Principles（不変原則）
- [CORE_PRINCIPLES.md](./constitution/CORE_PRINCIPLES.md) - 5つの不変原則

### 仕様書
- [UNIFIED_SPEC.md](./specs/UNIFIED_SPEC.md) - 統合仕様書 v2.0
- [SEQUENCES.md](./specs/SEQUENCES.md) - シーケンスカタログ v2.0
- [L3_CHAIN_SPECIFICATION.md](./specs/L3_CHAIN_SPECIFICATION.md) - L3チェーン仕様

### 現在のフェーズ
- [Phase 3.3 チェックリスト](./phases/phase3/phase3.3/checklist.md)
- [Phase 3.3 PIR一覧](./phases/phase3/phase3.3/pir/)

### 計画・状態
- [CURRENT_STATE.md](./planning/CURRENT_STATE.md) - 現在の状態
- [CURRENT_PLAN.md](./planning/CURRENT_PLAN.md) - 現在の計画

## 📊 フェーズ進捗

| Phase | 状態 | 期間 | Go/No-Go |
|-------|------|------|----------|
| Phase 1 | ✅ 完了 | 2025-12-15 〜 12-27 | PASS |
| Phase 2 | 🔄 進行中 | 2025-12-28 〜 | - |
| Phase 3.1 | ✅ 完了 | 2025-01-01 | PASS |
| Phase 3.2 | ✅ 完了 | 2026-01-02 | PASS |
| Phase 3.3 | 🔄 進行中 | 2026-01-03 〜 | - |
| Phase 4 | ⏳ 計画中 | TBD | - |

## 🔑 重要なドキュメント

### PIR (Post-Implementation Review)
PIRはフェーズごとに整理されています:
- [Phase 1 PIR](./phases/phase1/pir/)
- [Phase 2 PIR](./phases/phase2/pir/)
- [Phase 3.1 PIR](./phases/phase3/phase3.1/pir/)
- [Phase 3.2 PIR](./phases/phase3/phase3.2/pir/)
- [Phase 3.3 PIR](./phases/phase3/phase3.3/pir/)

### Go/No-Go決定
- [Phase 1 Go/No-Go](./phases/phase1/pir/GONOGO_PHASE1_COMPLETE.md)
- [Phase 2 ZK-STARK Go/No-Go](./decisions/GONOGO_PHASE2_ZK_STARK_L1.md)
- [Phase 3.1 Go/No-Go](./decisions/GONOGO_PHASE3.1_FOUNDATION_2025-01-01.md)
- [Phase 3.2 Go/No-Go](./decisions/GONOGO_PHASE3.2_IMPLEMENTATION_2026-01-02.md)

## 📝 PIRコードレビュールーチン

すべてのPIR会議では、以下のルーチンが必須です:
- [PIR_CODE_REVIEW_ROUTINE.md](./aegis/PIR_CODE_REVIEW_ROUTINE.md)

**重要**: テスト結果を確認する前に、必ずコードレビューを実施すること。

## 🔗 外部リンク

- [GitHub Repository](https://github.com/kota1026/quantum-shield)
- [NIST FIPS Standards](https://csrc.nist.gov/publications/fips)
