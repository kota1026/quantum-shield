//! Middleware for authentication and rate limiting (TASK-P5-012)

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
use crate::types::JwtClaims;

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

impl From<JwtClaims> for AuthUser {
    fn from(claims: JwtClaims) -> Self {
        Self {
            address: claims.sub,
            public_key_hash: claims.pkh,
            issued_at: claims.iat,
            expires_at: claims.exp,
        }
    }
}

/// JWT authentication middleware
///
/// Validates the Authorization header and extracts JWT claims.
/// On success, adds AuthUser to request extensions.
/// On failure, returns 401 Unauthorized.
///
/// # Usage
/// ```rust,ignore
/// use axum::{middleware, Router};
/// use crate::middleware::jwt_auth;
///
/// let protected_routes = Router::new()
///     .route("/protected", get(handler))
///     .layer(middleware::from_fn_with_state(state.clone(), jwt_auth));
/// ```
pub async fn jwt_auth(
    State(state): State<Arc<AppState>>,
    mut request: Request,
    next: Next,
) -> Response {
    // Extract Authorization header
    let auth_header = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok());

    let token = match auth_header {
        Some(h) if h.starts_with("Bearer ") => &h[7..],
        _ => {
            return unauthorized_response("Missing or invalid Authorization header");
        }
    };

    // Validate JWT token
    let claims = match state.auth_service.validate_token(token) {
        Ok(claims) => claims,
        Err(ApiError::TokenExpired) => {
            return unauthorized_response("Token expired");
        }
        Err(ApiError::InvalidToken(msg)) => {
            return unauthorized_response(&format!("Invalid token: {}", msg));
        }
        Err(_) => {
            return unauthorized_response("Token validation failed");
        }
    };

    // Verify it's an access token, not a refresh token
    if claims.typ != "access" {
        return unauthorized_response("Invalid token type");
    }

    // Add authenticated user to request extensions
    let auth_user = AuthUser::from(claims);
    request.extensions_mut().insert(auth_user);

    // Continue to the next handler
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
    // Extract Authorization header
    let auth_header = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok());

    if let Some(h) = auth_header {
        if h.starts_with("Bearer ") {
            let token = &h[7..];

            // Try to validate, but don't fail if invalid
            if let Ok(claims) = state.auth_service.validate_token(token) {
                if claims.typ == "access" {
                    let auth_user = AuthUser::from(claims);
                    request.extensions_mut().insert(auth_user);
                }
            }
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

/// Extractor for authenticated user
///
/// # Example
/// ```rust,ignore
/// use crate::middleware::AuthUser;
///
/// async fn protected_handler(
///     Extension(user): Extension<AuthUser>,
/// ) -> impl IntoResponse {
///     format!("Hello, {}", user.address)
/// }
/// ```

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_auth_user_from_claims() {
        let claims = JwtClaims {
            sub: "0x1234".to_string(),
            pkh: "0xabcd".to_string(),
            iat: 1000,
            exp: 2000,
            typ: "access".to_string(),
        };

        let user: AuthUser = claims.into();
        assert_eq!(user.address, "0x1234");
        assert_eq!(user.public_key_hash, "0xabcd");
        assert_eq!(user.issued_at, 1000);
        assert_eq!(user.expires_at, 2000);
    }
}
