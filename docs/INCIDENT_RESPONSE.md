# Quantum Shield Incident Response Playbook

## Severity Levels

| Level | Response Time | Examples |
|-------|-------------|---------|
| **P0 Critical** | 15 min | API down, fund at risk, security breach |
| **P1 High** | 1 hour | VRF failure, DB connection issues, prover pool < 3 |
| **P2 Medium** | 4 hours | High latency, rate limit bypass, L3 sync delay |
| **P3 Low** | 24 hours | UI bug, minor data inconsistency |

---

## Runbooks

### 1. API Service Down

**Alert:** `APIServiceDown` (P0)

**Symptoms:** `/v1/health` not responding, 502/503 from load balancer

**Steps:**
```bash
# 1. Check process
ssh api-server
systemctl status quantum-shield-api

# 2. Check logs
journalctl -u quantum-shield-api --since "5 minutes ago"

# 3. Check resources
htop  # CPU/Memory
df -h  # Disk

# 4. Restart if needed
systemctl restart quantum-shield-api

# 5. Verify recovery
curl https://api.quantum-shield.io/v1/health
```

**Escalation:** If restart fails, check DB and Redis connectivity (see #2, #3).

---

### 2. Database Down

**Alert:** `DatabaseDown` (P0)

**Symptoms:** `qs_dependency_up{dependency="database"} == 0`

**Steps:**
```bash
# 1. Check PostgreSQL
pg_isready -h $DB_HOST -p 5432

# 2. Check connections
psql -c "SELECT count(*) FROM pg_stat_activity;"

# 3. Check disk space
df -h /var/lib/postgresql/

# 4. Restart if needed
systemctl restart postgresql

# 5. Run pending migrations
sqlx migrate run

# 6. Verify
curl https://api.quantum-shield.io/v1/health/ready | jq .dependencies.database
```

**Escalation:** If connection pool exhausted, increase `max_connections` in `default.yaml`.

---

### 3. Redis Down

**Alert:** `RedisDown` (P1)

**Impact:** Rate limiting disabled, cache miss (API still works but slower)

**Steps:**
```bash
# 1. Check Redis
redis-cli -h $REDIS_HOST ping

# 2. Check memory
redis-cli info memory | grep used_memory

# 3. Restart
systemctl restart redis

# 4. Verify
redis-cli ping
```

---

### 4. VRF Timeout (Normal Unlock Blocked)

**Alert:** VRF fulfillment > 5 minutes

**Impact:** Normal unlock path blocked, users must use emergency path

**Steps:**
```bash
# 1. Check Chainlink VRF status
# Visit: https://vrf.chain.link/sepolia/<subscription_id>

# 2. Check subscription LINK balance
cast call $VRF_COORDINATOR "getSubscription(uint256)" $SUB_ID --rpc-url $SEPOLIA_RPC

# 3. If LINK low, fund subscription
# Transfer LINK to subscription via Chainlink UI

# 4. Check if fallback triggered
curl https://api.quantum-shield.io/v1/metrics | grep vrf
```

**Fallback:** VRF automatically falls back to `block.prevrandao` after 5-minute timeout.

---

### 5. Low Prover Count (< 3)

**Alert:** `LowProverCount` (P1)

**Impact:** VRF 2-of-N selection may not work properly

**Steps:**
```bash
# 1. Check active provers
curl https://api.quantum-shield.io/v1/prover/list | jq '.items | length'

# 2. Check if provers are in unbonding
curl https://api.quantum-shield.io/v1/metrics | grep qs_active_provers

# 3. Contact prover operators
# Check monitoring dashboard for prover health
```

**Mitigation:** Emergency unlock path does not require provers.

---

### 6. Security Breach / Fund Risk

**Alert:** Manual detection or `ChallengeSpike` (P0)

**IMMEDIATE ACTIONS:**
```bash
# 1. EMERGENCY PAUSE (requires 5/9 Security Council signatures)
# Contact Security Council members immediately

# 2. Check recent challenges
curl https://api.quantum-shield.io/v1/explorer/challenges/active | jq

# 3. Check for anomalous transactions
curl https://api.quantum-shield.io/v1/explorer/locks?limit=100 | jq

# 4. Preserve evidence
# Screenshot dashboards, save logs
docker logs api > /tmp/api-$(date +%s).log 2>&1
```

**Post-incident:**
1. Root cause analysis within 24h
2. Security advisory if user data affected
3. Update SECURITY.md with timeline

---

### 7. L1 Transaction Stuck

**Alert:** Manual (pending tx > 30 minutes)

**Steps:**
```bash
# 1. Check pending txs
cast tx $TX_HASH --rpc-url $SEPOLIA_RPC

# 2. Check gas price
cast gas-price --rpc-url $SEPOLIA_RPC

# 3. Speed up with higher gas
cast send --gas-price $(cast gas-price --rpc-url $SEPOLIA_RPC | awk '{print $1 * 1.5}') ...

# 4. If stuck indefinitely, cancel with nonce reuse
cast send --nonce $NONCE --gas-price $HIGHER_PRICE $FROM $FROM 0
```

---

### 8. High Pending Unlocks Backlog

**Alert:** `HighPendingUnlocks` (> 100) or `CriticalPendingUnlocks` (> 500)

**Cause:** Auto-claim service stuck or L1 gas too high

**Steps:**
```bash
# 1. Check auto-claim service
curl https://api.quantum-shield.io/v1/metrics | grep pending_unlocks

# 2. Check auto-claim logs
docker logs api 2>&1 | grep auto_claim | tail -20

# 3. Check if auto-claim is enabled
grep auto_claim config/default.yaml

# 4. Force process pending unlocks
# Check DB for stuck unlock_requests
psql -c "SELECT count(*), status FROM unlock_requests GROUP BY status;"
```

---

### 9. Emergency Pause Active

**Alert:** `Emergency pause triggered` (P0)

**Max Duration:** 72 hours (auto-unpause after)

**Steps:**
```bash
# 1. Check pause status
curl https://api.quantum-shield.io/v1/emergency/status | jq

# 2. Identify who triggered pause
# Check council action logs

# 3. Assess the situation
# - Is the threat real?
# - Is a fix available?

# 4. Decision matrix:
# - Fix available → Deploy fix + unpause
# - Need more time → Request extension (token vote, 48h timelock)
# - False alarm → Unpause immediately
```

---

## Communication Template

### Status Page Update
```
[INVESTIGATING] We are investigating reports of <issue>.
[IDENTIFIED] The issue has been identified as <root cause>.
[MONITORING] A fix has been deployed. We are monitoring the situation.
[RESOLVED] The incident has been resolved. <summary>.
```

### Post-Incident Report Template
```
## Incident Report: <Title>
- **Date:** YYYY-MM-DD
- **Duration:** X hours
- **Severity:** P0/P1/P2/P3
- **Impact:** <who was affected>

### Timeline
- HH:MM - Alert triggered
- HH:MM - Investigation started
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Resolved

### Root Cause
<description>

### Resolution
<what was done>

### Action Items
- [ ] <preventive measure 1>
- [ ] <preventive measure 2>
```

---

## Contacts

| Role | Contact | Escalation |
|------|---------|-----------|
| On-Call Engineer | (configure) | PagerDuty |
| Security Council | security@quantum-shield.io | Direct |
| DevOps | (configure) | Slack #ops |
