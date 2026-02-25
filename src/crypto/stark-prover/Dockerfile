# =============================================================================
# Quantum Shield STARK Prover - Dockerfile
# =============================================================================
# Zero-knowledge proof generation service using Winterfell.
# Requires significant CPU and memory resources.
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

# Build release binary with optimizations
RUN RUSTFLAGS="-C target-cpu=native" cargo build --release

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
RUN mkdir -p /var/log/qs-stark-prover /var/cache/stark-prover && \
    chown -R quantum-shield:quantum-shield /var/log/qs-stark-prover /var/cache/stark-prover

# Copy binary from builder
COPY --from=builder /build/target/release/stark-prover /usr/local/bin/

# Switch to non-root user
USER quantum-shield

# Set working directory
WORKDIR /var/cache/stark-prover

# Expose HTTP port
EXPOSE 3000

# Health check (longer timeout for proof generation)
HEALTHCHECK --interval=60s --timeout=30s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Default command
CMD ["stark-prover"]
