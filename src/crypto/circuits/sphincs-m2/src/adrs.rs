//! SPHINCS+ address (FIPS 205 §4.2, 32-byte uncompressed form used by the
//! SHAKE parameter sets).
//!
//! ```text
//! offset  0.. 4  layer address
//!         4..16  tree address (big-endian)
//!        16..20  type
//!        20..24  word1  (key pair address / padding)
//!        24..28  word2  (chain address / tree height)
//!        28..32  word3  (hash address / tree index)
//! ```

/// Address types (FIPS 205 Table 1).
pub const WOTS_HASH: u32 = 0;
pub const WOTS_PK: u32 = 1;
pub const TREE: u32 = 2;
pub const FORS_TREE: u32 = 3;
pub const FORS_ROOTS: u32 = 4;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Adrs(pub [u8; 32]);

impl Adrs {
    pub fn new() -> Self {
        Adrs([0u8; 32])
    }

    fn put_u32(&mut self, offset: usize, v: u32) {
        self.0[offset..offset + 4].copy_from_slice(&v.to_be_bytes());
    }

    fn get_u32(&self, offset: usize) -> u32 {
        u32::from_be_bytes(self.0[offset..offset + 4].try_into().unwrap())
    }

    pub fn set_layer_address(&mut self, v: u32) {
        self.put_u32(0, v);
    }

    /// Tree address is a 12-byte big-endian field; `h - h/d = 54` bits fit
    /// in the low 8 bytes, so the upper 4 bytes are always zero here.
    pub fn set_tree_address(&mut self, v: u64) {
        self.0[4..8].fill(0);
        self.0[8..16].copy_from_slice(&v.to_be_bytes());
    }

    /// `ADRS.setTypeAndClear(Y)`: set the type word and zero the last 12 bytes.
    pub fn set_type_and_clear(&mut self, ty: u32) {
        self.put_u32(16, ty);
        self.0[20..32].fill(0);
    }

    pub fn set_key_pair_address(&mut self, v: u32) {
        self.put_u32(20, v);
    }

    pub fn key_pair_address(&self) -> u32 {
        self.get_u32(20)
    }

    pub fn set_chain_address(&mut self, v: u32) {
        self.put_u32(24, v);
    }

    pub fn set_tree_height(&mut self, v: u32) {
        self.put_u32(24, v);
    }

    pub fn set_hash_address(&mut self, v: u32) {
        self.put_u32(28, v);
    }

    pub fn set_tree_index(&mut self, v: u32) {
        self.put_u32(28, v);
    }

    pub fn tree_index(&self) -> u32 {
        self.get_u32(28)
    }
}

impl Default for Adrs {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn set_type_and_clear_zeroes_tail() {
        let mut a = Adrs::new();
        a.set_key_pair_address(0xAABBCCDD);
        a.set_chain_address(0x11223344);
        a.set_hash_address(0x55667788);
        a.set_type_and_clear(FORS_ROOTS);

        assert_eq!(a.0[16..20], 4u32.to_be_bytes());
        assert!(a.0[20..32].iter().all(|&b| b == 0));
    }

    #[test]
    fn tree_address_is_big_endian_in_low_eight_bytes() {
        let mut a = Adrs::new();
        a.set_tree_address(0x0102030405060708);
        assert!(a.0[4..8].iter().all(|&b| b == 0));
        assert_eq!(a.0[8..16], [1, 2, 3, 4, 5, 6, 7, 8]);
    }
}
