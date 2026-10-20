// ═══════════════════════════════════════════════════════════════
//  KASIR JE GRUP — Firebase Service Layer v5 (FIXED)
// ═══════════════════════════════════════════════════════════════
import { initializeApp, getApps } from "firebase/app";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED, collection, doc, setDoc, addDoc, getDoc, getDocs,
  updateDoc, deleteDoc, onSnapshot, query, orderBy, limit,
  serverTimestamp, writeBatch, where,
} from "firebase/firestore";

// ── Config ─────────────────────────────────────────────────────
const CONFIG_KEY = "je_grup_fb_config";
// Konfigurasi dari .env (VITE_FIREBASE_*) diprioritaskan; jika kosong, pakai form setup (localStorage).
const E = import.meta.env;
const ENV_CONFIG = (E.VITE_FIREBASE_API_KEY && E.VITE_FIREBASE_PROJECT_ID) ? {
  apiKey: E.VITE_FIREBASE_API_KEY,
  authDomain: E.VITE_FIREBASE_AUTH_DOMAIN || `${E.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: E.VITE_FIREBASE_PROJECT_ID,
  storageBucket: E.VITE_FIREBASE_STORAGE_BUCKET || `${E.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: E.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: E.VITE_FIREBASE_APP_ID || "",
} : null;
export const hasEnvConfig = !!ENV_CONFIG;
export const loadConfig  = () => { if (ENV_CONFIG) return ENV_CONFIG; try { return JSON.parse(localStorage.getItem(CONFIG_KEY)); } catch { return null; } };
export const saveConfig  = (c) => ENV_CONFIG ? null : localStorage.setItem(CONFIG_KEY, JSON.stringify(c));
export const clearConfig = () => localStorage.removeItem(CONFIG_KEY);

// ── Password hashing (SHA-256) ─────────────────────────────────
export const hashPassword = async (plain) => {
  if (!plain) return "";
  const buf = await crypto.subtle.digest("SHA-256",
    new TextEncoder().encode(plain + "je_grup_salt_2024"));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
};
export const verifyPassword = async (plain, stored) => {
  if (!stored) return false;
  // Jika stored bukan hash (panjang != 64), bandingkan plain text (legacy)
  if (stored.length !== 64) return plain === stored; 
  return (await hashPassword(plain)) === stored;
};

// ── Firebase instance ──────────────────────────────────────────
let _db = null;
export const getDB = () => _db;

export const initFirebase = async (config) => {
  try {
    if (_db) return { ok:true, db:_db };
    const existing = getApps();
    const app = existing.length > 0 ? existing[0] : initializeApp(config);
    _db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      }),
    });
    saveConfig(config);
    return { ok:true, db:_db };
  } catch (err) {
    return { ok:false, error:err.message };
  }
};

// ── Seed ────────────────────────────────────────────────────────
export const isSeeded = async () => {
  try { return (await getDoc(doc(_db,"meta","seeded"))).exists(); } catch { return false; }
};
export const seedDatabase = async (users, products) => {
  try {
    const batch = writeBatch(_db);
    for (const u of users) {
      const data = { ...u, passwordHash: await hashPassword(u.password) };
      if (data.faceDescriptor) data.faceDescriptor = Array.from(data.faceDescriptor);
      batch.set(doc(_db,"users",String(u.id)), data);
    }
    products.forEach(p => batch.set(doc(_db,"products",String(p.id)), p));
    batch.set(doc(_db,"meta","seeded"), { seeded:true, at:serverTimestamp(), version:5 });
    await batch.commit(); return true;
  } catch(e) { console.error("Seed:",e); return false; }
};

// ── Subscriptions ──────────────────────────────────────────────
export const subscribeUsers        = (cb) => onSnapshot(collection(_db,"users"), s=>cb(s.docs.map(d=>({...d.data(),id:d.id}))), console.warn);
export const subscribeProducts     = (cb) => onSnapshot(collection(_db,"products"), s=>cb(s.docs.map(d=>({...d.data(),id:d.id}))), console.warn);
export const subscribeTransactions = (cb,n=300) => onSnapshot(query(collection(_db,"transactions"),orderBy("createdAt","desc"),limit(n)), s=>cb(s.docs.map(d=>({...d.data(),id:d.id}))), console.warn);
export const subscribeStockLogs    = (cb,n=300) => onSnapshot(query(collection(_db,"stockLogs"),orderBy("createdAt","desc"),limit(n)), s=>cb(s.docs.map(d=>({...d.data(),id:d.id}))), console.warn);
export const subscribeAttendance   = (cb,n=500) => onSnapshot(query(collection(_db,"attendance"),orderBy("createdAt","desc"),limit(n)), s=>cb(s.docs.map(d=>({...d.data(),id:d.id}))), console.warn);
export const subscribeReturns      = (cb,n=200) => onSnapshot(query(collection(_db,"returns"),orderBy("createdAt","desc"),limit(n)), s=>cb(s.docs.map(d=>({...d.data(),id:d.id}))), console.warn);
export const subscribeActivityLogs = (cb,n=200) => onSnapshot(query(collection(_db,"activityLogs"),orderBy("createdAt","desc"),limit(n)), s=>cb(s.docs.map(d=>({...d.data(),id:d.id}))), console.warn);
export const subscribeTargets      = (cb) => onSnapshot(collection(_db,"targets"), s=>cb(s.docs.map(d=>({...d.data(),id:d.id}))), console.warn);

// ── Activity log ────────────────────────────────────────────────
export const fbLogActivity = async (actor, action, detail, business="") => {
  try {
    await addDoc(collection(_db,"activityLogs"), {
      actor, action, detail, business,
      date: new Date().toLocaleString("id-ID"),
      dateISO: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });
  } catch {}
};

// ── Users ───────────────────────────────────────────────────────
export const fbAddUser = async (user, actor) => {
  const data = { ...user, passwordHash: await hashPassword(user.password) };
  if (data.faceDescriptor) data.faceDescriptor = Array.from(data.faceDescriptor);
  await setDoc(doc(_db,"users",String(user.id)), data);
  await fbLogActivity(actor,"Tambah Pengguna",`${user.name} (${user.role})`);
};

export const fbUpdateUser = async (id, data, actor) => {
  const upd = { ...data };
  if (upd.faceDescriptor) upd.faceDescriptor = Array.from(upd.faceDescriptor);
  
  // Jika ada password baru (bukan hash), buat hash baru
  if (upd.password && upd.password.length !== 64) {
    upd.passwordHash = await hashPassword(upd.password);
  }
  
  // merge:true = tidak hapus field lain, aman offline
  await setDoc(doc(_db,"users",String(id)), upd, { merge: true });
  if (actor) await fbLogActivity(actor,"Edit Pengguna",`Edit: ${data.name}`);
};

export const fbDeleteUser = async (id, name, actor) => {
  await deleteDoc(doc(_db,"users",String(id)));
  await fbLogActivity(actor,"Hapus Pengguna",`Hapus: ${name}`);
};

export const fbChangePassword = async (userId, newPass, actor) => {
  const hash = await hashPassword(newPass);
  await setDoc(doc(_db,"users",String(userId)), { password:newPass, passwordHash:hash }, { merge:true });
  await fbLogActivity(actor,"Ganti Password","Password diperbarui");
};

// ── Products ────────────────────────────────────────────────────
export const fbAddProduct = async (p, actor) => {
  // setDoc digunakan di sini karena ini adalah produk baru
  await setDoc(doc(_db,"products",String(p.id)), p);
  await fbLogActivity(actor,"Tambah Produk",`${p.name} (${p.barcode})`,p.business);
};

export const fbUpdateProduct = async (id, data, actor) => {
  // merge:true = aman offline, tidak hapus field lain
  await setDoc(doc(_db,"products",String(id)), data, { merge: true });
  if (actor && data.name) await fbLogActivity(actor,"Edit Produk",`Edit: ${data.name}`,data.business);
};

export const fbDeleteProduct = async (id, name, biz, actor) => {
  await deleteDoc(doc(_db,"products",String(id)));
  await fbLogActivity(actor,"Hapus Produk",`Hapus: ${name}`,biz);
};

// ── Transaction ─────────────────────────────────────────────────
export const fbAddTransaction = async (trx, stockUpdates, logs) => {
  const batch = writeBatch(_db);
  batch.set(doc(_db,"transactions",trx.id), { ...trx, createdAt:serverTimestamp() });
  
  stockUpdates.forEach(({productId,newStock}) =>
    batch.set(doc(_db,"products",String(productId)), { stock: newStock }, { merge:true }));
    
  logs.forEach(log =>
    batch.set(doc(_db,"stockLogs",log.id), { ...log, createdAt:serverTimestamp() }));
    
  await batch.commit();
  await fbLogActivity(trx.kasir,"Transaksi",`${trx.id} — Rp ${trx.total.toLocaleString("id-ID")}`,trx.business);
};

// ── Retur ───────────────────────────────────────────────────────
export const fbAddReturn = async (ret, stockUpdates, logs) => {
  const batch = writeBatch(_db);
  batch.set(doc(_db,"returns",ret.id), { ...ret, createdAt:serverTimestamp() });
  batch.set(doc(_db,"transactions",ret.originalTrxId), { returned:true, returnId:ret.id }, { merge:true });
  
  stockUpdates.forEach(({productId,newStock}) =>
    batch.set(doc(_db,"products",String(productId)), { stock: newStock }, { merge:true }));
    
  logs.forEach(log =>
    batch.set(doc(_db,"stockLogs",log.id), { ...log, createdAt:serverTimestamp() }));
    
  await batch.commit();
  await fbLogActivity(ret.kasir,"Retur",`${ret.id} dari ${ret.originalTrxId}`,ret.business);
};

// ── Stock ────────────────────────────────────────────────────────
export const fbUpdateStock = async (productId, newStock, newPrice, log, actor) => {
  const batch = writeBatch(_db);
  
  const upd = { stock: Number(newStock) };
  if (newPrice !== undefined && newPrice > 0) upd.price = Number(newPrice);

  // setDoc with merge=true works offline even if doc not in local cache
  batch.set(doc(_db,"products",String(productId)), upd, { merge: true });
  
  if (log) batch.set(doc(_db,"stockLogs",log.id), { ...log, createdAt:serverTimestamp() });
  
  await batch.commit();
  if (actor) await fbLogActivity(actor,"Update Stok",`${log?.name}: ${log?.before}→${newStock}`,log?.business);
};

// ── Attendance ──────────────────────────────────────────────────
export const fbCheckIn = async (rec) => {
  // Try server check first (prevents duplicates when online)
  // If offline, skip server check — App-level lock in sessionStorage handles dedup
  try {
    const snap = await getDocs(
      query(collection(_db,"attendance"),
        where("userId","==",rec.userId),
        where("date","==",rec.date),
        where("business","==",rec.business))
    );
    if (!snap.empty) return null;
  } catch {
    // Offline or query failed — proceed with setDoc (idempotent with same id)
  }
  // Use merge:false — if doc exists it overwrites (safe, same data)
  return setDoc(doc(_db,"attendance",rec.id), { ...rec, createdAt:serverTimestamp() });
};

export const fbCheckOut = async (docId, t) =>
  setDoc(doc(_db,"attendance",docId), { checkOut:t, checkOutISO:new Date().toISOString(), updatedAt:serverTimestamp() }, { merge:true });

export const fbDeleteAttendance = async (id) => deleteDoc(doc(_db,"attendance",id));

export const fbClearAttendanceByDate = async (dateStr) => {
  const snap = await getDocs(collection(_db,"attendance"));
  const batch = writeBatch(_db);
  snap.docs.forEach(d => { if(d.data().date===dateStr) batch.delete(d.ref); });
  await batch.commit();
};

// ── Targets ─────────────────────────────────────────────────────
export const fbSetTarget = async (t) =>
  setDoc(doc(_db,"targets",t.id), { ...t, updatedAt:serverTimestamp() });

export const fbDeleteTarget = async (id) => deleteDoc(doc(_db,"targets",id));

// ── Google Sheets ────────────────────────────────────────────────
export const syncToSheets = async (url, users, products, transactions, stockLogs, attendance) => {
  try {
    const r = await fetch(url, {
      method:"POST",
      body: JSON.stringify({
        action:"syncAll",
        users: users.map(u=>({...u,faceDescriptor:null,password:"***",passwordHash:"***"})),
        products, transactions, stockLogs, attendance,
      })
    });
    return r.ok;
  } catch {
    return false;
  }
};

// ── Opname ─────────────────────────────────────────────────────
export const subscribeOpnames = (cb) => onSnapshot(
  query(collection(_db,"opnames"), orderBy("createdAt","desc"), limit(50)),
  s=>cb(s.docs.map(d=>({...d.data(),id:d.id}))), console.warn
);
export const subscribeOpnameItems = (opnameId, cb) => onSnapshot(
  collection(_db,"opnames",opnameId,"items"),
  s=>cb(s.docs.map(d=>({...d.data(),id:d.id}))), console.warn
);

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

// ── Belanja operasional ──────────────────────────────
export const subscribeExpenses = (cb, n=500) => onSnapshot(
  query(collection(_db,"expenses"), orderBy("createdAt","desc"), limit(n)),
  s => cb(s.docs.map(d => ({ ...d.data(), id:d.id }))), console.warn);

export const fbAddExpense = async (exp, actor) => {
  const id = exp.id || ("EXP-" + Date.now().toString(36) + Math.random().toString(36).slice(2,5)).toUpperCase();
  await setDoc(doc(_db,"expenses",id), { ...exp, id, createdAt:serverTimestamp() });
  await fbLogActivity(actor, "Belanja Operasional", `${exp.category}: Rp ${Number(exp.amount).toLocaleString("id-ID")}${exp.description ? " — " + exp.description : ""}`, exp.business);
};

export const fbDeleteExpense = async (id, label, business, actor) => {
  await deleteDoc(doc(_db,"expenses",id));
  await fbLogActivity(actor, "Hapus Belanja", label, business);
};

// ── Konfigurasi etalase publik (foto landing page + nomor WhatsApp) ──
export const subscribeLanding = (cb) => onSnapshot(
  doc(_db,"settings","landing"),
  s => cb(s.exists() ? s.data() : {}), console.warn);

export const fbSetLanding = async (data, actor) => {
  await setDoc(doc(_db,"settings","landing"), { ...data, updatedAt:serverTimestamp() }, { merge:true });
  if (actor) await fbLogActivity(actor, "Etalase Publik", "Perbarui foto / nomor WA landing page");
};

// ── Setelan laporan keuangan (modal awal & prive) ──
export const subscribeFinance = (cb) => onSnapshot(
  doc(_db,"settings","finance"),
  s => cb(s.exists() ? s.data() : {}), console.warn);

export const fbSetFinance = async (data, actor) => {
  await setDoc(doc(_db,"settings","finance"), { ...data, updatedAt:serverTimestamp() }, { merge:true });
  if (actor) await fbLogActivity(actor, "Keuangan", "Perbarui modal awal / prive");
};

// ── Pesanan Baju Custom ────────────────────────────────────────
export const subscribeCustomOrders = (cb, n = 200) => {
  if (!_db) return () => {};
  return onSnapshot(
    query(collection(_db, "customOrders"), orderBy("createdAt", "desc"), limit(n)),
    s => cb(s.docs.map(d => ({ ...d.data(), id: d.id }))),
    console.warn
  );
};

export const fbSaveCustomOrder = async (orderData) => {
  const localId = "cst_" + Date.now().toString(36);
  const payload = {
    ...orderData,
    date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    createdAt: serverTimestamp(),
    status: orderData.status || "Baru",
  };

  // Always keep in local backup for offline or immediate viewing
  try {
    const raw = localStorage.getItem("je_custom_orders_backup");
    const list = raw ? JSON.parse(raw) : [];
    localStorage.setItem("je_custom_orders_backup", JSON.stringify([
      { ...payload, id: localId, createdAt: new Date().toISOString() },
      ...list.slice(0, 99)
    ]));
  } catch {}

  if (!_db) return localId;
  try {
    const ref = await addDoc(collection(_db, "customOrders"), payload);
    return ref.id;
  } catch (err) {
    console.warn("fbSaveCustomOrder Firestore error:", err);
    return localId;
  }
};

export const fbUpdateCustomOrderStatus = async (orderId, status, actor) => {
  // Update local backup
  try {
    const raw = localStorage.getItem("je_custom_orders_backup");
    if (raw) {
      const list = JSON.parse(raw);
      const updated = list.map(o => o.id === orderId ? { ...o, status } : o);
      localStorage.setItem("je_custom_orders_backup", JSON.stringify(updated));
    }
  } catch {}

  if (!_db) return;
  try {
    await updateDoc(doc(_db, "customOrders", String(orderId)), {
      status,
      updatedAt: serverTimestamp(),
    });
    if (actor) await fbLogActivity(actor, "Status Pesanan Custom", `Pesanan ${orderId} diubah ke ${status}`);
  } catch (err) {
    console.warn("fbUpdateCustomOrderStatus error:", err);
  }
};

export const fbDeleteCustomOrder = async (orderId, actor) => {
  // Remove from local backup
  try {
    const raw = localStorage.getItem("je_custom_orders_backup");
    if (raw) {
      const list = JSON.parse(raw);
      const updated = list.filter(o => o.id !== orderId);
      localStorage.setItem("je_custom_orders_backup", JSON.stringify(updated));
    }
  } catch {}

  if (!_db) return;
  try {
    await deleteDoc(doc(_db, "customOrders", String(orderId)));
    if (actor) await fbLogActivity(actor, "Hapus Pesanan Custom", `Pesanan ${orderId} dihapus`);
  } catch (err) {
    console.warn("fbDeleteCustomOrder error:", err);
  }
};

