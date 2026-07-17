import Link from 'next/link';
import { Github, Twitter, Linkedin, Network } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-bg-base">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-14 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-primary to-accent-cyan text-white">
              <Network className="h-3.5 w-3.5" />
            </div>
            <p className="text-sm font-semibold tracking-tight">VoiceRAG</p>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-text-muted">
            Knowledge graphs made simple. AI-powered document understanding.
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Product</p>
          <ul className="mt-3 space-y-2 text-xs text-text-secondary">
            <li><Link href="#features" className="transition-colors hover:text-text-primary">Features</Link></li>
            <li><Link href="#" className="transition-colors hover:text-text-primary">Pricing</Link></li>
            <li><Link href="#" className="transition-colors hover:text-text-primary">Changelog</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Resources</p>
          <ul className="mt-3 space-y-2 text-xs text-text-secondary">
            <li><Link href="#" className="transition-colors hover:text-text-primary">Documentation</Link></li>
            <li><Link href="#" className="transition-colors hover:text-text-primary">API Reference</Link></li>
            <li><Link href="#" className="transition-colors hover:text-text-primary">Status</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Company</p>
          <ul className="mt-3 space-y-2 text-xs text-text-secondary">
            <li><Link href="#" className="transition-colors hover:text-text-primary">About</Link></li>
            <li><Link href="#" className="transition-colors hover:text-text-primary">Blog</Link></li>
            <li><Link href="#" className="transition-colors hover:text-text-primary">Careers</Link></li>
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border px-6 py-4 text-xs text-text-muted">
        <span>© 2026 VoiceRAG. All rights reserved.</span>
        <div className="flex gap-1.5">
          {[Github, Twitter, Linkedin].map((Icon, i) => (
            <a
              key={i}
              href="#"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-muted transition-all hover:border-border-strong hover:text-text-primary"
            >
              <Icon className="h-3.5 w-3.5" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
