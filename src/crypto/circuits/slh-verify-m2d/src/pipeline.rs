//! Generalized fixed-slot pipeline AIR — the M2c machinery parameterized by
//! a slot configuration, so the same constraint system serves both the
//! H_msg + FORS + T_k pipeline (186 slots) and the per-layer T_len + XMSS
//! pipeline (14 slots).
//!
//! Mechanisms (all inherited from M2c, see sphincs-tree-m2c/src/air.rs):
//! one-hot slot walk (+1 shift, first row slot 0, last row padding), public
//! rate-table binding of fresh absorptions, mask/rate or chain binding of
//! the lane 6-7 / 8-9 value pairs, XOR-linked multi-block absorption over
//! committed output-bit columns with public block bits, verbatim capacity
//! carry, and public output bindings (generalized to arbitrary limb counts
//! for the 30-byte H_msg digest). All constraints stay within keccak-air's
//! degree-3 budget.

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

type Val = Goldilocks;

/// Which value pair of an H input the running chain value occupies.
#[derive(Clone, Copy, PartialEq)]
pub enum Side {
    Left,  // lanes 6-7 (input bytes 48..64)
    Right, // lanes 8-9 (input bytes 64..80)
}

#[derive(Clone)]
pub struct SlotPlan {
    pub fresh: bool,
    /// Fresh slots: the public rate bytes (chained pair zeroed).
    pub tab: [u8; RATE],
    pub m67: bool,
    pub m89: bool,
    pub c67: bool,
    pub c89: bool,
    /// Continuation slots: the absorbed block bytes.
    pub bits: [u8; RATE],
}

/// A public output binding: the first `value.len()` bytes of slot `slot`'s
/// permutation output equal `value` (byte length must be even).
#[derive(Clone)]
pub struct OutBind {
    pub slot: usize,
    pub value: Vec<u8>,
}

/// Builder used by both prover and verifier to lay out a pipeline. Contains
/// only public data — running chain values never enter the plans.
#[derive(Default)]
pub struct StageBuilder {
    pub plans: Vec<SlotPlan>,
    pub outs: Vec<OutBind>,
}

fn zero_plan() -> SlotPlan {
    SlotPlan {
        fresh: false,
        tab: [0; RATE],
        m67: false,
        m89: false,
        c67: false,
        c89: false,
        bits: [0; RATE],
    }
}

/// SHAKE256 pad10*1 blocks of a byte stream (exact-multiple streams get a
/// full extra pad block).
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

impl StageBuilder {
    /// Fresh single-block absorption with a fully public input.
    pub fn fresh_public(&mut self, input: &[u8]) {
        let blocks = shake_blocks(input);
        assert_eq!(blocks.len(), 1, "input must fit one block");
        let mut p = zero_plan();
        p.fresh = true;
        p.tab = blocks[0];
        p.m67 = true;
        p.m89 = true;
        self.plans.push(p);
    }

    /// Fresh single-block absorption whose `side` value pair is chained from
    /// the previous permutation's output. `input` must carry zeros there.
    pub fn fresh_chained(&mut self, input: &[u8], side: Side) {
        let blocks = shake_blocks(input);
        assert_eq!(blocks.len(), 1, "input must fit one block");
        let range = match side {
            Side::Left => 48..64,
            Side::Right => 64..80,
        };
        assert!(input[range].iter().all(|&b| b == 0), "chained pair must be zeroed");
        let mut p = zero_plan();
        p.fresh = true;
        p.tab = blocks[0];
        match side {
            Side::Left => {
                p.c67 = true;
                p.m89 = true;
            }
            Side::Right => {
                p.c89 = true;
                p.m67 = true;
            }
        }
        self.plans.push(p);
    }

    /// Multi-block absorption of a fully public stream.
    pub fn multi_public(&mut self, stream: &[u8]) {
        let blocks = shake_blocks(stream);
        assert!(blocks.len() >= 2, "use fresh_public for single blocks");
        let mut p0 = zero_plan();
        p0.fresh = true;
        p0.tab = blocks[0];
        p0.m67 = true;
        p0.m89 = true;
        self.plans.push(p0);
        for b in &blocks[1..] {
            let mut p = zero_plan();
            p.bits = *b;
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

/// Prover side: execute the plans, inserting the running chain value into
/// chained pairs and XOR-absorbing continuation blocks.
pub fn run_plans(plans: &[SlotPlan]) -> (Vec<[u64; 25]>, Vec<[u64; 25]>) {
    use p3_symmetric::Permutation;
    let mut pre = Vec::with_capacity(plans.len());
    let mut post: Vec<[u64; 25]> = Vec::with_capacity(plans.len());
    for plan in plans {
        let mut st = [0u64; 25];
        if plan.fresh {
            let mut block = plan.tab;
            if plan.c67 || plan.c89 {
                let prev = post.last().expect("chained slot needs a predecessor");
                let off = if plan.c67 { 48 } else { 64 };
                block[off..off + 8].copy_from_slice(&prev[0].to_le_bytes());
                block[off + 8..off + 16].copy_from_slice(&prev[1].to_le_bytes());
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

pub fn out16(state: &[u64; 25]) -> [u8; 16] {
    let mut o = [0u8; 16];
    o[..8].copy_from_slice(&state[0].to_le_bytes());
    o[8..].copy_from_slice(&state[1].to_le_bytes());
    o
}

// ---- AIR ----

pub struct PipelineAir {
    pub fresh: Vec<bool>,
    /// (slot, limb count) per output binding, in public-input order.
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
    pub fn pi_m67(&self) -> usize {
        52 * self.s()
    }
    pub fn pi_m89(&self) -> usize {
        self.pi_m67() + self.s()
    }
    pub fn pi_r67(&self) -> usize {
        self.pi_m89() + self.s()
    }
    pub fn pi_r89(&self) -> usize {
        self.pi_r67() + 8 * self.s()
    }
    pub fn pi_c67(&self) -> usize {
        self.pi_r89() + 8 * self.s()
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

/// Structural limb index (0..52) -> (lane, limb): lanes 0-5 then 10-16.
pub fn tab_lane_limb(i: usize) -> (usize, usize) {
    if i < 24 {
        (i / 4, i % 4)
    } else {
        (10 + (i - 24) / 4, (i - 24) % 4)
    }
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

        // -- 1. Slot selector well-formedness --------------------------------
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
        for i in 0..52 {
            let (lane, limb) = tab_lane_limb(i);
            let tab = sel(&slot, self.pi_tab(), 52, i);
            builder.assert_zero(g_fresh.clone() * (pre(lane, limb) - tab));
        }
        for lane in RATE_LANES..25 {
            for limb in 0..4 {
                builder.assert_zero(g_fresh.clone() * pre(lane, limb));
            }
        }
        let m67 = sel(&slot, self.pi_m67(), 1, 0);
        let m89 = sel(&slot, self.pi_m89(), 1, 0);
        for l in 0..2 {
            for j in 0..4 {
                let r67 = sel(&slot, self.pi_r67(), 8, 4 * l + j);
                builder.assert_zero(s0.clone() * m67.clone() * (pre(6 + l, j) - r67));
                let r89 = sel(&slot, self.pi_r89(), 8, 4 * l + j);
                builder.assert_zero(s0.clone() * m89.clone() * (pre(8 + l, j) - r89));
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

            let c67_n = sel(&slot_next, self.pi_c67(), 1, 0);
            let c89_n = sel(&slot_next, self.pi_c89(), 1, 0);
            for l in 0..2 {
                for j in 0..4 {
                    t.assert_zero(
                        sf.clone() * c67_n.clone() * (pre_next(6 + l, j) - out(l, j)),
                    );
                    t.assert_zero(
                        sf.clone() * c89_n.clone() * (pre_next(8 + l, j) - out(l, j)),
                    );
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
        for i in 0..52 {
            let (lane, l) = tab_lane_limb(i);
            pis.push(Val::from_u16(if p.fresh { limb(&p.tab, lane, l) } else { 0 }));
        }
    }
    assert_eq!(pis.len(), air.pi_m67());
    for p in plans {
        pis.push(Val::from_bool(p.m67));
    }
    for p in plans {
        pis.push(Val::from_bool(p.m89));
    }
    assert_eq!(pis.len(), air.pi_r67());
    for p in plans {
        for i in 0..8 {
            pis.push(Val::from_u16(if p.m67 { limb(&p.tab, 6 + i / 4, i % 4) } else { 0 }));
        }
    }
    for p in plans {
        for i in 0..8 {
            pis.push(Val::from_u16(if p.m89 { limb(&p.tab, 8 + i / 4, i % 4) } else { 0 }));
        }
    }
    assert_eq!(pis.len(), air.pi_c67());
    for p in plans {
        pis.push(Val::from_bool(p.c67));
    }
    for p in plans {
        pis.push(Val::from_bool(p.c89));
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
