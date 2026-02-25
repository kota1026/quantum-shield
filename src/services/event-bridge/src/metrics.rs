//! Prometheus Metrics for Event Bridge

use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::OnceLock;

static EVENTS_CHECKED: AtomicU64 = AtomicU64::new(0);
static EVENTS_PROCESSED: AtomicU64 = AtomicU64::new(0);
static DUPLICATE_EVENTS: AtomicU64 = AtomicU64::new(0);
static RELAY_ERRORS: AtomicU64 = AtomicU64::new(0);
static RELAYS_SUCCESSFUL: AtomicU64 = AtomicU64::new(0);
static LAST_PROCESSED_BLOCK: AtomicU64 = AtomicU64::new(0);
static HEARTBEAT_COUNT: AtomicU64 = AtomicU64::new(0);

static RELAYER_ROLE: OnceLock<std::sync::RwLock<String>> = OnceLock::new();

pub fn increment_events_checked() {
    EVENTS_CHECKED.fetch_add(1, Ordering::Relaxed);
}

pub fn increment_events_processed(event_type: &str) {
    EVENTS_PROCESSED.fetch_add(1, Ordering::Relaxed);
    tracing::debug!("Processed {} event (total: {})", 
        event_type, EVENTS_PROCESSED.load(Ordering::Relaxed));
}

pub fn increment_duplicate_events() {
    DUPLICATE_EVENTS.fetch_add(1, Ordering::Relaxed);
}

pub fn increment_relay_errors() {
    RELAY_ERRORS.fetch_add(1, Ordering::Relaxed);
}

pub fn increment_relays_successful() {
    RELAYS_SUCCESSFUL.fetch_add(1, Ordering::Relaxed);
}

pub fn set_last_processed_block(block: u64) {
    LAST_PROCESSED_BLOCK.store(block, Ordering::Relaxed);
}

pub fn record_heartbeat() {
    HEARTBEAT_COUNT.fetch_add(1, Ordering::Relaxed);
}

pub fn set_relayer_role(role: &str) {
    let lock = RELAYER_ROLE.get_or_init(|| std::sync::RwLock::new(String::new()));
    *lock.write().unwrap() = role.to_string();
}

pub fn get_metrics() -> String {
    format!(
        r#"# HELP event_bridge_events_checked Total events checked
# TYPE event_bridge_events_checked counter
event_bridge_events_checked {}

# HELP event_bridge_events_processed Total events processed
# TYPE event_bridge_events_processed counter
event_bridge_events_processed {}

# HELP event_bridge_duplicate_events Duplicate events skipped
# TYPE event_bridge_duplicate_events counter
event_bridge_duplicate_events {}

# HELP event_bridge_relay_errors Relay errors
# TYPE event_bridge_relay_errors counter
event_bridge_relay_errors {}

# HELP event_bridge_relays_successful Successful relays
# TYPE event_bridge_relays_successful counter
event_bridge_relays_successful {}

# HELP event_bridge_last_processed_block Last processed L1 block
# TYPE event_bridge_last_processed_block gauge
event_bridge_last_processed_block {}

# HELP event_bridge_heartbeat_count Heartbeat count
# TYPE event_bridge_heartbeat_count counter
event_bridge_heartbeat_count {}
"#,
        EVENTS_CHECKED.load(Ordering::Relaxed),
        EVENTS_PROCESSED.load(Ordering::Relaxed),
        DUPLICATE_EVENTS.load(Ordering::Relaxed),
        RELAY_ERRORS.load(Ordering::Relaxed),
        RELAYS_SUCCESSFUL.load(Ordering::Relaxed),
        LAST_PROCESSED_BLOCK.load(Ordering::Relaxed),
        HEARTBEAT_COUNT.load(Ordering::Relaxed),
    )
}

/// Start metrics HTTP server
pub async fn start_metrics_server(port: u16) -> crate::Result<()> {
    use tokio::io::AsyncWriteExt;
    use tokio::net::TcpListener;
    
    let listener = TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    tracing::info!("📊 Metrics server listening on port {}", port);
    
    loop {
        let (mut socket, _) = listener.accept().await?;
        let metrics = get_metrics();
        
        let response = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: {}\r\n\r\n{}",
            metrics.len(),
            metrics
        );
        
        let _ = socket.write_all(response.as_bytes()).await;
    }
}
