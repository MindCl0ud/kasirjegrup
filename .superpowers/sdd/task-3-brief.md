# Task 3: Create OpnamePanel Component

## File
- Modify: `src/App.jsx` — add OpnamePanel function AND add its tab UI to admin render AND add "Opname" tab to TABS/MORE_TABS

## Insertion Points

### A. Add component function (after KasirStokPanel, before APPSCRIPT_CODE)
Insert a new `OpnamePanel` function between line 1245 (end of KasirStokPanel `}`) and line 1247 (`// ──── APPSCRIPT CODE`).

### B. Add "Opname" tab to TABS and MORE_TABS arrays
In TABS (line 2657-2660), add `{id:"opname", l:"📋 Opname"},` (after `{id:"sheets",l:"🔗 Sheets"}` or at the end).
In MORE_TABS (line 2668-2674), add `{id:"opname", ic:"📋", label:"Opname"},` (after `{id:"sheets",ic:"🔗",label:"Sheets"}` or at the end).

### C. Add render block for opname tab (after SHEETS block, before the closing `</div>` of admin content)
After line 4254 `</div>}`, add: `{adminTab==="opname"&&<OpnamePanel ...props.../>}`

## Component: OpnamePanel

### Props
```js
function OpnamePanel({
  opnames, opnameItems, selectedOpname, setSelectedOpname,
  opnameTab, setOpnameTab, showCreateOpname, setShowCreateOpname,
  showImportOpname, setShowImportOpname, importOpnameRows, setImportOpnameRows,
  bizProds, prods, user, biz, toast, rp, uid, nowStr,
  fbCreateOpname, fbCloseOpname, fbDeleteOpname, fbUpdateOpnameItem,
  fbBulkUpdateOpnameItems, fbApplyOpnameAdjustments,
  slogs, loadSheetJS, downloadXLSX, BIZ, C, F,
})
```

### Internal State
```js
const [opnameForm, setOpnameForm] = useState({ business: "JS_CLOTHING", date: new Date().toISOString().slice(0,10), notes: "" });
const [physInput, setPhysInput] = useState({});
const [notesInput, setNotesInput] = useState({});
const [searchQ, setSearchQ] = useState("");
const [activeSession, setActiveSession] = useState(null);
```

### Sub-Renders

#### a) CreateOpnameForm — Modal to create new session
- PIC: {user.name} (auto)
- Bisnis: dropdown [JS Clothing ▼] [JB Store ▼]
- Tanggal: date picker
- Catatan: text input (optional)
- [Batal] [Buat Sesi]
- Buat Sesi calls fbCreateOpname, then selects the new session

#### b) Session list — list of existing sessions
- Filter by current biz
- Each session shows: business name, date, PIC, status badge (OPEN/CLOSED/APPLIED with colors)
- Tap session to select it
- [+ Buat Sesi Baru] button at bottom
- Delete button (only for "open" sessions) with confirm

#### c) Session detail — when a session is selected
- Tabs: [TEMPLATE OPNAME] [RINGKASAN] [KARTU STOCK]
- Back button to go back to session list
- Based on opnameTab state

#### d) TemplateOpnameTab placeholder — just call `<TemplateOpnameTab .../>` (will be implemented in Task 4)
For now, paste this as a placeholder:
```jsx
function TemplateOpnameTab({ opnameItems, bizProds, physInput, setPhysInput, notesInput, setNotesInput, searchQ, setSearchQ, C, F, rp, uid, toast, fbUpdateOpnameItem, selectedOpname, showImportOpname, setShowImportOpname, importOpnameRows, setImportOpnameRows, loadSheetJS, downloadXLSX, BIZ }) {
  const filtered = bizProds().filter(p => !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase()) || p.barcode.includes(searchQ));
  return <div>
    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
      <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Cari barcode / nama..."
        style={{flex:1,minWidth:160,padding:"9px 12px",background:C.bg3,border:`1.5px solid ${C.bo0}`,borderRadius:9,color:C.t0,fontSize:12}}/>
    </div>
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,whiteSpace:"nowrap"}}>
        <thead>{["No","Barcode","Nama","Stok Sistem","Stok Fisik","Selisih","Status","Keterangan"].map(h=>
          <th key={h} style={{padding:"8px 10px",textAlign:"left",color:C.t3,fontWeight:700,borderBottom:`1px solid ${C.bo0}`,fontSize:9.5,textTransform:"uppercase"}}>{h}</th>)}
        </thead>
        <tbody>
          {filtered.map((p,i)=>{
            const existing = opnameItems.find(x => x.productId === p.id);
            const phys = physInput[p.id] !== undefined ? Number(physInput[p.id]) : existing?.stockPhysical;
            const diff = phys !== undefined ? phys - p.stock : 0;
            const status = phys === undefined ? "" : diff === 0 ? "OK" : diff > 0 ? "Surplus" : "Kurang";
            const bg = status === "OK" ? "#0a3d0a33" : status === "Kurang" ? "#3d0a0a33" : status === "Surplus" ? "#3d3d0a33" : "transparent";
            return <tr key={p.id} style={{background:bg}}>
              <td style={{padding:"8px 10px",color:C.t2}}>{i+1}</td>
              <td style={{padding:"8px 10px",color:C.t2,fontFamily:F.mono,fontSize:10}}>{p.barcode}</td>
              <td style={{padding:"8px 10px",fontWeight:600}}>{p.name}</td>
              <td style={{padding:"8px 10px"}}><span className="mn">{p.stock}</span></td>
              <td style={{padding:"8px 10px"}}>
                <input type="number" value={physInput[p.id] ?? (existing?.stockPhysical ?? "")}
                  onChange={e=>setPhysInput(prev=>({...prev,[p.id]:e.target.value}))}
                  onBlur={()=>{
                    const v = physInput[p.id];
                    if (v === undefined || v === "") return;
                    fbUpdateOpnameItem(selectedOpname, p.id, {
                      productId:p.id, barcode:p.barcode, name:p.name, category:p.category,
                      business:p.business, stockSystem:p.stock, stockPhysical:Number(v),
                      difference: Number(v) - p.stock,
                      status: Number(v) - p.stock === 0 ? "OK" : Number(v) - p.stock > 0 ? "Surplus" : "Kurang",
                      notes: notesInput[p.id] || "",
                    });
                  }}
                  style={{width:70,padding:"6px 8px",background:C.bg3,border:`1.5px solid ${C.bo0}`,borderRadius:7,color:C.t0,fontSize:12,textAlign:"center"}}/>
              </td>
              <td style={{padding:"8px 10px"}}><span className="mn" style={{color:diff<0?C.r:diff>0?C.a:C.t2,fontWeight:700}}>{diff>0?"+":""}{diff}</span></td>
              <td style={{padding:"8px 10px"}}>{status && <span style={{padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700,
                color:status==="OK"?C.g:status==="Kurang"?C.r:C.a,
                background:status==="OK"?`${C.g}22`:status==="Kurang"?`${C.r}22`:`${C.a}22`}}>{status}</span>}</td>
              <td style={{padding:"8px 10px"}}>
                <input value={notesInput[p.id]??""} onChange={e=>setNotesInput(prev=>({...prev,[p.id]:e.target.value}))}
                  placeholder="Catatan" style={{width:100,padding:"6px 8px",background:C.bg3,border:`1px solid ${C.bo0}`,borderRadius:7,color:C.t0,fontSize:10}}/>
              </td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  </div>;
}
```

#### e) RingkasanTab placeholder
```jsx
function RingkasanTab({ opnameItems, selectedOpname, opnames, user, toast, fbCloseOpname, fbApplyOpnameAdjustments, C, F, rp }) {
  const total = opnameItems.length;
  const ok = opnameItems.filter(i => i.status === "OK").length;
  const kurang = opnameItems.filter(i => i.status === "Kurang");
  const surplus = opnameItems.filter(i => i.status === "Surplus");
  const kurangUnit = kurang.reduce((s,i) => s + Math.abs(i.difference), 0);
  const surplusUnit = surplus.reduce((s,i) => s + i.difference, 0);
  const session = opnames.find(o => o.id === selectedOpname);
  const isClosed = session?.status === "closed" || session?.status === "applied";

  const handleClose = async () => {
    if (!confirm("Tutup sesi opname? Tidak bisa edit lagi setelah ditutup.")) return;
    await fbCloseOpname(selectedOpname, {
      totalItems: total, totalOk: ok, totalKurang: kurang.length, totalSurplus: surplus.length,
      totalKurangUnit: kurangUnit, totalSurplusUnit: surplusUnit,
    });
    toast("Sesi opname ditutup");
  };

  const handleApply = async () => {
    if (!confirm("Apply adjustments? Stok akan diupdate sesuai stok fisik.")) return;
    await fbApplyOpnameAdjustments(selectedOpname, user.name);
    toast("✅ Stok diupdate berdasarkan opname");
  };

  return <div>
    <div style={{display:"flex",gap:12,marginBottom:16}}>
      <Stat icon="🟢" label="OK" value={ok} color={C.g}/>
      <Stat icon="🔴" label="Kurang" value={kurang.length} color={C.r} sub={`-${kurangUnit} unit`}/>
      <Stat icon="🟡" label="Surplus" value={surplus.length} color={C.a} sub={`+${surplusUnit} unit`}/>
    </div>
    <div style={{marginBottom:16}}>
      <div style={{fontSize:11,color:C.t2,marginBottom:4}}>Total SKU diperiksa: <b style={{color:C.t0}}>{total}</b></div>
    </div>
    {!isClosed && <div style={{display:"flex",gap:8,marginBottom:16}}>
      <button onClick={handleClose} style={{flex:1,padding:"11px",background:C.a1,border:`1px solid ${C.a}44`,borderRadius:10,color:C.a,fontSize:12,fontWeight:700,cursor:"pointer"}}>🔒 Tutup Sesi</button>
      <button onClick={handleApply} style={{flex:1,padding:"11px",background:C.g1,border:`1px solid ${C.g}44`,borderRadius:10,color:C.g,fontSize:12,fontWeight:700,cursor:"pointer"}}>✅ Apply Adjustment</button>
    </div>}
    {session?.status === "applied" && <div style={{padding:"10px 14px",background:`${C.g}15`,borderRadius:10,border:`1px solid ${C.g}33`,fontSize:12,color:C.g,fontWeight:600}}>✓ Adjustment sudah diapply</div>}
  </div>;
}
```

#### f) KartuStockTab placeholder (will be completed in Task 6)
```jsx
function KartuStockTab({ slogs, prods, biz, BIZ, C, F, rp, loadSheetJS, downloadXLSX }) {
  const [ksProduct, setKsProduct] = useState("");
  const [ksFrom, setKsFrom] = useState("");
  const [ksTo, setKsTo] = useState("");

  const filtered = slogs.filter(l => {
    if (l.business !== biz) return false;
    if (ksProduct && l.barcode !== ksProduct && l.name !== ksProduct) return false;
    if (ksFrom) { try { if (new Date(l.date) < new Date(ksFrom)) return false; } catch {} }
    if (ksTo) { try { if (new Date(l.date) > new Date(ksTo + "T23:59:59")) return false; } catch {} }
    return true;
  }).sort((a,b) => new Date(a.date) - new Date(b.date));

  const perProduct = {};
  filtered.forEach(l => {
    if (!perProduct[l.barcode]) perProduct[l.barcode] = { name: l.name, barcode: l.barcode, logs: [] };
    perProduct[l.barcode].logs.push(l);
  });

  const productOptions = [...new Set(slogs.filter(l=>l.business===biz).map(l=>l.barcode))];

  return <div>
    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
      <select value={ksProduct} onChange={e=>setKsProduct(e.target.value)}
        style={{padding:"8px 10px",background:C.bg3,border:`1.5px solid ${C.bo0}`,borderRadius:9,color:C.t0,fontSize:12,flex:1}}>
        <option value="">Semua Produk</option>
        {productOptions.map(b=>{
          const p = prods.find(x=>x.barcode===b);
          return <option key={b} value={b}>{p?.name||b}</option>;
        })}
      </select>
      <input type="date" value={ksFrom} onChange={e=>setKsFrom(e.target.value)}
        style={{padding:"8px 10px",background:C.bg3,border:`1.5px solid ${C.bo0}`,borderRadius:9,color:C.t0,fontSize:12}}/>
      <span style={{color:C.t3,fontSize:11}}>sd</span>
      <input type="date" value={ksTo} onChange={e=>setKsTo(e.target.value)}
        style={{padding:"8px 10px",background:C.bg3,border:`1.5px solid ${C.bo0}`,borderRadius:9,color:C.t0,fontSize:12}}/>
    </div>
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,whiteSpace:"nowrap"}}>
        <thead>
          <tr style={{background:C.bg0}}>
            {["Tanggal","Produk","Barcode","Masuk (D)","Keluar (K)","Saldo (S)","Harga","Nilai"].map(h=>
              <th key={h} style={{padding:"8px 10px",textAlign:"left",color:C.t3,fontWeight:700,borderBottom:`1px solid ${C.bo0}`,fontSize:9.5,textTransform:"uppercase"}}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {Object.values(perProduct).map(pp => {
            let running = 0;
            return pp.logs.map((l,li) => {
              const inQty = l.type === "masuk" ? l.qty : 0;
              const outQty = (l.type === "keluar" || l.type === "opname") ? l.qty : 0;
              running = running + inQty - outQty;
              const price = prods.find(p=>p.barcode===l.barcode)?.price||0;
              return <tr key={li}>
                <td style={{padding:"6px 10px",color:C.t2,fontSize:10}}>{l.date}</td>
                <td style={{padding:"6px 10px",fontWeight:600}}>{li === 0 ? pp.name : ""}</td>
                <td style={{padding:"6px 10px",color:C.t2,fontFamily:F.mono,fontSize:10}}>{li === 0 ? l.barcode : ""}</td>
                <td style={{padding:"6px 10px",color:C.g}}>{inQty > 0 ? <span className="mn">{inQty}</span> : ""}</td>
                <td style={{padding:"6px 10px",color:C.r}}>{outQty > 0 ? <span className="mn">{outQty}</span> : ""}</td>
                <td style={{padding:"6px 10px",fontWeight:700}}><span className="mn">{running}</span></td>
                <td style={{padding:"6px 10px",color:C.t2}}>{price > 0 ? <span className="mn">{rp(price)}</span> : ""}</td>
                <td style={{padding:"6px 10px",color:C.t2}}>{price > 0 ? <span className="mn">{rp(running * price)}</span> : ""}</td>
              </tr>;
            });
          })}
        </tbody>
      </table>
    </div>
  </div>;
}
```

### Main OpnamePanel Render
The main component renders:
1. A back button when viewing session detail (goes to session list)
2. Session list (when no selectedOpname):
   - "📋 Opname Sessions" header + [+ Buat Sesi Baru] button
   - Each session as a card: business name, date, PIC, status badge
3. Session detail (when selectedOpname is set):
   - Tab bar: [TEMPLATE OPNAME] [RINGKASAN] [KARTU STOCK]
   - Active tab content based on opnameTab

### Create Session Modal
- Shown when showCreateOpname is true
- Card with PIC (auto), business selector, date, notes
- "Buat Sesi" calls fbCreateOpname, then selects the new session and closes modal

## Verification
Run: `npx vite build` — no errors

## Global Constraints
- All text in Bahasa Indonesia
- Follow existing style: 2-space indent, no comments (except // ─── section markers)
- Use existing C, F, BIZ constants
- Use existing Stat component (already defined in App.jsx)
- The template opname tab, ringkasan tab, and kartu stock tab functions should be placed BEFORE the OpnamePanel function (inline in the same file)
