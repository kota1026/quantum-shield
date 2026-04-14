# Quantum Shield API Reference

> **Base URL**: `https://api.quantum-shield.io/v1`
> **Version**: 0.1.0
> **Authentication**: Bearer JWT (via SIWE)

---

## Overview

Quantum Shield API provides 200+ endpoints across 12 domains. This document covers the **core APIs** used by the 9 sequences.

### Authentication Flow

```
1. POST /v1/auth/siwe     → Sign SIWE message with wallet
2. Response: { accessToken, refreshToken }
3. Use: Authorization: Bearer <accessToken>
4. POST /v1/auth/refresh   → Refresh expired access token
```

### Common Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | For protected endpoints | `Bearer <jwt>` |
| `X-User-Address` | Optional | Wallet address for user-specific queries |
| `Content-Type` | For POST | `application/json` |

### Response Format

**Success:**
```json
{
  "lock_id": "0x...",
  "sr_0": "0x...",
  "status": "pending"
}
```

**Error:**
```json
{
  "error": {
    "code": "LOCK_NOT_FOUND",
    "message": "Lock with given ID does not exist"
  }
}
```

---

## Core API Endpoints

### Health & Monitoring

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Liveness check |
| GET | `/health/ready` | No | Readiness check (DB + Redis + L3) |
| GET | `/metrics` | No | Prometheus metrics |

#### GET /v1/health
```json
{ "status": "healthy", "version": "0.1.0", "timestamp": 1775196824 }
```

#### GET /v1/health/ready
```json
{
  "status": "ready",
  "dependencies": {
    "database": { "status": "up", "latency_ms": 2 },
    "redis": { "status": "up", "latency_ms": 1 },
    "l3": { "status": "up", "latency_ms": 15 }
  }
}
```

---

### SEQ#1: Lock

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/lock` | No* | Create a new asset lock |

*Signature verification via `pk_dilithium` + `sig_dilithium` fields.

#### POST /v1/lock

**Request:**
```json
{
  "chain_id": 11155111,
  "asset": "ETH",
  "amount": "1000000000000000000",
  "dest_addr": "0x...",
  "pk_dilithium": "0x...",
  "sig_dilithium": "0x...",
  "expiry": 1775283224,
  "nonce": 1775196824000
}
```

**Response (200):**
```json
{
  "lock_id": "0xa5b76520...",
  "sr_0": "0x0f881c7d...",
  "smt_proof": "0x5e882289...",
  "status": "pending",
  "l1_tx_hash": "0xd295f0f7..."
}
```

**Errors:** 400 (invalid params), 409 (nonce reuse)

---

### SEQ#2: Unlock (Normal Path)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/unlock` | No* | Request normal unlock (24h timelock) |
| POST | `/unlock/claim` | No* | Claim released funds |

#### POST /v1/unlock

**Request:**
```json
{
  "lock_id": "0x...",
  "dest_addr": "0x...",
  "amount": "1000000000000000000",
  "sig_dilithium": "0x..."
}
```

**Response (200):**
```json
{
  "unlock_id": "0x...",
  "sr_1": "0x...",
  "release_time": 1775283224,
  "status": "unlock_pending",
  "vrf_request_id": "0x...",
  "time_lock_hours": 24
}
```

---

### SEQ#3: Emergency Unlock

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/unlock/emergency` | No* | Emergency unlock (7d timelock, bond required) |

#### POST /v1/unlock/emergency

**Request:**
```json
{
  "lock_id": "0x...",
  "dest_addr": "0x...",
  "amount": "1000000000000000000",
  "bond": "500000000000000000",
  "sig_dilithium": "0x..."
}
```

**Bond calculation:** `MAX(0.5 ETH, 5% of amount)`

---

### SEQ#4: Challenge + Slashing

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/challenge` | No | Submit fraud challenge |
| GET | `/challenge/:lock_id` | No | Get challenge info |
| POST | `/challenge/:lock_id/defense` | No | Submit defense proof |
| POST | `/challenge/:lock_id/auto-resolve` | No | Auto-resolve after deadline |

#### POST /v1/challenge

**Request:**
```json
{
  "lock_id": "0x...",
  "challenger": "0x...",
  "fraud_proof": "Description of invalid behavior",
  "bond": "100000000000000000"
}
```

**Response (200):**
```json
{
  "challenge_id": "0x...",
  "lock_id": "0x...",
  "fraud_proof_hash": "0x...",
  "defense_deadline": 1775456024,
  "status": "pending"
}
```

**Slashing distribution:** 60% Challenger, 20% Insurance, 20% Burn

---

### SEQ#5: Prover Registration

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/prover/register` | No* | Register new prover |
| GET | `/prover/list` | No | List all provers |
| GET | `/prover/:id` | No | Get prover info |

#### POST /v1/prover/register

**Request:**
```json
{
  "name": "My Prover",
  "address": "0x...",
  "stake": "32000000000000000000",
  "dilithium_pubkey": "0x...",
  "sphincs_pubkey": "0x...",
  "signature": "0x..."
}
```

---

### SEQ#6: Prover Exit

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/prover/:id/exit` | JWT | Initiate 7-day unbonding |
| GET | `/prover/:id/exit-status` | JWT | Check exit progress |
| POST | `/prover/:id/withdraw` | JWT | Withdraw stake after unbonding |

---

### SEQ#7: Governance

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/governance/proposals` | No | List proposals |
| POST | `/governance/proposals` | JWT | Create proposal |
| POST | `/governance/vote` | JWT | Submit vote |
| GET | `/governance/voting-power` | JWT | Get voting power |

---

### SEQ#8: Emergency Pause

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/emergency/status` | No | Protocol pause status |
| POST | `/emergency/pause` | Council | Pause protocol (5/9 required) |
| POST | `/emergency/unpause` | Council | Unpause protocol |
| POST | `/emergency/extend` | Council | Extend pause duration |

---

### SEQ#9: Token Hub (veQS)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/token-hub/dashboard` | No | User token overview |
| POST | `/token-hub/lock` | JWT | Lock QS tokens for veQS |
| POST | `/token-hub/extend` | JWT | Extend lock duration |
| GET | `/token-hub/delegates` | No | List delegates |
| POST | `/token-hub/delegate` | JWT | Delegate voting power |
| GET | `/token-hub/rewards` | No | Get reward info |
| POST | `/token-hub/claim` | JWT | Claim rewards |

**Lock constraints:** Min 1 week, Max 4 years
**Voting power:** `amount × (remaining_time / 4 years)`

---

### Explorer

| Method | Path | Description |
|--------|------|-------------|
| GET | `/explorer/overview` | Network stats (TVL, locks, provers) |
| GET | `/explorer/locks` | All locks |
| GET | `/explorer/unlocks` | All unlocks |
| GET | `/explorer/challenges/stats` | Challenge statistics |
| GET | `/explorer/provers` | All provers |
| GET | `/explorer/search?q=...` | Search by address/lock_id |

---

## Rate Limiting

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Max requests per window |
| `X-RateLimit-Remaining` | Requests remaining |
| `Retry-After` | Seconds until reset (on 429) |

**Default:** 100 requests/minute per IP

---

## Security Headers

All responses include: HSTS, X-Frame-Options, CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.

See [SECURITY.md](/SECURITY.md) for full details.
