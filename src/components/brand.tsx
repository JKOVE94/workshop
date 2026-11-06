'use client';
import { GUIDES, JOURNEY, VERSES } from '@/lib/verses';
import type { StepKind } from '@/lib/types';

export function Brand({ big }: { big?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`grid place-items-center rounded-full border-[3px] border-[var(--ink)] bg-[var(--gold)] shadow-[0_3px_0_var(--ink)] ${big ? 'size-16 text-4xl' : 'size-10 text-xl'}`}>🐑</span>
      <div className="font-display leading-tight">
        <div className={big ? 'text-4xl' : 'text-lg'}>라난 찬양팀</div>
        <div className={`tracking-[0.2em] opacity-60 ${big ? 'text-base' : 'text-[10px]'}`}>WORSHIP TEAM WORKSHOP</div>
      </div>
    </div>
  );
}

/** 가치 1→2→3 여정 바. 현재 활동을 강조하고 지나온 가치는 채운다 */
export function ValueJourney({ kind, big }: { kind?: StepKind; big?: boolean }) {
  const cur = kind ? VERSES[kind]?.order ?? 0 : 0;
  return (
    <ol className="flex items-center gap-1.5">
      {JOURNEY.map((j, i) => {
        const state = j.order < cur ? 'done' : j.order === cur ? 'now' : 'todo';
        return (
          <li key={j.order} className="flex items-center gap-1.5">
            <span className={`flex items-center gap-1.5 rounded-full border-[3px] border-[var(--ink)] font-bold ${big ? 'px-5 py-2 text-2xl' : 'px-2.5 py-0.5 text-xs'} ${state === 'now' ? 'bg-[var(--gold)] shadow-[0_3px_0_var(--ink)]' : state === 'done' ? 'bg-emerald-300' : 'bg-white/70 opacity-60'}`}>
              <span className="font-display">{state === 'done' ? '✓' : j.order}</span>{j.label}
            </span>
            {i < JOURNEY.length - 1 && <span className="opacity-40">›</span>}
          </li>
        );
      })}
    </ol>
  );
}

/** 말씀 카드. intro: 활동 시작 전 전체 화면 / banner: 활동 중 상단 고정 / phone: 폰용 */
export function VerseCard({ kind, variant }: { kind: StepKind; variant: 'intro' | 'banner' | 'phone' }) {
  const v = VERSES[kind];
  if (!v) return null;
  const big = variant === 'intro';
  if (variant === 'banner') {
    return (
      <div className="card flex flex-wrap items-center gap-x-5 gap-y-1 bg-[var(--gold)]/30 px-6 py-3">
        <span className="rounded-full bg-[var(--ink)] px-3 py-1 font-display text-lg text-white">가치 {v.order}</span>
        <span className="font-display text-2xl">{v.value}</span>
        <span className="min-w-0 flex-1 text-lg font-semibold opacity-80">
          {v.passages.map((p) => `“${p.text}” (${p.ref})`).join('  ·  ')}
        </span>
      </div>
    );
  }
  return (
    <section className={`card pop-in text-center ${big ? 'mx-auto max-w-6xl space-y-8 px-14 py-14' : 'space-y-4 px-5 py-6'}`}>
      <div className="flex items-center justify-center gap-3">
        <span className={`rounded-full bg-[var(--ink)] font-display text-white ${big ? 'px-6 py-2 text-3xl' : 'px-3 py-1 text-sm'}`}>가치 {v.order}</span>
        <span className={big ? 'text-5xl' : 'text-2xl'}>📖</span>
      </div>
      <h2 className={`font-display ${big ? 'text-7xl' : 'text-3xl'}`}>{v.value}</h2>
      <div className={big ? 'space-y-6' : 'space-y-3'}>
        {v.passages.map((p) => (
          <blockquote key={p.ref} className={`rounded-2xl bg-[var(--gold)]/25 ${big ? 'px-10 py-8' : 'px-4 py-4'}`}>
            <p className={`font-semibold leading-relaxed ${big ? 'text-4xl' : 'text-base'}`}>“{p.text}”</p>
            <cite className={`mt-2 block font-display not-italic ${big ? 'text-3xl' : 'text-sm'}`}>— {p.ref}</cite>
          </blockquote>
        ))}
      </div>
      <p className={`font-bold opacity-70 ${big ? 'text-3xl' : 'text-sm'}`}>{v.tagline}</p>
    </section>
  );
}

/** 그림 위주 활동 설명. stage: 가로 타일 / phone: 2열 */
export function GuideStrip({ kind, variant }: { kind: StepKind; variant: 'stage' | 'phone' }) {
  const g = GUIDES[kind];
  if (!g) return null;
  const big = variant === 'stage';
  return (
    <section className={`card pop-in ${big ? 'mx-auto w-full max-w-6xl space-y-6 px-10 py-8' : 'space-y-3 px-4 py-5'}`}>
      <h3 className={`text-center font-display ${big ? 'text-5xl' : 'text-xl'}`}>🎮 {g.title} 이렇게 해요</h3>
      <ol className={big ? 'flex items-stretch justify-center gap-4' : 'grid grid-cols-2 gap-3'}>
        {g.steps.map((s, i) => (
          <li key={i} className={`flex flex-1 flex-col items-center justify-center rounded-3xl border-[3px] border-[var(--ink)] bg-white text-center shadow-[0_4px_0_var(--ink)] ${big ? 'gap-3 px-4 py-6' : 'gap-1 px-2 py-3'}`}>
            <span className={`grid place-items-center rounded-full bg-[var(--gold)] font-display ${big ? 'size-10 text-2xl' : 'size-6 text-xs'}`}>{i + 1}</span>
            <span className={big ? 'text-7xl leading-none' : 'text-4xl leading-none'}>{s.icon}</span>
            <span className={`font-bold leading-snug ${big ? 'text-2xl' : 'text-xs'}`}>{s.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** 활동 시작 전 화면: 말씀(있으면) + 그림 설명 */
export function Intro({ kind, variant }: { kind: StepKind; variant: 'stage' | 'phone' }) {
  return (
    <div className={variant === 'stage' ? 'flex w-full flex-col items-center gap-8' : 'space-y-4'}>
      <VerseCard kind={kind} variant={variant === 'stage' ? 'intro' : 'phone'} />
      <GuideStrip kind={kind} variant={variant} />
    </div>
  );
}

/** 게임 승리 팀 발표 배너 */
export function WinnerBanner({ names, points, big }: { names: string[]; points: number; big?: boolean }) {
  if (!names.length) return null;
  return (
    <div className={`card pop-in bg-[var(--gold)] text-center ${big ? 'px-10 py-8' : 'px-4 py-4'}`}>
      <div className={`font-display ${big ? 'text-7xl' : 'text-2xl'}`}>🏆 {names.join(' · ')} 승리!</div>
      <div className={`font-bold ${big ? 'mt-2 text-4xl' : 'text-sm'}`}>승리 점수 +{points}점</div>
    </div>
  );
}
