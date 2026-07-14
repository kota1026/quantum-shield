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
| QS-SEC-VAULT-004 | HIGH | `L1Vault.sol` challenge 会計 | 報酬をプール原資で支弁→債務超過 | 📋 追跡（stake原資化） |
| QS-SEC-L3-001 | HIGH | `l3/.../CoreLayer.sol` _verifyProof | proof 無検証受理 | 📋 追跡（実STARK検証） |
| QS-SEC-AUTH-001 | HIGH | `middleware.rs` admin_jwt_auth | 権限昇格（任意ユーザ→admin） | ✅ 修正済 |
| QS-SEC-PROVER-001 | HIGH | `services/mod.rs` submit_prover_signature | 署名無検証で計上 | ✅ 修正済（本番フェイルクローズ） |
| QS-SEC-PROVER-002 | HIGH | `routes/prover.rs` sign エンドポイント | 呼出元無認証 | 🟡 緩和（PROVER-001で資金影響封止） |
| QS-SEC-AUTH-002 | MEDIUM | `auth_service.rs` authenticate_siwe | SIWE domain/expiry/nonce 未検証 | 📋 追跡 |

関連（本セッションで既修正）: **QS-SEC-SPHINCS-001**（Merkle index、✅）、**QS-SEC-THRESH-001**（distinct-signer、✅）。既知未修正: **QS-SEC-THRESH-002**（`_verifySimplified` 暗号検証なし）。

---

## 修正済み（✅）

### QS-SEC-VAULT-001 — executeUnlock の SLASHED 二重出金
- **欠陥**: Challenge が valid 解決で lock を `SLASHED`＋送信者へ全額返金するが `UnlockRequest` を消さず、`executeUnlock` は `SLASHED` を弾かなかった → 返金後に再度 `request.amount` を他ユーザのプールから支払い。
- **修正**: `executeUnlock` を実行可能状態のホワイトリスト（`PENDING_UNLOCK`/`EMERGENCY_PENDING`）に限定。`RESOLVED_INVALID` は pending へ復帰するため正規フローは維持。
- **残**: 防御多重化として slash 時に `UnlockRequest`/`Challenge` をクリア（VAULT-004 と併せて実施）。foundry テスト必須。

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

### QS-SEC-VAULT-004 — challenge 報酬をプール原資で支弁（債務超過）＋無裁定 slash
- **欠陥**: valid 解決で challenger に `bond+報酬`、送信者に全額返金するが、**加害 prover の `stakedAmount` は一切減算されない**。報酬（sigCount≥2 で lock の24%）は他ユーザのプール資金から支払われ、金庫が報酬分だけ債務超過に。加えて `autoResolveChallenge` は fraudProof を検証せず未防御=不正確定と扱う（無裁定）。
- **是正方針**:
  1. **署名 prover 集合を UnlockRequest に記録**（現状は `signatureCount` のみ）。
  2. slashing 報酬・保険・burn を**加害 prover の stake（`ProverRegistry` 連携）から支弁**し、プール残高から払わない。
  3. `autoResolveChallenge` の「未防御=不正確定」を再設計（bond 返却/PENDING 復帰、または SecurityCouncil 裁定必須）。fraudProof をオンチェーン検証。
- **難度**: 中〜大（Prover 構造・_createUnlockRequest・ProverRegistry slash フックに波及）。VAULT-001 の状態クリアも本作業で。

### QS-SEC-L3-001 — CoreLayer._verifyProof が任意 proof を受理
- **欠陥**: `_verifyProof` が STARK 検証を呼ばず「長さ≥32 なら true」（`stateRoot==0` は任意 true）。`unlock()`/`resync()`/`verifyState()` の唯一の暗号ゲート。任意 proof で `_stateRoot` 改ざん・unlock 進行が可能（L3=Anvil/Arbitrum Sepolia デプロイ済）。
- **なぜ cosmetic 修正しないか**: フェイルクローズ化は L3 の unlock/resync を全面停止させ dev/testnet フローを破壊する。かつ委譲先 `STARKVerifier.verifyProof` **自身もプレースホルダ**（総点検で別途提起）で、そこへ繋いでも実セキュリティは増えない。
- **是正方針**: **実 STARK/FRI/Merkle/制約検証の実装**（STARKVerifier 本体）→ `_verifyProof` から呼び出し・`stateRoot==0` 自動受理を撤廃。これは WS3（正直な強制）/保証プログラムの中核作業であり、本質的にプロトコルの「オンチェーン強制可能性①」そのもの。
- **難度**: 大（暗号エンジニアリング）。

### QS-SEC-AUTH-002 — SIWE が domain/expiry/サーバ nonce を未検証（境界・MEDIUM）
- **欠陥**: `authenticate_siwe` は ECDSA 復元アドレス一致のみ。`domain`/`uri`/`chain_id`/`expiration` を無視し、nonce はクライアント供給（サーバ発行チャレンジでない）。被害者が別アプリで署名した SIWE メッセージを流用しセッション奪取可能。
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

## 検証状況と前提
- Solidity 修正（VAULT-001/002/003）は **solc 0.8.20 で 0 エラー**（OZ は未初期化サブモジュールのためローカルスタブで解決）。
- Rust 修正（AUTH-001/PROVER-001）は **`cargo check` で検証**（本コミットに結果反映）。
- **foundry テスト・実 KAT・cargo test は allowlist 追加後に必須**。特に VAULT-001/003 の状態機械はユニットテストで回帰確認すること（`[SLASHED]→executeUnlock revert`、`self-challenge revert`、`[P1,P2]→2` 等）。

---

*本トラッカーは総点検の確定指摘と是正状況の記録。📋 項目は実装計画（WS3/WS4）に組み込むこと。*
