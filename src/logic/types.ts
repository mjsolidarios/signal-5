// Pure TypeScript types for Signal 5 game data and deterministic hex-grid rules

export type PlayerId = 'A' | 'B';
export type Role = 'DEFENDER' | 'KALIKASAN';

export type BuildingType =
  | 'BARANGAY_HALL'
  | 'HOUSING'
  | 'FARM'
  | 'SUBSTATION'
  | 'FIRE_STATION'
  | 'CLINIC'
  | 'FLOOD_WALL';

export interface BuildingConfig {
  type: BuildingType;
  name: string;
  filipinoSub: string;
  cost: number;
  upgradeCost: number;
  baseHp: number;
  upgradedHp: number;
  isWoodWhenBase: boolean; // Wood (nipa) buildings take double fire damage unless upgraded to concrete
  requiresPower: boolean;
  providesPower: boolean;
  residentsCapacity: number;
  foodPerRound: number;
  blocksFlood: boolean;
  effectRadius: number;
  description: string;
  icon: string;
}

export type DisasterCardId =
  | 'CAMPFIRE'
  | 'INFERNO'
  | 'MODERATE_RAIN'
  | 'DOWNPOUR'
  | 'STRONG_GALE'
  | 'TYPHOON_SIGNAL_3';

export type BuffCardId =
  | 'EARTHQUAKE_FIRE_DRILL'
  | 'TREE_PLANTING'
  | 'RELIEF_GOODS'
  | 'FEEDING_PROGRAM'
  | 'MASS_VACCINATION'
  | 'BAYANIHAN';

export type CardId = DisasterCardId | BuffCardId;
export type CardCategory = 'DISASTER' | 'BUFF';
export type TargetMode = 'TILE' | 'TILE_3X3' | 'EDGE_TILE' | 'BUILDING_TILE' | 'GLOBAL';

export type HexDirectionId = 'E' | 'NE' | 'NW' | 'W' | 'SW' | 'SE';

export interface HexCoord {
  q: number;
  r: number;
}

export interface CardConfig {
  id: CardId;
  name: string;
  category: CardCategory;
  cost: number;
  targetMode: TargetMode;
  icon: string;
  pagasaCode?: string;
  /** Short unique field mark for buffs, shown on the card, HUD, and island. */
  badge?: string;
  badgeTint?: string;
  description: string;
}

export interface BuildingInstance {
  type: BuildingType;
  hp: number;
  maxHp: number;
  upgraded: boolean;
  residents: number;
  injuredResidents: number;
  disabledThisRound: boolean;
}

export interface TileState {
  q: number; // Axial coordinate q (-3..3)
  r: number; // Axial coordinate r (-3..3)
  coastalDepth: number; // 0 = this game's sea edge, 1 = one hex inland. Seeded per match.
  elevation: 'LOW' | 'NORMAL';
  building: BuildingInstance | null;
  onFire: boolean;
  fireIntensity: number; // 1 = small fire, 2 = intense fire
  flooded: boolean;
}

export interface PlayedCardAction {
  cardId: CardId;
  targetQ?: number;
  targetR?: number;
}

export interface ActiveRoundBuffs {
  evacuateFaster: boolean; // Earthquake/Fire Drill: +1 rescue radius & faster evacuation
  floodReduction: number; // Tree Planting: reduce flood spread depth by 1 hex
  vaccinated: boolean; // Mass Vaccination: rescued residents fully recover & gain protection
}

export type MedalTier = 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD';

export interface HalfScoreSummary {
  defenderPlayer: PlayerId;
  residentsAlive: number;
  totalResidentsCapacity: number;
  villageIntegrityPct: number;
  hallDestroyed: boolean;
  defenseScore: number;
  medal: MedalTier;
}

export interface VisualEffectState {
  fireBurstTiles: HexCoord[];
  rainLevel: 0 | 1 | 2 | 3; // 0 none, 1 moderate, 2 downpour/signal 3, 3 Signal 5
  windLevel: 0 | 1 | 2 | 3; // 0 calm, 1 gale, 2 signal 3, 3 Signal 5
  cameraShake: number; // 0 to 1
  signal5Active: boolean;
  bannerText: string | null;
}
