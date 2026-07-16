import { create } from 'zustand';
import { useMemorySystem } from '@/state/memorySystem';

export type AvatarState = 'idle' | 'listening' | 'walk_to_node' | 'sit_on_node' | 'reach_grab' | 'tug' | 'flee_with_node' | 'return_to_camera' | 'sign_off';

interface AvatarStateStore {
  currentState: AvatarState;
  targetNodeId: string | null;
  tugCycles: number;
  
  // Transition actions
  transitionTo: (nextState: AvatarState, payload?: any) => void;
  
  // Events
  onVoiceStarted: () => void;
  onVoiceStopped: () => void;
  onTopicMatched: (nodeId: string) => void;
  onArrivedAtNode: (nodeType: 'hub' | 'leaf') => void;
  onTugCycleComplete: (maxCycles: number) => void;
  onOutOfBounds: () => void;
  onArrivedAtOrigin: () => void;
}

export const useAvatarStateMachine = create<AvatarStateStore>((set, get) => ({
  currentState: 'idle',
  targetNodeId: null,
  tugCycles: 0,

  transitionTo: (nextState, payload) => {
    set({ currentState: nextState });
    
    if (nextState === 'walk_to_node' && payload?.nodeId) {
      set({ targetNodeId: payload.nodeId });
      
      // Phase 20: Add to visited nodes
      const memory = useMemorySystem.getState();
      const visited = memory.snapshot?.visitedNodeIds || [];
      if (!visited.includes(payload.nodeId)) {
        memory.saveSnapshot({ visitedNodeIds: [...visited, payload.nodeId] });
      }
    }
    
    if (nextState === 'return_to_camera' || nextState === 'idle') {
      set({ targetNodeId: null, tugCycles: 0 });
    }
    
    window.dispatchEvent(new CustomEvent('avatar:state_changed', { detail: { state: nextState, payload } }));
  },

  onVoiceStarted: () => {
    const state = get().currentState;
    const { transitionTo } = get();
    
    // Voice input ALWAYS forces transition to listening or return_to_camera
    if (['walk_to_node', 'sit_on_node', 'reach_grab', 'tug'].includes(state)) {
      transitionTo('return_to_camera', { interrupted: true });
    } else if (state === 'flee_with_node') {
      transitionTo('return_to_camera', { interrupted: true });
    } else {
      transitionTo('listening');
    }
  },

  onVoiceStopped: () => {
    const { currentState, transitionTo } = get();
    if (currentState === 'listening') {
      transitionTo('idle');
    } else if (currentState === 'flee_with_node') {
      transitionTo('return_to_camera');
    }
  },

  onTopicMatched: (nodeId: string) => {
    const { currentState, transitionTo } = get();
    if (currentState === 'idle' || currentState === 'listening') {
      transitionTo('walk_to_node', { nodeId });
    }
  },

  onArrivedAtNode: (nodeType: 'hub' | 'leaf') => {
    const { currentState, transitionTo } = get();
    if (currentState === 'walk_to_node') {
      transitionTo('reach_grab', { nodeType });
      
      // Auto-resolve reach_grab based on type
      setTimeout(() => {
        const state = get().currentState;
        if (state === 'reach_grab') {
          if (nodeType === 'hub') {
            transitionTo('sit_on_node');
          } else {
            transitionTo('tug');
          }
        }
      }, 500); // 500ms reach animation delay
    }
  },

  onTugCycleComplete: (maxCycles: number) => {
    const { currentState, tugCycles, transitionTo } = get();
    if (currentState === 'tug') {
      const nextCycles = tugCycles + 1;
      set({ tugCycles: nextCycles });
      
      if (nextCycles >= maxCycles) {
        transitionTo('flee_with_node');
      }
    }
  },

  onOutOfBounds: () => {
    const { currentState, transitionTo } = get();
    if (currentState === 'flee_with_node') {
      transitionTo('return_to_camera');
    }
  },

  onArrivedAtOrigin: () => {
    const { currentState, transitionTo } = get();
    if (currentState === 'return_to_camera') {
      transitionTo('idle');
    }
  },
}));
