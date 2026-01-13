# =============================================================================
# Quantum Shield Event Bridge - Dockerfile
# =============================================================================
# Multi-stage build for L1/L3 event synchronization service.
# Supports WebSocket connections and RabbitMQ integration.
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
RUN mkdir -p /var/log/qs-event-bridge /var/lib/qs-event-bridge && \
    chown -R quantum-shield:quantum-shield /var/log/qs-event-bridge /var/lib/qs-event-bridge

# Copy binary from builder
COPY --from=builder /build/target/release/event-bridge /usr/local/bin/

# Switch to non-root user
USER quantum-shield

# Set working directory
WORKDIR /var/lib/qs-event-bridge

# Expose HTTP port
EXPOSE 8081

# Expose WebSocket port
EXPOSE 8082

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8081/health || exit 1

# Default command
CMD ["event-bridge"]
