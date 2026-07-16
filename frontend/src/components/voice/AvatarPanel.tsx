'use client';

import { cn } from '@/lib/utils';
import { Loader2, Maximize2 } from 'lucide-react';
import { PERSONAS } from '@/state/personalitySystem';

interface AvatarPanelProps {
  isConnected: boolean;
  agentState: 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';
  currentPersonaId: string;
  onSetPersona: (id: string) => void;
}

export function AvatarPanel({ isConnected, agentState, currentPersonaId, onSetPersona }: AvatarPanelProps) {
  const avatars = Object.values(PERSONAS);

  const stateLabel = agentState === 'idle' ? 'Ready' : agentState.charAt(0).toUpperCase() + agentState.slice(1);

  return (
    <div className="absolute inset-0 p-3 flex flex-col h-full w-full">
      {/* 3D Stage area (Now just a transparent container, VRM is full-screen) */}
      <div 
        className="flex-1 relative rounded-[10px] overflow-hidden flex flex-col items-center justify-center pointer-events-auto"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, hsl(var(--panel3)), hsl(var(--panel2)) 70%)' }}
      >
        {/* Top Bar inside Stage */}
        <div className="absolute top-[10px] left-0 w-full px-[14px] flex items-center justify-between z-20">
          
          {/* State Pill */}
          <div className="flex items-center gap-[6px] rounded-full bg-panel/70 backdrop-blur-[6px] border border-border px-[10px] py-[4px]">
            <span className={cn(
              "h-2 w-2 rounded-full",
              agentState === 'listening' ? "bg-accent animate-dot-pulse" :
              agentState === 'speaking' ? "bg-entity-org animate-dot-pulse" :
              agentState === 'thinking' ? "bg-entity-tech animate-dot-pulse" :
              agentState === 'connecting' ? "bg-entity-event animate-dot-pulse" :
              "bg-text3"
            )} />
            <span className="text-[10px] font-semibold text-text">{stateLabel}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-[6px]">
            <button className="flex h-[26px] w-[26px] items-center justify-center rounded-[8px] bg-panel/70 backdrop-blur-[6px] border border-border text-text2 hover:text-text hover:border-accent transition-colors">
              <Maximize2 className="h-[12px] w-[12px]" />
            </button>
          </div>
        </div>

        {/* Loading overlay if connecting */}
        {agentState === 'connecting' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-panel/40 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-text border-t-accent" />
            <span className="mt-2 text-[11px] font-medium text-text3">Loading avatar...</span>
          </div>
        )}

        {/* Mouth Bars (Bottom of Stage) */}
        <div className={cn(
          "absolute bottom-4 z-20 flex items-end gap-[4px] h-[30px] transition-opacity duration-300",
          agentState === 'speaking' ? "opacity-100" : "opacity-0"
        )}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div 
              key={i} 
              className="w-[3px] bg-accent rounded-t-full origin-bottom animate-viseme" 
              style={{ animationDelay: `${i * 0.05}s` }}
            />
          ))}
        </div>
      </div>

      {/* Avatar Selectors */}
      <div className="shrink-0 flex flex-col items-center gap-[10px] pt-[12px]">
        <div className="flex gap-[8px]">
          {avatars.map((model) => (
            <button
              key={model.id}
              onClick={() => onSetPersona(model.id)}
              className={cn(
                "px-[11px] py-[5px] text-[10.5px] font-semibold rounded-[16px] transition-colors border",
                currentPersonaId === model.id 
                  ? "bg-accent text-accent-text border-accent" 
                  : "bg-panel2 text-text2 border-border hover:border-accent hover:text-text"
              )}
            >
              {model.name}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-text3 text-center max-w-[230px] leading-snug">
          Select an avatar to visualize the LiveKit conversational AI agent.
        </p>
      </div>

    </div>
  );
}
