'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useDocumentsStore } from '@/store/documents';
import { useGraphStore } from '@/store/graph';
import { useVoiceChatStore } from '@/store/voiceChat';
import { useGraphData } from '@/hooks/useGraphData';
import { useLiveKitGraphSync } from '@/hooks/useLiveKitGraphSync';
import { VoiceControls } from '@/components/voice/VoiceControls';
import { ChatHistorySidebar } from '@/components/voice/ChatHistorySidebar';
import { TranscriptStrip } from '@/components/voice/TranscriptStrip';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/axios';
import {
  Mic2, ChevronDown, Network, FileText,
  Sparkles, Volume2, Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Load ForceGraph3D lazily (Three.js is heavy)
const GraphVisualization = dynamic(
  () => import('@/components/graph/GraphVisualization').then((m) => ({ default: m.GraphVisualization })),
  { ssr: false }
);

type AgentState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

import { AvatarPanel } from '@/components/voice/AvatarPanel';

/** Document selector dropdown */
function DocSelector({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (id: string, name: string) => void;
  disabled?: boolean;
}) {
  const documents = useDocumentsStore((s) => s.documents).filter((d) => d.status === 'COMPLETED');

  return (
    <div className="relative">
      <FileText className="absolute left-3 top-2.5 h-4 w-4 text-text-muted pointer-events-none" />
      <select
        value={value}
        onChange={(e) => {
          const doc = documents.find((d) => d.id === e.target.value);
          if (doc) onChange(doc.id, doc.name);
        }}
        disabled={disabled || documents.length === 0}
        className={cn(
          'w-full appearance-none rounded-lg border border-border/60 bg-bg-elevated',
          'pl-9 pr-8 py-2 text-sm text-text-primary',
          'focus:outline-none focus:ring-2 focus:ring-accent-violet/40',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors'
        )}
      >
        <option value="default">General Chat (No Document)</option>
        {documents.map((doc) => (
          <option key={doc.id} value={doc.id}>
            {doc.name}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-text-muted pointer-events-none" />
    </div>
  );
}

/** Floating legend for the RAG animation colours */
function GraphLegendBadges() {
  return (
    <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1.5 rounded-lg border border-border/60 bg-bg-sidebar/80 backdrop-blur-sm p-2.5">
      <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted/70 mb-0.5">Graph Legend</p>
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 shadow-[0_0_6px_#FFD700]" />
        <span className="text-[10px] text-text-secondary">Currently Cited</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_theme(colors.cyan.400)]" />
        <span className="text-[10px] text-text-secondary">Previously Cited</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-bg-elevated border border-border/60" />
        <span className="text-[10px] text-text-secondary">Other Nodes</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function VoiceRagPage() {
  useGraphData(); // Keep graph data in sync

  const user = useAuthStore((s) => s.user);
  const setDim = useGraphStore((s) => s.setDim);
  const clearRagHighlights = useGraphStore((s) => s.clearRagHighlights);

  const createSession = useVoiceChatStore((s) => s.createSession);
  const setActiveSession = useVoiceChatStore((s) => s.setActiveSession);
  const addMessage = useVoiceChatStore((s) => s.addMessage);

  // Switch the global graph to 3D mode when this page is active
  useEffect(() => {
    setDim(3);
    return () => setDim(2); // restore 2D on unmount
  }, [setDim]);

  const [selectedDoc, setSelectedDoc] = useState<{ id: string; name: string } | null>({ id: 'default', name: 'General Chat (No Document)' });
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [agentTranscript, setAgentTranscript] = useState('');

  // Ref so LiveKit event callbacks always read the latest sessionId (avoids stale closure)
  const sessionIdRef = useRef<string | null>(null);
  useEffect(() => { sessionIdRef.current = activeSessionId; }, [activeSessionId]);

  // LiveKit token + room state
  const livekitRef = useRef<{ room: any; token: string; url: string } | null>(null);

  // Wire the graph sync hook
  useLiveKitGraphSync(activeSessionId);

  // ── Connect to LiveKit ──────────────────────────────────────────────────
  const handleConnect = useCallback(async () => {
    if (!selectedDoc || !user) return;
    setAgentState('connecting');
    try {
      // 1. Fetch token from backend
      const { data } = await api.post('/livekit-token/', { doc_id: selectedDoc.id });
      const { token, url, room: roomName } = data as { token: string; url: string; room: string };

      // 2. Dynamically import LiveKit client (avoids SSR issues)
      const { Room, RoomEvent, DataPacket_Kind } = await import('livekit-client');
      const room = new Room({ adaptiveStream: true, dynacast: true });

      // 3. Forward DataChannel messages to our graph sync listener
      room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
        window.dispatchEvent(new CustomEvent('livekit:data', { detail: payload }));
      });

      // 4. Track transcription via track metadata / text messages
      room.on(RoomEvent.TranscriptionReceived, (segments: any[]) => {
        segments.forEach((seg: any) => {
          if (seg.final) {
            const sessId = sessionIdRef.current; // use ref to avoid stale closure
            if (seg.participantIdentity === String(user.id)) {
              // User turn finalised
              if (sessId) addMessage(sessId, { role: 'user', content: seg.text, timestamp: Date.now() });
              setLiveTranscript('');
            } else {
              // Agent turn finalised
              if (sessId) addMessage(sessId, { role: 'assistant', content: seg.text, timestamp: Date.now() });
              setAgentTranscript('');
            }
          } else {
            if (seg.participantIdentity === String(user.id)) setLiveTranscript(seg.text);
            else setAgentTranscript(seg.text);
          }
        });
      });

      // 5. Track agent state changes via metadata
      room.on(RoomEvent.ParticipantMetadataChanged, (_metadata: string | undefined, participant: any) => {
        if (participant.identity !== String(user.id)) {
          try {
            const meta = JSON.parse(participant.metadata ?? '{}');
            if (meta.agent_state) setAgentState(meta.agent_state as AgentState);
          } catch {}
        }
      });

      // Attach remote audio tracks to our hidden audio element
      room.on(RoomEvent.TrackSubscribed, (track: any) => {
        if (track.kind === 'audio') {
          const audioElement = document.getElementById('agent-audio') as HTMLAudioElement;
          if (audioElement) {
            track.attach(audioElement);
          }
        }
      });

      // Detach audio tracks cleanly
      room.on(RoomEvent.TrackUnsubscribed, (track: any) => {
        if (track.kind === 'audio') {
          const audioElement = document.getElementById('agent-audio') as HTMLAudioElement;
          if (audioElement) {
            track.detach(audioElement);
          }
        }
      });

      room.on(RoomEvent.Disconnected, () => {
        setIsConnected(false);
        setAgentState('idle');
        clearRagHighlights();
      });

      await room.connect(url, token);
      livekitRef.current = { room, token, url };
      setIsConnected(true);
      setAgentState('listening');

      // Safely request microphone access after connection state is updated
      room.localParticipant.setMicrophoneEnabled(true).catch(err => {
        console.warn('Microphone access denied or error:', err);
      });

      // 6. Create a new chat session
      const sessId = createSession(selectedDoc.id, selectedDoc.name);
      setActiveSessionId(sessId);
    } catch (err) {
      console.error('LiveKit connect error:', err);
      setAgentState('error');
      setTimeout(() => setAgentState('idle'), 3000);
    }
  }, [selectedDoc, user, activeSessionId, createSession, addMessage, clearRagHighlights]);

  /** Persist the current session to Django backend */
  const syncSessionToBackend = useCallback(async (sessionId: string | null) => {
    if (!sessionId) return;
    const session = useVoiceChatStore.getState().sessions.find(s => s.id === sessionId);
    if (!session || session.messages.length === 0) return;
    try {
      await api.post('/voice-chat/sessions/', {
        id: session.id,
        title: session.title,
        doc_id: session.docId,
        doc_name: session.docName,
        messages: session.messages,
      });
    } catch (err) {
      console.warn('Failed to sync session to backend:', err);
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    // Sync the session to backend before disconnecting
    await syncSessionToBackend(activeSessionId);

    if (livekitRef.current?.room) {
      await livekitRef.current.room.disconnect();
    }
    livekitRef.current = null;
    setIsConnected(false);
    setAgentState('idle');
    setLiveTranscript('');
    setAgentTranscript('');
    clearRagHighlights();
  }, [clearRagHighlights, activeSessionId, syncSessionToBackend]);

  const handleToggleMute = useCallback(async () => {
    const room = livekitRef.current?.room;
    if (!room) return;
    const localParticipant = room.localParticipant;
    const muted = !isMuted;
    await localParticipant.setMicrophoneEnabled(!muted);
    setIsMuted(muted);
  }, [isMuted]);

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

        {/* Document selector */}
        <div className="w-64">
          <DocSelector
            value={selectedDoc?.id ?? ''}
            onChange={(id, name) => setSelectedDoc({ id, name })}
            disabled={isConnected}
          />
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
              {!selectedDoc
                ? 'Select a document above to begin a voice conversation grounded in your knowledge graph.'
                : isConnected
                  ? `Connected to "${selectedDoc.name}". Speak naturally — the graph will light up as I retrieve answers.`
                  : `Ready to talk about "${selectedDoc.name}". Press Start to connect.`
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
              selectedDoc={selectedDoc}
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

/** Small badge showing how many nodes are currently highlighted */
function NodeHighlightBadge() {
  const ragHighlightedIds = useGraphStore((s) => s.ragHighlightedIds);
  if (ragHighlightedIds.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-accent-cyan/30 bg-accent-cyan/10 px-3 py-1">
      <Network className="h-3 w-3 text-accent-cyan" />
      <span className="text-[11px] font-semibold text-accent-cyan">
        {ragHighlightedIds.length} node{ragHighlightedIds.length !== 1 ? 's' : ''} cited
      </span>
    </div>
  );
}

/** Overlay shown when graph has no data yet */
function GraphEmptyOverlay() {
  const nodes = useGraphStore((s) => s.data.nodes);
  if (nodes.length > 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg-base/60 backdrop-blur-sm">
      <Network className="h-10 w-10 text-text-muted/30" />
      <p className="text-sm font-medium text-text-muted/60">No graph data yet</p>
      <p className="text-xs text-text-muted/40">Upload and process a document to see the knowledge graph</p>
    </div>
  );
}
