'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useVoiceChatStore, VoiceChatMessage } from '@/store/voiceChat';
import { Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TranscriptStripProps {
  sessionId: string | null;
  liveTranscript: string;
  agentTranscript: string;
  onToggleHistory: () => void;
  onNewChat: () => void;
}

function MessageBubble({ msg }: { msg: VoiceChatMessage }) {
  const isUser = msg.role === 'user';
  // Note: system bubble (transparent dashed) can be added if your store has role='system'
  const isSystem = msg.role === 'system';

  return (
    <div className={cn(
      'shrink-0 max-w-[280px] rounded-[11px] px-[12px] py-[7px] text-[12px] whitespace-normal leading-relaxed',
      isSystem ? 'bg-transparent border border-dashed border-border text-text3 italic'
      : isUser
        ? 'bg-panel2 text-text'
        : 'bg-accent text-accent-text'
    )}>
      {msg.content || <span className="italic opacity-50">…</span>}
    </div>
  );
}

export function TranscriptStrip({
  sessionId,
  liveTranscript,
  agentTranscript,
  onNewChat,
}: TranscriptStripProps) {
  const messages = useVoiceChatStore((s) =>
    sessionId ? s.sessions.find((sess) => sess.id === sessionId)?.messages ?? [] : []
  );
  const exportSessionAsMarkdown = useVoiceChatStore((s) => s.exportSessionAsMarkdown);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to end on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [messages, liveTranscript, agentTranscript]);

  const handleDownloadSession = useCallback(() => {
    if (!sessionId) return;
    const md = exportSessionAsMarkdown(sessionId);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-rag-session.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [sessionId, exportSessionAsMarkdown]);

  return (
    <div className="flex items-center rounded-[12px] border border-border bg-panel px-[14px] py-[11px] h-[64px] relative">
      
      {/* Label */}
      <div className="shrink-0 mr-4">
        <span className="text-[10.5px] font-bold text-text3 tracking-[0.02em]">TRANSCRIPT</span>
      </div>

      {/* Bubble Row */}
      <div 
        ref={scrollRef}
        className="flex-1 flex items-center gap-[8px] overflow-x-auto scrollbar-none scroll-smooth mr-4 mask-edges"
        style={{ maskImage: 'linear-gradient(to right, transparent, black 10px, black calc(100% - 20px), transparent)' }}
      >
        {messages.length === 0 && !liveTranscript && !agentTranscript ? (
          <span className="text-[11px] text-text3 italic px-2">No transcript yet...</span>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {/* Live user transcript (in-progress) */}
            {liveTranscript && (
              <div className="shrink-0 max-w-[280px] rounded-[11px] bg-panel2 text-text px-[12px] py-[7px] text-[12px] whitespace-normal leading-relaxed italic opacity-80">
                {liveTranscript}
                <span className="ml-1 inline-block h-2 w-0.5 bg-accent animate-pulse" />
              </div>
            )}

            {/* Live agent response (in-progress) */}
            {agentTranscript && (
              <div className="shrink-0 max-w-[280px] rounded-[11px] bg-accent text-accent-text px-[12px] py-[7px] text-[12px] whitespace-normal leading-relaxed opacity-90">
                {agentTranscript}
                <span className="ml-1 inline-block h-2 w-0.5 bg-accent-text animate-pulse" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="shrink-0 flex items-center gap-[6px] pl-[14px] border-l border-border/50">
        <Button variant="tool" onClick={onNewChat} title="New Chat">
          <Plus className="h-[14px] w-[14px]" />
        </Button>
        {sessionId && messages.length > 0 && (
          <Button variant="tool" onClick={handleDownloadSession} title="Download Transcript">
            <Download className="h-[14px] w-[14px]" />
          </Button>
        )}
      </div>

    </div>
  );
}
