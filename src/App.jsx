import { useState, useEffect, useRef, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import {
  loadConfig, saveConfig, clearConfig, initFirebase, isSeeded, seedDatabase,
  subscribeUsers, subscribeProducts, subscribeTransactions, subscribeStockLogs, subscribeAttendance,
  fbAddUser, fbUpdateUser, fbDeleteUser, fbAddProduct, fbUpdateProduct, fbDeleteProduct,
  fbAddTransaction, fbUpdateStock, fbCheckIn, fbCheckOut,
  fbDeleteAttendance, fbClearAttendanceByDate, syncToSheets,
} from "./firebase.js";

// ─────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────
const BIZ = {
  JS_CLOTHING: { id:"JS_CLOTHING", name:"JS Clothing", desc:"Usaha Konveksi", icon:"👕", color:"#38bdf8" },
  JB_STORE:    { id:"JB_STORE",    name:"JB Store",    desc:"Toko Skincare",  icon:"✨", color:"#f472b6" },
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
let NEXT_ID = 200;

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
const rp  = n => "Rp " + Number(n).toLocaleString("id-ID");
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,5);
const euclidean = (d1,d2) => Math.sqrt(d1.reduce((s,v,i)=>s+(v-d2[i])**2,0));
const nowStr = () => new Date().toLocaleString("id-ID");
const todayDate = () => new Date().toLocaleDateString("id-ID");
const todayISO8601 = () => new Date().toISOString().slice(0,10);
const parseAttDate = (iso) => { try { return new Date(iso); } catch { return new Date(0); } };
const todayISO  = () => new Date().toISOString().slice(0,10);

// ─────────────────────────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const DARK_C = {
  bg0:"#020817", bg1:"#060e1e", bg2:"#0a1628", bg3:"#0f1e36", bg4:"#152440",
  b0:"rgba(255,255,255,0.06)", b1:"rgba(255,255,255,0.1)", b2:"rgba(255,255,255,0.16)",
  t0:"#e8f4ff", t1:"#8aaac8", t2:"#4a6480", t3:"#253347",
  g:"#00e5a0", g1:"rgba(0,229,160,0.12)", g2:"rgba(0,229,160,0.06)",
  a:"#fbbf24", a1:"rgba(251,191,36,0.13)",
  r:"#fb7185", r1:"rgba(251,113,133,0.13)",
  b:"#38bdf8", b1:"rgba(56,189,248,0.12)",
  p:"#f472b6", p1:"rgba(244,114,182,0.12)",
  cy:"#22d3ee", cy1:"rgba(34,211,238,0.12)",
  vi:"#a78bfa", vi1:"rgba(167,139,250,0.12)",
};
const LIGHT_C = {
  bg0:"#e8edf2", bg1:"#f0f4f8", bg2:"#ffffff", bg3:"#f4f7fa", bg4:"#e2e8ef",
  b0:"rgba(0,0,0,0.08)", b1:"rgba(0,0,0,0.12)", b2:"rgba(0,0,0,0.18)",
  t0:"#0f172a", t1:"#334155", t2:"#64748b", t3:"#94a3b8",
  g:"#059669", g1:"rgba(5,150,105,0.1)", g2:"rgba(5,150,105,0.05)",
  a:"#b45309", a1:"rgba(180,83,9,0.1)",
  r:"#e11d48", r1:"rgba(225,29,72,0.1)",
  b:"#0284c7", b1:"rgba(2,132,199,0.1)",
  p:"#be185d", p1:"rgba(190,24,93,0.1)",
  cy:"#0e7490", cy1:"rgba(14,116,144,0.1)",
  vi:"#6d28d9", vi1:"rgba(109,40,217,0.1)",
};
let C = { ...(localStorage.getItem("je_theme")==="light" ? LIGHT_C : DARK_C) };
const F = { sans:"'Plus Jakarta Sans',system-ui,sans-serif", mono:"'JetBrains Mono',monospace" };


// ─────────────────────────────────────────────────────────────
//  EXCEL / CSV DOWNLOAD
// ─────────────────────────────────────────────────────────────
const downloadCSV = (rows, cols, filename) => {
  const BOM = "\uFEFF";
  const headers = cols.map(c => c.label);
  const lines = rows.map(r => cols.map(col => {
    let v = col.fn ? col.fn(r) : (r[col.key] ?? "");
    v = String(v).replace(/"/g, '""');
    return `"${v}"`;
  }).join(","));
  const csv = BOM + [headers.join(","), ...lines].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], {type:"text/csv;charset=utf-8"}));
  a.download = filename + "_" + new Date().toLocaleDateString("id-ID").replace(/\//g,"-") + ".csv";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
};
// ─────────────────────────────────────────────────────────────
//  GLOBAL CSS
// ─────────────────────────────────────────────────────────────
const makeCSS = () => `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{color-scheme:${C===DARK_C||C.bg1==="rgb(6,14,30)"||C.bg0==="#020817"?"dark":"light"};--safe-b:env(safe-area-inset-bottom,0px);}
  html{height:100%;-webkit-tap-highlight-color:transparent;}
  body{font-family:${F.sans};background:${C.bg1};color:${C.t0};height:100%;
    -webkit-font-smoothing:antialiased;overscroll-behavior:none;}
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
  @keyframes popIn{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes scanLine{0%,100%{top:8%}50%{top:88%}}
  @keyframes pulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.2)}}
  @keyframes glow{0%,100%{box-shadow:0 0 8px ${C.g}55}50%{box-shadow:0 0 20px ${C.g}99}}
  .press{transition:transform .1s;}
  .press:active{transform:scale(.96);}
  .hrow:hover{background:${C.bg4}!important;}
  .hrow{transition:background .1s;}
  .mn{font-family:${F.mono};font-variant-numeric:tabular-nums;}
  .atab{padding:10px 14px;background:transparent;border:none;border-bottom:2px solid transparent;
    color:${C.t2};font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;
    letter-spacing:.2px;transition:.15s;font-family:${F.sans};border-top:1px solid ${C.b0};}
  .atab.on{border-bottom-color:${C.g};color:${C.g};background:${C.g2};}
  .atab:hover:not(.on){color:${C.t0};background:${C.bg3};}
  @media(max-width:640px){
    .hide-mobile{display:none!important;}
    .atab{padding:8px 10px;font-size:11px;}
  }
  @media(min-width:641px){
    .hide-desktop{display:none!important;}
  }
  @media(max-width:640px){
    .stat-grid-4{grid-template-columns:repeat(2,1fr)!important;}
    .stat-grid-3{grid-template-columns:repeat(2,1fr)!important;}
  }
  @media(min-width:641px){
    .stat-grid-4{grid-template-columns:repeat(4,1fr)!important;}
    .stat-grid-3{grid-template-columns:repeat(3,1fr)!important;}
  }
`;

// ─────────────────────────────────────────────────────────────
//  FACE API
// ─────────────────────────────────────────────────────────────
let faceReady = false;
const loadScript = url => new Promise((res,rej)=>{
  if(document.querySelector(`script[src="${url}"]`)){setTimeout(res,200);return;}
  const s=document.createElement("script");s.src=url;s.onload=res;s.onerror=rej;
  document.head.appendChild(s);
});
const initFaceAPI = async (onProg) => {
  if(faceReady) return true;
  try {
    onProg("Memuat library...");
    const local = await fetch("/models/face-api.js",{method:"HEAD"}).then(r=>r.ok).catch(()=>false);
    await loadScript(local?"/models/face-api.js":"https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js");
    const base = local?"/models":"https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights";
    onProg("Model deteksi wajah... (1/3)");
    await window.faceapi.nets.tinyFaceDetector.loadFromUri(base);
    onProg("Model landmark... (2/3)");
    await window.faceapi.nets.faceLandmark68TinyNet.loadFromUri(base);
    onProg("Model rekognisi... (3/3)");
    await window.faceapi.nets.faceRecognitionNet.loadFromUri(base);
    faceReady = true; return true;
  } catch { return false; }
};

// ─────────────────────────────────────────────────────────────
//  PRIMITIVE UI
// ─────────────────────────────────────────────────────────────
function Toast({n}) {
  if(!n) return null;
  const m={ok:[C.g1,C.g,"✓"],err:[C.r1,C.r,"✕"],warn:[C.a1,C.a,"⚠"],info:[C.cy1,C.cy,"ℹ"]};
  const [bg,cl,ic]=m[n.type]||m.ok;
  return <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:9999,
    padding:"11px 18px",borderRadius:12,maxWidth:"min(92vw,360px)",width:"max-content",
    background:bg,border:`1px solid ${cl}44`,color:cl,fontSize:13,fontWeight:600,
    boxShadow:`0 12px 40px rgba(0,0,0,.8)`,animation:"fadeUp .2s ease",
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
      width:full?"100%":undefined,letterSpacing:.2,...s}}>
    {children}
  </button>;
}

function Inp({value,onChange,type="text",placeholder,disabled,mono,onKeyDown,fref,icon,suffix,label,style:s={}}) {
  return <div style={{position:"relative"}}>
    {label&&<div style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{label}</div>}
    <div style={{position:"relative",display:"flex",alignItems:"center"}}>
      {icon&&<span style={{position:"absolute",left:12,zIndex:1,fontSize:15,pointerEvents:"none",color:C.t2}}>{icon}</span>}
      <input ref={fref} type={type} value={value} onChange={onChange} onKeyDown={onKeyDown}
        placeholder={placeholder} disabled={disabled}
        style={{width:"100%",padding:`12px ${suffix?"40px":"13px"} 12px ${icon?"40px":"13px"}`,
          background:C.bg3,border:`1.5px solid ${C.b0}`,borderRadius:10,
          color:disabled?C.t2:C.t0,fontSize:14,fontFamily:mono?F.mono:F.sans,transition:"border-color .15s",...s}}
        onFocus={e=>{if(!disabled)e.target.style.borderColor=C.g+"88";}}
        onBlur={e=>e.target.style.borderColor=C.b0}/>
      {suffix&&<span style={{position:"absolute",right:12,color:C.t2,fontSize:12,pointerEvents:"none",fontFamily:F.mono}}>{suffix}</span>}
    </div>
  </div>;
}

function Card({children,style:s={},onClick,accent,noPad}) {
  return <div onClick={onClick}
    style={{background:C.bg2,borderRadius:14,border:`1px solid ${accent?accent+"33":C.b0}`,
      padding:noPad?0:"14px 16px",boxShadow:`0 4px 20px rgba(0,0,0,.45)`,
      cursor:onClick?"pointer":undefined,...s}}>
    {children}
  </div>;
}

function Divider({my=10}) { return <div style={{height:1,background:C.b0,margin:`${my}px 0`}}/>; }

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
    {b.icon} {b.name}
  </span>;
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
    {online?"Online":"Offline"}
  </div>;
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
  return <thead><tr style={{background:C.bg0}}>
    {cols.map((c,i)=><th key={i} style={{padding:"14px 13px",textAlign:"left",color:C.t3,
      fontWeight:700,fontSize:9.5,textTransform:"uppercase",letterSpacing:1,
      whiteSpace:"nowrap",borderBottom:`1px solid ${C.b0}`}}>{c}</th>)}
  </tr></thead>;
}

// ─────────────────────────────────────────────────────────────
//  HEADER
// ─────────────────────────────────────────────────────────────
function Header({title,biz,user,onLogout,onSwitchBiz,onAbsenPulang,hasCheckedIn,online,onToggleTheme,isDark}) {
  const b = BIZ[biz];
  return <header style={{background:`${C.bg2}ee`,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
    borderBottom:`1px solid ${C.b0}`,padding:"0 12px",height:52,
    display:"flex",alignItems:"center",justifyContent:"space-between",
    position:"sticky",top:0,zIndex:200,flexShrink:0,gap:8}}>
    {/* Left */}
    <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
      <div style={{width:28,height:28,borderRadius:8,flexShrink:0,
        background:"linear-gradient(135deg,#00e5a0,#38bdf8)",
        display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🏬</div>
      <div style={{minWidth:0}}>
        <div className="mn" style={{fontSize:11,fontWeight:700,letterSpacing:2,
          background:"linear-gradient(90deg,#00e5a0,#38bdf8)",
          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1.2}}>
          JE GRUP
        </div>
        <div style={{fontSize:10,color:C.t2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:130}}>
          {b?`${b.icon} ${b.name}`:title}
        </div>
      </div>
    </div>
    {/* Right */}
    <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0,flexWrap:"nowrap"}}>
      <div className="hide-mobile"><OnlineDot online={online}/></div>
      {onSwitchBiz&&user?.access?.length>1&&(
        <button onClick={onSwitchBiz} className="press" style={{padding:"5px 9px",background:C.bg3,
          border:`1px solid ${C.b1}`,borderRadius:8,color:C.t1,fontSize:11,fontWeight:600}}>⇄</button>
      )}
      {onAbsenPulang&&hasCheckedIn&&(
        <button onClick={onAbsenPulang} className="press" style={{padding:"5px 9px",background:C.a1,
          border:`1px solid ${C.a}33`,borderRadius:8,color:C.a,fontSize:11,fontWeight:600}}>🏠 Pulang</button>
      )}
      <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 9px",
        borderRadius:20,background:C.bg3,border:`1px solid ${C.b0}`}}>
        <span style={{fontSize:13}}>{user?.avatar}</span>
        <span style={{fontSize:11,fontWeight:600,maxWidth:70,
          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.name?.split(" ")[0]}</span>
        <div className="hide-mobile"><RoleTag role={user?.role}/></div>
      </div>
      {onToggleTheme&&<button onClick={onToggleTheme} className="press" title={isDark?"Mode Terang":"Mode Gelap"}
        style={{padding:"5px 9px",background:C.bg3,border:`1px solid ${C.b1}`,
          borderRadius:8,color:C.t2,fontSize:13,lineHeight:1}}>
        {isDark?"☀️":"🌙"}
      </button>}
      <button onClick={onLogout} className="press" style={{padding:"5px 9px",background:C.bg3,
        border:`1px solid ${C.b1}`,borderRadius:8,color:C.t2,fontSize:11,fontWeight:600}}>Keluar</button>
    </div>
  </header>;
}

// ─────────────────────────────────────────────────────────────
//  FACE SCAN
// ─────────────────────────────────────────────────────────────
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
    }catch{setPhase("no_camera");setMsg("Izin kamera ditolak. Aktifkan izin di browser.");}
  };

  const startLoop=()=>{
    stableRef.current=0; setStable(0);
    loopRef.current=setInterval(async()=>{
      if(!vidRef.current||!window.faceapi) return;
      const r=await window.faceapi.detectSingleFace(vidRef.current,
        new window.faceapi.TinyFaceDetectorOptions({inputSize:224,scoreThreshold:.5}))
        .withFaceLandmarks(true).withFaceDescriptor();
      draw(r);
      if(!r){stableRef.current=0;setStable(0);return;}
      stableRef.current++; setStable(stableRef.current);
      if(stableRef.current>=4){
        clearInterval(loopRef.current);setPhase("verifying");
        await new Promise(r=>setTimeout(r,800));
        verify(Array.from(r.descriptor));
      }
    },500);
  };

  const draw=(r)=>{
    const v=vidRef.current,c=canRef.current;
    if(!v||!c||!window.faceapi) return;
    c.width=v.videoWidth||480;c.height=v.videoHeight||360;
    const ctx=c.getContext("2d");ctx.clearRect(0,0,c.width,c.height);
    if(r){
      const {x,y,width:w,height:h}=r.detection.box,pad=12,cl=18;
      ctx.strokeStyle=C.g;ctx.lineWidth=2;ctx.shadowColor=C.g;ctx.shadowBlur=8;
      [[x-pad,y-pad,1,1],[x+w+pad,y-pad,-1,1],[x-pad,y+h+pad,1,-1],[x+w+pad,y+h+pad,-1,-1]].forEach(([cx,cy,sx,sy])=>{
        ctx.beginPath();ctx.moveTo(cx+sx*cl,cy);ctx.lineTo(cx,cy);ctx.lineTo(cx,cy+sy*cl);ctx.stroke();
      });
    }
  };

  const verify=(desc)=>{
    if(mode==="register"){onSuccess(desc);return;}
    if(!user.faceDescriptor){setPhase("success");setMsg("Wajah belum terdaftar. Masuk langsung.");setTimeout(()=>{cleanup();onSuccess(null);},1500);return;}
    const dist=euclidean(desc,user.faceDescriptor);
    if(dist<0.52){setPhase("success");setMsg(`✓ Selamat datang, ${user.name}!`);setTimeout(()=>{cleanup();onSuccess(desc);},1500);}
    else{setPhase("fail");setMsg("Wajah tidak dikenali. Coba lagi dengan pencahayaan cukup.");}
  };

  const sc={scanning:C.b,verifying:C.a,success:C.g,fail:C.r,error:C.r,no_camera:C.r}[phase]||C.t2;
  const sl={init:"Mempersiapkan...",loading:msg,scanning:"Mendeteksi wajah...",verifying:"Memverifikasi...",
    success:"✓ Berhasil",fail:"✗ Tidak dikenali",error:"Error memuat model",no_camera:"Kamera tidak tersedia"}[phase];

  return <div style={{position:"fixed",inset:0,zIndex:1000,background:`${C.bg0}f0`,
    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
    padding:16,animation:"fadeIn .2s ease"}}>
    <div style={{width:"100%",maxWidth:420,animation:"fadeUp .3s ease"}}>
      <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:10,padding:"8px 16px",
          borderRadius:24,background:C.bg2,border:`1px solid ${C.b1}`}}>
          <span style={{fontSize:18}}>{user.avatar}</span>
          <div><div style={{fontSize:13,fontWeight:700}}>{user.name}</div><div style={{marginTop:2}}><RoleTag role={user.role}/></div></div>
        </div>
      </div>
      <h2 style={{textAlign:"center",fontSize:17,fontWeight:800,marginBottom:4}}>
        {mode==="register"?"Daftarkan Wajah":"Verifikasi Wajah"}
      </h2>
      <p style={{textAlign:"center",fontSize:12,color:C.t2,marginBottom:14}}>{msg||"Mempersiapkan kamera..."}</p>

      <div style={{position:"relative",borderRadius:18,overflow:"hidden",
        border:`2px solid ${sc}55`,background:"#000",aspectRatio:"4/3",marginBottom:12}}>
        <video ref={vidRef} autoPlay muted playsInline style={{width:"100%",height:"100%",objectFit:"cover",transform:"scaleX(-1)"}}/>
        <canvas ref={canRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",transform:"scaleX(-1)"}}/>
        {phase==="scanning"&&<div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
          <div style={{position:"absolute",left:"8%",right:"8%",height:2,
            background:`linear-gradient(90deg,transparent,${C.g},transparent)`,
            animation:"scanLine 2.5s ease-in-out infinite",boxShadow:`0 0 10px ${C.g}`}}/>
        </div>}
        {(phase==="init"||phase==="loading")&&<div style={{position:"absolute",inset:0,background:"rgba(2,8,24,.9)",
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
          <div style={{width:32,height:32,border:`2.5px solid ${C.bg4}`,borderTopColor:C.g,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
          <p style={{fontSize:12,color:C.t1,textAlign:"center",padding:"0 20px"}}>{msg}</p>
        </div>}
        {phase==="verifying"&&<div style={{position:"absolute",inset:0,background:"rgba(2,8,24,.75)",
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}>
          <div style={{width:40,height:40,border:`2.5px solid ${C.a}44`,borderTopColor:C.a,borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
          <p style={{fontSize:13,color:C.a,fontWeight:700}}>Memverifikasi...</p>
        </div>}
        {phase==="success"&&<div style={{position:"absolute",inset:0,background:`${C.g}08`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:52}}>✅</span></div>}
        {(phase==="fail"||phase==="error"||phase==="no_camera")&&<div style={{position:"absolute",inset:0,background:`${C.r}06`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:52}}>❌</span></div>}
      </div>

      {phase==="scanning"&&<div style={{height:3,background:C.bg4,borderRadius:2,marginBottom:10,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${Math.min(stable/4*100,100)}%`,
          background:`linear-gradient(90deg,${C.b},${C.g})`,borderRadius:2,transition:"width .4s ease"}}/>
      </div>}

      <div style={{padding:"9px 12px",borderRadius:10,background:C.bg3,border:`1px solid ${sc}22`,
        display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <span style={{width:7,height:7,borderRadius:"50%",background:sc,flexShrink:0,
          animation:phase==="scanning"?"pulse 1.5s ease infinite":undefined}}/>
        <span style={{fontSize:12,color:sc,fontWeight:600}}>{sl}</span>
      </div>

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

  const IS={width:"100%",padding:"14px 13px",background:C.bg3,border:`1.5px solid ${C.b0}`,
    borderRadius:10,color:C.t0,fontSize:13,fontFamily:F.mono,transition:"border-color .15s"};

  const connect=async()=>{
    if(!form.apiKey||!form.projectId){setErr("API Key dan Project ID wajib diisi.");return;}
    setLoading(true);setErr("");
    const r=await initFirebase(form);
    if(!r.ok){setErr("Koneksi gagal: "+r.error);setLoading(false);return;}
    const seeded=await isSeeded().catch(()=>false);
    if(!seeded) await seedDatabase(SEED_USERS,SEED_PRODUCTS);
    setLoading(false);onDone();
  };

  return <div style={{fontFamily:F.sans,background:C.bg1,color:C.t0,minHeight:"100vh",
    display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <style>{CSS}</style>
    {/* Ambient BG */}
    <div style={{position:"fixed",inset:0,pointerEvents:"none",overflow:"hidden"}}>
      <div style={{position:"absolute",top:"-15%",right:"-10%",width:"50%",paddingBottom:"50%",borderRadius:"50%",background:`radial-gradient(circle,${C.g}07,transparent 70%)`}}/>
      <div style={{position:"absolute",bottom:"-10%",left:"-5%",width:"45%",paddingBottom:"45%",borderRadius:"50%",background:`radial-gradient(circle,${C.b}05,transparent 70%)`}}/>
      <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(${C.b0} 1px,transparent 1px),linear-gradient(90deg,${C.b0} 1px,transparent 1px)`,backgroundSize:"48px 48px",opacity:.35}}/>
    </div>

    <div style={{position:"relative",width:"100%",maxWidth:500,animation:"fadeUp .4s ease"}}>
      {/* Brand */}
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{display:"inline-flex",width:68,height:68,borderRadius:22,marginBottom:14,
          background:`linear-gradient(135deg,${C.g}20,${C.b}18)`,border:`1.5px solid ${C.g}30`,
          alignItems:"center",justifyContent:"center",fontSize:32}}>🏬</div>
        <h1 className="mn" style={{fontSize:22,fontWeight:700,letterSpacing:3,
          background:`linear-gradient(90deg,${C.g},${C.b})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:10}}>
          KASIR JE GRUP
        </h1>
        <div style={{display:"flex",justifyContent:"center",gap:7,flexWrap:"wrap"}}>
          {Object.values(BIZ).map(b=><span key={b.id} style={{fontSize:11,padding:"3px 11px",borderRadius:20,fontWeight:600,
            background:b.id==="JS_CLOTHING"?C.b1:C.p1,color:b.id==="JS_CLOTHING"?C.b:C.p,
            border:`1px solid ${(b.id==="JS_CLOTHING"?C.b:C.p)}22`}}>{b.icon} {b.name}</span>)}
        </div>
      </div>

      <Card style={{padding:step===1?"22px":"18px 22px"}}>
        {step===1 ? <>
          <h2 style={{fontSize:14,fontWeight:800,marginBottom:4,color:C.g}}>🔥 Hubungkan Firebase</h2>
          <p style={{fontSize:12.5,color:C.t2,marginBottom:18,lineHeight:1.7}}>Database cloud untuk sinkronisasi real-time antar perangkat.</p>
          {[
            {n:1,t:"Buka Firebase Console",d:"console.firebase.google.com → Add project → nama: kasir-je-grup"},
            {n:2,t:"Daftarkan Web App",d:"Project → klik ikon </> → nickname: Kasir → Register app"},
            {n:3,t:"Salin firebaseConfig",d:"Salin semua isi objek firebaseConfig yang tampil"},
            {n:4,t:"Aktifkan Firestore",d:"Build → Firestore Database → Create database → test mode → region: asia-southeast1"},
            {n:5,t:"Paste config di sini",d:"Klik tombol di bawah dan isi form"},
          ].map(s=><div key={s.n} style={{display:"flex",gap:10,marginBottom:10,alignItems:"flex-start"}}>
            <div style={{minWidth:22,height:22,borderRadius:"50%",background:C.g1,border:`1px solid ${C.g}44`,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:C.g,flexShrink:0}}>{s.n}</div>
            <div><div style={{fontSize:12.5,fontWeight:600}}>{s.t}</div><div style={{fontSize:11.5,color:C.t2,marginTop:2,lineHeight:1.6}}>{s.d}</div></div>
          </div>)}
          <div style={{marginTop:14,padding:"10px 12px",background:C.g2,borderRadius:8,border:`1px solid ${C.g}22`,fontSize:11.5,color:C.g,marginBottom:16}}>
            💡 Gratis selamanya — 50K baca & 20K tulis per hari (Spark plan)
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={()=>setStep(2)} full>Masukkan Config →</Btn>
            <Btn onClick={()=>window.open("https://console.firebase.google.com","_blank")} outline>Buka ↗</Btn>
          </div>
        </> : <>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <button onClick={()=>setStep(1)} style={{background:"transparent",border:"none",color:C.t2,fontSize:20,lineHeight:1}}>←</button>
            <h2 style={{fontSize:14,fontWeight:800}}>Firebase Config</h2>
          </div>
          <div style={{background:C.bg3,borderRadius:8,padding:"10px 12px",marginBottom:16,
            fontSize:11,fontFamily:F.mono,color:C.t2,lineHeight:1.9,border:`1px solid ${C.b0}`}}>
            <span style={{color:C.t1}}>const firebaseConfig = {"{"}</span><br/>
            &nbsp;&nbsp;<span style={{color:C.cy}}>apiKey</span>: <span style={{color:C.a}}>"AIzaSy..."</span>,<br/>
            &nbsp;&nbsp;<span style={{color:C.cy}}>projectId</span>: <span style={{color:C.a}}>"kasir-je-grup"</span>,<br/>
            &nbsp;&nbsp;<span style={{color:C.t3}}>...dll</span><br/>
            <span style={{color:C.t1}}>{"}"}</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[{k:"apiKey",l:"API Key *"},{k:"authDomain",l:"Auth Domain"},{k:"projectId",l:"Project ID *"},
              {k:"storageBucket",l:"Storage Bucket"},{k:"messagingSenderId",l:"Sender ID"},{k:"appId",l:"App ID"}].map(f=>(
              <div key={f.k}>
                <div style={{fontSize:9.5,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{f.l}</div>
                <input value={form[f.k]} onChange={e=>setForm(x=>({...x,[f.k]:e.target.value}))} style={IS}
                  onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.b0}/>
              </div>
            ))}
          </div>
          {err&&<div style={{marginTop:10,padding:"15px 14px",background:C.r1,borderRadius:8,border:`1px solid ${C.r}33`,fontSize:12,color:C.r}}>⚠ {err}</div>}
          <div style={{marginTop:16}}>
            <Btn onClick={connect} disabled={loading} full size="lg">{loading?"⏳ Menghubungkan...":"🔥 Hubungkan Firebase"}</Btn>
          </div>
        </>}
      </Card>
    </div>
  </div>;
}

// ─────────────────────────────────────────────────────────────
//  APPSCRIPT SETUP GUIDE (for Google Sheets)
// ─────────────────────────────────────────────────────────────
const APPSCRIPT_CODE = `
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = {
    users: getOrCreate(ss,"Pengguna"),
    products: getOrCreate(ss,"Barang"),
    transactions: getOrCreate(ss,"Transaksi"),
    stocklogs: getOrCreate(ss,"LogStok"),
    attendance: getOrCreate(ss,"Absensi")
  };
  if(data.users) syncSheet(sheets.users, data.users,
    ["ID","Username","Nama","Role","Akses","Avatar","Aktif"]);
  if(data.products) syncSheet(sheets.products, data.products,
    ["ID","Barcode","Nama","Kategori","HPP","Harga Jual","Stok","Bisnis"]);
  if(data.transactions) syncSheet(sheets.transactions, data.transactions,
    ["ID","Tanggal","Kasir","Bisnis","Total","HPP","Laba","Items"]);
  if(data.stocklogs) syncSheet(sheets.stocklogs, data.stocklogs,
    ["ID","Tanggal","Barcode","Produk","Bisnis","Tipe","Qty","Sebelum","Sesudah","Oleh"]);
  if(data.attendance) syncSheet(sheets.attendance, data.attendance,
    ["ID","Tanggal","Username","Nama","Role","Bisnis","Jam Masuk","Jam Pulang"]);
  return ContentService.createTextOutput(JSON.stringify({ok:true}))
    .setMimeType(ContentService.MimeType.JSON);
}
function getOrCreate(ss,name){
  return ss.getSheetByName(name) || ss.insertSheet(name);
}
function syncSheet(sh,rows,headers){
  sh.clearContents();
  sh.appendRow(headers);
  rows.forEach(r=>sh.appendRow(Object.values(r)));
}
`;

// ─────────────────────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────────────────────
export default function App() {
  // ─── Firebase ───
  const [fbReady,  setFbReady]  = useState(false);
  const [fbSetup,  setFbSetup]  = useState(false);
  const [fbLoad,   setFbLoad]   = useState(true);

  // ─── Theme ───
  const [isDark, setIsDark] = useState(() => localStorage.getItem("je_theme") !== "light");
  const toggleTheme = () => {
    const next = !isDark;
    Object.assign(C, next ? DARK_C : LIGHT_C);
    CSS = makeCSS();
    localStorage.setItem("je_theme", next ? "dark" : "light");
    setIsDark(next);
  };

  // ─── Online ───
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(()=>{
    const on=()=>setOnline(true),off=()=>setOnline(false);
    window.addEventListener("online",on);window.addEventListener("offline",off);
    return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off);};
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
  const [users,  setUsers]  = useState([]);
  const [prods,  setProds]  = useState([]);
  const [trxs,   setTrxs]   = useState([]);
  const [slogs,  setSlogs]  = useState([]);
  const [attend, setAttend] = useState([]);

  useEffect(()=>{
    if(!fbReady) return;
    const uns=[
      subscribeUsers(d=>setUsers(d.map(u=>({...u,faceDescriptor:u.faceDescriptor?new Float32Array(u.faceDescriptor):null})))),
      subscribeProducts(d=>setProds(d)),
      subscribeTransactions(d=>setTrxs(d)),
      subscribeStockLogs(d=>setSlogs(d)),
      subscribeAttendance(d=>setAttend(d)),
    ];
    return()=>uns.forEach(u=>u());
  },[fbReady]);

  // ─── Toast ───
  const [notif, setNotif] = useState(null);
  const nRef=useRef(null);
  const toast=useCallback((msg,type="ok")=>{
    if(nRef.current) clearTimeout(nRef.current);
    setNotif({msg,type}); nRef.current=setTimeout(()=>setNotif(null),3000);
  },[]);

  // ─── Screen & Auth ───
  const [screen,  setScreen]  = useState("login");
  const [user,    setUser]    = useState(null);
  const [biz,     setBiz]     = useState(null);
  const [pending, setPending] = useState(null);
  const [faceReg, setFaceReg] = useState(null);

  // ─── Remember Me ───
  const [rememberMe, setRememberMe] = useState(false);
  const [lf, setLf] = useState(()=>{
    try{
      const saved=JSON.parse(localStorage.getItem("je_remember")||"null");
      if(saved){return {u:saved.u||"",p:saved.p||""};}
    }catch{}
    return {u:"",p:""};
  });
  const [lerr, setLerr] = useState("");

  // check if remember was set before
  useEffect(()=>{
    const saved=localStorage.getItem("je_remember");
    if(saved) setRememberMe(true);
  },[]);

  // ─── Attendance helpers ───
  const todayAtt = (uid,b) => attend.find(a=>a.userId===uid&&a.date===todayDate()&&a.business===(b||biz));
  const hasCheckedIn = user ? !!todayAtt(user.id,biz)&&!todayAtt(user.id,biz)?.checkOut : false;

  const doCheckIn=async(u,b)=>{
    // Don't double check-in
    const existing=attend.find(a=>a.userId===u.id&&a.date===todayDate()&&a.business===b);
    if(existing) return;
    const isoNow = new Date().toISOString();
    const rec={id:"ATT-"+uid(),userId:u.id,username:u.username,name:u.name,
      role:u.role,business:b,date:todayDate(),dateISO:todayISO8601(),
      checkIn:nowStr(),checkInISO:isoNow,checkOut:null,checkOutISO:null};
    await fbCheckIn(rec).catch(()=>{});
    toast(`🕐 Absen masuk tercatat — ${u.name}`,"info");
  };

  const doCheckOut=async()=>{
    const rec=todayAtt(user?.id,biz);
    if(!rec) return;
    await fbCheckOut(rec.id,nowStr()).catch(()=>{});
    toast("✅ Absen pulang tercatat!");
  };

  // ─── Login ───
  const doLogin=()=>{
    const u=users.find(x=>x.username===lf.u&&x.password===lf.p&&x.active);
    if(!u){setLerr("Username/password salah atau akun nonaktif.");return;}
    setLerr("");
    if(rememberMe) localStorage.setItem("je_remember",JSON.stringify({u:lf.u,p:lf.p}));
    else localStorage.removeItem("je_remember");

    if(u.role==="admin"){
      setUser(u);setBiz(u.access[0]);setAdminTab("dashboard");setScreen("admin");
    } else {
      setPending(u);setScreen("facescan");
    }
  };

  const afterFace=async(u)=>{
    setUser(u);setPending(null);
    if(u.access.length===1){
      const b=u.access[0];setBiz(b);
      await doCheckIn(u,b);
      setScreen(u.role==="kasir"?"kasir":"stok");
    } else setScreen("bizselect");
  };

  const doLogout=()=>{
    setUser(null);setBiz(null);setScreen("login");
    setCart([]);setScanIn("");setStokTarget(null);
  };
  const handlePulang=async()=>{await doCheckOut();setTimeout(doLogout,1500);};

  // ─── Kasir state ───
  const [cart,    setCart]    = useState([]);
  const [scanIn,  setScanIn]  = useState("");
  const [receipt, setReceipt] = useState(null);
  const scanRef=useRef(null);
  useEffect(()=>{if(screen==="kasir"&&!receipt)setTimeout(()=>scanRef.current?.focus(),100);},[screen,receipt]);

  // ─── Stok state ───
  const [stokScan,  setStokScan]  = useState("");
  const [stokQ,     setStokQ]     = useState("");
  const [stokPrice, setStokPrice] = useState("");
  const [stokTarget,setStokTarget]= useState(null);
  const [stokSearch,setStokSearch]= useState("");
  const stokScanRef=useRef(null),stokQRef=useRef(null);
  useEffect(()=>{if(screen==="stok")setTimeout(()=>stokScanRef.current?.focus(),100);},[screen]);
  useEffect(()=>{if(stokTarget)setTimeout(()=>stokQRef.current?.focus(),100);},[stokTarget]);

  // ─── Admin state ───
  const [adminTab, setAdminTab] = useState("dashboard");
  const [adminScanQ, setAdminScanQ] = useState("");
  const adminScanRef = useRef(null);
  const [adminBiz, setAdminBiz] = useState("JS_CLOTHING");
  const [searchQ,  setSearchQ]  = useState("");
  const [reportBiz,setReportBiz]= useState("ALL");
  const [reportRange,setReportRange]=useState("all");
  const [attFilter,setAttFilter]=useState({userId:"ALL",month:new Date().toISOString().slice(0,7)});
  const [gsUrl,    setGsUrl]    = useState(()=>localStorage.getItem("je_gs_url")||"");
  const [gsLoad,   setGsLoad]   = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [uModal,   setUModal]   = useState(false);
  const [uForm,    setUForm]    = useState({});
  const [editUid,  setEditUid]  = useState(null);
  const [pModal,   setPModal]   = useState(false);
  const [pForm,    setPForm]    = useState({});
  const [editPid,  setEditPid]  = useState(null);

  // ─── Kasir functions ───
  const bizProds=(b=biz)=>prods.filter(p=>p.business===b);

  const kasirScan=useCallback(async(bc)=>{
    bc=bc.trim();if(!bc) return;
    const p=prods.find(x=>x.barcode===bc&&x.business===biz);
    if(!p){toast("Barcode tidak ditemukan: "+bc,"err");setScanIn("");return;}
    if(p.stock===0){toast("Stok "+p.name+" habis!","warn");setScanIn("");return;}
    setCart(prev=>{
      const ex=prev.find(c=>c.barcode===bc);
      if(ex){if(ex.qty>=p.stock){toast("Stok tidak cukup","warn");return prev;}
             return prev.map(c=>c.barcode===bc?{...c,qty:c.qty+1}:c);}
      return [...prev,{id:p.id,barcode:p.barcode,name:p.name,price:p.price,hpp:p.hpp||0,stock:p.stock,qty:1}];
    });
    toast("✓ "+p.name);setScanIn("");scanRef.current?.focus();
  },[prods,biz,toast]);

  const doCheckout=useCallback(async()=>{
    if(!cart.length) return;
    const total=cart.reduce((s,c)=>s+c.price*c.qty,0);
    const totalHpp=cart.reduce((s,c)=>s+(c.hpp||0)*c.qty,0);
    const trx={id:"TRX-"+uid().toUpperCase(),date:nowStr(),kasir:user.name,business:biz,
      items:[...cart],total,totalHpp,profit:total-totalHpp};
    const stockUpdates=cart.map(c=>({productId:c.id,newStock:c.stock-c.qty}));
    const logs=cart.map(c=>({id:"LOG-"+uid(),date:nowStr(),barcode:c.barcode,name:c.name,
      type:"keluar",qty:c.qty,before:c.stock,after:c.stock-c.qty,by:user.name,business:biz}));
    try{await fbAddTransaction(trx,stockUpdates,logs);setCart([]);setReceipt(trx);toast("✅ Transaksi berhasil! "+rp(total));}
    catch(e){toast("Gagal: "+e.message,"err");}
  },[cart,user,biz,toast]);

  // ─── Stok functions ───
  const stokScanFn=useCallback((bc)=>{
    bc=bc.trim();if(!bc) return;
    const p=prods.find(x=>x.barcode===bc&&x.business===biz);
    if(!p){toast("Barcode tidak ditemukan","err");setStokScan("");return;}
    setStokTarget(p);setStokQ("");setStokPrice("");setStokScan("");
  },[prods,biz,toast]);

  const doAddStock=useCallback(async()=>{
    const q=parseInt(stokQ);
    if(!stokTarget||!q||q<=0){toast("Masukkan jumlah valid","warn");return;}
    const ns=stokTarget.stock+q;
    const log={id:"LOG-"+uid(),date:nowStr(),barcode:stokTarget.barcode,name:stokTarget.name,
      type:"masuk",qty:q,before:stokTarget.stock,after:ns,by:user.name,business:biz};
    try{
      const np=stokPrice&&+stokPrice>0?+stokPrice:undefined;
      await fbUpdateStock(stokTarget.id,ns,np,log);
      toast(`✓ Stok ${stokTarget.name}: ${stokTarget.stock} → ${ns}`);
    }catch(e){toast("Gagal: "+e.message,"err");}
    setStokTarget(null);setStokQ("");setStokPrice("");stokScanRef.current?.focus();
  },[stokTarget,stokQ,stokPrice,user,biz,toast]);

  // ─── Face reg ───
  const handleFaceReg=async(desc)=>{
    if(!faceReg) return;
    const u=users.find(x=>x.id===faceReg);if(!u) return;
    await fbUpdateUser(u.id,{...u,faceDescriptor:Array.from(desc)});
    setFaceReg(null);toast("✅ Data wajah terdaftar!");
  };

  // ─── Admin: User CRUD ───
  const openAddU=()=>{setUForm({username:"",password:"",name:"",role:"kasir",access:[],avatar:"🧑",active:true});setEditUid(null);setUModal(true);};
  const openEditU=u=>{setUForm({...u,access:[...u.access]});setEditUid(u.id);setUModal(true);};
  const saveUser=async()=>{
    if(!uForm.username||!uForm.password||!uForm.name){toast("Username, password & nama wajib diisi","warn");return;}
    if(!uForm.access?.length){toast("Pilih minimal 1 akses bisnis","warn");return;}
    try{
      if(editUid===null){
        if(users.find(u=>u.username===uForm.username)){toast("Username sudah dipakai!","err");return;}
        await fbAddUser({...uForm,id:NEXT_ID++,faceDescriptor:null});toast("✓ Pengguna ditambahkan");
      }else{await fbUpdateUser(editUid,{...uForm,id:editUid});toast("✓ Pengguna diperbarui");}
      setUModal(false);
    }catch(e){toast("Error: "+e.message,"err");}
  };
  const delUser=async(id)=>{
    if(id===user.id){toast("Tidak bisa hapus akun sendiri","err");return;}
    await fbDeleteUser(id).catch(()=>{});toast("Pengguna dihapus");
  };

  // ─── Admin: Product CRUD ───
  const openAddP=()=>{setPForm({barcode:"",name:"",price:"",hpp:"",stock:"",category:"",business:adminBiz});setEditPid(null);setPModal(true);};
  const openEditP=p=>{setPForm({...p,price:String(p.price),hpp:String(p.hpp||0),stock:String(p.stock)});setEditPid(p.id);setPModal(true);};
  const saveProd=async()=>{
    if(!pForm.barcode||!pForm.name||!pForm.price||pForm.stock===""){toast("Barcode, nama, harga & stok wajib","warn");return;}
    try{
      if(editPid===null){
        if(prods.find(p=>p.barcode===pForm.barcode)){toast("Barcode sudah ada!","err");return;}
        await fbAddProduct({...pForm,id:NEXT_ID++,price:+pForm.price,hpp:+pForm.hpp||0,stock:+pForm.stock});
        toast("✓ Produk ditambahkan");
      }else{await fbUpdateProduct(editPid,{...pForm,id:editPid,price:+pForm.price,hpp:+pForm.hpp||0,stock:+pForm.stock});toast("✓ Produk diperbarui");}
      setPModal(false);
    }catch(e){toast("Error: "+e.message,"err");}
  };

  // ─── Reports computation ───
  const parseD = str => { try{ return new Date(str.replace(/(\d+)\/(\d+)\/(\d+),/,"$3-$2-$1 ")); }catch{ return null; } };

  const getDateFilter=(trxs)=>{
    const now=new Date();
    return trxs.filter(t=>{
      const d=parseD(t.date); if(!d) return true;
      if(reportRange==="today") return d.toDateString()===now.toDateString();
      if(reportRange==="week"){const w=new Date(now);w.setDate(w.getDate()-7);return d>=w;}
      if(reportRange==="month") return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
      if(reportRange==="custom"){
        const from=lapFrom?new Date(lapFrom):null;
        const to=lapTo?new Date(lapTo+"T23:59:59"):null;
        if(from&&d<from) return false;
        if(to&&d>to) return false;
        return true;
      }
      return true; // "all"
    });
  };
  const filtTrx=getDateFilter(trxs.filter(t=>reportBiz==="ALL"||t.business===reportBiz));
  const totalRev=filtTrx.reduce((s,t)=>s+t.total,0);
  const totalHppAll=filtTrx.reduce((s,t)=>s+(t.totalHpp||0),0);
  const grossProfit=totalRev-totalHppAll;
  const margin=totalRev>0?((grossProfit/totalRev)*100).toFixed(1)+"%":"0%";

  // Daily chart
  const dailyMap={};
  filtTrx.forEach(t=>{
    try{
      const d=new Date(t.date.replace(/(\d+)\/(\d+)\/(\d+),/,"$3-$2-$1 "));
      const key=d.toLocaleDateString("id-ID",{day:"2-digit",month:"2-digit"});
      if(!dailyMap[key])dailyMap[key]={date:key,rev:0,profit:0,trxCount:0};
      dailyMap[key].rev+=t.total;dailyMap[key].profit+=(t.profit||0);dailyMap[key].trxCount++;
    }catch{}
  });
  const dailyData=Object.values(dailyMap).slice(-20);

  // Per-product
  const prodPerf=(()=>{
    const m={};
    filtTrx.forEach(t=>t.items?.forEach(item=>{
      if(!m[item.barcode])m[item.barcode]={name:item.name,barcode:item.barcode,qty:0,rev:0,hpp:0};
      m[item.barcode].qty+=item.qty;m[item.barcode].rev+=item.price*item.qty;m[item.barcode].hpp+=(item.hpp||0)*item.qty;
    }));
    return Object.values(m).sort((a,b)=>b.rev-a.rev);
  })();

  // Per-bisnis pie
  const bizRevData=[
    {name:"JS Clothing",value:filtTrx.filter(t=>t.business==="JS_CLOTHING").reduce((s,t)=>s+t.total,0),color:C.b},
    {name:"JB Store",value:filtTrx.filter(t=>t.business==="JB_STORE").reduce((s,t)=>s+t.total,0),color:C.p},
  ].filter(d=>d.value>0);

  // ─── Attendance report per pegawai ───
  const [selUser,setSelUser]=useState("ALL");

  // ─── Log stok filter ───
  const [slogRange,setSlogRange]=useState("all");
  const [slogBiz,setSlogBiz]=useState("ALL");
  const [slogFrom,setSlogFrom]=useState("");
  const [slogTo,setSlogTo]=useState("");
  const [slogType,setSlogType]=useState("ALL");

  // ─── Absensi range ───
  const [attRange,setAttRange]=useState("month");
  const [attFrom,setAttFrom]=useState("");
  const [attTo,setAttTo]=useState("");

  // ─── Laporan custom range ───
  const [lapFrom,setLapFrom]=useState("");
  const [lapTo,setLapTo]=useState("");
  const attFiltered=(()=>{
    const now2=new Date();
    return attend.filter(a=>{
      const matchUser=selUser==="ALL"||String(a.userId)===String(selUser);
      const isoSrc=a.checkInISO||a.dateISO||"";
      const aDate=isoSrc?new Date(isoSrc):null;
      let matchRange=true;
      if(attRange==="today") matchRange=aDate?aDate.toDateString()===now2.toDateString():false;
      else if(attRange==="week"){const w=new Date(now2);w.setDate(w.getDate()-7);matchRange=aDate?aDate>=w:false;}
      else if(attRange==="month"){
        matchRange=aDate?aDate.getFullYear()===now2.getFullYear()&&aDate.getMonth()===now2.getMonth():false;
      } else if(attRange==="custom"){
        const from=attFrom?new Date(attFrom):null;
        const to=attTo?new Date(attTo+"T23:59:59"):null;
        if(from&&aDate&&aDate<from) matchRange=false;
        else if(to&&aDate&&aDate>to) matchRange=false;
      }
      // "all" => matchRange stays true
      return matchUser&&matchRange;
    });
  })();

  // Summary per user for selected month
  // attByUser now derived from attFiltered — same filter for both tables
  const attByUser={};
  attFiltered.forEach(a=>{
    const key=a.userId;
    if(!attByUser[key])attByUser[key]={userId:a.userId,name:a.name,role:a.role,days:0,totalMinutes:0,records:[]};
    attByUser[key].days++;
    attByUser[key].records.push(a);
    const ci2=a.checkInISO||a.checkIn, co2=a.checkOutISO||a.checkOut;
    if(ci2&&co2){
      try{attByUser[key].totalMinutes+=Math.floor((new Date(co2)-new Date(ci2))/60000);}catch{}
    }
  });

  const calcDur=(a)=>{
    const ci=a.checkInISO||a.checkIn, co=a.checkOutISO||a.checkOut;
    if(!ci||!co) return "-";
    try{const ms=new Date(co)-new Date(ci);const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000);return h>0?`${h}j ${m}m`:`${m}m`;}
    catch{return "-";}
  };

  // ─────────────────────────────────
  //  RENDER: Loading
  // ─────────────────────────────────
  // Sync CSS on render
  CSS = makeCSS();

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

  // ─────────────────────────────────
  //  Face scan
  // ─────────────────────────────────
  if(screen==="facescan"&&pending) return <div style={{fontFamily:F.sans,color:C.t0,height:"100vh",background:C.bg1}}>
    <style>{CSS}</style><Toast n={notif}/>
    <FaceScan user={pending} mode="verify" onSuccess={()=>afterFace(pending)} onCancel={()=>{setPending(null);setScreen("login");}}/>
  </div>;

  if(faceReg) return <div style={{fontFamily:F.sans,color:C.t0,height:"100vh",background:C.bg1}}>
    <style>{CSS}</style><Toast n={notif}/>
    <FaceScan user={users.find(u=>u.id===faceReg)} mode="register" onSuccess={handleFaceReg} onCancel={()=>setFaceReg(null)}/>
  </div>;

  // ─────────────────────────────────
  //  LOGIN
  // ─────────────────────────────────
  if(screen==="login") return <div style={{fontFamily:F.sans,background:C.bg1,color:C.t0,minHeight:"100vh",
    display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <style>{CSS}</style><Toast n={notif}/>
    {/* Ambient */}
    <div style={{position:"fixed",inset:0,pointerEvents:"none",overflow:"hidden"}}>
      <div style={{position:"absolute",top:"-15%",right:"-10%",width:"50%",paddingBottom:"50%",borderRadius:"50%",background:`radial-gradient(circle,${C.g}07,transparent 70%)`}}/>
      <div style={{position:"absolute",bottom:"-10%",left:"-5%",width:"45%",paddingBottom:"45%",borderRadius:"50%",background:`radial-gradient(circle,${C.b}05,transparent 70%)`}}/>
      <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(${C.b0} 1px,transparent 1px),linear-gradient(90deg,${C.b0} 1px,transparent 1px)`,backgroundSize:"48px 48px",opacity:.35}}/>
    </div>

    <div style={{position:"relative",width:"100%",maxWidth:380,animation:"fadeUp .4s ease"}}>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{display:"inline-flex",width:68,height:68,borderRadius:22,
          background:`linear-gradient(135deg,${C.g}20,${C.b}18)`,border:`1.5px solid ${C.g}30`,
          alignItems:"center",justifyContent:"center",fontSize:32,marginBottom:14}}>🏬</div>
        <h1 className="mn" style={{fontSize:22,fontWeight:700,letterSpacing:3,
          background:`linear-gradient(90deg,${C.g} 0%,${C.b} 55%,${C.p} 100%)`,
          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:12}}>
          KASIR JE GRUP
        </h1>
        <div style={{display:"flex",justifyContent:"center",gap:7,flexWrap:"wrap",marginBottom:8}}>
          {Object.values(BIZ).map(b=><span key={b.id} style={{fontSize:11,padding:"3px 11px",borderRadius:20,fontWeight:600,
            background:b.id==="JS_CLOTHING"?C.b1:C.p1,color:b.id==="JS_CLOTHING"?C.b:C.p,
            border:`1px solid ${(b.id==="JS_CLOTHING"?C.b:C.p)}22`}}>{b.icon} {b.name}</span>)}
        </div>
        <OnlineDot online={online}/>
      </div>

      <Card style={{padding:"24px 20px"}}>
        <h2 style={{fontSize:15,fontWeight:800,marginBottom:4}}>Masuk ke Sistem</h2>
        <p style={{fontSize:12,color:C.t2,marginBottom:18,lineHeight:1.6}}>Pegawai kasir/stok akan diverifikasi wajah & otomatis absen masuk.</p>

        <div style={{marginBottom:12}}>
          <Inp value={lf.u} onChange={e=>setLf(x=>({...x,u:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doLogin()}
            placeholder="Username" icon="👤" label="Username" mono/>
        </div>
        <div style={{marginBottom:14}}>
          <Inp value={lf.p} onChange={e=>setLf(x=>({...x,p:e.target.value}))} type="password"
            onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="••••••••" icon="🔒" label="Password"/>
        </div>

        {/* Remember Me */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <div onClick={()=>setRememberMe(x=>!x)} style={{width:40,height:22,borderRadius:11,cursor:"pointer",
            background:rememberMe?C.g:C.bg4,border:`1.5px solid ${rememberMe?C.g:C.b1}`,
            position:"relative",transition:"background .2s,border-color .2s",flexShrink:0}}>
            <div style={{position:"absolute",top:2,left:rememberMe?20:2,width:14,height:14,
              borderRadius:"50%",background:rememberMe?"#000":C.t2,transition:"left .2s"}}/>
          </div>
          <label onClick={()=>setRememberMe(x=>!x)} style={{fontSize:12.5,color:C.t1,cursor:"pointer",userSelect:"none"}}>
            Ingat login saya
          </label>
        </div>

        {lerr&&<div style={{padding:"9px 12px",background:C.r1,borderRadius:8,border:`1px solid ${C.r}33`,
          fontSize:12,color:C.r,marginBottom:14,display:"flex",gap:6}}>⚠ {lerr}</div>}

        <button onClick={doLogin} className="press" style={{width:"100%",padding:"14px",
          background:`linear-gradient(90deg,${C.g},${C.b})`,border:"none",borderRadius:12,
          color:C.bg1,fontSize:14,fontWeight:800,boxShadow:`0 4px 20px ${C.g}30`}}>
          MASUK SEKARANG →
        </button>

        <Divider my={16}/>
        <div style={{padding:"10px 12px",background:C.bg3,borderRadius:8,border:`1px solid ${C.b0}`,
          fontSize:11.5,color:C.t2,lineHeight:1.9}}>
          <span style={{color:C.vi,fontWeight:700}}>👑 Admin</span> — masuk langsung tanpa scan wajah<br/>
          <span style={{color:C.cy,fontWeight:700}}>🧑 Kasir/Stok</span> — verifikasi wajah + absen otomatis
        </div>
      </Card>

      <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:10}}>
        <button onClick={()=>{clearConfig();setFbReady(false);setFbSetup(true);}}
          style={{background:"transparent",border:"none",color:C.t3,cursor:"pointer",fontSize:11,textDecoration:"underline"}}>
          Ganti Firebase Project
        </button>
        <button onClick={toggleTheme} className="press"
          style={{background:C.bg2,border:`1px solid ${C.b1}`,borderRadius:20,
            padding:"4px 14px",color:C.t1,fontSize:12,fontWeight:600}}>
          {isDark?"☀️ Mode Terang":"🌙 Mode Gelap"}
        </button>
      </div>
    </div>
  </div>;

  // ─────────────────────────────────
  //  BIZ SELECT
  // ─────────────────────────────────
  if(screen==="bizselect") return <div style={{fontFamily:F.sans,background:C.bg1,color:C.t0,minHeight:"100vh",
    display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
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
          return <button key={bizId} className="press" onClick={async()=>{setBiz(bizId);await doCheckIn(user,bizId);setScreen(user.role==="kasir"?"kasir":"stok");}}
            style={{padding:"18px",background:C.bg2,border:`1.5px solid ${C.b0}`,borderRadius:16,
              cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:14}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=b.color+"55"}
            onMouseLeave={e=>e.currentTarget.style.borderColor=C.b0}>
            <div style={{width:52,height:52,borderRadius:14,flexShrink:0,
              background:isJ?C.b1:C.p1,border:`2px solid ${b.color}33`,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{b.icon}</div>
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
      <button onClick={doLogout} style={{width:"100%",marginTop:12,padding:"11px",background:"transparent",
        border:`1px solid ${C.b0}`,borderRadius:10,color:C.t2,cursor:"pointer",fontSize:12,fontFamily:F.sans}}>
        ← Kembali
      </button>
    </div>
  </div>;

  // ─────────────────────────────────
  //  KASIR
  // ─────────────────────────────────
  if(screen==="kasir") {
    const total=cart.reduce((s,c)=>s+c.price*c.qty,0);
    const totalHpp=cart.reduce((s,c)=>s+(c.hpp||0)*c.qty,0);
    const bc=biz==="JS_CLOTHING"?C.b:C.p;

    return <div style={{fontFamily:F.sans,background:C.bg1,color:C.t0,height:"100vh",display:"flex",flexDirection:"column"}}>
      <style>{CSS}</style><Toast n={notif}/>
      <Header biz={biz} user={user} online={online} onLogout={doLogout}
        onSwitchBiz={user?.access?.length>1?()=>{setCart([]);setScreen("bizselect");}:null}
        onAbsenPulang={handlePulang} hasCheckedIn={hasCheckedIn} onToggleTheme={toggleTheme} isDark={isDark}/>

      {/* Receipt bottom sheet */}
      {receipt&&<div style={{position:"fixed",inset:0,background:"rgba(2,8,24,.85)",zIndex:500,
        display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>{setReceipt(null);scanRef.current?.focus();}}>
        <div style={{width:"100%",maxWidth:400,background:C.bg2,borderRadius:"22px 22px 0 0",
          padding:"20px 20px 32px",border:`1px solid ${C.b1}`,borderBottom:"none",
          animation:"slideUp .3s ease",maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
          <div style={{width:36,height:4,background:C.b1,borderRadius:2,margin:"0 auto 16px"}}/>
          <div style={{textAlign:"center",marginBottom:14}}>
            <div style={{fontSize:40,marginBottom:8}}>🎉</div>
            <div className="mn" style={{fontSize:10.5,color:C.g,fontWeight:700,letterSpacing:2,marginBottom:3}}>TRANSAKSI BERHASIL</div>
            <div className="mn" style={{fontSize:10,color:C.t2}}>{receipt.id}</div>
            <div className="mn" style={{fontSize:10,color:C.t2}}>{receipt.date}</div>
            <div style={{marginTop:6}}><BizChip biz={biz}/></div>
          </div>
          <div style={{background:C.bg3,borderRadius:10,padding:"12px 14px",marginBottom:12,border:`1px solid ${C.b0}`}}>
            {receipt.items.map(item=><div key={item.barcode} style={{display:"flex",justifyContent:"space-between",
              fontSize:12.5,marginBottom:7,gap:8}}>
              <span style={{color:C.t1,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name} ×{item.qty}</span>
              <span className="mn" style={{flexShrink:0}}>{rp(item.price*item.qty)}</span>
            </div>)}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
            <span style={{fontSize:13,color:C.t1}}>Total Pembayaran</span>
            <span className="mn" style={{fontSize:22,fontWeight:700,color:C.g}}>{rp(receipt.total)}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11.5,color:C.t2,marginBottom:18}}>
            <span>Est. Laba Kotor</span>
            <span className="mn" style={{color:C.cy}}>+{rp(receipt.profit)}</span>
          </div>
          <button onClick={()=>{setReceipt(null);scanRef.current?.focus();}} className="press"
            style={{width:"100%",padding:"14px",background:`linear-gradient(90deg,${C.g},${C.b})`,
              border:"none",borderRadius:12,color:C.bg1,fontSize:14,fontWeight:800}}>
            Transaksi Baru →
          </button>
        </div>
      </div>}

      {/* Layout: side-by-side on tablet */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* Main: scan + cart */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
          {/* Scan bar */}
          <div style={{padding:"10px 12px",background:C.bg2,borderBottom:`1px solid ${C.b0}`,flexShrink:0}}>
            <div style={{display:"flex",gap:8}}>
              <div style={{flex:1,position:"relative"}}>
                <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:15,pointerEvents:"none",color:C.t2}}>📷</span>
                <input ref={scanRef} value={scanIn} onChange={e=>setScanIn(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&kasirScan(scanIn)}
                  placeholder="Scan barcode produk..."
                  style={{width:"100%",padding:"12px 12px 12px 40px",background:C.bg3,
                    border:`2px solid ${bc}44`,borderRadius:12,color:C.t0,fontSize:14,fontFamily:F.mono}}/>
              </div>
              <button onClick={()=>kasirScan(scanIn)} className="press"
                style={{padding:"12px 16px",background:bc,border:"none",borderRadius:12,
                  color:"#fff",fontWeight:800,fontSize:14,flexShrink:0}}>+</button>
            </div>
          </div>

          {/* Cart */}
          <div style={{flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:7}}>
            {cart.length===0 ? <div style={{display:"flex",flexDirection:"column",alignItems:"center",
              justifyContent:"center",flex:1,gap:10,padding:"32px 16px"}}>
              <div style={{fontSize:48,opacity:.08}}>🛒</div>
              <p style={{fontSize:13,fontWeight:600,color:C.t2}}>Keranjang kosong</p>
              <p style={{fontSize:11.5,color:C.t3}}>Scan barcode {BIZ[biz]?.name} untuk mulai</p>
            </div> : cart.map(item=><div key={item.barcode} style={{background:C.bg2,borderRadius:12,
              border:`1px solid ${C.b0}`,padding:"10px 12px",display:"flex",
              alignItems:"center",gap:8,animation:"fadeUp .15s ease"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:12.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                <div className="mn" style={{color:C.t2,fontSize:10,marginTop:1}}>{item.barcode}</div>
              </div>
              {/* Qty controls */}
              <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                <button onClick={()=>setCart(p=>{const it=p.find(c=>c.barcode===item.barcode);return it.qty<=1?p.filter(c=>c.barcode!==item.barcode):p.map(c=>c.barcode===item.barcode?{...c,qty:c.qty-1}:c);})}
                  className="press" style={{width:30,height:30,background:C.bg4,border:`1px solid ${C.b1}`,
                    borderRadius:8,color:C.t0,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                <span className="mn" style={{minWidth:24,textAlign:"center",fontWeight:700,fontSize:14}}>{item.qty}</span>
                <button onClick={()=>setCart(p=>p.map(c=>c.barcode===item.barcode&&c.qty<c.stock?{...c,qty:c.qty+1}:c))}
                  className="press" style={{width:30,height:30,background:C.bg4,border:`1px solid ${C.b1}`,
                    borderRadius:8,color:C.t0,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
              </div>
              <div className="mn" style={{fontWeight:700,color:C.a,fontSize:13,minWidth:78,textAlign:"right",flexShrink:0}}>{rp(item.price*item.qty)}</div>
              <button onClick={()=>setCart(p=>p.filter(c=>c.barcode!==item.barcode))}
                style={{background:"transparent",border:"none",color:C.t3,fontSize:18,padding:"0 2px",flexShrink:0}}>×</button>
            </div>)}
          </div>
        </div>

        {/* Side panel (tablet) */}
        <div className="hide-mobile" style={{width:220,background:C.bg2,borderLeft:`1px solid ${C.b0}`,
          display:"flex",flexDirection:"column",padding:12,flexShrink:0}}>
          <div style={{padding:"8px 10px",borderRadius:10,marginBottom:12,textAlign:"center",
            background:biz==="JS_CLOTHING"?C.b1:C.p1,border:`1px solid ${bc}22`}}>
            <span style={{fontSize:12,color:bc,fontWeight:700}}>{BIZ[biz]?.icon} {BIZ[biz]?.name}</span>
          </div>
          <div style={{flex:1}}>
            {[{l:"Produk",v:cart.length},{l:"Total Item",v:cart.reduce((s,c)=>s+c.qty,0)}].map(r=>(
              <div key={r.l} style={{display:"flex",justifyContent:"space-between",marginBottom:7,fontSize:13}}>
                <span style={{color:C.t2}}>{r.l}</span><span className="mn">{r.v}</span>
              </div>
            ))}
            <Divider/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5}}>
              <span style={{fontSize:13,color:C.t1}}>Total</span>
              <span className="mn" style={{fontSize:20,fontWeight:700,color:C.g}}>{rp(total)}</span>
            </div>
            {cart.length>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.t2}}>
              <span>Est. Laba</span><span className="mn" style={{color:C.cy}}>+{rp(total-totalHpp)}</span>
            </div>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:7,marginTop:12}}>
            <button onClick={doCheckout} disabled={!cart.length} className="press"
              style={{padding:"14px",background:cart.length?`linear-gradient(90deg,${C.g},${C.b})`:C.bg3,
                border:"none",borderRadius:11,color:cart.length?C.bg1:C.t2,fontSize:13,fontWeight:800,
                cursor:cart.length?"pointer":"not-allowed"}}>
              💳 BAYAR
            </button>
            <button onClick={()=>setCart([])} style={{padding:"7px",background:"transparent",
              border:`1px solid ${C.b0}`,borderRadius:8,color:C.t3,fontSize:11,fontFamily:F.sans}}>
              Bersihkan
            </button>
          </div>
          <Divider my={8}/>
          <div style={{fontSize:10,color:C.t3,textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontWeight:700}}>Terbaru</div>
          {trxs.filter(t=>t.business===biz).slice(0,5).map(t=><div key={t.id}
            style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:11}}>
            <span className="mn" style={{color:C.t2}}>{t.id?.slice(-8)}</span>
            <span className="mn" style={{color:C.g}}>{rp(t.total)}</span>
          </div>)}
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div style={{background:`${C.bg2}f8`,backdropFilter:"blur(16px)",borderTop:`1px solid ${C.b0}`,
        padding:"10px 12px",paddingBottom:`calc(10px + var(--safe-b))`,flexShrink:0,
        display:"flex",alignItems:"center",gap:10}}>
        <div style={{flex:1}}>
          <div style={{fontSize:10,color:C.t2,fontWeight:600}}>Total</div>
          <div className="mn" style={{fontSize:20,fontWeight:700,color:C.g,lineHeight:1.2}}>{rp(total)}</div>
          {cart.length>0&&<div className="mn" style={{fontSize:9.5,color:C.t3}}>{cart.reduce((s,c)=>s+c.qty,0)} item</div>}
        </div>
        <button onClick={doCheckout} disabled={!cart.length} className="press"
          style={{padding:"13px 24px",background:cart.length?`linear-gradient(90deg,${C.g},${C.b})`:C.bg3,
            border:"none",borderRadius:13,color:cart.length?C.bg1:C.t2,fontSize:14,fontWeight:800,
            flexShrink:0,boxShadow:cart.length?`0 4px 20px ${C.g}30`:undefined}}>
          💳 BAYAR
        </button>
      </div>
    </div>;
  }

  // ─────────────────────────────────
  //  STOK
  // ─────────────────────────────────
  if(screen==="stok") {
    const bc=biz==="JS_CLOTHING"?C.b:C.p;
    const filtered=bizProds().filter(p=>!stokSearch||
      p.name.toLowerCase().includes(stokSearch.toLowerCase())||p.barcode.includes(stokSearch));

    return <div style={{fontFamily:F.sans,background:C.bg1,color:C.t0,height:"100vh",display:"flex",flexDirection:"column"}}>
      <style>{CSS}</style><Toast n={notif}/>
      <Header biz={biz} user={user} online={online} onLogout={doLogout}
        onSwitchBiz={user?.access?.length>1?()=>{setStokTarget(null);setScreen("bizselect");}:null}
        onAbsenPulang={handlePulang} hasCheckedIn={hasCheckedIn} onToggleTheme={toggleTheme} isDark={isDark}/>

      <div style={{flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:10,minHeight:0}}>
        {/* Scan */}
        <Card noPad style={{overflow:"hidden"}}>
          <div style={{padding:"15px 14px",borderBottom:`1px solid ${C.b0}`,display:"flex",alignItems:"center",gap:8}}>
            <span style={{flex:1,fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1}}>📷 Scan Barcode</span>
            <BizChip biz={biz}/>
          </div>
          <div style={{padding:"10px 12px",display:"flex",gap:8}}>
            <div style={{flex:1,position:"relative"}}>
              <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:15,pointerEvents:"none",color:C.t2}}>📷</span>
              <input ref={stokScanRef} value={stokScan} onChange={e=>setStokScan(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&stokScanFn(stokScan)}
                placeholder="Scan atau ketik barcode..."
                style={{width:"100%",padding:"12px 12px 12px 40px",background:C.bg3,
                  border:`2px solid ${bc}44`,borderRadius:12,color:C.t0,fontSize:14,fontFamily:F.mono}}/>
            </div>
            <button onClick={()=>stokScanFn(stokScan)} className="press"
              style={{padding:"12px 16px",background:bc,border:"none",borderRadius:12,
                color:"#fff",fontWeight:800,fontSize:13,flexShrink:0}}>Scan</button>
          </div>
        </Card>

        {/* Input stok */}
        {stokTarget&&<Card accent={bc} style={{animation:"fadeUp .2s ease"}}>
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
                placeholder="0" style={{width:"100%",padding:"12px",background:C.bg3,border:`1.5px solid ${C.b0}`,
                  borderRadius:10,color:C.t0,fontSize:24,fontFamily:F.mono,textAlign:"center",fontWeight:700,transition:"border-color .15s"}}
                onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.b0}/>
            </div>
            <div>
              <div style={{fontSize:9.5,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:5}}>Update Harga Jual</div>
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:10,color:C.t2,pointerEvents:"none",fontFamily:F.mono}}>Rp</span>
                <input type="number" value={stokPrice} onChange={e=>setStokPrice(e.target.value)}
                  placeholder={String(stokTarget.price)}
                  style={{width:"100%",padding:"12px 10px 12px 28px",background:C.bg3,border:`1.5px solid ${C.b0}`,
                    borderRadius:10,color:C.t0,fontSize:14,fontFamily:F.mono,transition:"border-color .15s"}}
                  onFocus={e=>e.target.style.borderColor=C.a+"88"} onBlur={e=>e.target.style.borderColor=C.b0}/>
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
        </Card>}

        {/* Product table */}
        <Card noPad style={{overflow:"hidden"}}>
          <div style={{padding:"15px 14px",borderBottom:`1px solid ${C.b0}`,display:"flex",alignItems:"center",gap:8}}>
            <span style={{flex:1,fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1}}>Produk ({filtered.length})</span>
            <input value={stokSearch} onChange={e=>setStokSearch(e.target.value)} placeholder="Cari..."
              style={{padding:"7px 11px",background:C.bg3,border:`1px solid ${C.b0}`,borderRadius:8,color:C.t0,fontSize:12,width:140,fontFamily:F.sans}}/>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:460}}>
              <THead cols={["Barcode","Nama","Kategori","Harga Jual","Stok",""]}/>
              <tbody>{filtered.map((p,i)=><tr key={p.id} className="hrow" style={{borderTop:`1px solid ${C.b0}`,background:i%2===0?"transparent":C.bg0}}>
                <td style={{padding:"15px 14px",fontFamily:F.mono,fontSize:10,color:C.t2}}>{p.barcode}</td>
                <td style={{padding:"15px 14px",fontWeight:600}}>{p.name}</td>
                <td style={{padding:"15px 14px",color:C.t2}}>{p.category}</td>
                <td style={{padding:"15px 14px",fontFamily:F.mono,color:C.g,fontSize:11}}>{rp(p.price)}</td>
                <td style={{padding:"15px 14px"}}><StockBadge s={p.stock}/></td>
                <td style={{padding:"15px 14px"}}>
                  <button onClick={()=>{setStokTarget(p);setStokQ("");setStokPrice("");}} className="press"
                    style={{padding:"5px 12px",background:C.g1,border:`1px solid ${C.g}33`,
                      borderRadius:7,color:C.g,fontSize:11,fontWeight:700}}>+ Tambah</button>
                </td>
              </tr>)}</tbody>
            </table>
          </div>
        </Card>

        {/* Log masuk */}
        <Card noPad style={{overflow:"hidden"}}>
          <div style={{padding:"15px 14px",borderBottom:`1px solid ${C.b0}`}}>
            <span style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1}}>Log Penerimaan Stok</span>
          </div>
          {slogs.filter(l=>l.business===biz&&l.type==="masuk").length===0
            ?<div style={{padding:"24px",textAlign:"center",color:C.t3,fontSize:12}}>Belum ada log penerimaan</div>
            :<div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:400}}>
                <THead cols={["Waktu","Produk","Qty","Sblm→Ssdh","Oleh"]}/>
                <tbody>{slogs.filter(l=>l.business===biz&&l.type==="masuk").slice(0,30).map((l,i)=>(
                  <tr key={l.id} className="hrow" style={{borderTop:`1px solid ${C.b0}`,background:i%2===0?"transparent":C.bg0}}>
                    <td style={{padding:"14px 13px",color:C.t2,fontSize:10,whiteSpace:"nowrap"}}>{l.date}</td>
                    <td style={{padding:"14px 13px",fontWeight:500}}>{l.name}</td>
                    <td style={{padding:"14px 13px",fontFamily:F.mono,fontWeight:700,color:C.g}}>+{l.qty}</td>
                    <td style={{padding:"14px 13px",fontFamily:F.mono,fontSize:10}}>{l.before}→<b>{l.after}</b></td>
                    <td style={{padding:"14px 13px",color:C.t2}}>{l.by}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>}
        </Card>
      </div>
    </div>;
  }

  // ─────────────────────────────────
  //  ADMIN
  // ─────────────────────────────────
  if(screen==="admin") {
    const IS={width:"100%",padding:"14px 13px",background:C.bg3,border:`1.5px solid ${C.b0}`,
      borderRadius:10,color:C.t0,fontSize:13,fontFamily:F.mono,transition:"border-color .15s"};
    const TABS=[
      {id:"dashboard",l:"📊 Dashboard"},
      {id:"users",    l:"👥 Pengguna"},
      {id:"products", l:"📦 Produk"},
      {id:"laporan",  l:"💰 Laporan"},
      {id:"absensi",  l:"🕐 Absensi"},
      {id:"stoklog",  l:"📋 Log Stok"},
      {id:"sheets",   l:"🔗 Sheets"},
    ];
    const adminPs=prods.filter(p=>p.business===adminBiz&&(!searchQ||
      p.name.toLowerCase().includes(searchQ.toLowerCase())||p.barcode.includes(searchQ)));

    return <div style={{fontFamily:F.sans,background:C.bg1,color:C.t0,height:"100vh",display:"flex",flexDirection:"column"}}>
      <style>{CSS}</style><Toast n={notif}/>
      <Header title="Admin Panel" user={user} online={online} onLogout={doLogout} onToggleTheme={toggleTheme} isDark={isDark}/>

      {/* Tab bar */}
      <div style={{background:C.bg2,borderBottom:`1px solid ${C.b0}`,
        display:"flex",overflowX:"auto",flexShrink:0,gap:0,padding:"0 4px"}}>
        {TABS.map(t=><button key={t.id} onClick={()=>{setAdminTab(t.id);setSearchQ("");setPModal(false);}}
          className={`atab${adminTab===t.id?" on":""}`}>{t.l}</button>)}
      </div>

      {/* User modal */}
      {uModal&&<div style={{position:"fixed",inset:0,background:"rgba(2,8,24,.85)",zIndex:500,
        display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setUModal(false)}>
        <div style={{width:"100%",maxWidth:500,background:C.bg2,borderRadius:"22px 22px 0 0",
          padding:"18px 20px 32px",border:`1px solid ${C.b1}`,borderBottom:"none",
          animation:"slideUp .25s ease",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
          <div style={{width:36,height:4,background:C.b1,borderRadius:2,margin:"0 auto 16px"}}/>
          <h3 style={{fontSize:14,fontWeight:800,marginBottom:16,color:C.g}}>{editUid===null?"➕ Tambah Pengguna":"✏️ Edit Pengguna"}</h3>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div>
              <div style={{fontSize:9.5,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Nama Lengkap *</div>
              <input value={uForm.name||""} onChange={e=>setUForm(x=>({...x,name:e.target.value}))} style={IS}
                onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.b0}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div style={{gridColumn:"span 1"}}>
                <div style={{fontSize:9.5,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Username *</div>
                <input value={uForm.username||""} onChange={e=>setUForm(x=>({...x,username:e.target.value}))}
                  disabled={editUid!==null} style={{...IS,color:editUid!==null?C.t2:C.t0}}
                  onFocus={e=>editUid===null&&(e.target.style.borderColor=C.g+"88")} onBlur={e=>e.target.style.borderColor=C.b0}/>
              </div>
              <div>
                <div style={{fontSize:9.5,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Password *</div>
                <input type="password" value={uForm.password||""} onChange={e=>setUForm(x=>({...x,password:e.target.value}))} style={IS}
                  onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.b0}/>
              </div>
              <div>
                <div style={{fontSize:9.5,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Avatar Emoji</div>
                <input value={uForm.avatar||""} onChange={e=>setUForm(x=>({...x,avatar:e.target.value}))} style={IS}
                  onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.b0}/>
              </div>
              <div>
                <div style={{fontSize:9.5,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Role</div>
                <select value={uForm.role||"kasir"} onChange={e=>setUForm(x=>({...x,role:e.target.value}))}
                  style={{...IS,fontFamily:F.sans}}>
                  <option value="kasir">Kasir</option><option value="stok">Stok</option><option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div>
              <div style={{fontSize:9.5,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Akses Bisnis *</div>
              <div style={{display:"flex",gap:8}}>
                {Object.values(BIZ).map(b2=>{const chk=uForm.access?.includes(b2.id),isJ=b2.id==="JS_CLOTHING";
                  return <button key={b2.id} onClick={()=>setUForm(x=>({...x,access:chk?x.access.filter(a=>a!==b2.id):[...(x.access||[]),b2.id]}))}
                    style={{flex:1,padding:"10px",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:12,
                      background:chk?(isJ?C.b1:C.p1):"transparent",border:`2px solid ${chk?(isJ?C.b:C.p):C.b0}`,
                      color:chk?(isJ?C.b:C.p):C.t2,fontFamily:F.sans}}>
                    {b2.icon} {b2.name}</button>;})}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <input type="checkbox" id="uac" checked={!!uForm.active} onChange={e=>setUForm(x=>({...x,active:e.target.checked}))}
                style={{width:16,height:16,cursor:"pointer",accentColor:C.g}}/>
              <label htmlFor="uac" style={{fontSize:12.5,cursor:"pointer"}}>Akun Aktif</label>
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:16}}>
            <Btn onClick={saveUser} full>Simpan</Btn>
            <Btn onClick={()=>setUModal(false)} outline>Batal</Btn>
          </div>
        </div>
      </div>}

      <div style={{flex:1,overflowY:"auto",padding:"10px 12px",paddingBottom:`calc(16px + var(--safe-b))`,minHeight:0}}>

        {/* ── DASHBOARD ── */}
        {adminTab==="dashboard"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
          <h2 style={{fontSize:15,fontWeight:800}}>Dashboard</h2>
          {/* Stats */}
          <div className="stat-grid-4" style={{display:"grid",gap:8,marginBottom:2}}>
            <Stat icon="💰" label="Pendapatan Hari Ini" color={C.g}
              value={rp(trxs.filter(t=>{try{return new Date(t.date.replace(/(\d+)\/(\d+)\/(\d+),/,"$3-$2-$1 ")).toDateString()===new Date().toDateString();}catch{return false;}}).reduce((s,t)=>s+t.total,0))}/>
            <Stat icon="🧾" label="Transaksi Hari Ini" color={C.cy}
              value={trxs.filter(t=>{try{return new Date(t.date.replace(/(\d+)\/(\d+)\/(\d+),/,"$3-$2-$1 ")).toDateString()===new Date().toDateString();}catch{return false;}}).length}/>
            <Stat icon="📦" label="Total Produk" color={C.b} value={prods.length}
              sub={`${prods.filter(p=>p.stock<10).length} stok menipis`}/>
            <Stat icon="🕐" label="Hadir Hari Ini" color={C.a}
              value={attend.filter(a=>a.date===todayDate()).length}/>
          </div>
          {/* Stok menipis */}
          {prods.filter(p=>p.stock<10).length>0&&<Card accent={C.r}>
            <div style={{fontSize:10,fontWeight:700,color:C.r,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>⚠ Stok Menipis</div>
            {prods.filter(p=>p.stock<10).map(p=><div key={p.id} style={{display:"flex",justifyContent:"space-between",
              alignItems:"center",padding:"6px 0",borderTop:`1px solid ${C.b0}`,fontSize:12.5}}>
              <span style={{fontWeight:600}}>{p.name}</span>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <BizChip biz={p.business} sm/>
                <StockBadge s={p.stock}/>
              </div>
            </div>)}
          </Card>}
          {/* Absen hari ini */}
          <Card>
            <div style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>🕐 Kehadiran Hari Ini</div>
            {attend.filter(a=>a.date===todayDate()).length===0
              ?<p style={{fontSize:12,color:C.t3}}>Belum ada pegawai yang absen hari ini</p>
              :attend.filter(a=>a.date===todayDate()).map(a=><div key={a.id} style={{display:"flex",justifyContent:"space-between",
                alignItems:"center",padding:"7px 0",borderTop:`1px solid ${C.b0}`,fontSize:12.5}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span>{users.find(u=>u.id===a.userId)?.avatar||"🧑"}</span>
                  <div><div style={{fontWeight:600}}>{a.name}</div><div style={{fontSize:10,color:C.t2}}>{a.checkIn}</div></div>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <BizChip biz={a.business} sm/>
                  {a.checkOut?<span style={{fontSize:10,color:C.g,fontWeight:600}}>✓ Pulang</span>
                    :<span style={{fontSize:10,color:C.a,fontWeight:600}}>● Hadir</span>}
                </div>
              </div>)}
          </Card>
        </div>}

        {/* ── PENGGUNA ── */}
        {adminTab==="users"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
            <div>
              <h2 style={{fontSize:15,fontWeight:800}}>Database Pengguna</h2>
              <p style={{fontSize:11.5,color:C.t2,marginTop:2}}>Kelola akun & biometrik wajah pegawai</p>
            </div>
            <Btn onClick={openAddU} size="sm">+ Tambah</Btn>
          </div>
          <Card noPad style={{overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:580}}>
                <THead cols={["#","Username","Nama","Role","Akses","Wajah","Status","Aksi"]}/>
                <tbody>{users.map((u,i)=><tr key={u.id} className="hrow" style={{borderTop:`1px solid ${C.b0}`,background:i%2===0?"transparent":C.bg0}}>
                  <td style={{padding:"15px 14px",fontFamily:F.mono,color:C.t3,fontSize:10}}>{u.id}</td>
                  <td style={{padding:"15px 14px",fontFamily:F.mono,fontSize:11}}>{u.avatar} {u.username}</td>
                  <td style={{padding:"15px 14px",fontWeight:600}}>{u.name}</td>
                  <td style={{padding:"15px 14px"}}><RoleTag role={u.role}/></td>
                  <td style={{padding:"15px 14px"}}><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{u.access?.map(a=><BizChip key={a} biz={a} sm/>)}</div></td>
                  <td style={{padding:"15px 14px"}}>
                    {u.role==="admin"?<span style={{fontSize:10,color:C.t3}}>N/A</span>
                    :u.faceDescriptor?<span style={{fontSize:10,color:C.g,fontWeight:700}}>✓ Terdaftar</span>
                    :<button onClick={()=>setFaceReg(u.id)} className="press"
                      style={{padding:"3px 9px",background:C.a1,border:`1px solid ${C.a}33`,
                        borderRadius:6,color:C.a,fontSize:10,fontWeight:700}}>Daftarkan</button>}
                  </td>
                  <td style={{padding:"15px 14px"}}>
                    <span style={{padding:"2px 8px",borderRadius:20,fontSize:9.5,fontWeight:700,
                      background:u.active?C.g1:C.r1,color:u.active?C.g:C.r}}>{u.active?"AKTIF":"NONAKTIF"}</span>
                  </td>
                  <td style={{padding:"15px 14px",whiteSpace:"nowrap"}}>
                    <button onClick={()=>openEditU(u)} className="press" style={{marginRight:4,padding:"3px 9px",background:"transparent",border:`1px solid ${C.b1}`,borderRadius:6,color:C.t0,fontSize:10}}>Edit</button>
                    {u.faceDescriptor&&u.role!=="admin"&&<button onClick={()=>{fbUpdateUser(u.id,{...u,faceDescriptor:null});toast("Wajah direset","warn");}} className="press" style={{marginRight:4,padding:"3px 9px",background:C.a1,border:`1px solid ${C.a}22`,borderRadius:6,color:C.a,fontSize:10}}>Reset</button>}
                    <button onClick={()=>delUser(u.id)} className="press" style={{padding:"3px 9px",background:C.r1,border:`1px solid ${C.r}22`,borderRadius:6,color:C.r,fontSize:10}}>Hapus</button>
                  </td>
                </tr>)}</tbody>
              </table>
            </div>
          </Card>
        </div>}

        {/* ── PRODUK ── */}
        {adminTab==="products"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
            {Object.values(BIZ).map(b2=>{const isJ=b2.id==="JS_CLOTHING",active=adminBiz===b2.id;
              return <button key={b2.id} onClick={()=>{setAdminBiz(b2.id);setSearchQ("");setPModal(false);}} className="press"
                style={{padding:"7px 14px",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:12,
                  background:active?(isJ?C.b1:C.p1):"transparent",
                  border:`2px solid ${active?(isJ?C.b:C.p):C.b0}`,color:active?(isJ?C.b:C.p):C.t2,fontFamily:F.sans}}>
                {b2.icon} {b2.name}</button>;})}
            <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Cari produk..."
              style={{padding:"7px 11px",background:C.bg2,border:`1px solid ${C.b0}`,borderRadius:8,color:C.t0,fontSize:12,width:140,fontFamily:F.sans}}/>
            <button onClick={()=>downloadCSV(adminPs,[
              {key:"barcode",label:"Barcode"},{key:"name",label:"Nama Produk"},
              {key:"category",label:"Kategori"},{key:"hpp",label:"HPP",fn:r=>r.hpp||0},
              {key:"price",label:"Harga Jual"},{key:"stock",label:"Stok"},
              {key:"business",label:"Bisnis",fn:r=>BIZ[r.business]?.name||r.business},
              {key:"margin",label:"Margin %",fn:r=>r.price>0?(((r.price-(r.hpp||0))/r.price)*100).toFixed(1)+"%":"0%"},
            ],"produk_"+adminBiz)} className="press"
              style={{padding:"7px 12px",background:C.g1,border:`1px solid ${C.g}33`,borderRadius:8,
                color:C.g,fontSize:12,fontWeight:700,fontFamily:F.sans}}>
              ⬇ Excel
            </button>
            <Btn onClick={openAddP} size="sm">+ Tambah</Btn>
          </div>
          {/* Scan barcode di produk admin */}
          <div style={{display:"flex",gap:8,alignItems:"center",padding:"10px 14px",
            background:C.bg2,borderRadius:12,border:`1px solid ${C.b0}`}}>
            <span style={{fontSize:12,color:C.t2,fontWeight:600,whiteSpace:"nowrap"}}>🔍 Scan/Cari:</span>
            <input ref={adminScanRef} value={adminScanQ} onChange={e=>setAdminScanQ(e.target.value)}
              onKeyDown={e=>{
                if(e.key==="Enter"){
                  const bc=adminScanQ.trim();
                  const found=prods.find(p=>p.barcode===bc&&p.business===adminBiz)||prods.find(p=>p.name.toLowerCase().includes(bc.toLowerCase())&&p.business===adminBiz);
                  if(found){openEditP(found);setAdminScanQ("");}
                  else toast("Produk tidak ditemukan: "+bc,"warn");
                }
              }}
              placeholder="Scan barcode atau ketik nama → Enter untuk edit..."
              style={{flex:1,padding:"10px 12px",background:C.bg3,border:`1.5px solid ${C.b1}`,
                borderRadius:9,color:C.t0,fontSize:13,fontFamily:F.mono}}/>
            <button onClick={()=>{
              const bc=adminScanQ.trim();
              const found=prods.find(p=>p.barcode===bc&&p.business===adminBiz)||prods.find(p=>p.name.toLowerCase().includes(bc.toLowerCase())&&p.business===adminBiz);
              if(found){openEditP(found);setAdminScanQ("");}
              else toast("Tidak ditemukan: "+bc,"warn");
            }} className="press" style={{padding:"10px 14px",background:C.b,border:"none",borderRadius:9,
              color:"#fff",fontWeight:700,fontSize:12,flexShrink:0}}>Cari</button>
          </div>

          {pModal&&<Card accent={C.g} style={{padding:16}}>
            <h3 style={{fontSize:13,fontWeight:800,marginBottom:14,color:C.g}}>{editPid===null?"➕ Tambah Produk":"✏️ Edit Produk"}</h3>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:9}}>
              {[{k:"barcode",l:"Barcode *",full:true,dis:editPid!==null},{k:"name",l:"Nama Produk *",full:true},
                {k:"category",l:"Kategori"},{k:"stock",l:"Stok *",t:"number"}].map(f=>(
                <div key={f.k} style={{gridColumn:f.full?"span 2":""}}>
                  <div style={{fontSize:9.5,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>{f.l}</div>
                  <input type={f.t||"text"} value={pForm[f.k]||""} disabled={f.dis}
                    onChange={e=>setPForm(x=>({...x,[f.k]:e.target.value}))}
                    style={{...IS,color:f.dis?C.t2:C.t0}}
                    onFocus={e=>!f.dis&&(e.target.style.borderColor=C.g+"88")} onBlur={e=>e.target.style.borderColor=C.b0}/>
                </div>
              ))}
              <div>
                <div style={{fontSize:9.5,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Harga Jual *</div>
                <input type="number" value={pForm.price||""} onChange={e=>setPForm(x=>({...x,price:e.target.value}))} style={IS}
                  onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.b0}/>
              </div>
              <div>
                <div style={{fontSize:9.5,fontWeight:700,color:C.a,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>HPP / Modal — admin only</div>
                <input type="number" value={pForm.hpp||""} onChange={e=>setPForm(x=>({...x,hpp:e.target.value}))}
                  style={{...IS,borderColor:C.a+"44"}}
                  onFocus={e=>e.target.style.borderColor=C.a+"88"} onBlur={e=>e.target.style.borderColor=C.a+"44"}/>
              </div>
            </div>
            {pForm.price&&pForm.hpp&&+pForm.price>0&&+pForm.hpp>0&&(
              <div style={{marginTop:9,padding:"7px 11px",background:C.bg3,borderRadius:7,fontSize:11.5,display:"flex",gap:14}}>
                <span style={{color:C.t2}}>Margin: <b style={{color:C.g}}>{((+pForm.price-+pForm.hpp)/+pForm.price*100).toFixed(1)}%</b></span>
                <span style={{color:C.t2}}>Laba/pcs: <b style={{color:C.cy}}>{rp(+pForm.price-+pForm.hpp)}</b></span>
              </div>
            )}
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <Btn onClick={saveProd}>Simpan</Btn><Btn onClick={()=>setPModal(false)} outline>Batal</Btn>
            </div>
          </Card>}

          <Card noPad style={{overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:560}}>
                <THead cols={["Barcode","Nama","Kategori","HPP","Harga Jual","Margin","Stok","Aksi"]}/>
                <tbody>{adminPs.map((p,i)=>{
                  const mg=p.price>0?((p.price-(p.hpp||0))/p.price*100).toFixed(0)+"%":"-";
                  return <tr key={p.id} className="hrow" style={{borderTop:`1px solid ${C.b0}`,background:i%2===0?"transparent":C.bg0}}>
                    <td style={{padding:"14px 13px",fontFamily:F.mono,fontSize:10,color:C.t2}}>{p.barcode}</td>
                    <td style={{padding:"14px 13px",fontWeight:600}}>{p.name}</td>
                    <td style={{padding:"14px 13px",color:C.t2,fontSize:11}}>{p.category}</td>
                    <td style={{padding:"14px 13px",fontFamily:F.mono,color:C.a,fontSize:11}}>{rp(p.hpp||0)}</td>
                    <td style={{padding:"14px 13px",fontFamily:F.mono,color:C.g,fontSize:11}}>{rp(p.price)}</td>
                    <td style={{padding:"14px 13px",fontFamily:F.mono,fontSize:11,color:C.cy}}>{mg}</td>
                    <td style={{padding:"14px 13px"}}><StockBadge s={p.stock}/></td>
                    <td style={{padding:"14px 13px",whiteSpace:"nowrap"}}>
                      <button onClick={()=>openEditP(p)} className="press" style={{marginRight:4,padding:"3px 9px",background:"transparent",border:`1px solid ${C.b1}`,borderRadius:6,color:C.t0,fontSize:10}}>Edit</button>
                      <button onClick={()=>fbDeleteProduct(p.id).then(()=>toast("Produk dihapus")).catch(e=>toast(e.message,"err"))} className="press" style={{padding:"3px 9px",background:C.r1,border:`1px solid ${C.r}22`,borderRadius:6,color:C.r,fontSize:10}}>Hapus</button>
                    </td>
                  </tr>;})}
                </tbody>
              </table>
            </div>
          </Card>
        </div>}

        {/* ── LAPORAN KEUANGAN ── */}
        {adminTab==="laporan"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
          {/* Filter */}
          <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{flex:1}}>
              <h2 style={{fontSize:15,fontWeight:800}}>Laporan Keuangan</h2>
              <p style={{fontSize:11.5,color:C.t2,marginTop:2}}>Analisis pendapatan, HPP & laba per periode</p>
            </div>
            <button onClick={()=>downloadCSV(filtTrx,[
              {key:"id",label:"ID Transaksi"},{key:"date",label:"Tanggal"},
              {key:"kasir",label:"Kasir"},{key:"business",label:"Bisnis",fn:r=>BIZ[r.business]?.name||r.business},
              {key:"total",label:"Total (Rp)"},{key:"totalHpp",label:"HPP (Rp)",fn:r=>r.totalHpp||0},
              {key:"profit",label:"Laba (Rp)",fn:r=>r.profit||0},
              {key:"margin",label:"Margin %",fn:r=>r.total>0?(((r.profit||0)/r.total)*100).toFixed(1)+"%":"0%"},
              {key:"items",label:"Jumlah Item",fn:r=>r.items?.length||0},
            ],"laporan_keuangan")} className="press"
              style={{padding:"8px 14px",background:C.g1,border:`1px solid ${C.g}33`,borderRadius:9,
                color:C.g,fontSize:12,fontWeight:700,fontFamily:F.sans}}>
              ⬇ Excel Transaksi
            </button>
            <button onClick={()=>downloadCSV(prodPerf,[
              {key:"barcode",label:"Barcode"},{key:"name",label:"Nama Produk"},
              {key:"qty",label:"Qty Terjual"},{key:"rev",label:"Pendapatan (Rp)"},
              {key:"hpp",label:"HPP (Rp)"},{key:"laba",label:"Laba (Rp)",fn:r=>r.rev-r.hpp},
              {key:"margin",label:"Margin %",fn:r=>r.rev>0?(((r.rev-r.hpp)/r.rev)*100).toFixed(1)+"%":"0%"},
            ],"laporan_produk")} className="press"
              style={{padding:"8px 14px",background:C.cy1,border:`1px solid ${C.cy}33`,borderRadius:9,
                color:C.cy,fontSize:12,fontWeight:700,fontFamily:F.sans}}>
              ⬇ Excel Produk
            </button>
          </div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center"}}>
            {/* Bisnis filter */}
            {["ALL","JS_CLOTHING","JB_STORE"].map(b2=><button key={b2} onClick={()=>setReportBiz(b2)} className="press"
              style={{padding:"6px 12px",borderRadius:8,fontSize:11.5,fontWeight:600,cursor:"pointer",
                background:reportBiz===b2?(b2==="JB_STORE"?C.p1:b2==="JS_CLOTHING"?C.b1:C.g1):"transparent",
                border:`1.5px solid ${reportBiz===b2?(b2==="JB_STORE"?C.p:b2==="JS_CLOTHING"?C.b:C.g):C.b0}`,
                color:reportBiz===b2?(b2==="JB_STORE"?C.p:b2==="JS_CLOTHING"?C.b:C.g):C.t2,fontFamily:F.sans}}>
              {b2==="ALL"?"Semua":BIZ[b2]?.name}</button>)}
            {/* Range filter */}
            {[["all","Semua"],["today","Hari Ini"],["week","7 Hari"],["month","Bulan Ini"],["custom","Rentang"]].map(([v,l])=><button key={v}
              onClick={()=>setReportRange(v)} className="press"
              style={{padding:"6px 12px",borderRadius:8,fontSize:11.5,fontWeight:600,cursor:"pointer",
                background:reportRange===v?C.g1:"transparent",border:`1.5px solid ${reportRange===v?C.g:C.b0}`,
                color:reportRange===v?C.g:C.t2,fontFamily:F.sans}}>{l}</button>)}
            {reportRange==="custom"&&<div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
              <input type="date" value={lapFrom} onChange={e=>setLapFrom(e.target.value)}
                style={{padding:"6px 10px",background:C.bg3,border:`1.5px solid ${C.b1}`,borderRadius:8,color:C.t0,fontSize:12,fontFamily:F.sans}}/>
              <span style={{color:C.t2,fontSize:12}}>s/d</span>
              <input type="date" value={lapTo} onChange={e=>setLapTo(e.target.value)}
                style={{padding:"6px 10px",background:C.bg3,border:`1.5px solid ${C.b1}`,borderRadius:8,color:C.t0,fontSize:12,fontFamily:F.sans}}/>
            </div>}
          </div>

          {/* KPI cards */}
          <div className="stat-grid-4" style={{display:"grid",gap:8,marginBottom:2}}>
            <Stat icon="💰" label="Total Pendapatan" value={rp(totalRev)} color={C.g}
              sub={`${filtTrx.length} transaksi`}/>
            <Stat icon="📦" label="Total HPP / Modal" value={rp(totalHppAll)} color={C.a}/>
            <Stat icon="📈" label="Laba Kotor" value={rp(grossProfit)} color={C.cy}/>
            <Stat icon="🎯" label="Margin Laba" value={margin} color={C.b}
              sub={`Laba: ${rp(grossProfit)} | Avg/trx: ${filtTrx.length?rp(Math.floor(totalRev/filtTrx.length)):rp(0)}`}/>
          </div>

          {/* Pie per bisnis */}
          {bizRevData.length>1&&<Card>
            <div style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Kontribusi per Bisnis</div>
            <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={bizRevData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {bizRevData.map((entry,index)=><Cell key={index} fill={entry.color}/>)}
                  </Pie>
                  <Tooltip formatter={v=>rp(v)} contentStyle={{background:C.bg2,border:`1px solid ${C.b1}`,borderRadius:8,fontSize:12}}/>
                  <Legend formatter={(v,entry)=><span style={{color:C.t1,fontSize:11}}>{v}: {rp(entry.payload.value)}</span>}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>}

          {/* Daily chart */}
          {dailyData.length>0&&<Card>
            <div style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Tren Harian (Pendapatan & Laba)</div>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={dailyData} barGap={2} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke={C.b0} vertical={false}/>
                <XAxis dataKey="date" tick={{fill:C.t3,fontSize:9.5}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:C.t3,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>"Rp"+Math.floor(v/1000)+"k"}/>
                <Tooltip contentStyle={{background:C.bg2,border:`1px solid ${C.b1}`,borderRadius:9,fontSize:12}}
                  formatter={(v,n)=>[rp(v),n==="rev"?"Pendapatan":"Laba Kotor"]}/>
                <Bar dataKey="rev"    name="rev"    fill={C.g}  radius={[4,4,0,0]} opacity={.8}/>
                <Bar dataKey="profit" name="profit" fill={C.cy} radius={[4,4,0,0]} opacity={.7}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>}

          {/* Performa produk */}
          {prodPerf.length>0&&<Card noPad style={{overflow:"hidden"}}>
            <div style={{padding:"15px 14px",borderBottom:`1px solid ${C.b0}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1}}>Performa Produk (Top {Math.min(prodPerf.length,20)})</span>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:480}}>
                <THead cols={["Produk","Qty Terjual","Pendapatan","HPP","Laba","Margin"]}/>
                <tbody>{prodPerf.slice(0,20).map((p,i)=>{
                  const laba=p.rev-p.hpp,mg=p.rev>0?((laba/p.rev)*100).toFixed(1)+"%":"0%";
                  return <tr key={p.barcode} className="hrow" style={{borderTop:`1px solid ${C.b0}`,background:i%2===0?"transparent":C.bg0}}>
                    <td style={{padding:"14px 13px",fontWeight:600,fontSize:12}}>{p.name}
                      <div className="mn" style={{fontSize:9.5,color:C.t3,marginTop:1}}>{p.barcode}</div></td>
                    <td style={{padding:"14px 13px",fontFamily:F.mono,fontWeight:700}}>{p.qty}</td>
                    <td style={{padding:"14px 13px",fontFamily:F.mono,color:C.g,fontSize:11}}>{rp(p.rev)}</td>
                    <td style={{padding:"14px 13px",fontFamily:F.mono,color:C.a,fontSize:11}}>{rp(p.hpp)}</td>
                    <td style={{padding:"14px 13px",fontFamily:F.mono,color:C.cy,fontSize:11}}>{rp(laba)}</td>
                    <td style={{padding:"14px 13px",fontFamily:F.mono,fontSize:11}}>
                      <span style={{color:parseFloat(mg)>30?C.g:parseFloat(mg)>15?C.a:C.r}}>{mg}</span>
                    </td>
                  </tr>;})}
                </tbody>
              </table>
              <div style={{padding:"14px 13px",borderTop:`1px solid ${C.b0}`,display:"flex",gap:16,fontSize:11,flexWrap:"wrap"}}>
                <span style={{color:C.t2}}>Pendapatan: <b className="mn" style={{color:C.g}}>{rp(totalRev)}</b></span>
                <span style={{color:C.t2}}>HPP: <b className="mn" style={{color:C.a}}>{rp(totalHppAll)}</b></span>
                <span style={{color:C.t2}}>Laba: <b className="mn" style={{color:C.cy}}>{rp(grossProfit)}</b></span>
                <span style={{color:C.t2}}>Margin: <b className="mn" style={{color:C.b}}>{margin}</b> <span className="mn" style={{color:C.cy}}>({rp(grossProfit)})</span></span>
              </div>
            </div>
          </Card>}

          {/* Riwayat transaksi */}
          <Card noPad style={{overflow:"hidden"}}>
            <div style={{padding:"15px 14px",borderBottom:`1px solid ${C.b0}`}}>
              <span style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1}}>Riwayat Transaksi ({filtTrx.length})</span>
            </div>
            {filtTrx.length===0?<div style={{padding:"24px",textAlign:"center",color:C.t3,fontSize:12}}>Belum ada transaksi</div>
            :<div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:500}}>
                <THead cols={["ID","Tanggal","Kasir","Bisnis","Total","HPP","Laba","Item"]}/>
                <tbody>{filtTrx.slice(0,50).map((t,i)=><tr key={t.id} className="hrow" style={{borderTop:`1px solid ${C.b0}`,background:i%2===0?"transparent":C.bg0}}>
                  <td style={{padding:"14px 13px",fontFamily:F.mono,fontSize:9.5,color:C.t3}}>{t.id?.slice(-10)}</td>
                  <td style={{padding:"14px 13px",fontSize:10,color:C.t2,whiteSpace:"nowrap"}}>{t.date}</td>
                  <td style={{padding:"14px 13px",fontWeight:500}}>{t.kasir}</td>
                  <td style={{padding:"14px 13px"}}><BizChip biz={t.business} sm/></td>
                  <td style={{padding:"14px 13px",fontFamily:F.mono,color:C.g,fontSize:11,fontWeight:700}}>{rp(t.total)}</td>
                  <td style={{padding:"14px 13px",fontFamily:F.mono,color:C.a,fontSize:11}}>{rp(t.totalHpp||0)}</td>
                  <td style={{padding:"14px 13px",fontFamily:F.mono,color:C.cy,fontSize:11}}>{rp(t.profit||0)}</td>
                  <td style={{padding:"14px 13px",fontFamily:F.mono,fontSize:10}}>{t.items?.length||0}</td>
                </tr>)}</tbody>
              </table>
            </div>}
          </Card>
        </div>}

        {/* ── ABSENSI ── */}
        {adminTab==="absensi"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
            <h2 style={{fontSize:15,fontWeight:800}}>Laporan Absensi</h2>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            <button onClick={()=>downloadCSV(attFiltered.sort((a,b)=>{try{return new Date(b.checkInISO||b.checkIn)-new Date(a.checkInISO||a.checkIn);}catch{return 0;}}),[
              {key:"date",label:"Tanggal"},{key:"name",label:"Nama Pegawai"},
              {key:"role",label:"Role"},{key:"business",label:"Bisnis",fn:r=>BIZ[r.business]?.name||r.business},
              {key:"checkIn",label:"Jam Masuk"},{key:"checkOut",label:"Jam Pulang",fn:r=>r.checkOut||"-"},
              {key:"durasi",label:"Durasi",fn:r=>{
                const ci=r.checkInISO||r.checkIn,co=r.checkOutISO||r.checkOut;
                if(!ci||!co) return "-";
                try{const ms=new Date(co)-new Date(ci);return Math.floor(ms/3600000)+"j "+Math.floor((ms%3600000)/60000)+"m";}catch{return "-";}
              }},
            ],"absensi")} className="press"
              style={{padding:"7px 14px",background:C.g1,border:`1px solid ${C.g}33`,borderRadius:8,
                color:C.g,fontSize:12,fontWeight:700,fontFamily:F.sans}}>
              ⬇ Excel
            </button>
            <button onClick={async()=>{
              if(!window.confirm("Reset semua absensi hari ini? Data akan dihapus permanen.")) return;
              await fbClearAttendanceByDate(todayDate()).catch(()=>{});
              toast("✅ Absensi hari ini direset","warn");
            }} className="press" style={{padding:"7px 14px",background:C.r1,border:`1px solid ${C.r}33`,
              borderRadius:9,color:C.r,fontSize:12,fontWeight:700,fontFamily:F.sans}}>
              🗑 Reset Absensi Hari Ini
            </button>
            </div>
          </div>

          {/* Filter — satu filter untuk ringkasan & detail */}
          <Card style={{padding:"12px 14px"}}>
            <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"flex-end"}}>
              <div style={{flex:"1 1 180px",minWidth:160}}>
                <div style={{fontSize:9.5,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:5}}>Pegawai</div>
                <select value={selUser} onChange={e=>setSelUser(e.target.value)}
                  style={{width:"100%",padding:"10px 12px",background:C.bg3,border:`1.5px solid ${C.b0}`,
                    borderRadius:10,color:C.t0,fontSize:13,fontFamily:F.sans,cursor:"pointer"}}>
                  <option value="ALL">Semua Pegawai</option>
                  {users.filter(u=>u.role!=="admin").map(u=><option key={u.id} value={String(u.id)}>{u.avatar} {u.name}</option>)}
                </select>
              </div>
              <div style={{flex:"2 1 300px"}}>
                <div style={{fontSize:9.5,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:5}}>Rentang Waktu</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                  {[["all","Semua"],["today","Hari Ini"],["week","7 Hari"],["month","Bulan Ini"],["custom","Rentang"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setAttRange(v)} className="press"
                      style={{padding:"8px 13px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",
                        background:attRange===v?C.g1:"transparent",border:`1.5px solid ${attRange===v?C.g:C.b0}`,
                        color:attRange===v?C.g:C.t2,fontFamily:F.sans}}>{l}</button>
                  ))}
                  {attRange==="custom"&&<>
                    <input type="date" value={attFrom} onChange={e=>setAttFrom(e.target.value)}
                      style={{padding:"8px 10px",background:C.bg3,border:`1.5px solid ${C.b1}`,borderRadius:8,color:C.t0,fontSize:12,fontFamily:F.sans}}/>
                    <span style={{color:C.t2,fontSize:12,fontWeight:600}}>s/d</span>
                    <input type="date" value={attTo} onChange={e=>setAttTo(e.target.value)}
                      style={{padding:"8px 10px",background:C.bg3,border:`1.5px solid ${C.b1}`,borderRadius:8,color:C.t0,fontSize:12,fontFamily:F.sans}}/>
                  </>}
                </div>
              </div>
            </div>
            <div style={{marginTop:10,padding:"7px 11px",background:C.bg3,borderRadius:8,
              fontSize:11,color:C.t2,border:`1px solid ${C.b0}`}}>
              Filter berlaku untuk <b style={{color:C.t0}}>ringkasan</b> dan <b style={{color:C.t0}}>detail absensi</b> sekaligus
              <span style={{float:"right",fontFamily:"'JetBrains Mono',monospace",color:C.g,fontWeight:700}}>{attFiltered.length} record</span>
            </div>
          </Card>

          {/* Ringkasan per pegawai bulan ini */}
          <Card noPad style={{overflow:"hidden"}}>
            <div style={{padding:"15px 14px",borderBottom:`1px solid ${C.b0}`}}>
              <span style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1}}>
                Ringkasan Kehadiran ({Object.keys(attByUser).length} pegawai · {attFiltered.length} record)
              </span>
            </div>
            {Object.keys(attByUser).length===0
              ?<div style={{padding:"24px",textAlign:"center",color:C.t3,fontSize:12}}>Belum ada data untuk periode ini</div>
              :<div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <THead cols={["Pegawai","Role","Hadir (Hari)","Total Jam Kerja","Rata-rata/Hari","Terakhir Masuk"]}/>
                  <tbody>{Object.values(attByUser).map((au,i)=>{
                    const avgMin=au.days>0?Math.floor(au.totalMinutes/au.days):0;
                    const totalJam=`${Math.floor(au.totalMinutes/60)}j ${au.totalMinutes%60}m`;
                    const avgJam=`${Math.floor(avgMin/60)}j ${avgMin%60}m`;
                    return <tr key={au.userId} className="hrow" style={{borderTop:`1px solid ${C.b0}`,background:i%2===0?"transparent":C.bg0}}>
                      <td style={{padding:"15px 14px",fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
                        <span>{users.find(u=>u.id===au.userId)?.avatar||"🧑"}</span>{au.name}
                      </td>
                      <td style={{padding:"15px 14px"}}><RoleTag role={au.role}/></td>
                      <td style={{padding:"15px 14px",fontFamily:F.mono,fontWeight:700,color:C.g,fontSize:14}}>{au.days}</td>
                      <td style={{padding:"15px 14px",fontFamily:F.mono,color:C.cy}}>{au.totalMinutes>0?totalJam:"-"}</td>
                      <td style={{padding:"15px 14px",fontFamily:F.mono,color:C.t1}}>{au.totalMinutes>0?avgJam:"-"}</td>
                      <td style={{padding:"15px 14px",fontSize:10.5,color:C.t2}}>{au.records[au.records.length-1]?.checkIn||"-"}</td>
                    </tr>;})}
                  </tbody>
                </table>
              </div>}
          </Card>

          {/* Detail records */}
          <Card noPad style={{overflow:"hidden"}}>
            <div style={{padding:"15px 14px",borderBottom:`1px solid ${C.b0}`,display:"flex",alignItems:"center",gap:8}}>
              <span style={{flex:1,fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1}}>
                Detail Absensi ({attFiltered.length} record)
              </span>
            </div>
            {attFiltered.length===0
              ?<div style={{padding:"24px",textAlign:"center",color:C.t3,fontSize:12}}>Tidak ada data untuk filter ini</div>
              :<div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:520}}>
                  <THead cols={["Tanggal","Pegawai","Role","Bisnis","Jam Masuk","Jam Pulang","Durasi"]}/>
                  <tbody>{attFiltered.sort((a,b)=>{try{return new Date(b.checkIn)-new Date(a.checkIn);}catch{return 0;}}).map((a,i)=>(
                    <tr key={a.id} className="hrow" style={{borderTop:`1px solid ${C.b0}`,background:i%2===0?"transparent":C.bg0}}>
                      <td style={{padding:"14px 13px",fontFamily:F.mono,fontSize:10,color:C.t2,whiteSpace:"nowrap"}}>{a.date}</td>
                      <td style={{padding:"14px 13px",fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
                        <span>{users.find(u=>u.id===a.userId)?.avatar||"🧑"}</span>{a.name}
                      </td>
                      <td style={{padding:"14px 13px"}}><RoleTag role={a.role}/></td>
                      <td style={{padding:"14px 13px"}}><BizChip biz={a.business} sm/></td>
                      <td style={{padding:"14px 13px",fontFamily:F.mono,fontSize:11,color:C.g}}>{a.checkIn}</td>
                      <td style={{padding:"14px 13px",fontFamily:F.mono,fontSize:11,color:a.checkOut?C.t1:C.a}}>
                        {a.checkOut||<span style={{fontSize:10,color:C.a,fontWeight:700}}>● Masih hadir</span>}
                      </td>
                      <td style={{padding:"14px 13px",fontFamily:F.mono,fontSize:11,color:C.cy}}>
                        {calcDur(a)}
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>}
          </Card>
        </div>}

        {/* ── LOG STOK ── */}
        {adminTab==="stoklog"&&(()=>{
          const now3=new Date();
          const slogsFiltered=slogs.filter(l=>{
            const matchBiz=slogBiz==="ALL"||l.business===slogBiz;
            const matchType=slogType==="ALL"||l.type===slogType;
            let matchDate=true;
            if(slogRange!=="all"){
              try{
                const d=new Date(l.date.replace(/(\d+)\/(\d+)\/(\d+),/,"$3-$2-$1 "));
                if(slogRange==="today") matchDate=d.toDateString()===now3.toDateString();
                else if(slogRange==="week"){const w=new Date(now3);w.setDate(w.getDate()-7);matchDate=d>=w;}
                else if(slogRange==="month") matchDate=d.getMonth()===now3.getMonth()&&d.getFullYear()===now3.getFullYear();
                else if(slogRange==="custom"){
                  const from=slogFrom?new Date(slogFrom):null;
                  const to=slogTo?new Date(slogTo+"T23:59:59"):null;
                  if(from&&d<from) matchDate=false;
                  if(to&&d>to) matchDate=false;
                }
              }catch{}
            }
            return matchBiz&&matchType&&matchDate;
          });
          return <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <h2 style={{fontSize:15,fontWeight:800,flex:1}}>Log Stok <span style={{color:C.t2,fontWeight:500,fontSize:13}}>({slogsFiltered.length}/{slogs.length})</span></h2>
            <button onClick={()=>downloadCSV(slogsFiltered,[
              {key:"date",label:"Waktu"},{key:"barcode",label:"Barcode"},
              {key:"name",label:"Nama Produk"},{key:"business",label:"Bisnis",fn:r=>BIZ[r.business]?.name||r.business},
              {key:"type",label:"Tipe"},{key:"qty",label:"Qty"},
              {key:"before",label:"Stok Sebelum"},{key:"after",label:"Stok Sesudah"},
              {key:"by",label:"Oleh"},
            ],"log_stok")} className="press"
              style={{padding:"7px 14px",background:C.g1,border:`1px solid ${C.g}33`,borderRadius:8,
                color:C.g,fontSize:12,fontWeight:700,fontFamily:F.sans}}>
              ⬇ Excel
            </button>
          </div>
          {/* Filter bar */}
          <Card style={{padding:"12px 14px"}}>
            <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center"}}>
              {/* Bisnis */}
              {["ALL","JS_CLOTHING","JB_STORE"].map(b2=><button key={b2} onClick={()=>setSlogBiz(b2)} className="press"
                style={{padding:"5px 11px",borderRadius:7,fontSize:11.5,fontWeight:600,cursor:"pointer",
                  background:slogBiz===b2?(b2==="JB_STORE"?C.p1:b2==="JS_CLOTHING"?C.b1:C.g1):"transparent",
                  border:`1.5px solid ${slogBiz===b2?(b2==="JB_STORE"?C.p:b2==="JS_CLOTHING"?C.b:C.g):C.b0}`,
                  color:slogBiz===b2?(b2==="JB_STORE"?C.p:b2==="JS_CLOTHING"?C.b:C.g):C.t2,fontFamily:F.sans}}>
                {b2==="ALL"?"Semua Bisnis":BIZ[b2]?.name}</button>)}
              <div style={{width:1,height:20,background:C.b0,margin:"0 2px"}}/>
              {/* Tipe */}
              {["ALL","masuk","keluar"].map(t=><button key={t} onClick={()=>setSlogType(t)} className="press"
                style={{padding:"5px 11px",borderRadius:7,fontSize:11.5,fontWeight:600,cursor:"pointer",
                  background:slogType===t?(t==="masuk"?C.g1:t==="keluar"?C.r1:C.a1):"transparent",
                  border:`1.5px solid ${slogType===t?(t==="masuk"?C.g:t==="keluar"?C.r:C.a):C.b0}`,
                  color:slogType===t?(t==="masuk"?C.g:t==="keluar"?C.r:C.a):C.t2,fontFamily:F.sans}}>
                {t==="ALL"?"Semua Tipe":t==="masuk"?"↑ Masuk":"↓ Keluar"}</button>)}
              <div style={{width:1,height:20,background:C.b0,margin:"0 2px"}}/>
              {/* Range */}
              {[["all","Semua"],["today","Hari Ini"],["week","7 Hari"],["month","Bulan Ini"],["custom","Rentang"]].map(([v,l])=>(
                <button key={v} onClick={()=>setSlogRange(v)} className="press"
                  style={{padding:"5px 11px",borderRadius:7,fontSize:11.5,fontWeight:600,cursor:"pointer",
                    background:slogRange===v?C.g1:"transparent",border:`1.5px solid ${slogRange===v?C.g:C.b0}`,
                    color:slogRange===v?C.g:C.t2,fontFamily:F.sans}}>{l}</button>
              ))}
              {slogRange==="custom"&&<div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                <input type="date" value={slogFrom} onChange={e=>setSlogFrom(e.target.value)}
                  style={{padding:"5px 9px",background:C.bg3,border:`1.5px solid ${C.b1}`,borderRadius:8,color:C.t0,fontSize:12,fontFamily:F.sans}}/>
                <span style={{color:C.t2,fontSize:12}}>s/d</span>
                <input type="date" value={slogTo} onChange={e=>setSlogTo(e.target.value)}
                  style={{padding:"5px 9px",background:C.bg3,border:`1.5px solid ${C.b1}`,borderRadius:8,color:C.t0,fontSize:12,fontFamily:F.sans}}/>
              </div>}
            </div>
          </Card>
          {slogsFiltered.length===0
            ?<div style={{textAlign:"center",padding:"48px",color:C.t3}}><div style={{fontSize:40,opacity:.08,marginBottom:10}}>📋</div><p>Tidak ada data untuk filter ini</p></div>
            :<Card noPad style={{overflow:"hidden"}}>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11.5,minWidth:540}}>
                  <THead cols={["Waktu","Produk","Bisnis","Tipe","Qty","Sblm","Ssdh","Oleh"]}/>
                  <tbody>{slogsFiltered.map((l,i)=><tr key={l.id||i} className="hrow" style={{borderTop:`1px solid ${C.b0}`,background:i%2===0?"transparent":C.bg0}}>
                    <td style={{padding:"14px 13px",color:C.t2,fontSize:10,whiteSpace:"nowrap"}}>{l.date}</td>
                    <td style={{padding:"14px 13px",fontWeight:500,fontSize:12}}>{l.name}<div className="mn" style={{fontSize:9,color:C.t3}}>{l.barcode}</div></td>
                    <td style={{padding:"14px 13px"}}><BizChip biz={l.business} sm/></td>
                    <td style={{padding:"14px 13px"}}>
                      <span style={{padding:"2px 8px",borderRadius:20,fontSize:9.5,fontWeight:700,
                        background:l.type==="masuk"?C.g1:C.r1,color:l.type==="masuk"?C.g:C.r,textTransform:"uppercase"}}>{l.type}</span>
                    </td>
                    <td style={{padding:"14px 13px",fontFamily:F.mono,fontWeight:700,color:l.type==="masuk"?C.g:C.r}}>{l.type==="masuk"?"+":"-"}{l.qty}</td>
                    <td style={{padding:"14px 13px",fontFamily:F.mono,fontSize:11}}>{l.before}</td>
                    <td style={{padding:"14px 13px",fontFamily:F.mono,fontWeight:700}}>{l.after}</td>
                    <td style={{padding:"14px 13px",color:C.t2,fontSize:11}}>{l.by}</td>
                  </tr>)}</tbody>
                </table>
              </div>
            </Card>}
        </div>;})()}

        {/* ── GOOGLE SHEETS ── */}
        {adminTab==="sheets"&&<div style={{maxWidth:640,display:"flex",flexDirection:"column",gap:10}}>
          <h2 style={{fontSize:15,fontWeight:800}}>Google Sheets Sync</h2>

          {/* Setup guide */}
          <Card>
            <div style={{fontSize:10,fontWeight:700,color:C.g,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>📋 Cara Setup Google Sheets</div>
            {[
              {n:1,t:"Buat Google Spreadsheet baru",d:"Buka sheets.google.com → Blank spreadsheet → beri nama 'Kasir JE Grup'"},
              {n:2,t:"Buka Apps Script",d:"Di spreadsheet: menu Extensions → Apps Script → hapus kode yang ada"},
              {n:3,t:"Paste kode berikut",d:"Salin kode di bawah dan paste ke editor Apps Script"},
              {n:4,t:"Deploy sebagai Web App",d:"Klik Deploy → New deployment → tipe: Web app → Execute as: Me → Who has access: Anyone → Deploy"},
              {n:5,t:"Salin URL Web App",d:"Salin URL yang muncul (bentuk: https://script.google.com/macros/s/.../exec) dan paste di field di bawah"},
            ].map(s=><div key={s.n} style={{display:"flex",gap:10,marginBottom:10,alignItems:"flex-start"}}>
              <div style={{minWidth:22,height:22,borderRadius:"50%",background:C.g1,border:`1px solid ${C.g}44`,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:C.g,flexShrink:0}}>{s.n}</div>
              <div><div style={{fontSize:12.5,fontWeight:600}}>{s.t}</div><div style={{fontSize:11.5,color:C.t2,marginTop:2,lineHeight:1.6}}>{s.d}</div></div>
            </div>)}
          </Card>

          {/* Apps Script code */}
          <Card noPad style={{overflow:"hidden"}}>
            <div style={{padding:"15px 14px",borderBottom:`1px solid ${C.b0}`,display:"flex",alignItems:"center",gap:8}}>
              <span style={{flex:1,fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1}}>Kode Apps Script</span>
              <button onClick={()=>{navigator.clipboard.writeText(APPSCRIPT_CODE.trim());setCopyDone(true);setTimeout(()=>setCopyDone(false),2000);toast("✓ Kode disalin!","ok");}}
                className="press" style={{padding:"4px 12px",background:copyDone?C.g1:C.bg4,border:`1px solid ${copyDone?C.g:C.b1}`,borderRadius:7,color:copyDone?C.g:C.t1,fontSize:11,fontWeight:700}}>
                {copyDone?"✓ Disalin":"📋 Salin"}
              </button>
            </div>
            <pre style={{padding:"12px 14px",fontSize:11,fontFamily:F.mono,color:C.t2,overflowX:"auto",
              lineHeight:1.7,background:C.bg0,maxHeight:260,overflowY:"auto",whiteSpace:"pre-wrap"}}>
              {APPSCRIPT_CODE.trim()}
            </pre>
          </Card>

          {/* URL & Sync */}
          <Card>
            <div style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Hubungkan & Sinkronkan</div>
            <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
              <input value={gsUrl} onChange={e=>{setGsUrl(e.target.value);localStorage.setItem("je_gs_url",e.target.value);}}
                placeholder="https://script.google.com/macros/s/…/exec"
                style={{flex:1,minWidth:200,padding:"14px 13px",background:C.bg3,border:`1.5px solid ${C.b0}`,
                  borderRadius:10,color:C.t0,fontSize:12,fontFamily:F.mono,transition:"border-color .15s"}}
                onFocus={e=>e.target.style.borderColor=C.g+"88"} onBlur={e=>e.target.style.borderColor=C.b0}/>
              <Btn onClick={async()=>{
                if(!gsUrl){toast("Masukkan URL dulu","warn");return;}
                setGsLoad(true);
                try{const ok=await syncToSheets(gsUrl,users,prods,trxs,slogs,attend);ok?toast("✅ Sinkron berhasil!"):toast("Gagal","err");}
                catch{toast("Tidak bisa terhubung","err");}
                setGsLoad(false);
              }} disabled={gsLoad}>{gsLoad?"⏳ Proses...":"↑ Ekspor"}</Btn>
            </div>
            <div style={{padding:"9px 11px",background:C.a1,borderRadius:8,border:`1px solid ${C.a}22`,fontSize:11.5,color:C.a}}>
              💡 Firebase adalah database utama. Google Sheets bersifat opsional untuk backup & laporan offline.
            </div>
          </Card>

          {/* Data status */}
          <Card>
            <div style={{fontSize:10,fontWeight:700,color:C.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Status Data Firebase</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7}}>
              {[{i:"👥",l:"Pengguna",v:users.length},{i:"📦",l:"Produk",v:prods.length},{i:"💳",l:"Transaksi",v:trxs.length},
                {i:"📋",l:"Log Stok",v:slogs.length},{i:"🕐",l:"Absensi",v:attend.length}].map(s=>(
                <div key={s.l} style={{padding:"10px",background:C.bg3,borderRadius:9,border:`1px solid ${C.b0}`,textAlign:"center"}}>
                  <div style={{fontSize:17,marginBottom:3}}>{s.i}</div>
                  <div className="mn" style={{fontWeight:700,fontSize:17}}>{s.v}</div>
                  <div style={{fontSize:9.5,color:C.t2,marginTop:2}}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:10,padding:"9px 11px",background:C.bg3,borderRadius:8,border:`1px solid ${C.b0}`,fontSize:11.5,color:C.t2,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <span>Project: <b className="mn" style={{color:C.g}}>{loadConfig()?.projectId||"-"}</b></span>
              <button onClick={()=>{clearConfig();setFbReady(false);setFbSetup(true);setScreen("login");}} className="press"
                style={{marginLeft:"auto",padding:"4px 10px",background:C.r1,border:`1px solid ${C.r}33`,borderRadius:6,color:C.r,fontSize:10.5,fontWeight:700}}>
                Reset Config
              </button>
            </div>
          </Card>
        </div>}

      </div>
    </div>;
  }
  return null;
}
