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
| **G6** | CP-1 整合 | `dilithium-stark/src/hash.rs` は **Keccak256** を使用（「Ethereum 互換のため」と明記）。public input のハッシュも Keccak256。NFR-1 (SHA3-256/SHAKE256 のみ) に違反しており、SPHINCS+ 回路では最初から SHA3 系で設計する。Dilithium 回路も移行が必要 | 小〜中 | なし |
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
| M2c | 多ブロック SHAKE256 吸収（T_len / T_k の XOR リンク）+ FORS・hypertree 認証パス AIR | pk 圧縮・認証パスを含む honest accept / 改竄 reject の実測（方式は §9.5 spike 参照） | G1 |
| M2d | フル署名結合 + FIPS 205 KAT + p99 計測（M2 完了条件） | FIPS 205 KAT 全パス、proof 生成時間 p99 計測 (NFR-3: ≤1h 判定) | G1, G7 |
| M3 | N 本集約 + 閾値 + Registry コミットメント | 「2/5 有効・重複なし・全署名者が集合内」を public input として証明/改竄検知 | G2, G3 |
| **M0.5** | **proof wrapping/recursion 戦略の選定**（M0 で判明した proof をオンチェーン投稿可能サイズに畳む） | proof サイズ下限の実測 + wrap 方式決定マトリクス（実 wrap 実装は M0.5-impl） | 🟡 **選定完了 → §7**（wrap 実装は専用 CI 環境で後続） |
| M4 | オンチェーン統合: 検証器 + ProofCodec 橋渡し + L1Vault 接続 | Solidity 側で不正 proof (制約違反/偽 public input) が revert する forge テスト + golden テスト。実測ガス ≤ 1M (NFR-2) | G4, G5, M0.5 |
| M5 | E2E + 監査準備 | テストネットで proof-based Unlock 成功 tx + 不正 proof revert tx を記録 (受け入れ基準 3)。Slither + 回路仕様書公開 | 全部 |

**逐次依存**: M0 ✅ → M1 ✅ → M2a ✅ → M2b ✅ → M2c → M2d → M3 → (M0.5 選定 ✅ / wrap 実装は並行) → M4 → M5。
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
