//! Performance Benchmark for Dilithium STARK Proof Generation
//!
//! Measures proof generation time and memory usage for real Dilithium signatures.

use std::time::{Duration, Instant};
use std::alloc::{GlobalAlloc, Layout, System};
use std::sync::atomic::{AtomicUsize, Ordering};

use dilithium_stark::{Witness, keccak256, N};
use dilithium_stark::witness::generate_full_trace;
use dilithium_stark::hash::generate_keccak_trace;
use dilithium_stark::ntt::{ntt_forward, ntt_inverse, generate_ntt_trace};
use dilithium_stark::verification::generate_verification_trace;

use pqcrypto_dilithium::dilithium3;
#[allow(unused_imports)]
use pqcrypto_traits::sign::{PublicKey, SecretKey, DetachedSignature};

// =============================================================================
// Memory Tracking Allocator
// =============================================================================

struct TrackingAllocator;

static ALLOCATED: AtomicUsize = AtomicUsize::new(0);
static PEAK: AtomicUsize = AtomicUsize::new(0);

unsafe impl GlobalAlloc for TrackingAllocator {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        let size = layout.size();
        let ptr = System.alloc(layout);
        if !ptr.is_null() {
            let current = ALLOCATED.fetch_add(size, Ordering::SeqCst) + size;
            PEAK.fetch_max(current, Ordering::SeqCst);
        }
        ptr
    }

    unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
        ALLOCATED.fetch_sub(layout.size(), Ordering::SeqCst);
        System.dealloc(ptr, layout);
    }
}

#[global_allocator]
static GLOBAL: TrackingAllocator = TrackingAllocator;

fn reset_memory_tracking() {
    ALLOCATED.store(0, Ordering::SeqCst);
    PEAK.store(0, Ordering::SeqCst);
}

fn get_peak_memory() -> usize {
    PEAK.load(Ordering::SeqCst)
}

// =============================================================================
// Benchmark Functions
// =============================================================================

struct BenchmarkResult {
    name: String,
    iterations: usize,
    total_time: Duration,
    avg_time: Duration,
    min_time: Duration,
    max_time: Duration,
    peak_memory_bytes: usize,
}

impl BenchmarkResult {
    fn print(&self) {
        println!("┌─────────────────────────────────────────────────────────────┐");
        println!("│ {} ", self.name);
        println!("├─────────────────────────────────────────────────────────────┤");
        println!("│ Iterations:   {:>10}                                   │", self.iterations);
        println!("│ Total Time:   {:>10.3} ms                                │", self.total_time.as_secs_f64() * 1000.0);
        println!("│ Avg Time:     {:>10.3} ms                                │", self.avg_time.as_secs_f64() * 1000.0);
        println!("│ Min Time:     {:>10.3} ms                                │", self.min_time.as_secs_f64() * 1000.0);
        println!("│ Max Time:     {:>10.3} ms                                │", self.max_time.as_secs_f64() * 1000.0);
        println!("│ Peak Memory:  {:>10.2} MB                                │", self.peak_memory_bytes as f64 / 1024.0 / 1024.0);
        println!("└─────────────────────────────────────────────────────────────┘");
        println!();
    }
}

fn benchmark<F, R>(name: &str, iterations: usize, mut f: F) -> BenchmarkResult
where
    F: FnMut() -> R,
{
    let mut times = Vec::with_capacity(iterations);

    // Warmup
    for _ in 0..3 {
        let _ = f();
    }

    reset_memory_tracking();

    let total_start = Instant::now();
    for _ in 0..iterations {
        let start = Instant::now();
        let _ = f();
        times.push(start.elapsed());
    }
    let total_time = total_start.elapsed();

    let peak_memory = get_peak_memory();

    let avg_time = total_time / iterations as u32;
    let min_time = *times.iter().min().unwrap();
    let max_time = *times.iter().max().unwrap();

    BenchmarkResult {
        name: name.to_string(),
        iterations,
        total_time,
        avg_time,
        min_time,
        max_time,
        peak_memory_bytes: peak_memory,
    }
}

// =============================================================================
// Main Benchmark Suite
// =============================================================================

fn main() {
    println!();
    println!("╔═══════════════════════════════════════════════════════════════╗");
    println!("║     Dilithium STARK Proof Generation Performance Benchmark     ║");
    println!("╠═══════════════════════════════════════════════════════════════╣");
    println!("║  Target: < 10 seconds total proof generation                   ║");
    println!("║  Platform: M3 MacBook Air baseline                             ║");
    println!("╚═══════════════════════════════════════════════════════════════╝");
    println!();

    // Generate test data
    println!("Generating test data (Dilithium keypair + signature)...");
    let (pk, sk) = dilithium3::keypair();
    let message = b"Benchmark test message for Dilithium STARK proof generation - Phase 4 Integration";
    let sig = dilithium3::detached_sign(message, &sk);

    let pk_bytes = pk.as_bytes().to_vec();
    let sig_bytes = sig.as_bytes().to_vec();
    let msg_bytes = message.to_vec();

    println!("  Public Key:  {} bytes", pk_bytes.len());
    println!("  Signature:   {} bytes", sig_bytes.len());
    println!("  Message:     {} bytes", msg_bytes.len());
    println!();

    // ==========================================================================
    // 1. Dilithium Signature Generation
    // ==========================================================================
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    println!("  SECTION 1: Dilithium Operations");
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    let result = benchmark("Dilithium Keypair Generation", 100, || {
        dilithium3::keypair()
    });
    result.print();

    let result = benchmark("Dilithium Signature Generation", 100, || {
        dilithium3::detached_sign(message, &sk)
    });
    result.print();

    let result = benchmark("Dilithium Signature Verification", 100, || {
        dilithium3::verify_detached_signature(&sig, message, &pk)
    });
    result.print();

    // ==========================================================================
    // 2. NTT Operations
    // ==========================================================================
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    println!("  SECTION 2: NTT Operations (Core of STARK)");
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    let mut test_poly = [0i32; N];
    for i in 0..N {
        test_poly[i] = (i as i32 * 17 + 3) % 8380417;
    }

    let result = benchmark("NTT Forward (256 coefficients)", 10000, || {
        let mut p = test_poly;
        ntt_forward(&mut p);
        p
    });
    result.print();

    let result = benchmark("NTT Inverse (256 coefficients)", 10000, || {
        let mut p = test_poly;
        ntt_inverse(&mut p);
        p
    });
    result.print();

    let result = benchmark("NTT Trace Generation", 1000, || {
        generate_ntt_trace(test_poly)
    });
    result.print();

    // ==========================================================================
    // 3. Hash Operations
    // ==========================================================================
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    println!("  SECTION 3: Keccak256 Hash Operations");
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    let result = benchmark("Keccak256 (public key, 1952 bytes)", 10000, || {
        keccak256(&pk_bytes)
    });
    result.print();

    let result = benchmark("Keccak256 Trace Generation", 1000, || {
        generate_keccak_trace(&pk_bytes)
    });
    result.print();

    // ==========================================================================
    // 4. Verification Trace
    // ==========================================================================
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    println!("  SECTION 4: Verification Trace Generation");
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    let result = benchmark("Verification Trace (includes sig verify)", 100, || {
        generate_verification_trace(&pk_bytes, &msg_bytes, &sig_bytes)
    });
    result.print();

    // ==========================================================================
    // 5. Full Trace Generation (End-to-End)
    // ==========================================================================
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    println!("  SECTION 5: Full STARK Trace Generation (E2E)");
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    let witness = Witness::new(pk_bytes.clone(), msg_bytes.clone(), sig_bytes.clone()).unwrap();

    let result = benchmark("Full Trace Generation", 100, || {
        generate_full_trace(&witness, 1)
    });
    result.print();

    // ==========================================================================
    // Summary
    // ==========================================================================
    println!("╔═══════════════════════════════════════════════════════════════╗");
    println!("║                        BENCHMARK SUMMARY                       ║");
    println!("╠═══════════════════════════════════════════════════════════════╣");

    // Run full trace once more for final measurement
    reset_memory_tracking();
    let start = Instant::now();
    let trace = generate_full_trace(&witness, 1).unwrap();
    let full_time = start.elapsed();
    let full_memory = get_peak_memory();

    println!("║                                                               ║");
    println!("║  Full Trace Generation:                                       ║");
    println!("║    Time:   {:>8.3} ms                                        ║", full_time.as_secs_f64() * 1000.0);
    println!("║    Memory: {:>8.2} MB                                        ║", full_memory as f64 / 1024.0 / 1024.0);
    println!("║                                                               ║");
    println!("║  Signature Valid: {}                                          ║", trace.public_inputs.signature_valid);
    println!("║                                                               ║");

    let target_ms = 10000.0;
    let current_ms = full_time.as_secs_f64() * 1000.0;
    let status = if current_ms < target_ms { "✅ PASS" } else { "❌ FAIL" };

    println!("║  Target: < 10,000 ms                                          ║");
    println!("║  Status: {}                                                   ║", status);
    println!("║                                                               ║");
    println!("╚═══════════════════════════════════════════════════════════════╝");

    // Note about what's missing
    println!();
    println!("Note: Current benchmark measures TRACE GENERATION only.");
    println!("Full STARK proof would additionally require:");
    println!("  - Trace polynomial commitment (Merkle tree)");
    println!("  - Constraint evaluation");
    println!("  - FRI protocol execution");
    println!("  - Query generation");
    println!();
    println!("Estimated total proof time: 5-10x trace generation time");
}
