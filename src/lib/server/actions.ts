import { db, must } from './supabase';
import { loadSnapshot, seedSteps } from './repo';
import { DEFAULT_WIN_POINTS, GAME_KINDS, HUM_SONGS, TEAM_COLORS, TEAM_NAMES } from './defaults';
import { smallestGroup, splitEvenly } from '../game/balance';
import { leagueMatches, usedPlayers } from '../game/league';
import { isDuplicateTrait, type DupMode } from '../game/traits';
import { amenOutcome, DEFAULT_AMEN_POINTS } from '../game/scoring';
import { newToken, parseCardWords } from '../game/cards';
import { STEP_KINDS, type Snapshot, type StepKind, type StepRow } from '../types';

export class ActionError extends Error {}

type A = Record<string, any>;
const fail = (m: string): never => {
  throw new ActionError(m);
};
const str = (v: unknown, label: string, max = 200): string => {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) fail(`${label}을(를) 입력하세요`);
  return s.slice(0, max);
};
const int = (v: unknown, label: string): number => {
  const n = Number(v);
  if (!Number.isInteger(n)) fail(`${label}이(가) 올바르지 않습니다`);
  return n;
};

// ───────────── 팀 편성 ─────────────

/** 팀이 없으면 만든다. 이미 있으면 건드리지 않는다 (멱등). */
async function ensureTeams(eventId: string, count: number): Promise<void> {
  const existing = must(await db().from('teams').select('id').eq('event_id', eventId), 'teams') as { id: string }[];
  if (existing.length) return;
  if (count < 2) fail('팀은 최소 2개가 필요합니다');
  const rows = Array.from({ length: count }, (_, i) => ({
    event_id: eventId, name: TEAM_NAMES[i] ?? `${i + 1}팀`, color: TEAM_COLORS[i % TEAM_COLORS.length], sort: i,
  }));
  const teams = must(await db().from('teams').insert(rows).select('id,sort'), 'teams 생성') as { id: string; sort: number }[];
  teams.sort((a, b) => a.sort - b.sort);
  const ps = must(await db().from('participants').select('id').eq('event_id', eventId), 'participants') as { id: string }[];
  const groups = splitEvenly(ps.map((p) => p.id), teams.length);
  const members = groups.flatMap((g, ti) => g.map((pid, i) => ({ participant_id: pid, team_id: teams[ti].id, sort: i })));
  if (members.length) must(await db().from('team_members').insert(members), 'team_members');
}

async function ensureSongs(eventId: string): Promise<void> {
  const have = must(await db().from('hum_songs').select('id,title,sort').eq('event_id', eventId).order('sort'), 'hum_songs') as { id: string; title: string; sort: number }[];
  if (have.length) {
    // 곡은 고정: 예전 값이 남아 있으면 고정 곡으로 맞춘다 (멱등)
    for (const row of have) {
      const want = HUM_SONGS[row.sort];
      if (want && row.title !== want) must(await db().from('hum_songs').update({ title: want }).eq('id', row.id), 'song 동기화');
    }
    return;
  }
  const teams = must(await db().from('teams').select('id,sort').eq('event_id', eventId).order('sort'), 'teams') as { id: string }[];
  if (HUM_SONGS.length < teams.length) fail(`허밍 곡이 팀 수(${teams.length})보다 적습니다`);
  must(await db().from('hum_songs').insert(teams.map((t, i) => ({ event_id: eventId, title: HUM_SONGS[i], team_id: t.id, sort: i }))), 'hum_songs 생성');
}

async function ensureMatches(eventId: string, step: StepRow): Promise<void> {
  const have = must(await db().from('amen_matches').select('id').eq('step_id', step.id), 'matches') as { id: string }[];
  if (have.length) return;
  const teams = must(await db().from('teams').select('id,sort').eq('event_id', eventId).order('sort'), 'teams') as { id: string }[];
  if (teams.length < 2) return; // 팀 편성 전이면 건너뜀. 진입 시 다시 시도한다.
  const rows = leagueMatches(teams.map((t) => t.id)).map(([a, b], i) => ({ event_id: eventId, step_id: step.id, sort: i, team_a: a, team_b: b }));
  must(await db().from('amen_matches').insert(rows), 'matches 생성');
}

/** 스텝 진입 부수효과. 반드시 멱등이어야 한다 (이전/다음을 눌러도 안전). */
async function onEnter(eventId: string, step: StepRow) {
  if (step.kind === 'hum_team') {
    await ensureTeams(eventId, HUM_SONGS.length);
    await ensureSongs(eventId);
  }
  if (step.kind === 'amen') await ensureMatches(eventId, step);
}

async function gotoStep(eventId: string, snap: Snapshot, stepId: string) {
  const target = snap.steps.find((s) => s.id === stepId);
  if (!target) return fail('스텝을 찾을 수 없습니다');
  await onEnter(eventId, target); // 실패하면 전환하지 않는다
  for (const s of snap.steps) {
    const status = s.sort < target.sort ? 'done' : s.id === target.id ? 'active' : 'pending';
    if (s.status !== status) must(await db().from('program_steps').update({ status }).eq('id', s.id), 'step status');
  }
  must(await db().from('events').update({ current_step_id: target.id }).eq('id', eventId), 'current step');
}

async function patchStep(step: StepRow, patch: { config?: A; state?: A; title?: string }) {
  const upd: A = {};
  if (patch.config) upd.config = { ...step.config, ...patch.config };
  if (patch.state) upd.state = { ...step.state, ...patch.state };
  if (patch.title) upd.title = patch.title;
  must(await db().from('program_steps').update(upd).eq('id', step.id), 'step 갱신');
}

const stepOf = (snap: Snapshot, kind: StepKind): StepRow => snap.steps.find((s) => s.kind === kind) ?? fail(`'${kind}' 스텝이 없습니다`);

/** 이미 지급한 승리 점수를 보정 행(음수)으로 되돌린다 (append-only 유지) */
async function revokeWins(eventId: string, snap: Snapshot, st: StepRow) {
  const net = new Map<string, number>();
  for (const e of snap.scores) if (e.step_id === st.id && e.meta?.win) net.set(e.team_id, (net.get(e.team_id) ?? 0) + e.delta);
  for (const [teamId, n] of net) await addScore(eventId, teamId, st.id, -n, `${st.title} 승리 취소`, { win: true, reversal: true });
}

async function addScore(eventId: string, teamId: string, stepId: string | null, delta: number, reason: string, meta: A = {}) {
  if (!delta) return;
  must(await db().from('score_events').insert({ event_id: eventId, team_id: teamId, step_id: stepId, delta, reason, meta }), 'score 기록');
}

// ───────────── 아멘 게임 ─────────────

async function finishMatch(eventId: string, snap: Snapshot, matchId: string, failedSide: 'a' | 'b' | null) {
  const m = snap.matches.find((x) => x.id === matchId) ?? fail('경기를 찾을 수 없습니다');
  const step = stepOf(snap, 'amen');
  const tr = snap.traits.filter((t) => t.match_id === m.id);
  const sa = tr.filter((t) => t.ok && t.side === 'a').length;
  const sb = tr.filter((t) => t.ok && t.side === 'b').length;
  const out = amenOutcome(sa, sb, failedSide, step.config.points ?? DEFAULT_AMEN_POINTS);
  // 동시 클릭에도 점수가 두 번 들어가지 않도록 상태 전이를 조건부 update로 선점한다.
  const claimed = must(
    await db().from('amen_matches').update({ status: 'done', meta: { ...m.meta, endedAt: Date.now(), winner: out.winner, pointsA: out.pointsA, pointsB: out.pointsB } })
      .eq('id', m.id).neq('status', 'done').select('id'),
    'match 종료',
  ) as { id: string }[];
  if (!claimed.length) return;
  const label = `아멘 게임 ${m.sort + 1}경기`;
  await addScore(eventId, m.team_a, step.id, out.pointsA, label, { matchId: m.id });
  await addScore(eventId, m.team_b, step.id, out.pointsB, label, { matchId: m.id });
}

async function amenAction(eventId: string, snap: Snapshot, a: A) {
  const step = stepOf(snap, 'amen');
  const cfg = step.config;
  const m = snap.matches.find((x) => x.id === a.matchId);
  if (!m) return fail('경기를 찾을 수 없습니다');

  switch (a.type) {
    case 'amen_set_player': {
      if (m.status === 'done') return fail('끝난 경기입니다');
      const side = a.side === 'b' ? 'b' : 'a';
      const teamId = side === 'a' ? m.team_a : m.team_b;
      const pid: string | null = a.participantId || null;
      if (pid) {
        const mem = snap.members.find((x) => x.participant_id === pid);
        if (!mem || mem.team_id !== teamId) return fail('그 팀의 팀원이 아닙니다');
        if (usedPlayers(snap.matches, teamId, m.id).has(pid)) return fail('이미 다른 경기에 출전한 사람입니다');
      }
      must(await db().from('amen_matches').update(side === 'a' ? { player_a: pid } : { player_b: pid }).eq('id', m.id), 'player 지정');
      return;
    }
    case 'amen_start': {
      if (!m.player_a || !m.player_b) return fail('양쪽 출전자를 먼저 지정하세요');
      if (m.status === 'done') return fail('끝난 경기입니다');
      const now = Date.now();
      must(await db().from('amen_matches').update({ status: 'live', meta: { ...m.meta, startedAt: now, turnSide: 'a', turnStartedAt: now } }).eq('id', m.id), 'match 시작');
      return;
    }
    case 'amen_timer_restart': {
      must(await db().from('amen_matches').update({ meta: { ...m.meta, turnStartedAt: Date.now() } }).eq('id', m.id), 'timer');
      return;
    }
    case 'amen_swap_turn': {
      must(await db().from('amen_matches').update({ meta: { ...m.meta, turnSide: m.meta.turnSide === 'b' ? 'a' : 'b', turnStartedAt: Date.now() } }).eq('id', m.id), 'turn');
      return;
    }
    case 'amen_trait': {
      if (m.status !== 'live') return fail('진행 중인 경기가 아닙니다');
      const figure = str(a.figure, '성경 인물', 40);
      const trait = str(a.trait, '특성', 60);
      const side: 'a' | 'b' = m.meta.turnSide === 'b' ? 'b' : 'a';
      const history = snap.traits.filter((t) => t.match_id === m.id && t.ok);
      const dup = isDuplicateTrait(history, { figure, trait }, (cfg.dupMode ?? 'figure_trait') as DupMode);
      const speaker = side === 'a' ? m.player_a : m.player_b;
      must(await db().from('amen_traits').insert({ match_id: m.id, side, speaker_id: speaker, figure, trait, ok: !dup, dup, note: dup ? '특성 중복' : '' }), 'trait 기록');
      if (dup) {
        must(await db().from('amen_matches').update({ meta: { ...m.meta, lastDupAt: Date.now() } }).eq('id', m.id), 'dup 표시');
        if (cfg.failEndsMatch !== false) await finishMatch(eventId, snap, m.id, side);
      } else {
        must(await db().from('amen_matches').update({ meta: { ...m.meta, turnSide: side === 'a' ? 'b' : 'a', turnStartedAt: Date.now() } }).eq('id', m.id), 'turn');
      }
      return;
    }
    case 'amen_fail': {
      if (m.status !== 'live') return fail('진행 중인 경기가 아닙니다');
      const side: 'a' | 'b' = a.side === 'b' ? 'b' : 'a';
      const note = str(a.note ?? '실패', '사유', 40);
      const speaker = side === 'a' ? m.player_a : m.player_b;
      must(await db().from('amen_traits').insert({ match_id: m.id, side, speaker_id: speaker, figure: '', trait: '', ok: false, dup: false, note }), 'fail 기록');
      if (cfg.failEndsMatch !== false) await finishMatch(eventId, snap, m.id, side);
      return;
    }
    case 'amen_finish': {
      if (m.status === 'done') return;
      await finishMatch(eventId, snap, m.id, null);
      return;
    }
    case 'amen_reopen': {
      // 오입력 복구용: 점수를 보정 행으로 되돌리고 경기를 다시 연다
      if (m.status !== 'done') return;
      const rows = snap.scores.filter((s) => s.meta?.matchId === m.id && !s.meta?.reversal);
      for (const r of rows) await addScore(eventId, r.team_id, step.id, -r.delta, `${r.reason} 취소`, { matchId: m.id, reversal: true });
      must(await db().from('amen_matches').update({ status: 'live', meta: { ...m.meta, turnStartedAt: Date.now() } }).eq('id', m.id), 'reopen');
      return;
    }
  }
}

// ───────────── 한마음과 한 입으로 ─────────────

async function oneVoiceAction(eventId: string, snap: Snapshot, a: A) {
  const step = stepOf(snap, 'one_voice');
  const round = Number(step.state.round ?? 0);
  const pts = Number(step.config.pointsPerSuccess ?? 1);
  if (a.type === 'ov_result') {
    const teamId = str(a.teamId, '팀');
    const ok = !!a.ok;
    const results = { ...(step.state.results ?? {}) };
    const cur = { ...(results[round] ?? {}) };
    const prev: boolean | undefined = cur[teamId];
    if (prev === ok) return;
    cur[teamId] = ok;
    results[round] = cur;
    await patchStep(step, { state: { results } });
    const delta = (ok ? pts : 0) - (prev ? pts : 0);
    await addScore(eventId, teamId, step.id, delta, `한마음과 한 입으로 ${round + 1}라운드 ${ok ? '성공' : '실패'}`, { round });
  } else if (a.type === 'ov_next_round') {
    await patchStep(step, { state: { round: round + 1, showWord: false } });
  } else if (a.type === 'ov_prev_round') {
    await patchStep(step, { state: { round: Math.max(0, round - 1), showWord: false } });
  } else if (a.type === 'ov_show_word') {
    await patchStep(step, { state: { showWord: !!a.value } });
  }
}

// ───────────── 내 양은 내 음성을 들으며 ─────────────

async function sheepAction(eventId: string, snap: Snapshot, a: A) {
  const step = stepOf(snap, 'sheep_voice');
  if (a.type === 'sheep_cards_set') {
    const cards = parseCardWords(String(a.text ?? ''));
    if (!cards.length) return fail('단어를 한 줄에 하나씩 입력하세요');
    if (snap.scans.length && !a.force) return fail('이미 스캔 기록이 있습니다. 카드를 다시 만들면 기록이 지워집니다 (force 필요)');
    must(await db().from('word_cards').delete().eq('event_id', eventId), 'cards 삭제');
    must(await db().from('word_cards').insert(cards.map((c, i) => ({ event_id: eventId, word: c.word, is_trap: c.isTrap, qr_token: newToken(), sort: i }))), 'cards 생성');
  } else if (a.type === 'sheep_next_round') {
    await patchStep(step, { state: { round: Number(step.state.round ?? 0) + 1 } });
  } else if (a.type === 'sheep_prev_round') {
    await patchStep(step, { state: { round: Math.max(0, Number(step.state.round ?? 0) - 1) } });
  }
}

// ───────────── 허밍 ─────────────

async function humAction(eventId: string, snap: Snapshot, a: A) {
  const step = stepOf(snap, 'hum_team');
  if (a.type === 'hum_timer') {
    const sec = int(a.seconds ?? step.config.timerSeconds ?? 180, '시간');
    await patchStep(step, { state: { timerEnd: Date.now() + sec * 1000 } });
  } else if (a.type === 'hum_timer_clear') {
    await patchStep(step, { state: { timerEnd: null } });
  } else if (a.type === 'hum_reveal') {
    await patchStep(step, { state: { revealed: !!a.value } });
  } else if (a.type === 'hum_reshuffle') {
    // 명시적 버튼으로만: 현재 명단 기준으로 팀을 다시 섞는다 (점수는 유지)
    const teams = snap.teams;
    if (!teams.length) return fail('팀이 아직 없습니다');
    must(await db().from('team_members').delete().in('team_id', teams.map((t) => t.id)), 'members 삭제');
    const groups = splitEvenly(snap.participants.map((p) => p.id), teams.length);
    const rows = groups.flatMap((g, ti) => g.map((pid, i) => ({ participant_id: pid, team_id: teams[ti].id, sort: i })));
    if (rows.length) must(await db().from('team_members').insert(rows), 'members 생성');
  } else if (a.type === 'hum_rebuild') {
    if (snap.scores.length) return fail('점수 기록이 있어 팀을 다시 만들 수 없습니다 (리셋 필요)');
    must(await db().from('teams').delete().eq('event_id', eventId), 'teams 삭제');
    must(await db().from('hum_songs').delete().eq('event_id', eventId), 'songs 삭제');
    must(await db().from('amen_matches').delete().eq('event_id', eventId), 'matches 삭제');
    must(await db().from('program_steps').update({ state: {} }).eq('id', step.id), 'state 초기화');
    const fresh = await loadSnapshot(eventId);
    await onEnter(eventId, stepOf(fresh, 'hum_team'));
  }
}

// ───────────── 디스패처 ─────────────

export async function runAdminAction(eventId: string, a: A): Promise<string | void> {
  const snap = await loadSnapshot(eventId);
  const type = String(a.type ?? '');
  const sorted = [...snap.steps].sort((x, y) => x.sort - y.sort);
  const cur = snap.steps.find((s) => s.id === snap.event.current_step_id);

  if (type.startsWith('amen_')) return amenAction(eventId, snap, a);
  if (type.startsWith('ov_')) return oneVoiceAction(eventId, snap, a);
  if (type.startsWith('sheep_')) return sheepAction(eventId, snap, a);
  if (type.startsWith('hum_')) return humAction(eventId, snap, a);
  if (type === 'activity_start') {
    const st = snap.steps.find((x) => x.id === a.stepId) ?? fail('스텝을 찾을 수 없습니다');
    return patchStep(st, { state: { started: !!a.value } });
  }
  if (type === 'awards_reveal') {
    const st = stepOf(snap, 'awards');
    const n = Math.max(0, Math.min(snap.teams.length + 1, int(a.value, '단계')));
    return patchStep(st, { state: { reveal: n } });
  }

  switch (type) {
    case 'step_goto':
      return gotoStep(eventId, snap, str(a.stepId, '스텝'));
    case 'step_next': {
      const i = sorted.findIndex((s) => s.id === cur?.id);
      const next = sorted[i + 1];
      if (!next) return fail('마지막 스텝입니다');
      return gotoStep(eventId, snap, next.id);
    }
    case 'step_prev': {
      const i = sorted.findIndex((s) => s.id === cur?.id);
      const prev = sorted[i - 1];
      if (!prev) return fail('첫 스텝입니다');
      return gotoStep(eventId, snap, prev.id);
    }
    case 'step_config': {
      const s = snap.steps.find((x) => x.id === a.stepId) ?? fail('스텝을 찾을 수 없습니다');
      if (typeof a.config !== 'object' || !a.config) return fail('config가 올바르지 않습니다');
      return patchStep(s, { config: a.config, title: a.title ? str(a.title, '제목', 60) : undefined });
    }
    case 'step_add': {
      const kind = a.kind as StepKind;
      if (!STEP_KINDS.some((k) => k.kind === kind)) return fail('알 수 없는 스텝 종류');
      const title = str(a.title ?? STEP_KINDS.find((k) => k.kind === kind)!.label, '제목', 60);
      const sort = (sorted.at(-1)?.sort ?? 0) + 1;
      must(await db().from('program_steps').insert({ event_id: eventId, sort, kind, title }), 'step 추가');
      return;
    }
    case 'step_delete': {
      if (a.stepId === cur?.id) return fail('현재 진행 중인 스텝은 삭제할 수 없습니다');
      must(await db().from('program_steps').delete().eq('id', str(a.stepId, '스텝')), 'step 삭제');
      return;
    }
    case 'step_move': {
      const i = sorted.findIndex((s) => s.id === a.stepId);
      const j = i + (a.dir === 'up' ? -1 : 1);
      if (i < 0 || j < 0 || j >= sorted.length) return;
      const [x, y] = [sorted[i], sorted[j]];
      must(await db().from('program_steps').update({ sort: y.sort }).eq('id', x.id), 'move');
      must(await db().from('program_steps').update({ sort: x.sort }).eq('id', y.id), 'move');
      return;
    }

    case 'participant_add': {
      const name = str(a.name, '이름', 20);
      await addParticipant(eventId, snap, name);
      return;
    }
    case 'participant_rename': {
      must(await db().from('participants').update({ name: str(a.name, '이름', 20) }).eq('id', str(a.participantId, '참가자')), 'rename');
      return;
    }
    case 'participant_delete': {
      must(await db().from('participants').delete().eq('id', str(a.participantId, '참가자')), 'delete');
      return;
    }
    case 'team_rename': {
      const team = snap.teams.find((t) => t.id === a.teamId) ?? fail('팀을 찾을 수 없습니다');
      const name = str(a.name, '팀명', 12);
      if (snap.teams.some((t) => t.id !== team.id && t.name === name)) return fail('이미 있는 팀명입니다');
      must(await db().from('teams').update({ name, name_locked: !!a.lock }).eq('id', team.id), 'team rename');
      return;
    }
    case 'team_unlock': {
      must(await db().from('teams').update({ name_locked: false }).eq('id', str(a.teamId, '팀')), 'team unlock');
      return;
    }
    case 'team_assign': {
      const pid = str(a.participantId, '참가자');
      must(await db().from('team_members').delete().eq('participant_id', pid), 'unassign');
      if (a.teamId) {
        const n = snap.members.filter((m) => m.team_id === a.teamId).length;
        must(await db().from('team_members').insert({ participant_id: pid, team_id: a.teamId, sort: n }), 'assign');
      }
      return;
    }
    case 'bots_add': {
      const n = Math.min(Math.max(int(a.n ?? 15, '인원'), 1), 30);
      const have = new Set(snap.participants.map((p) => p.name));
      let added = 0;
      let cur2 = snap;
      for (let i = 1; added < n && i < 200; i++) {
        const name = `봇${i}`;
        if (have.has(name)) continue;
        await addParticipant(eventId, cur2, name);
        cur2 = await loadSnapshot(eventId);
        have.add(name);
        added++;
      }
      return `봇 ${added}명 추가`;
    }

    case 'game_finalize': {
      const st = snap.steps.find((x) => x.id === a.stepId) ?? fail('스텝을 찾을 수 없습니다');
      if (!(GAME_KINDS as readonly string[]).includes(st.kind)) return fail('점수를 매기는 게임이 아닙니다');
      let winners: string[];
      if (Array.isArray(a.winners)) {
        winners = a.winners.filter((id: string) => snap.teams.some((t) => t.id === id));
      } else {
        // 자동 판정: 게임 내 득점이 가장 높은 팀(동점이면 모두)
        const pts = new Map<string, number>(snap.teams.map((t) => [t.id, 0]));
        for (const e of snap.scores) if (e.step_id === st.id && !e.meta?.win) pts.set(e.team_id, (pts.get(e.team_id) ?? 0) + e.delta);
        const max = Math.max(0, ...pts.values());
        winners = max > 0 ? [...pts].filter(([, v]) => v === max).map(([k]) => k) : [];
        if (!winners.length) return fail('게임 득점이 없어 자동 판정할 수 없습니다. 승리 팀을 직접 선택하세요');
      }
      if (!winners.length) return fail('승리 팀을 선택하세요');
      const winPoints = a.winPoints != null ? int(a.winPoints, '승리 점수') : Number(st.config.winPoints ?? DEFAULT_WIN_POINTS[st.kind] ?? 0);
      await revokeWins(eventId, snap, st);
      for (const w of winners) await addScore(eventId, w, st.id, winPoints, `${st.title} 승리`, { win: true });
      await patchStep(st, { config: { winPoints }, state: { finalized: true, winners } });
      return;
    }
    case 'game_unfinalize': {
      const st = snap.steps.find((x) => x.id === a.stepId) ?? fail('스텝을 찾을 수 없습니다');
      await revokeWins(eventId, snap, st);
      await patchStep(st, { state: { finalized: false, winners: [] } });
      return;
    }

    case 'reset_all': {
      if (a.confirm !== 'RESET') return fail('확인 문구가 올바르지 않습니다');
      must(await db().from('events').delete().eq('id', eventId), '이벤트 삭제');
      const ev = must(await db().from('events').insert({}).select('*').single(), '이벤트 생성') as { id: string };
      await seedSteps(ev.id);
      return '초기화 완료';
    }
    default:
      return fail(`알 수 없는 동작: ${type}`);
  }
}

/** 참가자 추가. 팀이 이미 짜여 있으면 가장 인원이 적은 팀에 넣는다. */
export async function addParticipant(eventId: string, snap: Snapshot, name: string): Promise<string> {
  const p = must(await db().from('participants').insert({ event_id: eventId, name }).select('id').single(), '참가자 추가') as { id: string };
  if (snap.teams.length) {
    const sizes = snap.teams.map((t) => snap.members.filter((m) => m.team_id === t.id).length);
    const team = snap.teams[smallestGroup(sizes)];
    must(await db().from('team_members').insert({ participant_id: p.id, team_id: team.id, sort: sizes[smallestGroup(sizes)] }), '팀 배정');
  }
  return p.id;
}
