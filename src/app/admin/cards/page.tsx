import { Suspense } from 'react';
import { headers } from 'next/headers';
import QRCode from 'qrcode';
import { isAdmin } from '@/lib/server/auth';
import { ensureEvent, loadSnapshot } from '@/lib/server/repo';
import { PrintButton } from './PrintButton';


/** 인쇄용 카드 시트(A4 그리드). 앞면 단어 / 뒷면 QR 두 장을 나란히 두고 접어 붙이는 방식. */
async function Cards() {
  if (!(await isAdmin())) return <main className="p-8">관리자 로그인이 필요합니다. <a className="underline" href="/admin">/admin</a></main>;
  const ev = await ensureEvent();
  const snap = await loadSnapshot(ev.id);
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https');
  const base = `${proto}://${host}`;
  const cards = await Promise.all(
    snap.cards.map(async (c) => ({ ...c, qr: await QRCode.toDataURL(`${base}/s/${c.qr_token}`, { margin: 1, width: 240 }) })),
  );
  return (
    <main className="p-4">
      <style>{`@media print { .no-print { display: none !important } body { background: #fff !important; color: #000 !important } @page { size: A4; margin: 8mm } }`}</style>
      <div className="no-print mb-4 flex items-center gap-3">
        <h1 className="text-xl font-black">단어 카드 시트 ({cards.length}장)</h1>
        <PrintButton />
        <span className="text-sm text-neutral-500">각 줄: 왼쪽 = 앞면(단어), 오른쪽 = 뒷면(QR). 함정 카드는 점선 테두리. QR 주소: {base}</span>
      </div>
      {cards.length === 0 && <p>카드가 없습니다. /admin 의 &lsquo;내 양은 내 음성을 들으며&rsquo; 스텝에서 먼저 만드세요.</p>}
      <div className="grid grid-cols-2 gap-x-2 gap-y-2" style={{ color: '#000' }}>
        {cards.map((c) => (
          <div key={c.id} className="contents">
            <div className="flex h-[36mm] items-center justify-center border-2 border-black text-center text-[11mm] font-black" style={{ borderStyle: c.is_trap ? 'dashed' : 'solid', background: '#fff' }}>{c.word}</div>
            <div className="flex h-[36mm] items-center justify-center border-2 border-black" style={{ borderStyle: c.is_trap ? 'dashed' : 'solid', background: '#fff' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.qr} alt="" className="h-[30mm] w-[30mm]" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export default function CardsPage() {
  return (
    <Suspense fallback={<main className="p-8 text-neutral-500">불러오는 중…</main>}>
      <Cards />
    </Suspense>
  );
}
