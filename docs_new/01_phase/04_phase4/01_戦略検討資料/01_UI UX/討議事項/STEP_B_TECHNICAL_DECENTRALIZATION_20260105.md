# 🏛️ Step B: 技術的分散化 要件定義会議

> **日時**: 2026年1月5日  
> **議長**: CTO  
> **議題**: Prover / L3 Node Operator / Observer / Challenger の要件定義  
> **ステータス**: ✅ 完了

---

## 会議の目的

UI/UX設計に直結する「技術的分散化」関連プレイヤーの要件を詳細定義する。

### 対象プレイヤー

1. **Prover** - 最優先（登録フロー等がUI/UXに直結）
2. **L3 Node Operator**
3. **Observer**
4. **Challenger**

---

## 1. Prover 要件定義

### 1.1 現状の仕様（UNIFIED_SPEC.md / SEQUENCES.md）

| 項目 | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|------|---------|---------|---------|---------|
| 参加方式 | 招待制 | Council承認 + 自動条件 | 自動承認 | ZK Proverへ移行 |
| Stake通貨 | ETH | $QS | $QS | $QS |
| Stake額 | $400K | $500K Solo / $50K Delegated | $500K Solo / $50K Delegated | TBD |
| 承認 | 財団招待 | Council 3/9 + 自動条件 | 自動 | 自動 |
| HSM | 必須 | 必須 | 必須 | TBD |
| マルチシグ | 2-of-3必須 | 2-of-3必須 | 2-of-3必須 | TBD |
| 法的契約 | 必須 | 必須 | 必須 | TBD |

### 1.2 未定義事項（本会議で解決）

| # | 未定義事項 | 解決状況 |
|---|-----------|---------|
| 1 | HSM使用の証明方法 | ✅ 解決 |
| 2 | 2-of-3マルチシグの具体的要件 | ✅ 解決 |
| 3 | 法的契約の締結プロセス | ✅ 解決 |
| 4 | 技術審査の具体的プロセス | ✅ 解決 |
| 5 | 地理的分散要件 | ✅ 解決 |
| 6 | Delegation受入の可否・条件 | ✅ 解決 |
| 7 | 報酬計算・分配の詳細 | ✅ 解決 |
| 8 | Slashing発動条件の詳細 | ✅ 解決 |
| 9 | Exit（退出）の詳細プロセス | ✅ 解決 |
| 10 | トークン価格変動時のStake調整 | ✅ 解決 |

---

### 1.3 要件定義詳細

#### 1.3.1 HSM使用の証明方法

| Phase | 方式 | 対応HSM |
|-------|------|---------|
| Phase 1-2 | Attestation証明書 | AWS CloudHSM, Azure HSM, Thales, YubiHSM |
| Phase 3以降 | Remote Attestation（オプション追加） | TPM/SGX対応機器 |

**提出物:**
- HSMベンダー発行のAttestation証明書
- HSM設定のスクリーンショット（鍵ID等マスク可）

#### 1.3.2 2-of-3マルチシグの具体的要件

| 要件 | 詳細 |
|------|------|
| 鍵の分離 | 3鍵を異なる物理拠点に保管 |
| 署名者 | 異なる人物が各鍵を管理 |
| KYC | 各鍵管理者の身元確認必須 |
| SLA | 24時間以内に2/3署名可能 |
| バックアップ | 各鍵のバックアップ手順を文書化・提出 |

**提出物:**
- マルチシグ設定証明（アドレス、閾値）
- 各鍵管理者のKYC書類
- バックアップ手順書

#### 1.3.3 法的契約の締結プロセス

| 契約種類 | 内容 | 締結相手 |
|---------|------|---------|
| Prover Agreement | 役割・責任・報酬・Slashing条件 | QS財団 |
| NDA | 技術情報の機密保持 | QS財団 |
| SLA | 稼働率99.5%、応答時間5分以内 | QS財団 |

**プロセス:**
```
1. 申請者がProver Agreementに電子署名（DocuSign等）
2. QS財団（Phase 1）またはCouncil（Phase 2+）が審査・承認
3. NDA/SLA締結
4. 技術審査通過後、オンチェーン登録
```

#### 1.3.4 技術審査の具体的プロセス

| Phase | 審査方式 | 審査者 |
|-------|---------|--------|
| Phase 1 | 手動審査 | QS財団 |
| Phase 2 | Council承認 + 自動チェック | Council 3/9 + スマートコントラクト |
| Phase 3 | 完全自動 | スマートコントラクト + Attestation検証 |

**審査項目チェックリスト:**
```
□ HSM Attestation証明書
□ 2-of-3マルチシグ設定証明
□ 各鍵管理者KYC完了
□ Stake入金確認（エスクロー）
□ テスト署名成功（Testnet）
□ SLA同意書署名
□ Prover Agreement署名
□ 地理的分散要件確認（Phase 2+）
```

#### 1.3.5 地理的分散要件

| Phase | 要件 | 強制力 |
|-------|------|--------|
| Phase 1 | 推奨のみ（5社中3リージョン以上） | なし |
| Phase 2 | 同一リージョン上限50% | Council管理 |
| Phase 3以降 | 同一リージョン上限50% | オンチェーン強制 |

**リージョン定義:**
- North America（US, Canada）
- Europe（EU, UK, Switzerland）
- Asia-Pacific（Japan, Singapore, Australia, Korea）
- Other

#### 1.3.6 Delegation受入の可否・条件

| 項目 | 設定 |
|------|------|
| Delegation受入 | Proverが選択可能（受入ON/OFF） |
| 受入上限 | Prover自身のStakeの10倍まで |
| 最低Delegation | $1K USD相当 |
| 手数料率 | Proverが設定（0-30%） |
| 報酬分配 | 自動（スマートコントラクト） |
| Slash時 | Delegatorも比例してSlash |
| ロック期間 | 最低7日（Prover Exitに合わせる） |

**UI/UX要件:**
- Prover: Delegation受入設定画面（ON/OFF、手数料率、上限）
- Delegator: Prover一覧、Delegation実行、報酬確認

#### 1.3.7 報酬計算・分配の詳細

**報酬プール:**
| Phase | プール比率 |
|-------|-----------|
| Phase 1 | 手数料収入の50% |
| Phase 2以降 | 手数料収入の40% |

**分配計算:**
```
【基本計算】
Prover報酬 = プール × (そのProverが署名したUnlock数 / 全Unlock数)

【Delegation込みの場合】
総報酬 = 上記Prover報酬
Prover取り分 = 総報酬 × (自己Stake / 総Stake) 
             + 総報酬 × (Delegation / 総Stake) × 手数料率
Delegator取り分 = 総報酬 × (そのDelegator額 / 総Stake) × (1 - 手数料率)
```

**分配タイミング:**
- Epoch: 1週間（月曜0:00 UTC開始）
- 計算: Epoch終了時に自動計算
- 受領: Claimトランザクション実行で受領
- 未Claim: 無期限保持（ガス代節約のため）

#### 1.3.8 Slashing発動条件の詳細

| 違反種類 | Slash率 | 判定方法 | 備考 |
|---------|---------|---------|------|
| 不正署名（単独） | 10% | Challenge + ZK Proof | 即時執行 |
| 不正署名（共謀N社） | N² × 10% | Challenge + ZK Proof | 最大100% |
| 応答タイムアウト（5分超） | 0% | 自動 | 選出スキップのみ |
| 連続タイムアウト（3回） | 1% | 自動 | 警告的Slash |
| SLA違反（99.5%未満/月） | 協議 | 月次レビュー | Council判断 |
| 鍵漏洩（自己申告） | 0% | 手動 | 即時停止、善意認定 |
| 鍵漏洩（第三者検知） | 50% | Challenge | 悪意/過失認定 |

**Slash執行プロセス:**
```
1. Challenge提起（Bond支払い）
2. 証拠提出（Dilithium検証結果等）
3. Defense期間（48時間）
4. オンチェーン判定（ZK Proof検証）
5. Slash執行 or Challenge却下
```

#### 1.3.9 Exit（退出）の詳細プロセス

| ステップ | 内容 | 期間 |
|---------|------|------|
| 1. 退出申請 | オンチェーントランザクション | 即時 |
| 2. 新規割当停止 | VRF選出対象から除外 | 即時 |
| 3. 進行中Unlock完了 | 署名済みUnlockの責任継続 | 最大24h-7d |
| 4. Unbonding期間 | Slash対象継続 | 7日 |
| 5. Stake返還 | Slash控除後の残額を返還 | Unbonding後 |
| 6. Delegation返還 | Delegatorへ自動返還 | Unbonding後 |

**Delegator通知:**
- 退出申請時にイベント発行
- UI/メール/Webhook等で通知

#### 1.3.10 トークン価格変動時のStake調整

**ハイブリッド方式:**
```
【基準】
- 基準額: $500K USD相当

【調整ルール】
- 下限: 基準額の80%（$400K）を下回ったら追加Stake要求
- 上限: 基準額の200%（$1M）を超えても追加不要
- 調整頻度: 週次（月曜0:00 UTC）
- 価格参照: Chainlink Price Feed（7日TWAP）
- 猶予期間: 14日以内に追加Stake
- 未対応時: 新規Unlock割当停止（Slashなし）

【例】
$QS価格が50%下落した場合:
- 現在Stake: 100,000 QS（元$500K → 現$250K）
- 要求: +100,000 QS追加（計$500K相当に復帰）
- 猶予: 14日
```

---

### 1.4 Prover要件まとめ

```
┌─────────────────────────────────────────────────────────────┐
│  Prover Requirements v1.0                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  【参入要件】                                                │
│  ├── Stake: $500K USD相当（ハイブリッド調整）              │
│  ├── HSM: Attestation証明書必須                            │
│  ├── マルチシグ: 2-of-3、異拠点、KYC済み                   │
│  ├── 法的契約: Prover Agreement + NDA + SLA               │
│  └── 地理的分散: Phase 2以降、同一リージョン50%上限        │
│                                                             │
│  【Delegation】                                              │
│  ├── 受入: Proverが選択可能                                │
│  ├── 上限: 自己Stakeの10倍                                 │
│  ├── 最低額: $1K USD相当                                   │
│  ├── 手数料: 0-30%（Prover設定）                           │
│  └── Slash: Delegatorも比例負担                            │
│                                                             │
│  【報酬】                                                    │
│  ├── プール: 手数料の40-50%                                │
│  ├── 計算: 署名Unlock数比例                                │
│  └── 分配: 週次Epoch、Claim方式                            │
│                                                             │
│  【Slashing】                                                │
│  ├── 不正署名: N² × 10%（共謀時）                          │
│  ├── タイムアウト: 選出スキップ（3回連続で1%警告）         │
│  └── 鍵漏洩: 0-50%（申告/検知による）                      │
│                                                             │
│  【Exit】                                                    │
│  ├── Unbonding: 7日                                        │
│  ├── 進行中Unlock: 完了まで責任継続                        │
│  └── Delegation: 自動通知、Unbonding後返還                 │
│                                                             │
│  【Stake調整】                                               │
│  ├── 方式: ハイブリッド（80%-200%バンド）                  │
│  ├── 頻度: 週次                                            │
│  ├── 価格参照: Chainlink 7日TWAP                           │
│  └── 猶予: 14日                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. L3 Node Operator 要件定義

### 2.1 Phase別構成

| Phase | Enterprise Edition | Decentralized Edition |
|-------|-------------------|----------------------|
| Phase 1-2 | 4ノード固定（QS運営） | 4ノード（QS運営） |
| Phase 3 | 4ノード固定 | 4ノード（Council管理） |
| Phase 4 | 4ノード固定 | Permissionless |

### 2.2 Phase 1-3 要件（QS/Council管理）

| 項目 | 要件 |
|------|------|
| 運営者 | QS財団またはCouncil承認パートナー |
| ノード数 | 4（f=1耐障害） |
| 地理分散 | 4リージョン（US/EU/Asia/予備） |
| 可用性SLA | 99.9% |
| 報酬 | Treasuryから固定報酬（月額$5K/ノード想定） |
| 責任 | ブロック生成、状態同期、API提供 |

### 2.3 Phase 4 要件（Permissionless）- 概要

| 項目 | 要件（暫定） |
|------|-------------|
| 参入 | Stake + 自動承認 |
| Stake | $100K USD相当（想定） |
| ノード数 | 最低7、上限なし |
| コンセンサス | BFT（f = (n-1)/3） |
| 報酬 | ブロック報酬（Treasuryから） |
| 詳細定義 | Phase 3時点で再定義 |

---

## 3. Observer 要件定義

### 3.1 役割

| 項目 | 内容 |
|------|------|
| 目的 | 不正Unlockの早期検知、Alert発報 |
| 性質 | 公共財（誰でも運営可能） |
| Stake | 不要 |
| 報酬 | Whistleblower報酬（Challenge成功時$100K） |
| 参入 | Permissionless |

### 3.2 技術要件

| 項目 | 要件 |
|------|------|
| 監視対象 | L1 Vault Contract、L3 Aegis Chain |
| 検証内容 | Dilithium署名、SR遷移、Prover署名、Time Lock |
| Alert発報先 | 公開API、Discord Webhook、Telegram Bot |
| 推奨インフラ | L1 Full Node + L3 Full Node |
| 最低スペック | 4 vCPU, 16GB RAM, 500GB SSD |

### 3.3 公式Observer（QS運営）

| 項目 | 内容 |
|------|------|
| 運営 | QS財団 |
| 冗長性 | 3インスタンス（US/EU/Asia） |
| SLA | 99.9%稼働 |
| Alert | 1分以内に検知・発報 |

### 3.4 UI/UX要件

| 画面 | 内容 |
|------|------|
| Observer Dashboard（公開） | 監視ステータス、最新Alert、履歴 |
| Alert API | Webhook登録、フィルタ設定 |
| Observer登録 | 不要（Permissionless） |

---

## 4. Challenger 要件定義

### 4.1 役割

| 項目 | 内容 |
|------|------|
| 目的 | 不正Unlockに対するChallenge提起 |
| 性質 | インセンティブ駆動（報酬あり） |
| 参入 | Permissionless（Bond支払いのみ） |

### 4.2 Bond・報酬

| 項目 | 設定 |
|------|------|
| Bond | MAX(0.1 ETH, amount × 1%) |
| 報酬（成功時） | Slash額の60% |
| Bond（成功時） | 全額返還 |
| Bond（敗訴時） | 全額没収（Treasury行き） |

### 4.3 Challenge プロセス

| ステップ | 内容 | 期限 |
|---------|------|------|
| 1. Challenge提起 | Bond支払い + 対象Unlock指定 | Time Lock終了まで |
| 2. 証拠提出 | Dilithium署名検証結果、SR遷移証明 | 提起から24時間以内 |
| 3. Defense期間 | Proverが反証を提出可能 | 証拠提出から48時間 |
| 4. 判定 | オンチェーン自動検証（ZK Proof） | Defense期間終了後即時 |
| 5. 執行 | Slash実行 or Challenge却下 | 判定後即時 |

### 4.4 UI/UX要件

| 画面 | 内容 |
|------|------|
| Challenge提起 | Unlock ID選択、証拠入力、Bond支払い確認 |
| Challenge一覧 | 進行中Challenge、自分のChallenge、結果 |
| 報酬Claim | Challenge成功時の報酬受領 |

---

## 5. UI/UX要件まとめ（Step B関連）

### Prover向け画面

| 画面 | 機能 |
|------|------|
| Prover登録 | 申請フォーム、書類アップロード、Stake支払い |
| Prover Dashboard | ステータス、報酬、Delegation状況、Slash履歴 |
| Delegation設定 | 受入ON/OFF、手数料率、上限設定 |
| Exit申請 | 退出フロー、Unbonding状況 |

### Delegator向け画面

| 画面 | 機能 |
|------|------|
| Prover一覧 | Prover検索、ソート（報酬率、Slash履歴等） |
| Delegation実行 | Prover選択、金額入力、確認 |
| Delegation管理 | 現在のDelegation、報酬確認、解除 |

### Observer向け画面

| 画面 | 機能 |
|------|------|
| Observer Dashboard | 監視ステータス、Alert履歴（公開） |
| Alert API設定 | Webhook登録、通知設定 |

### Challenger向け画面

| 画面 | 機能 |
|------|------|
| Challenge提起 | 対象選択、証拠入力、Bond支払い |
| Challenge状況 | 進行中一覧、結果確認 |
| 報酬Claim | 成功報酬の受領 |

---

## 合意事項

```
┌─────────────────────────────────────────────────────────────┐
│  Step B: 技術的分散化 要件定義 結果                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  【Prover】                                                  │
│  ✅ HSM証明: Attestation証明書（Phase 1-2）                 │
│  ✅ マルチシグ: 2-of-3、異拠点、KYC必須                     │
│  ✅ 法的契約: Prover Agreement + NDA + SLA                  │
│  ✅ 技術審査: チェックリスト方式                            │
│  ✅ 地理分散: Phase 2以降50%上限                            │
│  ✅ Delegation: 受入可、10倍上限、0-30%手数料               │
│  ✅ 報酬: 週次Epoch、署名数比例                             │
│  ✅ Slashing: N²×10%（共謀）、詳細条件定義済み              │
│  ✅ Exit: 7日Unbonding、進行中責任継続                      │
│  ✅ Stake調整: ハイブリッド方式（80%-200%バンド）           │
│                                                             │
│  【L3 Node Operator】                                       │
│  ✅ Phase 1-3: QS/Council管理、4ノード固定                  │
│  ⚠️ Phase 4: 詳細はPhase 3時点で再定義                      │
│                                                             │
│  【Observer】                                                │
│  ✅ Permissionless、Stake不要                               │
│  ✅ Whistleblower報酬（Challenge成功時$100K）               │
│                                                             │
│  【Challenger】                                              │
│  ✅ Bond: MAX(0.1 ETH, amount × 1%)                         │
│  ✅ 報酬: Slash額の60%                                      │
│  ✅ Defense期限: 48時間                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**投票結果**: 全エージェント賛成 ✅

---

## 出席エージェント

| エージェント | 役割 | 主な発言 |
|-------------|------|---------|
| CTO | 議長 | 技術要件、審査プロセス |
| CSO | セキュリティ | HSM証明、Slashing条件、地理分散 |
| CFO | 経済 | Delegation、報酬計算、Stake調整 |
| Legal | 法務 | 契約プロセス、KYC |
| Engineer | 実装 | UI/UX要件 |
| CEO (Kota) | 承認 | - |

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-05 | 初版作成 |

---

**END OF DOCUMENT**
