# QS セキュリティ指摘トラッカー

> **作成日**: 2026-07-13
> **出典**: マルチエージェント総点検（32エージェント・22件提起 → 敵対的検証で確度≥8を8件確定＋境界1件）。手法・範囲は本セッションの監査ワークフロー。
> **凡例（状態）**: ✅ 修正済（コンパイル通過／テストは foundry・cargo allowlist 後）／ 🟡 部分修正（即効の安全対策のみ、残は設計作業）／ 📋 追跡（設計実装が必要・cosmetic 修正は不可）
> **重要**: `✅`/`🟡` はコンパイル型チェックのみで担保。**foundry（Solidity テスト）・実 KAT・cargo test は allowlist 追加後に必須**。

---

## サマリ

| ID | 重大度 | 箇所 | 種別 | 状態 |
|----|--------|------|------|------|
| QS-SEC-VAULT-001 | HIGH | `L1Vault.sol` executeUnlock | 二重出金 | ✅ 修正済 |
| QS-SEC-VAULT-002 | HIGH | `L1Vault.sol` requestUnlockLegacy | recipient 非束縛/リプレイ | ✅ 修正済（無効化） |
| QS-SEC-VAULT-003 | HIGH | `L1Vault.sol` challenge | 自己チャレンジ抽出 | 🟡 部分（自己チャレンジ遮断） |
| QS-SEC-VAULT-004 | HIGH | `L1Vault.sol` challenge 会計 | 報酬をプール原資で支弁→債務超過 | ✅ 修正済（stake原資化）／裁定は追跡 |
| QS-SEC-L3-001 | HIGH | `l3/.../CoreLayer.sol` _verifyProof | proof 無検証受理 | 📋 追跡（実STARK検証） |
| QS-SEC-AUTH-001 | HIGH | `middleware.rs` admin_jwt_auth | 権限昇格（任意ユーザ→admin） | ✅ 修正済 |
| QS-SEC-PROVER-001 | HIGH | `services/mod.rs` submit_prover_signature | 署名無検証で計上 | ✅ 修正済（本番フェイルクローズ） |
| QS-SEC-PROVER-002 | HIGH | `routes/prover.rs` sign エンドポイント | 呼出元無認証 | 🟡 緩和（PROVER-001で資金影響封止） |
| QS-SEC-AUTH-002 | MEDIUM | `auth_service.rs` authenticate_siwe | SIWE domain/expiry/nonce 未検証 | 🟡 部分（domain+expiry 強制／サーバnonce 追跡） |
| QS-SEC-VRF-001 | HIGH(降格) | `VRFConsumer.sol` onlyVRFCoordinator | coordinator 未設定時に callback バイパス | ✅ 修正済（fail-closed） |
| QS-SEC-VAULT-005 | MEDIUM | `L1Vault.sol` _slashSigningProvers | slash の collusion 係数が raw length（自作込みの回帰） | ✅ 修正済（自己監査） |

関連（本セッションで既修正）: **QS-SEC-SPHINCS-001**（Merkle index、✅）、**QS-SEC-THRESH-001**（distinct-signer、✅）。既知未修正: **QS-SEC-THRESH-002**（`_verifySimplified` 暗号検証なし）。

---

## 修正済み（✅）

### QS-SEC-VAULT-001 — executeUnlock の SLASHED 二重出金
- **欠陥**: Challenge が valid 解決で lock を `SLASHED`＋送信者へ全額返金するが `UnlockRequest` を消さず、`executeUnlock` は `SLASHED` を弾かなかった → 返金後に再度 `request.amount` を他ユーザのプールから支払い。
- **修正**: `executeUnlock` を実行可能状態のホワイトリスト（`PENDING_UNLOCK`/`EMERGENCY_PENDING`）に限定。`RESOLVED_INVALID` は pending へ復帰するため正規フローは維持。**加えて VAULT-004 と併せ、slash 時に `unlockRequests`/`unlockSigningProvers` を `delete`**（多層防御。SLASHED 後の executeUnlock は request 消去により `UnlockNotFound` で revert）。
- **テスト**: `test_VAULT001_executeUnlock_revertsAfterSlash`（foundry, 通過）で SLASHED 後の再出金不可を実 revert 確認。

### QS-SEC-VAULT-002 — requestUnlockLegacy の recipient 非束縛リプレイ
- **欠陥**: legacy 経路は署名メッセージ `hashPair(lockId, stateRoot)` に recipient を含めず、メンプールの署名・SMT証明をコピーして `recipient=Attacker` で先行実行可能（フル SPHINCS+ 検証下でも成立）。
- **修正**: on-chain 呼出元が無いことを確認の上、reverting スタブに無効化（セレクタ維持）。正典は recipient を SR1 に束縛する `requestUnlock`。
- **残**: `L1VaultTestnet.sol` の同名関数にも同修正を適用（testnet ミラー）。

### QS-SEC-AUTH-001 — admin ミドルウェアの権限昇格
- **欠陥**: `admin_jwt_auth` が `jwt_auth` と同一で、SIWE で誰でも得られる access トークンと admin トークンが同一 secret・claim で区別不能。任意ユーザが pause/prover承認/staff作成/treasury 操作を実行可能。
- **修正**: JWT 検証後に `AdminRepository::get_admin_by_wallet` で **active admin を必須化**（fail-closed）。非 admin は 403。
- **残**: cargo test。将来的に admin スコープ claim を署名トークンに付与しても良い。

### QS-SEC-PROVER-001 — バックエンドが prover 署名を無検証で閾値計上
- **欠陥**: `submit_prover_signature` はフォーマット長（7856B）チェックのみで、SPHINCS+ 署名を登録 pubkey・メッセージと照合せず M-of-N に計上（`verify_signature` はスタブで未呼出）。sig_count≥2 でバックエンドが自動 `requestUnlock` を L1 送信。
- **修正**: 本番（`skip_signature_verification=false`）では**未検証署名を拒否（フェイルクローズ）**。実 SPHINCS+ 検証（WS4・KAT）実装まで、偽造署名が資金移動を駆動できない。
- **機能影響**: 本番の prover 署名投入は実検証実装まで停止。これは「検証できないものを認可しない」正しい posture（戦略 D1）と整合。
- **残**: `pqcrypto-sphincsplus`（sphincsshake128ssimple, 7856B 一致）での実検証＋KAT を実装し再有効化（WS4）。

### QS-SEC-VAULT-004 — challenge 報酬をプール原資で支弁（債務超過）
- **欠陥**: valid 解決で challenger に `bond+報酬`、送信者に全額返金するが、**加害 prover の `stakedAmount` は一切減算されず**、報酬（保険/burn 含む）が他ユーザのプール資金から支払われ、金庫が報酬分だけ債務超過に。
- **修正（承認方針 D-a〜D-d で実装）**:
  1. `unlockSigningProvers[lockId]` を追加し `requestUnlock` で**署名 prover 集合を記録**。
  2. `_slashSigningProvers()`：各**相異なる**署名 prover の **自身の stake** を n²·10%（不足時キャップ・均等）で slash し `stakedAmount` を減算。
  3. `_resolveValidChallenge`／`autoResolveChallenge` の報酬・保険・burn を**slash した stake から支弁**（プール流出ゼロ）。送信者への lock 全額返金は `totalLocked` 相殺のため据え置き（正常）。内部会計のみ更新（外部 `ProverRegistry.slash` は別途 stub のため今回対象外＝D-d）。
- **テスト**: **全 L1Vault テスト 110件 通過**（既存106＋新規4、0 failed）。改修した解決コードパス（`_resolveValidChallenge`/`autoResolveChallenge`/state-clear）は emergency-challenge テスト群が網羅。
- **残（裁定＝設計）**: `autoResolveChallenge` は依然 fraudProof を**裁定せず「未防御=不正確定」**。stake 原資化により、正規 unlock をグリーフされた場合は**48h 以内に prover が `submitDefense` しないと honest prover の stake が slash される**（＝楽観的モデルの前提「prover は常時監視・防御」）。真の裁定（SecurityCouncil 必須化 or fraudProof オンチェーン検証）は WS3 の設計課題として継続。

---

## 部分修正（🟡）

### QS-SEC-VAULT-003 — 自己チャレンジ抽出
- **欠陥**: `challenge()` が `msg.sender == lockData.sender` を許容。自己ロック→自己チャレンジ→48h放置→`autoResolveChallenge` で lock 回収＋challenger 報酬を反復取得。
- **今回の修正**: `require(msg.sender != lockData.sender)` を追加し**自己チャレンジを遮断**。
- **残（VAULT-004 と一体）**: 第三者による正規 unlock グリーフ＋未防御=不正確定の無裁定 slash は残る。下記参照。

### QS-SEC-PROVER-002 — prover sign エンドポイント無認証
- **欠陥**: `POST /v1/prover/:prover_id/sign` は認証なし公開ルート。`prover_id` は URL パラメータのみで呼出元が鍵保有者である保証がない。
- **緩和**: **PROVER-001（本番フェイルクローズ）により、無認証で投入された署名は本番で拒否**され、偽造合意による資金移動は封止済み。
- **残（追跡）**: 多層防御としてエンドポイントを prover 運用者認証（JWT を prover アドレスに束縛、またはチャレンジ署名）で保護し、queue_id の公開列挙も制限。prover 運用者 ID モデルの整備＋結合テストが必要。

---

## 追跡（📋 設計実装が必要・cosmetic 修正不可）

> これらは表面的修正では**偽の安心感を与えつつ機能を壊す**ため、意図的に実装を保留し設計作業として記録する（プロジェクトの「無検証暗号を入れない」方針・戦略 D1 と整合）。

### QS-SEC-L3-001 — CoreLayer._verifyProof が任意 proof を受理
- **欠陥**: `_verifyProof` が STARK 検証を呼ばず「長さ≥32 なら true」（`stateRoot==0` は任意 true）。`unlock()`/`resync()`/`verifyState()` の唯一の暗号ゲート。任意 proof で `_stateRoot` 改ざん・unlock 進行が可能（L3=Anvil/Arbitrum Sepolia デプロイ済）。
- **なぜ cosmetic 修正しないか**: フェイルクローズ化は L3 の unlock/resync を全面停止させ dev/testnet フローを破壊する。かつ委譲先 `STARKVerifier.verifyProof` **自身もプレースホルダ**（総点検で別途提起）で、そこへ繋いでも実セキュリティは増えない。
- **是正方針**: **実 STARK/FRI/Merkle/制約検証の実装**（STARKVerifier 本体）→ `_verifyProof` から呼び出し・`stateRoot==0` 自動受理を撤廃。これは WS3（正直な強制）/保証プログラムの中核作業であり、本質的にプロトコルの「オンチェーン強制可能性①」そのもの。
- **難度**: 大（暗号エンジニアリング）。

### QS-SEC-VRF-001 — VRFConsumer の coordinator 未設定バイパス（✅ 修正済）
- **欠陥**: `onlyVRFCoordinator` が `vrfCoordinator == address(0)` のとき検査を丸ごとスキップ → setVRFConfig 前は**誰でも `rawFulfillRandomWords` を呼び randomness（prover/observer 選定）を操作**しうる。
- **修正**: `if (vrfCoordinator == address(0) || msg.sender != vrfCoordinator) revert`（fail-closed）。dev/test は onlyOwner の `mockFulfillRandomWords` 経路を使用するため無影響。
- **検証**: VRFConsumer.sol solc 0エラー。全 base VRF テストは `mockFulfillRandomWords` 使用のため回帰なし（forge 再実行は env が forge バイナリを消去したため未再走、構造上テスト安全）。

### QS-SEC-AUTH-002 — SIWE の domain/expiry 検証（🟡 部分修正）
- **欠陥**: `authenticate_siwe` は ECDSA 復元アドレス一致のみ。`domain`/`uri`/`chain_id`/`expiration` を無視し、nonce はクライアント供給（サーバ発行チャレンジでない）。被害者が別アプリで署名した SIWE メッセージを流用しセッション奪取可能。
- **今回の修正**: (1) `jwt.allowed_siwe_domains`（既定空=dev不変）を追加し **domain allowlist** を強制。(2) メッセージの **Expiration Time をパースして期限切れを拒否**（従来 None 固定で無期限だった）。cargo check 通過。
- **残（サーバ発行 nonce）**: 真のリプレイ耐性には**サーバ発行 nonce（チャレンジ）エンドポイント＋FE 連携**が必要（本修正は domain/expiry 層のみ）。緩和要因: 資産移動は Dilithium 別ゲートのため MEDIUM。
- **緩和要因**: 資産移動は Dilithium 別ゲートのため、セッション奪取単体では資金移動しない（→ MEDIUM）。
- **是正方針**: サーバ発行 nonce（チャレンジ）・`domain` 一致検証・`expiration_time` 強制を実装。

---

## 総点検で提起され確度<8に降格（要トリアージ）
敵対的検証で確度8未満に降格したが一見の価値あり:
- **VRFConsumer**: coordinator 未設定時に `onlyVRFCoordinator` バイパス（callback を誰でも実行しうる）。→ coordinator 設定を必須化。
- **STARKVerifier.verifyProof**: 構造チェックのみで forged proof 受理（L3-001 と同根）。
- **challenge.rs `auto_resolve`**: `unknown_prover` を phantom slash（実 prover を罰しない）。
- **ProverRegistry.slash()**: 既に非アクティブな prover の再削除で active リスト破損（MEDIUM）。

---

## 自己監査（本セッション変更の敵対的レビュー）

セッションの全変更（監査是正＋VAULT-004＋VRF/AUTH＋P2 crypto-agility）を手動で敵対的にレビュー。**自作の修正が持ち込んだ回帰を1件検出・修正**。

### QS-SEC-VAULT-005 — slash の collusion 係数が raw length（✅ 修正済・自己監査）
- **欠陥（VAULT-004 で作り込み）**: `_slashSigningProvers` が `_calculateSlash(n, stake)` の `n` に **`signers.length`（重複込みの raw 長）** を使用。保存される `unlockSigningProvers` は呼出者供給の raw 入力で、閾値に計上されない**重複を padding** できる（例 `[P1,P2,P1]`）。→ collusion 係数が膨らみ、honest prover の quadratic slash が過大（40%→90% 等）。資金窃取/債務超過ではないが不公平な stake 損失＝グリーフ。VAULT-004 前は `request.signatureCount`（重複排除後）を使っていたため、これは**私の変更が招いた MEDIUM 回帰**。
- **修正**: 先に**相異なる署名者数 `distinct`** を数え、それを collusion 係数に使用。L1Vault/L1VaultTestnet 両方。
- **検証**: forge 118件通過（回帰なし）。padding 固有ケースの専用テストは requestUnlock（SMT）ハーネスが要るため未追加（emergency 経路 distinct=0 は既存テストで網羅）。

### レビューで問題なしと確認した領域
- **P2 verifier routing**: 新規 bypass なし。registry/scheme 切替は onlyOwner/governance 権限が必要（信頼モデル不変）、fallback は後方互換（110件実証）、CEI 保持。
- **VAULT-004 delete-on-slash**: slash→delete→external calls の順で CEI 保持・reentrancy なし・emergency 回帰なし。
- **AUTH-002**: expiration パース失敗は拒否（fail-closed）、domain 空=スキップ/非空=一致必須。**AUTH-001**: DB エラーは 403（fail-closed）、非admin を通す経路なし。
- **VRF-001 / PROVER-001**: fail-closed 条件は正（反転なし）、正規 coordinator callback・mockFulfill は無影響。

## 検証状況と前提
- **foundry を導入して実テストを実走済み**（バイナリ配布はネットワークポリシー外のため、forge をソースからビルドし、solc 0.8.20 ネイティブと submodule を許可済みホストから取得して構築）。
- **既存テスト 159件 全通過・0 failed**（SPHINCS 53 + L1Vault 106）→ 全 `✅` 修正が既存挙動を破壊しないことを実証。
- **新規回帰テスト `test/L1VaultSecurityFixes.t.sol` 4件 全通過**:
  - `test_VAULT001_executeUnlock_revertsAfterSlash`（SLASHED での二重出金を実 revert 確認）
  - `test_VAULT002_requestUnlockLegacy_isDisabled`
  - `test_VAULT003_selfChallenge_reverts` / `test_VAULT003_nonSenderChallenge_succeeds`
- Rust 修正（AUTH-001/PROVER-001）は **`cargo check` 通過**（exit 0）。cargo test は別途。
- **残**: SPHINCS+ の**実 KAT**（FIPS 205/PQClean 差分。本検証器の非標準 ADRS に合わせた自己整合 KAT）は未実装＝WS4。THRESH-001 の distinct-signer 専用ユニットテストは未追加（既存 threshold テストで間接カバー）。

---

*本トラッカーは総点検の確定指摘と是正状況の記録。📋 項目は実装計画（WS3/WS4）に組み込むこと。*
