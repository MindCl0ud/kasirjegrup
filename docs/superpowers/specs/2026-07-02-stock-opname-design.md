# Stock Opname — Kasir JE Grup

## 1. Ringkasan

Fitur opname (stock taking) untuk mencocokkan stok fisik dengan stok sistem, mencatat selisih, dan melakukan adjustment stok. Terintegrasi dengan sistem stok & log yang sudah ada.

## 2. Akses

- **Admin** — full akses (buat, edit, tutup sesi, apply adjustment)
- **Stok** — bisa membuat sesi dan input stok fisik, apply adjustment perlu logged

## 3. Data Flow

### 3.1 Firestore Collection

```
opnames/{opnameId}
  business: string         // JS_CLOTHING | JB_STORE
  pic: string              // nama user
  picId: string
  date: string             // tanggal opname (id-ID)
  dateISO: string
  status: string           // "open" | "closed" | "applied"
  totalItems: number
  totalOk: number
  totalKurang: number
  totalSurplus: number
  totalKurangUnit: number
  totalSurplusUnit: number
  createdAt: Timestamp
  updatedAt: Timestamp
  closedAt: Timestamp | null
  appliedAt: Timestamp | null

opnames/{opnameId}/items/{productId}
  productId: string
  barcode: string
  name: string
  category: string
  stockSystem: number      // stok dari sistem saat opname dibuat
  stockPhysical: number    // input stok fisik
  difference: number       // stockPhysical - stockSystem
  status: string           // "OK" | "Kurang" | "Surplus"
  notes: string            // keterangan
```

### 3.2 Firebase Functions Baru

```js
// Subscribe sesi opname
subscribeOpnames(cb)
subscribeOpnameItems(opnameId, cb)

// CRUD sesi
fbCreateOpname({ business, pic, picId, date, dateISO })
fbCloseOpname(opnameId, summary)
fbDeleteOpname(opnameId)

// Update item
fbUpdateOpnameItem(opnameId, productId, data)

// Apply adjustment — update stok produk + catat log
fbApplyOpnameAdjustments(opnameId, actor)
```

## 4. UI / Komponen

### 4.1 Navigasi

- **Admin**: tab "📋 Opname" di bottom nav + drawer menu
- **Stok**: tombol "📋 Opname" di layar stok (atau tab di dalamnya)

### 4.2 Halaman Opname

**Header Sesi:**
- PIC (auto dari user login)
- Pilih bisnis (dropdown JS Clothing / JB Store)
- Tanggal (date picker, default hari ini)
- Status sesi (OPEN badge / CLOSED badge)
- Tombol: ✏️ Edit, 🗑 Hapus (jika masih open)

**3 Tab di dalam halaman Opname:**

#### Tab 1: TEMPLATE OPNAME
- Daftar produk (No | Barcode | Nama | Stok Sistem | Stok Fisik | Selisih | Status | Keterangan)
- Warna baris: hijau (OK), merah (Kurang), kuning (Surplus)
- Input Stok Fisik: bisa diketik langsung, atau scan barcode untuk cari produk
- Pencarian/filter produk
- Tombol: ⬇ Export Excel, ⬆ Import Excel

#### Tab 2: RINGKASAN
- Total SKU diperiksa
- Item OK (hijau)
- Item Kurang (merah) — total unit
- Item Surplus (kuning) — total unit
- Pie chart atau bar chart per status
- Progress bar completeness

#### Tab 3: KARTU STOCK
- Filter per produk, range tanggal
- Tabel: Tanggal | Produk | Barang Masuk (D) | Barang Keluar (K) | Saldo (S) | Harga | Nilai
- Data dari agregasi `stockLogs` yang sudah ada
- Export Excel

### 4.3 Tombol Aksi

- **Tutup Sesi** — set status=closed, simpan summary (tidak bisa edit lagi)
- **Apply Adjustment** — update stok tiap produk yang selisih, catat ke stockLogs sebagai "opname", set status=applied
- **Export Excel** — download 4-sheet workbook (PETUNJUK, KARTU STOCK, TEMPLATE OPNAME, RINGKASAN)
- **Import Excel** — upload file, parse, map ke form opname, tampilkan review sebelum apply

### 4.4 Export Excel (4 Sheet)

1. **PETUNJUK** — cara pakai, warna status, formula
2. **KARTU STOCK** — data mutasi per produk di bisnis tersebut
3. **TEMPLATE OPNAME** — daftar produk + stok sistem (kolom Stok Fisik kosong siap diisi)
4. **RINGKASAN** — auto-summary via formula (sama seperti template asli)

### 4.5 Import Excel

- Upload file .xlsx atau .xlsm
- Parse sheet TEMPLATE OPNAME, kolom: Barcode/Nama (cocokkan), Stok Fisik, Keterangan
- Validasi: barcode harus ada di sistem, stok fisik harus angka
- Tampilkan preview: "X produk akan diupdate, Y barcode tidak ditemukan (skip)"
- Konfirmasi import → update item di sesi opname

## 5. Adjustment Stok

Saat "Apply Adjustment":
- Loop semua item dengan selisih ≠ 0
- Update `products/{id}.stock` = stockPhysical
- Buat `stockLogs/{id}` dengan type="opname", qty=selisih
- Catat activity log

## 6. Perubahan File

### `src/App.jsx`
- Tambah state: opnames, selectedOpname, opnameTab, dll
- Tambah subscribeOpnames di useEffect Firebase
- Tambah screen/panel opname: `OpnamePanel` komponen
- Tambah nav item "📋 Opname" untuk admin & stok
- Export/import Excel (SheetJS sudah ada di project)

### `src/firebase.js`
- Tambah fungsi: `subscribeOpnames`, `subscribeOpnameItems`
- Tambah fungsi: `fbCreateOpname`, `fbCloseOpname`, `fbDeleteOpname`
- Tambah fungsi: `fbUpdateOpnameItem`
- Tambah fungsi: `fbApplyOpnameAdjustments`

## 7. Urutan Implementasi

1. Tambah fungsi Firebase (firebase.js)
2. Komponen OpnamePanel + sub-komponen (template opname, ringkasan, kartu stock)
3. Navigasi & routing (integrasi ke admin & stok screen)
4. Export Excel (4 sheet)
5. Import Excel (parse & preview)
6. Apply adjustment + logging
