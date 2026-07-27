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
| M2 | SPHINCS+ 1 署名フル検証回路 (FORS + hypertree) | FIPS 205 KAT 全パス、proof 生成時間 p99 計測 (NFR-3: ≤1h 判定) | 🟡 **M2a(チェーン結合拘束)完了 → §8**。M2b/M2c 未着手 |
| M3 | N 本集約 + 閾値 + Registry コミットメント | 「2/5 有効・重複なし・全署名者が集合内」を public input として証明/改竄検知 | G2, G3 |
| **M0.5** | **proof wrapping/recursion 戦略の選定**（M0 で判明した proof をオンチェーン投稿可能サイズに畳む） | proof サイズ下限の実測 + wrap 方式決定マトリクス（実 wrap 実装は M0.5-impl） | 🟡 **選定完了 → §7**（wrap 実装は専用 CI 環境で後続） |
| M4 | オンチェーン統合: 検証器 + ProofCodec 橋渡し + L1Vault 接続 | Solidity 側で不正 proof (制約違反/偽 public input) が revert する forge テスト + golden テスト。実測ガス ≤ 1M (NFR-2) | G4, G5, M0.5 |
| M5 | E2E + 監査準備 | テストネットで proof-based Unlock 成功 tx + 不正 proof revert tx を記録 (受け入れ基準 3)。Slither + 回路仕様書公開 | 全部 |

**逐次依存**: M0 ✅ → M1 ✅ → M2 → M3 → (M0.5 選定 ✅ / wrap 実装は並行) → M4 → M5。
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

## 8. M2 計画 + M2a 実測結果: チェーン結合の拘束 (2026-07-26)

### 8.1 M2 の分解

M2（SPHINCS+ 1 署名フル検証回路）を 3 段に分解:

| 段 | 内容 | 状態 |
|----|------|------|
| **M2a** | **チェーン結合の拘束**（perm_i の出力 = perm_{i+1} の入力を回路内で強制）。M1 の keccak-air は各置換の正しさは証明するが、それらが連鎖している保証がない — ここが M2 の技術的最大リスク | ✅ **de-risk 完了 → §8.2** |
| M2b | フル WOTS+ 公開鍵導出（len=35 チェーン）+ ADRS 構造の拘束 | 🔴 未着手 |
| M2c | FORS（k 木）+ hypertree（d=7 層の WOTS+ 認証パス）+ ルート照合 | 🔴 未着手 |

### 8.2 M2a 実測結果（`src/crypto/circuits/wots-link-m2`）

カスタム Plonky3 `ChainAir` を実装し、**チェーン結合を transition 制約で強制できる**ことを実証。

- 列 `state`、transition 制約 `next.state == round(local.state)`（`round(x)=x^5+RC` は tweakable hash F の低次代数スタンドイン）、public `[start, end]` を先頭/末尾行に束縛。
- 結果:

| ケース | 結果 |
|--------|------|
| 正当なチェーン | prove ok / **verify = true** |
| public `end` 改竄 | **拒否** |
| 中間ステップ改竄（1 行破壊） | **拒否** |

**結論**: 「連続する行が固定の遷移に従う」ことを Plonky3 uni-stark AIR で強制でき、改竄は確実に検証失敗する。**M2 の最大リスク（チェーン結合の拘束可能性）は解消**。

### 8.3 keccak-air との統合方式（M2b への橋渡し）

M2a は `round` を代数関数にしているが、本番の F は SHAKE256 = Keccak-f。統合は**lookup 引数**で行う:
1. keccak-air が全 Keccak-f 置換の (入力状態, 出力状態) テーブルを生成（M1 で実証済み）。
2. リンク AIR（M2a 拡張）の `state` 列の各遷移 (x_i → x_{i+1}) を、上記テーブルへの **lookup** として拘束する（`x_{i+1}` は「x_i を入力とする Keccak-f の出力」であることを、keccak-air が別途証明した事実に紐付ける）。
3. これにより「置換の正しさ（keccak-air）」＋「連鎖の正しさ（リンク AIR）」が 1 つの証明に合成される。

Plonky3 は logup ベースの lookup をサポートするため、M2b はこの lookup 配線 + ADRS エンコードの拘束が中心となる。

---

## 9. M0.5-impl 仕様（SNARK wrap 実装 — 専用 CI 環境向け）

§7 で生 STARK proof が L1 投稿不可（最小 843KB）と確定したため、最終段で SNARK wrap が必須。本サンドボックスでは wrap ツールチェーンがビルド不可のため、実装は専用 CI に委譲するが、以下を確定仕様とする。

### 9.1 推奨実装（方式 C: 再帰集約 → Groth16 wrap）

1. **再帰集約**: フル署名の ~8000 Keccak-f 置換を複数の STARK proof に分割生成し、Plonky3 の再帰（proof-of-proofs）で 1 つの STARK に畳む。
2. **最終 SNARK wrap**: 集約 STARK 検証器を Groth16 回路として表現し、最終 proof を ~200 bytes に圧縮。EVM 検証 ~250K gas。
   - ツール候補: `gnark`（Go、成熟）または `halo2`（setup 不要だが verifier がやや大）。
   - Groth16 は回路固有 trusted setup（Powers of Tau + 回路固有 phase2）が必要。運用は「1 回のセレモニー → CRS を公開・オンチェーン検証器に埋め込み」。

### 9.2 成果物（CI で満たすべき完了条件）

- [ ] 集約 STARK proof の生成（複数 keccak proof → 1 proof）
- [ ] wrap した最終 proof のサイズ ≤ 10 KB、EVM 検証ガス ≤ 300K の実測
- [ ] Solidity 検証器コントラクト（Groth16Verifier）+ forge テスト（正当 proof 受理 / 改竄 proof revert）
- [ ] `L1Vault` / `STARKVerifier.sol` からの呼び出し配線（M4）

### 9.3 環境要件

- Go + gnark あるいは Rust + halo2 のビルド（外部 crate/module 取得可能な CI）
- Powers of Tau ceremony 成果物（既存の公開 ptau を再利用可）

---

## 10. 次アクション（優先順）

1. **M2b**: リンク AIR ↔ keccak-air の lookup 配線（§8.3）+ フル WOTS+（len=35）。本環境で着手可能。
2. **M0.5-impl**: §9 仕様に基づき専用 CI で SNARK wrap 実装。
3. **R-1 受け入れ基準 3 の証跡**: 新 Vault (`0x314703AC…`) で不正署名 Unlock の revert tx を取得し `ACTUAL_STATE.md` に記録（FR-THRESH-4 フル検証経路の強制実証）。
4. **M2c → M3 → M4 → M5**: FORS/hypertree → 集約/閾値 → オンチェーン統合 → E2E。

---

## 11. M2b 実測結果 + M2b-2 仕様 (2026-07-26)

### 11.1 M2b-1: フル WOTS+ 導出（`src/crypto/circuits/wots-full-m2`）

M1（単一チェーン）を **完全な WOTS+ インスタンス**へ拡張: メッセージダイジェストの base-w 分解 + チェックサム + len=35 チェーンを実装し、導出が行う全 Keccak-f 置換を keccak-air で証明。各 F は `sha3` 参照と一致を assert。

| 単位 | 置換数 | prove (ms) | verify (ms) | proof (bytes) | ok |
|------|------:|-----------:|------------:|--------------:|:--:|
| フル WOTS+ 公開鍵 | 300 | 12,802 | 24.2 | 2,709,812 | ✅ |

- 置換数 300 は検証側チェーン（各桁 `w-1-d_i` ステップ）の合計。全置換の keccak-air 証明が verify 成功。
- per-perm ~42.7ms → **フル署名 ~8000 置換で ~5.7 分**（単一スレッド・保守 FRI）。M0/M1 と整合し NFR-3 (≤1h) を満たす。

### 11.2 M2b-2 仕様: chain ↔ keccak-air の cross-table lookup（検証済み API）

Plonky3 に **`p3-lookup`（logup）+ `p3-batch-stark`** が存在し、本 pinned rev に **2 テーブル global-lookup の動作テスト**（`batch-stark/tests/simple.rs` の MulAir↔FibAir）があることを確認済み。keccak-air は `export` 列（multiset equality 用）と `preimage`（入力状態）/ `a_prime_prime_prime`（出力状態）を公開しており、**lookup の Send 側として設計されている**。

実装方式（M2b-2, 専用実装タスク）:
1. **keccak テーブル**（`KeccakAir`）: 各置換行が `export` フラグ付きで `(preimage, output)` を **`Direction::Send`**（`Kind::Global("keccak_f")`）。
2. **chain テーブル**（M2a `ChainAir` 拡張）: 各遷移行が `(local.state, next.state)` を **`Direction::Receive`**（同 `Kind::Global`）。round 制約は持たず、「その遷移は keccak テーブルが証明した Keccak-f である」ことを lookup で束縛。
3. **合成**: `CommonData::from_airs_and_degrees` → `StarkInstance::new_multiple` → `LogUpGadget::new()` → `prove_batch` / `verify_batch`。
4. multiplicity バランス（各置換 1 送信 = 各遷移 1 受信）とパディング行のセレクタ処理が実装上の要点。

これにより「置換の暗号的正しさ（keccak-air, M1）」＋「連鎖順序（chain AIR, M2a）」が **1 つの batch STARK 証明**に合成される。API 実現可能性は確認済み（参照テストあり）で、残るは配線実装のみ。

### 11.3 マイルストーン更新

| | 状態 |
|--|--|
| M2a（チェーン結合拘束） | ✅ §8 |
| M2b-1（フル WOTS+ スケール実証） | ✅ §11.1 |
| M2b-2（chain↔keccak-air lookup 配線） | 🟡 検証済み API 仕様確定 → §11.2（実装が次段） |
| M2c（FORS + hypertree） | 🔴 未着手 |
