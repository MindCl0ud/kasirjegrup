// KASIR JE GRUP — Download Face-API Models
// Usage: node setup-models.js
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights";
const LIB  = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
const OUT  = path.join(__dirname, "public", "models");
const FILES = [
  "tiny_face_detector_model-weights_manifest.json",
  "tiny_face_detector_model-shard1",
  "face_landmark_68_tiny_model-weights_manifest.json",
  "face_landmark_68_tiny_model-shard1",
  "face_recognition_model-weights_manifest.json",
  "face_recognition_model-shard1",
  "face_recognition_model-shard2",
];

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const download = (url, dest) => new Promise((res, rej) => {
  const file = fs.createWriteStream(dest);
  https.get(url, r => {
    if (r.statusCode === 301 || r.statusCode === 302) {
      file.close(); fs.unlink(dest, ()=>{});
      return download(r.headers.location, dest).then(res).catch(rej);
    }
    r.pipe(file);
    file.on("finish", () => { file.close(); res(); });
  }).on("error", e => { fs.unlink(dest, ()=>{}); rej(e); });
});

async function main() {
  console.log("\n=== KASIR JE GRUP — Download Model Wajah ===\n");
  process.stdout.write("Downloading face-api.js...");
  await download(LIB, path.join(OUT, "face-api.js"));
  console.log(" OK");
  for (const f of FILES) {
    process.stdout.write(`Downloading ${f}...`);
    await download(`${BASE}/${f}`, path.join(OUT, f));
    console.log(" OK");
  }
  console.log("\nSelesai! Sekarang jalankan: npm run build\n");
}

main().catch(e => { console.error("Error:", e.message); process.exit(1); });
