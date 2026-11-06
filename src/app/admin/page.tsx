'use client';
import { useEffect, useState } from 'react';
import { useLiveState } from '@/lib/client/useLiveState';
import { OfflineBadge, Scoreboard, TeamDot, btn, btnGhost, input, nameOf, teamOf, type Act } from '@/components/ui';
import { STEP_MODULES } from '@/components/steps/registry';
import { STEP_KINDS, type PublicState, type StepKind } from '@/lib/types';

function Login({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  return (
    <main className="mx-auto grid min-h-dvh max-w-xs place-items-center px-6">
      <form className="w-full space-y-3" onSubmit={async (e) => {
        e.preventDefault();
        const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
        if (res.ok) onDone(); else setErr((await res.json().catch(() => ({}))).error ?? '로그인 실패');
      }}>
        <h1 className="text-xl font-black">관리자</h1>
        <input type="password" className={`${input} w-full`} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호" autoFocus />
        <button className={`${btn} w-full`}>로그인</button>
        {err && <p className="text-sm text-red-600">{err}</p>}
      </form>
    </main>
  );
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="rounded-2xl border border-neutral-200 bg-white/60 p-4 dark:border-neutral-700 dark:bg-neutral-900/60">
      <summary className="cursor-pointer text-base font-black">{title}</summary>
      <div className="mt-3 space-y-3">{children}</div>
    </details>
  );
}

function StepConfig({ state, act }: { state: PublicState; act: Act }) {
  const step = state.step!;
  const [text, setText] = useState(() => JSON.stringify(step.config, null, 2));
  const [err, setErr] = useState('');
  return (
    <details className="text-sm">
      <summary className="cursor-pointer font-semibold text-neutral-600">스텝 설정 (config JSON · 점수·시간·단어 등)</summary>
      <textarea className={`${input} mt-2 w-full font-mono text-xs`} rows={10} value={text} onChange={(e) => setText(e.target.value)} />
      <div className="mt-1 flex items-center gap-2">
        <button className={btn} onClick={() => {
          try { setErr(''); act({ type: 'step_config', stepId: step.id, config: JSON.parse(text) }); } catch { setErr('JSON 형식이 올바르지 않습니다'); }
        }}>설정 저장</button>
        {err && <span className="text-xs text-red-600">{err}</span>}
      </div>
    </details>
  );
}

function Dashboard({ state, act, offline, serverNow }: { state: PublicState; act: Act; offline: boolean; serverNow: () => number }) {
  const steps = [...state.steps].sort((a, b) => a.sort - b.sort);
  const cur = state.step;
  const Mod = cur ? STEP_MODULES[cur.kind] : null;
  const [newName, setNewName] = useState('');
  const [addKind, setAddKind] = useState<StepKind>('entry');
  const [custom, setCustom] = useState<Record<string, string>>({});

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 pb-24 pt-4">
      <OfflineBadge offline={offline} />
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-black">워크샵 1부 관리자</h1>
        <div className="flex gap-2 text-sm">
          <a className={btnGhost} href="/stage" target="_blank" rel="noreferrer">🖥 빔 화면</a>
          <a className={btnGhost} href="/play" target="_blank" rel="noreferrer">📱 참가자 화면</a>
        </div>
      </header>

      <Scoreboard teams={state.teams} />

      <Section title={`진행 · 현재: ${cur?.title ?? '-'}`}>
        <div className="flex gap-2">
          <button className={`${btnGhost} flex-1`} onClick={() => act({ type: 'step_prev' })}>◀ 이전</button>
          <button className={`${btn} flex-[2] py-3 text-base`} onClick={() => act({ type: 'step_next' })}>다음 스텝 ▶</button>
        </div>
        <ol className="space-y-1">
          {steps.map((s, i) => (
            <li key={s.id} className={`flex items-center gap-2 rounded-lg px-2 py-1 text-sm ${s.id === cur?.id ? 'bg-indigo-600 font-bold text-white' : s.status === 'done' ? 'text-neutral-400' : ''}`}>
              <span className="w-5 text-right">{i + 1}</span>
              <button className="flex-1 text-left" onClick={() => s.id !== cur?.id && act({ type: 'step_goto', stepId: s.id })}>{s.title}</button>
              <button aria-label="위로" className="px-1" onClick={() => act({ type: 'step_move', stepId: s.id, dir: 'up' })}>↑</button>
              <button aria-label="아래로" className="px-1" onClick={() => act({ type: 'step_move', stepId: s.id, dir: 'down' })}>↓</button>
              <button aria-label="삭제" className="px-1" disabled={s.id === cur?.id} onClick={() => confirm(`'${s.title}' 스텝을 삭제할까요?`) && act({ type: 'step_delete', stepId: s.id })}>✕</button>
            </li>
          ))}
        </ol>
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-neutral-600">스텝 추가</summary>
          <div className="mt-2 flex flex-wrap gap-2">
            <select className={input} value={addKind} onChange={(e) => setAddKind(e.target.value as StepKind)}>{STEP_KINDS.map((k) => <option key={k.kind} value={k.kind}>{k.label}</option>)}</select>
            <button className={btn} onClick={() => act({ type: 'step_add', kind: addKind })}>추가</button>
          </div>
        </details>
      </Section>

      {cur && Mod && (
        <Section title={`${cur.title} 진행`}>
          <Mod.Admin state={state} act={act} serverNow={serverNow} />
          <StepConfig key={cur.id + JSON.stringify(cur.config)} state={state} act={act} />
        </Section>
      )}

      <Section title="점수 수동 입력 (종이 점수판 대체)">
        <div className="space-y-2">
          {state.teams.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-2">
              <span className="w-24 font-bold"><TeamDot color={t.color} /> {t.name} <span className="tabular-nums">{t.total}</span></span>
              {[-3, -1, 1, 3].map((d) => <button key={d} className={btnGhost} onClick={() => act({ type: 'score_add', teamId: t.id, delta: d, reason: '수동 입력' })}>{d > 0 ? '+' : ''}{d}</button>)}
              <input className={`${input} w-16`} inputMode="numeric" placeholder="±n" value={custom[t.id] ?? ''} onChange={(e) => setCustom({ ...custom, [t.id]: e.target.value })} />
              <button className={btn} onClick={async () => { const n = Number(custom[t.id]); if (Number.isInteger(n) && n) { if (await act({ type: 'score_add', teamId: t.id, delta: n, reason: '수동 입력' })) setCustom({ ...custom, [t.id]: '' }); } }}>입력</button>
            </div>
          ))}
        </div>
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-neutral-600">점수 기록 ({state.scoreLog?.length ?? 0})</summary>
          <ul className="mt-2 space-y-1 text-sm">
            {state.scoreLog?.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2">
                <span><TeamDot color={teamOf(state, e.teamId)?.color ?? '#999'} /> {teamOf(state, e.teamId)?.name} <b>{e.delta > 0 ? '+' : ''}{e.delta}</b> · {e.reason}</span>
                <button className="text-xs text-neutral-500 underline" onClick={() => act({ type: 'score_undo', scoreId: e.id })}>되돌리기</button>
              </li>
            ))}
          </ul>
        </details>
      </Section>

      <Section title={`참가자 (${state.participants.length}명)`} defaultOpen={false}>
        <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (newName.trim() && (await act({ type: 'participant_add', name: newName }))) setNewName(''); }}>
          <input className={`${input} flex-1`} placeholder="대리 입장: 이름" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button className={btn}>추가</button>
        </form>
        <ul className="space-y-1">
          {state.participants.map((p) => (
            <li key={p.id} className="flex items-center gap-2 text-sm">
              <span className="flex-1 font-semibold">{p.name}</span>
              <select className={`${input} py-1 text-sm`} value={p.teamId ?? ''} onChange={(e) => act({ type: 'team_assign', participantId: p.id, teamId: e.target.value || null })}>
                <option value="">팀 없음</option>
                {state.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button className="text-xs underline" onClick={() => { const n = prompt('새 이름', p.name); if (n && n.trim()) act({ type: 'participant_rename', participantId: p.id, name: n }); }}>수정</button>
              <button className="text-xs text-red-600 underline" onClick={() => confirm(`${nameOf(state, p.id)} 삭제할까요?`) && act({ type: 'participant_delete', participantId: p.id })}>삭제</button>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="테스트 · 초기화" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          <button className={btnGhost} onClick={() => act({ type: 'bots_add', n: 15 })}>🤖 테스트 봇 15명 추가</button>
          <button className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700" onClick={() => { if (prompt('모든 데이터를 지우고 처음 상태로 되돌립니다. 계속하려면 RESET 을 입력하세요.') === 'RESET') act({ type: 'reset_all', confirm: 'RESET' }); }}>⚠️ 전체 초기화</button>
        </div>
        <p className="text-xs text-neutral-500">봇 이름은 &lsquo;봇1…&rsquo;입니다. 행사 전 리허설 후 반드시 초기화하세요.</p>
      </Section>
    </main>
  );
}

export default function AdminPage() {
  const { state, offline, unauthorized, refresh, serverNow } = useLiveState('admin');
  const [toast, setToast] = useState('');

  const act: Act = async (action) => {
    try {
      const res = await fetch('/api/admin/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? '실패했어요');
      if (data.message) setToast(data.message);
      await refresh(true);
      return true;
    } catch (e) {
      setToast(`⚠️ ${e instanceof Error ? e.message : '실패했어요'}`);
      return false;
    }
  };
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  if (unauthorized) return <Login onDone={() => location.reload()} />;
  if (!state) return <main className="grid min-h-dvh place-items-center text-neutral-500">불러오는 중…</main>;
  return (
    <>
      <Dashboard state={state} act={act} offline={offline} serverNow={serverNow} />
      {toast && <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-xl bg-neutral-900 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg">{toast}</div>}
    </>
  );
}
