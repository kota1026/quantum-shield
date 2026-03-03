#!/usr/bin/env bash
set -euo pipefail

# Quantum Shield WASM SDK - Build & Publish Script
#
# Prerequisites:
#   1. wasm-pack installed: curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
#   2. npm login completed: npm login
#   3. Rust + wasm32-unknown-unknown target: rustup target add wasm32-unknown-unknown
#
# Usage:
#   ./scripts/publish.sh          # Dry-run (no actual publish)
#   ./scripts/publish.sh --publish # Actual npm publish

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SDK_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PKG_DIR="$SDK_DIR/pkg"

echo "=== Quantum Shield WASM SDK Build & Publish ==="
echo "SDK Dir: $SDK_DIR"
echo ""

# Step 1: Run native tests
echo "[1/6] Running native tests..."
cd "$SDK_DIR"
cargo test --quiet
echo "  Native tests passed."

# Step 2: Build WASM (--target web for ESM)
echo "[2/6] Building WASM (release, --target web)..."
wasm-pack build --target web --release --out-dir pkg
echo "  Build complete."

# Step 3: Restore package.json (wasm-pack overwrites it)
echo "[3/6] Restoring package.json metadata..."
cd "$PKG_DIR"

# wasm-pack generates a minimal package.json; we need to restore our enhanced version
node -e "
const pkg = require('./package.json');
const enhanced = {
  ...pkg,
  description: 'Post-quantum cryptographic signatures (NIST FIPS 204 ML-DSA-65) compiled to WebAssembly',
  repository: {
    type: 'git',
    url: 'https://github.com/kota1026/quantum-shield',
    directory: 'src/frontend/sdk/wasm'
  },
  homepage: 'https://github.com/kota1026/quantum-shield/tree/main/src/frontend/sdk/wasm#readme',
  bugs: { url: 'https://github.com/kota1026/quantum-shield/issues' },
  publishConfig: { access: 'public' },
  exports: {
    '.': {
      types: './quantum_shield_wasm.d.ts',
      import: './quantum_shield_wasm.js'
    }
  },
  engines: { node: '>=18.0.0' },
  keywords: [
    'quantum', 'post-quantum', 'cryptography', 'dilithium',
    'ml-dsa-65', 'fips-204', 'nist', 'wasm', 'webassembly',
    'digital-signature', 'lattice-based'
  ]
};
// Ensure .wasm.d.ts is in files list
if (enhanced.files && !enhanced.files.includes('quantum_shield_wasm_bg.wasm.d.ts')) {
  enhanced.files.push('quantum_shield_wasm_bg.wasm.d.ts');
}
if (enhanced.files && !enhanced.files.includes('README.md')) {
  enhanced.files.push('README.md');
}
require('fs').writeFileSync('./package.json', JSON.stringify(enhanced, null, 2) + '\n');
"
echo "  package.json enhanced."

# Step 4: Copy README
echo "[4/6] Copying README..."
cp "$SDK_DIR/README.md" "$PKG_DIR/README.md"
echo "  README copied."

# Step 5: Verify package contents
echo "[5/6] Verifying package..."
echo "  Files in pkg/:"
ls -lh "$PKG_DIR"/*.wasm "$PKG_DIR"/*.js "$PKG_DIR"/*.d.ts "$PKG_DIR"/package.json "$PKG_DIR"/README.md 2>/dev/null || true

WASM_SIZE=$(stat -f%z "$PKG_DIR/quantum_shield_wasm_bg.wasm" 2>/dev/null || stat -c%s "$PKG_DIR/quantum_shield_wasm_bg.wasm" 2>/dev/null || echo "unknown")
echo "  WASM binary size: ${WASM_SIZE} bytes"

echo ""
echo "  npm pack --dry-run:"
cd "$PKG_DIR"
npm pack --dry-run 2>&1 | head -30
echo ""

# Step 6: Publish
if [ "${1:-}" = "--publish" ]; then
  echo "[6/6] Publishing to npm..."
  cd "$PKG_DIR"
  npm publish --access public
  echo ""
  echo "Published quantum-shield-wasm@$(node -p "require('./package.json').version") to npm."
else
  echo "[6/6] Dry-run complete. To publish:"
  echo "  ./scripts/publish.sh --publish"
  echo ""
  echo "  Or manually:"
  echo "  cd $PKG_DIR && npm publish --access public"
fi

echo ""
echo "=== Done ==="
