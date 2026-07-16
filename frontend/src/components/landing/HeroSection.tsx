'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useGraphData } from '@/hooks/useGraphData';
import { GraphVisualization } from '@/components/graph/GraphVisualization';
import { useGraphStore } from '@/store/graph';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Sparkles } from 'lucide-react';

function FloatingParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        size: 3 + Math.random() * 5,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 4 + Math.random() * 6,
        delay: Math.random() * 4,
        opacity: 0.15 + Math.random() * 0.2,
      })),
    []
  );

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle bg-accent-cyan"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </>
  );
}

export function HeroSection() {
  useGraphData();
  const data = useGraphStore((s) => s.data);

  return (
    <section className="relative flex min-h-[85vh] items-center overflow-hidden gradient-mesh">
      {/* Animated graph background */}
      <div className="absolute inset-0 opacity-30">
        {data.nodes.length > 0 && <GraphVisualization height="100%" />}
      </div>

      {/* Gradient overlay layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-base/20 via-bg-base/60 to-bg-base" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg-base/40 via-transparent to-bg-base/40" />

      {/* Floating particles */}
      <FloatingParticles />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-bg-surface border border-border px-4 py-2 animate-fade-in-up">
          <Sparkles className="h-3.5 w-3.5 text-accent-primary" />
          <span className="text-xs font-medium tracking-wide text-text-secondary">
            AI-Powered Knowledge Graph
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-7xl animate-fade-in-up delay-100">
          Unlock Insights from Your Documents with{' '}
          <span className="gradient-text">
            Knowledge Graph AI
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-base text-text-secondary sm:text-lg animate-fade-in-up delay-200">
          Build intelligent knowledge graphs from your documents. Query with natural language.
          Get graph-grounded answers with multi-hop reasoning.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in-up delay-300">
          <Link href="/register">
            <Button size="lg" className="group">
              Get Started Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">
              <Play className="h-4 w-4" /> Watch Demo
            </Button>
          </Link>
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-text-muted animate-fade-in-up delay-400">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Neo4j + ChromaDB
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan" />
            Multi-Provider LLM
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-primary" />
            Voice AI Ready
          </span>
        </div>
      </div>
    </section>
  );
}
