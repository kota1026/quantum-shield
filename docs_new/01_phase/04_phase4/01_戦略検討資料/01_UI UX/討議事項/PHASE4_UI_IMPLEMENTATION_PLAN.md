# 📋 Phase 4 UI/UX 実装計画

> **Version**: 1.0  
> **Date**: 2026年1月5日  
> **Duration**: 12週間（Phase 4期間内）

---

## 1. 実装スコープ

### 1.1 対象システム

| システム | 優先度 | 週 | 対象ユーザー |
|---------|:------:|:---:|------------|
| **Consumer App** | P0 | W1-4 | 一般ユーザー |
| **Token Hub** | P0 | W3-6 | QS/veQSホルダー |
| **Governance** | P1 | W5-8 | 投票者、提案者 |
| **Prover Portal** | P1 | W4-7 | Prover事業者 |
| **Explorer** | P1 | W2-4 | 公開閲覧者 |
| **Observer/Challenger Portal** | P2 | W7-9 | 監視者 |
| **Enterprise Admin** | P2 | W8-12 | B2B顧客 |
| **Service Provider Admin** | P3 | W10-12 | QS運営 |

### 1.2 技術スタック

```
Frontend:
├── Framework: Next.js 14 (App Router)
├── Language: TypeScript 5.x
├── UI Library: shadcn/ui + Radix UI
├── Styling: Tailwind CSS
├── State: Zustand / TanStack Query
├── Web3: wagmi v2 + viem
├── Dilithium: WASM (liboqs binding)
├── Charts: Recharts
└── Forms: React Hook Form + Zod

Backend:
├── API: REST + WebSocket
├── Auth: NextAuth.js + SIWE
└── Real-time: Socket.io

Infrastructure:
├── Hosting: Vercel
├── CDN: Cloudflare
└── Monitoring: Sentry + Vercel Analytics
```

---

## 2. 週次実装計画

### Week 1: プロジェクトセットアップ & 共通コンポーネント

#### タスク

| ID | タスク | 担当 | 時間 |
|----|-------|------|------|
| UI-001 | Next.js 14プロジェクト初期化 | FE | 4h |
| UI-002 | Tailwind + shadcn/ui設定 | FE | 4h |
| UI-003 | デザインシステム定義（カラー、タイポグラフィ） | Design | 8h |
| UI-004 | 共通レイアウト（Header、Sidebar、Footer） | FE | 8h |
| UI-005 | 共通コンポーネント（Button、Input、Card、Modal） | FE | 12h |
| UI-006 | wagmi + viem設定（Sepolia、Aegis L3） | FE | 4h |
| UI-007 | 認証フロー（SIWE + NextAuth） | FE | 8h |

#### 成果物
- [ ] 基本プロジェクト構造
- [ ] デザインシステムドキュメント
- [ ] 共通コンポーネントライブラリ
- [ ] ウォレット接続機能

---

### Week 2: Consumer App - Lock機能 & Explorer基盤

#### タスク

| ID | タスク | 担当 | 時間 |
|----|-------|------|------|
| UI-008 | Dashboard画面 | FE | 8h |
| UI-009 | Lock Form（資産選択、金額入力、送金先） | FE | 12h |
| UI-010 | Dilithium鍵管理UI（生成、インポート、エクスポート） | FE | 16h |
| UI-011 | Lock Preview & 署名フロー | FE | 8h |
| UI-012 | Lock Success画面 | FE | 4h |
| UI-013 | Explorer: Landing & 検索 | FE | 8h |
| UI-014 | Explorer: Lock一覧 & 詳細 | FE | 8h |

#### 成果物
- [ ] Lock完全フロー（Form → Sign → Success）
- [ ] Dilithium鍵管理機能
- [ ] Explorer基本機能

---

### Week 3: Consumer App - Unlock機能（Normal Path）

#### タスク

| ID | タスク | 担当 | 時間 |
|----|-------|------|------|
| UI-015 | Active Locks一覧 | FE | 8h |
| UI-016 | Unlock Request Form | FE | 8h |
| UI-017 | Dilithium署名UI | FE | 8h |
| UI-018 | Prover署名待機画面（リアルタイム更新） | FE | 12h |
| UI-019 | 24h Time Lock カウントダウン | FE | 8h |
| UI-020 | Claim画面 | FE | 4h |
| UI-021 | Transaction History | FE | 8h |

#### 成果物
- [ ] Unlock (Normal) 完全フロー
- [ ] リアルタイムステータス更新
- [ ] 取引履歴表示

---

### Week 4: Consumer App - Emergency Path & Prover Portal開始

#### タスク

| ID | タスク | 担当 | 時間 |
|----|-------|------|------|
| UI-022 | Emergency Mode検知 & 表示 | FE | 8h |
| UI-023 | Emergency Bond計算 & 支払いUI | FE | 8h |
| UI-024 | 7日Time Lock画面 | FE | 4h |
| UI-025 | Bond返還 & Claim | FE | 4h |
| UI-026 | Prover Registration: 開始画面 | FE | 4h |
| UI-027 | Prover Registration: 書類アップロード | FE | 12h |
| UI-028 | Prover Registration: Stake入金 | FE | 8h |
| UI-029 | Explorer: Unlock詳細 | FE | 8h |

#### 成果物
- [ ] Emergency Unlock完全フロー
- [ ] Prover登録フロー（前半）
- [ ] Explorer Unlock詳細

---

### Week 5: Token Hub - veQS Lock/Unlock

#### タスク

| ID | タスク | 担当 | 時間 |
|----|-------|------|------|
| UI-030 | Token Hub Dashboard | FE | 8h |
| UI-031 | veQS Lock Form（期間選択、プレビュー） | FE | 12h |
| UI-032 | veQS Lock延長 | FE | 8h |
| UI-033 | veQS Unlock（早期解除ペナルティ計算） | FE | 12h |
| UI-034 | Voting Power表示 & 減衰グラフ | FE | 8h |
| UI-035 | Prover Registration: 審査待機画面 | FE | 8h |
| UI-036 | Prover Registration: 完了 & Dashboard遷移 | FE | 4h |

#### 成果物
- [ ] veQS Lock/Unlock完全フロー
- [ ] Voting Power可視化
- [ ] Prover登録完了

---

### Week 6: Token Hub - Delegation & Rewards

#### タスク

| ID | タスク | 担当 | 時間 |
|----|-------|------|------|
| UI-037 | Delegate一覧（フィルタ、ソート、検索） | FE | 12h |
| UI-038 | Delegate詳細プロフィール | FE | 8h |
| UI-039 | Delegation実行フロー | FE | 8h |
| UI-040 | My Delegations管理 | FE | 8h |
| UI-041 | Delegate登録フォーム | FE | 8h |
| UI-042 | Rewards Dashboard | FE | 8h |
| UI-043 | Claim Rewards | FE | 4h |

#### 成果物
- [ ] Delegation完全フロー
- [ ] Delegate登録機能
- [ ] Rewards管理

---

### Week 7: Governance - Proposal & Voting

#### タスク

| ID | タスク | 担当 | 時間 |
|----|-------|------|------|
| UI-044 | Proposal一覧（フィルタ、ステータス別） | FE | 8h |
| UI-045 | Proposal詳細（タイムライン、投票状況） | FE | 12h |
| UI-046 | 投票UI（For/Against/Abstain、理由入力） | FE | 8h |
| UI-047 | Proposal作成フォーム | FE | 16h |
| UI-048 | Quorum進捗表示 | FE | 4h |
| UI-049 | Prover Dashboard | FE | 12h |

#### 成果物
- [ ] Governance投票フロー
- [ ] Proposal作成フロー
- [ ] Prover Dashboard

---

### Week 8: Governance完成 & Prover署名システム

#### タスク

| ID | タスク | 担当 | 時間 |
|----|-------|------|------|
| UI-050 | Proposal実行（TimeLock後） | FE | 8h |
| UI-051 | My Votes履歴 | FE | 4h |
| UI-052 | Prover署名承認画面（Pending Queue） | FE | 16h |
| UI-053 | 署名要求詳細（検証結果表示） | FE | 12h |
| UI-054 | 2-of-3承認ステータス | FE | 8h |
| UI-055 | Prover Delegation設定 | FE | 8h |

#### 成果物
- [ ] Governance完全機能
- [ ] Prover署名承認システム
- [ ] Prover Delegation管理

---

### Week 9: Observer/Challenger Portal

#### タスク

| ID | タスク | 担当 | 時間 |
|----|-------|------|------|
| UI-056 | Monitor Dashboard（Pending Unlocks） | FE | 12h |
| UI-057 | 異常検知アラート表示 | FE | 8h |
| UI-058 | Challenge提起フォーム | FE | 12h |
| UI-059 | Challenge進捗追跡 | FE | 8h |
| UI-060 | Challenge結果 & Reward Claim | FE | 8h |
| UI-061 | Prover Exit フロー | FE | 8h |

#### 成果物
- [ ] Challenger完全フロー
- [ ] Observer監視Dashboard
- [ ] Prover Exit機能

---

### Week 10: Enterprise - Customer Admin Portal（前半）

#### タスク

| ID | タスク | 担当 | 時間 |
|----|-------|------|------|
| UI-062 | Enterprise Login（SSO対応） | FE | 12h |
| UI-063 | Organization Dashboard | FE | 8h |
| UI-064 | User Management（CRUD） | FE | 12h |
| UI-065 | Role & Permission管理 | FE | 8h |
| UI-066 | API Key管理 | FE | 8h |
| UI-067 | Security Settings（IP Whitelist、2FA） | FE | 8h |

#### 成果物
- [ ] Enterprise認証
- [ ] 組織管理機能

---

### Week 11: Enterprise - Customer Admin Portal（後半）

#### タスク

| ID | タスク | 担当 | 時間 |
|----|-------|------|------|
| UI-068 | Transaction Dashboard（Enterprise版） | FE | 12h |
| UI-069 | Transaction List & Export | FE | 8h |
| UI-070 | Limits設定 | FE | 8h |
| UI-071 | Notification & Webhook設定 | FE | 8h |
| UI-072 | Usage Report | FE | 8h |
| UI-073 | Compliance Report & Audit Trail | FE | 12h |

#### 成果物
- [ ] Enterprise Transaction管理
- [ ] 設定機能
- [ ] レポート機能

---

### Week 12: Service Provider Admin & 統合テスト

#### タスク

| ID | タスク | 担当 | 時間 |
|----|-------|------|------|
| UI-074 | SP Admin: Customer Management | FE | 12h |
| UI-075 | SP Admin: Contract Management | FE | 8h |
| UI-076 | SP Admin: Billing Dashboard | FE | 8h |
| UI-077 | SP Admin: Service Control（Suspend/Terminate） | FE | 12h |
| UI-078 | 全システム統合テスト | QA | 16h |
| UI-079 | パフォーマンス最適化 | FE | 8h |
| UI-080 | ドキュメント整備 | All | 8h |

#### 成果物
- [ ] Service Provider Admin基本機能
- [ ] 統合テスト完了
- [ ] 本番デプロイ準備

---

## 3. コンポーネント設計

### 3.1 共通コンポーネント

```
components/
├── ui/                      # shadcn/ui ベース
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── modal.tsx
│   ├── toast.tsx
│   ├── dropdown.tsx
│   ├── tabs.tsx
│   └── table.tsx
│
├── layout/
│   ├── Header.tsx           # ナビゲーション、ウォレット接続
│   ├── Sidebar.tsx          # サイドメニュー
│   ├── Footer.tsx
│   └── PageLayout.tsx       # 共通レイアウト
│
├── web3/
│   ├── ConnectButton.tsx    # ウォレット接続ボタン
│   ├── NetworkSwitch.tsx    # ネットワーク切替
│   ├── TxStatus.tsx         # トランザクションステータス
│   └── AddressDisplay.tsx   # アドレス表示（ENS対応）
│
├── crypto/
│   ├── DilithiumKeyManager.tsx  # 鍵管理UI
│   ├── DilithiumSigner.tsx      # 署名UI
│   ├── KeyBackup.tsx            # バックアップ
│   └── KeyImport.tsx            # インポート
│
├── forms/
│   ├── AmountInput.tsx      # 金額入力（Max、USD表示）
│   ├── AddressInput.tsx     # アドレス入力（検証付き）
│   ├── AssetSelector.tsx    # 資産選択
│   └── ChainSelector.tsx    # チェーン選択
│
└── display/
    ├── Countdown.tsx        # カウントダウンタイマー
    ├── ProgressBar.tsx      # 進捗バー
    ├── StatusBadge.tsx      # ステータスバッジ
    ├── TxHash.tsx           # TxHashリンク
    └── TokenAmount.tsx      # トークン金額表示
```

### 3.2 機能別コンポーネント

```
features/
├── lock/
│   ├── LockForm.tsx
│   ├── LockPreview.tsx
│   ├── LockSuccess.tsx
│   └── LockList.tsx
│
├── unlock/
│   ├── UnlockForm.tsx
│   ├── ProverStatus.tsx
│   ├── TimeLockCountdown.tsx
│   ├── ClaimButton.tsx
│   └── EmergencyMode.tsx
│
├── token/
│   ├── VeQSLockForm.tsx
│   ├── VeQSUnlock.tsx
│   ├── VotingPowerChart.tsx
│   ├── DelegateCard.tsx
│   ├── DelegateList.tsx
│   └── RewardsCard.tsx
│
├── governance/
│   ├── ProposalCard.tsx
│   ├── ProposalDetail.tsx
│   ├── VoteForm.tsx
│   ├── QuorumProgress.tsx
│   ├── ProposalTimeline.tsx
│   └── ProposalCreate.tsx
│
├── prover/
│   ├── ProverDashboard.tsx
│   ├── SigningQueue.tsx
│   ├── SignatureDetail.tsx
│   ├── ApprovalStatus.tsx
│   ├── StakeManager.tsx
│   └── ProverRegistration.tsx
│
├── challenger/
│   ├── MonitorDashboard.tsx
│   ├── ChallengeForm.tsx
│   ├── ChallengeStatus.tsx
│   └── AlertList.tsx
│
└── enterprise/
    ├── OrgDashboard.tsx
    ├── UserManagement.tsx
    ├── APIKeyManager.tsx
    ├── TxDashboard.tsx
    ├── ReportGenerator.tsx
    └── ServiceControl.tsx
```

---

## 4. デザインシステム

### 4.1 カラーパレット

```css
:root {
  /* Primary - Quantum Blue */
  --primary-50: #e6f4ff;
  --primary-100: #b3dfff;
  --primary-200: #80c9ff;
  --primary-300: #4db3ff;
  --primary-400: #1a9dff;
  --primary-500: #0080e6;  /* Main */
  --primary-600: #0066b3;
  --primary-700: #004d80;
  --primary-800: #00334d;
  --primary-900: #001a26;

  /* Secondary - Shield Purple */
  --secondary-50: #f3e8ff;
  --secondary-100: #dbb6ff;
  --secondary-200: #c384ff;
  --secondary-300: #ab52ff;
  --secondary-400: #9320ff;
  --secondary-500: #7a00e6;  /* Main */
  --secondary-600: #6200b3;
  --secondary-700: #490080;
  --secondary-800: #31004d;
  --secondary-900: #18001a;

  /* Accent - Quantum Green */
  --accent-500: #00c853;

  /* Semantic Colors */
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;

  /* Neutral */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;

  /* Background */
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-tertiary: #1a1a24;
  --bg-card: #1f1f2e;
}
```

### 4.2 タイポグラフィ

```css
/* Font Family */
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Headings */
h1: 2.25rem/1.2 bold
h2: 1.875rem/1.25 semibold
h3: 1.5rem/1.3 semibold
h4: 1.25rem/1.4 medium
```

### 4.3 スペーシング

```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### 4.4 ブレークポイント

```css
--screen-sm: 640px;   /* Mobile landscape */
--screen-md: 768px;   /* Tablet */
--screen-lg: 1024px;  /* Desktop */
--screen-xl: 1280px;  /* Large desktop */
--screen-2xl: 1536px; /* Extra large */
```

---

## 5. 画面遷移図

### 5.1 Consumer App フロー

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Consumer App - Screen Flow                                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                           ┌─────────────┐                                       │
│                           │   Landing   │                                       │
│                           │   Page      │                                       │
│                           └──────┬──────┘                                       │
│                                  │ Connect Wallet                               │
│                                  ▼                                              │
│                           ┌─────────────┐                                       │
│                           │  Dashboard  │◄─────────────────────────────────┐    │
│                           └──────┬──────┘                                  │    │
│                    ┌─────────────┼─────────────┐                           │    │
│                    │             │             │                           │    │
│                    ▼             ▼             ▼                           │    │
│             ┌───────────┐ ┌───────────┐ ┌───────────┐                     │    │
│             │   Lock    │ │  Unlock   │ │  History  │                     │    │
│             │   Form    │ │  Select   │ │           │                     │    │
│             └─────┬─────┘ └─────┬─────┘ └───────────┘                     │    │
│                   │             │                                          │    │
│                   ▼             ▼                                          │    │
│             ┌───────────┐ ┌───────────┐                                   │    │
│             │  Preview  │ │  Dilithium │                                   │    │
│             │  & Sign   │ │   Sign    │                                   │    │
│             └─────┬─────┘ └─────┬─────┘                                   │    │
│                   │             │                                          │    │
│                   ▼             ▼                                          │    │
│             ┌───────────┐ ┌───────────┐                                   │    │
│             │  Success  │ │  Prover   │                                   │    │
│             │           │─┤  Waiting  │                                   │    │
│             └───────────┘ └─────┬─────┘                                   │    │
│                   │             │                                          │    │
│                   │             ▼                                          │    │
│                   │       ┌───────────┐      ┌───────────┐                │    │
│                   │       │ Time Lock │      │ Emergency │                │    │
│                   │       │ (24h/7d)  │◄────►│   Mode    │                │    │
│                   │       └─────┬─────┘      └───────────┘                │    │
│                   │             │                                          │    │
│                   │             ▼                                          │    │
│                   │       ┌───────────┐                                   │    │
│                   │       │   Claim   │                                   │    │
│                   │       └─────┬─────┘                                   │    │
│                   │             │                                          │    │
│                   └─────────────┴──────────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Token Hub フロー

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Token Hub - Screen Flow                                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                           ┌─────────────┐                                       │
│                           │ Token Hub   │                                       │
│                           │ Dashboard   │                                       │
│                           └──────┬──────┘                                       │
│                    ┌─────────────┼─────────────┐                               │
│                    │             │             │                               │
│                    ▼             ▼             ▼                               │
│             ┌───────────┐ ┌───────────┐ ┌───────────┐                         │
│             │  veQS     │ │ Delegation│ │  Rewards  │                         │
│             │  Lock     │ │   List    │ │ Dashboard │                         │
│             └─────┬─────┘ └─────┬─────┘ └─────┬─────┘                         │
│                   │             │             │                               │
│           ┌───────┼───────┐     │             │                               │
│           │       │       │     ▼             ▼                               │
│           ▼       ▼       ▼   ┌───────┐   ┌───────┐                           │
│        ┌─────┐ ┌─────┐ ┌─────┐│Delegate│  │ Claim │                           │
│        │Lock │ │Extend│ │Unlock│ │Detail│   │Rewards│                          │
│        │Form │ │ Form│ │ Form││       │   │       │                           │
│        └─────┘ └─────┘ └─────┘└───┬───┘   └───────┘                           │
│                                   │                                            │
│                                   ▼                                            │
│                              ┌─────────┐                                       │
│                              │Delegate │                                       │
│                              │  Form   │                                       │
│                              └─────────┘                                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. APIエンドポイント設計

### 6.1 Consumer API

```
GET    /api/v1/locks                    # Lock一覧
POST   /api/v1/locks                    # Lock作成
GET    /api/v1/locks/:id                # Lock詳細
GET    /api/v1/locks/:id/state-root     # State Root取得

POST   /api/v1/unlocks                  # Unlock要求
GET    /api/v1/unlocks/:id              # Unlock詳細
GET    /api/v1/unlocks/:id/prover-status # Prover署名状況
POST   /api/v1/unlocks/:id/claim        # Claim実行

POST   /api/v1/emergency                # Emergency Unlock
GET    /api/v1/emergency/:id/bond       # Bond状況

GET    /api/v1/keys                     # Dilithium鍵一覧
POST   /api/v1/keys                     # 鍵登録
DELETE /api/v1/keys/:id                 # 鍵削除
```

### 6.2 Token Hub API

```
GET    /api/v1/veqs/balance             # veQS残高
POST   /api/v1/veqs/lock                # veQS Lock
POST   /api/v1/veqs/extend              # Lock延長
POST   /api/v1/veqs/unlock              # Unlock

GET    /api/v1/delegates                # Delegate一覧
GET    /api/v1/delegates/:address       # Delegate詳細
POST   /api/v1/delegation               # 委任実行
DELETE /api/v1/delegation/:id           # 委任解除

GET    /api/v1/rewards                  # Rewards一覧
POST   /api/v1/rewards/claim            # Rewards Claim
```

### 6.3 Governance API

```
GET    /api/v1/proposals                # Proposal一覧
GET    /api/v1/proposals/:id            # Proposal詳細
POST   /api/v1/proposals                # Proposal作成
POST   /api/v1/proposals/:id/vote       # 投票
POST   /api/v1/proposals/:id/execute    # 実行

GET    /api/v1/votes/my                 # 自分の投票履歴
```

### 6.4 WebSocket Events

```
ws://api/v1/ws

Events:
- lock:confirmed           # Lock確定
- unlock:prover_signed     # Prover署名完了
- unlock:timelock_end      # TimeLock終了
- unlock:challenged        # Challenge発生
- proposal:status_changed  # Proposal状態変更
- prover:signature_request # 署名要求（Prover向け）
```

---

## 7. テスト計画

### 7.1 テストカバレッジ目標

| レイヤー | 目標 | ツール |
|---------|:----:|--------|
| Unit Tests | 80% | Vitest |
| Integration Tests | 70% | Playwright |
| E2E Tests | 主要フロー100% | Playwright |
| Visual Regression | 主要画面 | Chromatic |

### 7.2 E2Eテストシナリオ

| ID | シナリオ | 優先度 |
|----|---------|:------:|
| E2E-001 | Lock完全フロー | P0 |
| E2E-002 | Unlock (Normal) 完全フロー | P0 |
| E2E-003 | Unlock (Emergency) フロー | P0 |
| E2E-004 | veQS Lock/Unlock | P0 |
| E2E-005 | Delegation フロー | P1 |
| E2E-006 | Governance投票 | P1 |
| E2E-007 | Prover署名承認 | P1 |
| E2E-008 | Challenge提起 | P2 |

---

## 8. デプロイ戦略

### 8.1 環境構成

| 環境 | URL | 用途 |
|------|-----|------|
| Development | dev.quantumshield.io | 開発テスト |
| Staging | staging.quantumshield.io | QA・UAT |
| Production | app.quantumshield.io | 本番 |

### 8.2 デプロイフロー

```
feature/* → develop → staging → main
     │          │          │        │
     │          │          │        └── Production Deploy
     │          │          └── Staging Deploy (自動)
     │          └── Development Deploy (自動)
     └── PR Preview (Vercel)
```

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-05 | 初版作成 |

---

**END OF DOCUMENT**
