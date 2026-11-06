import { NextResponse } from 'next/server';
import { checkAdminPassword, setAdminCookie } from '@/lib/server/auth';

export async function POST(req: Request) {
  try {
    const { password } = await req.json().catch(() => ({ password: '' }));
    if (!checkAdminPassword(String(password ?? ''))) return NextResponse.json({ error: '비밀번호가 다릅니다' }, { status: 401 });
    await setAdminCookie();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[admin/login]', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'error' }, { status: 500 });
  }
}
