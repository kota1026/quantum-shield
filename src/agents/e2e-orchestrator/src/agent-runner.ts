import Anthropic from '@anthropic-ai/sdk';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Config } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = resolve(__dirname, '..', 'prompts');

export type AgentName =
  | 'spec-runner'
  | 'backend-runner'
  | 'frontend-runner'
  | 'db-verifier'
  | 'l1-verifier'
  | 'l3-verifier'
  | 'bug-hunter'
  | 'regression-sentinel'
  | 'performance-monitor'
  | 'fixer'
  | 'cross-reviewer';

export type AgentTier = 'sonnet' | 'haiku';

export const AGENT_TIERS: Record<AgentName, AgentTier> = {
  'spec-runner': 'sonnet',
  'backend-runner': 'haiku',
  'frontend-runner': 'haiku',
  'db-verifier': 'haiku',
  'l1-verifier': 'haiku',
  'l3-verifier': 'haiku',
  'bug-hunter': 'sonnet',
  'regression-sentinel': 'sonnet',
  'performance-monitor': 'haiku',
  fixer: 'sonnet',
  'cross-reviewer': 'sonnet',
};

export type TokenUsage = {
  input: number;
  cached_input: number;
  output: number;
};

export type AgentRunResult = {
  agent: AgentName;
  raw_text: string;
  parsed_json: unknown;
  usage: TokenUsage;
  duration_ms: number;
  cost_usd: number;
};

const PRICING_USD_PER_MTOK: Record<AgentTier, { input: number; cached: number; output: number }> = {
  sonnet: { input: 3, cached: 0.3, output: 15 },
  haiku: { input: 1, cached: 0.1, output: 5 },
};

function priceUsage(tier: AgentTier, usage: TokenUsage): number {
  const p = PRICING_USD_PER_MTOK[tier];
  return (
    (usage.input * p.input) / 1_000_000 +
    (usage.cached_input * p.cached) / 1_000_000 +
    (usage.output * p.output) / 1_000_000
  );
}

let promptCache: Map<AgentName, string> | null = null;

async function loadPrompts(): Promise<Map<AgentName, string>> {
  if (promptCache) return promptCache;
  const names: AgentName[] = [
    'spec-runner', 'backend-runner', 'frontend-runner', 'db-verifier',
    'l1-verifier', 'l3-verifier', 'bug-hunter', 'regression-sentinel',
    'performance-monitor', 'fixer', 'cross-reviewer',
  ];
  const cache = new Map<AgentName, string>();
  for (const name of names) {
    cache.set(name, await readFile(resolve(PROMPTS_DIR, `${name}.md`), 'utf8'));
  }
  promptCache = cache;
  return cache;
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```json\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1]! : text.trim();
  const start = raw.indexOf('{');
  const arrayStart = raw.indexOf('[');
  const firstBracket = arrayStart !== -1 && (start === -1 || arrayStart < start) ? arrayStart : start;
  if (firstBracket === -1) {
    throw new Error(`No JSON object found in agent output:\n${text.slice(0, 2000)}`);
  }
  const candidate = raw.slice(firstBracket).trim();
  try {
    return JSON.parse(candidate);
  } catch (err) {
    throw new Error(`Failed to parse agent JSON: ${(err as Error).message}\n--- snippet ---\n${candidate.slice(0, 2000)}`);
  }
}

export async function runAgent(
  agent: AgentName,
  userPrompt: string,
  config: Config,
): Promise<AgentRunResult> {
  const prompts = await loadPrompts();
  const systemPrompt = prompts.get(agent);
  if (!systemPrompt) throw new Error(`Missing system prompt for agent ${agent}`);

  const tier = AGENT_TIERS[agent];
  const model = tier === 'sonnet' ? config.SONNET_MODEL : config.HAIKU_MODEL;
  const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

  const started = Date.now();
  const message = await client.messages.create({
    model,
    max_tokens: 4096,
    system: [
      { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textBlocks = message.content.filter((b): b is Anthropic.TextBlock => b.type === 'text');
  const raw_text = textBlocks.map((b) => b.text).join('\n');

  let parsed_json: unknown = null;
  try {
    parsed_json = extractJson(raw_text);
  } catch (err) {
    parsed_json = { _parse_error: (err as Error).message, _raw: raw_text.slice(0, 2000) };
  }

  const u = message.usage;
  const usage: TokenUsage = {
    input: u.input_tokens ?? 0,
    cached_input: (u as unknown as { cache_read_input_tokens?: number }).cache_read_input_tokens ?? 0,
    output: u.output_tokens ?? 0,
  };

  return {
    agent,
    raw_text,
    parsed_json,
    usage,
    duration_ms: Date.now() - started,
    cost_usd: priceUsage(tier, usage),
  };
}

export async function runAgentsInParallel(
  jobs: Array<{ agent: AgentName; userPrompt: string }>,
  config: Config,
): Promise<AgentRunResult[]> {
  return Promise.all(jobs.map((j) => runAgent(j.agent, j.userPrompt, config)));
}
