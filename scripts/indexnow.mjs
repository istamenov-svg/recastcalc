#!/usr/bin/env node
/**
 * Submits every sitemap URL to IndexNow once the expected commit is live.
 * Run by .github/workflows/indexnow.yml.
 *
 * Env: TARGET_SHA (required), SITE_URL and INDEXNOW_ENDPOINT (defaults below),
 * WAIT_SECONDS (default 900), POLL_SECONDS (default 20).
 * Exits 1 if the deploy never shows TARGET_SHA or IndexNow does not return 200/202.
 */
import { readdirSync, readFileSync } from 'node:fs';

const SITE_URL = (process.env.SITE_URL ?? 'https://recastcalc.com').replace(/\/$/, '');
const ENDPOINT = process.env.INDEXNOW_ENDPOINT ?? 'https://api.indexnow.org/indexnow';
const TARGET_SHA = process.env.TARGET_SHA;
const WAIT_SECONDS = Number(process.env.WAIT_SECONDS ?? 900);
const POLL_SECONDS = Number(process.env.POLL_SECONDS ?? 20);

if (!TARGET_SHA) {
  console.error('TARGET_SHA is not set');
  process.exit(1);
}

// The key file is public/<32 hex>.txt containing the key itself.
const keyFile = readdirSync(new URL('../public/', import.meta.url)).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) {
  console.error('No IndexNow key file (public/<32 hex>.txt) found');
  process.exit(1);
}
const key = readFileSync(new URL(`../public/${keyFile}`, import.meta.url), 'utf8').trim();

const sleep = (s) => new Promise((resolve) => setTimeout(resolve, s * 1000));
// Before a deploy lands, /version.txt can return a whole HTML page; keep logs short.
const short = (s) => (s.length > 80 ? `${s.slice(0, 80)}... (${s.length} chars)` : s);
const fetchText = async (path) => {
  const res = await fetch(`${SITE_URL}${path}?t=${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' } });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return (await res.text()).trim();
};

const deadline = Date.now() + WAIT_SECONDS * 1000;
let live = '';
while (true) {
  live = await fetchText('/version.txt').catch((e) => `error (${e.message})`);
  if (live === TARGET_SHA) break;
  if (Date.now() >= deadline) {
    console.error(`Deploy not live after ${WAIT_SECONDS}s: /version.txt is ${short(live)}, expected ${TARGET_SHA}`);
    process.exit(1);
  }
  console.log(`Waiting for deploy: live ${short(live)}, expected ${TARGET_SHA}`);
  await sleep(POLL_SECONDS);
}
console.log(`Deploy live: ${live}`);

const liveKey = await fetchText(`/${key}.txt`);
if (liveKey !== key) {
  console.error(`Key file at ${SITE_URL}/${key}.txt does not match the key`);
  process.exit(1);
}

const sitemap = await fetchText('/sitemap-0.xml');
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!urlList.length) {
  console.error('No URLs found in sitemap-0.xml');
  process.exit(1);
}

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: new URL(SITE_URL).host,
    key,
    keyLocation: `${SITE_URL}/${key}.txt`,
    urlList,
  }),
});
const body = await res.text();
console.log(`IndexNow response: HTTP ${res.status} for ${urlList.length} URLs${body ? `: ${body.slice(0, 500)}` : ''}`);
if (res.status !== 200 && res.status !== 202) process.exit(1);
