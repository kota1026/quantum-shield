# wots-lookup-m2b — M2b-2 PoC (cross-table lookup composition)

The composition step that joins M2a (chaining) and M1 (Keccak-f in keccak-air):
a **chain** table's transitions are bound, via a global logup lookup
(`p3-lookup` + `p3-batch-stark`), to a separate **producer** table that
independently attests each `(in, out)` pair. In production the producer is
keccak-air (its `export`/`preimage`/output columns Send the proven Keccak-f
I/O); here it is an algebraic stand-in so the lookup *wiring* is demonstrated
end-to-end in one batch STARK.

- Chain table (`state, next_state`): a transition constraint ties `next_state`
  to the next row; it RECEIVES `(state, next_state)`.
- Producer table (`in, out`): it SENDS `(in, out)`.
- Equal multisets => logup balances => the batch verifies.

## Run

```bash
cargo run --release
```

Output:
- valid composition → verify = true
- tampered producer (one pair altered → a chain transition unbacked) → rejected

This de-risks the final M2 crux: chaining + per-step correctness compose in one
proof via cross-table lookup. See `docs/core/STARK_AIR_GAP_ANALYSIS.md` §11.
