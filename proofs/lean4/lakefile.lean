import Lake
open Lake DSL

package «quantum-shield-proofs» where
  leanOptions := #[
    ⟨`pp.unicode.fun, true⟩,
    ⟨`autoImplicit, false⟩
  ]

require mathlib from git
  "https://github.com/leanprover-community/mathlib4" @ "v4.14.0"

@[default_target]
lean_lib NTT where
  srcDir := "."

@[default_target]
lean_lib SPHINCS where
  srcDir := "."
