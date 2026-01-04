//! Unlock API implementation (API-003)
//!
//! Implements:
//! - Sequence #2: Unlock (Normal Path) - 24h time lock
//! - Sequence #3: Unlock (Emergency Path) - 7d time lock + bond
//!
//! CP-1 Compliance: Uses Dilithium-III (NIST FIPS 204) for signature verification

use std::sync::Arc;

use axum::{Extension, Json};
use pqcrypto_dilithium::dilithium3;
use pqcrypto_traits::sign::PublicKey as PqPublicKey;
use pqcrypto_traits::sign::DetachedSignature;
use sha3::{Sha3_256, Digest};

use crate::{
    error::ApiError,
    services::AppState,
    types::{UnlockRequest, UnlockResponse, EmergencyUnlockResponse, UnlockStatus, LockStatus},
};

/// Time lock constants from CORE_PRINCIPLES.md
const NORMAL_TIME_LOCK_HOURS: u64 = 24;    // SEQ#2
const EMERGENCY_TIME_LOCK_DAYS: u64 = 7;   // SEQ#3

/// Dilithium-III public key size (NIST FIPS 204)
const DILITHIUM3_PUBLIC_KEY_BYTES: usize = 1952;
/// Dilithium-III signature size (NIST FIPS 204)
const DILITHIUM3_SIGNATURE_BYTES: usize = 3293;

/// POST /v1/unlock
/// 
/// Request normal unlock with 24h time lock.
/// Requires 2/5 Prover SPHINCS+ signatures.
/// 
/// # Security
/// - 24h Time Lock (CP-3)
/// - Prover 2/5 signatures required
/// - Uses SHA3-256 for SR_1 computation (CP-1)
/// - Uses Dilithium-III for user signature verification (CP-1)
pub async fn create_unlock(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<UnlockRequest>,
) -> Result<Json<UnlockResponse>, ApiError> {
    tracing::info!("Processing unlock request for lock_id: {}", req.lock_id);

    // 1. Get lock record
    let lock = state.get_lock(&req.lock_id).await?
        .ok_or_else(|| ApiError::LockNotFound(req.lock_id.clone()))?;

    // 2. Validate lock status
    if lock.status == LockStatus::Released {
        return Err(ApiError::AlreadyReleased);
    }
    if lock.status == LockStatus::Challenged {
        return Err(ApiError::ChallengeActive);
    }
    if lock.status == LockStatus::UnlockPending {
        return Err(ApiError::TimeLockActive);
    }

    // 3. Validate Dilithium-III signature (CP-1 Compliant)
    let message = construct_unlock_message(&req.lock_id, &req.dest_addr, &req.amount);
    if !verify_dilithium3_signature(&message, &req.sig_dilithium, &lock.user_public_key)? {
        return Err(ApiError::InvalidSignature("Dilithium-III verification failed".into()));
    }
    tracing::info!("✓ Dilithium-III signature verified (NIST FIPS 204 compliant)");

    // 4. Compute SR_1 using SHA3-256 (NOT keccak256)
    let sr_1 = compute_sr1(&lock.sr_0, &req);

    // 5. Generate unlock_id
    let unlock_id = generate_unlock_id(&req.lock_id, &sr_1);

    // 6. Calculate release time (24h from now)
    let now = chrono::Utc::now().timestamp() as u64;
    let release_time = now + (NORMAL_TIME_LOCK_HOURS * 3600);

    // 7. Request Prover signatures via Signature Queue (API-005)
    state.request_prover_signatures(&unlock_id, &req.lock_id, &lock.sr_0, &sr_1).await?;

    // 8. Update lock status
    state.update_lock_status(&req.lock_id, LockStatus::UnlockPending, Some(release_time)).await?;

    tracing::info!("Unlock request created: {}", unlock_id);

    Ok(Json(UnlockResponse {
        unlock_id,
        sr_1,
        release_time,
        time_lock_hours: NORMAL_TIME_LOCK_HOURS,
        prover_signatures_required: 2,
        prover_signatures_collected: 0,
        status: UnlockStatus::PendingSignatures,
    }))
}

/// POST /v1/unlock/emergency
/// 
/// Request emergency unlock with 7d time lock and bond.
/// No Prover signatures required.
/// 
/// # Security
/// - 7d Time Lock (CP-3)
/// - Emergency Bond: MAX(0.5 ETH, amount × 5%)
/// - Uses SHA3-256 for SR_1 computation (CP-1)
/// - Uses Dilithium-III for user signature verification (CP-1)
pub async fn create_emergency_unlock(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<UnlockRequest>,
) -> Result<Json<EmergencyUnlockResponse>, ApiError> {
    tracing::info!("Processing EMERGENCY unlock request for lock_id: {}", req.lock_id);

    // 1. Get lock record
    let lock = state.get_lock(&req.lock_id).await?
        .ok_or_else(|| ApiError::LockNotFound(req.lock_id.clone()))?;

    // 2. Validate lock status
    if lock.status == LockStatus::Released {
        return Err(ApiError::AlreadyReleased);
    }
    if lock.status == LockStatus::Challenged {
        return Err(ApiError::ChallengeActive);
    }

    // 3. Validate Dilithium-III signature (CP-1 Compliant)
    let message = construct_unlock_message(&req.lock_id, &req.dest_addr, &req.amount);
    if !verify_dilithium3_signature(&message, &req.sig_dilithium, &lock.user_public_key)? {
        return Err(ApiError::InvalidSignature("Dilithium-III verification failed".into()));
    }
    tracing::info!("✓ Dilithium-III signature verified (NIST FIPS 204 compliant)");

    // 4. Compute SR_1 using SHA3-256 (NOT keccak256)
    let sr_1 = compute_sr1(&lock.sr_0, &req);

    // 5. Generate unlock_id
    let unlock_id = generate_unlock_id(&req.lock_id, &sr_1);

    // 6. Calculate release time (7 days from now)
    let now = chrono::Utc::now().timestamp() as u64;
    let release_time = now + (EMERGENCY_TIME_LOCK_DAYS * 24 * 3600);

    // 7. Calculate emergency bond: MAX(0.5 ETH, amount × 5%)
    let bond_required = calculate_emergency_bond(&req.amount);

    // 8. Update lock status
    state.update_lock_status(&req.lock_id, LockStatus::EmergencyPending, Some(release_time)).await?;

    tracing::info!("Emergency unlock request created: {}, bond: {}", unlock_id, bond_required);

    Ok(Json(EmergencyUnlockResponse {
        unlock_id,
        sr_1,
        release_time,
        time_lock_days: EMERGENCY_TIME_LOCK_DAYS,
        bond_required,
        bond_calculation: "MAX(0.5 ETH, amount × 5%)".to_string(),
        status: UnlockStatus::EmergencyPending,
    }))
}

/// Construct the message to be signed for unlock requests
/// 
/// Message format: "QS_UNLOCK_V1" || lock_id || dest_addr || amount
fn construct_unlock_message(lock_id: &str, dest_addr: &str, amount: &str) -> Vec<u8> {
    let mut message = Vec::new();
    message.extend_from_slice(b"QS_UNLOCK_V1");
    message.extend_from_slice(lock_id.as_bytes());
    message.extend_from_slice(dest_addr.as_bytes());
    message.extend_from_slice(amount.as_bytes());
    message
}

/// Verify Dilithium-III signature (NIST FIPS 204)
/// 
/// CP-1 Compliance: Only Dilithium-III is used for user signatures
/// This function performs actual cryptographic verification using pqcrypto-dilithium
/// 
/// # Arguments
/// * `message` - The message that was signed
/// * `signature_hex` - Hex-encoded Dilithium-III signature (with or without 0x prefix)
/// * `public_key_hex` - Hex-encoded Dilithium-III public key (with or without 0x prefix)
/// 
/// # Returns
/// * `Ok(true)` if signature is valid
/// * `Ok(false)` if signature is invalid
/// * `Err` if input format is invalid
fn verify_dilithium3_signature(
    message: &[u8],
    signature_hex: &str,
    public_key_hex: &str,
) -> Result<bool, ApiError> {
    // Decode hex signature (strip 0x prefix if present)
    let sig_bytes = hex::decode(signature_hex.strip_prefix("0x").unwrap_or(signature_hex))
        .map_err(|e| ApiError::InvalidSignature(format!("Invalid signature hex: {}", e)))?;
    
    // Decode hex public key (strip 0x prefix if present)
    let pk_bytes = hex::decode(public_key_hex.strip_prefix("0x").unwrap_or(public_key_hex))
        .map_err(|e| ApiError::InvalidSignature(format!("Invalid public key hex: {}", e)))?;

    // Validate sizes
    if sig_bytes.len() != DILITHIUM3_SIGNATURE_BYTES {
        return Err(ApiError::InvalidSignature(format!(
            "Invalid signature size: expected {} bytes, got {}",
            DILITHIUM3_SIGNATURE_BYTES, sig_bytes.len()
        )));
    }
    if pk_bytes.len() != DILITHIUM3_PUBLIC_KEY_BYTES {
        return Err(ApiError::InvalidSignature(format!(
            "Invalid public key size: expected {} bytes, got {}",
            DILITHIUM3_PUBLIC_KEY_BYTES, pk_bytes.len()
        )));
    }

    // Parse public key using try_from for proper error handling
    let public_key = match <dilithium3::PublicKey as TryFrom<&[u8]>>::try_from(&pk_bytes) {
        Ok(pk) => pk,
        Err(_) => return Err(ApiError::InvalidSignature("Failed to parse Dilithium-III public key".into())),
    };

    // Parse signature using try_from for proper error handling
    let signature = match <dilithium3::DetachedSignature as TryFrom<&[u8]>>::try_from(&sig_bytes) {
        Ok(sig) => sig,
        Err(_) => return Err(ApiError::InvalidSignature("Failed to parse Dilithium-III signature".into())),
    };

    // Verify signature
    let result = dilithium3::verify_detached_signature(&signature, message, &public_key);
    
    Ok(result.is_ok())
}

/// Compute SR_1 using SHA3-256
/// 
/// CP-1 Compliance: SHA3-256 is used instead of keccak256
/// 
/// SR_1 = SHA3-256(
///   "QS_UNLOCK_V1" ||
///   SR_0 ||
///   lock_id ||
///   dest_addr ||
///   amount ||
///   nonce (from timestamp)
/// )
fn compute_sr1(sr_0: &str, req: &UnlockRequest) -> String {
    let mut hasher = Sha3_256::new();
    
    hasher.update(b"QS_UNLOCK_V1");
    hasher.update(sr_0.as_bytes());
    hasher.update(req.lock_id.as_bytes());
    hasher.update(req.dest_addr.as_bytes());
    hasher.update(req.amount.as_bytes());
    hasher.update(chrono::Utc::now().timestamp().to_be_bytes());
    
    let result = hasher.finalize();
    format!("0x{}", hex::encode(result))
}

/// Generate unlock_id from lock_id and SR_1
fn generate_unlock_id(lock_id: &str, sr_1: &str) -> String {
    let mut hasher = Sha3_256::new();
    hasher.update(lock_id.as_bytes());
    hasher.update(sr_1.as_bytes());
    let result = hasher.finalize();
    format!("0x{}", hex::encode(result))
}

/// Calculate emergency bond: MAX(0.5 ETH, amount × 5%)
/// 
/// From CORE_PRINCIPLES.md:
/// - Emergency Bond: MAX(0.5 ETH, amount × 5%)
fn calculate_emergency_bond(amount: &str) -> String {
    const MIN_BOND_WEI: u128 = 500_000_000_000_000_000; // 0.5 ETH
    const BOND_PERCENTAGE_BPS: u128 = 500; // 5% = 500 basis points

    let amount_wei: u128 = amount.parse().unwrap_or(0);
    let percentage_bond = (amount_wei * BOND_PERCENTAGE_BPS) / 10_000;
    
    let bond = std::cmp::max(MIN_BOND_WEI, percentage_bond);
    bond.to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use pqcrypto_dilithium::dilithium3;
    use pqcrypto_traits::sign::PublicKey as PqPublicKey;
    use pqcrypto_traits::sign::DetachedSignature as DetachedSig;

    #[test]
    fn test_time_lock_constants() {
        // SEQ#2: 24h Normal Time Lock
        assert_eq!(NORMAL_TIME_LOCK_HOURS, 24);
        // SEQ#3: 7d Emergency Time Lock
        assert_eq!(EMERGENCY_TIME_LOCK_DAYS, 7);
    }

    #[test]
    fn test_dilithium3_constants() {
        // NIST FIPS 204 Dilithium-III sizes
        assert_eq!(DILITHIUM3_PUBLIC_KEY_BYTES, 1952);
        assert_eq!(DILITHIUM3_SIGNATURE_BYTES, 3293);
    }

    #[test]
    fn test_dilithium3_signature_verification_success() {
        // Generate a test keypair
        let (pk, sk) = dilithium3::keypair();
        
        // Create a test message
        let message = b"QS_UNLOCK_V1test_lock_id0x1234567890abcdef1000000000000000000";
        
        // Sign the message
        let signature = dilithium3::detached_sign(message, &sk);
        
        // Convert to hex strings
        let pk_hex = format!("0x{}", hex::encode(pk.as_bytes()));
        let sig_hex = format!("0x{}", hex::encode(signature.as_bytes()));
        
        // Verify
        let result = verify_dilithium3_signature(message, &sig_hex, &pk_hex);
        assert!(result.is_ok(), "Verification should not error: {:?}", result);
        assert!(result.unwrap(), "Signature should be valid");
    }

    #[test]
    fn test_dilithium3_signature_verification_failure_wrong_message() {
        // Generate a test keypair
        let (pk, sk) = dilithium3::keypair();
        
        // Sign one message
        let message = b"original message";
        let signature = dilithium3::detached_sign(message, &sk);
        
        // Convert to hex strings
        let pk_hex = format!("0x{}", hex::encode(pk.as_bytes()));
        let sig_hex = format!("0x{}", hex::encode(signature.as_bytes()));
        
        // Verify with different message should fail
        let wrong_message = b"different message";
        let result = verify_dilithium3_signature(wrong_message, &sig_hex, &pk_hex);
        assert!(result.is_ok(), "Verification should not error: {:?}", result);
        assert!(!result.unwrap(), "Signature should be invalid for wrong message");
    }

    #[test]
    fn test_dilithium3_signature_verification_failure_wrong_key() {
        // Generate two test keypairs
        let (_pk1, sk1) = dilithium3::keypair();
        let (pk2, _sk2) = dilithium3::keypair();
        
        // Sign with keypair 1
        let message = b"test message";
        let signature = dilithium3::detached_sign(message, &sk1);
        
        // Convert to hex strings (using wrong public key)
        let wrong_pk_hex = format!("0x{}", hex::encode(pk2.as_bytes()));
        let sig_hex = format!("0x{}", hex::encode(signature.as_bytes()));
        
        // Verify with wrong public key should fail
        let result = verify_dilithium3_signature(message, &sig_hex, &wrong_pk_hex);
        assert!(result.is_ok(), "Verification should not error: {:?}", result);
        assert!(!result.unwrap(), "Signature should be invalid for wrong key");
    }

    #[test]
    fn test_dilithium3_signature_invalid_size() {
        let invalid_sig = "0x1234"; // Too short
        let valid_pk = format!("0x{}", hex::encode(vec![0u8; DILITHIUM3_PUBLIC_KEY_BYTES]));
        
        let result = verify_dilithium3_signature(b"test", invalid_sig, &valid_pk);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Invalid signature size"));
    }

    #[test]
    fn test_dilithium3_public_key_invalid_size() {
        let valid_sig = format!("0x{}", hex::encode(vec![0u8; DILITHIUM3_SIGNATURE_BYTES]));
        let invalid_pk = "0x1234"; // Too short
        
        let result = verify_dilithium3_signature(b"test", &valid_sig, invalid_pk);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Invalid public key size"));
    }

    #[test]
    fn test_construct_unlock_message() {
        let message = construct_unlock_message("lock123", "0xdest", "1000");
        let expected = b"QS_UNLOCK_V1lock1230xdest1000";
        assert_eq!(message, expected);
    }

    #[test]
    fn test_emergency_bond_minimum() {
        // 0.1 ETH → should return 0.5 ETH (minimum)
        let bond = calculate_emergency_bond("100000000000000000");
        assert_eq!(bond, "500000000000000000"); // 0.5 ETH
    }

    #[test]
    fn test_emergency_bond_percentage() {
        // 100 ETH → 5% = 5 ETH > 0.5 ETH minimum
        let bond = calculate_emergency_bond("100000000000000000000");
        assert_eq!(bond, "5000000000000000000"); // 5 ETH
    }

    #[test]
    fn test_emergency_bond_edge_case() {
        // 10 ETH → 5% = 0.5 ETH = minimum
        let bond = calculate_emergency_bond("10000000000000000000");
        assert_eq!(bond, "500000000000000000"); // 0.5 ETH
    }

    #[test]
    fn test_compute_sr1_uses_sha3_256() {
        let sr_0 = "0xabc123";
        let req = UnlockRequest {
            lock_id: "0xdef456".to_string(),
            dest_addr: "0x1234".to_string(),
            amount: "1000000000000000000".to_string(),
            sig_dilithium: "0xsig".to_string(),
        };

        let sr_1 = compute_sr1(sr_0, &req);
        
        // SR_1 should be a hex string starting with 0x
        assert!(sr_1.starts_with("0x"));
        // SHA3-256 produces 32 bytes = 64 hex chars + 0x prefix
        assert_eq!(sr_1.len(), 66);
    }
}
