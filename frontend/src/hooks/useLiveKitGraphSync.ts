'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useGraphStore, RagCitedEntity } from '@/store/graph';
import { useVoiceChatStore } from '@/store/voiceChat';

interface GraphHighlightMessage {
  type: 'graph_highlight';
  entities: RagCitedEntity[];
  sessionId?: string;
}

/**
 * Listens to LiveKit DataChannel messages from the RAG agent.
 * When a `graph_highlight` message arrives, animates graph nodes
 * one-by-one in descending priority (relevance score) order.
 *
 * Must be used inside a <LiveKitRoom> component tree.
 */
export function useLiveKitGraphSync(activeSessionId: string | null) {
  const setAnimatingNode = useGraphStore((s) => s.setAnimatingNode);
  const addRagHighlight = useGraphStore((s) => s.addRagHighlight);
  const clearRagHighlights = useGraphStore((s) => s.clearRagHighlights);
  const setHighlighted = useGraphStore((s) => s.setHighlighted);
  const addMessage = useVoiceChatStore((s) => s.addMessage);

  // Track timeouts to prevent race conditions
  const timeoutIds = useRef<NodeJS.Timeout[]>([]);

  // Keep a stable ref to avoid stale closures in event handlers
  const activeSessionRef = useRef(activeSessionId);
  useEffect(() => { activeSessionRef.current = activeSessionId; }, [activeSessionId]);

  const handleGraphHighlight = useCallback(
    (entities: RagCitedEntity[]) => {
      // Sort by score descending — highest relevance first
      const sorted = [...entities].sort((a, b) => b.score - a.score);
      const ids = sorted.map((e) => e.id);
      const names = sorted.map((e) => e.name);

      // Clear previous RAG highlights before new turn
      clearRagHighlights();
      setHighlighted([], []);

      // Clear any existing staggered animations to prevent race conditions
      timeoutIds.current.forEach(clearTimeout);
      timeoutIds.current = [];

      // Animate one-by-one with 400 ms stagger
      sorted.forEach((entity, i) => {
        // Phase 1: gold pulse on this node
        timeoutIds.current.push(setTimeout(() => {
          setAnimatingNode(entity.id);
          addRagHighlight(entity.id);
        }, i * 450));

        // Phase 2: clear the gold pulse (leave teal glow)
        timeoutIds.current.push(setTimeout(() => {
          setAnimatingNode(null);
        }, i * 450 + 400));
      });

      // After all animations: set full highlighted set for standard dim behaviour
      timeoutIds.current.push(setTimeout(() => {
        setHighlighted(ids, []);
        // Store cited node names in the last assistant message
        const sessId = activeSessionRef.current;
        if (sessId) {
          addMessage(sessId, {
            role: 'assistant',
            content: '', // will be filled by transcript hook
            timestamp: Date.now(),
            citedNodes: names,
          });
        }
      }, sorted.length * 450 + 100);
    },
    [clearRagHighlights, setHighlighted, setAnimatingNode, addRagHighlight, addMessage]
  );

  // Register DataChannel listener on the LiveKit room via window event
  // (avoids requiring @livekit/components-react hooks at this layer)
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const payload = (e as CustomEvent<Uint8Array>).detail;
        const msg: GraphHighlightMessage = JSON.parse(new TextDecoder().decode(payload));
        if (msg.type === 'graph_highlight' && Array.isArray(msg.entities)) {
          handleGraphHighlight(msg.entities);
        }
      } catch {
        // Malformed message — ignore
      }
    };

    window.addEventListener('livekit:data', handler);
    return () => {
      window.removeEventListener('livekit:data', handler);
      timeoutIds.current.forEach(clearTimeout);
    };
  }, [handleGraphHighlight]);

  return { clearRagHighlights };
}
