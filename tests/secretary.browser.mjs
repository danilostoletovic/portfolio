// Run against a static server: SECRETARY_TEST_URL defaults to localhost:8000.
// Requires Playwright in the test environment, not in the deployed site.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const base = process.env.SECRETARY_TEST_URL || 'http://localhost:8000';
const endpoint = 'https://secretary.danilostoletovic.com/chat';
let mode = 'success', requests = 0;
await page.route(endpoint, async route => {
  requests++;
  assert.equal(route.request().method(), 'POST');
  assert.deepEqual(Object.keys(route.request().postDataJSON()), ['message']);
  if (mode === 'network') return route.abort();
  if (mode === 'timeout') return;
  if (mode === 'slow') await new Promise(resolve => setTimeout(resolve, 500));
  await route.fulfill({ status: mode === '429' ? 429 : mode === 'http' ? 503 : 200,
    contentType: 'application/json', body: mode === 'malformed' ? 'not json' : JSON.stringify(mode === 'schema' ? { reply: 42 } : { reply: '<img src=x onerror=alert(1)> A safe reply.' }) });
});
try {
  await page.goto(base);
  assert.equal(requests, 0);
  const launch = page.getByRole('button', { name: 'Ask Danilo’s Secretary' });
  await launch.click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'secretary-welcome.png' });
  const input = page.getByLabel('Your question');
  assert.equal(await input.evaluate(el => el === document.activeElement), true);
  await input.fill('   ');
  await input.press('Enter');
  assert.equal(requests, 0);
  await input.fill('First line');
  await input.press('Shift+Enter');
  assert.match(await input.inputValue(), /\n/);
  await input.fill('Hello');
  mode = 'slow';
  await input.press('Enter');
  await input.press('Enter');
  await page.getByText('<img src=x onerror=alert(1)> A safe reply.', { exact: true }).waitFor();
  assert.equal(requests, 1);
  assert.equal(await page.locator('.secretary-log img').count(), 0);
  await page.screenshot({ path: 'secretary-desktop.png' });
  await input.press('Escape');
  assert.equal(await launch.evaluate(el => el === document.activeElement), true);
  await launch.click();
  assert.equal(await page.locator('.secretary-message--user').count(), 1);
  for (const failure of ['429', 'http', 'network', 'malformed', 'schema']) {
    mode = failure;
    await input.fill(`Check ${failure}`);
    await page.getByRole('button', { name: 'Send ↗', exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('.secretary-send').disabled);
    assert.match(await page.locator('.secretary-status').innerText(), failure === '429' ? /wait a minute/ : /couldn’t answer/);
    assert.equal(await input.inputValue(), `Check ${failure}`);
  }
  await page.clock.install();
  mode = 'timeout';
  await input.fill('Timeout');
  await input.press('Enter');
  await page.clock.fastForward(31000);
  await page.waitForFunction(() => document.querySelector('.secretary-status').textContent.includes('too long'));
  await page.clock.resume();
  await page.getByRole('button', { name: 'Close Secretary' }).focus();
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(() => document.querySelector('dialog').contains(document.activeElement)), true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'secretary-mobile.png' });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  const box = await page.locator('dialog').boundingBox();
  assert.equal(box.width, 390);
  assert.equal(box.height, 844);
  await page.setViewportSize({ width: 320, height: 568 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.ok((await page.getByRole('button', { name: 'Send ↗', exact: true }).boundingBox()).y < 568);
  await page.getByRole('button', { name: 'Close Secretary' }).click();
  await page.getByLabel('Toggle light or dark theme').check();
  await launch.click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'secretary-dark.png' });
  assert.deepEqual(errors, []);
  const noJS = await browser.newPage({ javaScriptEnabled: false });
  await noJS.goto(base);
  assert.equal(await noJS.locator('#work').count(), 1);
  assert.equal(await noJS.locator('.secretary-launcher').count(), 0);
  await noJS.getByRole('link', { name: 'About me', exact: true }).click();
  assert.match(noJS.url(), /#about$/);
  if (process.env.SECRETARY_LIVE === '1') {
    // Serve this checkout under its production origin to exercise real CORS/CSP.
    const live = await browser.newPage();
    const consoleErrors = [];
    live.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    const headers = await readFile(new URL('../_headers', import.meta.url), 'utf8');
    const csp = headers.match(/Content-Security-Policy: (.+)/)[1].trim();
    await live.route('https://danilostoletovic.com/**', async route => {
      const url = new URL(route.request().url());
      const response = await live.request.get(`${base}${url.pathname}${url.search}`);
      await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': csp } });
    });
    await live.goto('https://danilostoletovic.com/');
    await live.getByRole('button', { name: 'Ask Danilo’s Secretary' }).click();
    await live.getByRole('button', { name: 'What technologies does he use?' }).click();
    await live.locator('.secretary-message--assistant').nth(1).waitFor({ timeout: 35000 });
    assert.deepEqual(consoleErrors, []);
    console.log('PASS: real production API reply in browser with production CORS and repository CSP; no console errors.');
  }
  console.log('PASS: success, safe text, duplicate/empty sends, Enter/newline, all failure paths, timeout, focus/Escape, themes, desktop/mobile, no-JS portfolio, no page errors.');
} finally { await browser.close(); }
