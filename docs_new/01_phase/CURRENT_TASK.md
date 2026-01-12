# Task Definition

> **Generated**: 2026-01-12 (SEP v3)
> **Status**: Active

---

## 基本情報

| 項目 | 値 |
|------|-----|
| タスクID | TASK-P5-005 |
| タイトル | Chainlink VRF Prover選出統合 |
| 対象Sequence | #2 Unlock (Normal Path) §2.3-§2.4 |
| 優先度 | P0 |
| 見積り工数 | 3日 |

---

## 背景

### 現状分析

| 層 | コンポーネント | 状態 | 備考 |
|---|--------------|:----:|------|
| **L1 Contract** | `VRFConsumer.sol` | ✅ 完成 | Chainlink VRF v2.5互換、5分timeout、fallback実装 |
| **L1 Contract** | `ProverSelector.sol` | ✅ 完成 | Weighted random selection (stake-based) |
| **L1 Contract** | テスト | ✅ 完成 | VRFConsumer.t.sol, L1VaultVRFIntegrationTest.t.sol |
| **API** | `/v1/unlock` | ⚠️ 部分 | VRF連携なし、直接prover署名リクエスト |
| **API** | VRFサービス | ❌ 未実装 | VRFConsumer呼び出しサービスなし |
| **SDK** | useUnlock | ⚠️ 部分 | VRF状態監視なし |

### 仕様書との対応

**SEQUENCES §2 Unlock (Normal Path):**

| Step | 仕様 | L1 Contract | API | 状態 |
|------|------|:-----------:|:---:|:----:|
| §2.1 | Unlock Request | ✅ | ✅ | 実装済 |
| §2.2 | SR_1 Calculation | ✅ | ✅ | 実装済 |
| §2.3 | **VRF Prover Selection** | ✅ VRFConsumer | ❌ | **未統合** |
| §2.4 | **VRF Result Processing** | ✅ getSelectedProver | ❌ | **未統合** |
| §2.5 | 2/5 SPHINCS+ Signatures | ⚠️ | ⚠️ | 署名収集あり |
| §2.6 | 24h Time Lock | ✅ | ✅ | 実装済 |

---

## トレーサビリティ

### SEQUENCES §2.3-§2.4 との対応

```
§2.3 VRF Prover Selection:
├── VRF seed取得 (requestProverSelection) → VRFConsumer.sol:177 ✅
├── Chainlink VRF v2.5 callback → VRFConsumer.sol:262 ✅
├── 5分 timeout → VRF_TIMEOUT constant ✅
└── Fallback (prevrandao) → triggerFallback() ✅

§2.4 VRF Result Processing:
├── Weighted random selection → ProverSelector library ✅
├── 2/5 Prover選出 → selectProver() ✅
└── 選出結果返却 → getSelectedProver() ✅
```

### 参照ファイル

| ファイル | 行 | 内容 |
|---------|:--:|------|
| `contracts/src/VRFConsumer.sol` | 177 | requestProverSelection() |
| `contracts/src/VRFConsumer.sol` | 203 | getSelectedProver() |
| `contracts/src/VRFConsumer.sol` | 220 | triggerFallback() |
| `contracts/src/VRFConsumer.sol` | 276 | _fulfillRandomWords() |
| `contracts/src/libraries/ProverSelector.sol` | - | Weighted selection |
| `services/api/src/routes/unlock.rs` | 80-83 | request_prover_signatures() |

---

## ギャップ分析

### 現状の問題

```rust
// services/api/src/routes/unlock.rs:80-83
// 現在: VRFなしで直接署名リクエスト
state
    .request_prover_signatures(&unlock_id, &req.lock_id, &lock.sr_0, &sr_1)
    .await?;
```

**問題点:**
1. VRFConsumer.requestProverSelection()を呼んでいない
2. VRF結果を待っていない（5分timeout考慮なし）
3. 選出されたProverのみに署名リクエストを送っていない

### 必要な変更

```
┌─────────────────────────────────────────────────────────────────┐
│ Current Flow (問題あり):                                         │
│                                                                 │
│ Unlock Request → SR_1計算 → 全Proverに署名リクエスト → 24h待機    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Target Flow (SEQUENCES §2準拠):                                  │
│                                                                 │
│ Unlock Request → SR_1計算 → VRF Request → VRF Wait (max 5min)   │
│      → VRF Result → 2/5 Prover選出 → 選出Proverに署名リクエスト   │
│      → 24h待機                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 実装項目

### 1. VRFサービス作成

**ファイル**: `services/api/src/services/vrf_service.rs`

```rust
/// VRFConsumer contract との連携サービス
pub struct VRFService {
    contract_address: Address,
    provider: Provider<Http>,
}

impl VRFService {
    /// VRF Prover選出をリクエスト
    pub async fn request_prover_selection(
        &self,
        unlock_request_id: [u8; 32],
    ) -> Result<u256, VRFError>;

    /// 選出されたProverを取得
    pub async fn get_selected_prover(
        &self,
        unlock_request_id: [u8; 32],
    ) -> Result<(Address, u256), VRFError>;

    /// VRF完了を確認
    pub async fn is_prover_selected(
        &self,
        unlock_request_id: [u8; 32],
    ) -> Result<bool, VRFError>;

    /// Fallbackをトリガー（5分timeout後）
    pub async fn trigger_fallback(
        &self,
        unlock_request_id: [u8; 32],
    ) -> Result<Address, VRFError>;

    /// Timeout状態を確認
    pub async fn check_timeout(
        &self,
        unlock_request_id: [u8; 32],
    ) -> Result<(bool, u256), VRFError>;
}
```

### 2. Unlock APIの更新

**ファイル**: `services/api/src/routes/unlock.rs`

変更点:
1. VRF Request送信を追加
2. VRF状態ポーリング/WebSocket待機を追加
3. 選出Proverのみに署名リクエストを送信

```rust
// 7. Request VRF for Prover Selection (NEW)
let vrf_request_id = state.vrf_service
    .request_prover_selection(unlock_id_bytes)
    .await?;

// 8. Wait for VRF result (max 5 min) or trigger fallback
let selected_prover = match state.vrf_service
    .wait_for_selection(unlock_id_bytes, Duration::from_secs(300))
    .await
{
    Ok((prover, _)) => prover,
    Err(VRFError::Timeout) => {
        state.vrf_service.trigger_fallback(unlock_id_bytes).await?
    }
    Err(e) => return Err(e.into()),
};

// 9. Request signatures only from selected provers
state
    .request_selected_prover_signatures(
        &unlock_id,
        &req.lock_id,
        &lock.sr_0,
        &sr_1,
        selected_prover,
    )
    .await?;
```

### 3. UnlockResponseの拡張

```rust
pub struct UnlockResponse {
    // 既存フィールド...

    // 新規フィールド
    pub vrf_request_id: String,
    pub selected_provers: Vec<String>,
    pub vrf_status: VRFStatus,
}

pub enum VRFStatus {
    Pending,
    Fulfilled,
    FallbackUsed,
}
```

### 4. SDK更新

**ファイル**: `packages/sdk/react/src/useUnlock.ts`

```typescript
interface UnlockResult {
  // 既存...
  vrfRequestId: string;
  selectedProvers: string[];
  vrfStatus: 'pending' | 'fulfilled' | 'fallback';
}

// VRF状態監視Hook追加
export function useVRFStatus(unlockId: string) {
  const [status, setStatus] = useState<VRFStatus>('pending');
  const [selectedProvers, setSelectedProvers] = useState<string[]>([]);

  // Polling or WebSocket for VRF status
}
```

---

## 完了条件

### 形式的条件

```
∀ unlock ∈ NormalUnlocks:
  1. VRF.requestProverSelection(unlock.id) が呼ばれる
  2. VRF結果 or 5分timeout後にfallbackが発動
  3. 選出されたProverのみに署名リクエストが送られる
  4. Prover選出はstake-weighted random
```

### 実行条件

| # | 条件 | コマンド |
|---|------|---------|
| 1 | API ビルド成功 | `cargo build -p quantum-shield-api` |
| 2 | API テスト成功 | `cargo test -p quantum-shield-api -- vrf` |
| 3 | VRF統合テスト成功 | `cargo test -p quantum-shield-api -- unlock::vrf` |
| 4 | SDK ビルド成功 | `npm run build -w @quantum-shield/react` |

---

## テスト項目

### API テスト

| # | テスト | 内容 |
|---|--------|------|
| 1 | `test_unlock_triggers_vrf_request` | UnlockでVRFリクエスト発行 |
| 2 | `test_vrf_selection_returns_prover` | VRF完了でProver取得 |
| 3 | `test_vrf_timeout_triggers_fallback` | 5分後にfallback発動 |
| 4 | `test_only_selected_prover_receives_request` | 選出Proverのみに通知 |
| 5 | `test_vrf_status_polling` | VRF状態確認API |

### 統合テスト

| # | テスト | 内容 |
|---|--------|------|
| 1 | `test_e2e_unlock_with_vrf` | UI → API → VRF → Prover選出フロー |
| 2 | `test_e2e_vrf_fallback` | VRF timeout → fallback フロー |

---

## 成果物

| ファイル | 説明 |
|---------|------|
| `services/api/src/services/vrf_service.rs` | VRFサービス |
| `services/api/src/routes/unlock.rs` | VRF統合更新 |
| `services/api/src/types.rs` | VRFStatus追加 |
| `packages/sdk/react/src/useUnlock.ts` | VRF状態対応 |
| `packages/sdk/react/src/useVRFStatus.ts` | VRF状態Hook (optional) |

---

## 実行順序

1. 既存 VRFConsumer.sol 実装を確認（読み取りのみ）✅
2. VRF Service作成（vrf_service.rs）
3. Unlock API更新（unlock.rs VRF統合）
4. 型定義更新（types.rs VRFStatus）
5. APIテスト作成・実行
6. SDK更新（useUnlock.ts）
7. 統合テスト作成・実行
8. イベントログ記録
9. コミット・プッシュ

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - VRF自体は量子耐性不要（ランダム性のみ）
- [x] CP-2: Self-Custody - Prover選出は透明
- [x] CP-3: Time Lock存在 - 24h維持
- [x] CP-4: Slashing存在 - 不正Proverはslash対象
- [x] CP-5: 透明性 - VRF結果はオンチェーン

---

## 次のステップ

→ `21_impl_verify_loop.md` を実行（検証ループ付き実装）

---

**END OF TASK DEFINITION**
