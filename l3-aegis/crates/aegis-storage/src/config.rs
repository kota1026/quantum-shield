//! Storage configuration for aegis-storage.

use std::path::PathBuf;

/// Configuration for the storage layer.
#[derive(Debug, Clone)]
pub struct StorageConfig {
    /// Path to the database directory
    pub db_path: PathBuf,
    /// Maximum number of open files for RocksDB
    pub max_open_files: i32,
    /// Write buffer size in bytes (default: 64MB)
    pub write_buffer_size: usize,
    /// Maximum write buffer number (default: 3)
    pub max_write_buffer_number: i32,
    /// Block cache size in bytes (default: 128MB)
    pub block_cache_size: usize,
    /// Enable compression (default: true)
    pub enable_compression: bool,
    /// Number of background compaction threads
    pub compaction_threads: i32,
    /// Create database if missing (default: true)
    pub create_if_missing: bool,
}

impl Default for StorageConfig {
    fn default() -> Self {
        Self {
            db_path: PathBuf::from("./data/l3-aegis"),
            max_open_files: 512,
            write_buffer_size: 64 * 1024 * 1024, // 64MB
            max_write_buffer_number: 3,
            block_cache_size: 128 * 1024 * 1024, // 128MB
            enable_compression: true,
            compaction_threads: 4,
            create_if_missing: true,
        }
    }
}

impl StorageConfig {
    /// Create a new configuration with the given database path.
    pub fn new(db_path: impl Into<PathBuf>) -> Self {
        Self {
            db_path: db_path.into(),
            ..Default::default()
        }
    }

    /// Configuration for development/testing with minimal resources.
    pub fn dev() -> Self {
        Self {
            db_path: PathBuf::from("./data/l3-aegis-dev"),
            max_open_files: 64,
            write_buffer_size: 4 * 1024 * 1024, // 4MB
            max_write_buffer_number: 2,
            block_cache_size: 8 * 1024 * 1024, // 8MB
            enable_compression: false,
            compaction_threads: 1,
            create_if_missing: true,
        }
    }

    /// Configuration for production with optimized settings.
    pub fn production() -> Self {
        Self {
            db_path: PathBuf::from("/var/lib/l3-aegis/data"),
            max_open_files: 1024,
            write_buffer_size: 128 * 1024 * 1024, // 128MB
            max_write_buffer_number: 4,
            block_cache_size: 512 * 1024 * 1024, // 512MB
            enable_compression: true,
            compaction_threads: 8,
            create_if_missing: true,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = StorageConfig::default();
        assert!(config.create_if_missing);
        assert_eq!(config.max_open_files, 512);
        assert_eq!(config.write_buffer_size, 64 * 1024 * 1024);
    }

    #[test]
    fn test_dev_config() {
        let config = StorageConfig::dev();
        assert!(config.db_path.to_string_lossy().contains("dev"));
        assert!(!config.enable_compression);
        assert_eq!(config.compaction_threads, 1);
    }

    #[test]
    fn test_production_config() {
        let config = StorageConfig::production();
        assert!(config.enable_compression);
        assert_eq!(config.compaction_threads, 8);
        assert_eq!(config.block_cache_size, 512 * 1024 * 1024);
    }

    #[test]
    fn test_custom_path() {
        let config = StorageConfig::new("/custom/path");
        assert_eq!(config.db_path, PathBuf::from("/custom/path"));
    }
}
