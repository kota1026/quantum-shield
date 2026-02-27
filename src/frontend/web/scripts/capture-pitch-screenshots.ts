import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Pitch Deck Screenshot Capture Script
 *
 * Captures key screens for investor pitch materials.
 * Run: npx playwright test scripts/capture-pitch-screenshots.ts --project=chromium
 * Or:  npx tsx scripts/capture-pitch-screenshots.ts
 */

const OUTPUT_DIR = path.join(__dirname, '..', '..', '..', '..', 'docs', 'pitch', 'screenshots');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Key screens for pitch deck (ordered by slide relevance)
const SCREENS = [
  // Slide 7: Product - Consumer Tier
  { name: '01-consumer-landing', path: '/ja/consumer/landing', label: 'Consumer Landing' },
  { name: '02-consumer-dashboard', path: '/ja/consumer/dashboard', label: 'Consumer Dashboard' },
  { name: '03-consumer-lock', path: '/ja/consumer/lock', label: 'Lock Screen' },
  { name: '04-consumer-history', path: '/ja/consumer/history', label: 'Transaction History' },

  // Slide 7: Product - Explorer
  { name: '05-explorer-home', path: '/ja/explorer', label: 'Explorer Home' },

  // Slide 7: Product - Token Hub
  { name: '06-token-hub', path: '/ja/token-hub', label: 'Token Hub' },

  // Slide 7: Product - Governance
  { name: '07-governance', path: '/ja/governance', label: 'Governance Portal' },

  // Slide 7: Product - Prover
  { name: '08-prover-dashboard', path: '/ja/prover/dashboard', label: 'Prover Dashboard' },

  // Slide 7: Product - Observer
  { name: '09-observer-dashboard', path: '/ja/observer/dashboard', label: 'Observer Dashboard' },

  // Slide 7: Product - Admin
  { name: '10-admin-dashboard', path: '/ja/admin/dashboard', label: 'QS Admin Dashboard' },

  // Slide 7: Product - Enterprise
  { name: '11-enterprise', path: '/ja/enterprise', label: 'Enterprise Admin' },

  // English versions (for international pitch)
  { name: '12-consumer-landing-en', path: '/en/consumer/landing', label: 'Consumer Landing (EN)' },
  { name: '13-consumer-dashboard-en', path: '/en/consumer/dashboard', label: 'Consumer Dashboard (EN)' },
];

async function captureScreenshots() {
  // Create output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  // Desktop viewport
  const desktopContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2, // Retina quality
  });

  // Mobile viewport
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14
    deviceScaleFactor: 3,
    isMobile: true,
  });

  console.log(`📸 Capturing ${SCREENS.length} screens for pitch deck...\n`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const screen of SCREENS) {
    const url = `${BASE_URL}${screen.path}`;

    // Desktop screenshot
    try {
      const page = await desktopContext.newPage();
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000); // Wait for animations

      const desktopPath = path.join(OUTPUT_DIR, `${screen.name}-desktop.png`);
      await page.screenshot({
        path: desktopPath,
        fullPage: false,
      });

      console.log(`✅ ${screen.label} (desktop)`);
      await page.close();
      successCount++;
    } catch (e) {
      console.log(`❌ ${screen.label} (desktop): ${(e as Error).message.substring(0, 80)}`);
      failCount++;
    }

    // Mobile screenshot (only for consumer screens)
    if (screen.name.startsWith('01-') || screen.name.startsWith('02-') || screen.name.startsWith('03-')) {
      try {
        const page = await mobileContext.newPage();
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(1000);

        const mobilePath = path.join(OUTPUT_DIR, `${screen.name}-mobile.png`);
        await page.screenshot({
          path: mobilePath,
          fullPage: false,
        });

        console.log(`✅ ${screen.label} (mobile)`);
        await page.close();
        successCount++;
      } catch (e) {
        console.log(`❌ ${screen.label} (mobile): ${(e as Error).message.substring(0, 80)}`);
        failCount++;
      }
    }
  }

  await desktopContext.close();
  await mobileContext.close();
  await browser.close();

  console.log(`\n📊 Results: ${successCount} captured, ${failCount} failed`);
  console.log(`📁 Screenshots saved to: ${OUTPUT_DIR}`);

  // Generate index HTML for easy review
  const indexHtml = generateIndexHtml(SCREENS);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHtml);
  console.log(`📄 Index: ${path.join(OUTPUT_DIR, 'index.html')}`);
}

function generateIndexHtml(screens: typeof SCREENS): string {
  const images = screens.map(s => `
    <div style="margin: 20px; display: inline-block; vertical-align: top;">
      <h3 style="font-family: Inter, sans-serif; color: #1a1a2e;">${s.label}</h3>
      <img src="${s.name}-desktop.png"
           style="width: 600px; border: 1px solid #eee; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
           onerror="this.style.display='none'" />
    </div>
  `).join('\n');

  return `<!DOCTYPE html>
<html><head><title>QS Pitch Screenshots</title></head>
<body style="background: #f5f5f5; padding: 20px;">
<h1 style="font-family: Inter, sans-serif; color: #C41E3A;">Quantum Shield - Pitch Screenshots</h1>
<p style="font-family: Inter, sans-serif; color: #666;">Generated for investor pitch deck</p>
${images}
</body></html>`;
}

captureScreenshots().catch(console.error);
