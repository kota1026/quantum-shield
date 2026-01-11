//! STARK Prover Server
//!
//! HTTP server that generates STARK proofs for Dilithium signature verification.
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────────┐
//! │                         STARK Prover Server                                  │
//! ├─────────────────────────────────────────────────────────────────────────────┤
//! │                                                                              │
//! │  Endpoints:                                                                  │
//! │  ├─ POST /prove       - Generate STARK proof from witness                   │
//! │  ├─ GET  /health      - Health check                                        │
//! │  ├─ GET  /status/:id  - Check proof generation status                       │
//! │  └─ GET  /proof/:id   - Retrieve generated proof                            │
//! │                                                                              │
//! │  Proof Generation Pipeline:                                                  │
//! │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
//! │  │  Witness    │ -> │   Trace     │ -> │  Commit +   │ -> │   STARK     │  │
//! │  │  Receive    │    │  Generate   │    │    FRI      │    │   Proof     │  │
//! │  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
//! │                                                                              │
//! └─────────────────────────────────────────────────────────────────────────────┘
//! ```

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use dilithium_stark::{
    witness::generate_full_trace,
    DilithiumStarkProof, FriProof, ProofMetadata, PublicInputs, QueryResponse, Witness,
    // Winterfell STARK prover
    stark::{
        DilithiumNttProver, DilithiumNttPublicInputs, DilithiumNttAir,
        build_ntt_trace, generate_test_coefficients,
    },
};
use winterfell::{
    Prover,
    math::FieldElement,
    verify as winterfell_verify_fn,
    Proof,
};
use serde::{Deserialize, Serialize};
use sha3::{Digest, Keccak256};
use std::{
    collections::HashMap,
    sync::{Arc, RwLock},
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use tower_http::cors::{Any, CorsLayer};
use tracing::{error, info, warn};
use uuid::Uuid;

// =============================================================================
// State
// =============================================================================

#[derive(Clone)]
struct AppState {
    /// Pending proofs (being generated)
    pending: Arc<RwLock<HashMap<String, ProofJob>>>,

    /// Completed proofs
    completed: Arc<RwLock<HashMap<String, DilithiumStarkProof>>>,

    /// Prover configuration
    config: ProverConfig,
}

#[derive(Clone)]
struct ProverConfig {
    /// Security level in bits
    security_bits: u32,

    /// Number of FRI layers
    fri_layers: usize,

    /// Blowup factor
    blowup_factor: usize,
}

impl Default for ProverConfig {
    fn default() -> Self {
        Self {
            security_bits: 128,
            fri_layers: 12,
            blowup_factor: 8,
        }
    }
}

#[derive(Clone)]
struct ProofJob {
    /// Job ID
    id: String,

    /// Status
    status: ProofStatus,

    /// Start time
    started_at: Instant,

    /// Public inputs (available after witness processing)
    public_inputs: Option<PublicInputs>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
enum ProofStatus {
    Pending,
    GeneratingTrace,
    Committing,
    GeneratingFri,
    Complete,
    Failed,
}

// =============================================================================
// Request/Response Types
// =============================================================================

#[derive(Debug, Deserialize)]
struct ProveRequest {
    /// Dilithium public key (hex encoded)
    public_key: String,

    /// Message to verify (hex encoded)
    message: String,

    /// Dilithium signature (hex encoded)
    signature: String,

    /// Nonce for replay protection
    nonce: u64,

    /// Optional Ethereum address
    eth_address: Option<String>,

    /// Optional amount for bridge
    amount: Option<u128>,
}

#[derive(Debug, Serialize)]
struct ProveResponse {
    /// Job ID for tracking
    job_id: String,

    /// Initial status
    status: ProofStatus,

    /// Estimated time to completion (seconds)
    estimated_seconds: u64,
}

#[derive(Debug, Serialize)]
struct StatusResponse {
    /// Job ID
    job_id: String,

    /// Current status
    status: ProofStatus,

    /// Elapsed time in seconds
    elapsed_seconds: u64,

    /// Public inputs (if available)
    public_inputs: Option<PublicInputsResponse>,
}

#[derive(Debug, Serialize)]
struct PublicInputsResponse {
    public_key_hash: String,
    message_hash: String,
    signature_valid: bool,
    commitment_hash: String,
}

#[derive(Debug, Serialize)]
struct ProofResponse {
    /// Job ID
    job_id: String,

    /// The STARK proof (hex encoded)
    proof: String,

    /// Public inputs
    public_inputs: PublicInputsResponse,

    /// Proof metadata
    metadata: ProofMetadataResponse,
}

#[derive(Debug, Serialize)]
struct ProofMetadataResponse {
    timestamp: u64,
    security_bits: u32,
    proof_size: usize,
    generation_time_ms: u64,
}

#[derive(Debug, Serialize)]
struct ErrorResponse {
    error: String,
    details: Option<String>,
}

// =============================================================================
// Winterfell STARK Types
// =============================================================================

/// Request for Winterfell proof generation
#[derive(Debug, Deserialize)]
struct WinterfellProveRequest {
    /// Input polynomial coefficients (hex encoded array)
    coefficients: Vec<String>,
    /// Number of trace rows (must be power of 2, min 64)
    trace_rows: Option<usize>,
}

/// Response for Winterfell proof generation
#[derive(Debug, Serialize)]
struct WinterfellProofResponse {
    /// Generated STARK proof (hex encoded)
    proof: String,
    /// Proof size in bytes
    proof_size: usize,
    /// Public inputs for verification
    public_inputs: WinterfellPublicInputsResponse,
    /// Proof generation time in milliseconds
    generation_time_ms: u64,
    /// Security level in bits
    security_bits: u32,
}

/// Winterfell public inputs response
#[derive(Debug, Serialize)]
struct WinterfellPublicInputsResponse {
    ntt_input_a: String,
    ntt_input_b: String,
    final_w1: String,
    final_fma_result: String,
    z_init: String,
    z_final: String,
}

// =============================================================================
// Handlers
// =============================================================================

async fn health() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "healthy",
        "prover": "dilithium-stark",
        "version": env!("CARGO_PKG_VERSION"),
        "winterfell": "enabled",
    }))
}

async fn prove(
    State(state): State<AppState>,
    Json(req): Json<ProveRequest>,
) -> Result<Json<ProveResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Decode inputs
    let public_key = hex::decode(&req.public_key).map_err(|e| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "Invalid public key".to_string(),
                details: Some(e.to_string()),
            }),
        )
    })?;

    let message = hex::decode(&req.message).map_err(|e| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "Invalid message".to_string(),
                details: Some(e.to_string()),
            }),
        )
    })?;

    let signature = hex::decode(&req.signature).map_err(|e| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "Invalid signature".to_string(),
                details: Some(e.to_string()),
            }),
        )
    })?;

    // Create witness
    let witness = Witness::new(public_key, message, signature).map_err(|e| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "Invalid witness".to_string(),
                details: Some(e),
            }),
        )
    })?;

    // Generate job ID
    let job_id = Uuid::new_v4().to_string();

    // Create job
    let job = ProofJob {
        id: job_id.clone(),
        status: ProofStatus::Pending,
        started_at: Instant::now(),
        public_inputs: None,
    };

    // Store job
    {
        let mut pending = state.pending.write().unwrap();
        pending.insert(job_id.clone(), job);
    }

    // Spawn proof generation task
    let state_clone = state.clone();
    let job_id_clone = job_id.clone();
    tokio::spawn(async move {
        generate_proof_task(state_clone, job_id_clone, witness, req.nonce).await;
    });

    info!("Started proof generation job: {}", job_id);

    Ok(Json(ProveResponse {
        job_id,
        status: ProofStatus::Pending,
        estimated_seconds: 30, // Estimated time for STARK proof
    }))
}

async fn get_status(
    State(state): State<AppState>,
    Path(job_id): Path<String>,
) -> Result<Json<StatusResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Check pending jobs
    if let Some(job) = state.pending.read().unwrap().get(&job_id) {
        let public_inputs = job.public_inputs.as_ref().map(|pi| PublicInputsResponse {
            public_key_hash: hex::encode(pi.public_key_hash),
            message_hash: hex::encode(pi.message_hash),
            signature_valid: pi.signature_valid,
            commitment_hash: hex::encode(pi.commitment_hash()),
        });

        return Ok(Json(StatusResponse {
            job_id,
            status: job.status,
            elapsed_seconds: job.started_at.elapsed().as_secs(),
            public_inputs,
        }));
    }

    // Check completed proofs
    if let Some(proof) = state.completed.read().unwrap().get(&job_id) {
        let pi = &proof.public_inputs;
        return Ok(Json(StatusResponse {
            job_id,
            status: ProofStatus::Complete,
            elapsed_seconds: 0,
            public_inputs: Some(PublicInputsResponse {
                public_key_hash: hex::encode(pi.public_key_hash),
                message_hash: hex::encode(pi.message_hash),
                signature_valid: pi.signature_valid,
                commitment_hash: hex::encode(pi.commitment_hash()),
            }),
        }));
    }

    Err((
        StatusCode::NOT_FOUND,
        Json(ErrorResponse {
            error: "Job not found".to_string(),
            details: None,
        }),
    ))
}

async fn get_proof(
    State(state): State<AppState>,
    Path(job_id): Path<String>,
) -> Result<Json<ProofResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Check if proof is complete
    if let Some(proof) = state.completed.read().unwrap().get(&job_id) {
        let pi = &proof.public_inputs;

        // Serialize proof
        let proof_bytes = bincode::serialize(&proof).unwrap_or_default();

        return Ok(Json(ProofResponse {
            job_id,
            proof: hex::encode(&proof_bytes),
            public_inputs: PublicInputsResponse {
                public_key_hash: hex::encode(pi.public_key_hash),
                message_hash: hex::encode(pi.message_hash),
                signature_valid: pi.signature_valid,
                commitment_hash: hex::encode(pi.commitment_hash()),
            },
            metadata: ProofMetadataResponse {
                timestamp: proof.metadata.timestamp,
                security_bits: proof.metadata.security_bits,
                proof_size: proof.metadata.proof_size,
                generation_time_ms: 0, // Would need to track this
            },
        }));
    }

    // Check if still pending
    if state.pending.read().unwrap().contains_key(&job_id) {
        return Err((
            StatusCode::ACCEPTED,
            Json(ErrorResponse {
                error: "Proof generation in progress".to_string(),
                details: Some("Use /status endpoint to check progress".to_string()),
            }),
        ));
    }

    Err((
        StatusCode::NOT_FOUND,
        Json(ErrorResponse {
            error: "Job not found".to_string(),
            details: None,
        }),
    ))
}

// =============================================================================
// Proof Generation
// =============================================================================

async fn generate_proof_task(state: AppState, job_id: String, witness: Witness, nonce: u64) {
    let start = Instant::now();

    // Update status: Generating Trace
    update_job_status(&state, &job_id, ProofStatus::GeneratingTrace);

    // Generate execution trace
    let trace = match generate_full_trace(&witness, nonce) {
        Ok(t) => t,
        Err(e) => {
            error!("Failed to generate trace: {}", e);
            update_job_status(&state, &job_id, ProofStatus::Failed);
            return;
        }
    };

    // Store public inputs
    {
        let mut pending = state.pending.write().unwrap();
        if let Some(job) = pending.get_mut(&job_id) {
            job.public_inputs = Some(trace.public_inputs.clone());
        }
    }

    // Update status: Committing
    update_job_status(&state, &job_id, ProofStatus::Committing);

    // Generate trace commitment (placeholder)
    let trace_commitment = generate_trace_commitment(&trace);

    // Update status: Generating FRI
    update_job_status(&state, &job_id, ProofStatus::GeneratingFri);

    // Generate FRI proof (placeholder)
    let fri_proof = generate_fri_proof(&trace, &state.config);

    // Generate query responses (placeholder)
    let query_responses = generate_query_responses(&trace, &state.config);

    // Create proof
    let proof = DilithiumStarkProof {
        public_inputs: trace.public_inputs,
        trace_commitment,
        fri_proof,
        query_responses,
        metadata: ProofMetadata {
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            prover_version: env!("CARGO_PKG_VERSION").to_string(),
            security_bits: state.config.security_bits,
            proof_size: 0, // Will be updated after serialization
        },
    };

    // Move from pending to completed
    {
        let mut pending = state.pending.write().unwrap();
        pending.remove(&job_id);
    }
    {
        let mut completed = state.completed.write().unwrap();
        completed.insert(job_id.clone(), proof);
    }

    info!(
        "Proof generation complete for job {} in {:?}",
        job_id,
        start.elapsed()
    );
}

fn update_job_status(state: &AppState, job_id: &str, status: ProofStatus) {
    let mut pending = state.pending.write().unwrap();
    if let Some(job) = pending.get_mut(job_id) {
        job.status = status;
    }
}

/// Generate commitment to execution trace (placeholder)
fn generate_trace_commitment(trace: &dilithium_stark::witness::FullTrace) -> [u8; 32] {
    let mut hasher = Keccak256::new();
    hasher.update(&trace.public_inputs.public_key_hash);
    hasher.update(&trace.public_inputs.message_hash);
    hasher.update(&[trace.public_inputs.signature_valid as u8]);
    hasher.finalize().into()
}

/// Generate FRI proof (placeholder)
fn generate_fri_proof(
    _trace: &dilithium_stark::witness::FullTrace,
    config: &ProverConfig,
) -> FriProof {
    FriProof {
        layer_commitments: vec![[0u8; 32]; config.fri_layers],
        final_polynomial: vec![0u8; 64],
        auth_paths: Vec::new(),
    }
}

/// Generate query responses (placeholder)
fn generate_query_responses(
    _trace: &dilithium_stark::witness::FullTrace,
    _config: &ProverConfig,
) -> Vec<QueryResponse> {
    Vec::new()
}

// =============================================================================
// Winterfell STARK Proof Generation
// =============================================================================

/// Generate STARK proof using Winterfell prover
async fn winterfell_prove(
    Json(req): Json<WinterfellProveRequest>,
) -> Result<Json<WinterfellProofResponse>, (StatusCode, Json<ErrorResponse>)> {
    use winterfell::math::fields::f128::BaseElement;
    use winterfell::crypto::{hashers::Blake3_256, DefaultRandomCoin, MerkleTree};

    let start = Instant::now();
    info!("Starting Winterfell STARK proof generation");

    // Parse coefficients or use test data
    let coeffs: Vec<u64> = if req.coefficients.is_empty() {
        // Generate test coefficients if none provided
        let num_coeffs = req.trace_rows.unwrap_or(64) * 2;
        generate_test_coefficients(num_coeffs)
    } else {
        // Parse hex-encoded coefficients
        req.coefficients
            .iter()
            .filter_map(|s| u64::from_str_radix(s.trim_start_matches("0x"), 16).ok())
            .collect()
    };

    if coeffs.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "Invalid coefficients".to_string(),
                details: Some("Provide valid hex-encoded coefficients or empty array for test".to_string()),
            }),
        ));
    }

    // Determine trace size (power of 2, minimum 64)
    let trace_rows = req.trace_rows.unwrap_or(64);
    let trace_rows = trace_rows.next_power_of_two().max(64);

    info!("Building execution trace with {} rows", trace_rows);

    // Build execution trace
    let trace = build_ntt_trace(trace_rows, &coeffs);

    // Create prover with default options (~128-bit security)
    let prover = DilithiumNttProver::with_default_options();

    // Extract public inputs
    let pub_inputs = prover.get_pub_inputs(&trace);

    info!("Generating STARK proof...");

    // Generate proof
    let proof = match prover.prove(trace) {
        Ok(p) => p,
        Err(e) => {
            error!("Proof generation failed: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "Proof generation failed".to_string(),
                    details: Some(format!("{:?}", e)),
                }),
            ));
        }
    };

    let generation_time_ms = start.elapsed().as_millis() as u64;

    // Serialize proof
    let proof_bytes = proof.to_bytes();
    let proof_size = proof_bytes.len();

    info!(
        "Proof generated successfully: {} bytes in {}ms",
        proof_size, generation_time_ms
    );

    // Convert public inputs to response format
    let pub_inputs_response = WinterfellPublicInputsResponse {
        ntt_input_a: format!("{:?}", pub_inputs.ntt_input_a),
        ntt_input_b: format!("{:?}", pub_inputs.ntt_input_b),
        final_w1: format!("{:?}", pub_inputs.final_w1),
        final_fma_result: format!("{:?}", pub_inputs.final_fma_result),
        z_init: format!("{:?}", pub_inputs.z_init),
        z_final: format!("{:?}", pub_inputs.z_final),
    };

    Ok(Json(WinterfellProofResponse {
        proof: hex::encode(&proof_bytes),
        proof_size,
        public_inputs: pub_inputs_response,
        generation_time_ms,
        security_bits: 128, // Default security level
    }))
}

/// Verify a Winterfell STARK proof
#[derive(Debug, Deserialize)]
struct WinterfellVerifyRequest {
    /// Hex-encoded proof bytes
    proof: String,
    /// Public inputs (must match proof)
    ntt_input_a: u64,
    ntt_input_b: u64,
    final_w1: u64,
    final_fma_result: u64,
}

async fn winterfell_verify(
    Json(req): Json<WinterfellVerifyRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<ErrorResponse>)> {
    use winterfell::math::fields::f128::BaseElement;
    use winterfell::crypto::{hashers::Blake3_256, DefaultRandomCoin, MerkleTree};
    use winterfell::AcceptableOptions;

    info!("Verifying Winterfell STARK proof");

    // Decode proof bytes
    let proof_bytes = match hex::decode(&req.proof) {
        Ok(b) => b,
        Err(e) => {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "Invalid proof encoding".to_string(),
                    details: Some(format!("{}", e)),
                }),
            ));
        }
    };

    // Deserialize proof
    let proof: Proof = match Proof::from_bytes(&proof_bytes) {
        Ok(p) => p,
        Err(e) => {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "Invalid proof format".to_string(),
                    details: Some(format!("{:?}", e)),
                }),
            ));
        }
    };

    // Construct public inputs
    let pub_inputs = DilithiumNttPublicInputs {
        t_coeff_0: BaseElement::from(req.ntt_input_a),
        ntt_input_a: BaseElement::from(req.ntt_input_a),
        ntt_input_b: BaseElement::from(req.ntt_input_b),
        challenge_hash: BaseElement::ZERO,
        final_w1: BaseElement::from(req.final_w1),
        expected_challenge: BaseElement::ZERO,
        final_fma_result: BaseElement::from(req.final_fma_result),
        max_norm_coeff: BaseElement::ZERO,
        z_init: BaseElement::ONE,
        z_final: BaseElement::ONE,
    };

    // Get prover options for verification
    let prover = DilithiumNttProver::with_default_options();
    let acceptable_options = AcceptableOptions::OptionSet(vec![prover.options().clone()]);

    // Verify proof
    let result = winterfell_verify_fn::<
        DilithiumNttAir,
        Blake3_256<BaseElement>,
        DefaultRandomCoin<Blake3_256<BaseElement>>,
        MerkleTree<Blake3_256<BaseElement>>,
    >(proof, pub_inputs, &acceptable_options);

    match result {
        Ok(_) => {
            info!("Proof verification successful");
            Ok(Json(serde_json::json!({
                "valid": true,
                "message": "Proof verified successfully"
            })))
        }
        Err(e) => {
            warn!("Proof verification failed: {:?}", e);
            Ok(Json(serde_json::json!({
                "valid": false,
                "message": format!("Verification failed: {:?}", e)
            })))
        }
    }
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
                .unwrap_or_else(|_| "info,stark_prover=debug".into()),
        )
        .init();

    let state = AppState {
        pending: Arc::new(RwLock::new(HashMap::new())),
        completed: Arc::new(RwLock::new(HashMap::new())),
        config: ProverConfig::default(),
    };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(health))
        .route("/prove", post(prove))
        .route("/status/:job_id", get(get_status))
        .route("/proof/:job_id", get(get_proof))
        // Winterfell STARK endpoints
        .route("/winterfell/prove", post(winterfell_prove))
        .route("/winterfell/verify", post(winterfell_verify))
        .layer(cors)
        .with_state(state);

    let addr = "0.0.0.0:3000";
    info!("Starting STARK prover server on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_prover_config_default() {
        let config = ProverConfig::default();
        assert_eq!(config.security_bits, 128);
        assert!(config.fri_layers > 0);
    }
}
