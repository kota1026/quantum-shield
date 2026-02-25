# Quantum Shield L3 - Sequence Catalog v3.0

> **Document Version**: 3.0
> **Last Updated**: 2026-02-24
> **Total Sequences**: 9 + 1 (補助)

---

## System Architecture v3.0

### 設計原則

| 原則 | 説明 |
|:-----|:-----|
| **関心の分離** | 資産管理(Vault)とProver管理(Registry)を分離 |
| **Vault不変性** | L1 Vaultは再デプロイ不要、Immutable |
| **動的Prover参加** | N個のProverが自由に参加・退出可能 |
| **Auto-claim** | 24h後に自動でClaim実行、ユーザー操作不要 |

### コントラクト構成

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ L1 (Ethereum)                                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌───────────────────┐              ┌───────────────────┐                   │
│  │    L1 Vault       │              │  Prover Registry  │                   │
│  │   (Immutable)     │──参照───────►│   (Immutable)     │                   │
│  │                   │              │                   │                   │
│  │ • ETH Lock        │              │ • Prover登録      │                   │
│  │ • ETH Unlock      │              │ • Stake管理       │                   │
│  │ • ETH Release     │              │ • 公開鍵保持      │                   │
│  │                   │              │ • Slashing        │                   │
│  │ 署名検証時:       │              │                   │                   │
│  │ registry.getPubKey│              │ getActiveProvers()│                   │
│  └─────────┬─────────┘              └─────────┬─────────┘                   │
│            │                                  │                             │
│            │ Events                           │ Events                      │
│            ▼                                  ▼                             │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │                    Auto-Claim Service                        │           │
│  │                    (Off-chain Bot)                           │           │
│  │                                                               │           │
│  │  • UnlockRequested Event監視                                  │           │
│  │  • 24h後に自動でexecuteUnlock()呼び出し                       │           │
│  │  • ガス代: Protocol Treasury負担                              │           │
│  └───────────────────────────────────────────────────────────────┘           │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
                                      ▲
                                      │ State Root / 署名
                                      │
┌───────────────────────────────────────────────────────────────────────────────┐
│ L3 Aegis (Off-chain Processing)                                               │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                           Core Layer (BFT 4-node)                        │ │
│  │  • Dilithium署名検証 (off-chain、ガス不要)                               │ │
│  │  • State Root計算 (SHA3-256)                                             │ │
│  │  • VRF Prover選出                                                        │ │
│  │  • Registry同期 (L1から読み取り)                                         │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                      │ 署名要求                               │
│                                      ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────────┐│
│  │                         Prover Pool (動的参加)                            ││
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐       ┌──────────┐           ││
│  │   │Prover 1  │  │Prover 2  │  │Prover 3  │  ...  │Prover N  │           ││
│  │   │(AI/Human)│  │(AI/Human)│  │(AI/Human)│       │(AI/Human)│           ││
│  │   │SPHINCS+  │  │SPHINCS+  │  │SPHINCS+  │       │SPHINCS+  │           ││
│  │   └──────────┘  └──────────┘  └──────────┘       └──────────┘           ││
│  │                                                                           ││
│  │   登録: L1 Registry経由 (Stake + 公開鍵)                                  ││
│  │   退出: L1 Registry経由 (7日 Unbonding)                                   ││
│  └───────────────────────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────────────────────┘
```

### コントラクトアドレス (Sepolia)

| Contract | Address | 役割 |
|:---------|:--------|:-----|
| L1 Vault | `0x6F889C00a5e674ab0b9403AfBa0fBEbe30511c67` | 資産Lock/Unlock |
| Prover Registry | (TBD - 新規デプロイ予定) | Prover管理 |
| SPHINCS Verifier | `0xD090b5A627d9bd6D96a8b5f6F504ebCa79980103` | 署名検証 |

---

## Sequence Overview

| # | Sequence | Category | Applicable Phase |
|---|----------|----------|-----------------|
| 1 | Lock | User Flow | All |
| 2 | Unlock (Normal Path) | User Flow | All |
| 3 | Unlock (Emergency Path) | User Flow | All |
| 3' | Resync | User Flow (補助) | All |
| 4 | Challenge + Slashing | Security Flow | All |
| 5 | Prover Registration | Prover Management | Phase 1-3 |
| 6 | Prover Exit | Prover Management | Phase 1-3 |
| 7 | Governance Proposal | Governance Flow | Phase 3-4 |
| 8 | Emergency Pause & Recovery | Governance Flow | Phase 2-4 |
| 9 | Token Hub (veQS) | Token Economy | Phase 3-4 |

---

## Sequence #1: Lock

### 概要

| 項目 | 内容 |
|------|------|
| 目的 | ユーザーがL1 Vaultに資産をロックする |
| 参加者 | User, L3 Aegis (4node), L1 Vault |
| Prover署名 | 不要 |
| Gas | ~135K gas (~$7) |

### データ構造

```
Lock Request:
{
  chain_id: uint256,        // 送金先チェーンID
  asset: address,           // 資産コントラクトアドレス
  amount: uint256,          // 金額
  dest_addr: bytes,         // 送金先アドレス
  expiry: uint256,          // 有効期限（Unix timestamp）
  nonce: uint256,           // リプレイ防止
  pk_dilithium: bytes,      // ユーザーDilithium公開鍵
  sig_dilithium: bytes      // ユーザーDilithium署名
}

SR_0 (State Root):
SR_0 = SHA3-256(
  "QS_LOCK_V1" ||
  chain_id ||
  asset ||
  amount ||
  dest_addr ||
  expiry ||
  nonce ||
  pk_dilithium
)
```

### シーケンス図

```
User                      L3 Aegis (4node)                   L1 Vault
  │                            │                                │
  │                            │                                │
  │──(1) Lock Request─────────►│                                │
  │   {chain_id,               │                                │
  │    asset,                  │                                │
  │    amount,                 │                                │
  │    dest_addr,              │                                │
  │    expiry,                 │                                │
  │    nonce,                  │                                │
  │    pk_dilithium,           │                                │
  │    sig_dilithium}          │                                │
  │                            │                                │
  │                      ┌─────┴─────┐                          │
  │                      │ 4ノード   │                          │
  │                      │ BFT合意   │                          │
  │                      │           │                          │
  │                      │ Dilithium │                          │
  │                      │ 検証 ✅    │                          │
  │                      │           │                          │
  │                      │ nonce ✅   │                          │
  │                      │ expiry ✅  │                          │
  │                      │           │                          │
  │                      │ SR_0計算  │                          │
  │                      │ SMT追加   │                          │
  │                      │ lock_id   │                          │
  │                      │ 発行      │                          │
  │                      └─────┬─────┘                          │
  │                            │                                │
  │◄──(2) Lock承認─────────────│                                │
  │   {lock_id,                │                                │
  │    SR_0,                   │                                │
  │    SMT_proof}              │                                │
  │                            │                                │
  │──(3) Deposit───────────────────────────────────────────────►│
  │   {lock_id,                │                          ┌─────┴─────┐
  │    SR_0,                   │                          │ lock_id   │
  │    asset,                  │                          │ 検証      │
  │    amount}                 │                          │           │
  │                            │                          │ SR_0記録  │
  │   + ERC20 Transfer         │                          │           │
  │                            │                          │ 資産受領  │
  │                            │                          │ (~135K)   │
  │                            │                          │           │
  │                            │                          │ Event:    │
  │                            │                          │ Locked    │
  │                            │                          └─────┬─────┘
  │                            │                                │
  │◄──(4) Lock確定─────────────────────────────────────────────│
  │   {lock_id,                │                                │
  │    tx_hash}                │                                │
  │                            │                                │
  │                            │◄──(5) 同期通知────────────────│
  │                            │   {lock_id, confirmed}         │
  │                            │                                │
  │                      ┌─────┴─────┐                          │
  │                      │ Lock確定  │                          │
  │                      │ 記録      │                          │
  │                      └───────────┘                          │
```

### ステップ詳細

| Step | 送信元 | 送信先 | 内容 |
|------|--------|--------|------|
| 1 | User | L3 | Lock Request + Dilithium署名 |
| 2 | L3 | User | lock_id, SR_0, SMT_proof |
| 3 | User | L1 | Deposit + ERC20 Transfer |
| 4 | L1 | User | Lock確定通知 |
| 5 | L1 | L3 | 同期通知（Event経由） |

### エラーハンドリング

| エラー | 原因 | 対応 |
|--------|------|------|
| Dilithium検証失敗 | 署名不正 | リクエスト却下 |
| nonce重複 | リプレイ攻撃 | リクエスト却下 |
| expiry超過 | 期限切れ | リクエスト却下 |
| (5)同期失敗 | 通信障害 | Sequence #3' Resync |

---

## Sequence #2: Unlock (Normal Path) + Auto-Claim

### 概要

| 項目 | 内容 |
|------|------|
| 目的 | ユーザーがロック済み資産を引き出す |
| 参加者 | User, L3 Aegis, Chainlink VRF, Prover (N社), L1 Vault, **Auto-Claim Service** |
| Prover署名 | SPHINCS+ 2/N 必要 (Registryから動的取得) |
| Time Lock | 24時間 |
| **Auto-Claim** | **24h後に自動実行（ユーザー操作不要）** |
| Gas | ~490K gas (~$27) - Protocol Treasury負担 |

### データ構造

```
Unlock Request:
{
  chain_id: uint256,
  lock_id: bytes32,
  dest_addr: bytes,
  amount: uint256,
  expiry: uint256,
  nonce: uint256,
  sig_dilithium: bytes
}

SR_1 (State Root after Unlock):
SR_1 = SHA3-256(
  "QS_UNLOCK_V1" ||
  SR_0 ||
  lock_id ||
  dest_addr ||
  amount ||
  nonce
)
```

### シーケンス図

```
User              L3 Aegis (4node)   VRF      Prover (N社)     L1 Vault      Auto-Claim     監視ボット
  │                    │              │            │              │              │              │
  │──(1) Unlock Req───►│              │            │              │              │              │
  │   {chain_id,       │              │            │              │              │              │
  │    lock_id,        │              │            │              │              │              │
  │    dest_addr,      │              │            │              │              │              │
  │    amount,         │              │            │              │              │              │
  │    expiry,         │              │            │              │              │              │
  │    nonce,          │              │            │              │              │              │
  │    sig_dilithium}  │              │            │              │              │              │
  │                    │              │            │              │              │              │
  │              ┌─────┴─────┐        │            │              │              │              │
  │              │ 4ノード   │        │            │              │              │              │
  │              │ BFT合意   │        │            │              │              │              │
  │              │           │        │            │              │              │              │
  │              │ Dilithium │        │            │              │              │              │
  │              │ 検証 ✅    │        │            │              │              │              │
  │              │           │        │            │              │              │              │
  │              │ SR_1計算  │        │            │              │              │              │
  │              │ SMT更新   │        │            │              │              │              │
  │              │           │        │            │              │              │              │
  │              │ Registry  │        │            │              │              │              │
  │              │ 参照 ✅    │        │            │              │              │              │
  │              └─────┬─────┘        │            │              │              │              │
  │                    │              │            │              │              │              │
  │                    │──(2) VRF────►│            │              │              │              │
  │                    │              │            │              │              │              │
  │                    │◄──(3) seed───│            │              │              │              │
  │                    │              │            │              │              │              │
  │              ┌─────┴─────┐        │            │              │              │              │
  │              │ Prover    │        │            │              │              │              │
  │              │ 選出 (2/N)│        │  ★Registry│              │              │              │
  │              │           │        │   から取得 │              │              │              │
  │              │ P(i) =    │        │            │              │              │              │
  │              │ Stake_i / │        │            │              │              │              │
  │              │ Σ Stake   │        │            │              │              │              │
  │              └─────┬─────┘        │            │              │              │              │
  │                    │              │            │              │              │              │
  │                    │──(4) 署名要求───────────►│              │              │              │
  │                    │   {unlock_data,          │              │              │              │
  │                    │    SR_0, SR_1}           │              │              │              │
  │                    │              │      ┌─────┴─────┐        │              │              │
  │                    │              │      │ SPHINCS+  │        │              │              │
  │                    │              │      │ 署名生成  │        │              │              │
  │                    │              │      │ (各8KB)   │        │              │              │
  │                    │              │      └─────┬─────┘        │              │              │
  │                    │              │            │              │              │              │
  │                    │◄──(5) 2×SPHINCS+─────────│              │              │              │
  │                    │   {sig_A, sig_B}         │              │              │              │
  │                    │              │            │              │              │              │
  │◄──(6) 署名完了─────│              │            │              │              │              │
  │   {unlock_id,      │              │            │              │              │              │
  │    sigs_ready}     │              │            │              │              │              │
  │                    │              │            │              │              │              │
  │──(7) Submit Unlock─────────────────────────────────────────►│              │              │
  │   {lock_id,        │              │            │        ┌─────┴─────┐        │              │
  │    SR_0, SR_1,     │              │            │        │ Registry  │        │              │
  │    SMT_proof,      │              │            │        │ から公開鍵│        │              │
  │    unlock_data,    │              │            │        │ 取得      │        │              │
  │    2×SPHINCS+}     │              │            │        │           │        │              │
  │                    │              │            │        │ SPHINCS+  │        │              │
  │                    │              │            │        │ 検証×2    │        │              │
  │                    │              │            │        │ (~400K)   │        │              │
  │                    │              │            │        │           │        │              │
  │                    │              │            │        │ 24h LOCK  │        │              │
  │                    │              │            │        │ 開始      │        │              │
  │                    │              │            │        └─────┬─────┘        │              │
  │                    │              │            │              │              │              │
  │◄──(8) Pending──────────────────────────────────────────────│              │              │
  │   {unlock_id,      │              │            │              │──(9) 登録───►│              │
  │    release_time}   │              │            │              │   {lockId,   │              │
  │                    │              │            │              │    releaseAt}│──(10) 監視──►│
  │                    │              │            │              │              │              │
  │  ★ユーザーは      │              │            │              │              │        ┌─────┴─────┐
  │    ここで完了     │              │            │              │              │        │ 24h監視   │
  │    （Claim不要）  │              │            │              │              │        │ Challenge │
  │                    │              │            │              │              │        │ 検知      │
  │                    │              │            │              │              │        └─────┬─────┘
  │                    │              │            │   [24h経過]  │              │              │
  │                    │              │            │   [Challenge無し]           │              │
  │                    │              │            │              │              │              │
  │                    │              │            │              │◄─(11) Auto──│              │
  │                    │              │            │              │    Claim     │              │
  │                    │              │            │        ┌─────┴─────┐        │              │
  │                    │              │            │        │ Time Lock │        │              │
  │                    │              │            │        │ 完了確認  │        │              │
  │                    │              │            │        │           │        │              │
  │                    │              │            │        │ 資産送金  │        │              │
  │                    │              │            │        └─────┬─────┘        │              │
  │                    │              │            │              │              │              │
  │◄──(12) Release─────────────────────────────────────────────│              │              │
  │   {amount} ETH     │              │            │              │              │              │
  │                    │              │            │              │              │              │
  │                    │◄──(13) 完了通知───────────────────────│              │              │
  │                    │   {lock_id, released}    │              │              │              │
```

### Auto-Claim Service 仕様

| 項目 | 内容 |
|:-----|:-----|
| トリガー | UnlockRequested Event |
| 実行タイミング | release_time + 1 block 経過後 |
| 前提条件 | Challenge がないこと |
| ガス代負担 | Protocol Treasury (運営) |
| フォールバック | 手動Claim も可能（後方互換性） |

```
Auto-Claim Service Flow:
1. L1 Vault の UnlockRequested Event を監視
2. {lockId, releaseAt} を内部DBに記録
3. releaseAt 到達を検知
4. Challenge 状態を確認 (challenges[lockId].status)
5. Challenge なし → executeUnlock(lockId) を呼び出し
6. ガス代は Protocol Treasury から支払い
7. 失敗時 → リトライ (max 3回) → アラート
```

### ステップ詳細

| Step | 送信元 | 送信先 | 内容 |
|------|--------|--------|------|
| 1 | User | L3 | Unlock Request + Dilithium署名 |
| 2 | L3 | VRF | VRF seed要求 |
| 3 | VRF | L3 | VRF seed |
| 4 | L3 | Prover×2 | 署名要求 (Registry参照) |
| 5 | Prover×2 | L3 | SPHINCS+署名×2 |
| 6 | L3 | User | 署名完了通知 |
| 7 | User | L1 | Submit Unlock（全データ） |
| 8 | L1 | User | Pending通知（release_time）**★ユーザー操作完了** |
| 9 | L1 | Auto-Claim | Unlock登録 (Event経由) |
| 10 | L1 | 監視ボット | 監視開始 |
| 11 | **Auto-Claim** | L1 | **自動Claim実行** (24h後) |
| 12 | L1 | User | 資産Release |
| 13 | L1 | L3 | 完了同期 |

### タイムライン

```
T+0:      Unlock Request (User)
T+~30s:   VRF完了、Prover選出 (Registry参照)
T+~5min:  Prover署名完了
T+~10min: L1 Submit完了、24h Lock開始
          ★ユーザーの操作はここで完了
T+24h:    Time Lock終了
T+24h+:   Auto-Claim Service が自動で Claim → Release
          （手動Claimも可能、後方互換性あり）
```

---

## Sequence #3: Unlock (Emergency Path)

### 概要

| 項目 | 内容 |
|------|------|
| 目的 | Prover障害時にユーザーが資産を救済 |
| トリガー | 72時間Prover応答なし |
| Prover署名 | 不要 |
| Time Lock | 7日 |
| Bond | MAX(0.5 ETH, amount × 5%) |

### シーケンス図

```
User                 L3 Aegis            Prover (障害)        L1 Vault           監視ボット
  │                      │                    │                  │                  │
  │──(1) Unlock Req─────►│                    │                  │                  │
  │   {unlock_data,      │                    │                  │                  │
  │    sig_dilithium}    │                    │                  │                  │
  │                      │                    │                  │                  │
  │                ┌─────┴─────┐              │                  │                  │
  │                │ Dilithium │              │                  │                  │
  │                │ 検証 ✅    │              │                  │                  │
  │                │           │              │                  │                  │
  │                │ SR_1計算  │              │                  │                  │
  │                └─────┬─────┘              │                  │                  │
  │                      │                    │                  │                  │
  │                      │──(2) VRF + 署名要求                   │                  │
  │                      │                    │                  │                  │
  │                      │              [Prover応答なし]         │                  │
  │                      │              [or VRF障害]             │                  │
  │                      │                    │                  │                  │
  │                      │         [72h タイムアウト]            │                  │
  │                      │                    │                  │                  │
  │◄──(3) Emergency通知──│                    │                  │                  │
  │   {unlock_id,        │                    │                  │                  │
  │    emergency_mode}   │                    │                  │                  │
  │                      │                    │                  │                  │
  │──(4) Emergency Submit────────────────────────────────────────►│                 │
  │   {lock_id,          │                    │            ┌─────┴─────┐            │
  │    SR_0,             │                    │            │ SR_0照合  │            │
  │    SR_1,             │                    │            │           │            │
  │    SMT_proof,        │                    │            │ Emergency │            │
  │    unlock_data}      │                    │            │ Mode      │            │
  │   ※署名なし          │                    │            │ フラグ    │            │
  │                      │                    │            │           │            │
  │   + Emergency Bond   │                    │            │ Bond受領  │            │
  │   MAX(0.5ETH,        │                    │            │           │            │
  │      amt×5%)         │                    │            │ 7日 LOCK  │            │
  │                      │                    │            │ 開始      │            │
  │                      │                    │            └─────┬─────┘            │
  │                      │                    │                  │                  │
  │◄──(5) Pending────────────────────────────────────────────────│                  │
  │   {unlock_id,        │                    │                  │                  │
  │    release_time,     │                    │                  │                  │
  │    emergency=true}   │                    │                  │──(6) 監視強化───►│
  │                      │                    │                  │                  │
  │                      │                    │                  │            ┌─────┴─────┐
  │                      │                    │                  │            │ 7日間     │
  │                      │                    │                  │            │ 24/7監視  │
  │                      │                    │                  │            │           │
  │                      │                    │                  │            │ SR遷移    │
  │                      │                    │                  │            │ 完全検証  │
  │                      │                    │                  │            │           │
  │                      │                    │                  │            │ アラート  │
  │                      │                    │                  │            │ 閾値低下  │
  │                      │                    │                  │            └─────┬─────┘
  │                      │                    │                  │                  │
  │                      │                    │   [7日経過]      │                  │
  │                      │                    │   [Challenge無し]│                  │
  │                      │                    │                  │                  │
  │──(7) Claim───────────────────────────────────────────────────►│                 │
  │                      │                    │            ┌─────┴─────┐            │
  │                      │                    │            │ Time Lock │            │
  │                      │                    │            │ 完了確認  │            │
  │                      │                    │            │           │            │
  │                      │                    │            │ 資産送金  │            │
  │                      │                    │            │ Bond返還  │            │
  │                      │                    │            └─────┬─────┘            │
  │                      │                    │                  │                  │
  │◄──(8) Release + Bond─────────────────────────────────────────│                  │
  │   {amount} + Bond    │                    │                  │                  │
```

### Emergency Path発動条件

| 条件 | 閾値 |
|------|------|
| Prover応答なし | 72時間 |
| VRF障害 | 72時間 |
| L3-Prover通信障害 | 72時間 |

---

## Sequence #3': Resync

### 概要

| 項目 | 内容 |
|------|------|
| 目的 | L3-L1間の同期失敗時の復旧 |
| トリガー | Lock後のL1→L3通知失敗 |
| 方式 | 自動ポーリング + 手動Resync |

### シーケンス図

```
User                 L3 Aegis                          L1 Vault
  │                      │                                │
  │                      │   [同期失敗を検知]             │
  │                      │                                │
  │                      │         === 自動復旧 ===       │
  │                      │                                │
  │                      │──(A1) Event Poll──────────────►│
  │                      │   (定期: 1分ごと)              │
  │                      │                                │
  │                      │◄──(A2) Lock Events─────────────│
  │                      │   {lock_id, SR_0, ...}         │
  │                      │                                │
  │                ┌─────┴─────┐                          │
  │                │ 未同期の  │                          │
  │                │ Lockを    │                          │
  │                │ 検出・登録│                          │
  │                └───────────┘                          │
  │                      │                                │
  │                      │                                │
  │                      │         === 手動復旧 ===       │
  │                      │                                │
  │──(M1) Resync Req────►│                                │
  │   {lock_id,          │                                │
  │    l1_tx_hash}       │                                │
  │                      │                                │
  │                      │──(M2) Tx検証─────────────────►│
  │                      │                                │
  │                      │◄──(M3) Lock Data───────────────│
  │                      │   {confirmed, SR_0, ...}       │
  │                      │                                │
  │                ┌─────┴─────┐                          │
  │                │ Lock状態  │                          │
  │                │ 更新      │                          │
  │                └─────┬─────┘                          │
  │                      │                                │
  │◄──(M4) Resync完了────│                                │
  │   {lock_id,          │                                │
  │    status=synced}    │                                │
```

---

## Sequence #4: Challenge + Slashing

### 概要

| 項目 | 内容 |
|------|------|
| 目的 | 不正Unlockの検知とProverのSlashing |
| 参加者 | 監視ボット, Challenger, L1 Vault, Prover |
| Slashing | Quadratic: N² × 10% |
| 報酬配分 | Challenger 60%, Insurance 20%, Burn 20% |

### シーケンス図

```
監視ボット           Challenger           L1 Vault            Prover (不正)       分配先
     │                   │                    │                    │                  │
     │  [異常検知]       │                    │                    │                  │
     │  Dilithium検証    │                    │                    │                  │
     │  結果不一致       │                    │                    │                  │
     │                   │                    │                    │                  │
     │──(1) Alert───────►│                    │                    │                  │
     │   {unlock_id,     │                    │                    │                  │
     │    evidence,      │                    │                    │                  │
     │    severity}      │                    │                    │                  │
     │                   │                    │                    │                  │
     │                   │──(2) Challenge────►│                    │                  │
     │                   │   {unlock_id,      │                    │                  │
     │                   │    evidence,       │                    │                  │
     │                   │    bond: MAX(      │                    │                  │
     │                   │     0.1ETH,        │                    │                  │
     │                   │     amt×1%)}       │                    │                  │
     │                   │                    │                    │                  │
     │                   │              ┌─────┴─────┐              │                  │
     │                   │              │ Challenge │              │                  │
     │                   │              │ 登録      │              │                  │
     │                   │              │           │              │                  │
     │                   │              │ Lock延長  │              │                  │
     │                   │              │ → 7日    │              │                  │
     │                   │              │           │              │                  │
     │                   │              │ Defense   │              │                  │
     │                   │              │ 期限: 48h │              │                  │
     │                   │              └─────┬─────┘              │                  │
     │                   │                    │                    │                  │
     │                   │                    │──(3) Defense要求──►│                  │
     │                   │                    │   {challenge_id}   │                  │
     │                   │                    │                    │                  │
     │                   │                    │              [48h以内に]              │
     │                   │                    │              [Defense or]             │
     │                   │                    │              [タイムアウト]           │
     │                   │                    │                    │                  │
     │                   │              ┌─────┴─────┐              │                  │
     │                   │              │ 判定      │              │                  │
     │                   │              └─────┬─────┘              │                  │
     │                   │                    │                    │                  │
═════════════════════════════════════════════════════════════════════════════════════════
     │                   │   [Case A: Defense 成功]               │                  │
═════════════════════════════════════════════════════════════════════════════════════════
     │                   │                    │                    │                  │
     │                   │◄──(4a) Bond没収────│                    │                  │
     │                   │   Challenger負け   │                    │                  │
     │                   │                    │                    │                  │
     │                   │                    │──(5a) 継続────────►│ (User)           │
     │                   │                    │   24h/7日後Release │                  │
     │                   │                    │                    │                  │
═════════════════════════════════════════════════════════════════════════════════════════
     │                   │   [Case B: Challenger 勝利]            │                  │
═════════════════════════════════════════════════════════════════════════════════════════
     │                   │                    │                    │                  │
     │                   │              ┌─────┴─────┐              │                  │
     │                   │              │ Quadratic │              │                  │
     │                   │              │ Slash計算 │              │                  │
     │                   │              │           │              │                  │
     │                   │              │ 同時不正  │              │                  │
     │                   │              │ = N社     │              │                  │
     │                   │              │           │              │                  │
     │                   │              │ Slash =   │              │                  │
     │                   │              │ N²×10%    │              │                  │
     │                   │              │           │              │                  │
     │                   │              │ 例: 2社   │              │                  │
     │                   │              │ = 40%     │              │                  │
     │                   │              └─────┬─────┘              │                  │
     │                   │                    │                    │                  │
     │                   │                    │──(4b) Slash───────►│                  │
     │                   │                    │   40% = $320K      │                  │
     │                   │                    │                    │                  │
     │                   │                    │──(5b) 分配:────────────────────────────►│
     │                   │                    │                    │                  │
     │                   │◄──────────────────────────────────────────────────────────│
     │                   │   60% = $192K      │                    │   [Challenger]   │
     │                   │                    │                    │                  │
     │                   │                    │────────────────────────────────────────►│
     │                   │                    │   20% = $64K       │   [Insurance]    │
     │                   │                    │                    │                  │
     │                   │                    │────────────────────────────────────────►│
     │                   │                    │   20% = $64K       │   [BURN]         │
     │                   │                    │                    │                  │
     │                   │                    │──(6b) Unlock取消──►│ (User)           │
     │                   │                    │   資金保護         │                  │
```

### Quadratic Slashing計算表

| 同時不正数 | Slash率 | 例: $400K Stake |
|-----------|---------|-----------------|
| 1社 | 10% | $40K |
| 2社 | 40% | $160K/社 |
| 3社 | 90% | $360K/社 |
| 4社+ | 100% | 全額 |

### 報酬配分（統合版）

| 配分先 | 割合 | 条件 |
|--------|------|------|
| Challenger | 60% | Alert + Challenge 同一人の場合 |
| Insurance | 20% | - |
| Burn | 20% | - |

---

## Sequence #5: Prover Registration

### 概要

| 項目 | 内容 |
|------|------|
| 目的 | 新規Proverの登録 |
| **登録先** | **Prover Registry (独立コントラクト)** |
| 承認方式 | Phase別（招待制 → Council → 自動） |
| 最低Stake | **$400K USD相当**（ETH or QS Token、Chainlink Oracle価格参照） |
| Stake通貨 | ETH or QS Token（Phase問わず選択可） |

> **v3.0 アーキテクチャ変更**: Prover管理はL1 Vaultから独立した「Prover Registry」コントラクトで行う。
> これにより、Vaultのアップグレードなしに、Proverの動的参加・退出が可能。

### シーケンス図

```
Prover候補          Prover Registry        L3 Aegis            Governance
     │                    │                    │                    │
     │──(1) 登録申請──────►│                    │                    │
     │   {operator_addr,  │                    │                    │
     │    sphincs_pubkey, │                    │                    │
     │    stake_amount,   │                    │                    │
     │    hsm_attestation,│                    │                    │
     │    multisig_proof, │                    │                    │
     │    legal_signature}│                    │                    │
     │                    │                    │                    │
     │   + ETH/QS Transfer│                    │                    │
     │   ($400K USD相当)  │                    │                    │
     │                    │                    │                    │
     │              ┌─────┴─────┐              │                    │
     │              │ 条件検証  │              │                    │
     │              │           │              │                    │
     │              │ Stake ✅   │              │                    │
     │              │ HSM ✅     │              │                    │
     │              │ Multisig ✅│              │                    │
     │              │ Legal ✅   │              │                    │
     │              │           │              │                    │
     │              │ 登録      │              │                    │
     │              │ pending   │              │                    │
     │              └─────┬─────┘              │                    │
     │                    │                    │                    │
     │                    │──(2) 登録通知─────►│                    │
     │                    │   {prover_id,      │                    │
     │                    │    pubkey}         │                    │
     │                    │                    │                    │
     │                    │                    │──(3) 承認要求─────►│
     │                    │                    │   {prover_id}      │
     │                    │                    │                    │
     │                    │                    │              ┌─────┴─────┐
     │                    │                    │              │ 承認判定  │
     │                    │                    │              │           │
     │                    │                    │              │ Phase 1:  │
     │                    │                    │              │ 財団招待  │
     │                    │                    │              │           │
     │                    │                    │              │ Phase 2:  │
     │                    │                    │              │ Council   │
     │                    │                    │              │ 3/9+自動  │
     │                    │                    │              │           │
     │                    │                    │              │ Phase 3+: │
     │                    │                    │              │ 自動承認  │
     │                    │                    │              └─────┬─────┘
     │                    │                    │                    │
     │                    │                    │◄──(4) 承認─────────│
     │                    │                    │                    │
     │                    │              ┌─────┴─────┐              │
     │                    │              │ Prover    │              │
     │                    │              │ Pool追加  │              │
     │                    │              │           │              │
     │                    │              │ VRF選出   │              │
     │                    │              │ 対象に    │              │
     │                    │              └─────┬─────┘              │
     │                    │                    │                    │
     │                    │◄──(5) Active通知──│                    │
     │                    │                    │                    │
     │              ┌─────┴─────┐              │                    │
     │              │ Status    │              │                    │
     │              │ = Active  │              │                    │
     │              └─────┬─────┘              │                    │
     │                    │                    │                    │
     │◄──(6) 登録完了─────│                    │                    │
     │   {prover_id,      │                    │                    │
     │    status=active}  │                    │                    │
```

### 登録要件

| 要件 | Phase 1 | Phase 2 | Phase 3+ |
|------|---------|---------|----------|
| 最低Stake | **$400K USD相当** | **$400K USD相当** | **$400K USD相当** |
| Stake通貨 | ETH or QS Token | ETH or QS Token | ETH or QS Token |
| HSM使用 | 必須 | 必須 | 必須 |
| 2-of-3マルチシグ | 必須 | 必須 | 必須 |
| 法的契約 | 必須 | 必須 | 必須 |
| 承認 | 財団招待 | Council 3/9 + 自動 | 自動 |

#### Stake価格評価（USD-pegged Stake）

> **設計決定 (2026-02-08)**: Prover Stakeは法定通貨（USD）ベースで評価する。
> Stakeの本質は「不正行為を防ぐための経済的担保」であり、
> QS Tokenの価値が未確定の段階でも、ETHをStakeすることで十分な抑止力を確保できる。

```
Stake Evaluation:
├── 評価基準: $400,000 USD 相当
├── 受入通貨: ETH or QS Token（プール運用者が選択）
├── 価格Oracle: Chainlink ETH/USD, QS/USD（QS上場後）
├── 評価タイミング: 登録時のスポット価格
├── 追加Stake要求: 価格下落で担保不足時、30日以内に補填義務
│   └── 補填閾値: 評価額が $320,000 USD 未満に下落した場合
├── 余剰返還: 価格上昇で超過分の返還要求可能
│   └── 返還閾値: 評価額が $500,000 USD を超過した場合
└── Phase 1暫定: QS Token未上場のため ETH のみ受付
```

---

## Sequence #6: Prover Exit

### 概要

| 項目 | 内容 |
|------|------|
| 目的 | Proverの退出とStake返還 |
| Unbonding期間 | 7日 |
| 返還通貨 | 入金時と同じ通貨（ETH or QS Token） |
| 注意 | Unbonding中もSlash対象 |

### シーケンス図

```
Prover                Prover Registry           L3 Aegis            
     │                    │                    │                    
     │──(1) 退出申請─────►│                    │                    
     │   {prover_id}      │                    │                    
     │                    │                    │                    
     │              ┌─────┴─────┐              │                    
     │              │ 退出      │              │                    
     │              │ pending   │              │                    
     │              │           │              │                    
     │              │ 7日       │              │                    
     │              │ Unbonding │              │                    
     │              │ 開始      │              │                    
     │              └─────┬─────┘              │                    
     │                    │                    │                    
     │                    │──(2) 退出通知─────►│                    
     │                    │   {prover_id,      │                    
     │                    │    exit_time}      │                    
     │                    │                    │                    
     │                    │              ┌─────┴─────┐              
     │                    │              │ Prover    │              
     │                    │              │ Pool除外  │              
     │                    │              │           │              
     │                    │              │ VRF選出   │              
     │                    │              │ 対象外に  │              
     │                    │              └─────┬─────┘              
     │                    │                    │                    
     │◄──(3) 退出受理─────│                    │                    
     │   {unbonding_end}  │                    │                    
     │                    │                    │                    
     │      ════════════════════════════════════                    
     │      [7日間 Unbonding期間]              │                    
     │      [この間に不正発覚 → Slash]         │                    
     │      ════════════════════════════════════                    
     │                    │                    │                    
     │──(4) Stake引出────►│                    │                    
     │   {prover_id}      │                    │                    
     │                    │                    │                    
     │              ┌─────┴─────┐              │                    
     │              │ Unbonding │              │                    
     │              │ 完了確認  │              │                    
     │              │           │              │                    
     │              │ Slash     │              │                    
     │              │ なし確認  │              │                    
     │              │           │              │                    
     │              │ Stake     │              │                    
     │              │ 返還      │              │                    
     │              └─────┬─────┘              │                    
     │                    │                    │                    
     │◄──(5) Stake返還────│                    │
     │   {stake_amount,   │                    │
     │    currency}       │                    │
```

---

## Sequence #7: Governance Proposal

### 概要

| 項目 | 内容 |
|------|------|
| 目的 | Token投票による提案の可決・実行 |
| 適用Phase | Phase 3-4 |
| 議論期間 | 7日 |
| 投票期間 | 7日 |
| Time Lock | 7日 |

### シーケンス図

```
Proposer              Governance Contract   Purpose Committee    Security Council    Token Holders
     │                       │                    │                    │                   │
     │──(1) 提案作成─────────►│                    │                    │                   │
     │   {title,             │                    │                    │                   │
     │    description,       │                    │                    │                   │
     │    actions[],         │                    │                    │                   │
     │    bond: 1 ETH}       │                    │                    │                   │
     │                       │                    │                    │                   │
     │                 ┌─────┴─────┐              │                    │                   │
     │                 │ 提案登録  │              │                    │                   │
     │                 │ proposal_ │              │                    │                   │
     │                 │ id発行    │              │                    │                   │
     │                 └─────┬─────┘              │                    │                   │
     │                       │                    │                    │                   │
     │                       │──(2) 理念チェック──►│                    │                   │
     │                       │   {proposal_id}    │                    │                   │
     │                       │                    │                    │                   │
     │                       │              ┌─────┴─────┐              │                   │
     │                       │              │ Core      │              │                   │
     │                       │              │ Principles│              │                   │
     │                       │              │ との整合性│              │                   │
     │                       │              │ チェック  │              │                   │
     │                       │              └─────┬─────┘              │                   │
     │                       │                    │                    │                   │
     │                       │◄──(3) 承認/却下────│                    │                   │
     │                       │                    │                    │                   │
     │                       │   [却下: Bond返還、終了]                │                   │
     │                       │                    │                    │                   │
     │                 ┌─────┴─────┐              │                    │                   │
     │                 │ 議論期間  │              │                    │                   │
     │                 │ 開始(7日) │              │                    │                   │
     │                 └─────┬─────┘              │                    │                   │
     │                       │                    │                    │                   │
     │                       │   [7日経過]        │                    │                   │
     │                       │                    │                    │                   │
     │                       │──(4) 投票開始─────────────────────────────────────────────►│
     │                       │   {proposal_id,    │                    │                   │
     │                       │    snapshot_block} │                    │                   │
     │                       │                    │                    │                   │
     │                       │                    │                    │             ┌─────┴─────┐
     │                       │                    │                    │             │ 投票期間  │
     │                       │                    │                    │             │ (7日)     │
     │                       │                    │                    │             │           │
     │                       │                    │                    │             │ veQS重み  │
     │                       │                    │                    │             │ で投票    │
     │                       │                    │                    │             │           │
     │                       │                    │                    │             │ Quorum:   │
     │                       │                    │                    │             │ 4%/8%/15% │
     │                       │                    │                    │             └─────┬─────┘
     │                       │                    │                    │                   │
     │                       │◄──(5) 投票結果────────────────────────────────────────────│
     │                       │   {for, against,   │                    │                   │
     │                       │    quorum_met}     │                    │                   │
     │                       │                    │                    │                   │
     │                 ┌─────┴─────┐              │                    │                   │
     │                 │ 可決判定  │              │                    │                   │
     │                 │           │              │                    │                   │
     │                 │ for >     │              │                    │                   │
     │                 │ against   │              │                    │                   │
     │                 │ && quorum │              │                    │                   │
     │                 └─────┬─────┘              │                    │                   │
     │                       │                    │                    │                   │
     │                       │   [否決: Bond返還、終了]                │                   │
     │                       │                    │                    │                   │
     │                       │──(6) Time Lock開始──────────────────────►│                  │
     │                       │   (7日)            │                    │                   │
     │                       │                    │                    │                   │
     │                       │                    │              ┌─────┴─────┐            │
     │                       │                    │              │ Veto検討  │            │
     │                       │                    │              │ (理念違反 │            │
     │                       │                    │              │  のみ)    │            │
     │                       │                    │              │           │            │
     │                       │                    │              │ 6/9で     │            │
     │                       │                    │              │ Veto可能  │            │
     │                       │                    │              └─────┬─────┘            │
     │                       │                    │                    │                   │
     │                       │   [Veto: Bond返還、終了]                │                   │
     │                       │                    │                    │                   │
     │                       │   [7日経過、Vetoなし]                   │                   │
     │                       │                    │                    │                   │
     │──(7) Execute─────────►│                    │                    │                   │
     │                       │                    │                    │                   │
     │                 ┌─────┴─────┐              │                    │                   │
     │                 │ 実行      │              │                    │                   │
     │                 │           │              │                    │                   │
     │                 │ actions[] │              │                    │                   │
     │                 │ 順次実行  │              │                    │                   │
     │                 └─────┬─────┘              │                    │                   │
     │                       │                    │                    │                   │
     │◄──(8) 完了+Bond返還───│                    │                    │                   │
```

### Quorum要件

| 提案タイプ | Quorum | 例 |
|-----------|--------|-----|
| パラメータ変更 | 4% | 手数料率、Time Lock期間 |
| アップグレード | 8% | コントラクト更新 |
| Council変更 | 15% | メンバー追加/削除 |
| Immutable変更 | 30% | 理論上のみ（+2年Time Lock） |

---

## Sequence #8: Emergency Pause & Recovery

### 概要

| 項目 | 内容 |
|------|------|
| 目的 | 緊急時のプロトコル停止と復旧 |
| 適用Phase | Phase 2-4 |
| Pause閾値 | Security Council 5/9 |
| 最大Pause期間 | 72時間（延長はToken Vote） |

### シーケンス図

```
Security Council (5/9)  L1/L3 Contracts      Token Holders
        │                      │                    │
        │  [緊急事態検知]      │                    │
        │  ・重大バグ発見      │                    │
        │  ・攻撃検知          │                    │
        │  ・異常動作          │                    │
        │                      │                    │
        │──(1) Pause提案──────►│                    │
        │   {reason,           │                    │
        │    scope,            │                    │
        │    5/9 signatures}   │                    │
        │                      │                    │
        │                ┌─────┴─────┐              │
        │                │ PAUSED    │              │
        │                │           │              │
        │                │ 新規Lock  │              │
        │                │ 停止      │              │
        │                │           │              │
        │                │ 新規      │              │
        │                │ Unlock    │              │
        │                │ 停止      │              │
        │                │           │              │
        │                │ 進行中    │              │
        │                │ Unlock    │              │
        │                │ 継続      │              │
        │                │           │              │
        │                │ 72h       │              │
        │                │ タイマー  │              │
        │                │ 開始      │              │
        │                └─────┬─────┘              │
        │                      │                    │
        │                      │──(2) 通知─────────►│
        │                      │   {paused,         │
        │                      │    reason,         │
        │                      │    expires_at}     │
        │                      │                    │
        │   [72時間以内に対応策提示]                │
        │                      │                    │
        │──(3) 対応策提示─────────────────────────────►│
        │   {fix_proposal      │                    │
        │    OR extension_req  │                    │
        │    OR unpause_req}   │                    │
        │                      │                    │
        │                      │              ┌─────┴─────┐
        │                      │              │ 緊急投票  │
        │                      │              │ (48h)     │
        │                      │              │           │
        │                      │              │ A: 修正   │
        │                      │              │    承認   │
        │                      │              │           │
        │                      │              │ B: 延長   │
        │                      │              │    承認   │
        │                      │              │           │
        │                      │              │ C: 即時   │
        │                      │              │    解除   │
        │                      │              └─────┬─────┘
        │                      │                    │
        │                      │◄──(4) 投票結果─────│
        │                      │                    │
════════════════════════════════════════════════════════════════
        │   [Case A: 修正承認]                      │
════════════════════════════════════════════════════════════════
        │                      │                    │
        │──(5a) 緊急アップグレード                  │
        │   (7/9 + 48h TimeLock)                    │
        │                      │                    │
        │                ┌─────┴─────┐              │
        │                │ 修正適用  │              │
        │                │           │              │
        │                │ ACTIVE    │              │
        │                └───────────┘              │
        │                      │                    │
════════════════════════════════════════════════════════════════
        │   [Case B: 延長承認]                      │
════════════════════════════════════════════════════════════════
        │                      │                    │
        │──(5b) Pause延長─────►│                    │
        │   (最大+7日)         │                    │
        │                      │                    │
        │                ┌─────┴─────┐              │
        │                │ 延長      │              │
        │                │ タイマー  │              │
        │                │ リセット  │              │
        │                └───────────┘              │
        │                      │                    │
════════════════════════════════════════════════════════════════
        │   [Case C: 即時解除]                      │
════════════════════════════════════════════════════════════════
        │                      │                    │
        │──(5c) Unpause───────►│                    │
        │                      │                    │
        │                ┌─────┴─────┐              │
        │                │ ACTIVE    │              │
        │                │           │              │
        │                │ 通常運用  │              │
        │                │ 再開      │              │
        │                └───────────┘              │
```

### Pause時の影響

| 機能 | 状態 |
|------|------|
| 新規Lock | ❌ 停止 |
| 新規Unlock | ❌ 停止 |
| 進行中Unlock | ✅ 継続（Time Lock進行） |
| Claim | ✅ 継続 |
| Challenge | ✅ 継続 |
| Prover Exit | ✅ 継続 |

---

## Sequence #9: Token Hub (veQS)

### 概要

| 項目 | 内容 |
|------|------|
| 目的 | QSトークンのロックによるveQS取得、投票力の委任、報酬の請求 |
| 適用Phase | Phase 3-4 |
| 参加者 | User, L3 Aegis, veQS Contract (L3), Governance |
| veQS計算 | voting_power = QS_locked × (remaining_time / MAX_LOCK_TIME) |
| 最大ロック期間 | 4年（1461日） |
| 最小ロック期間 | 1週間 |
| 投票力 | voting_power(user) = own_power(user) + Σ delegated_power_to(user) |

### 9.1 veQS Lock（QSロック → veQS投票力取得）

#### 設計思想

veQS は **線形時間減衰** モデルを採用する。
ロック期間が長いほど投票力が高く、時間経過とともに自然に減衰する。
これにより、長期コミットメントを持つユーザーがより大きな影響力を持つ。

> **v2.0変更 (2026-02-08)**: ステップ型マルチプライヤから線形時間減衰に変更。
> 実装 (veQS.sol) との整合性を優先。連続的な減衰の方がゲーミング耐性が高い。

#### データ構造

```
veQS Lock Request:
{
  amount: uint256,            // ロックするQS量
  lock_duration: uint256,     // ロック期間（秒）: MIN_LOCK_TIME ≤ x ≤ MAX_LOCK_TIME
  pk_dilithium: bytes,        // ユーザーDilithium公開鍵
  sig_dilithium: bytes        // ユーザーDilithium署名
}

Constants:
  MIN_LOCK_TIME = 1 week   (604,800 秒)
  MAX_LOCK_TIME = 4 years  (126,144,000 秒 = 1461 days)

Voting Power (Linear Time-Decay):
  voting_power(t) = amount × (remaining_time(t) / MAX_LOCK_TIME)

  where:
    remaining_time(t) = max(0, unlock_time - t)
    unlock_time = lock_time + lock_duration

Examples:
  1000 QS × 4年ロック → 初期 1000 voting power → 2年後 500 → 4年後 0
  1000 QS × 2年ロック → 初期  500 voting power → 1年後 250 → 2年後 0
  1000 QS × 1年ロック → 初期  250 voting power → 半年後 125 → 1年後 0

  ※ 最大投票力はロック量と同じ（4年ロック時の初期値）
  ※ 任意の時点で追加ロック (increaseLockAmount) やロック延長 (extendLockTime) が可能
```

#### シーケンス図

```
User                 L3 Aegis            veQS Contract (L3)   Governance
  │                      │                    │                    │
  │──(1) Lock Req───────►│                    │                    │
  │   {amount,           │                    │                    │
  │    duration_months,  │                    │                    │
  │    pk_dilithium,     │                    │                    │
  │    sig_dilithium}    │                    │                    │
  │                      │                    │                    │
  │                ┌─────┴─────┐              │                    │
  │                │ Dilithium │              │                    │
  │                │ 検証 ✅    │              │                    │
  │                │           │              │                    │
  │                │ amount >0 │              │                    │
  │                │ duration  │              │                    │
  │                │ 有効 ✅    │              │                    │
  │                │           │              │                    │
  │                │ voting    │              │                    │
  │                │ power計算 │              │                    │
  │                │ (linear)  │              │                    │
  │                └─────┬─────┘              │                    │
  │                      │                    │                    │
  │                      │──(2) Lock─────────►│                    │
  │                      │   {user,           │                    │
  │                      │    amount,         │                    │
  │                      │    lock_duration,  │                    │
  │                      │    voting_power}   │                    │
  │                      │                    │                    │
  │                      │              ┌─────┴─────┐              │
  │                      │              │ QS Transfer│             │
  │                      │              │ user →     │             │
  │                      │              │ contract   │             │
  │                      │              │            │             │
  │                      │              │ Lock記録   │             │
  │                      │              │ {amount,   │             │
  │                      │              │  unlockTime│             │
  │                      │              │  startTime}│             │
  │                      │              │            │             │
  │                      │              │ unlock_time│             │
  │                      │              │ = now +    │             │
  │                      │              │ duration   │             │
  │                      │              └─────┬─────┘              │
  │                      │                    │                    │
  │                      │◄──(3) 確認─────────│                    │
  │                      │   {lock_id,        │                    │
  │                      │    voting_power,   │                    │
  │                      │    unlock_time}    │                    │
  │                      │                    │                    │
  │                      │                    │──(4) 投票力更新───►│
  │                      │                    │   {user,           │
  │                      │                    │    new_voting_power}│
  │                      │                    │                    │
  │◄──(5) Lock完了────────│                    │                    │
  │   {lock_id,          │                    │                    │
  │    voting_power,     │                    │                    │
  │    unlock_time,      │                    │                    │
  │    amount_locked}    │                    │                    │
```

#### ステップ詳細

| Step | 送信元 | 送信先 | 内容 |
|------|--------|--------|------|
| 1 | User | L3 | veQS Lock Request + Dilithium署名 |
| 2 | L3 | veQS Contract | QSロック（transferFrom）+ Lock Position記録 |
| 3 | veQS Contract | L3 | ロック確認（lock_id, voting_power, unlock_time） |
| 4 | veQS Contract | Governance | 投票力更新通知 |
| 5 | L3 | User | Lock完了通知 |

#### 追加操作

| 操作 | 関数 | 条件 |
|------|------|------|
| ロック量追加 | `increaseLockAmount(amount)` | 既存ロック必要。投票力即時更新 |
| ロック延長 | `extendLockTime(newUnlockTime)` | newUnlockTime > 現unlockTime |
| ロック解除 | `withdraw()` | block.timestamp ≥ unlockTime のみ |

### 9.2 Delegation（投票力委任）

#### データ構造

```
Delegation Request:
{
  delegate_to: address,       // 委任先アドレス
  amount: uint256,            // 委任するveQS量（0 = 全額取消）
  pk_dilithium: bytes,
  sig_dilithium: bytes
}

Voting Power Calculation:
  voting_power(user) = own_veqs(user)
                     + Σ delegated_veqs_to(user)
                     - delegated_veqs_from(user)
```

#### シーケンス図

```
User (Delegator)     L3 Aegis            veQS Contract (L3)   Governance
  │                      │                    │                    │
  │──(1) Delegate Req───►│                    │                    │
  │   {delegate_to,      │                    │                    │
  │    amount,           │                    │                    │
  │    pk_dilithium,     │                    │                    │
  │    sig_dilithium}    │                    │                    │
  │                      │                    │                    │
  │                ┌─────┴─────┐              │                    │
  │                │ Dilithium │              │                    │
  │                │ 検証 ✅    │              │                    │
  │                │           │              │                    │
  │                │ veQS残高  │              │                    │
  │                │ 確認 ✅    │              │                    │
  │                │           │              │                    │
  │                │ 自己委任  │              │                    │
  │                │ 禁止 ✅    │              │                    │
  │                └─────┬─────┘              │                    │
  │                      │                    │                    │
  │                      │──(2) Delegate─────►│                    │
  │                      │   {from, to,       │                    │
  │                      │    amount}         │                    │
  │                      │                    │                    │
  │                      │              ┌─────┴─────┐              │
  │                      │              │ 委任記録  │              │
  │                      │              │ 更新      │              │
  │                      │              │           │              │
  │                      │              │ delegator │              │
  │                      │              │ voting_   │              │
  │                      │              │ power -=  │              │
  │                      │              │ amount    │              │
  │                      │              │           │              │
  │                      │              │ delegate  │              │
  │                      │              │ voting_   │              │
  │                      │              │ power +=  │              │
  │                      │              │ amount    │              │
  │                      │              └─────┬─────┘              │
  │                      │                    │                    │
  │                      │                    │──(3) 投票力更新───►│
  │                      │                    │   {delegator:      │
  │                      │                    │    new_power,      │
  │                      │                    │    delegate:       │
  │                      │                    │    new_power}      │
  │                      │                    │                    │
  │◄──(4) 委任完了────────│                    │                    │
  │   {delegation_id,    │                    │                    │
  │    new_voting_power} │                    │                    │
```

#### 委任ルール

| ルール | 内容 |
|--------|------|
| 自己委任 | 禁止 |
| 複数委任先 | 許可（分割委任可） |
| 委任取消 | amount=0 で即時取消 |
| 連鎖委任 | 禁止（AがBに委任し、BがCに再委任は不可） |
| ロック期間中 | 委任変更可（ロック解除は不可） |

### 9.3 Reward Claim（報酬請求）

#### データ構造

```
Reward Epoch:
{
  epoch_id: uint256,          // エポック番号
  start_time: uint256,        // エポック開始時刻
  end_time: uint256,          // エポック終了時刻
  total_rewards: uint256,     // エポック内総報酬
  distribution: {
    veqs_holding: 60%,        // veQS保有割合
    voting_participation: 30%, // 投票参加割合
    delegation_bonus: 10%     // 委任ボーナス
  }
}

Reward Calculation:
  user_reward = epoch_total × (
    0.6 × (user_veqs / total_veqs)
    + 0.3 × (user_votes / total_proposals)
    + 0.1 × delegation_bonus(user)
  )
```

#### シーケンス図

```
User                 L3 Aegis            Reward Contract (L3)  Treasury
  │                      │                    │                    │
  │                      │   [Epoch End]      │                    │
  │                      │                    │                    │
  │                      │              ┌─────┴─────┐              │
  │                      │              │ Epoch     │              │
  │                      │              │ Snapshot  │              │
  │                      │              │           │              │
  │                      │              │ 各ユーザー│              │
  │                      │              │ のveQS    │              │
  │                      │              │ 残高記録  │              │
  │                      │              │           │              │
  │                      │              │ 報酬計算  │              │
  │                      │              └─────┬─────┘              │
  │                      │                    │                    │
  │                      │                    │──(0) 報酬配分─────►│
  │                      │                    │   {epoch_id,       │
  │                      │                    │    total_rewards}  │
  │                      │                    │                    │
  │──(1) Claim Req──────►│                    │                    │
  │   {pk_dilithium,     │                    │                    │
  │    sig_dilithium}    │                    │                    │
  │                      │                    │                    │
  │                ┌─────┴─────┐              │                    │
  │                │ Dilithium │              │                    │
  │                │ 検証 ✅    │              │                    │
  │                │           │              │                    │
  │                │ 未請求    │              │                    │
  │                │ 報酬確認  │              │                    │
  │                └─────┬─────┘              │                    │
  │                      │                    │                    │
  │                      │──(2) Claim────────►│                    │
  │                      │   {user,           │                    │
  │                      │    epoch_ids[]}    │                    │
  │                      │                    │                    │
  │                      │              ┌─────┴─────┐              │
  │                      │              │ 二重請求  │              │
  │                      │              │ 検証 ✅    │              │
  │                      │              │           │              │
  │                      │              │ 報酬送金  │              │
  │                      │              │ → User   │              │
  │                      │              │           │              │
  │                      │              │ claimed   │              │
  │                      │              │ = true    │              │
  │                      │              └─────┬─────┘              │
  │                      │                    │                    │
  │◄──(3) Claim完了───────│                    │                    │
  │   {claimed_amount,   │                    │                    │
  │    epoch_ids[],      │                    │                    │
  │    tx_hash}          │                    │                    │
```

#### 報酬配分ルール

| 配分先 | 割合 | 条件 |
|--------|:----:|------|
| veQS保有者 | 60% | veQS残高比例 |
| 投票参加者 | 30% | エポック内投票参加率 |
| 委任ボーナス | 10% | 委任を受けている量に比例 |

#### エラーハンドリング

| エラー | 原因 | 対応 |
|--------|------|------|
| Dilithium検証失敗 | 署名不正 | リクエスト却下 |
| 二重請求 | 同一epoch再請求 | リクエスト却下 |
| 未請求報酬なし | claimable = 0 | リクエスト却下 |
| veQS残高不足 (Lock) | amount > balance | リクエスト却下 |
| 自己委任 | delegate_to = self | リクエスト却下 |
| 連鎖委任 | delegate先が既に委任中 | リクエスト却下 |

### Storage Requirements

| Entity | Write To | Read From | Redis Cache | Notes |
|--------|----------|-----------|:-----------:|-------|
| veQS Lock | PG + L3 | PG (Redis cache) | `veqs:lock:{addr}` | ロック量 = 投票力 |
| Delegation | PG + L3 | PG (Redis cache) | - | veQS委任 |
| Reward Epoch | PG | PG | - | エポック報酬 |
| Reward Claim | PG + L3 | PG | - | 二重請求防止 |

### 9.4 報酬通貨設計（QS Token統一）

> **設計決定 (2026-02-08)**: 全ての報酬・インセンティブは **QS Token** で支払う。
> ETHは「ユーザー資産のLock/Unlock」と「Bond/Stake担保」のみに使用。

#### 通貨使い分け

| 用途 | 通貨 | チェーン | 根拠 |
|------|:----:|:-------:|------|
| ユーザー資産Lock/Unlock | ETH | L1 | ユーザーの実資産 |
| Emergency Bond | ETH | L1 | 担保（返却あり） |
| Challenge Bond | ETH | L1 | 担保（返却あり） |
| **Prover Stake** | **ETH or QS** | **L1** | **$400K USD相当（Chainlink Oracle価格参照）** |
| **Prover署名報酬** | **QS Token** | **L3** | QSInflation → RewardRouter → ProverRewardPool |
| **Observer Challenge報酬** | **QS Token** | **L3** | Slash分のQS分配 |
| **veQSホルダー報酬** | **QS Token** | **L3** | QSInflation → RewardRouter → VeQSRewardDistributor |
| **Enterprise保証報酬** | **QS Token** | **L3** | 契約ベース |
| Gas代 | ETH | L1 | ネットワーク手数料 |

#### Prover署名報酬メカニズム

```
ProverRewardPool:
├── 原資: QSInflation → RewardRouter → ProverRewardPool (インフレの30%)
├── 配分: アクティブProver間で、署名処理数比例で分配
│   └── prover_share = (prover_signatures / total_signatures) × pool_balance
├── 分配タイミング: 日次バッチ（ProverRewardPool.distributeDaily()）
├── 請求: POST /v1/prover/:id/rewards/claim → L3 ProverRewardPool.claimReward()
└── 最低請求額: 1 QS（ガス効率のため）

Observer Challenge報酬:
├── 原資1: QSInflation → RewardRouter → ObserverRewardPool (インフレの10%)
├── 原資2: Slash された Prover の Stake の一部
│   └── Slashの60% → Challenger, 20% → Insurance, 20% → Burn
├── 支払: Challenge 確定後に ObserverRewardPool に入金
├── 請求: POST /v1/observer/earnings/claim → L3 ObserverRewardPool.claimReward()
└── 配分: Challenge成功のObserverに個別計上
```

#### L3 報酬アーキテクチャ（RewardRouter設計）

> **設計決定 (2026-02-08)**: QSInflation が年次mintした QS Token を
> RewardRouter が4つのプールに分配する。ProtocolRewardMinter は不要
> （RewardRouter が QSToken の minter 権限を持つ）。

```
L3 Aegis (QS Token発行チェーン)

┌──────────────────┐
│   QSToken.sol    │  ERC-20 (max 1B QS)
│   minter ────────┼──→ QSInflation.sol
└──────────────────┘
         ↑ mint()
┌──────────────────┐
│ QSInflation.sol  │  年次インフレmint (5%→3.75%→2.5%→1%)
│ rewardDistributor┼──→ RewardRouter.sol
└──────────────────┘
         ↓ QS Token
┌──────────────────────────────────────────────────┐
│              RewardRouter.sol                     │
│   (QSInflationのmint先。受取後に4プールへ分配)    │
│                                                   │
│   分配比率（Governance提案で変更可能）:            │
│   ├── 50% → VeQSRewardDistributor  (veQSホルダー)│
│   ├── 30% → ProverRewardPool       (Prover報酬)  │
│   ├── 10% → ObserverRewardPool     (Observer報酬) │
│   └── 10% → Treasury               (財団運営費)   │
└──────────────────────────────────────────────────┘
         ↓ distribute()
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌──────────┐
│VeQSRewardDist.  │  │ProverRewardPool │  │ObserverReward   │  │Treasury  │
│                 │  │                 │  │Pool             │  │          │
│ エポック制      │  │ 署名処理数比例  │  │ Challenge成功   │  │ 財団     │
│ (veQS残高比例)  │  │ (日次バッチ)    │  │ 報酬            │  │ 運営費   │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └──────────┘

Additional contracts:
├── veQS.sol                    ... Vote-Escrow (QSロック → 投票力, 線形時間減衰)
├── VeQSRewardDistributor.sol   ... veQSホルダー報酬 (既存, §9.3)
├── ProverRewardPool.sol        ... Prover署名報酬 (★新規作成)
└── ObserverRewardPool.sol      ... Observer Challenge報酬 (★新規作成)
```

#### RewardRouter 分配フロー

```
1. QSInflation.mintInflation()
   └─ QSToken.mint(rewardRouter, inflationAmount)

2. RewardRouter.distribute()  ← 誰でも呼べる（permissionless）
   ├─ VeQSRewardDistributor に 50% 転送 → addRewards()
   ├─ ProverRewardPool に 30% 転送
   ├─ ObserverRewardPool に 10% 転送
   └─ Treasury に 10% 転送

3. 各プールから個別に claim:
   ├─ veQSホルダー: VeQSRewardDistributor.claim()
   ├─ Prover: ProverRewardPool.claimReward(prover_id)
   └─ Observer: ObserverRewardPool.claimReward(observer_id)
```

#### バックエンドAPI影響

| Endpoint | 現状 | QS Token対応 |
|----------|------|-------------|
| `GET /v1/prover/:id/rewards` | `0.0` (BE-001) + `currency: "QS"` | L3 ProverRewardPool残高参照（Phase 8-D） |
| `POST /v1/prover/:id/rewards/claim` | 未実装 | L3 ProverRewardPool.claimReward()（Phase 8-D） |
| `GET /v1/observer/earnings` | PG observer_earnings + `currency: "QS"` | L3 ObserverRewardPool残高参照（Phase 8-D） |
| `POST /v1/observer/earnings/claim` | 未実装 | L3 ObserverRewardPool.claimReward()（Phase 8-D） |
| `GET /v1/token-hub/rewards` | PG reward_epochs + `currency: "QS"` | L3 VeQSRewardDistributor参照（既にQS前提） |

**Phase 8-D で実装**: L3 RewardRouter + 各RewardPool との連携。現Phase（BE-001）では `currency: "QS"` をレスポンスに含め、金額は `0.0` を返す。

---

## Appendix: Gas Cost Summary

| Sequence | Gas (est.) | USD (20 gwei) |
|----------|------------|---------------|
| #1 Lock | ~135K | ~$7 |
| #2 Unlock (Normal) | ~490K | ~$27 |
| #3 Unlock (Emergency) | ~150K + Bond | ~$8 + Bond |
| #4 Challenge | ~100K + Bond | ~$5 + Bond |
| #5 Prover Registration | ~200K | ~$10 |
| #6 Prover Exit | ~100K | ~$5 |
| #7 Governance Proposal | ~150K | ~$8 |
| #8 Emergency Pause | ~50K | ~$3 |
| #9 veQS Lock | ~120K | ~$6 |
| #9 Delegation | ~80K | ~$4 |
| #9 Reward Claim | ~100K | ~$5 |

---

**END OF DOCUMENT**
