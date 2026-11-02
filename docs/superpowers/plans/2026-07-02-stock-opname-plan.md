# Stock Opname Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add stock opname (stock taking) feature with session management, physical stock input (manual/scan/Excel import), stock card, summary, and stock adjustment.

**Architecture:** Extend existing all-in-one `App.jsx` + `firebase.js` pattern. Opname data stored in Firestore under `opnames/{id}` collection with subcollection `items`. Kartu Stok aggregates from existing `stockLogs`.

**Tech Stack:** React 18, Firebase Firestore, SheetJS (xlsx) via CDN (already loaded in app)

**No test framework** — project uses no test runner. Manual verification steps instead.

---

### Global Constraints

- All code goes in existing `src/App.jsx` and `src/firebase.js` (follow existing all-in-one pattern)
- SheetJS loaded from CDN — use existing `loadSheetJS()` helper
- All text in Bahasa Indonesia
- Follow existing dark/light theme via `C` color tokens
- Stock change reasons use log type `"opname"`

---

### Task 1: Add Firebase Opname Functions

**Files:**
- Modify: `src/firebase.js` (append before the final export lines)

**Interfaces:**
- Produces: `subscribeOpnames`, `subscribeOpnameItems`, `fbCreateOpname`, `fbCloseOpname`, `fbDeleteOpname`, `fbUpdateOpnameItem`, `fbBulkUpdateOpnameItems`, `fbApplyOpnameAdjustments`

- [ ] **Step 1: Add subscribe functions**

After existing `subscribeTargets` block, add:

```js
export const subscribeOpnames = (cb) => onSnapshot(
  query(collection(_db,"opnames"), orderBy("createdAt","desc"), limit(50)),
  s=>cb(s.docs.map(d=>({...d.data(),id:d.id}))), console.warn
);
export const subscribeOpnameItems = (opnameId, cb) => onSnapshot(
  collection(_db,"opnames",opnameId,"items"),
  s=>cb(s.docs.map(d=>({...d.data(),id:d.id}))), console.warn
);
```

- [ ] **Step 2: Add CRUD functions**

```js
export const fbCreateOpname = async (data) => {
  const id = "OPN-" + Date.now().toString(36).toUpperCase();
  await setDoc(doc(_db,"opnames",id), {
    ...data,
    id,
    status:"open",
    totalItems:0, totalOk:0, totalKurang:0, totalSurplus:0,
    totalKurangUnit:0, totalSurplusUnit:0,
    createdAt:serverTimestamp(), updatedAt:serverTimestamp(),
    closedAt:null, appliedAt:null,
  });
  return id;
};

export const fbCloseOpname = async (id, summary) =>
  setDoc(doc(_db,"opnames",id), { ...summary, status:"closed", closedAt:serverTimestamp(), updatedAt:serverTimestamp() }, { merge:true });

export const fbDeleteOpname = async (id) => {
  const snap = await getDocs(collection(_db,"opnames",id,"items"));
  const batch = writeBatch(_db);
  snap.docs.forEach(d => batch.delete(d.ref));
  batch.delete(doc(_db,"opnames",id));
  await batch.commit();
};

export const fbUpdateOpnameItem = async (opnameId, pid, data) =>
  setDoc(doc(_db,"opnames",opnameId,"items",String(pid)), data, { merge:true });
```

- [ ] **Step 3: Add bulk update and apply adjustment**

```js
export const fbBulkUpdateOpnameItems = async (opnameId, items) => {
  const batch = writeBatch(_db);
  items.forEach(item =>
    batch.set(doc(_db,"opnames",opnameId,"items",String(item.productId)), item, { merge:true })
  );
  await batch.commit();
};

export const fbApplyOpnameAdjustments = async (opnameId, actor) => {
  const snap = await getDocs(collection(_db,"opnames",opnameId,"items"));
  const adjustments = snap.docs.map(d => d.data()).filter(d => d.difference !== 0);
  if (!adjustments.length) return;

  const batch = writeBatch(_db);
  const logs = [];

  adjustments.forEach(item => {
    batch.set(doc(_db,"products",String(item.productId)), { stock: item.stockPhysical }, { merge:true });
    const logId = "LOG-" + Date.now().toString(36) + Math.random().toString(36).slice(2,5);
    const log = {
      id:logId, date:new Date().toLocaleString("id-ID"),
      barcode:item.barcode, name:item.name,
      type:"opname", qty:Math.abs(item.difference),
      before:item.stockSystem, after:item.stockPhysical,
      by:actor, business:item.business,
      opnameId,
    };
    batch.set(doc(_db,"stockLogs",logId), { ...log, createdAt:serverTimestamp() });
    logs.push(log);
  });

  batch.set(doc(_db,"opnames",opnameId), {
    status:"applied", appliedAt:serverTimestamp(), updatedAt:serverTimestamp()
  }, { merge:true });

  await batch.commit();
  await fbLogActivity(actor,"Opname Apply",`Sesi ${opnameId}: ${adjustments.length} produk disesuaikan`);
};
```

- [ ] **Step 4: Verify by checking syntax**

Run: `npx vite build` (should compile without firebase.js errors)

---

### Task 2: Add Opname State & Subscriptions to App

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: firebase functions from Task 1
- Produces: `opnames`, `selectedOpname`, `opnameItems` state + handlers

- [ ] **Step 1: Add state variables** (after existing `const [slogType,setSlogType]=useState("ALL");` around line 1537)

```js
// ─── Opname state ───
const [opnames, setOpnames] = useState([]);
const [opnameItems, setOpnameItems] = useState([]);
const [selectedOpname, setSelectedOpname] = useState(null);
const [opnameTab, setOpnameTab] = useState("opname"); // "opname" | "ringkasan" | "kartustok"
const [opnameBiz, setOpnameBiz] = useState(null);
const [showCreateOpname, setShowCreateOpname] = useState(false);
const [showImportOpname, setShowImportOpname] = useState(false);
const [importOpnameRows, setImportOpnameRows] = useState([]);
```

- [ ] **Step 2: Add subscription** (in existing useEffect after other subscriptions, around line 1341)

```js
subscribeOpnames(d => setOpnames(d)),
```

- [ ] **Step 3: Add useEffect to subscribe items when a session is selected**

```js
useEffect(() => {
  if (!selectedOpname || !fbReady) { setOpnameItems([]); return; }
  const unsub = subscribeOpnameItems(selectedOpname, d => setOpnameItems(d));
  return () => unsub();
}, [selectedOpname, fbReady]);
```

- [ ] **Step 4: Verify** — run `npm run build`, no errors

---

### Task 3: Create OpnamePanel Component

**Files:**
- Modify: `src/App.jsx` (add component + render block)

**Interfaces:**
- Consumes: `opnames`, `opnameItems`, `selectedOpname`, bizProds, prods, user, etc.
- Produces: `<OpnamePanel>` component rendered in admin tab

- [ ] **Step 1: Add OpnamePanel component** (after existing `KasirStokPanel` component, around line 1243)

```jsx
function OpnamePanel({
  opnames, opnameItems, selectedOpname, setSelectedOpname,
  opnameTab, setOpnameTab, showCreateOpname, setShowCreateOpname,
  showImportOpname, setShowImportOpname, importOpnameRows, setImportOpnameRows,
  bizProds, prods, user, biz, toast, rp, uid, nowStr,
  fbCreateOpname, fbCloseOpname, fbDeleteOpname, fbUpdateOpnameItem,
  fbBulkUpdateOpnameItems, fbApplyOpnameAdjustments,
  slogs, loadSheetJS, downloadXLSX, BIZ, C, F,
}) {
  // ... component body
}
```

The component body will have:

**State:**
```js
const [opnameForm, setOpnameForm] = useState({ business: "JS_CLOTHING", date: new Date().toISOString().slice(0,10), notes: "" });
const [physInput, setPhysInput] = useState({}); // { productId: stockPhysical }
const [notesInput, setNotesInput] = useState({}); // { productId: notes }
const [searchQ, setSearchQ] = useState("");
const [activeSession, setActiveSession] = useState(null); // untuk opname yg sedang dibuat
```

**Sub-renders:**

**a) CreateOpnameForm** — modal/drawer to create new session:
```
PIC: {user.name} (auto)
Bisnis: [JS Clothing ▼] [JB Store ▼]
Tanggal: [date picker]
[Cancel] [Buat Sesi]
```

**b) SessionSelector** — list of existing sessions:
```
📋 Opname Sessions
[⬜ JS Clothing — 02/07/2026 — PIC: Admin] [OPEN]
[⬜ JB Store — 01/07/2026 — PIC: Stok JB] [CLOSED]
[...]
[+ Buat Sesi Baru]
```

**c) OpnameTabs** — when a session is selected:
```
[TEMPLATE OPNAME] [RINGKASAN] [KARTU STOCK]
```

**d) TemplateOpnameTab** — product list with physical stock input:
```
Header: No | Barcode | Nama | Stok Sistem | Stok Fisik | Selisih | Status | Keterangan
[Search input] [⬇ Export Excel] [⬆ Import Excel]

Row colors: hijau bg jika OK, merah bg jika Kurang, kuning bg jika Surplus
```

**e) RingkasanTab** — summary:
```
Total SKU diperiksa: X
Item OK: X (hijau)
Item Kurang: X — total -Y unit (merah)
Item Surplus: X — total +Z unit (kuning)
[Tutup Sesi] [Apply Adjustment]
```

**f) KartuStockTab** — stock card from slogs aggregation:
```
Filter: [produk ▼] [dari] [sampai]
Tabel: Tanggal | Produk | Masuk (D) | Keluar (K) | Saldo (S) | Harga | Nilai
[⬇ Export Excel]
```

**g) ImportOpnameModal** — upload + parse + preview:
```
Upload .xlsx → parse TEMPLATE OPNAME sheet → preview rows → konfirmasi
```

- [ ] **Step 2: Render OpnamePanel when adminTab==="opname"**

In the admin render section, add:
```jsx
{adminTab==="opname"&&<OpnamePanel ... />}
```

- [ ] **Step 3: Add "📋 Opname" tab to TABS, BNAV_TABS, MORE_TABS arrays**

In TABS:
```js
{id:"opname", l:"📋 Opname"},
```

In BNAV_TABS (replace existing more-tab entry for extra space, or add as 5th):
Actually, BNAV_TABS only has 4 items. Since opname is important, let me put it in MORE_TABS:
```js
{id:"opname", ic:"📋", label:"Opname"},
```

- [ ] **Step 4: Verify**

Run: `npm run build` — no errors

---

### Task 4: Implement TemplateOpnameTab — Physical Stock Input

**Files:**
- Modify: `src/App.jsx` (inside OpnamePanel component)

- [ ] **Step 1: Add product table with inline stock input**

```jsx
function TemplateOpnameTab({ opnameItems, bizProds, physInput, setPhysInput, notesInput, setNotesInput, searchQ, setSearchQ, C, F, rp, uid, toast, fbUpdateOpnameItem, selectedOpname, showImportOpname, setShowImportOpname, importOpnameRows, setImportOpnameRows, loadSheetJS, downloadXLSX, BIZ }) {
  const filtered = bizProds().filter(p => !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase()) || p.barcode.includes(searchQ));
  // ... table with Stok Fisik input per row
}
```

Each row:
```
| {p.barcode} | {p.name} | {stockSystem} | [input: stock fisik] | {difference} | {status badge} | [input: notes] |
```

Physical stock input uses controlled state `physInput[productId]`.

Calculate difference/status inline:
```js
const sys = p.stock;
const phys = physInput[p.id] !== undefined ? Number(physInput[p.id]) : opnameItems.find(i => i.productId === p.id)?.stockPhysical;
const diff = phys !== undefined ? phys - sys : 0;
const status = phys === undefined ? "" : diff === 0 ? "OK" : diff > 0 ? "Surplus" : "Kurang";
```

Save on blur or on change with debounce:
```js
const handlePhysChange = (p, val) => {
  setPhysInput(prev => ({ ...prev, [p.id]: val }));
};
```

- [ ] **Step 2: Integrate with save to Firestore** (debounced, auto-save)

```js
const saveTimerRef = useRef(null);
const handlePhysBlur = (p) => {
  const val = physInput[p.id];
  if (val === undefined || val === "") return;
  const diff = Number(val) - p.stock;
  const status = diff === 0 ? "OK" : diff > 0 ? "Surplus" : "Kurang";
  fbUpdateOpnameItem(selectedOpname, p.id, {
    productId: p.id, barcode: p.barcode, name: p.name, category: p.category,
    business: p.business,
    stockSystem: p.stock, stockPhysical: Number(val),
    difference: diff, status, notes: notesInput[p.id] || "",
  });
};
```

- [ ] **Step 3: Summary bar** above the table

```jsx
const items = opnameItems;
const ok = items.filter(i => i.status === "OK").length;
const kurang = items.filter(i => i.status === "Kurang").length;
const surplus = items.filter(i => i.status === "Surplus").length;
const kurangUnit = items.filter(i => i.status === "Kurang").reduce((s,i) => s + Math.abs(i.difference), 0);
const surplusUnit = items.filter(i => i.status === "Surplus").reduce((s,i) => s + i.difference, 0);

<div style={{display:"flex", gap:10}}>
  <Stat icon="🟢" label="OK" value={ok} color={C.g}/>
  <Stat icon="🔴" label="Kurang" value={kurang} color={C.r} sub={`-${kurangUnit} unit`}/>
  <Stat icon="🟡" label="Surplus" value={surplus} color={C.a} sub={`+${surplusUnit} unit`}/>
</div>
```

- [ ] **Step 4: Verify** — tap around in dev mode, check state updates

---

### Task 5: Implement RingkasanTab & Session Actions

**Files:**
- Modify: `src/App.jsx` (inside OpnamePanel)

- [ ] **Step 1: RingkasanTab component**

```jsx
function RingkasanTab({ opnameItems, selectedOpname, user, toast, fbCloseOpname, fbApplyOpnameAdjustments, C, F, rp }) {
  // calculate from opnameItems
  // Show total SKU, OK, Kurang, Surplus counts + unit totals
  // Button: Tutup Sesi (sets status=closed)
  // Button: Apply Adjustment (bulk update stock)
  // Button: Export Excel
}
```

Summary cards:
```jsx
const items = opnameItems;
const total = items.length;
const ok = items.filter(i => i.status === "OK").length;
const kurang = items.filter(i => i.status === "Kurang");
const surplus = items.filter(i => i.status === "Surplus");
const kurangUnit = kurang.reduce((s,i) => s + Math.abs(i.difference), 0);
const surplusUnit = surplus.reduce((s,i) => s + i.difference, 0);
const session = opnames.find(o => o.id === selectedOpname);
const isClosed = session?.status === "closed" || session?.status === "applied";
```

Action buttons with confirmation:
```jsx
const handleClose = async () => {
  if (!confirm("Tutup sesi opname? Tidak bisa edit lagi setelah ditutup.")) return;
  await fbCloseOpname(selectedOpname, {
    totalItems: total, totalOk: ok, totalKurang: kurang.length, totalSurplus: surplus.length,
    totalKurangUnit: kurangUnit, totalSurplusUnit: surplusUnit,
  });
  toast("Sesi opname ditutup");
};

const handleApply = async () => {
  if (!confirm("Apply adjustments? Stok sistem akan diupdate sesuai stok fisik.")) return;
  await fbApplyOpnameAdjustments(selectedOpname, user.name);
  toast("✅ Stok diupdate berdasarkan opname");
};
```

- [ ] **Step 2: Verify** — create session, input some data, close, apply, check stock changes

---

### Task 6: KartuStockTab — Stock Card from Aggregated Logs

**Files:**
- Modify: `src/App.jsx` (inside OpnamePanel)

- [ ] **Step 1: KartuStockTab component**

```jsx
function KartuStockTab({ slogs, prods, biz, BIZ, C, F, rp, loadSheetJS, downloadXLSX }) {
  const [ksProduct, setKsProduct] = useState("");
  const [ksFrom, setKsFrom] = useState("");
  const [ksTo, setKsTo] = useState("");

  // Filter logs by business + product + date range
  const filtered = slogs.filter(l => {
    if (l.business !== biz) return false;
    if (ksProduct && l.barcode !== ksProduct && l.name !== ksProduct) return false;
    if (ksFrom) { try { if (new Date(l.date) < new Date(ksFrom)) return false; } catch {} }
    if (ksTo) { try { if (new Date(l.date) > new Date(ksTo + "T23:59:59")) return false; } catch {} }
    return true;
  }).sort((a,b) => new Date(a.date) - new Date(b.date));

  // Group by product: aggregate masuk/keluar per product
  const perProduct = {};
  filtered.forEach(l => {
    if (!perProduct[l.barcode]) perProduct[l.barcode] = { name: l.name, barcode: l.barcode, logs: [] };
    perProduct[l.barcode].logs.push(l);
  });

  // Build running balance
  // ... display table with columns: Tanggal | Produk | Masuk (D) | Keluar (K) | Saldo (S) | Harga | Nilai
}
```

The stock card columns:
- Tanggal
- Produk (nama)
- Barang Masuk (D) — qty jika type==="masuk"
- Barang Keluar (K) — qty jika type==="keluar" atau type==="opname" dengan selisih negatif
- Saldo (S) — running balance
- Harga — price of product at that time
- Nilai — S * price

- [ ] **Step 2: Add export to Excel for Kartu Stock**

```jsx
const exportKartuStock = async () => {
  const XLSX = await loadSheetJS();
  const header = ["Tanggal", "Produk", "Barcode", "Masuk (D)", "Keluar (K)", "Saldo (S)", "Harga", "Nilai"];
  const data = productLogs.flatMap(p => p.logs.map(l => [
    l.date, l.name, l.barcode,
    l.type === "masuk" ? l.qty : 0,
    (l.type === "keluar" || l.type === "opname") ? l.qty : 0,
    l.after || "-", "", ""
  ]));
  // ... create workbook, download
};
```

- [ ] **Step 3: Verify** — check that stock card shows correct in/out/balance

---

### Task 7: Export Excel (4 Sheet)

**Files:**
- Modify: `src/App.jsx` (inside OpnamePanel)

- [ ] **Step 1: Build 4-sheet workbook**

```jsx
const exportOpnameExcel = async (opnameId, opnameItems, bizProds, session, slogs, BIZ) => {
  const XLSX = await loadSheetJS();
  const wb = XLSX.utils.book_new();

  // Sheet 1: PETUNJUK
  const petunjuk = XLSX.utils.aoa_to_sheet([
    ["","TEMPLATE LAPORAN STOCK OPNAME"],
    ["","Gratis dari HashMicro — hashmicro.com"],
    [],
    ["","CARA PAKAI"],
    ["","Langkah 1","Buka sheet 'TEMPLATE OPNAME'"],
    ["","Langkah 2","Isi kolom Kode SKU, Nama Barang"],
    // ...
  ]);
  XLSX.utils.book_append_sheet(wb, petunjuk, "PETUNJUK");

  // Sheet 2: KARTU STOCK
  // ... similar aggregation

  // Sheet 3: TEMPLATE OPNAME
  const headers = ["No","Kode SKU","Nama Barang","Satuan","Opening Stock","Barang Keluar","Stok Sistem","Stok Fisik","Selisih","Status","Keterangan"];
  const rows = bizProds.map((p,i) => {
    const item = opnameItems.find(x => x.productId === p.id);
    return [
      i+1, p.barcode, p.name, "Buah",
      "", "", p.stock,
      item?.stockPhysical ?? "",
      item ? (item.stockPhysical - p.stock) : "",
      item?.status ?? "",
      item?.notes ?? ""
    ];
  });
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, "TEMPLATE OPNAME");

  // Sheet 4: RINGKASAN
  const ringkasan = XLSX.utils.aoa_to_sheet([
    ["","RINGKASAN STOCK OPNAME"],
    [],
    ["","ITEM","Jumlah"],
    ["","Total SKU diperiksa", opnameItems.length],
    ["","Item Status OK", opnameItems.filter(i => i.status === "OK").length],
    ["","Item Kurang", opnameItems.filter(i => i.status === "Kurang").length],
    ["","Item Surplus", opnameItems.filter(i => i.status === "Surplus").length],
    [],
    ["","SELISIH","Nilai"],
    ["","Total Unit Kurang", opnameItems.filter(i => i.status === "Kurang").reduce((s,i) => s + Math.abs(i.difference), 0)],
    ["","Total Unit Surplus", opnameItems.filter(i => i.status === "Surplus").reduce((s,i) => s + i.difference, 0)],
  ]);
  XLSX.utils.book_append_sheet(wb, ringkasan, "RINGKASAN");

  XLSX.writeFile(wb, `opname_${session?.business || "all"}_${new Date().toLocaleDateString("id-ID").replace(/\//g,"-")}.xlsx`);
};
```

- [ ] **Step 2: Wire export button** in TemplateOpnameTab toolbar

- [ ] **Step 3: Verify** — click export, check all 4 sheets in downloaded file

---

### Task 8: Import Excel — Parse & Preview

**Files:**
- Modify: `src/App.jsx` (inside OpnamePanel)

- [ ] **Step 1: ImportOpnameModal component**

```jsx
function ImportOpnameModal({ show, onClose, onImport, C, loadSheetJS, prods, biz }) {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  const handleFile = async (file) => {
    if (!file) return;
    setErr(""); setRows([]);
    try {
      const XLSX = await loadSheetJS();
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets["TEMPLATE OPNAME"];
      if (!ws) { setErr("Sheet 'TEMPLATE OPNAME' tidak ditemukan"); return; }
      const data = XLSX.utils.sheet_to_json(ws, { defval: "", header: 1 });
      // Find header row (contains "Kode SKU" / "Nama Barang")
      const headerIdx = data.findIndex(r => r.some(c => String(c).includes("Kode SKU") || String(c).includes("Nama Barang")));
      if (headerIdx === -1) { setErr("Header tidak ditemukan"); return; }

      // Map rows after header
      const mapKey = k => k.toLowerCase().replace(/[^a-z0-9]/g, "");
      const headerRow = data[headerIdx].map(h => mapKey(String(h)));
      const nameCol = headerRow.findIndex(h => h.includes("namabarang") || h.includes("nama"));
      const skuCol = headerRow.findIndex(h => h.includes("kode") || h.includes("sku") || h.includes("barcode"));
      const physCol = headerRow.findIndex(h => h.includes("stokfisik"));
      const notesCol = headerRow.findIndex(h => h.includes("keterangan"));

      const parsed = [];
      for (let i = headerIdx + 1; i < data.length; i++) {
        const row = data[i];
        const name = String(row[nameCol] || "").trim();
        const sku = String(row[skuCol] || "").trim();
        const phys = String(row[physCol] || "").trim();
        const notes = String(row[notesCol] || "").trim();
        if (!name && !sku) continue;
        // Match with product in system
        const product = prods.find(p => p.business === biz && (p.barcode === sku || (sku && (p.barcode === sku || p.name.toLowerCase() === name.toLowerCase() || p.name.toLowerCase().includes(name.toLowerCase()))));
        parsed.push({ row: i, sku, name, phys, notes, product: product || null });
      }
      setRows(parsed);
    } catch (e) { setErr("Gagal parse: " + e.message); }
  };

  // ... render upload zone, preview table, [Import] [Batal] buttons
}
```

- [ ] **Step 2: Import flow** — on confirm, map parsed rows to opname items and save via `fbBulkUpdateOpnameItems`

```
Preview:
| Barcode Import | Nama Import | Stok Fisik | Status Cocok |
| JSC001         | Kaos Polos  | 45         | ✅ Ditemukan  |
| UNKNOWN        | Barang X    | 10         | ⚠️ Tidak ditemukan |
```

- [ ] **Step 3: Verify** — download export, edit Stok Fisik, import back, check data

---

### Task 9: Integrate Opname into Stok Screen

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add opname access for Stok role**

In the Stok screen (around line 2393), add a button/link to opname:
```jsx
<button onClick={() => setShowOpnamePanel(true)} className="press"
  style={{padding:"10px 14px", background:C.vi1, border:`1px solid ${C.vi}33`,
    borderRadius:10, color:C.vi, fontSize:12, fontWeight:700}}>
  📋 Buka Opname
</button>
```

Then in the stok screen rendering, conditionally show OpnamePanel:
```jsx
{showOpnamePanel && <OpnamePanel ... />}
```

- [ ] **Step 2: Add `showOpnamePanel` state** alongside other stok state

```js
const [showOpnamePanel, setShowOpnamePanel] = useState(false);
```

- [ ] **Step 3: Verify** — login as `stok.js`, check opname button appears and works

---

### Task 10: Polish — Stok Log Filter untuk type "opname"

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Update stock log display to show "opname" type properly**

In the stok log table (admin) and stock screen, add "opname" to the type filter or display it with a distinct color:
```jsx
// In stock log render:
// type === "opname" → show with purple/pink color
<span style={{color: C.vi, fontWeight: 700}}>OPNAME</span>
```

- [ ] **Step 2: Verify** — after applying opname, check stock log shows "OPNAME" entries
