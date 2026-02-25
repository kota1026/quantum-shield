#!/bin/bash
# =============================================================================
# Quantum Shield - Production Deployment Script
# =============================================================================
# This script deploys the complete Quantum Shield stack to production.
#
# Prerequisites:
# - Docker and Docker Compose v2 installed
# - .env.production file configured
# - Access to container registry (if using pre-built images)
#
# Usage:
#   ./deploy.sh [command]
#
# Commands:
#   up        - Start all services
#   down      - Stop all services
#   restart   - Restart all services
#   status    - Show service status
#   logs      - Show service logs
#   health    - Run health checks
#   backup    - Backup databases
#   rollback  - Rollback to previous version
#   upgrade   - Upgrade to new version
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
DOCKER_DIR="$PROJECT_ROOT/docker"

# Configuration
COMPOSE_FILE="$DOCKER_DIR/docker-compose.production.yml"
ENV_FILE="$DOCKER_DIR/.env.production"
BACKUP_DIR="$PROJECT_ROOT/backups"
VERSION_FILE="$DOCKER_DIR/.version"

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking requirements..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi

    # Check Docker Compose
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose v2 is not installed"
        exit 1
    fi

    # Check environment file
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file not found: $ENV_FILE"
        log_info "Copy .env.production.example to .env.production and configure it"
        exit 1
    fi

    log_success "All requirements met"
}

# =============================================================================
# Deployment Commands
# =============================================================================

cmd_up() {
    log_info "Starting Quantum Shield production stack..."

    check_requirements

    # Pull latest images (if using pre-built)
    # docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull

    # Build services
    log_info "Building services..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build

    # Start infrastructure first
    log_info "Starting infrastructure services..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres redis rabbitmq

    # Wait for infrastructure to be healthy
    log_info "Waiting for infrastructure to be ready..."
    sleep 10

    # Start core services
    log_info "Starting core services..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d api event-bridge stark-prover monitor-bot

    # Start monitoring
    log_info "Starting monitoring services..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d prometheus grafana

    # Save current version
    git rev-parse HEAD 2>/dev/null > "$VERSION_FILE" || echo "unknown" > "$VERSION_FILE"

    log_success "Quantum Shield stack started successfully!"
    log_info "Run './deploy.sh health' to verify all services are healthy"
}

cmd_down() {
    log_info "Stopping Quantum Shield production stack..."

    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down

    log_success "All services stopped"
}

cmd_restart() {
    log_info "Restarting Quantum Shield production stack..."

    cmd_down
    sleep 5
    cmd_up
}

cmd_status() {
    log_info "Service Status:"
    echo ""
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
}

cmd_logs() {
    local service="${1:-}"

    if [ -n "$service" ]; then
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f "$service"
    else
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f
    fi
}

cmd_health() {
    log_info "Running health checks..."
    echo ""

    local all_healthy=true

    # Check API
    if curl -sf "http://localhost:${API_PORT:-8080}/v1/health" > /dev/null 2>&1; then
        log_success "API: Healthy"
    else
        log_error "API: Unhealthy"
        all_healthy=false
    fi

    # Check Event Bridge
    if curl -sf "http://localhost:${EVENT_BRIDGE_PORT:-8081}/health" > /dev/null 2>&1; then
        log_success "Event Bridge: Healthy"
    else
        log_error "Event Bridge: Unhealthy"
        all_healthy=false
    fi

    # Check STARK Prover
    if curl -sf "http://localhost:${STARK_PROVER_PORT:-3000}/health" > /dev/null 2>&1; then
        log_success "STARK Prover: Healthy"
    else
        log_error "STARK Prover: Unhealthy"
        all_healthy=false
    fi

    # Check PostgreSQL
    if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres pg_isready -U "$POSTGRES_USER" > /dev/null 2>&1; then
        log_success "PostgreSQL: Healthy"
    else
        log_error "PostgreSQL: Unhealthy"
        all_healthy=false
    fi

    # Check Redis
    if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T redis redis-cli ping > /dev/null 2>&1; then
        log_success "Redis: Healthy"
    else
        log_error "Redis: Unhealthy"
        all_healthy=false
    fi

    # Check RabbitMQ
    if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T rabbitmq rabbitmq-diagnostics -q ping > /dev/null 2>&1; then
        log_success "RabbitMQ: Healthy"
    else
        log_error "RabbitMQ: Unhealthy"
        all_healthy=false
    fi

    # Check Prometheus
    if curl -sf "http://localhost:${PROMETHEUS_PORT:-9090}/-/healthy" > /dev/null 2>&1; then
        log_success "Prometheus: Healthy"
    else
        log_error "Prometheus: Unhealthy"
        all_healthy=false
    fi

    # Check Grafana
    if curl -sf "http://localhost:${GRAFANA_PORT:-3001}/api/health" > /dev/null 2>&1; then
        log_success "Grafana: Healthy"
    else
        log_error "Grafana: Unhealthy"
        all_healthy=false
    fi

    echo ""
    if [ "$all_healthy" = true ]; then
        log_success "All services are healthy!"
        return 0
    else
        log_error "Some services are unhealthy. Check logs for details."
        return 1
    fi
}

cmd_backup() {
    log_info "Creating backup..."

    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/$timestamp"

    mkdir -p "$backup_path"

    # Backup PostgreSQL
    log_info "Backing up PostgreSQL..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
        pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$backup_path/postgres.sql"

    # Backup Redis
    log_info "Backing up Redis..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T redis \
        redis-cli BGSAVE
    sleep 2
    docker cp qs-redis:/data/dump.rdb "$backup_path/redis.rdb"

    # Backup version info
    cp "$VERSION_FILE" "$backup_path/version" 2>/dev/null || echo "unknown" > "$backup_path/version"

    # Compress backup
    log_info "Compressing backup..."
    tar -czf "$BACKUP_DIR/backup_$timestamp.tar.gz" -C "$BACKUP_DIR" "$timestamp"
    rm -rf "$backup_path"

    log_success "Backup created: $BACKUP_DIR/backup_$timestamp.tar.gz"
}

cmd_rollback() {
    local backup_file="$1"

    if [ -z "$backup_file" ]; then
        log_error "Usage: ./deploy.sh rollback <backup_file>"
        log_info "Available backups:"
        ls -la "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "No backups found"
        exit 1
    fi

    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi

    log_warning "This will restore from backup and may cause data loss!"
    read -p "Are you sure? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        log_info "Rollback cancelled"
        exit 0
    fi

    log_info "Rolling back from backup..."

    # Extract backup
    local temp_dir=$(mktemp -d)
    tar -xzf "$backup_file" -C "$temp_dir"
    local backup_dir=$(ls "$temp_dir")

    # Stop services
    cmd_down

    # Restore PostgreSQL
    log_info "Restoring PostgreSQL..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres
    sleep 10
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
        psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$temp_dir/$backup_dir/postgres.sql"

    # Restore Redis
    log_info "Restoring Redis..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d redis
    sleep 5
    docker cp "$temp_dir/$backup_dir/redis.rdb" qs-redis:/data/dump.rdb
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" restart redis

    # Cleanup
    rm -rf "$temp_dir"

    # Start all services
    cmd_up

    log_success "Rollback completed successfully!"
}

cmd_upgrade() {
    log_info "Upgrading Quantum Shield..."

    # Create backup first
    log_info "Creating pre-upgrade backup..."
    cmd_backup

    # Pull latest code
    log_info "Pulling latest code..."
    git pull origin main

    # Rebuild and restart
    log_info "Rebuilding services..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build

    # Rolling restart
    log_info "Performing rolling restart..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

    # Health check
    sleep 30
    if cmd_health; then
        log_success "Upgrade completed successfully!"
    else
        log_error "Upgrade may have issues. Consider rollback if needed."
    fi
}

# =============================================================================
# Main Entry Point
# =============================================================================

# Load environment variables
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
fi

# Main command handling
case "${1:-help}" in
    up)
        cmd_up
        ;;
    down)
        cmd_down
        ;;
    restart)
        cmd_restart
        ;;
    status)
        cmd_status
        ;;
    logs)
        cmd_logs "$2"
        ;;
    health)
        cmd_health
        ;;
    backup)
        cmd_backup
        ;;
    rollback)
        cmd_rollback "$2"
        ;;
    upgrade)
        cmd_upgrade
        ;;
    help|*)
        echo ""
        echo -e "${GREEN}Quantum Shield Production Deployment${NC}"
        echo "======================================="
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  up        - Start all services"
        echo "  down      - Stop all services"
        echo "  restart   - Restart all services"
        echo "  status    - Show service status"
        echo "  logs      - Show service logs (optionally: logs <service>)"
        echo "  health    - Run health checks"
        echo "  backup    - Backup databases"
        echo "  rollback  - Rollback to previous version"
        echo "  upgrade   - Upgrade to new version"
        echo "  help      - Show this help message"
        echo ""
        ;;
esac
