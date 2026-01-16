//! WebSocket Server for Real-time Event Notifications
//!
//! Provides real-time event streaming to connected clients.
//!
//! Features:
//! - Connection management with heartbeat
//! - Event broadcast to all connected clients
//! - JSON serialization of BridgeEvents

use crate::error::Result;
use crate::events::BridgeEvent;
use futures_util::{SinkExt, StreamExt};
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::{broadcast, RwLock};
use tokio_tungstenite::{accept_async, tungstenite::Message};
use tracing::{debug, error, info, warn};

/// Unique client ID counter
static CLIENT_ID_COUNTER: AtomicU64 = AtomicU64::new(1);

/// WebSocket client connection info
#[derive(Debug)]
struct ClientInfo {
    id: u64,
    addr: SocketAddr,
    connected_at: chrono::DateTime<chrono::Utc>,
}

/// WebSocket server for event broadcasting
pub struct WebSocketServer {
    /// Broadcast channel for events
    tx: broadcast::Sender<String>,
    /// Connected clients tracking
    clients: Arc<RwLock<HashMap<u64, ClientInfo>>>,
    /// Server address
    addr: SocketAddr,
}

impl WebSocketServer {
    /// Create a new WebSocket server
    pub fn new(addr: SocketAddr) -> Self {
        let (tx, _) = broadcast::channel(1000);
        Self {
            tx,
            clients: Arc::new(RwLock::new(HashMap::new())),
            addr,
        }
    }

    /// Start the WebSocket server
    pub async fn start(&self) -> Result<()> {
        let listener = TcpListener::bind(&self.addr).await?;
        info!("🌐 WebSocket server listening on ws://{}", self.addr);

        let tx = self.tx.clone();
        let clients = self.clients.clone();

        tokio::spawn(async move {
            while let Ok((stream, addr)) = listener.accept().await {
                let tx = tx.clone();
                let clients = clients.clone();

                tokio::spawn(async move {
                    if let Err(e) = handle_connection(stream, addr, tx, clients).await {
                        error!("WebSocket connection error: {}", e);
                    }
                });
            }
        });

        Ok(())
    }

    /// Broadcast event to all connected clients
    pub async fn broadcast(&self, event: &BridgeEvent) -> Result<()> {
        let json = serde_json::to_string(event)?;
        let client_count = self.clients.read().await.len();

        if client_count > 0 {
            match self.tx.send(json) {
                Ok(n) => {
                    debug!("📡 Broadcast event to {} clients", n);
                }
                Err(e) => {
                    warn!("Broadcast failed (no receivers): {}", e);
                }
            }
        }

        Ok(())
    }

    /// Get connected client count
    pub async fn client_count(&self) -> usize {
        self.clients.read().await.len()
    }

    /// Get broadcast sender for spawning notification tasks
    pub fn get_sender(&self) -> broadcast::Sender<String> {
        self.tx.clone()
    }
}

/// Handle a single WebSocket connection
async fn handle_connection(
    stream: TcpStream,
    addr: SocketAddr,
    tx: broadcast::Sender<String>,
    clients: Arc<RwLock<HashMap<u64, ClientInfo>>>,
) -> Result<()> {
    let ws_stream = accept_async(stream).await?;
    let (mut write, mut read) = ws_stream.split();

    let client_id = CLIENT_ID_COUNTER.fetch_add(1, Ordering::SeqCst);

    // Register client
    {
        let mut clients_guard = clients.write().await;
        clients_guard.insert(client_id, ClientInfo {
            id: client_id,
            addr,
            connected_at: chrono::Utc::now(),
        });
    }

    info!("🔌 Client {} connected from {}", client_id, addr);

    // Subscribe to broadcast channel
    let mut rx = tx.subscribe();

    // Send welcome message
    let welcome = serde_json::json!({
        "type": "welcome",
        "client_id": client_id,
        "message": "Connected to Quantum Shield Event Bridge"
    });
    if let Err(e) = write.send(Message::Text(welcome.to_string())).await {
        error!("Failed to send welcome message: {}", e);
    }

    // Handle bidirectional communication
    loop {
        tokio::select! {
            // Incoming message from client
            msg = read.next() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        debug!("📥 Received from client {}: {}", client_id, text);
                        // Handle ping/pong or subscription messages
                        if text == "ping" {
                            if let Err(e) = write.send(Message::Text("pong".to_string())).await {
                                error!("Failed to send pong: {}", e);
                                break;
                            }
                        }
                    }
                    Some(Ok(Message::Ping(data))) => {
                        if let Err(e) = write.send(Message::Pong(data)).await {
                            error!("Failed to send pong: {}", e);
                            break;
                        }
                    }
                    Some(Ok(Message::Close(_))) | None => {
                        info!("🔌 Client {} disconnected", client_id);
                        break;
                    }
                    Some(Err(e)) => {
                        error!("WebSocket error: {}", e);
                        break;
                    }
                    _ => {}
                }
            }
            // Broadcast message to send
            msg = rx.recv() => {
                match msg {
                    Ok(text) => {
                        if let Err(e) = write.send(Message::Text(text)).await {
                            error!("Failed to send broadcast: {}", e);
                            break;
                        }
                    }
                    Err(broadcast::error::RecvError::Lagged(n)) => {
                        warn!("Client {} lagged {} messages", client_id, n);
                    }
                    Err(broadcast::error::RecvError::Closed) => {
                        break;
                    }
                }
            }
        }
    }

    // Unregister client
    {
        let mut clients_guard = clients.write().await;
        clients_guard.remove(&client_id);
    }

    info!("🔌 Client {} cleanup complete", client_id);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_websocket_server_creation() {
        let addr: SocketAddr = "127.0.0.1:0".parse().unwrap();
        let server = WebSocketServer::new(addr);
        assert_eq!(server.client_count().await, 0);
    }

    #[tokio::test]
    async fn test_broadcast_no_clients() {
        let addr: SocketAddr = "127.0.0.1:0".parse().unwrap();
        let server = WebSocketServer::new(addr);

        let event = BridgeEvent::Locked(crate::events::LockedEvent {
            lock_id: [0u8; 32],
            owner: [0u8; 20],
            chain_id: 1,
            asset: [0u8; 20],
            amount: 1000,
            dest_addr: vec![],
            expiry: 0,
            nonce: 0,
            sr0: [0u8; 32],
            l1_block_number: 0,
            l1_tx_hash: [0u8; 32],
        });

        // Should not error even with no clients
        let result = server.broadcast(&event).await;
        assert!(result.is_ok());
    }
}
