//! Prover API implementation
//!
//! Implements Sequence #5: Prover Registration

use std::sync::Arc;

use axum::{Extension, Json, extract::Path};
use sha3::{Sha3_256, Digest};

use crate::{
    error::ApiError,
    services::AppState,
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
pub async fn register_prover(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<ProverRegisterRequest>,
) -> Result<Json<ProverRegisterResponse>, ApiError> {
    tracing::info!("Processing prover registration for: {}", req.operator_addr);

    // 1. Validate HSM attestation
    if !validate_hsm_attestation(&req.hsm_attestation) {
        return Err(ApiError::InvalidSignature("Invalid HSM attestation".into()));
    }

    // 2. Validate multisig proof
    if !validate_multisig_proof(&req.multisig_proof) {
        return Err(ApiError::InvalidSignature("Invalid multisig proof".into()));
    }

    // 3. Validate SPHINCS+ public key
    if !validate_sphincs_pubkey(&req.sphincs_pubkey) {
        return Err(ApiError::InvalidSignature("Invalid SPHINCS+ public key".into()));
    }

    // 4. Generate prover_id
    let prover_id = generate_prover_id(&req.operator_addr, &req.sphincs_pubkey);

    // 5. Store prover record
    state.store_prover(&prover_id, &req).await?;

    tracing::info!("Prover registration submitted: {}", prover_id);

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

/// Validate HSM attestation
fn validate_hsm_attestation(attestation: &str) -> bool {
    // TODO: Implement actual HSM attestation verification
    !attestation.is_empty()
}

/// Validate 2-of-3 multisig proof
fn validate_multisig_proof(proof: &str) -> bool {
    // TODO: Implement actual multisig proof verification
    !proof.is_empty()
}

/// Validate SPHINCS+ public key format
fn validate_sphincs_pubkey(pubkey: &str) -> bool {
    // SPHINCS+-128s public key should be valid hex
    pubkey.starts_with("0x") && pubkey.len() > 2
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
