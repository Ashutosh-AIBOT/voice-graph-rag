'use client';

import { useState } from 'react';
import { useAvatarLipSync } from '@/hooks/useAvatarLipSync';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const VRMScene = dynamic(() => import('./VRMScene'), { ssr: false });

interface AvatarPanelProps {
  isConnected: boolean;
  agentState: 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';
}

export function AvatarPanel({ isConnected, agentState }: AvatarPanelProps) {
  const audioMetrics = useAvatarLipSync(isConnected);
  const [currentVrmUrl, setCurrentVrmUrl] = useState<string>('/models/avatar1.vrm');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const avatars = [
    { id: '/models/avatar1.vrm', label: 'Avatar 1 (HD)' },
    { id: '/models/avatar2.vrm', label: 'Avatar 2 (HD)' },
    { id: '/models/avatar3.vrm', label: 'Avatar 3 (HD)' }
  ];

  const currentAvatarLabel = avatars.find(a => a.id === currentVrmUrl)?.label || 'Choose Avatar';

  return (
    <div className="relative w-full h-full">
      {/* 3D Canvas wrapper */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <VRMScene 
          avatarUrl={currentVrmUrl} 
          state={agentState} 
          audioMetrics={audioMetrics} 
        />
      </div>
      
      {/* Floating VRM Model Switcher Dropdown at the top left */}
      <div className="absolute top-6 left-6 z-10">
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 bg-bg-surface/80 backdrop-blur-xl border border-border/50 rounded-xl px-4 py-2 hover:bg-bg-elevated transition-colors shadow-lg"
        >
          <div className="h-2 w-2 rounded-full bg-accent-violet animate-pulse" />
          <span className="text-xs font-bold text-text-primary">{currentAvatarLabel}</span>
          <svg className={cn("h-4 w-4 text-text-muted transition-transform duration-200", isDropdownOpen && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full mt-2 left-0 w-48 bg-bg-surface/95 backdrop-blur-xl border border-border/50 rounded-xl p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 flex flex-col gap-1">
            {avatars.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  setCurrentVrmUrl(model.id);
                  setIsDropdownOpen(false);
                }}
                className={cn(
                  "relative overflow-hidden px-3 py-2 text-xs font-bold rounded-lg transition-all duration-200 active:scale-95 text-left",
                  currentVrmUrl === model.id 
                    ? "bg-accent-violet text-white shadow-md shadow-accent-violet/20" 
                    : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                )}
              >
                {model.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
