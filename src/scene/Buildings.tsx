import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BUILDINGS } from '../data/buildings';
import { BuildingInstance, BuildingType } from '../logic/types';

interface BuildingModelProps {
  building: BuildingInstance;
  isPowered?: boolean;
}

/**
 * Barangay Hall — 2-story civic evacuation center on a hexagonal stone plaza plinth.
 */
export const BarangayHallMesh: React.FC<BuildingModelProps> = ({ building }) => {
  const flagRef = useRef<THREE.Mesh>(null);
  const wallColor = building.upgraded ? '#f8fafc' : '#f3ead8';
  const roofColor = building.upgraded ? '#b91c1c' : '#c85a32';

  useFrame(({ clock }) => {
    if (flagRef.current) {
      flagRef.current.rotation.y = Math.sin(clock.elapsedTime * 4.5) * 0.22;
    }
  });

  return (
    <group position={[0, 0.04, 0]}>
      {/* Hexagonal stone foundation plinth */}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.54, 0.57, 0.06, 6]} />
        <meshStandardMaterial color="#64748b" flatShading roughness={0.9} />
      </mesh>

      {/* First floor civic body */}
      <mesh position={[0, 0.19, -0.02]}>
        <boxGeometry args={[0.64, 0.26, 0.54]} />
        <meshStandardMaterial color={wallColor} flatShading roughness={0.75} />
      </mesh>

      {/* Second floor command deck */}
      <mesh position={[0, 0.39, -0.04]}>
        <boxGeometry args={[0.56, 0.2, 0.46]} />
        <meshStandardMaterial color={wallColor} flatShading roughness={0.7} />
      </mesh>

      {/* Glowing Capiz Windows */}
      {[-0.16, 0, 0.16].map((x, i) => (
        <mesh key={i} position={[x, 0.39, 0.2]}>
          <boxGeometry args={[0.09, 0.09, 0.02]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#f59e0b"
            emissiveIntensity={0.75}
            flatShading
          />
        </mesh>
      ))}

      {/* Front entrance portico canopy + twin pillars */}
      <mesh position={[0, 0.24, 0.28]}>
        <boxGeometry args={[0.36, 0.045, 0.15]} />
        <meshStandardMaterial color={roofColor} flatShading />
      </mesh>
      <mesh position={[-0.13, 0.14, 0.31]}>
        <cylinderGeometry args={[0.025, 0.03, 0.21, 6]} />
        <meshStandardMaterial color="#e2e8f0" flatShading />
      </mesh>
      <mesh position={[0.13, 0.14, 0.31]}>
        <cylinderGeometry args={[0.025, 0.03, 0.21, 6]} />
        <meshStandardMaterial color="#e2e8f0" flatShading />
      </mesh>

      {/* Main Terracotta Hip Roof */}
      <mesh position={[0, 0.61, -0.04]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.52, 0.28, 4]} />
        <meshStandardMaterial color={roofColor} flatShading roughness={0.65} />
      </mesh>

      {/* Golden Seal Emblem on Front Facade */}
      <mesh position={[0, 0.29, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.048, 0.048, 0.02, 8]} />
        <meshStandardMaterial
          color="#facc15"
          emissive="#ca8a04"
          emissiveIntensity={0.4}
          flatShading
        />
      </mesh>

      {/* Flagpole + Waving Philippine Flag */}
      <mesh position={[0.25, 0.42, 0.28]}>
        <cylinderGeometry args={[0.012, 0.016, 0.66, 6]} />
        <meshStandardMaterial color="#f8fafc" flatShading />
      </mesh>
      <group position={[0.25, 0.68, 0.28]}>
        <mesh ref={flagRef} position={[0.08, 0, 0]}>
          <boxGeometry args={[0.16, 0.1, 0.016]} />
          <meshStandardMaterial color="#1d4ed8" flatShading />
        </mesh>
        <mesh position={[0.08, -0.025, 0.002]}>
          <boxGeometry args={[0.16, 0.045, 0.018]} />
          <meshStandardMaterial color="#dc2626" flatShading />
        </mesh>
      </group>
    </group>
  );
};

/**
 * Housing — Base: Elevated Bamboo & Thatch Bahay Kubo (Nipa Hut).
 * Upgraded: Reinforced Concrete House on a hexagonal foundation plinth.
 */
export const HousingMesh: React.FC<BuildingModelProps> = ({ building }) => {
  if (!building.upgraded) {
    return (
      <group position={[0, 0.04, 0]}>
        {[
          [-0.18, -0.18],
          [0.18, -0.18],
          [-0.18, 0.18],
          [0.18, 0.18]
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.08, z]}>
            <cylinderGeometry args={[0.025, 0.03, 0.16, 5]} />
            <meshStandardMaterial color="#713f12" flatShading />
          </mesh>
        ))}

        <mesh position={[0, 0.16, 0]}>
          <boxGeometry args={[0.48, 0.04, 0.48]} />
          <meshStandardMaterial color="#a16207" flatShading />
        </mesh>

        <mesh position={[0, 0.28, 0]}>
          <boxGeometry args={[0.42, 0.22, 0.42]} />
          <meshStandardMaterial color="#ca8a04" flatShading roughness={0.9} />
        </mesh>

        <mesh position={[0.08, 0.29, 0.215]}>
          <boxGeometry args={[0.1, 0.09, 0.02]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#f59e0b"
            emissiveIntensity={0.85}
            flatShading
          />
        </mesh>

        <mesh position={[0, 0.48, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[0.45, 0.28, 4]} />
          <meshStandardMaterial color="#78350f" flatShading roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.57, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[0.28, 0.18, 4]} />
          <meshStandardMaterial color="#92400e" flatShading roughness={0.95} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={[0, 0.04, 0]}>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.51, 0.54, 0.06, 6]} />
        <meshStandardMaterial color="#475569" flatShading />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.54, 0.32, 0.5]} />
        <meshStandardMaterial color="#f8fafc" flatShading roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[0.56, 0.04, 0.52]} />
        <meshStandardMaterial color="#0ea5e9" flatShading />
      </mesh>
      {[-0.12, 0.12].map((x, i) => (
        <mesh key={i} position={[x, 0.24, 0.255]}>
          <boxGeometry args={[0.11, 0.1, 0.02]} />
          <meshStandardMaterial
            color="#bae6fd"
            emissive="#38bdf8"
            emissiveIntensity={0.65}
            flatShading
          />
        </mesh>
      ))}
      <mesh position={[0, 0.51, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.48, 0.26, 4]} />
        <meshStandardMaterial color="#c85a32" flatShading roughness={0.65} />
      </mesh>
    </group>
  );
};

/**
 * Farm — Hexagonal irrigated green rice paddy terrace, swaying crop rows, and granary barn.
 */
export const FarmMesh: React.FC<BuildingModelProps> = ({ building }) => {
  const cropsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (cropsRef.current) {
      cropsRef.current.rotation.z = Math.sin(clock.elapsedTime * 3) * 0.06;
    }
  });

  return (
    <group position={[0, 0.03, 0]}>
      {/* Hexagonal bunded mud dike perimeter */}
      <mesh position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.55, 0.57, 0.05, 6]} />
        <meshStandardMaterial color="#4d7c0f" flatShading roughness={0.9} />
      </mesh>
      {/* Hexagonal irrigated water mirror inside paddy */}
      <mesh position={[0, 0.052, 0]}>
        <cylinderGeometry args={[0.49, 0.49, 0.01, 6]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.2} metalness={0.25} flatShading />
      </mesh>
      {/* Swaying palay rice clusters */}
      <group ref={cropsRef}>
        {[-0.18, 0, 0.18].map((z, rz) =>
          [-0.22, -0.08].map((x, cx) => (
            <mesh key={`${rz}-${cx}`} position={[x, 0.11, z]}>
              <coneGeometry args={[0.05, 0.13, 5]} />
              <meshStandardMaterial color="#a3e635" flatShading />
            </mesh>
          ))
        )}
      </group>
      {/* Kamalig Granary Barn */}
      <mesh position={[0.16, 0.15, 0.08]}>
        <boxGeometry args={[0.22, 0.2, 0.22]} />
        <meshStandardMaterial
          color={building.upgraded ? '#f1f5f9' : '#92400e'}
          flatShading
        />
      </mesh>
      <mesh position={[0.16, 0.3, 0.08]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.2, 0.14, 4]} />
        <meshStandardMaterial
          color={building.upgraded ? '#c85a32' : '#eab308'}
          flatShading
        />
      </mesh>
      {/* Golden haystack */}
      <mesh position={[0.14, 0.12, -0.18]}>
        <coneGeometry args={[0.11, 0.18, 6]} />
        <meshStandardMaterial color="#facc15" flatShading />
      </mesh>
    </group>
  );
};

/**
 * Substation — Hexagonal high-voltage transformer pad with pulsing electric arc sphere.
 */
export const SubstationMesh: React.FC<BuildingModelProps> = ({ building }) => {
  const orbRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (orbRef.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 8) * 0.12;
      orbRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group position={[0, 0.04, 0]}>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.53, 0.55, 0.06, 6]} />
        <meshStandardMaterial color="#64748b" flatShading />
      </mesh>
      <mesh position={[-0.12, 0.21, 0]}>
        <boxGeometry args={[0.34, 0.3, 0.38]} />
        <meshStandardMaterial
          color={building.upgraded ? '#334155' : '#475569'}
          flatShading
        />
      </mesh>
      <mesh position={[0.16, 0.3, -0.13]}>
        <cylinderGeometry args={[0.055, 0.075, 0.46, 6]} />
        <meshStandardMaterial color="#e2e8f0" flatShading />
      </mesh>
      <mesh position={[0.16, 0.3, 0.13]}>
        <cylinderGeometry args={[0.055, 0.075, 0.46, 6]} />
        <meshStandardMaterial color="#e2e8f0" flatShading />
      </mesh>
      <mesh position={[0.16, 0.52, 0]}>
        <boxGeometry args={[0.05, 0.035, 0.34]} />
        <meshStandardMaterial color="#facc15" flatShading />
      </mesh>
      <mesh ref={orbRef} position={[0.16, 0.61, 0]}>
        <octahedronGeometry args={[0.085, 0]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#eab308"
          emissiveIntensity={1.4}
          flatShading
        />
      </mesh>
    </group>
  );
};

/**
 * Fire Station — BFP Station on a hexagonal apron with red fire truck and rotating siren beacon.
 */
export const FireStationMesh: React.FC<BuildingModelProps> = ({ building, isPowered = true }) => {
  const sirenRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (sirenRef.current && isPowered) {
      sirenRef.current.rotation.y = clock.elapsedTime * 6;
    }
  });

  return (
    <group position={[0, 0.04, 0]}>
      <mesh position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.53, 0.55, 0.05, 6]} />
        <meshStandardMaterial color="#94a3b8" flatShading />
      </mesh>
      <mesh position={[-0.06, 0.2, -0.03]}>
        <boxGeometry args={[0.48, 0.32, 0.48]} />
        <meshStandardMaterial color="#dc2626" flatShading />
      </mesh>
      <mesh position={[-0.06, 0.14, 0.22]}>
        <boxGeometry args={[0.3, 0.2, 0.04]} />
        <meshStandardMaterial color="#1e293b" flatShading />
      </mesh>
      <mesh position={[-0.06, 0.12, 0.26]}>
        <boxGeometry args={[0.22, 0.14, 0.14]} />
        <meshStandardMaterial color="#ef4444" flatShading />
      </mesh>
      <mesh position={[0.2, 0.32, -0.12]}>
        <boxGeometry args={[0.18, 0.56, 0.18]} />
        <meshStandardMaterial
          color={building.upgraded ? '#f8fafc' : '#fecaca'}
          flatShading
        />
      </mesh>
      <mesh ref={sirenRef} position={[0.2, 0.63, -0.12]}>
        <boxGeometry args={[0.09, 0.06, 0.09]} />
        <meshStandardMaterial
          color={isPowered ? '#fb7185' : '#475569'}
          emissive={isPowered ? '#e11d48' : '#000000'}
          emissiveIntensity={isPowered ? 1.5 : 0}
          flatShading
        />
      </mesh>
    </group>
  );
};

/**
 * Clinic — Barangay Health Center on a hexagonal pad with teal roof and glowing medical cross.
 */
export const ClinicMesh: React.FC<BuildingModelProps> = ({ building, isPowered = true }) => {
  return (
    <group position={[0, 0.04, 0]}>
      <mesh position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.53, 0.55, 0.05, 6]} />
        <meshStandardMaterial color="#cbd5e1" flatShading />
      </mesh>
      <mesh position={[0, 0.2, -0.02]}>
        <boxGeometry args={[0.54, 0.32, 0.5]} />
        <meshStandardMaterial color="#ffffff" flatShading />
      </mesh>
      <mesh position={[0, 0.18, 0.27]}>
        <boxGeometry args={[0.32, 0.045, 0.12]} />
        <meshStandardMaterial color="#0d9488" flatShading />
      </mesh>
      <mesh position={[0, 0.39, -0.02]}>
        <boxGeometry args={[0.58, 0.07, 0.54]} />
        <meshStandardMaterial
          color={building.upgraded ? '#0f766e' : '#14b8a6'}
          flatShading
        />
      </mesh>
      <mesh position={[0, 0.45, -0.02]}>
        <boxGeometry args={[0.26, 0.05, 0.09]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive={isPowered ? '#dc2626' : '#000000'}
          emissiveIntensity={isPowered ? 0.8 : 0}
          flatShading
        />
      </mesh>
      <mesh position={[0, 0.45, -0.02]}>
        <boxGeometry args={[0.09, 0.05, 0.26]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive={isPowered ? '#dc2626' : '#000000'}
          emissiveIntensity={isPowered ? 0.8 : 0}
          flatShading
        />
      </mesh>
    </group>
  );
};

/**
 * Flood Wall / Drainage — Hexagonal coastal seawall bastion oriented toward the South-East sea.
 */
export const FloodWallMesh: React.FC<BuildingModelProps> = ({ building }) => {
  const wallColor = building.upgraded ? '#334155' : '#94a3b8';
  const capColor = building.upgraded ? '#0ea5e9' : '#e2e8f0';
  return (
    <group position={[0, 0.04, 0]}>
      {/* Hexagonal drainage sluice base */}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.55, 0.58, 0.06, 6]} />
        <meshStandardMaterial color="#475569" flatShading />
      </mesh>
      {/* Hexagonal armored seawall rampart */}
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.46, 0.53, 0.24, 6]} />
        <meshStandardMaterial color={wallColor} flatShading roughness={0.85} />
      </mesh>
      {/* Top wave-deflector parapet ring */}
      <mesh position={[0, 0.31, 0]}>
        <cylinderGeometry args={[0.5, 0.46, 0.06, 6]} />
        <meshStandardMaterial color={capColor} flatShading />
      </mesh>
      {/* Golden hazard beacon post in center */}
      <mesh position={[0, 0.37, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.08, 6]} />
        <meshStandardMaterial color="#f59e0b" flatShading />
      </mesh>
    </group>
  );
};

/**
 * Translucent hexagonal hologram preview shown when Defender hovers an empty hex during Build Phase.
 */
export const GhostBuildingPreview: React.FC<{ type: BuildingType }> = () => {
  return (
    <group position={[0, 0.22, 0]}>
      <mesh>
        <cylinderGeometry args={[0.48, 0.52, 0.36, 6]} />
        <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.7} />
      </mesh>
    </group>
  );
};

/**
 * Dispatcher component that renders the building mesh, 3D villager pins for residents,
 * unpowered warning indicator, and floating 3D HP pips.
 */
export const BuildingRenderer: React.FC<BuildingModelProps> = ({
  building,
  isPowered = true
}) => {
  const hpPips = Array.from({ length: building.maxHp }, (_, i) => i < building.hp);
  const needsPower = BUILDINGS[building.type].requiresPower;
  const unpowered = needsPower && (!isPowered || building.disabledThisRound);

  const residentPins = Array.from({ length: Math.min(6, building.residents) }, (_, i) => i);

  return (
    <group>
      {building.type === 'BARANGAY_HALL' && <BarangayHallMesh building={building} />}
      {building.type === 'HOUSING' && <HousingMesh building={building} />}
      {building.type === 'FARM' && <FarmMesh building={building} />}
      {building.type === 'SUBSTATION' && <SubstationMesh building={building} />}
      {building.type === 'FIRE_STATION' && (
        <FireStationMesh building={building} isPowered={!unpowered} />
      )}
      {building.type === 'CLINIC' && <ClinicMesh building={building} isPowered={!unpowered} />}
      {building.type === 'FLOOD_WALL' && <FloodWallMesh building={building} />}

      {/* Tiny 3D Villager Pawns standing outside the building */}
      {residentPins.map((idx) => {
        const xPos = -0.22 + idx * 0.09;
        return (
          <group key={idx} position={[xPos, 0.06, 0.31]}>
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.02, 0.028, 0.075, 6]} />
              <meshStandardMaterial color="#38bdf8" flatShading />
            </mesh>
            <mesh position={[0, 0.095, 0]}>
              <sphereGeometry args={[0.024, 6, 6]} />
              <meshStandardMaterial color="#fde68a" flatShading />
            </mesh>
          </group>
        );
      })}

      {/* 3D HP Pip bar + Upgrade / Power badge floating above the building */}
      <group position={[0, 0.86, 0]}>
        {hpPips.map((filled, idx) => {
          const totalWidth = building.maxHp * 0.11;
          const xOffset = -totalWidth / 2 + idx * 0.11 + 0.055;
          return (
            <mesh key={idx} position={[xOffset, 0, 0]}>
              <boxGeometry args={[0.085, 0.05, 0.05]} />
              <meshBasicMaterial
                color={
                  !filled
                    ? '#1e293b'
                    : building.upgraded
                    ? '#38bdf8'
                    : '#22c55e'
                }
              />
            </mesh>
          );
        })}

        {unpowered && (
          <mesh position={[0, 0.13, 0]}>
            <octahedronGeometry args={[0.07, 0]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        )}
      </group>
    </group>
  );
};
