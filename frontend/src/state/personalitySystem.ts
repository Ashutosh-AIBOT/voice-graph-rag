import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PersonaProfile = {
  id: string;
  name: string;
  vrmUrl: string;
  breathingSpeed: number;       // multiplier on idle_breathe clip speed
  gestureIntensity: number;     // 0-1 scale of arm movement amplitude
  expressionRange: {            // how wide expressions go
    happyMax: number;
    angryMax: number;
  };
  idleMicroActionFrequency: number; // probability per frame or per second
  preferredMood: 'neutral' | 'curious' | 'focus'; // default mood on connect
  voicePitch: number;           // passed to TTS engine as pitch modifier
};

export const PERSONAS: Record<string, PersonaProfile> = {
  calm_tutor: {
    id: 'calm_tutor',
    name: 'Calm Tutor',
    vrmUrl: '/models/avatar1.vrm', // Default
    breathingSpeed: 0.8,
    gestureIntensity: 0.6,
    expressionRange: { happyMax: 0.6, angryMax: 0.2 },
    idleMicroActionFrequency: 0.5,
    preferredMood: 'neutral',
    voicePitch: 1.0,
  },
  excited_assistant: {
    id: 'excited_assistant',
    name: 'Excited Assistant',
    vrmUrl: '/models/avatar2.vrm', // Placeholder for second avatar
    breathingSpeed: 1.5,
    gestureIntensity: 1.0,
    expressionRange: { happyMax: 1.0, angryMax: 0.1 },
    idleMicroActionFrequency: 1.5,
    preferredMood: 'curious',
    voicePitch: 1.2,
  },
  serious_analyst: {
    id: 'serious_analyst',
    name: 'Serious Analyst',
    vrmUrl: '/models/avatar3.vrm', // Placeholder for third avatar
    breathingSpeed: 0.6,
    gestureIntensity: 0.3,
    expressionRange: { happyMax: 0.3, angryMax: 0.8 },
    idleMicroActionFrequency: 0.2,
    preferredMood: 'focus',
    voicePitch: 0.9,
  }
};

interface PersonalityState {
  activePersonaId: string;
  getActivePersona: () => PersonaProfile;
  setPersona: (id: string) => void;
}

export const usePersonalitySystem = create<PersonalityState>()(
  persist(
    (set, get) => ({
      activePersonaId: 'calm_tutor',
      getActivePersona: () => PERSONAS[get().activePersonaId] || PERSONAS['calm_tutor'],
      setPersona: (id: string) => {
        if (PERSONAS[id]) {
          set({ activePersonaId: id });
          // Phase 17: Emit event for other systems to listen to
          window.dispatchEvent(new CustomEvent('personality:changed', { detail: { persona: PERSONAS[id] } }));
        }
      },
    }),
    { name: 'graphrag-persona' }
  )
);
