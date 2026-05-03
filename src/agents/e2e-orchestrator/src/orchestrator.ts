import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import kleur from 'kleur';
import {
  TestPlan,
  type LayerResult,
  type LayerAnalysis,
  type QualityFinding,
  type FixerProposal,
  type FinalVerdict,
  type RunReport,
} from './types.js';
import {
  bindingToPlan,
  getSequenceBinding,
  loadSpec,
} from './spec-loader.js';
import { runStep } from './exec.js';
import { runAgent, runAgentsInParallel } from './agent-runner.js';
import type { Config } from './config.js';
import { applyPatch, filterAutoApplicable, type ApplyOutcome } from './apply-patches.js';
import { runPreflight } from './preflight.js';

const MAX_LOOP_ATTEMPTS = 3;

function ts(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function nowIso(): string {
  return new Date().toISOString();
}

function info(msg: string): void { console.log(kleur.cyan('▸ ') + msg); }
function ok(msg: string): void { console.log(kleur.green('✓ ') + msg); }
function warn(msg: string): void { console.log(kleur.yellow('! ') + msg); }
function err(msg: string): void { console.log(kleur.red('✗ ') + msg); }

/**
 * Re-derive each step's `phase` from the static binding rather than trusting
 * the AI plan. The spec-runner prompt's schema doesn't include `phase`, so
 * the AI silently drops it and every step ends up at the `drive` default.
 *
 * Observed in run 25147313400: orchestrator-stdout.log showed
 *   ▸ Stage 2a: 4 drive step(s) in parallel
 *   ▸ Stage 2b: 0 verify step(s) in parallel (after drive completes)
 * even though the lock binding has 2 drive + 2 verify. The cross-phase race
 * the previous PR meant to fix re-emerged because the AI flattened the
 * classification.
 *
 * The binding is human-curated and encodes the producer/consumer
 * relationship (backend test writes locks; psql reads them). Match by
 * (layer, command) — the spec-runner prompt instructs the AI to copy
 * commands verbatim, so identity match is reliable. Fall back to the single
 * step in a layer if commands differ; otherwise keep the AI's value.
 */
function reconcilePhasesFromBinding(
  aiPlan: TestPlan,
  binding: TestPlan,
): { plan: TestPlan; corrected: number } {
  let corrected = 0;
  const reconciled = aiPlan.steps.map((step) => {
    const exact = binding.steps.find(
      (b) => b.layer === step.layer && b.command === step.command,
    );
    if (exact) {
      if (exact.phase !== step.phase) corrected++;
      return { ...step, phase: exact.phase };
    }
    const sameLayer = binding.steps.filter((b) => b.layer === step.layer);
    if (sameLayer.length === 1 && sameLayer[0]) {
      if (sameLayer[0].phase !== step.phase) corrected++;
      return { ...step, phase: sameLayer[0].phase };
    }
    return step;
  });
  return { plan: { ...aiPlan, steps: reconciled }, corrected };
}

export async function runSequence(
  sequenceId: string,
  config: Config,
  attempt: number = 1,
): Promise<RunReport> {
  const startedAt = nowIso();
  const startMs = Date.now();
  const runDir = resolve(config.REPORTS_DIR, `${sequenceId}-${ts()}-attempt${attempt}`);
  await mkdir(runDir, { recursive: true });

  info(`Sequence: ${sequenceId} (attempt ${attempt}/${MAX_LOOP_ATTEMPTS})`);
  info(`Run dir:  ${runDir}`);

  // Hoist binding/baseline above Stage 0 so the preflight early-exit can
  // populate `plan` in its minimal RunReport with the static binding (no
  // AI call needed). Stage 1 below upgrades `plan` to the AI-refined version.
  const binding = getSequenceBinding(sequenceId);
  const baseline = bindingToPlan(binding);

  // Stage 0: infrastructure preflight. Runs before Stage 1 so we never spend
  // Anthropic tokens on a run that would silent-no-op due to a missing CI
  // secret or unreachable RPC. PRs #160/#162 each burned multiple full runs
  // because the orchestrator had no way to distinguish "code is broken" from
  // "the environment is misconfigured" — every patch attempt repeated the
  // same `l1_vault present: false` symptom. Three deterministic checks here
  // cover that entire failure class: signing key parses, RPC returns Sepolia
  // chain ID, vault address has bytecode. On failure we write a minimal
  // BLOCKED verdict.json with `summary=preflight_<which>_failed` and exit;
  // the auto-commit step still picks up `preflight.json` and the verdict so
  // a human reading the next run's artifacts sees the exact infra issue.
  info('Stage 0: preflight — validating L1 secret/RPC/vault before agent steps');
  const preflight = await runPreflight(config, runDir);
  if (!preflight.passed) {
    err(`Preflight failed: ${preflight.failed_check}`);
    for (const c of preflight.checks) {
      const tag = c.passed ? ok : err;
      tag(`  ${c.name}: ${c.detail}`);
    }
    const blockedVerdict: FinalVerdict = {
      verdict: 'BLOCKED',
      summary: `preflight_${preflight.failed_check}_failed`,
      must_fix_before_merge: preflight.checks
        .filter((c) => !c.passed)
        .map((c) => `${c.name}: ${c.detail}`),
      fixer_recommendation: 'reject',
      unresolved_questions: [
        'Is DEPLOYER_PRIVATE_KEY registered in the sepolia GitHub Actions environment?',
        'Is L1_RPC_URL reachable from the CI runner and pointing at Sepolia (chain id 11155111)?',
        'Is the Vault contract deployed at the address the api-server expects?',
      ],
      confidence: 1.0,
    };
    await writeFile(resolve(runDir, 'verdict.json'), JSON.stringify(blockedVerdict, null, 2));
    return {
      sequence: sequenceId,
      started_at: startedAt,
      finished_at: nowIso(),
      duration_ms: Date.now() - startMs,
      plan: baseline,
      plan_source: 'fallback',
      layer_results: [],
      layer_analyses: [],
      quality_findings: [],
      fixer_proposals: [],
      final_verdict: blockedVerdict,
      cost_usd: 0,
      tokens: { input: 0, cached_input: 0, output: 0 },
    };
  }
  ok(`Preflight passed: ${preflight.checks.length} checks green`);

  // Stage 1: spec-runner (binding/baseline hoisted above Stage 0)
  info('Stage 1: spec-runner — loading SEQUENCES.md and producing test plan');
  let plan: TestPlan = baseline;
  // Pre-Sherlock blocker HIGH-2 fix: track whether the AI-refined plan was
  // used or the static binding fallback. Surfaced in report.md so a silent
  // degradation cannot hide behind a green verdict.
  let planSource: 'ai' | 'fallback' = 'fallback';
  try {
    const spec = await loadSpec(config.REPO_ROOT);
    const planAgent = await runAgent(
      'spec-runner',
      JSON.stringify({
        spec_excerpt: spec.slice(0, 30_000),
        binding_hint: baseline,
        sequence_id: binding.id,
        sequence_name: binding.name,
      }),
      config,
    );
    if (!planAgent.ok) {
      warn(`spec-runner failed: ${planAgent.error}; using binding fallback`);
    } else {
      const parsed = TestPlan.safeParse(planAgent.parsed_json);
      if (parsed.success) {
        const { plan: reconciled, corrected } = reconcilePhasesFromBinding(parsed.data, baseline);
        plan = reconciled;
        planSource = 'ai';
        ok(`spec-runner produced plan with ${plan.steps.length} steps across ${plan.layers.length} layers`);
        if (corrected > 0) {
          info(`reconciled ${corrected}/${plan.steps.length} step phase(s) from binding (AI omitted phase classification)`);
        }
      } else {
        warn(`spec-runner output didn't match schema, using binding fallback (${parsed.error.issues.length} issues)`);
      }
    }
  } catch (e) {
    warn(`spec-runner failed (${(e as Error).message}); using binding fallback`);
  }
  await writeFile(resolve(runDir, 'plan.json'), JSON.stringify(plan, null, 2));

  // Stage 2: two-phase layer execution (drive → verify) + parallel analysis.
  //
  // Bug discovered in run 25055038384 (cross-reviewer's "Playwright is lying
  // about persistence" finding): Promise.all on every step ran cargo test,
  // playwright, psql, and cast concurrently. The psql verify-step returned
  // at T=0.4s with zero rows because the drive steps (cargo test ~120s,
  // playwright ~80s) hadn't finished writing yet. The verifier then reported
  // a contradiction — "frontend pass but DB empty" — that didn't actually
  // exist; both the test and the persistence were fine, but the orchestrator
  // sampled DB state before either had run.
  //
  // Fix: drive steps (those that produce state — backend tests, Playwright)
  // run in parallel as a group, and only after they all finish do verify
  // steps (those that read state — psql, cast call) run. Within each phase
  // there's still full parallelism, so we keep the speed advantage where it's
  // safe.
  const driveSteps = plan.steps.filter((s) => s.phase === 'drive');
  const verifySteps = plan.steps.filter((s) => s.phase === 'verify');
  const stepEnv = {
    DATABASE_URL: config.DATABASE_URL,
    L1_RPC_URL: config.L1_RPC_URL,
    L3_RPC_URL: config.L3_RPC_URL,
  };

  info(`Stage 2a: ${driveSteps.length} drive step(s) in parallel`);
  const driveResults = await Promise.all(
    driveSteps.map((step) => runStep(step, config.REPO_ROOT, stepEnv, runDir)),
  );

  info(`Stage 2b: ${verifySteps.length} verify step(s) in parallel (after drive completes)`);
  const verifyResults = await Promise.all(
    verifySteps.map((step) => runStep(step, config.REPO_ROOT, stepEnv, runDir)),
  );

  // Preserve original plan.steps order so layer_results indexing matches the
  // plan elsewhere (analyzer dispatch, fixer payload).
  const allResults = [...driveResults, ...verifyResults];
  const layerResults: LayerResult[] = plan.steps.map((step) => {
    const r = allResults.find(
      (res) => res.layer === step.layer && res.command === step.command,
    );
    if (!r) {
      // Should never happen — every step was passed to runStep. If a step
      // somehow had neither phase, surface it explicitly rather than silently
      // dropping a layer.
      return {
        layer: step.layer,
        status: 'fail',
        exit_code: 1,
        duration_ms: 0,
        command: step.command,
        stdout_excerpt: '',
        stderr_excerpt: `[orchestrator] step missing phase classification: ${step.description}`,
      };
    }
    return r;
  });
  for (const r of layerResults) {
    const tag = r.status === 'pass' ? ok : r.status === 'skipped' ? warn : err;
    tag(`layer ${r.layer.padEnd(8)} ${r.status} (exit=${r.exit_code}, ${r.duration_ms}ms)`);
  }

  info('Stage 2: dispatching layer analyzer agents (haiku x5)');
  const analyzerJobs = layerResults.map((r) => {
    const step = plan.steps.find((s) => s.layer === r.layer);
    const agent =
      r.layer === 'backend' ? ('backend-runner' as const) :
      r.layer === 'frontend' ? ('frontend-runner' as const) :
      r.layer === 'db' ? ('db-verifier' as const) :
      r.layer === 'l1' ? ('l1-verifier' as const) :
      ('l3-verifier' as const);
    return {
      agent,
      userPrompt: JSON.stringify({
        sequence_id: plan.sequence_id,
        sequence_name: plan.sequence_name,
        command: r.command,
        exit_code: r.exit_code,
        stdout_excerpt: r.stdout_excerpt,
        stderr_excerpt: r.stderr_excerpt,
        expected: step?.expected ?? '',
      }),
    };
  });
  const analyzerResults = await runAgentsInParallel(analyzerJobs, config);
  // Pre-Sherlock blocker HIGH-3 fix: agents that returned `ok: false`
  // (timeout / parse failure) become explicit critical findings rather than
  // silently coercing to a "fail" status with zero issues.
  const layerAnalyses: LayerAnalysis[] = analyzerResults.map((r, idx): LayerAnalysis => {
    const layer = analyzerJobs[idx]?.agent.replace('-runner', '').replace('-verifier', '') as LayerAnalysis['layer'];
    if (!r.ok) {
      return {
        layer: layer ?? 'backend',
        status: 'fail',
        observations: [`Agent ${r.agent} did not return a parseable result`],
        issues: [{ severity: 'critical', title: `Layer agent failure: ${r.agent}`, detail: r.error }],
        confidence: 0,
      };
    }
    const obj = (r.parsed_json ?? {}) as Partial<LayerAnalysis>;
    return {
      layer: (obj.layer ?? 'backend'),
      status: obj.status ?? 'fail',
      observations: Array.isArray(obj.observations) ? obj.observations : [],
      issues: Array.isArray(obj.issues) ? obj.issues : [],
      confidence: typeof obj.confidence === 'number' ? obj.confidence : 0.5,
    };
  });
  await writeFile(resolve(runDir, 'stage2-analysis.json'), JSON.stringify(layerAnalyses, null, 2));

  // Stage 3: quality checks
  info('Stage 3: bug-hunter / regression-sentinel / performance-monitor (parallel)');
  const lastGreenPath = resolve(config.REPORTS_DIR, '.last-green', `${sequenceId}.json`);
  const baselinePath = resolve(config.REPORTS_DIR, '.baseline', `${sequenceId}.json`);
  // Pre-Sherlock blocker fix (HIGH severity): a corrupt or truncated
  // last-green / baseline JSON used to throw an unhandled exception that
  // killed the entire run. Now each load is wrapped — failure logs and
  // falls back to null (regression-sentinel handles null as "first run").
  const safeLoadJson = async (path: string): Promise<unknown | null> => {
    if (!existsSync(path)) return null;
    try {
      return JSON.parse(await readFile(path, 'utf8'));
    } catch (e) {
      warn(`could not parse ${path}: ${(e as Error).message}; treating as missing`);
      return null;
    }
  };
  const lastGreen = await safeLoadJson(lastGreenPath);
  const baselineMetrics = await safeLoadJson(baselinePath);

  const qualityResults = await runAgentsInParallel(
    [
      {
        agent: 'bug-hunter',
        userPrompt: JSON.stringify({
          sequence: { id: plan.sequence_id, name: plan.sequence_name, section: plan.spec_section },
          layer_results: layerResults,
          layer_analyses: layerAnalyses,
        }),
      },
      {
        agent: 'regression-sentinel',
        userPrompt: JSON.stringify({
          sequence: { id: plan.sequence_id, name: plan.sequence_name, section: plan.spec_section },
          current_run: { layer_results: layerResults, layer_analyses: layerAnalyses },
          last_green_run: lastGreen,
        }),
      },
      {
        agent: 'performance-monitor',
        userPrompt: JSON.stringify({
          sequence: plan.sequence_id,
          current_metrics: {
            per_layer_ms: Object.fromEntries(layerResults.map((r) => [r.layer, r.duration_ms])),
            agent_usage: analyzerResults.map((r) => ({ agent: r.agent, ...r.usage, cost: r.cost_usd })),
          },
          baseline_metrics: baselineMetrics,
        }),
      },
    ],
    config,
  );
  // Pre-Sherlock blocker fix: a parse-failure from bug-hunter etc. becomes a
  // critical synthetic finding instead of being silently dropped as `[]`.
  const qualityFindings: QualityFinding[] = qualityResults.flatMap((r): QualityFinding[] => {
    if (!r.ok) {
      const sourceMap: Record<string, QualityFinding['source']> = {
        'bug-hunter': 'bug-hunter',
        'regression-sentinel': 'regression-sentinel',
        'performance-monitor': 'performance-monitor',
      };
      return [{
        source: sourceMap[r.agent] ?? 'bug-hunter',
        severity: 'critical',
        title: `Quality agent failure: ${r.agent}`,
        detail: r.error,
        evidence: [r.error],
      }];
    }
    return Array.isArray(r.parsed_json) ? (r.parsed_json as QualityFinding[]) : [];
  });
  await writeFile(resolve(runDir, 'stage3.json'), JSON.stringify(qualityFindings, null, 2));

  const sevCounts = qualityFindings.reduce<Record<string, number>>((acc, f) => {
    acc[f.severity] = (acc[f.severity] ?? 0) + 1;
    return acc;
  }, {});
  info(`Stage 3 findings by severity: ${JSON.stringify(sevCounts)}`);

  // Stage 4: fixer + cross-reviewer (parallel)
  info('Stage 4: fixer + cross-reviewer (parallel)');
  const aggregatedFindings = [
    ...layerAnalyses.flatMap((a) =>
      a.issues.map(
        (i) => ({ source: 'bug-hunter' as const, ...i, evidence: a.observations.slice(0, 3), suggested_owner: undefined }),
      ),
    ),
    ...qualityFindings,
  ];
  const stage4 = await runAgentsInParallel(
    [
      {
        agent: 'fixer',
        userPrompt: JSON.stringify({
          sequence: plan.sequence_id,
          findings: aggregatedFindings,
          repo_context: 'src/api/api (Rust/Axum), src/frontend/web (Next.js), src/contracts/l1 (Solidity), docs/core/SEQUENCES.md (spec)',
        }),
      },
      {
        agent: 'cross-reviewer',
        userPrompt: JSON.stringify({
          sequence: plan.sequence_name,
          plan,
          layer_results: layerResults,
          layer_analyses: layerAnalyses,
          quality_findings: qualityFindings,
          fixer_proposals: 'awaiting parallel fixer output — base verdict on findings, recommend "review_required" for any high-risk fix area',
        }),
      },
    ],
    config,
  );

  const fixerResult = stage4[0];
  const reviewerResult = stage4[1];
  const fixerProposals: FixerProposal[] = fixerResult && fixerResult.ok && Array.isArray(fixerResult.parsed_json)
    ? (fixerResult.parsed_json as FixerProposal[])
    : [];
  const verdictRaw = (reviewerResult && reviewerResult.ok ? reviewerResult.parsed_json : {}) as Partial<FinalVerdict>;
  const finalVerdict: FinalVerdict = {
    verdict: verdictRaw.verdict ?? 'BLOCKED',
    summary: verdictRaw.summary ?? 'cross-reviewer did not return a parseable verdict',
    must_fix_before_merge: verdictRaw.must_fix_before_merge ?? [],
    fixer_recommendation: verdictRaw.fixer_recommendation ?? 'review_required',
    unresolved_questions: verdictRaw.unresolved_questions ?? [],
    confidence: typeof verdictRaw.confidence === 'number' ? verdictRaw.confidence : 0.5,
  };
  await writeFile(resolve(runDir, 'verdict.json'), JSON.stringify(finalVerdict, null, 2));
  if (fixerProposals.length > 0) {
    await mkdir(resolve(runDir, 'patches'), { recursive: true });
    for (const p of fixerProposals) {
      await writeFile(resolve(runDir, 'patches', `${p.id}.patch`), p.unified_diff || '# (empty diff — investigation required)\n');
    }
  }

  // Aggregate token usage
  const allAgents = [...analyzerResults, ...qualityResults, ...stage4];
  const tokens = allAgents.reduce(
    (acc, r) => ({
      input: acc.input + r.usage.input,
      cached_input: acc.cached_input + r.usage.cached_input,
      output: acc.output + r.usage.output,
    }),
    { input: 0, cached_input: 0, output: 0 },
  );
  const cost_usd = allAgents.reduce((s, r) => s + r.cost_usd, 0);

  const tag = finalVerdict.verdict === 'PASS' ? ok : finalVerdict.verdict === 'FIXABLE' ? warn : err;
  tag(`verdict: ${finalVerdict.verdict} (confidence ${finalVerdict.confidence.toFixed(2)}, $${cost_usd.toFixed(3)})`);

  // Update last-green / baseline
  if (finalVerdict.verdict === 'PASS') {
    await mkdir(resolve(config.REPORTS_DIR, '.last-green'), { recursive: true });
    await writeFile(
      lastGreenPath,
      JSON.stringify({ layer_results: layerResults, layer_analyses: layerAnalyses }, null, 2),
    );
    if (!baselineMetrics) {
      await mkdir(resolve(config.REPORTS_DIR, '.baseline'), { recursive: true });
      await writeFile(
        baselinePath,
        JSON.stringify({ per_layer_ms: Object.fromEntries(layerResults.map((r) => [r.layer, r.duration_ms])) }, null, 2),
      );
    }
  }

  // Verify → fix → re-verify loop (true autonomous closing of the loop).
  // If the verdict is FIXABLE and AUTO_FIX is enabled and we have not yet
  // hit MAX_LOOP_ATTEMPTS, attempt to apply the auto-applicable fixer
  // proposals via `git apply`. Patches that touch L1 contracts or DB
  // migrations are filtered out by `filterAutoApplicable`. If any patch
  // applies cleanly, recurse to re-verify; if none apply or all are
  // high-risk, exit with the FIXABLE verdict and let a human handle it.
  if (
    finalVerdict.verdict === 'FIXABLE' &&
    config.AUTO_FIX &&
    attempt < MAX_LOOP_ATTEMPTS &&
    fixerProposals.length > 0
  ) {
    const applicable = filterAutoApplicable(fixerProposals);
    if (applicable.length > 0) {
      info(`Auto-fix: applying ${applicable.length} patch(es) and re-verifying (attempt ${attempt} → ${attempt + 1})`);
      const outcomes: ApplyOutcome[] = [];
      let allApplied = true;
      for (const p of applicable) {
        const outcome = await applyPatch(config.REPO_ROOT, p, runDir);
        outcomes.push(outcome);
        if (outcome.status === 'applied') {
          ok(`applied ${p.id} (risk=${p.risk}, files=${p.affected_files.join(',')})`);
        } else {
          err(`rejected ${p.id}: ${outcome.reason}`);
          allApplied = false;
        }
      }
      await writeFile(resolve(runDir, 'apply-outcomes.json'), JSON.stringify(outcomes, null, 2));
      if (allApplied) {
        return runSequence(sequenceId, config, attempt + 1);
      } else {
        warn(`Auto-fix halted: ${outcomes.filter((o) => o.status === 'rejected').length} patch(es) rejected; not recursing`);
      }
    } else {
      info(`Auto-fix: 0 of ${fixerProposals.length} fixer proposals are auto-applicable (all high-risk or sensitive paths)`);
    }
  }

  return {
    sequence: plan.sequence_id,
    started_at: startedAt,
    finished_at: nowIso(),
    duration_ms: Date.now() - startMs,
    plan,
    plan_source: planSource,
    layer_results: layerResults,
    layer_analyses: layerAnalyses,
    quality_findings: qualityFindings,
    fixer_proposals: fixerProposals,
    final_verdict: finalVerdict,
    cost_usd,
    tokens,
  };
}
