# Sequence #1: Lock - Implementation Checklist

> **Spec Reference**: `docs/constitution/QUANTUM_SHIELD_SEQUENCES_v2.0.md` §Sequence #1  
> **Status**: Not Started  
> **Last Updated**: 2025-12-23

---

## 1. Data Structures

| # | Item | Spec Reference | Confirmed | Artifact (Path/Commit) |
|---|------|----------------|-----------|------------------------|
| 1.1 | Lock Request構造体定義 | SEQUENCES §Lock > Data構造 | [ ] | |
| 1.2 | SR_0計算式実装 | SEQUENCES §Lock > Data構造 | [ ] | |
| 1.3 | SHA3-256使用確認（keccak256禁止） | CORE_PRINCIPLES §C2 | [ ] | |
| 1.4 | chain_id検証ロジック | SEQUENCES §Lock | [ ] | |
| 1.5 | nonce管理（リプレイ防止） | SEQUENCES §Lock | [ ] | |
| 1.6 | expiry検証ロジック | SEQUENCES §Lock | [ ] | |

---

## 2. Dilithium Integration

| # | Item | Spec Reference | Confirmed | Artifact (Path/Commit) |
|---|------|----------------|-----------|------------------------|
| 2.1 | Dilithium公開鍵フォーマット | FIPS 204 | [ ] | |
| 2.2 | Dilithium署名検証関数 | FIPS 204 | [ ] | |
| 2.3 | pk_dilithiumの保存 | SEQUENCES §Lock | [ ] | |
| 2.4 | 署名検証失敗時のエラーハンドリング | SEQUENCES §Lock > Error | [ ] | |

---

## 3. L3 Aegis (BFT Consensus)

| # | Item | Spec Reference | Confirmed | Artifact (Path/Commit) |
|---|------|----------------|-----------|------------------------|
| 3.1 | 4ノードBFT合意プロトコル | SEQUENCES §Lock | [ ] | |
| 3.2 | SMT (Sparse Merkle Tree) 追加 | SEQUENCES §Lock | [ ] | |
| 3.3 | lock_id生成ロジック | SEQUENCES §Lock | [ ] | |
| 3.4 | SR_0記録 | SEQUENCES §Lock | [ ] | |

---

## 4. L1 Vault Integration

| # | Item | Spec Reference | Confirmed | Artifact (Path/Commit) |
|---|------|----------------|-----------|------------------------|
| 4.1 | Deposit関数 | SEQUENCES §Lock | [ ] | |
| 4.2 | ERC20 Transfer処理 | SEQUENCES §Lock | [ ] | |
| 4.3 | lock_id検証 | SEQUENCES §Lock | [ ] | |
| 4.4 | SR_0記録（L1側） | SEQUENCES §Lock | [ ] | |
| 4.5 | Locked Event発行 | SEQUENCES §Lock | [ ] | |
| 4.6 | Gas見積もり（~135K target） | SEQUENCES §Appendix | [ ] | |

---

## 5. Synchronization

| # | Item | Spec Reference | Confirmed | Artifact (Path/Commit) |
|---|------|----------------|-----------|------------------------|
| 5.1 | L1→L3同期通知 | SEQUENCES §Lock Step 5 | [ ] | |
| 5.2 | 同期失敗時のResyncトリガー | SEQUENCES §Lock > Error | [ ] | |

---

## 6. Error Handling

| # | Item | Spec Reference | Confirmed | Artifact (Path/Commit) |
|---|------|----------------|-----------|------------------------|
| 6.1 | Dilithium検証失敗 → リクエスト却下 | SEQUENCES §Lock > Error | [ ] | |
| 6.2 | nonce重複 → リクエスト却下 | SEQUENCES §Lock > Error | [ ] | |
| 6.3 | expiry超過 → リクエスト却下 | SEQUENCES §Lock > Error | [ ] | |

---

## 7. Tests

| # | Item | Type | Confirmed | Artifact (Path/Commit) |
|---|------|------|-----------|------------------------|
| 7.1 | Lock正常系テスト | Unit | [ ] | |
| 7.2 | Dilithium署名検証テスト | Unit | [ ] | |
| 7.3 | nonce重複テスト | Unit | [ ] | |
| 7.4 | expiry超過テスト | Unit | [ ] | |
| 7.5 | Gas消費量テスト | Integration | [ ] | |
| 7.6 | L3-L1同期テスト | Integration | [ ] | |

---

## Review Sign-off

| Role | Reviewer | Date | Status |
|------|----------|------|--------|
| Engineer | - | - | ⬜ |
| CTO | - | - | ⬜ |
| Red Team | - | - | ⬜ |
| Chief Cryptographer | - | - | ⬜ |

---

## PIR Decision

| Meeting ID | Date | Decision | Notes |
|------------|------|----------|-------|
| - | - | - | - |

---

**END OF CHECKLIST**
