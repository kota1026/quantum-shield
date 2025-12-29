//! Transport layer for L3 network (TCP + TLS 1.3)

use crate::{NetworkError, Result};
use std::net::SocketAddr;
use tokio::net::{TcpListener, TcpStream};
use tracing::{debug, info};

/// TCP Transport for P2P communication
pub struct Transport {
    /// Local bind address
    bind_addr: SocketAddr,
    /// TLS enabled
    tls_enabled: bool,
}

impl Transport {
    /// Create a new transport
    pub fn new(bind_addr: SocketAddr, tls_enabled: bool) -> Self {
        Self {
            bind_addr,
            tls_enabled,
        }
    }

    /// Start listening for connections
    pub async fn listen(&self) -> Result<TcpListener> {
        let listener = TcpListener::bind(self.bind_addr).await?;
        info!("Transport listening on {}", self.bind_addr);
        Ok(listener)
    }

    /// Connect to a peer
    pub async fn connect(&self, peer_addr: SocketAddr) -> Result<TcpStream> {
        debug!("Connecting to peer at {}", peer_addr);
        let stream = TcpStream::connect(peer_addr).await?;
        
        // TODO: Implement TLS 1.3 handshake with mTLS
        // For now, returning plain TCP connection
        if self.tls_enabled {
            debug!("TLS handshake would happen here");
        }
        
        Ok(stream)
    }

    /// Accept an incoming connection
    pub async fn accept(listener: &TcpListener) -> Result<(TcpStream, SocketAddr)> {
        let (stream, addr) = listener.accept().await?;
        debug!("Accepted connection from {}", addr);
        Ok((stream, addr))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_transport_creation() {
        let addr: SocketAddr = "127.0.0.1:0".parse().unwrap();
        let transport = Transport::new(addr, false);
        assert!(!transport.tls_enabled);
    }
}
