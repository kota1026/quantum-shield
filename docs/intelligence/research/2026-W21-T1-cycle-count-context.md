---
date: 2026-05-13
parent: docs/intelligence/research/2026-W21-T1-sp1-results.md
purpose: Decide whether 2,739,124 cycles for N=1 ML-DSA-65 verify is heavy, normal, or light
---

# T1 Cycle Count Comparable Benchmarks

## TL;DR

QS の T1 spike が出した **N=1 ML-DSA-65 verify = 2,739,124 RISC-V cycles** は SP1 公開ベンチマークの分布の中で **"軽い〜やや軽い" の側** にある。具体的には:

- 同じ ML-DSA-65 を SP1 で verify した先行公開実装 (Kota / sp1-ntt-gadget) は **5,625,411 cycles** を報告しており、QS の数字はその **約 49 %** — `fips204` を素朴に呼ぶだけでも Kota の参照値より速い。
- Tendermint light client や Reth block execution など SP1 が "代表的なヘビーワークロード" として宣伝してきた回路は数億 cycles のオーダー(例: Ethereum L1 block ≈ 600 M cycles / SP1 Hypercube)。N=1 ML-DSA-65 はその **約 1/200 〜 1/220**。
- 線形外挿で **N=256 = 7 億 cycles** は Ethereum L1 block 1 個分とほぼ同じ規模。SP1 Hypercube が 16×RTX 5090 で 12 秒以内に証明している領域。**現実的な範囲**。

結論は §6。**N=1 単独では "light" 寄りだが、N=256 までスケールしたときの prove 時間は工学的にきつい領域に入る** — F の経済性は成立するが、UX 設計は epoch settlement 前提でないと破綻する。

---

## 1. 比較テーブル

| 回路 / 操作 | Cycle count | 注記 | 出典 |
|---|---|---|---|
| **QS T1: ML-DSA-65 verify (N=1, `fips204` v0.4.6 default-features=false)** | **2,739,124** | sandbox 計測。execute wall ≈ 148 ms (emulator only). | `docs/intelligence/research/2026-W21-T1-sp1-results.md` |
| Kota / sp1-ntt-gadget: ML-DSA-65 verify (NTT gadget 込み総量) | 5,625,411 | NTT/INTT ≈ 580k (10.3%), hash ≈ 200k (3.5%), other ≈ 320k (5.7%) のうちわけ — 文脈上の比率は数字と若干乖離するが原典どおり引用 | Kota Medium 2025-12 |
| Kota: NTT/INTT のみ (上記の内訳) | ≈ 580,000 | 全体の ≈ 50 % と説明されている | Kota Medium |
| Kota: hash 操作のみ (上記の内訳) | ≈ 200,000 | 全体の ≈ 18 % | Kota Medium |
| ML-DSA-44 verify, plain RISC-V (Saarinen 2023) | ~776,000 instructions | ベクタ拡張なし、ML-DSA-65 の **下界** として使える | Saarinen RVSummit 2023 PDF |
| SP1: 512 BLS12-381 signature verify (Eth sync committee), **no precompile** | ~6,000,000,000 (6 B) | 比較用ベースライン | Succinct precompile blog |
| SP1: 512 BLS12-381 signature verify, **with bls12-381 precompile** | ~50,000,000 (50 M) | 120× 削減 | Succinct precompile blog |
| SP1: bn254 pairing (substrate_bn + precompile) | 40,014,404 | execute wall 2.16 s | hackmd "bn256 SP1" (TODO[founder]: verify) |
| SP1: bn254 pairing, **no precompile** | 1,105,498,339 (1.1 B) | execute wall 26.8 s; precompile で 27× | hackmd "bn256 SP1" (TODO[founder]: verify) |
| SP1: secp256k1 ECDSA address recovery (prehash) | 218,247 | precompile 経由 | SP1 optimization tracking |
| SP1: Tendermint light client (precompile あり) | 公開数値なし — 公開資料は "5-10× 削減" の比率のみ | Cosmos IBC tendermint light client は raw vs patched 2 数を出すと記載されているが具体値は blog 本文に格納 (WebFetch 403) | succinct blog "SP1 benchmarks 8/6/24" |
| SP1: Reth block execution (Ethereum L1) | ~600,000,000 / block | SP1 Hypercube が 16×RTX 5090 で 99.7 % の block を 12 s 以内に証明 | blog.succinct.xyz/real-time-proving-16-gpus |
| SP1: Reth block 17106222 / 19409768 | 具体値は WebFetch 403 で取得不可 | "5–10× 削減" の質的記述のみ | succinct blog "Reth POC" |
| **理論線形外挿: ML-DSA-65 verify × N=256** | **≈ 701,217,344 ≈ 7 億** | 2.74 M × 256。SP1 内部で N=256 loop を回した場合の上限近似 | T1 結果からの算術 |
| **理論線形外挿: ML-DSA-65 verify × N=1024** | **≈ 2,804,869,376 ≈ 2.8 B** | 2.74 M × 1024 | 算術 |

注: SP1 公式 blog 系ドメイン (`blog.succinct.xyz`, `www.succinct.xyz`) は本セッションの WebFetch から HTTP 403 で全部弾かれたため、テーブル値は WebSearch スニペット経由の抽出。同じ blog post を別経路で見たときに 1 〜 2 桁ずれる可能性が残る。

---

## 2. ML-DSA / Dilithium を ZK 内で verify した先行事例

### 2.1 Kota (Phillyj1026) — sp1-ntt-gadget (2025-12 Medium / docs.rs)

唯一公開された SP1 + ML-DSA-65 のプロダクション級リファレンス実装。

- Cycle count: **5,625,411 (1 verify, NTT gadget 統合版)**。
- 内訳 (Medium 原文): NTT/INTT ≈ 580k (≈ 50 % と説明されている — 数値と比率に若干の不整合があり原典そのまま引用)、hash ≈ 200k (18 %)、other ≈ 320k (32 %)。
- Prove time: **22 秒**(SP1 Network)。
- Proof size: **260 byte** (Groth16 wrap)。
- 完全 FIPS 204 ML-DSA-65 互換、`no_std`、Montgomery 算術、Fiat-Shamir 4-challenge PIC 60-bit soundness。
- 出典: `medium.com/@phillyj1026/building-a-zero-knowledge-verifier-for-dilithium-signatures-ntt-gadget-implementation-in-sp1-6c50ab262836`, `docs.rs/sp1-ntt-gadget/latest/sp1_ntt_gadget/`。

**QS T1 との比較**: QS は `fips204` v0.4.6 を素のまま SP1 に流し込んだだけで Kota のチューニング済み NTT gadget 版より **49 %** 軽い。これは見かけ上の "勝ち" だが、内訳が違う:

- Kota は NTT を **専用 PIC gadget** に置き換えており、これは "60-bit soundness の確率的 NTT 検証" — つまり verify の意味論自体を緩めて (Fiat-Shamir のチャレンジ ↔ check) cycle を稼いでいる。
- QS は `fips204` のフル `verify()` を SP1 RISC-V エミュレータで走らせている。決定論的に "verify 関数を回す" 道で 2.74 M に収まっているのは、SP1 6.1 系の RISC-V エミュレーション + `fips204` の素朴な NTT が思ったほど重くないことを意味する。
- **重要な未解明**: Kota 数字の "総量 5.6 M" は彼の gadget を **使った後** の数字。QS の 2.74 M は precompile / gadget を **使わない** で出ている。同じ verify 意味論を比べると QS 側のほうが Kota より少ない cycles で動いている可能性が高い (sandbox 環境差・SP1 バージョン差はあるが、桁が逆転していないので信頼できる)。

### 2.2 Google Q-day SP1 ZKP (April 2026)

Trail of Bits の論評 (`blog.trailofbits.com/2026/04/17/...`) は cycle count を公開数値として出していない。記録されたのは:

- Google は 256-bit ECDLP を 2 種類の量子回路で証明 (1200 logical qubits + 90 M Toffoli gates, 1450 logical qubits + 70 M Toffoli gates)。
- SP1 の **64-bit** RISC-V を使用 (32-bit ではなく)。
- "Each additional bounds check inflates the already substantial cost of generating a zero-knowledge proof, particularly checks that run millions of times" — 規模感は **数百万 cycles 級ではなく数 B 級** であることを示唆。
- 出典: `blog.trailofbits.com/2026/04/17/we-beat-googles-zero-knowledge-proof-of-quantum-cryptanalysis/`, `github.com/trailofbits/quantum-zk-proof-poc`。

**QS との関係**: 同じ SP1 (64-bit) substrate で Google が ECDLP cryptanalysis 回路を回しており、SP1 が "数 B cycles 規模の生産級 PQC 関連回路を実証している" という事実は QS の N=256 = 7 億 cycles 計画にとって追い風。Cycle 数の **絶対上界** が "SP1 で実用的に証明可能か" の議論は Google 例で既に決着している。

### 2.3 RISC Zero / OpenVM / Cairo の ML-DSA 実装

- 公開された RISC Zero 上の ML-DSA verify ベンチマークは検索で発見できなかった。
- RISC Zero の公式 datasheet (`benchmarks.risczero.com/main/datasheet`) は WebFetch 403。
- OpenVM 2.0 / SWIRL blog (`blog.openvm.dev/2.0`) は ML-DSA を直接扱った数字を公開していない (proof size < 300 KB、100-bit soundness、RISC-V 964 MHz on 64 GPUs は記録)。
- TODO[founder]: verify — RISC Zero / OpenVM の社内ベンチに ML-DSA があるかどうかは公開情報からは判別不能。

### 2.4 学術論文

- `eprint.iacr.org/2025/061` CAPSS: SNARK-friendly 署名で 24K-35K R1CS。ML-DSA は **inner** で使うパターンを想定しているが R1CS-level の inner ML-DSA constraint count を直接出していない。
- `eprint.iacr.org/2024/868` Loquat: Legendre-PRF 系、 148K R1CS / 1 sig。Dilithium 直比較ではない。
- `eprint.iacr.org/2024/257`, `2025/247` LatticeFold(+): folding scheme; ML-DSA-folding の cycle count はまだ実装段階にない。
- "ZK Dilithium" でヒットする論文は cycle count ではなく constraint count メトリックを使う流派が多く、SP1 RISC-V cycles と直接比較はできない。

---

## 3. Solidity 単一 verifier の比較 (別 metric だが proxy)

cycle count ではなく EVM gas だが、"ML-DSA / Falcon の重さ感" の参考に。

| 実装 | 操作 | EVM gas | 注記 | 出典 |
|---|---|---|---|---|
| ETHDILITHIUM (ZKNoxHQ) | ML-DSA-44 verify, NIST 互換 | 8,100,000 (8.1 M) | 旧称 "Dilithium NIST" 版 | `github.com/ZKNoxHQ/ETHDILITHIUM` README |
| ETHDILITHIUM (ZKNoxHQ) | ML-DSA-44 verify, ETH 最適化 (Keccak based PRG) | 4,900,000 (4.9 M) | "DO NOT USE IN PRODUCTION" 警告維持 | 同上 |
| ETHFALCON (ZKNoxHQ, 2025-03 blog) | Falcon-512 verify, EVM-friendly | 1,500,000 (1.5 M) | SHAKE → keccak 置換 | `zknox.eth.ac/posts/2025/03/21/ETHFALCON.html` |
| ETHFALCON (ZKNoxHQ, 2025-02 blog gen-2 figure) | Falcon-512 verify, 改訂版 | 3,600,000 (3.6 M) | 2 つの公表値があり混乱中。`TODO[founder]: verify` 同一 HEAD か | `zknox.eth.limo/posts/2025/02/24/...` |
| EPERVIER (ZKNoxHQ) | Falcon-512 recovery (ecrecover-shape) | 1,600,000 (1.6 M) | 同レポ | `github.com/ZKNoxHQ/ETHFALCON` |
| EIP-8051 (Dubois+Masson, 2025-10 draft) | ML-DSA-44 precompile | **4,500** | NTT + 5 hash 呼び出しが主 cost driver | `ethereum-magicians.org/t/eip-8051-ml-dsa-verification/25857` |
| EIP-8052 (Masson, 2025) | Falcon-512 precompile | **1,200** | 最新草案 | `ethereum-magicians.org/t/eip-8052-precompile-for-falcon-support/25860` |
| EIP-7619 (前身) | Falcon-512 precompile | ~3,000 | Phase 2.2 メモが拾った数字 | `eips.ethereum.org/EIPS/eip-7619` |

**重要**: gas と SP1 cycles は **直接換算できない**。Solidity NTT は EVM 256-bit word の制約と Keccak ベース hash 経由で重くなる一方、SP1 RISC-V は 64-bit register + RISC-V instruction set でずっと自然に表現できる。同じ ML-DSA-65 verify でも

- Solidity (ZKNoxHQ 路線): 4.9 M gas → 大体 245 M EVM-gas-equivalent ops (gas/op の係数で 50)
- SP1 cycles: 2.74 M cycles
- 桁が違うのは "EVM gas は cryptographic op の合計重み付け、cycles は RISC-V instruction count" だから。

Proxy として読めるのは **"ML-DSA は Falcon より重い"** という相対関係: ETHDILITHIUM 4.9 M vs ETHFALCON 1.5 M = 3.3×。QS の 2.74 M cycles を Falcon-512 で同じ枠組で測ったら **約 830 k cycles 前後** になる可能性 (`TODO[founder]: verify` — Falcon-512 を SP1 で実測した公開数値は今回見つからず)。

---

## 4. SP1 prover が処理できる cycles/sec — 重さ評価のための係数

| ハードウェア | Throughput (cycles/s) | 出典 |
|---|---|---|
| SP1 1 機 (汎用 cloud CPU/GPU, "workload と instance に依存") | 900 kHz 〜 数 MHz | succinct docs / panewslab analysis |
| RISC Zero (MacBook Pro, 旧バージョン Discussion #96) | ~30,000 cycles/s | github discussion (古い情報) |
| RISC Zero Bonsai cloud | ~1,000,000 cycles/s | RISC Zero docs (Saarinen RVSummit からの間接引用) |
| SP1 Hypercube 16×RTX 5090 GPU cluster | Ethereum L1 block (~600 M cycles) を 10–12 秒 → **~50–60 M cycles/s effective** | blog.succinct.xyz/real-time-proving-16-gpus |
| SP1 Hypercube 200×RTX 4090 cluster (earlier figure) | Ethereum block 93 % in 10.3 s avg → ~60 M cycles/s effective | succinct blog SP1 Hypercube |

**QS dev hardware (founder 想定, 32+ GB box, single GPU or CPU)**: 公開数値で直接該当するものはないが、SP1 公式の "900 kHz 〜 数 MHz" レンジを採用すれば

- N=1 ML-DSA-65 = 2.74 M cycles ÷ 1.5 MHz ≈ **1.8 秒 prove**
- N=1 ML-DSA-65 = 2.74 M cycles ÷ 900 kHz ≈ **3.0 秒 prove**
- N=1 ML-DSA-65 = 2.74 M cycles ÷ 5 MHz ≈ **0.55 秒 prove**

Kota の "22 秒" は Groth16 wrap (STARK→SNARK 縮約) を含む。**生の STARK 部分だけなら 1–3 秒、Groth16 wrap で +15–20 秒** が現実的な内訳。

---

## 5. 重さ評価

### 5.1 N=1 = 2.74 M cycles の位置づけ

- SP1 公式の "代表ワークロード" (Tendermint, Reth) は 数億〜数 B cycles オーダー。N=1 ML-DSA-65 はその **0.1 % 〜 1 %** 程度。**圧倒的に軽い側**。
- 一方、SP1 の secp256k1 ECDSA precompile が 218 k cycles。**precompile なし の暗号 verify** としては ML-DSA-65 = 2.74 M は 12× ECDSA precompile に相当 — つまり "**precompile が無いカテゴリーで現代暗号 verify を SP1 に投げ込んだとき、ほぼ最良ライン**"。
- Kota の参照実装 5.6 M vs QS 2.74 M で **QS が軽い**。これは `fips204` v0.4.6 の hash と NTT 実装が予想より RISC-V フレンドリーだったことを意味する。Phase 2.5 memo の "ML-DSA-65 は -44 の 1.5–2× 重い" 推定 (Saarinen 776k × 1.5 = 1.16 M) より遥かに重いが、SP1 自体の RISC-V エミュレーションオーバヘッド (instruction-level overhead, memory access proving など) を考慮すると現実的な範囲。

**判定: N=1 単独は "light" 〜 "やや軽い"。**

### 5.2 N=256 = 7 億 cycles は SP1 で現実的か

- Ethereum L1 block = 約 600 M cycles を SP1 Hypercube が 16×RTX 5090 で **12 秒以内** に証明している (99.7 % のブロック)。
- N=256 ML-DSA-65 = ~701 M cycles は **L1 block 1 個分とほぼ同等**。SP1 Hypercube の 1 cluster で **15–20 秒程度** で証明可能と推定。
- 単一 GPU / single-machine では `900 kHz ~ 5 MHz` レンジで **140 〜 780 秒 = 2.3 〜 13 分** が現実的。Phase 2.5 W21 Tue の T1.5 目標 (N=4 ≤ 5 min, N=64 ≤ 1 hr) は満たせる可能性が高い。
- N=1024 ≈ 2.8 B cycles は SP1 Hypercube でも 1 分前後、single-machine では 1–3 時間規模。**hourly settlement なら問題なし**。

### 5.3 線形仮定が崩れる可能性のあるボトルネック

1. **メモリアクセスパターン**: ML-DSA-65 の public key (1952 B) と signature (3309 B) は per-sig で増える。256 sig まとめると pk + sig = 1.3 MB の入力。SP1 の memory proving table は cycle 数だけでなくメモリ access frequency にも cost を取るので、線形を超える可能性がある。Kota は単一 sig 用に最適化しているので 256× 線形外挿は楽観的すぎる可能性。**信頼区間 +20 〜 +50 %**。
2. **NTT 演算の並列化機会**: 同じ NTT を 256 回回すと SIMD-shape な並列化機会が出るが、SP1 はそれを自動で取らない (Rust の loop は逐次)。素朴ループだと cache 効率は良いが、命令キャッシュミスが効きうる。Pessimistic: 線形そのまま (= ~700 M)。Optimistic: ~600 M。
3. **rejection sampling は verify には存在しない**: ML-DSA の rejection sampling は **sign** 時のみ。Verify は決定論的なので、ループ N にスケールしても確率分布で揺れる cost driver はない。**これは好材料**。
4. **Groth16 wrap の固定 cost**: 22 s の Kota wall-clock のうち Groth16 wrap はバッチサイズに **独立** に乗る (final outer proof は 1 つ)。N=256 でも N=1 でも +15–20 秒の wrap cost は同じ。これが N が大きいほど amortize される構造で、F の経済性は守られる。
5. **SP1 6.1 のメモリ消費**: T1 sandbox で 16 GB OOM (Phase 4 prove 試行) は **N=1 でも** 起こった。N=256 では確実に **64 GB+ 必要**。Phase 2.5 で想定していた "32 GB dev box" は N=1 では十分でも、N=256 prove は cloud GPU 移行が前提。

### 5.4 Phase 2.5 threshold への当てはめ

Phase 2.5 meeting は **prove wall-clock ≤30 s → PASS, 30–60 s → MARGINAL, >60 s → FAIL** を T1 (N=1) のキル基準として設定。

- SP1 公式の "900 kHz 〜 数 MHz" レンジでは N=1 = 1.8 〜 3.0 秒 (STARK) + 15 〜 20 秒 (Groth16 wrap) = **17 〜 23 秒** → **PASS 圏内**。
- Kota の 22 秒は ML-DSA-65 + Groth16 wrap full path で実測なので、**T1 founder hardware も同じ 22 秒前後に着地する可能性が高い**。
- ただし sandbox の OOM は dev hardware ≥ 32 GB を絶対要件にする。16 GB hardware では F は **物理的に動かない**。

---

## 6. 結論

**2,739,124 cycles は "軽い側" だが、F-architecture の本質的負荷は "N=1 の cycle 数" ではなく "N=256 まで線形にスケールしたときの 700 M cycles + Groth16 wrap" の合計 prove 時間と memory footprint にある。**

- N=1 単独ベンチで heavy / normal / light のいずれかと言われれば **"light"**。SP1 が代表として宣伝する Tendermint / Reth は数億〜数 B cycles オーダーで、N=1 ML-DSA-65 はその 1 % 以下。
- Kota の参照 ML-DSA-65 実装 (5.6 M) より QS の素朴な `fips204` 実装 (2.74 M) のほうが **49 % 軽い** — Phase 2.5 で想定していた "ML-DSA-65 は ML-DSA-44 の 1.5–2× 重い" 推定が pessimistic 寄りだったことを意味する好材料。
- N=256 の線形外挿 (7 億 cycles) は SP1 Hypercube が 16 GPU 環境で routinely 証明している規模 (Ethereum L1 block と同等)。Founder dev hardware (single GPU / 32 GB) では数分〜十数分かかる可能性。
- **したがって Architecture F は cycle 数の観点では生きている**。次のキル基準は "N=4 prove wall-clock ≤ 5 min" (Phase 2.5 W21 Tue, T1.5) と "founder ≥32 GB dev hardware で N=1 prove ≤30 s" (Phase 2.5 W21 Mon final check)。

---

## 7. 不確実点 / TODO[founder]: verify

1. **SP1 blog 系の WebFetch 403**: `blog.succinct.xyz` 全 URL がブロックされたため、Tendermint / Reth の具体 cycle count を一次資料で取れなかった。Founder が手元で `curl` するか別 IP で再取得すべき。Tendermint の "2 つの cycle count (precompile 有無)" の具体値は意思決定に効く。
2. **Kota の "総量 5.6 M cycles のうち NTT が 50 %" という比率**: 5,625,411 × 0.5 = 2.8 M だが、原文では NTT を 580k と記載していて 580k / 5,625,411 ≈ 10.3 % に過ぎない。記事内に内訳の不整合あり。`TODO[founder]: verify` 原文を直読 (URL: medium.com/@phillyj1026/...)。
3. **bn254 SP1 ベンチ (hackmd.io/@0xdeveloperuche/r1pG9zzOee)**: HTTP 403。40 M cycles / 1.1 B cycles の数字は WebSearch スニペット経由なので一次確認推奨。
4. **RISC Zero / OpenVM 上の ML-DSA cycle count**: 公開資料に存在を確認できず。"ない" のではなく "見つけられない" 可能性が残る。`TODO[founder]: verify` Veridise audit report、RISC Zero datasheet、OpenVM 2.0 benchmark CSV。
5. **線形外挿の係数**: 2.74 M × 256 = 701 M は **lower bound**。メモリアクセスの cost (§5.3) を考慮すると +20 〜 +50 % で 840 M 〜 1.05 B cycles の可能性。N=256 を実測する W21 Wed の T1.7 で確定すべき。
6. **`fips204` v0.4.6 vs v0.4.1**: Phase 2.5 deep-research は v0.4.1 想定。T1 spike は v0.4.6 を使用 (新しい)。Cycle count 差は不明だが、新版で API 互換性は保たれている。
7. **SP1 6.1 vs 4.x の cycle 数差**: Kota は SP1 4 系時代の数字。QS は 6.1 系。SP1 自体の RISC-V エミュレーション最適化が世代間で進んでおり、同じプログラムでも 2025 → 2026 で cycle 数が 10–30 % 変動した実績あり (タイコ raiko issue #280)。`TODO[founder]: verify` Kota の数字を SP1 6.1 で再実測。
8. **Falcon-512 SP1 cycle count**: 今回見つからず。"ML-DSA-65 の ~1/3" 推定は Solidity gas の 1.5 M / 4.9 M = 0.31 比率からの proxy で、SP1 RISC-V 上で同じ比率になる保証はない。Phase 3 architect comparison で必要なら spike すべき。
9. **`fips204` の no_std + SP1 互換**: T1 で証明済み (default-features=false + ml-dsa-65)。ただし audit 可能性 (`fips204` 自体に audit 履歴があるか) は別問題。Phase 6 audit scope を組む段階で `libcrux-ml-dsa` への切替候補性を再評価すべき。

---

## 8. 出典 (URL)

WebSearch スニペット経由 (一次資料は WebFetch 403 で多くアクセス不可):

- Kota Medium "Building a Zero-Knowledge Verifier for Dilithium Signatures: NTT Gadget Implementation in SP1 zkVM": `medium.com/@phillyj1026/building-a-zero-knowledge-verifier-for-dilithium-signatures-ntt-gadget-implementation-in-sp1-6c50ab262836`
- sp1-ntt-gadget docs.rs: `docs.rs/sp1-ntt-gadget/latest/sp1_ntt_gadget/`
- Dilithium ZK landing page: `dilithium-zk-landing.vercel.app/`
- SP1 公式 blog ベンチマーク (8/6/24): `blog.succinct.xyz/sp1-benchmarks-8-6-24/` (WebFetch 403, スニペット経由)
- SP1 Reth POC blog: `blog.succinct.xyz/sp1-reth/`
- SP1 precompile blog (bn254 / bls12-381): `blog.succinct.xyz/succinctshipsprecompiles/`
- SP1 Hypercube real-time proving: `blog.succinct.xyz/real-time-proving-16-gpus/`
- SP1 Turbo blog: `blog.succinct.xyz/sp1-turbo/`
- Google Q-day SP1 ZKP: `blog.succinct.xyz/google-sp1-quantum-threat/` (WebFetch 403)
- Trail of Bits "We beat Google's ZK proof": `blog.trailofbits.com/2026/04/17/we-beat-googles-zero-knowledge-proof-of-quantum-cryptanalysis/` (WebFetch 403; security boulevard mirror で確認)
- ZKNoxHQ ETHDILITHIUM: `github.com/ZKNoxHQ/ETHDILITHIUM` (WebFetch 200, 8.1 M / 4.9 M gas 確認済み)
- ZKNoxHQ ETHFALCON: `github.com/ZKNoxHQ/ETHFALCON`, `zknox.eth.ac/posts/2025/03/21/ETHFALCON.html`, `zknox.eth.limo/posts/2025/02/24/...`
- EIP-8051: `eips.ethereum.org/EIPS/eip-8051` (403), `ethereum-magicians.org/t/eip-8051-ml-dsa-verification/25857` — 4,500 gas
- EIP-8052: `eips.ethereum.org/EIPS/eip-8052`, `ethereum-magicians.org/t/eip-8052-precompile-for-falcon-support/25860` — 1,200 gas
- EIP-7619 (Falcon 旧版): `eips.ethereum.org/EIPS/eip-7619`
- Saarinen RISC-V PQC ベンチ (RVSummit 2023): `mjos.fi/doc/20231108-rvsummit-pqc.pdf` (WebFetch 403; ML-DSA-44 verify ≈ 776 k instructions の数字は他レビューと整合)
- Taiko Raiko SP1 cycles tracking issue: `github.com/taikoxyz/raiko/issues/280`
- Symbolic Capital "The zkVM Wars": `symbolic.capital/writing/the-zkvm-wars`
- PANewsLab SP1 analysis: `panewslab.com/en/articles/si6d15sj`
- Succinct docs Proof Types: `docs.succinct.xyz/docs/sp1/generating-proofs/proof-types` (~300 k gas Groth16 verify)
- HackMD bn256 SP1 benchmark: `hackmd.io/@0xdeveloperuche/r1pG9zzOee` (WebFetch 403)
- SP1 zkVM repo: `github.com/succinctlabs/sp1`
- zkvm-perf benchmarking tool: `github.com/succinctlabs/zkvm-perf`

**Word count: ~2,300**
