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

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const OAUTH_TOKEN = process.env.CLAUDE_CODE_OAUTH_TOKEN;
const API_KEY = process.env.ANTHROPIC_API_KEY;
const SLACK_URL = process.env.SLACK_WEBHOOK_URL;
const GITHUB_OUTPUT = process.env.GITHUB_OUTPUT;

if (!OAUTH_TOKEN && !API_KEY) {
  console.log('Neither CLAUDE_CODE_OAUTH_TOKEN nor ANTHROPIC_API_KEY set — skipping');
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
//
// Tier A intel — 7 strategic axes covering the surface Quantum Shield
// strategy can act on. Each entry carries an `axis` tag so the model can
// score signals along the right dimension and prioritise multi-axis hits
// (e.g. a "B + E" signal = a paying customer with grant money attached).
//
//   A — Quantum threat timeline (logical-qubit roadmaps, NSA/NIST deadlines)
//   B — Demand signals (who already runs PQC in production)
//   C — Competitors / alternatives (pure-PQC plays + MPC/TSS narrative)
//   D — Standards & regulation (IETF / ISO / ETSI / national agencies)
//   E — Funding & grants (EF ESP, OP RPGF, Arbitrum, Gitcoin, gov funds)
//   F — Tech adjacency (ZK / AA / threshold / HSM / libs)
//   G — Geopolitics & commercial (China BSN, Japan-specific, QKD vs PQC)

const FEEDS = [
  // A. Quantum threat timeline
  { axis: 'A', name: 'NIST PQC News',          url: 'https://csrc.nist.gov/news/rss?CategoryId=44' },
  { axis: 'A', name: 'IBM Research blog',      url: 'https://research.ibm.com/blog/feed' },
  { axis: 'A', name: 'Google Research blog',   url: 'https://blog.research.google/feeds/posts/default' },

  // B. Demand signals (production PQC + major customers)
  { axis: 'B', name: 'Cloudflare blog',        url: 'https://blog.cloudflare.com/rss/' },
  { axis: 'B', name: 'Apple Security blog',    url: 'https://security.apple.com/blog/atom.xml' },
  { axis: 'B', name: 'Signal blog',            url: 'https://signal.org/blog/rss.xml' },
  { axis: 'B', name: 'Chainlink blog',         url: 'https://blog.chain.link/rss/' },
  { axis: 'B', name: 'AWS Security blog',      url: 'https://aws.amazon.com/blogs/security/feed/' },

  // C. Competitors & alternatives
  { axis: 'C', name: 'SandboxAQ blog',         url: 'https://www.sandboxaq.com/blog/rss' },
  { axis: 'C', name: 'PQShield blog',          url: 'https://pqshield.com/blog/feed' },
  { axis: 'C', name: 'Ledger blog',            url: 'https://www.ledger.com/blog/rss' },
  { axis: 'C', name: 'Fireblocks blog',        url: 'https://www.fireblocks.com/blog/rss' },

  // D. Standards & regulation
  { axis: 'D', name: 'IETF datatracker',       url: 'https://datatracker.ietf.org/feed/recent' },
  { axis: 'D', name: 'ENISA news',             url: 'https://www.enisa.europa.eu/news/atom' },
  { axis: 'D', name: 'Ethereum EIPs',          url: 'https://eips.ethereum.org/all.json' },
  { axis: 'D', name: 'Ethereum Magicians',     url: 'https://ethereum-magicians.org/c/eips/13.json' },

  // E. Funding & grants
  { axis: 'E', name: 'Ethereum Foundation blog', url: 'https://blog.ethereum.org/feed.xml' },
  { axis: 'E', name: 'Optimism blog',          url: 'https://medium.com/feed/optimismpbc' },
  { axis: 'E', name: 'Gitcoin blog',           url: 'https://gitcoin.co/blog/feed/' },

  // F. Tech adjacency (ZK / AA / libs)
  { axis: 'F', name: 'StarkWare blog',         url: 'https://www.starkware.co/feed/' },
  { axis: 'F', name: 'RISC Zero blog',         url: 'https://www.risczero.com/blog/feed' },
  { axis: 'F', name: '0xPARC blog',            url: 'https://blog.0xparc.org/atom.xml' },
  { axis: 'F', name: 'liboqs releases',        url: 'https://github.com/open-quantum-safe/liboqs/releases.atom' },
  { axis: 'F', name: 'arxiv cs.CR',            url: 'https://export.arxiv.org/rss/cs.CR' },

  // G. Geopolitics / commercial / Japan
  { axis: 'G', name: 'NEC R&D',                url: 'https://www.nec.com/en/global/rd/feed/index.atom' },
  { axis: 'G', name: 'Vitalik blog',           url: 'https://vitalik.eth.limo/feed.xml' },
  // Agentic-ops meta-knowledge sources (Japanese Claude Code community).
  // X has no native RSS — use RSSHub mirror, which is fragile but cheap to
  // try. Blog feed is the stable backup. Either failing degrades to
  // FETCH_FAILED in the briefing without breaking the run.
  { axis: 'G', name: '東大Claude Code研究所 (X via RSSHub)', url: 'https://rsshub.app/twitter/user/ClaudeCode_UT' },
  { axis: 'G', name: 'Claude Code研究所 blog',  url: 'https://www.claude-code-lab.com/feed' },
];

const COMPETITOR_REPOS = [
  { axis: 'C', repo: 'theQRL/QRL' },
  // Note: 'PQShield/pqshield' (the namesake repo) is not a public GitHub
  // repo as of W19 2026 — every fetch returns 404. PQShield's public code
  // lives under domain-named repos (e.g. open implementations contributed
  // upstream rather than under a `pqshield` org repo). Tracking competitor
  // signal is now done via the PQShield blog feed in FEEDS above. If a
  // public release-tracking repo materializes, add it back here.
  { axis: 'F', repo: 'starkware-libs/cairo' },
];

// --- HTTP helpers ---------------------------------------------------------

// W19.5 fix (2026-05-09): inaugural run had 5/7 priority feeds FETCH_FAILED.
// Root causes: NIST/Cloudflare/Discourse reject the bare bot UA; api.github.com
// rate-limits unauthenticated runner IPs; and the previous helper collapsed
// every error class into FETCH_FAILED, masking 403 vs 404 vs TIMEOUT.
//
// Changes:
//   - browser-shaped User-Agent + Accept header
//   - Authorization: token <GITHUB_TOKEN> for *.github.com when env var present
//   - single retry with 1s sleep on network error / 5xx
//   - return { ok, body, status } so the briefing can render concrete codes

function fetchText(url, timeoutMs = 10000, redirectsLeft = 3, retriesLeft = 1) {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return resolve({ ok: false, body: '', status: 'INVALID_URL' });
    }
    const client = parsed.protocol === 'http:' ? http : https;
    const headers = {
      'user-agent': 'Mozilla/5.0 (compatible; quantum-shield-daily-plan/1.1; +https://github.com/kota1026/quantum-shield)',
      'accept': 'application/json, application/rss+xml, application/atom+xml, text/xml, text/html;q=0.9, */*;q=0.5',
      'accept-language': 'en-US,en;q=0.9',
    };
    if (parsed.host.endsWith('github.com') && process.env.GITHUB_TOKEN) {
      headers.authorization = `token ${process.env.GITHUB_TOKEN}`;
    }

    const retryOrFail = (status) => {
      if (retriesLeft > 0) {
        setTimeout(() => {
          fetchText(url, timeoutMs, redirectsLeft, retriesLeft - 1).then(resolve);
        }, 1000);
      } else {
        resolve({ ok: false, body: '', status });
      }
    };

    const req = client.get(url, { headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirectsLeft > 0) {
        const next = new URL(res.headers.location, url).toString();
        return resolve(fetchText(next, timeoutMs, redirectsLeft - 1, retriesLeft));
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ ok: true, body: data.slice(0, 20000), status: 'HTTP 200' });
        } else if (res.statusCode >= 500) {
          retryOrFail(`HTTP ${res.statusCode}`);
        } else {
          resolve({ ok: false, body: '', status: `HTTP ${res.statusCode}` });
        }
      });
    });
    req.on('error', () => retryOrFail('NETWORK_ERROR'));
    req.setTimeout(timeoutMs, () => { req.destroy(); retryOrFail('TIMEOUT'); });
  });
}

async function fetchFeeds() {
  const results = [];
  for (const feed of FEEDS) {
    const r = await fetchText(feed.url);
    results.push({ axis: feed.axis, name: feed.name, url: feed.url, ok: r.ok, body: r.body, status: r.status });
  }
  for (const entry of COMPETITOR_REPOS) {
    const url = `https://api.github.com/repos/${entry.repo}/releases?per_page=3`;
    const r = await fetchText(url);
    results.push({
      axis: entry.axis,
      name: `GH releases: ${entry.repo}`,
      url: `https://github.com/${entry.repo}/releases`,
      ok: r.ok,
      body: r.body,
      status: r.status,
    });
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

The intelligence space is organized into 7 strategic axes. Each feed is tagged with one. A signal that touches MULTIPLE axes is more important than a single-axis signal of the same magnitude (e.g. B+E = a customer with grant money attached; A+D = a quantum-hardware milestone that triggers a regulatory deadline).

  A. Quantum threat timeline — when will hardware reach cryptographic break? IBM/Google/Quantinuum/IonQ logical-qubit roadmaps, fault-tolerance milestones, NSA CNSA 2.0 / NIST migration deadlines.
  B. Demand signals — who already runs PQC in production or has stated migration plans? Apple iMessage PQ3, Signal PQXDH, Cloudflare PQ TLS, AWS, major financials (Circle, BIS, SWIFT, Visa), defense, healthcare, infra (Chainlink, LayerZero, EigenLayer).
  C. Competitors / alternatives — pure-PQC plays (QRL, SandboxAQ, PQShield, evolutionQ, Quantinuum), MPC/TSS as alternative narrative (Coinbase Custody, Fireblocks, Cubist), PQC-claiming wallets/custody (Ledger, BitGo, Anchorage), PQC-friendly chains (Algorand, Mina, Aleo, IOTA).
  D. Standards & regulation — IETF PQC TLS/SSH/X.509 drafts, ISO/IEC JTC1 SC27, ETSI QSC, US OMB M-23-02 + DOD CMMC 2.0, EU DORA / MiCA, Japan NISC / FSA / NICT / METI / JCMVP, BSI/ENISA migration roadmaps, IEEE 1363, W3C VC + PQC.
  E. Funding & grants — EF ESP, Optimism RetroPGF, Arbitrum Foundation, Stellar Community Fund, Gitcoin GG/GR rounds, ETHGlobal hackathon themes, DARPA / DIU / NSF SaTC / DOE-ASCR, Japan JST CREST / NEDO / JSPS, VC (a16z crypto, Paradigm, Variant, SBI, JIC).
  F. Tech adjacency — ZK + PQC convergence (RISC Zero, SP1, StarkWare, 0xPARC, Mina, Aleo), Account Abstraction + PQ sig aggregation, threshold-PQ schemes (FROST successors), HSM PQC vendors (Thales, Utimaco, AWS CloudHSM), PQC libraries (liboqs, pqcrystals, BouncyCastle), ZKVM PQC.
  G. Geopolitics / commercial / Japan — China BSN + SM2 successor strategy, Japanese national PQC programs (NEC, Toshiba, NTT, NICT, Fujitsu), QKD vs PQC narrative (Toshiba, ID Quantique), defense contractors (Lockheed, Raytheon, Booz Allen) PQC programs, DAO PQC voting, custody insurance pricing.

Each action you propose MUST be tagged with one or more axes. Prioritize multi-axis convergences.

Priority calibration:
  P0 — must do today. Algorithm break, NIST deprecation, EIP merge that affects us, competitor shipping our exact thesis, customer-imminent grant deadline. Or trivial maintenance the bot can ship itself.
  P1 — should do this week. New EIP draft worth analyzing, paper that may inform a feature, competitor signal worth a tracking doc, grant RFP open.
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
  // Group feeds by axis so the model sees the structure, not just a flat dump.
  const byAxis = {};
  for (const f of feeds) {
    const k = f.axis || '?';
    if (!byAxis[k]) byAxis[k] = [];
    byAxis[k].push(f);
  }

  const orderedAxes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', '?'];
  const feedSummary = orderedAxes
    .filter((ax) => byAxis[ax])
    .map((ax) => {
      const items = byAxis[ax].map((f) => {
        // f.status is concrete ("HTTP 403", "TIMEOUT", "NETWORK_ERROR", "HTTP 200")
        // when emitted by the v1.1 fetcher; older runs may lack it.
        const status = f.ok ? 'OK' : (f.status ? `FETCH_FAILED ${f.status}` : 'FETCH_FAILED');
        const snippet = f.ok ? f.body.replace(/\s+/g, ' ').slice(0, 1200) : '';
        return `#### ${f.name} (${status})\n${snippet}`;
      }).join('\n\n');
      return `### Axis ${ax}\n\n${items}`;
    }).join('\n\n');

  const continuity = recentPlans.length === 0
    ? '(no prior daily plans)'
    : recentPlans.map((p) => `### ${p.date}\n${p.content}`).join('\n\n');

  return `Today is ${DATE} (JST). Generate the daily update plan.

## Recent feeds (last fetch, grouped by axis)

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
      "axes": ["A" | "B" | "C" | "D" | "E" | "F" | "G", ...],
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
    { "axes": ["..."], "title": "<...>", "note": "<one-line, no action needed>" }
  ],
  "skipped": [
    { "axes": ["..."], "title": "<...>", "reason": "<one-line>" }
  ],
  "markdown_report": "<full Markdown body for the briefing file. MUST include sections: Headline / Today's Plan (P0/P1/P2 with axis tags) / By Axis (A-G summary) / Background / Skipped / Sources>"
}
\`\`\`

Rules:
  - At most 5 actions total. At most 2 P0.
  - If you can't verify a signal occurred in last 24h, downgrade priority and add "verified: false" in the rationale.
  - markdown_report must include sections: Headline / Today's Plan (P0/P1/P2) / Background / Skipped / Sources.
  - If feeds all failed, still produce a plan based on continuity context but cap top priority at P1.

Return ONLY <json>...</json>.`;
}

// --- Claude calls ---------------------------------------------------------
// Two auth paths:
//   1. OAuth (preferred) — `claude` CLI authenticated via CLAUDE_CODE_OAUTH_TOKEN
//      consumes Pro/Max subscription quota; no per-token billing.
//   2. API key (fallback) — direct https.request to api.anthropic.com,
//      billed against ANTHROPIC_API_KEY's credit balance.
//
// Daily-plan tries OAuth first. If OAuth fails (rate limit, token expired,
// CLI not installed) AND ANTHROPIC_API_KEY is set, retry via API. This
// removes the single-vendor kill switch on the cron pipeline (W19 decision
// #5, Devil's Advocate concern).

const { spawnSync } = require('child_process');

function callClaudeCLI(systemPrompt, userPrompt) {
  const fullPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;
  const result = spawnSync(
    'claude',
    ['--print', '--model', MODEL],
    {
      input: fullPrompt,
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
      env: process.env,
    },
  );
  if (result.error) {
    throw new Error(`claude CLI spawn failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const stderr = (result.stderr || '').slice(0, 800);
    const stdout = (result.stdout || '').slice(0, 200);
    throw new Error(`claude CLI exit ${result.status}: ${stderr || stdout || 'no output'}`);
  }
  return result.stdout;
}

function callClaudeAPI(systemPrompt, userPrompt) {
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
          if (parsed.error) {
            return reject(new Error(`Anthropic API error: ${parsed.error.message}`));
          }
          const text = parsed.content?.[0]?.text || '';
          resolve(text);
        } catch (err) {
          reject(new Error(`Failed to parse Anthropic response: ${err.message}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(new Error('API request timeout')); });
    req.write(body);
    req.end();
  });
}

async function callClaude(systemPrompt, userPrompt) {
  if (OAUTH_TOKEN) {
    try {
      console.log('[daily-plan] auth path: OAuth (claude CLI)');
      return callClaudeCLI(systemPrompt, userPrompt);
    } catch (err) {
      if (API_KEY) {
        console.warn(`[daily-plan] OAuth path failed (${err.message}); falling back to API key.`);
        return await callClaudeAPI(systemPrompt, userPrompt);
      }
      throw err;
    }
  }
  console.log('[daily-plan] auth path: API key (no OAuth token)');
  return await callClaudeAPI(systemPrompt, userPrompt);
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
    const text = await callClaude(SYSTEM_PROMPT, buildUserPrompt(feeds, recentPlans));
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
