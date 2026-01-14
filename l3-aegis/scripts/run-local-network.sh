#!/bin/bash
# =============================================================================
# L3-Aegis 4-Node Local Network Startup Script
# =============================================================================
# Reference: L3_CHAIN_SPECIFICATION.md §10
# - 4 nodes with PBFT consensus (f=1)
# - 5 second block time (production) / 1 second (dev mode)
# - CP-1 compliant: Dilithium-III, SHA3-256
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/.."
DOCKER_DIR="${PROJECT_ROOT}/docker"
KEYS_DIR="${DOCKER_DIR}/keys"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║               L3-Aegis 4-Node BFT Testnet                        ║"
    echo "║                    Quantum Shield                                ║"
    echo "╠══════════════════════════════════════════════════════════════════╣"
    echo "║  CP-1 Compliant: Dilithium-III (FIPS 204) + SHA3-256             ║"
    echo "║  Consensus: PBFT with f=1 fault tolerance                        ║"
    echo "║  Block Time: 5 seconds (production mode)                         ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

check_keys() {
    log_info "Checking Dilithium keys..."
    
    local missing_keys=0
    for i in 0 1 2 3; do
        if [ ! -d "${KEYS_DIR}/node${i}" ] || [ ! -f "${KEYS_DIR}/node${i}/dilithium.pub" ]; then
            log_warn "Missing keys for node${i}"
            missing_keys=1
        fi
    done
    
    if [ $missing_keys -eq 1 ]; then
        log_warn "Some keys are missing. Generating development keys..."
        "${SCRIPT_DIR}/generate-dev-keys.sh"
    else
        log_info "All node keys present"
    fi
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    log_info "Docker environment OK"
}

build_images() {
    log_info "Building L3-Aegis node images..."
    cd "${DOCKER_DIR}"
    
    if docker compose version &> /dev/null 2>&1; then
        docker compose build --parallel
    else
        docker-compose build
    fi
    
    log_info "Images built successfully"
}

start_network() {
    log_info "Starting 4-node network..."
    cd "${DOCKER_DIR}"
    
    if docker compose version &> /dev/null 2>&1; then
        docker compose up -d
    else
        docker-compose up -d
    fi
    
    log_info "Waiting for nodes to initialize..."
    sleep 5
}

check_health() {
    log_info "Checking node health..."
    
    local all_healthy=true
    
    for port in 8545 8546 8547 8548; do
        local node_idx=$((port - 8545))
        if curl -s -X POST -H "Content-Type: application/json" \
            --data '{"jsonrpc":"2.0","method":"aegis_health","params":[],"id":1}' \
            "http://localhost:${port}" > /dev/null 2>&1; then
            log_info "Node ${node_idx} (port ${port}): HEALTHY"
        else
            log_warn "Node ${node_idx} (port ${port}): NOT RESPONDING (may still be starting)"
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        log_info "All nodes are healthy!"
    else
        log_warn "Some nodes may still be initializing. Check logs with: docker compose logs -f"
    fi
}

show_status() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}                    Network Status                                 ${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "  Node 0 (Primary):  RPC=http://localhost:8545  P2P=30303"
    echo "  Node 1:            RPC=http://localhost:8546  P2P=30304"
    echo "  Node 2:            RPC=http://localhost:8547  P2P=30305"
    echo "  Node 3:            RPC=http://localhost:8548  P2P=30306"
    echo ""
    echo "  View logs:         cd ${DOCKER_DIR} && docker compose logs -f"
    echo "  Stop network:      ${SCRIPT_DIR}/stop-local-network.sh"
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
}

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --skip-build   Skip image build step"
    echo "  --skip-keys    Skip key generation check"
    echo "  -h, --help     Show this help message"
}

# Main execution
main() {
    local skip_build=false
    local skip_keys=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-build)
                skip_build=true
                shift
                ;;
            --skip-keys)
                skip_keys=true
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
    
    print_banner
    
    check_docker
    
    if [ "$skip_keys" = false ]; then
        check_keys
    fi
    
    if [ "$skip_build" = false ]; then
        build_images
    fi
    
    start_network
    check_health
    show_status
    
    log_info "L3-Aegis 4-node network started successfully!"
}

main "$@"
