# Quantum Shield ドキュメント

> **このドキュメントの目的**: 開発者がどこを見れば良いか一目で分かるようにする

---

## クイックスタート

| やりたいこと | 見るドキュメント |
|-------------|-----------------|
| **画面を実装したい** | [IMPLEMENTATION_GUIDE.md](./specs/IMPLEMENTATION_GUIDE.md) |
| **色・フォント・ボタンを確認** | [DESIGN_SYSTEM.md](./design/DESIGN_SYSTEM.md) |
| **APIの型を確認** | [DATA_MODEL.md](./specs/DATA_MODEL.md) |
| **ファイル配置場所を確認** | [CODEBASE_MAP.md](./specs/CODEBASE_MAP.md) |
| **HTMLモックを見たい** | [design/mocks/](./design/mocks/) |
| **なぜこの設計になったか** | [process-history/](./process-history/) |

---

## フォルダ構成

```
docs/
├── README.md                  # このファイル（索引）
│
├── specs/                     # 仕様書
│   ├── IMPLEMENTATION_GUIDE.md # ★実装ガイド（メイン）
│   ├── DATA_MODEL.md          # データモデル・API型
│   ├── CODEBASE_MAP.md        # コードベース地図
│   └── URL_REFERENCE.md       # URL一覧
│
├── design/                    # デザイン関連
│   ├── DESIGN_SYSTEM.md       # デザインシステム
│   ├── mocks/                 # HTMLモック
│   │   ├── consumer/
│   │   ├── token-hub/
│   │   ├── governance/
│   │   ├── prover/
│   │   ├── observer/
│   │   ├── explorer/
│   │   ├── enterprise/
│   │   └── admin/
│   └── assets/                # デザインアセット
│       └── design-concept-5-japan-premium.html
│
└── process-history/           # 経緯・履歴（参照用）
    ├── README.md              # なぜこの設計になったか
    ├── phase1/                # Phase 1 の成果物
    ├── phase2/                # Phase 2 の成果物
    └── phase3/                # Phase 3 の成果物
```

---

## ドキュメント詳細

### 実装時に必ず見るもの

| ドキュメント | 内容 | 更新頻度 |
|-------------|------|----------|
| **IMPLEMENTATION_GUIDE.md** | 全画面の実装仕様、共通パターン、チェックリスト | 高（新画面追加時） |
| **DESIGN_SYSTEM.md** | 色、フォント、ボタン、アニメーション | 低（確定済み） |
| **DATA_MODEL.md** | エンティティ、API型、Mock APIパターン | 中（API追加時） |
| **CODEBASE_MAP.md** | ファイル配置、開発ガイド | 低（構造変更時） |

### デザイン確認時に見るもの

| ドキュメント | 内容 |
|-------------|------|
| **design/mocks/** | 各画面のHTMLモック |
| **design/assets/** | デザインコンセプト、アイコン |

### 経緯を知りたい時に見るもの

| ドキュメント | 内容 |
|-------------|------|
| **process-history/README.md** | プロジェクト経緯サマリー |
| **process-history/phase1/** | 初期設計・検討資料 |
| **process-history/phase2/** | アーキテクチャ決定 |
| **process-history/phase3/** | 仕様策定・レビュー |

---

## 更新ルール

1. **新しい画面を追加したら** → IMPLEMENTATION_GUIDE.md を更新
2. **新しいAPIを追加したら** → DATA_MODEL.md を更新
3. **デザインを変更したら** → DESIGN_SYSTEM.md を更新
4. **大きな設計変更をしたら** → process-history/ に記録を残す

---

## 更新履歴

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-22 | Claude | 初版作成。フォルダ構造整理 |
| 1.1 | 2026-01-22 | Claude | IMPLEMENTATION_GUIDE.md v1.3同期（全8アプリ詳細仕様、テンプレート追加） |
