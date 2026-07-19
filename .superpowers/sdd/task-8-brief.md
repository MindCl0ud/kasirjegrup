# Task 8: Import Excel — Parse & Preview

## File
- Modify: `src/App.jsx`

## What to add

### ImportOpnameModal component

Add a function component BEFORE the OpnamePanel function. This is a modal/drawer for uploading and parsing Excel files.

```jsx
function ImportOpnameModal({ show, onClose, onImport, C, loadSheetJS, prods, biz, BIZ }) {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

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
      const headerIdx = data.findIndex(r => r.some(c => String(c).includes("Kode SKU") || String(c).includes("Nama Barang")));
      if (headerIdx === -1) { setErr("Header tidak ditemukan"); return; }

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
        const product = prods.find(p => p.business === biz && (p.barcode === sku || p.name.toLowerCase() === name.toLowerCase() || p.name.toLowerCase().includes(name.toLowerCase())));
        parsed.push({ row: i, sku, name, phys, notes, product: product || null });
      }
      setRows(parsed);
    } catch (e) { setErr("Gagal parse: " + e.message); }
  };

  if (!show) return null;

  return <div style={{position:"fixed",inset:0,background:"rgba(2,8,24,.85)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:F.sans}}
    onClick={onClose}>
    <div style={{width:"100%",maxWidth:520,background:C.bg2,borderRadius:"22px 22px 0 0",border:`1px solid ${C.bo1}`,borderBottom:"none",animation:"slideUp .25s ease",maxHeight:"88vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
      <div style={{width:36,height:4,background:C.bo1,borderRadius:2,margin:"14px auto 0"}}/>
      <div style={{padding:"14px 18px 12px",borderBottom:`1px solid ${C.bo0}`,flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontSize:15,fontWeight:800}}>⬆ Import Opname</div>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:C.t2,fontSize:22,cursor:"pointer",lineHeight:1}}>×</button>
        </div>
        <div style={{fontSize:11,color:C.t2}}>Upload file Excel hasil export. Data Stok Fisik akan diisi otomatis.</div>
      </div>
      <div style={{overflowY:"auto",flex:1,padding:"14px 18px"}}>
        <label className="press" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"28px 20px",border:`2px dashed ${C.bo1}`,borderRadius:12,background:C.bg3,cursor:"pointer",marginBottom:12}}>
          <span style={{fontSize:26}}>📁</span>
          <span style={{fontSize:13,fontWeight:600,color:C.t1}}>{rows.length > 0 ? "File terpilih" : "Tap untuk pilih file .xlsx"}</span>
          <span style={{fontSize:10,color:C.t3}}>{rows.length > 0 ? `${rows.length} baris terbaca` : "File export dari aplikasi ini"}</span>
          <input type="file" accept=".xlsx,.xls" style={{display:"none"}} onChange={e=>{handleFile(e.target.files[0]);e.target.value="";}}/>
        </label>

        {err && <div style={{padding:"10px 14px",background:`${C.r}15`,borderRadius:8,border:`1px solid ${C.r}33`,fontSize:11,color:C.r,marginBottom:10}}>{err}</div>}

        {rows.length > 0 && <>
          <div style={{fontSize:11,fontWeight:700,color:C.t2,marginBottom:8}}>Pratinjau ({rows.filter(r=>r.product).length} dari {rows.length} produk cocok)</div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:10,whiteSpace:"nowrap"}}>
              <thead>
                <tr style={{background:C.bg0}}>
                  {["#","SKU","Nama","Stok Fisik","Status"].map(h=>
                    <th key={h} style={{padding:"6px 8px",textAlign:"left",color:C.t3,fontWeight:700,borderBottom:`1px solid ${C.bo0}`}}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r,i)=>(
                  <tr key={i} style={{background:r.product?"transparent":`${C.a}10`}}>
                    <td style={{padding:"6px 8px",color:C.t2}}>{i+1}</td>
                    <td style={{padding:"6px 8px",fontFamily:F.mono,color:C.t2}}>{r.sku}</td>
                    <td style={{padding:"6px 8px",fontWeight:600}}>{r.name}</td>
                    <td style={{padding:"6px 8px"}}><span className="mn">{r.phys}</span></td>
                    <td style={{padding:"6px 8px"}}>
                      {r.product
                        ? <span style={{color:C.g,fontWeight:700}}>✅ Ditemukan</span>
                        : <span style={{color:C.a,fontWeight:700}}>⚠️ Tidak ditemukan</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>}
      </div>
      {rows.length > 0 && <div style={{padding:"12px 18px",paddingBottom:`calc(12px + var(--safe-b))`,borderTop:`1px solid ${C.bo0}`,display:"flex",gap:8,flexShrink:0}}>
        <button onClick={onClose} style={{flex:1,padding:"11px",background:C.bg3,border:`1px solid ${C.bo1}`,borderRadius:10,color:C.t1,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Batal</button>
        <button onClick={async()=>{
          const matched = rows.filter(r => r.product).map(r => ({
            productId: r.product.id, barcode: r.product.barcode, name: r.product.name, category: r.product.category,
            business: r.product.business, stockSystem: r.product.stock, stockPhysical: Number(r.phys),
            difference: Number(r.phys) - r.product.stock,
            status: Number(r.phys) - r.product.stock === 0 ? "OK" : Number(r.phys) - r.product.stock > 0 ? "Surplus" : "Kurang",
            notes: "",
          }));
          await onImport(matched);
        }} className="press"
          style={{flex:1,padding:"11px",background:`linear-gradient(90deg,${C.g},${C.b})`,border:"none",borderRadius:10,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
          Import {rows.filter(r=>r.product).length} Produk
        </button>
      </div>}
    </div>
  </div>;
}
```

### Wire the import flow

The import already has `setShowImportOpname` and `setImportOpnameRows` states and the import button's onClick calls `onImport(matched)`. The OpnamePanel needs to:

1. Render `<ImportOpnameModal>` when `showImportOpname` is true
2. Handle the `onImport` callback to bulk save via `fbBulkUpdateOpnameItems`

Inside OpnamePanel's render, add:
```jsx
<ImportOpnameModal
  show={showImportOpname}
  onClose={()=>setShowImportOpname(false)}
  onImport={async (items)=>{
    if (!selectedOpname || !items.length) return;
    await fbBulkUpdateOpnameItems(selectedOpname, items);
    setShowImportOpname(false);
    toast(`✅ ${items.length} produk diimport`);
  }}
  C={C} loadSheetJS={loadSheetJS} prods={prods} biz={biz} BIZ={BIZ}
/>
```

## Where to place ImportOpnameModal function
Insert it BEFORE the OpnamePanel function (before `function OpnamePanel`) but AFTER the exportOpnameExcel function. These functions should be in order:
- TemplateOpnameTab (already exists)
- RingkasanTab (already exists)
- KartuStockTab (already exists)
- exportOpnameExcel (added in Task 7)
- ImportOpnameModal (new)
- OpnamePanel

## Where to render ImportOpnameModal
Inside OpnamePanel's JSX return, add the modal render. Choose a good location — maybe before the closing `</div>` of the main panel.

## Verification
Run `npx vite build` — no errors.

## Global Constraints
- All text in Bahasa Indonesia
- Follow existing code style
- Use existing `loadSheetJS()` helper
- The modal UI should match KasirStokPanel pattern (slide-up drawer)
