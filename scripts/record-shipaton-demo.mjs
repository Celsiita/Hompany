/**
 * High-quality Shipaton demo capture (Expo web, English UI).
 * Waits for real content, kills error toasts, deliberate pacing.
 */
import { chromium, devices } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.DEMO_URL ?? 'http://127.0.0.1:8082';
const OUT_DIR = path.resolve('docs/demo-video');
const VIDEO_DIR = path.join(OUT_DIR, 'raw');

fs.mkdirSync(VIDEO_DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function installToastKiller(page) {
  await page.addInitScript(() => {
    const kill = () => {
      document.getElementById('error-toast')?.remove();
      document.querySelectorAll('[id*="error-toast"], [class*="error-toast"]').forEach((n) => n.remove());
    };
    setInterval(kill, 200);
    const obs = new MutationObserver(kill);
    document.addEventListener('DOMContentLoaded', () => {
      kill();
      obs.observe(document.documentElement, { childList: true, subtree: true });
    });
  });
  await page.addStyleTag({
    content: `
      #error-toast, [id*="error-toast"] { display: none !important; visibility: hidden !important; pointer-events: none !important; }
    `,
  }).catch(() => {});
}

async function clearNoise(page) {
  await page.evaluate(() => {
    document.getElementById('error-toast')?.remove();
  }).catch(() => {});
  for (const re of [/Skip tour/i, /^Close$/i, /^Cerrar$/i, /Saltar tour/i]) {
    const btn = page.getByText(re).last();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click({ force: true }).catch(() => {});
      await sleep(350);
    }
  }
}

async function waitText(page, re, timeout = 25000) {
  await page.getByText(re).first().waitFor({ state: 'visible', timeout }).catch(() => {});
}

async function waitReady(page, contentRe) {
  // Avoid filming the mascot loading spinner
  for (let i = 0; i < 40; i++) {
    const loading = await page.getByText(/hanging on|colgado|one second|un segundo/i).isVisible().catch(() => false);
    const content = await page.getByText(contentRe).first().isVisible().catch(() => false);
    if (!loading && content) return;
    await sleep(400);
  }
  await waitText(page, contentRe, 15000);
}

async function go(page, route) {
  await clearNoise(page);
  await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await sleep(800);
  await installToastKiller(page);
  await clearNoise(page);
}

async function hold(page, ms) {
  const n = Math.max(1, Math.ceil(ms / 700));
  for (let i = 0; i < n; i++) {
    await clearNoise(page);
    await sleep(Math.min(700, ms - i * 700));
  }
}

async function main() {
  const takeDir = path.join(VIDEO_DIR, `take-${Date.now()}`);
  fs.mkdirSync(takeDir, { recursive: true });

  const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage'] });
  const context = await browser.newContext({
    ...devices['Pixel 7'],
    deviceScaleFactor: 2,
    recordVideo: { dir: takeDir, size: { width: 412, height: 915 } },
    locale: 'en-US',
    colorScheme: 'light',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(25_000);
  await installToastKiller(page);

  console.log('Boot', BASE);
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await sleep(1500);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('hompany.locale', 'en');
    localStorage.setItem('hompany.tutorial.completed.v2', '1');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(1800);

  // LOGIN
  await go(page, '/login');
  await waitText(page, /HOMPANY/);
  await hold(page, 2800);
  const demo = page.getByText(/Local demo|Demo local|tap to fill/i).first();
  if (await demo.isVisible().catch(() => false)) await demo.click({ force: true });
  else {
    await page.getByRole('textbox').nth(0).fill('ana@hompany.local');
    await page.getByRole('textbox').nth(1).fill('password123');
  }
  await sleep(500);
  await page.getByText(/Sign in|Entrar/i).first().click({ force: true });
  await sleep(5500);
  await page.evaluate(() => {
    localStorage.setItem('hompany.locale', 'en');
    localStorage.setItem('hompany.tutorial.completed.v2', '1');
  });
  await clearNoise(page);
  // Force-dismiss tour if it still appears
  for (let i = 0; i < 5; i++) {
    const skip = page.getByText(/Skip tour|Saltar tour/i).first();
    if (await skip.isVisible().catch(() => false)) {
      await skip.click({ force: true });
      await sleep(500);
    } else break;
  }

  // FEED — status / ranking / money at a glance
  await go(page, '/');
  await waitReady(page, /Leaderboard|Flat health|Balances/i);
  await hold(page, 3500);
  await page.mouse.wheel(0, 360);
  await hold(page, 3000);
  await page.mouse.wheel(0, 420);
  await waitReady(page, /owe|Balances|THEY OWE|YOU OWE/i);
  await hold(page, 3000);

  // ALERTS / REMINDERS — campanita (core Shipaton advantage)
  await page.mouse.wheel(0, -900);
  await sleep(600);
  const bell = page.getByRole('button', { name: /Alert|Avisos|pending/i }).first();
  if (await bell.isVisible().catch(() => false)) {
    await bell.click({ force: true });
    await sleep(1200);
    await waitText(page, /Urgent|Review|Money|Soon|Alert|overdue|validate|owe/i, 10000);
    await hold(page, 6500);
    // Close sheet
    const closeAlerts = page.getByText(/^Close$|^Cerrar$/i).last();
    if (await closeAlerts.isVisible().catch(() => false)) {
      await closeAlerts.click({ force: true });
      await sleep(500);
    } else {
      await page.keyboard.press('Escape').catch(() => {});
      await sleep(400);
    }
  }

  // TASKS — countdown + photo review
  await go(page, '/tasks');
  await waitReady(page, /Open \(|Complete|Approve|Tasks/i);
  await hold(page, 4000);
  await page.mouse.wheel(0, 280);
  await hold(page, 5000);

  // EXPENSES — debts / settle
  await go(page, '/expenses');
  await waitReady(page, /Settle|Open \(|Expenses/i);
  await hold(page, 4000);
  await page.mouse.wheel(0, 280);
  await hold(page, 4500);

  // FLAT life — quiet / absences / matching teaser
  await go(page, '/piso');
  await waitReady(page, /Absences|Coming soon|Quiet|Flat life|Visits/i);
  await hold(page, 3500);
  const soon = page.getByText(/Coming soon|Próximamente/i).first();
  if (await soon.isVisible().catch(() => false)) {
    await soon.click({ force: true }).catch(() => {});
    await hold(page, 1500);
    await clearNoise(page);
  }

  // SETTINGS + PLUS
  await go(page, '/settings');
  await waitReady(page, /Settings|Language|English/i);
  await hold(page, 2000);
  await page.mouse.wheel(0, 900);
  await hold(page, 2000);
  await page.mouse.wheel(0, 700);
  await hold(page, 1500);
  const plus = page.getByText(/View HOMPANY Plus|Ver HOMPANY Plus/i).first();
  if (await plus.isVisible().catch(() => false)) {
    await plus.click({ force: true });
    await hold(page, 5000);
    await clearNoise(page);
  }
  await page.mouse.wheel(0, -400);
  await waitText(page, /DEMO2026|Invite|Code/i, 8000);
  await hold(page, 3000);

  const videoPath = await page.video().path();
  await context.close();
  await browser.close();
  const dest = path.join(OUT_DIR, 'raw-capture.webm');
  fs.copyFileSync(videoPath, dest);
  console.log('OK', dest);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
