# Quantum Shield API Specification v1.0

> **Version**: 1.0.0
> **Date**: 2026-01-05
> **Status**: Week 2 Implementation
> **OpenAPI**: 3.0.3

---

## Overview

Quantum Shield REST API for L1-L3 Bridge operations.

### Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://api.quantumshield.io/v1` |
| Testnet | `https://api.testnet.quantumshield.io/v1` |
| Local | `http://localhost:8080/v1` |

### Authentication

| Method | Use Case |
|--------|----------|
| JWT Bearer | User operations |
| API Key | Prover/Admin operations |
| mTLS | HSM communication |

---

## Endpoints

### 1. Lock API

#### POST /lock

Lock assets on L1 for cross-chain transfer.

**Request:**

```json
{
  "chain_id": 11155111,
  "asset": "0x0000000000000000000000000000000000000000",
  "amount": "1000000000000000000",
  "dest_addr": "0x1234567890abcdef1234567890abcdef12345678",
  "expiry": 1736150400,
  "nonce": 1,
  "pk_dilithium": "0x...",
  "sig_dilithium": "0x..."
}
```

**Response (200 OK):**

```json
{
  "lock_id": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "sr_0": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "smt_proof": "0x...",
  "status": "pending"
}
```

**Error Responses:**

| Code | Description |
|------|-------------|
| 400 | Invalid request (bad signature, invalid params) |
| 401 | Unauthorized |
| 409 | Nonce already used |
| 500 | Internal server error |

---

### 2. Unlock API

#### POST /unlock

Request normal unlock (24h time lock).

**Request:**

```json
{
  "lock_id": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "dest_addr": "0x1234567890abcdef1234567890abcdef12345678",
  "amount": "1000000000000000000",
  "sig_dilithium": "0x..."
}
```

**Response (200 OK):**

```json
{
  "unlock_id": "0x...",
  "sr_1": "0x...",
  "release_time": 1736236800,
  "time_lock_hours": 24,
  "prover_signatures_required": 2,
  "prover_signatures_collected": 0,
  "status": "pending_signatures"
}
```

#### POST /unlock/emergency

Request emergency unlock (7d time lock, bond required).

**Request:**

```json
{
  "lock_id": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "dest_addr": "0x1234567890abcdef1234567890abcdef12345678",
  "amount": "1000000000000000000",
  "sig_dilithium": "0x..."
}
```

**Response (200 OK):**

```json
{
  "unlock_id": "0x...",
  "sr_1": "0x...",
  "release_time": 1736755200,
  "time_lock_days": 7,
  "bond_required": "500000000000000000",
  "bond_calculation": "MAX(0.5 ETH, amount × 5%)",
  "status": "emergency_pending"
}
```

---

### 3. Status API

#### GET /status/{lock_id}

Get status of a specific lock.

**Response (200 OK):**

```json
{
  "lock_id": "0x...",
  "status": "locked",
  "amount": "1000000000000000000",
  "asset": "0x0000000000000000000000000000000000000000",
  "owner": "0x...",
  "created_at": 1736150400,
  "time_lock_remaining": null,
  "release_time": null,
  "is_emergency": false
}
```

**Status Values:**

| Status | Description |
|--------|-------------|
| `locked` | Assets locked, no unlock initiated |
| `pending_signatures` | Waiting for Prover signatures |
| `unlock_pending` | Time lock in progress |
| `released` | Assets released to user |
| `emergency_pending` | Emergency unlock in progress |
| `challenged` | Under challenge |
| `slashed` | Slashing occurred |

#### GET /status/pending

Get all pending unlocks for the authenticated user.

**Response (200 OK):**

```json
{
  "pending_unlocks": [
    {
      "unlock_id": "0x...",
      "lock_id": "0x...",
      "status": "unlock_pending",
      "release_time": 1736236800,
      "time_lock_remaining": 3600,
      "is_emergency": false
    }
  ],
  "total": 1
}
```

---

### 4. Prover API

#### POST /prover/register

Register as a new Prover.

**Request:**

```json
{
  "operator_addr": "0x...",
  "sphincs_pubkey": "0x...",
  "stake_amount": "400000000000000000000000",
  "hsm_attestation": "0x...",
  "multisig_proof": "0x..."
}
```

**Response (200 OK):**

```json
{
  "prover_id": "0x...",
  "status": "pending_approval",
  "stake_locked": "400000000000000000000000"
}
```

#### GET /prover/{prover_id}

Get Prover status.

**Response (200 OK):**

```json
{
  "prover_id": "0x...",
  "operator_addr": "0x...",
  "status": "active",
  "stake_amount": "400000000000000000000000",
  "total_signatures": 1234,
  "slashing_history": []
}
```

---

### 5. Edition API

#### GET /edition

Get current edition mode.

**Response (200 OK):**

```json
{
  "current_edition": "enterprise",
  "available_editions": ["enterprise", "decentralized"],
  "switch_pending": false,
  "next_switch_time": null
}
```

#### POST /edition/switch (Admin only)

Initiate edition switch.

**Request:**

```json
{
  "target_edition": "decentralized",
  "admin_signature": "0x..."
}
```

**Response (200 OK):**

```json
{
  "switch_id": "0x...",
  "target_edition": "decentralized",
  "effective_time": 1736841600,
  "time_lock_days": 7,
  "status": "pending"
}
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 1001 | INVALID_SIGNATURE | Dilithium signature verification failed |
| 1002 | INVALID_NONCE | Nonce already used or invalid |
| 1003 | EXPIRED_REQUEST | Request expiry has passed |
| 1004 | INSUFFICIENT_BALANCE | Not enough balance for operation |
| 1005 | LOCK_NOT_FOUND | Lock ID does not exist |
| 1006 | UNAUTHORIZED | Authentication failed |
| 1007 | PROVER_NOT_FOUND | Prover ID does not exist |
| 1008 | EDITION_SWITCH_PENDING | Another edition switch is in progress |
| 2001 | TIME_LOCK_ACTIVE | Time lock period not completed |
| 2002 | CHALLENGE_ACTIVE | Lock is under active challenge |
| 2003 | ALREADY_RELEASED | Assets already released |
| 3001 | PROVER_TIMEOUT | Prover response timeout (72h) |
| 3002 | INSUFFICIENT_SIGNATURES | Not enough Prover signatures |
| 5001 | INTERNAL_ERROR | Internal server error |
| 5002 | SERVICE_UNAVAILABLE | Service temporarily unavailable |

---

## Security Requirements

### CP-1 Compliance

| Requirement | Implementation |
|-------------|----------------|
| Dilithium signatures | All user operations require Dilithium-III signature |
| SHA3-256 | All hashing uses SHA3-256, NOT keccak256 |
| No ECDSA | No ECDSA/secp256k1 in cryptographic operations |

### Time Locks

| Operation | Time Lock |
|-----------|----------|
| Normal Unlock | 24 hours |
| Emergency Unlock | 7 days |
| Edition Switch | 7 days |

### Bonds

| Operation | Bond Calculation |
|-----------|------------------|
| Emergency Unlock | MAX(0.5 ETH, amount × 5%) |
| Challenge | MAX(0.1 ETH, amount × 1%) |

---

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| /lock | 10/min per user |
| /unlock | 5/min per user |
| /status/* | 100/min per user |
| /prover/* | 10/min per prover |

---

**END OF SPECIFICATION**
