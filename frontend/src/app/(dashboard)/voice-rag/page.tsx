'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useDocumentsStore } from '@/store/documents';
import { useGraphStore } from '@/store/graph';
import { useVoiceChatStore } from '@/store/voiceChat';
import { useGraphData } from '@/hooks/useGraphData';
import { useLiveKitGraphSync } from '@/hooks/useLiveKitGraphSync';
import { useLiveKitConnection } from '@/hooks/useLiveKitConnection';
import { VoiceControls } from '@/components/voice/VoiceControls';
import { ChatHistorySidebar } from '@/components/voice/ChatHistorySidebar';
import { TranscriptStrip } from '@/components/voice/TranscriptStrip';
import {
  Mic2, ChevronDown, Network, FileText,
  Sparkles, Volume2, Bot, Database, Mic
} from 'lucide-react';
import { cn } from '@/lib/utils';

const GraphVisualization = dynamic(
  () => import('@/components/graph/GraphVisualization').then((m) => ({ default: m.GraphVisualization })),
  { ssr: false }
);

import { AvatarPanel } from '@/components/voice/AvatarPanel';

import { MultiDocSelector } from '@/components/voice/MultiDocSelector';
import { GraphLegendBadges, NodeHighlightBadge, GraphEmptyOverlay } from '@/components/graph/GraphBadges';

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function VoiceRagPage() {
  useGraphData(); // Keep graph data in sync

  const setDim = useGraphStore((s) => s.setDim);
  const clearRagHighlights = useGraphStore((s) => s.clearRagHighlights);

  // Switch the global graph to 3D mode when this page is active
  useEffect(() => {
    setDim(3);
    return () => setDim(2); // restore 2D on unmount
  }, [setDim]);

  const selectedDocumentIds = useDocumentsStore((s) => s.selectedDocumentIds);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const {
    agentState,
    isMuted,
    isConnected,
    liveTranscript,
    agentTranscript,
    handleConnect,
    handleDisconnect,
    handleToggleMute,
  } = useLiveKitConnection(activeSessionId, setActiveSessionId);

  // Wire the graph sync hook
  useLiveKitGraphSync(activeSessionId);

  const handleNewChat = useCallback(() => {
    handleDisconnect();
    clearRagHighlights();
    setActiveSessionId(null);
    setHistoryOpen(false);
  }, [handleDisconnect, clearRagHighlights]);

  const handleSelectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setHistoryOpen(false);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-bg-base relative">
             <div className="absolute top-0 right-0 p-5 z-20 pointer-events-auto">
              {!isConnected && (
                <div className="bg-bg-sidebar/95 backdrop-blur-md border border-border rounded-xl p-4 shadow-xl max-w-sm ml-auto">
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="h-4 w-4 text-accent-cyan" />
                    <h3 className="text-sm font-bold text-text-primary">Select Documents</h3>
                  </div>
                  <MultiDocSelector />
                  
                  <button
                    data-testid="connect-rag-button"
                    onClick={handleConnect}
                    className="w-full mt-4 flex items-center justify-center gap-2 rounded-lg bg-accent-violet hover:bg-accent-violet/90 py-2.5 font-bold text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all active:scale-[0.98]"
                  >
                    <Mic className="h-4 w-4" />
                    Connect & Start RAG
                  </button>
                </div>
              )}
            </div>
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border/60 px-4 bg-bg-sidebar/60 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-violet to-accent-cyan">
            <Mic2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-text-primary leading-none">Voice RAG</h1>
            <p className="text-[10px] text-text-muted leading-none mt-0.5">Talk with your documents</p>
          </div>
        </div>

        {/* Header spacer */}
        <div className="w-64 flex items-center justify-center">
           <span className="text-[10px] text-text-muted/60 bg-bg-elevated/50 px-3 py-1 rounded-full border border-border/40">Multi-Document RAG Enabled</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
            <Sparkles className="h-3.5 w-3.5 text-accent-violet" />
            <span>Graph-grounded answers</span>
          </div>
        </div>
      </div>

      {/* ── Main Split-Screen ─────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1">
        {/* LEFT — Avatar Panel */}
        <div className="flex w-[40%] shrink-0 flex-col items-center justify-center gap-6 border-r border-border/40 bg-gradient-to-b from-bg-base to-bg-surface p-6">
          {/* Ambient background glow */}
          <div className="pointer-events-none absolute left-[10%] top-[20%] h-64 w-64 rounded-full bg-accent-violet/5 blur-3xl" />
          <div className="pointer-events-none absolute left-[5%] top-[50%] h-48 w-48 rounded-full bg-accent-cyan/5 blur-3xl" />

          {/* Avatar panel */}
          <AvatarPanel isConnected={isConnected} agentState={agentState} />

          {/* Status text */}
          <div className="text-center">
            <p className="text-xs text-text-muted leading-relaxed max-w-xs">
              {selectedDocumentIds.length === 0
                ? 'Select documents above to begin a voice conversation grounded in your knowledge graph.'
                : isConnected
                  ? `Connected to ${selectedDocumentIds.length} document(s). Speak naturally — the graph will light up as I retrieve answers.`
                  : `Ready to talk about ${selectedDocumentIds.length} document(s). Press Start to connect.`
              }
            </p>
          </div>

          {/* Voice controls */}
          <div className="w-full max-w-xs">
            <VoiceControls
              agentState={agentState}
              isMuted={isMuted}
              isConnected={isConnected}
              onToggleMute={handleToggleMute}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              selectedDocsCount={selectedDocumentIds.length}
            />
          </div>

          {/* Node highlight count badge */}
          <NodeHighlightBadge />
        </div>

        {/* RIGHT — 3D Graph Panel */}
        <div className="relative min-w-0 flex-1 bg-bg-base">
          <GraphVisualization height="100%" hideControls={false} />
          <GraphLegendBadges />

          {/* Overlay when no graph data */}
          <GraphEmptyOverlay />
        </div>
      </div>

      {/* ── Bottom Transcript Strip ───────────────────────────────────────── */}
      <TranscriptStrip
        sessionId={activeSessionId}
        liveTranscript={liveTranscript}
        agentTranscript={agentTranscript}
        onToggleHistory={() => setHistoryOpen((v) => !v)}
      />

      {/* ── Chat History Sidebar ──────────────────────────────────────────── */}
      <ChatHistorySidebar
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        activeSessionId={activeSessionId}
      />

      {/* Hidden Audio Element for Agent Voice */}
      <audio id="agent-audio" autoPlay className="hidden" />
    </div>
  );
}


