// Headless check: without ?probe nothing runs; with ?probe the box appears with the events, marks and context.
// Playwright is not a dependency (it's large): install it globally, or run with one already on the machine.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const page = `<!doctype html><html><head><script src="../dist/frame-probe.min.js"></script></head><body>
<script>
  if (window.frameProbe) {
    frameProbe.context(function () { return 'ctx-ok'; });
    setTimeout(function () { frameProbe.mark('custom mark'); }, 100);
    setTimeout(function () { var t = performance.now(); while (performance.now() - t < 120) {} }, 300); // a blocked frame
  }
</script></body></html>`;
writeFileSync('test/page.html', page);
const url = pathToFileURL('test/page.html').href;
const browser = await chromium.launch();
const p = await browser.newPage();
await p.goto(url);
await p.waitForTimeout(400);
assert.equal(await p.evaluate(() => typeof window.frameProbe), 'undefined', 'no ?probe: does nothing');
await p.goto(url + '?probe=1500');
await p.waitForSelector('[data-frame-probe]', { timeout: 5000 });
const text = await p.evaluate(() => window.frameProbe.results.text);
assert.match(text, /frame-probe v\d+\.\d+\.\d+/);
assert.match(text, /page load/);
assert.match(text, /DOMContentLoaded/);
assert.match(text, /custom mark/);
const slow = (await p.evaluate(() => window.frameProbe.results.frames)).filter((f) => f[1] >= 90);
assert.ok(slow.length >= 1, 'the 120ms block shows as a slow frame');
assert.ok(slow.some((f) => f[2] >= 80), 'and as page code busy');
assert.ok(slow.some((f) => f[3].includes('ctx-ok')), 'context column filled');
await browser.close();
console.log('smoke: all checks passed');
