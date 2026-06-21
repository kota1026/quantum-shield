# 量子耐性ティアリング & SPHINCS- 影響評価メモ

> **作成日**: 2026-06-21
> **目的**: (1) Ethereum 研究提案「SPHINCS-」の QS への影響評価、(2) アセットクラス別の量子耐性ティアリング・フレームワーク設計、(3) AI 駆動セキュリティの整備方針を、QS の戦略文書として統合する。
> **位置づけ**: リサーチメモ（設計確定前）。実装・コード変更は含まない。
> **関連**: `docs/core/SEQUENCES.md` (v3.0)、`docs/research/COMPETITOR_ANALYSIS_2026.md`、`.claude/rules/blockchain.md` (CP-1)

---

## エグゼクティブサマリー（TL;DR）

1. **SPHINCS-** は Ethereum 研究者（nicocsgy、Vitalik 謝辞、2026-06-12 公開）が提案した **EVM 最適化版 SPHINCS+**。標準の SHAKE256 を **EVM ネイティブ KECCAK256** に置換し、署名予算を 2^64 → **2^14〜2^20** に削減することで、**オンチェーン検証 ~127K gas / 署名 3,704 bytes**（C13）を達成する。
2. **QS の現状**: L1Vault のフル SPHINCS+ 検証は**純 Solidity SHAKE256（Keccak-f を手実装）**で、1署名あたり**約 15M〜40M gas** と推定 → **ブロック gas 上限超で実質実行不可能**。仕様書（SEQUENCES #2）の「Unlock ~490K gas」は、実際には未達・未実測の**設計目標値**である。
3. **現実解はハイブリッド（楽観的検証）**: 通常パスは L3 BFT でオフチェーン検証（FIPS 205 SPHINCS+ を正典署名として維持＝規制準拠）、L1 は**ルートコミット＋紛争時のみオンチェーン検証**。その紛争パスの高速化に SPHINCS- を「加速器」として限定採用する。
4. **本メモの2つの深掘り**:
   - **量子耐性ティアリング**: 市場全体は「どのアセットクラスにどの耐性レベルが適切か」という**階層的リスクベース**へ向かう。QS はこれを**プロダクト機能（資産クラス別の耐性ティア選択）**として打ち出せる。
   - **AI 駆動セキュリティ**: AI は脆弱性発見コストを劇的に下げる。QS は**手実装暗号の塊**であり露出が大きい（既知の未完成箇所あり、後述）。継続的 KAT / 差分ファジング / 形式手法 / AI レビューの整備が必須。

---

## 1. SPHINCS- リサーチ要約

| 項目 | 標準 SPHINCS+ / SLH-DSA (FIPS 205) | SPHINCS-（提案） |
|------|-----------------------------------|------------------|
| ハッシュ | SHAKE256 / SHA-256 | **KECCAK256（EVM ネイティブ）** |
| 署名予算 / 鍵 | 2^64 | **2^14〜2^20** |
| セキュリティ | 128-bit (NIST L1) | 128-bit 主張（要一次精査） |
| 検証コスト | EVM では非現実的 | **~127,000 gas**（C13） |
| 署名サイズ | 7,856 B（128s, SHAKE）/ 3,856 B（128, SHA2-24） | **3,704 B**（C13） |
| プロトコル変更 | — | **不要**（Solidity 実装、precompile/HF 不要） |
| 標準化状況 | **NIST 標準（FIPS 205, 2024-08）** | **非標準・独自パラメータ** |

**根拠**: 予算削減の論拠は「通常の Ethereum アドレスに 2^64 署名は不要」（Merge 以降のアドレス当たり年間トランザクションの 99.9 パーセンタイル ≈ 431）。

> ⚠️ 一次ソース（ethresear.ch スレッド本文）は取得時 403。数値は複数二次報道のクロスチェック。**採用検討時は一次スレッドでセキュリティレベル・鍵予算管理・grinding 耐性を最終確認すること。**

---

## 2. QS 現状の gas 分析（再計算・確定版）

### 2.1 二重の検証パス（食い違いの正体）

`L1Vault.sol::_verifyThresholdSignatures` には**2経路**が存在する：

| 経路 | 実体 | コスト | 真の PQ 検証か |
|------|------|--------|---------------|
| `_verifyWithSPHINCSVerifier` | `sphincsVerifier.verify()` をオンチェーン実呼び出し（純 Solidity SHAKE フル検証） | **~15M〜40M gas/署名** | ✅（だが実行不可） |
| `_verifySimplified` | SHA3-256 で公開鍵ハッシュを照合するだけ | 数千 gas | ❌（暗号検証なし） |

切替フラグ: `useFullVerification`（`setFullVerification`）。定数: `REQUIRED_SIGNATURES = 2`, `TOTAL_PROVERS = 5`（2-of-5）。

### 2.2 フル検証の構造ベース gas 見積もり

`SPHINCSVerifier.verify()` のハッシュ呼び出し回数（N=16, W=16, WOTS_LEN=35, D=7, FORS_TREES=14, FORS_HEIGHT=12）:

- WOTS（支配項）: 7層 × 35鎖 × 平均7.5ステップ ≈ **1,840 回**
- FORS: 14木 ×(葉1+登り12) = **182 回**
- その他（ダイジェスト/Merkle/compress）≈ **80 回**
- **合計 ≈ 約 2,100 SHAKE256 呼び出し / 署名**

`SHAKE256.sol` は **Keccak-f[1600] を純 Solidity で実装**（ネイティブ keccak オペコード不使用）。1呼び出し ≈ 1置換 ≈ **約 10,000〜25,000 gas**。
→ **1署名 ≈ 15M〜40M gas、Unlock（2署名）≈ 35M〜80M gas → ブロック gas 上限(~36M)超で1Txに収まらず実行不可能。**

### 2.3 仕様 vs 実測 vs 解析

| 項目 | 仕様書(SEQUENCES) | 実測(ACTUAL_STATE) | 解析(本メモ) |
|------|-------------------|---------------------|--------------|
| Lock (`lockWithSR0`) | ~135K gas | **253,087 gas**（Sepolia 実証） | — |
| Unlock（フル検証×2） | ~490K gas | **未実測** | 35M〜80M（実行不可） |

**確定結論**: 仕様書の ~490K は「ネイティブ keccak 級の検証器」を暗黙前提にした**未達成の設計目標**。現行 CP-1 純 Solidity SHAKE 検証器は**自分自身の仕様 gas 予算を満たせない**。フル検証付き Unlock はオンチェーンで一度も成功していない。

> ⚠️ `forge` 未インストール＋ネットワーク制限（foundry.paradigm.xyz が allowlist 外）のため、上記フル検証 gas は**構造ベース解析値**。実測には allowlist への foundry 追加が必要。

### 2.4 SPHINCS- 採用時の試算

| 項目 | 現行 SPHINCS+-SHAKE-128s | SPHINCS- C13 | 効果 |
|------|------------------------|--------------|------|
| 署名サイズ | 7,856 B | **3,704 B** | -53% |
| 1検証 gas | 15M〜40M（実行不可） | **~127K** | 実行不可 → 実行可能 |
| calldata（2署名） | 15,712 B（~250K gas） | 7,408 B（~118K gas） | -130K gas |
| **Unlock 合計** | 実行不可 | **約 450〜500K gas** | **仕様書 490K 目標に一致** |

**核心**: 仕様書の 490K 予算は SPHINCS- 級性能を前提にしないと達成不能。SPHINCS- 採用で初めて「実装が仕様に追いつく」。

---

## 3. ハイブリッド検証アーキテクチャ（楽観的検証 + 紛争時オンチェーン）

### 3.1 設計

- **通常パス**: L3 BFT 4ノードがオフチェーンでフル検証（gas 不要） → L1 はルートコミットのみ。
  - 既に Dilithium は L3 オフチェーン検証済み（v3.0）。同じ発想を SPHINCS+ にも適用。
- **紛争パス**: 第三者が異議申立て → L1 でオンチェーン検証（ここを SPHINCS- で高速化）。

これは Optimistic Rollup と同型の信頼構造。**セキュリティの全体重が「紛争パスが実際に成立すること」に乗る。**

### 3.2 競争力を支える3条件（=満たせば競争力は本物）

| # | 条件 | 現状 | 重大度 |
|---|------|------|--------|
| ① | 紛争パスのオンチェーン検証が**実際に実行可能** | ❌ 現行 SHAKE 検証は実行不可 → fraud proof を誰も提出できない＝実質「L3 委員会を信頼するだけ」 | **最重要・荷重部材** |
| ② | Watcher/Challenger が **permissionless・常時稼働・経済的動機づけ**＋データ可用性(DA) | △ Sequence #4 報酬設計は良いが、監視ボットが運営専属だと「信頼ある第三者」止まり | 高 |
| ③ | **「正典署名＝FIPS 205」と「紛争加速器＝SPHINCS-」の分離**＋両者の暗号学的等価性 | 未文書化 | 高（規制） |

**①は「あれば嬉しいオプション」ではなく、楽観的モデルの安全性を支える必須部材（load-bearing）。** ここを埋めて初めて QS の「オンチェーンで強制可能な PQ カストディ」が事実になる。

---

## 4. 量子耐性ティアリング・フレームワーク 【深掘り】

### 4.1 着想

「全資産に一律フル PQ」はコスト的にも非現実的（§2 で実証）。市場全体は **「どのアセットクラスにどの耐性が適切か」という階層的リスクベース** へ向かう。Ethereum の **Account Abstraction（EIP-8141, Hegotá HF 候補・2026後半）** が「アカウント単位での署名方式選択」を可能にするため、**ティアリングは技術的にも実装可能**になりつつある。

### 4.2 耐性を決める5変数

| 変数 | 説明 | 高耐性が必要になる方向 |
|------|------|----------------------|
| **Value at Risk** | 想定元本 | 大きいほど高耐性 |
| **Time Horizon / HNDL** | 何年生き残る必要があるか（Q-day 推定 2028〜2035）。長期保管は "Harvest Now, Decrypt Later" 露出大 | 長期ほど高耐性 |
| **Key Exposure** | 公開鍵が使用前に露出するか（EOA は初回 Tx で露出 → 休眠資金が長距離量子攻撃に晒される） | 露出するほど高耐性 |
| **Finality / Reversibility** | カストディ確定＝不可逆 / 取引＝回復可能 | 不可逆ほど高耐性 |
| **Regulatory Class** | 適格カストディ・証券・ステーブル・CBDC | 規制対象ほど FIPS 必須 |

### 4.3 ティア定義（提案）

| Tier | 対象アセットクラス | 推奨署名/耐性 | 検証方式 | 根拠 |
|------|------------------|--------------|----------|------|
| **T0 — Ephemeral** | DEX 取引、マイクロペイメント、セッション鍵 | gas 最適 PQ（SPHINCS- / Winternitz / lattice）or ハイブリッド | オンチェーン安価 | 短命・低額・回復可能。コスト最優先 |
| **T1 — Operational Hot** | 取引所ホット、ブリッジ、Prover 運用鍵（高頻度署名） | **NIST ML-DSA**（小・高速）。オンチェーン強制は SPHINCS- 加速 | 楽観的＋紛争 | 高頻度・中額。速度と強制力 |
| **T2 — Settlement / Qualified Custody**（**QS コア**） | Lock/Unlock カストディ確定 | **デュアル NIST（ML-DSA + SLH-DSA）**、FIPS 検証 | L3 オフチェーン検証＋L1 楽観的強制 | 不可逆・規制対象。保守性最優先 |
| **T3 — Long-dated / Sovereign** | コールド保管、トラスト/年金、トレジャリー、CBDC 準備金、**veQS 4年ロック** | **最保守：ハッシュベース SLH-DSA、192/256-bit、多層防御** | オフチェーン＋定期再検証 | Q-day を余裕で越えて生存必須 |

### 4.4 QS 構造へのマッピング

| QS コンポーネント | 該当 Tier | 含意 |
|------------------|-----------|------|
| Lock / Unlock（カストディ確定） | **T2** | デュアル NIST 維持＝規制差別化の核 |
| veQS 4年ロック | **T3 候補** | 長期 HNDL 露出。パラメータ強化を検討 |
| Prover 運用署名（高頻度・オンチェーン紛争） | **T1** | 紛争パスは SPHINCS- 加速の最有力候補 |
| Governance / Token 操作 | **T1** | 中額・回復余地あり |

### 4.5 プロダクト含意

- **「資産クラス別の量子耐性ティア」を QS の明示的プロダクト機能**として打ち出せる（クリプトアジリティ＝アルゴリズム差替え容易性が前提）。
- AA（EIP-8141）の流れと整合し、「アカウント／資産ごとに耐性を選べるカストディ」は競合に対する明確な差別化軸になりうる。
- ティアが上がるほど**保証手法も上げる**（T2/T3 は形式検証・複数独立実装・KAT 必須、後述 §5 と接続）。

---

## 5. AI 駆動セキュリティ整備 【深掘り】

### 5.1 二面性

| 側面 | 内容 | QS への含意 |
|------|------|------------|
| **攻撃（Offense）** | AI が手実装暗号・カスタムコントラクトのバグ発見コストを劇的に低下 | QS は**手実装暗号の塊**（純 Solidity SHAKE256/Keccak-f、カスタム SPHINCS+ 検証、SMT、SHA3_256）→ **露出が構造的に大きい** |
| **防御（Defense）** | AI 支援の継続ファジング・形式検証・自動レビューで先回り | CI への統合で「AI 攻撃者より先に AI 防御者が見つける」体制 |

### 5.2 既知の具体リスク（実在）

`SPHINCSVerifier.sol::_climbMerkleTree`（L544-545）にコメント付きの**未完成箇所**が存在する：

```
// Note: leafIndex would need to be extracted from signature
// For simplicity, assuming index 0 path verification
```

→ Merkle パス登りが **leaf index 0 を仮定**しており、**現状は正しい SPHINCS+ 検証器ではない**。これは AI 支援レビューが即座に検出する類の正確性バグであり、「手実装暗号 × AI 発見容易性」リスクの実例。**T2/T3 で本番運用する前に必修の修正対象。**

### 5.3 防御プログラム（提案）

| 施策 | 内容 | 優先度 |
|------|------|--------|
| **KAT (Known Answer Tests)** | 全暗号プリミティブ（SHAKE256/SHA3/SPHINCS+/Dilithium）を NIST 公式テストベクタで検証。CI 必須化 | **最高** |
| **差分ファジング** | 純 Solidity SHAKE/検証器 vs リファレンス実装（PQClean 等）の出力一致を大量ランダム入力で照合 | 高 |
| **形式手法** | T2/T3 のクリティカルパス（検証器・SMT・Slashing）に形式検証 or 記号実行 | 高 |
| **AI コードレビュー in CI** | PR 単位で AI セキュリティレビュー（本リポジトリの security-review/code-review スキル活用） | 中 |
| **複数独立実装** | 検証ロジックを2実装で相互照合（実装単一障害点の排除） | 中（T3） |
| **スコープ付き Bug Bounty** | 手実装暗号に重点配分 | 中 |
| **クリプトアジリティ** | 破れ・バグ発覚時に**署名方式を迅速に差替え**できる設計（ティアリングと一体） | 高 |

### 5.4 ティアリングとの接続

**「Tier が高い＝保証手法も高い」を原則化**する：

| Tier | 最低保証要件 |
|------|------------|
| T0/T1 | KAT + 差分ファジング |
| T2 | + 形式検証 + 外部監査 |
| T3 | + 複数独立実装 + 定期再監査 + クリプトアジリティ訓練 |

---

## 6. 規制・競争力分析

### 6.1 SPHINCS- の業界 vs 規制での受容

| 観点 | 評価 | 根拠 |
|------|------|------|
| **業界（Ethereum）** | 条件付き受容 ⭕ | Vitalik PQ ロードマップ(2026-02, 完了〜2029)、EF PQ ハブ(2026-03, 10+チーム)、AA(EIP-8141)でアプリ層オプトイン PQ が可能。ただし base protocol 必須化ではなく実験的 |
| **規制 / NIST-FIPS** | 本命用途では受容困難 ❌ | keccak256 は FIPS 非準拠（SHA3-256=0x06 / SHAKE=0x1F / keccak=0x01、`SHAKE256.sol` ヘッダ自身が明記）。非標準パラメータも FIPS 205 標準外。適格カストディ/FIPS 140-3 は NIST 検証済み暗号を要求 |

**戦略結論**: 「EVM で安い（keccak）」と「NIST 準拠（SHA3/SHAKE）」は**構造的トレードオフ**。SPHINCS- を**中核カストディ署名に採用すると CP-1（QS の規制差別化の核）を自壊**させる。→ **紛争パス限定の加速器**に留めるのが正解。

### 6.2 競合ポジショニング

| 競合 | QS ハイブリッドの優位 | 条件 |
|------|---------------------|------|
| 伝統カストディ（Fireblocks/BitGo） | PQ 対応＋オンチェーン強制可能な紛争解決 | ①成立が前提 |
| PQ チェーン（QRL Zond 等） | デュアル署名＋Ethereum L1 決済＋NIST 準拠 | 独自 L1 でなく Sepolia 整合 |
| 「純オンチェーン PQ 検証」標榜系 | そもそも gas 的に不可能 → QS が現実的 | 誇張表現を避ける誠実さ |

**競争力は "潜在的"。①（紛争パス実行可能化）を実装・gas 実証した瞬間に "実在" へ変わる。**

---

## 7. 推奨ロードマップ

1. **本メモのレビュー・合意**（信頼前提とティア定義の確定）。
2. **既知バグ修正**: `_climbMerkleTree` の index-0 仮定（§5.2）を是正 or フル検証を正式にオフチェーン化と位置づけ。
3. **KAT/差分ファジングの CI 整備**（§5.3）— 全暗号プリミティブ。
4. **ハイブリッド検証の設計確定**:
   - 正典署名 = FIPS 205 SPHINCS+（L3 オフチェーン検証）
   - 紛争パス = SPHINCS- PoC（目標 ~127K gas、allowlist に foundry 追加して実測）
   - FIPS-205 ↔ SPHINCS- のメッセージ等価マッピング（③）
5. **ティアリングのプロダクト化検討**（AA/EIP-8141 を見据えた資産クラス別耐性選択）。
6. **veQS 長期ロックの T3 パラメータ検討**（HNDL 露出）。

---

## 8. 未解決事項 / Open Questions

- SPHINCS- の正確なセキュリティレベル・鍵予算管理方式（一次スレッド精読が必要）。
- 紛争パスでの SPHINCS- 採用が、規制上「実効的な信頼の根が非 FIPS」と解釈されるリスクの法的整理。
- フル検証フル gas の実測（foundry allowlist 追加後）。
- `_verifySimplified` 経路が本番で有効化されていないことの保証（暗号検証なしパスの誤用防止）。

---

## Sources / References

- Ethereum Research — SPHINCS minus: https://ethresear.ch/t/sphincs-minus-efficient-stateless-post-quantum-signature-verification-on-the-evm/25165
- Ethereum PQ roadmap: https://ethereum.org/roadmap/future-proofing/quantum-resistance/
- EF Post-Quantum security hub (CoinDesk, 2026-03): https://www.coindesk.com/tech/2026/03/25/ethereum-foundation-prepares-for-quantum-threat-with-new-cryptography-roadmap
- The road to PQ Ethereum via Account Abstraction: https://ethresear.ch/t/the-road-to-post-quantum-ethereum-transaction-is-paved-with-account-abstraction-aa/21783
- NIST FIPS 205 (SLH-DSA): https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.205.pdf
- 内部コード: `src/l1/contracts/src/L1Vault.sol`、`src/l1/contracts/src/SPHINCSVerifier.sol`、`src/l1/contracts/src/libraries/SHAKE256.sol`、`docs/core/SEQUENCES.md`、`docs/ACTUAL_STATE.md`

---

*本メモはリサーチ段階の評価であり、実装・コード変更を含まない。数値の一部は二次ソース／構造ベース解析に基づくため、設計確定時に一次資料・実測で裏取りすること。*
