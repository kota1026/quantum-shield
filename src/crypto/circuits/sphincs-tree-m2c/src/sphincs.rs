//! SPHINCS+-SHAKE-128s tree-side witness computation for M2c: one FORS tree
//! (leaf + 12-step auth path), T_k compression of the 14 FORS roots, T_len
//! compression of the 35 WOTS+ pk elements, and the XMSS auth path (9 steps)
//! — a fixed pipeline of 30 Keccak-f[1600] permutations, plus controlled
//! tampering for the negative tests.
//!
//! New over M1/M2a/M2b: T_len and T_k inputs exceed the SHAKE256 rate, so
//! their absorption spans multiple permutations linked by
//! `state XOR next-block` (rate part) and a verbatim capacity carry. All
//! reconstructed sponges are asserted against the `sha3` reference on the
//! honest path.

use sha3::digest::{ExtendableOutput, Update, XofReader};
use sha3::Shake256;

/// Security parameter n in bytes (SPHINCS+-SHAKE-128s).
pub const N: usize = 16;
/// SHAKE256 rate in bytes / 16-bit limbs / lanes.
pub const RATE: usize = 136;
pub const RATE_LANES: usize = 17;
/// FORS tree height (a) and tree count (k).
pub const FORS_A: usize = 12;
pub const FORS_K: usize = 14;
/// XMSS tree height (h' = h/d).
pub const XMSS_H: usize = 9;
/// WOTS+ chain count.
pub const WOTS_LEN: usize = 35;

/// FIPS 205 ADRS type constants.
pub const ADRS_WOTS_PK: u32 = 1;
pub const ADRS_TREE: u32 = 2;
pub const ADRS_FORS_TREE: u32 = 3;
pub const ADRS_FORS_ROOTS: u32 = 4;

// ---- Slot map: the fixed 30-permutation pipeline ----
pub const SLOT_FORS_LEAF: usize = 0; // F, fresh
pub const SLOT_FORS_CLIMB0: usize = 1; // 12 H climbs: slots 1..=12
pub const SLOT_TK0: usize = 13; // T_k block 0 (fresh, root_0 chained in)
pub const SLOT_TLEN0: usize = 16; // T_len block 0 (fresh, all public)
pub const SLOT_XMSS_CLIMB0: usize = 21; // 9 H climbs: slots 21..=29
pub const NUM_SLOTS: usize = 30;

/// XOR-continuation slots (absorb another block into the running sponge).
pub const CONT_SLOTS: [usize; 6] = [14, 15, 17, 18, 19, 20];
/// Slots whose output feeds an XOR continuation (predecessors of CONT_SLOTS).
pub const FEED_SLOTS: [usize; 6] = [13, 14, 16, 17, 18, 19];

pub fn is_cont(p: usize) -> bool {
    CONT_SLOTS.contains(&p)
}

/// The ADRS fields shared by the whole pipeline.
#[derive(Clone)]
pub struct AdrsParams {
    pub layer: u32,
    pub tree: [u8; 12],
    /// XMSS keypair address = XMSS leaf index of the WOTS+ key.
    pub kp: u32,
}

/// FIPS 205 32-byte ADRS: layer(4) || tree(12) || type(4) || w1(4) || w2(4)
/// || w3(4), all big-endian. Word meaning depends on the type (Table 1).
pub fn adrs(p: &AdrsParams, t: u32, w1: u32, w2: u32, w3: u32) -> [u8; 32] {
    let mut a = [0u8; 32];
    a[0..4].copy_from_slice(&p.layer.to_be_bytes());
    a[4..16].copy_from_slice(&p.tree);
    a[16..20].copy_from_slice(&t.to_be_bytes());
    a[20..24].copy_from_slice(&w1.to_be_bytes());
    a[24..28].copy_from_slice(&w2.to_be_bytes());
    a[28..32].copy_from_slice(&w3.to_be_bytes());
    a
}

/// Per-slot ADRS values (verifier-derivable). `idx_global` is the FORS leaf
/// index within the whole FORS forest: i_tree * 2^a + i_leaf.
pub fn slot_adrs(p: &AdrsParams, idx_global: u32, slot: usize) -> [u8; 32] {
    match slot {
        SLOT_FORS_LEAF => adrs(p, ADRS_FORS_TREE, p.kp, 0, idx_global),
        s if (SLOT_FORS_CLIMB0..SLOT_TK0).contains(&s) => {
            let j = (s - SLOT_FORS_CLIMB0 + 1) as u32;
            adrs(p, ADRS_FORS_TREE, p.kp, j, idx_global >> j)
        }
        SLOT_TK0 => adrs(p, ADRS_FORS_ROOTS, p.kp, 0, 0),
        SLOT_TLEN0 => adrs(p, ADRS_WOTS_PK, p.kp, 0, 0),
        s if (SLOT_XMSS_CLIMB0..NUM_SLOTS).contains(&s) => {
            let j = (s - SLOT_XMSS_CLIMB0 + 1) as u32;
            adrs(p, ADRS_TREE, 0, j, p.kp >> j)
        }
        _ => panic!("slot {slot} has no fresh ADRS (continuation block)"),
    }
}

/// Direction bit for climb slot `s`: 0 = running node is the LEFT child
/// (lanes 6-7), 1 = RIGHT child (lanes 8-9). Public (from the leaf indices).
pub fn climb_bit(i_leaf: u32, kp: u32, slot: usize) -> Option<u32> {
    match slot {
        s if (SLOT_FORS_CLIMB0..SLOT_TK0).contains(&s) => {
            Some((i_leaf >> (s - SLOT_FORS_CLIMB0)) & 1)
        }
        s if (SLOT_XMSS_CLIMB0..NUM_SLOTS).contains(&s) => {
            Some((kp >> (s - SLOT_XMSS_CLIMB0)) & 1)
        }
        _ => None,
    }
}

/// The full public instance for the pipeline. Everything here is data the
/// SPHINCS+ verifier holds: signature components (sk element, auth paths,
/// sibling FORS roots as glued sub-proof interfaces, WOTS+ pk elements from
/// the M2b stage) and ADRS parameters.
#[derive(Clone)]
pub struct Instance {
    pub pk_seed: [u8; N],
    pub params: AdrsParams,
    pub i_tree: u32,
    pub i_leaf: u32,
    pub sk: [u8; N],
    pub fors_auth: [[u8; N]; FORS_A],
    /// Roots of FORS trees 1..k (tree 0's root is proven in-trace).
    pub roots_rest: [[u8; N]; FORS_K - 1],
    pub pk_elems: [[u8; N]; WOTS_LEN],
    pub xmss_auth: [[u8; N]; XMSS_H],
}

impl Instance {
    pub fn idx_global(&self) -> u32 {
        self.i_tree * (1 << FORS_A as u32) + self.i_leaf
    }

    /// T_k input stream with the in-trace-chained root_0 zeroed: only the
    /// verifier-public portions (used for tables and continuation-block
    /// bits) may be read from it.
    pub fn tk_stream_public(&self) -> Vec<u8> {
        let mut s = Vec::with_capacity(N + 32 + FORS_K * N);
        s.extend_from_slice(&self.pk_seed);
        s.extend_from_slice(&slot_adrs(&self.params, self.idx_global(), SLOT_TK0));
        s.extend_from_slice(&[0u8; N]); // root_0: chained, never table-bound
        for r in &self.roots_rest {
            s.extend_from_slice(r);
        }
        s
    }

    pub fn tlen_stream(&self) -> Vec<u8> {
        let mut s = Vec::with_capacity(N + 32 + WOTS_LEN * N);
        s.extend_from_slice(&self.pk_seed);
        s.extend_from_slice(&slot_adrs(&self.params, self.idx_global(), SLOT_TLEN0));
        for e in &self.pk_elems {
            s.extend_from_slice(e);
        }
        s
    }
}

/// Split a byte stream into padded SHAKE256 rate blocks (pad10*1 with 0x1F;
/// a stream of exact block length gets a full extra pad block).
pub fn shake_blocks(stream: &[u8]) -> Vec<[u8; RATE]> {
    let nblocks = stream.len() / RATE + 1;
    let mut blocks = vec![[0u8; RATE]; nblocks];
    for (i, b) in stream.iter().enumerate() {
        blocks[i / RATE][i % RATE] = *b;
    }
    let last = nblocks - 1;
    blocks[last][stream.len() % RATE] ^= 0x1F;
    blocks[last][RATE - 1] ^= 0x80;
    blocks
}

fn keccak_f(state: &mut [u64; 25]) {
    use p3_symmetric::Permutation;
    p3_keccak::KeccakF {}.permute_mut(state);
}

fn xor_rate(state: &mut [u64; 25], block: &[u8; RATE]) {
    for l in 0..RATE_LANES {
        let mut b = [0u8; 8];
        b.copy_from_slice(&block[8 * l..8 * l + 8]);
        state[l] ^= u64::from_le_bytes(b);
    }
}

fn out16(state: &[u64; 25]) -> [u8; N] {
    let mut o = [0u8; N];
    o[..8].copy_from_slice(&state[0].to_le_bytes());
    o[8..].copy_from_slice(&state[1].to_le_bytes());
    o
}

/// Reference SHAKE256 truncated to n bytes via the `sha3` crate.
pub fn shake256_16(input: &[u8]) -> [u8; N] {
    let mut h = Shake256::default();
    h.update(input);
    let mut r = h.finalize_xof();
    let mut o = [0u8; N];
    r.read(&mut o);
    o
}

/// Controlled corruption for the negative tests. Every variant keeps the
/// Keccak-f permutations themselves valid — only the inter-permutation
/// structure (or its relation to the public inputs) is broken.
pub enum Tamper {
    None,
    /// Flip one bit of T_len continuation block `block` (1..=4) before it is
    /// absorbed, breaking the XOR link of slot 16+block.
    TlenBlock { block: usize, byte: usize },
    /// Flip a capacity byte of the running T_len sponge after `after_slot`,
    /// breaking the capacity carry into the next permutation.
    BreakCapacity { after_slot: usize },
    /// Use a corrupted auth-path node at FORS climb `j` (1..=12).
    WrongAuthNode { fors_j: usize },
    /// Swap left/right at XMSS climb `j` (1..=9), ignoring the index bit.
    WrongDirection { xmss_j: usize },
    /// Use tree height j+1 in the ADRS of FORS climb `j`.
    WrongTreeHeight { fors_j: usize },
}

pub struct Witness {
    /// Keccak-f input state per slot.
    pub pre: Vec<[u64; 25]>,
    /// Keccak-f output state per slot.
    pub post: Vec<[u64; 25]>,
    /// T_k output (the FORS pk; the message the layer-0 WOTS+ signs).
    pub fors_pk: [u8; N],
    /// XMSS root recovered by the auth path.
    pub root: [u8; N],
}

/// Run the 30-permutation pipeline, collecting every permutation state.
pub fn build_witness(inst: &Instance, tamper: &Tamper) -> Witness {
    let honest = matches!(tamper, Tamper::None);
    let idx = inst.idx_global();
    let mut pre: Vec<[u64; 25]> = Vec::with_capacity(NUM_SLOTS);
    let mut post: Vec<[u64; 25]> = Vec::with_capacity(NUM_SLOTS);

    // Single-block hash (F or H): fresh sponge over a < rate input.
    let single = |input: &[u8], pre_v: &mut Vec<[u64; 25]>, post_v: &mut Vec<[u64; 25]>| {
        let blocks = shake_blocks(input);
        assert_eq!(blocks.len(), 1);
        let mut st = [0u64; 25];
        xor_rate(&mut st, &blocks[0]);
        pre_v.push(st);
        keccak_f(&mut st);
        post_v.push(st);
        let o = out16(&st);
        if honest {
            assert_eq!(o, shake256_16(input), "sponge must match sha3 reference");
        }
        o
    };

    // FORS leaf.
    let mut input = Vec::new();
    input.extend_from_slice(&inst.pk_seed);
    input.extend_from_slice(&slot_adrs(&inst.params, idx, SLOT_FORS_LEAF));
    input.extend_from_slice(&inst.sk);
    let mut node = single(&input, &mut pre, &mut post);

    // FORS climbs.
    for j in 1..=FORS_A {
        let slot = SLOT_FORS_CLIMB0 + j - 1;
        let mut a = slot_adrs(&inst.params, idx, slot);
        if let Tamper::WrongTreeHeight { fors_j } = tamper {
            if *fors_j == j {
                a = adrs(
                    &inst.params,
                    ADRS_FORS_TREE,
                    inst.params.kp,
                    j as u32 + 1,
                    idx >> j,
                );
            }
        }
        let mut auth = inst.fors_auth[j - 1];
        if let Tamper::WrongAuthNode { fors_j } = tamper {
            if *fors_j == j {
                auth[0] ^= 0x01;
            }
        }
        let bit = climb_bit(inst.i_leaf, inst.params.kp, slot).unwrap();
        let (left, right) = if bit == 0 { (node, auth) } else { (auth, node) };
        let mut input = Vec::new();
        input.extend_from_slice(&inst.pk_seed);
        input.extend_from_slice(&a);
        input.extend_from_slice(&left);
        input.extend_from_slice(&right);
        node = single(&input, &mut pre, &mut post);
    }
    let root_0 = node;

    // T_k over the 14 FORS roots (multi-block: 2 data blocks + pad block).
    let mut tk_stream = inst.tk_stream_public();
    tk_stream[N + 32..N + 32 + N].copy_from_slice(&root_0);
    let fors_pk = {
        let blocks = shake_blocks(&tk_stream);
        assert_eq!(blocks.len(), 3);
        let mut st = [0u64; 25];
        for b in &blocks {
            xor_rate(&mut st, b);
            pre.push(st);
            keccak_f(&mut st);
            post.push(st);
        }
        let o = out16(&st);
        if honest {
            assert_eq!(o, shake256_16(&tk_stream), "T_k sponge must match sha3");
        }
        o
    };

    // T_len over the 35 WOTS+ pk elements (5 blocks).
    let tlen_stream = inst.tlen_stream();
    let leaf = {
        let blocks = shake_blocks(&tlen_stream);
        assert_eq!(blocks.len(), 5);
        let mut st = [0u64; 25];
        for (bi, b) in blocks.iter().enumerate() {
            let mut b = *b;
            if let Tamper::TlenBlock { block, byte } = tamper {
                if *block == bi {
                    b[*byte] ^= 0x01;
                }
            }
            xor_rate(&mut st, &b);
            pre.push(st);
            keccak_f(&mut st);
            post.push(st);
            if let Tamper::BreakCapacity { after_slot } = tamper {
                if *after_slot == SLOT_TLEN0 + bi {
                    // Flip a byte in capacity lane 20.
                    st[20] ^= 0x01_00;
                }
            }
        }
        let o = out16(&st);
        if honest {
            assert_eq!(o, shake256_16(&tlen_stream), "T_len sponge must match sha3");
        }
        o
    };

    // XMSS auth path from the compressed WOTS+ pk (the tree leaf).
    let mut node = leaf;
    for j in 1..=XMSS_H {
        let slot = SLOT_XMSS_CLIMB0 + j - 1;
        let a = slot_adrs(&inst.params, idx, slot);
        let auth = inst.xmss_auth[j - 1];
        let mut bit = climb_bit(inst.i_leaf, inst.params.kp, slot).unwrap();
        if let Tamper::WrongDirection { xmss_j } = tamper {
            if *xmss_j == j {
                bit ^= 1;
            }
        }
        let (left, right) = if bit == 0 { (node, auth) } else { (auth, node) };
        let mut input = Vec::new();
        input.extend_from_slice(&inst.pk_seed);
        input.extend_from_slice(&a);
        input.extend_from_slice(&left);
        input.extend_from_slice(&right);
        node = single(&input, &mut pre, &mut post);
    }

    assert_eq!(pre.len(), NUM_SLOTS);
    assert_eq!(post.len(), NUM_SLOTS);
    Witness { pre, post, fors_pk, root: node }
}
