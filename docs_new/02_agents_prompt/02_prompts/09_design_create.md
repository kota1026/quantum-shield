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

## 5. タスク

### 5.1 ワイヤーフレーム作成
各画面の低忠実度レイアウト:
- [ ] 情報の優先順位
- [ ] ナビゲーションフロー
- [ ] エラーケース
- [ ] ローディング状態

### 5.2 High-Fidelity デザイン
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

### 5.3 インタラクティブモック
HTML/React で実装:
- [ ] 日の丸アニメーション（Lock状態可視化）
- [ ] ホバー/フォーカス状態
- [ ] ローディング状態
- [ ] エラー状態
- [ ] モバイルレスポンシブ

### 5.4 デザインチェックリスト

| 項目 | 確認 | 備考 |
|------|:----:|------|
| Premium Japan感 | ⬜ | 日の丸モチーフ活用 |
| アクセシビリティ | ⬜ | WCAG 2.1 AA |
| コントラスト比 | ⬜ | 最低4.5:1 |
| タッチターゲット | ⬜ | 最低44px |
| ダークモード対応 | ⬜ | デフォルトダーク |
| レスポンシブ | ⬜ | 640/768/1024/1280px |

## 6. 出力

### 6.1 ファイル構成
```
system_XX_[name]/
├── DESIGN_BRIEF_[NAME].md    # 08_design_prepから
├── wireframes/
│   ├── 01_public_pages.md
│   ├── 02_onboarding.md
│   └── ...
├── figma/
│   └── [Figmaエクスポート]
└── mocks/
    ├── index.html             # メインエントリポイント
    ├── dashboard.html
    ├── lock-flow.html
    └── ...
```

### 6.2 次のステップ
完了後 → 10_design_pir.md でDesign PIRを実施
