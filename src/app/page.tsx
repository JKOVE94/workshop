'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function JoinForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [exists, setExists] = useState(false);

  async function join(resume: boolean) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, resume }) });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data.exists) return setExists(true);
      if (!res.ok) throw new Error(data.error ?? '입장하지 못했어요');
      router.replace(next && next.startsWith('/') ? next : '/play');
    } catch (e) {
      setError(e instanceof Error ? e.message : '입장하지 못했어요');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6">
      <div className="text-center">
        <div className="text-5xl">🎶</div>
        <h1 className="mt-2 text-2xl font-black">라난 찬양팀 워크샵</h1>
        <p className="mt-1 text-neutral-500">이름을 입력하면 입장해요</p>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) join(false); }} className="space-y-3">
        <input autoFocus value={name} onChange={(e) => { setName(e.target.value); setExists(false); }} maxLength={20} placeholder="이름" className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-lg text-neutral-900" />
        {exists ? (
          <div className="space-y-2 rounded-xl bg-amber-100 p-3 text-amber-900">
            <p className="text-sm">&lsquo;{name.trim()}&rsquo; 이름이 이미 있어요. 본인이 맞나요? (폰을 바꿨거나 새로고침한 경우)</p>
            <button type="button" disabled={busy} onClick={() => join(true)} className="w-full rounded-lg bg-amber-600 py-2 font-bold text-white">네, 본인이에요 (이어하기)</button>
            <p className="text-xs">다른 사람이라면 이름 뒤에 숫자나 성을 붙여 주세요.</p>
          </div>
        ) : (
          <button disabled={busy || !name.trim()} className="w-full rounded-xl bg-indigo-600 py-3 text-lg font-bold text-white disabled:opacity-40">{busy ? '입장 중…' : '입장하기'}</button>
        )}
        {error && <p className="text-center text-sm text-red-600">{error}</p>}
      </form>
    </main>
  );
}

export default function Page() {
  return <Suspense><JoinForm /></Suspense>;
}
