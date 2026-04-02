//! SIWE nonce repository for replay protection
//!
//! PostgreSQL-backed nonce storage, replacing Redis dependency for Beta deployment.

use sqlx::PgPool;
use tracing::info;

pub struct NonceRepository;

impl NonceRepository {
    /// Check if a nonce has already been used
    pub async fn is_nonce_used(pool: &PgPool, nonce: &str) -> Result<bool, sqlx::Error> {
        let row: (bool,) = sqlx::query_as(
            r#"SELECT EXISTS(SELECT 1 FROM siwe_nonces WHERE nonce = $1)"#,
        )
        .bind(nonce)
        .fetch_one(pool)
        .await?;

        Ok(row.0)
    }

    /// Mark a nonce as used with a 1-hour expiry
    pub async fn mark_nonce_used(pool: &PgPool, nonce: &str) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"INSERT INTO siwe_nonces (nonce, expires_at) VALUES ($1, NOW() + INTERVAL '1 hour')
               ON CONFLICT (nonce) DO NOTHING"#,
        )
        .bind(nonce)
        .execute(pool)
        .await?;

        info!(nonce = %nonce, "SIWE nonce marked as used");
        Ok(())
    }

    /// Clean up expired nonces (call periodically)
    pub async fn cleanup_expired(pool: &PgPool) -> Result<u64, sqlx::Error> {
        let result = sqlx::query("DELETE FROM siwe_nonces WHERE expires_at < NOW()")
            .execute(pool)
            .await?;

        let count = result.rows_affected();
        if count > 0 {
            info!(count = count, "Cleaned up expired SIWE nonces");
        }
        Ok(count)
    }
}
