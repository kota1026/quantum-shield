# QS WS4-b/WS3 — オンチェーン検証を「本物」にする設計（proof-based）

> **作成日**: 2026-07-24 ／ **状態**: 設計（採択方針 A の詳細化）
> **前提**: `QS_CRYPTO_AGILITY_ARCH.md`（P2 完了）、`QS_SECURITY_FINDINGS.md`（THRESH-002・L3-001）、WS4-a 完了（バックエンド実 SLH-DSA 検証＋KAT）。
> **決定済み**: ②の方針は **A: proof-based**（オフチェーンで実検証 → その正当性を proof 化 → on-chain で検証）。
> **凡例**: 🅐 現状 / 🅣 目標 / ⚠ 決定が必要。

---

## 0. 一行テーゼ
**「フル on-chain SPHINCS+ 検証はガス非現実的」だから、実検証はオフチェーンで行い（WS4-a で本物化済み）、その実行の正当性を STARK proof として on-chain で検証する。** これが THRESH-002／L3-001 を同時に解く唯一現実的な道であり、QS の「オンチェーン強制」を初めて実体化する。

---

## 1. 現状（🅐）と埋めるべき穴

| 層 | いま | 穴 |
|----|------|----|
| ユーザ ML-DSA 署名 | ✅ 実検証（fips204, backend） | — |
| prover SLH-DSA 署名 | ✅ **WS4-a で実検証＋KAT**（backend） | on-chain では未強制 |
| L1 `L1Vault._verifyThresholdSignatures` | `_verifySimplified`＝暗号検証なし（THRESH-002）／`SPHINCSVerifier` は未KAT・フルはガス非現実 | **on-chain で M-of-N を暗号的に強制できていない** |
| L3 `CoreLayer._verifyProof` / `STARKVerifier` | placeholder＝任意 proof 受理（L3-001） | **状態遷移の正当性を検証していない** |

**穴の本質**: オフチェーンでは本物になったが、**それを信頼する根拠（on-chain で検証可能な proof）が無い**。バックエンドは信頼された relayer にすぎない。

---

## 2. 採択方針 A：proof-based の全体像（🅣）

```
[prover pool] 各 prover が SLH-DSA 署名（HSM）
     │  （WS4-a: backend が実検証。ここまで本物）
     ▼
[Prover/aggregator] 「statement が真」の証拠を集約
     │  statement S:
     │   ①  M 個以上の相異なる active prover の SLH-DSA 署名が
     │       digest = SHA3-256(lockId ‖ sr_1) に対して valid
     │   ②  sr_1 が sr_0 からの valid な状態遷移
     ▼
[Prover(zk)] statement S の実行を証明 → π (STARK proof)
     ▼
[L1 on-chain] STARKVerifier.verify(π, publicInputs) を検証
     │  publicInputs = { lockId, sr_0, sr_1, proverSetRoot, M }
     ▼
[L1Vault] π が valid のときのみ unlock を PENDING に（executeUnlock へ）
```

- **P2 との接続**: on-chain の「検証器」は、P2 の `ISignatureVerifier`/`SchemeRegistry` を一般化した **proof-verifier**（schemeId = "STARK-THRESHOLD-v1" 等）として差し込む。個々の署名検証ではなく「statement の proof」を検証する。
- **THRESH-002/L3-001 を同時に解く**: ① が prover 署名の on-chain 強制（THRESH-002）、② が状態遷移検証（L3-001）を、**1つの proof** に束ねる。

---

## 3. 証明系の選定 ⚠（最重要・正直な論点）

**制約 CP-1**: keccak/ECDSA/ペアリング等の pre-FIPS・量子脆弱プリミティブを application 層で使わない。→ **証明系の“外側検証”も量子安全でなければ、PQ カストディの意味が崩れる**。

| 証明系 | 量子安全 | trusted setup | on-chain 検証コスト | CP-1 整合 |
|--------|:---:|:---:|:---:|:---:|
| **STARK（hash-based, 直接 on-chain 検証）** | ✅（ハッシュ＝Grover のみ） | 不要 | **高い（が有界）** | ✅ 最良 |
| STARK→SNARK wrap（安価 on-chain） | ❌ 外側がペアリング | 必要 | 低い | ✗（CP-1 破り） |
| SNARK（Groth16/PLONK） | ❌ | 必要 | 低い | ✗ |

**結論（⚠ 決定）**: **CP-1 を守るなら「STARK を on-chain で直接検証」一択**。安価さのための SNARK wrap は**量子脆弱なペアリングを外側に持ち込む**ため、PQ カストディの前提と矛盾する。ガス高は「有界コスト」として受容し、L3（安価な実行環境）で proof 検証を行い L1 へアンカーする設計で吸収する（既存の L1/L3 分離と整合）。

**実装スタック ⚠**: SLH-DSA 検証を手書き AIR で回路化するのは非現実的（SPHINCS+ は膨大なハッシュ木）。**zkVM（STARK ベース：Plonky3 / RISC Zero / SP1 等）で「Rust の実検証コードをそのまま実行し証明」**するのが現実的。ただし zkVM の on-chain verifier は通常 SNARK wrap 前提のものが多く、上の CP-1 制約と衝突しうる → **「STARK proof を SNARK wrap せず直接 on-chain 検証できるスタック」**の選定が WS4-b の技術的コア。候補評価が必要（Plonky3 の FRI verifier を Solidity 実装 等）。

---

## 4. 何を証明するか（statement の分解）
- **①-a 署名 valid**: 各署名 i について `SLH_DSA.verify(pk_i, digest, sig_i) == true`。zkVM 内で fips205 検証（WS4-a と同一ロジック）を実行。
- **①-b M-of-N・distinct**: 相異なる pk_i が `proverSetRoot`（active prover 集合の Merkle root）に含まれ、数が M 以上（THRESH-001 の distinct 要件を回路内で強制）。
- **② 状態遷移**: `sr_1 = transition(sr_0, unlock params)`（StateRootCalculator の SR1 構成を回路内で再計算）。
- **public inputs**: `lockId, sr_0, sr_1, proverSetRoot, M`。秘密 witness: 署名群・pk 群・Merkle パス。

**コスト現実**: SLH-DSA 1 検証でも SPHINCS+ のハッシュ量が大きく、zkVM 証明時間は分単位になりうる。M 個ならさらに。→ **再帰証明（各署名を個別に証明し集約）**や、**署名検証を軽い方式（閾値 ML-DSA 等）に寄せる**選択肢も WS4-b の検討対象（P2 の crypto-agility が効く）。

---

## 5. 段階計画（正直な規模感）

| Phase | 内容 | 規模 | 依存 |
|-------|------|------|------|
| **WS4-b.1 設計確定** | 証明系スタック選定（STARK 直接 on-chain 検証が可能なもの）・statement/AIR 定義・コスト実測（PoC で 1 署名の証明時間/proof サイズ/検証ガス） | 1–2 週 | 本doc |
| **WS4-b.2 オフチェーン prover** | zkVM で ①②を証明する Rust prover（WS4-a の検証コードを流用）＋ backend 統合 | 数週 | b.1 |
| **WS3 オンチェーン verifier** | `STARKVerifier`/`CoreLayer._verifyProof` を**実 FRI/Merkle/制約検証**に置換（placeholder 撤廃）。L1Vault は P2 の proof-verifier 経由で呼ぶ | 数週〜 | b.1/b.2 |
| **統合・監査** | E2E（lock→unlock→proof→on-chain 検証→executeUnlock）＋外部監査 | 数週 | 上記 |

**総じて数ヶ月規模**。これは QS の中核であり、他の全機能はこの上に載る。

---

## 6. 着地するまでの安全弁（今すぐ）🅣
proof-based が landing するまで、**実価値を絶対に入れない**ことをコード＋運用＋開示で強制：
- **実資金ゲート**: mainnet 無効／testnet 限定を config で強制（実装タスク化）。
- **開示**: サイトの「全てオンチェーンで検証可能」を「設計原則。オンチェーン強制は proof-based を実装中」に修正（honest-disclosure、別途承認待ち）。
- **現行の暫定強制**: WS4-a（backend 実検証）＋楽観的 challenge/slash（VAULT-004 で会計是正済）＝「信頼された relayer＋事後是正」。これは proof-based までの繋ぎであり、**真の on-chain 強制ではない**と明記。

---

## 7. 決定が必要な分岐（⚠）
1. **証明系スタック**: STARK を SNARK wrap せず on-chain 直接検証できる構成（Plonky3+Solidity FRI verifier 等）を採るか。CP-1（PQ 安全）を厳守するならこれが必須。
2. **署名方式**: SLH-DSA を回路化（重い）か、閾値 ML-DSA（lattice, 回路が軽い可能性）に寄せるか。P2 の crypto-agility でどちらも受けられる。
3. **証明のレイヤ**: proof 検証を L1 で直接行うか、L3 で検証し結果を L1 へアンカーするか（ガス最適化）。
4. **PoC の最初の的**: 「1 署名の zkVM 証明→Solidity 直接検証」の実測 PoC を WS4-b.1 の最初の成果物にするか。

---

## 8. まとめ
方針 A は「オフチェーン実検証（WS4-a 済）＋ on-chain proof 検証」で、THRESH-002・L3-001 を束ねて解く唯一現実的な道。**最大の技術的争点は「CP-1 を守った（量子安全な）安価 on-chain proof 検証」**で、SNARK wrap の安易な採用は PQ 前提を壊す。**次アクション: WS4-b.1（証明系スタック選定＋1署名 PoC の実測）**。それまでは実資金ゲートと honest-disclosure で安全を担保する。
