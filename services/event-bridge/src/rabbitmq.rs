//! RabbitMQ Client for Event Publishing
//!
//! Publishes events to RabbitMQ for consumption by other services (API, etc.)
//!
//! Features:
//! - Connection pooling
//! - Automatic reconnection
//! - JSON event serialization

use crate::error::{Error, Result};
use crate::events::BridgeEvent;
use lapin::{
    options::{BasicPublishOptions, QueueDeclareOptions},
    types::FieldTable,
    BasicProperties, Channel, Connection, ConnectionProperties,
};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{debug, error, info, warn};

/// RabbitMQ configuration
#[derive(Debug, Clone)]
pub struct RabbitMQConfig {
    /// AMQP URL
    pub url: String,
    /// Exchange name
    pub exchange: String,
    /// Queue name for events
    pub queue: String,
}

impl Default for RabbitMQConfig {
    fn default() -> Self {
        Self {
            url: "amqp://localhost:5672".to_string(),
            exchange: "".to_string(), // Default exchange
            queue: "event_bridge".to_string(),
        }
    }
}

/// RabbitMQ client for publishing events
pub struct RabbitMQClient {
    config: RabbitMQConfig,
    connection: Arc<RwLock<Option<Connection>>>,
    channel: Arc<RwLock<Option<Channel>>>,
}

impl RabbitMQClient {
    /// Create a new RabbitMQ client
    pub async fn new(config: &RabbitMQConfig) -> Result<Self> {
        let client = Self {
            config: config.clone(),
            connection: Arc::new(RwLock::new(None)),
            channel: Arc::new(RwLock::new(None)),
        };

        // Try to connect, but don't fail if RabbitMQ is unavailable
        if let Err(e) = client.connect().await {
            warn!("RabbitMQ connection failed (will retry): {}", e);
        }

        Ok(client)
    }

    /// Connect to RabbitMQ
    async fn connect(&self) -> Result<()> {
        info!("🐰 Connecting to RabbitMQ at {}", self.config.url);

        let conn = Connection::connect(
            &self.config.url,
            ConnectionProperties::default(),
        )
        .await
        .map_err(|e| Error::Queue(format!("RabbitMQ connection failed: {}", e)))?;

        info!("🐰 RabbitMQ connected");

        let channel = conn
            .create_channel()
            .await
            .map_err(|e| Error::Queue(format!("Channel creation failed: {}", e)))?;

        // Declare queue
        channel
            .queue_declare(
                &self.config.queue,
                QueueDeclareOptions::default(),
                FieldTable::default(),
            )
            .await
            .map_err(|e| Error::Queue(format!("Queue declaration failed: {}", e)))?;

        info!("🐰 Queue '{}' declared", self.config.queue);

        *self.connection.write().await = Some(conn);
        *self.channel.write().await = Some(channel);

        Ok(())
    }

    /// Ensure connection is alive, reconnect if needed
    async fn ensure_connected(&self) -> Result<()> {
        let needs_reconnect = {
            let conn_guard = self.connection.read().await;
            match &*conn_guard {
                Some(conn) => !conn.status().connected(),
                None => true,
            }
        };

        if needs_reconnect {
            self.connect().await?;
        }

        Ok(())
    }

    /// Publish an event to RabbitMQ
    pub async fn publish(&self, event: &BridgeEvent) -> Result<()> {
        // Ensure connected
        if let Err(e) = self.ensure_connected().await {
            warn!("RabbitMQ not available, skipping publish: {}", e);
            return Ok(()); // Don't fail, just skip
        }

        let channel_guard = self.channel.read().await;
        let channel = match &*channel_guard {
            Some(ch) => ch,
            None => {
                warn!("RabbitMQ channel not available");
                return Ok(());
            }
        };

        let payload = serde_json::to_vec(event)?;
        let routing_key = &self.config.queue;

        channel
            .basic_publish(
                &self.config.exchange,
                routing_key,
                BasicPublishOptions::default(),
                &payload,
                BasicProperties::default()
                    .with_content_type("application/json".into())
                    .with_delivery_mode(2), // Persistent
            )
            .await
            .map_err(|e| Error::Queue(format!("Publish failed: {}", e)))?
            .await
            .map_err(|e| Error::Queue(format!("Publish confirm failed: {}", e)))?;

        debug!("📤 Published event to queue '{}'", routing_key);

        Ok(())
    }

    /// Publish to a specific queue
    pub async fn publish_to(&self, queue: &str, event: &BridgeEvent) -> Result<()> {
        // Ensure connected
        if let Err(e) = self.ensure_connected().await {
            warn!("RabbitMQ not available, skipping publish: {}", e);
            return Ok(());
        }

        let channel_guard = self.channel.read().await;
        let channel = match &*channel_guard {
            Some(ch) => ch,
            None => {
                warn!("RabbitMQ channel not available");
                return Ok(());
            }
        };

        let payload = serde_json::to_vec(event)?;

        channel
            .basic_publish(
                &self.config.exchange,
                queue,
                BasicPublishOptions::default(),
                &payload,
                BasicProperties::default()
                    .with_content_type("application/json".into())
                    .with_delivery_mode(2),
            )
            .await
            .map_err(|e| Error::Queue(format!("Publish failed: {}", e)))?
            .await
            .map_err(|e| Error::Queue(format!("Publish confirm failed: {}", e)))?;

        debug!("📤 Published event to queue '{}'", queue);

        Ok(())
    }

    /// Close the connection
    pub async fn close(&self) -> Result<()> {
        if let Some(conn) = self.connection.write().await.take() {
            conn.close(0, "Shutdown")
                .await
                .map_err(|e| Error::Queue(format!("Close failed: {}", e)))?;
        }
        *self.channel.write().await = None;
        info!("🐰 RabbitMQ connection closed");
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_rabbitmq_config_default() {
        let config = RabbitMQConfig::default();
        assert_eq!(config.url, "amqp://localhost:5672");
        assert_eq!(config.queue, "event_bridge");
    }

    #[tokio::test]
    async fn test_rabbitmq_client_creation() {
        // This will fail to connect but should not panic
        let config = RabbitMQConfig {
            url: "amqp://localhost:5672".to_string(),
            exchange: "".to_string(),
            queue: "test_queue".to_string(),
        };

        let result = RabbitMQClient::new(&config).await;
        // Should succeed even if RabbitMQ is not running
        assert!(result.is_ok());
    }
}
