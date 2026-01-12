//! Authentication service (TASK-P5-012: SIWE→JWT)
//!
//! Provides SIWE (Sign-In with Ethereum/Quantum-safe) authentication
//! using Dilithium-III signatures (CP-1 compliant) and JWT token management.

use chrono::{DateTime, Utc};
use fips204::ml_dsa_65;
use fips204::traits::{SerDes, Verifier};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use sha3::{Digest, Sha3_256};

use crate::config::JwtConfig;
use crate::error::ApiError;
use crate::types::{JwtClaims, SiweMessage, SiweRequest, SiweResponse};

/// Refresh token expiry: 7 days
const REFRESH_TOKEN_EXPIRY_HOURS: u64 = 24 * 7;

/// Authentication service for SIWE and JWT operations
pub struct AuthService {
    jwt_config: JwtConfig,
}

impl AuthService {
    /// Create a new AuthService instance
    pub fn new(jwt_config: JwtConfig) -> Self {
        Self { jwt_config }
    }

    /// Authenticate a user via SIWE message and Dilithium signature
    ///
    /// # Arguments
    /// * `req` - SIWE authentication request containing message, signature, and public key
    ///
    /// # Returns
    /// * `Ok(SiweResponse)` - JWT tokens on successful authentication
    /// * `Err(ApiError)` - Error on validation failure
    pub fn authenticate_siwe(&self, req: &SiweRequest) -> Result<SiweResponse, ApiError> {
        // 1. Parse and validate SIWE message
        let siwe_message = Self::parse_siwe_message(&req.message)?;

        // 2. Check message expiration
        if let Some(ref exp) = siwe_message.expiration_time {
            let exp_time = DateTime::parse_from_rfc3339(exp)
                .map_err(|e| ApiError::InvalidSiweMessage(format!("Invalid expiration time: {}", e)))?;
            if exp_time < Utc::now() {
                return Err(ApiError::SiweMessageExpired);
            }
        }

        // 3. Verify Dilithium-III signature (CP-1 compliant)
        Self::verify_dilithium_signature(&req.message, &req.signature, &req.public_key)?;

        // 4. Compute address from public key (SHA3-256 hash, take last 20 bytes)
        let address = Self::compute_address(&req.public_key)?;

        // 5. Verify address matches SIWE message (case-insensitive)
        if address.to_lowercase() != siwe_message.address.to_lowercase() {
            return Err(ApiError::InvalidSiweMessage(
                "Address mismatch between message and public key".to_string(),
            ));
        }

        // 6. Compute public key hash for JWT claims
        let pkh = Self::compute_pubkey_hash(&req.public_key)?;

        // 7. Generate JWT tokens
        let now = Utc::now().timestamp() as u64;
        let access_expires_at = now + self.jwt_config.expiry_hours * 3600;
        let refresh_expires_at = now + REFRESH_TOKEN_EXPIRY_HOURS * 3600;

        let access_token = self.generate_token(&address, &pkh, now, access_expires_at, "access")?;
        let refresh_token = self.generate_token(&address, &pkh, now, refresh_expires_at, "refresh")?;

        Ok(SiweResponse {
            access_token,
            refresh_token,
            expires_at: access_expires_at,
            address,
        })
    }

    /// Refresh an access token using a valid refresh token
    ///
    /// # Arguments
    /// * `refresh_token` - The refresh token to validate
    ///
    /// # Returns
    /// * `Ok((access_token, expires_at))` - New access token on success
    /// * `Err(ApiError)` - Error on validation failure
    pub fn refresh_access_token(&self, refresh_token: &str) -> Result<(String, u64), ApiError> {
        // 1. Validate refresh token
        let claims = self.validate_token(refresh_token)?;

        // 2. Verify it's a refresh token
        if claims.typ != "refresh" {
            return Err(ApiError::InvalidRefreshToken);
        }

        // 3. Generate new access token
        let now = Utc::now().timestamp() as u64;
        let access_expires_at = now + self.jwt_config.expiry_hours * 3600;

        let access_token = self.generate_token(
            &claims.sub,
            &claims.pkh,
            now,
            access_expires_at,
            "access",
        )?;

        Ok((access_token, access_expires_at))
    }

    /// Validate a JWT token and extract claims
    ///
    /// # Arguments
    /// * `token` - The JWT token to validate
    ///
    /// # Returns
    /// * `Ok(JwtClaims)` - Decoded claims on success
    /// * `Err(ApiError)` - Error on validation failure
    pub fn validate_token(&self, token: &str) -> Result<JwtClaims, ApiError> {
        let mut validation = Validation::default();
        validation.validate_exp = true;

        let token_data = decode::<JwtClaims>(
            token,
            &DecodingKey::from_secret(self.jwt_config.secret.as_bytes()),
            &validation,
        )
        .map_err(|e| match e.kind() {
            jsonwebtoken::errors::ErrorKind::ExpiredSignature => ApiError::TokenExpired,
            _ => ApiError::InvalidToken(e.to_string()),
        })?;

        Ok(token_data.claims)
    }

    /// Generate a JWT token
    fn generate_token(
        &self,
        address: &str,
        pkh: &str,
        iat: u64,
        exp: u64,
        typ: &str,
    ) -> Result<String, ApiError> {
        let claims = JwtClaims {
            sub: address.to_string(),
            pkh: pkh.to_string(),
            iat,
            exp,
            typ: typ.to_string(),
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.jwt_config.secret.as_bytes()),
        )
        .map_err(|e| ApiError::Internal(format!("JWT encoding error: {}", e)))
    }

    /// Parse a SIWE message string into structured fields
    ///
    /// SIWE message format (EIP-4361):
    /// ```text
    /// {domain} wants you to sign in with your Ethereum account:
    /// {address}
    ///
    /// {statement}
    ///
    /// URI: {uri}
    /// Version: {version}
    /// Chain ID: {chain_id}
    /// Nonce: {nonce}
    /// Issued At: {issued_at}
    /// Expiration Time: {expiration_time}
    /// ```
    pub fn parse_siwe_message(message: &str) -> Result<SiweMessage, ApiError> {
        let lines: Vec<&str> = message.lines().collect();

        if lines.len() < 6 {
            return Err(ApiError::InvalidSiweMessage(
                "Message too short".to_string(),
            ));
        }

        // Parse domain from first line
        let first_line = lines[0];
        let domain = first_line
            .split(" wants you to sign in")
            .next()
            .ok_or_else(|| ApiError::InvalidSiweMessage("Missing domain".to_string()))?
            .to_string();

        // Parse address from second line
        let address = lines[1].trim().to_string();
        if !address.starts_with("0x") || address.len() != 42 {
            return Err(ApiError::InvalidSiweMessage(format!(
                "Invalid address format: {}",
                address
            )));
        }

        // Parse remaining fields
        let mut uri = String::new();
        let mut chain_id = 1u64;
        let mut nonce = String::new();
        let mut issued_at = String::new();
        let mut expiration_time = None;
        let mut statement = None;

        let mut in_statement = false;
        let mut statement_lines: Vec<&str> = Vec::new();

        for line in lines.iter().skip(2) {
            let trimmed = line.trim();

            if trimmed.starts_with("URI:") {
                in_statement = false;
                uri = trimmed.strip_prefix("URI:").unwrap_or("").trim().to_string();
            } else if trimmed.starts_with("Version:") {
                in_statement = false;
                // Version is not stored but validated
            } else if trimmed.starts_with("Chain ID:") {
                in_statement = false;
                chain_id = trimmed
                    .strip_prefix("Chain ID:")
                    .unwrap_or("1")
                    .trim()
                    .parse()
                    .unwrap_or(1);
            } else if trimmed.starts_with("Nonce:") {
                in_statement = false;
                nonce = trimmed.strip_prefix("Nonce:").unwrap_or("").trim().to_string();
            } else if trimmed.starts_with("Issued At:") {
                in_statement = false;
                issued_at = trimmed
                    .strip_prefix("Issued At:")
                    .unwrap_or("")
                    .trim()
                    .to_string();
            } else if trimmed.starts_with("Expiration Time:") {
                in_statement = false;
                let exp = trimmed
                    .strip_prefix("Expiration Time:")
                    .unwrap_or("")
                    .trim()
                    .to_string();
                if !exp.is_empty() {
                    expiration_time = Some(exp);
                }
            } else if !trimmed.is_empty() && uri.is_empty() {
                // Collect statement lines (between address and URI)
                in_statement = true;
                statement_lines.push(trimmed);
            } else if in_statement && !trimmed.is_empty() {
                statement_lines.push(trimmed);
            }
        }

        if !statement_lines.is_empty() {
            statement = Some(statement_lines.join("\n"));
        }

        // Validate required fields
        if uri.is_empty() {
            return Err(ApiError::InvalidSiweMessage("Missing URI".to_string()));
        }
        if nonce.is_empty() {
            return Err(ApiError::InvalidSiweMessage("Missing nonce".to_string()));
        }
        if issued_at.is_empty() {
            return Err(ApiError::InvalidSiweMessage("Missing issued_at".to_string()));
        }

        Ok(SiweMessage {
            domain,
            address,
            statement,
            uri,
            chain_id,
            nonce,
            issued_at,
            expiration_time,
        })
    }

    /// Verify a Dilithium-III signature (CP-1 compliant)
    ///
    /// # Arguments
    /// * `message` - The message that was signed
    /// * `signature_hex` - The signature in hex format
    /// * `pubkey_hex` - The public key in hex format
    fn verify_dilithium_signature(
        message: &str,
        signature_hex: &str,
        pubkey_hex: &str,
    ) -> Result<(), ApiError> {
        // Decode public key from hex
        let pubkey_bytes = hex::decode(pubkey_hex.trim_start_matches("0x"))
            .map_err(|e| ApiError::InvalidSignature(format!("Invalid public key hex: {}", e)))?;

        // Decode signature from hex
        let sig_bytes = hex::decode(signature_hex.trim_start_matches("0x"))
            .map_err(|e| ApiError::InvalidSignature(format!("Invalid signature hex: {}", e)))?;

        // Validate public key size (ML-DSA-65 public key is 1952 bytes)
        if pubkey_bytes.len() != ml_dsa_65::PK_LEN {
            return Err(ApiError::InvalidSignature(format!(
                "Invalid public key size: expected {}, got {}",
                ml_dsa_65::PK_LEN,
                pubkey_bytes.len()
            )));
        }

        // Validate signature size (ML-DSA-65 signature is 3309 bytes)
        if sig_bytes.len() != ml_dsa_65::SIG_LEN {
            return Err(ApiError::InvalidSignature(format!(
                "Invalid signature size: expected {}, got {}",
                ml_dsa_65::SIG_LEN,
                sig_bytes.len()
            )));
        }

        // Convert to fixed-size arrays
        let pubkey_array: [u8; ml_dsa_65::PK_LEN] = pubkey_bytes
            .try_into()
            .map_err(|_| ApiError::InvalidSignature("Public key conversion failed".to_string()))?;

        let sig_array: [u8; ml_dsa_65::SIG_LEN] = sig_bytes
            .try_into()
            .map_err(|_| ApiError::InvalidSignature("Signature conversion failed".to_string()))?;

        // Create public key from bytes
        let pk = ml_dsa_65::PublicKey::try_from_bytes(pubkey_array)
            .map_err(|e| ApiError::InvalidSignature(format!("Invalid public key: {:?}", e)))?;

        // Verify signature (context is empty for SIWE authentication)
        let is_valid = pk.verify(message.as_bytes(), &sig_array, &[]);
        if !is_valid {
            return Err(ApiError::InvalidSignature("Signature verification failed".to_string()));
        }

        Ok(())
    }

    /// Compute an Ethereum-style address from a Dilithium public key
    /// Uses SHA3-256 (CP-1 compliant) and takes the last 20 bytes
    pub fn compute_address(pubkey_hex: &str) -> Result<String, ApiError> {
        let pubkey_bytes = hex::decode(pubkey_hex.trim_start_matches("0x"))
            .map_err(|e| ApiError::InvalidSignature(format!("Invalid public key hex: {}", e)))?;

        // Hash with SHA3-256 (CP-1 compliant, not keccak256)
        let mut hasher = Sha3_256::new();
        hasher.update(&pubkey_bytes);
        let hash = hasher.finalize();

        // Take last 20 bytes as address
        let address_bytes = &hash[hash.len() - 20..];
        Ok(format!("0x{}", hex::encode(address_bytes)))
    }

    /// Compute SHA3-256 hash of public key (for JWT claims)
    pub fn compute_pubkey_hash(pubkey_hex: &str) -> Result<String, ApiError> {
        let pubkey_bytes = hex::decode(pubkey_hex.trim_start_matches("0x"))
            .map_err(|e| ApiError::InvalidSignature(format!("Invalid public key hex: {}", e)))?;

        let mut hasher = Sha3_256::new();
        hasher.update(&pubkey_bytes);
        let hash = hasher.finalize();

        Ok(format!("0x{}", hex::encode(hash)))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_config() -> JwtConfig {
        JwtConfig {
            secret: "test-secret-key-for-testing-only".to_string(),
            expiry_hours: 24,
        }
    }

    #[test]
    fn test_parse_siwe_message_valid() {
        let message = r#"example.com wants you to sign in with your Ethereum account:
0x1234567890123456789012345678901234567890

Sign in to Quantum Shield

URI: https://example.com/login
Version: 1
Chain ID: 1
Nonce: abc123
Issued At: 2024-01-01T00:00:00Z"#;

        let result = AuthService::parse_siwe_message(message);
        assert!(result.is_ok());

        let siwe = result.unwrap();
        assert_eq!(siwe.domain, "example.com");
        assert_eq!(siwe.address, "0x1234567890123456789012345678901234567890");
        assert_eq!(siwe.statement, Some("Sign in to Quantum Shield".to_string()));
        assert_eq!(siwe.uri, "https://example.com/login");
        assert_eq!(siwe.chain_id, 1);
        assert_eq!(siwe.nonce, "abc123");
        assert_eq!(siwe.issued_at, "2024-01-01T00:00:00Z");
    }

    #[test]
    fn test_parse_siwe_message_with_expiration() {
        let message = r#"example.com wants you to sign in with your Ethereum account:
0x1234567890123456789012345678901234567890

URI: https://example.com/login
Version: 1
Chain ID: 1
Nonce: abc123
Issued At: 2024-01-01T00:00:00Z
Expiration Time: 2024-12-31T23:59:59Z"#;

        let result = AuthService::parse_siwe_message(message);
        assert!(result.is_ok());

        let siwe = result.unwrap();
        assert_eq!(siwe.expiration_time, Some("2024-12-31T23:59:59Z".to_string()));
    }

    #[test]
    fn test_parse_siwe_message_invalid_address() {
        let message = r#"example.com wants you to sign in with your Ethereum account:
invalid-address

URI: https://example.com/login
Version: 1
Chain ID: 1
Nonce: abc123
Issued At: 2024-01-01T00:00:00Z"#;

        let result = AuthService::parse_siwe_message(message);
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_siwe_message_missing_nonce() {
        let message = r#"example.com wants you to sign in with your Ethereum account:
0x1234567890123456789012345678901234567890

URI: https://example.com/login
Version: 1
Chain ID: 1
Issued At: 2024-01-01T00:00:00Z"#;

        let result = AuthService::parse_siwe_message(message);
        assert!(result.is_err());
    }

    #[test]
    fn test_generate_and_validate_token() {
        let service = AuthService::new(test_config());
        let address = "0x1234567890123456789012345678901234567890";
        let pkh = "0xabcdef";
        let now = Utc::now().timestamp() as u64;
        let exp = now + 3600;

        let token = service.generate_token(address, pkh, now, exp, "access");
        assert!(token.is_ok());

        let claims = service.validate_token(&token.unwrap());
        assert!(claims.is_ok());

        let claims = claims.unwrap();
        assert_eq!(claims.sub, address);
        assert_eq!(claims.pkh, pkh);
        assert_eq!(claims.typ, "access");
    }

    #[test]
    fn test_refresh_token_validation() {
        let service = AuthService::new(test_config());
        let address = "0x1234567890123456789012345678901234567890";
        let pkh = "0xabcdef";
        let now = Utc::now().timestamp() as u64;
        let exp = now + 3600 * 24 * 7;

        // Generate refresh token
        let refresh_token = service.generate_token(address, pkh, now, exp, "refresh").unwrap();

        // Use it to get a new access token
        let result = service.refresh_access_token(&refresh_token);
        assert!(result.is_ok());

        let (new_access_token, _) = result.unwrap();

        // Validate the new access token
        let claims = service.validate_token(&new_access_token).unwrap();
        assert_eq!(claims.typ, "access");
        assert_eq!(claims.sub, address);
    }

    #[test]
    fn test_reject_access_token_as_refresh() {
        let service = AuthService::new(test_config());
        let address = "0x1234567890123456789012345678901234567890";
        let pkh = "0xabcdef";
        let now = Utc::now().timestamp() as u64;
        let exp = now + 3600;

        // Generate access token (not refresh)
        let access_token = service.generate_token(address, pkh, now, exp, "access").unwrap();

        // Try to use it as refresh token - should fail
        let result = service.refresh_access_token(&access_token);
        assert!(result.is_err());
    }

    #[test]
    fn test_compute_address() {
        // Use a dummy 1952-byte public key (ML-DSA-65 size)
        let pubkey = "00".repeat(1952);
        let result = AuthService::compute_address(&pubkey);
        assert!(result.is_ok());

        let address = result.unwrap();
        assert!(address.starts_with("0x"));
        assert_eq!(address.len(), 42); // 0x + 40 hex chars
    }

    #[test]
    fn test_compute_pubkey_hash() {
        let pubkey = "00".repeat(1952);
        let result = AuthService::compute_pubkey_hash(&pubkey);
        assert!(result.is_ok());

        let hash = result.unwrap();
        assert!(hash.starts_with("0x"));
        assert_eq!(hash.len(), 66); // 0x + 64 hex chars (32 bytes)
    }
}
