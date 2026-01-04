# Quantum Shield Documentation

> **Last Updated**: 2026-01-04  
> **Status**: Phase 3.3 進行中

## 📁 ディレクトリ構造
```
docs_new/
├── README.md                    # このファイル
│
├── 00_core/                     # 🔒 コア仕様・原則
│   ├── specs/                   # 統合仕様書
│   └── sequences/               # シーケンスカタログ
│
├── 01_phase/                    # 📅 フェーズ別ドキュメント
│   ├── 00_Phase0.5/            # Phase 0.5: 準備段階
│   ├── 01_Phase1/              # Phase 1: Foundation Bootstrap
│   │   ├── 99_PIR/             # PIR (Post-Implementation Review)
│   │   ├── 100_SPEC REVIEW/    # 仕様レビュー
│   │   └── 2025_1224_実装乖離問題/
│   ├── 02_Phase2/              # Phase 2: ZK-STARK Integration
│   │   ├── 99_PIR/
│   │   ├── 100_SPEC REVIEW/
│   │   └── ぼつ/               # 不採用案
│   ├── 03_Phase3/              # Phase 3: L3 Integration
│   │   ├── 00_strategy/        # 戦略策定プロセス (8ラウンド)
│   │   ├── 01_3.1/             # Phase 3.1: Foundation
│   │   ├── 02_3.2/             # Phase 3.2: Implementation
│   │   └── 03_3.3/             # Phase 3.3: Integration
│   └── 04_phase4/              # Phase 4: Full Decentralization
│
├── 02_agents_prompt/            # 🤖 AIエージェント関連
│   ├── 01_Agent strategic meeting format/
│   ├── 02_prompts/
│   └── 99_11Agents/
│
├── 03_verification/             # ✅ 形式検証
│
├── 100_before the project/      # 📚 プロジェクト開始前の調査
│   ├── cryptography/           # 暗号技術 (dilithium, kyber, sphincs)
│   ├── reports/benchmarks/
│   └── security/
│
└── 99_その他/                   # 📦 その他
```

## 🎯 クイックアクセス

### Core Specifications
- [specs/](./00_core/specs/) - 統合仕様書
- [sequences/](./00_core/sequences/) - シーケンスカタログ

### 現在のフェーズ (Phase 3.3)
- [チェックリスト](./01_phase/03_Phase3/03_3.3/01_checklist/)
- [PIR一覧](./01_phase/03_Phase3/03_3.3/99_PIR/)

## 📊 フェーズ進捗

| Phase | 状態 | Go/No-Go |
|-------|------|----------|
| Phase 1 | ✅ 完了 | PASS |
| Phase 2 | ✅ 完了 | PASS |
| Phase 3.1 | ✅ 完了 | PASS |
| Phase 3.2 | ✅ 完了 | PASS |
| Phase 3.3 | 🔄 進行中 | - |
| Phase 4 | ⏳ 計画中 | - |

## 🔑 PIR (Post-Implementation Review)

- [Phase 1 PIR](./01_phase/01_Phase1/99_PIR/)
- [Phase 2 PIR](./01_phase/02_Phase2/99_PIR/)
- [Phase 3.1 PIR](./01_phase/03_Phase3/01_3.1/99_PIR/)
- [Phase 3.2 PIR](./01_phase/03_Phase3/02_3.2/99_PIR/)
- [Phase 3.3 PIR](./01_phase/03_Phase3/03_3.3/99_PIR/)

## 📂 番号規則

| 接頭番号 | 意味 |
|---------|------|
| 00_ | コア・基盤 |
| 01_ | メインコンテンツ |
| 02_ | サポートツール |
| 03_ | 検証・テスト |
| 99_ | PIR・その他 |
| 100_ | 参考資料・アーカイブ |
EOF
