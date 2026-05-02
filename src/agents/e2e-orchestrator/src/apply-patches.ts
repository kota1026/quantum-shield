import { spawn } from 'node:child_process';
import { writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { FixerProposal } from './types.js';

/**
 * Filter fixer proposals to those auto-applicable. Mirrors the
 * ux-orchestrator's filter rule.
 *
 * Forbidden: high-risk, empty diffs, anything that touches contracts
 * or migrations. Backend code edits are allowed (Rust services / routes /
 * repositories) because that's where most fixer proposals will land —
 * unlike the UX side, the backend doesn't have a "designer" gate.
 */
export function filterAutoApplicable(proposals: FixerProposal[]): FixerProposal[] {
  return proposals.filter((p) => {
    if (!p.unified_diff || p.unified_diff.trim() === '') return false;
    if (p.risk === 'high') return false;
    // Even at low/medium risk, don't auto-apply patches that touch
    // L1 contracts or DB migrations — those need a human / formal review.
    const sensitive = p.affected_files.some((f) =>
      f.includes('src/contracts/l1/') ||
      f.includes('src/api/api/migrations/'),
    );
    if (sensitive) return false;
    return true;
  });
}

export type ApplyOutcome =
  | { proposal_id: string; status: 'applied'; checked_clean: true }
  | { proposal_id: string; status: 'rejected'; reason: string };

/**
 * Cheap structural pre-check before `git apply --check`. The fixer agent
 * has historically produced unified diffs that miss the file-header pair
 * or have hunk markers floating in the middle (run 25207474843 rejected
 * P1 at "corrupt patch at line 23" and P2 at "patch fragment without
 * header at line 15"). Catching these in JS gives a precise, actionable
 * rejection reason instead of a generic git error.
 *
 * Returns null if the structure looks well-formed; otherwise the reason
 * to reject without invoking git at all.
 */
function preValidateUnifiedDiff(diff: string): string | null {
  if (!diff.includes('--- a/')) {
    return 'patch missing required `--- a/<path>` file header';
  }
  if (!diff.includes('+++ b/')) {
    return 'patch missing required `+++ b/<path>` file header';
  }
  if (!/^@@ -\d+(?:,\d+)? \+\d+(?:,\d+)? @@/m.test(diff)) {
    return 'patch missing valid `@@ -L,N +L,N @@` hunk header';
  }
  // Hunk-before-header is a common AI failure mode: a `@@ ... @@` line
  // appears with no preceding `+++ b/` for that file. Scan in order.
  let sawHeader = false;
  for (const line of diff.split('\n')) {
    if (line.startsWith('+++ b/')) sawHeader = true;
    if (line.startsWith('@@ ') && !sawHeader) {
      return 'patch has hunk header before any file header (`@@` before `+++ b/`)';
    }
  }
  return null;
}

export async function applyPatch(
  repoRoot: string,
  proposal: FixerProposal,
  tempDir: string,
): Promise<ApplyOutcome> {
  const structural = preValidateUnifiedDiff(proposal.unified_diff);
  if (structural !== null) {
    return {
      proposal_id: proposal.id,
      status: 'rejected',
      reason: `pre-check failed: ${structural}`,
    };
  }
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
