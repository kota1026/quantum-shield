# Local Development Setup - Quantum Shield

## Quick Start

### Option 1: Docker Compose (Full Stack)

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Option 2: Direct Startup (Development)

```bash
# Terminal 1: Frontend
cd apps/web
pnpm dev

# Terminal 2: Backend API
cd services/api
cargo run --release
```

---

## Services Overview

### Docker Compose Services

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Main database |
| Redis | 6379 | Cache & sessions |
| RabbitMQ | 5672, 15672 | Message queue |
| L3 Node (Anvil) | 8545 | Local L3 chain simulation |
| L1 Node (Anvil) | 8546 | Local L1 chain simulation |

### Application Services

| Service | Port | Description |
|---------|------|-------------|
| Next.js Frontend | 3000 | Web application |
| Rust API | 8080 | Backend API server |

---

## Environment Variables

### Frontend (apps/web/.env.local)

```bash
# API endpoint
NEXT_PUBLIC_API_URL=http://localhost:8080

# Wallet Connect
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id

# Chain configuration
NEXT_PUBLIC_L1_CHAIN_ID=11155111
NEXT_PUBLIC_L3_CHAIN_ID=31337
```

### Backend (services/api/.env)

```bash
# Database
DATABASE_URL=postgres://quantum:quantum_dev@localhost:5432/quantum_shield

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://quantum:quantum_dev@localhost:5672

# L3 Node
L3_RPC_URL=http://localhost:8545

# L1 Node (Sepolia)
L1_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
```

---

## Database Setup

### Initialize Database

```bash
# Run migrations
cd services/api
sqlx migrate run

# Check migration status
sqlx migrate info
```

### Connect to Database

```bash
# Using psql
psql -h localhost -U quantum -d quantum_shield

# Password: quantum_dev
```

---

## API Endpoints

### Health Check

```bash
curl http://localhost:8080/v1/health
# {"status":"healthy","version":"0.1.0","timestamp":...}
```

### Main API Routes

| Path | Description |
|------|-------------|
| `/v1/health` | Health check |
| `/v1/lock` | Create lock |
| `/v1/unlock` | Create unlock |
| `/v1/user/dashboard` | User dashboard |
| `/v1/governance/*` | Governance API |
| `/v1/prover/*` | Prover API |
| `/api/*` | Admin Dashboard API |

---

## Running Tests

### Frontend Tests

```bash
cd apps/web

# Unit tests
pnpm test

# E2E tests (requires dev server)
pnpm dev &
npx playwright test

# E2E with existing server
NO_SERVER=1 npx playwright test
```

### Backend Tests

```bash
cd services/api

# Unit tests
cargo test

# Integration tests (requires database)
cargo test --features integration
```

---

## Deployed Contracts (Sepolia)

| Contract | Address |
|----------|---------|
| SPHINCSVerifier | `0x655122b1e816c262168B7f6625346d1914142214` |
| STARKVerifier | `0x2f2f36fAA504b79D26c5240CCd13AE5c1A08bf90` |
| L1Vault | `0xEF851795bc8DE8e0d40781761a0b5B618fED6dE0` |

See [DEPLOYED_CONTRACTS.md](./DEPLOYED_CONTRACTS.md) for details.

---

## Troubleshooting

### Docker Desktop Not Responding

```bash
# Restart Docker Desktop manually
# Or use Activity Monitor to force quit Docker processes
```

### Port Already in Use

```bash
# Find process using port
lsof -i :3000
lsof -i :8080

# Kill process
kill -9 <PID>
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### API Build Errors

```bash
# Clean and rebuild
cd services/api
cargo clean
cargo build --release
```

---

## Development Workflow

1. **Start Infrastructure**
   ```bash
   docker-compose up -d postgres redis
   ```

2. **Run Backend**
   ```bash
   cd services/api && cargo run
   ```

3. **Run Frontend**
   ```bash
   cd apps/web && pnpm dev
   ```

4. **Access Application**
   - Frontend: http://localhost:3000
   - API Health: http://localhost:8080/v1/health
   - RabbitMQ UI: http://localhost:15672

---

## Related Documentation

- [DEPLOYED_CONTRACTS.md](./DEPLOYED_CONTRACTS.md) - Contract addresses
- [API_SPECIFICATION.yaml](./specs/API_SPECIFICATION.yaml) - API docs
- [IMPLEMENTATION_GUIDE.md](./specs/IMPLEMENTATION_GUIDE.md) - Dev guide
