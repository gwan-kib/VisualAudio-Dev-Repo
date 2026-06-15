export type AxisName = "x" | "y" | "z";

export type AxisMappingId =
  | "frequencyIndex"
  | "frequencyMagnitude"
  | "waveformAmplitude"
  | "time"
  | "rowDepth"
  | "sineWave"
  | "cosineWave";

export type AxisMappingSelection = Record<AxisName, AxisMappingId>;

export type AxisMappingInput = {
  pointIndex: number;
  row: number;
  column: number;
  rowCount: number;
  columnCount: number;
  frequencyData: Uint8Array | null;
  waveformData: Uint8Array | null;
  elapsedTime: number;
};

export type AxisMappingDefinition = {
  id: AxisMappingId;
  label: string;
  description: string;
  map: (...args: [AxisMappingInput]) => number;
};
