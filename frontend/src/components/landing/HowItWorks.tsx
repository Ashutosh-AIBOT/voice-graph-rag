import { Upload, Workflow, MessageSquare } from 'lucide-react';

const STEPS = [
  {
    icon: Upload,
    title: 'Upload',
    desc: 'Upload your documents (PDF, TXT, DOCX, MD).',
    color: 'from-accent-primary to-accent-primary/70',
  },
  {
    icon: Workflow,
    title: 'Build Graph',
    desc: 'Auto-extract entities and relationships. Build the knowledge graph in Neo4j.',
    color: 'from-accent-cyan to-accent-cyan/70',
  },
  {
    icon: MessageSquare,
    title: 'Query & Discover',
    desc: 'Ask questions in natural language. Get graph-grounded answers with visual paths.',
    color: 'from-accent-secondary to-accent-secondary/70',
  },
];

export function HowItWorks() {
  return (
    <section className="border-y border-border bg-bg-base">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center animate-fade-in-up">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-cyan">
            How it Works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Three steps to knowledge
          </h2>
        </div>

        <div className="relative mt-16">
          {/* Connecting line */}
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-accent-primary/40 via-accent-cyan/40 to-accent-secondary/40 md:block" />

          <div className="flex flex-col items-center gap-10 md:flex-row md:justify-center md:gap-0">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="relative flex flex-1 items-center justify-center">
                  <div className="flex flex-col items-center text-center">
                    {/* Step number + icon */}
                    <div className="relative">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow-md animate-fade-in-up`} style={{ animationDelay: `${i * 150}ms` }}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-bg-base border border-border text-[10px] font-semibold text-text-muted">
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="mt-4 text-sm font-semibold">{s.title}</h3>
                    <p className="mt-2 max-w-[220px] text-xs leading-relaxed text-text-secondary">{s.desc}</p>
                  </div>

                  {/* Arrow between steps (desktop) */}
                  {i < STEPS.length - 1 && (
                    <div className="absolute right-0 top-7 hidden translate-x-1/2 md:block">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-bg-base border border-border text-text-muted">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
