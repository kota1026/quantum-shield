# 60_fullstack_integration.md - Full Stack Integration Prompt

> **Version**: 1.0
> **Created**: 2026-02-01
> **Purpose**: UI → Backend → Database → Blockchain の全レイヤー統合

---

## Overview

Quantum Shieldの全レイヤー（UI、Backend、Database、L1/L3 Blockchain）を統合し、
End-to-Endで動作することを検証するための実行プロンプト。

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FULL STACK ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   [Layer 1] UI Components ─────────┐                                       │
│                                    │                                       │
│   [Layer 2] React Query Hooks ─────┤                                       │
│                                    ↓                                       │
│   [Layer 3] API Client ──────→ HTTP Request                                │
│                                    │                                       │
│                                    ↓                                       │
│   [Layer 4] Backend API ←──── Rust/Axum Server                             │
│                                    │                                       │
│                        ┌───────────┴───────────┐                           │
│                        ↓                       ↓                           │
│   [Layer 5] Database              [Layer 6/7] Blockchain                   │
│   PostgreSQL + Redis              L1 Sepolia + L3 Dilithium                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Trigger Commands

```bash
# ===== Full Stack統合（メインコマンド）=====
フルスタック統合 開始           # Phase A から順次実行（★推奨）
フルスタック統合 {app}          # 特定アプリの全レイヤー統合

# ===== Phase別実行 =====
フルスタック Phase-A 開始       # DB セットアップ
フルスタック Phase-B 開始       # Backend 検証
フルスタック Phase-C 開始       # Blockchain 統合
フルスタック Phase-D 開始       # E2E テスト

# ===== 進捗確認 =====
フルスタック 進捗確認           # 全体の統合状況
フルスタック ゲートチェック     # 現在Phaseのゲート検証

# ===== アプリ一覧 =====
# consumer, prover, observer, explorer, governance,
# token-hub, qs-hub, qs-admin, enterprise
```

---

## Phase 0: 初期化（必須）

### 0.1 必須ファイル読み込み

```
READ PARALLEL:
├── docs/specs/DATABASE_DESIGN.md        ← DBスキーマ
├── docs/specs/API_SPECIFICATION.yaml    ← APIエンドポイント
├── docs/specs/DATA_MODEL.md             ← データモデル
├── docs/integration/INTEGRATION_PROGRESS.md  ← 進捗
└── docs/agents/prompts/rules/BE_RULES.md    ← BEルール（★必須）
```

### 0.2 現状確認

```bash
# Backend API 起動確認
curl -s http://localhost:8080/health | jq .

# Database 接続確認
docker ps | grep postgres

# Redis 接続確認
docker ps | grep redis

# L1/L3 接続確認（オプション）
curl -s http://localhost:8545 -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### 0.3 初期化完了報告

```markdown
## Full Stack統合 初期化完了

### 環境状況
- Backend API: ✅ 起動中 / ❌ 未起動
- PostgreSQL:  ✅ 起動中 / ❌ 未起動
- Redis:       ✅ 起動中 / ❌ 未起動
- L1 (Sepolia): ✅ 接続可 / ❌ 未接続
- L3 (Dilithium): ✅ 接続可 / ❌ 未接続

### 対象アプリ
- アプリ: {app_name}
- 現在のPhase: {current_phase}

→ Phase {X} を開始します
```

---

## Phase A: Database セットアップ

### A.1 目標

- [ ] Prisma スキーマファイル作成
- [ ] マイグレーション実行
- [ ] シードデータ投入
- [ ] 接続テスト成功

### A.2 実行手順

#### Step 1: Prisma 初期化

```bash
cd services/api

# Prisma 初期化（初回のみ）
npx prisma init

# .env 設定
cat > .env << 'EOF'
DATABASE_URL="postgresql://qs_user:qs_password@localhost:5432/quantum_shield?schema=public"
REDIS_URL="redis://localhost:6379"
EOF
```

#### Step 2: スキーマ作成

DATABASE_DESIGN.md の Prisma Schema セクションを `prisma/schema.prisma` にコピー。

```bash
# スキーマ検証
npx prisma validate

# マイグレーション作成
npx prisma migrate dev --name init

# Prisma Client 生成
npx prisma generate
```

#### Step 3: シードデータ

```bash
# シードスクリプト実行（存在する場合）
npx prisma db seed

# または直接SQL実行
psql $DATABASE_URL -f scripts/seed.sql
```

#### Step 4: 接続テスト

```bash
# Prisma Studio で確認
npx prisma studio

# または CLI で確認
npx prisma db pull
```

### A.3 ゲートチェック

```bash
# Phase A Gate Check
./scripts/gate-check.sh fullstack-a

# または手動確認
npx prisma migrate status  # All migrations applied
npx prisma validate        # Schema is valid
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"  # Tables exist
```

### A.4 完了報告

```markdown
## Phase A 完了: Database セットアップ

| チェック項目 | 結果 |
|-------------|:----:|
| Prisma スキーマ作成 | ✅/❌ |
| マイグレーション適用 | ✅/❌ |
| テーブル作成確認 | ✅/❌ |
| シードデータ投入 | ✅/❌ |
| 接続テスト成功 | ✅/❌ |

### 作成されたテーブル
- users, locks, unlock_requests, provers, ...

→ Phase B へ進みます
```

---

## Phase B: Backend API 検証

### B.1 目標

- [ ] Backend が実DBに接続
- [ ] スタブレスポンスなし（BE-001）
- [ ] 全エンドポイントが実データ返却
- [ ] ログ出力確認（BE-003）

### B.2 BE Rules（絶対遵守）

```xml
<rule id="BE-001" level="ABSOLUTE">
  スタブレスポンス禁止
  - 常に同じデータを返す実装は禁止
  - 必ずDBからデータを取得すること
  - 検出方法: 同じリクエストを2回送り、レスポンスが同一かチェック
</rule>

<rule id="BE-002" level="ABSOLUTE">
  テスト用コード修正禁止
  - テストを通すためだけのコード変更は禁止
  - 本番コードとテストコードは独立
</rule>

<rule id="BE-003" level="ABSOLUTE">
  ログ出力必須
  - リクエスト受信ログ
  - DB操作ログ
  - レスポンス送信ログ
  - エラー詳細ログ
</rule>
```

### B.3 実行手順

#### Step 1: Backend 起動

```bash
cd services/api

# 環境変数設定
export DATABASE_URL="postgresql://qs_user:qs_password@localhost:5432/quantum_shield"
export REDIS_URL="redis://localhost:6379"
export RUST_LOG=info

# Backend 起動
cargo run
```

#### Step 2: エンドポイント検証

各アプリのエンドポイントを検証:

```bash
# Health check
curl -s http://localhost:8080/health | jq .

# Consumer エンドポイント例
curl -s http://localhost:8080/api/user/locks \
  -H "Authorization: Bearer $TOKEN" | jq .

# Prover エンドポイント例
curl -s http://localhost:8080/api/prover/me \
  -H "Authorization: Bearer $TOKEN" | jq .
```

#### Step 3: スタブ検出テスト

```bash
# 同じリクエストを2回送信し、レスポンスが同一でないことを確認
RESP1=$(curl -s http://localhost:8080/api/explorer/stats)
sleep 1
RESP2=$(curl -s http://localhost:8080/api/explorer/stats)

if [ "$RESP1" = "$RESP2" ]; then
  echo "⚠️ WARNING: Response may be stubbed (identical responses)"
else
  echo "✅ Response appears to be live data"
fi
```

#### Step 4: ログ確認

```bash
# Backend ログを確認
tail -f services/api/logs/api.log | grep -E "(REQUEST|DB|RESPONSE)"

# 期待されるログ形式:
# [INFO] REQUEST: GET /api/user/locks from 127.0.0.1
# [INFO] DB: SELECT * FROM locks WHERE wallet_address = $1
# [INFO] RESPONSE: 200 OK, 3 items returned
```

### B.4 アプリ別エンドポイント検証

| App | 必須エンドポイント | 検証方法 |
|-----|-------------------|----------|
| Consumer | `/api/lock`, `/api/unlock/request`, `/api/user/locks` | POST/GET で実データ確認 |
| Prover | `/api/prover/apply`, `/api/prover/me`, `/api/prover/requests` | 申請フロー確認 |
| Observer | `/api/observer/pending-unlocks`, `/api/observer/challenge` | ペンディング一覧確認 |
| Explorer | `/api/explorer/stats`, `/api/explorer/locks` | 公開データ確認 |
| Governance | `/api/governance/proposals`, `/api/governance/council` | 提案一覧確認 |
| Token Hub | `/api/token/balance`, `/api/token/stake` | 残高確認 |
| QS Hub | `/api/governance/voting-power` | 投票力確認 |
| QS Admin | `/api/admin/dashboard/stats` | ダッシュボード確認 |

### B.5 ゲートチェック

```bash
# Phase B Gate Check
./scripts/gate-check.sh fullstack-b

# チェック項目:
# 1. 全エンドポイントが200/201を返す
# 2. スタブ検出テストでWARNINGなし
# 3. ログに DB: クエリが出力されている
# 4. レスポンスにtimestampが含まれる（動的データの証拠）
```

### B.6 完了報告

```markdown
## Phase B 完了: Backend API 検証

| チェック項目 | 結果 |
|-------------|:----:|
| Backend 起動成功 | ✅/❌ |
| DB 接続確認 | ✅/❌ |
| スタブ検出テスト | ✅ PASS / ⚠️ WARNING |
| ログ出力確認 | ✅/❌ |
| 全エンドポイント正常 | ✅/❌ ({n}/{total}) |

### 検証したエンドポイント
| Endpoint | Status | Response Time |
|----------|:------:|:-------------:|
| GET /health | 200 | 5ms |
| GET /api/user/locks | 200 | 45ms |
| ... | ... | ... |

→ Phase C へ進みます
```

---

## Phase C: Blockchain 統合

### C.1 目標

- [ ] L1 (Sepolia) 接続確認
- [ ] L3 (Dilithium) 接続確認
- [ ] Lock/Unlock トランザクション実行可能
- [ ] 署名検証成功

### C.2 L1 (Sepolia) 統合

#### Step 1: L1 接続確認

```bash
# Sepolia RPC 接続テスト
curl -s https://sepolia.infura.io/v3/$INFURA_PROJECT_ID \
  -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# 期待: {"jsonrpc":"2.0","id":1,"result":"0xaa36a7"}  (Chain ID: 11155111)
```

#### Step 2: コントラクト確認

```bash
# デプロイ済みコントラクトアドレス確認
cat contracts/deployments/sepolia.json | jq .

# L1Vault コントラクト確認
cast call $L1_VAULT_ADDRESS "owner()" --rpc-url $SEPOLIA_RPC
```

#### Step 3: テストトランザクション

```bash
# テスト用 Lock 作成（Sepolia testnet）
cast send $L1_VAULT_ADDRESS \
  "createLock(address,uint256,bytes32)" \
  $ASSET_ADDRESS $AMOUNT $DEST_HASH \
  --rpc-url $SEPOLIA_RPC \
  --private-key $TEST_PRIVATE_KEY
```

### C.3 L3 (Dilithium) 統合

#### Step 1: L3 ノード確認

```bash
# L3 ノードヘルスチェック
curl -s http://localhost:8545/health | jq .

# 期待:
# {
#   "status": "healthy",
#   "block_height": 12345,
#   "syncing": false
# }
```

#### Step 2: Dilithium 署名テスト

```bash
# Dilithium 鍵ペア生成（テスト用）
./scripts/generate-dilithium-keypair.sh

# 署名テスト
curl -X POST http://localhost:8080/api/test/dilithium-sign \
  -H "Content-Type: application/json" \
  -d '{
    "message": "test message",
    "private_key": "'$DILITHIUM_PRIVATE_KEY'"
  }'
```

#### Step 3: Bridge 検証

```bash
# L3 → L1 Bridge トランザクション確認
curl -s http://localhost:8080/api/bridge/pending | jq .

# Bridge 状態確認
curl -s http://localhost:8080/api/bridge/status/$BRIDGE_TX_HASH | jq .
```

### C.4 ゲートチェック

```bash
# Phase C Gate Check
./scripts/gate-check.sh fullstack-c

# チェック項目:
# 1. L1 接続成功 (Chain ID = 11155111)
# 2. L3 ノードヘルス = healthy
# 3. Dilithium 署名/検証成功
# 4. コントラクト呼び出し成功
```

### C.5 完了報告

```markdown
## Phase C 完了: Blockchain 統合

| チェック項目 | 結果 |
|-------------|:----:|
| L1 Sepolia 接続 | ✅/❌ |
| L3 ノード接続 | ✅/❌ |
| Dilithium 署名テスト | ✅/❌ |
| コントラクト呼び出し | ✅/❌ |
| Bridge 機能確認 | ✅/❌ |

### 接続情報
- L1 Chain ID: 11155111 (Sepolia)
- L1 Block: #12345678
- L3 Block: #1234
- Dilithium Pubkey: 0x...

→ Phase D へ進みます
```

---

## Phase D: E2E テスト

### D.1 目標

- [ ] UI → Backend → DB の一連のフロー動作
- [ ] UI → Backend → Blockchain のフロー動作
- [ ] エラーハンドリング正常
- [ ] ログ整合性検証成功

### D.2 E2E テスト実行

#### Step 1: テスト環境準備

```bash
# Frontend 起動
cd apps/web && pnpm dev

# Backend 起動（別ターミナル）
cd services/api && cargo run

# テストDB準備
npx prisma migrate reset --force
npx prisma db seed
```

#### Step 2: Playwright E2E テスト

```bash
cd apps/web

# 全E2Eテスト実行
npx playwright test e2e/

# 特定アプリのテスト
npx playwright test e2e/{app}/

# UIモードで実行（デバッグ用）
npx playwright test --ui
```

#### Step 3: 主要フローテスト

| フロー | テスト内容 |
|-------|----------|
| Lock フロー | ユーザー → Lock作成 → DB保存 → L1送信 → 確認 |
| Unlock フロー | ユーザー → Unlock申請 → VRF → Prover署名 → 24h待機 → 実行 |
| Challenge フロー | Observer → 不正検出 → Challenge提出 → 解決 |
| Governance フロー | 提案作成 → 投票 → 可決 → 実行 |

### D.3 ログ整合性検証

```bash
# E2Eテスト実行後、ログを解析
./scripts/verify-test-logs.sh

# 検証内容:
# 1. テストで期待した操作がログに記録されているか
# 2. DBクエリが実際に発行されたか
# 3. エラーログに想定外のエラーがないか
```

**ログ整合性検証の重要性:**
- テストが「通っている」だけでは不十分
- 実際にDBやBlockchainに書き込まれたことをログで確認
- 「テスト成功だが実処理なし」を検出

### D.4 ゲートチェック

```bash
# Phase D Gate Check
./scripts/gate-check.sh fullstack-d

# チェック項目:
# 1. 全E2Eテスト PASS
# 2. ログ整合性検証 PASS
# 3. エラーログに CRITICAL/ERROR なし
# 4. パフォーマンス基準達成（レスポンス < 500ms）
```

### D.5 完了報告

```markdown
## Phase D 完了: E2E テスト

| チェック項目 | 結果 |
|-------------|:----:|
| E2E テスト実行 | ✅ {passed}/{total} PASS |
| Lock フロー | ✅/❌ |
| Unlock フロー | ✅/❌ |
| ログ整合性検証 | ✅/❌ |
| パフォーマンス | ✅/❌ (avg: {X}ms) |

### テスト結果サマリー
```
✓ consumer/lock.spec.ts (3 tests, 4.5s)
✓ consumer/unlock.spec.ts (5 tests, 8.2s)
✓ prover/application.spec.ts (4 tests, 6.1s)
...

Total: {n} passed, {m} failed
```

→ Full Stack統合 完了！
```

---

## Final: 統合完了報告

### 完了報告テンプレート

```markdown
## Full Stack統合 完了報告: {App Name}

### Executive Summary
| Phase | Status | 完了日 |
|:-----:|:------:|:------:|
| A: Database | ✅ | 2026-02-XX |
| B: Backend | ✅ | 2026-02-XX |
| C: Blockchain | ✅ | 2026-02-XX |
| D: E2E Test | ✅ | 2026-02-XX |

### レイヤー別状況
```
[Layer 1] UI Components    ✅ 100% (XX components)
[Layer 2] React Hooks      ✅ 100% (XX hooks)
[Layer 3] API Client       ✅ 接続確認済み
[Layer 4] Backend API      ✅ XX endpoints verified
[Layer 5] Database         ✅ XX tables, migration applied
[Layer 6] L1 Blockchain    ✅ Sepolia connected
[Layer 7] L3 Blockchain    ✅ Dilithium signing works
```

### 検証済みフロー
- [x] ユーザー登録 → ログイン
- [x] Lock 作成 → 確認
- [x] Unlock 申請 → 24h待機 → 実行
- [x] ...

### 残課題
- [ ] {残課題1}
- [ ] {残課題2}

### 次のアプリ
→ {next_app_name}
```

---

## Appendix: Gate Check Scripts

### scripts/gate-check.sh

```bash
#!/bin/bash
# Full Stack Gate Check Script

PHASE=$1

case $PHASE in
  "fullstack-a")
    echo "=== Phase A: Database Gate Check ==="
    npx prisma migrate status
    npx prisma validate
    psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
    ;;

  "fullstack-b")
    echo "=== Phase B: Backend Gate Check ==="
    curl -sf http://localhost:8080/health || exit 1
    # Stub detection
    RESP1=$(curl -s http://localhost:8080/api/explorer/stats)
    sleep 1
    RESP2=$(curl -s http://localhost:8080/api/explorer/stats)
    if [ "$RESP1" = "$RESP2" ]; then
      echo "⚠️ WARNING: Possible stub detected"
    fi
    ;;

  "fullstack-c")
    echo "=== Phase C: Blockchain Gate Check ==="
    # L1 check
    curl -sf https://sepolia.infura.io/v3/$INFURA_PROJECT_ID \
      -X POST -H "Content-Type: application/json" \
      -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' | jq -e '.result == "0xaa36a7"'
    # L3 check
    curl -sf http://localhost:8545/health | jq -e '.status == "healthy"'
    ;;

  "fullstack-d")
    echo "=== Phase D: E2E Gate Check ==="
    cd apps/web
    npx playwright test --reporter=json > test-results.json
    cat test-results.json | jq '.stats.expected == .stats.passed'
    ;;

  *)
    echo "Usage: ./gate-check.sh [fullstack-a|fullstack-b|fullstack-c|fullstack-d]"
    exit 1
    ;;
esac
```

---

## Related Documents

- [Database Design](../../specs/DATABASE_DESIGN.md)
- [API Specification](../../specs/API_SPECIFICATION.yaml)
- [Data Model](../../specs/DATA_MODEL.md)
- [Integration Progress](../../integration/INTEGRATION_PROGRESS.md)
- [BE Rules](./rules/BE_RULES.md)
- [Phase 8 Prompts](./phase8/) - QS Admin specific

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-01 | 1.0 | Initial document |
