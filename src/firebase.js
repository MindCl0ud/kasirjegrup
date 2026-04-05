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
export const loadConfig  = () => { try { return JSON.parse(localStorage.getItem(CONFIG_KEY)); } catch { return null; } };
export const saveConfig  = (c) => localStorage.setItem(CONFIG_KEY, JSON.stringify(c));
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
  
  // MENGGUNAKAN updateDoc agar data lain tidak hilang
  await updateDoc(doc(_db,"users",String(id)), upd);
  if (actor) await fbLogActivity(actor,"Edit Pengguna",`Edit: ${data.name}`);
};

export const fbDeleteUser = async (id, name, actor) => {
  await deleteDoc(doc(_db,"users",String(id)));
  await fbLogActivity(actor,"Hapus Pengguna",`Hapus: ${name}`);
};

export const fbChangePassword = async (userId, newPass, actor) => {
  const hash = await hashPassword(newPass);
  await updateDoc(doc(_db,"users",String(userId)), { password:newPass, passwordHash:hash });
  await fbLogActivity(actor,"Ganti Password","Password diperbarui");
};

// ── Products ────────────────────────────────────────────────────
export const fbAddProduct = async (p, actor) => {
  // setDoc digunakan di sini karena ini adalah produk baru
  await setDoc(doc(_db,"products",String(p.id)), p);
  await fbLogActivity(actor,"Tambah Produk",`${p.name} (${p.barcode})`,p.business);
};

export const fbUpdateProduct = async (id, data, actor) => {
  // Pastikan menggunakan updateDoc
  await updateDoc(doc(_db,"products",String(id)), data);
  if (actor) await fbLogActivity(actor,"Edit Produk",`Edit: ${data.name}`,data.business);
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
    batch.update(doc(_db,"products",String(productId)), { stock: newStock }));
    
  logs.forEach(log =>
    batch.set(doc(_db,"stockLogs",log.id), { ...log, createdAt:serverTimestamp() }));
    
  await batch.commit();
  await fbLogActivity(trx.kasir,"Transaksi",`${trx.id} — Rp ${trx.total.toLocaleString("id-ID")}`,trx.business);
};

// ── Retur ───────────────────────────────────────────────────────
export const fbAddReturn = async (ret, stockUpdates, logs) => {
  const batch = writeBatch(_db);
  batch.set(doc(_db,"returns",ret.id), { ...ret, createdAt:serverTimestamp() });
  batch.update(doc(_db,"transactions",ret.originalTrxId), { returned:true, returnId:ret.id });
  
  stockUpdates.forEach(({productId,newStock}) =>
    batch.update(doc(_db,"products",String(productId)), { stock: newStock }));
    
  logs.forEach(log =>
    batch.set(doc(_db,"stockLogs",log.id), { ...log, createdAt:serverTimestamp() }));
    
  await batch.commit();
  await fbLogActivity(ret.kasir,"Retur",`${ret.id} dari ${ret.originalTrxId}`,ret.business);
};

// ── Stock ────────────────────────────────────────────────────────
export const fbUpdateStock = async (productId, newStock, newPrice, log, actor) => {
  const batch = writeBatch(_db);
  
  // Hanya update field yang diperlukan agar tidak menimpa field lain
  const upd = { stock: Number(newStock) };
  if (newPrice !== undefined && newPrice > 0) {
    upd.price = Number(newPrice);
  }

  const productRef = doc(_db, "products", String(productId));
  batch.update(productRef, upd);
  
  if (log) {
    batch.set(doc(_db,"stockLogs",log.id), { ...log, createdAt:serverTimestamp() });
  }
  
  await batch.commit();
  if (actor) await fbLogActivity(actor,"Update Stok",`${log?.name}: ${log?.before}→${newStock}`,log?.business);
};

// ── Attendance ──────────────────────────────────────────────────
export const fbCheckIn = async (rec) => {
  try {
    const snap = await getDocs(
      query(collection(_db,"attendance"),
        where("userId","==",rec.userId),
        where("date","==",rec.date),
        where("business","==",rec.business))
    );
    if (!snap.empty) return null; 
  } catch {}
  return setDoc(doc(_db,"attendance",rec.id), { ...rec, createdAt:serverTimestamp() });
};

export const fbCheckOut = async (docId, t) =>
  updateDoc(doc(_db,"attendance",docId), { checkOut:t, checkOutISO:new Date().toISOString(), updatedAt:serverTimestamp() });

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
