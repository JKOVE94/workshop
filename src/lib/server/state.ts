import { rank } from '../game/scoring';
import { usedPlayers } from '../game/league';
import { letterCount, letters, pickWord, speakingOrder } from '../game/oneVoice';
import { DEFAULT_WIN_POINTS, GAME_KINDS } from './defaults';
import { DEFAULT_AMEN_POINTS } from '../game/scoring';
import type { PubMatch, PublicState, Role, Snapshot } from '../types';

/** 스냅샷 → 역할별 화면 상태. 비공개 정보(함정 카드, 다른 팀 곡)는 여기서 걸러낸다. */
export function buildState(s: Snapshot, role: Role, participantId: string | null): PublicState {
  const step = s.steps.find((x) => x.id === s.event.current_step_id) ?? null;

  const memberOrder = new Map<string, number>();
  s.participants.forEach((p, i) => memberOrder.set(p.id, i));
  const teamOf = new Map(s.members.map((m) => [m.participant_id, m.team_id]));

  // 누적 점수 = 게임별 '승리 점수'(meta.win)만 합산. 게임 내 득점(raw)은 승자 판정과 동점 처리에만 쓴다.
  const totals = new Map<string, number>();
  const rawAll = new Map<string, number>();
  const rawNow = new Map<string, number>();
  for (const e of s.scores) {
    if (e.meta?.win) totals.set(e.team_id, (totals.get(e.team_id) ?? 0) + e.delta);
    else {
      rawAll.set(e.team_id, (rawAll.get(e.team_id) ?? 0) + e.delta);
      if (e.step_id && e.step_id === step?.id) rawNow.set(e.team_id, (rawNow.get(e.team_id) ?? 0) + e.delta);
    }
  }

  const membersOf = (teamId: string) =>
    s.members
      .filter((m) => m.team_id === teamId)
      .sort((a, b) => a.sort - b.sort || (memberOrder.get(a.participant_id) ?? 0) - (memberOrder.get(b.participant_id) ?? 0))
      .map((m) => m.participant_id);

  const teams = s.teams.map((t) => ({
    id: t.id, name: t.name, color: t.color, nameLocked: !!t.name_locked,
    total: totals.get(t.id) ?? 0,
    tiebreak: rawAll.get(t.id) ?? 0,
    gamePoints: rawNow.get(t.id) ?? 0,
    memberIds: membersOf(t.id),
  }));
  const rankedTeams = step?.kind === 'part1_result' || step?.kind === 'awards' ? rank(teams) : teams;

  const me = participantId ? s.participants.find((p) => p.id === participantId) : null;

  const out: PublicState = {
    rev: Number(s.event.revision),
    now: Date.now(),
    empty: false,
    step: step ? { id: step.id, kind: step.kind, title: step.title, config: step.config, state: step.state } : null,
    steps: s.steps.map((x) => ({ id: x.id, kind: x.kind, title: x.title, status: x.status, sort: x.sort })),
    participants: s.participants.map((p) => ({ id: p.id, name: p.name, teamId: teamOf.get(p.id) ?? null })),
    teams: rankedTeams,
    me: role === 'player' ? (me ? { id: me.id, name: me.name, teamId: teamOf.get(me.id) ?? null } : null) : undefined,
  };

  const humStep = s.steps.find((x) => x.kind === 'hum_team');
  if (step?.kind === 'hum_team' || (humStep && role === 'admin')) {
    const hs = humStep!;
    const revealed = !!hs.state.revealed;
    const myTeam = me ? teamOf.get(me.id) : null;
    out.hum = {
      revealed,
      timerEnd: hs.state.timerEnd ?? null,
      mySong: myTeam ? s.songs.find((x) => x.team_id === myTeam)?.title : undefined,
      songs: role === 'admin' || (role === 'stage' && revealed) ? s.songs.map((x) => ({ id: x.id, title: x.title, teamId: x.team_id })) : undefined,
    };
  }

  const amenStep = s.steps.find((x) => x.kind === 'amen');
  if (amenStep && (step?.kind === 'amen' || role === 'admin')) {
    const cfg = amenStep.config;
    const ms = s.matches.filter((m) => m.step_id === amenStep.id);
    const pubMatches: PubMatch[] = ms.map((m) => {
      const tr = s.traits.filter((t) => t.match_id === m.id);
      const failed = tr.find((t) => !t.ok);
      return {
        id: m.id, teamA: m.team_a, teamB: m.team_b, playerA: m.player_a, playerB: m.player_b,
        status: m.status, meta: m.meta,
        traits: tr.map((t) => ({ id: t.id, side: t.side, figure: t.figure, trait: t.trait, ok: t.ok, dup: t.dup, note: t.note })),
        successA: tr.filter((t) => t.ok && t.side === 'a').length,
        successB: tr.filter((t) => t.ok && t.side === 'b').length,
        failedSide: failed ? failed.side : null,
        blockedA: [...usedPlayers(ms, m.team_a, m.id)],
        blockedB: [...usedPlayers(ms, m.team_b, m.id)],
      };
    });
    out.amen = { matches: pubMatches, points: cfg.points ?? DEFAULT_AMEN_POINTS, dupMode: cfg.dupMode ?? 'figure_trait' };
  }

  const ovStep = s.steps.find((x) => x.kind === 'one_voice');
  if (ovStep && (step?.kind === 'one_voice' || role === 'admin')) {
    const round = Number(ovStep.state.round ?? 0);
    const sizes = teams.map((t) => t.memberIds.length);
    const n = letterCount(sizes);
    const words: string[] = ovStep.config.words ?? [];
    const word = pickWord(words, n, round);
    const showWord = !!ovStep.state.showWord;
    const orders = teams.map((t) => ({ teamId: t.id, playerIds: speakingOrder(t.memberIds, n, round) }));
    const ov: NonNullable<PublicState['oneVoice']> = {
      n, round, wordLen: n, orders,
      results: (ovStep.state.results ?? {})[round] ?? {},
      showWord,
    };
    if (word) {
      if (role === 'admin' || (role === 'stage' && showWord)) ov.word = word;
      if (role === 'player' && me && ovStep.config.letterMode !== false) {
        const myOrder = orders.find((o) => o.playerIds.includes(me.id));
        if (myOrder) {
          const idx = myOrder.playerIds.indexOf(me.id);
          ov.myIndex = idx;
          // 글자 위치는 "말하는 순서" 기준: 첫 번째로 말하는 사람이 첫 글자
          ov.myLetter = letters(word)[idx];
        }
      }
    }
    out.oneVoice = ov;
  }

  const shStep = s.steps.find((x) => x.kind === 'sheep_voice');
  if (shStep && (step?.kind === 'sheep_voice' || role === 'admin')) {
    const round = Number(shStep.state.round ?? 0);
    const cardById = new Map(s.cards.map((c) => [c.id, c]));
    const scans = s.scans
      .filter((x) => x.round === round)
      .map((x) => ({ word: cardById.get(x.card_id)?.word ?? '?', teamId: x.team_id, ok: x.ok, at: x.created_at, round: x.round }));
    out.sheep = {
      round,
      cardCount: s.cards.length,
      trapCount: s.cards.filter((c) => c.is_trap).length,
      scans,
    };
    if (role === 'admin') {
      const scanned = new Set(s.scans.filter((x) => x.round === round).map((x) => x.card_id));
      out.sheep.adminCards = s.cards.map((c) => ({ id: c.id, word: c.word, isTrap: c.is_trap, scanned: scanned.has(c.id) }));
    }
  }

  // 게임별 득점(raw)과 확정된 승리 팀
  out.gameResults = s.steps
    .filter((st) => (GAME_KINDS as readonly string[]).includes(st.kind))
    .map((st) => {
      const points: Record<string, number> = {};
      for (const t of s.teams) points[t.id] = 0;
      for (const e of s.scores) if (e.step_id === st.id && !e.meta?.win) points[e.team_id] = (points[e.team_id] ?? 0) + e.delta;
      const max = Math.max(0, ...Object.values(points));
      const leaders = max > 0 ? Object.keys(points).filter((k) => points[k] === max) : [];
      const finalized = !!st.state.finalized;
      return {
        stepId: st.id, title: st.title, kind: st.kind, points, leaders, finalized,
        winners: finalized ? ((st.state.winners ?? []) as string[]) : [],
        winPoints: Number(st.config.winPoints ?? DEFAULT_WIN_POINTS[st.kind] ?? 0),
      };
    });

  return out;
}
