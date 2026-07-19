# Task 7: Export Excel (4-Sheet Workbook)

## File
- Modify: `src/App.jsx`

## Changes

### 1. Add `exportOpnameExcel` function (before the OpnamePanel function, around line 1411)

Add this function BEFORE the OpnamePanel function (before `function OpnamePanel({`):

```js
const exportOpnameExcel = async (opnameId, opnameItems, bizProds, session, slogs, BIZ, rp) => {
  const XLSX = await loadSheetJS();
  const wb = XLSX.utils.book_new();

  // Sheet 1: PETUNJUK
  const petunjuk = XLSX.utils.aoa_to_sheet([
    ["","TEMPLATE LAPORAN STOCK OPNAME"],
    ["","Gratis dari HashMicro — hashmicro.com"],
    [],
    ["","CARA PAKAI"],
    ["","Langkah 1","Buka sheet 'TEMPLATE OPNAME'"],
    ["","Langkah 2","Isi kolom Stok Fisik sesuai kondisi nyata"],
    ["","Langkah 3","Simpan dan upload kembali ke aplikasi"],
    [],
    ["","KETERANGAN"],
    ["","Kolom Stok Sistem","Terisi otomatis dari database"],
    ["","Kolom Selisih","Stok Fisik - Stok Sistem"],
    ["","Status OK","Jika Stok Fisik = Stok Sistem"],
    ["","Status Kurang","Jika Stok Fisik < Stok Sistem"],
    ["","Status Surplus","Jika Stok Fisik > Stok Sistem"],
  ]);
  XLSX.utils.book_append_sheet(wb, petunjuk, "PETUNJUK");

  // Sheet 2: KARTU STOCK
  const ksData = [["Tanggal","Produk","Barcode","Masuk (D)","Keluar (K)","Saldo (S)","Harga","Nilai"]];
  const biz = session?.business || "";
  const bizLogs = slogs.filter(l => l.business === biz).sort((a,b) => new Date(a.date) - new Date(b.date));
  const perProduct = {};
  bizLogs.forEach(l => {
    if (!perProduct[l.barcode]) perProduct[l.barcode] = { name: l.name, barcode: l.barcode, logs: [] };
    perProduct[l.barcode].logs.push(l);
  });
  Object.values(perProduct).forEach(pp => {
    let running = 0;
    pp.logs.forEach(l => {
      const inQty = l.type === "masuk" ? l.qty : 0;
      const outQty = (l.type === "keluar" || l.type === "opname") ? l.qty : 0;
      running = running + inQty - outQty;
      const price = 0;
      ksData.push([l.date, l.name, l.barcode, inQty||"", outQty||"", running, price||"", (running * price)||""]);
    });
  });
  const ksWS = XLSX.utils.aoa_to_sheet(ksData);
  XLSX.utils.book_append_sheet(wb, ksWS, "KARTU STOCK");

  // Sheet 3: TEMPLATE OPNAME
  const headers = ["No","Kode SKU","Nama Barang","Satuan","Opening Stock","Barang Keluar","Stok Sistem","Stok Fisik","Selisih","Status","Keterangan"];
  const prods = bizProds();
  const rows = prods.map((p,i) => {
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

### 2. Add export button to TemplateOpnameTab toolbar

In the toolbar div (the one with search input, around line 1249-1252), add export and import buttons AFTER the search input:

```jsx
<button onClick={async()=>{
  await exportOpnameExcel(selectedOpname, opnameItems, bizProds, opnames.find(o=>o.id===selectedOpname), slogs, BIZ, rp);
  toast("✅ Excel diunduh");
}} className="press"
  style={{padding:"7px 12px",background:C.g1,border:`1px solid ${C.g}44`,borderRadius:8,color:C.g,fontSize:11,fontWeight:700,cursor:"pointer"}}>
  ⬇ Export
</button>
<button onClick={()=>setShowImportOpname(true)} className="press"
  style={{padding:"7px 12px",background:C.b1,border:`1px solid ${C.b}44`,borderRadius:8,color:C.b,fontSize:11,fontWeight:700,cursor:"pointer"}}>
  ⬆ Import
</button>
```

### 3. Add export button to KartuStockTab

Find the KartuStockTab toolbar and add a button:
```jsx
<button onClick={async()=>{
  await exportOpnameExcel(selectedOpname, opnameItems, bizProds, opnames.find(o=>o.id===selectedOpname), slogs, BIZ, rp);
  toast("✅ Excel diunduh");
}} className="press"
  style={{padding:"7px 12px",background:C.g1,border:`1px solid ${C.g}44`,borderRadius:8,color:C.g,fontSize:11,fontWeight:700,cursor:"pointer"}}>
  ⬇ Export
</button>
```

## Verification
Run: `npx vite build` — no errors

## Global Constraints
- All text in Bahasa Indonesia
- Follow existing code style (2-space indent)
- Use existing `loadSheetJS()` helper (already available)
