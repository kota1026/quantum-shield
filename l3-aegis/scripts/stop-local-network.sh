#!/bin/bash
# =============================================================================
# L3-Aegis 4-Node Local Network Shutdown Script
# =============================================================================
# Gracefully stops all 4 L3-Aegis nodes
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="${SCRIPT_DIR}/../docker"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --clean    Remove volumes and network data"
    echo "  --force    Force stop without graceful shutdown"
    echo "  -h, --help Show this help message"
}

stop_network() {
    local clean=false
    local force=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --clean)
                clean=true
                shift
                ;;
            --force)
                force=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                log_warn "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    cd "${DOCKER_DIR}"
    
    # Check if network is running
    if docker compose version &> /dev/null 2>&1; then
        local running=$(docker compose ps -q 2>/dev/null | wc -l)
    else
        local running=$(docker-compose ps -q 2>/dev/null | wc -l)
    fi
    
    if [ "$running" -eq 0 ]; then
        log_info "No L3-Aegis containers are running"
        exit 0
    fi
    
    log_info "Stopping L3-Aegis network..."
    
    if [ "$force" = true ]; then
        log_warn "Force stopping containers..."
        if docker compose version &> /dev/null 2>&1; then
            docker compose kill
        else
            docker-compose kill
        fi
    fi
    
    if docker compose version &> /dev/null 2>&1; then
        docker compose down
    else
        docker-compose down
    fi
    
    if [ "$clean" = true ]; then
        log_info "Removing volumes and data..."
        if docker compose version &> /dev/null 2>&1; then
            docker compose down -v --remove-orphans
        else
            docker-compose down -v --remove-orphans
        fi
        log_info "Volumes and data removed"
    fi
    
    log_info "L3-Aegis network stopped"
}

stop_network "$@"
