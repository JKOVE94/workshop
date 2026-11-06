'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Result = { ok: boolean; word: string; delta: number } | { duplicate: true; word: string } | { error: string };

export function ScanClient({ token }: { token: string }) {
  const router = useRouter();
  const [result, setResult] = useState<Result | null>(null);
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return; // StrictMode 이중 호출 방지 (서버도 중복 스캔은 무시한다)
    sent.current = true;
    (async () => {
      try {
        const res = await fetch('/api/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
        if (res.status === 401) return router.replace(`/?next=${encodeURIComponent(`/s/${token}`)}`);
        setResult(await res.json());
      } catch {
        setResult({ error: '네트워크 오류 — 다시 스캔하거나 진행자에게 알려 주세요' });
      }
    })();
  }, [token, router]);

  let body = <p className="text-neutral-500">확인 중…</p>;
  let bg = '';
  if (result) {
    if ('error' in result) { bg = 'bg-neutral-700'; body = <p className="text-2xl font-bold">{result.error}</p>; }
    else if ('duplicate' in result) { bg = 'bg-amber-500'; body = <><p className="text-5xl font-black">이미 처리됨</p><p className="mt-2 text-2xl">{result.word}</p></>; }
    else if (result.ok) { bg = 'bg-emerald-600'; body = <><p className="text-7xl">⭕</p><p className="mt-2 text-5xl font-black">정답!</p><p className="mt-2 text-3xl">{result.word}</p><p className="mt-2 text-xl">{result.delta > 0 ? '+' : ''}{result.delta}점</p></>; }
    else { bg = 'bg-red-600'; body = <><p className="text-7xl">❌</p><p className="mt-2 text-5xl font-black">함정!</p><p className="mt-2 text-3xl">{result.word}</p><p className="mt-2 text-xl">{result.delta > 0 ? '+' : ''}{result.delta}점</p></>; }
  }
  return (
    <main className={`grid min-h-dvh place-items-center p-6 text-center ${bg ? bg + ' text-white' : ''}`}>
      <div>
        {body}
        {result && <button onClick={() => router.push('/play')} className="mt-8 rounded-xl bg-white/90 px-6 py-3 font-bold text-neutral-900">돌아가기</button>}
      </div>
    </main>
  );
}
