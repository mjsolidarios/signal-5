import { BUILDINGS } from '../data/buildings';
import { BuildingInstance, BuildingType, HexCoord, HexDirectionId, TileState } from './types';

export const HEX_RADIUS = 3; // 37 tiles total
export const HEX_SIZE = 0.68; // World center-to-vertex spacing for pointy-top hexes

export interface HexDirectionInfo {
  id: HexDirectionId;
  name: string;
  shortLabel: string;
  arrow: string;
  dq: number;
  dr: number;
  angleRad: number;
}

/**
 * The 6 pointy-top axial neighbor directions.
 */
export const HEX_DIRECTIONS: Record<HexDirectionId, HexDirectionInfo> = {
  E: {
    id: 'E',
    name: 'East',
    shortLabel: 'E (+1, 0)',
    arrow: '→',
    dq: 1,
    dr: 0,
    angleRad: 0
  },
  NE: {
    id: 'NE',
    name: 'North-East',
    shortLabel: 'NE (+1, -1)',
    arrow: '↗',
    dq: 1,
    dr: -1,
    angleRad: -Math.PI / 3
  },
  NW: {
    id: 'NW',
    name: 'North-West',
    shortLabel: 'NW (0, -1)',
    arrow: '↖',
    dq: 0,
    dr: -1,
    angleRad: (-2 * Math.PI) / 3
  },
  W: {
    id: 'W',
    name: 'West',
    shortLabel: 'W (-1, 0)',
    arrow: '←',
    dq: -1,
    dr: 0,
    angleRad: Math.PI
  },
  SW: {
    id: 'SW',
    name: 'South-West',
    shortLabel: 'SW (-1, +1)',
    arrow: '↙',
    dq: -1,
    dr: 1,
    angleRad: (2 * Math.PI) / 3
  },
  SE: {
    id: 'SE',
    name: 'South-East',
    shortLabel: 'SE (0, +1)',
    arrow: '↘',
    dq: 0,
    dr: 1,
    angleRad: Math.PI / 3
  }
};

export const HEX_DIRECTION_LIST: HexDirectionInfo[] = Object.values(HEX_DIRECTIONS);

export function isValidHex(q: number, r: number): boolean {
  return (
    Math.abs(q) <= HEX_RADIUS &&
    Math.abs(r) <= HEX_RADIUS &&
    Math.abs(q + r) <= HEX_RADIUS
  );
}

export function hexDistance(q1: number, r1: number, q2: number, r2: number): number {
  return (
    (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs(q1 + r1 - (q2 + r2))) / 2
  );
}

/**
 * Converts pointy-top axial coordinates (q, r) to 3D world [x, z] coordinates.
 */
export function axialToWorld(q: number, r: number): [number, number] {
  const x = HEX_SIZE * Math.sqrt(3) * (q + r / 2);
  const z = HEX_SIZE * 1.5 * r;
  return [x, z];
}

/**
 * Converts 3D world (x, z) coordinates on the board plane to the nearest pointy-top axial hex (q, r).
 */
export function worldToAxial(x: number, z: number): HexCoord {
  const qFrac = ((Math.sqrt(3) / 3) * x - (1 / 3) * z) / HEX_SIZE;
  const rFrac = ((2 / 3) * z) / HEX_SIZE;
  const sFrac = -qFrac - rFrac;

  let q = Math.round(qFrac);
  let r = Math.round(rFrac);
  const s = Math.round(sFrac);

  const qDiff = Math.abs(q - qFrac);
  const rDiff = Math.abs(r - rFrac);
  const sDiff = Math.abs(s - sFrac);

  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s;
  } else if (rDiff > sDiff) {
    r = -q - s;
  }

  return { q, r };
}

/**
 * Computes hex distance from the two South-East sea edges:
 * Edge A: q + r = 3 (for q >= 0, r >= 0)
 * Edge B: r = 3 (for q <= 0)
 * Coastal sea edge tiles have coastalDepth === 0.
 */
export function getCoastalDepth(q: number, r: number): number {
  return HEX_RADIUS - Math.max(q + r, r);
}

export function isCoastalEdgeTile(q: number, r: number): boolean {
  return getCoastalDepth(q, r) === 0;
}

export function createBuildingInstance(
  type: BuildingType,
  initialResidents?: number
): BuildingInstance {
  const cfg = BUILDINGS[type];
  return {
    type,
    hp: cfg.baseHp,
    maxHp: cfg.baseHp,
    upgraded: false,
    residents:
      initialResidents !== undefined
        ? initialResidents
        : type === 'HOUSING'
        ? cfg.residentsCapacity
        : 0,
    injuredResidents: 0,
    disabledThisRound: false
  };
}

/**
 * Creates a fresh radius-3 hexagonal barangay board (37 tiles).
 * Barangay Hall is pre-placed at (0, 0), with two starter Nipa Huts nearby.
 */
export function createInitialGrid(): TileState[] {
  const tiles: TileState[] = [];
  for (let r = -HEX_RADIUS; r <= HEX_RADIUS; r++) {
    for (let q = -HEX_RADIUS; q <= HEX_RADIUS; q++) {
      if (!isValidHex(q, r)) continue;
      const coastalDepth = getCoastalDepth(q, r);
      tiles.push({
        q,
        r,
        coastalDepth,
        elevation: coastalDepth <= 1 ? 'LOW' : 'NORMAL',
        building: null,
        onFire: false,
        fireIntensity: 0,
        flooded: false
      });
    }
  }

  // Pre-place Barangay Hall at center (0, 0) with 2 barangay staff residents
  const center = getTile(tiles, 0, 0);
  if (center) {
    center.building = createBuildingInstance('BARANGAY_HALL', 2);
  }

  // Pre-place two starter Nipa Huts (4 residents each)
  const hut1 = getTile(tiles, -1, 1);
  if (hut1) {
    hut1.building = createBuildingInstance('HOUSING', 4);
  }
  const hut2 = getTile(tiles, 1, 0);
  if (hut2) {
    hut2.building = createBuildingInstance('HOUSING', 4);
  }

  return tiles;
}

export function cloneGrid(grid: TileState[]): TileState[] {
  return grid.map((tile) => ({
    ...tile,
    building: tile.building ? { ...tile.building } : null
  }));
}

export function getTile(grid: TileState[], q: number, r: number): TileState | undefined {
  return grid.find((t) => t.q === q && t.r === r);
}

/**
 * Returns the up to 6 adjacent hex neighbors of (q, r).
 */
export function getHexNeighbors(grid: TileState[], q: number, r: number): TileState[] {
  const res: TileState[] = [];
  for (const dir of HEX_DIRECTION_LIST) {
    const nq = q + dir.dq;
    const nr = r + dir.dr;
    if (isValidHex(nq, nr)) {
      const t = getTile(grid, nq, nr);
      if (t) res.push(t);
    }
  }
  return res;
}

/**
 * Returns the target tile (q, r) plus its 6 hex neighbors (up to 7 tiles) for Inferno.
 */
export function getHexCluster(grid: TileState[], q: number, r: number): TileState[] {
  return grid.filter((t) => hexDistance(q, r, t.q, t.r) <= 1);
}

export function formatHexCoord(coord: HexCoord | { q: number; r: number }): string {
  return `(${coord.q}, ${coord.r})`;
}
