import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ALL_CARDS } from '../data/cards';
import { axialToWorld, getTile, tilePrismHeight } from '../logic/grid';
import { BuffCardId, PlayedCardAction, TileState } from '../logic/types';
import { useGameStore } from '../store/useGameStore';

function tileTopY(grid: TileState[], q: number, r: number, seed: number): number {
  const tile = getTile(grid, q, r);
  const depth = tile?.coastalDepth ?? 2;
  const tileHeight = tilePrismHeight(depth, q, r, seed);
  const tileY = (tileHeight - 0.16) / 2;
  return tileY + tileHeight / 2;
}

function MarkShape({ id }: { id: BuffCardId }) {
  if (id === 'EARTHQUAKE_FIRE_DRILL') {
    return (
      <group>
        <mesh position={[-0.1, 0, 0]}>
          <boxGeometry args={[0.08, 0.1, 0.1]} />
          <meshStandardMaterial color="#ef4444" flatShading />
        </mesh>
        <mesh position={[0.04, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.11, 0.24, 6]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.35} flatShading />
        </mesh>
      </group>
    );
  }
  if (id === 'TREE_PLANTING') {
    return (
      <group>
        <mesh position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.03, 0.045, 0.16, 5]} />
          <meshStandardMaterial color="#78350f" flatShading />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <icosahedronGeometry args={[0.14, 0]} />
          <meshStandardMaterial color="#22c55e" emissive="#166534" emissiveIntensity={0.35} flatShading />
        </mesh>
      </group>
    );
  }
  if (id === 'RELIEF_GOODS') {
    return (
      <group>
        <mesh>
          <boxGeometry args={[0.22, 0.16, 0.18]} />
          <meshStandardMaterial color="#ea580c" flatShading />
        </mesh>
        <mesh>
          <boxGeometry args={[0.05, 0.2, 0.04]} />
          <meshStandardMaterial color="#fff7ed" emissive="#fff7ed" emissiveIntensity={0.2} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.16, 0.05, 0.04]} />
          <meshStandardMaterial color="#fff7ed" emissive="#fff7ed" emissiveIntensity={0.2} />
        </mesh>
      </group>
    );
  }
  if (id === 'FEEDING_PROGRAM') {
    return (
      <group>
        <mesh position={[0, -0.04, 0]}>
          <cylinderGeometry args={[0.13, 0.08, 0.1, 8]} />
          <meshStandardMaterial color="#d97706" flatShading />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <sphereGeometry args={[0.09, 8, 6]} />
          <meshStandardMaterial color="#fde047" emissive="#eab308" emissiveIntensity={0.3} flatShading />
        </mesh>
      </group>
    );
  }
  if (id === 'MASS_VACCINATION') {
    return (
      <group>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.15, 0.028, 6, 14]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.35} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.05, 0.24, 0.05]} />
          <meshStandardMaterial color="#ecfeff" emissive="#a5f3fc" emissiveIntensity={0.4} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.2, 0.05, 0.05]} />
          <meshStandardMaterial color="#ecfeff" emissive="#a5f3fc" emissiveIntensity={0.4} />
        </mesh>
      </group>
    );
  }
  return (
    <group>
      {[-0.12, 0, 0.12].map((x) => (
        <mesh key={x} position={[x, -0.02, 0]}>
          <capsuleGeometry args={[0.035, 0.08, 3, 6]} />
          <meshStandardMaterial color="#fbcfe8" flatShading />
        </mesh>
      ))}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.2, 0.1, 0.14]} />
        <meshStandardMaterial color="#e879f9" emissive="#e879f9" emissiveIntensity={0.25} flatShading />
      </mesh>
    </group>
  );
}

function BobbingMark({
  x,
  y,
  z,
  id
}: {
  x: number;
  y: number;
  z: number;
  id: BuffCardId;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const group = ref.current;
    if (!group) return;
    group.position.y = y + Math.sin(clock.elapsedTime * 2.3 + x * 4 + z) * 0.045;
  });
  return (
    <group ref={ref} position={[x, y, z]}>
      <mesh position={[0, -0.18, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.28, 5]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <MarkShape id={id} />
    </group>
  );
}

export function BuffIndicators() {
  const actions = useGameStore((s) => s.defenderPlayedActions);
  const grid = useGameStore((s) => s.grid);
  const boardSeed = useGameStore((s) => s.boardSeed);
  if (actions.length === 0) return null;

  const globals: PlayedCardAction[] = [];
  const targeted: PlayedCardAction[] = [];
  for (const action of actions) {
    if (action.targetQ !== undefined && action.targetR !== undefined) targeted.push(action);
    else globals.push(action);
  }

  const [hallX, hallZ] = axialToWorld(0, 0);
  const hallFloat = tileTopY(grid, 0, 0, boardSeed) + 1.05;

  return (
    <group>
      {globals.map((action, index) => {
        const spread = (index - (globals.length - 1) / 2) * 0.46;
        const id = action.cardId as BuffCardId;
        return (
          <BobbingMark
            key={`buff-global-${id}-${index}`}
            x={hallX + 0.62 + spread * 0.72}
            y={hallFloat}
            z={hallZ + 0.62 - spread * 0.72}
            id={id}
          />
        );
      })}
      {targeted.map((action, index) => {
        const q = action.targetQ ?? 0;
        const r = action.targetR ?? 0;
        const [x, z] = axialToWorld(q, r);
        const top = tileTopY(grid, q, r, boardSeed);
        const id = action.cardId as BuffCardId;
        const tint = ALL_CARDS[id].badgeTint ?? '#e879f9';
        return (
          <group key={`buff-target-${id}-${q}-${r}-${index}`}>
            <mesh position={[x, top + 0.03, z]} rotation={[-Math.PI / 2, 0, Math.PI / 6]}>
              <ringGeometry args={[0.4, 0.52, 6]} />
              <meshBasicMaterial color={tint} transparent opacity={0.9} side={THREE.DoubleSide} />
            </mesh>
            <BobbingMark x={x} y={top + 0.95} z={z} id={id} />
          </group>
        );
      })}
    </group>
  );
}
