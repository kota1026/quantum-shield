#!/bin/bash
# =============================================================================
# Quantum Shield - Comprehensive Health Check Script
# =============================================================================
# Performs detailed health checks on all Quantum Shield services.
# Can be used for:
# - Kubernetes readiness/liveness probes
# - CI/CD deployment verification
# - Manual health verification
# - Alerting systems integration
#
# Exit codes:
#   0 - All services healthy
#   1 - Some services unhealthy
#   2 - Critical services down
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_URL="${API_URL:-http://localhost:8080}"
EVENT_BRIDGE_URL="${EVENT_BRIDGE_URL:-http://localhost:8081}"
STARK_PROVER_URL="${STARK_PROVER_URL:-http://localhost:3000}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
GRAFANA_URL="${GRAFANA_URL:-http://localhost:3001}"

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
CRITICAL_FAILURES=0

# Output format
OUTPUT_FORMAT="${OUTPUT_FORMAT:-text}"  # text, json

# =============================================================================
# Helper Functions
# =============================================================================

check_service() {
    local name="$1"
    local url="$2"
    local endpoint="$3"
    local critical="${4:-false}"

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    local full_url="${url}${endpoint}"
    local response_code
    local response_time

    local start_time=$(date +%s%3N)
    response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$full_url" 2>/dev/null || echo "000")
    local end_time=$(date +%s%3N)
    response_time=$((end_time - start_time))

    if [ "$response_code" = "200" ]; then
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        if [ "$OUTPUT_FORMAT" = "text" ]; then
            echo -e "${GREEN}[PASS]${NC} $name - ${response_time}ms"
        fi
        return 0
    else
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        if [ "$critical" = "true" ]; then
            CRITICAL_FAILURES=$((CRITICAL_FAILURES + 1))
        fi
        if [ "$OUTPUT_FORMAT" = "text" ]; then
            echo -e "${RED}[FAIL]${NC} $name - HTTP $response_code"
        fi
        return 1
    fi
}

check_tcp_port() {
    local name="$1"
    local host="$2"
    local port="$3"
    local critical="${4:-false}"

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if nc -z -w 5 "$host" "$port" 2>/dev/null; then
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        if [ "$OUTPUT_FORMAT" = "text" ]; then
            echo -e "${GREEN}[PASS]${NC} $name ($host:$port)"
        fi
        return 0
    else
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        if [ "$critical" = "true" ]; then
            CRITICAL_FAILURES=$((CRITICAL_FAILURES + 1))
        fi
        if [ "$OUTPUT_FORMAT" = "text" ]; then
            echo -e "${RED}[FAIL]${NC} $name ($host:$port)"
        fi
        return 1
    fi
}

# =============================================================================
# Health Checks
# =============================================================================

run_checks() {
    if [ "$OUTPUT_FORMAT" = "text" ]; then
        echo ""
        echo -e "${BLUE}Quantum Shield Health Check${NC}"
        echo "============================"
        echo ""
        echo -e "${YELLOW}Core Services:${NC}"
    fi

    # Core Services (Critical)
    check_service "API Health" "$API_URL" "/v1/health" true
    check_service "Event Bridge Health" "$EVENT_BRIDGE_URL" "/health" true
    check_service "STARK Prover Health" "$STARK_PROVER_URL" "/health" true

    if [ "$OUTPUT_FORMAT" = "text" ]; then
        echo ""
        echo -e "${YELLOW}Infrastructure Services:${NC}"
    fi

    # Infrastructure Services
    check_tcp_port "PostgreSQL" "localhost" "${POSTGRES_PORT:-5432}" true
    check_tcp_port "Redis" "localhost" "${REDIS_PORT:-6379}" true
    check_tcp_port "RabbitMQ" "localhost" "${RABBITMQ_PORT:-5672}" true

    if [ "$OUTPUT_FORMAT" = "text" ]; then
        echo ""
        echo -e "${YELLOW}Monitoring Services:${NC}"
    fi

    # Monitoring Services (Non-Critical)
    check_service "Prometheus Health" "$PROMETHEUS_URL" "/-/healthy" false
    check_service "Grafana Health" "$GRAFANA_URL" "/api/health" false

    if [ "$OUTPUT_FORMAT" = "text" ]; then
        echo ""
        echo -e "${YELLOW}API Endpoints:${NC}"
    fi

    # API Endpoint Checks
    check_service "API Edition Endpoint" "$API_URL" "/v1/edition" true
    check_service "API Status Endpoint" "$API_URL" "/v1/status/pending" true
}

# =============================================================================
# Output Results
# =============================================================================

output_results() {
    if [ "$OUTPUT_FORMAT" = "json" ]; then
        cat <<EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "total_checks": $TOTAL_CHECKS,
    "passed": $PASSED_CHECKS,
    "failed": $FAILED_CHECKS,
    "critical_failures": $CRITICAL_FAILURES,
    "status": "$([ $CRITICAL_FAILURES -eq 0 ] && echo "healthy" || echo "unhealthy")"
}
EOF
    else
        echo ""
        echo "=============================="
        echo -e "${BLUE}Summary:${NC}"
        echo "  Total Checks:      $TOTAL_CHECKS"
        echo -e "  Passed:            ${GREEN}$PASSED_CHECKS${NC}"
        echo -e "  Failed:            ${RED}$FAILED_CHECKS${NC}"
        echo -e "  Critical Failures: ${RED}$CRITICAL_FAILURES${NC}"
        echo ""

        if [ $CRITICAL_FAILURES -gt 0 ]; then
            echo -e "${RED}CRITICAL: Some critical services are down!${NC}"
            exit 2
        elif [ $FAILED_CHECKS -gt 0 ]; then
            echo -e "${YELLOW}WARNING: Some services are unhealthy.${NC}"
            exit 1
        else
            echo -e "${GREEN}All services are healthy!${NC}"
            exit 0
        fi
    fi
}

# =============================================================================
# Main
# =============================================================================

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            OUTPUT_FORMAT="json"
            shift
            ;;
        --api-url)
            API_URL="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --json         Output results in JSON format"
            echo "  --api-url URL  Set custom API URL"
            echo "  --help         Show this help message"
            exit 0
            ;;
        *)
            shift
            ;;
    esac
done

run_checks
output_results
