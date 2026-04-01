/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export const get_algorithm_info: () => [number, number, number];
export const get_public_key_hash: (a: number, b: number) => [number, number, number, number];
export const init: () => void;
export const keygen: () => [number, number, number];
export const sha3_256: (a: number, b: number) => [number, number, number, number];
export const sign: (a: number, b: number, c: number, d: number) => [number, number, number, number];
export const verify: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
export const __wbindgen_malloc: (a: number, b: number) => number;
export const __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
export const __wbindgen_exn_store: (a: number) => void;
export const __externref_table_alloc: () => number;
export const __wbindgen_externrefs: WebAssembly.Table;
export const __wbindgen_free: (a: number, b: number, c: number) => void;
export const __externref_table_dealloc: (a: number) => void;
export const __wbindgen_start: () => void;
