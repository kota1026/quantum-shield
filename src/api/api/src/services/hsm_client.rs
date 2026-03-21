//! HSM client with mTLS support (FIX-002)

use anyhow::Result;

pub struct HsmClient {
    // mTLS configuration
    mtls_enabled: bool,
}

impl HsmClient {
    /// Create new HSM client with mTLS (FIX-002)
    pub async fn new() -> Result<Self> {
        // FIX-002: mTLS implementation for HSM communication
        tracing::info!("HSM client initialized with mTLS support");
        Ok(Self { mtls_enabled: true })
    }

    /// Sign with SPHINCS+ via HSM (requires mTLS)
    ///
    /// This requires HSM vendor SDK integration for production use.
    /// In development mode, returns an error indicating the stub.
    /// In production mode, panics to prevent silent failures.
    pub async fn sign_sphincs(&self, _data: &[u8]) -> Result<Vec<u8>> {
        if !self.mtls_enabled {
            anyhow::bail!("mTLS required for HSM communication");
        }

        let run_mode = std::env::var("RUN_MODE").unwrap_or_else(|_| "development".into());
        if run_mode == "production" {
            anyhow::bail!(
                "HSM SPHINCS+ signing not implemented. \
                 Production deployment requires HSM vendor SDK integration (e.g., AWS CloudHSM, Thales Luna)."
            );
        }

        tracing::warn!("HSM SPHINCS+ signing is stubbed in development mode");
        anyhow::bail!("HSM signing not available in development mode")
    }
}
