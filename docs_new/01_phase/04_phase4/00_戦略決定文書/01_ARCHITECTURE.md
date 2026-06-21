# 01 システムアーキテクチャ

> **対応Agent**: 01_plan.md, 02_spec.md

---

# Part 1: システム構成図

## 1.1 全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Quantum Shield Platform                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                     0. サービス全体サイト                                │   │
│  │                        quantum-shield.io                                 │   │
│  │    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐               │   │
│  │    │   メインLP    │ │  技術解説     │ │ホワイトペーパー│               │   │
│  │    └───────────────┘ └───────────────┘ └───────────────┘               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        Edition Selector                                  │   │
│  │    ┌──────────────────┐           ┌──────────────────┐                  │   │
│  │    │   Decentralized  │ ◄───────► │    Enterprise    │                  │   │
│  │    │     Edition      │           │     Edition      │                  │   │
│  │    └────────┬─────────┘           └────────┬─────────┘                  │   │
│  └─────────────┼─────────────────────────────┼─────────────────────────────┘   │
│                │                             │                                   │
│  ┌─────────────┼─────────────────────────────┼─────────────────────────────┐   │
│  │             ▼                             ▼                              │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │   │
│  │  │                     8 Application Systems                         │   │   │
│  │  ├──────────────────────────────────────────────────────────────────┤   │   │
│  │  │                                                                   │   │   │
│  │  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐           │   │   │
│  │  │  │ 1.Consumer App│ │ 2.Token Hub   │ │ 3.Governance  │           │   │   │
│  │  │  │   (End User)  │ │ (QS/veQS)     │ │   (Voting)    │           │   │   │
│  │  │  │   25画面      │ │   22画面      │ │   20画面      │           │   │   │
│  │  │  └───────────────┘ └───────────────┘ └───────────────┘           │   │   │
│  │  │                                                                   │   │   │
│  │  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐           │   │   │
│  │  │  │ 4.Prover      │ │ 5.Observer/   │ │ 6.Explorer    │           │   │   │
│  │  │  │   Portal      │ │   Challenger  │ │   (Public)    │           │   │   │
│  │  │  │   32画面      │ │   16画面      │ │   14画面      │           │   │   │
│  │  │  └───────────────┘ └───────────────┘ └───────────────┘           │   │   │
│  │  │                                                                   │   │   │
│  │  │  ┌───────────────┐ ┌───────────────┐                              │   │   │
│  │  │  │7.Enterprise   │ │8.QS Admin     │                              │   │   │
│  │  │  │  Admin Portal │ │ (Foundation)  │                              │   │   │
│  │  │  │   47画面      │ │   62画面      │                              │   │   │
│  │  │  └───────────────┘ └───────────────┘                              │   │   │
│  │  │                                                                   │   │   │
│  │  └──────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                          │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │   │
│  │  │                     Shared Core Components                        │   │   │
│  │  │  L1 Vault │ L3 Aegis │ STARK Prover │ HSM │ Event Bridge         │   │   │
│  │  └──────────────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 1.2 システム一覧 × Edition対応

| # | システム | Decentralized | Enterprise | 画面数 | 優先度 |
|---|---------|:-------------:|:----------:|:------:|:------:|
| 0 | サービス全体サイト | ✅ | ✅ | 15 | P1 |
| 1 | Consumer App | ✅ | ✅ | 25 | P0 |
| 2 | Token Hub | ✅ | ❌ | 22 | P0 |
| 3 | Governance | ✅ | オプション | 20 | P1 |
| 4 | Prover Portal | ✅ | ✅ | 32 | P0 |
| 5 | Observer/Challenger | ✅ | オプション | 16 | P1 |
| 6 | Explorer | ✅ | ✅ | 14 | P1 |
| 7 | Enterprise Admin | ❌ | ✅ | 47 | P1 |
| 8 | QS Admin | ✅ (縮小) | ✅ | 62 | P0 |
| | **合計** | | | **253** | |

---

# Part 2: プレイヤー × システム マトリックス

## 2.1 アクセス権限マトリックス

| プレイヤー | Consumer | Token Hub | Governance | Prover | Observer | Explorer | Enterprise | QS Admin |
|-----------|:--------:|:---------:|:----------:|:------:|:--------:|:--------:|:----------:|:--------:|
| End User | ✅ | ✅ | ✅ (投票) | - | - | ✅ | - | - |
| Token Holder | ✅ | ✅ | ✅ (投票) | - | - | ✅ | - | - |
| Prover | - | ✅ | ✅ (投票) | ✅ | - | ✅ | - | - |
| Observer | - | ✅ | ✅ (投票) | - | ✅ | ✅ | - | - |
| Challenger | - | ✅ | ✅ (投票) | - | ✅ | ✅ | - | - |
| Delegate | - | ✅ | ✅ (委任受) | - | - | ✅ | - | - |
| Proposer | - | ✅ | ✅ (提案) | - | - | ✅ | - | - |
| Security Council | - | - | ✅ (特権) | - | - | ✅ | - | ✅ |
| Purpose Committee | - | - | ✅ (理念) | - | - | ✅ | - | ✅ |
| Service Provider | - | - | - | - | - | ✅ | ✅ | - |
| QS Staff | - | - | - | - | - | ✅ | - | ✅ |

## 2.2 プレイヤー登録・退会マトリックス

| # | プレイヤー | 登録 | 退会 | 認証方式 | 備考 |
|---|-----------|:----:|:----:|----------|------|
| 1 | End User | ✅ | ✅ | Wallet (SIWE) | Dilithium鍵登録 |
| 2 | Token Holder | - | - | Wallet | End Userが自動的になる |
| 3 | Prover | ✅ | ✅ | Wallet + HSM証明 | 審査あり |
| 4 | Observer | ✅ | ✅ | Wallet + Stake | Permissionless |
| 5 | Challenger | - | - | Wallet | Observerが行動するとなる |
| 6 | Delegate | ✅ | ✅ | Wallet | Permissionless登録 |
| 7 | Proposer | - | - | Wallet + veQS閾値 | veQS保有で自動資格 |
| 8 | Security Council | ✅ | ✅ | Wallet + 選出/任命 | Token Vote or 財団任命 |
| 9 | Purpose Committee | ✅ | ✅ | Wallet + 選出/任命 | Token Vote or 財団任命 |
| 10 | Service Provider | ✅ | ✅ | Email + Password + 2FA | 契約ベース |
| 11 | QS Staff | ✅ | ✅ | Email + Password + 2FA | 財団メンバー |

---

# Part 3: サービス全体サイト構成

## 3.1 サイト構造

Consumer AppのLPとは別に、**Quantum Shield全体を説明するコーポレートサイト**。

```
quantum-shield.io/                          # メインドメイン
├── index.html                              # メインLP
├── about/                                  # プロジェクト詳細
│   ├── mission.html                        # ミッション・ビジョン
│   ├── team.html                           # チーム紹介
│   └── partners.html                       # パートナー
├── technology/                             # 技術詳細
│   ├── quantum-resistance.html             # 量子耐性の説明
│   ├── architecture.html                   # システムアーキテクチャ
│   ├── security.html                       # セキュリティモデル
│   └── roadmap.html                        # ロードマップ
├── whitepaper/                             # ホワイトペーパー
│   └── index.html                          # ホワイトペーパー閲覧・DL
├── docs/                                   # ドキュメント
│   ├── developers/                         # 開発者向け
│   ├── users/                              # ユーザー向け
│   └── governance/                         # ガバナンス解説
├── blog/                                   # ブログ・ニュース
├── careers/                                # 採用情報
└── contact/                                # お問い合わせ
```

## 3.2 メインLP画面構成（12画面）

| # | 画面名 | 目的 | 優先度 |
|---|--------|------|:------:|
| 1 | Main Landing | ヒーローセクション、価値提案 | P0 |
| 2 | Problem Section | 量子脅威の解説 | P0 |
| 3 | Solution Section | QSの解決策 | P0 |
| 4 | How It Works | 仕組み概要 | P0 |
| 5 | Features | 主要機能紹介 | P0 |
| 6 | Technology | 技術概要 | P0 |
| 7 | Use Cases | ユースケース | P1 |
| 8 | Editions | Decentralized vs Enterprise | P0 |
| 9 | Roadmap | ロードマップ | P1 |
| 10 | Team | チーム紹介 | P1 |
| 11 | Partners | パートナー | P2 |
| 12 | Footer CTA | アクションへの誘導 | P0 |

## 3.3 ホワイトペーパー構成

```
┌─────────────────────────────────────────────────────────────┐
│              Quantum Shield ホワイトペーパー                 │
│                      Version 1.0                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Executive Summary                                        │
│     - 量子コンピュータの脅威                                 │
│     - Quantum Shieldの解決策                                 │
│     - 主要な差別化ポイント                                   │
│                                                             │
│  2. Problem Statement                                        │
│     - 現在のブリッジの課題                                   │
│     - 量子脅威のタイムライン                                 │
│     - 「Store Now, Decrypt Later」攻撃                       │
│                                                             │
│  3. Technical Architecture                                   │
│     - 3層アーキテクチャ（L1/L3/Prover Network）              │
│     - NIST準拠の量子耐性アルゴリズム                         │
│       - Dilithium-III（ユーザー署名）                        │
│       - SPHINCS+（Prover署名）                               │
│     - ZK-STARK証明システム                                   │
│     - Sparse Merkle Tree状態管理                             │
│                                                             │
│  4. Security Model                                           │
│     - 5つの憲法原則（Core Principles）                       │
│       - CP-1: 量子耐性                                       │
│       - CP-2: セルフカストディ                               │
│       - CP-3: Time Lock                                      │
│       - CP-4: Slashing                                       │
│       - CP-5: 透明性                                         │
│     - 攻撃ベクトル分析                                       │
│     - 形式検証（Lean4）                                      │
│                                                             │
│  5. Economic Model                                           │
│     - QSトークン概要                                         │
│     - veQSロック・投票メカニズム                             │
│     - Prover経済（Stake・報酬・Slashing）                    │
│     - Observer報酬                                           │
│     - 手数料構造                                             │
│                                                             │
│  6. Governance                                               │
│     - 分散化ロードマップ                                     │
│     - 投票メカニズム                                         │
│     - Security Council                                       │
│     - Purpose Committee                                      │
│                                                             │
│  7. Roadmap                                                  │
│     - Phase 1-2: Foundation                                  │
│     - Phase 3: Partial Decentralization                      │
│     - Phase 4+: Full Decentralization                        │
│                                                             │
│  8. Team & Advisors                                          │
│                                                             │
│  9. Conclusion                                               │
│                                                             │
│  Appendix                                                    │
│     A. アルゴリズム詳細仕様                                  │
│     B. スマートコントラクト一覧                              │
│     C. 監査レポート概要                                      │
│     D. 用語集                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# Part 4: 技術スタック

## 4.1 フロントエンド

```
quantum-shield-ui/                 # monorepo (Turborepo)
├── apps/
│   ├── website/                   # サービス全体サイト (Next.js 14)
│   ├── consumer/                  # Consumer App (Next.js 14)
│   ├── token-hub/                 # Token Hub (Next.js 14)
│   ├── governance/                # Governance (Next.js 14)
│   ├── prover/                    # Prover Portal (Next.js 14)
│   ├── observer/                  # Observer/Challenger (Next.js 14)
│   ├── explorer/                  # Explorer (Next.js 14)
│   ├── enterprise/                # Enterprise Admin (Next.js 14)
│   └── admin/                     # QS Admin (既存を移行)
│
├── packages/
│   ├── ui/                        # 共通UIコンポーネント (shadcn/ui)
│   ├── crypto/                    # Dilithium WASM等
│   ├── web3/                      # wagmi/viem wrapper
│   ├── api-client/                # API Client
│   └── config/                    # 共通設定
│
└── tooling/
    ├── eslint-config/
    ├── typescript-config/
    └── tailwind-config/
```

## 4.2 主要ライブラリ

| カテゴリ | ライブラリ | バージョン | 用途 |
|---------|-----------|-----------|------|
| Framework | Next.js | 14.x | SSR/SSG対応 |
| Styling | Tailwind CSS | 3.x | ユーティリティファースト |
| UI | shadcn/ui | latest | コンポーネントライブラリ |
| Web3 | wagmi | 2.x | Reactフック |
| Web3 | viem | 2.x | Ethereumクライアント |
| 認証 | NextAuth.js | 5.x | SIWE対応 |
| 状態管理 | Zustand | 4.x | 軽量状態管理 |
| フォーム | React Hook Form | 7.x | フォーム管理 |
| バリデーション | Zod | 3.x | スキーマバリデーション |
| グラフ | Recharts | 2.x | チャート表示 |

---

**END OF ARCHITECTURE**
