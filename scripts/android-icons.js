#!/usr/bin/env node
// Ikon launcher Android (APK) mengikuti logo sistem: public/icons/icon.svg
// Jalankan SETELAH `npx cap add android`:  npm run android-icons
// Menghasilkan: ikon adaptive (Android 8+), ikon legacy (kotak & bulat),
// dan menimpa ikon bawaan Capacitor. Warna latar dibaca dari rect#bg di icon.svg.
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Resvg } from '@resvg/resvg-js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const res = join(root, 'android/app/src/main/res');
if (!existsSync(res)) {
  console.error('android/ belum ada. Jalankan dulu: npx cap add android');
  process.exit(1);
}

const src = readFileSync(join(root, 'public/icons/icon.svg'), 'utf8');
const bg = (src.match(/<rect id="bg"[^>]*fill="(#[0-9A-Fa-f]{6})"/) || [])[1];
const glyph = (src.match(/<g id="icon">[\s\S]*<\/g>/) || [])[0];
if (!bg || !glyph) { console.error('icon.svg: rect#bg / g#icon tidak ditemukan'); process.exit(1); }

// Glyph "JE" menempati x 56–456, y 110–464 (pusat ≈ 256,287) dalam kanvas 512.
const place = (s) => `<g transform="translate(256 256) scale(${s}) translate(-256 -287)">${glyph.replace('<g id="icon">', '<g>')}`.concat('</g>');
const wrap = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${inner}</svg>`;

// Adaptive: foreground transparan, glyph di dalam safe zone (66/108 dp ≈ 61%)
const fgSvg    = wrap(place(0.70));
// Legacy kotak membulat & bulat
const squareSvg = wrap(`<rect width="512" height="512" rx="112" fill="${bg}"/>${place(0.80)}`);
const roundSvg  = wrap(`<circle cx="256" cy="256" r="256" fill="${bg}"/>${place(0.68)}`);

const png = (svg, size) =>
  new Resvg(svg, { fitTo: { mode: 'width', value: size }, font: { loadSystemFonts: false } }).render().asPng();

const dens = { mdpi: [48, 108], hdpi: [72, 162], xhdpi: [96, 216], xxhdpi: [144, 324], xxxhdpi: [192, 432] };
for (const [d, [legacy, fg]] of Object.entries(dens)) {
  const dir = join(res, `mipmap-${d}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'ic_launcher.png'), png(squareSvg, legacy));
  writeFileSync(join(dir, 'ic_launcher_round.png'), png(roundSvg, legacy));
  writeFileSync(join(dir, 'je_fg.png'), png(fgSvg, fg));
  // buang foreground bawaan Capacitor agar tidak tertinggal
  rmSync(join(dir, 'ic_launcher_foreground.png'), { force: true });
  console.log(`✓ mipmap-${d}  legacy ${legacy}px · adaptive fg ${fg}px`);
}

// Adaptive icon XML (menimpa bawaan Capacitor); nama resource unik agar tidak bentrok
const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/je_launcher_bg"/>
    <foreground android:drawable="@mipmap/je_fg"/>
</adaptive-icon>
`;
const v26 = join(res, 'mipmap-anydpi-v26');
mkdirSync(v26, { recursive: true });
writeFileSync(join(v26, 'ic_launcher.xml'), adaptive);
writeFileSync(join(v26, 'ic_launcher_round.xml'), adaptive);

const values = join(res, 'values');
mkdirSync(values, { recursive: true });
writeFileSync(join(values, 'je_colors.xml'),
`<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="je_launcher_bg">${bg}</color>
</resources>
`);
// Splash native (menimpa gambar splash bawaan Capacitor): latar pink + ikon di tengah
const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920"><rect width="1080" height="1920" fill="${bg}"/><g transform="translate(540 960) scale(1.1) translate(-256 -287)">${glyph.replace('<g id="icon">', '<g>')}</g></svg>`;
const splashPng = new Resvg(splashSvg, { fitTo: { mode: 'width', value: 1080 }, font: { loadSystemFonts: false } }).render().asPng();
{
  let n = 0;
  for (const d of readdirSync(res)) {
    if (!d.startsWith('drawable')) continue;
    const f = join(res, d, 'splash.png');
    if (existsSync(f)) { writeFileSync(f, splashPng); n++; }
  }
  console.log(`✓ splash native diganti (${n} file)`);
}

console.log(`✅ Ikon Android mengikuti logo sistem (latar ${bg})`);
