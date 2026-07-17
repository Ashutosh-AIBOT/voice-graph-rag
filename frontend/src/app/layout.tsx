import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'VoiceRAG — Knowledge Graph AI',
  description:
    'Build intelligent knowledge graphs from your documents. Query with natural language. Get graph-grounded answers with multi-hop reasoning.',
};

// Reads the persisted theme synchronously, before React/Zustand hydrate, so there's
// no flash of the wrong theme on load. Falls back to dark (the store's default).
const themeInitScript = `
(function() {
  try {
    var raw = localStorage.getItem('voicerag-theme');
    var theme = raw ? JSON.parse(raw).state.theme : 'dark';
    if (theme === 'light') document.documentElement.classList.remove('dark');
    else document.documentElement.classList.add('dark');
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
