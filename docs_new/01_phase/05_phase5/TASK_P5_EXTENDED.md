# Phase 5 Extended Tasks (P5-037〜)

> **Created**: 2026-01-13
> **Purpose**: テストネットデプロイ & UIデザイン反映

---

## 背景

Phase 5 (TASK-P5-001〜036) は完了。以下の追加タスクを定義：
1. テストネットデプロイ
2. Phase 4デザインモックのUI実装
3. Consumer App (user向け) の実装

---

## タスク一覧

### テストネットデプロイ関連

| # | タスク | 内容 | 工数 | 依存 |
|---|--------|------|------|------|
| P5-037 | 環境設定 | .env.testnet作成、RPC/秘密鍵設定 | 0.5h | - |
| P5-038 | Sepoliaデプロイ | コアコントラクトをSepoliaへ | 1h | P5-037 |
| P5-039 | Base Sepoliaデプロイ | L2コントラクトをBase Sepoliaへ | 1h | P5-038 |
| P5-040 | Etherscan Verify | 全コントラクトをVerify | 0.5h | P5-039 |
| P5-041 | デプロイ検証 | read/write テスト実行 | 1h | P5-040 |

### UIデザイン反映（QS Admin）

| # | タスク | 内容 | 工数 | 依存 |
|---|--------|------|------|------|
| P5-042 | デザインシステム適用 | Phase4モックのカラー/フォント反映 | 2h | - |
| P5-043 | ダッシュボード画面 | 01_dashboard.html → React実装 | 2h | P5-042 |
| P5-044 | 緊急対応画面 | 02_emergency.html → React実装 | 1.5h | P5-042 |
| P5-045 | オンボーディング画面 | 03_onboarding.html → React実装 | 1.5h | P5-042 |
| P5-046 | プローバー管理画面 | 04_prover.html → React実装 | 1.5h | P5-042 |
| P5-047 | TXモニター画面 | 05_tx_monitor.html → React実装 | 1.5h | P5-042 |
| P5-048 | ノード管理画面 | 06_nodes.html → React実装 | 1h | P5-042 |
| P5-049 | スタッフ管理画面 | 07_staff.html → React実装 | 1h | P5-042 |
| P5-050 | レポート画面 | 08_reports.html → React実装 | 1h | P5-042 |
| P5-051 | 監査ログ画面 | 09_audit.html → React実装 | 1h | P5-042 |
| P5-052 | パラメータ設定画面 | 10_parameters.html → React実装 | 1.5h | P5-042 |
| P5-053 | エンタープライズ管理 | 11_enterprise.html → React実装 | 1.5h | P5-042 |
| P5-054 | コミュニティ画面 | 12_community.html → React実装 | 1h | P5-042 |

### Consumer App（User向け）

| # | タスク | 内容 | 工数 | 依存 |
|---|--------|------|------|------|
| P5-055 | Consumer App プロジェクト作成 | Vite + React 初期設定 | 1h | - |
| P5-056 | デザインシステム適用 | system_01_consumer モック反映 | 2h | P5-055 |
| P5-057 | ウォレット接続 | wagmi/viem統合 | 2h | P5-055 |
| P5-058 | ダッシュボード実装 | Consumer App メイン画面 | 2h | P5-056 |
| P5-059 | 資産管理画面 | 保護資産一覧・操作 | 2h | P5-058 |
| P5-060 | 証明履歴画面 | STARK証明の履歴表示 | 1.5h | P5-058 |
| P5-061 | 設定画面 | ユーザー設定・通知 | 1h | P5-058 |

---

## 進捗サマリ

```
テストネットデプロイ: [ ] P5-037 [ ] P5-038 [ ] P5-039 [ ] P5-040 [ ] P5-041
QS Admin UI:         [ ] P5-042 [ ] P5-043 [ ] P5-044 [ ] P5-045 [ ] P5-046
                     [ ] P5-047 [ ] P5-048 [ ] P5-049 [ ] P5-050 [ ] P5-051
                     [ ] P5-052 [ ] P5-053 [ ] P5-054
Consumer App:        [ ] P5-055 [ ] P5-056 [ ] P5-057 [ ] P5-058 [ ] P5-059
                     [ ] P5-060 [ ] P5-061

完了: 0/25 (0%)
```

---

## 優先順位

### Phase 5.1（優先度：高）
1. **P5-037〜041**: テストネットデプロイ（実際に動作確認）
2. **P5-042**: デザインシステム適用（UIの土台）

### Phase 5.2（優先度：中）
3. **P5-043〜054**: QS Admin UI完成
4. **P5-055〜061**: Consumer App実装

---

## デザイン参照

```
QS Admin デザインモック:
docs_new/01_phase/04_phase4/01_design/system_08_qs_admin/wip/mocks/

Consumer App デザインモック:
docs_new/01_phase/04_phase4/01_design/system_01_consumer/wip/

カラーシステム（日の丸テーマ）:
--accent-hinomaru: #bc002d
--accent-hinomaru-light: #e8334d
--accent-gold: #c9a962
--bg-primary: #0a0a0c
--bg-secondary: #111114
```

---

## 完了条件

### テストネットデプロイ
- [ ] Sepoliaにコントラクトがデプロイされている
- [ ] Base Sepoliaにコントラクトがデプロイされている
- [ ] Etherscanで全コントラクトがVerified
- [ ] read/writeが正常に動作

### QS Admin UI
- [ ] Phase 4デザインモックと同等のUI
- [ ] 12画面全て実装
- [ ] 日本語/英語対応
- [ ] レスポンシブ対応

### Consumer App
- [ ] ウォレット接続動作
- [ ] 資産保護フロー動作
- [ ] 証明履歴表示

---

**END OF TASK_P5_EXTENDED.md**
