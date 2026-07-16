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
  selectedDocsCount: number;
}

const stateConfig: Record<AgentState, { label: string; color: string; pulse: boolean }> = {
  idle:       { label: 'Ready',      color: 'text-text-muted',    pulse: false },
  connecting: { label: 'Connecting…', color: 'text-warning',      pulse: true },
  listening:  { label: 'Listening',  color: 'text-accent-cyan',   pulse: true },
  thinking:   { label: 'Thinking…',  color: 'text-accent-primary', pulse: true },
  speaking:   { label: 'Speaking',   color: 'text-success',       pulse: true },
  error:      { label: 'Error',      color: 'text-error',         pulse: false },
};

/** Animated waveform bars */
function WaveformBars({ state }: { state: AgentState }) {
  const bars = 9;
  const active = state === 'listening' || state === 'speaking';
  return (
    <div className="flex items-center gap-[2px] h-8">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-[3px] rounded-full transition-all duration-300',
            active ? 'bg-accent-cyan' : 'bg-border',
            state === 'thinking' && 'bg-accent-primary'
          )}
          style={{
            height: active
              ? `${12 + Math.abs(Math.sin(i * 0.8)) * 16}px`
              : '4px',
            animationName: active ? 'waveBar' : 'none',
            animationDuration: active ? `${0.35 + i * 0.06}s` : '0s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDirection: 'alternate',
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes waveBar {
          from { height: 4px; }
          to   { height: 28px; }
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
  selectedDocsCount,
}: VoiceControlsProps) {
  const cfg = stateConfig[agentState];

  return (
    <div className={cn(
      'flex items-center justify-between gap-4 rounded-2xl glass p-4',
    )}>
      {/* Connection status */}
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl shrink-0 transition-all',
          isConnected ? 'bg-success/10' : 'bg-bg-elevated/60'
        )}>
          {isConnected ? (
            <Wifi className="h-4 w-4 text-success" />
          ) : (
            <WifiOff className="h-4 w-4 text-text-muted" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-text-primary truncate">
            {isConnected
              ? `Connected · ${selectedDocsCount} doc(s)`
              : `${selectedDocsCount} doc(s) selected`}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {cfg.pulse && (
              <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse shrink-0', {
                'bg-accent-cyan':   agentState === 'listening',
                'bg-accent-primary': agentState === 'thinking' || agentState === 'connecting',
                'bg-success':       agentState === 'speaking',
                'bg-warning':       agentState === 'connecting',
              })} />
            )}
            <span className={cn('text-[10px] font-bold', cfg.color)}>{cfg.label}</span>
          </div>
        </div>
      </div>

      {/* Waveform */}
      <WaveformBars state={agentState} />

      {/* Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {isConnected && (
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl border transition-all',
              isMuted
                ? 'border-error/40 bg-error/10 text-error hover:bg-error/20'
                : 'border-border/60 bg-bg-elevated/60 text-text-secondary hover:border-accent-cyan/40 hover:text-accent-cyan hover:bg-accent-cyan/5'
            )}
          >
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        )}

        {isConnected ? (
          <button
            onClick={onDisconnect}
            title="End session"
            className={cn(
              'flex h-9 items-center gap-1.5 rounded-xl border border-error/30',
              'bg-error/10 px-4 text-[11px] font-bold text-error',
              'hover:bg-error/20 transition-all active:scale-95'
            )}
          >
            <Square className="h-3 w-3 fill-current" />
            End
          </button>
        ) : (
          <button
            data-testid="connect-rag-button"
            onClick={onConnect}
            disabled={agentState === 'connecting'}
            title="Start voice session"
            className={cn(
              'flex h-9 items-center gap-1.5 rounded-xl px-5 text-[11px] font-bold text-white',
              'transition-all active:scale-95',
              agentState !== 'connecting'
                ? 'bg-gradient-to-r from-accent-primary to-accent-cyan shadow-lg shadow-accent-primary/20 hover:shadow-xl hover:opacity-90'
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
