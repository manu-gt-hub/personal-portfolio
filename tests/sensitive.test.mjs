// Nothing private ends up in git or on the public site.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { PUBLIC, ROOT, isText, publicFiles, trackedFiles } from './helpers.mjs';

const tracked = trackedFiles();
const textFiles = tracked.filter(isText).filter((f) => !f.startsWith('tests/'));
const contents = textFiles.map((f) => [f, readFileSync(join(ROOT, f), 'utf8')]);

test('no phone numbers in tracked files', () => {
  // Spanish mobile/landline, with or without +34 and separators
  const phone = /(\+34[\s.-]?)?\b[6-9]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/;
  for (const [file, text] of contents) {
    const hit = text.match(phone);
    assert.ok(!hit, `${file} contains what looks like a phone number: ${hit?.[0]}`);
  }
});

test('only the public contact email is published', () => {
  const allowed = new Set(['manugt2018@gmail.com', 'noreply@anthropic.com']);
  for (const [file, text] of contents) {
    for (const [email] of text.matchAll(/[\w.+-]+@[\w-]+\.[\w.]+/g)) {
      if (/\.(pptx?|docx?|xlsx?|pdf|png|jpe?g|webp|md)$/i.test(email)) continue; // file names like TOP@Expert.pptx
      assert.ok(allowed.has(email.toLowerCase()), `${file} contains unexpected email ${email}`);
    }
  }
});

const SECRETS = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key'],
  [/\bgh[pousr]_[A-Za-z0-9]{36,}\b/, 'GitHub token'],
  [/\bgithub_pat_[A-Za-z0-9_]{20,}/, 'GitHub token'],
  [/\bsk-(ant-)?[A-Za-z0-9_-]{20,}/, 'API key'],
  [/\bxox[abprs]-[A-Za-z0-9-]{10,}/, 'Slack token'],
  [/CLOUDFLARE_API_TOKEN\s*[=:]\s*\S+/, 'Cloudflare token'],
  [/(password|passwd|secret)\s*[=:]\s*["'][^"']+["']/i, 'hard-coded credential'],
];

test('no secrets or credentials in tracked files', () => {
  for (const [file, text] of contents) {
    for (const [re, label] of SECRETS) {
      assert.ok(!re.test(text), `${file} contains a ${label}`);
    }
  }
});

test('no env files or local config are tracked', () => {
  const bad = tracked.filter((f) => /(^|\/)(\.env(\..*)?|\.dev\.vars|\.wrangler\/.*)$/.test(f));
  assert.deepEqual(bad, []);
});

test('public/ only contains web file types', () => {
  const allowed = /\.(html|css|js|svg|webp|jpe?g|png|ico|pdf|txt|woff2?)$|^_headers$/;
  for (const f of publicFiles()) assert.match(f, allowed, `unexpected file type published: ${f}`);
});

test('source documents are never published', () => {
  for (const f of publicFiles()) {
    assert.ok(!/\.(pptx?|docx?|xlsx?)$/i.test(f), `office document published: ${f}`);
    assert.ok(!/linkedin|MGT_CV/i.test(f), `source file published: ${f}`);
  }
});

// The published CV had the phone number redacted (text removed, not covered).
// Its text is glyph-encoded, so it can't be scanned reliably here: the hash pins
// the verified file. If you replace the CV, redact it, verify it, then update this.
const CV_SHA256 = '91c37fd85c7c341a3e7d07cae04ba428ce9204569723989217525faac26ee34e';

test('published CV is the verified redacted version', () => {
  const pdfs = publicFiles().filter((f) => f.endsWith('.pdf'));
  assert.deepEqual(pdfs, ['assets/Manuel-Gutierrez-Torrero-CV.pdf'], 'only the redacted CV may be published');
  const hash = createHash('sha256').update(readFileSync(join(PUBLIC, pdfs[0]))).digest('hex');
  assert.equal(hash, CV_SHA256, 'CV changed: verify the redaction, then update CV_SHA256');
});

test('assets stay within the size budget', () => {
  let total = 0;
  for (const f of publicFiles()) {
    const size = statSync(join(PUBLIC, f)).size;
    total += size;
    if (f.startsWith('assets/')) assert.ok(size < 300_000, `${f} is ${Math.round(size / 1024)} KB (max 300 KB)`);
  }
  assert.ok(total < 2_000_000, `public/ is ${Math.round(total / 1024)} KB (max ~2 MB)`);
});
