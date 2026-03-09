import { useState, useEffect, useRef, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  loadConfig, saveConfig, clearConfig, initFirebase, isSeeded, seedDatabase,
  subscribeUsers, subscribeProducts, subscribeTransactions, subscribeStockLogs, subscribeAttendance,
  fbAddUser, fbUpdateUser, fbDeleteUser, fbAddProduct, fbUpdateProduct, fbDeleteProduct,
  fbAddTransaction, fbUpdateStock, fbCheckIn, fbCheckOut, syncToSheets,
} from "./firebase.js";

// ─────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────
const BIZ = {
  JS_CLOTHING: { id:"JS_CLOTHING", name:"JS Clothing", desc:"Usaha Konveksi", icon:"👕", color:"#60a5fa", hex:"#60a5fa" },
  JB_STORE:    { id:"JB_STORE",    name:"JB Store",    desc:"Toko Skincare",  icon:"✨", color:"#e879f9", hex:"#e879f9" },
};
const SEED_USERS = [
  { id:1, username:"admin",    password:"admin123", name:"Administrator",  role:"admin", access:["JS_CLOTHING","JB_STORE"], avatar:"👑", active:true, faceDescriptor:null },
  { id:2, username:"kasir.js", password:"kasir123", name:"Kasir JS Cloth", role:"kasir", access:["JS_CLOTHING"],           avatar:"🧑‍💼", active:true, faceDescriptor:null },
  { id:3, username:"kasir.jb", password:"kasir123", name:"Kasir JB Store", role:"kasir", access:["JB_STORE"],              avatar:"👩‍💼", active:true, faceDescriptor:null },
  { id:4, username:"stok.js",  password:"stok123",  name:"Stok JS Cloth",  role:"stok",  access:["JS_CLOTHING"],           avatar:"🧑‍🏭", active:true, faceDescriptor:null },
  { id:5, username:"stok.jb",  password:"stok123",  name:"Stok JB Store",  role:"stok",  access:["JB_STORE"],              avatar:"👩‍🏭", active:true, faceDescriptor:null },
];
const SEED_PRODUCTS = [
  { id:1,  barcode:"JSC001", name:"Kaos Polos S",           price:45000,  hpp:25000, stock:150, category:"Kaos",        business:"JS_CLOTHING" },
  { id:2,  barcode:"JSC002", name:"Kaos Polos M",           price:45000,  hpp:25000, stock:120, category:"Kaos",        business:"JS_CLOTHING" },
  { id:3,  barcode:"JSC003", name:"Kaos Polos L",           price:45000,  hpp:25000, stock:100, category:"Kaos",        business:"JS_CLOTHING" },
  { id:4,  barcode:"JSC004", name:"Kaos Polos XL",          price:50000,  hpp:28000, stock:80,  category:"Kaos",        business:"JS_CLOTHING" },
  { id:5,  barcode:"JSC005", name:"Kemeja Formal M",        price:120000, hpp:72000, stock:60,  category:"Kemeja",      business:"JS_CLOTHING" },
  { id:6,  barcode:"JSC006", name:"Kemeja Formal L",        price:125000, hpp:75000, stock:55,  category:"Kemeja",      business:"JS_CLOTHING" },
  { id:7,  barcode:"JSC007", name:"Celana Chino 30",        price:150000, hpp:90000, stock:40,  category:"Celana",      business:"JS_CLOTHING" },
  { id:8,  barcode:"JSC008", name:"Celana Chino 32",        price:150000, hpp:90000, stock:35,  category:"Celana",      business:"JS_CLOTHING" },
  { id:9,  barcode:"JSC009", name:"Jaket Hoodie M",         price:185000, hpp:110000,stock:30,  category:"Jaket",       business:"JS_CLOTHING" },
  { id:10, barcode:"JSC010", name:"Jaket Hoodie L",         price:190000, hpp:112000,stock:25,  category:"Jaket",       business:"JS_CLOTHING" },
  { id:11, barcode:"JBS001", name:"Somethinc Moisturizer",  price:89000,  hpp:52000, stock:40,  category:"Moisturizer", business:"JB_STORE" },
  { id:12, barcode:"JBS002", name:"Wardah Sunscreen SPF50", price:55000,  hpp:32000, stock:60,  category:"Sunscreen",   business:"JB_STORE" },
  { id:13, barcode:"JBS003", name:"Skintific Serum Vit C",  price:125000, hpp:74000, stock:35,  category:"Serum",       business:"JB_STORE" },
  { id:14, barcode:"JBS004", name:"Cetaphil Face Wash",     price:75000,  hpp:44000, stock:50,  category:"Cleanser",    business:"JB_STORE" },
  { id:15, barcode:"JBS005", name:"Emina Face Toner",       price:42000,  hpp:24000, stock:45,  category:"Toner",       business:"JB_STORE" },
  { id:16, barcode:"JBS006", name:"The Ordinary Niacinam",  price:180000, hpp:105000,stock:20,  category:"Serum",       business:"JB_STORE" },
  { id:17, barcode:"JBS007", name:"Azarine Sunscreen SPF45",price:48000,  hpp:28000, stock:55,  category:"Sunscreen",   business:"JB_STORE" },
  { id:18, barcode:"JBS008", name:"Scarlett Brightening",   price:98000,  hpp:58000, stock:30,  category:"Brightening", business:"JB_STORE" },
];
let NEXT_ID = 200;

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
const rp  = n  => "Rp\u00A0" + Number(n).toLocaleString("id-ID");
const now = () => new Date().toLocaleString("id-ID");
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,5);
const pct = (a,b)=> b===0 ? "0%" : ((a/b)*100).toFixed(1)+"%";
const euclidean = (d1,d2) => Math.sqrt(d1.reduce((s,v,i)=>s+(v-d2[i])**2,0));

// ─────────────────────────────────────────────────────────────
//  DESIGN TOKENS — Obsidian Premium
// ─────────────────────────────────────────────────────────────
const T = {
  // Backgrounds
  bg0:"#02060f",   // deepest
  bg1:"#070e1d",   // page bg
  bg2:"#0c1628",   // card
  bg3:"#111e35",   // elevated card
  bg4:"#16263f",   // hover
  // Borders
  b0:"rgba(255,255,255,0.05)",
  b1:"rgba(255,255,255,0.09)",
  b2:"rgba(255,255,255,0.14)",
  // Text
  t0:"#f4f8ff",    // primary
  t1:"#93aece",    // secondary
  t2:"#4e6a8a",    // muted
  t3:"#2b3f57",    // very muted
  // Accents
  g0:"#00e5a0",    // emerald — primary action
  g1:"rgba(0,229,160,0.12)",
  g2:"rgba(0,229,160,0.06)",
  a0:"#fbbf24",    // amber — money/numbers
  a1:"rgba(251,191,36,0.12)",
  r0:"#fb7185",    // rose — danger
  r1:"rgba(251,113,133,0.12)",
  b_:"#60a5fa",    // blue — JS Clothing
  b_1:"rgba(96,165,250,0.1)",
  p0:"#e879f9",    // fuchsia — JB Store
  p1:"rgba(232,121,249,0.1)",
  cy:"#22d3ee",    // cyan — teal
  cy1:"rgba(34,211,238,0.1)",
  // Typography
  display:"'Plus Jakarta Sans','DM Sans',sans-serif",
  mono:"'Instrument Mono','JetBrains Mono',monospace",
  // Shadows
  shadow:"0 4px 24px rgba(0,0,0,0.5)",
  shadowLg:"0 8px 48px rgba(0,0,0,0.7)",
};

// ─────────────────────────────────────────────────────────────
//  GLOBAL CSS
// ─────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Instrument+Mono:wght@400;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root { color-scheme: dark; --safe-bottom: env(safe-area-inset-bottom, 0px); }
  html { height: 100%; -webkit-tap-highlight-color: transparent; }
  body {
    font-family: ${T.display};
    background: ${T.bg1};
    color: ${T.t0};
    height: 100%;
    -webkit-font-smoothing: antialiased;
    overscroll-behavior: none;
  }
  #root { height: 100%; }
  input, button, select, textarea { font-family: inherit; }
  input:focus, textarea:focus, select:focus { outline: none; }
  button { -webkit-tap-highlight-color: transparent; }
  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${T.bg4}; border-radius: 2px; }
  ::placeholder { color: ${T.t3}; }
  input[type=number]::-webkit-inner-spin-button { opacity: .4; }

  /* Animations */
  @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes slideUp  { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
  @keyframes popIn    { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes scanLine { 0%,100%{top:10%} 50%{top:86%} }
  @keyframes pulse    { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.15)} }
  @keyframes shimmer  { from{background-position:-200% 0} to{background-position:200% 0} }
  @keyframes glow     { 0%,100%{box-shadow:0 0 12px ${T.g0}44} 50%{box-shadow:0 0 24px ${T.g0}88} }

  /* Utility */
  .press { transition: transform .1s; }
  .press:active { transform: scale(0.96); }
  .hrow:hover { background: ${T.bg4} !important; }
  .card-hover { transition: border-color .2s, box-shadow .2s; }
  .card-hover:hover { border-color: ${T.b2} !important; box-shadow: ${T.shadowLg}; }

  /* Mobile tabs */
  .btab { display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 16px;
    background:transparent;border:none;color:${T.t2};cursor:pointer;font-size:10px;
    font-weight:600;letter-spacing:.5px;text-transform:uppercase;transition:.2s;font-family:${T.display};
    -webkit-tap-highlight-color:transparent; }
  .btab.on { color:${T.g0}; }
  .btab .ico { font-size:20px; transition:.2s; }
  .btab.on .ico { filter: drop-shadow(0 0 6px ${T.g0}88); }

  /* Admin tabs */
  .atab { padding:10px 16px;background:transparent;border:none;
    border-bottom:2px solid transparent;color:${T.t2};cursor:pointer;
    font-size:12px;font-weight:600;transition:.15s;white-space:nowrap;font-family:${T.display};
    letter-spacing:.2px; }
  .atab.on { border-bottom-color:${T.g0};color:${T.g0}; }
  .atab:hover:not(.on) { color:${T.t0}; }

  /* Receipt stripe */
  .receipt-stripe {
    background: repeating-linear-gradient(
      -45deg, transparent, transparent 4px,
      rgba(255,255,255,.015) 4px, rgba(255,255,255,.015) 8px
    );
  }

  /* Number display */
  .num { font-family:${T.mono};font-variant-numeric:tabular-nums; }

  /* Safe area */
  .pb-safe { padding-bottom: calc(var(--safe-bottom) + 72px); }
  .bottom-bar { padding-bottom: calc(var(--safe-bottom) + 8px); }
`;

// ─────────────────────────────────────────────────────────────
//  FACE-API LOADER
// ─────────────────────────────────────────────────────────────
const loadScript = url => new Promise((res,rej) => {
  if (document.querySelector(`script[src="${url}"]`)) { setTimeout(res,100); return; }
  const s = document.createElement("script");
  s.src=url; s.onload=res; s.onerror=rej;
  document.head.appendChild(s);
});
let faceAPIReady = false;
const initFaceAPI = async (onProgress) => {
  if (faceAPIReady) return true;
  try {
    onProgress("Memuat library pengenalan wajah...");
    const local = await fetch("/models/face-api.js",{method:"HEAD"}).then(r=>r.ok).catch(()=>false);
    await loadScript(local ? "/models/face-api.js" : "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js");
    const base = local ? "/models" : "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights";
    onProgress("Memuat model deteksi... (1/3)");
    await window.faceapi.nets.tinyFaceDetector.loadFromUri(base);
    onProgress("Memuat model landmark... (2/3)");
    await window.faceapi.nets.faceLandmark68TinyNet.loadFromUri(base);
    onProgress("Memuat model rekognisi... (3/3)");
    await window.faceapi.nets.faceRecognitionNet.loadFromUri(base);
    faceAPIReady = true; return true;
  } catch { return false; }
};

// ─────────────────────────────────────────────────────────────
//  PRIMITIVE COMPONENTS
// ─────────────────────────────────────────────────────────────
function Toast({ n }) {
  if (!n) return null;
  const m = {ok:[T.g1,T.g0,"✓"],err:[T.r1,T.r0,"✕"],warn:[T.a1,T.a0,"⚠"],info:[T.cy1,T.cy,"ℹ"]};
  const [bg,cl,ic] = m[n.type]||m.ok;
  return (
    <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:9999,
      padding:"12px 20px",borderRadius:14,maxWidth:"min(92vw,380px)",width:"max-content",
      background:bg,border:`1px solid ${cl}33`,color:cl,fontSize:13,fontWeight:600,
      lineHeight:1.5,boxShadow:`0 16px 40px rgba(0,0,0,.8), 0 0 0 1px ${cl}22`,
      animation:"fadeUp .25s ease",display:"flex",alignItems:"center",gap:8,backdropFilter:"blur(16px)"}}>
      <span style={{fontSize:16}}>{ic}</span>{n.msg}
    </div>
  );
}

const BizChip = ({biz,sm}) => {
  if(!biz||!BIZ[biz]) return null;
  const b=BIZ[biz],isJ=biz==="JS_CLOTHING";
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,
    padding:sm?"1px 7px":"3px 9px",borderRadius:20,fontSize:sm?10:11,fontWeight:600,
    background:isJ?T.b_1:T.p1,color:isJ?T.b_:T.p0,border:`1px solid ${isJ?T.b_:T.p0}22`}}>
    {b.icon} {b.name}
  </span>;
};

const RoleTag = ({role}) => {
  const m={kasir:[T.cy1,T.cy,"Kasir"],stok:[T.a1,T.a0,"Stok"],admin:[T.p1,T.p0,"Admin"]};
  const [bg,cl,l]=m[role]||m.kasir;
  return <span style={{padding:"2px 8px",borderRadius:20,fontSize:9.5,fontWeight:700,
    letterSpacing:.6,background:bg,color:cl,textTransform:"uppercase"}}>{l}</span>;
};

const Tag = ({label,color=T.g0}) =>
  <span style={{padding:"2px 9px",borderRadius:20,fontSize:10.5,fontWeight:600,
    background:color+"15",color,border:`1px solid ${color}22`,whiteSpace:"nowrap"}}>{label}</span>;

const StockBadge = ({s}) => {
  if(s===0) return <span className="num" style={{color:T.r0,fontWeight:700,fontSize:12}}>0 ✕</span>;
  if(s<10)  return <span className="num" style={{color:T.a0,fontWeight:700,fontSize:12}}>{s} ↓</span>;
  return <span className="num" style={{fontSize:12}}>{s}</span>;
};

function Btn({onClick,children,color=T.g0,outline,ghost,danger,disabled,style:s={},size="md",full}) {
  const sz = {sm:{p:"8px 14px",f:12},md:{p:"11px 20px",f:13},lg:{p:"15px 24px",f:15}}[size];
  const bg = danger?T.r0:outline||ghost?"transparent":disabled?"#1a2a40":color;
  const cl = danger?"#fff":outline?T.t1:ghost?T.t2:disabled?T.t2:color==="#fff"?T.bg1:"#000";
  const bd = danger?T.r0:outline?T.b1:ghost?"transparent":disabled?"#1a2a40":color;
  return (
    <button onClick={onClick} disabled={disabled} className="press"
      style={{padding:sz.p,background:bg,border:`1.5px solid ${bd}`,borderRadius:10,
        color:cl,fontWeight:700,cursor:disabled?"not-allowed":"pointer",fontSize:sz.f,
        transition:"opacity .15s",width:full?"100%":undefined,
        letterSpacing:.2,...s}}>
      {children}
    </button>
  );
}

function Input({value,onChange,type="text",placeholder,disabled,mono,onKeyDown,fref,icon,style:s={},label,suffix}) {
  return (
    <div style={{position:"relative"}}>
      {label && <div style={{fontSize:10,fontWeight:700,color:T.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{label}</div>}
      <div style={{position:"relative",display:"flex",alignItems:"center"}}>
        {icon && <span style={{position:"absolute",left:13,zIndex:1,fontSize:15,pointerEvents:"none",color:T.t2}}>{icon}</span>}
        <input ref={fref} type={type} value={value} onChange={onChange} onKeyDown={onKeyDown}
          placeholder={placeholder} disabled={disabled}
          style={{width:"100%",padding:`13px ${suffix?"40px":"14px"} 13px ${icon?"42px":"14px"}`,
            background:T.bg3,border:`1.5px solid ${T.b0}`,borderRadius:10,
            color:disabled?T.t2:T.t0,fontSize:14,fontFamily:mono?T.mono:T.display,
            transition:"border-color .15s",...s}}
          onFocus={e=>{if(!disabled)e.target.style.borderColor=T.g0+"88";}}
          onBlur={e=>e.target.style.borderColor=T.b0}/>
        {suffix && <span style={{position:"absolute",right:13,color:T.t2,fontSize:12,pointerEvents:"none",fontFamily:T.mono}}>{suffix}</span>}
      </div>
    </div>
  );
}

function Card({children,style:s={},accent,onClick,noPad}) {
  return (
    <div onClick={onClick}
      style={{background:T.bg2,borderRadius:16,border:`1px solid ${accent?accent+"33":T.b0}`,
        padding:noPad?0:"16px 18px",
        boxShadow:accent?`0 0 0 1px ${accent}11,${T.shadow}`:T.shadow,
        cursor:onClick?"pointer":"default",...s}}>
      {children}
    </div>
  );
}

function Divider({my=12}) {
  return <div style={{height:1,background:T.b0,margin:`${my}px 0`}}/>;
}

function Avatar({icon,size=36,color=T.g0}) {
  return <div style={{width:size,height:size,borderRadius:size*0.3,
    background:`${color}15`,border:`1.5px solid ${color}33`,
    display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.5,flexShrink:0}}>
    {icon}
  </div>;
}

// Stat Card
function Stat({icon,label,value,color=T.g0,sub}) {
  return (
    <Card style={{padding:"16px 18px",backgroundImage:`radial-gradient(ellipse at 80% 20%,${color}08,transparent 60%)`}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
        <Avatar icon={icon} size={36} color={color}/>
      </div>
      <div className="num" style={{fontSize:20,fontWeight:700,color,letterSpacing:-0.5}}>{value}</div>
      <div style={{fontSize:11.5,color:T.t2,marginTop:3,fontWeight:500}}>{label}</div>
      {sub&&<div style={{fontSize:10.5,color:T.t3,marginTop:2}}>{sub}</div>}
    </Card>
  );
}

// Page wrapper with padding bottom for mobile nav
function Page({children,style:s={}}) {
  return <div className="pb-safe" style={{flex:1,overflowY:"auto",overflowX:"hidden",...s}}>{children}</div>;
}

// ─────────────────────────────────────────────────────────────
//  TABLE COMPONENT (responsive)
// ─────────────────────────────────────────────────────────────
function THead({cols}) {
  return <thead><tr style={{background:T.bg0}}>
    {cols.map((c,i)=><th key={i} style={{padding:"10px 14px",textAlign:"left",color:T.t3,
      fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:1,
      whiteSpace:"nowrap",borderBottom:`1px solid ${T.b0}`}}>{c}</th>)}
  </tr></thead>;
}

// ─────────────────────────────────────────────────────────────
//  ONLINE INDICATOR
// ─────────────────────────────────────────────────────────────
function OnlineDot({online}) {
  return <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,fontWeight:600,
    color:online?T.g0:T.a0}}>
    <span style={{width:6,height:6,borderRadius:"50%",background:online?T.g0:T.a0,
      flexShrink:0,animation:online?"glow 2s ease infinite":undefined,
      boxShadow:online?`0 0 8px ${T.g0}`:undefined}}/>
    {online?"Online":"Offline"}
  </div>;
}

// ─────────────────────────────────────────────────────────────
//  HEADER
// ─────────────────────────────────────────────────────────────
function Header({title,biz,user,onLogout,onSwitchBiz,onAbsenPulang,hasCheckedIn,online}) {
  const b = BIZ[biz];
  return (
    <header style={{background:`${T.bg2}ee`,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
      borderBottom:`1px solid ${T.b0}`,padding:"0 16px",height:54,
      display:"flex",alignItems:"center",justifyContent:"space-between",
      position:"sticky",top:0,zIndex:200,flexShrink:0,gap:8}}>
      {/* Left */}
      <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
        <div style={{width:28,height:28,borderRadius:8,flexShrink:0,
          background:"linear-gradient(135deg,#00e5a0,#60a5fa)",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🏬</div>
        <div style={{minWidth:0}}>
          <div className="num" style={{fontSize:11,fontWeight:700,letterSpacing:2,
            background:"linear-gradient(90deg,#00e5a0,#60a5fa)",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1.2}}>
            JE GRUP
          </div>
          <div style={{fontSize:10.5,color:T.t2,lineHeight:1.2,
            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:140}}>
            {b ? `${b.icon} ${b.name}` : title}
          </div>
        </div>
      </div>
      {/* Right */}
      <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
        <OnlineDot online={online}/>
        {onSwitchBiz && user?.access?.length > 1 && (
          <button onClick={onSwitchBiz} className="press"
            style={{padding:"5px 10px",background:T.bg3,border:`1px solid ${T.b1}`,
              borderRadius:8,color:T.t1,fontSize:11,fontWeight:600,cursor:"pointer"}}>⇄</button>
        )}
        {onAbsenPulang && hasCheckedIn && (
          <button onClick={onAbsenPulang} className="press"
            style={{padding:"5px 10px",background:T.a1,border:`1px solid ${T.a0}33`,
              borderRadius:8,color:T.a0,fontSize:11,fontWeight:600,cursor:"pointer"}}>🏠</button>
        )}
        <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",
          borderRadius:20,background:T.bg3,border:`1px solid ${T.b0}`}}>
          <span style={{fontSize:14}}>{user?.avatar}</span>
          <span style={{fontSize:11.5,fontWeight:600,maxWidth:80,
            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.name}</span>
          <RoleTag role={user?.role}/>
        </div>
        <button onClick={onLogout} className="press"
          style={{padding:"5px 10px",background:T.bg3,border:`1px solid ${T.b1}`,
            borderRadius:8,color:T.t2,fontSize:11,fontWeight:600,cursor:"pointer"}}>
          Keluar
        </button>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
//  FACE SCAN SCREEN
// ─────────────────────────────────────────────────────────────
function FaceScanScreen({user,onSuccess,onCancel,mode="verify"}) {
  const videoRef=useRef(null),canvasRef=useRef(null),streamRef=useRef(null);
  const detectRef=useRef(null),stableRef=useRef(0);
  const [phase,setPhase]=useState("init");
  const [loadMsg,setLoadMsg]=useState("");
  const [stable,setStable]=useState(0);
  const [msg,setMsg]=useState("");

  const cleanup=useCallback(()=>{clearInterval(detectRef.current);streamRef.current?.getTracks().forEach(t=>t.stop());},[]);
  useEffect(()=>{start();return cleanup;},[]);

  const start=async()=>{
    setPhase("loading");
    const ok=await initFaceAPI(m=>{setLoadMsg(m);});
    if(!ok){setPhase("error");setMsg("Gagal memuat model AI.");return;}
    try{
      setLoadMsg("Mengakses kamera...");
      const stream=await navigator.mediaDevices.getUserMedia({video:{width:480,height:360,facingMode:"user"},audio:false});
      streamRef.current=stream;
      if(videoRef.current){videoRef.current.srcObject=stream;await new Promise(r=>{videoRef.current.onloadedmetadata=r;});videoRef.current.play();}
      setPhase("scanning");
      setMsg(mode==="register"?"Posisikan wajah di dalam bingkai, tahan diam 2 detik":"Posisikan wajah Anda untuk verifikasi");
      startLoop();
    }catch{setPhase("no_camera");setMsg("Izin kamera ditolak. Aktifkan izin kamera di browser.");}
  };

  const startLoop=()=>{
    stableRef.current=0;
    detectRef.current=setInterval(async()=>{
      if(!videoRef.current||!window.faceapi) return;
      const r=await window.faceapi.detectSingleFace(videoRef.current,
        new window.faceapi.TinyFaceDetectorOptions({inputSize:224,scoreThreshold:0.5}))
        .withFaceLandmarks(true).withFaceDescriptor();
      draw(r);
      if(!r){stableRef.current=0;setStable(0);return;}
      stableRef.current++; setStable(stableRef.current);
      if(stableRef.current>=4){
        clearInterval(detectRef.current);
        setPhase("verifying");
        await new Promise(r=>setTimeout(r,900));
        verify(Array.from(r.descriptor));
      }
    },500);
  };

  const draw=(r)=>{
    const v=videoRef.current,c=canvasRef.current;
    if(!v||!c||!window.faceapi) return;
    c.width=v.videoWidth||480; c.height=v.videoHeight||360;
    const ctx=c.getContext("2d"); ctx.clearRect(0,0,c.width,c.height);
    if(r){
      const {x,y,width:w,height:h}=r.detection.box,pad=14;
      ctx.strokeStyle=T.g0; ctx.lineWidth=2; ctx.shadowColor=T.g0; ctx.shadowBlur=10;
      const cl=20;
      [[x-pad,y-pad,1,1],[x+w+pad,y-pad,-1,1],[x-pad,y+h+pad,1,-1],[x+w+pad,y+h+pad,-1,-1]].forEach(([cx,cy,sx,sy])=>{
        ctx.beginPath(); ctx.moveTo(cx+sx*cl,cy); ctx.lineTo(cx,cy); ctx.lineTo(cx,cy+sy*cl); ctx.stroke();
      });
    }
  };

  const verify=(desc)=>{
    if(mode==="register"){onSuccess(desc);return;}
    if(!user.faceDescriptor){
      setPhase("success");setMsg(`Wajah belum terdaftar. Masuk tanpa verifikasi.`);
      setTimeout(()=>{cleanup();onSuccess(null);},1500); return;
    }
    const dist=euclidean(desc,user.faceDescriptor);
    if(dist<0.52){
      setPhase("success");setMsg(`Selamat datang, ${user.name}!`);
      setTimeout(()=>{cleanup();onSuccess(desc);},1500);
    }else{
      setPhase("fail");setMsg("Wajah tidak dikenali. Pastikan pencahayaan cukup.");
    }
  };

  const retry=()=>{setPhase("scanning");stableRef.current=0;setStable(0);startLoop();};
  const sc={scanning:T.b_,verifying:T.a0,success:T.g0,fail:T.r0,error:T.r0,no_camera:T.r0}[phase]||T.t2;
  const sl={init:"Mempersiapkan...",loading:loadMsg,scanning:"Mendeteksi wajah...",verifying:"Memverifikasi...",
    success:"✓ Berhasil",fail:"✗ Gagal",error:"Error",no_camera:"Kamera tidak tersedia"}[phase];

  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,background:`${T.bg0}f5`,
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      padding:16,animation:"fadeIn .25s ease"}}>
      <div style={{width:"100%",maxWidth:440,animation:"fadeUp .3s ease"}}>
        {/* User badge */}
        <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:10,padding:"8px 16px",
            borderRadius:24,background:T.bg2,border:`1px solid ${T.b1}`}}>
            <span style={{fontSize:20}}>{user.avatar}</span>
            <div>
              <div style={{fontSize:13,fontWeight:700}}>{user.name}</div>
              <div style={{display:"flex",gap:4,marginTop:2}}><RoleTag role={user.role}/></div>
            </div>
          </div>
        </div>
        <h2 style={{textAlign:"center",fontSize:18,fontWeight:800,marginBottom:4}}>
          {mode==="register"?"Daftarkan Wajah":"Verifikasi Wajah"}
        </h2>
        <p style={{textAlign:"center",fontSize:12.5,color:T.t2,marginBottom:16}}>{msg||"Mempersiapkan kamera..."}</p>

        {/* Camera */}
        <div style={{position:"relative",borderRadius:20,overflow:"hidden",
          border:`2px solid ${sc}55`,boxShadow:`0 0 0 1px ${sc}22, 0 0 40px ${sc}15`,
          background:"#000",aspectRatio:"4/3",marginBottom:14}}>
          <video ref={videoRef} autoPlay muted playsInline
            style={{width:"100%",height:"100%",objectFit:"cover",transform:"scaleX(-1)"}}/>
          <canvas ref={canvasRef}
            style={{position:"absolute",inset:0,width:"100%",height:"100%",transform:"scaleX(-1)"}}/>
          {phase==="scanning"&&(
            <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
              <div style={{position:"absolute",left:"8%",right:"8%",height:2,
                background:`linear-gradient(90deg,transparent,${T.g0},transparent)`,
                boxShadow:`0 0 12px ${T.g0}`,animation:"scanLine 2.5s ease-in-out infinite"}}/>
            </div>
          )}
          {(phase==="init"||phase==="loading")&&(
            <div style={{position:"absolute",inset:0,background:"rgba(2,6,15,.92)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
              <div style={{width:36,height:36,border:`2.5px solid ${T.bg4}`,borderTopColor:T.g0,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
              <p style={{fontSize:12,color:T.t1,textAlign:"center",padding:"0 24px"}}>{loadMsg}</p>
            </div>
          )}
          {phase==="verifying"&&(
            <div style={{position:"absolute",inset:0,background:"rgba(2,6,15,.8)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}>
              <div style={{width:44,height:44,border:`2.5px solid ${T.a0}44`,borderTopColor:T.a0,borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
              <p style={{fontSize:13,color:T.a0,fontWeight:700}}>Memverifikasi...</p>
            </div>
          )}
          {phase==="success"&&<div style={{position:"absolute",inset:0,background:`${T.g0}0a`,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{fontSize:56,animation:"popIn .3s ease"}}>✅</div></div>}
          {(phase==="fail"||phase==="error"||phase==="no_camera")&&<div style={{position:"absolute",inset:0,background:`${T.r0}08`,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{fontSize:56}}>❌</div></div>}
        </div>

        {/* Progress bar */}
        {phase==="scanning"&&(
          <div style={{height:3,background:T.bg4,borderRadius:2,marginBottom:12,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${Math.min(stable/4*100,100)}%`,
              background:`linear-gradient(90deg,${T.b_},${T.g0})`,borderRadius:2,transition:"width .4s ease"}}/>
          </div>
        )}

        {/* Status row */}
        <div style={{padding:"10px 14px",borderRadius:10,background:T.bg3,border:`1px solid ${sc}22`,
          display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <span style={{width:8,height:8,borderRadius:"50%",background:sc,flexShrink:0,
            animation:phase==="scanning"?"pulse 1.5s ease infinite":undefined}}/>
          <span style={{fontSize:12.5,color:sc,fontWeight:600,flex:1}}>{sl}</span>
        </div>

        <div style={{display:"flex",gap:8,justifyContent:"center"}}>
          {phase==="fail"&&<Btn onClick={retry} size="md" full>Coba Lagi</Btn>}
          {(phase==="error"||phase==="no_camera")&&<Btn onClick={()=>{cleanup();onSuccess(null);}} color={T.a0} size="md">Lewati</Btn>}
          <Btn onClick={()=>{cleanup();onCancel();}} outline size="md">Batal</Btn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  FIREBASE SETUP SCREEN
// ─────────────────────────────────────────────────────────────
function FirebaseSetup({onDone}) {
  const [form,setForm]=useState({apiKey:"",authDomain:"",projectId:"",storageBucket:"",messagingSenderId:"",appId:""});
  const [step,setStep]=useState(1);
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");

  const connect=async()=>{
    if(!form.apiKey||!form.projectId){setErr("API Key dan Project ID wajib diisi.");return;}
    setLoading(true);setErr("");
    const r=await initFirebase(form);
    if(!r.ok){setErr("Koneksi gagal: "+r.error);setLoading(false);return;}
    const seeded=await isSeeded().catch(()=>false);
    if(!seeded) await seedDatabase(SEED_USERS,SEED_PRODUCTS);
    setLoading(false); onDone();
  };

  const FS={width:"100%",padding:"13px 14px",background:T.bg3,border:`1.5px solid ${T.b0}`,
    borderRadius:10,color:T.t0,fontSize:13,fontFamily:T.mono,transition:"border-color .15s"};

  return (
    <div style={{fontFamily:T.display,background:T.bg1,color:T.t0,minHeight:"100vh",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <style>{CSS}</style>
      {/* Ambient */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"10%",left:"5%",width:"40%",paddingBottom:"40%",borderRadius:"50%",
          background:`radial-gradient(circle,${T.g0}08,transparent 70%)`}}/>
        <div style={{position:"absolute",bottom:"10%",right:"5%",width:"35%",paddingBottom:"35%",borderRadius:"50%",
          background:`radial-gradient(circle,${T.b_}06,transparent 70%)`}}/>
        <div style={{position:"absolute",inset:0,
          backgroundImage:`linear-gradient(${T.b0} 1px,transparent 1px),linear-gradient(90deg,${T.b0} 1px,transparent 1px)`,
          backgroundSize:"48px 48px",opacity:.4}}/>
      </div>

      <div style={{position:"relative",width:"100%",maxWidth:520,animation:"fadeUp .4s ease"}}>
        {/* Brand */}
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{display:"inline-flex",width:72,height:72,borderRadius:22,marginBottom:16,
            background:`linear-gradient(135deg,${T.g0}22,${T.b_}22)`,
            border:`1.5px solid ${T.g0}33`,alignItems:"center",justifyContent:"center",fontSize:34,
            boxShadow:`0 0 60px ${T.g0}10`}}>🏬</div>
          <h1 className="num" style={{fontSize:22,fontWeight:700,letterSpacing:3,
            background:`linear-gradient(90deg,${T.g0},${T.b_})`,
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:8}}>
            KASIR JE GRUP
          </h1>
          <div style={{display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap"}}>
            {Object.values(BIZ).map(b=>(
              <span key={b.id} style={{fontSize:11,padding:"3px 12px",borderRadius:20,
                background:b.id==="JS_CLOTHING"?T.b_1:T.p1,color:b.id==="JS_CLOTHING"?T.b_:T.p0,
                border:`1px solid ${(b.id==="JS_CLOTHING"?T.b_:T.p0)}22`,fontWeight:600}}>
                {b.icon} {b.name} · {b.desc}
              </span>
            ))}
          </div>
        </div>

        <Card style={{padding:step===1?"24px":"20px 24px"}}>
          {step===1 ? (
            <>
              <h2 style={{fontSize:15,fontWeight:800,marginBottom:4,color:T.g0}}>🔥 Setup Firebase</h2>
              <p style={{fontSize:12.5,color:T.t2,marginBottom:20,lineHeight:1.7}}>Hubungkan ke database cloud untuk sinkronisasi data real-time di semua tablet.</p>
              {[
                {n:1,t:"Buka Firebase Console",d:"console.firebase.google.com → Add project → nama: kasir-je-grup"},
                {n:2,t:"Daftarkan Web App",d:"Project → klik ikon </> → App nickname: Kasir → Register"},
                {n:3,t:"Salin firebaseConfig",d:"Salin seluruh objek firebaseConfig yang muncul"},
                {n:4,t:"Aktifkan Firestore",d:"Build → Firestore → Create database → test mode → region asia-southeast1"},
                {n:5,t:"Paste config di sini",d:"Klik tombol di bawah dan isi form"},
              ].map(s=>(
                <div key={s.n} style={{display:"flex",gap:12,marginBottom:12,alignItems:"flex-start"}}>
                  <div style={{minWidth:24,height:24,borderRadius:"50%",background:T.g1,
                    border:`1px solid ${T.g0}44`,display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:10.5,fontWeight:700,color:T.g0,flexShrink:0}}>{s.n}</div>
                  <div><div style={{fontSize:13,fontWeight:600}}>{s.t}</div><div style={{fontSize:11.5,color:T.t2,marginTop:2,lineHeight:1.6}}>{s.d}</div></div>
                </div>
              ))}
              <div style={{marginTop:18,padding:"11px 14px",background:T.g2,borderRadius:10,
                border:`1px solid ${T.g0}22`,fontSize:12,color:T.g0,marginBottom:18}}>
                💡 Gratis selamanya — 50K baca & 20K tulis per hari
              </div>
              <div style={{display:"flex",gap:8}}>
                <Btn onClick={()=>setStep(2)} full>Masukkan Firebase Config →</Btn>
                <Btn onClick={()=>window.open("https://console.firebase.google.com","_blank")} outline>Buka ↗</Btn>
              </div>
            </>
          ) : (
            <>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
                <button onClick={()=>setStep(1)} style={{background:"transparent",border:"none",color:T.t2,cursor:"pointer",fontSize:20,lineHeight:1}}>←</button>
                <h2 style={{fontSize:15,fontWeight:800}}>Firebase Config</h2>
              </div>
              <div style={{background:T.bg3,borderRadius:10,padding:"11px 13px",marginBottom:18,
                fontSize:11,fontFamily:T.mono,color:T.t2,lineHeight:1.9,border:`1px solid ${T.b0}`}}>
                <span style={{color:T.t1}}>const firebaseConfig = {"{"}</span><br/>
                &nbsp;&nbsp;<span style={{color:T.cy}}>apiKey</span>: <span style={{color:T.a0}}>"AIzaSy..."</span>,<br/>
                &nbsp;&nbsp;<span style={{color:T.cy}}>projectId</span>: <span style={{color:T.a0}}>"kasir-je-grup"</span>,<br/>
                &nbsp;&nbsp;<span style={{color:T.t3}}>...dll</span><br/>
                <span style={{color:T.t1}}>{"}"}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {[
                  {k:"apiKey",l:"API Key *"},
                  {k:"authDomain",l:"Auth Domain"},
                  {k:"projectId",l:"Project ID *"},
                  {k:"storageBucket",l:"Storage Bucket"},
                  {k:"messagingSenderId",l:"Sender ID"},
                  {k:"appId",l:"App ID"},
                ].map(f=>(
                  <div key={f.k}>
                    <div style={{fontSize:10,fontWeight:700,color:T.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{f.l}</div>
                    <input value={form[f.k]} onChange={e=>setForm(x=>({...x,[f.k]:e.target.value}))} style={FS}
                      placeholder={f.k==="projectId"?"kasir-je-grup":""}
                      onFocus={e=>e.target.style.borderColor=T.g0+"88"} onBlur={e=>e.target.style.borderColor=T.b0}/>
                  </div>
                ))}
              </div>
              {err&&<div style={{marginTop:12,padding:"10px 14px",background:T.r1,borderRadius:8,border:`1px solid ${T.r0}33`,fontSize:12,color:T.r0}}>⚠ {err}</div>}
              <div style={{marginTop:18}}>
                <Btn onClick={connect} disabled={loading} full size="lg">
                  {loading?"⏳ Menghubungkan...":"🔥 Hubungkan Firebase"}
                </Btn>
              </div>
              <p style={{fontSize:11,color:T.t3,textAlign:"center",marginTop:12}}>Config tersimpan di browser. Data wajah tidak dikirim ke cloud.</p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────────────────────
export default function App() {
  // ─── Firebase init ───
  const [fbReady,   setFbReady]   = useState(false);
  const [fbSetup,   setFbSetup]   = useState(false);
  const [fbLoading, setFbLoading] = useState(true);

  const [online, setOnline] = useState(navigator.onLine);
  useEffect(()=>{
    const on=()=>setOnline(true), off=()=>setOnline(false);
    window.addEventListener("online",on); window.addEventListener("offline",off);
    return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off);};
  },[]);

  useEffect(()=>{
    const cfg=loadConfig();
    if(!cfg){setFbLoading(false);setFbSetup(true);return;}
    initFirebase(cfg).then(async r=>{
      if(!r.ok){setFbLoading(false);setFbSetup(true);return;}
      const seeded=await isSeeded().catch(()=>false);
      if(!seeded) await seedDatabase(SEED_USERS,SEED_PRODUCTS);
      setFbReady(true);setFbLoading(false);
    });
  },[]);

  // ─── Firestore data ───
  const [users,   setUsers]  = useState([]);
  const [products,setProds]  = useState([]);
  const [trxList, setTrx]    = useState([]);
  const [sLogs,   setSLogs]  = useState([]);
  const [attend,  setAttend] = useState([]);

  useEffect(()=>{
    if(!fbReady) return;
    const us=[
      subscribeUsers(d=>setUsers(d.map(u=>({...u,faceDescriptor:u.faceDescriptor?new Float32Array(u.faceDescriptor):null})))),
      subscribeProducts(d=>setProds(d)),
      subscribeTransactions(d=>setTrx(d)),
      subscribeStockLogs(d=>setSLogs(d)),
      subscribeAttendance(d=>setAttend(d)),
    ];
    return()=>us.forEach(u=>u());
  },[fbReady]);

  // ─── UI state ───
  const [screen,  setScreen]  = useState("login");
  const [user,    setUser]    = useState(null);
  const [biz,     setBiz]     = useState(null);
  const [notif,   setNotif]   = useState(null);
  const nRef=useRef(null);
  const toast=useCallback((msg,type="ok")=>{
    if(nRef.current) clearTimeout(nRef.current);
    setNotif({msg,type}); nRef.current=setTimeout(()=>setNotif(null),3200);
  },[]);

  // ─── Face scan ───
  const [pendingUser,setPendingUser]=useState(null);
  const [faceReg,    setFaceReg]   =useState(null);

  // ─── Login ───
  const [lf,   setLf]   = useState({u:"",p:""});
  const [lerr, setLerr] = useState("");

  // ─── Kasir ───
  const [cart,    setCart]   = useState([]);
  const [scanIn,  setScanIn] = useState("");
  const [receipt, setReceipt]= useState(null);
  const scanRef=useRef(null);

  // ─── Stok ───
  const [stokScan,  setStokScan]  = useState("");
  const [stokSearch,setStokSearch]= useState("");
  const [stokTarget,setStokTarget]= useState(null);
  const [stokQty,   setStokQty]   = useState("");
  const [stokPrice, setStokPrice] = useState("");
  const stokScanRef=useRef(null);
  const stokQtyRef =useRef(null);

  // ─── Admin ───
  const [adminTab,  setAdminTab]  = useState("users");
  const [adminBiz,  setAdminBiz]  = useState("JS_CLOTHING");
  const [searchQ,   setSearchQ]   = useState("");
  const [reportBiz, setReportBiz] = useState("ALL");
  const [attMonth,  setAttMonth]  = useState(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;});
  const [gsUrl,     setGsUrl]     = useState(()=>localStorage.getItem("je_gs_url")||"");
  const [gsLoad,    setGsLoad]    = useState(false);
  const [uModal,setUModal]=useState(false); const [uForm,setUForm]=useState({}); const [editUid,setEditUid]=useState(null);
  const [pModal,setPModal]=useState(false); const [pForm,setPForm]=useState({}); const [editPid,setEditPid]=useState(null);

  // ─── Auto focus ───
  useEffect(()=>{if(screen==="kasir"&&!receipt)setTimeout(()=>scanRef.current?.focus(),100);},[screen,receipt]);
  useEffect(()=>{if(screen==="stok")setTimeout(()=>stokScanRef.current?.focus(),100);},[screen]);
  useEffect(()=>{if(stokTarget)setTimeout(()=>stokQtyRef.current?.focus(),100);},[stokTarget]);

  const bizProds=(b=biz)=>products.filter(p=>p.business===b);
  const todayStr=new Date().toLocaleDateString("id-ID");
  const myAtt=user?attend.find(a=>a.userId===user.id&&a.date===todayStr):null;
  const hasCheckedIn=!!myAtt&&!myAtt.checkOut;

  // ─── Attendance ───
  const doCheckIn=async(u,b)=>{
    const rec={id:"ATT-"+uid(),userId:u.id,username:u.username,name:u.name,role:u.role,
      business:b||u.access[0],date:todayStr,checkIn:now(),checkOut:null};
    await fbCheckIn(rec).catch(()=>{});
    return rec;
  };
  const doCheckOut=async()=>{
    if(!myAtt) return;
    await fbCheckOut(myAtt.id,now()).catch(()=>{});
    toast("✅ Absen pulang tercatat!");
  };

  // ─── Login ───
  const doLogin=()=>{
    const u=users.find(x=>x.username===lf.u&&x.password===lf.p&&x.active);
    if(!u){setLerr("Username / password salah atau akun nonaktif.");return;}
    setLerr("");
    if(u.role==="admin"){setUser(u);setBiz(u.access[0]);setAdminTab("users");setScreen("admin");}
    else{setPendingUser(u);setScreen("facescan");}
  };

  const afterFace=async(u)=>{
    setUser(u);setPendingUser(null);
    if(u.access.length===1){
      const b=u.access[0];setBiz(b);await doCheckIn(u,b);
      setScreen(u.role==="kasir"?"kasir":"stok");
    }else setScreen("bizselect");
  };

  const doLogout=()=>{
    setUser(null);setBiz(null);setScreen("login");
    setCart([]);setScanIn("");setLf({u:"",p:""});setLerr("");setStokTarget(null);
  };
  const handleAbsenPulang=async()=>{await doCheckOut();setTimeout(doLogout,1500);};

  // ─── Kasir ───
  const kasirScan=useCallback(async(bc)=>{
    bc=bc.trim();if(!bc) return;
    const p=products.find(x=>x.barcode===bc&&x.business===biz);
    if(!p){toast("Barcode tidak ditemukan: "+bc,"err");setScanIn("");return;}
    if(p.stock===0){toast("Stok "+p.name+" habis!","warn");setScanIn("");return;}
    setCart(prev=>{
      const ex=prev.find(c=>c.barcode===bc);
      if(ex){if(ex.qty>=p.stock){toast("Stok tidak mencukupi","warn");return prev;}
             return prev.map(c=>c.barcode===bc?{...c,qty:c.qty+1}:c);}
      return [...prev,{id:p.id,barcode:p.barcode,name:p.name,price:p.price,hpp:p.hpp||0,stock:p.stock,qty:1}];
    });
    toast("✓ "+p.name);setScanIn("");scanRef.current?.focus();
  },[products,biz,toast]);

  const doCheckout=useCallback(async()=>{
    if(!cart.length) return;
    const total=cart.reduce((s,c)=>s+c.price*c.qty,0);
    const totalHpp=cart.reduce((s,c)=>s+(c.hpp||0)*c.qty,0);
    const trx={id:"TRX-"+uid().toUpperCase(),date:now(),kasir:user.name,business:biz,
      items:[...cart],total,totalHpp,profit:total-totalHpp};
    const stockUpdates=cart.map(c=>({productId:c.id,newStock:c.stock-c.qty}));
    const logs=cart.map(c=>({id:"LOG-"+uid(),date:now(),barcode:c.barcode,name:c.name,
      type:"keluar",qty:c.qty,before:c.stock,after:c.stock-c.qty,by:user.name,business:biz}));
    try{await fbAddTransaction(trx,stockUpdates,logs);setCart([]);setReceipt(trx);toast("✅ Transaksi berhasil! "+rp(total));}
    catch(e){toast("Gagal: "+e.message,"err");}
  },[cart,user,biz,toast]);

  // ─── Stok ───
  const stokScanFn=useCallback((bc)=>{
    bc=bc.trim();if(!bc) return;
    const p=products.find(x=>x.barcode===bc&&x.business===biz);
    if(!p){toast("Barcode tidak ditemukan: "+bc,"err");setStokScan("");return;}
    setStokTarget(p);setStokQty("");setStokPrice("");setStokScan("");
  },[products,biz,toast]);

  const doAddStock=useCallback(async()=>{
    const q=parseInt(stokQty);
    if(!stokTarget||!q||q<=0){toast("Masukkan jumlah yang valid","warn");return;}
    const ns=stokTarget.stock+q;
    const log={id:"LOG-"+uid(),date:now(),barcode:stokTarget.barcode,name:stokTarget.name,
      type:"masuk",qty:q,before:stokTarget.stock,after:ns,by:user.name,business:biz};
    try{
      const np=stokPrice&&+stokPrice>0?+stokPrice:undefined;
      await fbUpdateStock(stokTarget.id,ns,np,log);
      toast(`✓ ${stokTarget.name}: ${stokTarget.stock} → ${ns}`);
    }catch(e){toast("Gagal: "+e.message,"err");}
    setStokTarget(null);setStokQty("");setStokPrice("");stokScanRef.current?.focus();
  },[stokTarget,stokQty,stokPrice,user,biz,toast]);

  // ─── Face reg ───
  const handleFaceReg=async(desc)=>{
    if(!faceReg) return;
    const u=users.find(x=>x.id===faceReg);if(!u) return;
    await fbUpdateUser(u.id,{...u,faceDescriptor:Array.from(desc)});
    setFaceReg(null);toast("✅ Data wajah terdaftar!");
  };

  // ─────────────────────────────────────────────
  //  SCREENS: Loading / Setup / Face
  // ─────────────────────────────────────────────
  if(fbLoading) return (
    <div style={{fontFamily:T.display,background:T.bg1,color:T.t0,height:"100vh",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
      <style>{CSS}</style>
      <div style={{width:44,height:44,border:`2.5px solid ${T.bg4}`,borderTopColor:T.g0,
        borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <div style={{textAlign:"center"}}>
        <div className="num" style={{fontSize:16,fontWeight:700,letterSpacing:2,
          background:`linear-gradient(90deg,${T.g0},${T.b_})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>
          KASIR JE GRUP</div>
        <p style={{fontSize:12,color:T.t2}}>Menghubungkan database...</p>
      </div>
    </div>
  );

  if(fbSetup||!fbReady) return (
    <FirebaseSetup onDone={()=>{setFbReady(true);setFbSetup(false);setFbLoading(false);}}/>
  );

  if(screen==="facescan"&&pendingUser) return (
    <div style={{fontFamily:T.display,color:T.t0,height:"100vh",background:T.bg1}}>
      <style>{CSS}</style><Toast n={notif}/>
      <FaceScanScreen user={pendingUser} mode="verify"
        onSuccess={()=>afterFace(pendingUser)} onCancel={()=>{setPendingUser(null);setScreen("login");}}/>
    </div>
  );

  if(faceReg){
    const tu=users.find(u=>u.id===faceReg);
    return (
      <div style={{fontFamily:T.display,color:T.t0,height:"100vh",background:T.bg1}}>
        <style>{CSS}</style><Toast n={notif}/>
        <FaceScanScreen user={tu} mode="register" onSuccess={handleFaceReg} onCancel={()=>setFaceReg(null)}/>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  //  LOGIN SCREEN
  // ─────────────────────────────────────────────
  if(screen==="login") return (
    <div style={{fontFamily:T.display,background:T.bg1,color:T.t0,minHeight:"100vh",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <style>{CSS}</style><Toast n={notif}/>
      {/* Background */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-15%",right:"-10%",width:"55%",paddingBottom:"55%",borderRadius:"50%",
          background:`radial-gradient(circle,${T.g0}07,transparent 70%)`}}/>
        <div style={{position:"absolute",bottom:"-10%",left:"-5%",width:"45%",paddingBottom:"45%",borderRadius:"50%",
          background:`radial-gradient(circle,${T.b_}05,transparent 70%)`}}/>
        <div style={{position:"absolute",inset:0,
          backgroundImage:`linear-gradient(${T.b0} 1px,transparent 1px),linear-gradient(90deg,${T.b0} 1px,transparent 1px)`,
          backgroundSize:"48px 48px",opacity:.35}}/>
      </div>

      <div style={{position:"relative",width:"100%",maxWidth:400,animation:"fadeUp .4s ease"}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{display:"inline-flex",width:76,height:76,borderRadius:24,
            background:`linear-gradient(135deg,${T.g0}20,${T.b_}18)`,
            border:`1.5px solid ${T.g0}30`,alignItems:"center",justifyContent:"center",
            fontSize:36,marginBottom:16,boxShadow:`0 0 50px ${T.g0}12`}}>🏬</div>
          <h1 className="num" style={{fontSize:24,fontWeight:700,letterSpacing:3,
            background:`linear-gradient(90deg,${T.g0} 0%,${T.b_} 55%,${T.p0} 100%)`,
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:12}}>
            KASIR JE GRUP
          </h1>
          <div style={{display:"flex",justifyContent:"center",gap:7,flexWrap:"wrap",marginBottom:10}}>
            {Object.values(BIZ).map(b=>(
              <span key={b.id} style={{fontSize:11,padding:"3px 12px",borderRadius:20,fontWeight:600,
                background:b.id==="JS_CLOTHING"?T.b_1:T.p1,
                color:b.id==="JS_CLOTHING"?T.b_:T.p0,
                border:`1px solid ${(b.id==="JS_CLOTHING"?T.b_:T.p0)}22`}}>
                {b.icon} {b.name}
              </span>
            ))}
          </div>
          <OnlineDot online={online}/>
        </div>

        {/* Card */}
        <Card style={{padding:"28px 24px"}}>
          <h2 style={{fontSize:16,fontWeight:800,marginBottom:4}}>Masuk ke Sistem</h2>
          <p style={{fontSize:12.5,color:T.t2,marginBottom:22,lineHeight:1.6}}>Pegawai akan diminta verifikasi wajah setelah memasukkan kredensial.</p>

          <div style={{marginBottom:14}}>
            <Input value={lf.u} onChange={e=>setLf(x=>({...x,u:e.target.value}))}
              onKeyDown={e=>e.key==="Enter"&&doLogin()}
              placeholder="Username" icon="👤" label="Username" mono/>
          </div>
          <div style={{marginBottom:18}}>
            <Input value={lf.p} onChange={e=>setLf(x=>({...x,p:e.target.value}))}
              type="password" onKeyDown={e=>e.key==="Enter"&&doLogin()}
              placeholder="••••••••" icon="🔒" label="Password"/>
          </div>

          {lerr&&<div style={{padding:"10px 14px",background:T.r1,borderRadius:8,border:`1px solid ${T.r0}33`,
            fontSize:12.5,color:T.r0,marginBottom:16,display:"flex",gap:8}}>
            <span>⚠</span><span>{lerr}</span>
          </div>}

          <button onClick={doLogin} className="press" style={{width:"100%",padding:"15px",
            background:`linear-gradient(90deg,${T.g0},${T.b_})`,border:"none",
            borderRadius:12,color:T.bg1,fontSize:14,fontWeight:800,cursor:"pointer",letterSpacing:.5,
            boxShadow:`0 4px 24px ${T.g0}30`}}>
            MASUK SEKARANG →
          </button>

          <Divider my={18}/>
          <div style={{padding:"12px 14px",background:T.bg3,borderRadius:10,border:`1px solid ${T.b0}`,
            fontSize:12,color:T.t2,lineHeight:1.8}}>
            <span style={{color:T.p0,fontWeight:700}}>👑 Admin</span> — masuk tanpa scan wajah<br/>
            <span style={{color:T.cy,fontWeight:700}}>🧑 Kasir / Stok</span> — verifikasi wajah diperlukan
          </div>
        </Card>

        <button onClick={()=>{clearConfig();setFbReady(false);setFbSetup(true);}}
          style={{display:"block",margin:"14px auto 0",background:"transparent",border:"none",
            color:T.t3,cursor:"pointer",fontSize:11,textDecoration:"underline"}}>
          Ganti Firebase Project
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────
  //  PILIH BISNIS
  // ─────────────────────────────────────────────
  if(screen==="bizselect") return (
    <div style={{fontFamily:T.display,background:T.bg1,color:T.t0,minHeight:"100vh",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <style>{CSS}</style><Toast n={notif}/>
      <div style={{width:"100%",maxWidth:420,animation:"fadeUp .35s ease"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:40,marginBottom:8}}>{user?.avatar}</div>
          <p style={{fontSize:18,fontWeight:800}}>{user?.name}</p>
          <p style={{fontSize:13,color:T.t2,marginTop:4}}>Pilih bisnis yang ingin dikelola hari ini</p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {user?.access?.map(bizId=>{
            const b=BIZ[bizId],isJ=bizId==="JS_CLOTHING";
            return (
              <button key={bizId} className="press" onClick={async()=>{setBiz(bizId);await doCheckIn(user,bizId);setScreen(user.role==="kasir"?"kasir":"stok");}}
                style={{padding:"20px",background:T.bg2,border:`1.5px solid ${T.b0}`,borderRadius:18,
                  cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:16,
                  transition:"border-color .2s,background .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=b.color+"66";e.currentTarget.style.background=T.bg3;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.b0;e.currentTarget.style.background=T.bg2;}}>
                <div style={{width:56,height:56,borderRadius:16,flexShrink:0,
                  background:isJ?T.b_1:T.p1,border:`2px solid ${b.color}33`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>
                  {b.icon}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:16,fontWeight:800,color:b.color}}>{b.name}</div>
                  <div style={{fontSize:12,color:T.t2,marginTop:3}}>{b.desc}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div className="num" style={{fontSize:22,fontWeight:700,color:b.color}}>{bizProds(bizId).length}</div>
                  <div style={{fontSize:10,color:T.t3}}>produk</div>
                </div>
              </button>
            );
          })}
        </div>
        <button onClick={doLogout} style={{width:"100%",marginTop:14,padding:"12px",background:"transparent",
          border:`1px solid ${T.b0}`,borderRadius:10,color:T.t2,cursor:"pointer",fontSize:13,fontFamily:T.display}}>
          ← Kembali ke Login
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────
  //  KASIR SCREEN
  // ─────────────────────────────────────────────
  if(screen==="kasir") {
    const total=cart.reduce((s,c)=>s+c.price*c.qty,0);
    const totalHpp=cart.reduce((s,c)=>s+(c.hpp||0)*c.qty,0);
    const b=BIZ[biz], bc=biz==="JS_CLOTHING"?T.b_:T.p0;

    return (
      <div style={{fontFamily:T.display,background:T.bg1,color:T.t0,height:"100vh",
        display:"flex",flexDirection:"column"}}>
        <style>{CSS}</style><Toast n={notif}/>
        <Header title="Point of Sale" biz={biz} user={user} online={online}
          onLogout={doLogout}
          onSwitchBiz={user?.access?.length>1?()=>{setCart([]);setScreen("bizselect");}:null}
          onAbsenPulang={handleAbsenPulang} hasCheckedIn={hasCheckedIn}/>

        {/* Receipt Modal */}
        {receipt&&(
          <div style={{position:"fixed",inset:0,background:"rgba(2,6,15,.85)",zIndex:500,
            display:"flex",alignItems:"flex-end",justifyContent:"center"}}
            onClick={()=>{setReceipt(null);scanRef.current?.focus();}}>
            <div style={{width:"100%",maxWidth:420,background:T.bg2,
              borderRadius:"24px 24px 0 0",padding:"24px 22px 32px",
              border:`1px solid ${T.b1}`,borderBottom:"none",
              animation:"slideUp .3s ease",boxShadow:`0 -20px 60px rgba(0,0,0,.8)`}}
              onClick={e=>e.stopPropagation()}>
              {/* Handle */}
              <div style={{width:40,height:4,borderRadius:2,background:T.b1,margin:"0 auto 20px"}}/>
              <div style={{textAlign:"center",marginBottom:16}}>
                <div style={{fontSize:44,marginBottom:10}}>🎉</div>
                <div className="num" style={{fontSize:11,color:T.g0,fontWeight:700,letterSpacing:2,marginBottom:4}}>
                  TRANSAKSI BERHASIL
                </div>
                <div className="num" style={{fontSize:10,color:T.t2}}>{receipt.id} · {receipt.date}</div>
                <div style={{marginTop:6}}><BizChip biz={biz}/></div>
              </div>
              <div className="receipt-stripe" style={{borderRadius:10,padding:"14px 16px",marginBottom:12,
                background:T.bg3,border:`1px solid ${T.b0}`}}>
                {receipt.items.map(item=>(
                  <div key={item.barcode} style={{display:"flex",justifyContent:"space-between",
                    fontSize:13,marginBottom:8,gap:8}}>
                    <span style={{color:T.t1,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name} ×{item.qty}</span>
                    <span className="num" style={{flexShrink:0}}>{rp(item.price*item.qty)}</span>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
                <span style={{fontSize:14,color:T.t1}}>Total Pembayaran</span>
                <span className="num" style={{fontSize:24,fontWeight:700,color:T.g0}}>{rp(receipt.total)}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:T.t2,marginBottom:20}}>
                <span>Estimasi Laba Kotor</span>
                <span className="num" style={{color:T.cy}}>+{rp(receipt.profit)}</span>
              </div>
              <button onClick={()=>{setReceipt(null);scanRef.current?.focus();}} className="press"
                style={{width:"100%",padding:"15px",background:`linear-gradient(90deg,${T.g0},${T.b_})`,
                  border:"none",borderRadius:14,color:T.bg1,fontSize:14,fontWeight:800,cursor:"pointer",
                  boxShadow:`0 4px 24px ${T.g0}30`}}>
                Transaksi Baru →
              </button>
            </div>
          </div>
        )}

        {/* Main layout: mobile=stacked, tablet=side-by-side */}
        <div style={{flex:1,display:"flex",overflow:"hidden",flexDirection:"row"}}>
          {/* Left: Scan + Cart */}
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
            {/* Scan input */}
            <div style={{padding:"10px 12px",background:T.bg2,borderBottom:`1px solid ${T.b0}`,flexShrink:0}}>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <div style={{flex:1,position:"relative"}}>
                  <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:16,pointerEvents:"none",zIndex:1}}>📷</span>
                  <input ref={scanRef} value={scanIn}
                    onChange={e=>setScanIn(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&kasirScan(scanIn)}
                    placeholder="Scan barcode..."
                    style={{width:"100%",padding:"13px 13px 13px 44px",background:T.bg3,
                      border:`2px solid ${bc}55`,borderRadius:12,color:T.t0,fontSize:14,
                      fontFamily:T.mono,boxShadow:`0 0 0 4px ${bc}0a`}}/>
                </div>
                <button onClick={()=>kasirScan(scanIn)} className="press"
                  style={{padding:"13px 16px",background:bc,border:"none",borderRadius:12,
                    color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",flexShrink:0,
                    boxShadow:`0 4px 16px ${bc}40`}}>
                  +
                </button>
              </div>
            </div>

            {/* Cart items */}
            <div style={{flex:1,overflowY:"auto",padding:12,display:"flex",flexDirection:"column",gap:8}}>
              {cart.length===0?(
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                  flex:1,gap:12,padding:"40px 20px"}}>
                  <div style={{fontSize:52,opacity:.1}}>🛒</div>
                  <div style={{textAlign:"center"}}>
                    <p style={{fontSize:14,fontWeight:600,color:T.t1}}>Keranjang kosong</p>
                    <p style={{fontSize:12,color:T.t3,marginTop:4}}>Scan barcode {b.name} untuk mulai</p>
                  </div>
                </div>
              ):(
                cart.map(item=>(
                  <div key={item.barcode} style={{background:T.bg2,borderRadius:14,
                    border:`1px solid ${T.b0}`,padding:"12px 14px",
                    display:"flex",alignItems:"center",gap:10,animation:"fadeUp .15s ease"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:13,
                        overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                      <div className="num" style={{color:T.t2,fontSize:10,marginTop:2}}>{item.barcode}</div>
                    </div>
                    {/* Qty controls */}
                    <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                      <button onClick={()=>setCart(p=>{const it=p.find(c=>c.barcode===item.barcode);return it.qty<=1?p.filter(c=>c.barcode!==item.barcode):p.map(c=>c.barcode===item.barcode?{...c,qty:c.qty-1}:c);})}
                        className="press" style={{width:30,height:30,background:T.bg4,border:`1px solid ${T.b1}`,
                          borderRadius:8,color:T.t0,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                      <span className="num" style={{minWidth:26,textAlign:"center",fontWeight:700,fontSize:14}}>{item.qty}</span>
                      <button onClick={()=>setCart(p=>p.map(c=>c.barcode===item.barcode&&c.qty<c.stock?{...c,qty:c.qty+1}:c))}
                        className="press" style={{width:30,height:30,background:T.bg4,border:`1px solid ${T.b1}`,
                          borderRadius:8,color:T.t0,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                    </div>
                    <div className="num" style={{fontWeight:700,color:T.a0,fontSize:13,minWidth:80,textAlign:"right",flexShrink:0}}>
                      {rp(item.price*item.qty)}
                    </div>
                    <button onClick={()=>setCart(p=>p.filter(c=>c.barcode!==item.barcode))}
                      className="press" style={{background:"transparent",border:"none",color:T.t3,cursor:"pointer",
                        fontSize:18,padding:"0 2px",flexShrink:0}}>×</button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right panel: summary (hidden on very small, visible tablet+) */}
          <div style={{width:240,background:T.bg2,borderLeft:`1px solid ${T.b0}`,
            display:"flex",flexDirection:"column",padding:14,flexShrink:0,
            '@media(maxWidth:600px)':{display:"none"}}}>
            <div style={{padding:"10px 12px",borderRadius:12,marginBottom:14,textAlign:"center",
              background:biz==="JS_CLOTHING"?T.b_1:T.p1,border:`1px solid ${bc}22`}}>
              <span style={{fontSize:12.5,color:bc,fontWeight:700}}>{b.icon} {b.name}</span>
            </div>
            <div style={{flex:1}}>
              {[{l:"Produk",v:cart.length},{l:"Total Item",v:cart.reduce((s,c)=>s+c.qty,0)}].map(r=>(
                <div key={r.l} style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:13}}>
                  <span style={{color:T.t2}}>{r.l}</span>
                  <span className="num">{r.v}</span>
                </div>
              ))}
              <Divider/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
                <span style={{fontSize:13,color:T.t1}}>Total</span>
                <span className="num" style={{fontSize:20,fontWeight:700,color:T.g0}}>{rp(total)}</span>
              </div>
              {cart.length>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.t2}}>
                <span>Est. Laba</span>
                <span className="num" style={{color:T.cy}}>+{rp(total-totalHpp)}</span>
              </div>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:14}}>
              <button onClick={doCheckout} disabled={!cart.length} className="press"
                style={{padding:"15px",background:cart.length?`linear-gradient(90deg,${T.g0},${T.b_})`:T.bg3,
                  border:"none",borderRadius:12,color:cart.length?T.bg1:T.t2,fontSize:13,fontWeight:800,
                  cursor:cart.length?"pointer":"not-allowed",
                  boxShadow:cart.length?`0 4px 20px ${T.g0}30`:undefined}}>
                💳 BAYAR
              </button>
              <button onClick={()=>setCart([])}
                style={{padding:"8px",background:"transparent",border:`1px solid ${T.b0}`,
                  borderRadius:8,color:T.t3,fontSize:11,cursor:"pointer",fontFamily:T.display}}>
                Bersihkan
              </button>
            </div>
            {/* Recent trx */}
            <Divider my={10}/>
            <div style={{fontSize:10,color:T.t3,textTransform:"uppercase",letterSpacing:1,marginBottom:8,fontWeight:700}}>Terbaru</div>
            {trxList.filter(t=>t.business===biz).slice(0,4).map(t=>(
              <div key={t.id} style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:11}}>
                <span className="num" style={{color:T.t2}}>{t.id?.slice(-8)}</span>
                <span className="num" style={{color:T.g0}}>{rp(t.total)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile-only sticky bottom: total + bayar */}
        <div style={{background:`${T.bg2}f8`,backdropFilter:"blur(16px)",
          borderTop:`1px solid ${T.b0}`,padding:"12px 14px",
          paddingBottom:`calc(12px + var(--safe-bottom))`,flexShrink:0,
          display:"flex",alignItems:"center",gap:10}}>
          <div style={{flex:1}}>
            <div style={{fontSize:10.5,color:T.t2,fontWeight:600}}>Total</div>
            <div className="num" style={{fontSize:20,fontWeight:700,color:T.g0,lineHeight:1.2}}>{rp(total)}</div>
          </div>
          <button onClick={doCheckout} disabled={!cart.length} className="press"
            style={{padding:"14px 28px",background:cart.length?`linear-gradient(90deg,${T.g0},${T.b_})`:T.bg3,
              border:"none",borderRadius:14,color:cart.length?T.bg1:T.t2,fontSize:14,fontWeight:800,
              cursor:cart.length?"pointer":"not-allowed",flexShrink:0,
              boxShadow:cart.length?`0 4px 20px ${T.g0}30`:undefined}}>
            💳 BAYAR
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  //  STOK SCREEN
  // ─────────────────────────────────────────────
  if(screen==="stok") {
    const bc=biz==="JS_CLOTHING"?T.b_:T.p0, b=BIZ[biz];
    const filtered=bizProds().filter(p=>!stokSearch||
      p.name.toLowerCase().includes(stokSearch.toLowerCase())||p.barcode.includes(stokSearch));

    return (
      <div style={{fontFamily:T.display,background:T.bg1,color:T.t0,height:"100vh",display:"flex",flexDirection:"column"}}>
        <style>{CSS}</style><Toast n={notif}/>
        <Header title="Manajemen Stok" biz={biz} user={user} online={online}
          onLogout={doLogout}
          onSwitchBiz={user?.access?.length>1?()=>{setStokTarget(null);setScreen("bizselect");}:null}
          onAbsenPulang={handleAbsenPulang} hasCheckedIn={hasCheckedIn}/>

        <Page style={{padding:12,display:"flex",flexDirection:"column",gap:10}}>
          {/* Scan bar */}
          <Card noPad style={{overflow:"hidden"}}>
            <div style={{padding:"12px 14px",borderBottom:`1px solid ${T.b0}`,
              display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:10,fontWeight:700,color:T.t2,textTransform:"uppercase",
                letterSpacing:1,flex:1}}>📷 Scan Barcode</span>
              <BizChip biz={biz}/>
            </div>
            <div style={{padding:"12px 14px",display:"flex",gap:8}}>
              <div style={{flex:1,position:"relative"}}>
                <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",
                  fontSize:16,pointerEvents:"none",zIndex:1}}>📷</span>
                <input ref={stokScanRef} value={stokScan}
                  onChange={e=>setStokScan(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&stokScanFn(stokScan)}
                  placeholder="Scan barcode atau ketik manual..."
                  style={{width:"100%",padding:"13px 13px 13px 44px",background:T.bg3,
                    border:`2px solid ${bc}44`,borderRadius:12,color:T.t0,fontSize:14,fontFamily:T.mono}}/>
              </div>
              <button onClick={()=>stokScanFn(stokScan)} className="press"
                style={{padding:"13px 16px",background:bc,border:"none",borderRadius:12,
                  color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",flexShrink:0}}>
                Scan
              </button>
            </div>
          </Card>

          {/* Input stok modal-style card */}
          {stokTarget&&(
            <Card accent={bc} style={{animation:"fadeUp .2s ease"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:16,fontWeight:800,marginBottom:4,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{stokTarget.name}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <span className="num" style={{color:T.t2,fontSize:10}}>{stokTarget.barcode}</span>
                    <Tag label={stokTarget.category} color={T.t1}/>
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
                  <div style={{fontSize:10,color:T.t2,marginBottom:2}}>Stok Saat Ini</div>
                  <div className="num" style={{fontSize:34,fontWeight:800,lineHeight:1,
                    color:stokTarget.stock<10?T.r0:T.t0}}>{stokTarget.stock}</div>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <div style={{padding:"12px",background:T.bg3,borderRadius:10,border:`1px solid ${T.b0}`}}>
                  <div style={{fontSize:10,color:T.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:4,fontWeight:700}}>Harga Jual</div>
                  <div className="num" style={{fontWeight:700,color:T.g0,fontSize:15}}>{rp(stokTarget.price)}</div>
                </div>
                <div style={{padding:"12px",background:T.g2,borderRadius:10,border:`1px solid ${T.g0}22`}}>
                  <div style={{fontSize:10,color:T.g0,textTransform:"uppercase",letterSpacing:.5,marginBottom:4,fontWeight:700}}>Mode</div>
                  <div style={{fontSize:12,color:T.g0,fontWeight:600}}>Penambahan ↑ saja</div>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:T.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>Jumlah Masuk *</div>
                  <input ref={stokQtyRef} type="number" min="1" value={stokQty}
                    onChange={e=>setStokQty(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&doAddStock()}
                    placeholder="0"
                    style={{width:"100%",padding:"14px",background:T.bg3,border:`1.5px solid ${T.b0}`,
                      borderRadius:10,color:T.t0,fontSize:24,fontFamily:T.mono,textAlign:"center",
                      fontWeight:700,transition:"border-color .15s"}}
                    onFocus={e=>e.target.style.borderColor=T.g0+"88"} onBlur={e=>e.target.style.borderColor=T.b0}/>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:T.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>Update Harga Jual</div>
                  <div style={{position:"relative"}}>
                    <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",
                      fontSize:10,color:T.t2,pointerEvents:"none",fontFamily:T.mono}}>Rp</span>
                    <input type="number" value={stokPrice} onChange={e=>setStokPrice(e.target.value)}
                      placeholder={String(stokTarget.price)}
                      style={{width:"100%",padding:"14px 12px 14px 32px",background:T.bg3,
                        border:`1.5px solid ${T.b0}`,borderRadius:10,color:T.t0,fontSize:14,fontFamily:T.mono,
                        transition:"border-color .15s"}}
                      onFocus={e=>e.target.style.borderColor=T.a0+"88"} onBlur={e=>e.target.style.borderColor=T.b0}/>
                  </div>
                </div>
              </div>

              {stokQty&&parseInt(stokQty)>0&&(
                <div style={{padding:"8px 12px",background:T.bg3,borderRadius:8,fontSize:12,color:T.t2,marginBottom:12,
                  display:"flex",gap:12,flexWrap:"wrap"}}>
                  <span>Stok: <strong style={{color:T.t0}}>{stokTarget.stock}</strong> → <strong style={{color:T.g0,fontSize:14}}>{stokTarget.stock+parseInt(stokQty)}</strong></span>
                  {stokPrice&&+stokPrice>0&&<span>Harga: <strong style={{color:T.a0}}>{rp(stokPrice)}</strong></span>}
                </div>
              )}

              <div style={{display:"flex",gap:8}}>
                <Btn onClick={doAddStock} full>+ Tambah Stok</Btn>
                <Btn onClick={()=>{setStokTarget(null);setStokQty("");setStokPrice("");stokScanRef.current?.focus();}} outline>Batal</Btn>
              </div>
            </Card>
          )}

          {/* Product list */}
          <Card noPad style={{overflow:"hidden"}}>
            <div style={{padding:"12px 14px",borderBottom:`1px solid ${T.b0}`,
              display:"flex",alignItems:"center",gap:8}}>
              <span style={{flex:1,fontSize:10.5,fontWeight:700,color:T.t2,textTransform:"uppercase",letterSpacing:1}}>
                Produk ({filtered.length})
              </span>
              <input value={stokSearch} onChange={e=>setStokSearch(e.target.value)}
                placeholder="Cari produk..."
                style={{padding:"8px 12px",background:T.bg3,border:`1px solid ${T.b0}`,
                  borderRadius:8,color:T.t0,fontSize:12,width:160,fontFamily:T.display}}/>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5,minWidth:480}}>
                <THead cols={["Barcode","Nama Produk","Kategori","Harga Jual","Stok",""]}/>
                <tbody>
                  {filtered.map((p,i)=>(
                    <tr key={p.id} className="hrow" style={{borderTop:`1px solid ${T.b0}`,
                      background:i%2===0?"transparent":T.bg0}}>
                      <td style={{padding:"11px 14px",fontFamily:T.mono,fontSize:10,color:T.t2}}>{p.barcode}</td>
                      <td style={{padding:"11px 14px",fontWeight:600}}>{p.name}</td>
                      <td style={{padding:"11px 14px",color:T.t2}}>{p.category}</td>
                      <td style={{padding:"11px 14px",fontFamily:T.mono,color:T.g0}}>{rp(p.price)}</td>
                      <td style={{padding:"11px 14px"}}><StockBadge s={p.stock}/></td>
                      <td style={{padding:"11px 14px"}}>
                        <button onClick={()=>{setStokTarget(p);setStokQty("");setStokPrice("");}}
                          className="press" style={{padding:"6px 14px",background:T.g1,
                            border:`1px solid ${T.g0}33`,borderRadius:8,color:T.g0,
                            cursor:"pointer",fontSize:11,fontWeight:700}}>+ Tambah</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Log penerimaan */}
          <Card noPad style={{overflow:"hidden"}}>
            <div style={{padding:"12px 14px",borderBottom:`1px solid ${T.b0}`}}>
              <span style={{fontSize:10.5,fontWeight:700,color:T.t2,textTransform:"uppercase",letterSpacing:1}}>
                Log Penerimaan — {b.name}
              </span>
            </div>
            {sLogs.filter(l=>l.business===biz&&l.type==="masuk").length===0
              ?<div style={{padding:"28px",textAlign:"center",color:T.t3,fontSize:13}}>Belum ada penerimaan stok</div>
              :<div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:440}}>
                  <THead cols={["Waktu","Produk","Qty Masuk","Sebelum → Sesudah","Oleh"]}/>
                  <tbody>
                    {sLogs.filter(l=>l.business===biz&&l.type==="masuk").slice(0,30).map((l,i)=>(
                      <tr key={l.id} className="hrow" style={{borderTop:`1px solid ${T.b0}`,background:i%2===0?"transparent":T.bg0}}>
                        <td style={{padding:"9px 14px",color:T.t2,fontSize:10,whiteSpace:"nowrap"}}>{l.date}</td>
                        <td style={{padding:"9px 14px",fontWeight:500}}>{l.name}</td>
                        <td style={{padding:"9px 14px",fontFamily:T.mono,fontWeight:700,color:T.g0}}>+{l.qty}</td>
                        <td style={{padding:"9px 14px",fontFamily:T.mono,fontSize:10}}>{l.before} → <b>{l.after}</b></td>
                        <td style={{padding:"9px 14px",color:T.t2}}>{l.by}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>}
          </Card>
        </Page>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  //  ADMIN SCREEN
  // ─────────────────────────────────────────────
  if(screen==="admin") {
    const ATABS=[
      {id:"users",    l:"👥 Pengguna"},
      {id:"products", l:"📦 Produk"},
      {id:"reports",  l:"📊 Laporan"},
      {id:"attend",   l:"🕐 Absensi"},
      {id:"stocklogs",l:"📋 Log Stok"},
      {id:"sheets",   l:"🔗 Sheets"},
    ];

    // User CRUD
    const openAddU=()=>{setUForm({username:"",password:"",name:"",role:"kasir",access:[],avatar:"🧑",active:true});setEditUid(null);setUModal(true);};
    const openEditU=u=>{setUForm({...u,access:[...u.access]});setEditUid(u.id);setUModal(true);};
    const saveUser=async()=>{
      if(!uForm.username||!uForm.password||!uForm.name){toast("Username, password & nama wajib diisi","warn");return;}
      if(!uForm.access?.length){toast("Pilih minimal 1 akses bisnis","warn");return;}
      try{
        if(editUid===null){
          if(users.find(u=>u.username===uForm.username)){toast("Username sudah digunakan!","err");return;}
          await fbAddUser({...uForm,id:NEXT_ID++,faceDescriptor:null});
          toast("✓ Pengguna ditambahkan");
        }else{
          await fbUpdateUser(editUid,{...uForm,id:editUid});
          toast("✓ Pengguna diperbarui");
        }
        setUModal(false);
      }catch(e){toast("Error: "+e.message,"err");}
    };
    const delUser=async(id)=>{
      if(id===user.id){toast("Tidak bisa hapus akun sendiri","err");return;}
      await fbDeleteUser(id).catch(()=>{});toast("Pengguna dihapus");
    };

    // Product CRUD
    const openAddP=()=>{setPForm({barcode:"",name:"",price:"",hpp:"",stock:"",category:"",business:adminBiz});setEditPid(null);setPModal(true);};
    const openEditP=p=>{setPForm({...p,price:String(p.price),hpp:String(p.hpp||0),stock:String(p.stock)});setEditPid(p.id);setPModal(true);};
    const saveProd=async()=>{
      if(!pForm.barcode||!pForm.name||!pForm.price||pForm.stock===""){toast("Barcode, nama, harga & stok wajib diisi","warn");return;}
      try{
        if(editPid===null){
          if(products.find(p=>p.barcode===pForm.barcode)){toast("Barcode sudah ada!","err");return;}
          await fbAddProduct({...pForm,id:NEXT_ID++,price:+pForm.price,hpp:+pForm.hpp||0,stock:+pForm.stock});
          toast("✓ Produk ditambahkan");
        }else{
          await fbUpdateProduct(editPid,{...pForm,id:editPid,price:+pForm.price,hpp:+pForm.hpp||0,stock:+pForm.stock});
          toast("✓ Produk diperbarui");
        }
        setPModal(false);
      }catch(e){toast("Error: "+e.message,"err");}
    };

    // Reports
    const filtTrx=trxList.filter(t=>reportBiz==="ALL"||t.business===reportBiz);
    const totalRev=filtTrx.reduce((s,t)=>s+t.total,0);
    const totalHppS=filtTrx.reduce((s,t)=>s+(t.totalHpp||0),0);
    const grossP=totalRev-totalHppS;
    const margin=totalRev>0?(grossP/totalRev*100).toFixed(1)+"%":"0%";
    const prodPerf=(()=>{
      const m={};
      filtTrx.forEach(t=>t.items?.forEach(item=>{
        if(!m[item.barcode])m[item.barcode]={name:item.name,barcode:item.barcode,qty:0,rev:0,hpp:0};
        m[item.barcode].qty+=item.qty;m[item.barcode].rev+=item.price*item.qty;m[item.barcode].hpp+=(item.hpp||0)*item.qty;
      }));
      return Object.values(m).sort((a,b)=>b.rev-a.rev);
    })();
    const dailyMap={};
    filtTrx.forEach(t=>{
      try{
        const d=new Date(t.date.replace(/(\d+)\/(\d+)\/(\d+)/,"$3-$2-$1")).toLocaleDateString("id-ID",{day:"2-digit",month:"2-digit"});
        if(!dailyMap[d])dailyMap[d]={date:d,rev:0,profit:0};
        dailyMap[d].rev+=t.total;dailyMap[d].profit+=(t.profit||0);
      }catch{}
    });
    const dailyData=Object.values(dailyMap).slice(-14);

    // Attendance
    const [selM,selY]=attMonth.split("-").map(Number);
    const attF=attend.filter(a=>{try{const d=new Date(a.checkIn);return d.getFullYear()===selY&&d.getMonth()+1===selM;}catch{return false;}});
    const attByU={};attF.forEach(a=>{if(!attByU[a.userId])attByU[a.userId]={name:a.name,role:a.role,days:0,last:""};attByU[a.userId].days++;attByU[a.userId].last=a.checkIn;});

    const adminPs=products.filter(p=>p.business===adminBiz&&(!searchQ||p.name.toLowerCase().includes(searchQ.toLowerCase())||p.barcode.includes(searchQ)));
    const IS={width:"100%",padding:"13px 14px",background:T.bg3,border:`1.5px solid ${T.b0}`,borderRadius:10,color:T.t0,fontSize:13,fontFamily:T.mono,transition:"border-color .15s"};

    return (
      <div style={{fontFamily:T.display,background:T.bg1,color:T.t0,height:"100vh",display:"flex",flexDirection:"column"}}>
        <style>{CSS}</style><Toast n={notif}/>
        <Header title="Admin" biz={null} user={user} online={online} onLogout={doLogout}/>

        {/* Tab bar */}
        <div style={{background:T.bg2,borderBottom:`1px solid ${T.b0}`,
          padding:"0 8px",display:"flex",overflowX:"auto",flexShrink:0,gap:2}}>
          {ATABS.map(t=><button key={t.id} onClick={()=>{setAdminTab(t.id);setSearchQ("");setPModal(false);}} className={`atab${adminTab===t.id?" on":""}`}>{t.l}</button>)}
        </div>

        {/* User CRUD Modal */}
        {uModal&&(
          <div style={{position:"fixed",inset:0,background:"rgba(2,6,15,.85)",zIndex:500,
            display:"flex",alignItems:"flex-end",justifyContent:"center"}}
            onClick={()=>setUModal(false)}>
            <div style={{width:"100%",maxWidth:520,background:T.bg2,borderRadius:"24px 24px 0 0",
              padding:"20px 22px 32px",border:`1px solid ${T.b1}`,borderBottom:"none",
              animation:"slideUp .25s ease",maxHeight:"90vh",overflow:"auto"}}
              onClick={e=>e.stopPropagation()}>
              <div style={{width:40,height:4,background:T.b1,borderRadius:2,margin:"0 auto 18px"}}/>
              <h3 style={{fontSize:15,fontWeight:800,marginBottom:20,color:T.g0}}>
                {editUid===null?"➕ Tambah Pengguna":"✏️ Edit Pengguna"}
              </h3>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:T.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Nama Lengkap *</div>
                  <input value={uForm.name||""} onChange={e=>setUForm(x=>({...x,name:e.target.value}))} style={IS}
                    onFocus={e=>e.target.style.borderColor=T.g0+"88"} onBlur={e=>e.target.style.borderColor=T.b0}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[{k:"username",l:"Username *",dis:editUid!==null},{k:"password",l:"Password *",t:"password"},{k:"avatar",l:"Avatar Emoji"}].map(f=>(
                    <div key={f.k} style={{gridColumn:f.k==="username"?"1":""}}>
                      <div style={{fontSize:10,fontWeight:700,color:T.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{f.l}</div>
                      <input type={f.t||"text"} value={uForm[f.k]||""} disabled={f.dis}
                        onChange={e=>setUForm(x=>({...x,[f.k]:e.target.value}))}
                        style={{...IS,color:f.dis?T.t2:T.t0}}
                        onFocus={e=>!f.dis&&(e.target.style.borderColor=T.g0+"88")} onBlur={e=>e.target.style.borderColor=T.b0}/>
                    </div>
                  ))}
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:T.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Role</div>
                    <select value={uForm.role||"kasir"} onChange={e=>setUForm(x=>({...x,role:e.target.value}))}
                      style={{...IS,fontFamily:T.display}}>
                      <option value="kasir">Kasir</option>
                      <option value="stok">Stok</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:T.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Akses Bisnis *</div>
                  <div style={{display:"flex",gap:10}}>
                    {Object.values(BIZ).map(b2=>{
                      const chk=uForm.access?.includes(b2.id),isJ=b2.id==="JS_CLOTHING";
                      return <button key={b2.id} onClick={()=>setUForm(x=>({...x,access:chk?x.access.filter(a=>a!==b2.id):[...(x.access||[]),b2.id]}))}
                        style={{flex:1,padding:"12px",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:13,
                          background:chk?(isJ?T.b_1:T.p1):"transparent",
                          border:`2px solid ${chk?(isJ?T.b_:T.p0):T.b0}`,
                          color:chk?(isJ?T.b_:T.p0):T.t2,fontFamily:T.display}}>
                        {b2.icon} {b2.name}</button>;
                    })}
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <input type="checkbox" id="uac" checked={!!uForm.active}
                    onChange={e=>setUForm(x=>({...x,active:e.target.checked}))}
                    style={{width:16,height:16,cursor:"pointer",accentColor:T.g0}}/>
                  <label htmlFor="uac" style={{fontSize:13,cursor:"pointer"}}>Akun Aktif</label>
                </div>
              </div>
              <div style={{display:"flex",gap:8,marginTop:20}}>
                <Btn onClick={saveUser} full>Simpan</Btn>
                <Btn onClick={()=>setUModal(false)} outline>Batal</Btn>
              </div>
            </div>
          </div>
        )}

        <Page style={{padding:12}}>

          {/* ── PENGGUNA ── */}
          {adminTab==="users"&&(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <div>
                  <h2 style={{fontSize:15,fontWeight:800}}>Database Pengguna</h2>
                  <p style={{fontSize:12,color:T.t2,marginTop:2}}>Kelola akun & data biometrik wajah pegawai</p>
                </div>
                <Btn onClick={openAddU} size="sm">+ Tambah</Btn>
              </div>
              <Card noPad style={{overflow:"hidden"}}>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5,minWidth:600}}>
                    <THead cols={["#","Username","Nama","Role","Akses","Wajah","Status","Aksi"]}/>
                    <tbody>
                      {users.map((u,i)=>(
                        <tr key={u.id} className="hrow" style={{borderTop:`1px solid ${T.b0}`,background:i%2===0?"transparent":T.bg0}}>
                          <td style={{padding:"11px 14px",fontFamily:T.mono,color:T.t3,fontSize:11}}>{u.id}</td>
                          <td style={{padding:"11px 14px",fontFamily:T.mono,fontSize:12}}>{u.avatar} {u.username}</td>
                          <td style={{padding:"11px 14px",fontWeight:600}}>{u.name}</td>
                          <td style={{padding:"11px 14px"}}><RoleTag role={u.role}/></td>
                          <td style={{padding:"11px 14px"}}><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{u.access?.map(a=><BizChip key={a} biz={a} sm/>)}</div></td>
                          <td style={{padding:"11px 14px"}}>
                            {u.role==="admin"?<Tag label="N/A" color={T.t3}/>
                            :u.faceDescriptor?<Tag label="✓ Terdaftar" color={T.g0}/>
                            :<button onClick={()=>setFaceReg(u.id)} className="press"
                              style={{padding:"3px 10px",background:T.a1,border:`1px solid ${T.a0}33`,
                                borderRadius:6,color:T.a0,cursor:"pointer",fontSize:11,fontWeight:700}}>Daftarkan</button>}
                          </td>
                          <td style={{padding:"11px 14px"}}><Tag label={u.active?"AKTIF":"NONAKTIF"} color={u.active?T.g0:T.r0}/></td>
                          <td style={{padding:"11px 14px",whiteSpace:"nowrap"}}>
                            <button onClick={()=>openEditU(u)} className="press" style={{marginRight:5,padding:"4px 10px",background:"transparent",border:`1px solid ${T.b1}`,borderRadius:6,color:T.t0,cursor:"pointer",fontSize:11}}>Edit</button>
                            {u.faceDescriptor&&u.role!=="admin"&&(
                              <button onClick={()=>{fbUpdateUser(u.id,{...u,faceDescriptor:null});toast("Wajah direset","warn");}} className="press" style={{marginRight:5,padding:"4px 10px",background:T.a1,border:`1px solid ${T.a0}22`,borderRadius:6,color:T.a0,cursor:"pointer",fontSize:11}}>Reset</button>
                            )}
                            <button onClick={()=>delUser(u.id)} className="press" style={{padding:"4px 10px",background:T.r1,border:`1px solid ${T.r0}22`,borderRadius:6,color:T.r0,cursor:"pointer",fontSize:11}}>Hapus</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ── PRODUK ── */}
          {adminTab==="products"&&(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                {Object.values(BIZ).map(b2=>{
                  const isJ=b2.id==="JS_CLOTHING",active=adminBiz===b2.id;
                  return <button key={b2.id} onClick={()=>{setAdminBiz(b2.id);setSearchQ("");setPModal(false);}} className="press"
                    style={{padding:"8px 16px",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13,
                      background:active?(isJ?T.b_1:T.p1):"transparent",
                      border:`2px solid ${active?(isJ?T.b_:T.p0):T.b0}`,
                      color:active?(isJ?T.b_:T.p0):T.t2,fontFamily:T.display}}>
                    {b2.icon} {b2.name}</button>;
                })}
                <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Cari produk..."
                  style={{marginLeft:"auto",padding:"8px 12px",background:T.bg2,border:`1px solid ${T.b0}`,borderRadius:8,color:T.t0,fontSize:12,width:170,fontFamily:T.display}}/>
                <Btn onClick={openAddP} size="sm">+ Tambah</Btn>
              </div>

              {pModal&&(
                <Card accent={T.g0} style={{padding:18}}>
                  <h3 style={{fontSize:14,fontWeight:800,marginBottom:16,color:T.g0}}>{editPid===null?"➕ Tambah Produk":"✏️ Edit Produk"}</h3>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
                    {[{k:"barcode",l:"Barcode *",full:true,dis:editPid!==null},{k:"name",l:"Nama Produk *",full:true},
                      {k:"category",l:"Kategori"},{k:"stock",l:"Stok *",t:"number"},
                    ].map(f=>(
                      <div key={f.k} style={{gridColumn:f.full?"span 2":""}}>
                        <div style={{fontSize:10,fontWeight:700,color:T.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:5}}>{f.l}</div>
                        <input type={f.t||"text"} value={pForm[f.k]||""} disabled={f.dis}
                          onChange={e=>setPForm(x=>({...x,[f.k]:e.target.value}))}
                          style={{...IS,color:f.dis?T.t2:T.t0}}
                          onFocus={e=>!f.dis&&(e.target.style.borderColor=T.g0+"88")} onBlur={e=>e.target.style.borderColor=T.b0}/>
                      </div>
                    ))}
                    <div>
                      <div style={{fontSize:10,fontWeight:700,color:T.t2,textTransform:"uppercase",letterSpacing:.5,marginBottom:5}}>Harga Jual (Rp) *</div>
                      <input type="number" value={pForm.price||""} onChange={e=>setPForm(x=>({...x,price:e.target.value}))} style={IS}
                        onFocus={e=>e.target.style.borderColor=T.g0+"88"} onBlur={e=>e.target.style.borderColor=T.b0}/>
                    </div>
                    <div>
                      <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:5,color:T.a0}}>HPP / Modal (Rp) — admin only</div>
                      <input type="number" value={pForm.hpp||""} onChange={e=>setPForm(x=>({...x,hpp:e.target.value}))}
                        style={{...IS,borderColor:T.a0+"44"}}
                        onFocus={e=>e.target.style.borderColor=T.a0+"88"} onBlur={e=>e.target.style.borderColor=T.a0+"44"}/>
                    </div>
                  </div>
                  {pForm.price&&pForm.hpp&&+pForm.price>0&&+pForm.hpp>0&&(
                    <div style={{marginTop:10,padding:"8px 12px",background:T.bg3,borderRadius:8,fontSize:12,display:"flex",gap:16}}>
                      <span style={{color:T.t2}}>Margin: <b style={{color:T.g0}}>{pct(+pForm.price-+pForm.hpp,+pForm.price)}</b></span>
                      <span style={{color:T.t2}}>Laba/pcs: <b style={{color:T.cy}}>{rp(+pForm.price-+pForm.hpp)}</b></span>
                    </div>
                  )}
                  <div style={{display:"flex",gap:8,marginTop:14}}>
                    <Btn onClick={saveProd}>Simpan</Btn>
                    <Btn onClick={()=>setPModal(false)} outline>Batal</Btn>
                  </div>
                </Card>
              )}

              <Card noPad style={{overflow:"hidden"}}>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5,minWidth:580}}>
                    <THead cols={["Barcode","Nama","Kategori","HPP (Modal)","Harga Jual","Margin","Stok","Aksi"]}/>
                    <tbody>
                      {adminPs.map((p,i)=>{
                        const mg=p.price>0?((p.price-(p.hpp||0))/p.price*100).toFixed(0)+"%":"-";
                        return <tr key={p.id} className="hrow" style={{borderTop:`1px solid ${T.b0}`,background:i%2===0?"transparent":T.bg0}}>
                          <td style={{padding:"10px 14px",fontFamily:T.mono,fontSize:10,color:T.t2}}>{p.barcode}</td>
                          <td style={{padding:"10px 14px",fontWeight:600}}>{p.name}</td>
                          <td style={{padding:"10px 14px",color:T.t2,fontSize:11}}>{p.category}</td>
                          <td style={{padding:"10px 14px",fontFamily:T.mono,color:T.a0,fontSize:11}}>{rp(p.hpp||0)}</td>
                          <td style={{padding:"10px 14px",fontFamily:T.mono,color:T.g0,fontSize:11}}>{rp(p.price)}</td>
                          <td style={{padding:"10px 14px",fontFamily:T.mono,fontSize:11,color:T.cy}}>{mg}</td>
                          <td style={{padding:"10px 14px"}}><StockBadge s={p.stock}/></td>
                          <td style={{padding:"10px 14px",whiteSpace:"nowrap"}}>
                            <button onClick={()=>openEditP(p)} className="press" style={{marginRight:5,padding:"4px 10px",background:"transparent",border:`1px solid ${T.b1}`,borderRadius:6,color:T.t0,cursor:"pointer",fontSize:11}}>Edit</button>
                            <button onClick={()=>fbDeleteProduct(p.id).then(()=>toast("Produk dihapus")).catch(e=>toast(e.message,"err"))} className="press" style={{padding:"4px 10px",background:T.r1,border:`1px solid ${T.r0}22`,borderRadius:6,color:T.r0,cursor:"pointer",fontSize:11}}>Hapus</button>
                          </td>
                        </tr>;
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ── LAPORAN ── */}
          {adminTab==="reports"&&(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <div>
                  <h2 style={{fontSize:15,fontWeight:800}}>Laporan Penjualan</h2>
                  <p style={{fontSize:12,color:T.t2,marginTop:2}}>Analisis pendapatan, HPP & laba kotor</p>
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["ALL","JS_CLOTHING","JB_STORE"].map(b2=>(
                    <button key={b2} onClick={()=>setReportBiz(b2)} className="press"
                      style={{padding:"6px 14px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600,
                        background:reportBiz===b2?(b2==="JB_STORE"?T.p1:b2==="JS_CLOTHING"?T.b_1:T.g1):"transparent",
                        border:`1.5px solid ${reportBiz===b2?(b2==="JB_STORE"?T.p0:b2==="JS_CLOTHING"?T.b_:T.g0):T.b0}`,
                        color:reportBiz===b2?(b2==="JB_STORE"?T.p0:b2==="JS_CLOTHING"?T.b_:T.g0):T.t2,fontFamily:T.display}}>
                      {b2==="ALL"?"Semua":BIZ[b2]?.name}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
                <Stat icon="💰" label="Total Pendapatan" value={rp(totalRev)} color={T.g0}/>
                <Stat icon="📦" label="Total HPP / Modal" value={rp(totalHppS)} color={T.a0}/>
                <Stat icon="📈" label="Laba Kotor" value={rp(grossP)} color={T.cy}/>
                <Stat icon="🎯" label="Margin Laba" value={margin} color={T.b_}/>
              </div>
              {dailyData.length>0&&(
                <Card>
                  <div style={{fontSize:11,fontWeight:700,color:T.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Tren Harian</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={dailyData} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.b0} vertical={false}/>
                      <XAxis dataKey="date" tick={{fill:T.t3,fontSize:10}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:T.t3,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>"Rp"+Math.floor(v/1000)+"k"}/>
                      <Tooltip contentStyle={{background:T.bg2,border:`1px solid ${T.b1}`,borderRadius:10,fontSize:12}}
                        formatter={(v,n)=>[rp(v),n==="rev"?"Pendapatan":"Laba"]}/>
                      <Bar dataKey="rev" fill={T.g0} radius={[4,4,0,0]} opacity={.8}/>
                      <Bar dataKey="profit" fill={T.cy} radius={[4,4,0,0]} opacity={.7}/>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
              {prodPerf.length>0&&(
                <Card noPad style={{overflow:"hidden"}}>
                  <div style={{padding:"12px 14px",borderBottom:`1px solid ${T.b0}`}}>
                    <span style={{fontSize:11,fontWeight:700,color:T.t2,textTransform:"uppercase",letterSpacing:1}}>Performa Produk</span>
                  </div>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:500}}>
                      <THead cols={["Produk","Qty","Pendapatan","HPP","Laba","Margin"]}/>
                      <tbody>
                        {prodPerf.map((p,i)=>{
                          const laba=p.rev-p.hpp, mg=p.rev>0?((laba/p.rev)*100).toFixed(1)+"%":"0%";
                          return <tr key={p.barcode} className="hrow" style={{borderTop:`1px solid ${T.b0}`,background:i%2===0?"transparent":T.bg0}}>
                            <td style={{padding:"10px 14px",fontWeight:600}}>{p.name}<div className="num" style={{fontSize:10,color:T.t3,marginTop:1}}>{p.barcode}</div></td>
                            <td style={{padding:"10px 14px",fontFamily:T.mono,fontWeight:700}}>{p.qty}</td>
                            <td style={{padding:"10px 14px",fontFamily:T.mono,color:T.g0,fontSize:11}}>{rp(p.rev)}</td>
                            <td style={{padding:"10px 14px",fontFamily:T.mono,color:T.a0,fontSize:11}}>{rp(p.hpp)}</td>
                            <td style={{padding:"10px 14px",fontFamily:T.mono,color:T.cy,fontSize:11}}>{rp(laba)}</td>
                            <td style={{padding:"10px 14px",fontFamily:T.mono,fontSize:11}}>
                              <span style={{color:parseFloat(mg)>30?T.g0:parseFloat(mg)>15?T.a0:T.r0}}>{mg}</span>
                            </td>
                          </tr>;
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{padding:"10px 14px",borderTop:`1px solid ${T.b0}`,display:"flex",gap:20,fontSize:11,flexWrap:"wrap"}}>
                    <span style={{color:T.t2}}>Total: <b style={{color:T.g0,fontFamily:T.mono}}>{rp(totalRev)}</b></span>
                    <span style={{color:T.t2}}>Laba: <b style={{color:T.cy,fontFamily:T.mono}}>{rp(grossP)}</b></span>
                    <span style={{color:T.t2}}>Margin: <b style={{color:T.b_,fontFamily:T.mono}}>{margin}</b></span>
                  </div>
                </Card>
              )}
              {filtTrx.length===0&&(
                <div style={{textAlign:"center",padding:"60px 20px",color:T.t3}}>
                  <div style={{fontSize:44,marginBottom:12,opacity:.1}}>📊</div>
                  <p style={{fontSize:14}}>Belum ada data transaksi</p>
                </div>
              )}
            </div>
          )}

          {/* ── ABSENSI ── */}
          {adminTab==="attend"&&(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <div>
                  <h2 style={{fontSize:15,fontWeight:800}}>Rekap Absensi</h2>
                  <p style={{fontSize:12,color:T.t2,marginTop:2}}>Kehadiran & jam kerja pegawai</p>
                </div>
                <input type="month" value={attMonth} onChange={e=>setAttMonth(e.target.value)}
                  style={{padding:"9px 13px",background:T.bg2,border:`1px solid ${T.b0}`,borderRadius:8,color:T.t0,fontSize:13,cursor:"pointer",fontFamily:T.display}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                <Stat icon="👥" label="Total Absensi" value={attF.length} color={T.g0}/>
                <Stat icon="✅" label="Sudah Pulang" value={attF.filter(a=>a.checkOut).length} color={T.cy}/>
                <Stat icon="🕐" label="Belum Pulang" value={attF.filter(a=>!a.checkOut).length} color={T.a0}/>
              </div>
              <Card noPad style={{overflow:"hidden"}}>
                <div style={{padding:"12px 14px",borderBottom:`1px solid ${T.b0}`}}>
                  <span style={{fontSize:11,fontWeight:700,color:T.t2,textTransform:"uppercase",letterSpacing:1}}>
                    {new Date(attMonth+"-01").toLocaleDateString("id-ID",{month:"long",year:"numeric"})}
                  </span>
                </div>
                {attF.length===0
                  ?<div style={{padding:"36px",textAlign:"center",color:T.t3,fontSize:13}}>Belum ada data absensi bulan ini</div>
                  :<div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:520}}>
                      <THead cols={["Tanggal","Pegawai","Role","Bisnis","Jam Masuk","Jam Pulang","Durasi"]}/>
                      <tbody>
                        {attF.sort((a,b)=>{try{return new Date(b.checkIn)-new Date(a.checkIn);}catch{return 0;}}).map((a,i)=>{
                          let dur="-";
                          if(a.checkIn&&a.checkOut){try{const ms=new Date(a.checkOut)-new Date(a.checkIn);dur=`${Math.floor(ms/3600000)}j ${Math.floor((ms%3600000)/60000)}m`;}catch{}}
                          return <tr key={a.id} className="hrow" style={{borderTop:`1px solid ${T.b0}`,background:i%2===0?"transparent":T.bg0}}>
                            <td style={{padding:"10px 14px",fontFamily:T.mono,fontSize:10,color:T.t2,whiteSpace:"nowrap"}}>{a.date}</td>
                            <td style={{padding:"10px 14px",fontWeight:600}}>{a.name}</td>
                            <td style={{padding:"10px 14px"}}><RoleTag role={a.role}/></td>
                            <td style={{padding:"10px 14px"}}><BizChip biz={a.business} sm/></td>
                            <td style={{padding:"10px 14px",fontFamily:T.mono,fontSize:11,color:T.g0}}>{a.checkIn}</td>
                            <td style={{padding:"10px 14px",fontFamily:T.mono,fontSize:11,color:a.checkOut?T.t1:T.a0}}>
                              {a.checkOut||<Tag label="Belum Pulang" color={T.a0}/>}
                            </td>
                            <td style={{padding:"10px 14px",fontFamily:T.mono,fontSize:11,color:T.cy}}>{dur}</td>
                          </tr>;
                        })}
                      </tbody>
                    </table>
                  </div>}
              </Card>
              {Object.keys(attByU).length>0&&(
                <Card noPad style={{overflow:"hidden"}}>
                  <div style={{padding:"12px 14px",borderBottom:`1px solid ${T.b0}`}}>
                    <span style={{fontSize:11,fontWeight:700,color:T.t2,textTransform:"uppercase",letterSpacing:1}}>Ringkasan per Pegawai</span>
                  </div>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5}}>
                    <THead cols={["Pegawai","Role","Total Hari","Terakhir Masuk"]}/>
                    <tbody>
                      {Object.values(attByU).map((au,i)=>(
                        <tr key={i} className="hrow" style={{borderTop:`1px solid ${T.b0}`,background:i%2===0?"transparent":T.bg0}}>
                          <td style={{padding:"10px 14px",fontWeight:700}}>{au.name}</td>
                          <td style={{padding:"10px 14px"}}><RoleTag role={au.role}/></td>
                          <td style={{padding:"10px 14px",fontFamily:T.mono,fontWeight:700,color:T.g0}}>{au.days} hari</td>
                          <td style={{padding:"10px 14px",fontFamily:T.mono,fontSize:11,color:T.t2}}>{au.last}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}
            </div>
          )}

          {/* ── LOG STOK ── */}
          {adminTab==="stocklogs"&&(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <h2 style={{fontSize:15,fontWeight:800}}>Log Stok <span style={{color:T.t2,fontWeight:500,fontSize:13}}>({sLogs.length})</span></h2>
              {sLogs.length===0
                ?<div style={{textAlign:"center",padding:"60px",color:T.t3}}><div style={{fontSize:40,opacity:.08,marginBottom:10}}>📋</div><p>Belum ada log</p></div>
                :<Card noPad style={{overflow:"hidden"}}>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:560}}>
                      <THead cols={["Waktu","Barcode","Produk","Bisnis","Tipe","Qty","Sblm","Ssdh","Oleh"]}/>
                      <tbody>
                        {sLogs.map((l,i)=>(
                          <tr key={l.id||i} className="hrow" style={{borderTop:`1px solid ${T.b0}`,background:i%2===0?"transparent":T.bg0}}>
                            <td style={{padding:"9px 14px",color:T.t2,fontSize:10,whiteSpace:"nowrap"}}>{l.date}</td>
                            <td style={{padding:"9px 14px",fontFamily:T.mono,color:T.t3,fontSize:9}}>{l.barcode}</td>
                            <td style={{padding:"9px 14px",fontWeight:500,fontSize:12}}>{l.name}</td>
                            <td style={{padding:"9px 14px"}}><BizChip biz={l.business} sm/></td>
                            <td style={{padding:"9px 14px"}}><Tag label={l.type?.toUpperCase()} color={l.type==="masuk"?T.g0:T.r0}/></td>
                            <td style={{padding:"9px 14px",fontFamily:T.mono,fontWeight:700,color:l.type==="masuk"?T.g0:T.r0}}>{l.type==="masuk"?"+":"-"}{l.qty}</td>
                            <td style={{padding:"9px 14px",fontFamily:T.mono,fontSize:11}}>{l.before}</td>
                            <td style={{padding:"9px 14px",fontFamily:T.mono,fontWeight:700}}>{l.after}</td>
                            <td style={{padding:"9px 14px",color:T.t2,fontSize:11}}>{l.by}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>}
            </div>
          )}

          {/* ── GOOGLE SHEETS ── */}
          {adminTab==="sheets"&&(
            <div style={{maxWidth:640,display:"flex",flexDirection:"column",gap:12}}>
              <h2 style={{fontSize:15,fontWeight:800}}>Google Sheets Sync</h2>
              <Card>
                <div style={{fontSize:11,fontWeight:700,color:T.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Koneksi Apps Script</div>
                <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                  <input value={gsUrl} onChange={e=>{setGsUrl(e.target.value);localStorage.setItem("je_gs_url",e.target.value);}}
                    placeholder="https://script.google.com/macros/s/…/exec"
                    style={{flex:1,minWidth:200,padding:"12px 14px",background:T.bg3,border:`1.5px solid ${T.b0}`,borderRadius:10,color:T.t0,fontSize:12,fontFamily:T.mono,transition:"border-color .15s"}}
                    onFocus={e=>e.target.style.borderColor=T.g0+"88"} onBlur={e=>e.target.style.borderColor=T.b0}/>
                  <Btn onClick={async()=>{
                    if(!gsUrl){toast("Masukkan URL dulu","warn");return;}
                    localStorage.setItem("je_gs_url",gsUrl);setGsLoad(true);
                    try{const ok=await syncToSheets(gsUrl,users,products,trxList,sLogs,attend);ok?toast("✅ Sinkron berhasil!"):toast("Gagal","err");}catch{toast("Tidak bisa terhubung","err");}
                    setGsLoad(false);
                  }} disabled={gsLoad}>{gsLoad?"⏳ Proses...":"↑ Ekspor Semua"}</Btn>
                </div>
                <div style={{padding:"10px 12px",background:T.a1,borderRadius:8,border:`1px solid ${T.a0}22`,fontSize:12,color:T.a0}}>
                  💡 Firebase adalah database utama. Google Sheets bersifat opsional untuk backup/laporan.
                </div>
              </Card>

              <Card>
                <div style={{fontSize:11,fontWeight:700,color:T.t2,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Status Data</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                  {[{i:"👥",l:"Pengguna",v:users.length},{i:"📦",l:"Produk",v:products.length},{i:"💳",l:"Transaksi",v:trxList.length},
                    {i:"📋",l:"Log Stok",v:sLogs.length},{i:"🕐",l:"Absensi",v:attend.length}].map(s=>(
                    <div key={s.l} style={{padding:"12px",background:T.bg3,borderRadius:10,border:`1px solid ${T.b0}`,textAlign:"center"}}>
                      <div style={{fontSize:18,marginBottom:4}}>{s.i}</div>
                      <div className="num" style={{fontWeight:700,fontSize:18}}>{s.v}</div>
                      <div style={{fontSize:10,color:T.t2,marginTop:2}}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <div style={{padding:"12px 14px",background:T.bg2,borderRadius:12,border:`1px solid ${T.b0}`,fontSize:12,color:T.t2}}>
                <strong style={{color:T.t0}}>Firebase Project:</strong> <span className="num" style={{color:T.g0}}>{loadConfig()?.projectId||"-"}</span>
                <button onClick={()=>{clearConfig();setFbReady(false);setFbSetup(true);setScreen("login");}} className="press"
                  style={{marginLeft:12,padding:"4px 10px",background:T.r1,border:`1px solid ${T.r0}33`,borderRadius:6,color:T.r0,cursor:"pointer",fontSize:11}}>
                  Reset Config
                </button>
              </div>
            </div>
          )}
        </Page>
      </div>
    );
  }
  return null;
}
