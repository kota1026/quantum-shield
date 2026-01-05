# 07 バックエンド統合・開発計画

> **対応Agent**: 02_spec.md, 03_impl.md, 06_update.md

---

# Part 1: 既存API状況

## 1.1 リポジトリ構造（実際）

```
quantum-shield/
├── services/
│   ├── api/                    # メインAPI（Rust/Axum）
│   │   └── src/routes/
│   │       ├── mod.rs          # ルート定義
│   │       ├── admin.rs        # Admin API
│   │       ├── edition.rs      # Edition切替
│   │       ├── health.rs       # ヘルスチェック
│   │       ├── lock.rs         # Lock処理
│   │       ├── prover.rs       # Prover登録・情報
│   │       ├── status.rs       # ステータス取得
│   │       └── unlock.rs       # Unlock処理
│   ├── event-bridge/           # イベントブリッジサービス
│   └── sig-queue/              # 署名キューサービス
├── apps/
│   └── admin-dashboard/        # Admin Dashboard（React）
│       └── src/pages/
│           ├── Dashboard.tsx
│           ├── analytics/
│           ├── edition/
│           ├── emergency/
│           ├── provers/
│           └── providers/
├── contracts/                   # Solidityコントラクト
├── l3-aegis/                   # L3ノード
├── stark-prover/               # STARK Prover
├── client/                     # クライアントライブラリ
├── packages/                   # 共有パッケージ
└── web/                        # 静的Webページ
```

## 1.2 既存API一覧（mod.rsより）

### Public API Routes

| カテゴリ | メソッド | エンドポイント | 状態 | 備考 |
|---------|---------|---------------|:----:|------|
| Health | GET | /health | ✅ | ヘルスチェック |
| Lock | POST | /lock | ✅ | Lock作成（API-002） |
| Unlock | POST | /unlock | ✅ | 通常Unlock（API-003） |
| Unlock | POST | /unlock/emergency | ✅ | 緊急Unlock |
| Status | GET | /status/:lock_id | ✅ | Lock状態取得（API-004） |
| Status | GET | /status/pending | ✅ | 保留中Unlock一覧 |
| Prover | POST | /prover/register | ✅ | Prover登録 |
| Prover | GET | /prover/:prover_id | ✅ | Prover情報取得 |
| Edition | GET | /edition | ✅ | 現在Edition取得（API-006） |
| Edition | POST | /edition/switch | ✅ | Edition切替 |

### Admin API Routes (/api/*)

| カテゴリ | メソッド | エンドポイント | 状態 | 備考 |
|---------|---------|---------------|:----:|------|
| Prover | GET | /api/provers | ✅ | Prover一覧 |
| Prover | POST | /api/provers/register | ✅ | Prover登録 |
| Prover | POST | /api/provers/:id/approve | ✅ | Prover承認 |
| Prover | POST | /api/provers/:id/reject | ✅ | Prover却下 |
| Prover | POST | /api/provers/:id/suspend | ✅ | Prover停止 |
| Provider | GET | /api/providers | ✅ | Provider一覧 |
| Provider | POST | /api/providers/register | ✅ | Provider登録 |
| System | GET | /api/system/status | ✅ | システム状態 |
| System | POST | /api/system/pause | ✅ | システム一時停止 |
| System | POST | /api/system/unpause | ✅ | システム再開 |
| Analytics | GET | /api/analytics/overview | ✅ | 分析概要 |
| Edition | GET | /api/edition/current | ✅ | 現在Edition |
| Edition | POST | /api/edition/switch | ✅ | Edition切替 |

## 1.3 Admin Dashboard 既存ページ

| ページ | パス | 状態 |
|-------|-----|:----:|
| Dashboard | / | ✅ |
| Analytics | /analytics | ✅ |
| Edition管理 | /edition | ✅ |
| Emergency | /emergency | ✅ |
| Prover管理 | /provers | ✅ |
| Provider管理 | /providers | ✅ |

---

# Part 2: 不足しているAPI（P0必須）

## 2.1 認証API

| エンドポイント | メソッド | 説明 | 優先度 |
|---------------|---------|------|:------:|
| /auth/siwe/nonce | GET | SIWE用ノンス取得 | P0 |
| /auth/siwe/verify | POST | SIWE署名検証 | P0 |
| /auth/login | POST | Email+Password認証 | P0 |
| /auth/2fa/verify | POST | 2FA検証 | P0 |
| /auth/webauthn/challenge | GET | WebAuthn Challenge取得 | P1 |
| /auth/webauthn/register | POST | WebAuthn登録 | P1 |
| /auth/webauthn/authenticate | POST | WebAuthn認証 | P1 |
| /auth/refresh | POST | トークン更新 | P0 |
| /auth/logout | POST | ログアウト | P0 |
| /auth/password/forgot | POST | パスワードリセット要求 | P1 |
| /auth/password/reset | POST | パスワードリセット実行 | P1 |

## 2.2 ユーザーAPI

| エンドポイント | メソッド | 説明 | 優先度 |
|---------------|---------|------|:------:|
| /users/register | POST | ユーザー登録（公開鍵） | P0 |
| /users/me | GET | 自分の情報 | P0 |
| /users/me | PUT | 情報更新 | P1 |
| /users/me | DELETE | アカウント削除 | P2 |
| /users/:address | GET | ユーザー情報（公開） | P1 |
| /users/me/locks | GET | 自分のLock一覧 | P0 |
| /users/me/unlocks | GET | 自分のUnlock一覧 | P0 |
| /users/me/history | GET | 履歴一覧 | P0 |

## 2.3 Token Hub API

| エンドポイント | メソッド | 説明 | 優先度 |
|---------------|---------|------|:------:|
| /veqs/lock | POST | veQSロック | P0 |
| /veqs/unlock | POST | veQSアンロック | P0 |
| /veqs/extend | POST | ロック期間延長 | P1 |
| /veqs/me | GET | 自分のveQS情報 | P0 |
| /veqs/voting-power/:address | GET | 投票力取得 | P0 |
| /delegates | GET | Delegate一覧 | P0 |
| /delegates/:address | GET | Delegate詳細 | P0 |
| /delegates | POST | Delegate登録 | P1 |
| /delegates/:address | PUT | Delegate更新 | P1 |
| /delegations | POST | 委任実行 | P0 |
| /delegations/me | GET | 自分の委任一覧 | P0 |
| /delegations/:id | DELETE | 委任解除 | P0 |

## 2.4 Governance API

| エンドポイント | メソッド | 説明 | 優先度 |
|---------------|---------|------|:------:|
| /proposals | GET | 提案一覧 | P1 |
| /proposals/:id | GET | 提案詳細 | P1 |
| /proposals | POST | 提案作成 | P1 |
| /proposals/:id/vote | POST | 投票 | P1 |
| /proposals/me | GET | 自分の提案一覧 | P1 |
| /votes/me | GET | 自分の投票一覧 | P1 |

## 2.5 Prover詳細API

| エンドポイント | メソッド | 説明 | 優先度 |
|---------------|---------|------|:------:|
| /provers/apply | POST | Prover申請 | P0 |
| /provers/applications/me | GET | 自分の申請状況 | P0 |
| /provers/applications/:id/questions | POST | 追加質問回答 | P1 |
| /provers/me | GET | 自分のProver情報 | P0 |
| /provers/me/signatures | GET | 署名キュー | P0 |
| /provers/me/signatures/:id | POST | 署名実行 | P0 |
| /provers/me/rewards | GET | 報酬情報 | P0 |
| /provers/me/rewards/claim | POST | 報酬請求 | P0 |
| /provers/me/stake | GET | Stake情報 | P0 |
| /provers/me/stake/add | POST | Stake追加 | P1 |
| /provers/me/stake/withdraw | POST | Stake引出し | P1 |
| /provers/me/challenges | GET | 受けたChallenge | P0 |
| /provers/me/challenges/:id/defense | POST | Defense提出 | P0 |
| /provers/me/exit | POST | 退出申請 | P1 |
| /provers | GET | Prover一覧（公開） | P1 |
| /provers/:address | GET | Prover詳細（公開） | P1 |

## 2.6 Observer/Challenger API

| エンドポイント | メソッド | 説明 | 優先度 |
|---------------|---------|------|:------:|
| /observers/register | POST | Observer登録 | P1 |
| /observers/me | GET | 自分のObserver情報 | P1 |
| /observers/me/stake | GET | Stake情報 | P1 |
| /observers/me/stake/withdraw | POST | Stake引出し | P1 |
| /challenges | POST | Challenge提起 | P1 |
| /challenges/me | GET | 自分のChallenge一覧 | P1 |
| /challenges/:id | GET | Challenge詳細 | P1 |
| /challenges/pending | GET | 進行中Unlock一覧 | P1 |
| /challenges/suspicious | GET | 疑わしいアクティビティ | P1 |

## 2.7 Explorer API

| エンドポイント | メソッド | 説明 | 優先度 |
|---------------|---------|------|:------:|
| /explorer/stats | GET | 全体統計 | P1 |
| /explorer/locks | GET | Lock一覧 | P1 |
| /explorer/locks/:id | GET | Lock詳細 | P1 |
| /explorer/unlocks | GET | Unlock一覧 | P1 |
| /explorer/unlocks/:id | GET | Unlock詳細 | P1 |
| /explorer/challenges | GET | Challenge一覧 | P1 |
| /explorer/challenges/:id | GET | Challenge詳細 | P1 |
| /explorer/addresses/:address | GET | アドレス詳細 | P1 |
| /explorer/provers | GET | Prover一覧 | P1 |
| /explorer/provers/:address | GET | Prover詳細 | P1 |
| /explorer/charts/tvl | GET | TVL推移 | P1 |
| /explorer/charts/volume | GET | 取引量推移 | P1 |
| /explorer/search | GET | 検索 | P1 |

## 2.8 Enterprise API

| エンドポイント | メソッド | 説明 | 優先度 |
|---------------|---------|------|:------:|
| /enterprise/contact | POST | 問い合わせ | P1 |
| /enterprise/me | GET | 自社情報 | P1 |
| /enterprise/users | GET | ユーザー一覧 | P1 |
| /enterprise/users | POST | ユーザー招待 | P1 |
| /enterprise/users/:id | PUT | ユーザー更新 | P1 |
| /enterprise/users/:id | DELETE | ユーザー削除 | P1 |
| /enterprise/api-keys | GET | APIキー一覧 | P1 |
| /enterprise/api-keys | POST | APIキー作成 | P1 |
| /enterprise/api-keys/:id | DELETE | APIキー削除 | P1 |
| /enterprise/transactions | GET | TX一覧 | P1 |
| /enterprise/transactions/:id | GET | TX詳細 | P1 |
| /enterprise/analytics | GET | 分析データ | P1 |
| /enterprise/reports | GET | レポート一覧 | P2 |
| /enterprise/reports/generate | POST | レポート生成 | P2 |
| /enterprise/tickets | GET | チケット一覧 | P2 |
| /enterprise/tickets | POST | チケット作成 | P2 |

## 2.9 通知API

| エンドポイント | メソッド | 説明 | 優先度 |
|---------------|---------|------|:------:|
| /notifications | GET | 通知一覧 | P1 |
| /notifications/:id/read | POST | 既読化 | P1 |
| /notifications/settings | GET | 通知設定取得 | P1 |
| /notifications/settings | PUT | 通知設定更新 | P1 |

## 2.10 QS Admin API（追加）

| エンドポイント | メソッド | 説明 | 優先度 |
|---------------|---------|------|:------:|
| /admin/provers/applications | GET | 申請一覧 | P0 |
| /admin/provers/applications/:id | GET | 申請詳細 | P0 |
| /admin/provers/applications/:id/approve | POST | 承認 | P0 |
| /admin/provers/applications/:id/reject | POST | 却下 | P0 |
| /admin/provers/:address/suspend | POST | 停止 | P0 |
| /admin/customers | GET | 顧客一覧 | P1 |
| /admin/customers/:id | GET | 顧客詳細 | P1 |
| /admin/staff | GET | スタッフ一覧 | P1 |
| /admin/staff | POST | スタッフ追加 | P1 |
| /admin/staff/:id | PUT | スタッフ更新 | P1 |
| /admin/audit-logs | GET | 監査ログ | P0 |
| /admin/reports | GET | レポート | P1 |

---

# Part 3: フロントエンド共通コンポーネント

## 3.1 packages構成

```
packages/
├── ui/                    # 共通UIコンポーネント
│   ├── Button
│   ├── Input
│   ├── Modal
│   ├── Card
│   ├── Table
│   ├── Form
│   ├── Toast
│   ├── Tabs
│   ├── Dropdown
│   ├── Pagination
│   ├── Loading
│   ├── Error
│   ├── Empty
│   └── ...
│
├── crypto/                # 暗号処理
│   ├── dilithium/        # Dilithium WASM
│   │   ├── generate()
│   │   ├── sign()
│   │   └── verify()
│   ├── storage/          # 鍵ストレージ
│   │   ├── save()
│   │   ├── load()
│   │   └── delete()
│   └── backup/           # バックアップ
│       ├── export()
│       └── import()
│
├── web3/                  # Web3統合
│   ├── wagmi.config.ts
│   ├── chains.ts
│   ├── contracts/
│   │   ├── QSVault.ts
│   │   ├── QSStaking.ts
│   │   └── QSGovernance.ts
│   ├── hooks/
│   │   ├── useConnect.ts
│   │   ├── useSIWE.ts
│   │   ├── useLock.ts
│   │   ├── useUnlock.ts
│   │   ├── useVeQS.ts
│   │   └── ...
│   └── providers/
│       └── Web3Provider.tsx
│
├── api-client/            # API Client
│   ├── client.ts          # axios instance
│   ├── interceptors.ts    # 認証インターセプター
│   ├── endpoints/
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── veqs.ts
│   │   ├── provers.ts
│   │   ├── explorer.ts
│   │   └── ...
│   └── types/
│       └── api.ts
│
├── state/                 # 状態管理
│   ├── store.ts           # Zustand store
│   ├── auth.ts
│   ├── user.ts
│   ├── notifications.ts
│   └── ...
│
└── utils/                 # ユーティリティ
    ├── format.ts          # フォーマッター
    ├── validation.ts      # バリデーション
    ├── constants.ts       # 定数
    └── ...
```

---

# Part 4: 開発計画（12週間）

## 4.1 Week 1-2: 基盤構築

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Week 1-2: 基盤構築                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  目標:                                                                          │
│  • Turborepo monorepo設定                                                       │
│  • 共通パッケージ作成（ui, crypto, web3, api-client）                          │
│  • デザインシステム構築（Tailwind + shadcn/ui）                                │
│  • 認証基盤（SIWE）                                                             │
│  • CI/CD設定                                                                    │
│                                                                                 │
│  成果物:                                                                        │
│  • /packages/ui: 基本コンポーネント20種                                        │
│  • /packages/crypto: Dilithium WASM統合                                        │
│  • /packages/web3: wagmi設定、基本hooks                                        │
│  • /packages/api-client: 認証API対応                                           │
│  • GitHub Actions: lint, test, build                                           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 4.2 Week 3-4: Consumer App MVP

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      Week 3-4: Consumer App MVP                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  目標:                                                                          │
│  • Consumer App基本構造                                                         │
│  • LP、How It Works                                                            │
│  • Onboarding（Wallet接続、Dilithium鍵生成）                                   │
│  • Lock Flow                                                                    │
│  • Dashboard                                                                    │
│                                                                                 │
│  成果物:                                                                        │
│  • /apps/consumer: 15画面実装                                                  │
│  • Lock Flow完全動作（Sepolia）                                                │
│  • Dilithium鍵生成・保存・復元                                                 │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 4.3 Week 5-6: Consumer App + QS Admin

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                   Week 5-6: Consumer App + QS Admin                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  目標:                                                                          │
│  • Consumer App: Unlock Flow（Normal + Emergency）                              │
│  • Consumer App: History、Settings                                              │
│  • QS Admin: Prover管理拡張                                                    │
│  • QS Admin: Transaction Monitor                                               │
│                                                                                 │
│  成果物:                                                                        │
│  • /apps/consumer: 25画面完成                                                  │
│  • /apps/admin: Prover承認フロー                                               │
│  • Unlock Flow完全動作（Time Lock含む）                                        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 4.4 Week 7-8: Prover Portal + Token Hub

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    Week 7-8: Prover Portal + Token Hub                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  目標:                                                                          │
│  • Prover Portal: 登録フロー                                                   │
│  • Prover Portal: Dashboard、署名キュー                                        │
│  • Token Hub: veQS Lock/Unlock                                                 │
│  • Token Hub: Delegation                                                       │
│                                                                                 │
│  成果物:                                                                        │
│  • /apps/prover: 20画面実装                                                    │
│  • /apps/token-hub: 15画面実装                                                 │
│  • Prover申請→承認フロー動作                                                   │
│  • veQS Lock動作                                                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 4.5 Week 9-10: Governance + Explorer

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     Week 9-10: Governance + Explorer                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  目標:                                                                          │
│  • Governance: 投票フロー                                                       │
│  • Governance: 提案作成                                                         │
│  • Explorer: 基本機能（検索、一覧、詳細）                                       │
│  • QS Admin: Community管理                                                      │
│                                                                                 │
│  成果物:                                                                        │
│  • /apps/governance: 15画面実装                                                │
│  • /apps/explorer: 14画面実装                                                  │
│  • 投票フロー動作                                                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 4.6 Week 11-12: Enterprise + 仕上げ

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      Week 11-12: Enterprise + 仕上げ                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  目標:                                                                          │
│  • Enterprise Admin: 基本機能                                                  │
│  • QS Admin: Customer管理                                                      │
│  • Observer/Challenger: 基本機能                                               │
│  • サービス全体サイト: LP                                                      │
│  • 統合テスト                                                                  │
│  • パフォーマンス最適化                                                        │
│                                                                                 │
│  成果物:                                                                        │
│  • /apps/enterprise: 20画面実装                                                │
│  • /apps/observer: 10画面実装                                                  │
│  • /apps/website: LP完成                                                       │
│  • E2Eテスト: 主要フロー                                                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# Part 5: 統合時リスクと対策

## 5.1 技術的リスク

| リスク | 影響度 | 対策 |
|-------|:------:|------|
| Dilithium WASM パフォーマンス | 高 | Web Worker化、プログレスUI |
| L3との通信遅延 | 中 | 楽観的UI更新、ポーリング |
| ウォレット互換性 | 中 | 複数ウォレット対応、フォールバック |
| モバイル鍵管理 | 高 | WebAuthn統合、バックアップ強制 |

## 5.2 ビジネスリスク

| リスク | 影響度 | 対策 |
|-------|:------:|------|
| Enterprise価格未定 | 中 | Billing画面は後回し |
| Prover経済モデル調整 | 中 | パラメータ化 |
| 法的要件 | 低 | Legal画面は後から追加 |

## 5.3 チェックポイント

| Week | チェック項目 |
|:----:|-------------|
| 2 | 基盤構築完了、Dilithium WASM動作確認 |
| 4 | Consumer App MVP、Lock Flow E2E |
| 6 | Unlock Flow完全動作 |
| 8 | Prover申請フロー、veQS Lock |
| 10 | Governance投票、Explorer検索 |
| 12 | 全システム統合、E2Eテスト通過 |

---

**END OF INTEGRATION**
