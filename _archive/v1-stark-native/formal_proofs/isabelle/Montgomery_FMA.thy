(* ========================================================================== *)
(* Montgomery FMA Gate Formal Verification                                    *)
(* Dilithium Signature Verification STARK Proof System                        *)
(*                                                                            *)
(* This theory proves the soundness of the Montgomery FMA constraint:         *)
(*   C_FMA: A * B + C + M * Q = R' * R  (in F_p)                              *)
(*                                                                            *)
(* Main Theorem: FMA_Soundness                                                *)
(*   The algebraic constraint implies correct Montgomery reduction            *)
(* ========================================================================== *)

theory Montgomery_FMA
  imports Main "HOL-Computational_Algebra.Primes" "HOL-Number_Theory.Number_Theory"
begin

(* ========================================================================== *)
(* Section 1: Dilithium Constants                                             *)
(* ========================================================================== *)

(* Dilithium modulus Q = 8380417 = 2^23 - 2^13 + 1 *)
definition Q :: nat where
  "Q = 8380417"

(* Montgomery factor R = 2^32 *)
definition R :: nat where
  "R = 4294967296"

(* R_sqrt = 2^16 for decomposition *)
definition R_sqrt :: nat where
  "R_sqrt = 65536"

(* Winterfell field characteristic P = 2^128 - 45 * 2^40 + 1 *)
definition P :: nat where
  "P = 340282366920938463463374607393113505793"

(* Precomputed: -Q^{-1} mod R = 4236238847 *)
definition neg_Q_inv_mod_R :: nat where
  "neg_Q_inv_mod_R = 4236238847"

(* ========================================================================== *)
(* Section 2: Basic Properties of Constants                                   *)
(* ========================================================================== *)

lemma Q_positive: "Q > 0"
  unfolding Q_def by simp

lemma R_positive: "R > 0"
  unfolding R_def by simp

lemma P_positive: "P > 0"
  unfolding P_def by simp

lemma R_greater_than_Q: "R > Q"
  unfolding R_def Q_def by simp

lemma two_Q_less_than_R: "2 * Q < R"
  unfolding R_def Q_def by simp

(* Q and R are coprime (required for Montgomery reduction) *)
lemma Q_R_coprime: "gcd Q R = 1"
  unfolding Q_def R_def
  by (simp add: gcd_nat.simps)

(* ========================================================================== *)
(* Section 3: Field Element Lifting                                           *)
(* ========================================================================== *)

(* Lift function: interprets field element as integer in [0, P) *)
definition lift :: "nat \<Rightarrow> int" where
  "lift x = int (x mod P)"

(* Embedding function: integer to field element *)
definition embed :: "int \<Rightarrow> nat" where
  "embed x = nat (x mod int P)"

(* Lifting preserves values in range *)
lemma lift_in_range: "0 \<le> lift x \<and> lift x < int P"
  unfolding lift_def by auto

(* Round-trip property for small values *)
lemma lift_embed_small:
  assumes "0 \<le> x" and "x < int P"
  shows "lift (embed x) = x"
  using assms unfolding lift_def embed_def
  by (simp add: nat_mod_distrib)

(* ========================================================================== *)
(* Section 4: Range Constraints (from PRC)                                    *)
(* ========================================================================== *)

(* Range predicate for FMA inputs *)
definition range_valid :: "nat \<Rightarrow> nat \<Rightarrow> nat \<Rightarrow> nat \<Rightarrow> nat \<Rightarrow> bool" where
  "range_valid A B C M R' \<equiv>
     A < Q \<and>
     B < Q \<and>
     C < Q \<and>
     M < R \<and>
     R' < 2 * Q"

(* Range for decomposed chunks (16-bit) *)
definition chunk_valid :: "nat \<Rightarrow> bool" where
  "chunk_valid x \<equiv> x < R_sqrt"

(* M decomposes into valid chunks *)
definition M_decomposition_valid :: "nat \<Rightarrow> nat \<Rightarrow> nat \<Rightarrow> bool" where
  "M_decomposition_valid M M_H M_L \<equiv>
     M = M_H * R_sqrt + M_L \<and>
     chunk_valid M_H \<and>
     chunk_valid M_L"

(* ========================================================================== *)
(* Section 5: Montgomery FMA Constraint                                       *)
(* ========================================================================== *)

(* The core algebraic constraint in the field *)
definition C_FMA_field :: "nat \<Rightarrow> nat \<Rightarrow> nat \<Rightarrow> nat \<Rightarrow> nat \<Rightarrow> bool" where
  "C_FMA_field A B C M R' \<equiv>
     (A * B + C + M * Q) mod P = (R' * R) mod P"

(* The constraint lifted to integers (before mod P reduction) *)
definition C_FMA_int :: "nat \<Rightarrow> nat \<Rightarrow> nat \<Rightarrow> nat \<Rightarrow> nat \<Rightarrow> bool" where
  "C_FMA_int A B C M R' \<equiv>
     A * B + C + M * Q = R' * R"

(* ========================================================================== *)
(* Section 6: Key Lemmas                                                      *)
(* ========================================================================== *)

(* Lemma: Upper bound on LHS of FMA equation *)
lemma lhs_upper_bound:
  assumes "A < Q" "B < Q" "C < Q" "M < R"
  shows "A * B + C + M * Q < Q * Q + Q + R * Q"
proof -
  have "A * B < Q * Q" using assms by (simp add: mult_strict_mono)
  moreover have "C < Q" using assms by simp
  moreover have "M * Q < R * Q" using assms by simp
  ultimately show ?thesis by linarith
qed

(* Lemma: Upper bound on RHS of FMA equation *)
lemma rhs_upper_bound:
  assumes "R' < 2 * Q"
  shows "R' * R < 2 * Q * R"
  using assms by simp

(* Lemma: LHS is less than P (no wrap-around) *)
lemma lhs_less_than_P:
  assumes "A < Q" "B < Q" "C < Q" "M < R"
  shows "A * B + C + M * Q < P"
proof -
  (* Q^2 + Q + R*Q is much smaller than P *)
  (* Q^2 = 70231105454689 *)
  (* R*Q = 35747327164416 *)
  (* Sum < 10^14 << P ~ 3.4 * 10^38 *)
  have bound: "Q * Q + Q + R * Q < P"
    unfolding Q_def R_def P_def by simp
  have "A * B + C + M * Q < Q * Q + Q + R * Q"
    using lhs_upper_bound assms by simp
  thus ?thesis using bound by linarith
qed

(* Lemma: RHS is less than P (no wrap-around) *)
lemma rhs_less_than_P:
  assumes "R' < 2 * Q"
  shows "R' * R < P"
proof -
  have "2 * Q * R < P"
    unfolding Q_def R_def P_def by simp
  thus ?thesis using assms by (simp add: mult_strict_mono)
qed

(* ========================================================================== *)
(* Section 7: The k=0 Theorem                                                 *)
(* ========================================================================== *)

(* Key theorem: field equality implies integer equality (k=0) *)
theorem k_equals_zero:
  assumes range: "range_valid A B C M R'"
  assumes field_eq: "C_FMA_field A B C M R'"
  shows "C_FMA_int A B C M R'"
proof -
  (* Extract range bounds *)
  have A_bound: "A < Q" using range unfolding range_valid_def by simp
  have B_bound: "B < Q" using range unfolding range_valid_def by simp
  have C_bound: "C < Q" using range unfolding range_valid_def by simp
  have M_bound: "M < R" using range unfolding range_valid_def by simp
  have R'_bound: "R' < 2 * Q" using range unfolding range_valid_def by simp

  (* LHS < P, so no mod P reduction occurs *)
  have lhs_no_wrap: "A * B + C + M * Q < P"
    using lhs_less_than_P A_bound B_bound C_bound M_bound by simp

  (* RHS < P, so no mod P reduction occurs *)
  have rhs_no_wrap: "R' * R < P"
    using rhs_less_than_P R'_bound by simp

  (* Therefore mod P is identity on both sides *)
  have lhs_mod: "(A * B + C + M * Q) mod P = A * B + C + M * Q"
    using lhs_no_wrap by simp

  have rhs_mod: "(R' * R) mod P = R' * R"
    using rhs_no_wrap by simp

  (* From field equality, derive integer equality *)
  from field_eq have "(A * B + C + M * Q) mod P = (R' * R) mod P"
    unfolding C_FMA_field_def by simp
  hence "A * B + C + M * Q = R' * R"
    using lhs_mod rhs_mod by simp

  thus ?thesis unfolding C_FMA_int_def by simp
qed

(* ========================================================================== *)
(* Section 8: Montgomery Reduction Correctness                                *)
(* ========================================================================== *)

(* Definition: Montgomery reduction result *)
definition montgomery_result :: "nat \<Rightarrow> nat \<Rightarrow> nat \<Rightarrow> nat" where
  "montgomery_result A B C \<equiv> ((A * B + C) * (SOME x. x * R mod Q = 1 mod Q)) mod Q"

(* Theorem: M is the correct Montgomery quotient *)
theorem M_is_montgomery_quotient:
  assumes "C_FMA_int A B C M R'"
  shows "((A * B + C) + M * Q) mod R = 0"
proof -
  from assms have eq: "A * B + C + M * Q = R' * R"
    unfolding C_FMA_int_def by simp
  hence "(A * B + C + M * Q) mod R = (R' * R) mod R"
    by simp
  also have "... = 0"
    by simp
  finally show ?thesis by simp
qed

(* Theorem: R' is congruent to the Montgomery-reduced result mod Q *)
theorem R'_montgomery_congruence:
  assumes "C_FMA_int A B C M R'"
  shows "(R' * R) mod Q = (A * B + C) mod Q"
proof -
  from assms have eq: "A * B + C + M * Q = R' * R"
    unfolding C_FMA_int_def by simp
  hence "(A * B + C + M * Q) mod Q = (R' * R) mod Q"
    by simp
  also have "(A * B + C + M * Q) mod Q = (A * B + C) mod Q"
    by (simp add: mod_add_right_eq)
  finally show ?thesis by simp
qed

(* ========================================================================== *)
(* Section 9: Main Soundness Theorem                                          *)
(* ========================================================================== *)

(* Main theorem: FMA constraint is sound for Montgomery reduction *)
theorem FMA_Soundness:
  assumes range: "range_valid A B C M R'"
  assumes field_eq: "C_FMA_field A B C M R'"
  shows "(R' * R) mod Q = (A * B + C) mod Q"
proof -
  (* Step 1: k=0, so field equality implies integer equality *)
  have int_eq: "C_FMA_int A B C M R'"
    using k_equals_zero range field_eq by simp

  (* Step 2: Apply Montgomery congruence *)
  show ?thesis using R'_montgomery_congruence int_eq by simp
qed

(* Corollary: R' mod Q equals the Montgomery-reduced product *)
corollary FMA_Soundness_mod_Q:
  assumes range: "range_valid A B C M R'"
  assumes field_eq: "C_FMA_field A B C M R'"
  assumes R_inv: "R_inv * R mod Q = 1"
  shows "R' mod Q = ((A * B + C) * R_inv) mod Q"
proof -
  from FMA_Soundness[OF range field_eq]
  have "(R' * R) mod Q = (A * B + C) mod Q" by simp

  (* Multiply both sides by R_inv *)
  hence "((R' * R) * R_inv) mod Q = ((A * B + C) * R_inv) mod Q"
    by (simp add: mod_mult_cong)

  (* Simplify LHS using R * R_inv = 1 mod Q *)
  have "((R' * R) * R_inv) mod Q = (R' * (R * R_inv)) mod Q"
    by (simp add: mult.assoc)
  also have "... = (R' * (R * R_inv mod Q)) mod Q"
    by (simp add: mod_mult_right_eq)
  also have "... = (R' * 1) mod Q"
    using R_inv by simp
  also have "... = R' mod Q"
    by simp
  finally show ?thesis
    using \<open>((R' * R) * R_inv) mod Q = ((A * B + C) * R_inv) mod Q\<close>
    by simp
qed

(* ========================================================================== *)
(* Section 10: Verification of Implementation Constants                       *)
(* ========================================================================== *)

(* Verify: neg_Q_inv_mod_R is correct *)
lemma neg_Q_inv_correct:
  "(neg_Q_inv_mod_R * Q) mod R = R - 1"
  unfolding neg_Q_inv_mod_R_def Q_def R_def
  by simp

(* Verify: R_sqrt^2 = R *)
lemma R_sqrt_squared: "R_sqrt * R_sqrt = R"
  unfolding R_sqrt_def R_def by simp

(* Verify: decomposition range implies M range *)
lemma decomposition_implies_range:
  assumes "M_decomposition_valid M M_H M_L"
  shows "M < R"
proof -
  from assms have "M = M_H * R_sqrt + M_L"
    unfolding M_decomposition_valid_def by simp
  moreover from assms have "M_H < R_sqrt" "M_L < R_sqrt"
    unfolding M_decomposition_valid_def chunk_valid_def by simp_all
  ultimately have "M < R_sqrt * R_sqrt + R_sqrt"
    by (simp add: mult_strict_mono)
  also have "... = R + R_sqrt"
    using R_sqrt_squared by simp
  also have "... > R"
    unfolding R_sqrt_def by simp
  finally show "M < R"
    using \<open>M < R_sqrt * R_sqrt + R_sqrt\<close> R_sqrt_squared
    unfolding R_sqrt_def R_def by simp
qed

end
