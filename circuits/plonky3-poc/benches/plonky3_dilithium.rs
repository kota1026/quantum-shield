//! Plonky3 Dilithium STARK Benchmark
//!
//! Compares native STARK performance against SP1 zkVM baseline

use criterion::{criterion_group, criterion_main, BenchmarkId, Criterion, Throughput};
use plonky3_poc::{prove_dilithium, trace::DilithiumTrace};
use p3_baby_bear::BabyBear;

fn bench_trace_generation(c: &mut Criterion) {
    let mut group = c.benchmark_group("trace_generation");
    
    for size in [256, 512, 1024, 2048, 4096].iter() {
        group.throughput(Throughput::Elements(*size as u64));
        group.bench_with_input(
            BenchmarkId::from_parameter(size),
            size,
            |b, &size| {
                b.iter(|| {
                    DilithiumTrace::<BabyBear>::generate_simple_trace(size)
                });
            },
        );
    }
    
    group.finish();
}

fn bench_full_prove(c: &mut Criterion) {
    let mut group = c.benchmark_group("full_prove");
    group.sample_size(10); // Reduce sample size for slower benchmarks
    
    for size in [256, 512, 1024, 2048, 4096].iter() {
        group.throughput(Throughput::Elements(*size as u64));
        group.bench_with_input(
            BenchmarkId::from_parameter(size),
            size,
            |b, &size| {
                b.iter(|| prove_dilithium(size));
            },
        );
    }
    
    group.finish();
}

fn bench_montgomery_operations(c: &mut Criterion) {
    use plonky3_poc::constants::{montgomery_multiply, ntt_butterfly, ZETAS, Q};
    
    let mut group = c.benchmark_group("montgomery_ops");
    
    group.bench_function("montgomery_multiply", |b| {
        let a = 1234567u64;
        let omega = ZETAS[1];
        b.iter(|| montgomery_multiply(a, omega));
    });
    
    group.bench_function("ntt_butterfly", |b| {
        let a = 1000000u64;
        let c = 2000000u64;
        let omega = ZETAS[1];
        b.iter(|| ntt_butterfly(a, c, omega));
    });
    
    group.bench_function("full_ntt_layer", |b| {
        let coeffs: Vec<u64> = (0..256).map(|i| i % Q).collect();
        b.iter(|| {
            let mut result = Vec::with_capacity(256);
            for i in 0..128 {
                let (sum, diff) = ntt_butterfly(coeffs[i], coeffs[i + 128], ZETAS[i]);
                result.push(sum);
                result.push(diff);
            }
            result
        });
    });
    
    group.finish();
}

criterion_group!(
    benches,
    bench_trace_generation,
    bench_full_prove,
    bench_montgomery_operations,
);

criterion_main!(benches);
