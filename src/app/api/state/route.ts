import { NextResponse } from 'next/server';
import { ensureEvent, currentRevision, loadSnapshot } from '@/lib/server/repo';
import { buildState } from '@/lib/server/state';
import { getParticipantId, isAdmin } from '@/lib/server/auth';
import type { Role } from '@/lib/types';


export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const view = (url.searchParams.get('view') ?? 'player') as Role;
    if (!['player', 'stage', 'admin'].includes(view)) return NextResponse.json({ error: 'bad view' }, { status: 400 });
    if (view === 'admin' && !(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const ev = await ensureEvent();
    const known = Number(url.searchParams.get('rev') ?? -1);
    const rev = await currentRevision(ev.id);
    // 변화가 없으면 가볍게 응답 (시계 보정용 now만 포함)
    if (known === rev) return NextResponse.json({ unchanged: true, rev, now: Date.now() }, { headers: { 'Cache-Control': 'no-store' } });

    const snap = await loadSnapshot(ev.id);
    const pid = view === 'player' ? await getParticipantId() : null;
    return NextResponse.json(buildState(snap, view, pid), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('[state]', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'error' }, { status: 500 });
  }
}
