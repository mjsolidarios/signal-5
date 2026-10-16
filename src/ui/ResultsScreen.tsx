import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { formatMedal } from './HalfTimeScreen';

export const ResultsScreen: React.FC = () => {
  const half1Score = useGameStore((s) => s.half1Score);
  const half2Score = useGameStore((s) => s.half2Score);
  const rematch = useGameStore((s) => s.rematch);
  const setScreen = useGameStore((s) => s.setScreen);

  if (!half1Score || !half2Score) return null;

  // Determine winner: highest Defense Score; ties broken by more residents saved
  let winnerText = 'ABSOLUTE TIE — BOTH BARANGAY CAPTAINS TRIUMPH!';
  let winnerSub = 'Identical Defense Score and identical Residents Saved.';

  if (half1Score.defenseScore > half2Score.defenseScore) {
    winnerText = `🏆 PLAYER ${half1Score.defenderPlayer} WINS THE MATCH!`;
    winnerSub = `Outscored Player ${half2Score.defenderPlayer} (${half1Score.defenseScore} vs ${half2Score.defenseScore} Defense Score).`;
  } else if (half2Score.defenseScore > half1Score.defenseScore) {
    winnerText = `🏆 PLAYER ${half2Score.defenderPlayer} WINS THE MATCH!`;
    winnerSub = `Outscored Player ${half1Score.defenderPlayer} (${half2Score.defenseScore} vs ${half1Score.defenseScore} Defense Score).`;
  } else if (half1Score.residentsAlive > half2Score.residentsAlive) {
    winnerText = `🏆 PLAYER ${half1Score.defenderPlayer} WINS ON TIE-BREAKER!`;
    winnerSub = `Tied at ${half1Score.defenseScore} pts, won with ${half1Score.residentsAlive} vs ${half2Score.residentsAlive} residents saved!`;
  } else if (half2Score.residentsAlive > half1Score.residentsAlive) {
    winnerText = `🏆 PLAYER ${half2Score.defenderPlayer} WINS ON TIE-BREAKER!`;
    winnerSub = `Tied at ${half2Score.defenseScore} pts, won with ${half2Score.residentsAlive} vs ${half1Score.residentsAlive} residents saved!`;
  }

  return (
    <div className="overlay-screen modal-backdrop">
      <div className="results-card final-results-card">
        <div className="pagasa-header-strip">
          <span>FINAL NDRRMC POST-DISASTER ASSESSMENT</span>
          <span>SIGNAL 5 SURVIVED</span>
        </div>

        <h1 className="winner-headline">{winnerText}</h1>
        <p className="winner-subline">{winnerSub}</p>

        <div className="results-comparison-grid">
          {[half1Score, half2Score].map((score, i) => (
            <div key={i} className="player-result-column">
              <div className="column-header">
                Half {i + 1}: Player {score.defenderPlayer} (Defender)
              </div>
              <div className="score-stat-row">
                <span>👨‍👩‍👧‍👦 Residents Saved:</span>
                <strong>
                  {score.residentsAlive} ({score.residentsAlive * 10} pts)
                </strong>
              </div>
              <div className="score-stat-row">
                <span>🏘️ Village Integrity:</span>
                <strong>{score.villageIntegrityPct}%</strong>
              </div>
              <div className="score-stat-row">
                <span>🏛️ Barangay Hall:</span>
                <strong>{score.hallDestroyed ? 'Destroyed' : 'Standing'}</strong>
              </div>
              <div className="score-stat-row total-row">
                <span>Defense Score:</span>
                <strong className="big-score">{score.defenseScore}</strong>
              </div>
              <div className="medal-earned-banner">{formatMedal(score.medal)}</div>
            </div>
          ))}
        </div>

        <div className="title-actions">
          <button className="btn-primary btn-large" onClick={rematch}>
            🔁 Rematch (Draft New Decks)
          </button>
          <button className="btn-secondary btn-large" onClick={() => setScreen('TITLE')}>
            🏠 Return to Title Screen
          </button>
        </div>
      </div>
    </div>
  );
};
