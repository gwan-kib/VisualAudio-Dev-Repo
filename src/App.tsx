import { ChangeEvent, useEffect, useRef, useState } from "react";
import AudioControlPanel from "./components/AudioControlPanel";
import AudioVisualizerScene from "./components/AudioVisualizerScene";
import VisualizationHeader from "./components/VisualizationHeader";
import { DEFAULT_AXIS_MAPPINGS } from "./audio/mappings/axisMappings";
import { useAudioAnalyser } from "./hooks/useAudioAnalyser";
import type {
  AxisMappingId,
  AxisMappingSelection,
  AxisName,
} from "./types/visualization";

type AudioFileState = {
  name: string;
  url: string;
};

function App() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioFile, setAudioFile] = useState<AudioFileState | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [axisMappings, setAxisMappings] = useState<AxisMappingSelection>(
    DEFAULT_AXIS_MAPPINGS,
  );
  const { analyserConnection, analyserError } = useAudioAnalyser(
    audioRef,
    audioFile?.url ?? null,
  );

  useEffect(() => {
    return () => {
      if (audioFile) {
        URL.revokeObjectURL(audioFile.url);
      }
    };
  }, [audioFile]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    setErrorMessage("");
    setIsPlaying(false);

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith("audio/")) {
      setErrorMessage("Choose an audio file to visualize.");
      event.target.value = "";
      return;
    }

    setAudioFile((currentFile) => {
      if (currentFile) {
        URL.revokeObjectURL(currentFile.url);
      }

      return {
        name: selectedFile.name,
        url: URL.createObjectURL(selectedFile),
      };
    });
  }

  async function handlePlayPause() {
    const audioElement = audioRef.current;

    if (!audioElement) {
      return;
    }

    setErrorMessage("");

    if (audioElement.paused) {
      try {
        await analyserConnection?.resume();
        await audioElement.play();
      } catch {
        setErrorMessage("The browser blocked playback. Try pressing play again.");
      }
      return;
    }

    audioElement.pause();
  }

  function handleRestart() {
    const audioElement = audioRef.current;

    if (!audioElement) {
      return;
    }

    audioElement.currentTime = 0;
    setErrorMessage("");
  }

  function handleAxisMappingChange(axisName: AxisName, mappingId: AxisMappingId) {
    setAxisMappings((currentMappings) => ({
      ...currentMappings,
      [axisName]: mappingId,
    }));
  }

  return (
    <main className="app-shell">
      <AudioVisualizerScene
        analyserConnection={analyserConnection}
        axisMappings={axisMappings}
        isPlaying={isPlaying}
      />
      <VisualizationHeader />
      <AudioControlPanel
        audioFile={audioFile}
        audioRef={audioRef}
        errorMessage={errorMessage || analyserError}
        axisMappings={axisMappings}
        isPlaying={isPlaying}
        onAxisMappingChange={handleAxisMappingChange}
        onAudioEnded={() => setIsPlaying(false)}
        onAudioPause={() => setIsPlaying(false)}
        onAudioPlay={() => setIsPlaying(true)}
        onFileChange={handleFileChange}
        onPlayPause={handlePlayPause}
        onRestart={handleRestart}
      />
    </main>
  );
}

export default App;
