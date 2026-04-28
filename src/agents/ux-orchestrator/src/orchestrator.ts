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
import { applyPatch, filterAutoApplicable, type ApplyOutcome } from './apply-patches.js';

function ts(): string { return new Date().toISOString().replace(/[:.]/g, '-'); }
function nowIso(): string { return new Date().toISOString(); }
function info(m: string): void { console.log(kleur.cyan('▸ ') + m); }
function ok(m: string): void { console.log(kleur.green('✓ ') + m); }
function warn(m: string): void { console.log(kleur.yellow('! ') + m); }
function err(m: string): void { console.log(kleur.red('✗ ') + m); }

const LOCALES = ['ja', 'en'];
const MAX_LOOP_ATTEMPTS = 3;

export async function runRoute(route: RouteSpec, config: Config): Promise<RunReport> {
  const startedAt = nowIso();
  const startMs = Date.now();
  const runDir = resolve(config.REPORTS_DIR, `${route.id}-${ts()}`);
  await mkdir(runDir, { recursive: true });
  const allAgents: AgentRunResult[] = [];

  info(`Route: ${route.id} (${route.label})`);
  info(`Run dir: ${runDir}`);

  // Stage 1: planner — runs once, plan doesn't change between iterations
  info('Stage 1: planner — producing test plan');
  const planAgent = await runAgent(
    'planner',
    JSON.stringify({ route, locales: LOCALES, prior_baseline_exists: false, prior_verdict: null }),
    config,
  );
  allAgents.push(planAgent);
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

  // Verify → fix → re-verify loop. Up to MAX_LOOP_ATTEMPTS iterations.
  // Each iteration runs Stages 2 (capture) → 3 (4 reviewers) → 4 (judge) →
  // 5 (healer) → optional patch application. The loop exits when the worst
  // judge verdict is `none`/`cosmetic`, when no auto-applicable patches
  // remain, or when MAX_LOOP_ATTEMPTS is reached.
  let lastCaptures: CaptureResult[] = [];
  let lastReviews: ReviewerOutput[] = [];
  let lastVerdicts: Array<{ viewport: Viewport; judge: JudgeVerdict }> = [];
  let lastHealerProposals: HealerProposal[] = [];
  const allApplyOutcomes: ApplyOutcome[] = [];
  let loopExitReason: 'success' | 'max_attempts' | 'human_required' | 'apply_failure' = 'max_attempts';

  for (let attempt = 1; attempt <= MAX_LOOP_ATTEMPTS; attempt++) {
    info(kleur.bold(`── Loop attempt ${attempt}/${MAX_LOOP_ATTEMPTS} ──`));

    // Stage 2
    info(`Stage 2 (attempt ${attempt}): capturer — ${plan.viewports.length} viewports`);
    const captures: CaptureResult[] = [];
    for (const v of plan.viewports as Viewport[]) {
      const result = await capture(route, v, config.QS_BASE_URL, runDir);
      captures.push(result);
      const tag = result.load_status === 'ok' ? ok : warn;
      tag(`captured ${v} status=${result.load_status} baseline=${result.baseline_path ? 'yes' : 'no'}`);
    }
    await writeManifest(runDir, captures);
    lastCaptures = captures;

    // Stage 3
    const reviews: ReviewerOutput[] = [];
    for (const cap of captures) {
      if (cap.load_status !== 'ok') {
        warn(`stage 3: skipping reviewers for ${cap.viewport} (load_status=${cap.load_status})`);
        continue;
      }
      info(`Stage 3 (attempt ${attempt}, ${cap.viewport}): 4 reviewers in parallel`);
      const reviewerJobs = [
        { agent: 'accessibility-reviewer' as const, userPrompt: JSON.stringify({ route, viewport: cap.viewport, a11y_tree_excerpt: `(read from ${cap.a11y_tree_path})`, acceptance_criteria: plan.acceptance_criteria }) },
        { agent: 'visual-reviewer' as const, userPrompt: JSON.stringify({ route, viewport: cap.viewport, current_screenshot_path: cap.screenshot_path, baseline_screenshot_path: cap.baseline_path, pixel_hash_match: cap.pixel_hash_match, acceptance_criteria: plan.acceptance_criteria }) },
        { agent: 'copy-reviewer' as const, userPrompt: JSON.stringify({ route, viewport: cap.viewport, copy_snapshot: `(read from ${cap.copy_snapshot_path})`, locale: 'ja', acceptance_criteria: plan.acceptance_criteria }) },
        { agent: 'performance-reviewer' as const, userPrompt: JSON.stringify({ route, viewport: cap.viewport, metrics: cap.perf_metrics, baseline_metrics: null, acceptance_criteria: plan.acceptance_criteria }) },
      ];
      const reviewResults = await runAgentsInParallel(reviewerJobs, config);
      allAgents.push(...reviewResults);
      reviews.push(...reviewResults.map(coerceReview));
    }
    await writeFile(resolve(runDir, `stage3-reviews-attempt-${attempt}.json`), JSON.stringify(reviews, null, 2));
    lastReviews = reviews;

    // Stage 4
    info(`Stage 4 (attempt ${attempt}): judge per viewport`);
    const verdicts: Array<{ viewport: Viewport; judge: JudgeVerdict }> = [];
    for (const cap of captures) {
      if (cap.load_status !== 'ok') continue;
      const judgeResult = await runAgent(
        'judge',
        JSON.stringify({ route, viewport: cap.viewport, plan, reviews, capture: cap }),
        config,
      );
      allAgents.push(judgeResult);
      const judge = coerceJudge(judgeResult);
      verdicts.push({ viewport: cap.viewport, judge });
      const tag = judge.verdict === 'none' ? ok : judge.verdict === 'cosmetic' ? warn : err;
      tag(`judge(${cap.viewport})=${judge.verdict} confidence=${judge.confidence.toFixed(2)}`);
    }
    lastVerdicts = verdicts;

    // Exit conditions
    const allGreenOrCosmetic = verdicts.every((v) => v.judge.verdict === 'none' || v.judge.verdict === 'cosmetic');
    if (allGreenOrCosmetic) {
      ok(`Loop exit: all viewports verdict ∈ {none, cosmetic} after ${attempt} attempt(s)`);
      loopExitReason = 'success';
      break;
    }
    if (attempt === MAX_LOOP_ATTEMPTS) {
      warn(`Loop exit: MAX_LOOP_ATTEMPTS (${MAX_LOOP_ATTEMPTS}) reached, regression persists`);
      loopExitReason = 'max_attempts';
      break;
    }

    // Stage 5: healer
    const worst = verdicts.find((v) => v.judge.verdict === 'broken')
      ?? verdicts.find((v) => v.judge.verdict === 'regression')
      ?? verdicts[0];
    if (!worst) break;
    info(`Stage 5 (attempt ${attempt}): healer — proposing patches`);
    const healResult = await runAgent(
      'healer',
      JSON.stringify({
        route, viewport: worst.viewport,
        judge_verdict: worst.judge,
        reviews,
        repo_paths: {
          test_code: 'src/frontend/web/e2e/visual-regression/',
          route_registry: 'src/frontend/web/e2e/visual-regression/routes.ts',
          i18n_catalog: 'src/frontend/web/locales/{ja,en}/',
        },
      }),
      config,
    );
    allAgents.push(healResult);
    const proposals: HealerProposal[] = healResult.ok && Array.isArray(healResult.parsed_json)
      ? (healResult.parsed_json as HealerProposal[])
      : [];
    lastHealerProposals = proposals;
    if (proposals.length > 0) {
      await mkdir(resolve(runDir, 'patches'), { recursive: true });
      for (const p of proposals) {
        await writeFile(
          resolve(runDir, `patches/${p.id}-attempt-${attempt}.patch`),
          p.unified_diff || '# (empty diff — investigation required)\n',
        );
      }
    }

    // If --auto-fix is off, the loop exits after Stage 5: we report
    // proposals but don't apply. This matches the "propose but don't
    // mutate" CI mode.
    if (!config.AUTO_FIX) {
      info(`Loop exit: AUTO_FIX off, proposals written for review (attempt ${attempt})`);
      loopExitReason = 'human_required';
      break;
    }

    // Filter to auto-applicable (target ≠ component, risk ≠ high, non-empty diff)
    const applicable = filterAutoApplicable(proposals);
    if (applicable.length === 0) {
      warn(`Loop exit: 0 auto-applicable patches (all healer output requires human review)`);
      loopExitReason = 'human_required';
      break;
    }

    info(`Stage 5b (attempt ${attempt}): applying ${applicable.length} patch(es) via git apply`);
    let allApplied = true;
    for (const p of applicable) {
      const outcome = await applyPatch(config.REPO_ROOT, p, runDir);
      allApplyOutcomes.push(outcome);
      if (outcome.status === 'applied') {
        ok(`applied ${p.id} (${p.target}, risk=${p.risk})`);
      } else {
        err(`rejected ${p.id}: ${outcome.reason}`);
        allApplied = false;
      }
    }
    if (!allApplied) {
      warn(`Loop exit: some patches failed git apply --check; halting before re-verify`);
      loopExitReason = 'apply_failure';
      break;
    }
    info(`patches applied successfully — re-verifying in next iteration`);
  }

  // Stage 7: FinalVerifier — synthesize the loop history into a single status
  info('Stage 7: FinalVerifier — synthesizing loop history');
  const finalVerifierAgent = await runAgent(
    'final-verifier',
    JSON.stringify({
      route, viewport: lastVerdicts[0]?.viewport ?? 'desktop',
      previous_verdict: { verdict: lastVerdicts[0]?.judge.verdict, must_fix_before_ship: lastVerdicts[0]?.judge.must_fix_before_ship ?? [] },
      patches_applied: allApplyOutcomes,
      reviews_post_patch: lastReviews,
      loop_exit_reason: loopExitReason,
    }),
    config,
  );
  allAgents.push(finalVerifierAgent);
  const finalVerifierStatus: 'pass' | 'regressed' | 'skipped' =
    loopExitReason === 'success' ? 'pass' : 'regressed';

  // Stage 8: Archiver — produce PR comment + tags
  info('Stage 8: Archiver — producing PR comment + follow-up actions');
  const cost_usd_so_far = allAgents.reduce((s, r) => s + r.cost_usd, 0);
  const tokens_so_far = allAgents.reduce(
    (acc, r) => ({ input: acc.input + r.usage.input, cached_input: acc.cached_input + r.usage.cached_input, output: acc.output + r.usage.output }),
    { input: 0, cached_input: 0, output: 0 },
  );
  const archiverAgent = await runAgent(
    'archiver',
    JSON.stringify({
      route_id: route.id, route_label: route.label, path: route.path,
      verdicts_per_viewport: lastVerdicts,
      healer_applied: lastHealerProposals,
      apply_outcomes: allApplyOutcomes,
      final_verifier_status: finalVerifierStatus,
      loop_exit_reason: loopExitReason,
      cost_usd: cost_usd_so_far,
      tokens: tokens_so_far,
      duration_ms: Date.now() - startMs,
    }),
    config,
  );
  allAgents.push(archiverAgent);
  if (archiverAgent.ok) {
    await writeFile(resolve(runDir, 'archive.json'), JSON.stringify(archiverAgent.parsed_json, null, 2));
  }

  // Final aggregation
  const tokens = allAgents.reduce(
    (acc, r) => ({ input: acc.input + r.usage.input, cached_input: acc.cached_input + r.usage.cached_input, output: acc.output + r.usage.output }),
    { input: 0, cached_input: 0, output: 0 },
  );
  const cost_usd = allAgents.reduce((s, r) => s + r.cost_usd, 0);

  const worstJudge = lastVerdicts.reduce<JudgeVerdict>((acc, cur) =>
    severityRank(cur.judge.verdict) < severityRank(acc.verdict) ? cur.judge : acc,
    { verdict: 'none', summary: '', must_fix_before_ship: [], designer_review_required: false, unresolved_questions: [], confidence: 1 },
  );

  const tag = finalVerifierStatus === 'pass' ? ok : err;
  tag(`Final: ${finalVerifierStatus} (loop_exit=${loopExitReason}, cost=$${cost_usd.toFixed(3)})`);

  return {
    route_id: route.id,
    started_at: startedAt,
    finished_at: nowIso(),
    duration_ms: Date.now() - startMs,
    plan,
    plan_source: planSource,
    captures: lastCaptures,
    reviews: lastReviews,
    judge: worstJudge,
    healer_proposals: lastHealerProposals,
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
