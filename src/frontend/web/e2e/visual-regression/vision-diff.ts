#!/usr/bin/env node
/**
 * UX Regression Hunter — Vision Diff Phase
 *
 * Compares each (id × viewport) pair across `.snapshots/baseline/` and
 * `.snapshots/current/`. For pairs whose pixel hash differs, the two
 * images are sent to Claude (Sonnet 4.6, vision-capable) which returns
 * a structured judgement:
 *
 *   {
 *     severity: "none" | "cosmetic" | "regression" | "broken",
 *     summary: string,
 *     specifics: string[]   // bulleted observations
 *   }
 *
 * Output:
 *   e2e/visual-regression/report.md       — human-readable
 *   e2e/visual-regression/report.json     — machine-readable (CI gate)
 *
 * Exit codes:
 *   0 — no regressions or only "cosmetic" diffs (CI-pass, warn only)
 *   1 — at least one "regression" or "broken" classification
 *
 * Required env:
 *   ANTHROPIC_API_KEY  — for the vision call
 *
 * Optional env:
 *   UX_MODEL           — defaults to "claude-sonnet-4-6"
 *   UX_FAIL_ON         — "regression" (default) | "cosmetic"
 *   UX_MAX_PAIRS       — cap pairs analysed per run (cost control)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';

interface Verdict {
  severity: 'none' | 'cosmetic' | 'regression' | 'broken';
  summary: string;
  specifics: string[];
}

interface PairResult {
  id: string;
  viewport: string;
  baselinePath: string;
  currentPath: string;
  pixelIdentical: boolean;
  verdict?: Verdict;
  error?: string;
}

const ROOT = path.resolve(__dirname);
const BASELINE_DIR = path.join(ROOT, '.snapshots', 'baseline');
const CURRENT_DIR = path.join(ROOT, '.snapshots', 'current');
const REPORT_MD = path.join(ROOT, 'report.md');
const REPORT_JSON = path.join(ROOT, 'report.json');

const MODEL = process.env.UX_MODEL || 'claude-sonnet-4-6';
const FAIL_ON: 'regression' | 'cosmetic' = (process.env.UX_FAIL_ON as 'regression' | 'cosmetic') || 'regression';
const MAX_PAIRS = process.env.UX_MAX_PAIRS ? parseInt(process.env.UX_MAX_PAIRS, 10) : Infinity;

function fileHash(p: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

function parseFilename(name: string): { id: string; viewport: string } | null {
  const m = name.match(/^(.+)__(desktop|tablet|mobile)\.png$/);
  if (!m) return null;
  return { id: m[1], viewport: m[2] };
}

function listSnapshots(dir: string): Map<string, string> {
  if (!fs.existsSync(dir)) return new Map();
  const out = new Map<string, string>();
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.png')) continue;
    out.set(file, path.join(dir, file));
  }
  return out;
}

const PROMPT = `You are a UX regression auditor for Quantum Shield, a post-quantum custody protocol.
You will receive two screenshots of the same page: BASELINE (known-good) and CURRENT (under test).

Classify the visual difference using this rubric:
- "none": pixel-level diff but visually identical (font hinting, anti-aliasing).
- "cosmetic": minor spacing/color/text drift that does not affect comprehension or affordance.
- "regression": layout breaks, missing UI elements, broken alignment, contrast loss, overlapping text, truncated CTAs.
- "broken": empty page, error overlay, blank components where data should render, missing primary CTA.

Be conservative: prefer "regression" over "cosmetic" if you are unsure.
Respond ONLY with strict JSON of shape:
{ "severity": "...", "summary": "<=140 chars", "specifics": ["bullet 1", "bullet 2"] }`;

async function classify(client: Anthropic, baseline: string, current: string): Promise<Verdict> {
  const baselineB64 = fs.readFileSync(baseline).toString('base64');
  const currentB64 = fs.readFileSync(current).toString('base64');

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'BASELINE:' },
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: baselineB64 } },
          { type: 'text', text: 'CURRENT:' },
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: currentB64 } },
          { type: 'text', text: 'Return JSON now.' },
        ],
      },
    ],
  });

  const block = response.content.find((c) => c.type === 'text');
  if (!block || block.type !== 'text') {
    throw new Error('No text content in vision response');
  }

  const jsonMatch = block.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Response was not JSON: ${block.text.slice(0, 200)}`);
  const parsed = JSON.parse(jsonMatch[0]) as Verdict;

  if (!['none', 'cosmetic', 'regression', 'broken'].includes(parsed.severity)) {
    throw new Error(`Unexpected severity: ${parsed.severity}`);
  }
  return parsed;
}

function severityEmoji(s: Verdict['severity']): string {
  return { none: 'OK', cosmetic: 'NOTE', regression: 'WARN', broken: 'FAIL' }[s];
}

function buildMarkdown(results: PairResult[]): string {
  const grouped: Record<string, PairResult[]> = {};
  for (const r of results) {
    const sev = r.verdict?.severity ?? (r.pixelIdentical ? 'none' : 'pending');
    grouped[sev] ??= [];
    grouped[sev].push(r);
  }

  const lines: string[] = [];
  lines.push('# UX Regression Report');
  lines.push('');
  lines.push(`Pairs analysed: ${results.length}`);
  for (const sev of ['broken', 'regression', 'cosmetic', 'none', 'pending']) {
    if (grouped[sev]) lines.push(`- **${sev}**: ${grouped[sev].length}`);
  }
  lines.push('');

  for (const sev of ['broken', 'regression', 'cosmetic']) {
    const list = grouped[sev];
    if (!list?.length) continue;
    lines.push(`## ${severityEmoji(sev as Verdict['severity'])} ${sev.toUpperCase()}`);
    for (const r of list) {
      lines.push(`### ${r.id} @ ${r.viewport}`);
      if (r.verdict) {
        lines.push(`> ${r.verdict.summary}`);
        for (const s of r.verdict.specifics) lines.push(`- ${s}`);
      }
      if (r.error) lines.push(`_error: ${r.error}_`);
      lines.push('');
    }
  }
  return lines.join('\n');
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY required');
    process.exit(2);
  }

  const baseline = listSnapshots(BASELINE_DIR);
  const current = listSnapshots(CURRENT_DIR);

  if (baseline.size === 0) {
    console.error(`No baselines found in ${BASELINE_DIR}. Run \`pnpm ux:baseline\` first.`);
    process.exit(2);
  }

  const client = new Anthropic();
  const results: PairResult[] = [];
  let analysed = 0;

  for (const [name, currentPath] of current) {
    const baselinePath = baseline.get(name);
    const meta = parseFilename(name);
    if (!meta || !baselinePath) continue;

    const identical = fileHash(baselinePath) === fileHash(currentPath);
    const result: PairResult = { ...meta, baselinePath, currentPath, pixelIdentical: identical };

    if (!identical && analysed < MAX_PAIRS) {
      try {
        result.verdict = await classify(client, baselinePath, currentPath);
        analysed++;
      } catch (e) {
        result.error = e instanceof Error ? e.message : String(e);
      }
    } else if (identical) {
      result.verdict = { severity: 'none', summary: 'Pixel-identical', specifics: [] };
    }
    results.push(result);
  }

  fs.writeFileSync(REPORT_JSON, JSON.stringify(results, null, 2));
  fs.writeFileSync(REPORT_MD, buildMarkdown(results));

  const failBar = FAIL_ON === 'cosmetic' ? ['cosmetic', 'regression', 'broken'] : ['regression', 'broken'];
  const fail = results.some((r) => r.verdict && failBar.includes(r.verdict.severity));

  console.log(`Report: ${REPORT_MD}`);
  console.log(`Vision-classified pairs: ${analysed}`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
