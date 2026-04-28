import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { RouteSpec } from './types.js';

const ROUTES_FILE = 'src/frontend/web/e2e/visual-regression/routes.ts';

/**
 * Load the canonical UX route registry. Reads
 * `src/frontend/web/e2e/visual-regression/routes.ts` (a TS source file with
 * the `REGRESSION_ROUTES` export from PR #141) and parses out the route
 * literals via a tolerant text scan — we deliberately do not import the TS
 * file because that would require building it.
 *
 * If the format diverges, this throws clearly rather than silently using a
 * stale list.
 */
export async function loadRoutes(repoRoot: string): Promise<RouteSpec[]> {
  const path = resolve(repoRoot, ROUTES_FILE);
  const src = await readFile(path, 'utf8');

  const block = src.match(/export const REGRESSION_ROUTES[\s\S]*?\];/);
  if (!block) throw new Error(`Could not find REGRESSION_ROUTES in ${ROUTES_FILE}`);

  const out: RouteSpec[] = [];
  const objectLiterals = block[0].matchAll(/\{[^{}]*\}/g);
  for (const m of objectLiterals) {
    const obj = m[0];
    const id = obj.match(/id:\s*'([^']+)'/)?.[1];
    const label = obj.match(/label:\s*'([^']+)'/)?.[1];
    const path = obj.match(/path:\s*'([^']+)'/)?.[1];
    const app = obj.match(/app:\s*'([^']+)'/)?.[1];
    const viewportsRaw = obj.match(/viewports:\s*\[([^\]]+)\]/)?.[1] ?? '';
    const viewports = Array.from(viewportsRaw.matchAll(/'(desktop|tablet|mobile)'/g)).map((v) => v[1]);
    const waitFor = obj.match(/waitFor:\s*'([^']+)'/)?.[1];
    const waitForTestId = obj.match(/waitForTestId:\s*'([^']+)'/)?.[1];

    if (!id || !label || !path || !app || viewports.length === 0) continue;

    out.push({
      id,
      label,
      path,
      app,
      viewports: viewports as RouteSpec['viewports'],
      waitFor,
      waitForTestId,
    });
  }

  if (out.length === 0) {
    throw new Error(`Parsed 0 routes from ${ROUTES_FILE} — registry format may have changed`);
  }
  return out;
}

export function listRouteIds(routes: RouteSpec[]): string[] {
  return routes.map((r) => r.id);
}

export function getRoute(routes: RouteSpec[], id: string): RouteSpec {
  const r = routes.find((r) => r.id === id);
  if (!r) throw new Error(`Unknown route "${id}". Known: ${listRouteIds(routes).join(', ')}`);
  return r;
}
