/**
 * Smoke tests: open the real page in headless Chromium and check it works.
 *
 *     npm test
 *
 * The TradingEconomics API is mocked, so live mode is tested without a real key.
 * Runs in CI on every push and pull request.
 */

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test, before, after } from 'node:test';
import { chromium } from 'playwright';
import { serve, ROOT } from '../scripts/serve.mjs';

let browser, server, url;

before(async () => {
  ({ server, base: url } = await serve());
  url += '/index.html';
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  server?.close();
});

const MALICIOUS = '<img src=x onerror="window.__pwned=1">';

/**
 * Open the page. Fonts are stubbed so the tests never depend on the network.
 * `api` mocks TradingEconomics: an array of events, or a status code to fail with.
 */
async function open({ viewport = { width: 1280, height: 900 }, key, api, time, colorScheme = 'dark' } = {}) {
  const context = await browser.newContext({ viewport, colorScheme, timezoneId: 'UTC' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.route(/api\.tradingeconomics\.com/, r => typeof api === 'number'
    ? r.fulfill({ status: api, body: 'error' })
    : r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(api || []) }));
  if (key) await page.addInitScript(k => localStorage.setItem('marketpulse_api_key', k), key);
  if (time) await page.clock.setFixedTime(time);
  await page.goto(url);
  await page.waitForSelector('#loadingOverlay', { state: 'detached' });
  return { page, errors, context };
}

const ymd = d => d.toISOString().slice(0, 10);

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`renders cleanly at ${width}px`, async () => {
    const { page, errors, context } = await open({ viewport: { width, height: 900 } });
    const r = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      cards: document.querySelectorAll('.event-card').length,
      offscreen: [...document.querySelectorAll('.header button, .chip, .impact-btn')]
        .filter(el => { const b = el.getBoundingClientRect(); return b.width && (b.left < 0 || b.right > innerWidth); }).length,
    }));
    assert.deepEqual(errors, [], 'no JavaScript errors');
    assert.ok(r.overflow <= 0, `no sideways scrolling (page is ${r.overflow}px too wide)`);
    assert.equal(r.offscreen, 0, 'every button is on screen');
    assert.ok(r.cards > 10, `events shown (${r.cards})`);
    await context.close();
  });
}

test('without a key, the sample week sits around today and is labelled', async () => {
  const { page, context } = await open();
  const r = await page.evaluate(() => ({
    badge: document.getElementById('syncLabel').textContent,
    note: !document.getElementById('sampleNote').hidden,
    next: document.getElementById('nextEventPanel').style.display !== 'none',
    statuses: [...document.querySelectorAll('.status-pill')].map(p => p.textContent),
  }));
  assert.equal(r.badge, 'Sample data');
  assert.equal(r.note, true, 'sample-data note is shown');
  assert.equal(r.next, true, 'next high-impact event panel is shown');
  assert.ok(r.statuses.includes('Upcoming'), 'some events are still to come');
  assert.ok(r.statuses.includes('Released'), 'some events have happened');
  await context.close();
});

test('the sample week skips weekends', async () => {
  // A Saturday: the sample "today" should become Monday, and no event may land on a weekend
  const { page, context } = await open({ time: new Date('2026-11-28T12:00:00Z') });
  await page.click('.chip[data-region="All"]');
  await page.click('.impact-btn[data-impact="All"]');
  await page.waitForTimeout(400);
  const labels = await page.$$eval('.date-label', ls => ls.map(l => l.textContent));
  assert.ok(labels.length >= 6, `several days shown (${labels.length})`);
  assert.ok(labels.every(l => !/Saturday|Sunday/.test(l)), `weekdays only: ${labels.join(' | ')}`);
  await context.close();
});

test('the file never contains a real API key', async () => {
  const html = await readFile(join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /API_KEY:\s*'',/);
  assert.doesNotMatch(html, /YOUR_API_KEY_HERE/);
});

test('live mode: API data is shown as text, never run as code', async () => {
  const soon = new Date(Date.now() + 3 * 3600e3).toISOString();
  const { page, errors, context } = await open({
    key: 'test:key',
    api: [{ CalendarId: 1, Event: MALICIOUS, Country: 'United States', Currency: 'USD', Importance: 3,
            Date: soon, Previous: '1%', Forecast: '<b>2%</b>', Actual: null }],
  });
  const r = await page.evaluate(() => ({
    pwned: Boolean(window.__pwned),
    injected: document.querySelectorAll('#mainContent img, #mainContent b').length,
    badge: document.getElementById('syncLabel').textContent,
    note: !document.getElementById('sampleNote').hidden,
    name: document.querySelector('.card-event-name')?.textContent,
  }));
  assert.equal(r.pwned, false);
  assert.equal(r.injected, 0);
  assert.equal(r.name, '<img src=x onerror="window.__pwned=1">');
  assert.match(r.badge, /^Live · /);
  assert.equal(r.note, false, 'no sample note in live mode');
  assert.deepEqual(errors, []);
  await context.close();
});

test('settings: a rejected key says so and stays on sample data', async () => {
  const { page, context } = await open({ api: 401 });
  await page.click('[data-action="open-settings"] >> nth=0');
  await page.fill('#apiKeyInput', 'wrong:key');
  await page.click('#settingsForm button[type="submit"]');
  await page.waitForFunction(() => /Could not load/.test(document.getElementById('settingsMsg').textContent));
  assert.equal(await page.isVisible('#settingsDialog'), true, 'dialog stays open');
  await context.close();
});

test('settings: a working key switches to live data', async () => {
  const soon = new Date(Date.now() + 3600e3).toISOString();
  const { page, context } = await open({
    api: [{ CalendarId: 7, Event: 'Test CPI', Country: 'United Kingdom', Currency: 'GBP', Importance: 3, Date: soon }],
  });
  await page.click('[data-action="open-settings"] >> nth=0');
  await page.fill('#apiKeyInput', 'good:key');
  await page.click('#settingsForm button[type="submit"]');
  await page.waitForFunction(() => !document.getElementById('settingsDialog').open);
  assert.match(await page.textContent('#syncLabel'), /^Live · /);
  assert.equal(await page.evaluate(() => localStorage.getItem('marketpulse_api_key')), 'good:key');
  await context.close();
});

test('filters are remembered and announced', async () => {
  const { page, context } = await open();
  await page.click('.chip[data-region="UK"]');
  await page.click('.impact-btn[data-impact="All"]');
  await page.reload();
  await page.waitForSelector('#loadingOverlay', { state: 'detached' });
  assert.equal(await page.getAttribute('.chip[data-region="UK"]', 'aria-pressed'), 'true');
  assert.equal(await page.getAttribute('.impact-btn[data-impact="All"]', 'aria-pressed'), 'true');
  await context.close();
});

test(`sample dates stay current (today is ${ymd(new Date())})`, async () => {
  const { page, context } = await open();
  await page.click('.chip[data-region="All"]');
  await page.click('.impact-btn[data-impact="All"]');
  await page.waitForTimeout(400);
  const first = await page.$eval('.date-label', l => l.textContent.replace(/^Today – /, ''));
  const age = Date.now() - Date.parse(first);
  assert.ok(age < 7 * 86400e3, `oldest sample day is within a week (${first})`);
  await context.close();
});

test('jobless figures: a higher number is coloured as worse', async () => {
  const past = new Date(Date.now() - 3600e3).toISOString();
  const { page, context } = await open({
    key: 'test:key',
    api: [
      { CalendarId: 1, Event: 'Unemployment Rate', Country: 'United States', Currency: 'USD', Importance: 3, Date: past, Previous: '4.1%', Forecast: '4.1%', Actual: '4.3%' },
      { CalendarId: 2, Event: 'Retail Sales (MoM)', Country: 'United States', Currency: 'USD', Importance: 3, Date: past, Previous: '0.2%', Forecast: '0.2%', Actual: '0.5%' },
    ],
  });
  await page.click('.chip[data-region="All"]');
  await page.waitForTimeout(400);
  const cls = await page.$$eval('.value-data.actual', els => els.map(e => [e.closest('.event-card').querySelector('.card-event-name').textContent, e.className]));
  const by = Object.fromEntries(cls);
  assert.match(by['Unemployment Rate'], /worse/);
  assert.match(by['Retail Sales (MoM)'], /better/);
  await context.close();
});
