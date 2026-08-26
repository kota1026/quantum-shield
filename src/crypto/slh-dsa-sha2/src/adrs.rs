//! FIPS 205 address structure, and the 22-byte compression the SHA2 parameter
//! sets hash instead of the full 32 bytes (FIPS 205 §11.2).
//!
//! The compression is where `SPHINCSVerifier.sol` went wrong: it substituted a
//! one-byte domain separator for the address entirely, which cannot encode the
//! layer/tree/keypair/chain/hash position a signature's security depends on
//! (`STARK_AIR_GAP_ANALYSIS.md` §25.3).

pub const WOTS_HASH: u32 = 0;
pub const WOTS_PK: u32 = 1;
pub const TREE: u32 = 2;
pub const FORS_TREE: u32 = 3;
pub const FORS_ROOTS: u32 = 4;

/// Length of the compressed address the SHA2 hashes take.
pub const COMPRESSED_LEN: usize = 22;

/// A 32-byte FIPS 205 address.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct Adrs(pub [u8; 32]);

impl Adrs {
    pub fn new() -> Self {
        Self([0u8; 32])
    }

    fn put_u32(&mut self, offset: usize, value: u32) {
        self.0[offset..offset + 4].copy_from_slice(&value.to_be_bytes());
    }

    fn get_u32(&self, offset: usize) -> u32 {
        u32::from_be_bytes(self.0[offset..offset + 4].try_into().unwrap())
    }

    pub fn set_layer_address(&mut self, layer: u32) {
        self.put_u32(0, layer);
    }

    pub fn set_tree_address(&mut self, tree: u64) {
        self.0[4..8].fill(0);
        self.0[8..16].copy_from_slice(&tree.to_be_bytes());
    }

    /// Set the type and zero the three words after it, per FIPS 205.
    pub fn set_type_and_clear(&mut self, adrs_type: u32) {
        self.put_u32(16, adrs_type);
        self.0[20..32].fill(0);
    }

    pub fn set_key_pair_address(&mut self, keypair: u32) {
        self.put_u32(20, keypair);
    }

    pub fn key_pair_address(&self) -> u32 {
        self.get_u32(20)
    }

    pub fn set_chain_address(&mut self, chain: u32) {
        self.put_u32(24, chain);
    }

    pub fn set_tree_height(&mut self, height: u32) {
        self.put_u32(24, height);
    }

    pub fn set_hash_address(&mut self, hash: u32) {
        self.put_u32(28, hash);
    }

    pub fn set_tree_index(&mut self, index: u32) {
        self.put_u32(28, index);
    }

    pub fn tree_index(&self) -> u32 {
        self.get_u32(28)
    }

    /// `ADRS^c` — 22 bytes: layer(1) ‖ tree(8) ‖ type(1) ‖ trailing(12).
    ///
    /// The dropped bytes are the high-order halves of fields the parameter set
    /// never fills, so nothing addressable is lost.
    pub fn compressed(&self) -> [u8; COMPRESSED_LEN] {
        let mut out = [0u8; COMPRESSED_LEN];
        out[0] = self.0[3];
        out[1..9].copy_from_slice(&self.0[8..16]);
        out[9] = self.0[19];
        out[10..22].copy_from_slice(&self.0[20..32]);
        out
    }
}
