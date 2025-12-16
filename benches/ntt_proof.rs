//! Benchmark for Dilithium NTT STARK proof generation
//!
//! Tests proof generation time on M3 Mac with various trace sizes.

use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion};
use winterfell::Prover;

use zk_dilithium_ntt::prover::DilithiumNttProver;
use zk_dilithium_ntt::trace::{build_ntt_trace, generate_test_coefficients};

fn bench_proof_generation(c: &mut Criterion) {
    let mut group = c.benchmark_group("NTT Proof Generation");

    // Test with different trace sizes
    // Target is 2^16 = 65536 rows for full Dilithium NTT
    for size_log in [8, 10, 12, 14, 16] {
        let size = 1 << size_log;

        // Skip very large sizes in quick benchmarks
        if size > 4096 {
            group.sample_size(10);
        }

        group.bench_with_input(
            BenchmarkId::new("trace_size", format!("2^{}", size_log)),
            &size,
            |b, &size| {
                // Pre-generate test data
                let coeffs = generate_test_coefficients(size * 2);
                let prover = DilithiumNttProver::with_fast_options();

                b.iter(|| {
                    let trace = build_ntt_trace(size, &coeffs);
                    let _proof = prover.prove(black_box(trace));
                });
            },
        );
    }

    group.finish();
}

fn bench_trace_generation(c: &mut Criterion) {
    let mut group = c.benchmark_group("Trace Generation");

    for size_log in [8, 10, 12, 14, 16] {
        let size = 1 << size_log;

        group.bench_with_input(
            BenchmarkId::new("trace_size", format!("2^{}", size_log)),
            &size,
            |b, &size| {
                let coeffs = generate_test_coefficients(size * 2);

                b.iter(|| {
                    build_ntt_trace(black_box(size), black_box(&coeffs))
                });
            },
        );
    }

    group.finish();
}

criterion_group!(benches, bench_proof_generation, bench_trace_generation);
criterion_main!(benches);
