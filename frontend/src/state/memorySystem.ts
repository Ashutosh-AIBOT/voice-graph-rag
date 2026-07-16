import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/axios';

export type SessionSnapshot = {
  timestamp: number;
  lastNodeId: string | null;
  visitedNodeIds: string[];
  lastMood: string;
  lastPersonaId: string;
  conversationTurns: number;
  documentIds: string[];
};

interface MemoryState {
  snapshot: SessionSnapshot | null;
  saveSnapshot: (snap: Partial<SessionSnapshot>) => void;
  clearSession: () => void;
}

export const useMemorySystem = create<MemoryState>()(
  persist(
    (set, get) => ({
      snapshot: null,
      saveSnapshot: (snap) => {
        const current = get().snapshot || {
          timestamp: Date.now(),
          lastNodeId: null,
          visitedNodeIds: [],
          lastMood: 'neutral',
          lastPersonaId: 'calm_tutor',
          conversationTurns: 0,
          documentIds: [],
        };
        
        const newSnap = { ...current, ...snap, timestamp: Date.now() };
        set({ snapshot: newSnap });
        
        // Post to backend (fire and forget)
        api.post('/memory/session-sync/', newSnap).catch(e => console.warn('Backend sync failed', e));
      },
      clearSession: () => {
        set({ snapshot: null });
        window.dispatchEvent(new CustomEvent('session:cleared'));
      }
    }),
    { name: 'graphrag-memory' }
  )
);

export const restoreSession = () => {
  const state = useMemorySystem.getState();
  if (state.snapshot) {
    const ageHours = (Date.now() - state.snapshot.timestamp) / (1000 * 60 * 60);
    if (ageHours < 24) {
      window.dispatchEvent(new CustomEvent('session:restored', { detail: state.snapshot }));
    } else {
      state.clearSession(); // Expired
    }
  }
};
