# Quantum Shield Beta Launch Guide

## Overview

This guide covers deploying Quantum Shield as a public Beta service.

---

## Step 1: Rotate Leaked Secrets (MUST DO FIRST)

The following keys have been in git history and must be rotated before making the repo public:

### 1a. Anthropic API Key
1. Go to https://console.anthropic.com/settings/keys
2. Revoke the key starting with `sk-ant-api03-GhmMuoXQ...`
3. Generate a new key
4. Update your local `.env` with the new key

### 1b. Infura Project ID
1. Go to https://app.infura.io/dashboard
2. Rotate or delete the project with ID `REDACTED_INFURA_PROJECT_ID`
3. Create a new project and get the new key
4. Set `QS__L1_RPC_URL` env var with the new Infura URL

### 1c. L1 Private Key
1. Create a new wallet for Sepolia operations
2. Transfer remaining Sepolia ETH from the old wallet
3. Set `QS__L1_PRIVATE_KEY` env var with the new key (hex, no 0x prefix)

## Step 2: Clean Git History

```bash
# Install git-filter-repo
pip install git-filter-repo

# Clone a mirror copy
git clone --mirror git@github.com:kota1026/quantum-shield.git quantum-shield-mirror
cd quantum-shield-mirror

# Remove .env files from all history
git filter-repo --path .env --path .env.save --path .env.bak --path src/agents/ai-prover/.env.bak --path src/agents/ai-prover/.env.prover1 --invert-paths

# Replace leaked secrets in all history
git filter-repo --replace-text <(cat <<'EOF'
REDACTED_INFURA_PROJECT_ID==>REDACTED_INFURA_KEY
REDACTED_PRIVATE_KEY==>REDACTED_PRIVATE_KEY
EOF
)

# Force push the cleaned history
git push --force

# IMPORTANT: After this, re-clone the repo locally
cd ..
rm -rf quantum-shield-local
git clone git@github.com:kota1026/quantum-shield.git quantum-shield-local
```

## Step 3: Make Repo Public

1. Go to https://github.com/kota1026/quantum-shield/settings
2. Scroll to **Danger Zone** > **Change repository visibility**
3. Select **Make public**
4. Set description: "Post-quantum asset protection protocol using ML-DSA + SLH-DSA on Ethereum"
5. Add topics: `post-quantum`, `cryptography`, `ethereum`, `blockchain`, `rust`, `nextjs`, `solidity`
6. Set website URL (after Vercel deploy)

## Step 4: Deploy Frontend to Vercel

### 4a. Install Vercel CLI
```bash
npm i -g vercel
```

### 4b. Deploy
```bash
cd src/frontend/web
vercel --prod
```

When prompted:
- **Link to existing project?** No
- **Project name:** quantum-shield
- **Framework:** Next.js
- **Root directory:** `./` (since you're already in `src/frontend/web`)
- **Build command:** `pnpm build`
- **Output directory:** `.next`

### 4c. Set Environment Variables

In Vercel Dashboard > Settings > Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-RAILWAY-URL` (set after Step 5) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Your WalletConnect project ID |
| `NEXT_PUBLIC_L1_CHAIN_ID` | `11155111` |

### 4d. Custom Domain (Optional)
```bash
vercel domains add quantumshield.io
```

## Step 5: Deploy Backend to Railway

### 5a. Create Project
1. Go to https://railway.app/new
2. Select **Deploy from GitHub repo**
3. Connect `kota1026/quantum-shield`

### 5b. Configure Service
- **Service name:** qs-api
- **Root directory:** `/` (repo root)
- **Dockerfile path:** `src/api/api/Dockerfile`
- **Port:** 8080

### 5c. Add Database & Redis
1. Click **+ New** > **Database** > **PostgreSQL**
2. Click **+ New** > **Database** > **Redis**
3. Railway will auto-set `DATABASE_URL` and `REDIS_URL`

### 5d. Set Environment Variables

In Railway service settings:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | (auto-set by Railway PostgreSQL) |
| `REDIS_URL` | (auto-set by Railway Redis) |
| `QS__L1_PRIVATE_KEY` | New rotated private key (hex, no 0x) |
| `QS__L1_RPC_URL` | `https://sepolia.infura.io/v3/NEW_KEY` |
| `QS__JWT_SECRET` | Generate: `openssl rand -hex 64` |
| `QS__CORS__ALLOWED_ORIGINS__0` | `https://quantum-shield.vercel.app` |
| `QS__SECURITY__SKIP_SIGNATURE_VERIFICATION` | `false` |
| `QS__SECURITY__SKIP_TOTP_VERIFICATION` | `false` |
| `QS__RATE_LIMIT__ENABLED` | `true` |
| `RUST_LOG` | `info` |

### 5e. Run Migrations

In Railway shell:
```bash
sqlx migrate run --source /app/migrations
```

Or add to Dockerfile CMD:
```dockerfile
CMD ["sh", "-c", "sqlx migrate run --source /app/migrations && /app/api-server"]
```

## Step 6: Connect Frontend to Backend

1. Get your Railway public URL (e.g., `https://qs-api-production.up.railway.app`)
2. Go to Vercel Dashboard > Settings > Environment Variables
3. Set `NEXT_PUBLIC_API_URL` = your Railway URL
4. Trigger redeploy: `vercel --prod` or push to main branch

## Step 7: Verify

```bash
# Backend health
curl https://YOUR-RAILWAY-URL/v1/health

# Frontend loads
open https://quantum-shield.vercel.app

# Root redirects to ecosystem
curl -I https://quantum-shield.vercel.app/
# Should redirect to /ecosystem
```

### Test Core Flow
1. Visit the site
2. Connect MetaMask (Sepolia network)
3. Navigate to Consumer > Lock
4. Lock some Sepolia ETH
5. Check History page
6. Check Explorer

## Step 8: Promotion

### GitHub
- [x] README with live demo link
- [ ] Add website URL to repo settings

### Grant Applications
- Update `docs/pitch/ef-grant-application.md` with live demo URL
- Submit to Ethereum Foundation: https://esp.ethereum.foundation/

### Blog Post Ideas
- "Building Post-Quantum Security for Ethereum" (Zenn/Medium)
- "NIST FIPS 204 on Ethereum: A Practical Implementation" (dev.to)
- "Why Your Crypto Needs Quantum Protection Now" (Medium)

### Demo Video
- Record using the flow: Ecosystem → Consumer Lock → History → Explorer
- Upload to YouTube/Loom
- Embed in README and grant applications

---

## Troubleshooting

### Vercel build fails
```bash
# Check locally first
cd src/frontend/web
pnpm build
```

### Railway deploy fails
- Check Dockerfile builds locally: `docker build -f src/api/api/Dockerfile .`
- Check Railway logs in dashboard

### CORS errors
- Ensure `QS__CORS__ALLOWED_ORIGINS__0` matches your Vercel domain exactly
- Include `https://` prefix

### Database migration fails
- Ensure PostgreSQL is fully started before running migrations
- Check `DATABASE_URL` format: `postgresql://user:pass@host:port/dbname`
