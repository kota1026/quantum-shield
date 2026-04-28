#!/usr/bin/env node
import kleur from 'kleur';
import { resolve } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { loadConfig } from './config.js';
import { loadRoutes, getRoute, listRouteIds } from './route-loader.js';
import { runRoute } from './orchestrator.js';

type CliArgs = { route: string; autoFix: boolean };

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { route: '', autoFix: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--route' || a === '-r') args.route = argv[++i] ?? '';
    else if (a === '--auto-fix') args.autoFix = true;
    else if (a === '--help' || a === '-h') { printHelp(); process.exit(0); }
  }
  return args;
}

async function printHelp(): Promise<void> {
  let routeIds: string[] = [];
  try {
    const routes = await loadRoutes(process.cwd());
    routeIds = listRouteIds(routes);
  } catch { /* ignore */ }
  console.log(`Quantum Shield UX Orchestrator

Usage:
  qs-ux --route <id|all> [--auto-fix]

Options:
  --route, -r   Route id from src/frontend/web/e2e/visual-regression/routes.ts, or "all"
  --auto-fix    Apply healer-proposed test/registry/i18n patches when judge=regression and risk=low|medium

Known routes:
  ${routeIds.length > 0 ? routeIds.join(', ') : '(could not load — run from repo root)'}

Environment:
  ANTHROPIC_API_KEY   (required)
  QS_BASE_URL         (default: http://localhost:3000)
`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  if (!args.route) { await printHelp(); process.exit(2); }

  const config = loadConfig({ AUTO_FIX: args.autoFix ? 'true' : 'false' });
  config.REPORTS_DIR = resolve(config.REPO_ROOT, config.REPORTS_DIR);

  const allRoutes = await loadRoutes(config.REPO_ROOT);
  const targets = args.route === 'all' ? allRoutes : [getRoute(allRoutes, args.route)];

  let anyRegression = false;
  for (const route of targets) {
    console.log(kleur.bold().magenta(`\n=== ${route.id} ===`));
    try {
      const report = await runRoute(route, config);
      const reportDir = resolve(config.REPORTS_DIR, `${route.id}-${report.started_at.replace(/[:.]/g, '-')}`);
      await mkdir(reportDir, { recursive: true });
      await writeFile(resolve(reportDir, 'report.json'), JSON.stringify(report, null, 2));
      console.log(kleur.gray(`  report: ${reportDir}/report.json`));
      if (report.judge.verdict === 'regression' || report.judge.verdict === 'broken') anyRegression = true;
    } catch (e) {
      console.error(kleur.red(`fatal: route "${route.id}" — ${(e as Error).message}`));
      anyRegression = true;
    }
  }
  process.exit(anyRegression ? 1 : 0);
}

main().catch((e) => { console.error(kleur.red('fatal:'), e); process.exit(1); });
