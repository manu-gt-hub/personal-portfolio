import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const PUBLIC = join(ROOT, 'public');
export const PAGES = ['index.html', '404.html'];

export function read(path) {
  return readFileSync(join(ROOT, path), 'utf8');
}

/** All files under public/, as POSIX paths relative to public/. */
export function publicFiles(dir = PUBLIC) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return publicFiles(full);
    return [relative(PUBLIC, full).split(sep).join('/')];
  });
}

/** Files tracked by git (what actually gets pushed and deployed). */
export function trackedFiles() {
  return execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
}

const BINARY = /\.(pdf|webp|jpe?g|png|gif|ico|woff2?)$/i;
export function isText(path) {
  return !BINARY.test(path);
}

/** A page from public/ without HTML comments (they are never rendered). */
export function readPage(name) {
  return read(`public/${name}`).replace(/<!--[\s\S]*?-->/g, '');
}

/** Values of one attribute across a document, e.g. attrValues(html, 'href'). */
export function attrValues(html, attr) {
  const re = new RegExp(`\\s${attr}="([^"]*)"`, 'g');
  return [...html.matchAll(re)].map((m) => m[1]);
}

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
// Inside an <svg>, elements such as <path/> close themselves
const SELF_CLOSING = /\/\s*>$/;

/**
 * Walk the tags of a page (comments already removed). Calls onOpen(name, tag, index, depth)
 * and onClose(name, index, openIndex). Throws on a closing tag that does not match the open one,
 * and returns the tags left open at the end.
 */
export function walkTags(html, { onOpen = () => {}, onClose = () => {} } = {}) {
  const body = html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, (m) => m.replace(/[^\n]/g, ' '));
  const stack = [];
  for (const m of body.matchAll(/<\/?([a-zA-Z][\w-]*)\b[^>]*>/g)) {
    const [tag, rawName] = m;
    const name = rawName.toLowerCase();
    if (tag.startsWith('</')) {
      const open = stack.pop();
      if (!open || open.name !== name) {
        const line = body.slice(0, m.index).split('\n').length;
        throw new Error(`line ${line}: </${name}> closes <${open ? open.name : 'nothing'}>`);
      }
      onClose(name, m.index, open.index);
    } else if (name !== '!doctype' && !VOID.has(name) && !SELF_CLOSING.test(tag)) {
      onOpen(name, tag, m.index, stack.length);
      stack.push({ name, index: m.index });
    }
  }
  return stack.map((s) => s.name);
}

/** The outer HTML of every element whose opening tag matches `re`. */
export function elements(html, re) {
  const found = [];
  const starts = new Map();
  walkTags(html, {
    onOpen: (name, tag, index) => { if (re.test(tag)) starts.set(index, true); },
    onClose: (name, index, openIndex) => {
      if (starts.has(openIndex)) found.push({ start: openIndex, end: index + name.length + 3, html: html.slice(openIndex, index + name.length + 3) });
    },
  });
  return found.sort((a, b) => a.start - b.start);
}

/** wrangler.jsonc is JSON with // comments. */
export function readJsonc(path) {
  const text = read(path).replace(/^\s*\/\/.*$/gm, '');
  return JSON.parse(text);
}
