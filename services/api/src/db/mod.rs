//! Database module for Quantum Shield API
//!
//! Provides PostgreSQL connection pool and repository implementations.
//! Follows BE-001~003 rules for Phase 8-C compliance:
//! - BE-001: No stub responses - real DB operations required
//! - BE-002: No test-specific code modifications
//! - BE-003: Mandatory logging for all DB operations

use anyhow::Result;
use sqlx::postgres::{PgPool, PgPoolOptions};
use tracing::{info, instrument};

use crate::config::DatabaseConfig;

mod repositories;

pub use repositories::*;
pub use sqlx::PgPool as Pool;

/// Database connection pool wrapper
#[derive(Clone)]
pub struct Database {
    pool: PgPool,
}

impl Database {
    /// Create a new database connection pool
    #[instrument(skip(config), fields(db_url = %config.url.split('@').last().unwrap_or("")))]
    pub async fn new(config: &DatabaseConfig) -> Result<Self> {
        info!("Initializing database connection pool");

        let pool = PgPoolOptions::new()
            .max_connections(config.max_connections)
            .min_connections(config.min_connections)
            .acquire_timeout(std::time::Duration::from_secs(30))
            .connect(&config.url)
            .await?;

        info!("Database connection pool established");
        Ok(Self { pool })
    }

    /// Get the underlying pool reference
    pub fn pool(&self) -> &PgPool {
        &self.pool
    }

    /// Health check for database connectivity
    #[instrument(skip(self))]
    pub async fn health_check(&self) -> Result<()> {
        sqlx::query("SELECT 1")
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::DatabaseConfig;

    #[tokio::test]
    #[ignore] // Requires actual database
    async fn test_database_connection() {
        let config = DatabaseConfig::default();
        let db = Database::new(&config).await.unwrap();
        assert!(db.health_check().await.is_ok());
    }
}
