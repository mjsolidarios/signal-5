import React from 'react';
import { BuildingType, CardId } from '../logic/types';

export type IllustrationKey = BuildingType | 'UPGRADE' | CardId;

/**
 * Renders a rich, colorful vector diorama illustration inside each Slay-the-Spire style card
 * (matching the illustrated card art windows in the reference design).
 */
export const CardIllustration: React.FC<{ id: IllustrationKey }> = ({ id }) => {
  switch (id) {
    case 'HOUSING':
      return (
        <svg viewBox="0 0 160 80" className="card-art-svg">
          <defs>
            <linearGradient id="skyH" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          <rect width="160" height="80" fill="url(#skyH)" />
          <ellipse cx="80" cy="76" rx="75" ry="22" fill="#22c55e" />
          <ellipse cx="80" cy="78" rx="60" ry="14" fill="#16a34a" />
          {/* Sunlit Bahay / House */}
          <rect x="52" y="38" width="56" height="30" rx="2" fill="#fef3c7" stroke="#92400e" strokeWidth="1.5" />
          <polygon points="44,40 80,16 116,40" fill="#ea580c" stroke="#9a3412" strokeWidth="1.5" />
          <rect x="73" y="49" width="14" height="19" fill="#92400e" />
          <rect x="58" y="45" width="10" height="10" fill="#38bdf8" stroke="#78350f" strokeWidth="1" />
          <rect x="92" y="45" width="10" height="10" fill="#38bdf8" stroke="#78350f" strokeWidth="1" />
          {/* Bushes */}
          <circle cx="46" cy="64" r="8" fill="#15803d" />
          <circle cx="114" cy="64" r="9" fill="#15803d" />
        </svg>
      );

    case 'FARM':
      return (
        <svg viewBox="0 0 160 80" className="card-art-svg">
          <rect width="160" height="80" fill="#0369a1" />
          <ellipse cx="80" cy="75" rx="78" ry="26" fill="#4d7c0f" />
          {/* Golden terraced rice rows */}
          <polygon points="24,62 75,36 136,56 85,76" fill="#65a30d" stroke="#a3e635" strokeWidth="1.5" />
          <line x1="42" y1="56" x2="85" y2="70" stroke="#facc15" strokeWidth="3" strokeLinecap="round" />
          <line x1="55" y1="50" x2="100" y2="65" stroke="#facc15" strokeWidth="3" strokeLinecap="round" />
          <line x1="68" y1="44" x2="115" y2="60" stroke="#fde047" strokeWidth="3" strokeLinecap="round" />
          <line x1="80" y1="39" x2="126" y2="55" stroke="#fde047" strokeWidth="3" strokeLinecap="round" />
          {/* Small Kamalig shed */}
          <rect x="34" y="36" width="20" height="14" fill="#92400e" />
          <polygon points="30,37 44,25 58,37" fill="#eab308" />
        </svg>
      );

    case 'SUBSTATION':
      return (
        <svg viewBox="0 0 160 80" className="card-art-svg">
          <rect width="160" height="80" fill="#0f172a" />
          <ellipse cx="80" cy="74" rx="72" ry="20" fill="#334155" />
          {/* Transformer building */}
          <rect x="46" y="34" width="68" height="32" rx="3" fill="#64748b" stroke="#94a3b8" strokeWidth="1.5" />
          <polygon points="42,35 80,20 118,35" fill="#475569" />
          <rect x="54" y="44" width="16" height="14" fill="#fef08a" />
          <rect x="90" y="42" width="16" height="24" fill="#1e293b" />
          {/* Electric Lightning Bolt */}
          <polygon
            points="84,8 66,36 79,36 72,60 98,30 83,30"
            fill="#facc15"
            stroke="#fef08a"
            strokeWidth="1.5"
          />
        </svg>
      );

    case 'FIRE_STATION':
      return (
        <svg viewBox="0 0 160 80" className="card-art-svg">
          <rect width="160" height="80" fill="#1e293b" />
          <ellipse cx="80" cy="74" rx="74" ry="20" fill="#475569" />
          {/* Red BFP Firehouse */}
          <rect x="44" y="28" width="72" height="40" rx="2" fill="#dc2626" stroke="#fca5a5" strokeWidth="1.5" />
          <rect x="40" y="24" width="80" height="6" rx="2" fill="#f8fafc" />
          <rect x="58" y="16" width="44" height="10" rx="2" fill="#b91c1c" stroke="#f8fafc" strokeWidth="1" />
          {/* Garage bay doors */}
          <rect x="54" y="44" width="22" height="24" fill="#cbd5e1" />
          <rect x="84" y="44" width="22" height="24" fill="#cbd5e1" />
          {/* Glowing siren */}
          <circle cx="80" cy="12" r="5" fill="#fef08a" />
        </svg>
      );

    case 'CLINIC':
      return (
        <svg viewBox="0 0 160 80" className="card-art-svg">
          <rect width="160" height="80" fill="#0f766e" />
          <ellipse cx="80" cy="75" rx="74" ry="20" fill="#15803d" />
          {/* White Hospital / Clinic */}
          <rect x="42" y="30" width="76" height="38" rx="3" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="62" y="18" width="36" height="50" rx="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* Red Medical Cross */}
          <rect x="76" y="24" width="8" height="20" fill="#ef4444" />
          <rect x="70" y="30" width="20" height="8" fill="#ef4444" />
          {/* Windows & Door */}
          <rect x="48" y="38" width="10" height="10" fill="#38bdf8" />
          <rect x="102" y="38" width="10" height="10" fill="#38bdf8" />
          <rect x="74" y="52" width="12" height="16" fill="#0284c7" />
        </svg>
      );

    case 'FLOOD_WALL':
      return (
        <svg viewBox="0 0 160 80" className="card-art-svg">
          <rect width="160" height="80" fill="#0369a1" />
          {/* Ocean Surge Waves on Right */}
          <path d="M 70 50 Q 115 35 160 52 L 160 80 L 70 80 Z" fill="#0ea5e9" />
          <path d="M 85 58 Q 120 48 160 60 L 160 80 L 85 80 Z" fill="#38bdf8" />
          {/* Heavy Concrete Seawall Diagonal Dike */}
          <polygon points="24,68 96,22 114,30 46,76" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
          <polygon points="46,76 114,30 120,44 54,80" fill="#94a3b8" />
        </svg>
      );

    case 'UPGRADE':
      return (
        <svg viewBox="0 0 160 80" className="card-art-svg">
          <rect width="160" height="80" fill="#1e1b4b" />
          <circle cx="80" cy="40" r="34" fill="#312e81" opacity="0.7" />
          <rect x="54" y="14" width="52" height="52" rx="10" fill="#2563eb" stroke="#60a5fa" strokeWidth="2" />
          <polygon points="80,22 62,42 73,42 73,58 87,58 87,42 98,42" fill="#f8fafc" />
        </svg>
      );

    case 'CAMPFIRE':
      return (
        <svg viewBox="0 0 160 80" className="card-art-svg">
          <rect width="160" height="80" fill="#450a0a" />
          <ellipse cx="80" cy="72" rx="68" ry="18" fill="#78350f" />
          {/* Charred logs */}
          <rect x="54" y="60" width="52" height="7" rx="3" fill="#451a03" transform="rotate(-12 80 63)" />
          <rect x="54" y="60" width="52" height="7" rx="3" fill="#5c2408" transform="rotate(12 80 63)" />
          <path d="M80 12 C60 35 56 56 80 66 C104 56 100 35 80 12 Z" fill="#f97316" />
          <path d="M80 26 C68 42 66 56 80 64 C94 56 92 42 80 26 Z" fill="#fde047" />
        </svg>
      );

    case 'INFERNO':
      return (
        <svg viewBox="0 0 160 80" className="card-art-svg">
          <rect width="160" height="80" fill="#450a0a" />
          <circle cx="80" cy="48" r="44" fill="#991b1b" />
          <circle cx="80" cy="52" r="32" fill="#dc2626" />
          <path d="M44 20 C30 42 34 64 50 72 C64 60 60 40 44 20 Z" fill="#fb923c" />
          <path d="M116 20 C100 40 96 60 110 72 C126 64 130 42 116 20 Z" fill="#fb923c" />
          <path d="M80 6 C56 34 54 60 80 74 C106 60 104 34 80 6 Z" fill="#fef08a" />
        </svg>
      );

    case 'MODERATE_RAIN':
      return (
        <svg viewBox="0 0 160 80" className="card-art-svg">
          <rect width="160" height="80" fill="#0c4a6e" />
          <ellipse cx="68" cy="28" rx="26" ry="15" fill="#cbd5e1" />
          <ellipse cx="94" cy="30" rx="22" ry="13" fill="#94a3b8" />
          <line x1="56" y1="48" x2="50" y2="66" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
          <line x1="76" y1="48" x2="70" y2="66" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
          <line x1="96" y1="48" x2="90" y2="66" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'DOWNPOUR':
      return (
        <svg viewBox="0 0 160 80" className="card-art-svg">
          <rect width="160" height="80" fill="#082f49" />
          {/* Rising flood wave at bottom */}
          <path d="M0 62 Q40 54 80 62 T160 60 L160 80 L0 80 Z" fill="#0284c7" />
          <ellipse cx="62" cy="24" rx="30" ry="16" fill="#64748b" />
          <ellipse cx="96" cy="26" rx="28" ry="15" fill="#475569" />
          <line x1="44" y1="44" x2="34" y2="66" stroke="#7dd3fc" strokeWidth="3" strokeLinecap="round" />
          <line x1="62" y1="44" x2="52" y2="66" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="80" y1="44" x2="70" y2="66" stroke="#7dd3fc" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="98" y1="44" x2="88" y2="66" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="116" y1="44" x2="106" y2="66" stroke="#7dd3fc" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'STRONG_GALE':
      return (
        <svg viewBox="0 0 160 80" className="card-art-svg">
          <rect width="160" height="80" fill="#1e293b" />
          <path d="M 22 28 Q 76 12 134 28" fill="none" stroke="#7dd3fc" strokeWidth="4" strokeLinecap="round" />
          <path d="M 16 44 Q 80 26 142 44" fill="none" stroke="#e0f2fe" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 32 60 Q 86 46 128 58" fill="none" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );

    case 'TYPHOON_SIGNAL_3':
      return (
        <svg viewBox="0 0 160 80" className="card-art-svg">
          <rect width="160" height="80" fill="#1e1b4b" />
          {/* Cyclone Vortex Spiral */}
          <circle cx="80" cy="40" r="30" fill="none" stroke="#6366f1" strokeWidth="4" strokeDasharray="16 8" />
          <circle cx="80" cy="40" r="20" fill="none" stroke="#38bdf8" strokeWidth="4.5" strokeDasharray="14 6" />
          <circle cx="80" cy="40" r="9" fill="#0f172a" stroke="#f8fafc" strokeWidth="3" />
          <polygon points="86,10 74,36 84,36 76,66 96,34 85,34" fill="#fde047" />
        </svg>
      );

    case 'EARTHQUAKE_FIRE_DRILL':
      return (
        <svg viewBox="0 0 160 80" className="card-art-svg">
          <rect width="160" height="80" fill="#064e3b" />
          {/* Megaphone & evacuation arrows */}
          <polygon points="46,44 88,24 88,62 46,48" fill="#fbbf24" stroke="#ffffff" strokeWidth="2" />
          <rect x="36" y="41" width="12" height="10" rx="2" fill="#ef4444" />
          <path d="M100 32 L122 24 M102 43 L126 43 M100 54 L122 62" stroke="#fef08a" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );

    case 'TREE_PLANTING':
      return (
        <svg viewBox="0 0 160 80" className="card-art-svg">
          <rect width="160" height="80" fill="#065f46" />
          <ellipse cx="80" cy="74" rx="72" ry="18" fill="#15803d" />
          {/* Mangrove / forest canopy */}
          <rect x="46" y="46" width="8" height="22" fill="#78350f" />
          <circle cx="50" cy="38" r="16" fill="#22c55e" />
          <rect x="76" y="42" width="10" height="26" fill="#78350f" />
          <circle cx="81" cy="32" r="20" fill="#4ade80" />
          <rect x="106" y="46" width="8" height="22" fill="#78350f" />
          <circle cx="110" cy="38" r="16" fill="#22c55e" />
        </svg>
      );

    case 'RELIEF_GOODS':
      return (
        <svg viewBox="0 0 160 80" className="card-art-svg">
          <rect width="160" height="80" fill="#115e59" />
          <rect x="48" y="24" width="64" height="44" rx="5" fill="#d97706" stroke="#fde68a" strokeWidth="2" />
          <line x1="48" y1="42" x2="112" y2="42" stroke="#fef3c7" strokeWidth="2.5" />
          <rect x="75" y="34" width="10" height="22" fill="#ef4444" />
          <rect x="69" y="40" width="22" height="10" fill="#ef4444" />
        </svg>
      );

    case 'FEEDING_PROGRAM':
      return (
        <svg viewBox="0 0 160 80" className="card-art-svg">
          <rect width="160" height="80" fill="#0f766e" />
          {/* Warm Rice Bowl */}
          <ellipse cx="80" cy="46" rx="30" ry="14" fill="#fef9c3" />
          <path d="M 48 46 Q 80 78 112 46 Z" fill="#f59e0b" stroke="#fef08a" strokeWidth="2" />
          <path d="M 66 32 Q 70 22 66 14 M 80 30 Q 84 20 80 12 M 94 32 Q 98 22 94 14" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'MASS_VACCINATION':
      return (
        <svg viewBox="0 0 160 80" className="card-art-svg">
          <rect width="160" height="80" fill="#0d9488" />
          {/* Medical Shield + Cross */}
          <path d="M80 12 L112 24 V44 C112 58 98 68 80 74 C62 68 48 58 48 44 V24 Z" fill="#f8fafc" stroke="#38bdf8" strokeWidth="2.5" />
          <rect x="75" y="28" width="10" height="28" fill="#10b981" />
          <rect x="66" y="37" width="28" height="10" fill="#10b981" />
        </svg>
      );

    case 'BAYANIHAN':
      return (
        <svg viewBox="0 0 160 80" className="card-art-svg">
          <rect width="160" height="80" fill="#047857" />
          <circle cx="80" cy="42" r="32" fill="#fde047" opacity="0.28" />
          {/* Community carrying a Nipa Hut */}
          <rect x="56" y="32" width="48" height="22" fill="#d97706" stroke="#fef3c7" strokeWidth="1.5" />
          <polygon points="48,34 80,14 112,34" fill="#ea580c" stroke="#fde047" strokeWidth="1.5" />
          <line x1="38" y1="54" x2="122" y2="54" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
          <circle cx="54" cy="62" r="5" fill="#fef08a" />
          <circle cx="80" cy="62" r="5" fill="#fef08a" />
          <circle cx="106" cy="62" r="5" fill="#fef08a" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 160 80" className="card-art-svg">
          <rect width="160" height="80" fill="#064e3b" />
          <circle cx="80" cy="40" r="26" fill="#10b981" opacity="0.35" />
          <circle cx="80" cy="40" r="18" fill="#34d399" opacity="0.6" />
          <path d="M70 40 L77 47 L92 32" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
  }
};
