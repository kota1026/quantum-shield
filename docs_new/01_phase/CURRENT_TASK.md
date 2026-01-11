# Task Definition

> **Generated**: 2026-01-11 (SEP v3)
> **Status**: Active

---

## 基本情報

| 項目 | 値 |
|------|-----|
| タスクID | TASK-P5-001 |
| タイトル | Challenge API + SDK 統合 |
| 対象Sequence | #4 Challenge + Slashing |
| 優先度 | 🔴 P0 |
| 見積り工数 | 2日 |

---

## 背景

### 現状分析

| 層 | コンポーネント | 状態 | 備考 |
|---|--------------|:----:|------|
| **L1 Contract** | `L1Vault.sol` | ✅ 完成 | challenge(), resolveChallenge(), autoResolveChallenge() |
| **L1 Contract** | テスト | ✅ 完成 | 28+ tests (L1VaultIntegration, E2E, Reentrancy) |
| **API** | `/v1/challenge/*` | ❌ 未実装 | routes/challenge.rs が存在しない |
| **React SDK** | `useChallenge()` | ❌ 未実装 | hooks がない |
| **UI** | Challenge画面 | ❌ 未確認 | モック確認必要 |

### CP-4 準拠状況

**CP-4**: "Slashingメカニズムの削除は不可"

| チェック | 状態 |
|---------|:----:|
| Slashing存在（Contract） | ✅ `_calculateSlash()` with N² × 10% |
| Slashing配分 | ✅ 60% Challenger, 20% Insurance, 20% Burn |
| 48h Defense Period | ✅ `DEFENSE_PERIOD = 48 hours` |

**結論**: CP-4は**違反していない**。Contract層は完成済み。API/SDK統合が必要。

---

## トレーサビリティ

### SEQUENCES §4 との対応

| Sequence Step | 仕様 | L1 Contract | API | SDK |
|--------------|------|:-----------:|:---:|:---:|
| §4.1 監視ボット異常検知 | Alert | - | ❌ | - |
| §4.2 Challenge提出 | challenge() | ✅ L660 | ❌ | ❌ |
| §4.3 Challenge Bond | MAX(0.1ETH, 1%) | ✅ L668-670 | ❌ | ❌ |
| §4.4 Defense期限設定 | 48h | ✅ L672 | ❌ | ❌ |
| §4.5 Defense提出 | submitDefense() | ✅ L704 | ❌ | ❌ |
| §4.6 自動解決 | autoResolveChallenge() | ✅ L830 | ❌ | ❌ |
| §4.7 Quadratic Slash | N² × 10% | ✅ L990-993 | ❌ | ❌ |
| §4.8 報酬分配 | 60/20/20 | ✅ L737-739 | ❌ | ❌ |

### 参照ファイル

| ファイル | 行 | 内容 |
|---------|:--:|------|
| `contracts/src/L1Vault.sol` | 660 | challenge() |
| `contracts/src/L1Vault.sol` | 704 | submitDefense() |
| `contracts/src/L1Vault.sol` | 721 | resolveChallenge() |
| `contracts/src/L1Vault.sol` | 830 | autoResolveChallenge() |
| `contracts/src/L1Vault.sol` | 990 | _calculateSlash() |
| `contracts/test/L1VaultIntegration.t.sol` | 550+ | Challenge tests |

---

## 完了条件

### 形式的条件
```
∀ challenge ∈ Challenges:
  - challenge.bond ≥ MAX(0.1 ETH, amount × 1%)
  - challenge.defenseDeadline = createdAt + 48 hours
  - challenge.slashRate = N² × 10%
```

### 実行条件

| # | 条件 | コマンド |
|---|------|---------|
| 1 | API ビルド成功 | `cargo build --release -p api` |
| 2 | API テスト成功 | `cargo test -p api` |
| 3 | React SDK ビルド成功 | `npm run build -w @quantum-shield/sdk-react` |
| 4 | E2E テスト成功 | `npm run test:e2e` |

### PIR条件
- 11エージェントレビュー PASS

---

## 実装項目

### 1. Challenge API (services/api/src/routes/challenge.rs)

```rust
// 新規作成: services/api/src/routes/challenge.rs

/// POST /v1/challenge
/// - lockId: bytes32
/// - fraudProof: bytes
/// → Bond計算、Contract呼び出し

/// POST /v1/challenge/{lockId}/defense
/// - defenseProof: bytes
/// → Prover認証、Contract呼び出し

/// GET /v1/challenge/{lockId}
/// → Challenge状態取得

/// POST /v1/challenge/{lockId}/auto-resolve
/// → Defense期限後の自動解決
```

### 2. React Hook (packages/sdk/react/src/useChallenge.ts)

```typescript
// 新規作成: packages/sdk/react/src/useChallenge.ts

export function useChallenge() {
  const submitChallenge = async (lockId: string, fraudProof: string) => {
    // API呼び出し
  };

  const submitDefense = async (lockId: string, defenseProof: string) => {
    // Prover認証 + API呼び出し
  };

  const getChallenge = async (lockId: string) => {
    // Challenge状態取得
  };

  return { submitChallenge, submitDefense, getChallenge };
}
```

### 3. API Client 更新 (packages/api-client/src/challenge.ts)

```typescript
// 新規作成: packages/api-client/src/challenge.ts

export class ChallengeClient {
  async submitChallenge(lockId: string, fraudProof: string): Promise<ChallengeResponse>;
  async submitDefense(lockId: string, defenseProof: string): Promise<DefenseResponse>;
  async getChallenge(lockId: string): Promise<Challenge>;
  async autoResolve(lockId: string): Promise<ResolveResponse>;
}
```

---

## WHY ドキュメント

### なぜ Contract は完成しているのに API が未実装なのか

| 理由 | 説明 |
|------|------|
| Phase 4 優先順位 | Consumer App MVP (Lock/Unlock) を優先した |
| Challenge 使用頻度 | 通常運用では発生しない（不正時のみ） |
| Security Council 依存 | resolveChallenge は Council 専用機能 |

### なぜ今実装するのか

| 理由 | 説明 |
|------|------|
| 仕様完全性 | SEQUENCES §4 の全フロー実装が必要 |
| 監視ボット連携 | 将来の監視ボットから呼び出す必要あり |
| Enterprise 要件 | Enterprise顧客は Challenge 機能を期待 |

---

## テスト項目

### API テスト (services/api/tests/challenge.rs)

| # | テスト | 内容 |
|---|--------|------|
| 1 | `test_submit_challenge_success` | 正常なChallenge提出 |
| 2 | `test_submit_challenge_insufficient_bond` | Bond不足でエラー |
| 3 | `test_submit_defense_success` | 正常なDefense提出 |
| 4 | `test_submit_defense_expired` | 期限切れでエラー |
| 5 | `test_get_challenge_exists` | Challenge状態取得 |
| 6 | `test_get_challenge_not_found` | 存在しないlockId |
| 7 | `test_auto_resolve_after_deadline` | 自動解決成功 |
| 8 | `test_auto_resolve_before_deadline` | 期限前でエラー |

### E2E テスト

| # | テスト | 内容 |
|---|--------|------|
| 1 | `test_e2e_challenge_flow` | UI → API → Contract 全フロー |
| 2 | `test_e2e_defense_flow` | Defense → Resolve 全フロー |

---

## 成果物

| ファイル | 説明 |
|---------|------|
| `services/api/src/routes/challenge.rs` | Challenge API |
| `services/api/src/routes/mod.rs` | ルート追加 |
| `services/api/tests/challenge.rs` | APIテスト |
| `packages/sdk/react/src/useChallenge.ts` | React Hook |
| `packages/api-client/src/challenge.ts` | APIクライアント |

---

## 実行順序

1. 既存 L1Vault.sol Challenge 実装を確認（読み取りのみ）
2. API routes/challenge.rs 作成
3. API mod.rs にルート追加
4. APIテスト作成・実行
5. API Client challenge.ts 作成
6. React Hook useChallenge.ts 作成
7. E2Eテスト作成・実行
8. イベントログ記録
9. PIRレビュー

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - SHA3-256 使用済み
- [x] CP-2: Self-Custody - 秘密鍵はクライアント側
- [x] CP-3: Time Lock存在 - 24h/7d 実装済み
- [x] CP-4: Slashing存在 - **Contract実装済み**
- [x] CP-5: 透明性 - L1オンチェーン

---

## 次のステップ

→ `21_impl_verify_loop.md` を実行（検証ループ付き実装）

---

**END OF TASK DEFINITION**
