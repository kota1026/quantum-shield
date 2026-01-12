//! Error types for API

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ApiError {
    #[error("Invalid signature: {0}")]
    InvalidSignature(String),

    #[error("Invalid nonce: {0}")]
    InvalidNonce(String),

    #[error("Request expired")]
    ExpiredRequest,

    #[error("Insufficient balance")]
    InsufficientBalance,

    #[error("Lock not found: {0}")]
    LockNotFound(String),

    #[error("Unauthorized")]
    Unauthorized,

    #[error("Prover not found: {0}")]
    ProverNotFound(String),

    #[error("Edition switch pending")]
    EditionSwitchPending,

    #[error("Time lock active")]
    TimeLockActive,

    #[error("Challenge active")]
    ChallengeActive,

    #[error("Already released")]
    AlreadyReleased,

    #[error("Prover timeout")]
    ProverTimeout,

    #[error("Insufficient signatures")]
    InsufficientSignatures,

    #[error("Internal error: {0}")]
    Internal(String),

    #[error("Service unavailable")]
    ServiceUnavailable,

    // Challenge errors (SEQUENCES §4)
    #[error("Invalid challenge target: {0}")]
    InvalidChallengeTarget(String),

    #[error("Insufficient bond: {0}")]
    InsufficientBond(String),

    #[error("Challenge not found: {0}")]
    ChallengeNotFound(String),

    #[error("Challenge already resolved")]
    ChallengeAlreadyResolved,

    #[error("Defense deadline expired")]
    DefenseDeadlineExpired,

    #[error("Defense deadline not passed")]
    DefenseDeadlineNotPassed,

    // Authentication errors (TASK-P5-012)
    #[error("Invalid SIWE message: {0}")]
    InvalidSiweMessage(String),

    #[error("SIWE message expired")]
    SiweMessageExpired,

    #[error("Invalid JWT token: {0}")]
    InvalidToken(String),

    #[error("Token expired")]
    TokenExpired,

    #[error("Invalid refresh token")]
    InvalidRefreshToken,

    #[error("Nonce already used")]
    NonceAlreadyUsed,

    // Token Hub errors (TASK-P5-021)
    #[error("Invalid request: {0}")]
    InvalidRequest(String),

    #[error("veQS Lock not found")]
    VeqsLockNotFound,

    #[error("veQS Lock already exists")]
    VeqsLockAlreadyExists,

    // Prover Portal errors (TASK-P5-022)
    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Forbidden: {0}")]
    Forbidden(String),

    // Observer errors (TASK-P5-019)
    #[error("Invalid address: {0}")]
    InvalidAddress(String),
}

#[derive(Serialize)]
pub struct ErrorResponse {
    pub code: u32,
    pub message: String,
}

impl ApiError {
    pub fn code(&self) -> u32 {
        match self {
            ApiError::InvalidSignature(_) => 1001,
            ApiError::InvalidNonce(_) => 1002,
            ApiError::ExpiredRequest => 1003,
            ApiError::InsufficientBalance => 1004,
            ApiError::LockNotFound(_) => 1005,
            ApiError::Unauthorized => 1006,
            ApiError::ProverNotFound(_) => 1007,
            ApiError::EditionSwitchPending => 1008,
            ApiError::InvalidRequest(_) => 1009,
            ApiError::TimeLockActive => 2001,
            ApiError::ChallengeActive => 2002,
            ApiError::AlreadyReleased => 2003,
            ApiError::ProverTimeout => 3001,
            ApiError::InsufficientSignatures => 3002,
            // Challenge errors (4xxx)
            ApiError::InvalidChallengeTarget(_) => 4001,
            ApiError::InsufficientBond(_) => 4002,
            ApiError::ChallengeNotFound(_) => 4003,
            ApiError::ChallengeAlreadyResolved => 4004,
            ApiError::DefenseDeadlineExpired => 4005,
            ApiError::DefenseDeadlineNotPassed => 4006,
            // Token Hub errors (4xxx)
            ApiError::VeqsLockNotFound => 4101,
            ApiError::VeqsLockAlreadyExists => 4102,
            ApiError::Internal(_) => 5001,
            ApiError::ServiceUnavailable => 5002,
            // Prover Portal errors (6xxx)
            ApiError::NotFound(_) => 6001,
            ApiError::Forbidden(_) => 6002,
            // Authentication errors (7xxx)
            ApiError::InvalidSiweMessage(_) => 7001,
            ApiError::SiweMessageExpired => 7002,
            ApiError::InvalidToken(_) => 7003,
            ApiError::TokenExpired => 7004,
            ApiError::InvalidRefreshToken => 7005,
            ApiError::NonceAlreadyUsed => 7006,
            // Observer errors (8xxx)
            ApiError::InvalidAddress(_) => 8001,
        }
    }

    pub fn status_code(&self) -> StatusCode {
        match self {
            ApiError::InvalidSignature(_) => StatusCode::BAD_REQUEST,
            ApiError::InvalidNonce(_) => StatusCode::CONFLICT,
            ApiError::ExpiredRequest => StatusCode::BAD_REQUEST,
            ApiError::InsufficientBalance => StatusCode::BAD_REQUEST,
            ApiError::LockNotFound(_) => StatusCode::NOT_FOUND,
            ApiError::Unauthorized => StatusCode::UNAUTHORIZED,
            ApiError::ProverNotFound(_) => StatusCode::NOT_FOUND,
            ApiError::EditionSwitchPending => StatusCode::CONFLICT,
            ApiError::InvalidRequest(_) => StatusCode::BAD_REQUEST,
            ApiError::TimeLockActive => StatusCode::CONFLICT,
            ApiError::ChallengeActive => StatusCode::CONFLICT,
            ApiError::AlreadyReleased => StatusCode::CONFLICT,
            ApiError::ProverTimeout => StatusCode::GATEWAY_TIMEOUT,
            ApiError::InsufficientSignatures => StatusCode::BAD_REQUEST,
            ApiError::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
            ApiError::ServiceUnavailable => StatusCode::SERVICE_UNAVAILABLE,
            // Challenge errors
            ApiError::InvalidChallengeTarget(_) => StatusCode::BAD_REQUEST,
            ApiError::InsufficientBond(_) => StatusCode::BAD_REQUEST,
            ApiError::ChallengeNotFound(_) => StatusCode::NOT_FOUND,
            ApiError::ChallengeAlreadyResolved => StatusCode::CONFLICT,
            ApiError::DefenseDeadlineExpired => StatusCode::GONE,
            ApiError::DefenseDeadlineNotPassed => StatusCode::PRECONDITION_FAILED,
            // Token Hub errors
            ApiError::VeqsLockNotFound => StatusCode::NOT_FOUND,
            ApiError::VeqsLockAlreadyExists => StatusCode::CONFLICT,
            // Prover Portal errors
            ApiError::NotFound(_) => StatusCode::NOT_FOUND,
            ApiError::Forbidden(_) => StatusCode::FORBIDDEN,
            // Authentication errors
            ApiError::InvalidSiweMessage(_) => StatusCode::BAD_REQUEST,
            ApiError::SiweMessageExpired => StatusCode::BAD_REQUEST,
            ApiError::InvalidToken(_) => StatusCode::UNAUTHORIZED,
            ApiError::TokenExpired => StatusCode::UNAUTHORIZED,
            ApiError::InvalidRefreshToken => StatusCode::UNAUTHORIZED,
            ApiError::NonceAlreadyUsed => StatusCode::CONFLICT,
            // Observer errors
            ApiError::InvalidAddress(_) => StatusCode::BAD_REQUEST,
        }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let status = self.status_code();
        let body = Json(ErrorResponse {
            code: self.code(),
            message: self.to_string(),
        });
        (status, body).into_response()
    }
}
