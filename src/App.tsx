import { ChangeEvent, useEffect, useRef, useState } from "react";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

type AudioFileState = {
  name: string;
  url: string;
};

function EmptyAudioScene() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} />
      <gridHelper args={[8, 16, "#35556f", "#1b3346"]} />
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.4, 0.8, 1.4]} />
        <meshStandardMaterial color="#45a3ff" roughness={0.35} />
      </mesh>
      <OrbitControls enableDamping />
    </>
  );
}

function App() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioFile, setAudioFile] = useState<AudioFileState | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  return (
    <main className="app-shell">
      <section className="control-panel" aria-labelledby="app-title">
        <div className="title-block">
          <p className="eyebrow">3D audio playground</p>
          <h1 id="app-title">VisualAudio</h1>
          <p>
            Upload an audio file, play it in the browser, and use the 3D scene
            as the foundation for real-time audio mappings.
          </p>
        </div>

        <label className="file-picker">
          <span>Audio file</span>
          <input type="file" accept="audio/*" onChange={handleFileChange} />
        </label>

        <div className="track-card" aria-live="polite">
          <span className="track-label">Current track</span>
          <strong>{audioFile?.name ?? "No file selected"}</strong>
        </div>

        <div className="button-row">
          <button type="button" onClick={handlePlayPause} disabled={!audioFile}>
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button type="button" onClick={handleRestart} disabled={!audioFile}>
            Restart
          </button>
        </div>

        {errorMessage && <p className="error-text">{errorMessage}</p>}

        {audioFile && (
          <audio
            ref={audioRef}
            src={audioFile.url}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
          />
        )}
      </section>

      <section className="visualization-panel" aria-label="3D visualization">
        <Canvas camera={{ position: [4, 3, 5], fov: 50 }}>
          <color attach="background" args={["#07131f"]} />
          <EmptyAudioScene />
        </Canvas>
      </section>
    </main>
  );
}

export default App;
