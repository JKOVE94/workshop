'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveState } from '@/lib/client/useLiveState';
import { OfflineBadge, Scoreboard } from '@/components/ui';
import { STEP_MODULES } from '@/components/steps/registry';

export default function PlayPage() {
  const router = useRouter();
  const { state, offline, serverNow } = useLiveState('player');

  useEffect(() => {
    // 쿠키가 없거나 참가자가 삭제된 경우 입장 화면으로
    if (state && !state.me) router.replace('/');
  }, [state, router]);

  if (!state) return <main className="grid min-h-dvh place-items-center text-neutral-500">불러오는 중…<OfflineBadge offline={offline} /></main>;
  if (!state.me) return null;
  const kind = state.step?.kind;
  const Mod = kind ? STEP_MODULES[kind] : null;
  const team = state.teams.find((t) => t.id === state.me?.teamId);

  return (
    <main className="mx-auto min-h-dvh max-w-md space-y-5 px-4 pb-10 pt-6">
      <OfflineBadge offline={offline} />
      <header className="flex items-center justify-between">
        <div>
          <div className="text-xs text-neutral-500">{state.step?.title}</div>
          <div className="text-lg font-black">{state.me.name}</div>
        </div>
        {team && <span className="rounded-full px-3 py-1 text-sm font-bold text-white" style={{ background: team.color }}>{team.name}</span>}
      </header>
      {Mod ? <Mod.Player state={state} serverNow={serverNow} /> : <p className="text-center text-neutral-500">대기 중…</p>}
      {kind !== 'part1_result' && state.teams.length > 0 && kind !== 'amen' && kind !== 'one_voice' && kind !== 'sheep_voice' && (
        <section className="space-y-2"><h3 className="text-xs font-semibold text-neutral-500">점수판</h3><Scoreboard teams={state.teams} /></section>
      )}
    </main>
  );
}
