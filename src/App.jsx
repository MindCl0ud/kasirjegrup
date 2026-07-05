import { useState, useEffect, useRef, useCallback, Component } from "react";
import React from "react"; // Pastikan React terimport untuk komponen fungsional
import {
  loadConfig, saveConfig, clearConfig, initFirebase, isSeeded, seedDatabase,
  subscribeUsers, subscribeProducts, subscribeTransactions, subscribeStockLogs,
  subscribeAttendance, subscribeReturns, subscribeActivityLogs, subscribeTargets,
  fbAddUser, fbUpdateUser, fbDeleteUser, fbAddProduct, fbUpdateProduct, fbDeleteProduct,
  fbAddTransaction, fbAddReturn, fbUpdateStock, fbCheckIn, fbCheckOut,
  fbDeleteAttendance, fbClearAttendanceByDate,
  fbSetTarget, fbDeleteTarget, fbChangePassword,
  fbLogActivity, verifyPassword, syncToSheets,
  subscribeOpnames, subscribeOpnameItems, fbCreateOpname, fbCloseOpname,
  fbDeleteOpname, fbUpdateOpnameItem, fbBulkUpdateOpnameItems, fbApplyOpnameAdjustments,
} from "./firebase.js";

// ─────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────
const BIZ = {
  JS_CLOTHING:{ id:"JS_CLOTHING", name:"JS Clothing", desc:"Usaha Konveksi", icon:"👕", color:"#38bdf8" },
  JB_STORE:   { id:"JB_STORE",    name:"JB Store",    desc:"Toko Skincare",  icon:"✨", color:"#f472b6" },
};
const SEED_USERS = [
  { id:1, username:"admin",    password:"admin123", name:"Administrator",  role:"admin", access:["JS_CLOTHING","JB_STORE"], avatar:"👑", active:true, faceDescriptor:null },
  { id:2, username:"kasir.js", password:"kasir123", name:"Kasir JS Cloth", role:"kasir", access:["JS_CLOTHING"],           avatar:"🧑‍💼", active:true, faceDescriptor:null },
  { id:3, username:"kasir.jb", password:"kasir123", name:"Kasir JB Store", role:"kasir", access:["JB_STORE"],              avatar:"👩‍💼", active:true, faceDescriptor:null },
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
const DARK_C = {
  bg0:"#020817",bg1:"#060e1e",bg2:"#0a1628",bg3:"#0f1e36",bg4:"#152440",
  bo0:"rgba(255,255,255,0.06)",bo1:"rgba(255,255,255,0.1)",bo2:"rgba(255,255,255,0.16)",
  t0:"#e8f4ff",t1:"#8aaac8",t2:"#4a6480",t3:"#253347",
  g:"#00e5a0",g1:"rgba(0,229,160,0.12)",g2:"rgba(0,229,160,0.06)",
  a:"#fbbf24",a1:"rgba(251,191,36,0.13)",
  r:"#fb7185",r1:"rgba(251,113,133,0.13)",
  b:"#38bdf8",b1:"rgba(56,189,248,0.12)",
  p:"#f472b6",p1:"rgba(244,114,182,0.12)",
  cy:"#22d3ee",cy1:"rgba(34,211,238,0.12)",
  vi:"#a78bfa",vi1:"rgba(167,139,250,0.12)",
};
const LIGHT_C = {
  bg0:"#e8edf2",bg1:"#f0f4f8",bg2:"#ffffff",bg3:"#f4f7fa",bg4:"#e2e8ef",
  bo0:"rgba(0,0,0,0.08)",bo1:"rgba(0,0,0,0.12)",bo2:"rgba(0,0,0,0.18)",
  t0:"#0f172a",t1:"#334155",t2:"#64748b",t3:"#94a3b8",
  g:"#059669",g1:"rgba(5,150,105,0.1)",g2:"rgba(5,150,105,0.05)",
  a:"#b45309",a1:"rgba(180,83,9,0.1)",
  r:"#e11d48",r1:"rgba(225,29,72,0.1)",
  b:"#0284c7",b1:"rgba(2,132,199,0.1)",
  p:"#be185d",p1:"rgba(190,24,93,0.1)",
  cy:"#0e7490",cy1:"rgba(14,116,144,0.1)",
  vi:"#6d28d9",vi1:"rgba(109,40,217,0.1)",
};
let C = { ...(localStorage.getItem("je_theme")==="light" ? LIGHT_C : DARK_C) };
const F = { sans:"'Plus Jakarta Sans',system-ui,sans-serif", mono:"'JetBrains Mono',monospace" };

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
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{color-scheme:${C.bg0==="#020817"?"dark":"light"};--safe-t:env(safe-area-inset-top,0px);--safe-b:env(safe-area-inset-bottom,0px);}
  html{height:100%;-webkit-tap-highlight-color:transparent;}
  body{font-family:${F.sans};background:${C.bg1};color:${C.t0};height:100%;-webkit-font-smoothing:antialiased;overscroll-behavior:none;}
  #root{height:100%;display:flex;flex-direction:column;}
  input,button,select,textarea{font-family:inherit;}
  input:focus,textarea:focus,select:focus{outline:none;}
  button{-webkit-tap-highlight-color:transparent;cursor:pointer;}
  ::-webkit-scrollbar{width:3px;height:3px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:${C.bg4};border-radius:2px;}
  ::placeholder{color:${C.t3};}
  input[type=number]::-webkit-inner-spin-button{opacity:.4;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes slideUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes scanLine{0%,100%{top:8%}50%{top:88%}}
  @keyframes pulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.2)}}
  @keyframes glow{0%,100%{box-shadow:0 0 8px ${C.g}55}50%{box-shadow:0 0 20px ${C.g}99}}
  .press{transition:transform .1s;}.press:active{transform:scale(.96);}
  .hrow:hover{background:${C.bg4}!important;}.hrow{transition:background .1s;}
  .mn{font-family:${F.mono};font-variant-numeric:tabular-nums;}
  .atab{padding:10px 14px;background:transparent;border:none;border-bottom:2px solid transparent;
    color:${C.t2};font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;letter-spacing:.2px;transition:.15s;font-family:${F.sans};}
  .atab.on{border-bottom-color:${C.g};color:${C.g};background:${C.g2};}
  .atab:hover:not(.on){color:${C.t0};background:${C.bg3};}
  @media(max-width:640px){.hide-mobile{display:none!important;}.atab{padding:8px 10px;font-size:11px;}}
  @media(min-width:641px){.hide-desktop{display:none!important;}
    .stat-grid-4{grid-template-columns:repeat(4,1fr)!important;}
    .stat-grid-3{grid-template-columns:repeat(3,1fr)!important;}}
  @media(max-width:640px){.stat-grid-4{grid-template-columns:repeat(2,1fr)!important;}
    .stat-grid-3{grid-template-columns:repeat(2,1fr)!important;}}
  .mobile-card-list{display:flex;flex-direction:column;gap:10px;}
  .admin-content{flex:1;overflow-y:auto;padding:10px;padding-bottom:calc(76px + var(--safe-b));min-height:0;}
  @media(min-width:641px){.admin-content{padding-bottom:calc(16px + var(--safe-b));}}

  /* ── Bottom Nav ── */
  .bnav{position:fixed;bottom:0;left:0;right:0;
    background:${C.bg0=="rgba(2,8,23,1)"||C.bg0==="#020817"?"rgba(6,14,30,0.92)":"rgba(240,244,248,0.92)"};
    backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
    border-top:1px solid ${C.bo0};display:flex;z-index:300;
    padding-bottom:var(--safe-b);height:calc(60px + var(--safe-b));align-items:stretch;}
  @media(min-width:641px){.bnav{display:none;}}
  .bnavbtn{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
    gap:2px;border:none;background:transparent;cursor:pointer;padding:6px 2px 4px;
    -webkit-tap-highlight-color:transparent;min-width:0;position:relative;transition:transform .12s;}
  .bnavbtn:active{transform:scale(.88);}
  .bnavbtn .bnav-icon{font-size:22px;line-height:1;transition:transform .2s,filter .2s;}
  .bnavbtn.active .bnav-icon{transform:scale(1.15) translateY(-1px);}
  .bnavbtn .bnav-label{font-size:9px;font-weight:700;letter-spacing:.2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:60px;transition:color .2s;}
  .bnav-dot{position:absolute;bottom:calc(var(--safe-b) + 3px);width:18px;height:2.5px;border-radius:2px;
    background:linear-gradient(90deg,${C.g},${C.b});transition:opacity .2s,width .2s;}

  /* ── Drawer ── */
  .drawer-overlay{position:fixed;inset:0;background:rgba(2,8,24,.75);z-index:400;animation:fadeIn .18s ease;backdrop-filter:blur(4px);}
  .drawer{position:fixed;bottom:0;left:0;right:0;background:${C.bg2};border-radius:24px 24px 0 0;
    z-index:401;padding:0 0 calc(20px + var(--safe-b));animation:slideUp .28s cubic-bezier(.32,1.2,.6,1);
    border:1px solid ${C.bo1};border-bottom:none;
    box-shadow:0 -20px 60px rgba(0,0,0,.5);}

  /* ── Mobile Cards ── */
  .mcard{background:${C.bg2};border-radius:16px;border:1px solid ${C.bo0};
    padding:14px 15px;transition:transform .12s,background .1s,box-shadow .15s;}
  .mcard:active{transform:scale(.982);background:${C.bg3};}
  .mcard-glass{background:${C.bg0=="rgba(2,8,23,1)"||C.bg0==="#020817"?"rgba(10,22,40,.85)":"rgba(255,255,255,.85)"};
    border-radius:16px;border:1px solid ${C.bo1};padding:14px 15px;
    backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);}

  /* ── Filter Chips ── */
  .chip{display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border-radius:50px;
    font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid ${C.bo0};
    background:transparent;color:${C.t2};font-family:inherit;
    transition:all .15s;-webkit-tap-highlight-color:transparent;}
  .chip:active{transform:scale(.94);}
  .chip.on{background:linear-gradient(135deg,${C.g}22,${C.b}22);border-color:${C.g};color:${C.g};}

  /* ── Stat Cards ── */
  .stat-mobile{border-radius:18px;padding:16px;position:relative;overflow:hidden;
    display:flex;flex-direction:column;gap:6px;
    border:1px solid ${C.bo0};background:${C.bg2};}
  .stat-mobile::before{content:"";position:absolute;inset:0;background:var(--stat-glow);opacity:.06;pointer-events:none;}
  .stat-mobile .stat-val{font-size:20px;font-weight:800;font-variant-numeric:tabular-nums;font-family:'JetBrains Mono',monospace;line-height:1;}
  .stat-mobile .stat-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:${C.t2};}
  .stat-mobile .stat-ico{position:absolute;right:14px;top:14px;font-size:28px;opacity:.18;}

  /* ── Ripple ── */
  @keyframes ripple{from{transform:scale(0);opacity:.5}to{transform:scale(4);opacity:0}}
  .ripple-wrap{position:relative;overflow:hidden;}
  .ripple-wrap .ripple{position:absolute;border-radius:50%;background:currentColor;
    width:40px;height:40px;margin-top:-20px;margin-left:-20px;
    animation:ripple .5s ease-out forwards;pointer-events:none;}

  /* ── General ── */
  .mfield{display:flex;flex-direction:column;gap:3px;}
  .mfield-label{font-size:9.5px;font-weight:700;color:${C.t2};text-transform:uppercase;letter-spacing:.5px;}
  @keyframes cardIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  .card-in{animation:cardIn .22s ease forwards;}
  .card-in:nth-child(1){animation-delay:.03s}
  .card-in:nth-child(2){animation-delay:.06s}
  .card-in:nth-child(3){animation-delay:.09s}
  .card-in:nth-child(4){animation-delay:.12s}
  .card-in:nth-child(5){animation-delay:.15s}
`;
let CSS = makeCSS();

// ─────────────────────────────────────────────────────────────
//  PRIMITIVE UI
// ─────────────────────────────────────────────────────────────
function Toast({n}) {
  if(!n) return null;
  const m={ok:[C.g1,C.g,"✓"],err:[C.r1,C.r,"✕"],warn:[C.a1,C.a,"⚠"],info:[C.cy1,C.cy,"ℹ"]};
  const [bg,cl,ic]=m[n.type]||m.ok;
  return <div style={{position:"fixed",top:"calc(16px + env(safe-area-inset-top, 0px))",left:"50%",transform:"translateX(-50%)",zIndex:9999,
    padding:"11px 18px",borderRadius:12,maxWidth:"min(92vw,380px)",width:"max-content",
    background:bg,border:`1px solid ${cl}44`,color:cl,fontSize:13,fontWeight:600,
    boxShadow:"0 12px 40px rgba(0,0,0,.8)",animation:"fadeUp .2s ease",
    display:"flex",alignItems:"center",gap:8,backdropFilter:"blur(20px)"}}>
    <span>{ic}</span>{n.msg}
  </div>;
}
function Btn({onClick,children,color=C.g,outline,ghost,danger,disabled,full,size="md",style:s={}}) {
  const sz={sm:{p:"7px 13px",f:11},md:{p:"10px 18px",f:13},lg:{p:"14px 22px",f:14}}[size];
  const bg=disabled?"#1a2e45":danger?C.r:outline||ghost?"transparent":color;
  const cl=disabled?C.t2:danger?"#fff":outline?C.t1:ghost?C.t2:color==="#fff"?"#000":"#000";
  const bd=disabled?"#1a2e45":danger?C.r:outline?C.b1:ghost?"transparent":color;
  return <button onClick={onClick} disabled={disabled} className="press"
    style={{padding:sz.p,background:bg,border:`1.5px solid ${bd}`,borderRadius:10,
      color:cl,fontWeight:700,fontSize:sz.f,transition:"opacity .15s",
      width:full?"100%":undefined,letterSpacing:.2,...s}}>{children}</button>;
}
function Inp({value,onChange,type="text",placeholder,disabled,mono,onKeyDown,fref,icon,suffix,label,style:s={}}) {
  return <div style={{position:"relative"}}>
    {label&&<div style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{label}</div>}
    <div style={{position:"relative",display:"flex",alignItems:"center"}}>
      {icon&&<span style={{position:"absolute",left:12,zIndex:1,fontSize:15,pointerEvents:"none",color:C.t2}}>{icon}</span>}
      <input ref={fref} type={type} value={value} onChange={onChange} onKeyDown={onKeyDown}
        placeholder={placeholder} disabled={disabled}
        style={{width:"100%",padding:`12px ${suffix?"40px":"13px"} 12px ${icon?"40px":"13px"}`,
          background:C.bg3,border:`1.5px solid ${C.bo0}`,borderRadius:10,
          color:disabled?C.t2:C.t0,fontSize:14,fontFamily:mono?F.mono:F.sans,transition:"border-color .15s",...s}}
        onFocus={e=>{if(!disabled)e.target.style.borderColor=C.g+"88";}}
        onBlur={e=>e.target.style.borderColor=C.bo0}/>
      {suffix&&<span style={{position:"absolute",right:12,color:C.t2,fontSize:12,pointerEvents:"none",fontFamily:F.mono}}>{suffix}</span>}
    </div>
  </div>;
}
function Card({children,style:s={},onClick,accent,noPad}) {
  return <div onClick={onClick} style={{background:C.bg2,borderRadius:14,
    border:`1px solid ${accent?accent+"33":C.bo0}`,padding:noPad?0:"14px 16px",
    boxShadow:"0 4px 20px rgba(0,0,0,.45)",cursor:onClick?"pointer":undefined,...s}}>
    {children}</div>;
}
function Divider({my=10}) { return <div style={{height:1,background:C.bo0,margin:`${my}px 0`}}/>; }
function RoleTag({role}) {
  const m={kasir:[C.cy1,C.cy,"Kasir"],stok:[C.a1,C.a,"Stok"],admin:[C.vi1,C.vi,"Admin"]};
  const [bg,cl,l]=m[role]||m.kasir;
  return <span style={{padding:"2px 8px",borderRadius:20,fontSize:9.5,fontWeight:700,
    letterSpacing:.5,background:bg,color:cl,textTransform:"uppercase"}}>{l}</span>;
}
function BizChip({biz,sm}) {
  if(!biz||!BIZ[biz]) return null;
  const b=BIZ[biz],isJ=biz==="JS_CLOTHING";
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,
    padding:sm?"1px 7px":"3px 9px",borderRadius:20,fontSize:sm?10:11,fontWeight:600,
    background:isJ?C.b1:C.p1,color:isJ?C.b:C.p,border:`1px solid ${(isJ?C.b:C.p)}22`}}>
    {b.icon} {b.name}</span>;
}
function StockBadge({s}) {
  if(s===0) return <span className="mn" style={{color:C.r,fontWeight:700,fontSize:12}}>0 ✕</span>;
  if(s<10)  return <span className="mn" style={{color:C.a,fontWeight:700,fontSize:12}}>{s} !</span>;
  return <span className="mn" style={{fontSize:12,color:C.t0}}>{s}</span>;
}
function OnlineDot({online}) {
  return <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,fontWeight:600,color:online?C.g:C.a}}>
    <span style={{width:6,height:6,borderRadius:"50%",background:online?C.g:C.a,flexShrink:0,
      animation:online?"glow 2s ease infinite":undefined}}/>
    {online?"Online":"Offline"}</div>;
}
function Stat({icon,label,value,color=C.g,sub,style:s={}}) {
  return <Card style={{padding:"10px 14px",...s}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
      <span style={{fontSize:16}}>{icon}</span>
      <div className="mn" style={{fontSize:18,fontWeight:700,color,lineHeight:1}}>{value}</div>
    </div>
    <div style={{fontSize:11,color:C.t2}}>{label}</div>
    {sub&&<div style={{fontSize:10,color:C.t3,marginTop:1}}>{sub}</div>}
  </Card>;
}
function THead({cols}) {
  return <thead><tr style={{background:C.bg0,position:"sticky",top:0,zIndex:2}}>
    {cols.map((c,i)=><th key={i} style={{padding:"11px 14px",textAlign:"left",color:C.t3,
      fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:1,
      whiteSpace:"nowrap",borderBottom:`1px solid ${C.bo0}`,background:C.bg0}}>{c}</th>)}
  </tr></thead>;
}
function TableWrap({children,maxH="58vh"}) {
  return <div style={{overflowX:"auto",overflowY:"auto",maxHeight:maxH,WebkitOverflowScrolling:"touch",position:"relative"}}>
    {children}</div>;
}
function ProgressBar({value,max,color=C.g,label}) {
  const pct = max>0 ? Math.min((value/max)*100,100) : 0;
  return <div>
    {label&&<div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
      <span style={{color:C.t2}}>{label}</span>
      <span className="mn" style={{color,fontWeight:700}}>{pct.toFixed(0)}%</span>
    </div>}
    <div style={{height:6,background:C.bg4,borderRadius:3,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:3,transition:"width .5s ease"}}/>
    </div>
  </div>;
}


// ─────────────────────────────────────────────────────────────
//  UPDATE BANNER
// ─────────────────────────────────────────────────────────────
function UpdateBanner({onUpdate}) {
  const [visible,setVisible] = React.useState(true);
  if(!visible) return null;
  return (
    <div style={{
      position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",
      zIndex:9000,maxWidth:"calc(100vw - 32px)",width:"max-content",
      background:"linear-gradient(135deg,#0f1e36,#152440)",
      border:`1px solid ${DARK_C.g}44`,borderRadius:16,
      padding:"12px 16px",boxShadow:"0 8px 32px rgba(0,0,0,.7)",
      display:"flex",alignItems:"center",gap:12,
      animation:"fadeUp .3s ease",fontFamily:"system-ui,sans-serif"
    }}>
      <span style={{fontSize:20}}>🆕</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:700,color:DARK_C.t0,marginBottom:1}}>Update tersedia!</div>
        <div style={{fontSize:11,color:DARK_C.t2}}>Versi baru sudah siap dipasang</div>
      </div>
      <div style={{display:"flex",gap:6,flexShrink:0}}>
        <button onClick={onUpdate}
          style={{padding:"8px 16px",background:"linear-gradient(90deg,#00e5a0,#38bdf8)",
            border:"none",borderRadius:10,color:"#020817",fontSize:12,fontWeight:800,
            cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
          ↻ Update
        </button>
        <button onClick={()=>setVisible(false)}
          style={{padding:"8px 12px",background:"transparent",
            border:`1px solid ${DARK_C.bo0}`,borderRadius:10,color:DARK_C.t2,
            fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
          Nanti
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  HEADER
// ─────────────────────────────────────────────────────────────
function Header({title,biz,user,onLogout,onSwitchBiz,onAbsenPulang,hasCheckedIn,online,onToggleTheme,isDark,lowStockCount=0,onLowStockClick,expireCount=0,expiredCount=0,onExpireClick}) {
  const b=BIZ[biz];
  return <header style={{background:`${C.bg2}ee`,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
    borderBottom:`1px solid ${C.bo0}`,padding:"0 12px",height:52,
    display:"flex",alignItems:"center",justifyContent:"space-between",
    position:"sticky",top:0,zIndex:200,flexShrink:0,gap:8,paddingTop:"env(safe-area-inset-top, 0px)"}}>
    <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
      <div style={{width:28,height:28,borderRadius:8,flexShrink:0,
        background:"linear-gradient(135deg,#00e5a0,#38bdf8)",
        display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🏬</div>
      <div style={{minWidth:0}}>
        <div className="mn" style={{fontSize:11,fontWeight:700,letterSpacing:2,
          background:"linear-gradient(90deg,#00e5a0,#38bdf8)",
          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1.2}}>JE GRUP</div>
        <div style={{fontSize:10,color:C.t2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:130}}>
          {b?`${b.icon} ${b.name}`:title}</div>
      </div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
      <div className="hide-mobile"><OnlineDot online={online}/></div>
      {expiredCount>0&&<button onClick={onExpireClick} className="press"
        style={{padding:"3px 8px",borderRadius:20,background:C.r1,
        border:`1px solid ${C.r}33`,color:C.r,fontSize:10,fontWeight:700,cursor:"pointer"}}>
        ⛔ {expiredCount} kadaluarsa</button>}
      {expireCount>0&&<button onClick={onExpireClick} className="press"
        style={{padding:"3px 8px",borderRadius:20,background:`${C.a}18`,
        border:`1px solid ${C.a}44`,color:C.a,fontSize:10,fontWeight:700,cursor:"pointer"}}>
        ⏰ {expireCount} mau expire</button>}
      {lowStockCount>0&&<button onClick={onLowStockClick} className="press"
        style={{padding:"3px 8px",borderRadius:20,background:C.a1,
        border:`1px solid ${C.a}33`,color:C.a,fontSize:10,fontWeight:700,cursor:"pointer"}}>⚠ {lowStockCount} menipis</button>}
      {onSwitchBiz&&user?.access?.length>1&&(
        <button onClick={onSwitchBiz} className="press" style={{padding:"5px 9px",background:C.bg3,
          border:`1px solid ${C.bo1}`,borderRadius:8,color:C.t1,fontSize:11,fontWeight:600}}>⇄</button>)}
      {onAbsenPulang&&hasCheckedIn&&(
        <button onClick={onAbsenPulang} className="press" style={{padding:"5px 9px",background:C.a1,
          border:`1px solid ${C.a}33`,borderRadius:8,color:C.a,fontSize:11,fontWeight:600}}>🏠 Pulang</button>)}
      <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 9px",
        borderRadius:20,background:C.bg3,border:`1px solid ${C.bo0}`}}>
        <span style={{fontSize:13}}>{user?.avatar}</span>
        <span style={{fontSize:11,fontWeight:600,maxWidth:70,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.name?.split(" ")[0]}</span>
        <div className="hide-mobile"><RoleTag role={user?.role}/></div>
      </div>
      {onToggleTheme&&<button onClick={onToggleTheme} className="press"
        style={{padding:"5px 9px",background:C.bg3,border:`1px solid ${C.bo1}`,borderRadius:8,color:C.t2,fontSize:13,lineHeight:1}}>
        {isDark?"☀️":"🌙"}</button>}
      <button onClick={()=>window.location.reload()} className="press" title="Refresh"
        style={{padding:"5px 9px",background:C.bg3,border:`1px solid ${C.bo1}`,
          borderRadius:8,color:C.t2,fontSize:13,lineHeight:1}}>↻</button>
      <button onClick={onLogout} className="press" style={{padding:"5px 9px",background:C.bg3,
        border:`1px solid ${C.bo1}`,borderRadius:8,color:C.t2,fontSize:11,fontWeight:600}}>Keluar</button>
    </div>
  </header>;
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
    if(dist<0.52){setPhase("success");setMsg(`✓ Selamat datang, ${user.name}!`);setTimeout(()=>{cleanup();onSuccess(desc);},1500);}
    else{setPhase("fail");setMsg("Wajah tidak dikenali. Coba lagi.");}
  };
  const sc={scanning:C.b,verifying:C.a,success:C.g,fail:C.r,error:C.r,no_camera:C.r}[phase]||C.t2;
  const sl={init:"Mempersiapkan...",loading:msg,scanning:"Mendeteksi wajah...",verifying:"Memverifikasi...",
    success:"✓ Berhasil",fail:"✗ Tidak dikenali",error:"Error",no_camera:"Kamera tidak tersedia"}[phase];
  return <div style={{position:"fixed",inset:0,zIndex:1000,background:`${C.bg0}f0`,
    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:16,animation:"fadeIn .2s ease"}}>
    <div style={{width:"100%",maxWidth:420,animation:"fadeUp .3s ease"}}>
      <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:10,padding:"8px 16px",borderRadius:24,background:C.bg2,border:`1px solid ${C.bo1}`}}>
          <span style={{fontSize:18}}>{user.avatar}</span>
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
        {(phase==="init"||phase==="loading")&&<div style={{position:"absolute",inset:0,background:"rgba(2,8,24,.9)",
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
          <div style={{width:32,height:32,border:`2.5px solid ${C.bg4}`,borderTopColor:C.g,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
          <p style={{fontSize:12,color:C.t1,textAlign:"center",padding:"0 20px"}}>{msg}</p></div>}
        {phase==="verifying"&&<div style={{position:"absolute",inset:0,background:"rgba(2,8,24,.75)",
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}>
          <div style={{width:40,height:40,border:`2.5px solid ${C.a}44`,borderTopColor:C.a,borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
          <p style={{fontSize:13,color:C.a,fontWeight:700}}>Memverifikasi...</p></div>}
        {phase==="success"&&<div style={{position:"absolute",inset:0,background:`${C.g}08`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:52}}>✅</span></div>}
        {(phase==="fail"||phase==="error"||phase==="no_camera")&&<div style={{position:"absolute",inset:0,background:`${C.r}06`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:52}}>❌</span></div>}
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
//  FIREBASE SETUP
// ─────────────────────────────────────────────────────────────
function FirebaseSetup({onDone}) {
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({apiKey:"",authDomain:"",projectId:"",storageBucket:"",messagingSenderId:"",appId:""});
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const IS={width:"100%",padding:"12px 13px",background:C.bg3,border:`1.5px solid ${C.bo0}`,borderRadius:10,color:C.t0,fontSize:13,fontFamily:F.mono,transition:"border-color .15s"};
  const connect=async()=>{
    if(!form.apiKey||!form.projectId){setErr("API Key dan Project ID wajib diisi.");return;}
    setLoading(true);setErr("");
    const r=await initFirebase(form);
    if(!r.ok){setErr("Koneksi gagal: "+r.error);setLoading(false);return;}
    const seeded=await isSeeded().catch(()=>false);
    if(!seeded) await seedDatabase(SEED_USERS,SEED_PRODUCTS);
    setLoading(false);onDone();
  };
  return <div style={{fontFamily:F.sans,background:C.bg1,color:C.t0,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <style>{CSS}</style>
    <div style={{position:"fixed",inset:0,pointerEvents:"none",overflow:"hidden"}}>
      <div style={{position:"absolute",top:"-15%",right:"-10%",width:"50%",paddingBottom:"50%",borderRadius:"50%",background:`radial-gradient(circle,${C.g}07,transparent 70%)`}}/>
      <div style={{position:"absolute",bottom:"-10%",left:"-5%",width:"45%",paddingBottom:"45%",borderRadius:"50%",background:`radial-gradient(circle,${C.b}05,transparent 70%)`}}/>
    </div>
    <div style={{position:"relative",width:"100%",maxWidth:500,animation:"fadeUp .4s ease"}}>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{display:"inline-flex",width:68,height:68,borderRadius:22,marginBottom:14,
          background:`linear-gradient(135deg,${C.g}20,${C.b}18)`,border:`1.5px solid ${C.g}30`,
          alignItems:"center",justifyContent:"center",fontSize:32}}>🏬</div>
        <h1 className="mn" style={{fontSize:22,fontWeight:700,letterSpacing:3,
          background:`linear-gradient(90deg,${C.g},${C.b})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:10}}>KASIR JE GRUP</h1>
        <div style={{display:"flex",justifyContent:"center",gap:7,flexWrap:"wrap"}}>
          {Object.values(BIZ).map(b=><span key={b.id} style={{fontSize:11,padding:"3px 11px",borderRadius:20,fontWeight:600,
            background:b.id==="JS_CLOTHING"?C.b1:C.p1,color:b.id==="JS_CLOTHING"?C.b:C.p,border:`1px solid ${(b.id==="JS_CLOTHING"?C.b:C.p)}22`}}>{b.icon} {b.name}</span>)}
        </div>
      </div>
      <Card style={{padding:step===1?"22px":"18px 22px"}}>
        {step===1 ? <>
          <h2 style={{fontSize:14,fontWeight:800,marginBottom:4,color:C.g}}>🔥 Hubungkan Firebase</h2>
          <p style={{fontSize:12.5,color:C.t2,marginBottom:18,lineHeight:1.7}}>Database cloud untuk sinkronisasi real-time antar perangkat.</p>
          {[{n:1,t:"Buat Firebase Project",d:"console.firebase.google.com → Add project → kasir-je-grup"},
            {n:2,t:"Daftarkan Web App",d:"Klik ikon </> → nickname: Kasir → Register app"},
            {n:3,t:"Salin firebaseConfig",d:"Salin semua isi objek firebaseConfig yang tampil"},
            {n:4,t:"Aktifkan Firestore",d:"Build → Firestore Database → Create → test mode → asia-southeast1"},
            {n:5,t:"Paste config di sini",d:"Klik tombol di bawah dan isi form"},
          ].map(s=><div key={s.n} style={{display:"flex",gap:10,marginBottom:10,alignItems:"flex-start"}}>
            <div style={{minWidth:22,height:22,borderRadius:"50%",background:C.g1,border:`1px solid ${C.g}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:C.g,flexShrink:0}}>{s.n}</div>
            <div><div style={{fontSize:12.5,fontWeight:600}}>{s.t}</div><div style={{fontSize:11.5,color:C.t2,marginTop:2,lineHeight:1.6}}>{s.d}</div></div>
          </div>)}
          <div style={{marginTop:14,padding:"10px 12px",background:C.g2,borderRadius:8,border:`1px solid ${C.g}22`,fontSize:11.5,color:C.g,marginBottom:16}}>
            💡 Gratis selamanya — Spark plan</div>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={()=>setStep(2)} full>Masukkan Config →</Btn>
            <Btn onClick={()=>window.open("https://console.firebase.google.com","_blank")} outline>Buka ↗</Btn>
          </div>
        </> : <>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <button onClick={()=>setStep(1)} style={{background:"transparent",border:"none",color:C.t2,fontSize:20,lineHeight:1}}>←</button>
            <h2 style={{fontSize:14,fontWeight:800}}>Firebase Config</h2>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[{k:"apiKey",l:"API Key *"},{k:"authDomain",l:"Auth Domain"},{k:"projectId",l:"Project ID *"},
              {k:"storageBucket",l:"Storage Bucket"},{k:"messagingSenderId",l:"Sender ID"},{k:"appId",l:"App ID"}].map(f=>(
              <div key={f.k}>
                <div style={{fontSize:9.5,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{f.l}</div>
                <input value={form[f.k]} onChange={e=>setForm(x=>({...x,[f.k]:e.target.value}))} style={IS}
                  onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.bo0}/>
              </div>))}
          </div>
          {err&&<div style={{marginTop:10,padding:"10px 13px",background:C.r1,borderRadius:8,border:`1px solid ${C.r}33`,fontSize:12,color:C.r}}>⚠ {err}</div>}
          <div style={{marginTop:16}}>
            <Btn onClick={connect} disabled={loading} full size="lg">{loading?"⏳ Menghubungkan...":"🔥 Hubungkan Firebase"}</Btn>
          </div>
        </>}
      </Card>
    </div>
  </div>;
}

// ─────────────────────────────────────────────────────────────
//  INVOICE
// ─────────────────────────────────────────────────────────────
function Invoice({receipt,biz,onClose,onNew}) {
  const b=BIZ[biz];
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
  return <div style={{position:"fixed",inset:0,background:"rgba(2,8,24,.9)",zIndex:600,
    display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:F.sans}} onClick={onClose}>
    <div style={{width:"100%",maxWidth:420,background:C.bg2,borderRadius:"22px 22px 0 0",
      border:`1px solid ${C.bo1}`,borderBottom:"none",animation:"slideUp .3s ease",
      maxHeight:"92vh",overflowY:"auto",paddingBottom:24}} onClick={e=>e.stopPropagation()}>
      <div style={{width:36,height:4,background:C.b1,borderRadius:2,margin:"16px auto 0"}}/>
      <div style={{textAlign:"center",padding:"14px 20px 10px"}}>
        <div style={{fontSize:22,marginBottom:4}}>🧾</div>
        <div style={{fontSize:13,fontWeight:800,letterSpacing:2,color:C.g}}>INVOICE</div>
        <div className="mn" style={{fontSize:10,color:C.t2,marginTop:2}}>{receipt.id}</div>
        <div style={{marginTop:6,display:"flex",justifyContent:"center"}}><BizChip biz={biz}/></div>
      </div>
      <div style={{margin:"0 16px",background:C.bg3,borderRadius:12,border:`1px solid ${C.bo0}`,overflow:"hidden"}}>
        <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.bo0}`}}>
          {([["Tanggal",receipt.date],["Kasir",receipt.kasir],[receipt.namaPembeli&&receipt.namaPembeli!=="Umum"?"Pembeli":null,receipt.namaPembeli],["Pembayaran",receipt.payment||"Tunai"],["No. Invoice",receipt.id]]).filter(([l])=>l).map(([l,v])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
              <span style={{color:C.t2}}>{l}</span>
              <span className="mn" style={{fontWeight:600,fontSize:11}}>{v}</span>
            </div>))}
        </div>
        <div style={{padding:"10px 14px"}}>
          <div style={{fontSize:9.5,fontWeight:700,color:C.t3,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Daftar Barang</div>
          {receipt.items.map((item,i)=>(
            <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:8,paddingBottom:8,borderBottom:`1px solid ${C.bo0}`}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12.5,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                <div className="mn" style={{fontSize:10.5,color:C.t2,marginTop:1}}>{item.qty} × {rp(item.price)}</div>
              </div>
              <div className="mn" style={{fontSize:13,fontWeight:700,color:C.t0,flexShrink:0}}>{rp(item.price*item.qty)}</div>
            </div>))}
        </div>
        <div style={{padding:"10px 14px",background:C.bg4,borderTop:`1px solid ${C.bo0}`}}>
          {receipt.discount>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.t2,marginBottom:4}}>
            <span>Diskon</span><span className="mn" style={{color:C.r}}>− {rp(receipt.discount)}</span></div>}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
            <span style={{fontSize:13,fontWeight:700}}>TOTAL PEMBAYARAN</span>
            <span className="mn" style={{fontSize:22,fontWeight:800,color:C.g}}>{rp(receipt.total)}</span>
          </div>
          <div style={{fontSize:11,color:C.t2,marginTop:4}}>{receipt.items.reduce((s,i)=>s+i.qty,0)} item · {receipt.items.length} produk</div>
        </div>
      </div>
      <div style={{textAlign:"center",padding:"10px 20px 0",fontSize:11,color:C.t3}}>Terima kasih telah berbelanja di {b?.name}!</div>
      <div style={{display:"flex",gap:8,padding:"14px 16px 0"}}>
        <button onClick={printInvoice} className="press"
          style={{flex:1,padding:"13px",background:`linear-gradient(90deg,${C.g},${C.b})`,
            border:"none",borderRadius:11,color:C.bg1,fontSize:13,fontWeight:800,fontFamily:"inherit"}}>
          🖨️ Cetak Invoice</button>
        <button onClick={onNew} className="press"
          style={{flex:1,padding:"13px",background:C.bg3,border:`1px solid ${C.bo1}`,
            borderRadius:11,color:C.t0,fontSize:13,fontWeight:700,fontFamily:"inherit"}}>
          Transaksi Baru →</button>
      </div>
      <div style={{padding:"8px 16px 0"}}>
        <button onClick={onClose} style={{width:"100%",padding:"9px",background:"transparent",
          border:`1px solid ${C.bo0}`,borderRadius:9,color:C.t3,fontSize:12,fontFamily:"inherit"}}>Tutup</button>
      </div>
    </div>
  </div>;
}

// ─────────────────────────────────────────────────────────────
//  STOCK CHECK
// ─────────────────────────────────────────────────────────────
function StockCheckModal({prods,biz,onClose}) {
  const [q,setQ]=useState("");
  const list=prods.filter(p=>!q||p.name.toLowerCase().includes(q.toLowerCase())||p.barcode.includes(q));
  return <div style={{position:"fixed",inset:0,background:"rgba(2,8,24,.88)",zIndex:550,
    display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:F.sans}} onClick={onClose}>
    <div style={{width:"100%",maxWidth:480,background:C.bg2,borderRadius:"22px 22px 0 0",
      border:`1px solid ${C.bo1}`,borderBottom:"none",animation:"slideUp .3s ease",
      maxHeight:"85vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
      <div style={{width:36,height:4,background:C.b1,borderRadius:2,margin:"14px auto 0"}}/>
      <div style={{padding:"10px 16px 12px",borderBottom:`1px solid ${C.bo0}`,flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:14,fontWeight:800}}>📦 Cek Stok Barang</div>
          <BizChip biz={biz}/>
        </div>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:C.t2,fontSize:14,pointerEvents:"none"}}>🔍</span>
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
  const list = prods.filter(p=>p.stock<10).sort((a,b)=>a.stock-b.stock);
  return <div style={{position:"fixed",inset:0,background:"rgba(2,8,24,.85)",zIndex:800,
    display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:F.sans}}
    onClick={onClose}>
    <div style={{width:"100%",maxWidth:460,background:C.bg2,borderRadius:"22px 22px 0 0",
      border:`1px solid ${C.r}44`,borderBottom:"none",animation:"slideUp .25s ease",
      maxHeight:"80vh",display:"flex",flexDirection:"column"}}
      onClick={e=>e.stopPropagation()}>
      <div style={{width:36,height:4,background:C.bo1,borderRadius:2,margin:"14px auto 0"}}/>
      <div style={{padding:"10px 16px 12px",borderBottom:`1px solid ${C.bo0}`,flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:14,fontWeight:800,color:C.r}}>⚠ Stok Menipis</div>
            <div style={{fontSize:11,color:C.t2,marginTop:2}}>{list.length} produk perlu ditambah stok</div>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:C.t2,fontSize:20,cursor:"pointer",lineHeight:1}}>×</button>
        </div>
      </div>
      <div style={{overflowY:"auto",flex:1}}>
        {list.length===0
          ?<div style={{padding:"32px",textAlign:"center",color:C.t3,fontSize:13}}>Semua stok aman ✅</div>
          :list.map((p,i)=>(
          <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",
            borderTop:i>0?`1px solid ${C.bo0}`:undefined}}>
            <div style={{width:36,height:36,borderRadius:10,flexShrink:0,display:"flex",alignItems:"center",
              justifyContent:"center",fontSize:20,
              background:p.stock===0?C.r1:C.a1,border:`1px solid ${p.stock===0?C.r:C.a}33`}}>
              {p.stock===0?"✕":"!"}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
              <div style={{display:"flex",gap:6,marginTop:2,flexWrap:"wrap",alignItems:"center"}}>
                <span className="mn" style={{fontSize:10,color:C.t2}}>{p.barcode}</span>
                <BizChip biz={p.business} sm/>
                <span style={{fontSize:10,color:C.t2}}>{p.category}</span>
              </div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div className="mn" style={{fontSize:22,fontWeight:800,
                color:p.stock===0?C.r:C.a,lineHeight:1}}>{p.stock}</div>
              <div style={{fontSize:10,color:C.t2,marginTop:2}}>{p.stock===0?"HABIS":"tersisa"}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{padding:"12px 16px",borderTop:`1px solid ${C.bo0}`,flexShrink:0,fontSize:11,color:C.t2,
        display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span>Total: <b style={{color:C.r}}>{list.filter(p=>p.stock===0).length} habis</b> · <b style={{color:C.a}}>{list.filter(p=>p.stock>0).length} menipis</b></span>
        <button onClick={onClose} style={{padding:"6px 16px",background:C.bg3,border:`1px solid ${C.bo1}`,
          borderRadius:8,color:C.t1,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:F.sans}}>Tutup</button>
      </div>
    </div>
  </div>;
}


// ─────────────────────────────────────────────────────────────
//  ADDON PROMPT MODAL
// ─────────────────────────────────────────────────────────────
function AddonPrompt({prompt, onAdd, onSkip}) {
  const {mainItem, addons} = prompt;
  const [selected, setSelected] = React.useState(() => new Set());
  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const handleConfirm = () => {
    const chosen = addons.filter(a => selected.has(a.id));
    onAdd(chosen);
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(2,8,24,.88)",zIndex:700,
      display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:F.sans}}
      onClick={onSkip}>
      <div style={{width:"100%",maxWidth:460,background:C.bg2,borderRadius:"22px 22px 0 0",
        border:`1px solid ${C.g}44`,borderBottom:"none",animation:"slideUp .22s ease",
        padding:"16px 18px 32px"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:36,height:4,background:C.bo1,borderRadius:2,margin:"0 auto 16px"}}/>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <div style={{width:40,height:40,borderRadius:12,background:C.g1,border:`1px solid ${C.g}33`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>➕</div>
          <div>
            <div style={{fontSize:14,fontWeight:800}}>Tambah Add-on?</div>
            <div style={{fontSize:12,color:C.t2,marginTop:1}}>
              Produk <b style={{color:C.g}}>{mainItem.name}</b> punya item tambahan
            </div>
          </div>
        </div>
        {/* Addon list */}
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
          {addons.map(a => {
            const sel = selected.has(a.id);
            return (
              <button key={a.id} onClick={()=>toggle(a.id)} className="press"
                style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",
                  borderRadius:12,cursor:"pointer",textAlign:"left",
                  background:sel?C.g1:C.bg3,
                  border:`2px solid ${sel?C.g:C.bo0}`,transition:"all .15s"}}>
                <div style={{width:24,height:24,borderRadius:6,flexShrink:0,
                  background:sel?C.g:"transparent",border:`2px solid ${sel?C.g:C.bo1}`,
                  display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>
                  {sel&&<span style={{color:"#000",fontSize:13,fontWeight:700}}>✓</span>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</div>
                  <div style={{fontSize:10.5,color:C.t2,marginTop:1}}>{a.barcode} · Stok: {a.stock}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div className="mn" style={{fontSize:15,fontWeight:700,color:sel?C.g:C.t1}}>{rp(a.price)}</div>
                  {a.hpp>0&&<div style={{fontSize:10,color:C.t3,marginTop:1}}>hpp {rp(a.hpp)}</div>}
                </div>
              </button>
            );
          })}
        </div>
        {/* Summary */}
        {selected.size>0&&(
          <div style={{padding:"8px 12px",background:C.g2,borderRadius:9,border:`1px solid ${C.g}22`,
            fontSize:12,color:C.g,marginBottom:12,display:"flex",justifyContent:"space-between"}}>
            <span>{selected.size} add-on dipilih</span>
            <span className="mn" style={{fontWeight:700}}>
              +{rp(addons.filter(a=>selected.has(a.id)).reduce((s,a)=>s+a.price,0))}
            </span>
          </div>
        )}
        {/* Actions */}
        <div style={{display:"flex",gap:8}}>
          <button onClick={handleConfirm} className="press"
            style={{flex:2,padding:"13px",
              background:selected.size>0?`linear-gradient(90deg,${C.g},${C.b})`:C.bg3,
              border:`1.5px solid ${selected.size>0?C.g:C.bo0}`,
              borderRadius:12,color:selected.size>0?"#000":C.t2,
              fontSize:13,fontWeight:800,fontFamily:F.sans,cursor:"pointer"}}>
            {selected.size>0?`✓ Tambah ${selected.size} Add-on`:"✓ Lanjut Tanpa Add-on"}
          </button>
          <button onClick={onSkip} className="press"
            style={{flex:1,padding:"13px",background:"transparent",
              border:`1px solid ${C.bo0}`,borderRadius:12,color:C.t2,
              fontSize:12,fontFamily:F.sans,cursor:"pointer"}}>Lewati</button>
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
//  EXPIRE POPUP
// ─────────────────────────────────────────────────────────────
function ExpirePopup({nearExpiry, expiredProds, onClose}) {
  const all=[...expiredProds,...nearExpiry];
  const daysDiff=(dateStr)=>{
    const d=Math.ceil((new Date(dateStr)-new Date())/(1000*60*60*24));
    return d;
  };
  return <div style={{position:"fixed",inset:0,background:"rgba(2,8,24,.88)",zIndex:800,
    display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:F.sans}}
    onClick={onClose}>
    <div style={{width:"100%",maxWidth:480,background:C.bg2,borderRadius:"22px 22px 0 0",
      border:`1px solid ${C.r}44`,borderBottom:"none",animation:"slideUp .25s ease",
      maxHeight:"82vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
      <div style={{width:36,height:4,background:C.bo1,borderRadius:2,margin:"14px auto 0"}}/>
      <div style={{padding:"10px 16px 12px",borderBottom:`1px solid ${C.bo0}`,flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:14,fontWeight:800}}>⏰ Peringatan Expire</div>
            <div style={{fontSize:11,color:C.t2,marginTop:2}}>
              {expiredProds.length>0&&<span style={{color:C.r,fontWeight:700}}>{expiredProds.length} sudah kadaluarsa · </span>}
              {nearExpiry.length} mendekati expire (≤6 bulan)
            </div>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:C.t2,fontSize:20,cursor:"pointer",lineHeight:1}}>×</button>
        </div>
      </div>
      <div style={{overflowY:"auto",flex:1}}>
        {all.length===0
          ?<div style={{padding:"32px",textAlign:"center",color:C.t3,fontSize:13}}>Semua produk aman ✅</div>
          :all.map((p,i)=>{
            const days=daysDiff(p.expireDate);
            const expired=days<0;
            const urgent=days>=0&&days<=30;
            const warn=days>30&&days<=90;
            const color=expired?C.r:urgent?C.r:warn?C.a:C.g;
            const bg=expired?C.r1:urgent?C.r1:warn?C.a1:C.g1;
            return <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",
              borderTop:i>0?`1px solid ${C.bo0}`:undefined,
              background:expired?`${C.r}04`:undefined}}>
              <div style={{width:42,height:42,borderRadius:11,flexShrink:0,display:"flex",
                flexDirection:"column",alignItems:"center",justifyContent:"center",
                background:bg,border:`1px solid ${color}33`,padding:"2px"}}>
                <span style={{fontSize:expired?16:14}}>{expired?"⛔":urgent?"🔴":warn?"🟡":"🟢"}</span>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                <div style={{display:"flex",gap:6,marginTop:2,flexWrap:"wrap",alignItems:"center"}}>
                  <span className="mn" style={{fontSize:10,color:C.t2}}>{p.barcode}</span>
                  <BizChip biz={p.business} sm/>
                  <span style={{fontSize:10,color:C.t2}}>Stok: {p.stock}</span>
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div className="mn" style={{fontSize:12,fontWeight:800,color}}>
                  {expired?`${Math.abs(days)}h lalu`:days===0?"Hari ini":`${days} hari`}
                </div>
                <div className="mn" style={{fontSize:10,color:C.t2,marginTop:2}}>
                  {new Date(p.expireDate).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}
                </div>
              </div>
            </div>;
          })}
      </div>
      <div style={{padding:"10px 16px",borderTop:`1px solid ${C.bo0}`,flexShrink:0,
        display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12}}>
        <span style={{color:C.t2}}>
          {expiredProds.length>0&&<span style={{color:C.r,fontWeight:700}}>{expiredProds.length} kadaluarsa · </span>}
          {nearExpiry.length} akan expire
        </span>
        <button onClick={onClose} style={{padding:"7px 16px",background:C.bg3,border:`1px solid ${C.bo1}`,
          borderRadius:8,color:C.t1,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Tutup</button>
      </div>
    </div>
  </div>;
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
        <div style={{fontSize:40}}>⚠️</div>
        <h2 style={{fontSize:18,fontWeight:700}}>Terjadi Error</h2>
        <p style={{fontSize:13,color:"#4a6480",maxWidth:400,lineHeight:1.6}}>
          {String(this.state.error?.message||this.state.error)}
        </p>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
          <button onClick={()=>window.location.reload()}
            style={{padding:"10px 20px",background:"#00e5a0",border:"none",borderRadius:9,
              color:"#020817",fontWeight:700,fontSize:13,cursor:"pointer"}}>
            🔄 Reload
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
  const bc = biz==="JS_CLOTHING" ? C.b : C.p;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(2,8,24,.88)",zIndex:600,
      display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:F.sans}}
      onClick={onClose}>
      <div style={{width:"100%",maxWidth:520,background:C.bg2,borderRadius:"22px 22px 0 0",
        border:`1px solid ${bc}44`,borderBottom:"none",animation:"slideUp .25s ease",
        maxHeight:"88vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:36,height:4,background:C.bo1,borderRadius:2,margin:"14px auto 0"}}/>
        <div style={{padding:"10px 16px 12px",borderBottom:`1px solid ${C.bo0}`,flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div>
              <div style={{fontSize:14,fontWeight:800}}>📦 Stok Produk</div>
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
                  border:"none",color:p.stock===0?C.t3:"#fff",
                  cursor:p.stock===0?"not-allowed":"pointer",flexShrink:0}}>
                🛒
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
function TemplateOpnameTab({ opnameItems, bizProds, physInput, setPhysInput, notesInput, setNotesInput, searchQ, setSearchQ, C, F, rp, uid, toast, fbUpdateOpnameItem, selectedOpname, opnames, slogs, showImportOpname, setShowImportOpname, importOpnameRows, setImportOpnameRows, loadSheetJS, downloadXLSX, BIZ }) {
  const filtered = bizProds().filter(p => !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase()) || p.barcode.includes(searchQ));
  return <div>
    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
      <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Cari barcode / nama..."
        style={{flex:1,minWidth:160,padding:"9px 12px",background:C.bg3,border:`1.5px solid ${C.bo0}`,borderRadius:9,color:C.t0,fontSize:12}}/>
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
function KartuStockTab({ slogs, prods, biz, BIZ, C, F, rp, loadSheetJS, downloadXLSX, selectedOpname, opnameItems, opnames, toast }) {
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
      <button onClick={async()=>{
        await exportOpnameExcel(selectedOpname, opnameItems, bizProds, opnames.find(o=>o.id===selectedOpname), slogs, BIZ, rp);
        toast("✅ Excel diunduh");
      }} className="press"
        style={{padding:"7px 12px",background:C.g1,border:`1px solid ${C.g}44`,borderRadius:8,color:C.g,fontSize:11,fontWeight:700,cursor:"pointer"}}>
        ⬇ Export
      </button>
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
async function exportOpnameExcel(opnameId, opnameItems, bizProds, session, slogs, BIZ, rp) {
  const XLSX = await loadSheetJS();
  const wb = XLSX.utils.book_new();

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
function OpnamePanel({
  opnames, opnameItems, selectedOpname, setSelectedOpname,
  opnameTab, setOpnameTab, showCreateOpname, setShowCreateOpname,
  showImportOpname, setShowImportOpname, importOpnameRows, setImportOpnameRows,
  bizProds, prods, user, biz, toast, rp, uid, nowStr,
  fbCreateOpname, fbCloseOpname, fbDeleteOpname, fbUpdateOpnameItem,
  fbBulkUpdateOpnameItems, fbApplyOpnameAdjustments,
  slogs, loadSheetJS, downloadXLSX, BIZ, C, F,
}) {
  const [opnameForm, setOpnameForm] = useState({ business: "JS_CLOTHING", date: new Date().toISOString().slice(0,10), notes: "" });
  const [physInput, setPhysInput] = useState({});
  const [notesInput, setNotesInput] = useState({});
  const [searchQ, setSearchQ] = useState("");
  const [activeSession, setActiveSession] = useState(null);

  const filteredSessions = opnames.filter(o => o.business === biz && o.status !== "deleted");

  const handleCreate = async () => {
    if (!opnameForm.date) { toast("Pilih tanggal dulu", "warn"); return; }
    const id = await fbCreateOpname({
      business: opnameForm.business,
      date: opnameForm.date,
      notes: opnameForm.notes,
      pic: user.name,
      picId: user.id,
      status: "open",
    });
    setSelectedOpname(id);
    setShowCreateOpname(false);
    setOpnameForm({ business: "JS_CLOTHING", date: new Date().toISOString().slice(0,10), notes: "" });
    toast("Sesi opname dibuat");
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus sesi opname ini?")) return;
    await fbDeleteOpname(id);
    if (selectedOpname === id) setSelectedOpname(null);
    toast("Sesi dihapus");
  };

  const statusColors = { open: C.g, closed: C.a, applied: C.b };
  const statusLabels = { open: "OPEN", closed: "CLOSED", applied: "APPLIED" };

  return <div style={{maxWidth:800,margin:"0 auto",display:"flex",flexDirection:"column",gap:10}}>
    {showCreateOpname && <div style={{position:"fixed",inset:0,background:"rgba(2,8,24,.85)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}
      onClick={()=>setShowCreateOpname(false)}>
      <div style={{width:"100%",maxWidth:420,background:C.bg2,borderRadius:"22px 22px 0 0",padding:"18px 20px 32px",
        border:`1px solid ${C.bo1}`,borderBottom:"none",animation:"slideUp .25s ease"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:36,height:4,background:C.b1,borderRadius:2,margin:"0 auto 16px"}}/>
        <h3 style={{fontSize:14,fontWeight:800,marginBottom:14,color:C.a}}>📋 Buat Sesi Opname Baru</h3>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{fontSize:11,color:C.t2}}>PIC: <b style={{color:C.t0}}>{user.name}</b></div>
          <select value={opnameForm.business} onChange={e=>setOpnameForm(f=>({...f,business:e.target.value}))}
            style={{padding:"11px 13px",background:C.bg3,border:`1.5px solid ${C.bo0}`,borderRadius:10,color:C.t0,fontSize:12}}>
            {Object.values(BIZ).map(b=><option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
          </select>
          <input type="date" value={opnameForm.date} onChange={e=>setOpnameForm(f=>({...f,date:e.target.value}))}
            style={{padding:"11px 13px",background:C.bg3,border:`1.5px solid ${C.bo0}`,borderRadius:10,color:C.t0,fontSize:12}}/>
          <input value={opnameForm.notes} onChange={e=>setOpnameForm(f=>({...f,notes:e.target.value}))}
            placeholder="Catatan (opsional)"
            style={{padding:"11px 13px",background:C.bg3,border:`1.5px solid ${C.bo0}`,borderRadius:10,color:C.t0,fontSize:12}}/>
          <div style={{display:"flex",gap:8,marginTop:4}}>
            <button onClick={()=>setShowCreateOpname(false)}
              style={{flex:1,padding:"11px",background:C.bg3,border:`1px solid ${C.bo1}`,borderRadius:10,color:C.t1,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Batal</button>
            <button onClick={handleCreate}
              style={{flex:1,padding:"11px",background:C.g1,border:`1px solid ${C.g}44`,borderRadius:10,color:C.g,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Buat Sesi</button>
          </div>
        </div>
      </div>
    </div>}

    {showImportOpname && <ImportOpnameModal
      show={showImportOpname}
      onClose={()=>setShowImportOpname(false)}
      onImport={async (items)=>{
        if (!selectedOpname || !items.length) return;
        await fbBulkUpdateOpnameItems(selectedOpname, items);
        setShowImportOpname(false);
        toast(`✅ ${items.length} produk diimport`);
      }}
      C={C} F={F} loadSheetJS={loadSheetJS} prods={prods} biz={biz} BIZ={BIZ}
    />}

    {selectedOpname ? <div>
      <button onClick={()=>{setSelectedOpname(null);setOpnameTab("opname");}}
        style={{background:"transparent",border:"none",color:C.a,fontSize:12,fontWeight:600,cursor:"pointer",padding:"6px 0",display:"flex",alignItems:"center",gap:4,marginBottom:8,fontFamily:"inherit"}}>
        ← Kembali ke daftar sesi</button>

      <div style={{display:"flex",gap:4,marginBottom:14,padding:"4px",background:C.bg0,borderRadius:12}}>
        {[
          {id:"opname",label:"TEMPLATE OPNAME"},
          {id:"ringkasan",label:"RINGKASAN"},
          {id:"kartustok",label:"KARTU STOCK"},
        ].map(t=>(
          <button key={t.id} onClick={()=>setOpnameTab(t.id)}
            style={{flex:1,padding:"8px 0",border:"none",borderRadius:8,fontSize:10,fontWeight:700,
              background:opnameTab===t.id?C.g1:"transparent",color:opnameTab===t.id?C.g:C.t3,cursor:"pointer",fontFamily:"inherit"}}>{t.label}</button>
        ))}
      </div>

      {opnameTab==="opname"&&<TemplateOpnameTab
        opnameItems={opnameItems} bizProds={bizProds}
        physInput={physInput} setPhysInput={setPhysInput}
        notesInput={notesInput} setNotesInput={setNotesInput}
        searchQ={searchQ} setSearchQ={setSearchQ}
        C={C} F={F} rp={rp} uid={uid} toast={toast}
        fbUpdateOpnameItem={fbUpdateOpnameItem} selectedOpname={selectedOpname}
        opnames={opnames} slogs={slogs}
        showImportOpname={showImportOpname} setShowImportOpname={setShowImportOpname}
        importOpnameRows={importOpnameRows} setImportOpnameRows={setImportOpnameRows}
        loadSheetJS={loadSheetJS} downloadXLSX={downloadXLSX} BIZ={BIZ}/>}

      {opnameTab==="ringkasan"&&<RingkasanTab
        opnameItems={opnameItems} selectedOpname={selectedOpname}
        opnames={opnames} user={user} toast={toast}
        fbCloseOpname={fbCloseOpname} fbApplyOpnameAdjustments={fbApplyOpnameAdjustments}
        C={C} F={F} rp={rp}/>}

      {opnameTab==="kartustok"&&<KartuStockTab
        slogs={slogs} prods={prods} biz={biz} BIZ={BIZ}
        C={C} F={F} rp={rp} loadSheetJS={loadSheetJS} downloadXLSX={downloadXLSX}
        selectedOpname={selectedOpname} opnameItems={opnameItems} opnames={opnames} toast={toast}/>}
    </div> : <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <h2 style={{fontSize:15,fontWeight:800}}>📋 Opname Sessions</h2>
        <button onClick={()=>setShowCreateOpname(true)}
          style={{padding:"9px 16px",background:C.g1,border:`1px solid ${C.g}44`,borderRadius:10,color:C.g,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Buat Sesi Baru</button>
      </div>
      {filteredSessions.length === 0 ? <div style={{padding:20,textAlign:"center",color:C.t3,fontSize:12}}>Belum ada sesi opname</div>
      : filteredSessions.map(s=>{
        const st = s.status || "open";
        return <Card key={s.id} style={{marginBottom:8}} onClick={()=>setSelectedOpname(s.id)}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontWeight:600,fontSize:13,marginBottom:3}}>{BIZ[s.business]?.icon} {BIZ[s.business]?.name || s.business}</div>
              <div style={{fontSize:11,color:C.t2}}>📅 {s.date} · 👤 {s.pic}</div>
              {s.notes && <div style={{fontSize:10,color:C.t3,marginTop:2}}>📝 {s.notes}</div>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{padding:"2px 8px",borderRadius:4,fontSize:9,fontWeight:700,textTransform:"uppercase",
                color:statusColors[st]||C.t2,background:`${(statusColors[st]||C.t2)}22`}}>
                {statusLabels[st]||st.toUpperCase()}</span>
              {st === "open" && <button onClick={e=>{e.stopPropagation();handleDelete(s.id);}}
                style={{background:"transparent",border:"none",color:C.r,fontSize:14,cursor:"pointer",padding:2}}>🗑️</button>}
            </div>
          </div>
        </Card>;
      })}
    </div>}
  </div>;
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
//  MAIN APP
// ─────────────────────────────────────────────────────────────
function AppInner() {
  // ─── Firebase ───
  const [fbReady,setFbReady]=useState(false);
  const [fbSetup,setFbSetup]=useState(false);
  const [fbLoad,setFbLoad]=useState(true);
  // ─── Theme ───
  const [isDark,setIsDark]=useState(()=>localStorage.getItem("je_theme")!=="light");
  const [updateReady,setUpdateReady]=useState(false);
  const toggleTheme=()=>{
    const next=!isDark;
    Object.assign(C,next?DARK_C:LIGHT_C);
    CSS=makeCSS();
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
    ];
    return()=>uns.forEach(u=>u());
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
      if(s.screen==="admin") setAdminTab("dashboard");
      setScreen(s.screen);
    }catch{sessionStorage.removeItem("je_session");}
  },[fbReady,users]);

  // ─── Toast ───
  const [notif,setNotif]=useState(null);
  const nRef=useRef(null);
  const toast=useCallback((msg,type="ok")=>{
    if(nRef.current) clearTimeout(nRef.current);
    setNotif({msg,type});nRef.current=setTimeout(()=>setNotif(null),3000);
  },[]);
  // ─── Auth ───
  const [screen,setScreen]=useState("login");
  const [user,setUser]=useState(null);
  const [biz,setBiz]=useState(null);
  const [pending,setPending]=useState(null);
  const [faceReg,setFaceReg]=useState(null);
  const [sessionStart,setSessionStart]=useState(null);
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
    const rec=todayAtt(user?.id,biz);if(!rec) return;
    await fbCheckOut(rec.id,nowStr()).catch(()=>{});
    toast("✅ Absen pulang tercatat!");
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
    if(u.access.length===1){
      const b=u.access[0];setBiz(b);await doCheckIn(u,b);
      const sc=u.role==="kasir"?"kasir":"stok";
      setScreen(sc);
      sessionStorage.setItem("je_session",JSON.stringify({userId:u.id,biz:b,screen:sc,t:Date.now()}));
    } else setScreen("bizselect");
  };
  const doLogout=()=>{
    setUser(null);setBiz(null);setScreen("login");setSessionStart(null);
    setCart([]);setScanIn("");setStokTarget(null);setReceipt(null);
    sessionStorage.removeItem("je_session");
  };
  const handlePulang=async()=>{await doCheckOut();setTimeout(doLogout,1500);};

  // ─── Kasir state ───
  const [cart,setCart]=useState([]);
  const [scanIn,setScanIn]=useState("");
  const [receipt,setReceipt]=useState(null);
  const [showStock,setShowStock]=useState(false);
  const [showLowStock,setShowLowStock]=useState(false);
  const [showKasirStok,setShowKasirStok]=useState(false);
  const [kasirStokSearch,setKasirStokSearch]=useState("");
  const [addonPrompt,setAddonPrompt]=useState(null); // {mainItem, addons:[]}
  const [discount,setDiscount]=useState({type:"pct",value:""});
  const [payMethod,setPayMethod]=useState("Tunai");
  const [namaPembeli,setNamaPembeli]=useState("");
  const [showCheckout,setShowCheckout]=useState(false);
  const scanRef=useRef(null);
  useEffect(()=>{if(screen==="kasir"&&!receipt&&!showCheckout)setTimeout(()=>scanRef.current?.focus(),100);},[screen,receipt,showCheckout]);
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
  const [gsUrl,setGsUrl]=useState(()=>localStorage.getItem("je_gs_url")||"");
  const [gsLoad,setGsLoad]=useState(false);
  const [copyDone,setCopyDone]=useState(false);
  const [uModal,setUModal]=useState(false);
  const [uForm,setUForm]=useState({});
  const [editUid,setEditUid]=useState(null);
  const [pModal,setPModal]=useState(false);
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
  // ─── Opname state ───
  const [opnames, setOpnames] = useState([]);
  const [opnameItems, setOpnameItems] = useState([]);
  const [selectedOpname, setSelectedOpname] = useState(null);
  const [opnameTab, setOpnameTab] = useState("opname"); // "opname" | "ringkasan" | "kartustok"
  const [opnameBiz, setOpnameBiz] = useState(null);
  const [showCreateOpname, setShowCreateOpname] = useState(false);
  const [showImportOpname, setShowImportOpname] = useState(false);
  const [importOpnameRows, setImportOpnameRows] = useState([]);

  // ─── Helpers ───
  const bizProds=(b=biz)=>prods.filter(p=>p.business===b);
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
      return [...prev,{id:p.id,barcode:p.barcode,name:p.name,price:p.price,hpp:p.hpp||0,stock:p.stock,qty}];
    });
  };
  const kasirScan=useCallback(async(bc)=>{
    bc=bc.trim();if(!bc) return;
    const p=prods.find(x=>x.barcode===bc&&x.business===biz) || prods.find(x=>x.name.toLowerCase().includes(bc.toLowerCase())&&x.business===biz);
    if(!p){toast("Produk tidak ditemukan: "+bc,"err");setScanIn("");return;}
    if(p.stock===0){toast("Stok "+p.name+" habis!","warn");setScanIn("");return;}
    // Check if this product has add-ons configured
    const addonIds=p.addons||[];
    const availableAddons=addonIds.map(id=>prods.find(x=>x.id===id&&x.business===biz&&x.stock>0)).filter(Boolean);
    addToCart(p);
    setScanIn("");
    if(availableAddons.length>0){
      setAddonPrompt({mainItem:p,addons:availableAddons});
    } else {
      toast("✓ "+p.name);
      scanRef.current?.focus();
    }
  },[prods,biz,toast]);

  const calcDiscount=(subtotal)=>{
    if(!discount.value||+discount.value<=0) return 0;
    if(discount.type==="pct") return Math.floor(subtotal*(+discount.value/100));
    return Math.min(+discount.value,subtotal);
  };

  const doCheckout=useCallback(async()=>{
    if(!cart.length) return;
    const subtotal=cart.reduce((s,c)=>s+c.price*c.qty,0);
    const discAmt=calcDiscount(subtotal);
    const total=subtotal-discAmt;
    const totalHpp=cart.reduce((s,c)=>s+(c.hpp||0)*c.qty,0);
    const trx={id:"TRX-"+uid().toUpperCase(),date:nowStr(),kasir:user.name,kasirId:user.id,business:biz,
      namaPembeli:namaPembeli.trim()||"Umum",
      items:[...cart],subtotal,discount:discAmt,total,totalHpp,profit:total-totalHpp,payment:payMethod,returned:false};
    const stockUpdates=cart.map(c=>({productId:c.id,newStock:c.stock-c.qty}));
    const logs=cart.map(c=>({id:"LOG-"+uid(),date:nowStr(),barcode:c.barcode,name:c.name,
      type:"keluar",qty:c.qty,before:c.stock,after:c.stock-c.qty,by:user.name,business:biz}));
    try{
      await fbAddTransaction(trx,stockUpdates,logs);
      setCart([]);setDiscount({type:"pct",value:""});setPayMethod("Tunai");setNamaPembeli("");
      setShowCheckout(false);setReceipt(trx);toast("✅ Transaksi berhasil! "+rp(total));
    }catch(e){toast("Gagal: "+e.message,"err");}
  },[cart,user,biz,discount,payMethod,toast]);

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
    setPForm({barcode:"",name:"",price:"",hpp:"",stock:"",category:"",business:adminBiz,expireDate:""});
    setEditPid(null);setPModal(true);setInlineAddMode(true);setShowPriceDrawer(false);
    // scroll to top of products section
    setTimeout(()=>document.getElementById("prod-form-anchor")?.scrollIntoView({behavior:"smooth",block:"start"}),50);
  };
  const openEditP=p=>{
    // If same product clicked again → close
    if(editPid===p.id&&pModal){setPModal(false);setEditPid(null);setInlineAddMode(false);return;}
    setPForm({...p,price:String(p.price),hpp:String(p.hpp||0),stock:String(p.stock),expireDate:p.expireDate||""});
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
        await fbAddProduct({...pForm,id:NEXT_ID++,price:+pForm.price,hpp:+pForm.hpp||0,stock:+pForm.stock,expireDate:pForm.expireDate||null},user.name);
        toast("✓ Produk ditambahkan");
      }else{
        await fbUpdateProduct(editPid,{...pForm,id:editPid,price:+pForm.price,hpp:+pForm.hpp||0,stock:+pForm.stock,expireDate:pForm.expireDate||null},user.name);
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
        background:`linear-gradient(90deg,${C.g},${C.b})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>
        KASIR JE GRUP</div>
      <p style={{fontSize:12,color:C.t2}}>Menghubungkan database...</p>
    </div>
  </div>;

  if(fbSetup||!fbReady) return <FirebaseSetup onDone={()=>{setFbReady(true);setFbSetup(false);setFbLoad(false);}}/>;

  if(screen==="facescan"&&pending) return <div style={{fontFamily:F.sans,color:C.t0,height:"100vh",background:C.bg1}}>
    <style>{CSS}</style><Toast n={notif}/>
    <FaceScan user={pending} mode="verify" onSuccess={()=>afterFace(pending)} onCancel={()=>{setPending(null);setScreen("login");}}/>
  </div>;

  if(faceReg) return <div style={{fontFamily:F.sans,color:C.t0,height:"100vh",background:C.bg1}}>
    <style>{CSS}</style><Toast n={notif}/>
    <FaceScan user={users.find(u=>u.id===faceReg)} mode="register" onSuccess={handleFaceReg} onCancel={()=>setFaceReg(null)}/>
  </div>;

  // ─────────────────────────────────────────────────────────────
  //  LOGIN
  // ─────────────────────────────────────────────────────────────
  if(screen==="login") return <div style={{fontFamily:F.sans,background:C.bg1,color:C.t0,minHeight:"100vh",
    display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    {UpdateBannerEl}
    <style>{CSS}</style><Toast n={notif}/>
    <div style={{position:"fixed",inset:0,pointerEvents:"none",overflow:"hidden"}}>
      <div style={{position:"absolute",top:"-15%",right:"-10%",width:"50%",paddingBottom:"50%",borderRadius:"50%",background:`radial-gradient(circle,${C.g}07,transparent 70%)`}}/>
      <div style={{position:"absolute",bottom:"-10%",left:"-5%",width:"45%",paddingBottom:"45%",borderRadius:"50%",background:`radial-gradient(circle,${C.b}05,transparent 70%)`}}/>
    </div>
    <div style={{position:"relative",width:"100%",maxWidth:380,animation:"fadeUp .4s ease"}}>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{display:"inline-flex",width:68,height:68,borderRadius:22,background:`linear-gradient(135deg,${C.g}20,${C.b}18)`,border:`1.5px solid ${C.g}30`,alignItems:"center",justifyContent:"center",fontSize:32,marginBottom:14}}>🏬</div>
        <h1 className="mn" style={{fontSize:22,fontWeight:700,letterSpacing:3,background:`linear-gradient(90deg,${C.g} 0%,${C.b} 55%,${C.p} 100%)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:12}}>KASIR JE GRUP</h1>
        <div style={{display:"flex",justifyContent:"center",gap:7,flexWrap:"wrap",marginBottom:8}}>
          {Object.values(BIZ).map(b=><span key={b.id} style={{fontSize:11,padding:"3px 11px",borderRadius:20,fontWeight:600,background:b.id==="JS_CLOTHING"?C.b1:C.p1,color:b.id==="JS_CLOTHING"?C.b:C.p,border:`1px solid ${(b.id==="JS_CLOTHING"?C.b:C.p)}22`}}>{b.icon} {b.name}</span>)}
        </div>
        <OnlineDot online={online}/>
      </div>
      <Card style={{padding:"24px 20px"}}>
        <h2 style={{fontSize:15,fontWeight:800,marginBottom:4}}>Masuk ke Sistem</h2>
        <p style={{fontSize:12,color:C.t2,marginBottom:18,lineHeight:1.6}}>Pegawai kasir/stok diverifikasi wajah & absen otomatis.</p>
        <div style={{marginBottom:12}}><Inp value={lf.u} onChange={e=>setLf(x=>({...x,u:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="Username" icon="👤" label="Username" mono/></div>
        <div style={{marginBottom:14}}><Inp value={lf.p} onChange={e=>setLf(x=>({...x,p:e.target.value}))} type="password" onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="••••••••" icon="🔒" label="Password"/></div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <div onClick={()=>setRememberMe(x=>!x)} style={{width:40,height:22,borderRadius:11,cursor:"pointer",background:rememberMe?C.g:C.bg4,border:`1.5px solid ${rememberMe?C.g:C.bo1}`,position:"relative",transition:"background .2s",flexShrink:0}}>
            <div style={{position:"absolute",top:2,left:rememberMe?20:2,width:14,height:14,borderRadius:"50%",background:rememberMe?"#000":C.t2,transition:"left .2s"}}/>
          </div>
          <label onClick={()=>setRememberMe(x=>!x)} style={{fontSize:12.5,color:C.t1,cursor:"pointer",userSelect:"none"}}>Ingat login saya</label>
        </div>
        {lerr&&<div style={{padding:"9px 12px",background:C.r1,borderRadius:8,border:`1px solid ${C.r}33`,fontSize:12,color:C.r,marginBottom:14,display:"flex",gap:6}}>⚠ {lerr}</div>}
        <button onClick={doLogin} className="press" style={{width:"100%",padding:"14px",background:`linear-gradient(90deg,${C.g},${C.b})`,border:"none",borderRadius:12,color:C.bg1,fontSize:14,fontWeight:800,boxShadow:`0 4px 20px ${C.g}30`}}>MASUK SEKARANG →</button>
        <Divider my={16}/>
        <div style={{padding:"10px 12px",background:C.bg3,borderRadius:8,border:`1px solid ${C.bo0}`,fontSize:11.5,color:C.t2,lineHeight:1.9}}>
          <span style={{color:C.vi,fontWeight:700}}>👑 Admin</span> — masuk langsung tanpa scan wajah<br/>
          <span style={{color:C.cy,fontWeight:700}}>🧑 Kasir/Stok</span> — verifikasi wajah + absen otomatis
        </div>
      </Card>
      <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:10}}>
        <button onClick={()=>{clearConfig();setFbReady(false);setFbSetup(true);}} style={{background:"transparent",border:"none",color:C.t3,cursor:"pointer",fontSize:11,textDecoration:"underline"}}>Ganti Firebase</button>
        <button onClick={toggleTheme} className="press" style={{background:C.bg2,border:`1px solid ${C.bo1}`,borderRadius:20,padding:"4px 14px",color:C.t1,fontSize:12,fontWeight:600}}>{isDark?"☀️ Terang":"🌙 Gelap"}</button>
      </div>
    </div>
  </div>;

  // ─────────────────────────────────────────────────────────────
  //  BIZ SELECT
  // ─────────────────────────────────────────────────────────────
  if(screen==="bizselect") return <div style={{fontFamily:F.sans,background:C.bg1,color:C.t0,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <style>{CSS}</style><Toast n={notif}/>
    <div style={{width:"100%",maxWidth:400,animation:"fadeUp .35s ease"}}>
      <div style={{textAlign:"center",marginBottom:22}}>
        <div style={{fontSize:36,marginBottom:8}}>{user?.avatar}</div>
        <p style={{fontSize:17,fontWeight:800}}>{user?.name}</p>
        <p style={{fontSize:12.5,color:C.t2,marginTop:4}}>Pilih bisnis untuk hari ini</p>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {user?.access?.map(bizId=>{
          const b=BIZ[bizId],isJ=bizId==="JS_CLOTHING";
          return <button key={bizId} className="press"
            onClick={async()=>{setBiz(bizId);await doCheckIn(user,bizId);setScreen(user.role==="kasir"?"kasir":"stok");}}
            style={{padding:"18px",background:C.bg2,border:`1.5px solid ${C.bo0}`,borderRadius:16,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:52,height:52,borderRadius:14,flexShrink:0,background:isJ?C.b1:C.p1,border:`2px solid ${b.color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{b.icon}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:800,color:b.color}}>{b.name}</div>
              <div style={{fontSize:12,color:C.t2,marginTop:2}}>{b.desc}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div className="mn" style={{fontSize:20,fontWeight:700,color:b.color}}>{bizProds(bizId).length}</div>
              <div style={{fontSize:10,color:C.t3}}>produk</div>
            </div>
          </button>;
        })}
      </div>
      <button onClick={doLogout} style={{width:"100%",marginTop:12,padding:"11px",background:"transparent",border:`1px solid ${C.bo0}`,borderRadius:10,color:C.t2,cursor:"pointer",fontSize:12,fontFamily:F.sans}}>← Kembali</button>
    </div>
  </div>;

  // ─────────────────────────────────────────────────────────────
  //  KASIR SCREEN
  // ─────────────────────────────────────────────────────────────
  if(screen==="kasir") {
    const subtotal=cart.reduce((s,c)=>s+c.price*c.qty,0);
    const discAmt=calcDiscount(subtotal);
    const total=subtotal-discAmt;
    const totalHpp=cart.reduce((s,c)=>s+(c.hpp||0)*c.qty,0);
    const bc=biz==="JS_CLOTHING"?C.b:C.p;

    return <div style={{fontFamily:F.sans,background:C.bg1,color:C.t0,height:"100vh",display:"flex",flexDirection:"column"}}>
      <style>{CSS}</style><Toast n={notif}/>
      <Header biz={biz} user={user} online={online} onLogout={doLogout}
        onSwitchBiz={user?.access?.length>1?()=>{setCart([]);setScreen("bizselect");}:null}
        onAbsenPulang={handlePulang} hasCheckedIn={hasCheckedIn}
        onToggleTheme={toggleTheme} isDark={isDark} lowStockCount={lowStockCount} onLowStockClick={()=>setShowLowStock(true)} expireCount={nearExpiry.length} expiredCount={expiredProds.length} onExpireClick={()=>setShowExpirePopup(true)}/>

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
      {receipt&&<Invoice receipt={receipt} biz={biz}
        onClose={()=>{setReceipt(null);scanRef.current?.focus();}}
        onNew={()=>{setReceipt(null);setCart([]);scanRef.current?.focus();}}/>}
      {/* Stock check */}
      {showStock&&<StockCheckModal prods={bizProds()} biz={biz} onClose={()=>setShowStock(false)}/> }
      {showKasirStok&&<KasirStokPanel
        prods={bizProds()} biz={biz}
        onClose={()=>setShowKasirStok(false)}
        onAdjust={(p,delta)=>doQuickAdj(p,delta)}
        onAddToCart={(p)=>{addToCart(p);toast("✓ "+p.name+" → keranjang");}}
      />}
      {showLowStock&&<LowStockPopup prods={prods} onClose={()=>setShowLowStock(false)}/>}
      {showExpirePopup&&<ExpirePopup nearExpiry={nearExpiry} expiredProds={expiredProds} onClose={()=>setShowExpirePopup(false)}/>}

      {/* Checkout modal */}
      {showCheckout&&<div style={{position:"fixed",inset:0,background:"rgba(2,8,24,.88)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setShowCheckout(false)}>
        <div style={{width:"100%",maxWidth:420,background:C.bg2,borderRadius:"22px 22px 0 0",border:`1px solid ${C.bo1}`,borderBottom:"none",animation:"slideUp .25s ease",padding:"16px 18px 32px"}} onClick={e=>e.stopPropagation()}>
          <div style={{width:36,height:4,background:C.b1,borderRadius:2,margin:"0 auto 16px"}}/>
          <h3 style={{fontSize:15,fontWeight:800,marginBottom:14}}>💳 Konfirmasi Pembayaran</h3>
          {/* Nama Pembeli */}
          <div style={{marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Nama Pembeli (Opsional)</div>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,pointerEvents:"none",color:C.t2}}>🧑</span>
              <input value={namaPembeli} onChange={e=>setNamaPembeli(e.target.value)}
                placeholder="Kosongkan = Umum / Tunai"
                style={{width:"100%",padding:"11px 13px 11px 36px",background:C.bg3,
                  border:`1.5px solid ${namaPembeli?C.g+"88":C.bo0}`,borderRadius:10,
                  color:C.t0,fontSize:13,fontFamily:F.sans,boxSizing:"border-box",transition:"border-color .15s"}}
                onFocus={e=>e.target.style.borderColor=C.g+"88"}
                onBlur={e=>e.target.style.borderColor=namaPembeli?C.g+"88":C.bo0}/>
            </div>
          </div>
          {/* Subtotal */}
          <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:8}}>
            <span style={{color:C.t2}}>Subtotal</span>
            <span className="mn">{rp(subtotal)}</span>
          </div>
          {/* Discount */}
          <div style={{padding:"10px 12px",background:C.bg3,borderRadius:10,border:`1px solid ${C.bo0}`,marginBottom:10}}>
            <div style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Diskon (Opsional)</div>
            <div style={{display:"flex",gap:6}}>
              <div style={{display:"flex",borderRadius:8,overflow:"hidden",border:`1px solid ${C.bo0}`,flexShrink:0}}>
                {[["pct","%"],["rp","Rp"]].map(([t,l])=>(
                  <button key={t} onClick={()=>setDiscount(x=>({...x,type:t}))}
                    style={{padding:"8px 12px",background:discount.type===t?C.g:C.bg4,border:"none",
                      color:discount.type===t?"#000":C.t2,fontWeight:700,fontSize:12,fontFamily:F.sans}}>{l}</button>))}
              </div>
              <input type="number" value={discount.value} onChange={e=>setDiscount(x=>({...x,value:e.target.value}))}
                placeholder={discount.type==="pct"?"0-100":"0"}
                style={{flex:1,padding:"8px 12px",background:C.bg4,border:`1px solid ${C.bo0}`,borderRadius:8,color:C.t0,fontSize:14,fontFamily:F.mono}}/>
            </div>
            {discAmt>0&&<div style={{marginTop:8,fontSize:12,color:C.r,fontWeight:600}}>Diskon: − {rp(discAmt)}</div>}
          </div>
          {/* Payment method */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Metode Pembayaran</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {PAYMENT_METHODS.map(m=>(
                <button key={m} onClick={()=>setPayMethod(m)}
                  style={{padding:"7px 14px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",
                    background:payMethod===m?C.g1:"transparent",border:`1.5px solid ${payMethod===m?C.g:C.bo0}`,
                    color:payMethod===m?C.g:C.t2,fontFamily:F.sans}}>{m}</button>))}
            </div>
          </div>
          {/* Total */}
          <div style={{padding:"12px 14px",background:C.bg4,borderRadius:12,border:`1px solid ${C.bo0}`,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
              <span style={{fontSize:13,fontWeight:700}}>TOTAL</span>
              <span className="mn" style={{fontSize:26,fontWeight:800,color:C.g}}>{rp(total)}</span>
            </div>
            <div style={{fontSize:11,color:C.t2,marginTop:4}}>{payMethod} · {cart.reduce((s,c)=>s+c.qty,0)} item</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={doCheckout} className="press"
              style={{flex:2,padding:"14px",background:`linear-gradient(90deg,${C.g},${C.b})`,border:"none",borderRadius:12,color:C.bg1,fontSize:14,fontWeight:800,fontFamily:F.sans}}>
              ✓ Bayar {rp(total)}</button>
            <button onClick={()=>setShowCheckout(false)}
              style={{flex:1,padding:"14px",background:"transparent",border:`1px solid ${C.bo0}`,borderRadius:12,color:C.t2,fontSize:13,fontFamily:F.sans}}>Batal</button>
          </div>
        </div>
      </div>}

      {/* Main layout */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
          {/* Scan bar */}
          <div style={{padding:"10px 12px",background:C.bg2,borderBottom:`1px solid ${C.bo0}`,flexShrink:0,zIndex:100}}>
            <div style={{display:"flex",gap:8}}>
              <div style={{flex:1,position:"relative"}}>
                <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:15,pointerEvents:"none",color:C.t2}}>📷</span>
                <input ref={scanRef} value={scanIn} onChange={e=>setScanIn(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&kasirScan(scanIn)}
                  placeholder="Scan barcode / ketik barcode atau nama produk..."
                  style={{width:"100%",padding:"12px 12px 12px 40px",background:C.bg3,border:`2px solid ${bc}44`,borderRadius:12,color:C.t0,fontSize:14,fontFamily:F.mono}}/>
                
                {/* Autocomplete Suggestions Kasir */}
                {scanIn.trim().length > 1 && (
                  <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:100,background:C.bg2,border:`1px solid ${C.bo1}`,borderRadius:12,marginTop:6,boxShadow:"0 10px 30px rgba(0,0,0,0.6)",overflow:"hidden",animation:"fadeUp 0.2s ease"}}>
                    {bizProds().filter(p => p.name.toLowerCase().includes(scanIn.trim().toLowerCase()) || p.barcode.includes(scanIn.trim())).slice(0, 5).map((p, i) => (
                      <div key={p.id} onClick={() => kasirScan(p.barcode)} className="hrow"
                        style={{padding:"10px 14px",cursor:"pointer",borderTop:i>0?`1px solid ${C.bo0}`:undefined,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div>
                          <div style={{fontWeight:600,fontSize:13}}>{p.name}</div>
                          <div className="mn" style={{fontSize:10,color:C.t2,marginTop:2}}>{p.barcode} · Stok: {p.stock}</div>
                        </div>
                        <div className="mn" style={{color:C.g,fontWeight:700,fontSize:13}}>{rp(p.price)}</div>
                      </div>
                    ))}
                    {bizProds().filter(p => p.name.toLowerCase().includes(scanIn.trim().toLowerCase()) || p.barcode.includes(scanIn.trim())).length === 0 && (
                      <div style={{padding:"12px 14px",fontSize:12,color:C.t3,textAlign:"center"}}>Produk tidak ditemukan</div>
                    )}
                  </div>
                )}
              </div>
              <button onClick={()=>kasirScan(scanIn)} className="press"
                style={{padding:"12px 16px",background:bc,border:"none",borderRadius:12,color:"#fff",fontWeight:800,fontSize:14,flexShrink:0}}>+</button>
              <button onClick={()=>setShowKasirStok(true)} className="press" title="Lihat & Kelola Stok"
                style={{padding:"12px 14px",background:C.bg3,border:`1.5px solid ${C.bo1}`,borderRadius:12,color:C.t1,fontSize:14,flexShrink:0}}>📦</button>
            </div>
          </div>
          {/* Cart */}
          <div style={{flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:7,minHeight:0}}>
            {cart.length===0 ? <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flex:1,gap:10,padding:"32px 16px"}}>
              <div style={{fontSize:48,opacity:.08}}>🛒</div>
              <p style={{fontSize:13,fontWeight:600,color:C.t2}}>Keranjang kosong</p>
              <p style={{fontSize:11.5,color:C.t3}}>Scan barcode {BIZ[biz]?.name} untuk mulai</p>
            </div> : cart.map(item=><div key={item.barcode} style={{background:C.bg2,borderRadius:12,border:`1px solid ${C.bo0}`,padding:"10px 12px",display:"flex",alignItems:"center",gap:8,animation:"fadeUp .15s ease"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:12.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                <div className="mn" style={{color:C.t2,fontSize:10,marginTop:1}}>{item.barcode}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                <button onClick={()=>setCart(p=>{const it=p.find(c=>c.barcode===item.barcode);return it.qty<=1?p.filter(c=>c.barcode!==item.barcode):p.map(c=>c.barcode===item.barcode?{...c,qty:c.qty-1}:c);})}
                  className="press" style={{width:30,height:30,background:C.bg4,border:`1px solid ${C.bo1}`,borderRadius:8,color:C.t0,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                <span className="mn" style={{minWidth:24,textAlign:"center",fontWeight:700,fontSize:14}}>{item.qty}</span>
                <button onClick={()=>setCart(p=>p.map(c=>c.barcode===item.barcode&&c.qty<c.stock?{...c,qty:c.qty+1}:c))}
                  className="press" style={{width:30,height:30,background:C.bg4,border:`1px solid ${C.bo1}`,borderRadius:8,color:C.t0,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
              </div>
              <div className="mn" style={{fontWeight:700,color:C.a,fontSize:13,minWidth:80,textAlign:"right",flexShrink:0}}>{rp(item.price*item.qty)}</div>
              <button onClick={()=>setCart(p=>p.filter(c=>c.barcode!==item.barcode))}
                style={{background:"transparent",border:"none",color:C.t3,fontSize:18,padding:"0 2px",flexShrink:0}}>×</button>
            </div>)}
          </div>
        </div>
        {/* Side panel tablet */}
        <div className="hide-mobile" style={{width:220,background:C.bg2,borderLeft:`1px solid ${C.bo0}`,display:"flex",flexDirection:"column",padding:12,flexShrink:0}}>
          <div style={{padding:"8px 10px",borderRadius:10,marginBottom:12,textAlign:"center",background:biz==="JS_CLOTHING"?C.b1:C.p1,border:`1px solid ${bc}22`}}>
            <span style={{fontSize:12,color:bc,fontWeight:700}}>{BIZ[biz]?.icon} {BIZ[biz]?.name}</span>
          </div>
          <div style={{flex:1}}>
            {[{l:"Produk",v:cart.length},{l:"Total Item",v:cart.reduce((s,c)=>s+c.qty,0)}].map(r=>(
              <div key={r.l} style={{display:"flex",justifyContent:"space-between",marginBottom:7,fontSize:13}}>
                <span style={{color:C.t2}}>{r.l}</span><span className="mn">{r.v}</span>
              </div>))}
            <Divider/>
            {discAmt>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.r,marginBottom:5}}>
              <span>Diskon</span><span className="mn">− {rp(discAmt)}</span>
            </div>}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5}}>
              <span style={{fontSize:13,color:C.t1}}>Total</span>
              <span className="mn" style={{fontSize:20,fontWeight:700,color:C.g}}>{rp(total)}</span>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:7,marginTop:12}}>
            <button onClick={()=>{if(cart.length)setShowCheckout(true);}} disabled={!cart.length} className="press"
              style={{padding:"14px",background:cart.length?`linear-gradient(90deg,${C.g},${C.b})`:C.bg3,
                border:"none",borderRadius:11,color:cart.length?C.bg1:C.t2,fontSize:13,fontWeight:800,cursor:cart.length?"pointer":"not-allowed"}}>
              💳 BAYAR</button>
            <button onClick={()=>setCart([])} style={{padding:"7px",background:"transparent",border:`1px solid ${C.bo0}`,borderRadius:8,color:C.t3,fontSize:11,fontFamily:F.sans}}>Bersihkan</button>
          </div>
          <Divider my={8}/>
          <button onClick={()=>setShowKasirStok(true)} className="press"
            style={{width:"100%",padding:"8px",background:C.bg3,border:`1px solid ${C.bo1}`,borderRadius:9,color:C.t1,fontSize:11,fontWeight:700,marginBottom:8,fontFamily:F.sans}}>
            📦 Stok & Kelola ({bizProds().length})</button>
          <div style={{fontSize:10,color:C.t3,textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontWeight:700}}>Terbaru</div>
          {trxs.filter(t=>t.business===biz).slice(0,5).map(t=><div key={t.id}
            style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:11}}>
            <span className="mn" style={{color:C.t2}}>{t.id?.slice(-8)}</span>
            <span className="mn" style={{color:C.g}}>{rp(t.total)}</span>
          </div>)}
        </div>
      </div>
      {/* Mobile bottom bar */}
      <div style={{background:`${C.bg2}f8`,backdropFilter:"blur(16px)",borderTop:`1px solid ${C.bo0}`,
        padding:"10px 12px",paddingBottom:`calc(10px + var(--safe-b))`,flexShrink:0,display:"flex",alignItems:"center",gap:8}}>
        <button onClick={()=>setShowKasirStok(true)} className="press"
          title="Lihat & Kelola Stok"
          style={{padding:"11px 12px",background:C.bg3,border:`1.5px solid ${C.bo1}`,borderRadius:11,color:C.t1,fontSize:16,flexShrink:0}}>📦</button>
        <div style={{flex:1}}>
          <div style={{fontSize:10,color:C.t2,fontWeight:600}}>Total</div>
          <div className="mn" style={{fontSize:20,fontWeight:700,color:C.g,lineHeight:1.2}}>{rp(total)}</div>
          {cart.length>0&&<div className="mn" style={{fontSize:9.5,color:C.t3}}>{cart.reduce((s,c)=>s+c.qty,0)} item</div>}
        </div>
        <button onClick={()=>{if(cart.length)setShowCheckout(true);}} disabled={!cart.length} className="press"
          style={{padding:"13px 24px",background:cart.length?`linear-gradient(90deg,${C.g},${C.b})`:C.bg3,
            border:"none",borderRadius:13,color:cart.length?C.bg1:C.t2,fontSize:14,fontWeight:800,
            flexShrink:0,boxShadow:cart.length?`0 4px 20px ${C.g}30`:undefined}}>
          💳 BAYAR</button>
      </div>
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
      {UpdateBannerEl}
      {showLowStock&&<LowStockPopup prods={prods} onClose={()=>setShowLowStock(false)}/>}
      {showExpirePopup&&<ExpirePopup nearExpiry={nearExpiry} expiredProds={expiredProds} onClose={()=>setShowExpirePopup(false)}/>}
      <Header biz={biz} user={user} online={online} onLogout={doLogout}
        onSwitchBiz={user?.access?.length>1?()=>{setStokTarget(null);setIsNewProduct(false);setScreen("bizselect");}:null}
        onAbsenPulang={handlePulang} hasCheckedIn={hasCheckedIn} onToggleTheme={toggleTheme} isDark={isDark} onLowStockClick={()=>setShowLowStock(true)} expireCount={nearExpiry.length} expiredCount={expiredProds.length} onExpireClick={()=>setShowExpirePopup(true)}/>
      <div style={{flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:10,minHeight:0}}>
        
        {/* Scan / Cari Barcode */}
        <Card noPad style={{overflow:"hidden"}}>
          <div style={{padding:"10px 13px",borderBottom:`1px solid ${C.bo0}`,display:"flex",alignItems:"center",gap:8}}>
            <span style={{flex:1,fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1}}>📷 Scan Barcode</span>
            <BizChip biz={biz}/>
          </div>
          <div style={{padding:"10px 12px",display:"flex",gap:8}}>
            <div style={{flex:1,position:"relative"}}>
              <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:15,pointerEvents:"none",color:C.t2}}>📷</span>
              <input ref={stokScanRef} value={stokScan} onChange={e=>setStokScan(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&stokScanFn(stokScan)}
                placeholder="Scan barcode / ketik barcode atau nama produk..."
                style={{width:"100%",padding:"12px 12px 12px 40px",background:C.bg3,border:`2px solid ${bc}44`,borderRadius:12,color:C.t0,fontSize:14,fontFamily:F.mono}}/>

              {/* Autocomplete Suggestions Stok */}
              {stokScan.trim().length > 1 && (
                <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:100,background:C.bg2,border:`1px solid ${C.bo1}`,borderRadius:12,marginTop:6,boxShadow:"0 10px 30px rgba(0,0,0,0.6)",overflow:"hidden",animation:"fadeUp 0.2s ease"}}>
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
              style={{padding:"12px 16px",background:bc,border:"none",borderRadius:12,color:"#fff",fontWeight:800,fontSize:13,flexShrink:0}}>Scan</button>
          </div>
        </Card>

        {/* 🆕 FORM PRODUK BARU (Jika tidak ditemukan saat scan) */}
        {isNewProduct && (
          <Card accent={C.vi} style={{ animation: "fadeUp .2s ease", marginBottom: 15 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: C.vi }}>🆕 Daftarkan Produk Baru</h3>
              <button onClick={() => setIsNewProduct(false)} style={{ background: "transparent", border: "none", color: C.t3, fontSize: 20 }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Inp label="Barcode" value={newPForm.barcode} onChange={e => setNewPForm(x => ({ ...x, barcode: e.target.value }))} mono />
              <Inp label="Nama Produk" value={newPForm.name} onChange={e => setNewPForm(x => ({ ...x, name: e.target.value }))} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Inp label="Kategori" value={newPForm.category} onChange={e => setNewPForm(x => ({ ...x, category: e.target.value }))} />
                <Inp label="Harga Jual" type="number" value={newPForm.price} onChange={e => setNewPForm(x => ({ ...x, price: e.target.value }))} suffix="Rp" />
              </div>
              <Inp label="Stok Awal" type="number" value={newPForm.stock} onChange={e => setNewPForm(x => ({ ...x, stock: e.target.value }))} />
              <div style={{ display: "flex", gap: 8, marginTop: 5 }}>
                <Btn onClick={saveNewProduct} full color={C.vi}>✓ Simpan & Daftarkan</Btn>
                <Btn onClick={() => setIsNewProduct(false)} outline>Batal</Btn>
              </div>
            </div>
          </Card>
        )}

        {/* 📦 UPDATE STOK (Untuk produk yang sudah ada) */}
        {stokTarget && !isNewProduct && (
          <Card accent={bc} style={{animation:"fadeUp .2s ease"}}>
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
                <div style={{fontSize:9.5,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:5}}>Jumlah Masuk *</div>
                <input ref={stokQRef} type="number" min="1" value={stokQ}
                  onChange={e=>setStokQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doAddStock()}
                  placeholder="0" style={{width:"100%",padding:"12px",background:C.bg3,border:`1.5px solid ${C.bo0}`,borderRadius:10,color:C.t0,fontSize:24,fontFamily:F.mono,textAlign:"center",fontWeight:700}}
                  onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.bo0}/>
              </div>
              <div>
                <div style={{fontSize:9.5,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:5}}>Update Harga Jual</div>
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
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={doAddStock} full>+ Tambah Stok</Btn>
              <Btn onClick={()=>{setStokTarget(null);stokScanRef.current?.focus();}} outline>Batal</Btn>
            </div>
          </Card>
        )}

        <button onClick={()=>setShowOpnamePanel(true)} className="press"
          style={{padding:"11px 16px",background:C.vi1,border:`1px solid ${C.vi}44`,borderRadius:12,color:C.vi,fontSize:13,fontWeight:700,width:"100%",textAlign:"center",cursor:"pointer",fontFamily:"inherit"}}>
          📋 Buka Opname
        </button>

        {/* Daftar Produk dengan Quick Adjust */}
        <Card noPad style={{overflow:"hidden"}}>
          <div style={{padding:"10px 13px",borderBottom:`1px solid ${C.bo0}`,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1}}>📦 Daftar Produk ({filtered.length})</span>
            <span style={{flex:1}}/>
            <input value={stokSearch} onChange={e=>setStokSearch(e.target.value)} placeholder="Cari nama / barcode..."
              style={{padding:"7px 11px",background:C.bg3,border:`1px solid ${C.bo0}`,borderRadius:8,color:C.t0,fontSize:12,width:160,fontFamily:F.sans}}/>
          </div>
          {/* Card view for mobile — easier tap targets */}
          <div className="hide-desktop" style={{padding:"8px 10px",display:"flex",flexDirection:"column",gap:7}}>
            {filtered.length===0&&<div style={{padding:"24px",textAlign:"center",color:C.t3,fontSize:12}}>Tidak ada produk</div>}
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
            <TableWrap maxH="50vh">
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
                        {p.stock===0?"HABIS":"⚠"}</span>}
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
            <span style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1}}>Log Penerimaan Stok</span>
          </div>
          {slogs.filter(l=>l.business===biz&&l.type==="masuk").length===0
            ?<div style={{padding:"24px",textAlign:"center",color:C.t3,fontSize:12}}>Belum ada log penerimaan</div>
            :<TableWrap maxH="40vh">
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
    const TABS=[
      {id:"dashboard",l:"📊 Dashboard"},{id:"users",l:"👥 Pengguna"},{id:"products",l:"📦 Produk"},
      {id:"laporan",l:"💰 Laporan"},{id:"absensi",l:"🕐 Absensi"},{id:"stoklog",l:"📋 Log Stok"},
      {id:"returns",l:"↩ Retur"},{id:"actlog",l:"🔍 Aktivitas"},{id:"sheets",l:"🔗 Sheets"},{id:"opname",l:"📋 Opname"},
    ];
    // Bottom nav tabs (mobile)
    const BNAV_TABS=[
      {id:"dashboard",ic:"📊",label:"Dashboard"},
      {id:"products",ic:"📦",label:"Produk"},
      {id:"laporan",ic:"💰",label:"Laporan"},
      {id:"absensi",ic:"🕐",label:"Absensi"},
    ];
    const MORE_TABS=[
      {id:"users",ic:"👥",label:"Pengguna"},
      {id:"stoklog",ic:"📋",label:"Log Stok"},
      {id:"returns",ic:"↩",label:"Retur"},
      {id:"actlog",ic:"🔍",label:"Aktivitas"},
      {id:"sheets",ic:"🔗",label:"Sheets"},
      {id:"opname",ic:"📋",label:"Opname"},
    ];
    const isMoreTab=MORE_TABS.some(t=>t.id===adminTab);
    const adminPs=prods.filter(p=>p.business===adminBiz&&(!searchQ||p.name.toLowerCase().includes(searchQ.toLowerCase())||p.barcode.includes(searchQ)));

    return <div style={{fontFamily:F.sans,background:C.bg1,color:C.t0,height:"100vh",display:"flex",flexDirection:"column"}}>
      <style>{CSS}</style><Toast n={notif}/>
      {UpdateBannerEl}
      <Header title="Admin Panel" user={user} online={online} onLogout={doLogout} lowStockCount={lowStockCount} onToggleTheme={toggleTheme} isDark={isDark} onLowStockClick={()=>setShowLowStock(true)} expireCount={nearExpiry.length} expiredCount={expiredProds.length} onExpireClick={()=>setShowExpirePopup(true)}/>

      {/* Change password modal */}
      {cpwdModal&&<div style={{position:"fixed",inset:0,background:"rgba(2,8,24,.85)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setCpwdModal(null)}>
        <div style={{width:"100%",maxWidth:420,background:C.bg2,borderRadius:"22px 22px 0 0",padding:"18px 20px 32px",border:`1px solid ${C.bo1}`,borderBottom:"none",animation:"slideUp .25s ease"}} onClick={e=>e.stopPropagation()}>
          <div style={{width:36,height:4,background:C.b1,borderRadius:2,margin:"0 auto 16px"}}/>
          <h3 style={{fontSize:14,fontWeight:800,marginBottom:14,color:C.a}}>🔑 Ganti Password</h3>
          <p style={{fontSize:12,color:C.t2,marginBottom:14}}>Untuk: <b style={{color:C.t0}}>{users.find(u=>u.id===cpwdModal)?.name}</b></p>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {user.role!=="admin"&&<div>
              <div style={{fontSize:9.5,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Password Lama</div>
              <input type="password" value={cpwdForm.old} onChange={e=>setCpwdForm(x=>({...x,old:e.target.value}))} style={IS}
                onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.bo0}/>
            </div>}
            <div>
              <div style={{fontSize:9.5,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Password Baru *</div>
              <input type="password" value={cpwdForm.n1} onChange={e=>setCpwdForm(x=>({...x,n1:e.target.value}))} style={IS}
                onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.bo0}/>
            </div>
            <div>
              <div style={{fontSize:9.5,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Konfirmasi Password *</div>
              <input type="password" value={cpwdForm.n2} onChange={e=>setCpwdForm(x=>({...x,n2:e.target.value}))} style={IS}
                onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.bo0}/>
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:16}}>
            <Btn onClick={doChangePassword} full>Simpan</Btn>
            <Btn onClick={()=>setCpwdModal(null)} outline>Batal</Btn>
          </div>
        </div>
      </div>}

      {/* User modal */}
      {uModal&&<div style={{position:"fixed",inset:0,background:"rgba(2,8,24,.85)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setUModal(false)}>
        <div style={{width:"100%",maxWidth:500,background:C.bg2,borderRadius:"22px 22px 0 0",padding:"18px 20px 32px",border:`1px solid ${C.bo1}`,borderBottom:"none",animation:"slideUp .25s ease",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
          <div style={{width:36,height:4,background:C.b1,borderRadius:2,margin:"0 auto 16px"}}/>
          <h3 style={{fontSize:14,fontWeight:800,marginBottom:16,color:C.g}}>{editUid===null?"➕ Tambah Pengguna":"✏️ Edit Pengguna"}</h3>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div>
              <div style={{fontSize:9.5,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Nama Lengkap *</div>
              <input value={uForm.name||""} onChange={e=>setUForm(x=>({...x,name:e.target.value}))} style={IS} onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.bo0}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div>
                <div style={{fontSize:9.5,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Username *</div>
                <input value={uForm.username||""} onChange={e=>setUForm(x=>({...x,username:e.target.value}))} disabled={editUid!==null} style={{...IS,color:editUid!==null?C.t2:C.t0}} onFocus={e=>editUid===null&&(e.target.style.borderColor=C.g+"88")} onBlur={e=>e.target.style.borderColor=C.bo0}/>
              </div>
              <div>
                <div style={{fontSize:9.5,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Password *</div>
                <input type="password" value={uForm.password||""} onChange={e=>setUForm(x=>({...x,password:e.target.value}))} style={IS} onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.bo0}/>
              </div>
              <div>
                <div style={{fontSize:9.5,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Avatar Emoji</div>
                <input value={uForm.avatar||""} onChange={e=>setUForm(x=>({...x,avatar:e.target.value}))} style={IS} onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.bo0}/>
              </div>
              <div>
                <div style={{fontSize:9.5,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Role</div>
                <select value={uForm.role||"kasir"} onChange={e=>setUForm(x=>({...x,role:e.target.value}))} style={{...IS,fontFamily:F.sans}}>
                  <option value="kasir">Kasir</option><option value="stok">Stok</option><option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div>
              <div style={{fontSize:9.5,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Akses Bisnis *</div>
              <div style={{display:"flex",gap:8}}>
                {Object.values(BIZ).map(b2=>{const chk=uForm.access?.includes(b2.id),isJ=b2.id==="JS_CLOTHING";
                  return <button key={b2.id} onClick={()=>setUForm(x=>({...x,access:chk?x.access.filter(a=>a!==b2.id):[...(x.access||[]),b2.id]}))}
                    style={{flex:1,padding:"10px",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:12,background:chk?(isJ?C.b1:C.p1):"transparent",border:`2px solid ${chk?(isJ?C.b:C.p):C.bo0}`,color:chk?(isJ?C.b:C.p):C.t2,fontFamily:F.sans}}>
                    {b2.icon} {b2.name}</button>;})}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <input type="checkbox" id="uac" checked={!!uForm.active} onChange={e=>setUForm(x=>({...x,active:e.target.checked}))} style={{width:16,height:16,accentColor:C.g}}/>
              <label htmlFor="uac" style={{fontSize:12.5,cursor:"pointer"}}>Akun Aktif</label>
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:16}}><Btn onClick={saveUser} full>Simpan</Btn><Btn onClick={()=>setUModal(false)} outline>Batal</Btn></div>
        </div>
      </div>}

      {showLowStock&&<LowStockPopup prods={prods} onClose={()=>setShowLowStock(false)}/>}
      {showExpirePopup&&<ExpirePopup nearExpiry={nearExpiry} expiredProds={expiredProds} onClose={()=>setShowExpirePopup(false)}/>}
      {/* Tab bar */}
      {/* Desktop tab bar — hidden on mobile */}
      <div className="hide-mobile" style={{background:C.bg2,borderBottom:`1px solid ${C.bo0}`,display:"flex",overflowX:"auto",flexShrink:0,gap:0,padding:"0 4px"}}>
        {TABS.map(t=><button key={t.id} onClick={()=>{setAdminTab(t.id);setSearchQ("");setPModal(false);setShowMoreDrawer(false);setEditPid(null);setInlineAddMode(false);}}
          className={`atab${adminTab===t.id?" on":""}`}>{t.l}</button>)}
      </div>

      {/* More drawer (mobile) */}
      {showMoreDrawer&&<div className="drawer-overlay" onClick={()=>setShowMoreDrawer(false)}>
        <div className="drawer" onClick={e=>e.stopPropagation()}>
          <div style={{width:40,height:4,background:C.bo2,borderRadius:2,margin:"14px auto 0"}}/>
          <div style={{padding:"10px 20px 2px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,fontWeight:800,color:C.t1,letterSpacing:.5,textTransform:"uppercase"}}>Menu Lainnya</span>
            <button onClick={()=>setShowMoreDrawer(false)} style={{background:"transparent",border:"none",color:C.t2,fontSize:18,cursor:"pointer",padding:"2px 6px",lineHeight:1}}>✕</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,padding:"10px 14px 4px"}}>
            {MORE_TABS.map(t=>{const isAct=adminTab===t.id;
              return <button key={t.id} onClick={()=>{setAdminTab(t.id);setSearchQ("");setPModal(false);setShowMoreDrawer(false);setEditPid(null);setInlineAddMode(false);}} className="press ripple-wrap"
                style={{padding:"12px 6px 10px",background:isAct?`linear-gradient(145deg,${C.g}22,${C.b}15)`:C.bg3,
                  border:`1.5px solid ${isAct?C.g:C.bo0}`,borderRadius:16,
                  display:"flex",flexDirection:"column",alignItems:"center",gap:5,cursor:"pointer",position:"relative",
                  transition:"all .15s"}}>
                <span style={{fontSize:22,lineHeight:1}}>{t.ic}</span>
                <span style={{fontSize:9.5,fontWeight:700,color:isAct?C.g:C.t2,textAlign:"center",lineHeight:1.3,letterSpacing:.2}}>{t.label}</span>
                {isAct&&<div style={{position:"absolute",bottom:4,width:16,height:2,borderRadius:1,background:`linear-gradient(90deg,${C.g},${C.b})`}}/>}
              </button>;})}          </div>
        </div>
      </div>}

      <div className="admin-content">


        {/* ── DASHBOARD ── */}
        {adminTab==="dashboard"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
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
                {ic:"📦",lbl:"Total Produk",val:prods.length,sub:lowStockCount>0?`⚠ ${lowStockCount} menipis`:null,color:C.b,glow:C.b},
                {ic:"🕐",lbl:"Hadir Hari Ini",val:hadir,color:C.a,glow:C.a},
              ].map((s,i)=><div key={i} className="stat-mobile card-in" style={{"--stat-glow":s.glow}}>
                <span className="stat-ico">{s.ic}</span>
                <span className="stat-lbl">{s.lbl}</span>
                <span className="stat-val" style={{color:s.color}}>{s.val}</span>
                {s.sub&&<span style={{fontSize:10,color:C.r,fontWeight:600,marginTop:1}}>{s.sub}</span>}
              </div>)}
            </div>;
          })()}
          {/* Targets */}
          {targets.filter(t=>t.period===currMonth).length>0&&<Card>
            <div style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>🎯 Target Penjualan Bulan Ini</div>
            {Object.values(BIZ).map(b2=>{
              const tgt=targets.find(t=>t.business===b2.id&&t.period===currMonth);if(!tgt) return null;
              const rev=monthRevByBiz[b2.id]||0;const isJ=b2.id==="JS_CLOTHING";
              return <div key={b2.id} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6}}>
                  <span style={{fontWeight:600}}>{b2.icon} {b2.name}</span>
                  <span className="mn" style={{color:isJ?C.b:C.p}}>{rp(rev)} / {rp(tgt.amount)}</span>
                </div>
                <ProgressBar value={rev} max={tgt.amount} color={isJ?C.b:C.p}/>
              </div>;})}
          </Card>}
          {/* Stok menipis */}
          {lowStockCount>0&&<Card accent={C.r}>
            <div style={{fontSize:10,fontWeight:700,color:C.r,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>⚠ Stok Menipis ({lowStockCount})</div>
            {prods.filter(p=>p.stock<10).map(p=><div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderTop:`1px solid ${C.bo0}`,fontSize:12.5}}>
              <span style={{fontWeight:600}}>{p.name}</span>
              <div style={{display:"flex",gap:8,alignItems:"center"}}><BizChip biz={p.business} sm/><StockBadge s={p.stock}/></div>
            </div>)}
          </Card>}
          {/* Today attendance */}
          <Card>
            <div style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>🕐 Kehadiran Hari Ini</div>
            {attend.filter(a=>a.date===todayDate()).length===0
              ?<p style={{fontSize:12,color:C.t3}}>Belum ada pegawai yang absen hari ini</p>
              :attend.filter(a=>a.date===todayDate()).map(a=><div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderTop:`1px solid ${C.bo0}`,fontSize:12.5}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span>{users.find(u=>u.id===a.userId)?.avatar||"🧑"}</span>
                  <div><div style={{fontWeight:600}}>{a.name}</div><div style={{fontSize:10,color:C.t2}}>{a.checkIn}</div></div>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <BizChip biz={a.business} sm/>
                  {a.checkOut?<span style={{fontSize:10,color:C.g,fontWeight:600}}>✓ Pulang</span>:<span style={{fontSize:10,color:C.a,fontWeight:600}}>● Hadir</span>}
                </div>
              </div>)}
          </Card>
          {/* Target management */}
          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1}}>🎯 Kelola Target</div>
              <button onClick={()=>setTargetModal(true)} className="press" style={{padding:"5px 12px",background:C.g1,border:`1px solid ${C.g}33`,borderRadius:7,color:C.g,fontSize:11,fontWeight:700,fontFamily:F.sans}}>+ Set Target</button>
            </div>
            {targetModal&&<div style={{background:C.bg3,borderRadius:10,padding:"12px 14px",marginBottom:12,border:`1px solid ${C.bo0}`}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
                <div>
                  <div style={{fontSize:9.5,fontWeight:700,color:C.t2,marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>Bisnis</div>
                  <select value={targetForm.business} onChange={e=>setTargetForm(x=>({...x,business:e.target.value}))} style={{width:"100%",padding:"10px",background:C.bg2,border:`1.5px solid ${C.bo0}`,borderRadius:8,color:C.t0,fontSize:12,fontFamily:F.sans}}>
                    {Object.values(BIZ).map(b2=><option key={b2.id} value={b2.id}>{b2.icon} {b2.name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:9.5,fontWeight:700,color:C.t2,marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>Periode</div>
                  <input type="month" value={targetForm.period} onChange={e=>setTargetForm(x=>({...x,period:e.target.value}))}
                    style={{width:"100%",padding:"10px",background:C.bg2,border:`1.5px solid ${C.bo0}`,borderRadius:8,color:C.t0,fontSize:12}}/>
                </div>
                <div>
                  <div style={{fontSize:9.5,fontWeight:700,color:C.t2,marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>Target (Rp)</div>
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
            </div>}
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
                    <td style={{padding:"14px 13px",fontFamily:F.mono,fontSize:11}}>{u.avatar} {u.username}</td>
                    <td style={{padding:"14px 13px",fontWeight:600}}>{u.name}</td>
                    <td style={{padding:"14px 13px"}}><RoleTag role={u.role}/></td>
                    <td style={{padding:"14px 13px"}}><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{u.access?.map(a=><BizChip key={a} biz={a} sm/>)}</div></td>
                    <td style={{padding:"14px 13px"}}>
                      {u.role==="admin"?<span style={{fontSize:10,color:C.t3}}>N/A</span>
                      :u.faceDescriptor?<span style={{fontSize:10,color:C.g,fontWeight:700}}>✓ Ada</span>
                      :<button onClick={()=>setFaceReg(u.id)} className="press" style={{padding:"3px 9px",background:C.a1,border:`1px solid ${C.a}33`,borderRadius:6,color:C.a,fontSize:10,fontWeight:700}}>Daftarkan</button>}
                    </td>
                    <td style={{padding:"14px 13px"}}>
                      <span style={{padding:"2px 8px",borderRadius:20,fontSize:9.5,fontWeight:700,background:u.active?C.g1:C.r1,color:u.active?C.g:C.r}}>{u.active?"AKTIF":"OFF"}</span>
                    </td>
                    <td style={{padding:"14px 13px",whiteSpace:"nowrap"}}>
                      <button onClick={()=>openEditU(u)} className="press" style={{marginRight:4,padding:"3px 9px",background:"transparent",border:`1px solid ${C.bo1}`,borderRadius:6,color:C.t0,fontSize:10}}>Edit</button>
                      <button onClick={()=>{setCpwdModal(u.id);setCpwdForm({old:"",n1:"",n2:""}); }} className="press" style={{marginRight:4,padding:"3px 9px",background:C.a1,border:`1px solid ${C.a}22`,borderRadius:6,color:C.a,fontSize:10}}>🔑</button>
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
                <div style={{width:44,height:44,borderRadius:12,background:C.bg3,border:`1px solid ${C.bo1}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{u.avatar||"🧑"}</div>
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
                  ?<span style={{padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:C.g1,color:C.g}}>👁 Wajah terdaftar</span>
                  :<span style={{padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:C.a1,color:C.a}}>⚠ Belum ada wajah</span>)}
              </div>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                <button onClick={()=>openEditU(u)} className="press" style={{flex:1,padding:"10px",background:"transparent",border:`1.5px solid ${C.bo1}`,borderRadius:10,color:C.t0,fontSize:12,fontWeight:600,fontFamily:F.sans}}>✏️ Edit</button>
                <button onClick={()=>{setCpwdModal(u.id);setCpwdForm({old:"",n1:"",n2:""});}} className="press" style={{flex:1,padding:"10px",background:C.a1,border:`1.5px solid ${C.a}33`,borderRadius:10,color:C.a,fontSize:12,fontWeight:600,fontFamily:F.sans}}>🔑 Password</button>
                {u.role!=="admin"&&!u.faceDescriptor&&<button onClick={()=>setFaceReg(u.id)} className="press" style={{flex:1,padding:"10px",background:C.b1,border:`1.5px solid ${C.b}33`,borderRadius:10,color:C.b,fontSize:12,fontWeight:600,fontFamily:F.sans}}>📷 Daftarkan</button>}
                {u.faceDescriptor&&u.role!=="admin"&&<button onClick={()=>{fbUpdateUser(u.id,{...u,faceDescriptor:null},user.name);toast("Wajah direset","warn");}} className="press" style={{padding:"10px 14px",background:C.b1,border:`1.5px solid ${C.b}33`,borderRadius:10,color:C.b,fontSize:12,fontFamily:F.sans}}>Reset Wajah</button>}
                <button onClick={()=>delUser(u)} className="press" style={{padding:"10px 14px",background:C.r1,border:`1.5px solid ${C.r}33`,borderRadius:10,color:C.r,fontSize:12,fontFamily:F.sans}}>🗑</button>
              </div>
            </div>)}
          </div>
        </div>}

        {/* ── PRODUK ── */}
        {adminTab==="products"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
            {Object.values(BIZ).map(b2=>{const isJ=b2.id==="JS_CLOTHING",active=adminBiz===b2.id;
              return <button key={b2.id} onClick={()=>{setAdminBiz(b2.id);setSearchQ("");setPModal(false);setEditPid(null);setInlineAddMode(false);}} className="press"
                style={{padding:"7px 14px",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:12,background:active?(isJ?C.b1:C.p1):"transparent",border:`2px solid ${active?(isJ?C.b:C.p):C.bo0}`,color:active?(isJ?C.b:C.p):C.t2,fontFamily:F.sans}}>
                {b2.icon} {b2.name}</button>;})}
            <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Cari produk..."
              style={{padding:"7px 11px",background:C.bg2,border:`1px solid ${C.bo0}`,borderRadius:8,color:C.t0,fontSize:12,width:140,fontFamily:F.sans}}/>
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
          {importModal&&<div style={{position:"fixed",inset:0,background:"rgba(2,8,24,.88)",zIndex:600,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setImportModal(false)}>
            <div style={{width:"100%",maxWidth:560,background:C.bg2,borderRadius:"22px 22px 0 0",border:`1px solid ${C.vi}44`,borderBottom:"none",animation:"slideUp .25s ease",maxHeight:"90vh",overflowY:"auto",padding:"18px 18px 32px"}} onClick={e=>e.stopPropagation()}>
              <div style={{width:36,height:4,background:C.bo1,borderRadius:2,margin:"0 auto 16px"}}/>
              <h3 style={{fontSize:14,fontWeight:800,marginBottom:4,color:C.vi}}>⬆ Import Produk dari File</h3>
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
                <div style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Target Bisnis (default jika kolom Bisnis kosong)</div>
                <div style={{display:"flex",gap:7}}>
                  {Object.values(BIZ).map(b2=>{const isJ=b2.id==="JS_CLOTHING",active=adminBiz===b2.id;
                    return <button key={b2.id} onClick={()=>setAdminBiz(b2.id)} className="press"
                      style={{flex:1,padding:"9px",borderRadius:9,fontWeight:700,fontSize:12,cursor:"pointer",
                        background:active?(isJ?C.b1:C.p1):"transparent",border:`2px solid ${active?(isJ?C.b:C.p):C.bo0}`,
                        color:active?(isJ?C.b:C.p):C.t2,fontFamily:F.sans}}>{b2.icon} {b2.name}</button>;})}
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
                    <div style={{fontSize:28,marginBottom:6}}>✅</div>
                    <div style={{fontSize:14,fontWeight:700,color:C.g}}>{importRows.length} produk siap diimport</div>
                    <div style={{fontSize:11,color:C.t2,marginTop:4}}>Klik untuk ganti file</div>
                  </div>
                  :<div>
                    <div style={{fontSize:32,marginBottom:8,opacity:.5}}>📂</div>
                    <div style={{fontSize:13,fontWeight:600,color:C.vi}}>Klik untuk pilih file</div>
                    <div style={{fontSize:11,color:C.t2,marginTop:4}}>.xlsx · .xls · .csv</div>
                  </div>}
              </div>
              {importErr&&<div style={{padding:"9px 13px",background:C.r1,borderRadius:8,border:`1px solid ${C.r}33`,fontSize:12,color:C.r,marginBottom:12}}>⚠ {importErr}</div>}
              {/* Preview */}
              {importRows.length>0&&<div style={{marginBottom:14}}>
                <div style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Preview ({Math.min(importRows.length,5)} dari {importRows.length})</div>
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
                    ⚠ {dups.length} barcode sudah ada dan akan dilewati (tidak di-overwrite)
                  </div>;})()} 
              </div>}
              <div style={{display:"flex",gap:8}}>
                <button onClick={doImportProducts} disabled={!importRows.length||importLoading} className="press"
                  style={{flex:2,padding:"13px",background:importRows.length&&!importLoading?`linear-gradient(90deg,${C.vi},${C.b})`:C.bg3,
                    border:"none",borderRadius:12,color:importRows.length&&!importLoading?"#fff":C.t2,
                    fontSize:13,fontWeight:800,cursor:importRows.length&&!importLoading?"pointer":"not-allowed",fontFamily:F.sans}}>
                  {importLoading?"⏳ Mengimport...":"⬆ Import "+importRows.length+" Produk"}</button>
                <button onClick={()=>{setImportModal(false);setImportRows([]);setImportErr("");}}
                  style={{flex:1,padding:"13px",background:"transparent",border:`1px solid ${C.bo0}`,borderRadius:12,color:C.t2,fontSize:13,fontFamily:F.sans}}>Batal</button>
              </div>
            </div>
          </div>}
          {/* Scan cari produk */}
          <div style={{display:"flex",gap:8,alignItems:"center",padding:"10px 14px",background:C.bg2,borderRadius:12,border:`1px solid ${C.bo0}`}}>
            <span style={{fontSize:12,color:C.t2,fontWeight:600,whiteSpace:"nowrap"}}>🔍 Scan/Cari:</span>
            <div style={{flex:1,position:"relative"}}>
              <input value={adminScanQ} onChange={e=>setAdminScanQ(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"){const bc=adminScanQ.trim();
                  const found=prods.find(p=>p.barcode===bc&&p.business===adminBiz)||prods.find(p=>p.name.toLowerCase().includes(bc.toLowerCase())&&p.business===adminBiz);
                  if(found){openEditP(found);setAdminScanQ("");}else toast("Produk tidak ditemukan: "+bc,"warn");}}}
                placeholder="Scan barcode / ketik barcode atau nama produk..."
                style={{width:"100%",padding:"10px 12px",background:C.bg3,border:`1.5px solid ${C.bo1}`,borderRadius:9,color:C.t0,fontSize:13,fontFamily:F.mono}}/>

              {/* Autocomplete Suggestions Admin */}
              {adminScanQ.trim().length > 1 && (
                <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:100,background:C.bg2,border:`1px solid ${C.bo1}`,borderRadius:12,marginTop:6,boxShadow:"0 10px 30px rgba(0,0,0,0.6)",overflow:"hidden",animation:"fadeUp 0.2s ease"}}>
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
              style={{padding:"10px 14px",background:C.b,border:"none",borderRadius:9,color:"#fff",fontWeight:700,fontSize:12,flexShrink:0}}>Cari</button>
          </div>
          {/* ─── Form Tambah (inline di atas) ─── */}
          <div id="prod-form-anchor"/>
          {pModal&&inlineAddMode&&<div style={{background:C.bg2,borderRadius:14,border:`2px solid ${C.g}55`,padding:"14px 14px 12px",animation:"fadeUp .2s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontSize:12,fontWeight:800,color:C.g}}>➕ Produk Baru</span>
              <button onClick={()=>{setPModal(false);setInlineAddMode(false);}} style={{background:"transparent",border:"none",color:C.t3,fontSize:18,cursor:"pointer",lineHeight:1}}>×</button>
            </div>
            
            {/* ─── Core fields ─── */}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div style={{gridColumn:"span 2"}}>
                  <div style={{fontSize:9,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Barcode *</div>
                  <input value={pForm.barcode||""} disabled={editPid!==null} onChange={e=>setPForm(x=>({...x,barcode:e.target.value}))}
                    style={{...IS,width:"100%",boxSizing:"border-box",color:editPid!==null?C.t2:C.t0}}
                    onFocus={e=>editPid===null&&(e.target.style.borderColor=C.g+"88")} onBlur={e=>e.target.style.borderColor=C.bo0}/>
                </div>
                <div style={{gridColumn:"span 2"}}>
                  <div style={{fontSize:9,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Nama Produk *</div>
                  <input value={pForm.name||""} onChange={e=>setPForm(x=>({...x,name:e.target.value}))}
                    style={{...IS,width:"100%",boxSizing:"border-box"}}
                    onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.bo0}/>
                </div>
                <div>
                  <div style={{fontSize:9,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Kategori</div>
                  <input value={pForm.category||""} onChange={e=>setPForm(x=>({...x,category:e.target.value}))}
                    style={{...IS,width:"100%",boxSizing:"border-box"}}
                    onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.bo0}/>
                </div>
                <div>
                  <div style={{fontSize:9,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Stok *</div>
                  <input type="number" value={pForm.stock||""} onChange={e=>setPForm(x=>({...x,stock:e.target.value}))}
                    style={{...IS,width:"100%",boxSizing:"border-box"}}
                    onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.bo0}/>
                </div>
              </div>

              {/* ─── Expire date ─── */}
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                <div style={{fontSize:9,fontWeight:700,color:C.r,textTransform:"uppercase",letterSpacing:.5}}>
                  ⏰ Tanggal Expire <span style={{color:C.t3,fontWeight:400,fontSize:8}}>(opsional)</span>
                </div>
                <input type="date" value={pForm.expireDate||""} onChange={e=>setPForm(x=>({...x,expireDate:e.target.value}))}
                  style={{...IS,width:"100%",boxSizing:"border-box",
                    borderColor:pForm.expireDate?C.r+"55":C.bo0}}
                  onFocus={e=>e.target.style.borderColor=C.r+"88"}
                  onBlur={e=>e.target.style.borderColor=pForm.expireDate?C.r+"55":C.bo0}/>
                {pForm.expireDate&&(()=>{
                  const days=Math.ceil((new Date(pForm.expireDate)-new Date())/86400000);
                  const col=days<0?C.r:days<=30?C.r:days<=90?C.a:C.g;
                  return <div style={{fontSize:10,color:col,fontWeight:600}}>
                    {days<0?`⛔ Sudah kadaluarsa ${Math.abs(days)} hari lalu`:
                     days===0?"⛔ Expire hari ini":
                     days<=30?`🔴 ${days} hari lagi`:
                     days<=90?`🟡 ${days} hari lagi`:
                     `🟢 ${days} hari lagi`}
                  </div>;
                })()}
              </div>
              {/* ─── Price drawer ─── */}
              <button onClick={()=>setShowPriceDrawer(x=>!x)} className="press"
                style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",
                  background:C.bg3,border:`1px solid ${C.bo0}`,borderRadius:9,cursor:"pointer",fontFamily:F.sans,width:"100%",textAlign:"left"}}>
                <span style={{fontSize:11.5,fontWeight:700,color:C.t1}}>
                  💰 Harga & HPP
                  {pForm.price&&+pForm.price>0&&<span className="mn" style={{color:C.g,marginLeft:6}}>{rp(pForm.price)}</span>}
                  {pForm.hpp&&+pForm.hpp>0&&<span className="mn" style={{color:C.a,marginLeft:4}}>/ {rp(pForm.hpp)}</span>}
                </span>
                <span style={{fontSize:12,color:C.t2,transition:"transform .2s",transform:showPriceDrawer?"rotate(180deg)":"rotate(0deg)",display:"inline-block"}}>▾</span>
              </button>
              {showPriceDrawer&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,animation:"fadeUp .15s ease"}}>
                <div>
                  <div style={{fontSize:9,fontWeight:700,color:C.g,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Harga Jual *</div>
                  <input type="number" value={pForm.price||""} onChange={e=>setPForm(x=>({...x,price:e.target.value}))}
                    style={{...IS,width:"100%",boxSizing:"border-box"}}
                    onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.bo0}/>
                </div>
                <div>
                  <div style={{fontSize:9,fontWeight:700,color:C.a,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>HPP / Modal</div>
                  <input type="number" value={pForm.hpp||""} onChange={e=>setPForm(x=>({...x,hpp:e.target.value}))}
                    style={{...IS,width:"100%",boxSizing:"border-box",borderColor:C.a+"44"}}
                    onFocus={e=>e.target.style.borderColor=C.a+"88"} onBlur={e=>e.target.style.borderColor=C.a+"44"}/>
                </div>
                {pForm.price&&pForm.hpp&&+pForm.price>0&&+pForm.hpp>0&&(
                  <div style={{gridColumn:"span 2",padding:"6px 10px",background:C.g2,borderRadius:7,fontSize:11,display:"flex",gap:12,flexWrap:"wrap"}}>
                    <span style={{color:C.t2}}>Margin: <b style={{color:C.g}}>{((+pForm.price-+pForm.hpp)/+pForm.price*100).toFixed(1)}%</b></span>
                    <span style={{color:C.t2}}>Laba: <b style={{color:C.cy}}>{rp(+pForm.price-+pForm.hpp)}</b></span>
                  </div>)}
              </div>}
              {/* ─── Add-on ─── */}
              <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.bo0}`}}>
              <div style={{fontSize:10,fontWeight:700,color:C.vi,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>
                ➕ Konfigurasi Add-on (Opsional)
              </div>
              <p style={{fontSize:11.5,color:C.t2,marginBottom:10,lineHeight:1.6}}>
                Saat produk ini di-scan kasir, sistem akan menawarkan produk add-on berikut.
              </p>
              {/* Search and add addon */}
              <div style={{display:"flex",gap:7,marginBottom:8}}>
                <input
                  placeholder="Cari produk add-on (nama/barcode)..."
                  style={{...IS,flex:1,fontSize:12}}
                  value={pForm._addonSearch||""}
                  onChange={e=>setPForm(x=>({...x,_addonSearch:e.target.value}))}
                  onKeyDown={e=>{
                    if(e.key!=="Enter") return;
                    const q=(pForm._addonSearch||"").toLowerCase();
                    const found=prods.find(p=>p.business===(pForm.business||adminBiz)&&
                      (p.barcode.includes(q)||p.name.toLowerCase().includes(q))&&
                      p.id!==(editPid));
                    if(!found){toast("Produk tidak ditemukan","warn");return;}
                    const cur=pForm.addons||[];
                    if(cur.includes(found.id)){toast("Sudah ada","warn");return;}
                    setPForm(x=>({...x,addons:[...cur,found.id],_addonSearch:""}));
                    toast("✓ Add-on ditambahkan: "+found.name);
                  }}
                />
                <button onClick={()=>{
                  const q=(pForm._addonSearch||"").toLowerCase();
                  if(!q) return;
                  const found=prods.find(p=>p.business===(pForm.business||adminBiz)&&
                    (p.barcode.includes(q)||p.name.toLowerCase().includes(q))&&
                    p.id!==(editPid));
                  if(!found){toast("Produk tidak ditemukan","warn");return;}
                  const cur=pForm.addons||[];
                  if(cur.includes(found.id)){toast("Sudah ada","warn");return;}
                  setPForm(x=>({...x,addons:[...cur,found.id],_addonSearch:""}));
                  toast("✓ Add-on: "+found.name);
                }} className="press"
                  style={{padding:"10px 14px",background:C.vi1,border:`1px solid ${C.vi}33`,borderRadius:9,color:C.vi,fontSize:12,fontWeight:700,flexShrink:0}}>+ Tambah</button>
              </div>
              {/* Current addons list */}
              {(pForm.addons||[]).length>0
                ?<div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {(pForm.addons||[]).map(adId=>{
                    const ap=prods.find(x=>x.id===adId);
                    if(!ap) return null;
                    return <div key={adId} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",
                      background:C.bg3,borderRadius:9,border:`1px solid ${C.vi}22`}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12.5,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ap.name}</div>
                        <div className="mn" style={{fontSize:10,color:C.t2,marginTop:1}}>{ap.barcode} · {rp(ap.price)}</div>
                      </div>
                      <button onClick={()=>setPForm(x=>({...x,addons:(x.addons||[]).filter(i=>i!==adId)}))}
                        style={{background:"transparent",border:"none",color:C.r,fontSize:16,cursor:"pointer",padding:"0 4px",lineHeight:1}}>×</button>
                    </div>;})}
                </div>
                :<div style={{padding:"10px 12px",background:C.bg3,borderRadius:8,border:`1px solid ${C.bo0}`,fontSize:12,color:C.t3,textAlign:"center"}}>
                  Belum ada add-on — tambah produk di atas
                </div>}
            </div>
              <div style={{display:"flex",gap:7,marginTop:10}}>
                <Btn onClick={saveProd} full size="sm">✓ Simpan</Btn>
                <Btn onClick={()=>{setPModal(false);setEditPid(null);setInlineAddMode(false);}} outline size="sm">Batal</Btn>
              </div>
            </div>
          </div>}
          {/* Desktop table */}
          <div className="hide-mobile">
            <Card noPad style={{overflow:"hidden"}}>
              <TableWrap>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:580}}>
                  <THead cols={["Barcode","Nama","Kategori","HPP","Harga Jual","Margin","Stok","Expire","Add-on","Aksi"]}/>
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
                            {expired?`⛔ ${Math.abs(days)}h lalu`:days===0?"⛔ Hari ini":
                             days<=30?`🔴 ${days}h`:days<=90?`🟡 ${days}h`:`🟢 ${days}h`}
                          </span>;
                        })():<span style={{fontSize:10,color:C.t3}}>—</span>}
                      </td>
                      <td style={{padding:"14px 13px"}}>
                        {(p.addons||[]).length>0
                          ?<span style={{padding:"2px 8px",borderRadius:20,fontSize:9.5,fontWeight:700,background:C.vi1,color:C.vi,border:`1px solid ${C.vi}22`,cursor:"pointer"}}
                             title={(p.addons||[]).map(id=>prods.find(x=>x.id===id)?.name||id).join(", ")}>
                             +{(p.addons||[]).length} item</span>
                          :<span style={{fontSize:10,color:C.t3}}>—</span>}
                      </td>
                      <td style={{padding:"14px 13px",whiteSpace:"nowrap"}}>
                        <button onClick={()=>openEditP(p)} className="press"
                          style={{marginRight:4,padding:"3px 9px",
                            background:editPid===p.id&&pModal?"transparent":"transparent",
                            border:`1px solid ${editPid===p.id&&pModal?C.g:C.bo1}`,
                            borderRadius:6,color:editPid===p.id&&pModal?C.g:C.t0,fontSize:10,fontWeight:editPid===p.id&&pModal?700:400}}>
                          {editPid===p.id&&pModal?"✓ Edit":"Edit"}</button>
                        <button onClick={()=>fbDeleteProduct(p.id,p.name,p.business,user.name).then(()=>toast("Produk dihapus")).catch(e=>toast(e.message,"err"))} className="press" style={{padding:"3px 9px",background:C.r1,border:`1px solid ${C.r}22`,borderRadius:6,color:C.r,fontSize:10}}>Hapus</button>
                      </td>
                    </tr>
                    {/* ─── Inline edit form (desktop) ─── */}
                    {editPid===p.id&&pModal&&!inlineAddMode&&<tr id={"prod-inline-"+p.id}>
                      <td colSpan={9} style={{padding:"0 0 8px 0",background:C.bg1}}>
                        <div style={{margin:"0 8px",background:C.bg2,borderRadius:12,border:`2px solid ${C.g}44`,padding:"14px",animation:"fadeUp .2s ease"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                            <span style={{fontSize:12,fontWeight:800,color:C.g}}>✏️ Edit: {p.name}</span>
                            <button onClick={()=>{setPModal(false);setEditPid(null);}} style={{background:"transparent",border:"none",color:C.t3,fontSize:18,cursor:"pointer",lineHeight:1}}>×</button>
                          </div>
                          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:8}}>
                            <div style={{gridColumn:"span 2"}}>
                              <div style={{fontSize:9,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>Nama Produk *</div>
                              <input value={pForm.name||""} onChange={e=>setPForm(x=>({...x,name:e.target.value}))}
                                style={{...IS,width:"100%",boxSizing:"border-box",padding:"9px 11px"}}
                                onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.bo0}/>
                            </div>
                            <div>
                              <div style={{fontSize:9,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>Kategori</div>
                              <input value={pForm.category||""} onChange={e=>setPForm(x=>({...x,category:e.target.value}))}
                                style={{...IS,width:"100%",boxSizing:"border-box",padding:"9px 11px"}}
                                onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.bo0}/>
                            </div>
                            <div>
                              <div style={{fontSize:9,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>Stok *</div>
                              <input type="number" value={pForm.stock||""} onChange={e=>setPForm(x=>({...x,stock:e.target.value}))}
                                style={{...IS,width:"100%",boxSizing:"border-box",padding:"9px 11px"}}
                                onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.bo0}/>
                            </div>
                          </div>
                          {/* Expire date */}
                          <div style={{marginBottom:8}}>
                            <div style={{fontSize:9,fontWeight:700,color:C.r,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>
                              ⏰ Expire <span style={{color:C.t3,fontWeight:400}}>(opsional)</span>
                            </div>
                            <input type="date" value={pForm.expireDate||""} onChange={e=>setPForm(x=>({...x,expireDate:e.target.value}))}
                              style={{...IS,width:"100%",boxSizing:"border-box",padding:"8px 10px",borderColor:pForm.expireDate?C.r+"55":C.bo0}}
                              onFocus={e=>e.target.style.borderColor=C.r+"88"} onBlur={e=>e.target.style.borderColor=pForm.expireDate?C.r+"55":C.bo0}/>
                            {pForm.expireDate&&(()=>{const d=Math.ceil((new Date(pForm.expireDate)-new Date())/86400000);const col=d<0?C.r:d<=90?C.a:C.g;
                              return <div style={{fontSize:10,color:col,fontWeight:600,marginTop:3}}>{d<0?`⛔ Kadaluarsa ${Math.abs(d)}h lalu`:d===0?"⛔ Hari ini":`${d<=30?"🔴":"🟡"} ${d} hari lagi`}</div>;})()}
                          </div>
                          {/* Price drawer */}
                          <button onClick={()=>setShowPriceDrawer(x=>!x)} className="press"
                            style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 11px",
                              background:C.bg3,border:`1px solid ${C.bo0}`,borderRadius:8,cursor:"pointer",fontFamily:F.sans,width:"100%",textAlign:"left",marginBottom:6,boxSizing:"border-box"}}>
                            <span style={{fontSize:11,fontWeight:700,color:C.t1}}>
                              💰 Harga & HPP
                              {pForm.price&&+pForm.price>0&&<span className="mn" style={{color:C.g,marginLeft:6}}>{rp(pForm.price)}</span>}
                              {pForm.hpp&&+pForm.hpp>0&&<span className="mn" style={{color:C.a,marginLeft:4}}>/ HPP {rp(pForm.hpp)}</span>}
                            </span>
                            <span style={{fontSize:11,color:C.t2,transition:"transform .2s",transform:showPriceDrawer?"rotate(180deg)":"none",display:"inline-block"}}>▾</span>
                          </button>
                          {showPriceDrawer&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8,animation:"fadeUp .15s ease"}}>
                            <div>
                              <div style={{fontSize:9,fontWeight:700,color:C.g,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>Harga Jual</div>
                              <input type="number" value={pForm.price||""} onChange={e=>setPForm(x=>({...x,price:e.target.value}))}
                                style={{...IS,width:"100%",boxSizing:"border-box",padding:"9px 11px"}}
                                onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.bo0}/>
                            </div>
                            <div>
                              <div style={{fontSize:9,fontWeight:700,color:C.a,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>HPP / Modal</div>
                              <input type="number" value={pForm.hpp||""} onChange={e=>setPForm(x=>({...x,hpp:e.target.value}))}
                                style={{...IS,width:"100%",boxSizing:"border-box",padding:"9px 11px",borderColor:C.a+"44"}}
                                onFocus={e=>e.target.style.borderColor=C.a+"88"} onBlur={e=>e.target.style.borderColor=C.a+"44"}/>
                            </div>
                            {pForm.price&&pForm.hpp&&+pForm.price>0&&+pForm.hpp>0&&<div style={{display:"flex",alignItems:"center",padding:"0 4px",fontSize:11,flexDirection:"column",justifyContent:"center",gap:2}}>
                              <span style={{color:C.g,fontWeight:700}}>{((+pForm.price-+pForm.hpp)/+pForm.price*100).toFixed(1)}%</span>
                              <span style={{color:C.t3,fontSize:9}}>margin</span>
                            </div>}
                          </div>}
                          <div style={{display:"flex",gap:7}}>
                            <Btn onClick={saveProd} size="sm">✓ Simpan</Btn>
                            <Btn onClick={()=>{setPModal(false);setEditPid(null);}} outline size="sm">Batal</Btn>
                          </div>
                        </div>
                      </td>
                    </tr>};})}
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
                    <div style={{fontSize:9.5,color:C.t3,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:2}}>HPP</div>
                    <div className="mn" style={{fontSize:12,color:C.a,fontWeight:700}}>{rp(p.hpp||0)}</div>
                  </div>
                  <div>
                    <div style={{fontSize:9.5,color:C.t3,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:2}}>Harga Jual</div>
                    <div className="mn" style={{fontSize:12,color:C.g,fontWeight:700}}>{rp(p.price)}</div>
                  </div>
                  <div>
                    <div style={{fontSize:9.5,color:C.t3,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:2}}>Margin</div>
                    <div className="mn" style={{fontSize:12,color:C.cy,fontWeight:700}}>{mg}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>openEditP(p)} className="press"
                    style={{flex:1,padding:"11px",
                      background:editPid===p.id&&pModal?C.g1:"transparent",
                      border:`1.5px solid ${editPid===p.id&&pModal?C.g:C.bo1}`,
                      borderRadius:10,color:editPid===p.id&&pModal?C.g:C.t0,fontSize:13,fontWeight:600,fontFamily:F.sans}}>
                    {editPid===p.id&&pModal?"✓ Sedang Diedit":"✏️ Edit"}</button>
                  <button onClick={()=>fbDeleteProduct(p.id,p.name,p.business,user.name).then(()=>toast("Produk dihapus")).catch(e=>toast(e.message,"err"))} className="press" style={{padding:"11px 16px",background:C.r1,border:`1.5px solid ${C.r}33`,borderRadius:10,color:C.r,fontSize:13,fontFamily:F.sans}}>🗑</button>
                </div>
                {/* Inline edit form (mobile) */}
                {editPid===p.id&&pModal&&!inlineAddMode&&<div id={"prod-inline-"+p.id} style={{marginTop:10,background:C.bg3,borderRadius:12,border:`2px solid ${C.g}44`,padding:"12px",animation:"fadeUp .2s ease"}}>
                  <div style={{fontSize:11,fontWeight:800,color:C.g,marginBottom:10}}>✏️ Edit Produk</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    <div>
                      <div style={{fontSize:9,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>Nama Produk *</div>
                      <input value={pForm.name||""} onChange={e=>setPForm(x=>({...x,name:e.target.value}))}
                        style={{...IS,width:"100%",boxSizing:"border-box"}}
                        onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.bo0}/>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      <div>
                        <div style={{fontSize:9,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>Kategori</div>
                        <input value={pForm.category||""} onChange={e=>setPForm(x=>({...x,category:e.target.value}))}
                          style={{...IS,width:"100%",boxSizing:"border-box"}}
                          onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.bo0}/>
                      </div>
                      <div>
                        <div style={{fontSize:9,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>Stok *</div>
                        <input type="number" value={pForm.stock||""} onChange={e=>setPForm(x=>({...x,stock:e.target.value}))}
                          style={{...IS,width:"100%",boxSizing:"border-box"}}
                          onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.bo0}/>
                      </div>
                    </div>
                    {/* Expire date */}
                    <div>
                      <div style={{fontSize:9,fontWeight:700,color:C.r,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>
                        ⏰ Expire <span style={{color:C.t3,fontWeight:400}}>(opsional)</span>
                      </div>
                      <input type="date" value={pForm.expireDate||""} onChange={e=>setPForm(x=>({...x,expireDate:e.target.value}))}
                        style={{...IS,width:"100%",boxSizing:"border-box",borderColor:pForm.expireDate?C.r+"55":C.bo0}}
                        onFocus={e=>e.target.style.borderColor=C.r+"88"} onBlur={e=>e.target.style.borderColor=pForm.expireDate?C.r+"55":C.bo0}/>
                      {pForm.expireDate&&(()=>{const d=Math.ceil((new Date(pForm.expireDate)-new Date())/86400000);const col=d<0?C.r:d<=90?C.a:C.g;
                        return <div style={{fontSize:10,color:col,fontWeight:600,marginTop:3}}>{d<0?`⛔ ${Math.abs(d)}h lalu`:d===0?"⛔ Hari ini":`${d<=30?"🔴":"🟡"} ${d} hari lagi`}</div>;})()}
                    </div>
                    {/* Price drawer */}
                    <button onClick={()=>setShowPriceDrawer(x=>!x)} className="press"
                      style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                        padding:"9px 12px",background:C.bg2,border:`1px solid ${C.bo0}`,
                        borderRadius:9,cursor:"pointer",fontFamily:F.sans,width:"100%",textAlign:"left",boxSizing:"border-box"}}>
                      <span style={{fontSize:11,fontWeight:700,color:C.t1}}>
                        💰 Harga & HPP
                        {pForm.price&&+pForm.price>0&&<span className="mn" style={{color:C.g,marginLeft:5}}>{rp(pForm.price)}</span>}
                        {pForm.hpp&&+pForm.hpp>0&&<span className="mn" style={{color:C.a,marginLeft:4}}>/ {rp(pForm.hpp)}</span>}
                      </span>
                      <span style={{fontSize:11,color:C.t2,transition:"transform .2s",transform:showPriceDrawer?"rotate(180deg)":"none",display:"inline-block"}}>▾</span>
                    </button>
                    {showPriceDrawer&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,animation:"fadeUp .15s ease"}}>
                      <div>
                        <div style={{fontSize:9,fontWeight:700,color:C.g,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>Harga Jual</div>
                        <input type="number" value={pForm.price||""} onChange={e=>setPForm(x=>({...x,price:e.target.value}))}
                          style={{...IS,width:"100%",boxSizing:"border-box"}}
                          onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.bo0}/>
                      </div>
                      <div>
                        <div style={{fontSize:9,fontWeight:700,color:C.a,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>HPP / Modal</div>
                        <input type="number" value={pForm.hpp||""} onChange={e=>setPForm(x=>({...x,hpp:e.target.value}))}
                          style={{...IS,width:"100%",boxSizing:"border-box",borderColor:C.a+"44"}}
                          onFocus={e=>e.target.style.borderColor=C.a+"88"} onBlur={e=>e.target.style.borderColor=C.a+"44"}/>
                      </div>
                      {pForm.price&&pForm.hpp&&+pForm.price>0&&+pForm.hpp>0&&(
                        <div style={{gridColumn:"span 2",padding:"6px 10px",background:C.g2,borderRadius:7,fontSize:11,display:"flex",gap:12}}>
                          <span style={{color:C.t2}}>Margin: <b style={{color:C.g}}>{((+pForm.price-+pForm.hpp)/+pForm.price*100).toFixed(1)}%</b></span>
                          <span style={{color:C.t2}}>Laba: <b style={{color:C.cy}}>{rp(+pForm.price-+pForm.hpp)}</b></span>
                        </div>)}
                    </div>}
                    <div style={{display:"flex",gap:7,marginTop:2}}>
                      <Btn onClick={saveProd} full size="sm">✓ Simpan</Btn>
                      <Btn onClick={()=>{setPModal(false);setEditPid(null);}} outline size="sm">Batal</Btn>
                    </div>
                  </div>
                </div>}
              </div>;})}
          </div>
        </div>}


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
                {b2==="ALL"?"🏢 Semua":BIZ[b2]?.icon+" "+BIZ[b2]?.name}
              </button>;})}
            <div style={{width:1,height:20,background:C.bo0,alignSelf:"center"}}/>
            {/* Kasir filter */}
            <select value={reportKasir} onChange={e=>setReportKasir(e.target.value)}
              style={{padding:"8px 12px",background:C.bg2,border:`1.5px solid ${C.bo0}`,borderRadius:50,
                color:C.t0,fontSize:12,fontFamily:F.sans,cursor:"pointer",fontWeight:600}}>
              <option value="ALL">👤 Semua Kasir</option>
              {users.filter(u=>u.role==="kasir"||u.role==="admin").map(u=><option key={u.id} value={String(u.id)}>{u.name}</option>)}
            </select>
            <div style={{width:1,height:20,background:C.bo0,alignSelf:"center"}}/>
            {/* Kategori filter */}
            <select value={reportCategory} onChange={e=>setReportCategory(e.target.value)}
              style={{padding:"8px 12px",background:reportCategory!=="ALL"?C.cy1:C.bg2,
                border:`1.5px solid ${reportCategory!=="ALL"?C.cy:C.bo0}`,borderRadius:50,
                color:reportCategory!=="ALL"?C.cy:C.t0,fontSize:12,fontFamily:F.sans,cursor:"pointer",fontWeight:600}}>
              <option value="ALL">🏷 Semua Kategori</option>
              {allCategories.map(cat=><option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          {/* Period chips */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginTop:2}}>
            {[["all","📅 Semua"],["today","Hari Ini"],["week","7 Hari"],["month","📆 Bulan Ini"],["custom","Rentang"]].map(([v,l])=><button key={v}
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
                {BIZ[reportBiz]?.icon} {BIZ[reportBiz]?.name}
                <button onClick={()=>setReportBiz("ALL")} style={{background:"none",border:"none",color:"inherit",marginLeft:4,cursor:"pointer",fontSize:12,lineHeight:1}}>×</button>
              </span>}
              {reportKasir!=="ALL"&&<span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:C.vi1,color:C.vi}}>
                👤 {users.find(u=>String(u.id)===reportKasir)?.name||reportKasir}
                <button onClick={()=>setReportKasir("ALL")} style={{background:"none",border:"none",color:"inherit",marginLeft:4,cursor:"pointer",fontSize:12,lineHeight:1}}>×</button>
              </span>}
              {reportCategory!=="ALL"&&<span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:C.cy1,color:C.cy}}>
                🏷 {reportCategory}
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
              <span className="stat-ico">{s.ic}</span>
              <span className="stat-lbl">{s.lbl}</span>
              <span className="stat-val" style={{color:s.color,fontSize:s.val.length>10?15:18}}>{s.val}</span>
              {s.sub&&<span style={{fontSize:10,color:C.t2,fontWeight:600}}>{s.sub}</span>}
            </div>)}
          </div>
          {/* Pie */}
          {bizRevData.length>1&&<Card>
            <div style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Kontribusi per Bisnis</div>
            <SimplePieChart data={bizRevData}/>
          </Card>}
          {/* Daily chart */}
          {dailyData.length>0&&<Card>
            <div style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Tren Harian</div>
            <SimpleBarChart data={dailyData} keys={["rev","profit"]} colors={[C.g,C.cy]} height={200} labelKey="date"/>
          </Card>}
          {/* Per kasir */}
          {kasirBreakdown.length>0&&<Card noPad style={{overflow:"hidden"}}>
            <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.bo0}`}}>
              <span style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1}}>Performa per Kasir</span>
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
                <span style={{fontSize:13,fontWeight:800,color:C.t0}}>📋 Detail Penjualan Per Produk</span>
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
                <span style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1}}>
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
              <div className="hide-mobile"><TableWrap maxH="60vh">
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:620}}>
                  <THead cols={["Tanggal","Nama Pembeli","Kasir","Produk","Qty","Harga","Subtotal","Bayar"]}/>
                  <tbody>{rows.slice(0,200).map((r,i)=>(
                    <tr key={i} className="hrow" style={{borderTop:`1px solid ${C.bo0}`,background:i%2===0?"transparent":C.bg0}}>
                      <td style={{padding:"11px 13px",fontSize:10,color:C.t2,whiteSpace:"nowrap"}}>{r.date}</td>
                      <td style={{padding:"11px 13px",fontWeight:600,fontSize:12}}>
                        <div style={{display:"flex",alignItems:"center",gap:5}}>
                          {r.namaPembeli!=="Umum"&&<span style={{fontSize:13}}>🧑</span>}
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
                <span style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1,flex:1,whiteSpace:"nowrap"}}>
                  Invoice ({trxFiltered.length}{sq?` dari ${filtTrx.length}`:""})
                </span>
                <div style={{position:"relative",flex:"0 1 220px",minWidth:160}}>
                  <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontSize:13,color:C.t2,pointerEvents:"none"}}>🔍</span>
                  <input value={searchInvoice} onChange={e=>setSearchInvoice(e.target.value)}
                    placeholder="Cari nama pembeli / ID..."
                    style={{width:"100%",padding:"7px 10px 7px 30px",background:C.bg3,
                      border:`1.5px solid ${searchInvoice?C.g+"88":C.bo0}`,borderRadius:20,
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
                              background:C.b1,color:C.b,fontSize:10,fontWeight:700}}>🧑 {t.namaPembeli}</span>}
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
                            ?<span style={{flex:1,padding:"9px",textAlign:"center",color:C.a,fontSize:12,fontWeight:600}}>✓ Sudah diretur</span>
                            :<button onClick={e=>{e.stopPropagation();if(window.confirm("Retur transaksi ini?\nStok akan dikembalikan."))doRetur(t);}} className="press"
                              style={{flex:1,padding:"9px",background:C.a1,border:`1.5px solid ${C.a}33`,
                                borderRadius:9,color:C.a,fontSize:12,fontWeight:700,fontFamily:F.sans}}>↩ Retur</button>}
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
                style={{padding:"7px 14px",background:C.r1,border:`1px solid ${C.r}33`,borderRadius:8,color:C.r,fontSize:12,fontWeight:700,fontFamily:F.sans}}>🗑 Reset Hari Ini</button>
            </div>
          </div>
          <Card style={{padding:"12px 14px"}}>
            <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"flex-end"}}>
              <div style={{flex:"1 1 180px",minWidth:160}}>
                <div style={{fontSize:9.5,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:5}}>Pegawai</div>
                <select value={selUser} onChange={e=>setSelUser(e.target.value)} style={{width:"100%",padding:"10px 12px",background:C.bg3,border:`1.5px solid ${C.bo0}`,borderRadius:10,color:C.t0,fontSize:13,fontFamily:F.sans,cursor:"pointer"}}>
                  <option value="ALL">Semua Pegawai</option>
                  {users.filter(u=>u.role!=="admin").map(u=><option key={u.id} value={String(u.id)}>{u.avatar} {u.name}</option>)}
                </select>
              </div>
              <div style={{flex:"2 1 300px"}}>
                <div style={{fontSize:9.5,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:5}}>Rentang Waktu</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                  {[["all","📅 Semua"],["today","Hari Ini"],["week","7 Hari"],["month","📆 Bulan Ini"],["custom","Rentang"]].map(([v,l])=>(
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
              <span style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1}}>Ringkasan Kehadiran ({Object.keys(attByUser).length} pegawai)</span>
            </div>
            {Object.keys(attByUser).length===0
              ?<div style={{padding:"24px",textAlign:"center",color:C.t3,fontSize:12}}>Belum ada data untuk periode ini</div>
              :<TableWrap>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <THead cols={["Pegawai","Role","Hadir (Hari)","Total Jam Kerja","Rata-rata/Hari","Terakhir Masuk"]}/>
                  <tbody>{Object.values(attByUser).map((au,i)=>{
                    const avgMin=au.days>0?Math.floor(au.totalMinutes/au.days):0;
                    const totalJam=`${Math.floor(au.totalMinutes/60)}j ${au.totalMinutes%60}m`;
                    const avgJam=`${Math.floor(avgMin/60)}j ${avgMin%60}m`;
                    return <tr key={au.userId} className="hrow" style={{borderTop:`1px solid ${C.bo0}`,background:i%2===0?"transparent":C.bg0}}>
                      <td style={{padding:"14px 13px",fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
                        <span>{users.find(u=>u.id===au.userId)?.avatar||"🧑"}</span>{au.name}</td>
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
              <span style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1}}>Detail Absensi ({attFiltered.length})</span>
            </div>
            {attFiltered.length===0?<div style={{padding:"24px",textAlign:"center",color:C.t3,fontSize:12}}>Tidak ada data</div>
            :<>
              <div className="hide-mobile"><TableWrap>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:540}}>
                  <THead cols={["Tanggal","Pegawai","Role","Bisnis","Jam Masuk","Jam Pulang","Durasi"]}/>
                  <tbody>{[...attFiltered].sort((a,b)=>{try{return new Date(b.checkInISO||b.checkIn)-new Date(a.checkInISO||a.checkIn);}catch{return 0;}}).map((a,i)=>(
                    <tr key={a.id} className="hrow" style={{borderTop:`1px solid ${C.bo0}`,background:i%2===0?"transparent":C.bg0}}>
                      <td style={{padding:"14px 13px",fontFamily:F.mono,fontSize:10,color:C.t2,whiteSpace:"nowrap"}}>{a.date}</td>
                      <td style={{padding:"14px 13px",fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
                        <span>{users.find(u=>u.id===a.userId)?.avatar||"🧑"}</span>{a.name}</td>
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
                      <div style={{width:40,height:40,borderRadius:11,background:C.bg3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{users.find(u=>u.id===a.userId)?.avatar||"🧑"}</div>
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
                {["ALL","JS_CLOTHING","JB_STORE"].map(b2=><button key={b2} onClick={()=>setSlogBiz(b2)} className="press"
                  style={{padding:"5px 11px",borderRadius:7,fontSize:11.5,fontWeight:600,cursor:"pointer",background:slogBiz===b2?(b2==="JB_STORE"?C.p1:b2==="JS_CLOTHING"?C.b1:C.g1):"transparent",border:`1.5px solid ${slogBiz===b2?(b2==="JB_STORE"?C.p:b2==="JS_CLOTHING"?C.b:C.g):C.bo0}`,color:slogBiz===b2?(b2==="JB_STORE"?C.p:b2==="JS_CLOTHING"?C.b:C.g):C.t2,fontFamily:F.sans}}>{b2==="ALL"?"Semua":BIZ[b2]?.name}</button>)}
                <div style={{width:1,height:20,background:C.bo0}}/>
                {["ALL","masuk","keluar"].map(t=><button key={t} onClick={()=>setSlogType(t)} className="press"
                  style={{padding:"5px 11px",borderRadius:7,fontSize:11.5,fontWeight:600,cursor:"pointer",background:slogType===t?(t==="masuk"?C.g1:t==="keluar"?C.r1:C.a1):"transparent",border:`1.5px solid ${slogType===t?(t==="masuk"?C.g:t==="keluar"?C.r:C.a):C.bo0}`,color:slogType===t?(t==="masuk"?C.g:t==="keluar"?C.r:C.a):C.t2,fontFamily:F.sans}}>
                  {t==="ALL"?"Semua":t==="masuk"?"↑ Masuk":"↓ Keluar"}</button>)}
                <div style={{width:1,height:20,background:C.bo0}}/>
                {[["all","Semua"],["today","Hari Ini"],["week","7 Hari"],["month","Bulan Ini"],["custom","Rentang"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setSlogRange(v)} className="press"
                    style={{padding:"5px 11px",borderRadius:7,fontSize:11.5,fontWeight:600,cursor:"pointer",background:slogRange===v?C.g1:"transparent",border:`1.5px solid ${slogRange===v?C.g:C.bo0}`,color:slogRange===v?C.g:C.t2,fontFamily:F.sans}}>{l}</button>))}
                {slogRange==="custom"&&<>
                  <input type="date" value={slogFrom} onChange={e=>setSlogFrom(e.target.value)} style={{padding:"5px 9px",background:C.bg3,border:`1.5px solid ${C.bo1}`,borderRadius:8,color:C.t0,fontSize:12,fontFamily:F.sans}}/>
                  <span style={{color:C.t2,fontSize:12}}>s/d</span>
                  <input type="date" value={slogTo} onChange={e=>setSlogTo(e.target.value)} style={{padding:"5px 9px",background:C.bg3,border:`1.5px solid ${C.bo1}`,borderRadius:8,color:C.t0,fontSize:12,fontFamily:F.sans}}/>
                </>}
              </div>
            </Card>
            {slogsFiltered.length===0?<div style={{textAlign:"center",padding:"48px",color:C.t3}}><div style={{fontSize:40,opacity:.08,marginBottom:10}}>📋</div><p>Tidak ada data</p></div>
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
            ?<div style={{textAlign:"center",padding:"48px",color:C.t3}}><div style={{fontSize:40,opacity:.08,marginBottom:10}}>↩</div><p>Belum ada retur</p></div>
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
          </Card>
        </div>}

        {/* ── SHEETS ── */}
        {adminTab==="sheets"&&<div style={{maxWidth:640,display:"flex",flexDirection:"column",gap:10}}>
          <h2 style={{fontSize:15,fontWeight:800}}>Google Sheets Sync</h2>
          <Card>
            <div style={{fontSize:10,fontWeight:700,color:C.g,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>📋 Cara Setup</div>
            {[{n:1,t:"Buat Spreadsheet Baru",d:"Buka sheets.google.com, beri nama 'Kasir JE Grup'"},
              {n:2,t:"Buka Apps Script",d:"Menu Ekstensi → Apps Script, hapus kode lama"},
              {n:3,t:"Paste Kode",d:"Klik tombol salin di bawah dan paste ke editor script"},
              {n:4,t:"Deploy",d:"Deploy → New Deployment → Web App → Execute as: Me → Access: Anyone"},
              {n:5,t:"Simpan URL",d:"Salin URL Web App dan paste di kolom bawah ini"}].map(s=>(
              <div key={s.n} style={{display:"flex",gap:10,marginBottom:10}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:C.g1,color:C.g,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,flexShrink:0}}>{s.n}</div>
                <div><div style={{fontSize:12.5,fontWeight:600}}>{s.t}</div><div style={{fontSize:11,color:C.t2}}>{s.d}</div></div>
              </div>))}
          </Card>
          <Card noPad style={{overflow:"hidden"}}>
            <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.bo0}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase"}}>Kode Apps Script</span>
              <button onClick={()=>{navigator.clipboard.writeText(APPSCRIPT_CODE.trim());setCopyDone(true);setTimeout(()=>setCopyDone(false),2000);toast("✓ Kode disalin!");}} className="press"
                style={{padding:"4px 10px",background:copyDone?C.g1:C.bg4,border:`1px solid ${copyDone?C.g:C.bo1}`,borderRadius:7,color:copyDone?C.g:C.t1,fontSize:10,fontWeight:700}}>{copyDone?"Tersalin":"Salin Kode"}</button>
            </div>
            <pre style={{padding:"12px 14px",fontSize:10,fontFamily:F.mono,color:C.t2,overflowX:"auto",maxHeight:200,background:C.bg0}}>{APPSCRIPT_CODE.trim()}</pre>
          </Card>
          <Card>
            <div style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",marginBottom:10}}>URL Web App</div>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <input value={gsUrl} onChange={e=>{setGsUrl(e.target.value);localStorage.setItem("je_gs_url",e.target.value);}} placeholder="https://script.google.com/macros/s/.../exec"
                style={{flex:1,padding:"11px 13px",background:C.bg3,border:`1.5px solid ${C.bo0}`,borderRadius:10,color:C.t0,fontSize:12,fontFamily:F.mono}}/>
              <Btn onClick={async()=>{
                if(!gsUrl){toast("Masukkan URL dulu","warn");return;}
                setGsLoad(true);
                try{const ok=await syncToSheets(gsUrl,users,prods,trxs,slogs,attend); ok?toast("✅ Berhasil ekspor!"):toast("Gagal ekspor","err");}
                catch{toast("Koneksi gagal","err");}
                setGsLoad(false);
              }} disabled={gsLoad}>{gsLoad?"Memproses...":"↑ Ekspor Data"}</Btn>
            </div>
            <div style={{fontSize:11,color:C.a}}>💡 Gunakan fitur ini untuk backup database atau membuat laporan di Excel.</div>
          </Card>
          <Card style={{marginTop:10}}>
             <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
               <div style={{fontSize:11,color:C.t3}}>Project: <b>{loadConfig()?.projectId||"-"}</b></div>
               <div style={{display:"flex",gap:8,alignItems:"center"}}>
                 <button onClick={()=>{
                   if("serviceWorker" in navigator){
                     navigator.serviceWorker.getRegistration().then(reg=>{
                       if(reg){reg.update().then(()=>{
                         if(reg.waiting){setUpdateReady(true);toast("🆕 Update tersedia! Klik banner untuk pasang.","ok");}
                         else toast("✅ Sudah versi terbaru","ok");
                       });}
                     });
                   } else toast("Service Worker tidak tersedia","warn");
                 }} className="press"
                   style={{padding:"4px 12px",background:C.b1,border:`1px solid ${C.b}33`,borderRadius:8,color:C.b,fontSize:11,fontWeight:700}}>
                   ↻ Cek Update
                 </button>
                 <button onClick={()=>{if(window.confirm("Hapus config Firebase? Anda akan keluar.")) {clearConfig();window.location.reload();}}}
                   style={{background:"transparent",border:"none",color:C.r,fontSize:10,textDecoration:"underline",cursor:"pointer"}}>Reset Firebase</button>
               </div>
             </div>
          </Card>
        </div>}

        {/* ── OPNAME ── */}
        {adminTab==="opname"&&<OpnamePanel
          opnames={opnames} opnameItems={opnameItems}
          selectedOpname={selectedOpname} setSelectedOpname={setSelectedOpname}
          opnameTab={opnameTab} setOpnameTab={setOpnameTab}
          showCreateOpname={showCreateOpname} setShowCreateOpname={setShowCreateOpname}
          showImportOpname={showImportOpname} setShowImportOpname={setShowImportOpname}
          importOpnameRows={importOpnameRows} setImportOpnameRows={setImportOpnameRows}
          bizProds={bizProds} prods={prods} user={user} biz={adminBiz}
          toast={toast} rp={rp} uid={uid} nowStr={nowStr}
          fbCreateOpname={fbCreateOpname} fbCloseOpname={fbCloseOpname}
          fbDeleteOpname={fbDeleteOpname} fbUpdateOpnameItem={fbUpdateOpnameItem}
          fbBulkUpdateOpnameItems={fbBulkUpdateOpnameItems}
          fbApplyOpnameAdjustments={fbApplyOpnameAdjustments}
          slogs={slogs} loadSheetJS={loadSheetJS} downloadXLSX={downloadXLSX}
          BIZ={BIZ} C={C} F={F}/>}

      </div>

      {/* Mobile bottom nav */}
      <nav className="bnav">
        {BNAV_TABS.map(t=>{const isAct=adminTab===t.id&&!showMoreDrawer;
          return <button key={t.id} className={`bnavbtn${isAct?" active":""}`}
            onClick={()=>{setAdminTab(t.id);setSearchQ("");setPModal(false);setShowMoreDrawer(false);setEditPid(null);setInlineAddMode(false);}}>
            <span className="bnav-icon">{t.ic}</span>
            <span className="bnav-label" style={{color:isAct?C.g:C.t2}}>{t.label}</span>
            {isAct&&<div className="bnav-dot"/>}
          </button>;})}
        <button className={`bnavbtn${isMoreTab||showMoreDrawer?" active":""}`} onClick={()=>setShowMoreDrawer(x=>!x)}>
          <span className="bnav-icon" style={{fontSize:28,fontWeight:300,lineHeight:.9}}>⋯</span>
          <span className="bnav-label" style={{color:isMoreTab||showMoreDrawer?C.g:C.t2}}>Lainnya</span>
          {(isMoreTab||showMoreDrawer)&&<div className="bnav-dot"/>}
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
