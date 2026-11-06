'use client';
import { useState } from 'react';
import { TeamDot, btn, btnGhost, input, type AdminProps } from '../ui';

/** 게임 승리 확정: 게임 내 득점 1등 팀(동점이면 모두)에게 '승리 점수'를 지급. 직접 선택도 가능. */
export function GameFinishPanel({ state, act }: AdminProps) {
  const step = state.step;
  const gr = state.gameResults?.find((g) => g.stepId === step?.id);
  const [pts, setPts] = useState(String(gr?.winPoints ?? 10));
  const [manual, setManual] = useState<string[]>([]);
  if (!step || !gr) return null;
  const nameOf = (id: string) => state.teams.find((t) => t.id === id)?.name ?? '';
  const points = Number(pts);

  return (
    <div className="space-y-3 rounded-2xl border-[3px] border-[var(--ink)] bg-[var(--gold)]/25 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <b className="font-display text-lg">🏆 게임 승리 확정</b>
        <label className="flex items-center gap-1 text-sm font-semibold">승리 점수
          <input className={`${input} w-20 py-1`} inputMode="numeric" value={pts} onChange={(e) => setPts(e.target.value)} />점
        </label>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {state.teams.map((t) => (
          <span key={t.id} className="rounded-full border-2 border-[var(--ink)] bg-white px-3 py-1 font-bold"><TeamDot color={t.color} /> {t.name} {gr.points[t.id] ?? 0}점</span>
        ))}
      </div>

      {gr.finalized ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold">✅ 확정: {gr.winners.map(nameOf).join(', ')} (+{gr.winPoints}점)</span>
          <button className={btnGhost} onClick={() => confirm('승리 확정을 취소하고 지급한 점수를 되돌립니다. 계속할까요?') && act({ type: 'game_unfinalize', stepId: step.id })}>확정 취소</button>
        </div>
      ) : (
        <div className="space-y-2">
          <button className={`${btn} w-full py-3 text-base`} disabled={!Number.isInteger(points)} onClick={() => act({ type: 'game_finalize', stepId: step.id, winPoints: points })}>
            🏆 승리 확정 {gr.leaders.length ? `(${gr.leaders.map(nameOf).join(', ')} · 득점 1위)` : '(득점 없음 — 아래에서 직접 선택)'}
          </button>
          <details className="text-sm">
            <summary className="cursor-pointer font-semibold">승리 팀 직접 선택</summary>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {state.teams.map((t) => (
                <label key={t.id} className="flex items-center gap-1 font-bold">
                  <input type="checkbox" checked={manual.includes(t.id)} onChange={(e) => setManual(e.target.checked ? [...manual, t.id] : manual.filter((x) => x !== t.id))} />
                  <TeamDot color={t.color} /> {t.name}
                </label>
              ))}
              <button className={btn} disabled={!manual.length || !Number.isInteger(points)} onClick={() => act({ type: 'game_finalize', stepId: step.id, winners: manual, winPoints: points })}>선택한 팀 승리 확정</button>
            </div>
          </details>
        </div>
      )}
      <p className="text-xs opacity-70">확정하면 빔·폰에 승리 배너가 뜨고 누적 승리 점수에 반영됩니다. 동점이면 공동 승리로 각각 점수를 받습니다.</p>
    </div>
  );
}
