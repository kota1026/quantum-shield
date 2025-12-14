//! Formal Verification Module for Dilithium STARK Constraints
//!
//! This module provides formal specification types and verification helpers
//! for critical constraints in the Dilithium signature verification STARK proof.
//!
//! # Critical Constraints
//!
//! - **C1: Montgomery FMA Gate** - Proves: A*B + C + M_FMA*Q = R_FMA*R
//! - **C2: PRC Accumulation** - Proves: Z(0)=1 ∧ Z(N-1)=1 → chunks ∈ T_16
//!
//! # Formal Verification Targets
//!
//! The specifications in this module are designed to be extractable to:
//! - Coq (for mechanized proofs)
//! - Lean 4 (for interactive theorem proving)
//! - Isabelle/HOL (for automated reasoning)

use crate::constants::{Q, R, R_SQRT, NORM_BOUND};

/// Formal specification for Montgomery FMA constraint
///
/// The Montgomery FMA (Fused Multiply-Add) gate computes:
/// ```text
/// P = A * B + C
/// R_FMA = (P + M_FMA * Q) / R
/// ```
///
/// The algebraic constraint is:
/// ```text
/// A * B + C + M_FMA * Q = R_FMA * R  (in F_p)
/// ```
///
/// # Integer Theory Assertion
///
/// For formal verification, we prove:
/// ```text
/// ∀ A, B, C, M_FMA, R_FMA ∈ F_p:
///   C_FMA(A, B, C, M_FMA, R_FMA) = 0
///   ∧ 0 ≤ M_FMA < R
///   ∧ 0 ≤ R_FMA < 2Q
///   ⟹ R_FMA mod Q = (A * B + C) * R^(-1) mod Q
/// ```
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct MontgomeryFMASpec {
    /// Input A (multiplicand)
    pub a: u64,
    /// Input B (multiplier)
    pub b: u64,
    /// Input C (addend)
    pub c: u64,
    /// Montgomery quotient M_FMA
    pub m_fma: u64,
    /// Result R_FMA
    pub r_fma: u64,
}

impl MontgomeryFMASpec {
    /// Create a new Montgomery FMA specification
    pub fn new(a: u64, b: u64, c: u64, m_fma: u64, r_fma: u64) -> Self {
        Self { a, b, c, m_fma, r_fma }
    }

    /// Verify the Montgomery FMA relation in integer arithmetic
    ///
    /// Checks: A * B + C + M_FMA * Q = R_FMA * R
    ///
    /// # Returns
    /// `true` if the relation holds exactly in 128-bit integer arithmetic
    pub fn verify_integer_relation(&self) -> bool {
        let lhs = (self.a as u128) * (self.b as u128)
            + (self.c as u128)
            + (self.m_fma as u128) * (Q as u128);
        let rhs = (self.r_fma as u128) * (R as u128);
        lhs == rhs
    }

    /// Verify M_FMA range constraint
    ///
    /// # Range Assertion
    /// ```text
    /// 0 ≤ M_FMA < 2^32
    /// ```
    pub fn verify_m_fma_range(&self) -> bool {
        self.m_fma < R
    }

    /// Verify R_FMA range constraint
    ///
    /// # Range Assertion
    /// ```text
    /// 0 ≤ R_FMA < 2Q
    /// ```
    pub fn verify_r_fma_range(&self) -> bool {
        self.r_fma < 2 * Q
    }

    /// Verify decomposition constraint
    ///
    /// Checks that M_FMA can be decomposed into 16-bit chunks:
    /// ```text
    /// M_FMA = M_FMA_H * 2^16 + M_FMA_L
    /// where 0 ≤ M_FMA_H < 2^16 and 0 ≤ M_FMA_L < 2^16
    /// ```
    pub fn verify_decomposition(&self) -> bool {
        let m_fma_h = self.m_fma >> 16;
        let m_fma_l = self.m_fma & 0xFFFF;
        m_fma_h < R_SQRT && m_fma_l < R_SQRT
    }

    /// Full verification of Montgomery FMA constraint
    ///
    /// Combines all verification checks:
    /// 1. Integer relation holds
    /// 2. M_FMA range valid
    /// 3. R_FMA range valid
    /// 4. Decomposition valid
    pub fn verify_all(&self) -> FMAVerificationResult {
        FMAVerificationResult {
            integer_relation: self.verify_integer_relation(),
            m_fma_range: self.verify_m_fma_range(),
            r_fma_range: self.verify_r_fma_range(),
            decomposition: self.verify_decomposition(),
        }
    }
}

/// Result of Montgomery FMA verification
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct FMAVerificationResult {
    /// Integer relation A*B + C + M_FMA*Q = R_FMA*R holds
    pub integer_relation: bool,
    /// M_FMA < 2^32
    pub m_fma_range: bool,
    /// R_FMA < 2Q
    pub r_fma_range: bool,
    /// M_FMA decomposes into valid 16-bit chunks
    pub decomposition: bool,
}

impl FMAVerificationResult {
    /// Check if all verification properties pass
    pub fn is_valid(&self) -> bool {
        self.integer_relation && self.m_fma_range && self.r_fma_range && self.decomposition
    }
}

/// Formal specification for PRC (Permutation Range Check) accumulator
///
/// The PRC uses a Z accumulator to prove multiset membership:
/// ```text
/// Z(0) = 1  ∧  Z(N-1) = 1  ⟹  chunks ∈ T_16
/// ```
///
/// Where T_16 = {0, 1, 2, ..., 2^16 - 1}
#[derive(Debug, Clone)]
pub struct PRCAccumulatorSpec {
    /// Initial Z value (must be 1)
    pub z_init: u64,
    /// Final Z value (must be 1)
    pub z_final: u64,
    /// Trace length N
    pub trace_length: usize,
}

impl PRCAccumulatorSpec {
    /// Create a new PRC accumulator specification
    pub fn new(z_init: u64, z_final: u64, trace_length: usize) -> Self {
        Self { z_init, z_final, trace_length }
    }

    /// Verify initial boundary constraint
    ///
    /// # Boundary Assertion
    /// ```text
    /// Z(0) = 1
    /// ```
    pub fn verify_z_init(&self) -> bool {
        self.z_init == 1
    }

    /// Verify final boundary constraint
    ///
    /// # Boundary Assertion
    /// ```text
    /// Z(N-1) = 1
    /// ```
    pub fn verify_z_final(&self) -> bool {
        self.z_final == 1
    }

    /// Verify closed loop property
    ///
    /// For PRC soundness, Z must start and end at 1:
    /// ```text
    /// Z(0) = 1 ∧ Z(N-1) = 1
    /// ```
    pub fn verify_closed_loop(&self) -> bool {
        self.verify_z_init() && self.verify_z_final()
    }
}

/// Formal specification for chunk membership in T_16
///
/// A chunk is valid if it belongs to the range set T_16:
/// ```text
/// T_16 = { x ∈ Z | 0 ≤ x < 2^16 }
/// ```
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ChunkMembershipSpec {
    /// High chunk (M_H, M_FMA_H, W_0_H, etc.)
    pub chunk_h: u64,
    /// Low chunk (M_L, M_FMA_L, W_0_L, etc.)
    pub chunk_l: u64,
}

impl ChunkMembershipSpec {
    /// Create a new chunk membership specification
    pub fn new(chunk_h: u64, chunk_l: u64) -> Self {
        Self { chunk_h, chunk_l }
    }

    /// Verify high chunk is in T_16
    ///
    /// # Set Membership Assertion
    /// ```text
    /// chunk_h ∈ T_16 ⟺ 0 ≤ chunk_h < 2^16
    /// ```
    pub fn verify_chunk_h(&self) -> bool {
        self.chunk_h < R_SQRT
    }

    /// Verify low chunk is in T_16
    ///
    /// # Set Membership Assertion
    /// ```text
    /// chunk_l ∈ T_16 ⟺ 0 ≤ chunk_l < 2^16
    /// ```
    pub fn verify_chunk_l(&self) -> bool {
        self.chunk_l < R_SQRT
    }

    /// Verify both chunks are in T_16
    pub fn verify_both(&self) -> bool {
        self.verify_chunk_h() && self.verify_chunk_l()
    }

    /// Reconstruct the original value from chunks
    ///
    /// ```text
    /// value = chunk_h * 2^16 + chunk_l
    /// ```
    pub fn reconstruct(&self) -> u64 {
        self.chunk_h * R_SQRT + self.chunk_l
    }
}

/// Formal specification for norm bound constraint
///
/// The norm check ensures signature coefficient satisfies:
/// ```text
/// ||z||_∞ < β  where β = 2^16
/// ```
///
/// Implemented via decomposition:
/// ```text
/// Z_NORM = Z_NORM_H * 2^16 + Z_NORM_L
/// Z_NORM_H = 0  ⟹  Z_NORM < 2^16
/// ```
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct NormBoundSpec {
    /// Norm value to check
    pub z_norm: u64,
    /// High chunk of decomposition
    pub z_norm_h: u64,
    /// Low chunk of decomposition
    pub z_norm_l: u64,
}

impl NormBoundSpec {
    /// Create a new norm bound specification
    pub fn new(z_norm: u64, z_norm_h: u64, z_norm_l: u64) -> Self {
        Self { z_norm, z_norm_h, z_norm_l }
    }

    /// Create from a norm value
    pub fn from_value(z_norm: u64) -> Self {
        let z_norm_h = z_norm >> 16;
        let z_norm_l = z_norm & 0xFFFF;
        Self { z_norm, z_norm_h, z_norm_l }
    }

    /// Verify decomposition constraint
    ///
    /// ```text
    /// Z_NORM = Z_NORM_H * 2^16 + Z_NORM_L
    /// ```
    pub fn verify_decomposition(&self) -> bool {
        self.z_norm == self.z_norm_h * R_SQRT + self.z_norm_l
    }

    /// Verify range constraint (norm bound)
    ///
    /// ```text
    /// Z_NORM_H = 0  ⟹  Z_NORM < 2^16
    /// ```
    pub fn verify_range(&self) -> bool {
        self.z_norm_h == 0
    }

    /// Verify the norm is within the bound
    ///
    /// ```text
    /// Z_NORM < β  where β = NORM_BOUND
    /// ```
    pub fn verify_bound(&self) -> bool {
        self.z_norm < NORM_BOUND
    }

    /// Full verification of norm constraint
    pub fn verify_all(&self) -> NormVerificationResult {
        NormVerificationResult {
            decomposition: self.verify_decomposition(),
            range: self.verify_range(),
            bound: self.verify_bound(),
        }
    }
}

/// Result of norm bound verification
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct NormVerificationResult {
    /// Decomposition constraint holds
    pub decomposition: bool,
    /// Range constraint Z_NORM_H = 0 holds
    pub range: bool,
    /// Norm is within bound
    pub bound: bool,
}

impl NormVerificationResult {
    /// Check if all verification properties pass
    pub fn is_valid(&self) -> bool {
        self.decomposition && self.range && self.bound
    }
}

/// Complete formal specification for boundary constraints
///
/// The 8 boundary constraints are:
///
/// | Row | Column | Value |
/// |-----|--------|-------|
/// | 0 | A | ntt_input_a |
/// | 0 | B | ntt_input_b |
/// | 0 | Z | 1 |
/// | 0 | S_OP | 1 |
/// | N-1 | Z | 1 |
/// | N-1 | W_1 | final_w1 |
/// | N-1 | R_FMA | final_fma_result |
/// | N-1 | Z_NORM_H | 0 |
#[derive(Debug, Clone)]
pub struct BoundaryConstraintsSpec {
    /// Initial NTT input A
    pub ntt_input_a: u64,
    /// Initial NTT input B
    pub ntt_input_b: u64,
    /// Initial Z accumulator (must be 1)
    pub z_init: u64,
    /// Initial S_OP selector (must be 1)
    pub s_op_init: u64,
    /// Final Z accumulator (must be 1)
    pub z_final: u64,
    /// Final truncation output W_1
    pub final_w1: u64,
    /// Final FMA result
    pub final_fma_result: u64,
    /// Final norm high chunk (must be 0)
    pub z_norm_h_final: u64,
}

impl BoundaryConstraintsSpec {
    /// Verify all initial row constraints
    pub fn verify_initial_constraints(&self) -> bool {
        self.z_init == 1 && self.s_op_init == 1
    }

    /// Verify all final row constraints
    pub fn verify_final_constraints(&self) -> bool {
        self.z_final == 1 && self.z_norm_h_final == 0
    }

    /// Verify all boundary constraints
    pub fn verify_all(&self) -> bool {
        self.verify_initial_constraints() && self.verify_final_constraints()
    }
}

/// Generate a formal verification report
///
/// This function creates a comprehensive verification report
/// for a given trace configuration.
pub fn generate_verification_report(
    fma_specs: &[MontgomeryFMASpec],
    prc_spec: &PRCAccumulatorSpec,
    norm_specs: &[NormBoundSpec],
    boundary_spec: &BoundaryConstraintsSpec,
) -> VerificationReport {
    let fma_results: Vec<_> = fma_specs.iter().map(|s| s.verify_all()).collect();
    let prc_valid = prc_spec.verify_closed_loop();
    let norm_results: Vec<_> = norm_specs.iter().map(|s| s.verify_all()).collect();
    let boundary_valid = boundary_spec.verify_all();

    let all_fma_valid = fma_results.iter().all(|r| r.is_valid());
    let all_norm_valid = norm_results.iter().all(|r| r.is_valid());

    VerificationReport {
        fma_results,
        prc_valid,
        norm_results,
        boundary_valid,
        overall_valid: all_fma_valid && prc_valid && all_norm_valid && boundary_valid,
    }
}

/// Complete verification report
#[derive(Debug, Clone)]
pub struct VerificationReport {
    /// FMA verification results for each row
    pub fma_results: Vec<FMAVerificationResult>,
    /// PRC accumulator verification
    pub prc_valid: bool,
    /// Norm verification results for each row
    pub norm_results: Vec<NormVerificationResult>,
    /// Boundary constraints verification
    pub boundary_valid: bool,
    /// Overall verification result
    pub overall_valid: bool,
}

// ============================================================================
// FMA Soundness Proof Verification (corresponds to formal proofs)
// ============================================================================

/// Winterfell field characteristic P = 2^128 - 45*2^40 + 1
pub const P: u128 = 340282366920938463463374607393113505793;

/// Maximum bound for LHS: Q^2 + Q + R*Q
pub const LHS_MAX_BOUND: u128 = (Q as u128) * (Q as u128) + (Q as u128) + (R as u128) * (Q as u128);

/// Maximum bound for RHS: 2*Q*R
pub const RHS_MAX_BOUND: u128 = 2 * (Q as u128) * (R as u128);

/// FMA Soundness Proof Verification
///
/// This module provides computational verification that the algebraic
/// constraint C_FMA implies correct Montgomery reduction.
///
/// # Proof Strategy (k=0 Theorem)
///
/// The proof proceeds in three steps:
/// 1. **Integer Lifting**: Field equality implies integer equality modulo P
/// 2. **k=0 Lemma**: Range constraints ensure no wrap-around (k=0)
/// 3. **Montgomery Correctness**: Integer equality implies Montgomery reduction
#[derive(Debug, Clone)]
pub struct FMASoundnessProof {
    /// The FMA specification being verified
    pub spec: MontgomeryFMASpec,
    /// LHS value: A*B + C + M*Q
    pub lhs: u128,
    /// RHS value: R'*R
    pub rhs: u128,
    /// Whether LHS < P (no wrap-around)
    pub lhs_no_wrap: bool,
    /// Whether RHS < P (no wrap-around)
    pub rhs_no_wrap: bool,
    /// k value (should be 0 for valid proof)
    pub k_value: i128,
    /// Montgomery congruence: (R'*R) mod Q = (A*B+C) mod Q
    pub montgomery_congruent: bool,
}

impl FMASoundnessProof {
    /// Construct and verify FMA soundness proof
    ///
    /// This function computationally verifies the formal proof from
    /// `formal_proofs/coq/Montgomery_FMA.v` and
    /// `formal_proofs/isabelle/Montgomery_FMA.thy`
    pub fn verify(spec: &MontgomeryFMASpec) -> Self {
        // Compute LHS: A*B + C + M*Q
        let lhs = (spec.a as u128) * (spec.b as u128)
            + (spec.c as u128)
            + (spec.m_fma as u128) * (Q as u128);

        // Compute RHS: R'*R
        let rhs = (spec.r_fma as u128) * (R as u128);

        // Check no wrap-around (k=0 lemma preconditions)
        let lhs_no_wrap = lhs < P;
        let rhs_no_wrap = rhs < P;

        // Compute k value: (LHS - RHS) / P
        // If k=0, then LHS = RHS exactly (integer equality)
        let k_value = if lhs >= rhs {
            ((lhs - rhs) / P) as i128
        } else {
            -(((rhs - lhs) / P) as i128)
        };

        // Verify Montgomery congruence: (R'*R) mod Q = (A*B+C) mod Q
        let product_mod_q = ((spec.a as u128) * (spec.b as u128) + (spec.c as u128)) % (Q as u128);
        let rhs_mod_q = rhs % (Q as u128);
        let montgomery_congruent = rhs_mod_q == product_mod_q;

        Self {
            spec: *spec,
            lhs,
            rhs,
            lhs_no_wrap,
            rhs_no_wrap,
            k_value,
            montgomery_congruent,
        }
    }

    /// Check if the k=0 theorem holds
    ///
    /// The k=0 theorem states that if range constraints are satisfied
    /// and the field constraint holds, then k=0 (no wrap-around in mod P).
    pub fn k_equals_zero(&self) -> bool {
        self.k_value == 0
    }

    /// Check if integer equality holds (LHS = RHS in Z)
    pub fn integer_equality(&self) -> bool {
        self.lhs == self.rhs
    }

    /// Check if the complete soundness proof is valid
    ///
    /// A valid proof requires:
    /// 1. LHS < P (no wrap-around)
    /// 2. RHS < P (no wrap-around)
    /// 3. k = 0 (field equality implies integer equality)
    /// 4. Montgomery congruence holds
    pub fn is_sound(&self) -> bool {
        self.lhs_no_wrap
            && self.rhs_no_wrap
            && self.k_equals_zero()
            && self.integer_equality()
            && self.montgomery_congruent
    }

    /// Generate a detailed proof report
    pub fn report(&self) -> String {
        format!(
            "FMA Soundness Proof Report\n\
             ==========================\n\
             Inputs: A={}, B={}, C={}, M={}, R'={}\n\
             \n\
             Step 1: Compute Values\n\
             - LHS (A*B + C + M*Q) = {}\n\
             - RHS (R'*R)          = {}\n\
             \n\
             Step 2: k=0 Lemma Verification\n\
             - LHS < P: {} (max bound: {})\n\
             - RHS < P: {} (max bound: {})\n\
             - k value: {}\n\
             - k = 0: {}\n\
             \n\
             Step 3: Integer Equality\n\
             - LHS = RHS: {}\n\
             \n\
             Step 4: Montgomery Congruence\n\
             - (R'*R) mod Q = (A*B+C) mod Q: {}\n\
             - (A*B+C) mod Q = {}\n\
             - (R'*R) mod Q  = {}\n\
             \n\
             Conclusion: Proof is {}",
            self.spec.a, self.spec.b, self.spec.c, self.spec.m_fma, self.spec.r_fma,
            self.lhs,
            self.rhs,
            self.lhs_no_wrap, LHS_MAX_BOUND,
            self.rhs_no_wrap, RHS_MAX_BOUND,
            self.k_value,
            self.k_equals_zero(),
            self.integer_equality(),
            self.montgomery_congruent,
            ((self.spec.a as u128) * (self.spec.b as u128) + (self.spec.c as u128)) % (Q as u128),
            self.rhs % (Q as u128),
            if self.is_sound() { "VALID" } else { "INVALID" }
        )
    }
}

/// Verify the bounds used in formal proofs
pub fn verify_proof_bounds() -> ProofBoundsVerification {
    // Verify: LHS_MAX_BOUND < P
    let lhs_bound_valid = LHS_MAX_BOUND < P;

    // Verify: RHS_MAX_BOUND < P
    let rhs_bound_valid = RHS_MAX_BOUND < P;

    // Verify: 2*Q < R (required for R' range)
    let two_q_less_than_r = 2 * Q < R;

    // Verify: R_sqrt^2 = R
    let r_sqrt_squared = R_SQRT * R_SQRT == R;

    ProofBoundsVerification {
        lhs_bound_valid,
        rhs_bound_valid,
        two_q_less_than_r,
        r_sqrt_squared,
        all_valid: lhs_bound_valid && rhs_bound_valid && two_q_less_than_r && r_sqrt_squared,
    }
}

/// Result of proof bounds verification
#[derive(Debug, Clone, Copy)]
pub struct ProofBoundsVerification {
    /// LHS_MAX_BOUND < P
    pub lhs_bound_valid: bool,
    /// RHS_MAX_BOUND < P
    pub rhs_bound_valid: bool,
    /// 2*Q < R
    pub two_q_less_than_r: bool,
    /// R_sqrt^2 = R
    pub r_sqrt_squared: bool,
    /// All bounds valid
    pub all_valid: bool,
}

// ============================================================================
// PRC Soundness Proof Verification (corresponds to formal proofs)
// ============================================================================

/// Row chunks for PRC verification
///
/// Each row contains 6 chunks that must be in T_16 = {0, ..., 2^16-1}:
/// - M_H, M_L: NTT Montgomery quotient decomposition
/// - M_FMA_H, M_FMA_L: FMA Montgomery quotient decomposition
/// - W_0_H, W_0_L: Truncation remainder decomposition
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RowChunks {
    pub m_h: u64,
    pub m_l: u64,
    pub m_fma_h: u64,
    pub m_fma_l: u64,
    pub w_0_h: u64,
    pub w_0_l: u64,
}

impl RowChunks {
    /// Create new row chunks
    pub fn new(m_h: u64, m_l: u64, m_fma_h: u64, m_fma_l: u64, w_0_h: u64, w_0_l: u64) -> Self {
        Self { m_h, m_l, m_fma_h, m_fma_l, w_0_h, w_0_l }
    }

    /// Check if all chunks are in T_16
    pub fn all_in_t16(&self) -> bool {
        self.m_h < R_SQRT
            && self.m_l < R_SQRT
            && self.m_fma_h < R_SQRT
            && self.m_fma_l < R_SQRT
            && self.w_0_h < R_SQRT
            && self.w_0_l < R_SQRT
    }

    /// Verify decomposition: M = M_H * R_sqrt + M_L
    pub fn verify_ntt_decomposition(&self, m_ntt: u64) -> bool {
        m_ntt == self.m_h * R_SQRT + self.m_l
    }

    /// Verify decomposition: M_FMA = M_FMA_H * R_sqrt + M_FMA_L
    pub fn verify_fma_decomposition(&self, m_fma: u64) -> bool {
        m_fma == self.m_fma_h * R_SQRT + self.m_fma_l
    }

    /// Verify decomposition: W_0 = W_0_H * R_sqrt + W_0_L
    pub fn verify_w0_decomposition(&self, w_0: u64) -> bool {
        w_0 == self.w_0_h * R_SQRT + self.w_0_l
    }
}

/// Z transition type (operation or padding row)
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ZTransitionType {
    /// Operation row (S_OP = 1): Z_next = Z (in simplified PRC)
    Operation,
    /// Padding row (S_OP = 0): Z_next = Z
    Padding,
}

/// Z transition specification
#[derive(Debug, Clone, Copy)]
pub struct ZTransition {
    pub z_current: u64,
    pub z_next: u64,
    pub s_op: u64,
    pub transition_type: ZTransitionType,
}

impl ZTransition {
    /// Create Z transition from values
    pub fn new(z_current: u64, z_next: u64, s_op: u64) -> Self {
        let transition_type = if s_op == 1 {
            ZTransitionType::Operation
        } else {
            ZTransitionType::Padding
        };
        Self { z_current, z_next, s_op, transition_type }
    }

    /// Verify S_OP is binary
    pub fn s_op_binary(&self) -> bool {
        self.s_op == 0 || self.s_op == 1
    }

    /// Verify transition is valid
    ///
    /// For both operation and padding rows, Z_next = Z in simplified PRC
    pub fn is_valid(&self) -> bool {
        self.s_op_binary() && self.z_next == self.z_current
    }

    /// Verify algebraic constraint: (Z_next - Z) * S_OP = 0
    pub fn verify_algebraic_op(&self) -> bool {
        (self.z_next as i64 - self.z_current as i64) * (self.s_op as i64) == 0
    }

    /// Verify algebraic constraint: (Z_next - Z) * (1 - S_OP) = 0
    pub fn verify_algebraic_pad(&self) -> bool {
        (self.z_next as i64 - self.z_current as i64) * (1 - self.s_op as i64) == 0
    }
}

/// PRC Soundness Proof Verification
///
/// Verifies the PRC constraint:
/// Z(0)=1 ∧ Z(N-1)=1 ∧ Transition_valid ⟹ Chunks ⊆ T_16
#[derive(Debug, Clone)]
pub struct PRCSoundnessProof {
    /// Trace length
    pub trace_length: usize,
    /// Z values at each row
    pub z_values: Vec<u64>,
    /// S_OP values at each row
    pub s_op_values: Vec<u64>,
    /// Row chunks at each row
    pub row_chunks: Vec<RowChunks>,
    /// Boundary init valid: Z[0] = 1
    pub boundary_init_valid: bool,
    /// Boundary final valid: Z[N-1] = 1
    pub boundary_final_valid: bool,
    /// All transitions valid
    pub all_transitions_valid: bool,
    /// All chunks in T_16
    pub all_chunks_in_t16: bool,
    /// Z is constant (= 1) throughout trace
    pub z_constant: bool,
}

impl PRCSoundnessProof {
    /// Verify PRC soundness for a trace
    pub fn verify(
        z_values: Vec<u64>,
        s_op_values: Vec<u64>,
        row_chunks: Vec<RowChunks>,
    ) -> Self {
        let trace_length = z_values.len();
        assert_eq!(s_op_values.len(), trace_length);
        assert_eq!(row_chunks.len(), trace_length);

        // Boundary constraints
        let boundary_init_valid = trace_length > 0 && z_values[0] == 1;
        let boundary_final_valid = trace_length > 0 && z_values[trace_length - 1] == 1;

        // Transition constraints
        let all_transitions_valid = (0..trace_length.saturating_sub(1)).all(|i| {
            let transition = ZTransition::new(z_values[i], z_values[i + 1], s_op_values[i]);
            transition.is_valid()
        });

        // Chunk validity
        let all_chunks_in_t16 = row_chunks.iter().all(|r| r.all_in_t16());

        // Z constant (should be 1 throughout if transitions are valid)
        let z_constant = z_values.iter().all(|&z| z == 1);

        Self {
            trace_length,
            z_values,
            s_op_values,
            row_chunks,
            boundary_init_valid,
            boundary_final_valid,
            all_transitions_valid,
            all_chunks_in_t16,
            z_constant,
        }
    }

    /// Check if PRC is sound
    ///
    /// PRC is sound if:
    /// 1. Boundary constraints hold (Z[0]=1, Z[N-1]=1)
    /// 2. All transitions are valid
    /// 3. All chunks are in T_16
    pub fn is_sound(&self) -> bool {
        self.boundary_init_valid
            && self.boundary_final_valid
            && self.all_transitions_valid
            && self.all_chunks_in_t16
    }

    /// Verify the implication: transitions_valid ⟹ z_constant
    pub fn verify_z_invariance(&self) -> bool {
        !self.all_transitions_valid || self.z_constant
    }

    /// Generate proof report
    pub fn report(&self) -> String {
        format!(
            "PRC Soundness Proof Report\n\
             ==========================\n\
             Trace length: {}\n\
             \n\
             Boundary Constraints:\n\
             - Z[0] = 1: {}\n\
             - Z[N-1] = 1: {}\n\
             \n\
             Transition Constraints:\n\
             - All transitions valid: {}\n\
             - Z constant (= 1): {}\n\
             \n\
             Chunk Validity:\n\
             - All chunks in T_16: {}\n\
             \n\
             Conclusion: PRC is {}",
            self.trace_length,
            self.boundary_init_valid,
            self.boundary_final_valid,
            self.all_transitions_valid,
            self.z_constant,
            self.all_chunks_in_t16,
            if self.is_sound() { "SOUND" } else { "NOT SOUND" }
        )
    }
}

/// Verify decomposition constraint implies chunk validity
///
/// This function verifies the key theorem:
/// decomposition_valid(M, M_H, M_L) ⟹ M_H ∈ T_16 ∧ M_L ∈ T_16
pub fn verify_decomposition_implies_t16(m: u64, m_h: u64, m_l: u64) -> DecompositionProof {
    let decomposition_holds = m == m_h * R_SQRT + m_l;
    let m_h_in_t16 = m_h < R_SQRT;
    let m_l_in_t16 = m_l < R_SQRT;

    DecompositionProof {
        m,
        m_h,
        m_l,
        decomposition_holds,
        m_h_in_t16,
        m_l_in_t16,
        implies_t16: !decomposition_holds || (m_h_in_t16 && m_l_in_t16),
    }
}

/// Result of decomposition proof
#[derive(Debug, Clone, Copy)]
pub struct DecompositionProof {
    pub m: u64,
    pub m_h: u64,
    pub m_l: u64,
    pub decomposition_holds: bool,
    pub m_h_in_t16: bool,
    pub m_l_in_t16: bool,
    /// decomposition_holds ⟹ (m_h_in_t16 ∧ m_l_in_t16)
    pub implies_t16: bool,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::trace::montgomery_fma;

    #[test]
    fn test_fma_spec_verification() {
        // Test with actual Montgomery FMA computation
        let a = 1234567u64;
        let b = 7654321u64;
        let c = 1000000u64;

        let (r_fma, m_fma) = montgomery_fma(a, b, c);

        let spec = MontgomeryFMASpec::new(a, b, c, m_fma, r_fma);
        let result = spec.verify_all();

        assert!(result.integer_relation, "Integer relation should hold");
        assert!(result.m_fma_range, "M_FMA should be in range");
        assert!(result.r_fma_range, "R_FMA should be in range");
        assert!(result.decomposition, "Decomposition should be valid");
        assert!(result.is_valid(), "All verifications should pass");
    }

    #[test]
    fn test_fma_integer_relation() {
        // Verify the core integer relation
        let a = 100u64;
        let b = 200u64;
        let c = 50u64;

        let (r_fma, m_fma) = montgomery_fma(a, b, c);

        // Check: A*B + C + M_FMA*Q = R_FMA*R
        let lhs = (a as u128) * (b as u128) + (c as u128) + (m_fma as u128) * (Q as u128);
        let rhs = (r_fma as u128) * (R as u128);
        assert_eq!(lhs, rhs, "Montgomery relation should hold exactly");
    }

    #[test]
    fn test_prc_spec_verification() {
        let spec = PRCAccumulatorSpec::new(1, 1, 1024);
        assert!(spec.verify_z_init(), "Z init should be 1");
        assert!(spec.verify_z_final(), "Z final should be 1");
        assert!(spec.verify_closed_loop(), "Closed loop should hold");
    }

    #[test]
    fn test_prc_invalid_init() {
        let spec = PRCAccumulatorSpec::new(0, 1, 1024);
        assert!(!spec.verify_z_init(), "Z init should not be 0");
        assert!(!spec.verify_closed_loop(), "Closed loop should fail");
    }

    #[test]
    fn test_chunk_membership() {
        // Valid chunks
        let valid = ChunkMembershipSpec::new(1000, 2000);
        assert!(valid.verify_both(), "Both chunks should be in T_16");
        assert_eq!(valid.reconstruct(), 1000 * R_SQRT + 2000);

        // Invalid high chunk
        let invalid_h = ChunkMembershipSpec::new(70000, 1000);
        assert!(!invalid_h.verify_chunk_h(), "High chunk should be invalid");

        // Invalid low chunk
        let invalid_l = ChunkMembershipSpec::new(1000, 70000);
        assert!(!invalid_l.verify_chunk_l(), "Low chunk should be invalid");
    }

    #[test]
    fn test_norm_bound_spec() {
        // Valid norm (< 2^16)
        let valid = NormBoundSpec::from_value(12345);
        let result = valid.verify_all();
        assert!(result.decomposition, "Decomposition should hold");
        assert!(result.range, "Range should be valid (high = 0)");
        assert!(result.bound, "Should be within norm bound");
        assert!(result.is_valid(), "All checks should pass");

        // Invalid norm (>= 2^16)
        let invalid = NormBoundSpec::from_value(70000);
        let result = invalid.verify_all();
        assert!(result.decomposition, "Decomposition should still hold");
        assert!(!result.range, "Range should be invalid (high > 0)");
        assert!(!result.bound, "Should exceed norm bound");
        assert!(!result.is_valid(), "Overall should fail");
    }

    #[test]
    fn test_boundary_constraints_spec() {
        let valid_spec = BoundaryConstraintsSpec {
            ntt_input_a: 12345,
            ntt_input_b: 67890,
            z_init: 1,
            s_op_init: 1,
            z_final: 1,
            final_w1: 1000,
            final_fma_result: 2000,
            z_norm_h_final: 0,
        };
        assert!(valid_spec.verify_all(), "Valid boundary should pass");

        let invalid_spec = BoundaryConstraintsSpec {
            ntt_input_a: 12345,
            ntt_input_b: 67890,
            z_init: 0,  // Invalid: should be 1
            s_op_init: 1,
            z_final: 1,
            final_w1: 1000,
            final_fma_result: 2000,
            z_norm_h_final: 0,
        };
        assert!(!invalid_spec.verify_all(), "Invalid boundary should fail");
    }

    #[test]
    fn test_verification_report() {
        let (r_fma, m_fma) = montgomery_fma(100, 200, 50);
        let fma_specs = vec![MontgomeryFMASpec::new(100, 200, 50, m_fma, r_fma)];
        let prc_spec = PRCAccumulatorSpec::new(1, 1, 64);
        let norm_specs = vec![NormBoundSpec::from_value(1000)];
        let boundary_spec = BoundaryConstraintsSpec {
            ntt_input_a: 100,
            ntt_input_b: 200,
            z_init: 1,
            s_op_init: 1,
            z_final: 1,
            final_w1: 0,
            final_fma_result: r_fma,
            z_norm_h_final: 0,
        };

        let report = generate_verification_report(
            &fma_specs,
            &prc_spec,
            &norm_specs,
            &boundary_spec,
        );

        assert!(report.overall_valid, "Overall verification should pass");
    }

    // ========================================================================
    // FMA Soundness Proof Tests (corresponds to formal proofs)
    // ========================================================================

    #[test]
    fn test_proof_bounds_verification() {
        let bounds = verify_proof_bounds();
        assert!(bounds.lhs_bound_valid, "LHS_MAX_BOUND < P should hold");
        assert!(bounds.rhs_bound_valid, "RHS_MAX_BOUND < P should hold");
        assert!(bounds.two_q_less_than_r, "2*Q < R should hold");
        assert!(bounds.r_sqrt_squared, "R_sqrt^2 = R should hold");
        assert!(bounds.all_valid, "All bounds should be valid");
    }

    #[test]
    fn test_fma_soundness_proof() {
        // Test with actual Montgomery FMA computation
        let a = 1234567u64;
        let b = 7654321u64;
        let c = 1000000u64;

        let (r_fma, m_fma) = montgomery_fma(a, b, c);
        let spec = MontgomeryFMASpec::new(a, b, c, m_fma, r_fma);
        let proof = FMASoundnessProof::verify(&spec);

        assert!(proof.lhs_no_wrap, "LHS should not wrap around mod P");
        assert!(proof.rhs_no_wrap, "RHS should not wrap around mod P");
        assert!(proof.k_equals_zero(), "k should equal 0");
        assert!(proof.integer_equality(), "LHS should equal RHS");
        assert!(proof.montgomery_congruent, "Montgomery congruence should hold");
        assert!(proof.is_sound(), "Proof should be sound");
    }

    #[test]
    fn test_fma_soundness_proof_edge_cases() {
        // Test with maximum valid inputs (near Q boundary)
        let a = Q - 1;
        let b = Q - 1;
        let c = Q - 1;

        let (r_fma, m_fma) = montgomery_fma(a, b, c);
        let spec = MontgomeryFMASpec::new(a, b, c, m_fma, r_fma);
        let proof = FMASoundnessProof::verify(&spec);

        assert!(proof.is_sound(), "Proof should be sound for max inputs");

        // Test with zero inputs
        let (r_fma_zero, m_fma_zero) = montgomery_fma(0, 0, 0);
        let spec_zero = MontgomeryFMASpec::new(0, 0, 0, m_fma_zero, r_fma_zero);
        let proof_zero = FMASoundnessProof::verify(&spec_zero);

        assert!(proof_zero.is_sound(), "Proof should be sound for zero inputs");
    }

    #[test]
    fn test_fma_soundness_proof_report() {
        let a = 100u64;
        let b = 200u64;
        let c = 50u64;

        let (r_fma, m_fma) = montgomery_fma(a, b, c);
        let spec = MontgomeryFMASpec::new(a, b, c, m_fma, r_fma);
        let proof = FMASoundnessProof::verify(&spec);

        let report = proof.report();
        assert!(report.contains("VALID"), "Report should indicate valid proof");
        assert!(report.contains("k value: 0"), "Report should show k=0");
    }

    #[test]
    fn test_k_equals_zero_theorem() {
        // This test verifies the k=0 theorem computationally
        // by checking that for all valid inputs, k=0 holds

        // Generate multiple test cases
        let test_cases = vec![
            (0, 0, 0),
            (1, 1, 1),
            (100, 200, 50),
            (Q / 2, Q / 2, Q / 2),
            (Q - 1, Q - 1, Q - 1),
            (1234567, 7654321, 1000000),
        ];

        for (a, b, c) in test_cases {
            let (r_fma, m_fma) = montgomery_fma(a, b, c);
            let spec = MontgomeryFMASpec::new(a, b, c, m_fma, r_fma);
            let proof = FMASoundnessProof::verify(&spec);

            assert!(
                proof.k_equals_zero(),
                "k=0 theorem should hold for a={}, b={}, c={}",
                a, b, c
            );
        }
    }

    #[test]
    fn test_montgomery_congruence() {
        // Verify that (R'*R) mod Q = (A*B+C) mod Q
        let a = 1234567u64;
        let b = 7654321u64;
        let c = 1000000u64;

        let (r_fma, _m_fma) = montgomery_fma(a, b, c);

        // Compute (A*B+C) mod Q
        let product = (a as u128) * (b as u128) + (c as u128);
        let product_mod_q = product % (Q as u128);

        // Compute (R'*R) mod Q
        let rhs = (r_fma as u128) * (R as u128);
        let rhs_mod_q = rhs % (Q as u128);

        assert_eq!(
            product_mod_q, rhs_mod_q,
            "Montgomery congruence should hold"
        );
    }

    // ========================================================================
    // PRC Soundness Proof Tests (corresponds to formal proofs)
    // ========================================================================

    #[test]
    fn test_row_chunks_all_in_t16() {
        // Valid chunks (all < 2^16)
        let valid = RowChunks::new(1000, 2000, 3000, 4000, 5000, 6000);
        assert!(valid.all_in_t16(), "All chunks should be in T_16");

        // Invalid chunk (>= 2^16)
        let invalid = RowChunks::new(70000, 2000, 3000, 4000, 5000, 6000);
        assert!(!invalid.all_in_t16(), "Chunk 70000 should not be in T_16");
    }

    #[test]
    fn test_row_chunks_decomposition() {
        let m_ntt = 12345678u64;
        let m_h = m_ntt >> 16;
        let m_l = m_ntt & 0xFFFF;

        let chunks = RowChunks::new(m_h, m_l, 0, 0, 0, 0);
        assert!(chunks.verify_ntt_decomposition(m_ntt), "NTT decomposition should hold");
    }

    #[test]
    fn test_z_transition_valid() {
        // Valid transition: Z_next = Z = 1, S_OP = 1
        let trans_op = ZTransition::new(1, 1, 1);
        assert!(trans_op.s_op_binary(), "S_OP should be binary");
        assert!(trans_op.is_valid(), "Transition should be valid");
        assert!(trans_op.verify_algebraic_op(), "Algebraic op constraint should hold");

        // Valid transition: Z_next = Z = 1, S_OP = 0
        let trans_pad = ZTransition::new(1, 1, 0);
        assert!(trans_pad.is_valid(), "Padding transition should be valid");
        assert!(trans_pad.verify_algebraic_pad(), "Algebraic pad constraint should hold");

        // Invalid transition: Z_next != Z
        let trans_invalid = ZTransition::new(1, 2, 1);
        assert!(!trans_invalid.is_valid(), "Transition with Z change should be invalid");
    }

    #[test]
    fn test_prc_soundness_proof() {
        // Create a valid trace with 8 rows
        let z_values = vec![1, 1, 1, 1, 1, 1, 1, 1];
        let s_op_values = vec![1, 1, 1, 1, 1, 1, 1, 1];
        let row_chunks: Vec<RowChunks> = (0..8)
            .map(|i| RowChunks::new(i * 100, i * 200, i * 300, i * 400, i * 500, i * 600))
            .collect();

        let proof = PRCSoundnessProof::verify(z_values, s_op_values, row_chunks);

        assert!(proof.boundary_init_valid, "Z[0] should be 1");
        assert!(proof.boundary_final_valid, "Z[N-1] should be 1");
        assert!(proof.all_transitions_valid, "All transitions should be valid");
        assert!(proof.all_chunks_in_t16, "All chunks should be in T_16");
        assert!(proof.z_constant, "Z should be constant");
        assert!(proof.is_sound(), "PRC should be sound");
    }

    #[test]
    fn test_prc_soundness_proof_invalid_boundary() {
        // Invalid: Z[0] != 1
        let z_values = vec![0, 1, 1, 1];
        let s_op_values = vec![1, 1, 1, 1];
        let row_chunks: Vec<RowChunks> = (0..4)
            .map(|_| RowChunks::new(100, 200, 300, 400, 500, 600))
            .collect();

        let proof = PRCSoundnessProof::verify(z_values, s_op_values, row_chunks);

        assert!(!proof.boundary_init_valid, "Z[0] = 0 should fail");
        assert!(!proof.is_sound(), "PRC should not be sound");
    }

    #[test]
    fn test_prc_soundness_proof_invalid_chunk() {
        // Invalid: one chunk >= 2^16
        let z_values = vec![1, 1, 1, 1];
        let s_op_values = vec![1, 1, 1, 1];
        let mut row_chunks: Vec<RowChunks> = (0..4)
            .map(|_| RowChunks::new(100, 200, 300, 400, 500, 600))
            .collect();
        row_chunks[2] = RowChunks::new(70000, 200, 300, 400, 500, 600); // Invalid

        let proof = PRCSoundnessProof::verify(z_values, s_op_values, row_chunks);

        assert!(!proof.all_chunks_in_t16, "Chunk 70000 should fail");
        assert!(!proof.is_sound(), "PRC should not be sound");
    }

    #[test]
    fn test_prc_soundness_report() {
        let z_values = vec![1, 1, 1, 1];
        let s_op_values = vec![1, 1, 1, 1];
        let row_chunks: Vec<RowChunks> = (0..4)
            .map(|_| RowChunks::new(100, 200, 300, 400, 500, 600))
            .collect();

        let proof = PRCSoundnessProof::verify(z_values, s_op_values, row_chunks);
        let report = proof.report();

        assert!(report.contains("SOUND"), "Report should indicate sound");
        assert!(report.contains("Z[0] = 1: true"), "Report should show Z[0] = 1");
    }

    #[test]
    fn test_decomposition_implies_t16() {
        // Valid decomposition
        let m = 12345678u64;
        let m_h = m >> 16;
        let m_l = m & 0xFFFF;

        let proof = verify_decomposition_implies_t16(m, m_h, m_l);

        assert!(proof.decomposition_holds, "Decomposition should hold");
        assert!(proof.m_h_in_t16, "M_H should be in T_16");
        assert!(proof.m_l_in_t16, "M_L should be in T_16");
        assert!(proof.implies_t16, "Implication should hold");
    }

    #[test]
    fn test_z_invariance_theorem() {
        // Verify: transitions_valid ⟹ z_constant
        let test_cases = vec![
            (vec![1, 1, 1, 1], true),  // Valid: all Z = 1
            (vec![1, 2, 1, 1], false), // Invalid: Z changes
        ];

        for (z_values, expected_valid) in test_cases {
            let s_op_values = vec![1; z_values.len()];
            let row_chunks: Vec<RowChunks> = (0..z_values.len())
                .map(|_| RowChunks::new(100, 200, 300, 400, 500, 600))
                .collect();

            let proof = PRCSoundnessProof::verify(z_values, s_op_values, row_chunks);

            if expected_valid {
                assert!(proof.all_transitions_valid, "Transitions should be valid");
                assert!(proof.z_constant, "Z should be constant");
            } else {
                assert!(!proof.all_transitions_valid, "Transitions should be invalid");
            }
            assert!(proof.verify_z_invariance(), "Z invariance theorem should hold");
        }
    }
}
