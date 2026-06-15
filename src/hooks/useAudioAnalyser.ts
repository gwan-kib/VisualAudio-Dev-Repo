import { RefObject, useEffect, useState } from "react";
import {
  AudioAnalyserConnection,
  createAudioAnalyser,
} from "../audio/createAudioAnalyser";

type AudioAnalyserState = {
  analyserConnection: AudioAnalyserConnection | null;
  analyserError: string;
};

export function useAudioAnalyser(
  audioRef: RefObject<HTMLAudioElement>,
  audioSourceUrl: string | null,
) {
  const [state, setState] = useState<AudioAnalyserState>({
    analyserConnection: null,
    analyserError: "",
  });

  useEffect(() => {
    if (!audioSourceUrl || !audioRef.current) {
      setState({
        analyserConnection: null,
        analyserError: "",
      });
      return;
    }

    try {
      const analyserConnection = createAudioAnalyser(audioRef.current);

      setState({
        analyserConnection,
        analyserError: "",
      });

      return () => {
        analyserConnection.disconnect();
      };
    } catch {
      setState({
        analyserConnection: null,
        analyserError: "Audio analysis is not available in this browser.",
      });
    }
  }, [audioRef, audioSourceUrl]);

  return state;
}
