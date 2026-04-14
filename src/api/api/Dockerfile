# Quantum Shield API - Multi-stage Docker build (optimized for Railway)
# Build: docker build -t qs-api -f src/api/api/Dockerfile .
# Run:   docker run -p 8080:8080 --env-file .env qs-api

# ---- Build Stage ----
FROM rust:1-trixie AS builder

WORKDIR /app

# Ensure we have Rust 1.91+ (required by aws-sdk dependencies)
RUN rustup update stable && rustup default stable

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config libssl-dev libpq-dev git cmake \
    && rm -rf /var/lib/apt/lists/*

# Copy workspace root config first (for dependency caching)
COPY Cargo.toml Cargo.lock ./

# Create a Docker-specific workspace that only includes API dependencies
# (exclude plonky3-poc and dilithium-stark which need nightly features)
RUN sed -i '/"src\/crypto\/circuits\/dilithium-stark"/d; /"src\/crypto\/circuits\/plonky3-poc"/d' Cargo.toml

# Copy only Cargo.toml files first to cache dependency builds
COPY src/api/api/Cargo.toml src/api/api/Cargo.toml
COPY src/crypto/shared-types/Cargo.toml src/crypto/shared-types/Cargo.toml
COPY src/services/event-bridge/Cargo.toml src/services/event-bridge/Cargo.toml
COPY src/services/monitor-bot/Cargo.toml src/services/monitor-bot/Cargo.toml

# Create dummy source files so cargo can resolve and build dependencies
RUN mkdir -p src/api/api/src && echo "fn main() {}" > src/api/api/src/main.rs && echo "" > src/api/api/src/lib.rs
RUN mkdir -p src/crypto/shared-types/src && echo "" > src/crypto/shared-types/src/lib.rs
RUN mkdir -p src/services/event-bridge/src && echo "fn main() {}" > src/services/event-bridge/src/main.rs && echo "" > src/services/event-bridge/src/lib.rs
RUN mkdir -p src/services/event-bridge/src/bin && echo "fn main() {}" > src/services/event-bridge/src/bin/indexer.rs && echo "fn main() {}" > src/services/event-bridge/src/bin/relayer.rs
RUN mkdir -p src/services/monitor-bot/src && echo "fn main() {}" > src/services/monitor-bot/src/main.rs

# Build dependencies only (this layer is cached if Cargo.toml/Cargo.lock don't change)
RUN cargo build --release -p quantum-shield-api 2>/dev/null || true

# Now copy actual source code
COPY src/api/api/ src/api/api/
COPY src/crypto/shared-types/ src/crypto/shared-types/
COPY src/services/ src/services/

# Touch main.rs to force recompile of our code (not dependencies)
RUN touch src/api/api/src/main.rs src/api/api/src/lib.rs

# Build only the API binary (dependencies already cached)
RUN cargo build --release -p quantum-shield-api

# ---- Runtime Stage ----
FROM debian:trixie-slim

RUN apt-get update && apt-get install -y \
    ca-certificates libssl3t64 libpq5 curl postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/target/release/api-server /app/api-server

# Copy config, migrations, and entrypoint
COPY src/api/api/config/ /app/config/
COPY src/api/api/migrations/ /app/migrations/
COPY src/api/api/entrypoint.sh /app/entrypoint.sh

ENV RUST_LOG=info
ENV DATABASE_URL=postgresql://quantum:quantum_dev@postgres:5432/quantum_shield
ENV REDIS_URL=redis://redis:6379

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/v1/health || exit 1

CMD ["/app/entrypoint.sh"]
