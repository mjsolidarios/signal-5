import type { CSSProperties } from 'react';
import { ALL_CARDS } from '../data/cards';
import { CardId } from '../logic/types';

export function buffMarkStyle(tint?: string): CSSProperties {
  return { '--buff-mark': tint ?? '#2dd4bf' } as CSSProperties;
}

export function BuffMarkChip({
  cardId,
  count = 1
}: {
  cardId: CardId;
  count?: number;
}) {
  const cfg = ALL_CARDS[cardId];
  if (!cfg.badge) return null;
  return (
    <span className="buff-mark-chip" style={buffMarkStyle(cfg.badgeTint)} title={cfg.name}>
      <span className="buff-mark-icon" aria-hidden="true">
        {cfg.icon}
      </span>
      <span>
        {cfg.badge}
        {count > 1 ? ` ×${count}` : ''}
      </span>
    </span>
  );
}
