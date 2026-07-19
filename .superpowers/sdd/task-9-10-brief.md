# Tasks 9 & 10: Stok Integration + Polish

## File
- Modify: `src/App.jsx`

### Task 9: Integrate Opname into Stok Screen

**Step 1: Add `showOpnamePanel` state**
After existing stok-related state declarations (around line 2019, after `const [stokSearch,setStokSearch]=useState("");`), add:
```js
const [showOpnamePanel, setShowOpnamePanel] = useState(false);
```

**Step 2: Add "Buka Opname" button in stok screen**
In the stok screen section (`if(screen==="stok")`), right before the "Daftar Produk dengan Quick Adjust" card (before line 3052 `{/* Daftar Produk dengan Quick Adjust */}`), add a button card:
```jsx
<button onClick={()=>setShowOpnamePanel(true)} className="press"
  style={{padding:"11px 16px",background:C.vi1,border:`1px solid ${C.vi}44`,borderRadius:12,color:C.vi,fontSize:13,fontWeight:700,width:"100%",textAlign:"center",cursor:"pointer",fontFamily:"inherit"}}>
  📋 Buka Opname
</button>
```

**Step 3: Render OpnamePanel as overlay in stok screen**
In the stok screen return, add this overlay BEFORE the main return content (place it right after `<style>{CSS}</style><Toast n={notif}/>` around line 2937):
```jsx
{showOpnamePanel && <div style={{position:"fixed",inset:0,zIndex:600,background:C.bg1,overflowY:"auto"}}>
  <div style={{padding:"8px 12px",display:"flex",justifyContent:"flex-end",position:"sticky",top:0,background:C.bg2,borderBottom:`1px solid ${C.bo0}`,zIndex:1}}>
    <button onClick={()=>setShowOpnamePanel(false)} className="press"
      style={{padding:"6px 12px",background:C.r1,border:`1px solid ${C.r}44`,borderRadius:8,color:C.r,fontSize:11,fontWeight:700,cursor:"pointer"}}>
      × Tutup Opname
    </button>
  </div>
  <OpnamePanel
    opnames={opnames} opnameItems={opnameItems}
    selectedOpname={selectedOpname} setSelectedOpname={setSelectedOpname}
    opnameTab={opnameTab} setOpnameTab={setOpnameTab}
    showCreateOpname={showCreateOpname} setShowCreateOpname={setShowCreateOpname}
    showImportOpname={showImportOpname} setShowImportOpname={setShowImportOpname}
    importOpnameRows={importOpnameRows} setImportOpnameRows={setImportOpnameRows}
    bizProds={bizProds} prods={prods} user={user} biz={biz}
    toast={toast} rp={rp} uid={uid} nowStr={nowStr}
    fbCreateOpname={fbCreateOpname} fbCloseOpname={fbCloseOpname}
    fbDeleteOpname={fbDeleteOpname} fbUpdateOpnameItem={fbUpdateOpnameItem}
    fbBulkUpdateOpnameItems={fbBulkUpdateOpnameItems} fbApplyOpnameAdjustments={fbApplyOpnameAdjustments}
    slogs={slogs} loadSheetJS={loadSheetJS} downloadXLSX={downloadXLSX} BIZ={BIZ} C={C} F={F}
  />
</div>}
```

### Task 10: Polish — Show "opname" type in stock logs

**Step 1: Update stock log type badge (admin stok log)**
In the admin stok log table (around line 4650-4651), update the type badge rendering so "opname" type shows with purple (C.vi) color:

Line 4650 current:
```
<td style={{padding:"14px 13px"}}><span style={{padding:"2px 8px",borderRadius:20,fontSize:9.5,fontWeight:700,background:l.type==="masuk"?C.g1:C.r1,color:l.type==="masuk"?C.g:C.r,textTransform:"uppercase"}}>{l.type}</span></td>
```

Change to:
```
<td style={{padding:"14px 13px"}}><span style={{padding:"2px 8px",borderRadius:20,fontSize:9.5,fontWeight:700,textTransform:"uppercase",
  background:l.type==="masuk"?C.g1:l.type==="opname"?C.vi1:C.r1,
  color:l.type==="masuk"?C.g:l.type==="opname"?C.vi:C.r}}>{l.type==="opname"?"OPNAME":l.type}</span></td>
```

Line 4651 current:
```
<td style={{padding:"14px 13px",fontFamily:F.mono,fontWeight:700,color:l.type==="masuk"?C.g:C.r}}>{l.type==="masuk"?"+":"-"}{l.qty}</td>
```

Change to:
```
<td style={{padding:"14px 13px",fontFamily:F.mono,fontWeight:700,color:l.type==="masuk"?C.g:l.type==="opname"?C.vi:C.r}}>{l.type==="masuk"?"+":l.type==="opname"?"±":"-"}{l.qty}</td>
```

## Verification
Run `npx vite build` — no errors
