import { BuildingConfig, BuildingType } from '../logic/types';

export const STARTING_BUDGET = 10;
export const BUDGET_PER_ROUND = 4;
export const DEFAULT_UPGRADE_COST = 2;

export const BUILDINGS: Record<BuildingType, BuildingConfig> = {
  BARANGAY_HALL: {
    type: 'BARANGAY_HALL',
    name: 'Barangay Hall',
    filipinoSub: 'Bulwagang Barangay',
    cost: 0, // Pre-placed in center
    upgradeCost: 2,
    baseHp: 3,
    upgradedHp: 5,
    isWoodWhenBase: false,
    requiresPower: false,
    providesPower: false,
    residentsCapacity: 6, // Can shelter evacuated residents
    foodPerRound: 0,
    blocksFlood: false,
    effectRadius: 2,
    description:
      'Command center & evacuation shelter. Pre-placed in center. If destroyed, maximum medal is capped at Silver.',
    icon: '🏛️'
  },
  HOUSING: {
    type: 'HOUSING',
    name: 'Housing',
    filipinoSub: 'Bahay Kubo / Concrete House',
    cost: 2,
    upgradeCost: 2,
    baseHp: 3,
    upgradedHp: 5,
    isWoodWhenBase: true, // Nipa hut when base (double fire damage); Concrete with terracotta roof when upgraded
    requiresPower: false,
    providesPower: false,
    residentsCapacity: 4,
    foodPerRound: 0,
    blocksFlood: false,
    effectRadius: 0,
    description:
      'Holds 4 residents. Base Nipa Hut (wood) takes 2x fire damage. Upgrade to Concrete (5 HP) to resist fire and Signal 5.',
    icon: '🏠'
  },
  FARM: {
    type: 'FARM',
    name: 'Palay Farm',
    filipinoSub: 'Sakahan',
    cost: 2,
    upgradeCost: 2,
    baseHp: 3,
    upgradedHp: 5,
    isWoodWhenBase: true,
    requiresPower: false,
    providesPower: false,
    residentsCapacity: 0,
    foodPerRound: 2,
    blocksFlood: false,
    effectRadius: 0,
    description:
      'Produces +2 Food per round. Food keeps residents alive each round (1 food feeds up to 4 residents).',
    icon: '🌾'
  },
  SUBSTATION: {
    type: 'SUBSTATION',
    name: 'Power Substation',
    filipinoSub: 'Istasyon ng Kuryente',
    cost: 3,
    upgradeCost: 2,
    baseHp: 3,
    upgradedHp: 5,
    isWoodWhenBase: false,
    requiresPower: false,
    providesPower: true,
    residentsCapacity: 0,
    foodPerRound: 0,
    blocksFlood: false,
    effectRadius: 8, // Powers the barangay grid while standing
    description:
      'Supplies grid electricity. At least 1 active Substation is required for Clinics and Fire Stations to operate.',
    icon: '⚡'
  },
  FIRE_STATION: {
    type: 'FIRE_STATION',
    name: 'Fire Station',
    filipinoSub: 'Bumbero (BFP)',
    cost: 3,
    upgradeCost: 2,
    baseHp: 3,
    upgradedHp: 5,
    isWoodWhenBase: false,
    requiresPower: true,
    providesPower: false,
    residentsCapacity: 0,
    foodPerRound: 0,
    blocksFlood: false,
    effectRadius: 2,
    description:
      'Requires Power. Reduces fire damage by 1 and helps rescue residents from damaged houses within 2 tiles.',
    icon: '🚒'
  },
  CLINIC: {
    type: 'CLINIC',
    name: 'Health Clinic',
    filipinoSub: 'Barangay Health Center',
    cost: 3,
    upgradeCost: 2,
    baseHp: 3,
    upgradedHp: 5,
    isWoodWhenBase: false,
    requiresPower: true,
    providesPower: false,
    residentsCapacity: 4,
    foodPerRound: 0,
    blocksFlood: false,
    effectRadius: 2,
    description:
      'Requires Power. Heals and rescues residents from damaged houses within 2 tiles into safe shelter.',
    icon: '🏥'
  },
  FLOOD_WALL: {
    type: 'FLOOD_WALL',
    name: 'Flood Wall / Drainage',
    filipinoSub: 'Dike at Esteros',
    cost: 1,
    upgradeCost: 2,
    baseHp: 3,
    upgradedHp: 5,
    isWoodWhenBase: false,
    requiresPower: false,
    providesPower: false,
    residentsCapacity: 0,
    foodPerRound: 0,
    blocksFlood: true,
    effectRadius: 0,
    description:
      'Concrete seawall & drainage channel. Blocks coastal flood surges from spreading inland down its column.',
    icon: '🧱'
  }
};

export const BUILDABLE_TYPES: BuildingType[] = [
  'HOUSING',
  'FARM',
  'SUBSTATION',
  'FIRE_STATION',
  'CLINIC',
  'FLOOD_WALL'
];
