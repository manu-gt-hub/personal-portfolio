// The pages are well-formed HTML, so a broken edit fails here instead of rendering oddly.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PAGES, attrValues, read, readPage, walkTags } from './helpers.mjs';

for (const page of PAGES) {
  const html = readPage(page);

  test(`${page}: every tag is closed in the right order`, () => {
    const left = walkTags(html);
    assert.deepEqual(left, [], `${page}: tags left open: ${left.join(', ')}`);
  });

  test(`${page}: ids are unique`, () => {
    const ids = attrValues(html, 'id');
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    assert.deepEqual(dupes, [], `${page}: duplicate ids`);
  });

  // A link inside a link is invalid HTML: browsers split the outer one and the card breaks
  test(`${page}: no links or buttons nested inside a link`, () => {
    const openLinks = [];
    walkTags(html, {
      onOpen: (name, tag, index) => {
        if ((name === 'a' || name === 'button') && openLinks.length) {
          assert.fail(`${page}: <${name}> inside <a>: ${tag.slice(0, 120)}`);
        }
        if (name === 'a') openLinks.push(index);
      },
      onClose: (name) => { if (name === 'a') openLinks.pop(); },
    });
  });

  test(`${page}: buttons declare their type`, () => {
    for (const [tag] of html.matchAll(/<button\b[^>]*>/g)) {
      assert.match(tag, /\stype="(button|submit|reset)"/, `${page}: button without type: ${tag.slice(0, 120)}`);
    }
  });
}

test('styles.css has balanced braces', () => {
  const css = read('public/styles.css').replace(/\/\*[\s\S]*?\*\//g, '').replace(/"[^"]*"|'[^']*'/g, '""');
  let depth = 0;
  for (const [i, ch] of [...css].entries()) {
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    assert.ok(depth >= 0, `styles.css: unexpected } near line ${css.slice(0, i).split('\n').length}`);
  }
  assert.equal(depth, 0, 'styles.css: a { is never closed');
});
