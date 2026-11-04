// Rules from AGENTS.md that are easy to break by accident.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { elements, readPage } from './helpers.mjs';

const html = readPage('index.html');
const cards = elements(html, /^<(a|div) class="project"/);

test('Trading Advisor is the first project in the carousel', () => {
  assert.ok(cards.length >= 3, 'expected at least three project cards');
  assert.match(cards[0].html, /<h3[^>]*>Trading Advisor\b/);
});

test('project cards are labelled with their position, e.g. "RAG System, 2 of 3"', () => {
  cards.forEach((card, i) => {
    const label = card.html.match(/aria-label="([^"]*)"/)?.[1] ?? '';
    const title = card.html.match(/<h3[^>]*>([^<]+)/)?.[1].trim();
    assert.equal(label, `${title}, ${i + 1} of ${cards.length}`, `card ${i + 1} has a stale aria-label`);
  });
});

test('every project card has a status, title, description, facts and technologies', () => {
  for (const card of cards) {
    const name = card.html.match(/<h3[^>]*>([^<]+)/)?.[1].trim();
    for (const part of ['project__status', 'project__desc', 'project__facts', 'class="chips"']) {
      assert.ok(card.html.includes(part), `${name}: missing ${part}`);
    }
  }
});

// A card with a single destination is a link; a card with a demo is a div holding demo + repo links
test('a project card with several destinations is a div with a demo and a repository link', () => {
  for (const card of cards.filter((c) => c.html.startsWith('<div'))) {
    const hrefs = [...card.html.matchAll(/<a class="project__link" href="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(hrefs.some((h) => h.startsWith('https://github.com/manu-gt-hub/')), `no repository link: ${card.html.slice(0, 100)}`);
    assert.ok(hrefs.some((h) => !h.includes('github.com')), `no demo link: ${card.html.slice(0, 100)}`);
  }
});

test('unfinished projects show the "Work in progress" tag in the three languages, and only they do', () => {
  for (const card of cards) {
    const name = card.html.match(/<h3[^>]*>([^<]+)/)?.[1].trim();
    const wip = card.html.includes('status--wip');
    const badge = /<span class="project__badge mono" data-es="En desarrollo" data-it="In sviluppo">Work in progress<\/span>/.test(card.html);
    assert.equal(badge, wip, `${name}: the amber status dot and the "Work in progress" tag must go together`);
  }
});

// Older technology appears only inside the collapsed "Earlier career" rows
test('older technology stays inside Earlier career', () => {
  const earlier = elements(html, /^<div class="earlier">/);
  assert.equal(earlier.length, 1, 'expected one Earlier career block');
  const outside = html.slice(0, earlier[0].start) + html.slice(earlier[0].end);
  const text = outside.replace(/<script[\s\S]*?<\/script>/g, '');
  for (const tech of ['Hadoop', 'Cloudera', 'Kafka', 'Kudu', 'Sqoop', '\\.NET']) {
    assert.ok(!new RegExp(`\\b${tech}\\b|${tech}\\b`).test(text), `${tech.replace('\\', '')} appears outside Earlier career`);
  }
});

// What WhatsApp, LinkedIn and Slack show when the link is shared
test('link previews show the portfolio title, an absolute URL and no photo', () => {
  assert.match(html, /<meta property="og:title" content="Manuel Gutiérrez Torrero – Personal portfolio">/);
  // Some apps use the page title and description instead of the og: tags
  assert.match(html, /<title>Manuel Gutiérrez Torrero – Personal portfolio<\/title>/);
  assert.ok(!/<meta name="description" content="[^"]*Data &(amp;)? AI Architect/.test(html), 'the description should not use the "Data & AI Architect" title');
  assert.match(html, /<meta property="og:description" content="[^"]{20,}">/);
  assert.match(html, /<meta property="og:url" content="https:\/\/[^"]+\/">/);
  assert.ok(!html.includes('og:image'), 'link previews should not show a photo (og:image)');
});
