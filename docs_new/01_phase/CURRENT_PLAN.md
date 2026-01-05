# Current Plan

> **Generated**: 2026-01-06 12:30 JST
> **Phase**: Phase 4 - UI/UX, Audit & Launch
> **Week**: UI Week 1-2 (基盤構築)

---

## 🔄 戦略変更について

PIR-P4-004の途中で戦略討議を行い、包括的なUI統合計画に移行しました。

| 項目 | 旧計画 | 新計画 |
|------|--------|--------|
| スコープ | 個別App (Admin Dashboard) | 9システム 253画面 |
| 構成 | 個別プロジェクト | Monorepo (Turborepo) |
| 開発順序 | Admin→Consumer→... | 基盤→Consumer→Admin拡張→... |

---

## 対象チェックリスト
`docs_new/01_phase/04_phase4/phase4.md`

---

## 仕様書参照

### 新UI統合計画（主要参照）
| ドキュメント | 内容 |
|------------|------|
| `STEP_E_UI_INTEGRATION_PLAN.md` | 9システム構成、253画面定義、実装計画 |

### 戦略決定文書
| ドキュメント | 参照セクション |
|------------|---------------|
| 00_INDEX.md | 全体概要、Agent別参照ガイド |
| 01_ARCHITECTURE.md | システム構成、技術スタック |
| 02_PERSONAS.md | 12ペルソナ定義 |
| 03_USER_JOURNEYS.md | 全プレイヤージャーニー |
| 04_SCREENS.md | 253画面定義 |
| 05_AUTH_SECURITY.md | 認証・権限設計 |
| 06_DATA_DESIGN.md | データ保存先設計 |
| 07_INTEGRATION.md | API統合設計 |

### Core仕様書
| ドキュメント | 確認内容 |
|------------|---------|
| CORE_PRINCIPLES.md | CP-1〜5 準拠確認 |
| SEQUENCES.md | SEQ#1〜8 フロー準拠 |

---

## 今回のスコープ: UI Week 1-2 基盤構築

### 目標
9システム253画面を効率的に開発するための共通基盤を構築する。

### タスク一覧

| タスクID | 内容 | 優先度 | 状態 |
|---------|------|:------:|:----:|
| UIBASE-001 | Monorepo (Turborepo) セットアップ | 🔴 P0 | ⬜ |
| UIBASE-002 | 共通UIコンポーネントライブラリ | 🔴 P0 | ⬜ |
| UIBASE-003 | デザインシステム (Tailwind Config) | 🔴 P0 | ⬜ |
| UIBASE-004 | SIWE認証基盤 | 🔴 P0 | ⬜ |
| UIBASE-005 | wagmi/viem設定 (SDK連携) | 🔴 P0 | ⬜ |
| UIBASE-006 | API Client wrapper | 🔴 P0 | ⬜ |
| UIBASE-007 | 共通ESLint/TypeScript設定 | 🟠 P1 | ⬜ |
| UIBASE-008 | Storybook セットアップ | 🟠 P1 | ⬜ |

---

## 成果物

### Monorepo構造

```
quantum-shield-ui/
├── apps/
│   ├── consumer/           # Consumer App (Next.js 14) - Week 3-4
│   ├── token-hub/          # Token Hub (Next.js 14) - Week 7-8
│   ├── governance/         # Governance (Next.js 14) - Week 9-10
│   ├── prover/             # Prover Portal (Next.js 14) - Week 7-8
│   ├── observer/           # Observer/Challenger (Next.js 14) - Week 9-10
│   ├── explorer/           # Explorer (Next.js 14) - Week 9-10
│   ├── enterprise/         # Enterprise Admin (Next.js 14) - Week 11-12
│   └── admin/              # QS Admin (既存移行+拡張) - Week 5-6
│
├── packages/
│   ├── ui/                 # 共通UIコンポーネント ← UIBASE-002
│   ├── crypto/             # Dilithium WASM等 (SDK連携) ← UIBASE-005
│   ├── web3/               # wagmi/viem wrapper ← UIBASE-005
│   ├── api-client/         # API Client ← UIBASE-006
│   └── config/             # 共通設定 ← UIBASE-007
│
└── tooling/
    ├── eslint-config/      # ESLint設定 ← UIBASE-007
    ├── typescript-config/  # TypeScript設定 ← UIBASE-007
    └── tailwind-config/    # Tailwind設定 ← UIBASE-003
```

### ファイル一覧

| ファイル/ディレクトリ | 説明 | タスクID |
|---------------------|------|----------|
| `quantum-shield-ui/` | Monorepoルート | UIBASE-001 |
| `packages/ui/` | 共通UIコンポーネント | UIBASE-002 |
| `packages/ui/src/components/` | Button, Card, Modal, Form等 | UIBASE-002 |
| `tooling/tailwind-config/` | デザイントークン、カラー、タイポ | UIBASE-003 |
| `packages/web3/` | SIWE, wagmi設定 | UIBASE-004, 005 |
| `packages/api-client/` | API wrapper | UIBASE-006 |
| `tooling/eslint-config/` | ESLint共通設定 | UIBASE-007 |
| `tooling/typescript-config/` | tsconfig共通設定 | UIBASE-007 |

---

## 技術スタック

| コンポーネント | 技術 | 理由 |
|---------------|------|------|
| Monorepo | Turborepo | 高速ビルド、キャッシュ、並列実行 |
| Package Manager | pnpm | ディスク効率、Turborepo推奨 |
| フレームワーク | Next.js 14 (App Router) | 全Appで統一、SSR/SSG対応 |
| スタイリング | Tailwind CSS v3.4 | デザインシステム統一 |
| UIライブラリ | shadcn/ui (カスタマイズ) | コピー&ペースト、完全制御 |
| 状態管理 | TanStack Query v5 + Zustand | サーバー状態 + ローカル状態 |
| Wallet | wagmi v2 + viem | Week 3 SDK活用、WalletConnect v2 |
| 認証 | SIWE + NextAuth.js | Web3ネイティブ認証 |
| Dilithium | @quantum-shield/sdk (WASM) | Week 3成果物 |
| テスト | Vitest + Testing Library | Jest互換、高速 |
| ドキュメント | Storybook 8 | コンポーネントカタログ |

---

## 実行順序

### Day 1: Monorepoセットアップ

1. **UIBASE-001**: Turborepo初期化
   ```bash
   pnpm dlx create-turbo@latest quantum-shield-ui
   cd quantum-shield-ui
   ```
2. pnpm workspace設定
3. 基本ディレクトリ構造作成
4. turbo.json設定（build, dev, lint, test）

### Day 2-3: 共通設定 + デザインシステム

5. **UIBASE-007**: 共通設定パッケージ
   - `tooling/eslint-config/`
   - `tooling/typescript-config/`
6. **UIBASE-003**: Tailwind設定
   - デザイントークン定義（色、間隔、タイポグラフィ）
   - Quantum Shieldブランドカラー
   - レスポンシブブレークポイント

### Day 4-5: 共通UIコンポーネント

7. **UIBASE-002**: 共通UIライブラリ
   - shadcn/ui ベースでカスタマイズ
   - 基本コンポーネント:
     - Button, Input, Select, Checkbox
     - Card, Modal, Dialog
     - Table, Pagination
     - Toast, Alert
     - Tabs, Accordion
     - Loading, Skeleton
   - Quantum Shield固有:
     - WalletButton
     - TimeLockCountdown
     - TransactionStatus
     - AddressDisplay

### Day 6-7: Web3基盤

8. **UIBASE-004**: SIWE認証基盤
   - NextAuth.js + SIWE adapter
   - セッション管理
   - 認証状態フック
9. **UIBASE-005**: wagmi/viem設定
   - チェーン設定（Sepolia, Aegis L3）
   - コントラクト設定
   - SDK連携（@quantum-shield/sdk）

### Day 8-9: API Client + Storybook

10. **UIBASE-006**: API Client
    - OpenAPI型生成（Week 2 API仕様書から）
    - TanStack Query wrapper
    - エラーハンドリング
11. **UIBASE-008**: Storybook
    - コンポーネントカタログ
    - デザインシステムドキュメント

### Day 10: 統合テスト + サンプルApp

12. packages間の連携テスト
13. サンプルApp作成（consumer/ 空App）
14. CI/CD設定（GitHub Actions）

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - SDK経由でDilithium-III/SPHINCS+使用
- [x] CP-2: Self-Custody - 認証基盤でサーバー鍵保存なし設計
- [x] CP-3: Time Lock存在 - TimeLockCountdownコンポーネント準備
- [x] CP-4: Slashing存在 - TransactionStatusで表示準備
- [x] CP-5: 透明性 - Explorer連携、オンチェーン検証リンク設計

---

## 既存コードの扱い

### `apps/admin-dashboard/` (旧Week 4-5成果物)

| 項目 | 対応 |
|------|------|
| 既存コード | 約60%再利用可能 |
| 移行タイミング | UI Week 5-6 |
| 作業内容 | Monorepo構造への移行、共通パッケージ利用 |

### 再利用対象
- Prover管理画面 (UI-001~004)
- Provider管理画面 (UI-005~006)
- Emergency Pause画面
- Edition Switch画面

### 拡張が必要
- L3ノード管理詳細
- Transaction Monitor詳細
- Community管理（Decen用）
- Customer管理（Enterprise用）
- レポート生成
- 監査ログ詳細

---

## リスク・懸念事項

| # | リスク | 重要度 | 緩和策 |
|---|--------|:------:|--------|
| 1 | Monorepo複雑性 | 🟠 Medium | Turborepoドキュメント参照、段階的構築 |
| 2 | パッケージ間依存 | 🟠 Medium | 明確なインターフェース定義 |
| 3 | 既存コード移行 | 🟡 Low | Week 5-6で計画的に実施 |

---

## 新UI開発ロードマップ

| UI Week | 期間 | 内容 | 成果物 |
|---------|------|------|--------|
| **Week 1-2** | Day 1-10 | **基盤構築** ← 今回 | Monorepo, 共通コンポーネント |
| Week 3-4 | Day 11-20 | Consumer App MVP | Lock/Unlock基本フロー |
| Week 5-6 | Day 21-30 | Consumer完成 + Admin拡張 | Emergency, History |
| Week 7-8 | Day 31-40 | Prover Portal + Token Hub | veQS, 署名キュー |
| Week 9-10 | Day 41-50 | Governance + Explorer | 投票、検索 |
| Week 11-12 | Day 51-60 | Enterprise + 仕上げ | 統合テスト |

---

## 次のアクション

| # | アクション | 担当 | 期限 |
|---|-----------|------|------|
| 1 | 02_spec.md実行（SPEC_REVIEW.md作成） | Engineer | 計画後 |
| 2 | 03_impl.md実行（基盤実装） | Engineer | 仕様後 |
| 3 | 04_review.md実行（セキュリティレビュー） | Red Team | 実装後 |
| 4 | 05_pir.md実行（PIR-P4-UI-001） | 全体 | レビュー後 |

---

**END OF CURRENT PLAN**
