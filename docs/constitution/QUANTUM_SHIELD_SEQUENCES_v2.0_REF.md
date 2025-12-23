# Quantum Shield - Sequence Reference（シーケンス参照）

> **Version**: 2.0 REF（Reference版）  
> **Full Document**: `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md`  
> **用途**: SYSTEM BOOTLOADER用クイックリファレンス

---

## 📋 Sequence Overview

| Seq# | Sequence | Category | Description |
|------|----------|----------|-------------|
| 1 | Lock | User Flow | 資産をL1 Vaultにロック |
| 2 | Unlock (Normal) | User Flow | 通常のアンロック（24h Time Lock） |
| 3 | Unlock (Emergency) | User Flow | 緊急アンロック（7日 Time Lock） |
| 3' | Resync | User Flow | L2状態の再同期 |
| 4 | Challenge + Slashing | Security | 不正検知とSlashing |
| 5 | Prover Registration | Prover Mgmt | Prover登録（ステーク） |
| 6 | Prover Exit | Prover Mgmt | Prover退出 |
| 7 | Governance Proposal | Governance | 提案・投票 |
| 8 | Emergency Pause | Governance | 緊急停止 |

---

## 🔑 Key Parameters（頻出パラメータ）

### State Root計算式

```solidity
// SR_0 (Lock時)
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

// SR_1 (Unlock時)
SR_1 = SHA3-256(
  "QS_UNLOCK_V1" ||
  SR_0 ||
  lock_id ||
  dest_addr ||
  amount ||
  nonce
)
```

### Time Lock

| パス | Time Lock | Bond |
|------|-----------|------|
| Normal Unlock | 24時間 | なし |
| Emergency Unlock | 7日 | MAX(0.5 ETH, amount × 5%) |
| Challenge | +7日延長 | MAX(0.1 ETH, amount × 1%) |

### Slashing配分

| 配分先 | 割合 |
|--------|------|
| Challenger | 60% |
| Insurance | 20% |
| Burn | 20% |

### Quadratic Slashing

| 同時不正数 | Slash率 |
|-----------|---------| 
| 1社 | 10% |
| 2社 | 40% |
| 3社 | 90% |
| 4社+ | 100% |

---

## 📌 Sequence別チェックポイント

### Sequence #1: Lock

**必須確認項目**:
- [ ] Dilithium署名検証 ✅
- [ ] nonce重複チェック ✅
- [ ] expiry期限チェック ✅
- [ ] SR_0計算（SHA3-256） ✅
- [ ] SMT追加 ✅

### Sequence #2: Unlock (Normal)

**必須確認項目**:
- [ ] Dilithium署名検証 ✅
- [ ] lock_id存在確認 ✅
- [ ] VRF seed取得 ✅
- [ ] Prover選出（2/5） ✅
- [ ] SPHINCS+署名検証×2 ✅
- [ ] 24h Time Lock開始 ✅

### Sequence #3: Unlock (Emergency)

**トリガー条件**: 72時間Prover応答なし

**必須確認項目**:
- [ ] 72hタイムアウト確認 ✅
- [ ] Emergency Bond受領 ✅
- [ ] 7日Time Lock開始 ✅
- [ ] 監視強化モード開始 ✅

### Sequence #4: Challenge + Slashing

**必須確認項目**:
- [ ] Challenge Bond受領 ✅
- [ ] Defense期限設定（48h） ✅
- [ ] Quadratic Slash計算 ✅
- [ ] 配分（60/20/20）実行 ✅

---

## 🚨 エラーハンドリング参照

| Sequence | エラー | 原因 | 対応 |
|----------|--------|------|------|
| #1 | Dilithium検証失敗 | 署名不正 | リクエスト却下 |
| #1 | nonce重複 | リプレイ攻撃 | リクエスト却下 |
| #2 | Prover応答なし | 障害 | →Seq#3 Emergency |
| #4 | Defense成功 | 正当 | Challenger Bond没収 |

---

## 📚 詳細参照先

各Sequenceの完全なシーケンス図・ステップ詳細は以下を参照：

`docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md`

---

**END OF REFERENCE**
