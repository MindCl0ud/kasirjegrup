import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Shirt, Sparkles, Upload, Type, Palette, Save, Bookmark, Undo2, Redo2,
  Trash2, Copy, Move, RotateCw, ZoomIn, ZoomOut, Check, ArrowLeft,
  MessageCircle, Download, Eye, Layers, Plus, Minus, X, AlertTriangle,
  Sliders, ChevronRight, RefreshCw, FlipHorizontal, ArrowUp, ArrowDown,
  Info, ExternalLink, Scissors
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  GARMENT CATALOG & PRESETS
// ─────────────────────────────────────────────────────────────
export const GARMENT_TYPES = [
  {
    id: "tshirt_short",
    name: "Kaos Pendek",
    sub: "Cotton Combed 30s",
    desc: "Bahan standar distro, adem, lembut, dan nyaman dipakai harian.",
    basePrice: 55000,
    minQty: 1,
    tag: "Terlaris"
  },
  {
    id: "tshirt_heavy",
    name: "Kaos Tebal",
    sub: "Cotton Combed 24s",
    desc: "Bahan lebih tebal, potongan kokoh, sangat cocok untuk streetwear.",
    basePrice: 65000,
    minQty: 1,
    tag: "Premium"
  },
  {
    id: "tshirt_long",
    name: "Lengan Panjang",
    sub: "Cotton Combed 30s Long",
    desc: "Lengan panjang dengan rib karet di pergelangan tangan.",
    basePrice: 70000,
    minQty: 1,
  },
  {
    id: "polo",
    name: "Polo Shirt",
    sub: "Lacoste Pique CVC",
    desc: "Bahan berpori halus dengan kerah formal dan kancing dada.",
    basePrice: 85000,
    minQty: 6,
    tag: "Seragam"
  },
  {
    id: "hoodie",
    name: "Hoodie Jumper",
    sub: "Cotton Fleece Tebal",
    desc: "Bahan fleece hangat dengan saku kangguru dan tali tudung.",
    basePrice: 135000,
    minQty: 3,
    tag: "Komunitas"
  }
];

export const GARMENT_COLORS = [
  { id: "black", name: "Hitam Jet Black", hex: "#121418", onDark: true, border: "#333" },
  { id: "white", name: "Putih Bersih", hex: "#FFFFFF", onDark: false, border: "#dcdfe6" },
  { id: "navy", name: "Biru Navy", hex: "#16203B", onDark: true, border: "#223159" },
  { id: "maroon", name: "Merah Maroon", hex: "#5C131F", onDark: true, border: "#751e2c" },
  { id: "sage", name: "Hijau Sage", hex: "#536B5C", onDark: true, border: "#657f6f" },
  { id: "misty", name: "Abu Misty", hex: "#949AA3", onDark: false, border: "#7f858e" },
  { id: "mustard", name: "Kuning Mustard", hex: "#D69726", onDark: false, border: "#b87f1c" },
  { id: "terracotta", name: "Terracotta Bata", hex: "#A3442C", onDark: true, border: "#8c3821" },
  { id: "royal", name: "Royal Blue", hex: "#1B47B8", onDark: true, border: "#2555d4" },
  { id: "army", name: "Hijau Army", hex: "#353F2E", onDark: true, border: "#47543f" },
  { id: "coffee", name: "Coklat Kopi", hex: "#3B2D25", onDark: true, border: "#523e33" },
  { id: "lilac", name: "Soft Lilac", hex: "#A89AC7", onDark: false, border: "#9385b2" },
];

export const INK_COLORS = [
  { name: "Putih", hex: "#FFFFFF" },
  { name: "Hitam", hex: "#111111" },
  { name: "Emas / Gold", hex: "#F5C518" },
  { name: "Perak / Silver", hex: "#C0C0C0" },
  { name: "Kuning Cerah", hex: "#FFE600" },
  { name: "Merah Menyala", hex: "#E52525" },
  { name: "Biru Terang", hex: "#0088FF" },
  { name: "Hijau Neon", hex: "#00E676" },
  { name: "Oranye", hex: "#FF6D00" },
  { name: "Pink Magenta", hex: "#FF1493" },
  { name: "Ungu Tarum", hex: "#7C4DFF" },
  { name: "Coklat Sumba", hex: "#8D4E2A" },
];

export const FONT_OPTIONS = [
  { id: "figtree", name: "Figtree Modern", family: "'Figtree Variable', 'Figtree', sans-serif" },
  { id: "impact", name: "Street Bold", family: "Impact, 'Arial Black', sans-serif" },
  { id: "bebas", name: "Sport Athletic", family: "'Arial Narrow', sans-serif", uppercase: true },
  { id: "georgia", name: "Classic Serif", family: "Georgia, 'Times New Roman', serif" },
  { id: "mono", name: "Tech Monospace", family: "'Courier New', Courier, monospace" },
  { id: "cursive", name: "Vintage Script", family: "'Brush Script MT', cursive, sans-serif" },
];

// Koleksi preset artwork/clipart yang siap ditempel ke baju
export const CLIPART_PRESETS = [
  {
    id: "sumba_ikat",
    name: "Tenun Sumba",
    category: "Budaya",
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4"><path d="M50 5 L90 50 L50 95 L10 50 Z"/><path d="M50 22 L75 50 L50 78 L25 50 Z" fill="currentColor" fill-opacity="0.3"/><circle cx="50" cy="50" r="10" fill="currentColor"/></svg>`
  },
  {
    id: "motor_shield",
    name: "Bikers Shield",
    category: "Komunitas",
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4"><path d="M15 15 H85 V50 C85 75 50 92 50 92 C50 92 15 75 15 50 Z"/><path d="M25 25 H75 V48 C75 66 50 80 50 80 C50 80 25 66 25 48 Z" fill="currentColor" fill-opacity="0.25"/><path d="M35 45 L50 35 L65 45 L50 65 Z" fill="currentColor"/></svg>`
  },
  {
    id: "wings_crest",
    name: "Garuda Wings",
    category: "Komunitas",
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3"><path d="M50 30 C30 10 5 25 10 60 C25 60 38 48 50 42 C62 48 75 60 90 60 C95 25 70 10 50 30 Z" fill="currentColor" fill-opacity="0.3"/><circle cx="50" cy="50" r="14" fill="currentColor"/><polygon points="50,40 54,48 62,49 56,55 58,63 50,58 42,63 44,55 38,49 46,48" fill="#FFF"/></svg>`
  },
  {
    id: "mountain_adventure",
    name: "Adventure Peak",
    category: "Outdoor",
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4"><circle cx="50" cy="50" r="44"/><path d="M20 75 L45 35 L58 55 L70 42 L85 75 Z" fill="currentColor" fill-opacity="0.35"/><circle cx="70" cy="28" r="7" fill="currentColor"/></svg>`
  },
  {
    id: "star_badge",
    name: "Distro Badge",
    category: "Distro",
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3"><circle cx="50" cy="50" r="45" stroke-dasharray="4 3"/><circle cx="50" cy="50" r="38"/><polygon points="50,22 58,38 76,40 62,52 66,70 50,60 34,70 38,52 24,40 42,38" fill="currentColor"/></svg>`
  },
  {
    id: "crown_royalty",
    name: "King Crown",
    category: "Distro",
    svg: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M15 75 L20 35 L40 55 L50 25 L60 55 L80 35 L85 75 Z"/><circle cx="20" cy="30" r="4"/><circle cx="50" cy="20" r="4"/><circle cx="80" cy="30" r="4"/><rect x="15" y="78" width="70" height="8" rx="3"/></svg>`
  },
  {
    id: "athletic_88",
    name: "Nomor 88",
    category: "Olahraga",
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5"><text x="50" y="70" font-size="52" font-weight="900" text-anchor="middle" font-family="'Arial Black', sans-serif" fill="currentColor">88</text></svg>`
  },
  {
    id: "original_stamp",
    name: "Original Stamp",
    category: "Distro",
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4"><rect x="10" y="25" width="80" height="50" rx="10" stroke-width="5"/><text x="50" y="47" font-size="14" font-weight="900" text-anchor="middle" font-family="sans-serif" fill="currentColor" letter-spacing="2">JS CLOTHING</text><line x1="20" y1="53" x2="80" y2="53" stroke-width="2"/><text x="50" y="65" font-size="11" font-weight="800" text-anchor="middle" font-family="sans-serif" fill="currentColor" letter-spacing="3">AUTHENTIC</text></svg>`
  }
];

// Helper untuk format rupiah
const rp = (n) => "Rp " + Number(n).toLocaleString("id-ID");

export function getGarmentSvgMarkup(type, colorHex, side = "front") {
  const isLight = colorHex.toLowerCase() === "#ffffff" || colorHex.toLowerCase() === "#fff";
  const shadowOpacity = isLight ? 0.12 : 0.28;
  const seamColor = isLight ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.15)";

  if (type === "hoodie") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="460" height="520" viewBox="0 0 500 580">
      <defs>
        <linearGradient id="hoodieShadow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#000" stop-opacity="0" />
          <stop offset="100%" stop-color="#000" stop-opacity="${shadowOpacity}" />
        </linearGradient>
      </defs>
      <path d="M 120 120 L 30 270 Q 20 290 40 300 L 95 270 L 140 200 Z" fill="${colorHex}" stroke="rgba(0,0,0,0.15)" stroke-width="1.5"/>
      <path d="M 380 120 L 470 270 Q 480 290 460 300 L 405 270 L 360 200 Z" fill="${colorHex}" stroke="rgba(0,0,0,0.15)" stroke-width="1.5"/>
      <rect x="25" y="280" width="28" height="24" rx="4" transform="rotate(-30 35 285)" fill="${colorHex}" stroke="${seamColor}" stroke-width="2" />
      <rect x="445" y="280" width="28" height="24" rx="4" transform="rotate(30 455 285)" fill="${colorHex}" stroke="${seamColor}" stroke-width="2" />
      <path d="M 130 110 Q 250 120 370 110 L 390 480 Q 250 495 110 480 Z" fill="${colorHex}" stroke="rgba(0,0,0,0.2)" stroke-width="2"/>
      <path d="M 130 110 Q 250 120 370 110 L 390 480 Q 250 495 110 480 Z" fill="url(#hoodieShadow)"/>
      <path d="M 110 480 Q 250 495 390 480 L 390 520 Q 250 535 110 520 Z" fill="${colorHex}" stroke="${seamColor}" stroke-width="2" />
      ${side === "front" ? `
        <path d="M 180 370 L 320 370 L 350 460 Q 250 472 150 460 Z" fill="${colorHex}" stroke="${seamColor}" stroke-width="2.5" />
        <path d="M 180 370 L 150 460" stroke="${seamColor}" stroke-width="3" />
        <path d="M 320 370 L 350 460" stroke="${seamColor}" stroke-width="3" />
        <path d="M 170 110 Q 250 40 330 110 Q 250 155 170 110 Z" fill="${colorHex}" stroke="${seamColor}" stroke-width="2" />
        <path d="M 230 135 Q 225 180 220 220" stroke="${isLight ? "#444" : "#EEE"}" stroke-width="4" stroke-linecap="round" />
        <path d="M 270 135 Q 275 180 280 220" stroke="${isLight ? "#444" : "#EEE"}" stroke-width="4" stroke-linecap="round" />
        <circle cx="220" cy="222" r="3" fill="#888" />
        <circle cx="280" cy="222" r="3" fill="#888" />
      ` : `
        <path d="M 160 110 Q 250 30 340 110 Q 250 160 160 110 Z" fill="${colorHex}" stroke="${seamColor}" stroke-width="2.5" />
      `}
    </svg>`;
  }

  if (type === "polo") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="460" height="520" viewBox="0 0 500 580">
      <path d="M 130 110 L 40 210 Q 30 225 50 235 L 105 210 L 140 170 Z" fill="${colorHex}" stroke="rgba(0,0,0,0.15)" stroke-width="1.5"/>
      <path d="M 370 110 L 460 210 Q 470 225 450 235 L 395 210 L 360 170 Z" fill="${colorHex}" stroke="rgba(0,0,0,0.15)" stroke-width="1.5"/>
      <path d="M 40 210 L 105 210 L 100 225 L 45 228 Z" fill="${colorHex}" stroke="${seamColor}" stroke-width="2" />
      <path d="M 460 210 L 395 210 L 400 225 L 455 228 Z" fill="${colorHex}" stroke="${seamColor}" stroke-width="2" />
      <path d="M 135 110 Q 250 120 365 110 L 385 500 Q 250 512 115 500 Z" fill="${colorHex}" stroke="rgba(0,0,0,0.2)" stroke-width="2"/>
      <path d="M 135 110 Q 250 120 365 110 L 385 500 Q 250 512 115 500 Z" fill="#000" fill-opacity="${shadowOpacity}" />
      ${side === "front" ? `
        <rect x="235" y="115" width="30" height="120" rx="3" fill="${colorHex}" stroke="${seamColor}" stroke-width="2" />
        <circle cx="250" cy="140" r="4" fill="${isLight ? "#333" : "#FFF"}" />
        <circle cx="250" cy="175" r="4" fill="${isLight ? "#333" : "#FFF"}" />
        <circle cx="250" cy="210" r="4" fill="${isLight ? "#333" : "#FFF"}" />
        <path d="M 250 115 L 180 80 Q 190 125 235 130 Z" fill="${colorHex}" stroke="${seamColor}" stroke-width="2.5" />
        <path d="M 250 115 L 320 80 Q 310 125 265 130 Z" fill="${colorHex}" stroke="${seamColor}" stroke-width="2.5" />
      ` : `
        <path d="M 180 85 Q 250 105 320 85 Q 250 120 180 85 Z" fill="${colorHex}" stroke="${seamColor}" stroke-width="2.5" />
      `}
    </svg>`;
  }

  if (type === "tshirt_long") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="460" height="520" viewBox="0 0 500 580">
      <path d="M 130 110 L 30 360 Q 25 375 45 380 L 85 365 L 140 180 Z" fill="${colorHex}" stroke="rgba(0,0,0,0.15)" stroke-width="1.5"/>
      <path d="M 370 110 L 470 360 Q 475 375 455 380 L 415 365 L 360 180 Z" fill="${colorHex}" stroke="rgba(0,0,0,0.15)" stroke-width="1.5"/>
      <rect x="30" y="360" width="26" height="22" rx="3" transform="rotate(-20 35 365)" fill="${colorHex}" stroke="${seamColor}" stroke-width="2" />
      <rect x="445" y="360" width="26" height="22" rx="3" transform="rotate(20 455 365)" fill="${colorHex}" stroke="${seamColor}" stroke-width="2" />
      <path d="M 135 110 Q 250 120 365 110 L 385 510 Q 250 522 115 510 Z" fill="${colorHex}" stroke="rgba(0,0,0,0.2)" stroke-width="2"/>
      <path d="M 135 110 Q 250 120 365 110 L 385 510 Q 250 522 115 510 Z" fill="#000" fill-opacity="${shadowOpacity}" />
      ${side === "front"
        ? `<path d="M 195 95 Q 250 160 305 95 Q 250 135 195 95 Z" fill="${colorHex}" stroke="${seamColor}" stroke-width="2.5" />`
        : `<path d="M 195 95 Q 250 115 305 95 Q 250 130 195 95 Z" fill="${colorHex}" stroke="${seamColor}" stroke-width="2.5" />`
      }
    </svg>`;
  }

  // Default: Kaos Pendek Combed 30s / 24s
  return `<svg xmlns="http://www.w3.org/2000/svg" width="460" height="520" viewBox="0 0 500 580">
    <path d="M 130 105 L 35 205 Q 25 220 45 230 L 105 205 L 142 165 Z" fill="${colorHex}" stroke="rgba(0,0,0,0.15)" stroke-width="1.5"/>
    <path d="M 370 105 L 465 205 Q 475 220 455 230 L 395 205 L 358 165 Z" fill="${colorHex}" stroke="rgba(0,0,0,0.15)" stroke-width="1.5"/>
    <path d="M 135 105 Q 250 115 365 105 L 388 510 Q 250 525 112 510 Z" fill="${colorHex}" stroke="rgba(0,0,0,0.2)" stroke-width="2"/>
    <path d="M 135 105 Q 250 115 365 105 L 388 510 Q 250 525 112 510 Z" fill="#000" fill-opacity="${shadowOpacity}" />
    ${side === "front"
      ? `<path d="M 190 95 Q 250 162 310 95 Q 250 142 190 95 Z" fill="${colorHex}" stroke="${seamColor}" stroke-width="3"/>`
      : `<path d="M 190 95 Q 250 118 310 95 Q 250 134 190 95 Z" fill="${colorHex}" stroke="${seamColor}" stroke-width="3"/>`
    }
  </svg>`;
}

// ─────────────────────────────────────────────────────────────
//  REALISTIC SVG GARMENT SILHOUETTES WITH FABRIC DEPTH
// ─────────────────────────────────────────────────────────────
export function GarmentIllustration({ type, colorHex, side = "front" }) {
  const isLight = colorHex.toLowerCase() === "#ffffff" || colorHex.toLowerCase() === "#fff";
  const shadowOpacity = isLight ? 0.12 : 0.28;
  const highlightOpacity = isLight ? 0.35 : 0.16;
  const seamColor = isLight ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.15)";

  // Render berdasarkan tipe pakaian
  if (type === "hoodie") {
    return (
      <svg viewBox="0 0 500 580" className="garment-svg" style={{ width: "100%", height: "100%", filter: "drop-shadow(0 14px 30px rgba(0,0,0,0.22))" }}>
        <defs>
          <linearGradient id="hoodieBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorHex} />
            <stop offset="100%" stopColor={colorHex} stopOpacity="0.88" />
          </linearGradient>
          <linearGradient id="hoodieShadow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity={shadowOpacity} />
          </linearGradient>
        </defs>

        {/* Lengan Kiri & Kanan */}
        <path d="M 120 120 L 30 270 Q 20 290 40 300 L 95 270 L 140 200 Z" fill={colorHex} />
        <path d="M 380 120 L 470 270 Q 480 290 460 300 L 405 270 L 360 200 Z" fill={colorHex} />

        {/* Manset Lengan */}
        <rect x="25" y="280" width="28" height="24" rx="4" transform="rotate(-30 35 285)" fill={colorHex} stroke={seamColor} strokeWidth="2" />
        <rect x="445" y="280" width="28" height="24" rx="4" transform="rotate(30 455 285)" fill={colorHex} stroke={seamColor} strokeWidth="2" />

        {/* Badan Utama Hoodie */}
        <path d="M 130 110 Q 250 120 370 110 L 390 480 Q 250 495 110 480 Z" fill="url(#hoodieBodyGrad)" />
        <path d="M 130 110 Q 250 120 370 110 L 390 480 Q 250 495 110 480 Z" fill="url(#hoodieShadow)" />

        {/* Karet Pinggang Bawah (Rib Hem) */}
        <path d="M 110 480 Q 250 495 390 480 L 390 520 Q 250 535 110 520 Z" fill={colorHex} stroke={seamColor} strokeWidth="2" />

        {/* Saku Kangguru (Hanya Tampak Depan) */}
        {side === "front" && (
          <g>
            <path d="M 180 370 L 320 370 L 350 460 Q 250 472 150 460 Z" fill={colorHex} stroke={seamColor} strokeWidth="2.5" />
            <path d="M 180 370 L 150 460" stroke={seamColor} strokeWidth="3" />
            <path d="M 320 370 L 350 460" stroke={seamColor} strokeWidth="3" />
          </g>
        )}

        {/* Tudung Kepala (Hood) */}
        {side === "front" ? (
          <g>
            <path d="M 170 110 Q 250 40 330 110 Q 250 155 170 110 Z" fill={colorHex} stroke={seamColor} strokeWidth="2" />
            {/* Tali Hoodie */}
            <path d="M 230 135 Q 225 180 220 220" stroke={isLight ? "#444" : "#EEE"} strokeWidth="4" strokeLinecap="round" />
            <path d="M 270 135 Q 275 180 280 220" stroke={isLight ? "#444" : "#EEE"} strokeWidth="4" strokeLinecap="round" />
            <circle cx="220" cy="222" r="3" fill="#888" />
            <circle cx="280" cy="222" r="3" fill="#888" />
          </g>
        ) : (
          <path d="M 160 110 Q 250 30 340 110 Q 250 160 160 110 Z" fill={colorHex} stroke={seamColor} strokeWidth="2.5" />
        )}
      </svg>
    );
  }

  if (type === "polo") {
    return (
      <svg viewBox="0 0 500 580" className="garment-svg" style={{ width: "100%", height: "100%", filter: "drop-shadow(0 14px 28px rgba(0,0,0,0.2))" }}>
        {/* Lengan */}
        <path d="M 130 110 L 40 210 Q 30 225 50 235 L 105 210 L 140 170 Z" fill={colorHex} />
        <path d="M 370 110 L 460 210 Q 470 225 450 235 L 395 210 L 360 170 Z" fill={colorHex} />

        {/* Rib Ujung Lengan */}
        <path d="M 40 210 L 105 210 L 100 225 L 45 228 Z" fill={colorHex} stroke={seamColor} strokeWidth="2" />
        <path d="M 460 210 L 395 210 L 400 225 L 455 228 Z" fill={colorHex} stroke={seamColor} strokeWidth="2" />

        {/* Badan Utama */}
        <path d="M 135 110 Q 250 120 365 110 L 385 500 Q 250 512 115 500 Z" fill={colorHex} />

        {/* Bayangan Lipatan Halus */}
        <path d="M 135 110 Q 250 120 365 110 L 385 500 Q 250 512 115 500 Z" fill="#000" fillOpacity={shadowOpacity} />

        {/* Kerah & Placket Kancing Polo */}
        {side === "front" ? (
          <g>
            {/* Placket Kancing */}
            <rect x="235" y="115" width="30" height="120" rx="3" fill={colorHex} stroke={seamColor} strokeWidth="2" />
            <circle cx="250" cy="140" r="4" fill={isLight ? "#333" : "#FFF"} />
            <circle cx="250" cy="175" r="4" fill={isLight ? "#333" : "#FFF"} />
            <circle cx="250" cy="210" r="4" fill={isLight ? "#333" : "#FFF"} />

            {/* Daun Kerah Kiri & Kanan */}
            <path d="M 250 115 L 180 80 Q 190 125 235 130 Z" fill={colorHex} stroke={seamColor} strokeWidth="2.5" />
            <path d="M 250 115 L 320 80 Q 310 125 265 130 Z" fill={colorHex} stroke={seamColor} strokeWidth="2.5" />
          </g>
        ) : (
          <path d="M 180 85 Q 250 105 320 85 Q 250 120 180 85 Z" fill={colorHex} stroke={seamColor} strokeWidth="2.5" />
        )}
      </svg>
    );
  }

  if (type === "tshirt_long") {
    return (
      <svg viewBox="0 0 500 580" className="garment-svg" style={{ width: "100%", height: "100%", filter: "drop-shadow(0 14px 28px rgba(0,0,0,0.2))" }}>
        {/* Lengan Panjang Kiri & Kanan */}
        <path d="M 130 110 L 30 360 Q 25 375 45 380 L 85 365 L 140 180 Z" fill={colorHex} />
        <path d="M 370 110 L 470 360 Q 475 375 455 380 L 415 365 L 360 180 Z" fill={colorHex} />

        {/* Rib Karet Pergelangan Tangan */}
        <rect x="30" y="360" width="26" height="22" rx="3" transform="rotate(-20 35 365)" fill={colorHex} stroke={seamColor} strokeWidth="2" />
        <rect x="445" y="360" width="26" height="22" rx="3" transform="rotate(20 455 365)" fill={colorHex} stroke={seamColor} strokeWidth="2" />

        {/* Badan Utama */}
        <path d="M 135 110 Q 250 120 365 110 L 385 510 Q 250 522 115 510 Z" fill={colorHex} />
        <path d="M 135 110 Q 250 120 365 110 L 385 510 Q 250 522 115 510 Z" fill="#000" fillOpacity={shadowOpacity} />

        {/* Kerah O-Neck */}
        {side === "front" ? (
          <path d="M 195 95 Q 250 160 305 95 Q 250 135 195 95 Z" fill={colorHex} stroke={seamColor} strokeWidth="2.5" />
        ) : (
          <path d="M 195 95 Q 250 115 305 95 Q 250 130 195 95 Z" fill={colorHex} stroke={seamColor} strokeWidth="2.5" />
        )}
      </svg>
    );
  }

  // Default: Kaos Pendek Combed 30s / 24s
  return (
    <svg viewBox="0 0 500 580" className="garment-svg" style={{ width: "100%", height: "100%", filter: "drop-shadow(0 14px 28px rgba(0,0,0,0.18))" }}>
      {/* Lengan Pendek Kiri */}
      <path d="M 130 105 L 35 205 Q 25 220 45 230 L 105 205 L 142 165 Z" fill={colorHex} />
      <path d="M 35 205 L 105 205" stroke={seamColor} strokeWidth="2.5" />

      {/* Lengan Pendek Kanan */}
      <path d="M 370 105 L 465 205 Q 475 220 455 230 L 395 205 L 358 165 Z" fill={colorHex} />
      <path d="M 465 205 L 395 205" stroke={seamColor} strokeWidth="2.5" />

      {/* Badan Utama Kaos */}
      <path d="M 135 105 Q 250 115 365 105 L 388 510 Q 250 525 112 510 Z" fill={colorHex} />

      {/* Soft Texture & Shadow Gradients */}
      <path d="M 135 105 Q 250 115 365 105 L 388 510 Q 250 525 112 510 Z" fill="#000" fillOpacity={shadowOpacity} />

      {/* Jahitan Hem Bawah */}
      <path d="M 115 496 Q 250 511 385 496" stroke={seamColor} strokeWidth="2" fill="none" strokeDasharray="6 3" />

      {/* Kerah O-Neck (Rib Collar) */}
      {side === "front" ? (
        <g>
          {/* Bagian Dalam Kerah Belakang */}
          <path d="M 195 95 Q 250 112 305 95 Q 250 128 195 95 Z" fill="#000" fillOpacity={isLight ? 0.08 : 0.35} />
          {/* Daun Kerah Depan */}
          <path d="M 190 95 Q 250 162 310 95 Q 250 142 190 95 Z" fill={colorHex} stroke={seamColor} strokeWidth="2.8" />
        </g>
      ) : (
        <path d="M 190 95 Q 250 118 310 95 Q 250 134 190 95 Z" fill={colorHex} stroke={seamColor} strokeWidth="2.8" />
      )}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
//  MAIN COMPONENT: CUSTOM SHIRT STUDIO
// ─────────────────────────────────────────────────────────────
export default function CustomShirtStudio({ onBack, onGoLanding, waNumber = "6285191435249", C: propC, F: propF, isDark }) {
  // Theme Fallback jika prop kosong
  const C = propC || {
    bg1: isDark ? "#0A0D1F" : "#FAF8F5",
    bg2: isDark ? "#121735" : "#FFFFFF",
    bg3: isDark ? "#1B224C" : "#F4F1EA",
    pri: "#2F3C94",
    pri1: isDark ? "rgba(47,60,148,0.22)" : "rgba(47,60,148,0.09)",
    t0: isDark ? "#FFFFFF" : "#12173A",
    t1: isDark ? "#E2E8F0" : "#3E4670",
    t2: isDark ? "#94A3B8" : "#5F678E",
    t3: isDark ? "#64748B" : "#8E95B5",
    bo0: isDark ? "rgba(255,255,255,0.08)" : "#EAE6DE",
    bo1: isDark ? "rgba(255,255,255,0.14)" : "#DDD7CC",
    g: "#0F7B58",
    g1: "rgba(15,123,88,0.10)",
    r: "#C4263B",
    r1: "rgba(196,38,59,0.10)",
    b: "#1B64B0",
    b1: "rgba(27,100,176,0.10)",
    sh: "0 1px 2px rgba(18,23,58,0.05), 0 4px 14px rgba(18,23,58,0.04)",
    sh2: "0 12px 36px rgba(18,23,58,0.18)",
    on: "#FFFFFF",
  };
  const F = propF || { sans: "'Figtree Variable','Figtree',sans-serif" };

  // ── State Pakaian & Kanvas ──
  const [garmentType, setGarmentType] = useState(GARMENT_TYPES[0]);
  const [garmentColor, setGarmentColor] = useState(GARMENT_COLORS[0]);
  const [activeSide, setActiveSide] = useState("front"); // 'front' | 'back'
  const [showSafeZone, setShowSafeZone] = useState(true);

  // ── Elemen Desain (Disimpan terpisah per sisi) ──
  const [frontElements, setFrontElements] = useState([]);
  const [backElements, setBackElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // ── Riwayat Undo / Redo ──
  const [history, setHistory] = useState([]);
  const [histStep, setHistStep] = useState(-1);

  // ── Tab Menu Studio & Mobile Drawer ──
  // 'garment' | 'text' | 'upload' | 'clipart' | 'saved'
  const [activeTab, setActiveTab] = useState("garment");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // ── Form Input Teks Baru ──
  const [newText, setNewText] = useState("");
  const [newFont, setNewFont] = useState(FONT_OPTIONS[0].family);
  const [newColor, setNewColor] = useState(INK_COLORS[0].hex);

  // ── Desain Tersimpan (LocalStorage) ──
  const [savedDesigns, setSavedDesigns] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("je_custom_shirts") || "[]");
    } catch {
      return [];
    }
  });

  // ── Dialog Order WhatsApp ──
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderName, setOrderName] = useState("");
  const [orderQty, setOrderQty] = useState({ S: 0, M: 2, L: 4, XL: 2, XXL: 0 });
  const [orderNotes, setOrderNotes] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // ── Feedback Notifikasi Singkat ──
  const [notif, setNotif] = useState(null);
  const showToast = (msg) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3000);
  };

  // Referensi Kanvas Cetak
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Elemen aktif saat ini sesuai sisi aktif
  const currentElements = activeSide === "front" ? frontElements : backElements;
  const setCurrentElements = (updater) => {
    if (activeSide === "front") {
      setFrontElements(updater);
    } else {
      setBackElements(updater);
    }
  };

  // Simpan snapshot untuk riwayat Undo/Redo
  const recordHistory = useCallback((fEls, bEls) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, histStep + 1);
      return [...trimmed, { front: fEls, back: bEls }];
    });
    setHistStep(prev => prev + 1);
  }, [histStep]);

  // Handle Undo
  const handleUndo = () => {
    if (histStep > 0) {
      const target = history[histStep - 1];
      setFrontElements(target.front);
      setBackElements(target.back);
      setHistStep(histStep - 1);
      setSelectedId(null);
    }
  };

  // Handle Redo
  const handleRedo = () => {
    if (histStep < history.length - 1) {
      const target = history[histStep + 1];
      setFrontElements(target.front);
      setBackElements(target.back);
      setHistStep(histStep + 1);
      setSelectedId(null);
    }
  };

  // Auto-Save Draft
  useEffect(() => {
    try {
      const draft = {
        garmentId: garmentType.id,
        colorId: garmentColor.id,
        front: frontElements,
        back: backElements,
        updatedAt: Date.now()
      };
      localStorage.setItem("je_custom_draft", JSON.stringify(draft));
    } catch {}
  }, [garmentType, garmentColor, frontElements, backElements]);

  // Restore Draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("je_custom_draft");
      if (saved) {
        const d = JSON.parse(saved);
        if (d.front && d.front.length > 0 || d.back && d.back.length > 0) {
          const g = GARMENT_TYPES.find(x => x.id === d.garmentId) || GARMENT_TYPES[0];
          const c = GARMENT_COLORS.find(x => x.id === d.colorId) || GARMENT_COLORS[0];
          setGarmentType(g);
          setGarmentColor(c);
          setFrontElements(d.front || []);
          setBackElements(d.back || []);
          setHistory([{ front: d.front || [], back: d.back || [] }]);
          setHistStep(0);
        }
      }
    } catch {}
  }, []);

  // ─────────────────────────────────────────────────────────────
  //  MANIPULASI ELEMEN (TAMBAH, EDIT, GESER, HAPUS)
  // ─────────────────────────────────────────────────────────────
  const addTextElement = () => {
    const textVal = newText.trim() || "TEKS CUSTOM";
    const newEl = {
      id: "txt_" + Date.now().toString(36),
      type: "text",
      text: textVal,
      fontFamily: newFont,
      fontSize: 26,
      color: newColor,
      isBold: true,
      isItalic: false,
      align: "center",
      strokeColor: null,
      strokeWidth: 0,
      letterSpacing: 0,
      x: 50, // persentase terhadap area cetak (0-100)
      y: 40,
      rotation: 0,
      scale: 1,
    };

    const next = [...currentElements, newEl];
    setCurrentElements(next);
    setSelectedId(newEl.id);
    recordHistory(activeSide === "front" ? next : frontElements, activeSide === "back" ? next : backElements);
    setNewText("");
    showToast("Teks ditambahkan ke baju");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("Ukuran file maksimal 8MB. Silakan pilih gambar yang lebih ringan.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const newEl = {
        id: "img_" + Date.now().toString(36),
        type: "image",
        src: event.target?.result,
        name: file.name,
        x: 50,
        y: 45,
        rotation: 0,
        scale: 1,
        flipH: false,
      };

      const next = [...currentElements, newEl];
      setCurrentElements(next);
      setSelectedId(newEl.id);
      recordHistory(activeSide === "front" ? next : frontElements, activeSide === "back" ? next : backElements);
      showToast("Gambar berhasil dimuat");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const addClipartElement = (preset) => {
    const newEl = {
      id: "clp_" + Date.now().toString(36),
      type: "clipart",
      name: preset.name,
      svg: preset.svg,
      color: garmentColor.onDark ? "#FFFFFF" : "#111111",
      x: 50,
      y: 45,
      rotation: 0,
      scale: 1,
      flipH: false,
    };

    const next = [...currentElements, newEl];
    setCurrentElements(next);
    setSelectedId(newEl.id);
    recordHistory(activeSide === "front" ? next : frontElements, activeSide === "back" ? next : backElements);
    showToast(`Grafik "${preset.name}" ditambahkan`);
  };

  const updateSelected = (updater) => {
    if (!selectedId) return;
    const next = currentElements.map(el => {
      if (el.id === selectedId) {
        return typeof updater === "function" ? updater(el) : { ...el, ...updater };
      }
      return el;
    });
    setCurrentElements(next);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    const next = currentElements.filter(el => el.id !== selectedId);
    setCurrentElements(next);
    setSelectedId(null);
    recordHistory(activeSide === "front" ? next : frontElements, activeSide === "back" ? next : backElements);
    showToast("Elemen dihapus");
  };

  const duplicateSelected = () => {
    if (!selectedId) return;
    const src = currentElements.find(el => el.id === selectedId);
    if (!src) return;
    const clone = {
      ...src,
      id: src.type + "_" + Date.now().toString(36),
      x: Math.min(80, src.x + 5),
      y: Math.min(80, src.y + 5),
    };
    const next = [...currentElements, clone];
    setCurrentElements(next);
    setSelectedId(clone.id);
    recordHistory(activeSide === "front" ? next : frontElements, activeSide === "back" ? next : backElements);
    showToast("Elemen diduplikasi");
  };

  const selectedElement = currentElements.find(el => el.id === selectedId);

  // Auto-sync text settings saat elemen teks dipilih agar bisa langsung diedit
  useEffect(() => {
    if (selectedElement && selectedElement.type === "text") {
      setNewText(selectedElement.text);
      if (selectedElement.fontFamily) setNewFont(selectedElement.fontFamily);
      if (selectedElement.color) setNewColor(selectedElement.color);
    }
  }, [selectedId]);

  // ─────────────────────────────────────────────────────────────
  //  DRAGGING ENGINE ON CANVAS (MOUSE & TOUCH)
  // ─────────────────────────────────────────────────────────────
  const dragRef = useRef(null);

  const handlePointerDown = (e, elId) => {
    e.stopPropagation();
    setSelectedId(elId);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const el = currentElements.find(x => x.id === elId);
    if (!el) return;

    dragRef.current = {
      id: elId,
      startX: clientX,
      startY: clientY,
      origX: el.x,
      origY: el.y,
    };
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;

    // Asumsikan lebar safe zone ~ 260px, hitung perpindahan dalam %
    const deltaXPercent = (dx / 260) * 100;
    const deltaYPercent = (dy / 340) * 100;

    const newX = Math.max(10, Math.min(90, dragRef.current.origX + deltaXPercent));
    const newY = Math.max(10, Math.min(90, dragRef.current.origY + deltaYPercent));

    setCurrentElements(prev => prev.map(el => el.id === dragRef.current.id ? { ...el, x: Math.round(newX), y: Math.round(newY) } : el));
  };

  const handlePointerUp = () => {
    if (dragRef.current) {
      dragRef.current = null;
      recordHistory(frontElements, backElements);
    }
  };

  // ─────────────────────────────────────────────────────────────
  //  SIMPAN DESAIN (LOCALSTORAGE LIST)
  // ─────────────────────────────────────────────────────────────
  const saveCurrentDesign = (titleInput) => {
    const defaultTitle = `${garmentType.name} ${garmentColor.name} - ${new Date().toLocaleDateString("id-ID")}`;
    let title = titleInput;
    if (!title) {
      const ask = window.prompt("Beri nama untuk desain ini:", defaultTitle);
      if (ask === null) return; // User batalkan prompt
      title = ask.trim() || defaultTitle;
    }
    const item = {
      id: "ds_" + Date.now().toString(36),
      title: title.trim(),
      date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      garment: garmentType,
      color: garmentColor,
      front: frontElements,
      back: backElements,
    };

    const nextList = [item, ...savedDesigns.filter(x => x.title !== item.title)];
    setSavedDesigns(nextList);
    try {
      localStorage.setItem("je_custom_shirts", JSON.stringify(nextList));
    } catch {}
    showToast(`Desain "${item.title}" tersimpan!`);
    setActiveTab("saved");
  };

  const loadSavedDesign = (item) => {
    setGarmentType(item.garment || GARMENT_TYPES[0]);
    setGarmentColor(item.color || GARMENT_COLORS[0]);
    setFrontElements(item.front || []);
    setBackElements(item.back || []);
    setSelectedId(null);
    recordHistory(item.front || [], item.back || []);
    showToast(`Desain "${item.title}" dimuat`);
  };

  const deleteSavedDesign = (id) => {
    if (!window.confirm("Hapus desain ini dari daftar tersimpan?")) return;
    const nextList = savedDesigns.filter(x => x.id !== id);
    setSavedDesigns(nextList);
    try {
      localStorage.setItem("je_custom_shirts", JSON.stringify(nextList));
    } catch {}
    showToast("Desain dihapus");
  };

  // ─────────────────────────────────────────────────────────────
  //  EXPORT HIGH-RES MOCKUP KE CANVAS & DOWNLOAD PNG
  // ─────────────────────────────────────────────────────────────
  const renderMockupImage = useCallback(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Background studio bersih
    ctx.fillStyle = garmentColor.onDark ? "#121735" : "#F4F6FB";
    ctx.fillRect(0, 0, 1200, 800);

    // Header kartu watermark
    ctx.fillStyle = garmentColor.onDark ? "#FFFFFF" : "#182046";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("JS CLOTHING — CUSTOM APPAREL STUDIO", 50, 60);

    ctx.fillStyle = garmentColor.onDark ? "rgba(255,255,255,0.65)" : "rgba(24,32,70,0.65)";
    ctx.font = "16px sans-serif";
    ctx.fillText(`${garmentType.name} (${garmentType.sub}) • Warna: ${garmentColor.name}`, 50, 90);

    // Gambar label Tampak Depan & Tampak Belakang
    ctx.fillStyle = "#8E9CFF";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("TAMPAK DEPAN", 220, 150);
    ctx.fillText("TAMPAK BELAKANG", 780, 150);

    // Helper untuk merender mockup ke canvas
    const drawSide = async (sideName, xOffset) => {
      const els = sideName === "front" ? frontElements : backElements;

      // Buat SVG garment string dinamis sesuai tipe & warna pakaian
      const svgString = getGarmentSvgMarkup(garmentType.id, garmentColor.hex, sideName);

      const img = new Image();
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      await new Promise((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, xOffset, 170, 460, 520);
          URL.revokeObjectURL(blobURL);
          resolve(true);
        };
        img.onerror = () => {
          URL.revokeObjectURL(blobURL);
          resolve(true);
        };
        img.src = blobURL;
      });

      // Render sablon elements
      for (const el of els) {
        ctx.save();
        const posX = xOffset + 130 + (el.x / 100) * 200;
        const posY = 170 + 130 + (el.y / 100) * 260;
        ctx.translate(posX, posY);
        if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
        if (el.scale) ctx.scale(el.scale, el.scale);

        if (el.type === "text") {
          ctx.fillStyle = el.color || "#FFFFFF";
          ctx.textAlign = el.align || "center";
          ctx.font = `${el.isBold ? "bold " : ""}${el.isItalic ? "italic " : ""}${el.fontSize * 1.3}px ${el.fontFamily || "sans-serif"}`;
          ctx.fillText(el.text, 0, 0);
        } else if (el.type === "image" && el.src) {
          const artImg = new Image();
          await new Promise(res => {
            artImg.onload = () => {
              const w = 110;
              const h = (artImg.height / artImg.width) * w;
              ctx.drawImage(artImg, -w / 2, -h / 2, w, h);
              res(true);
            };
            artImg.onerror = () => res(true);
            artImg.src = el.src;
          });
        } else if (el.type === "clipart" && el.svg) {
          const coloredSvg = el.svg.replace(/currentColor/g, el.color || "#FFFFFF");
          const clpBlob = new Blob([coloredSvg], { type: "image/svg+xml;charset=utf-8" });
          const clpUrl = URL.createObjectURL(clpBlob);
          const clpImg = new Image();
          await new Promise(res => {
            clpImg.onload = () => {
              ctx.drawImage(clpImg, -45, -45, 90, 90);
              URL.revokeObjectURL(clpUrl);
              res(true);
            };
            clpImg.onerror = () => {
              URL.revokeObjectURL(clpUrl);
              res(true);
            };
            clpImg.src = clpUrl;
          });
        }
        ctx.restore();
      }
    };

    await drawSide("front", 50);
    await drawSide("back", 650);

    // Footer
    ctx.fillStyle = garmentColor.onDark ? "rgba(255,255,255,0.45)" : "rgba(24,32,70,0.45)";
    ctx.font = "14px sans-serif";
    ctx.fillText("Desain Resmi JE Grup • Hubungi WhatsApp untuk pemesanan & info sablon", 50, 765);

    return canvas.toDataURL("image/png");
  }, [garmentType, garmentColor, frontElements, backElements]);

  // Download Mockup PNG
  const handleDownloadMockup = async () => {
    setIsExporting(true);
    try {
      const dataUrl = await renderMockupImage();
      if (!dataUrl) return;
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `Desain-Kaos-JS-Clothing-${Date.now().toString(36)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast("Gambar mockup berhasil diunduh!");
    } catch (err) {
      alert("Gagal mengunduh gambar mockup. Silakan coba kembali.");
    } finally {
      setIsExporting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  //  KIRIM PESANAN KE WHATSAPP (LENGKAP SPESIFIKASI & UKURAN)
  // ─────────────────────────────────────────────────────────────
  const totalPieces = Object.values(orderQty).reduce((a, b) => a + Number(b || 0), 0);
  const estimatedPrice = totalPieces * garmentType.basePrice;

  const handleSendToWhatsApp = async () => {
    if (totalPieces < garmentType.minQty) {
      alert(`Minimal pemesanan untuk ${garmentType.name} adalah ${garmentType.minQty} pcs.`);
      return;
    }

    setIsExporting(true);

    // Download mockup gambar otomatis agar customer bisa langsung lampirkan di WA
    try {
      await handleDownloadMockup();
    } catch {}

    // Rangkum elemen sablon
    const frontDesc = frontElements.length === 0
      ? "Polos"
      : frontElements.map(x => x.type === "text" ? `Teks: "${x.text}"` : (x.name || "Gambar/Logo")).join(", ");

    const backDesc = backElements.length === 0
      ? "Polos"
      : backElements.map(x => x.type === "text" ? `Teks: "${x.text}"` : (x.name || "Gambar/Logo")).join(", ");

    const sizeBreakdown = Object.entries(orderQty)
      .filter(([_, q]) => q > 0)
      .map(([s, q]) => `${s}: ${q} pcs`)
      .join(", ");

    const textMsg = `Halo JS Clothing (JE Grup), saya ingin memesan baju custom dengan hasil rancangan dari Studio Desain:

📋 *SPESIFIKASI PESANAN CUSTOM*
• *Jenis Pakaian*: ${garmentType.name} (${garmentType.sub})
• *Warna Kain*: ${garmentColor.name}
• *Sisi Sablon*: ${frontElements.length > 0 && backElements.length > 0 ? "Depan & Belakang" : (frontElements.length > 0 ? "Hanya Depan" : "Hanya Belakang")}
• *Desain Depan*: ${frontDesc}
• *Desain Belakang*: ${backDesc}

📦 *RINCIAN UKURAN & JUMLAH*
• *Pilihan Ukuran*: ${sizeBreakdown}
• *Total Pesanan*: ${totalPieces} pcs
• *Estimasi Dasar*: ${rp(estimatedPrice)}

👤 *Pemesan*: ${orderName.trim() || "Customer"}
${orderNotes ? `📝 *Catatan Tambahan*: ${orderNotes}\n` : ""}
_(Gambar mockup desain otomatis telah saya simpan dan akan saya lampirkan di chat ini)_. Mohon info ketersediaan stok bahan dan jadwal produksinya ya. Terima kasih!`;

    const cleanNum = String(waNumber).replace(/\D/g, "");
    const waUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(textMsg)}`;

    setIsExporting(false);
    setShowOrderModal(false);
    window.open(waUrl, "_blank");
  };

  const handleCopyOrderSummary = () => {
    const frontDesc = frontElements.length === 0
      ? "Polos"
      : frontElements.map(x => x.type === "text" ? `Teks: "${x.text}"` : (x.name || "Gambar/Logo")).join(", ");

    const backDesc = backElements.length === 0
      ? "Polos"
      : backElements.map(x => x.type === "text" ? `Teks: "${x.text}"` : (x.name || "Gambar/Logo")).join(", ");

    const sizeBreakdown = Object.entries(orderQty)
      .filter(([_, q]) => q > 0)
      .map(([s, q]) => `${s}: ${q} pcs`)
      .join(", ");

    const textMsg = `*PESANAN CUSTOM JS CLOTHING*
• Pakaian: ${garmentType.name} (${garmentType.sub})
• Warna: ${garmentColor.name}
• Sisi Sablon: ${frontElements.length > 0 && backElements.length > 0 ? "Depan & Belakang" : (frontElements.length > 0 ? "Hanya Depan" : "Hanya Belakang")}
• Desain Depan: ${frontDesc}
• Desain Belakang: ${backDesc}
• Ukuran: ${sizeBreakdown || "Belum dipilih"}
• Total: ${totalPieces} pcs
• Estimasi Dasar: ${rp(estimatedPrice)}
• Pemesan: ${orderName.trim() || "Customer"}
${orderNotes ? `• Catatan: ${orderNotes}\n` : ""}`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textMsg);
    }
    showToast("Rincian pesanan disalin ke clipboard!");
  };

  // ── Render Konten Tab (Dipakai di Desktop Sidebar & Mobile Drawer) ──
  const renderTabContent = (isMobile = false) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* TAB 1: PILIH PAKAIAN & WARNA KAIN */}
        {activeTab === "garment" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.t0, marginBottom: 8 }}>
                1. Jenis Pakaian
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {GARMENT_TYPES.map(g => {
                  const sel = garmentType.id === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setGarmentType(g)}
                      className="press"
                      style={{
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: `1.5px solid ${sel ? C.pri : C.bo1}`,
                        background: sel ? C.pri1 : C.bg3,
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 800, color: sel ? C.pri : C.t0 }}>{g.name}</span>
                          {g.tag && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: C.b1, color: C.b }}>
                              {g.tag}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11.5, color: C.t2, marginTop: 2 }}>{g.sub}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 850, color: C.t0 }}>{rp(g.basePrice)}</div>
                        <div style={{ fontSize: 10.5, color: C.t3 }}>/pcs</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.t0, marginBottom: 8 }}>
                2. Warna Kain: <span style={{ color: C.pri }}>{garmentColor.name}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {GARMENT_COLORS.map(c => {
                  const sel = garmentColor.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setGarmentColor(c)}
                      className="press"
                      style={{
                        height: 48,
                        borderRadius: 12,
                        background: c.hex,
                        border: sel ? `3px solid ${C.pri}` : `1px solid ${c.border}`,
                        boxShadow: sel ? "0 0 0 2px " + C.bg2 : "none",
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                      }}
                      title={c.name}
                    >
                      {sel && <Check size={18} color={c.onDark ? "#FFF" : "#000"} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TAMBAH TEKS */}
        {activeTab === "text" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 800, marginBottom: 6 }}>
                Ketik Tulisan
              </label>
              <textarea
                value={newText}
                onChange={e => {
                  setNewText(e.target.value);
                  if (selectedElement && selectedElement.type === "text") {
                    updateSelected({ text: e.target.value });
                  }
                }}
                placeholder="Contoh: SUMBA BIKERS 2026"
                rows={2}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: `1.5px solid ${C.bo1}`,
                  background: C.bg3,
                  color: C.t0,
                  fontSize: 13.5,
                  fontFamily: newFont,
                  resize: "none",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 800, marginBottom: 6 }}>
                Gaya Font
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {FONT_OPTIONS.map(f => {
                  const sel = newFont === f.family;
                  return (
                    <button
                      key={f.id}
                      onClick={() => {
                        setNewFont(f.family);
                        if (selectedElement && selectedElement.type === "text") {
                          updateSelected({ fontFamily: f.family });
                        }
                      }}
                      className="press"
                      style={{
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: `1px solid ${sel ? C.pri : C.bo1}`,
                        background: sel ? C.pri1 : C.bg3,
                        color: sel ? C.pri : C.t0,
                        fontFamily: f.family,
                        fontSize: 14,
                        fontWeight: 700,
                        textAlign: "left",
                      }}
                    >
                      {f.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 800, marginBottom: 6 }}>
                Warna Sablon Teks
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
                {INK_COLORS.map(c => {
                  const sel = newColor === c.hex;
                  return (
                    <button
                      key={c.name}
                      onClick={() => {
                        setNewColor(c.hex);
                        if (selectedElement && selectedElement.type === "text") {
                          updateSelected({ color: c.hex });
                        }
                      }}
                      className="press"
                      style={{
                        height: 36,
                        borderRadius: 8,
                        background: c.hex,
                        border: sel ? `2.5px solid ${C.pri}` : "1px solid rgba(0,0,0,0.15)",
                        display: "grid",
                        placeItems: "center",
                      }}
                      title={c.name}
                    >
                      {sel && <Check size={15} color={c.hex === "#FFFFFF" ? "#000" : "#FFF"} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => {
                addTextElement();
                if (isMobile) setMobileDrawerOpen(false);
              }}
              className="press"
              style={{
                height: 44,
                borderRadius: 12,
                background: C.pri,
                color: C.on,
                fontSize: 13.5,
                fontWeight: 700,
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                marginTop: 4,
              }}
            >
              <Plus size={16} /> Tempel Teks ke Baju
            </button>
          </div>
        )}

        {/* TAB 3: UPLOAD LOGO / GAMBAR SENDIRI */}
        {activeTab === "upload" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: "28px 16px",
                borderRadius: 16,
                border: `2px dashed ${C.pri}`,
                background: C.pri1,
                textAlign: "center",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: C.bg2, color: C.pri, display: "grid", placeItems: "center" }}>
                <Upload size={22} />
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 800 }}>Pilih File dari HP / Laptop</div>
              <div style={{ fontSize: 11.5, color: C.t2 }}>Format PNG (latar transparan), JPG, atau SVG (Maks 8MB).</div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  handleImageUpload(e);
                  if (isMobile) setMobileDrawerOpen(false);
                }}
                accept="image/*,.svg"
                style={{ display: "none" }}
              />
            </div>

            <div style={{ background: C.bg3, borderRadius: 12, padding: 12, fontSize: 12, color: C.t2, lineHeight: 1.5 }}>
              <div style={{ fontWeight: 800, color: C.t0, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <Info size={14} color={C.pri} /> Tips Hasil Sablon Maksimal:
              </div>
              Gunakan gambar logo dengan latar belakang transparan (PNG). Tim konveksi kami akan memeriksa resolusi sebelum proses sablon dimulai.
            </div>
          </div>
        )}

        {/* TAB 4: PRESET GRAFIK & CLIPART */}
        {activeTab === "clipart" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.t2 }}>
              Pilih grafik atau motif khas Sumba & komunitas siap cetak:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {CLIPART_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => {
                    addClipartElement(preset);
                    if (isMobile) setMobileDrawerOpen(false);
                  }}
                  className="press"
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    border: `1px solid ${C.bo1}`,
                    background: C.bg3,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    color: C.t0,
                  }}
                >
                  <div
                    style={{ width: 50, height: 50 }}
                    dangerouslySetInnerHTML={{ __html: preset.svg }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 700, textAlign: "center" }}>
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: DESAIN TERSIMPAN SAYA */}
        {activeTab === "saved" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 800 }}>Koleksi Tersimpan ({savedDesigns.length})</span>
              <button
                onClick={() => saveCurrentDesign()}
                className="press"
                style={{
                  background: "transparent",
                  border: "none",
                  color: C.pri,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                + Simpan Saat Ini
              </button>
            </div>

            {savedDesigns.length === 0 ? (
              <div
                style={{
                  padding: "36px 14px",
                  textAlign: "center",
                  background: C.bg3,
                  borderRadius: 16,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Bookmark size={28} color={C.t3} />
                <div style={{ fontSize: 13, fontWeight: 700 }}>Belum ada desain tersimpan</div>
                <div style={{ fontSize: 11.5, color: C.t2 }}>Klik tombol "Simpan" di atas untuk menyimpan rancangan baju Anda.</div>
              </div>
            ) : (
              savedDesigns.map(item => (
                <div
                  key={item.id}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: `1px solid ${C.bo1}`,
                    background: C.bg3,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: C.t0 }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: C.t2 }}>{item.date} • {item.garment?.name}</div>
                    </div>
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: item.color?.hex,
                        border: "1px solid rgba(0,0,0,0.2)",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <button
                      onClick={() => {
                        loadSavedDesign(item);
                        if (isMobile) setMobileDrawerOpen(false);
                      }}
                      className="press"
                      style={{
                        flex: 1,
                        padding: "6px 0",
                        borderRadius: 8,
                        background: C.pri,
                        color: C.on,
                        fontSize: 11.5,
                        fontWeight: 700,
                        border: "none",
                      }}
                    >
                      Buka & Edit
                    </button>
                    <button
                      onClick={() => deleteSavedDesign(item.id)}
                      className="press"
                      style={{
                        width: 32,
                        padding: "6px 0",
                        borderRadius: 8,
                        background: "transparent",
                        color: C.r,
                        border: `1px solid ${C.bo1}`,
                        display: "grid",
                        placeItems: "center",
                      }}
                      title="Hapus Desain"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: C.bg1,
        color: C.t0,
        display: "flex",
        flexDirection: "column",
        fontFamily: F.sans,
      }}
    >
      {/* ── Studio Top Navbar ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          minHeight: "calc(58px + env(safe-area-inset-top, 0px))",
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingLeft: "clamp(12px, 3vw, 24px)",
          paddingRight: "clamp(12px, 3vw, 24px)",
          background: isDark ? "rgba(15,19,48,0.92)" : "rgba(255,255,255,0.92)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderBottom: `1px solid ${C.bo1}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <button
            onClick={onBack || onGoLanding}
            className="press"
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              border: `1px solid ${C.bo1}`,
              background: C.bg2,
              color: C.t1,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
            aria-label="Kembali ke Beranda"
            title="Kembali ke Beranda"
          >
            <ArrowLeft size={18} />
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 14.5, fontWeight: 800, letterSpacing: "-.02em", whiteSpace: "nowrap" }}>
                Studio Desain Baju
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: 50,
                  background: C.b1,
                  color: C.b,
                  whiteSpace: "nowrap",
                }}
              >
                JS Clothing
              </span>
            </div>
            <div style={{ fontSize: 11, color: C.t2, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {garmentType.name} • {garmentColor.name}
            </div>
          </div>
        </div>

        {/* Action Controls: Undo/Redo, Simpan, dan Kirim WA */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <div className="hide-mobile" style={{ display: "flex", gap: 3, marginRight: 4 }}>
            <button
              onClick={handleUndo}
              disabled={histStep <= 0}
              className="press"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: `1px solid ${C.bo1}`,
                background: C.bg2,
                color: histStep <= 0 ? C.t3 : C.t1,
                display: "grid",
                placeItems: "center",
                opacity: histStep <= 0 ? 0.5 : 1,
              }}
              title="Undo"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={handleRedo}
              disabled={histStep >= history.length - 1}
              className="press"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: `1px solid ${C.bo1}`,
                background: C.bg2,
                color: histStep >= history.length - 1 ? C.t3 : C.t1,
                display: "grid",
                placeItems: "center",
                opacity: histStep >= history.length - 1 ? 0.5 : 1,
              }}
              title="Redo"
            >
              <Redo2 size={16} />
            </button>
          </div>

          <button
            onClick={() => saveCurrentDesign()}
            className="press hide-mobile"
            style={{
              height: 36,
              padding: "0 12px",
              borderRadius: 10,
              border: `1px solid ${C.bo1}`,
              background: C.bg2,
              color: C.t0,
              fontSize: 12.5,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Bookmark size={14} /> Simpan
          </button>

          <button
            onClick={handleDownloadMockup}
            disabled={isExporting}
            className="press hide-mobile"
            style={{
              height: 36,
              padding: "0 12px",
              borderRadius: 10,
              border: `1px solid ${C.bo1}`,
              background: C.bg2,
              color: C.t0,
              fontSize: 12.5,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
            title="Download PNG Gambar Desain"
          >
            <Download size={14} /> Download
          </button>

          {/* Quick Action Icons untuk Mobile */}
          <button
            onClick={() => saveCurrentDesign()}
            className="press hide-desktop"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: `1px solid ${C.bo1}`,
              background: C.bg2,
              color: C.t0,
              display: "grid",
              placeItems: "center",
            }}
            title="Simpan Desain"
            aria-label="Simpan Desain"
          >
            <Bookmark size={15} />
          </button>

          <button
            onClick={handleDownloadMockup}
            disabled={isExporting}
            className="press hide-desktop"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: `1px solid ${C.bo1}`,
              background: C.bg2,
              color: C.t0,
              display: "grid",
              placeItems: "center",
              opacity: isExporting ? 0.6 : 1,
            }}
            title="Download PNG Mockup"
            aria-label="Download PNG Mockup"
          >
            {isExporting ? <RefreshCw size={14} className="spin" /> : <Download size={15} />}
          </button>

          <button
            onClick={() => setShowOrderModal(true)}
            className="press"
            style={{
              height: 38,
              padding: "0 14px",
              borderRadius: 11,
              background: C.g,
              color: "#FFF",
              fontSize: 13,
              fontWeight: 800,
              border: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              boxShadow: "0 4px 14px rgba(15,123,88,0.28)",
              letterSpacing: "-.01em",
            }}
          >
            <MessageCircle size={15} /> Pesan ke WA
          </button>
        </div>
      </header>

      {/* ── Studio Body (Split Panel Desktop & Drawer Mobile) ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ── Left Sidebar Navigation (Desktop) ── */}
        <aside
          className="hide-mobile"
          style={{
            width: 320,
            background: C.bg2,
            borderRight: `1px solid ${C.bo1}`,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            zIndex: 10,
          }}
        >
          {/* Segmented Toolbar Tabs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              borderBottom: `1px solid ${C.bo0}`,
              background: C.bg3,
              padding: 4,
              gap: 4,
            }}
          >
            {[
              { id: "garment", label: "Baju", icon: Shirt },
              { id: "text", label: "Teks", icon: Type },
              { id: "upload", label: "Logo", icon: Upload },
              { id: "clipart", label: "Grafik", icon: Sparkles },
              { id: "saved", label: "Koleksi", icon: Bookmark },
            ].map(tab => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="press"
                  style={{
                    padding: "8px 2px",
                    borderRadius: 9,
                    border: "none",
                    background: active ? C.bg2 : "transparent",
                    color: active ? C.pri : C.t2,
                    fontWeight: active ? 800 : 600,
                    fontSize: 11,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    boxShadow: active ? C.sh : "none",
                    transition: "all .15s",
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Panel Konten Sidebar Sesuai Tab */}
          <div style={{ padding: 18, flex: 1 }}>
            {renderTabContent(false)}
          </div>
        </aside>

        {/* ── Main Viewport Canvas (Tengah) ── */}
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            position: "relative",
            background: isDark ? "#0A0D1F" : "#ECEFF7",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            padding: "16px 12px 80px",
          }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={() => setSelectedId(null)}
        >
          {/* Garment Floating Switchers (Depan / Belakang & Toggle Garis Bantu) */}
          <div
            style={{
              position: "absolute",
              top: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
              zIndex: 20,
            }}
          >
            {/* Front / Back Toggle Pill */}
            <div
              style={{
                display: "flex",
                background: C.bg2,
                borderRadius: 50,
                padding: 3,
                border: `1px solid ${C.bo1}`,
                boxShadow: C.sh,
              }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setActiveSide("front"); setSelectedId(null); }}
                className="press"
                style={{
                  padding: "6px 14px",
                  borderRadius: 50,
                  border: "none",
                  fontSize: 12,
                  fontWeight: activeSide === "front" ? 800 : 600,
                  background: activeSide === "front" ? C.pri : "transparent",
                  color: activeSide === "front" ? C.on : C.t2,
                  transition: "all .15s",
                }}
              >
                Tampak Depan
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveSide("back"); setSelectedId(null); }}
                className="press"
                style={{
                  padding: "6px 14px",
                  borderRadius: 50,
                  border: "none",
                  fontSize: 12,
                  fontWeight: activeSide === "back" ? 800 : 600,
                  background: activeSide === "back" ? C.pri : "transparent",
                  color: activeSide === "back" ? C.on : C.t2,
                  transition: "all .15s",
                }}
              >
                Tampak Belakang
              </button>
            </div>

            {/* Guide Grid Toggle */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowSafeZone(x => !x); }}
              className="press"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: `1px solid ${C.bo1}`,
                background: showSafeZone ? C.pri1 : C.bg2,
                color: showSafeZone ? C.pri : C.t2,
                display: "grid",
                placeItems: "center",
                boxShadow: C.sh,
              }}
              title="Tampilkan / Sembunyikan Garis Area Sablon"
            >
              <Scissors size={15} />
            </button>

            {/* Mobile Undo & Redo Quick Buttons */}
            <div className="hide-desktop" style={{ display: "flex", gap: 4 }}>
              <button
                onClick={(e) => { e.stopPropagation(); handleUndo(); }}
                disabled={histStep <= 0}
                className="press"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: `1px solid ${C.bo1}`,
                  background: C.bg2,
                  color: histStep <= 0 ? C.t3 : C.t1,
                  display: "grid",
                  placeItems: "center",
                  opacity: histStep <= 0 ? 0.4 : 1,
                  boxShadow: C.sh,
                }}
                title="Undo"
                aria-label="Undo"
              >
                <Undo2 size={15} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleRedo(); }}
                disabled={histStep >= history.length - 1}
                className="press"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: `1px solid ${C.bo1}`,
                  background: C.bg2,
                  color: histStep >= history.length - 1 ? C.t3 : C.t1,
                  display: "grid",
                  placeItems: "center",
                  opacity: histStep >= history.length - 1 ? 0.4 : 1,
                  boxShadow: C.sh,
                }}
                title="Redo"
                aria-label="Redo"
              >
                <Redo2 size={15} />
              </button>
            </div>
          </div>

          {/* ── Mockup Garment Container ── */}
          <div
            style={{
              position: "relative",
              width: "min(92vw, 480px)",
              height: "min(72vh, 560px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              userSelect: "none",
            }}
          >
            {/* SVG Garment Background */}
            <GarmentIllustration
              type={garmentType.id}
              colorHex={garmentColor.hex}
              side={activeSide}
            />

            {/* Printable Area / Safe Zone (Area Sablon) */}
            <div
              style={{
                position: "absolute",
                top: "22%",
                left: "27%",
                width: "46%",
                height: "56%",
                border: showSafeZone ? "1.5px dashed rgba(142,156,255,0.45)" : "none",
                borderRadius: 8,
                pointerEvents: "auto",
              }}
            >
              {/* Safe Zone Badge Hint */}
              {showSafeZone && (
                <div
                  style={{
                    position: "absolute",
                    top: -18,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: C.pri,
                    background: C.bg2,
                    padding: "1px 6px",
                    borderRadius: 4,
                    boxShadow: C.sh,
                    whiteSpace: "nowrap",
                  }}
                >
                  Area Sablon {activeSide === "front" ? "Dada" : "Punggung"}
                </div>
              )}

              {/* Render Canvas Elements for Active Side */}
              {currentElements.map(el => {
                const isSel = el.id === selectedId;

                return (
                  <div
                    key={el.id}
                    onPointerDown={(e) => handlePointerDown(e, el.id)}
                    onClick={(e) => { e.stopPropagation(); setSelectedId(el.id); }}
                    style={{
                      position: "absolute",
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      transform: `translate(-50%, -50%) rotate(${el.rotation || 0}deg) scale(${el.scale || 1})`,
                      cursor: "move",
                      touchAction: "none",
                      zIndex: isSel ? 30 : 10,
                      padding: 4,
                      border: isSel ? `2px solid ${C.pri}` : "1.5px solid transparent",
                      borderRadius: 6,
                      boxShadow: isSel ? "0 0 12px rgba(142,156,255,0.4)" : "none",
                    }}
                  >
                    {/* Elemen TEKS */}
                    {el.type === "text" && (
                      <div
                        style={{
                          color: el.color,
                          fontSize: el.fontSize,
                          fontFamily: el.fontFamily,
                          fontWeight: el.isBold ? 800 : 500,
                          fontStyle: el.isItalic ? "italic" : "normal",
                          textAlign: el.align || "center",
                          whiteSpace: "nowrap",
                          textShadow: el.strokeColor ? `-1px -1px 0 ${el.strokeColor}, 1px -1px 0 ${el.strokeColor}, -1px 1px 0 ${el.strokeColor}, 1px 1px 0 ${el.strokeColor}` : "none",
                          lineHeight: 1.1,
                        }}
                      >
                        {el.text}
                      </div>
                    )}

                    {/* Elemen GAMBAR / LOGO */}
                    {el.type === "image" && (
                      <img
                        src={el.src}
                        alt="Custom Logo"
                        draggable={false}
                        style={{
                          maxWidth: 120,
                          maxHeight: 120,
                          objectFit: "contain",
                          display: "block",
                          transform: el.flipH ? "scaleX(-1)" : "none",
                        }}
                      />
                    )}

                    {/* Elemen CLIPART */}
                    {el.type === "clipart" && (
                      <div
                        style={{
                          width: 80,
                          height: 80,
                          color: el.color,
                          transform: el.flipH ? "scaleX(-1)" : "none",
                        }}
                        dangerouslySetInnerHTML={{ __html: el.svg }}
                      />
                    )}

                    {/* Active Selected Control Handles */}
                    {isSel && (
                      <div
                        style={{
                          position: "absolute",
                          top: -12,
                          right: -12,
                          display: "flex",
                          gap: 4,
                          background: C.bg2,
                          borderRadius: 20,
                          padding: 2,
                          boxShadow: C.sh2,
                        }}
                        onPointerDown={e => e.stopPropagation()}
                      >
                        <button
                          onClick={duplicateSelected}
                          className="press"
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: C.bg3,
                            color: C.t1,
                            border: "none",
                            display: "grid",
                            placeItems: "center",
                          }}
                          title="Duplikasi"
                        >
                          <Copy size={11} />
                        </button>
                        <button
                          onClick={deleteSelected}
                          className="press"
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: C.r,
                            color: "#FFF",
                            border: "none",
                            display: "grid",
                            placeItems: "center",
                          }}
                          title="Hapus"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Floating Element Manipulation Bar (Bawah Kanvas saat Elemen Dipilih) */}
          {selectedElement && (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: "absolute",
                bottom: "calc(66px + env(safe-area-inset-bottom, 0px))",
                background: C.bg2,
                borderRadius: 16,
                padding: "8px 14px",
                border: `1px solid ${C.bo1}`,
                boxShadow: C.sh2,
                display: "flex",
                alignItems: "center",
                gap: 12,
                zIndex: 25,
                maxWidth: "min(92vw, 460px)",
                overflowX: "auto",
              }}
            >
              {/* Ukuran (Scale) Slider */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.t2 }}>Ukuran</span>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={selectedElement.scale || 1}
                  onChange={e => updateSelected({ scale: parseFloat(e.target.value) })}
                  style={{ width: 80, accentColor: C.pri }}
                />
              </div>

              {/* Rotasi Slider */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <RotateCw size={13} color={C.t2} />
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="5"
                  value={selectedElement.rotation || 0}
                  onChange={e => updateSelected({ rotation: parseInt(e.target.value) })}
                  style={{ width: 70, accentColor: C.pri }}
                />
              </div>

              {/* Tombol Tengah Kanvas */}
              <button
                onClick={() => updateSelected({ x: 50, y: 50 })}
                className="press"
                style={{
                  padding: "4px 8px",
                  borderRadius: 8,
                  background: C.bg3,
                  border: "none",
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.t1,
                  whiteSpace: "nowrap",
                }}
              >
                Pusatkan
              </button>

              <button
                onClick={deleteSelected}
                className="press"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: C.r1,
                  color: C.r,
                  border: "none",
                  display: "grid",
                  placeItems: "center",
                }}
                title="Hapus"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </main>
      </div>

      {/* ── Mobile Sliding Drawer Panel (Saat Tab di HP Diklik) ── */}
      {mobileDrawerOpen && (
        <div
          className="hide-desktop drawer-overlay"
          onClick={() => setMobileDrawerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10,13,32,0.6)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 150,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            animation: "fadeIn .15s ease-out",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.bg2,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderTop: `1px solid ${C.bo1}`,
              boxShadow: "0 -8px 32px rgba(0,0,0,0.3)",
              maxHeight: "75vh",
              display: "flex",
              flexDirection: "column",
              animation: "slideUp .25s cubic-bezier(0.16, 1, 0.3, 1)",
              paddingBottom: "calc(64px + env(safe-area-inset-bottom, 0px))",
            }}
          >
            {/* Grabber Indicator */}
            <div
              style={{
                width: 40,
                height: 4.5,
                borderRadius: 3,
                background: C.bo1,
                margin: "10px auto 4px",
              }}
            />

            {/* Drawer Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 18px 12px",
                borderBottom: `1px solid ${C.bo0}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14.5, fontWeight: 800, color: C.t0 }}>
                  {activeTab === "garment" && "👕 Model & Warna Kain"}
                  {activeTab === "text" && "🔤 Tambah Tulisan / Teks"}
                  {activeTab === "upload" && "📤 Upload Logo Sendiri"}
                  {activeTab === "clipart" && "✨ Katalog Motif & Grafik"}
                  {activeTab === "saved" && "📑 Desain Tersimpan"}
                </span>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="press"
                style={{
                  padding: "5px 12px",
                  borderRadius: 10,
                  border: `1px solid ${C.bo1}`,
                  background: C.bg3,
                  color: C.t0,
                  fontSize: 12,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span>Lihat Baju</span>
                <X size={14} />
              </button>
            </div>

            {/* Drawer Body */}
            <div
              style={{
                padding: 16,
                overflowY: "auto",
                flex: 1,
                WebkitOverflowScrolling: "touch",
              }}
            >
              {renderTabContent(true)}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Navigation Bar (Drawer Tabs di HP) ── */}
      <div
        className="hide-desktop"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: C.bg2,
          borderTop: `1px solid ${C.bo1}`,
          padding: "6px 8px calc(6px + env(safe-area-inset-bottom, 0px))",
          display: "flex",
          justifyContent: "space-around",
          zIndex: 160,
          boxShadow: "0 -2px 10px rgba(0,0,0,0.06)",
        }}
      >
        {[
          { id: "garment", label: "Baju", icon: Shirt },
          { id: "text", label: "Teks", icon: Type },
          { id: "upload", label: "Logo", icon: Upload },
          { id: "clipart", label: "Grafik", icon: Sparkles },
          { id: "saved", label: "Koleksi", icon: Bookmark },
        ].map(tab => {
          const isCurrentTab = activeTab === tab.id;
          const isDrawerForThisOpen = isCurrentTab && mobileDrawerOpen;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (activeTab === tab.id && mobileDrawerOpen) {
                  setMobileDrawerOpen(false);
                } else {
                  setActiveTab(tab.id);
                  setMobileDrawerOpen(true);
                }
              }}
              className="press"
              style={{
                flex: 1,
                padding: "4px 0",
                border: "none",
                background: "transparent",
                color: isDrawerForThisOpen ? C.pri : (isCurrentTab ? C.t0 : C.t2),
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                fontSize: 10.5,
                fontWeight: isCurrentTab ? 800 : 600,
                position: "relative",
              }}
            >
              <span
                style={{
                  width: 38,
                  height: 26,
                  borderRadius: 14,
                  background: isDrawerForThisOpen ? C.pri1 : (isCurrentTab ? C.bg3 : "transparent"),
                  color: isDrawerForThisOpen ? C.pri : (isCurrentTab ? C.t0 : C.t2),
                  display: "grid",
                  placeItems: "center",
                  transition: "all .15s",
                }}
              >
                <Icon size={16} />
              </span>
              <span>{tab.label}</span>
              {isDrawerForThisOpen && (
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    right: "calc(50% - 14px)",
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: C.pri,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Modal Dialog Pemesanan WhatsApp ── */}
      {showOrderModal && (
        <div
          className="drawer-overlay"
          onClick={() => setShowOrderModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10,13,32,0.65)",
            backdropFilter: "blur(6px)",
            zIndex: 300,
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: C.bg2,
              borderRadius: 20,
              maxWidth: 480,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 22,
              boxShadow: C.sh2,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-.02em" }}>Kirim Pesanan ke WhatsApp</h3>
                <p style={{ fontSize: 12.5, color: C.t2, marginTop: 2 }}>
                  JS Clothing akan memproses pesanan dan menghitung estimasi pengerjaan.
                </p>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="press"
                style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: C.bg3, color: C.t1, display: "grid", placeItems: "center" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Ringkasan Baju */}
            <div style={{ background: C.bg3, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: garmentColor.hex,
                  border: "1px solid rgba(0,0,0,0.2)",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.t0 }}>{garmentType.name}</div>
                <div style={{ fontSize: 12, color: C.t2 }}>{garmentColor.name} • {garmentType.sub}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13.5, fontWeight: 850 }}>{rp(garmentType.basePrice)}</div>
                <div style={{ fontSize: 10.5, color: C.t3 }}>/pcs</div>
              </div>
            </div>

            {/* Nama Pemesan */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, marginBottom: 5 }}>Nama Pemesan / Komunitas</label>
              <input
                type="text"
                value={orderName}
                onChange={e => setOrderName(e.target.value)}
                placeholder="Contoh: Budi Santoso / Alumni 2020"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: `1.5px solid ${C.bo1}`,
                  background: C.bg1,
                  color: C.t0,
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>

            {/* Rincian Ukuran & Jumlah */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 800 }}>Rincian Jumlah & Ukuran</label>
                <span style={{ fontSize: 11.5, color: C.pri, fontWeight: 700 }}>Total: {totalPieces} pcs</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                {Object.keys(orderQty).map(size => (
                  <div
                    key={size}
                    style={{
                      padding: "8px 4px",
                      borderRadius: 10,
                      background: C.bg1,
                      border: `1px solid ${C.bo1}`,
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: C.t1 }}>{size}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => setOrderQty({ ...orderQty, [size]: Math.max(0, (orderQty[size] || 0) - 1) })}
                        className="press"
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: C.bg3,
                          border: `1px solid ${C.bo1}`,
                          color: C.t0,
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <Minus size={11} />
                      </button>
                      <span style={{ minWidth: 20, textAlign: "center", fontSize: 13, fontWeight: 850, color: C.t0 }}>
                        {orderQty[size] || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOrderQty({ ...orderQty, [size]: (orderQty[size] || 0) + 1 })}
                        className="press"
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: C.pri1,
                          border: `1px solid ${C.pri}`,
                          color: C.pri,
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Catatan Tambahan */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, marginBottom: 5 }}>Catatan Sablon (Opsional)</label>
              <textarea
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                placeholder="Contoh: Minta sablon rubber halus, deadline tanggal 25"
                rows={2}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: `1.5px solid ${C.bo1}`,
                  background: C.bg1,
                  color: C.t0,
                  fontSize: 12.5,
                  resize: "none",
                  outline: "none",
                }}
              />
            </div>

            {/* Total Estimasi & Tombol Kirim */}
            <div style={{ borderTop: `1px solid ${C.bo0}`, paddingTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: C.t2, fontWeight: 600 }}>Estimasi ({totalPieces} pcs):</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: C.pri }}>{rp(estimatedPrice)}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={handleCopyOrderSummary}
                  className="press"
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    background: C.bg3,
                    color: C.t1,
                    border: `1px solid ${C.bo1}`,
                    fontWeight: 700,
                    fontSize: 12.5,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                  title="Salin Rincian Pesanan"
                >
                  <Copy size={14} /> Salin
                </button>
                <button
                  onClick={handleSendToWhatsApp}
                  disabled={isExporting}
                  className="press"
                  style={{
                    padding: "11px 20px",
                    borderRadius: 12,
                    background: C.g,
                    color: "#FFF",
                    fontWeight: 800,
                    fontSize: 13.5,
                    border: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 4px 14px rgba(15,123,88,0.28)",
                  }}
                >
                  {isExporting ? <RefreshCw size={16} className="spin" /> : <MessageCircle size={16} />}
                  Kirim ke WA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {notif && (
        <div
          role="status"
          style={{
            position: "fixed",
            bottom: "calc(74px + env(safe-area-inset-bottom, 0px))",
            left: "50%",
            transform: "translateX(-50%)",
            background: C.bg2,
            border: `1px solid ${C.bo1}`,
            color: C.t0,
            fontSize: 13,
            fontWeight: 700,
            padding: "8px 16px",
            borderRadius: 12,
            boxShadow: C.sh2,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <Check size={16} color={C.g} strokeWidth={2.5} />
          {notif}
        </div>
      )}
    </div>
  );
}
