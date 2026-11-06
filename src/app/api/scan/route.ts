import { NextResponse } from 'next/server';
import { db, must } from '@/lib/server/supabase';
import { ensureEvent, bumpRevision } from '@/lib/server/repo';
import { getParticipantId } from '@/lib/server/auth';

/** QR 스캔 → 정답/오답 처리. 같은 카드는 라운드당 한 번만 인정한다. */
export async function POST(req: Request) {
  try {
    const { token } = await req.json().catch(() => ({ token: '' }));
    const pid = await getParticipantId();
    if (!pid) return NextResponse.json({ error: 'login' }, { status: 401 });
    const ev = await ensureEvent();

    const { data: me } = await db().from('participants').select('id,name').eq('id', pid).eq('event_id', ev.id).maybeSingle();
    if (!me) return NextResponse.json({ error: 'login' }, { status: 401 });
    const { data: mem } = await db().from('team_members').select('team_id').eq('participant_id', pid).maybeSingle();
    if (!mem) return NextResponse.json({ error: '아직 팀이 없습니다' }, { status: 400 });

    const { data: evRow } = await db().from('events').select('current_step_id').eq('id', ev.id).single();
    const { data: step } = await db().from('program_steps').select('*').eq('id', evRow?.current_step_id ?? '').maybeSingle();
    if (!step || step.kind !== 'sheep_voice') return NextResponse.json({ error: '지금은 카드를 스캔하는 순서가 아닙니다' }, { status: 400 });

    const { data: card } = await db().from('word_cards').select('*').eq('qr_token', String(token)).eq('event_id', ev.id).maybeSingle();
    if (!card) return NextResponse.json({ error: '알 수 없는 카드입니다' }, { status: 404 });

    const round = Number(step.state?.round ?? 0);
    const ok = !card.is_trap;
    const ins = await db().from('card_scans').insert({ card_id: card.id, team_id: mem.team_id, step_id: step.id, round, ok });
    if (ins.error) {
      if (ins.error.code === '23505') return NextResponse.json({ duplicate: true, word: card.word });
      throw new Error(ins.error.message);
    }
    const pts = Number(ok ? step.config?.correct ?? 1 : step.config?.wrong ?? -1);
    if (pts) {
      must(await db().from('score_events').insert({ event_id: ev.id, team_id: mem.team_id, step_id: step.id, delta: pts, reason: `카드 ${ok ? '정답' : '오답'}: ${card.word}`, meta: { cardId: card.id, round } }), 'score');
    }
    await bumpRevision(ev.id);
    return NextResponse.json({ ok, word: card.word, delta: pts });
  } catch (e) {
    console.error('[scan]', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'error' }, { status: 500 });
  }
}
