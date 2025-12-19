#!/usr/bin/env python3
"""
Fast nonce bumping script using concurrent requests
"""
import subprocess
import concurrent.futures
import time
import sys

PRIVATE_KEY = "0x55491e7a85bd07188b36c45696fa189bc1e36cc651bdf41e82a3656b77648114"
RPC_URL = "https://ethereum-rpc.publicnode.com"
FROM_ADDRESS = "0xe69BB031877Cdf6c001BdAEDC0A615B40484CDC3"
TARGET_NONCE = 469

def get_nonce():
    for attempt in range(3):
        result = subprocess.run(
            ["cast", "nonce", FROM_ADDRESS, "--rpc-url", RPC_URL],
            capture_output=True, text=True
        )
        if result.stdout.strip():
            return int(result.stdout.strip())
        time.sleep(1)
    raise Exception("Failed to get nonce after 3 attempts")

def send_tx(nonce):
    """Send a single transaction with specific nonce"""
    result = subprocess.run(
        ["cast", "send", FROM_ADDRESS,
         "--value", "0",
         "--private-key", PRIVATE_KEY,
         "--rpc-url", RPC_URL,
         "--gas-limit", "21000",
         "--nonce", str(nonce)],
        capture_output=True, text=True
    )
    return nonce, result.returncode == 0

def main():
    current_nonce = get_nonce()
    print(f"Current nonce: {current_nonce}")
    print(f"Target nonce: {TARGET_NONCE}")

    needed = TARGET_NONCE - current_nonce
    if needed <= 0:
        print("Already at or past target nonce!")
        return

    print(f"Need to send {needed} transactions")
    print("Starting...")

    # Send in batches of 10 concurrent transactions
    BATCH_SIZE = 10
    start_time = time.time()

    actual_nonce = current_nonce
    while actual_nonce < TARGET_NONCE:
        batch_start = actual_nonce
        batch_end = min(batch_start + BATCH_SIZE, TARGET_NONCE)
        batch_nonces = list(range(batch_start, batch_end))

        print(f"Sending batch: nonce {batch_start} to {batch_end-1}...")

        with concurrent.futures.ThreadPoolExecutor(max_workers=BATCH_SIZE) as executor:
            futures = {executor.submit(send_tx, n): n for n in batch_nonces}
            results = []
            for future in concurrent.futures.as_completed(futures):
                nonce, success = future.result()
                results.append((nonce, success))
                if success:
                    print(f"    ✓ nonce {nonce}")

        success_count = sum(1 for _, s in results if s)
        print(f"  Completed: {success_count}/{len(batch_nonces)} succeeded")

        # Delay between batches to avoid rate limiting
        time.sleep(2)

        # Check actual nonce and use it for next batch
        try:
            actual_nonce = get_nonce()
            print(f"  Current nonce: {actual_nonce}")
            progress = ((actual_nonce - 34) / (TARGET_NONCE - 34)) * 100
            print(f"  Progress: {progress:.1f}%")
        except:
            print("  (could not check nonce)")
            actual_nonce = batch_end  # Move forward anyway

    elapsed = time.time() - start_time
    final_nonce = get_nonce()
    print(f"\n=== DONE ===")
    print(f"Final nonce: {final_nonce}")
    print(f"Time elapsed: {elapsed:.1f} seconds")

    if final_nonce >= TARGET_NONCE:
        print("SUCCESS! Ready to deploy contract.")
    else:
        print(f"WARNING: Still {TARGET_NONCE - final_nonce} transactions short")

if __name__ == "__main__":
    main()
