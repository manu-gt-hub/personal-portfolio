// Checks that the external links on the page still answer (repos, live demos, Malt…).
// Not part of `npm test`: it needs the network, so CI runs it as a separate, non-blocking job.
// Usage: node tests/external-links.mjs
import { readPage } from './helpers.mjs';

// Sites that refuse automated requests even when the page exists (Instagram answers 429 to CI runners)
const SKIP = [/^https:\/\/www\.linkedin\.com\//, /^https:\/\/www\.malt\.com\//, /^https:\/\/www\.instagram\.com\//];

const html = readPage('index.html');
const urls = [...new Set([...html.matchAll(/<a\b[^>]*\shref="(https:\/\/[^"]+)"/g)].map((m) => m[1]))]
  .filter((url) => !SKIP.some((re) => re.test(url)));

async function check(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
        headers: { 'user-agent': 'Mozilla/5.0 (portfolio link check)' },
      });
      if (res.status < 400) return { url, ok: true, status: res.status };
      if (attempt === 3) return { url, ok: false, status: res.status };
    } catch (err) {
      if (attempt === 3) return { url, ok: false, status: err.name };
    }
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
}

const results = await Promise.all(urls.map(check));
for (const r of results) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.status}  ${r.url}`);
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} links answer (skipped: LinkedIn, Malt, Instagram)`);
process.exit(failed.length ? 1 : 0);
