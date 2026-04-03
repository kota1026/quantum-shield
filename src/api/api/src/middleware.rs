//! Middleware for authentication, rate limiting, and request tracing
//!
//! TASK-P5-012: SIWE→JWT authentication
//! Week 4: Rate limiting + Request ID tracing

use axum::{
    extract::{ConnectInfo, Request, State},
    http::{header, HeaderValue, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::Mutex;

use crate::error::{ApiError, ErrorResponse};
use crate::services::AppState;

// ─── Authentication ────────────────────────────────────────────────────

/// Extension type for authenticated user claims
#[derive(Clone, Debug)]
pub struct AuthUser {
    /// Wallet address (from JWT subject)
    pub address: String,
    /// Public key hash
    pub public_key_hash: String,
    /// Token issued at
    pub issued_at: u64,
    /// Token expires at
    pub expires_at: u64,
}

/// Extract Bearer token from Authorization header
fn extract_bearer_token(request: &Request) -> Option<String> {
    request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "))
        .map(|t| t.to_string())
}

/// Validate JWT token and build AuthUser from claims
fn validate_and_build_auth_user(state: &AppState, token: &str) -> Result<AuthUser, String> {
    let claims = state.auth_service.validate_token(token)
        .map_err(|e| format!("JWT validation failed: {}", e))?;

    // Reject refresh tokens used as access tokens
    if claims.typ != "access" {
        return Err("Invalid token type: expected access token".to_string());
    }

    Ok(AuthUser {
        address: claims.sub,
        public_key_hash: claims.pkh,
        issued_at: claims.iat,
        expires_at: claims.exp,
    })
}

/// JWT authentication middleware
pub async fn jwt_auth(
    State(state): State<Arc<AppState>>,
    mut request: Request,
    next: Next,
) -> Response {
    let token = match extract_bearer_token(&request) {
        Some(t) => t,
        None => {
            return unauthorized_response("Missing or invalid Authorization header");
        }
    };

    let auth_user = match validate_and_build_auth_user(&state, &token) {
        Ok(user) => user,
        Err(msg) => {
            tracing::warn!("JWT auth failed: {}", msg);
            return unauthorized_response(&msg);
        }
    };

    tracing::debug!("Authenticated user: {}", auth_user.address);
    request.extensions_mut().insert(auth_user);
    next.run(request).await
}

/// Optional JWT authentication middleware
pub async fn jwt_auth_optional(
    State(state): State<Arc<AppState>>,
    mut request: Request,
    next: Next,
) -> Response {
    if let Some(token) = extract_bearer_token(&request) {
        match validate_and_build_auth_user(&state, &token) {
            Ok(auth_user) => {
                tracing::debug!("Optional auth: authenticated user {}", auth_user.address);
                request.extensions_mut().insert(auth_user);
            }
            Err(msg) => {
                tracing::debug!("Optional auth: token invalid ({}), proceeding unauthenticated", msg);
            }
        }
    }

    next.run(request).await
}

/// Admin JWT authentication middleware
pub async fn admin_jwt_auth(
    State(state): State<Arc<AppState>>,
    mut request: Request,
    next: Next,
) -> Response {
    let token = match extract_bearer_token(&request) {
        Some(t) => t,
        None => {
            tracing::warn!("Admin auth: missing Authorization header, uri={}", request.uri());
            return unauthorized_response("Missing or invalid Authorization header");
        }
    };

    let auth_user = match validate_and_build_auth_user(&state, &token) {
        Ok(user) => user,
        Err(msg) => {
            tracing::warn!("Admin auth failed: {}, uri={}", msg, request.uri());
            return unauthorized_response(&msg);
        }
    };

    tracing::info!("Admin access: user={}, uri={}", auth_user.address, request.uri());
    request.extensions_mut().insert(auth_user);
    next.run(request).await
}

fn unauthorized_response(message: &str) -> Response {
    let body = Json(ErrorResponse {
        code: ApiError::Unauthorized.code(),
        message: message.to_string(),
    });

    (StatusCode::UNAUTHORIZED, body).into_response()
}

// ─── Rate Limiting (Week 4-A) ──────────────────────────────────────────

/// In-memory token bucket rate limiter.
/// Tracks request counts per IP within a sliding window.
#[derive(Clone)]
pub struct RateLimiter {
    buckets: Arc<Mutex<HashMap<String, RateBucket>>>,
    max_requests: u32,
    window_secs: u64,
    enabled: bool,
}

struct RateBucket {
    count: u32,
    window_start: Instant,
}

impl RateLimiter {
    pub fn new(max_requests: u32, window_secs: u64, enabled: bool) -> Self {
        Self {
            buckets: Arc::new(Mutex::new(HashMap::new())),
            max_requests,
            window_secs,
            enabled,
        }
    }

    /// Check if a request from the given IP is allowed.
    /// Returns (allowed, remaining, retry_after_secs).
    async fn check(&self, ip: &str) -> (bool, u32, u64) {
        if !self.enabled {
            return (true, self.max_requests, 0);
        }

        let mut buckets = self.buckets.lock().await;
        let now = Instant::now();
        let window = std::time::Duration::from_secs(self.window_secs);

        let bucket = buckets.entry(ip.to_string()).or_insert(RateBucket {
            count: 0,
            window_start: now,
        });

        // Reset window if expired
        if now.duration_since(bucket.window_start) >= window {
            bucket.count = 0;
            bucket.window_start = now;
        }

        bucket.count += 1;

        if bucket.count > self.max_requests {
            let elapsed = now.duration_since(bucket.window_start).as_secs();
            let retry_after = self.window_secs.saturating_sub(elapsed);
            (false, 0, retry_after)
        } else {
            let remaining = self.max_requests - bucket.count;
            (true, remaining, 0)
        }
    }

    /// Periodically clean up expired buckets to prevent memory leaks.
    pub fn start_cleanup_task(self) {
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(std::time::Duration::from_secs(self.window_secs * 2));
            loop {
                interval.tick().await;
                let mut buckets = self.buckets.lock().await;
                let now = Instant::now;
                let window = std::time::Duration::from_secs(self.window_secs);
                buckets.retain(|_, v| now().duration_since(v.window_start) < window);
                let count = buckets.len();
                if count > 0 {
                    tracing::debug!("Rate limiter: {} active buckets after cleanup", count);
                }
            }
        });
    }
}

/// Extract client IP from ConnectInfo or X-Forwarded-For header
fn extract_client_ip(request: &Request) -> String {
    // Try X-Forwarded-For first (for reverse proxy setups)
    if let Some(forwarded) = request.headers().get("x-forwarded-for") {
        if let Ok(val) = forwarded.to_str() {
            // Take the first IP (original client)
            if let Some(ip) = val.split(',').next() {
                return ip.trim().to_string();
            }
        }
    }

    // Fall back to ConnectInfo
    if let Some(connect_info) = request.extensions().get::<ConnectInfo<SocketAddr>>() {
        return connect_info.0.ip().to_string();
    }

    "unknown".to_string()
}

/// Rate limiting middleware
pub async fn rate_limit(
    State(limiter): State<RateLimiter>,
    request: Request,
    next: Next,
) -> Response {
    let client_ip = extract_client_ip(&request);
    let (allowed, remaining, retry_after) = limiter.check(&client_ip).await;

    if !allowed {
        tracing::warn!("Rate limit exceeded: ip={}, retry_after={}s", client_ip, retry_after);
        let body = Json(ErrorResponse {
            code: ApiError::RateLimitExceeded.code(),
            message: "Rate limit exceeded. Please try again later.".to_string(),
        });
        let mut resp = (StatusCode::TOO_MANY_REQUESTS, body).into_response();
        resp.headers_mut().insert(
            "Retry-After",
            HeaderValue::from_str(&retry_after.to_string()).unwrap_or(HeaderValue::from_static("60")),
        );
        resp.headers_mut().insert(
            "X-RateLimit-Remaining",
            HeaderValue::from_static("0"),
        );
        return resp;
    }

    let mut resp = next.run(request).await;
    // Add rate limit headers to successful responses
    if let Ok(val) = HeaderValue::from_str(&remaining.to_string()) {
        resp.headers_mut().insert("X-RateLimit-Remaining", val);
    }
    if let Ok(val) = HeaderValue::from_str(&limiter.max_requests.to_string()) {
        resp.headers_mut().insert("X-RateLimit-Limit", val);
    }
    resp
}

// ─── Request ID (Week 4-B) ─────────────────────────────────────────────

/// Extension type for request ID, available in handlers
#[derive(Clone, Debug)]
pub struct RequestId(pub String);

/// Request ID middleware: generates a unique ID per request for tracing
pub async fn request_id(
    mut request: Request,
    next: Next,
) -> Response {
    let id = uuid::Uuid::new_v4().to_string();

    // Store in extensions so handlers can access it
    request.extensions_mut().insert(RequestId(id.clone()));

    let method = request.method().clone();
    let uri = request.uri().clone();

    tracing::info!(request_id = %id, method = %method, uri = %uri, "→ request");

    let start = Instant::now();
    let mut resp = next.run(request).await;
    let elapsed = start.elapsed();

    tracing::info!(
        request_id = %id,
        status = %resp.status().as_u16(),
        elapsed_ms = %elapsed.as_millis(),
        "← response"
    );

    // Add request ID to response headers
    if let Ok(val) = HeaderValue::from_str(&id) {
        resp.headers_mut().insert("X-Request-Id", val);
    }
    // Add API version header
    if let Ok(val) = HeaderValue::from_str(env!("CARGO_PKG_VERSION")) {
        resp.headers_mut().insert("X-API-Version", val);
    }

    resp
}

// ─── Security Headers (Phase C) ───────────────────────────────────────

/// Security headers middleware: adds OWASP-recommended headers to all responses.
/// These headers protect against clickjacking, MIME sniffing, XSS, and other attacks.
pub async fn security_headers(
    request: Request,
    next: Next,
) -> Response {
    let mut resp = next.run(request).await;
    let headers = resp.headers_mut();

    // Prevent clickjacking
    headers.insert("X-Frame-Options", HeaderValue::from_static("DENY"));

    // Prevent MIME type sniffing
    headers.insert("X-Content-Type-Options", HeaderValue::from_static("nosniff"));

    // Control referrer information
    headers.insert(
        "Referrer-Policy",
        HeaderValue::from_static("strict-origin-when-cross-origin"),
    );

    // Enforce HTTPS (1 year, include subdomains)
    headers.insert(
        "Strict-Transport-Security",
        HeaderValue::from_static("max-age=31536000; includeSubDomains"),
    );

    // Content Security Policy for API (JSON responses only, no inline scripts)
    headers.insert(
        "Content-Security-Policy",
        HeaderValue::from_static("default-src 'none'; frame-ancestors 'none'"),
    );

    // Restrict browser features
    headers.insert(
        "Permissions-Policy",
        HeaderValue::from_static("camera=(), microphone=(), geolocation=(), payment=()"),
    );

    // Prevent caching of sensitive API responses
    headers.insert(
        "Cache-Control",
        HeaderValue::from_static("no-store, no-cache, must-revalidate"),
    );

    resp
}

// ─── Tests ─────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_rate_limiter_allows_within_limit() {
        let limiter = RateLimiter::new(5, 60, true);
        for i in 0..5 {
            let (allowed, remaining, _) = limiter.check("192.168.1.1").await;
            assert!(allowed, "Request {} should be allowed", i);
            assert_eq!(remaining, 5 - (i as u32) - 1);
        }
    }

    #[tokio::test]
    async fn test_rate_limiter_blocks_over_limit() {
        let limiter = RateLimiter::new(3, 60, true);
        // Use up the limit
        for _ in 0..3 {
            let (allowed, _, _) = limiter.check("10.0.0.1").await;
            assert!(allowed);
        }
        // 4th request should be blocked
        let (allowed, remaining, retry_after) = limiter.check("10.0.0.1").await;
        assert!(!allowed);
        assert_eq!(remaining, 0);
        assert!(retry_after > 0);
    }

    #[tokio::test]
    async fn test_rate_limiter_per_ip_isolation() {
        let limiter = RateLimiter::new(2, 60, true);
        // Use up IP-A's limit
        limiter.check("ip-a").await;
        limiter.check("ip-a").await;
        let (allowed, _, _) = limiter.check("ip-a").await;
        assert!(!allowed, "ip-a should be blocked");

        // IP-B should still be allowed
        let (allowed, _, _) = limiter.check("ip-b").await;
        assert!(allowed, "ip-b should be allowed");
    }

    #[tokio::test]
    async fn test_rate_limiter_disabled() {
        let limiter = RateLimiter::new(1, 60, false);
        // Even over the limit, should be allowed when disabled
        for _ in 0..10 {
            let (allowed, _, _) = limiter.check("192.168.1.1").await;
            assert!(allowed);
        }
    }

    #[test]
    fn test_request_id_is_uuid() {
        let id = uuid::Uuid::new_v4().to_string();
        assert_eq!(id.len(), 36); // UUID v4 format: 8-4-4-4-12
        assert!(id.contains('-'));
    }
}
