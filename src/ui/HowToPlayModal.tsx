import React from 'react';
import { useGameStore } from '../store/useGameStore';

const PAGES = [
  {
    title: 'Page 1/3: Two Halves, Two Roles',
    icon: '⚖️',
    diagram: [
      { badge: 'HALF 1 (5 Rounds)', text: 'Player A = DEFENDER (Barangay Captain) • Player B = KALIKASAN (Nature)' },
      { badge: 'HALF 2 (5 Rounds)', text: 'Roles Swap on a fresh 37-Hex (Radius 3) Barangay Map!' },
      { badge: 'WIN CONDITION', text: 'Highest Defense Score = (Residents Alive × 10) + Village Integrity %' }
    ],
    body: 'Each match is a 2-half DRRM preparedness drill. In your defending half, protect residents and infrastructure across 5 rounds. Ties are broken by most residents saved!'
  },
  {
    title: 'Page 2/3: Barangay Buildings & Hex Grid Rules',
    icon: '🏛️',
    diagram: [
      { badge: '🏠 Housing & 🌾 Farm', text: 'Housing holds 4 residents (wood takes 2× fire dmg). Upgrade to 5 HP Concrete! Farms give +2 Food/round.' },
      { badge: '⚡ Substation → 🏥 / 🚒', text: 'Substation powers Clinics & Fire Stations. Within 2 hexes, they reduce fire damage & rescue residents!' },
      { badge: '🧱 Flood Wall & 🏛️ Hall', text: 'Flood Walls block South-East coastal flood surges inland. Keep Barangay Hall at (0,0) alive for Gold Medal!' }
    ],
    body: 'During the Build Phase, the Defender starts with 10 Budget (+4/round) to place buildings (3 HP) or upgrade them to reinforced Concrete (5 HP).'
  },
  {
    title: 'Page 3/3: 5-Card Hand & Super Typhoon Signal 5',
    icon: '🌀',
    diagram: [
      { badge: '🃏 5-Card Hand', text: 'Defender draws 5 Buffs. Kalikasan draws 5 Disasters, including the forecast card. Energy = 3 + Round (max 7).' },
      { badge: '📡 PAGASA Bulletin', text: 'Every round starts with a public forecast revealing Kalikasan’s incoming disaster for NEXT round.' },
      { badge: '🚨 Round 5 Finale', text: 'SUPER TYPHOON SIGNAL 5 hits automatically in Round 5! Upgrade houses & shelter residents in the Hall/Clinic!' }
    ],
    body: 'Buffs resolve before disasters, then rescue. 1 Food feeds 4 residents. Integrity counts buildings you have already lost, and a fallen Barangay Hall caps the medal at Silver.'
  }
];

export const HowToPlayModal: React.FC = () => {
  const page = useGameStore((s) => s.howToPlayPage);
  const setPage = useGameStore((s) => s.setHowToPlayPage);
  const setScreen = useGameStore((s) => s.setScreen);

  const current = PAGES[page] || PAGES[0];

  return (
    <div className="overlay-screen modal-backdrop">
      <div className="how-to-card">
        <div className="how-to-header">
          <span className="how-to-icon">{current.icon}</span>
          <h2>{current.title}</h2>
        </div>

        <div className="illustrated-cards-row">
          {current.diagram.map((item, i) => (
            <div key={i} className="illustrated-box">
              <div className="illustrated-badge">{item.badge}</div>
              <p>{item.text}</p>
            </div>
          ))}
        </div>

        <p className="how-to-body">{current.body}</p>

        <div className="how-to-footer">
          <button className="btn-secondary" onClick={() => setScreen('TITLE')}>
            ✕ Back to Title
          </button>

          <div className="page-dots">
            {PAGES.map((_, idx) => (
              <button
                key={idx}
                className={`dot-btn ${idx === page ? 'active' : ''}`}
                onClick={() => setPage(idx)}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {page < PAGES.length - 1 ? (
            <button className="btn-primary" onClick={() => setPage(page + 1)}>
              Next Page →
            </button>
          ) : (
            <button className="btn-primary" onClick={() => setScreen('DRAFT')}>
              Start Draft 🃏
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
