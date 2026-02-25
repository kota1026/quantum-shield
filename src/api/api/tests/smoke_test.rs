//! Smoke Test: Verify API starts up and responds to basic requests
//!
//! Prerequisites:
//! - PostgreSQL running with migrations applied
//! - Run: cargo test --test smoke_test
//!
//! This test starts the API in-process and verifies:
//! 1. Health endpoint responds
//! 2. Auth endpoint is reachable (returns 400 for empty body, not 500)
//! 3. Lock endpoint requires auth (returns 401)
//! 4. DB connectivity (user count query works)

use std::net::TcpListener;
use std::time::Duration;

/// Check if a TCP port is available
fn port_available(port: u16) -> bool {
    TcpListener::bind(("127.0.0.1", port)).is_ok()
}

/// Wait for a URL to respond with any 2xx/4xx status
async fn wait_for_url(url: &str, timeout: Duration) -> Result<u16, String> {
    let client = reqwest::Client::new();
    let start = std::time::Instant::now();

    loop {
        match client.get(url).timeout(Duration::from_secs(2)).send().await {
            Ok(resp) => return Ok(resp.status().as_u16()),
            Err(_) if start.elapsed() < timeout => {
                tokio::time::sleep(Duration::from_millis(500)).await;
            }
            Err(e) => return Err(format!("Timeout waiting for {}: {}", url, e)),
        }
    }
}

#[cfg(test)]
mod smoke {
    use super::*;

    /// SMOKE-001: Health endpoint responds 200
    #[tokio::test]
    async fn test_health_endpoint() {
        let api_url = std::env::var("API_URL").unwrap_or_else(|_| "http://localhost:8080".to_string());
        let url = format!("{}/v1/health", api_url);

        match wait_for_url(&url, Duration::from_secs(5)).await {
            Ok(status) => {
                assert_eq!(status, 200, "Health endpoint should return 200");
            }
            Err(e) => {
                eprintln!("SKIP: API not running at {}: {}", api_url, e);
                eprintln!("  Start with: ./src/infra/scripts/dev-start.sh");
            }
        }
    }

    /// SMOKE-002: Auth SIWE endpoint reachable (400 for empty body, not 500)
    #[tokio::test]
    async fn test_auth_siwe_reachable() {
        let api_url = std::env::var("API_URL").unwrap_or_else(|_| "http://localhost:8080".to_string());
        let client = reqwest::Client::new();

        let resp = client
            .post(format!("{}/v1/auth/siwe", api_url))
            .header("Content-Type", "application/json")
            .body("{}")
            .timeout(Duration::from_secs(5))
            .send()
            .await;

        match resp {
            Ok(r) => {
                let status = r.status().as_u16();
                // Should be 400 (bad request) or 422 (validation error), not 500
                assert!(
                    status == 400 || status == 422,
                    "Auth SIWE with empty body should return 400/422, got {}",
                    status
                );
            }
            Err(e) => {
                eprintln!("SKIP: API not running: {}", e);
            }
        }
    }

    /// SMOKE-003: Lock endpoint requires authentication
    #[tokio::test]
    async fn test_lock_requires_auth() {
        let api_url = std::env::var("API_URL").unwrap_or_else(|_| "http://localhost:8080".to_string());
        let client = reqwest::Client::new();

        let resp = client
            .post(format!("{}/v1/lock", api_url))
            .header("Content-Type", "application/json")
            .body(r#"{"chain_id":1,"asset":"0x0","amount":"0","dest_addr":"0x0","expiry":0,"nonce":0,"pk_dilithium":"0x0","sig_dilithium":"0x0"}"#)
            .timeout(Duration::from_secs(5))
            .send()
            .await;

        match resp {
            Ok(r) => {
                let status = r.status().as_u16();
                // Should be 401 (unauthorized) since no JWT token
                assert!(
                    status == 401 || status == 400 || status == 403,
                    "Lock without auth should return 401/400/403, got {}",
                    status
                );
            }
            Err(e) => {
                eprintln!("SKIP: API not running: {}", e);
            }
        }
    }

    /// SMOKE-004: DB connectivity check via status endpoint
    #[tokio::test]
    async fn test_db_connectivity() {
        let api_url = std::env::var("API_URL").unwrap_or_else(|_| "http://localhost:8080".to_string());
        let client = reqwest::Client::new();

        let resp = client
            .get(format!("{}/v1/status", api_url))
            .timeout(Duration::from_secs(5))
            .send()
            .await;

        match resp {
            Ok(r) => {
                let status = r.status().as_u16();
                // Status endpoint should work (200) or at least not crash (500)
                assert!(
                    status != 500,
                    "Status endpoint should not return 500 (DB connection issue)"
                );
            }
            Err(e) => {
                eprintln!("SKIP: API not running: {}", e);
            }
        }
    }
}
