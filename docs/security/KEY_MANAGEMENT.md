# Quantum Shield - Key Management Procedures

> **Version**: 1.0
> **Date**: 2026-02-12
> **Status**: Draft - Security Review Required
> **Classification**: CONFIDENTIAL

---

## 1. Key Inventory

### 1.1 Cryptographic Keys Overview

| Key Type | Algorithm | Owner | Generation | Storage | Rotation |
|----------|-----------|-------|-----------|---------|----------|
| User Signing | ML-DSA-65 | User | Client-side | Browser/Backup | User-managed |
| Prover Signing | SPHINCS+-SHA2-128f | Prover Operator | HSM | HSM | On compromise |
| JWT Secret | HMAC-SHA256 | System | Server-side | KMS | Quarterly |
| Admin JWT | HMAC-SHA256 | Admin | System-issued | KMS | Quarterly |
| L1 Deployer | secp256k1 | Foundation | Offline | Cold wallet | Never |
| L1 Operator | secp256k1 | Foundation | Hardware wallet | Hardware wallet | Annual |
| L3 Validator | Ed25519 | Foundation | Server-side | Encrypted file | Annual |
| Database | AES-256 | System | KMS | KMS | Annual |
| TLS Certificate | RSA-2048/ECDSA | System | CA-issued | Server | Annual |
| API Rate Limit | HMAC-SHA256 | System | Random | KMS | Quarterly |

---

## 2. User Key Management (ML-DSA-65)

### 2.1 Key Generation

```
Location: Client-side (user's browser)
Entropy Source: crypto.getRandomValues() (Web Crypto API)
Algorithm: ML-DSA-65 (NIST FIPS 204)
Output:
  - Public Key: 1,952 bytes (stored on-chain + backend)
  - Private Key: 4,032 bytes (NEVER leaves client)

Process:
  1. User initiates key generation in Consumer App
  2. Browser generates random seed via Web Crypto API
  3. ML-DSA-65 key pair derived from seed
  4. Public key sent to backend for lock binding
  5. Private key encrypted with user-chosen password
  6. Encrypted backup offered for download
```

### 2.2 Key Storage

```
Primary: Browser memory (session only)
Backup: Encrypted file download

Encryption of backup:
  - Algorithm: AES-256-GCM
  - Key derivation: PBKDF2 (user password, 600K iterations)
  - Salt: 16 bytes random
  - Output: JSON file with encrypted private key

Format:
{
  "version": "1.0",
  "algorithm": "ML-DSA-65",
  "public_key": "<base64>",
  "encrypted_private_key": "<base64(AES-256-GCM)>",
  "kdf": "PBKDF2",
  "iterations": 600000,
  "salt": "<base64>"
}
```

### 2.3 Key Recovery

```
Recovery Method: Encrypted backup file + password

Steps:
  1. User uploads encrypted backup file
  2. User enters password
  3. PBKDF2 derives decryption key
  4. AES-256-GCM decrypts private key
  5. ML-DSA-65 key pair restored in browser

No Recovery Available If:
  - Backup file lost AND browser storage cleared
  - Password forgotten (no password recovery)
  - User is sole custodian of their keys

Impact of Lost Key:
  - Locked assets remain locked (time lock expires normally)
  - New key pair required for future operations
  - Existing locks cannot be unlocked without original key
    (Emergency path available with bond)
```

### 2.4 Key Binding

```
Lock Operation:
  - User's public key is stored with the lock record
  - Lock ID = SHA3-256(address + amount + nonce + pk_dilithium)
  - Public key bound to lock at creation time
  - Only matching private key can produce valid unlock signature

Verification:
  - Backend verifies ML-DSA-65 signature against stored public key
  - L3 re-verifies signature during consensus
  - L1 verifies state root which includes signature verification result
```

---

## 3. Prover Key Management (SPHINCS+)

### 3.1 Requirements

```
Hardware: HSM (Hardware Security Module) REQUIRED
  - FIPS 140-2 Level 3 or higher
  - Tamper-evident enclosure
  - Secure key generation
  - Non-exportable private keys

Recommended HSMs:
  - YubiHSM 2 (cost-effective)
  - Thales Luna (enterprise)
  - AWS CloudHSM (cloud-native)
```

### 3.2 Key Generation

```
Location: Within HSM (private key never extracted)
Algorithm: SPHINCS+-SHA2-128f
Output:
  - Public Key: 32 bytes -> Registered on L3 + PostgreSQL
  - Private Key: 64 bytes -> Stays in HSM

Registration Process:
  1. Prover operator generates key pair in HSM
  2. HSM provides attestation certificate
  3. Public key submitted to registration endpoint
  4. Backend verifies HSM attestation
  5. Public key stored in provers table
  6. Prover added to selection pool after stake confirmed
```

### 3.3 Signing Operations

```
Process:
  1. Backend sends signing request via RabbitMQ
  2. Prover node receives request
  3. Request forwarded to HSM for signing
  4. HSM signs with SPHINCS+ private key
  5. Signature (7,856 bytes) returned to Prover node
  6. Prover submits signature to backend
  7. Backend verifies SPHINCS+ signature with stored public key

Security Properties:
  - Private key never leaves HSM
  - Each signing request logged in HSM audit trail
  - Rate limiting: Max 100 signatures per hour
  - Anomaly detection: Alert if signing rate spikes
```

### 3.4 Key Compromise Response

```
If Prover key compromise is suspected:
  1. Immediately suspend Prover (admin action)
  2. Remove from active selection pool
  3. Audit all signatures from past 30 days
  4. Challenge any suspicious unlocks
  5. Generate new key pair on new/wiped HSM
  6. Re-register with new public key
  7. Post-mortem: How was compromise possible?

Automated Detection:
  - Multiple signatures for same unlock from one prover
  - Signatures outside normal operating hours
  - Signatures from unexpected IP addresses
  - Rapid succession of signatures (>10/min)
```

---

## 4. System Key Management

### 4.1 JWT Secret

```
Type: Symmetric key (256-bit random)
Usage: Sign/verify all JWT tokens
Storage: KMS (production) / Environment variable (dev)
Rotation: Quarterly or on compromise

Rotation Process:
  1. Generate new JWT secret in KMS
  2. Deploy new secret to API servers (rolling update)
  3. Old tokens remain valid until expiry (24h max)
  4. Monitor for authentication issues
  5. Confirm all services using new secret
  6. Remove old secret from KMS after 48 hours
```

### 4.2 Database Credentials

```
Type: Username + Password
Storage: KMS (production) / config file (dev)
Rotation: Quarterly

Rotation Process:
  1. Create new database user with same permissions
  2. Update KMS with new credentials
  3. Rolling restart of API servers
  4. Verify connections with new credentials
  5. Drop old database user after confirmation
```

### 4.3 L1 Operator Key

```
Type: secp256k1 (Ethereum private key)
Usage: Submit transactions to L1 (Sepolia/Mainnet)
Storage: Hardware wallet (Ledger/Trezor)
Access: 2-of-3 multi-sig (Foundation members)

Transaction Types:
  - Deploy/upgrade contracts
  - Emergency pause
  - Treasury operations
  - Not used for user operations (L3 handles those)

Security:
  - Hardware wallet required (no hot keys)
  - Multi-sig: 2/3 Foundation members must sign
  - Daily transaction limit: 100 ETH equivalent
  - Manual review for transactions >10 ETH
```

### 4.4 L3 Validator Keys

```
Type: Ed25519 key pairs
Usage: L3 BFT consensus signing
Storage: Encrypted file on validator node
Access: Root only, file permissions 600

Rotation:
  - Annual rotation scheduled
  - Emergency rotation on compromise
  - Coordinated across all 4 validators

Process:
  1. Generate new key pair on validator
  2. Register new public key in genesis config
  3. Coordinate restart of all 4 validators
  4. Verify consensus resumes with new keys
  5. Remove old keys from all nodes
```

---

## 5. Key Storage Matrix

### 5.1 Development Environment

| Key | Storage Method | Access |
|-----|---------------|--------|
| JWT Secret | `config/default.yaml` | Developer |
| DB Password | `config/default.yaml` | Developer |
| L1 RPC Key | `config/default.yaml` | Developer |
| Test Wallet | `contracts/.env` | Developer |
| Redis Password | None (dev) | Open |

### 5.2 Production Environment

| Key | Storage Method | Access |
|-----|---------------|--------|
| JWT Secret | AWS KMS / HashiCorp Vault | API servers only |
| DB Password | AWS KMS / HashiCorp Vault | API servers only |
| L1 RPC Key | AWS KMS / HashiCorp Vault | API servers only |
| L1 Operator | Hardware wallet (Ledger) | Foundation 2/3 multi-sig |
| L3 Validator | Encrypted file (chmod 600) | Root on validator node |
| TLS Cert | AWS ACM / Let's Encrypt | Load balancer |
| Admin Keys | KMS + IP allowlist | Admin only |

---

## 6. Access Control

### 6.1 Key Access Matrix

| Role | User Keys | Prover Keys | JWT Secret | DB Creds | L1 Keys |
|------|:---------:|:-----------:|:----------:|:--------:|:-------:|
| End User | Own only | None | None | None | None |
| Prover | None | Own HSM | None | None | None |
| Developer | None | None | Dev only | Dev only | Test only |
| DevOps | None | None | Prod (deploy) | Prod (deploy) | None |
| Admin | None | None | None | None | None |
| CEO | None | None | Emergency | Emergency | 1/3 signer |

### 6.2 Separation of Duties

```
Principle: No single person can:
  - Deploy to production AND access production database
  - Sign L1 transactions alone (2/3 required)
  - Activate emergency pause alone (5/9 council)
  - Rotate JWT secret AND access user sessions
```

---

## 7. Backup & Recovery

### 7.1 Key Backup Strategy

| Key | Backup Method | Recovery Time | Location |
|-----|-------------|:------------:|----------|
| JWT Secret | KMS automatic backup | Immediate | Multi-region KMS |
| DB Creds | KMS automatic backup | Immediate | Multi-region KMS |
| L1 Operator | Seed phrase (metal plate) | 1 hour | Bank safe deposit box |
| L3 Validator | Encrypted USB + printed key | 2 hours | 2 separate physical locations |
| User Keys | User responsibility | N/A | User backup file |
| Prover Keys | HSM backup module | 4 hours | Offsite secure facility |

### 7.2 Disaster Recovery for Keys

```
Scenario: Complete infrastructure loss

Recovery Steps:
  1. Provision new infrastructure (Terraform)
  2. Restore KMS keys (automatic from AWS backup)
  3. Restore database from backup (encrypted)
  4. Deploy API with KMS-sourced credentials
  5. L3 validators: Restore from encrypted backup
  6. L1 operator: Recover from seed phrase
  7. Verify all systems operational
  8. Resume service

Estimated Recovery Time: 4-8 hours
```

---

## 8. Compliance & Audit

### 8.1 Key Management Audit

| Audit Item | Frequency | Responsible |
|-----------|:---------:|------------|
| Key inventory review | Quarterly | Security team |
| Access control review | Quarterly | Security team |
| KMS access logs review | Monthly | DevOps |
| HSM audit log review | Monthly | Prover ops |
| Key rotation compliance | Quarterly | DevOps |
| Backup verification | Monthly | DevOps |

### 8.2 Key Lifecycle Events (Logged)

```
All key lifecycle events must be logged:
  - Generation (who, when, where)
  - Distribution (to which system/person)
  - Activation (when put into use)
  - Rotation (old key -> new key)
  - Revocation (reason, who authorized)
  - Destruction (method, confirmation)
```

---

*Generated: 2026-02-12*
*Next Review: Before External Audit*
