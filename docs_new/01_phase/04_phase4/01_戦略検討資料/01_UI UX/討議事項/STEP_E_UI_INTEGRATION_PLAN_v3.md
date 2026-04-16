# 📐 Phase 4 UI 統合計画 v3.0
## 完全版：全体LP・ホワイトペーパー・ペルソナ・ログイン設計・統合ギャップ分析

> **Version**: 3.0  
> **Date**: 2026-01-05  
> **更新内容**: サービス全体LP追加、ホワイトペーパー追加、全プレイヤーペルソナ追記、ログイン設計追加、バックエンド統合ギャップ分析追加

---

# Part 1: サービス全体サイト（新規追加）

## 1.1 サービス全体LP構成

Consumer AppのLPとは別に、**Quantum Shield全体を説明するコーポレートサイト**が必要。

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

## 1.2 メインLP画面構成（12画面）

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

## 1.3 ホワイトペーパー

### 構成案

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

### ホワイトペーパー画面（3画面）

| # | 画面名 | 目的 | 優先度 |
|---|--------|------|:------:|
| 1 | Whitepaper Landing | 概要・目次表示 | P1 |
| 2 | Whitepaper Reader | 本文閲覧（PDF.js or HTML） | P1 |
| 3 | Download | PDF/Markdown ダウンロード | P1 |

---

# Part 2: 全プレイヤー ペルソナ定義（完全版）

## 2.1 プレイヤー一覧

| # | プレイヤー | ペルソナ | 年齢 | 背景 |
|---|-----------|---------|:----:|------|
| 1 | End User | 田中さん | 32 | 暗号資産投資家 |
| 2 | Token Holder (veQS) | 鈴木さん | 28 | DeFiユーザー |
| 3 | Delegate | 渡辺さん | 42 | DAOコミュニティリーダー |
| 4 | Proposer | 高橋さん | 35 | プロトコル改善提案者 |
| 5 | Prover | 山田さん | 45 | インフラ企業CEO |
| 6 | Observer | 中村さん | 40 | セキュリティリサーチャー |
| 7 | Challenger | 中村さん | 40 | （Observerと同一人物） |
| 8 | Security Council | 伊藤さん | 50 | セキュリティ専門家 |
| 9 | Purpose Committee | 木村さん | 55 | 暗号学者・理念提唱者 |
| 10 | Service Provider | 佐藤さん | 38 | 取引所CTO |
| 11 | QS Staff (新人) | 加藤さん | 26 | 新卒エンジニア |
| 12 | QS Staff (上級) | 松本さん | 35 | シニアエンジニア |

---

## 2.2 各ペルソナ詳細

### 【1】End User：田中さん（32歳）

```
┌─────────────────────────────────────────────────────────────┐
│                        田中さん                              │
├─────────────────────────────────────────────────────────────┤
│  背景:                                                      │
│  • 5年前から暗号資産に投資                                  │
│  • ETHを複数チェーンで運用（Ethereum, Arbitrum, Base）      │
│  • 2022年のブリッジハック事件で友人が被害に                 │
│  • 「量子コンピュータが暗号を破る」というニュースを見た     │
│                                                             │
│  不安:                                                      │
│  • 「今使ってるウォレット、本当に安全なの？」               │
│  • 「ブリッジを使うのが怖い」                               │
│  • 「10年後、今の暗号が破られたらどうしよう」               │
│                                                             │
│  求めていること:                                            │
│  • 長期的に安全な資産保管                                   │
│  • わかりやすい操作（技術に詳しくない）                     │
│  • いざという時に自分で資産を動かせる安心感                 │
│                                                             │
│  技術レベル: ★★☆☆☆（中程度）                              │
│  利用デバイス: スマホ60%、PC40%                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 【2】Token Holder (veQS)：鈴木さん（28歳）

```
┌─────────────────────────────────────────────────────────────┐
│                        鈴木さん                              │
├─────────────────────────────────────────────────────────────┤
│  背景:                                                      │
│  • QSを利用中のEnd User                                     │
│  • 他のDAOにも参加経験あり（Curve, Lido）                   │
│  • veTokenエコノミクスに詳しい                              │
│                                                             │
│  関心:                                                      │
│  • 投票に参加して報酬を得たい                               │
│  • 信頼できるDelegateに委任したい                           │
│  • 早期参加者としてのメリットを享受したい                   │
│                                                             │
│  懸念:                                                      │
│  • 「ロック期間中に価格が下がったら？」                     │
│  • 「早期解除のペナルティはどのくらい？」                   │
│                                                             │
│  技術レベル: ★★★★☆（高め）                                │
│  利用デバイス: スマホ50%、PC50%                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 【3】Delegate：渡辺さん（42歳）

```
┌─────────────────────────────────────────────────────────────┐
│                        渡辺さん                              │
├─────────────────────────────────────────────────────────────┤
│  背景:                                                      │
│  • 複数のDAOでDelegateとして活動                            │
│  • Twitter/Xでフォロワー5万人                               │
│  • ガバナンス分析のニュースレター発行                       │
│                                                             │
│  関心:                                                      │
│  • QSガバナンスへの影響力                                   │
│  • Delegate報酬                                             │
│  • コミュニティからの信頼構築                               │
│                                                             │
│  責任感:                                                    │
│  • 「委任されたveQSを正しく使う責任」                       │
│  • 「重要な投票を見逃さない」                               │
│                                                             │
│  技術レベル: ★★★★☆（高め）                                │
│  利用デバイス: PC80%、スマホ20%                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 【4】Proposer：高橋さん（35歳）

```
┌─────────────────────────────────────────────────────────────┐
│                        高橋さん                              │
├─────────────────────────────────────────────────────────────┤
│  背景:                                                      │
│  • QS大口veQSホルダー                                       │
│  • ブロックチェーンエンジニア経験5年                        │
│  • 他のDAOでも提案・実装経験                                │
│                                                             │
│  関心:                                                      │
│  • Time Lock期間の最適化提案                                │
│  • 手数料モデルの改善提案                                   │
│  • 技術的な改善提案                                         │
│                                                             │
│  懸念:                                                      │
│  • 「提案に必要なveQS量は？」                               │
│  • 「否決されたらどうなる？」                               │
│                                                             │
│  技術レベル: ★★★★★（エキスパート）                        │
│  利用デバイス: PC90%、スマホ10%                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 【5】Prover：山田さん（45歳）

```
┌─────────────────────────────────────────────────────────────┐
│                        山田さん                              │
├─────────────────────────────────────────────────────────────┤
│  背景:                                                      │
│  • バリデーター事業を5年運営（PoS系複数チェーン）           │
│  • HSMの運用経験あり                                        │
│  • 技術チーム10名                                           │
│  • 新しい収益源を探している                                 │
│                                                             │
│  関心:                                                      │
│  • 「量子耐性ブリッジの検証者、収益性はどうか」             │
│  • 「技術要件は満たせるか」                                 │
│  • 「リスク（Slashing）はどの程度か」                       │
│                                                             │
│  懸念:                                                      │
│  • 「$400K のStakeは大きい」                                │
│  • 「Quadratic Slashing、共謀リスクは？」                   │
│  • 「運用体制24/7、維持できるか」                           │
│                                                             │
│  技術レベル: ★★★★★（エキスパート）                        │
│  利用デバイス: PC95%、スマホ5%（アラート確認のみ）          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 【6】Observer / 【7】Challenger：中村さん（40歳）

```
┌─────────────────────────────────────────────────────────────┐
│                        中村さん                              │
├─────────────────────────────────────────────────────────────┤
│  背景:                                                      │
│  • ブロックチェーンセキュリティの専門家                     │
│  • バグバウンティ経験あり（$100K+獲得）                     │
│  • 複数のプロトコルでObserver活動中                         │
│                                                             │
│  関心:                                                      │
│  • 異常なUnlockを検知してChallenge                         │
│  • Challenge成功時の報酬（Prover Stakeの一部）              │
│  • 必要Stake額と報酬の見合い                                │
│                                                             │
│  スタイル:                                                  │
│  • 複数のモニタリングツールを同時運用                       │
│  • 自動検知スクリプトを作成                                 │
│  • 疑わしい取引を見つけたら即座にChallenge                  │
│                                                             │
│  技術レベル: ★★★★★（エキスパート）                        │
│  利用デバイス: PC99%、サーバー（自動監視）                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 【8】Security Council：伊藤さん（50歳）

```
┌─────────────────────────────────────────────────────────────┐
│                        伊藤さん                              │
├─────────────────────────────────────────────────────────────┤
│  背景:                                                      │
│  • 元大手銀行のCISO（20年のセキュリティ経験）               │
│  • 複数のDeFiプロトコルでSecurity Council経験               │
│  • 量子暗号に関する論文執筆                                 │
│                                                             │
│  責任:                                                      │
│  • 緊急時のPause権限行使判断                                │
│  • 重大なガバナンス提案へのVeto検討                         │
│  • セキュリティインシデント対応                             │
│                                                             │
│  スタンス:                                                  │
│  • 「セキュリティ最優先、しかし過度な権限集中は避ける」     │
│  • 「透明性を持って判断理由を公開」                         │
│                                                             │
│  技術レベル: ★★★★★（エキスパート）                        │
│  利用デバイス: PC100%                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 【9】Purpose Committee：木村さん（55歳）

```
┌─────────────────────────────────────────────────────────────┐
│                        木村さん                              │
├─────────────────────────────────────────────────────────────┤
│  背景:                                                      │
│  • 暗号学の教授（大学）                                     │
│  • Bitcoinホワイトペーパー発表当時からの研究者              │
│  • 「なぜ分散化が重要か」の著者                             │
│                                                             │
│  責任:                                                      │
│  • Core Principles（5原則）の解釈                           │
│  • プロトコルの方向性が理念から逸脱していないか監視         │
│  • コミュニティへの教育・啓蒙                               │
│                                                             │
│  スタンス:                                                  │
│  • 「量子耐性は妥協できない」                               │
│  • 「Self-Custodyは基本的人権」                             │
│  • 「透明性なくして信頼なし」                               │
│                                                             │
│  技術レベル: ★★★★☆（理論に強い）                          │
│  利用デバイス: PC90%、スマホ10%                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 【10】Service Provider：佐藤さん（38歳）

```
┌─────────────────────────────────────────────────────────────┐
│                        佐藤さん                              │
├─────────────────────────────────────────────────────────────┤
│  背景:                                                      │
│  • 中規模暗号資産取引所のCTO                                │
│  • 複数チェーン対応を検討中                                 │
│  • 過去にブリッジ関連のセキュリティインシデント経験         │
│  • 規制当局から「将来のセキュリティ対策」への問い合わせ     │
│                                                             │
│  ニーズ:                                                    │
│  • 安全なクロスチェーンブリッジ                             │
│  • 規制対応の証跡                                           │
│  • SLAと専用サポート                                        │
│  • 自社ブランドでの提供（ホワイトラベル）                   │
│                                                             │
│  懸念:                                                      │
│  • 「コストはどのくらい？」                                 │
│  • 「導入にどのくらいかかる？」                             │
│  • 「問題発生時のサポート体制は？」                         │
│                                                             │
│  技術レベル: ★★★★☆（高め）                                │
│  利用デバイス: PC80%、スマホ20%                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 【11】QS Staff（新人）：加藤さん（26歳）

```
┌─────────────────────────────────────────────────────────────┐
│                        加藤さん                              │
├─────────────────────────────────────────────────────────────┤
│  背景:                                                      │
│  • QS財団に新卒入社                                         │
│  • ブロックチェーン基礎知識あり（大学で履修）               │
│  • QSの仕組みをこれから学ぶ                                 │
│                                                             │
│  ニーズ:                                                    │
│  • QSの全体像を理解したい                                   │
│  • 自分の担当領域を把握したい                               │
│  • 緊急時の対応手順を知りたい                               │
│  • 先輩に聞かなくても分かるドキュメント                     │
│                                                             │
│  不安:                                                      │
│  • 「間違った操作をしたらどうしよう」                       │
│  • 「誰に聞けばいいの？」                                   │
│                                                             │
│  技術レベル: ★★★☆☆（成長中）                              │
│  利用デバイス: PC100%                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 【12】QS Staff（上級）：松本さん（35歳）

```
┌─────────────────────────────────────────────────────────────┐
│                        松本さん                              │
├─────────────────────────────────────────────────────────────┤
│  背景:                                                      │
│  • QS財団創業メンバー                                       │
│  • 10年のブロックチェーン開発経験                           │
│  • 緊急対応の権限保持者                                     │
│                                                             │
│  責任:                                                      │
│  • 新人教育                                                 │
│  • 緊急時のPause判断                                        │
│  • Prover審査                                               │
│  • システム全体の健全性監視                                 │
│                                                             │
│  スタンス:                                                  │
│  • 「徐々に権限を分散化していく」                           │
│  • 「手順を文書化して誰でもできるように」                   │
│                                                             │
│  技術レベル: ★★★★★（エキスパート）                        │
│  利用デバイス: PC90%、スマホ10%（アラート）                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# Part 3: ログイン設計（セキュリティ重視）

## 3.1 認証方式マトリックス

| プレイヤー | 認証方式 | 2FA | 生体認証 | セッション |
|-----------|---------|:---:|:--------:|-----------|
| End User | Wallet (SIWE) | - | オプション | 永続（再署名まで） |
| Token Holder | Wallet (SIWE) | - | オプション | 永続 |
| Delegate | Wallet (SIWE) | - | オプション | 永続 |
| Proposer | Wallet (SIWE) | - | オプション | 永続 |
| Prover | Wallet + HSM | ✅ 必須 | オプション | 24時間 |
| Observer | Wallet (SIWE) | オプション | - | 永続 |
| Security Council | Wallet + 2FA | ✅ 必須 | ✅ 推奨 | 1時間（操作毎） |
| Purpose Committee | Wallet + 2FA | ✅ 必須 | ✅ 推奨 | 1時間 |
| Service Provider | Email + Password | ✅ 必須 | ✅ 推奨 | 8時間 |
| QS Staff | Email + Password | ✅ 必須 | ✅ 必須 | 4時間 |

## 3.2 Wallet認証（SIWE）フロー

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SIWE (Sign-In with Ethereum) フロー                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐               │
│  │  User   │────►│ Connect │────►│  Sign   │────►│ Verify  │               │
│  │ Action  │     │ Wallet  │     │ Message │     │  Server │               │
│  └─────────┘     └─────────┘     └─────────┘     └─────────┘               │
│                                       │                │                    │
│                                       ▼                ▼                    │
│                              ┌───────────────┐  ┌────────────┐              │
│                              │ SIWE Message  │  │   JWT/     │              │
│                              │ (EIP-4361)    │  │  Session   │              │
│                              │               │  │  Token     │              │
│                              │ domain:       │  └────────────┘              │
│                              │ address:      │                              │
│                              │ statement:    │                              │
│                              │ uri:          │                              │
│                              │ nonce:        │                              │
│                              │ issued-at:    │                              │
│                              │ expiration:   │                              │
│                              └───────────────┘                              │
│                                                                             │
│  セキュリティポイント:                                                       │
│  • Nonce: リプレイ攻撃防止（サーバー生成、1回限り使用）                      │
│  • Domain: フィッシング防止                                                  │
│  • Expiration: セッション有効期限                                            │
│  • 署名検証: ecrecover でアドレス復元・照合                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3.3 Email + Password認証フロー（Enterprise/QS Admin）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Email + Password + 2FA フロー                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐               │
│  │  Email  │────►│Password │────►│   2FA   │────►│ Session │               │
│  │  Input  │     │  Input  │     │  Verify │     │ Created │               │
│  └─────────┘     └─────────┘     └─────────┘     └─────────┘               │
│                       │               │                                     │
│                       ▼               ▼                                     │
│              ┌───────────────┐  ┌────────────────────┐                      │
│              │   Password    │  │    2FA Methods     │                      │
│              │   Requirements│  │                    │                      │
│              │               │  │  • TOTP (推奨)     │                      │
│              │  • 12文字以上 │  │    - Google Auth   │                      │
│              │  • 大小英字   │  │    - Authy         │                      │
│              │  • 数字       │  │    - 1Password     │                      │
│              │  • 記号       │  │                    │                      │
│              │  • 過去5回と  │  │  • WebAuthn (推奨) │                      │
│              │    異なる     │  │    - YubiKey       │                      │
│              │               │  │    - TouchID       │                      │
│              │  Argon2id     │  │    - FaceID        │                      │
│              │  ハッシュ化   │  │                    │                      │
│              └───────────────┘  │  • SMS (非推奨)    │                      │
│                                 │    - SIMスワップ   │                      │
│                                 │      リスク        │                      │
│                                 └────────────────────┘                      │
│                                                                             │
│  追加セキュリティ:                                                           │
│  • ログイン試行回数制限（5回失敗でロック15分）                               │
│  • 新規デバイスからのログイン時はEmail確認                                   │
│  • IPアドレス変更検知                                                        │
│  • セッション一覧表示（不審なセッションを強制終了可能）                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3.4 生体認証（WebAuthn）フロー

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WebAuthn / Passkey フロー                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Registration (初回設定):                                                    │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐               │
│  │ Request │────►│Challenge│────►│ Biometric│────►│ Store   │               │
│  │ Register│     │ Generate│     │ Auth     │     │ PublicKey│              │
│  └─────────┘     └─────────┘     └─────────┘     └─────────┘               │
│                                       │                                     │
│                              ┌────────┴────────┐                            │
│                              │                 │                            │
│                              ▼                 ▼                            │
│                         ┌────────┐       ┌────────┐                         │
│                         │TouchID │       │ FaceID │                         │
│                         │Windows │       │YubiKey │                         │
│                         │Hello   │       │        │                         │
│                         └────────┘       └────────┘                         │
│                                                                             │
│  Authentication (ログイン):                                                  │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐               │
│  │  Login  │────►│Challenge│────►│ Biometric│────►│ Verify  │               │
│  │ Request │     │ Generate│     │ Auth     │     │Signature│               │
│  └─────────┘     └─────────┘     └─────────┘     └─────────┘               │
│                                                                             │
│  メリット:                                                                   │
│  • フィッシング耐性（origin-boundedのため）                                  │
│  • パスワードレス（覚える必要なし）                                          │
│  • 高速（指紋 or 顔認証で1秒）                                               │
│  • クロスデバイス対応（QRコード経由）                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3.5 ログイン関連画面

### Wallet認証システム（Consumer, Token Hub, Governance等）

| # | 画面名 | 目的 | 優先度 |
|---|--------|------|:------:|
| 1 | Connect Wallet Modal | ウォレット選択 | P0 |
| 2 | Sign Message | SIWE署名リクエスト | P0 |
| 3 | Session Active | ログイン中状態表示 | P0 |
| 4 | Disconnect | ログアウト | P0 |

### Email + Password認証システム（Enterprise, QS Admin）

| # | 画面名 | 目的 | 優先度 |
|---|--------|------|:------:|
| 1 | Login | ログイン画面 | P0 |
| 2 | 2FA Input | 2FAコード入力 | P0 |
| 3 | WebAuthn Prompt | 生体認証プロンプト | P0 |
| 4 | Forgot Password | パスワードリセット | P0 |
| 5 | Reset Password | 新パスワード設定 | P0 |
| 6 | Email Verification | メール確認 | P0 |
| 7 | New Device Alert | 新規デバイス確認 | P0 |
| 8 | Session Management | セッション一覧・管理 | P1 |
| 9 | Security Settings | セキュリティ設定 | P0 |
| 10 | 2FA Setup | 2FA初期設定 | P0 |
| 11 | WebAuthn Setup | 生体認証設定 | P1 |
| 12 | Logout | ログアウト | P0 |

---

# Part 4: バックエンド統合ギャップ分析

## 4.1 既存API状況

### 現在実装済み（services/api/src/routes/）

| Route | Method | Path | 実装 |
|-------|--------|------|:----:|
| health | GET | /health | ✅ |
| lock | POST | /lock | ✅ |
| unlock | POST | /unlock | ✅ |
| unlock | POST | /unlock/emergency | ✅ |
| status | GET | /status/:lock_id | ✅ |
| status | GET | /status/pending | ✅ |
| prover | POST | /prover/register | ✅ |
| prover | GET | /prover/:prover_id | ✅ |
| edition | GET | /edition | ✅ |
| edition | POST | /edition/switch | ✅ |

### Admin Dashboard API（/api/*）

| Route | Method | Path | 実装 |
|-------|--------|------|:----:|
| admin | GET | /provers | ✅ |
| admin | POST | /provers/register | ✅ |
| admin | POST | /provers/:id/approve | ✅ |
| admin | POST | /provers/:id/reject | ✅ |
| admin | POST | /provers/:id/suspend | ✅ |
| admin | GET | /providers | ✅ |
| admin | POST | /providers/register | ✅ |
| admin | GET | /system/status | ✅ |
| admin | POST | /system/pause | ✅ |
| admin | POST | /system/unpause | ✅ |
| admin | GET | /analytics/overview | ✅ |
| admin | GET | /edition/current | ✅ |
| admin | POST | /edition/switch | ✅ |

## 4.2 不足しているAPI（優先度順）

### P0: 必須（Phase 4で実装必要）

| カテゴリ | Route | Method | Path | 用途 |
|---------|-------|--------|------|------|
| **認証** | auth | POST | /auth/siwe/nonce | SIWE Nonce取得 |
| | auth | POST | /auth/siwe/verify | SIWE署名検証 |
| | auth | POST | /auth/login | Email+Password認証 |
| | auth | POST | /auth/2fa/verify | 2FA検証 |
| | auth | POST | /auth/logout | ログアウト |
| | auth | POST | /auth/password/reset | パスワードリセット |
| **ユーザー** | user | POST | /users/register | ユーザー登録 |
| | user | GET | /users/:address | ユーザー情報取得 |
| | user | PUT | /users/:address | ユーザー情報更新 |
| | user | DELETE | /users/:address | ユーザー退会 |
| | user | GET | /users/:address/locks | ユーザーのLock一覧 |
| | user | GET | /users/:address/history | 取引履歴 |
| **Token Hub** | veqs | POST | /veqs/lock | veQSロック |
| | veqs | GET | /veqs/:address | veQS情報取得 |
| | veqs | POST | /veqs/unlock | veQSアンロック |
| | veqs | POST | /veqs/extend | ロック期間延長 |
| | delegation | POST | /delegations | 委任実行 |
| | delegation | GET | /delegations/:address | 委任情報取得 |
| | delegation | DELETE | /delegations/:id | 委任解除 |
| | delegate | GET | /delegates | Delegate一覧 |
| | delegate | POST | /delegates/register | Delegate登録 |
| | delegate | GET | /delegates/:address | Delegate詳細 |
| **Prover** | prover | POST | /provers/apply | Prover申請 |
| | prover | GET | /provers/:id/status | 申請状況 |
| | prover | GET | /provers/:id/signatures | 署名キュー |
| | prover | GET | /provers/:id/rewards | 報酬情報 |
| | prover | POST | /provers/:id/stake/add | Stake追加 |
| | prover | POST | /provers/:id/exit | 退出申請 |
| **Explorer** | explorer | GET | /explorer/stats | 全体統計 |
| | explorer | GET | /explorer/locks | Lock一覧 |
| | explorer | GET | /explorer/unlocks | Unlock一覧 |
| | explorer | GET | /explorer/search | 検索 |
| **Notification** | notif | GET | /notifications/:address | 通知一覧 |
| | notif | PUT | /notifications/:id/read | 既読 |
| | notif | POST | /notifications/settings | 設定 |

### P1: 重要（Phase 4後半〜Phase 5）

| カテゴリ | Route | Method | Path | 用途 |
|---------|-------|--------|------|------|
| **Governance** | gov | GET | /governance/proposals | 提案一覧 |
| | gov | GET | /governance/proposals/:id | 提案詳細 |
| | gov | POST | /governance/proposals | 提案作成 |
| | gov | POST | /governance/vote | 投票 |
| | gov | GET | /governance/votes/:address | 投票履歴 |
| **Observer** | observer | POST | /observers/register | Observer登録 |
| | observer | GET | /observers/:address | Observer情報 |
| | challenge | POST | /challenges | Challenge提起 |
| | challenge | GET | /challenges/:id | Challenge詳細 |
| **Enterprise** | enterprise | POST | /enterprise/contact | 問い合わせ |
| | enterprise | GET | /enterprise/customers | 顧客一覧 |
| | enterprise | GET | /enterprise/customers/:id | 顧客詳細 |
| | enterprise | POST | /enterprise/api-keys | APIキー発行 |
| | enterprise | GET | /enterprise/usage | 使用量 |
| **Staff** | staff | GET | /admin/staff | スタッフ一覧 |
| | staff | POST | /admin/staff | スタッフ追加 |
| | staff | PUT | /admin/staff/:id | スタッフ更新 |
| | staff | DELETE | /admin/staff/:id | スタッフ削除 |
| | audit | GET | /admin/audit-logs | 監査ログ |

## 4.3 データベーススキーマ追加（必要）

### 現在のDB状況

現状、明確なDBスキーマ定義ファイルが見つからないため、以下を新規作成する必要がある。

### 必要なテーブル

```sql
-- ユーザー管理
CREATE TABLE users (
  id UUID PRIMARY KEY,
  address VARCHAR(42) NOT NULL UNIQUE,
  dilithium_public_key TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- セッション管理
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token_hash VARCHAR(64) NOT NULL,
  device_info JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  last_activity TIMESTAMP
);

-- veQSロック
CREATE TABLE veqs_locks (
  id UUID PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  amount NUMERIC NOT NULL,
  lock_end TIMESTAMP NOT NULL,
  voting_power NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 委任
CREATE TABLE delegations (
  id UUID PRIMARY KEY,
  delegator_address VARCHAR(42) NOT NULL,
  delegate_address VARCHAR(42) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP
);

-- Delegate登録
CREATE TABLE delegates (
  id UUID PRIMARY KEY,
  address VARCHAR(42) NOT NULL UNIQUE,
  name VARCHAR(100),
  description TEXT,
  avatar_url TEXT,
  ipfs_hash VARCHAR(64),
  total_delegated NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Prover申請
CREATE TABLE prover_applications (
  id UUID PRIMARY KEY,
  operator_address VARCHAR(42) NOT NULL,
  company_name VARCHAR(200) NOT NULL,
  company_info_encrypted TEXT,
  hsm_attestation TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  reviewed_by UUID REFERENCES staff(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Observer登録
CREATE TABLE observers (
  id UUID PRIMARY KEY,
  address VARCHAR(42) NOT NULL UNIQUE,
  stake_amount NUMERIC NOT NULL,
  registered_at TIMESTAMP DEFAULT NOW(),
  exited_at TIMESTAMP
);

-- Challenge
CREATE TABLE challenges (
  id UUID PRIMARY KEY,
  challenger_address VARCHAR(42) NOT NULL,
  unlock_id VARCHAR(66) NOT NULL,
  evidence_ipfs_hash VARCHAR(64),
  status VARCHAR(20) DEFAULT 'pending',
  result VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Enterprise顧客
CREATE TABLE enterprise_customers (
  id UUID PRIMARY KEY,
  company_name VARCHAR(200) NOT NULL,
  contract_info_encrypted TEXT,
  api_quota INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enterpriseユーザー
CREATE TABLE enterprise_users (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES enterprise_customers(id),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  two_factor_secret_encrypted TEXT,
  webauthn_credentials JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- QSスタッフ
CREATE TABLE staff (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL,
  two_factor_secret_encrypted TEXT,
  webauthn_credentials JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- 監査ログ
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_type VARCHAR(20) NOT NULL,
  actor_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(100),
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 通知
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 4.4 フロントエンド共通コンポーネント（不足）

### 必要な共通パッケージ

```
packages/
├── ui/                          # 共通UIコンポーネント
│   ├── Button/
│   ├── Input/
│   ├── Modal/
│   ├── Table/
│   ├── Card/
│   ├── Alert/
│   ├── Toast/
│   ├── Spinner/
│   ├── Skeleton/
│   └── ...
│
├── crypto/                      # 暗号関連
│   ├── dilithium-wasm/          # Dilithium WASM バインディング
│   ├── siwe/                    # SIWE ヘルパー
│   └── key-storage/             # IndexedDB暗号化保存
│
├── web3/                        # Web3関連
│   ├── wagmi-config/            # wagmi設定
│   ├── contract-hooks/          # コントラクト呼び出しHooks
│   └── wallet-utils/            # ウォレットユーティリティ
│
├── api-client/                  # API Client
│   ├── client.ts                # ベースクライアント
│   ├── auth.ts                  # 認証API
│   ├── user.ts                  # ユーザーAPI
│   ├── lock.ts                  # Lock API
│   ├── unlock.ts                # Unlock API
│   └── ...
│
├── state/                       # 状態管理
│   ├── auth-store/              # 認証状態
│   ├── user-store/              # ユーザー状態
│   └── notification-store/      # 通知状態
│
└── utils/                       # ユーティリティ
    ├── format/                  # フォーマッター
    ├── validation/              # バリデーション
    └── date/                    # 日付処理
```

---

# Part 5: 画面数サマリー（最終版）

| # | システム | 画面数 | 📱対応 | 優先度 |
|---|---------|:------:|:------:|:------:|
| 0 | サービス全体サイト | 15 | ✅ | P1 |
| 1 | Consumer App | 25 | ✅ | P0 |
| 2 | Token Hub | 22 | ✅ | P0 |
| 3 | Governance | 20 | △ | P1 |
| 4 | Prover Portal | 32 | △ | P0 |
| 5 | Observer/Challenger | 16 | ✅ | P1 |
| 6 | Explorer | 14 | ✅ | P1 |
| 7 | Enterprise Admin | 35 (+12 auth) | △ | P1 |
| 8 | QS Admin | 50 (+12 auth) | ❌ | P0 |
| | **合計** | **241** | | |

---

# Part 6: 統合時リスクと対策

## 6.1 高リスク項目

| # | リスク | 影響度 | 対策 |
|---|--------|:------:|------|
| 1 | Dilithium WASM統合 | 高 | 早期にPoCを作成、パフォーマンス測定 |
| 2 | SIWE認証の安全性 | 高 | セキュリティ専門家によるレビュー |
| 3 | 2FA/WebAuthn実装 | 中 | 既存ライブラリ活用（Passkey, SimpleWebAuthn） |
| 4 | DB設計の変更 | 中 | マイグレーション計画を事前作成 |
| 5 | API互換性 | 中 | OpenAPI仕様書を先に作成 |

## 6.2 推奨アクション

1. **Week 1-2**: 
   - API仕様書（OpenAPI 3.0）作成
   - DBスキーマ設計レビュー
   - Dilithium WASM PoC

2. **Week 3-4**:
   - 認証基盤実装（SIWE + Email/Password）
   - 共通コンポーネントライブラリ構築
   - Consumer App MVP

3. **継続的**:
   - フロントエンド・バックエンド並行開発
   - 週次の統合テスト
   - APIドキュメント更新

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-05 | 初版作成 |
| 2.0 | 2026-01-05 | 全プレイヤージャーニー、認知・理解フェーズ、権限設計、データ設計、スマホ対応 |
| 3.0 | 2026-01-05 | サービス全体LP、ホワイトペーパー、全ペルソナ、ログイン設計、バックエンド統合ギャップ |

---

**END OF DOCUMENT**
