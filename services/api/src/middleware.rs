//! Middleware for authentication and rate limiting
//!
//! TASK-P5-012: SIWE→JWT authentication
//! Validates JWT tokens issued by AuthService and extracts user claims.

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
///
/// Validates the Authorization header and extracts JWT claims.
/// On success, adds AuthUser to request extensions.
/// On failure, returns 401 Unauthorized.
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
///
/// Similar to jwt_auth but doesn't fail if no token is provided.
/// Useful for endpoints that work with or without authentication.
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
///
/// Same as jwt_auth but logs admin access for audit trail.
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

/// Helper function to create an unauthorized response
fn unauthorized_response(message: &str) -> Response {
    let body = Json(ErrorResponse {
        code: ApiError::Unauthorized.code(),
        message: message.to_string(),
    });

    (StatusCode::UNAUTHORIZED, body).into_response()
}
