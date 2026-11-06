'use client';
import { TeamNameCard } from './hum';
import { Scoreboard, TeamDot, TeamTag, btn, btnGhost, nameOf, teamOf, type AdminProps, type StepProps } from '../ui';
import type { PublicState } from '@/lib/types';

/** 팀 구성 + 점수 (빔) */
export function BoardStage({ state }: StepProps) {
  return (
    <div className="space-y-8">
      <h2 className="text-center text-6xl font-black">👥 우리 팀</h2>
      {state.teams.length === 0 ? (
        <p className="text-center text-4xl text-neutral-500">아직 팀이 편성되지 않았어요</p>
      ) : (
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${state.teams.length}, minmax(0, 1fr))` }}>
          {state.teams.map((t) => (
            <div key={t.id} className="rounded-3xl p-6 text-white border-[3px] border-[var(--ink)] shadow-[0_6px_0_var(--ink)]" style={{ background: t.color }}>
              <div className="flex items-baseline justify-between"><span className="text-5xl font-black">{t.name}</span><span className="text-6xl font-black tabular-nums">{t.total}</span></div>
              <ul className="mt-4 space-y-1 text-3xl font-semibold">{t.memberIds.map((id) => <li key={id}>{nameOf(state, id)}</li>)}</ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PlainBoardPlayer({ state }: StepProps) {
  const team = teamOf(state, state.me?.teamId);
  return (
    <div className="space-y-4 text-center">
      <TeamNameCard state={state} />
      {team && <p className="text-xl font-bold">나는 <TeamTag team={team} /></p>}
      {team && <p className="text-neutral-700">팀원: {team.memberIds.map((id) => nameOf(state, id)).join(', ')}</p>}
      <Scoreboard teams={state.teams} />
    </div>
  );
}

const MEDAL = ['🥇', '🥈', '🥉'];

export function AwardsPlayer({ state }: StepProps) {
  const reveal = Number(state.step?.state.reveal ?? 0);
  const n = state.teams.length;
  const myIdx = state.teams.findIndex((t) => t.id === state.me?.teamId);
  const shown = myIdx >= 0 && myIdx >= n - reveal; // 내 팀 순위가 공개됐는지
  return (
    <div className="space-y-4 text-center">
      <p className="text-2xl font-black">🏆 시상식</p>
      <p className="text-neutral-700">빔 화면을 봐 주세요!</p>
      {shown && <p className="text-4xl font-black">{MEDAL[myIdx] ?? ''} {myIdx + 1}위 · {state.teams[myIdx].name}</p>}
    </div>
  );
}

export function AwardsStage({ state }: StepProps) {
  const reveal = Number(state.step?.state.reveal ?? 0);
  const n = state.teams.length;
  const winnerFull = reveal >= n && n > 0;
  return (
    <div className="space-y-10">
      <h2 className="text-center text-7xl font-black">🏆 시상식</h2>
      <div className="mx-auto max-w-4xl space-y-4">
        {state.teams.map((t, i) => {
          const visible = i >= n - reveal; // 꼴찌부터 한 팀씩 공개
          const first = i === 0 && visible;
          return (
            <div key={t.id} className={`flex items-center justify-between rounded-3xl px-10 py-6 border-[3px] border-[var(--ink)] shadow-[0_6px_0_var(--ink)] transition-all duration-700 ${visible ? 'text-white' : 'bg-neutral-200 text-transparent'} ${first ? 'scale-105 ring-8 ring-yellow-300' : ''}`} style={visible ? { background: t.color } : undefined}>
              <span className="text-6xl font-black">{visible ? `${MEDAL[i] ?? ''} ${i + 1}위` : `${i + 1}위`}</span>
              <span className="text-5xl font-bold">{visible ? t.name : '???'}</span>
              <span className="text-7xl font-black tabular-nums">{visible ? `${t.total}점` : ''}</span>
            </div>
          );
        })}
      </div>
      {winnerFull && <p className="animate-bounce text-center text-6xl font-black">🎉 {state.teams[0].name} 우승! 축하합니다 🎉</p>}
      {reveal > n && state.gameResults && (
        <div className="mx-auto max-w-4xl space-y-3">
          <h3 className="text-center text-4xl font-black">게임별 우승</h3>
          {state.gameResults.map((g) => (
            <div key={g.stepId} className="flex items-center justify-between rounded-2xl bg-neutral-100 px-8 py-4 text-3xl">
              <span className="font-semibold">{g.title}</span>
              <span className="font-black">{g.winners.length ? g.winners.map((w) => teamOf(state, w)?.name).join(', ') : '-'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AwardsAdmin({ state, act }: AdminProps) {
  const reveal = Number(state.step?.state.reveal ?? 0);
  const n = state.teams.length;
  const labels = ['시작 전', ...state.teams.map((_, i) => `${n - i}위 공개`), '게임별 우승'];
  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-700">현재: <b>{labels[reveal]}</b> (꼴찌부터 한 팀씩 공개합니다)</p>
      <div className="flex gap-2">
        <button className={btnGhost} disabled={reveal <= 0} onClick={() => act({ type: 'awards_reveal', value: reveal - 1 })}>◀ 되돌리기</button>
        <button className={`${btn} flex-1 py-3 text-base`} disabled={reveal > n} onClick={() => act({ type: 'awards_reveal', value: reveal + 1 })}>
          다음 공개 ▶ ({labels[reveal + 1] ?? '끝'})
        </button>
        <button className={btnGhost} onClick={() => act({ type: 'awards_reveal', value: 0 })}>처음으로</button>
      </div>
    </div>
  );
}

/** 관리자 대시보드: 팀 구성 + 게임별 승패 */
export function TeamsDashboard({ state, act }: { state: PublicState; act?: AdminProps['act'] }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        {state.teams.map((t) => (
          <div key={t.id} className="rounded-xl border p-3 text-sm" style={{ borderColor: t.color }}>
            <div className="mb-1 flex justify-between font-bold"><span><TeamDot color={t.color} /> {t.name} · {t.memberIds.length}명</span><span className="tabular-nums">{t.total}점</span></div>
            {act && (
              <div className="mb-1 flex gap-2 text-xs">
                <span>{t.nameLocked ? '🔒 팀명 확정' : '✏️ 팀명 미확정'}</span>
                <button className="underline" onClick={() => { const n = prompt('새 팀명 (확정 상태로 저장)', t.name); if (n && n.trim()) act({ type: 'team_rename', teamId: t.id, name: n, lock: true }); }}>이름 변경</button>
                {t.nameLocked && <button className="underline" onClick={() => act({ type: 'team_unlock', teamId: t.id })}>잠금 해제</button>}
              </div>
            )}
            <div className="text-neutral-700">{t.memberIds.map((id) => nameOf(state, id)).join(', ') || '팀원 없음'}</div>
          </div>
        ))}
        {state.teams.length === 0 && <p className="text-sm text-neutral-500">허밍 팀 찾기 스텝에 진입하면 팀이 편성됩니다.</p>}
      </div>
      {state.gameResults && state.gameResults.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b"><th className="py-1">게임</th>{state.teams.map((t) => <th key={t.id} className="px-2"><TeamDot color={t.color} /> {t.name}</th>)}<th className="px-2">승리 팀</th></tr></thead>
            <tbody>
              {state.gameResults.map((g) => (
                <tr key={g.stepId} className="border-b">
                  <td className="py-1 font-semibold">{g.title}</td>
                  {state.teams.map((t) => <td key={t.id} className={`px-2 tabular-nums ${g.winners.includes(t.id) ? 'font-black text-emerald-700' : ''}`}>{g.points[t.id] ?? 0}</td>)}
                  <td className="px-2 font-bold">{g.finalized ? `${g.winners.map((w) => teamOf(state, w)?.name).join(', ')} (+${g.winPoints})` : '미확정'}</td>
                </tr>
              ))}
              <tr><td className="py-1 font-black">누적 승리 점수</td>{state.teams.map((t) => <td key={t.id} className="px-2 font-black tabular-nums">{t.total}</td>)}<td /></tr>
            </tbody>
          </table>
        </div>
      )}
      {state.amen && state.amen.matches.some((m) => m.status === 'done') && (
        <div className="text-sm"><b>아멘 게임 경기 결과</b>
          <ul className="mt-1 space-y-0.5">
            {state.amen.matches.map((m, i) => m.status === 'done' && (
              <li key={m.id}>{i + 1}경기 {teamOf(state, m.teamA)?.name} vs {teamOf(state, m.teamB)?.name} → <b>{m.meta.winner === 'draw' ? '무승부' : `${teamOf(state, m.meta.winner === 'a' ? m.teamA : m.teamB)?.name} 승`}</b> ({m.meta.pointsA}:{m.meta.pointsB}점)</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
