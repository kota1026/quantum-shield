import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { CaptureResult, RouteSpec, Viewport } from './types.js';

const VIEWPORT_PX: Record<Viewport, { width: number; height: number }> = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 1024, height: 768 },
  mobile: { width: 390, height: 844 },
};

/**
 * Capturer (Stage 2): drives the existing `e2e/visual-regression/capture.spec.ts`
 * Playwright spec to take a screenshot, accessibility tree, and copy snapshot
 * for one route × one viewport. Returns evidence pointers; agents reason
 * over the artifacts on disk.
 *
 * This is a deterministic process (no LLM). Anthropic's verify-loop research
 * called this out explicitly: "Capturer produces evidence; reviewers verify
 * it. Do not let the same role do both."
 *
 * Fault-tolerance:
 * - HTTP error / timeout / CSP block → load_status reflects the failure;
 *   downstream reviewers know to skip rather than manufacture findings.
 */
export async function capture(
  route: RouteSpec,
  viewport: Viewport,
  baseUrl: string,
  outputDir: string,
): Promise<CaptureResult> {
  const dir = resolve(outputDir, 'stage2-capture', route.id);
  await mkdir(dir, { recursive: true });
  const screenshot_path = resolve(dir, `${viewport}.png`);
  const baseline_path = resolve(outputDir, '..', '.snapshots', 'baseline', route.id, `${viewport}.png`);
  const a11y_path = resolve(dir, `${viewport}.a11y.json`);
  const copy_path = resolve(dir, `${viewport}.copy.txt`);

  const size = VIEWPORT_PX[viewport];
  const env = {
    ...process.env,
    UX_BASE_URL: baseUrl,
    UX_ROUTE_PATH: route.path,
    UX_VIEWPORT_W: String(size.width),
    UX_VIEWPORT_H: String(size.height),
    UX_OUTPUT_SCREENSHOT: screenshot_path,
    UX_OUTPUT_A11Y: a11y_path,
    UX_OUTPUT_COPY: copy_path,
  };

  const result = await runPlaywright(env);
  if (result.status !== 'ok') {
    return {
      viewport,
      screenshot_path,
      baseline_path: null,
      a11y_tree_path: a11y_path,
      copy_snapshot_path: copy_path,
      perf_metrics: { lcp_ms: null, cls: null, inp_ms: null, tbt_ms: null },
      pixel_hash_match: null,
      load_status: result.status,
    };
  }

  return {
    viewport,
    screenshot_path,
    baseline_path: result.baseline_exists ? baseline_path : null,
    a11y_tree_path: a11y_path,
    copy_snapshot_path: copy_path,
    perf_metrics: result.perf_metrics,
    pixel_hash_match: result.pixel_hash_match,
    load_status: 'ok',
  };
}

type PlaywrightStatus = 'ok' | 'timeout' | 'http_error' | 'csp_blocked' | 'skipped';

type PlaywrightResult = {
  status: PlaywrightStatus;
  baseline_exists: boolean;
  pixel_hash_match: boolean | null;
  perf_metrics: { lcp_ms: number | null; cls: number | null; inp_ms: number | null; tbt_ms: number | null };
};

async function runPlaywright(env: NodeJS.ProcessEnv): Promise<PlaywrightResult> {
  // First-iteration scaffolding: invoke the existing
  // `e2e/visual-regression/capture.spec.ts` via npx playwright. The spec
  // already supports `UX_*` env vars from PR #141. We capture stdout to
  // detect status and read a sidecar JSON for perf metrics.
  return new Promise((resolveResult) => {
    let stdout = '';
    let stderr = '';
    const child = spawn(
      'npx',
      ['playwright', 'test', 'e2e/visual-regression/capture.spec.ts', '--reporter=line'],
      { cwd: resolve(env.REPO_ROOT ?? process.cwd(), 'src/frontend/web'), env },
    );
    const killTimer = setTimeout(() => child.kill('SIGTERM'), 60_000);

    child.stdout?.on('data', (c: Buffer) => { stdout += c.toString('utf8'); });
    child.stderr?.on('data', (c: Buffer) => { stderr += c.toString('utf8'); });
    child.on('error', (e) => {
      clearTimeout(killTimer);
      stderr += `\nspawn error: ${e.message}`;
      resolveResult({ status: 'skipped', baseline_exists: false, pixel_hash_match: null, perf_metrics: emptyMetrics() });
    });
    child.on('close', (code) => {
      clearTimeout(killTimer);
      if (stderr.includes('CSP') || stdout.includes('Refused to')) {
        resolveResult({ status: 'csp_blocked', baseline_exists: false, pixel_hash_match: null, perf_metrics: emptyMetrics() });
        return;
      }
      if (stdout.includes('Test timeout') || code === 124) {
        resolveResult({ status: 'timeout', baseline_exists: false, pixel_hash_match: null, perf_metrics: emptyMetrics() });
        return;
      }
      if (code !== 0) {
        resolveResult({ status: 'http_error', baseline_exists: false, pixel_hash_match: null, perf_metrics: emptyMetrics() });
        return;
      }
      // Real perf-metric parsing lives in the Playwright spec itself
      // (writes a sidecar JSON). Stub here returns nulls so reviewers
      // see "perf data missing" rather than fake numbers.
      resolveResult({
        status: 'ok',
        baseline_exists: stdout.includes('baseline:exists'),
        pixel_hash_match: stdout.includes('pixel:match'),
        perf_metrics: emptyMetrics(),
      });
    });
  });
}

function emptyMetrics(): PlaywrightResult['perf_metrics'] {
  return { lcp_ms: null, cls: null, inp_ms: null, tbt_ms: null };
}

export async function writeManifest(outputDir: string, captures: CaptureResult[]): Promise<void> {
  await writeFile(
    resolve(outputDir, 'stage2-capture', 'manifest.json'),
    JSON.stringify(captures, null, 2),
  );
}
