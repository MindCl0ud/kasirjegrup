import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

// Plugin: after build, inject file list into sw.js for precaching
const swPlugin = () => ({
  name: 'sw-precache',
  closeBundle() {
    try {
      const distDir = resolve(__dirname, 'dist');
      const assetsDir = resolve(distDir, 'assets');
      const fs = require('fs');
      
      // Collect all built asset filenames
      let assets = [];
      if (fs.existsSync(assetsDir)) {
        assets = fs.readdirSync(assetsDir).map(f => `/assets/${f}`);
      }
      
      const urlsToCache = ['/', '/index.html', '/manifest.json', ...assets];
      
      // Read sw.js from public (source)
      const swSrc = resolve(__dirname, 'public', 'sw.js');
      let sw = fs.readFileSync(swSrc, 'utf-8');
      
      // Inject the file list
      sw = sw.replace(
        'const PRECACHE_URLS = [];',
        `const PRECACHE_URLS = ${JSON.stringify(urlsToCache)};`
      );
      
      fs.writeFileSync(resolve(distDir, 'sw.js'), sw);
      console.log('✅ SW precache list injected:', urlsToCache.length, 'files');
    } catch(e) {
      console.warn('SW inject warning:', e.message);
    }
  }
});

export default defineConfig({
  plugins: [react(), swPlugin()],
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
