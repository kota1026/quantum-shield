/**
 * Routes captured by the UX regression hunter.
 *
 * Each entry is a public, server-rendered page that can load without
 * an authenticated wallet. Auth-gated flows are excluded from the
 * vision-diff pass to keep the pipeline deterministic — those are
 * covered by the existing functional E2E suites.
 *
 * Add a route here when:
 * 1. It is reachable without wallet/SIWE auth, OR
 * 2. A test fixture stubs the auth state via storageState
 *
 * Removing or renaming a route here is a contract change for the
 * baseline corpus — re-run `pnpm ux:baseline` afterwards.
 */

export interface RegressionRoute {
  /** Stable identifier — used as filename for baselines + diffs. */
  id: string;
  /** Human label shown in the report. */
  label: string;
  /** Path under baseURL (must start with /). */
  path: string;
  /** Viewports to capture. */
  viewports: Array<'desktop' | 'tablet' | 'mobile'>;
  /** Optional CSS selector to wait for before snapshot. */
  waitFor?: string;
  /** Optional data-testid to wait for. */
  waitForTestId?: string;
  /** Domain — used to group the report. */
  app: 'consumer' | 'prover' | 'observer' | 'governance' | 'explorer' | 'token-hub' | 'admin' | 'marketing';
}

export const REGRESSION_ROUTES: RegressionRoute[] = [
  // Marketing / public
  { id: 'home-ja', label: 'Home (JA)', path: '/ja', viewports: ['desktop', 'mobile'], app: 'marketing' },
  { id: 'home-en', label: 'Home (EN)', path: '/en', viewports: ['desktop', 'mobile'], app: 'marketing' },

  // Consumer
  { id: 'consumer-lock', label: 'Consumer Lock', path: '/ja/consumer/lock', viewports: ['desktop', 'mobile'], app: 'consumer', waitForTestId: 'lock-form' },
  { id: 'consumer-unlock', label: 'Consumer Unlock', path: '/ja/consumer/unlock', viewports: ['desktop', 'mobile'], app: 'consumer' },
  { id: 'consumer-emergency', label: 'Consumer Emergency', path: '/ja/consumer/emergency', viewports: ['desktop'], app: 'consumer' },

  // Explorer (public, data-driven — high regression risk)
  { id: 'explorer-overview', label: 'Explorer Overview', path: '/ja/explorer', viewports: ['desktop', 'mobile'], app: 'explorer' },
  { id: 'explorer-locks', label: 'Explorer Locks', path: '/ja/explorer/locks', viewports: ['desktop'], app: 'explorer' },
  { id: 'explorer-provers', label: 'Explorer Provers', path: '/ja/explorer/provers', viewports: ['desktop'], app: 'explorer' },

  // Prover / Observer landing
  { id: 'prover-dashboard', label: 'Prover Dashboard', path: '/ja/prover', viewports: ['desktop'], app: 'prover' },
  { id: 'observer-dashboard', label: 'Observer Dashboard', path: '/ja/observer', viewports: ['desktop'], app: 'observer' },

  // Governance + Token Hub (data-heavy UIs prone to layout drift)
  { id: 'governance-proposals', label: 'Governance Proposals', path: '/ja/governance', viewports: ['desktop', 'mobile'], app: 'governance' },
  { id: 'token-hub', label: 'Token Hub (veQS)', path: '/ja/token-hub', viewports: ['desktop', 'mobile'], app: 'token-hub' },
];

export const VIEWPORT_SIZES = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 1024, height: 768 },
  mobile: { width: 390, height: 844 },
} as const;
