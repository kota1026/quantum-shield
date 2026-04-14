//! Authentication routes (TASK-P5-012: SIWE→JWT)
//!
//! Endpoints:
//! - POST /v1/auth/siwe - Authenticate with SIWE message and ECDSA signature
//! - POST /v1/auth/refresh - Refresh an access token
//! - GET /v1/auth/me - Get current authenticated user info
//!
//! Note: ECDSA (wallet signatures) is used for authentication for wallet compatibility.
//! Dilithium signatures are used separately for Lock/Unlock operations (SEQUENCES.md §2.1).

use axum::{
    extract::Extension,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use std::sync::Arc;

use crate::{
    error::ApiError,
    middleware::AuthUser,
    services::AppState,
    types::{RefreshTokenRequest, RefreshTokenResponse, SiweRequest, UserInfoResponse},
};

/// POST /v1/auth/siwe
///
/// Authenticate a user using SIWE (Sign-In with Ethereum).
/// The user signs a SIWE message with their Ethereum wallet (ECDSA),
/// and receives JWT access and refresh tokens on successful verification.
///
/// Per SEQUENCES.md §1.1, authentication uses standard ECDSA for wallet compatibility.
/// Dilithium signatures are used separately for Lock/Unlock operations.
///
/// # Request Body
/// ```json
/// {
///     "message": "example.com wants you to sign in...",
///     "signature": "0x..." // ECDSA signature (65 bytes)
/// }
/// ```
///
/// # Response (200 OK)
/// ```json
/// {
///     "access_token": "eyJ...",
///     "refresh_token": "eyJ...",
///     "expires_at": 1234567890,
///     "address": "0x..."
/// }
/// ```
pub async fn siwe_authenticate(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<SiweRequest>,
) -> Result<impl IntoResponse, ApiError> {
    tracing::info!("SIWE authentication request received");

    // Parse SIWE message to extract nonce
    let siwe_message = crate::services::auth_service::AuthService::parse_siwe_message(&req.message)?;

    // Check if nonce has been used (replay protection — PostgreSQL-backed)
    let pool = state.pool();
    if crate::db::NonceRepository::is_nonce_used(pool, &siwe_message.nonce)
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?
    {
        return Err(ApiError::NonceAlreadyUsed);
    }

    // Authenticate
    let response = state.auth_service.authenticate_siwe(&req)?;

    // Mark nonce as used (expires after 1 hour)
    crate::db::NonceRepository::mark_nonce_used(pool, &siwe_message.nonce)
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?;

    tracing::info!(
        address = %response.address,
        "SIWE authentication successful"
    );

    Ok((StatusCode::OK, Json(response)))
}

/// POST /v1/auth/refresh
///
/// Refresh an access token using a valid refresh token.
///
/// # Request Body
/// ```json
/// {
///     "refresh_token": "eyJ..."
/// }
/// ```
///
/// # Response (200 OK)
/// ```json
/// {
///     "access_token": "eyJ...",
///     "expires_at": 1234567890
/// }
/// ```
pub async fn refresh_token(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<RefreshTokenRequest>,
) -> Result<impl IntoResponse, ApiError> {
    tracing::debug!("Token refresh request received");

    let (access_token, expires_at) = state.auth_service.refresh_access_token(&req.refresh_token)?;

    let response = RefreshTokenResponse {
        access_token,
        expires_at,
    };

    tracing::debug!("Token refresh successful");

    Ok((StatusCode::OK, Json(response)))
}

/// GET /v1/auth/me
///
/// Get information about the currently authenticated user.
/// Requires a valid JWT access token in the Authorization header.
///
/// # Headers
/// ```
/// Authorization: Bearer <access_token>
/// ```
///
/// # Response (200 OK)
/// ```json
/// {
///     "address": "0x...",
///     "public_key_hash": "0x...",
///     "issued_at": 1234567890,
///     "expires_at": 1234567890
/// }
/// ```
pub async fn get_current_user(
    Extension(user): Extension<AuthUser>,
) -> Result<impl IntoResponse, ApiError> {
    let response = UserInfoResponse {
        address: user.address,
        public_key_hash: user.public_key_hash,
        issued_at: user.issued_at,
        expires_at: user.expires_at,
    };

    Ok((StatusCode::OK, Json(response)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        body::Body,
        http::{Request, StatusCode},
        Router,
        routing::{get, post},
    };
    use tower::ServiceExt;

    // Note: Full integration tests would require mocking AppState
    // These are placeholder tests demonstrating the expected behavior

    #[test]
    fn test_auth_endpoint_paths() {
        // Verify endpoint paths are correctly defined
        let siwe_path = "/v1/auth/siwe";
        let refresh_path = "/v1/auth/refresh";
        let me_path = "/v1/auth/me";

        assert!(siwe_path.starts_with("/v1/auth/"));
        assert!(refresh_path.starts_with("/v1/auth/"));
        assert!(me_path.starts_with("/v1/auth/"));
    }
}
