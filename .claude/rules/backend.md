# Backend Rules

## Stack
- Rust + Axum web framework
- sqlx for database (compile-time checked queries)
- PostgreSQL 16
- Redis 7 for caching/sessions
- RabbitMQ 3 for message queue

## Project Structure
```
src/api/api/
  src/
    main.rs           Entry point (port 8080)
    config.rs         Configuration loading
    types.rs          Shared type definitions (SOURCE OF TRUTH)
    routes/           API route handlers
    services/         Business logic (AppState, AutoClaim, L1Sync)
    db/               Database queries (sqlx)
    crypto/           NIST FIPS 204 ML-DSA-65 signatures
    middleware/       Rate limiting, request ID, auth
    error.rs          Error types
  config/
    default.yaml      Default configuration
  migrations/         SQL migrations (sqlx)
```

## Configuration
- Config file: `src/api/api/config/default.yaml`
- Env override prefix: `QS__` (e.g., `QS__L1_PRIVATE_KEY`)
- DB URL: `postgresql://quantum:quantum_dev@localhost:5432/quantum_shield`
- Dev mode: `skip_signature_verification: true`, `skip_totp_verification: true`

## API Rules (BE-001 ~ BE-003)
- **BE-001**: No stub responses. Every endpoint must query DB or return proper error.
- **BE-002**: No test-only code modifications in production routes.
- **BE-003**: Mandatory logging: request received, DB operation, response sent.

## Serialization
- All Rust enums: `#[serde(rename_all = "snake_case")]`
- No manual camelCase exceptions in backend
- Frontend handles case conversion in API client layer

## Database
- 16 migration files in `migrations/`
- Note: `013_consolidation.sql` and `013_system_settings.sql` have duplicate numbers
- Use `sqlx::query_as!` for compile-time checked queries
- If compile-time check fails: `SQLX_OFFLINE=true cargo build`

## Error Handling
- Use `anyhow::Result` for internal errors
- Return structured JSON errors to frontend:
  ```json
  {"error": {"code": "LOCK_NOT_FOUND", "message": "..."}}
  ```

## Health Endpoints
- `GET /v1/health` - Basic health
- `GET /v1/health/ready` - DB + Redis + L3 connectivity check

## Key Routes
- `POST /v1/locks` - Create lock
- `POST /v1/locks/:id/unlock` - Request unlock
- `POST /v1/locks/:id/emergency-unlock` - Emergency unlock
- `GET /v1/locks` - List locks
- `POST /v1/auth/siwe` - SIWE authentication
- `/api/*` - Admin dashboard routes (JWT-protected)
