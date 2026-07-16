'use client';

import { useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import dynamic from 'next/dynamic';
import { useDocumentsStore } from '@/store/documents';
import { useGraphStore } from '@/store/graph';
import { useLiveKitGraphSync } from '@/hooks/useLiveKitGraphSync';
import { useLiveKitConnection } from '@/hooks/useLiveKitConnection';
import { useAvatarLipSync } from '@/hooks/useAvatarLipSync';
import { useDOMBridge } from '@/hooks/useDOMBridge';
import { useModeController } from '@/state/modeController';
import { usePersonalitySystem } from '@/state/personalitySystem';
import { MoodDetector } from '@/mood/moodDetector';
import { SpatialAudioEngine } from '@/render/spatialAudio';
import { useMemorySystem, restoreSession } from '@/state/memorySystem';
import { MoodColorLayer } from '@/mood/moodColorLayer';
import { VoiceControls } from '@/components/voice/VoiceControls';
import { ChatHistorySidebar } from '@/components/voice/ChatHistorySidebar';
import { TranscriptStrip } from '@/components/voice/TranscriptStrip';
import { AvatarPanel } from '@/components/voice/AvatarPanel';
import { MultiDocSelector } from '@/components/voice/MultiDocSelector';
import { FloatingCard } from '@/components/voice/FloatingCard';
import { GraphLegendBadges, NodeHighlightBadge, GraphEmptyOverlay } from '@/components/graph/GraphBadges';
import { Chip } from '@/components/ui/chip';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

const GraphVisualization = dynamic(
  () => import('@/components/graph/GraphVisualization').then((m) => ({ default: m.GraphVisualization })),
  { ssr: false }
);
const VRMScene = dynamic(() => import('@/components/voice/VRMScene'), { ssr: false });

export default function VoiceRagPage() {
  const selectedDocumentIds = useDocumentsStore((s) => s.selectedDocumentIds);
  const documents = useDocumentsStore((s) => s.documents);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isDocSelectorOpen, setIsDocSelectorOpen] = useState(false);
  const activePersonaId = usePersonalitySystem(s => s.activePersonaId);
  const getActivePersona = usePersonalitySystem(s => s.getActivePersona);
  const setPersona = usePersonalitySystem(s => s.setPersona);
  
  const persona = getActivePersona();

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

  const audioMetrics = useAvatarLipSync(isConnected);

  // Wire the graph sync hook
  useLiveKitGraphSync(activeSessionId);
  const clearRagHighlights = useGraphStore((s) => s.clearRagHighlights);
  const runTransitionSequence = useModeController((s) => s.runTransitionSequence);

  const wrappedHandleConnect = useCallback(async () => {
    runTransitionSequence('forward');
    // small delay to let transition start before blocking thread
    setTimeout(() => {
      handleConnect();
    }, 100);
  }, [handleConnect, runTransitionSequence]);

  const wrappedHandleDisconnect = useCallback(async () => {
    // Phase 1: Play sign-off gesture first
    window.dispatchEvent(new CustomEvent('avatar:state_changed', { detail: { state: 'sign_off' } }));
    
    // Wait for gesture (e.g. 1.2s) before contracting UI and disconnecting
    setTimeout(() => {
      runTransitionSequence('reverse');
      handleDisconnect();
    }, 1200);
  }, [handleDisconnect, runTransitionSequence]);

  const saveSnapshot = useMemorySystem(s => s.saveSnapshot);
  const isBrowseMode = useModeController(s => s.mode === 'browse');
  const isTalkUIExpanded = useModeController(s => s.isTalkUIExpanded);

  // Phase 20: Save Snapshot
  useEffect(() => {
    if (!isConnected || isBrowseMode) {
      saveSnapshot({
        lastPersonaId: activePersonaId,
        documentIds: selectedDocumentIds,
      });
    }
  }, [isConnected, isBrowseMode, activePersonaId, selectedDocumentIds, saveSnapshot]);

  const handleNewChat = useCallback(() => {
    wrappedHandleDisconnect();
    clearRagHighlights();
    setActiveSessionId(null);
    setHistoryOpen(false);
  }, [wrappedHandleDisconnect, clearRagHighlights]);

  const handleSelectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setHistoryOpen(false);
  }, []);

  // Phase 8: DOM Bridge states
  const [avatarBoxRect, setAvatarBoxRect] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    const updateRect = () => {
      const el = document.getElementById('avatar-card');
      if (el) {
        const rect = el.getBoundingClientRect();
        setAvatarBoxRect({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
      }
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('transition:beat', updateRect);
    
    // Phase 10: Init mood colors
    MoodColorLayer.initialize();

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('transition:beat', updateRect);
    }
  }, []);

  const [showWelcomeBack, setShowWelcomeBack] = useState(false);

  useEffect(() => {
    MoodDetector.init();
    // Wrap in setTimeout to ensure audio element is in DOM
    setTimeout(() => SpatialAudioEngine.init(), 100);
    
    // Phase 20: Restore Session
    const onRestore = () => {
      setShowWelcomeBack(true);
      setTimeout(() => setShowWelcomeBack(false), 3000);
    };
    window.addEventListener('session:restored', onRestore);
    restoreSession();
    return () => window.removeEventListener('session:restored', onRestore);
  }, []);

  // Phase 10: Mood detection based on transcript
  useEffect(() => {
    if (agentTranscript) {
      MoodDetector.analyzeText(agentTranscript);
    }
  }, [agentTranscript]);



  return (
    <div className="flex h-full flex-col p-4 gap-[12px] bg-bg2 overflow-hidden relative mood-glow-layer">
      
      {/* ── 3D Full-Screen Overlay (Phase 7) ── */}
      <div 
        className="fixed inset-0 z-[9999] pointer-events-none transition-all duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          clipPath: isBrowseMode && avatarBoxRect.width > 0 
            ? `inset(${avatarBoxRect.y}px calc(100vw - (${avatarBoxRect.x}px + ${avatarBoxRect.width}px)) calc(100vh - (${avatarBoxRect.y}px + ${avatarBoxRect.height}px)) ${avatarBoxRect.x}px round 13px)`
            : 'inset(0px 0px 0px 0px)'
        }}
      >
        <VRMScene 
          avatarUrl={persona.vrmUrl} 
          state={agentState} 
          audioMetrics={audioMetrics} 
        />
        {showWelcomeBack && (
          <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 bg-panel/80 backdrop-blur-md rounded-xl border border-accent text-accent-text text-sm font-bold shadow-glow-accent animate-fade-in-out">
            Welcome back!
          </div>
        )}
      </div>

      {/* ── Floating Header Actions ── */}
      <div className="absolute top-[16px] right-[16px] z-50 flex items-center gap-2">
         <button 
           onClick={() => {
             const currentMode = useModeController.getState().mode;
             if (currentMode === 'browse') {
               runTransitionSequence('forward');
             } else {
               runTransitionSequence('reverse');
             }
           }}
           className="px-3 py-1.5 bg-accent/20 border border-accent rounded-lg text-accent-text hover:bg-accent hover:text-white transition-colors text-xs font-bold shadow-glow-accent"
         >
           Toggle 3D Layout (Debug)
         </button>
      </div>

      {/* ── Document Strip (top) ── */}
      <div className="flex shrink-0 items-center justify-between rounded-[11px] border border-border bg-panel px-[13px] py-[9px] relative z-30">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {selectedDocumentIds.length > 0 ? (
            selectedDocumentIds.map(id => {
              const doc = documents.find(d => d.id === id);
              return <Chip key={id}>{doc ? doc.filename : id}</Chip>;
            })
          ) : (
            <span className="text-[10.5px] text-text3 font-medium px-2">No documents selected</span>
          )}
          <Chip variant="dashed" onClick={() => setIsDocSelectorOpen(true)} className="cursor-pointer">
            <Plus className="h-3 w-3 mr-1" /> Add Document
          </Chip>
        </div>
        <div className="flex items-center shrink-0 pl-4 border-l border-border/50 ml-2 gap-4">
          <span className="font-mono text-[10.5px] text-text3">
            {selectedDocumentIds.length} of {documents.length} selected
          </span>
          <button 
            onClick={() => setHistoryOpen(true)}
            className="px-3 py-1.5 bg-panel2 border border-border rounded-lg text-text2 hover:text-text hover:bg-panel3 transition-colors text-xs font-medium"
          >
            Session History
          </button>
        </div>
      </div>

      {isDocSelectorOpen && (
        <div className="absolute top-[60px] left-4 z-50 bg-panel border border-border rounded-xl p-4 shadow-xl w-[320px] animate-fade-in">
           <div className="flex justify-between items-center mb-4">
             <h3 className="font-display font-semibold text-text text-[13px]">Select Documents</h3>
             <button onClick={() => setIsDocSelectorOpen(false)} className="text-text3 hover:text-text">✕</button>
           </div>
           <MultiDocSelector />
        </div>
      )}

      {/* ── Body Grid ── */}
      <div 
        className="grid flex-1 min-h-0 gap-[12px] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]" 
        style={{ gridTemplateColumns: useModeController((s) => !s.isTalkUIExpanded && (s.activeBeats.has('graph_expand') || s.mode === 'talk')) ? '1fr' : '1.3fr 1fr' }}
      >
        
        <div id="avatar-card" className={cn(
          "relative flex flex-col transition-all duration-300",
          useModeController((s) => s.activeBeats.has('avatar_unframe') || s.mode === 'talk' || s.mode === 'transition')
            ? "border-transparent bg-transparent shadow-none"
            : "rounded-[13px] border border-border bg-panel shadow-sm"
        )}>
          <div className={cn(
            "flex-1 relative transition-transform duration-[600ms] ease-out origin-bottom z-50",
            useModeController((s) => !s.isTalkUIExpanded && (s.activeBeats.has('avatar_step_forward') || s.mode === 'talk'))
              ? "scale-[1.08] translate-y-[-10px]"
              : "scale-100 translate-y-0"
          )}>
            <AvatarPanel 
              isConnected={isConnected} 
              agentState={agentState} 
              currentPersonaId={activePersonaId} 
              onSetPersona={setPersona} 
            />
          </div>
          
          {/* Bottom Voice Controls */}
          <div id="voice-controls" className="shrink-0 p-3 z-50">
             <VoiceControls
                agentState={agentState}
                isMuted={isMuted}
                isConnected={isConnected}
                onToggleMute={handleToggleMute}
                onConnect={wrappedHandleConnect}
                onDisconnect={wrappedHandleDisconnect}
                selectedDocsCount={selectedDocumentIds.length}
              />
          </div>
        </div>

        {/* RIGHT — Graph Context Card & Transcript */}
        <div className={cn(
          "flex flex-col gap-[12px] min-h-0 transition-all duration-300",
          useModeController((s) => !s.isTalkUIExpanded && (s.activeBeats.has('right_panels_exit') || s.mode === 'talk'))
            ? "opacity-0 scale-[0.92] translate-y-[-6px] pointer-events-none absolute w-0 h-0" 
            : "opacity-100 scale-100 translate-y-0"
        )}>
          
          {/* Graph Canvas */}
          <div id="graph-container" className={cn(
            "flex-1 flex flex-col rounded-[13px] border border-border bg-panel overflow-hidden min-h-[170px] relative p-3 transition-all duration-300",
            useModeController((s) => s.activeBeats.has('ambient_pulse')) ? "animate-ambientPulse" : ""
          )}>
            <div className="flex items-center justify-between mb-3 shrink-0">
              <span className="text-[9.5px] font-bold tracking-[0.06em] text-text3">LIVE GRAPH CONTEXT</span>
              <NodeHighlightBadge />
            </div>
            <div className="flex-1 bg-panel2 rounded-[9px] relative overflow-hidden">
               <GraphVisualization height="100%" hideControls={false} />
               <GraphLegendBadges />
               <GraphEmptyOverlay />
            </div>
            <div className="mt-2 text-center text-[9.5px] text-text3 shrink-0">
               Interact with the graph to explore relationships, or speak naturally to dive deeper.
            </div>
          </div>

          {/* Transcript Bar */}
          <div className="shrink-0">
             <TranscriptStrip
              sessionId={activeSessionId}
              liveTranscript={liveTranscript}
              agentTranscript={agentTranscript}
              onToggleHistory={() => setHistoryOpen((v) => !v)}
              onNewChat={handleNewChat}
            />
          </div>
        </div>
      </div>

      {/* Floating Cards (Talk Mode Only) */}
      <FloatingCard position="bottom" tabLabel="Live Transcript" isActive={useModeController(s => s.mode === 'talk' && !s.isTalkUIExpanded)}>
         <TranscriptStrip
            sessionId={activeSessionId}
            liveTranscript={liveTranscript}
            agentTranscript={agentTranscript}
            onToggleHistory={() => setHistoryOpen((v) => !v)}
            onNewChat={handleNewChat}
          />
      </FloatingCard>

      <FloatingCard position="right" tabLabel="Graph Legend" isActive={useModeController(s => s.mode === 'talk' && !s.isTalkUIExpanded)}>
        <div className="flex flex-col gap-2">
          <span className="text-[9.5px] font-bold tracking-[0.06em] text-text3 mb-2">LIVE GRAPH CONTEXT</span>
          <NodeHighlightBadge />
          <GraphLegendBadges />
        </div>
      </FloatingCard>

      {!isBrowseMode && (
        <button
          onClick={() => useModeController.getState().toggleTalkUIExpanded()}
          className="absolute top-4 right-4 z-50 bg-panel2 border border-border text-text2 hover:text-text hover:border-accent px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all shadow-lg animate-fade-in"
        >
          {isTalkUIExpanded ? 'Immersive Mode' : 'Restore Full UI'}
        </button>
      )}

      {/* ── Chat History Sidebar ── */}
      <ChatHistorySidebar
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        activeSessionId={activeSessionId}
      />

      <audio id="agent-audio" autoPlay className="hidden" />
    </div>
  );
}

