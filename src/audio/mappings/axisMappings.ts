import type {
  AxisMappingDefinition,
  AxisMappingId,
  AxisMappingInput,
  AxisMappingSelection,
} from "../../types/visualization";

export const DEFAULT_AXIS_MAPPINGS: AxisMappingSelection = {
  x: "frequencyIndex",
  y: "frequencyMagnitude",
  z: "rowDepth",
};

function normalizeIndex(index: number, count: number) {
  if (count <= 1) {
    return 0;
  }

  return (index / (count - 1)) * 2 - 1;
}

function getFrequencyMagnitude(input: AxisMappingInput) {
  if (!input.frequencyData) {
    return (Math.sin(input.elapsedTime * 1.2 + input.column * 0.28) + 1) * 0.06;
  }

  const frequencyIndex = Math.floor(
    (input.column / (input.columnCount - 1)) * (input.frequencyData.length - 1),
  );

  return input.frequencyData[frequencyIndex] / 255;
}

function getWaveformAmplitude(input: AxisMappingInput) {
  if (!input.waveformData) {
    return Math.sin(input.elapsedTime * 1.1 + input.pointIndex * 0.04) * 0.12;
  }

  const waveformIndex = Math.floor(
    (input.pointIndex / (input.rowCount * input.columnCount - 1)) *
      (input.waveformData.length - 1),
  );

  return (input.waveformData[waveformIndex] - 128) / 128;
}

export const AXIS_MAPPING_DEFINITIONS: AxisMappingDefinition[] = [
  {
    id: "frequencyIndex",
    label: "Frequency Position",
    description: "Places points from low frequencies to high frequencies.",
    map: (input) => normalizeIndex(input.column, input.columnCount),
  },
  {
    id: "frequencyMagnitude",
    label: "Frequency Magnitude",
    description: "Raises points based on the strength of each frequency band.",
    map: getFrequencyMagnitude,
  },
  {
    id: "waveformAmplitude",
    label: "Waveform Amplitude",
    description: "Uses the current waveform sample around each point.",
    map: getWaveformAmplitude,
  },
  {
    id: "time",
    label: "Time",
    description: "Moves points steadily with playback animation time.",
    map: (input) => Math.sin(input.elapsedTime * 0.7),
  },
  {
    id: "rowDepth",
    label: "Row Depth",
    description: "Places points from the front row to the back row.",
    map: (input) => normalizeIndex(input.row, input.rowCount),
  },
  {
    id: "sineWave",
    label: "Sine Wave",
    description: "Creates a smooth wave across the point grid.",
    map: (input) =>
      Math.sin(input.elapsedTime * 1.4 + input.column * 0.32 + input.row * 0.22),
  },
  {
    id: "cosineWave",
    label: "Cosine Wave",
    description: "Creates an offset smooth wave across the point grid.",
    map: (input) =>
      Math.cos(input.elapsedTime * 1.15 + input.column * 0.24 - input.row * 0.36),
  },
];

const axisMappingLookup = AXIS_MAPPING_DEFINITIONS.reduce<
  Record<AxisMappingId, AxisMappingDefinition>
>((lookup, definition) => {
  lookup[definition.id] = definition;
  return lookup;
}, {} as Record<AxisMappingId, AxisMappingDefinition>);

export function resolveAxisMapping(
  mappingId: AxisMappingId,
  input: AxisMappingInput,
) {
  return axisMappingLookup[mappingId].map(input);
}

export function getAxisMappingDefinition(mappingId: AxisMappingId) {
  return axisMappingLookup[mappingId];
}
