# Current Plan

> **Generated**: 2026-01-07 10:00 JST
> **Phase**: 4 - UI/UX, Audit & Launch
> **Target**: UI Week 3-4 Consumer App MVP

## 対象チェックリスト
`docs_new/01_phase/04_phase4/00_戦略決定文書/04_SCREENS.md` §2.1 Consumer App

---

## 仕様書参照

### 対象Sequence
| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| SEQ#1 | UI/API | Lock Flow - SEQUENCES §1 |
| SEQ#2 | UI/API | Unlock Flow (Normal) - SEQUENCES §2 |
| SEQ#3 | UI/API | Unlock Flow (Emergency) - SEQUENCES §3 |

### セキュリティ要件
| 要件 | 仕様書出典 | UI実装方法 |
|------|----------|-----------|
| 24h Time Lock (Normal) | SEQ#2 | TimeLockCountdown コンポーネント |
| 7d Time Lock (Emergency) | SEQ#3 | TimeLockCountdown コンポーネント |
| Emergency Bond計算 | SEQ#3 | MAX(0.5 ETH, amount × 5%) 表示 |
| Dilithium署名 | SEQ#2, SEQ#3 | Dilithium WASM使用 |
| 秘密鍵ローカル保管 | CP-2 | ブラウザ内のみ、サーバー送信禁止 |

---

## 戦略決定文書参照

> パス: `docs_new/01_phase/04_phase4/00_戦略決定文書/`

### 対象システム・ペルソナ
| 項目 | 値 |
|------|-----|
| 対象システム | Consumer App |
| 対象ペルソナ | End User (Sarah - 個人投資家、Mike - DeFi愛好家) |
| 対象画面数 | 25画面（P0優先度） |
| 認証方式 | SIWE (Sign-In with Ethereum) |
| スマホ対応 | ✅ フル対応必須 |

### 参照ドキュメント
| ドキュメント | 参照セクション |
|------------|---------------|
| 01_ARCHITECTURE.md | §2.1 Consumer App構成 |
| 02_PERSONAS.md | §1 End User Personas |
| 03_USER_JOURNEYS.md | Part 2 §1 End User Journey |
| 04_SCREENS.md | §2.1 Consumer App (25画面) |
| 05_AUTH_SECURITY.md | §2.1 SIWE認証フロー |
| 06_DATA_DESIGN.md | §2.1 Consumer App データ |
| 07_INTEGRATION.md | Part 1 §1 Consumer App API |

---

## 前回レビュー課題

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| - | - | なし（PIR-P4-UIW1W2 PASS） | - |

### PIR-P4-UIW1W2 推奨事項（継続タスク）
| # | 推奨事項 | 今回の対応 |
|---|---------|-----------|
| 1 | E2Eテスト（UI→SDK→API→L1/L3） | 対応予定 |
| 2 | Storybookセットアップ | UIBASE-008として対応 |
| 3 | httpOnly cookies本番環境導入 | 次週対応 |

---

## 今回のスコープ

### 実装項目（UI Week 3-4）

#### Week 3: Landing + Onboarding + Dashboard

| タスクID | 内容 | 画面数 | 優先度 |
|---------|------|:------:|:------:|
| UI-CON-001 | Landing Page | 4 | P0 |
| UI-CON-002 | Onboarding Flow | 4 | P0 |
| UI-CON-003 | Dashboard | 1 | P0 |

#### Week 4: Lock + Unlock Flow

| タスクID | 内容 | 画面数 | 優先度 |
|---------|------|:------:|:------:|
| UI-CON-004 | Lock Flow | 4 | P0 |
| UI-CON-005 | Unlock Flow (Normal) | 7 | P0 |
| UI-CON-006 | Unlock Flow (Emergency) | 1 | P0 |
| UI-CON-007 | History + Settings | 3 | P0 |

#### 追加タスク

| タスクID | 内容 | 優先度 |
|---------|------|:------:|
| UIBASE-008 | Storybookセットアップ | P1 |
| UI-TEST-001 | E2Eテスト（Critical Path） | P0 |

### テスト項目
- [ ] 全画面のレスポンシブ対応（375px〜1280px）
- [ ] SIWE認証フロー
- [ ] Dilithium鍵生成（WASM）
- [ ] Lock/Unlock API連携
- [ ] TimeLockカウントダウン表示
- [ ] E2Eテスト（Lock→Unlock Critical Path）

---

## 成果物

### 画面一覧（25画面）

```
ui/apps/consumer/
├── src/
│   ├── app/
│   │   ├── (public)/                      # 未接続ページ
│   │   │   ├── page.tsx                   # Landing Page
│   │   │   ├── how-it-works/page.tsx      # How It Works
│   │   │   ├── security/page.tsx          # Security Explainer
│   │   │   └── faq/page.tsx               # FAQ
│   │   │
│   │   ├── (auth)/                        # 認証関連
│   │   │   ├── connect/page.tsx           # Wallet Connect
│   │   │   ├── key-generation/page.tsx    # Dilithium鍵生成
│   │   │   ├── backup/page.tsx            # Backup Instructions
│   │   │   └── ready/page.tsx             # Ready
│   │   │
│   │   ├── (app)/                         # 認証後メインアプリ
│   │   │   ├── dashboard/page.tsx         # Dashboard
│   │   │   │
│   │   │   ├── lock/
│   │   │   │   ├── page.tsx               # Lock Input
│   │   │   │   ├── confirm/page.tsx       # Lock Confirmation
│   │   │   │   ├── processing/page.tsx    # Lock Processing
│   │   │   │   └── success/page.tsx       # Lock Success
│   │   │   │
│   │   │   ├── unlock/
│   │   │   │   ├── page.tsx               # Unlock Select
│   │   │   │   ├── method/page.tsx        # Unlock Method
│   │   │   │   ├── sign/page.tsx          # Dilithium Sign
│   │   │   │   ├── waiting/page.tsx       # Prover Waiting
│   │   │   │   ├── countdown/page.tsx     # Time Lock Countdown
│   │   │   │   ├── ready/page.tsx         # Unlock Ready
│   │   │   │   ├── complete/page.tsx      # Unlock Complete
│   │   │   │   └── emergency/
│   │   │   │       └── bond/page.tsx      # Emergency Bond
│   │   │   │
│   │   │   ├── history/page.tsx           # History
│   │   │   ├── settings/page.tsx          # Settings
│   │   │   └── keys/page.tsx              # Key Management
│   │   │
│   │   └── (exit)/
│   │       └── disconnect/page.tsx        # Account Disconnect
│   │
│   ├── components/
│   │   ├── lock/                          # Lock関連コンポーネント
│   │   ├── unlock/                        # Unlock関連コンポーネント
│   │   └── onboarding/                    # Onboarding関連コンポーネント
│   │
│   └── hooks/
│       ├── use-dilithium.ts               # Dilithium WASM hook
│       ├── use-lock.ts                    # Lock API hook
│       └── use-unlock.ts                  # Unlock API hook
```

### テスト

```
ui/apps/consumer/
├── __tests__/
│   ├── pages/                             # ページテスト
│   ├── components/                        # コンポーネントテスト
│   └── e2e/                               # E2Eテスト
│       ├── lock-flow.spec.ts
│       └── unlock-flow.spec.ts
```

### Storybook

```
ui/apps/consumer/
├── .storybook/
│   ├── main.ts
│   └── preview.ts
└── stories/
    ├── pages/
    └── components/
```

---

## 実行順序

### Week 3（1/7〜1/10）

1. **Day 1**: Landing Page + How It Works
   - 静的ページ実装
   - レスポンシブ対応

2. **Day 2**: Onboarding Flow
   - Wallet Connect（SIWE）
   - Dilithium鍵生成（WASM）
   - Backup Instructions

3. **Day 3**: Dashboard
   - 総資産表示
   - Lock中資産一覧
   - 進行中Unlock一覧

4. **Day 4**: Lock Flow
   - Lock Input（金額入力）
   - Lock Confirmation
   - Lock Processing
   - Lock Success

### Week 4（1/11〜1/14）

5. **Day 5**: Unlock Flow (Normal) Part 1
   - Unlock Select
   - Unlock Method選択
   - Dilithium Sign

6. **Day 6**: Unlock Flow (Normal) Part 2
   - Prover Waiting
   - Time Lock Countdown
   - Unlock Ready
   - Unlock Complete

7. **Day 7**: Emergency + History + Settings
   - Emergency Bond
   - History
   - Settings
   - Key Management

8. **Day 8**: E2E テスト + レビュー
   - E2Eテスト作成
   - Storybookセットアップ
   - レビュー準備

---

## Core Principles確認
- [x] CP-1: 完全量子耐性 - Dilithium鍵生成（WASM）使用
- [x] CP-2: Self-Custody - 秘密鍵はブラウザ内のみ保管
- [x] CP-3: Time Lock存在 - 24h/7d カウントダウン表示
- [x] CP-4: Slashing存在 - N/A（UI表示のみ）
- [x] CP-5: 透明性 - 全状態をダッシュボードに表示

---

## リスク・懸念事項

| # | リスク | 影響 | 対策 |
|---|--------|------|------|
| 1 | Dilithium WASM性能 | 鍵生成に時間がかかる可能性 | Web Workerで非同期処理 |
| 2 | レスポンシブ対応工数 | 画面数が多い | 共通コンポーネント活用 |
| 3 | API連携テスト | L3接続必要 | Mock APIでの開発進行 |

---

## 依存関係

### 既存実装（使用可能）
| パッケージ | 内容 |
|-----------|------|
| `@quantum-shield/ui` | 22種UIコンポーネント |
| `@quantum-shield/web3` | wagmi/SIWE設定 |
| `@quantum-shield/api-client` | APIクライアント |

### SDK（Week 3で実装済み）
| パッケージ | 内容 |
|-----------|------|
| `quantum-shield-sdk` | Lock/Unlock API |
| Dilithium WASM | 鍵生成（<500ms） |

---

**END OF CURRENT PLAN**
