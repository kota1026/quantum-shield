//! Quantum Shield - L1↔L3 Event Bridge Service
//!
//! This service handles bidirectional event synchronization between
//! L1 (Ethereum Sepolia) and L3 (Aegis Chain).
//!
//! ## Security Requirements
//! - 12 block confirmations (reorg protection)
//! - Event idempotency (Event ID deduplication)
//! - Rate limiting (DoS protection)
//! - mTLS for HSM communication
//!
//! ## CP-1 Compliance
//! - SHA3-256 for all hashing (no keccak256)
//! - Dilithium-III for user signatures
//! - SPHINCS+-128s for prover signatures
//!
//! ## Real-time Notifications (TASK-P5-006)
//! - WebSocket server for client notifications
//! - RabbitMQ for service-to-service communication

pub mod config;
pub mod error;
pub mod events;
pub mod indexer;
pub mod relayer;
pub mod queue;
pub mod idempotency;
pub mod metrics;
pub mod retry;
pub mod websocket;
pub mod rabbitmq;
pub mod notification;

pub use config::Config;
pub use error::{Error, Result};
pub use websocket::WebSocketServer;
pub use rabbitmq::{RabbitMQClient, RabbitMQConfig};
pub use notification::{NotificationService, NotificationConfig};
