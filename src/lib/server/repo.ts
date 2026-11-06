import { db, must } from './supabase';
import { DEFAULT_STEPS } from './defaults';
import type { EventRow, Snapshot, StepRow } from '../types';

/** 이 앱은 워크샵 1회용이라 이벤트는 하나만 쓴다. 없으면 만들고 기본 스텝을 심는다. */
export async function ensureEvent(): Promise<EventRow> {
  const found = must(await db().from('events').select('*').order('created_at').limit(1), 'events 조회');
  if (found && found.length) return found[0] as EventRow;
  const ev = must(await db().from('events').insert({}).select('*').single(), 'events 생성') as EventRow;
  await seedSteps(ev.id);
  return ev;
}

export async function seedSteps(eventId: string) {
  const rows = DEFAULT_STEPS.map((s, i) => ({ event_id: eventId, sort: i + 1, kind: s.kind, title: s.title, config: s.config, state: s.state ?? {} }));
  const created = must(await db().from('program_steps').insert(rows).select('id,sort'), '기본 스텝 생성') as { id: string; sort: number }[];
  const first = created.sort((a, b) => a.sort - b.sort)[0];
  must(await db().from('program_steps').update({ status: 'active' }).eq('id', first.id), '첫 스텝 활성화');
  must(await db().from('events').update({ current_step_id: first.id }).eq('id', eventId), '현재 스텝 설정');
}

export async function loadSnapshot(eventId: string): Promise<Snapshot> {
  const q = (t: string) => db().from(t).select('*').eq('event_id', eventId);
  const [ev, steps, participants, teams, scores, songs, matches] = await Promise.all([
    db().from('events').select('*').eq('id', eventId).single(),
    q('program_steps').order('sort'),
    q('participants').order('created_at'),
    q('teams').order('sort'),
    q('score_events').order('created_at'),
    q('hum_songs').order('sort'),
    q('amen_matches').order('sort'),
  ]);
  const teamIds = must(teams, 'teams').map((t: any) => t.id as string);
  const matchIds = must(matches, 'amen_matches').map((m: any) => m.id as string);
  const [members, traits] = await Promise.all([
    teamIds.length ? db().from('team_members').select('*').in('team_id', teamIds).order('sort') : Promise.resolve({ data: [], error: null }),
    matchIds.length ? db().from('amen_traits').select('*').in('match_id', matchIds).order('created_at') : Promise.resolve({ data: [], error: null }),
  ]);
  return {
    event: must(ev, 'event') as EventRow,
    steps: must(steps, 'steps') as StepRow[],
    participants: must(participants, 'participants'),
    teams: must(teams, 'teams'),
    members: must(members as any, 'team_members'),
    scores: must(scores, 'score_events'),
    songs: must(songs, 'hum_songs'),
    matches: must(matches, 'amen_matches'),
    traits: must(traits as any, 'amen_traits'),
  } as Snapshot;
}

export async function bumpRevision(eventId: string): Promise<number> {
  const res = await db().rpc('bump_revision', { eid: eventId });
  return must(res as any, 'bump_revision') as number;
}

export async function currentRevision(eventId: string): Promise<number> {
  const r = must(await db().from('events').select('revision').eq('id', eventId).single(), 'revision') as { revision: number };
  return Number(r.revision);
}
