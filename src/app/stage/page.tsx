'use client';
import { useLiveState } from '@/lib/client/useLiveState';
import { OfflineBadge } from '@/components/ui';
import { STEP_MODULES } from '@/components/steps/registry';

/** 빔 전용 화면: 읽기 전용, 인증 없음, 개인정보 없음(이름만) */
export default function StagePage() {
  const { state, offline, serverNow } = useLiveState('stage', 1500);
  if (!state) return <main className="grid min-h-dvh place-items-center text-4xl text-neutral-400">연결 중…<OfflineBadge offline={offline} /></main>;
  const kind = state.step?.kind;
  const Mod = kind ? STEP_MODULES[kind] : null;
  return (
    <main className="min-h-dvh p-10">
      <OfflineBadge offline={offline} />
      {Mod ? <Mod.Stage state={state} serverNow={serverNow} /> : <p className="text-center text-5xl text-neutral-400">대기 중…</p>}
    </main>
  );
}
