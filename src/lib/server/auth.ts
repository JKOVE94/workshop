import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const ME = 'ws_me';
const ADMIN = 'ws_admin';
const MAX_AGE = 60 * 60 * 24 * 3;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET 환경변수가 필요합니다');
  return s;
}
function sign(v: string): string {
  return createHmac('sha256', secret()).update(v).digest('base64url');
}
function safeEq(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function setParticipantCookie(participantId: string) {
  const jar = await cookies();
  jar.set(ME, `${participantId}.${sign(`p:${participantId}`)}`, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: MAX_AGE });
}

export async function getParticipantId(): Promise<string | null> {
  const raw = (await cookies()).get(ME)?.value;
  if (!raw) return null;
  const [id, sig] = raw.split('.');
  if (!id || !sig || !safeEq(sig, sign(`p:${id}`))) return null;
  return id;
}

export async function clearParticipantCookie() {
  (await cookies()).delete(ME);
}

export function checkAdminPassword(pw: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error('ADMIN_PASSWORD 환경변수가 필요합니다');
  return safeEq(pw, expected);
}

export async function setAdminCookie() {
  (await cookies()).set(ADMIN, sign('admin'), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: MAX_AGE });
}

export async function isAdmin(): Promise<boolean> {
  const v = (await cookies()).get(ADMIN)?.value;
  return !!v && safeEq(v, sign('admin'));
}
