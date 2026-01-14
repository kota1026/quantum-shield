// Lean compiler output
// Module: NTT
// Imports: Init Mathlib.Data.Int.ModEq Mathlib.Data.ZMod.Basic Mathlib.Algebra.Field.Basic Mathlib.Data.Nat.Prime.Basic Mathlib.Tactic
#include <lean/lean.h>
#if defined(__clang__)
#pragma clang diagnostic ignored "-Wunused-parameter"
#pragma clang diagnostic ignored "-Wunused-label"
#elif defined(__GNUC__) && !defined(__CLANG__)
#pragma GCC diagnostic ignored "-Wunused-parameter"
#pragma GCC diagnostic ignored "-Wunused-label"
#pragma GCC diagnostic ignored "-Wunused-but-set-variable"
#endif
#ifdef __cplusplus
extern "C" {
#endif
lean_object* lean_nat_gcd(lean_object*, lean_object*);
lean_object* l_CommRing_toNonUnitalCommRing___rarg(lean_object*);
LEAN_EXPORT uint8_t l_Q__odd___nativeDecide__1;
lean_object* l_ZMod_commRing(lean_object*);
static lean_object* l_reduce32___closed__2;
static lean_object* l_Q__half___closed__1;
static uint8_t l_N__mod__Q__ne__zero___nativeDecide__1___closed__2;
LEAN_EXPORT lean_object* l_Q__half;
static uint8_t l_R__coprime__Q___nativeDecide__1___closed__2;
static uint8_t l_two__mod__Q__ne__zero___nativeDecide__1___closed__2;
lean_object* l_NonUnitalNonAssocSemiring_toDistrib___rarg(lean_object*);
uint8_t l_ZMod_decidableEq(lean_object*, lean_object*, lean_object*);
lean_object* l_Semifield_toDivisionSemiring___rarg(lean_object*);
static lean_object* l_fromMontgomery___closed__2;
static lean_object* l_Nat_cast___at_fromMontgomery___spec__1___closed__1;
LEAN_EXPORT uint8_t l_zeta__pow__512___nativeDecide__1;
static lean_object* l_R__coprime__Q___nativeDecide__1___closed__1;
lean_object* lean_nat_shiftr(lean_object*, lean_object*);
LEAN_EXPORT lean_object* l_butterfly(lean_object*, lean_object*, lean_object*);
LEAN_EXPORT uint8_t l_R__mod__Q__ne__zero___nativeDecide__1;
static lean_object* l_zeta__pow__512___nativeDecide__1___closed__2;
LEAN_EXPORT uint8_t l_two__mod__Q__ne__zero___nativeDecide__1;
static lean_object* l_Int_cast___at_toMontgomery___spec__1___closed__1;
static lean_object* l_reduce32___closed__4;
lean_object* l_NonUnitalNonAssocCommRing_toNonUnitalNonAssocCommSemiring___rarg(lean_object*);
LEAN_EXPORT lean_object* l_reduce32___boxed(lean_object*);
LEAN_EXPORT lean_object* l_bitReverse8___boxed(lean_object*);
uint8_t l_instDecidableNot___rarg(uint8_t);
LEAN_EXPORT lean_object* l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1(lean_object*);
static lean_object* l_Int_cast___at_toMontgomery___spec__1___closed__2;
lean_object* lean_nat_to_int(lean_object*);
lean_object* l_Int_pow(lean_object*, lean_object*);
LEAN_EXPORT lean_object* l_R;
static lean_object* l_reduce32___closed__3;
static lean_object* l_butterfly___closed__2;
static lean_object* l_mont__value___nativeDecide__1___closed__1;
static lean_object* l_reduce32___closed__1;
LEAN_EXPORT lean_object* l_caddq(lean_object*);
static lean_object* l_N__mod__Q__ne__zero___nativeDecide__1___closed__1;
static uint8_t l_Q__prime___nativeDecide__1___closed__1;
static lean_object* l_fromMontgomery___closed__1;
static uint8_t l_two__mod__Q__ne__zero___nativeDecide__1___closed__3;
lean_object* l_Semifield_toCommGroupWithZero___rarg(lean_object*);
static lean_object* l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1___closed__2;
lean_object* lean_nat_land(lean_object*, lean_object*);
static lean_object* l_Nat_cast___at_fromMontgomery___spec__1___closed__2;
static lean_object* l_two__mod__Q__ne__zero___nativeDecide__1___closed__1;
lean_object* l_ZMod_instField(lean_object*, lean_object*);
static uint8_t l_N__mod__Q__ne__zero___nativeDecide__1___closed__3;
LEAN_EXPORT uint8_t l_R__coprime__Q___nativeDecide__1;
static lean_object* l_mont__value___nativeDecide__1___closed__2;
LEAN_EXPORT lean_object* l_Nat_cast___at_fromMontgomery___spec__1(lean_object*);
static lean_object* l_zeta__pow__512___nativeDecide__1___closed__1;
lean_object* lean_int_sub(lean_object*, lean_object*);
static uint8_t l_zeta__pow__512___nativeDecide__1___closed__3;
static lean_object* l_butterfly___closed__1;
lean_object* l_Field_toDivisionRing___rarg(lean_object*);
static uint8_t l_mont__value___nativeDecide__1___closed__3;
LEAN_EXPORT lean_object* l_caddq___boxed(lean_object*);
static lean_object* l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1___closed__3;
lean_object* lean_int_mul(lean_object*, lean_object*);
uint8_t lean_nat_dec_eq(lean_object*, lean_object*);
lean_object* lean_nat_mod(lean_object*, lean_object*);
LEAN_EXPORT lean_object* l_fromMontgomery(lean_object*);
lean_object* lean_nat_shiftl(lean_object*, lean_object*);
uint8_t lean_int_dec_lt(lean_object*, lean_object*);
LEAN_EXPORT lean_object* l_Q;
static lean_object* l__u03b6___closed__1;
static lean_object* l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1___closed__1;
LEAN_EXPORT uint8_t l_N__mod__Q__ne__zero___nativeDecide__1;
static lean_object* l_R__mod__Q__ne__zero___nativeDecide__1___closed__1;
lean_object* l_Field_toSemifield___rarg(lean_object*);
lean_object* lean_int_add(lean_object*, lean_object*);
static lean_object* l_toMontgomery___closed__1;
LEAN_EXPORT lean_object* l_toMontgomery(lean_object*);
lean_object* lean_int_ediv(lean_object*, lean_object*);
lean_object* l_ZMod_inv(lean_object*, lean_object*);
LEAN_EXPORT lean_object* l_toMontgomery___boxed(lean_object*);
LEAN_EXPORT lean_object* l_bitReverse8(lean_object*);
LEAN_EXPORT lean_object* l_reduce32(lean_object*);
LEAN_EXPORT lean_object* l_Int_cast___at_toMontgomery___spec__1(lean_object*);
uint8_t l_Nat_decidablePrime(lean_object*);
LEAN_EXPORT uint8_t l_mont__value___nativeDecide__1;
LEAN_EXPORT lean_object* l_N;
lean_object* lean_nat_lor(lean_object*, lean_object*);
LEAN_EXPORT uint8_t l_Q__prime___nativeDecide__1;
LEAN_EXPORT lean_object* l__u03b6;
static lean_object* l_caddq___closed__1;
lean_object* l_ZMod_val(lean_object*, lean_object*);
static lean_object* _init_l_Q() {
_start:
{
lean_object* x_1; 
x_1 = lean_unsigned_to_nat(8380417u);
return x_1;
}
}
static uint8_t _init_l_Q__prime___nativeDecide__1___closed__1() {
_start:
{
lean_object* x_1; uint8_t x_2; 
x_1 = l_Q;
x_2 = l_Nat_decidablePrime(x_1);
return x_2;
}
}
static uint8_t _init_l_Q__prime___nativeDecide__1() {
_start:
{
uint8_t x_1; 
x_1 = l_Q__prime___nativeDecide__1___closed__1;
return x_1;
}
}
static lean_object* _init_l_N() {
_start:
{
lean_object* x_1; 
x_1 = lean_unsigned_to_nat(256u);
return x_1;
}
}
static lean_object* _init_l_R() {
_start:
{
lean_object* x_1; 
x_1 = lean_cstr_to_nat("4294967296");
return x_1;
}
}
static lean_object* _init_l_Int_cast___at_toMontgomery___spec__1___closed__1() {
_start:
{
lean_object* x_1; lean_object* x_2; 
x_1 = l_Q;
x_2 = l_ZMod_instField(x_1, lean_box(0));
return x_2;
}
}
static lean_object* _init_l_Int_cast___at_toMontgomery___spec__1___closed__2() {
_start:
{
lean_object* x_1; lean_object* x_2; 
x_1 = l_Int_cast___at_toMontgomery___spec__1___closed__1;
x_2 = l_Field_toDivisionRing___rarg(x_1);
return x_2;
}
}
LEAN_EXPORT lean_object* l_Int_cast___at_toMontgomery___spec__1(lean_object* x_1) {
_start:
{
lean_object* x_2; lean_object* x_3; lean_object* x_4; lean_object* x_5; 
x_2 = l_Int_cast___at_toMontgomery___spec__1___closed__2;
x_3 = lean_ctor_get(x_2, 0);
lean_inc(x_3);
x_4 = lean_ctor_get(x_3, 4);
lean_inc(x_4);
lean_dec(x_3);
x_5 = lean_apply_1(x_4, x_1);
return x_5;
}
}
static lean_object* _init_l_toMontgomery___closed__1() {
_start:
{
lean_object* x_1; lean_object* x_2; 
x_1 = l_R;
x_2 = lean_nat_to_int(x_1);
return x_2;
}
}
LEAN_EXPORT lean_object* l_toMontgomery(lean_object* x_1) {
_start:
{
lean_object* x_2; lean_object* x_3; lean_object* x_4; 
x_2 = l_toMontgomery___closed__1;
x_3 = lean_int_mul(x_1, x_2);
x_4 = l_Int_cast___at_toMontgomery___spec__1(x_3);
return x_4;
}
}
LEAN_EXPORT lean_object* l_toMontgomery___boxed(lean_object* x_1) {
_start:
{
lean_object* x_2; 
x_2 = l_toMontgomery(x_1);
lean_dec(x_1);
return x_2;
}
}
static lean_object* _init_l_Nat_cast___at_fromMontgomery___spec__1___closed__1() {
_start:
{
lean_object* x_1; lean_object* x_2; 
x_1 = l_Int_cast___at_toMontgomery___spec__1___closed__1;
x_2 = l_Field_toSemifield___rarg(x_1);
return x_2;
}
}
static lean_object* _init_l_Nat_cast___at_fromMontgomery___spec__1___closed__2() {
_start:
{
lean_object* x_1; lean_object* x_2; 
x_1 = l_Nat_cast___at_fromMontgomery___spec__1___closed__1;
x_2 = l_Semifield_toDivisionSemiring___rarg(x_1);
return x_2;
}
}
LEAN_EXPORT lean_object* l_Nat_cast___at_fromMontgomery___spec__1(lean_object* x_1) {
_start:
{
lean_object* x_2; lean_object* x_3; lean_object* x_4; lean_object* x_5; 
x_2 = l_Nat_cast___at_fromMontgomery___spec__1___closed__2;
x_3 = lean_ctor_get(x_2, 0);
lean_inc(x_3);
x_4 = lean_ctor_get(x_3, 2);
lean_inc(x_4);
lean_dec(x_3);
x_5 = lean_apply_1(x_4, x_1);
return x_5;
}
}
static lean_object* _init_l_fromMontgomery___closed__1() {
_start:
{
lean_object* x_1; lean_object* x_2; 
x_1 = l_Q;
x_2 = l_ZMod_commRing(x_1);
return x_2;
}
}
static lean_object* _init_l_fromMontgomery___closed__2() {
_start:
{
lean_object* x_1; lean_object* x_2; 
x_1 = l_fromMontgomery___closed__1;
x_2 = l_CommRing_toNonUnitalCommRing___rarg(x_1);
return x_2;
}
}
LEAN_EXPORT lean_object* l_fromMontgomery(lean_object* x_1) {
_start:
{
lean_object* x_2; lean_object* x_3; lean_object* x_4; lean_object* x_5; lean_object* x_6; lean_object* x_7; lean_object* x_8; 
x_2 = l_fromMontgomery___closed__2;
x_3 = lean_ctor_get(x_2, 1);
lean_inc(x_3);
x_4 = l_R;
x_5 = l_Nat_cast___at_fromMontgomery___spec__1(x_4);
x_6 = l_Q;
x_7 = l_ZMod_inv(x_6, x_5);
lean_dec(x_5);
x_8 = lean_apply_2(x_3, x_1, x_7);
return x_8;
}
}
static lean_object* _init_l_R__coprime__Q___nativeDecide__1___closed__1() {
_start:
{
lean_object* x_1; lean_object* x_2; lean_object* x_3; 
x_1 = lean_cstr_to_nat("4294967296");
x_2 = lean_unsigned_to_nat(8380417u);
x_3 = lean_nat_gcd(x_1, x_2);
return x_3;
}
}
static uint8_t _init_l_R__coprime__Q___nativeDecide__1___closed__2() {
_start:
{
lean_object* x_1; lean_object* x_2; uint8_t x_3; 
x_1 = l_R__coprime__Q___nativeDecide__1___closed__1;
x_2 = lean_unsigned_to_nat(1u);
x_3 = lean_nat_dec_eq(x_1, x_2);
return x_3;
}
}
static uint8_t _init_l_R__coprime__Q___nativeDecide__1() {
_start:
{
uint8_t x_1; 
x_1 = l_R__coprime__Q___nativeDecide__1___closed__2;
return x_1;
}
}
static uint8_t _init_l_Q__odd___nativeDecide__1() {
_start:
{
uint8_t x_1; 
x_1 = 1;
return x_1;
}
}
static lean_object* _init_l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1___closed__1() {
_start:
{
lean_object* x_1; lean_object* x_2; 
x_1 = lean_unsigned_to_nat(8380417u);
x_2 = l_ZMod_instField(x_1, lean_box(0));
return x_2;
}
}
static lean_object* _init_l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1___closed__2() {
_start:
{
lean_object* x_1; lean_object* x_2; 
x_1 = l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1___closed__1;
x_2 = l_Field_toSemifield___rarg(x_1);
return x_2;
}
}
static lean_object* _init_l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1___closed__3() {
_start:
{
lean_object* x_1; lean_object* x_2; 
x_1 = l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1___closed__2;
x_2 = l_Semifield_toDivisionSemiring___rarg(x_1);
return x_2;
}
}
LEAN_EXPORT lean_object* l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1(lean_object* x_1) {
_start:
{
lean_object* x_2; lean_object* x_3; lean_object* x_4; lean_object* x_5; 
x_2 = l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1___closed__3;
x_3 = lean_ctor_get(x_2, 0);
lean_inc(x_3);
x_4 = lean_ctor_get(x_3, 2);
lean_inc(x_4);
lean_dec(x_3);
x_5 = lean_apply_1(x_4, x_1);
return x_5;
}
}
static lean_object* _init_l_R__mod__Q__ne__zero___nativeDecide__1___closed__1() {
_start:
{
lean_object* x_1; lean_object* x_2; 
x_1 = l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1___closed__2;
x_2 = l_Semifield_toCommGroupWithZero___rarg(x_1);
return x_2;
}
}
static uint8_t _init_l_R__mod__Q__ne__zero___nativeDecide__1() {
_start:
{
lean_object* x_1; lean_object* x_2; lean_object* x_3; lean_object* x_4; lean_object* x_5; lean_object* x_6; uint8_t x_7; uint8_t x_8; 
x_1 = lean_cstr_to_nat("4294967296");
x_2 = l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1(x_1);
x_3 = l_R__mod__Q__ne__zero___nativeDecide__1___closed__1;
x_4 = lean_ctor_get(x_3, 0);
lean_inc(x_4);
x_5 = lean_ctor_get(x_4, 1);
lean_inc(x_5);
lean_dec(x_4);
x_6 = lean_unsigned_to_nat(8380417u);
x_7 = l_ZMod_decidableEq(x_6, x_2, x_5);
lean_dec(x_5);
lean_dec(x_2);
x_8 = l_instDecidableNot___rarg(x_7);
return x_8;
}
}
static lean_object* _init_l_two__mod__Q__ne__zero___nativeDecide__1___closed__1() {
_start:
{
lean_object* x_1; lean_object* x_2; 
x_1 = lean_unsigned_to_nat(2u);
x_2 = l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1(x_1);
return x_2;
}
}
static uint8_t _init_l_two__mod__Q__ne__zero___nativeDecide__1___closed__2() {
_start:
{
lean_object* x_1; lean_object* x_2; lean_object* x_3; lean_object* x_4; lean_object* x_5; uint8_t x_6; 
x_1 = l_R__mod__Q__ne__zero___nativeDecide__1___closed__1;
x_2 = lean_ctor_get(x_1, 0);
lean_inc(x_2);
x_3 = lean_ctor_get(x_2, 1);
lean_inc(x_3);
lean_dec(x_2);
x_4 = lean_unsigned_to_nat(8380417u);
x_5 = l_two__mod__Q__ne__zero___nativeDecide__1___closed__1;
x_6 = l_ZMod_decidableEq(x_4, x_5, x_3);
lean_dec(x_3);
return x_6;
}
}
static uint8_t _init_l_two__mod__Q__ne__zero___nativeDecide__1___closed__3() {
_start:
{
uint8_t x_1; uint8_t x_2; 
x_1 = l_two__mod__Q__ne__zero___nativeDecide__1___closed__2;
x_2 = l_instDecidableNot___rarg(x_1);
return x_2;
}
}
static uint8_t _init_l_two__mod__Q__ne__zero___nativeDecide__1() {
_start:
{
uint8_t x_1; 
x_1 = l_two__mod__Q__ne__zero___nativeDecide__1___closed__3;
return x_1;
}
}
static lean_object* _init_l_N__mod__Q__ne__zero___nativeDecide__1___closed__1() {
_start:
{
lean_object* x_1; lean_object* x_2; 
x_1 = lean_unsigned_to_nat(256u);
x_2 = l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1(x_1);
return x_2;
}
}
static uint8_t _init_l_N__mod__Q__ne__zero___nativeDecide__1___closed__2() {
_start:
{
lean_object* x_1; lean_object* x_2; lean_object* x_3; lean_object* x_4; lean_object* x_5; uint8_t x_6; 
x_1 = l_R__mod__Q__ne__zero___nativeDecide__1___closed__1;
x_2 = lean_ctor_get(x_1, 0);
lean_inc(x_2);
x_3 = lean_ctor_get(x_2, 1);
lean_inc(x_3);
lean_dec(x_2);
x_4 = lean_unsigned_to_nat(8380417u);
x_5 = l_N__mod__Q__ne__zero___nativeDecide__1___closed__1;
x_6 = l_ZMod_decidableEq(x_4, x_5, x_3);
lean_dec(x_3);
return x_6;
}
}
static uint8_t _init_l_N__mod__Q__ne__zero___nativeDecide__1___closed__3() {
_start:
{
uint8_t x_1; uint8_t x_2; 
x_1 = l_N__mod__Q__ne__zero___nativeDecide__1___closed__2;
x_2 = l_instDecidableNot___rarg(x_1);
return x_2;
}
}
static uint8_t _init_l_N__mod__Q__ne__zero___nativeDecide__1() {
_start:
{
uint8_t x_1; 
x_1 = l_N__mod__Q__ne__zero___nativeDecide__1___closed__3;
return x_1;
}
}
static lean_object* _init_l__u03b6___closed__1() {
_start:
{
lean_object* x_1; lean_object* x_2; 
x_1 = lean_unsigned_to_nat(1753u);
x_2 = l_Nat_cast___at_fromMontgomery___spec__1(x_1);
return x_2;
}
}
static lean_object* _init_l__u03b6() {
_start:
{
lean_object* x_1; 
x_1 = l__u03b6___closed__1;
return x_1;
}
}
static lean_object* _init_l_zeta__pow__512___nativeDecide__1___closed__1() {
_start:
{
lean_object* x_1; lean_object* x_2; 
x_1 = lean_unsigned_to_nat(1753u);
x_2 = l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1(x_1);
return x_2;
}
}
static lean_object* _init_l_zeta__pow__512___nativeDecide__1___closed__2() {
_start:
{
lean_object* x_1; lean_object* x_2; lean_object* x_3; lean_object* x_4; lean_object* x_5; lean_object* x_6; 
x_1 = l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1___closed__3;
x_2 = lean_ctor_get(x_1, 0);
lean_inc(x_2);
x_3 = lean_ctor_get(x_2, 3);
lean_inc(x_3);
lean_dec(x_2);
x_4 = lean_unsigned_to_nat(512u);
x_5 = l_zeta__pow__512___nativeDecide__1___closed__1;
x_6 = lean_apply_2(x_3, x_4, x_5);
return x_6;
}
}
static uint8_t _init_l_zeta__pow__512___nativeDecide__1___closed__3() {
_start:
{
lean_object* x_1; lean_object* x_2; lean_object* x_3; lean_object* x_4; lean_object* x_5; uint8_t x_6; 
x_1 = l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1___closed__3;
x_2 = lean_ctor_get(x_1, 0);
lean_inc(x_2);
x_3 = lean_ctor_get(x_2, 1);
lean_inc(x_3);
lean_dec(x_2);
x_4 = lean_unsigned_to_nat(8380417u);
x_5 = l_zeta__pow__512___nativeDecide__1___closed__2;
x_6 = l_ZMod_decidableEq(x_4, x_5, x_3);
lean_dec(x_3);
return x_6;
}
}
static uint8_t _init_l_zeta__pow__512___nativeDecide__1() {
_start:
{
uint8_t x_1; 
x_1 = l_zeta__pow__512___nativeDecide__1___closed__3;
return x_1;
}
}
static lean_object* _init_l_butterfly___closed__1() {
_start:
{
lean_object* x_1; lean_object* x_2; 
x_1 = l_fromMontgomery___closed__2;
x_2 = l_NonUnitalNonAssocCommRing_toNonUnitalNonAssocCommSemiring___rarg(x_1);
return x_2;
}
}
static lean_object* _init_l_butterfly___closed__2() {
_start:
{
lean_object* x_1; lean_object* x_2; 
x_1 = l_butterfly___closed__1;
x_2 = l_NonUnitalNonAssocSemiring_toDistrib___rarg(x_1);
return x_2;
}
}
LEAN_EXPORT lean_object* l_butterfly(lean_object* x_1, lean_object* x_2, lean_object* x_3) {
_start:
{
lean_object* x_4; lean_object* x_5; lean_object* x_6; lean_object* x_7; lean_object* x_8; lean_object* x_9; lean_object* x_10; lean_object* x_11; lean_object* x_12; lean_object* x_13; lean_object* x_14; 
x_4 = l_butterfly___closed__2;
x_5 = lean_ctor_get(x_4, 1);
lean_inc(x_5);
x_6 = l_fromMontgomery___closed__2;
x_7 = lean_ctor_get(x_6, 1);
lean_inc(x_7);
x_8 = lean_apply_2(x_7, x_3, x_2);
lean_inc(x_8);
lean_inc(x_1);
x_9 = lean_apply_2(x_5, x_1, x_8);
x_10 = l_Int_cast___at_toMontgomery___spec__1___closed__2;
x_11 = lean_ctor_get(x_10, 0);
lean_inc(x_11);
x_12 = lean_ctor_get(x_11, 2);
lean_inc(x_12);
lean_dec(x_11);
x_13 = lean_apply_2(x_12, x_1, x_8);
x_14 = lean_alloc_ctor(0, 2, 0);
lean_ctor_set(x_14, 0, x_9);
lean_ctor_set(x_14, 1, x_13);
return x_14;
}
}
static lean_object* _init_l_reduce32___closed__1() {
_start:
{
lean_object* x_1; lean_object* x_2; 
x_1 = lean_unsigned_to_nat(2u);
x_2 = lean_nat_to_int(x_1);
return x_2;
}
}
static lean_object* _init_l_reduce32___closed__2() {
_start:
{
lean_object* x_1; lean_object* x_2; lean_object* x_3; 
x_1 = l_reduce32___closed__1;
x_2 = lean_unsigned_to_nat(22u);
x_3 = l_Int_pow(x_1, x_2);
return x_3;
}
}
static lean_object* _init_l_reduce32___closed__3() {
_start:
{
lean_object* x_1; lean_object* x_2; lean_object* x_3; 
x_1 = l_reduce32___closed__1;
x_2 = lean_unsigned_to_nat(23u);
x_3 = l_Int_pow(x_1, x_2);
return x_3;
}
}
static lean_object* _init_l_reduce32___closed__4() {
_start:
{
lean_object* x_1; lean_object* x_2; 
x_1 = l_Q;
x_2 = lean_nat_to_int(x_1);
return x_2;
}
}
LEAN_EXPORT lean_object* l_reduce32(lean_object* x_1) {
_start:
{
lean_object* x_2; lean_object* x_3; lean_object* x_4; lean_object* x_5; lean_object* x_6; lean_object* x_7; lean_object* x_8; 
x_2 = l_reduce32___closed__2;
x_3 = lean_int_add(x_1, x_2);
x_4 = l_reduce32___closed__3;
x_5 = lean_int_ediv(x_3, x_4);
lean_dec(x_3);
x_6 = l_reduce32___closed__4;
x_7 = lean_int_mul(x_5, x_6);
lean_dec(x_5);
x_8 = lean_int_sub(x_1, x_7);
lean_dec(x_7);
return x_8;
}
}
LEAN_EXPORT lean_object* l_reduce32___boxed(lean_object* x_1) {
_start:
{
lean_object* x_2; 
x_2 = l_reduce32(x_1);
lean_dec(x_1);
return x_2;
}
}
static lean_object* _init_l_caddq___closed__1() {
_start:
{
lean_object* x_1; lean_object* x_2; 
x_1 = lean_unsigned_to_nat(0u);
x_2 = lean_nat_to_int(x_1);
return x_2;
}
}
LEAN_EXPORT lean_object* l_caddq(lean_object* x_1) {
_start:
{
lean_object* x_2; uint8_t x_3; 
x_2 = l_caddq___closed__1;
x_3 = lean_int_dec_lt(x_1, x_2);
if (x_3 == 0)
{
lean_inc(x_1);
return x_1;
}
else
{
lean_object* x_4; lean_object* x_5; 
x_4 = l_reduce32___closed__4;
x_5 = lean_int_add(x_1, x_4);
return x_5;
}
}
}
LEAN_EXPORT lean_object* l_caddq___boxed(lean_object* x_1) {
_start:
{
lean_object* x_2; 
x_2 = l_caddq(x_1);
lean_dec(x_1);
return x_2;
}
}
static lean_object* _init_l_Q__half___closed__1() {
_start:
{
lean_object* x_1; lean_object* x_2; lean_object* x_3; 
x_1 = l_reduce32___closed__4;
x_2 = l_reduce32___closed__1;
x_3 = lean_int_ediv(x_1, x_2);
return x_3;
}
}
static lean_object* _init_l_Q__half() {
_start:
{
lean_object* x_1; 
x_1 = l_Q__half___closed__1;
return x_1;
}
}
LEAN_EXPORT lean_object* l_bitReverse8(lean_object* x_1) {
_start:
{
lean_object* x_2; lean_object* x_3; lean_object* x_4; lean_object* x_5; lean_object* x_6; lean_object* x_7; lean_object* x_8; lean_object* x_9; lean_object* x_10; lean_object* x_11; lean_object* x_12; lean_object* x_13; lean_object* x_14; lean_object* x_15; lean_object* x_16; lean_object* x_17; lean_object* x_18; lean_object* x_19; lean_object* x_20; lean_object* x_21; lean_object* x_22; lean_object* x_23; lean_object* x_24; lean_object* x_25; lean_object* x_26; lean_object* x_27; lean_object* x_28; lean_object* x_29; lean_object* x_30; lean_object* x_31; lean_object* x_32; lean_object* x_33; lean_object* x_34; lean_object* x_35; lean_object* x_36; lean_object* x_37; lean_object* x_38; lean_object* x_39; lean_object* x_40; lean_object* x_41; lean_object* x_42; 
x_2 = lean_unsigned_to_nat(0u);
x_3 = lean_nat_shiftr(x_1, x_2);
x_4 = lean_unsigned_to_nat(1u);
x_5 = lean_nat_land(x_3, x_4);
lean_dec(x_3);
x_6 = lean_nat_shiftr(x_1, x_4);
x_7 = lean_nat_land(x_6, x_4);
lean_dec(x_6);
x_8 = lean_unsigned_to_nat(2u);
x_9 = lean_nat_shiftr(x_1, x_8);
x_10 = lean_nat_land(x_9, x_4);
lean_dec(x_9);
x_11 = lean_unsigned_to_nat(3u);
x_12 = lean_nat_shiftr(x_1, x_11);
x_13 = lean_nat_land(x_12, x_4);
lean_dec(x_12);
x_14 = lean_unsigned_to_nat(4u);
x_15 = lean_nat_shiftr(x_1, x_14);
x_16 = lean_nat_land(x_15, x_4);
lean_dec(x_15);
x_17 = lean_unsigned_to_nat(5u);
x_18 = lean_nat_shiftr(x_1, x_17);
x_19 = lean_nat_land(x_18, x_4);
lean_dec(x_18);
x_20 = lean_unsigned_to_nat(6u);
x_21 = lean_nat_shiftr(x_1, x_20);
x_22 = lean_nat_land(x_21, x_4);
lean_dec(x_21);
x_23 = lean_unsigned_to_nat(7u);
x_24 = lean_nat_shiftr(x_1, x_23);
x_25 = lean_nat_land(x_24, x_4);
lean_dec(x_24);
x_26 = lean_nat_shiftl(x_5, x_23);
lean_dec(x_5);
x_27 = lean_nat_shiftl(x_7, x_20);
lean_dec(x_7);
x_28 = lean_nat_lor(x_26, x_27);
lean_dec(x_27);
lean_dec(x_26);
x_29 = lean_nat_shiftl(x_10, x_17);
lean_dec(x_10);
x_30 = lean_nat_lor(x_28, x_29);
lean_dec(x_29);
lean_dec(x_28);
x_31 = lean_nat_shiftl(x_13, x_14);
lean_dec(x_13);
x_32 = lean_nat_lor(x_30, x_31);
lean_dec(x_31);
lean_dec(x_30);
x_33 = lean_nat_shiftl(x_16, x_11);
lean_dec(x_16);
x_34 = lean_nat_lor(x_32, x_33);
lean_dec(x_33);
lean_dec(x_32);
x_35 = lean_nat_shiftl(x_19, x_8);
lean_dec(x_19);
x_36 = lean_nat_lor(x_34, x_35);
lean_dec(x_35);
lean_dec(x_34);
x_37 = lean_nat_shiftl(x_22, x_4);
lean_dec(x_22);
x_38 = lean_nat_lor(x_36, x_37);
lean_dec(x_37);
lean_dec(x_36);
x_39 = lean_nat_shiftl(x_25, x_2);
lean_dec(x_25);
x_40 = lean_nat_lor(x_38, x_39);
lean_dec(x_39);
lean_dec(x_38);
x_41 = lean_unsigned_to_nat(256u);
x_42 = lean_nat_mod(x_40, x_41);
lean_dec(x_40);
return x_42;
}
}
LEAN_EXPORT lean_object* l_bitReverse8___boxed(lean_object* x_1) {
_start:
{
lean_object* x_2; 
x_2 = l_bitReverse8(x_1);
lean_dec(x_1);
return x_2;
}
}
static lean_object* _init_l_mont__value___nativeDecide__1___closed__1() {
_start:
{
lean_object* x_1; lean_object* x_2; 
x_1 = lean_cstr_to_nat("4294967296");
x_2 = l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1(x_1);
return x_2;
}
}
static lean_object* _init_l_mont__value___nativeDecide__1___closed__2() {
_start:
{
lean_object* x_1; lean_object* x_2; lean_object* x_3; 
x_1 = lean_unsigned_to_nat(8380417u);
x_2 = l_mont__value___nativeDecide__1___closed__1;
x_3 = l_ZMod_val(x_1, x_2);
return x_3;
}
}
static uint8_t _init_l_mont__value___nativeDecide__1___closed__3() {
_start:
{
lean_object* x_1; lean_object* x_2; uint8_t x_3; 
x_1 = l_mont__value___nativeDecide__1___closed__2;
x_2 = lean_unsigned_to_nat(4193792u);
x_3 = lean_nat_dec_eq(x_1, x_2);
return x_3;
}
}
static uint8_t _init_l_mont__value___nativeDecide__1() {
_start:
{
uint8_t x_1; 
x_1 = l_mont__value___nativeDecide__1___closed__3;
return x_1;
}
}
lean_object* initialize_Init(uint8_t builtin, lean_object*);
lean_object* initialize_Mathlib_Data_Int_ModEq(uint8_t builtin, lean_object*);
lean_object* initialize_Mathlib_Data_ZMod_Basic(uint8_t builtin, lean_object*);
lean_object* initialize_Mathlib_Algebra_Field_Basic(uint8_t builtin, lean_object*);
lean_object* initialize_Mathlib_Data_Nat_Prime_Basic(uint8_t builtin, lean_object*);
lean_object* initialize_Mathlib_Tactic(uint8_t builtin, lean_object*);
static bool _G_initialized = false;
LEAN_EXPORT lean_object* initialize_NTT(uint8_t builtin, lean_object* w) {
lean_object * res;
if (_G_initialized) return lean_io_result_mk_ok(lean_box(0));
_G_initialized = true;
res = initialize_Init(builtin, lean_io_mk_world());
if (lean_io_result_is_error(res)) return res;
lean_dec_ref(res);
res = initialize_Mathlib_Data_Int_ModEq(builtin, lean_io_mk_world());
if (lean_io_result_is_error(res)) return res;
lean_dec_ref(res);
res = initialize_Mathlib_Data_ZMod_Basic(builtin, lean_io_mk_world());
if (lean_io_result_is_error(res)) return res;
lean_dec_ref(res);
res = initialize_Mathlib_Algebra_Field_Basic(builtin, lean_io_mk_world());
if (lean_io_result_is_error(res)) return res;
lean_dec_ref(res);
res = initialize_Mathlib_Data_Nat_Prime_Basic(builtin, lean_io_mk_world());
if (lean_io_result_is_error(res)) return res;
lean_dec_ref(res);
res = initialize_Mathlib_Tactic(builtin, lean_io_mk_world());
if (lean_io_result_is_error(res)) return res;
lean_dec_ref(res);
l_Q = _init_l_Q();
lean_mark_persistent(l_Q);
l_Q__prime___nativeDecide__1___closed__1 = _init_l_Q__prime___nativeDecide__1___closed__1();
l_Q__prime___nativeDecide__1 = _init_l_Q__prime___nativeDecide__1();
l_N = _init_l_N();
lean_mark_persistent(l_N);
l_R = _init_l_R();
lean_mark_persistent(l_R);
l_Int_cast___at_toMontgomery___spec__1___closed__1 = _init_l_Int_cast___at_toMontgomery___spec__1___closed__1();
lean_mark_persistent(l_Int_cast___at_toMontgomery___spec__1___closed__1);
l_Int_cast___at_toMontgomery___spec__1___closed__2 = _init_l_Int_cast___at_toMontgomery___spec__1___closed__2();
lean_mark_persistent(l_Int_cast___at_toMontgomery___spec__1___closed__2);
l_toMontgomery___closed__1 = _init_l_toMontgomery___closed__1();
lean_mark_persistent(l_toMontgomery___closed__1);
l_Nat_cast___at_fromMontgomery___spec__1___closed__1 = _init_l_Nat_cast___at_fromMontgomery___spec__1___closed__1();
lean_mark_persistent(l_Nat_cast___at_fromMontgomery___spec__1___closed__1);
l_Nat_cast___at_fromMontgomery___spec__1___closed__2 = _init_l_Nat_cast___at_fromMontgomery___spec__1___closed__2();
lean_mark_persistent(l_Nat_cast___at_fromMontgomery___spec__1___closed__2);
l_fromMontgomery___closed__1 = _init_l_fromMontgomery___closed__1();
lean_mark_persistent(l_fromMontgomery___closed__1);
l_fromMontgomery___closed__2 = _init_l_fromMontgomery___closed__2();
lean_mark_persistent(l_fromMontgomery___closed__2);
l_R__coprime__Q___nativeDecide__1___closed__1 = _init_l_R__coprime__Q___nativeDecide__1___closed__1();
lean_mark_persistent(l_R__coprime__Q___nativeDecide__1___closed__1);
l_R__coprime__Q___nativeDecide__1___closed__2 = _init_l_R__coprime__Q___nativeDecide__1___closed__2();
l_R__coprime__Q___nativeDecide__1 = _init_l_R__coprime__Q___nativeDecide__1();
l_Q__odd___nativeDecide__1 = _init_l_Q__odd___nativeDecide__1();
l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1___closed__1 = _init_l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1___closed__1();
lean_mark_persistent(l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1___closed__1);
l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1___closed__2 = _init_l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1___closed__2();
lean_mark_persistent(l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1___closed__2);
l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1___closed__3 = _init_l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1___closed__3();
lean_mark_persistent(l_Nat_cast___at_R__mod__Q__ne__zero___nativeDecide__1___spec__1___closed__3);
l_R__mod__Q__ne__zero___nativeDecide__1___closed__1 = _init_l_R__mod__Q__ne__zero___nativeDecide__1___closed__1();
lean_mark_persistent(l_R__mod__Q__ne__zero___nativeDecide__1___closed__1);
l_R__mod__Q__ne__zero___nativeDecide__1 = _init_l_R__mod__Q__ne__zero___nativeDecide__1();
l_two__mod__Q__ne__zero___nativeDecide__1___closed__1 = _init_l_two__mod__Q__ne__zero___nativeDecide__1___closed__1();
lean_mark_persistent(l_two__mod__Q__ne__zero___nativeDecide__1___closed__1);
l_two__mod__Q__ne__zero___nativeDecide__1___closed__2 = _init_l_two__mod__Q__ne__zero___nativeDecide__1___closed__2();
l_two__mod__Q__ne__zero___nativeDecide__1___closed__3 = _init_l_two__mod__Q__ne__zero___nativeDecide__1___closed__3();
l_two__mod__Q__ne__zero___nativeDecide__1 = _init_l_two__mod__Q__ne__zero___nativeDecide__1();
l_N__mod__Q__ne__zero___nativeDecide__1___closed__1 = _init_l_N__mod__Q__ne__zero___nativeDecide__1___closed__1();
lean_mark_persistent(l_N__mod__Q__ne__zero___nativeDecide__1___closed__1);
l_N__mod__Q__ne__zero___nativeDecide__1___closed__2 = _init_l_N__mod__Q__ne__zero___nativeDecide__1___closed__2();
l_N__mod__Q__ne__zero___nativeDecide__1___closed__3 = _init_l_N__mod__Q__ne__zero___nativeDecide__1___closed__3();
l_N__mod__Q__ne__zero___nativeDecide__1 = _init_l_N__mod__Q__ne__zero___nativeDecide__1();
l__u03b6___closed__1 = _init_l__u03b6___closed__1();
lean_mark_persistent(l__u03b6___closed__1);
l__u03b6 = _init_l__u03b6();
lean_mark_persistent(l__u03b6);
l_zeta__pow__512___nativeDecide__1___closed__1 = _init_l_zeta__pow__512___nativeDecide__1___closed__1();
lean_mark_persistent(l_zeta__pow__512___nativeDecide__1___closed__1);
l_zeta__pow__512___nativeDecide__1___closed__2 = _init_l_zeta__pow__512___nativeDecide__1___closed__2();
lean_mark_persistent(l_zeta__pow__512___nativeDecide__1___closed__2);
l_zeta__pow__512___nativeDecide__1___closed__3 = _init_l_zeta__pow__512___nativeDecide__1___closed__3();
l_zeta__pow__512___nativeDecide__1 = _init_l_zeta__pow__512___nativeDecide__1();
l_butterfly___closed__1 = _init_l_butterfly___closed__1();
lean_mark_persistent(l_butterfly___closed__1);
l_butterfly___closed__2 = _init_l_butterfly___closed__2();
lean_mark_persistent(l_butterfly___closed__2);
l_reduce32___closed__1 = _init_l_reduce32___closed__1();
lean_mark_persistent(l_reduce32___closed__1);
l_reduce32___closed__2 = _init_l_reduce32___closed__2();
lean_mark_persistent(l_reduce32___closed__2);
l_reduce32___closed__3 = _init_l_reduce32___closed__3();
lean_mark_persistent(l_reduce32___closed__3);
l_reduce32___closed__4 = _init_l_reduce32___closed__4();
lean_mark_persistent(l_reduce32___closed__4);
l_caddq___closed__1 = _init_l_caddq___closed__1();
lean_mark_persistent(l_caddq___closed__1);
l_Q__half___closed__1 = _init_l_Q__half___closed__1();
lean_mark_persistent(l_Q__half___closed__1);
l_Q__half = _init_l_Q__half();
lean_mark_persistent(l_Q__half);
l_mont__value___nativeDecide__1___closed__1 = _init_l_mont__value___nativeDecide__1___closed__1();
lean_mark_persistent(l_mont__value___nativeDecide__1___closed__1);
l_mont__value___nativeDecide__1___closed__2 = _init_l_mont__value___nativeDecide__1___closed__2();
lean_mark_persistent(l_mont__value___nativeDecide__1___closed__2);
l_mont__value___nativeDecide__1___closed__3 = _init_l_mont__value___nativeDecide__1___closed__3();
l_mont__value___nativeDecide__1 = _init_l_mont__value___nativeDecide__1();
return lean_io_result_mk_ok(lean_box(0));
}
#ifdef __cplusplus
}
#endif
