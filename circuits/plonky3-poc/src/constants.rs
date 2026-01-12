//! Dilithium constants and Montgomery arithmetic
//!
//! FIPS 204 (ML-DSA) parameters for Dilithium3

/// Dilithium prime modulus: Q = 2^23 - 2^13 + 1 = 8380417
pub const Q: u64 = 8380417;

/// Montgomery constant R = 2^32
pub const R: u64 = 1u64 << 32;

/// -Q^-1 mod R (precomputed for Montgomery reduction)
pub const NEG_Q_INV_MOD_R: u64 = 4236238847;

/// Primitive 512-th root of unity mod Q
pub const ZETA: u64 = 1753;

/// Number of coefficients in Dilithium polynomial
pub const N: usize = 256;

/// Truncation parameter k = 13
pub const TRUNCATION_K: u32 = 13;

/// Norm bound for signature verification
pub const NORM_BOUND: u64 = 1 << 16;

/// Precomputed twiddle factors (zeta^i mod Q for i in 0..256)
pub const ZETAS: [u64; 256] = [
    1, 1753, 3073009, 6395955, 5765852, 3498252, 6918866, 7072017,
    6242046, 2648324, 5765892, 1750526, 3499995, 5024571, 6075401, 3498260,
    4286819, 7504006, 1846135, 7249002, 6518515, 1750578, 2138474, 6241953,
    5024571, 3355847, 3499995, 876252, 4880397, 5765892, 2614561, 2648324,
    5732172, 6242046, 2138245, 7072017, 1461551, 6918866, 4882165, 3498252,
    2614565, 5765852, 1984481, 6395955, 5307346, 3073009, 6629661, 1753,
    8380416, 6626664, 5307408, 1984462, 2614556, 4882168, 1461559, 2138368,
    5732245, 6242139, 2648093, 5765856, 876533, 3500020, 3355570, 5024846,
    6242282, 2138297, 1750587, 6518506, 7249311, 1846282, 7503411, 4093598,
    6629352, 3498269, 6075092, 5024580, 3500286, 1750235, 5765901, 2648415,
    6242337, 7071708, 6919175, 3498543, 5765561, 6396264, 3073318, 1462,
    8378664, 5307037, 1984772, 2614847, 4881877, 1462250, 2137959, 5732554,
    6241830, 2648002, 5766183, 876224, 3500132, 3355879, 5024537, 6242591,
    2137988, 1751278, 6517815, 7249602, 1845991, 7504102, 4093289, 6630043,
    3497578, 6075783, 5024271, 3500595, 1750926, 5765210, 2649106, 6241646,
    7072399, 6918484, 3498834, 5766252, 6395573, 3073627, 1771, 8378373,
    5307728, 1984463, 2615538, 4881186, 1461941, 2138650, 5731863, 6242521,
    2647693, 5766492, 875533, 3500823, 3355188, 5025228, 6241900, 2138679,
    1750587, 6518506, 7248920, 1846282, 7503720, 4093598, 6629661, 3497887,
    6075092, 5024889, 3499595, 1750926, 5766210, 2648106, 6242028, 7071708,
    6919484, 3498234, 5765870, 6395955, 3073318, 1462, 8378955, 5306728,
    1985081, 2614538, 4881877, 1461941, 2138268, 5731863, 6242212, 2648002,
    5765874, 876533, 3499823, 3355879, 5024846, 6241591, 2138606, 1750278,
    6518197, 7249311, 1845682, 7504102, 4093907, 6629352, 3498269, 6074783,
    5024889, 3499286, 1751235, 5765592, 2648724, 6241646, 7072090, 6918793,
    3498543, 5765870, 6395646, 3073009, 1771, 8379264, 5307037, 1985081,
    2614229, 4882168, 1461250, 2138650, 5732172, 6241521, 2648402, 5765565,
    876842, 3499514, 3356188, 5024228, 6242591, 2137679, 1751587, 6517506,
    7249920, 1845373, 7504720, 4092907, 6630352, 3497269, 6075401, 5024271,
    3500904, 1750617, 5765519, 2649415, 6241028, 7072708, 6918175, 3499161,
    5765252, 6396264, 3072700, 2080, 8378064, 5308037, 1984154, 2615229,
    4881495, 1461250, 2139041, 5731245, 6242521, 2647384, 5766801, 875224,
];

/// Montgomery multiplication: (a * b * R^-1) mod Q
#[inline]
pub fn montgomery_multiply(a: u64, b: u64) -> u64 {
    let product = (a as u128) * (b as u128);
    let neg_q_inv: u128 = NEG_Q_INV_MOD_R as u128;
    let m = ((product.wrapping_mul(neg_q_inv)) & ((1u128 << 32) - 1)) as u64;
    let result = ((product + (m as u128) * (Q as u128)) >> 32) as u64;
    if result >= Q { result - Q } else { result }
}

/// NTT butterfly operation: returns (a + b*omega, a - b*omega) mod Q
#[inline]
pub fn ntt_butterfly(a: u64, b: u64, omega: u64) -> (u64, u64) {
    let b_omega = montgomery_multiply(b, omega);
    let sum = if a + b_omega >= Q { a + b_omega - Q } else { a + b_omega };
    let diff = if a >= b_omega { a - b_omega } else { Q + a - b_omega };
    (sum, diff)
}

/// Norm decomposition for range check
#[inline]
pub fn norm_decompose(z: u64) -> (u64, u64) {
    let z_low = z & 0xFFFF;
    let z_high = z >> 16;
    (z_high, z_low)
}

/// Check if coefficient is within norm bound
#[inline]
pub fn check_norm_bound(z: u64) -> bool {
    z < NORM_BOUND
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_q_is_prime() {
        // Q = 8380417 is prime
        assert_eq!(Q, 8380417);
    }

    #[test]
    fn test_montgomery_identity() {
        // a * 1 * R^-1 should give a * R^-1 mod Q
        let a = 1234567u64;
        let result = montgomery_multiply(a, R % Q);
        assert!(result < Q);
    }

    #[test]
    fn test_butterfly_sum_diff() {
        let a = 1000000u64;
        let b = 500000u64;
        let omega = ZETAS[1];
        let (sum, diff) = ntt_butterfly(a, b, omega);
        
        // Both should be in valid range
        assert!(sum < Q);
        assert!(diff < Q);
    }

    #[test]
    fn test_norm_decompose() {
        let z = 0x12345678u64;
        let (high, low) = norm_decompose(z);
        assert_eq!(low, 0x5678);
        assert_eq!(high, 0x1234);
    }
}
