//! Quantum Shield API Server
//!
//! Provides endpoints for:
//! 1. Generating Dilithium keypairs
//! 2. Signing messages with Dilithium
//! 3. Generating ZK proofs for bridge release
//! 4. Health check and contract info

use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use pqcrypto_dilithium::dilithium3;
use pqcrypto_traits::sign::{PublicKey, SecretKey, SignedMessage};
use rand::Rng;
use serde::{Deserialize, Serialize};
use sha3::{Digest, Keccak256};
use std::{
    collections::HashMap,
    sync::{Arc, RwLock},
};
use tower_http::cors::{Any, CorsLayer};

// =============================================================================
// Types
// =============================================================================

/// Session storage for keypairs (in production, use secure storage)
#[derive(Default)]
struct AppState {
    /// Map session_id -> (public_key_bytes, secret_key_bytes)
    sessions: RwLock<HashMap<String, DilithiumSession>>,
}

#[derive(Clone)]
struct DilithiumSession {
    public_key: Vec<u8>,
    secret_key: Vec<u8>,
    pub_key_hash: [u8; 32],
    created_at: u64,
}

// =============================================================================
// Request/Response Types
// =============================================================================

#[derive(Deserialize)]
struct GenerateKeypairRequest {
    session_id: String,
}

#[derive(Serialize)]
struct GenerateKeypairResponse {
    session_id: String,
    pub_key_hash: String,      // bytes32 for contract
    pub_key_preview: String,   // First 64 bytes hex for display
    created_at: u64,
}

#[derive(Deserialize)]
struct SignMessageRequest {
    session_id: String,
    message: String,           // Hex-encoded message to sign
}

#[derive(Serialize)]
struct SignMessageResponse {
    session_id: String,
    message_hash: String,
    signature: String,         // Hex-encoded Dilithium signature
    signature_size: usize,
}

#[derive(Deserialize)]
struct GenerateProofRequest {
    session_id: String,
    lock_id: String,           // bytes32 lock ID from contract
    recipient: String,         // Ethereum address (release destination)
    amount: String,            // Amount in wei (as string)
    nonce: u64,
    sender: Option<String>,    // Original sender (who called lock())
}

#[derive(Serialize)]
struct GenerateProofResponse {
    session_id: String,
    lock_id: String,
    /// ZK proof bytes (hex-encoded)
    proof: String,
    /// Public inputs for the contract
    public_inputs: Vec<String>,
    /// Proof generation time in ms
    proof_time_ms: u64,
    /// Estimated gas for verification
    estimated_gas: u64,
}

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    version: String,
    dilithium_level: String,
    active_sessions: usize,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
    code: String,
}

impl IntoResponse for ErrorResponse {
    fn into_response(self) -> axum::response::Response {
        (StatusCode::BAD_REQUEST, Json(self)).into_response()
    }
}

// =============================================================================
// Handlers
// =============================================================================

/// Health check endpoint
async fn health(State(state): State<Arc<AppState>>) -> Json<HealthResponse> {
    let sessions = state.sessions.read().unwrap();
    Json(HealthResponse {
        status: "ok".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        dilithium_level: "Level 3 (NIST Security Level 3)".to_string(),
        active_sessions: sessions.len(),
    })
}

/// Generate a new Dilithium keypair
async fn generate_keypair(
    State(state): State<Arc<AppState>>,
    Json(req): Json<GenerateKeypairRequest>,
) -> Result<Json<GenerateKeypairResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Generate Dilithium3 keypair
    let (pk, sk) = dilithium3::keypair();
    let pk_bytes = pk.as_bytes().to_vec();
    let sk_bytes = sk.as_bytes().to_vec();

    // Compute keccak256 hash of public key (for contract)
    let mut hasher = Keccak256::new();
    hasher.update(&pk_bytes);
    let pub_key_hash: [u8; 32] = hasher.finalize().into();

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    // Store session
    let session = DilithiumSession {
        public_key: pk_bytes.clone(),
        secret_key: sk_bytes,
        pub_key_hash,
        created_at: now,
    };

    {
        let mut sessions = state.sessions.write().unwrap();
        sessions.insert(req.session_id.clone(), session);
    }

    Ok(Json(GenerateKeypairResponse {
        session_id: req.session_id,
        pub_key_hash: format!("0x{}", hex::encode(pub_key_hash)),
        pub_key_preview: format!("0x{}...", hex::encode(&pk_bytes[..32])),
        created_at: now,
    }))
}

/// Sign a message with Dilithium
async fn sign_message(
    State(state): State<Arc<AppState>>,
    Json(req): Json<SignMessageRequest>,
) -> Result<Json<SignMessageResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Get session
    let sessions = state.sessions.read().unwrap();
    let session = sessions.get(&req.session_id).ok_or_else(|| {
        (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "Session not found. Generate keypair first.".to_string(),
                code: "SESSION_NOT_FOUND".to_string(),
            }),
        )
    })?;

    // Parse message
    let message = hex::decode(req.message.trim_start_matches("0x")).map_err(|e| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: format!("Invalid message hex: {}", e),
                code: "INVALID_MESSAGE".to_string(),
            }),
        )
    })?;

    // Compute message hash
    let mut hasher = Keccak256::new();
    hasher.update(&message);
    let message_hash: [u8; 32] = hasher.finalize().into();

    // Reconstruct secret key
    let sk = dilithium3::SecretKey::from_bytes(&session.secret_key).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "Failed to reconstruct secret key".to_string(),
                code: "KEY_ERROR".to_string(),
            }),
        )
    })?;

    // Sign the message
    let signed_message = dilithium3::sign(&message, &sk);
    let signature_bytes = signed_message.as_bytes();

    // Extract just the signature (without the message)
    let sig_only = &signature_bytes[..signature_bytes.len() - message.len()];

    Ok(Json(SignMessageResponse {
        session_id: req.session_id,
        message_hash: format!("0x{}", hex::encode(message_hash)),
        signature: format!("0x{}", hex::encode(sig_only)),
        signature_size: sig_only.len(),
    }))
}

/// Generate ZK proof for bridge release
async fn generate_proof(
    State(state): State<Arc<AppState>>,
    Json(req): Json<GenerateProofRequest>,
) -> Result<Json<GenerateProofResponse>, (StatusCode, Json<ErrorResponse>)> {
    let start = std::time::Instant::now();

    // Get session
    let sessions = state.sessions.read().unwrap();
    let session = sessions.get(&req.session_id).ok_or_else(|| {
        (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "Session not found. Generate keypair first.".to_string(),
                code: "SESSION_NOT_FOUND".to_string(),
            }),
        )
    })?;

    // Parse inputs
    let lock_id = hex::decode(req.lock_id.trim_start_matches("0x")).map_err(|e| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: format!("Invalid lock_id hex: {}", e),
                code: "INVALID_LOCK_ID".to_string(),
            }),
        )
    })?;

    let recipient = hex::decode(req.recipient.trim_start_matches("0x")).map_err(|e| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: format!("Invalid recipient address: {}", e),
                code: "INVALID_RECIPIENT".to_string(),
            }),
        )
    })?;

    // Create message to sign: keccak256(lockId, recipient, amount, nonce)
    let mut hasher = Keccak256::new();
    hasher.update(&lock_id);
    hasher.update(&recipient);
    hasher.update(req.amount.as_bytes());
    hasher.update(&req.nonce.to_be_bytes());
    let message_hash: [u8; 32] = hasher.finalize().into();

    // Sign with Dilithium
    let sk = dilithium3::SecretKey::from_bytes(&session.secret_key).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "Failed to reconstruct secret key".to_string(),
                code: "KEY_ERROR".to_string(),
            }),
        )
    })?;

    let signed_message = dilithium3::sign(&message_hash, &sk);
    let signature = signed_message.as_bytes();

    // Generate proof commitment hash (unique for replay protection)
    let mut proof_hasher = Keccak256::new();
    proof_hasher.update(&lock_id);
    proof_hasher.update(&session.pub_key_hash);
    proof_hasher.update(&req.nonce.to_be_bytes());
    proof_hasher.update(&rand::thread_rng().gen::<[u8; 16]>());
    let proof_commitment: [u8; 32] = proof_hasher.finalize().into();

    // Generate proof (mock for now, SP1 Prover integration via separate server)
    // To use real SP1 proofs, run the sp1-prover-server separately
    let proof_bytes = generate_mock_proof(signature);

    // Build public inputs matching contract expectations:
    // PI[0]: dilithiumCommitmentHash (lower 128 bits)
    // PI[1]: dilithiumCommitmentHash (upper 128 bits)
    // PI[2]: numSignaturesVerified
    // PI[3]: lockId (lower 128 bits)
    // PI[4]: lockId (upper 128 bits)
    // PI[5]: recipientAddress
    // PI[6]: amount
    // PI[7]: nonce
    // PI[8]: senderAddress
    // PI[9]: circuitVersion
    // PI[10]: maxCoefficientBound
    // PI[11]: proofCommitmentHash

    let pub_key_hash = session.pub_key_hash;
    let commitment_low = u128::from_be_bytes(pub_key_hash[16..32].try_into().unwrap());
    let commitment_high = u128::from_be_bytes(pub_key_hash[0..16].try_into().unwrap());

    let lock_id_padded: [u8; 32] = if lock_id.len() == 32 {
        lock_id.clone().try_into().unwrap()
    } else {
        let mut arr = [0u8; 32];
        let start = 32 - lock_id.len();
        arr[start..].copy_from_slice(&lock_id);
        arr
    };
    let lock_id_low = u128::from_be_bytes(lock_id_padded[16..32].try_into().unwrap());
    let lock_id_high = u128::from_be_bytes(lock_id_padded[0..16].try_into().unwrap());

    // Parse amount as wei
    let amount_wei: u128 = req.amount.parse().unwrap_or(0);

    // Recipient as u160
    let mut recipient_padded = [0u8; 32];
    recipient_padded[12..32].copy_from_slice(&recipient[..20.min(recipient.len())]);
    let recipient_u256 = u128::from_be_bytes(recipient_padded[16..32].try_into().unwrap());

    // Sender (who called lock()) - use sender field if provided, otherwise fall back to recipient
    let sender_u256 = if let Some(ref sender_hex) = req.sender {
        let sender_hex_clean = sender_hex.strip_prefix("0x").unwrap_or(sender_hex);
        let sender = hex::decode(sender_hex_clean).unwrap_or_else(|_| vec![0u8; 20]);
        let mut sender_padded = [0u8; 32];
        sender_padded[12..32].copy_from_slice(&sender[..20.min(sender.len())]);
        u128::from_be_bytes(sender_padded[16..32].try_into().unwrap())
    } else {
        // Fallback: assume recipient is sender (for backward compatibility)
        recipient_u256
    };

    let proof_commitment_u256 = u128::from_be_bytes(proof_commitment[16..32].try_into().unwrap());

    let public_inputs = vec![
        format!("{}", commitment_low),
        format!("{}", commitment_high),
        "1".to_string(),  // numSignaturesVerified
        format!("{}", lock_id_low),
        format!("{}", lock_id_high),
        format!("{}", recipient_u256),
        format!("{}", amount_wei),
        format!("{}", req.nonce),
        format!("{}", sender_u256),  // sender (who called lock())
        "1".to_string(),  // circuitVersion
        "65536".to_string(),  // maxCoefficientBound (2^16)
        format!("{}", proof_commitment_u256),
    ];

    let elapsed = start.elapsed().as_millis() as u64;

    Ok(Json(GenerateProofResponse {
        session_id: req.session_id,
        lock_id: format!("0x{}", hex::encode(&lock_id)),
        proof: format!("0x{}", hex::encode(&proof_bytes)),
        public_inputs,
        proof_time_ms: elapsed,
        estimated_gas: 50000,  // Fixed gas for ZK verification
    }))
}

/// Generate mock proof for testing (when SP1 Prover is not available)
fn generate_mock_proof(signature: &[u8]) -> Vec<u8> {
    let mut mock_proof = vec![0u8; 256];
    rand::thread_rng().fill(&mut mock_proof[..]);
    // Include signature hash in proof for verifiability
    let sig_hash = {
        let mut h = Keccak256::new();
        h.update(&signature[..signature.len().saturating_sub(32)]);
        h.finalize()
    };
    mock_proof[..32].copy_from_slice(&sig_hash);
    mock_proof
}

/// Get session info
async fn get_session(
    State(state): State<Arc<AppState>>,
    axum::extract::Path(session_id): axum::extract::Path<String>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<ErrorResponse>)> {
    let sessions = state.sessions.read().unwrap();
    let session = sessions.get(&session_id).ok_or_else(|| {
        (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "Session not found".to_string(),
                code: "SESSION_NOT_FOUND".to_string(),
            }),
        )
    })?;

    Ok(Json(serde_json::json!({
        "session_id": session_id,
        "pub_key_hash": format!("0x{}", hex::encode(session.pub_key_hash)),
        "pub_key_size": session.public_key.len(),
        "created_at": session.created_at,
    })))
}

// =============================================================================
// Main
// =============================================================================

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "quantum_shield_api=info".into()),
        )
        .init();

    let state = Arc::new(AppState::default());

    // Build router
    let app = Router::new()
        .route("/health", get(health))
        .route("/api/v1/keypair", post(generate_keypair))
        .route("/api/v1/sign", post(sign_message))
        .route("/api/v1/proof", post(generate_proof))
        .route("/api/v1/session/:session_id", get(get_session))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001").await.unwrap();
    tracing::info!("🚀 Quantum Shield API running on http://0.0.0.0:3001");
    tracing::info!("📋 Endpoints:");
    tracing::info!("   GET  /health              - Health check");
    tracing::info!("   POST /api/v1/keypair      - Generate Dilithium keypair");
    tracing::info!("   POST /api/v1/sign         - Sign message");
    tracing::info!("   POST /api/v1/proof        - Generate ZK proof for release");
    tracing::info!("   GET  /api/v1/session/:id  - Get session info");

    axum::serve(listener, app).await.unwrap();
}
