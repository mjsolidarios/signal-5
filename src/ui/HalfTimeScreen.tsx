import React from 'react';
import { MedalTier } from '../logic/types';
import { useGameStore } from '../store/useGameStore';

export function formatMedal(medal: MedalTier): string {
  switch (medal) {
    case 'GOLD':
      return '🥇 GOLD MEDAL';
    case 'SILVER':
      return '🥈 SILVER MEDAL';
    case 'BRONZE':
      return '🥉 BRONZE MEDAL';
    default:
      return '⚠️ NO MEDAL (<50%)';
  }
}

export const HalfTimeScreen: React.FC = () => {
  const half1Score = useGameStore((s) => s.half1Score);
  const startHalf = useGameStore((s) => s.startHalf);

  if (!half1Score) return null;

  return (
    <div className="overlay-screen modal-backdrop">
      <div className="results-card">
        <div className="pagasa-header-strip">
          <span>END OF HALF 1 • BARANGAY DRRM EVALUATION</span>
          <span>ROLES SWAP NEXT</span>
        </div>

        <h2>Half 1 Complete — Player {half1Score.defenderPlayer} Survived Signal 5!</h2>

        <div className="score-breakdown-box">
          <div className="score-stat-row">
            <span>👨‍👩‍👧‍👦 Residents Saved (×10 pts):</span>
            <strong>
              {half1Score.residentsAlive} residents = {half1Score.residentsAlive * 10} pts
            </strong>
          </div>
          <div className="score-stat-row">
            <span>🏘️ Village Integrity %:</span>
            <strong>+{half1Score.villageIntegrityPct} pts</strong>
          </div>
          <div className="score-stat-row">
            <span>🏛️ Barangay Hall Status:</span>
            <strong>
              {half1Score.hallDestroyed ? '💥 Destroyed (Max Silver)' : '✅ Intact'}
            </strong>
          </div>
          <div className="score-stat-row total-row">
            <span>🛡️ Player {half1Score.defenderPlayer} Defense Score:</span>
            <strong className="big-score">{half1Score.defenseScore}</strong>
          </div>
          <div className="medal-earned-banner">{formatMedal(half1Score.medal)}</div>
        </div>

        <p className="swap-notice">
          🔄 <strong>Role Swap for Half 2:</strong> Now <strong>Player B</strong> becomes the{' '}
          <strong>Barangay Captain (Defender)</strong> on a fresh 37-hex map, and{' '}
          <strong>Player A</strong> takes command of <strong>Kalikasan</strong>!
        </p>

        <button className="btn-primary btn-large" onClick={() => startHalf(2)}>
          🔄 Swap Roles &amp; Start Half 2 →
        </button>
      </div>
    </div>
  );
};
