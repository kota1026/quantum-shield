# =============================================================================
# Quantum Shield Monitor Bot - Dockerfile
# =============================================================================
# 24-hour unlock monitoring service for detecting suspicious activity.
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
RUN mkdir -p /var/log/qs-monitor-bot /var/lib/qs-monitor-bot && \
    chown -R quantum-shield:quantum-shield /var/log/qs-monitor-bot /var/lib/qs-monitor-bot

# Copy binary from builder
COPY --from=builder /build/target/release/monitor-bot /usr/local/bin/

# Switch to non-root user
USER quantum-shield

# Set working directory
WORKDIR /var/lib/qs-monitor-bot

# Expose metrics port
EXPOSE 9100

# Default command
CMD ["monitor-bot"]
