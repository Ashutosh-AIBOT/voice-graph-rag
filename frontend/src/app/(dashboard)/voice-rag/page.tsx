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

  const selectedDocumentIds = useDocumentsStore((s) => s.selectedDocumentIds);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isDocSelectorOpen, setIsDocSelectorOpen] = useState(false);

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

  const clearRagHighlights = useGraphStore((s) => s.clearRagHighlights);

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
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4 bg-bg-base relative z-50">
        <div className="flex items-center gap-2.5 w-64">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-primary to-accent-cyan">
            <Mic2 className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-text-primary leading-none">Voice RAG</h1>
            <p className="text-[11px] text-text-muted leading-none mt-0.5">Talk with your documents</p>
          </div>
        </div>

        {/* Header center: Document Selector */}
        <div className="flex-1 flex justify-center relative">
          {!isConnected ? (
            <div className="relative">
              <button
                onClick={() => setIsDocSelectorOpen(!isDocSelectorOpen)}
                className="flex items-center gap-2 bg-bg-surface border border-border rounded-lg px-3 py-1.5 hover:bg-bg-elevated transition-colors shadow-sm"
              >
                <Database className="h-3.5 w-3.5 text-accent-cyan" />
                <span className="text-xs font-medium text-text-primary">Knowledge Base</span>
                <ChevronDown className={cn("h-3.5 w-3.5 text-text-muted transition-transform", isDocSelectorOpen && "rotate-180")} />
              </button>

              {isDocSelectorOpen && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-bg-panel border border-border rounded-xl p-4 shadow-xl w-80 animate-in fade-in slide-in-from-top-2">
                  <MultiDocSelector />
                </div>
              )}
            </div>
          ) : (
             <span className="text-xs text-text-muted bg-bg-elevated px-3 py-1 rounded-md border border-border">Multi-Document RAG Enabled</span>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 w-64">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Sparkles className="h-3.5 w-3.5 text-accent-primary" />
            <span>Graph-grounded answers</span>
          </div>
        </div>
      </div>

      {/* ── Main Split-Screen ─────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* LEFT — Avatar Panel */}
        <div className="relative h-[45vh] w-full shrink-0 border-b border-border/40 bg-bg-avatar overflow-hidden md:h-auto md:w-[40%] md:border-b-0 md:border-r">
          
          {/* 3D Background - Fills completely */}
          <div className="absolute inset-0 z-0 pointer-events-auto">
            <AvatarPanel isConnected={isConnected} agentState={agentState} />
          </div>

          {/* Node highlight count badge (Floats at top right of the panel) */}
          <div className="absolute top-6 right-6 z-20 pointer-events-auto">
            <NodeHighlightBadge />
          </div>

          {/* Dark Fog Gradient at the bottom for UI readability */}
          <div className="absolute inset-x-0 bottom-0 h-[320px] bg-gradient-to-t from-bg-avatar via-bg-avatar/90 to-transparent pointer-events-none z-10" />

          {/* Floating Controls Container at the bottom */}
          <div className="absolute inset-x-0 bottom-8 z-20 flex flex-col items-center px-8 gap-4 pointer-events-auto">
            
            {/* Status text */}
            <div className="text-center bg-bg-surface/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-border shadow-lg">
              <p className="text-xs font-medium text-text-primary leading-relaxed max-w-[280px]">
                {selectedDocumentIds.length === 0
                  ? 'Select documents to begin a voice conversation grounded in your knowledge graph.'
                  : isConnected
                    ? `Connected to ${selectedDocumentIds.length} document(s). Speak naturally — the graph will light up as I retrieve answers.`
                    : `Ready to talk about ${selectedDocumentIds.length} document(s). Press Start to connect.`
                }
              </p>
            </div>

            {/* Voice controls */}
            <div className="w-full max-w-[320px] bg-bg-surface/90 backdrop-blur-xl border border-border p-2.5 rounded-2xl shadow-xl">
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

          </div>
        </div>

        {/* RIGHT — 3D Graph Panel */}
        <div className="relative min-w-0 flex-1 bg-bg-base flex flex-col">
          
          {/* Graph Area */}
          <div className="flex-1 relative min-h-0">
            <GraphVisualization height="100%" hideLegend={true} />
            <GraphLegendBadges />
            <GraphEmptyOverlay />
          </div>

          {/* ── Bottom Transcript Strip (Only under Graph) ───────────────── */}
          <div className="relative z-30 shrink-0 border-l border-border/40">
            <TranscriptStrip
              sessionId={activeSessionId}
              liveTranscript={liveTranscript}
              agentTranscript={agentTranscript}
              onToggleHistory={() => setHistoryOpen((v) => !v)}
            />
          </div>
        </div>
      </div>

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


