'use client';
import { useState } from 'react';
import { Scoreboard, TeamTag, btn, btnGhost, input, teamOf, type AdminProps, type StepProps } from '../ui';

export function SheepPlayer({ state }: StepProps) {
  const sh = state.sheep;
  const team = teamOf(state, state.me?.teamId);
  return (
    <div className="space-y-4 text-center">
      <p className="text-neutral-600">&ldquo;내 양은 내 음성을 들으며…&rdquo; (요 10:27)</p>
      <div className="rounded-3xl bg-indigo-600 p-6 text-white shadow-lg">
        <div className="text-2xl font-black">목자의 음성을 따라가요 🐑</div>
        <p className="mt-2 text-sm opacity-90">양이 가져온 카드의 뒷면 QR을<br />폰 카메라로 스캔하세요.<br /><b>걷기만 가능! 뛰지 마세요.</b></p>
      </div>
      {team && <p>우리 팀: <TeamTag team={team} /> {team.total}점</p>}
      <Scoreboard teams={state.teams} />
      {sh && sh.scans.length > 0 && (
        <ul className="space-y-1 text-left text-sm">
          {sh.scans.slice(-5).reverse().map((s, i) => (
            <li key={i} className={s.ok ? 'text-emerald-700' : 'text-red-600'}>{teamOf(state, s.teamId)?.name} · {s.word} {s.ok ? '⭕' : '❌'}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SheepStage({ state }: StepProps) {
  const sh = state.sheep;
  return (
    <div className="space-y-10">
      <h2 className="text-center text-5xl font-black">🐑 내 양은 내 음성을 들으며</h2>
      <p className="text-center text-3xl text-neutral-500">&ldquo;내 양은 내 음성을 들으며 나는 그들을 알며 그들은 나를 따르느니라&rdquo; (요 10:27)</p>
      <Scoreboard teams={state.teams} big />
      {sh && sh.scans.length > 0 && (
        <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-3">
          {sh.scans.slice(-8).reverse().map((s, i) => (
            <span key={i} className={`rounded-full px-6 py-2 text-3xl font-bold text-white ${s.ok ? 'bg-emerald-600' : 'bg-red-600'}`}>
              {teamOf(state, s.teamId)?.name} · {s.word} {s.ok ? '⭕' : '❌'}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function SheepAdmin({ state, act }: AdminProps) {
  const sh = state.sheep;
  const [text, setText] = useState('');
  if (!sh) return null;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <b>스캔 라운드 {sh.round + 1}</b>
        <button className={btnGhost} onClick={() => act({ type: 'sheep_prev_round' })}>◀</button>
        <button className={btn} onClick={() => act({ type: 'sheep_next_round' })}>다음 라운드 ▶ (같은 카드 다시 스캔 가능)</button>
      </div>
      <div>
        <label className="text-sm font-semibold">단어 카드 목록 (한 줄에 하나, 함정 단어는 앞에 *)</label>
        <textarea className={`${input} mt-1 w-full font-mono`} rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={'베드로\n다니엘\n*골리앗\n*가룟유다'} />
        <div className="mt-2 flex flex-wrap gap-2">
          <button className={btn} onClick={() => act({ type: 'sheep_cards_set', text, force: false })}>카드 만들기</button>
          <button className={btnGhost} onClick={() => confirm('스캔 기록이 지워집니다. 계속할까요?') && act({ type: 'sheep_cards_set', text, force: true })}>덮어쓰기(기록 삭제)</button>
          <a className={btnGhost} href="/admin/cards" target="_blank" rel="noreferrer">🖨 카드 시트 열기</a>
        </div>
        <p className="mt-1 text-xs text-neutral-500">현재 {sh.cardCount}장 (함정 {sh.trapCount}장). 인쇄 후 잘라서 카드 앞면에 단어, 뒷면에 QR이 오도록 붙이세요.</p>
      </div>
      {sh.adminCards && sh.adminCards.length > 0 && (
        <div className="flex flex-wrap gap-1 text-xs">
          {sh.adminCards.map((c) => (
            <span key={c.id} className={`rounded px-2 py-1 ${c.isTrap ? 'bg-red-100 text-red-800' : 'bg-neutral-100 text-neutral-800'} ${c.scanned ? 'line-through opacity-50' : ''}`}>{c.word}</span>
          ))}
        </div>
      )}
      <p className="text-xs text-neutral-500">QR 스캔이 안 되면 아래 &lsquo;점수 수동 입력&rsquo;으로 팀 점수를 직접 조정하세요. 스캔 점수: 정답 {state.step?.config.correct ?? 1} / 오답 {state.step?.config.wrong ?? -1}</p>
    </div>
  );
}
