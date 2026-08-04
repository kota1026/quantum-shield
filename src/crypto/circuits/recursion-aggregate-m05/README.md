# recursion-aggregate-m05 — M0.5-impl method-A public-surface reduction

The §20 integration (`recursion-verify-m05`) verifies an inner FRI proof with
four AIRs whose interfaces are bound by **public glue**: the Merkle root, the
FRI-fold challenges (`beta_i`), the fold's initial and final evaluations, and
the DEEP trace opening. That leaves the composition's public surface as *all*
of those values — the four segments' worth of interface data.

This crate collapses that surface to **one Poseidon2 digest**. An
interface-commitment AIR absorbs the whole interface set — arranged as
`NBLOCKS = 3` rate blocks (`[Merkle root(8)]`, `[fold betas(8)]`,
`[f_init, f_final, d_t0, pad…]`) — into a width-16 Poseidon2 sponge
(overwrite mode, rate = capacity = 8, the permutation constrained by
`p3-poseidon2-air` via `SubAirBuilder`) and binds the squeezed digest as the
single public output. That digest is the one value the §14 Groth16 wrap
consumes, so `publicInputsDigest = SHA3-256(message‖pks)` binds against a
single hash rather than the multi-proof interface.

## Constraints

Per-row `LinkCols { is_real, links_next, onehot[NBLOCKS] }` drive a one-hot
walk over the three absorb rows:

- **absorb**: the permutation's input rate lane `i` equals the one-hot-selected
  public interface block lane (`inp(i) == Σ_r onehot[r]·pi_iface[r·RATE+i]`);
- **first row**: capacity IV = 0, `onehot[0] = 1`, `is_real = 1`;
- **capacity carry**: on a linked transition the next input capacity equals this
  row's permutation output capacity (overwrite-mode sponge), and the one-hot
  index shifts by one;
- **digest binding**: on the last real block (`is_real·(1−links_next)`) the
  output rate equals the public digest.

Change any interface lane while keeping the honest digest and the absorb
constraint on that row fails; change the digest and the binding fails.

## What this establishes / what remains

The public surface is now a single digest — the shape the Groth16 wrap needs.
What remains for full succinctness is to **bind the committed interface values
to the actual segment proofs**, i.e. verify the four proofs in-circuit so the
absorbed values provably come from real proofs rather than being asserted as
public inputs. That is the full-recursion step, which needs an in-circuit
FRI/PCS verifier; it is env-gated (a proving CI with the VK regenerated for the
aggregated circuit). See `docs/core/STARK_AIR_GAP_ANALYSIS.md` §21.

## Measured (BabyBear)

```
poseidon2_cols=313 link_cols=5 public_values=32 (iface 24 + digest 8)
honest                 accept   (~0.1 s prove, ~5 ms verify, ~0.2 MB)
forged-iface(root)     reject
forged-iface(beta)     reject
forged-iface(f_final)  reject
forged-digest          reject
```

## Run

```bash
cargo run --release
```
