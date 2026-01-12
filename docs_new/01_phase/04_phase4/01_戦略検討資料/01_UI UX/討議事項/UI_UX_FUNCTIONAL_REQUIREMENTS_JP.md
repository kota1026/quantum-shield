# Quantum Shield - UI/UX 機能要件定義書
> 作成日: 2026-01-04
> 目的: ペルソナ別UI/UXフローから必要機能を逆算

---

## 1. アーキテクチャ概要

### エディション切替モデル

```
┌─────────────────────────────────────────────────────────────┐
│                    Quantum Shield Platform                   │
├─────────────────────────────────────────────────────────────┤
│                      Edition Selector                        │
│            ┌──────────┐         ┌──────────┐                │
│            │Enterprise│ ◄─────► │Decentralized│             │
│            └──────────┘         └──────────┘                │
│                 │                     │                      │
│    ┌────────────┴────────────────────┴────────────┐         │
│    │              共通コアシステム                  │         │
│    │  • L1 Vault  • L3 Aegis  • STARK Prover     │         │
│    └───────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### 4つのペルソナ

| # | ペルソナ | 日本語 | 説明 |
|---|---------|--------|------|
| 1 | **Admin** | システム管理者 | Kota / QS運営チーム |
| 2 | **Service Provider** | サービス提供者 | Enterprise Edition を購入した企業 |
| 3 | **Prover** | プルーバー | 署名サービス提供者（5社〜） |
| 4 | **End User** | エンドユーザー | 資産をLock/Unlockする一般ユーザー |

---

## 2. ペルソナ別 UI/UX フロー

---

### 2.1 Admin（システム管理者）

#### 対象者
- Kota（CEO）
- QS運営チーム
- DevOpsエンジニア

#### 画面一覧

```
Admin Dashboard
├── 1. システム概要
│   ├── 全体ステータス（正常/警告/異常）
│   ├── TVL サマリー
│   ├── アクティブ Lock/Unlock 数
│   └── L3 ノード状態
│
├── 2. エディション管理
│   ├── モード切替（Enterprise ⇔ Decentralized）
│   ├── 現在のモード表示
│   ├── モード別設定パラメータ
│   └── 切替履歴
│
├── 3. L3 ノード管理
│   ├── ノード一覧（4ノード）
│   ├── 各ノードの状態
│   │   ├── CPU/メモリ/ディスク
│   │   ├── ブロック高
│   │   ├── コンセンサス状態
│   │   └── 接続ピア数
│   ├── ノード追加/削除（Decentralizedモード時）
│   └── ノード再起動
│
├── 4. Prover 管理
│   ├── Prover 一覧
│   ├── 登録申請の承認/却下
│   ├── Prover 停止/再開
│   ├── Stake 状況
│   └── パフォーマンス指標
│
├── 5. トランザクション監視
│   ├── Lock 一覧
│   ├── Unlock 一覧（進行中/完了）
│   ├── Challenge 一覧
│   ├── Slashing イベント
│   └── 異常検知アラート
│
├── 6. 緊急対応
│   ├── Emergency Pause（緊急停止）
│   ├── Pause 履歴
│   ├── 復旧手順
│   └── インシデント管理
│
├── 7. 設定
│   ├── パラメータ設定
│   │   ├── Time Lock 期間
│   │   ├── Emergency Bond 率
│   │   ├── Slashing 係数
│   │   └── 手数料率
│   ├── アラート設定
│   ├── ユーザー管理（Admin権限）
│   └── API キー管理
│
├── 8. レポート
│   ├── 日次/週次/月次レポート
│   ├── TVL 推移
│   ├── 手数料収益
│   ├── Prover パフォーマンス
│   └── エクスポート（CSV/PDF）
│
└── 9. 監査ログ
    ├── 全操作履歴
    ├── ユーザー別ログ
    └── セキュリティイベント
```

#### 必要な機能（バックエンド）

| # | 機能 | 説明 | コンポーネント |
|---|------|------|---------------|
| A-1 | エディション切替API | Enterprise/Decentralized切替 | **[NEW]** Edition Manager |
| A-2 | ノード管理API | L3ノードの状態取得/操作 | aegis-node + **[NEW]** Node Manager API |
| A-3 | Prover管理API | 承認/停止/状態取得 | **[NEW]** Prover Manager API |
| A-4 | トランザクション監視API | Lock/Unlock/Challenge一覧 | **[NEW]** TX Monitor API |
| A-5 | Emergency Pause API | 緊急停止/復旧 | L1Vault.sol + **[NEW]** Pause API |
| A-6 | パラメータ設定API | 各種パラメータ変更 | **[NEW]** Config Manager API |
| A-7 | レポート生成API | 各種レポート生成 | **[NEW]** Report Service |
| A-8 | 監査ログAPI | 操作履歴取得 | **[NEW]** Audit Log Service |

---

### 2.2 Service Provider（サービス提供者）

#### 対象者
- Enterprise Edition を購入した金融機関
- 銀行、証券、保険、決済会社
- システムインテグレーター

#### 画面一覧

```
Service Provider Portal
├── 1. ダッシュボード
│   ├── 契約ステータス
│   ├── 自社 TVL
│   ├── 月間トランザクション数
│   └── サービス稼働状況
│
├── 2. 契約管理
│   ├── 契約プラン詳細
│   ├── 請求/支払い履歴
│   ├── SLA 状況
│   └── 契約更新
│
├── 3. 自社ノード管理（オプション）
│   ├── 専用ノード状態
│   ├── ノード設定
│   └── バックアップ設定
│
├── 4. Prover 設定
│   ├── 利用可能 Prover 一覧
│   ├── 優先 Prover 設定
│   └── Prover パフォーマンスレポート
│
├── 5. トランザクション管理
│   ├── 自社 Lock/Unlock 一覧
│   ├── 状態追跡
│   ├── 手数料明細
│   └── エクスポート
│
├── 6. API 管理
│   ├── API キー発行/管理
│   ├── API 使用量
│   ├── Rate Limit 設定
│   └── Webhook 設定
│
├── 7. ユーザー管理
│   ├── 自社ユーザー一覧
│   ├── 権限設定
│   └── 招待
│
├── 8. レポート
│   ├── 月次レポート
│   ├── 監査レポート
│   └── コンプライアンスレポート
│
└── 9. サポート
    ├── チケット作成
    ├── FAQ
    └── ドキュメント
```

#### 必要な機能（バックエンド）

| # | 機能 | 説明 | コンポーネント |
|---|------|------|---------------|
| SP-1 | テナント管理API | 契約/請求/SLA | **[NEW]** Tenant Manager |
| SP-2 | 専用ノードAPI | 専用ノード操作（オプション） | **[NEW]** Dedicated Node API |
| SP-3 | テナント別TX API | 自社トランザクション取得 | **[NEW]** Tenant TX API |
| SP-4 | APIキー管理 | キー発行/無効化 | **[NEW]** API Key Service |
| SP-5 | Webhook管理 | イベント通知設定 | **[NEW]** Webhook Service |
| SP-6 | テナントユーザー管理 | 自社ユーザーCRUD | **[NEW]** User Management |
| SP-7 | コンプライアンスレポート | 監査用レポート生成 | **[NEW]** Compliance Report |

---

### 2.3 Prover（プルーバー）

#### 対象者
- Phase 1-2: QS 3社 + パートナー 2社
- Phase 3+: Permissionless 参加者

#### 画面一覧

```
Prover Dashboard
├── 1. ステータス概要
│   ├── 自社 Prover 状態（Active/Inactive）
│   ├── Stake 残高
│   ├── 報酬残高
│   ├── パフォーマンス指標
│   └── ランキング（Decentralized時）
│
├── 2. 登録/管理
│   ├── 新規登録申請
│   │   ├── 基本情報入力
│   │   ├── HSM 証明アップロード
│   │   ├── マルチシグ設定
│   │   └── 契約書同意（Enterprise）/ Stake（Decentralized）
│   ├── 登録状態確認
│   ├── 情報更新
│   └── 退出申請
│
├── 3. Stake 管理
│   ├── Stake 追加
│   ├── Stake 引出（アンボンディング）
│   ├── アンボンディング状態
│   └── Stake 履歴
│
├── 4. 署名業務
│   ├── 署名要求キュー
│   ├── 署名履歴
│   ├── 署名成功率
│   └── 応答時間統計
│
├── 5. 報酬
│   ├── 報酬残高
│   ├── 報酬履歴
│   ├── 報酬引出
│   └── 報酬予測
│
├── 6. Slashing
│   ├── Slashing 履歴
│   ├── 現在の Challenge
│   ├── Defense 提出
│   └── Slashing リスク指標
│
├── 7. インフラ管理
│   ├── HSM 状態
│   ├── ノード接続状態
│   ├── バックアップ設定
│   └── アラート設定
│
├── 8. API
│   ├── 署名 API エンドポイント
│   ├── API キー管理
│   └── API ログ
│
└── 9. 設定
    ├── 通知設定
    ├── 自動署名設定
    └── セキュリティ設定
```

#### 必要な機能（バックエンド）

| # | 機能 | 説明 | コンポーネント |
|---|------|------|---------------|
| P-1 | Prover登録API | 登録申請/状態確認 | L1 Staking + **[NEW]** Registration API |
| P-2 | Stake管理API | Stake/Unstake/状態 | L1 Staking + **[NEW]** Stake API |
| P-3 | 署名キューAPI | 署名要求の取得/応答 | **[NEW]** Signature Queue Service |
| P-4 | 報酬API | 残高/履歴/引出 | L1 + **[NEW]** Reward API |
| P-5 | Defense API | Challenge への Defense 提出 | L1Vault.sol + **[NEW]** Defense API |
| P-6 | HSM連携API | HSM状態確認/署名実行 | **[NEW]** HSM Integration |
| P-7 | Prover Analytics | パフォーマンス分析 | **[NEW]** Analytics Service |

---

### 2.4 End User（エンドユーザー）

#### 対象者
- 一般の暗号資産保有者
- DeFi ユーザー
- 機関投資家

#### 画面一覧

```
User Application
├── 1. ダッシュボード
│   ├── 総資産残高
│   ├── Lock 中の資産
│   ├── Unlock 進行中
│   └── 履歴サマリー
│
├── 2. Lock（資産をロック）
│   ├── Lock 作成
│   │   ├── 資産選択
│   │   ├── 金額入力
│   │   ├── 手数料確認
│   │   ├── ウォレット接続（MetaMask等）
│   │   └── トランザクション署名
│   ├── Lock 確認待ち
│   └── Lock 完了
│
├── 3. Unlock（資産を引き出し）
│   ├── Unlock 対象選択
│   ├── Unlock 方法選択
│   │   ├── 通常 Unlock（24時間）
│   │   └── 緊急 Unlock（7日 + Bond）
│   ├── Dilithium 署名
│   ├── Prover 署名待ち
│   ├── Time Lock カウントダウン
│   └── Unlock 完了/資産受取
│
├── 4. 資産管理
│   ├── Lock 中の資産一覧
│   ├── 各 Lock の詳細
│   │   ├── Lock ID
│   │   ├── 金額
│   │   ├── Lock 日時
│   │   ├── 状態
│   │   └── State Root
│   └── 資産履歴
│
├── 5. トランザクション履歴
│   ├── 全履歴一覧
│   ├── フィルター（Lock/Unlock/手数料）
│   ├── 詳細表示
│   └── エクスポート
│
├── 6. 鍵管理
│   ├── Dilithium 鍵ペア生成
│   ├── 公開鍵登録
│   ├── 鍵バックアップ
│   └── 鍵復元
│
├── 7. 設定
│   ├── 通知設定
│   ├── ウォレット接続管理
│   ├── 言語設定
│   └── セキュリティ設定
│
└── 8. ヘルプ
    ├── 使い方ガイド
    ├── FAQ
    ├── サポート問い合わせ
    └── 用語集
```

#### 必要な機能（バックエンド）

| # | 機能 | 説明 | コンポーネント |
|---|------|------|---------------|
| U-1 | Lock API | Lock作成/確認 | L1Vault.sol + L3 + **[NEW]** Lock API |
| U-2 | Unlock API | Unlock申請/状態追跡 | L1Vault.sol + L3 + **[NEW]** Unlock API |
| U-3 | 資産残高API | Lock中資産の取得 | **[NEW]** Balance API |
| U-4 | TX履歴API | トランザクション履歴 | **[NEW]** History API |
| U-5 | Dilithium鍵生成 | ブラウザ/アプリ内鍵生成 | **[NEW]** Key Manager (Client-side) |
| U-6 | 状態追跡API | Lock/Unlock進捗の追跡 | **[NEW]** Status Tracker API |
| U-7 | 手数料見積API | 手数料の事前計算 | **[NEW]** Fee Estimator API |

---

## 3. 機能マトリックス（まとめ）

### 新規必要コンポーネント一覧

| カテゴリ | コンポーネント | 対象ペルソナ | 優先度 |
|---------|---------------|-------------|--------|
| **共通基盤** | | | |
| | Edition Manager | Admin | P0 |
| | API Gateway | All | P0 |
| | Auth Service | All | P0 |
| | Audit Log Service | Admin, SP | P1 |
| **Admin系** | | | |
| | Node Manager API | Admin | P0 |
| | Prover Manager API | Admin | P0 |
| | TX Monitor API | Admin | P0 |
| | Pause API | Admin | P0 |
| | Config Manager API | Admin | P1 |
| | Report Service | Admin, SP | P1 |
| **Service Provider系** | | | |
| | Tenant Manager | SP | P1 |
| | Dedicated Node API | SP | P2 |
| | Tenant TX API | SP | P1 |
| | API Key Service | SP, Prover | P1 |
| | Webhook Service | SP, Prover | P2 |
| | User Management | SP | P1 |
| | Compliance Report | SP | P2 |
| **Prover系** | | | |
| | Registration API | Prover | P0 |
| | Stake API | Prover | P0 |
| | Signature Queue Service | Prover | P0 |
| | Reward API | Prover | P1 |
| | Defense API | Prover | P1 |
| | HSM Integration | Prover | P0 |
| | Prover Analytics | Prover | P2 |
| **End User系** | | | |
| | Lock API | User | P0 |
| | Unlock API | User | P0 |
| | Balance API | User | P0 |
| | History API | User | P1 |
| | Key Manager (Client) | User | P0 |
| | Status Tracker API | User | P0 |
| | Fee Estimator API | User | P1 |

---

## 4. エディション別機能差分

### 機能の有効/無効

| 機能 | Enterprise | Decentralized | 備考 |
|------|:----------:|:-------------:|------|
| **ノード管理** | | | |
| 固定4ノード | ✅ | Phase 1-3のみ | |
| 動的ノード追加 | ❌ | Phase 4+ | |
| **Prover管理** | | | |
| 契約ベース承認 | ✅ | ❌ | |
| Council承認 | ❌ | Phase 3 | |
| 自動承認（Stake） | ❌ | Phase 4+ | |
| **ガバナンス** | | | |
| Token Vote | ❌ | Phase 3+ | |
| veQS | ❌ | Phase 3+ | |
| Purpose Committee | ❌ | Phase 3+ | |
| Security Council | オプション | ✅ | |
| **その他** | | | |
| SLA 保証 | ✅ | ❌ | |
| 専用サポート | ✅ | コミュニティ | |
| コンプライアンスレポート | ✅ | ❌ | |

---

## 5. 画面フロー図

### 5.1 End User: Lock フロー

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Dashboard  │────►│  Lock 作成  │────►│ 金額入力    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌─────────────┐     ┌──────▼──────┐
                    │  Lock 完了  │◄────│ TX 署名     │
                    │  (確認待ち) │     │ (MetaMask)  │
                    └──────┬──────┘     └─────────────┘
                           │
                    ┌──────▼──────┐
                    │  L3 確認    │
                    │  (BFT合意)  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Lock 確定  │
                    │  Dashboard  │
                    └─────────────┘
```

### 5.2 End User: Unlock フロー（通常）

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Dashboard  │────►│ Unlock選択  │────►│ 方法選択    │
└─────────────┘     └─────────────┘     │ ・通常(24h) │
                                        │ ・緊急(7d)  │
                                        └──────┬──────┘
                                               │ 通常選択
                    ┌─────────────┐     ┌──────▼──────┐
                    │ Prover署名  │◄────│ Dilithium   │
                    │ 待ち        │     │ 署名        │
                    └──────┬──────┘     └─────────────┘
                           │
                    ┌──────▼──────┐     ┌─────────────┐
                    │ VRF Prover  │────►│ 2/5 署名    │
                    │ 選出        │     │ 収集        │
                    └─────────────┘     └──────┬──────┘
                                               │
                    ┌─────────────┐     ┌──────▼──────┐
                    │ Unlock 完了 │◄────│ 24h Time    │
                    │ 資産受取    │     │ Lock 待機   │
                    └─────────────┘     └─────────────┘
```

### 5.3 Prover: 署名フロー

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Dashboard  │────►│ 署名キュー  │────►│ 署名要求    │
└─────────────┘     │ 確認        │     │ 詳細確認    │
                    └─────────────┘     └──────┬──────┘
                                               │
                    ┌─────────────┐     ┌──────▼──────┐
                    │ 署名完了    │◄────│ HSM 署名    │
                    │ 報酬加算    │     │ (SPHINCS+)  │
                    └─────────────┘     └─────────────┘
```

---

## 6. 技術スタック提案

### フロントエンド

| コンポーネント | 技術 | 理由 |
|---------------|------|------|
| Admin Dashboard | React + TypeScript | 複雑な管理画面に適切 |
| Service Provider Portal | React + TypeScript | Admin と共通化 |
| Prover Dashboard | React + TypeScript | 同上 |
| End User App | React + TypeScript | ウォレット統合しやすい |
| Mobile App | React Native | クロスプラットフォーム |

### バックエンド API

| コンポーネント | 技術 | 理由 |
|---------------|------|------|
| API Gateway | Kong / AWS API Gateway | 認証・レート制限 |
| API Server | Rust (Axum) | L3 Aegis と統合 |
| Auth Service | JWT + OAuth2 | 標準的な認証 |
| DB | PostgreSQL | 履歴・設定保存 |
| Cache | Redis | セッション・キャッシュ |
| Message Queue | RabbitMQ / Kafka | 署名キュー |

### クライアントライブラリ

| コンポーネント | 技術 | 理由 |
|---------------|------|------|
| Dilithium 鍵生成 | WebAssembly (Rust) | ブラウザ内で安全に |
| ウォレット接続 | ethers.js / wagmi | MetaMask等統合 |

---

## 7. 既存コンポーネントとのマッピング

### 既存（実装済み）

| 機能 | 既存コンポーネント | 状態 |
|------|-------------------|------|
| Lock 処理 | L1Vault.sol | ✅ |
| Unlock 処理 | L1Vault.sol | ✅ |
| SPHINCS+ 検証 | SPHINCSVerifier.sol | ✅ |
| VRF Prover選出 | VRFConsumer.sol | ✅ |
| Slashing | L1Vault.sol | ✅ |
| BFT コンセンサス | aegis-consensus | ✅ |
| Dilithium 署名 | aegis-crypto | ✅ |
| State Root 計算 | aegis-smt | ✅ |

### 未実装（新規必要）

| 機能 | 必要コンポーネント | 優先度 |
|------|-------------------|--------|
| **P0: E2E必須** | | |
| L3↔L1 イベントブリッジ | Event Bridge Service | P0 |
| Lock API | REST API + L3 Integration | P0 |
| Unlock API | REST API + L3 Integration | P0 |
| 署名キューサービス | Signature Queue (MQ) | P0 |
| HSM 統合 | HSM Adapter | P0 |
| Edition Manager | Config + Feature Flags | P0 |
| Dilithium 鍵生成 (Client) | WASM Module | P0 |
| **P1: MVP必須** | | |
| Balance API | DB + L1 Query | P1 |
| Status Tracker API | Event Indexer | P1 |
| Prover Registration API | L1 Staking Integration | P1 |
| Admin Dashboard | React App | P1 |
| User App | React App | P1 |
| **P2: 運用必須** | | |
| Report Service | Analytics + Export | P2 |
| Tenant Manager | Multi-tenancy | P2 |
| Webhook Service | Event Notification | P2 |

---

## 8. 次のアクション

### Phase A: コア API 実装（2週間）
1. Event Bridge Service（L3↔L1）
2. Lock API / Unlock API
3. Signature Queue Service
4. Edition Manager

### Phase B: ユーザー向け実装（2週間）
1. Dilithium WASM Module
2. End User App (MVP)
3. Status Tracker API

### Phase C: 運用基盤（2週間）
1. Admin Dashboard
2. Prover Dashboard
3. Monitoring / Alerting

---

## 9. 参考：シーケンス × ペルソナ × 画面マトリックス

| シーケンス | Admin | Service Provider | Prover | End User |
|-----------|:-----:|:----------------:|:------:|:--------:|
| #1 Lock | 監視 | TX確認 | - | **主操作** |
| #2 Unlock (通常) | 監視 | TX確認 | **署名** | **主操作** |
| #3 Unlock (緊急) | 監視 | TX確認 | - | **主操作** |
| #4 Challenge | **監視・対応** | 通知受信 | **Defense** | 通知受信 |
| #5 Prover Registration | **承認** | - | **主操作** | - |
| #6 Prover Exit | **確認** | - | **主操作** | - |
| #7 Governance | **参加** | - | 投票 | 投票 |
| #8 Emergency | **主操作** | 通知受信 | 通知受信 | 通知受信 |

---

**END OF DOCUMENT**
