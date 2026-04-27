/**
 * Daily PQC Research Bot
 *
 * Runs Claude Haiku 4.5 once per day to scan the PQC + Ethereum landscape
 * and produce a structured signal-only report. The output is:
 *   1. A Markdown report at docs/intelligence/daily/YYYY-MM-DD.md
 *   2. GitHub Action outputs (significance_score, issue_title, issue_body_file)
 *      consumed by the workflow to decide whether to open an Issue.
 *
 * Cost target: < $0.05 per run (Haiku 4.5, ~3k input + ~2k output tokens).
 *
 * The bot is intentionally narrow:
 *   - Only flags signals that are NEW within the last 24 hours
 *   - Forces JSON-structured output for machine parsing
 *   - Free-form prose lives only in the Markdown report
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ANTHROPIC_API_KEY;
const SLACK_URL = process.env.SLACK_WEBHOOK_URL;
const GITHUB_OUTPUT = process.env.GITHUB_OUTPUT;
const FORCE_ISSUE = process.env.FORCE_ISSUE === 'true';

if (!API_KEY) {
  console.log('ANTHROPIC_API_KEY not set — skipping');
  process.exit(0);
}

const DATE = new Date().toISOString().split('T')[0];
const REPORT_DIR = 'docs/intelligence/daily';
const REPORT_PATH = path.join(REPORT_DIR, `${DATE}.md`);
const ISSUE_BODY_PATH = path.join('/tmp', `daily-issue-${DATE}.md`);

const SYSTEM_PROMPT = `You are the Daily Intelligence Bot for Quantum Shield, a post-quantum custody protocol on Ethereum (Sepolia L1 + Arbitrum-Sepolia L3) using NIST FIPS 204 ML-DSA-65 and FIPS 205 SLH-DSA (SPHINCS+).

Your job each day:
1. Identify NEW signals from the last 24 hours that materially affect Quantum Shield's strategy or implementation.
2. Score each signal's significance for OUR specific protocol (1-10 scale, calibrated below).
3. Output a single overall significance score AND structured fields the harness can route into GitHub Issues.

Significance scale (calibrated for Quantum Shield):
  1-3: Background noise. Mildly interesting but no action needed.
  4-6: Informational. Worth recording in the daily log; no Issue.
  7-8: Action recommended. New EIP, NIST update, competitor launch, or paper that should become a tracked Issue.
  9:   Strategic shift. Consider feature reprioritization, possibly partnership/grant angle.
  10:  Pivot trigger. Algorithm break, EF mandates a different scheme, or a competitor ships our exact thesis.

Focus areas (in priority order):
  A. Ethereum PQC (EIPs, EF Post-Quantum team output, ETH2030 devnet, precompiles)
  B. NIST PQC standards (FIPS 203/204/205 errata, HQC finalization, deprecation notices)
  C. Quantum hardware milestones (>100 logical qubits, threshold breakthroughs, roadmap shifts)
  D. Competitors (QRL 2.0, StarkNet PQ marketing, PQShield, new PQC-on-EVM projects)
  E. Academic papers (cs.CR last 24h relevant to lattice/hash sigs in financial context)

Output ONLY valid JSON inside <json></json> tags. NO prose outside the tags. The full free-form Markdown report goes inside the "markdown_report" field.`;

const USER_PROMPT = `Today is ${DATE}. Run the daily scan now.

Use your built-in knowledge plus inference about likely developments. Be honest about uncertainty: if you cannot verify a signal occurred in the last 24 hours, score it lower (1-4) and mark "verified": false.

Return JSON with this exact schema:
{
  "scan_date": "${DATE}",
  "significance_score": <1-10 integer>,
  "headline": "<one-line summary, max 80 chars, no period>",
  "top_signals": [
    {
      "category": "ethereum_pqc | nist | hardware | competitor | academic",
      "title": "<short title>",
      "summary": "<2-3 sentence description>",
      "impact_on_us": "<how this affects Quantum Shield specifically>",
      "verified": <true|false>,
      "score": <1-10>,
      "source_hint": "<URL or search term to verify>"
    }
  ],
  "recommended_actions": [
    "<concrete action item, e.g. 'Update SPHINCS+ verifier to handle EIP-XXXX'>"
  ],
  "markdown_report": "<full Markdown report body for the daily log file>"
}

Wrap the entire JSON in <json></json> tags.`;

const body = JSON.stringify({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 8192,
  system: SYSTEM_PROMPT,
  messages: [{ role: 'user', content: USER_PROMPT }],
});

const req = https.request(
  'https://api.anthropic.com/v1/messages',
  {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
  },
  (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => handleResponse(data, res.statusCode));
  },
);

req.on('error', (err) => {
  console.error('Request error:', err.message);
  process.exit(1);
});

req.write(body);
req.end();

function handleResponse(data, statusCode) {
  if (statusCode !== 200) {
    console.error(`API returned ${statusCode}:`, data.slice(0, 500));
    process.exit(1);
  }

  const parsed = JSON.parse(data);
  const text = parsed.content?.[0]?.text;
  if (!text) {
    console.error('Empty response from API');
    process.exit(1);
  }

  const match = text.match(/<json>([\s\S]*?)<\/json>/);
  if (!match) {
    console.error('Response did not contain <json></json> tags. Raw:', text.slice(0, 800));
    process.exit(1);
  }

  let report;
  try {
    report = JSON.parse(match[1].trim());
  } catch (e) {
    console.error('Failed to parse JSON payload:', e.message);
    console.error('Payload was:', match[1].slice(0, 800));
    process.exit(1);
  }

  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const reportHeader = `# Daily PQC Intelligence — ${DATE}

_Auto-generated by Claude Haiku 4.5 (model: claude-haiku-4-5-20251001)._
_Significance score: **${report.significance_score}/10** — ${report.headline}_

`;
  fs.writeFileSync(REPORT_PATH, reportHeader + (report.markdown_report || '_(no report body)_') + '\n');
  console.log(`Daily report written: ${REPORT_PATH}`);

  // Issue body for high-significance days
  const shouldIssue = FORCE_ISSUE || (report.significance_score >= 7);
  if (shouldIssue) {
    const issueBody = buildIssueBody(report);
    fs.writeFileSync(ISSUE_BODY_PATH, issueBody);
  }

  // Emit GitHub Actions outputs
  if (GITHUB_OUTPUT) {
    const outputs = [
      `significance_score=${report.significance_score}`,
      `issue_title=${(report.headline || `Daily intel ${DATE}`).replace(/[\r\n]/g, ' ').slice(0, 200)}`,
      `issue_body_file=${ISSUE_BODY_PATH}`,
    ].join('\n');
    fs.appendFileSync(GITHUB_OUTPUT, outputs + '\n');
  }

  // Slack notification (only on significant days to avoid noise)
  if (SLACK_URL && shouldIssue) {
    sendSlack(report);
  }
}

function buildIssueBody(report) {
  const signals = (report.top_signals || [])
    .map((s, i) => {
      const verified = s.verified ? '✓ verified' : '⚠ unverified';
      return `### ${i + 1}. ${s.title} (${s.category}, score ${s.score}, ${verified})

${s.summary}

**Impact on Quantum Shield**: ${s.impact_on_us}

**Source hint**: ${s.source_hint}`;
    })
    .join('\n\n');

  const actions = (report.recommended_actions || []).map((a) => `- [ ] ${a}`).join('\n');

  return `> Auto-generated by daily-research.yml on ${DATE}.
> Overall significance: **${report.significance_score}/10**

## Headline

${report.headline}

## Top Signals

${signals || '_(none)_'}

## Recommended Actions

${actions || '_(none)_'}

## Verification Required

This Issue was generated by Claude Haiku 4.5 from world-knowledge inference. Before acting:
1. Verify each signal via the source_hint links
2. Cross-check against \`docs/intelligence/LATEST.md\` for context
3. If \`pivot-alert\` label is set, escalate to Founder for manual review

---

_Daily report file: \`docs/intelligence/daily/${DATE}.md\`_`;
}

function sendSlack(report) {
  const payload = JSON.stringify({
    text: `*Daily PQC Intel — ${DATE}* (significance ${report.significance_score}/10)\n${report.headline}\n\nFull report: docs/intelligence/daily/${DATE}.md`,
  });
  const url = new URL(SLACK_URL);
  const slackReq = https.request(
    {
      method: 'POST',
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json' },
    },
    () => console.log('Slack notification sent'),
  );
  slackReq.on('error', (err) => console.warn('Slack error:', err.message));
  slackReq.write(payload);
  slackReq.end();
}
