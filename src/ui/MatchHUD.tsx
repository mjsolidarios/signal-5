import React, { useEffect, useRef, useState } from 'react';
import { MUSIC_THEME_LABELS, MusicTheme, soundFX } from '../audio/useSound';
import { BUILDABLE_TYPES, BUILDINGS, DEFAULT_UPGRADE_COST } from '../data/buildings';
import { ALL_CARDS, DISASTER_CARDS, SUPER_TYPHOON_SIGNAL_5_INFO } from '../data/cards';
import { getTile, HEX_DIRECTIONS } from '../logic/grid';
import {
  calculateVillageIntegrity,
  canRescueFromTile,
  countTotalResidents,
  isBuildingWood,
  isGridPowered,
  isProtectedByFireStation,
  medalForIntegrity
} from '../logic/rules';
import { BuildingType, CardId, TargetMode } from '../logic/types';
import { useGameStore } from '../store/useGameStore';
import { BuffMarkChip, buffMarkStyle } from './BuffMark';
import { CardIllustration, IllustrationKey } from './CardIllustrations';
import { CardSpotlightModal, SpotlightItem } from './CardSpotlightModal';
import { PassDeviceModal } from './PassDeviceModal';

interface DraggingCardState {
  mode: 'HAND_CARD' | 'BUILD_CARD';
  uid: string;
  buildTool?: BuildingType | 'UPGRADE';
  cardId?: CardId;
  name: string;
  icon: string;
  cost: number;
  accentColor: string;
  targetMode?: TargetMode;
  canDrag: boolean;
  isDraggingActive: boolean; // False on pointerdown until pointer moves >= 8px (so a click/tap spotlights the card!)
  spotlightItem: SpotlightItem;
  startX: number;
  startY: number;
  currX: number;
  currY: number;
}

interface BuildCardItem {
  tool: BuildingType | 'UPGRADE';
  name: string;
  icon: string;
  cost: number;
  categoryLabel: string;
  description: string;
}

const BUILD_BLUEPRINT_CARDS: BuildCardItem[] = [
  ...BUILDABLE_TYPES.map((type) => ({
    tool: type as BuildingType | 'UPGRADE',
    name: BUILDINGS[type].name,
    icon: BUILDINGS[type].icon,
    cost: BUILDINGS[type].cost,
    categoryLabel: 'BLUEPRINT',
    description: BUILDINGS[type].description
  })),
  {
    tool: 'UPGRADE',
    name: 'Upgrade to 5 HP',
    icon: '⬆️',
    cost: DEFAULT_UPGRADE_COST,
    categoryLabel: 'UPGRADE',
    description:
      'Upgrade an existing building to 5 HP Concrete (resists Fire & Signal 5).'
  }
];

const DRAG_THRESHOLD_PX = 8;

export const MatchHUD: React.FC = () => {
  const half = useGameStore((s) => s.half);
  const round = useGameStore((s) => s.round);
  const phase = useGameStore((s) => s.phase);
  const defenderPlayer = useGameStore((s) => s.defenderPlayer);
  const kalikasanPlayer = useGameStore((s) => s.kalikasanPlayer);
  const grid = useGameStore((s) => s.grid);
  const budget = useGameStore((s) => s.budget);
  const food = useGameStore((s) => s.food);
  const destroyedMaxHpTotal = useGameStore((s) => s.destroyedMaxHpTotal);
  const buildUndoCount = useGameStore((s) => s.buildUndoStack.length);
  const undoLastBuild = useGameStore((s) => s.undoLastBuild);
  const energyDefender = useGameStore((s) => s.energyDefender);
  const energyKalikasan = useGameStore((s) => s.energyKalikasan);
  const selectBuildTool = useGameStore((s) => s.selectBuildTool);
  const hoveredTile = useGameStore((s) => s.hoveredTile);
  const defenderHand = useGameStore((s) => s.defenderHand);
  const kalikasanHand = useGameStore((s) => s.kalikasanHand);
  const selectHandCard = useGameStore((s) => s.selectHandCard);
  const playGlobalSelectedCard = useGameStore((s) => s.playGlobalSelectedCard);
  const onTileClick = useGameStore((s) => s.onTileClick);
  const forecastDisasterId = useGameStore((s) => s.forecastDisasterId);
  const windDirection = useGameStore((s) => s.windDirection);
  const roundLogs = useGameStore((s) => s.roundLogs);
  const defenderPlayedActions = useGameStore((s) => s.defenderPlayedActions);
  const vfx = useGameStore((s) => s.vfx);

  const acknowledgeForecast = useGameStore((s) => s.acknowledgeForecast);
  const finishDefenderBuildPhase = useGameStore((s) => s.finishDefenderBuildPhase);
  const finishDefenderCardPhase = useGameStore((s) => s.finishDefenderCardPhase);
  const finishKalikasanCardPhase = useGameStore((s) => s.finishKalikasanCardPhase);
  const advanceFromResolve = useGameStore((s) => s.advanceFromResolve);

  const [muted, setMuted] = useState(soundFX.muted);
  const [musicTheme, setMusicTheme] = useState<MusicTheme>(soundFX.getTheme());
  const [logCollapsed, setLogCollapsed] = useState(false);
  const [showQuickGuide, setShowQuickGuide] = useState(false);
  const [dragCard, setDragCard] = useState<DraggingCardState | null>(null);
  const [spotlightItem, setSpotlightItem] = useState<SpotlightItem | null>(null);
  const [hoveredCardUid, setHoveredCardUid] = useState<string | null>(null);
  const dragRef = useRef<DraggingCardState | null>(null);
  const spotlightRef = useRef<SpotlightItem | null>(null);
  spotlightRef.current = spotlightItem;

  const armDrag = (next: DraggingCardState) => {
    dragRef.current = next;
    setDragCard(next);
  };

  // Clear spotlight & adapt musical theme whenever the phase/round changes
  useEffect(() => {
    setSpotlightItem(null);

    let nextTheme: MusicTheme = 'CALM_BARANGAY';
    if (round === 5 || vfx.signal5Active) {
      nextTheme = 'SIGNAL_5_FINALE';
    } else if (phase === 'KALIKASAN_CARDS' || phase === 'RESOLVE') {
      nextTheme = 'KALIKASAN_STORM';
    } else if (phase === 'FORECAST' || phase === 'DEFENDER_CARDS') {
      nextTheme = 'TENSION_DRILL';
    } else {
      nextTheme = 'CALM_BARANGAY';
    }
    soundFX.setMusicTheme(nextTheme);
    setMusicTheme(nextTheme);
    soundFX.startMusicLoop();
  }, [phase, round, half, vfx.signal5Active]);

  // Pointer listeners stay mounted so a fast drag cannot drop the pointerup
  // between effect re-subscribes. dragRef is updated inside the handlers.
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const current = dragRef.current;
      if (!current) return;
      const dist = Math.hypot(e.clientX - current.startX, e.clientY - current.startY);

      if (!current.isDraggingActive) {
        if (dist >= DRAG_THRESHOLD_PX && current.canDrag) {
          if (current.mode === 'BUILD_CARD' && current.buildTool) {
            selectBuildTool(current.buildTool);
          } else if (current.mode === 'HAND_CARD') {
            selectHandCard(current.uid);
          }
          setSpotlightItem(null);
          const next: DraggingCardState = {
            ...current,
            isDraggingActive: true,
            currX: e.clientX,
            currY: e.clientY
          };
          dragRef.current = next;
          setDragCard(next);
        }
        return;
      }

      const next: DraggingCardState = {
        ...current,
        currX: e.clientX,
        currY: e.clientY
      };
      dragRef.current = next;
      setDragCard(next);
    };

    const handlePointerUp = () => {
      const current = dragRef.current;
      if (!current) return;
      dragRef.current = null;

      if (!current.isDraggingActive) {
        soundFX.playCard();
        setSpotlightItem(current.spotlightItem);
        setDragCard(null);
        return;
      }

      const hovered = useGameStore.getState().hoveredTile;
      if (current.mode === 'HAND_CARD' && current.targetMode === 'GLOBAL') {
        playGlobalSelectedCard();
      } else if (hovered) {
        onTileClick(hovered.q, hovered.r);
      } else {
        selectHandCard(null);
        selectBuildTool(null);
      }
      setDragCard(null);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [onTileClick, selectHandCard, selectBuildTool, playGlobalSelectedCard]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dragRef.current = null;
        setDragCard(null);
        setSpotlightItem(null);
        selectHandCard(null);
        selectBuildTool(null);
        return;
      }
      if (e.repeat || spotlightRef.current) return;
      if (e.key === 'z' || e.key === 'Z') {
        undoLastBuild();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectHandCard, selectBuildTool, undoLastBuild]);

  if (phase === 'PASS_DEVICE') {
    return <PassDeviceModal />;
  }

  const isKalikasanTurn = phase === 'KALIKASAN_CARDS';
  const activePlayer = isKalikasanTurn ? kalikasanPlayer : defenderPlayer;
  const activeEnergy = isKalikasanTurn ? energyKalikasan : energyDefender;
  const maxEnergy = Math.min(7, 3 + round);

  const totalResidents = countTotalResidents(grid);
  const foodUpkeep = totalResidents <= 0 ? 0 : Math.ceil(totalResidents / 4);
  const { integrityPct, hallDestroyed } = calculateVillageIntegrity(grid, destroyedMaxHpTotal);
  const medalNow = medalForIntegrity(integrityPct, hallDestroyed);
  const powered = isGridPowered(grid);
  const windInfo = HEX_DIRECTIONS[windDirection];

  const forecastInfo =
    forecastDisasterId === 'SIGNAL_5'
      ? {
          icon: '🚨',
          name: SUPER_TYPHOON_SIGNAL_5_INFO.name,
          code: SUPER_TYPHOON_SIGNAL_5_INFO.pagasaCode,
          desc: SUPER_TYPHOON_SIGNAL_5_INFO.description,
          badgeTop: 'SIGNAL #5',
          badgeBottom: 'SUPER TYPHOON',
          badgeColor: 'crimson'
        }
      : {
          icon: DISASTER_CARDS[forecastDisasterId].icon,
          name: DISASTER_CARDS[forecastDisasterId].name,
          code: DISASTER_CARDS[forecastDisasterId].pagasaCode || 'PAGASA ADVISORY',
          desc: DISASTER_CARDS[forecastDisasterId].description,
          badgeTop:
            (DISASTER_CARDS[forecastDisasterId].pagasaCode || 'ADVISORY').split(' ')[0],
          badgeBottom:
            (DISASTER_CARDS[forecastDisasterId].pagasaCode || 'WARNING')
              .split(' ')
              .slice(1)
              .join(' ') || 'ALERT',
          badgeColor:
            forecastDisasterId === 'INFERNO' || forecastDisasterId === 'TYPHOON_SIGNAL_3'
              ? 'crimson'
              : 'amber'
        };

  const activeHand = isKalikasanTurn ? kalikasanHand : defenderHand;

  // Live Hex Tile Inspector Data
  const inspectedTile = hoveredTile ? getTile(grid, hoveredTile.q, hoveredTile.r) : null;

  // Determine floating drag status message for Build Blueprint vs Hand Card
  const getDragPromptText = (): string => {
    if (!dragCard || !dragCard.isDraggingActive) return '';
    if (dragCard.mode === 'HAND_CARD' && dragCard.targetMode === 'GLOBAL') {
      return '🌐 Release to play — this card affects the whole barangay';
    }
    if (!hoveredTile || !inspectedTile) {
      return 'Drag onto a 3D Hex Tile on the island';
    }
    if (dragCard.mode === 'BUILD_CARD') {
      if (dragCard.buildTool === 'UPGRADE') {
        if (!inspectedTile.building) return `⚠️ No building at Hex (${hoveredTile.q}, ${hoveredTile.r})`;
        if (inspectedTile.building.upgraded) return '⚠️ Already Upgraded (5 HP)';
        return `⬆️ Release to Upgrade ${BUILDINGS[inspectedTile.building.type].name} at (${hoveredTile.q}, ${hoveredTile.r})`;
      } else {
        if (inspectedTile.building) return `⚠️ Hex (${hoveredTile.q}, ${hoveredTile.r}) is occupied`;
        return `🏗️ Release to Build ${dragCard.name} on Hex (${hoveredTile.q}, ${hoveredTile.r})`;
      }
    }
    if (dragCard.targetMode === 'BUILDING_TILE') {
      if (!inspectedTile.building || inspectedTile.building.hp <= 0) {
        return '⚠️ Release on a standing building';
      }
      return `🤝 Release on ${BUILDINGS[inspectedTile.building.type].name} at (${hoveredTile.q}, ${hoveredTile.r})`;
    }
    return `🎯 Release to play on Hex (${hoveredTile.q}, ${hoveredTile.r})`;
  };

  const isDragTargetValid = (): boolean => {
    if (!dragCard || !dragCard.isDraggingActive) return false;
    if (dragCard.mode === 'HAND_CARD' && dragCard.targetMode === 'GLOBAL') return true;
    if (!hoveredTile || !inspectedTile) return false;
    if (dragCard.mode === 'BUILD_CARD') {
      if (dragCard.buildTool === 'UPGRADE') {
        return Boolean(inspectedTile.building && !inspectedTile.building.upgraded);
      }
      return !inspectedTile.building;
    }
    if (dragCard.targetMode === 'BUILDING_TILE') {
      return Boolean(inspectedTile.building && inspectedTile.building.hp > 0);
    }
    return true;
  };

  const validDrop = isDragTargetValid();

  return (
    <div className="hud-root">
      {/* TOP BAR: Role Pill, Resource Pills, and Top-Right Utility Circle Buttons */}
      <header className="hud-top-bar">
        <div className={`hud-role-badge ${isKalikasanTurn ? 'kalikasan' : 'defender'}`}>
          <span className="role-home-icon">{isKalikasanTurn ? '🌀' : '🏠'}</span>
          <span>
            H{half} • Player {activePlayer}
          </span>
          <span className="role-bracket-tag">
            [{isKalikasanTurn ? 'KALIKASAN' : 'DEFENDER'}]
          </span>
        </div>

        <div className="hud-stats-cluster">
          <div className="stat-pill" title="Defender Construction Budget">
            <span>💰 Budget</span>
            <strong>{budget}</strong>
          </div>
          <div className="stat-pill" title="Card Energy (3 + Round, max 7)">
            <span>⚡ Energy</span>
            <strong>
              {activeEnergy}/{maxEnergy}
            </strong>
          </div>
          <div
            className="stat-pill"
            title={`Food. Upkeep this round is ${foodUpkeep} (1 food feeds 4 residents).`}
          >
            <span>🌾 Food</span>
            <strong>{food}</strong>
          </div>
          <div className="stat-pill" title="Surviving Residents (x10 pts each)">
            <span>👨‍👩‍👧‍👦 Residents</span>
            <strong>{totalResidents}</strong>
          </div>
          <div
            className={`stat-pill ${powered ? 'power-on' : 'power-off'}`}
            title="Substation Grid Power"
          >
            <span>{powered ? '🔌 Grid ON' : '🕯️ Unpowered'}</span>
          </div>
          <div className="stat-pill round-pill">
            <span>⏱️ Round</span>
            <strong>{round} / 5</strong>
          </div>
        </div>

        <div className="hud-utility-btns">
          <button
            className="btn-util-circle"
            onClick={() => setShowQuickGuide((v) => !v)}
            title="DRRM Field Guide & Hex Rules"
          >
            ?
          </button>
          <button
            className="btn-util-circle"
            onClick={() => setLogCollapsed((v) => !v)}
            title="Toggle Activity Log"
          >
            📖
          </button>
          <button
            className="btn-util-circle"
            onClick={() => {
              const next = soundFX.cycleMusicTheme();
              setMusicTheme(next);
            }}
            title={`Soundtrack: ${MUSIC_THEME_LABELS[musicTheme]} (Click to switch track)`}
          >
            🎵
          </button>
          <button
            className="btn-util-circle"
            onClick={() => setMuted(soundFX.toggleMute())}
            title="Toggle Audio"
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      {/* QUICK FIELD GUIDE MODAL (toggled via ? button) */}
      {showQuickGuide && (
        <div className="modal-center-wrapper" onClick={() => setShowQuickGuide(false)}>
          <div className="pagasa-bulletin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bulletin-header">
              <span>📖 SIGNAL 5 — HEX BARANGAY FIELD GUIDE</span>
              <button className="mini-btn" onClick={() => setShowQuickGuide(false)}>
                ✕
              </button>
            </div>
            <div style={{ fontSize: '0.82rem', lineHeight: 1.5, color: '#e2e8f0' }}>
              <p style={{ margin: '0 0 8px' }}>
                • <strong>37-Hex Barangay:</strong> Barangay Hall is at <code>(0,0)</code>. The two
                South-East edges border the Philippine Sea.
              </p>
              <p style={{ margin: '0 0 8px' }}>
                • <strong>5 cards, your role:</strong> The Defender draws 5 Buffs. Kalikasan draws
                5 Disasters (the forecast card is guaranteed). Energy = 3 + round, max 7.
              </p>
              <p style={{ margin: '0 0 8px' }}>
                • <strong>Food, power, integrity:</strong> 1 food feeds 4 residents. A Substation
                powers Clinics and Fire Stations (2 hexes). Integrity includes destroyed buildings,
                and a fallen Hall caps the medal at Silver.
              </p>
              <p style={{ margin: 0 }}>
                • <strong>Round 5 Finale:</strong> Super Typhoon Signal 5 strikes after this
                round’s cards. Press Z to undo a build. Global cards play even off the island.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TOP-RIGHT: PAGASA Forecast Card with Stacked Warning Badges */}
      <div className="hud-forecast-chip">
        <div className="forecast-chip-left">
          <span className="forecast-chip-icon">{forecastInfo.icon}</span>
        </div>
        <div className="forecast-chip-center">
          <div className="forecast-chip-kicker">PAGASA NEXT ROUND</div>
          <div className="forecast-chip-title">{forecastInfo.name}</div>
          <div className="forecast-chip-sub">
            💨 Wind: <strong>{windInfo.name}</strong> ({windInfo.id}) •{' '}
            {round === 5 ? 'LANDFALL!' : `R${round + 1}`}
          </div>
        </div>
        <div className="forecast-chip-badges">
          <span className={`pagasa-stack-pill ${forecastInfo.badgeColor}`}>
            {forecastInfo.badgeTop}
          </span>
          <span className="pagasa-stack-pill dark">{forecastInfo.badgeBottom}</span>
        </div>
      </div>

      {/* LEFT COLLAPSIBLE ACTIVITY LOG CARD */}
      <div className={`hud-log-card ${logCollapsed ? 'collapsed' : ''}`}>
        <div className="hud-log-rows">
          {(logCollapsed ? roundLogs.slice(0, 1) : roundLogs.slice(0, 3)).map((msg, i) => (
            <div key={i} className="hud-log-line">
              {msg}
            </div>
          ))}
        </div>
        <button
          className="hud-log-toggle"
          onClick={() => setLogCollapsed((v) => !v)}
          title={logCollapsed ? 'Expand Log' : 'Collapse Log'}
        >
          {logCollapsed ? '⌄' : '⌃'}
        </button>
      </div>

      {/* LIVE 3D HEX TILE INSPECTOR BADGE */}
      {inspectedTile && (
        <div className="hud-tile-inspector">
          <div className="inspector-header">
            <span>
              ⬡ Hex ({inspectedTile.q}, {inspectedTile.r}) •{' '}
              {inspectedTile.coastalDepth === 0
                ? 'SE Sea Edge'
                : inspectedTile.coastalDepth === 1
                ? 'Lowland Ring'
                : 'Inland Terrace'}
            </span>
            {inspectedTile.onFire && <span className="hazard-tag fire">🔥 ON FIRE</span>}
            {inspectedTile.flooded && <span className="hazard-tag flood">🌊 FLOODED</span>}
            {defenderPlayedActions.some(
              (action) =>
                action.cardId === 'BAYANIHAN' &&
                action.targetQ === inspectedTile.q &&
                action.targetR === inspectedTile.r
            ) && <span className="hazard-tag buff-bayan">🤝 BAYAN</span>}
          </div>
          {inspectedTile.building ? (
            <div className="inspector-building-row">
              <strong>
                {BUILDINGS[inspectedTile.building.type].icon}{' '}
                {BUILDINGS[inspectedTile.building.type].name}
              </strong>
              <span className="inspector-chip">
                ❤️ {inspectedTile.building.hp}/{inspectedTile.building.maxHp} HP
              </span>
              <span className="inspector-chip">
                {inspectedTile.building.upgraded
                  ? '🧱 Concrete'
                  : isBuildingWood(inspectedTile.building)
                  ? '🎋 Wood (2× Fire)'
                  : '🏗️ Base'}
              </span>
              {inspectedTile.building.residents > 0 && (
                <span className="inspector-chip">
                  👨‍👩‍👧‍👦 {inspectedTile.building.residents}
                </span>
              )}
              {isProtectedByFireStation(grid, inspectedTile.q, inspectedTile.r) && (
                <span className="inspector-chip safe">🚒 Fire Protected (≤2 hex)</span>
              )}
              {canRescueFromTile(grid, inspectedTile.q, inspectedTile.r) && (
                <span className="inspector-chip safe">🏥 Rescue Coverage (≤2 hex)</span>
              )}
            </div>
          ) : (
            <div className="inspector-empty">Empty hex plot — ready for construction</div>
          )}
        </div>
      )}

      {/* RIGHT: Vertical Village Integrity Bar with Medal Markers */}
      <aside className="hud-integrity-sidebar">
        <div className="integrity-title">INTEGRITY</div>
        <div className="integrity-pct-value">{integrityPct}%</div>
        <div
          className="integrity-medal-now"
          title="Medal if the half ended on this board. A fallen Hall caps Gold at Silver."
        >
          {medalNow === 'GOLD'
            ? '🥇'
            : medalNow === 'SILVER'
            ? '🥈'
            : medalNow === 'BRONZE'
            ? '🥉'
            : '—'}
        </div>
        <div className="integrity-bar-track">
          <div
            className="integrity-bar-fill"
            style={{
              height: `${integrityPct}%`,
              background:
                integrityPct >= 90
                  ? 'linear-gradient(180deg, #4ade80, #eab308)'
                  : integrityPct >= 75
                  ? 'linear-gradient(180deg, #38bdf8, #94a3b8)'
                  : integrityPct >= 50
                  ? 'linear-gradient(180deg, #fdba74, #d97706)'
                  : 'linear-gradient(180deg, #fca5a5, #dc2626)'
            }}
          />
          <div className="medal-marker gold" style={{ bottom: '90%' }} title="Gold >= 90%">
            🥇 90%
          </div>
          <div className="medal-marker silver" style={{ bottom: '75%' }} title="Silver >= 75%">
            🥈 75%
          </div>
          <div className="medal-marker bronze" style={{ bottom: '50%' }} title="Bronze >= 50%">
            🥉 50%
          </div>
        </div>
        {hallDestroyed && (
          <div className="hall-warning-tag" title="Barangay Hall destroyed — max medal Silver">
            ⚠️ Hall Lost (Max 🥈)
          </div>
        )}
      </aside>

      {defenderPlayedActions.length > 0 && (
        <div className="hud-buff-marks" aria-label="Buffs played this round">
          {defenderPlayedActions.map((action, index) => (
            <BuffMarkChip key={`${action.cardId}-${action.targetQ ?? 'g'}-${action.targetR ?? index}-${index}`} cardId={action.cardId} />
          ))}
        </div>
      )}

      {/* DRAMATIC FULL-SCREEN SUPER TYPHOON SIGNAL 5 WARNING BANNER (Round 5) */}
      {vfx.signal5Active && (
        <div className="signal5-alert-banner">
          <span className="siren-blink">🚨</span>
          <div>
            <strong>SUPER TYPHOON SIGNAL NO. 5 LANDFALL!</strong>
            <span>Catastrophic winds &amp; 3-ring storm surge from the South-East sea!</span>
          </div>
          <span className="siren-blink">🚨</span>
        </div>
      )}

      {/* CARD SPOTLIGHT MODAL (Opened when clicking/tapping any card in hand) */}
      {spotlightItem && (
        <CardSpotlightModal
          item={spotlightItem}
          onClose={() => setSpotlightItem(null)}
          onPlayGlobalCard={() => {
            if (spotlightItem.kind === 'HAND' && spotlightItem.uid) {
              selectHandCard(spotlightItem.uid);
              playGlobalSelectedCard();
            }
          }}
          onStartDragFromSpotlight={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            const startX = rect.left + rect.width / 2;
            const startY = rect.top + 40;

            if (spotlightItem.kind === 'BUILD') {
              const isUp = spotlightItem.tool === 'UPGRADE';
              const bCfg = !isUp ? BUILDINGS[spotlightItem.tool as BuildingType] : null;
              armDrag({
                mode: 'BUILD_CARD',
                uid: `build-${spotlightItem.tool}`,
                buildTool: spotlightItem.tool,
                name: isUp ? 'Upgrade to 5 HP' : bCfg!.name,
                icon: isUp ? '⬆️' : bCfg!.icon,
                cost: isUp ? DEFAULT_UPGRADE_COST : bCfg!.cost,
                accentColor: isUp ? '#a855f7' : '#38bdf8',
                canDrag: spotlightItem.canAfford,
                isDraggingActive: false,
                spotlightItem,
                startX,
                startY,
                currX: e.clientX,
                currY: e.clientY
              });
            } else if (spotlightItem.kind === 'HAND' && spotlightItem.uid) {
              const cfg = ALL_CARDS[spotlightItem.cardId];
              armDrag({
                mode: 'HAND_CARD',
                uid: spotlightItem.uid,
                cardId: spotlightItem.cardId,
                name: cfg.name,
                icon: cfg.icon,
                cost: cfg.cost,
                targetMode: cfg.targetMode,
                accentColor: cfg.category === 'DISASTER' ? '#f43f5e' : '#2dd4bf',
                canDrag: spotlightItem.canPlay,
                isDraggingActive: false,
                spotlightItem,
                startX,
                startY,
                currX: e.clientX,
                currY: e.clientY
              });
            }
          }}
        />
      )}

      {/* SHARED SVG CURVED BEZIER TARGETING ARC WHILE DRAGGING ANY CARD (BUILD OR HAND) */}
      {dragCard && dragCard.isDraggingActive && (
        <div className="sts-drag-layer">
          <svg className="sts-bezier-svg">
            <defs>
              <linearGradient id="stsArcGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor={dragCard.accentColor} stopOpacity="0.35" />
                <stop
                  offset="100%"
                  stopColor={validDrop ? '#fde047' : '#94a3b8'}
                  stopOpacity="0.95"
                />
              </linearGradient>
            </defs>
            <path
              d={`M ${dragCard.startX} ${dragCard.startY} Q ${
                (dragCard.startX + dragCard.currX) / 2
              } ${Math.min(dragCard.startY, dragCard.currY) - 110} ${dragCard.currX} ${
                dragCard.currY
              }`}
              fill="none"
              stroke="url(#stsArcGrad)"
              strokeWidth="6"
              strokeDasharray="10 6"
              strokeLinecap="round"
            />
            <circle
              cx={dragCard.currX}
              cy={dragCard.currY}
              r={validDrop ? 18 : 10}
              fill="none"
              stroke={validDrop ? '#fde047' : '#94a3b8'}
              strokeWidth="3"
            />
          </svg>

          <div
            className={`sts-floating-drag-card ${validDrop ? 'valid-target' : ''}`}
            style={{
              left: `${dragCard.currX}px`,
              top: `${dragCard.currY}px`
            }}
          >
            <div className="sts-floating-top">
              <span>{dragCard.icon}</span>
              <strong>{dragCard.name}</strong>
              <span className="sts-floating-cost">
                {dragCard.mode === 'BUILD_CARD' ? `💰${dragCard.cost}` : `⚡${dragCard.cost}`}
              </span>
            </div>
            <div className="sts-floating-status">{getDragPromptText()}</div>
          </div>
        </div>
      )}

      {/* PHASE 1: FORECAST PAGASA BULLETIN MODAL */}
      {phase === 'FORECAST' && (
        <div className="modal-center-wrapper">
          <div className="pagasa-bulletin-modal">
            <div className="bulletin-header">
              <span>📡 DOST-PAGASA SEVERE WEATHER BULLETIN</span>
              <span>ROUND {round} OF 5</span>
            </div>
            <div className="bulletin-body">
              <div className="bulletin-big-icon">{forecastInfo.icon}</div>
              <div>
                <div className="bulletin-kicker">
                  {round === 5
                    ? 'FINAL ROUND — EXTREME METEOROLOGICAL EVENT'
                    : `FORECAST QUEUED FOR NEXT ROUND (ROUND ${round + 1})`}
                </div>
                <h3>{forecastInfo.name}</h3>
                <p>{forecastInfo.desc}</p>
                <div style={{ marginTop: 8, fontSize: '0.82rem', color: '#fde68a' }}>
                  💨 <strong>Forecasted Wind Vector:</strong> {windInfo.arrow} {windInfo.name}{' '}
                  <code>{windInfo.shortLabel}</code> (Gales spread active fires 1 hex in this
                  direction)
                </div>
                {round === 5 && (
                  <div className="signal5-finale-note">
                    ⚠️ <strong>ROUND 5 FINALE:</strong> Super Typhoon Signal 5 will strike at the end
                    of this round after all Buff and Disaster cards resolve! Upgrade houses to
                    Concrete or evacuate residents near a powered Clinic/Fire Station!
                  </div>
                )}
              </div>
            </div>
            <button className="btn-primary btn-large" onClick={acknowledgeForecast}>
              🛡️ Enter Build Phase (Player {defenderPlayer})
            </button>
          </div>
        </div>
      )}

      {/* PHASE 2: DEFENDER BUILD PHASE — SLAY THE SPIRE FANNED BLUEPRINT CARDS */}
      {phase === 'DEFENDER_BUILD' && (
        <>
          <div className="sts-hud-controls-bar">
            <div className="sts-energy-orb build-budget">
              <div className="orb-value">💰{budget}</div>
              <div className="orb-label">BUDGET</div>
            </div>

            <div className="sts-turn-banner">
              <span className="banner-phase-tag">🚩 BUILD PHASE (Player {defenderPlayer})</span>
              <span className="banner-divider">|</span>
              <span>
                <strong>Click</strong> a blueprint to read it, or <strong>drag</strong> it onto a
                hex. <strong>Z</strong> undoes the last build.
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                className="btn-secondary"
                style={{ padding: '11px 16px', borderRadius: 999 }}
                onClick={undoLastBuild}
                disabled={buildUndoCount === 0}
                title="Undo the last building placed or upgraded (Z)"
              >
                Undo
              </button>
              <button className="btn-primary sts-end-turn-btn" onClick={finishDefenderBuildPhase}>
                End Phase → 🃏
              </button>
            </div>
          </div>

          <div className="sts-fanned-hand-wrapper">
            <div className="sts-fanned-hand">
              {BUILD_BLUEPRINT_CARDS.map((bCard, idx) => {
                const uid = `build-${bCard.tool}`;
                const canAfford = budget >= bCard.cost;
                const isBeingDragged = Boolean(
                  dragCard?.uid === uid && dragCard.isDraggingActive
                );
                const isSpotlighted =
                  spotlightItem?.kind === 'BUILD' && spotlightItem.tool === bCard.tool;
                const isHovered = hoveredCardUid === uid;
                const isUpgrade = bCard.tool === 'UPGRADE';

                // Fan math across 7 blueprint cards (center index = 3, offsets -3..+3)
                const total = BUILD_BLUEPRINT_CARDS.length;
                const offset = idx - (total - 1) / 2;
                const angleDeg = offset * 4.8;
                const arcDropPx = Math.abs(offset) * 5 + offset * offset * 2.2;

                const transformStyle =
                  isBeingDragged || isSpotlighted
                    ? 'translateY(-55px) scale(1.12) rotate(0deg)'
                    : isHovered
                    ? 'translateY(-48px) scale(1.16) rotate(0deg)'
                    : `translateY(${arcDropPx}px) rotate(${angleDeg}deg)`;

                const cardSpotlightData: SpotlightItem = {
                  kind: 'BUILD',
                  tool: bCard.tool,
                  canAfford,
                  currentBudget: budget
                };

                return (
                  <div
                    key={uid}
                    className={`sts-card blueprint ${
                      isUpgrade ? 'upgrade-blueprint' : ''
                    } ${canAfford ? 'playable' : 'unplayable'} ${
                      isBeingDragged ? 'dragging-source' : ''
                    } ${isSpotlighted ? 'spotlight-active-source' : ''}`}
                    style={{
                      transform: transformStyle,
                      zIndex: isBeingDragged || isSpotlighted ? 60 : isHovered ? 50 : 10 + idx
                    }}
                    onPointerEnter={() => setHoveredCardUid(uid)}
                    onPointerLeave={() =>
                      setHoveredCardUid((prev) => (prev === uid ? null : prev))
                    }
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const startX = rect.left + rect.width / 2;
                      const startY = rect.top + 30;
                      armDrag({
                        mode: 'BUILD_CARD',
                        uid,
                        buildTool: bCard.tool,
                        name: bCard.name,
                        icon: bCard.icon,
                        cost: bCard.cost,
                        accentColor: isUpgrade ? '#a855f7' : '#38bdf8',
                        canDrag: canAfford,
                        isDraggingActive: false,
                        spotlightItem: cardSpotlightData,
                        startX,
                        startY,
                        currX: e.clientX,
                        currY: e.clientY
                      });
                    }}
                  >
                    {/* Top-Left Circular Cyan/Purple Cost Badge */}
                    <div
                      className={`sts-cost-gem budget-gem ${isUpgrade ? 'upgrade-gem' : ''} ${
                        !canAfford ? 'no-energy' : ''
                      }`}
                    >
                      {bCard.cost}
                    </div>

                    {/* Centered Card Title */}
                    <div className="sts-card-banner">{bCard.name}</div>

                    {/* Illustrated Vector Diorama Art Window */}
                    <div className="sts-card-art">
                      <CardIllustration id={bCard.tool as IllustrationKey} />
                    </div>

                    {/* Blueprint Effect Text */}
                    <div className="sts-card-body">
                      <p>{bCard.description}</p>
                    </div>

                    {/* Bottom Glowing Category Pill */}
                    <div
                      className={`sts-card-pill-btn ${
                        isUpgrade ? 'upgrade-pill' : 'blueprint-pill'
                      }`}
                    >
                      {!canAfford ? 'LOW BUDGET' : bCard.categoryLabel}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* PHASE 3: SLAY-THE-SPIRE FANNED 5-CARD HAND + DRAG-TO-TILE TARGETING */}
      {(phase === 'DEFENDER_CARDS' || phase === 'KALIKASAN_CARDS') && (
        <>
          <div className="sts-hud-controls-bar">
            <div className={`sts-energy-orb ${isKalikasanTurn ? 'kalikasan' : 'defender'}`}>
              <div className="orb-value">
                ⚡{activeEnergy}
                <span>/{maxEnergy}</span>
              </div>
              <div className="orb-label">ENERGY</div>
            </div>

            <div className="sts-turn-banner">
              {phase === 'DEFENDER_CARDS' ? (
                <>
                  <span className="banner-phase-tag">
                    🛡️ DEFENDER CARDS (Player {defenderPlayer})
                  </span>
                  <span className="banner-divider">|</span>
                  <span>
                    <strong>Click</strong> a card to read it, or <strong>drag</strong> it onto a
                    hex. Global buffs also play if you release off the island.
                  </span>
                </>
              ) : (
                <>
                  <span className="banner-phase-tag">
                    🌀 KALIKASAN CARDS (Player {kalikasanPlayer})
                  </span>
                  <span className="banner-divider">|</span>
                  <span>
                    <strong>Click</strong> a card to read it, or <strong>drag</strong> it onto a
                    hex. Global disasters also play if you release off the island.
                  </span>
                </>
              )}
            </div>

            <button
              className="btn-primary sts-end-turn-btn"
              onClick={
                phase === 'DEFENDER_CARDS'
                  ? finishDefenderCardPhase
                  : finishKalikasanCardPhase
              }
            >
              {phase === 'DEFENDER_CARDS'
                ? 'End Phase → 🌀'
                : round === 5
                ? '🚨 Trigger SIGNAL 5!'
                : 'Resolve Round ⚡'}
            </button>
          </div>

          <div className="sts-fanned-hand-wrapper">
            <div className="sts-fanned-hand">
              {activeHand.map((handCard, idx) => {
                const cfg = ALL_CARDS[handCard.cardId];
                const isPlayableRole =
                  (phase === 'DEFENDER_CARDS' && cfg.category === 'BUFF') ||
                  (phase === 'KALIKASAN_CARDS' && cfg.category === 'DISASTER');
                const hasEnergy = activeEnergy >= cfg.cost;
                const canDrag = !handCard.played && isPlayableRole && hasEnergy;
                const isBeingDragged = Boolean(
                  dragCard?.uid === handCard.uid && dragCard.isDraggingActive
                );
                const isSpotlighted =
                  spotlightItem?.kind === 'HAND' && spotlightItem.uid === handCard.uid;
                const isHovered = hoveredCardUid === handCard.uid;

                // Fan math: center index of 5 cards is 2 (offset -2, -1, 0, +1, +2)
                const total = activeHand.length;
                const offset = idx - (total - 1) / 2;
                const angleDeg = offset * 6.0;
                const arcDropPx = Math.abs(offset) * 7 + offset * offset * 3.0;

                const transformStyle =
                  isBeingDragged || isSpotlighted
                    ? 'translateY(-55px) scale(1.12) rotate(0deg)'
                    : isHovered && !handCard.played
                    ? 'translateY(-48px) scale(1.16) rotate(0deg)'
                    : `translateY(${arcDropPx}px) rotate(${angleDeg}deg)`;

                const cardSpotlightData: SpotlightItem = {
                  kind: 'HAND',
                  uid: handCard.uid,
                  cardId: handCard.cardId,
                  canPlay: canDrag,
                  hasEnergy,
                  isCorrectRole: isPlayableRole,
                  alreadyPlayed: handCard.played,
                  currentEnergy: activeEnergy
                };

                return (
                  <div
                    key={handCard.uid}
                    className={`sts-card ${cfg.category.toLowerCase()} ${
                      !canDrag ? 'unplayable' : 'playable'
                    } ${handCard.played ? 'played-out' : ''} ${
                      isBeingDragged ? 'dragging-source' : ''
                    } ${isSpotlighted ? 'spotlight-active-source' : ''}`}
                    style={{
                      transform: transformStyle,
                      zIndex: isBeingDragged || isSpotlighted ? 60 : isHovered ? 50 : 10 + idx,
                      ...(cfg.category === 'BUFF' ? buffMarkStyle(cfg.badgeTint) : null)
                    }}
                    onPointerEnter={() => setHoveredCardUid(handCard.uid)}
                    onPointerLeave={() =>
                      setHoveredCardUid((prev) => (prev === handCard.uid ? null : prev))
                    }
                    onPointerDown={(e) => {
                      if (handCard.played) return;
                      e.preventDefault();
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const startX = rect.left + rect.width / 2;
                      const startY = rect.top + 30;
                      armDrag({
                        mode: 'HAND_CARD',
                        uid: handCard.uid,
                        cardId: handCard.cardId,
                        name: cfg.name,
                        icon: cfg.icon,
                        cost: cfg.cost,
                        targetMode: cfg.targetMode,
                        accentColor: cfg.category === 'DISASTER' ? '#f43f5e' : '#2dd4bf',
                        canDrag,
                        isDraggingActive: false,
                        spotlightItem: cardSpotlightData,
                        startX,
                        startY,
                        currX: e.clientX,
                        currY: e.clientY
                      });
                    }}
                  >
                    {/* Top-Left Energy Cost Badge */}
                    <div
                      className={`sts-cost-gem ${
                        cfg.category === 'DISASTER' ? 'disaster-gem' : 'buff-gem'
                      } ${!hasEnergy ? 'no-energy' : ''}`}
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

                    {/* Centered Card Title */}
                    <div className="sts-card-banner">{cfg.name}</div>

                    {/* Illustrated Vector Diorama Art Window */}
                    <div className="sts-card-art">
                      <CardIllustration id={cfg.id} />
                    </div>

                    {/* Card Effect Text Box */}
                    <div className="sts-card-body">
                      <p>{cfg.description}</p>
                    </div>

                    {/* Bottom Glowing Category Pill */}
                    <div
                      className={`sts-card-pill-btn ${
                        cfg.category === 'DISASTER' ? 'disaster-pill' : 'buff-pill'
                      }`}
                    >
                      {handCard.played
                        ? '✓ PLAYED'
                        : !isPlayableRole
                        ? `🔒 ${cfg.badge ?? cfg.category}`
                        : !hasEnergy
                        ? 'LOW ENERGY'
                        : cfg.badge ?? cfg.category}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* PHASE 4: RESOLVE PHASE SUMMARY OVERLAY */}
      {phase === 'RESOLVE' && (
        <footer className="hud-bottom-dock resolve-dock">
          <div className="resolve-summary-box">
            <div className="resolve-header">
              <h4>
                📋 Round {round} Resolution &amp; Rescue Report (Buffs → Disasters → Rescue)
              </h4>
              <button className="btn-primary btn-large" onClick={advanceFromResolve}>
                {round < 5
                  ? `Proceed to Round ${round + 1} →`
                  : half === 1
                  ? 'View Half-Time Score & Swap Roles →'
                  : 'View Final Match Results 🏆'}
              </button>
            </div>
            <ul className="resolve-log-list">
              {roundLogs.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </footer>
      )}
    </div>
  );
};
