// Rules from AGENTS.md that are easy to break by accident.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { elements, readPage } from './helpers.mjs';

const html = readPage('index.html');
const cards = elements(html, /^<(a|div) class="project"/);

test('Trading Advisor is the last project in the carousel', () => {
  assert.ok(cards.length >= 3, 'expected at least three project cards');
  assert.match(cards.at(-1).html, /<h3[^>]*>Trading Advisor\b/);
});

// A backtest return on its own invites scepticism: show the out-of-sample figure and its limits
test('Trading Advisor shows its backtest with the out-of-sample figure and its limitations', () => {
  const card = cards.find((c) => /<h3[^>]*>Trading Advisor\b/.test(c.html));
  for (const text of ['out-of-sample', 'below buy-and-hold', 'not a promise of returns']) {
    assert.ok(card.html.includes(text), `Trading Advisor: missing "${text}"`);
  }
});

// Recruiters and business readers do not know the jargon: explain it in brackets the first time
// it appears and again in the current role (the part most people read). Later mentions stay bare,
// so the same explanation is not repeated across the page.
test('harness engineering and agentic ops are explained in plain words where they first appear and in the current role', () => {
  const prose = html.replace(/<p class="chips[^"]*">[\s\S]*?<\/p>/g, '');
  const explained = (text, term) => text.toLowerCase().includes(`${term} (`);
  for (const term of ['harness engineering', 'agentic ops']) {
    const at = prose.toLowerCase().indexOf(term);
    assert.ok(at >= 0, `expected "${term}" on the page`);
    assert.ok(explained(prose.slice(at, at + term.length + 2), term), `the first "${term}" needs a plain-language explanation`);
  }
  const current = elements(prose, /^<li class="job job--current/)[0];
  assert.ok(current, 'expected the current role');
  assert.ok(explained(current.html, 'harness engineering'), 'the current role should explain harness engineering');
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

// Every card is a div holding a repository link and a docs link; the live demos add a demo link
test('every project card links to its repository and its docs, and the live demos to the demo', () => {
  for (const card of cards) {
    const name = card.html.match(/<h3[^>]*>([^<]+)/)?.[1].trim();
    assert.ok(card.html.startsWith('<div'), `${name}: a card with several links must be a div, not a link`);
    const hrefs = [...card.html.matchAll(/<a class="project__link" href="([^"]+)"/g)].map((m) => m[1]);
    const repo = hrefs.find((h) => /^https:\/\/github\.com\/manu-gt-hub\/[\w.-]+$/.test(h));
    assert.ok(repo, `${name}: no repository link`);
    assert.ok(hrefs.some((h) => h.startsWith(`${repo}/tree/main/doc`)), `${name}: no docs link inside its repository`);
    if (name === 'RAG System' || name === 'LLMOps Platform') {
      assert.ok(hrefs.some((h) => !h.includes('github.com')), `${name}: no live demo link`);
    }
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

// Roles fold to their title, company and dates; only the current one starts open
test('every role in the timeline is collapsible and only the current one starts open', () => {
  const jobs = elements(html, /^<li class="job[ "]/);
  assert.ok(jobs.length >= 2, 'expected the timeline roles');
  jobs.forEach((job, i) => {
    const title = job.html.match(/<h3[^>]*>([^<]+)/)?.[1].trim();
    const details = job.html.match(/<details class="job__details"( open)?>\s*<summary class="job__summary">\s*<h3/);
    assert.ok(details, `${title}: the role should be a details element with its title in the summary`);
    assert.equal(Boolean(details[1]), i === 0, `${title}: only the current role starts open`);
    assert.equal(job.html.includes('job--current'), i === 0, 'the first role is the current one');
  });
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

// Projects: open on wide screens, folded on phones, and the folded summary still names every project
test('projects sit in a fold that starts open and names every project in its summary', () => {
  const fold = elements(html, /^<details class="projects__fold" id="projectsFold" open>/)[0];
  assert.ok(fold, 'the projects carousel should be inside <details class="projects__fold" open>');
  assert.ok(fold.html.includes('id="carouselTrack"'), 'the carousel should be inside the fold');
  const summary = fold.html.match(/<summary class="projects__summary">([\s\S]*?)<\/summary>/)?.[1] ?? '';
  for (const card of cards) {
    const name = card.html.match(/<h3[^>]*>([^<]+)/)?.[1].trim();
    assert.ok(summary.includes(name), `the folded summary should name ${name}`);
  }
  const js = readPage('main.js');
  assert.match(js, /projectsFold\.open = !narrow\.matches/, 'main.js should fold the projects on phones');
  assert.match(js, /narrow\.addEventListener\('change'/, 'the fold should follow the width when the window is resized');
});

// Each fact has one home: the volume figures appear in the hero and in the role they belong to, no more
test('data volumes are not repeated across sections', () => {
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
  for (const [figure, max] of [['~8M', 2], ['~5M', 2], ['100–150K', 1]]) {
    const count = text.split(figure).length - 1;
    assert.ok(count <= max, `${figure} appears ${count} times in the English text (max ${max})`);
  }
});

// The projects section is parked (hidden, not deleted) until Manuel asks to show it again.
// Section and nav link go together; to show them, remove both `hidden` attributes and this test.
test('projects section and its nav link are hidden together', () => {
  assert.match(html, /<section class="section" id="projects" hidden>/, 'the projects section should be hidden');
  assert.match(html, /<a href="#projects"[^>]* hidden>/, 'the Projects nav link should be hidden with the section');
});
