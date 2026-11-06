import type { Metadata, Viewport } from 'next';
import { Jua, Noto_Sans_KR } from 'next/font/google';
import './globals.css';

const display = Jua({ weight: '400', subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Noto_Sans_KR({ subsets: ['latin'], weight: ['400', '600', '800'], variable: '--font-body', display: 'swap' });

export const metadata: Metadata = { title: '라난 찬양팀 워크샵', description: '찬양팀이 가져야 할 3가지 가치를 활동으로 나누는 1부 레크레이션' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#6d5dfc' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh text-foreground antialiased">{children}</body>
    </html>
  );
}
