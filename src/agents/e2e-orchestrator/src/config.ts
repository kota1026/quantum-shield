import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';

/**
 * Walk up from `start` looking for a directory containing a `.git`
 * marker. Used to auto-detect REPO_ROOT when the env var isn't
 * explicitly set — `pnpm verify` from `src/agents/e2e-orchestrator/`
 * has cwd inside the package, but the orchestrator needs the monorepo
 * root (so it can resolve `docs/core/SEQUENCES.md`, run `cargo` inside
 * `src/api/api`, etc.). Falls back to `start` if no parent has `.git`.
 */
function findRepoRoot(start: string): string {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(resolve(dir, '.git'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return start;
    dir = parent;
  }
}

const ConfigSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  DATABASE_URL: z.string().default('postgresql://quantum:quantum_dev@localhost:5432/quantum_shield'),
  L1_RPC_URL: z.string().default('https://rpc.sepolia.org'),
  L3_RPC_URL: z.string().default('http://localhost:8545'),
  REPO_ROOT: z.string().default(findRepoRoot(process.cwd())),
  REPORTS_DIR: z.string().default('./reports'),
  HAIKU_MODEL: z.string().default('claude-haiku-4-5-20251001'),
  SONNET_MODEL: z.string().default('claude-sonnet-4-6'),
  AUTO_FIX: z.coerce.boolean().default(false),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(overrides: Partial<Record<keyof Config, string | boolean>> = {}): Config {
  const env = { ...process.env, ...overrides };
  const parsed = ConfigSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid configuration:\n${issues}`);
  }
  return parsed.data;
}
