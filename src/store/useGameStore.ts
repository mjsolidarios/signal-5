import { create } from 'zustand';
import { soundFX } from '../audio/useSound';
import { BUDGET_PER_ROUND, BUILDINGS, STARTING_BUDGET } from '../data/buildings';
import { ALL_CARDS, BUFF_CARD_LIST, DISASTER_CARD_LIST } from '../data/cards';
import {
  cloneGrid,
  createBuildingInstance,
  createInitialGrid,
  getTile,
  rollBoardSeed,
  HEX_DIRECTION_LIST,
  isValidHex
} from '../logic/grid';
import { computeHalfScore, resolveRound } from '../logic/rules';
import {
  BuffCardId,
  BuildingInstance,
  BuildingType,
  CardId,
  DisasterCardId,
  HalfScoreSummary,
  HexCoord,
  HexDirectionId,
  PlayedCardAction,
  PlayerId,
  TileState,
  VisualEffectState
} from '../logic/types';

export type ScreenState = 'TITLE' | 'HOW_TO_PLAY' | 'DRAFT' | 'MATCH' | 'HALF_TIME' | 'RESULTS';

export type MatchPhase =
  | 'FORECAST'
  | 'DEFENDER_BUILD'
  | 'DEFENDER_CARDS'
  | 'PASS_DEVICE'
  | 'KALIKASAN_CARDS'
  | 'RESOLVE';

export interface PlayerDeck {
  disasters: DisasterCardId[]; // 6 cards
  buffs: BuffCardId[]; // 6 cards
}

export interface HandCard {
  uid: string;
  cardId: CardId;
  played: boolean;
}

interface BuildUndo {
  q: number;
  r: number;
  budgetRefund: number;
  previous: BuildingInstance | null;
}

interface GameStoreState {
  screen: ScreenState;
  howToPlayPage: number;

  // Draft state
  draftingPlayer: PlayerId;
  decks: Record<PlayerId, PlayerDeck>;

  // Match meta
  half: 1 | 2;
  round: number; // 1..5
  phase: MatchPhase;
  passTargetPlayer: PlayerId;
  passNextPhase: MatchPhase;

  // Roles per half: Half 1 => Defender: A, Kalikasan: B. Half 2 => Defender: B, Kalikasan: A
  defenderPlayer: PlayerId;
  kalikasanPlayer: PlayerId;

  // Hex Grid (37 tiles, radius 3) & resources
  grid: TileState[];
  /** Coastline seed for this match. Half 2 reuses it. */
  boardSeed: number;
  /** Bumps when a board is generated so the hexes play their rise again. */
  boardReveal: number;
  budget: number;
  food: number;
  energyDefender: number;
  energyKalikasan: number;
  destroyedMaxHpTotal: number;

  // Build selection & hex hover
  selectedBuildType: BuildingType | 'UPGRADE' | null;
  hoveredTile: HexCoord | null;

  // Hands: Defender draws 5 Buffs, Kalikasan draws 5 Disasters
  defenderHand: HandCard[];
  kalikasanHand: HandCard[];
  selectedHandCardUid: string | null;
  buildUndoStack: BuildUndo[];

  // Queued card plays for current round resolution
  defenderPlayedActions: PlayedCardAction[];
  kalikasanPlayedActions: PlayedCardAction[];

  // Public PAGASA Forecast queued disaster & wind direction (one of 6 hex directions)
  forecastDisasterId: DisasterCardId | 'SIGNAL_5';
  windDirection: HexDirectionId;

  // Resolution logs & 3D VFX
  roundLogs: string[];
  vfx: VisualEffectState;

  // Half scores
  half1Score: HalfScoreSummary | null;
  half2Score: HalfScoreSummary | null;

  // Actions
  setScreen: (screen: ScreenState) => void;
  setHowToPlayPage: (page: number) => void;
  toggleDraftCard: (cardId: CardId, action: 'ADD' | 'REMOVE') => void;
  quickFillDraftDeck: () => void;
  confirmDraft: () => void;

  startHalf: (halfNumber: 1 | 2) => void;
  acknowledgeForecast: () => void;
  selectBuildTool: (tool: BuildingType | 'UPGRADE' | null) => void;
  setHoveredTile: (coord: HexCoord | null) => void;
  selectHandCard: (uid: string | null) => void;
  onTileClick: (q: number, r: number) => void;
  playGlobalSelectedCard: () => void;

  undoLastBuild: () => void;
  finishDefenderBuildPhase: () => void;
  finishDefenderCardPhase: () => void;
  confirmPassDevice: () => void;
  finishKalikasanCardPhase: () => void;
  advanceFromResolve: () => void;
  rematch: () => void;
}

const DEFAULT_DECK: PlayerDeck = {
  disasters: DISASTER_CARD_LIST.map((c) => c.id as DisasterCardId),
  buffs: BUFF_CARD_LIST.map((c) => c.id as BuffCardId)
};

const openingBoardSeed = rollBoardSeed();

const INITIAL_VFX: VisualEffectState = {
  fireBurstTiles: [],
  rainLevel: 0,
  windLevel: 0,
  cameraShake: 0,
  signal5Active: false,
  bannerText: null
};

/**
 * Draws up to 5 cards from one role's pool.
 * Defender passes buffs. Kalikasan passes disasters, with the forecast card
 * guaranteed in hand when it is actually in the deck.
 */
export function drawRoleHand(
  pool: CardId[],
  seedOffset: number,
  guaranteed?: CardId
): HandCard[] {
  const bag = [...pool];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = bag[i];
    bag[i] = bag[j];
    bag[j] = swap;
  }

  const chosen: CardId[] = [];
  if (guaranteed && bag.includes(guaranteed)) {
    chosen.push(guaranteed);
    bag.splice(bag.indexOf(guaranteed), 1);
  }
  while (chosen.length < 5 && bag.length > 0) {
    const next = bag.shift();
    if (next) chosen.push(next);
  }

  return chosen.map((cardId, idx) => ({
    uid: `${cardId}-${seedOffset}-${idx}`,
    cardId,
    played: false
  }));
}

function pickForecastDisaster(deck: PlayerDeck, nextRound: number): DisasterCardId | 'SIGNAL_5' {
  if (nextRound >= 5) return 'SIGNAL_5';
  const idx = (nextRound * 2 - 1) % deck.disasters.length;
  return deck.disasters[idx] || 'DOWNPOUR';
}

function pickWindDirection(half: number, round: number): HexDirectionId {
  // Deterministic rotation across the 6 hex directions (preferring inland/crosswind gusts)
  const order: HexDirectionId[] = ['NW', 'W', 'NE', 'SW', 'E', 'SE'];
  return order[(half * 3 + round) % order.length];
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  screen: 'TITLE',
  howToPlayPage: 0,

  draftingPlayer: 'A',
  decks: {
    A: { disasters: [...DEFAULT_DECK.disasters], buffs: [...DEFAULT_DECK.buffs] },
    B: { disasters: [...DEFAULT_DECK.disasters], buffs: [...DEFAULT_DECK.buffs] }
  },

  half: 1,
  round: 1,
  phase: 'FORECAST',
  passTargetPlayer: 'A',
  passNextPhase: 'DEFENDER_BUILD',

  defenderPlayer: 'A',
  kalikasanPlayer: 'B',

  grid: createInitialGrid(openingBoardSeed),
  boardSeed: openingBoardSeed,
  boardReveal: 1,
  budget: STARTING_BUDGET,
  food: 4,
  energyDefender: 4,
  energyKalikasan: 4,
  destroyedMaxHpTotal: 0,

  selectedBuildType: null,
  hoveredTile: null,

  defenderHand: [],
  kalikasanHand: [],
  selectedHandCardUid: null,
  buildUndoStack: [],

  defenderPlayedActions: [],
  kalikasanPlayedActions: [],

  forecastDisasterId: 'CAMPFIRE',
  windDirection: 'NW',
  roundLogs: [
    'Welcome to Barangay Pag-asa! Build defenses on the 37-hex island and protect residents across 5 rounds.'
  ],
  vfx: { ...INITIAL_VFX },

  half1Score: null,
  half2Score: null,

  setScreen: (screen) => {
    soundFX.startMusicLoop();
    set({ screen });
  },

  setHowToPlayPage: (howToPlayPage) => set({ howToPlayPage }),

  toggleDraftCard: (cardId, action) => {
    const state = get();
    const p = state.draftingPlayer;
    const currentDeck = state.decks[p];
    const cfg = ALL_CARDS[cardId];

    if (cfg.category === 'DISASTER') {
      const list = [...currentDeck.disasters];
      if (action === 'ADD') {
        const countOfThis = list.filter((id) => id === cardId).length;
        if (list.length < 6 && countOfThis < 2) {
          list.push(cardId as DisasterCardId);
          soundFX.playCard();
        }
      } else {
        const idx = list.indexOf(cardId as DisasterCardId);
        if (idx !== -1) {
          list.splice(idx, 1);
          soundFX.playCard();
        }
      }
      set({
        decks: {
          ...state.decks,
          [p]: { ...currentDeck, disasters: list }
        }
      });
    } else {
      const list = [...currentDeck.buffs];
      if (action === 'ADD') {
        const countOfThis = list.filter((id) => id === cardId).length;
        if (list.length < 6 && countOfThis < 2) {
          list.push(cardId as BuffCardId);
          soundFX.playCard();
        }
      } else {
        const idx = list.indexOf(cardId as BuffCardId);
        if (idx !== -1) {
          list.splice(idx, 1);
          soundFX.playCard();
        }
      }
      set({
        decks: {
          ...state.decks,
          [p]: { ...currentDeck, buffs: list }
        }
      });
    }
  },

  quickFillDraftDeck: () => {
    const state = get();
    const p = state.draftingPlayer;
    soundFX.playBuild();
    set({
      decks: {
        ...state.decks,
        [p]: {
          disasters: [...DEFAULT_DECK.disasters],
          buffs: [...DEFAULT_DECK.buffs]
        }
      }
    });
  },

  confirmDraft: () => {
    const state = get();
    if (state.draftingPlayer === 'A') {
      soundFX.playBuild();
      set({ draftingPlayer: 'B' });
    } else {
      soundFX.playBuild();
      get().startHalf(1);
    }
  },

  startHalf: (halfNumber) => {
    const state = get();
    const defenderPlayer: PlayerId = halfNumber === 1 ? 'A' : 'B';
    const kalikasanPlayer: PlayerId = halfNumber === 1 ? 'B' : 'A';
    const defDeck = state.decks[defenderPlayer];
    const kalDeck = state.decks[kalikasanPlayer];
    const initialEnergy = Math.min(7, 3 + 1); // Round 1 => 4 energy
    const boardSeed = halfNumber === 1 ? rollBoardSeed() : state.boardSeed;

    set({
      screen: 'MATCH',
      half: halfNumber,
      round: 1,
      phase: 'FORECAST',
      defenderPlayer,
      kalikasanPlayer,
      boardSeed,
      boardReveal: state.boardReveal + 1,
      grid: createInitialGrid(boardSeed),
      budget: STARTING_BUDGET,
      food: 4,
      energyDefender: initialEnergy,
      energyKalikasan: initialEnergy,
      destroyedMaxHpTotal: 0,
      selectedBuildType: null,
      selectedHandCardUid: null,
      buildUndoStack: [],
      defenderHand: drawRoleHand(defDeck.buffs, halfNumber * 10 + 1),
      kalikasanHand: drawRoleHand(kalDeck.disasters, halfNumber * 20 + 1),
      defenderPlayedActions: [],
      kalikasanPlayedActions: [],
      forecastDisasterId: pickForecastDisaster(kalDeck, 2),
      windDirection: pickWindDirection(halfNumber, 1),
      roundLogs: [
        `Half ${halfNumber} Begins! Player ${defenderPlayer} is Barangay Captain (Defender); Player ${kalikasanPlayer} is Kalikasan.`,
        ...(halfNumber === 1
          ? ['The south-east beach was cut new for this game, and the nipa huts found a new terrace.']
          : [])
      ],
      vfx: { ...INITIAL_VFX }
    });
  },

  acknowledgeForecast: () => {
    soundFX.playCard();
    set({
      phase: 'DEFENDER_BUILD',
      selectedBuildType: null,
      selectedHandCardUid: null
    });
  },

  selectBuildTool: (tool) => {
    if (tool) soundFX.playCard();
    set({ selectedBuildType: tool, selectedHandCardUid: null });
  },

  setHoveredTile: (coord) => set({ hoveredTile: coord }),

  selectHandCard: (uid) => {
    if (uid) soundFX.playCard();
    set({ selectedHandCardUid: uid, selectedBuildType: null });
  },

  playGlobalSelectedCard: () => {
    const state = get();
    if (!state.selectedHandCardUid) return;

    if (state.phase === 'DEFENDER_CARDS') {
      const cardObj = state.defenderHand.find((c) => c.uid === state.selectedHandCardUid);
      if (!cardObj || cardObj.played) return;
      const cfg = ALL_CARDS[cardObj.cardId];
      if (cfg.category !== 'BUFF' || state.energyDefender < cfg.cost) return;

      soundFX.playCard();
      set({
        energyDefender: state.energyDefender - cfg.cost,
        defenderHand: state.defenderHand.map((c) =>
          c.uid === cardObj.uid ? { ...c, played: true } : c
        ),
        defenderPlayedActions: [...state.defenderPlayedActions, { cardId: cardObj.cardId }],
        selectedHandCardUid: null,
        roundLogs: [
          `${cfg.icon} Queued Buff: ${cfg.name}.`,
          ...state.roundLogs.slice(0, 6)
        ]
      });
    } else if (state.phase === 'KALIKASAN_CARDS') {
      const cardObj = state.kalikasanHand.find((c) => c.uid === state.selectedHandCardUid);
      if (!cardObj || cardObj.played) return;
      const cfg = ALL_CARDS[cardObj.cardId];
      if (cfg.category !== 'DISASTER' || state.energyKalikasan < cfg.cost) return;

      soundFX.playCard();
      set({
        energyKalikasan: state.energyKalikasan - cfg.cost,
        kalikasanHand: state.kalikasanHand.map((c) =>
          c.uid === cardObj.uid ? { ...c, played: true } : c
        ),
        kalikasanPlayedActions: [...state.kalikasanPlayedActions, { cardId: cardObj.cardId }],
        selectedHandCardUid: null,
        roundLogs: [
          `${cfg.icon} Queued Disaster: ${cfg.name}.`,
          ...state.roundLogs.slice(0, 6)
        ]
      });
    }
  },

  onTileClick: (q, r) => {
    const state = get();
    if (!isValidHex(q, r)) return;

    // 1. DEFENDER BUILD PHASE: place or upgrade building by dropping a Blueprint Card on hex (q, r)
    if (state.phase === 'DEFENDER_BUILD') {
      const tool = state.selectedBuildType;
      if (!tool) return;
      const grid = cloneGrid(state.grid);
      const tile = getTile(grid, q, r);
      if (!tile) {
        set({ selectedBuildType: null });
        return;
      }

      if (tool === 'UPGRADE') {
        if (!tile.building || tile.building.upgraded) {
          set({ selectedBuildType: null });
          return;
        }
        const upCost = BUILDINGS[tile.building.type].upgradeCost;
        if (state.budget < upCost) {
          set({ selectedBuildType: null });
          return;
        }

        const previous = { ...tile.building };
        tile.building.upgraded = true;
        tile.building.maxHp = BUILDINGS[tile.building.type].upgradedHp;
        tile.building.hp = tile.building.maxHp;
        soundFX.playBuild();
        set({
          grid,
          budget: state.budget - upCost,
          selectedBuildType: null,
          buildUndoStack: [
            ...state.buildUndoStack,
            { q, r, budgetRefund: upCost, previous }
          ],
          roundLogs: [
            `Upgraded ${BUILDINGS[tile.building.type].name} at hex (${q}, ${r}) to 5 HP Concrete!`,
            ...state.roundLogs.slice(0, 6)
          ]
        });
        return;
      }

      // Place new building on empty hex tile
      if (tile.building) {
        set({ selectedBuildType: null });
        return;
      }
      const cfg = BUILDINGS[tool];
      if (state.budget < cfg.cost) {
        set({ selectedBuildType: null });
        return;
      }

      tile.building = createBuildingInstance(tool);
      soundFX.playBuild();
      set({
        grid,
        budget: state.budget - cfg.cost,
        selectedBuildType: null,
        buildUndoStack: [
          ...state.buildUndoStack,
          { q, r, budgetRefund: cfg.cost, previous: null }
        ],
        roundLogs: [
          `Constructed ${cfg.name} at hex (${q}, ${r}) (-${cfg.cost} Budget).`,
          ...state.roundLogs.slice(0, 6)
        ]
      });
      return;
    }

    // 2. DEFENDER CARD PHASE: play dragged Buff card on hex (q, r)
    if (state.phase === 'DEFENDER_CARDS' && state.selectedHandCardUid) {
      const cardObj = state.defenderHand.find((c) => c.uid === state.selectedHandCardUid);
      if (!cardObj || cardObj.played) return;
      const cfg = ALL_CARDS[cardObj.cardId];
      if (cfg.category !== 'BUFF' || state.energyDefender < cfg.cost) return;
      if (cfg.targetMode === 'BUILDING_TILE') {
        const live = getTile(state.grid, q, r);
        if (!live?.building || live.building.hp <= 0) {
          set({
            selectedHandCardUid: null,
            roundLogs: [
              `${cfg.icon} ${cfg.name} needs a standing building. The card was not spent.`,
              ...state.roundLogs.slice(0, 6)
            ]
          });
          return;
        }
      }

      soundFX.playCard();
      set({
        energyDefender: state.energyDefender - cfg.cost,
        defenderHand: state.defenderHand.map((c) =>
          c.uid === cardObj.uid ? { ...c, played: true } : c
        ),
        defenderPlayedActions: [
          ...state.defenderPlayedActions,
          { cardId: cardObj.cardId, targetQ: q, targetR: r }
        ],
        selectedHandCardUid: null,
        roundLogs: [
          `${cfg.icon} Queued Buff: ${cfg.name} at hex (${q}, ${r}).`,
          ...state.roundLogs.slice(0, 6)
        ]
      });
      return;
    }

    // 3. KALIKASAN CARD PHASE: play dragged Disaster card on hex (q, r)
    if (state.phase === 'KALIKASAN_CARDS' && state.selectedHandCardUid) {
      const cardObj = state.kalikasanHand.find((c) => c.uid === state.selectedHandCardUid);
      if (!cardObj || cardObj.played) return;
      const cfg = ALL_CARDS[cardObj.cardId];
      if (cfg.category !== 'DISASTER' || state.energyKalikasan < cfg.cost) return;

      soundFX.playCard();
      set({
        energyKalikasan: state.energyKalikasan - cfg.cost,
        kalikasanHand: state.kalikasanHand.map((c) =>
          c.uid === cardObj.uid ? { ...c, played: true } : c
        ),
        kalikasanPlayedActions: [
          ...state.kalikasanPlayedActions,
          { cardId: cardObj.cardId, targetQ: q, targetR: r }
        ],
        selectedHandCardUid: null,
        roundLogs: [
          `${cfg.icon} Queued Disaster: ${cfg.name} targeting hex (${q}, ${r})!`,
          ...state.roundLogs.slice(0, 6)
        ]
      });
    }
  },

  undoLastBuild: () => {
    const state = get();
    if (state.phase !== 'DEFENDER_BUILD' || state.buildUndoStack.length === 0) return;
    const stack = [...state.buildUndoStack];
    const entry = stack.pop();
    if (!entry) return;
    const grid = cloneGrid(state.grid);
    const tile = getTile(grid, entry.q, entry.r);
    if (!tile) return;
    tile.building = entry.previous ? { ...entry.previous } : null;
    soundFX.playCard();
    set({
      grid,
      budget: state.budget + entry.budgetRefund,
      buildUndoStack: stack,
      selectedBuildType: null,
      roundLogs: [
        `Undid the last build at hex (${entry.q}, ${entry.r}) (+${entry.budgetRefund} Budget).`,
        ...state.roundLogs.slice(0, 6)
      ]
    });
  },

  finishDefenderBuildPhase: () => {
    soundFX.playCard();
    set({
      phase: 'DEFENDER_CARDS',
      selectedBuildType: null,
      selectedHandCardUid: null,
      buildUndoStack: []
    });
  },

  finishDefenderCardPhase: () => {
    const state = get();
    soundFX.playCard();
    set({
      phase: 'PASS_DEVICE',
      passTargetPlayer: state.kalikasanPlayer,
      passNextPhase: 'KALIKASAN_CARDS',
      selectedHandCardUid: null
    });
  },

  confirmPassDevice: () => {
    const state = get();
    soundFX.playCard();
    set({
      phase: state.passNextPhase,
      selectedHandCardUid: null
    });
  },

  finishKalikasanCardPhase: () => {
    const state = get();
    const result = resolveRound({
      grid: state.grid,
      food: state.food,
      round: state.round,
      windDirection: state.windDirection,
      defenderActions: state.defenderPlayedActions,
      kalikasanActions: state.kalikasanPlayedActions,
      priorDestroyedMaxHp: state.destroyedMaxHpTotal
    });

    if (state.round === 5) {
      soundFX.playSignal5Siren();
    } else if (result.vfx.fireBurstTiles.length > 0) {
      soundFX.playFire();
    } else if (result.vfx.rainLevel > 0) {
      soundFX.playRain();
    } else {
      soundFX.playRescue();
    }

    set({
      phase: 'RESOLVE',
      grid: result.grid,
      food: result.food,
      destroyedMaxHpTotal: result.destroyedMaxHpTotal,
      roundLogs: result.logs.length > 0 ? result.logs : ['Calm weather held across the barangay.'],
      vfx: result.vfx,
      selectedHandCardUid: null
    });
  },

  advanceFromResolve: () => {
    const state = get();
    if (state.round >= 5) {
      const score = computeHalfScore(state.grid, state.defenderPlayer, state.destroyedMaxHpTotal);
      soundFX.playRescue();
      if (state.half === 1) {
        set({
          half1Score: score,
          screen: 'HALF_TIME',
          vfx: { ...INITIAL_VFX }
        });
      } else {
        set({
          half2Score: score,
          screen: 'RESULTS',
          vfx: { ...INITIAL_VFX }
        });
      }
      return;
    }

    const nextRound = state.round + 1;
    const nextEnergy = Math.min(7, 3 + nextRound);
    const defDeck = state.decks[state.defenderPlayer];
    const kalDeck = state.decks[state.kalikasanPlayer];
    const guaranteed =
      state.forecastDisasterId !== 'SIGNAL_5' ? state.forecastDisasterId : undefined;

    soundFX.playCard();
    set({
      round: nextRound,
      phase: 'PASS_DEVICE',
      passTargetPlayer: state.defenderPlayer,
      passNextPhase: 'FORECAST',
      budget: state.budget + BUDGET_PER_ROUND,
      energyDefender: nextEnergy,
      energyKalikasan: nextEnergy,
      defenderHand: drawRoleHand(defDeck.buffs, state.half * 10 + nextRound),
      kalikasanHand: drawRoleHand(kalDeck.disasters, state.half * 20 + nextRound, guaranteed),
      defenderPlayedActions: [],
      kalikasanPlayedActions: [],
      forecastDisasterId: pickForecastDisaster(kalDeck, nextRound + 1),
      windDirection: pickWindDirection(state.half, nextRound),
      vfx: { ...INITIAL_VFX }
    });
  },

  rematch: () => {
    soundFX.playBuild();
    set({
      screen: 'DRAFT',
      draftingPlayer: 'A',
      half1Score: null,
      half2Score: null,
      vfx: { ...INITIAL_VFX }
    });
  }
}));
