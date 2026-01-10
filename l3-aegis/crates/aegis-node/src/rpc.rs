//! RPC server for L3 Aegis Chain

use std::sync::Arc;
use std::net::SocketAddr;
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use tracing::debug;

use aegis_types::{Hash256, Transaction};
use aegis_core::Executor;
use aegis_storage::Storage;

#[derive(Clone, Debug)]
pub struct RpcConfig {
    pub bind_addr: SocketAddr,
    pub max_connections: usize,
}

impl Default for RpcConfig {
    fn default() -> Self {
        Self { bind_addr: "127.0.0.1:8545".parse().unwrap(), max_connections: 100 }
    }
}

#[derive(Debug, Deserialize)]
pub struct JsonRpcRequest {
    pub jsonrpc: String,
    pub method: String,
    pub params: serde_json::Value,
    pub id: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct JsonRpcResponse {
    pub jsonrpc: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<JsonRpcError>,
    pub id: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct JsonRpcError {
    pub code: i32,
    pub message: String,
}

impl JsonRpcResponse {
    pub fn success(result: serde_json::Value, id: serde_json::Value) -> Self {
        Self { jsonrpc: "2.0".into(), result: Some(result), error: None, id }
    }
    pub fn error(code: i32, message: String, id: serde_json::Value) -> Self {
        Self { jsonrpc: "2.0".into(), result: None, error: Some(JsonRpcError { code, message }), id }
    }
}

pub struct RpcHandler {
    executor: Arc<RwLock<Executor>>,
    storage: Option<Arc<Storage>>,
    tx_sender: Option<tokio::sync::mpsc::Sender<Transaction>>,
}

impl RpcHandler {
    pub fn new(
        executor: Arc<RwLock<Executor>>,
        storage: Option<Arc<Storage>>,
        tx_sender: Option<tokio::sync::mpsc::Sender<Transaction>>,
    ) -> Self {
        Self { executor, storage, tx_sender }
    }

    pub async fn handle(&self, request: JsonRpcRequest) -> JsonRpcResponse {
        debug!(method = %request.method, "Handling RPC request");
        match request.method.as_str() {
            "aegis_blockNumber" => self.block_number(request.id).await,
            "aegis_getBlockByNumber" => self.get_block_by_number(&request.params, request.id).await,
            "aegis_getBlockByHash" => self.get_block_by_hash(&request.params, request.id).await,
            "aegis_sendTransaction" => self.send_transaction(&request.params, request.id).await,
            "aegis_getStateRoot" => self.get_state_root(request.id).await,
            "aegis_getUnlock" => self.get_unlock(&request.params, request.id).await,
            "aegis_chainId" => self.chain_id(request.id).await,
            "aegis_nodeInfo" => self.node_info(request.id).await,
            _ => JsonRpcResponse::error(-32601, format!("Method not found: {}", request.method), request.id),
        }
    }

    async fn block_number(&self, id: serde_json::Value) -> JsonRpcResponse {
        let height = self.executor.read().await.state().current_height();
        JsonRpcResponse::success(serde_json::json!(height), id)
    }

    async fn get_block_by_number(&self, params: &serde_json::Value, id: serde_json::Value) -> JsonRpcResponse {
        let height = match params.get(0) {
            Some(serde_json::Value::Number(n)) => n.as_u64().unwrap_or(0),
            Some(serde_json::Value::String(s)) if s == "latest" => self.executor.read().await.state().current_height(),
            _ => return JsonRpcResponse::error(-32602, "Invalid block number".into(), id),
        };
        if let Some(storage) = &self.storage {
            match storage.blocks().get_header_at_height(height) {
                Ok(Some(header)) => {
                    let hash = header.hash();
                    JsonRpcResponse::success(serde_json::json!({
                        "height": header.height, "hash": hash.to_string(),
                        "parentHash": header.parent_hash.to_string(),
                        "stateRoot": header.state_root.to_string(), "timestamp": header.timestamp,
                    }), id)
                }
                Ok(None) => JsonRpcResponse::error(-32602, format!("Block {} not found", height), id),
                Err(e) => JsonRpcResponse::error(-32603, format!("Storage error: {}", e), id),
            }
        } else {
            JsonRpcResponse::error(-32603, "Storage not available".into(), id)
        }
    }

    async fn get_block_by_hash(&self, params: &serde_json::Value, id: serde_json::Value) -> JsonRpcResponse {
        let hash_str = match params.get(0) {
            Some(serde_json::Value::String(s)) => s,
            _ => return JsonRpcResponse::error(-32602, "Invalid block hash".into(), id),
        };
        let hash = match Hash256::from_hex(hash_str) {
            Ok(h) => h,
            Err(_) => return JsonRpcResponse::error(-32602, "Invalid hash format".into(), id),
        };
        if let Some(storage) = &self.storage {
            match storage.blocks().get_header(&hash) {
                Ok(Some(header)) => JsonRpcResponse::success(serde_json::json!({
                    "height": header.height, "hash": hash.to_string(),
                    "parentHash": header.parent_hash.to_string(),
                    "stateRoot": header.state_root.to_string(), "timestamp": header.timestamp,
                }), id),
                Ok(None) => JsonRpcResponse::error(-32602, "Block not found".into(), id),
                Err(e) => JsonRpcResponse::error(-32603, format!("Storage error: {}", e), id),
            }
        } else {
            JsonRpcResponse::error(-32603, "Storage not available".into(), id)
        }
    }

    async fn send_transaction(&self, params: &serde_json::Value, id: serde_json::Value) -> JsonRpcResponse {
        let tx: Transaction = match serde_json::from_value(params.get(0).cloned().unwrap_or_default()) {
            Ok(tx) => tx,
            Err(e) => return JsonRpcResponse::error(-32602, format!("Invalid transaction: {}", e), id),
        };
        if let Err(e) = self.executor.read().await.validate_transaction(&tx) {
            return JsonRpcResponse::error(-32602, format!("Validation failed: {}", e), id);
        }
        let tx_hash = Hash256::hash(&serde_json::to_vec(&tx).unwrap_or_default());
        if let Some(sender) = &self.tx_sender {
            if let Err(e) = sender.send(tx).await {
                return JsonRpcResponse::error(-32603, format!("Failed to submit: {}", e), id);
            }
        }
        JsonRpcResponse::success(serde_json::json!(tx_hash.to_string()), id)
    }

    async fn get_state_root(&self, id: serde_json::Value) -> JsonRpcResponse {
        let root = self.executor.read().await.state().state_root();
        JsonRpcResponse::success(serde_json::json!(root.to_string()), id)
    }

    async fn get_unlock(&self, params: &serde_json::Value, id: serde_json::Value) -> JsonRpcResponse {
        let unlock_id_str = match params.get(0) {
            Some(serde_json::Value::String(s)) => s,
            _ => return JsonRpcResponse::error(-32602, "Invalid unlock ID".into(), id),
        };
        let unlock_id = match Hash256::from_hex(unlock_id_str) {
            Ok(h) => h,
            Err(_) => return JsonRpcResponse::error(-32602, "Invalid hash format".into(), id),
        };
        match self.executor.read().await.state().get_unlock(&unlock_id) {
            Some(u) => JsonRpcResponse::success(serde_json::json!({
                "unlockId": u.unlock_id.to_string(), "lockId": u.lock_id.to_string(),
                "destAddr": u.dest_addr.to_hex(), "amount": u.amount.to_string(),
                "status": format!("{:?}", u.status), "createdAt": u.created_at,
            }), id),
            None => JsonRpcResponse::error(-32602, "Unlock not found".into(), id),
        }
    }

    async fn chain_id(&self, id: serde_json::Value) -> JsonRpcResponse {
        JsonRpcResponse::success(serde_json::json!("0x13881"), id)
    }

    async fn node_info(&self, id: serde_json::Value) -> JsonRpcResponse {
        let height = self.executor.read().await.state().current_height();
        let root = self.executor.read().await.state().state_root();
        JsonRpcResponse::success(serde_json::json!({
            "version": env!("CARGO_PKG_VERSION"),
            "network": "l3-aegis-devnet",
            "currentBlock": height, "stateRoot": root.to_string(), "mode": "single-node",
        }), id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_handler() -> RpcHandler {
        RpcHandler::new(Arc::new(RwLock::new(Executor::with_fresh_state())), None, None)
    }

    #[tokio::test]
    async fn test_block_number() {
        let handler = test_handler();
        let req = JsonRpcRequest {
            jsonrpc: "2.0".into(), method: "aegis_blockNumber".into(),
            params: serde_json::json!([]), id: serde_json::json!(1),
        };
        let res = handler.handle(req).await;
        assert!(res.result.is_some());
    }

    #[tokio::test]
    async fn test_chain_id() {
        let handler = test_handler();
        let req = JsonRpcRequest {
            jsonrpc: "2.0".into(), method: "aegis_chainId".into(),
            params: serde_json::json!([]), id: serde_json::json!(1),
        };
        let res = handler.handle(req).await;
        assert!(res.result.is_some());
    }
}
