#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = join(__dirname, '..', 'dist');

const urls = ['/', '/index.html', '/manifest.json'];
const assetsDir = join(dist, 'assets');
if (existsSync(assetsDir)) readdirSync(assetsDir).forEach(f => urls.push(`/assets/${f}`));
const iconsDir = join(dist, 'icons');
if (existsSync(iconsDir)) readdirSync(iconsDir).forEach(f => urls.push(`/icons/${f}`));

const swPath = join(dist, 'sw.js');
if (!existsSync(swPath)) { console.log('sw.js not found in dist, skipping'); process.exit(0); }

let sw = readFileSync(swPath, 'utf-8');
sw = sw.replace('const PRECACHE_URLS = [];', `const PRECACHE_URLS = ${JSON.stringify(urls)};`);
writeFileSync(swPath, sw);
console.log(`✅ SW precache: ${urls.length} files`);
