// Content rules: trilingual, accessible, and no internal project names.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { attrValues, readPage } from './helpers.mjs';

const html = readPage('index.html');
const visibleText = html.replace(/<script[\s\S]*?<\/script>/g, '');

test('page has title, description and language', () => {
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<title>[^<]{10,}<\/title>/);
  assert.match(html, /<meta name="description" content="[^"]{50,}">/);
});

test('every translatable element has a Spanish version', () => {
  const es = attrValues(html, 'data-es');
  assert.ok(es.length > 50, 'expected the page to be translated');
  es.forEach((value, i) => assert.ok(value.trim(), `empty data-es attribute #${i}`));
});

test('every translatable element also has an Italian version', () => {
  const tags = html.match(/<[^>]*\sdata-es="[^"]*"[^>]*>/g);
  for (const tag of tags) {
    assert.match(tag, /\sdata-it="[^"]*\S[^"]*"/, `missing or empty data-it: ${tag.slice(0, 120)}`);
  }
});

test('language switcher offers English, Spanish and Italian', () => {
  for (const lang of ['en', 'es', 'it']) {
    assert.match(html, new RegExp(`data-lang="${lang}"`), `no ${lang} button`);
  }
});

test('elements the scripts rely on are present', () => {
  for (const id of ['langToggle', 'themeToggle', 'menuToggle', 'navLinks', 'graph', 'earlierToggle',
    'carouselTrack', 'carouselPrev', 'carouselNext', 'carouselCount', 'carouselDots',
    'photosTrack', 'photosPrev', 'photosNext', 'photosDots']) {
    assert.ok(html.includes(`id="${id}"`), `missing #${id}`);
  }
});

test('images have alt text and explicit dimensions', () => {
  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
    assert.match(tag, /\salt="/, `image without alt: ${tag}`);
    assert.match(tag, /\swidth="\d+"/, `image without width: ${tag}`);
    assert.match(tag, /\sheight="\d+"/, `image without height: ${tag}`);
  }
});

test('projects carousel links each live project to its GitHub repo in a new tab', () => {
  const slides = [...html.matchAll(/<(a|div) class="project[^"]*"[^>]*>/g)].map((m) => m[0]);
  assert.ok(slides.length >= 2, 'expected several projects so the carousel makes sense');
  for (const repo of ['trading_advisor', 'rag_system', 'llmops-platform']) {
    const card = slides.find((s) => s.includes(`github.com/manu-gt-hub/${repo}"`));
    assert.ok(card, `missing project card for ${repo}`);
    assert.match(card, /target="_blank"/, `${repo} should open in a new tab`);
  }
  for (const card of slides.filter((s) => s.startsWith('<a'))) {
    assert.match(card, /href="https:\/\/github\.com\/manu-gt-hub\/[\w.-]+"/, `project links must point to a repo: ${card}`);
  }
});

test('the old architecture sandbox section is gone', () => {
  assert.ok(!html.includes('id="sandbox"'), 'sandbox section should be replaced by projects');
  assert.match(html, /href="#projects"/, 'nav must link to the projects section');
});

// Companies and clients may be named; internal project names may not.
const FORBIDDEN_PROJECTS = ['SHERPA', 'MPRS', 'NeTAMPS', 'Geoban', 'A400M', 'C295', 'Accident Business Steering'];

test('no internal project names are published', () => {
  for (const name of FORBIDDEN_PROJECTS) {
    assert.ok(!new RegExp(`\\b${name}\\b`, 'i').test(visibleText), `project name found: ${name}`);
  }
});

test('team size is stated as approx. 8 people', () => {
  assert.ok(!/~10|10 people|10 personas/.test(visibleText), 'outdated team size (~10)');
  assert.match(visibleText, /8 people/);
});
