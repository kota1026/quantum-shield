# Phase 8-D: L1 Integration Prompt

> QS Admin管理画面のL1（Ethereum Sepolia）統合

---

## 概要

Phase 8-DのL1統合では、QS Admin管理画面からL1（Sepolia）への接続と、ブリッジ検証・Treasury Vault統合を実装します。

### 対象タスク

| # | Task | 優先度 | 依存関係 |
|---|------|:------:|----------|
| 06 | Sepolia Connection | P0 | - |
| 07 | Bridge Verifier Integration | P0 | Task 06 |
| 08 | Treasury Vault Integration | P1 | Task 06, 07 |
| 09 | L1 Transaction Monitoring | P1 | Task 06 |
| 10 | End-to-End L3→L1 Flow | P2 | Task 04-09 |

---

## Task 06: Sepolia Connection

### 目的
QS AdminバックエンドからEthereum Sepoliaへの接続を確立する。

### 実装要件

```rust
// services/api/src/services/l1_client.rs

use ethers::prelude::*;
use std::sync::Arc;

pub struct L1Client {
    provider: Arc<Provider<Http>>,
    chain_id: u64,
}

impl L1Client {
    pub async fn new(rpc_url: &str, chain_id: u64) -> Result<Self, L1Error> {
        let provider = Provider::<Http>::try_from(rpc_url)
            .map_err(|e| L1Error::Connection(e.to_string()))?;
        
        // Verify chain ID
        let actual_chain_id = provider.get_chainid().await
            .map_err(|e| L1Error::Connection(e.to_string()))?;
        
        if actual_chain_id.as_u64() != chain_id {
            return Err(L1Error::ChainMismatch {
                expected: chain_id,
                actual: actual_chain_id.as_u64(),
            });
        }

        Ok(Self {
            provider: Arc::new(provider),
            chain_id,
        })
    }

    /// L1ブロック高取得
    pub async fn get_block_number(&self) -> Result<u64, L1Error> {
        self.provider.get_block_number().await
            .map(|n| n.as_u64())
            .map_err(|e| L1Error::Query(e.to_string()))
    }

    /// トランザクションステータス取得
    pub async fn get_tx_status(&self, tx_hash: &str) -> Result<TxStatus, L1Error> {
        let hash = tx_hash.parse::<H256>()
            .map_err(|_| L1Error::InvalidTxHash)?;
        
        let receipt = self.provider.get_transaction_receipt(hash).await
            .map_err(|e| L1Error::Query(e.to_string()))?;
        
        match receipt {
            Some(r) => Ok(if r.status == Some(1.into()) {
                TxStatus::Confirmed
            } else {
                TxStatus::Failed
            }),
            None => Ok(TxStatus::Pending),
        }
    }
}
```

### 環境変数

```env
# Sepolia Testnet
L1_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
L1_CHAIN_ID=11155111
L1_TIMEOUT_MS=60000

# Contract Addresses (Sepolia)
BRIDGE_VERIFIER_ADDRESS=0x...
TREASURY_VAULT_ADDRESS=0x...
```

---

## Task 07: Bridge Verifier Integration

### 目的
L3→L1ブリッジの検証結果をL1コントラクトから取得する。

### コントラクトインターフェース

```solidity
// IBridgeVerifier.sol
interface IBridgeVerifier {
    /// @notice L3トランザクションの検証状態を取得
    function getVerificationStatus(bytes32 l3TxHash) 
        external view returns (VerificationStatus);

    /// @notice 検証完了イベント
    event VerificationCompleted(
        bytes32 indexed l3TxHash,
        bytes32 indexed l1TxHash,
        bool success
    );
}
```

### Rust実装

```rust
// services/api/src/services/bridge_verifier.rs

abigen!(
    BridgeVerifier,
    "./abi/BridgeVerifier.json"
);

pub struct BridgeVerifierService {
    contract: BridgeVerifier<Provider<Http>>,
}

impl BridgeVerifierService {
    pub async fn get_verification_status(
        &self,
        l3_tx_hash: &str,
    ) -> Result<VerificationStatus, L1Error> {
        let hash = l3_tx_hash.parse::<[u8; 32]>()
            .map_err(|_| L1Error::InvalidTxHash)?;
        
        self.contract.get_verification_status(hash).call().await
            .map_err(|e| L1Error::ContractCall(e.to_string()))
    }
}
```

---

## Task 08: Treasury Vault Integration

### 目的
Treasury VaultコントラクトからAdmin画面用データを取得する。

### コントラクトインターフェース

```solidity
// ITreasuryVault.sol
interface ITreasuryVault {
    /// @notice Vault残高取得
    function getBalance() external view returns (uint256);

    /// @notice 出金履歴取得
    function getWithdrawals(uint256 offset, uint256 limit) 
        external view returns (Withdrawal[] memory);

    /// @notice Admin出金実行（multisig required）
    function withdraw(
        address to,
        uint256 amount,
        bytes calldata l3Signature
    ) external returns (bytes32 txHash);
}
```

### Rust実装

```rust
// services/api/src/services/treasury_vault.rs

abigen!(
    TreasuryVault,
    "./abi/TreasuryVault.json"
);

pub struct TreasuryVaultService {
    contract: TreasuryVault<SignerMiddleware<Provider<Http>, LocalWallet>>,
}

impl TreasuryVaultService {
    /// Vault残高取得
    pub async fn get_balance(&self) -> Result<U256, L1Error> {
        self.contract.get_balance().call().await
            .map_err(|e| L1Error::ContractCall(e.to_string()))
    }

    /// 出金履歴取得
    pub async fn get_withdrawals(
        &self,
        offset: u64,
        limit: u64,
    ) -> Result<Vec<Withdrawal>, L1Error> {
        self.contract
            .get_withdrawals(U256::from(offset), U256::from(limit))
            .call().await
            .map_err(|e| L1Error::ContractCall(e.to_string()))
    }

    /// 出金実行（L3署名必須）
    pub async fn withdraw(
        &self,
        to: Address,
        amount: U256,
        l3_signature: Vec<u8>,
    ) -> Result<H256, L1Error> {
        let tx = self.contract
            .withdraw(to, amount, l3_signature.into())
            .send().await
            .map_err(|e| L1Error::TxSubmission(e.to_string()))?;
        
        Ok(tx.tx_hash())
    }
}
```

---

## Task 09: L1 Transaction Monitoring

### 目的
L1トランザクションの状態を監視し、Admin画面に反映する。

### 実装要件

```rust
// services/api/src/services/l1_monitor.rs

pub struct L1Monitor {
    l1_client: Arc<L1Client>,
    poll_interval: Duration,
}

impl L1Monitor {
    /// トランザクション確認待ち
    pub async fn wait_for_confirmation(
        &self,
        tx_hash: &str,
        confirmations: u64,
    ) -> Result<TxReceipt, L1Error> {
        loop {
            let status = self.l1_client.get_tx_status(tx_hash).await?;
            
            match status {
                TxStatus::Confirmed => {
                    let current_block = self.l1_client.get_block_number().await?;
                    let tx_block = self.get_tx_block(tx_hash).await?;
                    
                    if current_block - tx_block >= confirmations {
                        return Ok(TxReceipt { ... });
                    }
                }
                TxStatus::Failed => {
                    return Err(L1Error::TxFailed);
                }
                TxStatus::Pending => {
                    // Continue waiting
                }
            }
            
            tokio::time::sleep(self.poll_interval).await;
        }
    }
}
```

---

## Task 10: End-to-End L3→L1 Flow

### 目的
Admin操作の完全なL3→L1フローを実装・検証する。

### 完全フロー

```
┌─────────────────────────────────────────────────────────────────┐
│                    End-to-End Flow                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Admin: Treasury出金リクエスト                                │
│         ↓                                                        │
│  2. Backend: メッセージ生成 + Dilithium署名                      │
│         ↓                                                        │
│  3. L3: トランザクション実行                                     │
│         ↓                                                        │
│  4. L3: Prover署名 + ブリッジへ送信                              │
│         ↓                                                        │
│  5. Bridge: L1への検証データ提出                                 │
│         ↓                                                        │
│  6. L1: BridgeVerifier検証                                       │
│         ↓                                                        │
│  7. L1: TreasuryVault出金実行                                    │
│         ↓                                                        │
│  8. Backend: L1確認 + DB更新                                     │
│         ↓                                                        │
│  9. Admin: 完了表示                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 統合テスト

```rust
#[tokio::test]
async fn test_e2e_treasury_withdrawal() {
    // Setup
    let l3_client = L3Client::new(&env::var("L3_NODE_ENDPOINT").unwrap());
    let l1_client = L1Client::new(
        &env::var("L1_RPC_URL").unwrap(),
        11155111, // Sepolia
    ).await.unwrap();

    // 1. Create withdrawal request
    let amount = U256::from(1_000_000_000_000_000_000u128); // 1 ETH
    let to = "0x...".parse().unwrap();

    // 2. Generate L3 signature
    let message = build_admin_signing_message(...);
    let signature = sign_ml_dsa_65(&message, &signing_key).unwrap();

    // 3. Submit to L3
    let l3_receipt = l3_client.submit_transaction(...).await.unwrap();

    // 4. Wait for L1 confirmation
    let l1_receipt = l1_monitor.wait_for_confirmation(
        &l3_receipt.bridge_tx_hash,
        2, // 2 confirmations
    ).await.unwrap();

    // 5. Verify final state
    assert_eq!(l1_receipt.status, TxStatus::Confirmed);
}
```

---

## BE Rules 準拠

| ルール | 要件 |
|--------|------|
| BE-001 | L1トランザクションは実際にSepoliaに送信する（モック禁止） |
| BE-002 | テスト用にL1接続をスキップするフラグ禁止 |
| BE-003 | 全L1操作にログ出力必須（TX送信、コントラクト呼び出し、確認待ち） |

---

## 環境設定

### Sepolia Testnet

```env
L1_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
L1_CHAIN_ID=11155111

# Contract Addresses
BRIDGE_VERIFIER_ADDRESS=0x1234...
TREASURY_VAULT_ADDRESS=0x5678...

# Admin Wallet (for signing L1 transactions)
ADMIN_WALLET_PRIVATE_KEY=0x... # Use KMS in production
```

---

## 進捗トラッキング

完了後、docs/phase8/PHASE8_PROGRESS.md を更新：

```markdown
| 06 | Sepolia Connection | ✅ Done |
| 07 | Bridge Verifier Integration | ✅ Done |
| 08 | Treasury Vault Integration | ✅ Done |
| 09 | L1 Transaction Monitoring | ✅ Done |
| 10 | End-to-End L3→L1 Flow | ✅ Done |
```

---

## 次のステップ

Phase 8-D完了後、Phase 8-E（統合テスト）に進む。
