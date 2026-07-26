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
| M1 | SHAKE256 置換 AIR + 単一 WOTS+ チェーン検証回路 | FIPS 202/205 テストベクタで proof 生成→Rust 検証パス | G1 |
| M2 | SPHINCS+ 1 署名フル検証回路 (FORS + hypertree) | FIPS 205 KAT 全パス、proof 生成時間 p99 計測 (NFR-3: ≤1h 判定) | G1, G7 |
| M3 | N 本集約 + 閾値 + Registry コミットメント | 「2/5 有効・重複なし・全署名者が集合内」を public input として証明/改竄検知 | G2, G3 |
| **M0.5** | **proof wrapping/recursion 戦略の PoC**（M0 で判明した 2.8MB proof をオンチェーン投稿可能サイズに畳む） | Groth16 wrap 等で最終 proof を数 KB に圧縮し EVM 検証ガスを実測 | **G4 の前提（M0 実測により新規追加）** |
| M4 | オンチェーン統合: 検証器 + ProofCodec 橋渡し + L1Vault 接続 | Solidity 側で不正 proof (制約違反/偽 public input) が revert する forge テスト + golden テスト。実測ガス ≤ 1M (NFR-2) | G4, G5, M0.5 |
| M5 | E2E + 監査準備 | テストネットで proof-based Unlock 成功 tx + 不正 proof revert tx を記録 (受け入れ基準 3)。Slither + 回路仕様書公開 | 全部 |

**逐次依存**: M0 ✅ → M1 → M2 → M3 → (M0.5 と並行) → M4 → M5。
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
