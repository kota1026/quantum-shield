//! Node configuration.

use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};

/// Node configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeConfig {
    /// Node identifier (derived from public key)
    pub node_id: Option<String>,
    
    /// Data directory
    pub data_dir: PathBuf,
    
    /// RPC server configuration
    pub rpc: RpcConfig,
    
    /// P2P network configuration
    pub p2p: P2pConfig,
    
    /// Consensus configuration
    pub consensus: ConsensusConfig,
    
    /// Storage configuration
    pub storage: StorageConfig,
    
    /// Is this a development node?
    pub dev_mode: bool,
}

/// RPC server configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RpcConfig {
    /// Enable RPC server
    pub enabled: bool,
    /// Listen address
    pub host: String,
    /// Listen port
    pub port: u16,
    /// Maximum concurrent connections
    pub max_connections: u32,
}

/// P2P network configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct P2pConfig {
    /// Listen address
    pub listen_addr: String,
    /// Listen port
    pub port: u16,
    /// Static peer list (for 4-node BFT)
    pub static_peers: Vec<String>,
    /// Maximum peer connections
    pub max_peers: u32,
}

/// Consensus configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsensusConfig {
    /// Block time in seconds
    pub block_time_secs: u64,
    /// View change timeout in seconds
    pub view_change_timeout_secs: u64,
    /// Validator key path
    pub validator_key_path: Option<PathBuf>,
}

/// Storage configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageConfig {
    /// Database path (relative to data_dir)
    pub db_path: PathBuf,
    /// Enable compression
    pub compression: bool,
    /// Cache size in MB
    pub cache_size_mb: u32,
}

impl Default for NodeConfig {
    fn default() -> Self {
        Self {
            node_id: None,
            data_dir: PathBuf::from("./data"),
            rpc: RpcConfig::default(),
            p2p: P2pConfig::default(),
            consensus: ConsensusConfig::default(),
            storage: StorageConfig::default(),
            dev_mode: false,
        }
    }
}

impl Default for RpcConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            host: "127.0.0.1".to_string(),
            port: 8545,
            max_connections: 100,
        }
    }
}

impl Default for P2pConfig {
    fn default() -> Self {
        Self {
            listen_addr: "0.0.0.0".to_string(),
            port: 30303,
            static_peers: vec![],
            max_peers: 4,
        }
    }
}

impl Default for ConsensusConfig {
    fn default() -> Self {
        Self {
            block_time_secs: 5,
            view_change_timeout_secs: 30,
            validator_key_path: None,
        }
    }
}

impl Default for StorageConfig {
    fn default() -> Self {
        Self {
            db_path: PathBuf::from("db"),
            compression: true,
            cache_size_mb: 128,
        }
    }
}

impl NodeConfig {
    /// Create development configuration.
    pub fn dev() -> Self {
        Self {
            node_id: Some("dev-node".to_string()),
            data_dir: PathBuf::from("./data/dev"),
            rpc: RpcConfig {
                enabled: true,
                host: "127.0.0.1".to_string(),
                port: 8545,
                max_connections: 10,
            },
            p2p: P2pConfig {
                listen_addr: "127.0.0.1".to_string(),
                port: 30303,
                static_peers: vec![],
                max_peers: 0, // No peers in dev mode
            },
            consensus: ConsensusConfig {
                block_time_secs: 1, // Fast blocks in dev
                view_change_timeout_secs: 10,
                validator_key_path: None,
            },
            storage: StorageConfig {
                db_path: PathBuf::from("db"),
                compression: false,
                cache_size_mb: 32,
            },
            dev_mode: true,
        }
    }

    /// Load configuration from file.
    pub fn from_file(path: &str) -> anyhow::Result<Self> {
        let content = std::fs::read_to_string(path)?;
        let config: Self = toml::from_str(&content)?;
        Ok(config)
    }

    /// Override data directory.
    pub fn with_data_dir(mut self, dir: &str) -> Self {
        self.data_dir = PathBuf::from(dir);
        self
    }

    /// Override RPC port.
    pub fn with_rpc_port(mut self, port: u16) -> Self {
        self.rpc.port = port;
        self
    }

    /// Override P2P port.
    pub fn with_p2p_port(mut self, port: u16) -> Self {
        self.p2p.port = port;
        self
    }

    /// Get full database path.
    pub fn db_path(&self) -> PathBuf {
        self.data_dir.join(&self.storage.db_path)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = NodeConfig::default();
        assert_eq!(config.rpc.port, 8545);
        assert_eq!(config.p2p.port, 30303);
        assert_eq!(config.consensus.block_time_secs, 5);
    }

    #[test]
    fn test_dev_config() {
        let config = NodeConfig::dev();
        assert!(config.dev_mode);
        assert_eq!(config.consensus.block_time_secs, 1);
        assert_eq!(config.p2p.max_peers, 0);
    }

    #[test]
    fn test_with_overrides() {
        let config = NodeConfig::default()
            .with_data_dir("/custom/data")
            .with_rpc_port(9000)
            .with_p2p_port(31000);
        
        assert_eq!(config.data_dir, PathBuf::from("/custom/data"));
        assert_eq!(config.rpc.port, 9000);
        assert_eq!(config.p2p.port, 31000);
    }
}
