# Quantum Shield 開発戦略 v2.0

**日時**: 2025-12-28  
**ステータス**: ✅ CEO承認済み  
**決議**: エージェント会議

---

## 1. ビジネスモデル

### 1.1 Quantum Shieldの位置づけ

```
Quantum Shield = 量子耐性署名インフラプロバイダー（2B向け）

【提供するもの】
├── 量子耐性署名インフラ（L3 Aegis）
├── Proverネットワーク（信頼できる署名者群）
├── BFTノードネットワーク（分散合意基盤）
└── SDK/API（統合用ツール）

【収益モデル】
├── ライセンス料（月額/年額）
├── トランザクション手数料（API呼び出し単位）
└── コンサルティング/導入支援
```

### 1.2 QS社の本業

```
1. Proverネットワーク構築・管理
   └── 信頼できる署名企業を集める
   └── SLA管理、品質保証

2. BFTネットワーク構築・管理
   └── 分散ノード運営者を集める
   └── 地理的分散、冗長性確保

3. 技術開発
   └── Dilithium署名の効率化
   └── SDK/API開発
   └── 統合支援
```

---

## 2. 2本立てターゲット戦略

### 2.1 Enterprise（金融系システム会社向け）

```
┌─────────────────────────────────────────────────────────────────┐
│  Enterprise Edition                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  【ターゲット】                                                 │
│  ├── ブロックチェーン関係ない金融系システム会社                 │
│  ├── 既存の金融システムに量子耐性を追加したい企業               │
│  ├── 銀行、証券、保険、決済会社等                               │
│  └── 規制対応が必要な企業                                       │
│                                                                 │
│  【構成】                                                       │
│  ├── L3: 4ノードBFT（固定）                                     │
│  ├── Prover: 許可制（契約企業のみ）                             │
│  ├── 運営: QS運営 or 顧客自社運営                               │
│  └── メンバーシップ: 静的（設定ファイル）                       │
│                                                                 │
│  【提供形態】                                                   │
│  ├── 選択肢1: QS運営の共有インフラ利用（API経由）               │
│  └── 選択肢2: 自社プライベートL3運営（ライセンス提供）          │
│                                                                 │
│  【重視する点】                                                 │
│  ├── 安定性・可用性                                             │
│  ├── サポート体制                                               │
│  ├── 規制対応（監査証跡等）                                     │
│  └── シンプルな統合                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Decentralized（DEX等のブロックチェーン企業向け）

```
┌─────────────────────────────────────────────────────────────────┐
│  Decentralized Edition                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  【ターゲット】                                                 │
│  ├── 分散型が前提のブロックチェーン企業                         │
│  ├── DEX、ブリッジ、カストディ、ウォレット等                    │
│  └── 分散性・透明性を重視するプロジェクト                       │
│                                                                 │
│  【構成（Phase別）】                                            │
│                                                                 │
│  Phase 1-2: 初期ローンチ                                        │
│  ├── L3: 4ノードBFT（QS運営）                                   │
│  ├── Prover: 5社固定（許可制）                                  │
│  └── 「分散化予定」として説明                                   │
│                                                                 │
│  Phase 3: Security Council                                      │
│  ├── L3: 7ノード（パートナー企業参加）                          │
│  ├── Prover: ステーク制（SC承認）                               │
│  └── 段階的分散化                                               │
│                                                                 │
│  Phase 4: Full Decentralization                                 │
│  ├── L3: Permissionless（ステークで参加）                       │
│  ├── Prover: Permissionless（ステーク制）                       │
│  └── 真の分散型                                                 │
│                                                                 │
│  【重視する点】                                                 │
│  ├── 分散性・検閲耐性                                           │
│  ├── 透明性（オンチェーン検証可能）                             │
│  ├── Permissionless参加                                         │
│  └── コミュニティガバナンス                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 比較表

| 項目 | Enterprise | Decentralized |
|------|------------|---------------|
| ターゲット | 金融系システム会社 | DEX、ブリッジ等 |
| 分散性要件 | 低（安定性重視） | 高（分散性が価値） |
| L3ノード | 4固定 | 4 → 7 → Permissionless |
| Prover | 許可制 | 許可制 → Permissionless |
| 運営 | QS or 顧客自社 | QS → 分散 |
| 規制対応 | 重視 | 標準的 |
| 提供形態 | API / ライセンス | API |

---

## 3. L3チェーン戦略

### 3.1 技術決定事項

| 項目 | 決定 | 根拠 |
|------|------|------|
| 構成 | 独自4ノードBFTチェーン | 透明性(CP-5)確保 |
| フレームワーク | 独自構築（l3-aegis） | CP-1準拠の完全制御 |
| 合意 | PBFT variant | 1/4障害耐性 |
| ZK-STARK | 使用しない | 将来検討 |
| 実装言語 | Rust | 既存資産活用 |

> 詳細: `docs/aegis/L3_CHAIN_SPECIFICATION.md`  
> 決議: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

### 3.2 Phase別構成

| Phase | ノード数 | 障害耐性 | 合意閾値 | メンバーシップ |
|-------|---------|---------|---------|---------------|
| 1-2 | 4 | f=1 | 3/4 | Static |
| 3 | 7 | f=2 | 5/7 | Council |
| 4 | 7+ | (n-1)/3 | 2f+1 | Stake-based |

### 3.3 コードベース

```
l3-aegis（共通コードベース）
├── --nodes=4 --membership=static    → Enterprise / Phase 1-2
├── --nodes=7 --membership=council   → Phase 3
└── --nodes=N --membership=stake     → Phase 4 Decentralized
```

---

## 4. 技術的フォーカス

### 4.1 Dilithium署名の効率化

```
【課題】
├── 署名サイズ: ~2.4KB（大きい）
├── 公開鍵: ~1.3KB（大きい）
└── L1ガス代: ~200K gas/署名

【取り組み】
├── バッチ検証
├── L3での効率的検証
├── 将来: 署名集約技術
└── 将来: Ethereumプリコンパイル提案
```

### 4.2 成果物

| 成果物 | 説明 | ターゲット |
|--------|------|-----------|
| L3 Aegis | 量子耐性L3チェーン | 共通 |
| Enterprise SDK | 企業統合用SDK | Enterprise |
| API | REST/gRPC API | 共通 |
| Reference Impl | DEX統合例 | Decentralized |
| ドキュメント | 統合ガイド | 共通 |

---

## 5. 開発タイムライン

```
【Phase 1-2: Foundation】

Week 1-4:   Common Core
            ├── aegis-crypto (Dilithium, SPHINCS+, SHA3)
            ├── aegis-smt (Sparse Merkle Tree)
            ├── aegis-core (基本型定義)
            └── aegis-consensus (PBFT)

Week 5-12:  L3 Aegis + Enterprise SDK
            ├── 4ノードBFT動作
            ├── Sepolia統合
            ├── Enterprise SDK
            └── API/ドキュメント

Week 12+:   顧客獲得・投資調達
            ├── Enterprise顧客へのデモ
            └── 投資家へのピッチ
```

---

## 6. やること・やらないこと

### ✅ やること

1. **2B向けインフラ提供**
   - Enterprise: 金融系システム会社
   - Decentralized: DEX、ブリッジ等

2. **Prover/BFTネットワーク構築・管理**
   - 信頼できるProver企業を集める
   - 分散BFTノード運営者を集める

3. **技術開発**
   - L3 Aegis（独自BFTチェーン）
   - Dilithium署名効率化
   - SDK/API

4. **収益化**
   - ライセンス料
   - トランザクション手数料
   - コンサルティング

### ❌ やらないこと

1. **一般消費者向けサービス運営**
   - 自社でDEX/ウォレット運営はしない
   - 技術提供に専念

2. **トークンEarn報酬**
   - ユニットエコノミクスが成立しない
   - $QS報酬モデルは採用しない

3. **外部DeFi統合**
   - Lido/Aave等との統合は行わない
   - 量子耐性の一貫性を維持

---

## 参照ドキュメント

- `docs/aegis/L3_CHAIN_SPECIFICATION.md` - L3詳細仕様
- `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` - 技術選定決議
- `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` - シーケンス仕様
- `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` - 統合仕様
- `docs/constitution/CORE_PRINCIPLES.md` - 憲法

---

## 変更履歴

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2025-12-28 | 2本立て戦略（Enterprise/Decentralized）に改訂 |

---

**END OF DOCUMENT**
