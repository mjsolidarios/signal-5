import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { axialToWorld, HEX_DIRECTIONS } from '../logic/grid';
import { useGameStore } from '../store/useGameStore';
import { TileState, VisualEffectState } from '../logic/types';

interface EffectsProps {
  grid: TileState[];
  vfx: VisualEffectState;
}

const MAX_FIRE_CONES = 128;
const MAX_SMOKE_PUFFS = 64;
const MAX_RAIN_DROPS = 120;
const MAX_WIND_STREAKS = 50;

export const WeatherAndHazardEffects: React.FC<EffectsProps> = ({ grid, vfx }) => {
  const fireOuterRef = useRef<THREE.InstancedMesh>(null);
  const fireCoreRef = useRef<THREE.InstancedMesh>(null);
  const smokeRef = useRef<THREE.InstancedMesh>(null);
  const rainMeshRef = useRef<THREE.InstancedMesh>(null);
  const windMeshRef = useRef<THREE.InstancedMesh>(null);
  const lightningLightRef = useRef<THREE.PointLight>(null);

  const windDirection = useGameStore((s) => s.windDirection);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  // Pointy-top axial step → world XZ. East (dq 1, dr 0) is +X, yaw π/2, so a
  // streak whose long axis is local +Z points along the forecast after rotation.y = atan2(x, z).
  const windVector = useMemo(() => {
    const dir = HEX_DIRECTIONS[windDirection];
    const [x, z] = axialToWorld(dir.dq, dir.dr);
    const len = Math.hypot(x, z) || 1;
    return { x: x / len, z: z / len, yaw: Math.atan2(x, z) };
  }, [windDirection]);

  // Pre-generate particle seeds for rain and wind
  const rainSeeds = useMemo(
    () =>
      Array.from({ length: MAX_RAIN_DROPS }, () => ({
        x: (Math.random() - 0.5) * 9.5,
        y: Math.random() * 6.5,
        z: (Math.random() - 0.5) * 9.5,
        speed: 5.5 + Math.random() * 4.5
      })),
    []
  );

  const windSeeds = useMemo(
    () =>
      Array.from({ length: MAX_WIND_STREAKS }, () => ({
        x: (Math.random() - 0.5) * 9,
        y: 0.35 + Math.random() * 2.8,
        z: (Math.random() - 0.5) * 9,
        speed: 4.5 + Math.random() * 4.5
      })),
    []
  );

  // Collect active fire hexes from the 37-tile hex grid
  const fireTiles = useMemo(() => {
    const list: Array<{ x: number; z: number; intensity: number }> = [];
    for (const tile of grid) {
      if (tile.onFire) {
        const [x, z] = axialToWorld(tile.q, tile.r);
        list.push({ x, z, intensity: tile.fireIntensity || 1 });
      }
    }
    return list;
  }, [grid]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // 1. Instanced Fire Cones (Outer Flame + Inner Core + Rising Smoke)
    if (fireOuterRef.current && fireCoreRef.current && smokeRef.current) {
      let instanceIdx = 0;
      let smokeIdx = 0;

      for (let i = 0; i < fireTiles.length; i++) {
        const ft = fireTiles[i];
        const conesCount = ft.intensity >= 2 ? 3 : 2;
        for (let k = 0; k < conesCount; k++) {
          if (instanceIdx >= MAX_FIRE_CONES) break;
          const angle = k * 2.1 + i + t * 0.8;
          const ox = Math.cos(angle) * 0.16;
          const oz = Math.sin(angle) * 0.16;
          const flicker = 0.85 + 0.38 * Math.sin(t * 16 + i * 3 + k * 5);

          dummy.position.set(ft.x + ox, 0.26 + flicker * 0.12, ft.z + oz);
          dummy.scale.set(0.95, flicker * (ft.intensity >= 2 ? 1.45 : 1.05), 0.95);
          dummy.rotation.set(0, t * 2.5 + k, 0);
          dummy.updateMatrix();
          fireOuterRef.current.setMatrixAt(instanceIdx, dummy.matrix);

          dummy.position.set(ft.x + ox, 0.22 + flicker * 0.08, ft.z + oz);
          dummy.scale.set(0.55, flicker * 0.75, 0.55);
          dummy.updateMatrix();
          fireCoreRef.current.setMatrixAt(instanceIdx, dummy.matrix);

          instanceIdx++;
        }

        if (smokeIdx < MAX_SMOKE_PUFFS) {
          const cycle = (t * 0.9 + i * 0.37) % 1;
          const sy = 0.55 + cycle * 1.1;
          const sScale = 0.4 + Math.sin(cycle * Math.PI) * 0.65;
          dummy.position.set(
            ft.x + Math.sin(t * 2 + i) * 0.08,
            sy,
            ft.z + cycle * 0.25
          );
          dummy.scale.set(sScale, sScale, sScale);
          dummy.rotation.set(t, t * 0.5, 0);
          dummy.updateMatrix();
          smokeRef.current.setMatrixAt(smokeIdx, dummy.matrix);
          smokeIdx++;
        }
      }

      fireOuterRef.current.count = instanceIdx;
      fireOuterRef.current.instanceMatrix.needsUpdate = true;
      fireCoreRef.current.count = instanceIdx;
      fireCoreRef.current.instanceMatrix.needsUpdate = true;
      smokeRef.current.count = smokeIdx;
      smokeRef.current.instanceMatrix.needsUpdate = true;
    }

    // 2. Instanced Rain Streak Particles
    const showRain = vfx.rainLevel > 0 || vfx.signal5Active;
    if (rainMeshRef.current) {
      if (!showRain) {
        rainMeshRef.current.count = 0;
      } else {
        const activeDrops =
          vfx.signal5Active ? MAX_RAIN_DROPS : vfx.rainLevel >= 2 ? 85 : 45;
        for (let i = 0; i < activeDrops; i++) {
          const s = rainSeeds[i];
          const blow = vfx.windLevel > 0 || vfx.signal5Active ? 2.6 : 0.45;
          s.y -= delta * s.speed * (vfx.signal5Active ? 1.7 : 1.15);
          s.x += delta * windVector.x * blow;
          s.z += delta * windVector.z * blow;
          if (s.y < 0 || Math.abs(s.x) > 5.2 || Math.abs(s.z) > 5.2) {
            s.y = 5.8;
            s.x = (Math.random() - 0.5) * 9.0;
            s.z = (Math.random() - 0.5) * 9.0;
          }
          dummy.position.set(s.x, s.y, s.z);
          dummy.rotation.set(vfx.windLevel > 0 || vfx.signal5Active ? -0.35 : -0.08, windVector.yaw, 0);
          dummy.scale.set(1, vfx.signal5Active ? 1.6 : 1, 1);
          dummy.updateMatrix();
          rainMeshRef.current.setMatrixAt(i, dummy.matrix);
        }
        rainMeshRef.current.count = activeDrops;
        rainMeshRef.current.instanceMatrix.needsUpdate = true;
      }
    }

    // 3. Instanced Wind / Typhoon Particles
    const showWind = vfx.windLevel > 0 || vfx.signal5Active;
    if (windMeshRef.current) {
      if (!showWind) {
        windMeshRef.current.count = 0;
      } else {
        const activeStreaks = vfx.signal5Active ? MAX_WIND_STREAKS : vfx.windLevel * 16;
        for (let i = 0; i < activeStreaks; i++) {
          const w = windSeeds[i];
          const gust = w.speed * (vfx.signal5Active ? 2.2 : 1.25);
          w.x += delta * gust * windVector.x;
          w.z += delta * gust * windVector.z;
          if (Math.abs(w.x) > 4.8 || Math.abs(w.z) > 4.8) {
            w.x = -windVector.x * 4.2 + (Math.random() - 0.5) * 3;
            w.z = -windVector.z * 4.2 + (Math.random() - 0.5) * 3;
          }
          dummy.position.set(w.x, w.y + Math.sin(t * 5 + i) * 0.09, w.z);
          dummy.rotation.set(0, windVector.yaw, 0);
          dummy.scale.set(1, 1, vfx.signal5Active ? 1.9 : 1.15);
          dummy.updateMatrix();
          windMeshRef.current.setMatrixAt(i, dummy.matrix);
        }
        windMeshRef.current.count = activeStreaks;
        windMeshRef.current.instanceMatrix.needsUpdate = true;
      }
    }

    // 4. Storm Lightning Flash (Typhoon Signal 3 or Signal 5)
    if (lightningLightRef.current) {
      if (vfx.signal5Active || vfx.windLevel >= 2) {
        const flashWave = Math.sin(t * 7.3) * Math.sin(t * 19.1);
        lightningLightRef.current.intensity = flashWave > 0.92 ? 3.5 : 0;
      } else {
        lightningLightRef.current.intensity = 0;
      }
    }

  });

  return (
    <group>
      <pointLight
        ref={lightningLightRef}
        position={[0, 8, -2]}
        color="#e0f2fe"
        intensity={0}
        distance={25}
      />

      <instancedMesh ref={fireOuterRef} args={[undefined, undefined, MAX_FIRE_CONES]}>
        <coneGeometry args={[0.14, 0.44, 5]} />
        <meshStandardMaterial
          color="#fb923c"
          emissive="#ef4444"
          emissiveIntensity={1.6}
          flatShading
        />
      </instancedMesh>

      <instancedMesh ref={fireCoreRef} args={[undefined, undefined, MAX_FIRE_CONES]}>
        <coneGeometry args={[0.1, 0.34, 5]} />
        <meshBasicMaterial color="#fef08a" />
      </instancedMesh>

      <instancedMesh ref={smokeRef} args={[undefined, undefined, MAX_SMOKE_PUFFS]}>
        <dodecahedronGeometry args={[0.13, 0]} />
        <meshStandardMaterial color="#334155" transparent opacity={0.55} flatShading />
      </instancedMesh>

      <instancedMesh ref={rainMeshRef} args={[undefined, undefined, MAX_RAIN_DROPS]}>
        <boxGeometry args={[0.02, 0.45, 0.02]} />
        <meshBasicMaterial color="#bae6fd" transparent opacity={0.68} />
      </instancedMesh>

      <instancedMesh ref={windMeshRef} args={[undefined, undefined, MAX_WIND_STREAKS]}>
        <boxGeometry args={[0.03, 0.03, 0.9]} />
        <meshBasicMaterial color="#f1f5f9" transparent opacity={0.52} />
      </instancedMesh>
    </group>
  );
};
