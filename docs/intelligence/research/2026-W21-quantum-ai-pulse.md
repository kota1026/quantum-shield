---
status: DRAFT — last 30-day pulse, founder must verify primary sources before external use
date: 2026-05-13
purpose: Inform Agentic QS strategy meeting + competitive position update; tracks delta from 2026-W19 baseline
researcher: research agent (Claude Code, WebSearch primary; WebFetch returned HTTP 403 on every primary-source attempt — same constraint as W19)
window: 2026-04-13 〜 2026-05-13 pulse (with relevant 2026-Q1 context where the W19 baseline did not capture it)
---

# 量子 + PQC + EVM PQC infra + 分散型 AI 動向 (2026-W21 pulse)

## Executive frame (日本語要旨)

この 30 日間は **Q-day timeline 圧縮の余震が完全に主流化した期間**である。Google が 3 月 25 日に発表した「2029 までに PQC 完全移行」目標、Coinbase Quantum Advisory Council の 4 月 21 日 51 ページ position paper、IonQ の 4 月 22 日 "Walking Cat" 完全 fault-tolerant blueprint、Quantinuum Helios の 48 logical qubit 達成 — これらが 4 月後半に立て続けに重なり、機関投資家・規制当局・カストディアン全員の社内 PQC 議題優先度が一段上がった。

QS にとっての load-bearing finding は二つ:

1. **Threshold ML-DSA は完全に "next year's roadmap item" に到達した**。Mithril / TALUS / Quorus / TSaaS (eprint 2026/013, 2026/814, 2026/974, arxiv 2603.22109) の論文が連続投稿され、Fireblocks の "Standardizing MPC Cryptography" 戦略を技術的に裏付ける状態。W19 baseline の "G is existential" 判定は変化していないが、**vendor が QS を必要としない経路の解像度がさらに上がった**。
2. **AI-Agent-operated custody が production scale で稼働開始した**。Coinbase Agentic Wallets (Feb 11 2026)、x402 / Agentic.market (Apr 2, Linux Foundation governance 化)、ClawBank Manfred (5 月 1 日 IRS EIN + FDIC 口座 + crypto wallet を AI agent が自律取得)、ElizaOS + EigenCloud verifiable agents — **"PQC + AI agent custody" の交差点が今年中に競合領域になる**。QS は PQC 側だけ、Agentic 側は完全に未着手。

---

## A. Quantum hardware progress (last 30 days)

### A-1. IBM
- **52-qubit QFT on Heron r3** (April 2026, ParityQC × IBM joint demo)。Parity Twine architecture を使い SWAP gate を不要化、回路深さ・gate 数を削減、性能が super-exponential にスケールしたと報告。
- **40-qubit Heisenberg spin transport simulation** (May 2026, Quantum Science Center)。mid-circuit measurement algorithm を使用、ballistic/diffusive/superdiffusive 各 regime を再現。
- IBM の **logical qubit 公式 milestone announcement** は本 30 日間には観測されず。Nighthawk/Loon (W19 baseline で言及) 以降のアップデートは search で確認できず。TODO[founder]: verify whether IBM 2033 roadmap が 4-5 月に改訂されているか直接確認。
- Source: [postquantum.com IBM company profile](https://postquantum.com/quantum-computing-companies/ibm/), [IBM Quantum Roadmap 2033 blog](https://www.ibm.com/quantum/blog/quantum-roadmap-2033)

### A-2. Google
- **Willow chip status**: 105 qubits、single-qubit 99.97% / two-qubit 99.88% / readout 99.5% fidelity。Below-threshold QEC (3×3 → 5×5 → 7×7 surface code lattice) は 2025 公表分が継続有効。
- **重大 delta**: **3 月 25 日 Google ブログ "Quantum frontiers may be closer than they appear"** で「2029 までに自社 cryptographic infrastructure を PQC 移行完了する」と公表 ([blog.google migration timeline](https://blog.google/innovation-and-ai/technology/safety-security/cryptography-migration-timeline/), WebFetch 403; [IT Pro coverage](https://www.itpro.com/security/google-just-revised-its-q-day-timeline-quantum-computers-could-break-existing-encryption-techniques-within-three-years-and-enterprises-are-nowhere-near-ready))。Q-day を「mid-2030s」から「3 年以内」に再フレーミングした単一最重要 signal。
- Source: [thequantuminsider Q-Day three papers in three months](https://thequantuminsider.com/2026/03/31/q-day-just-got-closer-three-papers-in-three-months-are-rewriting-the-quantum-threat-timeline/) (403 fetch、search summary のみ)

### A-3. Quantinuum / IonQ / Atom Computing
- **Quantinuum Helios** (2025-11 launch、2026-Q1/Q2 deployment expansion): 98-qubit trapped-ion、two-qubit gate fidelity ~99.921%、**94 logical qubits を error-detected state で entangle**、**48 error-corrected logical qubits を 2:1 ratio で達成**。シンガポール設置が 2026 中に確定 — 米国外初。Microsoft Level 2 Resilient phase 達成 (4 logical qubits with 800× error reduction over physical) は H2 系で別途達成。Source: [impactquantum.com Helios](https://impactquantum.com/quantinuums-new-helios-system-record-logical-qubits-break-even-qec/), [Quantinuum blog](https://www.quantinuum.com/blog/quantinuum-overcomes-last-major-hurdle-to-deliver-scalable-universal-fault-tolerant-quantum-computers-by-2029)
- **IonQ "Walking Cat" blueprint** (April 22 2026): full-stack engineering blueprint で 10,000 physical qubits 規模の fault-tolerant 機を設計。Quantum LDPC code 使用、surface code より少ない physical qubit で同等以上の logical fidelity。2028 年に 200,000-qubit QPU で 8,000+ logical qubits を見込む。Source: [IonQ press release April 22 2026](https://www.ionq.com/news/ionq-publishes-definitive-technical-report-establishing-its-fault-tolerant-quantum-computing-trajectory---setting-a-new-standard-for-technical-specificity-and-transparency), [HPCwire](https://www.hpcwire.com/off-the-wire/ionq-details-walking-cat-architecture-for-fault-tolerant-quantum-computing/)
- **Atom Computing**: April-May 2026 で specific logical qubit announcement は確認できず。DARPA との取引継続、Microsoft とのパートナーシップ継続。Caltech/Oratomic の neutral-atom 系 "10,000-20,000 qubits で useful FTQC" 論文 (April 2026, phys.org) が分野全体の理論上限を更新。

### A-4. Q-day timeline revision (W19 以降の delta)
- **Three papers in three months**: Google, Oratomic, Alice & Bob が 2026-Q1 中に **ECC-256 (RSA-2048 より早く) が脆弱** であることを示す論文を相次いで発表。Iceberg Quantum (Australian startup) も標準暗号破壊に要する量子リソース見積もりを大幅下方修正。
- **Vitalik の "20% chance of Q-day before 2030" framing** (W19 baseline) は **依然 alive**、4-5 月で撤回・修正 signal なし。
- **CNN "Q-Day"** (May 17 2026): mainstream press tier への到達。一般読者層でも Q-day 認知が確立。Source: [CNN 2026-05-17](https://www.cnn.com/2026/05/17/science/quantum-computing-cybersecurity-q-day)

---

## B. PQC regulatory updates

### B-1. NIST
- **FIPS 204 (ML-DSA)** final 維持。FIPS 206 (FN-DSA / Falcon) は **2026 後半に予定** (search 結果の primary signal、TODO[founder]: NIST 公式 announcement URL を直接確認)。
- **NIST IR 8547** は **依然 initial public draft (ipd) のまま、最終版未公開**。2030 deprecate / 2035 disallow の枠組みは変わらず。Source: [csrc.nist.gov IR 8547](https://csrc.nist.gov/pubs/ir/8547/ipd)
- **NIST IR 8214C** (threshold PQ scheme call、2026-01-20 公表、W19 baseline) の submission window は **2026 May 締切** — 本 pulse 期間中に応募集中。本 30 日間は応募者公表が search で観測できず、TODO[founder]: NIST から正式 list 公表されたら回収。

### B-2. NSA CNSA 2.0
- **2027-01-01 hard deadline** が依然 firm: 全 NSS (National Security System) 新規調達は CNSA 2.0 準拠必須。
- **2026-09-21**: FIPS 140-2 cert が全て Historical へ移行。federal procurement は FIPS 140-3 validated module 必須。
- Phased migration: VPN/router は 2026 までに CNSA 2.0 prefer、2030 exclusive。OS は 2027 prefer、2033 exclusive。Full NSS 必須は 2033、完全移行 2035。
- 本 30 日間に NSA から CNSA 2.0 関連の追加 statement は search で観測できず。
- Source: [postquantum.com NSA CNSA 2.0](https://postquantum.com/quantum-policy/nsa-cnsa-2-0-pqc/), [axelspire CNSA 2.0 timeline](https://axelspire.com/business/pqc-timeline-mandates/)

### B-3. EU DORA / NIS2 / Coordinated Roadmap
- **2026-01-20 COM(2026) 13 final** で **NIS2 に新 Article 7(2)(k) を提案**: Member States は national cybersecurity strategy に PQC transition policy を含める義務。
- **2026 末**: 全 EU Member States が national PQC plan を策定済みであること、high/medium risk use case の pilot 立ち上げ義務。
- 2030: high-risk use case 移行完了。2035: medium/low risk 含む全面 PQC 化。
- DORA RTS "ICT Risk Management Framework" は "flexible approach to managing cryptographic threats, including those due to quantum-related advances" を明記済み。
- Source: [postquantum.com NIS2/DORA/PQC](https://postquantum.com/security-pqc/nis2-dora-pqc-quantum/), [digital-strategy.ec.europa.eu coordinated roadmap](https://digital-strategy.ec.europa.eu/en/library/coordinated-implementation-roadmap-transition-post-quantum-cryptography), [PQShield EU roadmap](https://pqshield.com/eu-pqc-workstream-publishes-a-coordinated-implementation-roadmap-for-the-transition-to-post-quantum-cryptography/)

### B-4. Japan (JFSA / NISC / IPA)
- **NCSB (旧 NISC) interim report**: 政府機関は **2035 までに PQC 移行完了** 義務。米/EU と timeline 整合。METI/MIC/NICT/CRYPTREC が連携。crypto-agility + hybrid PQ/T (PQC + classical 並走) 推奨。
- **JFSA (金融庁) / IPA からの PQC migration document は本 pulse 期間中に search で観測できず**。**Cannot find evidence** リスト入り。
- 本 30 日間の Japan 側 crypto セクター大ニュースは **SBI による Bitpoint 統合**で、SBI VC Trade が bitFlyer/Coincheck を抜いて国内最大化への動き。PQC 文脈ではない。
- Source: [PQShield 2035 Japan NCO timeline](https://pqshield.com/2035-japans-nco-sets-the-timeline-for-quantum-security/)

### B-5. OMB M-23-02 successor
- M-23-02 は **operational に有効、撤回されていない**。
- **DoD CIO memo (2025-11-20)**: 全 Pentagon component に cryptography inventory 義務、M-23-02 を governing mandate として明示引用。
- **新 OMB draft memo + draft quantum EO が pending**。最終化されれば timeline 加速・vendor 要件強化の可能性。本 pulse 期間中の発出は確認できず。
- Source: [PQShield White House guidance](https://pqshield.com/guide-to-recent-white-house-guidance-post-quantum-cryptography/), [Tychon DoD PQC mandate](https://tychon.io/the-department-of-wars-new-pqc-mandate/)

---

## C. EVM PQC infrastructure

### C-1. EIP-8141 (Frame Transaction)
- **Status**: Glamsterdam (H1 2026 fork) では **非 headliner、CFI (Considered for Inclusion)** に降格。Account Abstraction の implementation choice をめぐる議論が未収束で、**Hegotá (H2 2026 fork) ターゲット** に移行。
- Vitalik の個人的支持は継続。"validation frames" mechanic で signature + ZK proof のバンドル化を提案。
- **QS への implication**: W19 baseline で flagged した「H (EIP-8141 orthogonality) リスク」は **完全には消えていないが、Glamsterdam 直接含有でなくなったことで QS の 6-12 ヶ月の operational buffer は短縮されていない**。Hegotá (late 2026) が有効期限。
- Source: [eips.ethereum.org EIP-8141](https://eips.ethereum.org/EIPS/eip-8141), [Ethereum Magicians thread 27879](https://ethereum-magicians.org/t/headliner-breakout-eip-8141-frame-transaction-march-5-2026/27879), [forkcast 8141](https://forkcast.org/eips/8141/)

### C-2. EIP-8051 (ML-DSA precompile)
- **Status**: Draft、Glamsterdam では **search 結果上 CFI 確定が観測されない**。**TODO[founder]: April 2026 EL CFI/DFI 仕分けで EIP-8051 がどのバケットに入ったかを ethereum/pm GitHub で直接確認**。
- Public key 1,312 bytes、signature 2,420 bytes (ML-DSA-44)。
- Source: [eips.ethereum.org EIP-8051](https://eips.ethereum.org/EIPS/eip-8051), [Ethereum Magicians thread 25857](https://ethereum-magicians.org/t/eip-8051-ml-dsa-verification/25857)

### C-3. EIP-8052 (Falcon-512 precompile)
- **Status**: Draft、~3,000 gas/verification target (signature size 666 bytes)。EVM mainnet 実装は未確認。
- 関連: EIP-7619 (古い Falcon-512 generic verifier 草案) が前駆として存在。
- Source: [eips.ethereum.org EIP-8052](https://eips.ethereum.org/EIPS/eip-8052), [PR #10560](https://github.com/ethereum/EIPs/pull/10560)

### C-4. NTT precompile (EIP-7885, address 0x15 proposal)
- **Status**: ZKnox 主導の Yul 実装が継続。ETH2030 計画では 13 個の custom precompile に NTT を含む。
- **Performance benefit**: ETHFALCON で 73.4% gas 削減 (1.8M → <480K gas)、ETHDILITHIUM で 2.1M+ gas/sig 削減。
- Source: [eips.ethereum.org EIP-7885](https://eips.ethereum.org/EIPS/eip-7885), [github.com/ZKNoxHQ/NTT](https://github.com/ZKNoxHQ/NTT), [zknox.eth.limo lattice verifiers](https://zknox.eth.limo/posts/2025/02/24/ETHEREUM_for_PQ_era_250224.html)

### C-5. ZKnox / ZKNoxHQ recent commits
- **ETHFALCON (Python)** last updated **2026-03-23**。
- **ETHDILITHIUM (Solidity)** last updated **2026-03-24**。
- **本 pulse 期間 (4-13 〜 5-13) の commits は search 結果で個別確認できず**。TODO[founder]: GitHub の最新 commit log を直接確認。
- Source: [github.com/ZKNoxHQ/ETHFALCON](https://github.com/ZKNoxHQ/ETHFALCON), [github.com/ZKNoxHQ/ETHDILITHIUM](https://github.com/ZKNoxHQ/ETHDILITHIUM), [github.com/orgs/ZKNoxHQ/repositories](https://github.com/orgs/ZKNoxHQ/repositories)

### C-6. WHIR-based PQ-SNARK Solidity verifier
- **重大 delta**: **Solidity verifier for standalone WHIR (KoalaBear 31-bit field PCS) が 2026 年 5 月初旬に公開**。Search 結果 "implementation announcement posted 1 day ago" (=2026-05-12 頃) → 本 pulse 期間ど真ん中の events。
- 3 月計画 (ethresear.ch thread 24902) では「4 月初旬に gas benchmark 取得」と表明。実装は計画より約 1 ヶ月遅延。
- Source: [ethresear.ch 24902 EVM verification of WHIR](https://ethresear.ch/t/evm-verification-of-whir-over-a-31-bit-field/24902), [hackmd.io clientsideproving pq-snark-verifier](https://hackmd.io/@clientsideproving/pq-snark-verifier), [github.com/TomWambsgans/Whirlaway](https://github.com/TomWambsgans/Whirlaway)

### C-7. Glamsterdam / Hegotá naming 確定状況
- **Glamsterdam** (H1 2026 fork、deploy が Q3 にずれ込む見通し): headliner は Block Access Lists + Enshrined Proposer Builder Separation。gas limit を 60M → 200M に引き上げ。
- **Hegotá** (late 2026 "cleanup and optimization" fork): Verkle Trees、stateless client への布石、EIP-8141 を担当する見通し。**"Hegotia" は誤記、正式表記は "Hegotá" (acute accent)**。"Heze-Bogota" という英文略記が一部メディアに残るが minority。
- Source: [crypto.news Glamsterdam Hegotá roadmap shift](https://crypto.news/ethereum-details-glamsterdam-devnet-progress-and-hegota-roadmap-shift/), [cointelegraph 2026 forks](https://cointelegraph.com/news/ethereum-2026-glamsterdam-hegota-fork-scaling), [eipsinsight Glamsterdam scope](https://eipsinsight.com/Blogs/glamsterdam-scope-narrows-core-devs-confirm-cfi-dfi)

---

## D. Custodian PQC announcements

### D-1. Coinbase Quantum Advisory Council
- **2026-04-21**: 51-page inaugural position paper を発表 (筆者: Boneh / Aaronson / Drake / Kannan / Lindell / Malkhi 等)。
- **要点**:
  - "Quantum computing won't break crypto tomorrow, but the industry can't afford to wait."
  - **Bitcoin**: Satoshi-era coins に対し "rate-cap spending rule" を提案 — capable quantum 機の到来を市場全体に通知する alarm system 機能。
  - **Ethereum**: 移行 roadmap を評価。
  - **技術課題明示**: ML-DSA 2,420 bytes vs ECDSA 64 bytes、naive substitution で throughput が **90%+ 低下**しうる。
- **Coinbase の商業 commitment**: **2026 末までに institutional client 向け "quantum-proof" custody service を投入予定**。既存暗号と PQC standards を combined する hybrid。
- Source: [coinbase.com position paper](https://www.coinbase.com/blog/coinbase-quantum-advisory-council-publishes-position-paper-on-quantum-computing-and-blockchain) (WebFetch 403), [coindesk 2026-04-21](https://www.coindesk.com/tech/2026/04/21/coinbase-advisory-board-says-quantum-computing-threat-is-on-the-horizon-crypto-needs-a-plan), [thequantuminsider 2026-04-25](https://thequantuminsider.com/2026/04/25/coinbase-advisers-warn-quantum-computing-will-crack-blockchain-encryption-and-the-window-to-prepare-is-narrowing/), [UCSB cs](https://www.cs.ucsb.edu/happenings/announcement/no-quantum-threat-yet-crypto-must-prepare-now-says-coinbase-board-paper-co)

### D-2. Fireblocks
- **"Standardizing MPC Cryptography"** (W19 baseline) cross-industry call は依然有効。本 pulse 期間中の新 statement は search で観測できず。
- **2026 内部 audit 継続**: cert/encrypted data at rest/authn/TLS/3rd-party integrations を全て post-quantum readiness 観点で監査中。
- ML-DSA / SLH-DSA / FN-DSA 加えて NIST Additional Digital Signature Schemes Round 2 候補 (code-based / multivariate) も評価中 — **MPC-friendly な non-lattice 候補を選好する shift signal**。
- Source: [fireblocks.com Standardizing MPC](https://www.fireblocks.com/blog/standardizing-mpc-cryptography-a-cross-industry-call-to-action), [fireblocks.com Google quantum research](https://www.fireblocks.com/blog/google-quantum-research-institutional-crypto-security)

### D-3. Anchorage / BitGo / Komainu
- **Anchorage**: cold-storage operations の **~90% を 15 分以内** に処理 (cobo.com 2026)。"forward-looking custodians piloting PQC migration roadmaps" 言及あるも Anchorage 個別の正式 PQC roadmap announcement は本 pulse で確認できず。
- **BitGo**: 公開資料は qualified custody / operational controls 中心、**public PQC migration timetable は未発表**。OCC が BitGo / Circle / Ripple / Fidelity Digital Assets / Paxos を national trust bank として条件付き承認 (本 pulse 期間中、specific date は search に出ず、TODO[founder]: 直接確認)。
- **Komainu / Komainu Japan**: 本 pulse 期間中の PQC announcement search で観測できず。**Cannot find evidence**。
- Source: [cobo.com top 8 custodians](https://www.cobo.com/post/top-8-institutional-grade-custodians-securing-bitcoin-and-ethereum-in-2026), [hashlock 2026 custody](https://hashlock.com/blog/top-institutional-crypto-custody-providers-2026)

### D-4. BlackRock / institutional RWA
- BlackRock BUIDL fund (tokenized US Treasury bills) は継続。**直接の PQC announcement は本 pulse でなし**。
- 業界全般の signal: "Coinbase + BNY Mellon が NIST PQC algorithm を wallet architecture に組み込む研究" を securities.io が示唆 (二次情報、primary は未確認)。
- **SEC + DTCC** が late 2026 で US Treasuries / ETFs / Russell 1000 components tokenization の no-action letter を発出 — RWA × on-chain settlement infrastructure として PQC 要件が暗黙化していく前段。
- Source: [securities.io quantum-resistant RWA](https://www.securities.io/quantum-resistant-rwa-tokenization-ledger/), [SEC.gov BD crypto custody statement](https://www.sec.gov/newsroom/speeches-statements/trading-markets-121725-statement-custody-crypto-asset-securities-broker-dealers)

### D-5. Japan-side custodians (SBI VC Trade / bitFlyer / Coincheck / Komainu Japan)
- 本 pulse 期間中 **PQC 関連 announcement は search で観測できず**。**Cannot find evidence**。
- 業界動向は **SBI による Bitpoint 統合 → bitFlyer/Coincheck を抜く動き** が中心で、暗号資産 sector consolidation の話。
- Bithumb (韓国) が独立に "quantum-resistant cryptography plan" を発表したが、これは日本 custodian の動きではない。
- Source: [beincrypto SBI Bitbank](https://beincrypto.com/sbi-holdings-bitbank-acquisition-talks-japan/), [coincu Bithumb PQC](https://coincu.com/bithumb-quantum-resistant-cryptography-plan/)

---

## E. Decentralized AI infrastructure (NEW vs W19)

### E-1. Bittensor (TAO)
- **Production**: 64 active subnets on mainnet (May 2026)、TAO $250.35 / market cap $2.40B。
- **Emissions Refactor (2026-05-13)** — 本 pulse 期間最終日 — top-performing subnets に TAO reward を集中化、capital efficiency 向上。
- **256 Subnet Expansion** が 2026 内予定 (現在 128 上限)。
- 商用 traction の証拠: 1 subnet が月 $360K の revenue を出している (AWS 同等 workload の 90% 安)。
- Custody use case: **直接の crypto custody 例は確認できず**。AI services marketplace としての性格が強い。
- Source: [yellow.com Bittensor research](https://yellow.com/research/bittensor-decentralized-ai-market-2-7-billion), [coinmarketcap TAO latest](https://coinmarketcap.com/cmc-ai/bittensor/latest-updates/)

### E-2. Ritual
- **Status**: Infernet decentralized oracle network (DON) は稼働中、8,000+ Infernet nodes。
- **Ritual Chain (sovereign L1) は "coming soon"** — 本 pulse 期間中 mainnet は未稼働。
- EVM++ extension + sidecars architecture。
- Custody use case: なし。AI inference oracle としての立ち位置。
- Source: [ritualfoundation.org](https://www.ritualfoundation.org/docs/architecture/infernet-to-chain), [gate.com Ritual primer](https://www.gate.com/learn/articles/a-simple-guide-to-ritual-the-open-ai-infrastructure-network/4594)

### E-3. Allora
- **Mainnet live since 2025-11-11**。
- **重大 delta**: **2026-05-04 に critical network upgrade**、Bithumb が ALLO 入出金停止。scalability + security 強化向け。
- TRON/NEAR/SEI integration、Python/TypeScript/Go SDK 提供。
- Custody use case: 直接の crypto custody 例なし。AI prediction layer for DeFi。
- Source: [messari Allora](https://messari.io/project/allora-network), [coinmarketcap ALLO latest](https://coinmarketcap.com/cmc-ai/allora/latest-updates/)

### E-4. Gensyn
- **重大 delta**: **2026-04-22 mainnet launch** ("Network for Machine Intelligence" L2)、Delphi (AI-settled prediction market) が first app として live。**$AI token launch 2026-04-29**。**Buy-and-burn mechanism 2026-05-01 開始** (protocol fee で $AI を burn、deflationary)。
- Custody use case: 直接なし。ML compute marketplace + AI prediction が core。
- Source: [news.bitcoin.com Gensyn Delphi](https://news.bitcoin.com/gensyn-network-debuts-delphi-a-permissionless-ai-prediction-market-platform-on-mainnet/), [mexc.com Gensyn mainnet](https://www.mexc.com/news/1047772), [docs.gensyn.ai](https://docs.gensyn.ai/)

### E-5. Sentient (Polygon CDK)
- **Status**: $85M raised (Founders Fund led)、Sandeep Nailwal / Himanshu Tyagi / Pramod Viswanath が leadership。Polygon CDK chain 上に構築。
- **本 pulse delta**: **ROMA V2 (AI agent engine)** を発表 — inference cost 削減 + performance 向上。Unstoppable Domains × Sentient Foundation で **.agent gTLD ICANN application** を正式進行。
- Custody use case: AI agent infra として "agentic" 方向を志向、明示的 crypto custody integration は未公開。Coinbase listing roadmap に 2025-12 で追加済 (上場確定ではない)。
- Source: [inc42 Sentient $85M](https://inc42.com/buzz/sandeep-nailwals-new-venture-sentient-raises-85-mn-to-take-on-openai-llama/), [bloomingbit ROMA V2](https://en.bloomingbit.io/feed/news/105799), [Fireworks blog Sentient](https://fireworks.ai/blog/Story-Sentient)

### E-6. Akash / Lilypad / Spheron
- **Akash**: **Mainnet 17 で Burn-Mint Equilibrium (2026-03-23)** — 初の deflationary mechanism。**Akash Agents platform (Q1 2026)** で one-click AI deployment。**Lease-to-Lease Networking (2026-05-30)** が次の milestone。Reserved Instances + Preemptible Pricing が 2026-08-30 予定。Q1 2026 new leases +27% QoQ。
- **Lilypad**: incentivized testnet 段階、multi-chain integration の groundwork 中。
- **Spheron**: 2026 mainnet status の specific update は search で出ず、consumer hardware → compute marketplace の vision 継続。
- Custody use case: いずれもなし。compute marketplace としての性格。
- Source: [Messari Akash Q1 2026](https://x.com/MessariCrypto/status/2055307572102692910), [akash.network](https://akash.network/), [blog.spheron.network Lilypad](https://blog.spheron.network/lilypad-a-comprehensive-overview)

### E-7. Fetch.ai / Ocean Protocol (ASI Alliance)
- **Artificial Superintelligence Alliance (FET + AGIX + OCEAN → $ASI 単一 token)** は full operational。Agentverse / DeltaV / Fetch Network 経由で agents 提供。
- Deutsche Telekom / Alibaba Cloud との実証実験継続。
- Custody use case: agentic commerce + autonomous AI payments の文脈で言及されるが、明示的 crypto custody integration は未公開。
- Source: [fetch.ai blog ASI](https://www.fetch.ai/blog/fetch-ai-singularity-net-and-ocean-protocol-unite-to-create-the-superintelligence-alliance), [ainvest agentic commerce Fetch](https://www.ainvest.com/news/agentic-commerce-emergence-autonomous-ai-payments-fetch-ai-catalyst-ai-economy-2512/)

### E-8. 比較サマリ (Production-grade? + Custody experience? + Active dev?)
| Project | Mainnet | Custody integration | Token activity | Notes |
|---|---|---|---|---|
| Bittensor | Yes (64 subnets) | No | High (TAO $2.4B mcap) | AI services marketplace |
| Ritual | Partial (oracle only) | No | Pending Ritual Chain | Inference oracle |
| Allora | Yes (2025-11) | No | Active (May 4 upgrade) | DeFi prediction layer |
| Gensyn | Yes (2026-04-22) | No | Active ($AI launch) | ML compute + Delphi |
| Sentient | Yes (Polygon CDK) | No (planned) | Pre-listing | AI agent engine |
| Akash | Yes (Mainnet 17) | No | Active (BME deflation) | Compute marketplace |
| Lilypad | Testnet | No | TGE pending | Serverless compute |
| Spheron | Unclear | No | Low signal | Consumer compute |
| Fetch.ai / ASI | Yes | No (agentic commerce focus) | $ASI active | Agent + data marketplace |

**Custody integration が "No" 一色** — これが本 research の最重要 negative finding。**PQC custody × decentralized AI infra の交差点に shipping している既存事例はゼロ**。

---

## F. AI Agent × Crypto custody competitive landscape (NEW vs W19)

### F-1. Direct competitors (Agentic custody)
- **Coinbase Agentic Wallets (2026-02-11)**: x402 protocol 上、Base 上 gasless trading。鍵は Coinbase TEE 内、local session key + email OTP authn、self-custodial で export 可能、agent は private key を見ない。**165M+ tx / $50M+ volume / 480K+ transacting agents** ([cryptobriefing Agentic.market](https://cryptobriefing.com/agentic-market-ai-agents-hub/))。
- **x402 / Agentic.market (2026-04-02)**: Linux Foundation governance 化、Cloudflare/Stripe/AWS/Google/Shopify/Visa/Mastercard が back。**AI agent が Bloomberg/AWS/CoinGecko data を API key なしで購入**できる marketplace。
- **Human.tech Agentic WaaP (2026-04-01, WalletCon 2026)**: Wallet-as-a-Protocol architecture、cryptographic safeguard 経由で human control 維持。
- **MoonPay Agents (2026-02 launch)**: agentic payment single integration。
- **Ledger 2026 AI Security Roadmap**: hardware-anchored security stack for AI agents、consequential action は人が承認。
- **ClawBank Manfred (2026-05-01)**: **AI agent が自社を法人化、IRS EIN + FDIC 銀行口座 + crypto wallet を自律取得** — 初の autonomous corporation。14-week beta で 1,000+ participants が 9,500+ agents を作り **187,000 autonomous crypto transactions** を実行。
- Source: [coinbase.com Agentic Wallets](https://www.coinbase.com/developer-platform/discover/launches/agentic-wallets), [decrypt Coinbase AI wallet](https://decrypt.co/357813/coinbase-launches-wallet-ai-agents-built-in-guardrails), [coindesk AI agent EIN](https://www.coindesk.com/tech/2026/05/01/ai-agent-forms-its-own-company-gets-ready-to-trade-crypto), [invezz Human.tech Agentic WaaP](https://invezz.com/news/2026/04/01/human-tech-unveils-agentic-waap-for-secure-ai-agent-operations/), [ledger.com AI security roadmap](https://www.ledger.com/blog-2026-ai-security-roadmap)

### F-2. AVS / EigenLayer as agent execution layer
- **EigenAI** mainnet (late 2025): verifiable AI inference。
- **EigenCompute alpha (2026-01)**: off-chain execution verification。
- **ElizaOS × EigenLayer**: cryptographically verifiable agents、Eigen 提供の infrastructure 経由で agent が改竄なし code を走らせたことを cryptographic に保証。
- **EigenLayer restaked TVL $18B+** (BlockEden 2026-03-20)、Vertical AVS specialization で AI verification AVS が hottest category。280+ crypto-AI projects が trust-minimized model evaluation を要求。
- Source: [blog.eigencloud.xyz Ungate Wukong](https://blog.eigencloud.xyz/ungate-wukong-trust-layer-for-ai-agents/), [blog.eigencloud.xyz ElizaOS](https://blog.eigencloud.xyz/how-elizaos-built-cryptographically-verifiable-agents/), [BlockEden EigenLayer $18B](https://blockeden.xyz/blog/2026/03/20/eigenlayer-18b-tvl-vertical-avs-specialization-restaking-evolution/)

### F-3. "PQC + Agentic custody" 交差点 ⇒ 競合空白
- 検索 "agent operated custody"、"AI custodian"、"agentic crypto"、"autonomous custody" で **明示的に PQC を combine している project は確認できず**。
- **Cobo の agentic AI crypto guide** で MPC custody + session keys + multi-sig をベストプラクティスとして推奨、PQC への明示的言及はない (cobo.com agentic AI guide)。
- Cypher Knox (FluxForce) は "Lead AI Crypto Custody Architect" を自称するが、PQC native ではなく既存 custody infra の AI augmentation。
- **QS への implication**: 「PQC + AI agent custody」の白地はまだ open。ただし「ただの PQC custody」では Coinbase Quantum Council の position paper + 2026 末 "quantum-proof institutional custody" service launch 計画と頭がぶつかる。
- Source: [cobo.com agentic AI crypto guide](https://www.cobo.com/post/agentic-ai-crypto-guide), [globalcustody.pro AI in custody](https://www.globalcustody.pro/p/the-complete-guide-to-ai-in-digital-asset-custody), [fluxforce.ai Cypher Knox](https://www.fluxforce.ai/superhumans/ai-crypto-security-analyst)

---

## G. Settlement time expectations

### G-1. TradFi (T+0/T+1/T+2) baseline
- US 株式市場は **2024-05-28 から T+1 移行済み** (SEC mandated)。
- DTCC の **tokenized US Treasuries / ETFs / Russell 1000 components no-action letter (late 2026 開始予定)** は legacy infra と blockchain settlement の橋渡し。ownership rights + investor protections は同一。
- 本 pulse 期間中、T+0 への進化 pressure は **mainstream regulatory document には観測されず**。

### G-2. DeFi default
- L1 instant settlement: ~12 sec (Ethereum block time)。
- Account Abstraction 経由 instant settlement の expectation は EIP-8141 が広がる前提で語られるが、Hegotá 待ち (late 2026)。

### G-3. MPC custodian latencies (publicly cited)
- **Fireblocks**: industry-leading sub-15-minute settlement、Network Transfer (off-chain peer-to-peer) で更に短縮可能、2,000+ institutions / $10T+ cumulative tx volume / 300M wallets / 2,400+ institutional clients。
- **Coinbase Custody**: ~$300B AUC、Coinbase Prime + OTC desk integration で BTC/ETH execution+settlement を streamline。
- **Anchorage**: BTC/ETH の **~90% を 15 分以内**に処理。cold storage 直接 institutional-speed。

### G-4. QS 24h timelock の妥当性 — 本 pulse での再評価
- **Market expectation**: institutional MPC custodian の **publicly cited norm は "sub-15 min"**。QS の 24h timelock は **2 桁 (96×) 遅い**。
- **W19 baseline 以降の変化**: 大きな regulatory shift なし。ただし **agentic custody の出現で expected latency floor が更に低下** (Coinbase Agentic Wallets の x402 は gasless instant)、QS との gap は **拡大方向**。
- **QS の 24h は security parameter として正当化される領域** (catastrophic key compromise + slashing window) はある。だが **institutional adoption narrative としては、24h timelock + Prover Pool VRF 待ち + Observer challenge window** という構成は累積遅延が "instant settlement era" の market expectation と衝突する。
- TODO[founder]: 24h を必須としない代替 (e.g., "small amount fast path + large amount 24h" の閾値設計) を strategic meeting で再検討。
- Source: [cobo.com top 8 custodians](https://www.cobo.com/post/top-8-institutional-grade-custodians-securing-bitcoin-and-ethereum-in-2026), [fireblocks Network](https://www.fireblocks.com/blog/leader-in-public-blockchain-support-coverage), [eco.com Fireblocks Network](https://eco.com/support/en/articles/12160099-what-is-the-fireblocks-network-institutional-stablecoin-settlement), [SEC.gov DTCC tokenization](https://www.sec.gov/newsroom/speeches-statements/trading-markets-121725-statement-custody-crypto-asset-securities-broker-dealers)

---

## H. Latest threshold / batch ZK PQC papers (eprint.iacr.org 2026-Q2)

### H-1. Threshold ML-DSA family (本 pulse 圏内)
- **eprint 2026/013 "Efficient Threshold ML-DSA"** (Sofía Celi / Rafaël del Pino / Thomas Espitau / Guilhem Niot / Thomas Prest, 2026-01): 2-6 parties、sub-second WAN signing、21-1050 KB/party communication。
- **eprint 2026/638 "THED: Threshold Dilithium from FHE"** (Park/Passelègue/Stehlé, 2026-04): 0.202s online time on GPU、ThFHE+CKKS based。
- **eprint 2026/814 "Threshold Signatures as-a-Service" (TSaaS)** (2026-04, ML-DSaaS variant): first 2 rounds を message-independent な single round に圧縮、message 既知前に pre-process 可能。
- **arxiv 2603.22109 "TALUS: Threshold ML-DSA with One-Round Online Signing"** (boundary clearance + carry elimination): one-round online。
- **eprint 2025/1163 "Quorus"**: efficient scalable threshold ML-DSA from MPC。
- **eprint 2026/974 "LoTRS"** (2026-05、本 pulse 直前): lattice-based structured threshold ring signature、leader 不要、2 ラウンドのみ。
- **Mithril** (NIST TCall-1): replicated secret sharing 経由で 3 online rounds、FIPS-compatible。
- Source: [eprint.iacr.org/2026/013](https://eprint.iacr.org/2026/013), [eprint.iacr.org/2026/638](https://eprint.iacr.org/2026/638), [eprint.iacr.org/2026/814](https://eprint.iacr.org/2026/814), [eprint.iacr.org/2025/1163](https://eprint.iacr.org/2025/1163), [eprint.iacr.org/2026/974](https://eprint.iacr.org/2026/974), [Mithril csrc.nist.gov](https://csrc.nist.gov/csrc/media/Projects/threshold-cryptography/documents/TCall-1/Mithril-PW01.pdf)

### H-2. Batch / aggregate verification for lattice signatures
- **eprint 2026/398 "Orthus: Practical Sublinear Batch-Verification of Lattice Relations"** (2026-02-26): sub-linear verification、Falcon aggregation で **2^17 signatures aggregation 時 verifier 9× 高速化**。LaBRADOR + Orthus combo で LaBRADOR 単独より 2.5×-9× 速い verification。
- **eprint 2026/420 "FALCON with message recovery"** (2026-03): NIST FN-DSA への影響。
- **eprint 2026/954** (2026-05): black-box validation of Falcon key generation under numerical instability。
- Source: [eprint.iacr.org/2026/398](https://eprint.iacr.org/2026/398), [eprint.iacr.org/2026/420](https://eprint.iacr.org/2026/420), [eprint.iacr.org/2026/954](https://eprint.iacr.org/2026/954)

### H-3. LatticeFold+ / Neo / SuperNeo
- **eprint 2026/242 "Neo and SuperNeo: Post-quantum folding with pay-per-bit costs over small fields"** (2026-02): **SuperNeo は 6 条件 (PQ security + pay-per-bit + field-native arithmetic + general CCS + small-field e.g. Goldilocks + low recursion overhead) を **all 満たす初の scheme**。Neo は 5/6 (SIMD restriction あり)。LatticeFold + LatticeFold+ は満たさない条件あり。
- LatticeFold+ は LatticeFold より prover 高速化 + 検証回路簡素化 + folding proof 短縮。
- Source: [eprint.iacr.org/2026/242](https://eprint.iacr.org/2026/242), [cronokirby Neo/SuperNeo notes](https://cronokirby.com/refs/2026-02-neo-and-superneo-post-quantum-folding-with-pay-per-bit-costs-over-small-fields.html)

### H-4. その他注目論文
- **eprint 2026/952 "Formalizing Blockchain PQC Signature Transition"** (本 pulse 直前 2026-05): quantum adversary を outpace するための signature transition の形式化。**QS architecture decision に直接刺さる候補**。TODO[founder]: 本論文の構成と SR_0/SR_1 ロジックを照合。
- **eprint 2026/294 "Post-Quantum Adaptor Signatures from Cryptographic Group Actions"** (CSI-FiSh based)。
- Source: [eprint.iacr.org/2026/952](https://eprint.iacr.org/2026/952), [eprint.iacr.org/2026/294](https://eprint.iacr.org/2026/294)

---

## 重要な delta vs W19 baseline

W19 baseline (5 月 9 日) と本 pulse (5 月 13 日) の 4 日間差では大きく変わらないが、W19 が触れていない / 弱かった 8 領域:

1. **Coinbase Quantum Advisory paper の具体内容**: W19 では存在を flag したが、ML-DSA 90% throughput 低下試算 + Satoshi-era coin rate-cap 提案 + 2026 末 "quantum-proof institutional custody" service commit は本 pulse で初めて明示。
2. **IonQ Walking Cat blueprint (2026-04-22)**: W19 で言及なし。10K physical qubits 規模の fault-tolerant 機の full-stack blueprint 公開は **Q-day timeline pressure を更に高める単一最大 hardware signal** (Google の 2029 announcement と並ぶ)。
3. **Quantinuum Helios 48 error-corrected logical qubits**: W19 で部分的に言及、本 pulse で数字を確定。Microsoft Level 2 Resilient phase 到達。
4. **Gensyn mainnet + Delphi (2026-04-22)** + **$AI token launch (2026-04-29)** + **buy-and-burn (2026-05-01)**: W19 で完全に未捕捉。decentralized AI infra カテゴリで本 pulse 期間に起きた最大 productionization event。
5. **WHIR Solidity verifier 実装公開 (2026-05-12 頃)**: W19 で計画段階。本 pulse で実装 first cut が出た。Ethereum 側 PQ-SNARK ロード進捗の load-bearing 証拠。
6. **eprint 2026/814 TSaaS + 2026/974 LoTRS + 2026/952 blockchain PQC transition**: W19 で未捕捉、threshold/transition 系の論文が更に増えた。
7. **Agentic custody が production scale**: Coinbase Agentic Wallets の x402 が **165M+ tx / $50M+ volume / 480K agents**、ClawBank Manfred の autonomous incorporation。W19 baseline は agentic custody を観測していない。
8. **EU NIS2 PQC 条項 (COM(2026) 13 final, 2026-01-20)**: W19 で言及されたが本 pulse で正式 mandate 化のスケジュール (2026 末までに全 Member States が national plan) を確定。

---

## QS architecture decision への直接的 implication

### Q1: 「F (institutional custody integration)」path は依然 alive か?
- **Yes、ただし窓は狭まっている**。
- Coinbase が 2026 末に "quantum-proof institutional custody" service を direct competitor として launch する commit を出した。Fireblocks は MPC standardization で内製方針。threshold ML-DSA (2026/013, 638, 814, 974) で MPC vendor 内製の技術的余裕は十分。
- QS が「PQC attestation on top of existing MPC」を提供する value proposition は、**Coinbase が同じことを single counterparty で提供する** と直接競合。
- **新しい競合領域** = **"PQC + AI agent operated custody"** — このマス目は本 pulse 時点で確認可能な競合 zero。F path のリパッケージとして検討価値あり。

### Q2: Hegotia (誤記) vs Glamsterdam の名前確定?
- **正式は "Hegotá" (acute accent)**。"Hegotia" は誤記。"Heze-Bogota" は minority 英文略記。
- Glamsterdam (H1 2026 fork、Q3 にずれ込む見通し) は headliner = Block Access Lists + Enshrined PBS。EIP-8141 は CFI、非 headliner。
- Hegotá (late 2026) が EIP-8141 (Frame Tx)、Verkle Trees の本拠。
- **QS Phase 6+ の EIP-8141 integration story は Hegotá target に書き直す必要**。CLAUDE.md / docs/INTEGRATION_METHODOLOGY_v2.md / docs/grants/EF_ESP_APPLICATION.md で "Hegotia" 表記が残っていれば修正。

### Q3: 24h timelock の妥当性は変わったか?
- **悪化方向**。
- Coinbase Agentic Wallets が **gasless instant** (x402 経由) で 480K agents 規模に到達 → market expected settlement floor が更に下がった。
- Anchorage / Fireblocks は **sub-15 min** を publicly cite。QS 24h との gap は変わらず 96×。
- **defensive narrative**: QS の 24h は "catastrophic compromise + slashing window" の security parameter であり instant settlement layer ではない、と切り分ければ正当化可能。
- **offensive narrative**: institutional adoption を狙うなら "small amount instant path + large amount 24h" の閾値設計 (e.g. ≤$10K = no timelock, $10K-1M = 1h, $1M+ = 24h) を考慮。
- TODO[founder]: 戦略 meeting で この trade-off を formal に議題化。

### Q4: 分散型 AI infra に乗る既存事例は?
- **PQC custody × decentralized AI infra の交差点に shipping している既存事例ゼロ** (本 pulse research range で確認可能な範囲)。
- 最も近い existing patterns:
  - **EigenAI + ElizaOS**: AI agent の execution verifiable 化 (PQC ではなく cryptographic auditability)。
  - **Coinbase Agentic Wallets**: agent custody (PQC ではない、TEE + session key)。
  - **Ritual Infernet**: AI inference oracle (custody ではない)。
- **white space**: 「PQC native な AI agent custody」かつ「decentralized infra で動かす」は本 pulse で確認可能な範囲では空き地。Sentient (Sandeep Nailwal) が ROMA V2 で AI agent engine を出してきており、もし QS が PQC custody primitive を提供できれば **integration partner として interesting** (現状 Sentient 側に明示的 crypto custody integration はない)。
- **EigenLayer AVS としての QS** という再パッケージは技術的に成立する可能性がある — AVS が 280+ crypto-AI projects に "trust-minimized model evaluation" を提供している領域に対し、QS が "trust-minimized PQC custody attestation" の AVS として位置取りする道。

---

## Cannot-find-evidence (honest list)

本 pulse 期間 (2026-04-13 〜 2026-05-13) 中に **search で確認できなかった** 項目:

1. **IBM 2033 quantum roadmap の本 30 日間内の改訂**。
2. **Atom Computing の本 30 日間内の logical qubit milestone announcement**。
3. **NIST FIPS 206 (FN-DSA / Falcon) の正式 publication date**。"後半に予定" 以上の precision なし。
4. **NIST IR 8214C への submission リスト (May 締切後)**。
5. **NSA CNSA 2.0 関連の本 30 日間内の追加 statement**。
6. **JFSA (金融庁) / IPA からの PQC migration document**。Japan 側 financial regulator の PQC stance は本 pulse で signal なし。
7. **Komainu / Komainu Japan の本 30 日間内の PQC announcement**。
8. **SBI VC Trade / bitFlyer / Coincheck の本 30 日間内の PQC announcement**。
9. **BlackRock / BUIDL fund の direct PQC announcement** (二次情報のみ)。
10. **OMB M-23-02 successor memo の正式発出** (依然 "draft" status)。
11. **EIP-8051 ML-DSA precompile の Glamsterdam CFI/DFI 確定** (search 不明、PFI'd EIPs HackMD で要確認)。
12. **ZKnox の 2026-04 / 2026-05 commits の個別内容** (GitHub commit log の直接観測必要)。
13. **WebFetch は今回も全 primary source URL で HTTP 403**。W19 と同じ制約。

---

## Sources (全 URL + status)

WebFetch は全 primary source URL で HTTP 403 を返却。全 finding は WebSearch (search-engine summaries) 経由のため、founder review 前に primary URL の直接確認推奨。

### A. Quantum hardware
- [postquantum.com IBM](https://postquantum.com/quantum-computing-companies/ibm/) — WebSearch summary
- [spectrum.ieee.org IBM Condor](https://spectrum.ieee.org/ibm-condor) — WebSearch summary
- [ibm.com Quantum Roadmap 2033](https://www.ibm.com/quantum/blog/quantum-roadmap-2033) — WebSearch summary
- [blog.google cryptography migration timeline](https://blog.google/innovation-and-ai/technology/safety-security/cryptography-migration-timeline/) — WebFetch 403
- [itpro.com Google Q-Day timeline](https://www.itpro.com/security/google-just-revised-its-q-day-timeline-quantum-computers-could-break-existing-encryption-techniques-within-three-years-and-enterprises-are-nowhere-near-ready) — WebSearch summary
- [thequantuminsider Q-Day three papers](https://thequantuminsider.com/2026/03/31/q-day-just-got-closer-three-papers-in-three-months-are-rewriting-the-quantum-threat-timeline/) — WebFetch 403
- [cnn.com Q-Day 2026-05-17](https://www.cnn.com/2026/05/17/science/quantum-computing-cybersecurity-q-day) — WebSearch summary
- [impactquantum Helios](https://impactquantum.com/quantinuums-new-helios-system-record-logical-qubits-break-even-qec/) — WebSearch summary
- [quantinuum.com 2029 fault-tolerant](https://www.quantinuum.com/blog/quantinuum-overcomes-last-major-hurdle-to-deliver-scalable-universal-fault-tolerant-quantum-computers-by-2029) — WebSearch summary
- [ionq.com Walking Cat blueprint](https://www.ionq.com/news/ionq-publishes-definitive-technical-report-establishing-its-fault-tolerant-quantum-computing-trajectory---setting-a-new-standard-for-technical-specificity-and-transparency) — WebSearch summary
- [hpcwire IonQ Walking Cat](https://www.hpcwire.com/off-the-wire/ionq-details-walking-cat-architecture-for-fault-tolerant-quantum-computing/) — WebSearch summary

### B. PQC regulatory
- [csrc.nist.gov IR 8547 ipd](https://csrc.nist.gov/pubs/ir/8547/ipd) — WebSearch summary
- [postquantum NSA CNSA 2.0](https://postquantum.com/quantum-policy/nsa-cnsa-2-0-pqc/) — WebSearch summary
- [axelspire PQC timeline mandates](https://axelspire.com/business/pqc-timeline-mandates/) — WebSearch summary
- [postquantum NIS2 DORA PQC](https://postquantum.com/security-pqc/nis2-dora-pqc-quantum/) — WebSearch summary
- [digital-strategy.ec.europa.eu coordinated roadmap](https://digital-strategy.ec.europa.eu/en/library/coordinated-implementation-roadmap-transition-post-quantum-cryptography) — WebSearch summary
- [pqshield EU PQC](https://pqshield.com/eu-pqc-workstream-publishes-a-coordinated-implementation-roadmap-for-the-transition-to-post-quantum-cryptography/) — WebSearch summary
- [pqshield 2035 Japan NCO](https://pqshield.com/2035-japans-nco-sets-the-timeline-for-quantum-security/) — WebSearch summary
- [whitehouse.gov M-23-02](https://www.whitehouse.gov/wp-content/uploads/2022/11/M-23-02-M-Memo-on-Migrating-to-Post-Quantum-Cryptography.pdf) — WebSearch summary

### C. EVM PQC
- [eips.ethereum.org EIP-8141](https://eips.ethereum.org/EIPS/eip-8141) — WebFetch 403
- [ethereum-magicians 8141 March 5](https://ethereum-magicians.org/t/headliner-breakout-eip-8141-frame-transaction-march-5-2026/27879) — WebFetch 403
- [forkcast 8141](https://forkcast.org/eips/8141/) — WebSearch summary
- [eips.ethereum.org EIP-8051](https://eips.ethereum.org/EIPS/eip-8051) — WebSearch summary
- [eips.ethereum.org EIP-8052](https://eips.ethereum.org/EIPS/eip-8052) — WebSearch summary
- [eips.ethereum.org EIP-7885 NTT](https://eips.ethereum.org/EIPS/eip-7885) — WebSearch summary
- [github.com/ZKNoxHQ/ETHFALCON](https://github.com/ZKNoxHQ/ETHFALCON) — WebSearch summary (direct GitHub fetch needed)
- [github.com/ZKNoxHQ/ETHDILITHIUM](https://github.com/ZKNoxHQ/ETHDILITHIUM) — WebSearch summary
- [github.com/ZKNoxHQ/NTT](https://github.com/ZKNoxHQ/NTT) — WebSearch summary
- [zknox.eth.limo Ethereum PQ era](https://zknox.eth.limo/posts/2025/02/24/ETHEREUM_for_PQ_era_250224.html) — WebSearch summary
- [ethresear.ch EVM WHIR](https://ethresear.ch/t/evm-verification-of-whir-over-a-31-bit-field/24902) — WebFetch 403
- [hackmd clientsideproving pq-snark](https://hackmd.io/@clientsideproving/pq-snark-verifier) — WebFetch 403
- [github.com/TomWambsgans/Whirlaway](https://github.com/TomWambsgans/Whirlaway) — WebSearch summary
- [crypto.news Glamsterdam Hegotá shift](https://crypto.news/ethereum-details-glamsterdam-devnet-progress-and-hegota-roadmap-shift/) — WebSearch summary
- [cointelegraph Glamsterdam Hegota](https://cointelegraph.com/news/ethereum-2026-glamsterdam-hegota-fork-scaling) — WebSearch summary
- [eipsinsight Glamsterdam scope](https://eipsinsight.com/Blogs/glamsterdam-scope-narrows-core-devs-confirm-cfi-dfi) — WebSearch summary

### D. Custodian PQC
- [coinbase.com Quantum Advisory position paper](https://www.coinbase.com/blog/coinbase-quantum-advisory-council-publishes-position-paper-on-quantum-computing-and-blockchain) — WebFetch 403
- [coindesk 2026-04-21 Coinbase advisory](https://www.coindesk.com/tech/2026/04/21/coinbase-advisory-board-says-quantum-computing-threat-is-on-the-horizon-crypto-needs-a-plan) — WebSearch summary
- [thequantuminsider Coinbase 2026-04-25](https://thequantuminsider.com/2026/04/25/coinbase-advisers-warn-quantum-computing-will-crack-blockchain-encryption-and-the-window-to-prepare-is-narrowing/) — WebSearch summary
- [fireblocks Standardizing MPC](https://www.fireblocks.com/blog/standardizing-mpc-cryptography-a-cross-industry-call-to-action) — WebSearch summary
- [fireblocks Google quantum research](https://www.fireblocks.com/blog/google-quantum-research-institutional-crypto-security) — WebSearch summary
- [cobo top 8 custodians](https://www.cobo.com/post/top-8-institutional-grade-custodians-securing-bitcoin-and-ethereum-in-2026) — WebSearch summary
- [securities.io quantum-resistant RWA](https://www.securities.io/quantum-resistant-rwa-tokenization-ledger/) — WebSearch summary
- [SEC.gov BD crypto custody](https://www.sec.gov/newsroom/speeches-statements/trading-markets-121725-statement-custody-crypto-asset-securities-broker-dealers) — WebSearch summary
- [coincu Bithumb PQC](https://coincu.com/bithumb-quantum-resistant-cryptography-plan/) — WebSearch summary

### E. Decentralized AI infra
- [yellow.com Bittensor research](https://yellow.com/research/bittensor-decentralized-ai-market-2-7-billion) — WebSearch summary
- [ritualfoundation.org architecture](https://www.ritualfoundation.org/docs/architecture/infernet-to-chain) — WebSearch summary
- [messari Allora](https://messari.io/project/allora-network) — WebSearch summary
- [news.bitcoin.com Gensyn Delphi](https://news.bitcoin.com/gensyn-network-debuts-delphi-a-permissionless-ai-prediction-market-platform-on-mainnet/) — WebSearch summary
- [mexc.com Gensyn mainnet](https://www.mexc.com/news/1047772) — WebSearch summary
- [inc42 Sentient $85M](https://inc42.com/buzz/sandeep-nailwals-new-venture-sentient-raises-85-mn-to-take-on-openai-llama/) — WebSearch summary
- [bloomingbit ROMA V2](https://en.bloomingbit.io/feed/news/105799) — WebSearch summary
- [Messari Akash X](https://x.com/MessariCrypto/status/2055307572102692910) — WebSearch summary
- [fetch.ai blog ASI](https://www.fetch.ai/blog/fetch-ai-singularity-net-and-ocean-protocol-unite-to-create-the-superintelligence-alliance) — WebSearch summary

### F. Agentic custody
- [coinbase.com Agentic Wallets](https://www.coinbase.com/developer-platform/discover/launches/agentic-wallets) — WebSearch summary
- [decrypt Coinbase AI wallet](https://decrypt.co/357813/coinbase-launches-wallet-ai-agents-built-in-guardrails) — WebSearch summary
- [cryptobriefing Agentic.market](https://cryptobriefing.com/agentic-market-ai-agents-hub/) — WebSearch summary
- [coindesk AI agent IRS EIN](https://www.coindesk.com/tech/2026/05/01/ai-agent-forms-its-own-company-gets-ready-to-trade-crypto) — WebSearch summary
- [invezz Human.tech Agentic WaaP](https://invezz.com/news/2026/04/01/human-tech-unveils-agentic-waap-for-secure-ai-agent-operations/) — WebSearch summary
- [ledger.com AI security roadmap](https://www.ledger.com/blog-2026-ai-security-roadmap) — WebSearch summary
- [blog.eigencloud.xyz Ungate Wukong](https://blog.eigencloud.xyz/ungate-wukong-trust-layer-for-ai-agents/) — WebSearch summary
- [blog.eigencloud.xyz ElizaOS](https://blog.eigencloud.xyz/how-elizaos-built-cryptographically-verifiable-agents/) — WebSearch summary
- [BlockEden EigenLayer $18B](https://blockeden.xyz/blog/2026/03/20/eigenlayer-18b-tvl-vertical-avs-specialization-restaking-evolution/) — WebSearch summary
- [cobo agentic AI crypto guide](https://www.cobo.com/post/agentic-ai-crypto-guide) — WebSearch summary

### G. Settlement time
- [fireblocks public blockchain coverage](https://www.fireblocks.com/blog/leader-in-public-blockchain-support-coverage) — WebSearch summary
- [eco.com Fireblocks Network](https://eco.com/support/en/articles/12160099-what-is-the-fireblocks-network-institutional-stablecoin-settlement) — WebSearch summary

### H. Threshold/batch ZK PQC papers
- [eprint.iacr.org/2026/013](https://eprint.iacr.org/2026/013) — WebFetch 403
- [eprint.iacr.org/2026/638](https://eprint.iacr.org/2026/638) — WebFetch 403
- [eprint.iacr.org/2026/814](https://eprint.iacr.org/2026/814) — WebSearch summary
- [eprint.iacr.org/2025/1163](https://eprint.iacr.org/2025/1163) — WebSearch summary
- [eprint.iacr.org/2026/974](https://eprint.iacr.org/2026/974) — WebSearch summary
- [arxiv 2603.22109 TALUS](https://arxiv.org/html/2603.22109v1) — WebSearch summary
- [Mithril csrc.nist.gov](https://csrc.nist.gov/csrc/media/Projects/threshold-cryptography/documents/TCall-1/Mithril-PW01.pdf) — WebSearch summary
- [eprint.iacr.org/2026/398 Orthus](https://eprint.iacr.org/2026/398) — WebSearch summary
- [eprint.iacr.org/2026/420 FALCON message recovery](https://eprint.iacr.org/2026/420) — WebSearch summary
- [eprint.iacr.org/2026/954](https://eprint.iacr.org/2026/954) — WebSearch summary
- [eprint.iacr.org/2026/242 Neo SuperNeo](https://eprint.iacr.org/2026/242) — WebSearch summary
- [cronokirby Neo SuperNeo](https://cronokirby.com/refs/2026-02-neo-and-superneo-post-quantum-folding-with-pay-per-bit-costs-over-small-fields.html) — WebSearch summary
- [eprint.iacr.org/2026/952 blockchain PQC transition](https://eprint.iacr.org/2026/952) — WebSearch summary
- [eprint.iacr.org/2026/294](https://eprint.iacr.org/2026/294) — WebSearch summary

---

## Founder verification checklist (本 pulse 専用)

External claim / strategy meeting に使う前に:

1. **eprint 2026/952 "Formalizing Blockchain PQC Signature Transition"** を直接読む — QS の SR_0/SR_1 と直接競合する可能性。
2. **IonQ Walking Cat technical paper** を直接読む — 10K qubit blueprint の信憑性 (公開済 fidelity vs blueprint 想定の gap)。
3. **Coinbase Quantum Advisory position paper PDF (51 pages)** を直接読む — 2026 末 "quantum-proof institutional custody" service の **specific signature scheme commitment** が明示されているか。
4. **Ethereum All Core Devs April 2026 meeting minutes** で EIP-8051 / 8052 / 7885 の CFI/DFI 確定状態を確認 — Glamsterdam に何個 PQ 関連が乗るかが QS の operational buffer を決める。
5. **ZKnox GitHub 最新 commit log** (4 月後半 〜 5 月) — ETHFALCON / ETHDILITHIUM / NTT の implementation 進捗。
6. **JFSA / IPA / Komainu Japan の direct website check** — search ヒットしないだけで本当に文書がないか確認。
7. **CLAUDE.md / docs 全体で "Hegotia" → "Hegotá"** 表記置換チェック。
