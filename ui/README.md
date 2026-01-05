# Quantum Shield UI

Monorepo for Quantum Shield frontend applications.

## Structure

```
ui/
├── apps/
│   ├── consumer/       # Consumer App (End User)
│   ├── token-hub/      # Token Hub (QS/veQS)
│   ├── governance/     # Governance (Voting)
│   ├── prover/         # Prover Portal
│   ├── observer/       # Observer/Challenger
│   ├── explorer/       # Public Explorer
│   ├── enterprise/     # Enterprise Admin
│   └── admin/          # QS Admin (Foundation)
├── packages/
│   ├── ui/             # Shared UI components
│   ├── crypto/         # Dilithium WASM
│   ├── web3/           # wagmi/viem wrapper
│   ├── api-client/     # API client
│   └── config/         # Shared config
└── tooling/
    ├── eslint-config/  # ESLint config
    ├── typescript-config/ # TypeScript config
    └── tailwind-config/ # Tailwind config
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Development
pnpm dev

# Build
pnpm build

# Lint
pnpm lint

# Test
pnpm test
```

## Tech Stack

- **Monorepo**: Turborepo
- **Package Manager**: pnpm
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS v3.4
- **UI Library**: shadcn/ui
- **State**: TanStack Query + Zustand
- **Web3**: wagmi v2 + viem
- **Auth**: SIWE + NextAuth.js
- **Crypto**: @quantum-shield/sdk (Dilithium WASM)
- **Testing**: Vitest + Testing Library
