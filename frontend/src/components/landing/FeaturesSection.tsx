import { Network, GitBranch, Search, MousePointer2, Users, Zap } from 'lucide-react';

const FEATURES = [
  {
    icon: Network,
    title: 'Graph-Powered Retrieval',
    desc: 'Goes beyond vector search to understand relationships and context between entities.',
    gradient: 'from-accent-primary/20 to-accent-primary/5',
  },
  {
    icon: GitBranch,
    title: 'Multi-Hop Reasoning',
    desc: 'Follow chains of relationships to answer complex, multi-step questions.',
    gradient: 'from-accent-cyan/20 to-accent-cyan/5',
  },
  {
    icon: Search,
    title: 'Hybrid Search',
    desc: 'Combine graph traversal with vector similarity for the best results.',
    gradient: 'from-accent-secondary/20 to-accent-secondary/5',
  },
  {
    icon: MousePointer2,
    title: 'Interactive Visualization',
    desc: 'Explore your knowledge graph with zoom, pan, and click-to-inspect nodes.',
    gradient: 'from-accent-primary/20 to-accent-cyan/5',
  },
  {
    icon: Users,
    title: 'Community Detection',
    desc: 'Auto-discover thematic clusters and get per-community summaries.',
    gradient: 'from-accent-cyan/20 to-accent-secondary/5',
  },
  {
    icon: Zap,
    title: 'Real-time Processing',
    desc: 'Watch your document transform into a structured graph in real-time.',
    gradient: 'from-accent-primary/20 to-accent-secondary/5',
  },
];

export function FeaturesSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="text-center animate-fade-in-up">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-cyan">
          Features
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Everything you need to understand your documents
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-text-secondary">
          From upload to insight — powered by knowledge graphs, vector search, and LLM reasoning.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="group relative rounded-xl border border-border bg-bg-surface p-6 transition-all duration-300 hover:border-border-strong animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary transition-all group-hover:scale-110">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold">{f.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-text-secondary">{f.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
