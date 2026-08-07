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
  ├─ 署名検証回路 ....................................... SPHINCS+ フル検証の witness 層 済 (M2 §9)
  │                                                        WOTS+ チェーンの AIR 連結制約 済 (M1 §7)
  ├─ ハッシュ DAG の連結 ................................ LogUp PoC 済 (M3 §10)、Keccak 束縛が残 (§10.4-1)
  ├─ N 本集約 + 閾値カウント ............................ 【未着手】(M3、枠組みは §10 で確定)
  ├─ Registry 集合コミットメント束縛 (FR-THRESH-5) ...... オンチェーン側 済 (§6)、回路内検証は M3
  └─ オンチェーン側の回路固有 AIR 評価組み込み .......... 【未着手】(G4, M0.5 §8 が前提)
```

---

## 2. ギャップ一覧

| # | ギャップ | 内容 | 規模感 | 依存 |
|---|---------|------|:------:|------|
| **G1** | SPHINCS+ 検証回路 | SPHINCS+-SHAKE-128s (FIPS 205) の検証を AIR 化する。中核は **SHAKE256 = Keccak-f[1600] 置換の算術化**であり、FORS 検証 + WOTS+ チェーン + hypertree (d=7, h=63) の検証で 1 署名あたり数千回の置換評価が必要。ハッシュベース署名の AIR 化は NTT 系 (Dilithium) と全く異なる制約構造 | **最大**。Phase 2 最長のクリティカルパス | なし（着手可能） |
| **G2** | 集約・閾値レイヤ | N 本の署名検証を 1 つの trace に載せ、`valid_count >= threshold` を public input に含めて制約化する。署名者の重複排除も回路内で強制 | 中 | G1 |
| **G3** | Registry 集合コミットメント | 「署名者公開鍵が指定ブロック時点の active 集合に含まれる」の回路内 Merkle 検証。**オンチェーン側 (FR-THRESH-5) は実装済み (2026-08-05, §6)** — 残るは回路内での inclusion 検証 (M3) | 中 | なし（G1 と並行可） |
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
| M1 | SHAKE256 置換 AIR + 単一 WOTS+ チェーン検証回路 | FIPS 202/205 テストベクタで proof 生成→Rust 検証パス | ✅ **完了 → §7** |
| M2 | SPHINCS+ 1 署名フル検証回路 (FORS + hypertree) | FIPS 205 KAT 全パス、proof 生成時間 p99 計測 (NFR-3: ≤1h 判定) | ✅ **完了 → §9**（独立実装クロス検証、avg 2,144 置換、NFR-3 大幅クリア） |
| M3 | N 本集約 + 閾値 + Registry コミットメント | 「2/5 有効・重複なし・全署名者が集合内」を public input として証明/改竄検知 | 🟡 **§10 (LogUp PoC) / §11 (Keccak 束縛) / §12 (Registry membership + 閾値・重複排除)**。残: `valid` 列と署名検証結果の配線、Merkle の DAG 連結 (§12.3) |
| **M0.5** | **proof wrapping/recursion 戦略の PoC** | 🟡 **方式選定 → §8 / EVM ガス実測 → §13**（NFR-2 予算の ~25% で収まると確定）。残るは wrap 回路（証明側）の実装のみ |
| M4 | オンチェーン統合: 検証器 + ProofCodec 橋渡し + L1Vault 接続 | Solidity 側で不正 proof (制約違反/偽 public input) が revert する forge テスト + golden テスト。実測ガス ≤ 1M (NFR-2) | G4, G5, M0.5 |
| M5 | E2E + 監査準備 | テストネットで proof-based Unlock 成功 tx + 不正 proof revert tx を記録 (受け入れ基準 3)。Slither + 回路仕様書公開 | 全部 |

**逐次依存**: M0 ✅ → M1 → M2 → M3 → (M0.5 と並行) → M4 → M5。
**M0 で判明した最重要事項**: 生の STARK proof は 2.8MB で L1 直接投稿不可。M4 の前に **M0.5 (proof wrapping)** が必須クリティカルパスになった。
**~~リスク最大要素: M2 の proof 生成時間~~** → **解消 (2026-08-06, §9)**。実測 1 署名 ~5 分・2/N でも ~10 分オーダーで NFR-3 (≤1h) を 1 桁以上の余裕でクリア。
**現在のリスク最大要素**: (1) proof サイズ — wrapping 実装 (M0.5 §8) が M4 の必須前提、(2) proving ホストの **RAM**（§9.4-2: 1 署名で trace 1.38GB + 8x LDE。R-3 の proving service 要件に反映）。

---

## 4. 直近アクション

> 更新 2026-08-06。M0/M1/M2 完了、M0.5 方式選定済みを反映。

1. ~~**M3 の LogUp PoC**~~ ✅ (§10) / ~~**producer↔Keccak 束縛**~~ ✅ (§11) / ~~**Registry membership + 閾値・重複排除**~~ ✅ (§12)。次は §12.3-1（`valid` 列と署名検証結果の配線）と §12.3-2（Merkle 連鎖の DAG 連結）
2. **M0.5 の残作業**: wrap 回路（証明側）の実装。~~EVM ガス実測~~ ✅ (§13: 8 public input で ~254K gas、NFR-2 の ~25%)
3. G6 / CP-1 整合の決定者承認: 「proof システム内部ハッシュ (Poseidon2) は CP-1 適用外」の明文化（§8.5-4）。なお SPHINCS+ 回路 (M1/M2) は SHAKE256 のみで CP-1 適合済み
4. R-3 の proving service 要件に §9.4-2 の RAM 制約を反映
5. ~~M0 の実施~~ ✅ (§5) / ~~FR-THRESH-5 オンチェーン実装~~ ✅ (§6)

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

## 6. FR-THRESH-5 実装仕様: Active 集合コミットメント (2026-08-05)

`src/l1/contracts/src/ProverRegistry.sol` に実装。M3（回路内 inclusion 検証）はこの仕様を witness 側で再計算する。

### 6.1 コミットメント定義

```
LEAF_DOMAIN = keccak256("QS_PROVER_SET_LEAF_V1")
NODE_DOMAIN = keccak256("QS_PROVER_SET_NODE_V1")
SET_DOMAIN  = keccak256("QS_PROVER_SET_V1")

leaf_i = keccak256(LEAF_DOMAIN ‖ proverAddress_i(20B) ‖ sphincsPubKeyHash_i(32B))
         # activeProverList の格納順（swap-remove により順序は変動する。順序依存で問題ない）
         # sphincsPubKeyHash は従来通り SHA3-256(pubkey) — CP-1 維持

木     = リーフを次の 2 冪までゼロ (bytes32(0)) パディングした密 Merkle 木
node   = keccak256(NODE_DOMAIN ‖ left ‖ right)
root   = count == 0 ? bytes32(0) : 木の根

commitment = keccak256(SET_DOMAIN ‖ root ‖ uint256(count))
             # count を束縛するためパディング集合と非パディング集合は衝突しない
```

### 6.2 ハッシュ選定の根拠（G6 関連・レビュー対象）

木構造のハッシュは **EVM ネイティブ keccak256**。pure Solidity の SHA3-256 は 1 ハッシュ ~1M gas
（`SHA3_256Gas.t.sol` 実測）であり、メンバー変更ごとの O(n) 再計算は SHA3-256 では不成立。
blockchain.md の「L1 コントラクトは EVM ネイティブ keccak256/ECDSA を使用（Solidity 制約）」の
既存例外に該当する。回路側は Plonky3 keccak-air が同一の Keccak-f[1600] を証明するため、
SHA3-256 と回路コストは同一（パディングバイトが異なるのみ）。

### 6.3 エポックとチェックポイント

- 集合が変わるたび `activeSetEpoch` が単調増加し、`SetCheckpoint {commitment, root, blockNumber, proverCount}` を記録
- エポック 0 = 空集合（コンストラクタで記録）
- `isKnownActiveSetCommitment(bytes32)`: 過去のどこかのエポックで有効だったコミットメントか O(1) 判定
  — proof の public input 検証時に L1Vault / verifier が参照する想定 (FR-THRESH-1(b))
- 変更トリガ: `registerProver` / `registerProverTestnet` / `requestExit` / `slash`（min stake 未満で deactivate 時）
- `MAX_ACTIVE_PROVERS = 64` で再計算ガスを有界化
- イベント `ActiveSetCommitmentUpdated(epoch, commitment, root, proverCount, blockNumber)` を emit（FR-L3-5 同様に Explorer 追跡可能）

### 6.4 テスト

`test/ProverRegistryCommitment.t.sol` — 15 件（genesis / 登録 1・2・3 件の root 手計算一致 /
exit / slash-deactivate / 部分 slash 不変 / unbonding 中 slash のリスト非破壊 / 履歴照会 /
上限 revert / イベント）

---

## 7. M1 実施結果: SHAKE256 置換 AIR + 単一 WOTS+ チェーン検証回路 (2026-08-06)

`src/crypto/circuits/sphincs-m1/` に実装。**M1 完了**。

### 7.1 実装内容

- **witness 層**: SHAKE256 スポンジ (FIPS 202、Python hashlib 独立生成 KAT でピン留め)、
  FIPS 205 F 関数（128s パラメータでは 1 呼出 = 1 置換）、`chain()` witness 生成
- **チェーン AIR**: `p3-keccak-air` を `SubAirBuilder` で無改変再利用し、keccak-air が制約しない
  **置換間チェーン接続**を 4 本の追加カラム (`is_real`/`is_result`/`inv`/`seen`) で強制:
  - 次 preimage = 前ブロックの (value ← 出力 16B、hashAddress += 1) 差替（+256 リニア制約）
  - 初期スポンジ状態を public input に先頭行で束縛（100 limbs）
  - 結果行の位置は hashAddress の is-zero ガジェットで強制（存在は `seen` 累積で、
    一意性は bool 制約で保証 — 証明者が結果行を省略/偽装できない）
  - 結果 16B を public input に束縛
- **テスト 11 件**: KAT 3 + witness 整合 3 + prove/verify 成功系 2 + **改竄拒否 3**
  （結果改竄・初期状態改竄・チェーン長改竄がいずれも verify Err）

### 7.2 実測（シングルスレッド、本番 FRI: log_blowup=3, queries=100, pow=16）

| steps | rows | prove (ms) | verify (ms) | proof (bytes) |
|------:|-----:|-----------:|------------:|--------------:|
| 7 | 256 | 356 | 11.9 | 2,465,820 |
| 15 (フルチェーン) | 512 | 380 | 12.2 | 2,509,860 |

### 7.3 所見

1. G1 の中核リスク「keccak-air に置換間接続制約を追加できるか」は**解消**。
   `SubAirBuilder` により上流 AIR 無改変で合成でき、M2 (FORS/hypertree) も同じ構図で拡張できる。
2. proof サイズは行数に殆ど依存せず ~2.5MB（FRI クエリ開示が支配的）。**M0.5 (wrapping) の必要性を再確認**。
3. prove 時間はフルチェーン 0.4 秒 — M2 の NFR-3 (≤1h) に対し十分な余裕。

### 7.4 M2 への持ち越し

- 複数ブロック吸収（T_l / PRF はメッセージが 1 rate を超える）の in-circuit スポンジ接続
- FORS + hypertree (d=7, h=63) のツリー検証制約
- base-w エンコーディング（メッセージ digit → チェーン長の導出）— M1 ではチェーン長は public input

---

## 8. M0.5 実施結果: proof wrapping 戦略 (2026-08-06)

### 8.1 FRI パラメータだけで proof を縮められるかの実測

`sphincs-m1` の `fri_scan` バイナリで、概ね一定のセキュリティ予算
（log_blowup × queries ≈ 300、pow=16）を保ちながら blowup とクエリ数をトレードした。
対象はフル WOTS+ チェーン（15 ステップ、512 行）:

| log_blowup | queries | prove (ms) | verify (ms) | proof (bytes) |
|-----------:|--------:|-----------:|------------:|--------------:|
| 2 | 150 | 374 | 16.1 | 3,669,460 |
| 3 | 100 | 378 | 11.9 | 2,509,860 |
| 4 | 75 | 539 | 9.6 | 1,930,060 |
| 5 | 60 | 755 | 8.9 | 1,582,180 |
| 6 | 50 | 1,365 | 11.1 | 1,350,260 |
| 8 | 38 | 10,758 | 7.8 | 1,073,364 |

**結論**: blowup 256x（prove 28 倍化）まで振っても **~1.07MB が下限**。
EVM calldata は 16 gas/byte なので生 STARK は最良でも ~17M gas 相当となり、
NFR-2 (≤1M gas) に対し 1 桁以上不足。**FRI チューニングでは解決せず、wrapping が必須**（M0 所見の定量的確定）。

### 8.2 wrapping 方式の比較

| 方式 | 内容 | 利点 | 欠点 / リスク |
|------|------|------|--------------|
| **A. Poseidon2 MMCS 化 + SNARK wrap** | 内側 STARK の Merkle コミットメントを Keccak → Poseidon2（SNARK フレンドリ）に替え、STARK verifier を Groth16/PLONK 回路化して BN254 で wrap。Plonky2/SP1 系と同じ標準パイプライン | 最終 proof 数百 bytes、EVM 検証は Groth16 標準（文献値 ~200–300K gas、要実測）で NFR-2 達成可能 | verifier 回路の実装工数が大きい。現行 Keccak MMCS のままでは wrap 回路内の Keccak Merkle 検証が数千万制約となり非現実的 → **MMCS ハッシュ変更が前提**。Poseidon2 採用は G6/CP-1（SHA3 系のみ）と要整合（proof システム内部ハッシュとしての例外を要決定）。Groth16 は trusted setup が必要（PLONK/KZG なら universal setup） |
| **B. zkVM 経由 (SP1 / RISC Zero)** | SPHINCS+ 検証を zkVM ゲスト計算として書き、zkVM 標準の STARK→Groth16 wrap + 監査済み EVM verifier を利用 | 実装最速。wrap・EVM verifier・監査が既製 | 重量級依存の導入。ゲスト実行での SPHINCS+ 検証コスト（ハッシュ 10^3–10^4 回）の prove 時間は要実測。ベンダ回路の trusted setup への信頼。M1 で作った専用 AIR 資産は使われない |
| **C. STARK 再帰 (verifier AIR 自作)** | Plonky3 上で STARK verifier 自体を AIR 化し再帰圧縮 | 依存追加なし、量子耐性前提を維持（SNARK の楕円曲線仮定を持ち込まない） | pinned Plonky3 に production 再帰なし。実装工数最大。最終段でも proof は数十〜数百 KB 級で、EVM 検証ガスが NFR-2 に収まるかが未知数 |
| **D. proof 非搭載（コミットメントのみオンチェーン）** | proof はオフチェーン検証、L1 にはコミットメントのみ | 実装ゼロに近い | 「オンチェーン強制」(FR-THRESH-1) を満たさない。**要件不適合のため不採用** |

### 8.3 推奨

**2 トラック**:
1. **本線 = 方式 A**（Poseidon2 MMCS + SNARK wrap）。M1 の AIR 資産をそのまま活かせる標準構成。
   次アクション: (a) Poseidon2 MMCS 版 `sphincs-m1` のベンチ（プローブ時間への影響測定 — Plonky3 は
   Poseidon2 MMCS を同梱、コード変更は config 差替のみ）、(b) G6 と合わせて「proof システム内部
   ハッシュは CP-1 の適用外（アプリケーション層暗号ではない）」の明文化を決定者承認に掛ける、
   (c) wrap 回路の工数見積り（gnark / arkworks / 既製 STARK-verifier 回路の再利用可否）
2. **平行評価 = 方式 B**（SP1 での SPHINCS+ 検証ゲストの prove 時間・コスト実測）。
   本線が想定超過した場合の実装最速フォールバック。

方式 C は量子耐性の観点で長期的に望ましいが（SNARK wrap は検証層に楕円曲線仮定を再導入する）、
Phase 2 のスコープでは工数リスクが過大。**wrap 層の古典仮定は「資産保全は FR-THRESH-4 の
フル SPHINCS+ 直接検証経路が常時担保する」ことで受容する**（wrap が破られても署名偽造には
ならず、フォールバック経路の安全性は不変 — この論理も要件書に明記して承認対象とする）。

### 8.4 方式 A 追加実測: Poseidon2 MMCS のコスト (2026-08-06)

方式 A の前提「内側 STARK の Merkle コミットメントを Poseidon2 化」のネイティブ側コストを
`sphincs-m1` の `poseidon2_mmcs` バイナリで実測（同一 witness・同一 FRI パラメータ）:

| MMCS | prove (ms) | verify (ms) | proof (bytes) |
|------|-----------:|------------:|--------------:|
| Keccak（現行） | 421 | 12.4 | 2,509,860 |
| **Poseidon2**（wrap 前提） | 2,013 | 41.2 | 2,509,860 |

- prove は **~4.8 倍**に増えるが絶対値 2 秒であり、NFR-3 (≤1h) には全く影響しない
- proof サイズは不変（クエリ構造が同一、digest 幅も 32B 相当で同等）
- **結論**: 方式 A の「Poseidon2 化コスト」は問題にならない。残る作業は wrap 回路
  （Poseidon2 Merkle 検証 + FRI 検証の SNARK 回路化）の実装と EVM ガス実測のみ

### 8.5 M0.5 残作業

1. wrap 回路の実装（gnark / arkworks、または既製 STARK-verifier 回路の評価）→ 最終 proof 数百 bytes 化
2. Groth16/PLONK verifier コントラクトの EVM ガス実測（文献値 ~200–300K gas の裏取り）
3. 方式 B (SP1) の SPHINCS+ 検証ゲスト prove 時間の平行測定
4. 「proof システム内部ハッシュ (Poseidon2) は CP-1 適用外」の明文化と決定者承認 (G6 関連)

---

## 9. M2 実施結果: SPHINCS+ 1署名フル検証回路 (2026-08-06)

`src/crypto/circuits/sphincs-m2/` に実装。**M2 完了**（回路の witness 層 + 実測。DAG 連結制約は §9.4 の通り M3 へ）。

### 9.1 実装内容

FIPS 205 の検証経路を**全て**実装し、Keccak-f[1600] 置換を全数記録する witness 生成器とした:
`H_msg` → FORS (k=14 本 × 高さ a=12) → WOTS+ (len=35 チェーン) → hypertree (d=7, h'=9)。
Algorithm 4/5/8/12/14/17/20/24 を網羅（`ctx` 付き pure variant 含む）。

### 9.2 正当性: 独立実装によるクロス検証

自前テストだけでは「仕様の読み違いを両側で共有する」誤りを検出できないため、
**RustCrypto の独立実装 `slh-dsa` 0.2.0-rc.5 を dev-dependency のオラクル**として採用:
同実装が生成した鍵・署名を我々の検証器が**受理**し、改竄（メッセージ / R / FORS 署名 /
hypertree auth path / 公開鍵 root / context）は**全クラス拒否**することをテストで固定。
テスト 15 件（FIPS 202 KAT、パラメータ表サイズ、アドレス符号化、ブロック構造ごとの置換数、
オラクル受理、改竄拒否）全パス。G7（KAT 完全化）は本方式で M2 分を達成。

### 9.3 実測

**1 署名フル検証あたりの置換数**（実署名 8 本）:

| | 置換数 |
|---|---:|
| 構造的固定コスト | 284 |
| 実測 min | 1,994 |
| **実測 avg** | **2,144** |
| 実測 max | 2,354 |

変動分は WOTS+ チェーン（d×len = 245 本、各 `w-1-digit` 回）でメッセージダイジェスト依存。

**置換バッチの proof 生成**（本番 FRI: log_blowup=3, queries=100, pow=16、8 コア）:

| perms | rows | prove | verify | proof |
|------:|-----:|------:|-------:|------:|
| 2,084 | 65,536 | **287 s** | 17.3 ms | 2,899,532 B |

### 9.4 所見

1. **NFR-3 (≤1h p99) は大幅クリア**。1 署名 ~5 分、2/N 閾値でも ~10 分オーダー。
   FR-THRESH-1 の律速は依然として proof **サイズ**（M0.5 wrapping）であり、生成時間ではない。
2. **287 s はメモリ律速の上限値**。トレースだけで 65,536 行 × 2,633 列 × 8B ≈ 1.38 GB、
   これに 8x LDE が乗る一方で測定機は RAM 8 GB。置換あたり 138ms は M0 のシングルスレッド
   実測 59ms の 2.3 倍で、これはアルゴリズム的増加ではなくハードウェア圧。
   **proving ホストの RAM 要件が新たな設計制約**として判明（R-3 の proving service 設計に反映）。
3. **M3 の連結は positional 制約では不可能**。M1 の WOTS+ チェーンは「直線」なので
   置換 i の出力＝置換 i+1 の入力を固定オフセットで束縛できたが、フル SPHINCS+ 検証は
   **DAG**（FORS roots → T_k、WOTS+ pk → ツリーハッシュ、各層 root → 次層 WOTS+ メッセージ）
   であり、ある入力の生成元が固定位置にない。

### 9.5 M3 アーキテクチャ確定: LogUp + batch-stark

pinned Plonky3 リビジョンに**必要な部品が既に存在する**ことを確認した:

- `p3-lookup` — LogUp 実装（`logup.rs` / `lookup_traits.rs`）、**テーブル横断のグローバル lookup**（`LookupData`）対応
- `p3-batch-stark` — 共有チャレンジによるマルチテーブル proving

したがって M3 は次の構成とする:

```
[Keccak テーブル]  ... 本 M2 の witness（全置換）
      ↕ LogUp: (hash_id, digest) タプル
[連結テーブル]      ... 「消費される入力は必ずどこかで生成された出力である」を強制
```

この枠組みは M3 の他要件も同一機構で吸収できる:
- N 本署名の集約（署名ごとに別テーブル → 1 本の巨大トレースを避けられる。§9.4-2 のメモリ制約上これは重要）
- 閾値カウント `valid_count >= threshold` と署名者重複排除
- FR-THRESH-5 の ProverRegistry active 集合コミットメント束縛（§6 の仕様を回路内 Merkle 検証で消費）

**M3 の次アクション**: `p3-lookup` の LogUp API で Keccak テーブル ↔ 連結テーブルの
最小 PoC（2 ハッシュの入出力連結）を作り、グローバル lookup のオーバーヘッドを実測する。

---

## 10. M3 PoC 実施結果: LogUp による DAG 連結 (2026-08-06)

`src/crypto/circuits/sphincs-m3/` に実装。**§9.5 で確定した構成の実証と実測が完了**（M3 全体は §10.4 の通り継続）。

### 10.1 実装内容

グローバル LogUp 相互作用 `HASH_DAG` で 2 テーブルを結合し、
**「ハッシュ入力として消費された全ダイジェストは、いずれかのハッシュが生成したものである」**を強制する:

```
producer テーブル  行: [d0 d1 d2 d3 | mult]   Send    (mult = 消費回数)
consumer テーブル  行: [d0 d1 d2 d3 | sel ]   Receive (sel  = 実行行で 1)
                         └─ 16B ダイジェストを 32bit×4 リムに分解
```

`p3-lookup`（LogUp・グローバル相互作用）+ `p3-batch-stark`（共有チャレンジのマルチテーブル proving）を使用。
テーブルは合成データではなく、`sphincs-m2` が**実署名の検証から記録した実 DAG**から生成している。

### 10.2 実測

実 SLH-DSA-SHAKE-128s 検証 1 件の DAG:

| | |
|---|---:|
| ハッシュ呼出（生成ダイジェスト） | 2,144 |
| 内部エッジ（消費） | 2,135 |
| 外部入力（署名・公開鍵由来） | 491 |
| 各テーブル行数 | 4,096 × 5 列 |

proving（本番 FRI: log_blowup=3, queries=100, pow=16）:

| 構成 | prove | verify |
|---|---:|---:|
| LogUp 連結あり | 150.2 ms | 3.7 ms |
| 同一トレース・lookup なし（ベースライン） | 81.3 ms | — |

### 10.3 所見

1. **連結オーバーヘッドは連結テーブル上で 1.8 倍、全体では無視可能**。
   同じ検証の Keccak テーブルは ~287 秒（§9.3）なので、DAG 連結が proof 全体に加えるコストは **~0.05%**。
   M2 後に残っていた最大の設計上の疑問（DAG をどう連結するか）は、**コスト問題ではなかった**ことが確定した。
2. **改竄は検出される**: 「どのハッシュも生成していないダイジェストを入力として消費」および
   「生成物の消費回数の過大申告」の両方で verify がエラーになることをテストで固定（3 件全パス）。
   これは M1 が位置制約で得ていた性質を DAG に対して回復したもの。
3. **アーキテクチャ確定**: §9.5 の提案が実装レベルで妥当と確認できた。M3 の残りは同じ枠組みの拡張で足りる。

### 10.4 M3 残作業（本 PoC のスコープ外・意図的）

数値を過大に読まないよう明示する:

1. **producer テーブルの Keccak テーブルへの束縛**: 完成形では producer テーブル＝ Keccak テーブルであり、
   ダイジェストは Keccak AIR が制約済みの出力になる。現 PoC では producer が独立しているため、
   証明者が架空ダイジェストの producer 行を追加できてしまう。**次の実装ステップはこの配線**。
2. **どの producer がどの consumer に対応するかの束縛**: 多重集合論法は「生成されたこと」を示すが
   「その位置に属すること」は示さない。実回路では周囲の AIR のアドレス (`ADRS`) 列がこれを担う。
3. **N 本集約・閾値カウント・署名者重複排除・FR-THRESH-5 の Registry コミットメント回路内検証**:
   いずれも同一枠組み（署名ごとに別テーブル）で吸収できる見込みだが未実装。
   §9.4-2 のメモリ制約に照らすと、署名ごとにテーブルを分けられる点は実務上重要。

---

## 11. M3 残作業 (1): producer テーブルの Keccak テーブル束縛 (2026-08-06)

§10.4-1 として残していた**健全性の核心部分**を実装。`sphincs-m3` の `keccak_link.rs` / `bound.rs`。

### 11.1 何が問題だったか

§10 の PoC では producer テーブルが独立していたため、証明者が架空ダイジェストの producer 行を
追加すれば偽の consumer を相殺できた。連結の**コスト**は測れていたが**健全性**はまだ無かった。

### 11.2 実装: producer = Keccak テーブル

`KeccakDigestAir` が `p3-keccak-air` を `SubAirBuilder` で包み、2 列を追加して
**Keccak の出力列から直接読んだタプル**を `HASH_DAG` へ Send する:

```
[ KeccakCols (2,633) | is_digest | mult ]   Send    (digest = output_limb(0..8))
[ d0 d1 d2 d3        | sel       ]          Receive
```

squeeze される 16B ダイジェストは状態ワード 0・1 であり、keccak-air が `output_limb(0..8)`
（16bit リム）として公開している。2 リムずつを degree-1 の式で 32bit に再結合すると
consumer 側の `digest_limbs` 符号化と完全一致する。

公開の正当性は 3 本の AIR 制約で担保:

| 制約 | 意味 |
|------|------|
| `is_digest` が bool | フラグであること |
| `is_digest ⇒ step_flags[23]` | ダイジェスト公開は置換の**最終ラウンド行**のみ（出力状態が有効な行） |
| `mult ≠ 0 ⇒ is_digest` | パディング行・置換途中行は相互作用に寄与できない |

**これにより「消費される全ダイジェストは、Keccak AIR が正しさを証明した置換の出力である」**が成立する。

### 11.3 テスト（実 FORS 木の認証パス再計算を witness に使用）

`witness.rs` が FIPS 205 Algorithm 17 内側ループ（リーフ `F` + `a`=12 個のノード `H`、
実 `FORS_TREE` アドレス）を再現。全て単一ブロックで 13 置換 = 512 行と小さく、秒で証明できる。

| テスト | 結果 |
|--------|------|
| `binds_digests_to_the_keccak_trace` | ✅ 検証成功 |
| `rejects_a_digest_no_permutation_produced` | ✅ Keccak トレース外のダイジェストを拒否（§10 PoC と違い producer 行を足す余地がない） |
| `rejects_a_digest_published_off_the_final_round` | ✅ 証明時に検出 |
| `rejects_multiplicity_without_a_published_digest` | ✅ 証明時に検出 |

`sphincs-m3` テスト計 8 件全パス。

### 11.4 フルスケール実測 (2026-08-06)

実署名 1 件の**全 2,144 置換**を含む Keccak テーブルで束縛版を実測（本番 FRI、8 コア）:

| | |
|---|---:|
| ハッシュ呼出 / 内部エッジ / 外部入力 | 2,144 / 2,135 / 491 |
| Keccak テーブル | 65,536 行 × 2,635 列 |
| consumer テーブル | 4,096 行 × 5 列 |
| **prove** | **345,990 ms (≈ 5.8 分)** |
| **verify** | **141.5 ms** |
| 検証結果 | ✅ ok |

参考: §9.3 の Keccak テーブル単体（uni-stark、連結なし）は prove 287 秒 / verify 17.3 ms。

**差分 +59 秒 (+21%)** だが、これは LogUp 単体のコストではなく
「batch-stark のマルチテーブル機構 + permutation トレース + 追加 2 列 + LogUp」の合計である点に注意
（§10 のスタンドアロン実測が示すとおり LogUp 自体の絶対コストは ~70ms オーダー）。
verify が 17ms → 142ms に増えるのも同様にバッチ機構込みの数値。

**結論**: 健全性を備えた完全な連結構成でも **1 署名 ~6 分**で、NFR-3 (≤1h p99) に対し 1 桁の余裕を維持。
DAG 連結の健全性確立は性能上の障害にならない。なお §9.4-2 と同じくメモリ律速のホストでの上限値である。

### 11.5 残る精密化（正直な記載）

1. **マルチブロックハッシュの最終ブロック性は未固定**: ダイジェストは「置換の最終ラウンド行」でのみ
   公開できるが、その置換が当該ハッシュ呼出の**最終ブロック**であることはまだ強制していない。
   `F`・`H`（単一ブロック、2,144 呼出の大多数）にはギャップがなく、対象は `T_l`（3 or 5 ブロック）と
   `H_msg` のみ。閉じるにはスポンジ吸収構造の回路内表現が必要。
2. **producer↔consumer の対応付け**は多重集合論法の対象外（周囲の AIR のアドレス列が担う）。§10.4-2 のまま。
3. **N 本集約・閾値・Registry 束縛**は未実装。§10.4-3 のまま。

---

## 12. M3 残作業 (2): Registry membership と閾値・重複排除 (2026-08-07)

§10.4-3 として残していた要件のうち、**FR-THRESH-1(b) の回路側基盤**と
**FR-THRESH-1(c) の閾値カウント・重複排除**を実装。`sphincs-m3` の
`registry.rs` / `agg.rs`。

### 12.1 FR-THRESH-1(b): Registry membership の回路側実装

FR-THRESH-5 のコミットメント (§6) を回路側で再計算し、Merkle inclusion を
**置換記録つき**で検証する。これにより membership 検証が署名検証と同じ
Keccak witness に載る。

**正当性はコントラクト側に固定**した（自前実装同士の照合では意味がないため）:
`src/l1/contracts/test/ProverSetCommitmentVectors.t.sol` を新規追加し、
Solidity の `computeActiveSetCommitment()` が出力する参照ベクタを Rust 側の
テストで突き合わせている。カバー範囲はドメインセパレータ 3 種、リーフ符号化、
および 0〜5 メンバーの root / commitment（空集合・ノードハッシュ無しの単一
リーフ・2 冪ちょうど・ゼロパディング 2 種）。
membership の否定系として、非メンバー・位置詐称・古い member count を拒否
することも固定した。

**ハッシュの取り扱い**: `sphincsPubKeyHash` は SHA3-256 (CP-1) のまま、木は
keccak256（§6.2 の EVM ネイティブ例外）。両者は同一置換なので 1 つの Keccak
テーブルで証明できる。これに合わせて `sphincs-m2` のスポンジをドメイン
パラメータ化した（`shake256_parts` / `sha3_256_parts` / `keccak256_parts` が
同一の記録経路を共有）。

### 12.2 FR-THRESH-1(c): 閾値カウントと署名者重複排除

**署名ごとではなく active prover スロットごとに 1 行**という構成にした:

```
row i:  [ slot | valid | count ]
```

これにより**重複排除が構造的に成立する** — 各 Prover は 1 行しか持たないので
二重カウントが表現できず、ソート論法もレンジチェックも不要。
`slot` は行インデックスに固定、`valid` は bool、`count` は接頭辞和、
最終 `count` は public input `valid_count` に束縛。

**`valid_count >= threshold` の比較は意図的に L1 側に残した**: count は
public input なので `L1Vault` が 1 回の比較で検査でき、回路内レンジチェック
より安価かつ拘束力は同等。

テスト 8 件: 2-of-64 / 空・満杯ロスター / 過大申告・過小申告・count 連鎖破壊・
非 bool の `valid`・slot 並べ替えの拒否。

`sphincs-m3` テスト計 22 件全パス（警告 0）。

### 12.3 残作業（正直な記載）

1. **集約テーブルの `valid` 列はまだ witness**。閾値と重複排除は強制されるが、
   `valid = 1` が「**そのスロットの** SPHINCS+ 署名が、Merkle 証明済みの
   Registry メンバーに対して検証された」ことを意味するようには**まだ拘束していない**。
   各署名の計算 hypertree root と `PK.root` の一致、およびスロットと Registry
   リーフの結び付けが次の配線。
2. **Registry Merkle 連鎖は記録済みだが DAG 連結は未接続**。置換は witness に
   載っているが、`HASH_DAG` のタプルは 32bit×4（16B の SPHINCS+ ダイジェスト）
   である一方 Merkle ノードは 32B。8 リムのタプル + kind タグにするか、
   第 2 の相互作用を足すかの小規模な変更で接続できる。
3. **複数署名が 1 つの Keccak テーブルを共有している**。署名ごとにテーブルを
   分ける（`p3-batch-stark` が直接サポート）ことが、N 本時に §9.4-2 の
   メモリ上限を扱いやすく保つ鍵。

---

## 13. M0.5 残作業: Groth16 verifier の EVM ガス実測 (2026-08-07)

§8.5-2 として残していた **NFR-2 (proof-based Unlock ≤ 1M gas) の判定材料**を実測で確定した。
`src/l1/contracts/src/wrap/Groth16Verifier.sol` と `test/Groth16VerifierGas.t.sol`。

### 13.1 何を測ったか

方式 A（STARK を SNARK に wrap）のオンチェーン側、すなわち BN254 Groth16 検証器。
検証式は標準形 `e(-A,B)·e(α,β)·e(L,γ)·e(C,δ) == 1`、`L = IC[0] + Σ IC[i+1]·input[i]`。

**検証が実際に成功する構成で測定した**（早期 return を測ってしまわないため）:
`L = C = O`（無限遠点）とすると式は `e(-G1,G2)·e(G1,G2) = 1` に潰れて成立する。
public input ごとの `ecMul` + `ecAdd` は `IC[i] = O` でも完全な precompile 呼出になるので、
コストは実運用と同じ。

### 13.2 実測値

| public inputs | gas |
|--------------:|----:|
| 0 | 193,078 |
| 1 | 198,504 |
| 2 | 206,433 |
| 4 | 222,287 |
| 8 | **253,998** |
| 16 | 317,470 |

- **public input あたりの限界コスト: 7,338 gas**（`ecMul` 6,000 + `ecAdd` 150 + calldata・ループ分）
- 固定コスト ~193K の大半は `ecPairing` 4 ペア（45,000 + 4×34,000 = 181,000）

### 13.3 NFR-2 判定

FR-THRESH-1 の public input は「active 集合コミットメント・メッセージハッシュ・
valid 署名数・lock/state root」程度、すなわち数個〜十数個の field element。
**8 個で ~254K gas = NFR-2 予算 1M の約 25%**。残り ~746K が Unlock の他処理に使える
（現行 Unlock 総ガス目標は ~490K, SEQUENCES §2）。

wrap 後の proof は 8 field element = 256 bytes で、calldata コストは ~4K gas と無視できる。
なお本測定は verifying key も calldata で渡しているため、本番のように VK を定数化すれば
input あたり ~1K gas ほど下がる（下振れ方向の保守的な測定）。

**結論: NFR-2 は方式 A で大きな余裕をもって満たせる。**
オンチェーン検証コストはもはや制約ではなく、**M0.5 の残リスクは wrap 回路（証明側）の
実装工数のみ**に絞られた。

### 13.4 スコープ外（明示）

- 本コントラクトはどの Unlock 経路にも接続していない。`L1Vault` 統合は M4 であり、
  実際の wrap 回路とその verifying key が存在してからになる
- 測定に使った点は「検証が成立する参照構成」であって実 proof ではない。
  precompile のコストは入力の妥当性のみに依存し proof の中身には依らないため、
  ガス値としては代表性がある

---

## 14. M3 残作業 (3): Merkle 連鎖の DAG 連結と pk_root の入力側束縛 (2026-08-07)

§12.3-1 / §12.3-2 を実装。`sphincs-m3` の `link.rs` / `keccak_link.rs` /
`registry.rs` / `tables.rs` / `agg.rs`。

### 14.1 §12.3-2: Registry Merkle 連鎖の DAG 連結

SPHINCS+ ダイジェストは 16B、Registry のノードは 32B でタプル幅が違う問題は、
**相互作用を 2 本に分ける**ことで解決した:

| 相互作用 | タプル | 対象 |
|---------|-------|------|
| `HASH_DAG` | 32bit × 4 | 16B の SPHINCS+ ダイジェスト |
| `MERKLE_DAG` | 32bit × 8 | 32B の Registry リーフ・ノード |

1 本に統合してゼロパディング + kind タグにする案は、producer 側に degree-2 の
マスク式が必要になり高くつくうえ、2 つの値空間を混同する余地が残る。
細いタプル 2 本のほうが安く、混同も起きない。

Keccak テーブルに `is_node` / `node_mult` 列を追加し、`output_limb(0..16)` から
32B ダイジェストを Send。`NodeLinkAir`（32B consumer）が Receive する。
`registry.rs` は公開鍵ハッシュ・リーフ・各ノードを node call として記録し、
`build_node_dag` が「pubkey hash → leaf → node → … → root」の内部エッジを抽出する。

テスト: 一貫した membership 連鎖が検証を通ること、および
**どの置換も生成していない 32B 値（偽造ノード）が拒否される**ことを固定。

### 14.2 §12.3-1: pk_root の入力側束縛

これまでの相互作用はすべてハッシュの**出力**で照合していた。
そのため「正規に登録された公開鍵のハッシュ」と「任意の `PK.root`」を
組み合わせて主張することを防げなかった。

**`PUBKEY_BIND` 相互作用**を追加し、ハッシュの**入力**フィールドを公開する:

```
タプル = ( sha3(PK.seed ‖ PK.root) の出力 32B , 入力中の PK.root 16B )
         └ output_limb(0..16)                  └ input_limb(8..16)
```

登録公開鍵は `PK.seed ‖ PK.root` の 32B なので、`PK.root` は preimage の
バイト 16..32 = 16bit リム 8..16 として keccak-air の列から直接読める。
集約テーブルは multiplicity `valid` でこのペアを Receive する。

結果、**`valid` なスロットは「Keccak テーブルが実際にハッシュした公開鍵の中身
そのものである `PK.root`」しか主張できない**。

テスト: 正規の公開鍵ハッシュと別の `PK.root` を組み合わせた主張が
拒否されることを固定（`rejects_a_pk_root_that_is_not_in_the_hashed_key`）。

### 14.3 FR-THRESH-1(b) の連鎖の現状

```
公開鍵 (PK.seed ‖ PK.root)
   │ sha3 ── PUBKEY_BIND ──→ 集約テーブルの pk_root を束縛 ✅
   ↓
pubkey_hash ── MERKLE_DAG ──→ リーフが消費 ✅
   ↓
leaf ── MERKLE_DAG ──→ ノード連鎖 ✅
   ↓
root ── compute_commitment ──→ 公開 commitment との一致（回路外の等式、要 public input 化）
```

`sphincs-m3` テスト計 29 件全パス。バッチは最大 4 テーブル
（Keccak / 16B consumer / 32B consumer / 集約）を `prove_tables` で組める形に一般化した。

### 14.4 残り

- Merkle root → `compute_commitment` → 公開コミットメントの等式を public input として束縛する
- 署名検証そのもの（M2 の witness）と集約テーブルのスロットの対応付け
- §11.5-1（マルチブロックの最終ブロック性）、署名ごとのテーブル分割
