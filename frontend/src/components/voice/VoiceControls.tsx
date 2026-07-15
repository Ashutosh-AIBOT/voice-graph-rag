'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, Wifi, WifiOff, Loader2, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

type AgentState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

interface VoiceControlsProps {
  agentState: AgentState;
  isMuted: boolean;
  isConnected: boolean;
  onToggleMute: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  selectedDoc: { id: string; name: string } | null;
}

const stateConfig: Record<AgentState, { label: string; color: string; pulse: boolean }> = {
  idle:       { label: 'Ready',      color: 'text-text-muted',    pulse: false },
  connecting: { label: 'Connecting…', color: 'text-warning',      pulse: true },
  listening:  { label: 'Listening',  color: 'text-accent-cyan',   pulse: true },
  thinking:   { label: 'Thinking…',  color: 'text-accent-violet', pulse: true },
  speaking:   { label: 'Speaking',   color: 'text-success',       pulse: true },
  error:      { label: 'Error',      color: 'text-error',         pulse: false },
};

/** Animated waveform bars that react to agent state */
function WaveformBars({ state }: { state: AgentState }) {
  const bars = 7;
  const active = state === 'listening' || state === 'speaking';
  return (
    <div className="flex items-center gap-[3px] h-8">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-1 rounded-full transition-all',
            active ? 'bg-accent-cyan' : 'bg-border',
            state === 'thinking' && 'bg-accent-violet'
          )}
          style={{
            height: active
              ? `${20 + Math.abs(Math.sin(i * 0.9)) * 12}px`
              : '6px',
            animationName: active ? 'waveBar' : 'none',
            animationDuration: active ? `${0.4 + i * 0.08}s` : '0s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDirection: 'alternate',
            animationDelay: `${i * 0.06}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes waveBar {
          from { height: 6px; }
          to   { height: 32px; }
        }
      `}</style>
    </div>
  );
}

export function VoiceControls({
  agentState,
  isMuted,
  isConnected,
  onToggleMute,
  onConnect,
  onDisconnect,
  selectedDoc,
}: VoiceControlsProps) {
  const cfg = stateConfig[agentState];

  return (
    <div className={cn(
      'flex items-center justify-between gap-4 rounded-xl border border-border/60 p-3',
      'bg-bg-surface/80 backdrop-blur-sm'
    )}>
      {/* Connection status */}
      <div className="flex items-center gap-2 min-w-0">
        {isConnected ? (
          <Wifi className="h-3.5 w-3.5 shrink-0 text-success" />
        ) : (
          <WifiOff className="h-3.5 w-3.5 shrink-0 text-text-muted" />
        )}
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-text-primary truncate">
            {isConnected
              ? selectedDoc?.name ?? 'Connected'
              : selectedDoc?.name ?? 'No document selected'}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {cfg.pulse && (
              <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse shrink-0', {
                'bg-accent-cyan':   agentState === 'listening',
                'bg-accent-violet': agentState === 'thinking' || agentState === 'connecting',
                'bg-success':       agentState === 'speaking',
                'bg-warning':       agentState === 'connecting',
              })} />
            )}
            <span className={cn('text-[10px] font-medium', cfg.color)}>{cfg.label}</span>
          </div>
        </div>
      </div>

      {/* Waveform */}
      <WaveformBars state={agentState} />

      {/* Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Mute button */}
        {isConnected && (
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full border transition-all',
              isMuted
                ? 'border-error/40 bg-error/10 text-error hover:bg-error/20'
                : 'border-border/60 bg-bg-elevated text-text-secondary hover:border-accent-cyan/40 hover:text-accent-cyan'
            )}
          >
            {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          </button>
        )}

        {/* Connect / Disconnect button */}
        {isConnected ? (
          <button
            onClick={onDisconnect}
            title="End session"
            className={cn(
              'flex h-8 items-center gap-1.5 rounded-full border border-error/30',
              'bg-error/10 px-3 text-[11px] font-semibold text-error',
              'hover:bg-error/20 transition-colors'
            )}
          >
            <Square className="h-3 w-3 fill-current" />
            End
          </button>
        ) : (
          <button
            onClick={onConnect}
            disabled={!selectedDoc || agentState === 'connecting'}
            title={!selectedDoc ? 'Select a document first' : 'Start voice session'}
            className={cn(
              'flex h-8 items-center gap-1.5 rounded-full px-4 text-[11px] font-semibold text-white',
              'transition-all active:scale-95',
              selectedDoc && agentState !== 'connecting'
                ? 'bg-gradient-to-r from-accent-violet to-accent-cyan shadow-lg shadow-accent-violet/20 hover:opacity-90'
                : 'bg-bg-elevated text-text-muted cursor-not-allowed border border-border'
            )}
          >
            {agentState === 'connecting' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Mic className="h-3.5 w-3.5" />
            )}
            {agentState === 'connecting' ? 'Connecting…' : 'Start'}
          </button>
        )}
      </div>
    </div>
  );
}
