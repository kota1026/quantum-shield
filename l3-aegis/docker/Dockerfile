# =============================================================================
# L3-Aegis Node Dockerfile
# =============================================================================
# Multi-stage build for optimal image size
# CP-1 Compliant: SHA3-256, Dilithium-III only
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder
# -----------------------------------------------------------------------------
FROM rust:1.83-bookworm as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    clang \
    cmake \
    libclang-dev \
    librocksdb-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Create a new empty shell project
WORKDIR /build

# Copy the entire workspace
COPY Cargo.toml ./
COPY crates ./crates

# Build the project
RUN cargo build --release --package aegis-node --package aegis-cli

# -----------------------------------------------------------------------------
# Stage 2: Runtime
# -----------------------------------------------------------------------------
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    librocksdb7.8 \
    && rm -rf /var/lib/apt/lists/*

# Create aegis user for security
RUN useradd -m -u 1000 aegis

# Create data directories
RUN mkdir -p /data/aegis /config && chown -R aegis:aegis /data /config

# Copy binaries from builder
COPY --from=builder /build/target/release/aegis-node /usr/local/bin/
COPY --from=builder /build/target/release/aegis-cli /usr/local/bin/

# Switch to non-root user
USER aegis

# Default data directory
WORKDIR /data/aegis

# Expose ports
# P2P port
EXPOSE 30303
# RPC port
EXPOSE 8545
# Metrics port
EXPOSE 9090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD aegis-cli status --rpc-url http://localhost:8545 || exit 1

# Default command
ENTRYPOINT ["aegis-node"]
CMD ["--config", "/config/node.toml"]
