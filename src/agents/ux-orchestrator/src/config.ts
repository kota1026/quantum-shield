import { z } from 'zod';

const ConfigSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  QS_BASE_URL: z.string().default('http://localhost:3000'),
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
