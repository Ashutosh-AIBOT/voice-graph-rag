'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useGraphData } from '@/hooks/useGraphData';
import { useGraphStore } from '@/store/graph';
import { QueryMode } from '@/components/query/QueryPanel';
import { AnswerCard } from '@/components/query/AnswerCard';
import { PathView, Hop } from '@/components/query/PathView';
import { SourceToggle } from '@/components/query/SourceToggle';
import { GraphVisualization } from '@/components/graph/GraphVisualization';
import { Search, Loader2, Sparkles, PlusCircle, Network, ChevronDown, Square } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MultiDocSelector } from '@/components/voice/MultiDocSelector';
import api from '@/lib/axios';
import { useDocumentsStore } from '@/store/documents';
import { useHistoryStore, HistoryItem } from '@/store/history';
import { entityColor } from '@/lib/constants';

interface QueryResult {
  answer: string;
  confidence?: number;
  method?: string;
  citations?: { doc: string; page?: string }[];
  entities?: string[];
  paths?: string[];
  hops?: Hop[];
  context?: string;
  conclusion?: string;
}

const LAST_SESSION_KEY = 'graphrag-last-session';

function loadLastSession(): { query: string; mode: QueryMode; result: QueryResult | null } | null {
  try {
    const raw = localStorage.getItem(LAST_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLastSession(query: string, mode: QueryMode, result: QueryResult | null) {
  try {
    localStorage.setItem(LAST_SESSION_KEY, JSON.stringify({ query, mode, result }));
  } catch {}
}

function clearLastSession() {
  try {
    localStorage.removeItem(LAST_SESSION_KEY);
  } catch {}
}

export function MainQueryView() {
  useGraphData();
  const setHighlighted = useGraphStore((s) => s.setHighlighted);
  const selectEntity = useGraphStore((s) => s.selectEntity);
  const data = useGraphStore((s) => s.data);
  const selectedIds = useDocumentsStore((s) => s.selectedDocumentIds);
  const addHistoryItem = useHistoryStore((s) => s.addItem);

  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<QueryMode>('hybrid');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isDocSelectorOpen, setIsDocSelectorOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const session = loadLastSession();
    if (session) {
      setQuery(session.query);
      setMode(session.mode);
      setResult(session.result);
      if (session.result?.entities) {
        setHighlighted(session.result.entities, session.result.paths || []);
      }
    }
  }, []);

  useEffect(() => {
    if (query || result) {
      saveLastSession(query, mode, result);
    }
  }, [query, mode, result]);

  const runQuery = useCallback(async (overrideQuery?: string) => {
    const q = overrideQuery ?? query;
    if (!q.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const { data: res } = await api.post('/query/', {
        query: q,
        mode,
        document_ids: selectedIds.length > 0 ? selectedIds : undefined,
      });
      const mapped: QueryResult = {
        answer: res.answer,
        confidence: res.confidence,
        method: res.strategy || res.method || mode,
        citations: res.sources?.map((s: string) => ({ doc: s })) || res.citations,
        entities: res.highlighted_entities,
        paths: res.paths,
        hops: res.hops,
        context: res.context,
        conclusion: res.conclusion,
      };
      setResult(mapped);
      if (mapped.entities && mapped.entities.length > 0) {
        useGraphStore.getState().animateHighlightSequence(mapped.entities, () => {
          setHighlighted(mapped.entities || [], mapped.paths || []);
        });
      } else {
        setHighlighted([], mapped.paths || []);
      }

      addHistoryItem({
        id: Date.now().toString(),
        query_text: q,
        retrieval_mode: (res.strategy || mode).toUpperCase(),
        answer_text: res.answer || '',
        answer_preview: (res.answer || '').substring(0, 200),
        response_time: res.response_time ?? 0,
        created_at: new Date().toISOString(),
      });
    } catch (err: any) {
      const backendError = err.response?.data?.error;
      let errorMsg = backendError || 'Failed to process query. Please check your API keys and Neo4j connection.';
      if (err.response?.status === 401) {
        errorMsg = 'Your session has expired. Please log in again.';
      }
      setResult({ answer: `**Error:** ${errorMsg}`, method: mode });
    } finally {
      setLoading(false);
    }
  }, [query, mode, selectedIds, setHighlighted, addHistoryItem]);

  const handleNewChat = useCallback(() => {
    setQuery('');
    setResult(null);
    setHighlighted([], []);
    selectEntity(null);
    clearLastSession();
  }, [setHighlighted, selectEntity]);

  const handleSuggestion = (text: string) => {
    setQuery(text);
    runQuery(text);
  };

  const empty = !result && !loading;

  // Gather entity stats for legend
  const typeCounts: Record<string, number> = {};
  data.nodes.forEach(n => {
    typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
  });
  const legendEntries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="flex h-full w-full flex-col p-[12px] bg-bg2 relative">
      
      {/* Top Controls Row */}
      <div className="flex shrink-0 items-center justify-between pb-[12px]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-text3 tracking-[0.04em]">MODE</span>
            <Tabs value={mode} onValueChange={(v) => setMode(v as QueryMode)}>
              <TabsList>
                <TabsTrigger value="hybrid">Hybrid</TabsTrigger>
                <TabsTrigger value="graph">Graph</TabsTrigger>
                <TabsTrigger value="vector">Vector</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="w-[1px] h-[14px] bg-border/60" />

          <div className="relative">
             <Button variant="ghost" onClick={() => setIsDocSelectorOpen(!isDocSelectorOpen)} className="h-[28px] px-3 gap-2">
               <span className="text-[11px]">{selectedIds.length > 0 ? `${selectedIds.length} docs selected` : 'All Documents'}</span>
               <ChevronDown className="h-[14px] w-[14px] opacity-50" />
             </Button>
             {isDocSelectorOpen && (
                <div className="absolute top-[36px] left-0 z-50 bg-panel border border-border rounded-xl p-4 shadow-xl w-[320px] animate-fade-in">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-display font-semibold text-text text-[13px]">Select Documents</h3>
                    <button onClick={() => setIsDocSelectorOpen(false)} className="text-text3 hover:text-text">✕</button>
                  </div>
                  <MultiDocSelector />
                </div>
              )}
          </div>
        </div>

        <Button variant="ghost" onClick={handleNewChat} className="h-[28px] gap-1.5 px-3">
          <PlusCircle className="h-[14px] w-[14px]" />
          New Chat
        </Button>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 rounded-[14px] border border-border bg-panel overflow-hidden relative flex flex-col">
        
        {/* Ambient Graph Background */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen">
          <GraphVisualization hideControls />
        </div>

        {/* Content Layer */}
        <div className="flex-1 relative z-10 flex flex-col overflow-y-auto scrollbar-thin p-[24px]" ref={scrollRef}>
          {empty ? (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
              <div className="h-[58px] w-[58px] rounded-[16px] bg-accent-soft flex items-center justify-center mb-5 border border-accent/20">
                <Sparkles className="h-[26px] w-[26px] text-accent" />
              </div>
              <h3 className="font-display font-semibold text-[15px] text-text mb-2">Explore your knowledge base</h3>
              <p className="text-[11.5px] text-text3 max-w-[280px] text-center leading-[1.5] mb-8">
                Ask any question and GraphRAG will traverse entity relationships to synthesize a comprehensive answer.
              </p>
              
              {/* Suggestion Chips */}
              <div className="flex flex-wrap items-center justify-center gap-[8px] max-w-[500px]">
                {["What are the key entities?", "Summarize the main topic", "Find contradictions in the text"].map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSuggestion(s)}
                    className="px-[12px] py-[7px] text-[11px] rounded-full border border-border bg-panel2 text-text2 hover:border-accent hover:text-accent transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Results View */
            <div className="w-full max-w-[700px] mx-auto space-y-[24px] pb-[40px] animate-fade-in">
              {/* User Query Bubble inside canvas */}
              <div className="flex justify-end">
                <div className="bg-panel2 border border-border rounded-[14px] px-[16px] py-[10px] text-[13px] text-text max-w-[80%] shadow-sm">
                  {query}
                </div>
              </div>

              {/* Answer Card */}
              <div className="bg-panel border border-border rounded-[14px] p-[16px] shadow-sm backdrop-blur-md">
                 <AnswerCard
                  answer={result?.answer || ''}
                  confidence={result?.confidence}
                  method={result?.method}
                  citations={result?.citations}
                  loading={loading}
                 />
                 
                 {result?.hops && result.hops.length > 0 && (
                  <div className="mt-[16px] pt-[16px] border-t border-border/50">
                    <PathView hops={result.hops} conclusion={result.conclusion} />
                  </div>
                 )}

                 {result && !loading && (
                   <div className="mt-[16px] pt-[16px] border-t border-border/50">
                      <SourceToggle
                        method={result.method || mode}
                        entityCount={result.entities?.length || 0}
                        chunkCount={result.citations?.length || 0}
                        context={result.context}
                      />
                   </div>
                 )}
              </div>
            </div>
          )}
        </div>

        {/* Entity Legend (Absolute bottom-left) */}
        {legendEntries.length > 0 && (
          <div className="absolute bottom-[60px] left-[16px] z-20 w-[150px] bg-panel border border-border rounded-[11px] p-[12px] shadow-sm">
            <h4 className="text-[9.5px] font-bold tracking-[0.06em] text-text3 mb-[10px]">ENTITY TYPES</h4>
            <div className="flex flex-col gap-[8px]">
              {legendEntries.map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-[6px]">
                    <span className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: entityColor(type) }} />
                    <span className="text-[10px] text-text2 truncate max-w-[80px]">{type}</span>
                  </div>
                  <span className="text-[10px] font-mono text-text3">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Input Bar */}
        <div className="shrink-0 p-[8px] bg-panel2 border-t border-border rounded-b-[14px] relative z-20">
          <div className="flex items-center gap-[8px] relative bg-panel rounded-[10px] border border-border px-[14px] py-[10px] shadow-sm focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/20 transition-all">
            <Search className="h-[16px] w-[16px] text-text3 shrink-0" />
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim() && !loading) {
                   runQuery();
                }
              }}
              placeholder="Ask anything about your documents..."
              className="flex-1 bg-transparent text-[12px] text-text placeholder:text-text3 outline-none min-w-0"
              disabled={loading}
            />
            
            {loading ? (
              <Button variant="tool" className="shrink-0 h-[26px] w-[26px] rounded-[6px]" onClick={() => setLoading(false)}>
                <Square className="h-[12px] w-[12px] fill-current text-text3" />
              </Button>
            ) : (
              <Button variant="tool" className="shrink-0 h-[26px] px-[12px] rounded-[6px] bg-accent text-accent-text hover:bg-accent/90" onClick={() => runQuery()}>
                <span className="text-[11px] font-semibold">Send</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}
