// Generate N independent ML-DSA-65 KAT triples (pk, msg, sig) and write them
// to a binary file. Each triple uses a *fresh* keypair so cycle counts inside
// SP1 are not biased by any cache reuse across iterations.
//
// On-disk framing (little-endian):
//   u32 N
//   N * { u32 pk_len, pk_bytes, u32 msg_len, msg_bytes, u32 sig_len, sig_bytes }
//
// This format is also what the SP1 host script uses when writing to the
// program's stdin (one `u32 N` via bincode, then 3*N raw byte vectors via
// `write_vec`). Keeping the framing trivial makes both producer and consumer
// independent of any serialization crate.

use std::fs::File;
use std::io::{BufWriter, Write};
use std::path::PathBuf;

use clap::Parser;
use fips204::ml_dsa_65;
use fips204::traits::{SerDes, Signer, Verifier};

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Number of independent KAT triples to emit.
    #[arg(long, default_value_t = 128)]
    n: u32,

    /// Output path for the binary KAT bundle.
    #[arg(long)]
    out: PathBuf,

    /// Optional message length (bytes) used for every signature. Default 32.
    #[arg(long, default_value_t = 32)]
    msg_len: usize,
}

fn write_u32<W: Write>(w: &mut W, v: u32) -> std::io::Result<()> {
    w.write_all(&v.to_le_bytes())
}

fn main() {
    let args = Args::parse();
    let mut rng = rand_core::OsRng;

    let f = File::create(&args.out).expect("create output file");
    let mut w = BufWriter::new(f);

    write_u32(&mut w, args.n).expect("write N");

    let ctx: &[u8] = b"";
    for i in 0..args.n {
        let (pk, sk) = ml_dsa_65::try_keygen_with_rng(&mut rng).expect("keygen failed");

        // Distinct message per triple so the verify path is genuinely fresh.
        let mut msg = vec![0u8; args.msg_len];
        // Embed index so messages are guaranteed distinct even if RNG repeats.
        msg[..4].copy_from_slice(&i.to_le_bytes());
        // Fill the remainder with random bytes.
        if args.msg_len > 4 {
            use rand_core::RngCore;
            rng.fill_bytes(&mut msg[4..]);
        }

        let sig = sk
            .try_sign_with_rng(&mut rng, &msg, ctx)
            .expect("sign failed");

        let pk_bytes = pk.into_bytes();

        // Sanity verify before writing, so a corrupted batch fails loud here.
        let pk2 = ml_dsa_65::PublicKey::try_from_bytes(pk_bytes).expect("pk roundtrip");
        let ok = pk2.verify(&msg, &sig, ctx);
        assert!(ok, "host-side verify failed for triple {}", i);

        write_u32(&mut w, pk_bytes.len() as u32).expect("write pk_len");
        w.write_all(&pk_bytes).expect("write pk");
        write_u32(&mut w, msg.len() as u32).expect("write msg_len");
        w.write_all(&msg).expect("write msg");
        write_u32(&mut w, sig.len() as u32).expect("write sig_len");
        w.write_all(&sig).expect("write sig");

        if (i + 1) % 16 == 0 || i + 1 == args.n {
            eprintln!("generated {}/{}", i + 1, args.n);
        }
    }

    w.flush().expect("flush");
    eprintln!("wrote KAT bundle: {}", args.out.display());
}
