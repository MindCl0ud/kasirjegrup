#!/usr/bin/env node
// Render ulang seluruh PNG ikon (favicon, apple-touch, manifest, maskable)
// dari satu sumber: public/icons/icon.svg — jalankan: npm run icons
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Resvg } from '@resvg/resvg-js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'public/icons');
const src = readFileSync(join(dir, 'icon.svg'), 'utf8');
const PINK = '#C2185B'; // warna latar baru (palet pink & kuning)

// Latarnya dibuat full-bleed (tanpa sudut membulat) untuk ikon yang di-mask sistem.
const fullBleed = (svg, scale = 1, pad = 0) => svg
  .replace(/<rect id="bg"[^>]*\/>/, `<rect id="bg" width="512" height="512" fill="${PINK}"/>`)
  .replace('<g id="icon">', `<g id="icon" transform="translate(${pad} ${pad}) scale(${scale})">`);

const jobs = [
  ...[72, 96, 128, 144, 152, 192, 384, 512].map(s => [`icon-${s}.png`, src, s]),
  ['apple-touch-icon.png', fullBleed(src, 0.9, 25.6), 180],
  ['icon-maskable-192.png', fullBleed(src, 0.78, 56.3), 192],
  ['icon-maskable-512.png', fullBleed(src, 0.78, 56.3), 512],
];

for (const [name, svg, size] of jobs) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size }, font: { loadSystemFonts: false } })
    .render().asPng();
  writeFileSync(join(dir, name), png);
  console.log(`✓ ${name} ${size}x${size} (${png.length} B)`);
}
