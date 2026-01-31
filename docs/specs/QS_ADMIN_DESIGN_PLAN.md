# QS Admin 設計プロジェクト - マスタープラン v2.0

> **Project**: QS財団管理画面の設計
> **Version**: 2.0
> **Created**: 2026-01-26
> **Goal**: 1流企業レベルの設計書・要件定義・実装手順書を自動化で作成

---

## Executive Summary

### 目的
このプロジェクトは、Quantum Shield エコシステム全体を管理するQS Admin画面を設計するために、
まず既存アプリケーションの全操作を網羅的に分析し、完璧なデータモデルと実装仕様書を作成する。

### 7つのPhase

| Phase | 内容 | ゴール |
|:-----:|------|--------|
| **1** | 画面操作カタログ作成 | 全66画面の全操作を詳細にドキュメント化 |
| **2** | データフロー・ER図作成 | 操作に必要な全データを定義 |
| **3** | SEQUENCES.md統合 | 既存シーケンスとの整合性確保 |
| **4** | 開発要件特定 | 実在コードとのギャップ分析 |
| **5** | データ整合性チェック | ダブり・漏れ・用語統一 |
| **6** | 設計仕様書・実装手順書作成 | 1流企業レベル+実行プロンプト |
| **7** | QS Admin設計 | 要件定義・画面設計 |

### 最終成果物

| # | 成果物 | フォーマット | 品質基準 |
|---|--------|-------------|----------|
| 1 | 画面操作カタログ | Markdown | 全操作網羅 |
| 2 | 統合ER図 | Mermaid | SEQUENCES.md完全対応 |
| 3 | データ辞書 | Markdown | 用語統一・定義完備 |
| 4 | 開発要件一覧 | Markdown | API/Backend/DB要件 |
| 5 | API設計書 | OpenAPI 3.0 | 全エンドポイント定義 |
| 6 | **設計仕様書** | Markdown | 1流企業レベル |
| 7 | **実装手順書** | Markdown + Prompt | エージェント実行可能 |
| 8 | QS Admin要件定義 | Markdown | 全管理機能網羅 |
| 9 | QS Admin画面モック | HTML | Japan Premium準拠 |

---

## Phase Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Phase 1: 画面操作カタログ作成                                                │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Playwright MCP で全画面をスナップショット + 操作手順を詳細記録               │
│                                                                             │
│ 対象: Consumer(19), QS Hub(15), Governance(6), Prover(11), Observer(7),     │
│       Explorer(8) = 計66画面                                                │
│ 除外: Token Hub, Enterprise Admin, QS Admin                                 │
│                                                                             │
│ 成果物: docs/specs/operations/                                              │
│   ├── CONSUMER_OPERATIONS.md                                                │
│   ├── QS_HUB_OPERATIONS.md                                                  │
│   ├── GOVERNANCE_OPERATIONS.md                                              │
│   ├── PROVER_OPERATIONS.md                                                  │
│   ├── OBSERVER_OPERATIONS.md                                                │
│   └── EXPLORER_OPERATIONS.md                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ Phase 2: データフロー・ER図作成                                              │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Phase 1の操作から必要データを抽出 → 全エンティティ定義                       │
│                                                                             │
│ 成果物: docs/design/ER_DIAGRAM_V3.md                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ Phase 3: SEQUENCES.md 統合                                                  │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Phase 2のER図と SEQUENCES.md を照合・統合                                   │
│                                                                             │
│ 成果物: docs/core/SEQUENCES_V3.md (統合版)                                  │
│         docs/design/ER_DIAGRAM_V3.md (更新)                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ Phase 4: 開発要件特定                                                        │
│ ─────────────────────────────────────────────────────────────────────────── │
│ 実在コード群を確認し、開発が必要な項目を特定                                 │
│                                                                             │
│ 確認項目:                                                                   │
│ ・API有無 → 各操作に対応するエンドポイントがあるか                          │
│ ・バックエンド処理有無 → サーバーサイド処理が必要か                         │
│ ・データベース有無 → テーブル/スキーマが定義されているか                    │
│ ・スマートコントラクト連携 → オンチェーン処理が必要か                       │
│                                                                             │
│ 成果物: docs/specs/DEVELOPMENT_REQUIREMENTS.md                              │
│         docs/specs/API_SPECIFICATION.yaml                                   │
│         docs/specs/DATABASE_SCHEMA.md                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ Phase 5: データ整合性チェック ★NEW                                          │
│ ─────────────────────────────────────────────────────────────────────────── │
│ 全ドキュメントを横断的にチェックし、整合性を確保                            │
│                                                                             │
│ チェック項目:                                                               │
│ ・データ定義のダブり（同じデータが別名で定義されていないか）                │
│ ・データ定義の漏れ（操作に必要なデータが定義されているか）                  │
│ ・用語の不統一（同じ概念に異なる名前が使われていないか）                    │
│ ・型の不整合（同じフィールドに異なる型が使われていないか）                  │
│                                                                             │
│ 成果物: docs/specs/DATA_DICTIONARY.md (正式データ辞書)                      │
│         docs/specs/TERMINOLOGY_MAPPING.md (用語対応表)                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ Phase 6: 設計仕様書・実装手順書作成 ★NEW                                     │
│ ─────────────────────────────────────────────────────────────────────────── │
│ 1流企業レベルの設計仕様書と、実装エージェントが間違わない実装手順書を作成    │
│                                                                             │
│ 設計仕様書に含まれる内容:                                                   │
│ ・システムアーキテクチャ図                                                  │
│ ・コンポーネント設計                                                        │
│ ・インターフェース定義                                                      │
│ ・セキュリティ設計                                                          │
│ ・エラーハンドリング設計                                                    │
│                                                                             │
│ 実装手順書に含まれる内容:                                                   │
│ ・機能単位の実装ステップ                                                    │
│ ・各ステップの実行プロンプト（コピペで実行可能）                            │
│ ・テスト手順                                                                │
│ ・コードレビューチェックリスト                                              │
│                                                                             │
│ 成果物: docs/specs/DESIGN_SPECIFICATION.md                                  │
│         docs/specs/IMPLEMENTATION_PROCEDURES.md                             │
│         docs/specs/prompts/ (実行プロンプト集)                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ Phase 7: QS Admin 設計                                                       │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Phase 1-6 の成果物を基に、QS財団管理画面を設計                               │
│                                                                             │
│ 構成要素:                                                                   │
│ ├── Transactions (Dashboard, Lock, Unlock, Emergency, Challenge)            │
│ ├── Users (Dashboard, Total, Consumer詳細)                                  │
│ ├── Provers (Total, 申請管理, 詳細)                                         │
│ ├── Observers (Dashboard, 一覧)                                             │
│ ├── Token Hub (Dashboard, Proposal, Token Share)                            │
│ ├── QS Member Management (Security Council, Purpose Committee)              │
│ ├── System (Settings, Audit Log, Emergency Controls)                        │
│ └── Analytics (Volume, Growth, TVL, Participation)                          │
│                                                                             │
│ 成果物: docs/specs/QS_ADMIN_REQUIREMENTS.md                                 │
│         docs/design/mocks/qs-admin/*.html                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: 画面操作カタログ作成

### 1.1 対象システム

| System | Route Prefix | 画面数 | ファイル名 |
|--------|--------------|:------:|-----------|
| Consumer App | `/consumer/*` | 19 | CONSUMER_OPERATIONS.md |
| QS Hub | `/qs-hub/*` | 15 | QS_HUB_OPERATIONS.md |
| Governance | `/governance/*` | 6 | GOVERNANCE_OPERATIONS.md |
| Prover Portal | `/prover/*` | 11 | PROVER_OPERATIONS.md |
| Observer | `/observer/*` | 7 | OBSERVER_OPERATIONS.md |
| Explorer | `/explorer/*` | 8 | EXPLORER_OPERATIONS.md |
| **Total** | | **66** | |

**除外:**
- Token Hub - 使用予定なし（QS Hubに統合済み）
- Enterprise Admin - 後日設計
- QS Admin - 本プロジェクトで新規設計

### 1.2 操作カタログフォーマット

```markdown
# {System名} 操作カタログ

## 概要
- 総画面数: {N}
- 総操作数: {M}
- 最終更新: {date}

---

## 1. {画面名}

### 基本情報
| 項目 | 内容 |
|------|------|
| Route | `/consumer/dashboard` |
| Page Component | `apps/web/src/app/[locale]/consumer/dashboard/page.tsx` |
| 主要Components | `Dashboard.tsx`, `AssetCard.tsx`, `QuickActions.tsx` |
| 認証要否 | 要（ウォレット接続） |

### 画面状態
| State | 条件 | 表示内容 |
|-------|------|----------|
| 初期ロード | - | ローディングスピナー |
| 未接続 | !isConnected | ウォレット接続促進 |
| 残高あり | locks.length > 0 | ロック一覧表示 |
| 残高なし | locks.length === 0 | 空状態表示 |

### 操作一覧

| # | 操作名 | 要素 | トリガー | 結果 | 必要データ | 出力データ |
|---|--------|------|----------|------|-----------|-----------|
| 1 | 資産残高確認 | AssetCard | 表示時 | 残高表示 | `Lock[]` | - |
| 2 | ロック開始 | Button[ロックする] | Click | `/consumer/lock`に遷移 | - | - |
| 3 | アンロック選択 | LockItem | Click | アンロックモーダル表示 | `Lock.id` | `selectedLockId` |
| 4 | 通常アンロック実行 | Button[通常] | Click | Unlock Request作成 | `Lock`, `signature` | `UnlockRequest` |
| 5 | 緊急アンロック実行 | Button[緊急] | Click | Emergency Unlock開始 | `Lock`, `bondAmount` | `UnlockRequest` |
| 6 | 履歴表示 | Link[履歴] | Click | `/consumer/history`に遷移 | - | - |
| 7 | 設定表示 | Icon[設定] | Click | `/consumer/settings`に遷移 | - | - |

### データ依存関係
```yaml
Input:
  - User.walletAddress: string (ウォレット接続から)
  - Lock[]: array (API: GET /api/locks?user={address})
  - UnlockRequest[]: array (API: GET /api/unlocks?user={address})

Output:
  - UnlockRequest: object (API: POST /api/unlocks)

State:
  - selectedLockId: string | null
  - isModalOpen: boolean
  - isLoading: boolean
```

### 関連シーケンス
- Seq#1 Lock: 操作2「ロック開始」から開始
- Seq#2 Unlock Normal: 操作4「通常アンロック実行」で実行
- Seq#3 Unlock Emergency: 操作5「緊急アンロック実行」で実行

### スクリーンショット
- `docs/design/screenshots/consumer/dashboard-initial.png`
- `docs/design/screenshots/consumer/dashboard-with-locks.png`
- `docs/design/screenshots/consumer/dashboard-unlock-modal.png`

---

## 2. {次の画面名}
...
```

### 1.3 実行プロンプト

各プロンプトは独立して実行可能。前のプロンプトの成果物を参照する形式。

---

#### Prompt P1-1: Consumer App (前半)

```markdown
# Phase 1 - Prompt 1: Consumer App 操作カタログ (前半)

## 目的
Consumer App の landing, dashboard, lock, unlock 画面の操作を詳細に記録する。

## 実行手順

### Step 1: dev server 起動確認
```bash
cd /Users/kotakato/dev/quantum-shield/apps/web
pnpm dev
```
→ http://localhost:3000 でアクセス可能であることを確認

### Step 2: 画面スナップショット取得
Playwright MCP を使用して以下の画面をスナップショット:
1. http://localhost:3000/ja/consumer/landing
2. http://localhost:3000/ja/consumer/dashboard
3. http://localhost:3000/ja/consumer/lock
4. http://localhost:3000/ja/consumer/unlock

各画面で:
- スナップショット取得
- 全クリック可能要素の特定
- フォーム入力フィールドの特定
- 状態遷移の確認（ローディング、エラー、成功）

### Step 3: コンポーネント確認
以下のファイルを読み、操作に関わるロジックを抽出:
- apps/web/src/app/[locale]/consumer/landing/page.tsx
- apps/web/src/app/[locale]/consumer/dashboard/page.tsx
- apps/web/src/components/consumer/Dashboard/*.tsx
- apps/web/src/app/[locale]/consumer/lock/page.tsx
- apps/web/src/components/consumer/Lock/*.tsx
- apps/web/src/app/[locale]/consumer/unlock/page.tsx
- apps/web/src/components/consumer/Unlock/*.tsx

### Step 4: 操作カタログ作成
上記の情報を基に、操作カタログフォーマットに従って記録。

## 成果物
- docs/specs/operations/CONSUMER_OPERATIONS.md (部分: 画面1-4)

## 完了条件
- [ ] 4画面すべてのスナップショット取得完了
- [ ] 全操作が一覧化されている
- [ ] 各操作の必要データ・出力データが明記されている
- [ ] 関連シーケンスが紐付けられている
```

---

#### Prompt P1-2: Consumer App (後半)

```markdown
# Phase 1 - Prompt 2: Consumer App 操作カタログ (後半)

## 目的
Consumer App の history, settings, onboarding, support, contact, terms, privacy, security 画面の操作を詳細に記録する。

## 前提
- P1-1 が完了していること
- docs/specs/operations/CONSUMER_OPERATIONS.md が存在すること

## 実行手順

### Step 1: 画面スナップショット取得
1. http://localhost:3000/ja/consumer/history
2. http://localhost:3000/ja/consumer/history/{id} (詳細)
3. http://localhost:3000/ja/consumer/settings
4. http://localhost:3000/ja/consumer/onboarding
5. http://localhost:3000/ja/consumer/onboarding/generate-key
6. http://localhost:3000/ja/consumer/support
7. http://localhost:3000/ja/consumer/contact
8. http://localhost:3000/ja/consumer/terms
9. http://localhost:3000/ja/consumer/privacy
10. http://localhost:3000/ja/consumer/security

### Step 2: コンポーネント確認
該当するコンポーネントを読み、操作を抽出。

### Step 3: 操作カタログ追記
CONSUMER_OPERATIONS.md に追記。

## 成果物
- docs/specs/operations/CONSUMER_OPERATIONS.md (完成版)

## 完了条件
- [ ] Consumer App 全19画面の操作が記録されている
- [ ] 総操作数が明記されている
- [ ] 目次が作成されている
```

---

#### Prompt P1-3 〜 P1-8

(同様のフォーマットで QS Hub, Governance, Prover, Observer, Explorer を定義)

### 1.4 プロンプト一覧

| Prompt | 対象 | 画面数 |
|:------:|------|:------:|
| P1-1 | Consumer App (前半) | 4 |
| P1-2 | Consumer App (後半) | 15 |
| P1-3 | QS Hub (前半) | 8 |
| P1-4 | QS Hub (後半) | 7 |
| P1-5 | Governance | 6 |
| P1-6 | Prover Portal (前半) | 6 |
| P1-7 | Prover Portal (後半) | 5 |
| P1-8 | Observer + Explorer | 15 |

---

## Phase 2: データフロー・ER図作成

### 2.1 アプローチ

1. Phase 1 の操作カタログから「必要データ」「出力データ」を全抽出
2. データをエンティティに分類・正規化
3. エンティティ間のリレーションを定義
4. 属性（カラム）を詳細化
5. Mermaid ER図を作成

### 2.2 プロンプト一覧

| Prompt | 内容 |
|:------:|------|
| P2-1 | Consumer App操作からエンティティ抽出 |
| P2-2 | QS Hub + Governance操作からエンティティ抽出 |
| P2-3 | Prover + Observer操作からエンティティ抽出 |
| P2-4 | 全エンティティ統合、ER図作成 |

---

## Phase 3: SEQUENCES.md 統合

### 3.1 対象シーケンス

| # | Sequence | 関連アプリ | 関連画面 |
|---|----------|-----------|----------|
| 1 | Lock | Consumer | lock, history |
| 2 | Unlock Normal | Consumer | unlock, history |
| 3 | Unlock Emergency | Consumer | unlock (emergency mode) |
| 4 | Challenge + Slashing | Observer | challenges, dashboard |
| 5 | Prover Registration | Prover | application |
| 6 | Prover Exit | Prover | exit |
| 7 | Governance Proposal | Governance, QS Hub | proposals, vote |
| 8 | Emergency Pause | (管理機能) | - |

### 3.2 プロンプト一覧

| Prompt | 内容 |
|:------:|------|
| P3-1 | Seq#1-3 (Lock/Unlock) との照合・統合 |
| P3-2 | Seq#4-6 (Prover/Challenge) との照合・統合 |
| P3-3 | Seq#7-8 (Governance/Emergency) との照合・統合 |

---

## Phase 4: 開発要件特定

### 4.1 確認対象

```
quantum-shield/
├── apps/
│   ├── web/                    # フロントエンド（確認済み）
│   │   ├── src/app/            # ページ
│   │   ├── src/components/     # コンポーネント
│   │   ├── src/lib/            # ユーティリティ
│   │   └── src/hooks/          # カスタムフック
│   └── admin-dashboard/        # 既存Admin（参考）
├── packages/
│   ├── api/                    # API定義（存在確認）
│   ├── contracts/              # スマートコントラクト
│   └── shared/                 # 共有コード
└── docs/
    └── core/                   # SEQUENCES.md
```

### 4.2 確認項目マトリクス

| 操作 | API | Backend | DB | Contract | 開発要否 |
|------|:---:|:-------:|:--:|:--------:|:--------:|
| Lock作成 | ? | ? | ? | ✅ | ? |
| Unlock申請 | ? | ? | ? | ✅ | ? |
| ... | | | | | |

### 4.3 プロンプト一覧

| Prompt | 内容 |
|:------:|------|
| P4-1 | 既存コード構造の全体調査 |
| P4-2 | Consumer App操作のAPI/Backend/DB要件 |
| P4-3 | QS Hub + Governance操作のAPI/Backend/DB要件 |
| P4-4 | Prover + Observer操作のAPI/Backend/DB要件 |
| P4-5 | 全体統合、開発要件一覧・API仕様書作成 |

---

## Phase 5: データ整合性チェック

### 5.1 チェック項目

| # | チェック項目 | 内容 | 例 |
|---|-------------|------|---|
| 1 | **ダブり検出** | 同じデータが別名で定義 | `Lock.id` vs `lockId` vs `lock_id` |
| 2 | **漏れ検出** | 操作に必要なデータが未定義 | 画面で使うが ER図にない |
| 3 | **用語不統一** | 同じ概念に異なる名前 | `User` vs `Account` vs `Wallet` |
| 4 | **型不整合** | 同じフィールドに異なる型 | `amount: string` vs `amount: number` |
| 5 | **必須/任意不整合** | 必須フィールドの不一致 | ある画面では必須、別では任意 |

### 5.2 成果物

#### DATA_DICTIONARY.md (データ辞書)

```markdown
# Quantum Shield データ辞書

## 命名規則
- エンティティ名: PascalCase (例: UnlockRequest)
- フィールド名: snake_case (例: wallet_address)
- API パラメータ: camelCase (例: walletAddress)

## エンティティ一覧

### User
| フィールド | 型 | 必須 | 説明 | 制約 |
|-----------|---|:----:|------|------|
| wallet_address | string | ✅ | ウォレットアドレス | PK, 0x始まり42文字 |
| pk_dilithium | bytes | ✅ | Dilithium公開鍵 | |
| created_at | timestamp | ✅ | 初回接続日時 | |
| last_active | timestamp | ✅ | 最終アクティブ日時 | |

### Lock
...
```

#### TERMINOLOGY_MAPPING.md (用語対応表)

```markdown
# 用語対応表

| 正式名称 | 別名（非推奨） | 使用箇所 |
|----------|---------------|----------|
| wallet_address | address, user_address, account | 全体で統一 |
| lock_id | lockId, id (Lockコンテキスト) | |
| unlock_request | unlockRequest, unlock | |
```

### 5.3 プロンプト一覧

| Prompt | 内容 |
|:------:|------|
| P5-1 | 全ドキュメントからデータ定義を抽出・比較 |
| P5-2 | 不整合の特定・修正案作成 |
| P5-3 | DATA_DICTIONARY.md 作成 |
| P5-4 | 全ドキュメントの用語統一・更新 |

---

## Phase 6: 設計仕様書・実装手順書作成

### 6.1 設計仕様書 (DESIGN_SPECIFICATION.md)

#### 目次構成

```markdown
# Quantum Shield 設計仕様書

## 1. システム概要
### 1.1 システム構成図
### 1.2 技術スタック
### 1.3 外部連携

## 2. アーキテクチャ
### 2.1 フロントエンド アーキテクチャ
### 2.2 バックエンド アーキテクチャ
### 2.3 スマートコントラクト アーキテクチャ
### 2.4 データフロー

## 3. コンポーネント設計
### 3.1 共通コンポーネント
### 3.2 Consumer App コンポーネント
### 3.3 QS Hub コンポーネント
### 3.4 ...

## 4. API設計
### 4.1 認証・認可
### 4.2 エンドポイント一覧
### 4.3 リクエスト/レスポンス定義
### 4.4 エラーハンドリング

## 5. データベース設計
### 5.1 ER図
### 5.2 テーブル定義
### 5.3 インデックス設計
### 5.4 マイグレーション計画

## 6. セキュリティ設計
### 6.1 認証フロー
### 6.2 署名検証
### 6.3 権限管理
### 6.4 監査ログ

## 7. 非機能要件
### 7.1 パフォーマンス要件
### 7.2 可用性要件
### 7.3 スケーラビリティ
```

### 6.2 実装手順書 (IMPLEMENTATION_PROCEDURES.md)

#### 目次構成

```markdown
# Quantum Shield 実装手順書

## 実装ガイドライン
- コーディング規約
- コミットルール
- PR ルール

## Phase 別実装手順

### WS-1: フロントエンドUI完成
#### Step 1: Consumer App
- 1.1 Landing Page
- 1.2 Dashboard
- 1.3 Lock画面
- 1.4 Unlock画面
- ...

#### Step 2: QS Hub
...

### WS-2: バックエンド・API実装
#### Step 1: 認証API
#### Step 2: Lock API
#### Step 3: Unlock API
...

### WS-3: スマートコントラクト連携
...

## 各Stepの実装プロンプト
→ docs/specs/prompts/ に格納
```

### 6.3 実装プロンプト集

```
docs/specs/prompts/
├── ws1/
│   ├── consumer/
│   │   ├── 01_landing.md
│   │   ├── 02_dashboard.md
│   │   ├── 03_lock.md
│   │   └── ...
│   ├── qs-hub/
│   └── ...
├── ws2/
│   ├── api/
│   │   ├── 01_auth.md
│   │   ├── 02_lock.md
│   │   └── ...
│   └── backend/
└── ws3/
    └── contracts/
```

#### プロンプトフォーマット

```markdown
# {機能名} 実装プロンプト

## 概要
- 対象: {ファイルパス}
- 依存: {前提となる実装}
- 成果物: {作成/更新するファイル}

## 実装指示

### 要件
{詳細な要件記述}

### 参照ドキュメント
- 操作カタログ: docs/specs/operations/{APP}_OPERATIONS.md#{画面名}
- データ定義: docs/specs/DATA_DICTIONARY.md#{エンティティ名}
- API仕様: docs/specs/API_SPECIFICATION.yaml#{endpoint}

### 実装手順
1. {具体的なステップ1}
2. {具体的なステップ2}
3. ...

### コード例（部分）
```tsx
// このような形式で実装すること
export function Component() {
  // ...
}
```

### テスト要件
- [ ] {テストケース1}
- [ ] {テストケース2}

### 完了条件
- [ ] {チェック項目1}
- [ ] {チェック項目2}
```

### 6.4 プロンプト一覧

| Prompt | 内容 |
|:------:|------|
| P6-1 | 設計仕様書: システム概要・アーキテクチャ |
| P6-2 | 設計仕様書: コンポーネント設計 |
| P6-3 | 設計仕様書: API・DB・セキュリティ設計 |
| P6-4 | 実装手順書: 全体構成・ガイドライン |
| P6-5 | 実装プロンプト: Consumer App (WS-1) |
| P6-6 | 実装プロンプト: QS Hub + Governance (WS-1) |
| P6-7 | 実装プロンプト: Prover + Observer (WS-1) |
| P6-8 | 実装プロンプト: API・Backend (WS-2) |

---

## Phase 7: QS Admin 設計

### 7.1 構成要素（詳細）- v3.0 更新版

```
QS Foundation Admin
│
├── 1. KPI Dashboard
│   ├── 1.1 Overview
│   │   ├── TVL (Total Value Locked) - リアルタイム
│   │   ├── アクティブユーザー数 (DAU/WAU/MAU)
│   │   ├── 本日のトランザクション数
│   │   ├── Prover稼働率・SLA達成状況
│   │   └── 未処理タスク数（承認待ち等）
│   ├── 1.2 Trends
│   │   ├── TVL推移グラフ (7d/30d/90d/1y)
│   │   ├── ユーザー成長グラフ
│   │   └── 収益推移グラフ
│   └── 1.3 Alerts
│       ├── システムアラート一覧
│       └── しきい値超過通知
│
├── 2. Ecosystem Overview
│   ├── 2.1 Users
│   │   ├── 全ユーザー一覧（フィルタ・検索）
│   │   ├── ユーザー詳細（トランザクション履歴、設定）
│   │   └── ユーザー統計（成長、リテンション）
│   ├── 2.2 Provers
│   │   ├── Prover一覧・ステータス
│   │   ├── Prover詳細（メトリクス、履歴、SLA）
│   │   └── パフォーマンス統計
│   ├── 2.3 Observers
│   │   ├── Observer一覧
│   │   ├── チャレンジ実績統計
│   │   └── 報酬分配状況
│   └── 2.4 Transactions
│       ├── Lock一覧・詳細
│       ├── Unlock一覧（Normal/Emergency）
│       └── トランザクション検索
│
├── 3. Registration & Approval ★管理業務
│   ├── 3.1 Prover Applications
│   │   ├── 申請一覧（ステータス: 審査中/承認/却下）
│   │   ├── 申請詳細レビュー
│   │   │   ├── HSM証明書検証
│   │   │   ├── ステーク確認
│   │   │   └── 組織情報確認
│   │   ├── 承認ワークフロー（多段階承認）
│   │   └── 却下理由記録
│   ├── 3.2 Observer Applications
│   │   └── (Observerは申請不要、自由参加のため表示のみ)
│   ├── 3.3 Prover Key Registration
│   │   ├── SPHINCS+公開鍵登録管理
│   │   └── HSMアテステーション検証
│   └── 3.4 Exit Requests
│       ├── 退出申請一覧
│       ├── 7日間アンボンディング状況
│       └── 最終清算処理
│
├── 4. Challenge & Slashing ★管理業務
│   ├── 4.1 Active Challenges
│   │   ├── 進行中チャレンジ一覧
│   │   ├── チャレンジ詳細
│   │   │   ├── 提出証拠
│   │   │   ├── 防御期間状況（48時間）
│   │   │   └── 関係者情報
│   │   └── 管理者介入オプション
│   ├── 4.2 Slashing History
│   │   ├── スラッシュ履歴一覧
│   │   ├── スラッシュ詳細（金額、分配）
│   │   └── 統計（累計スラッシュ額等）
│   ├── 4.3 Dispute Resolution
│   │   ├── エスカレーション案件
│   │   └── 管理者判断記録
│   └── 4.4 Insurance Pool
│       ├── プール残高
│       ├── 入出金履歴
│       └── 使用履歴
│
├── 5. Treasury & Finance ★管理業務
│   ├── 5.1 Wallet Management
│   │   ├── Main Treasury (3/5 Multisig - 大規模支出)
│   │   ├── Operational Budget (4/7 Multisig - 運営費)
│   │   ├── Grants Fund (5/9 Multisig - 助成金)
│   │   ├── Insurance Pool (9/12 Multisig - 保険金)
│   │   └── Emergency Reserve (9/12 Multisig - 緊急用)
│   ├── 5.2 Budget Management
│   │   ├── 年間予算計画
│   │   ├── 月次予算配分
│   │   └── 予算消化状況
│   ├── 5.3 Expense Requests
│   │   ├── 支出申請一覧
│   │   ├── 承認ワークフロー
│   │   └── 支出実行記録
│   ├── 5.4 Revenue Tracking
│   │   ├── プロトコル収益（手数料）
│   │   ├── スラッシュ収入
│   │   └── その他収入
│   └── 5.5 Financial Reports
│       ├── 月次報告書
│       ├── 四半期報告書
│       └── 監査用レポート
│
├── 6. Governance Management ★管理業務
│   ├── 6.1 Proposals
│   │   ├── Proposal一覧（Active/Passed/Failed）
│   │   ├── Proposal詳細
│   │   └── 実行状況追跡
│   ├── 6.2 Voting Analytics
│   │   ├── 投票参加率
│   │   ├── veQS分布
│   │   └── 委任状況
│   ├── 6.3 Council Management
│   │   ├── Security Council メンバー管理
│   │   ├── Purpose Committee メンバー管理
│   │   └── 任期管理
│   └── 6.4 Governance Parameters
│       ├── 投票パラメータ設定
│       ├── 提案閾値設定
│       └── クォーラム設定
│
├── 7. Emergency Controls ★管理業務
│   ├── 7.1 System Status
│   │   ├── 各サービス稼働状況
│   │   ├── スマートコントラクト状態
│   │   └── L3ネットワーク状態
│   ├── 7.2 Emergency Actions
│   │   ├── 緊急停止（Pause）
│   │   ├── 機能別停止
│   │   └── 再開（Resume）
│   └── 7.3 Incident Management
│       ├── インシデント記録
│       ├── 対応履歴
│       └── 事後報告書
│
├── 8. System Operations
│   ├── 8.1 Contract Management
│   │   ├── デプロイ済みコントラクト一覧
│   │   ├── アップグレード管理
│   │   └── パラメータ設定
│   ├── 8.2 Infrastructure
│   │   ├── サーバー稼働状況
│   │   ├── API健全性
│   │   └── データベース状態
│   └── 8.3 Maintenance
│       ├── 定期メンテナンス計画
│       └── メンテナンス履歴
│
├── 9. Transaction Monitoring
│   ├── 9.1 Real-time Monitor
│   │   ├── トランザクションストリーム
│   │   ├── 異常検知アラート
│   │   └── ブロック確認状況
│   ├── 9.2 Risk Scoring
│   │   ├── 高リスクトランザクション
│   │   └── アドレス監視リスト
│   └── 9.3 AML/Compliance
│       ├── サンクションチェック結果
│       └── 報告対象トランザクション
│
├── 10. Support Center
│   ├── 10.1 Ticket Management
│   │   ├── チケット一覧（Open/In Progress/Closed）
│   │   ├── チケット詳細・対応
│   │   └── SLA追跡
│   ├── 10.2 Announcements
│   │   ├── お知らせ作成・管理
│   │   └── 配信スケジュール
│   └── 10.3 FAQ Management
│       ├── FAQ編集
│       └── カテゴリ管理
│
├── 11. Audit & Compliance
│   ├── 11.1 Audit Logs
│   │   ├── 全操作ログ
│   │   ├── ログ検索・フィルタ
│   │   └── エクスポート
│   ├── 11.2 Access Control
│   │   ├── 管理者一覧
│   │   ├── ロール・権限管理
│   │   └── アクセス履歴
│   └── 11.3 Compliance Reports
│       ├── 規制対応報告書
│       └── 内部監査報告書
│
└── 12. Settings & Configuration
    ├── 12.1 Protocol Parameters
    │   ├── 手数料設定
    │   ├── タイムロック期間
    │   └── 閾値設定
    ├── 12.2 Admin Users
    │   ├── 管理者アカウント管理
    │   ├── 権限設定
    │   └── 2FA設定
    └── 12.3 System Settings
        ├── 通知設定
        ├── API設定
        └── 表示設定
```

### 7.2 権限管理システム

```
Permission Hierarchy:
┌─────────────────────────────────────────────────────────────────────────┐
│ Superadmin (Level 4) - Security Council (3/5 Multisig Required)        │
│ ├── 全機能へのアクセス                                                   │
│ ├── Emergency Controls (緊急停止・再開)                                 │
│ ├── Treasury Main Wallet 操作                                          │
│ └── 管理者アカウント作成・削除                                           │
├─────────────────────────────────────────────────────────────────────────┤
│ Admin (Level 3) - Purpose Committee Members                            │
│ ├── Prover/Observer 承認・却下                                          │
│ ├── Challenge 介入・判断                                                │
│ ├── Operational Budget 支出承認                                         │
│ ├── お知らせ・FAQ管理                                                   │
│ └── Governance Proposal 管理                                           │
├─────────────────────────────────────────────────────────────────────────┤
│ Operator (Level 2) - Operations Team                                   │
│ ├── トランザクション監視                                                 │
│ ├── サポートチケット対応                                                 │
│ ├── 基本的な統計閲覧                                                    │
│ └── インシデント報告                                                    │
├─────────────────────────────────────────────────────────────────────────┤
│ Viewer (Level 1) - Read-Only Access                                    │
│ ├── ダッシュボード閲覧                                                   │
│ ├── 統計・レポート閲覧                                                   │
│ └── 監査ログ閲覧                                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Treasury ウォレット構造

| Wallet | Purpose | Multisig | Approvers | Monthly Limit |
|--------|---------|:--------:|:---------:|:-------------:|
| Main Treasury | 大規模支出、戦略投資 | 3/5 | Security Council | - |
| Operational Budget | 運営費、給与、インフラ | 4/7 | Purpose Committee | $500K |
| Grants Fund | 開発者助成、エコシステム支援 | 5/9 | Grants Committee | $200K |
| Insurance Pool | スラッシュ補填、ユーザー保護 | 9/12 | Security Council | $100K |
| Emergency Reserve | 緊急対応、危機管理 | 9/12 | Security Council | - |

### 7.4 Treasury 収入源

| Source | Description | Destination |
|--------|-------------|-------------|
| Protocol Fees | Lock/Unlock手数料の一部 | Main Treasury |
| Slashing | スラッシュ額の20% | Insurance Pool |
| Token Sale | トークン販売収益 | Main Treasury |
| Grants | 外部助成金 | Grants Fund |

### 7.5 画面一覧（38画面）

| # | Screen | URL | Priority |
|---|--------|-----|:--------:|
| 1 | KPI Dashboard | `/admin/dashboard` | P0 |
| 2 | KPI Trends | `/admin/dashboard/trends` | P1 |
| 3 | KPI Alerts | `/admin/dashboard/alerts` | P1 |
| 4 | Users List | `/admin/ecosystem/users` | P0 |
| 5 | User Detail | `/admin/ecosystem/users/:id` | P0 |
| 6 | Provers List | `/admin/ecosystem/provers` | P0 |
| 7 | Prover Detail | `/admin/ecosystem/provers/:id` | P0 |
| 8 | Observers List | `/admin/ecosystem/observers` | P0 |
| 9 | Transactions List | `/admin/ecosystem/transactions` | P0 |
| 10 | Transaction Detail | `/admin/ecosystem/transactions/:id` | P0 |
| 11 | Prover Applications | `/admin/registration/prover-applications` | P0 |
| 12 | Application Review | `/admin/registration/prover-applications/:id` | P0 |
| 13 | Key Registration | `/admin/registration/keys` | P1 |
| 14 | Exit Requests | `/admin/registration/exit-requests` | P1 |
| 15 | Active Challenges | `/admin/challenges/active` | P0 |
| 16 | Challenge Detail | `/admin/challenges/:id` | P0 |
| 17 | Slashing History | `/admin/challenges/slashing` | P1 |
| 18 | Insurance Pool | `/admin/challenges/insurance` | P1 |
| 19 | Treasury Overview | `/admin/treasury` | P0 |
| 20 | Wallet Detail | `/admin/treasury/wallets/:id` | P0 |
| 21 | Budget Management | `/admin/treasury/budget` | P1 |
| 22 | Expense Requests | `/admin/treasury/expenses` | P1 |
| 23 | Financial Reports | `/admin/treasury/reports` | P2 |
| 24 | Proposals List | `/admin/governance/proposals` | P0 |
| 25 | Proposal Detail | `/admin/governance/proposals/:id` | P0 |
| 26 | Council Management | `/admin/governance/council` | P1 |
| 27 | Governance Settings | `/admin/governance/settings` | P2 |
| 28 | System Status | `/admin/emergency/status` | P0 |
| 29 | Emergency Actions | `/admin/emergency/actions` | P0 |
| 30 | Incident History | `/admin/emergency/incidents` | P1 |
| 31 | Transaction Monitor | `/admin/monitoring/realtime` | P1 |
| 32 | Risk Alerts | `/admin/monitoring/alerts` | P1 |
| 33 | Support Tickets | `/admin/support/tickets` | P1 |
| 34 | Announcements | `/admin/support/announcements` | P1 |
| 35 | Audit Logs | `/admin/audit/logs` | P0 |
| 36 | Access Control | `/admin/audit/access` | P0 |
| 37 | Protocol Settings | `/admin/settings/protocol` | P1 |
| 38 | Admin Users | `/admin/settings/users` | P0 |

### 7.6 必要なデータベーステーブル

```sql
-- Admin Users & Permissions
admin_users (
  id, wallet_address, email, name, role,
  created_at, last_login, status, 2fa_enabled
)

admin_roles (
  id, name, level, permissions[], created_at
)

admin_audit_logs (
  id, admin_id, action, resource_type, resource_id,
  details, ip_address, timestamp
)

-- Treasury Management
treasury_wallets (
  id, name, type, address, multisig_threshold,
  multisig_signers[], balance, created_at
)

treasury_transactions (
  id, wallet_id, type, amount, currency,
  from_address, to_address, purpose,
  status, approved_by[], tx_hash, created_at
)

budget_allocations (
  id, wallet_id, category, amount, period_start,
  period_end, spent_amount, created_at
)

expense_requests (
  id, wallet_id, requester_id, amount, purpose,
  category, status, approved_by[], created_at
)

-- Support & Communication
support_tickets (
  id, user_id, subject, description, category,
  priority, status, assigned_to, created_at, resolved_at
)

ticket_messages (
  id, ticket_id, sender_id, sender_type, message, created_at
)

announcements (
  id, title, content, category, target_audience[],
  published_at, expires_at, created_by
)

-- Metrics & Analytics
daily_metrics (
  id, date, tvl, active_users, transactions_count,
  new_users, lock_volume, unlock_volume
)

protocol_revenue (
  id, date, source, amount, currency, tx_hash
)
```

### 7.7 必要なAPIエンドポイント

```yaml
# Admin Authentication
POST   /admin/auth/login
POST   /admin/auth/logout
POST   /admin/auth/2fa/verify
GET    /admin/auth/session

# KPI Dashboard
GET    /admin/dashboard/overview
GET    /admin/dashboard/trends
GET    /admin/dashboard/alerts

# Ecosystem
GET    /admin/users
GET    /admin/users/:id
GET    /admin/provers
GET    /admin/provers/:id
GET    /admin/observers
GET    /admin/transactions
GET    /admin/transactions/:id

# Registration & Approval
GET    /admin/applications/prover
GET    /admin/applications/prover/:id
POST   /admin/applications/prover/:id/approve
POST   /admin/applications/prover/:id/reject
GET    /admin/exit-requests
POST   /admin/exit-requests/:id/process

# Challenges
GET    /admin/challenges
GET    /admin/challenges/:id
POST   /admin/challenges/:id/intervene
GET    /admin/slashing
GET    /admin/insurance-pool

# Treasury
GET    /admin/treasury/overview
GET    /admin/treasury/wallets
GET    /admin/treasury/wallets/:id
POST   /admin/treasury/wallets/:id/transfer
GET    /admin/treasury/budget
POST   /admin/treasury/budget
GET    /admin/treasury/expenses
POST   /admin/treasury/expenses
PATCH  /admin/treasury/expenses/:id
GET    /admin/treasury/reports

# Governance
GET    /admin/governance/proposals
GET    /admin/governance/proposals/:id
POST   /admin/governance/proposals/:id/execute
GET    /admin/governance/council
POST   /admin/governance/council/members
DELETE /admin/governance/council/members/:id

# Emergency
GET    /admin/emergency/status
POST   /admin/emergency/pause
POST   /admin/emergency/resume
GET    /admin/emergency/incidents
POST   /admin/emergency/incidents

# Monitoring
GET    /admin/monitoring/realtime
GET    /admin/monitoring/alerts
POST   /admin/monitoring/alerts/:id/acknowledge

# Support
GET    /admin/support/tickets
GET    /admin/support/tickets/:id
PATCH  /admin/support/tickets/:id
POST   /admin/support/tickets/:id/messages
GET    /admin/support/announcements
POST   /admin/support/announcements
PATCH  /admin/support/announcements/:id

# Audit
GET    /admin/audit/logs
GET    /admin/audit/access
GET    /admin/audit/reports

# Settings
GET    /admin/settings/protocol
PATCH  /admin/settings/protocol
GET    /admin/settings/users
POST   /admin/settings/users
PATCH  /admin/settings/users/:id
DELETE /admin/settings/users/:id
```

### 7.8 プロンプト一覧（更新版）

| Prompt | 内容 |
|:------:|------|
| P7-1 | QS Admin 要件定義: KPI Dashboard + Ecosystem |
| P7-2 | QS Admin 要件定義: Registration & Approval |
| P7-3 | QS Admin 要件定義: Challenge & Slashing |
| P7-4 | QS Admin 要件定義: Treasury & Finance |
| P7-5 | QS Admin 要件定義: Governance + Emergency |
| P7-6 | QS Admin 要件定義: Monitoring + Support |
| P7-7 | QS Admin 要件定義: Audit + Settings |
| P7-8 | QS Admin 画面設計: Dashboard + Ecosystem (8画面) |
| P7-9 | QS Admin 画面設計: Registration + Challenges (8画面) |
| P7-10 | QS Admin 画面設計: Treasury + Governance (9画面) |
| P7-11 | QS Admin 画面設計: Emergency + Monitoring (5画面) |
| P7-12 | QS Admin 画面設計: Support + Audit + Settings (8画面) |
| P7-13 | QS Admin データベース設計: Admin Tables |
| P7-14 | QS Admin データベース設計: Treasury Tables |
| P7-15 | QS Admin API設計: 全エンドポイント |

---

## 実行スケジュール

### 全体プロンプト数: 約45回

| Phase | プロンプト数 | 累計 | 主な成果物 |
|:-----:|:-----------:|:----:|-----------|
| Phase 1 | 8 | 8 | 画面操作カタログ (6ファイル) |
| Phase 2 | 4 | 12 | ER図 v3 |
| Phase 3 | 3 | 15 | SEQUENCES v3 |
| Phase 4 | 5 | 20 | 開発要件一覧, API仕様書 |
| Phase 5 | 4 | 24 | データ辞書, 用語対応表 |
| Phase 6 | 8 | 32 | 設計仕様書, 実装手順書, プロンプト集 |
| Phase 7 | 10 | 42 | QS Admin要件定義, 画面モック |
| Buffer | 3 | 45 | レビュー・修正 |

### 実行フロー

```
Phase 1 (操作カタログ)
    ↓
Phase 2 (ER図)
    ↓
Phase 3 (SEQUENCES統合)
    ↓
Phase 4 (開発要件)
    ↓
Phase 5 (データ整合性) ←←← 全ドキュメント横断チェック
    ↓
Phase 6 (設計仕様書・実装手順書) ←←← 1流企業レベル
    ↓
Phase 7 (QS Admin設計)
```

---

## 品質基準

### ドキュメント品質

| 基準 | 内容 | 検証方法 |
|------|------|----------|
| **網羅性** | 全画面・全操作・全データを漏れなく記録 | チェックリスト |
| **一貫性** | 用語・フォーマット・命名規則の統一 | Phase 5で検証 |
| **追跡可能性** | 操作→データ→API→実装の追跡が可能 | リンク確認 |
| **実行可能性** | プロンプトをコピペで実行可能 | 実際に実行 |
| **保守性** | 更新しやすい構造 | 分割・モジュール化 |

### 1流企業レベルの定義

| 観点 | 要件 |
|------|------|
| **明確性** | 曖昧な表現がない、具体的な数値・例がある |
| **完全性** | 必要な情報がすべて含まれている |
| **正確性** | 技術的に正確である |
| **構造化** | 論理的に整理されている |
| **再現性** | 誰が読んでも同じ理解ができる |

---

## 開始方法

### Phase 1 開始コマンド

```
Phase1 P1-1 開始
```

このコマンドを入力すると、P1-1 のプロンプト内容に従って実行を開始します。

### 進捗確認

```
QS Admin 進捗確認
```

このコマンドで現在の進捗状況を表示します。

---

## 成果物一覧（最終）

```
docs/
├── specs/
│   ├── operations/
│   │   ├── CONSUMER_OPERATIONS.md
│   │   ├── QS_HUB_OPERATIONS.md
│   │   ├── GOVERNANCE_OPERATIONS.md
│   │   ├── PROVER_OPERATIONS.md
│   │   ├── OBSERVER_OPERATIONS.md
│   │   └── EXPLORER_OPERATIONS.md
│   ├── DATA_DICTIONARY.md
│   ├── TERMINOLOGY_MAPPING.md
│   ├── DEVELOPMENT_REQUIREMENTS.md
│   ├── API_SPECIFICATION.yaml
│   ├── DATABASE_SCHEMA.md
│   ├── DESIGN_SPECIFICATION.md
│   ├── IMPLEMENTATION_PROCEDURES.md
│   ├── QS_ADMIN_REQUIREMENTS.md
│   └── prompts/
│       ├── ws1/
│       ├── ws2/
│       └── ws3/
├── design/
│   ├── ER_DIAGRAM_V3.md
│   ├── mocks/
│   │   └── qs-admin/
│   │       ├── 01-dashboard.html
│   │       ├── 02-transactions-*.html
│   │       ├── 03-users-*.html
│   │       └── ...
│   └── screenshots/
│       └── {app}/{screen}.png
└── core/
    └── SEQUENCES_V3.md
```

---

## Phase 8: 実行計画（QS Admin開発）

### 8.1 開発フェーズ概要

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        QS Admin 開発ロードマップ                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Phase 8-A: 画面実装                                                             │
│  ├── 8-A-1: HTMLモック作成（38画面）                                              │
│  ├── 8-A-2: React Component変換（prompt 30_ui_impl.md使用）                       │
│  ├── 8-A-3: i18n対応（ja/en）                                                    │
│  └── 8-A-4: Storybook登録                                                        │
│                              ↓                                                   │
│  Phase 8-B: 画面検証（Playwright MCP）                                           │
│  ├── 8-B-1: デザイン検証（prompt 41_design_system_check.md）                      │
│  ├── 8-B-2: 5観点レビュー（prompt 42_unified_screen_review.md）                   │
│  ├── 8-B-3: スモークテスト（prompt 40_screen_review.md）                          │
│  └── 8-B-4: 問題修正・再検証                                                     │
│                              ↓                                                   │
│  Phase 8-C: バックエンド実装                                                      │
│  ├── 8-C-1: Prismaスキーマ適用・マイグレーション                                  │
│  ├── 8-C-2: API実装（Rust/Axum）                                                 │
│  ├── 8-C-3: 認証・認可実装                                                       │
│  └── 8-C-4: ビジネスロジック実装                                                 │
│                              ↓                                                   │
│  Phase 8-D: L3/L1統合                                                            │
│  ├── 8-D-1: L3ノード起動・接続                                                   │
│  ├── 8-D-2: L1(Sepolia)接続                                                      │
│  ├── 8-D-3: L3トランザクション署名実装                                            │
│  └── 8-D-4: L1検証コントラクト連携                                               │
│                              ↓                                                   │
│  Phase 8-E: 統合テスト                                                           │
│  ├── 8-E-1: E2Eテスト作成                                                        │
│  ├── 8-E-2: 全画面フルテスト実行                                                 │
│  ├── 8-E-3: バックエンドログ検証                                                 │
│  └── 8-E-4: L3/L1状態検証                                                        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Phase 8-A: 画面実装

#### 8-A-1: HTMLモック作成

**実行コマンド**:
```
Phase 7-2を実行してください（QS Admin HTMLモック作成）
```

**優先順位**:
| 優先度 | カテゴリ | 画面数 | 理由 |
|:------:|----------|:------:|------|
| P0 | 01-Dashboard | 1 | 全体把握の起点 |
| P0 | 02-Transactions | 5 | コアオペレーション |
| P0 | 12-Treasury | 5 | 資金管理クリティカル |
| P1 | 03-Users | 4 | ユーザー管理 |
| P1 | 04-Prover | 3 | ノード管理 |
| P1 | 05-Observer | 2 | ノード管理 |
| P2 | 06-Governance | 3 | ガバナンス |
| P2 | 07-Members | 2 | 組織管理 |
| P3 | 08-Support | 3 | サポート |
| P3 | 09-Announcements | 2 | 情報発信 |
| P3 | 10-Analytics | 4 | 分析・レポート |
| P3 | 11-System | 4 | システム設定 |

#### 8-A-2: React Component変換

**使用プロンプト**: `docs/agents/prompts/30_ui_impl.md`

**実行コマンド**:
```
Phase 6 QS Admin 開始
```

**品質ゲート**:
- [ ] TypeScript コンパイル成功
- [ ] ESLint エラーなし
- [ ] Tailwind クラス検証OK
- [ ] i18n キー完備

### 8.3 Phase 8-B: 画面検証（Playwright MCP）

#### 8-B-1: デザインシステム検証

**使用プロンプト**: `docs/agents/prompts/41_design_system_check.md`

**必須検証項目**:
```javascript
// 1. タップエリア44px検証
() => {
  const buttons = document.querySelectorAll('button, a, [role="button"]');
  const issues = [];
  buttons.forEach(btn => {
    const rect = btn.getBoundingClientRect();
    if (rect.width < 44 || rect.height < 44) {
      issues.push({ text: btn.textContent?.substring(0, 30), w: rect.width, h: rect.height });
    }
  });
  return { total: buttons.length, violations: issues };
}

// 2. Primary CTA数検証（1画面1つ）
() => {
  const primaryBtns = document.querySelectorAll('[class*="bg-gradient-hinomaru"], [class*="bg-hinomaru"]:not([class*="/"])');
  return { count: primaryBtns.length, pass: primaryBtns.length <= 1 };
}

// 3. コントラスト比検証
() => {
  // WCAG AA: 4.5:1 (通常テキスト), 3:1 (大テキスト)
  const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, label, button');
  // ... コントラスト計算ロジック
}
```

#### 8-B-2: 5観点レビュー

**使用プロンプト**: `docs/agents/prompts/42_unified_screen_review.md`

| 観点 | チェック内容 | 必須 |
|:----:|-------------|:----:|
| D | デザインシステム準拠（D1-D6） | ✅ |
| J | ジャーニー（エントリー/出口/戻る） | ✅ |
| N | ナビゲーション（全リンク検証） | ✅ |
| M | モデル整合性（DATA_MODEL.md） | ✅ |
| C | 完全性（必須機能網羅） | ✅ |

#### 8-B-3: スモークテスト

**使用プロンプト**: `docs/agents/prompts/40_screen_review.md`

**実行コマンド**:
```
画面レビュー /ja/qs-admin/dashboard
画面レビュー /ja/qs-admin/transactions
...
```

### 8.4 Phase 8-C: バックエンド実装

#### 8-C-1: Prismaスキーマ適用

```bash
# スキーマ生成
cd apps/api
npx prisma generate

# マイグレーション実行
npx prisma migrate dev --name add_admin_tables

# シード投入
npx prisma db seed
```

**対象テーブル**（DATABASE_DESIGN.md Section 6より）:
- admin_users, admin_roles, admin_audit_logs, admin_sessions
- treasury_wallets, treasury_transactions, budget_allocations
- expense_requests, protocol_revenue
- support_tickets, ticket_messages, announcements, faq_items
- daily_metrics, hourly_metrics, alert_rules, alerts

#### 8-C-2: API実装

**対象エンドポイント**（API_SPECIFICATION.yaml より）:
| パス | メソッド | 説明 |
|------|---------|------|
| /admin/auth/login | POST | ログイン |
| /admin/auth/logout | POST | ログアウト |
| /admin/dashboard | GET | ダッシュボード |
| /admin/transactions | GET | トランザクション一覧 |
| /admin/users | GET/POST | ユーザー管理 |
| /admin/treasury/* | ALL | トレジャリー操作 |
| ... | ... | ... |

#### 8-C-3: 認証・認可実装

**Permission Level**:
```rust
pub enum PermissionLevel {
    Viewer = 1,    // 閲覧のみ
    Operator = 2,  // 操作可（承認不要）
    Admin = 3,     // 承認権限あり
    Superadmin = 4 // 全権限
}

pub struct Permission {
    pub resource: String,  // e.g., "treasury", "prover"
    pub action: String,    // e.g., "read", "write", "approve"
    pub level: PermissionLevel,
}
```

### 8.5 Phase 8-D: L3/L1統合

#### 8-D-1: L3ノード起動

```bash
# L3ノード起動（開発環境）
cd services/l3-node
cargo run --release -- --config config/dev.toml

# ヘルスチェック
curl http://localhost:8545/health
```

#### 8-D-2: L1(Sepolia)接続

```typescript
// wagmi config for Sepolia
const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(process.env.SEPOLIA_RPC_URL),
  },
});
```

#### 8-D-3: L3トランザクション署名

**Treasury操作の署名フロー**:
```
1. Admin画面でトランザクション作成
2. フロントエンドがL3ノードにリクエスト
3. L3ノードがDilithium署名を生成
4. Multisig承認（必要数に達するまで待機）
5. L3がSTARK証明を生成
6. L1 Bridge Verifierに提出
7. L1で実行
```

### 8.6 Phase 8-E: 統合テスト

#### 8-E-1: E2Eテスト作成

**テストファイル構造**:
```
apps/web/e2e/
├── qs-admin/
│   ├── auth.spec.ts
│   ├── dashboard.spec.ts
│   ├── transactions.spec.ts
│   ├── treasury.spec.ts
│   └── ...
└── integration/
    ├── admin-backend.spec.ts
    ├── admin-l3.spec.ts
    └── admin-l1.spec.ts
```

#### 8-E-2: 全画面フルテスト

```bash
# 全画面テスト実行
cd apps/web
npx playwright test e2e/qs-admin/ --workers=4

# レポート生成
npx playwright show-report
```

---

## 8.7 バックエンド実装ルール（★重要）

### 禁止事項

```xml
<rule id="BE-001" level="ABSOLUTE">
  【スタブレスポンス禁止】

  以下のような「常にOK」を返す実装は禁止：

  ❌ 禁止パターン:
  ```rust
  async fn create_transaction() -> Json<Response> {
      Json(Response { success: true, data: None })  // 常にOK
  }

  async fn get_users() -> Json<Vec<User>> {
      Json(vec![])  // 空配列を常に返す
  }
  ```

  ✅ 正しいパターン:
  ```rust
  async fn create_transaction(
      State(pool): State<PgPool>,
      Json(req): Json<CreateTransactionRequest>
  ) -> Result<Json<Transaction>, ApiError> {
      // 実際のDB操作
      let tx = sqlx::query_as!(Transaction,
          "INSERT INTO transactions (...) VALUES (...) RETURNING *",
          ...
      ).fetch_one(&pool).await?;

      Ok(Json(tx))
  }
  ```
</rule>

<rule id="BE-002" level="ABSOLUTE">
  【テスト用コード修正禁止】

  テストを通すために本番コードを修正することは禁止。
  テストが失敗した場合は、本番コードの問題を修正する。

  ❌ 禁止:
  - テストを通すためにバリデーションを無効化
  - テスト用の分岐を本番コードに追加
  - エラーハンドリングを省略

  ✅ 許可:
  - テスト用のフィクスチャ/シード作成
  - テスト環境用の設定ファイル
  - モックサーバー（フロントエンドテスト用）
</rule>

<rule id="BE-003" level="ABSOLUTE">
  【ログ出力必須】

  全API操作で以下のログを出力：

  ```rust
  // リクエスト開始
  tracing::info!(
      endpoint = %path,
      method = %method,
      user_id = %user_id,
      "API request started"
  );

  // DB操作
  tracing::debug!(
      query = %query,
      params = ?params,
      "Executing query"
  );

  // レスポンス
  tracing::info!(
      status = %status,
      duration_ms = %duration,
      "API request completed"
  );
  ```
</rule>
```

---

## 8.8 テスト検証プロンプト

### テスト内容と実行ログの整合性検証

**目的**: E2Eテストの期待値と、バックエンドの実行ログが一致することを検証

**検証プロンプト（新規作成）**: `docs/agents/prompts/43_test_log_verification.md`

```markdown
# Test-Log Verification Prompt

## 目的
E2Eテストの実行結果と、バックエンドログを照合し、
「テストは成功したがバックエンドが実際には処理していない」状況を検出する。

## 検証手順

### STEP 1: テスト実行とログ収集

```bash
# ログ収集開始
docker compose logs -f api > /tmp/test-logs.txt &

# E2Eテスト実行
npx playwright test e2e/qs-admin/transactions.spec.ts

# ログ収集終了
pkill -f "docker compose logs"
```

### STEP 2: テストケースとログの照合

各テストケースについて以下を確認:

| テストケース | 期待する処理 | ログで確認 |
|-------------|-------------|-----------|
| 作成テスト | INSERT実行 | `Executing query.*INSERT` |
| 取得テスト | SELECT実行 | `Executing query.*SELECT` |
| 更新テスト | UPDATE実行 | `Executing query.*UPDATE` |
| 削除テスト | DELETE実行 | `Executing query.*DELETE` |

### STEP 3: 不整合検出

以下のパターンを検出したら**FAIL**:

1. **空レスポンス常時**: ログにDB操作がないのに200 OK
2. **固定値レスポンス**: 異なるリクエストに同一レスポンス
3. **エラー無視**: 500エラーをキャッチして200に変換

### STEP 4: 検証レポート出力

```markdown
## Test-Log Verification Report

### Summary
- テストケース数: {N}
- ログ整合: {N}/{N}
- 不整合検出: {N}件

### 詳細

| Test Case | Expected Log | Found | Status |
|-----------|-------------|:-----:|:------:|
| create_transaction | INSERT INTO transactions | ✅ | PASS |
| get_transactions | SELECT FROM transactions | ❌ | FAIL |
| ... | ... | ... | ... |

### 不整合詳細

#### Case: get_transactions
- 期待: SELECT FROM transactions WHERE ...
- 実際: ログ出力なし（空配列を直接返却の可能性）
- 対応: APIハンドラの実装を確認
```

## 自動化スクリプト

```bash
#!/bin/bash
# scripts/verify-test-logs.sh

# 1. 一時ファイル準備
LOG_FILE="/tmp/api-test-logs-$(date +%s).txt"
REPORT_FILE="/tmp/test-log-report-$(date +%s).md"

# 2. ログ収集開始（バックグラウンド）
docker compose logs -f api > "$LOG_FILE" 2>&1 &
LOG_PID=$!
sleep 2

# 3. テスト実行
npx playwright test e2e/qs-admin/ --reporter=json > /tmp/test-results.json

# 4. ログ収集終了
kill $LOG_PID 2>/dev/null

# 5. 照合実行
node scripts/compare-test-logs.js /tmp/test-results.json "$LOG_FILE" > "$REPORT_FILE"

# 6. 結果表示
cat "$REPORT_FILE"

# 7. 不整合があれば非ゼロ終了
grep -q "FAIL" "$REPORT_FILE" && exit 1 || exit 0
```
```

---

## 8.9 実行スケジュール

| Week | Phase | 内容 | 成果物 |
|:----:|:-----:|------|--------|
| 1 | 8-A | 画面実装（P0: Dashboard, Transactions, Treasury） | 11画面 |
| 2 | 8-A | 画面実装（P1: Users, Prover, Observer） | 9画面 |
| 3 | 8-A | 画面実装（P2-P3: 残り） | 18画面 |
| 3 | 8-B | Playwright検証（全38画面） | 検証レポート |
| 4 | 8-C | バックエンド実装（認証・コア機能） | API 50% |
| 5 | 8-C | バックエンド実装（Treasury・Governance） | API 100% |
| 6 | 8-D | L3/L1統合 | 統合完了 |
| 7 | 8-E | 統合テスト・修正 | テスト通過 |

---

## 8.10 品質ゲート

### Phase完了条件

| Phase | Gate | 判定基準 |
|:-----:|------|---------|
| 8-A | 画面実装完了 | 全38画面がTypeScriptコンパイル通過 |
| 8-B | 検証完了 | 5観点レビュー全画面PASS |
| 8-C | API完了 | 全エンドポイント実装、テスト通過 |
| 8-D | 統合完了 | L3署名→L1実行のフロー動作確認 |
| 8-E | 最終検証 | E2Eテスト100%通過、ログ整合性検証PASS |

### リリース基準

- [ ] 全38画面実装完了
- [ ] 5観点レビュー全画面PASS
- [ ] API全エンドポイント実装
- [ ] E2Eテスト100%通過
- [ ] バックエンドログ整合性検証PASS
- [ ] L3/L1統合動作確認
- [ ] セキュリティレビュー完了
- [ ] パフォーマンステスト通過

---

**Document End**
