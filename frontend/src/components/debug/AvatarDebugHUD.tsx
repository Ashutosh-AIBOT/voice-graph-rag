'use client';

import { useState, useEffect, useRef } from 'react';
import { useModeController } from '@/state/modeController';
import { usePersonalitySystem } from '@/state/personalitySystem';
import { useMemorySystem } from '@/state/memorySystem';
import { useAvatarStateMachine } from '@/state/avatarStateMachine';

export function AvatarDebugHUD() {
  const [isVisible, setIsVisible] = useState(false);
  const [fps, setFps] = useState(0);
  const [lastEvent, setLastEvent] = useState('none');
  const frameCount = useRef(0);
  const lastTime = useRef(Date.now());
  const [audioDebug, setAudioDebug] = useState({ aa: 0, oh: 0, ee: 0, vol: 0 });

  const activePersona = usePersonalitySystem(s => s.activePersonaId);
  const visitedCount = useMemorySystem(s => s.snapshot?.visitedNodeIds.length || 0);
  const avatarState = useAvatarStateMachine(s => s.currentState);
  const targetNodeId = useAvatarStateMachine(s => s.targetNodeId);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        setIsVisible(v => !v);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    
    let animationId: number;
    const loop = () => {
      frameCount.current++;
      const now = Date.now();
      if (now - lastTime.current >= 1000) {
        setFps(frameCount.current);
        frameCount.current = 0;
        lastTime.current = now;
      }
      animationId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animationId);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    const handleEvent = (e: Event) => {
      setLastEvent((e as CustomEvent).detail.state);
    };
    window.addEventListener('avatar:state_changed', handleEvent);
    return () => window.removeEventListener('avatar:state_changed', handleEvent);
  }, [isVisible]);

  if (process.env.NODE_ENV !== 'development' || !isVisible) return null;

  return (
    <div className="fixed top-4 left-4 z-[9999] bg-black/80 backdrop-blur border border-accent rounded-lg p-4 text-[11px] text-green-400 font-mono shadow-2xl w-[300px] max-h-[80vh] overflow-y-auto pointer-events-auto">
      <div className="flex justify-between items-center mb-4 border-b border-green-400/30 pb-2">
        <h3 className="font-bold text-sm text-green-300">AVATAR DEBUG HUD</h3>
        <span className="bg-green-900/50 px-2 py-0.5 rounded text-green-200">{fps} FPS</span>
      </div>

      <div className="space-y-4">
        {/* State Machine */}
        <div className="space-y-1">
          <div className="text-green-500 font-bold mb-1 border-b border-green-500/20">STATE MACHINE</div>
          <div className="flex justify-between"><span>Current:</span> <span className="text-white">{avatarState}</span></div>
          <div className="flex justify-between"><span>Last Event:</span> <span className="text-white">{lastEvent}</span></div>
          <div className="flex justify-between"><span>Target Node:</span> <span className="text-white truncate max-w-[120px]">{targetNodeId || 'null'}</span></div>
        </div>

        {/* Session */}
        <div className="space-y-1">
          <div className="text-green-500 font-bold mb-1 border-b border-green-500/20">SESSION MEMORY</div>
          <div className="flex justify-between"><span>Persona:</span> <span className="text-white">{activePersona}</span></div>
          <div className="flex justify-between"><span>Visited Nodes:</span> <span className="text-white">{visitedCount}</span></div>
        </div>

        {/* Audio / LipSync (Mocked from HUD perspective, actual values would come from emit) */}
        <div className="space-y-1">
          <div className="text-green-500 font-bold mb-1 border-b border-green-500/20">AUDIO METRICS</div>
          <div className="flex items-center gap-2">
            <span className="w-8">VOL</span>
            <div className="flex-1 h-2 bg-green-900/50 rounded overflow-hidden">
               <div className="h-full bg-green-400" style={{ width: '20%' }} />
            </div>
          </div>
        </div>

        {/* Force Actions */}
        <div className="pt-2 border-t border-green-400/30">
          <div className="text-green-500 font-bold mb-2">FORCE TRANSITION</div>
          <div className="grid grid-cols-2 gap-2">
            {['idle', 'listening', 'walk_to_node', 'flee_with_node'].map(state => (
              <button 
                key={state}
                onClick={() => window.dispatchEvent(new CustomEvent('avatar:state_changed', { detail: { state } }))}
                className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded py-1 transition-colors"
              >
                {state}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-[9px] text-green-500/50 text-center">
        Press Ctrl+Shift+D to close
      </div>
    </div>
  );
}
