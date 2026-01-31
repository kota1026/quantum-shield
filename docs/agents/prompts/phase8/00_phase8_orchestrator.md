# Phase 8: QS Admin Orchestrator Prompt

> Phase 8 全体のオーケストレーション

---

## Phase 8 概要

QS Foundation管理画面（QS Admin）の開発フェーズ。

### サブフェーズ構成

| Phase | 名称 | 内容 | ゲート |
|:-----:|------|------|--------|
| 8-A | 画面実装 | 38画面のReact実装 | TypeScript/ESLint通過 |
| 8-B | 画面検証 | 5観点Playwrightレビュー | 全画面PASS/CONDITIONAL |
| 8-C | バックエンド | 65 API実装 | BE-001~003準拠 |
| 8-D | L3/L1統合 | Dilithium署名+Sepolia | 署名検証+TX確認 |
| 8-E | 統合テスト | E2E+ログ検証 | 全テスト通過 |

---

## トリガーコマンド

| コマンド | 実行内容 |
|---------|---------|
| Phase 8 開始 | 8-Aから順次開始 |
| Phase 8-A 開始 | 画面実装 |
| Phase 8-B 開始 | 画面検証 |
| Phase 8-C 開始 | バックエンド |
| Phase 8-D 開始 | L3/L1統合 |
| Phase 8-D L3 開始 | L3のみ |
| Phase 8-D L1 開始 | L1のみ |
| Phase 8-E 開始 | 統合テスト |
| Phase 8 進捗確認 | 進捗表示 |
| Phase 8 ゲートチェック | ゲート検証 |

---

## 初期化手順

Phase 8トリガー検出時：

```
READ PARALLEL:
├── docs/specs/QS_ADMIN_DESIGN_PLAN.md
├── docs/specs/DATABASE_DESIGN.md
├── docs/specs/API_SPECIFICATION.yaml
├── docs/agents/prompts/rules/BE_RULES.md
└── docs/phase8/PHASE8_PROGRESS.md
```

---

## ゲートチェック

各Phase完了時に実行：

### 8-A ゲート
- [ ] TypeScript コンパイル成功
- [ ] ESLint エラー0
- [ ] 38画面全て実装済み
- [ ] i18n (ja/en) 完備

### 8-B ゲート
- [ ] 38画面全てPASS/CONDITIONAL
- [ ] D観点: デザイン準拠
- [ ] J観点: ジャーニー確認
- [ ] N観点: ナビゲーション確認
- [ ] M観点: モデル整合性
- [ ] C観点: 完全性

### 8-C ゲート
- [ ] 65 API実装完了
- [ ] BE-001: スタブ0
- [ ] BE-002: テストハック0
- [ ] BE-003: ログ出力確認

### 8-D ゲート
- [ ] L3接続確認
- [ ] Dilithium署名生成/検証
- [ ] Sepolia接続確認
- [ ] Treasury Vault統合

### 8-E ゲート
- [ ] E2E全通過
- [ ] ログ整合性検証PASS

---

## プロンプト一覧

| ファイル | 用途 |
|----------|------|
| 00_phase8_orchestrator.md | 全体オーケストレーション |
| 01_screen_impl.md | 画面実装 |
| 02_screen_verify.md | 画面検証 |
| 03_backend_impl.md | バックエンド |
| 04_l3_integration.md | L3統合 |
| 05_l1_integration.md | L1統合 |
| 06_e2e_test.md | E2Eテスト |
| 07_log_verification.md | ログ検証 |
| 08_gate_check.md | ゲートチェック |
