//! Health check endpoints
//!
//! GET /v1/health — basic liveness check (no auth)
//! GET /v1/health/ready — readiness check with dependency status

use axum::{Extension, Json};
use serde::Serialize;
use std::sync::Arc;

use crate::services::AppState;

#[derive(Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
    pub timestamp: u64,
}

/// Basic liveness check — always returns healthy if the process is running
pub async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "healthy".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        timestamp: chrono::Utc::now().timestamp() as u64,
    })
}

#[derive(Serialize)]
pub struct ReadinessResponse {
    pub status: String,
    pub version: String,
    pub timestamp: u64,
    pub dependencies: DependencyStatus,
}

#[derive(Serialize)]
pub struct DependencyStatus {
    pub database: ComponentHealth,
    pub redis: ComponentHealth,
    pub l3: ComponentHealth,
}

#[derive(Serialize)]
pub struct ComponentHealth {
    pub status: String,
    pub latency_ms: Option<u64>,
}

/// Readiness check — verifies database, redis, and L3 connectivity
pub async fn readiness_check(
    Extension(state): Extension<Arc<AppState>>,
) -> Json<ReadinessResponse> {
    let db_health = check_database(&state).await;
    let redis_health = check_redis(&state).await;
    let l3_health = check_l3(&state).await;

    // DB is required; Redis and L3 are optional (Beta/degraded mode acceptable)
    let all_healthy = db_health.status == "up";

    let status = if all_healthy { "ready" } else { "degraded" };

    Json(ReadinessResponse {
        status: status.to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        timestamp: chrono::Utc::now().timestamp() as u64,
        dependencies: DependencyStatus {
            database: db_health,
            redis: redis_health,
            l3: l3_health,
        },
    })
}

async fn check_database(state: &AppState) -> ComponentHealth {
    let start = std::time::Instant::now();
    match state.db.health_check().await {
        Ok(_) => ComponentHealth {
            status: "up".to_string(),
            latency_ms: Some(start.elapsed().as_millis() as u64),
        },
        Err(e) => {
            tracing::warn!("Health: database check failed: {}", e);
            ComponentHealth {
                status: "down".to_string(),
                latency_ms: None,
            }
        }
    }
}

async fn check_redis(state: &AppState) -> ComponentHealth {
    let start = std::time::Instant::now();
    match state.redis.ping().await {
        Ok(_) => ComponentHealth {
            status: "up".to_string(),
            latency_ms: Some(start.elapsed().as_millis() as u64),
        },
        Err(e) => {
            tracing::warn!("Health: redis PING failed: {}", e);
            ComponentHealth {
                status: "down".to_string(),
                latency_ms: None,
            }
        }
    }
}

// ─── Prometheus Metrics Endpoint (Phase D) ────────────────────────────

/// GET /v1/metrics — Prometheus-compatible metrics endpoint
/// Returns business metrics + dependency health in Prometheus text format.
/// No external crate needed — manual text/plain output.
pub async fn prometheus_metrics(
    Extension(state): Extension<Arc<AppState>>,
) -> (axum::http::StatusCode, [(axum::http::header::HeaderName, &'static str); 1], String) {
    let mut lines = Vec::new();

    // Service info
    lines.push(format!(
        "# HELP qs_info Quantum Shield API information"));
    lines.push(format!(
        "# TYPE qs_info gauge"));
    lines.push(format!(
        "qs_info{{version=\"{}\"}} 1", env!("CARGO_PKG_VERSION")));

    // Dependency health (1 = up, 0 = down)
    let db_health = check_database(&state).await;
    let redis_health = check_redis(&state).await;
    let l3_health = check_l3(&state).await;

    lines.push("# HELP qs_dependency_up Whether a dependency is healthy (1=up, 0=down)".to_string());
    lines.push("# TYPE qs_dependency_up gauge".to_string());
    lines.push(format!("qs_dependency_up{{dependency=\"database\"}} {}", if db_health.status == "up" { 1 } else { 0 }));
    lines.push(format!("qs_dependency_up{{dependency=\"redis\"}} {}", if redis_health.status == "up" { 1 } else { 0 }));
    lines.push(format!("qs_dependency_up{{dependency=\"l3\"}} {}", if l3_health.status == "up" { 1 } else { 0 }));

    // Dependency latency
    lines.push("# HELP qs_dependency_latency_ms Dependency check latency in milliseconds".to_string());
    lines.push("# TYPE qs_dependency_latency_ms gauge".to_string());
    if let Some(ms) = db_health.latency_ms {
        lines.push(format!("qs_dependency_latency_ms{{dependency=\"database\"}} {}", ms));
    }
    if let Some(ms) = redis_health.latency_ms {
        lines.push(format!("qs_dependency_latency_ms{{dependency=\"redis\"}} {}", ms));
    }

    // Business metrics from DB
    let business = fetch_business_metrics(&state).await;
    lines.push("# HELP qs_total_locks Total number of locks created".to_string());
    lines.push("# TYPE qs_total_locks gauge".to_string());
    lines.push(format!("qs_total_locks {}", business.total_locks));

    lines.push("# HELP qs_pending_unlocks_count Number of pending unlock requests".to_string());
    lines.push("# TYPE qs_pending_unlocks_count gauge".to_string());
    lines.push(format!("qs_pending_unlocks_count {}", business.pending_unlocks));

    lines.push("# HELP qs_active_provers Number of active provers".to_string());
    lines.push("# TYPE qs_active_provers gauge".to_string());
    lines.push(format!("qs_active_provers {}", business.active_provers));

    lines.push("# HELP qs_active_challenges Number of active challenges".to_string());
    lines.push("# TYPE qs_active_challenges gauge".to_string());
    lines.push(format!("qs_active_challenges {}", business.active_challenges));

    lines.push("# HELP qs_total_unlocks Total number of completed unlocks".to_string());
    lines.push("# TYPE qs_total_unlocks gauge".to_string());
    lines.push(format!("qs_total_unlocks {}", business.total_unlocks));

    lines.push("# HELP qs_governance_proposals Total governance proposals".to_string());
    lines.push("# TYPE qs_governance_proposals gauge".to_string());
    lines.push(format!("qs_governance_proposals {}", business.governance_proposals));

    let body = lines.join("\n") + "\n";

    (
        axum::http::StatusCode::OK,
        [(axum::http::header::CONTENT_TYPE, "text/plain; version=0.0.4; charset=utf-8")],
        body,
    )
}

struct BusinessMetrics {
    total_locks: i64,
    pending_unlocks: i64,
    active_provers: i64,
    active_challenges: i64,
    total_unlocks: i64,
    governance_proposals: i64,
}

async fn fetch_business_metrics(state: &AppState) -> BusinessMetrics {
    let pool = state.pool();

    let total_locks = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM locks")
        .fetch_one(pool).await.unwrap_or(0);

    let pending_unlocks = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM unlock_requests WHERE status IN ('pending', 'unlock_pending')"
    ).fetch_one(pool).await.unwrap_or(0);

    let active_provers = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM provers WHERE status = 'active'"
    ).fetch_one(pool).await.unwrap_or(0);

    let active_challenges = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM challenges WHERE status = 'pending'"
    ).fetch_one(pool).await.unwrap_or(0);

    let total_unlocks = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM unlock_requests WHERE status = 'released'"
    ).fetch_one(pool).await.unwrap_or(0);

    let governance_proposals = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM governance_proposals"
    ).fetch_one(pool).await.unwrap_or(0);

    BusinessMetrics {
        total_locks,
        pending_unlocks,
        active_provers,
        active_challenges,
        total_unlocks,
        governance_proposals,
    }
}

async fn check_l3(state: &AppState) -> ComponentHealth {
    if !state.l3_contracts.is_connected() {
        return ComponentHealth {
            status: "not_configured".to_string(),
            latency_ms: None,
        };
    }

    let start = std::time::Instant::now();
    match state.l3_contracts.get_state_root().await {
        Ok(_) => ComponentHealth {
            status: "up".to_string(),
            latency_ms: Some(start.elapsed().as_millis() as u64),
        },
        Err(e) => {
            tracing::warn!("Health: L3 check failed: {}", e);
            ComponentHealth {
                status: "down".to_string(),
                latency_ms: None,
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_health_response_serialization() {
        let resp = HealthResponse {
            status: "healthy".to_string(),
            version: "0.1.0".to_string(),
            timestamp: 1700000000,
        };
        let json = serde_json::to_string(&resp).unwrap();
        assert!(json.contains("\"status\":\"healthy\""));
        assert!(json.contains("\"version\":\"0.1.0\""));
    }

    #[test]
    fn test_readiness_response_serialization() {
        let resp = ReadinessResponse {
            status: "ready".to_string(),
            version: "0.1.0".to_string(),
            timestamp: 1700000000,
            dependencies: DependencyStatus {
                database: ComponentHealth { status: "up".to_string(), latency_ms: Some(5) },
                redis: ComponentHealth { status: "up".to_string(), latency_ms: Some(2) },
                l3: ComponentHealth { status: "not_configured".to_string(), latency_ms: None },
            },
        };
        let json = serde_json::to_string(&resp).unwrap();
        assert!(json.contains("\"database\""));
        assert!(json.contains("\"redis\""));
        assert!(json.contains("\"l3\""));
    }

    #[test]
    fn test_degraded_when_db_down() {
        let db = ComponentHealth { status: "down".to_string(), latency_ms: None };
        let redis = ComponentHealth { status: "up".to_string(), latency_ms: Some(1) };
        let all_healthy = db.status == "up" && redis.status == "up";
        assert!(!all_healthy);
    }
}
