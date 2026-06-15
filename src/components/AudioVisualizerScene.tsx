import { Html, Line, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  getAxisMappingDefinition,
  resolveAxisMapping,
} from "../audio/mappings/axisMappings";
import type { AudioAnalyserConnection } from "../audio/createAudioAnalyser";
import type { AxisMappingSelection } from "../types/visualization";

const POINT_COLUMNS = 32;
const POINT_ROWS = 16;
const POINT_COUNT = POINT_COLUMNS * POINT_ROWS;
const AXIS_SCALES = {
  x: 3.4,
  y: 2.2,
  z: 1.7,
};
const LABEL_OFFSET = 0.42;
const TICK_VALUES = [-1, -0.5, 0, 0.5, 1];

type AudioPointGridProps = {
  analyserConnection: AudioAnalyserConnection | null;
  axisMappings: AxisMappingSelection;
  isPlaying: boolean;
};

function createInitialPositions() {
  const positions = new Float32Array(POINT_COUNT * 3);

  for (let row = 0; row < POINT_ROWS; row += 1) {
    for (let column = 0; column < POINT_COLUMNS; column += 1) {
      const pointIndex = row * POINT_COLUMNS + column;
      const positionIndex = pointIndex * 3;

      positions[positionIndex] =
        ((column / (POINT_COLUMNS - 1)) * 2 - 1) * AXIS_SCALES.x;
      positions[positionIndex + 1] = 0;
      positions[positionIndex + 2] =
        ((row / (POINT_ROWS - 1)) * 2 - 1) * AXIS_SCALES.z;
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

function AudioPointGrid({
  analyserConnection,
  axisMappings,
  isPlaying,
}: AudioPointGridProps) {
  const positions = useMemo(createInitialPositions, []);
  const colors = useMemo(createPointColors, []);
  const smoothedPositions = useRef(createInitialPositions());
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
    const waveformData =
      analyserConnection && isPlaying ? analyserConnection.readWaveformData() : null;

    for (let row = 0; row < POINT_ROWS; row += 1) {
      for (let column = 0; column < POINT_COLUMNS; column += 1) {
        const pointIndex = row * POINT_COLUMNS + column;
        const positionIndex = pointIndex * 3;
        const mappingInput = {
          pointIndex,
          row,
          column,
          rowCount: POINT_ROWS,
          columnCount: POINT_COLUMNS,
          frequencyData,
          waveformData,
          elapsedTime,
        };
        const targetX =
          resolveAxisMapping(axisMappings.x, mappingInput) * AXIS_SCALES.x;
        const targetY =
          resolveAxisMapping(axisMappings.y, mappingInput) * AXIS_SCALES.y;
        const targetZ =
          resolveAxisMapping(axisMappings.z, mappingInput) * AXIS_SCALES.z;
        const smoothing = frequencyData || waveformData ? 0.24 : 0.08;

        smoothedPositions.current[positionIndex] +=
          (targetX - smoothedPositions.current[positionIndex]) * smoothing;
        smoothedPositions.current[positionIndex + 1] +=
          (targetY - smoothedPositions.current[positionIndex + 1]) * smoothing;
        smoothedPositions.current[positionIndex + 2] +=
          (targetZ - smoothedPositions.current[positionIndex + 2]) * smoothing;

        positions[positionIndex] = smoothedPositions.current[positionIndex];
        positions[positionIndex + 1] =
          smoothedPositions.current[positionIndex + 1];
        positions[positionIndex + 2] =
          smoothedPositions.current[positionIndex + 2];
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

type AxisGuideProps = {
  axisMappings: AxisMappingSelection;
};

type AxisLabelProps = {
  color: string;
  label: string;
  position: [number, number, number];
};

type AxisTickLabelProps = {
  color: string;
  label: string;
  position: [number, number, number];
};

function AxisLabel({ color, label, position }: AxisLabelProps) {
  return (
    <Html position={position} center sprite distanceFactor={8}>
      <span className="axis-scene-label" style={{ borderColor: color, color }}>
        {label}
      </span>
    </Html>
  );
}

function AxisTickLabel({ color, label, position }: AxisTickLabelProps) {
  return (
    <Html position={position} center sprite distanceFactor={7}>
      <span className="axis-tick-label" style={{ color }}>
        {label}
      </span>
    </Html>
  );
}

function AxisGuides({ axisMappings }: AxisGuideProps) {
  const xLabel = getAxisMappingDefinition(axisMappings.x).label;
  const yLabel = getAxisMappingDefinition(axisMappings.y).label;
  const zLabel = getAxisMappingDefinition(axisMappings.z).label;
  const frontZ = -AXIS_SCALES.z - LABEL_OFFSET;
  const leftX = -AXIS_SCALES.x - LABEL_OFFSET;

  return (
    <group>
      <Line
        color="#74b9ff"
        lineWidth={1.5}
        points={[
          [-AXIS_SCALES.x, 0, frontZ],
          [AXIS_SCALES.x, 0, frontZ],
        ]}
      />
      <Line
        color="#8fffd2"
        lineWidth={1.5}
        points={[
          [leftX, -AXIS_SCALES.y, frontZ],
          [leftX, AXIS_SCALES.y, frontZ],
        ]}
      />
      <Line
        color="#ffcf70"
        lineWidth={1.5}
        points={[
          [leftX, 0, -AXIS_SCALES.z],
          [leftX, 0, AXIS_SCALES.z],
        ]}
      />
      {TICK_VALUES.map((tickValue) => {
        const xPosition = tickValue * AXIS_SCALES.x;

        return (
          <group key={`x-${tickValue}`}>
            <Line
              color="#74b9ff"
              lineWidth={1}
              points={[
                [xPosition, 0, frontZ - 0.08],
                [xPosition, 0, frontZ + 0.08],
              ]}
            />
            <AxisTickLabel
              color="#74b9ff"
              label={tickValue.toString()}
              position={[xPosition, -0.14, frontZ - 0.18]}
            />
          </group>
        );
      })}
      {TICK_VALUES.map((tickValue) => {
        const yPosition = tickValue * AXIS_SCALES.y;

        return (
          <group key={`y-${tickValue}`}>
            <Line
              color="#8fffd2"
              lineWidth={1}
              points={[
                [leftX - 0.08, yPosition, frontZ],
                [leftX + 0.08, yPosition, frontZ],
              ]}
            />
            <AxisTickLabel
              color="#8fffd2"
              label={tickValue.toString()}
              position={[leftX - 0.25, yPosition, frontZ]}
            />
          </group>
        );
      })}
      {TICK_VALUES.map((tickValue) => {
        const zPosition = tickValue * AXIS_SCALES.z;

        return (
          <group key={`z-${tickValue}`}>
            <Line
              color="#ffcf70"
              lineWidth={1}
              points={[
                [leftX - 0.08, 0, zPosition],
                [leftX + 0.08, 0, zPosition],
              ]}
            />
            <AxisTickLabel
              color="#ffcf70"
              label={tickValue.toString()}
              position={[leftX - 0.25, -0.12, zPosition]}
            />
          </group>
        );
      })}
      <AxisLabel
        color="#74b9ff"
        label={`X: ${xLabel}`}
        position={[AXIS_SCALES.x + 0.18, 0.08, frontZ]}
      />
      <AxisLabel
        color="#8fffd2"
        label={`Y: ${yLabel}`}
        position={[leftX - 0.18, AXIS_SCALES.y * 0.78, frontZ]}
      />
      <AxisLabel
        color="#ffcf70"
        label={`Z: ${zLabel}`}
        position={[leftX, 0.08, AXIS_SCALES.z + 0.18]}
      />
    </group>
  );
}

function AxisLegend({ axisMappings }: AxisGuideProps) {
  const xLabel = getAxisMappingDefinition(axisMappings.x).label;
  const yLabel = getAxisMappingDefinition(axisMappings.y).label;
  const zLabel = getAxisMappingDefinition(axisMappings.z).label;

  return (
    <div className="axis-legend" aria-label="Current axis mappings">
      <span className="axis-legend-item" data-axis="x">
        X: {xLabel}
      </span>
      <span className="axis-legend-item" data-axis="y">
        Y: {yLabel}
      </span>
      <span className="axis-legend-item" data-axis="z">
        Z: {zLabel}
      </span>
    </div>
  );
}

function AudioSceneContent({
  analyserConnection,
  axisMappings,
  isPlaying,
}: AudioPointGridProps) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} />
      <gridHelper args={[8, 16, "#35556f", "#1b3346"]} />
      <AxisGuides axisMappings={axisMappings} />
      <AudioPointGrid
        analyserConnection={analyserConnection}
        axisMappings={axisMappings}
        isPlaying={isPlaying}
      />
      <OrbitControls enableDamping />
    </>
  );
}

export default function AudioVisualizerScene({
  analyserConnection,
  axisMappings,
  isPlaying,
}: AudioPointGridProps) {
  return (
    <section className="visualization-panel" aria-label="3D visualization">
      <AxisLegend axisMappings={axisMappings} />
      <Canvas camera={{ position: [4, 3, 5], fov: 50 }}>
        <color attach="background" args={["#07131f"]} />
        <AudioSceneContent
          analyserConnection={analyserConnection}
          axisMappings={axisMappings}
          isPlaying={isPlaying}
        />
      </Canvas>
    </section>
  );
}
