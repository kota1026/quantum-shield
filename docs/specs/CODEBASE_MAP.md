# Quantum Shield Codebase Map

> **目的**: どこに何があるかを明確にし、開発効率を向上させる
> **更新日**: 2026-01-22

---

## 目次

1. [プロジェクト構造概要](#1-プロジェクト構造概要)
2. [アクティブコード](#2-アクティブコード)
3. [ドキュメント](#3-ドキュメント)
4. [アーカイブ・非推奨](#4-アーカイブ非推奨)
5. [開発時の参照ガイド](#5-開発時の参照ガイド)

---

## 1. プロジェクト構造概要

```
quantum-shield/
│
├── 🟢 apps/                    # フロントエンド（アクティブ）
├── 🟢 services/                # バックエンドサービス
├── 🟢 contracts/               # Solidityコントラクト（L1）
├── 🟢 l3-aegis/                # L3チェーン（Rust）
├── 🟢 circuits/                # ZK回路
├── 🟢 packages/                # 共有パッケージ
├── 🟢 shared-types/            # 共有型定義
├── 🟢 docs/                    # ドキュメント（整理済み）
│
├── 🟡 scripts/                 # 運用スクリプト
├── 🟡 docker/                  # Docker設定
│
├── 🔴 _archive/                # アーカイブ
│
└── 設定ファイル群
```

凡例: 🟢 アクティブ / 🟡 整理予定 / 🔴 アーカイブ

---

## 2. アクティブコード

### 2.1 フロントエンド (`apps/`)

```
apps/
└── web/                           # メインWebアプリ（Next.js 15）
    ├── src/
    │   ├── app/                   # App Router ページ
    │   │   ├── [locale]/          # 国際化対応
    │   │   │   ├── consumer/      # Consumer App
    │   │   │   ├── token-hub/     # Token Hub
    │   │   │   ├── governance/    # Governance
    │   │   │   ├── prover/        # Prover Portal
    │   │   │   ├── observer/      # Observer
    │   │   │   ├── explorer/      # Explorer
    │   │   │   ├── enterprise/    # Enterprise Admin
    │   │   │   └── admin/         # QS Admin
    │   │   │
    │   │   └── api/               # Mock API Routes (Next.js Route Handlers)
    │   │       └── lock/          # Lock API
    │   │           ├── route.ts   # POST /api/lock
    │   │           └── status/[lockId]/route.ts  # GET /api/lock/status/:id
    │   │
    │   ├── components/            # Reactコンポーネント
    │   │   ├── ui/                # 共通UIコンポーネント
    │   │   │   ├── button.tsx     # ボタン（9バリエーション）
    │   │   │   ├── card.tsx       # カード
    │   │   │   ├── input.tsx      # 入力フィールド
    │   │   │   ├── badge.tsx      # バッジ
    │   │   │   └── tooltip.tsx    # ツールチップ
    │   │   │
    │   │   ├── consumer/          # Consumer専用
    │   │   ├── token-hub/         # Token Hub専用
    │   │   ├── governance/        # Governance専用
    │   │   ├── prover/            # Prover専用
    │   │   ├── observer/          # Observer専用
    │   │   ├── explorer/          # Explorer専用
    │   │   ├── enterprise/        # Enterprise専用
    │   │   ├── admin/             # Admin専用
    │   │   └── shared/            # 複数アプリ共通
    │   │
    │   ├── lib/                   # ユーティリティ
    │   │   ├── utils.ts           # 共通ユーティリティ (cn関数等)
    │   │   └── api/               # APIクライアント
    │   │       ├── index.ts       # エクスポート
    │   │       └── lock.ts        # Lock API クライアント
    │   │
    │   ├── hooks/                 # カスタムフック
    │   ├── stores/                # Zustand ストア
    │   └── styles/                # グローバルCSS
    │
    ├── locales/                   # 翻訳ファイル
    │   ├── ja/                    # 日本語
    │   └── en/                    # 英語
    │
    ├── e2e/                       # E2Eテスト（Playwright）
    ├── public/                    # 静的ファイル
    │
    ├── tailwind.config.ts         # Tailwind設定
    ├── next.config.js             # Next.js設定
    └── package.json
```

**技術スタック**:
- Next.js 15 (App Router)
- React 19
- TypeScript 5.7
- Tailwind CSS 3.4
- next-intl (i18n)
- wagmi + RainbowKit (Web3)
- Zustand (状態管理)

### 2.2 バックエンド (`services/`)

```
services/
├── api/                           # メインREST API（Rust）
│   ├── src/
│   │   ├── routes/                # APIエンドポイント
│   │   │   ├── auth.rs            # 認証（SIWE）
│   │   │   ├── user.rs            # ユーザー管理
│   │   │   ├── lock.rs            # ロック操作
│   │   │   ├── unlock.rs          # アンロック操作
│   │   │   ├── prover.rs          # Prover管理
│   │   │   ├── observer.rs        # Observer管理
│   │   │   ├── governance.rs      # ガバナンス
│   │   │   ├── token_hub.rs       # Token Hub
│   │   │   ├── enterprise.rs      # Enterprise
│   │   │   ├── admin.rs           # Admin
│   │   │   └── mod.rs             # ルート定義
│   │   │
│   │   ├── db/                    # データベース
│   │   ├── models/                # データモデル
│   │   └── middleware/            # ミドルウェア
│   │
│   └── Cargo.toml
│
├── monitor-bot/                   # 監視Bot
├── sig-queue/                     # 署名キュー管理
└── event-bridge/                  # イベントブリッジ
```

**技術スタック**:
- Rust (Axum)
- PostgreSQL
- Redis

### 2.3 スマートコントラクト (`contracts/`)

```
contracts/
├── src/                           # Solidityコントラクト
│   ├── L1Vault.sol                # メインVault
│   ├── TimeLock.sol               # タイムロック
│   ├── Staking.sol                # ステーキング
│   ├── Governance.sol             # ガバナンス
│   └── ...
│
├── test/                          # テスト（Foundry）
├── script/                        # デプロイスクリプト
└── foundry.toml
```

**技術スタック**:
- Solidity 0.8.x
- Foundry (forge, cast, anvil)
- OpenZeppelin

### 2.4 L3チェーン (`l3-aegis/`)

```
l3-aegis/
├── crates/                        # Rustクレート
│   ├── aegis-core/                # コアロジック
│   ├── aegis-consensus/           # コンセンサス
│   ├── aegis-crypto/              # 暗号処理（Dilithium等）
│   ├── aegis-node/                # ノード実装
│   ├── aegis-sequencer/           # シーケンサー
│   ├── aegis-storage/             # ストレージ
│   ├── aegis-network/             # P2Pネットワーク
│   ├── aegis-types/               # 型定義
│   ├── aegis-smt/                 # Sparse Merkle Tree
│   ├── aegis-keygen/              # 鍵生成
│   └── aegis-cli/                 # CLI
│
├── src/                           # メインエントリ
└── Cargo.toml
```

### 2.5 ZK回路 (`circuits/`)

```
circuits/
└── dilithium-stark/               # Dilithium STARK証明
    ├── src/
    │   ├── lib.rs
    │   └── ...
    └── Cargo.toml
```

### 2.6 共有パッケージ (`packages/`, `shared-types/`)

```
packages/
└── sdk/                           # クライアントSDK

shared-types/
└── src/                           # 共有型定義（Rust）
```

---

## 3. ドキュメント

### 3.1 現在の構造 (`docs/`)

```
docs/
├── agents/                        # AIエージェント関連
│   └── prompts/                   # 各種プロンプト
│       ├── 30_ui_impl.md          # UI実装
│       ├── 31_design_pir.md       # ペルソナレビュー
│       ├── 33_a11y_check.md       # A11yチェック
│       ├── 37_e2e_test.md         # E2Eテスト
│       └── 38_orchestrator.md     # オーケストレーター
│
├── archive/                       # アーカイブ（過去フェーズ）
│   ├── 01_Phase1/
│   ├── 02_Phase2/
│   └── 03_Phase3/
│
├── core/                          # コア仕様
│   ├── UNIFIED_SPEC.md            # 統合仕様書
│   └── SEQUENCES.md               # シーケンス詳細
│
├── design/                        # デザイン関連
│   ├── DESIGN_SYSTEM.md           # デザイン標準 ⭐
│   ├── DESIGN_SPEC_v3.md          # 設計仕様書 ⭐
│   ├── DESIGN_REVIEW_AGENTS.md    # ペルソナ定義
│   ├── assets/                    # デザインアセット
│   │   └── design-concept-5-japan-premium.html
│   └── system_XX_{name}/          # 各システムのモック
│       └── wip/mocks/
│
├── phase6/                        # Phase 6 進捗・計画
│   ├── PHASE6_PROGRESS.md         # 進捗管理 ⭐
│   ├── PHASE6_PLANNING_PROPOSAL.md
│   └── DEVELOPMENT_*.md
│
├── specs/                         # 仕様書
│   ├── IMPLEMENTATION_GUIDE.md    # 実装ガイド ⭐最重要
│   ├── DATA_MODEL.md              # データモデル ⭐
│   ├── CODEBASE_MAP.md            # 本ドキュメント
│   └── URL_REFERENCE.md           # URL一覧
│
├── process-history/               # 経緯履歴
│
└── README.md
```

### 3.2 主要ドキュメント一覧

| ドキュメント | パス | 用途 |
|-------------|------|------|
| **IMPLEMENTATION_GUIDE.md** | `docs/specs/` | 実装ガイド（最重要） |
| **DESIGN_SYSTEM.md** | `docs/design/` | デザイン標準ルール |
| **DATA_MODEL.md** | `docs/specs/` | エンティティ中心データ設計 |
| **CODEBASE_MAP.md** | `docs/specs/` | コードベース地図 |
| **PHASE6_PROGRESS.md** | `docs/phase6/` | Phase 6進捗管理 |
| **DESIGN_SPEC_v3.md** | `docs/design/` | アプリ中心設計仕様 |
| **URL_REFERENCE.md** | `docs/specs/` | 全画面URL一覧 |

---

## 4. アーカイブ・非推奨

### 4.1 削除済みフォルダ（2026-01-22）

| フォルダ | 理由 | 代替 |
|----------|------|------|
| `ui/` | 旧UIモノレポ | `apps/web/` |
| `web/` | 旧Web | `apps/web/` |
| `api/` | 旧API | `services/api/` |
| `client/` | 旧クライアント | `packages/sdk/` |
| `docs_new/` | 整理済み | `docs/` |

### 4.2 残存アーカイブ

| フォルダ | 内容 |
|----------|------|
| `_archive/` | デプロイ履歴（v1-optimistic-bridge等） |
| `docs/archive/` | 過去フェーズのドキュメント |

---

## 5. 開発時の参照ガイド

### 5.1 新しい画面を追加する時

```
1. デザイン確認
   → docs/design/DESIGN_SYSTEM.md
   → docs/design/system_XX_{name}/wip/mocks/

2. 仕様確認
   → docs/specs/IMPLEMENTATION_GUIDE.md の該当アプリセクション

3. ページ作成
   → apps/web/src/app/[locale]/{app}/{screen}/page.tsx

4. コンポーネント作成
   → apps/web/src/components/{app}/{Screen}.tsx

5. 翻訳追加
   → apps/web/locales/ja/{app}.json
   → apps/web/locales/en/{app}.json
```

### 5.2 新しいAPIを追加する時

```
1. 仕様確認
   → docs_new/01_phase/06_phase6/DESIGN_SPEC_v3.md の該当アプリAPI一覧
   → docs_new/01_phase/06_phase6/DATA_MODEL.md でエンティティ確認

2. ルート追加
   → services/api/src/routes/{domain}.rs

3. モデル追加（必要な場合）
   → services/api/src/models/

4. テスト追加
   → services/api/tests/
```

### 5.3 コンポーネントを使う時

```
共通UIコンポーネント:
→ apps/web/src/components/ui/
  - Button: 9バリエーション（primary, secondary, outline, ghost, danger, warning, success, link, gold）
  - Card: カード
  - Input: 入力フィールド
  - Badge: バッジ
  - Tooltip: ツールチップ

使用例:
import { Button } from '@/components/ui/button';
<Button variant="primary" size="lg">ロックする</Button>
```

### 5.4 スタイルを適用する時

```
Tailwindカスタムクラス:
→ apps/web/tailwind.config.ts で定義済み

カラー:
- bg-hinomaru, text-hinomaru
- bg-gold, text-gold
- bg-background, bg-card, bg-surface
- text-foreground, text-foreground-secondary

角丸:
- rounded-qs (10px)
- rounded-qs-lg (14px)
- rounded-qs-xl (20px)

シャドウ:
- shadow-qs
- shadow-qs-gold
- shadow-qs-hover
```

### 5.5 Mock APIを追加する時

```
1. Route Handler作成
   → apps/web/src/app/api/{domain}/route.ts

2. APIクライアント作成
   → apps/web/src/lib/api/{domain}.ts

3. エクスポート追加
   → apps/web/src/lib/api/index.ts に追加

例（Lock API）:
// route.ts
export async function POST(request: NextRequest) { ... }
export async function GET(request: NextRequest) { ... }

// lib/api/lock.ts
export async function createLock(request: LockRequest) { ... }
export async function getLockStatus(lockId: string) { ... }
```

### 5.6 画面間でデータを渡す時

```
方法: URLSearchParams を使用

1. 送信側
const params = new URLSearchParams({
  amount: '5.00',
  period: '2',
});
router.push(`/consumer/lock/processing?${params.toString()}`);

2. 受信側
const searchParams = useSearchParams();
const amount = searchParams.get('amount') || 'default';

注意:
- 大量データの場合はZustand storeを使用
- 機密データはURLに含めない
```

---

## 更新履歴

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-22 | Claude | 初版作成 |
| 1.1 | 2026-01-22 | Claude | Mock API, lib/api追加。画面間データ渡しパターン追加 |
| 1.2 | 2026-01-22 | Claude | フォルダ整理完了: docs_new→docs統合、非推奨フォルダ削除 |
