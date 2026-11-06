'use client';
import { useEffect, useRef, useState } from 'react';
import type { PublicState, PubTeam } from '@/lib/types';

export type Act = (action: Record<string, any>) => Promise<boolean>;
export interface StepProps { state: PublicState; serverNow: () => number }
export interface AdminProps extends StepProps { act: Act }

export const nameOf = (s: PublicState, id: string | null | undefined) => s.participants.find((p) => p.id === id)?.name ?? '-';
export const teamOf = (s: PublicState, id: string | null | undefined) => s.teams.find((t) => t.id === id);

export function TeamDot({ color, size = 12 }: { color: string; size?: number }) {
  return <span className="inline-block rounded-full align-middle" style={{ background: color, width: size, height: size }} />;
}

export function TeamTag({ team, big }: { team?: PubTeam; big?: boolean }) {
  if (!team) return <span className="text-neutral-400">팀 없음</span>;
  return (
    <span className={`inline-flex items-center gap-2 font-bold ${big ? 'text-3xl' : ''}`}>
      <TeamDot color={team.color} size={big ? 22 : 12} />
      {team.name}
    </span>
  );
}

/** 점수판. big=true 는 빔 화면용 */
export function Scoreboard({ teams, big, highlight }: { teams: PubTeam[]; big?: boolean; highlight?: string | null }) {
  if (!teams.length) return <p className={big ? 'text-3xl text-neutral-400' : 'text-neutral-500'}>아직 팀이 없습니다</p>;
  return (
    <div className={`grid gap-3 ${big ? 'gap-6' : ''}`} style={{ gridTemplateColumns: `repeat(${teams.length}, minmax(0, 1fr))` }}>
      {teams.map((t) => (
        <div key={t.id} className={`border-[3px] border-[var(--ink)] text-center text-white ${big ? 'rounded-[2rem] p-8 shadow-[0_8px_0_var(--ink)]' : 'rounded-2xl p-3 shadow-[0_4px_0_var(--ink)]'} ${highlight === t.id ? 'ring-4 ring-yellow-300' : ''}`} style={{ background: t.color }}>
          <div className={`font-display ${big ? 'text-5xl' : 'text-base'}`}>{t.name}</div>
          <div className={`font-display tabular-nums ${big ? 'mt-3 text-9xl' : 'text-4xl'}`}>{t.total}</div>
        </div>
      ))}
    </div>
  );
}

export function Countdown({ endAt, serverNow, big, label }: { endAt: number | null | undefined; serverNow: () => number; big?: boolean; label?: string }) {
  const [now, setNow] = useState(() => serverNow());
  useEffect(() => {
    const id = setInterval(() => setNow(serverNow()), 100);
    return () => clearInterval(id);
  }, [serverNow]);
  if (!endAt) return null;
  const left = Math.max(0, endAt - now);
  const sec = Math.ceil(left / 1000);
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  return (
    <div className={`text-center font-black tabular-nums ${left === 0 ? 'text-red-500' : ''} ${big ? 'text-9xl' : 'text-5xl'}`}>
      {label && <div className={big ? 'text-3xl font-semibold text-neutral-500' : 'text-sm font-semibold text-neutral-500'}>{label}</div>}
      {mm}:{ss}
    </div>
  );
}

/** 짧은 초 단위 타이머 (5초). 소수점 한 자리 */
export function SecondsTimer({ startAt, seconds, serverNow, big }: { startAt: number | null | undefined; seconds: number; serverNow: () => number; big?: boolean }) {
  const [now, setNow] = useState(() => serverNow());
  useEffect(() => {
    const id = setInterval(() => setNow(serverNow()), 50);
    return () => clearInterval(id);
  }, [serverNow]);
  if (!startAt) return null;
  const left = Math.max(0, seconds - (now - startAt) / 1000);
  const danger = left <= 2;
  return (
    <div className={`text-center font-black tabular-nums ${left === 0 ? 'text-red-600' : danger ? 'text-orange-500' : ''} ${big ? 'text-[12rem] leading-none' : 'text-6xl'}`}>
      {left.toFixed(1)}
    </div>
  );
}

export function Beep({ trigger, enabled }: { trigger: number | undefined; enabled: boolean }) {
  const last = useRef(trigger);
  useEffect(() => {
    if (!enabled || !trigger || trigger === last.current) {
      last.current = trigger;
      return;
    }
    last.current = trigger;
    try {
      const Ctx = window.AudioContext ?? (window as any).webkitAudioContext;
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'square';
      o.frequency.value = 440;
      g.gain.value = 0.2;
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.6);
    } catch {
      /* 소리는 보조 수단 — 실패해도 화면 경고가 있다 */
    }
  }, [trigger, enabled]);
  return null;
}

export function OfflineBadge({ offline }: { offline: boolean }) {
  if (!offline) return null;
  return <div className="fixed left-2 top-2 z-50 rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">연결 끊김 · 마지막 상태 표시 중</div>;
}

export const btn = 'btn-game';
export const btnGhost = 'btn-game btn-ghost';
export const input = 'field';
