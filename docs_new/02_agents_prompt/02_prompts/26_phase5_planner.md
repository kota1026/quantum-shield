# 26_phase5_planner.md - Phase 5 統合計画ステッププランナー

> **Version**: 2.0
> **Date**: 2026-01-12
> **Status**: Production Ready
> **Research Base**: SEP v3 + TASK-P5-001〜004 実績

---

## 1. 目的

Phase 5統合計画を効率的に実行するためのステップ分解・優先順位付けプロンプト。

**対象**: PHASE5_INTEGRATION_PLAN.md (115日計画)

---

## 2. 実績からの示唆

### 2.1 成功パターン（P5-001〜004から）

| 示唆 | 詳細 | 適用 |
|-----|------|------|
| **事前コード分析** | Contract層が完成していることを発見 → 工数削減 | 毎タスク開始時に既存実装を調査 |
| **Archive活用** | _archive/v1-stark-native/の完動コード移行で工数削減 | 既存実装の再利用優先 |
| **Spec Traceability** | SEQUENCES §4 参照で要件漏れ防止 | 全タスクでSpec参照を明記 |
| **検証ループ早期実行** | ビルド→テスト→修正の即座実行 | Loop回数を事前設定 |
| **API + SDK 並行** | Backend/Frontend分離で並列化可能 | チーム分割計画に活用 |

### 2.2 避けるべきパターン

| 問題 | 発生箇所 | 対策 |
|-----|---------|------|
| **型不整合** | `u64 * u64` overflow | 型設計を先行レビュー |
| **既存シグネチャ不一致** | `update_lock_status` 引数数 | 既存API/Method先読み |
| **Package名誤り** | `api` → `quantum-shield-api` | Cargo.toml事前確認 |
| **メソッド未存在** | `NodeId::is_zero()` → `as_bytes()` check | 既存型のメソッド確認 |

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

### 3.2 タスク定義テンプレート（SEP v3準拠）

```yaml
task_id: "TASK-P5-XXX"
name: "{機能名}"
phase: "5.X"
priority: "P0|P1|P2"
status: "TODO|IN_PROGRESS|DONE"

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

# === 完了記録（完了時のみ） ===
completion:
  date: "YYYY-MM-DD"
  commit: "xxxxxxxx"
  artifacts: ["ファイル1", "ファイル2"]
  tests_passed: N
```

---

## 4. Phase 5.0: ブロッカー解消（71%完了）

> **注意**: タスク番号はTASK_P5_FULL_LIST.mdと統一

### 4.1 完了タスク

#### TASK-P5-001: STARK Prover Archive移行 ✅ DONE

```yaml
task_id: "TASK-P5-001"
name: "STARK Prover Archive移行"
phase: "5.0"
priority: "P0"
status: "DONE"

spec_refs:
  unified_spec: ["§STARK Verification", "§2.5.1"]

existing_code_check:
  contracts:
    - "contracts/src/STARKVerifier.sol (660 lines) ✅"
    - "contracts/src/FRIVerifier.sol (342 lines) ✅"
  archive:
    - "_archive/v1-stark-native/prover.rs (242 lines) ✅ Winterfell"

deliverables:
  - "circuits/dilithium-stark/src/stark/constants.rs"
  - "circuits/dilithium-stark/src/stark/air.rs"
  - "circuits/dilithium-stark/src/stark/trace.rs"
  - "circuits/dilithium-stark/src/stark/prover.rs"

completion:
  date: "2026-01-11"
  commit: "93952edb"
```

#### TASK-P5-002: stark-prover HTTPサービス化 ✅ DONE

```yaml
task_id: "TASK-P5-002"
name: "stark-prover HTTPサービス化"
phase: "5.0"
priority: "P0"
status: "DONE"
depends_on: ["TASK-P5-001"]

deliverables:
  - "stark-prover/src/main.rs (801 lines)"
    - "POST /prove"
    - "POST /winterfell/prove"
    - "POST /winterfell/verify"
    - "GET /status/:job_id"
    - "GET /proof/:job_id"

completion:
  date: "2026-01-11"
  commit: "93952edb"
```

#### TASK-P5-003: React WASM初期化実装 ✅ DONE

```yaml
task_id: "TASK-P5-003"
name: "React WASM初期化実装"
phase: "5.0"
priority: "P0"
status: "DONE"

spec_refs:
  core_principles: ["CP-1", "CP-2"]

deliverables:
  - "packages/sdk/react/src/wasm.ts (206 lines)"
    - loadWasm(), initializeWasm(), getWasm()
    - keygen(), sign(), verify(), sha3_256()

completion:
  date: "2026-01-11"
  commit: "f034edec"
```

#### TASK-P5-004: React Hooks実Crypto実装 ✅ DONE

```yaml
task_id: "TASK-P5-004"
name: "React Hooks実Crypto実装"
phase: "5.0"
priority: "P0"
status: "DONE"
depends_on: ["TASK-P5-003"]

deliverables:
  - "packages/sdk/react/src/useDilithium.ts (182 lines)"
    - ML-DSA-65 署名/検証
    - モックフォールバック付き

completion:
  date: "2026-01-11"
  commit: "f034edec"
```

#### TASK-P5-008: L3 fips204クレート移行 ✅ DONE

```yaml
task_id: "TASK-P5-008"
name: "L3 fips204クレート移行"
phase: "5.0"
priority: "P0"
status: "DONE"

spec_refs:
  core_principles: ["CP-1"]

deliverables:
  - "l3-aegis/crates/aegis-crypto/src/dilithium.rs"
    - fips204 = "0.4.0" 統合
    - ML-DSA-65 キー生成/署名

completion:
  date: "2026-01-11"
  commit: "e63e940c"
```

---

### 4.2 残タスク

#### TASK-P5-009: L3 Production Mode完成 ⏳ 80%

```yaml
task_id: "TASK-P5-009"
name: "L3 Production Mode完成"
phase: "5.0"
priority: "P0"
status: "IN_PROGRESS"
depends_on: ["TASK-P5-008"]

spec_refs:
  sequences: ["§1", "§2", "§3"]
  core_principles: ["CP-1", "CP-5"]

existing_implementation:
  - "l3-aegis/crates/aegis-node/src/node.rs (基本フレーム完成)"
  - "run_production_mode() 実装済み"
  - "TLS 1.3 mTLS 実装済み"

remaining:
  - "コンセンサスエンジン統合 (スタブ→実装)"
  - "RPCサーバー実装"
  - "4ノードネットワーク起動テスト"

estimated_effort: "3-5日"
```

#### TASK-P5-014: Challenge + Slashing実装 ⏳ 90%

```yaml
task_id: "TASK-P5-014"
name: "Challenge + Slashing実装"
phase: "5.0"
priority: "P0"
status: "IN_PROGRESS"

spec_refs:
  sequences: ["§4 Challenge + Slashing"]
  core_principles: ["CP-4"]

existing_implementation:
  - "services/api/src/routes/challenge.rs (508 lines)"
    - POST /v1/challenge
    - POST /v1/challenge/:lock_id/defense
    - POST /v1/challenge/:lock_id/auto-resolve
  - "Quadratic Slashing実装済み (N² × 10%)"

remaining:
  - "マージコンフリクト解決"
  - "packages/sdk/react/src/useChallenge.ts 統合"

estimated_effort: "1-2日"
```

---

### 4.3 Phase 5.1で完了済み（参考）

#### TASK-P5-005: Chainlink VRF統合 ✅ DONE

```yaml
task_id: "TASK-P5-005"
name: "Chainlink VRF Prover選出"
phase: "5.0"
priority: "P0"
status: "TODO"

spec_refs:
  sequences: ["§2.3 VRF Prover Selection", "§2.4 VRF Result Processing"]
  core_principles: []
  unified_spec: ["§VRF Integration", "§Prover Selection Algorithm"]

existing_code_check:
  contracts:
    - "contracts/src/VRFConsumer.sol ✅ 存在"
    - "contracts/src/QuantumShield.sol (VRF呼び出しあり?)"
  api:
    - "services/api/src/routes/unlock.rs (VRF未統合)"
  l3:
    - "l3-aegis/crates/aegis-types/src/lib.rs (Prover types)"

gap:
  what_exists: "VRFConsumer.sol存在"
  what_missing: "API層でのVRF呼び出し、2/5 Prover選出ロジック"
  estimated_effort: "3 days"

deliverables:
  - "services/api/src/services/vrf_service.rs"
  - "services/api/src/routes/unlock.rs (VRF統合)"
  - "VRF → Prover選出 → SPHINCS+署名収集フロー"

verification:
  build: "cargo build -p quantum-shield-api"
  tests: "cargo test -p quantum-shield-api -- vrf"
  e2e: "Unlock時に2/5 Prover選出確認"

done_when:
  - "Unlock時にVRFでProver 2/5選出"
  - "選出されたProverのみ署名可能"
  - "SEQUENCES §2準拠"
```

#### TASK-P5-006: Event Bridge完成 ⏳ TODO

```yaml
task_id: "TASK-P5-006"
name: "Event Bridge WebSocket/MQ統合"
phase: "5.0"
priority: "P1"
status: "TODO"

spec_refs:
  sequences: ["§1", "§2"]
  unified_spec: ["§Real-time Notifications"]

existing_code_check:
  event_bridge:
    - "services/event-bridge/src/indexer/listener.rs (Polling only)"
    - "services/event-bridge/src/rabbitmq_client.rs (STUB)"
    - "services/event-bridge/src/redis_client.rs (TODOs)"
    - "services/event-bridge/src/queue.rs:93 (empty vec)"

gap:
  what_exists: "Polling機能のみ動作"
  what_missing: "WebSocket, RabbitMQ publish, Redis実装, L3 listener"
  estimated_effort: "8 days"

deliverables:
  - "services/event-bridge/src/websocket/mod.rs"
  - "services/event-bridge/src/rabbitmq_client.rs (完成)"
  - "services/event-bridge/src/redis_client.rs (完成)"
  - "services/event-bridge/src/l3_listener.rs"

verification:
  build: "cargo build -p event-bridge"
  tests: "cargo test -p event-bridge"
  e2e: "L1→L3→L1 イベント伝播確認"

done_when:
  - "WebSocket通知動作"
  - "RabbitMQ/Redis統合完了"
  - "L3イベント取得成功"
```

#### TASK-P5-007: SPHINCS+検証実装 ⏳ TODO

```yaml
task_id: "TASK-P5-007"
name: "SPHINCS+公開鍵検証実装"
phase: "5.0"
priority: "P1"
status: "TODO"

spec_refs:
  sequences: ["§5 Prover Registration"]
  core_principles: ["CP-1"]
  unified_spec: ["§SPHINCS+ Integration"]

existing_code_check:
  api:
    - "services/api/src/routes/prover.rs:88-91 (prefix check only)"
  contracts:
    - "contracts/src/SPHINCSVerifier.sol ✅"

gap:
  what_exists: "L1検証器完成、API側はprefix checkのみ"
  what_missing: "実際のSPHINCS+公開鍵検証、HSM attestation検証"
  estimated_effort: "2 days"

deliverables:
  - "services/api/src/services/sphincs_service.rs"
  - "services/api/src/routes/prover.rs (検証強化)"

verification:
  build: "cargo build -p quantum-shield-api"
  tests: "cargo test -p quantum-shield-api -- sphincs"

done_when:
  - "SPHINCS+公開鍵フォーマット検証"
  - "HSM attestation検証 (optional)"
  - "不正な公開鍵でのProver登録拒否"
```

---

## 5. Phase 5.1: 基盤整備 (10日)

#### TASK-P5-010: EditionConfig.sol ⏳ TODO

```yaml
task_id: "TASK-P5-010"
name: "EditionConfig.sol 実装"
phase: "5.1"
priority: "P0"
status: "TODO"

spec_refs:
  unified_spec: ["§Edition Switch", "§Node Expansion", "§Enterprise Edition"]

existing_code_check:
  contracts:
    - "contracts/src/core/ (EditionConfig未実装)"
    - "l3-aegis/src/governance/GovernanceSwitch.sol ✅"

gap:
  what_exists: "GovernanceSwitch.sol (L3)"
  what_missing: "L1 EditionConfig.sol"
  estimated_effort: "3 days"

deliverables:
  - "contracts/src/core/EditionConfig.sol"
    - Edition enum (ENTERPRISE, DECENTRALIZED)
    - ConsensusType enum (FIXED_4BFT, DYNAMIC_PBFT)
    - ProverApprovalMode enum (CONTRACT_BASED, FOUNDATION_INVITE, COUNCIL_VOTE, STAKE_AUTO)
    - switchEdition(), getSettings()
  - "contracts/test/EditionConfig.t.sol"

verification:
  build: "forge build"
  tests: "forge test --match-contract EditionConfigTest"
  static_analysis: "slither contracts/src/core/EditionConfig.sol"

done_when:
  - "Edition切替機能動作"
  - "Phase 1-4の承認モード対応"
  - "slither警告なし"
```

#### TASK-P5-011: ProverRegistry.sol ⏳ TODO

```yaml
task_id: "TASK-P5-011"
name: "ProverRegistry.sol 実装"
phase: "5.1"
priority: "P0"
status: "TODO"

spec_refs:
  sequences: ["§5 Prover Registration", "§6 Prover Exit"]
  unified_spec: ["§Prover Management"]

existing_code_check:
  contracts:
    - "contracts/src/prover/ (未実装)"
  api:
    - "services/api/src/routes/prover.rs (基本実装)"

gap:
  what_exists: "API側の基本登録エンドポイント"
  what_missing: "L1 ProverRegistry.sol"
  estimated_effort: "4 days"

deliverables:
  - "contracts/src/prover/ProverRegistry.sol"
    - Prover struct (operator, sphincsPublicKey, stake, status, totalSignatures, slashCount)
    - register(), approve(), autoApprove(), slash(), exit()
    - Unbonding period (7 days)
  - "contracts/test/ProverRegistry.t.sol"

verification:
  build: "forge build"
  tests: "forge test --match-contract ProverRegistryTest"
  static_analysis: "slither contracts/src/prover/ProverRegistry.sol"

done_when:
  - "Prover登録・承認フロー動作"
  - "Slashing機能動作"
  - "7日Unbonding期間実装"
```

#### TASK-P5-012: 認証基盤 (SIWE→JWT) ⏳ TODO

```yaml
task_id: "TASK-P5-012"
name: "SIWE→JWT認証基盤"
phase: "5.1"
priority: "P0"
status: "TODO"

spec_refs:
  unified_spec: ["§Authentication"]

existing_code_check:
  api:
    - "services/api/src/routes/auth.rs (未実装)"
    - "services/api/src/middleware/ (JWT未実装)"

gap:
  what_exists: "基本的なルート構造"
  what_missing: "SIWE検証、JWT発行/検証"
  estimated_effort: "2 days"

deliverables:
  - "services/api/src/routes/auth.rs"
    - POST /v1/auth/siwe
    - POST /v1/auth/refresh
    - GET /v1/auth/me
  - "services/api/src/middleware/jwt.rs"
  - "services/api/src/services/auth_service.rs"

verification:
  build: "cargo build -p quantum-shield-api"
  tests: "cargo test -p quantum-shield-api -- auth"

done_when:
  - "SIWE署名検証成功"
  - "JWT発行・検証動作"
  - "保護エンドポイントで認証要求"
```

#### TASK-P5-013: API Client認証統合 ⏳ TODO

```yaml
task_id: "TASK-P5-013"
name: "API Client認証統合"
phase: "5.1"
priority: "P1"
status: "TODO"
depends_on: ["TASK-P5-012"]

spec_refs:
  unified_spec: ["§SDK Authentication"]

existing_code_check:
  sdk:
    - "packages/sdk/typescript/src/client.ts"
    - "packages/sdk/react/src/QuantumShieldProvider.tsx"

gap:
  what_exists: "Client構造あり"
  what_missing: "SIWE→JWT自動認証フロー"
  estimated_effort: "1 day"

deliverables:
  - "packages/sdk/typescript/src/auth.ts"
  - "packages/sdk/react/src/useAuth.ts"

done_when:
  - "SDK経由で自動認証"
  - "JWTトークン管理"
```

---

## 6. Phase 5.2: コアAPI (12日)

#### TASK-P5-020: Consumer App API ⏳ TODO

```yaml
task_id: "TASK-P5-020"
name: "Consumer App API (6 EP)"
phase: "5.2"
priority: "P0"
status: "TODO"
depends_on: ["TASK-P5-012"]

spec_refs:
  unified_spec: ["§Consumer Application"]

existing_code_check:
  api:
    - "services/api/src/routes/user.rs (未実装)"

deliverables:
  - "services/api/src/routes/user.rs"
    - GET /v1/user/dashboard
    - GET /v1/user/transactions
    - GET /v1/user/transactions/:id
    - GET /v1/user/settings
    - POST /v1/user/settings
    - GET /v1/user/keys

estimated_effort: "3 days"

done_when:
  - "6 EP全て動作"
  - "JWT認証統合"
```

#### TASK-P5-021: Token Hub API ⏳ TODO

```yaml
task_id: "TASK-P5-021"
name: "Token Hub API (9 EP)"
phase: "5.2"
priority: "P0"
status: "TODO"
depends_on: ["TASK-P5-012"]

spec_refs:
  unified_spec: ["§veQS Token", "§Delegation"]

existing_code_check:
  api:
    - "services/api/src/routes/token_hub.rs (未実装)"
  contracts:
    - "contracts/src/ (veQS関連)"

deliverables:
  - "services/api/src/routes/token_hub.rs"
    - GET /v1/token-hub/dashboard
    - POST /v1/token-hub/lock
    - GET /v1/token-hub/locks
    - POST /v1/token-hub/extend
    - GET /v1/token-hub/delegates
    - POST /v1/token-hub/delegate
    - GET /v1/token-hub/rewards
    - POST /v1/token-hub/claim
    - GET /v1/token-hub/delegations/my

estimated_effort: "5 days"

done_when:
  - "9 EP全て動作"
  - "L1 veQSコントラクト連携"
```

#### TASK-P5-022: Prover Portal API ⏳ TODO

```yaml
task_id: "TASK-P5-022"
name: "Prover Portal API (9 EP)"
phase: "5.2"
priority: "P0"
status: "TODO"
depends_on: ["TASK-P5-012", "TASK-P5-011"]

spec_refs:
  sequences: ["§5", "§6"]
  unified_spec: ["§Prover Portal"]

existing_code_check:
  api:
    - "services/api/src/routes/prover.rs (基本のみ)"

deliverables:
  - "services/api/src/routes/prover.rs (拡張)"
    - GET /v1/prover/dashboard
    - GET /v1/prover/queue
    - GET /v1/prover/queue/:id
    - POST /v1/prover/sign
    - GET /v1/prover/metrics
    - GET /v1/prover/alerts
    - GET /v1/prover/challenges
    - POST /v1/prover/challenge-response
    - POST /v1/prover/exit

estimated_effort: "4 days"

done_when:
  - "9 EP全て動作"
  - "ProverRegistry.sol連携"
```

---

## 7. Phase 5.3: 管理系API (15日)

#### TASK-P5-030: QS Admin API ⏳ TODO

```yaml
task_id: "TASK-P5-030"
name: "QS Admin API (11 EP)"
phase: "5.3"
priority: "P0"
status: "TODO"
depends_on: ["TASK-P5-012"]

spec_refs:
  unified_spec: ["§QS Admin"]

deliverables:
  - "services/api/src/routes/admin.rs (拡張)"
    - GET /v1/admin/dashboard
    - GET /v1/admin/transactions
    - GET /v1/admin/nodes
    - GET /v1/admin/staff
    - POST /v1/admin/staff
    - GET /v1/admin/reports
    - GET /v1/admin/audit-log
    - GET /v1/admin/parameters
    - POST /v1/admin/parameters/change-request
    - GET /v1/admin/enterprise/accounts
    - POST /v1/admin/enterprise/accounts

estimated_effort: "5 days"
```

#### TASK-P5-031: Enterprise Admin API ⏳ TODO

```yaml
task_id: "TASK-P5-031"
name: "Enterprise Admin API (19 EP)"
phase: "5.3"
priority: "P0"
status: "TODO"
depends_on: ["TASK-P5-012"]

spec_refs:
  unified_spec: ["§Enterprise Edition", "§Enterprise Admin"]

deliverables:
  - "services/api/src/routes/enterprise.rs"
    - GET /v1/enterprise/dashboard/overview
    - GET /v1/enterprise/dashboard/tvl
    - GET /v1/enterprise/dashboard/volume
    - GET /v1/enterprise/transactions
    - GET /v1/enterprise/transactions/:id
    - POST /v1/enterprise/transactions/export
    - GET /v1/enterprise/users
    - GET /v1/enterprise/users/:id
    - POST /v1/enterprise/users
    - POST /v1/enterprise/users/invite
    - POST /v1/enterprise/users/:id/role
    - GET /v1/enterprise/api-keys
    - POST /v1/enterprise/api-keys
    - GET /v1/enterprise/api-keys/:id/usage
    - GET /v1/enterprise/settings
    - POST /v1/enterprise/settings
    - GET /v1/enterprise/security-settings
    - GET /v1/enterprise/reports
    - GET /v1/enterprise/audit-log

estimated_effort: "7 days"
```

#### TASK-P5-032: Enterprise申込フロー ⏳ TODO

```yaml
task_id: "TASK-P5-032"
name: "Enterprise申込フロー"
phase: "5.3"
priority: "P1"
status: "TODO"
depends_on: ["TASK-P5-031"]

spec_refs:
  unified_spec: ["§Enterprise Onboarding"]

deliverables:
  - "HTMLモック: system_07_enterprise/wip/mocks/00_application.html"
  - "HTMLモック: system_07_enterprise/wip/mocks/00_onboarding.html"
  - "services/api/src/routes/enterprise_application.rs"
    - POST /v1/enterprise/apply
    - GET /v1/enterprise/application/:id
    - POST /v1/enterprise/contract/sign
    - GET /v1/enterprise/onboarding

estimated_effort: "3 days"
```

---

## 8. Phase 5.4: 補完機能 (32日)

#### TASK-P5-040: Governance API ⏳ TODO

```yaml
task_id: "TASK-P5-040"
name: "Governance API (8 EP)"
phase: "5.4"
priority: "P1"
status: "TODO"
depends_on: ["TASK-P5-012"]

spec_refs:
  sequences: ["§7 Governance Proposal"]
  unified_spec: ["§Governance", "§veQS Voting"]

deliverables:
  - "services/api/src/routes/governance.rs"
    - GET /v1/governance/dashboard
    - GET /v1/governance/proposals
    - GET /v1/governance/proposals/:id
    - POST /v1/governance/proposals
    - POST /v1/governance/vote
    - GET /v1/governance/votes/:id
    - GET /v1/governance/activity
    - GET /v1/governance/council

estimated_effort: "4 days"
```

#### TASK-P5-041: Observer API ⏳ TODO

```yaml
task_id: "TASK-P5-041"
name: "Observer API (8 EP)"
phase: "5.4"
priority: "P1"
status: "TODO"
depends_on: ["TASK-P5-001"]

spec_refs:
  sequences: ["§4 Challenge + Slashing"]
  unified_spec: ["§Observer Role"]

deliverables:
  - "services/api/src/routes/observer.rs"
    - GET /v1/observer/dashboard
    - GET /v1/observer/pending-unlocks
    - GET /v1/observer/suspicious-txs
    - GET /v1/observer/history
    - POST /v1/observer/challenge
    - GET /v1/observer/challenge/:id
    - GET /v1/observer/earnings
    - POST /v1/observer/claim-earnings

estimated_effort: "4 days"
```

#### TASK-P5-042: Explorer API ⏳ TODO

```yaml
task_id: "TASK-P5-042"
name: "Explorer API (12 EP)"
phase: "5.4"
priority: "P1"
status: "TODO"

deliverables:
  - "services/api/src/routes/explorer.rs"
    - GET /v1/explorer/overview
    - GET /v1/explorer/search
    - GET /v1/explorer/locks
    - GET /v1/explorer/locks/:id
    - GET /v1/explorer/unlocks
    - GET /v1/explorer/unlocks/:id
    - GET /v1/explorer/challenges
    - GET /v1/explorer/challenges/:id
    - GET /v1/explorer/address/:addr
    - GET /v1/explorer/provers
    - GET /v1/explorer/provers/:id
    - GET /v1/explorer/analytics

estimated_effort: "5 days"
```

#### TASK-P5-043: Event Bridge完成 ⏳ TODO

(See TASK-P5-006 above - moved to Phase 5.0 as blocker)

#### TASK-P5-044: SPHINCS+検証実装 ⏳ TODO

(See TASK-P5-007 above - moved to Phase 5.0 as blocker)

#### TASK-P5-045: i18n対応 ⏳ TODO

```yaml
task_id: "TASK-P5-045"
name: "i18n対応 (ja/en)"
phase: "5.4"
priority: "P2"
status: "TODO"

deliverables:
  - "next-intl導入"
  - "翻訳ファイル作成 (ja/en)"
  - "全コンポーネントの言語値外部化"
  - "言語切替UI実装"

estimated_effort: "5 days"
```

#### TASK-P5-046: 監視ボット ⏳ TODO

```yaml
task_id: "TASK-P5-046"
name: "24h監視ボット"
phase: "5.4"
priority: "P1"
status: "TODO"
depends_on: ["TASK-P5-001"]

spec_refs:
  sequences: ["§2", "§4"]
  unified_spec: ["§Monitoring"]

deliverables:
  - "services/monitor-bot/src/main.rs"
  - "24h Unlock監視"
  - "不正検知アラート"

estimated_effort: "3 days"
```

---

## 9. Phase 5.5: 統合・テスト (15日)

#### TASK-P5-050: UI ↔ API 統合 ⏳ TODO

```yaml
task_id: "TASK-P5-050"
name: "UI ↔ API 統合"
phase: "5.5"
priority: "P0"
status: "TODO"
depends_on: ["All APIs"]

deliverables:
  - "全8システム107画面のAPI接続"
  - "モック→実APIへの切替"

estimated_effort: "5 days"
```

#### TASK-P5-051: E2Eテスト ⏳ TODO

```yaml
task_id: "TASK-P5-051"
name: "E2Eテスト"
phase: "5.5"
priority: "P0"
status: "TODO"
depends_on: ["TASK-P5-050"]

deliverables:
  - "Playwright E2Eテストスイート"
  - "実STARK証明使用のテスト"
  - "Lock/Unlock/Challenge全フローテスト"

estimated_effort: "5 days"
```

#### TASK-P5-052: Edition切替テスト ⏳ TODO

```yaml
task_id: "TASK-P5-052"
name: "Edition切替テスト"
phase: "5.5"
priority: "P1"
status: "TODO"
depends_on: ["TASK-P5-010"]

deliverables:
  - "Enterprise ↔ Decentralized切替テスト"
  - "承認モード切替テスト"

estimated_effort: "2 days"
```

#### TASK-P5-053: 本番デプロイ準備 ⏳ TODO

```yaml
task_id: "TASK-P5-053"
name: "本番デプロイ準備"
phase: "5.5"
priority: "P0"
status: "TODO"
depends_on: ["TASK-P5-051"]

deliverables:
  - "Docker Compose本番構成"
  - "環境変数・シークレット管理"
  - "デプロイスクリプト"
  - "監視・ロギング設定"

estimated_effort: "3 days"
```

---

## 10. 進捗トラッキング

> **注意**: タスク番号はTASK_P5_FULL_LIST.mdと統一

### 10.1 Phase 5.0 進捗（2026-01-12時点）

| Task ID | 名前 | 状態 | 完了日 | 備考 |
|---------|-----|:----:|-------|------|
| TASK-P5-001 | STARK Prover Archive移行 | ✅ DONE | 2026-01-11 | Winterfell統合 |
| TASK-P5-002 | stark-prover HTTPサービス化 | ✅ DONE | 2026-01-11 | Axum HTTP完成 |
| TASK-P5-003 | React WASM初期化実装 | ✅ DONE | 2026-01-11 | wasm.ts実装 |
| TASK-P5-004 | React Hooks実Crypto実装 | ✅ DONE | 2026-01-11 | useDilithium.ts |
| TASK-P5-008 | L3 fips204クレート移行 | ✅ DONE | 2026-01-11 | ML-DSA-65対応 |
| TASK-P5-009 | L3 Production Mode完成 | ⏳ 80% | - | コンセンサス統合残 |
| TASK-P5-014 | Challenge + Slashing実装 | ⏳ 90% | - | コンフリクト要解決 |

### 10.2 Phase 5.1 進捗

| Task ID | 名前 | 状態 | 完了日 | 備考 |
|---------|-----|:----:|-------|------|
| TASK-P5-005 | Chainlink VRF Integration | ✅ DONE | 2026-01-12 | シミュレーション実装 |
| TASK-P5-006 | Event Bridge | ✅ DONE | 2026-01-12 | WebSocket/RabbitMQ |
| TASK-P5-007 | SPHINCS+ Verification | ✅ DONE | 2026-01-12 | フォーマット検証 |
| TASK-P5-010 | EditionConfig.sol | ✅ DONE | 2026-01-12 | - |
| TASK-P5-011 | ProverRegistry.sol | ✅ DONE | 2026-01-12 | - |
| TASK-P5-012 | SIWE→JWT認証 | ✅ DONE | 2026-01-12 | - |
| TASK-P5-013 | SDK API client認証 | ✅ DONE | 2026-01-12 | - |

### 10.3 全体進捗

```
Phase 5.0: ██████████████░░░░░░ 71% (5/7 tasks)
Phase 5.1: ████████████████████ 100% (7/7 tasks)
Phase 5.2: ████████████████████ 100% (4/4 tasks)
Phase 5.3: ░░░░░░░░░░░░░░░░░░░░ 0%  (0/4 tasks)
Phase 5.4: ██░░░░░░░░░░░░░░░░░░ 10% (1/10 tasks)
Phase 5.5: ░░░░░░░░░░░░░░░░░░░░ 0%  (0/4 tasks)
───────────────────────────────
Total:     █████████░░░░░░░░░░░ 47% (17/36 tasks)
```

### 10.4 工数実績 vs 計画

| Phase | 計画 | 完了 | 残 |
|-------|:----:|:----:|:--:|
| 5.0 | 31日 | 16日 | 15日 |
| 5.1 | 10日 | 10日 | 0日 |
| 5.2 | 12日 | 12日 | 0日 |
| 5.3 | 15日 | 0日 | 15日 |
| 5.4 | 32日 | ~5日 | 27日 |
| 5.5 | 15日 | 0日 | 15日 |
| **合計** | **115日** | **~53日** | **~62日** |

---

## 11. 次のアクション

### 11.1 即座実行可能（Phase 5.0残り - P0）

1. **TASK-P5-009**: L3 Production Mode完成 (残り3-5日)
   - コンセンサスエンジン統合
   - RPCサーバー実装
   - 4ノードテスト

2. **TASK-P5-014**: Challenge + Slashing完成 (残り1-2日)
   - マージコンフリクト解決
   - useChallenge.ts統合

### 11.2 Phase 5.3着手（P1）

```
優先順:
├── TASK-P5-015: QS Admin API (11 EP)
├── TASK-P5-016: Enterprise Admin API (19 EP)
├── TASK-P5-017: Enterprise申込フロー
└── TASK-P5-018: 4BFT契約者管理
```

### 11.3 Phase 5.4補完（P1-P2）

```
├── TASK-P5-019: Observer API (8 EP)
├── TASK-P5-024: Explorer API (12 EP)
├── TASK-P5-026: i18n対応
└── その他補完機能
```

### 11.4 推奨実行順序

```
Week 1:
├── TASK-P5-009: L3 Production Mode完成 (P0)
└── TASK-P5-014: Challenge + Slashing完成 (P0)

Week 2-3:
├── TASK-P5-015〜018: 管理系API (Phase 5.3)
└── TASK-P5-019, 024: Observer/Explorer API

Week 4:
├── TASK-P5-033〜036: 統合・テスト (Phase 5.5)
└── 本番デプロイ準備
```

---

**END OF 26_phase5_planner.md**
