/**
 * Quantum Shield — Quick Verification Script
 *
 * ブラウザの DevTools Console に貼り付けて実行。
 * quantum-shield-local.vercel.app で実行してください。
 */

(async () => {
  const API = 'https://quantum-shield-production-8f2b.up.railway.app';
  const results = [];

  const test = async (name, fn) => {
    try {
      const result = await fn();
      results.push({ name, status: 'PASS', detail: result });
      console.log('✅', name, result);
    } catch (e) {
      results.push({ name, status: 'FAIL', detail: e.message });
      console.error('❌', name, e.message);
    }
  };

  console.log('Quantum Shield Verification Starting...\n');

  await test('Auth Store', async () => {
    const raw = sessionStorage.getItem('consumer-auth');
    if (!raw) return 'No auth — Test Wallet not active';
    const p = JSON.parse(raw);
    return p.state?.isAuthenticated ? `OK ${p.state.user?.address?.slice(0,10)}...` : 'Not authenticated';
  });

  let jwt = null;
  try { jwt = JSON.parse(sessionStorage.getItem('consumer-auth')).state.accessToken; } catch {}
  const h = jwt ? { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' } : {};

  const endpoints = [
    ['Health', `${API}/v1/health`],
    ['Locks', `${API}/v1/locks`],
    ['Provers', `${API}/v1/provers`],
    ['Observer', `${API}/v1/observer/pending-unlocks`],
    ['Governance', `${API}/v1/governance/proposals`],
    ['Admin', `${API}/api/admin/dashboard`],
  ];

  for (const [name, url] of endpoints) {
    await test(`API: ${name}`, async () => {
      const r = await fetch(url, { headers: h });
      return `HTTP ${r.status}`;
    });
  }

  const pages = ['/ja/consumer/dashboard','/ja/consumer/lock','/ja/prover','/ja/observer','/ja/governance','/ja/token-hub'];
  for (const p of pages) {
    await test(`Page: ${p}`, async () => { const r = await fetch(p); return `HTTP ${r.status}`; });
  }

  console.log('\n=== SUMMARY ===');
  console.table(results);
})();
