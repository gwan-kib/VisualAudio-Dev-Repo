export type AudioAnalyserConnection = {
  analyser: AnalyserNode;
  frequencyData: Uint8Array;
  waveformData: Uint8Array;
  disconnect: () => void;
  readFrequencyData: () => Uint8Array;
  readWaveformData: () => Uint8Array;
  resume: () => Promise<void>;
};

type WindowWithWebkitAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

let sharedAudioContext: AudioContext | null = null;
const sourceNodes = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();

function getAudioContext() {
  if (sharedAudioContext) {
    return sharedAudioContext;
  }

  const browserWindow = window as WindowWithWebkitAudio;
  const AudioContextConstructor =
    browserWindow.AudioContext ?? browserWindow.webkitAudioContext;

  if (!AudioContextConstructor) {
    throw new Error("This browser does not support Web Audio analysis.");
  }

  sharedAudioContext = new AudioContextConstructor();
  return sharedAudioContext;
}

function getSourceNode(audioElement: HTMLMediaElement, audioContext: AudioContext) {
  const existingSourceNode = sourceNodes.get(audioElement);

  if (existingSourceNode) {
    return existingSourceNode;
  }

  const sourceNode = audioContext.createMediaElementSource(audioElement);
  sourceNodes.set(audioElement, sourceNode);
  return sourceNode;
}

export function createAudioAnalyser(
  audioElement: HTMLMediaElement,
): AudioAnalyserConnection {
  const audioContext = getAudioContext();
  const sourceNode = getSourceNode(audioElement, audioContext);
  const analyser = audioContext.createAnalyser();

  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.78;

  const frequencyData = new Uint8Array(analyser.frequencyBinCount);
  const waveformData = new Uint8Array(analyser.fftSize);

  sourceNode.connect(analyser);
  analyser.connect(audioContext.destination);

  return {
    analyser,
    frequencyData,
    waveformData,
    disconnect() {
      try {
        sourceNode.disconnect(analyser);
      } catch {
        // The node may already be disconnected during React strict-mode cleanup.
      }

      analyser.disconnect();
    },
    readFrequencyData() {
      analyser.getByteFrequencyData(frequencyData);
      return frequencyData;
    },
    readWaveformData() {
      analyser.getByteTimeDomainData(waveformData);
      return waveformData;
    },
    async resume() {
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
    },
  };
}
