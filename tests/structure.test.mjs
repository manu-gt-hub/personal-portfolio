// The site has everything it needs to run and deploy on Cloudflare.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { PUBLIC, ROOT, publicFiles, read, readJsonc, trackedFiles } from './helpers.mjs';

const REQUIRED = [
  'index.html',
  '404.html',
  'styles.css',
  'main.js',
  'favicon.svg',
  'robots.txt',
  '_headers',
  'assets/profile.webp',
  'assets/profile.jpg',
  'assets/Manuel-Gutierrez-Torrero-CV.pdf',
];

test('public/ contains every file the page needs', () => {
  const files = publicFiles();
  for (const f of REQUIRED) assert.ok(files.includes(f), `missing public/${f}`);
});

test('wrangler.jsonc serves public/ as static assets with a 404 page', () => {
  const cfg = readJsonc('wrangler.jsonc');
  assert.equal(cfg.name, 'personal-portfolio', 'Worker name must match the Cloudflare project');
  assert.ok(cfg.compatibility_date, 'compatibility_date is required');
  assert.equal(cfg.assets?.directory, './public');
  assert.equal(cfg.assets?.not_found_handling, '404-page');
  assert.ok(existsSync(join(ROOT, cfg.assets.directory)), 'assets directory must exist');
});

test('main.js is valid JavaScript', () => {
  execFileSync(process.execPath, ['--check', join(PUBLIC, 'main.js')]);
});

test('_headers sets security headers for every route', () => {
  const headers = read('public/_headers');
  for (const h of ['X-Content-Type-Options: nosniff', 'X-Frame-Options', 'Referrer-Policy']) {
    assert.ok(headers.includes(h), `_headers is missing ${h}`);
  }
});

test('source material stays out of git', () => {
  assert.match(read('.gitignore'), /^resources\/$/m, 'resources/ must be in .gitignore');
  const leaked = trackedFiles().filter((f) => f.startsWith('resources/'));
  assert.deepEqual(leaked, [], 'files under resources/ are tracked');
});

test('CODEOWNERS assigns an owner to the whole repo', () => {
  assert.match(read('.github/CODEOWNERS'), /^\*\s+@\S+/m);
});
