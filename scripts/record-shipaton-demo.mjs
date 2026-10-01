/**
 * Records a Shipaton demo walkthrough of HOMPANY (Expo web) as WebM via Playwright.
 * Requires Expo web on DEMO_URL (default http://127.0.0.1:8082) and seeded Supabase.
 */
import { chromium, devices } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.DEMO_URL ?? 'http://127.0.0.1:8082';
const OUT_DIR = path.resolve('docs/demo-video');
const VIDEO_DIR = path.join(OUT_DIR, 'raw');

fs.mkdirSync(VIDEO_DIR, { recursive: true });

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function dismissOverlays(page) {
  // Error toasts / tutorial can intercept pointer events.
  await page.evaluate(() => {
    const toast = document.getElementById('error-toast');
    if (toast) toast.remove();
  }).catch(() => {});
  const skip = page.getByText(/Saltar tour|Skip tour/i).first();
  if (await skip.isVisible().catch(() => false)) {
    await skip.click({ force: true }).catch(() => {});
    await sleep(600);
  }
  const close = page.getByText(/^Cerrar$|^Close$/i).last();
  if (await close.isVisible().catch(() => false)) {
    await close.click({ force: true }).catch(() => {});
    await sleep(400);
  }
}

async function go(page, route) {
  await dismissOverlays(page);
  await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await sleep(1800);
  await dismissOverlays(page);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...devices['Pixel 7'],
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 412, height: 915 },
    },
    locale: 'en-US',
  });
  const page = await context.newPage();

  console.log('Opening', BASE);
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await sleep(2000);
  await page.evaluate(() => {
    try {
      localStorage.clear();
    } catch {}
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(2000);

  // Login
  await go(page, '/login');
  const demoFill = page.getByText(/Demo local|tap to fill|tocar para rellenar/i).first();
  if (await demoFill.isVisible().catch(() => false)) {
    await demoFill.click({ force: true });
  } else {
    await page.getByRole('textbox').nth(0).fill('ana@hompany.local');
    await page.getByRole('textbox').nth(1).fill('password123');
  }
  await sleep(500);
  await page.getByText(/Entrar|Sign in|Log in/i).first().click({ force: true });
  await sleep(5500);
  await dismissOverlays(page);

  // Feed dwell
  await go(page, '/');
  await sleep(3000);
  await page.mouse.wheel(0, 320);
  await sleep(2800);
  await page.mouse.wheel(0, 320);
  await sleep(2800);

  // Tasks
  await go(page, '/tasks');
  await sleep(2800);
  await page.mouse.wheel(0, 260);
  await sleep(3500);

  // Expenses
  await go(page, '/expenses');
  await sleep(2800);
  await page.mouse.wheel(0, 260);
  await sleep(3500);

  // Flat
  await go(page, '/piso');
  await sleep(2800);
  const soon = page.getByText(/Próximamente|Coming soon/i).first();
  if (await soon.isVisible().catch(() => false)) {
    await soon.click({ force: true }).catch(() => {});
    await sleep(1600);
    await dismissOverlays(page);
  }

  // Settings + Plus
  await go(page, '/settings');
  await sleep(1500);
  await page.mouse.wheel(0, 1000);
  await sleep(2000);
  const plus = page.getByText(/Ver HOMPANY Plus|View HOMPANY Plus/i).first();
  if (await plus.isVisible().catch(() => false)) {
    await plus.click({ force: true });
    await sleep(4500);
    await dismissOverlays(page);
  }
  await page.mouse.wheel(0, -500);
  await sleep(2500);

  const videoPath = await page.video().path();
  await context.close();
  await browser.close();

  const dest = path.join(OUT_DIR, 'raw-capture.webm');
  fs.copyFileSync(videoPath, dest);
  console.log('Saved raw video:', dest);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
