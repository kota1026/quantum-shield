//! Generalized fixed-slot pipeline AIR, v2 — the M2d machinery extended
//! with 32-byte value groups so the same constraint system also serves
//! SHA3-256 Merkle trees (registry membership): a 2-child SHA3-256 node
//! H(left || right) places its 32-byte children at lanes 0-3 / 4-7, unlike
//! the 16-byte SHAKE256 tweakable-hash positions at lanes 6-7 / 8-9.
//!
//! Per-slot public structure (fresh absorptions):
//!   - lane groups 0-3 (32B), 4-5, 6-7, 8-9: each either bound to public
//!     rate values (m03/m45/m67/m89 + r-tables) or chained from the previous
//!     permutation's output — 16-byte chains c67/c89 (output lanes 0-1) and
//!     32-byte chains c03/c47 (output lanes 0-3),
//!   - lanes 10-16 bound to the structural rate table, capacity zero.
//! Continuation slots (multi-block absorption) are unchanged from M2c/M2d:
//!   XOR against public block bits over committed output-bit columns plus a
//!   verbatim capacity carry. Everything stays within degree 3.
//!
//! The SHAKE256 (0x1F) vs SHA3-256 (0x06) domain padding lives entirely in
//! the public block bytes, so both hash families run through the same AIR.

use p3_air::{Air, AirBuilder, AirBuilderWithPublicValues, BaseAir};
use p3_field::PrimeCharacteristicRing;
use p3_goldilocks::Goldilocks;
use p3_keccak_air::{
    generate_trace_rows, KeccakAir, KeccakCols, NUM_KECCAK_COLS, NUM_ROUNDS,
};
use p3_matrix::dense::RowMajorMatrix;
use p3_matrix::Matrix;
use p3_uni_stark::SubAirBuilder;
use core::borrow::Borrow;

pub const RATE: usize = 136;
pub const RATE_LANES: usize = 17;
/// Structural rate limbs per slot: lanes 10-16.
pub const TAB_LIMBS: usize = 28;
/// SHAKE256 / SHA3-256 domain-separation pad bytes.
pub const PAD_SHAKE: u8 = 0x1F;
pub const PAD_SHA3: u8 = 0x06;

type Val = Goldilocks;

/// Where the running chain value lands in the next absorption.
#[derive(Clone, Copy, PartialEq)]
pub enum Side {
    /// 16 bytes into lanes 6-7 (SHAKE256 tweakable hash, left child).
    Left16,
    /// 16 bytes into lanes 8-9 (right child).
    Right16,
    /// 32 bytes into lanes 0-3 (SHA3-256 Merkle node, left child).
    Left32,
    /// 32 bytes into lanes 4-7 (right child).
    Right32,
}

#[derive(Clone)]
pub struct SlotPlan {
    pub fresh: bool,
    pub tab: [u8; RATE],
    pub m03: bool,
    pub m45: bool,
    pub m67: bool,
    pub m89: bool,
    pub c03: bool,
    pub c47: bool,
    pub c67: bool,
    pub c89: bool,
    pub bits: [u8; RATE],
}

impl Default for SlotPlan {
    fn default() -> Self {
        SlotPlan {
            fresh: false,
            tab: [0; RATE],
            m03: false,
            m45: false,
            m67: false,
            m89: false,
            c03: false,
            c47: false,
            c67: false,
            c89: false,
            bits: [0; RATE],
        }
    }
}

/// A public output binding: the first `value.len()` bytes of slot `slot`'s
/// permutation output equal `value` (even byte length, at most 32).
#[derive(Clone)]
pub struct OutBind {
    pub slot: usize,
    pub value: Vec<u8>,
}

#[derive(Default)]
pub struct StageBuilder {
    pub plans: Vec<SlotPlan>,
    pub outs: Vec<OutBind>,
}

/// Domain-padded rate blocks of a byte stream (exact-multiple streams get a
/// full extra pad block).
pub fn pad_blocks(stream: &[u8], domain: u8) -> Vec<[u8; RATE]> {
    let nblocks = stream.len() / RATE + 1;
    let mut blocks = vec![[0u8; RATE]; nblocks];
    for (i, b) in stream.iter().enumerate() {
        blocks[i / RATE][i % RATE] = *b;
    }
    let last = nblocks - 1;
    blocks[last][stream.len() % RATE] ^= domain;
    blocks[last][RATE - 1] ^= 0x80;
    blocks
}

impl StageBuilder {
    /// Fresh single-block absorption with a fully public input.
    pub fn fresh_public(&mut self, input: &[u8], domain: u8) {
        let blocks = pad_blocks(input, domain);
        assert_eq!(blocks.len(), 1, "input must fit one block");
        let p = SlotPlan {
            fresh: true,
            tab: blocks[0],
            m03: true,
            m45: true,
            m67: true,
            m89: true,
            ..SlotPlan::default()
        };
        self.plans.push(p);
    }

    /// Fresh single-block absorption whose `side` group is chained from the
    /// previous permutation's output. `input` must carry zeros there.
    pub fn fresh_chained(&mut self, input: &[u8], side: Side, domain: u8) {
        let blocks = pad_blocks(input, domain);
        assert_eq!(blocks.len(), 1, "input must fit one block");
        let range = match side {
            Side::Left16 => 48..64,
            Side::Right16 => 64..80,
            Side::Left32 => 0..32,
            Side::Right32 => 32..64,
        };
        assert!(input[range].iter().all(|&b| b == 0), "chained group must be zeroed");
        let mut p = SlotPlan {
            fresh: true,
            tab: blocks[0],
            m03: true,
            m45: true,
            m67: true,
            m89: true,
            ..SlotPlan::default()
        };
        match side {
            Side::Left16 => {
                p.m67 = false;
                p.c67 = true;
            }
            Side::Right16 => {
                p.m89 = false;
                p.c89 = true;
            }
            Side::Left32 => {
                p.m03 = false;
                p.c03 = true;
            }
            Side::Right32 => {
                p.m45 = false;
                p.m67 = false;
                p.c47 = true;
            }
        }
        self.plans.push(p);
    }

    /// Multi-block absorption of a fully public stream.
    pub fn multi_public(&mut self, stream: &[u8], domain: u8) {
        let blocks = pad_blocks(stream, domain);
        assert!(blocks.len() >= 2, "use fresh_public for single blocks");
        let p0 = SlotPlan {
            fresh: true,
            tab: blocks[0],
            m03: true,
            m45: true,
            m67: true,
            m89: true,
            ..SlotPlan::default()
        };
        self.plans.push(p0);
        for b in &blocks[1..] {
            let p = SlotPlan { bits: *b, ..SlotPlan::default() };
            self.plans.push(p);
        }
    }

    /// Bind the first `value.len()` output bytes of the last pushed slot.
    pub fn bind_out(&mut self, value: &[u8]) {
        assert!(value.len() % 2 == 0 && value.len() <= 32);
        self.outs.push(OutBind { slot: self.plans.len() - 1, value: value.to_vec() });
    }

    pub fn air(&self) -> PipelineAir {
        PipelineAir {
            fresh: self.plans.iter().map(|p| p.fresh).collect(),
            out_limbs: self.outs.iter().map(|o| (o.slot, o.value.len() / 2)).collect(),
        }
    }
}

/// Prover side: execute the plans, inserting the running chain value and
/// XOR-absorbing continuation blocks.
pub fn run_plans(plans: &[SlotPlan]) -> (Vec<[u64; 25]>, Vec<[u64; 25]>) {
    use p3_symmetric::Permutation;
    let mut pre = Vec::with_capacity(plans.len());
    let mut post: Vec<[u64; 25]> = Vec::with_capacity(plans.len());
    for plan in plans {
        let mut st = [0u64; 25];
        if plan.fresh {
            let mut block = plan.tab;
            if plan.c67 || plan.c89 || plan.c03 || plan.c47 {
                let prev = post.last().expect("chained slot needs a predecessor");
                let (off, lanes) = if plan.c67 {
                    (48, 2)
                } else if plan.c89 {
                    (64, 2)
                } else if plan.c03 {
                    (0, 4)
                } else {
                    (32, 4)
                };
                for l in 0..lanes {
                    block[off + 8 * l..off + 8 * l + 8]
                        .copy_from_slice(&prev[l].to_le_bytes());
                }
            }
            for l in 0..RATE_LANES {
                st[l] = u64::from_le_bytes(block[8 * l..8 * l + 8].try_into().unwrap());
            }
        } else {
            st = *post.last().expect("continuation needs a predecessor");
            for l in 0..RATE_LANES {
                let b = u64::from_le_bytes(plan.bits[8 * l..8 * l + 8].try_into().unwrap());
                st[l] ^= b;
            }
        }
        pre.push(st);
        let mut permuted = st;
        p3_keccak::KeccakF {}.permute_mut(&mut permuted);
        post.push(permuted);
    }
    (pre, post)
}

#[allow(dead_code)]
pub fn out16(state: &[u64; 25]) -> [u8; 16] {
    let mut o = [0u8; 16];
    o[..8].copy_from_slice(&state[0].to_le_bytes());
    o[8..].copy_from_slice(&state[1].to_le_bytes());
    o
}

#[allow(dead_code)]
pub fn out32(state: &[u64; 25]) -> [u8; 32] {
    let mut o = [0u8; 32];
    for l in 0..4 {
        o[8 * l..8 * l + 8].copy_from_slice(&state[l].to_le_bytes());
    }
    o
}

// ---- AIR ----

pub struct PipelineAir {
    pub fresh: Vec<bool>,
    pub out_limbs: Vec<(usize, usize)>,
}

impl PipelineAir {
    pub fn s(&self) -> usize {
        self.fresh.len()
    }
    pub fn cont_slots(&self) -> Vec<usize> {
        (0..self.s()).filter(|&p| !self.fresh[p]).collect()
    }
    pub fn feed_slots(&self) -> Vec<usize> {
        (0..self.s() - 1).filter(|&p| !self.fresh[p + 1]).collect()
    }
    pub fn num_link_cols(&self) -> usize {
        self.s() + RATE_LANES * 64
    }
    // Public layout offsets.
    pub fn pi_tab(&self) -> usize {
        0
    }
    pub fn pi_m03(&self) -> usize {
        TAB_LIMBS * self.s()
    }
    pub fn pi_m45(&self) -> usize {
        self.pi_m03() + self.s()
    }
    pub fn pi_m67(&self) -> usize {
        self.pi_m45() + self.s()
    }
    pub fn pi_m89(&self) -> usize {
        self.pi_m67() + self.s()
    }
    pub fn pi_r03(&self) -> usize {
        self.pi_m89() + self.s()
    }
    pub fn pi_r45(&self) -> usize {
        self.pi_r03() + 16 * self.s()
    }
    pub fn pi_r67(&self) -> usize {
        self.pi_r45() + 8 * self.s()
    }
    pub fn pi_r89(&self) -> usize {
        self.pi_r67() + 8 * self.s()
    }
    pub fn pi_c03(&self) -> usize {
        self.pi_r89() + 8 * self.s()
    }
    pub fn pi_c47(&self) -> usize {
        self.pi_c03() + self.s()
    }
    pub fn pi_c67(&self) -> usize {
        self.pi_c47() + self.s()
    }
    pub fn pi_c89(&self) -> usize {
        self.pi_c67() + self.s()
    }
    pub fn pi_bits(&self) -> usize {
        self.pi_c89() + self.s()
    }
    pub fn pi_out(&self) -> usize {
        self.pi_bits() + self.cont_slots().len() * RATE_LANES * 64
    }
    pub fn num_publics(&self) -> usize {
        self.pi_out() + self.out_limbs.iter().map(|(_, l)| l).sum::<usize>()
    }
}

/// Structural limb index (0..TAB_LIMBS) -> (lane, limb): lanes 10-16.
pub fn tab_lane_limb(i: usize) -> (usize, usize) {
    (10 + i / 4, i % 4)
}

impl<F> BaseAir<F> for PipelineAir {
    fn width(&self) -> usize {
        NUM_KECCAK_COLS + self.num_link_cols()
    }
}

impl<AB: AirBuilderWithPublicValues> Air<AB> for PipelineAir {
    fn eval(&self, builder: &mut AB) {
        let s = self.s();
        {
            let mut sub =
                SubAirBuilder::<AB, KeccakAir, AB::F>::new(builder, 0..NUM_KECCAK_COLS);
            KeccakAir {}.eval(&mut sub);
        }

        let pis: Vec<AB::Expr> = builder
            .public_values()
            .iter()
            .map(|&p| p.into())
            .collect();
        assert_eq!(pis.len(), self.num_publics());

        let main = builder.main();
        let local_row = main.row_slice(0).expect("the matrix is empty?");
        let next_row = main.row_slice(1).expect("the matrix only has 1 row?");
        let local_slice: &[AB::Var] = &local_row;
        let next_slice: &[AB::Var] = &next_row;
        let kc: &KeccakCols<AB::Var> = local_slice[..NUM_KECCAK_COLS].borrow();
        let kc_next: &KeccakCols<AB::Var> = next_slice[..NUM_KECCAK_COLS].borrow();
        let slot = |p: usize| local_slice[NUM_KECCAK_COLS + p].clone();
        let slot_next = |p: usize| next_slice[NUM_KECCAK_COLS + p].clone();
        let obit = |l: usize, z: usize| local_slice[NUM_KECCAK_COLS + s + 64 * l + z].clone();

        let one = AB::Expr::ONE;
        let s0 = kc.step_flags[0].clone();
        let sf = kc.step_flags[NUM_ROUNDS - 1].clone();
        let pre = |lane: usize, limb: usize| kc.preimage[lane / 5][lane % 5][limb].clone();
        let pre_next =
            |lane: usize, limb: usize| kc_next.preimage[lane / 5][lane % 5][limb].clone();
        let out = |lane: usize, limb: usize| kc.a_prime_prime_prime(lane / 5, lane % 5, limb);

        let sel = |get: &dyn Fn(usize) -> AB::Var, base: usize, stride: usize, off: usize| {
            (0..s).fold(AB::Expr::ZERO, |acc, p| {
                acc + get(p).clone().into() * pis[base + stride * p + off].clone()
            })
        };

        // -- 1. Slot selector and output-bit well-formedness -----------------
        let sum_slot = (0..s).fold(AB::Expr::ZERO, |acc, p| acc + slot(p));
        for p in 0..s {
            builder.assert_bool(slot(p));
        }
        builder.assert_bool(sum_slot.clone());
        for l in 0..RATE_LANES {
            for z in 0..64 {
                builder.assert_bool(obit(l, z));
            }
        }

        let fresh_l = (0..s)
            .filter(|&p| self.fresh[p])
            .fold(AB::Expr::ZERO, |acc, p| acc + slot(p));
        let cont_n = self
            .cont_slots()
            .iter()
            .fold(AB::Expr::ZERO, |acc, &p| acc + slot_next(p));
        let feed_l = self
            .feed_slots()
            .iter()
            .fold(AB::Expr::ZERO, |acc, &p| acc + slot(p));

        // -- 2. Fresh absorption: structural table + zero capacity -----------
        let g_fresh = s0.clone() * fresh_l.clone();
        for i in 0..TAB_LIMBS {
            let (lane, limb) = tab_lane_limb(i);
            let tab = sel(&slot, self.pi_tab(), TAB_LIMBS, i);
            builder.assert_zero(g_fresh.clone() * (pre(lane, limb) - tab));
        }
        for lane in RATE_LANES..25 {
            for limb in 0..4 {
                builder.assert_zero(g_fresh.clone() * pre(lane, limb));
            }
        }
        // Lane groups bound to public rate values when the group mask is set.
        let groups: [(usize, usize, usize, usize); 4] = [
            (self.pi_m03(), self.pi_r03(), 0, 16),
            (self.pi_m45(), self.pi_r45(), 4, 8),
            (self.pi_m67(), self.pi_r67(), 6, 8),
            (self.pi_m89(), self.pi_r89(), 8, 8),
        ];
        for (mbase, rbase, lane0, limbs) in groups {
            let m = sel(&slot, mbase, 1, 0);
            for i in 0..limbs {
                let r = sel(&slot, rbase, limbs, i);
                builder
                    .assert_zero(s0.clone() * m.clone() * (pre(lane0 + i / 4, i % 4) - r));
            }
        }

        // -- 3. Output-bit decomposition on feeding permutations -------------
        let g_feed = sf.clone() * feed_l.clone();
        for lane in 0..RATE_LANES {
            for limb in 0..4 {
                let bits = (0..16).fold(AB::Expr::ZERO, |acc, z| {
                    acc + obit(lane, 16 * limb + z) * AB::Expr::from_u32(1 << z)
                });
                builder.assert_zero(g_feed.clone() * (bits - out(lane, limb)));
            }
        }

        // -- 4. Output bindings ----------------------------------------------
        let mut out_base = self.pi_out();
        for &(bslot, limbs) in &self.out_limbs {
            for i in 0..limbs {
                builder.assert_zero(
                    sf.clone() * slot(bslot) * (out(i / 4, i % 4) - pis[out_base + i].clone()),
                );
            }
            out_base += limbs;
        }

        // -- 5. Boundary rows -------------------------------------------------
        builder.when_first_row().assert_one(slot(0));
        builder.when_last_row().assert_zero(sum_slot.clone());

        // -- 6. Transition constraints ---------------------------------------
        let not_sf = one.clone() - sf.clone();
        {
            let mut t = builder.when_transition();

            for p in 0..s {
                t.assert_zero(not_sf.clone() * (slot_next(p) - slot(p)));
            }
            for p in 0..s - 1 {
                t.assert_zero(sf.clone() * (slot_next(p + 1) - slot(p)));
            }
            t.assert_zero(sf.clone() * slot_next(0));

            // Chained groups: 16-byte chains from output lanes 0-1 and
            // 32-byte chains from output lanes 0-3.
            let chains: [(usize, usize, usize); 4] = [
                (self.pi_c67(), 6, 2),
                (self.pi_c89(), 8, 2),
                (self.pi_c03(), 0, 4),
                (self.pi_c47(), 4, 4),
            ];
            for (cbase, lane0, lanes) in chains {
                let c_n = sel(&slot_next, cbase, 1, 0);
                for l in 0..lanes {
                    for j in 0..4 {
                        t.assert_zero(
                            sf.clone() * c_n.clone() * (pre_next(lane0 + l, j) - out(l, j)),
                        );
                    }
                }
            }

            for lane in RATE_LANES..25 {
                for limb in 0..4 {
                    t.assert_zero(
                        sf.clone() * cont_n.clone() * (pre_next(lane, limb) - out(lane, limb)),
                    );
                }
            }
            for (ci, &c) in self.cont_slots().iter().enumerate() {
                let g = sf.clone() * slot_next(c);
                for lane in 0..RATE_LANES {
                    for limb in 0..4 {
                        let x = (0..16).fold(AB::Expr::ZERO, |acc, z| {
                            let o = obit(lane, 16 * limb + z);
                            let b = pis[self.pi_bits()
                                + ci * RATE_LANES * 64
                                + lane * 64
                                + 16 * limb
                                + z]
                                .clone();
                            let xor =
                                o.clone() + b.clone() - AB::Expr::from_u8(2) * b * o;
                            acc + xor * AB::Expr::from_u32(1 << z)
                        });
                        t.assert_zero(g.clone() * (pre_next(lane, limb) - x));
                    }
                }
            }
        }
    }
}

// ---- Trace and public inputs ----

pub fn build_trace(
    air: &PipelineAir,
    pre: &[[u64; 25]],
    post: &[[u64; 25]],
) -> RowMajorMatrix<Val> {
    let s = air.s();
    assert_eq!(pre.len(), s);
    let feed: Vec<bool> = {
        let mut f = vec![false; s];
        for p in air.feed_slots() {
            f[p] = true;
        }
        f
    };
    let width = NUM_KECCAK_COLS + air.num_link_cols();
    let keccak = generate_trace_rows::<Val>(pre.to_vec(), 0);
    let rows = keccak.height();

    let mut values = Val::zero_vec(rows * width);
    for r in 0..rows {
        let src = keccak.row_slice(r).expect("row in range");
        let row = &mut values[r * width..(r + 1) * width];
        row[..NUM_KECCAK_COLS].clone_from_slice(&src);
        let perm = r / NUM_ROUNDS;
        if perm < s {
            row[NUM_KECCAK_COLS + perm] = Val::ONE;
            if r % NUM_ROUNDS == NUM_ROUNDS - 1 && feed[perm] {
                let ps = &post[perm];
                for lane in 0..RATE_LANES {
                    for z in 0..64 {
                        if (ps[lane] >> z) & 1 == 1 {
                            row[NUM_KECCAK_COLS + s + 64 * lane + z] = Val::ONE;
                        }
                    }
                }
            }
        }
    }
    RowMajorMatrix::new(values, width)
}

fn limb(block: &[u8; RATE], lane: usize, l: usize) -> u16 {
    u16::from_le_bytes([block[8 * lane + 2 * l], block[8 * lane + 2 * l + 1]])
}

pub fn derive_pis(air: &PipelineAir, plans: &[SlotPlan], outs: &[OutBind]) -> Vec<Val> {
    let s = air.s();
    assert_eq!(plans.len(), s);
    let mut pis = Vec::with_capacity(air.num_publics());

    for p in plans {
        for i in 0..TAB_LIMBS {
            let (lane, l) = tab_lane_limb(i);
            pis.push(Val::from_u16(if p.fresh { limb(&p.tab, lane, l) } else { 0 }));
        }
    }
    assert_eq!(pis.len(), air.pi_m03());
    let masks: [fn(&SlotPlan) -> bool; 4] =
        [|p| p.m03, |p| p.m45, |p| p.m67, |p| p.m89];
    for get in masks {
        for p in plans {
            pis.push(Val::from_bool(get(p)));
        }
    }
    assert_eq!(pis.len(), air.pi_r03());
    let rgroups: [(fn(&SlotPlan) -> bool, usize, usize); 4] = [
        (|p| p.m03, 0, 16),
        (|p| p.m45, 4, 8),
        (|p| p.m67, 6, 8),
        (|p| p.m89, 8, 8),
    ];
    for (mask, lane0, limbs) in rgroups {
        for p in plans {
            for i in 0..limbs {
                pis.push(Val::from_u16(if mask(p) {
                    limb(&p.tab, lane0 + i / 4, i % 4)
                } else {
                    0
                }));
            }
        }
    }
    assert_eq!(pis.len(), air.pi_c03());
    let chains: [fn(&SlotPlan) -> bool; 4] =
        [|p| p.c03, |p| p.c47, |p| p.c67, |p| p.c89];
    for get in chains {
        for p in plans {
            pis.push(Val::from_bool(get(p)));
        }
    }
    assert_eq!(pis.len(), air.pi_bits());
    for &c in &air.cont_slots() {
        let block = &plans[c].bits;
        for lane in 0..RATE_LANES {
            for z in 0..64 {
                pis.push(Val::from_u8((block[8 * lane + z / 8] >> (z % 8)) & 1));
            }
        }
    }
    assert_eq!(pis.len(), air.pi_out());
    assert_eq!(outs.len(), air.out_limbs.len());
    for o in outs {
        for i in 0..o.value.len() / 2 {
            pis.push(Val::from_u16(u16::from_le_bytes([
                o.value[2 * i],
                o.value[2 * i + 1],
            ])));
        }
    }
    assert_eq!(pis.len(), air.num_publics());
    pis
}
