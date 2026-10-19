import { useState, useEffect, useRef, useCallback, Component } from "react";
import React from "react"; // Pastikan React terimport untuk komponen fungsional
import {
  loadConfig, hasEnvConfig, saveConfig, clearConfig, initFirebase, isSeeded, seedDatabase,
  subscribeUsers, subscribeProducts, subscribeTransactions, subscribeStockLogs,
  subscribeAttendance, subscribeReturns, subscribeActivityLogs, subscribeTargets,
  fbAddUser, fbUpdateUser, fbDeleteUser, fbAddProduct, fbUpdateProduct, fbDeleteProduct,
  fbAddTransaction, fbAddReturn, fbUpdateStock, fbCheckIn, fbCheckOut,
  fbDeleteAttendance, fbClearAttendanceByDate,
  fbSetTarget, fbDeleteTarget, fbChangePassword,
  fbLogActivity, verifyPassword, subscribeExpenses, fbAddExpense, fbDeleteExpense,
  subscribeOpnames, subscribeOpnameItems, fbCreateOpname, fbCloseOpname,
  fbDeleteOpname, fbUpdateOpnameItem, fbBulkUpdateOpnameItems, fbApplyOpnameAdjustments,
  subscribeLanding, fbSetLanding,
  subscribeCustomOrders, fbUpdateCustomOrderStatus, fbDeleteCustomOrder,
} from "./firebase.js";
// QRIS dinonaktifkan (stub). Untuk mengaktifkan: pakai `import { getQris, toDynamicQris, qrDataUrl } from "./qris.js";`
const getQris = () => null;
const toDynamicQris = (q) => q;
const qrDataUrl = async () => "";
import {
  Check, CheckCircle2, X, AlertTriangle, Ban, Package, User, Users, Crown, ClipboardList, ClipboardCheck, Wallet, Clock,
  Search, Pencil, Plus, ScanLine, Target, Store, Receipt, CalendarDays, CreditCard, KeyRound, Trash2,
  Briefcase, Factory, Sun, Moon, Flame, Lightbulb, ShoppingCart, Lock, BarChart3, TrendingUp, Link2, Tag,
  Shirt, Sparkles, Home, Printer, RefreshCw, Folder, FileText, Eye, EyeOff, Building2, LayoutDashboard,
  Undo2, Activity, Upload, PanelLeftClose, PanelLeftOpen, ChevronRight, LogOut, Bell, ArrowLeftRight, ArrowLeft, MoreHorizontal, WifiOff, Info,
  QrCode, ChevronLeft, ShoppingBasket, Megaphone, ExternalLink, ShoppingBag,
  ArrowRight, MessageCircle, ShieldCheck, BadgeCheck, Download,
} from "lucide-react";
import CustomShirtStudio from "./CustomShirtStudio.jsx";

// ─────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────
const BIZ = {
  JS_CLOTHING:{ id:"JS_CLOTHING", name:"JS Clothing", desc:"Usaha Konveksi", icon:"👕", color:"#38bdf8" },
  JB_STORE:   { id:"JB_STORE",    name:"JB Store",    desc:"Toko Skincare",  icon:"✨", color:"#f472b6" },
};
const SEED_USERS = [
  { id:1, username:"admin",    password:"admin123", name:"Administrator",  role:"admin", access:["JS_CLOTHING","JB_STORE"], avatar:"👑", active:true, faceDescriptor:null },
  { id:2, username:"kasir",    password:"kasir123", name:"Kasir JE Grup",  role:"kasir", access:["JS_CLOTHING","JB_STORE"], avatar:"🧑‍💼", active:true, faceDescriptor:null },
  { id:4, username:"stok.js",  password:"stok123",  name:"Stok JS Cloth",  role:"stok",  access:["JS_CLOTHING"],           avatar:"🧑‍🏭", active:true, faceDescriptor:null },
  { id:5, username:"stok.jb",  password:"stok123",  name:"Stok JB Store",  role:"stok",  access:["JB_STORE"],              avatar:"👩‍🏭", active:true, faceDescriptor:null },
];
const SEED_PRODUCTS = [
  { id:1,  barcode:"JSC001", name:"Kaos Polos S",           price:45000,  hpp:25000,  stock:150, category:"Kaos",        business:"JS_CLOTHING" },
  { id:2,  barcode:"JSC002", name:"Kaos Polos M",           price:45000,  hpp:25000,  stock:120, category:"Kaos",        business:"JS_CLOTHING" },
  { id:3,  barcode:"JSC003", name:"Kaos Polos L",           price:45000,  hpp:25000,  stock:100, category:"Kaos",        business:"JS_CLOTHING" },
  { id:4,  barcode:"JSC004", name:"Kaos Polos XL",          price:50000,  hpp:28000,  stock:80,  category:"Kaos",        business:"JS_CLOTHING" },
  { id:5,  barcode:"JSC005", name:"Kemeja Formal M",        price:120000, hpp:72000,  stock:60,  category:"Kemeja",      business:"JS_CLOTHING" },
  { id:6,  barcode:"JSC006", name:"Kemeja Formal L",        price:125000, hpp:75000,  stock:55,  category:"Kemeja",      business:"JS_CLOTHING" },
  { id:7,  barcode:"JSC007", name:"Celana Chino 30",        price:150000, hpp:90000,  stock:40,  category:"Celana",      business:"JS_CLOTHING" },
  { id:8,  barcode:"JSC008", name:"Celana Chino 32",        price:150000, hpp:90000,  stock:35,  category:"Celana",      business:"JS_CLOTHING" },
  { id:9,  barcode:"JSC009", name:"Jaket Hoodie M",         price:185000, hpp:110000, stock:30,  category:"Jaket",       business:"JS_CLOTHING" },
  { id:10, barcode:"JSC010", name:"Jaket Hoodie L",         price:190000, hpp:112000, stock:25,  category:"Jaket",       business:"JS_CLOTHING" },
  { id:11, barcode:"JBS001", name:"Somethinc Moisturizer",  price:89000,  hpp:52000,  stock:40,  category:"Moisturizer", business:"JB_STORE" },
  { id:12, barcode:"JBS002", name:"Wardah Sunscreen SPF50", price:55000,  hpp:32000,  stock:60,  category:"Sunscreen",   business:"JB_STORE" },
  { id:13, barcode:"JBS003", name:"Skintific Serum Vit C",  price:125000, hpp:74000,  stock:35,  category:"Serum",       business:"JB_STORE" },
  { id:14, barcode:"JBS004", name:"Cetaphil Face Wash",     price:75000,  hpp:44000,  stock:50,  category:"Cleanser",    business:"JB_STORE" },
  { id:15, barcode:"JBS005", name:"Emina Face Toner",       price:42000,  hpp:24000,  stock:45,  category:"Toner",       business:"JB_STORE" },
  { id:16, barcode:"JBS006", name:"The Ordinary Niacinam",  price:180000, hpp:105000, stock:20,  category:"Serum",       business:"JB_STORE" },
  { id:17, barcode:"JBS007", name:"Azarine Sunscreen SPF45",price:48000,  hpp:28000,  stock:55,  category:"Sunscreen",   business:"JB_STORE" },
  { id:18, barcode:"JBS008", name:"Scarlett Brightening",   price:98000,  hpp:58000,  stock:30,  category:"Brightening", business:"JB_STORE" },
];
const PAYMENT_METHODS = ["Tunai","Transfer","QRIS","Debit","Kredit"];
let NEXT_ID = Date.now(); // Gunakan timestamp agar ID unik

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
const rp  = n => "Rp " + Number(n).toLocaleString("id-ID");
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,5);
const euclidean = (d1,d2) => Math.sqrt(d1.reduce((s,v,i)=>s+(v-d2[i])**2,0));
const nowStr    = () => new Date().toLocaleString("id-ID");
const todayDate = () => new Date().toLocaleDateString("id-ID");
const todayISO8601 = () => new Date().toISOString().slice(0,10);
const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 hours

// ─────────────────────────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
// Palet "Tenun Sumba": indigo tarum sebagai warna merek, hijau khusus untuk sukses/uang.
// Catatan: C.on = warna teks di atas warna aksen (putih di tema terang, indigo gelap di tema gelap).
const DARK_C = {
  bg0:"#0A0D1F",bg1:"#0F1330",bg2:"#171C40",bg3:"#1E2450",bg4:"#2A3166",
  bo0:"rgba(190,200,255,0.09)",bo1:"rgba(190,200,255,0.16)",bo2:"rgba(190,200,255,0.26)",
  t0:"#EEF0FF",t1:"#B8BFE3",t2:"#8991BC",t3:"#6F78AB",
  pri:"#8E9CFF",pri1:"rgba(142,156,255,0.16)",on:"#0F1330",
  g:"#3FD99B",g1:"rgba(63,217,155,0.14)",g2:"rgba(63,217,155,0.07)",
  a:"#F5B945",a1:"rgba(245,185,69,0.15)",
  r:"#FF7B8C",r1:"rgba(255,123,140,0.15)",
  b:"#62B6F5",b1:"rgba(98,182,245,0.15)",
  p:"#F27BAE",p1:"rgba(242,123,174,0.15)",
  cy:"#4CC9DB",cy1:"rgba(76,201,219,0.14)",
  vi:"#B49BFF",vi1:"rgba(180,155,255,0.15)",
  sh:"0 1px 0 rgba(255,255,255,0.03)",sh2:"0 16px 40px rgba(2,4,20,0.6)",
};
const LIGHT_C = {
  bg0:"#E6E9F3",bg1:"#F4F5FA",bg2:"#FFFFFF",bg3:"#F0F2F9",bg4:"#E1E5F1",
  bo0:"rgba(28,36,88,0.09)",bo1:"rgba(28,36,88,0.15)",bo2:"rgba(28,36,88,0.26)",
  t0:"#12173A",t1:"#3E4670",t2:"#5F678E",t3:"#8E95B5",
  pri:"#2F3C94",pri1:"rgba(47,60,148,0.09)",on:"#FFFFFF",
  g:"#0F7B58",g1:"rgba(15,123,88,0.10)",g2:"rgba(15,123,88,0.05)",
  a:"#A85F00",a1:"rgba(168,95,0,0.11)",
  r:"#C4263B",r1:"rgba(196,38,59,0.10)",
  b:"#1B64B0",b1:"rgba(27,100,176,0.10)",
  p:"#B8316A",p1:"rgba(184,49,106,0.10)",
  cy:"#0B7487",cy1:"rgba(11,116,135,0.10)",
  vi:"#6842BD",vi1:"rgba(104,66,189,0.10)",
  sh:"0 1px 2px rgba(18,23,58,0.05), 0 4px 14px rgba(18,23,58,0.04)",sh2:"0 12px 36px rgba(18,23,58,0.18)",
};
let C = { ...(localStorage.getItem("je_theme")==="dark" ? DARK_C : LIGHT_C) };
const isDarkTheme = () => C.bg2 === DARK_C.bg2;
const F = { sans:"'Figtree Variable','Figtree',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif", mono:"'Figtree Variable','Figtree',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif" };
const syncThemeColor = () => { try { document.querySelector('meta[name="theme-color"]')?.setAttribute("content", C.bg2); } catch {} };
syncThemeColor();

// Pita ikat (elemen khas): deretan belah ketupat gading + merah mengkudu di atas indigo.
const IKAT_TILE = encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><path d='M14 2 26 14 14 26 2 14Z' fill='none' stroke='#E9E1CC' stroke-width='1.6'/><path d='M14 8 20 14 14 20 8 14Z' fill='#A33A2D'/></svg>");

// ─────────────────────────────────────────────────────────────
//  XLSX DOWNLOAD
// ─────────────────────────────────────────────────────────────
const loadSheetJS = () => new Promise((res,rej)=>{
  if(window.XLSX){res(window.XLSX);return;}
  const s=document.createElement("script");
  s.src="https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js";
  s.onload=()=>res(window.XLSX); s.onerror=rej;
  document.head.appendChild(s);
});
const downloadXLSX = async (rows, cols, sheetName, filename) => {
  const XLSX = await loadSheetJS();
  const header = cols.map(c=>c.label);
  const data = rows.map(r=>cols.map(col=>{
    const v = col.fn ? col.fn(r) : (r[col.key]??"");
    return (col.num && !isNaN(+v) && v!=="") ? +v : String(v);
  }));
  const ws = XLSX.utils.aoa_to_sheet([header,...data]);
  ws["!cols"] = cols.map(col=>({wch:Math.max(col.label.length, col.w||18)}));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}_${new Date().toLocaleDateString("id-ID").replace(/\//g,"-")}.xlsx`);
};

// ─────────────────────────────────────────────────────────────
//  GLOBAL CSS
// ─────────────────────────────────────────────────────────────
const makeCSS = () => `
  :root{color-scheme:${isDarkTheme()?"dark":"light"};--safe-t:env(safe-area-inset-top,0px);--safe-b:env(safe-area-inset-bottom,0px);
    --ik1:#232C75;--ik2:#E9E1CC;--ik3:#A33A2D;}
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html{height:100%;-webkit-tap-highlight-color:transparent;-webkit-text-size-adjust:100%;}
  body{font-family:${F.sans};background:${C.bg1};color:${C.t0};height:100%;-webkit-font-smoothing:antialiased;
    overscroll-behavior:none;font-feature-settings:"tnum" 1;}
  #root{height:100%;display:flex;flex-direction:column;}
  input,button,select,textarea{font-family:inherit;}
  button{-webkit-tap-highlight-color:transparent;cursor:pointer;}
  button:disabled{cursor:not-allowed;}
  input:focus,textarea:focus,select:focus{outline:none;}
  button:focus-visible,[role=button]:focus-visible,[role=switch]:focus-visible{outline:2px solid ${C.pri};outline-offset:2px;}
  input:focus-visible,textarea:focus-visible,select:focus-visible{box-shadow:0 0 0 3px ${C.pri1};}
  ::-webkit-scrollbar{width:6px;height:6px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:${C.bo2};border-radius:3px;}
  ::placeholder{color:${C.t3};}
  input[type=number]::-webkit-inner-spin-button{opacity:.4;}

  @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes slideUp{from{opacity:.4;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes scanLine{0%,100%{top:8%}50%{top:88%}}
  @keyframes pulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.2)}}
  @keyframes glow{0%,100%{opacity:.55}50%{opacity:1}}
  @keyframes ripple{from{transform:scale(0);opacity:.35}to{transform:scale(4);opacity:0}}
  @keyframes cardIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  @media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;}}

  .press{transition:transform .1s,background .15s,opacity .15s;}.press:active{transform:scale(.97);}
  .hrow{transition:background .1s;}.hrow:hover{background:${C.bg3}!important;}
  .mn{font-variant-numeric:tabular-nums;letter-spacing:-.01em;}

  /* ── Tab desktop ── */
  .atab{display:inline-flex;align-items:center;gap:7px;padding:13px 14px;background:transparent;border:none;border-bottom:2px solid transparent;
    color:${C.t2};font-size:13px;font-weight:600;white-space:nowrap;transition:color .15s,background .15s;font-family:${F.sans};}
  .atab.on{border-bottom-color:${C.pri};color:${C.pri};font-weight:700;}
  .atab:hover:not(.on){color:${C.t0};background:${C.bg3};}

  @media(max-width:640px){.hide-mobile{display:none!important;}
    input:not([type=checkbox]):not([type=radio]),select,textarea{font-size:16px!important;}
    .stat-grid-4,.stat-grid-3{grid-template-columns:repeat(2,1fr)!important;}}
  @media(min-width:641px){.hide-desktop{display:none!important;}
    .stat-grid-4{grid-template-columns:repeat(4,1fr)!important;}
    .stat-grid-3{grid-template-columns:repeat(3,1fr)!important;}}
  .mobile-card-list{display:flex;flex-direction:column;gap:10px;}
  .admin-content{flex:1;overflow-y:auto;padding:12px;padding-bottom:calc(88px + var(--safe-b));min-height:0;}
  @media(min-width:641px){.admin-content{padding:20px;padding-bottom:calc(24px + var(--safe-b));}}

  /* ── Navigasi bawah ── */
  .bnav{position:fixed;bottom:0;left:0;right:0;background:${C.bg2};border-top:1px solid ${C.bo0};
    display:flex;z-index:300;padding:6px 6px calc(6px + var(--safe-b));gap:2px;align-items:stretch;}
  @media(min-width:641px){.bnav{display:none;}}
  .bnavbtn{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;border:none;background:transparent;
    padding:2px 0;min-width:0;color:${C.t2};transition:color .15s;}
  .bnavbtn .bnav-icon{width:58px;height:30px;border-radius:15px;display:grid;place-items:center;transition:background .18s;}
  .bnavbtn.active{color:${C.pri};}
  .bnavbtn.active .bnav-icon{background:${C.pri1};}
  .bnavbtn .bnav-label{font-size:11.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:72px;}
  .bnavbtn.active .bnav-label{font-weight:700;}
  .bnav-dot{display:none;}

  /* ── Sheet & drawer ── */
  .drawer-overlay,.sheet-wrap{position:fixed;inset:0;background:rgba(12,16,46,.55);z-index:400;animation:fadeIn .16s ease;}
  .sheet-wrap{display:flex;align-items:flex-end;justify-content:center;z-index:450;}
  .drawer,.sheet{background:${C.bg2};border-radius:22px 22px 0 0;animation:slideUp .24s cubic-bezier(.2,.9,.3,1);box-shadow:${C.sh2};}
  .drawer{position:fixed;bottom:0;left:0;right:0;z-index:401;padding:0 0 calc(18px + var(--safe-b));}
  .sheet{width:100%;max-width:440px;max-height:88vh;overflow-y:auto;padding:8px 16px calc(18px + var(--safe-b));}
  .grabber{width:38px;height:4px;border-radius:2px;background:${C.bo2};margin:6px auto 12px;}
  @media(min-width:641px){.sheet-wrap{align-items:center;}.sheet{border-radius:20px;}}
  .srow{display:flex;align-items:center;gap:12px;width:100%;padding:12px 10px;border:none;background:transparent;border-radius:12px;
    text-align:left;color:${C.t0};font-size:14.5px;font-weight:600;min-height:48px;}
  .srow:hover{background:${C.bg3};}
  .srow .sic{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;flex-shrink:0;background:${C.bg3};color:${C.t1};}
  .hbtn{position:relative;width:40px;height:40px;border-radius:12px;border:none;background:transparent;color:${C.t1};display:grid;place-items:center;}
  .hbtn:hover{background:${C.bg3};}

  .admin-body{flex:1;display:flex;min-height:0;min-width:0;}
  .admin-content{min-width:0;}
  .sbtn{background:transparent;}
  .sbtn:not([aria-current]):hover{background:${C.bg3};}
  .sresize{position:absolute;top:0;bottom:0;right:-5px;width:10px;cursor:col-resize;z-index:5;touch-action:none;}
  .sresize::after{content:"";position:absolute;top:0;bottom:0;left:4px;width:2px;background:transparent;transition:background .15s;}
  .sresize:hover::after,.sresize.on::after,.sresize:focus-visible::after{background:${C.pri};}
  .sresize:focus-visible{outline:none;}

  /* ── Modal responsif: mobile = bottom sheet, desktop = dialog tengah ── */
  .mdl-wrap{position:fixed;inset:0;background:rgba(12,16,46,.55);display:flex;align-items:flex-end;justify-content:center;animation:fadeIn .16s ease;}
  .mdl{background:${C.bg2};width:100%;max-height:92dvh;display:flex;flex-direction:column;border-radius:22px 22px 0 0;
    box-shadow:${C.sh2};animation:slideUp .26s cubic-bezier(.2,.9,.3,1);overflow:hidden;}
  .mdl-lg,.mdl-xl{max-height:96dvh;}
  .mdl-head{display:flex;align-items:flex-start;gap:12px;padding:4px 16px 12px;flex-shrink:0;}
  .mdl-ico{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;flex-shrink:0;background:${C.pri1};color:${C.pri};}
  .mdl-title{font-size:18px;font-weight:800;letter-spacing:-.015em;line-height:1.25;margin-top:1px;}
  .mdl-sub{font-size:13px;color:${C.t2};margin-top:2px;}
  .mdl-x{width:40px;height:40px;margin-right:-6px;border:none;background:transparent;color:${C.t2};border-radius:12px;display:grid;place-items:center;flex-shrink:0;}
  .mdl-x:hover{background:${C.bg3};}
  .mdl-body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:6px 16px 18px;}
  .mdl-foot{display:flex;flex-direction:column-reverse;gap:8px;padding:12px 16px calc(12px + var(--safe-b));border-top:1px solid ${C.bo0};background:${C.bg2};flex-shrink:0;}
  .mdl-foot>*{width:100%;}
  .mdl-row{display:flex;gap:8px;}.mdl-row>*{flex:1;}
  .fgrid{display:grid;grid-template-columns:1fr;gap:14px;}
  .fgrid .full{grid-column:1/-1;}
  .fgrid.m2{grid-template-columns:1fr 1fr;gap:14px 12px;}
  input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}
  input[type=number]{-moz-appearance:textfield;appearance:textfield;}
  .fsec{margin-top:20px;padding-top:18px;border-top:1px solid ${C.bo0};}
  .fsec-title{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:800;margin-bottom:8px;}
  .split{display:grid;grid-template-columns:1fr;gap:18px;}
  .split-side{background:${C.bg3};border-radius:16px;padding:14px 16px;align-self:start;}
  .inv-layout{display:grid;grid-template-columns:1fr;gap:18px;}
  .inv-paper{background:${C.bg2};border:1px solid ${C.bo1};border-radius:16px;padding:16px;}
  .inv-meta{display:grid;grid-template-columns:1fr 1fr;gap:12px 16px;padding:14px 0;border-bottom:1px dashed ${C.bo2};}
  .inv-rows{padding:6px 0;}
  .inv-row{display:grid;grid-template-columns:1fr auto;gap:12px;padding:9px 0;font-size:14px;border-bottom:1px solid ${C.bo0};align-items:start;}
  .inv-row:last-child{border-bottom:none;}
  .inv-headrow{font-size:12px;font-weight:700;color:${C.t2};padding-top:4px;}
  .inv-side{background:${C.bg3};border-radius:16px;padding:16px;align-self:start;}
  @media(min-width:641px){
    .mdl-wrap{align-items:center;padding:24px;}
    .mdl{max-width:var(--mw);border-radius:20px;max-height:min(90dvh,860px);animation:popIn .2s cubic-bezier(.2,.9,.3,1);}
    .mdl .grabber{display:none;}
    .mdl-head{padding:22px 24px 12px;}
    .mdl-body{padding:6px 24px 22px;}
    .mdl-foot{flex-direction:row;justify-content:flex-end;padding:14px 24px;}
    .mdl-foot>*{width:auto;min-width:104px;}
    .fgrid{grid-template-columns:1fr 1fr;gap:16px 18px;}
    .fgrid.cols3{grid-template-columns:repeat(3,1fr);}
    .split{grid-template-columns:minmax(0,1fr) 310px;gap:26px;}
    .split-side{position:sticky;top:0;}
    .inv-layout{grid-template-columns:minmax(0,1fr) 240px;gap:22px;}
    .inv-paper{padding:22px 24px;}
    .inv-meta{grid-template-columns:repeat(4,1fr);}
    .inv-row{grid-template-columns:minmax(0,1fr) 56px 110px 120px;}
    /* popup lama (bottom-aligned) ikut tampil sebagai dialog tengah di desktop */
    [style*="position: fixed"][style*="align-items: flex-end"]{align-items:center!important;}
    [style*="align-items: flex-end"]>div[style*="22px 22px 0px 0px"]{border-radius:20px!important;border-bottom:1px solid ${C.bo1}!important;}
  }
  @keyframes popIn{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}

  /* ── Penyempurnaan UX ── */
  .dash{display:flex;flex-direction:column;gap:10px;}
  @media(min-width:1000px){.dash{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start;}.dash>*{grid-column:1/-1;}.dash>.dash-half{grid-column:auto;}}
  @media(min-width:641px){table td,table th{font-size:13px!important;}}
  @media(max-width:640px){
    div:has(>.chip){flex-wrap:nowrap!important;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;}
    div:has(>.chip)::-webkit-scrollbar{display:none;}
    div:has(>.chip)>.chip{flex-shrink:0;}
    .ptool>button,.ptool .press{min-height:40px;}
    .ptool-search{flex:1 1 100%!important;width:100%!important;min-height:42px;}
  }

  @media(max-width:640px){
    div:has(>.fbtn){flex-wrap:nowrap!important;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;}
    div:has(>.fbtn)::-webkit-scrollbar{display:none;}
    .fbtn{flex-shrink:0;min-height:38px;font-size:13px!important;padding:0 14px!important;white-space:nowrap;}
  }

  .pgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}
  @media(min-width:641px){.pgrid{grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:12px;}}
  .tile:not(:disabled):hover{border-color:${C.pri}!important;}
  .catalog-scroll{flex:1;overflow-y:auto;min-height:0;padding:12px 12px calc(150px + var(--safe-b));}
  @media(min-width:641px){.catalog-scroll{padding:16px 16px 20px;}}
  .cartbar{position:fixed;left:10px;right:10px;bottom:calc(66px + var(--safe-b));z-index:250;display:flex;align-items:center;gap:12px;
    background:${C.bg2};border:1px solid ${C.bo1};border-radius:18px;padding:9px 10px 9px 12px;box-shadow:${C.sh2};}

  /* ── Kartu & chip ── */
  .mcard{background:${C.bg2};border-radius:16px;border:1px solid ${C.bo0};padding:14px 15px;box-shadow:${C.sh};transition:transform .12s,background .1s;}
  .mcard:active{transform:scale(.985);background:${C.bg3};}
  .mcard-glass{background:${C.bg2};border-radius:16px;border:1px solid ${C.bo1};padding:14px 15px;}
  .chip{display:inline-flex;align-items:center;gap:6px;padding:9px 15px;border-radius:50px;font-size:13px;font-weight:600;
    border:1.5px solid ${C.bo1};background:transparent;color:${C.t1};font-family:inherit;transition:all .15s;min-height:38px;}
  .chip:active{transform:scale(.96);}
  .chip.on{background:${C.pri1};border-color:${C.pri};color:${C.pri};font-weight:700;}
  .stat-mobile{border-radius:16px;padding:14px;position:relative;overflow:hidden;display:flex;flex-direction:column;gap:6px;
    border:1px solid ${C.bo0};background:${C.bg2};box-shadow:${C.sh};}
  .stat-mobile .stat-val{font-size:20px;font-weight:800;font-variant-numeric:tabular-nums;line-height:1;}
  .stat-mobile .stat-lbl{font-size:12px;font-weight:600;color:${C.t2};}
  .stat-mobile .stat-ico{position:absolute;right:12px;top:12px;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;}
  .ripple-wrap{position:relative;overflow:hidden;}
  .ripple-wrap .ripple{position:absolute;border-radius:50%;background:currentColor;width:40px;height:40px;margin-top:-20px;margin-left:-20px;animation:ripple .5s ease-out forwards;pointer-events:none;}
  .mfield{display:flex;flex-direction:column;gap:4px;}
  .mfield-label{font-size:12px;font-weight:600;color:${C.t2};}
  .card-in{animation:cardIn .2s ease both;}
  .card-in:nth-child(2){animation-delay:.03s}.card-in:nth-child(3){animation-delay:.06s}.card-in:nth-child(4){animation-delay:.09s}

  /* ── Layar masuk & pilih bisnis ── */
  .login-shell{flex:1;display:flex;flex-direction:column;width:100%;max-width:460px;margin:0 auto;min-height:100dvh;}
  .login-hero{background:var(--ik1);color:#fff;padding:calc(34px + var(--safe-t)) 24px 28px;}
  .ikat-band{height:30px;flex-shrink:0;border-top:2px solid var(--ik3);border-bottom:2px solid var(--ik3);
    background:var(--ik1) url("data:image/svg+xml,${IKAT_TILE}") repeat-x center/auto 26px;}
  .login-body{flex:1;padding:24px 20px calc(24px + var(--safe-b));display:flex;flex-direction:column;gap:16px;}
  @media(min-width:641px){
    .login-shell{min-height:auto;margin:6vh auto;border-radius:24px;overflow:hidden;box-shadow:${C.sh2};background:${C.bg2};flex:none;}
  }

  /* ── Etalase publik / landing page ── */
  .lp-title{font-size:clamp(30px,4.6vw,46px);}
  .lp-shot{position:relative;overflow:hidden;background:${C.bg3};}
  .lp-photo,.lp-cover{display:block;width:100%;height:100%;object-fit:cover;}
  .lp-cover{position:absolute;inset:0;}
  .lp-shot .lp-photo{transition:transform .5s cubic-bezier(.16,1,.3,1);}
  .lp-shot:hover .lp-photo{transform:scale(1.045);}
  .lp-lift{transition:transform .18s cubic-bezier(.16,1,.3,1),box-shadow .18s,border-color .18s;}
  .lp-lift:hover{transform:translateY(-3px);box-shadow:${C.sh2};}
  .lp-card-in{animation:fadeUp .45s cubic-bezier(.16,1,.3,1) both;}
  .lp-card-in:nth-child(2n){animation-delay:.05s;}
  .lp-card-in:nth-child(3n){animation-delay:.1s;}
  #katalog,#tentang,#kontak{scroll-margin-top:90px;}
  .lp-header-wrap{position:sticky;top:0;z-index:100;width:100%;padding:calc(12px + var(--safe-t)) 16px 8px;transition:padding .2s ease;}
  @media(min-width:641px){.lp-header-wrap{padding:calc(14px + var(--safe-t)) 24px 8px;}}
  .lp-navbar{max-width:1180px;margin:0 auto;height:60px;padding:0 14px 0 16px;
    display:flex;align-items:center;justify-content:space-between;gap:12;
    background:${isDarkTheme()?"rgba(18,23,58,0.72)":"rgba(255,255,255,0.78)"};
    backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);
    border:1px solid ${isDarkTheme()?"rgba(255,255,255,0.12)":"rgba(18,23,58,0.08)"};
    border-radius:20px;box-shadow:${isDarkTheme()?"0 12px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)":"0 10px 30px rgba(18,23,58,0.06), inset 0 1px 0 rgba(255,255,255,0.8)"};
    transition:box-shadow .2s ease,border-color .2s ease;}
  .lp-nav-pill{display:flex;align-items:center;gap:2px;background:${isDarkTheme()?"rgba(255,255,255,0.05)":"rgba(18,23,58,0.04)"};padding:3px;border-radius:14px;border:1px solid ${isDarkTheme()?"rgba(255,255,255,0.06)":"rgba(18,23,58,0.04)"};}
  .nav-link{display:inline-flex;align-items:center;padding:7px 14px;border-radius:11px;font-size:13px;font-weight:600;color:${C.t2};text-decoration:none;transition:all .15s ease;}
  .nav-link:hover{color:${C.t0};background:${isDarkTheme()?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.9)"};box-shadow:${isDarkTheme()?"none":"0 2px 6px rgba(0,0,0,0.04)"};}
  .lp-status-badge{display:inline-flex;align-items:center;gap:6px;padding:3px 9px 3px 7px;border-radius:20px;background:${C.g1};border:1px solid ${C.g}33;font-size:11.5px;font-weight:700;color:${C.g};}
  .lp-status-dot{width:7px;height:7px;border-radius:50%;background:${C.g};box-shadow:0 0 8px ${C.g};animation:pulse 2s infinite ease-in-out;}
  @media(max-width:820px){.lp-nav-links{display:none!important;}}
  @media(max-width:480px){.lp-status-badge{display:none!important;}}
  @media(hover:none){.lp-shot:hover .lp-photo{transform:none;}.lp-lift:hover{transform:none;}}
  @media(prefers-reduced-motion:no-preference){html{scroll-behavior:smooth;}}
`;
let CSS = makeCSS();

// ─────────────────────────────────────────────────────────────
//  IKON (emoji lama → ikon garis Lucide, supaya tampilan konsisten)
// ─────────────────────────────────────────────────────────────
const ICO = {
  "✓":Check,"✅":CheckCircle2,"✕":X,"✗":X,"❌":X,"⚠":AlertTriangle,"⚠️":AlertTriangle,"⛔":Ban,
  "📦":Package,"🧑":User,"👤":User,"👩":User,"👑":Crown,"📋":ClipboardList,"💰":Wallet,"⏰":Clock,"🕐":Clock,
  "🔍":Search,"✏️":Pencil,"➕":Plus,"📷":ScanLine,"🎯":Target,"🏬":Store,"🧾":Receipt,"📅":CalendarDays,"📆":CalendarDays,
  "💳":CreditCard,"🔑":KeyRound,"🗑":Trash2,"🗑️":Trash2,"💼":Briefcase,"🏭":Factory,"☀️":Sun,"🌙":Moon,"🔥":Flame,
  "💡":Lightbulb,"🛒":ShoppingCart,"🔒":Lock,"📊":BarChart3,"👥":Users,"🔗":Link2,"🏷":Tag,"📈":TrendingUp,
  "👕":Shirt,"✨":Sparkles,"🏠":Home,"🖨️":Printer,"🔄":RefreshCw,"📁":Folder,"📂":Folder,"📝":FileText,
  "👁":Eye,"🏢":Building2,"🆕":Sparkles,"↩":Undo2,
};
const DOT = {"🔴":"r","🟡":"a","🟢":"g"};
function Ico({e,size=16,color,style,strokeWidth=2}) {
  if(DOT[e]) return <span aria-hidden="true" style={{display:"inline-block",width:Math.round(size*.55),height:Math.round(size*.55),borderRadius:"50%",background:C[DOT[e]],verticalAlign:"middle",flexShrink:0,...style}}/>;
  const I=ICO[e];
  if(!I) return <span style={{fontSize:size,lineHeight:1,...style}}>{e}</span>;
  return <I size={size} strokeWidth={strokeWidth} color={color} aria-hidden="true" style={{flexShrink:0,verticalAlign:"-0.18em",...style}}/>;
}
const lumOf=h=>{const m=/^#?([0-9a-f]{6})$/i.exec(h||"");if(!m)return 0;const n=parseInt(m[1],16);
  const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);};
  return .2126*f((n>>16)&255)+.7152*f((n>>8)&255)+.0722*f(n&255);};
const onColor=h=>lumOf(h)>.34?"#10143A":"#FFFFFF";

// Logo: monogram JE di atas indigo dengan garis tenun kecil di bawahnya
function BrandMark({size=32,onDark}) {
  return <div aria-hidden="true" style={{width:size,height:size,borderRadius:Math.round(size*.3),flexShrink:0,position:"relative",overflow:"hidden",
    background:onDark?"var(--ik2)":"var(--ik1)",color:onDark?"var(--ik1)":"#fff",display:"grid",placeItems:"center",
    fontWeight:800,fontSize:Math.round(size*.4),letterSpacing:"-.03em",paddingBottom:Math.round(size*.1)}}>
    JE
    <span style={{position:"absolute",left:0,right:0,bottom:0,height:Math.max(3,Math.round(size*.13)),
      background:"repeating-linear-gradient(90deg,var(--ik3) 0 4px,"+(onDark?"var(--ik1)":"var(--ik2)")+" 4px 8px)"}}/>
  </div>;
}

// ─────────────────────────────────────────────────────────────
//  PRIMITIVE UI
// ─────────────────────────────────────────────────────────────
function Toast({n}) {
  if(!n) return null;
  const m={ok:[C.g,Check],err:[C.r,X],warn:[C.a,AlertTriangle],info:[C.b,Info]};
  const [cl,Ic]=m[n.type]||m.ok;
  const msg=String(n.msg??"").replace(/^[✓✕✗⚠✅❌⛔ℹ️\s]+/u,"");
  return <div role="status" aria-live="polite" style={{position:"fixed",top:"calc(12px + env(safe-area-inset-top, 0px))",left:"50%",transform:"translateX(-50%)",zIndex:9999,
    padding:"9px 16px 9px 9px",borderRadius:14,maxWidth:"min(92vw,420px)",width:"max-content",
    background:C.bg2,border:`1px solid ${C.bo1}`,color:C.t0,fontSize:13.5,fontWeight:600,lineHeight:1.35,
    boxShadow:C.sh2,animation:"fadeUp .2s ease",display:"flex",alignItems:"center",gap:10}}>
    <span style={{width:28,height:28,borderRadius:9,flexShrink:0,background:cl+"22",color:cl,display:"grid",placeItems:"center"}}>
      <Ic size={16} strokeWidth={2.4}/></span>{msg}
  </div>;
}
function Btn({onClick,children,color,outline,ghost,danger,disabled,full,size="md",style:s={}}) {
  const base=danger?C.r:(color||C.pri);
  const sz={sm:{h:36,p:"0 13px",f:13},md:{h:44,p:"0 18px",f:14.5},lg:{h:52,p:"0 22px",f:15.5}}[size]||{h:44,p:"0 18px",f:14.5};
  let bg=base,cl=onColor(base),bd=base;
  if(outline&&!danger){bg="transparent";cl=C.t0;bd=C.bo2;}
  else if(ghost){bg="transparent";cl=C.t1;bd="transparent";}
  if(disabled){bg=outline||ghost?"transparent":C.bg4;cl=C.t3;bd=outline?C.bo0:"transparent";}
  return <button onClick={onClick} disabled={disabled} className="press"
    style={{minHeight:sz.h,padding:sz.p,background:bg,border:`1.5px solid ${bd}`,borderRadius:12,color:cl,fontWeight:700,fontSize:sz.f,
      display:"inline-flex",alignItems:"center",justifyContent:"center",gap:7,width:full?"100%":undefined,...s}}>{children}</button>;
}
function Inp({value,onChange,type="text",placeholder,disabled,mono,onKeyDown,fref,icon,suffix,label,style:s={}}) {
  return <div style={{position:"relative"}}>
    {label&&<div style={{fontSize:12.5,fontWeight:600,color:C.t1,marginBottom:6}}>{label}</div>}
    <div style={{position:"relative",display:"flex",alignItems:"center"}}>
      {icon&&<span style={{position:"absolute",left:14,zIndex:1,pointerEvents:"none",color:C.t2,display:"flex"}}>
        {typeof icon==="string"?<Ico e={icon} size={17}/>:icon}</span>}
      <input ref={fref} type={type} value={value} onChange={onChange} onKeyDown={onKeyDown}
        placeholder={placeholder} disabled={disabled}
        style={{width:"100%",minHeight:46,padding:`12px ${suffix?"42px":"14px"} 12px ${icon?"42px":"14px"}`,
          background:C.bg3,border:`1.5px solid ${C.bo1}`,borderRadius:12,
          color:disabled?C.t2:C.t0,fontSize:15,fontFamily:F.sans,fontVariantNumeric:"tabular-nums",transition:"border-color .15s",...s}}
        onFocus={e=>{if(!disabled)e.target.style.borderColor=C.pri;}}
        onBlur={e=>e.target.style.borderColor=C.bo1}/>
      {suffix&&<span style={{position:"absolute",right:14,color:C.t2,fontSize:13,fontWeight:600,pointerEvents:"none"}}>{suffix}</span>}
    </div>
  </div>;
}
function Card({children,style:s={},onClick,accent,noPad,className}) {
  return <div className={className} onClick={onClick} style={{background:C.bg2,borderRadius:16,
    border:`1px solid ${accent?accent+"55":C.bo0}`,padding:noPad?0:"16px",
    boxShadow:C.sh,cursor:onClick?"pointer":undefined,...s}}>
    {children}</div>;
}
function EmptyState({icon,title,hint,pad=36}) {
  return <div style={{display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",gap:6,padding:`${pad}px 20px`}}>
    <span aria-hidden="true" style={{width:52,height:52,borderRadius:16,background:C.bg3,color:C.t3,display:"grid",placeItems:"center",marginBottom:4}}>
      {icon||<ClipboardList size={24} strokeWidth={1.6}/>}</span>
    <div style={{fontSize:14.5,fontWeight:700,color:C.t1}}>{title}</div>
    {hint&&<div style={{fontSize:13,color:C.t2,maxWidth:300,lineHeight:1.5}}>{hint}</div>}
  </div>;
}
function ProductTile({p,inCart,showBiz,onAdd}) {
  const out=p.stock<=0, low=p.stock>0&&p.stock<10;
  return <button onClick={()=>onAdd(p)} disabled={out} className="press tile" aria-label={`Tambah ${p.name}, ${rp(p.price)}${out?", stok habis":""}`}
    style={{position:"relative",textAlign:"left",background:C.bg2,border:`1.5px solid ${inCart?C.pri:C.bo0}`,borderRadius:14,padding:"11px 12px",display:"flex",flexDirection:"column",gap:6,minHeight:118,
      opacity:out?.55:1,boxShadow:C.sh,cursor:out?"not-allowed":"pointer",color:C.t0}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:6,minHeight:22}}>
      {showBiz?<BizChip biz={p.business} sm/>:<span/>}
      {inCart>0&&<span className="mn" style={{minWidth:24,height:24,padding:"0 7px",borderRadius:12,background:C.pri,color:C.on,fontSize:12.5,fontWeight:800,display:"grid",placeItems:"center"}}>{inCart}</span>}
    </div>
    <div style={{fontSize:14,fontWeight:700,lineHeight:1.3,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",flex:1}}>{p.name}</div>
    <div className="mn" style={{fontSize:15.5,fontWeight:800,color:C.pri}}>{rp(p.price)}</div>
    <div style={{fontSize:12,fontWeight:600,color:out?C.r:low?C.a:C.t2}}>{out?"Habis":`Stok ${p.stock}`}</div>
  </button>;
}
function Divider({my=10}) { return <div style={{height:1,background:C.bo0,margin:`${my}px 0`}}/>; }
function RoleTag({role}) {
  const m={kasir:[C.cy1,C.cy,"Kasir"],stok:[C.a1,C.a,"Stok"],admin:[C.vi1,C.vi,"Admin"]};
  const [bg,cl,l]=m[role]||m.kasir;
  return <span style={{padding:"3px 10px",borderRadius:20,fontSize:11.5,fontWeight:700,background:bg,color:cl}}>{l}</span>;
}
function BizChip({biz,sm}) {
  if(!biz||!BIZ[biz]) return null;
  const b=BIZ[biz],isJ=biz==="JS_CLOTHING",cl=isJ?C.b:C.p;
  return <span style={{display:"inline-flex",alignItems:"center",gap:5,
    padding:sm?"2px 8px":"4px 11px",borderRadius:20,fontSize:sm?11:12,fontWeight:700,
    background:isJ?C.b1:C.p1,color:cl}}>
    <Ico e={b.icon} size={sm?12:14}/> {b.name}</span>;
}
function StockBadge({s}) {
  if(s===0) return <span style={{padding:"2px 9px",borderRadius:20,background:C.r1,color:C.r,fontWeight:700,fontSize:12}}>Habis</span>;
  if(s<10)  return <span className="mn" style={{padding:"2px 9px",borderRadius:20,background:C.a1,color:C.a,fontWeight:700,fontSize:12}}>{s}</span>;
  return <span className="mn" style={{fontSize:13,fontWeight:600,color:C.t0}}>{s}</span>;
}
function OnlineDot({online,onDark}) {
  const cl=online?(onDark?"#7CE8BD":C.g):(onDark?"#FFC864":C.a);
  return <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,fontWeight:600,color:cl}}>
    <span style={{width:7,height:7,borderRadius:"50%",background:cl,flexShrink:0}}/>
    {online?"Online":"Offline"}</div>;
}
function Stat({icon,label,value,color=C.pri,sub,style:s={}}) {
  return <Card style={{padding:"12px 14px",...s}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
      <span style={{width:32,height:32,borderRadius:10,background:color+"1F",color,display:"grid",placeItems:"center",flexShrink:0}}>
        <Ico e={icon} size={17}/></span>
      <div style={{fontSize:12.5,fontWeight:600,color:C.t2,lineHeight:1.25}}>{label}</div>
    </div>
    <div className="mn" style={{fontSize:20,fontWeight:800,color:C.t0,lineHeight:1.1,letterSpacing:"-.02em"}}>{value}</div>
    {sub&&<div style={{fontSize:11.5,color:C.t2,marginTop:4}}>{sub}</div>}
  </Card>;
}
function THead({cols}) {
  return <thead><tr style={{position:"sticky",top:0,zIndex:2}}>
    {cols.map((c,i)=><th key={i} style={{padding:"11px 14px",textAlign:"left",color:C.t2,
      fontWeight:700,fontSize:12,whiteSpace:"nowrap",borderBottom:`1px solid ${C.bo1}`,background:C.bg3}}>{c}</th>)}
  </tr></thead>;
}
function TableWrap({children,maxH="58vh",compact}) {
  // Default: tinggi tabel mengisi sisa layar (scroll di dalam tabel). compact = tinggi tetap maxH (tabel kecil di dashboard).
  const ref=React.useRef(null);
  const [h,setH]=React.useState(null);
  React.useLayoutEffect(()=>{
    if(compact) return;
    const el=ref.current; if(!el) return;
    const box=el.closest(".admin-content");
    const measure=()=>{
      const mobile=window.innerWidth<=640;
      let avail;
      if(box){
        const top=el.getBoundingClientRect().top-box.getBoundingClientRect().top+box.scrollTop;
        avail=box.clientHeight-top-(mobile?100:24);
      } else avail=window.innerHeight-el.getBoundingClientRect().top-24;
      const nh=Math.max(260,Math.floor(avail));
      setH(prev=>prev===nh?prev:nh);
    };
    measure();
    window.addEventListener("resize",measure);
    const ro=typeof ResizeObserver!=="undefined"&&box?new ResizeObserver(measure):null;
    if(ro) ro.observe(box);
    return()=>{window.removeEventListener("resize",measure);ro?.disconnect();};
  },[compact]);
  return <div ref={ref} style={{overflowX:"auto",overflowY:"auto",WebkitOverflowScrolling:"touch",position:"relative",
    ...(compact?{maxHeight:maxH}:{height:h||undefined,maxHeight:h?undefined:maxH})}}>
    {children}</div>;
}
function ProgressBar({value,max,color=C.pri,label}) {
  const pct = max>0 ? Math.min((value/max)*100,100) : 0;
  return <div>
    {label&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12.5,marginBottom:6}}>
      <span style={{color:C.t2,fontWeight:600}}>{label}</span>
      <span className="mn" style={{color:C.t0,fontWeight:700}}>{pct.toFixed(0)}%</span>
    </div>}
    <div style={{height:8,background:C.bg4,borderRadius:4,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:4,transition:"width .5s ease"}}/>
    </div>
  </div>;
}
function SheetRow({icon,label,sub,onClick,danger,tone}) {
  const cl=danger?C.r:tone||C.t1;
  return <button className="srow press" onClick={onClick} style={{color:danger?C.r:C.t0}}>
    <span className="sic" style={{background:danger?C.r1:tone?tone+"1F":undefined,color:cl}}>{icon}</span>
    <span style={{flex:1,minWidth:0}}>
      <span style={{display:"block"}}>{label}</span>
      {sub&&<span style={{display:"block",fontSize:12.5,fontWeight:500,color:C.t2,marginTop:1}}>{sub}</span>}
    </span>
    {!danger&&<ChevronRight size={17} color={C.t3} aria-hidden="true"/>}
  </button>;
}

function Avatar({name,size=32,style}) {
  const ch=(name||"?").trim().charAt(0).toUpperCase();
  return <span aria-hidden="true" style={{width:size,height:size,borderRadius:"50%",background:C.pri1,color:C.pri,fontWeight:800,
    fontSize:Math.round(size*.42),display:"inline-grid",placeItems:"center",flexShrink:0,verticalAlign:"middle",...style}}>{ch}</span>;
}


// ─────────────────────────────────────────────────────────────
//  UPDATE BANNER
// ─────────────────────────────────────────────────────────────
function UpdateBanner({onUpdate}) {
  const [visible,setVisible] = React.useState(true);
  if(!visible) return null;
  return (
    <div role="alert" style={{position:"fixed",bottom:"calc(84px + env(safe-area-inset-bottom, 0px))",left:"50%",transform:"translateX(-50%)",
      zIndex:9000,width:"calc(100vw - 24px)",maxWidth:420,background:C.bg2,border:`1px solid ${C.bo1}`,borderRadius:16,
      padding:"12px 12px 12px 14px",boxShadow:C.sh2,display:"flex",alignItems:"center",gap:12,animation:"fadeUp .3s ease"}}>
      <span style={{width:36,height:36,borderRadius:11,background:C.pri1,color:C.pri,display:"grid",placeItems:"center",flexShrink:0}}>
        <RefreshCw size={18}/></span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:14,fontWeight:700,color:C.t0}}>Versi baru tersedia</div>
        <div style={{fontSize:12.5,color:C.t2}}>Perbarui untuk memakai fitur terbaru.</div>
      </div>
      <button onClick={()=>setVisible(false)} className="press" style={{minHeight:40,padding:"0 10px",background:"transparent",border:"none",color:C.t2,fontSize:13,fontWeight:600}}>Nanti</button>
      <button onClick={onUpdate} className="press" style={{minHeight:40,padding:"0 16px",background:C.pri,border:"none",borderRadius:11,color:C.on,fontSize:13.5,fontWeight:700}}>Perbarui</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  HEADER  — di HP hanya: logo, bisnis, bel peringatan, avatar.
//  Tombol lain (tema, muat ulang, pulang, keluar) ada di sheet akun.
// ─────────────────────────────────────────────────────────────
function Header({title,biz,user,onLogout,onSwitchBiz,onAbsenPulang,hasCheckedIn,online,onToggleTheme,isDark,lowStockCount=0,onLowStockClick,expireCount=0,expiredCount=0,onExpireClick,onGoLanding,onOpenCustomizer}) {
  const b=BIZ[biz];
  const [sheet,setSheet]=React.useState(null);
  const alertN=lowStockCount+expireCount+expiredCount;
  const bc=b?(biz==="JS_CLOTHING"?C.b:C.p):C.pri;
  const canSwitch=!!onSwitchBiz&&user?.access?.length>1;
  const close=()=>setSheet(null);
  const run=fn=>()=>{close();fn&&fn();};
  const initial=(user?.name||"?").trim().charAt(0).toUpperCase();

  return <>
    <header style={{background:C.bg2,borderBottom:`1px solid ${C.bo0}`,padding:"0 12px 0 14px",
      minHeight:"calc(58px + env(safe-area-inset-top, 0px))",paddingTop:"env(safe-area-inset-top, 0px)",
      display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:200,flexShrink:0,gap:10,
      backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
        <BrandMark size={34}/>
        {b ? (canSwitch
          ? <button onClick={onSwitchBiz} className="press" aria-label={`Bisnis aktif ${b.name}. Ganti bisnis`}
              style={{display:"flex",alignItems:"center",gap:7,minHeight:42,padding:"4px 8px 4px 6px",background:"transparent",border:`1px solid transparent`,borderRadius:11,minWidth:0,transition:"background .15s, border-color .15s"}}>
              <span style={{minWidth:0,textAlign:"left"}}>
                <span style={{display:"block",fontSize:14.5,fontWeight:800,color:C.t0,lineHeight:1.15,letterSpacing:"-.015em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.name}</span>
                <span style={{display:"block",fontSize:11,fontWeight:600,color:bc,lineHeight:1.2}}>{b.desc}</span>
              </span>
              <span style={{width:22,height:22,borderRadius:6,background:C.bg3,display:"grid",placeItems:"center",flexShrink:0,marginLeft:2}}>
                <ArrowLeftRight size={13} color={C.t2} aria-hidden="true"/>
              </span>
            </button>
          : <div style={{minWidth:0}}>
              <div style={{fontSize:14.5,fontWeight:800,color:C.t0,lineHeight:1.15,letterSpacing:"-.015em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.name}</div>
              <div style={{fontSize:11,fontWeight:600,color:bc,lineHeight:1.2}}>{b.desc}</div>
            </div>)
          : <div style={{minWidth:0}}>
              <div style={{fontSize:15,fontWeight:800,color:C.t0,lineHeight:1.15,letterSpacing:"-.015em"}}>{title||"Kasir JE Grup"}</div>
              <div style={{fontSize:11,fontWeight:600,color:C.t2,lineHeight:1.2}}>JS Clothing · JB Store</div>
            </div>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
        <div className="hide-mobile" style={{marginRight:6}}><OnlineDot online={online}/></div>
        {!online&&<span className="hide-desktop" title="Offline" style={{display:"grid",placeItems:"center",width:32,height:32,color:C.a}}><WifiOff size={17} aria-label="Offline"/></span>}
        <button className="hbtn press" onClick={()=>setSheet("alerts")} aria-label={alertN>0?`${alertN} peringatan`:"Peringatan"}
          style={{borderRadius:11,transition:"background .15s"}}>
          <Bell size={20} strokeWidth={1.85}/>
          {alertN>0&&<span className="mn" style={{position:"absolute",top:3,right:3,minWidth:18,height:18,padding:"0 4px",borderRadius:9,boxSizing:"border-box",
            background:expiredCount>0?C.r:C.a,color:C.on,fontSize:10.5,fontWeight:800,display:"grid",placeItems:"center",
            border:`2px solid ${C.bg2}`,boxShadow:C.sh}}>{alertN>99?"99+":alertN}</span>}
        </button>
        <button onClick={()=>setSheet("account")} className="press" aria-label={`Akun ${user?.name||""}`}
          style={{width:38,height:38,marginLeft:2,borderRadius:12,background:C.pri1,border:`1px solid ${C.pri}40`,color:C.pri,fontWeight:800,fontSize:14.5,letterSpacing:"-.02em",display:"grid",placeItems:"center"}}>
          {initial}</button>
      </div>
    </header>

    {sheet&&<div className="sheet-wrap" onClick={close}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={e=>e.stopPropagation()}>
        <div className="grabber"/>
        {sheet==="alerts"&&<>
          <div style={{fontSize:17,fontWeight:800,padding:"0 6px 8px"}}>Peringatan</div>
          {alertN===0
            ? <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"28px 12px 20px",textAlign:"center"}}>
                <span style={{width:48,height:48,borderRadius:16,background:C.g1,color:C.g,display:"grid",placeItems:"center"}}><Check size={24} strokeWidth={2.4}/></span>
                <div style={{fontSize:15,fontWeight:700}}>Semua aman</div>
                <div style={{fontSize:13,color:C.t2,maxWidth:260}}>Tidak ada stok menipis atau produk mendekati kadaluarsa.</div>
              </div>
            : <div style={{display:"flex",flexDirection:"column",gap:2}}>
                {expiredCount>0&&<SheetRow tone={C.r} icon={<Ban size={18}/>} label={`${expiredCount} produk kadaluarsa`} sub="Tarik dari rak dan catat" onClick={run(onExpireClick)}/>}
                {expireCount>0&&<SheetRow tone={C.a} icon={<Clock size={18}/>} label={`${expireCount} produk hampir kadaluarsa`} sub="Jual lebih dulu" onClick={run(onExpireClick)}/>}
                {lowStockCount>0&&<SheetRow tone={C.a} icon={<Package size={18}/>} label={`${lowStockCount} produk stok menipis`} sub="Stok di bawah 10" onClick={run(onLowStockClick)}/>}
              </div>}
        </>}
        {sheet==="account"&&<>
          <div style={{display:"flex",alignItems:"center",gap:14,padding:"4px 6px 14px"}}>
            <span style={{width:52,height:52,borderRadius:"50%",background:C.pri1,border:`1.5px solid ${C.pri}55`,color:C.pri,fontWeight:800,fontSize:21,display:"grid",placeItems:"center",flexShrink:0}}>{initial}</span>
            <div style={{minWidth:0,flex:1}}>
              <div style={{fontSize:16.5,fontWeight:800,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.name}</div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginTop:4,flexWrap:"wrap"}}>
                <RoleTag role={user?.role}/><OnlineDot online={online}/>
              </div>
            </div>
          </div>
          <Divider my={4}/>
          <div style={{display:"flex",flexDirection:"column",gap:2,paddingTop:6}}>
            {onGoLanding&&<SheetRow icon={<ShoppingBag size={18}/>} label="Lihat Etalase Iklan Publik" sub="Buka landing page promosi" onClick={run(onGoLanding)}/>}
            {onOpenCustomizer&&<SheetRow icon={<Shirt size={18}/>} label="Studio Desain Baju Custom" sub="Simulasi & rancang sablon pakaian" onClick={run(onOpenCustomizer)}/>}
            {onAbsenPulang&&hasCheckedIn&&<SheetRow tone={C.a} icon={<Home size={18}/>} label="Absen pulang" sub="Catat jam pulang hari ini" onClick={run(onAbsenPulang)}/>}
            {canSwitch&&<SheetRow icon={<ArrowLeftRight size={18}/>} label="Ganti bisnis" sub={b?`Sekarang: ${b.name}`:undefined} onClick={run(onSwitchBiz)}/>}
            {onToggleTheme&&<SheetRow icon={isDark?<Sun size={18}/>:<Moon size={18}/>} label={isDark?"Mode terang":"Mode gelap"} onClick={()=>{onToggleTheme();}}/>}
            <SheetRow icon={<RefreshCw size={18}/>} label="Muat ulang aplikasi" onClick={()=>window.location.reload()}/>
            <SheetRow danger icon={<LogOut size={18}/>} label="Keluar" onClick={run(onLogout)}/>
          </div>
        </>}
      </div>
    </div>}
  </>;
}


// ─────────────────────────────────────────────────────────────
//  FACE SCAN
// ─────────────────────────────────────────────────────────────
let faceReady=false;
const loadScript = url => new Promise((res,rej)=>{
  if(document.querySelector(`script[src="${url}"]`)){setTimeout(res,200);return;}
  const s=document.createElement("script");s.src=url;s.onload=res;s.onerror=rej;document.head.appendChild(s);
});
const initFaceAPI = async (onProg) => {
  if(faceReady) return true;
  try {
    onProg("Memuat library...");
    const local = await fetch("/models/face-api.js",{method:"HEAD"}).then(r=>r.ok).catch(()=>false);
    await loadScript(local?"/models/face-api.js":"https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js");
    const base=local?"/models":"https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights";
    onProg("Model deteksi wajah... (1/3)");
    await window.faceapi.nets.tinyFaceDetector.loadFromUri(base);
    onProg("Model landmark... (2/3)");
    await window.faceapi.nets.faceLandmark68TinyNet.loadFromUri(base);
    onProg("Model rekognisi... (3/3)");
    await window.faceapi.nets.faceRecognitionNet.loadFromUri(base);
    faceReady=true; return true;
  } catch { return false; }
};

function FaceScan({user,mode="verify",onSuccess,onCancel}) {
  const vidRef=useRef(null),canRef=useRef(null),streamRef=useRef(null),loopRef=useRef(null);
  const stableRef=useRef(0);
  const [phase,setPhase]=useState("init");
  const [msg,setMsg]=useState("");
  const [stable,setStable]=useState(0);
  const cleanup=useCallback(()=>{clearInterval(loopRef.current);streamRef.current?.getTracks().forEach(t=>t.stop());},[]);
  useEffect(()=>{start();return cleanup;},[]);
  const start=async()=>{
    setPhase("loading");
    const ok=await initFaceAPI(m=>setMsg(m));
    if(!ok){setPhase("error");setMsg("Gagal memuat model AI.");return;}
    try{
      setMsg("Mengakses kamera...");
      const stream=await navigator.mediaDevices.getUserMedia({video:{width:480,height:360,facingMode:"user"},audio:false});
      streamRef.current=stream;
      if(vidRef.current){vidRef.current.srcObject=stream;await new Promise(r=>{vidRef.current.onloadedmetadata=r;});vidRef.current.play();}
      setPhase("scanning");
      setMsg(mode==="register"?"Posisikan wajah, tahan diam 2 detik":"Posisikan wajah untuk verifikasi");
      startLoop();
    }catch{setPhase("no_camera");setMsg("Izin kamera ditolak.");}
  };
  const startLoop=()=>{
    stableRef.current=0;setStable(0);
    loopRef.current=setInterval(async()=>{
      if(!vidRef.current||!window.faceapi) return;
      const r=await window.faceapi.detectSingleFace(vidRef.current,
        new window.faceapi.TinyFaceDetectorOptions({inputSize:224,scoreThreshold:.5}))
        .withFaceLandmarks(true).withFaceDescriptor();
      draw(r);
      if(!r){stableRef.current=0;setStable(0);return;}
      stableRef.current++;setStable(stableRef.current);
      if(stableRef.current>=4){clearInterval(loopRef.current);setPhase("verifying");
        await new Promise(r=>setTimeout(r,800));verify(Array.from(r.descriptor));}
    },500);
  };
  const draw=(r)=>{
    const v=vidRef.current,c=canRef.current;if(!v||!c||!window.faceapi) return;
    c.width=v.videoWidth||480;c.height=v.videoHeight||360;
    const ctx=c.getContext("2d");ctx.clearRect(0,0,c.width,c.height);
    if(r){const {x,y,width:w,height:h}=r.detection.box,pad=12,cl=18;
      ctx.strokeStyle=C.g;ctx.lineWidth=2;ctx.shadowColor=C.g;ctx.shadowBlur=8;
      [[x-pad,y-pad,1,1],[x+w+pad,y-pad,-1,1],[x-pad,y+h+pad,1,-1],[x+w+pad,y+h+pad,-1,-1]].forEach(([cx,cy,sx,sy])=>{
        ctx.beginPath();ctx.moveTo(cx+sx*cl,cy);ctx.lineTo(cx,cy);ctx.lineTo(cx,cy+sy*cl);ctx.stroke();});}
  };
  const verify=(desc)=>{
    if(mode==="register"){onSuccess(desc);return;}
    if(!user.faceDescriptor){setPhase("success");setMsg("Wajah belum terdaftar. Masuk langsung.");setTimeout(()=>{cleanup();onSuccess(null);},1500);return;}
    const dist=euclidean(desc,user.faceDescriptor);
    if(dist<0.52){setPhase("success");setMsg(`Selamat datang, ${user.name}!`);setTimeout(()=>{cleanup();onSuccess(desc);},1500);}
    else{setPhase("fail");setMsg("Wajah tidak dikenali. Coba lagi.");}
  };
  const sc={scanning:C.b,verifying:C.a,success:C.g,fail:C.r,error:C.r,no_camera:C.r}[phase]||C.t2;
  const sl={init:"Mempersiapkan...",loading:msg,scanning:"Mendeteksi wajah...",verifying:"Memverifikasi...",
    success:"Berhasil",fail:"Tidak dikenali",error:"Error",no_camera:"Kamera tidak tersedia"}[phase];
  return <div style={{position:"fixed",inset:0,zIndex:1000,background:`${C.bg0}f0`,
    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:16,animation:"fadeIn .2s ease"}}>
    <div style={{width:"100%",maxWidth:420,animation:"fadeUp .3s ease"}}>
      <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:10,padding:"8px 16px",borderRadius:24,background:C.bg2,border:`1px solid ${C.bo1}`}}>
          <Avatar name={user.name} size={32}/>
          <div><div style={{fontSize:13,fontWeight:700}}>{user.name}</div><div style={{marginTop:2}}><RoleTag role={user.role}/></div></div>
        </div>
      </div>
      <h2 style={{textAlign:"center",fontSize:17,fontWeight:800,marginBottom:4}}>{mode==="register"?"Daftarkan Wajah":"Verifikasi Wajah"}</h2>
      <p style={{textAlign:"center",fontSize:12,color:C.t2,marginBottom:14}}>{msg||"Mempersiapkan kamera..."}</p>
      <div style={{position:"relative",borderRadius:18,overflow:"hidden",border:`2px solid ${sc}55`,background:"#000",aspectRatio:"4/3",marginBottom:12}}>
        <video ref={vidRef} autoPlay muted playsInline style={{width:"100%",height:"100%",objectFit:"cover",transform:"scaleX(-1)"}}/>
        <canvas ref={canRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",transform:"scaleX(-1)"}}/>
        {phase==="scanning"&&<div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
          <div style={{position:"absolute",left:"8%",right:"8%",height:2,
            background:`linear-gradient(90deg,transparent,${C.g},transparent)`,
            animation:"scanLine 2.5s ease-in-out infinite",boxShadow:`0 0 10px ${C.g}`}}/></div>}
        {(phase==="init"||phase==="loading")&&<div style={{position:"absolute",inset:0,background:"rgba(12,16,46,.55)",
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
          <div style={{width:32,height:32,border:`2.5px solid ${C.bg4}`,borderTopColor:C.g,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
          <p style={{fontSize:12,color:C.t1,textAlign:"center",padding:"0 20px"}}>{msg}</p></div>}
        {phase==="verifying"&&<div style={{position:"absolute",inset:0,background:"rgba(12,16,46,.55)",
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}>
          <div style={{width:40,height:40,border:`2.5px solid ${C.a}44`,borderTopColor:C.a,borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
          <p style={{fontSize:13,color:C.a,fontWeight:700}}>Memverifikasi...</p></div>}
        {phase==="success"&&<div style={{position:"absolute",inset:0,background:`${C.g}08`,display:"flex",alignItems:"center",justifyContent:"center"}}><Ico e="✅" size={72} color={C.g} strokeWidth={1.5}/></div>}
        {(phase==="fail"||phase==="error"||phase==="no_camera")&&<div style={{position:"absolute",inset:0,background:`${C.r}06`,display:"flex",alignItems:"center",justifyContent:"center"}}><Ico e="❌" size={72} color={C.r} strokeWidth={1.5}/></div>}
      </div>
      {phase==="scanning"&&<div style={{height:3,background:C.bg4,borderRadius:2,marginBottom:10,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${Math.min(stable/4*100,100)}%`,background:`linear-gradient(90deg,${C.b},${C.g})`,borderRadius:2,transition:"width .4s ease"}}/></div>}
      <div style={{padding:"9px 12px",borderRadius:10,background:C.bg3,border:`1px solid ${sc}22`,
        display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <span style={{width:7,height:7,borderRadius:"50%",background:sc,flexShrink:0,animation:phase==="scanning"?"pulse 1.5s ease infinite":undefined}}/>
        <span style={{fontSize:12,color:sc,fontWeight:600}}>{sl}</span></div>
      <div style={{display:"flex",gap:8,justifyContent:"center"}}>
        {phase==="fail"&&<Btn onClick={()=>{setPhase("scanning");stableRef.current=0;setStable(0);startLoop();}} full>Coba Lagi</Btn>}
        {(phase==="error"||phase==="no_camera")&&<Btn onClick={()=>{cleanup();onSuccess(null);}} color={C.a}>Lewati</Btn>}
        <Btn onClick={()=>{cleanup();onCancel();}} outline>Batal</Btn>
      </div>
    </div>
  </div>;
}

// ─────────────────────────────────────────────────────────────
//  INVOICE
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
//  MODAL RESPONSIF
//  Mobile  : bottom sheet (lebar penuh, tombol aksi bertumpuk, form 1 kolom)
//  Desktop : dialog di tengah (ukuran sm/md/lg/xl, tombol di kanan bawah, form 2 kolom)
// ─────────────────────────────────────────────────────────────
function Modal({open=true,title,subtitle,icon,size="md",onClose,footer,footClass="",children,dismiss=true,zIndex=700}) {
  const ref=React.useRef(null);
  React.useEffect(()=>{
    if(!open) return;
    const prev=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const onKey=e=>{if(e.key==="Escape"&&dismiss&&onClose){onClose();}};
    document.addEventListener("keydown",onKey);
    const t=setTimeout(()=>{
      const el=ref.current?.querySelector("[data-autofocus],input:not([disabled]):not([type=checkbox]),textarea,select");
      if(el&&window.matchMedia("(min-width:641px)").matches) el.focus({preventScroll:true});
    },80);
    return()=>{document.body.style.overflow=prev;document.removeEventListener("keydown",onKey);clearTimeout(t);};
  },[open]);
  if(!open) return null;
  const mw={sm:440,md:560,lg:780,xl:940}[size]||560;
  return <div className="mdl-wrap" style={{zIndex}} onMouseDown={e=>{if(e.target===e.currentTarget&&dismiss&&onClose)onClose();}}>
    <div ref={ref} className={`mdl mdl-${size}`} role="dialog" aria-modal="true" aria-label={typeof title==="string"?title:undefined} style={{"--mw":mw+"px",fontFamily:F.sans,color:C.t0}}>
      <div className="grabber"/>
      <header className="mdl-head">
        {icon&&<span className="mdl-ico">{icon}</span>}
        <div style={{flex:1,minWidth:0}}>
          <h2 className="mdl-title">{title}</h2>
          {subtitle&&<p className="mdl-sub">{subtitle}</p>}
        </div>
        {onClose&&<button className="mdl-x press" aria-label="Tutup" onClick={onClose}><X size={19}/></button>}
      </header>
      <div className="mdl-body">{children}</div>
      {footer&&<footer className={"mdl-foot "+footClass}>{footer}</footer>}
    </div>
  </div>;
}
function Sel({label,value,onChange,children,disabled}) {
  return <div>
    {label&&<div style={{fontSize:12.5,fontWeight:600,color:C.t1,marginBottom:6}}>{label}</div>}
    <select value={value} onChange={onChange} disabled={disabled}
      style={{width:"100%",minHeight:46,padding:"11px 12px",background:C.bg3,border:`1.5px solid ${C.bo1}`,borderRadius:12,color:C.t0,fontSize:15,fontFamily:F.sans}}>{children}</select>
  </div>;
}

// ─────────────────────────────────────────────────────────────
//  FORM PRODUK (tambah & edit) — modal
// ─────────────────────────────────────────────────────────────
function ProductFormModal({open,editing,editId,form,setForm,prods,biz,onSave,onClose,toast}) {
  if(!open) return null;
  const addons=form.addons||[];
  const bizId=form.business||biz;
  const set=k=>e=>setForm(x=>({...x,[k]:e.target.value}));
  const addAddon=()=>{
    const q=(form._addonSearch||"").trim().toLowerCase(); if(!q) return;
    const found=(prods||[]).find(p=>p&&p.business===bizId&&(p.barcode?.toLowerCase().includes(q)||p.name?.toLowerCase().includes(q))&&p.id!==editId);
    if(!found){toast("Produk tidak ditemukan","warn");return;}
    if(addons.includes(found.id)){toast("Sudah ada","warn");return;}
    setForm(x=>({...x,addons:[...addons,found.id],_addonSearch:""}));
    toast("Add-on ditambahkan: "+found.name);
  };
  const price=+form.price||0,hpp=+form.hpp||0;
  const days=form.expireDate?Math.ceil((new Date(form.expireDate)-new Date())/86400000):null;
  const chip=(bg,cl,t)=><span style={{padding:"5px 11px",borderRadius:20,background:bg,color:cl,fontSize:12.5,fontWeight:700}}>{t}</span>;
  return <Modal open size="lg" dismiss={false} onClose={onClose}
    icon={editing?<Pencil size={20}/>:<Plus size={20}/>}
    title={editing?"Edit produk":"Produk baru"} subtitle={BIZ[bizId]?.name}
    footer={<><Btn outline onClick={onClose}>Batal</Btn><Btn onClick={onSave}><Check size={17}/>{editing?"Simpan perubahan":"Simpan produk"}</Btn></>}>
    <div className="fgrid">
      <Inp label="Barcode *" value={form.barcode||""} disabled={editing} onChange={set("barcode")} mono/>
      <Inp label="Kategori" value={form.category||""} onChange={set("category")}/>
      <div className="full"><Inp label="Nama produk *" value={form.name||""} onChange={set("name")}/></div>
      <div className="full"><Inp label="Link foto produk (opsional) - tampil di etalase publik" value={form.photo||""} onChange={set("photo")} placeholder="https://drive.google.com/file/d/..."/></div>
    </div>
    <div className="fgrid m2" style={{marginTop:14}}>
      <Inp label="Harga jual *" type="number" suffix="Rp" value={form.price||""} onChange={set("price")}/>
      <Inp label="HPP / modal" type="number" suffix="Rp" value={form.hpp||""} onChange={set("hpp")}/>
      <Inp label="Stok *" type="number" value={form.stock===undefined?"":form.stock} onChange={set("stock")}/>
      <Inp label="Kedaluwarsa" type="date" value={form.expireDate||""} onChange={set("expireDate")}/>
    </div>
    {(price>0&&hpp>0||days!==null)&&<div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:14}}>
      {price>0&&hpp>0&&chip(C.g1,C.g,`Margin ${((price-hpp)/price*100).toFixed(1)}%`)}
      {price>0&&hpp>0&&chip(C.cy1,C.cy,`Laba ${rp(price-hpp)}/pcs`)}
      {days!==null&&(days<0?chip(C.r1,C.r,"Sudah kadaluarsa"):days<=30?chip(C.a1,C.a,`${days} hari lagi`):chip(C.g1,C.g,`${days} hari lagi`))}
    </div>}
    <div style={{marginTop:16,padding:"12px 14px",background:C.bg3,borderRadius:12,border:`1.5px solid ${form.advertised?C.pri:C.bo0}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:36,height:36,borderRadius:10,background:form.advertised?C.pri1:C.bg2,color:form.advertised?C.pri:C.t3,display:"grid",placeItems:"center",flexShrink:0}}>
          <Megaphone size={18}/>
        </div>
        <div>
          <div style={{fontSize:13.5,fontWeight:700,color:C.t0}}>Iklankan di Etalase Publik</div>
          <div style={{fontSize:11.5,color:C.t2}}>Tampilkan produk ini di landing page promosi pelanggan</div>
        </div>
      </div>
      <button type="button" role="switch" aria-checked={!!form.advertised}
        onClick={()=>setForm(x=>({...x,advertised:!x.advertised}))}
        className="press"
        style={{width:46,height:26,borderRadius:13,background:form.advertised?C.pri:C.bg4,border:`1.5px solid ${form.advertised?C.pri:C.bo1}`,position:"relative",cursor:"pointer",padding:0,flexShrink:0,transition:"background .2s"}}>
        <span style={{width:20,height:20,borderRadius:"50%",background:"#fff",position:"absolute",top:1.5,left:form.advertised?21:2,boxShadow:C.sh0,transition:"left .2s"}}/>
      </button>
    </div>
    <div className="fsec">
      <div className="fsec-title"><Plus size={16} color={C.vi}/>Add-on (opsional)</div>
      <p style={{fontSize:13,color:C.t2,lineHeight:1.5,marginBottom:12}}>Saat produk ini di-scan, kasir akan ditawari produk add-on berikut.</p>
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <div style={{flex:1}}><Inp value={form._addonSearch||""} onChange={set("_addonSearch")} placeholder="Cari nama atau barcode" icon={<Search size={16}/>}
          onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addAddon();}}}/></div>
        <Btn outline onClick={addAddon}>Tambah</Btn>
      </div>
      {addons.length>0
        ? <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {addons.map(adId=>{const ap=(prods||[]).find(x=>x&&x.id===adId);if(!ap) return null;
              return <div key={adId} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:C.bg3,borderRadius:12}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ap.name}</div>
                  <div className="mn" style={{fontSize:12,color:C.t2,marginTop:1}}>{ap.barcode} · {rp(ap.price)}</div>
                </div>
                <button aria-label={"Hapus add-on "+ap.name} onClick={()=>setForm(x=>({...x,addons:(x.addons||[]).filter(i=>i!==adId)}))} className="press"
                  style={{width:36,height:36,border:"none",background:C.r1,color:C.r,borderRadius:10,display:"grid",placeItems:"center"}}><X size={17}/></button>
              </div>;})}
          </div>
        : <div style={{padding:"14px",background:C.bg3,borderRadius:12,fontSize:13,color:C.t2,textAlign:"center"}}>Belum ada add-on</div>}
    </div>
  </Modal>;
}

// ─────────────────────────────────────────────────────────────
//  INVOICE — mobile: sheet + tombol bawah | desktop: dialog 2 kolom (invoice + panel aksi)
// ─────────────────────────────────────────────────────────────
function Invoice({receipt,biz,onClose,onNew}) {
  const b=BIZ[biz]||{};
  const items=receipt.items||[];
  const qty=items.reduce((s,i)=>s+i.qty,0);
  const [copied,setCopied]=React.useState(false);
  const printInvoice=()=>{
    const w=window.open("","_blank","width=420,height=700");
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Invoice ${receipt.id}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;font-size:12px;color:#000;padding:16px;max-width:320px;}
      .center{text-align:center;}.bold{font-weight:bold;}.mono{font-family:monospace;}
      .line{border-top:1px dashed #999;margin:8px 0;}.row{display:flex;justify-content:space-between;margin-bottom:4px;}
      .total{font-size:16px;font-weight:bold;}table{width:100%;border-collapse:collapse;}
      td{padding:3px 0;vertical-align:top;}td:last-child{text-align:right;white-space:nowrap;}
      .footer{text-align:center;font-size:10px;color:#666;margin-top:8px;}
      .pay{background:#f0f0f0;padding:4px 8px;border-radius:4px;font-size:11px;}
      </style></head><body>
      <div class="center bold" style="font-size:16px">JE GRUP</div>
      <div class="center" style="font-size:11px">${b?.name} — ${b?.desc}</div>
      <div class="line"></div>
      <div class="row"><span>No. Invoice</span><span class="mono bold">${receipt.id}</span></div>
      <div class="row"><span>Tanggal</span><span>${receipt.date}</span></div>
      <div class="row"><span>Kasir</span><span>${receipt.kasir}</span></div>
      ${receipt.namaPembeli&&receipt.namaPembeli!=="Umum"?`<div class="row"><span>Pembeli</span><span><b>${receipt.namaPembeli}</b></span></div>`:""}
      <div class="line"></div>
      <table><tbody>${receipt.items.map(item=>`<tr>
        <td>${item.name}<br/><span style="font-size:10px;color:#666">${item.qty} × Rp ${Number(item.price).toLocaleString("id-ID")}</span></td>
        <td>Rp ${Number(item.price*item.qty).toLocaleString("id-ID")}</td></tr>`).join("")}
      </tbody></table>
      <div class="line"></div>
      ${receipt.discount>0?`<div class="row"><span>Diskon</span><span>- Rp ${Number(receipt.discount).toLocaleString("id-ID")}</span></div>`:""}
      <div class="row total"><span>TOTAL</span><span>Rp ${Number(receipt.total).toLocaleString("id-ID")}</span></div>
      ${receipt.payment?`<div style="margin-top:6px;text-align:right"><span class="pay">Pembayaran: ${receipt.payment}</span></div>`:""}
      <div class="line"></div>
      <div class="footer">Terima kasih telah berbelanja!<br/>Barang yang sudah dibeli tidak dapat dikembalikan.</div>
      </body></html>`);
    w.document.close();setTimeout(()=>{w.print();},400);
  };
  const text=[`*${b.name||"JE Grup"}*`,`Invoice ${receipt.id}`,receipt.date,"",
    ...items.map(i=>`${i.name}\n  ${i.qty} x ${rp(i.price)} = ${rp(i.price*i.qty)}`),"",
    ...(receipt.discount>0?[`Diskon: -${rp(receipt.discount)}`]:[]),
    `*Total: ${rp(receipt.total)}*`,`Pembayaran: ${receipt.payment||"Tunai"}`,"","Terima kasih telah berbelanja!"].join("\n");
  const wa=()=>window.open("https://wa.me/?text="+encodeURIComponent(text),"_blank");
  const copy=async()=>{try{await navigator.clipboard.writeText(text);setCopied(true);setTimeout(()=>setCopied(false),1800);}catch{}};
  const meta=[["Tanggal",receipt.date],["Kasir",receipt.kasir],receipt.namaPembeli&&receipt.namaPembeli!=="Umum"?["Pembeli",receipt.namaPembeli]:null,["Pembayaran",receipt.payment||"Tunai"]].filter(Boolean);
  return <Modal open size="lg" onClose={onClose} icon={<Receipt size={20}/>} title="Invoice" subtitle={receipt.id}
    footClass="hide-desktop"
    footer={<>
      <div className="mdl-row">
        <Btn outline onClick={printInvoice}><Printer size={17}/>Cetak</Btn>
        <Btn outline onClick={wa}>WhatsApp</Btn>
      </div>
      {onNew?<Btn size="lg" onClick={onNew}>Transaksi baru</Btn>:<Btn size="lg" onClick={onClose}>Tutup</Btn>}
    </>}>
    <div className="inv-layout">
      <article className="inv-paper">
        <div style={{display:"flex",alignItems:"center",gap:12,paddingBottom:14,borderBottom:`1px dashed ${C.bo2}`}}>
          <BrandMark size={40}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:16,fontWeight:800,letterSpacing:"-.01em"}}>{b.name||"JE Grup"}</div>
            <div style={{fontSize:12.5,color:C.t2}}>{b.desc}</div>
          </div>
          <BizChip biz={biz} sm/>
        </div>
        <div className="inv-meta">
          {meta.map(([l,v])=><div key={l}><div style={{fontSize:12,color:C.t2}}>{l}</div><div className="mn" style={{fontSize:13.5,fontWeight:700,marginTop:1}}>{v}</div></div>)}
        </div>
        <div className="inv-rows">
          <div className="inv-row inv-headrow"><span>Barang</span><span className="hide-mobile" style={{textAlign:"right"}}>Qty</span><span className="hide-mobile" style={{textAlign:"right"}}>Harga</span><span style={{textAlign:"right"}}>Jumlah</span></div>
          {items.map((it,i)=><div key={i} className="inv-row">
            <span style={{minWidth:0}}>
              <span style={{display:"block",fontWeight:600,fontSize:14}}>{it.name}</span>
              <span className="hide-desktop mn" style={{display:"block",fontSize:12,color:C.t2,marginTop:1}}>{it.qty} × {rp(it.price)}</span>
            </span>
            <span className="hide-mobile mn" style={{textAlign:"right"}}>{it.qty}</span>
            <span className="hide-mobile mn" style={{textAlign:"right"}}>{rp(it.price)}</span>
            <span className="mn" style={{textAlign:"right",fontWeight:700}}>{rp(it.price*it.qty)}</span>
          </div>)}
        </div>
        <div style={{paddingTop:12,borderTop:`1px dashed ${C.bo2}`,marginTop:4}}>
          {receipt.discount>0&&<>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13.5,color:C.t2,marginBottom:4}}><span>Subtotal</span><span className="mn">{rp(receipt.subtotal||receipt.total+receipt.discount)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13.5,color:C.r,marginBottom:6}}><span>Diskon</span><span className="mn">− {rp(receipt.discount)}</span></div>
          </>}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
            <span style={{fontSize:14,fontWeight:700}}>Total</span>
            <span className="mn" style={{fontSize:26,fontWeight:800,letterSpacing:"-.02em"}}>{rp(receipt.total)}</span>
          </div>
          <div style={{fontSize:12.5,color:C.t2,marginTop:4}}>{items.length} produk · {qty} item</div>
        </div>
        <p style={{textAlign:"center",fontSize:12.5,color:C.t2,marginTop:16}}>Terima kasih telah berbelanja di {b.name||"JE Grup"}!</p>
      </article>
      <aside className="inv-side hide-mobile">
        <div style={{fontSize:13,fontWeight:800,marginBottom:12}}>Aksi</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <Btn full onClick={printInvoice}><Printer size={17}/>Cetak invoice</Btn>
          <Btn full outline onClick={wa}>Kirim lewat WhatsApp</Btn>
          <Btn full outline onClick={copy}>{copied?"Tersalin ✓":"Salin ringkasan"}</Btn>
        </div>
        <Divider my={16}/>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {onNew&&<Btn full color={C.g} onClick={onNew}>Transaksi baru</Btn>}
          <Btn full ghost onClick={onClose}>Tutup</Btn>
        </div>
      </aside>
    </div>
  </Modal>;
}


// Membagi keranjang per bisnis (sama dengan logika checkout) agar tiap toko punya nominal QRIS sendiri
function splitCart(cart,discAll,defBiz) {
  const subtotal=cart.reduce((s,c)=>s+c.price*c.qty,0);
  const groups={};
  cart.forEach(c=>{const b=c.business||defBiz;(groups[b]=groups[b]||[]).push(c);});
  const ids=Object.keys(groups);let left=discAll;
  return ids.map((b,i)=>{
    const sub=groups[b].reduce((s,c)=>s+c.price*c.qty,0);
    const disc=i===ids.length-1?left:Math.min(sub,Math.round(discAll*sub/subtotal));
    left-=disc;return {b,sub,disc,total:sub-disc};
  });
}

function QrisModal({open,groups,onPaid,onCancel}) {
  const [i,setI]=React.useState(0);
  const [img,setImg]=React.useState("");
  const [err,setErr]=React.useState("");
  const g=groups[i];
  React.useEffect(()=>{if(open)setI(0);},[open]);
  React.useEffect(()=>{
    if(!open||!g) return;
    let dead=false;setImg("");setErr("");
    try{qrDataUrl(toDynamicQris(getQris(g.b),g.total)).then(u=>{if(!dead)setImg(u);}).catch(e=>{if(!dead)setErr(e.message);});}
    catch(e){setErr(e.message);}
    return()=>{dead=true;};
  },[open,i,g?.b,g?.total]);
  if(!open||!g) return null;
  const b=BIZ[g.b]||{},last=i===groups.length-1;
  return <Modal open size="sm" dismiss={false} onClose={onCancel} icon={<QrCode size={20}/>} title="Bayar dengan QRIS"
    subtitle={groups.length>1?`${b.name} · ${i+1} dari ${groups.length}`:b.name}
    footer={<><Btn outline onClick={onCancel}>Batal</Btn>
      <Btn color={C.g} disabled={!img} onClick={()=>last?onPaid():setI(i+1)}><Check size={17}/>{last?"Sudah dibayar":"Sudah dibayar, lanjut"}</Btn></>}>
    <div style={{textAlign:"center"}}>
      <div className="mn" style={{fontSize:32,fontWeight:800,letterSpacing:"-.02em"}}>{rp(g.total)}</div>
      <div style={{fontSize:13,color:C.t2,margin:"4px 0 14px"}}>Minta pembeli scan dengan aplikasi apa saja</div>
      <div style={{display:"inline-block",padding:12,background:"#fff",borderRadius:16,border:`1px solid ${C.bo1}`}}>
        {img?<img src={img} alt={"QRIS "+rp(g.total)} width={260} height={260} style={{display:"block",maxWidth:"100%",height:"auto"}}/>
            :<div style={{width:260,height:260,display:"grid",placeItems:"center",color:C.r,fontSize:13,padding:12}}>{err||"Membuat QR…"}</div>}
      </div>
      <p style={{fontSize:12.5,color:C.t2,lineHeight:1.5,marginTop:14}}>Tekan <b style={{color:C.t0}}>Sudah dibayar</b> hanya setelah notifikasi pembayaran masuk di aplikasi toko.</p>
    </div>
  </Modal>;
}

// ─────────────────────────────────────────────────────────────
//  STOCK CHECK
// ─────────────────────────────────────────────────────────────
function StockCheckModal({prods,biz,onClose}) {
  const [q,setQ]=useState("");
  const list=prods.filter(p=>!q||p.name.toLowerCase().includes(q.toLowerCase())||p.barcode.includes(q));
  return <div style={{position:"fixed",inset:0,background:"rgba(12,16,46,.55)",zIndex:550,
    display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:F.sans}} onClick={onClose}>
    <div style={{width:"100%",maxWidth:480,background:C.bg2,borderRadius:"22px 22px 0 0",
      border:`1px solid ${C.bo1}`,borderBottom:"none",animation:"slideUp .3s ease",
      maxHeight:"85vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
      <div style={{width:36,height:4,background:C.b1,borderRadius:2,margin:"14px auto 0"}}/>
      <div style={{padding:"10px 16px 12px",borderBottom:`1px solid ${C.bo0}`,flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:14,fontWeight:800}}><Ico e="📦"/> Cek Stok Barang</div>
          <BizChip biz={biz}/>
        </div>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:C.t2,fontSize:14,pointerEvents:"none"}}><Ico e="🔍"/></span>
          <input value={q} onChange={e=>setQ(e.target.value)} autoFocus placeholder="Cari nama atau barcode..."
            style={{width:"100%",padding:"10px 12px 10px 36px",background:C.bg3,border:`1.5px solid ${C.bo1}`,borderRadius:10,color:C.t0,fontSize:13}}/>
        </div>
      </div>
      <div style={{overflowY:"auto",flex:1}}>
        {list.length===0?<div style={{padding:"32px",textAlign:"center",color:C.t3,fontSize:13}}>Produk tidak ditemukan</div>
        :list.map((p,i)=>(
          <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderTop:i>0?`1px solid ${C.bo0}`:undefined}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
              <div className="mn" style={{fontSize:10,color:C.t2,marginTop:1}}>{p.barcode} · {p.category}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div className="mn" style={{fontSize:16,fontWeight:800,color:p.stock===0?C.r:p.stock<10?C.a:C.g}}>{p.stock}</div>
              <div style={{fontSize:9.5,color:C.t2}}>{p.stock===0?"HABIS":p.stock<10?"MENIPIS":"tersedia"}</div>
            </div>
          </div>))}
      </div>
      <div style={{padding:"12px 16px",borderTop:`1px solid ${C.bo0}`,flexShrink:0,display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12}}>
        <span style={{color:C.t2}}>{list.length} produk · {list.reduce((s,p)=>s+p.stock,0)} total stok</span>
        <button onClick={onClose} style={{padding:"7px 16px",background:C.bg3,border:`1px solid ${C.bo1}`,borderRadius:8,color:C.t1,fontSize:12,fontWeight:600,fontFamily:"inherit"}}>Tutup</button>
      </div>
    </div>
  </div>;
}




// ─────────────────────────────────────────────────────────────
//  CUSTOM CHARTS (no external deps, no event handlers)
// ─────────────────────────────────────────────────────────────

// Simple bar chart using plain divs
function SimpleBarChart({data, keys, colors, height=180, labelKey="date"}) {
  if(!data||!data.length) return <div style={{height,display:"flex",alignItems:"center",justifyContent:"center",color:DARK_C.t3,fontSize:12}}>Belum ada data</div>;
  const maxVal = Math.max(...data.map(d => Math.max(...keys.map(k=>d[k]||0))), 1);
  const fmt = v => v>=1000000?"Rp"+Math.floor(v/1000000)+"jt":v>=1000?"Rp"+Math.floor(v/1000)+"k":"Rp"+v;
  return (
    <div style={{width:"100%",userSelect:"none"}}>
      {/* Y-axis labels */}
      <div style={{display:"flex",gap:4,marginBottom:8,justifyContent:"flex-end"}}>
        {keys.map((k,i)=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:DARK_C.t2}}>
            <div style={{width:10,height:10,borderRadius:2,background:colors[i],flexShrink:0}}/>
            <span>{k==="rev"?"Pendapatan":"Laba"}</span>
          </div>
        ))}
      </div>
      {/* Bars */}
      <div style={{display:"flex",alignItems:"flex-end",gap:3,height,overflowX:"auto",paddingBottom:20,position:"relative"}}>
        {/* Gridlines */}
        <div style={{position:"absolute",inset:"0 0 20px 0",display:"flex",flexDirection:"column",justifyContent:"space-between",pointerEvents:"none"}}>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{borderBottom:`1px dashed rgba(255,255,255,0.06)`,width:"100%"}}/>
          ))}
        </div>
        {data.map((d,di)=>(
          <div key={di} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1,minWidth:28,flex:"0 0 auto"}}>
            <div style={{display:"flex",alignItems:"flex-end",gap:1,height:height-20}}>
              {keys.map((k,ki)=>{
                const pct=(d[k]||0)/maxVal*100;
                return <div key={k} style={{
                  width:10,
                  height:`${Math.max(pct,1)}%`,
                  background:colors[ki],
                  borderRadius:"2px 2px 0 0",
                  opacity:0.85,
                  flexShrink:0,
                  transition:"height .3s",
                  cursor:"default",
                }} title={`${d[labelKey]}: ${fmt(d[k]||0)}`}/>;
              })}
            </div>
            <div style={{fontSize:8,color:DARK_C.t3,whiteSpace:"nowrap",transform:"rotate(-30deg)",transformOrigin:"top center",marginTop:4}}>{d[labelKey]}</div>
          </div>
        ))}
      </div>
      {/* Max label */}
      <div style={{textAlign:"right",fontSize:9,color:DARK_C.t3,marginTop:2}}>Max: {fmt(maxVal)}</div>
    </div>
  );
}

// Simple donut / pie chart using SVG
function SimplePieChart({data}) {
  if(!data||!data.length) return null;
  const total = data.reduce((s,d)=>s+d.value,0);
  if(total===0) return null;
  const cx=80,cy=80,r=55,ri=32;
  let angle=-Math.PI/2;
  const slices=data.map(d=>{
    const sweep=(d.value/total)*2*Math.PI;
    const start=angle; angle+=sweep;
    const x1=cx+r*Math.cos(start),y1=cy+r*Math.sin(start);
    const x2=cx+r*Math.cos(angle),y2=cy+r*Math.sin(angle);
    const xi1=cx+ri*Math.cos(angle),yi1=cy+ri*Math.sin(angle);
    const xi2=cx+ri*Math.cos(start),yi2=cy+ri*Math.sin(start);
    const large=sweep>Math.PI?1:0;
    return {d:`M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} L${xi1},${yi1} A${ri},${ri} 0 ${large},0 ${xi2},${yi2} Z`,
      color:d.color, name:d.name, value:d.value, pct:((d.value/total)*100).toFixed(1)};
  });
  const rpFmt = n=>"Rp "+Number(n).toLocaleString("id-ID");
  return (
    <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap",justifyContent:"center"}}>
      <svg width={160} height={160} viewBox="0 0 160 160">
        {slices.map((s,i)=><path key={i} d={s.d} fill={s.color} opacity={0.85}/>)}
        <circle cx={cx} cy={cy} r={ri-2} fill={DARK_C.bg2}/>
        <text x={cx} y={cy-4} textAnchor="middle" fontSize={9} fill={DARK_C.t2}>Total</text>
        <text x={cx} y={cy+8} textAnchor="middle" fontSize={8} fill={DARK_C.t1}>{rpFmt(total)}</text>
      </svg>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {slices.map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:12,height:12,borderRadius:3,background:s.color,flexShrink:0}}/>
            <div>
              <div style={{fontSize:12,fontWeight:600}}>{s.name}</div>
              <div style={{fontSize:10,color:DARK_C.t2}}>{rpFmt(s.value)} · {s.pct}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
//  LOW STOCK POPUP
// ─────────────────────────────────────────────────────────────
function LowStockPopup({prods,onClose}) {
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(6);
  const [search, setSearch] = React.useState("");
  const [filterBiz, setFilterBiz] = React.useState("ALL");
  const [filterStatus, setFilterStatus] = React.useState("ALL"); // ALL, HABIS, MENIPIS

  const allLow = prods.filter(p=>p.stock<10);
  const totalHabis = allLow.filter(p=>p.stock===0).length;
  const totalMenipis = allLow.length - totalHabis;

  const filtered = allLow
    .filter(p => filterBiz==="ALL" || p.business===filterBiz)
    .filter(p => filterStatus==="ALL" ? true : filterStatus==="HABIS" ? p.stock===0 : p.stock>0)
    .filter(p => !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode||"").toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>a.stock-b.stock);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const curPage = Math.min(Math.max(1, page), totalPages);
  const paginated = filtered.slice((curPage - 1) * perPage, curPage * perPage);

  // Generate nomor halaman dengan ellipsis cerdas (misal 1 ... 4 5 6 ... 10)
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (curPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (curPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", curPage - 1, curPage, curPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return <Modal open size="md" onClose={onClose} icon={<AlertTriangle size={20}/>} title="Stok menipis"
    subtitle={`${allLow.length} produk butuh restock (${totalHabis} habis, ${totalMenipis} menipis)`}
    footer={
      <div style={{display:"flex",flexDirection:"column",gap:10,width:"100%"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12.5,color:C.t2}}>
            <span>Tampilkan</span>
            <select value={perPage} onChange={e=>{setPerPage(Number(e.target.value));setPage(1);}}
              style={{padding:"4px 8px",borderRadius:8,background:C.bg3,border:`1.5px solid ${C.bo1}`,color:C.t0,fontSize:12.5,fontWeight:700,fontFamily:F.sans}}>
              {[5, 6, 10, 20].map(n=><option key={n} value={n}>{n} baris</option>)}
            </select>
            {filtered.length>0&&<span className="mn" style={{marginLeft:2}}>({(curPage-1)*perPage+1}–{Math.min(curPage*perPage, filtered.length)} dari {filtered.length})</span>}
          </div>
          <Btn outline onClick={onClose}>Tutup</Btn>
        </div>
        {totalPages > 1 && (
          <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:5,paddingTop:4,borderTop:`1px solid ${C.bo0}`,flexWrap:"wrap"}}>
            <button className="press" disabled={curPage <= 1} onClick={()=>setPage(p=>Math.max(1, p-1))}
              style={{minHeight:32,padding:"0 9px",borderRadius:8,border:`1px solid ${C.bo1}`,background:curPage<=1?C.bg3:"transparent",color:curPage<=1?C.t3:C.t0,fontSize:12,fontWeight:700,display:"inline-flex",alignItems:"center",gap:3}}>
              <ChevronLeft size={14}/> Prev
            </button>
            {getPageNumbers().map((num, idx) => (
              num === "..." ? (
                <span key={`dots-${idx}`} style={{padding:"0 4px",color:C.t3,fontSize:12}}>…</span>
              ) : (
                <button key={num} onClick={()=>setPage(num)} className="press"
                  style={{minWidth:32,height:32,borderRadius:8,border:`1.5px solid ${curPage===num?C.pri:C.bo1}`,
                    background:curPage===num?C.pri:"transparent",color:curPage===num?C.on:C.t0,
                    fontSize:12.5,fontWeight:700,display:"grid",placeItems:"center"}}>
                  {num}
                </button>
              )
            ))}
            <button className="press" disabled={curPage >= totalPages} onClick={()=>setPage(p=>Math.min(totalPages, p+1))}
              style={{minHeight:32,padding:"0 9px",borderRadius:8,border:`1px solid ${C.bo1}`,background:curPage>=totalPages?C.bg3:"transparent",color:curPage>=totalPages?C.t3:C.t0,fontSize:12,fontWeight:700,display:"inline-flex",alignItems:"center",gap:3}}>
              Next <ChevronRight size={14}/>
            </button>
          </div>
        )}
      </div>
    }>
    {allLow.length===0
      ? <EmptyState icon={<Check size={24} strokeWidth={2}/>} title="Semua stok aman" hint="Tidak ada produk dengan stok di bawah 10."/>
      : <>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:12}}>
          <Inp placeholder="Cari nama atau barcode…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
            icon={<Search size={16}/>} style={{minHeight:40,fontSize:13.5,padding:"8px 12px 8px 38px"}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {[
                ["ALL", `Semua (${allLow.length})`, C.pri],
                ["HABIS", `Habis (${totalHabis})`, C.r],
                ["MENIPIS", `Menipis (${totalMenipis})`, C.a],
              ].map(([key, label, col]) => (
                <button key={key} onClick={()=>{setFilterStatus(key);setPage(1);}} className="press"
                  style={{padding:"4px 10px",borderRadius:20,border:`1px solid ${filterStatus===key?col:C.bo1}`,
                    background:filterStatus===key?`${col}1F`:"transparent",color:filterStatus===key?col:C.t2,
                    fontSize:12,fontWeight:700}}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{display:"flex",gap:4}}>
              {["ALL", "JS_CLOTHING", "JB_STORE"].map(b => (
                <button key={b} onClick={()=>{setFilterBiz(b);setPage(1);}} className="press"
                  style={{padding:"3px 8px",borderRadius:6,border:`1px solid ${filterBiz===b?C.pri:C.bo0}`,
                    background:filterBiz===b?C.pri1:"transparent",color:filterBiz===b?C.pri:C.t3,
                    fontSize:11,fontWeight:700}}>
                  {b==="ALL"?"Semua Toko":BIZ[b]?.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        {filtered.length===0 ? (
          <div style={{padding:"24px 12px",textAlign:"center",color:C.t2,fontSize:13}}>
            Tidak ada produk yang cocok dengan pencarian / filter.
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column"}}>
            {paginated.map((p,i)=><div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderTop:i>0?`1px solid ${C.bo0}`:undefined}}>
              <span style={{width:38,height:38,borderRadius:11,flexShrink:0,display:"grid",placeItems:"center",background:p.stock===0?C.r1:C.a1,color:p.stock===0?C.r:C.a}}>
                {p.stock===0?<Ban size={18}/>:<Package size={18}/>}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                <div style={{display:"flex",gap:8,marginTop:2,flexWrap:"wrap",alignItems:"center"}}>
                  <span className="mn" style={{fontSize:11.5,color:C.t2}}>{p.barcode}</span>
                  <BizChip biz={p.business} sm/>
                  <span className="mn" style={{fontSize:11.5,color:C.g,fontWeight:600}}>{rp(p.price)}</span>
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div className="mn" style={{fontSize:20,fontWeight:800,color:p.stock===0?C.r:C.a,lineHeight:1}}>{p.stock}</div>
                <div style={{fontSize:11,color:C.t2,marginTop:2}}>{p.stock===0?"habis":"tersisa"}</div>
              </div>
            </div>)}
          </div>
        )}
      </>}
  </Modal>;
}


// ─────────────────────────────────────────────────────────────
//  ADDON PROMPT MODAL
// ─────────────────────────────────────────────────────────────
function AddonPrompt({prompt, onAdd, onSkip}) {
  const {mainItem, addons} = prompt;
  const [selected, setSelected] = React.useState(() => new Set());
  const toggle = (id) => setSelected(prev => {const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;});
  const chosen = addons.filter(a => selected.has(a.id));
  return <Modal open size="sm" zIndex={750} onClose={onSkip} icon={<Plus size={20}/>} title="Tambah add-on?" subtitle={`${mainItem.name} punya item tambahan`}
    footer={<><Btn outline onClick={onSkip}>Lewati</Btn>
      <Btn size="lg" onClick={()=>onAdd(chosen)}>{chosen.length>0?`Tambah ${chosen.length} add-on`:"Lanjut tanpa add-on"}</Btn></>}>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {addons.map(a => {
        const sel = selected.has(a.id);
        return <button key={a.id} onClick={()=>toggle(a.id)} className="press" role="checkbox" aria-checked={sel}
          style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",minHeight:60,borderRadius:14,textAlign:"left",
            background:sel?C.pri1:C.bg3,border:`2px solid ${sel?C.pri:C.bo0}`,color:C.t0}}>
          <span style={{width:24,height:24,borderRadius:7,flexShrink:0,display:"grid",placeItems:"center",background:sel?C.pri:"transparent",border:`2px solid ${sel?C.pri:C.bo2}`,color:C.on}}>
            {sel&&<Check size={15} strokeWidth={3}/>}</span>
          <span style={{flex:1,minWidth:0}}>
            <span style={{display:"block",fontWeight:600,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</span>
            <span className="mn" style={{display:"block",fontSize:12,color:C.t2,marginTop:1}}>{a.barcode} · stok {a.stock}</span>
          </span>
          <span className="mn" style={{fontSize:15,fontWeight:700,color:sel?C.pri:C.t1,flexShrink:0}}>{rp(a.price)}</span>
        </button>;
      })}
    </div>
    {chosen.length>0&&<div style={{marginTop:12,padding:"10px 14px",background:C.g2,borderRadius:12,fontSize:13,color:C.g,fontWeight:600,display:"flex",justifyContent:"space-between"}}>
      <span>{chosen.length} add-on dipilih</span><span className="mn">+{rp(chosen.reduce((t,a)=>t+a.price,0))}</span></div>}
  </Modal>;
}


// ─────────────────────────────────────────────────────────────
//  EXPIRE POPUP
// ─────────────────────────────────────────────────────────────
function ExpirePopup({nearExpiry, expiredProds, onClose}) {
  const all=[...expiredProds,...nearExpiry];
  const daysDiff=(dateStr)=>Math.ceil((new Date(dateStr)-new Date())/(1000*60*60*24));
  return <Modal open size="md" onClose={onClose} icon={<Clock size={20}/>} title="Peringatan expire"
    subtitle={all.length?`${expiredProds.length>0?expiredProds.length+" sudah kadaluarsa · ":""}${nearExpiry.length} mendekati expire (≤6 bulan)`:undefined}
    footer={<Btn outline onClick={onClose}>Tutup</Btn>}>
    {all.length===0
      ? <EmptyState icon={<Check size={24} strokeWidth={2}/>} title="Semua produk aman" hint="Tidak ada produk kadaluarsa atau mendekati expire."/>
      : all.map((p,i)=>{
          const days=daysDiff(p.expireDate),expired=days<0,urgent=days>=0&&days<=30,warn=days>30&&days<=90;
          const color=expired||urgent?C.r:warn?C.a:C.g,bg=expired||urgent?C.r1:warn?C.a1:C.g1;
          return <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderTop:i>0?`1px solid ${C.bo0}`:undefined}}>
            <span style={{width:38,height:38,borderRadius:11,flexShrink:0,display:"grid",placeItems:"center",background:bg,color}}>{expired?<Ban size={18}/>:<Clock size={18}/>}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
              <div style={{display:"flex",gap:8,marginTop:3,flexWrap:"wrap",alignItems:"center"}}>
                <span className="mn" style={{fontSize:12,color:C.t2}}>{p.barcode}</span><BizChip biz={p.business} sm/>
                <span style={{fontSize:12,color:C.t2}}>Stok {p.stock}</span>
              </div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div className="mn" style={{fontSize:13.5,fontWeight:800,color}}>{expired?`${Math.abs(days)} hari lalu`:days===0?"Hari ini":`${days} hari`}</div>
              <div className="mn" style={{fontSize:12,color:C.t2,marginTop:2}}>{new Date(p.expireDate).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}</div>
            </div>
          </div>;})}
  </Modal>;
}

// ─────────────────────────────────────────────────────────────
//  CHART BOUNDARY
// ─────────────────────────────────────────────────────────────
class ChartBoundary extends Component {
  constructor(p){super(p);this.state={err:false};}
  static getDerivedStateFromError(){return{err:true};}
  render(){
    if(this.state.err) return <div style={{padding:"20px",textAlign:"center",color:DARK_C.t3,fontSize:12}}>Chart tidak tersedia</div>;
    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────
//  ERROR BOUNDARY
// ─────────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props){super(props);this.state={hasError:false,error:null};}
  static getDerivedStateFromError(err){return{hasError:true,error:err};}
  componentDidCatch(err,info){console.error("App crash:",err,info);}
  render(){
    if(this.state.hasError){
      return <div style={{fontFamily:"system-ui",background:"#020817",color:"#e8f4ff",
        height:"100vh",display:"flex",flexDirection:"column",alignItems:"center",
        justifyContent:"center",gap:16,padding:24,textAlign:"center"}}>
        <div style={{fontSize:40}}><Ico e="⚠️" size={40}/></div>
        <h2 style={{fontSize:18,fontWeight:700}}>Terjadi Error</h2>
        <p style={{fontSize:13,color:"#4a6480",maxWidth:400,lineHeight:1.6}}>
          {String(this.state.error?.message||this.state.error)}
        </p>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
          <button onClick={()=>window.location.reload()}
            style={{padding:"10px 20px",background:"#00e5a0",border:"none",borderRadius:9,
              color:"#020817",fontWeight:700,fontSize:13,cursor:"pointer"}}>
            <Ico e="🔄"/> Reload
          </button>
          <button onClick={()=>{localStorage.clear();window.location.reload();}}
            style={{padding:"10px 20px",background:"transparent",border:"1px solid #4a6480",
              borderRadius:9,color:"#8aaac8",fontSize:13,cursor:"pointer"}}>
            Reset & Reload
          </button>
        </div>
        <p style={{fontSize:11,color:"#253347",marginTop:8}}>
          Buka DevTools (F12) → Console untuk detail error
        </p>
      </div>;
    }
    return this.props.children;
  }
}


// ─────────────────────────────────────────────────────────────
//  KASIR STOK PANEL — Quick view+adjust for kasir
// ─────────────────────────────────────────────────────────────
function KasirStokPanel({prods, biz, onClose, onAdjust, onAddToCart}) {
  const [search, setSearch] = React.useState("");
  const list = prods.filter(p=>!search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode.includes(search));
  const bc = !biz ? C.pri : biz==="JS_CLOTHING" ? C.b : C.p;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(12,16,46,.55)",zIndex:600,
      display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:F.sans}}
      onClick={onClose}>
      <div style={{width:"100%",maxWidth:520,background:C.bg2,borderRadius:"22px 22px 0 0",
        border:`1px solid ${bc}44`,borderBottom:"none",animation:"slideUp .25s ease",
        maxHeight:"88vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:36,height:4,background:C.bo1,borderRadius:2,margin:"14px auto 0"}}/>
        <div style={{padding:"10px 16px 12px",borderBottom:`1px solid ${C.bo0}`,flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div>
              <div style={{fontSize:14,fontWeight:800}}><Ico e="📦"/> Stok Produk</div>
              <div style={{fontSize:11,color:C.t2,marginTop:1}}>{list.length} produk · tap + untuk tambah ke keranjang</div>
            </div>
            <button onClick={onClose} style={{background:"transparent",border:"none",color:C.t2,fontSize:22,cursor:"pointer",lineHeight:1}}>×</button>
          </div>
          <input autoFocus value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Cari produk..."
            style={{width:"100%",padding:"10px 13px",background:C.bg3,border:`1.5px solid ${bc}44`,
              borderRadius:10,color:C.t0,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}/>
        </div>
        <div style={{overflowY:"auto",flex:1}}>
          {list.length===0 && <div style={{padding:"32px",textAlign:"center",color:C.t3,fontSize:13}}>Tidak ditemukan</div>}
          {list.map((p,i)=>(
            <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 16px",
              borderTop:i>0?`1px solid ${C.bo0}`:undefined,
              background:p.stock===0?`${C.r}05`:undefined}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                <div style={{display:"flex",gap:6,marginTop:2,alignItems:"center",flexWrap:"wrap"}}>
                  <span className="mn" style={{fontSize:10,color:C.t2}}>{p.barcode}</span>
                  <span className="mn" style={{fontSize:11,color:C.g}}>{rp(p.price)}</span>
                </div>
              </div>
              {/* Stock + adjust */}
              <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                <button onClick={()=>onAdjust(p,-1)} disabled={p.stock===0}
                  className="press"
                  style={{width:30,height:30,borderRadius:8,background:p.stock===0?C.bg4:C.r1,
                    border:`1.5px solid ${p.stock===0?C.bo0:C.r+"44"}`,
                    color:p.stock===0?C.t3:C.r,fontSize:17,fontWeight:700,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    cursor:p.stock===0?"not-allowed":"pointer"}}>−</button>
                <div style={{textAlign:"center",minWidth:32}}>
                  <div className="mn" style={{fontSize:18,fontWeight:800,lineHeight:1,
                    color:p.stock===0?C.r:p.stock<10?C.a:C.t0}}>{p.stock}</div>
                  <div style={{fontSize:9,color:C.t3,marginTop:1}}>stok</div>
                </div>
                <button onClick={()=>onAdjust(p,1)}
                  className="press"
                  style={{width:30,height:30,borderRadius:8,background:C.g1,
                    border:`1.5px solid ${C.g}44`,color:C.g,fontSize:17,fontWeight:700,
                    display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
              </div>
              {/* Add to cart */}
              <button onClick={()=>onAddToCart(p)} disabled={p.stock===0}
                className="press"
                style={{padding:"7px 12px",borderRadius:9,fontWeight:700,fontSize:12,
                  background:p.stock===0?C.bg4:`linear-gradient(90deg,${bc},${bc}cc)`,
                  border:"none",color:p.stock===0?C.t3:C.on,
                  cursor:p.stock===0?"not-allowed":"pointer",flexShrink:0}}>
                <Ico e="🛒"/>
              </button>
            </div>
          ))}
        </div>
        <div style={{padding:"10px 16px",borderTop:`1px solid ${C.bo0}`,flexShrink:0,
          display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12}}>
          <span style={{color:C.t2}}>{prods.filter(p=>p.stock===0).length} habis · {prods.filter(p=>p.stock>0&&p.stock<10).length} menipis</span>
          <button onClick={onClose} style={{padding:"7px 16px",background:C.bg3,border:`1px solid ${C.bo1}`,
            borderRadius:8,color:C.t1,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Tutup</button>
        </div>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────
//  OPNAME (lintas bisnis) — satu sesi mencakup semua bisnis yang boleh diakses pengguna.
//  Bisnis tiap produk ditambahkan otomatis (kolom/label), tidak perlu dipilih lagi.
// ─────────────────────────────────────────────────────────────
function TemplateOpnameTab({ items, scopeProds, physInput, setPhysInput, notesInput, setNotesInput, searchQ, setSearchQ, toast, fbUpdateOpnameItem, selectedOpname, onExport, onImport, locked }) {
  const [bf, setBf] = useState("ALL");
  const bizIds = [...new Set(scopeProds.map(p => p.business))];
  const q = (searchQ || "").toLowerCase();
  const list = scopeProds.filter(p => (bf === "ALL" || p.business === bf) && (!q || p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q)));
  const itemOf = p => items.find(x => x.productId === p.id);
  const physOf = p => {
    const v = physInput[p.id];
    if (v !== undefined && v !== "") return Number(v);
    const it = itemOf(p);
    return it && it.stockPhysical !== undefined && it.stockPhysical !== "" ? Number(it.stockPhysical) : undefined;
  };
  const filled = scopeProds.filter(p => physOf(p) !== undefined).length;
  const commit = (p) => {
    if (locked) return;
    const phys = physOf(p);
    if (phys === undefined || Number.isNaN(phys)) return;
    const diff = phys - p.stock;
    fbUpdateOpnameItem(selectedOpname, p.id, {
      productId: p.id, barcode: p.barcode, name: p.name, category: p.category,
      business: p.business, stockSystem: p.stock, stockPhysical: phys,
      difference: diff, status: diff === 0 ? "OK" : diff > 0 ? "Surplus" : "Kurang",
      notes: notesInput[p.id] ?? itemOf(p)?.notes ?? "",
    }).catch(e => toast("Gagal menyimpan: " + e.message, "err"));
  };
  const statusOf = (p) => { const ph = physOf(p); if (ph === undefined) return ""; const d = ph - p.stock; return d === 0 ? "OK" : d > 0 ? "Surplus" : "Kurang"; };
  const pill = (st) => st && <span style={{padding:"2px 9px",borderRadius:20,fontSize:11.5,fontWeight:700,color:st==="OK"?C.g:st==="Kurang"?C.r:C.a,background:st==="OK"?C.g1:st==="Kurang"?C.r1:C.a1}}>{st}</span>;
  const numInput = (p) => <input type="number" inputMode="numeric" disabled={locked} value={physInput[p.id] ?? (itemOf(p)?.stockPhysical ?? "")}
    onChange={e => setPhysInput(prev => ({ ...prev, [p.id]: e.target.value }))} onBlur={() => commit(p)}
    aria-label={"Stok fisik " + p.name}
    style={{width:84,minHeight:42,padding:"6px 8px",background:locked?C.bg4:C.bg3,border:`1.5px solid ${C.bo1}`,borderRadius:10,color:C.t0,fontSize:15,fontWeight:700,textAlign:"center",fontFamily:F.sans}}/>;
  const noteInput = (p, w) => <input value={notesInput[p.id] ?? (itemOf(p)?.notes ?? "")} disabled={locked}
    onChange={e => setNotesInput(prev => ({ ...prev, [p.id]: e.target.value }))} onBlur={() => commit(p)} placeholder="Catatan"
    style={{width:w,minHeight:38,padding:"6px 10px",background:locked?C.bg4:C.bg3,border:`1px solid ${C.bo1}`,borderRadius:10,color:C.t0,fontSize:13,fontFamily:F.sans}}/>;
  return <div>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12,flexWrap:"wrap"}}>
      <div style={{flex:"1 1 220px",minWidth:200}}>
        <ProgressBar value={filled} max={scopeProds.length} color={C.g} label={`${filled} dari ${scopeProds.length} produk terisi`}/>
      </div>
      <div style={{display:"flex",gap:8}}>
        <Btn size="sm" outline onClick={onExport}>Export Excel</Btn>
        {!locked && <Btn size="sm" outline onClick={onImport}><Upload size={15}/>Import</Btn>}
      </div>
    </div>
    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
      <div style={{flex:"1 1 220px"}}><Inp value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Cari barcode atau nama" icon={<Search size={16}/>} style={{minHeight:42}}/></div>
      {bizIds.length > 1 && <div style={{display:"flex",gap:6}}>
        {["ALL", ...bizIds].map(b => <button key={b} onClick={() => setBf(b)} className={`chip${bf === b ? " on" : ""}`}>{b === "ALL" ? "Semua bisnis" : BIZ[b]?.name}</button>)}
      </div>}
    </div>
    {locked && <div style={{padding:"10px 14px",background:C.a1,borderRadius:12,fontSize:13,color:C.a,fontWeight:600,marginBottom:12}}>Sesi sudah ditutup, data tidak bisa diubah.</div>}
    {list.length === 0 && <Card><EmptyState title="Produk tidak ditemukan" hint="Coba ubah kata kunci atau filter bisnis."/></Card>}
    {/* Mobile: kartu */}
    <div className="hide-desktop" style={{display:"flex",flexDirection:"column",gap:8}}>
      {list.map(p => { const ph = physOf(p), diff = ph === undefined ? null : ph - p.stock, st = statusOf(p);
        return <div key={p.id} style={{background:C.bg2,border:`1px solid ${st==="Kurang"?C.r+"55":st==="Surplus"?C.a+"55":C.bo0}`,borderRadius:14,padding:"12px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:8}}>
            <div style={{minWidth:0}}>
              <div style={{fontWeight:700,fontSize:14}}>{p.name}</div>
              <div style={{display:"flex",gap:6,alignItems:"center",marginTop:3,flexWrap:"wrap"}}><span className="mn" style={{fontSize:12,color:C.t2}}>{p.barcode}</span><BizChip biz={p.business} sm/></div>
            </div>
            {pill(st)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:10,alignItems:"center"}}>
            <div><div style={{fontSize:12,color:C.t2}}>Sistem</div><div className="mn" style={{fontSize:20,fontWeight:800}}>{p.stock}</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:12,color:C.t2,marginBottom:2}}>Fisik</div>{numInput(p)}</div>
            <div style={{textAlign:"right"}}><div style={{fontSize:12,color:C.t2}}>Selisih</div><div className="mn" style={{fontSize:20,fontWeight:800,color:diff===null?C.t3:diff<0?C.r:diff>0?C.a:C.g}}>{diff===null?"–":(diff>0?"+":"")+diff}</div></div>
          </div>
          <div style={{marginTop:8}}>{noteInput(p, "100%")}</div>
        </div>; })}
    </div>
    {/* Desktop: tabel */}
    <div className="hide-mobile">
      <Card noPad style={{overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:820}}>
            <THead cols={["No","Bisnis","Barcode","Nama","Sistem","Fisik","Selisih","Status","Keterangan"]}/>
            <tbody>{list.map((p, i) => { const ph = physOf(p), diff = ph === undefined ? null : ph - p.stock, st = statusOf(p);
              return <tr key={p.id} className="hrow" style={{borderTop:`1px solid ${C.bo0}`,background:st==="Kurang"?C.r1:st==="Surplus"?C.a1:"transparent"}}>
                <td style={{padding:"10px 14px",color:C.t2}}>{i + 1}</td>
                <td style={{padding:"10px 14px"}}><BizChip biz={p.business} sm/></td>
                <td className="mn" style={{padding:"10px 14px",color:C.t2}}>{p.barcode}</td>
                <td style={{padding:"10px 14px",fontWeight:600}}>{p.name}</td>
                <td className="mn" style={{padding:"10px 14px"}}>{p.stock}</td>
                <td style={{padding:"6px 14px"}}>{numInput(p)}</td>
                <td className="mn" style={{padding:"10px 14px",fontWeight:800,color:diff===null?C.t3:diff<0?C.r:diff>0?C.a:C.g}}>{diff===null?"–":(diff>0?"+":"")+diff}</td>
                <td style={{padding:"10px 14px"}}>{pill(st)}</td>
                <td style={{padding:"6px 14px"}}>{noteInput(p, 150)}</td>
              </tr>; })}</tbody>
          </table>
        </div>
      </Card>
    </div>
  </div>;
}

function RingkasanTab({ items, selectedOpname, session, user, toast, fbCloseOpname, fbApplyOpnameAdjustments, canFinalize }) {
  const total = items.length;
  const ok = items.filter(i => i.status === "OK");
  const kurang = items.filter(i => i.status === "Kurang");
  const surplus = items.filter(i => i.status === "Surplus");
  const kurangUnit = kurang.reduce((s, i) => s + Math.abs(i.difference), 0);
  const surplusUnit = surplus.reduce((s, i) => s + i.difference, 0);
  const isClosed = session?.status === "closed" || session?.status === "applied";
  const bizIds = [...new Set(items.map(i => i.business).filter(Boolean))];
  const handleClose = async () => {
    if (!confirm("Tutup sesi opname? Tidak bisa edit lagi setelah ditutup.")) return;
    await fbCloseOpname(selectedOpname, { totalItems: total, totalOk: ok.length, totalKurang: kurang.length, totalSurplus: surplus.length, totalKurangUnit: kurangUnit, totalSurplusUnit: surplusUnit });
    toast("Sesi opname ditutup");
  };
  const handleApply = async () => {
    if (!confirm("Terapkan penyesuaian? Stok produk akan diubah sesuai stok fisik.")) return;
    await fbApplyOpnameAdjustments(selectedOpname, user.name);
    toast("✅ Stok diperbarui berdasarkan opname");
  };
  if (total === 0) return <Card><EmptyState title="Belum ada data" hint="Isi kolom stok fisik di tab Template Opname, hasilnya muncul di sini."/></Card>;
  return <div style={{display:"flex",flexDirection:"column",gap:14}}>
    <div className="stat-grid-3" style={{display:"grid",gap:10,gridTemplateColumns:"repeat(3,1fr)"}}>
      <Stat icon="✅" label="Sesuai" value={ok.length} color={C.g}/>
      <Stat icon="🔴" label="Kurang" value={kurang.length} color={C.r} sub={`−${kurangUnit} unit`}/>
      <Stat icon="🟡" label="Lebih" value={surplus.length} color={C.a} sub={`+${surplusUnit} unit`}/>
    </div>
    {bizIds.length > 1 && <Card noPad style={{overflow:"hidden"}}>
      <div style={{padding:"12px 16px",fontSize:13,fontWeight:800,borderBottom:`1px solid ${C.bo0}`}}>Per bisnis</div>
      {bizIds.map((b, i) => { const it = items.filter(x => x.business === b);
        return <div key={b} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderTop:i>0?`1px solid ${C.bo0}`:undefined,flexWrap:"wrap"}}>
          <div style={{minWidth:110}}><BizChip biz={b}/></div>
          <span className="mn" style={{fontSize:13,color:C.t2}}>{it.length} produk</span>
          <span style={{flex:1}}/>
          <span style={{fontSize:13,color:C.g,fontWeight:700}}>{it.filter(x=>x.status==="OK").length} sesuai</span>
          <span style={{fontSize:13,color:C.r,fontWeight:700}}>{it.filter(x=>x.status==="Kurang").length} kurang</span>
          <span style={{fontSize:13,color:C.a,fontWeight:700}}>{it.filter(x=>x.status==="Surplus").length} lebih</span>
        </div>; })}
    </Card>}
    {session?.status === "applied" && <div style={{padding:"12px 16px",background:C.g1,borderRadius:12,fontSize:13.5,color:C.g,fontWeight:700}}>Penyesuaian stok sudah diterapkan.</div>}
    {!isClosed && (canFinalize
      ? <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <Btn outline onClick={handleClose}><Lock size={16}/>Tutup sesi</Btn>
          <Btn color={C.g} onClick={handleApply}><Check size={16}/>Terapkan penyesuaian stok</Btn>
        </div>
      : <div style={{padding:"12px 16px",background:C.bg3,borderRadius:12,fontSize:13,color:C.t2,lineHeight:1.5}}>Menutup sesi dan menerapkan penyesuaian stok dilakukan oleh admin atau petugas stok. Kasir cukup mengisi template.</div>)}
  </div>;
}

function KartuStockTab({ slogs, prods, scopeBiz, toast, onExport }) {
  const [ksProduct, setKsProduct] = useState("");
  const [ksBiz, setKsBiz] = useState("ALL");
  const [ksFrom, setKsFrom] = useState("");
  const [ksTo, setKsTo] = useState("");
  const filtered = slogs.filter(l => {
    if (!scopeBiz.includes(l.business)) return false;
    if (ksBiz !== "ALL" && l.business !== ksBiz) return false;
    if (ksProduct && l.barcode !== ksProduct) return false;
    if (ksFrom) { try { if (new Date(l.date) < new Date(ksFrom)) return false; } catch {} }
    if (ksTo) { try { if (new Date(l.date) > new Date(ksTo + "T23:59:59")) return false; } catch {} }
    return true;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));
  const perProduct = {};
  filtered.forEach(l => { const k = l.business + "|" + l.barcode; if (!perProduct[k]) perProduct[k] = { name: l.name, barcode: l.barcode, business: l.business, logs: [] }; perProduct[k].logs.push(l); });
  const productOptions = [...new Set(slogs.filter(l => scopeBiz.includes(l.business)).map(l => l.barcode))];
  const fieldStyle = {padding:"9px 12px",background:C.bg3,border:`1.5px solid ${C.bo1}`,borderRadius:12,color:C.t0,fontSize:13.5,fontFamily:F.sans,minHeight:42};
  return <div>
    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
      {scopeBiz.length > 1 && <select value={ksBiz} onChange={e => setKsBiz(e.target.value)} style={fieldStyle}><option value="ALL">Semua bisnis</option>{scopeBiz.map(b => <option key={b} value={b}>{BIZ[b]?.name}</option>)}</select>}
      <select value={ksProduct} onChange={e => setKsProduct(e.target.value)} style={{...fieldStyle,flex:"1 1 200px"}}>
        <option value="">Semua produk</option>
        {productOptions.map(b => <option key={b} value={b}>{prods.find(x => x.barcode === b)?.name || b}</option>)}
      </select>
      <input type="date" value={ksFrom} onChange={e => setKsFrom(e.target.value)} style={fieldStyle}/>
      <span style={{color:C.t2,fontSize:13}}>s/d</span>
      <input type="date" value={ksTo} onChange={e => setKsTo(e.target.value)} style={fieldStyle}/>
      <Btn size="sm" outline onClick={onExport}>Export Excel</Btn>
    </div>
    {Object.keys(perProduct).length === 0 ? <Card><EmptyState title="Belum ada pergerakan stok" hint="Riwayat masuk dan keluar produk tampil di sini."/></Card> :
    <Card noPad style={{overflow:"hidden"}}><div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",minWidth:720}}>
        <THead cols={["Tanggal","Bisnis","Produk","Masuk","Keluar","Saldo"]}/>
        <tbody>{Object.values(perProduct).map(pp => { let running = 0;
          return pp.logs.map((l, li) => {
            const inQty = l.type === "masuk" ? l.qty : 0, outQty = (l.type === "keluar" || l.type === "opname") ? l.qty : 0;
            running = running + inQty - outQty;
            return <tr key={pp.business + pp.barcode + li} style={{borderTop:`1px solid ${C.bo0}`}}>
              <td style={{padding:"9px 14px",color:C.t2,whiteSpace:"nowrap"}}>{l.date}</td>
              <td style={{padding:"9px 14px"}}>{li === 0 ? <BizChip biz={pp.business} sm/> : ""}</td>
              <td style={{padding:"9px 14px",fontWeight:600}}>{li === 0 ? <>{pp.name}<div className="mn" style={{fontSize:12,color:C.t2,fontWeight:400}}>{pp.barcode}</div></> : ""}</td>
              <td className="mn" style={{padding:"9px 14px",color:C.g}}>{inQty > 0 ? inQty : ""}</td>
              <td className="mn" style={{padding:"9px 14px",color:C.r}}>{outQty > 0 ? outQty : ""}</td>
              <td className="mn" style={{padding:"9px 14px",fontWeight:700}}>{running}</td>
            </tr>;
          }); })}</tbody>
      </table>
    </div></Card>}
  </div>;
}

async function exportOpnameExcel(session, items, scopeProds, slogs, scopeBiz) {
  const XLSX = await loadSheetJS();
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["", "TEMPLATE LAPORAN STOCK OPNAME"], [],
    ["", "CARA PAKAI"],
    ["", "Langkah 1", "Buka sheet 'TEMPLATE OPNAME'"],
    ["", "Langkah 2", "Isi kolom Stok Fisik sesuai kondisi nyata (kolom Bisnis terisi otomatis)"],
    ["", "Langkah 3", "Simpan lalu Import kembali ke aplikasi"], [],
    ["", "KETERANGAN"],
    ["", "Selisih", "Stok Fisik − Stok Sistem"],
    ["", "Status OK / Kurang / Surplus", "Sama / lebih sedikit / lebih banyak dari sistem"],
  ]), "PETUNJUK");
  const ks = [["Tanggal", "Bisnis", "Produk", "Barcode", "Masuk (D)", "Keluar (K)", "Saldo (S)"]];
  const per = {};
  slogs.filter(l => scopeBiz.includes(l.business)).sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(l => { const k = l.business + "|" + l.barcode; (per[k] = per[k] || { name: l.name, barcode: l.barcode, business: l.business, logs: [] }).logs.push(l); });
  Object.values(per).forEach(pp => { let run = 0; pp.logs.forEach(l => { const i = l.type === "masuk" ? l.qty : 0, o = (l.type === "keluar" || l.type === "opname") ? l.qty : 0; run += i - o; ks.push([l.date, BIZ[pp.business]?.name || pp.business, l.name, l.barcode, i || "", o || "", run]); }); });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ks), "KARTU STOCK");
  const head = ["No", "Kode SKU", "Nama Barang", "Bisnis", "Satuan", "Stok Sistem", "Stok Fisik", "Selisih", "Status", "Keterangan"];
  const rows = scopeProds.map((p, i) => { const it = items.find(x => x.productId === p.id);
    return [i + 1, p.barcode, p.name, BIZ[p.business]?.name || p.business, "Buah", p.stock, it?.stockPhysical ?? "", it ? (it.stockPhysical - p.stock) : "", it?.status ?? "", it?.notes ?? ""]; });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([head, ...rows]), "TEMPLATE OPNAME");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["", "RINGKASAN STOCK OPNAME"], [], ["", "ITEM", "Jumlah"],
    ["", "Total SKU diperiksa", items.length],
    ["", "Sesuai", items.filter(i => i.status === "OK").length],
    ["", "Kurang", items.filter(i => i.status === "Kurang").length],
    ["", "Surplus", items.filter(i => i.status === "Surplus").length],
  ]), "RINGKASAN");
  XLSX.writeFile(wb, `opname_${new Date().toLocaleDateString("id-ID").replace(/\//g, "-")}.xlsx`);
}

function ImportOpnameModal({ show, onClose, onImport, C, F, loadSheetJS, prods, biz, BIZ }) {
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
        const product = prods.find(p => p.barcode === sku || (name && (p.name.toLowerCase() === name.toLowerCase() || p.name.toLowerCase().includes(name.toLowerCase()))));
        parsed.push({ row: i, sku, name, phys, notes, product: product || null });
      }
      setRows(parsed);
    } catch (e) { setErr("Gagal parse: " + e.message); }
  };

  if (!show) return null;
  const matched = rows.filter(r => r.product);
  const doImport = async () => {
    const list = matched.map(r => ({
      productId: r.product.id, barcode: r.product.barcode, name: r.product.name, category: r.product.category,
      business: r.product.business, stockSystem: r.product.stock, stockPhysical: Number(r.phys),
      difference: Number(r.phys) - r.product.stock,
      status: Number(r.phys) - r.product.stock === 0 ? "OK" : Number(r.phys) - r.product.stock > 0 ? "Surplus" : "Kurang",
      notes: "",
    }));
    await onImport(list);
  };
  return <Modal open size="lg" dismiss={false} onClose={onClose} icon={<Upload size={20}/>} title="Import opname"
    subtitle="Upload file Excel hasil export. Data stok fisik akan diisi otomatis."
    footer={rows.length > 0 ? <><Btn outline onClick={onClose}>Batal</Btn><Btn onClick={doImport}>Import {matched.length} produk</Btn></> : <Btn outline onClick={onClose}>Tutup</Btn>}>
    <div>
        <label className="press" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"28px 20px",border:`2px dashed ${C.bo1}`,borderRadius:12,background:C.bg3,cursor:"pointer",marginBottom:12}}>
          <span style={{fontSize:26}}><Ico e="📁" size={26}/></span>
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
                        ? <span style={{color:C.g,fontWeight:700}}><Ico e="✅"/> Ditemukan</span>
                        : <span style={{color:C.a,fontWeight:700}}><Ico e="⚠️"/> Tidak ditemukan</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>}
    </div>
  </Modal>;
}
function OpnamePanel({
  opnames, opnameItems, selectedOpname, setSelectedOpname,
  opnameTab, setOpnameTab, showCreateOpname, setShowCreateOpname,
  showImportOpname, setShowImportOpname,
  prods, access, canFinalize, user, toast, rp,
  fbCreateOpname, fbCloseOpname, fbDeleteOpname, fbUpdateOpnameItem,
  fbBulkUpdateOpnameItems, fbApplyOpnameAdjustments,
  slogs, loadSheetJS, BIZ, C, F,
}) {
  const [opnameNotes, setOpnameNotes] = useState({ date: new Date().toISOString().slice(0,10), notes: "" });
  const [physInput, setPhysInput] = useState({});
  const [notesInput, setNotesInput] = useState({});
  const [searchQ, setSearchQ] = useState("");

  const sessions = opnames.filter(o => o.status !== "deleted" && (o.business === "ALL" || access.includes(o.business)));
  const session = opnames.find(o => o.id === selectedOpname);
  const sessionBiz = session && session.business && session.business !== "ALL" ? [session.business] : access;
  const scopeProds = prods.filter(p => sessionBiz.includes(p.business) && access.includes(p.business))
    .sort((a, b) => (a.business === b.business ? a.name.localeCompare(b.name) : a.business.localeCompare(b.business)));
  const locked = session?.status === "closed" || session?.status === "applied";

  const handleCreate = async () => {
    if (!opnameNotes.date) { toast("Pilih tanggal dulu", "warn"); return; }
    const id = await fbCreateOpname({
      business: "ALL", businesses: access, date: opnameNotes.date, notes: opnameNotes.notes,
      pic: user.name, picId: user.id, status: "open",
    });
    setSelectedOpname(id); setShowCreateOpname(false); setOpnameTab("opname");
    setOpnameNotes({ date: new Date().toISOString().slice(0,10), notes: "" });
    setPhysInput({}); setNotesInput({});
    toast("Sesi opname dibuat");
  };
  const handleDelete = async (id) => {
    if (!confirm("Hapus sesi opname ini?")) return;
    await fbDeleteOpname(id);
    if (selectedOpname === id) setSelectedOpname(null);
    toast("Sesi dihapus");
  };
  const statusColors = { open: C.g, closed: C.a, applied: C.b };
  const statusLabels = { open: "Terbuka", closed: "Ditutup", applied: "Diterapkan" };
  const doExport = async () => { await exportOpnameExcel(session, opnameItems, scopeProds, slogs, sessionBiz); toast("✅ Excel diunduh"); };

  return <div style={{maxWidth:1100,margin:"0 auto",display:"flex",flexDirection:"column",gap:10}}>
    <Modal open={!!showCreateOpname} size="sm" dismiss={false} onClose={() => setShowCreateOpname(false)} icon={<ClipboardList size={20}/>} title="Sesi opname baru" subtitle={`PIC: ${user.name}`}
      footer={<><Btn outline onClick={() => setShowCreateOpname(false)}>Batal</Btn><Btn onClick={handleCreate}>Buat sesi</Btn></>}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{padding:"12px 14px",background:C.bg3,borderRadius:12}}>
          <div style={{fontSize:12.5,fontWeight:600,color:C.t1,marginBottom:8}}>Cakupan produk</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{access.map(b => <BizChip key={b} biz={b}/>)}</div>
          <div style={{fontSize:12.5,color:C.t2,marginTop:8,lineHeight:1.5}}>Semua produk dari bisnis di atas masuk otomatis, bisnisnya tercatat per produk.</div>
        </div>
        <Inp label="Tanggal" type="date" value={opnameNotes.date} onChange={e => setOpnameNotes(f => ({ ...f, date: e.target.value }))}/>
        <Inp label="Catatan (opsional)" value={opnameNotes.notes} onChange={e => setOpnameNotes(f => ({ ...f, notes: e.target.value }))} placeholder="Mis. opname akhir bulan"/>
      </div>
    </Modal>

    {showImportOpname && <ImportOpnameModal show={showImportOpname} onClose={() => setShowImportOpname(false)}
      onImport={async (items) => {
        if (!selectedOpname || !items.length) return;
        await fbBulkUpdateOpnameItems(selectedOpname, items);
        setShowImportOpname(false); toast(`✅ ${items.length} produk diimport`);
      }}
      C={C} F={F} loadSheetJS={loadSheetJS} prods={scopeProds} biz={null} BIZ={BIZ}/>}

    {selectedOpname && session ? <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
        <button onClick={() => { setSelectedOpname(null); setOpnameTab("opname"); }} className="press"
          style={{display:"inline-flex",alignItems:"center",gap:6,minHeight:40,padding:"0 12px 0 8px",background:"transparent",border:`1.5px solid ${C.bo1}`,borderRadius:12,color:C.t1,fontSize:13.5,fontWeight:600}}>
          <ArrowLeft size={17}/>Daftar sesi</button>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:800,fontSize:15}}>Opname {session.date}</div>
          <div style={{fontSize:12.5,color:C.t2}}>{session.pic}{session.notes ? " · " + session.notes : ""}</div>
        </div>
        <span style={{padding:"3px 11px",borderRadius:20,fontSize:12,fontWeight:700,color:statusColors[session.status]||C.t2,background:(statusColors[session.status]||C.t2)+"22"}}>{statusLabels[session.status]||session.status}</span>
      </div>
      <div role="tablist" style={{display:"flex",gap:4,marginBottom:14,padding:4,background:C.bg3,borderRadius:14}}>
        {[{ id: "opname", label: "Template" }, { id: "ringkasan", label: "Ringkasan" }, { id: "kartustok", label: "Kartu stok" }].map(t => (
          <button key={t.id} role="tab" aria-selected={opnameTab === t.id} onClick={() => setOpnameTab(t.id)} className="press"
            style={{flex:1,minHeight:40,border:"none",borderRadius:10,fontSize:13.5,fontWeight:700,background:opnameTab===t.id?C.bg2:"transparent",color:opnameTab===t.id?C.pri:C.t2,boxShadow:opnameTab===t.id?C.sh:undefined}}>{t.label}</button>
        ))}
      </div>
      {opnameTab === "opname" && <TemplateOpnameTab items={opnameItems} scopeProds={scopeProds}
        physInput={physInput} setPhysInput={setPhysInput} notesInput={notesInput} setNotesInput={setNotesInput}
        searchQ={searchQ} setSearchQ={setSearchQ} toast={toast} fbUpdateOpnameItem={fbUpdateOpnameItem}
        selectedOpname={selectedOpname} onExport={doExport} onImport={() => setShowImportOpname(true)} locked={locked}/>}
      {opnameTab === "ringkasan" && <RingkasanTab items={opnameItems} selectedOpname={selectedOpname} session={session} user={user} toast={toast}
        fbCloseOpname={fbCloseOpname} fbApplyOpnameAdjustments={fbApplyOpnameAdjustments} canFinalize={canFinalize}/>}
      {opnameTab === "kartustok" && <KartuStockTab slogs={slogs} prods={prods} scopeBiz={sessionBiz} toast={toast} onExport={doExport}/>}
    </div> : <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,gap:10,flexWrap:"wrap"}}>
        <div><h2 style={{fontSize:16,fontWeight:800}}>Sesi opname</h2><p style={{fontSize:12.5,color:C.t2,marginTop:2}}>Cek stok fisik semua produk sekaligus, bisnis tercatat otomatis.</p></div>
        <Btn size="sm" onClick={() => setShowCreateOpname(true)}><Plus size={16}/>Buat sesi baru</Btn>
      </div>
      {sessions.length === 0 ? <Card><EmptyState icon={<ClipboardCheck size={24} strokeWidth={1.6}/>} title="Belum ada sesi opname" hint="Buat sesi baru untuk mulai mengisi stok fisik."/></Card>
      : <div style={{display:"flex",flexDirection:"column",gap:8}}>{sessions.map(s => { const st = s.status || "open";
        return <Card key={s.id} onClick={() => setSelectedOpname(s.id)} style={{padding:"14px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
            <div style={{minWidth:0}}>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:6}}>
                {(s.business === "ALL" ? (s.businesses || access) : [s.business]).map(b => <BizChip key={b} biz={b} sm/>)}
              </div>
              <div style={{fontWeight:700,fontSize:14.5}}>Opname {s.date}</div>
              <div style={{fontSize:12.5,color:C.t2,marginTop:2}}>{s.pic}{s.notes ? " · " + s.notes : ""}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              <span style={{padding:"3px 11px",borderRadius:20,fontSize:12,fontWeight:700,color:statusColors[st]||C.t2,background:(statusColors[st]||C.t2)+"22"}}>{statusLabels[st]||st}</span>
              {st === "open" && canFinalize && <button aria-label="Hapus sesi" onClick={e => { e.stopPropagation(); handleDelete(s.id); }} className="press"
                style={{width:38,height:38,border:"none",background:C.r1,color:C.r,borderRadius:10,display:"grid",placeItems:"center"}}><Trash2 size={17}/></button>}
            </div>
          </div>
        </Card>; })}</div>}
    </div>}
  </div>;
}

// ─────────────────────────────────────────────────────────────
//  BELANJA OPERASIONAL
// ─────────────────────────────────────────────────────────────
const EXPENSE_CATS = ["Sewa","Listrik & Air","Gaji & Upah","Transport & Pengiriman","Kemasan & Perlengkapan","Pemasaran & Iklan","Perawatan & Perbaikan","Internet & Pulsa","Lain-lain"];
const rpS = n => (n < 0 ? "− " : "") + rp(Math.abs(n));

function ExpenseFormModal({ open, onClose, onSave, access, user }) {
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ date: today, business: access[0] || "JS_CLOTHING", category: EXPENSE_CATS[0], description: "", amount: "", payment: "Tunai" });
  useEffect(() => { if (open) setF({ date: today, business: access[0] || "JS_CLOTHING", category: EXPENSE_CATS[0], description: "", amount: "", payment: "Tunai" }); }, [open]);
  if (!open) return null;
  const amt = Math.round(Number(f.amount) || 0);
  const split = f.business === "BOTH";
  const submit = () => {
    if (amt <= 0) return onSave(null, "Isi jumlah belanja lebih dari 0");
    if (!f.date) return onSave(null, "Pilih tanggal");
    const base = { dateISO: f.date, date: new Date(f.date + "T00:00:00").toLocaleDateString("id-ID"), category: f.category, description: f.description.trim(), payment: f.payment, by: user.name, byId: user.id };
    const mk = (business, amount, extra = "") => ({ ...base, id: "EXP-" + uid().toUpperCase(), business, amount, description: (base.description + extra).trim() });
    if (split) { const a1 = Math.ceil(amt / 2); onSave([mk(access[0], a1, " (dibagi rata)"), mk(access[1], amt - a1, " (dibagi rata)")]); }
    else onSave([mk(f.business, amt)]);
  };
  const opts = [...access.map(b => ({ id: b, label: BIZ[b].name })), ...(access.length > 1 ? [{ id: "BOTH", label: "Bagi rata" }] : [])];
  return <Modal open size="md" dismiss={false} onClose={onClose} icon={<ShoppingBasket size={20}/>} title="Catat belanja operasional" subtitle="Biaya di luar pembelian barang dagangan"
    footer={<><Btn outline onClick={onClose}>Batal</Btn><Btn onClick={submit}><Check size={17}/>Simpan</Btn></>}>
    <div className="fgrid">
      <Inp label="Tanggal *" type="date" value={f.date} onChange={e => setF(x => ({ ...x, date: e.target.value }))}/>
      <Inp label="Jumlah *" type="number" suffix="Rp" value={f.amount} onChange={e => setF(x => ({ ...x, amount: e.target.value }))} placeholder="0"/>
      <div className="full">
        <div style={{fontSize:12.5,fontWeight:600,color:C.t1,marginBottom:6}}>Untuk bisnis *</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {opts.map(o => { const on = f.business === o.id;
            return <button key={o.id} type="button" aria-pressed={on} onClick={() => setF(x => ({ ...x, business: o.id }))} className="press"
              style={{flex:"1 1 110px",minHeight:46,borderRadius:12,fontWeight:700,fontSize:14,background:on?C.pri1:"transparent",border:`2px solid ${on?C.pri:C.bo1}`,color:on?C.pri:C.t2}}>{o.label}</button>; })}
        </div>
        {split && amt > 0 && <div style={{fontSize:12.5,color:C.t2,marginTop:8}}>{BIZ[access[0]].name}: {rp(Math.ceil(amt / 2))} · {BIZ[access[1]].name}: {rp(amt - Math.ceil(amt / 2))}</div>}
      </div>
      <Sel label="Kategori *" value={f.category} onChange={e => setF(x => ({ ...x, category: e.target.value }))}>{EXPENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}</Sel>
      <div>
        <div style={{fontSize:12.5,fontWeight:600,color:C.t1,marginBottom:6}}>Dibayar dengan</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{["Tunai", "Transfer", "QRIS"].map(m => <button key={m} type="button" onClick={() => setF(x => ({ ...x, payment: m }))} className={`chip${f.payment === m ? " on" : ""}`}>{m}</button>)}</div>
      </div>
      <div className="full"><Inp label="Keterangan" value={f.description} onChange={e => setF(x => ({ ...x, description: e.target.value }))} placeholder="Mis. beli plastik kemasan 5 pack"/></div>
    </div>
  </Modal>;
}


// ─────────────────────────────────────────────────────────────
//  APPSCRIPT CODE
// ─────────────────────────────────────────────────────────────
const APPSCRIPT_CODE = `
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = {
    users: getOrCreate(ss,"Pengguna"), products: getOrCreate(ss,"Barang"),
    transactions: getOrCreate(ss,"Transaksi"), stocklogs: getOrCreate(ss,"LogStok"),
    attendance: getOrCreate(ss,"Absensi")
  };
  if(data.users) syncSheet(sheets.users, data.users,
    ["ID","Username","Nama","Role","Akses","Avatar","Aktif"]);
  if(data.products) syncSheet(sheets.products, data.products,
    ["ID","Barcode","Nama","Kategori","HPP","Harga Jual","Stok","Bisnis"]);
  if(data.transactions) syncSheet(sheets.transactions, data.transactions,
    ["ID","Tanggal","Kasir","Bisnis","Total","HPP","Laba","Diskon","Pembayaran","Items"]);
  if(data.stocklogs) syncSheet(sheets.stocklogs, data.stocklogs,
    ["ID","Tanggal","Barcode","Produk","Bisnis","Tipe","Qty","Sebelum","Sesudah","Oleh"]);
  if(data.attendance) syncSheet(sheets.attendance, data.attendance,
    ["ID","Tanggal","Username","Nama","Role","Bisnis","Jam Masuk","Jam Pulang"]);
  return ContentService.createTextOutput(JSON.stringify({ok:true}))
    .setMimeType(ContentService.MimeType.JSON);
}
function getOrCreate(ss,name){ return ss.getSheetByName(name)||ss.insertSheet(name); }
function syncSheet(sh,rows,headers){
  sh.clearContents(); sh.appendRow(headers);
  rows.forEach(r=>sh.appendRow(Object.values(r)));
}
`;

// ─────────────────────────────────────────────────────────────
//  ETALASE PUBLIK / LANDING PAGE IKLAN
//  Mode: Redesign-Preserve · Dial VARIANCE 7 / MOTION 4 (CSS) / DENSITY 3
//  Figtree + ikon Lucide, radius kartu 20px. Palet Tenun Sumba menyatu dengan merek:
//  indigo tarum (C.pri) sebagai aksen halaman, biru = identitas JS Clothing, rose = JB Store.
// ─────────────────────────────────────────────────────────────

// Foto: diatur dari Admin Panel > tab "Landing Page" (tersimpan di Firestore: settings/landing).
// Cukup tempel link Google Drive - link "share" apa pun otomatis diubah ke URL gambar.
const driveImg = (u, w = 1600) => {
  const id = /[-\w]{25,}/.exec(u || "")?.[0];
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${w}` : "";
};
const picPhoto = (seed, w, h) => `https://picsum.photos/seed/je-${seed}/${w}/${h}`;
// Slot foto landing page: [key, label] - key sama dengan field di settings/landing.
const PHOTO_FIELDS = [
  ["hero",    "Foto utama (tegak) - mis. kaos konveksi"],
  ["hero2",   "Foto pendamping (kotak) - mis. serum skincare"],
  ["js",      "Foto kartu JS Clothing"],
  ["jb",      "Foto kartu JB Store"],
  ["atelier", "Foto lebar bagian Kenapa belanja di sini"],
];
const LANDING = {}; // diisi subscribeLanding dari settings/landing
const photo = (slot, w, h) => driveImg(LANDING[slot], w) || picPhoto(slot, w, h);
// ponytail: selama slot kosong, tampil placeholder picsum.

// Nomor WhatsApp toko, format internasional tanpa tanda plus (contoh: "6281234567890").
// Default di bawah bisa ditimpa admin dari tab Landing Page.
const LANDING_WA = "6285191435249";
const waHref = (text) => {
  const n = String(LANDING.wa || LANDING_WA).replace(/\D/g, "");
  return `https://wa.me/${n}${text ? "?text=" + encodeURIComponent(text) : ""}`;
};

// Foto per produk: pakai p.photo (diisi di form produk), selain itu placeholder.
const productPhoto = (p) => (p.photo ? driveImg(p.photo, 700) : picPhoto(p.barcode || p.id, 700, 700));

function ProductLandingPage({ prods, cfg, user, onLogin, onToggleTheme, isDark, onOpenCustomizer }) {
  const [selectedBiz, setSelectedBiz] = React.useState("ALL");
  const [searchWord, setSearchWord] = React.useState("");

  // Produk yang diiklankan admin (p.advertised), dipotong sesuai "jumlah tampil" per bisnis
  // yang diatur di Admin Panel > Landing Page. Fallback: produk berstok, maksimal 8.
  const advertisedList = React.useMemo(() => {
    const adv = prods.filter(p => p.advertised);
    const src = adv.length ? adv : prods.filter(p => p.stock > 0).slice(0, 8);
    const lim = (cfg && cfg.limits) || {};
    const seen = {};
    return src.filter(p => {
      const max = Number(lim[p.business] || 0);
      seen[p.business] = (seen[p.business] || 0) + 1;
      return max <= 0 || seen[p.business] <= max;
    });
  }, [prods, cfg]);

  const filtered = React.useMemo(() => advertisedList.filter(p => {
    const matchBiz = selectedBiz === "ALL" || p.business === selectedBiz;
    const q = searchWord.trim().toLowerCase();
    return matchBiz && (!q || p.name.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q));
  }), [advertisedList, selectedBiz, searchWord]);

  const jsCount = advertisedList.filter(p => p.business === "JS_CLOTHING").length;
  const jbCount = advertisedList.filter(p => p.business === "JB_STORE").length;
  const stockLabel = p => p.stock <= 0 ? "Stok habis" : (p.stock < 10 ? "Stok terbatas" : "Tersedia");

  const pickBiz = biz => {
    setSelectedBiz(biz);
    if (typeof document !== "undefined") document.getElementById("katalog")?.scrollIntoView({ behavior:"smooth", block:"start" });
  };

  const btnPrimary = { height:50, padding:"0 22px", borderRadius:14, background:C.pri, color:C.on,
    fontWeight:700, fontSize:14.5, border:"none", display:"inline-flex", alignItems:"center", gap:9,
    textDecoration:"none", whiteSpace:"nowrap" };
  const btnGhost = { height:50, padding:"0 20px", borderRadius:14, background:"transparent", color:C.t0,
    border:`1.5px solid ${C.bo2}`, fontWeight:700, fontSize:14.5, display:"inline-flex", alignItems:"center",
    gap:9, textDecoration:"none", whiteSpace:"nowrap" };

  return (
    <div style={{minHeight:"100dvh",background:C.bg1,color:C.t0,display:"flex",flexDirection:"column",fontFamily:F.sans}}>
      {/* ── Floating Modern Navbar ── */}
      <div className="lp-header-wrap">
        <header className="lp-navbar" role="banner">
          <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
            <a href="#" style={{display:"flex",alignItems:"center",gap:10,textDecoration:"none",color:C.t0,minWidth:0}} aria-label="Beranda Katalog">
              <BrandMark size={35}/>
              <div style={{minWidth:0}}>
                <div style={{fontSize:15,fontWeight:800,letterSpacing:"-.025em",lineHeight:1.15,whiteSpace:"nowrap"}}>JE Store</div>
                <div style={{fontSize:11,color:C.t2,fontWeight:600,whiteSpace:"nowrap",letterSpacing:"-.01em"}}>Katalog Produk &amp; Custom</div>
              </div>
            </a>
          </div>

          {/* Navigasi kapsul di tengah (desktop & tablet) */}
          <nav className="lp-nav-links" aria-label="Navigasi cepat etalase">
            <div className="lp-nav-pill">
              <a href="#katalog" className="nav-link">Katalog Produk</a>
              {onOpenCustomizer && (
                <button
                  onClick={onOpenCustomizer}
                  className="nav-link press"
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: C.b,
                    fontWeight: 800,
                  }}
                >
                  <Shirt size={14} /> Desain Baju
                </button>
              )}
              <a href="#keunggulan" className="nav-link">Keunggulan</a>
              <a href={waHref("Halo, saya mau tanya produk katalog.")} target="_blank" rel="noreferrer" className="nav-link">
                Hubungi WA
              </a>
            </div>
          </nav>

          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            <button onClick={onToggleTheme} className="press" aria-label="Ganti mode tema"
              style={{width:38,height:38,borderRadius:12,border:`1px solid ${C.bo1}`,background:C.bg2,color:C.t1,display:"grid",placeItems:"center",transition:"all .15s ease"}}>
              {isDark ? <Sun size={17}/> : <Moon size={17}/>}
            </button>
            <button onClick={onLogin} className="press"
              style={{height:38,padding:"0 15px",borderRadius:12,background:C.pri,color:C.on,fontWeight:700,fontSize:13,
                border:"none",display:"inline-flex",alignItems:"center",gap:6,whiteSpace:"nowrap",boxShadow:C.sh,letterSpacing:"-.01em"}}>
              {user ? <LayoutDashboard size={14}/> : <Lock size={14}/>}
              {user ? (user.role==="admin"?"Admin":"Kasir") : "Masuk"}
            </button>
          </div>
        </header>
      </div>

      {/* ── Hero: Fokus Iklan Produk & Custom ── */}
      <section style={{maxWidth:1180,width:"100%",margin:"0 auto",padding:"40px 20px 34px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(330px,1fr))",gap:"clamp(28px,5vw,56px)",alignItems:"center"}}>
          <div>
            <div style={{display:"inline-flex",alignItems:"center",gap:7,padding:"5px 13px",borderRadius:50,background:C.pri1,color:C.pri,fontSize:12,fontWeight:800,marginBottom:14}}>
              <Sparkles size={14}/> Katalog Produk Pilihan Siap Pesan
            </div>
            <h1 className="lp-title" style={{fontWeight:800,letterSpacing:"-.03em",lineHeight:1.08,margin:"0 0 16px"}}>
              Koleksi Produk Pilihan &amp; Desain Baju Custom
            </h1>
            <p style={{fontSize:16,color:C.t1,lineHeight:1.65,maxWidth:480,marginBottom:26}}>
              Pilih produk favorit Anda atau rancang kaos custom Anda sendiri. Pesan langsung via WhatsApp dengan respon cepat, produk berkualitas, dan harga resmi terpercaya.
            </p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <a href="#katalog" className="press" style={btnPrimary}>
                <ShoppingBag size={17}/> Lihat Katalog Produk
              </a>
              {onOpenCustomizer && (
                <button onClick={onOpenCustomizer} className="press" style={{...btnGhost, background:C.b1, color:C.b, border:`1.5px solid ${C.b}44`}}>
                  <Shirt size={17}/> Buat Kaos Custom
                </button>
              )}
              <a href={waHref("Halo, saya mau tanya produk katalog.")} target="_blank" rel="noreferrer" className="press" style={btnGhost}>
                <MessageCircle size={17}/> Chat WhatsApp
              </a>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1.12fr .88fr",gap:14}}>
            <div className="lp-shot" style={{aspectRatio:"4 / 5",borderRadius:24}}>
              <img src={photo("hero",1200,1500)} alt="Produk Pakaian Pilihan" className="lp-photo" loading="eager" decoding="async"/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div className="lp-shot" style={{aspectRatio:"1 / 1",borderRadius:20}}>
                <img src={photo("hero2",800,800)} alt="Produk Perawatan Original" className="lp-photo" loading="lazy" decoding="async"/>
              </div>
              <div style={{flex:1,minHeight:96,borderRadius:20,background:C.bg2,border:`1px solid ${C.bo1}`,
                padding:"16px 16px 14px",display:"flex",flexDirection:"column",justifyContent:"center",gap:7}}>
                <div style={{display:"flex",gap:6}}>
                  <span style={{flex:1,height:4,borderRadius:2,background:"#25D366"}}/>
                  <span style={{flex:1,height:4,borderRadius:2,background:C.pri}}/>
                  <span style={{flex:1,height:4,borderRadius:2,background:"var(--ik2)"}}/>
                </div>
                <div className="mn" style={{fontSize:20,fontWeight:850,letterSpacing:"-.02em",lineHeight:1.1,color:"#25D366",display:"flex",alignItems:"center",gap:7}}>
                  <MessageCircle size={20}/> Pesan via WA
                </div>
                <div style={{fontSize:12,color:C.t2,fontWeight:600,lineHeight:1.35}}>Klik produk &amp; langsung kirim pesanan</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pita ikat (ciri merek) */}
      <div className="ikat-band" aria-hidden="true"/>

      {/* ── Highlight Banner: Studio Desain Baju Custom ── */}
      {onOpenCustomizer && (
        <section style={{maxWidth:1180,width:"100%",margin:"0 auto",padding:"36px 20px 8px"}}>
          <div style={{
            position:"relative",
            overflow:"hidden",
            borderRadius:24,
            background:isDarkTheme()
              ? "linear-gradient(135deg, rgba(27,100,176,0.32) 0%, rgba(15,19,48,0.92) 100%)"
              : "linear-gradient(135deg, rgba(27,100,176,0.12) 0%, rgba(240,244,255,0.96) 100%)",
            border:`1.5px solid ${C.b}44`,
            padding:"clamp(24px, 4.5vw, 36px)",
            display:"grid",
            gridTemplateColumns:"repeat(auto-fit, minmax(290px, 1fr))",
            gap:24,
            alignItems:"center",
            boxShadow:C.sh2
          }}>
            <div>
              <div style={{display:"inline-flex",alignItems:"center",gap:7,padding:"4px 12px",borderRadius:50,background:C.b1,color:C.b,fontSize:12,fontWeight:800,marginBottom:10}}>
                <Sparkles size={14}/> Studio Desain Online JS Clothing
              </div>
              <h3 style={{fontSize:"clamp(22px, 3.2vw, 29px)",fontWeight:850,letterSpacing:"-.025em",lineHeight:1.2,marginBottom:8}}>
                Bikin Kaos Custom Sendiri, Kirim Hasilnya ke WhatsApp
              </h3>
              <p style={{fontSize:14,color:C.t1,lineHeight:1.6,marginBottom:18,maxWidth:490}}>
                Bebas pilih warna kain, ketik nama komunitas atau nomor punggung, dan unggah logo Anda. Desain tampak depan &amp; belakang, simpan di koleksi, lalu kirim spesifikasinya langsung ke admin konveksi kami.
              </p>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <button onClick={onOpenCustomizer} className="press" style={{...btnPrimary, background:C.b, color:"#fff"}}>
                  <Shirt size={17}/> Buka Studio Desain Baju
                </button>
              </div>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:10,background:C.bg2,padding:18,borderRadius:18,border:`1px solid ${C.bo1}`}}>
              <div style={{fontSize:13,fontWeight:800,color:C.t0,display:"flex",alignItems:"center",gap:6}}>
                <ShieldCheck size={16} color={C.g}/> Fitur Studio Desain JS Clothing:
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,fontSize:12,color:C.t1}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>• Kaos 30s, 24s, Polo, Hoodie</div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>• 12 Pilihan Warna Kain Distro</div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>• Bebas Upload Logo Sendiri</div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>• Preview Depan &amp; Belakang</div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>• Simpan &amp; Edit Kapan Saja</div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>• Download Mockup PNG Jernih</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Katalog Produk (Fokus Utama Iklan Produk) ── */}
      <section id="katalog" style={{flex:1,maxWidth:1180,width:"100%",margin:"0 auto",padding:"40px 20px 56px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:16,marginBottom:24}}>
          <div>
            <h2 style={{fontSize:"clamp(22px,3vw,30px)",fontWeight:800,letterSpacing:"-.025em"}}>Katalog Produk Siap Pesan</h2>
            <p style={{fontSize:14,color:C.t2,marginTop:4}}>Pilih produk favorit Anda, lalu klik tombol <b>Pesan Sekarang</b> untuk langsung order via WhatsApp.</p>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            {/* Filter Jenis Produk */}
            <div style={{display:"flex",gap:6,background:C.bg3,padding:4,borderRadius:12,border:`1px solid ${C.bo0}`}}>
              {[
                ["ALL", "Semua Produk", ShoppingBag],
                ["JS_CLOTHING", "Pakaian & Kaos", Shirt],
                ["JB_STORE", "Skincare & Perawatan", Sparkles]
              ].map(([k, label, IconComp]) => {
                const active = selectedBiz === k;
                return (
                  <button key={k} onClick={()=>setSelectedBiz(k)} className="press fbtn"
                    style={{border:"none",borderRadius:8,padding:"8px 14px",fontSize:12.5,
                      fontWeight:active?800:600,background:active?C.bg2:"transparent",
                      color:active?C.pri:C.t2,boxShadow:active?C.sh:"none",display:"inline-flex",alignItems:"center",gap:6}}>
                    <IconComp size={14}/>
                    {label}
                  </button>
                );
              })}
            </div>
            {/* Pencarian Produk */}
            <div style={{position:"relative",flex:"1 1 200px",minWidth:180}}>
              <Search size={15} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:C.t2}}/>
              <input value={searchWord} onChange={e=>setSearchWord(e.target.value)} placeholder="Cari nama produk..." aria-label="Cari produk"
                style={{width:"100%",padding:"10px 12px 10px 34px",background:C.bg2,border:`1.5px solid ${C.bo1}`,
                  borderRadius:10,fontSize:13,color:C.t0,fontFamily:F.sans}}/>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{background:C.bg2,borderRadius:20,border:`1px solid ${C.bo0}`,padding:"48px 20px",
            textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
            <div style={{width:54,height:54,borderRadius:16,background:C.bg3,color:C.t3,display:"grid",placeItems:"center"}}>
              <Package size={26}/>
            </div>
            <div style={{fontSize:16,fontWeight:800}}>Produk tidak ditemukan</div>
            <div style={{fontSize:13.5,color:C.t2,maxWidth:320}}>Ubah kata kunci pencarian atau ganti filter kategori di atas.</div>
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(225px,1fr))",gap:18}}>
            {filtered.map(p => {
              const isJ = p.business === "JS_CLOTHING";
              const tone = isJ ? C.b : C.p;
              const toneBg = isJ ? C.b1 : C.p1;
              const out = p.stock <= 0;
              const orderText = `Halo, saya tertarik untuk memesan produk *${p.name}* (${rp(p.price)}). Apakah stok masih tersedia?`;

              return (
                <article key={p.id} className="lp-card-in lp-lift"
                  style={{background:C.bg2,border:`1px solid ${C.bo1}`,borderRadius:20,overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:C.sh}}>
                  <div className="lp-shot" style={{aspectRatio:"1 / 1",position:"relative"}}>
                    <img src={productPhoto(p)} alt={p.name} className="lp-photo" loading="lazy" decoding="async"/>
                    {out && (
                      <div style={{position:"absolute",top:10,right:10,background:"rgba(220,38,38,0.92)",color:"#fff",fontSize:10.5,fontWeight:800,padding:"3px 8px",borderRadius:6,backdropFilter:"blur(4px)"}}>
                        Stok Habis
                      </div>
                    )}
                  </div>
                  <div style={{padding:"14px 15px 16px",display:"flex",flexDirection:"column",flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                      <span style={{fontSize:10.5,fontWeight:800,padding:"3px 9px",borderRadius:50,background:toneBg,color:tone,display:"inline-flex",alignItems:"center",gap:4}}>
                        {isJ ? <Shirt size={11}/> : <Sparkles size={11}/>} {p.category || (isJ ? "Pakaian" : "Perawatan")}
                      </span>
                      <span style={{fontSize:11,fontWeight:700,color:out?C.r:(p.stock<10?C.a:C.g),marginLeft:"auto"}}>
                        {stockLabel(p)}
                      </span>
                    </div>

                    <h3 style={{fontSize:14.5,fontWeight:700,lineHeight:1.35,marginBottom:"auto",color:C.t0}}>{p.name}</h3>

                    <div style={{marginTop:12,display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:8}}>
                      <div className="mn" style={{fontSize:18,fontWeight:850,color:C.pri}}>{rp(p.price)}</div>
                    </div>

                    {/* Tombol Pesan Sekarang Mengarah ke WA dengan Nama Produk */}
                    <a
                      href={waHref(orderText)}
                      target="_blank"
                      rel="noreferrer"
                      className="press"
                      style={{
                        display:"inline-flex",
                        alignItems:"center",
                        justifyContent:"center",
                        gap:7,
                        width:"100%",
                        padding:"10px 14px",
                        borderRadius:12,
                        background: out ? C.bg3 : "#25D366",
                        color: out ? C.t2 : "#FFFFFF",
                        fontWeight: 800,
                        fontSize: 13,
                        textDecoration:"none",
                        marginTop: 14,
                        border: out ? `1px solid ${C.bo1}` : "none",
                        boxShadow: out ? "none" : "0 4px 14px rgba(37,211,102,0.30)",
                        transition:"all .15s ease",
                      }}
                    >
                      <MessageCircle size={16}/>
                      {out ? "Tanya Ketersediaan" : "Pesan Sekarang"}
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Keunggulan Belanja di Sini: Benefit Pembeli ── */}
      <section id="keunggulan" style={{maxWidth:1180,width:"100%",margin:"0 auto",padding:"8px 20px 56px"}}>
        <h2 style={{fontSize:"clamp(22px,3vw,28px)",fontWeight:800,letterSpacing:"-.025em",marginBottom:6}}>Keunggulan Belanja di Sini</h2>
        <p style={{fontSize:14,color:C.t2,marginBottom:20}}>Kemudahan berbelanja langsung dengan jaminan kualitas terbaik dan respon cepat.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
          {[
            {
              icon:<ShieldCheck size={22}/>,
              tone:C.g,
              toneBg:C.g1,
              bg:C.bg2,
              t:"Produk Berkualitas & Original",
              d:"Pakaian dengan bahan katun combed standar distro yang nyaman, serta produk skincare original teruji langsung dari distributor resmi."
            },
            {
              icon:<MessageCircle size={22}/>,
              tone:"#25D366",
              toneBg:"rgba(37,211,102,0.12)",
              bg:C.bg2,
              t:"Pesan Cepat via WhatsApp",
              d:"Cukup klik tombol Pesan Sekarang pada produk, pesan otomatis terformat rapi dan langsung dibalas cepat oleh tim kami."
            },
            {
              icon:<Shirt size={22}/>,
              tone:C.b,
              toneBg:C.b1,
              bg:C.bg2,
              t:"Bisa Custom & Grosir",
              d:"Melayani pembuatan kaos custom satuan, seragam komunitas, maupun pesanan grosir partai besar dengan harga khusus."
            },
          ].map(c => (
            <div key={c.t} style={{background:c.bg,border:`1px solid ${C.bo1}`,borderRadius:20,padding:"22px 22px",
              display:"flex",flexDirection:"column",gap:12,boxShadow:C.sh}}>
              <span style={{width:44,height:44,borderRadius:12,background:c.toneBg,color:c.tone,display:"grid",placeItems:"center"}}>{c.icon}</span>
              <div style={{fontSize:16.5,fontWeight:800,letterSpacing:"-.015em"}}>{c.t}</div>
              <p style={{fontSize:13.5,color:C.t1,lineHeight:1.6}}>{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Ajakan Penutup ── */}
      <section id="kontak" style={{maxWidth:1180,width:"100%",margin:"0 auto",padding:"0 20px 56px"}}>
        <div style={{position:"relative",overflow:"hidden",borderRadius:24,background:"var(--ik1)",
          padding:"clamp(30px,5vw,52px)",display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",gap:24}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:6,
            background:"repeating-linear-gradient(90deg,#25D366 0 4px,var(--ik2) 4px 8px)"}}/>
          <div style={{position:"relative",maxWidth:520}}>
            <h2 style={{fontSize:"clamp(22px,3.4vw,32px)",fontWeight:800,letterSpacing:"-.03em",color:"#fff",lineHeight:1.15,marginBottom:10}}>
              Tertarik dengan Produk Kami?
            </h2>
            <p style={{fontSize:14.5,color:"rgba(255,255,255,.82)",lineHeight:1.6}}>
              Hubungi kami langsung via WhatsApp untuk menanyakan ketersediaan ukuran, konsultasi bahan, atau pemesanan khusus.
            </p>
          </div>
          <div style={{position:"relative",display:"flex",gap:10,flexWrap:"wrap"}}>
            <a href={waHref("Halo, saya ingin memesan produk dari katalog.")} target="_blank" rel="noreferrer" className="press"
              style={{...btnPrimary,background:"#25D366",color:"#fff"}}>
              <MessageCircle size={18}/> Chat WhatsApp Sekarang
            </a>
            <button onClick={onLogin} className="press"
              style={{...btnGhost,color:"#fff",borderColor:"rgba(255,255,255,.35)"}}>
              {user ? <LayoutDashboard size={16}/> : <Lock size={16}/>}
              {user ? (user.role==="admin"?"Kembali ke Admin":"Kembali ke Kasir") : "Masuk Kasir"}
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{marginTop:"auto",borderTop:`1px solid ${C.bo1}`,background:C.bg2,
        padding:"28px 20px calc(28px + env(safe-area-inset-bottom, 0px))"}}>
        <div style={{maxWidth:1180,margin:"0 auto",display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",gap:14}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <BrandMark size={30}/>
            <div>
              <div style={{fontSize:14,fontWeight:800}}>JE Store</div>
              <div style={{fontSize:12,color:C.t2}}>Katalog Produk &amp; Custom Desain</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
            <a href="#katalog" style={{fontSize:13,fontWeight:600,color:C.t1,textDecoration:"none"}}>Katalog Produk</a>
            {onOpenCustomizer && (
              <button onClick={onOpenCustomizer} style={{background:"transparent",border:"none",padding:0,fontSize:13,fontWeight:600,color:C.b,cursor:"pointer"}}>
                Studio Desain
              </button>
            )}
            <a href={waHref("Halo, saya mau tanya produk katalog.")} target="_blank" rel="noreferrer"
              style={{fontSize:13,fontWeight:600,color:C.t1,textDecoration:"none"}}>Chat WhatsApp</a>
            <button onClick={onLogin} className="press"
              style={{fontSize:13,fontWeight:700,color:C.pri,background:"transparent",border:"none",padding:0}}>
              {user ? (user.role==="admin"?"Kembali ke Admin":"Kembali ke Kasir") : "Masuk Kasir"}
            </button>
          </div>
        </div>
        <div style={{maxWidth:1180,margin:"20px auto 0",fontSize:12,color:C.t3}}>
          &copy; {new Date().getFullYear()} JE Store. Semua harga dalam Rupiah resmi.
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────────────────────
function AdminSidebar({tabs,groups,active,onSelect,label="Menu admin",storeKey="je_sidew",defaultW=244}) {
  const MIN=208,MAX=380,RAIL=68,SNAP=150;
  const [w,setW]=React.useState(()=>{const v=parseInt(localStorage.getItem(storeKey),10);return v>=RAIL&&v<=MAX?v:defaultW;});
  const [drag,setDrag]=React.useState(false);
  const ref=React.useRef(null);
  const rail=w<=RAIL;
  const commit=v=>{setW(v);try{localStorage.setItem(storeKey,String(v));}catch{}};
  const fromX=x=>{const left=ref.current?.getBoundingClientRect().left||0;const raw=x-left;return raw<SNAP?RAIL:Math.min(MAX,Math.max(MIN,raw));};
  const down=e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);document.body.style.userSelect="none";setDrag(true);};
  const move=e=>{if(drag)setW(fromX(e.clientX));};
  const up=e=>{if(!drag)return;setDrag(false);document.body.style.userSelect="";try{e.currentTarget.releasePointerCapture(e.pointerId);}catch{}commit(fromX(e.clientX));};
  const key=e=>{
    if(e.key==="ArrowLeft")commit(rail?RAIL:(w-16<SNAP?RAIL:Math.max(MIN,w-16)));
    else if(e.key==="ArrowRight")commit(rail?MIN:Math.min(MAX,w+16));
    else if(e.key==="Home")commit(defaultW);
    else return;
    e.preventDefault();
  };

  const renderedGroups = groups && groups.length > 0 ? groups : [{ id: "default", title: "", items: tabs || [] }];

  return <aside ref={ref} className="hide-mobile" style={{width:w,flexShrink:0,position:"relative",background:C.bg2,borderRight:`1px solid ${C.bo0}`,
    transition:drag?"none":"width .18s cubic-bezier(0.4, 0, 0.2, 1)",display:"flex",flexDirection:"column",minHeight:0,userSelect:"none"}}>
    {/* Nav List with Group Sections */}
    <nav aria-label={label} style={{flex:1,overflowY:"auto",overflowX:"hidden",padding:rail?"12px 8px":"12px 10px 14px",display:"flex",flexDirection:"column",gap:2}}>
      {renderedGroups.map((g, gIdx) => (
        <div key={g.id || gIdx} style={{marginTop:gIdx===0?2:12}}>
          {g.title ? (
            !rail ? (
              <div style={{padding:"4px 8px 6px",fontSize:10.5,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",color:C.t3}}>
                {g.title}
              </div>
            ) : (
              gIdx > 0 && <div style={{height:1,background:C.bo0,margin:"6px 4px 8px"}}/>
            )
          ) : null}

          <div style={{display:"flex",flexDirection:"column",gap:2}}>
            {g.items.map(t=>{const on=active===t.id;
              return <button key={t.id} onClick={()=>onSelect(t.id)} title={rail?t.l:undefined} aria-label={rail?t.l:undefined} aria-current={on?"page":undefined} className="press sbtn"
                style={{position:"relative",display:"flex",alignItems:"center",gap:11,width:"100%",height:38,padding:rail?0:"0 10px",justifyContent:rail?"center":"flex-start",
                  borderRadius:10,border:on?`1px solid ${C.pri}33`:"1px solid transparent",background:on?C.pri1:undefined,color:on?C.pri:C.t1,fontSize:13,fontWeight:on?700:500,whiteSpace:"nowrap",transition:"all .14s ease"}}>
                {/* Active indicator bar */}
                {on && !rail && (
                  <span style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",width:3.5,height:18,borderRadius:"0 4px 4px 0",background:C.pri}}/>
                )}
                <t.ic size={18} strokeWidth={on?2.3:1.8} color={on?C.pri:C.t2} style={{flexShrink:0}}/>
                {!rail&&<span style={{overflow:"hidden",textOverflow:"ellipsis",flex:1,textAlign:"left"}}>{t.l}</span>}
                {!rail&&t.badge>0&&<span style={{padding:"2px 7px",borderRadius:12,background:C.a,color:"#FFF",fontSize:11,fontWeight:800,lineHeight:1.2,boxShadow:"0 1px 3px rgba(168,95,0,0.3)"}}>{t.badge}</span>}
                {rail&&t.badge>0&&<span style={{position:"absolute",top:6,right:12,width:8,height:8,borderRadius:"50%",background:C.a,border:`2px solid ${C.bg2}`}}/>}
              </button>;})}
          </div>
        </div>
      ))}
    </nav>

    {/* Collapse Footer */}
    <div style={{padding:rail?"8px":"8px 10px",borderTop:`1px solid ${C.bo0}`,flexShrink:0}}>
      <button onClick={()=>commit(rail?defaultW:RAIL)} className="press sbtn" aria-label={rail?"Perluas menu":"Ciutkan menu"} title={rail?"Perluas menu":undefined}
        style={{display:"flex",alignItems:"center",gap:10,width:"100%",height:36,padding:rail?0:"0 10px",justifyContent:rail?"center":"flex-start",border:"none",borderRadius:8,color:C.t2,fontSize:12.5,fontWeight:600}}>
        {rail?<PanelLeftOpen size={18}/>:<><PanelLeftClose size={18}/><span>Ciutkan menu</span></>}
      </button>
    </div>

    <div role="separator" aria-orientation="vertical" aria-label="Ubah lebar menu" aria-valuenow={w} aria-valuemin={RAIL} aria-valuemax={MAX} tabIndex={0}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key} onDoubleClick={()=>commit(rail?defaultW:RAIL)}
      className={`sresize${drag?" on":""}`}/>
  </aside>;
}

function AppInner() {
  // ─── Firebase ───
  const [fbReady,setFbReady]=useState(false);
  const [fbSetup,setFbSetup]=useState(false);
  const [fbLoad,setFbLoad]=useState(true);
  // ─── Theme ───
  const [isDark,setIsDark]=useState(()=>localStorage.getItem("je_theme")==="dark");
  const [showPw,setShowPw]=useState(false);
  const [updateReady,setUpdateReady]=useState(false);
  const toggleTheme=()=>{
    const next=!isDark;
    Object.assign(C,next?DARK_C:LIGHT_C);
    CSS=makeCSS();
    syncThemeColor();
    localStorage.setItem("je_theme",next?"dark":"light");
    setIsDark(next);
  };
  // ─── Online ───
  const [online,setOnline]=useState(navigator.onLine);
  useEffect(()=>{
    const on=()=>setOnline(true),off=()=>setOnline(false);
    window.addEventListener("online",on);window.addEventListener("offline",off);
    return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off);};
  },[]);

  // ── SW Update listener ────────────────────────────────────
  useEffect(()=>{
    // Callback dipanggil dari index.html saat ada versi baru
    window.__onUpdateReady=()=>setUpdateReady(true);
    // Cek apakah sudah ada update sebelum React mount
    if(window.__pendingSW) setUpdateReady(true);
    return()=>{ window.__onUpdateReady=null; };
  },[]);
  // ─── Firebase init ───
  useEffect(()=>{
    const cfg=loadConfig();
    if(!cfg){setFbLoad(false);setFbSetup(true);return;}
    initFirebase(cfg).then(async r=>{
      if(!r.ok){setFbLoad(false);setFbSetup(true);return;}
      const seeded=await isSeeded().catch(()=>false);
      if(!seeded) await seedDatabase(SEED_USERS,SEED_PRODUCTS);
      setFbReady(true);setFbLoad(false);
    });
  },[]);
  // ─── Firestore data ───
  const [users,setUsers]=useState([]);
  const [prods,setProds]=useState([]);
  const [trxs,setTrxs]=useState([]);
  const [slogs,setSlogs]=useState([]);
  const [attend,setAttend]=useState([]);
  const [returns,setReturns]=useState([]);
  const [actLogs,setActLogs]=useState([]);
  const [targets,setTargets]=useState([]);
  const [opnames, setOpnames] = useState([]);
  const [opnameItems, setOpnameItems] = useState([]);
  const [selectedOpname, setSelectedOpname] = useState(null);
  const [landingCfg, setLandingCfg] = useState({});
  const [landingDraft, setLandingDraft] = useState(null);
  const [customOrders, setCustomOrders] = useState(() => {
    try {
      const raw = localStorage.getItem("je_custom_orders_backup");
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [previewOrder, setPreviewOrder] = useState(null);
  const [customOrderFilter, setCustomOrderFilter] = useState("Semua");
  const [customOrderSearch, setCustomOrderSearch] = useState("");

  useEffect(()=>{
    if(!fbReady) return;
    const uns=[
      subscribeUsers(d=>setUsers(d.map(u=>({...u,faceDescriptor:u.faceDescriptor?new Float32Array(u.faceDescriptor):null})))),
      subscribeProducts(d=>setProds(d)),
      subscribeTransactions(d=>setTrxs(d)),
      subscribeStockLogs(d=>setSlogs(d)),
      subscribeAttendance(d=>setAttend(d)),
      subscribeReturns(d=>setReturns(d)),
      subscribeActivityLogs(d=>setActLogs(d)),
      subscribeTargets(d=>setTargets(d)),
      subscribeOpnames(d=>setOpnames(d)),
      subscribeExpenses(d=>setExpenses(d)),
      subscribeLanding(d=>{Object.assign(LANDING,d);setLandingCfg(d);}),
      subscribeCustomOrders(d=>{
        setCustomOrders(d);
        try { localStorage.setItem("je_custom_orders_backup", JSON.stringify(d)); } catch {}
      }),
    ];
    return()=>uns.forEach(u=>u&&u());
  },[fbReady]);
  // ─── Subscribe opname items when session selected ───
  useEffect(() => {
    if (!selectedOpname || !fbReady) { setOpnameItems([]); return; }
    const unsub = subscribeOpnameItems(selectedOpname, d => setOpnameItems(d));
    return () => unsub();
  }, [selectedOpname, fbReady]);
  // ─── Hide splash screen when app is ready ───
  useEffect(()=>{
    if(fbReady||fbSetup) window.__hideSplash?.();
  },[fbReady,fbSetup]);

  // ─── Restore session on refresh (after users loaded) ───
  useEffect(()=>{
    if(!fbReady||!users.length) return;
    const saved=sessionStorage.getItem("je_session");
    if(!saved) return;
    // Don't restore if already logged in
    if(user) return;
    try{
      const s=JSON.parse(saved);
      if(!s.userId||!s.biz||!s.screen) return;
      if(Date.now()-s.t > SESSION_TTL){sessionStorage.removeItem("je_session");return;}
      const u=users.find(x=>x.id===s.userId&&x.active);
      if(!u){sessionStorage.removeItem("je_session");return;}
      setUser(u);setBiz(s.biz);setSessionStart(s.t);
      if(s.screen==="admin") setAdminTab(s.adminTab||"dashboard");
      // Jika refresh dilakukan saat sedang melihat preview landing page, tetap di landing
      const hash = window.location.hash.toLowerCase();
      if(s.screen==="landing" || hash==="#landing" || hash==="#katalog"){
        setScreen("landing");
      } else if(s.screen==="custom-baju" || hash==="#custom-baju" || hash==="#desain-baju"){
        setScreen("custom-baju");
      } else {
        setScreen(s.screen);
      }
    }catch{sessionStorage.removeItem("je_session");}
  },[fbReady,users]);

  // ─── Toast ───
  const [notif,setNotif]=useState(null);
  const nRef=useRef(null);
  const toast=useCallback((msg,type="ok")=>{
    if(nRef.current) clearTimeout(nRef.current);
    setNotif({msg,type});nRef.current=setTimeout(()=>setNotif(null),3000);
  },[]);
  // ─── Auth & Navigation ───
  const [screen,setScreen]=useState(()=>{
    const hash = window.location.hash.toLowerCase();
    if(hash==="#login") return "login";
    if(hash==="#custom-baju"||hash==="#desain-baju"||hash==="#custom") return "custom-baju";
    if(hash==="#katalog"||hash==="#landing"||hash==="") return "landing";
    return "landing";
  });
  const [user,setUser]=useState(null);
  const [biz,setBiz]=useState(null);
  const [pending,setPending]=useState(null);
  const [faceReg,setFaceReg]=useState(null);
  const [sessionStart,setSessionStart]=useState(null);

  // Sync window hash when screen changes & listen to hash navigation
  useEffect(()=>{
    if(screen==="landing") {
      if(window.location.hash!=="#katalog"&&window.location.hash!=="#landing") window.location.hash="landing";
    } else if(screen==="login") {
      window.location.hash="login";
    } else if(screen==="custom-baju") {
      window.location.hash="custom-baju";
    }
  },[screen]);

  useEffect(()=>{
    const handleHash=()=>{
      const h=window.location.hash.toLowerCase();
      if(h==="#landing"||h==="#katalog") {
        setScreen("landing");
      } else if(h==="#custom-baju"||h==="#desain-baju"||h==="#custom") {
        setScreen("custom-baju");
      } else if(h==="#login") {
        if(!user) {
          setScreen("login");
        } else {
          setScreen(user.role==="admin"?"admin":(user.role==="kasir"?"kasir":"stok"));
        }
      }
    };
    window.addEventListener("hashchange", handleHash);
    return()=>window.removeEventListener("hashchange", handleHash);
  },[user]);
  // Session timeout
  useEffect(()=>{
    if(!user||!sessionStart) return;
    const t=setTimeout(()=>{toast("⏰ Sesi berakhir, silakan login kembali","warn");doLogout();},SESSION_TTL);
    return()=>clearTimeout(t);
  },[user,sessionStart]);
  // ─── Remember Me ───
  const [rememberMe,setRememberMe]=useState(()=>!!localStorage.getItem("je_remember"));
  const [lf,setLf]=useState(()=>{
    try{const s=JSON.parse(localStorage.getItem("je_remember")||"null");if(s) return{u:s.u||"",p:s.p||""};}catch{}
    return{u:"",p:""};
  });
  const [lerr,setLerr]=useState("");
  // ─── Attendance ───
  const todayAtt=(uid,b)=>attend.find(a=>a.userId===uid&&a.date===todayDate()&&a.business===(b||biz));
  const hasCheckedIn=user?!!todayAtt(user.id,biz)&&!todayAtt(user.id,biz)?.checkOut:false;
  const lowStockCount=prods.filter(p=>p.stock<10).length;
  // Expire: produk expire dalam 6 bulan ke depan
  const expireWarningDays=180;
  const nearExpiry=(()=>{
    const now=new Date(); const cutoff=new Date(now);
    cutoff.setDate(cutoff.getDate()+expireWarningDays);
    return prods.filter(p=>{
      if(!p.expireDate) return false;
      const exp=new Date(p.expireDate);
      return exp>=now && exp<=cutoff;
    }).sort((a,b)=>new Date(a.expireDate)-new Date(b.expireDate));
  })();
  const expiredProds=prods.filter(p=>p.expireDate&&new Date(p.expireDate)<new Date());
  const [showExpirePopup,setShowExpirePopup]=useState(false);
  const doCheckIn=async(u,b)=>{
    // Prevent duplicate: check local state first
    const existing=attend.find(a=>a.userId===u.id&&a.date===todayDate()&&a.business===b);
    if(existing) return;
    // Also prevent rapid double-calls with a flag
    const lockKey=`chkin_${u.id}_${b}_${todayISO8601()}`;
    if(sessionStorage.getItem(lockKey)) return;
    sessionStorage.setItem(lockKey,"1");
    const isoNow=new Date().toISOString();
    const rec={id:"ATT-"+uid(),userId:u.id,username:u.username,name:u.name,
      role:u.role,business:b,date:todayDate(),dateISO:todayISO8601(),
      checkIn:nowStr(),checkInISO:isoNow,checkOut:null,checkOutISO:null};
    // fbCheckIn also does server-side duplicate check
    const result=await fbCheckIn(rec).catch(()=>null);
    if(result!==null) toast(`🕐 Absen masuk tercatat — ${u.name}`,"info");
  };
  const doCheckOut=async()=>{
    let did=false;
    for(const b of (user?.role==="kasir"?user.access:[biz])){
      const rec=todayAtt(user?.id,b);
      if(rec&&!rec.checkOut){await fbCheckOut(rec.id,nowStr()).catch(()=>{});did=true;}
    }
    if(did) toast("✅ Absen pulang tercatat!");
  };
  // ─── Login ───
  const doLogin=async()=>{
    const u=users.find(x=>x.username===lf.u&&x.active);
    if(!u){setLerr("Username tidak ditemukan atau akun nonaktif.");return;}
    // verify password (support hashed + legacy)
    const ok=await verifyPassword(lf.p, u.passwordHash||u.password);
    if(!ok){setLerr("Password salah.");return;}
    setLerr("");
    if(rememberMe) localStorage.setItem("je_remember",JSON.stringify({u:lf.u,p:lf.p}));
    else localStorage.removeItem("je_remember");
    setSessionStart(Date.now());
    if(u.role==="admin"){
      setUser(u);setBiz(u.access[0]);setAdminTab("dashboard");setScreen("admin");
      sessionStorage.setItem("je_session",JSON.stringify({userId:u.id,biz:u.access[0],screen:"admin",t:Date.now()}));
    }
    else{setPending(u);setScreen("facescan");}
  };
  const afterFace=async(u)=>{
    setUser(u);setPending(null);
    if(u.role==="kasir"||u.access.length===1){
      const b=u.access[0];setBiz(b);
      for(const x of (u.role==="kasir"?u.access:[b])) await doCheckIn(u,x);
      const sc=u.role==="kasir"?"kasir":"stok";
      setScreen(sc);
      sessionStorage.setItem("je_session",JSON.stringify({userId:u.id,biz:b,screen:sc,t:Date.now()}));
    } else setScreen("bizselect");
  };
  const doLogout=()=>{
    setUser(null);setBiz(null);setScreen("login");setSessionStart(null);
    setCart([]);setScanIn("");setStokTarget(null);setReceipt(null);setReceiptQueue([]);setKasirTab("kasir");setCartOpen(false);
    sessionStorage.removeItem("je_session");
  };
  const handlePulang=async()=>{await doCheckOut();setTimeout(doLogout,1500);};

  // ─── Kasir state ───
  const [cart,setCart]=useState([]);
  const [scanIn,setScanIn]=useState("");
  const [receipt,setReceipt]=useState(null);
  const [receiptQueue,setReceiptQueue]=useState([]);
  const [showStock,setShowStock]=useState(false);
  const [showLowStock,setShowLowStock]=useState(false);
  const [showKasirStok,setShowKasirStok]=useState(false);
  const [kasirStokSearch,setKasirStokSearch]=useState("");
  const [addonPrompt,setAddonPrompt]=useState(null); // {mainItem, addons:[]}
  const [discount,setDiscount]=useState({type:"pct",value:""});
  const [payMethod,setPayMethod]=useState("Tunai");
  const [namaPembeli,setNamaPembeli]=useState("");
  const [showCheckout,setShowCheckout]=useState(false);
  const [checkingOut,setCheckingOut]=useState(false);
  const checkoutLockRef=useRef(false);
  const scanRef=useRef(null);
  const [kasirTab,setKasirTab]=useState("kasir");
  const [catBiz,setCatBiz]=useState("ALL");
  const [catCat,setCatCat]=useState("ALL");
  const [cartOpen,setCartOpen]=useState(false);
  const [histRange,setHistRange]=useState("today");
  const [histQ,setHistQ]=useState("");
  useEffect(()=>{if(screen==="kasir"&&kasirTab==="kasir"&&!receipt&&!showCheckout&&window.innerWidth>640)setTimeout(()=>scanRef.current?.focus(),100);},[screen,kasirTab,receipt,showCheckout]);
  // ─── Stok state ───
  const [stokScan,setStokScan]=useState("");
  const [stokQ,setStokQ]=useState("");
  const [quickAdj,setQuickAdj]=useState({}); // {productId: delta}
  const [stokPrice,setStokPrice]=useState("");
  const [stokTarget,setStokTarget]=useState(null);
  const [stokSearch,setStokSearch]=useState("");
  const [showOpnamePanel,setShowOpnamePanel]=useState(false);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [newPForm, setNewPForm] = useState({ barcode: "", name: "", category: "Umum", price: "", stock: "" });
  const stokScanRef=useRef(null),stokQRef=useRef(null);
  useEffect(()=>{if(screen==="stok")setTimeout(()=>stokScanRef.current?.focus(),100);},[screen]);
  useEffect(()=>{if(stokTarget)setTimeout(()=>stokQRef.current?.focus(),100);},[stokTarget]);
  // ─── Admin state ───
  const [adminTab,setAdminTab]=useState("dashboard");
  const [adminScanQ,setAdminScanQ]=useState("");
  const [adminBiz,setAdminBiz]=useState("JS_CLOTHING");
  const [searchQ,setSearchQ]=useState("");
  const [filterAdvertised,setFilterAdvertised]=useState(false);
  const [showMoreDrawer,setShowMoreDrawer]=useState(false);
  const [reportBiz,setReportBiz]=useState("ALL");
  const [reportRange,setReportRange]=useState("month");
  const [reportKasir,setReportKasir]=useState("ALL");
  const [reportCategory,setReportCategory]=useState("ALL");
  const [searchInvoice,setSearchInvoice]=useState("");
  const [showDetailPenjualan,setShowDetailPenjualan]=useState(false);
  const [expandedTrx,setExpandedTrx]=useState({}); // {trxId: true}
  const [lapFrom,setLapFrom]=useState("");
  const [lapTo,setLapTo]=useState("");
  const [lowStockPage,setLowStockPage]=useState(1);
  const [lowStockPer,setLowStockPer]=useState(()=>Number(localStorage.getItem("je_lowstock_per"))||5);
    const [gsLoad,setGsLoad]=useState(false);
  const [copyDone,setCopyDone]=useState(false);
  const [uModal,setUModal]=useState(false);
  const [uForm,setUForm]=useState({});
  const [editUid,setEditUid]=useState(null);
  const [pModal,setPModal]=useState(false);
  const [invTrx,setInvTrx]=useState(null);
  const [expenses,setExpenses]=useState([]);
  const [expenseModal,setExpenseModal]=useState(false);
  const [expBiz,setExpBiz]=useState("ALL");
  const [expRange,setExpRange]=useState("month");
  const [expCat,setExpCat]=useState("ALL");
  const [expQ,setExpQ]=useState("");
  const [expFrom,setExpFrom]=useState("");
  const [expTo,setExpTo]=useState("");
  const [plBiz,setPlBiz]=useState("ALL");
  const [plRange,setPlRange]=useState("month");
  const [plFrom,setPlFrom]=useState("");
  const [plTo,setPlTo]=useState("");
  const [qrisOpen,setQrisOpen]=useState(false);
  const [pForm,setPForm]=useState({});
  const [editPid,setEditPid]=useState(null);
  const [showPriceDrawer,setShowPriceDrawer]=useState(false);
  const [inlineAddMode,setInlineAddMode]=useState(false); // "add" = form tambah di atas
  const [importModal,setImportModal]=useState(false);
  const [importRows,setImportRows]=useState([]);
  const [importErr,setImportErr]=useState("");
  const [importLoading,setImportLoading]=useState(false);
  const importFileRef=useRef(null);
  const [cpwdModal,setCpwdModal]=useState(null); // userId
  const [cpwdForm,setCpwdForm]=useState({old:"",n1:"",n2:""});
  const [targetModal,setTargetModal]=useState(false);
  const [targetForm,setTargetForm]=useState({business:"JS_CLOTHING",period:"",amount:""});
  const [selUser,setSelUser]=useState("ALL");
  const [attRange,setAttRange]=useState("month");
  const [attFrom,setAttFrom]=useState("");
  const [attTo,setAttTo]=useState("");
  const [slogRange,setSlogRange]=useState("all");
  const [slogBiz,setSlogBiz]=useState("ALL");
  const [slogFrom,setSlogFrom]=useState("");
  const [slogTo,setSlogTo]=useState("");
  const [slogType,setSlogType]=useState("ALL");
  // ─── Opname UI state ───
  const [opnameTab, setOpnameTab] = useState("opname");
  const [opnameBiz, setOpnameBiz] = useState(null);
  const [showCreateOpname, setShowCreateOpname] = useState(false);
  const [showImportOpname, setShowImportOpname] = useState(false);
  const [importOpnameRows, setImportOpnameRows] = useState([]);

  // ─── Helpers ───
  const bizProds=(b=biz)=>prods.filter(p=>p.business===b);
  const kasirProds=()=>prods.filter(p=>user?.access?.includes(p.business));
  const parseD=str=>{
    try{
      if(!str||typeof str!=="string") return null;
      // id-ID locale: "10/4/2026, 14.30.00" or "10/4/2026 14.30.00" or "10/04/2026, 14.30.00"
      const m=str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if(m){
        const d=new Date(`${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`);
        if(!isNaN(d.getTime())) return d;
      }
      // Try ISO or other formats
      const d2=new Date(str);
      return isNaN(d2.getTime())?null:d2;
    }catch{return null;}
  };
  const calcDur=a=>{
    // Prefer ISO strings, fallback parse locale string
    const ci=a.checkInISO||a.checkIn;
    const co=a.checkOutISO||a.checkOut;
    if(!ci||!co) return "-";
    try{
      const parseDate=(s)=>{
        if(!s) return null;
        // Try ISO first
        const d=new Date(s);
        if(!isNaN(d.getTime())) return d;
        // Try locale "13/3/2026, 23.12.11" → convert dots to colons in time part
        const fixed=s.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s*(\d{2})\.(\d{2})\.(\d{2})/,'$3-$2-$1T$4:$5:$6');
        const d2=new Date(fixed);
        return isNaN(d2.getTime())?null:d2;
      };
      const start=parseDate(ci),end=parseDate(co);
      if(!start||!end) return "-";
      const ms=end-start;
      if(ms<0) return "-";
      const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000);
      return h>0?`${h}j ${m}m`:`${m}m`;
    }catch{return "-";}
  };

  // ─── Kasir functions ───
  const addToCart=(p,qty=1)=>{
    setCart(prev=>{
      const ex=prev.find(c=>c.barcode===p.barcode);
      if(ex){
        if(ex.qty>=p.stock){toast("Stok tidak cukup","warn");return prev;}
        return prev.map(c=>c.barcode===p.barcode?{...c,qty:c.qty+qty}:c);
      }
      return [...prev,{id:p.id,barcode:p.barcode,name:p.name,price:p.price,hpp:p.hpp||0,stock:p.stock,qty,business:p.business}];
    });
  };
  const kasirAdd=useCallback((p)=>{
    if(p.stock===0){toast("Stok "+p.name+" habis!","warn");return;}
    const availableAddons=(p.addons||[]).map(id=>prods.find(x=>x.id===id&&x.business===p.business&&x.stock>0)).filter(Boolean);
    addToCart(p);
    if(availableAddons.length>0) setAddonPrompt({mainItem:p,addons:availableAddons});
  },[prods,toast]);
  const kasirScan=useCallback(async(bc)=>{
    bc=bc.trim();if(!bc) return;
    const ok=x=>user?.access?.includes(x.business);
    const p=prods.find(x=>x.barcode===bc&&ok(x)) || prods.find(x=>x.name.toLowerCase().includes(bc.toLowerCase())&&ok(x));
    if(!p){toast("Produk tidak ditemukan: "+bc,"err");setScanIn("");return;}
    if(p.stock===0){toast("Stok "+p.name+" habis!","warn");setScanIn("");return;}
    // Check if this product has add-ons configured
    const addonIds=p.addons||[];
    const availableAddons=addonIds.map(id=>prods.find(x=>x.id===id&&x.business===p.business&&x.stock>0)).filter(Boolean);
    addToCart(p);
    setScanIn("");
    if(availableAddons.length>0){
      setAddonPrompt({mainItem:p,addons:availableAddons});
    } else {
      toast("✓ "+p.name);
      scanRef.current?.focus();
    }
  },[prods,user,toast]);

  const calcDiscount=(subtotal)=>{
    if(!discount.value||+discount.value<=0) return 0;
    if(discount.type==="pct") return Math.floor(subtotal*(+discount.value/100));
    return Math.min(+discount.value,subtotal);
  };

  const doCheckout=useCallback(async()=>{
    if(!cart.length||checkoutLockRef.current) return;
    checkoutLockRef.current = true;
    setCheckingOut(true);

    const subtotal=cart.reduce((s,c)=>s+c.price*c.qty,0);
    const discAll=calcDiscount(subtotal);
    // Satu keranjang bisa berisi dua bisnis: transaksi dipecah per bisnis agar laporan & stok tetap terpisah.
    const groups={};
    cart.forEach(c=>{const b=c.business||biz;(groups[b]=groups[b]||[]).push(c);});
    const ids=Object.keys(groups);
    let discLeft=discAll;const made=[];
    try{
      for(let i=0;i<ids.length;i++){
        const b=ids[i],items=groups[b];
        const sub=items.reduce((s,c)=>s+c.price*c.qty,0);
        const disc=i===ids.length-1?discLeft:Math.min(sub,Math.round(discAll*sub/subtotal));
        discLeft-=disc;
        const total=sub-disc;
        const totalHpp=items.reduce((s,c)=>s+(c.hpp||0)*c.qty,0);

        // Idempotency: deterministically hash cart signature for session & use dedicated unique transaction token
        const idemToken = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
        const trxId = "TRX-" + idemToken;
        const trx={
          id:trxId,
          idempotencyKey: `IDEM-${user.id}-${b}-${idemToken}`,
          date:nowStr(),kasir:user.name,kasirId:user.id,business:b,
          namaPembeli:namaPembeli.trim()||"Umum",
          items:items.map(c=>({...c})),subtotal:sub,discount:disc,total,totalHpp,profit:total-totalHpp,payment:payMethod,returned:false};
        const stockUpdates=items.map(c=>({productId:c.id,newStock:c.stock-c.qty}));
        const logs=items.map(c=>({id:"LOG-"+uid(),date:nowStr(),barcode:c.barcode,name:c.name,
          type:"keluar",qty:c.qty,before:c.stock,after:c.stock-c.qty,by:user.name,business:b}));
        await fbAddTransaction(trx,stockUpdates,logs);
        made.push(trx);
      }
      setCart([]);setDiscount({type:"pct",value:""});setPayMethod("Tunai");setNamaPembeli("");
      setShowCheckout(false);setReceipt(made[0]);setReceiptQueue(made.slice(1));
      toast("✅ Transaksi berhasil! "+rp(subtotal-discAll)+(made.length>1?` · ${made.length} struk`:""));
    }catch(e){
      if(made.length) setCart(prev=>prev.filter(c=>!made.some(t=>t.items.some(i=>i.barcode===c.barcode))));
      toast("Gagal: "+e.message,"err");
    }finally{
      checkoutLockRef.current = false;
      setCheckingOut(false);
    }
  },[cart,user,biz,discount,payMethod,namaPembeli,toast]);

  // ─── Stok functions ───
 const stokScanFn=useCallback((bc)=>{
    bc=bc.trim();if(!bc) return;
    const p = prods.find(x => x.barcode === bc && x.business === biz) || 
              prods.find(x => x.name.toLowerCase().includes(bc.toLowerCase()) && x.business === biz);
    
    if (!p) {
      // Jika tidak ditemukan, buka form produk baru
      setNewPForm({ barcode: bc, name: "", category: "Umum", price: "", stock: "" });
      setIsNewProduct(true);
      setStokTarget(null);
      setStokScan("");
      return;
    }
    setStokTarget(p);
    setIsNewProduct(false);
    setStokQ("");
    setStokPrice("");
    setStokScan("");
  },[prods,biz]);

  const doAddStock=useCallback(async()=>{
    const q=parseInt(stokQ);
    if(!stokTarget||!q||q<=0){toast("Masukkan jumlah valid","warn");return;}
    const ns=stokTarget.stock+q;
    const log={id:"LOG-"+uid(),date:nowStr(),barcode:stokTarget.barcode,name:stokTarget.name,
      type:"masuk",qty:q,before:stokTarget.stock,after:ns,by:user.name,business:biz};
    try{
      const np=stokPrice&&+stokPrice>0?+stokPrice:undefined;
      await fbUpdateStock(stokTarget.id,ns,np,log,user.name);
      toast(`✓ Stok ${stokTarget.name}: ${stokTarget.stock} → ${ns}`);
    }catch(e){toast("Gagal: "+e.message,"err");}
    setStokTarget(null);setStokQ("");setStokPrice("");stokScanRef.current?.focus();
  },[stokTarget,stokQ,stokPrice,user,biz,toast]);

  const saveNewProduct = async () => {
    if (!newPForm.barcode || !newPForm.name || !newPForm.price || !newPForm.stock) {
      toast("Semua data produk baru wajib diisi", "warn");
      return;
    }
    try {
      const prod = {
        ...newPForm,
        id: Date.now(), // Generate ID unik
        price: +newPForm.price,
        stock: +newPForm.stock,
        hpp: 0, 
        business: biz
      };
      await fbAddProduct(prod, user.name);
      
      // Log stok awal
      const log = {
        id: "LOG-" + uid(), date: nowStr(), barcode: prod.barcode, name: prod.name,
        type: "masuk", qty: prod.stock, before: 0, after: prod.stock, by: user.name, business: biz
      };
      await fbLogActivity(user.name, "Tambah Produk Baru", `Mendaftarkan ${prod.name}`, biz);
      
      toast("✅ Produk baru berhasil didaftarkan!");
      setIsNewProduct(false);
      setStokScan("");
      stokScanRef.current?.focus();
    } catch (e) {
      toast("Gagal: " + e.message, "err");
    }
  };

  // ─── Quick Stock Adjust ───
  const doQuickAdj=useCallback(async(prod, delta)=>{
    const newStock = prod.stock + delta;
    if(newStock < 0){toast("Stok tidak bisa kurang dari 0","warn");return;}
    const log={id:"LOG-"+uid(),date:nowStr(),barcode:prod.barcode,name:prod.name,
      type:delta>0?"masuk":"keluar",qty:Math.abs(delta),
      before:prod.stock,after:newStock,by:user.name,business:prod.business};
    try{
      await fbUpdateStock(prod.id,newStock,undefined,log,user.name);
      toast(`${delta>0?"↑":"↓"} ${prod.name}: ${prod.stock} → ${newStock}`,"ok");
    }catch(e){toast("Gagal: "+e.message,"err");}
  },[user,toast]);

  // ─── Admin: User CRUD ───
  const openAddU=()=>{setUForm({username:"",password:"",name:"",role:"kasir",access:[],avatar:"🧑",active:true});setEditUid(null);setUModal(true);};
  const openEditU=u=>{setUForm({...u,access:[...u.access]});setEditUid(u.id);setUModal(true);};
  const saveUser=async()=>{
    if(!uForm.username||!uForm.password||!uForm.name){toast("Username, password & nama wajib","warn");return;}
    if(!uForm.access?.length){toast("Pilih minimal 1 akses bisnis","warn");return;}
    try{
      if(editUid===null){
        if(users.find(u=>u.username===uForm.username)){toast("Username sudah dipakai!","err");return;}
        await fbAddUser({...uForm,id:NEXT_ID++,faceDescriptor:null},user.name);toast("✓ Pengguna ditambahkan");
      }else{await fbUpdateUser(editUid,{...uForm,id:editUid},user.name);toast("✓ Pengguna diperbarui");}
      setUModal(false);
    }catch(e){toast("Error: "+e.message,"err");}
  };
  const delUser=async(u)=>{
    if(u.id===user.id){toast("Tidak bisa hapus akun sendiri","err");return;}
    await fbDeleteUser(u.id,u.name,user.name).catch(()=>{});toast("Pengguna dihapus");
  };
  const doChangePassword = async () => {
    if (!cpwdForm.n1 || !cpwdForm.n2) {
      toast("Password baru wajib diisi", "warn");
      return;
    }
    if (cpwdForm.n1 !== cpwdForm.n2) {
      toast("Konfirmasi password tidak cocok", "warn");
      return;
    }

    const targetUser = users.find(u => u.id === cpwdModal);
    if (!targetUser) return;

    // Jika bukan admin, wajib verifikasi password lama
    if (user.role !== "admin") {
      if (!cpwdForm.old) {
        toast("Password lama wajib diisi", "warn");
        return;
      }
      const ok = await verifyPassword(cpwdForm.old, targetUser.passwordHash || targetUser.password);
      if (!ok) {
        toast("Password lama salah", "err");
        return;
      }
    }

    try {
      await fbChangePassword(cpwdModal, cpwdForm.n1, user.name);
      setCpwdModal(null);
      setCpwdForm({ old: "", n1: "", n2: "" });
      toast("✅ Password berhasil diubah");
    } catch (e) {
      toast("Gagal mengubah password: " + e.message, "err");
    }
  };

  // ─── Admin: Product CRUD ───
  const openAddP=()=>{
    setPForm({barcode:"",name:"",price:"",hpp:"",stock:"",category:"",business:adminBiz,expireDate:"",advertised:false,photo:""});
    setEditPid(null);setPModal(true);setInlineAddMode(true);setShowPriceDrawer(false);
    // scroll to top of products section
    setTimeout(()=>document.getElementById("prod-form-anchor")?.scrollIntoView({behavior:"smooth",block:"start"}),50);
  };
  const openEditP=p=>{
    if(!p||!p.id) return;
    // If same product clicked again → close
    if(editPid===p.id&&pModal){setPModal(false);setEditPid(null);setInlineAddMode(false);return;}
    setPForm({...p,price:String(p.price||0),hpp:String(p.hpp||0),stock:String(p.stock??0),expireDate:p.expireDate||"",advertised:!!p.advertised,addons:Array.isArray(p.addons)?p.addons.filter(Boolean):[]});
    setEditPid(p.id);setPModal(true);setInlineAddMode(false);
    // Show price drawer only if price/hpp already exist
    setShowPriceDrawer(!!(p.price||p.hpp));
    setTimeout(()=>document.getElementById("prod-inline-"+p.id)?.scrollIntoView({behavior:"smooth",block:"nearest"}),80);
  };
  // ─── Import Produk (XLSX/CSV) ───
  const normalizeKey=k=>k.toLowerCase().replace(/[^a-z0-9]/g,"");
  const parseImportRows=(raw)=>{
    return raw.map(r=>{
      const n={};
      Object.keys(r).forEach(k=>n[normalizeKey(k)]=String(r[k]||"").trim());
      // map common column names
      const get=(...keys)=>{for(const k of keys){if(n[k]!==undefined) return n[k];}return "";};
      // Parse tanggal expire — YYYY-MM-DD, DD/MM/YYYY, atau Excel serial
      const rawExp=get("expiredate","expire","tanggalexpire","kadaluarsa","exp","tglexpire","tanggalkadaluarsa");
      let expireDate="";
      if(rawExp){
        if(/^\d{4}-\d{2}-\d{2}$/.test(rawExp)){
          expireDate=rawExp;
        } else if(/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(rawExp)){
          const[dd,mm,yyyy]=rawExp.split("/");
          expireDate=`${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
        } else if(!isNaN(Number(rawExp))&&Number(rawExp)>40000){
          // Excel serial date
          const d=new Date(Date.UTC(1899,11,30)+Math.round(Number(rawExp))*86400000);
          expireDate=d.toISOString().slice(0,10);
        }
      }
      return {
        barcode: get("barcode","kodebarcode","kode","sku"),
        name:    get("name","nama","namaproduk","produk","namabarang"),
        category:get("category","kategori","cat"),
        price:   get("price","harga","hargajual","jual"),
        hpp:     get("hpp","modal","hargabeli","cost","cogs","hargapokok"),
        stock:   get("stock","stok","qty","jumlah","quantity"),
        business:get("business","bisnis"),
        expireDate,
        _ok: true,
      };
    }).filter(r=>r.barcode&&r.name);
  };
  const handleImportFile=async(file)=>{
    if(!file) return;
    setImportErr("");setImportRows([]);
    const ext=file.name.split(".").pop().toLowerCase();
    try{
      if(ext==="csv"){
        const text=await file.text();
        const lines=text.split(/\r?\n/).filter(l=>l.trim());
        if(lines.length<2){setImportErr("File CSV kosong atau tidak ada data");return;}
        const headers=lines[0].split(/[,;\t]/);
        const rows=lines.slice(1).map(line=>{
          const vals=line.split(/[,;\t]/);
          const obj={};
          headers.forEach((h,i)=>obj[h.trim()]=(vals[i]||"").trim().replace(/^["']|["']$/g,""));
          return obj;
        }).filter(r=>Object.values(r).some(v=>v));
        const parsed=parseImportRows(rows);
        if(!parsed.length){setImportErr("Tidak ada baris valid. Pastikan kolom Barcode dan Nama ada.");return;}
        setImportRows(parsed);
      } else if(ext==="xlsx"||ext==="xls"){
        const XLSX=await loadSheetJS();
        const buf=await file.arrayBuffer();
        const wb=XLSX.read(buf,{type:"array"});
        const ws=wb.Sheets[wb.SheetNames[0]];
        const raw=XLSX.utils.sheet_to_json(ws,{defval:""});
        if(!raw.length){setImportErr("Sheet kosong");return;}
        const parsed=parseImportRows(raw);
        if(!parsed.length){setImportErr("Tidak ada baris valid. Pastikan kolom Barcode dan Nama ada.");return;}
        setImportRows(parsed);
      } else {
        setImportErr("Format tidak didukung. Gunakan .xlsx atau .csv");
      }
    }catch(e){setImportErr("Gagal baca file: "+e.message);}
  };
  const doImportProducts=async()=>{
    if(!importRows.length) return;
    setImportLoading(true);
    let ok=0,skip=0,err=0;
    for(const row of importRows){
      try{
        // Determine business
        let biz=adminBiz;
        if(row.business){
          const bl=row.business.toLowerCase();
          if(bl.includes("jb")||bl.includes("skincare")||bl.includes("store")) biz="JB_STORE";
          else if(bl.includes("js")||bl.includes("cloth")||bl.includes("konveksi")) biz="JS_CLOTHING";
        }
        // Check duplicate barcode
        const existing=prods.find(p=>p.barcode===row.barcode&&p.business===biz);
        if(existing){skip++;continue;}
        const prod={
          id:NEXT_ID++, barcode:row.barcode, name:row.name,
          category:row.category||"Umum", business:biz,
          price:Math.round(+row.price||0), hpp:Math.round(+row.hpp||0),
          stock:Math.round(+row.stock||0),
          expireDate:row.expireDate||null,
        };
        await fbAddProduct(prod,user.name);
        ok++;
      }catch{err++;}
    }
    setImportLoading(false);
    setImportModal(false);setImportRows([]);
    toast(`✅ Import selesai: ${ok} ditambah, ${skip} duplikat dilewati${err?", "+err+" error":""}`,ok>0?"ok":"warn");
  };

  const saveProd=async()=>{
    if(!pForm.barcode||!pForm.name||!pForm.price||pForm.stock===""){toast("Barcode, nama, harga & stok wajib","warn");return;}
    try{
      if(editPid===null){
        if(prods.find(p=>p.barcode===pForm.barcode)){toast("Barcode sudah ada!","err");return;}
        await fbAddProduct({...pForm,id:NEXT_ID++,price:+pForm.price,hpp:+pForm.hpp||0,stock:+pForm.stock,expireDate:pForm.expireDate||null,advertised:!!pForm.advertised},user.name);
        toast("✓ Produk ditambahkan");
      }else{
        await fbUpdateProduct(editPid,{...pForm,id:editPid,price:+pForm.price,hpp:+pForm.hpp||0,stock:+pForm.stock,expireDate:pForm.expireDate||null,advertised:!!pForm.advertised},user.name);
        toast("✓ Produk diperbarui");
      }
      setPModal(false);
    }catch(e){toast("Error: "+e.message,"err");}
  };

  // ─── Retur ───
  const doRetur=async(trx)=>{
    if(trx.returned){toast("Transaksi ini sudah pernah diretur","warn");return;}
    const ret={id:"RET-"+uid().toUpperCase(),date:nowStr(),kasir:user.name,business:trx.business,
      originalTrxId:trx.id,items:trx.items,total:trx.total,reason:"Retur oleh "+user.name};
    const stockUpdates=trx.items.map(c=>{
      const p=prods.find(x=>x.barcode===c.barcode);
      return{productId:c.id,newStock:(p?.stock||0)+c.qty};
    });
    const logs=trx.items.map(c=>({id:"LOG-"+uid(),date:nowStr(),barcode:c.barcode,name:c.name,
      type:"masuk",qty:c.qty,before:prods.find(x=>x.barcode===c.barcode)?.stock||0,
      after:(prods.find(x=>x.barcode===c.barcode)?.stock||0)+c.qty,by:user.name,business:trx.business}));
    try{
      await fbAddReturn(ret,stockUpdates,logs);
      toast("✅ Retur berhasil, stok dikembalikan");
    }catch(e){toast("Gagal retur: "+e.message,"err");}
  };

  // ─── Face registration ───
  const handleFaceReg=async(desc)=>{
    if(!faceReg) return;
    const u=users.find(x=>x.id===faceReg);if(!u) return;
    await fbUpdateUser(u.id,{...u,faceDescriptor:Array.from(desc)},user?.name);
    setFaceReg(null);toast("✅ Data wajah terdaftar!");
  };

  // ─── Laporan calculations ───
  const getDateFilter=(rows,dateKey="date")=>{
    const now=new Date();
    return rows.filter(t=>{
      const d=parseD(t[dateKey]);
      // If date can't be parsed: show in "all" only
      if(!d||isNaN(d.getTime())) return reportRange==="all";
      if(reportRange==="today") return d.toDateString()===now.toDateString();
      if(reportRange==="week"){const w=new Date(now);w.setDate(w.getDate()-7);return d>=w&&d<=now;}
      if(reportRange==="month") return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
      if(reportRange==="custom"){
        const from=lapFrom?new Date(lapFrom):null;
        const to=lapTo?new Date(lapTo+"T23:59:59"):null;
        if(from&&d<from) return false;
        if(to&&d>to) return false;
        return true;
      }
      return true;
    });
  };
  // Collect all categories from products (not from transactions — categories live on products)
  const allCategories=[...new Set(prods.map(p=>p.category).filter(Boolean))].sort();
  const filtTrx=getDateFilter(
    trxs.filter(t=>{
      if(reportBiz!=="ALL"&&t.business!==reportBiz) return false;
      if(reportKasir!=="ALL"&&String(t.kasirId)!==reportKasir) return false;
      if(reportCategory!=="ALL"){
        // keep trx only if it has at least one item in selected category
        const hasCategory=(t.items||[]).some(item=>{
          const prod=prods.find(p=>p.barcode===item.barcode);
          return prod?.category===reportCategory;
        });
        if(!hasCategory) return false;
      }
      return true;
    })
  );
  const totalRev=filtTrx.reduce((s,t)=>s+t.total,0);
  const totalHppAll=filtTrx.reduce((s,t)=>s+(t.totalHpp||0),0);
  const grossProfit=totalRev-totalHppAll;
  const margin=totalRev>0?((grossProfit/totalRev)*100).toFixed(1)+"%":"0%";
  const dailyMap={};
  filtTrx.forEach(t=>{
    try{
      const d=parseD(t.date);if(!d) return;
      const key=d.toLocaleDateString("id-ID",{day:"2-digit",month:"2-digit"});
      if(!dailyMap[key])dailyMap[key]={date:key,rev:0,profit:0,trxCount:0};
      dailyMap[key].rev+=t.total;dailyMap[key].profit+=(t.profit||0);dailyMap[key].trxCount++;
    }catch{}
  });
  const dailyData=Object.values(dailyMap).slice(-20);
  const prodPerf=(()=>{
    const m={};
    filtTrx.forEach(t=>t.items?.forEach(item=>{
      if(!m[item.barcode])m[item.barcode]={name:item.name,barcode:item.barcode,qty:0,rev:0,hpp:0};
      m[item.barcode].qty+=item.qty;m[item.barcode].rev+=item.price*item.qty;m[item.barcode].hpp+=(item.hpp||0)*item.qty;
    }));
    return Object.values(m).sort((a,b)=>b.rev-a.rev);
  })();
  const kasirPerf=(()=>{
    const m={};
    filtTrx.forEach(t=>{
      const k=t.kasirId||t.kasir;
      if(!m[k])m[k]={kasirId:t.kasirId,kasir:t.kasir,trxCount:0,total:0,profit:0};
      m[k].trxCount++;m[k].total+=t.total;m[k].profit+=(t.profit||0);
    });
    return Object.values(m).sort((a,b)=>b.total-a.total);
  })();
  const totalDisc=filtTrx.reduce((s,t)=>s+(t.discount||0),0);
  const bizRevData=[
    {name:"JS Clothing",value:filtTrx.filter(t=>t.business==="JS_CLOTHING").reduce((s,t)=>s+t.total,0),color:"#38bdf8"},
    {name:"JB Store",value:filtTrx.filter(t=>t.business==="JB_STORE").reduce((s,t)=>s+t.total,0),color:"#f472b6"},
  ].filter(d=>d.value>0);
  const kasirBreakdown=(()=>{
    const m={};
    filtTrx.forEach(t=>{
      const k=t.kasir||"?";
      if(!m[k])m[k]={name:k,trx:0,rev:0,profit:0,discount:0};
      m[k].trx++;m[k].rev+=t.total;m[k].profit+=(t.profit||0);m[k].discount+=(t.discount||0);
    });
    return Object.values(m).sort((a,b)=>b.rev-a.rev);
  })();

  // ─── Attendance calculations ───
  const attFiltered=(()=>{
    const now2=new Date();
    return attend.filter(a=>{
      const matchUser=selUser==="ALL"||String(a.userId)===String(selUser);
      const isoSrc=a.checkInISO||a.dateISO||"";
      const aDate=isoSrc?new Date(isoSrc):null;
      let matchRange=true;
      if(attRange==="today") matchRange=aDate?aDate.toDateString()===now2.toDateString():false;
      else if(attRange==="week"){const w=new Date(now2);w.setDate(w.getDate()-7);matchRange=aDate?aDate>=w:false;}
      else if(attRange==="month") matchRange=aDate?aDate.getFullYear()===now2.getFullYear()&&aDate.getMonth()===now2.getMonth():false;
      else if(attRange==="custom"){
        const from=attFrom?new Date(attFrom):null;
        const to=attTo?new Date(attTo+"T23:59:59"):null;
        if(from&&aDate&&aDate<from) matchRange=false;
        else if(to&&aDate&&aDate>to) matchRange=false;
      }
      return matchUser&&matchRange;
    });
  })();
  const attByUser={};
  attFiltered.forEach(a=>{
    const key=a.userId;
    if(!attByUser[key])attByUser[key]={userId:a.userId,name:a.name,role:a.role,days:0,totalMinutes:0,records:[]};
    attByUser[key].days++;attByUser[key].records.push(a);
    const ci=a.checkInISO||a.checkIn,co=a.checkOutISO||a.checkOut;
    if(ci&&co){try{attByUser[key].totalMinutes+=Math.floor((new Date(co)-new Date(ci))/60000);}catch{}}
  });

  // ─── Target calculations ───
  const currMonth=new Date().toISOString().slice(0,7);
  const monthRevByBiz={};
  trxs.filter(t=>{try{const d=parseD(t.date);return d&&d.getMonth()===new Date().getMonth()&&d.getFullYear()===new Date().getFullYear();}catch{return false;}})
    .forEach(t=>{if(!monthRevByBiz[t.business])monthRevByBiz[t.business]=0;monthRevByBiz[t.business]+=t.total;});

  // ─── Opname lintas bisnis & belanja operasional ───
  const opnamePanelEl=()=><OpnamePanel opnames={opnames} opnameItems={opnameItems} selectedOpname={selectedOpname} setSelectedOpname={setSelectedOpname}
    opnameTab={opnameTab} setOpnameTab={setOpnameTab} showCreateOpname={showCreateOpname} setShowCreateOpname={setShowCreateOpname}
    showImportOpname={showImportOpname} setShowImportOpname={setShowImportOpname}
    prods={prods} access={user?.access||[]} canFinalize={user?.role!=="kasir"} user={user} toast={toast} rp={rp}
    fbCreateOpname={fbCreateOpname} fbCloseOpname={fbCloseOpname} fbDeleteOpname={fbDeleteOpname} fbUpdateOpnameItem={fbUpdateOpnameItem}
    fbBulkUpdateOpnameItems={fbBulkUpdateOpnameItems} fbApplyOpnameAdjustments={fbApplyOpnameAdjustments}
    slogs={slogs} loadSheetJS={loadSheetJS} BIZ={BIZ} C={C} F={F}/>;
  const opnameOverlay=(onClose)=><div style={{position:"fixed",inset:0,zIndex:600,background:C.bg1,overflowY:"auto",fontFamily:F.sans,color:C.t0}}>
    <div style={{position:"sticky",top:0,zIndex:2,background:C.bg2,borderBottom:`1px solid ${C.bo0}`,padding:"calc(10px + env(safe-area-inset-top, 0px)) 14px 10px",display:"flex",alignItems:"center",gap:10}}>
      <span className="mdl-ico"><ClipboardCheck size={20}/></span>
      <div style={{flex:1,fontWeight:800,fontSize:16}}>Opname stok</div>
      <Btn size="sm" outline onClick={onClose}><X size={16}/>Tutup</Btn>
    </div>
    <div style={{padding:12,paddingBottom:"calc(24px + var(--safe-b))"}}>{opnamePanelEl()}</div>
  </div>;
  const saveExpense=async(recs,err)=>{
    if(!recs){toast(err||"Data belum lengkap","warn");return;}
    try{
      for(const r of recs) await fbAddExpense(r,user.name);
      setExpenseModal(false);
      toast("✅ Belanja dicatat: "+rp(recs.reduce((t,r)=>t+r.amount,0)));
    }catch(e){toast("Gagal: "+e.message,"err");}
  };
  const inRangeDate=(d,range,from,to)=>{
    if(!d||isNaN(d.getTime())) return range==="all";
    const now=new Date();
    if(range==="today") return d.toDateString()===now.toDateString();
    if(range==="week"){const w=new Date(now);w.setDate(w.getDate()-7);return d>=w&&d<=now;}
    if(range==="month") return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
    if(range==="lastmonth"){const lm=new Date(now.getFullYear(),now.getMonth()-1,1);return d.getMonth()===lm.getMonth()&&d.getFullYear()===lm.getFullYear();}
    if(range==="custom"){const f=from?new Date(from+"T00:00:00"):null,t=to?new Date(to+"T23:59:59"):null;if(f&&d<f)return false;if(t&&d>t)return false;return true;}
    return true;
  };
  const expDate=e=>e.dateISO?new Date(e.dateISO+"T00:00:00"):parseD(e.date);

  // ─── CSS sync ───
  CSS = makeCSS();

  // ─────────────────────────────────────────────────────────────
  //  RENDER: Loading
  // ─────────────────────────────────────────────────────────────
  // Update banner — tampil di semua layar
  const UpdateBannerEl = updateReady
    ? <UpdateBanner onUpdate={()=>{ window.__applyUpdate?.(); }}/>
    : null;

  if(fbLoad) return <div style={{fontFamily:F.sans,background:C.bg1,color:C.t0,height:"100vh",
    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
    <style>{CSS}</style>
    <div style={{width:40,height:40,border:`2.5px solid ${C.bg4}`,borderTopColor:C.g,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
    <div style={{textAlign:"center"}}>
      <div className="mn" style={{fontSize:15,fontWeight:700,letterSpacing:2,
        background:`${C.pri}`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>
        KASIR JE GRUP</div>
      <p style={{fontSize:12,color:C.t2}}>Menghubungkan database...</p>
    </div>
  </div>;

  if(screen==="facescan"&&pending) return <div style={{fontFamily:F.sans,color:C.t0,height:"100vh",background:C.bg1}}>
    <style>{CSS}</style><Toast n={notif}/>
    <FaceScan user={pending} mode="verify" onSuccess={()=>afterFace(pending)} onCancel={()=>{setPending(null);setScreen("login");}}/>
  </div>;

  if(faceReg) return <div style={{fontFamily:F.sans,color:C.t0,height:"100vh",background:C.bg1}}>
    <style>{CSS}</style><Toast n={notif}/>
    <FaceScan user={users.find(u=>u.id===faceReg)} mode="register" onSuccess={handleFaceReg} onCancel={()=>setFaceReg(null)}/>
  </div>;

  // ─────────────────────────────────────────────────────────────
  //  STUDIO DESAIN BAJU CUSTOM (JS CLOTHING)
  // ─────────────────────────────────────────────────────────────
  if(screen==="custom-baju") return <div style={{fontFamily:F.sans,background:C.bg1,color:C.t0,minHeight:"100dvh",display:"flex",flexDirection:"column"}}>
    {UpdateBannerEl}
    <style>{CSS}</style><Toast n={notif}/>
    <CustomShirtStudio
      onBack={()=>setScreen("landing")}
      onGoLanding={()=>setScreen("landing")}
      waNumber={LANDING.wa || LANDING_WA}
      C={C}
      F={F}
      isDark={isDark}
    />
  </div>;

  // ─────────────────────────────────────────────────────────────
  //  LANDING PAGE (Katalog Iklan Produk Publik)
  // ─────────────────────────────────────────────────────────────
  if(screen==="landing") return <div style={{fontFamily:F.sans,background:C.bg1,color:C.t0,minHeight:"100dvh",display:"flex",flexDirection:"column"}}>
    {UpdateBannerEl}
    <style>{CSS}</style><Toast n={notif}/>
      <ProductLandingPage
        prods={prods}
        cfg={landingCfg}
        user={user}
        onLogin={()=>{
          if(user) {
            setScreen(user.role==="admin"?"admin":(user.role==="kasir"?"kasir":"stok"));
          } else {
            setScreen("login");
          }
        }}
        onToggleTheme={toggleTheme}
        isDark={isDark}
        onOpenCustomizer={()=>setScreen("custom-baju")}
      />
  </div>;

  // ─────────────────────────────────────────────────────────────
  //  LOGIN
  // ─────────────────────────────────────────────────────────────
  if(screen==="login") return <div style={{fontFamily:F.sans,background:C.bg1,color:C.t0,minHeight:"100dvh",display:"flex",flexDirection:"column"}}>
    {UpdateBannerEl}
    <style>{CSS}</style><Toast n={notif}/>
    <main className="login-shell">
      <section className="login-hero">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
          <BrandMark size={44} onDark/>
          <OnlineDot online={online} onDark/>
        </div>
        <h1 style={{fontSize:30,fontWeight:800,letterSpacing:"-.03em",lineHeight:1.1,marginBottom:10}}>Kasir JE Grup</h1>
        <p style={{fontSize:14.5,lineHeight:1.5,color:"rgba(255,255,255,.78)",maxWidth:320,textWrap:"balance"}}>Penjualan dan stok untuk JS Clothing dan JB Store.</p>
      </section>
      <div className="ikat-band" aria-hidden="true"/>
      <section className="login-body">
        <div>
          <h2 style={{fontSize:21,fontWeight:800,letterSpacing:"-.02em"}}>Masuk</h2>
          <p style={{fontSize:13.5,color:C.t2,marginTop:4,lineHeight:1.5}}>Gunakan akun yang diberikan admin.</p>
        </div>
        <Inp value={lf.u} onChange={e=>setLf(x=>({...x,u:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="mis. kasir" icon={<User size={17}/>} label="Username"/>
        <div style={{position:"relative"}}>
          <Inp value={lf.p} onChange={e=>setLf(x=>({...x,p:e.target.value}))} type={showPw?"text":"password"} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="Password" icon={<Lock size={17}/>} label="Password" style={{paddingRight:48}}/>
          <button type="button" onClick={()=>setShowPw(x=>!x)} aria-label={showPw?"Sembunyikan password":"Tampilkan password"} className="press"
            style={{position:"absolute",right:4,bottom:3,width:44,height:44,border:"none",background:"transparent",color:C.t2,display:"grid",placeItems:"center",borderRadius:12}}>
            {showPw?<EyeOff size={19}/>:<Eye size={19}/>}</button>
        </div>
        <button type="button" role="switch" aria-checked={rememberMe} onClick={()=>setRememberMe(x=>!x)}
          style={{display:"flex",alignItems:"center",gap:12,background:"transparent",border:"none",padding:"2px 0",minHeight:40,color:C.t1,fontSize:14,fontWeight:600,textAlign:"left"}}>
          <span style={{width:44,height:26,borderRadius:13,background:rememberMe?C.pri:C.bg4,position:"relative",transition:"background .2s",flexShrink:0}}>
            <span style={{position:"absolute",top:3,left:rememberMe?21:3,width:20,height:20,borderRadius:"50%",background:rememberMe?C.on:C.t2,transition:"left .2s"}}/>
          </span>
          Ingat saya di perangkat ini
        </button>
        {lerr&&<div role="alert" style={{padding:"11px 13px",background:C.r1,borderRadius:12,fontSize:13.5,fontWeight:600,color:C.r,display:"flex",gap:9,alignItems:"flex-start",lineHeight:1.4}}>
          <AlertTriangle size={17} style={{flexShrink:0,marginTop:1}}/>{lerr}</div>}
        <Btn onClick={doLogin} full size="lg">Masuk</Btn>
        <div style={{display:"flex",flexDirection:"column",gap:10,padding:"14px",background:C.bg3,borderRadius:14,fontSize:13,color:C.t1,lineHeight:1.45}}>
          <div style={{display:"flex",gap:10}}><Crown size={17} color={C.vi} style={{flexShrink:0,marginTop:1}}/><span><b style={{color:C.t0}}>Admin</b> langsung masuk tanpa scan wajah.</span></div>
          <div style={{display:"flex",gap:10}}><ScanLine size={17} color={C.cy} style={{flexShrink:0,marginTop:1}}/><span><b style={{color:C.t0}}>Kasir dan stok</b> diverifikasi wajah, lalu absen tercatat otomatis.</span></div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"auto",paddingTop:4,flexWrap:"wrap",gap:8}}>
          <button onClick={()=>setScreen("landing")} className="press" style={{display:"inline-flex",alignItems:"center",gap:6,background:"transparent",border:"none",color:C.pri,fontSize:13,fontWeight:700,minHeight:40,padding:"0 4px"}}>
            <ShoppingBag size={16}/> Lihat Katalog Toko
          </button>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {!hasEnvConfig&&<button onClick={()=>{clearConfig();setFbReady(false);setFbSetup(true);}} className="press" style={{background:"transparent",border:"none",color:C.t2,fontSize:13,fontWeight:600,minHeight:40,padding:"0 4px",textDecoration:"underline",textUnderlineOffset:3}}>Ganti Firebase</button>}
            <button onClick={toggleTheme} className="press" style={{display:"inline-flex",alignItems:"center",gap:7,minHeight:40,padding:"0 14px",background:"transparent",border:`1.5px solid ${C.bo1}`,borderRadius:20,color:C.t1,fontSize:13,fontWeight:600}}>
              {isDark?<Sun size={16}/>:<Moon size={16}/>}{isDark?"Mode terang":"Mode gelap"}</button>
          </div>
        </div>
      </section>
    </main>
  </div>;

  // ─────────────────────────────────────────────────────────────
  //  BIZ SELECT
  // ─────────────────────────────────────────────────────────────
  if(screen==="bizselect") return <div style={{fontFamily:F.sans,background:C.bg1,color:C.t0,minHeight:"100dvh",display:"flex",flexDirection:"column"}}>
    <style>{CSS}</style><Toast n={notif}/>
    <main className="login-shell">
      <section className="login-hero" style={{paddingBottom:24}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <span style={{width:52,height:52,borderRadius:"50%",background:"rgba(255,255,255,.14)",border:"1.5px solid rgba(255,255,255,.3)",display:"grid",placeItems:"center",fontWeight:800,fontSize:21,flexShrink:0}}>{(user?.name||"?").trim().charAt(0).toUpperCase()}</span>
          <div style={{minWidth:0}}>
            <p style={{fontSize:13,color:"rgba(255,255,255,.72)"}}>Selamat bekerja,</p>
            <h1 style={{fontSize:21,fontWeight:800,letterSpacing:"-.02em",lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.name}</h1>
          </div>
        </div>
      </section>
      <div className="ikat-band" aria-hidden="true"/>
      <section className="login-body">
        <div>
          <h2 style={{fontSize:19,fontWeight:800,letterSpacing:"-.02em"}}>Pilih bisnis hari ini</h2>
          <p style={{fontSize:13.5,color:C.t2,marginTop:4}}>Absen masuk dicatat untuk bisnis yang kamu pilih.</p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {user?.access?.map(bizId=>{
            const b=BIZ[bizId],isJ=bizId==="JS_CLOTHING",bcl=isJ?C.b:C.p;
            return <button key={bizId} className="press"
              onClick={async()=>{setBiz(bizId);await doCheckIn(user,bizId);setScreen(user.role==="kasir"?"kasir":"stok");}}
              style={{padding:"16px",background:C.bg2,border:`1.5px solid ${C.bo1}`,borderRadius:18,textAlign:"left",display:"flex",alignItems:"center",gap:14,boxShadow:C.sh,minHeight:84}}>
              <span style={{width:52,height:52,borderRadius:15,flexShrink:0,background:isJ?C.b1:C.p1,color:bcl,display:"grid",placeItems:"center"}}><Ico e={b.icon} size={26} strokeWidth={1.8}/></span>
              <span style={{flex:1,minWidth:0}}>
                <span style={{display:"block",fontSize:17,fontWeight:800,color:C.t0}}>{b.name}</span>
                <span style={{display:"block",fontSize:13,color:C.t2,marginTop:2}}>{b.desc} · <span className="mn">{bizProds(bizId).length}</span> produk</span>
              </span>
              <ChevronRight size={20} color={C.t3} aria-hidden="true"/>
            </button>;
          })}
        </div>
        <button onClick={doLogout} className="press" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,minHeight:46,marginTop:"auto",background:"transparent",border:`1.5px solid ${C.bo1}`,borderRadius:12,color:C.t1,fontSize:14,fontWeight:600}}>
          <ArrowLeft size={17}/>Kembali ke halaman masuk</button>
      </section>
    </main>
  </div>;

  // ─────────────────────────────────────────────────────────────
  //  KASIR SCREEN
  // ─────────────────────────────────────────────────────────────
  if(screen==="kasir") {
    const subtotal=cart.reduce((s,c)=>s+c.price*c.qty,0);
    const discAmt=calcDiscount(subtotal);
    const total=subtotal-discAmt;
    const totalHpp=cart.reduce((s,c)=>s+(c.hpp||0)*c.qty,0);
    const bc=C.pri;
    const qrisBiz=[...new Set(cart.map(c=>c.business))];
    const qrisReady=payMethod==="QRIS"&&qrisBiz.length>0&&qrisBiz.every(x=>getQris(x));
    const KTABS=[{id:"kasir",l:"Kasir",ic:ShoppingCart},{id:"riwayat",l:"Riwayat",ic:Receipt},{id:"opname",l:"Opname",ic:ClipboardCheck}];
    const baseProds=kasirProds().filter(p=>catBiz==="ALL"||p.business===catBiz);
    const catList=[...new Set(baseProds.map(p=>p.category).filter(Boolean))].sort();
    const qL=scanIn.trim().toLowerCase();
    const shown=baseProds.filter(p=>(catCat==="ALL"||p.category===catCat)&&(!qL||p.name.toLowerCase().includes(qL)||p.barcode.toLowerCase().includes(qL))).sort((a,b)=>a.name.localeCompare(b.name));
    const qtyOf=p=>cart.find(c=>c.barcode===p.barcode)?.qty||0;
    const cartItems=()=>cart.length===0
      ?<EmptyState icon={<ShoppingCart size={24} strokeWidth={1.6}/>} title="Keranjang kosong" hint="Ketuk produk untuk menambahkannya ke keranjang."/>
      :cart.map(item=><div key={item.barcode} className="card-in" style={{background:C.bg2,border:`1px solid ${C.bo0}`,borderRadius:14,padding:"11px 12px"}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"flex-start"}}>
          <div style={{minWidth:0}}>
            <div style={{fontWeight:700,fontSize:14,lineHeight:1.3}}>{item.name}</div>
            <div className="mn" style={{fontSize:12,color:C.t2,marginTop:2}}><span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:item.business==="JB_STORE"?C.p:C.b,marginRight:6}}/>{BIZ[item.business]?.name} · {item.barcode}</div>
          </div>
          <button onClick={()=>setCart(p=>p.filter(c=>c.barcode!==item.barcode))} aria-label={"Hapus "+item.name} className="press"
            style={{width:34,height:34,flexShrink:0,border:"none",background:"transparent",color:C.t2,display:"grid",placeItems:"center",borderRadius:10}}><X size={17}/></button>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <button onClick={()=>setCart(p=>{const it=p.find(c=>c.barcode===item.barcode);return it.qty<=1?p.filter(c=>c.barcode!==item.barcode):p.map(c=>c.barcode===item.barcode?{...c,qty:c.qty-1}:c);})} aria-label="Kurangi" className="press"
              style={{width:38,height:38,background:C.bg3,border:`1px solid ${C.bo1}`,borderRadius:10,color:C.t0,fontSize:18,display:"grid",placeItems:"center"}}>−</button>
            <span className="mn" style={{minWidth:28,textAlign:"center",fontWeight:800,fontSize:15}}>{item.qty}</span>
            <button onClick={()=>setCart(p=>p.map(c=>c.barcode===item.barcode&&c.qty<c.stock?{...c,qty:c.qty+1}:c))} aria-label="Tambah" className="press"
              style={{width:38,height:38,background:C.bg3,border:`1px solid ${C.bo1}`,borderRadius:10,color:C.t0,fontSize:18,display:"grid",placeItems:"center"}}>+</button>
          </div>
          <div className="mn" style={{fontWeight:800,fontSize:15.5}}>{rp(item.price*item.qty)}</div>
        </div>
      </div>);
    const qrisMissing=payMethod==="QRIS"&&!qrisReady?qrisBiz.filter(x=>!getQris(x)).map(x=>BIZ[x]?.name).join(", "):"";

    return <div style={{fontFamily:F.sans,background:C.bg1,color:C.t0,height:"100vh",display:"flex",flexDirection:"column"}}>
      <style>{CSS}</style><Toast n={notif}/>
      <Header title="Kasir" user={user} online={online} onLogout={doLogout}
        onAbsenPulang={handlePulang} hasCheckedIn={hasCheckedIn}
        onToggleTheme={toggleTheme} isDark={isDark} lowStockCount={lowStockCount} onLowStockClick={()=>setShowLowStock(true)} expireCount={nearExpiry.length} expiredCount={expiredProds.length} onExpireClick={()=>setShowExpirePopup(true)} onGoLanding={()=>setScreen("landing")} onOpenCustomizer={()=>setScreen("custom-baju")}/>

      {/* Invoice */}
      {addonPrompt&&<AddonPrompt
        prompt={addonPrompt}
        onAdd={(chosen)=>{
          chosen.forEach(a=>addToCart(a));
          setAddonPrompt(null);
          if(chosen.length) toast("✓ "+chosen.map(a=>a.name).join(", ")+" ditambahkan");
          scanRef.current?.focus();
        }}
        onSkip={()=>{setAddonPrompt(null);scanRef.current?.focus();}}
      />}
      {receipt&&<Invoice receipt={receipt} biz={receipt.business}
        onClose={()=>{setReceipt(receiptQueue[0]||null);setReceiptQueue(q=>q.slice(1));scanRef.current?.focus();}}
        onNew={()=>{setReceipt(receiptQueue[0]||null);setReceiptQueue(q=>q.slice(1));scanRef.current?.focus();}}/>}
      {invTrx&&<Invoice receipt={invTrx} biz={invTrx.business} onClose={()=>setInvTrx(null)}/>}
      {/* Stock check */}
      {showStock&&<StockCheckModal prods={kasirProds()} biz={null} onClose={()=>setShowStock(false)}/> }
      {showLowStock&&<LowStockPopup prods={prods} onClose={()=>setShowLowStock(false)}/>}
      {showExpirePopup&&<ExpirePopup nearExpiry={nearExpiry} expiredProds={expiredProds} onClose={()=>setShowExpirePopup(false)}/>}

      {/* Checkout modal */}
      <QrisModal open={qrisOpen} groups={qrisOpen?splitCart(cart,discAmt,biz):[]} onPaid={()=>{setQrisOpen(false);doCheckout();}} onCancel={()=>{setQrisOpen(false);setShowCheckout(true);}}/>
      <Modal open={showCheckout} size="lg" dismiss={false} onClose={()=>setShowCheckout(false)} icon={<CreditCard size={20}/>} title="Konfirmasi pembayaran"
        subtitle={`${cart.reduce((s,c)=>s+c.qty,0)} item`}
        footer={<><Btn outline disabled={checkingOut} onClick={()=>setShowCheckout(false)}>Batal</Btn><Btn size="lg" disabled={checkingOut} onClick={qrisReady?()=>{setShowCheckout(false);setQrisOpen(true);}:doCheckout}>{checkingOut?"Memproses…":qrisReady?<><QrCode size={18}/>Tampilkan QRIS</>:<><Check size={18}/>Bayar {rp(total)}</>}</Btn></>}>
        <div className="split">
          <div style={{display:"flex",flexDirection:"column",gap:18,minWidth:0}}>
            <Inp label="Nama pembeli (opsional)" icon={<User size={17}/>} value={namaPembeli} onChange={e=>setNamaPembeli(e.target.value)} placeholder="Kosongkan untuk Umum"/>
            <div>
              <div style={{fontSize:12.5,fontWeight:600,color:C.t1,marginBottom:6}}>Diskon (opsional)</div>
              <div style={{display:"flex",gap:8}}>
                <div style={{display:"flex",borderRadius:12,overflow:"hidden",border:`1.5px solid ${C.bo1}`,flexShrink:0}}>
                  {[["pct","%"],["rp","Rp"]].map(([t,l])=>(
                    <button key={t} onClick={()=>setDiscount(x=>({...x,type:t}))} aria-pressed={discount.type===t}
                      style={{minWidth:52,minHeight:46,background:discount.type===t?C.pri:C.bg3,border:"none",color:discount.type===t?C.on:C.t2,fontWeight:700,fontSize:14}}>{l}</button>))}
                </div>
                <div style={{flex:1}}><Inp type="number" value={discount.value} onChange={e=>setDiscount(x=>({...x,value:e.target.value}))} placeholder={discount.type==="pct"?"0–100":"0"}/></div>
              </div>
              {discAmt>0&&<div style={{marginTop:8,fontSize:13,color:C.r,fontWeight:600}}>Potongan {rp(discAmt)}</div>}
            </div>
            <div>
              <div style={{fontSize:12.5,fontWeight:600,color:C.t1,marginBottom:8}}>Metode pembayaran</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {PAYMENT_METHODS.map(m=><button key={m} onClick={()=>setPayMethod(m)} className={`chip${payMethod===m?" on":""}`} aria-pressed={payMethod===m}>{m}</button>)}
              </div>
            </div>
          </div>
          <aside className="split-side">
            <div style={{fontSize:13,fontWeight:800,marginBottom:10}}>Ringkasan</div>
            <div style={{maxHeight:180,overflowY:"auto",display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
              {cart.map(c=><div key={c.barcode} style={{display:"flex",justifyContent:"space-between",gap:10,fontSize:13.5}}>
                <span style={{minWidth:0}}><span style={{display:"block",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</span>
                  <span className="mn" style={{fontSize:12,color:C.t2}}>{c.qty} × {rp(c.price)}</span></span>
                <span className="mn" style={{fontWeight:700,flexShrink:0}}>{rp(c.price*c.qty)}</span></div>)}
            </div>
            <div style={{borderTop:`1px dashed ${C.bo2}`,paddingTop:10}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13.5,color:C.t2,marginBottom:4}}><span>Subtotal</span><span className="mn">{rp(subtotal)}</span></div>
              {discAmt>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13.5,color:C.r,marginBottom:4}}><span>Diskon</span><span className="mn">− {rp(discAmt)}</span></div>}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginTop:6}}>
                <span style={{fontSize:14,fontWeight:700}}>Total</span>
                <span className="mn" style={{fontSize:26,fontWeight:800,letterSpacing:"-.02em"}}>{rp(total)}</span></div>
              {payMethod==="QRIS"&&<div style={{marginTop:10,fontSize:12.5,lineHeight:1.45,color:qrisReady?C.g:C.a,fontWeight:600}}>{qrisReady?"QR dengan nominal otomatis akan ditampilkan"+(qrisBiz.length>1?" per toko.":"."):`QRIS ${qrisMissing} belum disetel, jadi hanya dicatat sebagai QRIS.`}</div>}
              {user.access.length>1&&new Set(cart.map(c=>c.business)).size>1&&<div style={{marginTop:10,fontSize:12.5,color:C.t2,lineHeight:1.45}}>Keranjang berisi dua toko, jadi struk dibuat terpisah per toko.</div>}
            </div>
          </aside>
        </div>
      </Modal>

      {/* Layout kasir: sidebar menu | katalog produk | keranjang */}
      <div className="admin-body">
        <AdminSidebar tabs={KTABS} active={kasirTab} onSelect={setKasirTab} label="Menu kasir" storeKey="je_sidew_k" defaultW={216}/>
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,minHeight:0}}>
          {kasirTab==="kasir"&&<div style={{flex:1,display:"flex",minHeight:0}}>
            <section style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",minHeight:0}}>
              <div style={{padding:"10px 12px 8px",background:C.bg2,borderBottom:`1px solid ${C.bo0}`,display:"flex",flexDirection:"column",gap:8,flexShrink:0}}>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:C.t2,display:"flex",pointerEvents:"none"}}><ScanLine size={19}/></span>
                  <input ref={scanRef} value={scanIn} onChange={e=>setScanIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&kasirScan(scanIn)}
                    placeholder="Cari produk atau scan barcode" aria-label="Cari produk atau scan barcode"
                    style={{width:"100%",minHeight:46,padding:"11px 44px 11px 42px",background:C.bg3,border:`1.5px solid ${C.bo1}`,borderRadius:12,color:C.t0,fontSize:15,fontFamily:F.sans}}/>
                  {scanIn&&<button onClick={()=>{setScanIn("");scanRef.current?.focus();}} aria-label="Hapus pencarian" className="press"
                    style={{position:"absolute",right:4,top:3,width:40,height:40,border:"none",background:"transparent",color:C.t2,display:"grid",placeItems:"center"}}><X size={18}/></button>}
                </div>
                {user.access.length>1&&<div style={{display:"flex",gap:6}}>
                  {["ALL",...user.access].map(b=><button key={b} onClick={()=>{setCatBiz(b);setCatCat("ALL");}} className={`chip${catBiz===b?" on":""}`}>{b==="ALL"?"Semua toko":BIZ[b].name}</button>)}
                </div>}
                {catList.length>1&&<div style={{display:"flex",gap:6,flexWrap:"nowrap",overflowX:"auto",scrollbarWidth:"none",paddingBottom:2}}>
                  {["ALL",...catList].map(c=><button key={c} onClick={()=>setCatCat(c)} className={`chip${catCat===c?" on":""}`} style={{minHeight:34,padding:"6px 13px",flexShrink:0,whiteSpace:"nowrap"}}>{c==="ALL"?"Semua kategori":c}</button>)}
                </div>}
              </div>
              <div className="catalog-scroll">
                {shown.length===0
                  ?<EmptyState icon={<Search size={24} strokeWidth={1.6}/>} title="Produk tidak ditemukan" hint="Coba kata kunci lain atau ubah filter toko dan kategori."/>
                  :<div className="pgrid">{shown.map(p=><ProductTile key={p.id} p={p} inCart={qtyOf(p)} showBiz={user.access.length>1} onAdd={kasirAdd}/>)}</div>}
              </div>
            </section>
            <aside className="hide-mobile" style={{width:360,flexShrink:0,background:C.bg1,borderLeft:`1px solid ${C.bo0}`,display:"flex",flexDirection:"column",minHeight:0}}>
              <div style={{padding:"14px 16px",background:C.bg2,borderBottom:`1px solid ${C.bo0}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                <div><div style={{fontWeight:800,fontSize:15}}>Keranjang</div><div style={{fontSize:12.5,color:C.t2}}>{cart.length} produk · {cart.reduce((s,c)=>s+c.qty,0)} item</div></div>
                {cart.length>0&&<Btn size="sm" ghost onClick={()=>setCart([])}><Trash2 size={15}/>Kosongkan</Btn>}
              </div>
              <div style={{flex:1,overflowY:"auto",padding:12,display:"flex",flexDirection:"column",gap:8,minHeight:0}}>{cartItems()}</div>
              <div style={{padding:"14px 16px calc(14px + var(--safe-b))",background:C.bg2,borderTop:`1px solid ${C.bo0}`}}>
                {user.access.length>1&&qrisBiz.length>1&&<div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:10}}>
                  {user.access.map(bz=>{const sub=cart.filter(c=>c.business===bz).reduce((s,c)=>s+c.price*c.qty,0),cl=bz==="JS_CLOTHING"?C.b:C.p;
                    return sub>0&&<div key={bz} style={{display:"flex",justifyContent:"space-between",fontSize:12.5,fontWeight:700,color:cl}}><span>{BIZ[bz].name}</span><span className="mn">{rp(sub)}</span></div>;})}
                </div>}
                {discAmt>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:C.r,marginBottom:4}}><span>Diskon</span><span className="mn">− {rp(discAmt)}</span></div>}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:12}}>
                  <span style={{fontSize:14,fontWeight:700,color:C.t1}}>Total</span>
                  <span className="mn" style={{fontSize:28,fontWeight:800,letterSpacing:"-.02em"}}>{rp(total)}</span>
                </div>
                <Btn full size="lg" disabled={!cart.length} onClick={()=>setShowCheckout(true)}><CreditCard size={19}/>Bayar</Btn>
              </div>
            </aside>
          </div>}

          {kasirTab==="riwayat"&&<div className="admin-content"><div style={{display:"flex",flexDirection:"column",gap:10,maxWidth:900,margin:"0 auto"}}>
            {(()=>{
              const hq=histQ.trim().toLowerCase();
              const myTrx=trxs.filter(t=>user.access.includes(t.business)&&inRangeDate(parseD(t.date),histRange,"","")&&(!hq||(t.id||"").toLowerCase().includes(hq)||(t.namaPembeli||"").toLowerCase().includes(hq)));
              const sumT=myTrx.filter(t=>!t.returned).reduce((s,t)=>s+t.total,0);
              return <>
                <div><h2 style={{fontSize:16,fontWeight:800}}>Riwayat transaksi</h2><p style={{fontSize:12.5,color:C.t2,marginTop:2}}>Buka invoice untuk cetak ulang atau kirim lewat WhatsApp.</p></div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{[["today","Hari ini"],["week","7 hari"],["all","Semua"]].map(([v,l])=><button key={v} onClick={()=>setHistRange(v)} className={`chip${histRange===v?" on":""}`}>{l}</button>)}</div>
                <Inp value={histQ} onChange={e=>setHistQ(e.target.value)} placeholder="Cari ID atau nama pembeli" icon={<Search size={16}/>} style={{minHeight:42}}/>
                <div className="stat-grid-3" style={{display:"grid",gap:10,gridTemplateColumns:"repeat(2,1fr)"}}>
                  <Stat icon="🧾" label="Transaksi" value={myTrx.length} color={C.cy}/>
                  <Stat icon="💰" label="Total penjualan" value={rp(sumT)} color={C.g}/>
                </div>
                {myTrx.length===0?<Card><EmptyState icon={<Receipt size={24} strokeWidth={1.6}/>} title="Belum ada transaksi" hint="Transaksi yang kamu selesaikan muncul di sini."/></Card>
                :myTrx.slice(0,100).map(t=><Card key={t.id} style={{padding:"13px 15px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start"}}>
                    <div style={{minWidth:0}}>
                      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}><span className="mn" style={{fontSize:13,fontWeight:700}}>{t.id?.slice(-10)}</span><BizChip biz={t.business} sm/>{t.returned&&<span style={{padding:"1px 8px",borderRadius:20,background:C.a1,color:C.a,fontSize:11.5,fontWeight:700}}>Retur</span>}</div>
                      <div style={{fontSize:12.5,color:C.t2,marginTop:4}}>{t.date} · {(t.items||[]).reduce((s,i)=>s+i.qty,0)} item · {t.payment||"Tunai"}{t.namaPembeli&&t.namaPembeli!=="Umum"?" · "+t.namaPembeli:""}</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div className="mn" style={{fontSize:16,fontWeight:800}}>{rp(t.total)}</div>
                      <Btn size="sm" outline onClick={()=>setInvTrx(t)} style={{marginTop:6}}><Receipt size={15}/>Invoice</Btn>
                    </div>
                  </div>
                </Card>)}
              </>;
            })()}
          </div></div>}

          {kasirTab==="opname"&&<div className="admin-content">{opnamePanelEl()}</div>}
        </div>
      </div>

      {/* Mobile: bar keranjang + navigasi bawah */}
      {kasirTab==="kasir"&&<div className="hide-desktop cartbar">
        <button onClick={()=>setCartOpen(true)} aria-label="Lihat keranjang" className="press"
          style={{flex:1,minWidth:0,display:"flex",alignItems:"center",gap:12,background:"transparent",border:"none",textAlign:"left",color:C.t0,padding:0}}>
          <span style={{position:"relative",width:42,height:42,borderRadius:12,background:C.pri1,color:C.pri,display:"grid",placeItems:"center",flexShrink:0}}>
            <ShoppingCart size={21}/>{cart.length>0&&<span className="mn" style={{position:"absolute",top:-6,right:-6,minWidth:20,height:20,padding:"0 5px",borderRadius:10,background:C.pri,color:C.on,fontSize:11.5,fontWeight:800,display:"grid",placeItems:"center",boxSizing:"border-box",border:`2px solid ${C.bg2}`}}>{cart.reduce((s,c)=>s+c.qty,0)}</span>}
          </span>
          <span style={{minWidth:0}}><span style={{display:"block",fontSize:12,color:C.t2,fontWeight:600}}>{cart.length?"Lihat keranjang":"Keranjang kosong"}</span><span className="mn" style={{display:"block",fontSize:20,fontWeight:800,lineHeight:1.15}}>{rp(total)}</span></span>
        </button>
        <Btn size="lg" disabled={!cart.length} onClick={()=>setShowCheckout(true)}>Bayar</Btn>
      </div>}
      <nav className="bnav" aria-label="Menu kasir">
        {KTABS.map(t=>{const on=kasirTab===t.id;
          return <button key={t.id} className={`bnavbtn${on?" active":""}`} onClick={()=>setKasirTab(t.id)} aria-current={on?"page":undefined}>
            <span className="bnav-icon"><t.ic size={22} strokeWidth={on?2.2:1.8}/></span><span className="bnav-label">{t.l}</span></button>;})}
      </nav>
      <Modal open={cartOpen} size="md" onClose={()=>setCartOpen(false)} icon={<ShoppingCart size={20}/>} title="Keranjang" subtitle={`${cart.length} produk · ${cart.reduce((s,c)=>s+c.qty,0)} item`}
        footer={<><Btn outline disabled={!cart.length} onClick={()=>setCart([])}>Kosongkan</Btn><Btn size="lg" disabled={!cart.length} onClick={()=>{setCartOpen(false);setShowCheckout(true);}}>Bayar {rp(total)}</Btn></>}>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>{cartItems()}</div>
      </Modal>
    </div>;
  }

  // ─────────────────────────────────────────────────────────────
  //  STOK SCREEN
  // ─────────────────────────────────────────────────────────────
  if(screen==="stok") {
    const bc=biz==="JS_CLOTHING"?C.b:C.p;
    const filtered=bizProds().filter(p=>!stokSearch||p.name.toLowerCase().includes(stokSearch.toLowerCase())||p.barcode.includes(stokSearch));
    return <div style={{fontFamily:F.sans,background:C.bg1,color:C.t0,height:"100vh",display:"flex",flexDirection:"column"}}>
      <style>{CSS}</style><Toast n={notif}/>
      {showOpnamePanel&&opnameOverlay(()=>setShowOpnamePanel(false))}
      {UpdateBannerEl}
      {showLowStock&&<LowStockPopup prods={prods} onClose={()=>setShowLowStock(false)}/>}
      {showExpirePopup&&<ExpirePopup nearExpiry={nearExpiry} expiredProds={expiredProds} onClose={()=>setShowExpirePopup(false)}/>}
      <Header biz={biz} user={user} online={online} onLogout={doLogout}
        onSwitchBiz={user?.access?.length>1?()=>{setStokTarget(null);setIsNewProduct(false);setScreen("bizselect");}:null}
        onAbsenPulang={handlePulang} hasCheckedIn={hasCheckedIn} onToggleTheme={toggleTheme} isDark={isDark} onLowStockClick={()=>setShowLowStock(true)} expireCount={nearExpiry.length} expiredCount={expiredProds.length} onExpireClick={()=>setShowExpirePopup(true)} onGoLanding={()=>setScreen("landing")} onOpenCustomizer={()=>setScreen("custom-baju")}/>
      <div style={{flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:10,minHeight:0}}>
        
        {/* Scan / Cari Barcode */}
        <Card noPad style={{overflow:"hidden"}}>
          <div style={{padding:"10px 13px",borderBottom:`1px solid ${C.bo0}`,display:"flex",alignItems:"center",gap:8}}>
            <span style={{flex:1,fontSize:12,fontWeight:700,color:C.t2,textTransform:"none",letterSpacing:0}}><Ico e="📷"/> Scan Barcode</span>
            <BizChip biz={biz}/>
          </div>
          <div style={{padding:"10px 12px",display:"flex",gap:8}}>
            <div style={{flex:1,position:"relative"}}>
              <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:15,pointerEvents:"none",color:C.t2}}><Ico e="📷"/></span>
              <input ref={stokScanRef} value={stokScan} onChange={e=>setStokScan(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&stokScanFn(stokScan)}
                placeholder="Scan atau cari produk"
                style={{width:"100%",padding:"12px 12px 12px 40px",background:C.bg3,border:`2px solid ${bc}44`,borderRadius:12,color:C.t0,fontSize:14,fontFamily:F.mono}}/>

              {/* Autocomplete Suggestions Stok */}
              {stokScan.trim().length > 1 && (
                <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:100,background:C.bg2,border:`1px solid ${C.bo1}`,borderRadius:12,marginTop:6,boxShadow:C.sh2,overflow:"hidden",animation:"fadeUp 0.2s ease"}}>
                  {bizProds().filter(p => p.name.toLowerCase().includes(stokScan.trim().toLowerCase()) || p.barcode.includes(stokScan.trim())).slice(0, 5).map((p, i) => (
                    <div key={p.id} onClick={() => stokScanFn(p.barcode)} className="hrow"
                      style={{padding:"10px 14px",cursor:"pointer",borderTop:i>0?`1px solid ${C.bo0}`:undefined,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <div style={{fontWeight:600,fontSize:13}}>{p.name}</div>
                        <div className="mn" style={{fontSize:10,color:C.t2,marginTop:2}}>{p.barcode}</div>
                      </div>
                      <div className="mn" style={{color:p.stock<10?C.r:C.t0,fontWeight:700,fontSize:12}}>Stok: {p.stock}</div>
                    </div>
                  ))}
                  {bizProds().filter(p => p.name.toLowerCase().includes(stokScan.trim().toLowerCase()) || p.barcode.includes(stokScan.trim())).length === 0 && (
                    <div style={{padding:"12px 14px",fontSize:12,color:C.t3,textAlign:"center"}}>Produk tidak ditemukan</div>
                  )}
                </div>
              )}
            </div>
            <button onClick={()=>stokScanFn(stokScan)} className="press"
              style={{padding:"12px 16px",background:bc,border:"none",borderRadius:12,color:C.on,fontWeight:800,fontSize:13,flexShrink:0}}>Scan</button>
          </div>
        </Card>

        {/* 🆕 FORM PRODUK BARU (Jika tidak ditemukan saat scan) */}
        <Modal open={!!isNewProduct} size="md" dismiss={false} onClose={()=>setIsNewProduct(false)} icon={<Plus size={20}/>} title="Daftarkan produk baru"
          footer={<><Btn outline onClick={()=>setIsNewProduct(false)}>Batal</Btn><Btn color={C.vi} onClick={saveNewProduct}><Check size={17}/>Simpan produk</Btn></>}>
          <div className="fgrid">
            <Inp label="Barcode" value={newPForm.barcode} onChange={e=>setNewPForm(x=>({...x,barcode:e.target.value}))} mono/>
            <Inp label="Kategori" value={newPForm.category} onChange={e=>setNewPForm(x=>({...x,category:e.target.value}))}/>
            <div className="full"><Inp label="Nama produk" value={newPForm.name} onChange={e=>setNewPForm(x=>({...x,name:e.target.value}))}/></div>
            <Inp label="Harga jual" type="number" suffix="Rp" value={newPForm.price} onChange={e=>setNewPForm(x=>({...x,price:e.target.value}))}/>
            <Inp label="Stok awal" type="number" value={newPForm.stock} onChange={e=>setNewPForm(x=>({...x,stock:e.target.value}))}/>
          </div>
        </Modal>

        {/* 📦 UPDATE STOK (Untuk produk yang sudah ada) */}
        {stokTarget && !isNewProduct && (
          <Modal open size="md" dismiss={false} onClose={()=>{setStokTarget(null);stokScanRef.current?.focus();}} icon={<Package size={20}/>} title="Tambah stok" subtitle={stokTarget.name}
            footer={<><Btn outline onClick={()=>{setStokTarget(null);stokScanRef.current?.focus();}}>Batal</Btn><Btn onClick={doAddStock}><Plus size={17}/>Tambah stok</Btn></>}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:800,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{stokTarget.name}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  <span className="mn" style={{color:C.t2,fontSize:10}}>{stokTarget.barcode}</span>
                  <span style={{padding:"1px 8px",borderRadius:20,fontSize:10,fontWeight:600,background:C.bg4,color:C.t1}}>{stokTarget.category}</span>
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0,marginLeft:10}}>
                <div style={{fontSize:10,color:C.t2}}>Stok Saat Ini</div>
                <div className="mn" style={{fontSize:32,fontWeight:800,lineHeight:1,color:stokTarget.stock<10?C.r:C.t0}}>{stokTarget.stock}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:C.t2,textTransform:"none",letterSpacing:0,marginBottom:5}}>Jumlah Masuk *</div>
                <input ref={stokQRef} type="number" min="1" value={stokQ}
                  onChange={e=>setStokQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doAddStock()}
                  placeholder="0" style={{width:"100%",padding:"12px",background:C.bg3,border:`1.5px solid ${C.bo0}`,borderRadius:10,color:C.t0,fontSize:24,fontFamily:F.mono,textAlign:"center",fontWeight:700}}
                  onFocus={e=>e.target.style.borderColor=C.pri+"88"} onBlur={e=>e.target.style.borderColor=C.bo0}/>
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:C.t2,textTransform:"none",letterSpacing:0,marginBottom:5}}>Update Harga Jual</div>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:10,color:C.t2,pointerEvents:"none",fontFamily:F.mono}}>Rp</span>
                  <input type="number" value={stokPrice} onChange={e=>setStokPrice(e.target.value)} placeholder={String(stokTarget.price)}
                    style={{width:"100%",padding:"12px 10px 12px 28px",background:C.bg3,border:`1.5px solid ${C.bo0}`,borderRadius:10,color:C.t0,fontSize:14,fontFamily:F.mono}}
                    onFocus={e=>e.target.style.borderColor=C.a+"88"} onBlur={e=>e.target.style.borderColor=C.bo0}/>
                </div>
              </div>
            </div>
            {stokQ&&parseInt(stokQ)>0&&<div style={{padding:"7px 11px",background:C.bg3,borderRadius:7,fontSize:11.5,color:C.t2,marginBottom:10,display:"flex",gap:10,flexWrap:"wrap"}}>
              <span>Stok: <b style={{color:C.t0}}>{stokTarget.stock}</b> → <b style={{color:C.g,fontSize:13}}>{stokTarget.stock+parseInt(stokQ)}</b></span>
              {stokPrice&&+stokPrice>0&&<span>Harga baru: <b style={{color:C.a}}>{rp(stokPrice)}</b></span>}
            </div>}
          </Modal>
        )}

        <button onClick={()=>setShowOpnamePanel(true)} className="press"
          style={{padding:"11px 16px",background:C.vi1,border:`1px solid ${C.vi}44`,borderRadius:12,color:C.vi,fontSize:13,fontWeight:700,width:"100%",textAlign:"center",cursor:"pointer",fontFamily:"inherit"}}>
          <Ico e="📋"/> Buka Opname
        </button>

        {/* Daftar Produk dengan Quick Adjust */}
        <Card noPad style={{overflow:"hidden"}}>
          <div style={{padding:"10px 13px",borderBottom:`1px solid ${C.bo0}`,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontSize:12,fontWeight:700,color:C.t2,textTransform:"none",letterSpacing:0}}><Ico e="📦"/> Daftar Produk ({filtered.length})</span>
            <span style={{flex:1}}/>
            <input value={stokSearch} onChange={e=>setStokSearch(e.target.value)} placeholder="Cari nama / barcode..."
              style={{padding:"7px 11px",background:C.bg3,border:`1px solid ${C.bo0}`,borderRadius:8,color:C.t0,fontSize:12,width:160,fontFamily:F.sans}}/>
          </div>
          {/* Card view for mobile — easier tap targets */}
          <div className="hide-desktop" style={{padding:"8px 10px",display:"flex",flexDirection:"column",gap:7}}>
            {filtered.length===0&&<EmptyState pad={24} title="Tidak ada produk"/>}
            {filtered.map(p=>{
              const adj=quickAdj[p.id]||0;
              const preview=p.stock+adj;
              return <div key={p.id} style={{background:C.bg3,borderRadius:11,border:`1px solid ${p.stock<10?C.r+"44":C.bo0}`,padding:"10px 12px",display:"flex",alignItems:"center",gap:10}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                  <div style={{display:"flex",gap:6,marginTop:2,flexWrap:"wrap"}}>
                    <span className="mn" style={{fontSize:10,color:C.t2}}>{p.barcode}</span>
                    <span className="mn" style={{fontSize:10,color:C.g}}>{rp(p.price)}</span>
                  </div>
                </div>
                {/* Quick +/- controls */}
                <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                  <button onClick={async()=>doQuickAdj(p,-1)} className="press"
                    style={{width:34,height:34,borderRadius:9,background:p.stock===0?C.bg4:C.r1,
                      border:`1.5px solid ${p.stock===0?C.bo0:C.r+"44"}`,color:p.stock===0?C.t3:C.r,
                      fontSize:18,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",
                      cursor:p.stock===0?"not-allowed":"pointer"}}>−</button>
                  <div style={{textAlign:"center",minWidth:36}}>
                    <div className="mn" style={{fontSize:20,fontWeight:800,
                      color:p.stock===0?C.r:p.stock<10?C.a:C.t0,lineHeight:1}}>{p.stock}</div>
                    {adj!==0&&<div className="mn" style={{fontSize:10,color:adj>0?C.g:C.r,marginTop:1}}>
                      {adj>0?"↑":"↓"}{Math.abs(adj)}
                    </div>}
                  </div>
                  <button onClick={async()=>doQuickAdj(p,1)} className="press"
                    style={{width:34,height:34,borderRadius:9,background:C.g1,
                      border:`1.5px solid ${C.g}44`,color:C.g,
                      fontSize:18,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                </div>
                <button onClick={()=>{setStokTarget(p);setIsNewProduct(false);setStokQ("");setStokPrice("");}}
                  className="press" style={{padding:"6px 10px",background:C.b1,border:`1px solid ${C.b}33`,
                    borderRadius:8,color:C.b,fontSize:11,fontWeight:700,flexShrink:0}}>Atur</button>
              </div>;
            })}
          </div>
          {/* Table view for desktop */}
          <div className="hide-mobile">
            <TableWrap compact maxH="50vh">
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:520}}>
                <THead cols={["Barcode","Nama","Kategori","Harga","Stok","+/-",""]}/>
                <tbody>{filtered.map((p,i)=><tr key={p.id} className="hrow" style={{borderTop:`1px solid ${C.bo0}`,background:i%2===0?"transparent":C.bg0}}>
                  <td style={{padding:"11px 13px",fontFamily:F.mono,fontSize:10,color:C.t2}}>{p.barcode}</td>
                  <td style={{padding:"11px 13px",fontWeight:600,fontSize:12}}>{p.name}</td>
                  <td style={{padding:"11px 13px",color:C.t2,fontSize:11}}>{p.category}</td>
                  <td style={{padding:"11px 13px",fontFamily:F.mono,color:C.g,fontSize:11}}>{rp(p.price)}</td>
                  <td style={{padding:"11px 13px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:2}}>
                      <span className="mn" style={{fontSize:15,fontWeight:800,
                        color:p.stock===0?C.r:p.stock<10?C.a:C.t0}}>{p.stock}</span>
                      {p.stock<10&&<span style={{fontSize:10,color:p.stock===0?C.r:C.a,marginLeft:4}}>
                        {p.stock===0?"Habis":"Menipis"}</span>}
                    </div>
                  </td>
                  <td style={{padding:"11px 13px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <button onClick={()=>doQuickAdj(p,-1)} className="press" disabled={p.stock===0}
                        style={{width:28,height:28,borderRadius:7,background:p.stock===0?C.bg4:C.r1,
                          border:`1.5px solid ${p.stock===0?C.bo0:C.r+"44"}`,color:p.stock===0?C.t3:C.r,
                          fontSize:16,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",
                          cursor:p.stock===0?"not-allowed":"pointer"}}>−</button>
                      <button onClick={()=>doQuickAdj(p,1)} className="press"
                        style={{width:28,height:28,borderRadius:7,background:C.g1,
                          border:`1.5px solid ${C.g}44`,color:C.g,
                          fontSize:16,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                      <button onClick={()=>doQuickAdj(p,5)} className="press"
                        style={{padding:"3px 8px",borderRadius:7,background:C.cy1,
                          border:`1.5px solid ${C.cy}44`,color:C.cy,
                          fontSize:11,fontWeight:700}}>+5</button>
                      <button onClick={()=>doQuickAdj(p,10)} className="press"
                        style={{padding:"3px 8px",borderRadius:7,background:C.b1,
                          border:`1.5px solid ${C.b}44`,color:C.b,
                          fontSize:11,fontWeight:700}}>+10</button>
                    </div>
                  </td>
                  <td style={{padding:"11px 13px",whiteSpace:"nowrap"}}>
                    <button onClick={()=>{setStokTarget(p);setIsNewProduct(false);setStokQ("");setStokPrice("");}} className="press"
                      style={{padding:"4px 11px",background:C.g1,border:`1px solid ${C.g}33`,borderRadius:7,color:C.g,fontSize:11,fontWeight:700}}>Atur</button>
                  </td>
                </tr>)}</tbody>
              </table>
            </TableWrap>
          </div>
        </Card>

        {/* Log Stok Masuk */}
        <Card noPad style={{overflow:"hidden"}}>
          <div style={{padding:"10px 13px",borderBottom:`1px solid ${C.bo0}`}}>
            <span style={{fontSize:12,fontWeight:700,color:C.t2,textTransform:"none",letterSpacing:0}}>Log Penerimaan Stok</span>
          </div>
          {slogs.filter(l=>l.business===biz&&l.type==="masuk").length===0
            ?<EmptyState pad={24} title="Belum ada log penerimaan"/>
            :<TableWrap compact maxH="40vh">
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:400}}>
                <THead cols={["Waktu","Produk","Qty","Sblm→Ssdh","Oleh"]}/>
                <tbody>{slogs.filter(l=>l.business===biz&&l.type==="masuk").slice(0,30).map((l,i)=>(
                  <tr key={l.id} className="hrow" style={{borderTop:`1px solid ${C.bo0}`,background:i%2===0?"transparent":C.bg0}}>
                    <td style={{padding:"12px 13px",color:C.t2,fontSize:10,whiteSpace:"nowrap"}}>{l.date}</td>
                    <td style={{padding:"12px 13px",fontWeight:500}}>{l.name}</td>
                    <td style={{padding:"12px 13px",fontFamily:F.mono,fontWeight:700,color:C.g}}>+{l.qty}</td>
                    <td style={{padding:"12px 13px",fontFamily:F.mono,fontSize:10}}>{l.before}→<b>{l.after}</b></td>
                    <td style={{padding:"12px 13px",color:C.t2}}>{l.by}</td>
                  </tr>))}</tbody>
              </table>
            </TableWrap>}
        </Card>
      </div>
    </div>;
  }

  // ─────────────────────────────────────────────────────────────
  //  ADMIN SCREEN
  // ─────────────────────────────────────────────────────────────
  if(screen==="admin") {
    const IS={width:"100%",padding:"11px 13px",background:C.bg3,border:`1.5px solid ${C.bo0}`,borderRadius:10,color:C.t0,fontSize:13,fontFamily:F.mono,transition:"border-color .15s"};
    const newCustomOrdersCount = (customOrders||[]).filter(o => o && (o.status || "Baru") === "Baru").length;
    const ADMIN_TAB_GROUPS = [
      {
        id: "overview",
        title: "Utama",
        items: [
          { id: "dashboard", l: "Dashboard", ic: LayoutDashboard },
        ],
      },
      {
        id: "sales",
        title: "Pesanan & Katalog",
        items: [
          { id: "customorders", l: "Pesanan Baju", ic: Shirt, badge: newCustomOrdersCount },
          { id: "products", l: "Produk", ic: Package },
          { id: "landing", l: "Landing Page", ic: Megaphone },
        ],
      },
      {
        id: "inventory",
        title: "Inventaris & Stok",
        items: [
          { id: "opname", l: "Stock Opname", ic: ClipboardCheck },
          { id: "stoklog", l: "Log Stok", ic: ClipboardList },
          { id: "returns", l: "Retur", ic: Undo2 },
        ],
      },
      {
        id: "finance",
        title: "Keuangan",
        items: [
          { id: "laporan", l: "Laporan Penjualan", ic: Wallet },
          { id: "labarugi", l: "Laba Rugi", ic: TrendingUp },
          { id: "operasional", l: "Operasional", ic: ShoppingBasket },
        ],
      },
      {
        id: "system",
        title: "Manajemen & Tim",
        items: [
          { id: "absensi", l: "Absensi", ic: Clock },
          { id: "users", l: "Pengguna", ic: Users },
          { id: "actlog", l: "Aktivitas", ic: Activity },
        ],
      },
    ];
    const TABS = ADMIN_TAB_GROUPS.flatMap(g => g.items);
    const BNAV_TABS=[
      {id:"dashboard",ic:LayoutDashboard,label:"Dashboard"},
      {id:"products",ic:Package,label:"Produk"},
      {id:"laporan",ic:Wallet,label:"Laporan"},
      {id:"absensi",ic:Clock,label:"Absensi"},
    ];
    const MORE_TABS=[
      {id:"customorders",ic:Shirt,label:"Pesanan Baju",badge:newCustomOrdersCount},
      {id:"users",ic:Users,label:"Pengguna"},
      {id:"labarugi",ic:TrendingUp,label:"Laba Rugi"},
      {id:"operasional",ic:ShoppingBasket,label:"Operasional"},
      {id:"stoklog",ic:ClipboardList,label:"Log Stok"},
      {id:"returns",ic:Undo2,label:"Retur"},
      {id:"actlog",ic:Activity,label:"Aktivitas"},
      {id:"opname",ic:ClipboardCheck,label:"Opname"},
      {id:"landing",ic:Megaphone,label:"Landing Page"},
    ];
    const isMoreTab=MORE_TABS.some(t=>t.id===adminTab);
    const adminPs=prods.filter(p=>p.business===adminBiz&&(!searchQ||p.name.toLowerCase().includes(searchQ.toLowerCase())||p.barcode.includes(searchQ))&&(filterAdvertised?p.advertised:true));

    return <div style={{fontFamily:F.sans,background:C.bg1,color:C.t0,height:"100vh",display:"flex",flexDirection:"column"}}>
      <style>{CSS}</style><Toast n={notif}/>
      {UpdateBannerEl}
      <Header title="JE GRUP" user={user} online={online} onLogout={doLogout} lowStockCount={lowStockCount} onToggleTheme={toggleTheme} isDark={isDark} onLowStockClick={()=>setShowLowStock(true)} expireCount={nearExpiry.length} expiredCount={expiredProds.length} onExpireClick={()=>setShowExpirePopup(true)} onGoLanding={()=>setScreen("landing")} onOpenCustomizer={()=>setScreen("custom-baju")}/>

      {/* Change password modal */}
      <ExpenseFormModal open={expenseModal} onClose={()=>setExpenseModal(false)} onSave={saveExpense} access={user.access} user={user}/>
      <ProductFormModal open={pModal} editing={editPid!==null} editId={editPid} form={pForm} setForm={setPForm} prods={prods} biz={adminBiz}
        onSave={saveProd} onClose={()=>{setPModal(false);setEditPid(null);setInlineAddMode(false);}} toast={toast}/>
      {invTrx&&<Invoice receipt={invTrx} biz={invTrx.business} onClose={()=>setInvTrx(null)}/>}

      <Modal open={!!cpwdModal} size="sm" dismiss={false} onClose={()=>setCpwdModal(null)} icon={<KeyRound size={20}/>} title="Ganti password"
        subtitle={users.find(u=>u.id===cpwdModal)?.name}
        footer={<><Btn outline onClick={()=>setCpwdModal(null)}>Batal</Btn><Btn onClick={doChangePassword}>Simpan</Btn></>}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {user.role!=="admin"&&<Inp label="Password lama" type="password" value={cpwdForm.old} onChange={e=>setCpwdForm(x=>({...x,old:e.target.value}))}/>}
          <Inp label="Password baru *" type="password" value={cpwdForm.n1} onChange={e=>setCpwdForm(x=>({...x,n1:e.target.value}))}/>
          <Inp label="Konfirmasi password *" type="password" value={cpwdForm.n2} onChange={e=>setCpwdForm(x=>({...x,n2:e.target.value}))}/>
        </div>
      </Modal>

      <Modal open={!!uModal} size="md" dismiss={false} onClose={()=>setUModal(false)} icon={<User size={20}/>}
        title={editUid===null?"Tambah pengguna":"Edit pengguna"}
        footer={<><Btn outline onClick={()=>setUModal(false)}>Batal</Btn><Btn onClick={saveUser}>Simpan</Btn></>}>
        <div className="fgrid">
          <div className="full"><Inp label="Nama lengkap *" value={uForm.name||""} onChange={e=>setUForm(x=>({...x,name:e.target.value}))}/></div>
          <Inp label="Username *" value={uForm.username||""} disabled={editUid!==null} onChange={e=>setUForm(x=>({...x,username:e.target.value}))}/>
          <Inp label="Password *" type="password" value={uForm.password||""} onChange={e=>setUForm(x=>({...x,password:e.target.value}))}/>
          <Sel label="Role" value={uForm.role||"kasir"} onChange={e=>setUForm(x=>({...x,role:e.target.value}))}>
            <option value="kasir">Kasir</option><option value="stok">Stok</option><option value="admin">Admin</option>
          </Sel>
          <div>
            <div style={{fontSize:12.5,fontWeight:600,color:C.t1,marginBottom:6}}>Status akun</div>
            <button type="button" role="switch" aria-checked={!!uForm.active} onClick={()=>setUForm(x=>({...x,active:!x.active}))} className="press"
              style={{display:"flex",alignItems:"center",gap:12,minHeight:46,width:"100%",padding:"0 12px",background:C.bg3,border:`1.5px solid ${C.bo1}`,borderRadius:12,color:C.t0,fontSize:15,fontWeight:600,textAlign:"left"}}>
              <span style={{width:40,height:24,borderRadius:12,background:uForm.active?C.g:C.bg4,position:"relative",flexShrink:0,transition:"background .2s"}}>
                <span style={{position:"absolute",top:3,left:uForm.active?19:3,width:18,height:18,borderRadius:"50%",background:uForm.active?C.on:C.t2,transition:"left .2s"}}/></span>
              {uForm.active?"Aktif":"Nonaktif"}</button>
          </div>
          <div className="full">
            <div style={{fontSize:12.5,fontWeight:600,color:C.t1,marginBottom:6}}>Akses bisnis *</div>
            <div style={{display:"flex",gap:10}}>
              {Object.values(BIZ).map(b2=>{const chk=uForm.access?.includes(b2.id),isJ=b2.id==="JS_CLOTHING",cl=isJ?C.b:C.p;
                return <button key={b2.id} type="button" aria-pressed={!!chk} className="press"
                  onClick={()=>setUForm(x=>({...x,access:chk?x.access.filter(a=>a!==b2.id):[...(x.access||[]),b2.id]}))}
                  style={{flex:1,minHeight:48,borderRadius:12,fontWeight:700,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                    background:chk?(isJ?C.b1:C.p1):"transparent",border:`2px solid ${chk?cl:C.bo1}`,color:chk?cl:C.t2}}>
                  <Ico e={b2.icon} size={17}/>{b2.name}</button>;})}
            </div>
          </div>
        </div>
      </Modal>

      {showLowStock&&<LowStockPopup prods={prods} onClose={()=>setShowLowStock(false)}/>}
      {showExpirePopup&&<ExpirePopup nearExpiry={nearExpiry} expiredProds={expiredProds} onClose={()=>setShowExpirePopup(false)}/>}

      {/* Modal Preview Desain Baju Custom */}
      {previewOrder && (
        <Modal
          open
          size="lg"
          onClose={() => setPreviewOrder(null)}
          icon={<Shirt size={20} />}
          title={`Desain Baju: ${previewOrder.customerName || "Customer"}`}
          subtitle={`${previewOrder.garment?.name || "Baju"} • ${previewOrder.color?.name || ""} (${previewOrder.orderCode || previewOrder.id})`}
          footer={
            <>
              {previewOrder.mockupImage && (
                <Btn
                  outline
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = previewOrder.mockupImage;
                    a.download = `Desain-${(previewOrder.customerName || "Order").replace(/\s+/g, "_")}-${previewOrder.orderCode || "Mockup"}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                >
                  <Download size={16} /> Unduh Mockup PNG
                </Btn>
              )}
              {previewOrder.customerPhone && (
                <button
                  type="button"
                  onClick={() => {
                    const num = String(previewOrder.customerPhone).replace(/\D/g, "");
                    const text = `Halo Kak ${previewOrder.customerName}, kami dari JE Grup (JS Clothing) sedang memeriksa pesanan custom baju ${previewOrder.garment?.name || ""} Anda (${previewOrder.orderCode || ""}).`;
                    window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, "_blank");
                  }}
                  className="press"
                  style={{
                    padding: "8px 14px",
                    borderRadius: 10,
                    background: "#25D366",
                    color: "#FFF",
                    fontWeight: 700,
                    fontSize: 13,
                    border: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                  }}
                >
                  <MessageCircle size={16} /> Hubungi via WA
                </button>
              )}
              <Btn outline onClick={() => setPreviewOrder(null)}>Tutup</Btn>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Mockup Full-Size Image */}
            {previewOrder.mockupImage ? (
              <div
                style={{
                  width: "100%",
                  borderRadius: 14,
                  overflow: "hidden",
                  border: `1px solid ${C.bo1}`,
                  background: "#182046",
                  boxShadow: C.sh1,
                }}
              >
                <img
                  src={previewOrder.mockupImage}
                  alt="Desain Kustom Baju"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </div>
            ) : (
              <div style={{ padding: 24, textAlign: "center", background: C.bg3, borderRadius: 12, color: C.t2 }}>
                Mockup gambar belum diunggah atau tidak tersedia.
              </div>
            )}

            {/* Spesifikasi Pesanan */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              <div style={{ background: C.bg3, padding: "10px 14px", borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: C.t2 }}>Pemesan</div>
                <div style={{ fontSize: 13.5, fontWeight: 800, marginTop: 2 }}>{previewOrder.customerName || "-"}</div>
                {previewOrder.customerPhone && <div style={{ fontSize: 11.5, color: C.pri, marginTop: 2 }}>📞 {previewOrder.customerPhone}</div>}
              </div>
              <div style={{ background: C.bg3, padding: "10px 14px", borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: C.t2 }}>Model & Warna Baju</div>
                <div style={{ fontSize: 13.5, fontWeight: 800, marginTop: 2 }}>{previewOrder.garment?.name}</div>
                <div style={{ fontSize: 11.5, color: C.t1, marginTop: 2 }}>{previewOrder.color?.name} ({previewOrder.sides || "Depan"})</div>
              </div>
              <div style={{ background: C.bg3, padding: "10px 14px", borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: C.t2 }}>Jumlah & Ukuran</div>
                <div style={{ fontSize: 13.5, fontWeight: 800, marginTop: 2 }}>
                  {previewOrder.sizeBreakdown ? Object.entries(previewOrder.sizeBreakdown).filter(([_, q]) => q > 0).map(([s, q]) => `${s}: ${q} pcs`).join(", ") : `${previewOrder.totalPieces || 1} pcs`}
                </div>
                <div style={{ fontSize: 11.5, color: C.g, fontWeight: 700, marginTop: 2 }}>
                  Total: {previewOrder.totalPieces || 1} pcs • {rp(previewOrder.estimatedPrice || 0)}
                </div>
              </div>
            </div>

            {previewOrder.notes && (
              <div style={{ background: C.bg3, padding: "10px 14px", borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: C.t2, fontWeight: 700 }}>Catatan Pemesan:</div>
                <div style={{ fontSize: 13, color: C.t0, marginTop: 3 }}>"{previewOrder.notes}"</div>
              </div>
            )}
          </div>
        </Modal>
      )}

      
      {/* More drawer (mobile) */}
      {showMoreDrawer&&<div className="drawer-overlay" onClick={()=>setShowMoreDrawer(false)}>
        <div className="drawer" onClick={e=>e.stopPropagation()}>
          <div style={{width:40,height:4,background:C.bo2,borderRadius:2,margin:"14px auto 0"}}/>
          <div style={{padding:"10px 20px 2px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,fontWeight:800,color:C.t1,letterSpacing:0,textTransform:"none"}}>Menu Lainnya</span>
            <button onClick={()=>setShowMoreDrawer(false)} style={{background:"transparent",border:"none",color:C.t2,fontSize:18,cursor:"pointer",padding:"2px 6px",lineHeight:1}}><Ico e="✕"/></button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12,padding:"10px 16px 14px",maxHeight:"70vh",overflowY:"auto"}}>
            {ADMIN_TAB_GROUPS.map(g=>{
              const items = g.items.filter(t => !BNAV_TABS.some(b => b.id === t.id));
              if(!items.length) return null;
              return (
                <div key={g.id}>
                  <div style={{fontSize:11,fontWeight:800,letterSpacing:"0.05em",textTransform:"uppercase",color:C.t3,marginBottom:6,paddingLeft:2}}>
                    {g.title}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                    {items.map(t=>{
                      const isAct = adminTab === t.id;
                      return (
                        <button key={t.id} onClick={()=>{setAdminTab(t.id);setSearchQ("");setPModal(false);setShowMoreDrawer(false);setEditPid(null);setInlineAddMode(false);}} className="press ripple-wrap"
                          style={{padding:"14px 6px 10px",background:isAct?C.pri1:C.bg3,border:`1.5px solid ${isAct?C.pri:C.bo0}`,borderRadius:14,
                            display:"flex",flexDirection:"column",alignItems:"center",gap:5,cursor:"pointer",position:"relative",transition:"all .15s"}}>
                          {t.badge > 0 && (
                            <span style={{position:"absolute",top:6,right:8,padding:"2px 6px",borderRadius:10,background:C.a,color:"#FFF",fontSize:10.5,fontWeight:800,lineHeight:1}}>
                              {t.badge}
                            </span>
                          )}
                          <t.ic size={22} strokeWidth={isAct?2.2:1.8} color={isAct?C.pri:C.t1}/>
                          <span style={{fontSize:12,fontWeight:isAct?700:600,color:isAct?C.pri:C.t1,textAlign:"center",lineHeight:1.2}}>{t.l}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>}

      <div className="admin-body">
      <AdminSidebar groups={ADMIN_TAB_GROUPS} tabs={TABS} active={adminTab} onSelect={id=>{setAdminTab(id);setSearchQ("");setPModal(false);setShowMoreDrawer(false);setEditPid(null);setInlineAddMode(false);}}/>
      <div className="admin-content">


        {/* ── DASHBOARD ── */}
        {adminTab==="dashboard"&&<div className="dash">
          <h2 style={{fontSize:15,fontWeight:800}}>Dashboard</h2>
          {/* Desktop stat grid */}
          <div className="hide-mobile stat-grid-4" style={{display:"grid",gap:8}}>
            <Stat icon="💰" label="Pendapatan Hari Ini" color={C.g}
              value={rp(trxs.filter(t=>{const d=parseD(t.date);return d&&!isNaN(d.getTime())&&d.toDateString()===new Date().toDateString();}).reduce((s,t)=>s+t.total,0))}/>
            <Stat icon="🧾" label="Transaksi Hari Ini" color={C.cy}
              value={trxs.filter(t=>{const d=parseD(t.date);return d&&!isNaN(d.getTime())&&d.toDateString()===new Date().toDateString();}).length}/>
            <Stat icon="📦" label="Total Produk" color={C.b} value={prods.length} sub={`${lowStockCount} stok menipis`}/>
            <Stat icon="🕐" label="Hadir Hari Ini" color={C.a} value={attend.filter(a=>a.date===todayDate()).length}/>
          </div>
          {/* Mobile stat cards */}
          {(()=>{
            const todayTrx=trxs.filter(t=>{const d=parseD(t.date);return d&&!isNaN(d.getTime())&&d.toDateString()===new Date().toDateString();});
            const todayRev=todayTrx.reduce((s,t)=>s+t.total,0);
            const hadir=attend.filter(a=>a.date===todayDate()).length;
            return <div className="hide-desktop" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[
                {ic:"💰",lbl:"Pendapatan Hari Ini",val:rp(todayRev),color:C.g,glow:C.g},
                {ic:"🧾",lbl:"Transaksi Hari Ini",val:todayTrx.length,color:C.cy,glow:C.cy},
                {ic:"📦",lbl:"Total Produk",val:prods.length,sub:lowStockCount>0?`${lowStockCount} menipis`:null,color:C.b,glow:C.b},
                {ic:"🕐",lbl:"Hadir Hari Ini",val:hadir,color:C.a,glow:C.a},
              ].map((s,i)=><div key={i} className="stat-mobile card-in" style={{"--stat-glow":s.glow}}>
                <span className="stat-ico" style={{background:(s.color||C.pri)+"1F",color:s.color||C.pri}}><Ico e={s.ic} size={18}/></span>
                <span className="stat-lbl">{s.lbl}</span>
                <span className="stat-val" style={{color:s.color}}>{s.val}</span>
                {s.sub&&<span style={{fontSize:10,color:C.r,fontWeight:600,marginTop:1}}>{s.sub}</span>}
              </div>)}
            </div>;
          })()}
          {/* Targets */}
          {targets.filter(t=>t.period===currMonth).length>0&&<Card>
            <div style={{fontSize:12,fontWeight:700,color:C.t2,textTransform:"none",letterSpacing:0,marginBottom:12}}><Ico e="🎯"/> Target Penjualan Bulan Ini</div>
            {Object.values(BIZ).map(b2=>{
              const tgt=targets.find(t=>t.business===b2.id&&t.period===currMonth);if(!tgt) return null;
              const rev=monthRevByBiz[b2.id]||0;const isJ=b2.id==="JS_CLOTHING";
              return <div key={b2.id} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6}}>
                  <span style={{fontWeight:600}}><Ico e={b2.icon}/> {b2.name}</span>
                  <span className="mn" style={{color:isJ?C.b:C.p}}>{rp(rev)} / {rp(tgt.amount)}</span>
                </div>
                <ProgressBar value={rev} max={tgt.amount} color={isJ?C.b:C.p}/>
              </div>;})}
          </Card>}
          {/* Stok menipis */}
          {lowStockCount>0&&(()=>{
            const dList = prods.filter(p=>p.stock<10).sort((a,b)=>a.stock-b.stock);
            const dPerPage = lowStockPer===0 ? Math.max(1,dList.length) : lowStockPer;
            const dTotalPages = Math.max(1, Math.ceil(dList.length / dPerPage));
            const dCurPage = Math.min(lowStockPage, dTotalPages);
            const dPaginated = dList.slice((dCurPage - 1) * dPerPage, dCurPage * dPerPage);
            return <Card accent={C.r} className="dash-half">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:12,fontWeight:700,color:C.r,textTransform:"none",letterSpacing:0}}>
                  <Ico e="⚠"/> Stok Menipis ({lowStockCount})
                </div>
                {dTotalPages > 1 && (
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <button className="press" disabled={dCurPage <= 1} onClick={()=>setLowStockPage(p=>Math.max(1, p-1))}
                      style={{padding:"2px 6px",borderRadius:6,border:`1px solid ${C.bo1}`,background:dCurPage<=1?C.bg3:"transparent",color:dCurPage<=1?C.t3:C.t0,fontSize:11,fontWeight:700,display:"inline-flex",alignItems:"center"}}>
                      <ChevronLeft size={13}/>
                    </button>
                    <span className="mn" style={{fontSize:11,fontWeight:700,color:C.t2,padding:"0 2px"}}>
                      {dCurPage}/{dTotalPages}
                    </span>
                    <button className="press" disabled={dCurPage >= dTotalPages} onClick={()=>setLowStockPage(p=>Math.min(dTotalPages, p+1))}
                      style={{padding:"2px 6px",borderRadius:6,border:`1px solid ${C.bo1}`,background:dCurPage>=dTotalPages?C.bg3:"transparent",color:dCurPage>=dTotalPages?C.t3:C.t0,fontSize:11,fontWeight:700,display:"inline-flex",alignItems:"center"}}>
                      <ChevronRight size={13}/>
                    </button>
                  </div>
                )}
              </div>
              {dPaginated.map(p=><div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderTop:`1px solid ${C.bo0}`,fontSize:12.5}}>
                <span style={{fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginRight:8}}>{p.name}</span>
                <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}><BizChip biz={p.business} sm/><StockBadge s={p.stock}/></div>
              </div>)}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap",paddingTop:10,marginTop:4,borderTop:`1px solid ${C.bo0}`,fontSize:12,color:C.t2}}>
                <label style={{display:"flex",alignItems:"center",gap:6}}>
                  Tampilkan
                  <select value={lowStockPer} onChange={e=>{const v=Number(e.target.value);setLowStockPer(v);setLowStockPage(1);localStorage.setItem("je_lowstock_per",String(v));}}
                    style={{padding:"4px 8px",borderRadius:8,background:C.bg3,border:`1.5px solid ${C.bo1}`,color:C.t0,fontSize:12,fontWeight:700,fontFamily:F.sans}}>
                    {[5,10,20,50].map(n=><option key={n} value={n}>{n}</option>)}
                    <option value={0}>Semua</option>
                  </select>
                  <span className="mn">{(dCurPage-1)*dPerPage+1}–{Math.min(dCurPage*dPerPage,dList.length)} dari {dList.length}</span>
                </label>
                <button onClick={()=>setShowLowStock(true)} className="press"
                  style={{padding:"5px 10px",borderRadius:8,border:`1px solid ${C.r}55`,background:C.r1,color:C.r,fontSize:12,fontWeight:700,display:"inline-flex",alignItems:"center",gap:4}}>
                  Lihat semua <ChevronRight size={13}/>
                </button>
              </div>
            </Card>;
          })()}
          {/* Today attendance */}
          <Card className="dash-half">
            <div style={{fontSize:12,fontWeight:700,color:C.t2,textTransform:"none",letterSpacing:0,marginBottom:10}}><Ico e="🕐"/> Kehadiran Hari Ini</div>
            {attend.filter(a=>a.date===todayDate()).length===0
              ?<p style={{fontSize:12,color:C.t3}}>Belum ada pegawai yang absen hari ini</p>
              :attend.filter(a=>a.date===todayDate()).map(a=><div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderTop:`1px solid ${C.bo0}`,fontSize:12.5}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <Avatar name={a.name} size={26}/>
                  <div><div style={{fontWeight:600}}>{a.name}</div><div style={{fontSize:10,color:C.t2}}>{a.checkIn}</div></div>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <BizChip biz={a.business} sm/>
                  {a.checkOut?<span style={{fontSize:10,color:C.g,fontWeight:600}}><Ico e="✓"/> Pulang</span>:<span style={{fontSize:10,color:C.a,fontWeight:600}}>● Hadir</span>}
                </div>
              </div>)}
          </Card>
          {/* Target management */}
          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:700,color:C.t2,textTransform:"none",letterSpacing:0}}><Ico e="🎯"/> Kelola Target</div>
              <button onClick={()=>setTargetModal(true)} className="press" style={{padding:"5px 12px",background:C.g1,border:`1px solid ${C.g}33`,borderRadius:7,color:C.g,fontSize:11,fontWeight:700,fontFamily:F.sans}}>+ Set Target</button>
            </div>
            <Modal open={!!targetModal} size="md" onClose={()=>setTargetModal(false)} icon={<Target size={20}/>} title="Set target penjualan">
              <div className="fgrid" style={{marginBottom:16}}>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:C.t2,marginBottom:4,textTransform:"none",letterSpacing:0}}>Bisnis</div>
                  <select value={targetForm.business} onChange={e=>setTargetForm(x=>({...x,business:e.target.value}))} style={{width:"100%",padding:"10px",background:C.bg2,border:`1.5px solid ${C.bo0}`,borderRadius:8,color:C.t0,fontSize:12,fontFamily:F.sans}}>
                    {Object.values(BIZ).map(b2=><option key={b2.id} value={b2.id}><Ico e={b2.icon}/> {b2.name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:C.t2,marginBottom:4,textTransform:"none",letterSpacing:0}}>Periode</div>
                  <input type="month" value={targetForm.period} onChange={e=>setTargetForm(x=>({...x,period:e.target.value}))}
                    style={{width:"100%",padding:"10px",background:C.bg2,border:`1.5px solid ${C.bo0}`,borderRadius:8,color:C.t0,fontSize:12}}/>
                </div>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:C.t2,marginBottom:4,textTransform:"none",letterSpacing:0}}>Target (Rp)</div>
                  <input type="number" value={targetForm.amount} onChange={e=>setTargetForm(x=>({...x,amount:e.target.value}))}
                    placeholder="0" style={{width:"100%",padding:"10px",background:C.bg2,border:`1.5px solid ${C.bo0}`,borderRadius:8,color:C.t0,fontSize:12,fontFamily:F.mono}}/>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <Btn onClick={async()=>{
                  if(!targetForm.period||!targetForm.amount){toast("Isi semua field","warn");return;}
                  await fbSetTarget({id:`${targetForm.business}-${targetForm.period}`,
                    business:targetForm.business,period:targetForm.period,amount:+targetForm.amount});
                  setTargetModal(false);toast("✓ Target disimpan");
                }}>Simpan</Btn>
                <Btn onClick={()=>setTargetModal(false)} outline>Batal</Btn>
              </div>
            </Modal>
            {targets.length===0?<p style={{fontSize:12,color:C.t3}}>Belum ada target tersimpan</p>
            :targets.map(t=><div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderTop:`1px solid ${C.bo0}`,fontSize:12}}>
              <div><BizChip biz={t.business} sm/><span style={{marginLeft:8,color:C.t2}}>{t.period}</span></div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span className="mn" style={{color:C.g}}>{rp(t.amount)}</span>
                <button onClick={()=>fbDeleteTarget(t.id).then(()=>toast("Target dihapus","warn"))} className="press" style={{padding:"2px 8px",background:C.r1,border:`1px solid ${C.r}22`,borderRadius:5,color:C.r,fontSize:10}}>×</button>
              </div>
            </div>)}
          </Card>
        </div>}


        {/* ── PENGGUNA ── */}
        {adminTab==="users"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
            <div><h2 style={{fontSize:15,fontWeight:800}}>Database Pengguna</h2></div>
            <Btn onClick={openAddU} size="sm">+ Tambah</Btn>
          </div>
          {/* Desktop table */}
          <div className="hide-mobile">
            <Card noPad style={{overflow:"hidden"}}>
              <TableWrap>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:600}}>
                  <THead cols={["#","Username","Nama","Role","Akses","Wajah","Status","Aksi"]}/>
                  <tbody>{users.map((u,i)=><tr key={u.id} className="hrow" style={{borderTop:`1px solid ${C.bo0}`,background:i%2===0?"transparent":C.bg0}}>
                    <td style={{padding:"14px 13px",fontFamily:F.mono,color:C.t3,fontSize:10}}>{u.id}</td>
                    <td style={{padding:"14px 13px",fontFamily:F.mono,fontSize:11}}>{u.username}</td>
                    <td style={{padding:"14px 13px",fontWeight:600}}>{u.name}</td>
                    <td style={{padding:"14px 13px"}}><RoleTag role={u.role}/></td>
                    <td style={{padding:"14px 13px"}}><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{u.access?.map(a=><BizChip key={a} biz={a} sm/>)}</div></td>
                    <td style={{padding:"14px 13px"}}>
                      {u.role==="admin"?<span style={{fontSize:10,color:C.t3}}>N/A</span>
                      :u.faceDescriptor?<span style={{fontSize:10,color:C.g,fontWeight:700}}><Ico e="✓"/> Ada</span>
                      :<button onClick={()=>setFaceReg(u.id)} className="press" style={{padding:"3px 9px",background:C.a1,border:`1px solid ${C.a}33`,borderRadius:6,color:C.a,fontSize:10,fontWeight:700}}>Daftarkan</button>}
                    </td>
                    <td style={{padding:"14px 13px"}}>
                      <span style={{padding:"2px 8px",borderRadius:20,fontSize:9.5,fontWeight:700,background:u.active?C.g1:C.r1,color:u.active?C.g:C.r}}>{u.active?"AKTIF":"OFF"}</span>
                    </td>
                    <td style={{padding:"14px 13px",whiteSpace:"nowrap"}}>
                      <button onClick={()=>openEditU(u)} className="press" style={{marginRight:4,padding:"3px 9px",background:"transparent",border:`1px solid ${C.bo1}`,borderRadius:6,color:C.t0,fontSize:10}}>Edit</button>
                      <button onClick={()=>{setCpwdModal(u.id);setCpwdForm({old:"",n1:"",n2:""}); }} className="press" style={{marginRight:4,padding:"3px 9px",background:C.a1,border:`1px solid ${C.a}22`,borderRadius:6,color:C.a,fontSize:10}}><Ico e="🔑"/></button>
                      {u.faceDescriptor&&u.role!=="admin"&&<button onClick={()=>{fbUpdateUser(u.id,{...u,faceDescriptor:null},user.name);toast("Wajah direset","warn");}} className="press" style={{marginRight:4,padding:"3px 9px",background:C.b1,border:`1px solid ${C.b}22`,borderRadius:6,color:C.b,fontSize:10}}>Reset</button>}
                      <button onClick={()=>delUser(u)} className="press" style={{padding:"3px 9px",background:C.r1,border:`1px solid ${C.r}22`,borderRadius:6,color:C.r,fontSize:10}}>Hapus</button>
                    </td>
                  </tr>)}</tbody>
                </table>
              </TableWrap>
            </Card>
          </div>
          {/* Mobile card list */}
          <div className="hide-desktop mobile-card-list">
            {users.map((u,_ui)=><div key={u.id} className="mcard card-in" style={{background:C.bg2,borderRadius:16,border:`1px solid ${C.bo0}`,padding:"14px 15px"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                <Avatar name={u.name} size={44}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:15,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.name}</div>
                  <div style={{display:"flex",gap:6,alignItems:"center",marginTop:3,flexWrap:"wrap"}}>
                    <span className="mn" style={{fontSize:11,color:C.t2}}>@{u.username}</span>
                    <RoleTag role={u.role}/>
                    <span style={{padding:"1px 7px",borderRadius:20,fontSize:9.5,fontWeight:700,background:u.active?C.g1:C.r1,color:u.active?C.g:C.r}}>{u.active?"AKTIF":"OFF"}</span>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
                {u.access?.map(a=><BizChip key={a} biz={a} sm/>)}
                {u.role!=="admin"&&(u.faceDescriptor
                  ?<span style={{padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:C.g1,color:C.g}}><Ico e="👁"/> Wajah terdaftar</span>
                  :<span style={{padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:C.a1,color:C.a}}><Ico e="⚠"/> Belum ada wajah</span>)}
              </div>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                <button onClick={()=>openEditU(u)} className="press" style={{flex:1,padding:"10px",background:"transparent",border:`1.5px solid ${C.bo1}`,borderRadius:10,color:C.t0,fontSize:12,fontWeight:600,fontFamily:F.sans}}><Ico e="✏️"/> Edit</button>
                <button onClick={()=>{setCpwdModal(u.id);setCpwdForm({old:"",n1:"",n2:""});}} className="press" style={{flex:1,padding:"10px",background:C.a1,border:`1.5px solid ${C.a}33`,borderRadius:10,color:C.a,fontSize:12,fontWeight:600,fontFamily:F.sans}}><Ico e="🔑"/> Password</button>
                {u.role!=="admin"&&!u.faceDescriptor&&<button onClick={()=>setFaceReg(u.id)} className="press" style={{flex:1,padding:"10px",background:C.b1,border:`1.5px solid ${C.b}33`,borderRadius:10,color:C.b,fontSize:12,fontWeight:600,fontFamily:F.sans}}><Ico e="📷"/> Daftarkan</button>}
                {u.faceDescriptor&&u.role!=="admin"&&<button onClick={()=>{fbUpdateUser(u.id,{...u,faceDescriptor:null},user.name);toast("Wajah direset","warn");}} className="press" style={{padding:"10px 14px",background:C.b1,border:`1.5px solid ${C.b}33`,borderRadius:10,color:C.b,fontSize:12,fontFamily:F.sans}}>Reset Wajah</button>}
                <button onClick={()=>delUser(u)} className="press" style={{padding:"10px 14px",background:C.r1,border:`1.5px solid ${C.r}33`,borderRadius:10,color:C.r,fontSize:12,fontFamily:F.sans}}><Ico e="🗑"/></button>
              </div>
            </div>)}
          </div>
        </div>}

        {/* ── PRODUK ── */}
        {adminTab==="products"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div className="ptool" style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
            {Object.values(BIZ).map(b2=>{const isJ=b2.id==="JS_CLOTHING",active=adminBiz===b2.id;
              return <button key={b2.id} onClick={()=>{setAdminBiz(b2.id);setSearchQ("");setPModal(false);setEditPid(null);setInlineAddMode(false);}} className="press"
                style={{padding:"7px 14px",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:12,background:active?(isJ?C.b1:C.p1):"transparent",border:`2px solid ${active?(isJ?C.b:C.p):C.bo0}`,color:active?(isJ?C.b:C.p):C.t2,fontFamily:F.sans}}>
                <Ico e={b2.icon}/> {b2.name}</button>;})}
            <input className="ptool-search" value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Cari produk..."
              style={{padding:"7px 11px",background:C.bg2,border:`1px solid ${C.bo0}`,borderRadius:8,color:C.t0,fontSize:12,width:140,fontFamily:F.sans}}/>
            <button onClick={()=>setFilterAdvertised(f=>!f)} className="press"
              style={{padding:"7px 13px",background:filterAdvertised?C.pri1:C.bg3,border:`1.5px solid ${filterAdvertised?C.pri:C.bo0}`,borderRadius:8,color:filterAdvertised?C.pri:C.t1,fontSize:12,fontWeight:700,fontFamily:F.sans,display:"flex",alignItems:"center",gap:6}}>
              <Megaphone size={14}/> {filterAdvertised?"Semua Produk":"Hanya Iklan"}
            </button>
            <button onClick={()=>setScreen("landing")} className="press hide-mobile"
              style={{padding:"7px 11px",background:C.bg3,border:`1px solid ${C.bo0}`,borderRadius:8,color:C.t2,fontSize:12,fontWeight:600,fontFamily:F.sans,display:"flex",alignItems:"center",gap:5}}>
              <ExternalLink size={13}/> Preview Etalase
            </button>
            <button onClick={()=>downloadXLSX(adminPs,[
              {key:"barcode",label:"Barcode",w:14},{key:"name",label:"Nama Produk",w:28},
              {key:"category",label:"Kategori",w:16},{key:"hpp",label:"HPP (Rp)",fn:r=>r.hpp||0,num:true,w:16},
              {key:"price",label:"Harga Jual (Rp)",fn:r=>r.price,num:true,w:18},{key:"stock",label:"Stok",fn:r=>r.stock,num:true,w:10},
              {key:"business",label:"Bisnis",fn:r=>BIZ[r.business]?.name||r.business,w:14},
              {key:"margin",label:"Margin %",fn:r=>r.price>0?(((r.price-(r.hpp||0))/r.price)*100).toFixed(1)+"%":"0%",w:12},
              {key:"expireDate",label:"Tanggal Expire",fn:r=>r.expireDate||"",w:16},
            ],"Produk","produk_"+adminBiz)} className="press"
              style={{padding:"7px 12px",background:C.g1,border:`1px solid ${C.g}33`,borderRadius:8,color:C.g,fontSize:12,fontWeight:700,fontFamily:F.sans}}>⬇ Excel</button>
            <button onClick={()=>{setImportModal(true);setImportRows([]);setImportErr("");}} className="press"
              style={{padding:"7px 12px",background:C.vi1,border:`1px solid ${C.vi}33`,borderRadius:8,color:C.vi,fontSize:12,fontWeight:700,fontFamily:F.sans}}>⬆ Import</button>
            <Btn onClick={openAddP} size="sm">+ Tambah</Btn>
          </div>
          {/* Import Modal */}
          {importModal&&<Modal open size="lg" dismiss={false} onClose={()=>{setImportModal(false);setImportRows([]);setImportErr("");}} icon={<Upload size={20}/>} title="Import produk dari file"
            footer={<><Btn outline onClick={()=>{setImportModal(false);setImportRows([]);setImportErr("");}}>Batal</Btn>
              <Btn color={C.vi} disabled={!importRows.length||importLoading} onClick={doImportProducts}>{importLoading?"Mengimport…":`Import ${importRows.length} produk`}</Btn></>}>
              <p style={{fontSize:12,color:C.t2,marginBottom:16,lineHeight:1.7}}>Upload file <b>.xlsx</b> atau <b>.csv</b>. Kolom yang dikenali: <span className="mn" style={{color:C.cy}}>Barcode, Nama, Kategori, Harga Jual, HPP, Stok, Bisnis</span></p>
              {/* Template download */}
              <div style={{padding:"10px 14px",background:C.bg3,borderRadius:10,border:`1px solid ${C.bo0}`,marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <div>
                  <div style={{fontSize:12,fontWeight:700}}>Template Excel</div>
                  <div style={{fontSize:11,color:C.t2,marginTop:2}}>Download template untuk panduan format kolom</div>
                </div>
                <button onClick={()=>downloadXLSX([
                  {barcode:"JSC999",name:"Contoh Produk",category:"Kaos",price:50000,hpp:30000,stock:100,business:"JS Clothing"},
                  {barcode:"JBS999",name:"Contoh Skincare",category:"Serum",price:120000,hpp:75000,stock:50,business:"JB Store",expireDate:"2025-12-31"},
                ],[
                  {key:"barcode",label:"Barcode",w:14},{key:"name",label:"Nama",w:28},
                  {key:"category",label:"Kategori",w:16},{key:"price",label:"Harga Jual",fn:r=>r.price,num:true,w:14},
                  {key:"hpp",label:"HPP",fn:r=>r.hpp,num:true,w:14},{key:"stock",label:"Stok",fn:r=>r.stock,num:true,w:10},
                  {key:"business",label:"Bisnis",fn:r=>r.business,w:16},
                  {key:"expireDate",label:"Tanggal Expire",fn:r=>r.expireDate||"",w:16},
                ],"Template","template_import_produk")}
                  className="press" style={{padding:"7px 14px",background:C.g1,border:`1px solid ${C.g}33`,borderRadius:8,color:C.g,fontSize:12,fontWeight:700,fontFamily:F.sans}}>⬇ Template</button>
              </div>
              {/* Bisnis target */}
              <div style={{marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:700,color:C.t2,textTransform:"none",letterSpacing:0,marginBottom:8}}>Target Bisnis (default jika kolom Bisnis kosong)</div>
                <div style={{display:"flex",gap:7}}>
                  {Object.values(BIZ).map(b2=>{const isJ=b2.id==="JS_CLOTHING",active=adminBiz===b2.id;
                    return <button key={b2.id} onClick={()=>setAdminBiz(b2.id)} className="press"
                      style={{flex:1,padding:"9px",borderRadius:9,fontWeight:700,fontSize:12,cursor:"pointer",
                        background:active?(isJ?C.b1:C.p1):"transparent",border:`2px solid ${active?(isJ?C.b:C.p):C.bo0}`,
                        color:active?(isJ?C.b:C.p):C.t2,fontFamily:F.sans}}><Ico e={b2.icon}/> {b2.name}</button>;})}
                </div>
              </div>
              {/* File drop zone */}
              <div onClick={()=>importFileRef.current?.click()}
                style={{border:`2px dashed ${importRows.length?C.g:C.vi}55`,borderRadius:14,padding:"28px 16px",textAlign:"center",cursor:"pointer",
                  background:importRows.length?C.g2:`${C.vi}08`,marginBottom:12,transition:"all .2s"}}>
                <input ref={importFileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}}
                  onChange={e=>{if(e.target.files[0])handleImportFile(e.target.files[0]);e.target.value="";}}/>
                {importRows.length>0
                  ?<div>
                    <div style={{fontSize:28,marginBottom:6}}><Ico e="✅" size={28}/></div>
                    <div style={{fontSize:14,fontWeight:700,color:C.g}}>{importRows.length} produk siap diimport</div>
                    <div style={{fontSize:11,color:C.t2,marginTop:4}}>Klik untuk ganti file</div>
                  </div>
                  :<div>
                    <div style={{fontSize:32,marginBottom:8,opacity:.5}}><Ico e="📂" size={32}/></div>
                    <div style={{fontSize:13,fontWeight:600,color:C.vi}}>Klik untuk pilih file</div>
                    <div style={{fontSize:11,color:C.t2,marginTop:4}}>.xlsx · .xls · .csv</div>
                  </div>}
              </div>
              {importErr&&<div style={{padding:"9px 13px",background:C.r1,borderRadius:8,border:`1px solid ${C.r}33`,fontSize:12,color:C.r,marginBottom:12}}><Ico e="⚠"/> {importErr}</div>}
              {/* Preview */}
              {importRows.length>0&&<div style={{marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:700,color:C.t2,textTransform:"none",letterSpacing:0,marginBottom:8}}>Preview ({Math.min(importRows.length,5)} dari {importRows.length})</div>
                <div style={{background:C.bg3,borderRadius:10,border:`1px solid ${C.bo0}`,overflow:"hidden"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 80px 80px 60px",padding:"8px 12px",borderBottom:`1px solid ${C.bo0}`,fontSize:9.5,fontWeight:700,color:C.t3,textTransform:"uppercase",letterSpacing:.5}}>
                    <span>Barcode</span><span>Nama</span><span>Harga</span><span>HPP</span><span>Stok</span>
                  </div>
                  {importRows.slice(0,5).map((r,i)=>(
                    <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 80px 80px 60px",padding:"8px 12px",borderTop:i>0?`1px solid ${C.bo0}`:undefined,fontSize:11.5}}>
                      <span className="mn" style={{color:C.t2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.barcode}</span>
                      <span style={{fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</span>
                      <span className="mn" style={{color:C.g}}>{r.price?rp(r.price):"-"}</span>
                      <span className="mn" style={{color:C.a}}>{r.hpp?rp(r.hpp):"-"}</span>
                      <span className="mn">{r.stock||0}</span>
                    </div>
                  ))}
                  {importRows.length>5&&<div style={{padding:"6px 12px",fontSize:11,color:C.t3,borderTop:`1px solid ${C.bo0}`}}>...dan {importRows.length-5} produk lainnya</div>}
                </div>
                {/* Duplicate warning */}
                {(()=>{const dups=importRows.filter(r=>prods.find(p=>p.barcode===r.barcode));
                  return dups.length>0&&<div style={{marginTop:8,padding:"8px 12px",background:C.a1,borderRadius:8,border:`1px solid ${C.a}33`,fontSize:11.5,color:C.a}}>
                    <Ico e="⚠"/> {dups.length} barcode sudah ada dan akan dilewati (tidak di-overwrite)
                  </div>;})()} 
              </div>}
          </Modal>}
          {/* Scan cari produk */}
          <div style={{display:"flex",gap:8,alignItems:"center",padding:"10px 14px",background:C.bg2,borderRadius:12,border:`1px solid ${C.bo0}`}}>
            <span style={{fontSize:12,color:C.t2,fontWeight:600,whiteSpace:"nowrap"}}><Ico e="🔍"/> Scan/Cari:</span>
            <div style={{flex:1,position:"relative"}}>
              <input value={adminScanQ} onChange={e=>setAdminScanQ(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"){const bc=adminScanQ.trim();
                  const found=prods.find(p=>p.barcode===bc&&p.business===adminBiz)||prods.find(p=>p.name.toLowerCase().includes(bc.toLowerCase())&&p.business===adminBiz);
                  if(found){openEditP(found);setAdminScanQ("");}else toast("Produk tidak ditemukan: "+bc,"warn");}}}
                placeholder="Scan atau cari produk"
                style={{width:"100%",padding:"10px 12px",background:C.bg3,border:`1.5px solid ${C.bo1}`,borderRadius:9,color:C.t0,fontSize:13,fontFamily:F.mono}}/>

              {/* Autocomplete Suggestions Admin */}
              {adminScanQ.trim().length > 1 && (
                <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:100,background:C.bg2,border:`1px solid ${C.bo1}`,borderRadius:12,marginTop:6,boxShadow:C.sh2,overflow:"hidden",animation:"fadeUp 0.2s ease"}}>
                  {prods.filter(p => p.business === adminBiz && (p.name.toLowerCase().includes(adminScanQ.trim().toLowerCase()) || p.barcode.includes(adminScanQ.trim()))).slice(0, 5).map((p, i) => (
                    <div key={p.id} onClick={() => { openEditP(p); setAdminScanQ(""); }} className="hrow"
                      style={{padding:"10px 14px",cursor:"pointer",borderTop:i>0?`1px solid ${C.bo0}`:undefined,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <div style={{fontWeight:600,fontSize:13}}>{p.name}</div>
                        <div className="mn" style={{fontSize:10,color:C.t2,marginTop:2}}>{p.barcode}</div>
                      </div>
                      <div className="mn" style={{color:C.g,fontWeight:700,fontSize:13}}>{rp(p.price)}</div>
                    </div>
                  ))}
                  {prods.filter(p => p.business === adminBiz && (p.name.toLowerCase().includes(adminScanQ.trim().toLowerCase()) || p.barcode.includes(adminScanQ.trim()))).length === 0 && (
                    <div style={{padding:"12px 14px",fontSize:12,color:C.t3,textAlign:"center"}}>Produk tidak ditemukan</div>
                  )}
                </div>
              )}
            </div>
            <button onClick={()=>{const bc=adminScanQ.trim();const found=prods.find(p=>p.barcode===bc&&p.business===adminBiz)||prods.find(p=>p.name.toLowerCase().includes(bc.toLowerCase())&&p.business===adminBiz);if(found){openEditP(found);setAdminScanQ("");}else toast("Tidak ditemukan","warn");}} className="press"
              style={{padding:"10px 14px",background:C.b,border:"none",borderRadius:9,color:C.on,fontWeight:700,fontSize:12,flexShrink:0}}>Cari</button>
          </div>
          {/* Desktop table */}
          <div className="hide-mobile">
            <Card noPad style={{overflow:"hidden"}}>
              <TableWrap>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:580}}>
                  <THead cols={["Barcode","Nama","Kategori","HPP","Harga Jual","Margin","Stok","Expire","Add-on","Iklan","Aksi"]}/>
                  <tbody>{adminPs.map((p,i)=>{const mg=p.price>0?((p.price-(p.hpp||0))/p.price*100).toFixed(0)+"%":"-";
                    return <tr key={p.id} className="hrow" style={{borderTop:`1px solid ${C.bo0}`,background:i%2===0?"transparent":C.bg0}}>
                      <td style={{padding:"14px 13px",fontFamily:F.mono,fontSize:10,color:C.t2}}>{p.barcode}</td>
                      <td style={{padding:"14px 13px",fontWeight:600}}>{p.name}</td>
                      <td style={{padding:"14px 13px",color:C.t2,fontSize:11}}>{p.category}</td>
                      <td style={{padding:"14px 13px",fontFamily:F.mono,color:C.a,fontSize:11}}>{rp(p.hpp||0)}</td>
                      <td style={{padding:"14px 13px",fontFamily:F.mono,color:C.g,fontSize:11}}>{rp(p.price)}</td>
                      <td style={{padding:"14px 13px",fontFamily:F.mono,fontSize:11,color:C.cy}}>{mg}</td>
                      <td style={{padding:"10px 13px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:5}}>
                          <button onClick={e=>{e.stopPropagation();doQuickAdj(p,-1);}} disabled={p.stock===0}
                            className="press"
                            style={{width:26,height:26,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",
                              fontSize:16,fontWeight:700,flexShrink:0,
                              background:p.stock===0?C.bg4:C.r1,
                              border:`1.5px solid ${p.stock===0?C.bo0:C.r+"44"}`,
                              color:p.stock===0?C.t3:C.r,
                              cursor:p.stock===0?"not-allowed":"pointer"}}>−</button>
                          <span className="mn" style={{minWidth:28,textAlign:"center",fontSize:14,fontWeight:800,
                            color:p.stock===0?C.r:p.stock<10?C.a:C.t0}}>{p.stock}</span>
                          <button onClick={e=>{e.stopPropagation();doQuickAdj(p,1);}}
                            className="press"
                            style={{width:26,height:26,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",
                              fontSize:16,fontWeight:700,flexShrink:0,
                              background:C.g1,border:`1.5px solid ${C.g}44`,color:C.g,cursor:"pointer"}}>+</button>
                        </div>
                      </td>
                      <td style={{padding:"12px 13px"}}>
                        {p.expireDate?(()=>{
                          const days=Math.ceil((new Date(p.expireDate)-new Date())/86400000);
                          const expired=days<0;
                          const color=expired?C.r:days<=30?C.r:days<=90?C.a:C.t2;
                          return <span className="mn" style={{fontSize:10,fontWeight:700,color}}>
                            {expired?`${Math.abs(days)}h lalu`:days===0?"Hari ini":
                             days<=30?`${days}h`:days<=90?`${days}h`:`${days}h`}
                          </span>;
                        })():<span style={{fontSize:10,color:C.t3}}>—</span>}
                      </td>
                      <td style={{padding:"14px 13px"}}>
                        {(p.addons||[]).length>0
                          ?<span style={{padding:"2px 8px",borderRadius:20,fontSize:9.5,fontWeight:700,background:C.vi1,color:C.vi,border:`1px solid ${C.vi}22`,cursor:"pointer"}}
                             title={(p.addons||[]).map(id=>(prods||[]).find(x=>x&&x.id===id)?.name||id).join(", ")}>
                             +{(p.addons||[]).length} item</span>
                          :<span style={{fontSize:10,color:C.t3}}>—</span>}
                      </td>
                      <td style={{padding:"12px 13px"}}>
                        <button onClick={async()=>{
                          try{
                            const next=!p.advertised;
                            await fbUpdateProduct(p.id,{advertised:next},user.name);
                            toast(next?`📢 ${p.name} diiklankan di etalase`:`${p.name} dicabut dari iklan`);
                          }catch(err){toast("Gagal: "+err.message,"err");}
                        }} className="press" title={p.advertised?"Klik untuk cabut dari iklan":"Klik untuk iklankan di etalase"}
                          style={{padding:"4px 9px",borderRadius:20,fontSize:10.5,fontWeight:700,
                            background:p.advertised?C.pri1:C.bg3,
                            border:`1.5px solid ${p.advertised?C.pri:C.bo0}`,
                            color:p.advertised?C.pri:C.t3,display:"inline-flex",alignItems:"center",gap:5,cursor:"pointer"}}>
                          <Megaphone size={12}/> {p.advertised?"Aktif":"Off"}
                        </button>
                      </td>
                      <td style={{padding:"14px 13px",whiteSpace:"nowrap"}}>
                        <button onClick={()=>openEditP(p)} className="press"
                          style={{marginRight:4,padding:"3px 9px",
                            background:editPid===p.id&&pModal?"transparent":"transparent",
                            border:`1px solid ${editPid===p.id&&pModal?C.g:C.bo1}`,
                            borderRadius:6,color:editPid===p.id&&pModal?C.g:C.t0,fontSize:10,fontWeight:editPid===p.id&&pModal?700:400}}>
                          {editPid===p.id&&pModal?"Sedang diedit":"Edit"}</button>
                        <button onClick={()=>fbDeleteProduct(p.id,p.name,p.business,user.name).then(()=>toast("Produk dihapus")).catch(e=>toast(e.message,"err"))} className="press" style={{padding:"3px 9px",background:C.r1,border:`1px solid ${C.r}22`,borderRadius:6,color:C.r,fontSize:10}}>Hapus</button>
                      </td>
                    </tr>
                    ;})}
                  </tbody>
                </table>
              </TableWrap>
            </Card>
          </div>
          {/* Mobile card list */}
          <div className="hide-desktop mobile-card-list">
            {adminPs.map((p,_pi)=>{const mg=p.price>0?((p.price-(p.hpp||0))/p.price*100).toFixed(0)+"%":"-";
              return <div key={p.id} className="card-in" style={{background:C.bg2,borderRadius:16,border:`1px solid ${C.bo0}`,padding:"14px 15px",animationDelay:_pi*0.04+"s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:8}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,lineHeight:1.3,marginBottom:3}}>{p.name}</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                      <span className="mn" style={{fontSize:10,color:C.t3}}>{p.barcode}</span>
                      {p.category&&<span style={{fontSize:10,color:C.t2,background:C.bg3,padding:"1px 7px",borderRadius:20}}>{p.category}</span>}
                      {(p.addons||[]).length>0&&<span style={{fontSize:10,background:C.vi1,color:C.vi,padding:"1px 7px",borderRadius:20,fontWeight:700}}>+{(p.addons||[]).length} add-on</span>}
                    </div>
                  </div>
                  {/* Stock +/- controls */}
                  <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                    <button onClick={e=>{e.stopPropagation();doQuickAdj(p,-1);}} disabled={p.stock===0}
                      className="press"
                      style={{width:30,height:30,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:18,fontWeight:700,
                        background:p.stock===0?C.bg4:C.r1,
                        border:`1.5px solid ${p.stock===0?C.bo0:C.r+"44"}`,
                        color:p.stock===0?C.t3:C.r,
                        cursor:p.stock===0?"not-allowed":"pointer"}}>−</button>
                    <div style={{textAlign:"center",minWidth:32}}>
                      <div className="mn" style={{fontSize:20,fontWeight:800,lineHeight:1,
                        color:p.stock===0?C.r:p.stock<10?C.a:C.t0}}>{p.stock}</div>
                      <div style={{fontSize:9,color:C.t3,marginTop:1}}>stok</div>
                    </div>
                    <button onClick={e=>{e.stopPropagation();doQuickAdj(p,1);}}
                      className="press"
                      style={{width:30,height:30,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:18,fontWeight:700,
                        background:C.g1,border:`1.5px solid ${C.g}44`,color:C.g,cursor:"pointer"}}>+</button>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10,background:C.bg3,borderRadius:10,padding:"10px 12px"}}>
                  <div>
                    <div style={{fontSize:12,color:C.t3,fontWeight:700,textTransform:"none",letterSpacing:0,marginBottom:2}}>HPP</div>
                    <div className="mn" style={{fontSize:12,color:C.a,fontWeight:700}}>{rp(p.hpp||0)}</div>
                  </div>
                  <div>
                    <div style={{fontSize:12,color:C.t3,fontWeight:700,textTransform:"none",letterSpacing:0,marginBottom:2}}>Harga Jual</div>
                    <div className="mn" style={{fontSize:12,color:C.g,fontWeight:700}}>{rp(p.price)}</div>
                  </div>
                  <div>
                    <div style={{fontSize:12,color:C.t3,fontWeight:700,textTransform:"none",letterSpacing:0,marginBottom:2}}>Margin</div>
                    <div className="mn" style={{fontSize:12,color:C.cy,fontWeight:700}}>{mg}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={async()=>{
                    try{
                      const next=!p.advertised;
                      await fbUpdateProduct(p.id,{advertised:next},user.name);
                      toast(next?`📢 ${p.name} diiklankan`:`${p.name} dicabut dari iklan`);
                    }catch(err){toast("Gagal: "+err.message,"err");}
                  }} className="press"
                    style={{padding:"11px 14px",background:p.advertised?C.pri1:C.bg3,border:`1.5px solid ${p.advertised?C.pri:C.bo0}`,borderRadius:10,color:p.advertised?C.pri:C.t2,fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
                    <Megaphone size={16}/> {p.advertised?"Iklan ON":"Iklankan"}
                  </button>
                  <button onClick={()=>openEditP(p)} className="press"
                    style={{flex:1,padding:"11px",
                      background:editPid===p.id&&pModal?C.g1:"transparent",
                      border:`1.5px solid ${editPid===p.id&&pModal?C.g:C.bo1}`,
                      borderRadius:10,color:editPid===p.id&&pModal?C.g:C.t0,fontSize:13,fontWeight:600,fontFamily:F.sans}}>
                    {editPid===p.id&&pModal?"Sedang diedit":"Edit"}</button>
                  <button onClick={()=>fbDeleteProduct(p.id,p.name,p.business,user.name).then(()=>toast("Produk dihapus")).catch(e=>toast(e.message,"err"))} className="press" style={{padding:"11px 16px",background:C.r1,border:`1.5px solid ${C.r}33`,borderRadius:10,color:C.r,fontSize:13,fontFamily:F.sans}}><Ico e="🗑"/></button>
                </div>
              </div>;})}
          </div>
        </div>}


        {/* ── PESANAN CUSTOM BAJU ── */}
        {adminTab==="customorders"&&(()=>{
          const q=(customOrderSearch||"").trim().toLowerCase();
          const filter=customOrderFilter||"Semua";

          const filteredOrders=(customOrders||[]).filter(o=>{
            if(!o) return false;
            const matchStatus=filter==="Semua"?true:(o.status||"Baru")===filter;
            const matchSearch=!q||
              (o.customerName||"").toLowerCase().includes(q)||
              (o.customerPhone||"").toLowerCase().includes(q)||
              (o.orderCode||"").toLowerCase().includes(q)||
              (o.garment?.name||"").toLowerCase().includes(q);
            return matchStatus&&matchSearch;
          });

          const countStatus=(st)=>(customOrders||[]).filter(o=>o&&(o.status||"Baru")===st).length;

          return <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {/* Header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <h2 style={{fontSize:16,fontWeight:800}}>Pesanan Custom Baju ({customOrders.length})</h2>
                  {countStatus("Baru")>0&&(
                    <span style={{padding:"3px 9px",borderRadius:20,background:C.a1,color:C.a,fontSize:11.5,fontWeight:800}}>
                      {countStatus("Baru")} Baru
                    </span>
                  )}
                </div>
                <p style={{fontSize:12,color:C.t2,marginTop:3}}>
                  Daftar pesanan baju custom dari Studio Desain pelanggan. Anda dapat melihat hasil mockup, rincian ukuran, dan follow-up langsung via WhatsApp.
                </p>
              </div>
              <div style={{display:"flex",gap:8}}>
                <Btn outline onClick={()=>setScreen("custom-baju")}>
                  <Sparkles size={16}/> Buka Studio Desain
                </Btn>
              </div>
            </div>

            {/* Filter status tab cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))",gap:8}}>
              {[
                {label:"Semua",count:customOrders.length,color:C.pri,bg:C.pri1},
                {label:"Baru",count:countStatus("Baru"),color:C.a,bg:C.a1},
                {label:"Diproses",count:countStatus("Diproses"),color:C.vi,bg:C.vi1},
                {label:"Selesai",count:countStatus("Selesai"),color:C.g,bg:C.g1},
                {label:"Dibatalkan",count:countStatus("Dibatalkan"),color:C.r,bg:C.r1},
              ].map(st=>{
                const active=filter===st.label;
                return <button key={st.label} onClick={()=>setCustomOrderFilter(st.label)} className="press"
                  style={{padding:"10px 14px",borderRadius:12,background:active?st.bg:C.bg3,border:`1.5px solid ${active?st.color:C.bo0}`,textAlign:"left",cursor:"pointer"}}>
                  <div style={{fontSize:11,color:active?st.color:C.t2,fontWeight:700}}>{st.label}</div>
                  <div style={{fontSize:18,fontWeight:900,color:active?st.color:C.t0,marginTop:2}}>{st.count}</div>
                </button>;
              })}
            </div>

            {/* Search bar */}
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <div style={{flex:1}}>
                <Inp value={customOrderSearch} onChange={e=>setCustomOrderSearch(e.target.value)} placeholder="Cari kode pesanan, nama pemesan, no WA, atau tipe baju..." icon={<Search size={16}/>}/>
              </div>
              {customOrderSearch&&<Btn outline onClick={()=>setCustomOrderSearch("")}>Reset</Btn>}
            </div>

            {/* Order cards list */}
            {filteredOrders.length===0?(
              <EmptyState icon={<Shirt size={32}/>} title="Belum ada pesanan custom" hint={customOrderSearch?"Tidak ada pesanan yang sesuai dengan kata kunci.":"Pesanan yang dibuat pelanggan lewat Studio Desain akan otomatis tampil di sini."}/>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {filteredOrders.map(order=>{
                  const statusColor=order.status==="Selesai"?C.g:order.status==="Diproses"?C.vi:order.status==="Dibatalkan"?C.r:C.a;
                  const statusBg=order.status==="Selesai"?C.g1:order.status==="Diproses"?C.vi1:order.status==="Dibatalkan"?C.r1:C.a1;
                  const sizes=order.sizeBreakdown?Object.entries(order.sizeBreakdown).filter(([_,q])=>q>0).map(([s,q])=>`${s}: ${q}`).join(" • "):"";

                  return <Card key={order.id} style={{padding:"16px 18px",border:`1.5px solid ${C.bo0}`,borderRadius:16}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                      {/* Left: Thumbnail & specs */}
                      <div style={{display:"flex",gap:14,flex:1,minWidth:260}}>
                        <div onClick={()=>setPreviewOrder(order)} className="press" title="Klik untuk melihat mockup ukuran besar"
                          style={{width:95,height:80,borderRadius:12,background:"#182046",border:`1px solid ${C.bo1}`,overflow:"hidden",flexShrink:0,cursor:"pointer",position:"relative",display:"grid",placeItems:"center"}}>
                          {order.mockupImage?(
                            <img src={order.mockupImage} alt="Mockup" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                          ):(
                            <div style={{textAlign:"center",color:C.t3}}>
                              <Shirt size={26}/>
                              <div style={{fontSize:9,marginTop:2}}>Preview</div>
                            </div>
                          )}
                          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.35)",opacity:0,transition:"opacity .2s",display:"grid",placeItems:"center",color:"#FFF"}}
                            onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0}>
                            <Eye size={20}/>
                          </div>
                        </div>

                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                            <span style={{fontFamily:F.mono,fontSize:12,fontWeight:800,color:C.pri}}>{order.orderCode||order.id}</span>
                            <span style={{fontSize:11,color:C.t3}}>•</span>
                            <span style={{fontSize:11.5,color:C.t2}}>{order.date}</span>
                            <span style={{padding:"2px 8px",borderRadius:12,background:statusBg,color:statusColor,fontSize:11,fontWeight:800}}>
                              {order.status||"Baru"}
                            </span>
                          </div>

                          <div style={{fontSize:15,fontWeight:800,color:C.t0,marginTop:4}}>
                            {order.customerName||"Customer"}
                            {order.customerPhone&&<span style={{fontSize:12.5,fontWeight:600,color:C.t2,marginLeft:8}}>({order.customerPhone})</span>}
                          </div>

                          <div style={{fontSize:12.5,color:C.t1,marginTop:3,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                            <span style={{fontWeight:700}}>{order.garment?.name||"Kaos"}</span>
                            <span>—</span>
                            <span style={{display:"inline-flex",alignItems:"center",gap:4}}>
                              <span style={{width:10,height:10,borderRadius:"50%",background:order.color?.hex||"#000",border:"1px solid rgba(0,0,0,0.2)"}}/>
                              <span>{order.color?.name||"Warna Kain"}</span>
                            </span>
                            <span>•</span>
                            <span>{order.sides||"Depan"}</span>
                          </div>

                          <div style={{fontSize:12,color:C.t2,marginTop:4}}>
                            <span>Ukuran: <b>{sizes||`${order.totalPieces||1} pcs`}</b></span>
                            <span style={{margin:"0 6px"}}>•</span>
                            <span>Total: <b>{order.totalPieces||1} pcs</b> ({rp(order.estimatedPrice||(order.totalPieces*(order.unitPrice||55000)))})</span>
                          </div>

                          {order.notes&&(
                            <div style={{fontSize:11.5,color:C.t2,marginTop:5,background:C.bg3,padding:"5px 9px",borderRadius:8}}>
                              📝 <i>"{order.notes}"</i>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                        <select value={order.status||"Baru"} onChange={e=>fbUpdateCustomOrderStatus(order.id,e.target.value,user.name)}
                          style={{padding:"6px 10px",borderRadius:10,background:C.bg3,border:`1.5px solid ${C.bo1}`,color:C.t0,fontSize:12,fontWeight:700,outline:"none",cursor:"pointer"}}>
                          <option value="Baru">Status: Baru</option>
                          <option value="Diproses">Status: Diproses</option>
                          <option value="Selesai">Status: Selesai</option>
                          <option value="Dibatalkan">Status: Dibatalkan</option>
                        </select>

                        <button onClick={()=>setPreviewOrder(order)} className="press"
                          style={{padding:"7px 12px",borderRadius:10,background:C.pri1,border:`1px solid ${C.pri}`,color:C.pri,fontSize:12,fontWeight:700,display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer"}}>
                          <Eye size={14}/> Lihat Hasil Desain
                        </button>

                        {order.customerPhone&&(
                          <button onClick={()=>{
                            const num=String(order.customerPhone).replace(/\D/g,"");
                            const text=`Halo Kak ${order.customerName}, kami dari JE Grup (JS Clothing) mengonfirmasi pesanan custom baju ${order.garment?.name||"Kaos"} (${order.orderCode||""}) sejumlah ${order.totalPieces||1} pcs. Desain sudah kami terima dan siap diproses!`;
                            window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`,"_blank");
                          }} className="press"
                            style={{padding:"7px 12px",borderRadius:10,background:"#25D36622",border:"1px solid #25D36666",color:"#25D366",fontSize:12,fontWeight:700,display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer"}}>
                            <MessageCircle size={14}/> WhatsApp
                          </button>
                        )}

                        <button onClick={()=>{
                          if(window.confirm(`Hapus pesanan dari ${order.customerName}?`)){
                            fbDeleteCustomOrder(order.id,user.name);
                            toast("Pesanan dihapus");
                          }
                        }} className="press" title="Hapus Pesanan"
                          style={{width:34,height:34,borderRadius:10,background:"transparent",border:`1px solid ${C.bo1}`,color:C.r,display:"grid",placeItems:"center",cursor:"pointer"}}>
                          <Trash2 size={15}/>
                        </button>
                      </div>
                    </div>
                  </Card>;
                })}
              </div>
            )}
          </div>;
        })()}


        {/* ── LANDING PAGE (ETALASE PUBLIK) ── */}
        {adminTab==="landing"&&(()=>{
          const lf=landingDraft||landingCfg;
          const limits=lf.limits||{};
          const setLf=(k,v)=>setLandingDraft({...lf,[k]:v});
          const setLimit=(b,v)=>setLandingDraft({...lf,limits:{JS_CLOTHING:0,JB_STORE:0,...limits,[b]:v}});
          const save=async()=>{
            try{
              const data={};
              PHOTO_FIELDS.forEach(([k])=>{data[k]=String(lf[k]||"").trim();});
              data.wa=String(lf.wa||"").replace(/[^\d+]/g,"");
              data.limits={JS_CLOTHING:+limits.JS_CLOTHING||0,JB_STORE:+limits.JB_STORE||0};
              await fbSetLanding(data,user.name);
              toast("Etalase publik diperbarui");
            }catch(err){toast("Gagal: "+err.message,"err");}
          };
          const q=searchQ.trim().toLowerCase();
          const bizProds=prods.filter(p=>p.business===adminBiz&&(!q||p.name.toLowerCase().includes(q)||p.barcode.includes(q)));
          const bizShown=bizProds.filter(p=>p.advertised);
          const shownCap=60;
          const toggleAd=async(p,on)=>{
            try{ await fbUpdateProduct(p.id,{advertised:on},user.name); toast(on?`Iklan aktif: ${p.name}`:`Dicabut dari iklan: ${p.name}`); }
            catch(err){ toast("Gagal: "+err.message,"err"); }
          };
          const savePhoto=async(p,v)=>{
            const val=v.trim(); if(val===(p.photo||"")) return;
            try{ await fbUpdateProduct(p.id,{photo:val},user.name); toast("Foto diperbarui: "+p.name); }
            catch(err){ toast("Gagal: "+err.message,"err"); }
          };
          const toolBtn={padding:"7px 11px",background:C.bg3,border:`1px solid ${C.bo0}`,borderRadius:8,color:C.t2,fontSize:12,fontWeight:600,fontFamily:F.sans,display:"flex",alignItems:"center",gap:5};
          return <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
              <div style={{maxWidth:560}}>
                <h2 style={{fontSize:15,fontWeight:800}}>Etalase Publik</h2>
                <p style={{fontSize:11.5,color:C.t2,marginTop:3,lineHeight:1.5}}>Foto dan nomor WhatsApp yang tampil di halaman promosi pelanggan. Tempel link Google Drive (Share &rarr; Copy link). Kosongkan satu slot untuk memakai foto contoh.</p>
              </div>
              <div style={{display:"flex",gap:7}}>
                {/* Preview ikut menampilkan perubahan yang belum disimpan */}
                <button onClick={()=>{if(landingDraft)Object.assign(LANDING,landingDraft);setScreen("landing");}} className="press" style={toolBtn}><ExternalLink size={13}/> Preview</button>
                <Btn onClick={save} size="sm"><Check size={16}/> Simpan</Btn>
              </div>
            </div>
            <Card>
              {PHOTO_FIELDS.map(([k,label],i)=>{
                const src=driveImg(lf[k],200);
                return <div key={k} style={{display:"flex",gap:12,alignItems:"center",padding:"10px 0",borderTop:i===0?"none":`1px solid ${C.bo0}`}}>
                  <div style={{width:56,height:56,borderRadius:10,overflow:"hidden",flexShrink:0,background:C.bg3,border:`1px solid ${C.bo0}`,display:"grid",placeItems:"center"}}>
                    {src?<img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                        :<span style={{fontSize:9.5,color:C.t3,textAlign:"center",lineHeight:1.2,padding:"0 4px"}}>contoh</span>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <label style={{fontSize:11,fontWeight:700,color:C.t2,display:"block",marginBottom:4}}>{label}</label>
                    <input value={lf[k]||""} onChange={e=>setLf(k,e.target.value)} placeholder="https://drive.google.com/file/d/..." style={IS}/>
                  </div>
                </div>;
              })}
              <div style={{padding:"12px 0 2px",borderTop:`1px solid ${C.bo0}`}}>
                <label style={{fontSize:11,fontWeight:700,color:C.t2,display:"block",marginBottom:4}}>Nomor WhatsApp (62xxx, tanpa + dan spasi)</label>
                <input value={lf.wa||""} onChange={e=>setLf("wa",e.target.value)} placeholder={LANDING_WA} style={IS}/>
              </div>
            </Card>

            {/* Produk yang tampil di etalase */}
            <Card>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:10}}>
                <div>
                  <h3 style={{fontSize:13.5,fontWeight:800}}>Produk yang tampil</h3>
                  <p style={{fontSize:11.5,color:C.t2,marginTop:3}}>Centang produk yang mau diiklankan dan tempel foto produknya (link Google Drive). Foto bisa juga diisi dari form produk.</p>
                </div>
                <div style={{display:"flex",gap:7,alignItems:"flex-end",flexWrap:"wrap"}}>
                  {Object.values(BIZ).map(b2=>{const isJ=b2.id==="JS_CLOTHING",active=adminBiz===b2.id;
                    return <button key={b2.id} onClick={()=>{setAdminBiz(b2.id);setSearchQ("");}} className="press"
                      style={{padding:"7px 14px",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:12,background:active?(isJ?C.b1:C.p1):"transparent",border:`2px solid ${active?(isJ?C.b:C.p):C.bo0}`,color:active?(isJ?C.b:C.p):C.t2,fontFamily:F.sans}}>
                      {b2.name}</button>;})}
                  <div>
                    <label style={{fontSize:11,fontWeight:700,color:C.t2,display:"block",marginBottom:4}}>Jumlah tampil (0 = semua)</label>
                    <input type="number" min="0" value={limits[adminBiz]??""} onChange={e=>setLimit(adminBiz,e.target.value)}
                      placeholder="0" style={{...IS,width:110,fontFamily:F.mono}}/>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center",marginTop:12,flexWrap:"wrap"}}>
                <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Cari produk..." style={{...IS,maxWidth:220}}/>
                <span style={{fontSize:11.5,color:C.t3}}>{bizShown.length} dari {bizProds.length} produk diiklankan</span>
              </div>
              <div style={{marginTop:8}}>
                {bizProds.length===0
                  ? <EmptyState pad={20} title="Tidak ada produk"/>
                  : <>
                    {bizProds.slice(0,shownCap).map((p,i)=>{
                      const src=productPhoto(p);
                      return <div key={p.id} style={{display:"flex",gap:12,alignItems:"center",padding:"10px 0",borderTop:i===0?"none":`1px solid ${C.bo0}`}}>
                        <img src={src} alt="" style={{width:48,height:48,borderRadius:9,objectFit:"cover",flexShrink:0,background:C.bg3,border:`1px solid ${C.bo0}`}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12.5,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                          <div style={{fontSize:11,color:C.t2,marginTop:2}}>{rp(p.price)} &middot; stok {p.stock} &middot; {p.barcode}</div>
                          <input defaultValue={p.photo||""} key={"ph"+p.id+p.photo} onBlur={e=>savePhoto(p,e.target.value)}
                            placeholder="Link foto produk (Google Drive)" style={{...IS,marginTop:6,fontSize:12,padding:"7px 11px",minHeight:0}}/>
                        </div>
                        <label style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flexShrink:0,cursor:"pointer"}}>
                          <input type="checkbox" checked={!!p.advertised} onChange={e=>toggleAd(p,e.target.checked)}
                            style={{width:20,height:20,accentColor:C.pri,cursor:"pointer"}}/>
                          <span style={{fontSize:10,fontWeight:700,color:p.advertised?C.pri:C.t3}}>{p.advertised?"Tampil":"Off"}</span>
                        </label>
                      </div>;
                    })}
                    {bizProds.length>shownCap&&<div style={{paddingTop:10,fontSize:11,color:C.t3}}>Menampilkan {shownCap} dari {bizProds.length}. Pakai pencarian untuk mempersempit.</div>}
                  </>}
              </div>
            </Card>
            <p style={{fontSize:11.5,color:C.t3,lineHeight:1.5}}>Tekan <b>Simpan</b> untuk menyimpan foto besar dan jumlah tampil. Centang produk dan isi foto produk langsung tersimpan per produk.</p>
          </div>;
        })()}

        {/* ── LAPORAN ── */}
        {adminTab==="laporan"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{flex:1}}><h2 style={{fontSize:15,fontWeight:800}}>Laporan Keuangan</h2></div>
            <button onClick={()=>downloadXLSX(filtTrx,[
              {key:"id",label:"ID Transaksi",w:22},{key:"date",label:"Tanggal",w:22},
              {key:"kasir",label:"Kasir",w:20},{key:"business",label:"Bisnis",fn:r=>BIZ[r.business]?.name||r.business,w:14},
              {key:"subtotal",label:"Subtotal (Rp)",fn:r=>r.subtotal||r.total,num:true,w:18},
              {key:"discount",label:"Diskon (Rp)",fn:r=>r.discount||0,num:true,w:14},
              {key:"total",label:"Total (Rp)",fn:r=>r.total,num:true,w:18},
              {key:"totalHpp",label:"HPP (Rp)",fn:r=>r.totalHpp||0,num:true,w:16},
              {key:"profit",label:"Laba (Rp)",fn:r=>r.profit||0,num:true,w:16},
              {key:"payment",label:"Pembayaran",w:14},
              {key:"items",label:"Jumlah Item",fn:r=>r.items?.length||0,num:true,w:14},
            ],"Transaksi","laporan_keuangan")} className="press"
              style={{padding:"7px 13px",background:C.g1,border:`1px solid ${C.g}33`,borderRadius:8,color:C.g,fontSize:12,fontWeight:700,fontFamily:F.sans}}>⬇ Excel Transaksi</button>
            <button onClick={()=>downloadXLSX(prodPerf,[
              {key:"barcode",label:"Barcode",w:14},{key:"name",label:"Nama Produk",w:28},
              {key:"qty",label:"Qty Terjual",fn:r=>r.qty,num:true,w:14},{key:"rev",label:"Pendapatan (Rp)",fn:r=>r.rev,num:true,w:18},
              {key:"hpp",label:"HPP (Rp)",fn:r=>r.hpp,num:true,w:16},{key:"laba",label:"Laba (Rp)",fn:r=>r.rev-r.hpp,num:true,w:16},
              {key:"margin",label:"Margin %",fn:r=>r.rev>0?(((r.rev-r.hpp)/r.rev)*100).toFixed(1)+"%":"0%",w:12},
            ],"Produk Terlaris","laporan_produk")} className="press"
              style={{padding:"7px 13px",background:C.cy1,border:`1px solid ${C.cy}33`,borderRadius:8,color:C.cy,fontSize:12,fontWeight:700,fontFamily:F.sans}}>⬇ Excel Produk</button>
          </div>
          {/* Filters */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
            {/* Bisnis chips */}
            {["ALL","JS_CLOTHING","JB_STORE"].map(b2=>{
              const isAct=reportBiz===b2;
              const cl=b2==="JB_STORE"?C.p:b2==="JS_CLOTHING"?C.b:C.g;
              return <button key={b2} onClick={()=>setReportBiz(b2)}
                className={`chip${isAct?" on":""}`}
                style={{borderColor:isAct?cl:"transparent",color:isAct?cl:C.t2,
                  background:isAct?cl+"22":"transparent"}}>
                {b2==="ALL"?"Semua":BIZ[b2]?.name}
              </button>;})}
            <div style={{width:1,height:20,background:C.bo0,alignSelf:"center"}}/>
            {/* Kasir filter */}
            <select value={reportKasir} onChange={e=>setReportKasir(e.target.value)}
              style={{padding:"8px 12px",background:C.bg2,border:`1.5px solid ${C.bo0}`,borderRadius:50,
                color:C.t0,fontSize:12,fontFamily:F.sans,cursor:"pointer",fontWeight:600}}>
              <option value="ALL">Semua Kasir</option>
              {users.filter(u=>u.role==="kasir"||u.role==="admin").map(u=><option key={u.id} value={String(u.id)}>{u.name}</option>)}
            </select>
            <div style={{width:1,height:20,background:C.bo0,alignSelf:"center"}}/>
            {/* Kategori filter */}
            <select value={reportCategory} onChange={e=>setReportCategory(e.target.value)}
              style={{padding:"8px 12px",background:reportCategory!=="ALL"?C.cy1:C.bg2,
                border:`1.5px solid ${reportCategory!=="ALL"?C.cy:C.bo0}`,borderRadius:50,
                color:reportCategory!=="ALL"?C.cy:C.t0,fontSize:12,fontFamily:F.sans,cursor:"pointer",fontWeight:600}}>
              <option value="ALL">Semua Kategori</option>
              {allCategories.map(cat=><option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          {/* Period chips */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginTop:2}}>
            {[["all","Semua"],["today","Hari Ini"],["week","7 Hari"],["month","Bulan Ini"],["custom","Rentang"]].map(([v,l])=><button key={v}
              onClick={()=>setReportRange(v)}
              className={`chip${reportRange===v?" on":""}`}>{l}</button>)}
            {reportRange==="custom"&&<div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap",marginTop:4}}>
              <input type="date" value={lapFrom} onChange={e=>setLapFrom(e.target.value)}
                style={{padding:"8px 10px",background:C.bg3,border:`1.5px solid ${C.bo1}`,borderRadius:10,color:C.t0,fontSize:12,fontFamily:F.sans}}/>
              <span style={{color:C.t2,fontSize:12,fontWeight:600}}>s/d</span>
              <input type="date" value={lapTo} onChange={e=>setLapTo(e.target.value)}
                style={{padding:"8px 10px",background:C.bg3,border:`1.5px solid ${C.bo1}`,borderRadius:10,color:C.t0,fontSize:12,fontFamily:F.sans}}/>
            </div>}
          </div>
          {/* Active filter badges */}
          {(reportBiz!=="ALL"||reportKasir!=="ALL"||reportCategory!=="ALL")&&(
            <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:10,color:C.t3,fontWeight:600}}>Filter aktif:</span>
              {reportBiz!=="ALL"&&<span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,
                background:reportBiz==="JB_STORE"?C.p1:C.b1,color:reportBiz==="JB_STORE"?C.p:C.b}}>
                <Ico e={BIZ[reportBiz]?.icon}/> {BIZ[reportBiz]?.name}
                <button onClick={()=>setReportBiz("ALL")} style={{background:"none",border:"none",color:"inherit",marginLeft:4,cursor:"pointer",fontSize:12,lineHeight:1}}>×</button>
              </span>}
              {reportKasir!=="ALL"&&<span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:C.vi1,color:C.vi}}>
                <Ico e="👤"/> {users.find(u=>String(u.id)===reportKasir)?.name||reportKasir}
                <button onClick={()=>setReportKasir("ALL")} style={{background:"none",border:"none",color:"inherit",marginLeft:4,cursor:"pointer",fontSize:12,lineHeight:1}}>×</button>
              </span>}
              {reportCategory!=="ALL"&&<span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:C.cy1,color:C.cy}}>
                <Ico e="🏷"/> {reportCategory}
                <button onClick={()=>setReportCategory("ALL")} style={{background:"none",border:"none",color:"inherit",marginLeft:4,cursor:"pointer",fontSize:12,lineHeight:1}}>×</button>
              </span>}
              <button onClick={()=>{setReportBiz("ALL");setReportKasir("ALL");setReportCategory("ALL");setReportRange("month");}}
                style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:C.r1,border:`1px solid ${C.r}22`,color:C.r,cursor:"pointer"}}>
                Reset semua
              </button>
            </div>
          )}
          {/* KPI */}
          {/* Desktop */}
          <div className="hide-mobile stat-grid-4" style={{display:"grid",gap:8}}>
            <Stat icon="💰" label="Total Pendapatan" value={rp(totalRev)} color={C.g} sub={`${filtTrx.length} transaksi`}/>
            <Stat icon="📦" label="Total HPP" value={rp(totalHppAll)} color={C.a}/>
            <Stat icon="📈" label="Laba Kotor" value={rp(grossProfit)} color={C.cy}/>
            <Stat icon="🎯" label="Margin" value={margin} color={C.b} sub={`Diskon: ${rp(totalDisc)}`}/>
          </div>
          {/* Mobile */}
          <div className="hide-desktop" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[
              {ic:"💰",lbl:"Pendapatan",val:rp(totalRev),sub:filtTrx.length+" transaksi",color:C.g},
              {ic:"📈",lbl:"Laba Kotor",val:rp(grossProfit),sub:`Margin ${margin}`,color:C.cy},
              {ic:"📦",lbl:"Total HPP",val:rp(totalHppAll),color:C.a},
              {ic:"🎯",lbl:"Total Diskon",val:rp(totalDisc),color:C.r},
            ].map((s,i)=><div key={i} className="stat-mobile card-in" style={{"--stat-glow":s.color}}>
              <span className="stat-ico" style={{background:(s.color||C.pri)+"1F",color:s.color||C.pri}}><Ico e={s.ic} size={18}/></span>
              <span className="stat-lbl">{s.lbl}</span>
              <span className="stat-val" style={{color:s.color,fontSize:s.val.length>10?15:18}}>{s.val}</span>
              {s.sub&&<span style={{fontSize:10,color:C.t2,fontWeight:600}}>{s.sub}</span>}
            </div>)}
          </div>
          {/* Pie */}
          {bizRevData.length>1&&<Card>
            <div style={{fontSize:12,fontWeight:700,color:C.t2,textTransform:"none",letterSpacing:0,marginBottom:12}}>Kontribusi per Bisnis</div>
            <SimplePieChart data={bizRevData}/>
          </Card>}
          {/* Daily chart */}
          {dailyData.length>0&&<Card>
            <div style={{fontSize:12,fontWeight:700,color:C.t2,textTransform:"none",letterSpacing:0,marginBottom:12}}>Tren Harian</div>
            <SimpleBarChart data={dailyData} keys={["rev","profit"]} colors={[C.g,C.cy]} height={200} labelKey="date"/>
          </Card>}
          {/* Per kasir */}
          {kasirBreakdown.length>0&&<Card noPad style={{overflow:"hidden"}}>
            <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.bo0}`}}>
              <span style={{fontSize:12,fontWeight:700,color:C.t2,textTransform:"none",letterSpacing:0}}>Performa per Kasir</span>
            </div>
            <TableWrap>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:500}}>
                <THead cols={["Kasir","Transaksi","Pendapatan","Laba","Diskon","Rata-rata/Trx"]}/>
                <tbody>{kasirBreakdown.map((k,i)=><tr key={k.name} className="hrow" style={{borderTop:`1px solid ${C.bo0}`,background:i%2===0?"transparent":C.bg0}}>
                  <td style={{padding:"14px 13px",fontWeight:700}}>{k.name}</td>
                  <td style={{padding:"14px 13px",fontFamily:F.mono}}>{k.trx}</td>
                  <td style={{padding:"14px 13px",fontFamily:F.mono,color:C.g,fontSize:11}}>{rp(k.rev)}</td>
                  <td style={{padding:"14px 13px",fontFamily:F.mono,color:C.cy,fontSize:11}}>{rp(k.profit)}</td>
                  <td style={{padding:"14px 13px",fontFamily:F.mono,color:C.r,fontSize:11}}>{rp(k.discount)}</td>
                  <td style={{padding:"14px 13px",fontFamily:F.mono,fontSize:11}}>{k.trx>0?rp(Math.floor(k.rev/k.trx)):"-"}</td>
                </tr>)}</tbody>
              </table>
            </TableWrap>
          </Card>}
          {/* Detail Penjualan Per Produk — collapsible, di bawah invoice */}
          <div style={{background:C.bg2,borderRadius:14,border:`1px solid ${C.bo0}`,overflow:"hidden"}}>
            <button onClick={()=>setShowDetailPenjualan(x=>!x)} className="press"
              style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
                padding:"13px 16px",background:"transparent",border:"none",cursor:"pointer",fontFamily:F.sans}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:13,fontWeight:800,color:C.t0}}><Ico e="📋"/> Detail Penjualan Per Produk</span>
                <span style={{fontSize:11,color:C.t2}}>(per item transaksi)</span>
              </div>
              <span style={{fontSize:14,color:C.t2,transition:"transform .2s",
                transform:showDetailPenjualan?"rotate(180deg)":"rotate(0deg)",display:"inline-block"}}>▾</span>
            </button>
            {showDetailPenjualan&&<div style={{borderTop:`1px solid ${C.bo0}`,animation:"fadeUp .15s ease"}}>
              {(()=>{
            // Expand: setiap item di setiap transaksi jadi satu baris
            const rows=[];
            filtTrx.forEach(t=>{
              (t.items||[]).filter(item=>{
                if(reportCategory==="ALL") return true;
                const prod=prods.find(p=>p.barcode===item.barcode);
                return prod?.category===reportCategory;
              }).forEach(item=>{
                rows.push({
                  trxId:t.id, date:t.date,
                  namaPembeli:t.namaPembeli||"Umum",
                  kasir:t.kasir, bisnis:t.business,
                  produk:item.name, barcode:item.barcode,
                  qty:item.qty, harga:item.price,
                  subtotalItem:item.price*item.qty,
                  payment:t.payment||"Tunai",
                  totalTrx:t.total,
                });
              });
            });
            if(!rows.length) return null;
            return <Card noPad style={{overflow:"hidden"}}>
              <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.bo0}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <span style={{fontSize:12,fontWeight:700,color:C.t2,textTransform:"none",letterSpacing:0}}>
                  Detail Penjualan per Produk ({rows.length} baris)
                </span>
                <button onClick={()=>downloadXLSX(rows,[
                  {key:"date",label:"Tanggal",w:22},
                  {key:"namaPembeli",label:"Nama Pembeli",w:20},
                  {key:"kasir",label:"Kasir",w:18},
                  {key:"bisnis",label:"Bisnis",fn:r=>BIZ[r.bisnis]?.name||r.bisnis,w:14},
                  {key:"produk",label:"Produk",w:28},
                  {key:"barcode",label:"Barcode",w:14},
                  {key:"qty",label:"Qty",fn:r=>r.qty,num:true,w:8},
                  {key:"harga",label:"Harga Satuan (Rp)",fn:r=>r.harga,num:true,w:18},
                  {key:"subtotalItem",label:"Subtotal Item (Rp)",fn:r=>r.subtotalItem,num:true,w:18},
                  {key:"payment",label:"Pembayaran",w:14},
                  {key:"totalTrx",label:"Total Transaksi (Rp)",fn:r=>r.totalTrx,num:true,w:20},
                  {key:"trxId",label:"ID Transaksi",w:24},
                ],"Detail Penjualan","detail_penjualan")} className="press"
                  style={{padding:"5px 12px",background:C.g1,border:`1px solid ${C.g}33`,borderRadius:8,color:C.g,fontSize:11,fontWeight:700,fontFamily:F.sans}}>⬇ Excel</button>
              </div>
              {/* Desktop table */}
              <div className="hide-mobile"><TableWrap>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:620}}>
                  <THead cols={["Tanggal","Nama Pembeli","Kasir","Produk","Qty","Harga","Subtotal","Bayar"]}/>
                  <tbody>{rows.slice(0,200).map((r,i)=>(
                    <tr key={i} className="hrow" style={{borderTop:`1px solid ${C.bo0}`,background:i%2===0?"transparent":C.bg0}}>
                      <td style={{padding:"11px 13px",fontSize:10,color:C.t2,whiteSpace:"nowrap"}}>{r.date}</td>
                      <td style={{padding:"11px 13px",fontWeight:600,fontSize:12}}>
                        <div style={{display:"flex",alignItems:"center",gap:5}}>
                          {r.namaPembeli!=="Umum"&&<span style={{fontSize:13}}><Ico e="🧑"/></span>}
                          <span style={{color:r.namaPembeli==="Umum"?C.t2:C.t0}}>{r.namaPembeli}</span>
                        </div>
                      </td>
                      <td style={{padding:"11px 13px",fontSize:11,color:C.t2}}>{r.kasir}</td>
                      <td style={{padding:"11px 13px",fontWeight:500}}>
                        {r.produk}
                        <div className="mn" style={{fontSize:9.5,color:C.t3,marginTop:1}}>{r.barcode}</div>
                      </td>
                      <td style={{padding:"11px 13px",fontFamily:F.mono,fontWeight:700,textAlign:"center"}}>{r.qty}</td>
                      <td style={{padding:"11px 13px",fontFamily:F.mono,color:C.t1,fontSize:11}}>{rp(r.harga)}</td>
                      <td style={{padding:"11px 13px",fontFamily:F.mono,color:C.g,fontSize:11,fontWeight:700}}>{rp(r.subtotalItem)}</td>
                      <td style={{padding:"11px 13px",fontSize:10}}>
                        <span style={{padding:"2px 7px",borderRadius:20,background:C.cy1,color:C.cy,fontSize:9.5,fontWeight:700}}>{r.payment}</span>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
                {rows.length>200&&<div style={{padding:"10px 14px",fontSize:11,color:C.t3,borderTop:`1px solid ${C.bo0}`}}>
                  Menampilkan 200 dari {rows.length} baris. Download Excel untuk data lengkap.
                </div>}
              </TableWrap></div>
              {/* Mobile cards */}
              <div className="hide-desktop" style={{padding:"8px 10px",display:"flex",flexDirection:"column",gap:8}}>
                {rows.slice(0,50).map((r,i)=>(
                  <div key={i} style={{background:C.bg3,borderRadius:10,padding:"10px 12px",border:`1px solid ${C.bo0}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:13}}>{r.produk}</div>
                        <div className="mn" style={{fontSize:10,color:C.t2,marginTop:1}}>{r.barcode}</div>
                      </div>
                      <div className="mn" style={{fontSize:14,fontWeight:800,color:C.g}}>{rp(r.subtotalItem)}</div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginTop:6}}>
                      <div style={{fontSize:10,color:C.t2}}><span style={{color:C.t3}}>Pembeli: </span><b>{r.namaPembeli}</b></div>
                      <div style={{fontSize:10,color:C.t2}}><span style={{color:C.t3}}>Qty: </span><b>{r.qty} × {rp(r.harga)}</b></div>
                      <div style={{fontSize:10,color:C.t2}}><span style={{color:C.t3}}>Tanggal: </span>{r.date}</div>
                      <div style={{fontSize:10,color:C.t2}}><span style={{color:C.t3}}>Bayar: </span>{r.payment}</div>
                    </div>
                  </div>
                ))}
                {rows.length>50&&<div style={{textAlign:"center",fontSize:11,color:C.t3,padding:"8px"}}>+{rows.length-50} baris lainnya. Download Excel untuk lengkap.</div>}
              </div>
            </Card>;
            })()}
            </div>}
          </div>
          {/* Invoice — satu baris, expand untuk detail */}
          {(()=>{
            const sq=searchInvoice.trim().toLowerCase();
            const trxFiltered=filtTrx.filter(t=>!sq||
              (t.namaPembeli||"").toLowerCase().includes(sq)||
              (t.id||"").toLowerCase().includes(sq)||
              (t.kasir||"").toLowerCase().includes(sq)
            );
            const toggleExpand=id=>setExpandedTrx(p=>({...p,[id]:!p[id]}));
            return <Card noPad style={{overflow:"hidden"}}>
              <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.bo0}`,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{fontSize:12,fontWeight:700,color:C.t2,textTransform:"none",letterSpacing:0,flex:1,whiteSpace:"nowrap"}}>
                  Invoice ({trxFiltered.length}{sq?` dari ${filtTrx.length}`:""})
                </span>
                <div style={{position:"relative",flex:"0 1 220px",minWidth:160}}>
                  <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontSize:13,color:C.t2,pointerEvents:"none"}}><Ico e="🔍"/></span>
                  <input value={searchInvoice} onChange={e=>setSearchInvoice(e.target.value)}
                    placeholder="Cari nama pembeli / ID..."
                    style={{width:"100%",padding:"7px 10px 7px 30px",background:C.bg3,
                      border:`1.5px solid ${searchInvoice?C.pri+"88":C.bo0}`,borderRadius:20,
                      color:C.t0,fontSize:12,fontFamily:F.sans,boxSizing:"border-box"}}/>
                  {searchInvoice&&<button onClick={()=>setSearchInvoice("")}
                    style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",
                      background:"none",border:"none",color:C.t3,fontSize:16,cursor:"pointer",lineHeight:1}}>×</button>}
                </div>
                {trxFiltered.length>0&&<button onClick={()=>{
                  const allEx=trxFiltered.every(t=>expandedTrx[t.id]);
                  const upd={};trxFiltered.forEach(t=>upd[t.id]=!allEx);
                  setExpandedTrx(p=>({...p,...upd}));
                }} className="press"
                  style={{padding:"6px 12px",background:C.bg3,border:`1px solid ${C.bo0}`,
                    borderRadius:20,color:C.t2,fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>
                  {trxFiltered.every(t=>expandedTrx[t.id])?"↑ Tutup semua":"↓ Buka semua"}
                </button>}
              </div>
              {trxFiltered.length===0
                ?<div style={{padding:"32px",textAlign:"center",color:C.t3,fontSize:13}}>
                  {searchInvoice?"Tidak ditemukan: "+searchInvoice:"Belum ada transaksi"}
                </div>
                :<div>
                  {trxFiltered.slice(0,150).map((t,i)=>{
                    const expanded=!!expandedTrx[t.id];
                    const itemCount=(t.items||[]).reduce((s,it)=>s+it.qty,0);
                    const hasPembeli=t.namaPembeli&&t.namaPembeli!=="Umum";
                    return <div key={t.id} style={{borderTop:i>0?`1px solid ${C.bo0}`:undefined}}>
                      {/* Baris ringkasan invoice */}
                      <div onClick={()=>toggleExpand(t.id)} className="hrow"
                        style={{padding:"12px 14px",cursor:"pointer",display:"flex",
                          alignItems:"center",gap:10,
                          background:expanded?`${C.g}07`:"transparent",transition:"background .15s"}}>
                        <span style={{fontSize:12,color:C.t3,flexShrink:0,transition:"transform .2s",
                          display:"inline-block",transform:expanded?"rotate(90deg)":"rotate(0deg)"}}>▶</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:3}}>
                            <span className="mn" style={{fontSize:10,color:C.t3}}>{t.id?.slice(-12)}</span>
                            {hasPembeli&&<span style={{padding:"1px 8px",borderRadius:20,
                              background:C.b1,color:C.b,fontSize:10,fontWeight:700}}><Ico e="🧑"/> {t.namaPembeli}</span>}
                            {t.returned&&<span style={{padding:"1px 7px",borderRadius:20,
                              background:C.a1,color:C.a,fontSize:9.5,fontWeight:700}}>Retur</span>}
                          </div>
                          <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                            <span style={{fontSize:10,color:C.t2}}>{t.date}</span>
                            <span style={{fontSize:10,color:C.t3}}>·</span>
                            <span style={{fontSize:10,color:C.t2}}>{t.kasir}</span>
                            <span style={{fontSize:10,color:C.t3}}>·</span>
                            <BizChip biz={t.business} sm/>
                            <span style={{fontSize:10,color:C.t3}}>·</span>
                            <span style={{fontSize:10,color:C.t2}}>{itemCount} item</span>
                            <span style={{padding:"1px 7px",borderRadius:20,
                              background:C.cy1,color:C.cy,fontSize:9.5,fontWeight:700}}>{t.payment||"Tunai"}</span>
                          </div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div className="mn" style={{fontSize:15,fontWeight:800,color:C.g}}>{rp(t.total)}</div>
                          {(t.profit||0)>0&&<div className="mn" style={{fontSize:10,color:C.cy,marginTop:1}}>+{rp(t.profit)}</div>}
                        </div>
                      </div>
                      {/* Detail invoice (expanded) */}
                      {expanded&&<div style={{background:C.bg0,borderTop:`1px solid ${C.bo0}`,
                        padding:"10px 14px 14px",animation:"fadeUp .15s ease"}}>
                        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
                          {(t.items||[]).map((item,ii)=>(
                            <div key={ii} style={{display:"flex",alignItems:"center",gap:10,
                              padding:"8px 12px",background:C.bg2,borderRadius:9,border:`1px solid ${C.bo0}`}}>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:12.5,fontWeight:600,overflow:"hidden",
                                  textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                                <div className="mn" style={{fontSize:10,color:C.t2,marginTop:1}}>{item.barcode}</div>
                              </div>
                              <div style={{textAlign:"right",flexShrink:0}}>
                                <div className="mn" style={{fontSize:11,color:C.t2}}>{item.qty} × {rp(item.price)}</div>
                                <div className="mn" style={{fontSize:14,fontWeight:800,color:C.g,marginTop:1}}>{rp(item.price*item.qty)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{background:C.bg2,borderRadius:9,border:`1px solid ${C.bo0}`,padding:"10px 12px",marginBottom:10}}>
                          {t.discount>0&&<>
                            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4,color:C.t2}}>
                              <span>Subtotal</span><span className="mn">{rp(t.subtotal||t.total)}</span>
                            </div>
                            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                              <span style={{color:C.r}}>Diskon</span><span className="mn" style={{color:C.r}}>− {rp(t.discount)}</span>
                            </div>
                          </>}
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                            <span style={{fontWeight:700,fontSize:13}}>Total</span>
                            <span className="mn" style={{fontSize:18,fontWeight:800,color:C.g}}>{rp(t.total)}</span>
                          </div>
                          {(t.profit||0)>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginTop:4,color:C.t2}}>
                            <span>Laba</span><span className="mn" style={{color:C.cy}}>{rp(t.profit)}</span>
                          </div>}
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          {t.returned
                            ?<span style={{flex:1,padding:"9px",textAlign:"center",color:C.a,fontSize:12,fontWeight:600}}><Ico e="✓"/> Sudah diretur</span>
                            :<button onClick={e=>{e.stopPropagation();if(window.confirm("Retur transaksi ini?\nStok akan dikembalikan."))doRetur(t);}} className="press"
                              style={{flex:1,padding:"9px",background:C.a1,border:`1.5px solid ${C.a}33`,
                                borderRadius:9,color:C.a,fontSize:12,fontWeight:700,fontFamily:F.sans}}>↩ Retur</button>}
                          <button onClick={e=>{e.stopPropagation();setInvTrx(t);}} className="press"
                            style={{flex:1,padding:"9px",background:C.pri1,border:`1.5px solid ${C.pri}33`,borderRadius:9,color:C.pri,fontSize:12,fontWeight:700,fontFamily:F.sans}}><Ico e="🧾"/> Invoice</button>
                          <button onClick={e=>{e.stopPropagation();toggleExpand(t.id);}} className="press"
                            style={{padding:"9px 16px",background:C.bg3,border:`1px solid ${C.bo0}`,
                              borderRadius:9,color:C.t2,fontSize:12,fontFamily:F.sans}}>Tutup</button>
                        </div>
                      </div>}
                    </div>;
                  })}
                  {trxFiltered.length>150&&<div style={{padding:"12px 14px",fontSize:11,color:C.t3,
                    textAlign:"center",borderTop:`1px solid ${C.bo0}`}}>
                    Tampil 150 dari {trxFiltered.length}. Gunakan filter/pencarian untuk mempersempit.
                  </div>}
                </div>}
            </Card>;
          })()}
        </div>}



        {/* ── OPERASIONAL ── */}
        {adminTab==="operasional"&&(()=>{
          const q=expQ.trim().toLowerCase();
          const list=expenses.filter(e=>(expBiz==="ALL"||e.business===expBiz)&&(expCat==="ALL"||e.category===expCat)
            &&inRangeDate(expDate(e),expRange,expFrom,expTo)&&(!q||((e.description||"")+" "+e.category).toLowerCase().includes(q)))
            .sort((a,b)=>(b.dateISO||"").localeCompare(a.dateISO||""));
          const total=list.reduce((t,e)=>t+e.amount,0);
          const byCat={};list.forEach(e=>{byCat[e.category]=(byCat[e.category]||0)+e.amount;});
          const top=Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0];
          const del=(e)=>{if(!window.confirm(`Hapus belanja ${e.category} ${rp(e.amount)}?`))return;
            fbDeleteExpense(e.id,`${e.category} ${rp(e.amount)}`,e.business,user.name).then(()=>toast("Belanja dihapus","warn")).catch(er=>toast(er.message,"err"));};
          const bizChip=(b)=>b==="ALL"?"Semua":BIZ[b]?.name;
          return <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:180}}><h2 style={{fontSize:15,fontWeight:800}}>Belanja Operasional</h2>
                <p style={{fontSize:12.5,color:C.t2,marginTop:2}}>Biaya di luar pembelian barang dagangan. Otomatis masuk ke Laba Rugi.</p></div>
              <Btn size="sm" outline onClick={()=>downloadXLSX(list,[
                {key:"date",label:"Tanggal",w:14},{key:"business",label:"Bisnis",fn:r=>BIZ[r.business]?.name||r.business,w:14},
                {key:"category",label:"Kategori",w:24},{key:"description",label:"Keterangan",w:36},{key:"payment",label:"Dibayar",w:12},
                {key:"by",label:"Dicatat oleh",w:18},{key:"amount",label:"Jumlah (Rp)",fn:r=>r.amount,num:true,w:16},
              ],"Operasional","belanja_operasional")}>Export Excel</Btn>
              <Btn size="sm" onClick={()=>setExpenseModal(true)}><Plus size={16}/>Catat belanja</Btn>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
              {["ALL","JS_CLOTHING","JB_STORE"].map(b=><button key={b} onClick={()=>setExpBiz(b)} className={`chip${expBiz===b?" on":""}`}>{bizChip(b)}</button>)}
              <select value={expCat} onChange={e=>setExpCat(e.target.value)} aria-label="Kategori"
                style={{padding:"8px 12px",background:expCat!=="ALL"?C.pri1:C.bg2,border:`1.5px solid ${expCat!=="ALL"?C.pri:C.bo1}`,borderRadius:50,color:expCat!=="ALL"?C.pri:C.t0,fontSize:13,fontFamily:F.sans,fontWeight:600}}>
                <option value="ALL">Semua kategori</option>{EXPENSE_CATS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
              {[["all","Semua"],["today","Hari ini"],["week","7 hari"],["month","Bulan ini"],["lastmonth","Bulan lalu"],["custom","Rentang"]].map(([v,l])=>
                <button key={v} onClick={()=>setExpRange(v)} className={`chip${expRange===v?" on":""}`}>{l}</button>)}
              {expRange==="custom"&&<div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
                <input type="date" value={expFrom} onChange={e=>setExpFrom(e.target.value)} style={{padding:"8px 10px",background:C.bg3,border:`1.5px solid ${C.bo1}`,borderRadius:10,color:C.t0,fontSize:13,fontFamily:F.sans}}/>
                <span style={{color:C.t2,fontSize:13}}>s/d</span>
                <input type="date" value={expTo} onChange={e=>setExpTo(e.target.value)} style={{padding:"8px 10px",background:C.bg3,border:`1.5px solid ${C.bo1}`,borderRadius:10,color:C.t0,fontSize:13,fontFamily:F.sans}}/>
              </div>}
            </div>
            <Inp value={expQ} onChange={e=>setExpQ(e.target.value)} placeholder="Cari keterangan atau kategori" icon={<Search size={16}/>} style={{minHeight:42}}/>
            <div className="stat-grid-3" style={{display:"grid",gap:10,gridTemplateColumns:"repeat(3,1fr)"}}>
              <Stat icon="💰" label="Total belanja" value={rp(total)} color={C.r}/>
              <Stat icon="🧾" label="Jumlah catatan" value={list.length} color={C.cy}/>
              <Stat icon="📋" label="Kategori terbesar" value={top?top[0]:"–"} color={C.a} sub={top?rp(top[1]):undefined}/>
            </div>
            {list.length===0?<Card><EmptyState icon={<ShoppingBasket size={24} strokeWidth={1.6}/>} title="Belum ada belanja operasional" hint="Catat pengeluaran seperti listrik, sewa, kemasan, atau transport, lalu hasilnya muncul di Laba Rugi."/></Card>:<>
              <div className="hide-mobile"><Card noPad style={{overflow:"hidden"}}><TableWrap>
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:720}}>
                  <THead cols={["Tanggal","Bisnis","Kategori","Keterangan","Dibayar","Dicatat oleh","Jumlah",""]}/>
                  <tbody>{list.map((e,i)=><tr key={e.id} className="hrow" style={{borderTop:`1px solid ${C.bo0}`,background:i%2===0?"transparent":C.bg0}}>
                    <td style={{padding:"12px 14px",whiteSpace:"nowrap",color:C.t2}}>{e.date}</td>
                    <td style={{padding:"12px 14px"}}><BizChip biz={e.business} sm/></td>
                    <td style={{padding:"12px 14px",fontWeight:600}}>{e.category}</td>
                    <td style={{padding:"12px 14px",color:C.t1}}>{e.description||"–"}</td>
                    <td style={{padding:"12px 14px",color:C.t2}}>{e.payment}</td>
                    <td style={{padding:"12px 14px",color:C.t2}}>{e.by}</td>
                    <td className="mn" style={{padding:"12px 14px",fontWeight:800,color:C.r,textAlign:"right",whiteSpace:"nowrap"}}>{rp(e.amount)}</td>
                    <td style={{padding:"8px 14px"}}><button aria-label="Hapus" onClick={()=>del(e)} className="press" style={{width:36,height:36,border:"none",background:C.r1,color:C.r,borderRadius:10,display:"grid",placeItems:"center"}}><Trash2 size={16}/></button></td>
                  </tr>)}</tbody>
                </table>
              </TableWrap></Card></div>
              <div className="hide-desktop mobile-card-list">
                {list.map(e=><div key={e.id} className="card-in" style={{background:C.bg2,borderRadius:16,border:`1px solid ${C.bo0}`,padding:"13px 15px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start"}}>
                    <div style={{minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:14.5}}>{e.category}</div>
                      <div style={{fontSize:13,color:C.t1,marginTop:2}}>{e.description||"–"}</div>
                    </div>
                    <div className="mn" style={{fontWeight:800,fontSize:16,color:C.r,whiteSpace:"nowrap"}}>{rp(e.amount)}</div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginTop:8}}>
                    <BizChip biz={e.business} sm/><span style={{fontSize:12,color:C.t2}}>{e.date} · {e.payment} · {e.by}</span>
                    <span style={{flex:1}}/>
                    <button aria-label="Hapus" onClick={()=>del(e)} className="press" style={{width:38,height:38,border:"none",background:C.r1,color:C.r,borderRadius:10,display:"grid",placeItems:"center"}}><Trash2 size={17}/></button>
                  </div>
                </div>)}
              </div>
            </>}
          </div>;
        })()}

        {/* ── LABA RUGI ── */}
        {adminTab==="labarugi"&&(()=>{
          const tIn=trxs.filter(t=>inRangeDate(parseD(t.date),plRange,plFrom,plTo));
          const plTrx=tIn.filter(t=>!t.returned);
          const returnedN=tIn.length-plTrx.length;
          const plExp=expenses.filter(e=>inRangeDate(expDate(e),plRange,plFrom,plTo));
          const sum=(a,f)=>a.reduce((t,x)=>t+(f(x)||0),0);
          const calc=b=>{
            const tt=plTrx.filter(t=>b==="ALL"||t.business===b), ee=plExp.filter(e=>b==="ALL"||e.business===b);
            const net=sum(tt,t=>t.total), disc=sum(tt,t=>t.discount), hpp=sum(tt,t=>t.totalHpp), gp=net-hpp;
            const byCat={};ee.forEach(e=>{byCat[e.category]=(byCat[e.category]||0)+e.amount;});
            const opex=sum(ee,e=>e.amount), np=gp-opex;
            return {trx:tt.length,gross:net+disc,disc,net,hpp,gp,byCat,opex,np,gm:net>0?gp/net*100:0,nm:net>0?np/net*100:0};
          };
          const colIds=plBiz==="ALL"?["JS_CLOTHING","JB_STORE","ALL"]:[plBiz];
          const D=Object.fromEntries(colIds.map(c=>[c,calc(c)]));
          const main=D[plBiz==="ALL"?"ALL":plBiz];
          const cats=[...EXPENSE_CATS.filter(c=>colIds.some(id=>D[id].byCat[c])),...[...new Set(plExp.map(e=>e.category))].filter(c=>!EXPENSE_CATS.includes(c)&&colIds.some(id=>D[id].byCat[c]))];
          const colName=id=>id==="ALL"?"Gabungan":BIZ[id].name;
          const rows=[
            {l:"Penjualan kotor",f:d=>d.gross},
            {l:"Diskon",f:d=>-d.disc,indent:true,col:()=>C.r},
            {l:"Penjualan bersih",f:d=>d.net,strong:true},
            {l:"Harga pokok penjualan (HPP)",f:d=>-d.hpp,indent:true,col:()=>C.r},
            {l:"Laba kotor",f:d=>d.gp,strong:true,note:d=>`Margin ${d.gm.toFixed(1)}%`},
            {head:"Biaya operasional"},
            ...cats.map(c=>({l:c,f:d=>-(d.byCat[c]||0),indent:true,col:()=>C.r})),
            {l:"Total biaya operasional",f:d=>-d.opex,strong:true},
            {l:"Laba (rugi) bersih",f:d=>d.np,total:true,note:d=>`Margin ${d.nm.toFixed(1)}%`},
          ];
          const periodLabel={all:"Semua waktu",today:"Hari ini",week:"7 hari terakhir",month:"Bulan ini",lastmonth:"Bulan lalu",custom:"Rentang tanggal"}[plRange];
          const exportRows=rows.filter(r=>!r.head).map(r=>({l:r.l,...Object.fromEntries(colIds.map(id=>["c_"+id,r.f(D[id])]))}));
          return <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:180}}><h2 style={{fontSize:15,fontWeight:800}}>Laporan Laba Rugi</h2>
                <p style={{fontSize:12.5,color:C.t2,marginTop:2}}>{periodLabel} · {main.trx} transaksi · {plExp.filter(e=>plBiz==="ALL"||e.business===plBiz).length} catatan operasional</p></div>
              <Btn size="sm" outline onClick={()=>downloadXLSX(exportRows,[{key:"l",label:"Keterangan",w:34},...colIds.map(id=>({key:"c_"+id,label:colName(id)+" (Rp)",fn:r=>r["c_"+id],num:true,w:20}))],"Laba Rugi","laporan_laba_rugi")}>Export Excel</Btn>
              <Btn size="sm" onClick={()=>setExpenseModal(true)}><ShoppingBasket size={16}/>Catat belanja</Btn>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
              {["ALL","JS_CLOTHING","JB_STORE"].map(b=><button key={b} onClick={()=>setPlBiz(b)} className={`chip${plBiz===b?" on":""}`}>{b==="ALL"?"Semua bisnis":BIZ[b].name}</button>)}
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
              {[["month","Bulan ini"],["lastmonth","Bulan lalu"],["week","7 hari"],["today","Hari ini"],["all","Semua"],["custom","Rentang"]].map(([v,l])=>
                <button key={v} onClick={()=>setPlRange(v)} className={`chip${plRange===v?" on":""}`}>{l}</button>)}
              {plRange==="custom"&&<div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
                <input type="date" value={plFrom} onChange={e=>setPlFrom(e.target.value)} style={{padding:"8px 10px",background:C.bg3,border:`1.5px solid ${C.bo1}`,borderRadius:10,color:C.t0,fontSize:13,fontFamily:F.sans}}/>
                <span style={{color:C.t2,fontSize:13}}>s/d</span>
                <input type="date" value={plTo} onChange={e=>setPlTo(e.target.value)} style={{padding:"8px 10px",background:C.bg3,border:`1.5px solid ${C.bo1}`,borderRadius:10,color:C.t0,fontSize:13,fontFamily:F.sans}}/>
              </div>}
            </div>
            <div className="stat-grid-4" style={{display:"grid",gap:10,gridTemplateColumns:"repeat(4,1fr)"}}>
              <Stat icon="💰" label="Penjualan bersih" value={rp(main.net)} color={C.g}/>
              <Stat icon="📈" label="Laba kotor" value={rpS(main.gp)} color={C.cy} sub={`Margin ${main.gm.toFixed(1)}%`}/>
              <Stat icon="📋" label="Biaya operasional" value={rp(main.opex)} color={C.a}/>
              <Stat icon="🎯" label={main.np>=0?"Laba bersih":"Rugi bersih"} value={rpS(main.np)} color={main.np>=0?C.g:C.r} sub={`Margin ${main.nm.toFixed(1)}%`}/>
            </div>
            <Card noPad style={{overflow:"hidden"}}>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:plBiz==="ALL"?560:340}}>
                  <thead><tr>
                    <th style={{padding:"12px 16px",textAlign:"left",fontSize:12,fontWeight:700,color:C.t2,background:C.bg3,borderBottom:`1px solid ${C.bo1}`}}>Keterangan</th>
                    {colIds.map(id=><th key={id} style={{padding:"12px 16px",textAlign:"right",fontSize:12,fontWeight:700,color:C.t2,background:C.bg3,borderBottom:`1px solid ${C.bo1}`}}>{colName(id)}</th>)}
                  </tr></thead>
                  <tbody>{rows.map((r,i)=>r.head
                    ?<tr key={i}><td colSpan={colIds.length+1} style={{padding:"14px 16px 6px",fontSize:12.5,fontWeight:800,color:C.t1,borderTop:`1px solid ${C.bo0}`}}>{r.head}</td></tr>
                    :<tr key={i} style={{borderTop:`1px solid ${C.bo0}`,background:r.total?C.pri1:r.strong?C.bg3:undefined}}>
                      <td style={{padding:r.total?"15px 16px":"11px 16px",paddingLeft:r.indent?34:16,fontWeight:r.strong||r.total?800:500,fontSize:r.total?15:14}}>{r.l}</td>
                      {colIds.map(id=>{const v=r.f(D[id]);const col=r.total?(v>=0?C.g:C.r):r.col?r.col(D[id]):C.t0;
                        return <td key={id} className="mn" style={{padding:r.total?"15px 16px":"11px 16px",textAlign:"right",fontWeight:r.strong||r.total?800:600,color:col,fontSize:r.total?16:14,whiteSpace:"nowrap"}}>
                          {rpS(v)}{r.note&&<div style={{fontSize:11.5,fontWeight:500,color:C.t2}}>{r.note(D[id])}</div>}</td>;})}
                    </tr>)}</tbody>
                </table>
              </div>
            </Card>
            {main.opex>0&&<Card>
              <div style={{fontSize:13,fontWeight:800,marginBottom:12}}>Komposisi biaya operasional</div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {Object.entries(main.byCat).sort((a,b)=>b[1]-a[1]).map(([c,v])=><div key={c}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13.5,marginBottom:5}}><span style={{fontWeight:600}}>{c}</span><span className="mn" style={{color:C.t1}}>{rp(v)}</span></div>
                  <ProgressBar value={v} max={main.opex} color={C.a}/>
                </div>)}
              </div>
            </Card>}
            <div style={{fontSize:12.5,color:C.t2,lineHeight:1.6,padding:"4px 2px"}}>
              Penjualan bersih adalah total transaksi setelah diskon{returnedN>0?`, tidak termasuk ${returnedN} transaksi yang diretur`:", tidak termasuk transaksi yang diretur"}. HPP diambil dari HPP produk saat transaksi terjadi. Biaya operasional berasal dari menu Operasional; belanja yang dibagi rata sudah terpecah per bisnis.
            </div>
          </div>;
        })()}

        {/* ── ABSENSI ── */}
        {adminTab==="absensi"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
            <h2 style={{fontSize:15,fontWeight:800}}>Laporan Absensi</h2>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
              <button onClick={()=>downloadXLSX([...attFiltered].sort((a,b)=>{try{return new Date(b.checkInISO||b.checkIn)-new Date(a.checkInISO||a.checkIn);}catch{return 0;}}),[
                {key:"date",label:"Tanggal",w:18},{key:"name",label:"Nama Pegawai",w:22},
                {key:"role",label:"Role",w:10},{key:"business",label:"Bisnis",fn:r=>BIZ[r.business]?.name||r.business,w:14},
                {key:"checkIn",label:"Jam Masuk",w:24},{key:"checkOut",label:"Jam Pulang",fn:r=>r.checkOut||"-",w:24},
                {key:"dur",label:"Durasi",fn:r=>calcDur(r),w:14},
              ],"Absensi","absensi")} className="press"
                style={{padding:"7px 14px",background:C.g1,border:`1px solid ${C.g}33`,borderRadius:8,color:C.g,fontSize:12,fontWeight:700,fontFamily:F.sans}}>⬇ Excel</button>
              <button onClick={async()=>{if(!window.confirm("Reset absensi hari ini?")) return;await fbClearAttendanceByDate(todayDate()).catch(()=>{});toast("Absensi hari ini direset","warn");}} className="press"
                style={{padding:"7px 14px",background:C.r1,border:`1px solid ${C.r}33`,borderRadius:8,color:C.r,fontSize:12,fontWeight:700,fontFamily:F.sans}}><Ico e="🗑"/> Reset Hari Ini</button>
            </div>
          </div>
          <Card style={{padding:"12px 14px"}}>
            <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"flex-end"}}>
              <div style={{flex:"1 1 180px",minWidth:160}}>
                <div style={{fontSize:12,fontWeight:700,color:C.t2,textTransform:"none",letterSpacing:0,marginBottom:5}}>Pegawai</div>
                <select value={selUser} onChange={e=>setSelUser(e.target.value)} style={{width:"100%",padding:"10px 12px",background:C.bg3,border:`1.5px solid ${C.bo0}`,borderRadius:10,color:C.t0,fontSize:13,fontFamily:F.sans,cursor:"pointer"}}>
                  <option value="ALL">Semua Pegawai</option>
                  {users.filter(u=>u.role!=="admin").map(u=><option key={u.id} value={String(u.id)}>{u.name}</option>)}
                </select>
              </div>
              <div style={{flex:"2 1 300px"}}>
                <div style={{fontSize:12,fontWeight:700,color:C.t2,textTransform:"none",letterSpacing:0,marginBottom:5}}>Rentang Waktu</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                  {[["all","Semua"],["today","Hari Ini"],["week","7 Hari"],["month","Bulan Ini"],["custom","Rentang"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setAttRange(v)}
                      className={`chip${attRange===v?" on":""}`}>{l}</button>))}
                  {attRange==="custom"&&<>
                    <input type="date" value={attFrom} onChange={e=>setAttFrom(e.target.value)} style={{padding:"8px 10px",background:C.bg3,border:`1.5px solid ${C.bo1}`,borderRadius:8,color:C.t0,fontSize:12,fontFamily:F.sans}}/>
                    <span style={{color:C.t2,fontSize:12,fontWeight:600}}>s/d</span>
                    <input type="date" value={attTo} onChange={e=>setAttTo(e.target.value)} style={{padding:"8px 10px",background:C.bg3,border:`1.5px solid ${C.bo1}`,borderRadius:8,color:C.t0,fontSize:12,fontFamily:F.sans}}/>
                  </>}
                </div>
              </div>
            </div>
            <div style={{marginTop:10,padding:"7px 11px",background:C.bg3,borderRadius:8,fontSize:11,color:C.t2,border:`1px solid ${C.bo0}`}}>
              Filter berlaku untuk ringkasan dan detail sekaligus
              <span style={{float:"right",fontFamily:F.mono,color:C.g,fontWeight:700}}>{attFiltered.length} record</span>
            </div>
          </Card>
          {/* Ringkasan */}
          <Card noPad style={{overflow:"hidden"}}>
            <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.bo0}`}}>
              <span style={{fontSize:12,fontWeight:700,color:C.t2,textTransform:"none",letterSpacing:0}}>Ringkasan Kehadiran ({Object.keys(attByUser).length} pegawai)</span>
            </div>
            {Object.keys(attByUser).length===0
              ?<EmptyState pad={24} title="Belum ada data untuk periode ini"/>
              :<TableWrap>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <THead cols={["Pegawai","Role","Hadir (Hari)","Total Jam Kerja","Rata-rata/Hari","Terakhir Masuk"]}/>
                  <tbody>{Object.values(attByUser).map((au,i)=>{
                    const avgMin=au.days>0?Math.floor(au.totalMinutes/au.days):0;
                    const totalJam=`${Math.floor(au.totalMinutes/60)}j ${au.totalMinutes%60}m`;
                    const avgJam=`${Math.floor(avgMin/60)}j ${avgMin%60}m`;
                    return <tr key={au.userId} className="hrow" style={{borderTop:`1px solid ${C.bo0}`,background:i%2===0?"transparent":C.bg0}}>
                      <td style={{padding:"14px 13px",fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
                        <Avatar name={au.name} size={24} style={{marginRight:8}}/>{au.name}</td>
                      <td style={{padding:"14px 13px"}}><RoleTag role={au.role}/></td>
                      <td style={{padding:"14px 13px",fontFamily:F.mono,fontWeight:700,color:C.g,fontSize:14}}>{au.days}</td>
                      <td style={{padding:"14px 13px",fontFamily:F.mono,color:C.cy}}>{au.totalMinutes>0?totalJam:"-"}</td>
                      <td style={{padding:"14px 13px",fontFamily:F.mono,color:C.t1}}>{au.totalMinutes>0?avgJam:"-"}</td>
                      <td style={{padding:"14px 13px",fontSize:10.5,color:C.t2}}>{au.records[au.records.length-1]?.checkIn||"-"}</td>
                    </tr>;})}
                  </tbody>
                </table>
              </TableWrap>}
          </Card>
          {/* Detail */}
          <Card noPad style={{overflow:"hidden"}}>
            <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.bo0}`}}>
              <span style={{fontSize:12,fontWeight:700,color:C.t2,textTransform:"none",letterSpacing:0}}>Detail Absensi ({attFiltered.length})</span>
            </div>
            {attFiltered.length===0?<EmptyState pad={24} title="Tidak ada data"/>
            :<>
              <div className="hide-mobile"><TableWrap>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:540}}>
                  <THead cols={["Tanggal","Pegawai","Role","Bisnis","Jam Masuk","Jam Pulang","Durasi"]}/>
                  <tbody>{[...attFiltered].sort((a,b)=>{try{return new Date(b.checkInISO||b.checkIn)-new Date(a.checkInISO||a.checkIn);}catch{return 0;}}).map((a,i)=>(
                    <tr key={a.id} className="hrow" style={{borderTop:`1px solid ${C.bo0}`,background:i%2===0?"transparent":C.bg0}}>
                      <td style={{padding:"14px 13px",fontFamily:F.mono,fontSize:10,color:C.t2,whiteSpace:"nowrap"}}>{a.date}</td>
                      <td style={{padding:"14px 13px",fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
                        <Avatar name={a.name} size={26}/>{a.name}</td>
                      <td style={{padding:"14px 13px"}}><RoleTag role={a.role}/></td>
                      <td style={{padding:"14px 13px"}}><BizChip biz={a.business} sm/></td>
                      <td style={{padding:"14px 13px",fontFamily:F.mono,fontSize:11,color:C.g}}>{a.checkIn}</td>
                      <td style={{padding:"14px 13px",fontFamily:F.mono,fontSize:11,color:a.checkOut?C.t1:C.a}}>
                        {a.checkOut||<span style={{fontSize:10,color:C.a,fontWeight:700}}>● Masih hadir</span>}</td>
                      <td style={{padding:"14px 13px",fontFamily:F.mono,fontSize:11,color:C.cy}}>{calcDur(a)}</td>
                    </tr>))}
                  </tbody>
                </table>
              </TableWrap></div>
              <div className="hide-desktop mobile-card-list">
                {[...attFiltered].sort((a,b)=>{try{return new Date(b.checkInISO||b.checkIn)-new Date(a.checkInISO||a.checkIn);}catch{return 0;}}).map(a=>(
                  <div key={a.id} style={{background:C.bg2,borderRadius:14,border:`1px solid ${a.checkOut?C.bo0:C.a+"44"}`,padding:"13px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                      <Avatar name={a.name} size={40}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:700}}>{a.name}</div>
                        <div style={{display:"flex",gap:5,alignItems:"center",marginTop:2,flexWrap:"wrap"}}>
                          <RoleTag role={a.role}/>
                          <BizChip biz={a.business} sm/>
                          {!a.checkOut&&<span style={{fontSize:9.5,color:C.a,fontWeight:700,animation:"pulse 2s infinite"}}>● Masih hadir</span>}
                        </div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontSize:10,color:C.t2,marginBottom:2}}>{a.date}</div>
                        <div className="mn" style={{fontSize:11,color:C.cy,fontWeight:600}}>{calcDur(a)}</div>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,background:C.bg3,borderRadius:9,padding:"8px 10px"}}>
                      <div><div style={{fontSize:9,color:C.t3,marginBottom:1}}>MASUK</div><div className="mn" style={{fontSize:12,color:C.g,fontWeight:700}}>{a.checkIn}</div></div>
                      <div><div style={{fontSize:9,color:C.t3,marginBottom:1}}>PULANG</div><div className="mn" style={{fontSize:12,color:a.checkOut?C.t1:C.a,fontWeight:600}}>{a.checkOut||"Belum pulang"}</div></div>
                    </div>
                  </div>))}
              </div>
            </>}
          </Card>
        </div>}


        {/* ── LOG STOK ── */}
        {adminTab==="stoklog"&&(()=>{
          const now3=new Date();
          const slogsFiltered=slogs.filter(l=>{
            const matchBiz=slogBiz==="ALL"||l.business===slogBiz;
            const matchType=slogType==="ALL"||l.type===slogType;
            let matchDate=true;
            if(slogRange!=="all"){try{
              const d=parseD(l.date);if(!d) return false;
              if(slogRange==="today") matchDate=!isNaN(d.getTime())&&d.toDateString()===now3.toDateString();
              else if(slogRange==="week"){const w=new Date(now3);w.setDate(w.getDate()-7);matchDate=!isNaN(d.getTime())&&d>=w&&d<=now3;}
              else if(slogRange==="month") matchDate=!isNaN(d.getTime())&&d.getMonth()===now3.getMonth()&&d.getFullYear()===now3.getFullYear();
              else if(slogRange==="custom"){const fr=slogFrom?new Date(slogFrom):null,to=slogTo?new Date(slogTo+"T23:59:59"):null;if(fr&&d<fr)matchDate=false;if(to&&d>to)matchDate=false;}
            }catch{matchDate=false;}}
            return matchBiz&&matchType&&matchDate;
          });
          return <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <h2 style={{fontSize:15,fontWeight:800,flex:1}}>Log Stok <span style={{color:C.t2,fontWeight:500,fontSize:13}}>({slogsFiltered.length}/{slogs.length})</span></h2>
              <button onClick={()=>downloadXLSX(slogsFiltered,[
                {key:"date",label:"Waktu",w:24},{key:"barcode",label:"Barcode",w:14},
                {key:"name",label:"Nama Produk",w:28},{key:"business",label:"Bisnis",fn:r=>BIZ[r.business]?.name||r.business,w:14},
                {key:"type",label:"Tipe",w:10},{key:"qty",label:"Qty",fn:r=>r.qty,num:true,w:8},
                {key:"before",label:"Stok Sebelum",fn:r=>r.before,num:true,w:14},{key:"after",label:"Stok Sesudah",fn:r=>r.after,num:true,w:14},
                {key:"by",label:"Oleh",w:20},
              ],"Log Stok","log_stok")} className="press"
                style={{padding:"7px 14px",background:C.g1,border:`1px solid ${C.g}33`,borderRadius:8,color:C.g,fontSize:12,fontWeight:700,fontFamily:F.sans}}>⬇ Excel</button>
            </div>
            <Card style={{padding:"12px 14px"}}>
              <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center"}}>
                {["ALL","JS_CLOTHING","JB_STORE"].map(b2=><button key={b2} onClick={()=>setSlogBiz(b2)} className="press fbtn"
                  style={{padding:"5px 11px",borderRadius:7,fontSize:11.5,fontWeight:600,cursor:"pointer",background:slogBiz===b2?(b2==="JB_STORE"?C.p1:b2==="JS_CLOTHING"?C.b1:C.g1):"transparent",border:`1.5px solid ${slogBiz===b2?(b2==="JB_STORE"?C.p:b2==="JS_CLOTHING"?C.b:C.g):C.bo0}`,color:slogBiz===b2?(b2==="JB_STORE"?C.p:b2==="JS_CLOTHING"?C.b:C.g):C.t2,fontFamily:F.sans}}>{b2==="ALL"?"Semua":BIZ[b2]?.name}</button>)}
                <div style={{width:1,height:20,background:C.bo0}}/>
                {["ALL","masuk","keluar"].map(t=><button key={t} onClick={()=>setSlogType(t)} className="press fbtn"
                  style={{padding:"5px 11px",borderRadius:7,fontSize:11.5,fontWeight:600,cursor:"pointer",background:slogType===t?(t==="masuk"?C.g1:t==="keluar"?C.r1:C.a1):"transparent",border:`1.5px solid ${slogType===t?(t==="masuk"?C.g:t==="keluar"?C.r:C.a):C.bo0}`,color:slogType===t?(t==="masuk"?C.g:t==="keluar"?C.r:C.a):C.t2,fontFamily:F.sans}}>
                  {t==="ALL"?"Semua":t==="masuk"?"↑ Masuk":"↓ Keluar"}</button>)}
                <div style={{width:1,height:20,background:C.bo0}}/>
                {[["all","Semua"],["today","Hari Ini"],["week","7 Hari"],["month","Bulan Ini"],["custom","Rentang"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setSlogRange(v)} className="press fbtn"
                    style={{padding:"5px 11px",borderRadius:7,fontSize:11.5,fontWeight:600,cursor:"pointer",background:slogRange===v?C.g1:"transparent",border:`1.5px solid ${slogRange===v?C.g:C.bo0}`,color:slogRange===v?C.g:C.t2,fontFamily:F.sans}}>{l}</button>))}
                {slogRange==="custom"&&<>
                  <input type="date" value={slogFrom} onChange={e=>setSlogFrom(e.target.value)} style={{padding:"5px 9px",background:C.bg3,border:`1.5px solid ${C.bo1}`,borderRadius:8,color:C.t0,fontSize:12,fontFamily:F.sans}}/>
                  <span style={{color:C.t2,fontSize:12}}>s/d</span>
                  <input type="date" value={slogTo} onChange={e=>setSlogTo(e.target.value)} style={{padding:"5px 9px",background:C.bg3,border:`1.5px solid ${C.bo1}`,borderRadius:8,color:C.t0,fontSize:12,fontFamily:F.sans}}/>
                </>}
              </div>
            </Card>
            {slogsFiltered.length===0?<Card><EmptyState title="Tidak ada data" hint="Coba ubah filter atau rentang waktu."/></Card>
            :<Card noPad style={{overflow:"hidden"}}>
              <TableWrap>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11.5,minWidth:540}}>
                  <THead cols={["Waktu","Produk","Bisnis","Tipe","Qty","Sblm","Ssdh","Oleh"]}/>
                  <tbody>{slogsFiltered.map((l,i)=><tr key={l.id||i} className="hrow" style={{borderTop:`1px solid ${C.bo0}`,background:i%2===0?"transparent":C.bg0}}>
                    <td style={{padding:"14px 13px",color:C.t2,fontSize:10,whiteSpace:"nowrap"}}>{l.date}</td>
                    <td style={{padding:"14px 13px",fontWeight:500,fontSize:12}}>{l.name}<div className="mn" style={{fontSize:9,color:C.t3}}>{l.barcode}</div></td>
                    <td style={{padding:"14px 13px"}}><BizChip biz={l.business} sm/></td>
                    <td style={{padding:"14px 13px"}}><span style={{padding:"2px 8px",borderRadius:20,fontSize:9.5,fontWeight:700,textTransform:"uppercase",
                      background:l.type==="masuk"?C.g1:l.type==="opname"?C.vi1:C.r1,
                      color:l.type==="masuk"?C.g:l.type==="opname"?C.vi:C.r}}>{l.type==="opname"?"OPNAME":l.type}</span></td>
                    <td style={{padding:"14px 13px",fontFamily:F.mono,fontWeight:700,color:l.type==="masuk"?C.g:l.type==="opname"?C.vi:C.r}}>{l.type==="masuk"?"+":l.type==="opname"?"±":"-"}{l.qty}</td>
                    <td style={{padding:"14px 13px",fontFamily:F.mono,fontSize:11}}>{l.before}</td>
                    <td style={{padding:"14px 13px",fontFamily:F.mono,fontWeight:700}}>{l.after}</td>
                    <td style={{padding:"14px 13px",color:C.t2,fontSize:11}}>{l.by}</td>
                  </tr>)}</tbody>
                </table>
              </TableWrap>
            </Card>}
          </div>;
        })()}

        {/* ── RETUR ── */}
        {adminTab==="returns"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <div style={{flex:1}}><h2 style={{fontSize:15,fontWeight:800}}>Laporan Retur</h2><p style={{fontSize:11.5,color:C.t2,marginTop:2}}>Transaksi yang dibatalkan & stok dikembalikan</p></div>
            <button onClick={()=>downloadXLSX(returns,[
              {key:"id",label:"ID Retur",w:24},{key:"date",label:"Tanggal",w:22},
              {key:"kasir",label:"Kasir",w:20},{key:"business",label:"Bisnis",fn:r=>BIZ[r.business]?.name||r.business,w:14},
              {key:"originalTrxId",label:"ID Transaksi Asal",w:26},{key:"total",label:"Nilai Retur (Rp)",fn:r=>r.total,num:true,w:20},
              {key:"items",label:"Jumlah Item",fn:r=>r.items?.length||0,num:true,w:14},
            ],"Retur","laporan_retur")} className="press"
              style={{padding:"8px 14px",background:C.g1,border:`1px solid ${C.g}33`,borderRadius:9,color:C.g,fontSize:12,fontWeight:700,fontFamily:F.sans}}>⬇ Excel</button>
          </div>
          {returns.length===0
            ?<Card><EmptyState icon={<Undo2 size={24} strokeWidth={1.6}/>} title="Belum ada retur" hint="Transaksi yang dibatalkan akan tercatat di sini."/></Card>
            :<Card noPad style={{overflow:"hidden"}}>
              <TableWrap>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:520}}>
                  <THead cols={["ID Retur","Tanggal","Kasir","Bisnis","TRX Asal","Nilai","Detail"]}/>
                  <tbody>{returns.map((r,i)=><tr key={r.id} className="hrow" style={{borderTop:`1px solid ${C.bo0}`,background:i%2===0?"transparent":C.bg0}}>
                    <td style={{padding:"12px 13px",fontFamily:F.mono,fontSize:10,color:C.a}}>{r.id?.slice(-12)}</td>
                    <td style={{padding:"12px 13px",fontSize:10,color:C.t2}}>{r.date}</td>
                    <td style={{padding:"12px 13px",fontWeight:500}}>{r.kasir}</td>
                    <td style={{padding:"12px 13px"}}><BizChip biz={r.business} sm/></td>
                    <td style={{padding:"12px 13px",fontFamily:F.mono,fontSize:10}}>{r.originalTrxId?.slice(-12)}</td>
                    <td style={{padding:"12px 13px",fontFamily:F.mono,color:C.r,fontWeight:700}}>{rp(r.total)}</td>
                    <td style={{padding:"12px 13px"}}>
                      <details><summary style={{fontSize:10,color:C.b,cursor:"pointer"}}>Lihat Barang</summary>
                        <div style={{marginTop:5,fontSize:10,color:C.t1}}>{r.items?.map(it=>`${it.name} x${it.qty}`).join(", ")}</div>
                      </details>
                    </td>
                  </tr>)}</tbody>
                </table>
              </TableWrap>
            </Card>}
        </div>}

        {/* ── AKTIVITAS ── */}
        {adminTab==="actlog"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
          <h2 style={{fontSize:15,fontWeight:800}}>Log Aktivitas</h2>
          {actLogs.length===0?<Card><EmptyState icon={<Activity size={24} strokeWidth={1.6}/>} title="Belum ada aktivitas" hint="Login, perubahan data, dan transaksi akan dicatat di sini."/></Card>:
          <Card noPad style={{overflow:"hidden"}}>
            <TableWrap>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:520}}>
                <THead cols={["Waktu","Aktor","Aksi","Detail","Bisnis"]}/>
                <tbody>{actLogs.map((l,i)=><tr key={i} className="hrow" style={{borderTop:`1px solid ${C.bo0}`,background:i%2===0?"transparent":C.bg0}}>
                  <td style={{padding:"12px 13px",fontSize:10,color:C.t2,whiteSpace:"nowrap"}}>{l.date}</td>
                  <td style={{padding:"12px 13px",fontWeight:600}}>{l.actor}</td>
                  <td style={{padding:"12px 13px"}}><span style={{padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:C.b1,color:C.b}}>{l.action}</span></td>
                  <td style={{padding:"12px 13px",fontSize:11,color:C.t1}}>{l.detail}</td>
                  <td style={{padding:"12px 13px"}}>{l.business?<BizChip biz={l.business} sm/>:"-"}</td>
                </tr>)}</tbody>
              </table>
            </TableWrap>
          </Card>}
        </div>}

        {/* ── OPNAME ── */}
        {adminTab==="opname"&&opnamePanelEl()}

      </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="bnav">
        {BNAV_TABS.map(t=>{const isAct=adminTab===t.id&&!showMoreDrawer;
          return <button key={t.id} className={`bnavbtn${isAct?" active":""}`}
            onClick={()=>{setAdminTab(t.id);setSearchQ("");setPModal(false);setShowMoreDrawer(false);setEditPid(null);setInlineAddMode(false);}}>
            <span className="bnav-icon"><t.ic size={22} strokeWidth={isAct?2.2:1.8}/></span>
            <span className="bnav-label">{t.label}</span>
          </button>;})}
        <button className={`bnavbtn${isMoreTab||showMoreDrawer?" active":""}`} onClick={()=>setShowMoreDrawer(x=>!x)}>
          <span className="bnav-icon"><MoreHorizontal size={22} strokeWidth={isMoreTab||showMoreDrawer?2.2:1.8}/></span>
          <span className="bnav-label">Lainnya</span>
        </button>
      </nav>
    </div>;
  }
  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}
