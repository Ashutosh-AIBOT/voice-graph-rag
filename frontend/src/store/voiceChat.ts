import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface VoiceChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  citedNodes?: string[];  // node names from RAG retrieval
}

export interface VoiceChatSession {
  id: string;
  title: string;          // auto-generated from first user message
  docId: string;
  docName: string;
  createdAt: number;
  updatedAt: number;
  messages: VoiceChatMessage[];
}

interface VoiceChatState {
  sessions: VoiceChatSession[];
  activeSessionId: string | null;
  // Actions
  createSession: (docId: string, docName: string) => string;
  addMessage: (sessionId: string, msg: Omit<VoiceChatMessage, 'id'>) => void;
  setActiveSession: (id: string | null) => void;
  deleteSession: (id: string) => void;
  clearAll: () => void;
  /** Export a session as a Markdown string for download */
  exportSessionAsMarkdown: (sessionId: string) => string;
  getActiveSession: () => VoiceChatSession | null;
}

const clientStorage = {
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
  },
};

export const useVoiceChatStore = create<VoiceChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,

      createSession: (docId, docName) => {
        const id = crypto.randomUUID();
        const session: VoiceChatSession = {
          id,
          docId,
          docName,
          title: `Chat with ${docName}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
        };
        set((s) => ({ sessions: [session, ...s.sessions], activeSessionId: id }));
        return id;
      },

      addMessage: (sessionId, msg) =>
        set((s) => ({
          sessions: s.sessions.map((sess) => {
            if (sess.id !== sessionId) return sess;
            const newMsg: VoiceChatMessage = { ...msg, id: crypto.randomUUID() };
            // Auto-update title from first user message
            const isFirstUser = sess.messages.length === 0 && msg.role === 'user';
            return {
              ...sess,
              title: isFirstUser
                ? msg.content.slice(0, 48) + (msg.content.length > 48 ? '…' : '')
                : sess.title,
              messages: [...sess.messages, newMsg],
              updatedAt: Date.now(),
            };
          }),
        })),

      setActiveSession: (id) => set({ activeSessionId: id }),

      deleteSession: (id) =>
        set((s) => ({
          sessions: s.sessions.filter((sess) => sess.id !== id),
          activeSessionId: s.activeSessionId === id ? null : s.activeSessionId,
        })),

      clearAll: () => set({ sessions: [], activeSessionId: null }),

      exportSessionAsMarkdown: (sessionId) => {
        const sess = get().sessions.find((s) => s.id === sessionId);
        if (!sess) return '';
        const lines: string[] = [
          `# 🎙️ Voice RAG Chat: ${sess.title}`,
          ``,
          `**Document:** ${sess.docName}`,
          `**Session ID:** \`${sess.id}\``,
          `**Started:** ${new Date(sess.createdAt).toLocaleString()}`,
          `**Last Updated:** ${new Date(sess.updatedAt).toLocaleString()}`,
          ``,
          `---`,
          ``,
        ];
        sess.messages.forEach((m) => {
          const speaker = m.role === 'user' ? '🧑 **You**' : '🤖 **Assistant**';
          const time = new Date(m.timestamp).toLocaleTimeString();
          lines.push(`${speaker} _(${time})_`);
          lines.push(``);
          lines.push(m.content);
          if (m.citedNodes && m.citedNodes.length > 0) {
            lines.push(``);
            lines.push(`> **Graph nodes referenced:** ${m.citedNodes.join(', ')}`);
          }
          lines.push(``);
          lines.push(`---`);
          lines.push(``);
        });
        return lines.join('\n');
      },

      getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        return sessions.find((s) => s.id === activeSessionId) ?? null;
      },
    }),
    {
      name: 'voicerag-voice-chat-history',
      storage: createJSONStorage(() => clientStorage),
    }
  )
);
