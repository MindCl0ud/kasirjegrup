# 🏬 Kasir JE Grup — v3.0 PWA

Sistem Manajemen Kasir & Stok untuk **JS Clothing** dan **JB Store**.  
Mendukung **100% offline** setelah setup awal.

---

## 📱 Akun Default

| Username     | Password  | Role  | Akses                    |
|--------------|-----------|-------|--------------------------|
| admin        | admin123  | Admin | JS Clothing + JB Store   |
| kasir.js     | kasir123  | Kasir | JS Clothing              |
| kasir.jb     | kasir123  | Kasir | JB Store                 |
| stok.js      | stok123   | Stok  | JS Clothing              |
| stok.jb      | stok123   | Stok  | JB Store                 |

---

## 🚀 CARA SETUP — Pilih salah satu

---

### 🅰 Vercel (Online + PWA) — ⭐ TERMUDAH

Deploy sekali → install ke tablet seperti aplikasi native.

```bash
# 1. Install dependencies
npm install

# 2. Download model wajah OFFLINE (perlu internet sekali)
node setup-models.js

# 3. Build
npm run build

# 4. Upload ke GitHub, lalu deploy ke vercel.com
```

**Di tablet:** Buka URL Vercel → browser akan minta "Install App" → **Add to Home Screen** → setelah itu bisa dibuka offline!

---

### 🅱 Jalankan Lokal (LAN/WiFi) — Tablet + Laptop/PC

Semua perangkat di jaringan WiFi yang sama, tanpa internet.

```bash
# 1. Di laptop/PC (jalankan SEKALI dengan internet)
npm install
node setup-models.js   ← download model AI offline (~6MB)
npm run build

# 2. Install server sederhana
npm install -g serve

# 3. Jalankan server lokal
serve dist -p 3000 --no-clipboard

# 4. Cek IP laptop Anda
# Windows: ipconfig
# Mac/Linux: ifconfig atau ip addr
# Contoh IP: 192.168.1.5

# 5. Di tablet: buka browser → ketik:
# http://192.168.1.5:3000
```

**Tidak perlu internet sama sekali setelah step 1!**

---

### 🅲 Tablet Windows (Standalone)

Jalankan langsung di tablet Windows tanpa server terpisah.

```bash
# Install Node.js di tablet: https://nodejs.org (unduh dulu dengan internet)
# Lalu:
npm install
node setup-models.js
npm run build
npm install -g serve
serve dist -p 3000

# Buka browser di tablet: http://localhost:3000
```

Buat shortcut di Desktop agar mudah dijalankan.

---

### 🅳 Mode USB / File Lokal (Tanpa Server)

```bash
# Build dulu
npm install && node setup-models.js && npm run build

# Folder dist/ siap dijalankan
# Copy ke USB / folder tablet
# CATATAN: Mode ini butuh server minimal, tidak bisa double-click index.html
# Gunakan cara 🅱 atau 🅲 di atas
```

---

## 📥 Download Model Wajah (Wajib untuk Offline)

```bash
node setup-models.js
```

Script ini mengunduh **7 file model AI** (~6MB total) ke folder `public/models/`.  
**Jalankan SEKALI saat ada internet**, setelah itu aplikasi bekerja 100% offline.

### File yang diunduh:
```
public/models/
├── face-api.js                                    (~900 KB)
├── tiny_face_detector_model-weights_manifest.json
├── tiny_face_detector_model-shard1               (~190 KB)
├── face_landmark_68_tiny_model-weights_manifest.json
├── face_landmark_68_tiny_model-shard1            (~330 KB)
├── face_recognition_model-weights_manifest.json
├── face_recognition_model-shard1                 (~5.5 MB)
└── face_recognition_model-shard2                 (~3.3 MB)
```

---

## 💻 Development (Testing Lokal)

```bash
npm install
node setup-models.js   # download model offline
npm run dev            # http://localhost:5173
```

---

## 📊 Fitur Lengkap

| Fitur                        | Keterangan |
|-----------------------------|------------|
| 🔐 Login + Verifikasi Wajah | Pegawai wajib scan wajah (admin bebas) |
| 👕 JS Clothing               | Produk konveksi terpisah |
| ✨ JB Store                  | Produk skincare terpisah |
| 🛒 Kasir                     | Scan barcode, keranjang, checkout |
| 📦 Manajemen Stok            | Tambah stok + update harga jual |
| 💰 HPP / Harga Modal         | Admin only — tersembunyi dari stok |
| 📊 Laporan Penjualan         | Pendapatan, HPP, laba, margin, grafik |
| 🕐 Absensi                   | Check-in/out otomatis, rekap bulanan |
| 📋 Log Stok                  | Histori semua perubahan stok |
| 🔗 Google Sheets             | Sinkron opsional (butuh internet) |
| 📱 PWA                       | Install ke Home Screen, 100% offline |

---

## 🌐 Status Online/Offline

| Komponen           | Offline | Keterangan |
|--------------------|---------|------------|
| Aplikasi utama     | ✅      | Setelah build / SW cache |
| Scan wajah (AI)    | ✅      | Setelah `node setup-models.js` |
| Google Fonts       | ✅      | Di-cache SW saat pertama load |
| Data (produk, trx) | ✅      | In-memory (RAM tablet) |
| Google Sheets sync | ⚠️      | Butuh internet, bersifat opsional |

---

## ⚠️ Catatan Penting

1. **Data disimpan di RAM** — jika tab browser ditutup, data reset ke default.  
   → Gunakan **Google Sheets sync** secara rutin untuk backup.  
   → Atau upgrade ke versi dengan database (SQLite/PocketBase) — minta ke developer.

2. **Izin kamera** — browser akan meminta izin kamera saat pertama kali login pegawai.  
   Klik "Allow/Izinkan".

3. **HTTPS wajib untuk kamera** di Vercel/server publik.  
   Untuk LAN lokal, gunakan IP langsung (http://192.168.x.x) — kamera tetap bekerja.

4. **Daftarkan wajah** pegawai via Admin → Tab Pengguna → tombol "Daftarkan Wajah"  
   sebelum pegawai pertama kali login.

---

## 🔧 Scripts

```bash
npm run dev        # Development server
npm run build      # Build untuk production
npm run preview    # Preview build hasil
node setup-models.js  # Download model wajah offline
```
