#!/usr/bin/env node
import kleur from 'kleur';
import { resolve } from 'node:path';
import { loadConfig } from './config.js';
import { listSequences } from './spec-loader.js';
import { runSequence } from './orchestrator.js';
import { writeReport } from './reporter.js';

type CliArgs = {
  sequence: string;
  autoFix: boolean;
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { sequence: '', autoFix: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--sequence' || a === '-s') {
      args.sequence = argv[++i] ?? '';
    } else if (a === '--auto-fix') {
      args.autoFix = true;
    } else if (a === '--help' || a === '-h') {
      printHelp();
      process.exit(0);
    }
  }
  return args;
}

function printHelp(): void {
  console.log(`Quantum Shield E2E Orchestrator

Usage:
  qs-e2e --sequence <name> [--auto-fix]

Options:
  --sequence, -s   Sequence to verify. Use "all" to run every known sequence.
  --auto-fix       Apply fixer-proposed patches when verdict is FIXABLE (low/medium risk only).

Known sequences:
  ${listSequences().join(', ')}

Environment:
  ANTHROPIC_API_KEY   (required)
  DATABASE_URL        (default: postgresql://quantum:quantum_dev@localhost:5432/quantum_shield)
  L1_RPC_URL          (default: https://rpc.sepolia.org)
  L3_RPC_URL          (default: http://localhost:8545)
`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  if (!args.sequence) {
    printHelp();
    process.exit(2);
  }

  const config = loadConfig({ AUTO_FIX: args.autoFix ? 'true' : 'false' });
  config.REPORTS_DIR = resolve(config.REPO_ROOT, config.REPORTS_DIR);

  const sequences = args.sequence === 'all' ? listSequences() : [args.sequence];
  let anyFailure = false;

  for (const seq of sequences) {
    console.log(kleur.bold().magenta(`\n=== ${seq} ===`));
    try {
      const report = await runSequence(seq, config);
      const reportDir = resolve(config.REPORTS_DIR, `${seq}-${report.started_at.replace(/[:.]/g, '-')}`);
      const mdPath = await writeReport(reportDir, report);
      console.log(kleur.gray(`  report: ${mdPath}`));
      if (report.final_verdict.verdict !== 'PASS') anyFailure = true;
    } catch (e) {
      console.error(kleur.red(`fatal: sequence "${seq}" — ${(e as Error).message}`));
      anyFailure = true;
    }
  }

  process.exit(anyFailure ? 1 : 0);
}

main().catch((e) => {
  console.error(kleur.red('fatal:'), e);
  process.exit(1);
});
