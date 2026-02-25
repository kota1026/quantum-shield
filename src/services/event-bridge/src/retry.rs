//! Retry Policy with Exponential Backoff

use crate::config::RetryConfig;
use crate::error::{Error, Result};
use std::future::Future;
use std::pin::Pin;
use std::time::Duration;
use tracing::{debug, warn};

/// Retry policy executor
pub struct RetryPolicy {
    config: RetryConfig,
}

impl RetryPolicy {
    pub fn new(config: &RetryConfig) -> Self {
        Self {
            config: config.clone(),
        }
    }

    /// Execute a function with retries
    pub async fn execute<F, T, E>(&self, mut f: F) -> Result<T>
    where
        F: FnMut() -> Pin<Box<dyn Future<Output = std::result::Result<T, E>> + Send>>,
        E: std::fmt::Debug + Send,
    {
        let mut attempts = 0;
        let mut delay = self.config.initial_delay();

        loop {
            attempts += 1;

            match f().await {
                Ok(result) => {
                    if attempts > 1 {
                        debug!("Succeeded after {} attempts", attempts);
                    }
                    return Ok(result);
                }
                Err(e) if attempts >= self.config.max_attempts => {
                    warn!("Max retries exceeded after {} attempts: {:?}", attempts, e);
                    return Err(Error::MaxRetriesExceeded { attempts });
                }
                Err(e) => {
                    warn!(
                        "Attempt {} failed: {:?}, retrying in {:?}",
                        attempts, e, delay
                    );
                    tokio::time::sleep(delay).await;

                    // Exponential backoff
                    delay = Duration::from_secs_f64(
                        (delay.as_secs_f64() * self.config.backoff_multiplier)
                            .min(self.config.max_delay().as_secs_f64()),
                    );
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU32, Ordering};
    use std::sync::Arc;

    #[tokio::test]
    async fn test_retry_success_first_attempt() {
        let config = RetryConfig::default();
        let policy = RetryPolicy::new(&config);

        let result: Result<i32> = policy
            .execute(|| Box::pin(async { Ok::<_, &str>(42) }))
            .await;

        assert_eq!(result.unwrap(), 42);
    }

    #[tokio::test]
    async fn test_retry_success_after_failures() {
        let config = RetryConfig {
            max_attempts: 5,
            initial_delay_ms: 10,
            max_delay_ms: 100,
            backoff_multiplier: 2.0,
        };
        let policy = RetryPolicy::new(&config);

        let attempts = Arc::new(AtomicU32::new(0));
        let attempts_clone = attempts.clone();

        let result: Result<i32> = policy
            .execute(|| {
                let attempts = attempts_clone.clone();
                Box::pin(async move {
                    let n = attempts.fetch_add(1, Ordering::SeqCst);
                    if n < 2 {
                        Err("not yet")
                    } else {
                        Ok(42)
                    }
                })
            })
            .await;

        assert_eq!(result.unwrap(), 42);
        assert_eq!(attempts.load(Ordering::SeqCst), 3);
    }

    #[tokio::test]
    async fn test_retry_max_exceeded() {
        let config = RetryConfig {
            max_attempts: 3,
            initial_delay_ms: 10,
            max_delay_ms: 100,
            backoff_multiplier: 2.0,
        };
        let policy = RetryPolicy::new(&config);

        let result: Result<i32> = policy
            .execute(|| Box::pin(async { Err::<i32, _>("always fails") }))
            .await;

        assert!(matches!(result, Err(Error::MaxRetriesExceeded { attempts: 3 })));
    }
}
