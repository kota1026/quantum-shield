# R-1 実行 Runbook: Sepolia 新 Vault デプロイ (Option B)

> **Created**: 2026-07-24
> **Updated**: 2026-07-26 — Step 0 オンチェーン確認完了、方針を「テスト資金ドレイン + クリーン Option B」に確定
> **Status**: 承認済み・実行中 (Step 0 完了 / Step 1 デプロイ待ち)
> **Parent**: `ONCHAIN_TRUST_MECHANISM_REQUIREMENTS.md` §12 (R-1 分析)
> **Blocker**: リモート実行環境からは Sepolia RPC への egress がプロキシで遮断され (403)、`QS__L1_PRIVATE_KEY` も未設定のため、デプロイ tx はローカル環境から実行する必要がある

## 前提

- デプロイヤー: `0xe69BB031877Cdf6c001BdAEDC0A615B40484CDC3`（Sepolia 残高 ~0.39 ETH — 要事前確認）
- Foundry がインストール済みで、`src/l1/contracts` がビルド可能なこと
- Phase 2 版 L1Vault（簡易経路なし・verifier 必須・FR-GOV-2 ガバナンス）= PR #201 マージ後の `main` 相当ブランチを使用

## Step 0: 現行 Vault アドレスの確定 — ✅ 完了 (2026-07-26)

オンチェーン照会（Sepolia）の結果:

| アドレス | code | owner | getSPHINCSVerifier | isFullVerificationEnabled | totalLocked | 判定 |
|---|:--:|---|:--:|:--:|--:|---|
| `0x07012aeF…7260` (blockchain.md) | あり | `0xe69B…CDC3` | `0x0`（未設定） | **false** | **5.55 ETH** | **canonical / 実稼働 Vault** |
| `0x6F889C00…1c67` (SEQUENCES.md 他) | あり | `0xe69B…CDC3` | `0x0` | — | 0 相当 | 旧・空デプロイ（記録のみ残存） |

**確定事項**:
1. **実資金 (5.55 ETH) が載る canonical Vault = `0x07012aeF…7260`**。`blockchain.md` が正、`SEQUENCES.md` / `sepolia.json` / `ConfigureVaultAndProvers.s.sol` / `AUTO_CLAIM_SERVICE.md` の `0x6F889C00…1c67` は stale（Step 4 で一貫修正）。
2. 両 Vault とも **owner = デプロイヤー `0xe69B…CDC3`**（＝実行者が全権）。
3. canonical Vault は **verifier 未設定・full 検証 false** → 5.55 ETH は現在 **簡易経路（恒真チェック）のみで保護**されている（Phase 2 が塞ぐ穴が実資金上で露出）。
4. **オーナー判断: 5.55 ETH はテスト資金** → 既存 Vault へのフル検証有効化（ブリックリスクあり）は行わず、**旧 Vault をドレイン（Step 0.5）してから Phase 2 版の新 Vault をクリーンにデプロイ（Option B）** する方針に確定。

## Step 0.5: 旧 Vault のドレイン（テスト資金の回収）

canonical Vault (`0x07012aeF…7260`) は簡易経路（verifier 未設定）で動作し、owner = 実行者。以下でロック済みテスト資金を回収する。**Normal 経路は 24h タイムロックがある**点に注意（Emergency 経路は 7d でより長い）。

```bash
export VAULT=0x07012aeF87C6E423c32F2f8eaF81762f63337260
# 1) active prover を 2 つ取得（簡易経路は「active prover から出た任意の署名バイト列」を有効と数える）
cast call $VAULT "activeProvers(uint256)(address)" 0 --rpc-url $RPC
cast call $VAULT "activeProvers(uint256)(address)" 1 --rpc-url $RPC
# 2) 回収対象 lockId を列挙（Locked イベント。<deployBlock> はデプロイ時のブロック）
cast logs --rpc-url $RPC --address $VAULT \
  "Locked(bytes32,address,address,uint256,bytes32,bytes32)" --from-block <deployBlock> | grep -A2 topics
# 3) 各 lockId について Unlock 要求（SMT proof は空、root=lockId で通過する簡易構造）
cast send $VAULT "requestUnlockLegacy(bytes32,address,bytes32[],bytes32,bytes[],address[])" \
  <lockId> <recipient> "[]" <lockId> "[0xdead01,0xdead02]" "[<prover0>,<prover1>]" \
  --rpc-url $RPC --private-key $PRIVATE_KEY
# 4) 24h 後に確定
cast send $VAULT "executeUnlock(bytes32)" <lockId> --rpc-url $RPC --private-key $PRIVATE_KEY
```

> **代替（テストネット割り切り）**: 5.55 ETH は実行者管理下のテスト ETH のため、厳密なドレインに拘らず「旧 Vault を放棄扱いにして新 Vault へ移行」でも可。ドレインは露出をゼロにするための任意工程。

## Step 1: デプロイ

```bash
cd src/l1/contracts
export PRIVATE_KEY=<deployer key hex>
export SECURITY_COUNCIL=<council multisig or deployer for testnet>

# SPHINCSVerifier + L1Vault (Phase 2) を一括デプロイ
forge script script/DeployL1Vault.s.sol --rpc-url $RPC --broadcast --via-ir
```

出力された `SPHINCSVerifier` / `L1Vault` アドレスを控える。

## Step 2: Prover 登録 + Registry 接続

```bash
export VAULT=<new L1Vault address>
cast send $VAULT "registerProver(address,bytes)" <prover1> <32byte-sphincs-pubkey> --value 1ether --rpc-url $RPC --private-key $PRIVATE_KEY
cast send $VAULT "registerProver(address,bytes)" <prover2> <32byte-sphincs-pubkey> --value 1ether --rpc-url $RPC --private-key $PRIVATE_KEY
# 既存 ProverRegistry を使う場合:
cast send $VAULT "setProverRegistry(address)" 0x08e1fc1A0d614bc132B48950760c7A291cCB8946 --rpc-url $RPC --private-key $PRIVATE_KEY
```

## Step 3: 受け入れ基準 3/4 の証跡取得

```bash
# (a) lock 成功 tx
cast send $VAULT "lock(address,bytes)" <recipient> <dilithium-pubkey-bytes> --value 0.01ether --rpc-url $RPC --private-key $PRIVATE_KEY

# (b) 不正署名での requestUnlockLegacy → InsufficientSignatures revert の実 tx
#     (フル SPHINCS+ 検証がデタラメ署名を拒否することのオンチェーン証跡)
cast send $VAULT "requestUnlockLegacy(bytes32,address,bytes32[],bytes32,bytes[],address[])" \
  <lockId> <recipient> "[]" <lockId> "[0xdeadbeef01,0xdeadbeef02]" "[<prover1>,<prover2>]" \
  --rpc-url $RPC --private-key $PRIVATE_KEY
# → revert することを確認し、tx hash (失敗 tx) を記録

# (c) 検証強制が恒久であることの確認 (受け入れ基準 4)
cast call $VAULT "isFullVerificationEnabled()(bool)" --rpc-url $RPC   # → true
# setFullVerification(bool) が ABI に存在しないことを新 Vault の ABI で確認
```

## Step 4: ドキュメント / 設定更新（新 Vault アドレス確定後に一括実施）

新 Vault デプロイで `<newVault>` が確定したら、以下を **1 つのコミットで一貫**させる（現状 stale な `0x6F889C00…1c67` 参照も同時に是正）:

1. `.claude/rules/blockchain.md`: L1 Vault を `<newVault>` に更新、`0x07012aeF…7260` を「legacy (unlock-only, drained)」として残置注記
2. `docs/core/SEQUENCES.md` (L85): `0x6F889C00…1c67` → `<newVault>`（stale 修正 + 新 Vault 反映）
3. `src/l1/deployments/sepolia.json` (L18): `l1Vault` を `<newVault>` に
4. `src/l1/contracts/script/ConfigureVaultAndProvers.s.sol` (L12): `L1_VAULT` を `<newVault>` に
5. `docs/architecture/AUTO_CLAIM_SERVICE.md` (L263): `vault_address` を `<newVault>` に
6. `src/api/api/config/default.yaml`: `l1.vault_address` を `<newVault>` へ
7. フロントエンド env (`NEXT_PUBLIC_*`) のアドレス更新
8. `docs/ACTUAL_STATE.md`: 移行記録 + Step 0.5 ドレイン tx + Step 3 の tx hash（成功 tx と revert tx の両方）を追記
9. `ONCHAIN_TRUST_MECHANISM_REQUIREMENTS.md` §10: 受け入れ基準 3/4 を 🟢 に更新

> `<newVault>` と各 tx hash を貼ってもらえれば、この 9 項目の一貫修正コミットは当方で作成可能。

## ロールバック

新 Vault は新規 Lock のみが対象で、旧 Vault の資産・Unlock 経路には一切触れないため、問題発生時は設定を旧アドレスに戻すだけでよい（資産移動なし = ロールバック安全）。
