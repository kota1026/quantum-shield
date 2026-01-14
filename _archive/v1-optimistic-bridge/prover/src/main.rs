//! Quantum Shield Prover Server
//!
//! Receives signature requests from clients, verifies Dilithium signatures,
//! and generates attestations for L1 submission.
//!
//! # Architecture (Phase 1: Optimistic Attestation)
//!
//! ```text
//! Client                    Prover Server                    L1 Contract
//!    │                            │                               │
//!    │ POST /attest               │                               │
//!    │ {SignatureRequest}         │                               │
//!    └───────────────────────────►│                               │
//!                                 │ 1. Verify Dilithium sig       │
//!                                 │ 2. Generate attestation       │
//!                                 │ 3. Store for dispute          │
//!                                 │                               │
//!    ◄───────────────────────────┘                               │
//!    │ {AttestationResponse}      │                               │
//!    │                            │                               │
//!    │                            │ submitAttestation()           │
//!    │                            └──────────────────────────────►│
//!                                                                 │
//! ```

use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use pqcrypto_dilithium::dilithium3;
use pqcrypto_traits::sign::{PublicKey, SecretKey, DetachedSignature};
use quantum_shield_client::{
    compute_attestation_hash, keccak256, AttestationResponse, SignatureRequest,
};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    sync::{Arc, RwLock},
    time::{SystemTime, UNIX_EPOCH},
};
use tower_http::cors::{Any, CorsLayer};
use tracing::{info, warn, error};
use uuid::Uuid;

// =============================================================================
// Types
// =============================================================================

/// Server state
struct AppState {
    /// Stored attestations for dispute resolution
    attestations: RwLock<HashMap<String, StoredAttestation>>,
    /// Prover's signing key (for attestation signatures)
    /// In production, this would be an HSM-backed key
    prover_secret: Vec<u8>,
    prover_public: Vec<u8>,
}

/// Stored attestation for dispute resolution
#[derive(Clone, Debug, Serialize, Deserialize)]
struct StoredAttestation {
    request: SignatureRequest,
    attestation_hash: [u8; 32],
    timestamp: u64,
    verified: bool,
}

// =============================================================================
// API Types
// =============================================================================

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    version: String,
    attestations_count: usize,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
    code: u16,
}

// =============================================================================
// Handlers
// =============================================================================

async fn health_check(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let count = state.attestations.read().unwrap().len();

    Json(HealthResponse {
        status: "healthy".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        attestations_count: count,
    })
}

async fn create_attestation(
    State(state): State<Arc<AppState>>,
    Json(request): Json<SignatureRequest>,
) -> Result<Json<AttestationResponse>, (StatusCode, Json<ErrorResponse>)> {
    info!(
        "Received attestation request: pk_hash={}, nonce={}",
        hex::encode(&request.public_key_hash[..8]),
        request.nonce
    );

    // 1. Validate public key
    let pk = dilithium3::PublicKey::from_bytes(&request.public_key).map_err(|_| {
        warn!("Invalid public key format");
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "Invalid public key".to_string(),
                code: 400,
            }),
        )
    })?;

    // 2. Validate signature
    let sig = dilithium3::DetachedSignature::from_bytes(&request.signature).map_err(|_| {
        warn!("Invalid signature format");
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "Invalid signature format".to_string(),
                code: 400,
            }),
        )
    })?;

    // 3. Verify signature
    let verified = dilithium3::verify_detached_signature(&sig, &request.message, &pk).is_ok();

    if !verified {
        warn!("Signature verification failed");
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "Signature verification failed".to_string(),
                code: 401,
            }),
        ));
    }

    info!("Signature verified successfully");

    // 4. Generate attestation
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let attestation_hash = compute_attestation_hash(&request);
    let request_id = Uuid::new_v4().to_string();

    // 5. Sign attestation with prover key
    let prover_sk = dilithium3::SecretKey::from_bytes(&state.prover_secret)
        .map_err(|_| {
            error!("Prover key corrupted");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "Internal error".to_string(),
                    code: 500,
                }),
            )
        })?;

    let prover_signature = dilithium3::detached_sign(&attestation_hash, &prover_sk);

    // 6. Store for dispute resolution
    {
        let mut attestations = state.attestations.write().unwrap();
        attestations.insert(
            request_id.clone(),
            StoredAttestation {
                request: request.clone(),
                attestation_hash,
                timestamp,
                verified: true,
            },
        );
    }

    info!(
        "Attestation created: id={}, hash={}",
        request_id,
        hex::encode(&attestation_hash[..8])
    );

    Ok(Json(AttestationResponse {
        valid: true,
        attestation_hash,
        prover_signature: prover_signature.as_bytes().to_vec(),
        timestamp,
        request_id,
    }))
}

/// Get attestation by ID (for dispute resolution)
async fn get_attestation(
    State(state): State<Arc<AppState>>,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> Result<Json<StoredAttestation>, (StatusCode, Json<ErrorResponse>)> {
    let attestations = state.attestations.read().unwrap();

    attestations.get(&id).cloned().ok_or_else(|| {
        (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "Attestation not found".to_string(),
                code: 404,
            }),
        )
    }).map(Json)
}

/// Get prover's public key (for on-chain verification)
async fn get_prover_public_key(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let pk_hash = keccak256(&state.prover_public);

    Json(serde_json::json!({
        "public_key": hex::encode(&state.prover_public),
        "public_key_hash": hex::encode(pk_hash),
    }))
}

// =============================================================================
// Main
// =============================================================================

#[tokio::main]
async fn main() {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "quantum_shield_prover=info,tower_http=debug".into()),
        )
        .init();

    info!("Starting Quantum Shield Prover Server v{}", env!("CARGO_PKG_VERSION"));

    // Generate prover keypair (in production, load from secure storage)
    let (prover_pk, prover_sk) = dilithium3::keypair();
    let prover_pk_hash = keccak256(prover_pk.as_bytes());

    info!(
        "Prover public key hash: {}",
        hex::encode(&prover_pk_hash[..8])
    );

    let state = Arc::new(AppState {
        attestations: RwLock::new(HashMap::new()),
        prover_secret: prover_sk.as_bytes().to_vec(),
        prover_public: prover_pk.as_bytes().to_vec(),
    });

    // Build router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/attest", post(create_attestation))
        .route("/attestation/:id", get(get_attestation))
        .route("/prover-key", get(get_prover_public_key))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .with_state(state);

    // Start server
    let addr = "0.0.0.0:3000";
    info!("Listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use quantum_shield_client::{create_signature_request, generate_keypair};

    #[test]
    fn test_signature_verification() {
        let keypair = generate_keypair();
        let message = b"Test message";

        let request = create_signature_request(&keypair, message, None, None, 1).unwrap();

        // Verify
        let pk = dilithium3::PublicKey::from_bytes(&request.public_key).unwrap();
        let sig = dilithium3::DetachedSignature::from_bytes(&request.signature).unwrap();

        assert!(dilithium3::verify_detached_signature(&sig, &request.message, &pk).is_ok());
    }

    #[test]
    fn test_attestation_hash_computation() {
        let keypair = generate_keypair();
        let message = b"Bridge transfer";

        let request = create_signature_request(&keypair, message, None, None, 1).unwrap();
        let hash = compute_attestation_hash(&request);

        assert_eq!(hash.len(), 32);
    }
}
