'use client';
import { Scoreboard, TeamTag, btn, btnGhost, nameOf, type AdminProps, type StepProps } from '../ui';

export function OneVoicePlayer({ state }: StepProps) {
  const ov = state.oneVoice;
  if (!ov) return <p className="text-center text-neutral-500">준비 중…</p>;
  const myOrder = ov.orders.find((o) => o.playerIds.includes(state.me?.id ?? ''));
  const idx = ov.myIndex;
  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-neutral-500">{ov.round + 1}라운드 · {ov.n}글자 단어를 한 글자씩 이어 말해요</p>
      {myOrder && idx !== undefined ? (
        <div className="rounded-3xl bg-[var(--primary)] p-8 text-white border-[3px] border-[var(--ink)] shadow-[0_6px_0_var(--ink)]">
          <div className="text-sm opacity-80">내 순서</div>
          <div className="text-7xl font-black">{idx + 1}번째</div>
          {ov.myLetter && <div className="mt-3 text-5xl font-black">&ldquo;{ov.myLetter}&rdquo;</div>}
        </div>
      ) : (
        <div className="rounded-2xl bg-neutral-100 p-6 text-neutral-600 dark:bg-neutral-800">이번 라운드는 응원해요 📣</div>
      )}
      {myOrder && (
        <div className="text-sm text-neutral-600">말하는 순서: {myOrder.playerIds.map((id) => nameOf(state, id)).join(' → ')}</div>
      )}
      <Scoreboard teams={state.teams} />
    </div>
  );
}

export function OneVoiceStage({ state }: StepProps) {
  const ov = state.oneVoice;
  if (!ov) return <p className="text-center text-5xl text-neutral-400">준비 중…</p>;
  return (
    <div className="space-y-8">
      <h2 className="text-center text-5xl font-black">🗣️ 한마음과 한 입으로 · {ov.round + 1}라운드</h2>
      <p className="text-center text-3xl text-neutral-500">{ov.n}글자 · 차례대로 한 글자씩 이어 말해 단어를 완성하세요</p>
      {ov.word && <div className="text-center text-9xl font-black tracking-widest">{ov.word}</div>}
      <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${state.teams.length}, minmax(0, 1fr))` }}>
        {state.teams.map((t) => {
          const order = ov.orders.find((o) => o.teamId === t.id)?.playerIds ?? [];
          const res = ov.results[t.id];
          return (
            <div key={t.id} className="rounded-3xl p-6 text-white border-[3px] border-[var(--ink)] shadow-[0_6px_0_var(--ink)]" style={{ background: t.color }}>
              <div className="flex items-baseline justify-between"><span className="text-4xl font-black">{t.name}</span><span className="text-6xl font-black tabular-nums">{t.total}</span></div>
              <ol className="mt-4 space-y-2 text-3xl font-semibold">
                {order.map((id, i) => <li key={id}>{i + 1}. {nameOf(state, id)}</li>)}
              </ol>
              {res !== undefined && <div className="mt-4 rounded-xl bg-white/25 py-2 text-center text-4xl font-black">{res ? '⭕ 성공!' : '❌ 아쉬워요'}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OneVoiceAdmin({ state, act }: AdminProps) {
  const ov = state.oneVoice;
  if (!ov) return null;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <b>{ov.round + 1}라운드 · {ov.n}글자</b>
        <button className={btnGhost} onClick={() => act({ type: 'ov_prev_round' })}>◀ 이전 라운드</button>
        <button className={btn} onClick={() => act({ type: 'ov_next_round' })}>다음 라운드 ▶</button>
      </div>
      <div className="rounded-lg bg-neutral-100 p-3 dark:bg-neutral-800">
        {ov.word ? (
          <div className="flex items-center justify-between">
            <span className="text-3xl font-black">{ov.word}</span>
            <button className={btnGhost} onClick={() => act({ type: 'ov_show_word', value: !ov.showWord })}>{ov.showWord ? '빔에서 단어 숨기기' : '빔에 단어 보이기'}</button>
          </div>
        ) : (
          <span className="text-sm text-amber-700">{ov.n}글자 단어가 목록에 없습니다. 스텝 설정의 words에 추가하세요.</span>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {state.teams.map((t) => {
          const order = ov.orders.find((o) => o.teamId === t.id)?.playerIds ?? [];
          const res = ov.results[t.id];
          return (
            <div key={t.id} className="space-y-2 rounded-lg border p-2 text-sm">
              <div className="font-bold"><TeamTag team={t} /> · {t.total}점</div>
              <div>{order.map((id, i) => `${i + 1}.${nameOf(state, id)}`).join(' ')}</div>
              <div className="flex gap-2">
                <button className={`${btn} ${res === true ? 'ring-2 ring-emerald-400' : ''}`} onClick={() => act({ type: 'ov_result', teamId: t.id, ok: true })}>⭕ 성공</button>
                <button className={`${btnGhost} ${res === false ? 'ring-2 ring-red-400' : ''}`} onClick={() => act({ type: 'ov_result', teamId: t.id, ok: false })}>❌ 실패</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
