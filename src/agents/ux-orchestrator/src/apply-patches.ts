import { spawn } from 'node:child_process';
import { writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { HealerProposal } from './types.js';

/**
 * Filter healer proposals to those auto-applicable in CI:
 * - target must be `i18n_catalog`, `route_registry`, or `test_code` (NOT component)
 * - risk must be `low` or `medium` (never `high`)
 * - unified_diff must be non-empty
 *
 * INV1-style proposals (empty diff, target=component, risk=high) are
 * deliberately filtered out — they require human / DesignerGate review.
 */
export function filterAutoApplicable(proposals: HealerProposal[]): HealerProposal[] {
  return proposals.filter((p) => {
    if (!p.unified_diff || p.unified_diff.trim() === '') return false;
    if (p.risk === 'high') return false;
    if (p.target !== 'i18n_catalog' && p.target !== 'route_registry' && p.target !== 'test_code') return false;
    return true;
  });
}

export type ApplyOutcome =
  | { proposal_id: string; status: 'applied'; checked_clean: true }
  | { proposal_id: string; status: 'rejected'; reason: string };

/**
 * Apply a healer proposal as a unified diff via `git apply`. Refuses to
 * apply if `git apply --check` fails (no partial-apply state). Each
 * proposal is applied in its own atomic git operation.
 *
 * Important: this writes the diff to a temp file under the repo's git
 * directory and removes it after. We DO NOT use `git apply --3way` —
 * conflicts are rejected, not auto-merged. The healer's diff must apply
 * cleanly or it's the wrong fix.
 */
export async function applyPatch(
  repoRoot: string,
  proposal: HealerProposal,
  tempDir: string,
): Promise<ApplyOutcome> {
  const diffPath = resolve(tempDir, `${proposal.id}.patch`);
  await writeFile(diffPath, proposal.unified_diff);
  try {
    const checkResult = await runGit(['apply', '--check', diffPath], repoRoot);
    if (checkResult.exitCode !== 0) {
      return {
        proposal_id: proposal.id,
        status: 'rejected',
        reason: `git apply --check failed (exit ${checkResult.exitCode}): ${checkResult.stderr.slice(0, 400)}`,
      };
    }
    const applyResult = await runGit(['apply', diffPath], repoRoot);
    if (applyResult.exitCode !== 0) {
      return {
        proposal_id: proposal.id,
        status: 'rejected',
        reason: `git apply failed AFTER --check passed (exit ${applyResult.exitCode}): ${applyResult.stderr.slice(0, 400)}`,
      };
    }
    return { proposal_id: proposal.id, status: 'applied', checked_clean: true };
  } finally {
    try { await unlink(diffPath); } catch { /* leave it */ }
  }
}

type GitResult = { exitCode: number; stdout: string; stderr: string };

function runGit(args: string[], cwd: string): Promise<GitResult> {
  return new Promise((resolveResult) => {
    let stdout = '';
    let stderr = '';
    const child = spawn('git', args, { cwd });
    child.stdout?.on('data', (c: Buffer) => { stdout += c.toString('utf8'); });
    child.stderr?.on('data', (c: Buffer) => { stderr += c.toString('utf8'); });
    child.on('error', (e) => resolveResult({ exitCode: 1, stdout, stderr: stderr + `\nspawn error: ${e.message}` }));
    child.on('close', (code) => resolveResult({ exitCode: code ?? 1, stdout, stderr }));
  });
}
