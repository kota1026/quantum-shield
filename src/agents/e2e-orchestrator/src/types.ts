import { z } from 'zod';

export const Layer = z.enum(['backend', 'frontend', 'db', 'l1', 'l3']);
export type Layer = z.infer<typeof Layer>;

export const TestStep = z.object({
  layer: Layer,
  description: z.string(),
  command: z.string(),
  expected: z.string().optional(),
});
export type TestStep = z.infer<typeof TestStep>;

export const TestPlan = z.object({
  sequence_id: z.string(),
  sequence_name: z.string(),
  layers: z.array(Layer),
  steps: z.array(TestStep),
  acceptance_criteria: z.array(z.string()),
  spec_section: z.string().optional(),
});
export type TestPlan = z.infer<typeof TestPlan>;

export const LayerResult = z.object({
  layer: Layer,
  status: z.enum(['pass', 'fail', 'partial', 'skipped']),
  exit_code: z.number(),
  duration_ms: z.number(),
  command: z.string(),
  stdout_excerpt: z.string(),
  stderr_excerpt: z.string(),
});
export type LayerResult = z.infer<typeof LayerResult>;

export const LayerAnalysis = z.object({
  layer: Layer,
  status: z.enum(['pass', 'fail', 'partial', 'skipped']),
  observations: z.array(z.string()),
  issues: z.array(
    z.object({
      severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
      title: z.string(),
      detail: z.string(),
      location: z.string().optional(),
    })
  ),
  confidence: z.number().min(0).max(1),
});
export type LayerAnalysis = z.infer<typeof LayerAnalysis>;

export const QualityFinding = z.object({
  source: z.enum(['bug-hunter', 'regression-sentinel', 'performance-monitor']),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
  title: z.string(),
  detail: z.string(),
  evidence: z.array(z.string()),
  suggested_owner: z.enum(['backend', 'frontend', 'contracts', 'spec', 'tests']).optional(),
});
export type QualityFinding = z.infer<typeof QualityFinding>;

export const FixerProposal = z.object({
  id: z.string(),
  title: z.string(),
  rationale: z.string(),
  affected_files: z.array(z.string()),
  unified_diff: z.string(),
  risk: z.enum(['low', 'medium', 'high']),
});
export type FixerProposal = z.infer<typeof FixerProposal>;

export const Verdict = z.enum(['PASS', 'FIXABLE', 'BLOCKED']);
export type Verdict = z.infer<typeof Verdict>;

export const FinalVerdict = z.object({
  verdict: Verdict,
  summary: z.string(),
  must_fix_before_merge: z.array(z.string()),
  fixer_recommendation: z.enum(['apply', 'review_required', 'reject']),
  unresolved_questions: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});
export type FinalVerdict = z.infer<typeof FinalVerdict>;

export type RunReport = {
  sequence: string;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  plan: TestPlan;
  /** Whether Stage 1's spec-runner produced the plan, or the orchestrator fell back to the static binding. */
  plan_source: 'ai' | 'fallback';
  layer_results: LayerResult[];
  layer_analyses: LayerAnalysis[];
  quality_findings: QualityFinding[];
  fixer_proposals: FixerProposal[];
  final_verdict: FinalVerdict;
  cost_usd: number;
  tokens: {
    input: number;
    cached_input: number;
    output: number;
  };
};
