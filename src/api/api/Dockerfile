# Quantum Shield API - Multi-stage Docker build
# Build: docker build -t qs-api -f src/api/api/Dockerfile .
# Run:   docker run -p 8080:8080 --env-file .env qs-api

# ---- Build Stage ----
FROM rust:1.83-slim-bookworm AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config libssl-dev libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy workspace files
COPY Cargo.toml Cargo.lock ./
COPY src/api/api/ src/api/api/
COPY src/crypto/shared-types/ src/crypto/shared-types/
COPY src/crypto/circuits/dilithium-stark/ src/crypto/circuits/dilithium-stark/
COPY src/crypto/circuits/plonky3-poc/ src/crypto/circuits/plonky3-poc/
COPY src/services/ src/services/

# Build only the API binary
RUN cargo build --release -p quantum-shield-api

# ---- Runtime Stage ----
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates libssl3 libpq5 curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/target/release/api-server /app/api-server

# Copy migrations for runtime migration support
COPY src/api/api/migrations/ /app/migrations/

ENV RUST_LOG=info
ENV DATABASE_URL=postgresql://quantum:quantum_dev@postgres:5432/quantum_shield
ENV REDIS_URL=redis://redis:6379

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/v1/health || exit 1

CMD ["/app/api-server"]
