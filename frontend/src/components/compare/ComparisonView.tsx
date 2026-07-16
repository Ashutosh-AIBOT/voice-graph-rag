'use client';

import { useState } from 'react';
import { Loader2, Search, Play } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '@/lib/axios';

interface ColResult {
  answer: string;
  confidence: number;
  timeMs: number;
  nodes: number;
  hops: number;
}

interface ComparisonData {
  query: string;
  results: { graph: ColResult; vector: ColResult };
  verdict: string;
}

export function ComparisonView() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ComparisonData | null>(null);

  async function compare() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await api.post('/query/compare/', { query });
      const comps = res.comparisons || res.results || {};
      
      const mapped: ComparisonData = {
        query,
        results: {
          graph: {
            answer: comps.graph?.answer || 'No answer generated.',
            confidence: Math.round((comps.graph?.confidence ?? 0) * 100),
            timeMs: Math.round((comps.graph?.response_time ?? 0) * 1000),
            nodes: comps.graph?.nodes_retrieved ?? 0,
            hops: comps.graph?.hops ?? 2,
          },
          vector: {
            answer: comps.vector?.answer || 'No answer generated.',
            confidence: Math.round((comps.vector?.confidence ?? 0) * 100),
            timeMs: Math.round((comps.vector?.response_time ?? 0) * 1000),
            nodes: comps.vector?.nodes_retrieved ?? 0,
            hops: 0,
          }
        },
        verdict: res.verdict || 'Comparison complete.',
      };
      setData(mapped);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to compare retrieval modes.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-[16px] overflow-y-auto p-[16px] scrollbar-thin bg-bg2">
      
      {/* Controls & Input */}
      <div className="shrink-0 flex flex-col gap-[12px] bg-panel border border-border rounded-[12px] p-[16px] shadow-sm">
        <div className="flex gap-[8px]">
          <div className="relative flex-1">
            <Search className="absolute left-[12px] top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-text3" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && compare()}
              placeholder="Enter a query to compare Graph vs Vector retrieval..."
              className="w-full bg-panel2 border border-border rounded-[9px] pl-[32px] pr-[12px] py-[10px] text-[12px] text-text focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <button 
            onClick={compare}
            disabled={loading || !query.trim()}
            className="btn-accent flex items-center gap-[6px] px-[16px]"
          >
            {loading ? <Loader2 className="h-[14px] w-[14px] animate-spin" /> : <Play className="h-[14px] w-[14px]" />}
            Compare
          </button>
        </div>
        {error && (
          <div className="text-[11.5px] text-error font-medium p-[8px] rounded-[6px] bg-error/10 border border-error/20">
            {error}
          </div>
        )}
      </div>

      {data && (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-[14px]">
          
          {/* Left Column (Graph Mode) */}
          <div className="flex flex-col gap-[12px] min-h-0">
            <div className="flex items-center justify-between shrink-0">
              <div className="px-[10px] py-[4px] rounded-full bg-accent-soft text-accent text-[10px] font-bold tracking-[0.06em] uppercase border border-accent/20">
                Graph Mode
              </div>
              <div className="text-[11px] font-mono text-text3 bg-panel border border-border px-[8px] py-[3px] rounded-[6px]">
                {data.results.graph.timeMs}ms
              </div>
            </div>
            
            <div className="bg-panel border border-border rounded-[12px] p-[16px] shadow-sm flex-1 overflow-y-auto scrollbar-thin">
               <div className="prose prose-invert prose-sm max-w-none text-[12px] leading-[1.6] text-text2">
                 <ReactMarkdown>{data.results.graph.answer}</ReactMarkdown>
               </div>
            </div>
            
            <div className="shrink-0 grid grid-cols-3 gap-[8px] bg-panel border border-border rounded-[12px] p-[12px] shadow-sm">
               <div className="text-center">
                 <p className="font-mono text-[13px] font-bold text-accent">{data.results.graph.nodes}</p>
                 <p className="text-[9px] font-semibold text-text3 uppercase mt-[2px] tracking-[0.04em]">Nodes</p>
               </div>
               <div className="text-center">
                 <p className="font-mono text-[13px] font-bold text-accent">{data.results.graph.hops}</p>
                 <p className="text-[9px] font-semibold text-text3 uppercase mt-[2px] tracking-[0.04em]">Hops</p>
               </div>
               <div className="text-center">
                 <p className="font-mono text-[13px] font-bold text-accent">{data.results.graph.confidence}%</p>
                 <p className="text-[9px] font-semibold text-text3 uppercase mt-[2px] tracking-[0.04em]">Confidence</p>
               </div>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden lg:flex relative flex-col justify-center">
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-border" />
            <div className="relative z-10 w-[26px] h-[26px] rounded-full bg-panel border border-border flex items-center justify-center text-[9px] font-mono font-bold text-text3 uppercase">
              VS
            </div>
          </div>

          {/* Right Column (Vector Mode) */}
          <div className="flex flex-col gap-[12px] min-h-0 mt-[24px] lg:mt-0">
            <div className="flex items-center justify-between shrink-0">
              <div className="px-[10px] py-[4px] rounded-full bg-panel3 text-text text-[10px] font-bold tracking-[0.06em] uppercase border border-border">
                Vector Mode
              </div>
              <div className="text-[11px] font-mono text-text3 bg-panel border border-border px-[8px] py-[3px] rounded-[6px]">
                {data.results.vector.timeMs}ms
              </div>
            </div>
            
            <div className="bg-panel border border-border rounded-[12px] p-[16px] shadow-sm flex-1 overflow-y-auto scrollbar-thin">
               <div className="prose prose-invert prose-sm max-w-none text-[12px] leading-[1.6] text-text2">
                 <ReactMarkdown>{data.results.vector.answer}</ReactMarkdown>
               </div>
            </div>
            
            <div className="shrink-0 grid grid-cols-3 gap-[8px] bg-panel border border-border rounded-[12px] p-[12px] shadow-sm">
               <div className="text-center">
                 <p className="font-mono text-[13px] font-bold text-text">{data.results.vector.nodes}</p>
                 <p className="text-[9px] font-semibold text-text3 uppercase mt-[2px] tracking-[0.04em]">Nodes</p>
               </div>
               <div className="text-center">
                 <p className="font-mono text-[13px] font-bold text-text">{data.results.vector.hops}</p>
                 <p className="text-[9px] font-semibold text-text3 uppercase mt-[2px] tracking-[0.04em]">Hops</p>
               </div>
               <div className="text-center">
                 <p className="font-mono text-[13px] font-bold text-text">{data.results.vector.confidence}%</p>
                 <p className="text-[9px] font-semibold text-text3 uppercase mt-[2px] tracking-[0.04em]">Confidence</p>
               </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
