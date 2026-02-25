//! Notification Service for Event Distribution
//!
//! Unified service for distributing events via multiple channels:
//! - WebSocket for real-time client notifications
//! - RabbitMQ for service-to-service communication
//! - Redis pub/sub (optional, via EventQueue)
//!
//! SEQUENCES §1, §2: Real-time event propagation

use crate::error::Result;
use crate::events::BridgeEvent;
use crate::rabbitmq::{RabbitMQClient, RabbitMQConfig};
use crate::websocket::WebSocketServer;
use std::net::SocketAddr;
use std::sync::Arc;
use tracing::{debug, error, info};

/// Notification service configuration
#[derive(Debug, Clone)]
pub struct NotificationConfig {
    /// WebSocket server address
    pub websocket_addr: SocketAddr,
    /// RabbitMQ configuration
    pub rabbitmq: RabbitMQConfig,
    /// Enable WebSocket notifications
    pub websocket_enabled: bool,
    /// Enable RabbitMQ notifications
    pub rabbitmq_enabled: bool,
}

impl Default for NotificationConfig {
    fn default() -> Self {
        Self {
            websocket_addr: "0.0.0.0:8081".parse().unwrap(),
            rabbitmq: RabbitMQConfig::default(),
            websocket_enabled: true,
            rabbitmq_enabled: true,
        }
    }
}

/// Notification service for event distribution
pub struct NotificationService {
    config: NotificationConfig,
    websocket: Option<Arc<WebSocketServer>>,
    rabbitmq: Option<Arc<RabbitMQClient>>,
}

impl NotificationService {
    /// Create a new notification service
    pub async fn new(config: &NotificationConfig) -> Result<Self> {
        info!("🔔 Initializing Notification Service");

        let websocket = if config.websocket_enabled {
            let server = WebSocketServer::new(config.websocket_addr);
            server.start().await?;
            Some(Arc::new(server))
        } else {
            info!("  WebSocket: disabled");
            None
        };

        let rabbitmq = if config.rabbitmq_enabled {
            match RabbitMQClient::new(&config.rabbitmq).await {
                Ok(client) => Some(Arc::new(client)),
                Err(e) => {
                    error!("  RabbitMQ: failed to connect - {}", e);
                    None
                }
            }
        } else {
            info!("  RabbitMQ: disabled");
            None
        };

        info!("🔔 Notification Service initialized");
        info!("  WebSocket: {}", if websocket.is_some() { "enabled" } else { "disabled" });
        info!("  RabbitMQ: {}", if rabbitmq.is_some() { "enabled" } else { "disabled" });

        Ok(Self {
            config: config.clone(),
            websocket,
            rabbitmq,
        })
    }

    /// Notify all channels of an event
    pub async fn notify(&self, event: &BridgeEvent) -> Result<()> {
        debug!("🔔 Broadcasting event: {:?}", event.event_type());

        // WebSocket broadcast
        if let Some(ws) = &self.websocket {
            if let Err(e) = ws.broadcast(event).await {
                error!("WebSocket broadcast failed: {}", e);
            }
        }

        // RabbitMQ publish
        if let Some(mq) = &self.rabbitmq {
            if let Err(e) = mq.publish(event).await {
                error!("RabbitMQ publish failed: {}", e);
            }
        }

        Ok(())
    }

    /// Notify specific queue via RabbitMQ
    pub async fn notify_queue(&self, queue: &str, event: &BridgeEvent) -> Result<()> {
        if let Some(mq) = &self.rabbitmq {
            mq.publish_to(queue, event).await?;
        }
        Ok(())
    }

    /// Get WebSocket client count
    pub async fn websocket_client_count(&self) -> usize {
        match &self.websocket {
            Some(ws) => ws.client_count().await,
            None => 0,
        }
    }

    /// Check if WebSocket is enabled
    pub fn is_websocket_enabled(&self) -> bool {
        self.websocket.is_some()
    }

    /// Check if RabbitMQ is enabled
    pub fn is_rabbitmq_enabled(&self) -> bool {
        self.rabbitmq.is_some()
    }

    /// Shutdown the notification service
    pub async fn shutdown(&self) -> Result<()> {
        info!("🔔 Shutting down Notification Service");

        if let Some(mq) = &self.rabbitmq {
            mq.close().await?;
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_notification_config_default() {
        let config = NotificationConfig::default();
        assert!(config.websocket_enabled);
        assert!(config.rabbitmq_enabled);
    }

    #[tokio::test]
    async fn test_notification_service_disabled() {
        let config = NotificationConfig {
            websocket_enabled: false,
            rabbitmq_enabled: false,
            ..Default::default()
        };

        let service = NotificationService::new(&config).await.unwrap();
        assert!(!service.is_websocket_enabled());
        assert!(!service.is_rabbitmq_enabled());
    }

    #[tokio::test]
    async fn test_notify_no_clients() {
        let config = NotificationConfig {
            websocket_enabled: false,
            rabbitmq_enabled: false,
            ..Default::default()
        };

        let service = NotificationService::new(&config).await.unwrap();

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

        // Should not error
        let result = service.notify(&event).await;
        assert!(result.is_ok());
    }
}
