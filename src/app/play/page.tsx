'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveState } from '@/lib/client/useLiveState';
import { OfflineBadge, Scoreboard } from '@/components/ui';
import { Brand, Intro, ValueJourney, VerseCard, WinnerBanner } from '@/components/brand';
import { STEP_MODULES } from '@/components/steps/registry';
import { GUIDES, VERSES } from '@/lib/verses';

export default function PlayPage() {
  const router = useRouter();
  const { state, offline, serverNow } = useLiveState('player');

  useEffect(() => {
    // 쿠키가 없거나 참가자가 삭제된 경우 입장 화면으로
    if (state && !state.me) router.replace('/');
  }, [state, router]);

  if (!state) return <main className="grid min-h-dvh place-items-center font-display text-2xl opacity-60">불러오는 중…<OfflineBadge offline={offline} /></main>;
  if (!state.me) return null;
  const kind = state.step?.kind;
  const Mod = kind ? STEP_MODULES[kind] : null;
  const team = state.teams.find((t) => t.id === state.me?.teamId);
  const hasVerse = !!kind && !!VERSES[kind];
  const hasIntro = !!kind && (!!VERSES[kind] || !!GUIDES[kind]);
  const gr = state.gameResults?.find((g) => g.stepId === state.step?.id);
  const winners = (gr?.winners ?? []).map((id) => state.teams.find((t) => t.id === id)?.name ?? '');
  const started = !!state.step?.state.started;
  const inGame = kind === 'amen' || kind === 'one_voice' || kind === 'sheep_voice';

  return (
    <main className="mx-auto min-h-dvh max-w-md space-y-4 px-4 pb-12 pt-4">
      <OfflineBadge offline={offline} />
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <Brand />
          {team && <span className="rounded-full border-[3px] border-[var(--ink)] px-3 py-1 font-display text-sm text-white shadow-[0_3px_0_var(--ink)]" style={{ background: team.color }}>{team.name}</span>}
        </div>
        <ValueJourney kind={kind} />
        <div className="flex items-baseline justify-between">
          <span className="font-display text-2xl">{state.me.name}</span>
          <span className="text-xs font-bold opacity-60">{state.step?.title}</span>
        </div>
      </header>

      {kind && hasIntro && !started ? (
        <>
          <Intro kind={kind} variant="phone" />
          <p className="text-center font-display text-lg opacity-70">곧 시작해요! 설명을 들어 보세요 🙏</p>
        </>
      ) : (
        <>
          {kind && hasVerse && <VerseCard kind={kind} variant="phone" />}
          {gr?.finalized && <WinnerBanner names={winners} points={gr.winPoints} />}
          <div className="card px-4 py-5">{Mod ? <Mod.Player state={state} serverNow={serverNow} /> : <p className="text-center opacity-60">대기 중…</p>}</div>
        </>
      )}

      {!inGame && kind !== 'awards' && state.teams.length > 0 && (
        <section className="space-y-2"><h3 className="font-display text-sm opacity-60">점수판</h3><Scoreboard teams={state.teams} /></section>
      )}
    </main>
  );
}
