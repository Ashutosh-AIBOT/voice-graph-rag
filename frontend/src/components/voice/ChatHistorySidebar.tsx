'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useVoiceChatStore, VoiceChatSession } from '@/store/voiceChat';
import { MessageSquare, Plus, Download, Trash2, ChevronLeft, Search, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  activeSessionId: string | null;
}

function groupByDate(sessions: VoiceChatSession[]) {
  const now = Date.now();
  const day = 86400000;
  const groups: Record<string, VoiceChatSession[]> = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    Earlier: [],
  };
  sessions.forEach((s) => {
    const age = now - s.updatedAt;
    if (age < day) groups['Today'].push(s);
    else if (age < 2 * day) groups['Yesterday'].push(s);
    else if (age < 7 * day) groups['This Week'].push(s);
    else groups['Earlier'].push(s);
  });
  return groups;
}

export function ChatHistorySidebar({
  isOpen,
  onClose,
  onNewChat,
  onSelectSession,
  activeSessionId,
}: ChatHistorySidebarProps) {
  const sessions = useVoiceChatStore((s) => s.sessions);
  const deleteSession = useVoiceChatStore((s) => s.deleteSession);
  const exportSessionAsMarkdown = useVoiceChatStore((s) => s.exportSessionAsMarkdown);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = sessions.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.docName.toLowerCase().includes(search.toLowerCase())
  );
  const groups = groupByDate(filtered);

  const handleDownload = useCallback(
    (sessionId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const md = exportSessionAsMarkdown(sessionId);
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voice-rag-${sessionId.slice(0, 8)}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [exportSessionAsMarkdown]
  );

  const handleDelete = useCallback(
    (sessionId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirmDelete === sessionId) {
        deleteSession(sessionId);
        setConfirmDelete(null);
      } else {
        setConfirmDelete(sessionId);
        setTimeout(() => setConfirmDelete(null), 3000);
      }
    },
    [confirmDelete, deleteSession]
  );

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <aside
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l border-border/60',
          'bg-bg-sidebar/95 backdrop-blur-xl shadow-2xl',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 px-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-accent-primary" />
            <span className="text-sm font-semibold text-text-primary">Chat History</span>
            <span className="rounded-full bg-accent-primary/20 px-2 py-0.5 text-[10px] font-bold text-accent-primary">
              {sessions.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-text-muted hover:bg-bg-elevated hover:text-text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="shrink-0 p-3">
          <button
            onClick={onNewChat}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5',
              'bg-gradient-to-r from-accent-primary to-accent-cyan text-white text-sm font-semibold',
              'hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-accent-primary/20'
            )}
          >
            <Plus className="h-4 w-4" />
            New Chat
          </button>
        </div>

        {/* Search */}
        <div className="shrink-0 px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted" />
            <input
              type="text"
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                'w-full rounded-lg border border-border/60 bg-bg-elevated pl-8 pr-3 py-2',
                'text-xs text-text-primary placeholder:text-text-muted/60',
                'focus:outline-none focus:ring-1 focus:ring-accent-primary/50'
              )}
            />
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin space-y-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-12 text-center">
              <MessageSquare className="h-8 w-8 text-text-muted/40 mb-2" />
              <p className="text-xs text-text-muted">
                {search ? 'No matching chats' : 'No voice chats yet'}
              </p>
              <p className="text-[11px] text-text-muted/60 mt-1">
                Start talking to a document above
              </p>
            </div>
          ) : (
            Object.entries(groups).map(([label, group]) =>
              group.length === 0 ? null : (
                <div key={label}>
                  <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-widest text-text-muted/60">
                    {label}
                  </p>
                  <div className="space-y-1">
                    {group.map((sess) => (
                      <div
                        key={sess.id}
                        onClick={() => onSelectSession(sess.id)}
                        className={cn(
                          'group relative cursor-pointer rounded-lg border px-3 py-2.5',
                          'transition-all duration-150',
                          sess.id === activeSessionId
                            ? 'border-accent-primary/40 bg-accent-primary/10 shadow-sm'
                            : 'border-border/40 bg-bg-elevated/50 hover:border-border hover:bg-bg-elevated'
                        )}
                      >
                        {/* Session info */}
                        <p className="truncate text-xs font-medium text-text-primary pr-14">
                          {sess.title}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-text-muted/50 shrink-0" />
                          <p className="text-[10px] text-text-muted/70 truncate">
                            {sess.docName}
                          </p>
                        </div>
                        <p className="mt-0.5 text-[10px] text-text-muted/50">
                          {sess.messages.length} message{sess.messages.length !== 1 ? 's' : ''} ·{' '}
                          {new Date(sess.updatedAt).toLocaleDateString()}
                        </p>

                        {/* Action buttons (appear on hover) */}
                        <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleDownload(sess.id, e)}
                            title="Download as Markdown"
                            className="rounded p-1 text-text-muted hover:bg-bg-surface hover:text-accent-cyan transition-colors"
                          >
                            <Download className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(sess.id, e)}
                            title={confirmDelete === sess.id ? 'Click again to confirm' : 'Delete session'}
                            className={cn(
                              'rounded p-1 transition-colors',
                              confirmDelete === sess.id
                                ? 'bg-error/20 text-error'
                                : 'text-text-muted hover:bg-bg-surface hover:text-error'
                            )}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )
          )}
        </div>
      </aside>
    </>
  );
}
