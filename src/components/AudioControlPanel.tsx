import type { ChangeEventHandler, RefObject } from "react";

type AudioFileState = {
  name: string;
  url: string;
};

type AudioControlPanelProps = {
  audioFile: AudioFileState | null;
  audioRef: RefObject<HTMLAudioElement>;
  errorMessage: string;
  isPlaying: boolean;
  onAudioEnded: () => void;
  onAudioPause: () => void;
  onAudioPlay: () => void;
  onFileChange: ChangeEventHandler<HTMLInputElement>;
  onPlayPause: () => void;
  onRestart: () => void;
};

export default function AudioControlPanel({
  audioFile,
  audioRef,
  errorMessage,
  isPlaying,
  onAudioEnded,
  onAudioPause,
  onAudioPlay,
  onFileChange,
  onPlayPause,
  onRestart,
}: AudioControlPanelProps) {
  return (
    <section className="control-panel" aria-label="Audio controls">
      <div className="toolbar-group file-group">
        <label className="file-picker">
          <span>Audio file</span>
          <input type="file" accept="audio/*" onChange={onFileChange} />
        </label>
      </div>

      <div className="toolbar-group track-group" aria-live="polite">
        <span className="track-label">Current track</span>
        <strong>{audioFile?.name ?? "No file selected"}</strong>
      </div>

      <div className="toolbar-group button-row">
        <button type="button" onClick={onPlayPause} disabled={!audioFile}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button type="button" onClick={onRestart} disabled={!audioFile}>
          Restart
        </button>
      </div>

      {errorMessage && <p className="error-text">{errorMessage}</p>}

      {audioFile && (
        <audio
          ref={audioRef}
          src={audioFile.url}
          onEnded={onAudioEnded}
          onPause={onAudioPause}
          onPlay={onAudioPlay}
        />
      )}
    </section>
  );
}
