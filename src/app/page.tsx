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
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6 py-10">
      <div className="space-y-3 text-center">
        <div className="float text-7xl">🐑</div>
        <h1 className="font-display text-4xl leading-tight">라난 찬양팀<br />워크샵</h1>
        <p className="font-semibold opacity-70">찬양팀이 가져야 할 3가지 가치를 함께 나눠요</p>
        <ul className="flex flex-wrap justify-center gap-2 text-xs font-bold">
          {['서로 받아들이고', '한마음과 한 입으로', '인도하심을 따라'].map((v, i) => (
            <li key={v} className="rounded-full border-[3px] border-[var(--ink)] bg-white px-3 py-1 shadow-[0_3px_0_var(--ink)]"><span className="font-display">{i + 1}</span> {v}</li>
          ))}
        </ul>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) join(false); }} className="card space-y-3 p-5">
        <label className="font-display text-lg">내 이름은?</label>
        <input autoFocus value={name} onChange={(e) => { setName(e.target.value); setExists(false); }} maxLength={20} placeholder="이름을 입력하세요" className="field w-full text-lg" />
        {exists ? (
          <div className="space-y-2 rounded-2xl border-[3px] border-[var(--ink)] bg-[var(--gold)]/40 p-3">
            <p className="text-sm font-semibold">&lsquo;{name.trim()}&rsquo; 이름이 이미 있어요. 본인이 맞나요? (폰을 바꿨거나 새로고침한 경우)</p>
            <button type="button" disabled={busy} onClick={() => join(true)} className="btn-game w-full">네, 본인이에요 (이어하기)</button>
            <p className="text-xs">다른 사람이라면 이름 뒤에 숫자나 성을 붙여 주세요.</p>
          </div>
        ) : (
          <button disabled={busy || !name.trim()} className="btn-game w-full py-3 text-lg">{busy ? '입장 중…' : '🎮 입장하기'}</button>
        )}
        {error && <p className="text-center text-sm font-bold text-red-600">{error}</p>}
      </form>
    </main>
  );
}

export default function Page() {
  return <Suspense><JoinForm /></Suspense>;
}
