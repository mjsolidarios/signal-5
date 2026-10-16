import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';
import { BuffIndicators } from './BuffIndicators';
import { IslandBoard } from './Island';
import { WeatherAndHazardEffects } from './Effects';

/**
 * Shakes the island, not the camera, so OrbitControls keep the orbit the player set.
 * Trauma is added once per resolve and decays. shake = trauma^2, so small hits stay small.
 */
const ImpactShake: React.FC<{
  impulse: number;
  impulseKey: string;
  children: React.ReactNode;
}> = ({ impulse, impulseKey, children }) => {
  const group = useRef<THREE.Group>(null);
  const trauma = useRef(0);
  const seenKey = useRef<string | null>(null);

  useFrame((state, dt) => {
    if (seenKey.current !== impulseKey) {
      seenKey.current = impulseKey;
      if (impulse > 0) {
        trauma.current = Math.min(1, trauma.current + impulse);
      }
    }
    trauma.current = Math.max(0, trauma.current - dt * 0.65);
    const g = group.current;
    if (!g) return;
    const mag = trauma.current * trauma.current;
    if (mag < 0.0008) {
      g.position.set(0, 0, 0);
      return;
    }
    const t = state.clock.elapsedTime * 26;
    g.position.set(
      Math.sin(t * 1.7) * 0.16 * mag,
      Math.cos(t * 2.2) * 0.07 * mag,
      Math.sin(t * 1.3) * 0.16 * mag
    );
  });

  return <group ref={group}>{children}</group>;
};

export const GameScene: React.FC = () => {
  const grid = useGameStore((s) => s.grid);
  const vfx = useGameStore((s) => s.vfx);
  const shakeKey = useGameStore((s) => `${s.half}-${s.round}-${s.phase}-${s.vfx.cameraShake}`);
  const selectedHandCardUid = useGameStore((s) => s.selectedHandCardUid);
  const selectedBuildType = useGameStore((s) => s.selectedBuildType);

  return (
    <div className="scene-container">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={[vfx.signal5Active ? '#082f49' : '#0c4a6e']} />

        {/* Fixed Isometric OrthographicCamera — zoomed in for the 37-hex diorama */}
        <OrthographicCamera
          makeDefault
          position={[8.5, 9.5, 8.5]}
          zoom={74}
          near={-25}
          far={100}
        />

        {/* OrbitControls limited to small rotate and zoom; disabled while dragging any card */}
        <OrbitControls
          enabled={!selectedHandCardUid && !selectedBuildType}
          enablePan={false}
          minZoom={52}
          maxZoom={115}
          minPolarAngle={Math.PI / 4.2}
          maxPolarAngle={Math.PI / 2.7}
          minAzimuthAngle={Math.PI / 4 - 0.35}
          maxAzimuthAngle={Math.PI / 4 + 0.35}
          target={[0.35, -0.35, 0.35]}
        />

        {/* Crisp tropical sunlight + sky fill lighting (no heavy shadows for 60 FPS on mobile) */}
        <hemisphereLight
          args={['#f0f9ff', '#1e3a8a', vfx.signal5Active ? 0.6 : 0.92]}
        />
        <directionalLight
          position={[7, 13, 8]}
          intensity={vfx.signal5Active ? 0.8 : 1.25}
          color="#fffbeb"
        />
        <directionalLight
          position={[-6, 6, -5]}
          intensity={0.32}
          color="#38bdf8"
        />

        <ImpactShake impulse={vfx.cameraShake} impulseKey={shakeKey}>
          <IslandBoard />
          <BuffIndicators />
          <WeatherAndHazardEffects grid={grid} vfx={vfx} />
        </ImpactShake>
      </Canvas>
    </div>
  );
};
