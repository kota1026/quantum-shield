# =============================================================================
# Quantum Shield API - Dockerfile
# =============================================================================
# Multi-stage build for optimal image size.
# CP-1 Compliant: Uses FIPS 204 (Dilithium) for signature verification.
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder
# -----------------------------------------------------------------------------
FROM rust:1.83-bookworm AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    clang \
    cmake \
    libclang-dev \
    libssl-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Create build directory
WORKDIR /build

# Copy workspace files
COPY Cargo.toml ./
COPY src ./src

# Build release binary
RUN cargo build --release

# -----------------------------------------------------------------------------
# Stage 2: Runtime
# -----------------------------------------------------------------------------
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 quantum-shield

# Create necessary directories
RUN mkdir -p /var/log/qs-api /var/lib/qs-api && \
    chown -R quantum-shield:quantum-shield /var/log/qs-api /var/lib/qs-api

# Copy binary from builder
COPY --from=builder /build/target/release/quantum-shield-api /usr/local/bin/

# Switch to non-root user
USER quantum-shield

# Set working directory
WORKDIR /var/lib/qs-api

# Expose API port
EXPOSE 8080

# Expose metrics port
EXPOSE 9100

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/v1/health || exit 1

# Default command
CMD ["quantum-shield-api"]
