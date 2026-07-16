'use client';

import { Mic, MicOff, Square } from 'lucide-react';
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

const stateLabels: Record<AgentState, string> = {
  idle: 'Ready to Connect',
  connecting: 'Connecting...',
  listening: 'Listening...',
  thinking: 'Thinking...',
  speaking: 'Speaking...',
  error: 'Error',
};

export function VoiceControls({
  agentState,
  isMuted,
  isConnected,
  onToggleMute,
  onConnect,
  onDisconnect,
  selectedDocsCount,
}: VoiceControlsProps) {
  const isRecording = agentState === 'listening' || agentState === 'speaking' || agentState === 'thinking';
  const label = stateLabels[agentState];

  return (
    <div className="flex items-center justify-between rounded-[12px] border border-border bg-panel px-[14px] py-[12px]">
      
      {/* Left: Status Text */}
      <div className="flex flex-col">
        <span className="text-[11.5px] font-bold text-text">
          {isConnected ? 'Voice AI Session Active' : 'Start Voice AI'}
        </span>
        <span className="text-[10px] text-text3 mt-[1px]">
          {selectedDocsCount > 0 
            ? `Grounded in ${selectedDocsCount} document(s)` 
            : 'Select documents to ground the AI'}
        </span>
      </div>

      {/* Center: Mic Button */}
      <div className="flex items-center justify-center relative">
        <button
          onClick={isConnected ? (isMuted ? onToggleMute : onToggleMute) : onConnect}
          disabled={agentState === 'connecting' || (!isConnected && selectedDocsCount === 0)}
          className={cn(
            'flex h-[38px] w-[38px] items-center justify-center rounded-full transition-transform duration-200 hover:scale-105 z-10',
            isConnected 
              ? (isMuted ? 'bg-panel2 border border-border text-text3 hover:text-text hover:border-accent' : 'bg-accent text-accent-text')
              : 'bg-accent text-accent-text disabled:opacity-50 disabled:cursor-not-allowed',
            !isMuted && isRecording && 'animate-mic-pulse'
          )}
        >
          {isConnected && isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
      </div>

      {/* Right: State Badge & End Button */}
      <div className="flex flex-col items-end gap-2">
        {isConnected ? (
          <>
            <div className="flex items-center gap-2">
              <span className="rounded-[20px] bg-accent px-[11px] py-[4px] text-[10px] font-semibold text-accent-text">
                {label}
              </span>
              <button 
                onClick={onDisconnect}
                className="flex h-[24px] items-center gap-1 rounded-[6px] bg-panel2 border border-border px-2 text-[10px] font-semibold text-text2 hover:text-text hover:border-accent transition-colors"
              >
                <Square className="h-3 w-3 fill-current" />
                End
              </button>
            </div>
          </>
        ) : (
          <span className="rounded-[20px] bg-panel2 border border-border px-[11px] py-[4px] text-[10px] font-semibold text-text2">
            Disconnected
          </span>
        )}
      </div>
      
    </div>
  );
}
