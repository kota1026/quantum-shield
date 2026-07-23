# QS Crypto-Agility & Custody-Policy-Layer アーキテクチャ設計

> **作成日**: 2026-07-22 ／ **状態**: 設計（合意用ドラフト）
> **目的**: 2026年央の外部シフト（NIST 閾値PQC標準化・FIPS204互換 閾値ML-DSA・署名非依存MPCカストディ・on-ramp Round 3）を踏まえ、QS が取るべき3手を**1つの実装可能なアーキテクチャ**に統合する。
> **前提資料**: `QS_STRATEGY_2026.md` / `PQ_COMPETITIVE_LANDSCAPE_2026.md` / 本セッションの `PQ 最新動向リサーチ` / `QS_SECURITY_FINDINGS.md`。
> **凡例**: 🅐 as-is（現行コード） / 🅣 to-be（目標） / ⚠ 決定が必要な分岐。

---

## 0. 一行テーゼ

**QS の堀は「署名器」ではなく「署名器の上に載るカストディ・ポリシー状態機械」である。** よって (2) 署名スキームを差替可能にし（crypto-agility）、(1) ポリシー機構をスキームから疎結合化し、(3)「dual は単一鍵の lattice-break 保険」と対外整理する。これら3手は同一の抽象化 —— **「認可（policy）」と「署名有効性（verifier）」の分離** —— に収束する。

---

## 1. なぜ今か（外部の効き所）

| 外部事実（2026央） | QS への含意 |
|---|---|
| NIST **IR 8214C**（2026-01 final）Class N が ML-DSA/SLH-DSA を分散署名の対象に明記 | 分散信頼カストディ原語を NIST が標準化中 → QS の prover-pool は**競合でなく“下位署名器”として呑み込む**べき |
| **FIPS204 互換 閾値ML-DSA**（標準3.3KB署名、未改変検証器で通る／Kao・TALUS 他） | カストディアンが**チェーン側を変えず**分散署名を追加可能 →「別レイヤーが要る」前提が侵食。**QS の verify() は同一のまま閾値署名器を受け入れられる**必要 |
| **署名非依存MPC「dual-gate」**（EternaX, 2026-07）＋「hash半分は閾値の負債」 | 差別化への正面攻撃。**反論＝堀は署名でなくポリシー機構**（Move 3） |
| on-ramp **Round 3**（2026-05, 9方式: lattice/isogeny/MPCitH/multivariate） | 署名地形が未確定 → **固定 dual は将来負債。hot-swap 前提**（Move 2） |
| CNSA 2.0（ML-DSA-**87**要求）／脅威クロック前進 | ML-DSA-65→87 の**無停止移行**が要件化しうる |

---

## 2. 現行アーキテクチャ（🅐 as-is）

**署名検証の所在（層別）**

| 層 | 何を検証 | 抽象化 | 現状（監査所見） |
|---|---|---|---|
| L1 `L1Vault.sol` | prover の SPHINCS+ 閾値署名（unlock 認可） | **`ISPHINCSVerifier`（差替可・`setSPHINCSVerifier`）** | `_verifySimplified` は暗号検証なし（THRESH-002・既知） |
| L1 `SPHINCSVerifier.sol` | SPHINCS+ 単体 | interface 準拠 | KAT 未整備 |
| L3 `CoreLayer.sol` | STARK proof | `_verifyProof` が placeholder | **L3-001（任意proof受理・要実装）** |
| Backend `sphincs_service.rs` | prover SPHINCS+ | trait なし（関数直呼び） | **PROVER-001 で本番フェイルクローズ済** |
| Backend `crypto` | ユーザ ML-DSA(Dilithium) を SR_0 に畳込み | 固定 | — |
| Backend `auth_service.rs` | セッション ECDSA/SIWE | 固定 | AUTH-002 domain/expiry 済 |

**dual-signature の意味**: ユーザ = ML-DSA（Dilithium、SR_0 に束縛）／prover pool = SPHINCS+ 閾値（SR_1 を M-of-N 認可）。**カストディ機構**（prover 選定＝VRF、timelock、challenge/slash、emergency、governance）は `services/*` と `L1Vault` の状態機械に散在。

**要点**: SPHINCS+ 側は既に**1段の差替可能性**（`ISPHINCSVerifier`）がある。ML-DSA 側・L3 proof 側・backend は**未抽象**。ポリシー機構は署名スキームに**部分的に結合**している。

---

## 3. Move 2 — Crypto-Agility（署名スキームの hot-swap）🅣

### 3.1 目標
**任意の NIST/標準署名スキームを、hard migration なしに追加・切替できる**。対象: ML-DSA-65/87、SLH-DSA(SPHINCS+)、FN-DSA(FIPS206,~2027)、SQIsign 等 Round 3、そして**閾値ML-DSA**（＝標準署名を出すので同じ verify() で受かる）。

### 3.2 オンチェーン抽象化
`ISPHINCSVerifier` を**スキーム非依存の `ISignatureVerifier`** に一般化し、**SchemeRegistry** を導入:

```solidity
interface ISignatureVerifier {
    function schemeId() external view returns (bytes4);          // e.g. ML-DSA-65, SLH-DSA-128s
    function verify(bytes32 message, bytes calldata sig, bytes calldata pubKey)
        external view returns (bool);
    function expectedPubKeyLen() external view returns (uint256); // 0 = 可変
}

// SchemeRegistry: schemeId -> verifier。governance/SecurityCouncil ゲート。
mapping(bytes4 => ISignatureVerifier) public verifiers;
function setVerifier(bytes4 schemeId, address verifier) external onlyGovernance;
```

- **Lock/Unlock は `schemeId` を携える**。`L1Vault` は verifier を registry から解決。既存 `sphincsVerifier`/`setSPHINCSVerifier` は `SchemeRegistry` の特殊ケースに一般化（後方互換のため薄いアダプタを残す）。
- **閾値ML-DSA の受け入れ**: 閾値署名器は「標準ML-DSA署名」を出すため、`ISignatureVerifier(ML-DSA-65)` が**そのまま**検証できる（研究の要点をそのまま利用）。QS は署名の生成方式（単一鍵/閾値/MPC）を問わない。
- ⚠ **決定**: registry を L1Vault 内包 mapping にするか、独立 `SchemeRegistry` コントラクト（複数 vault 共有）にするか。推奨=独立コントラクト（テスト・監査境界が明確）。

### 3.3 バックエンド抽象化
```rust
pub trait SignatureVerifier {
    fn scheme_id(&self) -> SchemeId;
    fn verify(&self, msg: &[u8], sig: &[u8], pubkey: &[u8]) -> Result<bool, VerifyError>;
}
// registry: SchemeId -> Box<dyn SignatureVerifier>。config で有効スキームを選択。
```
- `sphincs_service` の verify を `SlhDsaVerifier: SignatureVerifier` に、ML-DSA を `MlDsaVerifier` に。**PROVER-001 のフェイルクローズは「registry に real verifier が無ければ拒否」に一般化**（＝監査の是正と crypto-agility が同一機構に収斂）。
- ⚠ **決定**: 実装ライブラリ。SLH-DSA/ML-DSA は `pqcrypto-*`（sphincsshake128ssimple=7856B 一致）を採用し **KAT を CI 必須化**（WS4）。

### 3.4 移行メカニクス（no flag-day）
新スキーム = **verifier 追加（governance）＋ 鍵ローテーション**のみ。既存 lock は旧 schemeId で検証継続、新規は新 schemeId。EternaX の「移行＝鍵ローテ」利点を、**dual 冗長を維持したまま**取り込む。

---

## 4. Move 1 — ポリシー層を署名器の“上”に置く 🅣

### 4.1 境界の定義
2つの関心を明示分離する:

```
┌─────────────────────────────────────────────────────────┐
│  Custody Policy State Machine  ← QS の堀                  │
│  prover選定(VRF) · timelock · challenge/slash · emergency │
│  · governance · 二重出金/replay 防御(監査で強化済)        │
├─────────────────────────────────────────────────────────┤
│  IAuthorizer 境界:「この unlock/action は認可されたか?」  │
├─────────────────────────────────────────────────────────┤
│  Signature/Proof Verifier(s)  ← 差替可能(Move 2)          │
│  M-of-N SPHINCS+ / 閾値ML-DSA / STARK proof / …           │
└─────────────────────────────────────────────────────────┘
```

- **`IAuthorizer`**: 「操作 X は所定の quorum/条件で認可されたか」を bool で返す。現行の **prover-pool M-of-N はその一実装**。**将来の NIST 閾値署名器も別実装**として差し込める（QS は authorizer を選ぶだけ）。
- ポリシー機構（timelock/emergency/challenge/governance）は **authorizer の結果に対して**作用し、**署名スキームを直接知らない**。
- これにより QS は「どの署名器が勝っても（単一鍵/閾値/MPC/NIST標準）**その上のポリシー層として生存**」する（戦略テーゼの実体化）。

### 4.2 監査の設計級残課題との接続
- **L3-001（実STARK）**: `IAuthorizer`/`ISignatureVerifier` の裏に real 検証を置く自然な場所。抽象化が「本物の強制」を差し込む受け皿になる。
- **VAULT-004 裁定**（未防御=不正確定の無裁定）: 「認可/裁定」はまさにポリシー層の責務 → `IAuthorizer` に fraudProof 裁定 or SecurityCouncil 必須を寄せる。
- **PROVER-002**（endpoint 認証）: authorizer の入力（prover 認証）を境界内で明確化。

---

## 5. Move 3 — 「dual vs 閾値」対外ナラティブ

**主張（EternaX 他への反論）**:
1. **dual は閾値署名のための構造ではなく、単一鍵の“lattice-break 保険”**。lattice 一族が破られた日でも hash-based(SLH-DSA)が独立に資産を守る。→「hash は閾値の負債」は**目的の取り違え**。
2. **閾値化は lattice 半分（ML-DSA）に適用**し、hash 半分は**独立 co-signature / recovery 経路**として保持（閾値化しない）。両立する。
3. **堀は raw 署名でなくカストディ・ポリシー機構**。閾値ML-DSA が署名を commoditize しても、QS は**それを一 verifier として消費**し、timelock/challenge/emergency/governance で差別化する（Move 1）。
4. **中立性**: 脅威クロック（15-bit ECC 破り・Google <50万qubit）は lattice/hash の優劣をつけない → dual は**証明された必然でなく合理的 hedge**、と正直に位置づける（誇張回避＝戦略の「credibility で差別化」）。

---

## 6. 段階計画（WS マッピング）

| Phase | 内容 | 依存/検証 |
|---|---|---|
| **P1 抽象化（設計合意）** | 本doc合意。`ISignatureVerifier`/`SchemeRegistry`/`IAuthorizer` の IF 確定 | 合意のみ |
| **P2 オンチェーン IF 導入** ✅ | `ISignatureVerifier`＋独立`SchemeRegistry`＋`SPHINCSVerifier` conformance＋L1Vault に `activeSchemeId`/`_activeVerifier()`（registry優先・sphincsVerifier フォールバック＝後方互換）＋`activeVerifier()` getter | **完了: forge 118件通過(既存110＋新規8), 0 failed。回帰なし＋hot-swap routing 実証** |
| **P3 backend registry** | `SignatureVerifier` trait＋registry、PROVER-001 を「real無→拒否」に一般化 | cargo test |
| **P4 real verifier（WS4）** | `pqcrypto` で ML-DSA/SLH-DSA 実装＋**KAT を CI 必須** | KAT gate |
| **P5 L3 real proof（WS3, L3-001）** | STARK 検証を IF 裏に実装 | 専用設計（大） |
| **P6 policy 裁定（VAULT-004裁定）** | `IAuthorizer` に fraudProof 裁定/SecurityCouncil | forge |

**順序原則**: P2/P3（抽象化）はテスト安全に先行可。P4/P5（real crypto）は KAT/専用設計に律速され、外部クロック（CNSA 2027・FIPS206 2027）に合わせて段階投入。

---

## 7. 非ゴール / リスク

- **非ゴール**: 独自署名方式の発明、閾値署名の自前実装（成熟した NIST/研究成果を verifier として採用）、L1 のフォーク。
- **リスク**: (a) 抽象化がガス/複雑性を増やす → registry は薄く、hot path は単一 SLOAD。(b) 閾値ML-DSA 研究は査読前・MPCコスト高 → **verifier として“来たら差せる”準備が価値**、自前実装は急がない。(c) real crypto（P4/P5）は KAT なしに入れない（プロジェクト方針）。

## 8. 決定が必要な分岐（⚠）
1. SchemeRegistry: 独立コントラクト（推奨）か L1Vault 内包か。
2. backend 実装ライブラリ: `pqcrypto-*` 採用可否と KAT ソース（FIPS205/PQClean 差分 vs 本検証器の非標準ADRSに合わせた自己整合KAT）。
3. `IAuthorizer` を新設するか、当面は L1Vault の既存フローに schemeId だけ足す最小変更に留めるか（段階）。

---

## 9. まとめ

3手は**「認可と署名有効性の分離」**という単一の抽象化に収束する。これは同時に、(i) 外部の閾値PQC/署名地形の流動性への hedge、(ii) 監査の設計級残課題（L3-001・VAULT-004裁定・PROVER-002）を差し込む受け皿、(iii)「署名器でなくポリシー層が堀」という戦略テーゼの実体化、を一挙に満たす。**次アクション: 本doc P1 の IF（`ISignatureVerifier`/`SchemeRegistry`/`IAuthorizer`）合意 → P2 の後方互換抽象化に着手**。

---

*出典（動向根拠）: NIST CSRC IR 8214C・MPTS 2026、arXiv:2601.20917(Kao)/2603.22109(TALUS)/2607.08226(EternaX dual-gate)、NIST on-ramp Round 3(IR 8610, 2026-05)、BIP-360/361、Google 暗号通貨白書(2026)。詳細は本セッションの動向リサーチ記録を参照。*
