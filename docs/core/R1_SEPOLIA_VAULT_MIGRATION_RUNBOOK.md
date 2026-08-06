# R-1 実行 Runbook: Sepolia 新 Vault デプロイ (Option B)

> **Created**: 2026-07-24
> **Status**: ✅ **実行済み (2026-08-06)** — 全 Step 完了。デプロイアドレス・証跡 tx は `docs/ACTUAL_STATE.md`「R-1: Sepolia Phase 2 Vault 移行記録」参照。新 Vault: `0x52890ff94965a819Ed10d721890161d2ce0D2A2a`
> **Parent**: `ONCHAIN_TRUST_MECHANISM_REQUIREMENTS.md` §12 (R-1 分析)
> **Blocker**: リモート実行環境からは Sepolia RPC への egress がプロキシで遮断され (403)、`QS__L1_PRIVATE_KEY` も未設定のため、デプロイ tx はローカル環境から実行する必要がある

## 前提

- デプロイヤー: `0xe69BB031877Cdf6c001BdAEDC0A615B40484CDC3`（Sepolia 残高 ~0.39 ETH — 要事前確認）
- Foundry がインストール済みで、`src/l1/contracts` がビルド可能なこと
- Phase 2 版 L1Vault（簡易経路なし・verifier 必須・FR-GOV-2 ガバナンス）= PR #201 マージ後の `main` 相当ブランチを使用

## Step 0: 現行 Vault アドレスの確定（ドキュメント不一致の解消）

`blockchain.md` (`0x07012aeF87C6E423c32F2f8eaF81762f63337260`) と `SEQUENCES.md` (`0x6F889C00a5e674ab0b9403AfBa0fBEbe30511c67`) が不一致。両方を照会し、コードが存在し `totalLocked > 0` の方を legacy Vault と確定する:

```bash
export RPC=https://ethereum-sepolia-rpc.publicnode.com   # または任意の Sepolia RPC
cast code 0x07012aeF87C6E423c32F2f8eaF81762f63337260 --rpc-url $RPC | head -c 20
cast call 0x07012aeF87C6E423c32F2f8eaF81762f63337260 "totalLocked()(uint256)" --rpc-url $RPC
cast code 0x6F889C00a5e674ab0b9403AfBa0fBEbe30511c67 --rpc-url $RPC | head -c 20
cast call 0x6F889C00a5e674ab0b9403AfBa0fBEbe30511c67 "totalLocked()(uint256)" --rpc-url $RPC
```

確定した方を `blockchain.md` / `SEQUENCES.md` の両方に「legacy (unlock-only)」として記載する。

> **Step 0 実施結果 (2026-08-06)**:
> - 稼働中 Vault = `0x07012aeF87C6E423c32F2f8eaF81762f63337260`（blockchain.md 側が正。totalLocked = **5.55 ETH** — 本書冒頭の「~0.18 ETH」想定より多い）。`0x6F889C00...511c67` はコード有・totalLocked 0 の未使用デプロイ。SEQUENCES.md を修正済み
> - デプロイヤー残高 = **0.0327 ETH**（想定 ~0.39 ETH と乖離）。デプロイ見積 9.26M gas ≈ 0.020 ETH（2.18 gwei 時点、forge ドライラン実測）で実行自体は可能だが余裕僅少 → **faucet 補充後に Step 1 実行**の方針。Step 2 はステーク不要の `registerProverTestnet` を使用し、Step 3 の lock は 0.001 ETH に減額する

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

## Step 4: ドキュメント / 設定更新

1. `.claude/rules/blockchain.md`: 新 Vault + SPHINCSVerifier アドレスに更新、旧 Vault を「legacy (unlock-only)」として残置
2. `src/api/api/config/default.yaml`: `l1.vault_address` を新アドレスへ
3. フロントエンド env (`NEXT_PUBLIC_*`) のアドレス更新
4. `docs/ACTUAL_STATE.md`: 移行記録 + Step 3 の tx hash（成功 tx と revert tx の両方）を追記
5. `ONCHAIN_TRUST_MECHANISM_REQUIREMENTS.md` §10: 受け入れ基準 3/4 を 🟢 に更新

## ロールバック

新 Vault は新規 Lock のみが対象で、旧 Vault の資産・Unlock 経路には一切触れないため、問題発生時は設定を旧アドレスに戻すだけでよい（資産移動なし = ロールバック安全）。
