import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Shirt, Sparkles, Upload, Type, Palette, Save, Bookmark, Undo2, Redo2,
  Trash2, Copy, Move, RotateCw, ZoomIn, ZoomOut, Check, ArrowLeft,
  MessageCircle, Download, Eye, Layers, Plus, Minus, X, AlertTriangle,
  Sliders, ChevronRight, RefreshCw, FlipHorizontal, ArrowUp, ArrowDown,
  Info, ExternalLink, Scissors, Phone
} from "lucide-react";
import { fbSaveCustomOrder } from "./firebase";

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
    tag: "Bisa Satuan"
  },
  {
    id: "tshirt_heavy",
    name: "Kaos Tebal",
    sub: "Cotton Combed 24s",
    desc: "Bahan lebih tebal, potongan kokoh, sangat cocok untuk streetwear.",
    basePrice: 65000,
    minQty: 1,
    tag: "Bisa Satuan"
  },
  {
    id: "tshirt_long",
    name: "Lengan Panjang",
    sub: "Cotton Combed 30s Long",
    desc: "Lengan panjang dengan rib karet di pergelangan tangan.",
    basePrice: 70000,
    minQty: 1,
    tag: "Bisa Satuan"
  },
  {
    id: "polo",
    name: "Polo Shirt",
    sub: "Lacoste Pique CVC",
    desc: "Bahan berpori halus dengan kerah formal dan kancing dada.",
    basePrice: 85000,
    minQty: 1,
    tag: "Bisa Satuan"
  },
  {
    id: "hoodie",
    name: "Hoodie Jumper",
    sub: "Cotton Fleece Tebal",
    desc: "Bahan fleece hangat dengan saku kangguru dan tali tudung.",
    basePrice: 135000,
    minQty: 1,
    tag: "Bisa Satuan"
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
  const c = colorHex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  const isLight = yiq > 160;

  const seamColor = isLight ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.16)";
  const foldColor = isLight ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.22)";
  const strokeBorder = isLight ? "rgba(0,0,0,0.16)" : "rgba(0,0,0,0.40)";
  const neckDip = side === "front" ? 134 : 88;
  const gid = `gm_${type}_${side}_${c}`;

  // 1. HOODIE JUMPER
  if (type === "hoodie") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 540" width="100%" height="100%">
      <defs>
        <linearGradient id="${gid}_sheen" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#000" stop-opacity="${isLight ? '0.08' : '0.28'}" />
          <stop offset="20%" stop-color="#000" stop-opacity="${isLight ? '0.02' : '0.08'}" />
          <stop offset="50%" stop-color="#fff" stop-opacity="${isLight ? '0.22' : '0.12'}" />
          <stop offset="80%" stop-color="#000" stop-opacity="${isLight ? '0.02' : '0.08'}" />
          <stop offset="100%" stop-color="#000" stop-opacity="${isLight ? '0.08' : '0.28'}" />
        </linearGradient>
      </defs>

      <!-- Hood Back (Visible from front as background behind neck) -->
      ${side === "front" ? `
        <path d="M 160,94 C 145,18 355,18 340,94 Q 250,118 160,94 Z" fill="${colorHex}" stroke="${strokeBorder}" stroke-width="1.5" />
        <path d="M 175,90 C 165,35 335,35 325,90 Q 250,112 175,90 Z" fill="#000" fill-opacity="${isLight ? '0.14' : '0.35'}" />
      ` : ''}

      <!-- Main Hoodie Silhouette (Torso + Drop Shoulder Sleeves) -->
      <path
        d="M 176,86 Q 250,105 324,86 L 434,128 Q 460,210 472,310 L 436,324 Q 408,280 374,234 Q 368,360 378,476 Q 250,486 122,476 Q 132,360 126,234 Q 92,280 64,324 L 28,310 Q 40,210 66,128 Z"
        fill="${colorHex}"
        stroke="${strokeBorder}"
        stroke-width="1.6"
      />
      <path
        d="M 176,86 Q 250,105 324,86 L 434,128 Q 460,210 472,310 L 436,324 Q 408,280 374,234 Q 368,360 378,476 Q 250,486 122,476 Q 132,360 126,234 Q 92,280 64,324 L 28,310 Q 40,210 66,128 Z"
        fill="url(#${gid}_sheen)"
      />

      <!-- Ribbed Cuffs (Pergelangan Tangan) -->
      <path d="M 28,310 L 64,324 L 58,342 L 22,328 Z" fill="${colorHex}" stroke="${seamColor}" stroke-width="1.4" />
      <path d="M 472,310 L 436,324 L 442,342 L 478,328 Z" fill="${colorHex}" stroke="${seamColor}" stroke-width="1.4" />

      <!-- Ribbed Bottom Waistband Hem (Karet Pinggang Bawah Tebal) -->
      <path d="M 122,476 Q 250,486 378,476 L 378,516 Q 250,526 122,516 Z" fill="${colorHex}" stroke="${seamColor}" stroke-width="1.6" />
      <path d="M 122,476 Q 250,486 378,476" stroke="${seamColor}" stroke-width="2" fill="none" />
      <path d="M 122,496 Q 250,506 378,496" stroke="${seamColor}" stroke-width="1" stroke-dasharray="8 4" fill="none" />

      <!-- Drop Shoulder Seams -->
      <path d="M 66,128 Q 98,180 126,234" stroke="${seamColor}" stroke-width="1.8" fill="none" />
      <path d="M 434,128 Q 402,180 374,234" stroke="${seamColor}" stroke-width="1.8" fill="none" />

      ${side === "front" ? `
        <!-- Kangaroo Pocket (Saku Depan Khas Hoodie) -->
        <g>
          <path
            d="M 176,350 L 324,350 L 358,426 L 354,476 Q 250,486 146,476 L 142,426 Z"
            fill="${colorHex}"
            stroke="${strokeBorder}"
            stroke-width="1.6"
          />
          <path
            d="M 176,350 L 324,350 L 358,426 L 354,476 Q 250,486 146,476 L 142,426 Z"
            fill="url(#${gid}_sheen)"
          />
          <!-- Pocket Opening Seams -->
          <path d="M 176,350 L 142,426" stroke="${seamColor}" stroke-width="2.5" />
          <path d="M 324,350 L 358,426" stroke="${seamColor}" stroke-width="2.5" />
          <path d="M 176,350 L 324,350" stroke="${seamColor}" stroke-width="1.8" />
        </g>

        <!-- Hood Crossover Neckline -->
        <path d="M 170,86 Q 220,132 258,132 Q 210,126 170,86 Z" fill="${colorHex}" stroke="${seamColor}" stroke-width="1.6" />
        <path d="M 330,86 Q 280,132 242,132 Q 290,126 330,86 Z" fill="${colorHex}" stroke="${seamColor}" stroke-width="1.6" />

        <!-- Drawstrings (Tali Hoodie) with Metallic Aglets -->
        <path d="M 224,128 Q 218,175 214,216" stroke="${isLight ? '#444' : '#e2e8f0'}" stroke-width="3.5" stroke-linecap="round" fill="none" />
        <path d="M 276,128 Q 282,175 286,216" stroke="${isLight ? '#444' : '#e2e8f0'}" stroke-width="3.5" stroke-linecap="round" fill="none" />
        <rect x="211" y="216" width="6" height="12" rx="2" fill="#94a3b8" stroke="#475569" stroke-width="0.8" />
        <rect x="283" y="216" width="6" height="12" rx="2" fill="#94a3b8" stroke="#475569" stroke-width="0.8" />
      ` : `
        <!-- Back View Draped Hood -->
        <path
          d="M 160,82 C 140,16 360,16 340,82 C 354,160 300,195 250,195 C 200,195 146,160 160,82 Z"
          fill="${colorHex}"
          stroke="${strokeBorder}"
          stroke-width="1.8"
        />
        <path d="M 250,22 L 250,195" stroke="${seamColor}" stroke-width="1.4" stroke-dasharray="4 2" fill="none" />
        <path d="M 160,82 C 180,120 220,135 250,135 C 280,135 320,120 340,82" stroke="${seamColor}" stroke-width="1.5" fill="none" />
      `}
    </svg>`;
  }

  // 2. POLO SHIRT
  if (type === "polo") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 540" width="100%" height="100%">
      <defs>
        <linearGradient id="${gid}_sheen" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#000" stop-opacity="${isLight ? '0.08' : '0.28'}" />
          <stop offset="20%" stop-color="#000" stop-opacity="${isLight ? '0.02' : '0.08'}" />
          <stop offset="50%" stop-color="#fff" stop-opacity="${isLight ? '0.22' : '0.12'}" />
          <stop offset="80%" stop-color="#000" stop-opacity="${isLight ? '0.02' : '0.08'}" />
          <stop offset="100%" stop-color="#000" stop-opacity="${isLight ? '0.08' : '0.28'}" />
        </linearGradient>
      </defs>

      <!-- Inside Back Collar (Front view) -->
      ${side === "front" ? `
        <path d="M 186,72 Q 250,56 314,72 Q 250,86 186,72 Z" fill="#000" fill-opacity="${isLight ? '0.14' : '0.38'}" />
      ` : ''}

      <!-- Main Polo Silhouette -->
      <path
        d="M 186,72 Q 250,${side === 'front' ? '92' : '88'} 314,72 L 414,110 Q 448,155 476,208 L 418,234 Q 395,226 366,218 Q 360,350 374,506 Q 250,520 126,506 Q 140,350 134,218 Q 105,226 82,234 L 24,208 Q 52,155 86,110 Z"
        fill="${colorHex}"
        stroke="${strokeBorder}"
        stroke-width="1.5"
      />
      <path
        d="M 186,72 Q 250,${side === 'front' ? '92' : '88'} 314,72 L 414,110 Q 448,155 476,208 L 418,234 Q 395,226 366,218 Q 360,350 374,506 Q 250,520 126,506 Q 140,350 134,218 Q 105,226 82,234 L 24,208 Q 52,155 86,110 Z"
        fill="url(#${gid}_sheen)"
      />

      <!-- Ribbed Sleeve Bands (Manset Lengan Polo) -->
      <path d="M 24,208 L 82,234 L 88,220 L 30,194 Z" fill="${colorHex}" stroke="${seamColor}" stroke-width="1.3" />
      <path d="M 476,208 L 418,234 L 412,220 L 470,194 Z" fill="${colorHex}" stroke="${seamColor}" stroke-width="1.3" />

      <!-- Armhole & Shoulder Seams -->
      <path d="M 86,110 Q 116,158 134,218" stroke="${seamColor}" stroke-width="1.8" fill="none" />
      <path d="M 414,110 Q 384,158 366,218" stroke="${seamColor}" stroke-width="1.8" fill="none" />
      <path d="M 186,72 L 86,110" stroke="${seamColor}" stroke-width="1.4" stroke-dasharray="6 2" fill="none" />
      <path d="M 314,72 L 414,110" stroke="${seamColor}" stroke-width="1.4" stroke-dasharray="6 2" fill="none" />

      <!-- Side Slits at Bottom Hem -->
      <path d="M 127,494 Q 250,508 373,494" stroke="${seamColor}" stroke-width="1.2" stroke-dasharray="5 2.5" fill="none" />
      <path d="M 126,494 L 126,506 L 132,506" stroke="${seamColor}" stroke-width="1.4" fill="none" />
      <path d="M 374,494 L 374,506 L 368,506" stroke="${seamColor}" stroke-width="1.4" fill="none" />

      ${side === "front" ? `
        <!-- Button Placket (Tatakan Kancing Polo) -->
        <g>
          <rect x="236" y="94" width="28" height="122" rx="3" fill="${colorHex}" stroke="${seamColor}" stroke-width="1.6" />
          <!-- Placket Bottom Box Stitch with Cross -->
          <rect x="236" y="190" width="28" height="26" fill="${colorHex}" stroke="${seamColor}" stroke-width="1.4" />
          <path d="M 236,190 L 264,216 M 264,190 L 236,216" stroke="${seamColor}" stroke-width="1.2" fill="none" />
          <!-- 3 Pearlized Buttons -->
          <circle cx="250" cy="116" r="4.2" fill="${isLight ? '#ffffff' : '#f8fafc'}" stroke="#94a3b8" stroke-width="1" />
          <circle cx="250" cy="144" r="4.2" fill="${isLight ? '#ffffff' : '#f8fafc'}" stroke="#94a3b8" stroke-width="1" />
          <circle cx="250" cy="172" r="4.2" fill="${isLight ? '#ffffff' : '#f8fafc'}" stroke="#94a3b8" stroke-width="1" />
          <!-- Button Thread Crosses -->
          <path d="M 248.5,116 L 251.5,116 M 250,114.5 L 250,117.5" stroke="#475569" stroke-width="0.8" />
          <path d="M 248.5,144 L 251.5,144 M 250,142.5 L 250,145.5" stroke="#475569" stroke-width="0.8" />
          <path d="M 248.5,172 L 251.5,172 M 250,170.5 L 250,173.5" stroke="#475569" stroke-width="0.8" />
        </g>

        <!-- Left Folded Collar Wing -->
        <path
          d="M 186,72 L 174,134 Q 205,138 236,136 L 236,94 Q 212,80 186,72 Z"
          fill="${colorHex}"
          stroke="${strokeBorder}"
          stroke-width="1.5"
        />
        <!-- Right Folded Collar Wing -->
        <path
          d="M 314,72 L 326,134 Q 295,138 264,136 L 264,94 Q 288,80 314,72 Z"
          fill="${colorHex}"
          stroke="${strokeBorder}"
          stroke-width="1.5"
        />
      ` : `
        <!-- Back View Folded Collar -->
        <path
          d="M 180,68 Q 250,50 320,68 Q 250,96 180,68 Z"
          fill="${colorHex}"
          stroke="${strokeBorder}"
          stroke-width="1.6"
        />
        <path d="M 180,78 Q 250,102 320,78" stroke="${seamColor}" stroke-width="1.4" stroke-dasharray="5 2.5" fill="none" />
      `}
    </svg>`;
  }

  // 3. KAOS LENGAN PANJANG
  if (type === "tshirt_long") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 540" width="100%" height="100%">
      <defs>
        <linearGradient id="${gid}_sheen" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#000" stop-opacity="${isLight ? '0.07' : '0.28'}" />
          <stop offset="20%" stop-color="#000" stop-opacity="${isLight ? '0.02' : '0.10'}" />
          <stop offset="50%" stop-color="#fff" stop-opacity="${isLight ? '0.25' : '0.12'}" />
          <stop offset="80%" stop-color="#000" stop-opacity="${isLight ? '0.02' : '0.10'}" />
          <stop offset="100%" stop-color="#000" stop-opacity="${isLight ? '0.07' : '0.28'}" />
        </linearGradient>
      </defs>

      <!-- Inside Back Collar (Front view) -->
      ${side === "front" ? `
        <path d="M 186,72 Q 250,50 314,72 Q 250,134 186,72 Z" fill="#000000" fill-opacity="${isLight ? '0.14' : '0.40'}" />
        <rect x="242" y="58" width="16" height="20" rx="2" fill="${isLight ? '#ffffff' : '#282b3c'}" stroke="rgba(0,0,0,0.15)" stroke-width="0.8" />
        <text x="250" y="72" text-anchor="middle" font-family="sans-serif" font-size="7.5" font-weight="bold" fill="${isLight ? '#555' : '#ccc'}">L</text>
      ` : ''}

      <!-- Main Garment Silhouette (Long Sleeves + Torso) -->
      <path
        d="M 186,72 Q 250,${neckDip} 314,72 L 414,110 Q 442,240 460,396 L 424,408 Q 398,310 366,218 Q 360,350 374,506 Q 250,520 126,506 Q 140,350 134,218 Q 102,310 76,408 L 40,396 Q 58,240 86,110 Z"
        fill="${colorHex}"
        stroke="${strokeBorder}"
        stroke-width="1.5"
      />
      <path
        d="M 186,72 Q 250,${neckDip} 314,72 L 414,110 Q 442,240 460,396 L 424,408 Q 398,310 366,218 Q 360,350 374,506 Q 250,520 126,506 Q 140,350 134,218 Q 102,310 76,408 L 40,396 Q 58,240 86,110 Z"
        fill="url(#${gid}_sheen)"
      />

      <!-- Ribbed Wrist Cuffs (Karet Pergelangan Tangan) -->
      <path d="M 40,396 L 76,408 L 71,424 L 35,412 Z" fill="${colorHex}" stroke="${seamColor}" stroke-width="1.3" />
      <path d="M 460,396 L 424,408 L 429,424 L 465,412 Z" fill="${colorHex}" stroke="${seamColor}" stroke-width="1.3" />
      <path d="M 40,396 L 76,408" stroke="${seamColor}" stroke-width="1.8" />
      <path d="M 460,396 L 424,408" stroke="${seamColor}" stroke-width="1.8" />

      <!-- Collar Rib Band -->
      ${side === "front" ? `
        <path
          d="M 186,72 Q 250,134 314,72 Q 318,76 315,83 Q 250,145 185,83 Q 182,76 186,72 Z"
          fill="${colorHex}"
          stroke="${seamColor}"
          stroke-width="1.2"
        />
        <path d="M 183,85 Q 250,147 317,85" fill="none" stroke="${seamColor}" stroke-width="1.2" stroke-dasharray="4 2" />
      ` : `
        <path
          d="M 186,72 Q 250,88 314,72 Q 318,76 315,83 Q 250,99 185,83 Q 182,76 186,72 Z"
          fill="${colorHex}"
          stroke="${seamColor}"
          stroke-width="1.2"
        />
        <path d="M 183,85 Q 250,101 317,85" fill="none" stroke="${seamColor}" stroke-width="1.2" stroke-dasharray="4 2" />
        <path d="M 186,85 Q 250,126 314,85" fill="none" stroke="${seamColor}" stroke-width="1.2" stroke-dasharray="5 2.5" />
      `}

      <!-- Armhole Seams & Shoulder Seams -->
      <path d="M 86,110 Q 116,158 134,218" stroke="${seamColor}" stroke-width="1.8" fill="none" />
      <path d="M 414,110 Q 384,158 366,218" stroke="${seamColor}" stroke-width="1.8" fill="none" />
      <path d="M 186,72 L 86,110" stroke="${seamColor}" stroke-width="1.4" stroke-dasharray="6 2" fill="none" />
      <path d="M 314,72 L 414,110" stroke="${seamColor}" stroke-width="1.4" stroke-dasharray="6 2" fill="none" />

      <!-- Bottom Hem Twin Stitches -->
      <path d="M 127,494 Q 250,508 373,494" stroke="${seamColor}" stroke-width="1.2" stroke-dasharray="5 2.5" fill="none" />
      <path d="M 127,499 Q 250,513 373,499" stroke="${seamColor}" stroke-width="1.2" stroke-dasharray="5 2.5" fill="none" />
    </svg>`;
  }

  // 4 & 5. DEFAULT: KAOS PENDEK COMBED 30s & 24s
  const isHeavy = type === "tshirt_heavy";
  const ribHeight = isHeavy ? 15 : 12;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 540" width="100%" height="100%">
    <defs>
      <linearGradient id="${gid}_sheen" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#000" stop-opacity="${isLight ? '0.07' : '0.28'}" />
        <stop offset="20%" stop-color="#000" stop-opacity="${isLight ? '0.02' : '0.10'}" />
        <stop offset="50%" stop-color="#fff" stop-opacity="${isLight ? '0.25' : '0.12'}" />
        <stop offset="80%" stop-color="#000" stop-opacity="${isLight ? '0.02' : '0.10'}" />
        <stop offset="100%" stop-color="#000" stop-opacity="${isLight ? '0.07' : '0.28'}" />
      </linearGradient>
      <linearGradient id="${gid}_depth" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#fff" stop-opacity="${isLight ? '0.15' : '0.08'}" />
        <stop offset="85%" stop-color="#000" stop-opacity="0" />
        <stop offset="100%" stop-color="#000" stop-opacity="${isLight ? '0.08' : '0.25'}" />
      </linearGradient>
    </defs>

    <!-- Inside Back Collar (Visible only on Front view) -->
    ${side === "front" ? `
      <path d="M 186,72 Q 250,50 314,72 Q 250,134 186,72 Z" fill="#000000" fill-opacity="${isLight ? '0.14' : '0.40'}" />
      <rect x="242" y="58" width="16" height="20" rx="2" fill="${isLight ? '#ffffff' : '#282b3c'}" stroke="rgba(0,0,0,0.15)" stroke-width="0.8" />
      <text x="250" y="72" text-anchor="middle" font-family="sans-serif" font-size="7.5" font-weight="bold" fill="${isLight ? '#555' : '#ccc'}">L</text>
    ` : ''}

    <!-- Single Continuous Main Garment Silhouette (Body + Sleeves) -->
    <path
      d="M 186,72 Q 250,${neckDip} 314,72 L 414,110 Q 448,155 476,208 L 418,234 Q 395,226 366,218 Q 360,350 374,506 Q 250,520 126,506 Q 140,350 134,218 Q 105,226 82,234 L 24,208 Q 52,155 86,110 Z"
      fill="${colorHex}"
      stroke="${strokeBorder}"
      stroke-width="1.5"
    />

    <!-- Fabric Sheen & Depth Gradient Overlay -->
    <path
      d="M 186,72 Q 250,${neckDip} 314,72 L 414,110 Q 448,155 476,208 L 418,234 Q 395,226 366,218 Q 360,350 374,506 Q 250,520 126,506 Q 140,350 134,218 Q 105,226 82,234 L 24,208 Q 52,155 86,110 Z"
      fill="url(#${gid}_sheen)"
    />
    <path
      d="M 186,72 Q 250,${neckDip} 314,72 L 414,110 Q 448,155 476,208 L 418,234 Q 395,226 366,218 Q 360,350 374,506 Q 250,520 126,506 Q 140,350 134,218 Q 105,226 82,234 L 24,208 Q 52,155 86,110 Z"
      fill="url(#${gid}_depth)"
    />

    <!-- Collar Rib Band -->
    ${side === "front" ? `
      <path
        d="M 186,72 Q 250,134 314,72 Q 318,76 315,${72 + ribHeight - 1} Q 250,${134 + ribHeight - 1} 185,${72 + ribHeight - 1} Q 182,76 186,72 Z"
        fill="${colorHex}"
        stroke="${seamColor}"
        stroke-width="1.2"
      />
      <!-- Collar Seam Twin-Stitch -->
      <path d="M 183,${72 + ribHeight + 1} Q 250,${134 + ribHeight + 1} 317,${72 + ribHeight + 1}" fill="none" stroke="${seamColor}" stroke-width="1.2" stroke-dasharray="4 2" />
    ` : `
      <path
        d="M 186,72 Q 250,88 314,72 Q 318,76 315,${72 + ribHeight - 1} Q 250,${88 + ribHeight - 1} 185,${72 + ribHeight - 1} Q 182,76 186,72 Z"
        fill="${colorHex}"
        stroke="${seamColor}"
        stroke-width="1.2"
      />
      <!-- Back Neck Tape Reinforcement Stitch -->
      <path d="M 183,${72 + ribHeight + 1} Q 250,${88 + ribHeight + 1} 317,${72 + ribHeight + 1}" fill="none" stroke="${seamColor}" stroke-width="1.2" stroke-dasharray="4 2" />
      <path d="M 186,85 Q 250,126 314,85" fill="none" stroke="${seamColor}" stroke-width="1.2" stroke-dasharray="5 2.5" />
    `}

    <!-- Shoulder Seams -->
    <path d="M 186,72 L 86,110" stroke="${seamColor}" stroke-width="1.4" stroke-dasharray="6 2" fill="none" />
    <path d="M 314,72 L 414,110" stroke="${seamColor}" stroke-width="1.4" stroke-dasharray="6 2" fill="none" />

    <!-- Armhole Seams (Connection from Shoulder to Armpit) -->
    <path d="M 86,110 Q 116,158 134,218" stroke="${seamColor}" stroke-width="1.8" fill="none" />
    <path d="M 414,110 Q 384,158 366,218" stroke="${seamColor}" stroke-width="1.8" fill="none" />

    <!-- Sleeve Cuff Stitches -->
    <path d="M 32,204 L 80,227" stroke="${seamColor}" stroke-width="1.2" stroke-dasharray="4 2" fill="none" />
    <path d="M 468,204 L 420,227" stroke="${seamColor}" stroke-width="1.2" stroke-dasharray="4 2" fill="none" />

    <!-- Bottom Hem Twin Stitches -->
    <path d="M 127,494 Q 250,508 373,494" stroke="${seamColor}" stroke-width="1.2" stroke-dasharray="5 2.5" fill="none" />
    <path d="M 127,499 Q 250,513 373,499" stroke="${seamColor}" stroke-width="1.2" stroke-dasharray="5 2.5" fill="none" />

    <!-- Natural Drape Folds -->
    <path d="M 134,218 Q 155,236 172,246" stroke="${foldColor}" stroke-width="2" stroke-linecap="round" fill="none" />
    <path d="M 366,218 Q 345,236 328,246" stroke="${foldColor}" stroke-width="2" stroke-linecap="round" fill="none" />
    <path d="M 137,360 Q 165,374 190,369" stroke="${foldColor}" stroke-width="1.6" stroke-linecap="round" fill="none" />
    <path d="M 363,360 Q 335,374 310,369" stroke="${foldColor}" stroke-width="1.6" stroke-linecap="round" fill="none" />
  </svg>`;
}

// ─────────────────────────────────────────────────────────────
//  REALISTIC SVG GARMENT SILHOUETTES WITH FABRIC DEPTH
// ─────────────────────────────────────────────────────────────
export function GarmentIllustration({ type, colorHex, side = "front" }) {
  const svgMarkup = getGarmentSvgMarkup(type, colorHex, side);

  return (
    <div
      className="garment-svg-wrapper"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        filter: "drop-shadow(0 18px 36px rgba(0,0,0,0.20))",
        pointerEvents: "none",
        userSelect: "none",
      }}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
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
      const raw = JSON.parse(localStorage.getItem("je_custom_shirts") || "[]");
      return Array.isArray(raw) ? raw.filter(x => x && typeof x === "object" && x.id) : [];
    } catch {
      return [];
    }
  });

  // ── Dialog Order WhatsApp ──
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderName, setOrderName] = useState("");
  const [orderPhone, setOrderPhone] = useState("");
  const [orderQty, setOrderQty] = useState({ S: 0, M: 0, L: 1, XL: 0, XXL: 0 });
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

  // Elemen aktif saat ini sesuai sisi aktif (selalu difilter dari elemen null)
  const currentElements = (activeSide === "front" ? frontElements : backElements).filter(Boolean);
  const setCurrentElements = (updater) => {
    const sanitize = (prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return Array.isArray(next) ? next.filter(Boolean) : [];
    };
    if (activeSide === "front") {
      setFrontElements(sanitize);
    } else {
      setBackElements(sanitize);
    }
  };

  // Simpan snapshot untuk riwayat Undo/Redo
  const recordHistory = useCallback((fEls, bEls) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, histStep + 1);
      return [...trimmed, {
        front: Array.isArray(fEls) ? fEls.filter(Boolean) : [],
        back: Array.isArray(bEls) ? bEls.filter(Boolean) : []
      }];
    });
    setHistStep(prev => prev + 1);
  }, [histStep]);

  // Handle Undo
  const handleUndo = () => {
    if (histStep > 0) {
      const target = history[histStep - 1];
      if (target) {
        setFrontElements(Array.isArray(target.front) ? target.front.filter(Boolean) : []);
        setBackElements(Array.isArray(target.back) ? target.back.filter(Boolean) : []);
        setHistStep(histStep - 1);
        setSelectedId(null);
      }
    }
  };

  // Handle Redo
  const handleRedo = () => {
    if (histStep < history.length - 1) {
      const target = history[histStep + 1];
      if (target) {
        setFrontElements(Array.isArray(target.front) ? target.front.filter(Boolean) : []);
        setBackElements(Array.isArray(target.back) ? target.back.filter(Boolean) : []);
        setHistStep(histStep + 1);
        setSelectedId(null);
      }
    }
  };

  // Auto-Save Draft
  useEffect(() => {
    try {
      const draft = {
        garmentId: garmentType.id,
        colorId: garmentColor.id,
        front: (frontElements || []).filter(Boolean),
        back: (backElements || []).filter(Boolean),
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
        if (d && ((Array.isArray(d.front) && d.front.length > 0) || (Array.isArray(d.back) && d.back.length > 0))) {
          const g = GARMENT_TYPES.find(x => x && x.id === d.garmentId) || GARMENT_TYPES[0];
          const c = GARMENT_COLORS.find(x => x && x.id === d.colorId) || GARMENT_COLORS[0];
          setGarmentType(g);
          setGarmentColor(c);
          const safeFront = Array.isArray(d.front) ? d.front.filter(Boolean) : [];
          const safeBack = Array.isArray(d.back) ? d.back.filter(Boolean) : [];
          setFrontElements(safeFront);
          setBackElements(safeBack);
          setHistory([{ front: safeFront, back: safeBack }]);
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
      if (el && el.id === selectedId) {
        return typeof updater === "function" ? updater(el) : { ...el, ...updater };
      }
      return el;
    }).filter(Boolean);
    setCurrentElements(next);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    const next = currentElements.filter(el => el && el.id !== selectedId);
    setCurrentElements(next);
    setSelectedId(null);
    recordHistory(activeSide === "front" ? next : frontElements, activeSide === "back" ? next : backElements);
    showToast("Elemen dihapus");
  };

  const duplicateSelected = () => {
    if (!selectedId) return;
    const src = currentElements.find(el => el && el.id === selectedId);
    if (!src) return;
    const clone = {
      ...src,
      id: (src.type || "el") + "_" + Date.now().toString(36),
      x: Math.min(80, (src.x || 50) + 5),
      y: Math.min(80, (src.y || 45) + 5),
    };
    const next = [...currentElements.filter(Boolean), clone];
    setCurrentElements(next);
    setSelectedId(clone.id);
    recordHistory(activeSide === "front" ? next : frontElements, activeSide === "back" ? next : backElements);
    showToast("Elemen diduplikasi");
  };

  const selectedElement = currentElements.find(el => el && el.id === selectedId);

  // Auto-sync text settings saat elemen teks dipilih agar bisa langsung diedit
  useEffect(() => {
    if (selectedElement && selectedElement.type === "text") {
      setNewText(selectedElement.text || "");
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
    const el = currentElements.find(x => x && x.id === elId);
    if (!el) return;

    dragRef.current = {
      id: elId,
      startX: clientX,
      startY: clientY,
      origX: el.x || 50,
      origY: el.y || 50,
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

    const newX = Math.max(10, Math.min(90, (dragRef.current.origX || 50) + deltaXPercent));
    const newY = Math.max(10, Math.min(90, (dragRef.current.origY || 50) + deltaYPercent));

    setCurrentElements(prev => (prev || []).filter(Boolean).map(el => (el && el.id === dragRef.current?.id) ? { ...el, x: Math.round(newX), y: Math.round(newY) } : el));
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
      if (ask === null) return;
      title = ask.trim() || defaultTitle;
    }
    const item = {
      id: "ds_" + Date.now().toString(36),
      title: title.trim(),
      date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      garment: garmentType,
      color: garmentColor,
      front: (frontElements || []).filter(Boolean),
      back: (backElements || []).filter(Boolean),
    };

    const nextList = [item, ...savedDesigns.filter(x => x && x.title !== item.title)];
    setSavedDesigns(nextList);
    try {
      localStorage.setItem("je_custom_shirts", JSON.stringify(nextList));
    } catch {}
    showToast(`Desain "${item.title}" tersimpan!`);
    setActiveTab("saved");
  };

  const loadSavedDesign = (item) => {
    if (!item) return;
    const g = GARMENT_TYPES.find(x => x && x.id === item.garment?.id) || item.garment || GARMENT_TYPES[0];
    const c = GARMENT_COLORS.find(x => x && x.id === item.color?.id) || item.color || GARMENT_COLORS[0];
    setGarmentType(g);
    setGarmentColor(c);
    const safeFront = Array.isArray(item.front) ? item.front.filter(Boolean) : [];
    const safeBack = Array.isArray(item.back) ? item.back.filter(Boolean) : [];
    setFrontElements(safeFront);
    setBackElements(safeBack);
    setSelectedId(null);
    recordHistory(safeFront, safeBack);
    showToast(`Desain "${item.title || "Kustom"}" dimuat`);
  };

  const deleteSavedDesign = (id) => {
    if (!id) return;
    if (!window.confirm("Hapus desain ini dari daftar tersimpan?")) return;
    const nextList = savedDesigns.filter(x => x && x.id !== id);
    setSavedDesigns(nextList);
    try {
      localStorage.setItem("je_custom_shirts", JSON.stringify(nextList));
    } catch {}
    showToast("Desain dihapus");
  };

  // ─────────────────────────────────────────────────────────────
  //  EXPORT HIGH-RES MOCKUP KE CANVAS & DOWNLOAD PNG
  // ─────────────────────────────────────────────────────────────
  const renderMockupImage = useCallback(async (format = "png") => {
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
    ctx.textAlign = "center";
    ctx.fillText("TAMPAK DEPAN", 280, 145);
    ctx.fillText("TAMPAK BELAKANG", 880, 145);
    ctx.textAlign = "start";

    // Helper untuk merender mockup ke canvas
    const drawSide = async (sideName, xOffset) => {
      const rawEls = sideName === "front" ? frontElements : backElements;
      const els = (rawEls || []).filter(Boolean);

      // Buat SVG garment string dinamis sesuai tipe & warna pakaian
      const svgString = getGarmentSvgMarkup(garmentType.id, garmentColor.hex, sideName);

      const img = new Image();
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      await new Promise((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, xOffset, 160, 460, 497);
          URL.revokeObjectURL(blobURL);
          resolve(true);
        };
        img.onerror = () => {
          URL.revokeObjectURL(blobURL);
          resolve(true);
        };
        img.src = blobURL;
      });

      // Render sablon elements (Safe Zone: left 28%, top 23%, width 44%, height 54%)
      for (const el of els) {
        if (!el) continue;
        ctx.save();
        const posX = xOffset + 128.8 + ((el.x || 50) / 100) * 202.4;
        const posY = 160 + 114.3 + ((el.y || 45) / 100) * 268.4;
        ctx.translate(posX, posY);
        if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
        if (el.scale) ctx.scale(el.scale, el.scale);

        if (el.type === "text") {
          ctx.fillStyle = el.color || "#FFFFFF";
          ctx.textAlign = el.align || "center";
          ctx.font = `${el.isBold ? "bold " : ""}${el.isItalic ? "italic " : ""}${(el.fontSize || 26) * 1.3}px ${el.fontFamily || "sans-serif"}`;
          ctx.fillText(el.text || "", 0, 0);
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

    if (format === "jpeg") {
      return canvas.toDataURL("image/jpeg", 0.85);
    }
    return canvas.toDataURL("image/png");
  }, [garmentType, garmentColor, frontElements, backElements]);

  // Download Mockup PNG
  const handleDownloadMockup = async () => {
    setIsExporting(true);
    try {
      const dataUrl = await renderMockupImage("png");
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
    if (totalPieces < 1) {
      alert("Silakan masukkan jumlah pesanan minimal 1 pcs (bisa pesan satuan).");
      return;
    }

    setIsExporting(true);

    let mockupJpeg = "";
    try {
      mockupJpeg = await renderMockupImage("jpeg");
    } catch (e) {
      console.warn("Gagal membuat thumbnail JPEG mockup:", e);
    }

    // Download mockup gambar otomatis agar customer bisa langsung lampirkan di WA
    try {
      await handleDownloadMockup();
    } catch {}

    // Rangkum elemen sablon
    const frontList = (frontElements || []).filter(Boolean);
    const backList = (backElements || []).filter(Boolean);

    const frontDesc = frontList.length === 0
      ? "Polos"
      : frontList.map(x => x.type === "text" ? `Teks: "${x.text}"` : (x.name || "Gambar/Logo")).join(", ");

    const backDesc = backList.length === 0
      ? "Polos"
      : backList.map(x => x.type === "text" ? `Teks: "${x.text}"` : (x.name || "Gambar/Logo")).join(", ");

    const sizeBreakdown = Object.entries(orderQty)
      .filter(([_, q]) => q > 0)
      .map(([s, q]) => `${s}: ${q} pcs`)
      .join(", ");

    const orderCode = "JE-CST-" + Math.floor(1000 + Math.random() * 9000);

    // Simpan pesanan ke database Firestore & Local Backup agar admin dapat melihat hasil desainnya
    try {
      await fbSaveCustomOrder({
        orderCode,
        customerName: orderName.trim() || "Customer",
        customerPhone: orderPhone.trim() || "",
        garment: {
          id: garmentType.id,
          name: garmentType.name,
          sub: garmentType.sub,
          basePrice: garmentType.basePrice,
        },
        color: {
          id: garmentColor.id,
          name: garmentColor.name,
          hex: garmentColor.hex,
        },
        sizeBreakdown: orderQty,
        totalPieces,
        unitPrice: garmentType.basePrice,
        estimatedPrice,
        notes: orderNotes.trim(),
        sides: frontList.length > 0 && backList.length > 0 ? "Depan & Belakang" : frontList.length > 0 ? "Hanya Depan" : "Hanya Belakang",
        frontElements: frontList,
        backElements: backList,
        mockupImage: mockupJpeg,
        status: "Baru",
      });
    } catch (err) {
      console.warn("fbSaveCustomOrder error:", err);
    }

    const textMsg = `Halo JS Clothing (JE Grup), saya ingin memesan baju custom dengan hasil rancangan dari Studio Desain:

🔖 *KODE PESANAN*: #${orderCode}
👤 *Pemesan*: ${orderName.trim() || "Customer"}
${orderPhone ? `📞 *No. WhatsApp*: ${orderPhone.trim()}\n` : ""}
📋 *SPESIFIKASI PESANAN CUSTOM*
• *Model Pakaian*: ${garmentType.name} (${garmentType.sub})
• *Warna Kain*: ${garmentColor.name}
• *Sisi Sablon*: ${frontList.length > 0 && backList.length > 0 ? "Depan & Belakang" : (frontList.length > 0 ? "Hanya Depan" : "Hanya Belakang")}
• *Desain Depan*: ${frontDesc}
• *Desain Belakang*: ${backDesc}

📦 *RINCIAN UKURAN & JUMLAH*
• *Pilihan Ukuran*: ${sizeBreakdown || "1 pcs"}
• *Total Pesanan*: ${totalPieces} pcs
• *Estimasi Total*: ${rp(estimatedPrice)}
${orderNotes ? `📝 *Catatan Tambahan*: ${orderNotes}\n` : ""}
🖼️ *HASIL GAMBAR MOCKUP DESAIN*:
Gambar mockup desain baju ini sudah *TERSIMPAN OTOMATIS* di Admin Panel JE Grup. Admin dapat langsung mengecek gambar mockup ukuran penuh & spesifikasi sablon di menu *Pesanan Baju* (Cari Kode: *#${orderCode}*).

Mohon info ketersediaan bahan dan jadwal produksinya ya. Terima kasih!`;

    const cleanNum = String(waNumber).replace(/\D/g, "");
    const waUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(textMsg)}`;

    setIsExporting(false);
    setShowOrderModal(false);
    showToast(`Pesanan #${orderCode} berhasil disimpan ke sistem!`);
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
              savedDesigns.filter(item => item && item.id).map(item => (
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
              width: "min(88vw, 440px)",
              aspectRatio: "500 / 540",
              maxHeight: "min(72vh, 540px)",
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
                top: "23%",
                left: "28%",
                width: "44%",
                height: "54%",
                border: showSafeZone ? "1.5px dashed rgba(142,156,255,0.6)" : "none",
                borderRadius: 8,
                pointerEvents: "auto",
              }}
            >
              {/* Safe Zone Badge Hint */}
              {showSafeZone && (
                <div
                  style={{
                    position: "absolute",
                    top: -14,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: "0.03em",
                    color: C.pri,
                    background: C.bg2,
                    border: `1px solid ${C.pri}33`,
                    padding: "2px 8px",
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    zIndex: 10,
                  }}
                >
                  Area Sablon {activeSide === "front" ? "Dada" : "Punggung"}
                </div>
              )}

              {/* Render Canvas Elements for Active Side */}
              {currentElements.filter(Boolean).map(el => {
                if (!el || !el.id) return null;
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

            {/* Badge Bebas Minimal Order */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 11px", background: C.g1, borderRadius: 10, color: C.g, fontSize: 11.5, fontWeight: 700 }}>
              <Check size={14} strokeWidth={3} />
              <span>Bisa pesan satuan (mulai 1 pcs) atau partai banyak untuk tim/event.</span>
            </div>

            {/* Banner Otomatis Tersimpan ke Admin */}
            <div style={{ padding: "9px 12px", background: C.pri1, borderRadius: 10, border: `1px solid ${C.pri}33`, display: "flex", gap: 8, alignItems: "flex-start" }}>
              <Sparkles size={16} color={C.pri} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 11.5, color: C.t0, lineHeight: 1.45 }}>
                <b>Desain Otomatis Tersimpan</b>: Anda tidak perlu repot melampirkan gambar manual di WhatsApp. Rancangan mockup Anda otomatis tersimpan ke Admin Panel JE Grup sehingga admin dapat langsung mengeceknya.
              </div>
            </div>

            {/* Nama & Kontak Pemesan */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, marginBottom: 5 }}>Nama Pemesan / Tim</label>
                <input
                  type="text"
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
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
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, marginBottom: 5 }}>No. WhatsApp Anda</label>
                <input
                  type="tel"
                  value={orderPhone}
                  onChange={e => setOrderPhone(e.target.value)}
                  placeholder="08123456789"
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
