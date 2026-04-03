# Quantum Shield Launch Master Plan

> **Version**: 1.0
> **Created**: 2026-04-03
> **Goal**: Quantum Shield Beta -> Public Launch

---

## Phase Overview

```
Phase A: Deploy & Service Public (DONE)
  ├─ Vercel Frontend deploy
  ├─ Railway Backend deploy
  ├─ L1 Sepolia contracts verified
  └─ L3 Arbitrum Sepolia 12 contracts verified

Phase B: Sequence Testing (CURRENT)
  ├─ B-1: 全9シーケンス Playwright E2E
  ├─ B-2: VRF Chainlink デプロイ (Sepolia)
  └─ B-3: Auto-Claim E2E 検証

Phase C: Security Hardening
  ├─ C-1: Security headers & HTTPS enforcement
  ├─ C-2: Rate limiting production tuning
  ├─ C-3: Secret rotation & management
  └─ C-4: External security audit

Phase D: Monitoring & Observability
  ├─ D-1: Prometheus + Grafana production setup
  ├─ D-2: Sentry error tracking integration
  ├─ D-3: Business metrics dashboards
  └─ D-4: Alerting (Slack/PagerDuty)

Phase E: Performance & Gas
  ├─ E-1: Gas benchmark report (per operation)
  ├─ E-2: Frontend Lighthouse optimization
  ├─ E-3: Backend load testing (k6/wrk)
  └─ E-4: DB query optimization

Phase F: Documentation & Compliance
  ├─ F-1: SECURITY.md & responsible disclosure
  ├─ F-2: API docs (OpenAPI spec)
  ├─ F-3: Incident response playbook
  └─ F-4: SOC2 compliance roadmap

Phase G: Public Launch
  ├─ G-1: Mainnet contract deployment
  ├─ G-2: DNS & CDN final config
  ├─ G-3: Launch announcement & PR
  └─ G-4: Post-launch monitoring (72h)
```

---

## Phase A: Deploy & Service Public (DONE)

**Status**: COMPLETE (2026-03-03)

| Item | Status | Evidence |
|------|--------|----------|
| Frontend Vercel deploy | Done | quantum-shield.vercel.app |
| Backend Railway deploy | Done | API health OK |
| L1 Sepolia (3 contracts) | Done | Vault, ProverRegistry, SPHINCS+ Verifier |
| L3 Arbitrum Sepolia (12 contracts) | Done | All Sourcify exact_match verified |
| DB migrations (17 files) | Done | 20+ tables created |
| MOCK/FALLBACK removal | Done | 0 instances (1,280 removed) |
| WASM SDK build | Done | npm publish-ready |
| CI/CD pipeline | Done | GitHub Actions |

---

## Phase B: Sequence Testing (CURRENT)

### B-1: 全9シーケンス Playwright E2E

**Goal**: 各シーケンスが FE -> BE -> DB -> L1/L3 の全レイヤーで動作することを検証

#### ローカルMac実行手順

```bash
# 1. Docker services 起動
docker compose up -d postgres redis rabbitmq l3-node minio minio-init

# 2. DB migration
cd src/api/api
DATABASE_URL="postgresql://quantum:quantum_dev@localhost:5432/quantum_shield" sqlx migrate run

# 3. Backend 起動
cargo run --bin api-server

# 4. Frontend 起動 (別ターミナル)
cd src/frontend/web
pnpm install && pnpm dev

# 5. Playwright テスト実行
NO_SERVER=1 npx playwright test e2e/integration/ --project=chromium
```

#### テスト対象マトリクス

| SEQ | Name | テストファイル | 検証レベル | Status |
|-----|------|---------------|-----------|--------|
| #1 | Lock | `sequence-e2e.spec.ts` (Scenario A) | UI + API + DB delta | Shallow |
| #2 | Normal Unlock + Auto-Claim | `auto-claim.integration.spec.ts` | API + DB + Auto-trigger | Deep |
| #3 | Emergency Unlock | `sequence-e2e.spec.ts` (Scenario C) | UI only | Shallow |
| #3' | Resync | (未実装) | - | Missing |
| #4 | Challenge + Slashing | `challenge-slashing.integration.spec.ts` | API + DB + Slashing calc | Deep |
| #5 | Prover Registration | `sequence-e2e.spec.ts` (Scenario D) | UI + API | Shallow |
| #6 | Prover Exit | `sequence-e2e.spec.ts` (Scenario E) | UI only | Shallow |
| #7 | Governance Proposal | `sequence-e2e.spec.ts` (Scenario F) | API + DB + count delta | Medium |
| #8 | Emergency Pause | `emergency-pause.integration.spec.ts` | API + status verify | Deep |
| #9 | Token Hub (veQS) | `sequence-e2e.spec.ts` (Scenario G) | UI only | Shallow |

#### B-1 タスク

- [ ] **B-1a**: SEQ#1 Lock 深化 — DB record 検証 + L1 tx hash 確認
- [ ] **B-1b**: SEQ#3 Emergency Unlock 深化 — Bond計算 + 7d timelock検証
- [ ] **B-1c**: SEQ#3' Resync テスト新規作成 — polling + manual resync
- [ ] **B-1d**: SEQ#5 Prover Registration 深化 — Stake検証 + Registry確認
- [ ] **B-1e**: SEQ#6 Prover Exit 深化 — Unbonding 7d + slash-vulnerable検証
- [ ] **B-1f**: SEQ#9 Token Hub 深化 — veQS lock/delegate/rewards API検証
- [ ] **B-1g**: Cross-sequence chain test — Lock -> Unlock -> Challenge 全レイヤー通し

### B-2: VRF Chainlink デプロイ (Sepolia)

**Current State**: VRFConsumerV2Production.sol 実装済み、デプロイスクリプト未作成

#### B-2 タスク

- [ ] **B-2a**: `script/DeployVRFConsumer.s.sol` Forge デプロイスクリプト作成
- [ ] **B-2b**: Chainlink VRF Subscription 作成 (Sepolia)
- [ ] **B-2c**: VRFConsumerV2Production を Sepolia にデプロイ
- [ ] **B-2d**: L1Vault に VRF Consumer アドレス設定
- [ ] **B-2e**: VRF E2E テスト — Unlock -> VRF request -> fulfill -> prover selection

### B-3: Auto-Claim E2E 検証

**Current State**: 7テスト全パス（既存）、本番環境での動作未検証

- [ ] **B-3a**: Railway 上の Auto-Claim service 動作確認
- [ ] **B-3b**: Normal unlock -> 24h後 auto-claim -> released 確認
- [ ] **B-3c**: Emergency unlock -> 7d後 auto-claim -> released 確認

### B Phase Gate Check

```bash
# 全9シーケンスのE2Eテスト pass
NO_SERVER=1 npx playwright test e2e/integration/ --project=chromium

# VRF contract デプロイ済み
cast call $VRF_CONSUMER "owner()" --rpc-url $SEPOLIA_RPC

# Auto-Claim service running
curl https://$RAILWAY_URL/v1/health | jq .services.auto_claim

# 全テスト結果
cargo test && npx playwright test
```

---

## Phase C: Security Hardening

### C-1: Security Headers & HTTPS

| Header | Value | Implementation |
|--------|-------|---------------|
| Strict-Transport-Security | max-age=31536000; includeSubDomains | Tower middleware |
| Content-Security-Policy | default-src 'self' | Next.js config |
| X-Frame-Options | DENY | Tower middleware |
| X-Content-Type-Options | nosniff | Tower middleware |
| Referrer-Policy | strict-origin-when-cross-origin | Tower middleware |

- [ ] **C-1a**: Backend security headers middleware
- [ ] **C-1b**: Next.js security headers config
- [ ] **C-1c**: HTTPS redirect enforcement

### C-2: Rate Limiting Production Tuning

- [ ] **C-2a**: Per-endpoint rate limits (Lock: 10/min, Unlock: 5/min, Auth: 20/min)
- [ ] **C-2b**: Redis-backed rate limiter (multi-instance対応)
- [ ] **C-2c**: Rate limit load test (k6 script)

### C-3: Secret Rotation & Management

| Secret | Current | Target |
|--------|---------|--------|
| L1 Private Key | env var | AWS Secrets Manager / HashiCorp Vault |
| JWT Secret | env var | Auto-rotate 90 days |
| DB Password | env var | Managed secret |
| Infura API Key | env var | Managed secret |

- [ ] **C-3a**: Secret management solution 選定 (Vault vs AWS SM)
- [ ] **C-3b**: JWT secret rotation 自動化
- [ ] **C-3c**: CI/CD secret injection setup

### C-4: External Security Audit

- [ ] **C-4a**: Audit firm 選定 (Sigma Prime / Trail of Bits / OpenZeppelin)
- [ ] **C-4b**: Scope document 作成 (L1 contracts + Backend API)
- [ ] **C-4c**: Audit 実施 (4-6 weeks)
- [ ] **C-4d**: Finding 対応 & re-audit

---

## Phase D: Monitoring & Observability

### D-1: Prometheus + Grafana

**Current State**: docker-compose.production.yml に設定済み、ダッシュボード未整備

- [ ] **D-1a**: Grafana dashboard: API latency / throughput / error rate
- [ ] **D-1b**: Grafana dashboard: L1/L3 transaction status
- [ ] **D-1c**: Grafana dashboard: VRF fulfillment latency
- [ ] **D-1d**: Grafana dashboard: Auto-Claim success rate

### D-2: Error Tracking

- [ ] **D-2a**: Sentry Rust SDK integration (backend)
- [ ] **D-2b**: Sentry Next.js integration (frontend)
- [ ] **D-2c**: Source maps upload to Sentry
- [ ] **D-2d**: Alert rules: P0 (5xx > 1%), P1 (4xx > 10%)

### D-3: Business Metrics

| Metric | Source | Dashboard |
|--------|--------|-----------|
| Total Locks / TVL | DB + L1 | Overview |
| Unlock success rate | DB | Operations |
| VRF fulfillment time | VRF service | VRF Health |
| Prover pool size | L1 Registry | Prover |
| Governance participation | L3 Governor | Governance |
| Challenge frequency | DB | Security |

### D-4: Alerting

| Alert | Condition | Channel | Severity |
|-------|-----------|---------|----------|
| API Down | health != healthy for 2m | PagerDuty | P0 |
| High Error Rate | 5xx > 1% for 5m | Slack + PagerDuty | P0 |
| VRF Timeout | fulfillment > 5m | Slack | P1 |
| Low Prover Count | active < 3 | Slack | P1 |
| DB Connection Pool Exhausted | available = 0 | PagerDuty | P0 |
| L1 TX Failure | tx revert for 3x | Slack | P1 |
| Emergency Pause Triggered | pause event | PagerDuty + Slack | P0 |
| Disk Space Low | < 15% | Slack | P2 |

---

## Phase E: Performance & Gas

### E-1: Gas Benchmark

| Operation | Current Estimate | Target | Contract |
|-----------|-----------------|--------|----------|
| lockWithSR0 | ~135K gas | < 150K | L1Vault |
| requestUnlock | ~200K gas | < 250K | L1Vault |
| executeUnlock | ~490K gas | < 500K | L1Vault |
| emergencyUnlock | ~300K gas | < 350K | L1Vault |
| registerProver | ~250K gas | < 300K | ProverRegistry |
| submitChallenge | ~180K gas | < 200K | L1Vault |
| SPHINCS+ verify | ~2M gas | optimize | SPHINCSVerifier |

- [ ] **E-1a**: Forge gas snapshot per operation
- [ ] **E-1b**: Gas optimization for SPHINCS+ verification (batch)
- [ ] **E-1c**: Gas report document

### E-2: Frontend Performance

| Metric | Target | Tool |
|--------|--------|------|
| LCP | < 2.5s | Lighthouse |
| FID | < 100ms | Lighthouse |
| CLS | < 0.1 | Lighthouse |
| Bundle size | < 500KB (gzip) | next-bundle-analyzer |

### E-3: Backend Load Testing

```bash
# k6 script targets
k6 run --vus 100 --duration 5m load-test.js
```

| Endpoint | Target RPS | Target p99 |
|----------|-----------|-----------|
| GET /v1/health | 1000 | < 10ms |
| GET /v1/locks | 500 | < 50ms |
| POST /v1/lock | 100 | < 200ms |
| POST /v1/unlock | 50 | < 500ms |

### E-4: DB Query Optimization

- [ ] **E-4a**: EXPLAIN ANALYZE on top 10 queries
- [ ] **E-4b**: Missing index identification
- [ ] **E-4c**: Connection pool tuning (min/max)

---

## Phase F: Documentation & Compliance

### F-1: SECURITY.md

```markdown
# Security Policy
- Responsible disclosure: security@quantum-shield.io
- Bug bounty program (after launch)
- CP-1 compliance: NIST FIPS 204/205/202 only
- Supported versions
```

### F-2: API Documentation

- [ ] **F-2a**: OpenAPI 3.0 spec generation from Axum routes
- [ ] **F-2b**: Swagger UI hosting (/docs endpoint)
- [ ] **F-2c**: Authentication guide (SIWE + JWT)
- [ ] **F-2d**: Rate limiting documentation

### F-3: Incident Response Playbook

| Scenario | Response | Team | SLA |
|----------|----------|------|-----|
| API outage | Restart + investigate | On-call | 15min |
| L1 tx stuck | Gas price bump + resubmit | DevOps | 30min |
| Security breach | Emergency pause (5/9 council) | Security Council | 5min |
| VRF failure | Fallback to prevrandao | Auto | 5min (timeout) |
| DB corruption | Restore from backup | DevOps | 1h |
| DDoS | Cloudflare WAF rules | DevOps | 15min |

### F-4: Compliance

- [ ] **F-4a**: SOC2 Type 1 compliance gap analysis
- [ ] **F-4b**: Data retention policy document
- [ ] **F-4c**: Privacy policy (GDPR considerations)
- [ ] **F-4d**: Terms of service

---

## Phase G: Public Launch

### G-1: Mainnet Contract Deployment

**Prerequisites**: Phase C-4 (security audit) MUST be complete

- [ ] **G-1a**: Mainnet deployment script (L1 Ethereum + L3 Arbitrum)
- [ ] **G-1b**: Contract verification on Etherscan + Arbiscan
- [ ] **G-1c**: Multi-sig ownership transfer
- [ ] **G-1d**: Backend config switch (testnet -> mainnet)

### G-2: DNS & CDN

| Domain | Service | Provider |
|--------|---------|----------|
| quantum-shield.io | Frontend | Vercel + Cloudflare |
| api.quantum-shield.io | Backend | Railway + Cloudflare |
| docs.quantum-shield.io | API docs | Vercel |

### G-3: Launch Announcement

- [ ] **G-3a**: README.md update with live demo link
- [ ] **G-3b**: Blog post: "Building Post-Quantum Security for Ethereum"
- [ ] **G-3c**: Demo video (Ecosystem -> Lock -> History -> Explorer)
- [ ] **G-3d**: EF Grant application update with live URL
- [ ] **G-3e**: Twitter/X announcement thread

### G-4: Post-Launch Monitoring (72h)

- [ ] **G-4a**: 24/7 on-call rotation (first 72h)
- [ ] **G-4b**: Hourly health check dashboard review
- [ ] **G-4c**: User feedback collection & triage
- [ ] **G-4d**: Go/No-Go for full public access

---

## Timeline (Target)

```
Week 1-2:  Phase B (Sequence Testing + VRF Deploy)
Week 3-4:  Phase C (Security Hardening)
Week 5-6:  Phase D (Monitoring) + Phase E (Performance)
Week 7-8:  Phase F (Documentation)
Week 9-12: Phase C-4 (External Audit) — parallel with F
Week 13:   Phase G (Public Launch)
```

---

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|-----------|
| VRF Chainlink outage | Unlock delayed | Medium | prevrandao fallback (5min timeout) |
| L1 gas spike | TX stuck | Medium | Dynamic gas pricing + priority fee |
| Prover pool < 3 | Unlock availability | Low | Emergency unlock path (bond) |
| Security vulnerability | Fund loss | Low | Audit + bug bounty + emergency pause |
| Railway downtime | API unavailable | Low | Multi-region failover plan |
| DB data loss | Catastrophic | Very Low | Daily backup + point-in-time recovery |

---

## Success Criteria

| Criteria | Metric | Target |
|----------|--------|--------|
| System uptime | health endpoint | > 99.5% |
| Lock->Unlock success rate | DB records | > 99% |
| VRF fulfillment | avg latency | < 30s |
| API response time | p99 | < 500ms |
| E2E test pass rate | Playwright | 100% |
| Security findings | Critical/High | 0 |
| Frontend performance | Lighthouse score | > 90 |
