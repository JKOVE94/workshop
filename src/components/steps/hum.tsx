'use client';
import { useState } from 'react';
import { Countdown, TeamTag, btn, btnGhost, input, teamOf, nameOf, type AdminProps, type StepProps } from '../ui';

/** 팀 대표 한 명이 팀명을 정하고 '확인'을 누르면 확정(이후 변경 불가) */
export function TeamNameCard({ state }: { state: StepProps['state'] }) {
  const team = teamOf(state, state.me?.teamId);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!team) return null;
  if (team.nameLocked) {
    return <div className="rounded-2xl border-2 p-4 text-center" style={{ borderColor: team.color }}><div className="text-xs text-neutral-500">우리 팀 이름 (확정)</div><div className="text-2xl font-black">{team.name}</div></div>;
  }
  async function submit() {
    const n = name.trim();
    if (!n || !confirm(`팀명을 '${n}'(으)로 확정할까요?\n확인하면 더 이상 바꿀 수 없어요.`)) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/team-name', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: n }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? '저장하지 못했어요');
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장하지 못했어요');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-2 rounded-2xl border-2 p-4" style={{ borderColor: team.color }}>
      <div className="text-sm font-bold">우리 팀 이름을 지어 주세요</div>
      <p className="text-xs text-neutral-500">팀 대표 한 명이 입력하고 &lsquo;확인&rsquo;을 누르세요. 확인하면 바꿀 수 없어요.</p>
      <input value={name} maxLength={12} onChange={(e) => setName(e.target.value)} placeholder={`현재: ${team.name}`} className={`${input} w-full`} />
      <button disabled={busy || !name.trim()} onClick={submit} className={`${btn} w-full`}>{busy ? '저장 중…' : '확인 (팀명 확정)'}</button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function HumPlayer({ state, serverNow }: StepProps) {
  const h = state.hum;
  const team = teamOf(state, state.me?.teamId);
  return (
    <div className="space-y-4 text-center">
      <p className="text-neutral-500">허밍으로만 같은 곡 사람을 찾으세요 🎵<br />말·가사 금지!</p>
      {h?.mySong ? (
        <div className="rounded-3xl bg-[var(--primary)] p-8 text-white border-[3px] border-[var(--ink)] shadow-[0_6px_0_var(--ink)]">
          <div className="text-sm opacity-80">내 곡</div>
          <div className="mt-2 text-4xl font-black">{h.mySong}</div>
        </div>
      ) : (
        <p className="rounded-xl bg-amber-100 p-4 text-amber-900">아직 곡이 배정되지 않았어요. 잠시만요.</p>
      )}
      <Countdown endAt={h?.timerEnd} serverNow={serverNow} />
      {h?.revealed && team && <p className="text-xl">우리 팀은 <TeamTag team={team} /> 입니다!</p>}
      {h?.revealed && <TeamNameCard state={state} />}
    </div>
  );
}

export function HumStage({ state, serverNow }: StepProps) {
  const h = state.hum;
  return (
    <div className="space-y-10">
      <h2 className="text-center text-6xl font-black">🎵 허밍으로 팀 찾기</h2>
      {!h?.revealed && (
        <div className="space-y-6 text-center">
          <p className="text-4xl text-neutral-500">폰의 곡 제목을 허밍으로만 불러 같은 곡 사람을 찾으세요<br />말·가사 금지!</p>
          <Countdown endAt={h?.timerEnd} serverNow={serverNow} big />
        </div>
      )}
      {h?.revealed && (
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${state.teams.length}, minmax(0, 1fr))` }}>
          {state.teams.map((t) => (
            <div key={t.id} className="rounded-3xl p-6 text-white border-[3px] border-[var(--ink)] shadow-[0_6px_0_var(--ink)]" style={{ background: t.color }}>
              <div className="text-4xl font-black">{t.name}</div>
              <div className="mt-1 text-2xl opacity-90">{h.songs?.find((s) => s.teamId === t.id)?.title}</div>
              <ul className="mt-4 space-y-1 text-3xl font-semibold">
                {t.memberIds.map((id) => <li key={id}>{nameOf(state, id)}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function HumAdmin({ state, act, serverNow }: AdminProps) {
  const h = state.hum;
  const [sec, setSec] = useState(String(state.step?.config.timerSeconds ?? 180));
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-neutral-100 p-2 text-sm dark:bg-neutral-800">
        <b>고정 곡</b>: {h?.songs?.map((x) => x.title).join(' / ')}
        <button className={`${btnGhost} ml-2`} onClick={() => confirm('팀·곡 배정을 모두 지우고 새로 만듭니다. 점수 기록이 있으면 불가합니다. 계속할까요?') && act({ type: 'hum_rebuild' })}>팀 다시 만들기</button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input className={`${input} w-24`} value={sec} onChange={(e) => setSec(e.target.value)} inputMode="numeric" />
        <span className="text-sm">초</span>
        <button className={btn} onClick={() => act({ type: 'hum_timer', seconds: Number(sec) })}>타이머 시작</button>
        <button className={btnGhost} onClick={() => act({ type: 'hum_timer_clear' })}>끄기</button>
        <Countdown endAt={h?.timerEnd} serverNow={serverNow} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button className={btn} onClick={() => act({ type: 'hum_reveal', value: !h?.revealed })}>{h?.revealed ? '팀 숨기기' : '팀 공개 (빔)'}</button>
        <button className={btnGhost} onClick={() => confirm('현재 명단으로 팀을 다시 섞습니다 (점수는 유지). 계속할까요?') && act({ type: 'hum_reshuffle' })}>팀 다시 섞기</button>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {state.teams.map((t) => (
          <div key={t.id} className="rounded-lg border p-2 text-sm">
            <div className="font-bold"><TeamTag team={t} /> · {t.memberIds.length}명</div>
            <div className="text-neutral-500">{h?.songs?.find((s) => s.teamId === t.id)?.title}</div>
            <div>{t.memberIds.map((id) => nameOf(state, id)).join(', ')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
