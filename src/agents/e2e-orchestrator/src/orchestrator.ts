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

export async function runSequence(sequenceId: string, config: Config): Promise<RunReport> {
  const startedAt = nowIso();
  const startMs = Date.now();
  const runDir = resolve(config.REPORTS_DIR, `${sequenceId}-${ts()}`);
  await mkdir(runDir, { recursive: true });

  info(`Sequence: ${sequenceId}`);
  info(`Run dir:  ${runDir}`);

  // Stage 1: spec-runner
  info('Stage 1: spec-runner — loading SEQUENCES.md and producing test plan');
  const binding = getSequenceBinding(sequenceId);
  const baseline = bindingToPlan(binding);
  let plan: TestPlan = baseline;
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
    const parsed = TestPlan.safeParse(planAgent.parsed_json);
    if (parsed.success) {
      plan = parsed.data;
      ok(`spec-runner produced plan with ${plan.steps.length} steps across ${plan.layers.length} layers`);
    } else {
      warn(`spec-runner output didn't match schema, using binding fallback (${parsed.error.issues.length} issues)`);
    }
  } catch (e) {
    warn(`spec-runner failed (${(e as Error).message}); using binding fallback`);
  }
  await writeFile(resolve(runDir, 'plan.json'), JSON.stringify(plan, null, 2));

  // Stage 2: parallel layer execution + parallel layer analysis
  info(`Stage 2: executing ${plan.steps.length} layer commands in parallel`);
  const layerResults: LayerResult[] = await Promise.all(
    plan.steps.map((step) =>
      runStep(
        step,
        config.REPO_ROOT,
        {
          DATABASE_URL: config.DATABASE_URL,
          L1_RPC_URL: config.L1_RPC_URL,
          L3_RPC_URL: config.L3_RPC_URL,
        },
        runDir,
      ),
    ),
  );
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
  const layerAnalyses: LayerAnalysis[] = analyzerResults.map((r): LayerAnalysis => {
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
  const lastGreen = existsSync(lastGreenPath) ? JSON.parse(await readFile(lastGreenPath, 'utf8')) : null;
  const baselineMetrics = existsSync(baselinePath) ? JSON.parse(await readFile(baselinePath, 'utf8')) : null;

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
  const qualityFindings: QualityFinding[] = qualityResults.flatMap((r) => {
    const arr = Array.isArray(r.parsed_json) ? r.parsed_json : [];
    return arr as QualityFinding[];
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

  const fixerProposals: FixerProposal[] = (Array.isArray(stage4[0]?.parsed_json) ? stage4[0]!.parsed_json : []) as FixerProposal[];
  const verdictRaw = (stage4[1]?.parsed_json ?? {}) as Partial<FinalVerdict>;
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

  return {
    sequence: plan.sequence_id,
    started_at: startedAt,
    finished_at: nowIso(),
    duration_ms: Date.now() - startMs,
    plan,
    layer_results: layerResults,
    layer_analyses: layerAnalyses,
    quality_findings: qualityFindings,
    fixer_proposals: fixerProposals,
    final_verdict: finalVerdict,
    cost_usd,
    tokens,
  };
}
