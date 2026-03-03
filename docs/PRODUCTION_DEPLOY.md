# Quantum Shield - Production Deployment Runbook

## Architecture Overview

```
                    Internet
                       |
                   [Nginx/CDN]
                    /       \
        [Next.js Frontend]  [Rust API :8080]
                               |
              +-------+--------+--------+
              |       |        |        |
           [Postgres] [Redis] [RabbitMQ] [L1 Sepolia RPC]
              |                          [L3 Arb Sepolia RPC]
          [Auto-Claim]
          [Event Bridge]
          [Monitor Bot]
          [STARK Prover]
```

**Services**: 4 Rust binaries + 3 infra + 3 monitoring
**Blockchain**: L1 Sepolia (11155111) + L3 Arbitrum Sepolia (421614)
**Crypto**: NIST FIPS 204 ML-DSA-65 (Dilithium-III) + SHA3-256

---

## Pre-deployment Checklist

| # | Item | Command / Action |
|---|------|-----------------|
| 1 | Docker Compose v2 installed | `docker compose version` (>= 2.20) |
| 2 | L1 contracts deployed to Sepolia | Verify on etherscan.io |
| 3 | L3 contracts deployed to Arb Sepolia | Verify on sepolia.arbiscan.io |
| 4 | L3 contracts source-verified (Sourcify) | All 12 `exact_match` |
| 5 | Database migrations ready | `ls src/api/api/migrations/` |
| 6 | `.env.production` configured | See Configuration section |
| 7 | TLS certificates available | For HTTPS termination |
| 8 | DNS configured | API + Frontend subdomains |
| 9 | Infura/Alchemy API keys | L1 + L3 RPC access |
| 10 | Arbiscan API key | Contract verification |

---

## Configuration

### 1. Create `.env.production`

```bash
cd src/infra/docker
cp .env.production.example .env.production
```

### 2. Required Variables

| Variable | Example | Notes |
|----------|---------|-------|
| `L1_RPC_URL` | `https://sepolia.infura.io/v3/...` | Sepolia RPC (HTTPS) |
| `L1_WS_URL` | `wss://sepolia.infura.io/ws/v3/...` | Sepolia WebSocket |
| `L1_VAULT_ADDRESS` | `0x43aF0A4b58CC3f040eF05746e72021dE6D35115B` | L1 Vault contract |
| `PROVER_REGISTRY_ADDRESS` | `0x08e1fc1A0d614bc132B48950760c7A291cCB8946` | L1 ProverRegistry |
| `POSTGRES_PASSWORD` | (generate) | `openssl rand -base64 32` |
| `RABBITMQ_PASSWORD` | (generate) | `openssl rand -base64 32` |
| `JWT_SECRET` | (generate) | `openssl rand -hex 64` |

### 3. L3 Contract Addresses (Arbitrum Sepolia)

```yaml
# src/api/api/config/default.yaml or env vars
l3_endpoint: "https://sepolia-rollup.arbitrum.io/rpc"
l3_chain_id: 421614
l3_core_layer_address: "0xb04F4DFe093dC80420117EDC8300f5EB6F6EDBf0"
l3_ve_qs_address: "0xE72dFa97C9E452dC0b8E6aa026c910D21B20fCAE"
l3_reward_router_address: "0x83E9818ead29B8884d2E49eA3c4b7d5d72824319"
l3_governor_address: "0xe93b8129DC3dBD48E5d78C5A4C156DD1BFa8D65B"
l3_insurance_fund_address: "0x9357e01Bf1ABdE8f3b32DEbaf853a0BAB9aaDfB6"
l3_treasury_address: "0x9Dc3249c8BDcEA8693e73e3BaA071B17Dd84bD55"
```

### 4. Security Parameters (hardened defaults)

| Parameter | Value | Notes |
|-----------|-------|-------|
| Normal time lock | 24 hours | Cannot be shortened |
| Emergency time lock | 7 days | Requires bond |
| Emergency timeout | 72 hours | Auto-cancel after |
| Max pause duration | 72 hours | Admin emergency |
| Emergency bond | 5% (min 0.5 ETH) | Slashed if invalid |
| VRF timeout | 300 seconds | Chainlink VRF |

---

## Deployment Steps

### Step 1: Infrastructure

```bash
cd src/infra/docker

# Start infrastructure services first
docker compose -f docker-compose.production.yml \
  --env-file .env.production \
  up -d postgres redis rabbitmq

# Wait for health checks
docker compose -f docker-compose.production.yml ps
```

### Step 2: Database Migrations

```bash
cd src/api/api

# Run all migrations
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}" \
  sqlx migrate run

# Verify migration count (expect 17+)
psql "$DATABASE_URL" -c "SELECT count(*) FROM _sqlx_migrations;"
```

### Step 3: Backend Services

```bash
cd src/infra/docker

# Start application services
docker compose -f docker-compose.production.yml \
  --env-file .env.production \
  up -d api event-bridge monitor-bot stark-prover

# Verify health
curl http://localhost:8080/v1/health
# Expected: {"status":"healthy"}

curl http://localhost:8080/v1/health/ready
# Expected: {"dependencies":{"database":{"status":"up"},"redis":{"status":"up"},"l3":{"status":"up"}}}
```

### Step 4: Frontend

```bash
cd src/frontend/web

# Build production
pnpm install --frozen-lockfile
pnpm build

# Deploy to Vercel / CDN / Docker
# Option A: Vercel
vercel --prod

# Option B: Docker
docker build -t qs-frontend .
docker run -d -p 3000:3000 qs-frontend
```

### Step 5: Monitoring (optional)

```bash
cd src/infra/docker

# Start monitoring stack
docker compose -f docker-compose.production.yml \
  --env-file .env.production \
  up -d prometheus grafana

# Alertmanager (optional)
docker compose -f docker-compose.production.yml \
  --env-file .env.production \
  --profile alerting \
  up -d alertmanager
```

---

## Health Checks

### Automated

```bash
# All-in-one health check
./src/infra/scripts/deploy/production/deploy.sh health
```

### Manual

| Service | Endpoint | Expected |
|---------|----------|----------|
| API | `GET /v1/health` | `{"status":"healthy"}` |
| API (deep) | `GET /v1/health/ready` | DB + Redis + L3 = `up` |
| Prometheus | `:9090/-/healthy` | 200 OK |
| Grafana | `:3001/api/health` | 200 OK |
| RabbitMQ | `:15672` | Management UI |

### L1/L3 Connectivity

```bash
# L1 block number
curl -s -X POST $L1_RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq .result

# L3 block number
curl -s -X POST https://sepolia-rollup.arbitrum.io/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq .result
```

---

## Operations

### Backup

```bash
# Database backup
./src/infra/scripts/deploy/production/deploy.sh backup

# Manual pg_dump
docker exec qs-postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Rollback

```bash
# Rollback to previous version
./src/infra/scripts/deploy/production/deploy.sh rollback

# Manual: stop services, restore DB, restart
docker compose -f docker-compose.production.yml down
gunzip < backup_20260303.sql.gz | docker exec -i qs-postgres psql -U $POSTGRES_USER $POSTGRES_DB
docker compose -f docker-compose.production.yml up -d
```

### Upgrade

```bash
# Pull latest images and restart
./src/infra/scripts/deploy/production/deploy.sh upgrade
```

### Log Viewing

```bash
# All services
docker compose -f docker-compose.production.yml logs -f

# Specific service
docker compose -f docker-compose.production.yml logs -f api

# Search errors
docker compose -f docker-compose.production.yml logs api 2>&1 | grep ERROR
```

---

## L3 Contract Redeployment

If L3 contracts need to be redeployed:

```bash
cd src/l3

# Set deployer private key (must have Arb Sepolia ETH)
export PRIVATE_KEY=0x<hex_private_key>

# Deploy
forge script script/DeployTestnet.s.sol \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc \
  --broadcast --verify --via-ir

# Verify on Sourcify (per contract)
forge verify-contract <address> <path:name> --chain 421614 --via-ir --watch

# Update config
# 1. src/api/api/config/default.yaml (6 L3 addresses)
# 2. .claude/rules/blockchain.md
# 3. Restart API service
```

---

## WASM SDK Publishing

```bash
cd src/frontend/sdk/wasm

# Build + dry-run
./scripts/publish.sh

# Actual publish (requires `npm login`)
./scripts/publish.sh --publish
```

---

## Resource Requirements

### Minimum (single node)

| Resource | Value |
|----------|-------|
| CPU | 8 cores |
| RAM | 16 GB |
| Disk | 100 GB SSD |
| Network | 100 Mbps |

### Recommended (production)

| Resource | Value |
|----------|-------|
| CPU | 16 cores |
| RAM | 32 GB |
| Disk | 500 GB NVMe |
| Network | 1 Gbps |

### Per-service Limits (from docker-compose.production.yml)

| Service | CPU | Memory |
|---------|-----|--------|
| API | 2 cores | 2 GB |
| Event Bridge | 1 core | 1 GB |
| Monitor Bot | 0.5 core | 512 MB |
| STARK Prover | 4 cores | 8 GB |
| PostgreSQL | 2 cores | 2 GB |
| Redis | 1 core | 1 GB |
| RabbitMQ | 1 core | 1 GB |

---

## Troubleshooting

### API won't start
```bash
# Check logs
docker compose logs api | tail -20

# Common causes:
# 1. DB not ready → wait for postgres health check
# 2. Missing env var → check .env.production
# 3. Migration not run → run sqlx migrate
```

### L1 connection errors
```bash
# Verify RPC URL
curl -s $L1_RPC_URL -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}'
# Expected: {"result":"11155111"} (Sepolia)
```

### L3 connection errors
```bash
# Verify L3 RPC
curl -s https://sepolia-rollup.arbitrum.io/rpc -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
# Expected: {"result":"0x66eee"} (421614)
```

### Auto-Claim not processing
```bash
# Check auto_claim service logs
docker compose logs api | grep auto_claim

# Verify unlock requests exist
psql $DATABASE_URL -c "SELECT id, status, release_time FROM unlock_requests WHERE status = 'pending' AND release_time <= NOW();"
```

---

## Contract Addresses Reference

### L1: Sepolia (Chain 11155111)

| Contract | Address |
|----------|---------|
| Vault | `0x43aF0A4b58CC3f040eF05746e72021dE6D35115B` |
| ProverRegistry | `0x08e1fc1A0d614bc132B48950760c7A291cCB8946` |
| SPHINCS+ Verifier | `0xD090b5A627d9bd6D96a8b5f6F504ebCa79980103` |

### L3: Arbitrum Sepolia (Chain 421614)

| Contract | Address |
|----------|---------|
| CoreLayer | `0xb04F4DFe093dC80420117EDC8300f5EB6F6EDBf0` |
| veQS | `0xE72dFa97C9E452dC0b8E6aa026c910D21B20fCAE` |
| RewardRouter | `0x83E9818ead29B8884d2E49eA3c4b7d5d72824319` |
| Governor | `0xe93b8129DC3dBD48E5d78C5A4C156DD1BFa8D65B` |
| InsuranceFund | `0x9357e01Bf1ABdE8f3b32DEbaf853a0BAB9aaDfB6` |
| Treasury | `0x9Dc3249c8BDcEA8693e73e3BaA071B17Dd84bD55` |
| QSToken | `0xBD66beBE19E664dF143da54808d746192e4f2ee2` |
| GovernanceSwitch | `0x898e26853675368AC051b74809Ac5d0b02f19937` |
| SecurityCouncil | `0xE8278a98e6fe4ecBe19fC9192036C6FaCCD720FF` |
| VeQSRewardDistributor | `0x904F0c22fAB3dfB193D482593BBFAdeE2FBae2FF` |
| ProverRewardPool | `0x24A7958fa27ce160425a9D4204aFF53010e1f77E` |
| ObserverRewardPool | `0xCDb0C88d6711c29ED25BA63888B91F216Acc6784` |

**Deployer**: `0xe69BB031877Cdf6c001BdAEDC0A615B40484CDC3`
**Deployed**: 2026-03-03
**Sourcify**: All 12 contracts `exact_match` verified
