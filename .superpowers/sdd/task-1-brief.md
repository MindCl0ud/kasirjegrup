# Task 1: Add Firebase Opname Functions

## Files
- Modify: `src/firebase.js` — append new functions at the end of the file (before line 229 would be wrong, just append after last line)

## Functions to Add

Append these exports AFTER the last line of firebase.js (line 243, after `syncToSheets`):

### Subscribe functions
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

### CRUD functions
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

### Bulk update and apply adjustment
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

## Verification
Run: `npx vite build` — should compile without errors.

## Global Constraints
- All imports already exist in firebase.js (no new imports needed)
- Follow existing code style exactly
- No comments to add
