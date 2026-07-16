import { create } from 'zustand';
import tuning from '@/config/tuning.json';

export type AppMode = 'browse' | 'transition' | 'talk';
export type TransitionDirection = 'forward' | 'reverse';

interface TransitionBeat {
  delay: number;
  action: string;
}

const FORWARD_BEATS: TransitionBeat[] = [
  { delay: 0, action: 'start_button_morph' },
  { delay: 80, action: 'sidebar_labels_fade' },
  { delay: 180, action: 'sidebar_collapse' },
  { delay: 220, action: 'right_panels_exit' },
  { delay: 400, action: 'avatar_unframe' },
  { delay: 460, action: 'graph_expand' },
  { delay: 520, action: 'avatar_step_forward' },
  { delay: 700, action: 'ambient_pulse' },
  { delay: 760, action: 'avatar_idle_live' },
  { delay: tuning.transitionTiming.totalSequenceMs, action: 'unlock_input' }
];

interface ModeState {
  mode: AppMode;
  transitionProgress: number; // 0 to 1
  isInputLocked: boolean;
  activeBeats: Set<string>;
  preStartSidebarCollapsed: boolean;
  isTalkUIExpanded: boolean;
  
  setMode: (mode: AppMode) => void;
  runTransitionSequence: (direction: TransitionDirection) => void;
  interruptTransition: () => void;
  setPreStartSidebarCollapsed: (v: boolean) => void;
  toggleTalkUIExpanded: () => void;
}

// Track timeout handles outside the store to avoid mutability issues
let pendingTimeouts: NodeJS.Timeout[] = [];
let startTime = 0;

export const useModeController = create<ModeState>((set, get) => ({
  mode: 'browse',
  transitionProgress: 0,
  isInputLocked: false,
  activeBeats: new Set(),
  preStartSidebarCollapsed: false,
  isTalkUIExpanded: false,

  setMode: (mode) => {
    set({ mode });
    if (mode === 'browse') {
      set({ isTalkUIExpanded: false });
    }
    window.dispatchEvent(new CustomEvent('mode:changed', { detail: { mode } }));
  },

  setPreStartSidebarCollapsed: (v) => set({ preStartSidebarCollapsed: v }),
  
  toggleTalkUIExpanded: () => set((state) => ({ isTalkUIExpanded: !state.isTalkUIExpanded })),

  interruptTransition: () => {
    pendingTimeouts.forEach(clearTimeout);
    pendingTimeouts = [];
  },

  runTransitionSequence: (direction) => {
    const { interruptTransition, setMode } = get();
    
    // Interrupt any ongoing sequence
    interruptTransition();
    
    setMode('transition');
    set({ isInputLocked: true, activeBeats: new Set() });
    startTime = Date.now();
    
    const beats = direction === 'forward' ? FORWARD_BEATS : [...FORWARD_BEATS].reverse();
    const totalDuration = tuning.transitionTiming.totalSequenceMs;
    
    beats.forEach((beat) => {
      // If reversing, invert the delay logic relative to total time
      const delay = direction === 'forward' ? beat.delay : totalDuration - beat.delay;
      
      if (delay < 0) return;
      
      const timeout = setTimeout(() => {
        set((state) => {
          const newBeats = new Set(state.activeBeats);
          if (direction === 'forward') {
            newBeats.add(beat.action);
          } else {
            newBeats.delete(beat.action);
          }
          return { activeBeats: newBeats };
        });
        
        // Dispatch event for UI components to listen to
        window.dispatchEvent(new CustomEvent('transition:beat', { 
          detail: { action: beat.action, direction } 
        }));
        
        if (beat.action === 'unlock_input') {
          setMode(direction === 'forward' ? 'talk' : 'browse');
          set({ isInputLocked: false });
        }
      }, delay);
      
      pendingTimeouts.push(timeout);
    });
  }
}));
