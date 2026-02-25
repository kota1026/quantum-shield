# Quantum Shield - Production Deployment

This directory contains the production deployment configuration for Quantum Shield.

## Overview

The production stack includes:

- **Core Services**
  - API Service (Rust) - Main REST API
  - Event Bridge (Rust) - L1/L3 event synchronization
  - Monitor Bot (Rust) - 24h unlock monitoring
  - STARK Prover (Rust) - Zero-knowledge proof generation

- **Infrastructure**
  - PostgreSQL 16 - Primary database
  - Redis 7 - Cache and session storage
  - RabbitMQ 3.13 - Message queue

- **Monitoring**
  - Prometheus - Metrics collection
  - Grafana - Dashboards and visualization
  - Alertmanager - Alert routing (optional)

## Quick Start

### 1. Configure Environment

```bash
# Copy example environment file
cp .env.production.example .env.production

# Edit with your values
vim .env.production
```

**Required Variables:**
- `L1_RPC_URL` - Ethereum RPC endpoint
- `POSTGRES_PASSWORD` - Database password
- `RABBITMQ_PASSWORD` - Message queue password
- `JWT_SECRET` - API authentication secret
- Contract addresses (L1_VAULT_ADDRESS, etc.)

### 2. Deploy

```bash
# Start all services
../scripts/deploy/production/deploy.sh up

# Check health
../scripts/deploy/production/deploy.sh health

# View logs
../scripts/deploy/production/deploy.sh logs
```

### 3. Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| API | http://localhost:8080 | - |
| Grafana | http://localhost:3001 | admin / (configured) |
| RabbitMQ Management | http://localhost:15672 | (configured) |
| Prometheus | http://localhost:9090 | - |

## Directory Structure

```
docker/
├── docker-compose.production.yml  # Main compose file
├── .env.production.example        # Environment template
├── README.md                      # This file
├── init-scripts/                  # Database init scripts
│   └── postgres/
└── monitoring/
    ├── prometheus.yml             # Prometheus config
    ├── alert-rules.yml            # Alert definitions
    ├── alertmanager.yml           # Alert routing
    └── grafana/
        ├── provisioning/          # Auto-provisioning
        │   ├── datasources/
        │   └── dashboards/
        └── dashboards/            # Dashboard JSONs
```

## Commands

```bash
# Start services
./deploy.sh up

# Stop services
./deploy.sh down

# Restart services
./deploy.sh restart

# View status
./deploy.sh status

# View logs (all or specific service)
./deploy.sh logs [service]

# Run health checks
./deploy.sh health

# Create backup
./deploy.sh backup

# Rollback from backup
./deploy.sh rollback <backup_file>

# Upgrade to new version
./deploy.sh upgrade
```

## Scaling

### Horizontal Scaling

For high availability, deploy multiple API instances behind a load balancer:

```yaml
# In docker-compose.production.yml
services:
  api:
    deploy:
      replicas: 3
```

### Resource Allocation

Default resource limits (adjust in compose file):

| Service | CPU | Memory |
|---------|-----|--------|
| API | 2 cores | 2GB |
| Event Bridge | 1 core | 1GB |
| STARK Prover | 4 cores | 8GB |
| PostgreSQL | 2 cores | 2GB |

## Monitoring

### Dashboards

Pre-configured Grafana dashboards:
- **Quantum Shield Overview** - Service health and metrics
- **API Performance** - Request rates and latencies
- **Business Metrics** - Locks, unlocks, provers

### Alerts

Critical alerts (PagerDuty/Slack):
- Service down
- Consensus failures
- Database connection issues

Warning alerts (Slack):
- High latency
- Queue backlogs
- Resource utilization

## Backup & Recovery

### Automatic Backups

Create backup before any operation:

```bash
./deploy.sh backup
```

Backups include:
- PostgreSQL database dump
- Redis snapshot
- Version information

### Recovery

```bash
# List available backups
ls -la ../backups/

# Restore from backup
./deploy.sh rollback ../backups/backup_20260113_120000.tar.gz
```

## Security

### Network Security

- All services on isolated Docker network
- Only necessary ports exposed
- TLS for external connections (configure TLS_CERT_PATH/TLS_KEY_PATH)

### Secrets Management

For production:
1. Use Docker secrets or HashiCorp Vault
2. Never commit `.env.production`
3. Rotate credentials regularly

## Troubleshooting

### Service Won't Start

```bash
# Check logs
./deploy.sh logs api

# Check container status
docker ps -a

# Inspect container
docker inspect qs-api
```

### Database Connection Issues

```bash
# Check PostgreSQL
docker exec -it qs-postgres pg_isready

# Check connection from API
docker exec -it qs-api curl -v postgres:5432
```

### High Memory Usage

```bash
# Check container stats
docker stats

# Increase limits in compose file
# or scale horizontally
```

## Support

- Documentation: https://docs.quantumshield.io
- Issues: https://github.com/quantum-shield/quantum-shield/issues
