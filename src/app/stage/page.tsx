'use client';
import { useLiveState } from '@/lib/client/useLiveState';
import { OfflineBadge } from '@/components/ui';
import { Brand, ValueJourney, VerseCard } from '@/components/brand';
import { STEP_MODULES } from '@/components/steps/registry';
import { VERSES } from '@/lib/verses';

/** 빔 전용 화면: 읽기 전용, 인증 없음, 개인정보 없음(이름만) */
export default function StagePage() {
  const { state, offline, serverNow } = useLiveState('stage', 1500);
  if (!state) return <main className="grid min-h-dvh place-items-center font-display text-5xl opacity-60">연결 중…<OfflineBadge offline={offline} /></main>;
  const kind = state.step?.kind;
  const Mod = kind ? STEP_MODULES[kind] : null;
  const hasVerse = !!kind && !!VERSES[kind];
  const started = !!state.step?.state.started;

  return (
    <main className="flex min-h-dvh flex-col gap-6 p-8">
      <OfflineBadge offline={offline} />
      <header className="flex items-center justify-between">
        <Brand big />
        <ValueJourney kind={kind} big />
      </header>

      {/* 활동마다 말씀이 먼저: 관리자가 '활동 시작'을 누르기 전에는 말씀 화면만 보인다 */}
      {kind && hasVerse && !started ? (
        <div className="grid flex-1 place-items-center"><VerseCard kind={kind} variant="intro" /></div>
      ) : (
        <>
          {kind && hasVerse && <VerseCard kind={kind} variant="banner" />}
          <div className="flex-1">
            {Mod ? <Mod.Stage state={state} serverNow={serverNow} /> : <p className="text-center font-display text-6xl opacity-60">대기 중…</p>}
          </div>
        </>
      )}
    </main>
  );
}
