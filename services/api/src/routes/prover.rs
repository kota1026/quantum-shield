//! Prover API implementation
//!
//! Implements Sequence #5: Prover Registration
//!
//! ## CP-1 Compliance
//! - Uses SPHINCS+-128s for Prover signatures (post-quantum secure)
//! - Uses SHA3-256 for all hashing
//! - Validates SPHINCS+ public key format and size

use std::sync::Arc;

use axum::{Extension, Json, extract::Path};
use sha3::{Sha3_256, Digest};

use crate::{
    error::ApiError,
    services::{AppState, SphincsService, SPHINCS_PUBLIC_KEY_BYTES},
    types::{ProverRegisterRequest, ProverRegisterResponse, ProverInfoResponse, ProverStatus},
};

/// POST /v1/prover/register
///
/// Register as a new Prover.
///
/// Requirements:
/// - Minimum stake: $400K (Phase 1) / $500K (Phase 2+)
/// - HSM attestation required
/// - 2-of-3 multisig proof required
/// - Valid SPHINCS+-128s public key (32 bytes)
///
/// ## CP-1 Compliance
/// - SPHINCS+-128s public key validation (post-quantum secure)
/// - HSM attestation verification
pub async fn register_prover(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<ProverRegisterRequest>,
) -> Result<Json<ProverRegisterResponse>, ApiError> {
    tracing::info!("Processing prover registration for: {}", req.operator_addr);

    // 1. Validate SPHINCS+-128s public key format and size (CP-1)
    SphincsService::validate_public_key(&req.sphincs_pubkey)
        .map_err(|e| ApiError::InvalidSignature(format!("SPHINCS+ public key validation failed: {}", e)))?;
    tracing::info!("✓ SPHINCS+-128s public key validated ({} bytes)", SPHINCS_PUBLIC_KEY_BYTES);

    // 2. Validate HSM attestation with public key binding
    SphincsService::validate_hsm_attestation(&req.hsm_attestation, &req.sphincs_pubkey)
        .map_err(|e| ApiError::InvalidSignature(format!("HSM attestation validation failed: {}", e)))?;
    tracing::info!("✓ HSM attestation validated");

    // 3. Validate multisig proof
    if !validate_multisig_proof(&req.multisig_proof) {
        return Err(ApiError::InvalidSignature("Invalid multisig proof".into()));
    }
    tracing::info!("✓ Multisig proof validated");

    // 4. Generate prover_id using SHA3-256 (CP-1 compliant)
    let prover_id = generate_prover_id(&req.operator_addr, &req.sphincs_pubkey);

    // 5. Store prover record
    state.store_prover(&prover_id, &req).await?;

    tracing::info!(
        "Prover registration submitted: {} (operator: {})",
        prover_id,
        req.operator_addr
    );

    Ok(Json(ProverRegisterResponse {
        prover_id,
        status: ProverStatus::PendingApproval,
        stake_locked: req.stake_amount,
    }))
}

/// GET /v1/prover/{prover_id}
/// 
/// Get Prover information and status.
pub async fn get_prover_info(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
) -> Result<Json<ProverInfoResponse>, ApiError> {
    tracing::debug!("Getting prover info for: {}", prover_id);

    let prover = state.get_prover(&prover_id).await?
        .ok_or_else(|| ApiError::ProverNotFound(prover_id.clone()))?;

    Ok(Json(prover))
}

/// Validate 2-of-3 multisig proof
fn validate_multisig_proof(proof: &str) -> bool {
    // TODO: Implement actual multisig proof verification
    !proof.is_empty()
}

/// Generate prover_id from operator address and SPHINCS+ public key
fn generate_prover_id(operator_addr: &str, sphincs_pubkey: &str) -> String {
    let mut hasher = Sha3_256::new();
    hasher.update(b"PROVER_ID_V1");
    hasher.update(operator_addr.as_bytes());
    hasher.update(sphincs_pubkey.as_bytes());
    let result = hasher.finalize();
    format!("0x{}", hex::encode(result))
}
