import Link from 'next/link';
import { Network } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-base px-6 text-center gradient-mesh">
      <div className="rounded-2xl border border-border bg-bg-surface p-10 max-w-md">
        <p className="text-7xl font-semibold gradient-text">404</p>
        <h1 className="mt-4 text-2xl font-semibold">Page not found</h1>
        <p className="mt-3 text-sm text-text-secondary leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className="mt-8 inline-flex">
          <Button>
            <Network className="h-4 w-4" />
            Back to home
          </Button>
        </Link>
      </div>
    </div>
  );
}
