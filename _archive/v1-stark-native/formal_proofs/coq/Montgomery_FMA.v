(** ========================================================================== *)
(** Montgomery FMA Gate Formal Verification                                    *)
(** Dilithium Signature Verification STARK Proof System                        *)
(**                                                                            *)
(** This Coq development proves the soundness of the Montgomery FMA constraint *)
(**   C_FMA: A * B + C + M * Q = R' * R  (in F_p)                              *)
(**                                                                            *)
(** Main Theorem: FMA_Soundness                                                *)
(**   The algebraic constraint implies correct Montgomery reduction            *)
(** ========================================================================== *)

Require Import ZArith.
Require Import Lia.
Require Import Znumtheory.

Open Scope Z_scope.

(** ========================================================================== *)
(** Section 1: Dilithium Constants                                             *)
(** ========================================================================== *)

(** Dilithium modulus Q = 8380417 = 2^23 - 2^13 + 1 *)
Definition Q : Z := 8380417.

(** Montgomery factor R = 2^32 *)
Definition R : Z := 4294967296.

(** R_sqrt = 2^16 for decomposition *)
Definition R_sqrt : Z := 65536.

(** Winterfell field characteristic P = 2^128 - 45 * 2^40 + 1 *)
Definition P : Z := 340282366920938463463374607393113505793.

(** Precomputed: -Q^{-1} mod R = 4236238847 *)
Definition neg_Q_inv_mod_R : Z := 4236238847.

(** ========================================================================== *)
(** Section 2: Basic Properties of Constants                                   *)
(** ========================================================================== *)

Lemma Q_positive : Q > 0.
Proof. unfold Q. lia. Qed.

Lemma R_positive : R > 0.
Proof. unfold R. lia. Qed.

Lemma P_positive : P > 0.
Proof. unfold P. lia. Qed.

Lemma R_greater_than_Q : R > Q.
Proof. unfold R, Q. lia. Qed.

Lemma two_Q_less_than_R : 2 * Q < R.
Proof. unfold R, Q. lia. Qed.

Lemma R_sqrt_squared : R_sqrt * R_sqrt = R.
Proof. unfold R_sqrt, R. lia. Qed.

(** ========================================================================== *)
(** Section 3: Range Constraints (from PRC)                                    *)
(** ========================================================================== *)

(** Range predicate for FMA inputs *)
Definition range_valid (A B C M R' : Z) : Prop :=
  0 <= A /\ A < Q /\
  0 <= B /\ B < Q /\
  0 <= C /\ C < Q /\
  0 <= M /\ M < R /\
  0 <= R' /\ R' < 2 * Q.

(** Range for decomposed chunks (16-bit) *)
Definition chunk_valid (x : Z) : Prop :=
  0 <= x /\ x < R_sqrt.

(** M decomposes into valid chunks *)
Definition M_decomposition_valid (M M_H M_L : Z) : Prop :=
  M = M_H * R_sqrt + M_L /\
  chunk_valid M_H /\
  chunk_valid M_L.

(** ========================================================================== *)
(** Section 4: Montgomery FMA Constraint                                       *)
(** ========================================================================== *)

(** The core algebraic constraint in the field *)
Definition C_FMA_field (A B C M R' : Z) : Prop :=
  (A * B + C + M * Q) mod P = (R' * R) mod P.

(** The constraint lifted to integers (before mod P reduction) *)
Definition C_FMA_int (A B C M R' : Z) : Prop :=
  A * B + C + M * Q = R' * R.

(** ========================================================================== *)
(** Section 5: Key Lemmas for k=0 Proof                                        *)
(** ========================================================================== *)

(** Upper bound on LHS of FMA equation *)
Lemma lhs_upper_bound :
  forall A B C M,
    0 <= A -> A < Q ->
    0 <= B -> B < Q ->
    0 <= C -> C < Q ->
    0 <= M -> M < R ->
    A * B + C + M * Q < Q * Q + Q + R * Q.
Proof.
  intros A B C M HA1 HA2 HB1 HB2 HC1 HC2 HM1 HM2.
  assert (A * B < Q * Q) by nia.
  assert (C < Q) by lia.
  assert (M * Q < R * Q) by nia.
  lia.
Qed.

(** Upper bound on RHS of FMA equation *)
Lemma rhs_upper_bound :
  forall R',
    0 <= R' -> R' < 2 * Q ->
    R' * R < 2 * Q * R.
Proof.
  intros R' HR1 HR2.
  nia.
Qed.

(** Compute bound: Q^2 + Q + R*Q *)
Definition lhs_max_bound : Z := Q * Q + Q + R * Q.

(** Compute bound: 2*Q*R *)
Definition rhs_max_bound : Z := 2 * Q * R.

(** Verify LHS max bound is less than P *)
Lemma lhs_bound_less_than_P : lhs_max_bound < P.
Proof.
  unfold lhs_max_bound, Q, R, P.
  lia.
Qed.

(** Verify RHS max bound is less than P *)
Lemma rhs_bound_less_than_P : rhs_max_bound < P.
Proof.
  unfold rhs_max_bound, Q, R, P.
  lia.
Qed.

(** LHS is less than P (no wrap-around) *)
Lemma lhs_less_than_P :
  forall A B C M,
    0 <= A -> A < Q ->
    0 <= B -> B < Q ->
    0 <= C -> C < Q ->
    0 <= M -> M < R ->
    A * B + C + M * Q < P.
Proof.
  intros A B C M HA1 HA2 HB1 HB2 HC1 HC2 HM1 HM2.
  assert (Hbound: A * B + C + M * Q < lhs_max_bound).
  { unfold lhs_max_bound.
    pose proof (lhs_upper_bound A B C M HA1 HA2 HB1 HB2 HC1 HC2 HM1 HM2).
    lia. }
  pose proof lhs_bound_less_than_P.
  lia.
Qed.

(** RHS is less than P (no wrap-around) *)
Lemma rhs_less_than_P :
  forall R',
    0 <= R' -> R' < 2 * Q ->
    R' * R < P.
Proof.
  intros R' HR1 HR2.
  assert (Hbound: R' * R < rhs_max_bound).
  { unfold rhs_max_bound.
    pose proof (rhs_upper_bound R' HR1 HR2).
    lia. }
  pose proof rhs_bound_less_than_P.
  lia.
Qed.

(** LHS is non-negative *)
Lemma lhs_nonneg :
  forall A B C M,
    0 <= A -> 0 <= B -> 0 <= C -> 0 <= M ->
    0 <= A * B + C + M * Q.
Proof.
  intros. nia.
Qed.

(** RHS is non-negative *)
Lemma rhs_nonneg :
  forall R',
    0 <= R' ->
    0 <= R' * R.
Proof.
  intros. unfold R. nia.
Qed.

(** ========================================================================== *)
(** Section 6: The k=0 Theorem                                                 *)
(** ========================================================================== *)

(** Small positive mod is identity *)
Lemma mod_small_pos :
  forall x m,
    0 <= x -> x < m -> m > 0 ->
    x mod m = x.
Proof.
  intros x m Hx1 Hx2 Hm.
  apply Z.mod_small.
  lia.
Qed.

(** Key theorem: field equality implies integer equality (k=0) *)
Theorem k_equals_zero :
  forall A B C M R',
    range_valid A B C M R' ->
    C_FMA_field A B C M R' ->
    C_FMA_int A B C M R'.
Proof.
  intros A B C M R' Hrange Hfield.
  unfold range_valid in Hrange.
  destruct Hrange as [HA1 [HA2 [HB1 [HB2 [HC1 [HC2 [HM1 [HM2 [HR1 HR2]]]]]]]]].
  unfold C_FMA_field in Hfield.
  unfold C_FMA_int.

  (* LHS < P, so mod P is identity *)
  assert (Hlhs_bound: A * B + C + M * Q < P).
  { apply lhs_less_than_P; assumption. }

  assert (Hlhs_nonneg: 0 <= A * B + C + M * Q).
  { apply lhs_nonneg; assumption. }

  assert (Hlhs_mod: (A * B + C + M * Q) mod P = A * B + C + M * Q).
  { apply mod_small_pos; [assumption | assumption | apply P_positive]. }

  (* RHS < P, so mod P is identity *)
  assert (Hrhs_bound: R' * R < P).
  { apply rhs_less_than_P; assumption. }

  assert (Hrhs_nonneg: 0 <= R' * R).
  { apply rhs_nonneg; assumption. }

  assert (Hrhs_mod: (R' * R) mod P = R' * R).
  { apply mod_small_pos; [assumption | assumption | apply P_positive]. }

  (* Combine: field equality implies integer equality *)
  rewrite Hlhs_mod in Hfield.
  rewrite Hrhs_mod in Hfield.
  exact Hfield.
Qed.

(** ========================================================================== *)
(** Section 7: Montgomery Reduction Correctness                                *)
(** ========================================================================== *)

(** M is the correct Montgomery quotient: (P + M*Q) mod R = 0 *)
Theorem M_is_montgomery_quotient :
  forall A B C M R',
    C_FMA_int A B C M R' ->
    (A * B + C + M * Q) mod R = 0.
Proof.
  intros A B C M R' Hint.
  unfold C_FMA_int in Hint.
  rewrite Hint.
  (* R' * R mod R = 0 *)
  rewrite Z.mul_comm.
  rewrite Z.mod_mul.
  - reflexivity.
  - unfold R. lia.
Qed.

(** R' is congruent to the Montgomery-reduced result mod Q *)
Theorem R'_montgomery_congruence :
  forall A B C M R',
    C_FMA_int A B C M R' ->
    (R' * R) mod Q = (A * B + C) mod Q.
Proof.
  intros A B C M R' Hint.
  unfold C_FMA_int in Hint.
  (* A * B + C + M * Q = R' * R *)
  (* Taking mod Q: (A * B + C + M * Q) mod Q = (R' * R) mod Q *)
  (* (A * B + C) mod Q = (R' * R) mod Q *)
  rewrite <- Hint.
  rewrite Zplus_mod.
  rewrite Z.mul_comm with (n := M).
  rewrite Z_mod_mult.
  rewrite Z.add_0_r.
  rewrite Zmod_mod.
  reflexivity.
Qed.

(** ========================================================================== *)
(** Section 8: Main Soundness Theorem                                          *)
(** ========================================================================== *)

(** Main theorem: FMA constraint is sound for Montgomery reduction *)
Theorem FMA_Soundness :
  forall A B C M R',
    range_valid A B C M R' ->
    C_FMA_field A B C M R' ->
    (R' * R) mod Q = (A * B + C) mod Q.
Proof.
  intros A B C M R' Hrange Hfield.
  (* Step 1: k=0, field equality implies integer equality *)
  assert (Hint: C_FMA_int A B C M R').
  { apply k_equals_zero; assumption. }
  (* Step 2: Apply Montgomery congruence *)
  apply R'_montgomery_congruence.
  assumption.
Qed.

(** ========================================================================== *)
(** Section 9: Extended Soundness with R^{-1}                                  *)
(** ========================================================================== *)

(** Corollary: R' mod Q equals Montgomery-reduced product (with R^{-1}) *)
Theorem FMA_Soundness_mod_Q :
  forall A B C M R' R_inv,
    range_valid A B C M R' ->
    C_FMA_field A B C M R' ->
    (R_inv * R) mod Q = 1 ->
    R' mod Q = ((A * B + C) * R_inv) mod Q.
Proof.
  intros A B C M R' R_inv Hrange Hfield HR_inv.

  (* From main soundness *)
  assert (Hcong: (R' * R) mod Q = (A * B + C) mod Q).
  { apply FMA_Soundness; assumption. }

  (* Multiply both sides by R_inv and simplify *)
  assert (H1: ((R' * R) * R_inv) mod Q = ((A * B + C) * R_inv) mod Q).
  { rewrite Zmult_mod. rewrite Hcong. rewrite <- Zmult_mod. reflexivity. }

  (* Simplify LHS: (R' * R * R_inv) mod Q = R' mod Q *)
  assert (H2: ((R' * R) * R_inv) mod Q = R' mod Q).
  { rewrite Z.mul_assoc.
    rewrite Z.mul_comm with (n := R) (m := R_inv).
    rewrite <- Z.mul_assoc.
    rewrite Zmult_mod.
    rewrite HR_inv.
    rewrite Z.mul_1_r.
    rewrite Zmod_mod.
    reflexivity. }

  rewrite <- H2.
  exact H1.
Qed.

(** ========================================================================== *)
(** Section 10: Verification of Implementation Constants                       *)
(** ========================================================================== *)

(** Verify: decomposition range implies M range *)
Lemma decomposition_implies_range :
  forall M M_H M_L,
    M_decomposition_valid M M_H M_L ->
    0 <= M /\ M < R.
Proof.
  intros M M_H M_L Hdecomp.
  unfold M_decomposition_valid in Hdecomp.
  destruct Hdecomp as [Heq [HH HL]].
  unfold chunk_valid in HH, HL.
  destruct HH as [HH1 HH2].
  destruct HL as [HL1 HL2].
  split.
  - (* 0 <= M *)
    rewrite Heq.
    unfold R_sqrt.
    nia.
  - (* M < R *)
    rewrite Heq.
    assert (M_H * R_sqrt < R_sqrt * R_sqrt).
    { unfold R_sqrt. nia. }
    assert (M_H * R_sqrt + M_L < R_sqrt * R_sqrt + R_sqrt).
    { unfold R_sqrt in *. nia. }
    rewrite R_sqrt_squared in H0.
    unfold R, R_sqrt in *.
    lia.
Qed.

(** ========================================================================== *)
(** Section 11: Complete Verification Chain                                    *)
(** ========================================================================== *)

(** Complete verification: from PRC chunks to Montgomery correctness *)
Theorem complete_FMA_verification :
  forall A B C M M_H M_L R',
    (* Input ranges from Dilithium spec *)
    0 <= A /\ A < Q ->
    0 <= B /\ B < Q ->
    0 <= C /\ C < Q ->
    0 <= R' /\ R' < 2 * Q ->
    (* M decomposition from PRC *)
    M_decomposition_valid M M_H M_L ->
    (* Field constraint from STARK *)
    C_FMA_field A B C M R' ->
    (* Conclusion: Montgomery reduction is correct *)
    (R' * R) mod Q = (A * B + C) mod Q.
Proof.
  intros A B C M M_H M_L R' HA HB HC HR' Hdecomp Hfield.

  (* Derive M range from decomposition *)
  assert (HM: 0 <= M /\ M < R).
  { apply decomposition_implies_range with M_H M_L. assumption. }

  (* Build range_valid *)
  assert (Hrange: range_valid A B C M R').
  { unfold range_valid.
    destruct HA, HB, HC, HM, HR'.
    repeat split; assumption. }

  (* Apply main soundness theorem *)
  apply FMA_Soundness; assumption.
Qed.

Close Scope Z_scope.
