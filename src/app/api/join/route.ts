import { NextResponse } from 'next/server';
import { db } from '@/lib/server/supabase';
import { ensureEvent, bumpRevision, loadSnapshot } from '@/lib/server/repo';
import { addParticipant } from '@/lib/server/actions';
import { setParticipantCookie } from '@/lib/server/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? '').trim().slice(0, 20);
    if (!name) return NextResponse.json({ error: '이름을 입력하세요' }, { status: 400 });
    const ev = await ensureEvent();

    const { data: found } = await db().from('participants').select('id').eq('event_id', ev.id).eq('name', name).maybeSingle();
    if (found) {
      // 같은 이름이 이미 있으면 본인 확인(resume) 후에만 재연결한다
      if (!body.resume) return NextResponse.json({ exists: true }, { status: 409 });
      await setParticipantCookie(found.id);
      return NextResponse.json({ ok: true, resumed: true });
    }
    const snap = await loadSnapshot(ev.id);
    const id = await addParticipant(ev.id, snap, name);
    await bumpRevision(ev.id);
    await setParticipantCookie(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[join]', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'error' }, { status: 500 });
  }
}
