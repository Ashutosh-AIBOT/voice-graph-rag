'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Network, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import api from '@/lib/axios';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your username or email.');
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.post('/auth/login/', { username: trimmed, password });
      const username = data?.user?.username || email.split('@')[0];
      const user = data.user || { id: 0, username, email };
      setAuth(user, data.access, data.refresh);
      router.push('/');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-bg-base">
      {/* Left: Form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-primary to-accent-cyan text-white shadow-sm">
                <Network className="h-4 w-4" />
              </div>
              <span className="text-lg font-semibold tracking-tight">GraphRAG</span>
            </Link>
            <ThemeToggle />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-text-secondary">Sign in to your GraphRAG account</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">Username or Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <Input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your username or email"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-text-secondary">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-accent-primary transition-colors hover:text-accent-primary/80">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right: Decorative panel */}
      <div className="relative hidden items-center justify-center overflow-hidden lg:flex lg:w-1/2 gradient-mesh">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/10 via-accent-cyan/10 to-accent-secondary/10" />

        {/* Floating nodes decoration */}
        <div className="absolute inset-0">
          {[
            { x: '20%', y: '30%', size: 12, color: 'accent-primary', delay: 0 },
            { x: '60%', y: '20%', size: 8, color: 'accent-cyan', delay: 1 },
            { x: '80%', y: '60%', size: 10, color: 'accent-secondary', delay: 2 },
            { x: '40%', y: '70%', size: 6, color: 'accent-primary', delay: 0.5 },
            { x: '70%', y: '40%', size: 14, color: 'accent-cyan', delay: 1.5 },
            { x: '30%', y: '55%', size: 8, color: 'accent-secondary', delay: 3 },
          ].map((node, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-float"
              style={{
                left: node.x,
                top: node.y,
                width: node.size,
                height: node.size,
                backgroundColor: `hsl(var(--${node.color}))`,
                opacity: 0.3,
                animationDelay: `${node.delay}s`,
                animationDuration: `${4 + i}s`,
              }}
            />
          ))}
          <svg className="absolute inset-0 h-full w-full opacity-10">
            <line x1="20%" y1="30%" x2="60%" y2="20%" stroke="hsl(188, 94%, 42%)" strokeWidth="1" />
            <line x1="60%" y1="20%" x2="80%" y2="60%" stroke="hsl(188, 94%, 42%)" strokeWidth="1" />
            <line x1="80%" y1="60%" x2="40%" y2="70%" stroke="hsl(45, 93%, 58%)" strokeWidth="1" />
            <line x1="40%" y1="70%" x2="20%" y2="30%" stroke="hsl(152, 60%, 48%)" strokeWidth="1" />
            <line x1="70%" y1="40%" x2="30%" y2="55%" stroke="hsl(188, 94%, 42%)" strokeWidth="1" />
          </svg>
        </div>

        <div className="relative z-10 px-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-text-primary">
            Knowledge graphs made simple
          </h2>
          <p className="mt-4 max-w-md text-sm text-text-secondary leading-relaxed">
            Upload documents, build knowledge graphs, and query with natural language.
            Powered by Neo4j, ChromaDB, and multi-provider LLMs.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {['Neo4j', 'ChromaDB', 'LangChain', 'LiveKit'].map((tech) => (
              <span key={tech} className="rounded-md bg-bg-surface border border-border px-3 py-1.5 text-xs font-medium text-text-secondary">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
