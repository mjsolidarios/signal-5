import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { BUILDINGS } from '../data/buildings';
import { ALL_CARDS } from '../data/cards';
import {
  axialToWorld,
  boardCoastFromSeed,
  boatAnchor,
  getTile,
  hexDistance,
  isValidHex,
  mixHash,
  SeaHexSpec,
  tilePrismHeight,
  worldToAxial
} from '../logic/grid';
import { isGridPowered } from '../logic/rules';
import { useGameStore } from '../store/useGameStore';
import { BuildingRenderer, GhostBuildingPreview } from './Buildings';

/** Ease-out back. The overshoot is about a tenth of the rise, then it settles. */
function easeOutBack(t: number): number {
  const c1 = 2.5;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

const REVEAL_STAGGER = 0.014;
const REVEAL_DURATION = 0.18;
const REVEAL_DROP = 0.72;

function useHexReveal(revealKey: number, index: number, hold: boolean) {
  const ref = useRef<THREE.Group>(null);
  const ready = useRef(false);
  const start = useRef(0);
  const reduce = useRef(false);
  const holdRef = useRef(hold);
  holdRef.current = hold;

  useLayoutEffect(() => {
    reduce.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    ready.current = false;
    const group = ref.current;
    if (!group) return;
    if (reduce.current) {
      group.visible = true;
      group.position.y = 0;
      group.scale.setScalar(1);
      return;
    }
    group.visible = false;
    group.position.y = -REVEAL_DROP;
    group.scale.setScalar(0.94);
  }, [revealKey]);

  useFrame(({ clock }) => {
    const group = ref.current;
    if (!group) return;
    if (reduce.current) {
      group.visible = true;
      group.position.y = 0;
      group.scale.setScalar(1);
      return;
    }
    // The forecast bulletin covers the board. Stay hidden until it closes,
    // then rise, so the stagger plays on the open island.
    if (holdRef.current) {
      ready.current = false;
      group.visible = false;
      group.position.y = -REVEAL_DROP;
      group.scale.setScalar(0.94);
      return;
    }
    if (!ready.current) {
      start.current = clock.elapsedTime;
      ready.current = true;
    }
    const elapsed = clock.elapsedTime - start.current - index * REVEAL_STAGGER;
    if (elapsed <= 0) {
      group.visible = false;
      group.position.y = -REVEAL_DROP;
      group.scale.setScalar(0.94);
      return;
    }
    group.visible = true;
    const progress = Math.min(elapsed / REVEAL_DURATION, 1);
    const eased = easeOutBack(progress);
    group.position.y = (eased - 1) * REVEAL_DROP;
    const settle = Math.min(1, progress * 1.35);
    group.scale.setScalar(0.94 + 0.06 * settle);
  });

  return ref;
}

const RevealedHex: React.FC<{
  revealKey: number;
  index: number;
  hold: boolean;
  position: [number, number, number];
  children: React.ReactNode;
}> = ({ revealKey, index, hold, position, children }) => {
  const ref = useHexReveal(revealKey, index, hold);
  return (
    <group position={position}>
      <group ref={ref}>{children}</group>
    </group>
  );
};

/**
 * Animated Hexagonal Ocean Tile (interlocks with the pointy-top hex grid with zero z-fighting).
 * Ring 4 features a bright teal top + crisp white inner hex ring; Ring 5 features royal blue + deep navy sides.
 */
const OceanHexPrism: React.FC<{
  seaHex: SeaHexSpec;
  signal5Active: boolean;
  windSeverity: number;
}> = ({ seaHex, signal5Active, windSeverity }) => {
  const waterTopRef = useRef<THREE.Group>(null);
  const foamRingRef = useRef<THREE.Mesh>(null);

  const isShallow = seaHex.ring === 4;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const waveSpeed = 2.2 + windSeverity * 0.65;
    const waveAmp = (isShallow ? 0.026 : 0.04) * (signal5Active ? 1.8 : 1.0);
    const waveY = Math.sin(t * waveSpeed + seaHex.phase) * waveAmp;

    if (waterTopRef.current) {
      waterTopRef.current.position.y = waveY;
    }
    if (foamRingRef.current) {
      const s = 0.96 + Math.sin(t * waveSpeed + seaHex.phase) * 0.035;
      foamRingRef.current.scale.set(s, s, 1);
    }
  });

  const topCapColor = signal5Active
    ? isShallow
      ? '#0284c7'
      : '#0369a1'
    : isShallow
    ? '#14b8a6' // Vibrant coastal teal
    : '#0284c7'; // Rich deep royal blue

  const sideColumnColor = signal5Active
    ? '#0f172a'
    : isShallow
    ? '#0f766e'
    : '#1e3a8a'; // Deep navy cliff side on Ring 5

  return (
    <group position={[0, -0.06, 0]}>
      {/* Solid seabed column underneath each water hex so there are no transparent overlap seams */}
      <mesh position={[0, -0.34, 0]}>
        <cylinderGeometry args={[0.638, 0.61, 0.56, 6]} />
        <meshStandardMaterial color={sideColumnColor} flatShading roughness={0.82} />
      </mesh>

      {/* Animated bobbing water prism cap */}
      <group ref={waterTopRef}>
        <mesh position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.64, 0.64, 0.14, 6]} />
          <meshStandardMaterial
            color={sideColumnColor}
            roughness={0.28}
            metalness={0.1}
            flatShading
          />
        </mesh>

        {/* Distinct Flat-Shaded Top Water Plate */}
        <mesh position={[0, 0.052, 0]}>
          <cylinderGeometry args={[0.615, 0.63, 0.018, 6]} />
          <meshStandardMaterial
            color={topCapColor}
            roughness={0.16}
            metalness={0.08}
            flatShading
          />
        </mesh>

        {/* Crisp white inner hexagonal outline on Ring 4 shallow surf hexes */}
        {isShallow ? (
          <mesh
            ref={foamRingRef}
            position={[0, 0.064, 0]}
            rotation={[-Math.PI / 2, 0, Math.PI / 6]}
          >
            <ringGeometry args={[0.46, 0.535, 6]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.92}
              side={THREE.DoubleSide}
            />
          </mesh>
        ) : (
          <mesh
            position={[0, 0.063, 0]}
            rotation={[-Math.PI / 2, 0, Math.PI / 6]}
          >
            <ringGeometry args={[0.45, 0.51, 6]} />
            <meshBasicMaterial
              color="#38bdf8"
              transparent
              opacity={0.45}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>
    </group>
  );
};

/**
 * Animated Flood Water Cap rendered on flooded land hexes (no z-fighting).
 */
const FloodedHexOverlay: React.FC<{ tileHeight: number; seed: number }> = ({
  tileHeight,
  seed
}) => {
  const rippleRef = useRef<THREE.Mesh>(null);
  const waterRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (waterRef.current) {
      waterRef.current.position.y =
        tileHeight / 2 + 0.032 + Math.sin(t * 3.2 + seed) * 0.01;
    }
    if (rippleRef.current) {
      const pulse = 0.85 + Math.sin(t * 3.2 + seed) * 0.12;
      rippleRef.current.scale.set(pulse, pulse, 1);
    }
  });

  return (
    <group>
      {/* Translucent turquoise water layer hovering cleanly above the flooded hex */}
      <mesh ref={waterRef} position={[0, tileHeight / 2 + 0.032, 0]}>
        <cylinderGeometry args={[0.615, 0.625, 0.045, 6]} />
        <meshStandardMaterial
          color="#0ea5e9"
          emissive="#0284c7"
          emissiveIntensity={0.25}
          transparent
          opacity={0.78}
          depthWrite={false}
          roughness={0.15}
          flatShading
        />
      </mesh>

      {/* Hexagonal white ripple ring on the flood surface */}
      <mesh
        ref={rippleRef}
        position={[0, tileHeight / 2 + 0.058, 0]}
        rotation={[-Math.PI / 2, 0, Math.PI / 6]}
      >
        <ringGeometry args={[0.38, 0.45, 6]} />
        <meshBasicMaterial
          color="#e0f2fe"
          transparent
          opacity={0.85}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

/**
 * Natural 3D terrain details (low-poly volcanic rocks, pebbles, and grass blades) on empty hexes.
 */
const EmptyHexDecor: React.FC<{
  q: number;
  r: number;
  coastalDepth: number;
  tileHeight: number;
  seed: number;
}> = ({ q, r, coastalDepth, tileHeight, seed }) => {
  const hash = mixHash(q, r, seed) % 7;
  const topY = tileHeight / 2 + 0.012;

  if (coastalDepth === 0) {
    // Coastal sand pebbles / shells on a few beach hexes
    if (hash > 2) return null;
    return (
      <group position={[0.16, topY, -0.1]}>
        <mesh position={[0, 0.025, 0]} rotation={[0.2, hash, 0]}>
          <dodecahedronGeometry args={[0.055, 0]} />
          <meshStandardMaterial color="#94a3b8" flatShading />
        </mesh>
        <mesh position={[-0.08, 0.018, 0.06]}>
          <dodecahedronGeometry args={[0.038, 0]} />
          <meshStandardMaterial color="#cbd5e1" flatShading />
        </mesh>
      </group>
    );
  }

  // Inland / lowland grass tufts & volcanic rocks
  return (
    <group position={[0, topY, 0]}>
      {hash % 2 === 0 && (
        <group position={[-0.18, 0, 0.14]} rotation={[0, hash * 1.1, 0]}>
          <mesh position={[0, 0.04, 0]} rotation={[0, 0, 0.18]}>
            <coneGeometry args={[0.035, 0.09, 4]} />
            <meshStandardMaterial color="#15803d" flatShading />
          </mesh>
          <mesh position={[0.045, 0.035, 0.02]} rotation={[0, 0, -0.22]}>
            <coneGeometry args={[0.03, 0.075, 4]} />
            <meshStandardMaterial color="#16a34a" flatShading />
          </mesh>
        </group>
      )}
      {hash === 1 || hash === 4 ? (
        <group position={[0.18, 0, -0.14]} rotation={[0, hash * 0.8, 0]}>
          <mesh position={[0, 0.038, 0]}>
            <dodecahedronGeometry args={[0.068, 0]} />
            <meshStandardMaterial color="#64748b" flatShading />
          </mesh>
          <mesh position={[-0.065, 0.024, 0.045]}>
            <dodecahedronGeometry args={[0.045, 0]} />
            <meshStandardMaterial color="#94a3b8" flatShading />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};

/**
 * Low-poly tropical Coconut Palm Tree that sways with wind intensity.
 */
const PalmTree: React.FC<{
  position: [number, number, number];
  scale?: number;
  windLevel: number;
  seed: number;
}> = ({ position, scale = 1, windLevel, seed }) => {
  const crownRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (crownRef.current) {
      const t = clock.elapsedTime;
      const sway = (0.06 + windLevel * 0.14) * Math.sin(t * (2.5 + windLevel * 1.5) + seed);
      crownRef.current.rotation.z = sway;
      crownRef.current.rotation.x = sway * 0.6 + windLevel * 0.12;
    }
  });

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.18, 0]} rotation={[0.08, 0, -0.06]}>
        <cylinderGeometry args={[0.045, 0.07, 0.36, 5]} />
        <meshStandardMaterial color="#78350f" flatShading />
      </mesh>
      <group ref={crownRef} position={[-0.02, 0.34, 0.02]}>
        <mesh position={[0, 0.16, 0]} rotation={[0.14, 0, -0.1]}>
          <cylinderGeometry args={[0.032, 0.045, 0.34, 5]} />
          <meshStandardMaterial color="#854d0e" flatShading />
        </mesh>
        <mesh position={[0, 0.32, 0.04]}>
          <sphereGeometry args={[0.055, 5, 5]} />
          <meshStandardMaterial color="#451a03" flatShading />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i * Math.PI * 2) / 5 + seed;
          return (
            <group key={i} position={[0, 0.34, 0.04]} rotation={[0, angle, 0]}>
              <mesh position={[0.18, -0.03, 0]} rotation={[0, 0, -0.45]}>
                <boxGeometry args={[0.36, 0.025, 0.11]} />
                <meshStandardMaterial color="#15803d" flatShading />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
};

/**
 * Low-poly Philippine Bangka (outrigger fishing boat) bobbing on the South-East hex sea.
 */
const BangkaBoat: React.FC<{
  windLevel: number;
  anchor: { x: number; z: number; yaw: number };
}> = ({ windLevel, anchor }) => {
  const boatRef = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    boatRef.current?.traverse((obj) => {
      obj.raycast = () => {};
    });
  }, []);

  useFrame(({ clock }) => {
    if (boatRef.current) {
      const t = clock.elapsedTime;
      const amp = 0.032 + windLevel * 0.025;
      boatRef.current.position.y = 0.02 + Math.sin(t * 2.4 + 2.5) * amp;
      boatRef.current.rotation.z = Math.sin(t * 2.1) * (0.07 + windLevel * 0.06);
      boatRef.current.rotation.x = Math.cos(t * 1.8) * 0.05;
    }
  });

  return (
    <group ref={boatRef} position={[anchor.x, 0.02, anchor.z]} rotation={[0, anchor.yaw, 0]}>
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.82, 0.1, 0.2]} />
        <meshStandardMaterial color="#f8fafc" flatShading />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.86, 0.035, 0.22]} />
        <meshStandardMaterial color="#0284c7" flatShading />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.36, 0.1, 0.18]} />
        <meshStandardMaterial color="#f59e0b" flatShading />
      </mesh>
      <mesh position={[-0.2, 0.07, 0]}>
        <boxGeometry args={[0.025, 0.025, 0.68]} />
        <meshStandardMaterial color="#a16207" flatShading />
      </mesh>
      <mesh position={[0.2, 0.07, 0]}>
        <boxGeometry args={[0.025, 0.025, 0.68]} />
        <meshStandardMaterial color="#a16207" flatShading />
      </mesh>
      <mesh position={[0, 0.03, -0.33]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.76, 5]} />
        <meshStandardMaterial color="#fef08a" flatShading />
      </mesh>
      <mesh position={[0, 0.03, 0.33]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.76, 5]} />
        <meshStandardMaterial color="#fef08a" flatShading />
      </mesh>
    </group>
  );
};

/**
 * Surrounding Archipelagic Environment: Deep Ocean Backdrop, Sea Stacks/Islets,
 * Drifting Coastal Mist Clouds, and Gliding White Seagulls.
 */
const ArchipelagoBackdrop: React.FC<{ signal5Active: boolean; windSeverity: number }> = ({
  signal5Active,
  windSeverity
}) => {
  const cloudsRef = useRef<THREE.Group>(null);
  const gullsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = t * (0.025 + windSeverity * 0.02);
    }
    if (gullsRef.current) {
      gullsRef.current.rotation.y = -t * 0.32;
      gullsRef.current.position.y = 1.9 + Math.sin(t * 1.8) * 0.12;
    }
  });

  const seaStacks: Array<{ pos: [number, number, number]; scale: number; rot: number }> = [
    { pos: [-5.8, -0.45, 2.2], scale: 1.15, rot: 0.4 },
    { pos: [5.4, -0.45, -2.6], scale: 1.0, rot: 1.8 },
    { pos: [-4.6, -0.45, -4.4], scale: 0.9, rot: 2.5 },
    { pos: [-2.4, -0.45, 6.2], scale: 1.25, rot: 0.9 },
    { pos: [6.2, -0.45, 2.9], scale: 0.95, rot: 3.1 }
  ];

  return (
    <group>
      {/* Vast Deep Philippine Sea Plane beneath the hex island */}
      <mesh position={[0, -0.58, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[48, 48]} />
        <meshStandardMaterial
          color={signal5Active ? '#082f49' : '#0c4a6e'}
          roughness={0.65}
          flatShading
        />
      </mesh>

      {/* Subtle Outer Reef Ring around the island */}
      <mesh position={[0.4, -0.55, 0.4]} rotation={[-Math.PI / 2, 0, Math.PI / 6]}>
        <ringGeometry args={[5.4, 8.2, 6]} />
        <meshBasicMaterial
          color={signal5Active ? '#0369a1' : '#0284c7'}
          transparent
          opacity={0.32}
        />
      </mesh>

      {/* Rocky Sea Stacks & Islets with Greenery and Surf Rings */}
      {seaStacks.map((st, idx) => (
        <group key={idx} position={st.pos} scale={st.scale} rotation={[0, st.rot, 0]}>
          {/* White surf ring around the sea stack */}
          <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.55, 0.72, 6]} />
            <meshBasicMaterial color="#e0f2fe" transparent opacity={0.55} />
          </mesh>
          {/* Main Basalt Rock Spire */}
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.28, 0.56, 0.65, 6]} />
            <meshStandardMaterial color="#475569" flatShading roughness={0.9} />
          </mesh>
          {/* Secondary Rock Outcrop */}
          <mesh position={[0.32, 0.1, 0.18]} rotation={[0.1, 0.4, -0.15]}>
            <dodecahedronGeometry args={[0.28, 0]} />
            <meshStandardMaterial color="#64748b" flatShading roughness={0.9} />
          </mesh>
          {/* Lush Tropical Moss Cap */}
          <mesh position={[0, 0.56, 0]}>
            <cylinderGeometry args={[0.22, 0.29, 0.08, 6]} />
            <meshStandardMaterial color="#22c55e" flatShading />
          </mesh>
        </group>
      ))}

      {/* Soft Low-Poly Coastal Mist Clouds around the Horizon */}
      <group ref={cloudsRef} position={[0, 0.35, 0]}>
        {[
          [-6.2, 0.4, -1.5],
          [5.8, 0.55, -3.8],
          [-4.8, 0.3, 4.8],
          [6.5, 0.45, 4.2]
        ].map(([cx, cy, cz], i) => (
          <group key={i} position={[cx, cy, cz]} rotation={[0, i * 1.2, 0]}>
            <mesh position={[0, 0, 0]}>
              <dodecahedronGeometry args={[0.42, 0]} />
              <meshStandardMaterial
                color={signal5Active ? '#64748b' : '#f1f5f9'}
                transparent
                opacity={0.78}
                flatShading
              />
            </mesh>
            <mesh position={[0.34, -0.06, 0.1]}>
              <dodecahedronGeometry args={[0.3, 0]} />
              <meshStandardMaterial
                color={signal5Active ? '#64748b' : '#f8fafc'}
                transparent
                opacity={0.75}
                flatShading
              />
            </mesh>
            <mesh position={[-0.32, -0.08, -0.08]}>
              <dodecahedronGeometry args={[0.28, 0]} />
              <meshStandardMaterial
                color={signal5Active ? '#64748b' : '#e2e8f0'}
                transparent
                opacity={0.75}
                flatShading
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Gliding Low-Poly White Seagulls */}
      {!signal5Active && (
        <group ref={gullsRef} position={[0.8, 1.9, 1.2]}>
          {[0, 1, 2].map((g) => {
            const angle = (g * Math.PI * 2) / 3;
            const r = 3.2 + g * 0.45;
            return (
              <group
                key={g}
                position={[Math.cos(angle) * r, g * 0.15, Math.sin(angle) * r]}
                rotation={[0, -angle, 0]}
              >
                <mesh position={[-0.07, 0, 0]} rotation={[0, 0, 0.25]}>
                  <boxGeometry args={[0.15, 0.015, 0.05]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
                <mesh position={[0.07, 0, 0]} rotation={[0, 0, -0.25]}>
                  <boxGeometry args={[0.15, 0.015, 0.05]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              </group>
            );
          })}
        </group>
      )}
    </group>
  );
};

export const IslandBoard: React.FC = () => {
  const grid = useGameStore((s) => s.grid);
  const boardSeed = useGameStore((s) => s.boardSeed);
  const boardReveal = useGameStore((s) => s.boardReveal);
  const screen = useGameStore((s) => s.screen);
  const hoveredTile = useGameStore((s) => s.hoveredTile);
  const setHoveredTile = useGameStore((s) => s.setHoveredTile);
  const onTileClick = useGameStore((s) => s.onTileClick);
  const phase = useGameStore((s) => s.phase);
  const selectedBuildType = useGameStore((s) => s.selectedBuildType);
  const selectedHandCardUid = useGameStore((s) => s.selectedHandCardUid);
  const defenderHand = useGameStore((s) => s.defenderHand);
  const kalikasanHand = useGameStore((s) => s.kalikasanHand);
  const vfx = useGameStore((s) => s.vfx);

  const { camera, gl } = useThree();
  const powered = useMemo(() => isGridPowered(grid), [grid]);
  const coast = useMemo(() => boardCoastFromSeed(boardSeed), [boardSeed]);
  const seaHexes = coast.seaHexes;
  const anchor = useMemo(() => boatAnchor(coast), [coast]);
  const revealIndex = useMemo(() => {
    const map = new Map<string, number>();
    seaHexes.forEach((hex, index) => {
      map.set(`sea-${hex.q},${hex.r}`, index);
    });
    const land = [...grid].sort((a, b) => {
      if (a.coastalDepth !== b.coastalDepth) return a.coastalDepth - b.coastalDepth;
      const [ax, az] = axialToWorld(a.q, a.r);
      const [bx, bz] = axialToWorld(b.q, b.r);
      return Math.atan2(az, ax) - Math.atan2(bz, bx);
    });
    land.forEach((tile, index) => {
      map.set(`${tile.q},${tile.r}`, seaHexes.length + index);
    });
    return map;
  }, [grid, seaHexes]);
  const boatIndex = useMemo(() => {
    let best = 0;
    let bestDist = Infinity;
    seaHexes.forEach((hex, index) => {
      const dist = (hex.x - anchor.x) ** 2 + (hex.z - anchor.z) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        best = index;
      }
    });
    return best;
  }, [seaHexes, anchor]);
  // Hold the rise while the forecast bulletin covers the match board.
  const revealHold = screen === 'MATCH' && phase === 'FORECAST';

  const activeHand = phase === 'KALIKASAN_CARDS' ? kalikasanHand : defenderHand;
  const activeCardObj = activeHand.find((c) => c.uid === selectedHandCardUid);
  const activeCardCfg = activeCardObj ? ALL_CARDS[activeCardObj.cardId] : null;

  // Mathematical plane-intersection raycasting during any card drag (Build Blueprint or Hand Card)
  const isDraggingAnyCard = Boolean(selectedHandCardUid || selectedBuildType);
  useEffect(() => {
    if (!isDraggingAnyCard) return;

    const raycaster = new THREE.Raycaster();
    const boardPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.06);
    const hitPoint = new THREE.Vector3();
    const ndc = new THREE.Vector2();

    const handlePointerMove = (e: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.ray.intersectPlane(boardPlane, hitPoint);
      if (hit) {
        const axial = worldToAxial(hitPoint.x, hitPoint.z);
        if (isValidHex(axial.q, axial.r)) {
          setHoveredTile(axial);
          return;
        }
      }
      setHoveredTile(null);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [isDraggingAnyCard, camera, gl, setHoveredTile]);

  // Determine which coastal edge hex is closest when targeting EDGE_TILE (Moderate Rain)
  const closestCoastalHex = useMemo(() => {
    if (!hoveredTile || activeCardCfg?.targetMode !== 'EDGE_TILE') return null;
    const coastal = grid.filter((t) => t.coastalDepth === 0);
    coastal.sort(
      (a, b) =>
        hexDistance(hoveredTile.q, hoveredTile.r, a.q, a.r) -
        hexDistance(hoveredTile.q, hoveredTile.r, b.q, b.r)
    );
    return coastal[0] || null;
  }, [hoveredTile, activeCardCfg, grid]);

  const isTileHighlighted = (q: number, r: number): boolean => {
    if (!hoveredTile) return false;
    if (activeCardCfg?.targetMode === 'GLOBAL') {
      return true;
    }
    if (activeCardCfg?.targetMode === 'TILE_3X3') {
      return hexDistance(q, r, hoveredTile.q, hoveredTile.r) <= 1;
    }
    if (activeCardCfg?.targetMode === 'EDGE_TILE') {
      return closestCoastalHex ? closestCoastalHex.q === q && closestCoastalHex.r === r : false;
    }
    return hoveredTile.q === q && hoveredTile.r === r;
  };

  // Show 2-hex radius ring (hexDistance <= 2) when placing or hovering a Clinic, Fire Station, or Hall
  const isInsideRadiusPreview = (q: number, r: number): boolean => {
    if (!hoveredTile) return false;
    const hoveredTileObj = getTile(grid, hoveredTile.q, hoveredTile.r);
    const hoveredB = hoveredTileObj?.building;
    const checkType =
      phase === 'DEFENDER_BUILD' &&
      selectedBuildType &&
      selectedBuildType !== 'UPGRADE' &&
      !hoveredB
        ? selectedBuildType
        : hoveredB?.type;

    if (checkType === 'FIRE_STATION' || checkType === 'CLINIC' || checkType === 'BARANGAY_HALL') {
      const dist = hexDistance(q, r, hoveredTile.q, hoveredTile.r);
      return dist > 0 && dist <= BUILDINGS[checkType].effectRadius;
    }
    return false;
  };

  const windSeverity = vfx.signal5Active ? 3 : vfx.windLevel;

  return (
    <group>
      {/* Surrounding Ocean, Sea Stacks, Coastal Mist Clouds & Seagulls */}
      <ArchipelagoBackdrop signal5Active={vfx.signal5Active} windSeverity={windSeverity} />

      {/* Palms rise with the inland rim so they do not hang over empty water. */}
      {[
        { position: [-3.55, 0, -0.35] as [number, number, number], scale: 0.95, seed: 1.1 },
        { position: [-1.8, 0, -3.1] as [number, number, number], scale: 1.05, seed: 2.4 },
        { position: [1.8, 0, -3.1] as [number, number, number], scale: 0.92, seed: 3.7 }
      ].map((palm, palmIndex) => (
        <RevealedHex
          key={`palm-${palm.seed}`}
          revealKey={boardReveal}
          index={seaHexes.length + grid.length - 3 + palmIndex}
          hold={revealHold}
          position={palm.position}
        >
          <PalmTree position={[0, 0, 0]} scale={palm.scale} windLevel={windSeverity} seed={palm.seed} />
        </RevealedHex>
      ))}

      {/* CONTIGUOUS HEXAGONAL SEA TILES ALONG THE TWO SOUTH-EAST EDGES (Ring 4 & Ring 5) */}
      {seaHexes.map((sh) => (
        <RevealedHex
          key={`sea-${sh.ring}-${sh.q},${sh.r}`}
          revealKey={boardReveal}
          index={revealIndex.get(`sea-${sh.q},${sh.r}`) ?? 0}
          hold={revealHold}
          position={[sh.x, 0, sh.z]}
        >
          <OceanHexPrism
            seaHex={sh}
            signal5Active={vfx.signal5Active}
            windSeverity={windSeverity}
          />
        </RevealedHex>
      ))}

      {/* The bangka rises with the shallow surf hex it sits on. */}
      <RevealedHex revealKey={boardReveal} index={boatIndex} hold={revealHold} position={[0, 0, 0]}>
        <BangkaBoat windLevel={windSeverity} anchor={anchor} />
      </RevealedHex>

      {/* 37 POINTY-TOP HEXAGONAL PRISM LAND TILES (Radius 3) */}
      {grid.map((tile) => {
        const [x, z] = axialToWorld(tile.q, tile.r);
        const highlighted = isTileHighlighted(tile.q, tile.r);
        const inRadius = isInsideRadiusPreview(tile.q, tile.r);

        const tileHeight = tilePrismHeight(tile.coastalDepth, tile.q, tile.r, boardSeed);
        const tileY = (tileHeight - 0.16) / 2;
        const tint = mixHash(tile.q, tile.r, boardSeed);

        let topCapColor =
          tile.coastalDepth === 0
            ? (['#fde68a', '#fbbf24', '#f59e0b'] as const)[tint % 3]
            : tile.coastalDepth === 1
            ? tint % 2 === 0
              ? '#a3e635'
              : '#bef264'
            : (['#22c55e', '#4ade80', '#16a34a'] as const)[tint % 3];

        if (tile.q === 0 && tile.r === 0) {
          topCapColor = '#cbd5e1';
        }
        if (tile.flooded) {
          topCapColor = '#38bdf8';
        }
        if (tile.onFire) {
          topCapColor = '#f87171';
        }

        // Rich dark terracotta-brown vertical cliff sides so each hex prism stands out crisply
        const cliffSideColor =
          tile.coastalDepth === 0 ? '#9a3412' : '#7c2d12';

        const showGhost =
          phase === 'DEFENDER_BUILD' &&
          highlighted &&
          !tile.building &&
          selectedBuildType &&
          selectedBuildType !== 'UPGRADE';

        return (
          <RevealedHex
            key={`${tile.q},${tile.r}`}
            revealKey={boardReveal}
            index={revealIndex.get(`${tile.q},${tile.r}`) ?? seaHexes.length}
            hold={revealHold}
            position={[x, tileY, z]}
          >
            {/* Deep Hexagonal Bedrock Column under each land hex */}
            <mesh position={[0, -tileHeight / 2 - 0.28, 0]}>
              <cylinderGeometry args={[0.635, 0.59, 0.56, 6]} />
              <meshStandardMaterial
                color="#431407"
                flatShading
                roughness={0.94}
              />
            </mesh>

            {/* Two-Tone Pointy-Top Hexagonal Prism: Dark Brown Cliff Body */}
            <mesh
              position={[0, -0.01, 0]}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredTile({ q: tile.q, r: tile.r });
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                if (hoveredTile?.q === tile.q && hoveredTile?.r === tile.r) {
                  setHoveredTile(null);
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                onTileClick(tile.q, tile.r);
              }}
            >
              <cylinderGeometry args={[0.64, 0.65, tileHeight, 6]} />
              <meshStandardMaterial color={cliffSideColor} flatShading roughness={0.86} />
            </mesh>

            {/* Vibrant Colored Hex Top Cap Plate */}
            <mesh position={[0, tileHeight / 2 - 0.004, 0]}>
              <cylinderGeometry args={[0.615, 0.635, 0.028, 6]} />
              <meshStandardMaterial color={topCapColor} flatShading roughness={0.78} />
            </mesh>

            {/* Subtle Natural Terrain Rocks & Grass Tufts on Empty Land Hexes */}
            {!tile.building && !tile.flooded && !tile.onFire && (
              <EmptyHexDecor
                q={tile.q}
                r={tile.r}
                coastalDepth={tile.coastalDepth}
                tileHeight={tileHeight}
                seed={boardSeed}
              />
            )}

            {/* 2-Hex Effect Radius Indicator Ring (hexDistance <= 2) */}
            {inRadius && !highlighted && (
              <mesh
                position={[0, tileHeight / 2 + 0.018, 0]}
                rotation={[-Math.PI / 2, 0, Math.PI / 6]}
              >
                <ringGeometry args={[0.46, 0.58, 6]} />
                <meshBasicMaterial
                  color="#fde047"
                  transparent
                  opacity={0.78}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}

            {/* Hover Highlight Hex Overlay */}
            {highlighted && (
              <mesh position={[0, tileHeight / 2 + 0.024, 0]}>
                <cylinderGeometry args={[0.62, 0.62, 0.024, 6]} />
                <meshBasicMaterial
                  color={phase === 'KALIKASAN_CARDS' ? '#f43f5e' : '#38bdf8'}
                  transparent
                  opacity={0.65}
                />
              </mesh>
            )}

            {/* Clean Animated Hexagonal Flood Water Overlay per flooded tile */}
            {tile.flooded && (
              <FloodedHexOverlay tileHeight={tileHeight} seed={tile.q * 1.3 + tile.r * 0.9} />
            )}

            {/* Hologram Preview when placing a new building */}
            {showGhost && <GhostBuildingPreview type={selectedBuildType} />}

            {/* Building Mesh if present */}
            {tile.building && (
              <group position={[0, tileHeight / 2 - 0.03, 0]}>
                <BuildingRenderer building={tile.building} isPowered={powered} />
              </group>
            )}
          </RevealedHex>
        );
      })}
    </group>
  );
};
