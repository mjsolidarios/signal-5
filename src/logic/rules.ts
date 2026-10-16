import { BUILDINGS } from '../data/buildings';
import {
  cloneGrid,
  formatHexCoord,
  getCoastalDepth,
  getHexCluster,
  getHexNeighbors,
  getTile,
  HEX_DIRECTIONS,
  hexDistance,
  isValidHex
} from './grid';
import {
  ActiveRoundBuffs,
  BuildingInstance,
  HalfScoreSummary,
  HexDirectionId,
  MedalTier,
  PlayedCardAction,
  PlayerId,
  TileState,
  VisualEffectState
} from './types';

export function isBuildingWood(b: BuildingInstance): boolean {
  const cfg = BUILDINGS[b.type];
  return cfg.isWoodWhenBase && !b.upgraded;
}

export function isGridPowered(grid: TileState[]): boolean {
  for (const tile of grid) {
    const b = tile.building;
    if (b && b.type === 'SUBSTATION' && b.hp > 0 && !b.disabledThisRound) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if hex (q, r) is within 2 hexes (hexDistance <= 2) of an active, powered Fire Station.
 */
export function isProtectedByFireStation(grid: TileState[], q: number, r: number): boolean {
  if (!isGridPowered(grid)) return false;
  for (const tile of grid) {
    const b = tile.building;
    if (b && b.type === 'FIRE_STATION' && b.hp > 0 && !b.disabledThisRound) {
      if (hexDistance(q, r, tile.q, tile.r) <= BUILDINGS.FIRE_STATION.effectRadius) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Checks if hex (q, r) is within 2 hexes (+ bonusRadius) of an active, powered Clinic or Fire Station.
 */
export function canRescueFromTile(
  grid: TileState[],
  q: number,
  r: number,
  bonusRadius = 0
): boolean {
  if (!isGridPowered(grid)) return false;
  for (const tile of grid) {
    const b = tile.building;
    if (!b || b.hp <= 0 || b.disabledThisRound) continue;
    if (b.type === 'CLINIC' || b.type === 'FIRE_STATION') {
      const radius = BUILDINGS[b.type].effectRadius + bonusRadius;
      if (hexDistance(q, r, tile.q, tile.r) <= radius) {
        return true;
      }
    }
  }
  return false;
}

export function countTotalResidents(grid: TileState[]): number {
  let total = 0;
  for (const tile of grid) {
    if (tile.building && tile.building.hp > 0) {
      total += tile.building.residents;
    }
  }
  return total;
}

/**
 * Same medal thresholds as the end-of-half score.
 * A fallen Barangay Hall caps the result at Silver.
 */
export function medalForIntegrity(integrityPct: number, hallDestroyed: boolean): MedalTier {
  if (integrityPct >= 90 && !hallDestroyed) return 'GOLD';
  if (integrityPct >= 75) return 'SILVER';
  if (integrityPct >= 50) return 'BRONZE';
  return 'NONE';
}

/**
 * Living HP divided by living max HP plus HP of buildings already destroyed.
 * `lostBuildingsMaxHp` is required so the live bar matches the half score:
 * a collapsed hut must lower integrity even after its mesh is gone.
 */
export function calculateVillageIntegrity(
  grid: TileState[],
  lostBuildingsMaxHp = 0
): {
  integrityPct: number;
  hallDestroyed: boolean;
} {
  let currentHp = 0;
  let denominator = lostBuildingsMaxHp;
  let hallAlive = false;

  for (const tile of grid) {
    const b = tile.building;
    if (!b) continue;
    denominator += b.maxHp;
    if (b.hp > 0) {
      currentHp += b.hp;
      if (b.type === 'BARANGAY_HALL') hallAlive = true;
    }
  }

  const integrityPct = denominator > 0 ? Math.round((currentHp / denominator) * 100) : 0;
  return {
    integrityPct: Math.max(0, Math.min(100, integrityPct)),
    hallDestroyed: !hallAlive
  };
}

export function computeHalfScore(
  grid: TileState[],
  defenderPlayer: PlayerId,
  lostBuildingsMaxHp = 0
): HalfScoreSummary {
  const residentsAlive = countTotalResidents(grid);
  let totalCapacity = 0;

  for (const tile of grid) {
    const b = tile.building;
    if (b && b.hp > 0) {
      totalCapacity += BUILDINGS[b.type].residentsCapacity;
    }
  }

  const { integrityPct: villageIntegrityPct, hallDestroyed } = calculateVillageIntegrity(
    grid,
    lostBuildingsMaxHp
  );
  const defenseScore = residentsAlive * 10 + villageIntegrityPct;
  const medal = medalForIntegrity(villageIntegrityPct, hallDestroyed);

  return {
    defenderPlayer,
    residentsAlive,
    totalResidentsCapacity: totalCapacity,
    villageIntegrityPct,
    hallDestroyed,
    defenseScore,
    medal
  };
}

/**
 * Moves up to `count` residents into safe shelters (Barangay Hall, powered Clinic, or Upgraded Housing).
 */
function moveResidentsToSafety(grid: TileState[], count: number): number {
  let remaining = count;
  const shelterTypes: Array<'BARANGAY_HALL' | 'CLINIC' | 'HOUSING'> = [
    'BARANGAY_HALL',
    'CLINIC',
    'HOUSING'
  ];

  for (const sType of shelterTypes) {
    for (const tile of grid) {
      if (remaining <= 0) return count;
      const b = tile.building;
      if (!b || b.hp <= 0 || b.type !== sType) continue;
      if (sType === 'HOUSING' && !b.upgraded) continue;
      const maxCap = BUILDINGS[b.type].residentsCapacity + (b.upgraded ? 2 : 0);
      const space = Math.max(0, maxCap - b.residents);
      if (space > 0) {
        const transfer = Math.min(remaining, space);
        b.residents += transfer;
        remaining -= transfer;
      }
    }
  }
  return count - remaining;
}

/**
 * Puts vaccinated residents into any standing Hall, Clinic, or upgraded house,
 * past normal capacity. Skips the building that is collapsing so they are not
 * stored on a tile that is about to be removed.
 */
function shelterOverflow(
  grid: TileState[],
  count: number,
  skipQ: number,
  skipR: number
): number {
  let remaining = count;
  for (const tile of grid) {
    if (remaining <= 0) break;
    if (tile.q === skipQ && tile.r === skipR) continue;
    const b = tile.building;
    if (!b || b.hp <= 0) continue;
    const safe =
      b.type === 'BARANGAY_HALL' ||
      b.type === 'CLINIC' ||
      (b.type === 'HOUSING' && b.upgraded);
    if (!safe) continue;
    b.residents += remaining;
    remaining = 0;
  }
  return count - remaining;
}

/**
 * Exposure during Signal 5, or a building that has already hit 0 HP.
 * Clinics and fire stations evacuate into spare shelter space.
 * Mass Vaccination prevents Signal 5 casualties: residents stay if the
 * building still stands, otherwise they overcrowd another safe building.
 * It does not protect against hunger or ordinary fire collapses.
 */
function resolveExposedResidents(
  grid: TileState[],
  tile: TileState,
  buffs: ActiveRoundBuffs,
  bonusRadius: number,
  logs: string[],
  cause: 'signal5' | 'collapse'
): void {
  const b = tile.building;
  if (!b || b.residents <= 0) return;

  if (canRescueFromTile(grid, tile.q, tile.r, bonusRadius)) {
    const rescued = moveResidentsToSafety(grid, b.residents);
    if (rescued > 0) {
      b.residents -= rescued;
      logs.push(
        `🚑 Evacuated ${rescued} resident(s) from ${formatHexCoord(tile)} during ${
          cause === 'signal5' ? 'Signal 5' : 'the collapse'
        }.`
      );
    }
  }

  if (b.residents <= 0) return;

  if (cause === 'signal5' && buffs.vaccinated) {
    if (b.hp <= 0) {
      const sheltered = shelterOverflow(grid, b.residents, tile.q, tile.r);
      b.residents -= sheltered;
      if (sheltered > 0) {
        logs.push(
          `💉 Vaccination sheltered ${sheltered} resident(s) from ${formatHexCoord(
            tile
          )} after the building failed.`
        );
      }
    } else {
      logs.push(
        `💉 ${b.residents} vaccinated resident(s) at ${formatHexCoord(
          tile
        )} weathered Signal 5 in place.`
      );
      return;
    }
  }

  if (b.residents > 0) {
    const lost = b.residents;
    b.residents = 0;
    logs.push(
      cause === 'collapse'
        ? `💔 ${lost} resident(s) lost when ${BUILDINGS[b.type].name} at ${formatHexCoord(
            tile
          )} collapsed.`
        : `⚠️ ${lost} resident(s) in an unreinforced structure at ${formatHexCoord(
            tile
          )} were lost in Signal 5.`
    );
  }
}

function applyFireDamageToHex(
  grid: TileState[],
  q: number,
  r: number,
  baseFireDmg: number
): number {
  const tile = getTile(grid, q, r);
  if (!tile) return 0;

  tile.onFire = true;
  tile.fireIntensity = Math.max(tile.fireIntensity, baseFireDmg >= 2 ? 2 : 1);
  tile.flooded = false;

  const b = tile.building;
  if (!b || b.hp <= 0) return 0;

  let dmg = isBuildingWood(b) ? baseFireDmg * 2 : baseFireDmg;
  if (isProtectedByFireStation(grid, q, r)) {
    dmg = Math.max(0, dmg - 1);
  }
  b.hp = Math.max(0, b.hp - dmg);
  return dmg;
}

/**
 * Checks if `tile` is shielded from the South-East sea surge by a surviving Flood Wall.
 * A Flood Wall at W shields T if W is seaward of (or equal to) T along a shortest hex geodesic
 * from the South-East sea edges: W.coastalDepth + hexDistance(W, T) === T.coastalDepth.
 */
export function isShieldedByFloodWall(grid: TileState[], tile: TileState): boolean {
  for (const w of grid) {
    if (
      w.building &&
      w.building.type === 'FLOOD_WALL' &&
      w.building.hp > 0 &&
      w.coastalDepth <= tile.coastalDepth
    ) {
      const dist = hexDistance(w.q, w.r, tile.q, tile.r);
      if (w.coastalDepth + dist === tile.coastalDepth) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Spreads coastal flood water from the two South-East sea edges up to `maxRows` hexes inland,
 * blocked by Flood Walls.
 */
function floodFromSeaEdges(
  grid: TileState[],
  maxRows: number,
  floodDamage: number,
  logs: string[]
): void {
  if (maxRows <= 0) {
    logs.push('🌳 Tree Planting & mangroves absorbed the coastal surge!');
    return;
  }

  let floodedCount = 0;
  let blockedCount = 0;

  for (const tile of grid) {
    if (tile.coastalDepth < maxRows) {
      if (isShieldedByFloodWall(grid, tile)) {
        blockedCount++;
        continue;
      }
      tile.flooded = true;
      tile.onFire = false;
      tile.fireIntensity = 0;
      floodedCount++;
      if (tile.building && tile.building.hp > 0 && floodDamage > 0) {
        tile.building.hp = Math.max(0, tile.building.hp - floodDamage);
      }
    }
  }

  if (blockedCount > 0) {
    logs.push(`🧱 Flood Walls shielded ${blockedCount} hex(es) from the South-East surge!`);
  }
  if (floodedCount > 0) {
    logs.push(`🌊 South-East sea flooded ${floodedCount} hex(es) up to ${maxRows} ring(s) inland.`);
  }
}

export interface ResolveRoundInput {
  grid: TileState[];
  food: number;
  round: number;
  windDirection: HexDirectionId;
  defenderActions: PlayedCardAction[];
  kalikasanActions: PlayedCardAction[];
  priorDestroyedMaxHp: number;
}

export interface ResolveRoundOutput {
  grid: TileState[];
  food: number;
  destroyedMaxHpTotal: number;
  logs: string[];
  vfx: VisualEffectState;
}

/**
 * Pure deterministic round resolution on the radius-3 hexagonal board:
 * 1. Apply Defender Buff cards
 * 2. Spread pre-existing campfires to adjacent wood hexes (6 directions)
 * 3. Apply Kalikasan Disaster cards (using hex neighbors, SE sea flood, and forecasted wind direction)
 * 4. If Round 5, trigger SUPER TYPHOON SIGNAL 5 finale
 * 5. Rescue Phase: move residents from damaged/destroyed houses to Clinic/Hall if Clinic/Fire Station within 2 hexes
 * 6. Farm production & food consumption
 */
export function resolveRound(input: ResolveRoundInput): ResolveRoundOutput {
  const grid = cloneGrid(input.grid);
  let food = input.food;
  let destroyedMaxHpTotal = input.priorDestroyedMaxHp;
  const logs: string[] = [];

  const buffs: ActiveRoundBuffs = {
    evacuateFaster: false,
    floodReduction: 0,
    vaccinated: false
  };

  const vfx: VisualEffectState = {
    fireBurstTiles: [],
    rainLevel: 0,
    windLevel: 0,
    cameraShake: 0,
    signal5Active: input.round === 5,
    bannerText: null
  };

  // Clear temporary round disable flags and previous flood water before new round resolution
  for (const tile of grid) {
    tile.flooded = false;
    if (tile.building) {
      tile.building.disabledThisRound = false;
    }
  }

  // --- STEP 1: APPLY DEFENDER BUFFS ---
  for (const action of input.defenderActions) {
    switch (action.cardId) {
      case 'EARTHQUAKE_FIRE_DRILL': {
        buffs.evacuateFaster = true;
        logs.push(
          '📢 Earthquake/Fire Drill: Rescue range increased (+1 hex) & residents ready to evacuate!'
        );
        break;
      }
      case 'TREE_PLANTING': {
        buffs.floodReduction += 1;
        logs.push('🌳 Tree Planting: South-East flood surge depth reduced by 1 hex this round.');
        break;
      }
      case 'RELIEF_GOODS': {
        let pointsLeft = 2;
        const damaged: BuildingInstance[] = [];
        for (const tile of grid) {
          const b = tile.building;
          if (b && b.hp > 0 && b.hp < b.maxHp) {
            damaged.push(b);
          }
        }
        damaged.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
        for (const b of damaged) {
          if (pointsLeft <= 0) break;
          const heal = Math.min(pointsLeft, b.maxHp - b.hp);
          b.hp += heal;
          pointsLeft -= heal;
        }
        logs.push('📦 Relief Goods: Repaired up to 2 HP across damaged barangay structures.');
        break;
      }
      case 'FEEDING_PROGRAM': {
        food += 3;
        logs.push('🍲 Feeding Program: +3 Food added to barangay reserves.');
        break;
      }
      case 'MASS_VACCINATION': {
        buffs.vaccinated = true;
        for (const tile of grid) {
          if (tile.building) tile.building.injuredResidents = 0;
        }
        logs.push('💉 Mass Vaccination: All residents immunized against flood & storm hazards.');
        break;
      }
      case 'BAYANIHAN': {
        const tq = action.targetQ ?? 0;
        const tr = action.targetR ?? 0;
        const targetTile = isValidHex(tq, tr) ? getTile(grid, tq, tr) : undefined;
        let targetB = targetTile?.building ?? null;
        if (!targetB || targetB.hp <= 0) {
          for (const tile of grid) {
            const b = tile.building;
            if (b && b.hp > 0 && (!targetB || b.hp < targetB.hp)) {
              targetB = b;
            }
          }
        }
        if (targetB) {
          targetB.hp = targetB.maxHp;
        }
        // Evacuate up to 4 residents from vulnerable un-upgraded wood houses to Hall/Clinic
        let moved = 0;
        for (const tile of grid) {
          if (moved >= 4) break;
          const b = tile.building;
          if (b && b.type === 'HOUSING' && !b.upgraded && b.residents > 0) {
            const take = Math.min(4 - moved, b.residents);
            const actuallyMoved = moveResidentsToSafety(grid, take);
            b.residents -= actuallyMoved;
            moved += actuallyMoved;
          }
        }
        logs.push(
          `🤝 Bayanihan: Restored structure to full HP and moved ${moved} resident(s) to reinforced shelter!`
        );
        break;
      }
    }
  }

  // --- STEP 2: EXISTING CAMPFIRE SPREAD TO ADJACENT WOOD HEXES (6 DIRECTIONS) ---
  const preExistingFires = grid.filter((t) => t.onFire).map((t) => ({ q: t.q, r: t.r }));
  for (const pos of preExistingFires) {
    const neighbors = getHexNeighbors(grid, pos.q, pos.r);
    for (const n of neighbors) {
      if (n.building && n.building.hp > 0 && isBuildingWood(n.building) && !n.onFire) {
        applyFireDamageToHex(grid, n.q, n.r, 1);
        vfx.fireBurstTiles.push({ q: n.q, r: n.r });
        logs.push(
          `🔥 Unchecked fire spread to adjacent wood building at ${formatHexCoord(n)}!`
        );
      }
    }
  }

  // --- STEP 3: APPLY KALIKASAN DISASTER CARDS ---
  const windInfo = HEX_DIRECTIONS[input.windDirection];

  for (const action of input.kalikasanActions) {
    const tq = action.targetQ ?? 0;
    const tr = action.targetR ?? 0;

    switch (action.cardId) {
      case 'CAMPFIRE': {
        if (isValidHex(tq, tr)) {
          applyFireDamageToHex(grid, tq, tr, 1);
          vfx.fireBurstTiles.push({ q: tq, r: tr });
          logs.push(`🔥 Campfire ignited at hex (${tq}, ${tr})!`);
        }
        break;
      }
      case 'INFERNO': {
        if (isValidHex(tq, tr)) {
          const cluster = getHexCluster(grid, tq, tr);
          for (const hex of cluster) {
            applyFireDamageToHex(grid, hex.q, hex.r, 2);
            vfx.fireBurstTiles.push({ q: hex.q, r: hex.r });
          }
          vfx.cameraShake = Math.max(vfx.cameraShake, 0.35);
          logs.push(
            `🌋 Inferno scorched target hex (${tq}, ${tr}) and its ${cluster.length - 1} neighbors!`
          );
        }
        break;
      }
      case 'MODERATE_RAIN': {
        vfx.rainLevel = Math.max(vfx.rainLevel, 1) as 0 | 1 | 2 | 3;
        let extinguished = 0;
        for (const tile of grid) {
          if (tile.onFire && tile.fireIntensity <= 1) {
            tile.onFire = false;
            tile.fireIntensity = 0;
            extinguished++;
          }
        }
        // Flood 1 low South-East coastal edge tile
        let edgeTile = getTile(grid, tq, tr);
        if (!edgeTile || getCoastalDepth(edgeTile.q, edgeTile.r) !== 0) {
          // Snap to nearest coastal edge hex
          const coastalHexes = grid.filter((t) => t.coastalDepth === 0);
          coastalHexes.sort(
            (a, b) => hexDistance(tq, tr, a.q, a.r) - hexDistance(tq, tr, b.q, b.r)
          );
          edgeTile = coastalHexes[0];
        }
        if (edgeTile && buffs.floodReduction <= 0) {
          if (!isShieldedByFloodWall(grid, edgeTile)) {
            edgeTile.flooded = true;
            edgeTile.onFire = false;
            if (edgeTile.building && edgeTile.building.hp > 0) {
              edgeTile.building.hp = Math.max(0, edgeTile.building.hp - 1);
            }
          }
        }
        logs.push(
          `🌦️ Moderate Rain extinguished ${extinguished} small fire(s) and swelled SE edge hex ${
            edgeTile ? formatHexCoord(edgeTile) : ''
          }.`
        );
        break;
      }
      case 'DOWNPOUR': {
        vfx.rainLevel = Math.max(vfx.rainLevel, 2) as 0 | 1 | 2 | 3;
        const rowsToFlood = Math.max(0, 2 - buffs.floodReduction);
        floodFromSeaEdges(grid, rowsToFlood, 1, logs);

        if (!isGridPowered(grid)) {
          for (const tile of grid) {
            const b = tile.building;
            if (b && BUILDINGS[b.type].requiresPower) {
              b.disabledThisRound = true;
            }
          }
          logs.push('🌧️ Downpour disabled unpowered Clinics & Fire Stations!');
        }
        break;
      }
      case 'STRONG_GALE': {
        vfx.windLevel = Math.max(vfx.windLevel, 1) as 0 | 1 | 2 | 3;
        vfx.cameraShake = Math.max(vfx.cameraShake, 0.25);

        // Spread all active fires 1 hex in the forecasted wind direction
        const activeFireCoords = grid.filter((t) => t.onFire).map((t) => ({ q: t.q, r: t.r }));
        for (const f of activeFireCoords) {
          const nq = f.q + windInfo.dq;
          const nr = f.r + windInfo.dr;
          if (isValidHex(nq, nr)) {
            applyFireDamageToHex(grid, nq, nr, 1);
            vfx.fireBurstTiles.push({ q: nq, r: nr });
          }
        }

        // 1 wind damage to all wood buildings
        let woodHit = 0;
        for (const tile of grid) {
          const b = tile.building;
          if (b && b.hp > 0 && isBuildingWood(b)) {
            b.hp = Math.max(0, b.hp - 1);
            woodHit++;
          }
        }
        logs.push(
          `💨 Strong Gale (${windInfo.arrow} ${windInfo.name}) blew fires downwind and battered ${woodHit} wood structure(s)!`
        );
        break;
      }
      case 'TYPHOON_SIGNAL_3': {
        vfx.rainLevel = Math.max(vfx.rainLevel, 2) as 0 | 1 | 2 | 3;
        vfx.windLevel = Math.max(vfx.windLevel, 2) as 0 | 1 | 2 | 3;
        vfx.cameraShake = Math.max(vfx.cameraShake, 0.6);

        for (const tile of grid) {
          const b = tile.building;
          if (b && b.hp > 0 && !b.upgraded) {
            b.hp = Math.max(0, b.hp - 2);
          }
        }
        const rowsToFlood = Math.max(0, 1 - buffs.floodReduction);
        floodFromSeaEdges(grid, rowsToFlood, 1, logs);
        logs.push(
          '🌀 Typhoon Signal 3 dealt 2 damage to all non-upgraded buildings and surged onto the SE coast!'
        );
        break;
      }
    }
  }

  // --- STEP 4: ROUND 5 FORCED FINALE — SUPER TYPHOON SIGNAL 5 ---
  if (input.round === 5) {
    vfx.rainLevel = 3;
    vfx.windLevel = 3;
    vfx.cameraShake = 1.0;
    vfx.signal5Active = true;
    vfx.bannerText = 'PAGASA EXTREME WARNING: SUPER TYPHOON SIGNAL NO. 5 LANDFALL!';

    logs.push(
      '🚨 SUPER TYPHOON SIGNAL 5 MAKES LANDFALL! Catastrophic winds & 3-ring storm surge hit the barangay!'
    );

    // 3 damage to non-upgraded buildings, 1 damage to upgraded ones
    for (const tile of grid) {
      const b = tile.building;
      if (b && b.hp > 0) {
        const dmg = b.upgraded ? 1 : 3;
        b.hp = Math.max(0, b.hp - dmg);
      }
    }

    // Floods 3 hex rows from the South-East sea edges unless blocked by Flood Walls
    const rowsToFlood = Math.max(0, 3 - buffs.floodReduction);
    floodFromSeaEdges(grid, rowsToFlood, 1, logs);

    // Residents not in Hall, Clinic, or an upgraded house are at risk.
    // Unupgraded 3 HP buildings are already at 0 HP from the damage above.
    const bonusRadius = buffs.evacuateFaster ? 1 : 0;
    for (const tile of grid) {
      const b = tile.building;
      if (!b || b.residents <= 0) continue;
      const isSafeStructure =
        b.hp > 0 &&
        (b.type === 'BARANGAY_HALL' ||
          b.type === 'CLINIC' ||
          (b.type === 'HOUSING' && b.upgraded));

      if (!isSafeStructure) {
        resolveExposedResidents(grid, tile, buffs, bonusRadius, logs, 'signal5');
      }
    }
  }

  // --- STEP 5: RESCUE PHASE & DESTROYED BUILDING CLEANUP ---
  const bonusRadius = buffs.evacuateFaster ? 1 : 0;
  for (const tile of grid) {
    const b = tile.building;
    if (!b) continue;

    const isDamagedOrDestroyed =
      b.hp < b.maxHp || b.hp <= 0 || tile.onFire || tile.flooded;
    if (b.type === 'HOUSING' && b.residents > 0 && isDamagedOrDestroyed) {
      if (canRescueFromTile(grid, tile.q, tile.r, bonusRadius)) {
        const rescued = moveResidentsToSafety(grid, b.residents);
        if (rescued > 0) {
          b.residents -= rescued;
          logs.push(
            `🏥 Rescued ${rescued} resident(s) from damaged house at ${formatHexCoord(
              tile
            )} to Clinic/Hall!`
          );
        }
      }
    }

    if (b.hp <= 0) {
      // Fires, floods, and gales. Signal 5 exposure already ran; this only
      // catches residents still standing on the rubble.
      if (b.residents > 0) {
        resolveExposedResidents(grid, tile, buffs, bonusRadius, logs, 'collapse');
      }
      logs.push(`💥 ${BUILDINGS[b.type].name} at ${formatHexCoord(tile)} was destroyed.`);
      destroyedMaxHpTotal += b.maxHp;
      tile.building = null;
      tile.onFire = false;
      tile.fireIntensity = 0;
    }
  }

  // --- STEP 6: FARM PRODUCTION & FOOD UPKEEP ---
  let farmFood = 0;
  for (const tile of grid) {
    const b = tile.building;
    if (b && b.hp > 0 && b.type === 'FARM') {
      farmFood += BUILDINGS.FARM.foodPerRound;
    }
  }
  if (farmFood > 0) {
    food += farmFood;
    logs.push(`🌾 Palay Farms harvested +${farmFood} Food.`);
  }

  const totalResidents = countTotalResidents(grid);
  // Card text: 1 food feeds up to 4 residents. An empty barangay eats nothing.
  const foodNeeded = totalResidents <= 0 ? 0 : Math.ceil(totalResidents / 4);
  if (foodNeeded > 0 && food >= foodNeeded) {
    food -= foodNeeded;
    logs.push(
      `🍚 Community consumed ${foodNeeded} Food (1 per 4 residents, ${food} remaining).`
    );
  } else if (foodNeeded > 0) {
    food = 0;
    for (const tile of grid) {
      const b = tile.building;
      if (b && b.residents > 0) {
        b.residents -= 1;
        logs.push(
          '⚠️ Food shortage! 1 resident left the barangay. Build Farms or play Feeding Program.'
        );
        break;
      }
    }
  }

  return {
    grid,
    food,
    destroyedMaxHpTotal,
    logs,
    vfx
  };
}
