//! Node status command.

use clap::Args;

/// Query node status
#[derive(Args, Debug)]
pub struct StatusArgs {
    /// Node RPC endpoint
    #[arg(short, long, default_value = "http://127.0.0.1:8545")]
    pub endpoint: String,

    /// Output as JSON
    #[arg(long)]
    pub json: bool,
}

pub fn run(args: StatusArgs) -> anyhow::Result<()> {
    println!("📊 Querying node status...");
    println!("   Endpoint: {}", args.endpoint);

    // TODO: Implement actual RPC call
    // For now, placeholder implementation
    
    if args.json {
        println!(r#"{{"status": "placeholder", "endpoint": "{}"}}"#, args.endpoint);
    } else {
        println!("⚠️  Node status query not yet implemented (placeholder)");
        println!("   Would query: {}", args.endpoint);
        println!();
        println!("Expected output:");
        println!("   Node ID:     <node_id>");
        println!("   State:       Running");
        println!("   Block:       12345");
        println!("   Peers:       3/4");
        println!("   Consensus:   PBFT (view 0)");
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_status_args_default() {
        let args = StatusArgs {
            endpoint: "http://127.0.0.1:8545".to_string(),
            json: false,
        };
        assert!(!args.json);
        assert!(args.endpoint.contains("8545"));
    }
}
