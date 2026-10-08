#!/usr/bin/env node
/**
 * Fails (exit 1) if any internal link in dist/ points to a page, file, or #anchor that
 * doesn't exist. Runs after `astro build` as part of `npm run build`.
 *
 * Checks every href="..." outside HTML comments, including <link> tags. Internal means a
 * root-relative path ("/x/"), a relative path, a bare "#anchor", or an absolute URL on
 * recastcalc.com. External URLs, mailto:, tel:, and javascript: are skipped.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative, posix } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const SITE_HOSTS = new Set(['recastcalc.com', 'www.recastcalc.com']);

const htmlFiles = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith('.html')) htmlFiles.push(p);
  }
})(DIST);

if (!htmlFiles.length) {
  console.error('check-links: no HTML files in dist/; run astro build first');
  process.exit(1);
}

// URL path of a built file: dist/a/b/index.html -> /a/b/, dist/404.html -> /404.html
const urlPathOf = (file) => {
  const rel = '/' + relative(DIST, file).split('\\').join('/');
  return rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel;
};

// Map a URL path to the file that would serve it, or null.
function resolveFile(urlPath) {
  const p = decodeURIComponent(urlPath);
  const candidates = p.endsWith('/') ? [p + 'index.html'] : [p, p + '/index.html', p + '.html'];
  for (const c of candidates) {
    const f = join(DIST, c);
    if (existsSync(f) && statSync(f).isFile()) return f;
  }
  return null;
}

const idCache = new Map();
function idsIn(file) {
  if (!idCache.has(file)) {
    const html = readFileSync(file, 'utf8');
    idCache.set(file, new Set([...html.matchAll(/\s(?:id|name)="([^"]+)"/g)].map((m) => m[1])));
  }
  return idCache.get(file);
}

const problems = [];
for (const file of htmlFiles) {
  const pagePath = urlPathOf(file);
  const html = readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  for (const [, rawHref] of html.matchAll(/\shref="([^"]*)"/g)) {
    const href = rawHref.replace(/&amp;/g, '&').trim();
    if (!href || /^(mailto:|tel:|javascript:|data:)/i.test(href)) continue;

    let target;
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) {
      const u = new URL(href, 'https://recastcalc.com');
      if (!SITE_HOSTS.has(u.hostname)) continue; // external
      target = u.pathname + u.hash;
    } else {
      target = href;
    }

    const [beforeHash, anchor] = target.split('#', 2);
    const pathOnly = beforeHash.split('?')[0];
    let targetFile = file;
    if (pathOnly) {
      const absolute = pathOnly.startsWith('/') ? pathOnly : posix.join(posix.dirname(pagePath.endsWith('/') ? pagePath + 'x' : pagePath), pathOnly);
      targetFile = resolveFile(absolute);
      if (!targetFile) {
        problems.push(`${pagePath}: ${rawHref} (no such page or file)`);
        continue;
      }
    }
    if (anchor && targetFile.endsWith('.html') && !idsIn(targetFile).has(decodeURIComponent(anchor))) {
      problems.push(`${pagePath}: ${rawHref} (no element with id "${anchor}")`);
    }
  }
}

if (problems.length) {
  console.error(`check-links: ${problems.length} broken internal link(s):`);
  for (const p of [...new Set(problems)].sort()) console.error(`  ${p}`);
  process.exit(1);
}
console.log(`check-links: ${htmlFiles.length} pages, no broken internal links`);
