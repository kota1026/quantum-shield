# zkVM path — measuring the recommended wrap strategy

`docs/core/STARK_AIR_GAP_ANALYSIS.md` §19 concluded, from measurement, that
verifying a SPHINCS+ signature **directly inside a zkVM** is ~228× cheaper
than verifying our own STARK proof of the same thing, and that the crossover
where the STARK layer pays off is around 228 signatures — two orders of
magnitude past the 2-of-N this protocol needs.

§20 then made the verification core dependency-free `no_std` + `alloc`, so it
builds for bare-metal RISC-V and can be a zkVM guest unchanged:

```bash
cd ../circuits/sphincs-m2
cargo build --lib --no-default-features --target riscv32im-unknown-none-elf
```

This directory holds the guest and the fixed test vector it verifies.

## Layout

| path | what it is |
|---|---|
| `vectors/` | one SLH-DSA-SHAKE-128s case (`msg.bin`, `sig.bin` 7,856 B, `pk.bin` 32 B), regenerate with `sphincs-m2`'s `emit_vector` example |
| `guest/` | the SP1 guest: embeds the vector, runs `slh_verify`, commits the verdict |

The vector is embedded rather than passed over zkVM I/O so the cycle count
measures the verification itself, not host/guest plumbing. It costs **2,174
Keccak-f permutations** natively (`sphincs-m2`'s `verify_cost` example).

## Running it needs SP1's own toolchain

The guest does **not** build against the stock `riscv32im-unknown-none-elf`
target: `sp1-zkvm` pulls `sp1-lib` → … → `getrandom` and `either`, both of
which require `std`. SP1 ships a `std` for its own target
(`riscv32im-succinct-zkvm-elf`), which is what its toolchain installs.

Installing it means running SP1's remote install script, so it is left to the
operator rather than done automatically:

```bash
curl -L https://sp1up.succinct.xyz | bash
sp1up
```

Once the toolchain is present:

```bash
cd guest && cargo prove build          # builds the guest ELF
```

and the cycle count comes from the SP1 executor (`sp1-sdk`, execute mode — no
proving needed for a cycle count).

## What the measurement is for

Not a go/no-go: §19's ratio already settled the strategy, and §13 already
measured the on-chain half (~254K gas, 25 % of the NFR-2 budget). The cycle
count sizes **proof generation** — the R-3 proving-service requirement and
NFR-3's ≤1 h budget, which currently has an order of magnitude of margin.
