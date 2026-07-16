'use client';

import { useGraphStore } from '@/store/graph';
import { Network } from 'lucide-react';

/** Floating legend for the RAG animation colours */
export function GraphLegendBadges() {
  return (
    <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1.5 rounded-lg border border-border/60 bg-bg-sidebar/80 backdrop-blur-sm p-2.5">
      <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted/70 mb-0.5">Graph Legend</p>
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-accent-primary shadow-[0_0_6px_hsl(var(--accent-primary))]" />
        <span className="text-[10px] text-text-secondary">Currently Cited</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-accent-cyan shadow-[0_0_6px_hsl(var(--accent-cyan))]" />
        <span className="text-[10px] text-text-secondary">Previously Cited</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-bg-elevated border border-border/60" />
        <span className="text-[10px] text-text-secondary">Other Nodes</span>
      </div>
    </div>
  );
}

/** Small badge showing how many nodes are currently highlighted */
export function NodeHighlightBadge() {
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
export function GraphEmptyOverlay() {
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
