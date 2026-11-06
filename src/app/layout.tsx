import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = { title: '라난 찬양팀 워크샵', description: '1부 레크레이션 진행 앱' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#4f46e5' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-dvh bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
