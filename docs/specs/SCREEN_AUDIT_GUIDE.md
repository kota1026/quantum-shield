# 画面監査ガイド

> **目的**: 全画面を統一基準でチェックし、品質を担保する
> **作成日**: 2026-01-22
> **最終更新**: 2026-01-22

---

## 目次

1. [概要](#1-概要)
2. [チェックリスト](#2-チェックリスト)
3. [進捗管理](#3-進捗管理)
4. [システム別注意事項](#4-システム別注意事項)
5. [画面別チェック結果](#5-画面別チェック結果)

---

## 1. 概要

### 1.1 背景

- UI実装は完了しているが、細部に問題がある（遷移先、戻るボタン、アイコン、デザイン統一）
- 主要フローは8-9割OK、問題は細部にある
- 統一ルールに基づいて一括で品質チェック・修正を行う

### 1.2 対象システム

| # | システム | 画面数 | アプローチ |
|:-:|----------|:------:|------------|
| 1 | Consumer App | 19 | 詳細チェック |
| 2 | Token Hub | 16 | 詳細チェック |
| 3 | Governance | 6 | 詳細チェック |
| 4 | Prover Portal | 9 | 詳細チェック |
| 5 | Observer | 7 | 詳細チェック |
| 6 | Explorer | 9 | 詳細チェック |
| 7 | Enterprise Admin | 33 | ジャーニー定義 → 詳細チェック |
| 8 | QS Admin | 61 | ジャーニー定義 → 詳細チェック |
| | **合計** | **160** | |

### 1.3 参照ドキュメント

| ドキュメント | パス | 用途 |
|-------------|------|------|
| DESIGN_SYSTEM.md | `docs/design/DESIGN_SYSTEM.md` | デザイン基準 |
| URL_REFERENCE.md | `docs/specs/URL_REFERENCE.md` | 全画面URL一覧 |
| IMPLEMENTATION_GUIDE.md | `docs/specs/IMPLEMENTATION_GUIDE.md` | 実装ガイド |

---

## 2. チェックリスト

### 2.1 ユーザージャーニー観点

各画面がユーザーの目的達成に適切に貢献しているか確認。

| # | チェック項目 | 説明 |
|:-:|-------------|------|
| J1 | 画面の目的 | この画面で何ができるか明確か？ |
| J2 | 前画面からの流れ | どこから来たか分かるか？文脈は繋がっているか？ |
| J3 | 次画面への遷移 | 次に何をすべきか明確か？CTAは目立つか？ |
| J4 | ユーザーの迷い | 初心者（田中さん）が迷わないか？ |
| J5 | エラー時の導線 | エラー発生時に適切な案内があるか？ |

### 2.2 全要素の遷移チェック

画面内の全インタラクティブ要素が正しく動作するか確認。

| # | チェック項目 | 説明 |
|:-:|-------------|------|
| T1 | ボタン遷移 | 各ボタンが正しい遷移先に飛ぶか？ |
| T2 | リンク遷移 | 各リンクが正しい遷移先に飛ぶか？ |
| T3 | 戻るボタン | 正しい前画面に戻るか？ |
| T4 | ナビゲーション | アクティブ状態が正しいか？各タブの遷移先は正しいか？ |
| T5 | カード/統計 | クリッカブルな場合、遷移先は正しいか？ |
| T6 | アイコン | 配置・種類が他の画面と統一されているか？ |
| T7 | モーダル/ドロワー | 開閉が正常か？閉じた後の状態は正しいか？ |
| T8 | フォーム | 送信後の遷移先は正しいか？ |

### 2.3 DESIGN_SYSTEM.md準拠

デザインシステムに準拠しているか確認。

| # | チェック項目 | 基準 |
|:-:|-------------|------|
| D1 | カラー | Hinomaru Red (#BC002D), Gold (#C9A962), 背景色等が正しいか |
| D2 | タイポグラフィ | フォントサイズ、ウェイトが規定通りか |
| D3 | スペーシング | 4pxグリッドに沿っているか |
| D4 | Button | 9 variant (primary/secondary/outline/ghost/danger/warning/success/link/gold) の使い分け |
| D5 | Card | 角丸、シャドウが統一されているか |
| D6 | Input | フォーカス状態、エラー状態が正しいか |
| D7 | Badge | 適切なvariantを使用しているか |
| D8 | Tooltip | 技術用語（Dilithium, STARK, Lock等）に付いているか |
| D9 | タップターゲット | 44px以上あるか（モバイル対応） |
| D10 | A11y | aria-*, role, tabIndex が設定されているか |
| D11 | コントラスト | WCAG 2.1 AA (4.5:1) を満たしているか |

---

## 3. 進捗管理

### 3.1 全体進捗

| System | Total | Done | Progress | Status |
|--------|:-----:|:----:|:--------:|:------:|
| Consumer App | 19 | 0 | 0% | 🔄 In Progress |
| Token Hub | 16 | 0 | 0% | ⬜ Pending |
| Governance | 6 | 0 | 0% | ⬜ Pending |
| Prover Portal | 9 | 0 | 0% | ⬜ Pending |
| Observer | 7 | 0 | 0% | ⬜ Pending |
| Explorer | 9 | 0 | 0% | ⬜ Pending |
| Enterprise Admin | 33 | 0 | 0% | ⬜ Pending |
| QS Admin | 61 | 0 | 0% | ⬜ Pending |
| **Total** | **160** | **0** | **0%** | |

### 3.2 Consumer App 詳細

| # | 画面 | URL | J | T | D | Status | Issues |
|:-:|------|-----|:-:|:-:|:-:|:------:|--------|
| 1 | Landing | /consumer/landing | ⬜ | ⬜ | ⬜ | Pending | |
| 2 | Dashboard | /consumer/dashboard | ⬜ | ⬜ | ⬜ | Pending | |
| 3 | Lock | /consumer/lock | ⬜ | ⬜ | ⬜ | Pending | |
| 4 | Lock Confirm | /consumer/lock/confirm | ⬜ | ⬜ | ⬜ | Pending | |
| 5 | Lock Processing | /consumer/lock/processing | ⬜ | ⬜ | ⬜ | Pending | |
| 6 | Lock Complete | /consumer/lock/complete | ⬜ | ⬜ | ⬜ | Pending | |
| 7 | Unlock | /consumer/unlock | ⬜ | ⬜ | ⬜ | Pending | |
| 8 | Unlock Confirm | /consumer/unlock/confirm | ⬜ | ⬜ | ⬜ | Pending | |
| 9 | Unlock Processing | /consumer/unlock/processing | ⬜ | ⬜ | ⬜ | Pending | |
| 10 | Unlock Complete | /consumer/unlock/complete | ⬜ | ⬜ | ⬜ | Pending | |
| 11 | Emergency Unlock | /consumer/emergency-unlock | ⬜ | ⬜ | ⬜ | Pending | |
| 12 | History | /consumer/history | ⬜ | ⬜ | ⬜ | Pending | |
| 13 | History Detail | /consumer/history/[id] | ⬜ | ⬜ | ⬜ | Pending | |
| 14 | Notifications | /consumer/notifications | ⬜ | ⬜ | ⬜ | Pending | |
| 15 | Settings | /consumer/settings | ⬜ | ⬜ | ⬜ | Pending | |
| 16 | Settings Security | /consumer/settings/security | ⬜ | ⬜ | ⬜ | Pending | |
| 17 | Settings Keys | /consumer/settings/keys | ⬜ | ⬜ | ⬜ | Pending | |
| 18 | Help | /consumer/help | ⬜ | ⬜ | ⬜ | Pending | |
| 19 | Onboarding | /consumer/onboarding | ⬜ | ⬜ | ⬜ | Pending | |

### 3.3 Token Hub 詳細

| # | 画面 | URL | J | T | D | Status | Issues |
|:-:|------|-----|:-:|:-:|:-:|:------:|--------|
| 1 | Landing | /token-hub/landing | ⬜ | ⬜ | ⬜ | Pending | |
| 2 | Dashboard | /token-hub/dashboard | ⬜ | ⬜ | ⬜ | Pending | |
| 3 | Stake | /token-hub/stake | ⬜ | ⬜ | ⬜ | Pending | |
| 4 | Stake Confirm | /token-hub/stake/confirm | ⬜ | ⬜ | ⬜ | Pending | |
| 5 | Unstake | /token-hub/unstake | ⬜ | ⬜ | ⬜ | Pending | |
| 6 | Rewards | /token-hub/rewards | ⬜ | ⬜ | ⬜ | Pending | |
| 7 | Rewards Claim | /token-hub/rewards/claim | ⬜ | ⬜ | ⬜ | Pending | |
| 8 | Delegate | /token-hub/delegate | ⬜ | ⬜ | ⬜ | Pending | |
| 9 | Governance Power | /token-hub/governance-power | ⬜ | ⬜ | ⬜ | Pending | |
| 10 | History | /token-hub/history | ⬜ | ⬜ | ⬜ | Pending | |
| 11 | Analytics | /token-hub/analytics | ⬜ | ⬜ | ⬜ | Pending | |
| 12 | Settings | /token-hub/settings | ⬜ | ⬜ | ⬜ | Pending | |
| 13 | Lock Preview | /token-hub/lock-preview | ⬜ | ⬜ | ⬜ | Pending | |
| 14 | Onboarding | /token-hub/onboarding | ⬜ | ⬜ | ⬜ | Pending | |
| 15 | Unlock | /token-hub/unlock | ⬜ | ⬜ | ⬜ | Pending | |
| 16 | Rewards History | /token-hub/rewards/history | ⬜ | ⬜ | ⬜ | Pending | |

### 3.4 Governance 詳細

| # | 画面 | URL | J | T | D | Status | Issues |
|:-:|------|-----|:-:|:-:|:-:|:------:|--------|
| 1 | Landing | /governance/landing | ⬜ | ⬜ | ⬜ | Pending | |
| 2 | Proposals | /governance/proposals | ⬜ | ⬜ | ⬜ | Pending | |
| 3 | Proposal Detail | /governance/proposals/[id] | ⬜ | ⬜ | ⬜ | Pending | |
| 4 | Proposal Create | /governance/proposals/create | ⬜ | ⬜ | ⬜ | Pending | |
| 5 | Delegates | /governance/delegates | ⬜ | ⬜ | ⬜ | Pending | |
| 6 | My Votes | /governance/my-votes | ⬜ | ⬜ | ⬜ | Pending | |

### 3.5 Prover Portal 詳細

| # | 画面 | URL | J | T | D | Status | Issues |
|:-:|------|-----|:-:|:-:|:-:|:------:|--------|
| 1 | Landing | /prover/landing | ⬜ | ⬜ | ⬜ | Pending | |
| 2 | Dashboard | /prover/dashboard | ⬜ | ⬜ | ⬜ | Pending | |
| 3 | Register | /prover/register | ⬜ | ⬜ | ⬜ | Pending | |
| 4 | Node Setup | /prover/node-setup | ⬜ | ⬜ | ⬜ | Pending | |
| 5 | Signatures | /prover/signatures | ⬜ | ⬜ | ⬜ | Pending | |
| 6 | Earnings | /prover/earnings | ⬜ | ⬜ | ⬜ | Pending | |
| 7 | Stake | /prover/stake | ⬜ | ⬜ | ⬜ | Pending | |
| 8 | Settings | /prover/settings | ⬜ | ⬜ | ⬜ | Pending | |
| 9 | Alerts | /prover/alerts | ⬜ | ⬜ | ⬜ | Pending | |

### 3.6 Observer 詳細

| # | 画面 | URL | J | T | D | Status | Issues |
|:-:|------|-----|:-:|:-:|:-:|:------:|--------|
| 1 | Landing | /observer/landing | ⬜ | ⬜ | ⬜ | Pending | |
| 2 | Dashboard | /observer/dashboard | ⬜ | ⬜ | ⬜ | Pending | |
| 3 | Pending | /observer/pending | ⬜ | ⬜ | ⬜ | Pending | |
| 4 | Suspicious | /observer/suspicious | ⬜ | ⬜ | ⬜ | Pending | |
| 5 | History | /observer/history | ⬜ | ⬜ | ⬜ | Pending | |
| 6 | Earnings | /observer/earnings | ⬜ | ⬜ | ⬜ | Pending | |
| 7 | Settings | /observer/settings | ⬜ | ⬜ | ⬜ | Pending | |

### 3.7 Explorer 詳細

| # | 画面 | URL | J | T | D | Status | Issues |
|:-:|------|-----|:-:|:-:|:-:|:------:|--------|
| 1 | Landing | /explorer/landing | ⬜ | ⬜ | ⬜ | Pending | |
| 2 | Overview | /explorer/overview | ⬜ | ⬜ | ⬜ | Pending | |
| 3 | Locks | /explorer/locks | ⬜ | ⬜ | ⬜ | Pending | |
| 4 | Lock Detail | /explorer/locks/[id] | ⬜ | ⬜ | ⬜ | Pending | |
| 5 | Unlocks | /explorer/unlocks | ⬜ | ⬜ | ⬜ | Pending | |
| 6 | Unlock Detail | /explorer/unlocks/[id] | ⬜ | ⬜ | ⬜ | Pending | |
| 7 | Challenges | /explorer/challenges | ⬜ | ⬜ | ⬜ | Pending | |
| 8 | Provers | /explorer/provers | ⬜ | ⬜ | ⬜ | Pending | |
| 9 | Analytics | /explorer/analytics | ⬜ | ⬜ | ⬜ | Pending | |

### 3.8 Enterprise Admin 詳細

> ⚠️ このシステムはユーザージャーニー定義から開始

| # | 画面 | URL | J | T | D | Status | Issues |
|:-:|------|-----|:-:|:-:|:-:|:------:|--------|
| 1 | Landing | /enterprise/landing | ⬜ | ⬜ | ⬜ | Pending | |
| 2 | Dashboard | /enterprise/dashboard | ⬜ | ⬜ | ⬜ | Pending | |
| ... | （33画面） | | | | | | |

### 3.9 QS Admin 詳細

> ⚠️ このシステムはユーザージャーニー定義から開始

| # | 画面 | URL | J | T | D | Status | Issues |
|:-:|------|-----|:-:|:-:|:-:|:------:|--------|
| 1 | Dashboard | /admin/dashboard | ⬜ | ⬜ | ⬜ | Pending | |
| ... | （61画面） | | | | | | |

---

## 4. システム別注意事項

### 4.1 Consumer App

**ペルソナ**: 田中さん（35歳、暗号資産初心者）
**目的**: ETHを安全に保管したい

**主要フロー**:
1. Landing → Dashboard（ウォレット接続後）
2. Dashboard → Lock → Confirm → Processing → Complete
3. Dashboard → Unlock → Confirm → Processing → Complete
4. Dashboard → History → Detail
5. Dashboard → Settings → Security / Keys

### 4.2 Token Hub

**ペルソナ**: QSトークン保有者
**目的**: ステーキングで報酬を得たい、ガバナンスに参加したい

**主要フロー**:
1. Landing → Dashboard（ウォレット接続後）
2. Dashboard → Stake → Confirm
3. Dashboard → Rewards → Claim
4. Dashboard → Delegate

### 4.3 Governance

**ペルソナ**: QSトークン保有者（ガバナンス参加者）
**目的**: プロトコルの意思決定に参加したい

### 4.4 Prover Portal

**ペルソナ**: 技術者（Proverノード運営者）
**目的**: Proverノードを運営して報酬を得たい

### 4.5 Observer

**ペルソナ**: 技術者（不正監視者）
**目的**: 不正を発見して報酬を得たい

### 4.6 Explorer

**ペルソナ**: 一般ユーザー / 開発者
**目的**: ブロックチェーンの状態を確認したい

### 4.7 Enterprise Admin

**ペルソナ**: 企業の管理者
**目的**: 自社のQuantum Shield利用を管理したい

> ⚠️ ユーザージャーニーの詳細定義が必要

### 4.8 QS Admin

**ペルソナ**: Quantum Shield財団の運営者
**目的**: プロトコル全体を管理・監視したい

> ⚠️ ユーザージャーニーの詳細定義が必要

---

## 5. 画面別チェック結果

### 5.1 Consumer App

#### 5.1.1 Landing (`/consumer/landing`)

**チェック日**: -
**Status**: Pending

**ユーザージャーニー (J)**:
| # | 項目 | 結果 | 備考 |
|:-:|------|:----:|------|
| J1 | 画面の目的 | ⬜ | |
| J2 | 前画面からの流れ | ⬜ | |
| J3 | 次画面への遷移 | ⬜ | |
| J4 | ユーザーの迷い | ⬜ | |
| J5 | エラー時の導線 | ⬜ | |

**遷移チェック (T)**:
| # | 項目 | 結果 | 備考 |
|:-:|------|:----:|------|
| T1 | ボタン遷移 | ⬜ | |
| T2 | リンク遷移 | ⬜ | |
| T3 | 戻るボタン | ⬜ | |
| T4 | ナビゲーション | ⬜ | |
| T5 | カード/統計 | ⬜ | |
| T6 | アイコン | ⬜ | |
| T7 | モーダル/ドロワー | ⬜ | |
| T8 | フォーム | ⬜ | |

**デザイン準拠 (D)**:
| # | 項目 | 結果 | 備考 |
|:-:|------|:----:|------|
| D1 | カラー | ⬜ | |
| D2 | タイポグラフィ | ⬜ | |
| D3 | スペーシング | ⬜ | |
| D4 | Button | ⬜ | |
| D5 | Card | ⬜ | |
| D6 | Input | ⬜ | |
| D7 | Badge | ⬜ | |
| D8 | Tooltip | ⬜ | |
| D9 | タップターゲット | ⬜ | |
| D10 | A11y | ⬜ | |
| D11 | コントラスト | ⬜ | |

**発見した問題**:
| # | カテゴリ | 問題 | 修正内容 | 修正済 |
|:-:|:--------:|------|----------|:------:|
| | | | | |

---

（以下、各画面のテンプレートを監査時に追加）

---

## 更新履歴

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-22 | Claude | 初版作成 |
