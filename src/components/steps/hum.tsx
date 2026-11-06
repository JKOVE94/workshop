'use client';
import { useState } from 'react';
import { Countdown, TeamTag, btn, btnGhost, input, teamOf, nameOf, type AdminProps, type StepProps } from '../ui';

export function HumPlayer({ state, serverNow }: StepProps) {
  const h = state.hum;
  const team = teamOf(state, state.me?.teamId);
  return (
    <div className="space-y-4 text-center">
      <p className="text-neutral-500">허밍으로만 같은 곡 사람을 찾으세요 🎵<br />말·가사 금지!</p>
      {h?.mySong ? (
        <div className="rounded-3xl bg-indigo-600 p-8 text-white shadow-lg">
          <div className="text-sm opacity-80">내 곡</div>
          <div className="mt-2 text-4xl font-black">{h.mySong}</div>
        </div>
      ) : (
        <p className="rounded-xl bg-amber-100 p-4 text-amber-900">아직 곡이 배정되지 않았어요. 잠시만요.</p>
      )}
      <Countdown endAt={h?.timerEnd} serverNow={serverNow} />
      {h?.revealed && team && <p className="text-xl">우리 팀은 <TeamTag team={team} /> 입니다!</p>}
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
            <div key={t.id} className="rounded-3xl p-6 text-white shadow-lg" style={{ background: t.color }}>
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
  const [songs, setSongs] = useState<string>(() => (state.step?.kind === 'hum_team' ? (state.step.config.songs ?? []) : []).join('\n'));
  const [sec, setSec] = useState(String(state.step?.config.timerSeconds ?? 180));
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-semibold">허밍 곡 (한 줄에 하나, 팀 수만큼)</label>
        <textarea className={`${input} mt-1 w-full`} rows={4} value={songs} onChange={(e) => setSongs(e.target.value)} />
        <div className="mt-2 flex flex-wrap gap-2">
          <button className={btn} onClick={() => act({ type: 'hum_set_songs', songs: songs.split('\n') })}>곡 저장</button>
          <button className={btnGhost} onClick={() => confirm('팀·곡 배정을 모두 지우고 새로 만듭니다. 계속할까요?') && act({ type: 'hum_rebuild' })}>팀 수 바꿔 다시 만들기</button>
        </div>
        <p className="mt-1 text-xs text-neutral-500">팀 수는 이 스텝에 처음 진입할 때 곡 수로 정해집니다. 팀 수를 바꾸려면 곡을 수정한 뒤 &lsquo;다시 만들기&rsquo;.</p>
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
