//! Middleware for authentication and rate limiting
//!
//! TASK-P5-012: SIWE→JWT authentication
//! Currently a placeholder - to be fully implemented.

use axum::{
    extract::{Request, State},
    http::{header, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};
use std::sync::Arc;

use crate::error::{ApiError, ErrorResponse};
use crate::services::AppState;

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

/// JWT authentication middleware
///
/// Validates the Authorization header and extracts JWT claims.
/// On success, adds AuthUser to request extensions.
/// On failure, returns 401 Unauthorized.
///
/// NOTE: This is a placeholder implementation. Full JWT validation
/// will be implemented in TASK-P5-012.
pub async fn jwt_auth(
    State(_state): State<Arc<AppState>>,
    mut request: Request,
    next: Next,
) -> Response {
    // Extract Authorization header
    let auth_header = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok());

    let _token = match auth_header {
        Some(h) if h.starts_with("Bearer ") => &h[7..],
        _ => {
            return unauthorized_response("Missing or invalid Authorization header");
        }
    };

    // TODO: Implement full JWT validation in TASK-P5-012
    // For now, create a placeholder auth user for testing
    let auth_user = AuthUser {
        address: "0x0000000000000000000000000000000000000000".to_string(),
        public_key_hash: "0x0000000000000000000000000000000000000000".to_string(),
        issued_at: 0,
        expires_at: u64::MAX,
    };

    request.extensions_mut().insert(auth_user);
    next.run(request).await
}

/// Optional JWT authentication middleware
///
/// Similar to jwt_auth but doesn't fail if no token is provided.
/// Useful for endpoints that work with or without authentication.
pub async fn jwt_auth_optional(
    State(_state): State<Arc<AppState>>,
    mut request: Request,
    next: Next,
) -> Response {
    // Extract Authorization header
    let auth_header = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok());

    if let Some(h) = auth_header {
        if h.starts_with("Bearer ") {
            // TODO: Implement full JWT validation in TASK-P5-012
            // For now, create a placeholder auth user
            let auth_user = AuthUser {
                address: "0x0000000000000000000000000000000000000000".to_string(),
                public_key_hash: "0x0000000000000000000000000000000000000000".to_string(),
                issued_at: 0,
                expires_at: u64::MAX,
            };
            request.extensions_mut().insert(auth_user);
        }
    }

    next.run(request).await
}

/// Helper function to create an unauthorized response
fn unauthorized_response(message: &str) -> Response {
    let body = Json(ErrorResponse {
        code: ApiError::Unauthorized.code(),
        message: message.to_string(),
    });

    (StatusCode::UNAUTHORIZED, body).into_response()
}
