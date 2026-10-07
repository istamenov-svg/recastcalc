#!/usr/bin/env node
/**
 * Renders public/favicon.svg onto an opaque 180x180 cream square as public/apple-touch-icon.png.
 * iOS fills transparent areas with black, so the background must be opaque.
 * Run after changing the favicon: node scripts/build-apple-touch-icon.mjs
 */
import sharp from 'sharp';
import { readFileSync, statSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const SIZE = 180;
const MARK = 132; // mark size inside the square, leaving padding for iOS rounded corners
const BACKGROUND = '#FAF7F2'; // site cream

const mark = await sharp(readFileSync(new URL('public/favicon.svg', root)), { density: 600 })
  .resize(MARK, MARK, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

const out = new URL('public/apple-touch-icon.png', root).pathname;
// sharp applies composite last, so flatten to an opaque RGB image in a second pass.
const composed = await sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: BACKGROUND } })
  .composite([{ input: mark, gravity: 'center' }])
  .png()
  .toBuffer();
await sharp(composed).flatten({ background: BACKGROUND }).removeAlpha().png({ compressionLevel: 9 }).toFile(out);

const { width, height, channels, hasAlpha } = await sharp(out).metadata();
console.log(`Wrote public/apple-touch-icon.png: ${width}x${height}, channels ${channels}, alpha ${hasAlpha}, ${(statSync(out).size / 1024).toFixed(1)} KB`);
