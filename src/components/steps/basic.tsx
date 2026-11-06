'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Scoreboard, TeamTag, teamOf, type AdminProps, type StepProps } from '../ui';

export function EntryPlayer({ state }: StepProps) {
  return (
    <div className="space-y-2 text-center">
      <p className="text-xl font-bold">입장 완료! 🙌</p>
      <p className="text-neutral-600">잠시 후 시작해요. 이 화면을 켜 두세요.</p>
      <p className="text-sm text-neutral-500">지금 {state.participants.length}명 입장</p>
    </div>
  );
}

/** 현재 접속 주소(origin)의 입장 페이지 QR. 클라이언트에서 생성해 배포 도메인이 바뀌어도 맞는다. */
function JoinQr() {
  const [src, setSrc] = useState('');
  const [url, setUrl] = useState('');
  useEffect(() => {
    const u = `${window.location.origin}/`;
    QRCode.toDataURL(u, { margin: 2, width: 480 }).then((d) => { setSrc(d); setUrl(u); }).catch(() => setUrl(u));
  }, []);
  return (
    <div className="flex flex-col items-center gap-3">
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="입장 QR" className="h-80 w-80 rounded-2xl bg-white p-2 shadow-lg" />
      )}
      <p className="text-2xl text-neutral-500">{url.replace(/^https?:\/\//, '')}</p>
    </div>
  );
}

export function EntryStage({ state }: StepProps) {
  return (
    <div className="space-y-8 text-center">
      <h2 className="text-6xl font-black">QR로 입장하세요</h2>
      <JoinQr />
      <p className="text-4xl text-neutral-500">이름만 입력하면 끝!</p>
      <p className="text-5xl font-bold">{state.participants.length}명 입장</p>
      <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-3">
        {state.participants.map((p) => (
          <span key={p.id} className="rounded-full bg-neutral-200 px-5 py-2 text-3xl font-semibold dark:bg-neutral-800">{p.name}</span>
        ))}
      </div>
    </div>
  );
}

export function ClosePlayer() {
  return <p className="text-center text-xl font-bold">곧 시작합니다 🎶<br /><span className="text-base font-normal text-neutral-500">화면을 켜 두세요</span></p>;
}

export function CloseStage({ state }: StepProps) {
  return (
    <div className="space-y-6 text-center">
      <h2 className="text-6xl font-black">1부 명단 마감</h2>
      <p className="text-5xl">{state.participants.length}명이 함께합니다</p>
      <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-3">
        {state.participants.map((p) => (
          <span key={p.id} className="rounded-full bg-neutral-200 px-5 py-2 text-3xl font-semibold dark:bg-neutral-800">{p.name}</span>
        ))}
      </div>
    </div>
  );
}

export function ResultPlayer({ state }: StepProps) {
  const myTeam = teamOf(state, state.me?.teamId);
  const idx = state.teams.findIndex((t) => t.id === myTeam?.id);
  return (
    <div className="space-y-4 text-center">
      <p className="text-xl font-bold">1부 결과</p>
      {myTeam && <p className="text-3xl font-black">{idx + 1}위 · <TeamTag team={myTeam} /> {myTeam.total}점</p>}
      <Scoreboard teams={state.teams} />
    </div>
  );
}

export function ResultStage({ state }: StepProps) {
  return (
    <div className="space-y-10">
      <h2 className="text-center text-6xl font-black">🏆 1부 결과</h2>
      <div className="mx-auto max-w-4xl space-y-4">
        {state.teams.map((t, i) => (
          <div key={t.id} className="flex items-center justify-between rounded-3xl px-10 py-6 text-white shadow-lg" style={{ background: t.color, opacity: i === 0 ? 1 : 0.9 }}>
            <span className="text-6xl font-black">{i + 1}위</span>
            <span className="text-5xl font-bold">{t.name}</span>
            <span className="text-7xl font-black tabular-nums">{t.total}점</span>
          </div>
        ))}
      </div>
      <p className="text-center text-3xl text-neutral-500">동점이면 성공한 칭찬 수가 앞섭니다</p>
    </div>
  );
}

export function PlainAdmin({ state }: AdminProps) {
  return <p className="text-sm text-neutral-500">{state.step?.title} 단계입니다. 별도 설정이 없습니다. 점수는 아래 수동 입력을 사용하세요.</p>;
}
