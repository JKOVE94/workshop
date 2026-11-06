import { NextResponse } from 'next/server';
import { db, must } from '@/lib/server/supabase';
import { ensureEvent, bumpRevision } from '@/lib/server/repo';
import { getParticipantId } from '@/lib/server/auth';

/** 팀 대표가 팀명을 정하고 확정한다. 확정하면 더 못 바꾼다(관리자만 해제). */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? '').trim().replace(/\s+/g, ' ');
    if (!name || name.length > 12) return NextResponse.json({ error: '팀명은 1~12자로 입력하세요' }, { status: 400 });
    const pid = await getParticipantId();
    if (!pid) return NextResponse.json({ error: 'login' }, { status: 401 });
    const ev = await ensureEvent();

    const { data: mem } = await db().from('team_members').select('team_id').eq('participant_id', pid).maybeSingle();
    if (!mem) return NextResponse.json({ error: '아직 팀이 없습니다' }, { status: 400 });
    const { data: team } = await db().from('teams').select('*').eq('id', mem.team_id).eq('event_id', ev.id).maybeSingle();
    if (!team) return NextResponse.json({ error: '팀을 찾을 수 없습니다' }, { status: 404 });
    if (team.name_locked) return NextResponse.json({ error: '이미 팀명이 확정되었어요' }, { status: 409 });
    const { data: others } = await db().from('teams').select('id,name').eq('event_id', ev.id).neq('id', team.id);
    if ((others ?? []).some((t) => t.name === name)) return NextResponse.json({ error: '다른 팀이 쓰는 이름이에요' }, { status: 409 });

    // 두 명이 동시에 확정해도 한 번만 반영되도록 name_locked=false 조건으로 선점
    const done = must(await db().from('teams').update({ name, name_locked: true }).eq('id', team.id).eq('name_locked', false).select('id'), 'team name') as { id: string }[];
    if (!done.length) return NextResponse.json({ error: '이미 팀명이 확정되었어요' }, { status: 409 });
    await bumpRevision(ev.id);
    return NextResponse.json({ ok: true, name });
  } catch (e) {
    console.error('[team-name]', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'error' }, { status: 500 });
  }
}
