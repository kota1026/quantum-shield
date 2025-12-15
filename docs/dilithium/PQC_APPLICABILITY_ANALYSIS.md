# PQC アルゴリズムへの応用可能性分析

## Post-Quantum Cryptography STARK Applicability Analysis

**プロジェクト**: `zk-dilithium-ntt`
**分析日**: 2025年12月14日
**フェーズ**: III - 他の PQC アルゴリズムへの応用可能性分析

---

## エグゼクティブサマリー

本分析は、Dilithium STARK 回路設計で得られた知見が、他の NIST 標準化された量子耐性暗号（PQC）にどのように再利用できるかを評価します。

### 再利用性サマリー

| PQC アルゴリズム | 種類 | 再利用性 | 主な再利用可能コンポーネント |
|-----------------|------|----------|------------------------------|
| **Kyber** | 格子ベース KEM | **70%** | NTT Gate, FMA Gate, PRC |
| **SPHINCS+** | ハッシュベース署名 | **30%** | Keccak χ Gate |
| **Falcon** | 格子ベース署名 | **60%** | NTT Gate, FMA Gate (要調整) |

---

## 1. Kyber（格子ベース KEM）への応用分析

### 1.1 概要

Kyber は、格子ベースの鍵カプセル化メカニズム（KEM）であり、そのセキュリティは主に **Module-LWE 問題** に基づいています。Kyber のコア演算は Dilithium と多くの部分で共通しています。

### 1.2 アルゴリズム比較

| パラメータ | Dilithium | Kyber |
|-----------|-----------|-------|
| モジュラス Q | 8,380,417 (≈ 2²³) | 3,329 |
| 多項式次数 N | 256 | 256 |
| NTT 使用 | Yes | Yes |
| Montgomery 乗算 | Yes | Yes |
| ハッシュ関数 | SHAKE256 | SHAKE128/256 |

### 1.3 再利用可能なコンポーネント

#### NTT Butterfly Gate (課題 11)

```
再利用性: 高
理由: Kyber も同じくモジュラ多項式環 Z_Q[X]/(X^N + 1) を使用
必要な調整: Q 定数と twiddle factor の変更のみ
```

**Dilithium 制約**:
```
A' = A + ω·B (mod Q)
B' = A - ω·B (mod Q)
```

**Kyber への適用**:
```rust
// 定数変更のみで適用可能
pub const Q_KYBER: u64 = 3329;
pub const ZETA_KYBER: u64 = 17;  // Primitive root mod Q_KYBER
```

#### Montgomery FMA Gate (課題 13)

```
再利用性: 高
理由: Kyber も多項式乗算に Montgomery リダクションを使用
必要な調整: Q, R, R^(-1) mod Q の再計算
```

**Montgomery パラメータ (Kyber)**:
```
Q = 3329
R = 2^16 (十分な大きさ)
R^(-1) mod Q = 計算必要
-Q^(-1) mod R = 計算必要
```

#### PRC (Permutation Range Check) (課題 15)

```
再利用性: 高
理由: 係数範囲チェックのロジックは汎用的
必要な調整: 参照テーブル T_16 を T_Q に変更
```

**Kyber 向け調整**:
- Kyber の係数は [-1664, 1664] の範囲（署名前）
- 圧縮後は [0, Q-1] の範囲
- PRC テーブルサイズ: log₂(3329) ≈ 12 ビット

### 1.4 新規設計が必要なコンポーネント

#### CBD サンプリング Gate

Kyber は **中心二項分布 (Centered Binomial Distribution)** を使用して秘密鍵とエラー多項式を生成します。

```
CBD_η(seed) → coefficient ∈ [-η, η]

制約設計:
1. Keccak 出力から 2η ビットを取得
2. 前半 η ビットの合計 - 後半 η ビットの合計 = coefficient
3. |coefficient| ≤ η を検証
```

**提案する AIR 制約**:
```rust
// CBD Gate 制約
// bits_a[0..η] と bits_b[0..η] はバイナリ
// sum_a = Σ bits_a[i]
// sum_b = Σ bits_b[i]
// coeff = sum_a - sum_b
result[CBD_CONSTRAINT] = (sum_a - sum_b) - coeff;
```

#### モジュラス調整

```rust
// constants_kyber.rs
pub const Q_KYBER: u64 = 3329;
pub const R_KYBER: u64 = 1u64 << 16;  // 2^16
pub const R_INV_KYBER: u64 = ...;     // R^(-1) mod Q
pub const NEG_Q_INV_KYBER: u64 = ...; // -Q^(-1) mod R
```

### 1.5 Kyber STARK 推定工数

| コンポーネント | 工数 | 備考 |
|---------------|------|------|
| 定数調整 | 0.5日 | Q, R, twiddle factors |
| NTT Gate 適用 | 1日 | テスト含む |
| FMA Gate 適用 | 1日 | テスト含む |
| PRC 適用 | 1日 | テーブルサイズ調整 |
| CBD Gate 新規設計 | 3日 | 設計 + 実装 + テスト |
| 統合テスト | 2日 | E2E 検証 |
| **合計** | **8.5日** | |

---

## 2. SPHINCS+ (ハッシュベース署名) への応用分析

### 2.1 概要

SPHINCS+ は、格子ベースとは異なり、**Merkle ツリー** と **ワンタイム署名スキーム（WOTS+, FORS）** を基盤とするハッシュベースのステートレス署名です。

### 2.2 アルゴリズム比較

| 特性 | Dilithium | SPHINCS+ |
|------|-----------|----------|
| 暗号基盤 | 格子問題 | ハッシュ関数 |
| 主要演算 | NTT, 多項式乗算 | ハッシュ, Merkle ツリー |
| 数学的構造 | 環構造 | ツリー構造 |
| 署名サイズ | 小〜中 | 大 |

### 2.3 再利用可能なコンポーネント

#### Keccak χ Gate (課題 16)

```
再利用性: 中〜高
理由: SPHINCS+ は SHAKE256 を使用（オプション）
制限: SHA-2 バリアントには適用不可
```

**SPHINCS+ での使用箇所**:
- PRF (疑似乱数関数)
- メッセージダイジェスト
- ツリーハッシュ（SHAKE バリアント）

### 2.4 新規設計が必要なコンポーネント

#### Merkle Path Gate

WOTS+ と FORS の認証には、Merkle ツリーパスの検証が必要です。

```
Merkle Path 検証:
1. リーフハッシュ H(leaf)
2. 各レベルで兄弟ノードと結合
3. ルートハッシュと比較

制約設計:
- path_node[i] = H(left_child || right_child)
- 方向ビット d[i] で左右を決定
- path_node[height] = expected_root
```

**提案する AIR 構造**:
```rust
// Merkle Path Gate columns
pub const MERKLE_NODE: usize = ..;      // 現在のノード値
pub const MERKLE_SIBLING: usize = ..;   // 兄弟ノード値
pub const MERKLE_DIRECTION: usize = ..; // 方向ビット (0=左, 1=右)
pub const MERKLE_NEXT: usize = ..;      // 次のレベルのノード

// 制約: 方向に応じてハッシュ入力を構成
// d=0: H(node || sibling)
// d=1: H(sibling || node)
```

#### ハッシュ連鎖 Gate

WOTS+ は、秘密鍵から公開鍵への連鎖ハッシュを使用します。

```
チェーン: sk → H(sk) → H(H(sk)) → ... → pk (w 回)

制約設計:
- chain[0] = secret_key
- chain[i+1] = H(chain[i])
- chain[w] = public_key
```

#### CSPRNG Gate

署名ごとの乱数生成を証明する必要があります。

```
CSPRNG: seed → random_value

Keccak ベースの場合:
- state = absorb(seed)
- output = squeeze(state)
```

### 2.5 SPHINCS+ STARK 推定工数

| コンポーネント | 工数 | 備考 |
|---------------|------|------|
| Keccak 完全実装 | 5日 | 24ラウンド全体 |
| Merkle Path Gate | 4日 | 設計 + 実装 |
| ハッシュ連鎖 Gate | 3日 | WOTS+ 用 |
| FORS Gate | 3日 | Few-time 署名 |
| 統合テスト | 3日 | E2E 検証 |
| **合計** | **18日** | |

---

## 3. Falcon (格子ベース署名) への応用分析

### 3.1 概要

Falcon は、NTRU 格子上の短いベクトル問題に基づく署名スキームです。Dilithium と同様に格子ベースですが、異なる数学的構造を使用します。

### 3.2 再利用可能なコンポーネント

| コンポーネント | 再利用性 | 備考 |
|---------------|----------|------|
| NTT Gate | 中 | 異なる素数体での NTT |
| FMA Gate | 中 | FFT over C に変更必要 |
| PRC | 低 | 異なる範囲チェック必要 |

### 3.3 固有の課題

#### ガウスサンプリング

Falcon は **離散ガウス分布** からのサンプリングを使用します。これは CBD よりも複雑です。

```
課題:
- ガウス分布の代数化は計算集約的
- 浮動小数点演算の有限体表現
- 高精度が必要
```

#### FFT over Complex Numbers

Falcon は実数/複素数体上の FFT を使用します。

```
課題:
- 有限体 STARK での複素数表現
- 精度とセキュリティのトレードオフ
```

### 3.4 結論

Falcon への適用は **技術的に可能** ですが、Dilithium/Kyber と比較して **大幅な再設計** が必要です。優先度は低く設定します。

---

## 4. コンポーネント再利用性マトリクス

| Dilithium コンポーネント | Kyber | SPHINCS+ | Falcon |
|-------------------------|-------|----------|--------|
| NTT Butterfly Gate | ✅ 高 | ❌ N/A | ⚠️ 中 |
| Montgomery FMA Gate | ✅ 高 | ❌ N/A | ⚠️ 中 |
| Truncation Gate | ⚠️ 中 | ❌ N/A | ⚠️ 中 |
| Keccak χ Gate | ✅ 高 | ✅ 高 | ✅ 高 |
| Norm Check Gate | ⚠️ 中 | ❌ N/A | ⚠️ 中 |
| PRC | ✅ 高 | ❌ N/A | ⚠️ 中 |
| Sampler Gate | ❌ N/A | ❌ N/A | ❌ N/A |
| Hint Gate | ❌ N/A | ❌ N/A | ❌ N/A |

**凡例**: ✅ 高再利用性 | ⚠️ 要調整 | ❌ 適用不可/新規設計

---

## 5. 推奨ロードマップ (フェーズ IV)

### Phase IV-A: Kyber KEM の検証 [高優先度]

```
目標: Kyber-768 の鍵交換を STARK で証明
期間: 2-3 週間
主要成果物:
- kyber_constants.rs
- CBD サンプリング Gate
- Kyber E2E 証明
```

**タスク分解**:
1. 定数モジュール作成 (Q=3329, twiddle factors)
2. NTT/FMA Gate の適用とテスト
3. CBD Gate の設計と実装
4. Kyber 鍵生成の証明
5. Kyber カプセル化/脱カプセル化の証明
6. ベンチマークと最適化

### Phase IV-B: Dilithium 完全プロトコル [中優先度]

```
目標: Dilithium 署名検証の完全な形式検証
期間: 2-3 週間
主要成果物:
- Sampler/Hint Gate の Coq/Lean 仕様
- 完全なサウンドネス証明
- セキュリティ監査対応
```

**タスク分解**:
1. Phase II (Sampler/Hint) の形式仕様作成
2. Coq/Lean での定理証明
3. 完全な署名フローのトレース生成
4. 脆弱性分析の更新
5. 監査パッケージの更新

### Phase IV-C: SPHINCS+ 署名 [低優先度]

```
目標: SPHINCS+-SHAKE256 の署名検証を STARK で証明
期間: 4-6 週間
主要成果物:
- Keccak 完全実装 (24 ラウンド)
- Merkle Path Gate
- WOTS+ / FORS Gate
```

**タスク分解**:
1. Keccak-f[1600] の完全代数化
2. Merkle Path Gate の設計と実装
3. WOTS+ チェーン Gate の実装
4. FORS Gate の実装
5. SPHINCS+ 署名検証の証明
6. ベンチマークと最適化

---

## 6. 技術的考慮事項

### 6.1 モジュラー設計の重要性

現在の実装を以下のように再構成することで、PQC 汎用性を高めることができます:

```
zk-pqc-stark/
├── core/
│   ├── ntt.rs          # 汎用 NTT Gate
│   ├── fma.rs          # 汎用 FMA Gate
│   ├── prc.rs          # 汎用 PRC
│   └── keccak.rs       # Keccak Gate
├── dilithium/
│   ├── constants.rs
│   ├── air.rs
│   └── trace.rs
├── kyber/
│   ├── constants.rs
│   ├── air.rs
│   ├── cbd.rs          # CBD Gate
│   └── trace.rs
└── sphincs/
    ├── merkle.rs       # Merkle Gate
    ├── wots.rs         # WOTS+ Gate
    └── fors.rs         # FORS Gate
```

### 6.2 パフォーマンス予測

| アルゴリズム | 予測証明時間 (256行) | 予測証明サイズ |
|-------------|---------------------|----------------|
| Dilithium | 9ms (実測) | 19.3 KB |
| Kyber | ~12ms | ~22 KB |
| SPHINCS+ | ~50ms | ~40 KB |

### 6.3 セキュリティレベル対応

| NIST Level | Dilithium | Kyber | SPHINCS+ |
|------------|-----------|-------|----------|
| 1 | - | Kyber-512 | SPHINCS+-128 |
| 2 | Dilithium2 | - | - |
| 3 | Dilithium3 | Kyber-768 | SPHINCS+-192 |
| 5 | Dilithium5 | Kyber-1024 | SPHINCS+-256 |

---

## 7. 結論

### 主要な知見

1. **Kyber への応用は高い実現可能性** を持ち、Dilithium STARK の約 70% を再利用可能
2. **SPHINCS+ は異なるアプローチ** が必要だが、ハッシュベース暗号の STARK として価値がある
3. **モジュラー設計** により、将来の PQC アルゴリズム対応を容易にできる

### 推奨アクション

| 優先度 | アクション | 期待される成果 |
|--------|-----------|---------------|
| 高 | Kyber STARK 実装 | 格子ベース KEM の ZK 証明 |
| 中 | Dilithium 形式検証完了 | 監査対応の完全なパッケージ |
| 低 | SPHINCS+ 調査開始 | ハッシュベース署名の実現可能性評価 |

---

## 付録 A: 参考文献

1. NIST FIPS 203: Module-Lattice-Based Key-Encapsulation Mechanism (Kyber)
2. NIST FIPS 204: Module-Lattice-Based Digital Signature Standard (Dilithium)
3. NIST FIPS 205: Stateless Hash-Based Digital Signature Standard (SPHINCS+)
4. Winterfell STARK Library Documentation

---

**作成日**: 2025年12月14日
**分析者**: Dilithium STARK 開発チーム
