# 26_phase5_planner.md - Phase 5 統合計画ステッププランナー

> **Version**: 1.0
> **Date**: 2026-01-11
> **Status**: Production Ready
> **Research Base**: SEP v3 + TASK-P5-001 実績

---

## 1. 目的

Phase 5統合計画を効率的に実行するためのステップ分解・優先順位付けプロンプト。

**対象**: PHASE5_INTEGRATION_PLAN.md (115日計画)

---

## 2. TASK-P5-001 実績からの示唆

### 2.1 成功パターン

| 示唆 | 詳細 | 適用 |
|-----|------|------|
| **事前コード分析** | Contract層が完成していることを発見 → 工数-10日 | 毎タスク開始時に既存実装を調査 |
| **Spec Traceability** | SEQUENCES §4 参照で要件漏れ防止 | 全タスクでSpec参照を明記 |
| **検証ループ早期実行** | ビルド→テスト→修正の即座実行 | Loop回数を事前設定 |
| **API + SDK 並行** | Backend/Frontend分離で並列化可能 | チーム分割計画に活用 |

### 2.2 避けるべきパターン

| 問題 | 発生箇所 | 対策 |
|-----|---------|------|
| **型不整合** | `u64 * u64` overflow | 型設計を先行レビュー |
| **既存シグネチャ不一致** | `update_lock_status` 引数数 | 既存API/Method先読み |
| **Package名誤り** | `api` → `quantum-shield-api` | Cargo.toml事前確認 |

---

## 3. プランニングフレームワーク

### 3.1 タスク分解構造

```
Phase 5.X → Task Group → Task → Subtask
    │            │          │        └── atomic implementation unit
    │            │          └── 1-2 day deliverable
    │            └── 3-5 day milestone
    └── 2-3 week phase gate
```

### 3.2 タスク定義テンプレート

```yaml
task_id: "TASK-P5-XXX"
name: "{機能名}"
phase: "5.X"
priority: "P0|P1|P2"

# === 仕様書トレーサビリティ ===
spec_refs:
  sequences: ["§X.Y", "§X.Z"]
  core_principles: ["CP-X"]
  unified_spec: ["§SectionName"]

# === 既存実装調査 ===
existing_code_check:
  contracts: ["L1Vault.sol:XXX", "..."]
  api: ["services/api/src/routes/..."]
  sdk: ["packages/sdk/.../..."]
  archive: ["_archive/..."]  # 完動コード参照

# === ギャップ分析 ===
gap:
  what_exists: "..."
  what_missing: "..."
  estimated_effort: "X days"

# === 実装項目 ===
deliverables:
  - "ファイル/エンドポイント 1"
  - "ファイル/エンドポイント 2"

# === 検証基準 ===
verification:
  build: "cargo build / npm run build"
  tests: "cargo test / npm test"
  static_analysis: "slither / clippy"
  e2e: "統合テスト項目"

# === 完了条件 ===
done_when:
  - "テスト全パス"
  - "既存テスト未破壊"
  - "Spec準拠確認"
```

---

## 4. Phase 5 タスク分解

### 4.1 Phase 5.0: ブロッカー解消 (31日 → 並列化で10-15日)

#### 優先度マトリクス

```
                    高インパクト
                         │
    ┌────────────────────┼────────────────────┐
    │  STARK Prover移行   │  L3 Production     │
    │  (Archive移行)      │  (4-node network)  │
高  │                    │                    │
緊  ├────────────────────┼────────────────────┤
急  │  React SDK WASM    │  Event Bridge      │
度  │  (UI全滅防止)       │  (リアルタイム)     │
    │                    │                    │
低  ├────────────────────┼────────────────────┤
    │  Challenge API     │  SPHINCS+検証      │
    │  (CP-4必須)         │                    │
    └────────────────────┴────────────────────┘
                    低インパクト
```

#### 並列実行プラン

```
Week 1-2:
┌─────────────────────────────────────────────────────────────┐
│ Team A (Backend)     │ Team B (Frontend)   │ Team C (L3)   │
├─────────────────────────────────────────────────────────────┤
│ STARK Prover移行     │ React WASM Init     │ fips204移行    │
│ (5日)                │ (2日)               │ (3日)          │
│                      │ React Hooks実装     │ Node Wiring    │
│                      │ (3日)               │ (4日)          │
├─────────────────────────────────────────────────────────────┤
│ Challenge API        │                     │ TLS 1.3 mTLS   │
│ (5日) ✅ DONE        │                     │ (3日)          │
│                      │                     │ L1 State Root  │
│                      │                     │ (3日)          │
└─────────────────────────────────────────────────────────────┘

Week 3:
┌─────────────────────────────────────────────────────────────┐
│ Team A               │ Team B              │ Team C         │
├─────────────────────────────────────────────────────────────┤
│ Chainlink VRF統合    │ useChallenge完成    │ L3 E2E Test   │
│ (3日)                │ ✅ DONE             │ (2日)          │
│                      │                     │                │
│ 監視ボット           │ SDK E2E Test        │                │
│ (3日)                │ (2日)               │                │
└─────────────────────────────────────────────────────────────┘
```

#### タスク詳細

##### TASK-P5-002: STARK Prover移行

```yaml
task_id: "TASK-P5-002"
name: "STARK Prover Archive移行統合"
phase: "5.0"
priority: "P0"

spec_refs:
  sequences: []
  core_principles: []
  unified_spec: ["§STARK Verification"]

existing_code_check:
  contracts:
    - "contracts/src/STARKVerifier.sol (660 lines) ✅"
    - "contracts/src/FRIVerifier.sol (342 lines) ✅"
  api:
    - "stark-prover/src/main.rs:481-499 (STUB)"
  archive:
    - "_archive/v1-stark-native/prover.rs (242 lines) ✅ Winterfell"
    - "_archive/v1-stark-native/air.rs (1,027 lines) ✅"
    - "_archive/v1-stark-native/trace.rs (1,559 lines) ✅"

gap:
  what_exists: "L1検証器完成、Archive完動Prover"
  what_missing: "現行stark-proverサービスがSTUB"
  estimated_effort: "5 days (移行のみ、新規実装不要)"

deliverables:
  - "stark-prover/src/lib.rs (Winterfell Prover統合)"
  - "stark-prover/src/main.rs (HTTP API)"
  - "stark-prover/tests/integration_test.rs"

verification:
  build: "cargo build -p stark-prover"
  tests: "cargo test -p stark-prover"
  e2e: "証明生成 → L1検証器で検証成功"

done_when:
  - "証明生成時間 < 30秒"
  - "L1 STARKVerifier.verify() 成功"
  - "既存contracts/testで regression なし"
```

##### TASK-P5-003: React SDK WASM統合

```yaml
task_id: "TASK-P5-003"
name: "React SDK WASM初期化とHook実装"
phase: "5.0"
priority: "P0"

spec_refs:
  core_principles: ["CP-1", "CP-2"]

existing_code_check:
  sdk:
    - "packages/sdk/wasm/src/lib.rs ✅ 完成 (fips204)"
    - "packages/sdk/typescript/src/crypto.ts ✅ 完成"
    - "packages/sdk/react/src/QuantumShieldProvider.tsx (WASM未初期化)"
    - "packages/sdk/react/src/useDilithium.ts (モック)"

gap:
  what_exists: "WASM module完成、TypeScript wrapper完成"
  what_missing: "React Provider内でのWASM初期化"
  estimated_effort: "5 days"

deliverables:
  - "packages/sdk/react/src/QuantumShieldProvider.tsx (WASM init)"
  - "packages/sdk/react/src/useDilithium.ts (実装)"
  - "packages/sdk/react/src/useWallet.ts (実署名)"

verification:
  build: "npm run build -w @quantum-shield/react"
  tests: "npm test -w @quantum-shield/react"
  e2e: "UI → 実署名 → API検証成功"

done_when:
  - "useDilithium.sign() が実署名を返す"
  - "API側で署名検証成功"
  - "TypeScript型エラーなし"
```

##### TASK-P5-004: L3 Production Mode

```yaml
task_id: "TASK-P5-004"
name: "L3 Aegis Production Mode完成"
phase: "5.0"
priority: "P0"

spec_refs:
  sequences: ["§1", "§2", "§3"]
  core_principles: ["CP-1", "CP-5"]
  unified_spec: ["§L3 Architecture"]

existing_code_check:
  l3:
    - "l3-aegis/crates/aegis-consensus/ ✅ 4BFT完成"
    - "l3-aegis/crates/aegis-node/src/node.rs (TODOs多数)"
    - "l3-aegis/crates/aegis-network/src/transport.rs:37 (TLS未実装)"
    - "l3-aegis/crates/aegis-sequencer/src/sequencer.rs:255-281 (TODOs)"

gap:
  what_exists: "Consensus, Mempool, BatchBuilder完成"
  what_missing: "4-node network, TLS, L1提出"
  estimated_effort: "10 days"

subtasks:
  - name: "fips204ライブラリ移行"
    effort: "3 days"
    files: ["aegis-crypto/Cargo.toml", "aegis-consensus/Cargo.toml"]
  - name: "Node Wiring完成"
    effort: "4 days"
    files: ["aegis-node/src/node.rs"]
  - name: "TLS 1.3 mTLS実装"
    effort: "3 days"
    files: ["aegis-network/src/transport.rs"]

done_when:
  - "4ノードネットワーク起動成功"
  - "TLS mTLS接続確認"
  - "L1 State Root提出成功"
```

##### TASK-P5-005: Chainlink VRF統合

```yaml
task_id: "TASK-P5-005"
name: "Chainlink VRF Prover選出"
phase: "5.0"
priority: "P0"

spec_refs:
  sequences: ["§2.3", "§2.4"]
  unified_spec: ["§VRF Integration"]

existing_code_check:
  contracts:
    - "contracts/src/VRFConsumer.sol ✅ 存在"
  api:
    - "services/api/src/routes/unlock.rs (VRF未統合)"

gap:
  what_exists: "VRFConsumer.sol存在"
  what_missing: "API層でのVRF呼び出し、Prover選出ロジック"
  estimated_effort: "3 days"

deliverables:
  - "services/api/src/services/vrf_service.rs"
  - "services/api/src/routes/unlock.rs (VRF統合)"

done_when:
  - "Unlock時にVRFでProver 2/5選出"
  - "選出されたProverのみ署名可能"
```

---

### 4.2 Phase 5.1-5.5 タスク要約

#### Phase 5.1: 基盤整備 (10日)

| Task ID | 名前 | 工数 | 依存 |
|---------|-----|:----:|------|
| TASK-P5-010 | EditionConfig.sol | 3日 | - |
| TASK-P5-011 | ProverRegistry.sol | 4日 | - |
| TASK-P5-012 | 認証基盤 (SIWE→JWT) | 2日 | - |
| TASK-P5-013 | API Client認証統合 | 1日 | P5-012 |

#### Phase 5.2: コアAPI (12日)

| Task ID | 名前 | 工数 | 依存 |
|---------|-----|:----:|------|
| TASK-P5-020 | Consumer App API (6 EP) | 3日 | P5-012 |
| TASK-P5-021 | Token Hub API (9 EP) | 5日 | P5-012 |
| TASK-P5-022 | Prover Portal API (9 EP) | 4日 | P5-012 |

#### Phase 5.3: 管理系API (15日)

| Task ID | 名前 | 工数 | 依存 |
|---------|-----|:----:|------|
| TASK-P5-030 | QS Admin API (11 EP) | 5日 | P5-012 |
| TASK-P5-031 | Enterprise Admin API (19 EP) | 7日 | P5-012 |
| TASK-P5-032 | Enterprise申込フロー | 3日 | P5-031 |

#### Phase 5.4: 補完機能 (32日)

| Task ID | 名前 | 工数 | 依存 |
|---------|-----|:----:|------|
| TASK-P5-040 | Governance API (8 EP) | 4日 | P5-012 |
| TASK-P5-041 | Observer API (8 EP) | 4日 | P5-001 |
| TASK-P5-042 | Explorer API (12 EP) | 5日 | - |
| TASK-P5-043 | Event Bridge完成 | 8日 | - |
| TASK-P5-044 | SPHINCS+検証実装 | 2日 | - |
| TASK-P5-045 | i18n対応 | 5日 | - |
| TASK-P5-046 | 監視ボット | 3日 | P5-001 |

#### Phase 5.5: 統合・テスト (15日)

| Task ID | 名前 | 工数 | 依存 |
|---------|-----|:----:|------|
| TASK-P5-050 | UI ↔ API 統合 | 5日 | All APIs |
| TASK-P5-051 | E2Eテスト | 5日 | P5-050 |
| TASK-P5-052 | Edition切替テスト | 2日 | P5-010 |
| TASK-P5-053 | 本番デプロイ準備 | 3日 | P5-051 |

---

## 5. 検証ループ設定

### 5.1 タスク種類別ループ上限

| タスク種類 | 最大Loop | 理由 |
|-----------|:-------:|------|
| Contract実装 | 5 | slither/mythril必須 |
| API実装 | 3 | cargo test + manual |
| SDK実装 | 3 | npm test + 型チェック |
| 統合テスト | 2 | E2E重視 |

### 5.2 ループ失敗時のエスカレーション

```
Loop 1-2: 自動修正試行
Loop 3: 設計見直し
Loop 4: 部分実装で先行、残りを別タスク化
Loop 5: 人間介入要請 + CURRENT_STATE.md更新
```

---

## 6. 使用方法

### 6.1 セッション開始時

```markdown
## 本日のタスク

1. PHASE5_INTEGRATION_PLAN.md を確認
2. 26_phase5_planner.md のタスク分解を参照
3. 次の未完了タスクを選択:
   - Task ID: TASK-P5-XXX
   - Phase: 5.X
   - Priority: PX
4. 20_task_define.md でタスク定義作成
5. 21_impl_verify_loop.md で実装開始
```

### 6.2 タスク完了時

```markdown
## タスク完了報告

- Task ID: TASK-P5-XXX
- 結果: PASS/FAIL
- 検証ループ回数: N
- 成果物:
  - ファイル1
  - ファイル2
- 次のタスク: TASK-P5-YYY
```

---

## 7. 進捗トラッキング

### 7.1 Phase 5.0 進捗（2026-01-11時点）

| Task ID | 名前 | 状態 | 完了日 |
|---------|-----|:----:|-------|
| TASK-P5-001 | Challenge API + SDK | ✅ DONE | 2026-01-11 |
| TASK-P5-002 | STARK Prover移行 | ⏳ TODO | - |
| TASK-P5-003 | React SDK WASM | ⏳ TODO | - |
| TASK-P5-004 | L3 Production Mode | ⏳ TODO | - |
| TASK-P5-005 | Chainlink VRF | ⏳ TODO | - |

### 7.2 全体進捗

```
Phase 5.0: ██░░░░░░░░░░░░░░░░░░ 3% (1/31日)
Phase 5.1: ░░░░░░░░░░░░░░░░░░░░ 0%
Phase 5.2: ░░░░░░░░░░░░░░░░░░░░ 0%
Phase 5.3: ░░░░░░░░░░░░░░░░░░░░ 0%
Phase 5.4: ░░░░░░░░░░░░░░░░░░░░ 0%
Phase 5.5: ░░░░░░░░░░░░░░░░░░░░ 0%
───────────────────────────────
Total:     ██░░░░░░░░░░░░░░░░░░ 1% (1/115日)
```

---

## 8. 次のアクション推奨

### 8.1 即座実行可能（依存なし）

1. **TASK-P5-002**: STARK Prover移行 - Archive完動コードあり
2. **TASK-P5-003**: React SDK WASM - WASM module完成済み
3. **TASK-P5-010**: EditionConfig.sol - 独立実装可能

### 8.2 並列実行推奨

```
Team A: TASK-P5-002 (Backend/Rust)
Team B: TASK-P5-003 (Frontend/TypeScript)
Team C: TASK-P5-004 (L3/Rust)
```

---

**END OF 26_phase5_planner.md**
