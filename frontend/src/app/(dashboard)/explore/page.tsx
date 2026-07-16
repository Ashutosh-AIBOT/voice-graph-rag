'use client';

import { useState, useMemo } from 'react';
import { useGraphData } from '@/hooks/useGraphData';
import { useGraphStore } from '@/store/graph';
import { GraphVisualization } from '@/components/graph/GraphVisualization';
import { graphController } from '@/components/graph/graphController';
import { entityColor } from '@/lib/constants';
import { Search, ZoomIn, ZoomOut, Maximize, RotateCcw } from 'lucide-react';

export default function ExplorePage() {
  useGraphData();
  const data = useGraphStore((s) => s.data);
  const [searchQuery, setSearchQuery] = useState('');

  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.nodes.forEach((n) => (counts[n.type] = (counts[n.type] || 0) + 1));
    const arr = Object.entries(counts).map(([type, count]) => ({ type, count }));
    arr.sort((a, b) => b.count - a.count);
    return arr;
  }, [data.nodes]);
  const maxTypeCount = typeData.length > 0 ? Math.max(...typeData.map(d => d.count)) : 1;

  const topHubs = useMemo(() => {
    const nodes = [...data.nodes];
    nodes.sort((a, b) => (b.degree || 0) - (a.degree || 0));
    return nodes.slice(0, 10);
  }, [data.nodes]);

  const sources = useMemo(() => {
    const counts: Record<string, number> = {};
    data.nodes.forEach(n => {
      if (n.sourceDoc) {
        counts[n.sourceDoc] = (counts[n.sourceDoc] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);
  }, [data.nodes]);

  const relations = useMemo(() => {
    const set = new Set<string>();
    data.links.forEach(l => set.add(l.type));
    return Array.from(set).sort();
  }, [data.links]);

  return (
    <div className="flex h-full flex-col bg-bg2 p-[12px] gap-[12px] overflow-hidden">
      {/* Top row: Search input */}
      <div className="shrink-0 relative">
        <Search className="absolute left-[14px] top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-text3" />
        <input
          type="text"
          placeholder="Search entities or relations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-[36px] pr-[16px] py-[10px] bg-panel border border-border rounded-[12px] text-[12.5px] text-text placeholder:text-text3 focus:outline-none focus:border-accent transition-colors shadow-sm"
        />
      </div>

      {/* Body grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-[12px] min-h-0 overflow-hidden">
        
        {/* Graph Canvas (left) */}
        <div className="relative rounded-[13px] bg-panel border border-border overflow-hidden shadow-sm flex flex-col">
          <div className="absolute inset-0 z-0">
             <GraphVisualization />
          </div>
          
          {/* Toolbar (absolute top-right) */}
          <div className="absolute top-[12px] right-[12px] z-10 flex flex-col gap-[6px]">
            <button className="tool-btn" onClick={() => graphController.zoomIn?.()} title="Zoom In"><ZoomIn className="h-[14px] w-[14px]"/></button>
            <button className="tool-btn" onClick={() => graphController.zoomOut?.()} title="Zoom Out"><ZoomOut className="h-[14px] w-[14px]"/></button>
            <button className="tool-btn" onClick={() => graphController.resetView?.()} title="Reset View"><RotateCcw className="h-[14px] w-[14px]"/></button>
            <button className="tool-btn" title="Fullscreen"><Maximize className="h-[14px] w-[14px]"/></button>
          </div>

          {/* Entity Legend (absolute bottom-left) */}
          <div className="absolute bottom-[12px] left-[12px] z-10 bg-panel border border-border rounded-[11px] w-[150px] shadow-sm p-[12px]">
            <h4 className="text-[9.5px] font-bold tracking-[0.06em] text-text3 mb-[10px] uppercase">Entity Types</h4>
            <div className="space-y-[8px] max-h-[160px] overflow-y-auto scrollbar-thin pr-1">
              {typeData.map((d) => (
                <div key={d.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-[6px] min-w-0">
                    <div className="h-[7px] w-[7px] rounded-full shrink-0" style={{ backgroundColor: entityColor(d.type) }} />
                    <span className="text-[10px] font-medium text-text truncate">{d.type}</span>
                  </div>
                  <span className="text-[10px] font-mono text-text3 shrink-0 ml-[6px]">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side Panel (right) */}
        <div className="hidden lg:flex flex-col gap-[9px] min-h-0 overflow-y-auto scrollbar-thin">
          
          {/* Stats cards */}
          <div className="shrink-0 grid grid-cols-2 gap-[8px]">
            <div className="bg-panel border border-border rounded-[12px] p-[10px] text-center shadow-sm">
              <p className="font-mono text-[17px] font-bold text-accent">{data.nodes.length}</p>
              <p className="mt-[2px] text-[9px] font-semibold text-text3 uppercase tracking-[0.04em]">Nodes</p>
            </div>
            <div className="bg-panel border border-border rounded-[12px] p-[10px] text-center shadow-sm">
              <p className="font-mono text-[17px] font-bold text-accent">{data.links.length}</p>
              <p className="mt-[2px] text-[9px] font-semibold text-text3 uppercase tracking-[0.04em]">Edges</p>
            </div>
          </div>

          {/* By Type panel */}
          <div className="shrink-0 bg-panel border border-border rounded-[12px] p-[12px] shadow-sm">
            <h4 className="text-[9.5px] font-bold tracking-[0.06em] text-text3 mb-[10px] uppercase">By Type</h4>
            <div className="space-y-[8px]">
              {typeData.slice(0, 5).map((d) => (
                <div key={d.type} className="flex items-center gap-[6px]">
                  <span className="text-[9.5px] font-medium text-text w-[64px] truncate shrink-0">{d.type}</span>
                  <div className="flex-1 h-[5px] rounded-[3px] bg-panel2 relative overflow-hidden">
                    <div className="absolute top-0 left-0 bottom-0 rounded-[3px]" style={{ width: `${(d.count / maxTypeCount) * 100}%`, backgroundColor: entityColor(d.type) }} />
                  </div>
                  <span className="text-[9.5px] font-mono text-text3 shrink-0 w-[24px] text-right">{d.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Hubs panel */}
          <div className="flex-1 bg-panel border border-border rounded-[12px] p-[12px] shadow-sm overflow-hidden flex flex-col min-h-[200px]">
            <h4 className="text-[9.5px] font-bold tracking-[0.06em] text-text3 mb-[10px] uppercase shrink-0">Top 10 Hub Entities</h4>
            <div className="flex-1 overflow-y-auto space-y-[8px] scrollbar-thin pr-1">
              {topHubs.map((node, i) => (
                <div key={node.id} className="flex items-center gap-[6px]">
                  <span className="text-[10px] font-mono text-text3 w-[14px] text-right shrink-0">{i + 1}</span>
                  <div className="h-[6px] w-[6px] rounded-full shrink-0" style={{ backgroundColor: entityColor(node.type) }} />
                  <span className="text-[10.5px] font-medium text-text flex-1 truncate">{node.name}</span>
                  <span className="text-[10px] font-mono text-text3 shrink-0">{node.degree}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Strip */}
      <div className="shrink-0 flex flex-col gap-[8px]">
        {/* SOURCES */}
        {sources.length > 0 && (
          <div className="flex items-center gap-[8px] overflow-x-auto scrollbar-none pb-[4px]">
            <span className="text-[9.5px] font-bold tracking-[0.06em] text-text3 shrink-0 uppercase">Sources</span>
            {sources.map(s => (
              <div key={s.source} className="flex items-center gap-[4px] px-[8px] py-[4px] rounded-[6px] bg-panel border border-border shrink-0">
                <span className="text-[10px] font-medium text-text">{s.source}</span>
                <span className="text-[9.5px] font-mono text-text3 bg-panel2 px-[4px] py-[1px] rounded-[4px]">{s.count}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* RELATIONSHIPS */}
        {relations.length > 0 && (
          <div className="flex items-center gap-[8px] overflow-x-auto scrollbar-none pb-[4px]">
            <span className="text-[9.5px] font-bold tracking-[0.06em] text-text3 shrink-0 uppercase">Relationships</span>
            {relations.map(r => (
              <div key={r} className="px-[8px] py-[4px] rounded-[6px] bg-panel border border-border shrink-0">
                <span className="text-[9.5px] font-bold text-accent">{r}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
