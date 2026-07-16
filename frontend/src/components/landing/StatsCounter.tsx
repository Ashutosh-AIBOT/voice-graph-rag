'use client';

import { useEffect, useRef, useState } from 'react';
import api from '@/lib/axios';
import { BarChart3 } from 'lucide-react';

interface Stats {
  nodes: number;
  edges: number;
  types: number;
  documents: number;
}

function Counter({ value, suffix, decimals = 0 }: { value: number; suffix: string; decimals?: number }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        let start = 0;
        const dur = 1400;
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min((t - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
          setN(value * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.disconnect();
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);
  return (
    <span ref={ref}>
      {Math.round(n).toLocaleString()}
      {suffix}
    </span>
  );
}

export function StatsCounter() {
  const [stats, setStats] = useState<Stats>({ nodes: 0, edges: 0, types: 0, documents: 0 });

  useEffect(() => {
    Promise.all([
      api.get('/graph/stats/').catch(() => ({ data: { nodes_count: 0, edges_count: 0, type_distribution: [] } })),
      api.get('/documents/').catch(() => ({ data: { count: 0 } })),
    ]).then(([graphRes, docsRes]) => {
      setStats({
        nodes: graphRes.data.nodes_count || 0,
        edges: graphRes.data.edges_count || 0,
        types: (graphRes.data.type_distribution || []).length,
        documents: docsRes.data.count || (docsRes.data.results || []).length || 0,
      });
    });
  }, []);

  const STAT_ITEMS = [
    { label: 'Graph Nodes', value: stats.nodes, suffix: '' },
    { label: 'Relationships', value: stats.edges, suffix: '' },
    { label: 'Entity Types', value: stats.types, suffix: '' },
    { label: 'Documents', value: stats.documents, suffix: '' },
  ];

  if (stats.nodes === 0 && stats.documents === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="text-center animate-fade-in-up">
        <BarChart3 className="mx-auto mb-3 h-6 w-6 text-accent-primary" />
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-cyan">
          Knowledge Graph Statistics
        </p>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
        {STAT_ITEMS.map((s, i) => (
          <div
            key={s.label}
            className="group rounded-xl border border-border bg-bg-surface p-6 text-center transition-all hover:border-border-strong animate-fade-in-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <p className="bg-gradient-to-r from-accent-primary to-accent-cyan bg-clip-text text-3xl font-semibold text-transparent sm:text-4xl">
              <Counter value={s.value} suffix={s.suffix} />
            </p>
            <p className="mt-2 text-xs font-medium text-text-secondary">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
