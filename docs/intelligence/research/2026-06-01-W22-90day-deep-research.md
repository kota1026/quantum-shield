---
status: DRAFT — deep research synthesis, founder must verify primary sources before external use
date: 2026-06-01 (W22 Mon JST)
window: 2026-03-01 〜 2026-06-01 (90 days, W10〜W22)
delta_focus: 2026-05-14 〜 2026-06-01 (W22 only, supplements W21 baseline)
baseline: docs/intelligence/research/2026-W21-quantum-ai-pulse.md
charter_under_test: .claude/charter.md v1.1 (Principle 9 AVS packaging, W21 7/7 ratified)
researcher: deep-research workflow (5 parallel agents: A+D / C / F / B+E / adversarial)
verdict: **Charter v1.1 の 2/4 load-bearing claims が KILLED、2/4 が WEAKENED**。再批准 (charter v1.2) を W22 中に強制実施すべき。
---

# QS 90日 Deep Research Memo (2026-W22)

## Executive Summary

直近 90 日 (W10〜W22) は **Q-day pressure の本流化** と **競合の commercial 化** が同時進行した期間である。W21 baseline (2026-05-13 時点) が "PQC + AI agent custody は white space、AVS packaging で defensibility" と判定した core thesis は、**W22 (5/14〜6/1) の delta で 2 つの直接攻撃を受けた**:

1. **2026-05-22 — Apple corecrypto OSS release** (ML-KEM + ML-DSA 実装 + FIPS 203/204 形式証明を GitHub 公開)。PQC が「ブラックボックス信頼」から「再現可能な検証」フェーズに移行。QS の Dilithium 実装の差別化は **API/UX 層** に上がる必要がある。
2. **2026-05-26 — BitGo + Silence Laboratories** が「**規制下カストディアン初の post-quantum MPC トランザクション・シミュレーション**」を完了。Silence Labs PQ MPC (ML-DSA / FIPS 204 ベース) を BitGo 機関カストディに統合。**QS の "PQC on top of MPC" thesis を Coinbase より先に BitGo が先取り**。

加えて反証エージェントは charter v1.1 の Claim 2 (PQC × AI agent custody white space) と Claim 4 (Coinbase coexistence) を **KILLED**、Claim 1 (AVS packaging defensibility) と Claim 3 (24h timelock) を **WEAKENED** と判定した。Coinbase Agentic Wallets + x402 が既に 115M tx / 480K agents / $50M volume に到達し、Coinbase 自身が "advancing support for ML-DSA within MPC" と公式コミット。EigenLayer slashing は 2025-04-17 既に live で、8-17 日の withdrawal escrow が QS の 24h timelock と **double-charge** になる構造問題が浮上した。

QS にとっての一行: **6ヶ月で 5 回のフレーム転換に続く 6 回目の packaging 修正 (v1.2) が必要**だが、今度は buyer 検証データなしには動けない。W23 中に Fireblocks API team + BitGo + 韓国 KISA pilot ベンダー (Dream Security / KSmartech) への cold outreach を完走し、現実 (revenue / integration interest) で charter を上書きする。逆方向に伸びた Q-day signal (NIST FIPS 204/205 break, NIST workshop rollback) は **W22 期間で観測されず**、PQC general thesis は unchanged で安全。

---

## P0 Actions (即時 〜 2 週間, W22 残り 〜 W23 末)

| # | アクション | 根拠 | Falsifiable output | コスト |
|---|---|---|---|---|
| P0.1 | **BitGo + Silence Labs にcold outreach** — 「ML-DSA 単独 vs Dilithium+SPHINCS+ dual の operational benchmark を共同公開しないか」提案メール | 2026-05-26 BitGo first-mover (Silence Labs PQ MPC integration)、QS の dual NIST sig thesis の唯一の差別化が SPHINCS+ 並用 hash-based diversity | 返信 (yes / no / silence) を W23 金までに記録 | 2h founder, $0 |
| P0.2 | **Charter v1.2 ドラフト作成** — Claim 2 / Claim 4 killed を明示反映、Claim 1 / Claim 3 を opt-in クライアント側 policy に縮退 | 反証エージェント 4 claims のうち 2 killed、charter v1.1 (W21 7/7 批准) は W22 で実質失効 | `.claude/charter.md` v1.2 PR (founder review pending) | 4h founder |
| P0.3 | **EF ESP Proximity Prize + Poseidon Prize ($2M total) 応募経路を W23 中に submit** — Wave 20 採択リスト未公表、prize 経由が現実的 | EF ESP Q1 2026 allocation (2026-04-29) は ZK/PQC/Poseidon prize 中心、Wave 20 リストは W22 で未公開 | application submission ID 取得 | 15h founder |
| P0.4 | **IEEE S&P 2027 Cycle 1 submission 判断を W23 月 (6/8) までに決定** — abstract 登録 6/5、full paper 6/11 | QS Prover Pool + VRF + Dilithium/SPHINCS+ dual sig の整合性証明が論文 1 本の骨格として成立、PQC custody academic credibility 確立 | 6/5 abstract 登録 or skip 決定の commit (`docs/intelligence/strategy/ieee-sp-2027-cycle1-decision.md`) | 30h founder (submit case) / 0h (skip case) |
| P0.5 | **Apple corecrypto OSS を QS Dilithium 実装と cross-validation** — FIPS 204 適合性を `src/api/api/src/crypto/` の README に明記 | 2026-05-22 Apple corecrypto 公開で PQC が「再現可能な検証」フェーズに、QS の信頼担保に直結 | `docs/crypto/APPLE_CORECRYPTO_COMPATIBILITY.md` commit + cross-check log | 6h |

## P1 Actions (W23 〜 W25)

| # | アクション | 根拠 |
|---|---|---|
| P1.1 | **韓国 KISA pilot ベンダー (Dream Security / KSmartech / Mobilitus / Daeyoung S-Tek / KSign) に cold outreach** — 「QS の dual-sig AVS が KISA pilot framework に hook 可能か」 | W21 5/6 拡張で 5 sector (通信/金融/交通/防衛/宇宙) が確定、JP→KR 単独売り込みより leverage 大 |
| P1.2 | **JP 学術連携 outreach** — JST CREST 2026「量子・次世代暗号」領域に向け京大 / 東大 / NICT の PI に PoC 提案 | kota1026 単独応募不可、産業界連携枠での参画戦略 |
| P1.3 | **WHIR KoalaBear (<1.5M gas) を T2 benchmark に追加** — Observer Challenge sequence の SP1 proof on-chain verify を WHIR ベース PCS に移行する gas 比較 | ethresear.ch /24902 で WHIR Solidity 1.9M / <1.5M gas を確認、QS の gas estimation を半減できる可能性 |
| P1.4 | **SP1 + ML-DSA-65 標準化 benchmark suite を QS から公開** — PSE / 0xPARC / ZKnox に共著機会を開く | W22 で SP1 / RISC Zero / Jolt いずれにも ML-DSA-65 cycle 数字の公開資料なし、QS T1 spike (5/9 完了) が pre-empt 可能 |
| P1.5 | **EIP-8141 verifier contract 経由の plan B 準備** — ACDE #236/#237 で PQ 系 EIP (8051/8052/8141/7885) 議題に不在、Glamsterdam 採用は事実上消滅 | EIP-8141 `VERIFY frame` 経由なら protocol 改修なしで ML-DSA verifier deploy 可、Hegotá H2 2026 採用も不確実 |
| P1.6 | **Fireblocks API team への 2 周目 outreach** — W21 で 1 周目 cold email、W22 で BitGo first-mover が出た今、Fireblocks の paper→implementation gap を突く | Fireblocks "Standardizing MPC" は依然 paper レベル、threshold ML-DSA 具体実装は未発表 |

## P2 Actions (W26+)

| # | アクション | 根拠 |
|---|---|---|
| P2.1 | **防衛装備庁 R9 年度 安全保障技術研究推進制度 応募準備** — R8 締切 2026-05-20 (W22 内) は既に逸失、来年サイクル | PQC は対象テーマ、$50K-500K レンジ JP grant の現実候補 |
| P2.2 | **RWC 2027 (Real World Crypto, Seattle, 2026-11-16 deadline) submission 準備** | PQC custody academic 路線の 2nd choice、IEEE S&P が skip 判断時に |
| P2.3 | **WHIR / RoKoko (eprint 2026/575) / Cyclo (2026/359) / LatticeFold+ ℓ2-norm (2026/721) の QS Observer Challenge 適用評価** | lattice folding 新世代論文が W22 で出揃った、QS proof system 選定の re-evaluation |
| P2.4 | **Cloudflare ML-DSA origin (2026 mid 目標) と QS 監査トレース (API→L1) の TLS レイヤを ML-DSA 化 PoC** | 「業界 first の PQC end-to-end custody」narrative の論拠化、現実化時期は 2026-Q3 想定 |
| P2.5 | **threshold ML-DSA × QS Prover Pool の slashing 設計統合** — eprint 2026/814 (TSaaS), 2026/638 (THED), 2026/472 (side-channel) を QS Prover ノード HSM/TEE policy に反映 | Silence Labs commercial 化が示すように academic→commercial 移行が速い、QS が後追いになるリスク |

---

## 軸別 Findings (~ 400 words each)

### 軸A+D: Quantum HW + 標準/規制

**W22 で最も load-bearing な変化は US 公的セクターの "Q-day 投資の確定" である**:

- **2026-05-21 US DoC が 9 quantum companies と $2.013B LOI 署名** — IBM $1B, GlobalFoundries $375M, Atom/PsiQuantum/Quantinuum/Rigetti/D-Wave/Infleqtion 各 $100M, Diraq $38M。US gov は **minority equity** を取得。CHIPS Act 経由の単独最大 quantum 資本イベント。
- **2026-05-15 DOE Oak Ridge RFI (892431-26-RFI-0001)** — 「2028 までに 150-250 logical qubits、10⁵ hard gates、10⁻⁸ logical error rate」が US 公的 "useful FTQC" 基準として確定 (RFI 締切 2026-06-09)。Quantinuum 12 logical qubits (5/19) と Pasqal logical qubits beat physical (5/22) に対し、DOE 目標は **12-20× 上**を 2 年で要求。
- **W22 White House draft quantum EO 報道** (Nextgov/FCW、未署名) — 連邦 high-impact systems の **PQC 署名移行期限 2031-12-31**、契約者は **2030** 期限。OMB が実装ガイダンス担当、NSS は CNSA 2.0 で別扱い。これは **OMB M-23-02 successor の最初の concrete date**。
- **NIST IR 8214C Round-2 deadline 2026-05-18 (W22 内)** — submission list 未公表。NIST FIPS 206 (Falcon) は依然 IPD、final は 2026 後半〜2027 前半。
- **EU NIS2 Article 7(2)(k) (COM 2026/13 final, 2026-01-20)** は W22 で新規 Member State 公表なし。BaFin / JFSA / MAS は W22 quiet week。

**QS への impact**: charter v1.2 の threat-model 節は **DOE 150-250 logical qubits / 2028 benchmark を anchor** に書き換え、Google 2029 line は二次引用に格下げ。White House draft EO は **未署名 (Nextgov 単一ソース)** だが、もし署名されれば QS の US 連邦隣接 custody pitch に 2030-2031 procurement window を与える。Daily-plan に Nextgov + whitehouse.gov 監視を追加すべき。

### 軸C: 競合

**W22 の最大事件は BitGo + Silence Labs (2026-05-26) と Toshiba + Quantum Bridge (2026-05-21)**:

- **BitGo + Silence Laboratories** — Silence Labs PQ MPC (ML-DSA / FIPS 204 ベース) を **規制下カストディアンとして初**統合。Coinbase 2026末 "quantum-proof" コミットメントへの **direct 対抗手**。private industry event に Google / Stanford / Linux Foundation / 金融機関参加。
- **Toshiba Europe + Quantum Bridge** — QKD + PQC ハイブリッドのグローバル demo、衛星 QKD 拡張計画。
- **threshold ML-DSA が academic → commercial に W22 で transition** — Silence Labs PQ MPC が ML-DSA threshold を商用化、LoTRS (eprint 2026/974) / UC4Free! (2026/911) / Oriole (2026/793) が学術側で進展。Mithril / TALUS / Quorus / TSaaS は W22 で具体実装公表なし。
- **EigenLayer AVS landscape** — 190+ AVS partners (W21 280+ 表記から訂正)。**PQC native AVS は依然ゼロ**。AltLayer / Othentic / Lagrange / WitnessChain / EigenDA いずれも PQC を validation layer に組み込んでいない。**ただし AltLayer は実験的 PQC Ethereum client を構築中** で first-mover 競合可能性あり。
- **South Korea MSIT/KISA** (2026-05-06 拡張) — 5 sector pilot、ベンダー Dream Security / KSmartech / Mobilitus / Daeyoung S-Tek / KSign 確定。
- **QRL / SandboxAQ / PQShield / Anchorage / Komainu / Fireblocks** — W22 期間内の新規発表なし (cannot find evidence)。

**QS への impact**: BitGo がカストディ業界の "first PQ MPC simulation" を取った今、QS の差別化は (a) **Dilithium + SPHINCS+ dual sig (lattice + hash-based diversification)**、(b) **EigenLayer AVS としての operator-level economic guarantee**、(c) **非 US 機関 / 主権ドリブン segment** の 3 点に縮退。Charter v1.2 はこの 3 点を明示すべき。

### 軸F: 暗号技術

**W22 の最大の負シグナルは ACDE #236 (5/7) / #237 (5/21) で PQ EIP がゼロ言及**:

- **Glamsterdam devnet-4 起動 (ACDE #237, 5/21)** — Nethermind / Ethrex (EL) + Prysm / Lodestar / Lighthouse (CL)、Geth / Nimbus 次段。EIP-7904 (gas repricing) **撤回方向**、EIP-7928 (BAL) 修正、EIP-8037 cost_per_state_byte 確定。**PQ EIP (8051/8052/8141/7885) は議題に不在**。
- **EIP-8051 / 8052 / 7885 は Glamsterdam 不採用が事実上確定** — Hegotá (H2 2026) 採用も新規シグナルなし。EIP-8141 は CFI 維持、Hegotá 着地候補。Hegotá 提案締切は ACDE で「数週間〜1ヶ月前に告知」、依然開放。
- **SP1 Hypercube (16× RTX 5090)** が 99.7% L1 block を <12s で証明 — W21 既知の 10.3s 平均から精度更新。**SP1 / RISC Zero / Jolt 上の ML-DSA-65 cycle 公開資料は W22 で確認できず** (QS T1 spike が pre-empt 可能)。
- **Lattice folding 新世代** — eprint 2026/721 (LatticeFold+ ℓ2-norm checks)、2026/575 (RoKoko, 200KB / 100× faster than Greyhound)、2026/359 (Cyclo)、2026/242 (Neo/SuperNeo, W21 既知)。
- **WHIR over 31-bit KoalaBear** follow-up — 100 bit / 22 vars で **1.9M gas**、積極パラメータで **<1.5M gas**。
- **Threshold ML-DSA + side-channel 警告** — eprint 2026/814 (TSaaS, 1 online round)、2026/638 (THED, FHE base)、**2026/472 "Descent into Broken Trust"** (ML-DSA subkey recovery from 5,000-35,000 informative relations, 37-68× reduction)、**2026/056** (key recovery in ~300 traces on ARM Cortex-M4)。
- **Cloudflare ML-DSA origin** 2026 mid 目標再確認、2029 全製品 PQC。AWS KMS ML-KEM hybrid GA 中。
- **AA + PQ-sig** — Safe / Biconomy / ZeroDev / Pimlico / Stackup から W22 PoC announcement なし。EIP-7702 × ML-DSA も未発表。
- **liboqs** 0.16.0 で SPHINCS+ → SLH-DSA / Dilithium → ML-DSA 完全移行予定 (W22 内リリースなし)。

**QS への impact**: (1) EIP-8051 待ちは不確実、**EIP-8141 verifier contract plan B** が現実路線、(2) WHIR を T2 benchmark に追加、(3) ML-DSA side-channel 警告で QS Prover HSM/TEE policy を即時 hardening、(4) SP1 + ML-DSA-65 standardized benchmark を QS から公開する window が依然開いている。

### 軸B+E: 需要 + Grants/VC

**W22 最大の本物の delta は Apple corecrypto OSS (5/22) と PQC startup funding $24M+ in 1 week**:

- **Apple corecrypto OSS** (2026-05-22) — ML-KEM/ML-DSA 実装 + FIPS 203/204 形式証明 + tooling を GitHub 公開。iOS/iPadOS/macOS/tvOS/watchOS 26 で CryptoKit 経由開発者 API 化。
- **PQC startup $24M+ in W22**:
  - **Quantum Bridge Technologies** Series A $8M (累計 $16M)、リード Primo Capital SGR、2026-05-20。DSKE 対称鍵分散は QS Prover Pool 設計に近い ★★★
  - **Lastwall** Series A 拡張 $16M CAD、リード BDC Capital StrongNorth Fund (defense $300M vehicle)、2026-05-27 ★★
  - **Pramatra Space** pre-seed、2026-05-25、衛星通信主軸 ★
- **Cloudflare hybrid PQC TLS** human-generated traffic 60%+ (W21 末から W22 変動なし)。Apple PQ3 / Signal PQXDH W22 数値公表なし。
- **EF ESP Wave 20** 採択リスト W22 未公表。Q1 2026 allocation (4/29) は ZK/PQC/Poseidon prize 中心。**Proximity Prize $1M + Poseidon Prize $1M が現実的経路**。
- **JP grants**: 防衛装備庁 R8 締切 **2026-05-20 (W22 内、既に逸失)**。JST CREST 2026 量子・次世代暗号領域は PI レベル必須、kota1026 単独不可。NEDO ムーンショット目標6、JSPS 科研費 (秋公募) は変化なし。
- **JFSA / BoJ / MAS / BaFin** W22 quiet week (PQC 言及ゼロ)。
- **IEEE S&P 2027 Cycle 1 deadline 2026-06-11** (W23、abstract reg 6/5)。RWC 2027 deadline 2026-11-16。
- **VC**: a16z crypto Fund 5 $2.2B は 2026-05-05 (W21、W22 外)。SBI/Z Venture/Global Brain の W22 PQC 投資なし。SandboxAQ × PQShield M&A なし。

**QS への impact**: (1) Apple corecrypto を QS Dilithium 実装と cross-check (信頼担保)、(2) EF Prize 経由応募 (Wave ではなく)、(3) IEEE S&P 2027 Cycle 1 を W23 月までに submit/skip 判断、(4) JP 学術連携を W23-W25 で開始、(5) Quantum Bridge / Lastwall を competitor として `docs/intelligence/` に追加。

---

## Kill-Hazards (Charter v1.1 を否定する W22 動向)

| Claim | Status | Evidence (W22) |
|---|---|---|
| **1. AVS packaging defensibility** | **WEAKENED** | EigenLayer slashing 2025-04-17 既 live、8-17 日 withdrawal escrow が QS 24h timelock と double-charge。AltLayer が PQC client experiment 先行。Nebius/EigenAI $643M acquisition (2026-05) で EigenCloud は AI 推論にpivot 中、PQC primitive 方向の top-down 支援なし。190+ AVS のうち PQC native ゼロは継続だが、Othentic / AltLayer がいつでも埋められる。 |
| **2. PQC + AI agent custody white space** | **KILLED** | Coinbase Agentic Wallets + x402 が Feb 2026 launch、W22 時点 **115M tx / 480K agents / $50M volume**。Coinbase 公式が "advancing support for ML-DSA within MPC" コミット。Cobo Agentic Wallet (80+ chains) 並走。Ledger 2026 AI Security Roadmap で Q2 (W22 期間) に Skills + Agent Identity + CLI rollout。**prior-art window は閉じた**。 |
| **3. 24h timelock 正当化** | **WEAKENED** | SEC T+0 mandate なしで規制 kill は回避、しかし Fireblocks direct custody が "sub-custody is operationally inflexible … unable to enable organizations to execute business strategies at the high speed the market demands" と pitch。DTCC tokenization (H2 2026 pilot) は same-day settlement 前提。BIP-360 / EIP-8141 は timelock なしで quantum resistance を提供。AVS escrow と double-charge。**default 24h は institutional pitch では anti-feature**、opt-in cold-custody profile に縮退すべき。 |
| **4. Coinbase coexistence** | **KILLED** | Coinbase Custody Trust **$300B AUC** vs Fireblocks $10T 累計 tx (異なる metric)。Coinbase "The Standard in Crypto Custody" 公式ブランディング。**BlackRock 2026-05-18 $448M IBIT-linked transfer → Coinbase Prime**、5月単独 8,000+ BTC 追加。Brian Armstrong 個人で BIP-360 coalition (Block / TBD / Bitcoin Core) 主導。Coinbase 2026末 quantum-proof custody は **自社 in-house build with ML-DSA-in-MPC**。"integration partner remains" thesis は **US institutional segment では消滅**、非 US / long-tail のみ残存。 |
| **Q-day 逆方向シグナル** | **No signal — unchanged** | NIST FIPS 204/205 break、Apple/Cloudflare/Google rollback、major MPC vendor "PQC not necessary" 発言いずれも W22 で観測なし。Quantinuum 12 logical qubits + Pasqal logical qubits beat physical + US CHIPS $2B LOI で **加速方向のみ確認**。 |
| **NIST 脆弱性 / 標準後退** | **No signal — unchanged (implementation 警告のみ)** | eprint 2026/472, 2026/056 は ML-DSA **side-channel / fault-injection** 攻撃、FIPS 204 algorithmic break ではない。eprint 2026/632 は SLH-DSA tight security 解析で no break。**implementation hardening を QS HSM/TEE policy に即反映必要**だが thesis kill ではない。 |

**Net effect**: Charter v1.1 (W21 7/7 unanimous) の load-bearing 4 claims のうち **2 killed + 2 weakened**。再批准 (charter v1.2) は W22 中に必須。

---

## Open Questions (Founder 判断必要)

1. **Charter v1.2 で QS の positioning を 3 択のうちどれにする?**
   - (a) **Non-custodial PQC protocol layer / EigenLayer-native shared security primitive** for chains other than Coinbase's perimeter (Solana / Bitcoin L2 / Cosmos / Polkadot)
   - (b) **非 US / 主権ドリブン segment** にピボット (JP / KR / EU / 中東 ソブリン funds、Coinbase brand king が効かない領域)
   - (c) **24h timelock を default から opt-in cold-custody profile に縮退** + small-amount fast path で institutional pitch UX を立て直す
   - **Recommended**: (a) + (c) のハイブリッド、(b) を W23-W25 cold outreach で検証
2. **IEEE S&P 2027 Cycle 1 (6/11) submission を実施する?** — Cycle 2 (秋) でも可、ただし academic credibility が遅れる。30h founder 投入価値があるか。
3. **BitGo + Silence Labs に協業提案するか、direct competitor として扱うか?** — 協業なら QS の dual-sig narrative を BitGo に持ち込み joint paper、直接競合なら SPHINCS+ diversification を強化。
4. **Apple corecrypto OSS を QS Dilithium 実装の "reference"** として README / docs に明示するか? — 信頼担保には強い、ただし Apple-dependent narrative になる pros/cons。
5. **JP 学術連携 (JST CREST 2026)** で PI 候補は京大 (Sako)、東大 (Tanaka)、NICT (Yamada) のどこから始める?

---

## Cannot Find Evidence (W22 search blanks)

- NIST FIPS 206 final publication / IR 8547 final / IR 8214C Round-2 list (deadline 5/18 内)
- NSA CNSA 2.0 W22 追加 statement / White House quantum EO 署名 (draft のみ Nextgov 単一ソース)
- JFSA / BoJ / NCSB / NICT / METI / 防衛装備庁 / MAS / Hong Kong SFC / BaFin W22 PQC 文書
- Fireblocks / Anchorage / Komainu / Copper / Fidelity Digital Assets / BNY Mellon / State Street / Northern Trust W22 PQC ステートメント
- EF ESP Wave 20 採択リスト / OP RetroPGF Round 7 PQC 採択 / Gitcoin GG24 PQC pool
- SandboxAQ / PQShield M&A / W22 新リリース
- Mina / Aleo / Iron Fish / Aztec / Polygon zkEVM W22 PQC update
- IETF threshold-MLDSA draft 新規提出
- EigenLayer 新規 AVS launch (W22 ゼロ)
- 中国 BSN PQC 統合 / NTT / NEC / Fujitsu / Hitachi W22 PQC 製品
- SP1 / RISC Zero / Jolt 上の ML-DSA-65 cycle 公式 benchmark
- ZKnox ETHFALCON / ETHDILITHIUM / NTT W22 commits (GitHub UI 直近 2026-03-24)
- Apple PQ3 / Signal PQXDH W22 adoption metric
- Safe / Biconomy / ZeroDev / Pimlico / Stackup PQC roadmap
- ML-DSA 真の cryptographic aggregation (threshold ではない、BLS 型) 新規論文
- WebFetch は全 primary URL で HTTP 403 (W19/W21 と同じ制約)

---

## Sources

### 軸A+D (Quantum HW + 標準/規制)

[1] NIST DoC 9-company $2B LOI announcement (2026-05-21) — https://www.nist.gov/news-events/news/2026/05/department-commerce-announces-letters-intent-9-companies-2-billion
[2] The Quantum Insider DoC LOIs (2026-05-21) — https://thequantuminsider.com/2026/05/21/u-s-department-of-commerce-announces-letters-of-intent-with-9-companies-for-2-billion/
[3] Atom Computing $100M LOI (2026-05-21) — https://www.prnewswire.com/news-releases/atom-computing-announces-letter-of-intent-with-us-department-of-commerce-for-100-million-302779117.html
[4] PsiQuantum DoC LOI (2026-05-21) — https://www.psiquantum.com/news-import/us-department-of-commerce
[5] Pasqal logical qubits demo (2026-05-22) — https://www.pasqal.com/blog/a-landmark-first-solving-differential-equations-with-logical-neutral-atom-qubits/
[6] Quantinuum + Microsoft 12 logical qubits (2026-05-19) — https://www.quantinuum.com/blog/a-new-breakthrough-in-logical-quantum-computing-reveals-the-scale-of-our-industry-leadership
[7] Alice & Bob NVentures (2026-05-22) — https://thequantuminsider.com/2026/05/22/alice-bob-announces-investment-from-nvidias-vc-arm-in-series-b-extension/
[8] France €1.55B quantum + semi (2026-05-25) — https://thequantuminsider.com/2026/05/25/emmanuel-macron-announces-1-55-billion-euros-more-for-quantum-and-semiconductors/
[9] Origin Wukong-180 (2026-05-09) — https://thequbitreport.com/hardware/2026/05/09/chinas-origin-quantum-launches-origin-wukong-180/
[10] DOE Oak Ridge RFI 892431-26-RFI-0001 (2026-05-15) — https://quantumcomputingreport.com/u-s-department-of-energy-issues-rfi-for-2028-fault-tolerant-quantum-computer/
[11] White House draft quantum EO (Nextgov/FCW 2026-05) — https://www.nextgov.com/cybersecurity/2026/05/draft-executive-order-would-set-deadlines-digital-signature-and-key-quantum-encryption/413668/
[12] NIST CSRC IR 8214C threshold — https://csrc.nist.gov/Projects/threshold-cryptography/tcall-1
[13] NIST CSRC IR 8547 ipd — https://csrc.nist.gov/pubs/ir/8547/ipd
[14] DigiCert FIPS 206 — https://www.digicert.com/blog/quantum-ready-fndsa-nears-draft-approval-from-nist
[15] SafeLogic FIPS 140-2 → 140-3 (2026-09-21) — https://www.safelogic.com/blog/what-happens-on-september-21-2026
[16] IETF LAMPS pq-composite-sigs v19 — https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-sigs/
[17] IETF CFRG hybrid-kems v10 — https://datatracker.ietf.org/doc/draft-irtf-cfrg-hybrid-kems/

### 軸C (競合)

[18] BitGo + Silence Labs PQ MPC simulation (2026-05-26) — https://crypto.news/bitgo-tests-quantum-safe-mpc-wallet-signing-with-silence-labs/
[19] Silence Laboratories PQ MPC — https://silencelaboratories.com/post-quantum-mpc
[20] Toshiba + Quantum Bridge QKD-PQC (2026-05-21) — https://thequantuminsider.com/2026/05/21/toshiba-quantum-bridge-global-quantum-safe-networking/
[21] South Korea KISA pilot expansion (2026-05-06) — https://thequantuminsider.com/2026/05/06/korea-expands-post-quantum-cryptography-pilot/
[22] eprint 2026/974 LoTRS — https://eprint.iacr.org/2026/974
[23] eprint 2026/911 UC4Free! — https://eprint.iacr.org/2026/911
[24] eprint 2026/793 Oriole — https://eprint.iacr.org/2026/793
[25] EigenLayer slashing live (2025-04-17) — https://blog.eigencloud.xyz/slashing-goes-live/
[26] EigenLayer 190 AVS partners — https://www.crypto-reporter.com/press-releases/eigenlayer-completes-protocol-launches-slashing-for-ecosystem-of-190-avs-partners-95816/
[27] AltLayer updates (PQC client experiment) — https://www.altlayer.io/updates
[28] liboqs releases — https://github.com/open-quantum-safe/liboqs/releases
[29] QRL Project Zond — https://qrlhub.com/en/zond

### 軸F (暗号技術)

[30] ACDE #237 summary (Christine Kim, 2026-05-21) — https://christinedkim.substack.com/p/acde-237
[31] ACDE #236 agenda (2026-05-07) — https://github.com/ethereum/pm/issues/2033
[32] EIP-8141 Frame Transaction — https://eips.ethereum.org/EIPS/eip-8141
[33] EIP-8051 ML-DSA precompile — https://eips.ethereum.org/EIPS/eip-8051
[34] EIP-7885 NTT precompile — https://eips.ethereum.org/EIPS/eip-7885
[35] WHIR over KoalaBear (ethresear.ch) — https://ethresear.ch/t/evm-verification-of-whir-over-a-31-bit-field/24902
[36] WHIR Solidity 1.9M/<1.5M gas (HackMD) — https://hackmd.io/@clientsideproving/pq-snark-verifier
[37] eprint 2026/721 LatticeFold+ ℓ2-norm — https://eprint.iacr.org/2026/721
[38] eprint 2026/575 RoKoko — https://eprint.iacr.org/2026/575
[39] eprint 2026/359 Cyclo — https://eprint.iacr.org/2026/359
[40] eprint 2026/814 Threshold ML-DSA-as-a-Service — https://eprint.iacr.org/2026/814
[41] eprint 2026/638 THED — https://eprint.iacr.org/2026/638
[42] eprint 2026/472 ML-DSA subkey leakage — https://eprint.iacr.org/2026/472
[43] eprint 2026/056 ML-DSA Cortex-M4 side-channel — https://eprint.iacr.org/2026/056
[44] eprint 2026/632 SLH-DSA tight security — https://eprint.iacr.org/2026/632
[45] SP1 Hypercube — https://blog.succinct.xyz/sp1-hypercube/
[46] Cloudflare PQC roadmap (2029) — https://blog.cloudflare.com/post-quantum-roadmap/
[47] Cloudflare ML-DSA origin — https://blog.cloudflare.com/post-quantum-to-origins/
[48] EF Post-Quantum Hub — https://pq.ethereum.org/

### 軸B+E (需要 + Grants/VC)

[49] Apple corecrypto OSS (Help Net Security, 2026-05-27) — https://www.helpnetsecurity.com/2026/05/27/apple-quantum-resistant-encryption-open-source/
[50] Apple PQC code on GitHub (9to5Mac, 2026-05-22) — https://9to5mac.com/2026/05/22/apple-shares-iphone-and-mac-post-quantum-cryptography-code-on-github/
[51] Quantum Bridge $8M Series A (2026-05-20) — https://thequantuminsider.com/2026/05/20/quantum-bridge-secures-8-million-to-fortify-global-networks-against-quantum-threats/
[52] Lastwall $16M Series A extension (2026-05-27) — https://www.lastwall.com/post/lastwall-raises-16m
[53] Pramatra Space pre-seed (2026-05-25) — https://thequantuminsider.com/2026/05/25/quantum-security-venture-pramatra-space-raises-pre-seed-funding/
[54] AWS KMS ML-KEM hybrid — https://aws.amazon.com/blogs/security/ml-kem-post-quantum-tls-now-supported-in-aws-kms-acm-and-secrets-manager/
[55] EF Q1 2026 Allocation — https://blog.ethereum.org/2026/04/29/allocation-q1-26
[56] IEEE S&P 2027 Cycle 1 CFP — https://cycle1.sp2027.ieee-security.org/
[57] 防衛装備庁 安全保障技術研究推進制度 — https://www.mod.go.jp/atla/funding.html
[58] JST CREST 2026 — https://www.jst.go.jp/kisoken/boshuu/teian/koubo/2026youkou.pdf

### Adversarial / Charter kill-evidence

[59] Coinbase "The Standard in Crypto Custody" — https://www.coinbase.com/blog/coinbase-the-standard-in-crypto-custody
[60] Coinbase Agentic Wallets ML-DSA-in-MPC (Quantum Insider 2026-04-25) — https://thequantuminsider.com/2026/04/25/coinbase-advisers-warn-quantum-computing-will-crack-blockchain-encryption-and-the-window-to-prepare-is-narrowing/
[61] Coinbase Agentic Wallets launch (PYMNTS) — https://www.pymnts.com/cryptocurrency/2026/coinbase-debuts-crypto-wallet-infrastructure-for-ai-agents/
[62] x402 115M+ tx (KuCoin) — https://www.kucoin.com/news/flash/x402-protocol-enables-ai-agents-to-make-autonomous-payments-processing-over-115m-transactions
[63] Cobo Agentic Wallet 80+ chains — https://phemex.com/news/article/cobo-unveils-ai-agent-wallet-supporting-80-blockchains-74431
[64] Ledger 2026 AI Security Roadmap (The Block) — https://www.theblock.co/post/397284/crypto-ledger-ai-security-roadmap-agentic-economy-human-loop
[65] Fireblocks direct custody pitch — https://www.fireblocks.com/report/why-direct-custody-is-the-future-for-financial-institutions
[66] BlackRock $448M Coinbase Prime (2026-05-18, CryptoRank) — https://cryptorank.io/news/feed/91e1f-blackrock-bitcoin-deposit-coinbase-prime-3
[67] Brian Armstrong BIP-360 coalition — https://thequantuminsider.com/2026/04/03/coinbase-ceo-addresses-quantum-threat-to-cryptocurrencies/
[68] EigenLayer 8-17 day withdrawal escrow — https://docs.eigencloud.xyz/products/eigenlayer/restakers/concepts/native-restaking-withdrawal-delays
[69] EigenLayer centralization risk (Blockworks) — https://blockworks.co/news/eigenlayer-at-risk-of-centralization
[70] Nebius/EigenAI $643M acquisition (May 2026) — https://coinmarketcap.com/cmc-ai/eigencloud/latest-updates/
[71] DTCC tokenization H2 2026 same-day settlement — https://www.timesofblockchain.com/news/dtcc-tokenization-launch-2026/
[72] BIP-360 Winternitz (Datawallet) — https://www.datawallet.com/crypto/bip-360-explained
[73] Vitalik Ethereum quantum roadmap (CoinDesk 2026-02-26) — https://www.coindesk.com/tech/2026/02/26/vitalik-buterin-unveils-ethereum-roadmap-to-counter-quantum-computing-threat
[74] Three Q-day papers (Quantum Insider 2026-03-31) — https://thequantuminsider.com/2026/03/31/q-day-just-got-closer-three-papers-in-three-months-are-rewriting-the-quantum-threat-timeline/

**Total: 74 cited sources, all WebSearch summary (WebFetch HTTP 403 on every primary URL — same constraint as W19/W21)**

---

## Founder Verification Checklist (本メモ専用)

External claim / strategy meeting に使う前に:

1. **BitGo + Silence Labs (2026-05-26)** の primary source (BusinessWire 403、crypto.news で確認) を直接読み、Silence Labs PQ MPC が **真に ML-DSA / FIPS 204 ベース** か (announce text に明示されているか) を確認
2. **White House draft quantum EO** の Nextgov 単一ソースは要 cross-check — whitehouse.gov / OMB / OSTP 直接観測
3. **Apple corecrypto GitHub repo** を直接訪問、ML-DSA 実装の license (Apple Public Source License vs Apache) を確認 — QS が "Apple corecrypto compatibility" を主張する pre-condition
4. **Coinbase "advancing ML-DSA within MPC" commitment** の原典 (Quantum Council 51-page paper) PDF を直接読む — 公約か aspirational か
5. **EigenLayer slashing 8-17 日 withdrawal escrow** の具体的数値を EigenCloud docs で確認 (QS 24h timelock との double-charge 主張の根拠)
6. **EF ESP Proximity Prize / Poseidon Prize** の application portal を直接訪問、deadline + scope が QS dual-sig に該当するか
7. **IEEE S&P 2027 Cycle 1** site (cycle1.sp2027.ieee-security.org) で abstract registration 2026-06-05 / paper deadline 2026-06-11 を確認
8. **CLAUDE.md / docs 全体で "Hegotia" → "Hegotá" 表記置換** が完了しているか grep (W21 で残 4 箇所)
9. **`.claude/charter.md` v1.1** を v1.2 にバンプし、Claim 2 / Claim 4 killed、Claim 1 / Claim 3 weakened を反映 (P0.2)

---

**End of memo. ~1,800 words main body, 74 sources, 5 founder open questions.**
