// Captures screenshots of https://crowdcompass.ovh for the portfolio.
// Usage: node scripts/capture-crowdcompass.mjs
//
// Uses the locally installed Microsoft Edge through Playwright (no browser
// download). Only public pages are visited: no accounts, no login, no /admin
// and no /open-data. The demo ticket is the public one shown on the landing.

import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const SITE = 'https://crowdcompass.ovh';
const DEMO_TICKET = 'M3XNCLCE';
const OUT = new URL('../src/assets/projects/crowdcompass/', import.meta.url);

const launchArgs = [
  // The QR modal only opens once getUserMedia succeeds: use a fake camera.
  '--use-fake-ui-for-media-stream',
  '--use-fake-device-for-media-stream',
  // WebGL in headless mode.
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
];

const out = (name) => fileURLToPath(new URL(name, OUT));

async function rejectCookies(page) {
  const reject = page.getByRole('button', { name: 'Rechazar' });
  if (await reject.isVisible().catch(() => false)) await reject.click();
}

/** Puts every scroll-reveal element in its final state and stops transitions. */
async function settleReveals(page) {
  await page.evaluate(() => {
    document
      .querySelectorAll('.fade-in-up, .fade-in-blur')
      .forEach((el) => el.classList.add('is-visible'));
  });
  await page.addStyleTag({
    content: '*, *::before, *::after { transition: none !important; animation-play-state: paused !important; }',
  });
}

async function captureLanding(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
    permissions: ['camera'],
  });
  const page = await context.newPage();
  await page.goto(SITE, { waitUntil: 'networkidle', timeout: 60_000 });
  await rejectCookies(page);
  await page.waitForTimeout(1500); // hero text reveal
  await page.screenshot({ path: out('landing-hero.png') });
  console.log('ok landing-hero.png');

  const tutorial = page.locator('#tutorial-section');
  await tutorial.scrollIntoViewIfNeeded();
  await settleReveals(page);
  // The fixed header would overlap the section heading in an element capture.
  await page.addStyleTag({ content: '.landing-header { visibility: hidden !important; }' });
  await page.waitForTimeout(800);
  await tutorial.screenshot({ path: out('landing-tutorial.png') });
  console.log('ok landing-tutorial.png');

  await context.close();
}

async function captureViewer(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    permissions: ['camera'],
  });
  const page = await context.newPage();
  await page.goto(SITE, { waitUntil: 'networkidle', timeout: 60_000 });
  await rejectCookies(page);

  await page.locator('button.cta-hero').click();
  await page.getByPlaceholder('Código de ticket').fill(DEMO_TICKET);
  await page.getByPlaceholder('Código de ticket').press('Enter');

  try {
    await page.waitForURL(/\/app/, { timeout: 30_000 });
  } catch {
    const error = await page.locator('.camera-error-text').innerText().catch(() => '');
    console.warn(`skip viewer captures: ticket activation failed (${error || 'no /app'})`);
    await context.close();
    return;
  }

  await page.locator('canvas').first().waitFor({ timeout: 60_000 });
  await page.waitForTimeout(10_000); // model + textures
  await page.screenshot({ path: out('visor-3d.png') });
  console.log('ok visor-3d.png');

  await page.getByRole('button', { name: /Iniciar recorrido/i }).click();
  await page.waitForTimeout(6_000); // mid-route
  await page.screenshot({ path: out('visor-recorrido.png') });
  console.log('ok visor-recorrido.png');

  await page.locator('.kbh-chatbot-launcher').click();
  await page.waitForTimeout(1_500);
  await page.screenshot({ path: out('visor-chatbot.png') });
  console.log('ok visor-chatbot.png');

  await context.close();
}

async function captureMobile(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.goto(SITE, { waitUntil: 'networkidle', timeout: 60_000 });
  await rejectCookies(page);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: out('landing-movil.png') });
  console.log('ok landing-movil.png');
  await context.close();
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', args: launchArgs });
try {
  await captureLanding(browser);
  await captureMobile(browser);
  await captureViewer(browser);
} finally {
  await browser.close();
}
