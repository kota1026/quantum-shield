# WS2 — 閾値-PQC カストディ設計ノート

> **作成日**: 2026-07-13
> **位置づけ**: `QS_P3_EXECUTION_PLAN.md` の **WS2**（柱A・製品中核）。P3 の最大の差別化＝ Fireblocks 自認の「MPC/閾値-PQC ギャップ」を埋める設計。
> **根拠**: 外部＝`PQ_COMPETITIVE_LANDSCAPE_2026.md` §3.7（Fireblocks は閾値-PQC を未解決と明言）。内部＝`L1Vault.sol` / `SPHINCSVerifier.sol` / `ProverRegistry.sol`。
> **スコープ**: 設計・要件定義（foundry 不要）。実装は本ノートを受けて別途。

---

## 1. 核心テーゼ — なぜ QS が「閾値-PQC ギャップ」の答えになるか

**問題（業界）**: 既存機関カストディ（Fireblocks 等）は **MPC 閾値署名**（GG20/FROST 系）で「単一の署名を複数当事者が鍵分割して生成」する。だが **ML-DSA / SLH-DSA のドロップイン閾値版は存在しない**（閾値-lattice/hash 署名は研究段階）。→ MPC 勢は「PQ 化した瞬間に閾値プロパティを失う」ジレンマ。これが Fireblocks の自認ギャップ。

**QS の解（構造的に異なる）**: QS は**閾値署名（threshold signature）を作らない**。代わりに **N 個の独立した標準 PQ 署名を集め、オンチェーンで M-of-N 検証する**（"threshold *by verification*, not by key-splitting"）。

> **決定的な含意**: QS は **閾値-PQC 暗号の発明を待たずに**、確定済み NIST 標準（ML-DSA-65 / SLH-DSA）**だけ**でカストディの閾値プロパティ（単一鍵漏洩で資産を失わない）を達成する。MPC 勢が塞げないギャップを、QS は"そもそも塞ぐ必要がない設計"で越える。

この「標準プリミティブのみで閾値カストディ」が P3 の中核 moat であり、GTM（WS1）の一番槍。

---

## 2. 現行アーキテクチャ（コード実測・正確版）

QS のデュアル署名は**役割分担**構造。単一操作に2署名を課すのではなく、レイヤーで使い分ける：

| レイヤー | 署名方式 | 誰が | 何を | コード |
|---------|---------|------|------|--------|
| **資産認可** | **Dilithium / ML-DSA** | 資産所有者（ユーザ） | Lock を認可（ユーザの PQ 公開鍵をロックに束縛） | `L1Vault.lock(recipient, dilithiumPubKey)` |
| **状態証明（閾値）** | **SPHINCS+ / SLH-DSA** | **Prover プール（2-of-5）** | 状態遷移（Unlock 時の SR1）を M-of-N で証明 | `_verifyThresholdSignatures` → `_verifyWithSPHINCSVerifier` |

**閾値検証の実体**（`L1Vault.sol`）:
- 定数: `REQUIRED_SIGNATURES = 2`, `TOTAL_PROVERS = 5`（**2-of-5**）。
- メッセージ束縛: `message = SHA3-256(lockId, stateRoot)`（`_verifyThresholdSignatures`）。
- 検証: `signers[]` を走査し、各 Prover の登録 SPHINCS+ 公開鍵で `sphincsVerifier.verify(message, sig, pubKey)` が真なら `validCount++`。`validCount ≥ 2` で通過。
- Prover 登録: `registerProver`（`onlyOwner`）＋ stake。外部 `ProverRegistry` があればそちらを正典に。
- **2経路存在**: `_verifyWithSPHINCSVerifier`（真のオンチェーン PQ 検証・ただし gas 非現実的＝`PQ_RESISTANCE…` §2）と `_verifySimplified`（軽量・後述の通り暗号検証なし）。切替は `useFullVerification`。

**周辺のカストディ機構**（＝ QS は署名チェッカでなく**ポリシーエンジン**）:
- タイムロック（通常 24h / 緊急 7d）、緊急ボンド（0.5 ETH / 5%）、Prover タイムアウト（72h）→ 緊急自動切替、VRF、Challenge/Observer。これらが moat の実体（`QS_STRATEGY_2026` §4 柱A）。

---

## 3. 対 MPC カストディ ギャップ分析

| 観点 | MPC 閾値署名（Fireblocks 等） | QS（M-of-N オンチェーン検証） |
|------|------------------------------|-------------------------------|
| **PQ 対応** | ❌ 閾値-ML-DSA/SLH-DSA が未発明 → PQ 化で閾値喪失 | ✅ 標準 PQ 署名 N 個を検証するだけ。**閾値-PQC 不要** |
| **署名生成** | オフチェーン対話プロトコル（複数ラウンド通信） | 各当事者が**独立・非対話**に標準署名。通信協調不要 |
| **オンチェーン痕跡** | 単一署名（小フットプリント）＝**誰が承認したか不可視** | M-of-N を検証（大フットプリント）＝**誰が承認したか監査可能・強制可能** |
| **フットプリント** | 小 | 大（SLH-DSA は KB 級）→ **ハイブリッド/L3 で緩和**（`QS_STRATEGY` 柱B/§6 D1） |
| **鍵漏洩耐性** | 閾値（単一当事者漏洩で不成立） | 閾値（M-1 漏洩まで安全） |
| **規制監査性** | オフチェーン・不透明 | **オンチェーン・透明・（①実装後）強制可能** |

**結論**: QS は「小フットプリント」を捨てる代わりに **PQ ネイティブ・非対話・オンチェーン監査可能な閾値カストディ**を得る。これは MPC 勢が PQ 移行時に**構造的に出せない**もの。フットプリントの弱点は L3/ハイブリッド（WS3）で相殺する。

---

## 4. 設計ハードニング要件（コードレビュー由来・要修正）

WS2 を「機関カストディ品質」にするための必須改修。**2件は現コードの閾値健全性の欠陥**（`QS-SEC-SPHINCS-001` と同様の追跡対象候補、要テスト確認）:

### 4.1 【修正済み・高】重複署名者が閾値を回避しうる — `QS-SEC-THRESH-001`
`_verifyWithSPHINCSVerifier` は `signers[]` の**一意性を検査しなかった**。`signers = [P1, P1]`＋`sigs = [s, s]`（同一 Prover の有効署名2つ）で `validCount = 2 ≥ REQUIRED_SIGNATURES` となり、**単一 Prover が 2-of-5 を単独充足**しえた。
- **修正**: `_isDuplicateSigner(signers, idx)` を追加し、両検証経路（`_verifyWithSPHINCSVerifier` / `_verifySimplified`）の各ループ先頭で**既出署名者をスキップ**。単一 Prover は最大1カウント。
- **状態**: **実装済み（solc 0.8.20 で 0 エラー・OZ スタブ利用／foundry テストは未実走）**。
- **残**: `[P1,P1]` で `validCount==1`、相異なる `[P1,P2]` で `==2` を確認する foundry ユニットテスト（allowlist 後）。

### 4.2 【要明示・高】`_verifySimplified` は暗号検証を行わない — `QS-SEC-THRESH-002`（候補）
`_verifySimplified` は `sigHash = SHA3-256(pubKeyHash‖message‖signature)` が `!= 0` なら `validCount++`。SHA3 出力は事実上常に非零 → **アクティブ Prover のエントリは署名内容に関わらず有効カウント**。つまり簡易モードでは「アクティブ Prover が2人 name されれば Unlock」で**閾値の暗号的意味がない**。
- **含意（D1 と直結）**: フル検証は gas 非現実的（実行不可）、簡易モードは暗号検証なし → **現状のオンチェーン強制は実質「Prover 集合を信頼するだけ」**。これは `QS_STRATEGY` §6 D1 の「正直な開示」対象そのもの。
- **要件**: 簡易経路を**本番で無効化する保証**（`backend.md` の禁止と整合）／もしくは「BFT 委員会検証」と明示ラベル。WS3 の①実装まではオンチェーン強制可能性を主張しない。

### 4.3 【要検討・中】メッセージ束縛の replay 耐性
`message = SHA3-256(lockId, stateRoot)`。lockId は chainid/nonce を含む SR に紐づくが、**ドメイン分離子・明示 chainid・unlockNonce を message に含める**ことでクロスコンテキスト/クロスチェーン replay をさらに堅く。

### 4.4 【WS5 連動・中】閾値パラメータのティア化
2-of-5 固定を**ティア連動**に（`PQ_RESISTANCE…` §4 の T0-T3）。T2/T3（規制・長期・高額）は定足数を上げる（例 3-of-5 / 4-of-7）。パラメータは per-tier 設定可能に。

---

## 5. デュアルスキーム閾値の構成方式（WS2 の設計判断）

現行は「ユーザ=ML-DSA / Prover=SLH-DSA」の役割分担（方式A）。だが **Prover 証明レイヤー自体は単一系（SLH-DSA）** であり、そこに lattice/hash の**デュアル保守性は効いていない**。T2/T3 では証明レイヤーにもデュアルを効かせるべきか：

| 方式 | 内容 | 単一系破れ耐性 | コスト | 推奨 |
|------|------|--------------|--------|------|
| **A（現行・役割分担）** | ユーザ=ML-DSA、Prover=SLH-DSA | 部分的（層で別系だが各層は単一系） | 低 | **T0/T1** |
| **B（Prover デュアル）** | 各 Prover が ML-DSA＋SLH-DSA の両鍵を保持、定足数は**両系の有効署名**を要求 | 高（証明層も単一系破れに耐える） | 高（2倍検証） | **T2/T3 の中核候補** |
| **C（混成定足数）** | N を ML-DSA/SLH-DSA 混成、**各系から最低1名**を要求 | 中〜高（単一系破れ下でもクロス系 liveness） | 中 | T2/T3 の代替 |

**推奨**: **T1=方式A、T2/T3=方式B（またはC）**。「単一系の暗号解読ブレークで custody が崩れない」= デュアル設計の存在意義（`QS_STRATEGY` 柱C）を、最も価値の高い層で実際に効かせる。最終選択は WS3 の gas 実測（方式B は検証コスト2倍）を見て確定。

---

## 6. カストディ・ポリシーへのマッピング（機関要件）

QS の既存機構を機関カストディのポリシー語彙に対応づける（GTM/WS1 の説明資産）:

| 機関カストディ要件 | QS の対応機構 |
|-------------------|--------------|
| 承認定足数（quorum） | Prover M-of-N（ティア連動・§4.4） |
| 役割分離（起票/承認/緊急） | ユーザ認可(ML-DSA) × Prover 証明(閾値) × SecurityCouncil(緊急) |
| 出金の時間遅延 | タイムロック 24h（通常）/ 7d（緊急） |
| 緊急停止・回収 | 緊急ボンド＋72h タイムアウト＋緊急経路 |
| 監査証跡 | オンチェーン M-of-N＋イベント（`ProverRegistered` 等） |
| 異議申立（不正検知） | Challenge/Observer＋（①実装後）fraud proof |

---

## 7. WS2 成果物と次アクション

**本ノートで確定**:
- 核心テーゼ（§1）＝「標準プリミティブのみで閾値カストディ」= P3 の一番槍。
- 対 MPC ギャップ分析（§3）＝ GTM 資産。
- 要修正2件（§4.1/4.2）＝ 閾値健全性の具体欠陥（追跡候補 THRESH-001/002）。

**次アクション（優先順）**:
1. ~~**§4.1 distinct-signer 修正を実装**~~ → **実装済み（solc 通過・foundry テスト未実走）**。
2. **§4.2 の簡易経路**を本番無効化ガード or 明示ラベル（D1 正直開示と一体）。
3. §5 方式B/C の gas 見積り（WS3 の foundry 実測に相乗り）。
4. §4.4 ティア化パラメータ設計（WS5 と統合）。

**依存**: §4.1/4.2 の**テスト実走・§5 の gas 実測は foundry allowlist が前提**（WS3/WS4 共通ブロッカー）。設計・distinct-signer のコンパイル型チェックは solc-js で可能。

---

*本ノートは設計・要件であり、閾値ロジックの変更は §4 の修正実装＋foundry テストで確定する。核心テーゼ（§1）は P3 の GTM/技術の両輪。*
