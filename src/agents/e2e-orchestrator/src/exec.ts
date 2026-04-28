import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import type { LayerResult, TestStep } from './types.js';

const STDOUT_LIMIT = 16_000;
const STDERR_LIMIT = 8_000;
// 2 min default. Was 5 min, but the orchestrator's first credit-enabled
// run (25053424860) showed cargo test sequence_lock hanging the full
// 300s without producing output — likely a setup-time resource block
// (DB pool, RabbitMQ, or L1 RPC). Cap at 2 min so a hang surfaces
// faster as a layer failure with diagnostic stderr instead of consuming
// the workflow's whole budget. Tests that genuinely need >2 min should
// override per-step.
const DEFAULT_TIMEOUT_MS = 2 * 60 * 1000;

function tail(buf: string, limit: number): string {
  if (buf.length <= limit) return buf;
  return `[truncated ${buf.length - limit} bytes]\n` + buf.slice(buf.length - limit);
}

export async function runStep(
  step: TestStep,
  cwd: string,
  env: Record<string, string>,
  outputDir: string,
): Promise<LayerResult> {
  const started = Date.now();
  let stdout = '';
  let stderr = '';

  const child = spawn('bash', ['-lc', step.command], {
    cwd,
    env: { ...process.env, ...env },
  });

  const timer = setTimeout(() => {
    child.kill('SIGTERM');
    setTimeout(() => child.kill('SIGKILL'), 5_000);
  }, DEFAULT_TIMEOUT_MS);

  child.stdout?.on('data', (chunk: Buffer) => {
    stdout += chunk.toString('utf8');
  });
  child.stderr?.on('data', (chunk: Buffer) => {
    stderr += chunk.toString('utf8');
  });

  const exitCode: number = await new Promise((resolveCode) => {
    child.on('close', (code) => {
      clearTimeout(timer);
      resolveCode(code ?? 1);
    });
    // Pre-Sherlock blocker fix (2026-04-28): capture the spawn-error message
    // into stderr so layer agents can distinguish "binary not found" from
    // "test failed." Previously a missing `cast` / `psql` produced an exit-1
    // result with empty stderr, masking the real cause.
    child.on('error', (spawnErr) => {
      clearTimeout(timer);
      stderr += `\n[exec] spawn error: ${spawnErr.message}`;
      resolveCode(1);
    });
  });

  const logPath = resolve(outputDir, 'stage2', `${step.layer}.log`);
  await mkdir(dirname(logPath), { recursive: true });
  await writeFile(logPath, `# ${step.layer} step\n# command: ${step.command}\n# exit: ${exitCode}\n\n# STDOUT\n${stdout}\n\n# STDERR\n${stderr}`);

  return {
    layer: step.layer,
    status: exitCode === 0 ? 'pass' : 'fail',
    exit_code: exitCode,
    duration_ms: Date.now() - started,
    command: step.command,
    stdout_excerpt: tail(stdout, STDOUT_LIMIT),
    stderr_excerpt: tail(stderr, STDERR_LIMIT),
  };
}
