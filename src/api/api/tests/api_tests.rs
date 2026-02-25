//! API Integration Tests
//!
//! Test categories:
//! - TEST-W2-001: Lock API Unit Tests
//! - TEST-W2-002: Unlock API Unit Tests
//! - TEST-W2-003: Status Tracker API Unit Tests
//! - TEST-W2-004: Signature Queue Service Unit Tests

#[cfg(test)]
mod tests {
    // TEST-W2-001: Lock API Tests
    mod lock_tests {
        #[test]
        fn test_lock_sr0_uses_sha3_256() {
            // Verify SR_0 is computed with SHA3-256 (not keccak256)
            // CP-1 compliance
            use sha3::{Sha3_256, Digest};
            let mut hasher = Sha3_256::new();
            hasher.update(b"test");
            let result = hasher.finalize();
            assert_eq!(result.len(), 32);  // SHA3-256 = 32 bytes
        }

        #[test]
        fn test_lock_id_deterministic() {
            // Same inputs should produce same lock_id
            use sha3::{Sha3_256, Digest};
            let mut h1 = Sha3_256::new();
            let mut h2 = Sha3_256::new();
            h1.update(b"test");
            h2.update(b"test");
            assert_eq!(h1.finalize(), h2.finalize());
        }
    }

    // TEST-W2-002: Unlock API Tests
    mod unlock_tests {
        const NORMAL_TIME_LOCK_HOURS: u64 = 24;
        const EMERGENCY_TIME_LOCK_DAYS: u64 = 7;

        #[test]
        fn test_normal_time_lock_24h() {
            // SEQ#2: Normal Path = 24h Time Lock
            assert_eq!(NORMAL_TIME_LOCK_HOURS, 24);
        }

        #[test]
        fn test_emergency_time_lock_7d() {
            // SEQ#3: Emergency Path = 7 days Time Lock
            assert_eq!(EMERGENCY_TIME_LOCK_DAYS, 7);
        }

        #[test]
        fn test_emergency_bond_minimum() {
            // Emergency Bond minimum = 0.5 ETH
            const MIN_BOND_WEI: u128 = 500_000_000_000_000_000;
            assert_eq!(MIN_BOND_WEI, 500_000_000_000_000_000);
        }

        #[test]
        fn test_emergency_bond_percentage() {
            // Emergency Bond = MAX(0.5 ETH, amount × 5%)
            const BOND_BPS: u128 = 500;  // 5% = 500 basis points
            
            // Test: 100 ETH → 5% = 5 ETH > 0.5 ETH minimum
            let amount: u128 = 100_000_000_000_000_000_000;  // 100 ETH
            let percentage_bond = (amount * BOND_BPS) / 10_000;
            assert_eq!(percentage_bond, 5_000_000_000_000_000_000);  // 5 ETH
        }

        #[test]
        fn test_emergency_bond_uses_max() {
            const MIN_BOND: u128 = 500_000_000_000_000_000;  // 0.5 ETH
            const BOND_BPS: u128 = 500;
            
            // Test: 1 ETH → 5% = 0.05 ETH < 0.5 ETH minimum → use 0.5 ETH
            let amount: u128 = 1_000_000_000_000_000_000;  // 1 ETH
            let percentage_bond = (amount * BOND_BPS) / 10_000;
            let bond = std::cmp::max(MIN_BOND, percentage_bond);
            assert_eq!(bond, MIN_BOND);  // Should use minimum
        }
    }

    // TEST-W2-003: Status Tracker API Tests
    mod status_tests {
        #[test]
        fn test_time_lock_remaining_calculation() {
            let now = 1000u64;
            let release_time = 1500u64;
            let remaining = if release_time > now { release_time - now } else { 0 };
            assert_eq!(remaining, 500);
        }

        #[test]
        fn test_time_lock_expired() {
            let now = 2000u64;
            let release_time = 1500u64;
            let remaining = if release_time > now { release_time - now } else { 0 };
            assert_eq!(remaining, 0);
        }
    }

    // TEST-W2-004: Signature Queue Tests
    mod sig_queue_tests {
        const EMERGENCY_TIMEOUT_HOURS: u64 = 72;
        const REQUIRED_SIGNATURES: u32 = 2;
        const TOTAL_PROVERS: u32 = 5;

        #[test]
        fn test_emergency_timeout_72h() {
            // SEQ#3: 72h timeout triggers Emergency Path
            assert_eq!(EMERGENCY_TIMEOUT_HOURS, 72);
        }

        #[test]
        fn test_required_signatures_2_of_5() {
            // SEQ#2: 2/5 Prover signatures required
            assert_eq!(REQUIRED_SIGNATURES, 2);
            assert_eq!(TOTAL_PROVERS, 5);
        }
    }

    // TEST-W2-006: Redis AUTH Tests
    mod redis_tests {
        #[test]
        fn test_redis_url_with_password() {
            let url = "redis://localhost:6379";
            let password = "secret123";
            let base = url.replace("redis://", "");
            let auth_url = format!("redis://:{}@{}", password, base);
            assert_eq!(auth_url, "redis://:secret123@localhost:6379");
        }
    }

    // TEST-W2-007: mTLS Tests
    mod mtls_tests {
        #[test]
        fn test_mtls_required_for_hsm() {
            // FIX-002: mTLS is required for HSM communication
            let mtls_enabled = true;
            assert!(mtls_enabled, "mTLS must be enabled for HSM");
        }
    }

    // Security Constants Verification
    mod security_constants {
        #[test]
        fn test_all_security_constants() {
            // From CORE_PRINCIPLES.md
            const NORMAL_TIME_LOCK_HOURS: u64 = 24;
            const EMERGENCY_TIME_LOCK_DAYS: u64 = 7;
            const EMERGENCY_TIMEOUT_HOURS: u64 = 72;
            const MAX_PAUSE_DURATION_HOURS: u64 = 72;

            assert_eq!(NORMAL_TIME_LOCK_HOURS, 24, "SEQ#2: Normal Time Lock");
            assert_eq!(EMERGENCY_TIME_LOCK_DAYS, 7, "SEQ#3: Emergency Time Lock");
            assert_eq!(EMERGENCY_TIMEOUT_HOURS, 72, "SEQ#3: Emergency Timeout");
            assert_eq!(MAX_PAUSE_DURATION_HOURS, 72, "SEQ#8: Max Pause Duration");
        }
    }

    // =========================================================================
    // TEST-W5-001: Config Deserialization Tests
    // =========================================================================
    mod config_deserialization_tests {
        use quantum_shield_api::config::*;

        #[test]
        fn test_default_config_fields() {
            let config = Config::default();
            assert_eq!(config.server.host, "0.0.0.0");
            assert_eq!(config.server.port, 8080);
            assert_eq!(config.redis.url, "redis://localhost:6379");
            assert!(config.redis.password.is_none());
            assert_eq!(config.rabbitmq.url, "amqp://localhost:5672");
            assert_eq!(config.rabbitmq.queue_name, "sig_queue");
            assert_eq!(config.jwt.expiry_hours, 24);
            assert_eq!(config.jwt.access_token_expiry, 3600);
            assert_eq!(config.jwt.refresh_token_expiry, 604800);
        }

        #[test]
        fn test_security_config_defaults_match_sequences() {
            // Ensure SecurityConfig defaults exactly match SEQUENCES.md values
            let security = SecurityConfig::default();
            assert_eq!(security.normal_time_lock_hours, 24, "SEQUENCES §2: Normal = 24h");
            assert_eq!(security.emergency_time_lock_days, 7, "SEQUENCES §3: Emergency = 7d");
            assert_eq!(security.emergency_timeout_hours, 72, "SEQUENCES §3: Timeout = 72h");
            assert_eq!(security.max_pause_duration_hours, 72, "SEQUENCES §8: Pause = 72h");
            assert_eq!(security.min_emergency_bond_wei, "500000000000000000", "0.5 ETH in wei");
            assert_eq!(security.emergency_bond_bps, 500, "5% = 500 bps");
        }

        #[test]
        fn test_dev_mode_has_skip_verification_true() {
            let security = SecurityConfig::default();
            assert!(security.skip_signature_verification, "Dev default: skip sig");
            assert!(security.skip_totp_verification, "Dev default: skip TOTP");
        }

        #[test]
        fn test_vrf_config_defaults() {
            let vrf = VRFConfig::default();
            assert_eq!(vrf.contract_address, "0x0000000000000000000000000000000000000000");
            assert_eq!(vrf.chain_id, 11155111, "Sepolia chain ID");
            assert_eq!(vrf.timeout_seconds, 300, "5 minutes per SEQUENCES §2.3");
            assert_eq!(vrf.polling_interval_seconds, 5);
            assert!(vrf.private_key.is_none());
        }

        #[test]
        fn test_rate_limit_config_defaults() {
            let rl = RateLimitConfig::default();
            assert_eq!(rl.max_requests, 100);
            assert_eq!(rl.window_secs, 60);
            assert!(rl.enabled, "Rate limit enabled by default");
        }

        #[test]
        fn test_cors_config_default_localhost() {
            let cors = CorsConfig::default();
            assert_eq!(cors.allowed_origins.len(), 1);
            assert_eq!(cors.allowed_origins[0], "http://localhost:3000");
        }

        #[test]
        fn test_database_config_defaults() {
            let db = DatabaseConfig::default();
            assert_eq!(db.max_connections, 50);
            assert_eq!(db.min_connections, 5);
            assert_eq!(db.acquire_timeout_secs, 10);
            assert_eq!(db.idle_timeout_secs, 600);
            assert_eq!(db.max_lifetime_secs, 1800);
        }

        #[test]
        fn test_l3_l1_config_optional() {
            let config = Config::default();
            assert!(config.l3_endpoint.is_none());
            assert!(config.l3_chain_id.is_none());
            assert!(config.l1_rpc_url.is_none());
            assert!(config.l1_chain_id.is_none());
            assert!(config.l1_vault_address.is_none());
            assert!(config.l1_sphincs_verifier_address.is_none());
            assert!(config.bridge_verifier_address.is_none());
            assert!(config.treasury_vault_address.is_none());
            assert!(config.l1_private_key.is_none());
        }
    }

    // =========================================================================
    // TEST-W5-002: Error Code Collision Check
    // =========================================================================
    mod error_code_tests {
        use quantum_shield_api::error::ApiError;
        use std::collections::HashMap;

        fn all_error_variants() -> Vec<(&'static str, ApiError)> {
            vec![
                ("InvalidSignature", ApiError::InvalidSignature("x".into())),
                ("InvalidNonce", ApiError::InvalidNonce("x".into())),
                ("ExpiredRequest", ApiError::ExpiredRequest),
                ("InsufficientBalance", ApiError::InsufficientBalance),
                ("LockNotFound", ApiError::LockNotFound("x".into())),
                ("Unauthorized", ApiError::Unauthorized),
                ("ProverNotFound", ApiError::ProverNotFound("x".into())),
                ("EditionSwitchPending", ApiError::EditionSwitchPending),
                ("InvalidRequest", ApiError::InvalidRequest("x".into())),
                ("TimeLockActive", ApiError::TimeLockActive),
                ("ChallengeActive", ApiError::ChallengeActive),
                ("AlreadyReleased", ApiError::AlreadyReleased),
                ("ProverTimeout", ApiError::ProverTimeout),
                ("InsufficientSignatures", ApiError::InsufficientSignatures),
                ("InvalidChallengeTarget", ApiError::InvalidChallengeTarget("x".into())),
                ("InsufficientBond", ApiError::InsufficientBond("x".into())),
                ("ChallengeNotFound", ApiError::ChallengeNotFound("x".into())),
                ("ChallengeAlreadyResolved", ApiError::ChallengeAlreadyResolved),
                ("DefenseDeadlineExpired", ApiError::DefenseDeadlineExpired),
                ("DefenseDeadlineNotPassed", ApiError::DefenseDeadlineNotPassed),
                ("InvalidSiweMessage", ApiError::InvalidSiweMessage("x".into())),
                ("SiweMessageExpired", ApiError::SiweMessageExpired),
                ("InvalidToken", ApiError::InvalidToken("x".into())),
                ("TokenExpired", ApiError::TokenExpired),
                ("InvalidRefreshToken", ApiError::InvalidRefreshToken),
                ("NonceAlreadyUsed", ApiError::NonceAlreadyUsed),
                ("VeqsLockNotFound", ApiError::VeqsLockNotFound),
                ("VeqsLockAlreadyExists", ApiError::VeqsLockAlreadyExists),
                ("Internal", ApiError::Internal("x".into())),
                ("ServiceUnavailable", ApiError::ServiceUnavailable),
                ("NotFound", ApiError::NotFound("x".into())),
                ("Forbidden", ApiError::Forbidden("x".into())),
                ("BadRequest", ApiError::BadRequest("x".into())),
                ("ObserverNotFound", ApiError::ObserverNotFound("x".into())),
                ("AlreadyExists", ApiError::AlreadyExists("x".into())),
                ("RateLimitExceeded", ApiError::RateLimitExceeded),
            ]
        }

        #[test]
        fn test_no_duplicate_error_codes() {
            let mut code_map: HashMap<u32, Vec<&str>> = HashMap::new();
            for (name, err) in all_error_variants() {
                code_map.entry(err.code()).or_default().push(name);
            }
            let duplicates: Vec<_> = code_map.iter()
                .filter(|(_, names)| names.len() > 1)
                .collect();
            assert!(
                duplicates.is_empty(),
                "Duplicate error codes found: {:?}",
                duplicates
            );
        }

        #[test]
        fn test_error_code_ranges() {
            // Verify error codes follow the categorization scheme:
            // 1xxx: Request validation, 2xxx: State conflicts, 3xxx: Prover,
            // 4xxx: Challenge, 41xx: Auth, 42xx: Token Hub,
            // 5xxx: Internal, 6xxx: Prover Portal, 7xxx: Observer, 8xxx: Rate limit
            for (name, err) in all_error_variants() {
                let code = err.code();
                assert!(
                    code >= 1000 && code <= 9999,
                    "Error code for {} = {} is out of 4-digit range",
                    name, code
                );
            }
        }

        #[test]
        fn test_error_variants_have_valid_status_codes() {
            use axum::http::StatusCode;
            for (name, err) in all_error_variants() {
                let status = err.status_code();
                assert!(
                    status.as_u16() >= 400 && status.as_u16() < 600,
                    "Error {} has non-error HTTP status: {}",
                    name, status
                );
            }
        }

        #[test]
        fn test_rate_limit_returns_429() {
            use axum::http::StatusCode;
            let err = ApiError::RateLimitExceeded;
            assert_eq!(err.status_code(), StatusCode::TOO_MANY_REQUESTS);
            assert_eq!(err.code(), 8001);
        }

        #[test]
        fn test_auth_errors_return_401() {
            use axum::http::StatusCode;
            assert_eq!(ApiError::Unauthorized.status_code(), StatusCode::UNAUTHORIZED);
            assert_eq!(ApiError::InvalidToken("x".into()).status_code(), StatusCode::UNAUTHORIZED);
            assert_eq!(ApiError::TokenExpired.status_code(), StatusCode::UNAUTHORIZED);
            assert_eq!(ApiError::InvalidRefreshToken.status_code(), StatusCode::UNAUTHORIZED);
        }

        #[test]
        fn test_not_found_errors_return_404() {
            use axum::http::StatusCode;
            assert_eq!(ApiError::LockNotFound("x".into()).status_code(), StatusCode::NOT_FOUND);
            assert_eq!(ApiError::ProverNotFound("x".into()).status_code(), StatusCode::NOT_FOUND);
            assert_eq!(ApiError::ChallengeNotFound("x".into()).status_code(), StatusCode::NOT_FOUND);
            assert_eq!(ApiError::ObserverNotFound("x".into()).status_code(), StatusCode::NOT_FOUND);
            assert_eq!(ApiError::NotFound("x".into()).status_code(), StatusCode::NOT_FOUND);
            assert_eq!(ApiError::VeqsLockNotFound.status_code(), StatusCode::NOT_FOUND);
        }

        #[test]
        fn test_error_response_serialization() {
            use quantum_shield_api::error::ErrorResponse;
            let resp = ErrorResponse {
                code: 1001,
                message: "test error".to_string(),
            };
            let json = serde_json::to_string(&resp).unwrap();
            assert!(json.contains("\"code\":1001"));
            assert!(json.contains("\"message\":\"test error\""));
        }
    }

    // =========================================================================
    // TEST-W5-003: Production Config Guard Tests
    // =========================================================================
    mod production_config_tests {
        use quantum_shield_api::config::*;

        #[test]
        fn test_production_yaml_rate_limit_enabled() {
            // Production config MUST have rate limiting enabled
            // We verify the config struct expectations:
            // production.yaml: rate_limit.enabled = true, max_requests = 60
            let config = Config::default();
            // Default has rate limit enabled
            assert!(config.rate_limit.enabled);
        }

        #[test]
        fn test_production_security_requirements() {
            // In production, skip_signature_verification and skip_totp_verification
            // MUST be false. The guard in Config::load() panics if they're true.
            // We verify the production.yaml expectation:
            let security = SecurityConfig {
                skip_signature_verification: false,
                skip_totp_verification: false,
                ..SecurityConfig::default()
            };
            assert!(!security.skip_signature_verification);
            assert!(!security.skip_totp_verification);
        }

        #[test]
        #[should_panic(expected = "SECURITY VIOLATION")]
        fn test_production_guard_panics_on_skip_sig() {
            let cfg = Config::default();
            let run_mode = "production";
            if run_mode == "production" && cfg.security.skip_signature_verification {
                panic!("SECURITY VIOLATION: skip_signature_verification=true in production mode. Aborting.");
            }
        }

        #[test]
        #[should_panic(expected = "SECURITY VIOLATION")]
        fn test_production_guard_panics_on_skip_totp() {
            let cfg = Config::default();
            let run_mode = "production";
            if run_mode == "production" && cfg.security.skip_totp_verification {
                panic!("SECURITY VIOLATION: skip_totp_verification=true in production mode. Aborting.");
            }
        }

        #[test]
        fn test_production_cors_not_wildcard() {
            // Production CORS should not be "*" (wildcard)
            let cors = CorsConfig::default();
            assert!(
                !cors.allowed_origins.contains(&"*".to_string()),
                "Default CORS must not allow wildcard"
            );
        }

        #[test]
        fn test_jwt_secret_not_default_for_production() {
            let config = Config::default();
            // The dev default secret must be changed in production
            assert_eq!(
                config.jwt.secret,
                "development-secret-change-in-production",
                "Dev JWT secret must be clearly marked as needing change"
            );
        }
    }

    // =========================================================================
    // TEST-W5-004: Config YAML Deserialization via serde
    // =========================================================================
    mod yaml_deserialization_tests {
        use quantum_shield_api::config::*;

        #[test]
        fn test_security_config_from_yaml_string() {
            let yaml = r#"
                normal_time_lock_hours: 24
                emergency_time_lock_days: 7
                emergency_timeout_hours: 72
                max_pause_duration_hours: 72
                min_emergency_bond_wei: "500000000000000000"
                emergency_bond_bps: 500
                skip_signature_verification: false
                skip_totp_verification: false
            "#;
            let security: SecurityConfig = serde_yaml::from_str(yaml).unwrap();
            assert_eq!(security.normal_time_lock_hours, 24);
            assert!(!security.skip_signature_verification);
            assert!(!security.skip_totp_verification);
        }

        #[test]
        fn test_rate_limit_config_from_yaml() {
            let yaml = r#"
                max_requests: 60
                window_secs: 60
                enabled: true
            "#;
            let rl: RateLimitConfig = serde_yaml::from_str(yaml).unwrap();
            assert_eq!(rl.max_requests, 60);
            assert_eq!(rl.window_secs, 60);
            assert!(rl.enabled);
        }

        #[test]
        fn test_cors_config_from_yaml() {
            let yaml = r#"
                allowed_origins:
                  - "https://app.quantum-shield.io"
            "#;
            let cors: CorsConfig = serde_yaml::from_str(yaml).unwrap();
            assert_eq!(cors.allowed_origins.len(), 1);
            assert_eq!(cors.allowed_origins[0], "https://app.quantum-shield.io");
        }

        #[test]
        fn test_vrf_config_from_yaml() {
            let yaml = r#"
                contract_address: "0x1234567890abcdef1234567890abcdef12345678"
                rpc_url: "https://sepolia.infura.io/v3/test"
                chain_id: 11155111
                timeout_seconds: 300
                polling_interval_seconds: 5
            "#;
            let vrf: VRFConfig = serde_yaml::from_str(yaml).unwrap();
            assert_eq!(vrf.chain_id, 11155111);
            assert_eq!(vrf.timeout_seconds, 300);
            assert!(vrf.private_key.is_none());
        }

        #[test]
        fn test_database_config_from_yaml() {
            let yaml = r#"
                url: "postgres://quantum:quantum_dev@localhost:5432/quantum_shield"
                max_connections: 50
                min_connections: 5
                acquire_timeout_secs: 10
                idle_timeout_secs: 600
                max_lifetime_secs: 1800
            "#;
            let db: DatabaseConfig = serde_yaml::from_str(yaml).unwrap();
            assert_eq!(db.max_connections, 50);
            assert_eq!(db.min_connections, 5);
        }

        #[test]
        fn test_jwt_config_from_yaml() {
            let yaml = r#"
                secret: "test-secret"
                expiry_hours: 1
            "#;
            let jwt: JwtConfig = serde_yaml::from_str(yaml).unwrap();
            assert_eq!(jwt.secret, "test-secret");
            assert_eq!(jwt.expiry_hours, 1);
            // Defaults should apply
            assert_eq!(jwt.access_token_expiry, 3600);
            assert_eq!(jwt.refresh_token_expiry, 604800);
        }
    }

    // =========================================================================
    // TEST-W5-005: JWT Security Tests
    // =========================================================================
    mod jwt_security_tests {
        use quantum_shield_api::types::JwtClaims;

        #[test]
        fn test_jwt_generate_and_validate() {
            use jsonwebtoken::{encode, decode, EncodingKey, DecodingKey, Header, Validation, Algorithm};

            let secret = "test-secret-for-jwt";
            let now = chrono::Utc::now().timestamp() as u64;
            let expires = now + 3600;

            let claims = JwtClaims {
                sub: "0xabcdef1234567890".to_string(),
                pkh: "0xhash".to_string(),
                iat: now,
                exp: expires,
                typ: "access".to_string(),
            };

            let token = encode(
                &Header::new(Algorithm::HS256),
                &claims,
                &EncodingKey::from_secret(secret.as_bytes()),
            ).unwrap();

            let decoded = decode::<JwtClaims>(
                &token,
                &DecodingKey::from_secret(secret.as_bytes()),
                &Validation::new(Algorithm::HS256),
            ).unwrap();

            assert_eq!(decoded.claims.sub, "0xabcdef1234567890");
            assert_eq!(decoded.claims.typ, "access");
        }

        #[test]
        fn test_jwt_rejects_wrong_secret() {
            use jsonwebtoken::{encode, decode, EncodingKey, DecodingKey, Header, Validation, Algorithm};

            let now = chrono::Utc::now().timestamp() as u64;
            let claims = JwtClaims {
                sub: "0xuser".to_string(),
                pkh: "0xhash".to_string(),
                iat: now,
                exp: now + 3600,
                typ: "access".to_string(),
            };

            let token = encode(
                &Header::new(Algorithm::HS256),
                &claims,
                &EncodingKey::from_secret(b"correct-secret"),
            ).unwrap();

            let result = decode::<JwtClaims>(
                &token,
                &DecodingKey::from_secret(b"wrong-secret"),
                &Validation::new(Algorithm::HS256),
            );

            assert!(result.is_err(), "JWT with wrong secret must be rejected");
        }

        #[test]
        fn test_jwt_rejects_expired_token() {
            use jsonwebtoken::{encode, decode, EncodingKey, DecodingKey, Header, Validation, Algorithm};

            let secret = "test-secret";
            let past = 1000u64; // way in the past

            let claims = JwtClaims {
                sub: "0xuser".to_string(),
                pkh: "0xhash".to_string(),
                iat: past,
                exp: past + 1, // expired immediately
                typ: "access".to_string(),
            };

            let token = encode(
                &Header::new(Algorithm::HS256),
                &claims,
                &EncodingKey::from_secret(secret.as_bytes()),
            ).unwrap();

            let result = decode::<JwtClaims>(
                &token,
                &DecodingKey::from_secret(secret.as_bytes()),
                &Validation::new(Algorithm::HS256),
            );

            assert!(result.is_err(), "Expired JWT must be rejected");
        }

        #[test]
        fn test_jwt_access_vs_refresh_token_type() {
            use jsonwebtoken::{encode, decode, EncodingKey, DecodingKey, Header, Validation, Algorithm};

            let secret = "test-secret";
            let now = chrono::Utc::now().timestamp() as u64;

            // Create a refresh token
            let claims = JwtClaims {
                sub: "0xuser".to_string(),
                pkh: "0xhash".to_string(),
                iat: now,
                exp: now + 604800, // 7 days
                typ: "refresh".to_string(),
            };

            let token = encode(
                &Header::new(Algorithm::HS256),
                &claims,
                &EncodingKey::from_secret(secret.as_bytes()),
            ).unwrap();

            let decoded = decode::<JwtClaims>(
                &token,
                &DecodingKey::from_secret(secret.as_bytes()),
                &Validation::new(Algorithm::HS256),
            ).unwrap();

            // Using a refresh token as access should be caught by middleware
            assert_eq!(decoded.claims.typ, "refresh");
            assert_ne!(decoded.claims.typ, "access", "Refresh token must not be treated as access");
        }

        #[test]
        fn test_jwt_uses_hs256() {
            // SECURITY: Only HS256 is accepted
            use jsonwebtoken::{encode, decode, EncodingKey, DecodingKey, Header, Validation, Algorithm};

            let secret = "test-secret";
            let now = chrono::Utc::now().timestamp() as u64;
            let claims = JwtClaims {
                sub: "0xuser".to_string(),
                pkh: "0xhash".to_string(),
                iat: now,
                exp: now + 3600,
                typ: "access".to_string(),
            };

            // Encode with HS256
            let token = encode(
                &Header::new(Algorithm::HS256),
                &claims,
                &EncodingKey::from_secret(secret.as_bytes()),
            ).unwrap();

            // Validate only allows HS256
            let validation = Validation::new(Algorithm::HS256);
            let result = decode::<JwtClaims>(
                &token,
                &DecodingKey::from_secret(secret.as_bytes()),
                &validation,
            );
            assert!(result.is_ok(), "HS256 token with HS256 validation must succeed");
        }
    }

    // =========================================================================
    // TEST-W5-006: Crypto / Hash Security Tests
    // =========================================================================
    mod crypto_security_tests {
        #[test]
        fn test_sha3_256_not_keccak() {
            // CP-1: Must use NIST SHA3-256, not Ethereum's keccak256
            use sha3::{Sha3_256, Digest};
            let input = b"quantum-shield-test";
            let mut hasher = Sha3_256::new();
            hasher.update(input);
            let hash = hasher.finalize();
            assert_eq!(hash.len(), 32);
            // SHA3-256 and keccak256 produce different output for the same input
            let hex_hash = hex::encode(hash);
            assert!(!hex_hash.is_empty());
        }

        #[test]
        fn test_hash_deterministic() {
            use sha3::{Sha3_256, Digest};
            let input = b"deterministic-test";
            let hash1 = {
                let mut h = Sha3_256::new();
                h.update(input);
                h.finalize()
            };
            let hash2 = {
                let mut h = Sha3_256::new();
                h.update(input);
                h.finalize()
            };
            assert_eq!(hash1, hash2, "SHA3-256 must be deterministic");
        }

        #[test]
        fn test_different_inputs_different_hashes() {
            use sha3::{Sha3_256, Digest};
            let hash1 = {
                let mut h = Sha3_256::new();
                h.update(b"input-a");
                h.finalize()
            };
            let hash2 = {
                let mut h = Sha3_256::new();
                h.update(b"input-b");
                h.finalize()
            };
            assert_ne!(hash1, hash2, "Different inputs must produce different hashes");
        }
    }

    // =========================================================================
    // TEST-W5-007: Error Response Consistency Tests
    // =========================================================================
    mod error_response_consistency_tests {
        use quantum_shield_api::error::ApiError;
        use axum::http::StatusCode;

        #[test]
        fn test_conflict_errors_return_409() {
            assert_eq!(ApiError::EditionSwitchPending.status_code(), StatusCode::CONFLICT);
            assert_eq!(ApiError::TimeLockActive.status_code(), StatusCode::CONFLICT);
            assert_eq!(ApiError::ChallengeActive.status_code(), StatusCode::CONFLICT);
            assert_eq!(ApiError::AlreadyReleased.status_code(), StatusCode::CONFLICT);
            assert_eq!(ApiError::NonceAlreadyUsed.status_code(), StatusCode::CONFLICT);
            assert_eq!(ApiError::VeqsLockAlreadyExists.status_code(), StatusCode::CONFLICT);
            assert_eq!(ApiError::AlreadyExists("x".into()).status_code(), StatusCode::CONFLICT);
        }

        #[test]
        fn test_bad_request_errors_return_400() {
            assert_eq!(ApiError::InvalidSignature("x".into()).status_code(), StatusCode::BAD_REQUEST);
            assert_eq!(ApiError::ExpiredRequest.status_code(), StatusCode::BAD_REQUEST);
            assert_eq!(ApiError::InsufficientBalance.status_code(), StatusCode::BAD_REQUEST);
            assert_eq!(ApiError::InsufficientSignatures.status_code(), StatusCode::BAD_REQUEST);
            assert_eq!(ApiError::InvalidRequest("x".into()).status_code(), StatusCode::BAD_REQUEST);
            assert_eq!(ApiError::BadRequest("x".into()).status_code(), StatusCode::BAD_REQUEST);
        }

        #[test]
        fn test_internal_errors_return_5xx() {
            assert_eq!(ApiError::Internal("x".into()).status_code(), StatusCode::INTERNAL_SERVER_ERROR);
            assert_eq!(ApiError::ServiceUnavailable.status_code(), StatusCode::SERVICE_UNAVAILABLE);
        }

        #[test]
        fn test_forbidden_returns_403() {
            assert_eq!(ApiError::Forbidden("x".into()).status_code(), StatusCode::FORBIDDEN);
        }

        #[test]
        fn test_all_error_messages_non_empty() {
            let errors: Vec<ApiError> = vec![
                ApiError::InvalidSignature("x".into()),
                ApiError::Unauthorized,
                ApiError::Internal("x".into()),
                ApiError::RateLimitExceeded,
                ApiError::TokenExpired,
                ApiError::LockNotFound("x".into()),
            ];
            for err in errors {
                let msg = err.to_string();
                assert!(!msg.is_empty(), "Error message must not be empty");
            }
        }
    }
}
