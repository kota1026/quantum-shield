//! RabbitMQ client for Signature Queue (API-005)

use anyhow::Result;
use lapin::{
    options::{BasicPublishOptions, QueueDeclareOptions},
    types::FieldTable,
    BasicProperties, Channel, Connection, ConnectionProperties,
};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn, instrument};

use crate::config::RabbitMQConfig;

pub struct RabbitMQClient {
    url: String,
    queue_name: String,
    channel: Arc<RwLock<Option<Channel>>>,
}

impl RabbitMQClient {
    pub async fn new(config: &RabbitMQConfig) -> Result<Self> {
        let client = Self {
            url: config.url.clone(),
            queue_name: config.queue_name.clone(),
            channel: Arc::new(RwLock::new(None)),
        };

        // Try to connect eagerly, but don't fail startup if RabbitMQ is unavailable
        match client.ensure_channel().await {
            Ok(_) => info!("RabbitMQ client connected to queue: {}", config.queue_name),
            Err(e) => warn!("RabbitMQ not available at startup (will retry on publish): {}", e),
        }

        Ok(client)
    }

    /// Ensure we have an active channel, reconnecting if necessary
    async fn ensure_channel(&self) -> Result<()> {
        let mut channel_guard = self.channel.write().await;

        // Check if existing channel is still valid
        if let Some(ref ch) = *channel_guard {
            if ch.status().connected() {
                return Ok(());
            }
            warn!("RabbitMQ channel disconnected, reconnecting...");
        }

        // Create new connection and channel
        let conn = Connection::connect(&self.url, ConnectionProperties::default())
            .await
            .map_err(|e| anyhow::anyhow!("RabbitMQ connection failed: {}", e))?;

        let channel = conn.create_channel()
            .await
            .map_err(|e| anyhow::anyhow!("RabbitMQ channel creation failed: {}", e))?;

        // Declare the queue (idempotent)
        channel.queue_declare(
            &self.queue_name,
            QueueDeclareOptions::default(),
            FieldTable::default(),
        ).await
        .map_err(|e| anyhow::anyhow!("RabbitMQ queue declare failed: {}", e))?;

        *channel_guard = Some(channel);
        info!("RabbitMQ channel established for queue: {}", self.queue_name);
        Ok(())
    }

    /// Publish message to queue (API-005: Signature Queue Service)
    #[instrument(skip(self, message), fields(queue = %queue))]
    pub async fn publish(&self, queue: &str, message: &str) -> Result<()> {
        // Ensure channel is connected
        self.ensure_channel().await?;

        let channel_guard = self.channel.read().await;
        let channel = channel_guard.as_ref()
            .ok_or_else(|| anyhow::anyhow!("RabbitMQ channel not available"))?;

        // Declare the target queue if different from default
        if queue != self.queue_name {
            channel.queue_declare(
                queue,
                QueueDeclareOptions::default(),
                FieldTable::default(),
            ).await
            .map_err(|e| anyhow::anyhow!("RabbitMQ queue declare failed: {}", e))?;
        }

        channel.basic_publish(
            "",    // default exchange
            queue, // routing key = queue name
            BasicPublishOptions::default(),
            message.as_bytes(),
            BasicProperties::default()
                .with_content_type("application/json".into())
                .with_delivery_mode(2), // persistent
        ).await
        .map_err(|e| anyhow::anyhow!("RabbitMQ publish failed: {}", e))?
        .await
        .map_err(|e| anyhow::anyhow!("RabbitMQ publish confirm failed: {}", e))?;

        info!("Published message to queue '{}' ({} bytes)", queue, message.len());
        Ok(())
    }
}
