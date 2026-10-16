import { useEffect, useState } from 'react';
import { MUSIC_THEME_LABELS, MusicTheme, soundFX } from '../audio/useSound';
import { useGameStore } from '../store/useGameStore';

type Pt = [number, number];

function hexPoints(cx: number, cy: number, r: number, squash = 0.56): Pt[] {
  return Array.from({ length: 6 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 3;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * squash] as Pt;
  });
}

function poly(pts: Pt[]): string {
  return pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
}

function starPoints(cx: number, cy: number, r: number): string {
  const pts: Pt[] = [];
  for (let i = 0; i < 5; i += 1) {
    const outer = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const inner = outer + Math.PI / 5;
    pts.push([cx + Math.cos(outer) * r, cy + Math.sin(outer) * r]);
    pts.push([cx + Math.cos(inner) * r * 0.42, cy + Math.sin(inner) * r * 0.42]);
  }
  return poly(pts);
}

function IsoIsland({
  cx,
  cy,
  r,
  h,
  top,
  left,
  right,
  front
}: {
  cx: number;
  cy: number;
  r: number;
  h: number;
  top: string;
  left: string;
  right: string;
  front: string;
}) {
  const p = hexPoints(cx, cy, r);
  const e = p.map(([x, y]) => [x, y + h] as Pt);
  return (
    <g>
      <polygon points={poly([p[1], p[2], e[2], e[1]])} fill={right} />
      <polygon points={poly([p[2], p[3], e[3], e[2]])} fill={front} />
      <polygon points={poly([p[3], p[4], e[4], e[3]])} fill={left} />
      <polygon points={poly(p)} fill={top} />
      <polygon points={poly([p[5], p[0], p[1]])} fill="rgba(255,255,255,0.14)" />
    </g>
  );
}

function Palm({ x, y, s = 1, lean = 6 }: { x: number; y: number; s?: number; lean?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${lean}) scale(${s})`}>
      <path d="M0 4 Q 3 -8 -1 -24" stroke="#7c4a28" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <path d="M-1 -22 Q 2 -16 0 -8" stroke="#8a5a32" strokeWidth="1.4" fill="none" />
      {[
        [-78, '#14532d'],
        [-42, '#166534'],
        [-8, '#22c55e'],
        [28, '#15803d'],
        [64, '#166534'],
        [108, '#14532d']
      ].map(([rot, fill]) => (
        <ellipse
          key={String(rot)}
          cx="0"
          cy="-34"
          rx="3.4"
          ry="12"
          fill={fill as string}
          transform={`rotate(${rot} 0 -22)`}
        />
      ))}
      <circle cx="0.4" cy="-21" r="1.5" fill="#78350f" />
    </g>
  );
}

function proj(x: number, y: number, px: number, py: number, pz: number, s: number): Pt {
  return [x + (px - pz) * 0.9 * s, y + (px + pz) * 0.5 * s - py * s];
}

function Cottage({
  x,
  y,
  s = 1,
  tower = false
}: {
  x: number;
  y: number;
  s?: number;
  tower?: boolean;
}) {
  const P = (px: number, py: number, pz: number) => proj(x, y, px, py, pz, s);
  const a = P(-13, 0, -8);
  const b = P(13, 0, -8);
  const c = P(13, 0, 8);
  const d = P(-13, 0, 8);
  const a2 = P(-13, 13, -8);
  const b2 = P(13, 13, -8);
  const c2 = P(13, 13, 8);
  const d2 = P(-13, 13, 8);
  const ridgeL = P(-14, 23, 0);
  const ridgeR = P(14, 23, 0);
  const doorA = P(-3, 0, 8.1);
  const doorB = P(3.2, 0, 8.1);
  const doorC = P(3.2, 8, 8.1);
  const doorD = P(-3, 8, 8.1);
  const win = P(8, 7, 8.2);
  return (
    <g>
      <polygon points={poly([b, c, c2, b2])} fill="#e6d3ae" />
      <polygon points={poly([d, c, c2, d2])} fill="#f7edd4" />
      <polygon points={poly([a2, b2, ridgeR, ridgeL])} fill="#b91c1c" />
      <polygon points={poly([d2, c2, ridgeR, ridgeL])} fill="#ef4444" />
      <polygon points={poly([b2, c2, ridgeR])} fill="#991b1b" />
      <polygon points={poly([doorA, doorB, doorC, doorD])} fill="#7c3f1d" />
      <rect x={win[0] - 2.2 * s} y={win[1] - 2.2 * s} width={4.4 * s} height={3.6 * s} rx={0.6} fill="#7dd3fc" />
      {tower && (
        <g>
          <polygon points={poly([P(6, 13, -2), P(12, 13, -2), P(12, 13, 4), P(6, 13, 4)])} fill="#d8c49a" />
          <polygon points={poly([P(12, 13, -2), P(12, 28, -2), P(12, 28, 4), P(12, 13, 4)])} fill="#efe2c4" />
          <polygon points={poly([P(6, 13, 4), P(12, 13, 4), P(12, 28, 4), P(6, 28, 4)])} fill="#f8f1dc" />
          <polygon points={poly([P(5, 28, -3), P(13, 28, -3), P(13, 28, 5), P(5, 28, 5)])} fill="#b91c1c" />
          <polygon points={poly([P(5, 28, 5), P(13, 28, 5), P(9, 36, 1)])} fill="#ef4444" />
          <polygon points={poly([P(13, 28, -3), P(13, 28, 5), P(9, 36, 1)])} fill="#dc2626" />
          <circle cx={P(9, 32, 1)[0]} cy={P(9, 32, 1)[1]} r={1.3 * s} fill="#fde68a" />
        </g>
      )}
    </g>
  );
}

function RockSpire({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <polygon points="4,18 34,8 22,-28 8,-62 -2,-24 -18,-8 -28,6 -8,20" fill="#243044" />
      <polygon points="4,18 34,8 16,-6 10,-34 2,-18" fill="#3c4e68" />
      <polygon points="4,18 -28,6 -12,-2 -2,-30 0,-12" fill="#1a2433" />
      <polygon points="8,-62 22,-28 10,-34" fill="#52627a" />
    </g>
  );
}

function OceanBackdrop() {
  return (
    <svg className="title-ocean" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="ts-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#12345c" />
          <stop offset="48%" stopColor="#0b2344" />
          <stop offset="100%" stopColor="#040c18" />
        </linearGradient>
        <radialGradient id="ts-sea-glow" cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="#1d4e86" stopOpacity="0.55" />
          <stop offset="70%" stopColor="#0b2344" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ts-vignette" cx="50%" cy="46%" r="68%">
          <stop offset="52%" stopColor="#020617" stopOpacity="0" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0.72" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#ts-sea)" />
      <rect width="1600" height="900" fill="url(#ts-sea-glow)" />
      <g opacity="0.55" fill="none" stroke="#7dd3fc" strokeLinecap="round">
        <path d="M80 240 C 180 220, 260 250, 340 232" strokeWidth="2" opacity="0.35" />
        <path d="M1180 200 C 1280 186, 1380 210, 1500 190" strokeWidth="2" opacity="0.28" />
        <path d="M60 640 C 200 620, 280 660, 420 640" strokeWidth="2.4" opacity="0.3" />
        <path d="M1120 700 C 1260 680, 1400 720, 1560 690" strokeWidth="2.4" opacity="0.28" />
        <path d="M480 820 C 620 800, 760 830, 900 808" strokeWidth="2" opacity="0.25" />
      </g>

      <g className="title-cloud" style={{ animationDelay: '-4s' }}>
        <Cloud x={250} y={120} s={1.35} />
      </g>
      <g className="title-cloud" style={{ animationDelay: '-11s' }}>
        <Cloud x={1380} y={150} s={1.15} tint="#dbe7f5" />
      </g>
      <g className="title-cloud" style={{ animationDelay: '-7s' }}>
        <Cloud x={180} y={430} s={0.8} tint="#c5d4e8" />
      </g>

      <RockSpire x={120} y={210} s={1.35} />
      <RockSpire x={1488} y={250} s={1.55} />
      <RockSpire x={150} y={760} s={1.7} />
      <RockSpire x={1460} y={780} s={1.25} />

      <IsoIsland cx={250} cy={300} r={78} h={26} top="#3e8f49" left="#166534" right="#22723a" front="#14532d" />
      <Palm x={214} y={292} s={1.15} lean={-8} />
      <Palm x={268} y={308} s={0.85} lean={12} />

      <IsoIsland cx={1320} cy={250} r={54} h={16} top="rgba(56,189,248,0.28)" left="rgba(14,165,233,0.18)" right="rgba(56,189,248,0.22)" front="rgba(3,105,161,0.28)" />
      <IsoIsland cx={118} cy={520} r={46} h={18} top="#4b5568" left="#1f2937" right="#374151" front="#111827" />
      <IsoIsland cx={1470} cy={500} r={70} h={24} top="#3f4d63" left="#1e293b" right="#334155" front="#0f172a" />

      <IsoIsland cx={800} cy={86} r={168} h={30} top="#46a351" left="#166534" right="#22863e" front="#14532d" />
      <Palm x={690} y={70} s={1.35} lean={-14} />
      <Palm x={860} y={78} s={1.2} lean={10} />
      <Palm x={760} y={108} s={0.85} lean={4} />
      <Cottage x={812} y={78} s={1.15} tower />

      <IsoIsland cx={220} cy={800} r={96} h={22} top="#3c8f48" left="#14532d" right="#1f7a38" front="#052e16" />
      <Palm x={180} y={786} s={1.2} lean={-6} />
      <Palm x={250} y={804} s={0.9} lean={16} />
      <IsoIsland cx={1280} cy={790} r={88} h={26} top="#3d8f4c" left="#14532d" right="#166534" front="#052e16" />
      <Palm x={1248} y={776} s={1.15} lean={8} />
      <Cottage x={1310} y={778} s={0.7} />

      <IsoIsland cx={980} cy={840} r={40} h={12} top="rgba(125,211,252,0.22)" left="rgba(14,165,233,0.16)" right="rgba(56,189,248,0.2)" front="rgba(3,105,161,0.24)" />
      <IsoIsland cx={430} cy={860} r={36} h={14} top="#334155" left="#0f172a" right="#1e293b" front="#020617" />

      <g transform="translate(620 150)">
        <path d="M0 8 C 6 2, 18 2, 24 8 L 20 12 L 4 12 Z" fill="#f8fafc" />
        <path d="M12 8 L 12 -6" stroke="#e2e8f0" strokeWidth="1.2" />
        <path d="M12 -4 L 20 2 L 12 2" fill="#fecaca" />
      </g>

      <rect width="1600" height="900" fill="url(#ts-vignette)" />
    </svg>
  );
}

function Cloud({ x, y, s = 1, tint = '#f8fafc' }: { x: number; y: number; s?: number; tint?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity="0.9">
      <ellipse cx="0" cy="6" rx="34" ry="14" fill={tint} />
      <ellipse cx="-24" cy="10" rx="18" ry="12" fill={tint} />
      <ellipse cx="26" cy="8" rx="20" ry="13" fill={tint} />
      <ellipse cx="6" cy="-2" rx="16" ry="12" fill="#ffffff" opacity="0.8" />
    </g>
  );
}

function CycloneMark() {
  return (
    <svg className="title-cyclone-svg" viewBox="0 0 170 150" aria-hidden="true">
      <defs>
        <radialGradient id="ts-cyc-glow" cx="55%" cy="48%" r="58%">
          <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.95" />
          <stop offset="46%" stopColor="#0ea5e9" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ts-cyc-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f0f9ff" />
          <stop offset="32%" stopColor="#7dd3fc" />
          <stop offset="68%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#075985" />
        </linearGradient>
      </defs>
      <ellipse className="title-cyc-glow" cx="88" cy="74" rx="70" ry="58" fill="url(#ts-cyc-glow)" />
      <path d="M16 104 C 38 92, 52 108, 40 122" stroke="#bae6fd" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M8 82 C 28 72, 36 88, 24 98" stroke="#e0f2fe" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M30 124 C 50 116, 58 128, 48 138" stroke="#38bdf8" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.85" />
      <path d="M22 64 C 34 58, 40 66, 32 74" stroke="#f0f9ff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
      <path
        d="M58 56 C 46 36, 78 22, 102 34 C 126 16, 156 40, 146 68 C 166 84, 152 116, 122 118 C 108 138, 66 134, 54 112 C 28 114, 22 80, 58 56 Z"
        fill="url(#ts-cyc-body)"
      />
      <path
        d="M104 58 C 124 68, 126 94, 106 104 C 80 116, 60 100, 66 78 C 72 58, 96 54, 106 70 C 114 84, 96 94, 86 84"
        fill="none"
        stroke="#0c4a6e"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M104 58 C 124 68, 126 94, 106 104 C 80 116, 60 100, 66 78 C 72 58, 96 54, 106 70 C 114 84, 96 94, 86 84"
        fill="none"
        stroke="#e0f2fe"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="88" cy="82" r="7" fill="#f0f9ff" />
      <circle cx="88" cy="82" r="3.2" fill="#0c4a6e" />
    </svg>
  );
}

function StormVignette() {
  const rains = Array.from({ length: 11 }, (_, i) => ({
    id: i,
    x: 152 + i * 14,
    y: 34 + (i % 2) * 7
  }));
  return (
    <svg className="title-vignette-svg" viewBox="0 0 320 220" aria-hidden="true">
      <defs>
        <clipPath id="ts-rain-clip">
          <rect x="140" y="16" width="180" height="78" />
        </clipPath>
      </defs>
      <g transform="translate(196 42)">
        <ellipse cx="0" cy="8" rx="78" ry="26" fill="#64748b" />
        <ellipse cx="-46" cy="14" rx="36" ry="20" fill="#475569" />
        <ellipse cx="48" cy="12" rx="40" ry="22" fill="#94a3b8" />
        <ellipse cx="-10" cy="-6" rx="34" ry="20" fill="#cbd5e1" />
        <ellipse cx="24" cy="-10" rx="28" ry="16" fill="#f1f5f9" />
        <ellipse cx="-28" cy="2" rx="18" ry="12" fill="#e2e8f0" />
      </g>
      <g clipPath="url(#ts-rain-clip)" stroke="#e2e8f0" strokeWidth="1.3" strokeLinecap="round" opacity="0.8">
        <g className="title-rain">
          {rains.map((drop) => (
            <line key={drop.id} x1={drop.x} y1={drop.y} x2={drop.x - 3} y2={drop.y + 12} />
          ))}
          {rains.map((drop) => (
            <line key={`b-${drop.id}`} x1={drop.x} y1={drop.y - 24} x2={drop.x - 3} y2={drop.y - 12} />
          ))}
        </g>
      </g>

      <path d="M-8 168 C 28 150, 48 176, 86 160 C 118 146, 132 164, 162 154 C 176 150, 170 178, 132 184 C 80 194, 24 186, -8 192 Z" fill="#1e3a5f" />
      <path d="M-4 158 C 30 140, 52 168, 92 150 C 128 134, 160 156, 198 140 C 220 132, 236 150, 214 162 C 170 180, 80 184, -4 178 Z" fill="#dbeafe" />
      <path d="M4 152 C 36 136, 58 162, 96 146 C 130 132, 158 150, 196 138 C 214 130, 228 146, 206 156 C 164 172, 70 170, 4 166 Z" fill="#f8fafc" />
      <path d="M168 142 C 188 128, 210 146, 228 134 C 238 128, 236 150, 210 156 C 190 162, 174 154, 166 148 Z" fill="#ffffff" />

      <IsoIsland cx={246} cy={128} r={58} h={30} top="#3f9a4c" left="#14532d" right="#1e293b" front="#0f172a" />
      <Palm x={208} y={118} s={0.92} lean={-32} />
      <Palm x={274} y={122} s={0.78} lean={-16} />
      <Cottage x={248} y={118} s={1} />
      <g fill="#fff">
        <circle cx="198" cy="136" r="2.4" />
        <circle cx="208" cy="126" r="1.6" opacity="0.85" />
        <circle cx="188" cy="124" r="1.3" opacity="0.7" />
      </g>
    </svg>
  );
}

function FlagMark() {
  return (
    <svg className="title-flag" viewBox="0 0 40 20" aria-hidden="true">
      <rect width="40" height="10" fill="#0038A8" />
      <rect y="10" width="40" height="10" fill="#CE1126" />
      <polygon points="0,0 0,20 17.3,10" fill="#ffffff" />
      <g transform="translate(6.1 10)">
        {Array.from({ length: 8 }, (_, i) => (
          <polygon key={i} points="0,-1.15 0.55,-3.5 -0.55,-3.5" fill="#FCD116" transform={`rotate(${i * 45})`} />
        ))}
        <circle r="1.85" fill="#FCD116" />
      </g>
      <polygon points={starPoints(3.1, 3.5, 1.25)} fill="#FCD116" />
      <polygon points={starPoints(3.1, 16.5, 1.25)} fill="#FCD116" />
      <polygon points={starPoints(12.2, 10, 1.2)} fill="#FCD116" />
    </svg>
  );
}

function NdrrMcMark() {
  return (
    <svg className="title-agency-mark" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#1d4ed8" />
      <ellipse cx="12" cy="12" rx="7.2" ry="2.6" fill="none" stroke="#e0f2fe" strokeWidth="1.3" />
      <ellipse cx="12" cy="12" rx="7.2" ry="2.6" fill="none" stroke="#e0f2fe" strokeWidth="1.3" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="7.2" ry="2.6" fill="none" stroke="#e0f2fe" strokeWidth="1.3" transform="rotate(120 12 12)" />
      <circle cx="12" cy="12" r="1.7" fill="#f8fafc" />
    </svg>
  );
}

function PagasaMark() {
  return (
    <svg className="title-agency-mark" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9.2" fill="none" stroke="#e2e8f0" strokeWidth="1.4" />
      <path
        d="M12 12 C12 7.2 16.2 6.4 17.2 9.2 C15.2 8.2 13.2 10 12 12 C16.8 12 17.6 16.2 14.8 17.2 C15.8 15.2 14 13.2 12 12 C12 16.8 7.8 17.6 6.8 14.8 C8.8 15.8 10.8 14 12 12 C7.2 12 6.4 7.8 9.2 6.8 C8.2 8.8 10 10.8 12 12 Z"
        fill="#f8fafc"
      />
    </svg>
  );
}

function DioramaIcon() {
  return (
    <svg className="title-chip-icon" viewBox="0 0 48 48" aria-hidden="true">
      <IsoIsland cx={24} cy={22} r={16} h={8} top="#4ade80" left="#166534" right="#22c55e" front="#14532d" />
      <Cottage x={24} y={20} s={0.55} />
    </svg>
  );
}

function Headset({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <path d="M6 22 a9 9 0 0 1 18 0" fill="none" stroke="#dbeafe" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="4" y="20" width="4.2" height="8" rx="1.6" fill="#1d4ed8" />
      <rect x="21.6" y="20" width="4.2" height="8" rx="1.6" fill="#1d4ed8" />
      <circle cx="15" cy="24" r="5.2" fill="#60a5fa" />
      <path d="M10 34 c1.4 -5 8.6 -5 10 0" fill="#3b82f6" />
    </g>
  );
}

function PassPlayIcon() {
  return (
    <svg className="title-chip-icon" viewBox="0 0 48 48" aria-hidden="true">
      <Headset x={1} />
      <Headset x={18} />
    </svg>
  );
}

function TouchMouseIcon() {
  return (
    <svg className="title-chip-icon" viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M15 33 c0 4 10 5 13 3 c3 -1.5 4 -4 4 -6 V24 h-2.2 V17.5 a2.2 2.2 0 0 0 -4.4 0 V23 h-0.2 V15.2 a2.2 2.2 0 0 0 -4.4 0 V23 h-0.2 v-5.2 a2.2 2.2 0 0 0 -4.4 0 V27 c0 1.2 -1.4 2 -2.2 1.2 C13 27 13 30 15 33 Z"
        fill="#dbeafe"
        stroke="#93c5fd"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <rect x="33" y="14" width="11" height="18" rx="5.5" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.2" />
      <path d="M38.5 14 v6" stroke="#64748b" strokeWidth="1.2" />
    </svg>
  );
}

function Sword({ rotate }: { rotate: number }) {
  return (
    <g transform={`translate(18 18) rotate(${rotate})`}>
      <polygon points="0,-16 2.1,-12 -2.1,-12" fill="#1c1408" />
      <rect x="-1.5" y="-12" width="3" height="18" rx="1" fill="#1c1408" />
      <rect x="-5" y="5" width="10" height="2.3" rx="0.6" fill="#1c1408" />
      <rect x="-1.35" y="7.2" width="2.7" height="5" rx="0.5" fill="#1c1408" />
      <circle cy="13" r="1.3" fill="#1c1408" />
    </g>
  );
}

function SwordsIcon() {
  return (
    <svg className="title-cta-icon" viewBox="0 0 36 36" aria-hidden="true">
      <Sword rotate={-42} />
      <Sword rotate={42} />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg className="title-cta-icon" viewBox="0 0 36 36" aria-hidden="true">
      <path d="M18 11 C14 8.5 8 8 5 9.5 V27 C9 25 14 25.5 18 28 Z" fill="#dbeafe" />
      <path d="M18 11 C22 8.5 28 8 31 9.5 V27 C27 25 22 25.5 18 28 Z" fill="#f8fafc" />
      <path d="M18 12.5 V27" stroke="#64748b" strokeWidth="1.2" />
      <path d="M9 14 H15 M9 17.5 H15 M21 14 H27 M21 17.5 H27" stroke="#94a3b8" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg className="title-chevron" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M7 4 L13 10 L7 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg className="title-mini-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M8 14.5 V5.5 L16 4 V13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6.2" cy="14.5" r="2.1" fill="currentColor" />
      <circle cx="14.2" cy="13" r="2.1" fill="currentColor" />
    </svg>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg className="title-mini-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 8 H7 L11 5 V15 L7 12 H4 Z" fill="currentColor" />
      {muted ? (
        <path d="M13 8 L17 12 M17 8 L13 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      ) : (
        <path d="M13.5 7.5 C14.8 8.6 14.8 11.4 13.5 12.5 M15.6 5.8 C18 7.6 18 12.4 15.6 14.2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      )}
    </svg>
  );
}

function splitThemeLabel(label: string): { title: string; sub: string | null } {
  const match = label.match(/^(.*)\s+(\([^)]+\))$/);
  if (!match) return { title: label, sub: null };
  return { title: match[1], sub: match[2] };
}

export const TitleScreen = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const [muted, setMuted] = useState(soundFX.muted);
  const [theme, setTheme] = useState<MusicTheme>(soundFX.getTheme());

  useEffect(() => {
    soundFX.setMusicTheme('CALM_BARANGAY');
    setTheme('CALM_BARANGAY');
  }, []);

  const track = splitThemeLabel(MUSIC_THEME_LABELS[theme]);

  return (
    <div className="overlay-screen title-screen">
      <OceanBackdrop />
      <section className="title-card" aria-label="Signal 5">
        <header className="title-brandbar">
          <div className="title-brand-group">
            <FlagMark />
            <span>Republika ng Pilipinas</span>
          </div>
          <div className="title-brand-group">
            <NdrrMcMark />
            <span>NDRRMC</span>
          </div>
          <div className="title-brand-group">
            <PagasaMark />
            <span>PAGASA DRRM Drill</span>
          </div>
          <span className="title-tcws">TCWS #5</span>
        </header>

        <div className="title-hero">
          <div className="title-cyclone">
            <CycloneMark />
          </div>
          <div className="title-word">
            <p className="title-kicker">Public Storm Warning</p>
            <h1 className="title-wordmark">
              <span>SIGNAL</span>
              <span className="title-five">5</span>
            </h1>
            <p className="title-tagline">“Hold 5 cards. Survive Signal 5.”</p>
          </div>
          <div className="title-vignette">
            <StormVignette />
          </div>
          <p className="title-blurb">
            A 2-player local turn-based PvP deck-building strategy game set in a coastal Philippine
            barangay. Take turns as the <strong className="title-role-defender">Barangay Captain (Defender)</strong> and{' '}
            <strong className="title-role-nature">Kalikasan (Nature)</strong> across two 5-round halves!
          </p>
        </div>

        <div className="title-features">
          <div className="title-chip">
            <DioramaIcon />
            <span>
              37-Hex
              <br />
              Isometric Diorama
            </span>
          </div>
          <div className="title-chip">
            <PassPlayIcon />
            <span>
              Local 2-Player
              <br />
              Pass &amp; Play
            </span>
          </div>
          <div className="title-chip">
            <TouchMouseIcon />
            <span>
              Touch &amp; Mouse
              <br />
              Ready
            </span>
          </div>
        </div>

        <div className="title-cta-row">
          <button type="button" className="title-start" onClick={() => setScreen('DRAFT')}>
            <SwordsIcon />
            <span className="title-cta-copy">
              <strong>Start PvP Match</strong>
              <small>(Draft Decks)</small>
            </span>
            <Chevron />
          </button>
          <button type="button" className="title-guide" onClick={() => setScreen('HOW_TO_PLAY')}>
            <BookIcon />
            <span className="title-cta-copy">
              <strong>How to Play</strong>
              <small>(3-Page Guide)</small>
            </span>
            <Chevron />
          </button>
        </div>

        <div className="title-audio-row">
          <button
            type="button"
            className="title-pill"
            onClick={() => {
              soundFX.startMusicLoop();
              setTheme(soundFX.cycleMusicTheme());
            }}
          >
            <NoteIcon />
            <span className="title-track-copy">
              Track: {track.title}
              {track.sub && <span className="title-track-sub">{track.sub}</span>}
            </span>
          </button>
          <button
            type="button"
            className="title-pill title-audio-toggle"
            role="switch"
            aria-checked={!muted}
            onClick={() => setMuted(soundFX.toggleMute())}
          >
            <SpeakerIcon muted={muted} />
            <span>{muted ? 'Audio Muted' : 'Audio ON'}</span>
            <span className={muted ? 'title-switch' : 'title-switch is-on'} />
          </button>
        </div>
      </section>
    </div>
  );
};
