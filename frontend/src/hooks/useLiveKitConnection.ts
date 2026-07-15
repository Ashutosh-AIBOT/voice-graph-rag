'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth';
import { useDocumentsStore } from '@/store/documents';
import { useGraphStore } from '@/store/graph';
import { useVoiceChatStore } from '@/store/voiceChat';
import api from '@/lib/axios';

export type AgentState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

export function useLiveKitConnection(
  activeSessionId: string | null,
  setActiveSessionId: (id: string | null) => void
) {
  const user = useAuthStore((s) => s.user);
  const selectedDocumentIds = useDocumentsStore((s) => s.selectedDocumentIds);
  const documents = useDocumentsStore((s) => s.documents);
  const clearRagHighlights = useGraphStore((s) => s.clearRagHighlights);
  
  const createSession = useVoiceChatStore((s) => s.createSession);
  const addMessage = useVoiceChatStore((s) => s.addMessage);
  
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [agentTranscript, setAgentTranscript] = useState('');

  // Ref so LiveKit event callbacks always read the latest sessionId (avoids stale closure)
  const sessionIdRef = useRef<string | null>(null);
  useEffect(() => { sessionIdRef.current = activeSessionId; }, [activeSessionId]);

  // Deduplication for transcription segments
  const seenSegmentIds = useRef<Set<string>>(new Set());

  // LiveKit token + room state
  const livekitRef = useRef<{ room: any; token: string; url: string } | null>(null);

  const handleConnect = useCallback(async () => {
    if (!user) return;
    setAgentState('connecting');
    try {
      const payloadDocs = selectedDocumentIds.length > 0 ? selectedDocumentIds : ["default"];
      const { data } = await api.post('/livekit-token/', { doc_ids: payloadDocs });
      const { token, url, room: roomName, doc_summary } = data as { token: string; url: string; room: string; doc_summary?: string };

      const { Room, RoomEvent } = await import('livekit-client');
      const room = new Room({ adaptiveStream: true, dynacast: true });

      room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
        window.dispatchEvent(new CustomEvent('livekit:data', { detail: payload }));
      });

      room.on(RoomEvent.TranscriptionReceived, (segments: any[]) => {
        const localIdentity = room.localParticipant?.identity;
        segments.forEach((seg: any) => {
          if (seg.final) {
            const segKey = `${seg.id ?? seg.text}-${seg.participantIdentity}`;
            if (seenSegmentIds.current.has(segKey)) return;
            seenSegmentIds.current.add(segKey);
            if (seenSegmentIds.current.size > 200) seenSegmentIds.current.clear();

            const sessId = sessionIdRef.current;
            const isUser = seg.participantIdentity === localIdentity;
            if (isUser) {
              if (sessId && seg.text?.trim()) addMessage(sessId, { role: 'user', content: seg.text, timestamp: Date.now() });
              setLiveTranscript('');
            } else {
              if (sessId && seg.text?.trim()) addMessage(sessId, { role: 'assistant', content: seg.text, timestamp: Date.now() });
              setAgentTranscript('');
            }
          } else {
            const localIdentity2 = room.localParticipant?.identity;
            if (seg.participantIdentity === localIdentity2) setLiveTranscript(seg.text);
            else setAgentTranscript(seg.text);
          }
        });
      });

      room.on(RoomEvent.ParticipantMetadataChanged, (_metadata: string | undefined, participant: any) => {
        if (participant.identity !== String(user.id)) {
          try {
            const meta = JSON.parse(participant.metadata ?? '{}');
            if (meta.agent_state) setAgentState(meta.agent_state as AgentState);
          } catch {}
        }
      });

      room.on(RoomEvent.TrackSubscribed, (track: any) => {
        if (track.kind === 'audio') {
          const audioElement = document.getElementById('agent-audio') as HTMLAudioElement;
          if (audioElement) track.attach(audioElement);
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track: any) => {
        if (track.kind === 'audio') {
          const audioElement = document.getElementById('agent-audio') as HTMLAudioElement;
          if (audioElement) track.detach(audioElement);
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

      room.localParticipant.setMicrophoneEnabled(true).catch(err => {
        console.warn('Microphone access denied or error:', err);
      });

      const selectedDocsData = documents.filter(d => selectedDocumentIds.includes(d.id));
      const combinedNames = selectedDocsData.length > 0 ? selectedDocsData.map(d => d.name).join(', ') : 'General Chat (No Document)';
      const combinedId = selectedDocumentIds.length > 0 ? selectedDocumentIds.join(',') : 'default';
      const sessId = createSession(combinedId, combinedNames);
      setActiveSessionId(sessId);
      
      if (doc_summary) {
        addMessage(sessId, { 
          role: 'assistant', 
          content: `📚 **Document Context Loaded**\n\n${doc_summary}`, 
          timestamp: Date.now() 
        });
      }
    } catch (err) {
      console.error('LiveKit connect error:', err);
      setAgentState('error');
      setTimeout(() => setAgentState('idle'), 3000);
    }
  }, [selectedDocumentIds, documents, user, createSession, addMessage, clearRagHighlights, setActiveSessionId]);

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
    await syncSessionToBackend(sessionIdRef.current);
    if (livekitRef.current?.room) {
      await livekitRef.current.room.disconnect();
    }
    livekitRef.current = null;
    setIsConnected(false);
    setAgentState('idle');
    setLiveTranscript('');
    setAgentTranscript('');
    clearRagHighlights();
  }, [clearRagHighlights, syncSessionToBackend]);

  const handleToggleMute = useCallback(async () => {
    const room = livekitRef.current?.room;
    if (!room) return;
    const localParticipant = room.localParticipant;
    const muted = !isMuted;
    await localParticipant.setMicrophoneEnabled(!muted);
    setIsMuted(muted);
  }, [isMuted]);

  return {
    agentState,
    isMuted,
    isConnected,
    liveTranscript,
    agentTranscript,
    handleConnect,
    handleDisconnect,
    handleToggleMute,
  };
}
