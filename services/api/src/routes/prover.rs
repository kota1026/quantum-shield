//! Prover API implementation
//!
//! Implements Sequence #5: Prover Registration
//!
//! ## SPHINCS+ Public Key Validation (CP-1 Compliant)
//!
//! This module validates SPHINCS+-SHAKE-128s public keys per NIST FIPS 205.
//! Invalid public keys are rejected at registration time.

use std::sync::Arc;

use axum::{Extension, Json, extract::Path};
use sha3::{Sha3_256, Digest};

use crate::{
    error::ApiError,
    services::AppState,
    services::sphincs_service::{
        validate_sphincs_public_key,
        validate_hsm_attestation,
        validate_multisig_proof,
    },
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
        tracing::warn!("HSM attestation validation failed for: {}", req.operator_addr);
        return Err(ApiError::InvalidSignature("Invalid HSM attestation".into()));
    }

    // 2. Validate multisig proof
    if !validate_multisig_proof(&req.multisig_proof) {
        tracing::warn!("Multisig proof validation failed for: {}", req.operator_addr);
        return Err(ApiError::InvalidSignature("Invalid multisig proof".into()));
    }

    // 3. Validate SPHINCS+ public key (NIST FIPS 205 compliant)
    let sphincs_validation = validate_sphincs_public_key(&req.sphincs_pubkey)?;
    if !sphincs_validation.valid {
        let error_msg = sphincs_validation.error_reason.unwrap_or_else(|| "Invalid SPHINCS+ public key".into());
        tracing::warn!("SPHINCS+ public key validation failed for {}: {}", req.operator_addr, error_msg);
        return Err(ApiError::InvalidSignature(error_msg));
    }

    // Log the public key hash for traceability
    if let Some(ref pk_hash) = sphincs_validation.public_key_hash {
        tracing::info!("SPHINCS+ public key validated, hash: {}", pk_hash);
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

/// Generate prover_id from operator address and SPHINCS+ public key
fn generate_prover_id(operator_addr: &str, sphincs_pubkey: &str) -> String {
    let mut hasher = Sha3_256::new();
    hasher.update(b"PROVER_ID_V1");
    hasher.update(operator_addr.as_bytes());
    hasher.update(sphincs_pubkey.as_bytes());
    let result = hasher.finalize();
    format!("0x{}", hex::encode(result))
}
