//! Authentication Service (TASK-P5-012: SIWE→JWT)
//!
//! Provides JWT-based authentication using SIWE (Sign-In with Ethereum).
//!
//! ## Design (per SEQUENCES.md §1.1)
//! - Authentication: Uses standard ECDSA (wallet signatures) for UX compatibility
//! - Asset Protection: Dilithium is used separately in Lock/Unlock operations
//!
//! This separation allows users to authenticate with their standard wallet
//! while still providing quantum-resistant protection for their assets.

use sha3::{Digest, Sha3_256};
use crate::config::JwtConfig;
use crate::error::ApiError;
use crate::types::{JwtClaims, SiweMessage, SiweResponse};

/// Auth service for SIWE/JWT authentication
pub struct AuthService {
    config: JwtConfig,
}

impl AuthService {
    /// Create a new auth service
    pub fn new(config: JwtConfig) -> Self {
        Self { config }
    }

    /// Parse SIWE message from string
    pub fn parse_siwe_message(message: &str) -> Result<SiweMessage, ApiError> {
        let lines: Vec<&str> = message.lines().collect();
        if lines.len() < 6 {
            return Err(ApiError::InvalidSiweMessage("Invalid message format".into()));
        }

        let domain = lines[0].trim_end_matches(" wants you to sign in with your account:");
        let address = lines.get(1).unwrap_or(&"").to_string();

        let nonce = lines.iter()
            .find(|l| l.starts_with("Nonce: "))
            .map(|l| l.trim_start_matches("Nonce: ").to_string())
            .unwrap_or_default();

        let chain_id: u64 = lines.iter()
            .find(|l| l.starts_with("Chain ID: "))
            .and_then(|l| l.trim_start_matches("Chain ID: ").parse().ok())
            .unwrap_or(1);

        let uri = lines.iter()
            .find(|l| l.starts_with("URI: "))
            .map(|l| l.trim_start_matches("URI: ").to_string())
            .unwrap_or_default();

        let issued_at = lines.iter()
            .find(|l| l.starts_with("Issued At: "))
            .map(|l| l.trim_start_matches("Issued At: ").to_string())
            .unwrap_or_default();

        Ok(SiweMessage {
            domain: domain.to_string(),
            address,
            statement: None,
            uri,
            chain_id,
            nonce,
            issued_at,
            expiration_time: None,
        })
    }

    /// Authenticate using SIWE (Sign-In with Ethereum)
    ///
    /// Uses ECDSA signature verification per SEQUENCES.md §1.1.
    /// The address is recovered from the ECDSA signature and verified against
    /// the address in the SIWE message.
    pub fn authenticate_siwe(&self, req: &crate::types::SiweRequest) -> Result<SiweResponse, ApiError> {
        let siwe = Self::parse_siwe_message(&req.message)?;

        // Verify ECDSA signature and recover address
        let recovered_address = crate::crypto::verify_ecdsa_signature(
            &req.message,
            &req.signature,
        )?;

        // Verify recovered address matches the address in the SIWE message
        let siwe_address_lower = siwe.address.to_lowercase();
        let recovered_address_lower = recovered_address.to_lowercase();

        if siwe_address_lower != recovered_address_lower {
            return Err(ApiError::InvalidSignature(format!(
                "Address mismatch: SIWE message address {} does not match recovered address {}",
                siwe.address, recovered_address
            )));
        }

        // Use the address from the SIWE message (standardized format)
        let address = siwe.address.clone();

        let now = chrono::Utc::now().timestamp() as u64;
        let access_expires = now + self.config.access_token_expiry;
        let refresh_expires = now + self.config.refresh_token_expiry;

        // For ECDSA auth, use address hash as the pkh field
        // (Dilithium public key hash is only relevant for Lock/Unlock operations)
        let pk_hash = self.hash_address(&address);

        let access_token = self.generate_token(&address, &pk_hash, access_expires, "access")?;
        let refresh_token = self.generate_token(&address, &pk_hash, refresh_expires, "refresh")?;

        Ok(SiweResponse {
            access_token,
            refresh_token,
            expires_at: access_expires,
            address,
        })
    }

    /// Refresh access token
    pub fn refresh_access_token(&self, refresh_token: &str) -> Result<(String, u64), ApiError> {
        let claims = self.validate_token(refresh_token)?;

        if claims.typ != "refresh" {
            return Err(ApiError::InvalidRefreshToken);
        }

        let now = chrono::Utc::now().timestamp() as u64;
        let expires_at = now + self.config.access_token_expiry;
        let access_token = self.generate_token(&claims.sub, &claims.pkh, expires_at, "access")?;

        Ok((access_token, expires_at))
    }

    /// Validate a JWT token
    pub fn validate_token(&self, token: &str) -> Result<JwtClaims, ApiError> {
        use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};

        let decoding_key = DecodingKey::from_secret(self.config.secret.as_bytes());
        let mut validation = Validation::new(Algorithm::HS256);
        validation.validate_exp = true;

        let token_data = decode::<JwtClaims>(token, &decoding_key, &validation)
            .map_err(|e| ApiError::InvalidToken(e.to_string()))?;

        Ok(token_data.claims)
    }

    fn generate_token(&self, address: &str, pk_hash: &str, expires_at: u64, token_type: &str) -> Result<String, ApiError> {
        use jsonwebtoken::{encode, EncodingKey, Header, Algorithm};

        let now = chrono::Utc::now().timestamp() as u64;
        let claims = JwtClaims {
            sub: address.to_string(),
            pkh: pk_hash.to_string(),
            iat: now,
            exp: expires_at,
            typ: token_type.to_string(),
        };

        let header = Header::new(Algorithm::HS256);
        let encoding_key = EncodingKey::from_secret(self.config.secret.as_bytes());

        encode(&header, &claims, &encoding_key)
            .map_err(|e| ApiError::Internal(format!("Token generation failed: {}", e)))
    }

    fn derive_address_from_pk(&self, public_key: &str) -> String {
        let pk_bytes = hex::decode(public_key.trim_start_matches("0x")).unwrap_or_default();
        let mut hasher = Sha3_256::new();
        hasher.update(&pk_bytes);
        let hash = hasher.finalize();
        format!("0x{}", hex::encode(&hash[12..32]))
    }

    fn hash_public_key(&self, public_key: &str) -> String {
        let pk_bytes = hex::decode(public_key.trim_start_matches("0x")).unwrap_or_default();
        let mut hasher = Sha3_256::new();
        hasher.update(&pk_bytes);
        format!("0x{}", hex::encode(hasher.finalize()))
    }

    /// Hash an Ethereum address for use in JWT claims
    /// Used when authenticating via ECDSA (no separate public key)
    fn hash_address(&self, address: &str) -> String {
        let addr_bytes = hex::decode(address.trim_start_matches("0x")).unwrap_or_default();
        let mut hasher = Sha3_256::new();
        hasher.update(&addr_bytes);
        format!("0x{}", hex::encode(hasher.finalize()))
    }
}
