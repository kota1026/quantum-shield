import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import kleur from 'kleur';
import {
  type RouteSpec,
  type Viewport,
  type CaptureResult,
  type ReviewerOutput,
  type JudgeVerdict,
  type HealerProposal,
  type RunReport,
  TestPlan,
} from './types.js';
import type { Config } from './config.js';
import { runAgent, runAgentsInParallel, type AgentRunResult } from './agent-runner.js';
import { capture, writeManifest } from './capturer.js';

function ts(): string { return new Date().toISOString().replace(/[:.]/g, '-'); }
function nowIso(): string { return new Date().toISOString(); }
function info(m: string): void { console.log(kleur.cyan('▸ ') + m); }
function ok(m: string): void { console.log(kleur.green('✓ ') + m); }
function warn(m: string): void { console.log(kleur.yellow('! ') + m); }
function err(m: string): void { console.log(kleur.red('✗ ') + m); }

const LOCALES = ['ja', 'en'];

export async function runRoute(route: RouteSpec, config: Config): Promise<RunReport> {
  const startedAt = nowIso();
  const startMs = Date.now();
  const runDir = resolve(config.REPORTS_DIR, `${route.id}-${ts()}`);
  await mkdir(runDir, { recursive: true });

  info(`Route: ${route.id} (${route.label})`);
  info(`Run dir: ${runDir}`);

  // Stage 1: planner
  info('Stage 1: planner — producing test plan');
  const planAgent = await runAgent(
    'planner',
    JSON.stringify({
      route,
      locales: LOCALES,
      prior_baseline_exists: false,
      prior_verdict: null,
    }),
    config,
  );
  let plan = {
    route_id: route.id,
    route_label: route.label,
    path: route.path,
    viewports: route.viewports,
    locales: LOCALES,
    acceptance_criteria: [
      'Page loads within 5s with no console errors',
      'No hardcoded JA/EN strings outside t() in rendered DOM',
      'WCAG 2.1 AA a11y tree has no critical findings',
    ],
  };
  let planSource: 'ai' | 'fallback' = 'fallback';
  if (planAgent.ok) {
    const parsed = TestPlan.safeParse(planAgent.parsed_json);
    if (parsed.success) {
      plan = parsed.data;
      planSource = 'ai';
      ok(`planner produced plan with ${plan.acceptance_criteria.length} criteria across ${plan.viewports.length} viewports`);
    } else {
      warn(`planner output didn't match schema; using fallback (${parsed.error.issues.length} issues)`);
    }
  } else {
    warn(`planner failed: ${planAgent.error}; using fallback`);
  }
  await writeFile(resolve(runDir, 'plan.json'), JSON.stringify(plan, null, 2));

  // Stage 2: capturer (Playwright, no LLM)
  info(`Stage 2: capturer — ${plan.viewports.length} viewports`);
  const captures: CaptureResult[] = [];
  for (const v of plan.viewports as Viewport[]) {
    const result = await capture(route, v, config.QS_BASE_URL, runDir);
    captures.push(result);
    const tag = result.load_status === 'ok' ? ok : warn;
    tag(`captured ${v} status=${result.load_status} baseline=${result.baseline_path ? 'yes' : 'no'}`);
  }
  await writeManifest(runDir, captures);

  // Stage 3: 4 reviewers in parallel (per viewport, but serialized across viewports
  // to avoid token-budget surprises)
  const allReviews: ReviewerOutput[] = [];
  for (const cap of captures) {
    if (cap.load_status !== 'ok') {
      warn(`stage 3: skipping reviewers for ${cap.viewport} (load_status=${cap.load_status})`);
      continue;
    }
    info(`Stage 3 (${cap.viewport}): 4 reviewers in parallel`);
    const reviewerJobs = [
      {
        agent: 'accessibility-reviewer' as const,
        userPrompt: JSON.stringify({
          route, viewport: cap.viewport,
          a11y_tree_excerpt: `(read from ${cap.a11y_tree_path})`,
          acceptance_criteria: plan.acceptance_criteria,
        }),
      },
      {
        agent: 'visual-reviewer' as const,
        userPrompt: JSON.stringify({
          route, viewport: cap.viewport,
          current_screenshot_path: cap.screenshot_path,
          baseline_screenshot_path: cap.baseline_path,
          pixel_hash_match: cap.pixel_hash_match,
          acceptance_criteria: plan.acceptance_criteria,
        }),
      },
      {
        agent: 'copy-reviewer' as const,
        userPrompt: JSON.stringify({
          route, viewport: cap.viewport,
          copy_snapshot: `(read from ${cap.copy_snapshot_path})`,
          locale: 'ja',
          acceptance_criteria: plan.acceptance_criteria,
        }),
      },
      {
        agent: 'performance-reviewer' as const,
        userPrompt: JSON.stringify({
          route, viewport: cap.viewport,
          metrics: cap.perf_metrics,
          baseline_metrics: null,
          acceptance_criteria: plan.acceptance_criteria,
        }),
      },
    ];
    const reviewResults = await runAgentsInParallel(reviewerJobs, config);
    const reviews = reviewResults.map((r): ReviewerOutput => coerceReview(r));
    allReviews.push(...reviews);
    await writeFile(
      resolve(runDir, `stage3-reviews-${cap.viewport}.json`),
      JSON.stringify(reviews, null, 2),
    );
  }

  // Stage 4: judge (per viewport)
  info('Stage 4: judge per viewport');
  const verdictsPerViewport: Array<{ viewport: Viewport; judge: JudgeVerdict }> = [];
  for (const cap of captures) {
    const reviewsForVp = allReviews.filter(
      (r) => r.findings.length === 0 || r.findings.some((f) => true),
    );
    const judgeResult = await runAgent(
      'judge',
      JSON.stringify({
        route, viewport: cap.viewport, plan,
        reviews: reviewsForVp,
        capture: cap,
      }),
      config,
    );
    const judge = coerceJudge(judgeResult);
    verdictsPerViewport.push({ viewport: cap.viewport, judge });
    const tag = judge.verdict === 'none' ? ok : judge.verdict === 'cosmetic' ? warn : err;
    tag(`judge(${cap.viewport})=${judge.verdict} confidence=${judge.confidence.toFixed(2)}`);
  }

  // Stage 5: healer (conditional)
  let healerProposals: HealerProposal[] = [];
  const needsHealing = verdictsPerViewport.some((v) => v.judge.verdict === 'regression' || v.judge.verdict === 'broken');
  if (needsHealing) {
    info('Stage 5: healer — proposing test/registry/i18n patches');
    const worst = verdictsPerViewport.find((v) => v.judge.verdict === 'broken')
      ?? verdictsPerViewport.find((v) => v.judge.verdict === 'regression')!;
    const healResult = await runAgent(
      'healer',
      JSON.stringify({
        route, viewport: worst.viewport,
        judge_verdict: worst.judge,
        reviews: allReviews.filter((r) => true),
        repo_paths: {
          test_code: 'src/frontend/web/e2e/visual-regression/',
          route_registry: 'src/frontend/web/e2e/visual-regression/routes.ts',
          i18n_catalog: 'src/frontend/web/locales/{ja,en}/',
        },
      }),
      config,
    );
    if (healResult.ok && Array.isArray(healResult.parsed_json)) {
      healerProposals = healResult.parsed_json as HealerProposal[];
    }
    if (healerProposals.length > 0) {
      await mkdir(resolve(runDir, 'patches'), { recursive: true });
      for (const p of healerProposals) {
        await writeFile(
          resolve(runDir, 'patches', `${p.id}.patch`),
          p.unified_diff || '# (empty diff — investigation required)\n',
        );
      }
    }
  }

  // Stages 6+7+8 are deferred to a follow-up commit (DesignerGate is
  // human-gated; FinalVerifier needs the patch to be applied; Archiver
  // wraps with a PR comment generator). Stage 5 healer output is enough
  // to ship the v0.1 scaffold. Mark final_verifier_status=skipped.
  const finalVerifierStatus: 'pass' | 'regressed' | 'skipped' = 'skipped';

  // Aggregate
  const allAgents: AgentRunResult[] = [];
  const tokens = allAgents.reduce(
    (acc, r) => ({
      input: acc.input + r.usage.input,
      cached_input: acc.cached_input + r.usage.cached_input,
      output: acc.output + r.usage.output,
    }),
    { input: 0, cached_input: 0, output: 0 },
  );
  const cost_usd = allAgents.reduce((s, r) => s + r.cost_usd, 0);

  const worstJudge = verdictsPerViewport.reduce<JudgeVerdict>((acc, cur) =>
    severityRank(cur.judge.verdict) < severityRank(acc.verdict) ? cur.judge : acc,
    { verdict: 'none', summary: '', must_fix_before_ship: [], designer_review_required: false, unresolved_questions: [], confidence: 1 },
  );

  return {
    route_id: route.id,
    started_at: startedAt,
    finished_at: nowIso(),
    duration_ms: Date.now() - startMs,
    plan,
    plan_source: planSource,
    captures,
    reviews: allReviews,
    judge: worstJudge,
    healer_proposals: healerProposals,
    final_verifier_status: finalVerifierStatus,
    cost_usd,
    tokens,
  };
}

function severityRank(v: string): number {
  switch (v) {
    case 'broken': return 0;
    case 'regression': return 1;
    case 'unresolved': return 2;
    case 'cosmetic': return 3;
    case 'none': return 4;
    default: return 5;
  }
}

function coerceReview(r: AgentRunResult): ReviewerOutput {
  if (!r.ok) {
    return {
      reviewer: 'visual',
      status: 'fail',
      findings: [{
        severity: 'critical',
        concern: 'visual',
        title: `Reviewer agent failed: ${r.agent}`,
        detail: r.error,
        evidence: [r.error],
      }],
      confidence: 0,
    };
  }
  const obj = (r.parsed_json ?? {}) as Partial<ReviewerOutput>;
  return {
    reviewer: obj.reviewer ?? mapReviewer(r.agent),
    status: obj.status ?? 'fail',
    findings: Array.isArray(obj.findings) ? obj.findings : [],
    confidence: typeof obj.confidence === 'number' ? obj.confidence : 0.5,
  };
}

function mapReviewer(agent: string): ReviewerOutput['reviewer'] {
  if (agent.startsWith('accessibility')) return 'accessibility';
  if (agent.startsWith('visual')) return 'visual';
  if (agent.startsWith('copy')) return 'copy';
  return 'performance';
}

function coerceJudge(r: AgentRunResult): JudgeVerdict {
  if (!r.ok) {
    return {
      verdict: 'unresolved',
      summary: `judge failed: ${r.error}`,
      must_fix_before_ship: [],
      designer_review_required: false,
      unresolved_questions: [r.error],
      confidence: 0,
    };
  }
  const obj = (r.parsed_json ?? {}) as Partial<JudgeVerdict>;
  return {
    verdict: obj.verdict ?? 'unresolved',
    summary: obj.summary ?? '',
    must_fix_before_ship: obj.must_fix_before_ship ?? [],
    designer_review_required: obj.designer_review_required ?? false,
    unresolved_questions: obj.unresolved_questions ?? [],
    confidence: typeof obj.confidence === 'number' ? obj.confidence : 0.5,
  };
}
