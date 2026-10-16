import React, { useState } from 'react';
import { BUFF_CARD_LIST, DISASTER_CARD_LIST } from '../data/cards';
import { CardId } from '../logic/types';
import { useGameStore } from '../store/useGameStore';
import { buffMarkStyle } from './BuffMark';
import { CardIllustration } from './CardIllustrations';
import { CardSpotlightModal } from './CardSpotlightModal';

export const DraftScreen: React.FC = () => {
  const draftingPlayer = useGameStore((s) => s.draftingPlayer);
  const deck = useGameStore((s) => s.decks[s.draftingPlayer]);
  const toggleDraftCard = useGameStore((s) => s.toggleDraftCard);
  const quickFillDraftDeck = useGameStore((s) => s.quickFillDraftDeck);
  const confirmDraft = useGameStore((s) => s.confirmDraft);
  const setScreen = useGameStore((s) => s.setScreen);

  const [spotlightCardId, setSpotlightCardId] = useState<CardId | null>(null);

  const disastersReady = deck.disasters.length === 6;
  const buffsReady = deck.buffs.length === 6;
  const isReady = disastersReady && buffsReady;

  return (
    <div className="overlay-screen draft-screen">
      <div className="draft-container">
        <header className="draft-header">
          <div>
            <span className="draft-badge">PRE-MATCH DECK DRAFT</span>
            <h2>
              Player {draftingPlayer}’s Personal Deck ({deck.disasters.length + deck.buffs.length}/12
              Cards)
            </h2>
            <p className="draft-sub">
              Tap cards to add/remove copies (max 2 per card), or tap <strong>🔍</strong> to
              spotlight card details. You need <strong>6 Disaster Cards</strong> and{' '}
              <strong>6 Buff Cards</strong>. As Defender you draw Buffs; as Kalikasan you draw
              Disasters.
            </p>
          </div>
          <div className="draft-header-actions">
            <button className="btn-secondary" onClick={quickFillDraftDeck}>
              ⚡ Balanced 1-of-Each
            </button>
            <button className="btn-secondary" onClick={() => setScreen('TITLE')}>
              ← Title
            </button>
          </div>
        </header>

        <div className="draft-columns">
          {/* DISASTER POOL (6 cards) */}
          <section className="draft-section disaster-theme">
            <div className="draft-section-title">
              <span>🌋 DISASTER CARDS POOL (KALIKASAN)</span>
              <span className={`count-pill ${disastersReady ? 'complete' : ''}`}>
                {deck.disasters.length} / 6 Selected
              </span>
            </div>
            <div className="draft-card-grid">
              {DISASTER_CARD_LIST.map((card) => {
                const count = deck.disasters.filter((id) => id === card.id).length;
                return (
                  <div
                    key={card.id}
                    className={`draft-card-item disaster ${count > 0 ? 'selected' : ''}`}
                    onClick={() => {
                      if (count > 0 && (deck.disasters.length >= 6 || count >= 2)) {
                        toggleDraftCard(card.id, 'REMOVE');
                      } else if (deck.disasters.length < 6 && count < 2) {
                        toggleDraftCard(card.id, 'ADD');
                      } else if (count > 0) {
                        toggleDraftCard(card.id, 'REMOVE');
                      }
                    }}
                  >
                    <div className="draft-card-top">
                      <span className="draft-card-name">{card.name}</span>
                      <span className="draft-card-cost">⚡ {card.cost}</span>
                    </div>
                    <div
                      className="draft-art-preview"
                      title="Click to spotlight card details"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSpotlightCardId(card.id);
                      }}
                    >
                      <CardIllustration id={card.id} />
                      <span className="draft-inspect-badge">🔍</span>
                    </div>
                    <p className="draft-card-desc">{card.description}</p>
                    <div className="draft-card-controls" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="mini-btn"
                        disabled={count === 0}
                        onClick={() => toggleDraftCard(card.id, 'REMOVE')}
                      >
                        −
                      </button>
                      <span className="copy-count">{count} in deck</span>
                      <button
                        className="mini-btn"
                        disabled={deck.disasters.length >= 6 || count >= 2}
                        onClick={() => toggleDraftCard(card.id, 'ADD')}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* BUFF POOL (6 cards) */}
          <section className="draft-section buff-theme">
            <div className="draft-section-title">
              <span>🛡️ DRRM BUFF CARDS POOL (DEFENDER)</span>
              <span className={`count-pill ${buffsReady ? 'complete' : ''}`}>
                {deck.buffs.length} / 6 Selected
              </span>
            </div>
            <div className="draft-card-grid">
              {BUFF_CARD_LIST.map((card) => {
                const count = deck.buffs.filter((id) => id === card.id).length;
                return (
                  <div
                    key={card.id}
                    className={`draft-card-item buff ${count > 0 ? 'selected' : ''}`}
                    style={buffMarkStyle(card.badgeTint)}
                    onClick={() => {
                      if (count > 0 && (deck.buffs.length >= 6 || count >= 2)) {
                        toggleDraftCard(card.id, 'REMOVE');
                      } else if (deck.buffs.length < 6 && count < 2) {
                        toggleDraftCard(card.id, 'ADD');
                      } else if (count > 0) {
                        toggleDraftCard(card.id, 'REMOVE');
                      }
                    }}
                  >
                    <div className="draft-card-top">
                      <span className="draft-card-name">{card.name}</span>
                      <span className="draft-card-cost">⚡ {card.cost}</span>
                    </div>
                    <div
                      className="draft-art-preview"
                      title="Click to spotlight card details"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSpotlightCardId(card.id);
                      }}
                    >
                      <CardIllustration id={card.id} />
                      {card.badge && (
                        <span className="draft-buff-mark">
                          {card.icon} {card.badge}
                        </span>
                      )}
                      <span className="draft-inspect-badge">🔍</span>
                    </div>
                    <p className="draft-card-desc">{card.description}</p>
                    <div className="draft-card-controls" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="mini-btn"
                        disabled={count === 0}
                        onClick={() => toggleDraftCard(card.id, 'REMOVE')}
                      >
                        −
                      </button>
                      <span className="copy-count">{count} in deck</span>
                      <button
                        className="mini-btn"
                        disabled={deck.buffs.length >= 6 || count >= 2}
                        onClick={() => toggleDraftCard(card.id, 'ADD')}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <footer className="draft-footer">
          <div className="draft-status-msg">
            {isReady
              ? `✅ Player ${draftingPlayer}’s 12-card deck is complete!`
              : `Select ${6 - deck.disasters.length} more Disaster(s) and ${
                  6 - deck.buffs.length
                } more Buff(s).`}
          </div>
          <button
            className="btn-primary btn-large"
            disabled={!isReady}
            onClick={confirmDraft}
          >
            {draftingPlayer === 'A'
              ? 'Confirm Player A Deck → Hand Device to Player B'
              : 'Confirm Player B Deck → Launch Match!'}
          </button>
        </footer>
      </div>

      {/* Spotlight modal when inspecting a card in the Draft Screen */}
      {spotlightCardId && (
        <CardSpotlightModal
          item={{
            kind: 'HAND',
            cardId: spotlightCardId,
            canPlay: false,
            hasEnergy: true,
            isCorrectRole: true,
            currentEnergy: 7
          }}
          onClose={() => setSpotlightCardId(null)}
        />
      )}
    </div>
  );
};
