import { z } from 'zod';

export const Viewport = z.enum(['desktop', 'tablet', 'mobile']);
export type Viewport = z.infer<typeof Viewport>;

export const RouteSpec = z.object({
  id: z.string(),
  label: z.string(),
  path: z.string(),
  viewports: z.array(Viewport),
  app: z.string(),
  waitFor: z.string().optional(),
  waitForTestId: z.string().optional(),
});
export type RouteSpec = z.infer<typeof RouteSpec>;

export const Verdict = z.enum(['none', 'cosmetic', 'regression', 'broken', 'unresolved']);
export type Verdict = z.infer<typeof Verdict>;

export const Severity = z.enum(['critical', 'high', 'medium', 'low', 'info']);
export type Severity = z.infer<typeof Severity>;

export const Concern = z.enum(['visual', 'accessibility', 'copy', 'performance']);
export type Concern = z.infer<typeof Concern>;

export const TestPlan = z.object({
  route_id: z.string(),
  route_label: z.string(),
  path: z.string(),
  viewports: z.array(Viewport),
  locales: z.array(z.string()),
  acceptance_criteria: z.array(z.string()),
});
export type TestPlan = z.infer<typeof TestPlan>;

export const CaptureResult = z.object({
  viewport: Viewport,
  screenshot_path: z.string(),
  baseline_path: z.string().nullable(),
  a11y_tree_path: z.string(),
  copy_snapshot_path: z.string(),
  perf_metrics: z.object({
    lcp_ms: z.number().nullable(),
    cls: z.number().nullable(),
    inp_ms: z.number().nullable(),
    tbt_ms: z.number().nullable(),
  }),
  pixel_hash_match: z.boolean().nullable(),
  load_status: z.enum(['ok', 'timeout', 'http_error', 'csp_blocked', 'skipped']),
});
export type CaptureResult = z.infer<typeof CaptureResult>;

export const ReviewerFinding = z.object({
  severity: Severity,
  concern: Concern,
  title: z.string(),
  detail: z.string(),
  evidence: z.array(z.string()),
  suggested_owner: z.enum(['component', 'test', 'translation', 'design', 'infra']).optional(),
});
export type ReviewerFinding = z.infer<typeof ReviewerFinding>;

export const ReviewerOutput = z.object({
  reviewer: Concern,
  status: z.enum(['pass', 'concern', 'fail', 'skipped']),
  findings: z.array(ReviewerFinding),
  confidence: z.number().min(0).max(1),
});
export type ReviewerOutput = z.infer<typeof ReviewerOutput>;

export const JudgeVerdict = z.object({
  verdict: Verdict,
  summary: z.string(),
  must_fix_before_ship: z.array(z.string()),
  designer_review_required: z.boolean(),
  unresolved_questions: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});
export type JudgeVerdict = z.infer<typeof JudgeVerdict>;

export const HealerProposal = z.object({
  id: z.string(),
  title: z.string(),
  rationale: z.string(),
  target: z.enum(['test_code', 'route_registry', 'i18n_catalog']),
  affected_files: z.array(z.string()),
  unified_diff: z.string(),
  risk: z.enum(['low', 'medium', 'high']),
});
export type HealerProposal = z.infer<typeof HealerProposal>;

export type RunReport = {
  route_id: string;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  plan: TestPlan;
  plan_source: 'ai' | 'fallback';
  captures: CaptureResult[];
  reviews: ReviewerOutput[];
  judge: JudgeVerdict;
  healer_proposals: HealerProposal[];
  final_verifier_status: 'pass' | 'regressed' | 'skipped';
  cost_usd: number;
  tokens: { input: number; cached_input: number; output: number };
};
