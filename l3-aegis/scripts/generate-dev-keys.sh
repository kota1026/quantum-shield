#!/bin/bash
# =============================================================================
# L3-Aegis Dilithium Key Generation Script
# =============================================================================
# Generates development Dilithium-III keypairs for 4-node testnet
#
# Reference: L3_CHAIN_SPECIFICATION.md
# - CP-1 Compliant: Dilithium-III (FIPS 204)
# - Public Key: 1952 bytes
# - Secret Key: 4032 bytes
#
# WARNING: These are DEVELOPMENT keys only!
# Do NOT use in production environments.
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/.."
KEYS_DIR="${PROJECT_ROOT}/docker/keys"

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

print_warning() {
    echo -e "${YELLOW}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║  ⚠️   DEVELOPMENT KEYS - NOT FOR PRODUCTION USE  ⚠️               ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

build_cli() {
    log_info "Building aegis-cli tool..."
    cd "${PROJECT_ROOT}"
    cargo build --release -p aegis-cli
}

generate_keys() {
    print_warning
    
    log_info "Generating Dilithium-III keypairs for 4-node testnet..."
    log_info "CP-1 Compliance: FIPS 204 Level 3 (Dilithium-III)"
    
    # Build CLI if not exists
    local cli_bin="${PROJECT_ROOT}/target/release/aegis-cli"
    if [ ! -f "$cli_bin" ]; then
        build_cli
    fi
    
    # Generate keys for each node
    for i in 0 1 2 3; do
        local node_dir="${KEYS_DIR}/node${i}"
        mkdir -p "$node_dir"
        
        log_info "Generating keys for node${i}..."
        
        "$cli_bin" keygen \
            --output "$node_dir" \
            --prefix "dilithium" \
            --node-id "$i" \
            --force
        
        # Verify files were created
        if [ -f "${node_dir}/dilithium.pub" ] && [ -f "${node_dir}/dilithium.key" ]; then
            local pub_size=$(wc -c < "${node_dir}/dilithium.pub")
            local key_size=$(wc -c < "${node_dir}/dilithium.key")
            log_info "  Node ${i}: Public key (${pub_size} bytes), Secret key (${key_size} bytes)"
        else
            log_error "Failed to generate keys for node${i}"
            exit 1
        fi
    done
    
    # Generate validators.json
    log_info "Generating validators.json..."
    generate_validators_json
    
    log_info "Key generation complete!"
    echo ""
    echo "Keys location: ${KEYS_DIR}"
    echo "  node0/dilithium.pub, dilithium.key"
    echo "  node1/dilithium.pub, dilithium.key"
    echo "  node2/dilithium.pub, dilithium.key"
    echo "  node3/dilithium.pub, dilithium.key"
    echo "  validators.json"
    print_warning
}

generate_validators_json() {
    local validators_file="${KEYS_DIR}/validators.json"
    
    echo '[' > "$validators_file"
    
    for i in 0 1 2 3; do
        local pub_key_hex=$(xxd -p "${KEYS_DIR}/node${i}/dilithium.pub" | tr -d '\n')
        local comma=","
        [ $i -eq 3 ] && comma=""
        
        cat >> "$validators_file" << EOF
  {
    "node_id": ${i},
    "public_key": "${pub_key_hex}"
  }${comma}
EOF
    done
    
    echo ']' >> "$validators_file"
}

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --clean    Remove existing keys before generating"
    echo "  --force    Overwrite existing keys"
    echo "  -h, --help Show this help message"
}

main() {
    local clean=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --clean)
                clean=true
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
    
    # Check for clean flag
    if [ "$clean" = true ]; then
        log_warn "Removing existing keys..."
        rm -rf "${KEYS_DIR}/node"*
        rm -f "${KEYS_DIR}/validators.json"
        log_info "Keys removed"
    fi
    
    generate_keys
}

main "$@"
