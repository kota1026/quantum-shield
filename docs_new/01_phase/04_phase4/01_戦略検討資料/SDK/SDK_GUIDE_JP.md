# Quantum Shield SDK ガイド（日本語版）

> **バージョン**: 0.1.0  
> **更新日**: 2026-01-05  
> **フェーズ**: Phase 4 Week 3

---

## 概要

Quantum Shield SDKは、耐量子セキュアブリッジシステムのTypeScript/JavaScript統合を提供します。

- **@quantum-shield/wasm**: Dilithium WASMモジュール（FIPS 204 ML-DSA-65）
- **@quantum-shield/sdk**: Lock/Unlock API付きTypeScript SDK
- **@quantum-shield/react**: 簡単な統合のためのReact Hooks

---

## インストール

```bash
# npm
npm install @quantum-shield/sdk @quantum-shield/wasm

# yarn
yarn add @quantum-shield/sdk @quantum-shield/wasm

# pnpm
pnpm add @quantum-shield/sdk @quantum-shield/wasm
```

Reactアプリケーションの場合:

```bash
npm install @quantum-shield/react @quantum-shield/sdk @quantum-shield/wasm
```

---

## クイックスタート

### 基本的な使い方（Vanilla TypeScript）

```typescript
import { QuantumShieldClient, Network } from '@quantum-shield/sdk';

// クライアントの初期化
const client = new QuantumShieldClient({
  apiUrl: 'https://api.quantumshield.io',
  network: Network.Sepolia,
});

await client.init();

// Dilithium鍵ペアの生成
const keyPair = client.generateKeyPair();
console.log('公開鍵ハッシュ:', keyPair.publicKeyHash);
// 秘密鍵は安全に保管してください！サーバーには送信しないでください。

// ETHのロック
const lockResponse = await client.lock({
  amount: BigInt('1000000000000000000'), // 1 ETH
  tokenAddress: '0x0000000000000000000000000000000000000000',
  dilithiumPubKeyHash: keyPair.publicKeyHash,
});

console.log('ロックID:', lockResponse.lockId);
```

### React統合

```tsx
import { QuantumShieldProvider, useQuantumShield, useLock, useDilithium } from '@quantum-shield/react';

// 1. アプリをプロバイダーでラップ
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

// 2. コンポーネントでフックを使用
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
        <button onClick={connectWallet}>ウォレットを接続</button>
      )}

      {!keyPair && (
        <button onClick={generateKeyPair}>Dilithium鍵を生成</button>
      )}

      {keyPair && (
        <button onClick={handleLock} disabled={isLoading}>
          {isLoading ? 'ロック中...' : '1 ETHをロック'}
        </button>
      )}

      {error && <p className="error">{error.message}</p>}
    </div>
  );
}
```

---

## コアコンセプト

### Dilithium鍵（FIPS 204 ML-DSA-65）

Quantum ShieldはNIST認定の耐量子署名を使用します:

| プロパティ | 値 |
|----------|-------|
| アルゴリズム | ML-DSA-65（Dilithium-III）|
| 標準 | FIPS 204 |
| セキュリティレベル | NISTレベル3（192ビット）|
| 公開鍵 | 1,952バイト |
| 秘密鍵 | 4,032バイト |
| 署名 | 3,309バイト |

```typescript
import { DilithiumCrypto } from '@quantum-shield/sdk';

const crypto = new DilithiumCrypto();
await crypto.init();

// 鍵ペアの生成
const keyPair = crypto.generateKeyPair();
// keyPair.publicKey: 16進文字列（3904文字）
// keyPair.secretKey: 16進文字列（8064文字）
// keyPair.publicKeyHash: SHA3-256ハッシュ（64文字）

// メッセージに署名
const message = DilithiumCrypto.stringToHex('Hello, Quantum!');
const signature = crypto.sign(keyPair.secretKey, message);

// 署名の検証
const result = crypto.verify(keyPair.publicKey, message, signature);
if (result.valid) {
  console.log('署名が検証されました！');
}
```

### タイムロック

Quantum Shieldはセキュリティのためにタイムロックを強制します:

| ロックタイプ | 期間 | 用途 |
|-----------|----------|----------|
| 通常 | 24時間 | 標準アンロック |
| 緊急 | 7日 | 緊急アンロック（ボンド必要）|

```typescript
// タイムロック定数の取得
const normalDuration = client.getNormalTimelockDuration(); // 86400
const emergencyDuration = client.getEmergencyTimelockDuration(); // 604800

// 残り時間の計算
const remaining = await client.getTimeLockRemaining(lockId);
console.log(`${remaining.days}日 ${remaining.hours}時間 ${remaining.minutes}分`);
```

### 緊急ボンド計算

緊急アンロックにはボンドが必要です:

```
ボンド = MAX(0.5 ETH, 金額 × 5%)
```

```typescript
const amount = BigInt('10000000000000000000'); // 10 ETH
const bond = client.calculateEmergencyBond(amount);
// bond = 0.5 ETH（10 ETHの5% = 0.5 ETH、最小値と同じ）
```

### 二次スラッシング

プローバーは失敗に対して二次スラッシングに直面します:

```
スラッシング率 = N² × 10%
```

| 失敗回数 | スラッシング率 |
|----------|---------------|
| 1 | 10% |
| 2 | 40% |
| 3 | 90% |
| 4以上 | 100% |

```typescript
const slashingRate = client.calculateSlashingRate(2);
// slashingRate = 40
```

---

## APIリファレンス

### QuantumShieldClient

#### コンストラクタ

```typescript
new QuantumShieldClient(config: QuantumShieldConfig)
```

| パラメータ | 型 | 説明 |
|-----------|------|-------------|
| `apiUrl` | `string` | APIエンドポイントURL |
| `network` | `Network` | 接続するネットワーク |
| `timeout` | `number?` | リクエストタイムアウト（ms）（デフォルト: 30000）|
| `headers` | `Record<string, string>?` | カスタムヘッダー |

#### メソッド

| メソッド | 戻り値 | 説明 |
|--------|---------|-------------|
| `init()` | `Promise<void>` | SDKとWASMの初期化 |
| `generateKeyPair()` | `DilithiumKeyPair` | 新しい鍵ペアを生成 |
| `lock(request)` | `Promise<LockResponse>` | ETH/トークンをロック |
| `unlock(request)` | `Promise<UnlockResponse>` | アンロックを開始 |
| `getStatus(lockId)` | `Promise<Lock>` | ロックステータスを取得 |
| `getTimeLockRemaining(lockId)` | `Promise<TimeLockRemaining>` | 残り時間を取得 |
| `calculateEmergencyBond(amount)` | `bigint` | ボンドを計算 |
| `calculateSlashingRate(failures)` | `number` | スラッシング%を計算 |

### DilithiumCrypto

| メソッド | 戻り値 | 説明 |
|--------|---------|-------------|
| `init(wasmModule?)` | `Promise<void>` | WASMの初期化 |
| `generateKeyPair()` | `DilithiumKeyPair` | 鍵ペアを生成 |
| `sign(secretKey, message)` | `string` | 署名を作成 |
| `verify(publicKey, message, signature)` | `VerificationResult` | 署名を検証 |
| `sha3Hash(data)` | `string` | SHA3-256ハッシュ |

### WalletConnector

| メソッド | 戻り値 | 説明 |
|--------|---------|-------------|
| `isAvailable()` | `boolean` | ウォレットが利用可能か確認 |
| `connect()` | `Promise<WalletState>` | ウォレットを接続 |
| `disconnect()` | `void` | ウォレットを切断 |
| `switchChain(chainId)` | `Promise<void>` | ネットワークを切り替え |
| `signMessage(message)` | `Promise<string>` | メッセージに署名 |
| `getBalance(address?)` | `Promise<bigint>` | ETH残高を取得 |

---

## React Hooks

### useQuantumShield

メインコンテキストフック:

```typescript
const {
  client,              // SDKクライアントインスタンス
  crypto,              // 暗号モジュール
  wallet,              // ウォレットコネクタ
  walletState,         // ウォレット状態
  keyPair,             // 現在のDilithium鍵ペア
  isInitialized,       // SDK初期化済みか
  isLoading,           // SDKロード中か
  error,               // 初期化エラー
  connectWallet,       // ウォレット接続
  disconnectWallet,    // ウォレット切断
  generateKeyPair,     // 新しい鍵ペアを生成
  setKeyPair,          // 鍵ペアをセット（インポート用）
  clearKeyPair,        // 鍵ペアをクリア
} = useQuantumShield();
```

### useDilithium

鍵管理フック:

```typescript
const {
  keyPair,             // 現在の鍵ペア
  generateKeyPair,     // 鍵ペアを生成
  importKeyPair,       // 鍵ペアをインポート
  clearKeyPair,        // メモリから鍵ペアをクリア
  sign,                // メッセージに署名
  verify,              // 署名を検証
  hasKeyPair,          // 鍵ペアが存在するか
  publicKeyHash,       // 公開鍵ハッシュ（登録用）
} = useDilithium();
```

### useLock

ロック操作:

```typescript
const {
  lock,                // ロック操作を実行
  isLoading,           // ローディング状態
  error,               // エラー状態
  lastLock,            // 最後のロックレスポンス
  reset,               // 状態をリセット
} = useLock();
```

### useUnlock

アンロック操作:

```typescript
const {
  unlock,              // アンロック操作を実行
  createSignedUnlock,  // 署名付きアンロックリクエストを作成
  isLoading,           // ローディング状態
  error,               // エラー状態
  lastUnlock,          // 最後のアンロックレスポンス
  reset,               // 状態をリセット
} = useUnlock();
```

### useWallet

ウォレット接続:

```typescript
const {
  state,               // ウォレット状態
  isConnected,         // ウォレットが接続されているか
  address,             // 接続されたアドレス
  chainId,             // 現在のチェーンID
  connect,             // ウォレットを接続
  disconnect,          // ウォレットを切断
  switchChain,         // チェーンを切り替え
  signMessage,         // メッセージに署名（secp256k1 - ウォレット認証のみ）
  getBalance,          // 残高を取得
  isAvailable,         // ウォレットが利用可能か
  isMetaMask,          // MetaMaskか
  error,               // エラー状態
} = useWallet();
```

### useTimeLock

タイムロック追跡:

```typescript
const {
  timeRemaining,       // 残り時間
  lock,                // ロックデータ
  refresh,             // ロックステータスを更新
  isLoading,           // ローディング状態
  error,               // エラー状態
  isExpired,           // タイムロックが期限切れか
  formattedTime,       // フォーマットされた時間文字列（例: "2d 5h 30m 15s"）
} = useTimeLock(lockId, 1000); // 毎秒自動更新
```

---

## セキュリティに関する注意事項

### コアプリンシプルの準拠

- ✅ **CP-1**: FIPS 204 ML-DSA-65（耐量子）を使用
- ✅ **CP-2**: 秘密鍵はクライアントサイドのみに保存
- ✅ **CP-3**: タイムロックを強制（通常24時間、緊急7日）
- ✅ **CP-4**: スラッシングメカニズムを表示（N² × 10%）
- ✅ **CP-5**: すべての操作はオンチェーントランザクション経由

### 禁止アルゴリズム

SDKは以下を使用しません:
- ❌ ECDSA（量子脆弱）
- ❌ RSA（量子脆弱）
- ❌ secp256k1（MetaMaskウォレット認証を除く）
- ❌ SHA-256 / SHA-2（Grover攻撃リスク）
- ❌ keccak256（SHA3-256を使用）

### 秘密鍵の管理

```typescript
// ⚠️ 重要: secretKeyをいかなるサーバーにも送信しないでください
const keyPair = crypto.generateKeyPair();

// 安全に保存（例: 暗号化されたローカルストレージ）
localStorage.setItem('qs_pk', keyPair.publicKey);
localStorage.setItem('qs_pkh', keyPair.publicKeyHash);
// 本番環境ではsecretKeyをlocalStorageに保存しないでください！
// セキュアエンクレーブまたはハードウェアセキュリティモジュールを使用してください

// 不要になったらメモリからクリア
clearKeyPair();
```

---

## パフォーマンス目標

| 操作 | 目標 | プラットフォーム |
|-----------|--------|----------|
| 鍵生成 | <500ms | M1 Mac, Chrome |
| 署名（32B）| <100ms | M1 Mac, Chrome |
| 検証（32B）| <50ms | M1 Mac, Chrome |
| WASMバンドル | <1MB | gzip圧縮後 |

---

## ブラウザサポート

| ブラウザ | サポート |
|---------|:-------:|
| Chrome 90以上 | ✅ |
| Firefox 90以上 | ✅ |
| Safari 15以上 | ✅ |
| Edge 90以上 | ✅ |
| モバイルChrome | ✅ |
| モバイルSafari | ✅ |

---

## トラブルシューティング

### WASMロード失敗

```typescript
// WASMが正しいMIMEタイプで配信されていることを確認
// サーバー設定に追加:
// Content-Type: application/wasm
```

### MetaMaskが検出されない

```typescript
if (!wallet.isAvailable()) {
  console.log('MetaMaskをインストールしてください');
  window.open('https://metamask.io', '_blank');
}
```

### 署名検証失敗

```typescript
// メッセージが16進エンコードされていることを確認
const message = DilithiumCrypto.stringToHex('my message');
// 間違い: 'my message'
```

---

## サンプル

### 完全なロックフロー

```typescript
import { QuantumShieldClient, Network, UnlockType } from '@quantum-shield/sdk';

async function lockAndUnlockFlow() {
  // 初期化
  const client = new QuantumShieldClient({
    apiUrl: 'https://api.quantumshield.io',
    network: Network.Sepolia,
  });
  await client.init();

  // 鍵ペアの生成
  const keyPair = client.generateKeyPair();

  // 1 ETHをロック
  const lockResponse = await client.lock({
    amount: BigInt('1000000000000000000'),
    tokenAddress: '0x0000000000000000000000000000000000000000',
    dilithiumPubKeyHash: keyPair.publicKeyHash,
  });

  console.log('ロック完了！ ID:', lockResponse.lockId);

  // タイムロックを待つ（本番環境では24時間）
  // ...

  // アンロックを開始
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

  console.log('アンロック開始！ タイムロック期限:', unlockResponse.timelockExpiry);
}
```

---

**SDKガイド 終わり**
