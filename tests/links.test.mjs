// Every reference in the pages points to something that exists.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PAGES, attrValues, publicFiles, read, readPage } from './helpers.mjs';

const files = new Set(publicFiles());
const isExternal = (url) => /^(https?:|mailto:|tel:|data:)/.test(url);

function localRefs(html) {
  const srcsets = attrValues(html, 'srcset').flatMap((v) => v.split(',').map((s) => s.trim().split(/\s+/)[0]));
  return [...attrValues(html, 'href'), ...attrValues(html, 'src'), ...srcsets]
    .filter((u) => u && !u.startsWith('#') && !isExternal(u));
}

for (const page of PAGES) {
  test(`${page}: local files referenced by the page exist`, () => {
    const html = readPage(page);
    for (const ref of localRefs(html)) {
      const path = ref.split(/[?#]/)[0].replace(/^\//, '');
      if (path === '') continue; // link to the home page
      assert.ok(files.has(path), `${page} references missing file: ${ref}`);
    }
  });

  test(`${page}: in-page anchors point to existing ids`, () => {
    const html = readPage(page);
    const ids = new Set(attrValues(html, 'id'));
    for (const href of attrValues(html, 'href')) {
      if (href.startsWith('#') && href.length > 1) {
        assert.ok(ids.has(href.slice(1)), `${page}: no element with id "${href.slice(1)}"`);
      }
    }
  });
}

test('stylesheet url() references exist', () => {
  const css = read('public/styles.css');
  for (const [, url] of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    if (isExternal(url)) continue;
    assert.ok(files.has(url.replace(/^\//, '')), `styles.css references missing file: ${url}`);
  }
});

test('external links are HTTPS and new tabs use rel="noopener"', () => {
  const html = readPage('index.html');
  for (const [tag] of html.matchAll(/<a\b[^>]*>/g)) {
    const href = tag.match(/href="([^"]*)"/)?.[1] ?? '';
    assert.ok(!href.startsWith('http:'), `insecure link: ${href}`);
    if (tag.includes('target="_blank"')) {
      assert.match(tag, /rel="[^"]*noopener/, `missing rel="noopener": ${href}`);
    }
  }
});

test('profile links match the ones in AGENTS.md', () => {
  const html = readPage('index.html');
  for (const url of [
    'https://www.linkedin.com/in/manuel-g-118a947a/',
    'https://github.com/manu-gt-hub',
    'https://www.malt.com/es-es/profile/manuelgutierreztorrero',
  ]) {
    assert.ok(html.includes(url), `missing profile link ${url}`);
  }
});
