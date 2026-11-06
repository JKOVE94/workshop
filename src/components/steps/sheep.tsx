'use client';
import { Scoreboard, TeamTag, btn, btnGhost, teamOf, type AdminProps, type StepProps } from '../ui';

export function SheepPlayer({ state }: StepProps) {
  const team = teamOf(state, state.me?.teamId);
  const mine = state.sheep?.teams.find((t) => t.teamId === team?.id);
  return (
    <div className="space-y-4 text-center">
      <div className="rounded-3xl border-[3px] border-[var(--ink)] bg-[var(--primary)] p-5 text-white shadow-[0_6px_0_var(--ink)]">
        <div className="font-display text-2xl">목자의 음성을 따라가요 🐑</div>
        <p className="mt-2 text-sm font-semibold opacity-90">양이 찾은 카드는 <b>진행자에게 제출</b>해요.<br /><b>걷기만! 뛰지 마세요.</b></p>
      </div>
      {team && (
        <p className="font-bold"><TeamTag team={team} /> · 이번 게임 {team.gamePoints}점{mine ? ` (⭕ ${mine.ok} · ❌ ${mine.wrong})` : ''}</p>
      )}
      <Scoreboard teams={state.teams} mode="game" />
    </div>
  );
}

export function SheepStage({ state }: StepProps) {
  const sh = state.sheep;
  return (
    <div className="space-y-8">
      <Scoreboard teams={state.teams} big mode="game" />
      {sh && (
        <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-4">
          {sh.teams.map((t) => {
            const team = teamOf(state, t.teamId);
            return (
              <span key={t.teamId} className="rounded-full border-[3px] border-[var(--ink)] bg-white px-6 py-2 font-display text-3xl shadow-[0_4px_0_var(--ink)]">
                {team?.name} · ⭕ {t.ok} · ❌ {t.wrong}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SheepAdmin({ state, act }: AdminProps) {
  const sh = state.sheep;
  if (!sh) return null;
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">양이 카드를 가져오면 정답/함정을 눌러 기록하세요. 득점: 정답 {state.step?.config.correct ?? 1} / 함정 {state.step?.config.wrong ?? -1}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {state.teams.map((t) => {
          const c = sh.teams.find((x) => x.teamId === t.id);
          return (
            <div key={t.id} className="space-y-2 rounded-2xl border-[3px] border-[var(--ink)] bg-white p-3">
              <div className="flex items-center justify-between font-bold"><TeamTag team={t} /><span className="font-display text-2xl tabular-nums">{t.gamePoints}점</span></div>
              <div className="text-sm">⭕ {c?.ok ?? 0} · ❌ {c?.wrong ?? 0}</div>
              <div className="grid grid-cols-2 gap-2">
                <button className={`${btn} py-4 text-base`} onClick={() => act({ type: 'sheep_submit', teamId: t.id, ok: true })}>⭕ 정답</button>
                <button className={`${btnGhost} py-4 text-base`} onClick={() => act({ type: 'sheep_submit', teamId: t.id, ok: false })}>❌ 함정</button>
              </div>
              <button className="w-full text-xs underline" onClick={() => act({ type: 'sheep_undo', teamId: t.id })}>↩ 마지막 기록 취소</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
