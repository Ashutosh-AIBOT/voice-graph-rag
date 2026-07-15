'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Hook to analyze audio from the active LiveKit room.
 * Taps into the remote participant's (agent) audio track to compute real-time
 * frequency/amplitude data for lip-sync.
 */
export function useAvatarLipSync(isConnected: boolean) {
  const [volume, setVolume] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const intervalIdRef = useRef<any>(null);

  useEffect(() => {
    if (!isConnected) {
      setVolume(0);
      return;
    }

    // Try to find the audio element rendered by LiveKit
    const findAudioTrackAndAnalyze = () => {
      try {
        const audioElements = document.querySelectorAll('audio');
        let stream: MediaStream | null = null;

        for (const el of Array.from(audioElements)) {
          // Check if this audio element has a srcObject which is a MediaStream
          if (el.srcObject instanceof MediaStream) {
            const tracks = el.srcObject.getAudioTracks();
            if (tracks.length > 0) {
              stream = el.srcObject;
              break;
            }
          }
        }

        if (!stream) return;

        // Initialize Web Audio API
        if (!audioCtxRef.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioCtxRef.current = new AudioContextClass();
        }

        const audioCtx = audioCtxRef.current;
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }

        if (analyserRef.current) {
          // Already analyzing
          return;
        }

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        streamSourceRef.current = source;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkAudio = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Calculate average volume in the lower frequencies (vowels/speech)
          let total = 0;
          const speechBins = Math.min(8, bufferLength);
          for (let i = 0; i < speechBins; i++) {
            total += dataArray[i];
          }
          const avg = total / speechBins / 255; // Normalize 0 to 1
          setVolume(avg);
        };

        intervalIdRef.current = setInterval(checkAudio, 1000 / 60); // 60 FPS
      } catch (err) {
        console.warn('Failed to setup audio lip-sync analysis:', err);
      }
    };

    // Delay slightly to allow LiveKit to attach the audio element
    const timeoutId = setTimeout(findAudioTrackAndAnalyze, 2000);

    return () => {
      clearTimeout(timeoutId);
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      if (streamSourceRef.current) {
        streamSourceRef.current.disconnect();
        streamSourceRef.current = null;
      }
      analyserRef.current = null;
    };
  }, [isConnected]);

  return volume;
}
