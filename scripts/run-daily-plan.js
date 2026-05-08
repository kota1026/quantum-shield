#!/usr/bin/env node
/**
 * Daily Plan Bot — JST 06:30 morning briefing
 *
 * Replaces run-daily-research.js. Instead of dumping signals, this produces a
 * prioritized "today's update plan" for Quantum Shield, with concrete diffs
 * for mechanical P0 items so the workflow can open draft PRs autonomously.
 *
 * Output:
 *   - docs/intelligence/daily-plan/YYYY-MM-DD.md  (briefing markdown)
 *   - /tmp/daily-plan-actions.json                (structured plan for routing)
 *   - GitHub Action outputs: headline, p0_count, has_mechanical_actions
 *
 * Cost target: ~$0.12/day (Sonnet 4.6, ~10k input + ~6k output).
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ANTHROPIC_API_KEY;
const SLACK_URL = process.env.SLACK_WEBHOOK_URL;
const GITHUB_OUTPUT = process.env.GITHUB_OUTPUT;

if (!API_KEY) {
  console.log('ANTHROPIC_API_KEY not set — skipping');
  process.exit(0);
}

// JST date — the workflow runs at UTC 21:30, which is the next day in JST.
const NOW_JST = new Date(Date.now() + 9 * 60 * 60 * 1000);
const DATE = NOW_JST.toISOString().split('T')[0];
const REPORT_DIR = 'docs/intelligence/daily-plan';
const REPORT_PATH = path.join(REPORT_DIR, `${DATE}.md`);
const ACTIONS_PATH = '/tmp/daily-plan-actions.json';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 8192;

// --- Feed sources ---------------------------------------------------------

const FEEDS = [
  { name: 'NIST PQC News',      url: 'https://csrc.nist.gov/news/rss?CategoryId=44' },
  { name: 'Ethereum EIPs',      url: 'https://eips.ethereum.org/all.json' },
  { name: 'arxiv cs.CR',        url: 'http://export.arxiv.org/rss/cs.CR' },
  { name: 'Ethereum Magicians', url: 'https://ethereum-magicians.org/c/eips/13.json' },
];

const COMPETITOR_REPOS = [
  'theQRL/QRL',
  'PQShield/pqshield',
  'starkware-libs/cairo',
];

// --- HTTP helpers ---------------------------------------------------------

function fetchText(url, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'user-agent': 'quantum-shield-daily-plan/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchText(res.headers.location, timeoutMs));
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ ok: res.statusCode === 200, body: data.slice(0, 20000) }));
    });
    req.on('error', () => resolve({ ok: false, body: '' }));
    req.setTimeout(timeoutMs, () => { req.destroy(); resolve({ ok: false, body: '' }); });
  });
}

async function fetchFeeds() {
  const results = [];
  for (const feed of FEEDS) {
    const r = await fetchText(feed.url);
    results.push({ name: feed.name, url: feed.url, ok: r.ok, body: r.body });
  }
  for (const repo of COMPETITOR_REPOS) {
    const r = await fetchText(`https://api.github.com/repos/${repo}/releases?per_page=3`);
    results.push({ name: `GH releases: ${repo}`, url: `https://github.com/${repo}/releases`, ok: r.ok, body: r.body });
  }
  return results;
}

function loadRecentPlans(days = 3) {
  if (!fs.existsSync(REPORT_DIR)) return [];
  const files = fs.readdirSync(REPORT_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
    .sort()
    .reverse()
    .slice(0, days);
  return files.map((f) => ({
    date: f.replace('.md', ''),
    content: fs.readFileSync(path.join(REPORT_DIR, f), 'utf8').slice(0, 4000),
  }));
}

// --- Prompts --------------------------------------------------------------

const SYSTEM_PROMPT = `You are the Daily Plan Bot for Quantum Shield (post-quantum custody on Ethereum Sepolia L1 + Arbitrum-Sepolia L3, NIST FIPS 204 ML-DSA-65 + FIPS 205 SLH-DSA).

Your job each morning (JST 06:30): turn the last 24h of external signals into a PRIORITIZED UPDATE PLAN for today. Produce concrete actions, not abstract observations.

Priority calibration:
  P0 — must do today. Algorithm break, NIST deprecation, EIP merge that affects us, competitor shipping our exact thesis. Or trivial maintenance the bot can ship itself.
  P1 — should do this week. New EIP draft worth analyzing, paper that may inform a feature, competitor signal worth a tracking doc.
  P2 — backlog. Worth recording but no near-term action.

Mechanical detection — set "mechanical": true ONLY when ALL of:
  - Change touches ONLY files under docs/, .github/workflows/ (excluding ci.yml/e2e-tests.yml), .claude/, or scripts/research/
  - Total diff size < 80 lines
  - No new dependencies, no new types, no schema/migration changes
  - No edits to source under src/api/api/, src/frontend/web/, src/contracts/
  - No edits to CLAUDE.md or .claude/settings.json (those need human review)
  - The change is self-evidently correct from the rationale alone

When mechanical=true, you MUST include a unified diff in "diff" that the workflow can apply with \`git apply\`. Use null context lines for new files and full file paths from the repo root.

Hard constraints:
  - NEVER touch L1 contract addresses (those are pinned in .claude/rules/blockchain.md).
  - NEVER add MOCK_/FALLBACK_/DEMO_ patterns.
  - All UI strings via t('key') if you propose frontend edits (but those should be P1+ and non-mechanical).
  - Output ONLY valid JSON inside <json></json> tags. No prose outside.`;

function buildUserPrompt(feeds, recentPlans) {
  const feedSummary = feeds.map((f) => {
    const status = f.ok ? 'OK' : 'FETCH_FAILED';
    const snippet = f.ok ? f.body.replace(/\s+/g, ' ').slice(0, 1500) : '';
    return `### ${f.name} (${status})\n${snippet}`;
  }).join('\n\n');

  const continuity = recentPlans.length === 0
    ? '(no prior daily plans)'
    : recentPlans.map((p) => `### ${p.date}\n${p.content}`).join('\n\n');

  return `Today is ${DATE} (JST). Generate the daily update plan.

## Recent feeds (last fetch)

${feedSummary}

## Last 3 daily plans (continuity context)

${continuity}

## Required JSON schema

\`\`\`
{
  "scan_date": "${DATE}",
  "headline": "<single sentence, max 90 chars, no period>",
  "actions": [
    {
      "priority": "P0" | "P1" | "P2",
      "title": "<short imperative title>",
      "rationale": "<why this matters today, 1-3 sentences>",
      "files": ["<repo-relative paths>"],
      "estimated_effort_min": <integer>,
      "mechanical": <true|false>,
      "branch_suffix": "<kebab-case slug, used for auto-PR branch>",
      "diff": "<unified diff if mechanical=true, else empty string>",
      "follow_up": "<one-line note for human follow-up if any>"
    }
  ],
  "background": [
    { "title": "<...>", "note": "<one-line, no action needed>" }
  ],
  "skipped": [
    { "title": "<...>", "reason": "<one-line>" }
  ],
  "markdown_report": "<full Markdown body for the briefing file>"
}
\`\`\`

Rules:
  - At most 5 actions total. At most 2 P0.
  - If you can't verify a signal occurred in last 24h, downgrade priority and add "verified: false" in the rationale.
  - markdown_report must include sections: Headline / Today's Plan (P0/P1/P2) / Background / Skipped / Sources.
  - If feeds all failed, still produce a plan based on continuity context but cap top priority at P1.

Return ONLY <json>...</json>.`;
}

// --- Anthropic call -------------------------------------------------------

function callAnthropic(systemPrompt, userPrompt) {
  const body = JSON.stringify({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  return new Promise((resolve, reject) => {
    const req = https.request('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(`Anthropic API error: ${parsed.error.message}`));
          const text = parsed.content?.[0]?.text || '';
          resolve(text);
        } catch (err) {
          reject(new Error(`Failed to parse Anthropic response: ${err.message}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function extractJSON(text) {
  const match = text.match(/<json>([\s\S]*?)<\/json>/);
  if (!match) throw new Error('No <json> block in model response');
  return JSON.parse(match[1].trim());
}

// --- Slack ----------------------------------------------------------------

function postSlack(plan) {
  if (!SLACK_URL) return Promise.resolve();
  const p0s = (plan.actions || []).filter((a) => a.priority === 'P0');
  const p0Lines = p0s.length === 0
    ? '_No P0 actions today._'
    : p0s.map((a, i) => `${i + 1}. *${a.title}* — ${a.rationale.split('\n')[0]}`).join('\n');

  const payload = JSON.stringify({
    text: `*Quantum Shield Daily Plan — ${DATE} (JST)*\n${plan.headline}\n\n*P0 today:*\n${p0Lines}`,
  });

  return new Promise((resolve) => {
    const u = new URL(SLACK_URL);
    const req = https.request({
      method: 'POST',
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) },
    }, (res) => { res.on('data', () => {}); res.on('end', resolve); });
    req.on('error', () => resolve());
    req.write(payload);
    req.end();
  });
}

// --- GitHub Action outputs ------------------------------------------------

function writeOutput(name, value) {
  if (!GITHUB_OUTPUT) return;
  fs.appendFileSync(GITHUB_OUTPUT, `${name}=${value}\n`);
}

// --- Main -----------------------------------------------------------------

(async () => {
  try {
    console.log(`[daily-plan] ${DATE} JST — fetching feeds...`);
    const feeds = await fetchFeeds();
    const okCount = feeds.filter((f) => f.ok).length;
    console.log(`[daily-plan] feeds: ${okCount}/${feeds.length} OK`);

    const recentPlans = loadRecentPlans(3);
    console.log(`[daily-plan] continuity context: ${recentPlans.length} prior plans`);

    console.log(`[daily-plan] calling ${MODEL}...`);
    const text = await callAnthropic(SYSTEM_PROMPT, buildUserPrompt(feeds, recentPlans));
    const plan = extractJSON(text);

    if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
    fs.writeFileSync(REPORT_PATH, plan.markdown_report || '');
    fs.writeFileSync(ACTIONS_PATH, JSON.stringify(plan, null, 2));
    console.log(`[daily-plan] wrote ${REPORT_PATH}`);

    const actions = plan.actions || [];
    const p0Count = actions.filter((a) => a.priority === 'P0').length;
    const mechanicalCount = actions.filter((a) => a.mechanical && a.diff).length;

    writeOutput('headline', (plan.headline || '').replace(/\n/g, ' ').slice(0, 200));
    writeOutput('p0_count', p0Count);
    writeOutput('has_mechanical_actions', mechanicalCount > 0 ? 'true' : 'false');
    writeOutput('actions_path', ACTIONS_PATH);
    writeOutput('report_path', REPORT_PATH);
    writeOutput('date', DATE);

    await postSlack(plan);
    console.log(`[daily-plan] done — P0=${p0Count}, mechanical=${mechanicalCount}`);
  } catch (err) {
    console.error(`[daily-plan] FAILED: ${err.message}`);
    process.exit(1);
  }
})();
