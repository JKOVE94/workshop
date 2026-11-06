import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/server/auth';
import { ensureEvent, bumpRevision } from '@/lib/server/repo';
import { runAdminAction, ActionError } from '@/lib/server/actions';

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const ev = await ensureEvent();
    const message = await runAdminAction(ev.id, body);
    // reset_all은 새 이벤트를 만들므로 새 이벤트의 revision을 올린다
    const cur = body.type === 'reset_all' ? await ensureEvent() : ev;
    await bumpRevision(cur.id);
    return NextResponse.json({ ok: true, message });
  } catch (e) {
    if (e instanceof ActionError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error('[admin/action]', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'error' }, { status: 500 });
  }
}
