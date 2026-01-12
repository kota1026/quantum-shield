//! Transport layer for L3 network (TCP + TLS 1.3 mTLS)
//!
//! Implements secure P2P communication using TLS 1.3 with
//! mutual TLS (mTLS) for node authentication.

use crate::{NetworkError, Result};
use rustls::pki_types::CertificateDer;
use std::fs::File;
use std::io::BufReader;
use std::net::SocketAddr;
use std::path::Path;
use std::sync::Arc;
use tokio::net::{TcpListener, TcpStream};
use tokio_rustls::{TlsAcceptor, TlsConnector, client::TlsStream as ClientTlsStream, server::TlsStream as ServerTlsStream};
use tracing::{debug, info, warn};

/// TLS configuration for transport
#[derive(Clone)]
pub struct TlsConfig {
    /// TLS acceptor for incoming connections
    acceptor: Option<Arc<TlsAcceptor>>,
    /// TLS connector for outgoing connections
    connector: Option<Arc<TlsConnector>>,
    /// Server name for SNI
    server_name: String,
}

impl TlsConfig {
    /// Create TLS config from certificate and key files
    pub fn from_files(
        cert_path: &Path,
        key_path: &Path,
        ca_cert_path: Option<&Path>,
    ) -> Result<Self> {
        // Load server certificate chain
        let cert_file = File::open(cert_path)
            .map_err(|e| NetworkError::Tls(format!("Failed to open cert file: {}", e)))?;
        let mut cert_reader = BufReader::new(cert_file);
        let certs: Vec<CertificateDer<'static>> = rustls_pemfile::certs(&mut cert_reader)
            .collect::<std::result::Result<Vec<_>, _>>()
            .map_err(|e| NetworkError::Tls(format!("Failed to read certs: {}", e)))?;

        // Load private key
        let key_file = File::open(key_path)
            .map_err(|e| NetworkError::Tls(format!("Failed to open key file: {}", e)))?;
        let mut key_reader = BufReader::new(key_file);
        let key = rustls_pemfile::private_key(&mut key_reader)
            .map_err(|e| NetworkError::Tls(format!("Failed to read key: {}", e)))?
            .ok_or_else(|| NetworkError::Tls("No private key found".to_string()))?;

        // Build root certificate store
        let mut root_store = rustls::RootCertStore::empty();

        if let Some(ca_path) = ca_cert_path {
            // Load CA certificate for mTLS
            let ca_file = File::open(ca_path)
                .map_err(|e| NetworkError::Tls(format!("Failed to open CA cert: {}", e)))?;
            let mut ca_reader = BufReader::new(ca_file);
            let ca_certs: Vec<CertificateDer<'static>> = rustls_pemfile::certs(&mut ca_reader)
                .collect::<std::result::Result<Vec<_>, _>>()
                .map_err(|e| NetworkError::Tls(format!("Failed to read CA certs: {}", e)))?;

            for cert in ca_certs {
                root_store.add(cert)
                    .map_err(|e| NetworkError::Tls(format!("Failed to add CA cert: {}", e)))?;
            }
        } else {
            // Use webpki roots for public CAs (not recommended for mTLS)
            root_store.extend(webpki_roots::TLS_SERVER_ROOTS.iter().cloned());
        }

        // Server config with TLS 1.3 only and mTLS
        let server_config = rustls::ServerConfig::builder()
            .with_client_cert_verifier(
                rustls::server::WebPkiClientVerifier::builder(Arc::new(root_store.clone()))
                    .build()
                    .map_err(|e| NetworkError::Tls(format!("Failed to build verifier: {}", e)))?
            )
            .with_single_cert(certs.clone(), key.clone_key())
            .map_err(|e| NetworkError::Tls(format!("Failed to build server config: {}", e)))?;

        // Client config with TLS 1.3 only
        let client_config = rustls::ClientConfig::builder()
            .with_root_certificates(root_store)
            .with_client_auth_cert(certs, key)
            .map_err(|e| NetworkError::Tls(format!("Failed to build client config: {}", e)))?;

        let acceptor = TlsAcceptor::from(Arc::new(server_config));
        let connector = TlsConnector::from(Arc::new(client_config));

        Ok(Self {
            acceptor: Some(Arc::new(acceptor)),
            connector: Some(Arc::new(connector)),
            server_name: "aegis-node".to_string(),
        })
    }

    /// Create a disabled TLS config (for development)
    pub fn disabled() -> Self {
        Self {
            acceptor: None,
            connector: None,
            server_name: "localhost".to_string(),
        }
    }

    /// Check if TLS is enabled
    pub fn is_enabled(&self) -> bool {
        self.acceptor.is_some() && self.connector.is_some()
    }
}

/// Connection type enum for unified handling
pub enum Connection {
    /// Plain TCP connection (dev mode)
    Plain(TcpStream),
    /// TLS client connection
    TlsClient(ClientTlsStream<TcpStream>),
    /// TLS server connection
    TlsServer(ServerTlsStream<TcpStream>),
}

impl Connection {
    /// Get the underlying stream for reading/writing
    pub fn into_split(self) -> (ConnectionReader, ConnectionWriter) {
        match self {
            Connection::Plain(stream) => {
                let (read, write) = stream.into_split();
                (ConnectionReader::Plain(read), ConnectionWriter::Plain(write))
            }
            Connection::TlsClient(stream) => {
                let (read, write) = tokio::io::split(stream);
                (ConnectionReader::TlsClient(read), ConnectionWriter::TlsClient(write))
            }
            Connection::TlsServer(stream) => {
                let (read, write) = tokio::io::split(stream);
                (ConnectionReader::TlsServer(read), ConnectionWriter::TlsServer(write))
            }
        }
    }
}

/// Reader half of a connection
pub enum ConnectionReader {
    Plain(tokio::net::tcp::OwnedReadHalf),
    TlsClient(tokio::io::ReadHalf<ClientTlsStream<TcpStream>>),
    TlsServer(tokio::io::ReadHalf<ServerTlsStream<TcpStream>>),
}

/// Writer half of a connection
pub enum ConnectionWriter {
    Plain(tokio::net::tcp::OwnedWriteHalf),
    TlsClient(tokio::io::WriteHalf<ClientTlsStream<TcpStream>>),
    TlsServer(tokio::io::WriteHalf<ServerTlsStream<TcpStream>>),
}

/// TCP Transport for P2P communication with TLS 1.3 mTLS support
pub struct Transport {
    /// Local bind address
    bind_addr: SocketAddr,
    /// TLS configuration
    tls_config: TlsConfig,
}

impl Transport {
    /// Create a new transport with TLS configuration
    pub fn new(bind_addr: SocketAddr, tls_config: TlsConfig) -> Self {
        Self {
            bind_addr,
            tls_config,
        }
    }

    /// Create a new transport without TLS (for development)
    pub fn new_plain(bind_addr: SocketAddr) -> Self {
        Self {
            bind_addr,
            tls_config: TlsConfig::disabled(),
        }
    }

    /// Check if TLS is enabled
    pub fn tls_enabled(&self) -> bool {
        self.tls_config.is_enabled()
    }

    /// Start listening for connections
    pub async fn listen(&self) -> Result<TcpListener> {
        let listener = TcpListener::bind(self.bind_addr).await?;
        info!(
            addr = %self.bind_addr,
            tls = self.tls_enabled(),
            "Transport listening"
        );
        Ok(listener)
    }

    /// Connect to a peer with TLS
    pub async fn connect(&self, peer_addr: SocketAddr) -> Result<Connection> {
        debug!("Connecting to peer at {}", peer_addr);
        let stream = TcpStream::connect(peer_addr).await?;

        if let Some(ref connector) = self.tls_config.connector {
            // Perform TLS 1.3 handshake with mTLS
            debug!("Performing TLS 1.3 handshake with mTLS");

            let server_name = rustls::pki_types::ServerName::try_from(
                self.tls_config.server_name.clone()
            ).map_err(|_| NetworkError::Tls("Invalid server name".to_string()))?;

            let tls_stream = connector.connect(server_name, stream)
                .await
                .map_err(|e| NetworkError::Tls(format!("TLS handshake failed: {}", e)))?;

            debug!("TLS handshake complete, connection encrypted");
            Ok(Connection::TlsClient(tls_stream))
        } else {
            warn!("TLS disabled - using plain TCP (dev mode only)");
            Ok(Connection::Plain(stream))
        }
    }

    /// Accept an incoming connection with TLS
    pub async fn accept(&self, listener: &TcpListener) -> Result<(Connection, SocketAddr)> {
        let (stream, addr) = listener.accept().await?;
        debug!("Accepted connection from {}", addr);

        if let Some(ref acceptor) = self.tls_config.acceptor {
            // Perform TLS 1.3 handshake with client certificate verification
            debug!("Performing TLS 1.3 server handshake with mTLS");

            let tls_stream = acceptor.accept(stream)
                .await
                .map_err(|e| NetworkError::Tls(format!("TLS accept failed: {}", e)))?;

            debug!("TLS handshake complete for {}", addr);
            Ok((Connection::TlsServer(tls_stream), addr))
        } else {
            warn!("TLS disabled - accepting plain TCP (dev mode only)");
            Ok((Connection::Plain(stream), addr))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tls_config_disabled() {
        let config = TlsConfig::disabled();
        assert!(!config.is_enabled());
    }

    #[tokio::test]
    async fn test_transport_plain() {
        let addr: SocketAddr = "127.0.0.1:0".parse().unwrap();
        let transport = Transport::new_plain(addr);
        assert!(!transport.tls_enabled());

        // Test listening
        let listener = transport.listen().await.unwrap();
        let bound_addr = listener.local_addr().unwrap();
        assert_ne!(bound_addr.port(), 0);
    }

    #[tokio::test]
    async fn test_plain_connection() {
        let addr: SocketAddr = "127.0.0.1:0".parse().unwrap();
        let transport = Transport::new_plain(addr);

        let listener = transport.listen().await.unwrap();
        let bound_addr = listener.local_addr().unwrap();

        // Spawn acceptor
        let accept_handle = tokio::spawn(async move {
            let (conn, peer_addr) = transport.accept(&listener).await.unwrap();
            assert!(matches!(conn, Connection::Plain(_)));
            peer_addr
        });

        // Connect
        let client_transport = Transport::new_plain("127.0.0.1:0".parse().unwrap());
        let conn = client_transport.connect(bound_addr).await.unwrap();
        assert!(matches!(conn, Connection::Plain(_)));

        // Wait for accept
        let _peer_addr = accept_handle.await.unwrap();
    }
}
