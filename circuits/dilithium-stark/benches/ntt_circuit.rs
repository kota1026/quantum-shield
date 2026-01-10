//! NTT Circuit Benchmarks
//!
//! Benchmarks for NTT operations in the Dilithium STARK circuit.

use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use dilithium_stark::ntt::{ntt_forward, ntt_inverse, generate_ntt_trace, N, Q};

fn bench_ntt_forward(c: &mut Criterion) {
    let mut poly = [0i32; N];
    for i in 0..N {
        poly[i] = ((i as i32 * 17 + 3) % Q) as i32;
    }

    c.bench_function("ntt_forward", |b| {
        b.iter(|| {
            let mut p = poly;
            ntt_forward(black_box(&mut p));
            p
        })
    });
}

fn bench_ntt_inverse(c: &mut Criterion) {
    let mut poly = [0i32; N];
    for i in 0..N {
        poly[i] = ((i as i32 * 17 + 3) % Q) as i32;
    }

    // Pre-transform to NTT domain
    ntt_forward(&mut poly);

    c.bench_function("ntt_inverse", |b| {
        b.iter(|| {
            let mut p = poly;
            ntt_inverse(black_box(&mut p));
            p
        })
    });
}

fn bench_ntt_roundtrip(c: &mut Criterion) {
    let mut poly = [0i32; N];
    for i in 0..N {
        poly[i] = ((i as i32 * 17 + 3) % Q) as i32;
    }

    c.bench_function("ntt_roundtrip", |b| {
        b.iter(|| {
            let mut p = poly;
            ntt_forward(black_box(&mut p));
            ntt_inverse(black_box(&mut p));
            p
        })
    });
}

fn bench_trace_generation(c: &mut Criterion) {
    let poly = [0i32; N];

    c.bench_function("ntt_trace_generation", |b| {
        b.iter(|| {
            generate_ntt_trace(black_box(poly))
        })
    });
}

criterion_group!(
    benches,
    bench_ntt_forward,
    bench_ntt_inverse,
    bench_ntt_roundtrip,
    bench_trace_generation,
);

criterion_main!(benches);
