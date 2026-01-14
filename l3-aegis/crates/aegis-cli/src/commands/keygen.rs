//! Key generation command (Dilithium-III).
//!
//! CP-1 Compliance: Uses Dilithium-III (FIPS 204) for signatures.
//!
//! Reference: L3_CHAIN_SPECIFICATION.md
//! - Public Key: 1952 bytes
//! - Secret Key: 4032 bytes
//! - Signature: 3309 bytes

use std::fs;
use std::path::PathBuf;
use clap::Args;
use pqcrypto_dilithium::dilithium3;
use pqcrypto_traits::sign::{PublicKey, SecretKey};

/// Dilithium-III parameter sizes (FIPS 204 Level 3)
pub mod params {
    pub const PUBLIC_KEY_SIZE: usize = 1952;
    pub const SECRET_KEY_SIZE: usize = 4032;
    pub const SIGNATURE_SIZE: usize = 3309;
}

/// Generate a new Dilithium-III key pair
#[derive(Args, Debug)]
pub struct KeygenArgs {
    /// Output directory for key files
    #[arg(short, long, default_value = ".")]
    pub output: PathBuf,

    /// Key file prefix (e.g., "validator" or "node0")
    #[arg(short, long, default_value = "dilithium")]
    pub prefix: String,

    /// Node ID (optional, for multi-node setup)
    #[arg(long)]
    pub node_id: Option<u8>,

    /// Overwrite existing files
    #[arg(long)]
    pub force: bool,

    /// Output format: 'binary' (default) or 'hex'
    #[arg(long, default_value = "binary")]
    pub format: String,
}

pub fn run(args: KeygenArgs) -> anyhow::Result<()> {
    print_banner();

    // Validate node_id if provided
    if let Some(id) = args.node_id {
        if id > 3 {
            anyhow::bail!("node_id must be 0-3 (4-node testnet configuration)");
        }
    }

    // Create output directory
    fs::create_dir_all(&args.output)?;

    let pk_path = args.output.join(format!("{}.pub", args.prefix));
    let sk_path = args.output.join(format!("{}.key", args.prefix));

    // Check for existing files
    if !args.force {
        if pk_path.exists() {
            anyhow::bail!("Public key file already exists: {}. Use --force to overwrite.", pk_path.display());
        }
        if sk_path.exists() {
            anyhow::bail!("Secret key file already exists: {}. Use --force to overwrite.", sk_path.display());
        }
    }

    println!("🔐 Generating Dilithium-III key pair...");
    println!("   Algorithm: Dilithium-III (FIPS 204 Level 3)");
    println!("   Output: {}", args.output.display());
    if let Some(id) = args.node_id {
        println!("   Node ID: {}", id);
    }
    println!();

    // Generate keypair
    let (pk, sk) = dilithium3::keypair();

    // Verify sizes
    assert_eq!(pk.as_bytes().len(), params::PUBLIC_KEY_SIZE, "Unexpected public key size");
    assert_eq!(sk.as_bytes().len(), params::SECRET_KEY_SIZE, "Unexpected secret key size");

    // Write keys
    match args.format.as_str() {
        "binary" => {
            fs::write(&pk_path, pk.as_bytes())?;
            fs::write(&sk_path, sk.as_bytes())?;
        }
        "hex" => {
            fs::write(&pk_path, hex::encode(pk.as_bytes()))?;
            fs::write(&sk_path, hex::encode(sk.as_bytes()))?;
        }
        _ => anyhow::bail!("Invalid format: {}. Use 'binary' or 'hex'", args.format),
    }

    println!("✅ Key generation complete!");
    println!();
    println!("   Public key:  {} ({} bytes)", pk_path.display(), pk.as_bytes().len());
    println!("   Secret key:  {} ({} bytes)", sk_path.display(), sk.as_bytes().len());
    println!();
    println!("Key parameters (Dilithium-III / FIPS 204 Level 3):");
    println!("   Public key size:  {} bytes", params::PUBLIC_KEY_SIZE);
    println!("   Secret key size:  {} bytes", params::SECRET_KEY_SIZE);
    println!("   Signature size:   {} bytes", params::SIGNATURE_SIZE);
    println!("   Security level:   NIST Level 3 (~128-bit quantum)");
    println!();
    print_warning();

    Ok(())
}

fn print_banner() {
    println!();
    println!("╔══════════════════════════════════════════════════════════════════╗");
    println!("║     L3-Aegis Dilithium-III Key Generator                         ║");
    println!("║     FIPS 204 Level 3 - CP-1 Compliant                            ║");
    println!("╚══════════════════════════════════════════════════════════════════╝");
    println!();
}

fn print_warning() {
    println!("╔══════════════════════════════════════════════════════════════════╗");
    println!("║  ⚠️   DEVELOPMENT USE ONLY - NOT FOR PRODUCTION  ⚠️               ║");
    println!("╚══════════════════════════════════════════════════════════════════╝");
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_keygen_args_default() {
        let args = KeygenArgs {
            output: PathBuf::from("."),
            prefix: "dilithium".to_string(),
            node_id: None,
            force: false,
            format: "binary".to_string(),
        };
        assert_eq!(args.prefix, "dilithium");
        assert!(!args.force);
    }

    #[test]
    fn test_keygen_creates_files() {
        let tmp = tempdir().unwrap();
        let args = KeygenArgs {
            output: tmp.path().to_path_buf(),
            prefix: "test".to_string(),
            node_id: Some(0),
            force: false,
            format: "binary".to_string(),
        };

        run(args).unwrap();

        let pk_path = tmp.path().join("test.pub");
        let sk_path = tmp.path().join("test.key");

        assert!(pk_path.exists());
        assert!(sk_path.exists());

        let pk_data = fs::read(&pk_path).unwrap();
        let sk_data = fs::read(&sk_path).unwrap();

        assert_eq!(pk_data.len(), params::PUBLIC_KEY_SIZE);
        assert_eq!(sk_data.len(), params::SECRET_KEY_SIZE);
    }

    #[test]
    fn test_keygen_hex_format() {
        let tmp = tempdir().unwrap();
        let args = KeygenArgs {
            output: tmp.path().to_path_buf(),
            prefix: "hex_test".to_string(),
            node_id: None,
            force: false,
            format: "hex".to_string(),
        };

        run(args).unwrap();

        let pk_path = tmp.path().join("hex_test.pub");
        let pk_hex = fs::read_to_string(&pk_path).unwrap();
        
        // Hex encoded public key should be 2x the binary size
        assert_eq!(pk_hex.len(), params::PUBLIC_KEY_SIZE * 2);
    }

    #[test]
    fn test_keygen_refuses_overwrite() {
        let tmp = tempdir().unwrap();
        let pk_path = tmp.path().join("existing.pub");
        fs::write(&pk_path, b"existing").unwrap();

        let args = KeygenArgs {
            output: tmp.path().to_path_buf(),
            prefix: "existing".to_string(),
            node_id: None,
            force: false,
            format: "binary".to_string(),
        };

        let result = run(args);
        assert!(result.is_err());
    }

    #[test]
    fn test_keygen_force_overwrite() {
        let tmp = tempdir().unwrap();
        let pk_path = tmp.path().join("overwrite.pub");
        fs::write(&pk_path, b"old data").unwrap();

        let args = KeygenArgs {
            output: tmp.path().to_path_buf(),
            prefix: "overwrite".to_string(),
            node_id: None,
            force: true,
            format: "binary".to_string(),
        };

        let result = run(args);
        assert!(result.is_ok());

        let new_data = fs::read(&pk_path).unwrap();
        assert_eq!(new_data.len(), params::PUBLIC_KEY_SIZE);
    }

    #[test]
    fn test_invalid_node_id() {
        let tmp = tempdir().unwrap();
        let args = KeygenArgs {
            output: tmp.path().to_path_buf(),
            prefix: "invalid".to_string(),
            node_id: Some(5), // Invalid: must be 0-3
            force: false,
            format: "binary".to_string(),
        };

        let result = run(args);
        assert!(result.is_err());
    }
}
