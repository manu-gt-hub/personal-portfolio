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

/** wrangler.jsonc is JSON with // comments. */
export function readJsonc(path) {
  const text = read(path).replace(/^\s*\/\/.*$/gm, '');
  return JSON.parse(text);
}
