'use client';

import { useEffect, useRef, useState } from 'react';

export interface AudioMetrics {
  volume: number;     // Raw overall volume
  derivative: number; // Rate of change of volume (for hard movements)
  aa: number;         // Mid frequencies (Jaw drop)
  oh: number;         // Low frequencies (Mouth round)
  ee: number;         // High frequencies (Lips wide)
}

/**
 * Hook to analyze audio from the active LiveKit room using FFT.
 * Computes frequency bins for advanced lip-sync and audio reactivity.
 */
export function useAvatarLipSync(isConnected: boolean): AudioMetrics {
  const [metrics, setMetrics] = useState<AudioMetrics>({ volume: 0, derivative: 0, aa: 0, oh: 0, ee: 0 });
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const intervalIdRef = useRef<any>(null);
  const prevVolumeRef = useRef<number>(0);

  useEffect(() => {
    if (!isConnected) {
      setMetrics({ volume: 0, derivative: 0, aa: 0, oh: 0, ee: 0 });
      return;
    }

    const findAudioTrackAndAnalyze = () => {
      try {
        const audioElements = document.querySelectorAll('audio');
        let stream: MediaStream | null = null;

        for (const el of Array.from(audioElements)) {
          if (el.srcObject instanceof MediaStream) {
            const tracks = el.srcObject.getAudioTracks();
            if (tracks.length > 0) {
              stream = el.srcObject;
              break;
            }
          }
        }

        if (!stream) return;

        if (!audioCtxRef.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioCtxRef.current = new AudioContextClass();
        }

        const audioCtx = audioCtxRef.current;
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }

        if (analyserRef.current) return;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512; // High res for frequency bands
        analyser.smoothingTimeConstant = 0.5; // Responsive but smooth
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        streamSourceRef.current = source;

        const bufferLength = analyser.frequencyBinCount; // 256 bins
        const dataArray = new Uint8Array(bufferLength);

        const checkAudio = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Approximate frequency bins based on 48kHz sample rate -> ~93Hz per bin
          
          // Lows (oh): Bins 2-6 (~180Hz - 550Hz)
          let ohTotal = 0;
          for (let i = 2; i < 7; i++) ohTotal += dataArray[i];
          const oh = Math.min((ohTotal / 5) / 255 * 2.0, 1.0);

          // Mids (aa): Bins 7-16 (~650Hz - 1500Hz)
          let aaTotal = 0;
          for (let i = 7; i < 17; i++) aaTotal += dataArray[i];
          const aa = Math.min((aaTotal / 10) / 255 * 2.0, 1.0);

          // Highs (ee): Bins 17-40 (~1500Hz - 3700Hz)
          let eeTotal = 0;
          for (let i = 17; i < 41; i++) eeTotal += dataArray[i];
          const ee = Math.min((eeTotal / 24) / 255 * 2.5, 1.0);

          // Overall volume across speech band
          let volTotal = 0;
          for (let i = 2; i < 41; i++) volTotal += dataArray[i];
          const volume = Math.min((volTotal / 39) / 255 * 2.5, 1.0);

          // Calculate derivative (rate of change) for "hard" emphatic movements
          const derivative = Math.max(volume - prevVolumeRef.current, 0); // Only positive spikes
          prevVolumeRef.current = volume;

          setMetrics({ volume, derivative, aa, oh, ee });
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

  return metrics;
}
