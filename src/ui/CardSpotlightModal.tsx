import React, { useEffect } from 'react';
import { BUILDINGS, DEFAULT_UPGRADE_COST } from '../data/buildings';
import { ALL_CARDS } from '../data/cards';
import { buffMarkStyle } from './BuffMark';
import { BuildingType, CardId, TargetMode } from '../logic/types';
import { CardIllustration, IllustrationKey } from './CardIllustrations';

export type SpotlightItem =
  | {
      kind: 'BUILD';
      tool: BuildingType | 'UPGRADE';
      canAfford: boolean;
      currentBudget: number;
    }
  | {
      kind: 'HAND';
      uid?: string;
      cardId: CardId;
      canPlay: boolean;
      hasEnergy: boolean;
      isCorrectRole: boolean;
      alreadyPlayed?: boolean;
      currentEnergy: number;
    };

interface CardSpotlightModalProps {
  item: SpotlightItem;
  onClose: () => void;
  onStartDragFromSpotlight?: (e: React.PointerEvent) => void;
  onPlayGlobalCard?: () => void;
}

function formatTargetScope(mode: TargetMode): string {
  switch (mode) {
    case 'GLOBAL':
      return '🌐 Global — release anywhere, or press Play Global Card';
    case 'TILE':
      return '⬡ Single Target Hex Tile';
    case 'TILE_3X3':
      return '⬡ Target Hex + 6 Adjacent Hexes (7-Hex Cluster)';
    case 'EDGE_TILE':
      return '🌊 Closest South-East Coastal Edge Hex';
    case 'BUILDING_TILE':
      return '🏛️ Any Hex Tile with a Standing Building';
  }
}

function getCardTacticalTip(cardId: CardId): string {
  switch (cardId) {
    case 'CAMPFIRE':
      return 'Target un-upgraded Nipa Housing or Farms outside Fire Station range (≤2 hexes) to force fire spread next round.';
    case 'INFERNO':
      return 'Devastating 7-hex blast! Deals 4 damage to un-upgraded wood buildings (2 base × 2 wood), destroying 3 HP huts instantly unless protected by a powered Fire Station.';
    case 'MODERATE_RAIN':
      return 'Floods 1 South-East coastal hex, but also extinguishes small fires—avoid playing right after your own Campfire!';
    case 'DOWNPOUR':
      return 'Surges 2 hex rows inland from the South-East sea and disables unpowered Clinics/Fire Stations if the Defender has no Substation.';
    case 'STRONG_GALE':
      return 'Check the PAGASA Wind Vector in the top-right before playing! Gale pushes every active fire 1 hex downwind and chips all wood buildings.';
    case 'TYPHOON_SIGNAL_3':
      return 'Punishes Defenders who built wide without upgrading to 5 HP Concrete, dealing 2 damage across all non-upgraded structures.';
    case 'EARTHQUAKE_FIRE_DRILL':
      return 'Extends Clinic and Fire Station rescue reach from 2 hexes to 3 this round. The Hall is a shelter, not a rescue source.';
    case 'TREE_PLANTING':
      return 'Reduces coastal flood surge depth by 1 hex row—ideal when PAGASA forecasts Downpour, Typhoon Signal 3, or Round 5 Signal 5.';
    case 'RELIEF_GOODS':
      return 'Automatically restores 2 HP split across your most damaged buildings before Kalikasan’s disasters hit.';
    case 'FEEDING_PROGRAM':
      return 'Adds +3 Food immediately. Each round, 1 Food feeds up to 4 residents; starving residents are lost at the end of the round!';
    case 'MASS_VACCINATION':
      return 'Prevents flood-borne resident losses on flooded tiles and ensures evacuated residents recover safely.';
    case 'BAYANIHAN':
      return 'Drag onto your most critical damaged building (like Barangay Hall or Substation) to heal it to full HP and evacuate 4 residents to safety.';
  }
}

export const CardSpotlightModal: React.FC<CardSpotlightModalProps> = ({
  item,
  onClose,
  onStartDragFromSpotlight,
  onPlayGlobalCard
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (item.kind === 'BUILD') {
    const isUpgrade = item.tool === 'UPGRADE';
    const bCfg = !isUpgrade ? BUILDINGS[item.tool as BuildingType] : null;
    const name = isUpgrade ? 'Upgrade to 5 HP' : bCfg!.name;
    const subTitle = isUpgrade
      ? 'Concrete & Steel Structural Reinforcement'
      : bCfg!.filipinoSub;
    const cost = isUpgrade ? DEFAULT_UPGRADE_COST : bCfg!.cost;
    const desc = isUpgrade
      ? 'Upgrades an existing 3 HP building into a 5 HP reinforced concrete structure and restores it to full HP. Removes double fire damage vulnerability on wood buildings and reduces Round 5 Super Typhoon Signal 5 damage from 3 to 1.'
      : bCfg!.description;

    return (
      <div className="spotlight-backdrop" onClick={onClose}>
        <div
          className="spotlight-container"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left: Enlarged Spotlight Card */}
          <div
            className={`sts-card spotlight-enlarged-card blueprint ${
              isUpgrade ? 'upgrade-blueprint' : ''
            } ${item.canAfford ? 'playable' : ''}`}
            onPointerDown={(e) => {
              if (item.canAfford && onStartDragFromSpotlight) {
                onStartDragFromSpotlight(e);
              }
            }}
          >
            <div
              className={`sts-cost-gem budget-gem ${isUpgrade ? 'upgrade-gem' : ''} ${
                !item.canAfford ? 'no-energy' : ''
              }`}
            >
              {cost}
            </div>
            <div className="sts-card-banner">{name}</div>
            <div className="sts-card-art">
              <CardIllustration id={item.tool as IllustrationKey} />
            </div>
            <div className="sts-card-body">
              <p>{desc}</p>
            </div>
            <div
              className={`sts-card-pill-btn ${
                isUpgrade ? 'upgrade-pill' : 'blueprint-pill'
              }`}
            >
              {isUpgrade ? 'UPGRADE' : 'BLUEPRINT'}
            </div>
          </div>

          {/* Right: Detailed Tactical & DRRM Inspector Panel */}
          <div className="spotlight-details-panel">
            <div className="spotlight-header-row">
              <span className="spotlight-kicker">
                🔍 CARD SPOTLIGHT • {isUpgrade ? 'STRUCTURAL UPGRADE' : 'BUILDING BLUEPRINT'}
              </span>
              <button className="spotlight-close-x" onClick={onClose} title="Close (Esc)">
                ✕
              </button>
            </div>

            <h2 className="spotlight-title">{name}</h2>
            <div className="spotlight-subtitle">{subTitle}</div>

            <div className="spotlight-chips-row">
              <span className={`spotlight-meta-chip ${item.canAfford ? 'ok' : 'warn'}`}>
                💰 Cost: {cost} Budget ({item.canAfford ? 'Affordable' : `Have ${item.currentBudget}`})
              </span>
              <span className="spotlight-meta-chip">
                {isUpgrade ? '⬡ Target: Existing 3 HP Building' : '⬡ Target: Any Empty Hex Tile'}
              </span>
            </div>

            <div className="spotlight-desc-box">
              <p>{desc}</p>
            </div>

            {!isUpgrade && bCfg ? (
              <div className="spotlight-stats-grid">
                <div className="spotlight-stat-item">
                  <span>❤️ Structural HP</span>
                  <strong>
                    {bCfg.baseHp} HP Base → {bCfg.upgradedHp} HP Upgraded
                  </strong>
                </div>
                <div className="spotlight-stat-item">
                  <span>🧱 Base Material</span>
                  <strong>
                    {bCfg.isWoodWhenBase
                      ? '🎋 Wood / Nipa (2× Fire Dmg)'
                      : '🧱 Concrete / Masonry'}
                  </strong>
                </div>
                <div className="spotlight-stat-item">
                  <span>🔌 Power Grid</span>
                  <strong>
                    {bCfg.providesPower
                      ? '⚡ Supplies Grid Power'
                      : bCfg.requiresPower
                      ? '🔌 Requires Active Substation'
                      : 'Independent (No Power Needed)'}
                  </strong>
                </div>
                <div className="spotlight-stat-item">
                  <span>📏 Coverage / Output</span>
                  <strong>
                    {bCfg.residentsCapacity > 0
                      ? `👨‍👩‍👧‍👦 Shelters ${bCfg.residentsCapacity} Residents`
                      : bCfg.foodPerRound > 0
                      ? `🌾 +${bCfg.foodPerRound} Food / Round`
                      : bCfg.blocksFlood
                      ? '🌊 Blocks SE Coastal Flood Surge'
                      : bCfg.effectRadius > 0
                      ? `🛡️ ${bCfg.effectRadius}-Hex Radius Coverage`
                      : 'Standard Barangay Facility'}
                  </strong>
                </div>
              </div>
            ) : (
              <div className="spotlight-stats-grid">
                <div className="spotlight-stat-item">
                  <span>❤️ Max HP Boost</span>
                  <strong>3 HP → 5 HP (+Full Repair)</strong>
                </div>
                <div className="spotlight-stat-item">
                  <span>🔥 Fire Protection</span>
                  <strong>Removes 2× Wood Fire Penalty</strong>
                </div>
                <div className="spotlight-stat-item">
                  <span>🚨 Signal 5 Finale</span>
                  <strong>Takes only 1 Dmg (instead of 3)</strong>
                </div>
                <div className="spotlight-stat-item">
                  <span>👨‍👩‍👧‍👦 Resident Safety</span>
                  <strong>Upgraded Housing shelters residents. Signal 5 deals 1 damage, not 3.</strong>
                </div>
              </div>
            )}

            <div className="spotlight-footer-bar">
              <span className="spotlight-drag-tip">
                {item.canAfford
                  ? '💡 Tip: Drag this card (or from your hand) onto a 3D hex tile to place it!'
                  : '⚠️ Not enough Budget this round (+4 Budget next round).'}
              </span>
              <button className="btn-secondary" onClick={onClose}>
                Close Spotlight
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // HAND CARD (DISASTER or BUFF)
  const cfg = ALL_CARDS[item.cardId];
  const isDisaster = cfg.category === 'DISASTER';

  return (
    <div className="spotlight-backdrop" onClick={onClose}>
      <div
        className="spotlight-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Enlarged Spotlight Card */}
        <div
          className={`sts-card spotlight-enlarged-card ${cfg.category.toLowerCase()} ${
            item.canPlay ? 'playable' : ''
          }`}
          style={cfg.category === 'BUFF' ? buffMarkStyle(cfg.badgeTint) : undefined}
          onPointerDown={(e) => {
            if (item.canPlay && onStartDragFromSpotlight) {
              onStartDragFromSpotlight(e);
            }
          }}
        >
          <div
            className={`sts-cost-gem ${isDisaster ? 'disaster-gem' : 'buff-gem'} ${
              !item.hasEnergy ? 'no-energy' : ''
            }`}
          >
            {cfg.cost}
          </div>
          {cfg.badge && (
            <span className="sts-buff-mark" style={buffMarkStyle(cfg.badgeTint)}>
              <span className="buff-mark-icon" aria-hidden="true">
                {cfg.icon}
              </span>
              {cfg.badge}
            </span>
          )}
          <div className="sts-card-banner">{cfg.name}</div>
          <div className="sts-card-art">
            <CardIllustration id={cfg.id} />
          </div>
          <div className="sts-card-body">
            <p>{cfg.description}</p>
          </div>
          <div
            className={`sts-card-pill-btn ${
              isDisaster ? 'disaster-pill' : 'buff-pill'
            }`}
          >
            {cfg.category}
          </div>
        </div>

        {/* Right: Detailed Tactical & DRRM Inspector Panel */}
        <div className="spotlight-details-panel">
          <div className="spotlight-header-row">
            <span className="spotlight-kicker">
              🔍 CARD SPOTLIGHT • {isDisaster ? 'KALIKASAN DISASTER CARD' : 'DEFENDER DRRM BUFF CARD'}
            </span>
            <button className="spotlight-close-x" onClick={onClose} title="Close (Esc)">
              ✕
            </button>
          </div>

          <h2 className="spotlight-title">
            {cfg.icon} {cfg.name}
          </h2>
          <div className="spotlight-subtitle">
            {cfg.pagasaCode
              ? `PAGASA Classification: ${cfg.pagasaCode}`
              : cfg.badge
              ? `Field mark: ${cfg.icon} ${cfg.badge}`
              : 'Barangay DRRM Preparedness & Response Protocol'}
          </div>

          <div className="spotlight-chips-row">
            <span className={`spotlight-meta-chip ${item.hasEnergy ? 'ok' : 'warn'}`}>
              ⚡ Cost: {cfg.cost} Energy ({item.hasEnergy ? 'Ready' : `Have ${item.currentEnergy}`})
            </span>
            <span className="spotlight-meta-chip">{formatTargetScope(cfg.targetMode)}</span>
          </div>

          <div className="spotlight-desc-box">
            <p>{cfg.description}</p>
          </div>

          <div className="spotlight-stats-grid">
            <div className="spotlight-stat-item">
              <span>⏱️ Resolution Order</span>
              <strong>
                {isDisaster
                  ? 'Step 2: Resolves AFTER Defender Buffs'
                  : 'Step 1: Resolves BEFORE Disasters'}
              </strong>
            </div>
            <div className="spotlight-stat-item">
              <span>🎭 Played By</span>
              <strong>
                {isDisaster ? '🌀 Kalikasan (Nature)' : '🛡️ Barangay Defender'}
              </strong>
            </div>
          </div>

          <div className="spotlight-tactical-tip">
            <strong>💡 Tactical Guide:</strong> {getCardTacticalTip(cfg.id)}
          </div>

          <div className="spotlight-footer-bar">
            <span className="spotlight-drag-tip">
              {item.alreadyPlayed
                ? '✓ This card has already been played this round.'
                : !item.isCorrectRole
                ? `🔒 Only playable during the ${isDisaster ? 'Kalikasan' : 'Defender'} Card Phase.`
                : !item.hasEnergy
                ? '⚠️ Not enough Energy remaining this turn.'
                : '💡 Drag this card onto the 3D hex map to play it!'}
            </span>

            <div style={{ display: 'flex', gap: 8 }}>
              {item.canPlay && cfg.targetMode === 'GLOBAL' && onPlayGlobalCard && (
                <button
                  className="btn-primary"
                  onClick={() => {
                    onPlayGlobalCard();
                    onClose();
                  }}
                >
                  ⚡ Play Global Card Now
                </button>
              )}
              <button className="btn-secondary" onClick={onClose}>
                Close Spotlight
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
