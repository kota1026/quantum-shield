//! Hash computation command (SHA3-256).
//!
//! CP-1 Compliance: Uses SHA3-256 (FIPS 202) exclusively.

use std::io::{self, Read};
use clap::Args;
use sha3::{Sha3_256, Digest};

/// Compute SHA3-256 hash
#[derive(Args, Debug)]
pub struct HashArgs {
    /// Input string to hash (if not provided, reads from stdin)
    #[arg(short, long)]
    pub input: Option<String>,

    /// Input is hex-encoded
    #[arg(long)]
    pub hex_input: bool,

    /// Input file to hash
    #[arg(short, long)]
    pub file: Option<String>,
}

pub fn run(args: HashArgs) -> anyhow::Result<()> {
    let data = get_input_data(&args)?;
    
    let mut hasher = Sha3_256::new();
    hasher.update(&data);
    let result = hasher.finalize();
    
    println!("{}", hex::encode(result));
    
    Ok(())
}

fn get_input_data(args: &HashArgs) -> anyhow::Result<Vec<u8>> {
    if let Some(ref file_path) = args.file {
        // Read from file
        let data = std::fs::read(file_path)?;
        Ok(data)
    } else if let Some(ref input) = args.input {
        // Use command line input
        if args.hex_input {
            let data = hex::decode(input)?;
            Ok(data)
        } else {
            Ok(input.as_bytes().to_vec())
        }
    } else {
        // Read from stdin
        let mut buffer = Vec::new();
        io::stdin().read_to_end(&mut buffer)?;
        Ok(buffer)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sha3_256_known_vector() {
        // Empty string hash
        let mut hasher = Sha3_256::new();
        hasher.update(b"");
        let result = hasher.finalize();
        
        // Known SHA3-256 hash of empty string
        let expected = "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a";
        assert_eq!(hex::encode(result), expected);
    }

    #[test]
    fn test_sha3_256_hello() {
        let mut hasher = Sha3_256::new();
        hasher.update(b"hello");
        let result = hasher.finalize();
        
        // Known SHA3-256 hash of "hello"
        let expected = "3338be694f50c5f338814986cdf0686453a888b84f424d792af4b9202398f392";
        assert_eq!(hex::encode(result), expected);
    }
}
