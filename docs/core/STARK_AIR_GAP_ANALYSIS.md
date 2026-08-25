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
| M3 | N 本集約 + 閾値 + Registry コミットメント | 「2/5 有効・重複なし・全署名者が集合内」を public input として証明/改竄検知 | 🟡 **§10〜§18**: DAG 連結・Keccak 束縛・membership・閾値/重複排除・判定配線・preimage 束縛・コミットメント public input 化・テーブル分割まで完了。残: 集約スロットと個別署名 witness の対応付け、`T_l` 尾部 (10.3%)、マルチブロック最終ブロック性 |
| **M0.5** | **proof wrapping/recursion 戦略の PoC** | 🟢 **完了**: §8 方式選定 / §13 EVM ガス実測 (~254K gas) / §19 方式修正 (zkVM 直接検証が 228 倍安い) / §20 ゲスト前提達成 / §21 SP1 サイクル実測 / §22 precompile 化 (**1 署名 8.9M サイクル**、2-of-N で ~18M) |
| M4 | オンチェーン統合: 検証器 + public values 橋渡し + L1Vault 接続 | 🟡 **オンチェーン側完了 → §23**（`ThresholdProofVerifier` + `requestUnlockWithProof`、束縛ごとの否定系 11 件、golden vector で Rust↔Solidity 固定、proof 検証部 ~275K gas = NFR-2 の 27%）。ゲスト側も §24 で完了（2-of-4 で 18.2M サイクル、100B commit） |
| M5 | E2E + 監査準備 | テストネットで proof-based Unlock 成功 tx + 不正 proof revert tx を記録 (受け入れ基準 3)。Slither + 回路仕様書公開 | 全部 |

**逐次依存**: M0 ✅ → M1 → M2 → M3 → (M0.5 と並行) → M4 → M5。
**M0 で判明した最重要事項**: 生の STARK proof は 2.8MB で L1 直接投稿不可。M4 の前に **M0.5 (proof wrapping)** が必須クリティカルパスになった。
**~~リスク最大要素: M2 の proof 生成時間~~** → **解消 (2026-08-06, §9)**。実測 1 署名 ~5 分・2/N でも ~10 分オーダーで NFR-3 (≤1h) を 1 桁以上の余裕でクリア。
**現在のリスク最大要素**: (1) proof サイズ — wrapping 実装 (M0.5 §8) が M4 の必須前提、(2) proving ホストの **RAM**（§9.4-2: 1 署名で trace 1.38GB + 8x LDE。R-3 の proving service 要件に反映）。

---

## 4. 直近アクション

> 更新 2026-08-06。M0/M1/M2 完了、M0.5 方式選定済みを反映。

1. M3 は §10〜§15 で連結・束縛・集約・分割まで完了。残りは §16.3 のサマリ参照。**次の実装単位は §16.1 の「preimage 列が直接 Receive する」設計**
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
Phase 2 のスコープでは工数リスクが過大。~~**wrap 層の古典仮定は「資産保全は FR-THRESH-4 の
フル SPHINCS+ 直接検証経路が常時担保する」ことで受容する**（wrap が破られても署名偽造には
ならず、フォールバック経路の安全性は不変 — この論理も要件書に明記して承認対象とする）。~~

> ⚠️ **この受容は無効（§27）。** 前提とした FR-THRESH-4 は §25 で実行不能と実測された。
> 条件が偽である以上、Groth16 wrap を単独の認可経路にしてはならない。

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

---

## 15. M3 残作業 (4): 署名ごとのテーブル分割 (2026-08-07)

§12.3-3。`prove_tables` の N テーブル一般化（§14）により、**署名ごとに独立した
Keccak テーブルを持てる**ことを実証した。相互作用はグローバルなので
テーブル間で自動的に釣り合う。

テスト 2 件:
- `two_signatures_use_separate_keccak_tables`: 2 署名がそれぞれ自分の
  Keccak / 16B consumer / 32B consumer を持ち、1 つの集約テーブルに合流して
  `valid_count = 2` が成立する
- `rejects_a_slot_without_a_matching_signature_table`: 1 署名しか証明されて
  いないのに 2 スロットが判定を主張すると、2 つ目の root に producer が
  足りず拒否される

これは §9.4-2 のメモリ制約（1 署名で trace 1.38GB + 8x LDE）に対する
直接的な回答でもある。N 署名を 1 本の巨大トレースに載せる必要がない。

`sphincs-m3` テスト計 31 件全パス。

---

## 16. 未実装項目の評価 (2026-08-07)

残り 2 項目について、**セッション内で実装できるものとできないものを分けて**記録する。

### 16.1 §11.5-1 マルチブロックハッシュの最終ブロック性 — 未実装

**現状の正確な露出**: ダイジェストは置換の最終ラウンド行でのみ公開できるが、
その置換が当該ハッシュ呼出の**最終ブロック**である保証はまだない。

対象は 1 署名あたり **8 呼出 / 38 置換**（全 ~2,144 置換の 1.8%）:

| 呼出 | ブロック数 | 件数 |
|------|-----------:|-----:|
| FORS `T_k`（k=14 値, 272B） | 3 | 1 |
| WOTS+ `T_len`（len=35 値, 608B） | 5 | 7（層ごと） |
| `H_msg` | メッセージ長次第（88B 超で 2+） | 0〜1 |

`F` と `H` は単一ブロックなのでギャップは無い（残り 2,136 呼出）。

**なぜ安く閉じられないか**: 完全に閉じるにはスポンジ吸収構造の回路内表現、
すなわち「ブロック j+1 の preimage = ブロック j の出力 XOR メッセージブロック」
の強制が要る。keccak-air の preimage は 16bit リムで保持されており、
**XOR は線形式で書けない**（ビット分解か lookup ベースの XOR が必要）。
capacity 部分（ワード 17..25）は XOR 相手がゼロなので等式で書けるが、
それだけでは「途中ブロックの出力をダイジェストと詐称する」ことは防げない。

**有望な代替設計**: `PUBKEY_BIND`（§14.2）で実証した**入力側の相互作用**を
一般化し、別の consumer テーブルではなく **Keccak テーブルの preimage 列が
直接 `HASH_DAG` から Receive する**構成にする。**次の実装単位として最有力**。

> **訂正 (2026-08-07, §17 の実装による)**: 当初ここに「最終ブロック性の問題自体が
> 消える」と書いたが、実装して精査した結果**これは誤り**だった。preimage が生の
> メッセージなのは**第 1 ブロックだけ**で（初期状態がゼロのため XOR が恒等）、
> 第 2 ブロック以降の preimage は「前ブロックの出力 XOR メッセージブロック」であり
> 直接は読めない。したがって最終ブロック性は別問題として残る。
> ただし preimage 直接 Receive にはこれとは**別の、より重要な効果**があることが
> 判明した — §17 参照。

### 16.2 wrap 回路（証明側）の実装 — セッション規模を超える

**オンチェーン側は完了している**（§13: 8 public input で ~254K gas、
NFR-2 予算の ~25%）。残るのは「内側 STARK の検証器を SNARK 回路として書く」部分で、
これは数週間規模の作業であり、セッション内の増分では終わらない。**着手していない**。

必要な作業の内訳:

| 作業 | 内容 | 規模感 |
|------|------|:------:|
| MMCS の Poseidon2 化 | §8.4 で計測済み（prove 0.42s→2.0s、proof サイズ不変）。config 差替で済む | 小 |
| FRI 検証器の回路化 | クエリごとの Merkle パス検証 + 折り畳み。内側 proof のクエリ数 100 × パス長ぶんの Poseidon2 圧縮 | **大** |
| AIR 制約評価の回路化 | 内側 AIR（keccak-air + 本 M3 の追加列 + LogUp）の制約を wrap 回路内で再評価 | **大** |
| Fiat-Shamir の回路化 | transcript の再現 | 中 |
| verifying key 生成と定数化 | trusted setup（Groth16）または universal setup（PLONK/KZG） | 中 |

**推奨の進め方**: 自前で全部書く前に、既製の STARK-verifier 回路
（SP1 / RISC Zero が同等の wrap を持つ）を評価する。§8.2 の方式 B を
「フォールバック」ではなく**方式 A の実装手段そのもの**として使える可能性がある。
これは M4 着手前の技術判断事項。

### 16.3 現時点の Phase 2 残作業サマリ

| 項目 | 状態 |
|------|------|
| ~~Merkle root → 公開コミットメントの public input 化~~ | ✅ §18 |
| 集約スロットと個別署名 witness の対応付け | 未実装（中） |
| §11.5-1 マルチブロック最終ブロック性 | 未実装（中〜大、§16.1 の設計が有力） |
| wrap 回路（証明側） | ✅ 方式確定・ゲスト実装・サイクル実測まで完了 (§19〜§21)。残る最適化は Keccak precompile 化 |
| M4 オンチェーン統合 | 🟢 オンチェーン側 (§23) + ゲスト側 (§24) 完了。残は実 proof での E2E (M5) |
| M5 E2E | 実 proof 生成・verifying key 確定・テストネット tx が残 |


---

## 17. preimage 直接 Receive の実装 (2026-08-07)

§16.1 で「次の実装単位として最有力」とした設計を実装した。
`sphincs-m3` の `keccak_link.rs` / `tables.rs`。

### 17.1 実装して判明した、これが本当に解く問題

当初は §11.5-1（マルチブロック最終ブロック性）の解として提案したが、
実装の過程で**それとは別の、より重大なギャップ**を解いていることが判明した。

**従来スキームのギャップ**: 独立した consumer テーブルの行は**自由な witness**
だった。制約は多重集合の釣り合いだけなので、証明者は釣り合う値を書けばよい。
つまり「消費されたダイジェストは生成されたものである」は成立していても、
**それらの値が実際にどこかのハッシュの入力として使われたことは何も強制していなかった**。
producer が mult=1 で送り、consumer テーブルがそれを受けるだけの、
実質的に自己参照な構成になり得た。

**preimage 直接 Receive**では、受け取る値が Keccak トレース自身の preimage 列、
すなわち **Keccak AIR が制約している実際のハッシュ入力**になる。
これにより「このハッシュの入力値は、別のハッシュが生成した出力である」が
初めて実際に強制される。

### 17.2 実装

SPHINCS+ の tweakable hash は全て `SHAKE256(PK.seed ‖ ADRS ‖ values…)` なので、
第 1 の値引数はメッセージバイト 48（16bit リム 24）、第 2 は バイト 64（リム 32）
から始まる。Keccak テーブルに `recv0` / `recv1` 列を足し、
`input_limb` から読んだ値を `HASH_DAG` から Receive する。

制約:

| 制約 | 意味 |
|------|------|
| `recv0`, `recv1` が bool | フラグであること |
| `recv ⇒ step_flags[0]` | 値引数の主張は置換の**第 1 ラウンド行**のみ。preimage が生のメッセージなのはそこだけ（第 2 ブロック以降は前出力との XOR） |

### 17.3 カバレッジ（実署名で実測）

| | エッジ数 | 割合 |
|---|---:|---:|
| preimage に直接束縛 | 1,915 | **89.7%** |
| consumer テーブルに残る | 220 | 10.3% |
| 合計 | 2,135 | |

`F`（値 1 個）と `H`（値 2 個）は**全て**第 1 ブロックに収まるので完全にカバーされる
（~2,144 呼出中 2,136）。残る 220 は `T_l` の第 3 値以降 — FORS `T_k`（14 値）と
WOTS+ `T_len`（35 値 × 7 層）が第 1 レートブロックを超える分。
なお理論上限 243 より少ないのは、チェーン長 0 の WOTS+ 要素では
署名要素がそのまま `T_len` の入力になり外部値（エッジではない）になるため。

### 17.4 テスト

- `preimage_binding_covers_a_fors_tree`: FORS 木の全内部エッジが preimage に束縛され、
  consumer テーブルの行が 1 つも要らないことを確認
- `rejects_an_external_input_claimed_as_internal`: **従来スキームでは得られなかった性質**。
  FORS リーフの `sk` や auth path の兄弟は署名由来の外部値であり、
  これを内部値と偽って主張すると producer が居ないため相互作用が釣り合わず拒否される
- `preimage_binding_coverage_on_a_real_signature`: 実署名でのカバレッジを固定

`sphincs-m3` テスト計 34 件全パス。

### 17.5 残り

- `T_l` の第 3 値以降（10.3%）は consumer テーブルのまま。第 2 ブロック以降の
  preimage を扱うにはスポンジ吸収の回路内表現が必要で、これは §16.1 と同じ壁
- §11.5-1（マルチブロック最終ブロック性）は**依然として未解決**。§16.1 の訂正参照

---

## 18. FR-THRESH-1(b) の連鎖が公開入力まで閉じた (2026-08-07)

§14.3 で「回路外の等式」として残していた最後の一手を実装した。

### 18.1 コミットメントの public input 化

`compute_commitment_traced` を追加し、`keccak256(SET_DOMAIN ‖ root ‖ count)` を
witness に記録する（root を消費するので Merkle 連鎖の内部エッジになる）。
集約テーブルに `commitment` 列（8 リム）と `is_commit` 列を足し:

| 制約 | 意味 |
|------|------|
| `is_commit` が bool、先頭行で 1、遷移で次行 0 | 束縛はちょうど 1 行 |
| 先頭行で `commitment[j] == public_values[PV_COMMITMENT + j]` | 公開入力との一致 |
| `MERKLE_DAG` から multiplicity `is_commit` で Receive | その値を Registry 連鎖が実際に生成したこと |

これで **FR-THRESH-1(b) の連鎖が公開境界まで閉じた**:

```
公開鍵 (PK.seed ‖ PK.root)
   │ sha3 ── PUBKEY_BIND ──→ 集約テーブルの pk_root を束縛 ✅
   ↓
pubkey_hash ── MERKLE_DAG ──→ リーフが消費 ✅
   ↓
leaf ── MERKLE_DAG ──→ ノード連鎖 ✅
   ↓
root ── MERKLE_DAG ──→ commitment が消費 ✅
   ↓
commitment ── MERKLE_DAG + public input ──→ L1 が渡す値と一致 ✅
```

### 18.2 テーブルをまたぐ消費

`build_full_tables` に `external_node_receives` を追加し、
**別テーブルで生成された 32B 値を消費できる**ようにした。相互作用はグローバル
なので、Registry テーブルのリーフが署名テーブルで計算された公開鍵ハッシュを
消費する構成が成立する。

これにより §15 の「署名ごとのテーブル分割」が実運用の形になった:

```
[署名 A の Keccak テーブル]  pubkey_hash_A を生成 ─┐
[署名 B の Keccak テーブル]  pubkey_hash_B を生成 ─┤
                                                    ↓
[Registry テーブル]  leaf_A, leaf_B, node, commitment
                                                    ↓
[集約テーブル]  2 スロットの判定 + commitment を公開入力に束縛
```

テスト `two_signatures_share_a_registry_across_tables`（10 テーブルのバッチ）で
実証。**共有 Registry を持つ 2 署名が、それぞれ独立した Keccak テーブルで
証明できる**ことが確認できた。

### 18.3 テスト

`sphincs-m3` 計 32 件全パス（警告 0）。新規・改訂:

- `aggregation_verdict_binds_the_whole_chain`: 署名 root・登録公開鍵・
  active 集合コミットメントを 1 バッチで束縛
- `rejects_a_commitment_the_chain_did_not_produce`: 回路が構築したのと違う
  active 集合を公開入力として主張すると拒否される
- `two_signatures_share_a_registry_across_tables`: 上記のテーブルをまたぐ構成

---

## 19. wrap 方式の再評価: 測定が示した想定外の結論 (2026-08-07)

§16.2 で「自前実装の前に既製の STARK-verifier 回路（SP1 / RISC Zero）を評価する」
としていた技術判断を、推測ではなく**実測**で行った。結果、当初の前提を覆す
結論が出た。

### 19.1 前提の確認（コード実態調査）

| 事実 | 含意 |
|------|------|
| pinned Plonky3 に**再帰クレートは存在しない** | フレームワーク内での再帰圧縮は選択肢にならない |
| `p3-uni-stark` は `#![no_std]` | **Plonky3 の verifier を zkVM ゲストとして実行できる**。SNARK DSL に verifier を書き起こさずに済む可能性 |
| Plonky3 に `bn254` クレートが同梱 | SNARK フレンドリーな体は利用可能 |

2 番目が重要で、これが成り立つなら wrap は
「**zkVM 内で Plonky3 verifier を走らせ、zkVM 標準の Groth16 wrapper を使う**」
で済み、M1〜M3 の AIR 資産をそのまま活かせる。工数は数週間から数日規模に落ちる。

### 19.2 決定的な比較

しかし zkVM 経由で wrap するなら、比較すべきは次の 2 つである:

- (a) **我々の STARK proof を zkVM 内で検証する**コスト
- (b) **SPHINCS+ 検証を zkVM 内で直接やる**コスト

両者は同じ通貨（Keccak 中心の計算量）で測れる。実測:

| | 計算量 | ネイティブ実測 |
|---|---:|---:|
| (b) SLH-DSA-SHAKE-128s 検証 1 本 | **2,174 置換** | **621 µs**（`sphincs-m2` の `verify_cost`） |
| (a) 我々の束縛 STARK proof 検証 1 署名分 | — | **141.5 ms**（§11.4 実測） |
| **比** | | **228 倍** |

置換あたり 0.286 µs から逆算すると、(a) は置換換算で **~495,000 相当**。
両者とも Keccak MMCS 由来の Keccak が支配的なので、この比はそのまま
zkVM のサイクル比に概ね転写される。

**しかも zkVM ではこの差はさらに開く見込み**である。(a) には Goldilocks 体の
算術（OOD 点での制約評価・FRI 折り畳み）が含まれ、32bit RISC-V 上の 64bit 体
演算は相対的に高い。(b) は Keccak precompile を持つ zkVM ならさらに安くなる。

### 19.3 損益分岐

STARK 検証コストは署名本数にほぼ依存しない（succinct）ので、本数 N が増えれば
いずれ (a) が勝つ。分岐点は概算で:

```
495,000 / 2,174 ≈ 228 本
```

**Quantum Shield の閾値は 2-of-N であり、必要な検証は 2 本**（+ Registry membership）。
分岐点の 2 桁手前にいる。つまり **本用途では自前 STARK 層を挟むほうが一貫して高くつく**。

### 19.4 結論と方式の修正

| 方式 | 評価 |
|------|------|
| **B'. zkVM で SPHINCS+ 検証を直接実行** → zkVM の Groth16 wrapper → EVM verifier | **推奨**。M4/M5 への最短経路。EVM 側は §13 で実測済み（~254K gas、NFR-2 の 25%）。zkVM の wrap・EVM verifier・監査が既製 |
| A. 自前 STARK + 手書き verifier 回路（SNARK DSL） | M1〜M3 を活かせる唯一の道だが数週間規模。§19.3 より、2-of-N では計算量でも不利 |
| A'. 自前 STARK + zkVM 内で Plonky3 verifier を実行 | 工数は小さいが §19.2 より B' の 228 倍のコスト。**採る理由が無い** |

**M1〜M3 の資産の位置づけ**: 破棄しない。(1) SPHINCS+ 検証の正確な仕様と
witness 生成器（独立実装クロス検証済み）は zkVM ゲストにそのまま流用できる、
(2) 署名本数が 2 桁に増える将来（Phase 3 の permissionless 化で N が増えた場合）に
分岐点を超える、(3) ベンダ非依存・古典仮定を検証層に持ち込まない長期の選択肢として
価値がある。特に (1) は実務上大きく、`sphincs-m2` の `slh_verify` は
`no_std` 化すればそのまま zkVM ゲストになる。

### 19.5 留保

- zkVM のサイクル数はネイティブ実時間と厳密には比例しない。**B' に進む前に
  SP1 または RISC Zero で実際にゲストを走らせ、サイクル数と proof 生成時間を
  実測すべき**。これが次のアクション
- Groth16 wrap は検証層に楕円曲線（古典）仮定を持ち込む。これは §8.3 で
  「FR-THRESH-4 のフル SPHINCS+ 直接検証経路が常時担保するため受容」と
  整理済みで、方式 A / B' のどちらでも同じ

---

## 20. zkVM ゲスト化の前提を満たした (2026-08-07)

§19.4 で推奨方式となった「zkVM で SPHINCS+ 検証を直接実行」に向け、
**検証コアが zkVM ゲストとしてビルドできる**ことを実証した。

### 20.1 実施内容

`sphincs-m2` の検証コア（`params` / `adrs` / `keccak` / `hash` / `verify`）を
`no_std` + `alloc` にし、witness DAG 抽出（`dag`、`HashMap` 依存）を
デフォルト有効の `std` feature の裏に隔離した。ゲストに必要なのは判定であって
witness ではないため、この分割は自然。

### 20.2 判明したブロッカーと対処

`riscv32im-unknown-none-elf`（zkVM が実際に使うターゲット。`im` = 整数 + 乗算で
**原子命令なし**）でのビルドを試みて、2 つのブロッカーが順に出た:

| ブロッカー | 原因 | 対処 |
|---|---|---|
| `crossbeam-utils` が `std` を要求 | `p3-maybe-rayon` の `parallel` feature 経由で rayon が入る | ライブラリが実際に使う依存を調査したところ `p3-keccak` と `p3-symmetric` のみと判明。他は examples 専用なので dev-dependencies へ移した |
| `tracing-core` が原子 CAS を要求 | **`p3-field` が `tracing` を無条件に依存**しており、Plonky3 の全クレートが `p3-field` を引く | Keccak-f[1600] を自前実装し（`src/keccak.rs`）、Plonky3 依存を検証コアから完全に除去 |

2 つ目は Plonky3 側の構造的な制約であり、**Plonky3 のクレートは原子命令なしの
RISC-V ターゲットではビルドできない**。これは方式 A'（zkVM 内で Plonky3 verifier を
実行）を採る場合の実務的な障害でもあり、§19.4 の判断を補強する。

### 20.3 結果: 検証コアは依存ゼロ

```toml
[dependencies]
# None. The verification core is alloc-only on purpose.
```

`cargo build --lib --no-default-features --target riscv32im-unknown-none-elf` が
**成功**。SLH-DSA-SHAKE-128s のフル検証がベアメタル RISC-V で動く形になった。

自前 Keccak-f が AIR の証明する置換と**ビット単位で一致する**ことは
テストで固定している（`matches_plonky3_keccak` / `..._on_zero_state`）。
これがないとゲストと回路が静かに乖離しうる。
既存の FIPS 202 KAT（空文字列 / "abc" / 複数ブロック）もそのまま通っている。

テスト: `sphincs-m2` 22 件（+2）、`sphincs-m3` 32 件、いずれも全パス。

### 20.4 残り

- **SP1 / RISC Zero でのサイクル実測**（§19.5 の次アクション）。ゲスト側の
  前提は本節で満たしたので、あとは zkVM SDK を入れてゲストを走らせるだけ。
  ただし各 SDK はツールチェーン込みで数 GB を要し、本作業環境は空き容量が
  逼迫している（Docker.raw が 41GB を占有）ため、実行前に容量確保が必要
- proof 生成時間と wrap 後の EVM 検証ガス（後者は §13 で ~254K gas と実測済み）

---

## 21. SP1 サイクル実測 (2026-08-08)

§19.5 の次アクションとしていた zkVM サイクル実測を完了した。
`src/crypto/zkvm/` の guest + cycles。

### 21.1 実測値

SP1 v6.3.1、`riscv64im-succinct-zkvm-elf`、ゲストは埋め込みベクタ 1 本を
`slh_verify` で検証（判定を commit）。executor による実行のみ（証明は不要）。

| | 値 |
|---|---:|
| **サイクル数** | **42,735,096** |
| syscall 数 | **0** |
| Keccak-f 置換数 | 2,174 |
| 置換あたりサイクル | 19,657 |

上位オペコード: `ADDI` 7.6M / `LD` 5.7M / `XOR` 5.4M / `SD` 5.2M / `SLL` 3.4M /
`ADD` 2.1M / `OR` 2.0M / `SRL` 2.0M。

### 21.2 所見: precompile を使っていない

**syscall 数 0** が示す通り、この 42.7M サイクルは **Keccak-f を純粋な RISC-V
命令で回した数字**である。オペコード内訳もそれを裏づけている:
`XOR`/`SLL`/`SRL`/`OR` が上位を占めるのは Keccak の theta/rho/chi そのもので、
`LD`/`SD` の多さは 64bit レーン 25 本を 32bit 幅で出し入れしているコスト。

置換あたり 19,657 サイクルは、Keccak-f[1600] の演算量（24 ラウンド × 約 200 の
64bit 演算）に対して素直な値であり、**SP1 の Keccak precompile を使えば
1〜2 桁下がる余地がある**。今回の実装は `sphincs-m2` の自前 `keccak_f`
（§20 で Plonky3 依存を外すために書いたもの）をそのまま使っており、
precompile へのディスパッチを入れていない。

したがって **42.7M は上限値**として扱うべきである。

### 21.3 意味づけ

- **2-of-N 閾値**なら 2 署名 + Registry membership で ~90M サイクル（precompile 無し）。
  SP1 の実測スループットは環境依存だが 10^6〜10^7 サイクル/秒 のオーダーであり、
  proof 生成は**分オーダー**に収まる見込み。NFR-3（≤1h p99）に対しては
  依然として大きな余裕がある
- §19 の結論は補強される。仮に自前 STARK を zkVM 内で検証していたら、
  §19.2 の 228 倍という比がそのままサイクルに効く
- **次の最適化は precompile 化**。`sphincs-m2` の `keccak_f` を、zkVM ゲスト
  ビルド時には SP1 の Keccak precompile に差し替える feature を足すのが素直。
  §20 で導入した「依存ゼロの自前 Keccak」が、逆にこの差し替え点を明確にしている

### 21.4 再現手順

```bash
# ツールチェーン (操作者が導入): curl -L https://sp1up.succinct.xyz | bash && sp1up
# protoc も必要: brew install protobuf
cd src/crypto/zkvm/guest && cargo prove build
cd ../cycles && cargo run --release
```

---

## 22. Keccak precompile 化 (2026-08-08)

§21.2 で「次の最適化」としていた precompile 化を実施した。

### 22.1 実装

`sphincs-m2` に `sp1-precompile` feature を追加し、`keccak_f` を
SP1 の `syscall_keccak_permute` にディスパッチする。デフォルトは
§20 の依存ゼロ実装のままで、ゲストビルド時のみ切り替わる。

```toml
sp1-lib = { version = "6.3.1", optional = true }
sp1-precompile = ["dep:sp1-lib"]
```

§20 で Plonky3 依存を外すために自前 Keccak を書いたことが、結果として
この差し替え点を 1 箇所に集約していた。

### 22.2 実測

| | precompile なし (§21) | **precompile あり** | 比 |
|---|---:|---:|---:|
| サイクル数 | 42,735,096 | **8,888,390** | **4.8x 削減** |
| syscall 数 | 0 | **2,174** | — |
| 置換あたりサイクル | 19,657 | **4,088** | 4.8x |

**syscall 数が Keccak-f 置換数 2,174 と完全に一致**しており、全置換が
precompile に乗っていることが確認できる。

### 22.3 正当性の担保

ゲストは `assert!(outcome.valid)` で終わる。precompile の意味論が我々の
software Keccak-f と少しでも違えば署名検証が失敗し、ゲストは panic して
executor がエラーを返す。**実行が完走した事実そのものが、precompile 経路の
end-to-end 検証**になっている。

加えてホスト側では precompile 無効時の実装が `p3_keccak::KeccakF`
（AIR が証明する置換）とビット一致することをテストで固定済み（§20.3）。

### 22.4 現時点の proof 生成サイジング

| 構成 | サイクル数 |
|---|---:|
| 1 署名 | 8.9M |
| **2-of-N 閾値（2 署名 + Registry membership）** | **~18M** |

残るサイクルの内訳は、スポンジのグルー処理（パディング、メッセージブロックの
XOR、バイト ↔ u64 変換）と SPHINCS+ のロジック。さらに削るなら
スポンジ層を u64 のまま扱うなどの余地があるが、NFR-3 に対しては既に
十分な余裕がある。

---

## 23. M4: L1Vault の proof-based 検証経路 (2026-08-08)

zkVM 経路（§19）に合わせてオンチェーン統合を設計・実装した。

### 23.1 責務の分割

| どこで | 何を |
|--------|------|
| zkVM ゲスト | 各署名の FIPS 205 検証、署名者の Registry active 集合メンバーシップ、有効数の集計 |
| SP1 の Groth16 wrapper | 上記の proof を EVM 検証可能な形に畳む |
| `ThresholdProofVerifier`（新規） | ゲストが commit した値を**この unlock に束縛**し、proof を検証して `validCount` を返す |
| `L1Vault` | 閾値の適用（`REQUIRED_SIGNATURES`） |

閾値を Vault 側に残したのは、**proof システムが閾値を知らなくて済む**ようにするため。
回路や verifying key を変えずに閾値を変更できる。

### 23.2 public values のレイアウト

ゲストとコントラクトの契約。パック済み固定長 100 バイト:

```
[ 0..32)  lockId          この unlock 対象
[32..64)  stateRoot       署名が覆う state root
[64..96)  setCommitment   ProverRegistry の active 集合コミットメント (FR-THRESH-5)
[96..100) validCount      有効だった相異なる active prover 数
```

可変長にしないのは、証明者が末尾にパディングを足せる余地を残さないため。

Rust 側（`sphincs-m2::public_values`）と Solidity 側は**同一の golden vector**で
固定してあり（`golden_vector_hex` ↔ `testDecodesTheGoldenVector`）、
片側だけ変えると必ずどちらかのテストが落ちる。

あわせて `unlock_message()`（`SHA3-256(lockId ‖ stateRoot)`）を Rust 側に用意した。
`L1Vault._verifyThresholdSignatures` と同じ導出でなければ、ゲストは Vault が
求めていないメッセージに対する署名を検証してしまう。

### 23.3 オンチェーンの束縛

`verifyThreshold` は proof 検証の**前に**次を確認する（安い順に落とす）:

| 束縛 | 防ぐもの |
|------|---------|
| `lockId` 一致 | 同じ state root を共有する別 lock への proof 再利用 |
| `stateRoot` 一致 | 別の状態に対する proof の流用 |
| `isKnownActiveSetCommitment(setCommitment)` | **証明者が自分で作った署名者集合**でのメンバーシップ証明。FR-THRESH-5 の履歴があるので、過去エポックの集合も受理される（署名収集後に prover が増減しても資産が取り出せなくなることはない） |

3 番目が FR-THRESH-1(b) のオンチェーン側の要である。これが無いと閾値は意味を持たない。

### 23.4 `L1Vault` 側

`requestUnlockWithProof` を追加した。`requestUnlockLegacy` と対になる経路で、
**FR-THRESH-6 の「提出者が方式を選べる。無検証経路は存在しない」**を満たす。

`thresholdProofVerifier` が未設定なら proof 経路は使えないだけで、
フル直接検証経路（FR-THRESH-4）は影響を受けない。**proof 生成系が全停止しても
資産は取り出せる**という保証は維持される。

### 23.5 テストとガス

`ThresholdProofVerifier.t.sol` 11 件全パス。内訳は encoding（golden vector 含む）、
正常系、および**束縛ごとの否定系**（別 lock / 別 state root / 未公表の集合
コミットメント / 不正 proof / 長さ不正）。

| | gas |
|---|---:|
| 束縛レイヤ単体 | **20,966** |
| Groth16 検証（§13、public input 8 個） | ~254,000 |
| **合計（proof 検証部）** | **~275,000** |

NFR-2 の 1M 予算に対し **~27%**。残りは SMT 検証と unlock request 作成に使える。

### 23.6 残り

- **ゲスト側の拡張**: 現在のゲストは 1 署名を検証するだけで、複数署名・Registry
  メンバーシップ・public values の commit をまだ行っていない。§23.2 の
  エンコーダは用意済みなので、残るのはゲスト内のロジック
- **実 proof での E2E**（M5）: SP1 の verifying key を確定し、実 proof で
  `requestUnlockWithProof` が成功する tx と、不正 proof が revert する tx を
  テストネットで記録する（受け入れ基準 3）
- 新 Vault のデプロイ: `requestUnlockWithProof` は immutable な現行 Vault には
  含まれないため、R-1 と同じ移行手順が要る

---

## 24. ゲスト側の拡張: FR-THRESH-1 の完全なステートメント (2026-08-08)

§23.6 の残作業だったゲスト拡張を実施し、**proof が attest する内容が
FR-THRESH-1 の (a)(b)(c) を満たす形になった**。

### 24.1 ステートメント

`(lockId, stateRoot, setCommitment)` に対し、提出された各署名について:

| 手順 | 対応する要件 |
|------|-------------|
| 署名者が `setCommitment` の覆う Registry 集合のメンバーである（Merkle inclusion） | FR-THRESH-1(b) |
| SPHINCS+ 署名が `SHA3-256(lockId ‖ stateRoot)` に対して検証される | FR-THRESH-1(a) |
| 通った数を集計し `validCount` として commit | FR-THRESH-1(c) |

**重複排除**は「署名者アドレスが厳密増加であること」で行う。同一署名者は
厳密増加列に 2 回現れられないので、ソートネットワークも集合論法も要らない。
順序が崩れた入力は 0 件として数えるのではなく**入力ごと拒否**する。

閾値は意図的に含めない。`L1Vault` が commit された `validCount` に適用するため、
**閾値の変更に回路の作り直しは不要**（§23.1）。

### 24.2 実装場所

ロジックは `sphincs_m2::threshold` に置いた（`no_std`）。ゲストクレートに
書かないのは、**ホストでテストできるようにする**ため — 失敗が executor の
トレースに埋もれた panic ではなくテスト結果として出る。

Registry コミットメントの計算も `sphincs_m2::registry` へ移した（旧 `sphincs-m3`）。
これは回路のロジックではなくプロトコルのロジックであり、依存ゼロの `no_std`
でなければゲストに入らない。

### 24.3 判明した整合性要件

ホストテストで**署名バリアントの不一致**が出た。オラクル（RustCrypto）の
`Signer::sign` は FIPS 205 の pure variant（`0x00 ‖ ctx_len ‖ ctx` を前置）で
署名するが、当初 `slh_verify_internal`（前置なし）で検証していたため 0 件になった。

`slh_verify(msg, sig, b"", pk)` に修正した。これは
**オンチェーンの `SPHINCSVerifier` も同じバリアントでなければならない**ことを意味する。
異なると、proof 経路を通る署名がフォールバック経路（FR-THRESH-4）で落ちる、
あるいはその逆が起きる。M5 で実機確認すべき項目。

### 24.4 テスト（ホスト側 10 件）

`sphincs-m2/tests/threshold.rs`。署名は独立実装が生成したもの、Registry
コミットメントは `ProverRegistry.sol` と同じ構成:

| テスト | 何を守るか |
|--------|-----------|
| 2 名の登録済み署名者が count 2 | 正常系 |
| 別 unlock への署名は数えない | proof の lock 間再利用 |
| 未登録者の有効な署名は数えない | FR-THRESH-1(b) |
| 誤った Merkle 位置は数えない | 位置詐称 |
| 改竄署名は数えない | — |
| 同一署名者の重複は入力ごと拒否 | 二重カウント |
| 順序違反は入力ごと拒否 | 同上 |
| 未公表の集合コミットメントは 0 件 | 自作集合でのメンバーシップ |
| wire format の往復 | ゲスト入力の欠損 |
| 切り詰め入力は decode 失敗 | 小さい主張の黙認 |

### 24.5 実測（2-of-4、SP1 executor）

| | 値 |
|---|---:|
| **サイクル数** | **18,229,825** |
| Keccak-f syscall 数 | 4,457 |
| 署名あたりサイクル | 9,114,912 |
| commit された public values | **100 バイト** |

commit されたバイト列をホスト側で decode し、`ThresholdProofVerifier` が読む
レイアウトと一致すること・`validCount = 2` を運んでいることを実行時に検証している。
**ゲスト → public values → コントラクトのレイアウトが実測で繋がった**。

§22 の 1 署名 8.9M からの増分は、2 署名ぶんの検証（17.8M）に Registry
メンバーシップの Merkle 検証（syscall 4,457 − 2×2,174 = 109 置換）が乗ったもの。
NFR-3（≤1h p99）に対しては依然として大きな余裕がある。

---

## 25. FR-THRESH-4 のフォールバック保証は成立していない (2026-08-09)

§24.3 で挙げた「ゲストとオンチェーン `SPHINCSVerifier` の署名バリアント整合性」を
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
| §24.3 の「両経路の整合性」 | オンチェーン側が走らないため現状は空論。検証器を作り直す場合に再浮上する |

フォールバックの選択肢は概ね 3 つ:
1. **署名検証も zkVM proof で行う別経路**（鍵や閾値の前提を変えた縮退運用）
2. **`SPHINCSVerifier` を EVM 実行可能に作り直す** — ⚠️ 当初「precompile なしでは
   現実的でない」と書いたが**これは誤りだった**。§26.1 参照（外部に 94K〜142K ガスの
   実測例がある。代償は FIPS 205 適合性）
3. **フォールバックをオンチェーン検証に求めない**（Security Council による
   時間ロック付き救済など、信頼前提を明示した設計）

これは実装作業ではなく**要件レベルの判断**であり、
`ONCHAIN_TRUST_MECHANISM_REQUIREMENTS.md` の FR-THRESH-4 の見直しが要る。

---

## 26. FR-THRESH-4 再設計の選択肢 — Pros/Cons と外部環境 (2026-08-12)

§25 で「フォールバック経路は実行不能」と確定した。その再設計を、外部エコシステムの
現況を調べたうえで整理する。

### 26.1 §25.4 の見込みの訂正

§25.4 で私はこう書いた:

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
| Succinct の verifier gateway | **L1 上の他者のコントラクト** | **unlock が通らない** | **自前デプロイ可能**（Groth16 verifier は単なるコントラクト。§13 で実測済み） |
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

## 27. Groth16 wrap は中核原則に反する — 分岐の確定 (2026-08-14)

### 27.1 受容の根拠が消えていた

§8.3 で Groth16 wrap の古典仮定を受容した際の条件は、原文でこうだった:

> wrap 層の古典仮定は「資産保全は **FR-THRESH-4 のフル SPHINCS+ 直接検証経路が
> 常時担保する**」ことで受容する（wrap が破られても署名偽造にはならず、
> フォールバック経路の安全性は不変）

**§25 でその条件が偽であることを実測で確定した**（673.8M ガス、実行不能）。
条件が消えた以上、受容は無効である。にもかかわらず §19〜§24 では結論だけを
持ち越し、§26 では「A（proof 経路）を主経路に」とまで書いた。**これは誤りだった。**

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
予算の 28%**（§26.1、外部実測値）。**3.5 倍の余裕**がある。

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

### 27.6 §26.4 の推奨の撤回

§26.4 で「**B + A の併用**（A を主経路）」を推奨したが、**A を主経路に置く部分は撤回する**。
A は検証層に古典仮定を持ち込み、それを補うはずだった FR-THRESH-4 は動かない。
正しくは **B（= 経路 1）が主経路**であり、A は「量子攻撃者が現れるまでの間の
ガス最適化」以上の位置づけを持てない。

§26.3 で整理した外部依存（SP1 Prover Network / Succinct の verifier gateway）の
議論も、この訂正により優先度が下がる。**経路 1 には外部への実行時依存が無い。**

---

## 28. 経路 1 の実測 — 暗号を曲げる必要はなかった (2026-08-14)

§27.5 で主経路と決めた「オンチェーン直接 PQ 検証」のコストを、パラメータ集合ごとに
実測した。§26.1 では「FIPS 205 適合を手放すのが代償」と整理していたが、
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
外部の SPHINCS− C13 の実測が **127K**（§26.1）。**差は 15%** であり、
「よく最適化された実装は固有ハッシュコストの ~1.15 倍に着地する」ことを示す。
本節の数値が実装可能な範囲の下限として妥当であることの傍証になる。

### 28.4 NFR-2 は物理制約ではない

厳密適合の 1,252K が「超過」なのは**自分で決めた 100 万ガス目標に対して**であり、
**Ethereum のブロックガス上限は 30M** である。1.25M はブロックの **4%** にすぎない。

署名の calldata を加えた現実的な総額（署名 7,856 B × 2 × 16 gas = 251K、
実装オーバーヘッドを §28.3 の 1.15 倍として）:

```
ハッシュ    1,252,000 × 1.15 ≈ 1,440,000
calldata                        251,000
                              ──────────
                            約 1,691,000 gas  = ブロックの 5.6%
```

**厳密な FIPS 205 適合のまま、オンチェーンで実行できる。**

### 28.5 §26.1 の整理の訂正

§26.1 で「選択の軸は『ガスで可能か』ではなく**どの標準適合性を手放すか**」と
書いたが、これは**外部実装（SPHINCS−）が採った選択を、こちらの制約と取り違えていた**。
SPHINCS− がハッシュ置換と予算削減を採ったのは、**ウォレット用途で 1 署名あたり
$0.07 を狙う**という彼らの目標があってのこと。

Quantum Shield は 2-of-N の資産解放という**低頻度・高価値**の操作であり、
1 回あたり 170 万ガスを許容できるなら**何も手放す必要がない**。

### 28.6 決定事項への影響

§26.1 で未解決としていた 2 つの方針決定は、**どちらも回避できる**:

| 論点 | §26.1 時点 | 本節の結論 |
|------|-----------|-----------|
| CP-1 との整合（署名予算 2^14〜2^20 の受容） | 要判断 | **不要**。2^64 のまま |
| 独立監査のない非標準暗号を最終防衛線に置くか | 要リスク受容 | **不要**。標準の FIPS 205 パラメータ集合を実装すればよい |

代わりに必要なのは **NFR-2 の見直し**（1M → 2M 程度）という、
暗号のリスクを伴わない要件調整のみである。

**推奨: 厳密な FIPS 205 SLH-DSA-SHA2-128s のオンチェーン検証器を実装し、
NFR-2 を実測に合わせて再設定する。**

なお §25.3 の通り、現行 `SPHINCSVerifier.sol` は ADRS を 1 バイトの定数で
代用しており FIPS 205 ではない。**作り直しであって最適化ではない。**

---

## 29. FIPS 205 検証器の実装 — 第 1 段 (2026-08-21)

§28 の結論（厳密適合のままオンチェーン検証が可能）に沿って、`SPHINCSVerifier.sol`
の**作り直し**を開始した。まずハッシュ構成とアドレス符号化まで。

### 29.1 参照実装を先に置いた

`src/crypto/slh-dsa-sha2`（Rust）を先に書き、独立実装（RustCrypto
`slh_dsa::Sha2_128s`）に対してクロス検証した。**一発で受理された**ので、
ADRS 圧縮・パディング・MGF1 による `H_msg` の解釈は正しい。

これを先にやったのは §25 の教訓による。`SPHINCSVerifier.sol` が長く誤ったまま
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

§28.2 の見積り（1,252,224 gas / 2-of-N）に対し実測 2,469,664 は**約 2 倍**。
差は §28 が 64 バイト入力の 288 gas を使っていたのに対し、実際の `F` は
102 バイト（SHA-256 の 2 圧縮ブロック）を食うため。**見積りが楽観的だった**。

それでも **2-of-N はブロックの 8.2%** に収まり、§28.4 の結論
（厳密な FIPS 205 適合のままオンチェーンで実行できる）は変わらない。

### 29.4 残り

ハッシュ層は固定できた。上位（`base_2b` / WOTS+ チェーン / FORS / XMSS /
ハイパートリー / `slh_verify`）はこれから。参照実装が既にあるので、
各段を同じやり方で差分テストしながら積む。

---

## 30. FIPS 205 検証器が動いた (2026-08-21)

§29 のハッシュ層に続いて上位層（`base_2b` / WOTS+ / FORS / XMSS / ハイパートリー /
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

**§29.3 の見積り（2-of-N で 2,469,664）に対し実測は約 2.2 倍。**
差はハッシュ層の外側 —— `base_2b`、ADRS の付け替え、`bytes` のスライスと
メモリ確保、ループ制御 —— が積み上がったもの。ハッシュ 4,348 回だけなら 2.5M だが、
その周辺で同じだけ食っている。

見積りが 2 段階（§28 → §29 → §30）で連続して楽観的だったことは記録しておく。
いずれも「支配的なコストだけ数えて周辺を無視する」という同じ誤り方をしている。

### 30.3 中核原則との関係

**この経路には楕円曲線仮定が一切無い。** §27 で確定した通り、Groth16 wrap 経路は
量子攻撃者に対して防御力を持たない（BN254 を破れば SPHINCS+ 署名を 1 つも用意せず
に保管庫が開く）。本検証器は SHA-256 のみに依存し、**プロトコルの中核主張を
実際に満たす唯一の実装**である。

NFR-2 の 100 万ガス目標は満たさない（5.4 倍）。ただし §28.4 の通りこれは自ら
設定した値であり、ブロックガス上限 30M に対して 18% で収まる。
**NFR-2 を実測に合わせて再設定する**という §28 の結論は変わらない。

### 30.4 残り

- ガス最適化（周辺コストが支配的と判明したので、そこが対象）
- `L1Vault` への接続（`ISPHINCSVerifier` 互換の口を用意し、閾値検証から呼ぶ）
- 監査。**新規に書いた暗号実装であり、参照との一致は必要条件であって十分条件ではない**

---

## 31. `L1Vault` への接続 (2026-08-21)

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

`SLHDSAVerifier.t.sol` 12 件全パス。層ごとの一致（§30.1）に加えて、
`ISPHINCSVerifier` 越しの呼び出し、`verifyWithDetails` のガス報告と
エラー理由、公開鍵フォーマット判定を固定した。

### 31.4 残り

- **ガス最適化**。§30.2 の通り、支配的なのはハッシュではなく**その周辺**
  （`base_2b`、ADRS の付け替え、`bytes` のスライスとメモリ確保、ループ制御）。
  2-of-N で 5.4M = ブロックの 18% は動くが、削る余地は大きい
- **NFR-2 の再設定**（§28.4）。1M → 6M 程度が実測に即した値
- **監査**。参照実装との一致は必要条件であって十分条件ではない
- 旧 `SPHINCSVerifier.sol` の扱い（削除するか、非適合である旨を明記して残すか）

---

## 32. ガス最適化 — どこで止めるか (2026-08-21)

### 32.1 推測をやめて内訳を測った

§30.2 で「支配的なのはハッシュの周辺」と書いたが、**「周辺」は最適化の対象名では
ない**。まず桁分解の配列確保を消したところ 2,705,090 → 2,587,495（**4.3%**）に
しかならず、想定が外れた。そこで内訳を測った:

| 段 | gas | ハッシュ 1 回あたり |
|---|---:|---:|
| `H_msg` | 10,598 | — |
| FORS（182 回） | 281,595 | **1,547** |
| ハイパートリー（約 1,990 回） | 1,738,833 | 873 |

限界コストの実測値は 568（§29.3）。**FORS だけが 2.7 倍という外れ値**で、
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

§28 → §29 → §30 と 3 度連続で見積りを外し、いずれも
**「支配的なコストだけ数えて周辺を無視する」**同じ誤り方をした。今回さらに
「周辺 = 配列確保だろう」という推測も外した。

内訳を測ってから初めて外れ値（FORS の 1,547）が見え、原因（calldata の複製）に
到達した。**推測で最適化しない**というのが本節の教訓である。
