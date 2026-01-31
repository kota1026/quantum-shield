//! # aegis-cli
//!
//! Command-line tools for L3 Aegis node operations.
//!
//! ## Commands
//!
//! - `keygen`: Generate Dilithium-III key pair
//! - `status`: Query node status
//! - `hash`: Compute SHA3-256 hash
//!
//! ## CP-1 Compliance
//!
//! All cryptographic operations use:
//! - SHA3-256 (FIPS 202) for hashing
//! - Dilithium-III (FIPS 204) for signatures

mod commands;

use clap::{Parser, Subcommand};
use commands::{keygen, status, hash};

/// L3 Aegis CLI Tools
#[derive(Parser, Debug)]
#[command(name = "aegis-cli")]
#[command(version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// Generate a new Dilithium-III key pair
    Keygen(keygen::KeygenArgs),
    
    /// Query node status
    Status(status::StatusArgs),
    
    /// Compute SHA3-256 hash
    Hash(hash::HashArgs),
}

fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Keygen(args) => keygen::run(args),
        Commands::Status(args) => status::run(args),
        Commands::Hash(args) => hash::run(args),
    }
}
