'use client';
import { useState } from 'react';
import { Beep, Scoreboard, SecondsTimer, Countdown, TeamTag, btn, btnGhost, input, nameOf, teamOf, type AdminProps, type StepProps } from '../ui';
import type { PubMatch, PublicState } from '@/lib/types';

const focusMatch = (ms: PubMatch[]): PubMatch | undefined => ms.find((m) => m.status === 'live') ?? ms.find((m) => m.status === 'pending') ?? ms.at(-1);

function Traits({ m, big }: { m: PubMatch; big?: boolean }) {
  const used = m.traits.filter((t) => t.ok || t.dup);
  if (!used.length) return <p className={big ? 'text-3xl text-neutral-400' : 'text-sm text-neutral-400'}>아직 기록이 없습니다</p>;
  return (
    <ul className={`flex flex-wrap gap-2 ${big ? 'gap-3' : ''}`}>
      {used.map((t) => (
        <li key={t.id} className={`rounded-full px-3 py-1 font-semibold ${big ? 'px-6 py-2 text-3xl' : 'text-sm'} ${t.dup ? 'bg-red-600 text-white' : 'bg-emerald-100 text-emerald-900'}`}>
          {t.figure} · {t.trait}{t.dup ? ' (중복!)' : ''}
        </li>
      ))}
    </ul>
  );
}

export function AmenPlayer({ state, serverNow }: StepProps) {
  const a = state.amen;
  const meId = state.me?.id;
  if (!a) return <p className="text-center text-neutral-500">대진 준비 중…</p>;
  const m = focusMatch(a.matches);
  const mine = a.matches.find((x) => x.status !== 'done' && (x.playerA === meId || x.playerB === meId));
  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-neutral-500">&ldquo;너 ○○처럼 ○○한 거 알지?&rdquo; → <b>&ldquo;아멘!&rdquo;</b><br />성경 인물에 빗댄 칭찬 · 특성 중복 금지 · 5초 안에!</p>
      {mine && (
        <div className="rounded-2xl bg-[var(--primary)] p-4 text-center text-white">
          <div className="text-lg font-black">🎤 내가 출전해요!</div>
          <div className="text-sm opacity-90">{mine.status === 'live' ? '지금 진행 중' : '곧 시작합니다. 앞으로 나와 주세요'}</div>
        </div>
      )}
      {m && (
        <div className="space-y-2 rounded-2xl border p-3">
          <div className="flex items-center justify-between text-sm font-bold">
            <TeamTag team={teamOf(state, m.teamA)} />
            <span>{m.successA} : {m.successB}</span>
            <TeamTag team={teamOf(state, m.teamB)} />
          </div>
          <div className="text-center text-sm text-neutral-600">{nameOf(state, m.playerA)} vs {nameOf(state, m.playerB)}</div>
          {m.status === 'live' && <SecondsTimer startAt={m.meta.turnStartedAt} seconds={5} serverNow={serverNow} />}
          <div className="pt-1 text-xs font-semibold text-neutral-500">사용된 특성</div>
          <Traits m={m} />
        </div>
      )}
      <Scoreboard teams={state.teams} />
    </div>
  );
}

export function AmenStage({ state, serverNow }: StepProps) {
  const [sound, setSound] = useState(false);
  const a = state.amen;
  if (!a) return <p className="text-center text-5xl text-neutral-400">대진 준비 중…</p>;
  const m = focusMatch(a.matches);
  const ta = teamOf(state, m?.teamA);
  const tb = teamOf(state, m?.teamB);
  const dupRecent = !!m?.meta.lastDupAt && serverNow() - m.meta.lastDupAt < 4000;
  const turnTeam = m?.meta.turnSide === 'b' ? tb : ta;
  return (
    <div className="space-y-6">
      <Beep trigger={m?.meta.lastDupAt} enabled={sound} />
      {!sound && <button className="fixed bottom-3 right-3 rounded bg-neutral-800 px-3 py-1 text-sm text-white opacity-60" onClick={() => setSound(true)}>🔊 소리 켜기</button>}
      <h2 className="text-center text-5xl font-black">🙏 아멘 게임</h2>
      {m && (
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
          <div className="rounded-3xl p-6 text-center text-white" style={{ background: ta?.color }}>
            <div className="text-4xl font-black">{ta?.name}</div>
            <div className="text-3xl">{nameOf(state, m.playerA)}</div>
            <div className="mt-2 text-8xl font-black tabular-nums">{m.successA}</div>
          </div>
          <div className="text-center">
            {m.status === 'live' ? (
              <>
                <div className="text-3xl font-bold" style={{ color: turnTeam?.color }}>{turnTeam?.name} 차례</div>
                <SecondsTimer startAt={m.meta.turnStartedAt} seconds={5} serverNow={serverNow} big />
                <Countdown endAt={m.meta.startedAt ? m.meta.startedAt + (state.step?.config.matchSeconds ?? 120) * 1000 : null} serverNow={serverNow} label="남은 시간" />
              </>
            ) : (
              <div className="text-5xl font-black">{m.status === 'done' ? '경기 종료' : 'VS'}</div>
            )}
          </div>
          <div className="rounded-3xl p-6 text-center text-white" style={{ background: tb?.color }}>
            <div className="text-4xl font-black">{tb?.name}</div>
            <div className="text-3xl">{nameOf(state, m.playerB)}</div>
            <div className="mt-2 text-8xl font-black tabular-nums">{m.successB}</div>
          </div>
        </div>
      )}
      {dupRecent && <div className="animate-pulse rounded-3xl bg-red-600 py-6 text-center text-6xl font-black text-white">⚠️ 특성 중복!</div>}
      {m && (
        <div className="space-y-2">
          <div className="text-3xl font-bold text-neutral-500">사용된 특성</div>
          <Traits m={m} big />
        </div>
      )}
      <div className="border-t pt-4"><Scoreboard teams={state.teams} big /></div>
    </div>
  );
}

function PlayerSelect({ state, m, side, act }: { state: PublicState; m: PubMatch; side: 'a' | 'b'; act: AdminProps['act'] }) {
  const teamId = side === 'a' ? m.teamA : m.teamB;
  const team = teamOf(state, teamId);
  const blocked = new Set(side === 'a' ? m.blockedA : m.blockedB);
  const value = (side === 'a' ? m.playerA : m.playerB) ?? '';
  return (
    <label className="flex items-center gap-2 text-sm">
      <TeamTag team={team} />
      <select className={`${input} flex-1`} value={value} disabled={m.status === 'done'} onChange={(e) => act({ type: 'amen_set_player', matchId: m.id, side, participantId: e.target.value || null })}>
        <option value="">출전자 선택</option>
        {team?.memberIds.map((id) => (
          <option key={id} value={id} disabled={blocked.has(id)}>{nameOf(state, id)}{blocked.has(id) ? ' (이미 출전)' : ''}</option>
        ))}
      </select>
    </label>
  );
}

function MatchAdmin({ state, m, act, serverNow }: { state: PublicState; m: PubMatch; act: AdminProps['act']; serverNow: () => number }) {
  const [figure, setFigure] = useState('');
  const [trait, setTrait] = useState('');
  const idx = state.amen!.matches.findIndex((x) => x.id === m.id);
  const turn = m.meta.turnSide === 'b' ? 'b' : 'a';
  const ta = teamOf(state, m.teamA);
  const tb = teamOf(state, m.teamB);

  return (
    <div className={`space-y-3 rounded-xl border p-3 ${m.status === 'live' ? 'border-indigo-500 ring-2 ring-indigo-200' : ''}`}>
      <div className="flex items-center justify-between">
        <b>{idx + 1}경기 · {ta?.name} vs {tb?.name}</b>
        <span className="text-xs font-semibold">{m.status === 'pending' ? '대기' : m.status === 'live' ? '진행 중' : '종료'}</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <PlayerSelect state={state} m={m} side="a" act={act} />
        <PlayerSelect state={state} m={m} side="b" act={act} />
      </div>

      {m.status === 'pending' && <button className={btn} disabled={!m.playerA || !m.playerB} onClick={() => act({ type: 'amen_start', matchId: m.id })}>경기 시작</button>}

      {m.status === 'live' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-neutral-100 p-2 dark:bg-neutral-800">
            <div className="text-sm"><b style={{ color: (turn === 'a' ? ta : tb)?.color }}>{(turn === 'a' ? ta : tb)?.name}</b> 차례 ({nameOf(state, turn === 'a' ? m.playerA : m.playerB)})</div>
            <div className="w-24"><SecondsTimer startAt={m.meta.turnStartedAt} seconds={state.step?.config.turnSeconds ?? 5} serverNow={serverNow} /></div>
            <div className="text-lg font-black">{m.successA} : {m.successB}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className={input} placeholder="성경 인물 (예: 다니엘)" value={figure} onChange={(e) => setFigure(e.target.value)} />
            <input className={input} placeholder="특성 (예: 용감한)" value={trait} onChange={(e) => setTrait(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={btn} onClick={async () => { if (await act({ type: 'amen_trait', matchId: m.id, figure, trait })) { setFigure(''); setTrait(''); } }}>✅ 성공 · 아멘 (다음 차례)</button>
            <button className={btnGhost} onClick={() => act({ type: 'amen_swap_turn', matchId: m.id })}>차례 바꾸기</button>
            <button className={btnGhost} onClick={() => act({ type: 'amen_timer_restart', matchId: m.id })}>5초 재시작</button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold">실패:</span>
            {(['a', 'b'] as const).map((s) =>
              ['5초 초과', '성경 인물 아님', '아멘 못함'].map((note) => (
                <button key={s + note} className="rounded border border-red-300 px-2 py-1 text-red-700 active:scale-95" onClick={() => act({ type: 'amen_fail', matchId: m.id, side: s, note })}>
                  {(s === 'a' ? ta : tb)?.name} {note}
                </button>
              )),
            )}
          </div>
          <button className={btn} onClick={() => confirm('시간 종료로 경기를 마칠까요? 성공 수로 승패를 정합니다.') && act({ type: 'amen_finish', matchId: m.id })}>⏱ 시간 종료 · 경기 끝내기</button>
        </div>
      )}

      {m.traits.length > 0 && (
        <div className="space-y-1 text-xs">
          {m.traits.map((t) => (
            <div key={t.id} className={t.ok ? 'text-emerald-700' : 'text-red-600'}>
              [{t.side === 'a' ? ta?.name : tb?.name}] {t.ok ? `${t.figure} · ${t.trait}` : `${t.figure ? t.figure + ' · ' + t.trait + ' — ' : ''}${t.note}`}
            </div>
          ))}
        </div>
      )}
      {m.status === 'done' && (
        <div className="flex items-center gap-3 text-sm">
          <span>결과: {m.meta.winner === 'draw' ? '무승부' : `${m.meta.winner === 'a' ? ta?.name : tb?.name} 승`} ({m.meta.pointsA}:{m.meta.pointsB}점)</span>
          <button className={btnGhost} onClick={() => confirm('경기를 다시 열고 승점을 취소합니다. 계속할까요?') && act({ type: 'amen_reopen', matchId: m.id })}>다시 열기</button>
        </div>
      )}
    </div>
  );
}

export function AmenAdmin({ state, act, serverNow }: AdminProps) {
  const a = state.amen;
  if (!a || !a.matches.length) return <p className="text-sm text-amber-700">대진이 없습니다. 허밍 스텝에서 팀을 먼저 만든 뒤 이 스텝에 진입하세요.</p>;
  return (
    <div className="space-y-3">
      <p className="text-xs text-neutral-500">승점 {a.points.win}/{a.points.draw}/{a.points.loss} · 특성 중복 기준: {a.dupMode === 'trait_only' ? '인물 무관, 특성만' : '같은 인물의 같은 특성'} (설정은 아래 &lsquo;스텝 설정&rsquo;에서 변경)</p>
      {a.matches.map((m) => <MatchAdmin key={m.id} state={state} m={m} act={act} serverNow={serverNow} />)}
    </div>
  );
}
