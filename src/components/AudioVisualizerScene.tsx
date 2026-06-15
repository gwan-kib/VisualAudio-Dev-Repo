import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { AudioAnalyserConnection } from "../audio/createAudioAnalyser";

const POINT_COLUMNS = 32;
const POINT_ROWS = 16;
const POINT_COUNT = POINT_COLUMNS * POINT_ROWS;
const POINT_SPACING = 0.22;

type AudioPointGridProps = {
  analyserConnection: AudioAnalyserConnection | null;
  isPlaying: boolean;
};

function createInitialPositions() {
  const positions = new Float32Array(POINT_COUNT * 3);
  const xOffset = ((POINT_COLUMNS - 1) * POINT_SPACING) / 2;
  const zOffset = ((POINT_ROWS - 1) * POINT_SPACING) / 2;

  for (let row = 0; row < POINT_ROWS; row += 1) {
    for (let column = 0; column < POINT_COLUMNS; column += 1) {
      const pointIndex = row * POINT_COLUMNS + column;
      const positionIndex = pointIndex * 3;

      positions[positionIndex] = column * POINT_SPACING - xOffset;
      positions[positionIndex + 1] = 0;
      positions[positionIndex + 2] = row * POINT_SPACING - zOffset;
    }
  }

  return positions;
}

function createPointColors() {
  const colors = new Float32Array(POINT_COUNT * 3);
  const lowColor = new THREE.Color("#2f8cff");
  const highColor = new THREE.Color("#8fffd2");

  for (let row = 0; row < POINT_ROWS; row += 1) {
    for (let column = 0; column < POINT_COLUMNS; column += 1) {
      const pointIndex = row * POINT_COLUMNS + column;
      const colorIndex = pointIndex * 3;
      const color = lowColor.clone().lerp(highColor, column / (POINT_COLUMNS - 1));

      colors[colorIndex] = color.r;
      colors[colorIndex + 1] = color.g;
      colors[colorIndex + 2] = color.b;
    }
  }

  return colors;
}

function AudioPointGrid({ analyserConnection, isPlaying }: AudioPointGridProps) {
  const positions = useMemo(createInitialPositions, []);
  const colors = useMemo(createPointColors, []);
  const smoothedHeights = useRef(new Float32Array(POINT_COUNT));
  const positionAttributeRef = useRef<THREE.BufferAttribute>(null);

  useFrame(({ clock }) => {
    const positionAttribute = positionAttributeRef.current;

    if (!positionAttribute) {
      return;
    }

    const elapsedTime = clock.getElapsedTime();
    const frequencyData =
      analyserConnection && isPlaying
        ? analyserConnection.readFrequencyData()
        : null;

    for (let row = 0; row < POINT_ROWS; row += 1) {
      for (let column = 0; column < POINT_COLUMNS; column += 1) {
        const pointIndex = row * POINT_COLUMNS + column;
        const positionIndex = pointIndex * 3;
        const rowDepth = row / (POINT_ROWS - 1);
        const waveOffset = Math.sin(elapsedTime * 1.2 + column * 0.28 + row * 0.42);
        const idleHeight = 0.08 + waveOffset * 0.035;
        let targetHeight = idleHeight;

        if (frequencyData) {
          const frequencyIndex = Math.floor(
            (column / (POINT_COLUMNS - 1)) * (frequencyData.length - 1),
          );
          const frequencyMagnitude = frequencyData[frequencyIndex] / 255;
          const depthShape = 0.55 + rowDepth * 0.7;

          targetHeight = idleHeight + frequencyMagnitude * depthShape * 1.9;
        }

        const previousHeight = smoothedHeights.current[pointIndex];
        const smoothing = frequencyData ? 0.24 : 0.08;
        const nextHeight =
          previousHeight + (targetHeight - previousHeight) * smoothing;

        smoothedHeights.current[pointIndex] = nextHeight;
        positions[positionIndex + 1] = nextHeight;
      }
    }

    positionAttribute.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          ref={positionAttributeRef}
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.065}
        sizeAttenuation
        vertexColors
        depthWrite={false}
      />
    </points>
  );
}

function AudioSceneContent({ analyserConnection, isPlaying }: AudioPointGridProps) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} />
      <gridHelper args={[8, 16, "#35556f", "#1b3346"]} />
      <AudioPointGrid
        analyserConnection={analyserConnection}
        isPlaying={isPlaying}
      />
      <OrbitControls enableDamping />
    </>
  );
}

export default function AudioVisualizerScene({
  analyserConnection,
  isPlaying,
}: AudioPointGridProps) {
  return (
    <section className="visualization-panel" aria-label="3D visualization">
      <Canvas camera={{ position: [4, 3, 5], fov: 50 }}>
        <color attach="background" args={["#07131f"]} />
        <AudioSceneContent
          analyserConnection={analyserConnection}
          isPlaying={isPlaying}
        />
      </Canvas>
    </section>
  );
}
