# Quantum Shield L3 - Unified Specification v2.0

> **Document Version**: 2.0  
> **Last Updated**: 2025-12-28  
> **Status**: CEO承認待ち  
> **Rounds Completed**: 8 (42 votes)

---

## Executive Summary

Quantum Shield L3は、量子コンピュータ時代に備えた世界初のNIST準拠量子耐性クロスチェーンブリッジである。本仕様書は、8ラウンドの設計会議と42項目の投票を経て策定された統合仕様を定義する。

### Core Principles (Immutable)

以下の原則は、ガバナンス投票によっても変更不可能な「憲法」として定義される：

| # | 原則 | 説明 |
|---|------|------|
| 1 | **完全量子耐性** | NIST準拠の量子耐性アルゴリズムのみ使用 |
| 2 | **Self-Custody** | ユーザーが自身の秘密鍵を管理 |
| 3 | **Time Lock存在** | Time Lockを0にすることは不可 |
| 4 | **Slashing存在** | Slashingメカニズムの削除は不可 |
| 5 | **透明性** | 全てオンチェーンで検証可能 |

---

## L3 Infrastructure Decision (2025-12-28)

> **Decision Date**: 2025-12-28  
> **Decision Record**: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

### Technical Selection

| Item | Decision |
|------|----------|
| L3 Configuration | Custom 4-node BFT chain |
| Implementation | l3-aegis (Rust) |
| Consensus | PBFT variant (f=1) |
| ZK-STARK | Not used (future consideration) |
| L1 Verification | SPHINCS+ direct verification (~$25) |

### Decision Rationale

1. **Transparency (CP-5)**: All operations recorded on L3 blocks
2. **Non-repudiation**: Prover signatures recorded as L3 transactions
3. **Quantum Resistance (CP-1)**: Full control via custom implementation
4. **Alignment**: Complete alignment with SEQUENCES v2.0 design

### Excluded Alternatives

| Alternative | Exclusion Reason |
|-------------|------------------|
| Rollup + ZK-STARK | Transparency deficit, SPHINCS+ AIR conversion takes minutes |
| Cosmos SDK | Go language incompatible with l3-aegis (Rust) |
| Substrate | CP-1 modification too complex |
| SP1/Risc Zero | Sequencer architecture lacks transparency |

### Evaluation Summary (6 Perspectives)

| Perspective | Evaluation |
|-------------|------------|
| ① ZK Required? | Not now (future consideration) |
| ② Custom Base Required? | ✅ Required (transparency) |
| ③ Proof Time | ✅ 0 seconds (no ZK) |
| ④ Gas Cost | ~$25 (SPHINCS+ direct verification) |
| ⑤ Development Cost | ✅ Minimal (reuse existing design) |
| ⑥ Quantum Resistance | ✅ Complete (dual protection) |

### Related Documents

- **Detailed Specification**: `docs/aegis/L3_CHAIN_SPECIFICATION.md`
- **Integration with Sequences**: See Phase Overview below

---

## Phase Overview

```
Month:  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21-24
        ├──────Phase 1──────┼─────────Phase 2─────────┼───Phase 3───┼─P4─┤

技術:
├─PoC─┤
       ├────SPHINCS+ 2/5────┤
                             ├────ZK Validity (Challenge)────┤
                                                              ├──ZK Only──┤

Prover:
├───QS 3社 + Partner 2社────┤
                             ├───Permissionless (Council承認)───┤
                                                                 ├─自動/ZK─┤

Token:
                             ├─発行─┤
                                     ├─veQS準備─┤
                                                 ├────veQS本稼働────┤
                                                                     ├完全─┤

ガバナンス:
├─────財団全権限─────────────┤
                             ├───Security Council───┤
                                                     ├─Token Vote + Council─┤
                                                                     ├─Full─┤

TVL:
├────$1M────┤
             ├────────$10M────────┤
                                   ├────$50M────┤
                                                 ├─────無制限──────┤

L3 (l3-aegis):
├──────開発──────┤
                 ├────Testnet────┤
                                  ├────Mainnet────────────────────────────┤
```

---

## Phase 0.5: STARK PoC

| 項目 | 内容 |
|------|------|
| **期間** | Week 1-2 |
| **目的** | Dilithium検証のSTARK化可能性検証 |
| **ツール** | SP1 / Risc0 |
| **成功条件** | Dilithium署名検証がSTARK証明で動作 |
| **失敗時** | Phase 2のZK ValidityはFallbackプランへ |

---

## Phase 1: Foundation Bootstrap

### 期間・制約

| 項目 | 内容 |
|------|------|
| **期間** | Month 1-6 |
| **TVL Cap** | $1M |
| **参加制限** | US除外、最低Unlock $10K |
| **ステータス** | Limited Beta |

### 技術仕様

#### 暗号

| 要素 | アルゴリズム | 標準 | 用途 |
|------|------------|------|------|
| User署名 | Dilithium-III | FIPS 204 | Unlock要求の認証 |
| Prover署名 | SPHINCS+-128s | FIPS 205 | Unlock承認（8KB/署名） |
| State Hash | SHA3-256 | FIPS 202 | 状態遷移の検証 |

#### インフラストラクチャ

| コンポーネント | 仕様 |
|---------------|------|
| L3 Aegis | 4ノード分散（US/EU/Asia/予備） |
| コンセンサス | BFT（1障害耐性） |
| Prover Pool | 5社（QS 3社 + パートナー 2社） |
| Prover選出 | VRF（Chainlink） |
| 署名数 | 2/5 |

#### セキュリティ

| 項目 | 設定 |
|------|------|
| Normal Time Lock | 24時間 |
| Emergency Time Lock | 7日 |
| Emergency Bond | MAX(0.5 ETH, amount × 5%) |
| Slashing | Quadratic: N² × 10% |
| 鍵管理 | HSM + 内部2-of-3マルチシグ |

### Prover仕様

| 項目 | 内容 |
|------|------|
| 構成 | QS財団 3社 + 戦略パートナー 2社 |
| Stake通貨 | ETH |
| Stake額 | $400K × 5社 = $2M |
| 選出方式 | VRF: P(i) = Stake_i / Σ Stake |
| 署名期限 | VRF後5分以内 |

### 経済モデル

| 項目 | 設定 |
|------|------|
| 手数料率 | 0.05%（最低$10） |
| Lock Gas | ~135K gas (~$7) |
| Unlock Gas | ~490K gas (~$27) |
| 往復コスト | ~$34 + 手数料 |

#### 手数料配分（Phase 1）

| 配分先 | 割合 |
|--------|------|
| Prover報酬 | 50% |
| Treasury | 40% |
| Insurance | 10% |

### ガバナンス

| 項目 | 内容 |
|------|------|
| 権限 | 財団全権限 |
| Security Council | 設立準備中 |
| Token | なし |
| 透明性 | 週次レポート公開 |

### 監視体制

| 項目 | 内容 |
|------|------|
| 公式監視ボット | QS運営 |
| 外部監視者 | グラント支援 |
| Whistleblower | 報奨金$100K |
| 月次監査 | 第三者監査会社 |

---

## Phase 2: Security Council + Token Launch

### 期間・制約

| 項目 | 内容 |
|------|------|
| **期間** | Month 7-12 |
| **TVL Cap** | $10M |
| **参加制限** | 緩和検討 |

### 技術仕様

#### Phase 1からの変更点

| 項目 | Phase 1 | Phase 2 |
|------|---------|---------
| 紛争解決 | （なし） | + ZK Validity Proof（Challenge時） |
| Prover Stake | ETH | $QS Token |

### Prover仕様

| 項目 | 内容 |
|------|------|
| 参加方式 | Permissionless |
| 承認条件 | Council 3/9 + 自動条件 |
| 兼任制限 | **Council メンバーは Prover 不可** |
| 最低Stake | $500K（Solo）/ $50K（Delegated） |

#### 自動承認条件

```
1. 最低Stake額を満たす
2. HSM使用の証明
3. 2-of-3マルチシグ設定
4. 稼働率SLA（99.5%）への同意
5. 法的契約書への署名
```

### ガバナンス

| 項目 | 内容 |
|------|------|
| Security Council | 6名稼働（財団3 + 外部3） |
| 権限 | パラメータ変更、緊急対応 |
| Emergency Pause | 5/9 |
| Token | $QS発行（Stake用、投票権なし） |

### 経済モデル

#### 手数料配分（Phase 2）

| 配分先 | 割合 |
|--------|------|
| Prover報酬 | 40% |
| Treasury | 30% |
| $QS Burn | 20% |
| Insurance | 10% |

### Token仕様

| 項目 | 内容 |
|------|------|
| 名称 | $QS (Quantum Shield) |
| 総供給量 | 1,000,000,000 |
| 用途 | Staking、手数料支払い、Delegation |
| 投票権 | なし（Phase 3まで） |

#### Token配分

| カテゴリ | 割合 | 数量 | Vesting |
|---------|------|------|---------|
| Community | 40% | 400M | 各種プログラム |
| ├ Airdrop | 5% | 50M | 即時 |
| ├ Prover Rewards | 15% | 150M | 4年配布 |
| ├ Grants | 10% | 100M | プログラム別 |
| └ Future | 10% | 100M | DAO管理 |
| Team | 20% | 200M | 4年、1年cliff |
| Investors | 15% | 150M | - |
| ├ Seed | 5% | 50M | 2年、6ヶ月cliff |
| ├ Private | 7% | 70M | 2年、6ヶ月cliff |
| └ Public | 3% | 30M | 即時 |
| Ecosystem | 15% | 150M | - |
| ├ Partnerships | 8% | 80M | 個別 |
| ├ Liquidity | 5% | 50M | 即時 |
| └ Market Making | 2% | 20M | 即時 |
| Treasury | 10% | 100M | DAO管理 |

#### Token制限

| 制限 | 内容 |
|------|------|
| 単一エンティティ上限 | 総供給の10% |
| 議決権上限 | 10%（超過分は無効） |
| 大口開示義務 | 5%以上保有は公開 |

---

## Phase 3: Token Governance

### 期間・制約

| 項目 | 内容 |
|------|------|
| **期間** | Month 13-18 |
| **TVL Cap** | $50M |
| **参加制限** | さらなる緩和検討 |

### 技術仕様

| 項目 | 内容 |
|------|------|
| 紛争解決 | ZK Validity Proof（全Unlock） |
| Time Lock | 短縮検討可（Token Vote） |

### Prover仕様

| 項目 | 内容 |
|------|------|
| 参加方式 | 自動承認（条件満たせば） |
| Council関与 | 監視のみ |

### ガバナンス

| 項目 | 内容 |
|------|------|
| Security Council | 9名（財団3 + 外部3 + コミュニティ3） |
| Token Vote | veQS投票開始 |
| 権限 | Token Vote + Council承認 |
| Purpose Committee | 設立（3名） |

#### veQS（Vote Escrow）仕様

| 項目 | 内容 |
|------|------|
| ロック期間 | 1週間〜4年 |
| 重み計算 | 投票力 = QS量 × (残りロック期間 / 最大ロック期間) |
| 最大ブースト | 4倍（4年ロック時） |

#### 投票パラメータ

| 項目 | 設定 |
|------|------|
| 議論期間 | 7日 |
| 投票期間 | 7日 |
| Time Lock | 7日 |
| Quorum（パラメータ） | 4% |
| Quorum（アップグレード） | 8% |
| Quorum（Council変更） | 15% |

### 経済モデル

手数料配分はPhase 2と同一。

---

## Phase 4: Full Decentralization

### 期間・制約

| 項目 | 内容 |
|------|------|
| **期間** | Month 19-24 |
| **TVL Cap** | 無制限 |
| **参加制限** | 最小限 |

### 技術仕様

| 項目 | 内容 |
|------|------|
| 証明方式 | ZK Only（Prover署名不要 or 最小限） |
| Time Lock | 短縮 or 不要（即時確定） |

### Prover仕様

| 項目 | 内容 |
|------|------|
| 役割 | ZK Prover（証明生成者）に移行 |
| 従来Prover | 役割縮小 or 廃止 |

### ガバナンス

| 項目 | 内容 |
|------|------|
| Token Vote | 完全稼働 |
| Security Council | 緊急時のみ |
| 財団 | 研究・支援のみ |
| Purpose Committee | コミュニティ選出 |

### 経済モデル

#### 手数料配分（Phase 4）

| 配分先 | 割合 |
|--------|------|
| ZK Prover報酬 | 30% |
| Treasury | 30% |
| $QS Burn | 30% |
| Insurance | 10% |

---

## Security Council

### 構成

| Phase | 構成 | 人数 |
|-------|------|------|
| Phase 2 | 財団3 + 外部3 | 6名 |
| Phase 3-4 | 財団3 + 外部3 + コミュニティ3 | 9名 |

### 権限

| アクション | 必要承認 | Time Lock |
|-----------|---------|-----------|
| Emergency Pause | 5/9 | なし（即時） |
| 緊急アップグレード | 7/9 | 48時間 |
| Prover停止 | 5/9 | なし |
| Slash異議判定 | 7/9 | なし |
| パラメータ変更 | Token Vote優先 | 7日 |

### 制約

| 項目 | 内容 |
|------|------|
| Emergency Pause | 最大72時間（延長はToken Vote） |
| 緊急アップグレード | 事後Token Vote追認必須 |
| Veto | 理念違反の提案のみ（6/9） |
| 任期 | 1年（再選可、最大3期） |
| 報酬 | 年間$50K相当の$QS |
| 兼任禁止 | Prover運営不可 |

---

## Purpose Committee

### 役割

| 項目 | 内容 |
|------|------|
| 目的 | 不変原則（Core Principles）の保護 |
| 人数 | 3名 |
| 選出 | Phase 1-2: 財団任命、Phase 3+: コミュニティ選出 |
| 報酬 | 年間$30K相当の$QS |

### 権限

| 権限 | 内容 |
|------|------|
| 理念チェック | 全提案の理念との整合性確認 |
| 却下 | 理念違反の提案を投票前に却下 |
| 解釈 | 曖昧なケースの解釈（異議はToken Voteで最終判断） |

---

## Treasury

### 資金源

| 源泉 | 内容 |
|------|------|
| Protocol Revenue | 手数料の30-40% |
| Token Sale | Private/Public Sale収益 |
| Slash収入 | Insurance以外の一部 |
| 初期シード | 財団から$500K |

### 用途

| カテゴリ | 内容 |
|---------|------|
| 開発助成金 | Core Dev、Ecosystem |
| セキュリティ | 監査、バグバウンティ |
| インフラ | L3ノード、監視システム |
| コミュニティ | グラント、イベント |
| 法務 | 法的レビュー、規制対応 |
| Council報酬 | Security Council、Purpose Committee |

### 管理

| Phase | 管理方式 |
|-------|---------|
| Phase 1-2 | 財団マルチシグ（3/5） |
| Phase 3 | Token Vote + 財団承認 |
| Phase 4 | Token Vote のみ |

### 制約

| 項目 | 設定 |
|------|------|
| 単独支出上限 | $100K |
| 最低残高 | 12ヶ月分の運営費 |
| 大型支出 | Token Vote必須 |
| 透明性 | 四半期報告、オンチェーン追跡 |

---

## 法的構造

### 法人

| 項目 | 内容 |
|------|------|
| 名称 | QS Foundation |
| 法域 | シンガポール |
| 形態 | 財団法人 |
| 役割 | プロトコル開発、Treasury管理、法的対応 |

### ライセンス

| 項目 | 内容 |
|------|------|
| コード | MIT（オープンソース） |
| ブランド | Quantum Shield™（財団保有） |

### 規制対応

| Phase | 対応 |
|-------|------|
| Phase 1 | US除外、Beta免責条項 |
| Phase 2 | Token法的レビュー、適格投資家のみ |
| Phase 3 | Sufficiently Decentralized主張 |
| Phase 4 | 完全分散化、法域ごと個別対応 |

---

## コスト分析

### ユーザーコスト

| 操作 | Gas | USD (20 gwei) |
|------|-----|---------------|
| Lock | ~135K | ~$7 |
| Unlock (Normal) | ~490K | ~$27 |
| 手数料 | - | 0.05% (最低$10) |
| **往復合計 ($100K)** | - | **~$84** |

### 運営コスト（月次）

| 項目 | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|------|---------|---------|---------|---------|
| Infra | $2K | $3K | $5K | $5K |
| Dev | $20K | $40K | $50K | $50K |
| Security | $5K | $15K | $20K | $20K |
| Legal | $3K | $5K | $5K | $3K |
| Community | $2K | $5K | $10K | $10K |
| Council | $0 | $5K | $10K | $10K |
| **Total** | **$32K** | **$73K** | **$100K** | **$98K** |

### 資金計画

| 源泉 | 金額 | 用途 |
|------|------|------|
| シード | $500K | Phase 1 |
| Token Sale | $3-5M | Phase 2-3 |
| 戦略投資 | $2-3M | Phase 2-3 |
| **合計** | **$5.5-8.5M** | 36ヶ月運営可能 |

---

## Risk Registry

### 認識済みリスク（🟡 中）

| # | リスク | 対応方針 |
|---|--------|---------|
| 1 | SR_0未検証（Lock時） | Unlock時検証で十分 |
| 2 | Emergency Bond DoS | 金額比例で軽減 |
| 3 | VRF応答遅延 | 5分タイムアウト+fallback |
| 4 | Gas高騰 | Phase 2以降でL2検討 |
| 5 | 競合追随 | 早期ローンチ+NIST準拠 |
| 6 | Phase移行の複雑さ | 2週間並行稼働期間 |
| 7 | Quorum未達 | Delegation推奨 |
| 8 | Token集中 | veQS + 議決権上限 |

### 最悪ケースシナリオ

| シナリオ | 影響 | 対策 |
|---------|------|------|
| 財団崩壊 | 開発停止 | コード公開、コミュニティ引継 |
| 悪意ある買収 | 提案乗っ取り | Immutable Core、Veto、フォーク |
| Council暴走 | 不正アップグレード | 48h Time Lock、Token Vote追認 |
| コミュニティ分裂 | フォーク | ユーザー資産は両方で有効 |

---

## Appendix: Vote Results Summary

全42項目の投票結果は以下のカテゴリに分類される：

| カテゴリ | 項目数 |
|---------|--------|
| アーキテクチャ | 8 |
| セキュリティ | 10 |
| 経済 | 6 |
| Phase 2以降 | 2 |
| ガバナンス | 9 |
| 統合 | 7 |
| **合計** | **42** |

詳細な投票結果は別紙「Agent Meeting Minutes」を参照。

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-21 | Initial draft (Round 1-4) |
| 1.5 | 2025-12-21 | + Protocol v3.1, External AI critique |
| 2.0 | 2025-12-21 | + Governance (Round 7), Integration (Round 8) |
| 2.1 | 2025-12-28 | + L3 Infrastructure Decision section |

---

**END OF DOCUMENT**
