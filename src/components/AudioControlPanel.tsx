import type { ChangeEventHandler, RefObject } from "react";
import { AXIS_MAPPING_DEFINITIONS } from "../audio/mappings/axisMappings";
import type {
  AxisMappingId,
  AxisMappingSelection,
  AxisName,
} from "../types/visualization";

type AudioFileState = {
  name: string;
  url: string;
};

type AudioControlPanelProps = {
  audioFile: AudioFileState | null;
  audioRef: RefObject<HTMLAudioElement>;
  errorMessage: string;
  axisMappings: AxisMappingSelection;
  isPlaying: boolean;
  onAxisMappingChange: (...args: [AxisName, AxisMappingId]) => void;
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
  axisMappings,
  isPlaying,
  onAxisMappingChange,
  onAudioEnded,
  onAudioPause,
  onAudioPlay,
  onFileChange,
  onPlayPause,
  onRestart,
}: AudioControlPanelProps) {
  const axisNames: AxisName[] = ["x", "y", "z"];

  return (
    <section className="control-panel" aria-label="Audio controls">
      <div className="toolbar-group file-group">
        <label className="file-picker">
          <span className="material-symbols-rounded" aria-hidden="true">
            upload_file
          </span>
          <span>Upload Audio</span>
          <input className="visually-hidden" type="file" accept="audio/*" onChange={onFileChange} />
        </label>
      </div>

      <div className="toolbar-group track-group" aria-live="polite">
        <span className="track-label">Current track</span>
        <strong>{audioFile?.name ?? "No file selected"}</strong>
      </div>

      <div className="toolbar-group axis-group" aria-label="Axis mappings">
        {axisNames.map((axisName) => (
          <label className="axis-picker" key={axisName}>
            <span>{axisName.toUpperCase()}</span>
            <select
              aria-label={`${axisName.toUpperCase()} axis mapping`}
              value={axisMappings[axisName]}
              onChange={(event) =>
                onAxisMappingChange(
                  axisName,
                  event.target.value as AxisMappingId,
                )
              }
            >
              {AXIS_MAPPING_DEFINITIONS.map((definition) => (
                <option key={definition.id} value={definition.id}>
                  {definition.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="toolbar-group button-row">
        <button className="command-button" type="button" onClick={onPlayPause} disabled={!audioFile}>
          <span className="material-symbols-rounded" aria-hidden="true">
            {isPlaying ? "pause" : "play_arrow"}
          </span>
          <span className="command-label">{isPlaying ? "Pause" : "Play"}</span>
        </button>
        <button className="command-button" type="button" onClick={onRestart} disabled={!audioFile}>
          <span className="material-symbols-rounded" aria-hidden="true">
            restart_alt
          </span>
          <span className="command-label">Restart</span>
        </button>
      </div>

      {errorMessage && <p className="error-text">{errorMessage}</p>}

      {audioFile && (
        <audio ref={audioRef} src={audioFile.url} onEnded={onAudioEnded} onPause={onAudioPause} onPlay={onAudioPlay} />
      )}
    </section>
  );
}
