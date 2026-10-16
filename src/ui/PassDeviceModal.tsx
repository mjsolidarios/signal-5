import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { BuffMarkChip } from './BuffMark';

export const PassDeviceModal: React.FC = () => {
  const passTargetPlayer = useGameStore((s) => s.passTargetPlayer);
  const defenderPlayer = useGameStore((s) => s.defenderPlayer);
  const round = useGameStore((s) => s.round);
  const half = useGameStore((s) => s.half);
  const confirmPassDevice = useGameStore((s) => s.confirmPassDevice);
  const defenderPlayedActions = useGameStore((s) => s.defenderPlayedActions);

  const isTargetDefender = passTargetPlayer === defenderPlayer;
  const roleLabel = isTargetDefender
    ? 'DEFENDER (Barangay Captain)'
    : 'KALIKASAN (Nature / Storm Drill)';

  return (
    <div className="overlay-screen pass-device-backdrop">
      <div className="pass-device-card">
        <div className="pass-device-icon">{isTargetDefender ? '🛡️' : '🌀'}</div>
        <div className="pass-kicker">
          HALF {half} • ROUND {round}/5
        </div>
        <h2>Hand the device to Player {passTargetPlayer}</h2>
        <div className={`role-pill-large ${isTargetDefender ? 'defender' : 'kalikasan'}`}>
          Role: {roleLabel}
        </div>
        <p className="pass-desc">
          {isTargetDefender
            ? 'Check the PAGASA Weather Bulletin, place/upgrade barangay defenses, and play DRRM Buff cards from your 5-card hand.'
            : 'Unleash Disaster cards from your 5-card hand to test the barangay’s disaster preparedness!'}
        </p>
        {!isTargetDefender && defenderPlayedActions.length > 0 && (
          <div className="pass-buff-marks" aria-label="Buffs played this round">
            {defenderPlayedActions.map((action, index) => (
              <BuffMarkChip
                key={`${action.cardId}-${action.targetQ ?? 'g'}-${action.targetR ?? 'g'}-${index}`}
                cardId={action.cardId}
              />
            ))}
          </div>
        )}
        <button className="btn-primary btn-large" onClick={confirmPassDevice}>
          ✋ I am Player {passTargetPlayer} — Ready!
        </button>
      </div>
    </div>
  );
};
