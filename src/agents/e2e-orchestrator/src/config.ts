import { z } from 'zod';

const ConfigSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  DATABASE_URL: z.string().default('postgresql://quantum:quantum_dev@localhost:5432/quantum_shield'),
  L1_RPC_URL: z.string().default('https://rpc.sepolia.org'),
  L3_RPC_URL: z.string().default('http://localhost:8545'),
  REPO_ROOT: z.string().default(process.cwd()),
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
