import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';

/**
 * Walk up from `start` looking for a directory that contains a `.git`
 * marker. Falls back to `start` if no parent has it (we're outside a
 * git checkout). Used to auto-detect REPO_ROOT when the env var isn't
 * explicitly set — important for the UX orchestrator which is invoked
 * from `src/agents/ux-orchestrator/` and needs paths resolved from the
 * monorepo root, not its package dir.
 */
function findRepoRoot(start: string): string {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(resolve(dir, '.git'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return start; // hit filesystem root
    dir = parent;
  }
}

const ConfigSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  QS_BASE_URL: z.string().default('http://localhost:3000'),
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
