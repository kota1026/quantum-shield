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

    // Prover Portal errors (TASK-P5-022)
    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Forbidden: {0}")]
    Forbidden(String),
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
            ApiError::TimeLockActive => 2001,
            ApiError::ChallengeActive => 2002,
            ApiError::AlreadyReleased => 2003,
            ApiError::ProverTimeout => 3001,
            ApiError::InsufficientSignatures => 3002,
            ApiError::Internal(_) => 5001,
            ApiError::ServiceUnavailable => 5002,
            // Challenge errors (4xxx)
            ApiError::InvalidChallengeTarget(_) => 4001,
            ApiError::InsufficientBond(_) => 4002,
            ApiError::ChallengeNotFound(_) => 4003,
            ApiError::ChallengeAlreadyResolved => 4004,
            ApiError::DefenseDeadlineExpired => 4005,
            ApiError::DefenseDeadlineNotPassed => 4006,
            // Prover Portal errors (6xxx)
            ApiError::NotFound(_) => 6001,
            ApiError::Forbidden(_) => 6002,
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
            // Prover Portal errors
            ApiError::NotFound(_) => StatusCode::NOT_FOUND,
            ApiError::Forbidden(_) => StatusCode::FORBIDDEN,
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
