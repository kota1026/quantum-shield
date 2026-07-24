# QS WS4-b.1 — 証明系スタック評価（PQ 安全 on-chain 検証）

> **作成日**: 2026-07-24 ／ **状態**: 評価（WS4-b.1 の第一成果物）
> **前提**: `QS_WS4B_ONCHAIN_VERIFICATION.md`（方針 A: proof-based）／ ①(a) 完了（backend 実 SLH-DSA 検証＋noble↔fips205 interop KAT）。
> **要件（CP-1）**: on-chain の proof 検証も **量子安全（hash/格子ベース）＋ transparent（trusted setup なし）** でなければ、PQ カストディの前提が崩れる。

---

## 0. 一行結論
**標準 zkVM（SP1/RISC Zero）の安価 on-chain 検証はすべて BN254 ペアリング SNARK wrap＝量子脆弱で CP-1 に反する。** CP-1 を守る道は **hash-based・transparent な証明系（WHIR / FRI / Binius）を EVM で直接検証**すること。現状フロンティアだが実在（WHIR Solidity verifier PoC ≈ **1.9M gas**）。QS はここを的にし、**L3 で proof 検証 → L1 へアンカー**でガスを吸収する。

---

## 1. 評価表（2026 実データ）

| スタック | 内部 | on-chain 検証 | ガス | 量子安全 | trusted setup | CP-1 | 判定 |
|---------|------|--------------|------|:---:|:---:|:---:|------|
| **SP1**（Succinct, Plonky3） | STARK(FRI/BabyBear) | **Groth16/PLONK wrap（BN254）** | ~300k | ❌ ペアリング | ❌ 要 | ✗ | 安価だが CP-1 違反 |
| **RISC Zero** | STARK(Goldilocks) | **Groth16 wrap（BN254）** | ~300k | ❌ ペアリング | ❌ 要 | ✗ | 同上 |
| **直接 FRI（StarkEx Stone / proof-splitter）** | STARK(FRI) | FRI/Merkle を**複数tx分割**で直接検証 | 高（分割） | ✅ hash | ✅ 不要 | △ | PQ 安全だが複雑・高ガス |
| **WHIR**（2024, RS proximity, super-fast verify） | hash-based | **EVM Solidity verifier（直接）** | **≈1.9M（PoC）** | ✅ hash | ✅ 不要 | ✅ | **推奨方向**（フロンティア） |
| **Binius / FRI-Binius**（binary field） | hash-based | 研究段階 | — | ✅ hash | ✅ 不要 | ✅ | 追跡（効率化） |

**要点**: 「安価（~300k gas）」を実現している既存スタックは**例外なくペアリング SNARK wrap**＝量子脆弱。**PQ 安全な on-chain 直接検証は WHIR/FRI/Binius 系のみ**で、ガスは百万〜（PoC 1.9M）オーダー。

---

## 2. 推奨（⚠ 決定）

1. **証明系: hash-based・transparent（WHIR を第一候補、FRI/Binius を追跡）**。ペアリング SNARK wrap は CP-1 のため**採らない**。
2. **検証レイヤ: L3 で proof を検証し L1 へアンカー**。~1.9M gas は L1 では高いが L3（安価）なら現実的。既存の L1/L3 分離と整合。
3. **外部研究に相乗り**: Ethereum コミュニティの「**EVM-Verifiable Post-Quantum Client-Side SNARK（WHIR ベース）**」/「Definitive CSP」スレッドは QS の要件そのもの。車輪の再発明を避け、この verifier を評価・採用する。
4. **証明対象の軽量化（P2 crypto-agility を活用）**: SLH-DSA 検証の回路化は重い（SPHINCS+ の巨大ハッシュ木）。**閾値 ML-DSA（lattice, 回路が軽い可能性）に寄せる**選択肢を PoC で比較。P2 の SchemeRegistry があるのでスキームは差替可能。

---

## 3. PoC 計画（WS4-b.1 の次の具体ステップ）

| # | PoC | 測る値 | 目的 |
|---|-----|--------|------|
| **P0** | WHIR Solidity verifier（既存 PoC）を QS の L3 にデプロイ | 実ガス・proof サイズ | CP-1 適合の on-chain 検証コストの地に足のついた基準値 |
| **P1** | **1 署名検証の証明**：hash-based zkVM/prover で `SLH_DSA.verify(pk, digest, sig)`（①(a) の fips205 ロジック）を実行し証明 | 証明時間・proof サイズ | SLH-DSA 直接証明の現実性 |
| **P1'** | 対照：**閾値 ML-DSA 1 検証**の証明 | 同上 | 軽い回路の候補比較（scheme 差替判断） |
| **P2** | M-of-N（distinct）＋状態遷移 ② を1 proof に束ねる | 証明時間・ガス | statement 全体の feasibility |

**注**: フル zkVM PoC はツールチェーン（数GB）＋証明（時間）を要し、現行の ephemeral 実行環境では不安定。**P0（WHIR verifier のガス実測）と P1 の証明時間実測**を、専用の永続環境 or CI で回すのが現実的。本 doc はスタック選定と PoC 設計＝WS4-b.1 の設計成果物。

---

## 4. 正直な現実認識
- **CP-1 を厳守すると「安価」は当面得られない**（百万ガス級）。L3 検証＋L1 アンカーで吸収するのが妥当。
- WHIR/PQ-SNARK は**2024–2026 の新しい研究**で、production 実績はこれから。QS が採るなら**外部研究と歩調を合わせ、監査を厚く**する（戦略の「credibility で差別化」）。
- **代替の割り切り**: どうしても安価さが必要なら、「proof の外側検証は SNARK wrap（現在は安全、CRQC 出現で破れるが、その時は移行済み）」という**リスクベースの妥協**もありうる。ただし CP-1（PQ 純度）と矛盾するため、**採る場合は明示的な経営判断＋開示**が必要。

---

## 5. 決定が必要な分岐（⚠）
1. **CP-1 厳守か、リスクベース妥協（SNARK wrap 一時許容）か** — QS の存在意義に直結する経営判断。推奨は厳守（hash-based）。
2. **証明対象スキーム**: SLH-DSA 直接 vs 閾値 ML-DSA（軽量）。PoC P1/P1' で実測比較。
3. **WHIR verifier を自前評価するか、外部研究の実装を待つ/協業するか**。

---

## 6. まとめ
WS4-b.1 の結論：**安価 on-chain 検証＝ペアリング wrap＝量子脆弱**という業界標準は QS の CP-1 と両立しない。QS は **hash-based・transparent（WHIR 系）を L3 検証＋L1 アンカーで採る**のが唯一整合的な道で、これはフロンティアだが実在（PoC 1.9M gas）。**次アクション: P0（WHIR Solidity verifier のガス実測）＋ P1（SLH-DSA/閾値ML-DSA 各1検証の証明コスト実測）を永続環境/CI で実行**し、scheme と検証レイヤを確定する。

---

*出典: SP1/RISC Zero on-chain 検証は Groth16(BN254) wrap ~300k gas（Succinct/RISC Zero docs, L2BEAT zk-catalog, Medium 比較）／StarkEx Stone proof-splitter（zksecurity stark-book）／WHIR（RS proximity, 2024）＋ EVM PQ client-side SNARK 研究（hackmd clientsideproving, ~1.9M gas PoC）。詳細リンクは本セッションの検索記録。*
