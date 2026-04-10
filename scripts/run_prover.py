#!/usr/bin/env python3
"""
Quantum Shield - Simple AI Prover Stand-in.

Polls the signing queue for a given prover_id, generates a fake but
non-empty SPHINCS+-shaped signature for each item, and submits it via
POST /v1/prover/{id}/sign. The dev-mode backend stores it in
unlock_prover_signatures, and once 2 sigs reach an unlock the backend
auto-triggers the L1 requestUnlock flow (or auto_claim picks it up).

Usage:
    python3 run_prover.py <api_url> <prover_id> [--once]

Example:
    python3 run_prover.py http://localhost:8080 0x0000000000000000000000000000000000000001
"""
import sys
import time
import json
import hashlib
import urllib.request
import urllib.error


def sphincs_fake_signature(message_hex: str) -> str:
    """Generate a non-empty 7856-byte hex blob deterministic in `message_hex`.

    The simplified L1 verifier only requires SHA3_256(pubkey || msg || sig) != 0,
    which is true for any non-empty signature. Backend in dev mode does not
    cryptographically validate the signature contents either.
    """
    base = hashlib.sha3_256(message_hex.encode()).hexdigest()
    # 7856 bytes = 15712 hex chars
    return "0x" + (base * (15712 // len(base) + 1))[:15712]


def http_get(url: str) -> dict:
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def http_post_json(url: str, body: dict) -> dict:
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {"_error": f"HTTP {e.code}: {e.read().decode()[:300]}"}


def process_queue(api_url: str, prover_id: str) -> int:
    queue_url = f"{api_url}/v1/prover/{prover_id}/queue"
    sign_url = f"{api_url}/v1/prover/{prover_id}/sign"

    queue = http_get(queue_url)
    items = queue.get("items", [])
    print(f"[{prover_id[-6:]}] Queue: {len(items)} pending items")

    signed = 0
    for item in items:
        queue_id = item["queue_id"]
        lock_id = item["lock_id"]
        sr1 = item.get("sr_1", "")
        amount = item.get("amount", "0")

        # Compute message: SHA3_256(lockId || sr1) - matches L1 contract
        try:
            lock_bytes = bytes.fromhex(lock_id.removeprefix("0x"))
            sr1_bytes = bytes.fromhex(sr1.removeprefix("0x"))
            if len(lock_bytes) != 32 or len(sr1_bytes) != 32:
                print(f"  SKIP {queue_id[:18]}: invalid lockId/sr1 length")
                continue
            msg = "0x" + hashlib.sha3_256(lock_bytes + sr1_bytes).hexdigest()
        except ValueError as e:
            print(f"  SKIP {queue_id[:18]}: hex decode error {e}")
            continue

        sig = sphincs_fake_signature(msg)
        attestation = f"HSM_ATT_{int(time.time()*1000)}_{queue_id[:16]}"

        body = {
            "queue_id": queue_id,
            "sphincs_signature": sig,
            "hsm_attestation": attestation,
        }
        result = http_post_json(sign_url, body)

        if "_error" in result:
            print(f"  FAIL {queue_id[:18]} (lock={lock_id[:18]}): {result['_error']}")
            continue

        total = result.get("total_signatures", "?")
        required = result.get("required_signatures", "?")
        tx_hash = result.get("tx_hash") or "(pending)"
        print(
            f"  OK   {queue_id[:18]} (lock={lock_id[:18]}, "
            f"amt={int(amount)/1e18:.4f}ETH) → sigs={total}/{required} tx={tx_hash}"
        )
        signed += 1

    return signed


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 1

    api_url = sys.argv[1].rstrip("/")
    prover_id = sys.argv[2]
    once = "--once" in sys.argv

    print(f"=== Simple Prover ===")
    print(f"API:    {api_url}")
    print(f"Prover: {prover_id}")
    print(f"Mode:   {'one-shot' if once else 'continuous (60s poll)'}")
    print()

    while True:
        try:
            n = process_queue(api_url, prover_id)
            print(f"  signed {n} items this cycle")
        except Exception as e:
            print(f"  ERROR: {e}")

        if once:
            break
        time.sleep(60)

    return 0


if __name__ == "__main__":
    sys.exit(main())
