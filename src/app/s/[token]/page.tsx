import { Suspense } from 'react';
import { ScanClient } from './ScanClient';

async function Loader({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ScanClient token={token} />;
}

export default function ScanPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Suspense fallback={<main className="grid min-h-dvh place-items-center text-neutral-500">확인 중…</main>}>
      <Loader params={params} />
    </Suspense>
  );
}
