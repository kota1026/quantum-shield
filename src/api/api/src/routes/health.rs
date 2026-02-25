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

    let all_healthy = db_health.status == "up"
        && redis_health.status == "up";
    // L3 is optional — degraded mode is acceptable

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
