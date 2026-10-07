#!/usr/bin/env node
/**
 * Renders src/assets/og-default.svg to public/og-default.png (1200x630) with sharp.
 * Run after editing the SVG: node scripts/build-og-image.mjs
 *
 * sharp's SVG renderer can't read the site's .woff2 files, so IBM Plex Sans comes from
 * the @ibm/plex-sans devDependency: its WOFF files are unpacked to plain OpenType in a
 * temp dir and exposed to sharp through a temporary fontconfig file.
 */
import { mkdtempSync, readFileSync, writeFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';

const root = new URL('../', import.meta.url);
const fontDir = new URL('node_modules/@ibm/plex-sans/fonts/complete/woff/', root);
const fonts = ['IBMPlexSans-Regular.woff', 'IBMPlexSans-SemiBold.woff'];

// WOFF 1.0 -> sfnt: same tables, each optionally zlib-compressed, behind a 44-byte header.
function woffToSfnt(woff) {
  const numTables = woff.readUInt16BE(12);
  const tables = [];
  for (let i = 0; i < numTables; i++) {
    const e = 44 + i * 20;
    const [offset, compLength, origLength] = [woff.readUInt32BE(e + 4), woff.readUInt32BE(e + 8), woff.readUInt32BE(e + 12)];
    const raw = woff.subarray(offset, offset + compLength);
    tables.push({ tag: woff.subarray(e, e + 4), checksum: woff.readUInt32BE(e + 16), data: compLength < origLength ? inflateSync(raw) : raw });
  }
  const pad = (n) => (n + 3) & ~3;
  const size = 12 + 16 * numTables + tables.reduce((sum, t) => sum + pad(t.data.length), 0);
  const out = Buffer.alloc(size);
  woff.copy(out, 0, 4, 8); // sfnt flavor
  out.writeUInt16BE(numTables, 4);
  let entrySelector = Math.floor(Math.log2(numTables));
  out.writeUInt16BE(16 * 2 ** entrySelector, 6);
  out.writeUInt16BE(entrySelector, 8);
  out.writeUInt16BE(numTables * 16 - 16 * 2 ** entrySelector, 10);
  let offset = 12 + 16 * numTables;
  tables.forEach((t, i) => {
    const e = 12 + i * 16;
    t.tag.copy(out, e);
    out.writeUInt32BE(t.checksum, e + 4);
    out.writeUInt32BE(offset, e + 8);
    out.writeUInt32BE(t.data.length, e + 12);
    t.data.copy(out, offset);
    offset += pad(t.data.length);
  });
  return out;
}

const tmp = mkdtempSync(join(tmpdir(), 'og-fonts-'));
try {
  for (const f of fonts) writeFileSync(join(tmp, f.replace('.woff', '.otf')), woffToSfnt(readFileSync(new URL(f, fontDir))));
  writeFileSync(join(tmp, 'fonts.conf'), `<?xml version="1.0"?><fontconfig><dir>${tmp}</dir><cachedir>${tmp}/cache</cachedir></fontconfig>`);
  process.env.FONTCONFIG_FILE = join(tmp, 'fonts.conf');

  const { default: sharp } = await import('sharp'); // after FONTCONFIG_FILE is set
  const out = new URL('public/og-default.png', root);
  await sharp(readFileSync(new URL('src/assets/og-default.svg', root)))
    .png({ compressionLevel: 9, palette: true })
    .toFile(out.pathname);
  const { width, height } = await sharp(out.pathname).metadata();
  console.log(`Wrote public/og-default.png: ${width}x${height}, ${(statSync(out).size / 1024).toFixed(1)} KB`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
