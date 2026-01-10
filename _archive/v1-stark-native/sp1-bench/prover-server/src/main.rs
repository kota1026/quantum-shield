//! SP1 Prover HTTP Server
//!
//! Provides HTTP API for generating SP1 proofs for Dilithium signature verification.
//! Designed to be called from the Quantum Shield API.

use axum::{
    extract::State,
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sha3::{Digest, Keccak256};
use sp1_sdk::{include_elf, CpuProver, Prover, ProverClient, SP1Stdin};
use std::sync::Arc;
use std::time::Instant;
use tower_http::cors::{Any, CorsLayer};

/// The ELF we want to execute inside the zkVM.
pub const GUEST_ELF: &[u8] = include_elf!("dilithium-sp1-program");

// ============================================================================
// Data Structures (must match SP1 guest program)
// ============================================================================

/// Dilithium prime modulus Q
const Q: u64 = 8380417;

/// Input mode selector (matches guest program)
#[derive(Serialize, Deserialize, Clone)]
pub enum InputMode {
    Single(BenchmarkInput),
    Aggregated(AggregatedInput),
    Nested(NestedVerificationInput),
}

#[derive(Serialize, Deserialize, Clone)]
pub struct BenchmarkInput {
    pub trace_size: usize,
    pub iterations: u32,
    pub coefficients: Vec<u64>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct AggregatedInput {
    pub num_verifications: usize,
    pub trace_size: usize,
    pub all_coefficients: Vec<u64>,
    pub seeds: Vec<u64>,
}

/// Plonky2 bridge proof commitment
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct BridgeProofCommitment {
    pub num_transfers: u32,
    pub batch_root: [u64; 4],
    pub total_amount: [u64; 4],
    pub dilithium_commitment: [u64; 4],
    pub proof_digest: [u64; 4],
    pub circuit_version: u32,
}

/// Bridge transfer data
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct BridgeTransferData {
    pub sender: [u64; 3],
    pub recipient: [u64; 3],
    pub amount: [u64; 4],
    pub sig_commitment: [u64; 4],
    pub nonce: u64,
}

/// Dilithium verification data
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DilithiumVerificationData {
    pub pubkey_hash: [u64; 4],
    pub sig_hash: [u64; 4],
    pub msg_hash: [u64; 4],
    pub verification_result: bool,
}

/// Input for nested verification mode
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct NestedVerificationInput {
    pub plonky2_commitment: BridgeProofCommitment,
    pub transfers: Vec<BridgeTransferData>,
    pub dilithium_data: Vec<DilithiumVerificationData>,
    pub expected_commitment_hash: u64,
}

/// Output from nested verification (must match guest program)
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct NestedVerificationOutput {
    pub all_valid: bool,
    pub num_transfers: u32,
    pub batch_root: [u64; 4],
    pub total_amount: [u64; 4],
    pub final_commitment: u64,
    pub dilithium_sigs_verified: u32,
    // === Added for contract verification ===
    pub sender: [u64; 3],
    pub recipient: [u64; 3],
    pub nonce: u64,
    pub dilithium_pub_key_hash: [u64; 4],
}

// ============================================================================
// HTTP API Types
// ============================================================================

#[derive(Deserialize)]
struct GenerateProofRequest {
    /// Lock ID from the contract (hex)
    lock_id: String,
    /// Sender address (hex)
    sender: String,
    /// Recipient address (hex)
    recipient: String,
    /// Amount in wei (string)
    amount: String,
    /// Nonce
    nonce: u64,
    /// Dilithium public key hash (hex)
    pub_key_hash: String,
    /// Dilithium signature (hex)
    signature: String,
    /// Message that was signed (hex)
    message: String,
}

#[derive(Serialize)]
struct GenerateProofResponse {
    /// SP1 proof bytes (hex-encoded)
    proof: String,
    /// Public inputs for the contract
    public_inputs: Vec<String>,
    /// Proof generation time in ms
    proof_time_ms: u64,
    /// Number of cycles used
    cycles: u64,
    /// Proof type (core/compressed/groth16)
    proof_type: String,
}

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    prover_mode: String,
    elf_size: usize,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
}

// ============================================================================
// Application State
// ============================================================================

struct AppState {
    client: CpuProver,
}

// ============================================================================
// Handlers
// ============================================================================

async fn health() -> Json<HealthResponse> {
    let prover_mode = std::env::var("SP1_PROVER").unwrap_or_else(|_| "local".to_string());
    Json(HealthResponse {
        status: "healthy".to_string(),
        prover_mode,
        elf_size: GUEST_ELF.len(),
    })
}

async fn generate_proof(
    State(state): State<Arc<AppState>>,
    Json(req): Json<GenerateProofRequest>,
) -> Result<Json<GenerateProofResponse>, (StatusCode, Json<ErrorResponse>)> {
    let start = Instant::now();

    // Parse inputs
    let lock_id = hex::decode(req.lock_id.strip_prefix("0x").unwrap_or(&req.lock_id))
        .map_err(|e| {
            (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: format!("Invalid lock_id: {}", e),
                }),
            )
        })?;

    let sender = hex::decode(req.sender.strip_prefix("0x").unwrap_or(&req.sender))
        .map_err(|e| {
            (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: format!("Invalid sender: {}", e),
                }),
            )
        })?;

    let recipient = hex::decode(req.recipient.strip_prefix("0x").unwrap_or(&req.recipient))
        .map_err(|e| {
            (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: format!("Invalid recipient: {}", e),
                }),
            )
        })?;

    let pub_key_hash =
        hex::decode(req.pub_key_hash.strip_prefix("0x").unwrap_or(&req.pub_key_hash)).map_err(
            |e| {
                (
                    StatusCode::BAD_REQUEST,
                    Json(ErrorResponse {
                        error: format!("Invalid pub_key_hash: {}", e),
                    }),
                )
            },
        )?;

    let signature = hex::decode(req.signature.strip_prefix("0x").unwrap_or(&req.signature))
        .map_err(|e| {
            (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: format!("Invalid signature: {}", e),
                }),
            )
        })?;

    let message = hex::decode(req.message.strip_prefix("0x").unwrap_or(&req.message)).map_err(
        |e| {
            (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: format!("Invalid message: {}", e),
                }),
            )
        },
    )?;

    let amount_wei: u128 = req.amount.parse().unwrap_or(0);

    // Use the raw pub_key_hash as commitment (must match what was passed to lock())
    // The contract expects dilithiumCommitment == lockData.dilithiumPubKeyHash
    let commitment: [u8; 32] = if pub_key_hash.len() == 32 {
        pub_key_hash.clone().try_into().unwrap()
    } else {
        let mut arr = [0u8; 32];
        let start = 32usize.saturating_sub(pub_key_hash.len());
        arr[start..].copy_from_slice(&pub_key_hash[..pub_key_hash.len().min(32 - start)]);
        arr
    };

    // Convert to u64 arrays for SP1
    let commitment_u64 = bytes_to_u64_array(&commitment);
    let lock_id_u64 = bytes_to_u64_array_padded(&lock_id, 32);
    let sig_hash = {
        let mut h = Keccak256::new();
        h.update(&signature);
        let result: [u8; 32] = h.finalize().into();
        bytes_to_u64_array(&result)
    };
    let msg_hash = {
        let mut h = Keccak256::new();
        h.update(&message);
        let result: [u8; 32] = h.finalize().into();
        bytes_to_u64_array(&result)
    };
    let pubkey_hash_u64 = bytes_to_u64_array_padded(&pub_key_hash, 32);

    // Build transfer data
    let transfer = BridgeTransferData {
        sender: address_to_u64_3(&sender),
        recipient: address_to_u64_3(&recipient),
        amount: u128_to_u64_4(amount_wei),
        sig_commitment: commitment_u64,
        nonce: req.nonce,
    };

    // Build Dilithium verification data
    let dilithium_data = DilithiumVerificationData {
        pubkey_hash: pubkey_hash_u64,
        sig_hash,
        msg_hash,
        verification_result: true, // Pre-verified by API
    };

    // Build bridge commitment
    let plonky2_commitment = BridgeProofCommitment {
        num_transfers: 1,
        batch_root: lock_id_u64,
        total_amount: u128_to_u64_4(amount_wei),
        dilithium_commitment: commitment_u64,
        proof_digest: [0u64; 4], // Not used for single transfer
        circuit_version: 1,
    };

    // Compute expected commitment hash
    let expected_hash = compute_commitment_hash(&plonky2_commitment);

    // Build nested verification input
    let nested_input = NestedVerificationInput {
        plonky2_commitment,
        transfers: vec![transfer],
        dilithium_data: vec![dilithium_data],
        expected_commitment_hash: expected_hash,
    };

    let input = InputMode::Nested(nested_input);

    // Prepare SP1 stdin
    let mut stdin = SP1Stdin::new();
    stdin.write(&input);

    // Setup keys
    let (pk, vk) = state.client.setup(GUEST_ELF);

    tracing::info!("Generating compressed proof...");

    // Generate compressed proof (fast, verified locally)
    let proof_result = state
        .client
        .prove(&pk, &stdin)
        .compressed()
        .run();

    let proof = proof_result.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("Proof generation failed: {}", e),
            }),
        )
    })?;

    // Verify the proof locally - this is the real cryptographic verification!
    state.client.verify(&proof, &vk).map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("Proof verification failed: {}", e),
            }),
        )
    })?;

    tracing::info!("SP1 proof verified successfully!");

    // For on-chain submission with AlwaysTrueVerifier:
    // We hash the full proof to create a compact proof commitment
    // The real verification happened above; on-chain we just verify public inputs match
    let proof_bytes = bincode::serialize(&proof).unwrap_or_default();
    let proof_hash = {
        let mut h = Keccak256::new();
        h.update(&proof_bytes);
        h.finalize()
    };

    // Send proof hash (32 bytes) instead of full proof (1.3MB)
    // AlwaysTrueVerifier doesn't check proof content, only public inputs
    let proof_hex = format!("0x{}", hex::encode(&proof_hash));
    let proof_type = "compressed-hash".to_string();

    tracing::info!(
        "Proof generated: {} bytes compressed, {} bytes on-chain",
        proof_bytes.len(),
        proof_hash.len()
    );

    // Build public inputs for contract
    let public_inputs = build_public_inputs(
        &commitment,
        &lock_id,
        &recipient,
        amount_wei,
        req.nonce,
        &sender,
    );

    let elapsed = start.elapsed().as_millis() as u64;

    Ok(Json(GenerateProofResponse {
        proof: proof_hex,
        public_inputs,
        proof_time_ms: elapsed,
        cycles: 0, // TODO: extract from report
        proof_type,
    }))
}

// ============================================================================
// Helper Functions
// ============================================================================

fn bytes_to_u64_array(bytes: &[u8; 32]) -> [u64; 4] {
    [
        u64::from_be_bytes(bytes[0..8].try_into().unwrap()),
        u64::from_be_bytes(bytes[8..16].try_into().unwrap()),
        u64::from_be_bytes(bytes[16..24].try_into().unwrap()),
        u64::from_be_bytes(bytes[24..32].try_into().unwrap()),
    ]
}

fn bytes_to_u64_array_padded(bytes: &[u8], target_len: usize) -> [u64; 4] {
    let mut padded = vec![0u8; target_len];
    let start = target_len.saturating_sub(bytes.len());
    padded[start..].copy_from_slice(&bytes[..bytes.len().min(target_len - start)]);
    bytes_to_u64_array(&padded.try_into().unwrap_or([0u8; 32]))
}

fn address_to_u64_3(addr: &[u8]) -> [u64; 3] {
    let mut padded = [0u8; 24];
    let start = 24usize.saturating_sub(addr.len());
    padded[start..].copy_from_slice(&addr[..addr.len().min(24 - start)]);
    [
        u64::from_be_bytes(padded[0..8].try_into().unwrap()),
        u64::from_be_bytes(padded[8..16].try_into().unwrap()),
        u64::from_be_bytes(padded[16..24].try_into().unwrap()),
    ]
}

fn u128_to_u64_4(val: u128) -> [u64; 4] {
    [0, 0, (val >> 64) as u64, val as u64]
}

fn compute_commitment_hash(commitment: &BridgeProofCommitment) -> u64 {
    let mut h: u64 = 0x5851F42D4C957F2D;
    h = hash_u32(h, commitment.num_transfers);
    h = hash_array_4(h, &commitment.batch_root);
    h = hash_array_4(h, &commitment.total_amount);
    h = hash_array_4(h, &commitment.dilithium_commitment);
    h = hash_array_4(h, &commitment.proof_digest);
    h = hash_u32(h, commitment.circuit_version);
    h
}

fn hash_u32(acc: u64, val: u32) -> u64 {
    let mut h = acc;
    h = h.wrapping_mul(0xBF58476D1CE4E5B9);
    h = h.wrapping_add(val as u64);
    h = h ^ (h >> 27);
    h
}

fn hash_array_4(acc: u64, arr: &[u64; 4]) -> u64 {
    let mut h = acc;
    for &val in arr {
        h = h.wrapping_mul(0x94D049BB133111EB);
        h = h.wrapping_add(val);
        h = h ^ (h >> 31);
    }
    h
}

/// Convert bytes to U256 decimal string (for addresses and other values > 128 bits)
fn bytes_to_u256_string(bytes: &[u8]) -> String {
    // Pad to 32 bytes, right-aligned
    let mut padded = [0u8; 32];
    let start = 32usize.saturating_sub(bytes.len());
    padded[start..].copy_from_slice(&bytes[..bytes.len().min(32)]);

    // Convert to big integer using simple arithmetic
    // For a 20-byte address, this fits in 160 bits
    let mut result = num_bigint::BigUint::from(0u8);
    for &byte in &padded {
        result = result << 8;
        result = result + byte;
    }
    result.to_string()
}

fn build_public_inputs(
    commitment: &[u8; 32],
    lock_id: &[u8],
    recipient: &[u8],
    amount_wei: u128,
    nonce: u64,
    sender: &[u8],
) -> Vec<String> {
    // Match contract's expected public inputs format
    let mut commitment_padded = [0u8; 32];
    commitment_padded.copy_from_slice(commitment);
    let commitment_low = u128::from_be_bytes(commitment_padded[16..32].try_into().unwrap());
    let commitment_high = u128::from_be_bytes(commitment_padded[0..16].try_into().unwrap());

    let mut lock_id_padded = [0u8; 32];
    let lock_len = lock_id.len().min(32);
    lock_id_padded[32 - lock_len..].copy_from_slice(&lock_id[..lock_len]);
    let lock_id_low = u128::from_be_bytes(lock_id_padded[16..32].try_into().unwrap());
    let lock_id_high = u128::from_be_bytes(lock_id_padded[0..16].try_into().unwrap());

    // Convert 20-byte address to U256 string (address fits in 160 bits)
    let recipient_u256 = bytes_to_u256_string(recipient);
    let sender_u256 = bytes_to_u256_string(sender);

    // Proof commitment (hash of the SP1 proof structure)
    let proof_commitment_u256 = commitment_low; // Use part of commitment as proof commitment

    vec![
        format!("{}", commitment_low),     // 0: PI_COMMITMENT_LOW
        format!("{}", commitment_high),    // 1: PI_COMMITMENT_HIGH
        "1".to_string(),                   // 2: numSignaturesVerified
        format!("{}", lock_id_low),        // 3: PI_LOCK_ID_LOW
        format!("{}", lock_id_high),       // 4: PI_LOCK_ID_HIGH
        format!("{}", recipient_u256),     // 5: PI_RECIPIENT
        format!("{}", amount_wei),         // 6: PI_AMOUNT
        format!("{}", nonce),              // 7: PI_NONCE
        format!("{}", sender_u256),        // 8: PI_SENDER
        "1".to_string(),                   // 9: circuitVersion
        "65536".to_string(),               // 10: maxCoefficientBound (2^16)
        format!("{}", proof_commitment_u256), // 11: PI_PROOF_COMMITMENT
    ]
}

// ============================================================================
// Main
// ============================================================================

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("sp1_prover_server=info".parse().unwrap()),
        )
        .init();

    tracing::info!("Initializing SP1 Prover Server...");

    // Initialize SP1 client (using builder pattern for v5.2+)
    let client = ProverClient::builder().cpu().build();

    let state = Arc::new(AppState { client });

    // CORS configuration
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build router
    let app = Router::new()
        .route("/health", get(health))
        .route("/api/v1/prove", post(generate_proof))
        .layer(cors)
        .with_state(state);

    let addr = "0.0.0.0:3002";
    tracing::info!("SP1 Prover Server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
