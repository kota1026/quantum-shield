# Quantum Shield L3 - Sequence Catalog v2.0

> **Document Version**: 2.0  
> **Last Updated**: 2025-12-21  
> **Total Sequences**: 8 + 1 (補助)

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

## Sequence #2: Unlock (Normal Path)

### 概要

| 項目 | 内容 |
|------|------|
| 目的 | ユーザーがロック済み資産を引き出す |
| 参加者 | User, L3 Aegis, Chainlink VRF, Prover (5社), L1 Vault, 監視ボット |
| Prover署名 | SPHINCS+ 2/5 必要 |
| Time Lock | 24時間 |
| Gas | ~490K gas (~$27) |

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
User                 L3 Aegis (4node)    Chainlink VRF      Prover (5社)        L1 Vault           監視ボット
  │                      │                   │                  │                  │                  │
  │──(1) Unlock Req─────►│                   │                  │                  │                  │
  │   {chain_id,         │                   │                  │                  │                  │
  │    lock_id,          │                   │                  │                  │                  │
  │    dest_addr,        │                   │                  │                  │                  │
  │    amount,           │                   │                  │                  │                  │
  │    expiry,           │                   │                  │                  │                  │
  │    nonce,            │                   │                  │                  │                  │
  │    sig_dilithium}    │                   │                  │                  │                  │
  │                      │                   │                  │                  │                  │
  │                ┌─────┴─────┐             │                  │                  │                  │
  │                │ 4ノード   │             │                  │                  │                  │
  │                │ BFT合意   │             │                  │                  │                  │
  │                │           │             │                  │                  │                  │
  │                │ Dilithium │             │                  │                  │                  │
  │                │ 検証 ✅    │             │                  │                  │                  │
  │                │ lock_id ✅ │             │                  │                  │                  │
  │                │ nonce ✅   │             │                  │                  │                  │
  │                │ expiry ✅  │             │                  │                  │                  │
  │                │ amount ✅  │             │                  │                  │                  │
  │                │           │             │                  │                  │                  │
  │                │ SR_1計算  │             │                  │                  │                  │
  │                │ SMT更新   │             │                  │                  │                  │
  │                └─────┬─────┘             │                  │                  │                  │
  │                      │                   │                  │                  │                  │
  │                      │──(2) VRF Req─────►│                  │                  │                  │
  │                      │   {unlock_id}     │                  │                  │                  │
  │                      │                   │                  │                  │                  │
  │                      │             ┌─────┴─────┐            │                  │                  │
  │                      │             │ VRF seed  │            │                  │                  │
  │                      │             │ 生成      │            │                  │                  │
  │                      │             └─────┬─────┘            │                  │                  │
  │                      │                   │                  │                  │                  │
  │                      │◄──(3) seed────────│                  │                  │                  │
  │                      │                   │                  │                  │                  │
  │                ┌─────┴─────┐             │                  │                  │                  │
  │                │ Prover    │             │                  │                  │                  │
  │                │ 選出 (2/5)│             │                  │                  │                  │
  │                │           │             │                  │                  │                  │
  │                │ P(i) =    │             │                  │                  │                  │
  │                │ Stake_i / │             │                  │                  │                  │
  │                │ Σ Stake   │             │                  │                  │                  │
  │                │           │             │                  │                  │                  │
  │                │ 選出:     │             │                  │                  │                  │
  │                │ [P_A,P_B] │             │                  │                  │                  │
  │                └─────┬─────┘             │                  │                  │                  │
  │                      │                   │                  │                  │                  │
  │                      │──(4) 署名要求────────────────────────►│                  │                  │
  │                      │   {unlock_data,   │                  │                  │                  │
  │                      │    SR_0, SR_1}    │                  │                  │                  │
  │                      │                   │                  │                  │                  │
  │                      │                   │            ┌─────┴─────┐            │                  │
  │                      │                   │            │ HSM内     │            │                  │
  │                      │                   │            │ 2-of-3    │            │                  │
  │                      │                   │            │ 承認      │            │                  │
  │                      │                   │            │           │            │                  │
  │                      │                   │            │ L3検証    │            │                  │
  │                      │                   │            │ 結果確認  │            │                  │
  │                      │                   │            │           │            │                  │
  │                      │                   │            │ SPHINCS+  │            │                  │
  │                      │                   │            │ 署名生成  │            │                  │
  │                      │                   │            │ (各8KB)   │            │                  │
  │                      │                   │            └─────┬─────┘            │                  │
  │                      │                   │                  │                  │                  │
  │                      │◄──(5) 2×SPHINCS+─────────────────────│                  │                  │
  │                      │   {sig_A, sig_B}  │                  │                  │                  │
  │                      │                   │                  │                  │                  │
  │◄──(6) 署名完了────────│                   │                  │                  │                  │
  │   {unlock_id,        │                   │                  │                  │                  │
  │    sigs_ready}       │                   │                  │                  │                  │
  │                      │                   │                  │                  │                  │
  │──(7) Submit Unlock───────────────────────────────────────────────────────────►│                  │
  │   {lock_id,          │                   │                  │            ┌─────┴─────┐            │
  │    SR_0,             │                   │                  │            │ SR_0照合  │            │
  │    SR_1,             │                   │                  │            │ (Lock時)  │            │
  │    SMT_proof,        │                   │                  │            │           │            │
  │    unlock_data,      │                   │                  │            │ SPHINCS+  │            │
  │    2×SPHINCS+ sigs}  │                   │                  │            │ 検証×2    │            │
  │                      │                   │                  │            │ (~400K)   │            │
  │                      │                   │                  │            │           │            │
  │                      │                   │                  │            │ SMT検証   │            │
  │                      │                   │                  │            │ SHA3検証  │            │
  │                      │                   │                  │            │           │            │
  │                      │                   │                  │            │ 24h LOCK  │            │
  │                      │                   │                  │            │ 開始      │            │
  │                      │                   │                  │            └─────┬─────┘            │
  │                      │                   │                  │                  │                  │
  │◄──(8) Pending────────────────────────────────────────────────────────────────│                  │
  │   {unlock_id,        │                   │                  │                  │                  │
  │    release_time}     │                   │                  │                  │──(9) 監視────────►│
  │                      │                   │                  │                  │                  │
  │                      │                   │                  │                  │            ┌─────┴─────┐
  │                      │                   │                  │                  │            │ 24h監視   │
  │                      │                   │                  │                  │            │           │
  │                      │                   │                  │                  │            │ Dilithium │
  │                      │                   │                  │                  │            │ 再検証    │
  │                      │                   │                  │                  │            │           │
  │                      │                   │                  │                  │            │ 異常検知  │
  │                      │                   │                  │                  │            │ → Alert  │
  │                      │                   │                  │                  │            └─────┬─────┘
  │                      │                   │                  │                  │                  │
  │                      │                   │                  │   [24h経過]      │                  │
  │                      │                   │                  │   [Challenge無し]│                  │
  │                      │                   │                  │                  │                  │
  │──(10) Claim──────────────────────────────────────────────────────────────────►│                  │
  │                      │                   │                  │            ┌─────┴─────┐            │
  │                      │                   │                  │            │ Time Lock │            │
  │                      │                   │                  │            │ 完了確認  │            │
  │                      │                   │                  │            │           │            │
  │                      │                   │                  │            │ 資産送金  │            │
  │                      │                   │                  │            └─────┬─────┘            │
  │                      │                   │                  │                  │                  │
  │◄──(11) Release───────────────────────────────────────────────────────────────│                  │
  │   {amount} ETH       │                   │                  │                  │                  │
  │                      │                   │                  │                  │                  │
  │                      │◄──(12) 完了通知──────────────────────────────────────│                  │
  │                      │   {lock_id,       │                  │                  │                  │
  │                      │    released}      │                  │                  │                  │
```

### ステップ詳細

| Step | 送信元 | 送信先 | 内容 |
|------|--------|--------|------|
| 1 | User | L3 | Unlock Request + Dilithium署名 |
| 2 | L3 | VRF | VRF seed要求 |
| 3 | VRF | L3 | VRF seed |
| 4 | L3 | Prover×2 | 署名要求 |
| 5 | Prover×2 | L3 | SPHINCS+署名×2 |
| 6 | L3 | User | 署名完了通知 |
| 7 | User | L1 | Submit Unlock（全データ） |
| 8 | L1 | User | Pending通知（release_time） |
| 9 | L1 | 監視ボット | 監視開始 |
| 10 | User | L1 | Claim要求 |
| 11 | L1 | User | 資産Release |
| 12 | L1 | L3 | 完了同期 |

### タイムライン

```
T+0:      Unlock Request
T+~30s:   VRF完了、Prover選出
T+~5min:  Prover署名完了
T+~10min: L1 Submit完了、24h Lock開始
T+24h:    Time Lock終了
T+24h+:   User Claim → Release
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
| 承認方式 | Phase別（招待制 → Council → 自動） |
| 最低Stake | $400K (Phase 1) / $500K Solo (Phase 2+) |

### シーケンス図

```
Prover候補            L1 Staking           L3 Aegis            Governance
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
     │   ($400K+)         │                    │                    │
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
| 最低Stake | $400K ETH | $500K $QS | $500K $QS |
| HSM使用 | 必須 | 必須 | 必須 |
| 2-of-3マルチシグ | 必須 | 必須 | 必須 |
| 法的契約 | 必須 | 必須 | 必須 |
| 承認 | 財団招待 | Council 3/9 + 自動 | 自動 |

---

## Sequence #6: Prover Exit

### 概要

| 項目 | 内容 |
|------|------|
| 目的 | Proverの退出とStake返還 |
| Unbonding期間 | 7日 |
| 注意 | Unbonding中もSlash対象 |

### シーケンス図

```
Prover                L1 Staking           L3 Aegis            
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
     │◄──(5) ETH/QS返還───│                    │                    
     │   {stake_amount}   │                    │                    
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

---

**END OF DOCUMENT**
