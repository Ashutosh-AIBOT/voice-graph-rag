'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useVoiceChatStore, VoiceChatMessage } from '@/store/voiceChat';
import { MessageSquare, History, ChevronDown, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TranscriptStripProps {
  sessionId: string | null;
  liveTranscript: string;
  agentTranscript: string;
  onToggleHistory: () => void;
}

function MessageBubble({ msg }: { msg: VoiceChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className={cn('flex gap-2', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center text-white text-[10px] font-bold mt-0.5">
          AI
        </div>
      )}
      <div className={cn(
        'max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed',
        isUser
          ? 'bg-accent-violet/20 text-text-primary border border-accent-violet/30'
          : 'bg-bg-elevated text-text-primary border border-border/60'
      )}>
        {msg.content || <span className="italic text-text-muted">…</span>}
        {msg.citedNodes && msg.citedNodes.length > 0 && (
          <p className="mt-1.5 text-[10px] text-text-muted/70 border-t border-border/40 pt-1">
            📍 {msg.citedNodes.slice(0, 3).join(', ')}{msg.citedNodes.length > 3 ? ` +${msg.citedNodes.length - 3}` : ''}
          </p>
        )}
      </div>
      {isUser && (
        <div className="h-6 w-6 shrink-0 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-[10px] font-bold text-text-secondary mt-0.5">
          You
        </div>
      )}
    </div>
  );
}

export function TranscriptStrip({
  sessionId,
  liveTranscript,
  agentTranscript,
  onToggleHistory,
}: TranscriptStripProps) {
  const messages = useVoiceChatStore((s) =>
    sessionId ? s.sessions.find((sess) => sess.id === sessionId)?.messages ?? [] : []
  );
  const exportSessionAsMarkdown = useVoiceChatStore((s) => s.exportSessionAsMarkdown);

  const [isExpanded, setIsExpanded] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    <div className={cn(
      'flex flex-col border-t border-border/60 bg-bg-sidebar/80 backdrop-blur-sm',
      'transition-all duration-300',
      isExpanded ? 'h-48' : 'h-10'
    )}>
      {/* Strip header */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border/40 px-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-accent-violet" />
          <span className="text-xs font-semibold text-text-primary">Conversation</span>
          {messages.length > 0 && (
            <span className="rounded-full bg-bg-elevated px-1.5 py-0.5 text-[10px] text-text-muted">
              {messages.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {sessionId && messages.length > 0 && (
            <button
              onClick={handleDownloadSession}
              title="Download session as Markdown"
              className="rounded p-1 text-text-muted hover:bg-bg-elevated hover:text-accent-cyan transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={onToggleHistory}
            title="Chat history"
            className="rounded p-1 text-text-muted hover:bg-bg-elevated hover:text-text-primary transition-colors"
          >
            <History className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded((v) => !v)}
            className="rounded p-1 text-text-muted hover:bg-bg-elevated hover:text-text-primary transition-colors"
          >
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', !isExpanded && 'rotate-180')} />
          </button>
        </div>
      </div>

      {/* Messages area */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2.5 scrollbar-thin">
          {messages.length === 0 && !liveTranscript && !agentTranscript ? (
            <p className="text-center text-[11px] text-text-muted/60 py-4">
              Start speaking to begin the conversation…
            </p>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}

              {/* Live user transcript (in-progress) */}
              {liveTranscript && (
                <div className="flex justify-end gap-2">
                  <div className="max-w-[80%] rounded-xl border border-accent-violet/20 bg-accent-violet/10 px-3 py-2 text-xs text-text-muted italic">
                    {liveTranscript}
                    <span className="ml-1 inline-block h-2 w-0.5 bg-accent-violet animate-pulse" />
                  </div>
                </div>
              )}

              {/* Live agent response (in-progress) */}
              {agentTranscript && (
                <div className="flex justify-start gap-2">
                  <div className="h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center text-white text-[10px] font-bold mt-0.5">
                    AI
                  </div>
                  <div className="max-w-[80%] rounded-xl border border-border/60 bg-bg-elevated px-3 py-2 text-xs text-text-primary">
                    {agentTranscript}
                    <span className="ml-1 inline-block h-2 w-0.5 bg-accent-cyan animate-pulse" />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
