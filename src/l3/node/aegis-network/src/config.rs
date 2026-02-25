//! Network configuration

use crate::peer::PeerInfo;
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;

/// Network configuration
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct NetworkConfig {
    /// Local bind address
    pub bind_addr: SocketAddr,
    /// Enable TLS 1.3
    pub tls_enabled: bool,
    /// TLS certificate path
    pub tls_cert_path: Option<String>,
    /// TLS key path
    pub tls_key_path: Option<String>,
    /// Static peer list (for 4-node BFT)
    pub static_peers: Vec<PeerInfo>,
    /// Connection timeout in seconds
    pub connection_timeout_secs: u64,
    /// Heartbeat interval in seconds
    pub heartbeat_interval_secs: u64,
}

impl Default for NetworkConfig {
    fn default() -> Self {
        Self {
            bind_addr: "0.0.0.0:8000".parse().unwrap(),
            tls_enabled: true,
            tls_cert_path: None,
            tls_key_path: None,
            static_peers: vec![],
            connection_timeout_secs: 10,
            heartbeat_interval_secs: 5,
        }
    }
}

impl NetworkConfig {
    /// Create a development configuration
    pub fn dev(port: u16) -> Self {
        Self {
            bind_addr: format!("127.0.0.1:{}", port).parse().unwrap(),
            tls_enabled: false, // Disable TLS for dev
            ..Default::default()
        }
    }

    /// Validate configuration
    pub fn validate(&self) -> Result<(), String> {
        if self.tls_enabled {
            if self.tls_cert_path.is_none() {
                return Err("TLS enabled but no certificate path provided".to_string());
            }
            if self.tls_key_path.is_none() {
                return Err("TLS enabled but no key path provided".to_string());
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = NetworkConfig::default();
        assert!(config.tls_enabled);
    }

    #[test]
    fn test_dev_config() {
        let config = NetworkConfig::dev(8001);
        assert!(!config.tls_enabled);
        assert_eq!(config.bind_addr.port(), 8001);
    }

    #[test]
    fn test_validation_fails_without_cert() {
        let config = NetworkConfig::default();
        assert!(config.validate().is_err());
    }
}
