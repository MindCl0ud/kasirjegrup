// ═══════════════════════════════════════════════════════════════
//  KASIR JE GRUP — Firebase Service Layer
//  Handles all Firestore operations + offline persistence
// ═══════════════════════════════════════════════════════════════

import { initializeApp, getApps } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED,
  collection, doc,
  setDoc, addDoc, getDoc, getDocs,
  updateDoc, deleteDoc,
  onSnapshot, query, orderBy, limit,
  serverTimestamp, writeBatch,
} from "firebase/firestore";

// ── Config storage (localStorage) ───────────────────────────
const CONFIG_KEY = "je_grup_fb_config";

export const loadConfig = () => {
  try { return JSON.parse(localStorage.getItem(CONFIG_KEY)); }
  catch { return null; }
};

export const saveConfig = (cfg) =>
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));

export const clearConfig = () => localStorage.removeItem(CONFIG_KEY);

// ── Firebase instance ────────────────────────────────────────
let _db = null;

export const getDB = () => _db;

export const initFirebase = async (config) => {
  try {
    // Prevent double-init
    const existing = getApps();
    const app = existing.length > 0
      ? existing[0]
      : initializeApp(config);

    // Enable offline persistence with multi-tab support
    _db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      }),
    });

    saveConfig(config);
    return { ok: true, db: _db };
  } catch (err) {
    // If already initialized with different settings, try getFirestore
    if (err.code === "failed-precondition" || err.message?.includes("already")) {
      const { getFirestore } = await import("firebase/firestore");
      _db = getFirestore();
      return { ok: true, db: _db };
    }
    return { ok: false, error: err.message };
  }
};

// ── Seed check ───────────────────────────────────────────────
export const isSeeded = async () => {
  try {
    const snap = await getDoc(doc(_db, "meta", "seeded"));
    return snap.exists();
  } catch { return false; }
};

export const seedDatabase = async (users, products) => {
  try {
    const batch = writeBatch(_db);

    // Users
    users.forEach(u => {
      const data = { ...u };
      // Convert faceDescriptor (Float32Array → plain array for Firestore)
      if (data.faceDescriptor) data.faceDescriptor = Array.from(data.faceDescriptor);
      batch.set(doc(_db, "users", String(u.id)), data);
    });

    // Products
    products.forEach(p => {
      batch.set(doc(_db, "products", String(p.id)), p);
    });

    // Mark seeded
    batch.set(doc(_db, "meta", "seeded"), {
      seeded: true, at: serverTimestamp(), version: 3
    });

    await batch.commit();
    return true;
  } catch (err) {
    console.error("Seed error:", err);
    return false;
  }
};

// ── Real-time Subscriptions ──────────────────────────────────
export const subscribeUsers = (cb) => {
  return onSnapshot(
    collection(_db, "users"),
    (snap) => cb(snap.docs.map(d => ({ ...d.data(), _docId: d.id }))),
    (err) => console.warn("Users listener error:", err)
  );
};

export const subscribeProducts = (cb) => {
  return onSnapshot(
    collection(_db, "products"),
    (snap) => cb(snap.docs.map(d => ({ ...d.data(), _docId: d.id }))),
    (err) => console.warn("Products listener error:", err)
  );
};

export const subscribeTransactions = (cb, limitN = 200) => {
  return onSnapshot(
    query(collection(_db, "transactions"), orderBy("createdAt", "desc"), limit(limitN)),
    (snap) => cb(snap.docs.map(d => ({ ...d.data(), _docId: d.id }))),
    (err) => console.warn("Transactions listener error:", err)
  );
};

export const subscribeStockLogs = (cb, limitN = 300) => {
  return onSnapshot(
    query(collection(_db, "stockLogs"), orderBy("createdAt", "desc"), limit(limitN)),
    (snap) => cb(snap.docs.map(d => ({ ...d.data(), _docId: d.id }))),
    (err) => console.warn("StockLogs listener error:", err)
  );
};

export const subscribeAttendance = (cb, limitN = 500) => {
  return onSnapshot(
    query(collection(_db, "attendance"), orderBy("createdAt", "desc"), limit(limitN)),
    (snap) => cb(snap.docs.map(d => ({ ...d.data(), _docId: d.id }))),
    (err) => console.warn("Attendance listener error:", err)
  );
};

// ── User Operations ──────────────────────────────────────────
export const fbAddUser = async (user) => {
  const data = { ...user };
  if (data.faceDescriptor) data.faceDescriptor = Array.from(data.faceDescriptor);
  await setDoc(doc(_db, "users", String(user.id)), data);
};

export const fbUpdateUser = async (id, data) => {
  const update = { ...data };
  if (update.faceDescriptor) update.faceDescriptor = Array.from(update.faceDescriptor);
  await setDoc(doc(_db, "users", String(id)), update);
};

export const fbDeleteUser = async (id) => {
  await deleteDoc(doc(_db, "users", String(id)));
};

// ── Product Operations ───────────────────────────────────────
export const fbAddProduct = async (product) => {
  await setDoc(doc(_db, "products", String(product.id)), product);
};

export const fbUpdateProduct = async (id, data) => {
  await updateDoc(doc(_db, "products", String(id)), data);
};

export const fbDeleteProduct = async (id) => {
  await deleteDoc(doc(_db, "products", String(id)));
};

// ── Transaction (checkout) ───────────────────────────────────
export const fbAddTransaction = async (trx, stockUpdates, logs) => {
  const batch = writeBatch(_db);

  // Add transaction
  batch.set(doc(_db, "transactions", trx.id), {
    ...trx, createdAt: serverTimestamp()
  });

  // Update stock for each product
  stockUpdates.forEach(({ productId, newStock }) => {
    batch.update(doc(_db, "products", String(productId)), { stock: newStock });
  });

  // Add stock logs
  logs.forEach(log => {
    batch.set(doc(_db, "stockLogs", log.id), {
      ...log, createdAt: serverTimestamp()
    });
  });

  await batch.commit();
};

// ── Stock Update (stok role) ─────────────────────────────────
export const fbUpdateStock = async (productId, newStock, newPrice, log) => {
  const batch = writeBatch(_db);

  const update = { stock: newStock };
  if (newPrice !== undefined && newPrice > 0) update.price = newPrice;
  batch.update(doc(_db, "products", String(productId)), update);

  if (log) {
    batch.set(doc(_db, "stockLogs", log.id), {
      ...log, createdAt: serverTimestamp()
    });
  }

  await batch.commit();
};

// ── Attendance ───────────────────────────────────────────────
export const fbCheckIn = async (record) => {
  await setDoc(doc(_db, "attendance", record.id), {
    ...record, createdAt: serverTimestamp()
  });
};

export const fbCheckOut = async (docId, checkOutTime) => {
  await updateDoc(doc(_db, "attendance", docId), {
    checkOut: checkOutTime, updatedAt: serverTimestamp()
  });
};

// ── Full sync to Google Sheets (optional) ───────────────────
export const syncToSheets = async (gsUrl, users, products, transactions, stockLogs, attendance) => {
  const r = await fetch(gsUrl, {
    method: "POST",
    body: JSON.stringify({
      action: "syncAll",
      users: users.map(u => ({ ...u, faceDescriptor: null })), // don't send biometric
      products, transactions, stockLogs, attendance
    })
  });
  return r.ok;
};

// ── Attendance delete/clear ───────────────────────────────────
export const fbDeleteAttendance = async (docId) => {
  await deleteDoc(doc(_db, "attendance", docId));
};

export const fbClearAttendanceByDate = async (dateStr) => {
  const snap = await getDocs(collection(_db, "attendance"));
  const batch = writeBatch(_db);
  snap.docs.forEach(d => {
    if (d.data().date === dateStr) batch.delete(d.ref);
  });
  await batch.commit();
};
