# DESIGN BOOTLOADER: 作成フェーズ
あなたはProject Aegisのデザインエージェントです。

## 1. 憲法の読み込み（必須）
`docs_new/00_core/CORE_PRINCIPLES.md`

## 2. デザインブリーフの読み込み（必須）
`docs_new/01_phase/04_phase4/01_design/system_XX_[name]/DESIGN_BRIEF_[NAME].md`

## 3. デザインシステムの読み込み（必須）
`docs_new/01_phase/04_phase4/01_design/UI_DESIGN_GUIDELINES.md`

## 4. 参考デザインの読み込み
`docs_new/01_phase/04_phase4/01_design/assets/design-concept-5-japan-premium.html`

## 5. 作業ディレクトリ（重要）

### 5.1 ディレクトリ構造
全ての作成ファイルは以下のパスに保存：

```
docs_new/01_phase/04_phase4/01_design/system_XX_[name]/
├── README.md                    # システム概要
├── DESIGN_BRIEF_[NAME].md       # 08_design_prep出力
├── DESIGN_MANIFEST.md           # 作成ファイル一覧（本フェーズで作成）
│
└── wip/                         # ★ 作業ファイル保管場所
    ├── wireframes/              # ワイヤーフレーム
    │   ├── 01_public_pages.md
    │   └── 02_onboarding.md
    │
    └── mocks/                   # HTMLモック
        ├── 01_landing.html
        ├── 02_onboarding_connect.html
        ├── 03_dashboard.html
        └── ...
```

### 5.2 ファイル命名規則
```
[番号]_[画面名].html

例:
01_landing.html
02_onboarding_connect.html
02_onboarding_keygen.html
03_dashboard.html
04_lock_input.html
04_lock_confirm.html
04_lock_processing.html
04_lock_success.html
```

## 6. タスク

### 6.1 ワイヤーフレーム作成
各画面の低忠実度レイアウト:
- [ ] 情報の優先順位
- [ ] ナビゲーションフロー
- [ ] エラーケース
- [ ] ローディング状態

### 6.2 High-Fidelity デザイン
UI_DESIGN_GUIDELINES.md に準拠:
- [ ] カラーパレット準拠
  - Hinomaru Red: #BC002D
  - Pure White: #FFFFFF
  - Premium Gold: #C9A962
  - Dark BG: #0A0A0C
- [ ] タイポグラフィ準拠
  - Display: Plus Jakarta Sans
  - Body: Plus Jakarta Sans + Noto Sans JP
  - Mono: DM Mono
- [ ] スペーシングシステム適用 (4pxベース)
- [ ] コンポーネント再利用
- [ ] レスポンシブ (Desktop / Mobile)

### 6.3 インタラクティブモック
HTML/React で実装:
- [ ] 日の丸アニメーション（Lock状態可視化）
- [ ] ホバー/フォーカス状態
- [ ] ローディング状態
- [ ] エラー状態
- [ ] モバイルレスポンシブ

### 6.4 デザインチェックリスト

| 項目 | 確認 | 備考 |
|------|:----:|------|
| Premium Japan感 | ⬜ | 日の丸モチーフ活用 |
| アクセシビリティ | ⬜ | WCAG 2.1 AA |
| コントラスト比 | ⬜ | 最低4.5:1 |
| タッチターゲット | ⬜ | 最低44px |
| ダークモード対応 | ⬜ | デフォルトダーク |
| レスポンシブ | ⬜ | 640/768/1024/1280px |

## 7. 出力（必須プロセス）

### 7.1 ファイル作成後、即座にGitプッシュ（必須）

作成したモックは **必ず** Gitにプッシュすること：

1. ローカルで作成・動作確認
2. **即座にGitプッシュ**（`wip/mocks/` 配下）
3. プッシュ完了後のURLを記録

⚠️ **重要**: Gitにプッシュしないと次フェーズ（PIR・修正）でファイルにアクセスできません

### 7.2 DESIGN_MANIFEST.md の作成（必須）

`system_XX_[name]/DESIGN_MANIFEST.md` を作成してGitにプッシュ：

```markdown
# Design Manifest: [System Name]

## Overview
- System: [Name]
- Created: [YYYY-MM-DD]
- Last Updated: [YYYY-MM-DD]
- Status: 🔵 In Progress / 🟢 PIR Ready / ✅ Approved

## Files

### Wireframes
| # | ファイル | パス | 説明 |
|---|----------|------|------|
| 1 | 01_public_pages.md | `wip/wireframes/01_public_pages.md` | LP・説明ページ |

### Mocks
| # | ファイル | パス | 画面 | 説明 |
|---|----------|------|------|------|
| 1 | 01_landing.html | `wip/mocks/01_landing.html` | Landing Page | ヒーロー・CTA |
| 2 | 02_onboarding_connect.html | `wip/mocks/02_onboarding_connect.html` | Wallet Connect | ウォレット接続 |
| 3 | 03_dashboard.html | `wip/mocks/03_dashboard.html` | Dashboard | メインダッシュボード |

## Change Log
| Date | Version | Changes |
|------|---------|---------|
| YYYY-MM-DD | 1.0 | 初版作成 |
```

### 7.3 プッシュ順序

1. `wip/wireframes/` 配下のファイル
2. `wip/mocks/` 配下のファイル
3. `DESIGN_MANIFEST.md`

### 7.4 完了確認

以下が全てGitにプッシュされていることを確認：
- [ ] 全ワイヤーフレーム
- [ ] 全モック
- [ ] DESIGN_MANIFEST.md

## 8. 次のステップ

完了後 → `10_design_pir.md` でDesign PIRを実施

PIR担当者は `DESIGN_MANIFEST.md` を参照してファイルにアクセスします。
