import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import type { LayerResult, TestStep } from './types.js';

const STDOUT_LIMIT = 16_000;
const STDERR_LIMIT = 8_000;
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

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
    child.on('error', () => {
      clearTimeout(timer);
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
