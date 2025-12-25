# Current Plan

> **Generated**: 2025-12-25 23:00 JST  
> **Phase**: 2 - Security Council + Token  
> **Month**: 7 / 24  
> **Week**: 4 (準備)

---

## 対象チェックリスト

`docs/planning/PHASE2_CHECKLIST.md`

---

## 前回レビュー課題

> CURRENT_STATE.mdより自動取得

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| - | ✅ | 全課題解決済み | - |

**注記**: PIR-P2-004 (Week 3 STARKVerifier v0.1 セキュリティレビュー) は **PASS** 済み。PIR会議実施待ち。

---

## 今回のスコープ

### 優先順位

```
1. 🟢 進行中タスクの継続（IMPL-005, INFRA-001）
2. 🟢 Phase 2.2 準備作業
3. 🟢 PIR-P2-004 PIR会議（05_pir.md で実行）
```

### 実装項目

- [ ] [IMPL-005] トレースCommitment検証 - STARKVerifier拡張
  - 状態: 🔄 IN PROGRESS
  - 担当: Engineer
  - 期限: 2025-12-31
  - 内容: `verifyTraceCommitment()` 関数実装
  
- [ ] [IMPL-006] STARKVerifier v0.1 → v0.2 拡張準備
  - 状態: ⬜ NOT STARTED
  - 担当: Engineer
  - 内容: 制約システム統合準備

### インフラ項目

- [ ] [INFRA-001] テストネット環境構築
  - 状態: ⬜ NOT STARTED
  - 担当: DevOps
  - 期限: 2025-12-31
  - 内容: Sepolia デプロイ準備
  - 依存: 複数RPC プロバイダ確保

### テスト項目

- [ ] [TEST-005] トレースCommitment検証テスト
  - 状態: ⬜ NOT STARTED
  - 担当: QA
  - 内容: `verifyTraceCommitment()` 単体テスト

- [ ] [TEST-006] テストネットデプロイテスト
  - 状態: ⬜ NOT STARTED
  - 担当: QA + DevOps
  - 内容: Sepolia デプロイスクリプト検証

### 参照ドキュメント

| 種類 | パス |
|------|------|
| 憲法 | `docs/constitution/CORE_PRINCIPLES.md` |
| Sequence | `docs/constitution/QUANTUM_SHIELD_SEQUENCES_v2.0_REF.md` |
| ZK-STARK実装計画 | `docs/planning/ZK_STARK_IMPLEMENTATION_PLAN.md` |
| Phase 2 Checklist | `docs/planning/PHASE2_CHECKLIST.md` |
| Gasベースライン | `docs/planning/GAS_BASELINE_P2.md` |

---

## 成果物

| ファイル | 説明 |
|---------|------|
| `contracts/src/STARKVerifier.sol` | トレースCommitment検証追加 (v0.2) |
| `contracts/test/STARKVerifier.t.sol` | 新規テストケース追加 |
| `scripts/deploy/` | テストネットデプロイスクリプト |
| `docs/planning/TESTNET_SETUP.md` | テストネット構築ドキュメント |

---

## 実行順序

### Step 1: PIR会議実行 (05_pir.md)
1. PIR-P2-004の正式PIR会議を実施
2. Week 3成果物の最終承認を得る

### Step 2: IMPL-005 トレースCommitment検証
1. ZK-STARK実装計画 Section 3.3 を確認
2. `STARKVerifier.sol` に `verifyTraceCommitment()` を追加
3. Merkle proof検証ロジック実装 (SHA3-256使用必須)
4. 単体テスト作成・実行

### Step 3: INFRA-001 テストネット準備
1. Sepolia RPCプロバイダ選定 (Alchemy/Infura)
2. デプロイスクリプト作成
3. テスト用ウォレット設定
4. 環境変数テンプレート作成

### Step 4: 統合確認
1. 全テスト実行 (既存 + 新規)
2. Gasベンチマーク更新
3. ドキュメント更新

### Step 5: レビュー準備
1. 04_review.md 用の成果物整理
2. CURRENT_STATE.md 更新

---

## Core Principles確認

| # | 原則 | 確認事項 | 判定 |
|---|------|----------|------|
| CP-1 | 完全量子耐性 | SHA3-256のみ使用、keccak256禁止 | ✅ 違反なし |
| CP-2 | Self-Custody | ユーザー秘密鍵のサーバー保管なし | ✅ 違反なし |
| CP-3 | Time Lock存在 | Time Lock無効化なし | ✅ 違反なし |
| CP-4 | Slashing存在 | Slashing削除なし | ✅ 違反なし |
| CP-5 | 透明性 | 全てオンチェーン検証可能 | ✅ 違反なし |

---

## リスク・懸念事項

| # | リスク | 重要度 | 対策 |
|---|--------|--------|------|
| 1 | トレース検証の複雑性 | MEDIUM | ZK-STARK計画Section 6参照、段階的実装 |
| 2 | Sepolia RPCの安定性 | LOW | 複数プロバイダ確保 |
| 3 | Gas目標未達リスク | MEDIUM | ベンチマーク継続監視 |

---

## 注意事項

### keccak256 禁止確認

以下のコードパターンは **絶対禁止** (CP-1違反):

```solidity
// ❌ PROHIBITED
bytes32 hash = keccak256(abi.encodePacked(...));

// ✅ REQUIRED
bytes32 hash = SHA3_256.hash(abi.encodePacked(...));
```

### 次のステップ

このプランに基づき、以下の順序で進行:

1. **05_pir.md** - PIR-P2-004 PIR会議実行
2. **03_impl.md** - IMPL-005 実装
3. **04_review.md** - セキュリティレビュー

---

**END OF CURRENT PLAN**
