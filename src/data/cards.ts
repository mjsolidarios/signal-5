import { BuffCardId, CardConfig, CardId, DisasterCardId } from '../logic/types';

export const DISASTER_CARDS: Record<DisasterCardId, CardConfig> = {
  CAMPFIRE: {
    id: 'CAMPFIRE',
    name: 'Campfire',
    category: 'DISASTER',
    cost: 1,
    targetMode: 'TILE',
    icon: '🔥',
    pagasaCode: 'HEAT-1',
    description: 'Ignites fire on 1 target hex (1 dmg). Spreads to adjacent wood hexes (6 directions) next round.'
  },
  INFERNO: {
    id: 'INFERNO',
    name: 'Inferno',
    category: 'DISASTER',
    cost: 3,
    targetMode: 'TILE_3X3',
    icon: '🌋',
    pagasaCode: 'FIRE-3',
    description: 'Ignites target hex + its 6 hex neighbors (7-hex cluster) for 2 fire damage (doubled on wood).'
  },
  MODERATE_RAIN: {
    id: 'MODERATE_RAIN',
    name: 'Moderate Rain',
    category: 'DISASTER',
    cost: 1,
    targetMode: 'EDGE_TILE',
    icon: '🌦️',
    pagasaCode: 'YELLOW RAINFALL',
    description: 'Extinguishes small fires across the map; floods 1 low south-east coastal edge hex (1 flood damage).'
  },
  DOWNPOUR: {
    id: 'DOWNPOUR',
    name: 'Downpour',
    category: 'DISASTER',
    cost: 3,
    targetMode: 'GLOBAL',
    icon: '🌧️',
    pagasaCode: 'ORANGE RAINFALL',
    description:
      'Floods 2 hex rows inland from the south-east sea edges unless blocked by Flood Walls; disables unpowered buildings.'
  },
  STRONG_GALE: {
    id: 'STRONG_GALE',
    name: 'Strong Gale',
    category: 'DISASTER',
    cost: 2,
    targetMode: 'GLOBAL',
    icon: '💨',
    pagasaCode: 'TCWS #1',
    description:
      'Spreads all active fires 1 hex downwind (in the forecasted wind direction) and deals 1 wind damage to wood buildings.'
  },
  TYPHOON_SIGNAL_3: {
    id: 'TYPHOON_SIGNAL_3',
    name: 'Typhoon Signal 3',
    category: 'DISASTER',
    cost: 5,
    targetMode: 'GLOBAL',
    icon: '🌀',
    pagasaCode: 'TCWS #3',
    description: 'Deals 2 damage to all non-upgraded buildings and floods the south-east coastal edge hexes.'
  }
};

export const BUFF_CARDS: Record<BuffCardId, CardConfig> = {
  EARTHQUAKE_FIRE_DRILL: {
    id: 'EARTHQUAKE_FIRE_DRILL',
    name: 'Earthquake/Fire Drill',
    category: 'BUFF',
    cost: 1,
    targetMode: 'GLOBAL',
    icon: '📢',
    badge: 'DRILL',
    badgeTint: '#f59e0b',
    description: 'Residents evacuate 1 turn faster (extends rescue range by +1 hex this round).'
  },
  TREE_PLANTING: {
    id: 'TREE_PLANTING',
    name: 'Tree Planting',
    category: 'BUFF',
    cost: 2,
    targetMode: 'GLOBAL',
    icon: '🌳',
    badge: 'GROVE',
    badgeTint: '#22c55e',
    description: 'Mangrove & upland reforestation: reduces flood spread depth by 1 hex this round.'
  },
  RELIEF_GOODS: {
    id: 'RELIEF_GOODS',
    name: 'Relief Goods',
    category: 'BUFF',
    cost: 2,
    targetMode: 'GLOBAL',
    icon: '📦',
    badge: 'RELIEF',
    badgeTint: '#ea580c',
    description: 'Repairs 2 HP split across your most damaged buildings.'
  },
  FEEDING_PROGRAM: {
    id: 'FEEDING_PROGRAM',
    name: 'Feeding Program',
    category: 'BUFF',
    cost: 1,
    targetMode: 'GLOBAL',
    icon: '🍲',
    badge: 'MEAL',
    badgeTint: '#eab308',
    description: 'Community lugaw & hot meals: immediately adds +3 Food to barangay reserves.'
  },
  MASS_VACCINATION: {
    id: 'MASS_VACCINATION',
    name: 'Mass Vaccination',
    category: 'BUFF',
    cost: 2,
    targetMode: 'GLOBAL',
    icon: '💉',
    badge: 'VAX',
    badgeTint: '#06b6d4',
    description: 'Rescued residents fully recover and prevents flood-borne casualties this round.'
  },
  BAYANIHAN: {
    id: 'BAYANIHAN',
    name: 'Bayanihan',
    category: 'BUFF',
    cost: 3,
    targetMode: 'BUILDING_TILE',
    icon: '🤝',
    badge: 'BAYAN',
    badgeTint: '#e879f9',
    description: 'Repair one selected building to full HP and move up to 4 at-risk residents to safety.'
  }
};

export const ALL_CARDS: Record<CardId, CardConfig> = {
  ...DISASTER_CARDS,
  ...BUFF_CARDS
};

export const DISASTER_CARD_LIST: CardConfig[] = Object.values(DISASTER_CARDS);
export const BUFF_CARD_LIST: CardConfig[] = Object.values(BUFF_CARDS);

export const SUPER_TYPHOON_SIGNAL_5_INFO = {
  name: 'SUPER TYPHOON SIGNAL 5',
  pagasaCode: 'TCWS #5 (EXTREME THREAT)',
  description:
    'Catastrophic winds (>185 km/h) and storm surge: 3 damage to non-upgraded buildings, 1 damage to upgraded buildings, floods 3 hex rows from the south-east sea edges unless blocked by Flood Walls, and residents not in Hall, Clinic, or Upgraded Housing are at risk!'
};
