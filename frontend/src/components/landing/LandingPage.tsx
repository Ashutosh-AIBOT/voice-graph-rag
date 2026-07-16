'use client';

import Link from 'next/link';
import { Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { StatsCounter } from '@/components/landing/StatsCounter';
import { Footer } from '@/components/landing/Footer';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-bg-base/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-primary to-accent-cyan text-white shadow-sm">
              <Network className="h-3.5 w-3.5" />
            </div>
            <span className="text-base font-semibold tracking-tight">GraphRAG</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="#features" className="hidden rounded-lg px-3 py-1.5 text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary sm:inline">
              Features
            </Link>
            <Link href="#how" className="hidden rounded-lg px-3 py-1.5 text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary sm:inline">
              How it Works
            </Link>
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Sign Up</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="pt-14">
        <HeroSection />
        <div id="features">
          <FeaturesSection />
        </div>
        <div id="how">
          <HowItWorks />
        </div>
        <StatsCounter />
      </main>
      <Footer />
    </div>
  );
}
