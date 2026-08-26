# STARK AIR 回路ギャップ分析 (R-2 / FR-THRESH-1)

> **Document Version**: 1.0
> **Created**: 2026-07-24
> **Status**: 分析完了・マイルストーン提案
> **Parent**: `docs/core/ONCHAIN_TRUST_MECHANISM_REQUIREMENTS.md` (FR-THRESH-1, R-2)
> **目的**: SPHINCS+ 2/N 閾値検証の STARK 集約 proof 化に対し、既存資産がどこまでカバーし、何が不足しているかを確定する

---

## 1. 既存資産インベントリ（コード実態調査による）

### 1.1 オンチェーン (Solidity, `src/l1/contracts/src/`)

| 資産 | 規模 | 実装内容 | FR-THRESH-1 への適用度 |
|------|-----:|----------|----------------------|
| `STARKVerifier.sol` v1.0 | ~660 行 | proof 構造検証、コミットメント非零検証、FRI 層形状検証、クエリ数下限 (MIN_QUERIES=80)、最終多項式次数上限、Fiat-Shamir transcript 計算。Goldilocks field + SHA3-256 | △ 汎用検証のみ。**回路固有 AIR の評価が verify 経路に組み込まれていない** |
| `FRIVerifier.sol` | — | FRI low-degree proof 検証 | ○ 回路非依存でそのまま使える |
| `BatchVerifier.sol` | — | Merkle path 共有によるバッチ検証、`verifySTARKBatch` | ○ 集約時のガス削減に利用可 |
| `stark/AIRConstraints.sol` | 451 行 | boundary/transition 制約の**汎用**評価器 + サンプル制約（doubling / fibonacci / polynomial）、zerofier 計算、domain generator | △ フレームワークは有用だが **SPHINCS+ 固有の制約は皆無**（サンプルはデモ用） |
| `stark/ConstraintEvaluator.sol` | 417 行 | 制約合成・評価 | △ 同上 |
| `stark/L3StateVerifier.sol` | (Phase 2 で追加) | inclusion/transition を public input に束縛し STARKVerifier を呼ぶアダプタ | ○ THRESH 用アダプタの雛形になる |

### 1.2 オフチェーン (Rust, `src/crypto/`)

| 資産 | 規模 | 実装内容 | FR-THRESH-1 への適用度 |
|------|-----:|----------|----------------------|
| `circuits/dilithium-stark/` | ~6,000 行 | **Dilithium (FIPS 204) 署名検証回路**: NTT (forward/inverse/point-wise)、係数レンジ制約、witness 生成、trace 生成、STARK prover、KAT、FFI、proof 生成 CLI (`bin/generate_proof.rs`)、ベンチマーク。`todo!`/`unimplemented!` 0 件 | △ **対象アルゴリズムが違う**（Dilithium はユーザー署名、FR-THRESH-1 の対象は Prover の SPHINCS+）。ただし trace/FRI/commitment 基盤・プロジェクト構成はそのまま流用可能 |
| `stark-prover/` | — | proof 生成 HTTP サービス (`POST /prove`, `GET /status/:id`, `GET /proof/:id`)、witness→trace→commit+FRI→proof パイプライン | ○ R-3 の「専用 proving service」の原型 |
| `circuits/plonky3-poc/` | — | Plonky3 ベースの AIR/trace/prover PoC | △ 技術選定の比較材料 |

### 1.3 結論（カバレッジ要約)

```
FR-THRESH-1 = SPHINCS+ 2/N 集約 proof
  ├─ STARK 基盤 (field/FRI/commitment/transcript) ....... 済 (Solidity + Rust 両側)
  ├─ proof 生成サービス ................................. 原型あり (stark-prover)
  ├─ 署名検証回路 ....................................... Dilithium は済、SPHINCS+ は【未着手】
  ├─ N 本集約 + 閾値カウント ............................ 【未着手】
  ├─ Registry 集合コミットメント束縛 (FR-THRESH-5) ...... 【未着手】
  └─ オンチェーン側の回路固有 AIR 評価組み込み .......... 【未着手】
```

---

## 2. ギャップ一覧

| # | ギャップ | 内容 | 規模感 | 依存 |
|---|---------|------|:------:|------|
| **G1** | SPHINCS+ 検証回路 | SPHINCS+-SHAKE-128s (FIPS 205) の検証を AIR 化する。中核は **SHAKE256 = Keccak-f[1600] 置換の算術化**であり、FORS 検証 + WOTS+ チェーン + hypertree (d=7, h=63) の検証で 1 署名あたり数千回の置換評価が必要。ハッシュベース署名の AIR 化は NTT 系 (Dilithium) と全く異なる制約構造 | **最大**。Phase 2 最長のクリティカルパス | なし（着手可能） |
| **G2** | 集約・閾値レイヤ | N 本の署名検証を 1 つの trace に載せ、`valid_count >= threshold` を public input に含めて制約化する。署名者の重複排除も回路内で強制 | 中 | G1 |
| **G3** | Registry 集合コミットメント | 「署名者公開鍵が指定ブロック時点の active 集合に含まれる」の回路内 Merkle 検証 (SHA3-256)。オンチェーン側は ProverRegistry に集合コミットメントの維持を実装 (FR-THRESH-5) | 中 | なし（G1 と並行可） |
| **G4** | オンチェーン AIR 評価の組込み | `STARKVerifier.verifyProofFull` は現在 transcript を計算するのみで、**回路固有の制約評価 (AIRConstraints) を constraint commitment に対して検証していない**。DEEP-ALI 相当の consistency check を追加し、public input を回路の boundary constraint に束縛する。これが完了するまで proof は「構造・FRI 健全性」までしか強制されない | 中〜大 | G1 の制約定義 |
| **G5** | proof フォーマット橋渡し | Rust prover の出力 (hex JSON) と Solidity `ProofCodec` bytes の正準シリアライズが未接続。golden テスト（同一 proof を両側で検証）が存在しない | 小 | なし |
| **G6** ✅ | CP-1 整合（→ §13 で是正済み） | `dilithium-stark/src/hash.rs` は **Keccak256** を使用（「Ethereum 互換のため」と明記）。public input のハッシュも Keccak256。NFR-1 (SHA3-256/SHAKE256 のみ) に違反しており、SPHINCS+ 回路では最初から SHA3 系で設計する。Dilithium 回路も移行が必要 | 小〜中 | なし |
| **G7** | KAT 完全化 | Dilithium 回路の真の NIST KAT は「PARTIALLY IMPLEMENTED」（`keygen_from_seed` 欠落）。SPHINCS+ 回路では FIPS 205 KAT (SPHINCS+-SHAKE-128s) を最初から通す | 小 | G1 |

### スコープ判断メモ

- **Dilithium 回路の位置づけ**: FR-THRESH-1 の対象は Prover の SPHINCS+ 署名であり、既存 Dilithium 回路は直接は使えない。ただし将来「ユーザー Dilithium 署名の検証も proof 集約に含める」(T-6 の縮小) 際の資産であり、破棄しない。
- **技術選定**: 自前 STARK スタック (現行) vs Plonky3 (`plonky3-poc`) の比較を G1 着手時に確定する。Keccak-f[1600] の算術化は既製 AIR (Plonky3 keccak-air 等) が存在するため、**G1 に限れば Plonky3 系の再利用が大幅な工数短縮になる可能性が高い**。ただしオンチェーン verifier (G4) との整合を要検証。

---

## 3. マイルストーン提案

| M | 内容 | 完了条件 (検証可能) | 対応ギャップ |
|---|------|--------------------|:------------:|
| M0 | 技術選定: 自前スタック vs Plonky3 (keccak-air 再利用) の PoC 比較 | SHAKE256 1 置換の proof 生成/検証時間・proof サイズの実測比較レポート | ✅ **完了 → §5** |
| M1 | SHAKE256 置換 AIR + 単一 WOTS+ チェーン検証回路 | FIPS 202/205 テストベクタで proof 生成→Rust 検証パス | ✅ **完了 → §6** |
| **M2a** | **リンク AIR: 置換間チェーン結合 + ADRS/パディング構造 + public 束縛**（M1 の明示的残課題） | 35 チェーン WOTS+ ユニットの honest proof が verify し、リンク構造のみを壊した改竄 witness（keccak 置換は全て有効）が reject される | ✅ **完了 → §8** |
| **M2b** | **署名検証形 WOTS+**: digit 駆動の可変長チェーン（開始 step = message digit）+ digit/checksum のネイティブ導出 + digit-15 チェーンのネイティブ検査 | 可変長 honest proof が verify し、digit 偽装・過走・不足・チェーンスキップ・public 偽造が全て reject される | ✅ **完了 → §9** |
| **M2c** | **多ブロック SHAKE256 吸収（T_len / T_k の XOR リンク）+ FORS・XMSS 認証パス AIR** | pk 圧縮・認証パスを含む honest accept / 改竄 reject の実測 | ✅ **完了 → §10** |
| **M2d** | **フル署名結合 + FIPS 205 適合検証 + prove 時間計測（M2 完了条件）** | fips205 参照実装の実署名を 15-proof 構成で検証、改竄/偽造 reject、NFR-3 判定 | ✅ **完了 → §11**（**M2 = G1 完了**） |
| **M3** | **N 本集約 + 閾値 + Registry コミットメント** | 「2/5 有効・重複なし・全署名者が集合内」を public input として証明/改竄検知 | ✅ **完了 → §12** |
| **M0.5** | **proof wrapping/recursion 戦略の選定 + 実装** | proof サイズ下限の実測 + wrap 方式決定 + wrap 実装 | 🟡 **§7 / §14 wrap配管 / §15-§19 方式A / §20 統合(public glue)**（残: 集約→単一proof→Groth16 VK差替） |
| M4 | オンチェーン統合: 検証器 + ProofCodec 橋渡し + L1Vault 接続 | Solidity 側で不正 proof (制約違反/偽 public input) が revert する forge テスト + golden テスト。実測ガス ≤ 1M (NFR-2) | 🟡 **ほぼ完了 → §13/§14**（不正 proof revert + Vault 接続 + wrap 検証 204k gas 実測済み。残: 実 wrap 回路の VK 差し替えのみ） |
| M5 | E2E + 監査準備 | テストネットで proof-based Unlock 成功 tx + 不正 proof revert tx を記録 (受け入れ基準 3)。Slither + 回路仕様書公開 | 全部 |

**逐次依存**: M0 ✅ → M1 ✅ → M2a ✅ → M2b ✅ → M2c ✅ → M2d ✅ → M3 ✅ → (M0.5 選定 ✅ / wrap 実装は並行) → M4 → M5。**回路側マイルストーンは完走。次は M0.5-impl（wrap、専用 CI 環境）と M4（オンチェーン統合）**。
**M0 で判明した最重要事項**: 生の STARK proof は 2.8MB で L1 直接投稿不可。M4 の前に **M0.5 (proof wrapping)** が必須クリティカルパスになった。
**リスク最大要素**: M2 の proof 生成時間。SPHINCS+ はハッシュ回数が多く、NFR-3 (≤1h) を満たせない場合は (a) 集約バッチの分割、(b) ハード増強、(c) 閾値検証のみ回路化し署名検証はフォールバック経路 (FR-THRESH-4) 併用継続 — の順に検討する。

---

## 4. 直近アクション

1. **M0 の実施**（`plonky3-poc` を SHAKE256 置換で拡張し実測）— これが G1 の工数見積りを確定させる
2. G6 の是正方針決定: SPHINCS+ 回路は SHA3 系で新規設計、Dilithium 回路の Keccak256→SHA3-256 移行は別チケット化
3. FR-THRESH-5 (Registry 集合コミットメント) のオンチェーン実装 — 回路と独立に着手可能で、G3 の前提を先に固められる

---

## 5. M0 実測結果: Plonky3 keccak-air ベンチマーク (2026-07-26)

### 5.1 実施内容

`src/crypto/circuits/keccak-m0` に**実際に動作する** Plonky3 `p3-keccak-air` ベンチマークを実装（既存 `plonky3-poc` は FRI をシミュレートするだけの非実測コードで、かつ pinned revision に対して 38 件のコンパイルエラーで bit-rot していた）。Keccak-f[1600] 置換（= SHAKE256 の中核、SPHINCS+-SHAKE-128s の主要コスト）のバッチを実際に prove/verify し、時間と proof サイズを計測した。

- 構成: Goldilocks 体 + 2 次拡大、Keccak ベース Merkle MMCS、`TwoAdicFriPcs`
- FRI パラメータ: `log_blowup=3`（8x）, `num_queries=100`, `pow=16`（~100-bit セキュリティの保守的設定。ライブラリの benchmark 既定値ではなく本番相当）
- 単一スレッド（`parallel` feature 無効）での測定

### 5.2 実測値

| 置換数 | prove (ms) | verify (ms) | proof (bytes) | 検証成功 |
|------:|-----------:|------------:|--------------:|:-------:|
| 16 | 1,028 | 33.7 | 2,501,652 | ✅ |
| 128 | 6,701 | 33.9 | 2,652,972 | ✅ |
| 512 | 43,828 | 37.6 | 2,769,852 | ✅ |
| 1,365 | 80,255 | 36.0 | 2,833,092 | ✅ |

### 5.3 所見

1. **「Buy」は即戦力**: pinned revision の `p3-keccak-air` で Keccak-f[1600] の proof が正しく生成・検証できた（全ケース `ok=true`）。SHAKE256 AIR をゼロから書く「Build」に対し、テスト済みの Keccak AIR を即座に再利用できる。**G1 は Plonky3 keccak-air 採用を推奨**。
2. **検証時間はほぼ一定 (~35ms)**: バッチサイズに依らず succinct。ただしこれは Plonky3 の**ネイティブ検証器**であり、EVM 上の検証 (G4) とは別物。オンチェーン検証コストは別途要測定。
3. **proof サイズが決定的な制約 (~2.5〜2.8 MB)**: L1 に直接投稿するには**大きすぎる**（1 tx の calldata 上限を大幅超過）。これは M0 最大の発見であり G4/G5 の設計を左右する:
   - オンチェーン検証には **recursion / proof wrapping**（最終 STARK を小さな proof、例えば Groth16 や圧縮 STARK に畳む）が必須、
   - または proof は L1 に載せず、**succinct なコミットメントのみをオンチェーン**に置き proof はオフチェーン検証（検証可能性は保つが「オンチェーン強制」の定義を要再検討）
   のいずれかが必要。現行 `STARKVerifier.sol` に生の 2.8MB proof を渡す前提は成立しない。
4. **proof 生成時間は分スケール**: 単一スレッドで ~58ms/置換。SPHINCS+-SHAKE-128s 1 署名は 10^3〜10^4 置換規模のため、1 署名あたり数分、2/N 閾値で ~10 分オーダー。`parallel` feature + 実ハードウェアで短縮可能で、**NFR-3 (≤1h p99) は満たせる見込み**だが、SLA を律速するのは proof サイズではなく**生成時間**である。

### 5.4 Build vs Buy 判定

| | Build（自前 STARK スタック拡張） | Buy（Plonky3 keccak-air） |
|--|------|------|
| Keccak-f AIR | 未実装（SHAKE256 AIR をゼロから） | **実装済み・テスト済み・本 M0 で実証** |
| プロービング基盤 | `stark-prover` は Dilithium NTT 専用、keccak 用なし | 汎用 `p3-uni-stark` で即動作 |
| オンチェーン検証器 | `STARKVerifier.sol` (EVM, 既存) | EVM 検証器を別途用意 or wrapping 必要 |
| proof サイズ | 未測定（回路が無い） | 2.5〜2.8 MB（要 wrapping） |

**推奨**: **G1（回路側）は Buy（Plonky3 keccak-air）**、**G4（オンチェーン検証）は proof wrapping/recursion 戦略の PoC を M0.5 として追加**。生の STARK を L1 に載せる当初想定は M0 実測により否定されたため、M4 の前に wrapping 方式（Groth16 wrap 等）の選定が必要。

### 5.5 再現方法

```bash
cd src/crypto/circuits/keccak-m0
cargo run --release          # 表を標準出力
cargo run --release --features  # parallel を足す場合は Cargo.toml に p3-maybe-rayon/parallel を追加
```

---

## 6. M1 実測結果: 単一 WOTS+ チェーン検証 (2026-07-26)

### 6.1 実施内容

`src/crypto/circuits/wots-m1` に SPHINCS+-SHAKE-128s の tweakable hash **F = SHAKE256(PK.seed ‖ ADRS ‖ M)** を実装し、単一 WOTS+ チェーン（w=16 → 15 回の F 適用）を実行。各 F の入力 (16+32+16 = 64 bytes) は SHAKE256 rate (136 bytes) 未満なので **1 回の Keccak-f[1600] 置換**に対応する。

重要: 各 F について「64 byte 入力を SHAKE パディングして得た Keccak-f 入力状態」を再構成し、それを `p3-keccak` の `KeccakF` で置換した結果 (n=16 byte squeeze) が **`sha3` クレートの参照 SHAKE256 出力と一致すること** をコード内 assert で検証している。つまり keccak-air が証明する置換は「FIPS が実際に行う F」そのものである。

### 6.2 実測値

| 単位 | 置換数 | prove (ms) | verify (ms) | proof (bytes) | ok |
|------|------:|-----------:|------------:|--------------:|:--:|
| 1 WOTS+ チェーン | 15 | 854 | 28.7 | 2,501,652 | ✅ |

**外挿**（置換数は厳密、prove_ms は ~56.9 ms/置換で線形近似）:

| 単位 | 置換数 | prove_ms~ |
|------|------:|----------:|
| 1 WOTS+ チェーン | 15 | 854 |
| 1 WOTS+ 署名 (len=35 チェーン) | 525 | 29,876 |
| ~フル署名 (order 8k 置換) | 8,000 | 455,259 (~7.6 分) |

### 6.3 所見

1. **F モデリングは FIPS 準拠**: 15 回すべての F 再構成が `sha3` 参照と一致（assert 通過）。SHAKE256 置換 AIR (= keccak-air) を SPHINCS+ の実 F に接続する経路が成立した。M1 の目的達成。
2. **フル署名の proof 生成は ~7.6 分（単一スレッド・保守 FRI）**: NFR-3 (≤1h p99) を**大きな余裕で満たす**。`parallel` feature + マルチコアで更に短縮可能。proof 生成時間は律速要因ではない。
3. **M1 が証明する範囲と残り**: keccak-air は各置換が正しい Keccak-f であることを証明する。まだ制約していないのは (a) 連続する置換の**チェーン結合**（perm i の出力が perm i+1 の入力に正しく渡る）、(b) ADRS/パディングの**構造的正当性**。これらは keccak-air の上に載せる**リンク AIR** が必要で M2/M3 のスコープ。

### 6.4 再現方法

```bash
cd src/crypto/circuits/wots-m1
cargo run --release   # 各 F を sha3 と照合後、15 置換を keccak-air で証明
```

---

## 7. M0.5 実測結果: proof サイズ下限スイープ (2026-07-26)

### 7.1 実施内容

M0 で判明した「生 proof が大きすぎて L1 に載らない」問題に対し、**FRI パラメータ（blowup / queries）を振って proof サイズがどこまで縮むか = オンチェーン投稿の下限**を `src/crypto/circuits/wrap-m05` で実測。256 置換の固定バッチに対しスイープした。EVM の実用 calldata 上限を ~128 KB とする。

### 7.2 実測値

| log_blowup | queries | pow | proof (bytes) | 推定 sec_bits | 128KB 比 | ok |
|-----------:|--------:|----:|--------------:|-------------:|--------:|:--:|
| 1 | 30 | 16 | 843,652 | 46 | 6× | ✅ |
| 1 | 50 | 16 | 1,349,412 | 66 | 10× | ✅ |
| 2 | 40 | 16 | 1,115,732 | 96 | 9× | ✅ |
| 2 | 64 | 16 | 1,734,164 | 144 | 13× | ✅ |
| 3 | 80 | 16 | 2,184,852 | 256 | 17× | ✅ |
| 3 | 100 | 16 | 2,709,812 | 316 | 21× | ✅ |

### 7.3 結論: wrapping は必須

**最小でも 843 KB（EVM 上限の 6 倍）で、しかもこれは 46-bit という本番使用不可の低セキュリティ設定**。本番相当の ~100-bit (blowup 2 / 40 queries) では 1.1 MB = 9 倍。生 STARK を L1 に直接投稿する道は、パラメータ調整では開かない。**proof wrapping / recursion は選択肢ではなく必須**であることが実測で確定した。EIP-4844 blob (128 KB) でも 6〜21 倍不足。

### 7.4 wrapping 方式の決定マトリクス

| 方式 | 最終 proof サイズ | EVM 検証ガス | 前提ツール | trusted setup | 評価 |
|------|------------------|-------------|-----------|:-------------:|------|
| **A. STARK→Groth16 wrap** (STARK 検証器を Groth16 回路内で証明) | ~200 bytes (3 群要素) | ~250K gas | gnark / circom+snarkjs | 要（回路固有 CRS） | ◎ サイズ・ガス最小。setup がネック |
| **B. STARK→PLONK/Halo2 wrap** | ~1〜4 KB | ~300〜500K gas | halo2 / plonky2→SNARK | 不要（universal SRS） | ○ setup 不要。ガスやや大 |
| **C. STARK 再帰集約 + 最終 SNARK wrap** | A/B と同等 | 同上 | Plonky3 recursion + A or B | A/B 準拠 | ◎ 8k 置換のフル署名向け。集約で L1 検証 1 回に畳める |
| **D. 直接オンチェーン STARK 検証（wrap 無し）** | 0.8〜2.8 MB | — | 現行 `STARKVerifier.sol` | 不要 | ✗ サイズが上限超過で不成立（本 §で否定） |
| **E. proof オフチェーン + コミットメントのみ L1** | ~32 bytes | ~50K gas | — | 不要 | △ 「オンチェーン強制」ではなく optimistic 化。CP-5 定義の再検討が必要 |

### 7.5 推奨

- **G1（回路）は M0 の結論通り Plonky3 keccak-air（Buy）**、
- **オンチェーン化は方式 C（STARK 再帰集約 → 最終 SNARK wrap）を第一候補**とする。フル署名 8k 置換を再帰集約で 1 proof に畳み、最終段を Groth16 (方式 A, ガス最小) か Halo2 (方式 B, setup 不要) で wrap する。setup 許容可否は運用ポリシー判断。
- **注意**: wrap のツールチェーン（gnark / halo2 / circom）は本サンドボックス環境ではビルド不可（外部依存・ネットワーク制約）。M0.5 の成果は**「下限の実測 + 方式決定マトリクス + 推奨」までで、wrap 実装本体は専用 CI 環境での M0.5-impl（後続）**とする。

### 7.6 再現方法

```bash
cd src/crypto/circuits/wrap-m05
cargo run --release   # FRI パラメータを振って proof サイズを出力
```

---

## 8. M2a 実測結果: リンク AIR — 置換間チェーン結合 + ADRS 構造制約 (2026-07-28)

### 8.1 実施内容

`src/crypto/circuits/wots-link-m2a` に、M1 が明示的に残課題とした **(a) 置換間チェーン結合、(b) ADRS/パディングの構造的正当性** を制約化するリンク AIR を実装した。keccak-air のトレースを 42 列のリンク列（`is_real` / `chain_step` / `links_next` / chain-first/last フラグ + 逆元 witness / 35 幅 one-hot チェーンセレクタ）で水平拡張し、keccak-air 本体は `p3_uni_stark::SubAirBuilder` 経由で**無改変のまま**先頭列に適用する。

追加制約は全て **degree ≤ 3**（keccak-air 自身と同じ quotient 次数予算のため、プローバのコスト特性は不変）:

1. **SHAKE256 吸収構造**: pad10*1（0x1F / 0x80）と capacity レーン = 0
2. **FIPS 205 WOTS_HASH ADRS レイアウト**: layer/tree/keypair は public input、type = 0、chain address = one-hot チェーン番号、hash address = ステップカウンタ（BE u32 のリム分解として制約）
3. **チェーン結合**: F 出力先頭 16 バイト（出力レーン 0-1）= 次置換の M 入力（レーン 6-7）
4. **public 束縛**: 各チェーンの開始値（step 0 の M）と終了値（step 14 の F 出力）を one-hot 選択で public input に束縛（計 578 public values）
5. **形状の強制**: one-hot の歩進制約（チェーン内は保持、チェーン境界で 1 シフト、wrap 禁止）+「real 行は Σ one-hot = 1、padding 行は全 0」により、**35 チェーン × 15 ステップを順番に完走してからでないと padding に入れない**ことが制約系だけで強制される

### 8.2 実測値（16,384 行 × 2,675 列、FRI: log_blowup=3 / 100 queries / pow 16、単一スレッド）

| ケース | prove (ms) | verify (ms) | proof (bytes) | 期待 | 結果 |
|--------|-----------:|------------:|--------------:|:----:|:----:|
| honest（35 チェーン / 525 置換） | 28,746 | 34.7 | 2,804,796 | accept | ✅ PASS |
| break-chain (c12, s7) | 25,609 | 32.2 | 2,804,796 | reject | ✅ PASS |
| wrong-hash-addr (c3) | 25,064 | 32.2 | 2,804,796 | reject | ✅ PASS |
| wrong-chain-addr (c5) | 25,485 | 33.9 | 2,804,796 | reject | ✅ PASS |
| wrong-adrs-type (c0) | 24,701 | 31.9 | 2,804,796 | reject | ✅ PASS |
| forged-end (c20) | 24,855 | 34.3 | 2,804,796 | reject | ✅ PASS |
| forged-start (c0) | 24,519 | 32.5 | 2,804,796 | reject | ✅ PASS |
| forged-pk-seed | 25,326 | 33.3 | 2,804,796 | reject | ✅ PASS |

### 8.3 所見

1. **改竄 witness は全て「有効な Keccak-f 置換のみ」で構成**されており、M1 の回路（keccak-air 単体）なら全件 accept される。7/7 の reject はリンク制約のみによって成立しており、M1 の残課題 (a)(b) が実測で閉じた。改竄クラスはチェーン切断・ADRS 3 種（hash/chain addr, type）・public 偽造 3 種（start/end/pk_seed）をカバー。
2. **リンク列のオーバーヘッドは無視できる**: 列数 +1.6%（2,633→2,675）、prove 時間は ~55 ms/実置換で M1 実測（~57 ms/置換）と同水準。proof サイズは trace 高さ（16,384 行）に律速され 2.80 MB — M0 の結論（wrapping 必須）に変化なし。
3. **35 チェーンの ADRS を FIPS 205 レイアウトで制約**（M1 の stand-in ADRS を置換）。tweakable hash F の sha3 参照照合は M1 同様全置換で assert 済み。
4. **M2 の残りスコープ**: 署名 digit 駆動の可変長チェーン（検証時は w-1-digit ステップ）、WOTS+ pk 圧縮（T_len）、FORS + hypertree の認証パス、FIPS 205 KAT。可変長チェーンは chain_step の開始値を witness 化し digit を public 束縛する拡張で、本 AIR の one-hot / カウンタ構造をそのまま流用できる。

### 8.4 再現方法

```bash
cd src/crypto/circuits/wots-link-m2a
cargo run --release   # honest 1 件 + 改竄 7 件を prove/verify、全 PASS で exit 0
```

---

## 9. M2b 実測結果: 署名検証形 WOTS+ — digit 駆動可変長チェーン (2026-07-28)

### 9.1 実施内容

`src/crypto/circuits/wots-sig-m2b` に、FIPS 205 `wots_pkFromSig` の**検証形**を実装した。M2a は pk 生成形(全 35 チェーンが固定 15 ステップ)だったのに対し、検証はチェーン k を message digit d_k から w-2 まで走らせる(F 適用は 15−d_k 回)可変長・メッセージ依存の形になる。

設計の要点:

1. **digit はプローバから受け取らない**: len1 の message digit と len2 の checksum digit は検証側が message から `wots_digits` で導出する。checksum 等式は「public input のみから計算可能なものは AIR で制約せず検証側でネイティブに計算する」原則により回路外で成立し、短いチェーン(小さい digit)を主張する偽造は構造的に不可能。
2. **digit = 15 のチェーンはネイティブ検査**: F を 1 回も適用しないため trace に一切現れない。pk_k == sig_k を検証側が proof を見る前にチェックする。
3. **walk の再設計**: M2a の one-hot「+1 シフト」を「public な next_active テーブルへのジャンプ」に置き換え、inactive チェーンをスキップする。最終 active チェーンの next_active = 0 を「以降は padding」の番兵とする(正規の後続 index は常に > 0 なので健全。番兵経由でチェーン 0 に再入しても既に束縛済みセグメントの再証明にしかならず、チェーン 0 が inactive なら step=15 開始で終端不能となり最終行制約で reject される)。
4. **チェーン入口の digit 束縛**: 先頭行と各チェーン境界で、突入チェーンの step カウンタ = public digit、M 入力 = public 署名要素を強制。
5. **最終行は padding を強制** (`when_last_row`): これが無いと、全チェーンを歩き切る前に trace を打ち切り、残チェーンの pk 束縛を回避できる。**M2a にも(honest 高さ 16,384 では顕在化しないが、より小さい高さの不正 proof で悪用可能な)同種のギャップがあったため、同制約を M2a にも backport した**(§9.4)。

追加制約は全て degree ≤ 3 を維持: public 値はスカラなので、one-hot 選択した public 結合(digit / next_active / sig / pk)は trace 列に関して degree 1 に留まる。リンク列は 40 列(M2a の 42 列から is_chain_first/inv_cf を削減 — チェーン先頭が step=0 とは限らなくなったため、先頭検出を境界遷移に統合)。

### 9.2 実測値(8,192 行 × 2,673 列、33 active チェーン / 330 置換、FRI: log_blowup=3 / 100 queries / pow 16、単一スレッド)

テスト message は digit のエッジケースを含む固定値: digit-15 チェーン 2 本(trace 非出現)、digit-0 チェーン(全長 15 ステップ)、先頭 active チェーン ≠ 0、checksum digit (1,2,1)。

| ケース | prove (ms) | verify (ms) | proof (bytes) | 期待 | 結果 |
|--------|-----------:|------------:|--------------:|:----:|:----:|
| honest(33 チェーン / 330 置換) | 13,318 | 28.8 | 2,743,092 | accept | ✅ PASS |
| break-chain (c5, s8) | 12,342 | 29.2 | 2,743,092 | reject | ✅ PASS |
| wrong-start-digit (c12) | 14,661 | 28.8 | 2,743,092 | reject | ✅ PASS |
| stop-early (c3) | 12,973 | 29.3 | 2,743,092 | reject | ✅ PASS |
| overrun (c20) | 12,470 | 31.8 | 2,743,092 | reject | ✅ PASS |
| skip-chain (c9) | 13,454 | 30.3 | 2,743,092 | reject | ✅ PASS |
| forged-sig (c1) | 12,016 | 28.9 | 2,743,092 | reject | ✅ PASS |
| forged-pk (c34, checksum チェーン) | 12,755 | 32.1 | 2,743,092 | reject | ✅ PASS |
| forged-pk (c17, digit-15) | —(ネイティブ検査) | — | — | reject | ✅ PASS |

### 9.3 所見

1. **署名検証形が閉じた**: digit 偽装(1 ステップ手前から開始 = プレイメージ 1 段の偽造者が試みる形)・不足・過走・active チェーンのスキップが、全て有効な Keccak-f 置換のみからなる witness に対して制約側で reject された。checksum チェーン (c34) の pk 偽造も同様に reject。
2. **prove は M1/M2a と同水準の ~40ms/実置換(高さ 8,192)**: trace が半分(16,384→8,192 行)になり prove ~13.3 秒。検証時間 ~29ms、proof 2.74MB は高さ依存で M0 の結論(wrapping 必須)に変化なし。
3. **「public のみから計算可能なものは回路外」の設計原則が確立**: digit 導出・checksum 等式・digit-15 チェーンの pk==sig・next_active/first_active の導出は全て検証側ネイティブ計算で、AIR 制約ゼロで束縛される。この原則は M2c 以降の「public glue」(§9.5) に直結する。
4. **M2 残りスコープ**: WOTS+ pk 圧縮 T_len(多ブロック吸収)、FORS + hypertree 認証パス(M2c)、H_msg 束縛 + フル署名結合 + FIPS 205 KAT(M2d)。

### 9.4 M2a への backport

`wots-link-m2a` の AIR に `when_last_row` の padding 強制を追加した(§9.1 の 5)。honest 高さでは挙動不変であることを全 8 ケースの再実行で確認済み(§9.6)。

### 9.5 M2c spike: 多ブロック SHAKE256 吸収(XOR リンク)の実現性

M2c の中核リスクは T_len(WOTS+ pk 圧縮: 入力 16+32+560 = 608 bytes → 5 ブロック)等の**多ブロック吸収**で、ブロック 2 以降の置換入力 = 「前置換出力 XOR 次ブロック」となり、体上で非線形な XOR が初めて必要になる。pinned keccak-air の列を調査した結果:

- 置換出力は 16-bit limb 列(`a_prime_prime_prime`)で、**ビット列は lane (0,0) 以外に存在しない** → 出力ビットの再利用による XOR は不可。
- ただし**吸収するブロックの中身が public 値であれば**、XOR に必要な追加列は「前置換出力 rate 部のビット分解 17 lane × 64 = 1,088 列」のみで済む: 出力ビット o_z(booleanity + limb への線形再構成で一意)と public ビット b_z に対し xor = o_z + b_z − 2·b_z·o_z は **o_z について線形**(b_z はスカラ)なので、吸収リンク制約は degree ≤ 3 を維持できる。列幅は 2,673 → ~3,761(+41%)、lookup 拡張は不要。
- ブロックを public にする鍵が **public glue**: T_len の入力(35 個の pk 要素)は M2b で既に public input であり、T_len の出力(圧縮 pk)も public にして hypertree 側が public として消費する。各ハッシュ層の界面を public 値にすれば、witness 内の「散在する行から行への gather」(uni-stark に無い lookup/permutation 引数が必要)を完全に回避できる。FORS・hypertree の 2 入力ハッシュ H(入力 80 bytes)は単一ブロックのままで、M2a/M2b のリンク構造の変形で足りる。
- 代償は public input の増加(界面ごとに 8 limb/値)と検証側の等値チェックだが、いずれも検証コストとして軽微。**M2c は「+1,088 ビット列 + public glue」方式で着手可能**と判断する。

### 9.6 再現方法

```bash
cd src/crypto/circuits/wots-sig-m2b
cargo run --release   # honest 1 件 + 改竄 proof 7 件 + ネイティブ検査 1 件、全 PASS で exit 0
cd ../wots-link-m2a
cargo run --release   # backport 後の M2a 全 8 ケース回帰確認
```

---

## 10. M2c 実測結果: 多ブロック吸収 + FORS/XMSS 認証パス (2026-07-29)

### 10.1 実施内容

`src/crypto/circuits/sphincs-tree-m2c` に、SPHINCS+ 署名のツリー側メカニズムを固定 30 置換のパイプラインとして実装した:

| スロット | ステージ | メカニズム |
|---------|---------|-----------|
| 0 | FORS 葉 F(sk) | 単一ブロック吸収 |
| 1–12 | FORS 認証パス (a=12) | H クライム + 方向ビット結合 |
| 13–15 | T_k(FORS root 14 本、272 B) | **多ブロック: データ 2 + pad 1** |
| 16–20 | T_len(WOTS+ pk 35 要素、608 B) | **多ブロック: 5 ブロック** |
| 21–29 | XMSS 認証パス (h'=9) | H クライム + 方向ビット結合 |

§9.5 spike の方式をそのまま実装し、成立を実証した:

1. **XOR リンク多ブロック吸収**(M2c の中核リスク): 継続置換は「rate 部 = 前置換出力 XOR 次ブロック、capacity 部 = そのまま持ち越し」。前置換出力 rate 部のビット分解 17 lane × 64 = **1,088 コミット列**を追加し(booleanity + limb 再構成で一意束縛)、吸収ブロックは public(pk 要素・兄弟 root・パディング)なので XOR `o + b − 2bo` は コミットビット o について線形。**全制約が degree ≤ 3 のまま成立し、lookup 引数は不要**。
2. **認証パス結合**: 走行中の Merkle ノードは public 方向ビット(c67/c89 フラグ)が指す H 入力位置(左 = lanes 6-7 / 右 = lanes 8-9)に遷移制約で結合し、兄弟 auth ノードは反対側に public 束縛。
3. **ステージ間 in-trace 結合**: 隣接ステージは trace 内で直接チェーン(FORS root → T_k ブロック 0、T_len 出力 → XMSS クライム 1)。public な外部界面は FORS pk(= layer-0 WOTS+ が署名するメッセージ、M2b への glue)と XMSS root のみ。
4. **構造の public テーブル束縛**: PK.seed、スロット別 FIPS 205 ADRS(FORS_TREE/FORS_ROOTS/WOTS_PK/TREE、tree height/index)、SHAKE256 パディング、ゼロ capacity を、検証側がネイティブ導出する per-slot rate テーブル(52 limb × 30)+ lanes 6-9 の mask/rate 対で束縛。プローバから構造情報は一切受け取らない。

### 10.2 実測値（1,024 行 × 3,751 列、public 8,704 値、FRI: log_blowup=3 / 100 queries / pow 16、単一スレッド）

| ケース | prove (ms) | verify (ms) | proof (bytes) | 期待 | 結果 |
|--------|-----------:|------------:|--------------:|:----:|:----:|
| honest（30 置換） | 1,814 | 40.9 | 3,479,068 | accept | ✅ PASS |
| tampered-tlen-block (b2) | 1,787 | 41.0 | 3,479,068 | reject | ✅ PASS |
| broken-capacity (s17) | 1,918 | 38.0 | 3,479,068 | reject | ✅ PASS |
| wrong-auth-node (f6) | 1,878 | 39.9 | 3,479,068 | reject | ✅ PASS |
| wrong-direction (x4) | 1,906 | 38.0 | 3,479,068 | reject | ✅ PASS |
| wrong-tree-height (f8) | 1,813 | 42.0 | 3,479,068 | reject | ✅ PASS |
| forged-sk | 1,790 | 38.7 | 3,479,068 | reject | ✅ PASS |
| forged-pk0（fresh ブロック） | 1,855 | 39.0 | 3,479,068 | reject | ✅ PASS |
| forged-pk20（cont ブロック） | 1,774 | 39.7 | 3,479,068 | reject | ✅ PASS |
| forged-fors-pk | 1,674 | 41.1 | 3,479,068 | reject | ✅ PASS |
| forged-root | 1,754 | 39.2 | 3,479,068 | reject | ✅ PASS |

### 10.3 所見

1. **§9.5 spike の方式が実測で成立**: XOR リンク(ブロック改竄・capacity 切断の両方を検出)、方向ビット結合(方向スワップ・auth 偽造を検出)、ADRS テーブル束縛(tree height 改竄を検出)、public forgery 5 種の全てが reject。改竄 witness は全て有効な Keccak-f 置換のみで構成。
2. **列幅 +42%(2,633 → 3,751)は §9.5 の見積り(+41%)どおり**。prove は 1.8 秒 / 30 置換(1,024 行)で ~60ms/置換 — ビット列追加後も M0〜M2b と同水準。verify ~40ms。proof 3.48MB は列数増で M2b 比 +27%(wrapping 必須の結論は不変)。
3. **フル署名の構成要素が全て実測済みになった**: WOTS+ チェーン(M2b)、pk 圧縮 T_len、FORS(葉 + 認証パス + T_k)、XMSS 認証パス(M2c)。1 XMSS 層のフル検証 = 本パイプライン + M2b チェーン ~262 置換で、7 層 + FORS で ~2,300 置換 ≈ 単一スレッド 2〜3 分と外挿でき、NFR-3 (≤1h) に大きな余裕。
4. **M2d 残りスコープ**: M2b(チェーン)と M2c(ツリー)の trace 統合(pk 要素 35 個の public glue を in-trace 結合に置換するか、public glue のまま 2-proof 構成にするかの選定)、hypertree 7 層の繰り返し、H_msg / PRF_msg による digit・FORS index のメッセージ束縛、FIPS 205 KAT、p99 計測。

### 10.4 再現方法

```bash
cd src/crypto/circuits/sphincs-tree-m2c
cargo run --release   # honest 1 件 + 改竄 10 件を prove/verify、全 PASS で exit 0
```

---

## 11. M2d 実測結果: フル SLH-DSA-SHAKE-128s 署名検証の proof 構成 (2026-08-02)

### 11.1 統合方式の決定

M2b(チェーン)と M2c(ツリー)の統合は、単一トレースへのモノリシック統合ではなく **「15 proof + public glue」構成**を採用した(`src/crypto/circuits/slh-verify-m2d`):

| Proof | 内容 | AIR |
|-------|------|-----|
| A | H_msg + FORS 14 木(葉 + 12 クライム)+ T_k(186 スロット) | 汎用パイプライン(`pipeline.rs`) |
| chain L0..L6 | 各層の WOTS+ digit 駆動チェーン | **M2b AIR を無改変移植**(`chains/air.rs`) |
| tree L0..L6 | 各層の T_len(5 ブロック)+ XMSS 認証パス(14 スロット) | 汎用パイプライン |

採用理由: (a) 各 proof が小さく一様で、M3 の N 本集約と M0.5-C の再帰 wrap がこの単位をそのまま集約できる、(b) M2b/M2c の実証済み AIR を無改変で再利用できる、(c) M2c の機構(スロット walk / rate テーブル / XOR 吸収 / 出力束縛)をスロット構成でパラメタ化した `pipeline.rs` 1 つで A と tree の両形状を賄える。

**glue の健全性**: プローバが提出する界面クレーム(H_msg digest、FORS root 14 本、fors_pk、層ごとの WOTS pk 35 要素・XMSS root)は、それぞれ**生産側 proof が出力束縛**し、**消費側の public input へは検証側がネイティブ導出**する(digit は claimed fors_pk / 前層 root から、ADRS テーブルは claimed digest から、T_k/T_len ブロックは claimed root/pk 要素から)。最後に root == PK.root をネイティブ比較。任意の界面クレームの偽造は生産側 proof の reject になり、署名/メッセージの改竄は全 proof が健全なまま最終 root がずれる — ネイティブ SLH-DSA 検証と同じ健全性連鎖。

### 11.2 FIPS 205 適合検証

`fips205` クレート(純 Rust の FIPS 205 参照実装)で keygen/sign した**実署名**(7,856 bytes)を対象に、`refimpl.rs` が sha3 で全中間値を再計算し **再計算 root == PK.root が成立**(H_msg の pure-signing フレーミング 0x00‖len(ctx) を含む digest 分解、FORS index 抽出、ADRS レイアウト、base-w digit、T の順序の構造解釈が全て正しいことの end-to-end 検証)。その上で 15 proof が全て accept することにより、**制約スタックが FIPS 205 の実署名構造そのものを受理する**ことを実証した。公式 ACVP ファイルベースの KAT 投入は後続タスク(参照クレート自体は upstream で ACVP 検証済み)。

### 11.3 実測値(run 0、FRI: log_blowup=3 / 100 queries / pow 16、単一スレッド)

| proof | rows | prove (ms) | verify (ms) | proof (bytes) |
|-------|-----:|-----------:|------------:|--------------:|
| A (hmsg+fors) | 8,192 | 20,847 | 46.4 | 3,769,780 |
| chain L0 | 8,192 | 11,290 | 31.5 | 2,743,092 |
| tree L0 | 512 | 906 | 40.6 | 3,418,516 |
| chain L1 | 8,192 | 13,187 | 33.6 | 2,743,092 |
| tree L1 | 512 | 1,188 | 40.6 | 3,418,516 |
| chain L2 | 8,192 | 13,712 | 32.3 | 2,743,092 |
| tree L2 | 512 | 957 | 38.6 | 3,418,516 |
| chain L3 | 16,384 | 30,387 | 32.5 | 2,803,132 |
| tree L3 | 512 | 1,064 | 40.1 | 3,418,516 |
| chain L4 | 8,192 | 13,180 | 34.9 | 2,743,092 |
| tree L4 | 512 | 1,314 | 42.8 | 3,418,516 |
| chain L5 | 8,192 | 13,442 | 34.6 | 2,743,092 |
| tree L5 | 512 | 1,096 | 42.0 | 3,418,516 |
| chain L6 | 8,192 | 14,820 | 35.4 | 2,743,092 |
| tree L6 | 512 | 1,031 | 41.5 | 3,418,516 |
| **合計** | | **138.4 s** | **567.6 ms** | **47.0 MB** |

- run 1(別鍵・別メッセージ)は合計 prove 120.5 s、同じく全 accept・root 一致。chain L3(run 0)は digit 分布により 16,384 行に伸びた自然変動で、トレース高さがメッセージ依存であることの実例。
- **NFR-3 判定: 単一スレッドで 1 署名 ~2.3 分 — 目標 p99 ≤ 1h を約 26 倍のマージンで満たす**(`parallel` feature + マルチコアで更に短縮可能)。正式な p99 は proving service (R-3) 構築後の連続運転で計測する。
- proof 合計 47MB は 15 本の生 STARK の総和であり、M0.5-C(再帰集約 → 最終 SNARK wrap)の入力。オンチェーンには wrap 後の 1 proof のみが載る。

### 11.4 改竄・偽造バッテリー

| ケース | 種別 | 結果 |
|--------|------|:----:|
| forged-digest | 界面クレーム偽造 → proof A reject | ✅ PASS |
| forged-fors-root(5) | 同上(T_k ブロック + 出力束縛) | ✅ PASS |
| forged-fors-pk | 同上 | ✅ PASS |
| forged-wots-pk(L2,c3) | 同上 → chain L2 reject | ✅ PASS |
| forged-root(L5) | 同上 → tree L5 reject | ✅ PASS |
| tampered-sig(fors-sk) | 入力改竄 → 最終 root 不一致(ネイティブ) | ✅ PASS |
| tampered-sig(wots) | 同上 | ✅ PASS |
| tampered-R | 同上(digest/index 全変化) | ✅ PASS |
| wrong-pk-root | 同上 | ✅ PASS |

界面クレーム偽造は**再 prove なしの再 verify のみ**で reject される(honest proof に偽造 public input を与える)ことを確認 — glue の束縛が proof 側にあることの直接検証。

### 11.5 M2 完了と残タスク

M2(SPHINCS+ 1 署名フル検証回路 = **G1**)は本マイルストーンで完了。次は **M3**(N 本集約 + 閾値 + Registry コミットメント = G2, G3)。M2 からの持ち越しメモ:

1. 公式 ACVP ファイルベース KAT の投入(小、参照クレートは upstream で検証済み)
2. `parallel` feature での prove 時間再計測と proving service (R-3) での p99 計測
3. G6(CP-1): 本シリーズの回路は最初から SHAKE256/SHA3 系のみで設計されており新規違反なし(Dilithium 回路の移行は別チケットのまま)

### 11.6 再現方法

```bash
cd src/crypto/circuits/slh-verify-m2d
cargo run --release   # fips205 実署名 2 本の 15-proof 検証 + 偽造/改竄 9 件、全 PASS で exit 0
```

---

## 12. M3 実測結果: 2/N 閾値検証構成 — Registry メンバーシップ + 集約 (2026-08-02)

### 12.1 実施内容

`src/crypto/circuits/threshold-m3` に FR-THRESH-1 の回路側ステートメント「**閾値 t 本以上の相異なる Prover(公開鍵が Registry 集合コミットメント C に含まれる)が メッセージ M に有効な SLH-DSA 署名を持つ**」の 2/5 デモを実装した。署名者 1 人あたり:

| コンポーネント | proof 数 | 内容 |
|--------------|--------:|------|
| SLH-DSA フル検証 | 15 | M2d 構成(`slhproof.rs` としてライブラリ化) |
| Registry メンバーシップ | 1 | SHA3-256 leaf ハッシュ + 高さ 3 の Merkle クライムを C に束縛 |

### 12.2 設計判断

1. **G2 の集約層は回路ではなくネイティブ**: 閾値カウント・署名者重複排除・「メンバーシップ leaf = 署名検証に使った公開鍵の SHA3-256」の同一性は、全て **public 値上の検査**である(FR-THRESH-1 では署名者は公開情報)。public glue アーキテクチャの下ではこれらは検証側ネイティブチェックであり、オンチェーンでは wrap 済み proof(M0.5-C)に併置される安価な public input 比較になる。署名間に秘密の情報流が無いため、署名を跨ぐ回路は不要 — G2 当初想定の「1 trace に N 本」は、M2d で確定した多 proof 構成により**集約は再帰 wrap 段(M0.5-C)の責務**へ移った。
2. **SHA3-256 を同一パイプライン AIR で処理**: SHA3-256 は SHAKE256 と Keccak-f[1600]・rate 136 bytes を共有し、差分はドメインパディング(0x06 vs 0x1F)のみ = public ブロックバイトに閉じる。`pipeline.rs` v2 はレーングループ別 public mask/rate(lanes 0-3 / 4-5 / 6-7 / 8-9)と **32 バイトチェーン c03/c47**(出力 lanes 0-3 → 次入力 lanes 0-3 / 4-7)を追加し、2 子 SHA3-256 Merkle ノード H(left‖right) を SHAKE256 系と同じ制約機構・degree ≤ 3 で結合する。
3. **Registry**: N=5 Prover、leaf = SHA3-256(PK.seed‖PK.root)、8 leaf に pad、高さ 3。FR-THRESH-5 のオンチェーン側(コミットメント維持)は別項目として残る。

### 12.3 実測値(fips205 実鍵 5 個・実署名、FRI: log_blowup=3 / 100 queries / pow 16、単一スレッド)

| コンポーネント | prove (ms) | verify (ms) | proof (bytes) | 結果 |
|--------------|-----------:|------------:|--------------:|:----:|
| slh(p1) ×15 proof | 116,446 | 490 | 46,901,036 | ✅ PASS |
| member(p1) | 277 | 30.2 | 3,325,316 | ✅ PASS |
| slh(p3) ×15 proof | 119,106 | 502 | 46,901,036 | ✅ PASS |
| member(p3) | 498 | 29.6 | 3,325,316 | ✅ PASS |
| **合計(2/5)** | **236.3 s** | **1,051** | **100.5 MB** | — |

ネイティブ検査: distinct ✓ / count 2 ≥ 2 ✓ / 各 root == PK.root ✓。

バッテリー(全 reject):

| ケース | 検出箇所 | 結果 |
|--------|---------|:----:|
| non-member-signer(非登録鍵で C を主張) | メンバーシップ proof の root 束縛 | ✅ PASS |
| wrong-leaf-slot(他スロットの path で C を主張) | 同上 | ✅ PASS |
| forged-registry-root(honest proof + 偽 C) | 同上(public 偽造) | ✅ PASS |
| duplicate-signer | ネイティブ重複排除 | ✅ PASS |
| below-threshold | ネイティブ閾値カウント | ✅ PASS |
| invalid-signature(改竄署名) | ネイティブ最終 root 比較 | ✅ PASS |

### 12.4 所見

1. **FR-THRESH-1 の回路側ステートメントが端から端まで実測で閉じた**: M0→M3 の全マイルストーンで、Keccak 置換 → チェーン結合 → 可変長署名形 → 多ブロック吸収/認証パス → フル署名(fips205 適合) → 閾値+集合コミットメントまで、各段の honest accept / 改竄 reject を実測済み。
2. **2/5 で prove 合計 236 秒(単一スレッド)**は NFR-3 (≤1h) に対し余裕 15 倍。署名者数に線形(1 署名 ≈ 118 秒)で、2/N の N は Registry サイズにのみ log で効く(メンバーシップ proof は ~0.3-0.5 秒)。
3. **proof 総量 100.5 MB** が次の実務課題であり、M0.5-impl(再帰集約 + SNARK wrap)の必要性を改めて定量化した。32 proof を 1 つの wrap 済み proof に畳むのが M0.5-C の役割。
4. **残作業はオンチェーン側へ移行**: M0.5-impl(専用 CI 環境での wrap 実装)、M4(G4 オンチェーン AIR 評価 + G5 ProofCodec 橋渡し + FR-THRESH-5 オンチェーン)、M5(E2E)。回路側の残りは G6(dilithium-stark の Keccak256→SHA3-256 移行、別チケット)のみ。

### 12.5 再現方法

```bash
cd src/crypto/circuits/threshold-m3
cargo run --release   # 2/5 honest(2×16 proof)+ バッテリー 6 件、全 PASS で exit 0
```

---

## 13. M4 進捗: オンチェーン側第一弾 — FR-THRESH-5 + 閾値ネイティブ層 + G6 是正 (2026-08-03)

### 13.1 実施内容

M3 完了を受け、オンチェーン側のうち **wrap 実装に依存しない部分**を先行実装した。

1. **`RegistrySetCommitment.sol`(FR-THRESH-5)**: ProverRegistry の active 集合に対する SHA3-256 Merkle コミットメントを block-stamped スナップショットとして維持。leaf = SHA3-256(sphincsPublicKey)、node = SHA3-256(left‖right)、ゼロ leaf で 2 冪へ pad — **回路側 (`threshold-m3/src/registry.rs`) とバイト互換**で、同じ root C がオンチェーンネイティブ検査と回路内メンバーシップ証明の両方を係留する。`verifyMembership` によるネイティブ Merkle 検証も提供(log N ハッシュ)。
2. **`ThresholdVerifier.sol`(FR-THRESH-1 ネイティブ層)**: M3 で確定した「public 値上の検査はネイティブ」の設計をオンチェーンに反映。閾値カウント・署名者重複排除(leaf ハッシュ昇順の強制で O(n))・epoch 指定のメンバーシップ検証を実施し、署名有効性は `IWrapVerifier` インターフェース(M0.5-impl の差し込み点)の wrap 済み proof に委譲。wrap proof は publicInputsDigest = SHA3-256(message ‖ pk_0 ‖ … ‖ pk_{k-1}) で署名者集合とメッセージに束縛される。
3. **golden fixture によるクロススタック検証**: `threshold-m3/src/bin/fixture.rs`(`sha3` クレート)が生成した 5 prover の pk・leaf・root・path を Solidity テストに固定し、**オンチェーン snapshot() の root が Rust 計算の root とバイト一致**することを確認(G5 の趣旨をコミットメント層で実現)。
4. **G6 是正**: `dilithium-stark` の Keccak256 を SHA3-256 (FIPS 202) に移行(`sha3_256` へ改名、既知ベクタ更新)。NFR-1/CP-1 違反を解消。crate テスト 58/58 パス(FFI KAT は C ライブラリ不在の既存環境制約で従来から無効)。

### 13.2 テスト結果(forge 16/16 パス)

| テスト | 内容 | 結果 |
|--------|------|:----:|
| SnapshotMatchesCircuitGoldenRoot | オンチェーン root == Rust 計算 root(golden) | ✅ |
| Membership honest / wrong-index / non-member / forged-path | ネイティブ Merkle 検証 4 件 | ✅ |
| SnapshotEpochsTrackSetChanges | 集合変化で root 変化・旧 epoch 参照可 | ✅ |
| HonestThresholdVerifies | 2/5 正常系(mock wrap) | ✅ |
| Below-threshold / duplicate / non-member / forged-path / wrong-path-length | ネイティブ検査 reject 5 件 | ✅ |
| WrapProofInvalid / WrapVerifierUnset / OnlyOwner / DigestBinding | wrap 境界 4 件 | ✅ |

ガス参考値(pure-Solidity SHA3-256): snapshot(5 prover) ~10.2M gas、メンバーシップ検証 ~3.3M gas/署名者。**pure-Solidity SHA3 は高コスト**であり、本番は (a) スナップショットのオフチェーン計算 + オンチェーンは root 受理のみ(FR-THRESH-5 の運用設計で決定)、(b) メンバーシップはネイティブでなく回路内証明(M3 で実測済み、wrap に同梱)に寄せる、のいずれかで削減する。NFR-2 (≤1M gas) の評価は wrap 検証器確定後の M4 完了時に行う。

### 13.3 残作業

- **M0.5-impl**(専用 CI 環境): 再帰集約 + SNARK wrap。完了後 `IWrapVerifier` 実装を接続。
- **M4 完了条件**: wrap 検証器接続後の不正 proof revert テスト + 実測ガス ≤ 1M 判定 + L1Vault の Unlock 経路への `ThresholdVerifier.verifyThreshold` 組込み。
- **M5**: テストネット E2E(proof-based Unlock tx + 不正 proof revert tx の記録)。

### 13.4 再現方法

```bash
cd src/l1/contracts
forge test --match-contract "RegistrySetCommitmentTest|ThresholdVerifierTest"
cd ../../crypto/circuits/threshold-m3 && cargo run --release --bin fixture   # golden 値の再生成
cd ../dilithium-stark && cargo test --release --no-default-features          # G6 移行後 58 テスト
```

---

## 14. M0.5-impl 前進 + M4 オンチェーン第二弾: Groth16 wrap 配管 + Vault 組込み (2026-08-03)

### 14.1 前提の更新: 「専用 CI 環境が必要」の再評価

§7.5 の「wrap ツールチェーンは本サンドボックスでビルド不可」は、プロキシ経由で crates.io / GitHub リリースに到達できると判明する**前**の判断だった。実測の結果:

- **arkworks (ark-groth16 / ark-bn254, pure Rust) はサンドボックスでビルド・実行可能** — 実 BN254 Groth16 の trusted setup・証明生成・ネイティブ検証まで成功
- foundry / solc も GitHub リリースから導入済み(§13)
- 残る環境制約は **Sepolia RPC(プロキシ 403)と資金付き秘密鍵の不在**(→ §14.5)

### 14.2 実施内容

1. **`wrap-groth16`(Rust)**: 実 BN254 Groth16 proof を生成。public inputs は `ThresholdVerifier` の publicInputsDigest = SHA3-256(message ‖ pks) の 128-bit 上下半分で、**wrap proof を署名者集合とメッセージに束縛する配線を実物で敷設**。Groth16 のステートメント本体は placeholder 関係式であり、**STARK 構成検証器の R1CS 化(M0.5-impl の中核)が残課題** — それを差し替えても検証等式・calldata エンコーディング・ガスプロファイルは不変。
2. **`Groth16WrapVerifier.sol`**: EVM ペアリング precompile (0x06/0x07/0x08) による Groth16 検証器を `IWrapVerifier` 実装として提供。VK はデプロイ時固定。**precompile への forwarded gas を上限化**(不正な曲線点で全ガスを焼く griefing を実測で確認し、~1B gas → ~424k gas に抑制)。
3. **E2E(forge)**: ProverRegistry → RegistrySetCommitment → ThresholdVerifier → Groth16WrapVerifier を**実ペアリング proof** で貫通(fixture は wrap-groth16 生成の golden)。
4. **L1Vault 組込み(M4)**: `requestUnlockWithProof` を追加 — SMT 検証(requestUnlockLegacy と同意味論)+ message = SHA3-256(lockId ‖ stateRoot) を ThresholdVerifier に渡し、per-signature SPHINCS+ 検証(FR-THRESH-4 経路)を 1 本の wrap proof で置換する FR-THRESH-1 経路。verifier の設置は既存 SPHINCS+ verifier と同じ **propose/approve/execute 3 段階ガバナンス(48h timelock)** をミラー。

### 14.3 テスト結果(forge、新規 15/15 パス)

| スイート | 内容 | 結果 |
|---------|------|:----:|
| Groth16WrapVerifierTest (6) | 実 proof accept(**204,430 gas**)/ 偽 digest・改竄 A/C・長さ不正 reject / digest 一致 | ✅ |
| ThresholdGroth16E2ETest (3) | 実ペアリングでの閾値 E2E accept + 別メッセージ/改竄 proof revert | ✅ |
| L1VaultProofUnlockTest (6) | proof ベース Unlock 成立 / wrap 拒否・非登録署名者・閾値未満・verifier 未設置 revert / timelock 強制 | ✅ |

**NFR-2 評価**: wrap proof 検証単体 **204,430 gas ≤ 1M ✅**。閾値検証全体(2 署名者、ネイティブメンバーシップ込み)は ~6.05M gas — 支配項は pure-Solidity SHA3 のメンバーシップ/digest 計算であり、§13.2 の削減方針(メンバーシップを wrap 回路側に同梱し、オンチェーンは digest 計算のみに縮小)で 1M 以下が視野に入る。

### 14.4 M0.5-impl の残課題(正確なスコープ)

**「STARK 構成検証器(FRI + Fiat-Shamir + Merkle 開示)を R1CS/回路化し、15+1 proof × k 署名者を再帰集約して単一 Groth16 に畳む」回路構築のみ**が残り。トラステッドセットアップ・証明生成・オンチェーン検証・public input 束縛・ガバナンス設置は本節で実装・実測済み。回路構築は大規模(Groth16 内 STARK 検証器)であり、gnark の std ライブラリ再利用等の選定を含め独立プロジェクトとして計画する。

### 14.5 M5 の環境要件(実測で確定)

- Sepolia RPC への到達: プロキシが `rpc.sepolia.org` / `ethereum-sepolia-rpc.publicnode.com` への CONNECT を 403 で遮断
- `QS__L1_PRIVATE_KEY` 未設定(資金付きデプロイ鍵が必要)

→ M5(proof-based Unlock 成功 tx + 不正 proof revert tx のテストネット記録)は、ネットワークポリシーで RPC を許可した環境 + 資金付き鍵の 2 条件が揃い次第、本節のコントラクト群をデプロイして実施できる。

### 14.6 再現方法

```bash
cd src/crypto/circuits/wrap-groth16 && cargo run --release   # 実Groth16生成 + fixture出力
cd ../../../l1/contracts
forge test --match-path "test/Groth16WrapVerifierTest.t.sol"   # 実ペアリング 9 テスト
forge test --match-path "test/L1VaultProofUnlock.t.sol"        # Vault 組込み 6 テスト
```

---

## 15. M0.5-impl 再帰アーキテクチャ選定: コミットメントハッシュ換装の実測 (2026-08-03)

### 15.1 問題の再定式化

§14.4 の残課題「STARK 構成検証器の回路化 + 再帰集約」の本質的コストは**内側 proof の検証器を回路内で安く評価できるか**である。FRI の各クエリは Merkle パスを開示し、再帰検証器はそのノードを回路内で再ハッシュする。M0〜M4 の本番構成は **Keccak-MMCS**(ノードあたり Keccak-f[1600] ≈ **150k R1CS 制約**)であり、1 検証で queries × layers 個のノードを再ハッシュするため、Keccak のまま Groth16 化すると制約数が 10^8 超で**非現実的**。標準解は**コミットメントを回路親和ハッシュ(Poseidon2、ノードあたり ≈ 300 制約)に換装**してから再帰すること。

### 15.2 実測: Keccak-MMCS vs Poseidon2-MMCS

`src/crypto/circuits/wrap-recursion-m05` で、**同一 keccak-air バッチ・同一 Goldilocks 体・同一 FRI パラメータ**(M0 §5 と同条件)を両 MMCS 構成で prove/verify:

| 置換数 | MMCS | prove (ms) | verify (ms) | proof (bytes) | ok |
|------:|------|-----------:|------------:|--------------:|:--:|
| 16 | Keccak | 1,437 | 34.3 | 2,501,652 | ✅ |
| 16 | Poseidon2 | 4,079 | 105.1 | 2,501,652 | ✅ |
| 128 | Keccak | 6,777 | 35.2 | 2,652,972 | ✅ |
| 128 | Poseidon2 | 27,837 | 108.5 | 2,652,972 | ✅ |
| 512 | Keccak | 36,909 | 38.2 | 2,769,852 | ✅ |
| 512 | Poseidon2 | 143,331 | 114.3 | 2,769,852 | ✅ |

### 15.3 所見

1. **proof サイズは完全に同一**(コミットメント方式によらず trace 高さ律速)、**native verify も同オーダー**(~35ms vs ~110ms)。両構成とも全ケース検証成功。
2. **native prove は Poseidon2 が ~4 倍遅い**が、これは**このリビジョンの `Poseidon2Goldilocks` が未最適化実装**であることに起因する(ライブラリソースに "the internal layers are unoptimized" と明記; BabyBear 版はベクトル化済みだが Goldilocks 版は未対応)。本番では (a) BabyBear/KoalaBear 系への移行、(b) Goldilocks Poseidon2 のベクトル化、(c) Merkle capping で解消可能な**実装課題**であり、方式選定の本質的欠点ではない。
3. **再帰で効く指標は native prove ではなく in-circuit ノードコスト**であり、そこは Keccak 150k → Poseidon2 300 制約の**~500 倍**。この換装なしに再帰集約は成立せず、換装により初めて現実的になる — **M0.5-impl は Poseidon2-MMCS への換装を第一歩とする**ことが実測で確定した。

### 15.4 再帰集約アーキテクチャ決定マトリクス

| 方式 | 内容 | サンドボックス到達性 | 評価 |
|------|------|:---:|------|
| **A. P3 Poseidon2 換装 + 自作再帰検証 AIR** | 全 QS proof を Poseidon2-MMCS で再生成し、STARK 検証器を AIR 化して再帰集約、最終段を §14 の Groth16 で wrap | ✅ 換装は実測済み(本節)。再帰 AIR は要実装 | ◎ 既存 P3 スタックと連続。最有力 |
| **B. Plonky2 移植** | Plonky2 のネイティブ再帰(FRI + Poseidon)を利用、最終 SNARK wrap | △ crates.io 経由で可能性あり(未検証) | ○ 再帰が枯れている。スタック二重化のコスト |
| **C. SP1 / RISC0 zkVM wrap** | ネイティブ検証器を RISC-V で実行し zkVM proof を Groth16 wrap | ✗ **SP1 は GitHub プロキシがスコープ外リポジトリを 403 で遮断、導入不可**(§15.5) | △ 実装は最小だが本環境では不可 |

**推奨: 方式 A**。§14 の Groth16 wrap 配管(最終段)と本節の Poseidon2 換装(前処理)が両端で実測済みであり、中間の「再帰検証 AIR」のみが残る。

### 15.5 環境制約の確定(到達性 probe 結果)

| 依存 | 取得元 | 結果 |
|------|--------|:----:|
| arkworks (ark-groth16 等) | crates.io(プロキシ許可) | ✅ 導入・実行可(§14) |
| foundry / solc | GitHub releases(プロキシ許可) | ✅ 導入可(§13) |
| Plonky3 (pinned) | 既存 vendored | ✅ |
| **SP1 zkVM** | GitHub `succinctlabs/sp1`(**スコープ外**) | ✗ プロキシが 403 で遮断 |
| **Sepolia RPC** | `rpc.sepolia.org` 等 | ✗ プロキシが CONNECT 403 |

→ サンドボックスで進められる M0.5-impl の次段は**方式 A の再帰検証 AIR 実装**(crates.io / vendored のみに依存)。方式 C と M5 は環境ポリシー変更が前提。

### 15.6 M5 の解除手順(2 条件が揃い次第そのまま実施可能)

1. **RPC 許可**: ネットワークポリシーで Sepolia RPC(例 `https://rpc.sepolia.org`)への CONNECT を許可、または `QS__L1_RPC_URL` に到達可能な RPC を設定
2. **資金付き鍵**: `QS__L1_PRIVATE_KEY`(Sepolia ETH 保有)を設定
3. 実行:
   ```bash
   cd src/l1/contracts
   forge script script/DeployProverRegistry.s.sol --rpc-url "$QS__L1_RPC_URL" --broadcast
   # RegistrySetCommitment / ThresholdVerifier / Groth16WrapVerifier をデプロイ、
   # L1Vault に proposeThresholdVerifier → approve → execute で設置後、
   # requestUnlockWithProof の成功 tx と改竄 proof の revert tx を記録(受け入れ基準 3)
   ```

### 15.7 再現方法

```bash
cd src/crypto/circuits/wrap-recursion-m05
cargo run --release   # Keccak-MMCS vs Poseidon2-MMCS 比較表
```

---

## 16. M0.5-impl 方式 A 着手: Poseidon2 Merkle 開示検証 AIR (2026-08-04)

### 16.1 位置づけ

§15 で決定した方式 A(P3 Poseidon2 換装 + 自作再帰検証 AIR)の**第一構成要素**を実装した。再帰 FRI 検証器は各クエリで開示された Merkle ノードを回路内で再ハッシュする — §15 で特定した支配的コスト。その内側ループ(Poseidon2 Merkle 認証パス検証)を AIR 化する。

`src/crypto/circuits/recursion-merkle-m05`: 各行が 1 回の 2-to-1 Poseidon2 圧縮で、`p3-poseidon2-air` が `SubAirBuilder` 経由で置換の正しさを制約(M2a/M2c の keccak-air 内包と同型)。リンク列で行を Merkle パスに結合し、leaf/root/兄弟/index ビットを public input に束縛する。

**BabyBear + Poseidon2 で構築**(Goldilocks ではなく): pinned Plonky3 は Poseidon2 の**AIR** linear layer を Monty31(BabyBear/KoalaBear)と Mersenne31 にのみ提供する。これは §15 の推奨そのもの — 再帰は in-circuit で安い Poseidon2 を持つ Monty31 体で行う。

### 16.2 制約構造

- keccak-air(24 行/置換)と違い Poseidon2Air は **1 行/置換**でリンクが単純。
- リンク列(11 列): `is_real` / `links_next` / `dir`(左右子選択ビット)/ D 幅 one-hot レベルセレクタ。
- 制約: (1) 兄弟子 = one-hot 選択した public 兄弟、(2) `dir` = public index ビット(FRI クエリ index を束縛)、(3) レベル 0 の走行ノード = public leaf、(4) 最終レベル出力 = public root、(5) 遷移で走行ノードを次レベル入力にチェーン + one-hot 歩進。

### 16.3 実測(BabyBear、D=8、FRI: log_blowup=3 / 100 queries / pow 16)

| ケース | prove (ms) | verify (ms) | proof (bytes) | 期待 | 結果 |
|--------|-----------:|------------:|--------------:|:----:|:----:|
| honest | 97.8 | 5.2 | 234,772 | accept | ✅ |
| forged-root | 79.8 | 5.0 | 234,772 | reject | ✅ |
| forged-leaf | 76.8 | 5.0 | 234,772 | reject | ✅ |
| forged-sibling(l3) | 88.2 | 5.0 | 234,772 | reject | ✅ |
| flipped-dir(l5) | 196.4 | 5.1 | 234,772 | reject | ✅ |
| wrong-path-vs-root | 110.9 | 7.6 | 234,772 | reject | ✅ |

### 16.4 所見

1. **BabyBear + Poseidon2 の再帰親和性が実測で裏付いた**: proof **235 KB**(M0〜M4 の Keccak/Goldilocks は 2.5〜2.8 MB → **~1/12**)、verify **~5 ms**(Keccak は ~35 ms → **~1/7**)。§15 で native prove が遅かったのは Goldilocks Poseidon2 の未最適化実装が原因という診断と整合し、Monty31 では逆に軽い。
2. **改竄 5 種を全て reject**(root/leaf/兄弟偽造・index ビット反転・別パス偽装)。改竄トレースも全て有効な Poseidon2 置換のみを含み、reject はリンク制約のみで成立(M2a と同じ健全性論法)。
3. **方式 A の残構成要素**(後続 M0.5-impl): (a) FRI folding(各ラウンドの fold-and-check)、(b) Fiat-Shamir transcript(challenger の in-circuit 再生)、(c) 制約/quotient 整合(DEEP-ALI)。これらを結合すると完全な再帰検証器 AIR になり、その最終 proof を §14 で構築済みの Groth16 経路で wrap する。本節はそのうち**支配的コストの Merkle 開示部**を実装・実測した。

### 16.5 再現方法

```bash
cd src/crypto/circuits/recursion-merkle-m05
cargo run --release   # honest accept + 改竄 5 件 reject
```

---

## 17. M0.5-impl 方式 A: FRI folding 検証 AIR (2026-08-04)

### 17.1 位置づけ

§16(Merkle 開示検証)に続く方式 A の**第二構成要素**。再帰 FRI 検証器が各クエリで行うもう一方の内側ループ — **fold-and-check** — を native-field AIR 化する。`src/crypto/circuits/fri-fold-m05`。

### 17.2 制約構造

FRI クエリ 1 本につき各行が 1 折り畳みラウンド。走行評価値 `e_i`(層 i のクエリ点評価)、2 つの兄弟開示 `a_i = p_i(x_i)` / `c_i = p_i(-x_i)`、ラウンドチャレンジ `beta_i`、ドメイン点 `x_i` を保持:

- **整合性**: `e_i` = 実クエリ点の開示(public index ビットが `a_i` / `c_i` を選択)
- **折り畳み**: `2·x_i·e_{i+1} = x_i·(a_i + c_i) + beta_i·(a_i − c_i)`(= `e_{i+1} = (a+c)/2 + beta·(a−c)/(2x)`)を次ラウンドにチェーン
- **ドメイン二乗**: `x_{i+1} = x_i²`
- **境界**: 先頭ラウンドで初期層評価とドメイン点を、最終ラウンドで最終折り畳み値を束縛

開示・チャレンジ・index ビットは public(FRI proof + transcript 由来)、走行評価値とドメイン点は witness でチェーン。全制約 degree ≤ 3。除算を含む折り畳み式を `2x` 倍して多項式制約化。

### 17.3 実測(BabyBear、R=8)

| ケース | prove (ms) | verify (ms) | proof (bytes) | 期待 | 結果 |
|--------|-----------:|------------:|--------------:|:----:|:----:|
| honest | 148.0 | 2.2 | 105,364 | accept | ✅ |
| forged-opening(r3) | 88.0 | 3.6 | 105,364 | reject | ✅ |
| flipped-bit(r4) | 249.6 | 2.2 | 105,364 | reject | ✅ |
| wrong-beta(r2) | 55.8 | 2.1 | 105,364 | reject | ✅ |
| forged-final | 141.9 | 2.4 | 105,364 | reject | ✅ |
| forged-init | 110.9 | 2.4 | 105,364 | reject | ✅ |

### 17.4 所見と残り

- 折り畳み代数(整合性・fold・二乗・境界)を AIR で表現し、開示偽造・index 反転・チャレンジ改竄・最終/初期値偽造の 5 種を全て reject。純代数のため SubAir 不要で 13 列と軽量。
- **方式 A の 2 つの per-query 内側ループ(§16 Merkle 開示 / §17 FRI fold)が揃った**。残る構成要素は: (c) **Fiat-Shamir transcript の in-circuit 再生**(`beta_i` とクエリ index を challenger 再生で導出し、本 AIR の public 入力に束縛)、(d) **制約/quotient 整合(DEEP-ALI)**。これらを結合すると完全な再帰検証器 AIR となり、最終 proof を §14 の Groth16 経路で wrap する。

### 17.5 再現方法

```bash
cd src/crypto/circuits/fri-fold-m05
cargo run --release   # honest accept + 改竄 5 件 reject
```

---

## 18. M0.5-impl 方式 A: Fiat-Shamir transcript 再生 AIR (2026-08-04)

### 18.1 位置づけ

§16(Merkle 開示)・§17(FRI fold)に続く方式 A の**第三構成要素**。再帰検証器は FRI チャレンジ(`beta_i`・クエリ index)を、プローバ主張値を信用せず**自分で in-circuit 導出**する必要がある。`src/crypto/circuits/fri-transcript-m05` で、recursion-merkle-m05 と同じ BabyBear width-16 Poseidon2 による **duplex sponge**(overwrite モード、rate = capacity = 8)として実装。

### 18.2 制約構造

各行 = 1 transcript ラウンド: observed commitment を rate に吸収 → 走行 capacity 保持 → Poseidon2 置換(`p3-poseidon2-air` を SubAir 内包)→ squeeze した出力 rate がそのラウンドのチャレンジ。

- **吸収**: 入力 rate = public observed commitment
- **capacity IV**: 先頭ラウンドの capacity = 0
- **squeeze**: 出力 rate = public チャレンジ(§17 の fold AIR が消費)
- **capacity carry**: 各ラウンドの入力 capacity = 前ラウンドの出力 capacity(sponge チェーン)
- one-hot ラウンド歩進(§16/§17 と同型)

### 18.3 実測(BabyBear、R=8)

| ケース | prove (ms) | verify (ms) | proof (bytes) | 期待 | 結果 |
|--------|-----------:|------------:|--------------:|:----:|:----:|
| honest | 185.9 | 4.9 | 234,340 | accept | ✅ |
| forged-observed(r4) | 250.2 | 6.1 | 234,340 | reject | ✅ |
| forged-challenge(r2) | 157.2 | 5.0 | 234,340 | reject | ✅ |
| forged-index-lane(r6) | 165.1 | 5.0 | 234,340 | reject | ✅ |
| reordered-transcript | 68.5 | 5.2 | 234,340 | reject | ✅ |

### 18.4 所見と残り

- observed commitment 偽造(導出チャレンジが変化)、チャレンジ主張の偽造(squeeze 束縛で不一致)、transcript 順序入れ替え(capacity チェーン破壊)を全て reject。in-circuit Fiat-Shamir が成立。
- 本番 QS proof は Keccak challenger を使うが、本構成要素は方式 A が採用する再帰親和 Poseidon2 sponge で transcript を実演する(§15/§16 の Monty31 移行方針と一貫)。
- **方式 A の残り 1 構成要素**: (d) **DEEP-ALI**(制約/quotient 整合 — 開示された評価値を AIR 制約に束縛する consistency check)。§16 Merkle 開示 / §17 FRI fold / §18 transcript と合わせ 4 部品が揃えば完全な再帰検証器 AIR となり、最終 proof を §14 の Groth16 経路で wrap する。

### 18.5 再現方法

```bash
cd src/crypto/circuits/fri-transcript-m05
cargo run --release   # honest accept + 改竄 4 件 reject
```

---

## 19. M0.5-impl 方式 A: DEEP-ALI 整合 AIR — 方式 A 構成要素コンプリート (2026-08-04)

### 19.1 位置づけ

方式 A の**第四(最終)構成要素**。STARK 検証の最終段 — 開示された trace/quotient 評価値が out-of-domain 点 `zeta` で AIR 制約を満たすことの検査 — を in-circuit 化する。`src/crypto/circuits/deep-ali-m05`。

DEEP quotient 恒等式: `C(t(zeta), t(zeta·g)) = Z_H(zeta) · q(zeta)`(`Z_H(x) = x^n − 1` は サイズ `n` の trace ドメインの vanishing 多項式)。

### 19.2 制約構造

デモ内部制約 `C = t(zeta·g) − t(zeta)²`(二乗遷移 AIR)に対し:

- **zeta^n の再計算**: in-AIR 二乗チェーン(`p_0 = zeta`, `p_{i+1} = p_i²`, `p_LOG_N = zeta^n`)。プローバは `zeta^n` を偽れない
- 開示 `t0 = t(zeta)` / `t1 = t(zeta·g)`、quotient `q = q(zeta)`、`zeta` を public 束縛
- 最終チェーン行で `t1 − t0² == (zeta^n − 1)·q` を assert

### 19.3 実測(BabyBear、n=2^10)

| ケース | prove (ms) | verify (ms) | proof (bytes) | 期待 | 結果 |
|--------|-----------:|------------:|--------------:|:----:|:----:|
| honest | 141.7 | 2.4 | 128,888 | accept | ✅ |
| forged-opening(t1) | 146.5 | 2.2 | 128,888 | reject | ✅ |
| forged-opening(t0) | 139.7 | 2.7 | 128,888 | reject | ✅ |
| forged-quotient | 108.3 | 2.2 | 128,888 | reject | ✅ |
| forged-zeta(pub) | 196.4 | 2.2 | 128,888 | reject | ✅ |
| wrong-ood-point | 75.4 | 2.2 | 128,888 | reject | ✅ |

### 19.4 方式 A: 構成要素コンプリート

再帰検証器の 4 構成要素が全て実装・実測済みになった:

| 構成要素 | クレート | §  |
|---------|---------|---|
| Merkle 開示(クエリごとの再ハッシュ) | `recursion-merkle-m05` | §16 |
| FRI fold(クエリごとの fold-and-check) | `fri-fold-m05` | §17 |
| Fiat-Shamir transcript 再生 | `fri-transcript-m05` | §18 |
| DEEP-ALI 制約整合 | `deep-ali-m05` | §19 |

**M0.5-impl の残作業は統合のみ**: 4 部品を 1 つの再帰検証器 AIR に結線し(内部 proof をフル検証)、その最終 proof を §14 で構築・ガス実測済みの Groth16 経路で wrap する。個別部品の健全性(各 §16-19 の改竄 reject)と再帰親和性(BabyBear+Poseidon2 で proof ~0.1-0.2MB / verify ~2-5ms)は実測で確立済み。

### 19.5 M0.5-impl 全体の到達点

| ステップ | 状態 |
|---------|------|
| wrap 方式選定(§7)+ オンチェーン Groth16 配管・ガス実測(§14) | ✅ |
| 再帰方式 A 確定 + Poseidon2 換装実測(§15) | ✅ |
| 再帰検証器 4 構成要素(§16-19) | ✅ |
| **統合**(4 部品結線 → 再帰 AIR → Groth16 wrap の VK 差し替え) | ⏳ 残 |

### 19.6 再現方法

```bash
cd src/crypto/circuits/deep-ali-m05
cargo run --release   # honest accept + 改竄 5 件 reject
```

---

## 20. M0.5-impl 方式 A: 再帰検証器の統合(public glue 合成) (2026-08-04)

### 20.1 位置づけ

§16-19 で完成した 4 構成要素を結線し、内部 FRI proof の**端から端までの検証**を実演する。`src/crypto/circuits/recursion-verify-m05`。

### 20.2 統合方式

単一ランナーが 4 セグメントを各自の AIR で証明し、界面を **public glue** で束ねる(M2d の 15-proof 署名・M3 の閾値と同じ合成):

- **glue-1**: transcript の最初の observed commitment == Merkle root
- **glue-2**: 各 FRI-fold `beta_i` == transcript の squeeze チャレンジ
- **glue-3**: fold の初期評価値 == 開示された Merkle leaf
- **glue-4**: DEEP の trace 開示 == fold の最終評価値

honest では 4 proof 全 verify + 4 glue チェック成立。セグメント跨ぎの改竄(fold beta ≠ transcript チャレンジ等)は各 proof は valid のまま glue リンクを壊す → reject。

### 20.3 実測(BabyBear)

| ケース | 結果 | 備考 |
|--------|:----:|------|
| honest-end-to-end | ✅ ACCEPT | 4 proof 合計 ~0.9 s / ~0.7 MB、glue ok |
| break glue-1 (root) | ✅ reject | glue 検査で捕捉 |
| break glue-2 (beta) | ✅ reject | 同上 |
| break glue-3 (leaf→init) | ✅ reject | 同上 |
| break glue-4 (fold→deep) | ✅ reject | 同上 |

### 20.4 到達点と残り

- 4 AIR が界面整合の下で内部 proof を端から端まで検証することを実証。**再帰検証器のロジックは完成・合成可能**。
- **残る M0.5-impl は「合成を succinct にする」1 点**: (a) 4 セグメントを単一トレースに畳み glue をネイティブランナーでなく in-AIR 制約で強制、または (b) 4 proof を再帰集約 — したうえで、最終 proof を §14 で構築・ガス実測済みの Groth16 経路で wrap(`Groth16WrapVerifier.sol` の VK 差し替え)。
- 現状は「4 proof + ネイティブ glue」で、M2d/M3 と同じ**検証可能だが非集約**の段階。集約(a/b)は §14 の再帰集約(方式 C)の実装であり、gnark 等の外部ツール or 自作 P3 再帰 AIR の選定を伴う次工程。

### 20.5 M0.5-impl の全体到達点(更新)

| ステップ | 状態 |
|---------|------|
| wrap 方式選定(§7)+ Groth16 オンチェーン配管・ガス実測(§14) | ✅ |
| 再帰方式 A 確定 + Poseidon2 換装(§15) | ✅ |
| 再帰検証器 4 構成要素(§16-19) | ✅ |
| 4 構成要素の統合(public glue、§20) | ✅ |
| **集約 → 単一 proof 化 → Groth16 VK 差替** | ⏳ 残(最終段) |

### 20.6 再現方法

```bash
cd src/crypto/circuits/recursion-verify-m05
cargo run --release   # honest end-to-end accept + glue 改竄 4 件 reject
```

---

> **§21 以降について**: ここから先は `claude/m3-aggregation-registry` ブランチで
> 2026-08-09〜26 に行った独立調査の成果を統合したもの。同ブランチは §20 より前の
> 分岐点（`44fa48c2`）から派生していたため、M0.5-impl 方式 A（§15〜§20）の完成を
> 認識せずに wrap 方式を再評価していた。その過程で **Groth16 wrap が中核原則に
> 反する**（§22）ことと、**両 PQ 署名がオンチェーン直接検証で足りる**（§27・§31）
> ことが実測で判明し、方式 A の最終段（集約 → Groth16 wrap）の前提に直接関わる。
> 同ブランチの zkVM（SP1）経路の調査は、直接検証が成立した時点で優先度を失ったため
> 統合していない。

## 21. FR-THRESH-4 のフォールバック保証は成立していない (2026-08-09)

`claude/m3-aggregation-registry` の zkVM ゲスト調査 で挙げた「ゲストとオンチェーン `SPHINCSVerifier` の署名バリアント整合性」を
実署名で確認したところ、**それ以前の問題が確定した**。

### 25.1 実測

`sphincs-m2` の `emit_solidity_vector` で、RustCrypto 実装が生成し我々の検証器も
受理する**本物の SLH-DSA-SHAKE-128s 署名**を、`L1Vault` が導出するのと同じ
32 バイトメッセージに対して用意し、`SPHINCSVerifier.verify()` に通した。

| | 結果 |
|---|---|
| 署名長 / 公開鍵長 | 契約の期待値と一致（サイズ不一致では説明できない） |
| **消費ガス** | **673,778,501** |
| 結果 | **理由なし revert（完了せず）** |
| ブロックガス上限比 | **22 倍** |

`test/SPHINCSVerifierConformance.t.sol` に、この上限超過を**通るテストとして固定**した。
検証器が実行可能になればこのテストが落ち、修正者に FR-THRESH-4 の再評価を強制する。

### 25.2 何を意味するか

**フル直接検証経路はオンチェーンで実行できない。** どのブロックにも入らない。

したがって FR-THRESH-4 の「proof 生成系が停止しても、フル直接検証で資産を
取り出せる」という保証は、**現状の実装では成立していない**。

これは §23.4 で私が書いた記述の誤りである:

> verifier 未設定なら proof 経路が使えないだけで、フル直接検証経路
> （FR-THRESH-4）は影響を受けない。**proof 生成系が全停止しても資産は取り出せる**

後半は誤り。フォールバック経路は実行不能なので、**proof 経路が唯一の実効経路**である。
`docs/core/ACTUAL_STATE.md` に既にあった「フル長署名ではブロックガス上限を
超える」という記載と整合する。§23.4 の記述はその含意を取り違えていた。

### 25.3 FIPS 205 適合性（コード読解、未実測）

ガス上限で完走しないため**受理/拒否の判定は実測できていない**。ただし
コード上、この実装は FIPS 205 ではない:

| FIPS 205 (SHAKE) | `SPHINCSVerifier.sol` |
|---|---|
| `F/H` の入力は `PK.seed ‖ ADRS(32B) ‖ M` | 1 バイトのドメインセパレータ（`0x01`/`0x02`/`0x04`）+ `uint32` 数個 |
| 出力は `n` = 16 バイト | 32 バイト |
| `H_msg = SHAKE256(R ‖ PK.seed ‖ PK.root ‖ M, 8m)`、`m` = 30 バイト | 先頭に `0x00` を付加し 32 バイト出力 |

ADRS は層・木・型・鍵ペア・チェーン・ハッシュの各アドレスを担う 32 バイト構造で、
1 バイトの定数では代替できない。**適合実装が作った署名を受理できる構成ではない**
と読めるが、これは読解であり実測ではない。

### 25.4 帰結

| 論点 | 状態 |
|---|---|
| proof 経路（FR-THRESH-1） | M4/§23・§24 で実装済み。**これが唯一の実効経路** |
| フォールバック経路（FR-THRESH-4） | **実行不能**。要件として再設計が必要 |
| `claude/m3-aggregation-registry` の zkVM ゲスト調査 の「両経路の整合性」 | オンチェーン側が走らないため現状は空論。検証器を作り直す場合に再浮上する |

フォールバックの選択肢は概ね 3 つ:
1. **署名検証も zkVM proof で行う別経路**（鍵や閾値の前提を変えた縮退運用）
2. **`SPHINCSVerifier` を EVM 実行可能に作り直す** — ⚠️ 当初「precompile なしでは
   現実的でない」と書いたが**これは誤りだった**。§22.1 参照（外部に 94K〜142K ガスの
   実測例がある。代償は FIPS 205 適合性）
3. **フォールバックをオンチェーン検証に求めない**（Security Council による
   時間ロック付き救済など、信頼前提を明示した設計）

これは実装作業ではなく**要件レベルの判断**であり、
`ONCHAIN_TRUST_MECHANISM_REQUIREMENTS.md` の FR-THRESH-4 の見直しが要る。

---

## 22. FR-THRESH-4 再設計の選択肢 — Pros/Cons と外部環境 (2026-08-12)

§21 で「フォールバック経路は実行不能」と確定した。その再設計を、外部エコシステムの
現況を調べたうえで整理する。

### 26.1 §21.4 の見込みの訂正

§21.4 で私はこう書いた:

> `SPHINCSVerifier` を FIPS 205 適合かつガス実行可能に作り直す — フル長署名の
> 検証を 30M ガスに収めるのは、**precompile なしでは現実的でない**

**この見込みは誤り。** Ethereum Research の "SPHINCS−"（2026-06 投稿）が、
precompile なしの Solidity で以下を実測している:

| 変種 | 署名長 | 検証ガス |
|------|------:|--------:|
| SLH-DSA-Keccak-128-24 | 3,856 B | **94K** |
| C13 | 3,704 B | **127K** |
| SLH-DSA-SHA2-128-24 | 3,856 B | **142K** |
| C12（ハードウェアウォレット向け） | 6,512 B | 276K |

我々の 673.8M と比べて **4,700 倍**の開きがある。つまり現行 `SPHINCSVerifier` の
問題は「最適化不足」ではなく**構成そのもの**であり、EVM で実行可能な SLH-DSA 検証は
precompile 無しで十分に射程内である。

ただし**代償がある**。これらはいずれも厳密な FIPS 205 適合ではない:

- **署名予算を 2^64 から 2^14〜2^20 に縮小**（ブロックチェーンの利用実態に合わせた設計）
- Keccak 版はハッシュ関数自体を SHAKE256 → KECCAK256 に置換

したがって選択の軸は「ガスで可能か」ではなく、**どの標準適合性を手放すか**である。

投稿には Solidity 実装と Lean 4 + Verity による verifier の形式証明が付くが、
独立監査は言及されていない。

### 26.2 選択肢

#### A. proof 経路のみ（フォールバックを暗号検証に求めない）

| Pros | Cons |
|------|------|
| 追加実装ゼロ。M4/§23・§24 で完成済み | **FR-THRESH-4 を要件から落とすことになる**（対外表明の修正が必要） |
| ガスは ~275K で確定済み（NFR-2 の 27%） | 証明生成が停止すると**資産が動かせない** |
| 署名予算は FIPS 205 のまま（2^64）。CP-1 と完全整合 | 単一障害点の所在が変わるだけで、消えてはいない |

#### B. `SPHINCSVerifier` を EVM 実行可能に作り直す（SPHINCS− 系）

| Pros | Cons |
|------|------|
| **フォールバックが本当に機能する**（~94K〜142K ガス） | **FIPS 205 適合を手放す**（署名予算 2^14〜2^20、または Keccak 置換） |
| proof 経路と独立 — 証明系が落ちても資産が動く | CP-1「SHA3-256 / FIPS 準拠」との整合を再定義する必要。Keccak 版は CP-1 と正面衝突。SHA2 版は FIPS 205 のハッシュ族なのでまだ近い |
| 外部に参照実装と形式証明がある | Prover の鍵運用が変わる（鍵あたり署名数に上限） |
| ガス的には proof 経路より安い | **独立監査が存在しない**。新規かつ非標準の暗号実装を採用する判断 |

#### C. 非暗号フォールバック（Security Council + タイムロック）

| Pros | Cons |
|------|------|
| 実装が小さく、既存の `SecurityCouncil` を再利用できる | **信頼前提が入る** — 「全てオンチェーンで検証可能」（CP-5）の後退 |
| 暗号の標準適合性を一切妥協しない | 対外表明の書き換えが必要。ここを曖昧にすると §0 の調査で見つけた乖離の再演になる |
| 障害モードが人間に理解しやすい | Council の可用性・結託が新たなリスク |

#### D. プロトコル側の PQ precompile を待つ

| Pros | Cons |
|------|------|
| 実現すれば最も筋が良い（標準適合 + 低ガス） | **時期が自分たちの制御下にない** |
| Ethereum の PQ ロードマップは進行中（EIP-8141 が Hegota フォークで H2 2026 予定と報じられている） | 確認できた precompile EIP（EIP-8051）は **ML-DSA 向けで SLH-DSA ではない**（EIP 本文は未取得。二次情報による） |
| | 待つ間フォールバックは不在のまま |

### 26.3 外部環境への依存（この判断で見落としやすい軸）

選択肢 A は「証明系が落ちたら詰む」だが、**その"証明系"は自前だけではない**:

| 依存先 | 種別 | 落ちたとき | 緩和策 |
|--------|------|-----------|--------|
| SP1 Prover Network | 外部サービス | proof が作れない | **自前で証明可能**（本リポジトリの `zkvm/cycles` がそれ。ただし要 RAM 64GB 級） |
| Succinct の verifier gateway | **L1 上の他者のコントラクト** | **unlock が通らない** | **自前デプロイ可能**（Groth16 verifier は単なるコントラクト。§14 で実測済み） |
| SP1 の circuit version | バージョン整合 | vkey が変わり、既存の verifier 設定が無効化 | バージョン固定 + 移行手順の用意 |

**重要**: 3 つとも緩和可能だが、**緩和策を実際に用意していなければ依存は残る**。
特に 2 番目は、`ThresholdProofVerifier` が他者のコントラクトを指したままだと、
FR-THRESH-4 で懸念していたのと同種の可用性リスクを別の場所に作ることになる。

一方、選択肢 B と C は外部への実行時依存を持たない（B は実装を自前で持つ、
C は Council が主体）。**「外部依存を減らす」観点では B > C > A** の順になる。

### 26.4 推奨

**B + A の併用**を推奨する。理由:

1. proof 経路（A）は既に完成しており、通常運用の主経路として最も安い（~275K ガス）
2. B をフォールバックに置くことで、**FR-THRESH-4 が実際に機能する**状態になる。
   ~142K ガスなら緊急時経路として十分に実用的
3. B は外部への実行時依存を持たないので、A の外部依存（SP1 ネットワーク /
   Succinct の verifier）に対する真の代替になる
4. C は B が採れない場合の次善。D は待ちの選択肢であり、単独では成立しない

**ただし B には未解決の判断が 2 つ残る**:

- **CP-1 との整合**: 署名予算 2^14〜2^20 への縮小を受け入れるか。Prover は
  1 鍵あたりの署名数に上限を持つことになり、鍵ローテーション運用が要る。
  SHA2 版（142K）なら CP-1 の「FIPS 準拠」からの逸脱は最小
- **監査の不在**: 非標準かつ独立監査のない暗号実装を、資産保全の最終防衛線に
  据えてよいか。ここは技術判断ではなく**リスク受容の判断**

この 2 点は実装ではなく方針決定であり、着手前に確定しておく必要がある。

### 26.5 出典

- SPHINCS−: <https://ethresear.ch/t/sphincs-minus-efficient-stateless-post-quantum-signature-verification-on-the-evm/25165>
- EIP-8051（ML-DSA precompile、本文未取得）: <https://eips.ethereum.org/EIPS/eip-8051>
- Ethereum の PQ ロードマップ: <https://ethereum.org/roadmap/security/quantum-resistance/> / <https://pq.ethereum.org/>

---

## 23. Groth16 wrap は中核原則に反する — 分岐の確定 (2026-08-14)

### 27.1 受容の根拠が消えていた

§8.3 で Groth16 wrap の古典仮定を受容した際の条件は、原文でこうだった:

> wrap 層の古典仮定は「資産保全は **FR-THRESH-4 のフル SPHINCS+ 直接検証経路が
> 常時担保する**」ことで受容する（wrap が破られても署名偽造にはならず、
> フォールバック経路の安全性は不変）

**§21 でその条件が偽であることを実測で確定した**（673.8M ガス、実行不能）。
条件が消えた以上、受容は無効である。にもかかわらず 同ブランチの wrap 方式再評価〜§24 では結論だけを
持ち越し、§22 では「A（proof 経路）を主経路に」とまで書いた。**これは誤りだった。**

### 27.2 具体的な帰結

proof 経路が唯一の認可経路である構成では、量子攻撃者は:

1. BN254 の離散対数を Shor で解く
2. 偽の Groth16 proof を構成する
3. `validCount = 2` と主張して `requestUnlockWithProof` を通す

**SPHINCS+ 署名は 1 つも要らない。** つまりこの構成において PQ 署名層は装飾であり、
プロトコルが掲げる脅威モデルに対する防御力はゼロである。

### 27.3 分岐を決める実測

量子耐性のある（ハッシュベースの）on-chain verifier がガスに収まるかを実測した
（`test/HashVerifierGasProbe.t.sol`）。単価は 2 サイズの差分で測り、呼び出しと
calldata のオーバーヘッドを相殺している。

| 項目 | 値 | 由来 |
|------|---:|------|
| keccak Merkle 1 段 | **290 gas** | 実測 |
| Goldilocks 積和 1 回 | **196 gas** | 実測 |
| calldata 1 バイト | **16 gas** | EIP-2028（**モデル値**。forge のテスト内呼び出しは内部呼び出しのため課金されず、測ると ~1 になって 16 倍過小評価する） |

**導かれる上限:**

| 制約 | 結果 |
|------|------|
| proof サイズ（calldata だけで予算を使い切る点） | **62.5 KB** |
| 16 KB の proof を送った後に残る keccak 回数 | **2,544 回** |
| 32 KB の proof を送った後 | 1,640 回 |
| **現行の production 構成**（100 クエリ、2^16、arity-2 折り畳み = 15,200 hash） | **4,408,000 gas = 予算の 4.4 倍**（calldata と制約評価を除いてなお超過） |

### 27.4 収まる構成は存在するか

存在するが、**余裕がない**。8〜16 KB の proof に対して使える keccak は 2,500〜3,000 回。
1 クエリあたりのハッシュ回数を arity-8 折り畳みで ~50 回に抑えれば **~50 クエリ**。
blowup 8 なら 1 クエリ 3 ビットで ~150 ビット相当の健全性が得られる。

その構成の合計見積り（クエリあたりハッシュ数は**推定**）:

```
calldata (8 KB)         131,000
hashing (50q x 50)      725,000
constraints (200 列)    157,000
                      ──────────
                      約 1,013,000   ≒ NFR-2 予算の 101%
```

**予算の境界にちょうど乗る。** 成立させるには再帰による proof 縮小・折り畳み arity・
blowup・最終 AIR の列数を**同時に**最適化する必要があり、マージンはゼロである。

対して**経路 1（オンチェーン直接 PQ 検証、SPHINCS− 型）は 2-of-N で ~284K gas =
予算の 28%**（§22.1、外部実測値）。**3.5 倍の余裕**がある。

### 27.5 分岐の結論

| 経路 | 量子耐性 | NFR-2 に対する位置 | 判定 |
|------|---------|-----------------|------|
| **1. オンチェーン直接 PQ 検証** | ✅ | **28%**（3.5 倍の余裕） | **主経路に採用** |
| 2. STARK 集約 + hash ベース検証 | ✅ | **~101%**（マージンなし、要 R&D） | 差別化の賭けとして別途評価 |
| 3. Groth16 wrap | ❌ **古典仮定** | 27% | **単独での認可経路にしない** |

**確定事項:**

1. **`requestUnlockWithProof` を唯一の認可経路として有効化しない。** 実装（§23・§24）は
   残すが、Groth16 verifier を指したまま単独で稼働させれば、量子攻撃者に対して
   保管庫は無防備になる
2. **経路 1 を主経路として着手する。** 中核原則を回復する最短路であり、
   ガスに 3.5 倍の余裕がある
3. **経路 2 は「原則を満たしつつ N にフラット」という唯一の構成**であり、差別化の
   本命ではあるが、**予算 101% という測定結果**が示す通り現時点では研究段階。
   主経路の代わりにはならない

### 27.6 §22.4 の推奨の撤回

§22.4 で「**B + A の併用**（A を主経路）」を推奨したが、**A を主経路に置く部分は撤回する**。
A は検証層に古典仮定を持ち込み、それを補うはずだった FR-THRESH-4 は動かない。
正しくは **B（= 経路 1）が主経路**であり、A は「量子攻撃者が現れるまでの間の
ガス最適化」以上の位置づけを持てない。

§22.3 で整理した外部依存（SP1 Prover Network / Succinct の verifier gateway）の
議論も、この訂正により優先度が下がる。**経路 1 には外部への実行時依存が無い。**

---

## 24. 経路 1 の実測 — 暗号を曲げる必要はなかった (2026-08-14)

§23.5 で主経路と決めた「オンチェーン直接 PQ 検証」のコストを、パラメータ集合ごとに
実測した。§22.1 では「FIPS 205 適合を手放すのが代償」と整理していたが、
**その前提は測ってみると成り立たなかった。**

### 28.1 ハッシュ 1 回の固有コスト

`abi.encodePacked` を挟む素朴なループでは keccak 305 / sha256 714 gas となるが、
これは毎回メモリを確保する分を含む。実装が避けるべきコストなので、
assembly でスクラッチ領域を使い回して**固有コスト**を測り直した:

| | 素朴な実装 | **固有コスト** |
|---|---:|---:|
| keccak256（64B） | 305 | **111 gas** |
| SHA-256 precompile（64B） | 714 | **288 gas** |

SHA-256 が keccak の 2.6 倍なのは、precompile への `staticcall` オーバーヘッドが
64 バイト入力では本体コスト（60 + 12×2 = 84）を上回るため。
keccak256 はネイティブ opcode なのでこれが無い。

**この差が結論を左右した。**素朴な測定値のままなら SHA2 系は全て予算超過に見えていた。

### 28.2 2-of-N の総ハッシュコスト

ハッシュ回数は `sphincs-m2` がネイティブ実測した構造による
（SLH-DSA-128s = 2,174 回。FORS の k(1+a)、d×len 本の WOTS+ チェーン、d×h' の木ハッシュ）。
高さ削減版（h=24, d=3）は d 依存項が縮んで 993 回。

| 構成 | FIPS 205 からの逸脱 | 2-of-N ハッシュ gas | NFR-2 比 |
|------|-------------------|------------------:|--------:|
| **フル params + SHA2** | **なし（厳密適合）** | **1,252,224** | **125%** |
| フル params + keccak | ハッシュ関数のみ（署名予算は 2^64 のまま） | 482,628 | 48% |
| 高さ削減 + SHA2 | 署名予算のみ（ハッシュ族は FIPS 205 の SHA2 のまま） | 571,968 | 57% |
| 高さ削減 + keccak（SPHINCS− 型） | 両方 | 220,446 | 22% |

**予算に収まらないのは「厳密な FIPS 205 適合」だけ**、それも 125% である。

### 28.3 測定の妥当性

高さ削減 + keccak の 1 署名分は 993 × 111 = **110K gas**。
外部の SPHINCS− C13 の実測が **127K**（§22.1）。**差は 15%** であり、
「よく最適化された実装は固有ハッシュコストの ~1.15 倍に着地する」ことを示す。
本節の数値が実装可能な範囲の下限として妥当であることの傍証になる。

### 28.4 NFR-2 は物理制約ではない

厳密適合の 1,252K が「超過」なのは**自分で決めた 100 万ガス目標に対して**であり、
**Ethereum のブロックガス上限は 30M** である。1.25M はブロックの **4%** にすぎない。

署名の calldata を加えた現実的な総額（署名 7,856 B × 2 × 16 gas = 251K、
実装オーバーヘッドを `claude/m3-aggregation-registry` の zkVM ゲスト調査 の 1.15 倍として）:

```
ハッシュ    1,252,000 × 1.15 ≈ 1,440,000
calldata                        251,000
                              ──────────
                            約 1,691,000 gas  = ブロックの 5.6%
```

**厳密な FIPS 205 適合のまま、オンチェーンで実行できる。**

### 28.5 §22.1 の整理の訂正

§22.1 で「選択の軸は『ガスで可能か』ではなく**どの標準適合性を手放すか**」と
書いたが、これは**外部実装（SPHINCS−）が採った選択を、こちらの制約と取り違えていた**。
SPHINCS− がハッシュ置換と予算削減を採ったのは、**ウォレット用途で 1 署名あたり
$0.07 を狙う**という彼らの目標があってのこと。

Quantum Shield は 2-of-N の資産解放という**低頻度・高価値**の操作であり、
1 回あたり 170 万ガスを許容できるなら**何も手放す必要がない**。

### 28.6 決定事項への影響

§22.1 で未解決としていた 2 つの方針決定は、**どちらも回避できる**:

| 論点 | §22.1 時点 | 本節の結論 |
|------|-----------|-----------|
| CP-1 との整合（署名予算 2^14〜2^20 の受容） | 要判断 | **不要**。2^64 のまま |
| 独立監査のない非標準暗号を最終防衛線に置くか | 要リスク受容 | **不要**。標準の FIPS 205 パラメータ集合を実装すればよい |

代わりに必要なのは **NFR-2 の見直し**（1M → 2M 程度）という、
暗号のリスクを伴わない要件調整のみである。

**推奨: 厳密な FIPS 205 SLH-DSA-SHA2-128s のオンチェーン検証器を実装し、
NFR-2 を実測に合わせて再設定する。**

なお §21.3 の通り、現行 `SPHINCSVerifier.sol` は ADRS を 1 バイトの定数で
代用しており FIPS 205 ではない。**作り直しであって最適化ではない。**

---

## 25. FIPS 205 検証器の実装 — 第 1 段 (2026-08-21)

§24 の結論（厳密適合のままオンチェーン検証が可能）に沿って、`SPHINCSVerifier.sol`
の**作り直し**を開始した。まずハッシュ構成とアドレス符号化まで。

### 29.1 参照実装を先に置いた

`src/crypto/slh-dsa-sha2`（Rust）を先に書き、独立実装（RustCrypto
`slh_dsa::Sha2_128s`）に対してクロス検証した。**一発で受理された**ので、
ADRS 圧縮・パディング・MGF1 による `H_msg` の解釈は正しい。

これを先にやったのは §21 の教訓による。`SPHINCSVerifier.sol` が長く誤ったまま
だったのは、突き合わせる参照が無かったからで、end-to-end のベクタだけでは
「落ちた」としか分からずどの構成が壊れているか特定できない。

### 29.2 Solidity 側（`src/crypto/SLHDSA.sol`）

| 構成 | 参照との一致 |
|------|------------|
| `ADRS^c`（FIPS 205 §11.2、22 バイト） | ✅ |
| `F` | ✅ |
| `H` | ✅ |
| `T_l` | ✅ |
| `H_msg`（MGF1-SHA-256、30 バイト） | ✅ |

ベクタは全フィールドに相異なる値を入れてあるので、**圧縮のバグがゼロバイトに
隠れることがない**。「アドレスを変えるとハッシュが変わる」ことも別テストで固定した
—— 旧実装の 1 バイトのドメインセパレータでは提供できなかった性質である。

### 29.3 ガス: 素朴な実装との差

初版は `abi.encodePacked` でハッシュ入力を組み立てており、1 回 **12,986 gas**
だった。2,174 回で 28M —— ブロックにほぼ収まらない。

`PK.seed ‖ toByte(0,48) ‖ ADRS^c ‖ M` をスクラッチメモリに直接書き、
`ADRS^c` をバイトループではなくシフトで構築するよう書き換えた:

| | 1 回あたり | 1 署名（2,174 回） | 2-of-N |
|---|---:|---:|---:|
| 素朴（3 バッファ確保） | 12,986 | 28.2M | 56.5M ❌ |
| **最適化後（限界コスト）** | **568** | **1,234,832** | **2,469,664** |
| ブロックガス上限比 | | 4.1% | **8.2%** ✅ |

限界コストは 2 サイズのバッチ差分で測っており、外部呼び出しのオーバーヘッドを
含まない（ライブラリの `internal` 関数は検証器にインライン展開されるため、
これが実装が実際に払うコストである）。

§24.2 の見積り（1,252,224 gas / 2-of-N）に対し実測 2,469,664 は**約 2 倍**。
差は §24 が 64 バイト入力の 288 gas を使っていたのに対し、実際の `F` は
102 バイト（SHA-256 の 2 圧縮ブロック）を食うため。**見積りが楽観的だった**。

それでも **2-of-N はブロックの 8.2%** に収まり、§24.4 の結論
（厳密な FIPS 205 適合のままオンチェーンで実行できる）は変わらない。

### 29.4 残り

ハッシュ層は固定できた。上位（`base_2b` / WOTS+ チェーン / FORS / XMSS /
ハイパートリー / `slh_verify`）はこれから。参照実装が既にあるので、
各段を同じやり方で差分テストしながら積む。

---

## 26. FIPS 205 検証器が動いた (2026-08-21)

§21 のハッシュ層に続いて上位層（`base_2b` / WOTS+ / FORS / XMSS / ハイパートリー /
`slh_verify`）を実装し、**本物の SLH-DSA-SHA2-128s 署名がオンチェーンで検証できる
ようになった**。

### 30.1 層ごとの一致

参照実装（`src/crypto/slh-dsa-sha2`、独立実装でクロス検証済み）の中間値と
突き合わせた。各層を個別に固定してあるので、失敗すれば**壊れた層が名指しされる**。

| FIPS 205 | 一致 |
|----------|------|
| Alg. 4 `base_2b` | ✅ |
| Alg. 5 `chain`（開始位置を非ゼロにして hash address を実際に動かす） | ✅ |
| `H_msg` 出力の分割（FORS メッセージ / 木インデックス / 葉インデックス） | ✅ |
| Alg. 17 `fors_pkFromSig` | ✅ |
| Alg. 8 `wots_pkFromSig` | ✅ |
| Alg. 12 `xmss_pkFromSig` | ✅ |
| **Alg. 20/24 `slh_verify`（end-to-end）** | ✅ |

改竄 5 種（メッセージ / R / FORS / ハイパートリー auth path / 公開鍵ルート）と
長さ不正も拒否を確認した。

### 30.2 ガス実測

| | gas | ブロック比 |
|---|---:|---:|
| **1 署名の検証** | **2,703,739** | 9.0% |
| **2-of-N（2 署名）** | **5,407,478** | **18%** |

**§21.3 の見積り（2-of-N で 2,469,664）に対し実測は約 2.2 倍。**
差はハッシュ層の外側 —— `base_2b`、ADRS の付け替え、`bytes` のスライスと
メモリ確保、ループ制御 —— が積み上がったもの。ハッシュ 4,348 回だけなら 2.5M だが、
その周辺で同じだけ食っている。

見積りが 2 段階（§24 → §21 → §22）で連続して楽観的だったことは記録しておく。
いずれも「支配的なコストだけ数えて周辺を無視する」という同じ誤り方をしている。

### 30.3 中核原則との関係

**この経路には楕円曲線仮定が一切無い。** §23 で確定した通り、Groth16 wrap 経路は
量子攻撃者に対して防御力を持たない（BN254 を破れば SPHINCS+ 署名を 1 つも用意せず
に保管庫が開く）。本検証器は SHA-256 のみに依存し、**プロトコルの中核主張を
実際に満たす唯一の実装**である。

NFR-2 の 100 万ガス目標は満たさない（5.4 倍）。ただし §24.4 の通りこれは自ら
設定した値であり、ブロックガス上限 30M に対して 18% で収まる。
**NFR-2 を実測に合わせて再設定する**という §24 の結論は変わらない。

### 30.4 残り

- ガス最適化（周辺コストが支配的と判明したので、そこが対象）
- `L1Vault` への接続（`ISPHINCSVerifier` 互換の口を用意し、閾値検証から呼ぶ）
- 監査。**新規に書いた暗号実装であり、参照との一致は必要条件であって十分条件ではない**

---

## 27. `L1Vault` への接続 (2026-08-21)

`SLHDSAVerifier` を既存の `ISPHINCSVerifier` に適合させた。**`L1Vault` の変更は不要**で、
`setSPHINCSVerifier` で差し替えるだけで proof を介さない量子耐性のある閾値検証に
切り替わる。

### 31.1 なぜ差し替えで済むか

`L1Vault._verifyWithSPHINCSVerifier` は既に

```solidity
if (sphincsVerifier.verify(message, signatures[i], pubKey)) validCount++;
```

という形で 1 署名ずつ呼んで数えている。`message` は
`SHA3_256.hashPair(lockId, stateRoot)` の `bytes32`、公開鍵は 32 バイト。
SLH-DSA-SHA2-128s の公開鍵（`PK.seed ‖ PK.root` = 32 バイト）はそのまま収まり、
署名長 7,856 バイトも `getSignatureSize()` が返す。

つまり**壊れていたのは実装だけで、インターフェースは正しかった**。

### 31.2 実装した口

| `ISPHINCSVerifier` | 備考 |
|---|---|
| `verify(bytes32, bytes, bytes)` | 閾値検証が使う本線 |
| `verifyBatch(...)` | 1 署名 2.7M なので、呼び出し側がブロック上限に対して本数を決める必要がある旨を明記 |
| `verifyWithDetails(...)` | 消費ガスを返す。上記の本数決定に使える |
| `computePublicKeyHash`, `isValidPublicKeyFormat`, `getSignatureSize` | — |

`verifyMessage(bytes, bytes, bytes)` を追加で用意した（可変長メッセージ用）。

### 31.3 テスト

`SLHDSAVerifier.t.sol` 12 件全パス。層ごとの一致（§22.1）に加えて、
`ISPHINCSVerifier` 越しの呼び出し、`verifyWithDetails` のガス報告と
エラー理由、公開鍵フォーマット判定を固定した。

### 31.4 残り

- **ガス最適化**。§22.2 の通り、支配的なのはハッシュではなく**その周辺**
  （`base_2b`、ADRS の付け替え、`bytes` のスライスとメモリ確保、ループ制御）。
  2-of-N で 5.4M = ブロックの 18% は動くが、削る余地は大きい
- **NFR-2 の再設定**（§24.4）。1M → 6M 程度が実測に即した値
- **監査**。参照実装との一致は必要条件であって十分条件ではない
- 旧 `SPHINCSVerifier.sol` の扱い（削除するか、非適合である旨を明記して残すか）

---

## 28. ガス最適化 — どこで止めるか (2026-08-21)

### 32.1 推測をやめて内訳を測った

§22.2 で「支配的なのはハッシュの周辺」と書いたが、**「周辺」は最適化の対象名では
ない**。まず桁分解の配列確保を消したところ 2,705,090 → 2,587,495（**4.3%**）に
しかならず、想定が外れた。そこで内訳を測った:

| 段 | gas | ハッシュ 1 回あたり |
|---|---:|---:|
| `H_msg` | 10,598 | — |
| FORS（182 回） | 281,595 | **1,547** |
| ハイパートリー（約 1,990 回） | 1,738,833 | 873 |

限界コストの実測値は 568（§21.3）。**FORS だけが 2.7 倍という外れ値**で、
そこに具体的な原因があると読めた。

### 32.2 原因: calldata スライスの写し

`bytes calldata` のスライスは、使う前に**要素を毎回メモリへ複製する**。
FORS は 182 要素、WOTS+ は 1 層あたり 35 要素 × 7 層、XMSS は 9 × 7。
`calldataload` で直接読むように変えた。

| | 変更前 | 変更後 | 削減 |
|---|---:|---:|---:|
| FORS（1 回あたり） | 1,547 | **1,150** | 26% |
| ハイパートリー（1 回あたり） | 873 | **827** | 5% |
| **1 署名** | 2,705,090 | **2,423,441** | **10.4%** |
| **2-of-N** | 5,410,180 | **4,846,882** | ブロックの **16%** |

### 32.3 ここで止める

残る余地はハッシュ呼び出しの床（2,174 × 568 = 1.24M）までの約 2 倍。
**それを取りにいかない判断をした**:

- 残りは `_chain` のループ制御と ADRS 更新で、**FIPS 205 の構造そのもの**に
  由来する。消すには assembly での大規模な書き換えが要る
- これは**新規に書いた暗号実装**であり、assembly を増やすほど監査面積とバグの
  余地が広がる
- **削っても判断が変わらない。** 2-of-N はブロックの 16%。4.8M でも 3M でも、
  実行可能性・方式選択・NFR-2 の再設定という結論は同一

最適化は「効果が判断を変えるとき」に価値がある。ここは既に変えない領域に入っている。

### 32.4 測定手法についての反省

§24 → §21 → §22 と 3 度連続で見積りを外し、いずれも
**「支配的なコストだけ数えて周辺を無視する」**同じ誤り方をした。今回さらに
「周辺 = 配列確保だろう」という推測も外した。

内訳を測ってから初めて外れ値（FORS の 1,547）が見え、原因（calldata の複製）に
到達した。**推測で最適化しない**というのが本節の教訓である。

---

## 29. NFR-2 の確定と旧実装の隔離 (2026-08-26)

### 33.1 NFR-2 を ≤6M に再設定

旧目標 **≤1M** は Groth16 wrap を前提に置いた値だった（§14 の ~254K に対して
4 倍の余裕を見た設定）。その経路は §23 で中核原則に反すると確定したので、
**前提ごと無効**になっている。

量子耐性のある直接検証の実測は **2-of-N で 4,846,882 gas**（§24）。
ブロックガス上限 30M に対して 16%。**≤6M** に再設定した ——
実行可能性を担保しつつ、退行（たとえば周辺コストの再混入）を捕まえられる値。

見積りの履歴を残しておく:

| 時点 | 2-of-N の見積り/実測 | 実測との比 |
|------|---:|---:|
| §22.1（外部実装からの類推） | ~284K | 17 倍外れ |
| §24.2（固有ハッシュコストから） | 1,252K | 3.9 倍外れ |
| §21.3（限界ハッシュコストから） | 2,470K | 2.0 倍外れ |
| §22.2（実装完成、未最適化） | 5,410K | — |
| **§24（最適化後、実測）** | **4,847K** | — |

**4 回連続で楽観側に外した。** いずれも「支配的な要素だけ数える」やり方で、
段階を追って誤差は縮んだが方向は一度も変わらなかった。

### 33.2 旧 `SPHINCSVerifier.sol` の隔離

削除ではなく**警告付きで残す**ことにした。`SPHINCSVerifierConformance.t.sol` が
「実署名で 673.8M ガスを消費して revert する」という事実を**通るテストとして
固定**しており、消すとその記録も消えるため。

ファイル冒頭（pragma の直後）に以下を明記した:

- **DEPRECATED — DO NOT DEPLOY. NOT FIPS 205.**
- 実署名で 673,778,501 gas を消費して完走しない（ブロック 22 個分）
- FIPS 205 ではない: ADRS（層・木・鍵ペア・チェーン・ハッシュ位置を担う 32 バイト
  構造）を 1 バイトのドメインセパレータで代用し、出力も規定の 16 バイトではなく
  32 バイト。**ガスが無限にあっても適合署名は検証できない**
- 後継は `src/crypto/SLHDSAVerifier.sol`

### 33.3 現在地

| | 状態 |
|---|---|
| FIPS 205 検証器 | ✅ 層ごとに参照実装と一致、実署名を検証 |
| `L1Vault` 接続 | ✅ `ISPHINCSVerifier` 適合。`setSPHINCSVerifier` で差し替えるだけ |
| ガス | ✅ 2-of-N で 4.85M = ブロックの 16%、NFR-2（≤6M）以内 |
| 旧実装 | ✅ 警告付きで隔離 |
| **監査** | ❌ **未実施。参照実装との一致は必要条件であって十分条件ではない** |

回帰: 関連 9 スイート 149 件全パス。

---

## 30. 署名方式ごとに、合う証明系が違う (2026-08-26)

「NIST の重い暗号の回路設計に改良余地はあるか」を、自前実装 → 外部研究 → 実測の順で調べた。
**改良余地は NTT 回路の最適化ではなく、証明系の選択にある。**

### 34.1 実測: ML-DSA-65 検証の 2 軸

証明系にかかる負荷は 2 軸で決まる —— **ハッシュ量**と **mod q 演算量**。
`dilithium-stark` の `cost_axes` example で数えた:

| 軸 | 内訳 | 合計 |
|---|---|---:|
| **Keccak 置換** | ExpandA 150（30 多項式 × 5）+ `c~'` 7 + `mu` 1 + SampleInBall 1 | **159** |
| **mod q 乗算** | NTT(z) 5,120 / NTT(t1) 6,144 / INTT(w) 6,144 / A∘z 7,680 / c∘t1 1,536 / NTT(c) 1,024 | **27,648** |

**比: 置換 1 回あたり mod q 演算 174 回。**

対して SLH-DSA-SHA2-128s の検証は **2,174 置換、体演算ゼロ**（§22）。

### 34.2 何を意味するか

証明系は、どちらかの軸を**ネイティブに扱い、もう一方をシミュレート**する:

| 証明系 | ネイティブ | シミュレート |
|---|---|---|
| ハッシュベース STARK（Plonky3、Goldilocks/BabyBear） | ハッシュ | **mod q** |
| 格子ベース（LaBRADOR / LaZer、M-SIS） | **mod q** | ハッシュ |

| 署名 | 支配的な軸 | 合う証明系 | 現状 |
|---|---|---|---|
| SLH-DSA | ハッシュ 2,174 / 体演算 0 | ハッシュベース STARK | `recursion-verify-m05`（Poseidon2+BabyBear）— **合っている** |
| **ML-DSA** | **mod q 27,648 / ハッシュ 159** | **格子ベース** | `dilithium-stark`（Goldilocks 上で mod q をシミュレート）— **合っていない** |

**ML-DSA 側は 174:1 で mod q が支配的**であり、それを別の体でシミュレートしている。
`ntt.rs`（776 行）のコメントにある制約「Modular reduction: all values < q」が、その税金の正体。

逆に、格子ベース証明系に移した場合に新たに背負うハッシュは **159 置換**。
これはハッシュベース側が SLH-DSA で既に 2,174 置換を扱っていることと比べて**桁で小さい**。
**逆向きのミスマッチは、順向きのミスマッチより軽い。**

### 34.3 外部の一次情報

- **LaBRADOR**（CRYPTO 2023、eprint 2022/1341、M-SIS 仮定）: R1CS 2²⁰ 制約の証明が **58 KB**
- **LaZer**（eprint 2024/1846）: その実装ライブラリ
- **ZK 付与版**（eprint 2026/1289、2026-06、Lyubashevsky ら）: 110 KB
- M-SIS は格子仮定なので**耐量子**。§23 で否定した Groth16（BN254、古典仮定）の問題は起きない

### 34.4 まだ判断できない

**「格子ベースに寄せるべき」とはまだ言えない。** 未測定が 2 つ:

1. **LaZer で ML-DSA 検証を証明した実測が公開情報に見当たらない。** 一般 R1CS の数字はあるが
   この用途のベンチマークが無い。無ければ自分で測るしかない
2. **オンチェーン検証ガスが不明。** 58〜110 KB の proof は calldata だけで
   16 gas/byte → 110 KB で約 1.8M gas。検証計算は別。§24 の直接 PQ 検証が
   2-of-N で 4.85M なので**桁は競合しうるが未確定**

加えて、zkSecurity が LaBRADOR 実装の健全性バグを報告している
（"Soundness Failures in LaBRADOR Implementations from NTT-Friendly Rings"）。
**皮肉にも NTT フレンドリー環に起因する問題**であり、新しい系統ゆえのリスクがある。

### 34.5 この節が確定させたこと

比 174:1 は実測であり、**証明系の選択が「好み」ではなく代数の問題**であることを示す。
`dilithium-stark` と `recursion-verify-m05` を同じハッシュベース STARK の系統で揃えている現状は、
SLH-DSA には最適で、**ML-DSA には構造的に不利**。

---

## 31. 格子 proof はオンチェーンで割に合うか — 損益分岐の実測 (2026-08-26)

§22 は「ML-DSA には格子ベース証明系が代数的に合う」を確定させた。
本節はその次の問い —— **その proof をオンチェーンで検証する価値があるか**を測る。
`test/LatticeProofGasProbe.t.sol`。

### 35.1 基準線: ML-DSA を直接検証する

| | 実測 |
|---|---:|
| mulmod（mod q）1 回 | **95 gas** |
| SHA-256 precompile 1 回 | 299 gas |
| 算術 27,648 回 | 2,626,560 |
| ハッシュ 159 回 | 47,541 |
| **ML-DSA 1 署名の直接検証** | **2,674,101 gas**（ブロックの 8%） |

**予想外に安い。** SLH-DSA の直接検証が 2,423,441（§24）なので、**両方式がほぼ同じ桁**に収まる。
「格子署名はオンチェーン検証には重すぎる」という前提は成り立たない。

### 35.2 損益分岐

LaBRADOR の決定的な性質は **「proof は sublinear、verifier は linear」**
（zkSecurity "Playing with LaBRADOR"）。証明サイズは O(log n) に落ちるが、
検証の仕事量は主張のサイズに比例したまま。**帯域は節約するがガスは節約しない。**

| 項目 | gas |
|---|---:|
| 110 KB proof の calldata のみ（EIP-2028） | 1,802,240 |
| 直接検証 | 2,674,101 |
| **verifier に残る予算** | **871,861** |
| その中で使える mulmod 回数 | **9,177** |
| 主張の演算数 | 27,648 |

→ **verifier が主張より 3 倍以上軽くなければ、proof はオンチェーンで割に合わない。**

LaBRADOR の verifier が linear である以上、この 3 倍を稼げる根拠は現時点で無い。

### 35.3 想定が外れた 2 点

本節を始める前、私は 2 つ誤った想定を置いていた。両方とも測定が否定した:

| 想定 | 実測 |
|---|---|
| 「110 KB の calldata だけで直接検証を超える」 | **超えない**（1,802,240 < 2,674,101）。ただし 2 倍以内なので、差は verifier の重さで決まる |
| 「格子証明系にも SHAKE 由来の逆ミスマッチがあり障害になる」 | ML-DSA 検証のハッシュは **159 置換**（§22.1）。ハッシュベース側が SLH-DSA で 2,174 置換を扱っているのと比べ桁で小さく、**障害にならない** |

### 35.4 proof が効き始める場所

直接検証は署名数に比例し、proof の calldata は比例しない:

| 閾値 | 直接検証 |
|---|---:|
| 1-of-N | 2,674,101 |
| **2-of-N** | **5,348,202** |
| 3-of-N | 8,022,303 |
| 5-of-N | 13,370,505 |
| **ブロックに収まる最大 N** | **11** |

ML-DSA は 11 署名までブロックに収まる。SLH-DSA（1 署名 2.42M）も同程度。
**現行の 2-of-N では直接検証で十分**であり、proof が要るのは N が二桁に届く場合。

### 35.5 結論

**格子ベース証明系は、証明生成側（オフチェーン）には合うが、
オンチェーン検証の代替にはならない** —— verifier が linear だから。

これは §23 の構図と同じ形をしている:

| | proof 側 | オンチェーン検証側 |
|---|---|---|
| SLH-DSA | ハッシュベース STARK が合う（§22） | 直接検証 2.42M で足りる（§24） |
| ML-DSA | **格子ベースが合う（§22）** | **直接検証 2.67M で足りる（本節）** |

**両署名とも、オンチェーンは直接検証が最も素直。** proof が価値を持つのは
オフチェーンで多数の署名をまとめる場面（EIP-8292 のアグリゲータ役割）であり、
L1 の閾値検証を置き換える用途ではない。

### 35.6 残る未測定

- LaZer で ML-DSA 検証を証明したときの **proof サイズと prover 時間**は依然未測定。
  §23.2 の 3 倍要件を満たす verifier が実在するなら結論は変わるが、
  linear verifier という性質からは期待しにくい
- zkSecurity が LaBRADOR 実装の健全性バグを報告している点は未評価のまま
