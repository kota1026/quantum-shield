# Quantum Shield SDK Guide

> **Version**: 0.1.0  
> **Updated**: 2026-01-05  
> **Phase**: Phase 4 Week 3

---

## Overview

The Quantum Shield SDK provides TypeScript/JavaScript integration for the post-quantum secure bridge system. It includes:

- **@quantum-shield/wasm**: Dilithium WASM module (FIPS 204 ML-DSA-65)
- **@quantum-shield/sdk**: TypeScript SDK with Lock/Unlock APIs
- **@quantum-shield/react**: React hooks for easy integration

---

## Installation

```bash
# npm
npm install @quantum-shield/sdk @quantum-shield/wasm

# yarn
yarn add @quantum-shield/sdk @quantum-shield/wasm

# pnpm
pnpm add @quantum-shield/sdk @quantum-shield/wasm
```

For React applications:

```bash
npm install @quantum-shield/react @quantum-shield/sdk @quantum-shield/wasm
```

---

## Quick Start

### Basic Usage (Vanilla TypeScript)

```typescript
import { QuantumShieldClient, Network } from '@quantum-shield/sdk';

// Initialize client
const client = new QuantumShieldClient({
  apiUrl: 'https://api.quantumshield.io',
  network: Network.Sepolia,
});

await client.init();

// Generate Dilithium key pair
const keyPair = client.generateKeyPair();
console.log('Public Key Hash:', keyPair.publicKeyHash);
// Keep secretKey secure! Never send to server.

// Lock ETH
const lockResponse = await client.lock({
  amount: BigInt('1000000000000000000'), // 1 ETH
  tokenAddress: '0x0000000000000000000000000000000000000000',
  dilithiumPubKeyHash: keyPair.publicKeyHash,
});

console.log('Lock ID:', lockResponse.lockId);
```

### React Integration

```tsx
import { QuantumShieldProvider, useQuantumShield, useLock, useDilithium } from '@quantum-shield/react';

// 1. Wrap your app with provider
function App() {
  return (
    <QuantumShieldProvider
      config={{
        apiUrl: 'https://api.quantumshield.io',
        network: 'sepolia',
      }}
    >
      <MyApp />
    </QuantumShieldProvider>
  );
}

// 2. Use hooks in components
function LockComponent() {
  const { walletState, connectWallet } = useQuantumShield();
  const { keyPair, generateKeyPair, publicKeyHash } = useDilithium();
  const { lock, isLoading, error } = useLock();

  const handleLock = async () => {
    if (!keyPair) return;

    await lock({
      amount: BigInt('1000000000000000000'),
      tokenAddress: '0x0000000000000000000000000000000000000000',
      dilithiumPubKeyHash: publicKeyHash!,
    });
  };

  return (
    <div>
      {!walletState.connected && (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}

      {!keyPair && (
        <button onClick={generateKeyPair}>Generate Dilithium Key</button>
      )}

      {keyPair && (
        <button onClick={handleLock} disabled={isLoading}>
          {isLoading ? 'Locking...' : 'Lock 1 ETH'}
        </button>
      )}

      {error && <p className="error">{error.message}</p>}
    </div>
  );
}
```

---

## Core Concepts

### Dilithium Keys (FIPS 204 ML-DSA-65)

Quantum Shield uses NIST-certified post-quantum signatures:

| Property | Value |
|----------|-------|
| Algorithm | ML-DSA-65 (Dilithium-III) |
| Standard | FIPS 204 |
| Security Level | NIST Level 3 (192-bit) |
| Public Key | 1,952 bytes |
| Secret Key | 4,032 bytes |
| Signature | 3,309 bytes |

```typescript
import { DilithiumCrypto } from '@quantum-shield/sdk';

const crypto = new DilithiumCrypto();
await crypto.init();

// Generate key pair
const keyPair = crypto.generateKeyPair();
// keyPair.publicKey: hex string (3904 chars)
// keyPair.secretKey: hex string (8064 chars)
// keyPair.publicKeyHash: SHA3-256 hash (64 chars)

// Sign a message
const message = DilithiumCrypto.stringToHex('Hello, Quantum!');
const signature = crypto.sign(keyPair.secretKey, message);

// Verify signature
const result = crypto.verify(keyPair.publicKey, message, signature);
if (result.valid) {
  console.log('Signature verified!');
}
```

### Time Locks

Quantum Shield enforces time locks for security:

| Lock Type | Duration | Use Case |
|-----------|----------|----------|
| Normal | 24 hours | Standard unlock |
| Emergency | 7 days | Emergency unlock (requires bond) |

```typescript
// Get time lock constants
const normalDuration = client.getNormalTimelockDuration(); // 86400
const emergencyDuration = client.getEmergencyTimelockDuration(); // 604800

// Calculate remaining time
const remaining = await client.getTimeLockRemaining(lockId);
console.log(`${remaining.days}d ${remaining.hours}h ${remaining.minutes}m`);
```

### Emergency Bond Calculation

Emergency unlocks require a bond:

```
Bond = MAX(0.5 ETH, amount × 5%)
```

```typescript
const amount = BigInt('10000000000000000000'); // 10 ETH
const bond = client.calculateEmergencyBond(amount);
// bond = 0.5 ETH (5% of 10 ETH = 0.5 ETH, equals minimum)
```

### Quadratic Slashing

Provers face quadratic slashing for failures:

```
Slashing Rate = N² × 10%
```

| Failures | Slashing Rate |
|----------|---------------|
| 1 | 10% |
| 2 | 40% |
| 3 | 90% |
| 4+ | 100% |

```typescript
const slashingRate = client.calculateSlashingRate(2);
// slashingRate = 40
```

---

## API Reference

### QuantumShieldClient

#### Constructor

```typescript
new QuantumShieldClient(config: QuantumShieldConfig)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `apiUrl` | `string` | API endpoint URL |
| `network` | `Network` | Network to connect to |
| `timeout` | `number?` | Request timeout in ms (default: 30000) |
| `headers` | `Record<string, string>?` | Custom headers |

#### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `init()` | `Promise<void>` | Initialize SDK and WASM |
| `generateKeyPair()` | `DilithiumKeyPair` | Generate new key pair |
| `lock(request)` | `Promise<LockResponse>` | Lock ETH/tokens |
| `unlock(request)` | `Promise<UnlockResponse>` | Initiate unlock |
| `getStatus(lockId)` | `Promise<Lock>` | Get lock status |
| `getTimeLockRemaining(lockId)` | `Promise<TimeLockRemaining>` | Get remaining time |
| `calculateEmergencyBond(amount)` | `bigint` | Calculate bond |
| `calculateSlashingRate(failures)` | `number` | Calculate slashing % |

### DilithiumCrypto

| Method | Returns | Description |
|--------|---------|-------------|
| `init(wasmModule?)` | `Promise<void>` | Initialize WASM |
| `generateKeyPair()` | `DilithiumKeyPair` | Generate key pair |
| `sign(secretKey, message)` | `string` | Create signature |
| `verify(publicKey, message, signature)` | `VerificationResult` | Verify signature |
| `sha3Hash(data)` | `string` | SHA3-256 hash |

### WalletConnector

| Method | Returns | Description |
|--------|---------|-------------|
| `isAvailable()` | `boolean` | Check wallet available |
| `connect()` | `Promise<WalletState>` | Connect wallet |
| `disconnect()` | `void` | Disconnect wallet |
| `switchChain(chainId)` | `Promise<void>` | Switch network |
| `signMessage(message)` | `Promise<string>` | Sign message |
| `getBalance(address?)` | `Promise<bigint>` | Get ETH balance |

---

## React Hooks

### useQuantumShield

Main context hook:

```typescript
const {
  client,
  crypto,
  wallet,
  walletState,
  keyPair,
  isInitialized,
  isLoading,
  error,
  connectWallet,
  disconnectWallet,
  generateKeyPair,
  setKeyPair,
  clearKeyPair,
} = useQuantumShield();
```

### useDilithium

Key management hook:

```typescript
const {
  keyPair,
  generateKeyPair,
  importKeyPair,
  clearKeyPair,
  sign,
  verify,
  hasKeyPair,
  publicKeyHash,
} = useDilithium();
```

### useLock

Lock operations:

```typescript
const {
  lock,
  isLoading,
  error,
  lastLock,
  reset,
} = useLock();
```

### useUnlock

Unlock operations:

```typescript
const {
  unlock,
  createSignedUnlock,
  isLoading,
  error,
  lastUnlock,
  reset,
} = useUnlock();
```

### useWallet

Wallet connection:

```typescript
const {
  state,
  isConnected,
  address,
  chainId,
  connect,
  disconnect,
  switchChain,
  signMessage,
  getBalance,
  isAvailable,
  isMetaMask,
  error,
} = useWallet();
```

### useTimeLock

Time lock tracking:

```typescript
const {
  timeRemaining,
  lock,
  refresh,
  isLoading,
  error,
  isExpired,
  formattedTime,
} = useTimeLock(lockId, 1000); // Auto-refresh every second
```

---

## Security Notes

### Core Principles Compliance

- ✅ **CP-1**: Uses FIPS 204 ML-DSA-65 (quantum-resistant)
- ✅ **CP-2**: Secret keys stored client-side only
- ✅ **CP-3**: Time locks enforced (24h normal, 7d emergency)
- ✅ **CP-4**: Slashing mechanism displayed (N² × 10%)
- ✅ **CP-5**: All operations via on-chain transactions

### Forbidden Algorithms

The SDK does NOT use:
- ❌ ECDSA (quantum-vulnerable)
- ❌ RSA (quantum-vulnerable)
- ❌ secp256k1 (except MetaMask wallet auth)
- ❌ SHA-256 / SHA-2 (Grover attack risk)
- ❌ keccak256 (use SHA3-256)

### Secret Key Management

```typescript
// ⚠️ IMPORTANT: Never send secretKey to any server
const keyPair = crypto.generateKeyPair();

// Store securely (e.g., encrypted local storage)
localStorage.setItem('qs_pk', keyPair.publicKey);
localStorage.setItem('qs_pkh', keyPair.publicKeyHash);
// DO NOT store secretKey in localStorage in production!
// Use secure enclave or hardware security module

// Clear from memory when not needed
clearKeyPair();
```

---

## Performance Targets

| Operation | Target | Platform |
|-----------|--------|----------|
| Key Generation | <500ms | M1 Mac, Chrome |
| Signing (32B) | <100ms | M1 Mac, Chrome |
| Verification (32B) | <50ms | M1 Mac, Chrome |
| WASM Bundle | <1MB | gzip compressed |

---

## Browser Support

| Browser | Support |
|---------|:-------:|
| Chrome 90+ | ✅ |
| Firefox 90+ | ✅ |
| Safari 15+ | ✅ |
| Edge 90+ | ✅ |
| Mobile Chrome | ✅ |
| Mobile Safari | ✅ |

---

## Troubleshooting

### WASM Load Failure

```typescript
// Ensure WASM is served with correct MIME type
// Add to your server config:
// Content-Type: application/wasm
```

### MetaMask Not Detected

```typescript
if (!wallet.isAvailable()) {
  console.log('Please install MetaMask');
  window.open('https://metamask.io', '_blank');
}
```

### Signature Verification Failed

```typescript
// Ensure message is hex-encoded
const message = DilithiumCrypto.stringToHex('my message');
// NOT: 'my message'
```

---

## Examples

### Complete Lock Flow

```typescript
import { QuantumShieldClient, Network, UnlockType } from '@quantum-shield/sdk';

async function lockAndUnlockFlow() {
  // Initialize
  const client = new QuantumShieldClient({
    apiUrl: 'https://api.quantumshield.io',
    network: Network.Sepolia,
  });
  await client.init();

  // Generate key pair
  const keyPair = client.generateKeyPair();

  // Lock 1 ETH
  const lockResponse = await client.lock({
    amount: BigInt('1000000000000000000'),
    tokenAddress: '0x0000000000000000000000000000000000000000',
    dilithiumPubKeyHash: keyPair.publicKeyHash,
  });

  console.log('Locked! ID:', lockResponse.lockId);

  // Wait for timelock (24 hours in production)
  // ...

  // Initiate unlock
  const recipient = '0x1234...';
  const nonce = Date.now();
  const signature = client.signUnlockMessage(
    keyPair.secretKey,
    lockResponse.lockId,
    recipient,
    nonce
  );

  const unlockResponse = await client.unlock({
    lockId: lockResponse.lockId,
    type: UnlockType.Normal,
    recipient,
    signature,
  });

  console.log('Unlock initiated! Timelock expires:', unlockResponse.timelockExpiry);
}
```

---

**END OF SDK GUIDE**
