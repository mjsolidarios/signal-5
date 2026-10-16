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
 * Canonical distance from the two fixed South-East sea edges.
 * Procedural boards store their own coastalDepth; this is the uncut shelf.
 * Edge A: q + r = 3. Edge B: r = 3.
 */
export function getCoastalDepth(q: number, r: number): number {
  return HEX_RADIUS - Math.max(q + r, r);
}

/** Deterministic 0..1 RNG. One instance per generation pass. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rollBoardSeed(): number {
  const seed = Math.floor(Math.random() * 0x7fffffff);
  return seed === 0 ? 1 : seed;
}

export function mixHash(q: number, r: number, seed: number): number {
  let h = (seed ^ Math.imul(q, 374761393) ^ Math.imul(r, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Prism height for a land hex. Sea edge and lowland stay on fixed steps so
 * flood rows read clearly. Inland terraces grow an occasional knoll.
 */
export function tilePrismHeight(
  coastalDepth: number,
  q: number,
  r: number,
  seed: number
): number {
  const base = coastalDepth === 0 ? 0.16 : coastalDepth === 1 ? 0.2 : 0.24;
  if (coastalDepth < 3) return base;
  return mixHash(q, r, seed) % 5 === 0 ? 0.3 : base;
}

export interface SeaHexSpec {
  q: number;
  r: number;
  ring: 4 | 5;
  x: number;
  z: number;
  phase: number;
}

export interface BoardCoast {
  seed: number;
  sources: { q: number; r: number }[];
  seaHexes: SeaHexSpec[];
}

/** Pointy-top hex ring, walked clockwise from the south-west corner. */
function hexRing(radius: number): { q: number; r: number }[] {
  const dirs: [number, number][] = [
    [1, 0],
    [1, -1],
    [0, -1],
    [-1, 0],
    [-1, 1],
    [0, 1]
  ];
  let q = dirs[4][0] * radius;
  let r = dirs[4][1] * radius;
  const arc: { q: number; r: number }[] = [];
  for (let edge = 0; edge < 6; edge++) {
    for (let step = 0; step < radius; step++) {
      arc.push({ q, r });
      q += dirs[edge][0];
      r += dirs[edge][1];
    }
  }
  return arc;
}

function depthFromSources(
  q: number,
  r: number,
  sources: { q: number; r: number }[]
): number {
  let best = Infinity;
  for (const source of sources) {
    if (source.q === q && source.r === r) continue;
    const dist = hexDistance(q, r, source.q, source.r);
    if (dist < best) best = dist;
  }
  return best - 1;
}

/**
 * Ordered south-east surf, from the south-west shoulder to the east corner.
 * Index of the south corner (0, 4) is 1.
 */
function southEastSurf(): { q: number; r: number }[] {
  const arc: { q: number; r: number }[] = [{ q: -4, r: 3 }];
  for (let q = -4; q <= 0; q++) arc.push({ q, r: 4 });
  for (let q = 1; q <= 4; q++) arc.push({ q, r: 4 - q });
  return arc;
}

/**
 * South-east coast for one match. A seeded window on the south-east shore
 * lengthens or shortens the beach, and always keeps the south corner wet.
 * Sources stay off the land, so the hall remains outside the 3-row surge.
 * Depth is distance to that water, so a flood wall on a shortest path still
 * shields the tiles behind it.
 */
export function boardCoastFromSeed(seed: number): BoardCoast {
  const rng = mulberry32(seed >>> 0);
  const arc = southEastSurf();
  const corner = arc.findIndex((hex) => hex.q === 0 && hex.r === 4);
  const length = 6 + Math.floor(rng() * 4);
  const minStart = Math.max(0, corner - (length - 1));
  const maxStart = Math.min(corner, arc.length - length);
  const span = Math.max(1, maxStart - minStart + 1);
  const start = minStart + Math.floor(rng() * span);
  const sources = arc.slice(start, start + length);

  const deepHexes = hexRing(5).filter(
    (hex) =>
      hex.r >= 0 &&
      sources.some((source) => hexDistance(hex.q, hex.r, source.q, source.r) === 1)
  );
  deepHexes.sort((a, b) => {
    const [ax, az] = axialToWorld(a.q, a.r);
    const [bx, bz] = axialToWorld(b.q, b.r);
    return Math.atan2(az, ax) - Math.atan2(bz, bx);
  });

  const seaHexes: SeaHexSpec[] = [];
  for (const hex of [...sources, ...deepHexes]) {
    const [x, z] = axialToWorld(hex.q, hex.r);
    seaHexes.push({
      q: hex.q,
      r: hex.r,
      ring: hexDistance(hex.q, hex.r, 0, 0) >= 5 ? 5 : 4,
      x,
      z,
      phase: hex.q * 0.75 + hex.r * 1.15
    });
  }

  return { seed, sources, seaHexes };
}

/** Place the bangka on the middle of this game's shallow surf, parallel to the shore. */
export function boatAnchor(coast: BoardCoast): { x: number; z: number; yaw: number } {
  const surf = coast.seaHexes.filter((hex) => hex.ring === 4);
  const index = Math.floor(surf.length / 2);
  const mid = surf[index] ?? coast.seaHexes[0];
  const prev = surf[Math.max(0, index - 1)] ?? mid;
  const next = surf[Math.min(surf.length - 1, index + 1)] ?? mid;
  const dx = next.x - prev.x;
  const dz = next.z - prev.z;
  // Hull long axis is local +X. rotation.y sends local +X to (cos yaw, 0, -sin yaw).
  const yaw = Math.atan2(-dz, dx);
  // Sit just off the sand, inboard of the surf hex, so the hull clears the build bar.
  const span = Math.hypot(mid.x, mid.z) || 1;
  const pull = 0.9;
  return { x: mid.x - (mid.x / span) * pull, z: mid.z - (mid.z / span) * pull, yaw };
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
 * Fresh radius-3 barangay (37 land tiles) for one match seed.
 * Hall stays at the plaza, outside the 3-row surge. The two nipa huts land
 * on a safe terrace that changes with the coastline. The same seed always
 * rebuilds the same shore.
 */
export function createInitialGrid(seed: number): TileState[] {
  const coast = boardCoastFromSeed(seed);
  const tiles: TileState[] = [];
  for (let r = -HEX_RADIUS; r <= HEX_RADIUS; r++) {
    for (let q = -HEX_RADIUS; q <= HEX_RADIUS; q++) {
      if (!isValidHex(q, r)) continue;
      const coastalDepth = depthFromSources(q, r, coast.sources);
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

  const center = getTile(tiles, 0, 0);
  if (center) {
    center.building = createBuildingInstance('BARANGAY_HALL', 2);
  }

  const rng = mulberry32((seed ^ 0x85ebca6b) >>> 0);
  const spots = tiles.filter(
    (tile) =>
      !(tile.q === 0 && tile.r === 0) &&
      tile.coastalDepth >= 2 &&
      hexDistance(tile.q, tile.r, 0, 0) <= 2
  );
  const safest = spots.reduce((min, tile) => Math.min(min, tile.coastalDepth), Infinity);
  const band = spots.filter((tile) => tile.coastalDepth === safest);
  for (let i = band.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const swap = band[i];
    band[i] = band[j];
    band[j] = swap;
  }
  const chosen = band.slice(0, 2);
  if (chosen.length < 2) {
    for (const tile of spots) {
      if (chosen.length >= 2) break;
      if (!chosen.includes(tile)) chosen.push(tile);
    }
  }
  for (const hut of chosen) {
    hut.building = createBuildingInstance('HOUSING', 4);
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
